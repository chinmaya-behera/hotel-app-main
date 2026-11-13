import { sql } from 'drizzle-orm';
import {
  check, foreignKey, index, integer, jsonb, numeric, pgTable,
  primaryKey, text, timestamp, unique,
} from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * DOMAIN 1: IDENTITY, ORGANIZATION, INVENTORY & AUDIT SCHEMA (01_identity.ts)
 * Assigned Owner: DEVELOPER 1
 * Documented in BACKEND_TEAM_DIVISION_V2.md (Part 6.1 Entity Matrix)
 * ============================================================================
 */

export const propertyTable = pgTable('property', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  name: text('name').notNull(),
  timeZone: text('time_zone').notNull().default('Asia/Kolkata'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  currency: text('currency').notNull().default('INR'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const departmentTable = pgTable('department', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('dept_prop_id_uk').on(t.propertyId, t.id),
  unique('dept_prop_name_uk').on(t.propertyId, t.name),
]);

export const outletTable = pgTable('outlet', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').notNull().references(() => departmentTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  outletType: text('outlet_type').notNull().default('restaurant'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('outlet_prop_id_uk').on(t.propertyId, t.id),
  unique('outlet_prop_dept_id_uk').on(t.propertyId, t.departmentId, t.id),
  unique('outlet_prop_dept_name_uk').on(t.propertyId, t.departmentId, t.name),
]);

export const floorTable = pgTable('floor', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  floorNumber: integer('floor_number').notNull().default(1),
  label: text('label').notNull(),
  buildingWing: text('building_wing').default('Main'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('floor_prop_id_uk').on(t.propertyId, t.id),
  unique('floor_prop_label_uk').on(t.propertyId, t.label),
]);

export const roomTable = pgTable('room', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  floorId: text('floor_id').notNull().references(() => floorTable.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  roomType: text('room_type').notNull(),
  cleanlinessStatus: text('cleanliness_status').notNull().default('ready'),
  occupancyStatus: text('occupancy_status').notNull().default('vacant'),
  bedType: text('bed_type').default('King'),
  maxOccupancy: integer('max_occupancy').default(2),
  rackRate: numeric('rack_rate', { precision: 10, scale: 2 }).default('15000.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('room_prop_id_uk').on(t.propertyId, t.id),
  unique('room_prop_number_uk').on(t.propertyId, t.roomNumber),
]);

export const shiftTable = pgTable('shift', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Morning Shift'),
  shiftCode: text('shift_code').default('MORN'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('shift_prop_id_uk').on(t.propertyId, t.id),
  check('shift_time_order', sql`${t.endsAt} > ${t.startsAt}`),
]);

export const staffAccountTable = pgTable('staff_account', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  oidcIssuer: text('oidc_issuer').notNull().default('local'),
  oidcSubject: text('oidc_subject'),
  employeeIdentifier: text('employee_identifier').notNull(),
  fullName: text('full_name').notNull().default('Staff Member'),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull().default('staff'),
  avatarUrl: text('avatar_url'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('staff_account_emp_uk').on(t.employeeIdentifier),
]);

export const staffMembershipTable = pgTable('staff_membership', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  staffAccountId: text('staff_account_id').notNull().references(() => staffAccountTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').references(() => departmentTable.id, { onDelete: 'set null' }),
  managerMembershipId: text('manager_membership_id'),
  jobTitle: text('job_title'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('staff_membership_prop_id_uk').on(t.propertyId, t.id),
  unique('staff_membership_account_prop_uk').on(t.staffAccountId, t.propertyId),
  foreignKey({
    name: 'staff_membership_manager_fk',
    columns: [t.managerMembershipId],
    foreignColumns: [t.id],
  }),
  check('staff_membership_manager_not_self', sql`${t.managerMembershipId} <> ${t.id}`),
]);

export const profileTable = pgTable('profile', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
});

export const permissionTable = pgTable('permission', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
  category: text('category').default('general'),
});

export const profilePermissionTable = pgTable('profile_permission', {
  profileId: text('profile_id').notNull().references(() => profileTable.id, { onDelete: 'cascade' }),
  permissionCode: text('permission_code').notNull().references(() => permissionTable.code, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.profileId, t.permissionCode] }),
]);

export const profileGrantTable = pgTable('profile_grant', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  membershipId: text('membership_id').notNull().references(() => staffMembershipTable.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').notNull().references(() => profileTable.id, { onDelete: 'cascade' }),
  approvedByMembershipId: text('approved_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => [
  unique('profile_grant_prop_id_uk').on(t.propertyId, t.id),
  unique('profile_grant_prop_mem_profile_uk').on(t.propertyId, t.membershipId, t.profileId),
  check('profile_grant_expiry_order', sql`${t.expiresAt} is null or ${t.expiresAt} > ${t.validFrom}`),
  index('profile_grant_active_idx')
    .on(t.propertyId, t.membershipId, t.validFrom).where(sql`${t.revokedAt} is null`),
]);

export const grantScopeTable = pgTable('grant_scope', {
  profileGrantId: text('profile_grant_id').primaryKey().references(() => profileGrantTable.id, { onDelete: 'cascade' }),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').references(() => departmentTable.id, { onDelete: 'set null' }),
  outletId: text('outlet_id').references(() => outletTable.id, { onDelete: 'set null' }),
  floorId: text('floor_id').references(() => floorTable.id, { onDelete: 'set null' }),
  shiftId: text('shift_id').references(() => shiftTable.id, { onDelete: 'set null' }),
}, (t) => [
  unique('grant_scope_prop_grant_uk').on(t.propertyId, t.profileGrantId),
]);

export const financialLimitTable = pgTable('financial_limit', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  profileGrantId: text('profile_grant_id').references(() => profileGrantTable.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').references(() => profileTable.id, { onDelete: 'cascade' }),
  roleCode: text('role_code').notNull().default('front_desk'),
  actionCode: text('action_code').notNull(),
  currency: text('currency').notNull().default('INR'),
  transactionType: text('transaction_type').notNull().default('refund'),
  maximumAmount: numeric('maximum_amount', { precision: 18, scale: 2 }).notNull(),
}, (t) => [
  unique('financial_limit_prop_id_uk').on(t.propertyId, t.id),
  check('financial_limit_positive_amount', sql`${t.maximumAmount} > 0 and ${t.maximumAmount} <> 'NaN'::numeric`),
]);

export const auditEventTable = pgTable('audit_event', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  actorMembershipId: text('actor_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  outcome: text('outcome').notNull().default('success'),
  ipAddress: text('ip_address'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('audit_event_prop_id_uk').on(t.propertyId, t.id),
  index('audit_event_property_timeline_idx').on(t.propertyId, t.occurredAt),
]);

export const connectorOutboxTable = pgTable('connector_outbox', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  schemaVersion: integer('schema_version').notNull().default(1),
  correlationId: text('correlation_id'),
  deliveryStatus: text('delivery_status').notNull().default('pending'),
  availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
}, (t) => [
  unique('connector_outbox_prop_id_uk').on(t.propertyId, t.id),
  check('connector_outbox_schema_version_positive', sql`${t.schemaVersion} > 0`),
  index('connector_outbox_unsent_idx')
    .on(t.propertyId, t.availableAt).where(sql`${t.deliveredAt} is null`),
]);

// Inferred TypeScript Types for Domain 1
export type Property = typeof propertyTable.$inferSelect;
export type InsertProperty = typeof propertyTable.$inferInsert;

export type Department = typeof departmentTable.$inferSelect;
export type InsertDepartment = typeof departmentTable.$inferInsert;

export type Outlet = typeof outletTable.$inferSelect;
export type InsertOutlet = typeof outletTable.$inferInsert;

export type Floor = typeof floorTable.$inferSelect;
export type InsertFloor = typeof floorTable.$inferInsert;

export type Room = typeof roomTable.$inferSelect;
export type InsertRoom = typeof roomTable.$inferInsert;

export type Shift = typeof shiftTable.$inferSelect;
export type InsertShift = typeof shiftTable.$inferInsert;

export type StaffAccount = typeof staffAccountTable.$inferSelect;
export type InsertStaffAccount = typeof staffAccountTable.$inferInsert;

export type StaffMembership = typeof staffMembershipTable.$inferSelect;
export type InsertStaffMembership = typeof staffMembershipTable.$inferInsert;

export type Profile = typeof profileTable.$inferSelect;
export type InsertProfile = typeof profileTable.$inferInsert;

export type Permission = typeof permissionTable.$inferSelect;
export type InsertPermission = typeof permissionTable.$inferInsert;

export type ProfilePermission = typeof profilePermissionTable.$inferSelect;
export type InsertProfilePermission = typeof profilePermissionTable.$inferInsert;

export type ProfileGrant = typeof profileGrantTable.$inferSelect;
export type InsertProfileGrant = typeof profileGrantTable.$inferInsert;

export type GrantScope = typeof grantScopeTable.$inferSelect;
export type InsertGrantScope = typeof grantScopeTable.$inferInsert;

export type FinancialLimit = typeof financialLimitTable.$inferSelect;
export type InsertFinancialLimit = typeof financialLimitTable.$inferInsert;

export type AuditEvent = typeof auditEventTable.$inferSelect;
export type InsertAuditEvent = typeof auditEventTable.$inferInsert;

export type ConnectorOutbox = typeof connectorOutboxTable.$inferSelect;
export type InsertConnectorOutbox = typeof connectorOutboxTable.$inferInsert;
