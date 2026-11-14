import { check, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { staffMembershipTable } from './01_identity.ts';

export const staffSessionTable = pgTable('staff_session', {
  id: text('id').primaryKey(),
  membershipId: text('membership_id').notNull().references(() => staffMembershipTable.id),
  accessHash: text('access_hash').notNull().unique(),
  refreshHash: text('refresh_hash').notNull().unique(),
  csrfHash: text('csrf_hash').notNull(),
  accessExpiresAt: timestamp('access_expires_at', { withTimezone: true }).notNull(),
  refreshExpiresAt: timestamp('refresh_expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => [
  index('staff_session_membership_idx').on(t.membershipId),
  check('staff_session_expiry_order', sql`${t.accessExpiresAt} <= ${t.refreshExpiresAt}`),
]);
