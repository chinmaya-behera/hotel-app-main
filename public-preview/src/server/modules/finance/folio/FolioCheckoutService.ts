import { z } from 'zod';
import { QrAuthService } from '../../guest/QrAuthService.ts';
import { getGuestStayRepository } from '../../guest/repositories/GuestStayRepository.ts';
import { getFinancialDisputeRepository } from '../disputes/FinancialDisputeRepository.ts';
import { MockPmsConnectorAdapter } from '../../integrations/pms/MockPmsConnectorAdapter.ts';
import { getPmsReconciliationRepository } from '../../integrations/pms/PmsReconciliationRepository.ts';
import type {
  GuestFolioRecord,
  FolioLineItemRecord,
  FolioPaymentRecord,
  ItemizedFolioResponse,
  CheckoutSummary,
  CheckoutReceipt,
  IPaymentProviderAdapter,
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from './FolioContracts.ts';
import {
  type IFolioRepository,
  getFolioRepository,
} from './FolioRepository.ts';
import { MockPaymentProviderAdapter } from './MockPaymentProviderAdapter.ts';

export const CreatePaymentOrderSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero.'),
  method: z.enum(['card', 'upi', 'netbanking'], {
    errorMap: () => ({ message: 'Payment method must be card, upi, or netbanking.' }),
  }),
  idempotencyKey: z.string().trim().optional(),
});

export const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'orderId is required.').trim(),
  paymentRef: z.string().min(1, 'paymentRef is required.').trim(),
  providerPaymentId: z.string().trim().optional(),
  signature: z.string().trim().optional(),
});

export const CompleteCheckoutSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * Folio Settlement and Express Checkout Service (DEV3-TASK-20 / F34, F35)
 * Orchestrates authoritative guest folio queries, gateway settlement, checkout, room turnover, and session revocation.
 */
export class FolioCheckoutService {
  private static instance: FolioCheckoutService;
  private folioRepo: IFolioRepository;
  private authService: QrAuthService;
  private paymentAdapter: IPaymentProviderAdapter;
  private pmsAdapter: MockPmsConnectorAdapter;
  // In-memory receipts store: receiptId -> CheckoutReceipt
  private receipts = new Map<string, CheckoutReceipt>();

  constructor(
    folioRepo?: IFolioRepository,
    authService?: QrAuthService,
    paymentAdapter?: IPaymentProviderAdapter,
    pmsAdapter?: MockPmsConnectorAdapter
  ) {
    this.folioRepo = folioRepo || getFolioRepository();
    this.authService = authService || new QrAuthService();
    this.paymentAdapter = paymentAdapter || MockPaymentProviderAdapter.getInstance();
    this.pmsAdapter = pmsAdapter || MockPmsConnectorAdapter.getInstance();
  }

  public static getInstance(): FolioCheckoutService {
    if (!FolioCheckoutService.instance) {
      FolioCheckoutService.instance = new FolioCheckoutService();
    }
    return FolioCheckoutService.instance;
  }

  public setPaymentAdapter(adapter: IPaymentProviderAdapter): void {
    this.paymentAdapter = adapter;
  }

  public getPaymentAdapter(): IPaymentProviderAdapter {
    return this.paymentAdapter;
  }

  public reset(): void {
    this.receipts.clear();
  }

  /**
   * Helper: validates guest session and ensures active stay
   */
  private async authenticateSession(sessionToken?: string | null): Promise<{
    authenticated: boolean;
    session?: any;
    error?: string;
    statusCode: number;
  }> {
    if (!sessionToken) {
      return {
        authenticated: false,
        error: 'Authentication required. No guest session token provided.',
        statusCode: 401,
      };
    }

    const validation = QrAuthService.validateSession(sessionToken);
    if (!validation.valid || !validation.session) {
      return {
        authenticated: false,
        error: validation.reason || 'Invalid or expired guest session. Please re-authenticate.',
        statusCode: 401,
      };
    }

    return {
      authenticated: true,
      session: validation.session,
      statusCode: 200,
    };
  }

  /**
   * 1. Get Itemized Guest Folio
   * Retrieves authoritative folio, line items, payments, and disputes for the authenticated guest's stay.
   */
  public async getGuestFolio(sessionToken?: string | null): Promise<{
    success: boolean;
    data?: ItemizedFolioResponse;
    error?: string;
    statusCode: number;
  }> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.authenticated || !auth.session) {
      return { success: false, error: auth.error, statusCode: auth.statusCode };
    }

    const stayId = auth.session.stayId;
    const folio = await this.folioRepo.getFolioByStayId(stayId);
    if (!folio) {
      return {
        success: false,
        error: `No authoritative folio found for stay "${stayId}".`,
        statusCode: 404,
      };
    }

    const lineItems = await this.folioRepo.getLineItems(folio.id);
    const payments = await this.folioRepo.getPayments(folio.id);

    // Retrieve disputes linked to this stay
    const disputeRepo = getFinancialDisputeRepository();
    const disputesList = await disputeRepo.getDisputesForStay(stayId);
    const disputes = disputesList.map((d) => ({
      id: d.id,
      disputeRef: d.disputeRef,
      category: d.category,
      disputedAmount: d.disputedAmount,
      status: d.status,
      chargeRef: d.chargeRef,
    }));

    // Exact recalculation
    const totalCharges = lineItems.reduce((acc, item) => acc + item.amount, 0);
    const capturedPayments = payments.filter((p) => p.status === 'captured');
    const totalPayments = capturedPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalAdjustments = folio.totalAdjustments || 0;
    const outstandingBalance = Math.max(0, parseFloat((totalCharges - totalPayments - totalAdjustments).toFixed(2)));

    // Synchronize folio totals if drifted
    if (folio.outstandingBalance !== outstandingBalance || folio.totalCharges !== totalCharges || folio.totalPayments !== totalPayments) {
      folio.totalCharges = totalCharges;
      folio.totalPayments = totalPayments;
      folio.outstandingBalance = outstandingBalance;
      await this.folioRepo.updateFolio(folio.id, {
        totalCharges,
        totalPayments,
        outstandingBalance,
      });
    }

    return {
      success: true,
      data: {
        folio,
        lineItems,
        payments,
        disputes,
      },
      statusCode: 200,
    };
  }

  /**
   * 2. Get Checkout Summary & Eligibility
   */
  public async getCheckoutSummary(sessionToken?: string | null): Promise<{
    success: boolean;
    data?: CheckoutSummary;
    error?: string;
    statusCode: number;
  }> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.authenticated || !auth.session) {
      return { success: false, error: auth.error, statusCode: auth.statusCode };
    }

    const stayRepo = getGuestStayRepository();
    const stayDetails = await stayRepo.getStayWithRoomById(auth.session.stayId);
    if (!stayDetails || !stayDetails.stay) {
      return { success: false, error: 'Stay record not found.', statusCode: 404 };
    }
    const stay = stayDetails.stay;

    const folioResult = await this.getGuestFolio(sessionToken);
    if (!folioResult.success || !folioResult.data) {
      return { success: false, error: folioResult.error, statusCode: folioResult.statusCode };
    }

    const { folio, disputes } = folioResult.data;
    const isCheckedIn = stay.status === 'checked_in';
    const isBalanceZero = folio.outstandingBalance <= 0;
    const pendingDisputes = disputes.filter((d) => ['submitted', 'triage_pending', 'under_review', 'info_requested'].includes(d.status));

    let isEligibleForCheckout = true;
    let ineligibilityReason: string | undefined = undefined;

    if (!isCheckedIn) {
      isEligibleForCheckout = false;
      ineligibilityReason = `Stay is in status "${stay.status}". Only checked_in guests can perform express checkout.`;
    } else if (!isBalanceZero) {
      isEligibleForCheckout = false;
      ineligibilityReason = `Outstanding folio balance of ₹${folio.outstandingBalance.toFixed(2)} must be settled prior to express checkout.`;
    }

    const summary: CheckoutSummary = {
      stayId: stay.id,
      bookingReference: stay.bookingReference,
      roomNumber: auth.session.roomNumber,
      guestName: `${stay.guestFirstName} ${stay.guestLastName}`,
      stayStatus: stay.status,
      currency: folio.currency,
      totalCharges: folio.totalCharges,
      totalPayments: folio.totalPayments,
      totalAdjustments: folio.totalAdjustments,
      outstandingBalance: folio.outstandingBalance,
      isEligibleForCheckout,
      ineligibilityReason,
      pendingDisputesCount: pendingDisputes.length,
      disputes: disputes.map((d) => ({
        id: d.id,
        disputeRef: d.disputeRef,
        category: d.category,
        disputedAmount: d.disputedAmount,
        status: d.status,
      })),
    };

    return { success: true, data: summary, statusCode: 200 };
  }

  /**
   * 3. Create Settlement Payment Order
   */
  public async createSettlementPayment(
    sessionToken: string | null,
    input: { amount: number; method: 'card' | 'upi' | 'netbanking'; idempotencyKey?: string }
  ): Promise<{ success: boolean; data?: any; error?: string; statusCode: number }> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.authenticated || !auth.session) {
      return { success: false, error: auth.error, statusCode: auth.statusCode };
    }

    const parsed = CreatePaymentOrderSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid payment parameters.',
        statusCode: 400,
      };
    }

    const folio = await this.folioRepo.getFolioByStayId(auth.session.stayId);
    if (!folio) {
      return { success: false, error: 'Folio not found.', statusCode: 404 };
    }

    if (folio.outstandingBalance <= 0) {
      return {
        success: false,
        error: 'Folio has no outstanding balance to settle.',
        statusCode: 400,
      };
    }

    if (input.amount > folio.outstandingBalance) {
      return {
        success: false,
        error: `Payment amount (₹${input.amount.toFixed(2)}) cannot exceed outstanding balance (₹${folio.outstandingBalance.toFixed(2)}).`,
        statusCode: 400,
      };
    }

    if (!this.paymentAdapter.isAvailable()) {
      return {
        success: false,
        error: 'Payment provider is not configured. Live digital payment processing unavailable.',
        statusCode: 503,
      };
    }

    const orderResult = await this.paymentAdapter.createPaymentOrder({
      folioId: folio.id,
      stayId: auth.session.stayId,
      amount: input.amount,
      currency: folio.currency,
      method: input.method,
      idempotencyKey: input.idempotencyKey,
    });

    if (!orderResult.success || !orderResult.orderId) {
      return {
        success: false,
        error: orderResult.errorMessage || 'Failed to initialize payment gateway order.',
        statusCode: 502,
      };
    }

    return {
      success: true,
      data: orderResult,
      statusCode: 201,
    };
  }

  /**
   * 4. Verify Settlement Payment Result Server-Side
   */
  public async verifySettlementPayment(
    sessionToken: string | null,
    input: VerifyPaymentInput
  ): Promise<{ success: boolean; data?: any; error?: string; statusCode: number }> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.authenticated || !auth.session) {
      return { success: false, error: auth.error, statusCode: auth.statusCode };
    }

    const parsed = VerifyPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid verification payload.',
        statusCode: 400,
      };
    }

    const folio = await this.folioRepo.getFolioByStayId(auth.session.stayId);
    if (!folio) {
      return { success: false, error: 'Folio not found.', statusCode: 404 };
    }

    // Check duplicate payment ref
    const existingPayments = await this.folioRepo.getPayments(folio.id);
    const existing = existingPayments.find((p) => p.paymentRef === input.paymentRef);
    if (existing && existing.status === 'captured') {
      return {
        success: true,
        data: {
          folio,
          payment: existing,
          alreadyProcessed: true,
        },
        statusCode: 200,
      };
    }

    const verifyResult = await this.paymentAdapter.verifyPayment(input);
    if (!verifyResult.success || verifyResult.status !== 'captured') {
      return {
        success: false,
        error: verifyResult.errorMessage || 'Payment verification failed at gateway.',
        statusCode: 400,
      };
    }

    const nowIso = new Date().toISOString();
    const paymentAmount = verifyResult.amount && verifyResult.amount > 0 ? verifyResult.amount : folio.outstandingBalance;

    const newPayment: FolioPaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      folioId: folio.id,
      paymentRef: input.paymentRef,
      amount: parseFloat(paymentAmount.toFixed(2)),
      currency: folio.currency,
      method: 'card',
      status: 'captured',
      providerRef: verifyResult.providerPaymentId || null,
      idempotencyKey: input.orderId,
      capturedAt: nowIso,
      createdAt: nowIso,
    };

    await this.folioRepo.addPayment(newPayment);

    // Recalculate folio balance
    const updatedPayments = await this.folioRepo.getPayments(folio.id);
    const totalCaptured = updatedPayments
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + p.amount, 0);
    const updatedBalance = Math.max(0, parseFloat((folio.totalCharges - totalCaptured - folio.totalAdjustments).toFixed(2)));
    const newStatus = updatedBalance <= 0 ? 'SETTLED' : 'OPEN';

    const updatedFolio = await this.folioRepo.updateFolio(folio.id, {
      totalPayments: totalCaptured,
      outstandingBalance: updatedBalance,
      status: newStatus,
    });

    return {
      success: true,
      data: {
        folio: updatedFolio,
        payment: newPayment,
      },
      statusCode: 200,
    };
  }

  /**
   * 5. Complete Express Checkout
   * Validates zero balance, updates stay status to 'checked_out', updates room to 'dirty',
   * revokes active session and all room sessions, syncs PMS, and returns receipt.
   */
  public async completeExpressCheckout(
    sessionToken: string | null,
    input?: { notes?: string }
  ): Promise<{ success: boolean; data?: CheckoutReceipt; error?: string; statusCode: number }> {
    const auth = await this.authenticateSession(sessionToken);
    if (!auth.authenticated || !auth.session) {
      return { success: false, error: auth.error, statusCode: auth.statusCode };
    }

    const stayRepo = getGuestStayRepository();
    const stayDetails = await stayRepo.getStayWithRoomById(auth.session.stayId);
    if (!stayDetails || !stayDetails.stay) {
      return { success: false, error: 'Stay record not found.', statusCode: 404 };
    }
    const stay = stayDetails.stay;

    // 1. Stay status check
    if (stay.status !== 'checked_in') {
      return {
        success: false,
        error: `Cannot complete checkout. Stay is currently in status "${stay.status}".`,
        statusCode: 400,
      };
    }

    // 2. Folio balance check
    const folioResult = await this.getGuestFolio(sessionToken);
    if (!folioResult.success || !folioResult.data) {
      return { success: false, error: folioResult.error, statusCode: folioResult.statusCode };
    }

    const { folio, lineItems, payments } = folioResult.data;
    if (folio.outstandingBalance > 0) {
      return {
        success: false,
        error: `Express checkout rejected: Unpaid folio balance of ₹${folio.outstandingBalance.toFixed(2)} must be settled before checkout.`,
        statusCode: 400,
      };
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 3. Authoritative Stay Status Update
    await stayRepo.updateStayStatus(stay.id, 'checked_out', now);

    // 4. Housekeeping room turnover: mark assigned room as 'dirty'
    const assignments = await stayRepo.getRoomAssignmentsForStay(stay.id);
    const activeAssignment = assignments.find((a) => a.isCurrent) || assignments[0];
    if (activeAssignment?.roomId) {
      await stayRepo.updateRoomCleanliness(activeAssignment.roomId, 'dirty');
    }

    // 5. PMS Checkout Synchronization
    let pmsSyncStatus: 'SYNCED' | 'PENDING_RECONCILIATION' | 'FAILED' = 'SYNCED';
    let pmsExternalRef: string | undefined = undefined;

    try {
      const pmsPing = await this.pmsAdapter.ping();
      if (pmsPing.ok) {
        const pmsPush = await this.pmsAdapter.pushReservation({
          bookingReference: stay.bookingReference,
          guestFirstName: stay.guestFirstName,
          guestLastName: stay.guestLastName,
          guestEmail: stay.guestEmail || undefined,
          guestPhone: stay.guestPhone || undefined,
          roomNumber: auth.session.roomNumber,
          roomType: activeAssignment?.roomType || 'Standard',
          status: 'checked_out',
          checkInDate: stay.checkInTime ? new Date(stay.checkInTime).toISOString() : nowIso,
          checkOutDate: nowIso,
          idempotencyKey: `checkout_${stay.id}_${now.getTime()}`,
        });

        if (pmsPush.success) {
          pmsSyncStatus = 'SYNCED';
          pmsExternalRef = pmsPush.externalRef;
        } else {
          pmsSyncStatus = 'PENDING_RECONCILIATION';
        }
      } else {
        pmsSyncStatus = 'PENDING_RECONCILIATION';
      }
    } catch {
      pmsSyncStatus = 'PENDING_RECONCILIATION';
    }

    // If PMS sync deferred, register discrepancy in reconciliation repo
    if (pmsSyncStatus === 'PENDING_RECONCILIATION') {
      try {
        const recRepo = getPmsReconciliationRepository();
        await recRepo.saveDiscrepancy({
          id: `pms_chk_${Date.now()}`,
          discrepancyType: 'status_mismatch',
          internalRef: stay.bookingReference,
          externalRef: pmsExternalRef || null,
          propertyId: stay.propertyId,
          fieldOrConflict: 'status (checkout sync pending)',
          internalValue: { status: 'checked_out', checkOutTime: nowIso },
          externalValue: { status: 'checked_in_or_unknown' },
          suggestedResolution: 'adopt_pms',
          status: 'pending_review',
          auditHistory: [
            {
              timestamp: nowIso,
              action: 'CHECKOUT_PMS_SYNC_DEFERRED',
              actor: 'FolioCheckoutService',
              details: `Express checkout completed internally for stay ${stay.bookingReference}. PMS sync deferred.`,
            },
          ],
          detectedAt: nowIso,
        });
      } catch (recErr) {
        console.warn('[FolioCheckoutService] Could not log reconciliation record:', recErr);
      }
    }

    // 6. Generate digital checkout receipt
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receipt: CheckoutReceipt = {
      receiptId,
      stayId: stay.id,
      bookingReference: stay.bookingReference,
      roomNumber: auth.session.roomNumber,
      guestName: `${stay.guestFirstName} ${stay.guestLastName}`,
      checkedOutAt: nowIso,
      folioId: folio.id,
      currency: folio.currency,
      totalCharges: folio.totalCharges,
      totalPaid: folio.totalPayments,
      outstandingBalance: 0.00,
      pmsSyncStatus,
      pmsExternalRef,
      lineItems,
      payments,
    };

    this.receipts.set(receiptId, receipt);

    // 7. Revoke active guest session and all room sessions
    if (sessionToken) {
      QrAuthService.revokeSession(sessionToken, 'checkout');
    }
    QrAuthService.revokeAllSessionsForRoom(auth.session.roomNumber, 'checkout');

    return {
      success: true,
      data: receipt,
      statusCode: 200,
    };
  }

  /**
   * 6. Get Checkout Receipt by ID
   */
  public async getCheckoutReceipt(
    receiptId: string
  ): Promise<{ success: boolean; data?: CheckoutReceipt; error?: string; statusCode: number }> {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) {
      return {
        success: false,
        error: `Receipt "${receiptId}" not found.`,
        statusCode: 404,
      };
    }
    return {
      success: true,
      data: receipt,
      statusCode: 200,
    };
  }
}

export function getFolioCheckoutService(): FolioCheckoutService {
  return FolioCheckoutService.getInstance();
}
