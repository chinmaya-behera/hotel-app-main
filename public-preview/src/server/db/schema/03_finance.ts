import { sql } from 'drizzle-orm';
import {
  boolean, check, index, integer, numeric, pgTable,
  primaryKey, text, timestamp, unique,
} from 'drizzle-orm/pg-core';
import {
  propertyTable,
  roomTable,
  staffMembershipTable,
} from './01_identity.ts';

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
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(), // e.g. 'stay_cm5...' or UUID
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  bookingReference: text('booking_reference').notNull().unique(), // e.g. 'BK-7892-0402'
  guestFirstName: text('guest_first_name').notNull(),
  guestLastName: text('guest_last_name').notNull(),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  welcomeTvPin: text('welcome_tv_pin').notNull(), // 4-digit Welcome TV PIN e.g. '4829'
  status: text('status').notNull().default('reserved'), // 'reserved' | 'pending_verify' | 'checked_in' | 'checked_out' | 'cancelled'
  checkInTime: timestamp('check_in_time', { withTimezone: true }).notNull(),
  checkOutTime: timestamp('check_out_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('stay_prop_id_uk').on(t.propertyId, t.id),
  index('stay_property_status_idx').on(t.propertyId, t.status),
  index('stay_booking_ref_idx').on(t.bookingReference),
]);

/**
 * 2. Room Assignment Entity
 * Tracks historical and current physical room occupancy for a stay.
 */
export const roomAssignmentTable = pgTable('room_assignment', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  stayId: text('stay_id').notNull().references(() => stayContextTable.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => roomTable.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  floor: integer('floor').notNull(),
  roomType: text('room_type').notNull(),
  dndActive: boolean('dnd_active').default(false).notNull(),
  cleanlinessStatus: text('cleanliness_status').default('ready').notNull(), // 'dirty' | 'cleaning' | 'inspected' | 'ready'
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  unassignedAt: timestamp('unassigned_at', { withTimezone: true }),
  isCurrent: boolean('is_current').default(true).notNull(),
}, (t) => [
  index('room_assign_stay_idx').on(t.stayId),
  index('room_assign_room_idx').on(t.roomId),
  index('room_assign_current_idx').on(t.propertyId, t.isCurrent),
]);

/**
 * 3. QR Mapping Entity
 * Stores static physical QR code signatures and room secrets for in-room plaque validation.
 */
export const qrMappingTable = pgTable('qr_mapping', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => roomTable.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  staticHmacSignature: text('static_hmac_signature').notNull(),
  secretKey: text('secret_key').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('qr_map_room_idx').on(t.roomId),
  index('qr_map_signature_idx').on(t.staticHmacSignature),
]);

/**
 * 4. Guest Session Entity
 * Tracks active authenticated guest portal sessions, cookies, expiry, and instant revocation.
 */
export const guestSessionTable = pgTable('guest_session', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  stayId: text('stay_id').notNull().references(() => stayContextTable.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => roomTable.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  revokedReason: text('revoked_reason'), // 'room_move' | 'checkout' | 'manual_admin' | 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('guest_session_token_idx').on(t.sessionToken),
  index('guest_session_stay_idx').on(t.stayId),
]);

/**
 * 5. Guest Reminder Entity
 * Tracks scheduled guest wake-up calls, service reminders, alarm ringing states, and snoozing.
 */
export const guestReminderTable = pgTable('guest_reminder', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
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
}, (t) => [
  index('guest_reminder_prop_status_idx').on(t.propertyId, t.status),
  index('guest_reminder_alert_idx').on(t.alertAt),
]);

/**
 * 6. Lost & Found Item Entity
 * Tracks items found across hotel premises, storage locations, claims, verification, and release.
 */
export const lostFoundItemTable = pgTable('lost_found_item', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'LF-2026-001'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  foundLocation: text('found_location').notNull(),
  foundDate: timestamp('found_date', { withTimezone: true }).notNull(),
  roomNumber: text('room_number'),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
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
}, (t) => [
  index('lost_found_prop_status_idx').on(t.propertyId, t.status),
]);

/**
 * 7. Emergency Broadcast Entity
 * Manages emergency alert lifecycle: draft, activation, recipient tracking, and resolution.
 */
export const emergencyBroadcastTable = pgTable('emergency_broadcast', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'EMG-2026-001'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
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
}, (t) => [
  index('emergency_broadcast_prop_status_idx').on(t.propertyId, t.status),
]);

/**
 * 8. Attachment Entity
 * General file attachments: ID pre-arrival documents, photos, invoices, and evidence.
 */
export const attachmentTable = pgTable('attachment', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull().unique(),
  fileName: text('file_name').notNull(),
  contentDigest: text('content_digest'),
  mediaType: text('media_type').notNull(),
  byteSize: integer('byte_size').notNull().default(0),
  classification: text('classification').notNull().default('general'), // 'general' | 'guest_id' | 'quarantine' | 'evidence' | 'invoice'
  scanStatus: text('scan_status').notNull().default('clean'), // 'pending' | 'clean' | 'quarantined'
  uploadedByMembershipId: text('uploaded_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('attachment_prop_class_idx').on(t.propertyId, t.classification),
]);

/**
 * 9. Folio Adjustment Entity
 * Guest room charges, minibar, laundry, late checkouts, and manual balance postings.
 */
export const folioAdjustmentTable = pgTable('folio_adjustment', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'ADJ-2026-402-01'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  stayId: text('stay_id').notNull().references(() => stayContextTable.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  category: text('category').notNull(), // 'minibar' | 'laundry' | 'dining' | 'late_checkout' | 'room_charge' | 'damage' | 'service_credit'
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  postedByMembershipId: text('posted_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  postedByName: text('posted_by_name').notNull(),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('folio_adj_stay_idx').on(t.stayId),
]);

/**
 * 10. Financial Exception Entity (Disputes & Service Recovery)
 * Guest dispute filings, compensation vouchers, and refund authorization requests.
 */
export const financialExceptionTable = pgTable('financial_exception', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'COMP-VIP-518-02', 'REF-402-001'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  caseId: text('case_id'),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
  roomNumber: text('room_number').notNull(),
  guestName: text('guest_name').notNull(),
  requestedByMembershipId: text('requested_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  requestedByName: text('requested_by_name').notNull(),
  actionType: text('action_type').notNull(), // 'refund' | 'credit_note' | 'comp_voucher' | 'waiver' | 'rate_discount'
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  reasonCode: text('reason_code').notNull(), // 'service_delay' | 'hvac_failure' | 'billing_error' | 'noise_complaint' | 'amenity_missing' | 'executive_goodwill'
  reasonDetails: text('reason_details').notNull(),
  status: text('status').notNull().default('pending_approval'), // 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'reconciled'
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('fin_exception_prop_status_idx').on(t.propertyId, t.status),
  index('fin_exception_stay_idx').on(t.stayId),
  check('fin_exception_amount_positive', sql`${t.amount} > 0`),
]);

/**
 * 11. Financial Approval Entity
 * Approval decisions (Tier 1: Front Desk <= ₹2,500; Tier 2: Duty Mgr <= ₹5,000; Tier 3: GM > ₹5,000).
 */
export const financialApprovalTable = pgTable('financial_approval', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  exceptionId: text('exception_id').notNull().references(() => financialExceptionTable.id, { onDelete: 'cascade' }),
  approverMembershipId: text('approver_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  approverName: text('approver_name').notNull(),
  approverRole: text('approver_role').notNull(), // 'front_desk' | 'duty_manager' | 'general_manager'
  decision: text('decision').notNull(), // 'approved' | 'rejected' | 'counter_offered'
  approvedAmount: numeric('approved_amount', { precision: 10, scale: 2 }),
  reviewNotes: text('review_notes'),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('fin_approval_exception_idx').on(t.exceptionId),
]);

/**
 * 12. Financial Execution Entity
 * Gateway refund execution, credit voucher generation, or ledger adjustments.
 */
export const financialExecutionTable = pgTable('financial_execution', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  approvalId: text('approval_id').notNull().unique().references(() => financialApprovalTable.id, { onDelete: 'cascade' }),
  exceptionId: text('exception_id').notNull().references(() => financialExceptionTable.id, { onDelete: 'cascade' }),
  executorMembershipId: text('executor_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  executorName: text('executor_name').notNull(),
  provider: text('provider').notNull().default('razorpay'), // 'razorpay' | 'stripe' | 'pms_folio' | 'cash'
  providerReference: text('provider_reference'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  payoutMethod: text('payout_method').notNull().default('original_payment_method'), // 'original_payment_method' | 'bank_transfer' | 'hotel_credit' | 'voucher'
  outcome: text('outcome').notNull().default('settled'), // 'pending' | 'settled' | 'failed'
  settledAt: timestamp('settled_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 13. Financial Evidence Entity
 * Supports financial dispute reviews with guest bill photos, service logs, or technician reports.
 */
export const financialEvidenceTable = pgTable('financial_evidence', {
  exceptionId: text('exception_id').notNull().references(() => financialExceptionTable.id, { onDelete: 'cascade' }),
  attachmentId: text('attachment_id').notNull().references(() => attachmentTable.id, { onDelete: 'cascade' }),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.exceptionId, t.attachmentId] }),
]);

/**
 * 14. Financial Reconciliation Entity
 * Independent verification and audit of settled financial exceptions by the finance team.
 */
export const reconciliationTable = pgTable('reconciliation', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  executionId: text('execution_id').notNull().references(() => financialExecutionTable.id, { onDelete: 'cascade' }),
  reviewerMembershipId: text('reviewer_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  settlementReference: text('settlement_reference'),
  outcome: text('outcome').notNull().default('verified'), // 'verified' | 'discrepancy' | 'flagged'
  notes: text('notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 15. Guest Feedback Entity
 * Post-fulfillment task ratings, reviews, and satisfaction scores.
 */
export const guestFeedbackTable = pgTable('guest_feedback', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  stayId: text('stay_id').notNull().references(() => stayContextTable.id, { onDelete: 'cascade' }),
  taskId: text('task_id'),
  rating: integer('rating').notNull(), // 1 to 5
  category: text('category').default('overall'),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('guest_feedback_stay_idx').on(t.stayId),
  check('guest_feedback_rating_range', sql`${t.rating} >= 1 and ${t.rating} <= 5`),
]);

/**
 * 16. VIP Directives Entity
 * VIP Guest profiles, executive preferences, dietary instructions, and dedicated butter assignments.
 */
export const vipDirectivesTable = pgTable('vip_directives', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  guestName: text('guest_name').notNull(),
  vipTier: text('vip_tier').notNull().default('VIP'), // 'VIP' | 'VVIP' | 'Celebrity' | 'Diplomat'
  roomNumber: text('room_number'),
  specialDirectives: text('special_directives'),
  dietaryPreferences: text('dietary_preferences'),
  securityNotes: text('security_notes'),
  assignedButlerStaffId: text('assigned_butler_staff_id'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('vip_directives_prop_active_idx').on(t.propertyId, t.active),
]);

// Inferred TypeScript Types for Domain 3
export type StayContext = typeof stayContextTable.$inferSelect;
export type InsertStayContext = typeof stayContextTable.$inferInsert;

export type RoomAssignment = typeof roomAssignmentTable.$inferSelect;
export type InsertRoomAssignment = typeof roomAssignmentTable.$inferInsert;

export type QrMapping = typeof qrMappingTable.$inferSelect;
export type InsertQrMapping = typeof qrMappingTable.$inferInsert;

export type GuestSession = typeof guestSessionTable.$inferSelect;
export type InsertGuestSession = typeof guestSessionTable.$inferInsert;

export type GuestReminder = typeof guestReminderTable.$inferSelect;
export type InsertGuestReminder = typeof guestReminderTable.$inferInsert;

export type LostFoundItem = typeof lostFoundItemTable.$inferSelect;
export type InsertLostFoundItem = typeof lostFoundItemTable.$inferInsert;

export type EmergencyBroadcast = typeof emergencyBroadcastTable.$inferSelect;
export type InsertEmergencyBroadcast = typeof emergencyBroadcastTable.$inferInsert;

export type Attachment = typeof attachmentTable.$inferSelect;
export type InsertAttachment = typeof attachmentTable.$inferInsert;

export type FolioAdjustment = typeof folioAdjustmentTable.$inferSelect;
export type InsertFolioAdjustment = typeof folioAdjustmentTable.$inferInsert;

export type FinancialException = typeof financialExceptionTable.$inferSelect;
export type InsertFinancialException = typeof financialExceptionTable.$inferInsert;

export type FinancialApproval = typeof financialApprovalTable.$inferSelect;
export type InsertFinancialApproval = typeof financialApprovalTable.$inferInsert;

export type FinancialExecution = typeof financialExecutionTable.$inferSelect;
export type InsertFinancialExecution = typeof financialExecutionTable.$inferInsert;

export type FinancialEvidence = typeof financialEvidenceTable.$inferSelect;
export type InsertFinancialEvidence = typeof financialEvidenceTable.$inferInsert;

export type Reconciliation = typeof reconciliationTable.$inferSelect;
export type InsertReconciliation = typeof reconciliationTable.$inferInsert;

export type GuestFeedback = typeof guestFeedbackTable.$inferSelect;
export type InsertGuestFeedback = typeof guestFeedbackTable.$inferInsert;

export type VipDirective = typeof vipDirectivesTable.$inferSelect;
export type InsertVipDirective = typeof vipDirectivesTable.$inferInsert;
