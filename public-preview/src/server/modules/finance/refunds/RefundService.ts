import { z } from 'zod';
import type { StaffAuthUser } from '../../frontdesk/FrontDeskStayService.ts';
import type {
  RefundRequestRecord,
  CreateRefundRequestInput,
  GmApprovalDecisionInput,
  GmRejectionDecisionInput,
  IRefundProviderAdapter,
} from './RefundContracts.ts';
import {
  type IRefundRepository,
  getRefundRepository,
} from './RefundRepository.ts';
import { MockRefundProviderAdapter } from './MockRefundProviderAdapter.ts';

export const CreateRefundSchema = z.object({
  disputeId: z.string().trim().optional(),
  disputeRef: z.string().trim().optional(),
  stayId: z.string().min(1, 'stayId is required').trim(),
  folioId: z.string().min(1, 'folioId is required').trim(),
  chargeRef: z.string().trim().optional(),
  originalPaymentRef: z.string().min(1, 'originalPaymentRef is required').trim(),
  requestedAmount: z.number().positive('Refund amount must be greater than zero.'),
  currency: z.string().default('INR').optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters.').trim(),
  idempotencyKey: z.string().trim().optional(),
});

export const GmApproveSchema = z.object({
  approvedAmount: z.number().positive('Approved amount must be positive.').optional(),
  notes: z.string().trim().optional(),
});

export const GmRejectSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters.').trim(),
});

/**
 * Refund and GM Approval Service (DEV3-TASK-19 / F32, F33)
 * Orchestrates GM approvals, separation of duties, and payment gateway refund execution.
 */
export class RefundService {
  private static instance: RefundService;
  private repository: IRefundRepository;
  private providerAdapter: IRefundProviderAdapter;

  constructor(repository?: IRefundRepository, providerAdapter?: IRefundProviderAdapter) {
    this.repository = repository || getRefundRepository();
    this.providerAdapter = providerAdapter || MockRefundProviderAdapter.getInstance();
  }

  public static getInstance(): RefundService {
    if (!RefundService.instance) {
      RefundService.instance = new RefundService();
    }
    return RefundService.instance;
  }

  public setProviderAdapter(adapter: IRefundProviderAdapter): void {
    this.providerAdapter = adapter;
  }

  public getProviderAdapter(): IRefundProviderAdapter {
    return this.providerAdapter;
  }

  /**
   * 1. Create Refund Request
   * Initiated by Finance Officer or Front Desk on valid dispute / approved complaint.
   */
  public async createRefundRequest(
    input: CreateRefundRequestInput,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: RefundRequestRecord; error?: string; statusCode: number }> {
    const parsed = CreateRefundSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid refund request parameters.',
        statusCode: 400,
      };
    }

    // Check idempotency if key provided
    if (input.idempotencyKey) {
      const existing = await this.repository.getRefunds();
      const duplicate = existing.find((r) => r.idempotencyKey === input.idempotencyKey);
      if (duplicate) {
        return { success: true, data: duplicate, statusCode: 200 };
      }
    }

    const nowIso = new Date().toISOString();
    const id = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refundRef = `REF-${new Date().getFullYear()}-${randomSuffix}`;

    const newRecord: RefundRequestRecord = {
      id,
      refundRef,
      disputeId: input.disputeId || null,
      disputeRef: (input as any).disputeRef || null,
      stayId: input.stayId,
      folioId: input.folioId,
      chargeRef: input.chargeRef || null,
      originalPaymentRef: input.originalPaymentRef,
      requestedAmount: parseFloat(input.requestedAmount.toFixed(2)),
      approvedAmount: null,
      currency: input.currency || 'INR',
      reason: input.reason,
      requestedByStaffId: staffUser.staffId,
      requestedByStaffName: staffUser.name,
      requestedAt: nowIso,
      approvalStatus: 'PENDING_APPROVAL',
      approvedByStaffId: null,
      approvedByStaffName: null,
      approvedAt: null,
      rejectionReason: null,
      executionStatus: 'PENDING_EXECUTION',
      providerRef: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      idempotencyKey: input.idempotencyKey || null,
      auditHistory: [
        {
          timestamp: nowIso,
          action: 'REFUND_REQUEST_CREATED',
          actor: `${staffUser.name} (${staffUser.role})`,
          details: `Refund request created for ₹${input.requestedAmount.toFixed(2)}. Reason: ${input.reason}`,
          toStatus: 'PENDING_APPROVAL',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const created = await this.repository.createRefund(newRecord);
    return { success: true, data: created, statusCode: 201 };
  }

  /**
   * 2. List Refund Requests (Finance / Front Desk / GM)
   */
  public async getRefunds(filters?: {
    approvalStatus?: any;
    executionStatus?: any;
    stayId?: string;
    disputeId?: string;
  }): Promise<{ success: boolean; data: RefundRequestRecord[] }> {
    const list = await this.repository.getRefunds(filters);
    return { success: true, data: list };
  }

  /**
   * 3. Get Refund by ID
   */
  public async getRefundById(id: string): Promise<{ success: boolean; data?: RefundRequestRecord; error?: string; statusCode: number }> {
    const record = await this.repository.getRefundById(id);
    if (!record) {
      return { success: false, error: 'Refund request not found.', statusCode: 404 };
    }
    return { success: true, data: record, statusCode: 200 };
  }

  /**
   * 4. Get Pending GM Approvals Queue
   * Requires GM or Duty Manager or Admin authorization.
   */
  public async getPendingGmApprovals(
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: RefundRequestRecord[]; error?: string; statusCode: number }> {
    if (!['general_manager', 'duty_manager', 'admin'].includes(staffUser.role)) {
      return {
        success: false,
        error: 'Forbidden: GM refund approval queue requires General Manager or Duty Manager authorization.',
        statusCode: 403,
      };
    }

    const pending = await this.repository.getPendingGmApprovals();
    return { success: true, data: pending, statusCode: 200 };
  }

  /**
   * 5. GM Approve Refund
   * Enforces GM authorization and SEPARATION OF DUTIES (requester cannot approve own request).
   */
  public async approveRefund(
    refundId: string,
    input: GmApprovalDecisionInput,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: RefundRequestRecord; error?: string; statusCode: number }> {
    if (!['general_manager', 'duty_manager', 'admin'].includes(staffUser.role)) {
      return {
        success: false,
        error: 'Forbidden: Only the General Manager or authorized Duty Manager can approve financial refunds.',
        statusCode: 403,
      };
    }

    const refund = await this.repository.getRefundById(refundId);
    if (!refund) {
      return { success: false, error: 'Refund request not found.', statusCode: 404 };
    }

    // Separation of Duties Rule
    if (refund.requestedByStaffId === staffUser.staffId) {
      return {
        success: false,
        error: 'Separation of duties violation: Refund requester cannot approve their own refund request.',
        statusCode: 403,
      };
    }

    // Lifecycle check
    if (refund.approvalStatus !== 'PENDING_APPROVAL') {
      return {
        success: false,
        error: `Cannot approve refund in status "${refund.approvalStatus}". Only PENDING_APPROVAL requests can be approved.`,
        statusCode: 400,
      };
    }

    const parsed = GmApproveSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid approval parameters.',
        statusCode: 400,
      };
    }

    const requestedAmount = refund.requestedAmount;
    const approvedAmount = input.approvedAmount !== undefined ? input.approvedAmount : requestedAmount;

    if (approvedAmount > requestedAmount) {
      return {
        success: false,
        error: `Approved amount (₹${approvedAmount.toFixed(2)}) cannot exceed requested amount (₹${requestedAmount.toFixed(2)}).`,
        statusCode: 400,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedAudit = [
      ...refund.auditHistory,
      {
        timestamp: nowIso,
        action: 'GM_APPROVED',
        actor: `${staffUser.name} (${staffUser.role})`,
        details: input.notes || `GM approved refund for ₹${approvedAmount.toFixed(2)}.`,
        fromStatus: 'PENDING_APPROVAL',
        toStatus: 'APPROVED',
      },
    ];

    const updated = await this.repository.updateRefund(refundId, {
      approvalStatus: 'APPROVED',
      approvedAmount: parseFloat(approvedAmount.toFixed(2)),
      approvedByStaffId: staffUser.staffId,
      approvedByStaffName: staffUser.name,
      approvedAt: nowIso,
      auditHistory: updatedAudit,
    });

    return { success: true, data: updated || undefined, statusCode: 200 };
  }

  /**
   * 6. GM Reject Refund
   * Enforces GM authorization and requires rejection reason.
   */
  public async rejectRefund(
    refundId: string,
    input: GmRejectionDecisionInput,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: RefundRequestRecord; error?: string; statusCode: number }> {
    if (!['general_manager', 'duty_manager', 'admin'].includes(staffUser.role)) {
      return {
        success: false,
        error: 'Forbidden: Only the General Manager or authorized Duty Manager can reject financial refunds.',
        statusCode: 403,
      };
    }

    const refund = await this.repository.getRefundById(refundId);
    if (!refund) {
      return { success: false, error: 'Refund request not found.', statusCode: 404 };
    }

    if (refund.approvalStatus !== 'PENDING_APPROVAL') {
      return {
        success: false,
        error: `Cannot reject refund in status "${refund.approvalStatus}". Only PENDING_APPROVAL requests can be rejected.`,
        statusCode: 400,
      };
    }

    const parsed = GmRejectSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'A valid rejection reason must be provided.',
        statusCode: 400,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedAudit = [
      ...refund.auditHistory,
      {
        timestamp: nowIso,
        action: 'GM_REJECTED',
        actor: `${staffUser.name} (${staffUser.role})`,
        details: `GM rejected refund. Reason: ${input.rejectionReason}`,
        fromStatus: 'PENDING_APPROVAL',
        toStatus: 'REJECTED',
      },
    ];

    const updated = await this.repository.updateRefund(refundId, {
      approvalStatus: 'REJECTED',
      rejectionReason: input.rejectionReason,
      auditHistory: updatedAudit,
    });

    return { success: true, data: updated || undefined, statusCode: 200 };
  }

  /**
   * 7. Execute Refund Against Payment Gateway (Finance Officer / GM / Admin)
   * Executes the approved refund amount through the typed refund provider adapter.
   */
  public async executeRefund(
    refundId: string,
    staffUser: StaffAuthUser,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; data?: RefundRequestRecord; error?: string; statusCode: number }> {
    if (!['finance_officer', 'general_manager', 'duty_manager', 'admin'].includes(staffUser.role)) {
      return {
        success: false,
        error: 'Forbidden: Only Finance Officers or General Managers can execute financial refunds.',
        statusCode: 403,
      };
    }

    const refund = await this.repository.getRefundById(refundId);
    if (!refund) {
      return { success: false, error: 'Refund request not found.', statusCode: 404 };
    }

    // 1. Approval validation
    if (refund.approvalStatus === 'REJECTED') {
      return {
        success: false,
        error: 'Execution prohibited: This refund request was rejected by the General Manager.',
        statusCode: 400,
      };
    }

    if (refund.approvalStatus !== 'APPROVED') {
      return {
        success: false,
        error: `Execution prohibited: Refund status is "${refund.approvalStatus}". It must be APPROVED by the GM before execution.`,
        statusCode: 400,
      };
    }

    // 2. Execution status check (idempotency)
    if (refund.executionStatus === 'SUCCEEDED') {
      return {
        success: true,
        data: refund,
        statusCode: 200,
      };
    }

    // 3. Provider availability check
    if (!this.providerAdapter.isAvailable()) {
      return {
        success: false,
        error: `Live refund provider (${this.providerAdapter.getProviderName()}) is unavailable. Live credentials required for production gateway settlement.`,
        statusCode: 503,
      };
    }

    const approvedAmount = refund.approvedAmount || refund.requestedAmount;
    const execIdempotencyKey = idempotencyKey || refund.idempotencyKey || `exec_${refund.id}`;

    // Mark status EXECUTING
    await this.repository.updateRefund(refundId, {
      executionStatus: 'EXECUTING',
    });

    const executionResult = await this.providerAdapter.executeRefund({
      refundRef: refund.refundRef,
      paymentRef: refund.originalPaymentRef,
      amount: approvedAmount,
      currency: refund.currency,
      idempotencyKey: execIdempotencyKey,
      reason: refund.reason,
    });

    const nowIso = new Date().toISOString();

    if (executionResult.success && executionResult.status === 'SUCCEEDED') {
      const updatedAudit = [
        ...refund.auditHistory,
        {
          timestamp: nowIso,
          action: 'REFUND_EXECUTED_SUCCESS',
          actor: `${staffUser.name} (${staffUser.role})`,
          details: `Gateway refund executed successfully. ProviderRef: ${executionResult.providerRef}, Amount: ₹${approvedAmount.toFixed(2)}`,
          fromStatus: 'PENDING_EXECUTION',
          toStatus: 'SUCCEEDED',
        },
      ];

      const updated = await this.repository.updateRefund(refundId, {
        executionStatus: 'SUCCEEDED',
        providerRef: executionResult.providerRef || null,
        providerErrorCode: null,
        providerErrorMessage: null,
        auditHistory: updatedAudit,
      });

      return { success: true, data: updated || undefined, statusCode: 200 };
    } else {
      const updatedAudit = [
        ...refund.auditHistory,
        {
          timestamp: nowIso,
          action: 'REFUND_EXECUTION_FAILED',
          actor: `${staffUser.name} (${staffUser.role})`,
          details: `Gateway refund execution failed. Code: ${executionResult.errorCode || 'UNKNOWN'}, Error: ${executionResult.errorMessage || 'Provider rejection'}`,
          fromStatus: 'EXECUTING',
          toStatus: 'FAILED',
        },
      ];

      const updated = await this.repository.updateRefund(refundId, {
        executionStatus: 'FAILED',
        providerErrorCode: executionResult.errorCode || 'GATEWAY_ERROR',
        providerErrorMessage: executionResult.errorMessage || 'Provider rejected refund',
        auditHistory: updatedAudit,
      });

      return {
        success: false,
        data: updated || undefined,
        error: executionResult.errorMessage || 'Payment gateway failed to execute refund.',
        statusCode: 502,
      };
    }
  }

  /**
   * 8. Get Refund Status and Provider Reconciliation
   */
  public async getRefundStatus(
    refundId: string,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: any; error?: string; statusCode: number }> {
    const refund = await this.repository.getRefundById(refundId);
    if (!refund) {
      return { success: false, error: 'Refund request not found.', statusCode: 404 };
    }

    let providerStatus: any = null;
    if (refund.providerRef) {
      try {
        providerStatus = await this.providerAdapter.getRefundStatus(refund.providerRef);
      } catch (err) {
        providerStatus = { error: (err as any)?.message };
      }
    }

    return {
      success: true,
      data: {
        refundId: refund.id,
        refundRef: refund.refundRef,
        approvalStatus: refund.approvalStatus,
        executionStatus: refund.executionStatus,
        approvedAmount: refund.approvedAmount,
        currency: refund.currency,
        providerRef: refund.providerRef,
        providerStatus,
        lastUpdated: refund.updatedAt,
      },
      statusCode: 200,
    };
  }
}

export function getRefundService(): RefundService {
  return RefundService.getInstance();
}
