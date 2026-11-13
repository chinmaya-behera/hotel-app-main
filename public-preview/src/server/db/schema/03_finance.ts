import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

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



