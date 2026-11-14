import { z } from 'zod';
import {
  type DisputeCategory,
  type DisputeStatus,
  type DisputeAttachment,
  type FinancialDisputeRecord,
  type SanitizedGuestDispute,
  DISPUTE_CATEGORIES,
  FD_DELEGATED_TRIAGE_LIMIT,
} from './DisputeContracts.ts';
import {
  type IFinancialDisputeRepository,
  type DisputeQueryFilters,
  getFinancialDisputeRepository,
} from './FinancialDisputeRepository.ts';
import { QrAuthService } from '../../guest/QrAuthService.ts';
import { getGuestStayRepository } from '../../guest/repositories/GuestStayRepository.ts';
import type { StaffAuthUser } from '../../frontdesk/FrontDeskStayService.ts';

export const DisputeSubmissionSchema = z.object({
  category: z.enum(DISPUTE_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid dispute category selected.' }),
  }),
  chargeRef: z.string().trim().max(100).optional(),
  disputedAmount: z.number().positive('Disputed amount must be greater than zero.'),
  currency: z.string().trim().default('INR').optional(),
  guestExplanation: z.string().min(5, 'Explanation must be at least 5 characters.').max(2000).trim(),
  preferredResolution: z.enum(['folio_credit', 'card_refund', 'charge_removal', 'voucher']).optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      size: z.number().optional(),
      mimeType: z.string().optional(),
    }),
  ).optional(),
  idempotencyKey: z.string().trim().optional(),
});

export type DisputeSubmissionInput = z.infer<typeof DisputeSubmissionSchema>;

export const DisputeTriageSchema = z.object({
  decision: z.enum(['under_review', 'resolve', 'refer_to_finance', 'reject', 'cancel'], {
    errorMap: () => ({ message: 'Decision must be under_review, resolve, refer_to_finance, reject, or cancel' }),
  }),
  notes: z.string().max(1000).optional(),
  internalNote: z.string().max(1000).optional(),
  rejectionReason: z.string().max(1000).optional(),
  resolutionDetails: z.string().max(1000).optional(),
});

export type DisputeTriageInput = z.infer<typeof DisputeTriageSchema>;

export const RequestInformationSchema = z.object({
  guestMessage: z.string().min(5, 'Guest message must be at least 5 characters.').max(1000).trim(),
  internalNote: z.string().max(1000).optional(),
});

export type RequestInformationInput = z.infer<typeof RequestInformationSchema>;

export const ReferToFinanceSchema = z.object({
  chargeRef: z.string().trim().max(100).optional(),
  notes: z.string().max(1000).optional(),
  internalNote: z.string().max(1000).optional(),
  recommendedAdjustment: z.number().positive().optional(),
});

export type ReferToFinanceInput = z.infer<typeof ReferToFinanceSchema>;

/**
 * Financial Dispute Filing & Front Desk Triage Service (DEV3-TASK-18)
 * Handles secure guest dispute intake, session-anchored authorization, Front Desk queue, and Finance handoff.
 */
export class FinancialDisputeService {
  private static instance: FinancialDisputeService;
  private repository: IFinancialDisputeRepository;

  constructor(repository?: IFinancialDisputeRepository) {
    this.repository = repository || getFinancialDisputeRepository();
  }

  public static getInstance(): FinancialDisputeService {
    if (!FinancialDisputeService.instance) {
      FinancialDisputeService.instance = new FinancialDisputeService();
    }
    return FinancialDisputeService.instance;
  }

  /**
   * Helper: Strips internal staff notes from dispute record before returning to guest
   */
  public sanitizeForGuest(record: FinancialDisputeRecord): SanitizedGuestDispute {
    const { internalNotes, ...sanitized } = record;
    return sanitized;
  }

  /**
   * 1. Guest Dispute Submission (Session-Anchored Authorization)
   * The stayId, roomId, roomNumber, and guestName are derived STRICTLY from the authenticated session.
   */
  public async createGuestDispute(
    input: DisputeSubmissionInput,
    sessionToken?: string,
  ): Promise<{ success: boolean; data?: SanitizedGuestDispute; error?: string; statusCode: number }> {
    if (!sessionToken) {
      return {
        success: false,
        error: 'Authentication required. Active guest session is missing.',
        statusCode: 401,
      };
    }

    const sessionRes = QrAuthService.validateSession(sessionToken);
    if (!sessionRes.valid || !sessionRes.session) {
      return {
        success: false,
        error: 'Invalid or expired guest session. Please re-scan room QR code.',
        statusCode: 401,
      };
    }

    const session = sessionRes.session;

    // Idempotency check: prevent duplicate dispute submissions
    if (input.idempotencyKey) {
      const existing = await this.repository.findDisputeByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return {
          success: true,
          data: this.sanitizeForGuest(existing),
          statusCode: 200,
        };
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const disputeId = `dsp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const disputeRef = `DSP-${now.getFullYear()}-${session.roomNumber}-${Math.floor(10 + Math.random() * 90)}`;

    const escalationRequired = input.disputedAmount > FD_DELEGATED_TRIAGE_LIMIT;

    let guestName = 'Registered Guest';
    try {
      const stayRepo = getGuestStayRepository();
      const stayWithRoom = await stayRepo.getStayWithRoomById(session.stayId);
      if (stayWithRoom?.stay) {
        guestName = `${stayWithRoom.stay.guestFirstName} ${stayWithRoom.stay.guestLastName}`;
      }
    } catch {
      // fallback
    }

    const newRecord: FinancialDisputeRecord = {
      id: disputeId,
      disputeRef,
      propertyId: 'prop_grand_adp_01',
      stayId: session.stayId,
      roomId: session.roomId,
      roomNumber: session.roomNumber,
      guestName,
      category: input.category,
      chargeRef: input.chargeRef,
      disputedAmount: input.disputedAmount,
      currency: input.currency || 'INR',
      guestExplanation: input.guestExplanation,
      status: 'triage_pending',
      preferredResolution: input.preferredResolution,
      attachments: input.attachments || [],
      internalNotes: [],
      auditHistory: [
        {
          timestamp: nowIso,
          action: 'DISPUTE_SUBMITTED',
          actor: `Guest: ${session.guestName || 'Registered Guest'} (Room ${session.roomNumber})`,
          details: `Dispute filed for ₹${input.disputedAmount}. Category: ${input.category}`,
          toStatus: 'triage_pending',
        },
      ],
      escalationRequired,
      idempotencyKey: input.idempotencyKey,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const created = await this.repository.createDispute(newRecord);
    return {
      success: true,
      data: this.sanitizeForGuest(created),
      statusCode: 201,
    };
  }

  /**
   * 2. Guest Lists Their Own Disputes
   */
  public async getGuestDisputes(
    sessionToken?: string,
  ): Promise<{ success: boolean; data?: SanitizedGuestDispute[]; error?: string; statusCode: number }> {
    if (!sessionToken) {
      return { success: false, error: 'Authentication required.', statusCode: 401 };
    }

    const sessionRes = QrAuthService.validateSession(sessionToken);
    if (!sessionRes.valid || !sessionRes.session) {
      return { success: false, error: 'Invalid or expired session.', statusCode: 401 };
    }

    const records = await this.repository.getDisputesForStay(sessionRes.session.stayId);
    const sanitized = records.map((r) => this.sanitizeForGuest(r));

    return {
      success: true,
      data: sanitized,
      statusCode: 200,
    };
  }

  /**
   * 3. Guest Gets Dispute Detail (Rejects Cross-Stay Access)
   */
  public async getGuestDisputeById(
    disputeId: string,
    sessionToken?: string,
  ): Promise<{ success: boolean; data?: SanitizedGuestDispute; error?: string; statusCode: number }> {
    if (!sessionToken) {
      return { success: false, error: 'Authentication required.', statusCode: 401 };
    }

    const sessionRes = QrAuthService.validateSession(sessionToken);
    if (!sessionRes.valid || !sessionRes.session) {
      return { success: false, error: 'Invalid or expired session.', statusCode: 401 };
    }

    const dispute = await this.repository.getDisputeById(disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute record not found.', statusCode: 404 };
    }

    // Security check: Guest can ONLY view disputes belonging to their own stay
    if (dispute.stayId !== sessionRes.session.stayId) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to view disputes from another stay.',
        statusCode: 403,
      };
    }

    return {
      success: true,
      data: this.sanitizeForGuest(dispute),
      statusCode: 200,
    };
  }

  /**
   * 4. Front Desk Dispute Queue (Search, Filter, Internal Notes)
   */
  public async getFrontDeskDisputes(
    filters: DisputeQueryFilters,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: FinancialDisputeRecord[]; counts?: Record<string, number>; error?: string; statusCode: number }> {
    const disputes = await this.repository.getAllDisputes(filters);

    const counts = {
      all: disputes.length,
      triage_pending: disputes.filter((d) => d.status === 'triage_pending' || d.status === 'submitted').length,
      under_review: disputes.filter((d) => d.status === 'under_review').length,
      info_requested: disputes.filter((d) => d.status === 'info_requested').length,
      referred_to_finance: disputes.filter((d) => d.status === 'referred_to_finance').length,
      resolved: disputes.filter((d) => d.status === 'resolved').length,
      rejected: disputes.filter((d) => d.status === 'rejected').length,
    };

    return {
      success: true,
      data: disputes,
      counts,
      statusCode: 200,
    };
  }

  /**
   * 5. Front Desk Gets Full Dispute Details (Includes Internal Notes)
   */
  public async getFrontDeskDisputeById(
    disputeId: string,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: FinancialDisputeRecord; error?: string; statusCode: number }> {
    const dispute = await this.repository.getDisputeById(disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute record not found.', statusCode: 404 };
    }

    return {
      success: true,
      data: dispute,
      statusCode: 200,
    };
  }

  /**
   * 6. Front Desk Triage Action (Limit Enforcement: ₹2,500)
   */
  public async triageDispute(
    disputeId: string,
    input: DisputeTriageInput,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: FinancialDisputeRecord; error?: string; statusCode: number }> {
    const dispute = await this.repository.getDisputeById(disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute record not found.', statusCode: 404 };
    }

    if (dispute.status === 'resolved' || dispute.status === 'rejected' || dispute.status === 'cancelled') {
      return {
        success: false,
        error: `Cannot triage dispute in finalized status '${dispute.status}'.`,
        statusCode: 400,
      };
    }

    const nowIso = new Date().toISOString();
    const fromStatus = dispute.status;
    let toStatus: DisputeStatus = dispute.status;
    let resolutionDetails = dispute.resolutionDetails;
    let resolvedAt = dispute.resolvedAt;
    let resolvedBy = dispute.resolvedBy;
    let referredToFinanceAt = dispute.referredToFinanceAt;

    // Handle Decision: RESOLVE
    if (input.decision === 'resolve') {
      // FINANCIAL SAFETY BOUNDARY: Front Desk cannot approve or resolve disputes exceeding ₹2,500
      if (dispute.disputedAmount > FD_DELEGATED_TRIAGE_LIMIT) {
        return {
          success: false,
          error: `Disputed amount of ₹${dispute.disputedAmount} exceeds the Front Desk delegated limit of ₹${FD_DELEGATED_TRIAGE_LIMIT}. This claim must be referred to Finance / GM approval.`,
          statusCode: 403,
        };
      }

      toStatus = 'resolved';
      resolvedAt = nowIso;
      resolvedBy = staffUser.name;
      resolutionDetails = input.resolutionDetails || input.notes || `Resolved within Front Desk delegated authority (<= ₹${FD_DELEGATED_TRIAGE_LIMIT}).`;
    } else if (input.decision === 'refer_to_finance') {
      toStatus = 'referred_to_finance';
      referredToFinanceAt = nowIso;
    } else if (input.decision === 'reject') {
      if (!input.rejectionReason && !input.notes) {
        return {
          success: false,
          error: 'A reason must be recorded when rejecting a financial dispute.',
          statusCode: 400,
        };
      }
      toStatus = 'rejected';
      resolutionDetails = input.rejectionReason || input.notes;
    } else if (input.decision === 'under_review') {
      toStatus = 'under_review';
    } else if (input.decision === 'cancel') {
      toStatus = 'cancelled';
    }

    // Build updated notes and audit
    const updatedNotes = [...dispute.internalNotes];
    if (input.internalNote) {
      updatedNotes.push({
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        staffId: staffUser.staffId,
        staffName: staffUser.name,
        note: input.internalNote,
        createdAt: nowIso,
      });
    }

    const updatedAudit = [
      ...dispute.auditHistory,
      {
        timestamp: nowIso,
        action: `TRIAGE_${input.decision.toUpperCase()}`,
        actor: `${staffUser.name} (${staffUser.role})`,
        details: input.notes || `Triage decision: ${input.decision}`,
        fromStatus,
        toStatus,
      },
    ];

    const updated = await this.repository.updateDispute(disputeId, {
      status: toStatus,
      assignedStaffId: staffUser.staffId,
      assignedStaffName: staffUser.name,
      internalNotes: updatedNotes,
      auditHistory: updatedAudit,
      resolutionDetails,
      resolvedAt,
      resolvedBy,
      referredToFinanceAt,
    });

    return {
      success: true,
      data: updated || undefined,
      statusCode: 200,
    };
  }

  /**
   * 7. Request Additional Information from Guest
   */
  public async requestInformation(
    disputeId: string,
    input: RequestInformationInput,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: FinancialDisputeRecord; error?: string; statusCode: number }> {
    const dispute = await this.repository.getDisputeById(disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute record not found.', statusCode: 404 };
    }

    const nowIso = new Date().toISOString();
    const updatedNotes = [...dispute.internalNotes];
    if (input.internalNote) {
      updatedNotes.push({
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        staffId: staffUser.staffId,
        staffName: staffUser.name,
        note: input.internalNote,
        createdAt: nowIso,
      });
    }

    const updatedAudit = [
      ...dispute.auditHistory,
      {
        timestamp: nowIso,
        action: 'REQUEST_INFORMATION',
        actor: `${staffUser.name} (${staffUser.role})`,
        details: `Requested info from guest: "${input.guestMessage}"`,
        fromStatus: dispute.status,
        toStatus: 'info_requested',
      },
    ];

    const updated = await this.repository.updateDispute(disputeId, {
      status: 'info_requested',
      internalNotes: updatedNotes,
      auditHistory: updatedAudit,
    });

    return {
      success: true,
      data: updated || undefined,
      statusCode: 200,
    };
  }

  /**
   * 8. Refer Dispute to Finance Workflow
   */
  public async referToFinance(
    disputeId: string,
    input: ReferToFinanceInput,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: FinancialDisputeRecord; financeHandoffStatus: string; error?: string; statusCode: number }> {
    const dispute = await this.repository.getDisputeById(disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute record not found.', financeHandoffStatus: 'not_found', statusCode: 404 };
    }

    if (dispute.status === 'referred_to_finance') {
      return {
        success: false,
        error: 'Dispute has already been referred to Finance.',
        financeHandoffStatus: 'already_referred',
        statusCode: 400,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedNotes = [...dispute.internalNotes];
    if (input.internalNote) {
      updatedNotes.push({
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        staffId: staffUser.staffId,
        staffName: staffUser.name,
        note: input.internalNote,
        createdAt: nowIso,
      });
    }

    const updatedAudit = [
      ...dispute.auditHistory,
      {
        timestamp: nowIso,
        action: 'REFERRED_TO_FINANCE',
        actor: `${staffUser.name} (${staffUser.role})`,
        details: input.notes || `Referred to Finance department. Charge ref: ${input.chargeRef || dispute.chargeRef || 'N/A'}.`,
        fromStatus: dispute.status,
        toStatus: 'referred_to_finance',
      },
    ];

    const updated = await this.repository.updateDispute(disputeId, {
      status: 'referred_to_finance',
      chargeRef: input.chargeRef || dispute.chargeRef,
      referredToFinanceAt: nowIso,
      internalNotes: updatedNotes,
      auditHistory: updatedAudit,
    });

    return {
      success: true,
      data: updated || undefined,
      financeHandoffStatus: 'referred_to_finance_workflow',
      statusCode: 200,
    };
  }
}
