import { relations } from 'drizzle-orm';
import {
  propertyTable,
  departmentTable,
  outletTable,
  floorTable,
  roomTable,
  shiftTable,
  staffAccountTable,
  staffMembershipTable,
  profileTable,
  permissionTable,
  profilePermissionTable,
  profileGrantTable,
  grantScopeTable,
  financialLimitTable,
  auditEventTable,
  connectorOutboxTable,
} from './01_identity.ts';
import {
  taskCategoryTable,
  guestCaseTable,
  caseMessageTable,
  caseLinkTable,
  departmentTaskTable,
  taskEventTable,
  taskChecklistItemTable,
  slaPolicyTable,
  coverageContactTable,
  escalationTable,
  shiftHandoverTable,
  incidentTable,
  incidentAccessTable,
  incidentActionTable,
  incidentEvidenceTable,
  maintenanceAssetTable,
  diningMenuItemTable,
  diningOrderTable,
  diningOrderItemTable,
  supervisorInspectionTable,
  wellnessBookingTable,
} from './02_operations.ts';
import {
  stayContextTable,
  roomAssignmentTable,
  qrMappingTable,
  guestSessionTable,
  guestReminderTable,
  lostFoundItemTable,
  emergencyBroadcastTable,
  attachmentTable,
  folioAdjustmentTable,
  financialExceptionTable,
  financialApprovalTable,
  financialExecutionTable,
  financialEvidenceTable,
  reconciliationTable,
  guestFeedbackTable,
  vipDirectivesTable,
} from './03_finance.ts';

/**
 * ============================================================================
 * UNIFIED DRIZZLE ORM RELATIONS GRAPH
 * Establishes typed relationships across all 3 domains for nested relational queries
 * ============================================================================
 */

// 1. Property Relations
export const propertyRelations = relations(propertyTable, ({ many }) => ({
  departments: many(departmentTable),
  outlets: many(outletTable),
  floors: many(floorTable),
  rooms: many(roomTable),
  shifts: many(shiftTable),
  staffMemberships: many(staffMembershipTable),
  stays: many(stayContextTable),
  tasks: many(departmentTaskTable),
  cases: many(guestCaseTable),
  incidents: many(incidentTable),
  financialExceptions: many(financialExceptionTable),
  diningOrders: many(diningOrderTable),
  reminders: many(guestReminderTable),
  lostFoundItems: many(lostFoundItemTable),
  emergencyBroadcasts: many(emergencyBroadcastTable),
  auditEvents: many(auditEventTable),
  outboxEvents: many(connectorOutboxTable),
  vipDirectives: many(vipDirectivesTable),
}));

// 2. Department Relations
export const departmentRelations = relations(departmentTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [departmentTable.propertyId],
    references: [propertyTable.id],
  }),
  outlets: many(outletTable),
  taskCategories: many(taskCategoryTable),
  tasks: many(departmentTaskTable),
  staffMemberships: many(staffMembershipTable),
  shiftHandovers: many(shiftHandoverTable),
  maintenanceAssets: many(maintenanceAssetTable),
}));

// 3. Outlet Relations
export const outletRelations = relations(outletTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [outletTable.propertyId],
    references: [propertyTable.id],
  }),
  department: one(departmentTable, {
    fields: [outletTable.departmentId],
    references: [departmentTable.id],
  }),
  menuItems: many(diningMenuItemTable),
  diningOrders: many(diningOrderTable),
}));

// 4. Floor Relations
export const floorRelations = relations(floorTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [floorTable.propertyId],
    references: [propertyTable.id],
  }),
  rooms: many(roomTable),
}));

// 5. Room Relations
export const roomRelations = relations(roomTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [roomTable.propertyId],
    references: [propertyTable.id],
  }),
  floor: one(floorTable, {
    fields: [roomTable.floorId],
    references: [floorTable.id],
  }),
  assignments: many(roomAssignmentTable),
  tasks: many(departmentTaskTable),
  cases: many(guestCaseTable),
  inspections: many(supervisorInspectionTable),
  qrMappings: many(qrMappingTable),
}));

// 6. Shift Relations
export const shiftRelations = relations(shiftTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [shiftTable.propertyId],
    references: [propertyTable.id],
  }),
  outgoingHandovers: many(shiftHandoverTable, { relationName: 'outgoingShift' }),
  incomingHandovers: many(shiftHandoverTable, { relationName: 'incomingShift' }),
  coverageContacts: many(coverageContactTable),
}));

// 7. Staff Account Relations
export const staffAccountRelations = relations(staffAccountTable, ({ many }) => ({
  memberships: many(staffMembershipTable),
}));

// 8. Staff Membership Relations
export const staffMembershipRelations = relations(staffMembershipTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [staffMembershipTable.propertyId],
    references: [propertyTable.id],
  }),
  staffAccount: one(staffAccountTable, {
    fields: [staffMembershipTable.staffAccountId],
    references: [staffAccountTable.id],
  }),
  department: one(departmentTable, {
    fields: [staffMembershipTable.departmentId],
    references: [departmentTable.id],
  }),
  manager: one(staffMembershipTable, {
    fields: [staffMembershipTable.managerMembershipId],
    references: [staffMembershipTable.id],
    relationName: 'manager',
  }),
  subordinates: many(staffMembershipTable, { relationName: 'manager' }),
  assignedTasks: many(departmentTaskTable),
  profileGrants: many(profileGrantTable),
  conductedInspections: many(supervisorInspectionTable),
  reportedActions: many(incidentActionTable),
}));

// 9. Profile & Permission Relations
export const profileRelations = relations(profileTable, ({ many }) => ({
  permissions: many(profilePermissionTable),
  grants: many(profileGrantTable),
}));

export const permissionRelations = relations(permissionTable, ({ many }) => ({
  profiles: many(profilePermissionTable),
}));

export const profilePermissionRelations = relations(profilePermissionTable, ({ one }) => ({
  profile: one(profileTable, {
    fields: [profilePermissionTable.profileId],
    references: [profileTable.id],
  }),
  permission: one(permissionTable, {
    fields: [profilePermissionTable.permissionCode],
    references: [permissionTable.code],
  }),
}));

export const profileGrantRelations = relations(profileGrantTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [profileGrantTable.propertyId],
    references: [propertyTable.id],
  }),
  membership: one(staffMembershipTable, {
    fields: [profileGrantTable.membershipId],
    references: [staffMembershipTable.id],
  }),
  profile: one(profileTable, {
    fields: [profileGrantTable.profileId],
    references: [profileTable.id],
  }),
  approver: one(staffMembershipTable, {
    fields: [profileGrantTable.approvedByMembershipId],
    references: [staffMembershipTable.id],
  }),
  scope: one(grantScopeTable),
  financialLimits: many(financialLimitTable),
}));

export const grantScopeRelations = relations(grantScopeTable, ({ one }) => ({
  grant: one(profileGrantTable, {
    fields: [grantScopeTable.profileGrantId],
    references: [profileGrantTable.id],
  }),
  department: one(departmentTable, {
    fields: [grantScopeTable.departmentId],
    references: [departmentTable.id],
  }),
  outlet: one(outletTable, {
    fields: [grantScopeTable.outletId],
    references: [outletTable.id],
  }),
  floor: one(floorTable, {
    fields: [grantScopeTable.floorId],
    references: [floorTable.id],
  }),
  shift: one(shiftTable, {
    fields: [grantScopeTable.shiftId],
    references: [shiftTable.id],
  }),
}));

// 10. Stay Context Relations
export const stayContextRelations = relations(stayContextTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [stayContextTable.propertyId],
    references: [propertyTable.id],
  }),
  roomAssignments: many(roomAssignmentTable),
  guestSessions: many(guestSessionTable),
  cases: many(guestCaseTable),
  tasks: many(departmentTaskTable),
  reminders: many(guestReminderTable),
  diningOrders: many(diningOrderTable),
  folioAdjustments: many(folioAdjustmentTable),
  financialExceptions: many(financialExceptionTable),
  feedback: many(guestFeedbackTable),
  wellnessBookings: many(wellnessBookingTable),
}));

export const roomAssignmentRelations = relations(roomAssignmentTable, ({ one }) => ({
  stay: one(stayContextTable, {
    fields: [roomAssignmentTable.stayId],
    references: [stayContextTable.id],
  }),
  room: one(roomTable, {
    fields: [roomAssignmentTable.roomId],
    references: [roomTable.id],
  }),
}));

export const qrMappingRelations = relations(qrMappingTable, ({ one }) => ({
  property: one(propertyTable, {
    fields: [qrMappingTable.propertyId],
    references: [propertyTable.id],
  }),
  room: one(roomTable, {
    fields: [qrMappingTable.roomId],
    references: [roomTable.id],
  }),
}));

export const guestSessionRelations = relations(guestSessionTable, ({ one }) => ({
  stay: one(stayContextTable, {
    fields: [guestSessionTable.stayId],
    references: [stayContextTable.id],
  }),
  room: one(roomTable, {
    fields: [guestSessionTable.roomId],
    references: [roomTable.id],
  }),
}));

// 11. Guest Case & Messaging Relations
export const guestCaseRelations = relations(guestCaseTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [guestCaseTable.propertyId],
    references: [propertyTable.id],
  }),
  stay: one(stayContextTable, {
    fields: [guestCaseTable.stayId],
    references: [stayContextTable.id],
  }),
  room: one(roomTable, {
    fields: [guestCaseTable.roomId],
    references: [roomTable.id],
  }),
  owner: one(staffMembershipTable, {
    fields: [guestCaseTable.ownerMembershipId],
    references: [staffMembershipTable.id],
  }),
  tasks: many(departmentTaskTable),
  messages: many(caseMessageTable),
  sourceLinks: many(caseLinkTable, { relationName: 'sourceCase' }),
  targetLinks: many(caseLinkTable, { relationName: 'targetCase' }),
  incidents: many(incidentTable),
  financialExceptions: many(financialExceptionTable),
}));

export const caseMessageRelations = relations(caseMessageTable, ({ one }) => ({
  case: one(guestCaseTable, {
    fields: [caseMessageTable.caseId],
    references: [guestCaseTable.id],
  }),
  author: one(staffMembershipTable, {
    fields: [caseMessageTable.authorMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

export const caseLinkRelations = relations(caseLinkTable, ({ one }) => ({
  sourceCase: one(guestCaseTable, {
    fields: [caseLinkTable.sourceCaseId],
    references: [guestCaseTable.id],
    relationName: 'sourceCase',
  }),
  targetCase: one(guestCaseTable, {
    fields: [caseLinkTable.targetCaseId],
    references: [guestCaseTable.id],
    relationName: 'targetCase',
  }),
}));

// 12. Department Task Relations (Canonical Task Engine)
export const departmentTaskRelations = relations(departmentTaskTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [departmentTaskTable.propertyId],
    references: [propertyTable.id],
  }),
  case: one(guestCaseTable, {
    fields: [departmentTaskTable.caseId],
    references: [guestCaseTable.id],
  }),
  department: one(departmentTable, {
    fields: [departmentTaskTable.departmentId],
    references: [departmentTable.id],
  }),
  category: one(taskCategoryTable, {
    fields: [departmentTaskTable.categoryId],
    references: [taskCategoryTable.id],
  }),
  room: one(roomTable, {
    fields: [departmentTaskTable.roomId],
    references: [roomTable.id],
  }),
  stay: one(stayContextTable, {
    fields: [departmentTaskTable.stayId],
    references: [stayContextTable.id],
  }),
  assignee: one(staffMembershipTable, {
    fields: [departmentTaskTable.assigneeMembershipId],
    references: [staffMembershipTable.id],
  }),
  parentTask: one(departmentTaskTable, {
    fields: [departmentTaskTable.parentTaskId],
    references: [departmentTaskTable.id],
    relationName: 'subtasks',
  }),
  subtasks: many(departmentTaskTable, { relationName: 'subtasks' }),
  events: many(taskEventTable),
  checklistItems: many(taskChecklistItemTable),
  escalations: many(escalationTable),
  inspections: many(supervisorInspectionTable),
}));

export const taskEventRelations = relations(taskEventTable, ({ one }) => ({
  task: one(departmentTaskTable, {
    fields: [taskEventTable.taskId],
    references: [departmentTaskTable.id],
  }),
  actor: one(staffMembershipTable, {
    fields: [taskEventTable.actorMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

export const taskChecklistItemRelations = relations(taskChecklistItemTable, ({ one }) => ({
  task: one(departmentTaskTable, {
    fields: [taskChecklistItemTable.taskId],
    references: [departmentTaskTable.id],
  }),
  completedBy: one(staffMembershipTable, {
    fields: [taskChecklistItemTable.completedByMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

export const taskCategoryRelations = relations(taskCategoryTable, ({ one, many }) => ({
  department: one(departmentTable, {
    fields: [taskCategoryTable.departmentId],
    references: [departmentTable.id],
  }),
  tasks: many(departmentTaskTable),
  slaPolicies: many(slaPolicyTable),
}));

export const slaPolicyRelations = relations(slaPolicyTable, ({ one }) => ({
  category: one(taskCategoryTable, {
    fields: [slaPolicyTable.categoryId],
    references: [taskCategoryTable.id],
  }),
}));

export const escalationRelations = relations(escalationTable, ({ one }) => ({
  task: one(departmentTaskTable, {
    fields: [escalationTable.taskId],
    references: [departmentTaskTable.id],
  }),
  recipient: one(staffMembershipTable, {
    fields: [escalationTable.recipientMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

// 13. Incident Relations
export const incidentRelations = relations(incidentTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [incidentTable.propertyId],
    references: [propertyTable.id],
  }),
  case: one(guestCaseTable, {
    fields: [incidentTable.caseId],
    references: [guestCaseTable.id],
  }),
  actions: many(incidentActionTable),
  evidence: many(incidentEvidenceTable),
  accessGrants: many(incidentAccessTable),
}));

export const incidentActionRelations = relations(incidentActionTable, ({ one }) => ({
  incident: one(incidentTable, {
    fields: [incidentActionTable.incidentId],
    references: [incidentTable.id],
  }),
  actor: one(staffMembershipTable, {
    fields: [incidentActionTable.actorMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

// 14. Dining Relations
export const diningMenuItemRelations = relations(diningMenuItemTable, ({ one, many }) => ({
  outlet: one(outletTable, {
    fields: [diningMenuItemTable.outletId],
    references: [outletTable.id],
  }),
  orderItems: many(diningOrderItemTable),
}));

export const diningOrderRelations = relations(diningOrderTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [diningOrderTable.propertyId],
    references: [propertyTable.id],
  }),
  stay: one(stayContextTable, {
    fields: [diningOrderTable.stayId],
    references: [stayContextTable.id],
  }),
  outlet: one(outletTable, {
    fields: [diningOrderTable.outletId],
    references: [outletTable.id],
  }),
  task: one(departmentTaskTable, {
    fields: [diningOrderTable.relatedTaskId],
    references: [departmentTaskTable.id],
  }),
  items: many(diningOrderItemTable),
}));

export const diningOrderItemRelations = relations(diningOrderItemTable, ({ one }) => ({
  order: one(diningOrderTable, {
    fields: [diningOrderItemTable.orderId],
    references: [diningOrderTable.id],
  }),
  menuItem: one(diningMenuItemTable, {
    fields: [diningOrderItemTable.menuItemId],
    references: [diningMenuItemTable.id],
  }),
}));

// 15. Financial Exception & Recovery Relations
export const financialExceptionRelations = relations(financialExceptionTable, ({ one, many }) => ({
  property: one(propertyTable, {
    fields: [financialExceptionTable.propertyId],
    references: [propertyTable.id],
  }),
  case: one(guestCaseTable, {
    fields: [financialExceptionTable.caseId],
    references: [guestCaseTable.id],
  }),
  stay: one(stayContextTable, {
    fields: [financialExceptionTable.stayId],
    references: [stayContextTable.id],
  }),
  requestedBy: one(staffMembershipTable, {
    fields: [financialExceptionTable.requestedByMembershipId],
    references: [staffMembershipTable.id],
  }),
  approvals: many(financialApprovalTable),
  executions: many(financialExecutionTable),
  evidence: many(financialEvidenceTable),
}));

export const financialApprovalRelations = relations(financialApprovalTable, ({ one, many }) => ({
  exception: one(financialExceptionTable, {
    fields: [financialApprovalTable.exceptionId],
    references: [financialExceptionTable.id],
  }),
  approver: one(staffMembershipTable, {
    fields: [financialApprovalTable.approverMembershipId],
    references: [staffMembershipTable.id],
  }),
  executions: many(financialExecutionTable),
}));

export const financialExecutionRelations = relations(financialExecutionTable, ({ one, many }) => ({
  exception: one(financialExceptionTable, {
    fields: [financialExecutionTable.exceptionId],
    references: [financialExceptionTable.id],
  }),
  approval: one(financialApprovalTable, {
    fields: [financialExecutionTable.approvalId],
    references: [financialApprovalTable.id],
  }),
  executor: one(staffMembershipTable, {
    fields: [financialExecutionTable.executorMembershipId],
    references: [staffMembershipTable.id],
  }),
  reconciliations: many(reconciliationTable),
}));

export const financialEvidenceRelations = relations(financialEvidenceTable, ({ one }) => ({
  exception: one(financialExceptionTable, {
    fields: [financialEvidenceTable.exceptionId],
    references: [financialExceptionTable.id],
  }),
  attachment: one(attachmentTable, {
    fields: [financialEvidenceTable.attachmentId],
    references: [attachmentTable.id],
  }),
}));

export const reconciliationRelations = relations(reconciliationTable, ({ one }) => ({
  execution: one(financialExecutionTable, {
    fields: [reconciliationTable.executionId],
    references: [financialExecutionTable.id],
  }),
  reviewer: one(staffMembershipTable, {
    fields: [reconciliationTable.reviewerMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

// 16. Inspection Relations
export const supervisorInspectionRelations = relations(supervisorInspectionTable, ({ one }) => ({
  task: one(departmentTaskTable, {
    fields: [supervisorInspectionTable.taskId],
    references: [departmentTaskTable.id],
  }),
  room: one(roomTable, {
    fields: [supervisorInspectionTable.roomId],
    references: [roomTable.id],
  }),
  supervisor: one(staffMembershipTable, {
    fields: [supervisorInspectionTable.supervisorMembershipId],
    references: [staffMembershipTable.id],
  }),
}));

// 17. Wellness Booking Relations
export const wellnessBookingRelations = relations(wellnessBookingTable, ({ one }) => ({
  stay: one(stayContextTable, {
    fields: [wellnessBookingTable.stayId],
    references: [stayContextTable.id],
  }),
}));

