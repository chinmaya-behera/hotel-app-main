/**
 * Refund and GM Approval Contracts (DEV3-TASK-19 / F32, F33)
 * Governs the GM approval hierarchy, separation of duties, and payment gateway refund execution.
 */

export type RefundApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type RefundExecutionStatus = 'PENDING_EXECUTION' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED';

export interface RefundAuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  fromStatus?: string;
  toStatus?: string;
}

export interface RefundRequestRecord {
  id: string; // e.g. 'ref_cm5...'
  refundRef: string; // e.g. 'REF-2026-0001'
  disputeId?: string | null;
  disputeRef?: string | null;
  stayId: string;
  folioId: string;
  chargeRef?: string | null;
  originalPaymentRef: string; // e.g. 'PAY-2026-402-01'
  requestedAmount: number; // exact numeric
  approvedAmount?: number | null;
  currency: string; // 'INR'
  reason: string;
  requestedByStaffId: string;
  requestedByStaffName: string;
  requestedAt: string;
  approvalStatus: RefundApprovalStatus;
  approvedByStaffId?: string | null;
  approvedByStaffName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  executionStatus: RefundExecutionStatus;
  providerRef?: string | null; // e.g. 'rfnd_01J...'
  providerErrorCode?: string | null;
  providerErrorMessage?: string | null;
  idempotencyKey?: string | null;
  auditHistory: RefundAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundRequestInput {
  disputeId?: string;
  stayId: string;
  folioId: string;
  chargeRef?: string;
  originalPaymentRef: string;
  requestedAmount: number;
  currency?: string;
  reason: string;
  idempotencyKey?: string;
}

export interface GmApprovalDecisionInput {
  approvedAmount?: number; // Optional partial approval, cannot exceed requested
  notes?: string;
}

export interface GmRejectionDecisionInput {
  rejectionReason: string;
}

export interface RefundExecutionInput {
  refundRef: string;
  paymentRef: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  reason: string;
}

export interface RefundExecutionResult {
  success: boolean;
  providerRef?: string;
  status: RefundExecutionStatus;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Interface defining the Payment Provider Refund Gateway contract.
 */
export interface IRefundProviderAdapter {
  getProviderId(): string;
  getProviderName(): string;
  isAvailable(): boolean;
  executeRefund(input: RefundExecutionInput): Promise<RefundExecutionResult>;
  getRefundStatus(providerRef: string): Promise<RefundExecutionResult>;
}
