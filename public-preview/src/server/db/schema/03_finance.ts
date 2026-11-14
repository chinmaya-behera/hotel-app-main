import { pgTable, text, timestamp, boolean, integer, jsonb, numeric } from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * DOMAIN 3: GUEST, FRONT DESK & FINANCIAL SCHEMA (03_finance.ts)
 * Assigned Owner: DEVELOPER 3
 * Documented in BACKEND_TEAM_DIVISION_V2.md (Part 6.1 Entity Matrix)
 * ============================================================================
 */

/**
 * 1. Stay Context Entity
 * Represents an active, pending, or historic guest reservation and stay lifecycle.
 */
export const stayContextTable = pgTable('stay_context', {
  id: text('id').primaryKey(), // e.g. 'stay_cm5...'
  propertyId: text('property_id').notNull(),
  bookingReference: text('booking_reference').notNull().unique(), // e.g. 'BK-7892-0402'
  guestFirstName: text('guest_first_name').notNull(),
  guestLastName: text('guest_last_name').notNull(),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  welcomeTvPin: text('welcome_tv_pin').notNull(), // 4-digit Welcome TV PIN e.g. '4829'
  status: text('status').notNull(), // 'reserved' | 'pending_verify' | 'checked_in' | 'checked_out' | 'cancelled'
  checkInTime: timestamp('check_in_time', { withTimezone: true }).notNull(),
  checkOutTime: timestamp('check_out_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 2. Room Assignment Entity
 * Tracks historical and current physical room occupancy for a stay.
 */
export const roomAssignmentTable = pgTable('room_assignment', {
  id: text('id').primaryKey(),
  stayId: text('stay_id').notNull(),
  roomId: text('room_id').notNull(),
  roomNumber: text('room_number').notNull(),
  propertyId: text('property_id').notNull(),
  floor: integer('floor').notNull(),
  roomType: text('room_type').notNull(),
  dndActive: boolean('dnd_active').default(false).notNull(),
  cleanlinessStatus: text('cleanliness_status').default('ready').notNull(), // 'dirty' | 'cleaning' | 'inspected' | 'ready'
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  unassignedAt: timestamp('unassigned_at', { withTimezone: true }),
  isCurrent: boolean('is_current').default(true).notNull(),
});

/**
 * 3. QR Mapping Entity
 * Stores static physical QR code signatures and room secrets for in-room plaque validation.
 */
export const qrMappingTable = pgTable('qr_mapping', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  roomId: text('room_id').notNull(),
  roomNumber: text('room_number').notNull(),
  staticHmacSignature: text('static_hmac_signature').notNull(),
  secretKey: text('secret_key').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 4. Guest Session Entity
 * Tracks active authenticated guest portal sessions, cookies, expiry, and instant revocation.
 */
export const guestSessionTable = pgTable('guest_session', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  stayId: text('stay_id').notNull(),
  roomId: text('room_id').notNull(),
  roomNumber: text('room_number').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  revokedReason: text('revoked_reason'), // 'room_move' | 'checkout' | 'manual_admin' | 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
});

// Inferred TypeScript Types
export type StayContext = typeof stayContextTable.$inferSelect;
export type InsertStayContext = typeof stayContextTable.$inferInsert;

export type RoomAssignment = typeof roomAssignmentTable.$inferSelect;
export type InsertRoomAssignment = typeof roomAssignmentTable.$inferInsert;

export type QrMapping = typeof qrMappingTable.$inferSelect;
export type InsertQrMapping = typeof qrMappingTable.$inferInsert;

export type GuestSession = typeof guestSessionTable.$inferSelect;
export type InsertGuestSession = typeof guestSessionTable.$inferInsert;

/**
 * 5. Guest Reminder Entity (Table 13 in BACKEND_TEAM_DIVISION_V2.md)
 * Tracks scheduled guest wake-up calls, service reminders, alarm ringing states, and snoozing.
 */
export const guestReminderTable = pgTable('guest_reminder', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  stayId: text('stay_id'),
  roomNumber: text('room_number').notNull(),
  guestName: text('guest_name').notNull(),
  title: text('title').notNull(),
  instructions: text('instructions'),
  reminderType: text('reminder_type').notNull(), // 'wake_up_call' | 'airport_transfer' | 'service_followup' | 'medication' | 'turndown' | 'general'
  dueDateTime: timestamp('due_date_time', { withTimezone: true }).notNull(),
  leadMinutes: integer('lead_minutes').default(15).notNull(),
  alertAt: timestamp('alert_at', { withTimezone: true }).notNull(),
  priority: text('priority').notNull(), // 'normal' | 'urgent' | 'vip'
  status: text('status').notNull(), // 'pending' | 'acknowledged' | 'snoozed' | 'completed' | 'cancelled'
  alarmState: text('alarm_state').default('scheduled').notNull(), // 'scheduled' | 'ringing' | 'snoozed' | 'acknowledged' | 'completed'
  snoozeCount: integer('snooze_count').default(0).notNull(),
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  assignedTo: text('assigned_to'),
  caseRef: text('case_ref'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type GuestReminderEntity = typeof guestReminderTable.$inferSelect;
export type InsertGuestReminderEntity = typeof guestReminderTable.$inferInsert;

/**
 * 6. Lost & Found Item Entity (Table 12 in BACKEND_TEAM_DIVISION_V2.md)
 * Tracks items found across hotel premises, storage locations, claims, verification, and release.
 */
export const lostFoundItemTable = pgTable('lost_found_item', {
  id: text('id').primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'LF-2026-001'
  propertyId: text('property_id').notNull(),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  foundLocation: text('found_location').notNull(),
  foundDate: timestamp('found_date', { withTimezone: true }).notNull(),
  roomNumber: text('room_number'),
  stayId: text('stay_id'),
  storageLocation: text('storage_location').notNull(),
  sensitive: boolean('sensitive').default(false).notNull(),
  photoStorageKey: text('photo_storage_key'),
  registeredByStaffId: text('registered_by_staff_id').notNull(),
  registeredByStaffName: text('registered_by_staff_name').notNull(),
  status: text('status').notNull(), // 'FOUND' | 'STORED' | 'CLAIM_PENDING' | 'RELEASED' | 'DISPOSED'
  claimantName: text('claimant_name'),
  claimantContact: text('claimant_contact'),
  claimantVerificationMethod: text('claimant_verification_method'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  releasedByStaffId: text('released_by_staff_id'),
  releasedByStaffName: text('released_by_staff_name'),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  disposalReason: text('disposal_reason'),
  disposedAt: timestamp('disposed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LostFoundItemEntity = typeof lostFoundItemTable.$inferSelect;
export type InsertLostFoundItemEntity = typeof lostFoundItemTable.$inferInsert;

/**
 * 7. Emergency Broadcast Entity (Table 14 in BACKEND_TEAM_DIVISION_V2.md)
 * Manages controlled emergency alert lifecycle: draft, activation, recipient tracking, and resolution.
 */
export const emergencyBroadcastTable = pgTable('emergency_broadcast', {
  id: text('id').primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'EMG-2026-001'
  propertyId: text('property_id').notNull(),
  title: text('title').notNull(),
  alertType: text('alert_type').notNull(), // 'fire' | 'medical' | 'security' | 'evacuation' | 'severe_weather' | 'life_safety' | 'other'
  severity: text('severity').notNull(), // 'critical' | 'urgent' | 'warning' | 'info'
  message: text('message').notNull(),
  instructions: text('instructions').notNull(),
  targetScope: text('target_scope').notNull(), // 'hotel_wide' | 'property' | 'building' | 'floor' | 'zone' | 'room' | 'staff_only' | 'security_only'
  status: text('status').notNull(), // 'DRAFT' | 'ACTIVE' | 'RESOLVED' | 'CANCELLED'
  incidentRef: text('incident_ref'),
  targetRecipientCount: integer('target_recipient_count').default(0).notNull(),
  broadcastDeliveryStatus: text('broadcast_delivery_status').default('simulated').notNull(),
  createdByStaffId: text('created_by_staff_id').notNull(),
  createdByStaffName: text('created_by_staff_name').notNull(),
  activatedByStaffId: text('activated_by_staff_id'),
  activatedByStaffName: text('activated_by_staff_name'),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  resolvedByStaffId: text('resolved_by_staff_id'),
  resolvedByStaffName: text('resolved_by_staff_name'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),
  cancelledByStaffId: text('cancelled_by_staff_id'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledReason: text('cancelled_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type EmergencyBroadcastEntity = typeof emergencyBroadcastTable.$inferSelect;
export type InsertEmergencyBroadcastEntity = typeof emergencyBroadcastTable.$inferInsert;

/**
 * 8. Financial Dispute Entity (Table 15 in BACKEND_TEAM_DIVISION_V2.md / DEV3-TASK-18)
 * Tracks guest billing dispute filings, charge queries, Front Desk triage, and Finance referrals.
 */
export const financialDisputeTable = pgTable('financial_dispute', {
  id: text('id').primaryKey(), // e.g. 'dsp_cm5...'
  disputeRef: text('dispute_ref').notNull().unique(), // e.g. 'DSP-2026-402-01'
  propertyId: text('property_id').notNull(),
  stayId: text('stay_id').notNull(),
  roomId: text('room_id'),
  roomNumber: text('room_number').notNull(),
  guestName: text('guest_name').notNull(),
  category: text('category').notNull(), // 'incorrect_room_charge' | 'duplicate_charge' | 'dining_charge_query' | 'service_charge_query' | 'tax_fee_query' | 'payment_mismatch' | 'refund_enquiry' | 'other_billing_concern'
  chargeRef: text('charge_ref'),
  disputedAmount: numeric('disputed_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  guestExplanation: text('guest_explanation').notNull(),
  status: text('status').notNull(), // 'submitted' | 'triage_pending' | 'under_review' | 'referred_to_finance' | 'resolved' | 'rejected' | 'info_requested' | 'cancelled'
  preferredResolution: text('preferred_resolution'), // 'folio_credit' | 'card_refund' | 'charge_removal' | 'voucher'
  attachments: jsonb('attachments').$type<Array<{ name: string; url: string; size?: number; mimeType?: string }>>(),
  internalNotes: jsonb('internal_notes').$type<Array<{ id: string; staffId: string; staffName: string; note: string; createdAt: string }>>(),
  auditHistory: jsonb('audit_history').$type<Array<{ timestamp: string; action: string; actor: string; details: string; fromStatus?: string; toStatus?: string }>>(),
  escalationRequired: boolean('escalation_required').default(false).notNull(),
  assignedStaffId: text('assigned_staff_id'),
  assignedStaffName: text('assigned_staff_name'),
  referredToFinanceAt: timestamp('referred_to_finance_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: text('resolved_by'),
  resolutionDetails: text('resolution_details'),
  idempotencyKey: text('idempotency_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FinancialDisputeEntity = typeof financialDisputeTable.$inferSelect;
export type InsertFinancialDisputeEntity = typeof financialDisputeTable.$inferInsert;

/**
 * 9. PMS Sync Status Entity (DEV3-TASK-17 / F14)
 * Tracks external Property Management System connector health, heartbeat, cursor, and failure states.
 */
export const pmsSyncStatusTable = pgTable('pms_sync_status', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().unique(), // e.g. 'opera_cloud_pms'
  providerName: text('provider_name').notNull(),
  connectionStatus: text('connection_status').notNull(), // 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'SYNC_PENDING' | 'SYNC_FAILED' | 'RECONCILIATION_REQUIRED'
  syncDirection: text('sync_direction').default('bidirectional').notNull(),
  lastSyncSuccessAt: timestamp('last_sync_success_at', { withTimezone: true }),
  lastSyncAttemptAt: timestamp('last_sync_attempt_at', { withTimezone: true }),
  lastErrorCategory: text('last_error_category'),
  lastErrorMessage: text('last_error_message'),
  syncCursor: text('sync_cursor'),
  pendingRecordsCount: integer('pending_records_count').default(0).notNull(),
  failedRecordsCount: integer('failed_records_count').default(0).notNull(),
  reconciliationDiscrepancyCount: integer('reconciliation_discrepancy_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PmsSyncStatusEntity = typeof pmsSyncStatusTable.$inferSelect;
export type InsertPmsSyncStatusEntity = typeof pmsSyncStatusTable.$inferInsert;

/**
 * 10. PMS Reconciliation Entity (DEV3-TASK-17)
 * Stores detected discrepancies between internal stay records and PMS external records with audit review history.
 */
export const pmsReconciliationTable = pgTable('pms_reconciliation', {
  id: text('id').primaryKey(), // e.g. 'pms_rec_...'
  discrepancyType: text('discrepancy_type').notNull(), // 'missing_internal_record' | 'missing_pms_record' | 'status_mismatch' | 'room_assignment_mismatch' | 'date_discrepancy' | 'guest_info_mismatch' | 'duplicate_external_record' | 'payment_booking_conflict'
  internalRef: text('internal_ref'), // Booking Reference or Stay ID
  externalRef: text('external_ref'), // PMS external reservation reference
  propertyId: text('property_id').notNull(),
  fieldOrConflict: text('field_or_conflict').notNull(),
  internalValue: jsonb('internal_value'),
  externalValue: jsonb('external_value'),
  suggestedResolution: text('suggested_resolution').notNull(), // 'keep_internal' | 'adopt_pms' | 'manual_review'
  status: text('status').notNull(), // 'detected' | 'pending_review' | 'resolved' | 'ignored'
  auditHistory: jsonb('audit_history').$type<Array<{ timestamp: string; action: string; actor: string; details: string }>>(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: text('resolved_by'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PmsReconciliationEntity = typeof pmsReconciliationTable.$inferSelect;
export type InsertPmsReconciliationEntity = typeof pmsReconciliationTable.$inferInsert;

/**
 * 11. Refund Request Entity (DEV3-TASK-19 / F32, F33)
 * Tracks financial officer refund requests, General Manager approvals, and gateway execution lifecycle.
 */
export const refundRequestTable = pgTable('refund_request', {
  id: text('id').primaryKey(), // e.g. 'ref_cm5...'
  refundRef: text('refund_ref').notNull().unique(), // e.g. 'REF-2026-0001'
  disputeId: text('dispute_id'), // Optional FK / link to financial_dispute.id
  disputeRef: text('dispute_ref'), // Optional link to dispute_ref e.g. 'DSP-2026-402-01'
  stayId: text('stay_id').notNull(),
  folioId: text('folio_id').notNull(),
  chargeRef: text('charge_ref'),
  originalPaymentRef: text('original_payment_ref').notNull(), // e.g. 'PAY-2026-402-01'
  requestedAmount: numeric('requested_amount', { precision: 10, scale: 2 }).notNull(),
  approvedAmount: numeric('approved_amount', { precision: 10, scale: 2 }),
  currency: text('currency').default('INR').notNull(),
  reason: text('reason').notNull(),
  requestedByStaffId: text('requested_by_staff_id').notNull(),
  requestedByStaffName: text('requested_by_staff_name').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  approvalStatus: text('approval_status').notNull(), // 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  approvedByStaffId: text('approved_by_staff_id'),
  approvedByStaffName: text('approved_by_staff_name'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  executionStatus: text('execution_status').notNull(), // 'PENDING_EXECUTION' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED'
  providerRef: text('provider_ref'), // Gateway transaction id e.g. 'rfnd_01J...'
  providerErrorCode: text('provider_error_code'),
  providerErrorMessage: text('provider_error_message'),
  idempotencyKey: text('idempotency_key'),
  auditHistory: jsonb('audit_history').$type<Array<{ timestamp: string; action: string; actor: string; details: string; fromStatus?: string; toStatus?: string }>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type RefundRequestEntity = typeof refundRequestTable.$inferSelect;
export type InsertRefundRequestEntity = typeof refundRequestTable.$inferInsert;

/**
 * 12. Guest Folio Entity (DEV3-TASK-20 / F34)
 * Authoritative billing ledger for an active or historic guest stay.
 */
export const guestFolioTable = pgTable('guest_folio', {
  id: text('id').primaryKey(), // e.g. 'fol_cm5...'
  stayId: text('stay_id').notNull().unique(), // One authoritative folio per stay
  bookingReference: text('booking_reference').notNull(),
  roomNumber: text('room_number').notNull(),
  guestName: text('guest_name').notNull(),
  currency: text('currency').default('INR').notNull(),
  status: text('status').notNull(), // 'OPEN' | 'SETTLING' | 'SETTLED' | 'CLOSED'
  totalCharges: numeric('total_charges', { precision: 10, scale: 2 }).notNull(),
  totalPayments: numeric('total_payments', { precision: 10, scale: 2 }).notNull(),
  totalAdjustments: numeric('total_adjustments', { precision: 10, scale: 2 }).default('0.00').notNull(),
  outstandingBalance: numeric('outstanding_balance', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type GuestFolioEntity = typeof guestFolioTable.$inferSelect;
export type InsertGuestFolioEntity = typeof guestFolioTable.$inferInsert;

/**
 * 13. Folio Line Item Entity (DEV3-TASK-20 / F34)
 * Individual itemized room, dining, tax, or service charges posted to a guest folio.
 */
export const folioLineItemTable = pgTable('folio_line_item', {
  id: text('id').primaryKey(), // e.g. 'fli_cm5...'
  folioId: text('folio_id').notNull(),
  category: text('category').notNull(), // 'room' | 'dining' | 'spa' | 'service' | 'tax' | 'adjustment'
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  isDisputed: boolean('is_disputed').default(false).notNull(),
  disputeId: text('dispute_id'),
  postedAt: timestamp('posted_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FolioLineItemEntity = typeof folioLineItemTable.$inferSelect;
export type InsertFolioLineItemEntity = typeof folioLineItemTable.$inferInsert;

/**
 * 14. Folio Payment Entity (DEV3-TASK-20 / F34, F35)
 * Captures advance deposits, settled credit/UPI payments, and records against the guest folio.
 */
export const folioPaymentTable = pgTable('folio_payment', {
  id: text('id').primaryKey(), // e.g. 'pay_cm5...'
  folioId: text('folio_id').notNull(),
  paymentRef: text('payment_ref').notNull().unique(), // e.g. 'PAY-2026-402-01'
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  method: text('method').notNull(), // 'card' | 'upi' | 'netbanking' | 'cash'
  status: text('status').notNull(), // 'pending' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'
  providerRef: text('provider_ref'), // Gateway payment id e.g. 'pay_01J...'
  idempotencyKey: text('idempotency_key'),
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FolioPaymentEntity = typeof folioPaymentTable.$inferSelect;
export type InsertFolioPaymentEntity = typeof folioPaymentTable.$inferInsert;





