import type {
  AuditEvent,
  DemoState,
  GuestHistoryEntry,
  InAppNotification,
  IncidentRecord,
  IntegrationState,
  LostFoundItem,
  OrderLine,
  ResourceRequest,
  RoleId,
  RoutingRule,
  ShiftHandover,
  StaffAccount,
  ThemeMode,
  Transition,
  WorkflowConfig,
  WorkItem,
  FinanceInvoice,
  FinanceTransaction,
  FinanceRefundRequest,
  SupervisorInspection,
  PaymentMethod,
  TransactionStatus,
  InvoiceStatus,
  RefundStatus,
} from '../types/demo.ts';

export interface LifecycleStep {
  status: string;
  delayMs: number;
  chip?: string;
  tone?: WorkItem['tone'];
}

export interface GuestRequestInput {
  room: string;
  title: string;
  meta: string;
  category: NonNullable<WorkItem['category']>;
  description?: string;
  priority?: WorkItem['priority'];
  dnd?: boolean;
  photoAttached?: boolean;
  chip?: string;
  tone?: WorkItem['tone'];
  /** optional immediate charge posted to the room folio (e.g. a spa booking) */
  folioCharge?: { label: string; amount: number };
  /** override the default simulated status timeline */
  lifecycle?: LifecycleStep[];
}

export interface DemoApi {
 setRoomDnd:(room:string,enabled:boolean)=>void;
 submitEnquiry:(input:{kind:string;name:string;details:string;subject?:string})=>string;
 savePreferences:(section:string,prefs:Record<string,unknown>)=>void;
 flagWorkload:(staffId:string)=>void;
 setResponderStatus:(status:string)=>void;
 systemDiagnostic:()=>void;
  state: DemoState;
  hydrated: boolean;
  setPersona: (id: RoleId) => void;
  advance: (roleId: RoleId, itemId: string, t: Transition, reason?: string) => void;
  cycleIntegration: (id: string) => void;
  reset: () => void;
  notify: (text: string) => void;
  setTheme: (theme: ThemeMode) => void;
  submitGuestRequest: (input: GuestRequestInput) => string;
  placeRoomServiceOrder: (room: string, lines: OrderLine[], note?: string) => string;
  cancelGuestItem: (roleId: RoleId, itemId: string) => void;
  submitGuestFeedback: (roleId: RoleId, itemId: string, rating: number, comment?: string) => void;
  disputeFolioCharge: (room: string, lineId: string, reason: string) => void;
  claimLostItem: (room: string, itemId: string) => void;
  addLostFoundItem: (item: Omit<LostFoundItem, 'id' | 'claimed' | 'claimedRoom' | 'loggedBy'>) => void;
  expressCheckout: (room: string, guestName: string) => void;
  /** Runs a pure Front Desk reducer (src/lib/frontDesk.ts) against the shared state. Returns an error message or null. */
  fdAction: (command: string, args: unknown[]) => string | null;
  /** Admin User & Role Management (ER_DIAGRAMS Domain 1 / Admin and IT workflow) */
  toggleStaffStatus: (id: string) => void;
  updateStaffRole: (id: string, roleId: RoleId, department: string, floorZone: string, shift: StaffAccount['shift']) => void;
  addStaffAccount: (account: Omit<StaffAccount, 'id' | 'createdAt'>) => void;
  /** Admin Workflow & SLA Configuration (Admin and IT workflow) */
  updateWorkflowConfig: (partial: Partial<WorkflowConfig>) => void;
  /** Admin QR lifecycle management (SECURITY.md / ER_DIAGRAMS Domain 2) */
  revokeRoomSession: (room: string) => void;
  restoreRoomSession: (room: string) => void;
  /** Admin Integration & Diagnostic Ping (Admin and IT workflow) */
  setIntegrationState: (id: string, next: IntegrationState) => void;
  testConnector: (connectorId: string) => void;
  simulateTestTask: (department: string, priority?: WorkItem['priority']) => void;
  recordAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  /** Fulfiller & Mobile Workflow APIs */
  setSoundEnabled: (enabled: boolean) => void;
  setFulfillerAvailability: (status: 'on_duty' | 'break' | 'off_duty') => void;
  requestTaskReassignment: (itemId: string, reason: string) => void;
  resolveReassignment: (supervisorItemId: string, fulfillerItemId: string, approved: boolean) => void;
  requestEmergencyShiftChange: (reason: string, details?: string) => void;
  attachTaskPhoto: (roleId: RoleId, itemId: string, dataUrl: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: (roleId?: RoleId) => void;
  /** Department Dispatcher & Workload Orchestration APIs */
  assignDispatcherTask: (taskId: string, staffId: string) => void;
  autoAssignTask: (taskId: string) => { success: boolean; staffName?: string; reason?: string };
  autoAssignAllPending: () => { assignedCount: number; unassignedCount: number };
  reassignDispatcherTask: (taskId: string, newStaffId: string, reason?: string) => void;
  linkDuplicateTask: (taskId: string, parentRef: string) => void;
  escalateTaskToManager: (taskId: string, reason: string) => void;
  redistributeUnstartedTasks: (department?: string) => { movedCount: number; message: string };
  toggleRoutingRule: (ruleId: string) => void;
  updateStaffAvailability: (staffId: string, availability: 'on_duty' | 'break' | 'off_duty') => void;
  updateStaffCapacity: (staffId: string, maxWorkload: number) => void;
  /** Department Manager & Duty Manager Operations APIs */
  reviewResourceRequest: (requestId: string, action: 'approve' | 'reject', reviewNotes?: string) => void;
  createResourceRequest: (request: Omit<ResourceRequest, 'id' | 'requestedAt' | 'status'>) => void;
  submitShiftHandover: (handover: Omit<ShiftHandover, 'id' | 'timestamp' | 'status'>) => void;
  acknowledgeShiftHandover: (handoverId: string) => void;
  resolveComplaintCase: (complaintId: string, resolutionNotes: string, approvedComp?: number) => void;
  addManagerNote: (taskId: string, noteText: string) => void;
  updateIncidentStatus: (incidentId: string, status: IncidentRecord['status'], noteText?: string) => void;
  /** Executive Viewer / Approver Operations APIs */
  reviewExecutiveItem: (itemId: string, action: 'approve' | 'reject' | 'info_requested', reason?: string, comments?: string) => void;
  addExecutiveComment: (itemId: string, comment: string) => void;
  requestExecutiveDirective: (targetId: string, type: 'incident' | 'complaint' | 'department', directiveText: string) => void;
  /** Security Responder Operations APIs */
  acknowledgeSecurityItem: (itemId: string) => void;
  arriveSecurityItem: (itemId: string) => void;
  resolveSecurityItem: (itemId: string, report: { summary: string; observations: string; actionsTaken: string; outcome: string; followUp?: string; witnessDetails?: string; photoUrl?: string }) => void;
  requestSecurityBackup: (itemId: string, reason: string) => void;
  escalateSecurityItem: (itemId: string, reason: string, notes?: string) => void;
  addSecurityNote: (itemId: string, text: string) => void;
  createSecurityIncident: (incident: { title: string; category: string; severity: 'minor' | 'moderate' | 'major' | 'critical'; location: string; floor?: number; room?: string; description: string }) => void;
  /** Financial Operator Operations APIs */
  recordInvoicePayment: (invoiceId: string, amount: number, paymentMethod: PaymentMethod, referenceNumber: string, notes?: string) => void;
  createInvoice: (invoice: Omit<FinanceInvoice, 'id' | 'createdAt' | 'outstandingBalance'>) => void;
  reviewRefundRequest: (refundId: string, action: 'approve' | 'reject' | 'execute', notes?: string, rejectionReason?: string) => void;
  updateTransactionStatus: (txnId: string, status: TransactionStatus, notes?: string) => void;
  reconcileTransaction: (txnId: string) => void;
  /** Department Supervisor Operations APIs */
  approveInspection: (inspectionId: string, notes?: string) => void;
  reopenInspection: (inspectionId: string, reason: string, correctiveAction: string, reassignToStaffId?: string) => void;
  reviewFulfillerReassignment: (taskId: string, action: 'reassign' | 'reject', newAssigneeId?: string, notes?: string) => void;
  escalateSupervisorIssue: (issue: { title: string; room?: string; priority: 'urgent' | 'critical'; reason: string; notes?: string }) => void;
}
