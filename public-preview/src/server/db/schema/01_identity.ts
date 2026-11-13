import { sql } from 'drizzle-orm';
import {
  check, foreignKey, index, integer, jsonb, numeric, pgTable,
  primaryKey, text, timestamp, unique, uuid,
} from 'drizzle-orm/pg-core';

export const propertyTable = pgTable('property', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timeZone: text('time_zone').notNull(),
});

export const departmentTable = pgTable('department', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  name: text('name').notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.propertyId, t.name),
]);

export const outletTable = pgTable('outlet', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  departmentId: uuid('department_id').notNull(),
  name: text('name').notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.propertyId, t.departmentId, t.id),
  unique().on(t.propertyId, t.departmentId, t.name),
  foreignKey({
    name: 'outlet_department_property_fk',
    columns: [t.propertyId, t.departmentId],
    foreignColumns: [departmentTable.propertyId, departmentTable.id],
  }),
]);

export const floorTable = pgTable('floor', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  label: text('label').notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.propertyId, t.label),
]);

export const roomTable = pgTable('room', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  floorId: uuid('floor_id').notNull(),
  roomNumber: text('room_number').notNull(),
  roomType: text('room_type').notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.propertyId, t.roomNumber),
  foreignKey({
    name: 'room_floor_property_fk',
    columns: [t.propertyId, t.floorId],
    foreignColumns: [floorTable.propertyId, floorTable.id],
  }),
]);

export const shiftTable = pgTable('shift', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  check('shift_time_order', sql`${t.endsAt} > ${t.startsAt}`),
]);

export const staffAccountTable = pgTable('staff_account', {
  id: uuid('id').defaultRandom().primaryKey(),
  oidcIssuer: text('oidc_issuer').notNull(),
  oidcSubject: text('oidc_subject').notNull(),
  employeeIdentifier: text('employee_identifier').notNull(),
  status: text('status').notNull(),
}, (t) => [
  unique().on(t.oidcIssuer, t.oidcSubject),
]);

export const staffMembershipTable = pgTable('staff_membership', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  staffAccountId: uuid('staff_account_id').notNull().references(() => staffAccountTable.id),
  managerMembershipId: uuid('manager_membership_id'),
  status: text('status').notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.staffAccountId, t.propertyId),
  foreignKey({
    name: 'staff_membership_manager_property_fk',
    columns: [t.propertyId, t.managerMembershipId],
    foreignColumns: [t.propertyId, t.id],
  }),
  check('staff_membership_manager_not_self', sql`${t.managerMembershipId} <> ${t.id}`),
]);

export const profileTable = pgTable('profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

export const permissionTable = pgTable('permission', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
});

export const profilePermissionTable = pgTable('profile_permission', {
  profileId: uuid('profile_id').notNull().references(() => profileTable.id),
  permissionCode: text('permission_code').notNull().references(() => permissionTable.code),
}, (t) => [
  primaryKey({ columns: [t.profileId, t.permissionCode] }),
]);

export const profileGrantTable = pgTable('profile_grant', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  membershipId: uuid('membership_id').notNull(),
  profileId: uuid('profile_id').notNull().references(() => profileTable.id),
  approvedByMembershipId: uuid('approved_by_membership_id').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.propertyId, t.id, t.profileId),
  foreignKey({
    name: 'profile_grant_membership_property_fk',
    columns: [t.propertyId, t.membershipId],
    foreignColumns: [staffMembershipTable.propertyId, staffMembershipTable.id],
  }),
  foreignKey({
    name: 'profile_grant_approver_property_fk',
    columns: [t.propertyId, t.approvedByMembershipId],
    foreignColumns: [staffMembershipTable.propertyId, staffMembershipTable.id],
  }),
  check('profile_grant_expiry_order', sql`${t.expiresAt} > ${t.validFrom}`),
  index('profile_grant_active_membership_idx')
    .on(t.propertyId, t.membershipId, t.validFrom).where(sql`${t.revokedAt} is null`),
]);

// Provision a grant and its scope in the same transaction.
export const grantScopeTable = pgTable('grant_scope', {
  profileGrantId: uuid('profile_grant_id').primaryKey(),
  propertyId: uuid('property_id').notNull(),
  departmentId: uuid('department_id'),
  outletId: uuid('outlet_id'),
  floorId: uuid('floor_id'),
  shiftId: uuid('shift_id'),
}, (t) => [
  unique().on(t.propertyId, t.profileGrantId),
  foreignKey({
    name: 'grant_scope_grant_property_fk',
    columns: [t.propertyId, t.profileGrantId],
    foreignColumns: [profileGrantTable.propertyId, profileGrantTable.id],
  }),
  foreignKey({
    name: 'grant_scope_department_property_fk',
    columns: [t.propertyId, t.departmentId],
    foreignColumns: [departmentTable.propertyId, departmentTable.id],
  }),
  foreignKey({
    name: 'grant_scope_outlet_department_fk',
    columns: [t.propertyId, t.departmentId, t.outletId],
    foreignColumns: [outletTable.propertyId, outletTable.departmentId, outletTable.id],
  }),
  foreignKey({
    name: 'grant_scope_floor_property_fk',
    columns: [t.propertyId, t.floorId],
    foreignColumns: [floorTable.propertyId, floorTable.id],
  }),
  foreignKey({
    name: 'grant_scope_shift_property_fk',
    columns: [t.propertyId, t.shiftId],
    foreignColumns: [shiftTable.propertyId, shiftTable.id],
  }),
  check('grant_scope_outlet_requires_department', sql`${t.outletId} is null or ${t.departmentId} is not null`),
]);

export const financialLimitTable = pgTable('financial_limit', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull(),
  profileGrantId: uuid('profile_grant_id').notNull(),
  profileId: uuid('profile_id').notNull(),
  actionCode: text('action_code').notNull(),
  currency: text('currency').notNull(),
  transactionType: text('transaction_type').notNull(),
  maximumAmount: numeric('maximum_amount', { precision: 18, scale: 4 }).notNull(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  unique().on(t.propertyId, t.profileGrantId, t.actionCode, t.currency, t.transactionType),
  foreignKey({
    name: 'financial_limit_grant_profile_fk',
    columns: [t.propertyId, t.profileGrantId, t.profileId],
    foreignColumns: [profileGrantTable.propertyId, profileGrantTable.id, profileGrantTable.profileId],
  }),
  foreignKey({
    name: 'financial_limit_profile_permission_fk',
    columns: [t.profileId, t.actionCode],
    foreignColumns: [profilePermissionTable.profileId, profilePermissionTable.permissionCode],
  }),
  check('financial_limit_positive_amount', sql`${t.maximumAmount} > 0 and ${t.maximumAmount} <> 'NaN'::numeric`),
  check('financial_limit_currency_format', sql`${t.currency} ~ '^[A-Z]{3}$'`),
]);

export const auditEventTable = pgTable('audit_event', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  actorMembershipId: uuid('actor_membership_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  outcome: text('outcome').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.propertyId, t.id),
  foreignKey({
    name: 'audit_event_actor_property_fk',
    columns: [t.propertyId, t.actorMembershipId],
    foreignColumns: [staffMembershipTable.propertyId, staffMembershipTable.id],
  }),
  index('audit_event_property_timeline_idx').on(t.propertyId, t.occurredAt),
]);

export const connectorOutboxTable = pgTable('connector_outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => propertyTable.id),
  eventType: text('event_type').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  schemaVersion: integer('schema_version').notNull().default(1),
  correlationId: uuid('correlation_id'),
  deliveryStatus: text('delivery_status').notNull().default('pending'),
  availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
}, (t) => [
  unique().on(t.propertyId, t.id),
  check('connector_outbox_schema_version_positive', sql`${t.schemaVersion} > 0`),
  index('connector_outbox_unsent_idx')
    .on(t.propertyId, t.availableAt).where(sql`${t.deliveredAt} is null`),
]);

