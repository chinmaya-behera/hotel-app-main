import { sql } from 'drizzle-orm';
import {
  boolean, check, foreignKey, index, integer, jsonb, numeric, pgTable,
  primaryKey, text, timestamp, unique,
} from 'drizzle-orm/pg-core';
import {
  propertyTable,
  departmentTable,
  outletTable,
  roomTable,
  shiftTable,
  staffMembershipTable,
} from './01_identity.ts';
import { stayContextTable } from './03_finance.ts';

/**
 * ============================================================================
 * DOMAIN 2: OPERATIONS, CANONICAL TASK ENGINE, DISPATCH & SAFETY SCHEMA (02_operations.ts)
 * Assigned Owner: DEVELOPER 2
 * Documented in BACKEND_TEAM_DIVISION_V2.md (Part 6.1 Entity Matrix)
 * ============================================================================
 */

/**
 * 1. Task Category Entity
 * Defines classification, default SLA targets, and routing boundaries for operational tasks.
 */
export const taskCategoryTable = pgTable('task_category', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').notNull().references(() => departmentTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  defaultPriority: text('default_priority').notNull().default('normal'),
  slaResponseMinutes: integer('sla_response_minutes').notNull().default(15),
  slaResolutionMinutes: integer('sla_resolution_minutes').notNull().default(45),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('task_category_prop_dept_name_uk').on(t.propertyId, t.departmentId, t.name),
]);

/**
 * 2. Guest Case Entity
 * Master customer or internal ticket grouping one or more departmental operational tasks.
 */
export const guestCaseTable = pgTable('guest_case', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'GC-502-081126' or 'CASE-402-081126'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
  roomId: text('room_id').references(() => roomTable.id, { onDelete: 'set null' }),
  roomNumber: text('room_number'),
  guestName: text('guest_name'),
  ownerMembershipId: text('owner_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('normal'), // 'low' | 'normal' | 'urgent' | 'safety_critical'
  status: text('status').notNull().default('open'), // 'open' | 'in_progress' | 'pending_guest' | 'resolved' | 'closed' | 'escalated'
  source: text('source').notNull().default('guest_portal'), // 'guest_portal' | 'front_desk' | 'system' | 'phone'
  category: text('category'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (t) => [
  unique('guest_case_prop_id_uk').on(t.propertyId, t.id),
  index('guest_case_property_status_idx').on(t.propertyId, t.status),
  index('guest_case_stay_idx').on(t.stayId),
]);

/**
 * 3. Case Message Entity
 * Two-way communication thread between guest, dispatcher, and fulfillment staff.
 */
export const caseMessageTable = pgTable('case_message', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  caseId: text('case_id').notNull().references(() => guestCaseTable.id, { onDelete: 'cascade' }),
  authorMembershipId: text('author_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  isFromGuest: boolean('is_from_guest').notNull().default(false),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  channel: text('channel').notNull().default('in_app'), // 'in_app' | 'sms' | 'whatsapp' | 'internal_note'
  deliveryStatus: text('delivery_status').notNull().default('delivered'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('case_message_case_idx').on(t.caseId, t.createdAt),
]);

/**
 * 4. Case Link Entity
 * Records duplicate, dependent, or related cases.
 */
export const caseLinkTable = pgTable('case_link', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  sourceCaseId: text('source_case_id').notNull().references(() => guestCaseTable.id, { onDelete: 'cascade' }),
  targetCaseId: text('target_case_id').notNull().references(() => guestCaseTable.id, { onDelete: 'cascade' }),
  relationship: text('relationship').notNull().default('related'), // 'duplicate' | 'related' | 'caused_by' | 'parent_of'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('case_link_not_self', sql`${t.sourceCaseId} <> ${t.targetCaseId}`),
]);

/**
 * 5. Department Task Entity (The Canonical Work Item Engine)
 * Represents individual departmental work orders across Housekeeping, Maintenance, F&B, Spa, etc.
 */
export const departmentTaskTable = pgTable('department_task', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'HK-402-081126', 'MAIN-518-081126', 'FB-301-081126'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  caseId: text('case_id').references(() => guestCaseTable.id, { onDelete: 'set null' }),
  departmentId: text('department_id').notNull().references(() => departmentTable.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => taskCategoryTable.id, { onDelete: 'set null' }),
  parentTaskId: text('parent_task_id'),
  roomId: text('room_id').references(() => roomTable.id, { onDelete: 'set null' }),
  roomNumber: text('room_number'),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  instructions: text('instructions'),
  notes: text('notes'),
  priority: text('priority').notNull().default('normal'), // 'low' | 'normal' | 'urgent' | 'safety_critical'
  status: text('status').notNull().default('submitted'), // 'submitted' | 'assigned' | 'in_progress' | 'on_the_way' | 'completed' | 'blocked' | 'cancelled' | 'reopened'
  assigneeMembershipId: text('assignee_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  assigneeName: text('assignee_name'),
  guestVisible: boolean('guest_visible').notNull().default(true),
  source: text('source').default('guest_portal'),
  blockerReason: text('blocker_reason'),
  blockerPhotoUrl: text('blocker_photo_url'),
  acknowledgementDueAt: timestamp('acknowledgement_due_at', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  completionDueAt: timestamp('completion_due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('dept_task_prop_id_uk').on(t.propertyId, t.id),
  index('dept_task_queue_idx').on(t.propertyId, t.status, t.completionDueAt),
  index('dept_task_assignee_idx').on(t.propertyId, t.assigneeMembershipId, t.status),
  index('dept_task_department_idx').on(t.propertyId, t.departmentId, t.status),
  index('dept_task_room_idx').on(t.roomId),
  index('dept_task_stay_idx').on(t.stayId),
  foreignKey({
    name: 'dept_task_parent_fk',
    columns: [t.parentTaskId],
    foreignColumns: [t.id],
  }),
]);

/**
 * 6. Task Event Entity
 * Immutable audit trail recording state transitions, fulfiller assignments, checklist completions, and blockers.
 */
export const taskEventTable = pgTable('task_event', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  taskId: text('task_id').notNull().references(() => departmentTaskTable.id, { onDelete: 'cascade' }),
  actorMembershipId: text('actor_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(), // 'submitted' | 'assigned' | 'acknowledged' | 'started' | 'on_the_way' | 'completed' | 'blocked' | 'reopened' | 'cancelled'
  fromStatus: text('from_status'),
  toStatus: text('to_status'),
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('task_event_task_timeline_idx').on(t.taskId, t.occurredAt),
]);

/**
 * 7. Task Checklist Item Entity
 * Mandatory or optional checklist steps for cleaning turnovers, technical procedures, or inspections.
 */
export const taskChecklistItemTable = pgTable('task_checklist_item', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  taskId: text('task_id').notNull().references(() => departmentTaskTable.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  required: boolean('required').notNull().default(true),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedByMembershipId: text('completed_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  notes: text('notes'),
}, (t) => [
  index('checklist_task_idx').on(t.taskId),
]);

/**
 * 8. SLA Policy Entity
 * Service Level Agreement policy per task category with acknowledgment and completion windows.
 */
export const slaPolicyTable = pgTable('sla_policy', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => taskCategoryTable.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  priority: text('priority').notNull().default('normal'),
  acknowledgementSeconds: integer('acknowledgement_seconds').notNull().default(900), // 15 min
  completionSeconds: integer('completion_seconds').notNull().default(2700), // 45 min
  warningSeconds: integer('warning_seconds').notNull().default(1800), // 30 min
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('sla_policy_prop_cat_ver_uk').on(t.propertyId, t.categoryId, t.version, t.priority),
]);

/**
 * 9. Coverage Contact Entity
 * Duty roster contact tree mapping who receives escalations during each shift.
 */
export const coverageContactTable = pgTable('coverage_contact', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').notNull().references(() => departmentTable.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => taskCategoryTable.id, { onDelete: 'set null' }),
  shiftId: text('shift_id').references(() => shiftTable.id, { onDelete: 'set null' }),
  primaryMembershipId: text('primary_membership_id').notNull().references(() => staffMembershipTable.id, { onDelete: 'cascade' }),
  backupMembershipId: text('backup_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  escalationLevel: integer('escalation_level').notNull().default(1), // 1 = Supervisor, 2 = Duty Manager, 3 = GM
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 10. Escalation Entity
 * Active breach alert triggered when a response or resolution SLA is breached.
 */
export const escalationTable = pgTable('escalation', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'ES-502-08112026'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  taskId: text('task_id').notNull().references(() => departmentTaskTable.id, { onDelete: 'cascade' }),
  recipientMembershipId: text('recipient_membership_id').notNull().references(() => staffMembershipTable.id, { onDelete: 'cascade' }),
  escalationLevel: integer('escalation_level').notNull().default(1),
  triggerCode: text('trigger_code').notNull(), // 'ack_breach' | 'resolution_breach' | 'manual_vip' | 'guest_complaint'
  title: text('title').notNull(),
  severity: text('severity').notNull().default('urgent'),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  deliveryStatus: text('delivery_status').notNull().default('sent'), // 'pending' | 'sent' | 'acknowledged' | 'resolved'
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('escalation_prop_status_idx').on(t.propertyId, t.deliveryStatus),
]);

/**
 * 11. Shift Handover Entity
 * Structured handover log transferring responsibility between shifts or duty managers.
 */
export const shiftHandoverTable = pgTable('shift_handover', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').notNull().references(() => departmentTable.id, { onDelete: 'cascade' }),
  outgoingShiftId: text('outgoing_shift_id').references(() => shiftTable.id, { onDelete: 'set null' }),
  incomingShiftId: text('incoming_shift_id').references(() => shiftTable.id, { onDelete: 'set null' }),
  fromMembershipId: text('from_membership_id').notNull().references(() => staffMembershipTable.id, { onDelete: 'cascade' }),
  nextOwnerMembershipId: text('next_owner_membership_id').notNull().references(() => staffMembershipTable.id, { onDelete: 'cascade' }),
  backupMembershipId: text('backup_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  summary: text('summary').notNull(),
  openTasksCount: integer('open_tasks_count').notNull().default(0),
  criticalNotes: text('critical_notes'),
  nextAction: text('next_action'),
  eta: timestamp('eta', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 12. Property Incident Entity
 * Safety, security, or physical property emergencies (Protocol E-1 SOS, panic alarms, leaks).
 */
export const incidentTable = pgTable('incident', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'INC-2026-001'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  caseId: text('case_id').references(() => guestCaseTable.id, { onDelete: 'set null' }),
  relatedTaskRef: text('related_task_ref'),
  title: text('title').notNull(),
  severity: text('severity').notNull().default('moderate'), // 'minor' | 'moderate' | 'major' | 'critical'
  status: text('status').notNull().default('investigating'), // 'investigating' | 'contained' | 'resolved'
  affectedArea: text('affected_area').notNull(),
  department: text('department').notNull(),
  coordinator: text('coordinator').notNull(),
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('incident_prop_id_uk').on(t.propertyId, t.id),
  index('incident_prop_status_idx').on(t.propertyId, t.status),
]);

/**
 * 13. Incident Access Entity
 * Restricted access control vault protecting sensitive incident evidence and recordings.
 */
export const incidentAccessTable = pgTable('incident_access', {
  incidentId: text('incident_id').notNull().references(() => incidentTable.id, { onDelete: 'cascade' }),
  membershipId: text('membership_id').notNull().references(() => staffMembershipTable.id, { onDelete: 'cascade' }),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  approvedByMembershipId: text('approved_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  accessLevel: text('access_level').notNull().default('read_only'), // 'read_only' | 'responder' | 'lead'
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (t) => [
  primaryKey({ columns: [t.incidentId, t.membershipId] }),
]);

/**
 * 14. Incident Action Entity
 * Chronological containment, dispatch, and mitigation events logged during an incident.
 */
export const incidentActionTable = pgTable('incident_action', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  incidentId: text('incident_id').notNull().references(() => incidentTable.id, { onDelete: 'cascade' }),
  actorMembershipId: text('actor_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  actorName: text('actor_name').notNull(),
  actionType: text('action_type').notNull(), // 'log' | 'dispatch' | 'containment' | 'medical_evac' | 'resolved'
  description: text('description').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('incident_action_timeline_idx').on(t.incidentId, t.occurredAt),
]);

/**
 * 15. Incident Evidence Entity
 * Links quarantined photos, video clips, and sensor telemetry to an incident.
 */
export const incidentEvidenceTable = pgTable('incident_evidence', {
  incidentId: text('incident_id').notNull().references(() => incidentTable.id, { onDelete: 'cascade' }),
  attachmentId: text('attachment_id').notNull(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  recordedByMembershipId: text('recorded_by_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  caption: text('caption'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.incidentId, t.attachmentId] }),
]);

/**
 * 16. Maintenance Asset Entity (F25)
 * Physical equipment registry: chillers, HVAC fan coils, elevators, kitchen refrigeration.
 */
export const maintenanceAssetTable = pgTable('maintenance_asset', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').references(() => departmentTable.id, { onDelete: 'set null' }),
  name: text('name').notNull(), // e.g. 'Presidential Suite HVAC Chiller Unit #2'
  assetCode: text('asset_code').notNull().unique(), // e.g. 'EQ-HVAC-02'
  category: text('category').notNull(), // 'HVAC' | 'Electrical' | 'Plumbing' | 'Kitchen' | 'Elevator'
  location: text('location').notNull(),
  status: text('status').notNull().default('operational'), // 'operational' | 'degraded' | 'under_repair' | 'out_of_service'
  intervalDays: integer('interval_days').notNull().default(30),
  lastServicedAt: timestamp('last_serviced_at', { withTimezone: true }),
  nextDueAt: timestamp('next_due_at', { withTimezone: true }).notNull(),
  activeWorkOrderRef: text('active_work_order_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('maint_asset_prop_status_idx').on(t.propertyId, t.status),
]);

/**
 * 17. Dining Menu Item Entity (F28)
 * In-room dining and outlet menu items with pricing, allergen matrix, and live 86'd status.
 */
export const diningMenuItemTable = pgTable('dining_menu_item', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  outletId: text('outlet_id').references(() => outletTable.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Starters' | 'Mains' | 'Desserts' | 'Beverages' | 'Room Service Specials'
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  isVegetarian: boolean('is_vegetarian').notNull().default(false),
  isVegan: boolean('is_vegan').notNull().default(false),
  isGlutenFree: boolean('is_gluten_free').notNull().default(false),
  allergens: text('allergens').array(),
  calories: integer('calories'),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').notNull().default(true),
  is86ed: boolean('is_86ed').notNull().default(false),
  preparationMinutes: integer('preparation_minutes').notNull().default(20),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('dining_menu_outlet_cat_idx').on(t.outletId, t.category),
]);

/**
 * 18. Dining Order Entity (F29)
 * Kitchen Display System (KDS) and in-room dining orders with status tracking.
 */
export const diningOrderTable = pgTable('dining_order', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. 'ORD-2026-402-01'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
  roomNumber: text('room_number').notNull(),
  outletId: text('outlet_id').references(() => outletTable.id, { onDelete: 'set null' }),
  guestName: text('guest_name').notNull(),
  status: text('status').notNull().default('received'), // 'received' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled'
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
  estimatedDeliveryAt: timestamp('estimated_delivery_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  relatedTaskId: text('related_task_id').references(() => departmentTaskTable.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('dining_order_prop_status_idx').on(t.propertyId, t.status),
  index('dining_order_stay_idx').on(t.stayId),
]);

/**
 * 19. Dining Order Item Entity
 * Line items within a dining order.
 */
export const diningOrderItemTable = pgTable('dining_order_item', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  orderId: text('order_id').notNull().references(() => diningOrderTable.id, { onDelete: 'cascade' }),
  menuItemId: text('menu_item_id').notNull().references(() => diningMenuItemTable.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  specialRequests: text('special_requests'),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

/**
 * 20. Supervisor Inspection Entity (F21 / F22)
 * Quality assurance checklists for room turnovers, deep cleans, and VIP pre-arrival sign-offs.
 */
export const supervisorInspectionTable = pgTable('supervisor_inspection', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  ref: text('ref').notNull().unique(), // e.g. 'INSP-402-081126'
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  taskId: text('task_id').references(() => departmentTaskTable.id, { onDelete: 'set null' }),
  roomId: text('room_id').references(() => roomTable.id, { onDelete: 'set null' }),
  roomNumber: text('room_number').notNull(),
  roomType: text('room_type').notNull(),
  floor: integer('floor').notNull(),
  floorZone: text('floor_zone'),
  attendantName: text('attendant_name').notNull(),
  attendantId: text('attendant_id').notNull(),
  supervisorMembershipId: text('supervisor_membership_id').references(() => staffMembershipTable.id, { onDelete: 'set null' }),
  supervisorName: text('supervisor_name'),
  type: text('type').notNull().default('checkout'), // 'checkout' | 'daily' | 'deep_clean' | 'vip_arrival'
  status: text('status').notNull().default('pending'), // 'pending' | 'passed' | 'reopened' | 'escalated'
  score: integer('score'),
  checklist: jsonb('checklist').notNull().default([]),
  notes: text('notes'),
  reopenReason: text('reopen_reason'),
  deadline: text('deadline'), // Clock deadline e.g. '04:30 PM'
  inspectedAt: timestamp('inspected_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('inspection_prop_status_idx').on(t.propertyId, t.status),
  index('inspection_room_idx').on(t.roomId),
]);

/**
 * 21. Wellness & Spa Booking Entity
 * Manages spa treatments, therapist assignments, treatment rooms, and guest appointments.
 */
export const wellnessBookingTable = pgTable('wellness_booking', {
  id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertyTable.id, { onDelete: 'cascade' }),
  stayId: text('stay_id').references(() => stayContextTable.id, { onDelete: 'set null' }),
  guestName: text('guest_name').notNull(),
  roomNumber: text('room_number').notNull(),
  treatment: text('treatment').notNull(), // e.g. 'Ayurvedic Abhyanga Massage'
  therapistId: text('therapist_id'),
  therapistName: text('therapist_name'),
  treatmentRoom: text('treatment_room').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  status: text('status').notNull().default('booked'), // 'booked' | 'in_service' | 'completed' | 'cancelled'
  price: numeric('price', { precision: 10, scale: 2 }),
  taskRef: text('task_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('wellness_stay_idx').on(t.stayId),
  index('wellness_time_idx').on(t.startTime),
]);

// Inferred TypeScript Types for Domain 2
export type TaskCategory = typeof taskCategoryTable.$inferSelect;
export type InsertTaskCategory = typeof taskCategoryTable.$inferInsert;

export type GuestCase = typeof guestCaseTable.$inferSelect;
export type InsertGuestCase = typeof guestCaseTable.$inferInsert;

export type CaseMessage = typeof caseMessageTable.$inferSelect;
export type InsertCaseMessage = typeof caseMessageTable.$inferInsert;

export type CaseLink = typeof caseLinkTable.$inferSelect;
export type InsertCaseLink = typeof caseLinkTable.$inferInsert;

export type DepartmentTask = typeof departmentTaskTable.$inferSelect;
export type InsertDepartmentTask = typeof departmentTaskTable.$inferInsert;

export type TaskEvent = typeof taskEventTable.$inferSelect;
export type InsertTaskEvent = typeof taskEventTable.$inferInsert;

export type TaskChecklistItem = typeof taskChecklistItemTable.$inferSelect;
export type InsertTaskChecklistItem = typeof taskChecklistItemTable.$inferInsert;

export type SlaPolicy = typeof slaPolicyTable.$inferSelect;
export type InsertSlaPolicy = typeof slaPolicyTable.$inferInsert;

export type CoverageContact = typeof coverageContactTable.$inferSelect;
export type InsertCoverageContact = typeof coverageContactTable.$inferInsert;

export type Escalation = typeof escalationTable.$inferSelect;
export type InsertEscalation = typeof escalationTable.$inferInsert;

export type ShiftHandover = typeof shiftHandoverTable.$inferSelect;
export type InsertShiftHandover = typeof shiftHandoverTable.$inferInsert;

export type Incident = typeof incidentTable.$inferSelect;
export type InsertIncident = typeof incidentTable.$inferInsert;

export type IncidentAccess = typeof incidentAccessTable.$inferSelect;
export type InsertIncidentAccess = typeof incidentAccessTable.$inferInsert;

export type IncidentAction = typeof incidentActionTable.$inferSelect;
export type InsertIncidentAction = typeof incidentActionTable.$inferInsert;

export type IncidentEvidence = typeof incidentEvidenceTable.$inferSelect;
export type InsertIncidentEvidence = typeof incidentEvidenceTable.$inferInsert;

export type MaintenanceAsset = typeof maintenanceAssetTable.$inferSelect;
export type InsertMaintenanceAsset = typeof maintenanceAssetTable.$inferInsert;

export type DiningMenuItem = typeof diningMenuItemTable.$inferSelect;
export type InsertDiningMenuItem = typeof diningMenuItemTable.$inferInsert;

export type DiningOrder = typeof diningOrderTable.$inferSelect;
export type InsertDiningOrder = typeof diningOrderTable.$inferInsert;

export type DiningOrderItem = typeof diningOrderItemTable.$inferSelect;
export type InsertDiningOrderItem = typeof diningOrderItemTable.$inferInsert;

export type SupervisorInspection = typeof supervisorInspectionTable.$inferSelect;
export type InsertSupervisorInspection = typeof supervisorInspectionTable.$inferInsert;

export type WellnessBooking = typeof wellnessBookingTable.$inferSelect;
export type InsertWellnessBooking = typeof wellnessBookingTable.$inferInsert;
