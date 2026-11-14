/**
 * Folio Settlement and Express Checkout Contracts (DEV3-TASK-20 / F34, F35)
 * Governs authoritative guest folio retrieval, payment settlement, express checkout, and session revocation.
 */

export type FolioStatus = 'OPEN' | 'SETTLING' | 'SETTLED' | 'CLOSED';
export type FolioLineCategory = 'room' | 'dining' | 'spa' | 'service' | 'tax' | 'adjustment';
export type FolioPaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';

export interface FolioLineItemRecord {
  id: string;
  folioId: string;
  category: FolioLineCategory;
  description: string;
  amount: number;
  isDisputed: boolean;
  disputeId?: string | null;
  postedAt: string;
}

export interface FolioPaymentRecord {
  id: string;
  folioId: string;
  paymentRef: string;
  amount: number;
  currency: string;
  method: 'card' | 'upi' | 'netbanking' | 'cash';
  status: FolioPaymentStatus;
  providerRef?: string | null;
  idempotencyKey?: string | null;
  capturedAt?: string | null;
  createdAt: string;
}

export interface GuestFolioRecord {
  id: string;
  stayId: string;
  bookingReference: string;
  roomNumber: string;
  guestName: string;
  currency: string; // 'INR'
  status: FolioStatus;
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemizedFolioResponse {
  folio: GuestFolioRecord;
  lineItems: FolioLineItemRecord[];
  payments: FolioPaymentRecord[];
  disputes: Array<{
    id: string;
    disputeRef: string;
    category: string;
    disputedAmount: number;
    status: string;
    chargeRef?: string | null;
  }>;
}

export interface CheckoutSummary {
  stayId: string;
  bookingReference: string;
  roomNumber: string;
  guestName: string;
  stayStatus: string;
  currency: string;
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  outstandingBalance: number;
  isEligibleForCheckout: boolean;
  ineligibilityReason?: string;
  pendingDisputesCount: number;
  disputes: Array<{
    id: string;
    disputeRef: string;
    category: string;
    disputedAmount: number;
    status: string;
  }>;
}

export interface CreatePaymentOrderInput {
  folioId: string;
  stayId: string;
  amount: number;
  currency: string;
  method: 'card' | 'upi' | 'netbanking';
  idempotencyKey?: string;
}

export interface PaymentOrderResult {
  success: boolean;
  orderId?: string;
  paymentRef?: string;
  amount?: number;
  currency?: string;
  status: 'created' | 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentRef: string;
  providerPaymentId?: string;
  signature?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  providerPaymentId?: string;
  amount?: number;
  status: 'captured' | 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export interface CheckoutReceipt {
  receiptId: string;
  stayId: string;
  bookingReference: string;
  roomNumber: string;
  guestName: string;
  checkedOutAt: string;
  folioId: string;
  currency: string;
  totalCharges: number;
  totalPaid: number;
  outstandingBalance: number;
  pmsSyncStatus: 'SYNCED' | 'PENDING_RECONCILIATION' | 'FAILED';
  pmsExternalRef?: string;
  lineItems: FolioLineItemRecord[];
  payments: FolioPaymentRecord[];
}

/**
 * Interface defining the Payment Provider Gateway contract.
 */
export interface IPaymentProviderAdapter {
  getProviderId(): string;
  getProviderName(): string;
  isAvailable(): boolean;
  createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult>;
}
