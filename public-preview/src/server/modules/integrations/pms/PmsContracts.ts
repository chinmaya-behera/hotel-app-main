/**
 * PMS Integration Contracts & Models (DEV3-TASK-17)
 * Defines connector interfaces, status types, external data models, and reconciliation discrepancy types.
 */

export type PmsConnectionStatus =
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'SYNC_PENDING'
  | 'SYNC_FAILED'
  | 'RECONCILIATION_REQUIRED';

export type PmsDiscrepancyType =
  | 'missing_internal_record'
  | 'missing_pms_record'
  | 'status_mismatch'
  | 'room_assignment_mismatch'
  | 'date_discrepancy'
  | 'guest_info_mismatch'
  | 'duplicate_external_record'
  | 'payment_booking_conflict';

export type DiscrepancyResolutionAction =
  | 'keep_internal'
  | 'adopt_pms'
  | 'manual_review'
  | 'mark_ignored';

export interface PmsExternalReservation {
  externalId: string; // e.g. 'PMS-RES-9801'
  bookingReference: string; // e.g. 'BK-7892-0402'
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber: string;
  roomType: string;
  status: 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';
  checkInDate: string; // ISO date-time string
  checkOutDate: string; // ISO date-time string
  totalPrice?: number;
  currency?: string;
  isPaid?: boolean;
  pmsLastUpdatedAt: string;
}

export interface PmsPushReservationInput {
  bookingReference: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber: string;
  roomType: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  idempotencyKey: string;
}

export interface PmsConnectorPingResult {
  ok: boolean;
  providerId: string;
  providerName: string;
  status: PmsConnectionStatus;
  latencyMs: number;
  errorCategory?: string;
  errorMessage?: string;
}

/**
 * Interface defining the typed PMS connector contract.
 */
export interface IPmsConnectorAdapter {
  getProviderId(): string;
  getProviderName(): string;
  ping(): Promise<PmsConnectorPingResult>;
  fetchReservations(cursor?: string): Promise<{ reservations: PmsExternalReservation[]; nextCursor?: string }>;
  pushReservation(input: PmsPushReservationInput): Promise<{ success: boolean; externalRef?: string; error?: string }>;
}

export interface PmsDiscrepancyRecord {
  id: string;
  discrepancyType: PmsDiscrepancyType;
  internalRef: string | null;
  externalRef: string | null;
  propertyId: string;
  fieldOrConflict: string;
  internalValue: any;
  externalValue: any;
  suggestedResolution: DiscrepancyResolutionAction;
  status: 'detected' | 'pending_review' | 'resolved' | 'ignored';
  auditHistory: Array<{ timestamp: string; action: string; actor: string; details: string }>;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface PmsSyncStatusState {
  providerId: string;
  providerName: string;
  connectionStatus: PmsConnectionStatus;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  lastSyncSuccessAt: string | null;
  lastSyncAttemptAt: string | null;
  lastErrorCategory: string | null;
  lastErrorMessage: string | null;
  syncCursor: string | null;
  pendingRecordsCount: number;
  failedRecordsCount: number;
  reconciliationDiscrepancyCount: number;
  isStale: boolean;
  message: string;
}
