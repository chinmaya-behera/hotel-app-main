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

