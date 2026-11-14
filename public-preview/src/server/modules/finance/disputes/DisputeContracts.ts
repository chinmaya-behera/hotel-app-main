/**
 * Financial Dispute Contracts & Interfaces (DEV3-TASK-18)
 * Defines dispute categories, statuses, lifecycle transitions, and record models.
 */

export const DISPUTE_CATEGORIES = [
  'incorrect_room_charge',
  'duplicate_charge',
  'dining_charge_query',
  'service_charge_query',
  'tax_fee_query',
  'payment_mismatch',
  'refund_enquiry',
  'other_billing_concern',
] as const;

export type DisputeCategory = (typeof DISPUTE_CATEGORIES)[number];

export const DISPUTE_STATUSES = [
  'submitted',
  'triage_pending',
  'under_review',
  'info_requested',
  'referred_to_finance',
  'resolved',
  'rejected',
  'cancelled',
] as const;

export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export interface DisputeAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface DisputeInternalNote {
  id: string;
  staffId: string;
  staffName: string;
  note: string;
  createdAt: string;
}

export interface DisputeAuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  fromStatus?: string;
  toStatus?: string;
}

export interface FinancialDisputeRecord {
  id: string;
  disputeRef: string; // e.g. 'DSP-2026-402-01'
  propertyId: string;
  stayId: string;
  roomId?: string;
  roomNumber: string;
  guestName: string;
  category: DisputeCategory;
  chargeRef?: string;
  disputedAmount: number;
  currency: string;
  guestExplanation: string;
  status: DisputeStatus;
  preferredResolution?: 'folio_credit' | 'card_refund' | 'charge_removal' | 'voucher';
  attachments: DisputeAttachment[];
  internalNotes: DisputeInternalNote[]; // MUST BE STRIPPED from guest responses!
  auditHistory: DisputeAuditEntry[];
  escalationRequired: boolean;
  assignedStaffId?: string;
  assignedStaffName?: string;
  referredToFinanceAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionDetails?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sanitized dispute view returned to guests (strictly strips internalNotes).
 */
export type SanitizedGuestDispute = Omit<FinancialDisputeRecord, 'internalNotes'>;

/**
 * Front Desk Delegated Limit: ₹2,500
 * Disputed amounts exceeding this threshold require escalation to Finance / GM approval.
 */
export const FD_DELEGATED_TRIAGE_LIMIT = 2500;
