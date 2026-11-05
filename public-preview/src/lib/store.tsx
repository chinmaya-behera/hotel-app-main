'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CircleCheck } from 'lucide-react';
import { INITIAL_DINING_CATEGORIES, INITIAL_DINING_MENU } from '@/components/guest/diningData';
import { seedEventsConfig } from '@/components/guest/eventsData';
import type { EventsCelebrationsConfig } from '@/types/demo';
import type { DiningMenuItem, DietaryType, AllergenType, PortionOption, MenuItemAddon } from '@/types/demo';
import {
  folioSeed,
  frontDeskSeed,
  integrationList,
  lostFoundSeed,
  seedAuditTrail,
  seedFeed,
  seedIncidents,
  seedIntegrations,
  seedItems,
  seedNotifications,
  seedResourceRequests,
  seedRoutingRules,
  seedShiftHandovers,
  seedStaffAccounts,
  seedWorkflowConfig,
  seedInvoices,
  seedTransactions,
  seedRefundRequests,
  seedInspections,
  seedHotelServices,
  seedGuestPreferences,
  seedCompensationRequests,
  seedShiftSchedules,
  seedDepartmentPolicies,
  seedGuestReminders,
  seedSafetyAlerts,
  MANAGER_COMPENSATION_THRESHOLD,
} from '@/lib/mockData';
import { afterAdvance, markCheckedOut, type FdResult } from '@/lib/frontDesk';
import { roleById } from '@/lib/roles';
import { applyManagerCommand, ensureManagerState, reviewManagerEscalation, type ManagerCommand, type ManagerDepartmentId } from '@/lib/manager-domain';
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
  GuestPreferences,
  HotelServiceItem,
  CompensationRequest,
  ShiftScheduleRecord,
  DepartmentServicePolicy,
  CompensationStatus,
  GuestReminder,
  SafetyAlertRecord,
  SafetyAlertStatus,
  Tone,
  GuestMessageRecord,
  DndHistoryRecord,
  GuestFrontDeskMessage,
  GuestComplaintRecord,
  GuestLostItemRecord,
  GuestNotification,
  HotelAlert,
  GuestFrontDeskReply,
  ComplaintCase,  ComplaintCategory,
  DispatcherDepartment,
} from '@/types/demo';

const STORAGE_KEY = 'grand-azure-demo-v1';

function seedState(): DemoState {
  return ensureManagerState(structuredClone({
    persona: null,
    items: seedItems,
    feed: seedFeed,
    integrations: seedIntegrations,
    revokedRooms: [] as string[],
    folios: folioSeed,
    lostFound: lostFoundSeed,
    theme: 'dark',
    frontDesk: frontDeskSeed,
    bookings: [],
    staffAccounts: seedStaffAccounts,
    auditTrail: seedAuditTrail,
    workflowConfig: seedWorkflowConfig,
    eventsConfig: seedEventsConfig,
    soundEnabled: true,
    fulfillerAvailability: 'on_duty',
    notifications: seedNotifications,
    shiftChangeRequest: null,
    routingRules: seedRoutingRules,
    resourceRequests: seedResourceRequests,
    shiftHandovers: seedShiftHandovers,
    incidents: seedIncidents,
    invoices: seedInvoices,
    transactions: seedTransactions,
    refundRequests: seedRefundRequests,
    inspections: seedInspections,
    hotelServices: seedHotelServices,
    guestPreferences: seedGuestPreferences,
    guestMessages: [],
    compensationRequests: seedCompensationRequests,
    shiftSchedules: seedShiftSchedules,
    departmentPolicies: seedDepartmentPolicies,
    guestReminders: seedGuestReminders,
    safetyAlerts: seedSafetyAlerts,
    diningMenu: INITIAL_DINING_MENU,
    diningCategories: INITIAL_DINING_CATEGORIES,
    activeDispatcherDept: 'Housekeeping' as DispatcherDepartment,
  }) as DemoState);
}

export interface Toast {
  id: number;
  text: string;
}

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
  photoUrl?: string;
  chip?: string;
  tone?: WorkItem['tone'];
  /** optional immediate charge posted to the room folio (e.g. a spa booking) */
  folioCharge?: { label: string; amount: number };
  /** override the default simulated status timeline */
  lifecycle?: LifecycleStep[];
}

interface DemoApi {
  toasts: Toast[];
  setManagerDepartment: (department: ManagerDepartmentId) => void;
  departmentManagerCommand: (command: ManagerCommand) => boolean;
  state: DemoState;
  hydrated: boolean;
  setPersona: (id: RoleId) => void;
  advance: (roleId: RoleId, itemId: string, t: Transition, reason?: string) => void;
  cycleIntegration: (id: string) => void;
  reset: () => void;
  notify: (text: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setActiveDispatcherDept: (dept: DispatcherDepartment) => void;
  submitGuestRequest: (input: GuestRequestInput) => string;
  placeRoomServiceOrder: (room: string, lines: OrderLine[], note?: string) => string;
  placeDiningOrder: (room: string, lines: OrderLine[], note?: string) => string;
  addDiningMenuItem: (item: Omit<DiningMenuItem, 'id'>) => string;
  updateDiningMenuItem: (id: string, updates: Partial<DiningMenuItem>) => void;
  deleteDiningMenuItem: (id: string) => void;
  toggleDiningMenuItemAvailability: (id: string) => void;
  addDiningCategory: (category: string) => void;
  removeDiningCategory: (category: string) => void;
  cancelGuestItem: (roleId: RoleId, itemId: string) => void;
  submitGuestFeedback: (roleId: RoleId, itemId: string, rating: number, comment?: string) => void;
  disputeFolioCharge: (room: string, lineId: string, reason: string) => void;
  claimLostItem: (room: string, itemId: string) => void;
  addLostFoundItem: (item: Omit<LostFoundItem, 'id' | 'claimed' | 'claimedRoom' | 'loggedBy'>) => void;
  expressCheckout: (room: string, guestName: string) => void;
  /** Runs a pure Front Desk reducer (src/lib/frontDesk.ts) against the shared state. Returns an error message or null. */
  fdAction: (fn: (s: DemoState) => FdResult) => string | null;
  /** Admin User & Role Management (ER_DIAGRAMS Domain 1 / Admin and IT workflow) */
  toggleStaffStatus: (id: string) => void;
  updateStaffRole: (id: string, roleId: RoleId, department: string, floorZone: string, shift: StaffAccount['shift']) => void;
  addStaffAccount: (account: Omit<StaffAccount, 'id' | 'createdAt'>) => void;
  /** Admin Workflow & SLA Configuration (Admin and IT workflow) */
  updateWorkflowConfig: (partial: Partial<WorkflowConfig>) => void;
  updateEventsConfig: (partial: Partial<EventsCelebrationsConfig>) => void;
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
  escalateSupervisorIssue: (issue: { title: string; department?: string; room?: string; priority: 'urgent' | 'critical'; reason: string; notes?: string }) => void;
  /** Phase 2: Combined Dispatcher / Supervisor & Fulfiller Workflow Operations */
  createDispatcherTask: (task: {
    title: string;
    department: string;
    category: string;
    room?: string;
    floor?: number;
    priority: 'low' | 'standard' | 'urgent' | 'vip';
    slaDue?: string;
    description: string;
    assigneeId?: string;
    assigneeName?: string;
  }) => void;
  simulateGuestMessage: (input: {
    taskId?: string;
    room: string;
    guestName?: string;
    templateType: string;
    messageText: string;
  }) => void;
  resolveFulfillerBlocker: (taskId: string, resolution: string, resumeStatus?: 'In progress' | 'Assigned') => void;
  /** Shared Workflows & Phase 1 Foundation */
  claimTask: (taskId: string, fulfillerId: string, fulfillerName: string) => void;
  updateGuestPreferences: (room: string, preferences: Partial<GuestPreferences>) => void;
  createHotelService: (service: Omit<HotelServiceItem, 'id'>) => void;
  initiateInspectionDirective: (input: {
    department?: string;
    roomNumber: string;
    roomType?: string;
    floor?: number;
    type: SupervisorInspection['type'];
    priority?: 'normal' | 'vip' | 'urgent';
    instructions: string;
    initiatedBy: string;
    initiatedRole: RoleId;
  }) => void;
  /** Phase 3: Compensation & Multi-Tier Escalations */
  createCompensationRequest: (request: Omit<CompensationRequest, 'id' | 'ref' | 'status' | 'tier' | 'history' | 'requestedAt'>) => void;
  reviewDeptManagerCompensation: (requestId: string, action: 'approve' | 'escalate_gm' | 'reject', comments: string) => void;
  reviewGmCompensation: (requestId: string, action: 'forward_to_finance' | 'reject', comments: string) => void;
  reviewFinancialCompensation: (requestId: string, action: 'approve' | 'reject', comments: string) => void;
  acceptSupervisorEscalatedTask: (taskId: string, managerNotes: string, actionType: 'resolve' | 'reject' | 'escalate_gm') => void;
  /** Phase 3: Staff & Shift Scheduling */
  updateStaffShiftSchedule: (
    scheduleId: string,
    shiftTypeOrUpdates: 'Morning' | 'Evening' | 'Night' | Partial<ShiftScheduleRecord>,
    floorZone?: string,
    status?: ShiftScheduleRecord['status'],
    notes?: string
  ) => void;
  createStaffShiftSchedule: (schedule: Omit<ShiftScheduleRecord, 'id'>) => void;
  /** Phase 3: Department Service Policies */
  saveDepartmentServicePolicy: (policy: DepartmentServicePolicy) => void;
  /** Phase 4: Guest Reminders (Front Desk & GM VIP) */
  createGuestReminder: (reminder: Omit<GuestReminder, 'id' | 'createdAt'>) => void;
  updateGuestReminderStatus: (id: string, status: GuestReminder['status']) => void;
  deleteGuestReminder: (id: string) => void;
  /** Phase 4: Safety Alert Broadcast Engine */
  submitSecuritySafetyAlert: (alert: {
    title: string;
    priority: SafetyAlertRecord['priority'];
    location: string;
    affectedFloors?: string[];
    incidentType: SafetyAlertRecord['incidentType'];
    description: string;
    broadcastScope: SafetyAlertRecord['broadcastScope'];
  }) => void;
  validateSafetyAlertByFrontDesk: (alertId: string, notes?: string) => void;
  approveSafetyAlertByManager: (alertId: string, approved: boolean, notes?: string) => void;
  broadcastSafetyAlert: (alertId: string) => void;
  resolveSafetyAlert: (alertId: string, notes?: string) => void;
  acknowledgeSafetyAlert: (alertId: string, roleOrUser: string) => void;
  updateDndStatus: (room: string, active: boolean, duration?: string, instructions?: string) => void;
  submitGuestMessageToFrontDesk: (room: string, subject: string, message: string, instructions?: string) => string;
  replyGuestMessage: (messageId: string, replyText: string, sender: 'guest' | 'front_desk') => void;
  submitGuestComplaint: (input: {
    room: string;
    guestName: string;
    title: string;
    category: ComplaintCategory;
    description: string;
    photoUrl?: string;
  }) => string;
  submitGuestLostItemReport: (input: {
    room: string;
    guestName: string;
    itemName: string;
    category: string;
    description: string;
    dateLost?: string;
    lastLocation?: string;
    photoUrl?: string;
    additionalInfo?: string;
  }) => string;
  submitGuestFoundItemClaim: (input: {
    room: string;
    guestName: string;
    itemId: string;
    itemName: string;
    message: string;
  }) => string;
  markGuestNotificationRead: (id: string) => void;
  markAllGuestNotificationsRead: (room: string) => void;
  updateGuestProfile: (room: string, profile: { name?: string; email?: string; phone?: string; preferences?: Partial<GuestPreferences> }) => void;
  gestureGuideOpen: boolean;
  setGestureGuideOpen: (open: boolean) => void;
  resetActionableExamples: () => void;
}

export function matchesFloorZone(floorZone: string | undefined, taskFloor: number | undefined): boolean {
  if (!taskFloor || !floorZone) return true;
  const fz = floorZone.toLowerCase();
  if (fz.includes('all') || fz.includes('property')) return true;
  const rangeMatch = fz.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return taskFloor >= min && taskFloor <= max;
  }
  const singleMatch = fz.match(/(\d+)/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10) === taskFloor;
  }
  return true;
}

const DemoContext = createContext<DemoApi | null>(null);

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let uidCounter = 0;
const uid = () => `${Date.now()}-${uidCounter++}`;

const refCounter: Record<string, number> = {};
function nextRef(prefix: string, room: string) {
  const key = `${prefix}-${room}`;
  refCounter[key] = (refCounter[key] ?? 0) + 1;
  return `${prefix}-${room}-${String(refCounter[key]).padStart(3, '0')}`;
}

const DEPT_PREFIX: Record<string, string> = {
  housekeeping: 'HK',
  maintenance: 'MX',
  spa: 'SP',
  concierge: 'CC',
  recreation: 'REC',
  room_service: 'DIN',
  dining: 'DIN',
  folio: 'FD',
  lost_found: 'LF',
};

const NEXT_INTEGRATION: Record<IntegrationState, IntegrationState> = {
  healthy: 'degraded',
  degraded: 'down',
  down: 'healthy',
};

const GUEST_REQUEST_LIFECYCLE: LifecycleStep[] = [
  { status: 'Acknowledged', delayMs: 6000, chip: 'Being reviewed', tone: 'info' },
  { status: 'In progress', delayMs: 16000, chip: 'Team on the way', tone: 'info' },
  { status: 'Completed', delayMs: 32000, chip: 'Completed', tone: 'success' },
];

const ORDER_LIFECYCLE: LifecycleStep[] = [
  { status: 'Accepted', delayMs: 4000, chip: 'Kitchen accepted', tone: 'info' },
  { status: 'Preparing', delayMs: 12000, chip: 'Chef preparing', tone: 'info' },
  { status: 'Ready', delayMs: 22000, chip: 'Plated & packaged', tone: 'info' },
  { status: 'Out for Delivery', delayMs: 32000, chip: 'Runner dispatched', tone: 'warning' },
  { status: 'Delivered', delayMs: 46000, chip: 'Delivered to room', tone: 'success' },
];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [gestureGuideOpen, setGestureGuideOpen] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load persisted demo state once, after mount (avoids hydration mismatches).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<DemoState>;
        const base = seedState();
        setState(ensureManagerState({
          managerDepartment: saved.managerDepartment,
          managerProfiles: saved.managerProfiles,
          managerOperations: saved.managerOperations,
          persona: saved.persona ?? null,
          items: {
            ...base.items,
            ...saved.items,
            task_fulfiller: [
              ...(base.items.task_fulfiller ?? []),
              ...((saved.items?.task_fulfiller ?? []).filter(
                (si) => !(base.items.task_fulfiller ?? []).some((bi) => bi.id === si.id),
              )),
            ],
            department_dispatcher: [
              ...(base.items.department_dispatcher ?? []),
              ...((saved.items?.department_dispatcher ?? []).filter(
                (si) => !(base.items.department_dispatcher ?? []).some((bi) => bi.id === si.id),
              )),
            ],
            department_dispatcher_supervisor:
              saved.items?.department_dispatcher_supervisor ?? base.items.department_dispatcher_supervisor,
            general_manager: saved.items?.general_manager ?? base.items.general_manager,
            // saves made before the Front Desk console start its queue from the new seed
            front_desk_coordinator: saved.frontDesk
              ? (saved.items?.front_desk_coordinator ?? base.items.front_desk_coordinator)
              : base.items.front_desk_coordinator,
          },
          frontDesk: saved.frontDesk ?? base.frontDesk,
          feed: saved.feed ?? base.feed,
          integrations: { ...base.integrations, ...saved.integrations },
          revokedRooms: saved.revokedRooms ?? [],
          folios: { ...base.folios, ...saved.folios },
          lostFound: saved.lostFound ?? base.lostFound,
          bookings: saved.bookings ?? [],
          staffAccounts: saved.staffAccounts ?? base.staffAccounts,
          auditTrail: saved.auditTrail ?? base.auditTrail,
          workflowConfig: saved.workflowConfig ?? base.workflowConfig,
          theme: saved.theme ?? (saved as unknown as { guestTheme?: ThemeMode }).guestTheme ?? base.theme,
          soundEnabled: saved.soundEnabled ?? base.soundEnabled,
          fulfillerAvailability: saved.fulfillerAvailability ?? base.fulfillerAvailability,
          notifications: (() => {
            const savedNotifs = saved.notifications ?? [];
            const baseNotifs = base.notifications ?? [];
            const map = new Map<string, InAppNotification>();
            baseNotifs.forEach((n) => map.set(n.id, n));
            savedNotifs.forEach((n) => map.set(n.id, n));
            return Array.from(map.values());
          })(),
          shiftChangeRequest: saved.shiftChangeRequest ?? base.shiftChangeRequest,
          routingRules: saved.routingRules ?? base.routingRules,
          resourceRequests: saved.resourceRequests ?? base.resourceRequests,
          shiftHandovers: saved.shiftHandovers ?? base.shiftHandovers,
          incidents: saved.incidents ?? base.incidents,
          invoices: saved.invoices ?? base.invoices,
          transactions: saved.transactions ?? base.transactions,
          refundRequests: saved.refundRequests ?? base.refundRequests,
          inspections: saved.inspections ?? base.inspections,
          hotelServices: saved.hotelServices ?? base.hotelServices,
          guestPreferences: saved.guestPreferences ?? base.guestPreferences,
          guestMessages: saved.guestMessages ?? [],
          compensationRequests: saved.compensationRequests ?? base.compensationRequests,
          shiftSchedules: saved.shiftSchedules ?? base.shiftSchedules,
          departmentPolicies: saved.departmentPolicies ?? base.departmentPolicies,
          guestReminders: saved.guestReminders ?? base.guestReminders,
          safetyAlerts: saved.safetyAlerts ?? base.safetyAlerts,
          diningMenu: saved.diningMenu ?? base.diningMenu,
          diningCategories: saved.diningCategories ?? base.diningCategories,
          activeDispatcherDept: saved.activeDispatcherDept ?? base.activeDispatcherDept ?? 'Housekeeping',
        }));
      }
    } catch {
      /* corrupted or unavailable storage: fall back to seed data */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: demo still works in memory */
    }
  }, [state, hydrated]);

  // Keep the whole site on one theme: mirror it onto <html data-theme> and class.
  useEffect(() => {
    if (hydrated) {
      document.documentElement.dataset.theme = state.theme;
      if (state.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }, [state.theme, hydrated]);

  // Clear any pending simulated-lifecycle timers on unmount.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const notify = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const recordAuditEvent = useCallback<DemoApi['recordAuditEvent']>((event) => {
    const newEntry: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}-${uidCounter++}`,
      timestamp: nowLabel(),
    };
    setState((prev) => ({
      ...prev,
      auditTrail: [newEntry, ...(prev.auditTrail ?? [])].slice(0, 80),
    }));
  }, []);

  const setPersona = useCallback((id: RoleId) => {
    setState((prev) => (prev.persona === id ? prev : { ...prev, persona: id }));
  }, []);

  const setManagerDepartment = useCallback((department: ManagerDepartmentId) => {
    setState(prev => ({ ...prev, managerDepartment: department, persona: 'department_manager' }));
  }, []);

  const departmentManagerCommand = useCallback((command: ManagerCommand) => {
    try {
      const next = applyManagerCommand(stateRef.current, command, crypto.randomUUID());
      stateRef.current = next;
      setState(next);
      notify('Department workspace updated.');
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save this change.');
      return false;
    }
  }, [notify]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => (prev.theme === theme ? prev : { ...prev, theme }));
  }, []);

  const setActiveDispatcherDept = useCallback((dept: DispatcherDepartment) => {
    setState((prev) => (prev.activeDispatcherDept === dept ? prev : { ...prev, activeDispatcherDept: dept }));
  }, []);

  const advance = useCallback<DemoApi['advance']>(
    (roleId, itemId, t, reason) => {
      let item = stateRef.current.items[roleId]?.find((i) => i.id === itemId);
      let actualRoleId = roleId;
      if (!item) {
        for (const [r, list] of Object.entries(stateRef.current.items)) {
          const found = list.find((i) => i.id === itemId);
          if (found) {
            item = found;
            actualRoleId = r as RoleId;
            break;
          }
        }
      }
      if (!item) return;
      const text = `${t.message}: ${item.title}${reason ? ` · ${reason}` : ''}`;
      const revokes = Boolean(t.revokesQr && item.room);
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: t.next, note: reason };

      setState((prev) => {
        const nextItems = { ...prev.items };
        // Update matching items across all role queues
        (Object.keys(nextItems) as RoleId[]).forEach((otherRoleId) => {
          nextItems[otherRoleId] = nextItems[otherRoleId].map((other) => {
            if (other.id === itemId || (item!.ref && other.ref === item!.ref)) {
              const targetStatus =
                (otherRoleId === 'task_fulfiller' && (t.next === 'Closed' || t.next === 'Completed'))
                  ? 'Completed'
                  : t.next;
              return {
                ...other,
                status: targetStatus,
                selfRequested: t.marksSelf ? true : other.selfRequested,
                blockerReason:
                  targetStatus === 'Blocked'
                    ? (reason ?? other.blockerReason)
                    : targetStatus === 'In progress' || targetStatus === 'Accepted' || targetStatus === 'Completed'
                      ? undefined
                      : other.blockerReason,
                history: [...(other.history ?? []), historyEntry],
              };
            }
            return other;
          });
        });

        // Ensure item exists in task_fulfiller queue when action is performed by fulfiller
        if (roleId === 'task_fulfiller') {
          const currentFulfiller = nextItems.task_fulfiller ?? [];
          const exists = currentFulfiller.some((i) => i.id === itemId || (item!.ref && i.ref === item!.ref));
          if (!exists) {
            nextItems.task_fulfiller = [
              {
                ...item!,
                status: t.next,
                blockerReason: t.next === 'Blocked' ? (reason ?? item!.blockerReason) : undefined,
                history: [...(item!.history ?? []), historyEntry],
              },
              ...currentFulfiller,
            ];
          }
        }

        const fulfillerNotifs =
          roleId === 'task_fulfiller' && item
            ? [
                {
                  id: uid(),
                  roleId: 'task_fulfiller' as RoleId,
                  department: item.department,
                  title: t.label || `Task Status: ${t.next}`,
                  message: `${item.title} → ${t.next} (${nowLabel()})`,
                  timestamp: nowLabel(),
                  read: false,
                  type: (t.next === 'Awaiting inspection' ? 'alert' : 'task') as 'task' | 'alert',
                  itemId: item.id,
                },
                ...(prev.notifications ?? []),
              ]
            : (roleId === 'department_supervisor' || roleId === 'department_dispatcher_supervisor') &&
                (t.next === 'Closed' || t.next === 'Completed') &&
                item
              ? [
                  {
                    id: uid(),
                    roleId: 'task_fulfiller' as RoleId,
                    department: item.department,
                    title: 'Task Approved by Supervisor',
                    message: `${item.title} verified & approved. Task Completed.`,
                    timestamp: nowLabel(),
                    read: false,
                    type: 'task' as const,
                    itemId: item.id,
                  },
                  ...(prev.notifications ?? []),
                ]
              : (prev.notifications ?? []);

        return {
          ...prev,
          items: nextItems,
          notifications: fulfillerNotifs,
          feed: [{ id: uid(), at: nowLabel(), role: roleById[roleId]?.short ?? 'Staff', text }, ...prev.feed].slice(0, 30),
          revokedRooms:
            revokes && item!.room && !prev.revokedRooms.includes(item!.room)
              ? [...prev.revokedRooms, item!.room]
              : prev.revokedRooms,
        };
      });
      setState((prev) => afterAdvance(prev, actualRoleId, t.next, item!.room));
      notify(revokes ? `${text} · Room ${item!.room} guest session revoked` : text);
    },
    [notify],
  );

  const cycleIntegration = useCallback(
    (id: string) => {
      const current = stateRef.current.integrations[id] ?? 'healthy';
      const next = NEXT_INTEGRATION[current];
      const name = integrationList.find((i) => i.id === id)?.name ?? id;
      const text = `${name} set to ${next} (simulated)`;
      setState((prev) => ({
        ...prev,
        integrations: { ...prev.integrations, [id]: next },
        feed: [{ id: uid(), at: nowLabel(), role: 'Admin', text }, ...prev.feed].slice(0, 30),
      }));
      notify(text);
    },
    [notify],
  );

  /** Patches one work item in place and records a status-history entry + feed line. */
  const patchGuestItem = useCallback(
    (roleId: RoleId, itemId: string, patch: Partial<WorkItem>, feedText?: string, feedRole?: string) => {
      setState((prev) => {
        const current = prev.items[roleId]?.find((i) => i.id === itemId);
        if (!current) return prev;
        const historyEntry: GuestHistoryEntry | null = patch.status ? { at: nowLabel(), status: patch.status } : null;
        return {
          ...prev,
          items: {
            ...prev.items,
            [roleId]: prev.items[roleId].map((i) =>
              i.id === itemId
                ? { ...i, ...patch, history: historyEntry ? [...(i.history ?? []), historyEntry] : i.history }
                : i,
            ),
          },
          feed: feedText
            ? [{ id: uid(), at: nowLabel(), role: feedRole ?? roleById[roleId].short, text: feedText }, ...prev.feed].slice(0, 30)
            : prev.feed,
        };
      });
    },
    [],
  );

  /** Schedules a chain of simulated status updates + notifications for a guest-originated item. */
  const scheduleLifecycle = useCallback(
    (roleId: RoleId, itemId: string, ref: string, title: string, steps: LifecycleStep[]) => {
      steps.forEach((step) => {
        const timer = setTimeout(() => {
          const current = stateRef.current.items[roleId]?.find((i) => i.id === itemId);
          if (!current || current.status === 'Cancelled') return;
          patchGuestItem(roleId, itemId, { status: step.status, chip: step.chip, tone: step.tone }, `${ref} → ${step.status}`, 'Guest Portal');
          notify(`${title}: ${step.status}`);
        }, step.delayMs);
        timers.current.push(timer);
      });
    },
    [notify, patchGuestItem],
  );

  const submitGuestRequest = useCallback<DemoApi['submitGuestRequest']>(
    (input) => {
      const ref = nextRef(DEPT_PREFIX[input.category] ?? 'GR', input.room);
      // Untagged or concierge requests enter the Front Desk queue; documented department requests reach Department Dispatcher / Supervisor
      const isConcierge = input.category === 'concierge' || !input.category;
      const targetRole: RoleId = isConcierge ? 'front_desk_coordinator' : 'department_dispatcher_supervisor';
      const id = uid();
      const createdAt = nowLabel();
      const taskFloor = input.room ? parseInt(input.room[0], 10) || 1 : undefined;

      const newItem: WorkItem = {
        id,
        title: input.title,
        meta: input.meta,
        status: isConcierge ? 'Received' : 'Unassigned',
        chip: input.chip ?? (isConcierge ? 'Awaiting Front Desk routing' : 'Open pool · Unassigned'),
        tone: input.tone ?? 'warning',
        room: input.room,
        floor: taskFloor,
        location: input.room ? `Room ${input.room}, Level ${taskFloor}` : undefined,
        guest: true,
        category: input.category,
        description: input.description,
        priority: input.priority ?? 'normal',
        ref,
        createdAt,
        dnd: input.dnd,
        photoAttached: input.photoAttached,
        photoUrl: input.photoUrl,
        owner: isConcierge ? 'Front Desk' : undefined,
        history: [{ at: createdAt, status: isConcierge ? 'Received' : 'Unassigned', note: isConcierge ? 'Awaiting Front Desk routing' : 'Placed in department queue (open pool)' }],
      };

      setState((prev) => {
        let next: DemoState = {
          ...prev,
          items: {
            ...prev.items,
            [targetRole]: [newItem, ...(prev.items[targetRole] ?? [])],
            // Also maintain legacy department_dispatcher array for compatibility
            ...(targetRole === 'department_dispatcher_supervisor'
              ? { department_dispatcher: [newItem, ...(prev.items.department_dispatcher ?? [])] }
              : {}),
          },
          feed: [
            { id: uid(), at: createdAt, role: 'Guest Portal', text: `${ref} submitted · ${input.title} · Room ${input.room}` },
            ...prev.feed,
          ].slice(0, 30),
        };

        if (input.folioCharge) {
          next = {
            ...next,
            folios: {
              ...next.folios,
              [input.room]: [
                ...(next.folios[input.room] ?? []),
                { id: `fo-${id}`, label: input.folioCharge.label, amount: input.folioCharge.amount, date: createdAt },
              ],
            },
          };
        }

        if (input.category === 'maintenance' && input.priority === 'safety') {
          const alertItem: WorkItem = {
            id: uid(),
            title: `Safety alert · ${input.title}`,
            meta: `Escalated from Guest Portal · Room ${input.room}`,
            status: 'Escalated',
            chip: 'Safety / security',
            tone: 'danger',
            room: input.room,
            guest: true,
            priority: 'safety',
          };
          next = { ...next, items: { ...next.items, department_manager: [alertItem, ...next.items.department_manager] } };
        }

        // Shared Workflow 3.A: Every eligible Task Fulfiller is notified that an unassigned task is in open pool
        if (!isConcierge) {
          const openPoolNotif: InAppNotification = {
            id: `notif-${id}`,
            roleId: 'task_fulfiller',
            title: `New Task in Open Pool: ${input.title}`,
            message: `Room ${input.room} · ${ref} available for self-claiming`,
            timestamp: createdAt,
            read: false,
            type: 'task',
            itemId: id,
          };
          next = {
            ...next,
            notifications: [openPoolNotif, ...(next.notifications ?? [])],
          };
        }

        return next;
      });

      notify(`Request sent · Reference ${ref}`);
      return ref;
    },
    [notify],
  );

  /* ---- Fulfiller & Mobile App Specific Store Actions ---- */

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, soundEnabled: enabled }));
  }, []);

  const setFulfillerAvailability = useCallback((avail: 'on_duty' | 'break' | 'off_duty') => {
    setState((prev) => {
      const label = avail === 'on_duty' ? 'On Duty' : avail === 'break' ? 'On Break' : 'Off Duty';
      const text = `Vikram Singh status set to ${label}`;
      return {
        ...prev,
        fulfillerAvailability: avail,
        feed: [{ id: uid(), at: nowLabel(), role: 'Housekeeping', text }, ...prev.feed].slice(0, 30),
      };
    });
    notify(`Availability changed: ${avail === 'on_duty' ? 'On Duty' : avail === 'break' ? 'On Break' : 'Off Duty'}`);
  }, [notify]);

  const attachTaskPhoto = useCallback((roleId: RoleId, itemId: string, dataUrl: string) => {
    setState((prev) => {
      let item = prev.items[roleId]?.find((i) => i.id === itemId);
      if (!item) {
        for (const list of Object.values(prev.items)) {
          const found = list.find((i) => i.id === itemId);
          if (found) {
            item = found;
            break;
          }
        }
      }
      if (!item) return prev;
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: item.status, note: 'Photo evidence attached' };
      const nextItems = { ...prev.items };
      (Object.keys(nextItems) as RoleId[]).forEach((r) => {
        nextItems[r] = nextItems[r].map((i) =>
          i.id === itemId || (item!.ref && i.ref === item!.ref)
            ? { ...i, photoUrl: dataUrl, photoAttached: true, history: [...(i.history ?? []), historyEntry] }
            : i,
        );
      });
      return {
        ...prev,
        items: nextItems,
        feed: [{ id: uid(), at: nowLabel(), role: roleById[roleId]?.short ?? 'Staff', text: `Photo attached for ${item.title}` }, ...prev.feed].slice(0, 30),
      };
    });
    notify('Photo attached successfully');
  }, [notify]);

  const requestTaskReassignment = useCallback((itemId: string, reason: string) => {
    setState((prev) => {
      const item =
        prev.items.task_fulfiller?.find((i) => i.id === itemId) ||
        prev.items.department_dispatcher_supervisor?.find((i) => i.id === itemId);
      if (!item) return prev;
      const historyEntry: GuestHistoryEntry = {
        at: nowLabel(),
        status: 'Reassignment requested',
        note: `Reason: ${reason}`,
        actor: 'Vikram Singh',
        role: 'Task Fulfiller',
      };
      const supervisorItem: WorkItem = {
        id: uid(),
        title: `Reassign request · ${item.title}`,
        meta: `Requested by Vikram Singh · Housekeeping · Floor ${item.room?.[0] ?? '4'}`,
        status: 'Awaiting inspection',
        chip: 'Reassignment request',
        tone: 'warning',
        priority: 'urgent',
        room: item.room,
        linkedRef: item.ref,
        description: `Fulfiller requested reassignment. Reason: ${reason}`,
        createdAt: nowLabel(),
        history: [historyEntry],
      };
      const supervisorNotif: InAppNotification = {
        id: uid(),
        roleId: 'department_dispatcher_supervisor',
        title: 'Task Reassignment Request',
        message: `Vikram Singh requested reassignment for ${item.title} (${reason})`,
        timestamp: nowLabel(),
        read: false,
        type: 'reassign',
        itemId: item.id,
      };

      const updateTask = (t: WorkItem) =>
        t.id === itemId || (item.ref && t.ref === item.ref)
          ? {
            ...t,
            status: 'Reassignment requested',
            chip: 'Pending supervisor review',
            tone: 'warning' as const,
            reassignPending: true,
            reassignReason: reason,
            history: [...(t.history ?? []), historyEntry],
          }
          : t;

      return {
        ...prev,
        items: {
          ...prev.items,
          task_fulfiller: (prev.items.task_fulfiller ?? []).map(updateTask),
          department_dispatcher_supervisor: (prev.items.department_dispatcher_supervisor ?? []).map(updateTask),
          department_dispatcher: (prev.items.department_dispatcher ?? []).map(updateTask),
          department_supervisor: [supervisorItem, ...(prev.items.department_supervisor ?? [])],
        },
        notifications: [supervisorNotif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: nowLabel(), role: 'Housekeeping', text: `Reassignment requested for ${item.title}: ${reason}` },
          ...prev.feed,
        ].slice(0, 30),
      };
    });
    notify(`Reassignment request submitted to supervisor: ${reason}`);
  }, [notify]);

  const resolveReassignment = useCallback((supervisorItemId: string, fulfillerItemId: string, approved: boolean) => {
    setState((prev) => {
      const fulfillerItem = prev.items.task_fulfiller?.find((i) => i.id === fulfillerItemId);
      const note = approved ? 'Reassigned to alternate attendant' : 'Reassignment declined by Supervisor';
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: approved ? 'Reassigned' : 'Assigned', note };
      const notif: InAppNotification = {
        id: uid(),
        roleId: 'task_fulfiller',
        title: approved ? 'Reassignment Approved' : 'Reassignment Declined',
        message: approved
          ? `Your reassignment request for ${fulfillerItem?.title ?? 'task'} was approved.`
          : `Reassignment declined by Meera Nambiar. Please proceed with task.`,
        timestamp: nowLabel(),
        read: false,
        type: 'reassign',
        itemId: fulfillerItemId,
      };

      return {
        ...prev,
        items: {
          ...prev.items,
          task_fulfiller: prev.items.task_fulfiller.map((i) =>
            i.id === fulfillerItemId
              ? {
                ...i,
                status: approved ? 'Completed' : 'Assigned',
                chip: approved ? 'Reassigned' : 'Reassignment declined',
                reassignPending: false,
                history: [...(i.history ?? []), historyEntry],
              }
              : i,
          ),
          department_supervisor: prev.items.department_supervisor.map((i) =>
            i.id === supervisorItemId ? { ...i, status: 'Closed' } : i,
          ),
        },
        notifications: [notif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: nowLabel(), role: 'Supervisor', text: `Reassignment ${approved ? 'approved' : 'declined'} for ${fulfillerItem?.title ?? 'task'}` },
          ...prev.feed,
        ].slice(0, 30),
      };
    });
    notify(approved ? 'Reassignment approved' : 'Reassignment declined');
  }, [notify]);

  const requestEmergencyShiftChange = useCallback((reason: string, details?: string) => {
    const timestamp = nowLabel();
    setState((prev) => {
      const alert: WorkItem = {
        id: uid(),
        title: `Emergency shift relief · Vikram Singh`,
        meta: `Housekeeping · Floor Zone 1–5 · Reason: ${reason}`,
        status: 'Escalated',
        chip: 'Shift Relief Needed',
        tone: 'danger',
        priority: 'urgent',
        description: details ?? reason,
        createdAt: timestamp,
      };
      const dutyNotif: InAppNotification = {
        id: uid(),
        roleId: 'department_manager',
        title: 'Emergency Shift Relief Request',
        message: `Vikram Singh (Housekeeping): ${reason}`,
        timestamp,
        read: false,
        type: 'alert',
      };
      return {
        ...prev,
        shiftChangeRequest: { requestedAt: timestamp, reason, status: 'pending', details },
        items: { ...prev.items, department_manager: [alert, ...prev.items.department_manager] },
        notifications: [dutyNotif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: timestamp, role: 'Housekeeping', text: `Emergency shift relief requested by Vikram Singh: ${reason}` },
          ...prev.feed,
        ].slice(0, 30),
      };
    });
    notify('Emergency shift handover request logged with Duty Manager');
  }, [notify]);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const clearAllNotifications = useCallback((roleId?: RoleId) => {
    setState((prev) => ({
      ...prev,
      notifications: roleId
        ? (prev.notifications ?? []).filter((n) => n.roleId !== roleId)
        : [],
    }));
  }, []);

  const assignDispatcherTask = useCallback<DemoApi['assignDispatcherTask']>(
    (taskId, staffId) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const ddsItems = prev.items.department_dispatcher_supervisor ?? [];
        const ddItems = prev.items.department_dispatcher ?? [];
        const fulItems = prev.items.task_fulfiller ?? [];
        const task = ddsItems.find((i) => i.id === taskId) || ddItems.find((i) => i.id === taskId) || fulItems.find((i) => i.id === taskId);
        const staff = (prev.staffAccounts ?? []).find((s) => s.id === staffId || s.employeeId === staffId);
        if (!task || !staff) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Assigned',
          note: `Assigned to ${staff.name} (${staff.employeeId}) by Dispatcher Arjun Mehta`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Assigned',
          assignee: staff.name,
          assigneeId: staff.employeeId,
          assignedAt: timestamp,
          chip: `Assigned: ${staff.name.split(' ')[0]}`,
          tone: 'info',
          autoAssigned: false,
          assignmentFailureReason: undefined,
          history: [...(task.history ?? []), historyEntry],
        };

        let nextFulfillerItems = prev.items.task_fulfiller ?? [];
        if (staff.roleId === 'task_fulfiller') {
          const existingIdx = nextFulfillerItems.findIndex(
            (f) => f.id === task.id || (task.ref && f.ref === task.ref)
          );
          const fulfillerTask: WorkItem = {
            ...updatedTask,
            location: updatedTask.location || (task.room ? `Room ${task.room}, Level ${task.floor || task.room[0]}` : undefined),
            evidenceRequired: task.category === 'maintenance' || task.category === 'housekeeping',
          };
          if (existingIdx >= 0) {
            nextFulfillerItems = nextFulfillerItems.map((f, i) => (i === existingIdx ? fulfillerTask : f));
          } else {
            nextFulfillerItems = [fulfillerTask, ...nextFulfillerItems];
          }
        }

        const notif: InAppNotification = {
          id: uid(),
          roleId: staff.roleId,
          title: 'New Dispatch Assignment',
          message: `${task.title} assigned to you · Location: Room ${task.room || 'General'}`,
          timestamp,
          read: false,
          type: 'task',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher_supervisor: (prev.items.department_dispatcher_supervisor ?? []).map((i) =>
              i.id === taskId ? updatedTask : i
            ),
            department_dispatcher: (prev.items.department_dispatcher ?? []).map((i) =>
              i.id === taskId ? updatedTask : i
            ),
            task_fulfiller: nextFulfillerItems,
          },
          notifications: [notif, ...(prev.notifications ?? [])],
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `Assigned ${task.ref || task.title} to ${staff.name}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Arjun Mehta',
        actorRole: 'Department Dispatcher',
        action: 'Task manually dispatched to staff',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `Assignee: ${staffId}`,
      });
      notify(`Assigned task to ${staffId}`);
    },
    [notify, recordAuditEvent],
  );

  const autoAssignTask = useCallback<DemoApi['autoAssignTask']>(
    (taskId) => {
      const timestamp = nowLabel();
      const currentState = stateRef.current;
      const task = currentState.items.department_dispatcher?.find((i) => i.id === taskId);
      if (!task) return { success: false, reason: 'Task not found' };

      const taskDept = task.department?.toLowerCase() ||
        (task.category === 'housekeeping' ? 'housekeeping' :
          task.category === 'maintenance' ? 'maintenance' :
            task.category === 'room_service' ? 'food & beverage' : 'operations');

      const taskFloor = task.floor || (task.room ? parseInt(task.room[0], 10) : undefined);

      const eligibleStaff = (currentState.staffAccounts ?? []).filter((s) => {
        if (s.roleId !== 'task_fulfiller' || s.status !== 'active') return false;
        if (s.availability && s.availability !== 'on_duty') return false;
        const staffDept = s.department.toLowerCase();
        return staffDept.includes(taskDept) || taskDept.includes(staffDept);
      });

      if (eligibleStaff.length === 0) {
        setState((prev) => ({
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) =>
              i.id === taskId
                ? { ...i, assignmentFailureReason: `No on-duty ${taskDept} staff available` }
                : i
            ),
          },
        }));
        notify(`Auto-assign failed: No on-duty ${task.department || 'field'} staff available`);
        return { success: false, reason: 'No on-duty staff available in department' };
      }

      // 1. Calculate active tasks and capacity for each eligible staff member
      const staffWithLoads = eligibleStaff.map((staff) => {
        const activeCount = (currentState.items.task_fulfiller ?? []).filter(
          (f) => f.assigneeId === staff.employeeId && f.status !== 'Completed' && f.status !== 'Cancelled'
        ).length;
        const maxLoad = staff.maxWorkload || 5;
        const isOverloaded = activeCount >= maxLoad;
        const floorMatch = matchesFloorZone(staff.floorZone, taskFloor);

        return {
          staff,
          activeCount,
          maxLoad,
          isOverloaded,
          floorMatch,
        };
      });

      // 2. Exclude employees who have reached configured capacity
      const withCapacity = staffWithLoads.filter((s) => !s.isOverloaded);
      if (withCapacity.length === 0) {
        setState((prev) => ({
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) =>
              i.id === taskId
                ? { ...i, assignmentFailureReason: `All ${eligibleStaff.length} eligible ${taskDept} employees are at maximum task capacity` }
                : i
            ),
          },
        }));
        notify(`Auto-assign failed: All ${taskDept} staff are at maximum capacity`);
        return { success: false, reason: 'All eligible staff are at maximum capacity' };
      }

      // 3. Match floor/zone when applicable
      const floorMatched = withCapacity.filter((s) => s.floorMatch);
      const candidatePool = floorMatched.length > 0 ? floorMatched : withCapacity;

      // 4. Select eligible employee with lowest active workload; deterministic tie-breaker by employeeId
      candidatePool.sort((a, b) => a.activeCount - b.activeCount || a.staff.employeeId.localeCompare(b.staff.employeeId));
      const chosen = candidatePool[0];

      const assignedStaff = chosen.staff;
      const matchNote = chosen.floorMatch && floorMatched.length > 0
        ? `Floor-matched (${assignedStaff.floorZone}) with lowest active workload (${chosen.activeCount}/${chosen.maxLoad})`
        : `Lowest active workload (${chosen.activeCount}/${chosen.maxLoad})`;

      const historyEntry: GuestHistoryEntry = {
        at: timestamp,
        status: 'Assigned',
        note: `Auto-dispatched: ${matchNote} to ${assignedStaff.name} (${assignedStaff.employeeId}) via Deterministic Engine`,
      };

      const updatedTask: WorkItem = {
        ...task,
        status: 'Assigned',
        assignee: assignedStaff.name,
        assigneeId: assignedStaff.employeeId,
        assignedAt: timestamp,
        chip: `Auto: ${assignedStaff.name.split(' ')[0]}`,
        tone: 'info',
        autoAssigned: true,
        assignmentFailureReason: undefined,
        history: [...(task.history ?? []), historyEntry],
      };

      let nextFulfillerItems = currentState.items.task_fulfiller ?? [];
      const existingIdx = nextFulfillerItems.findIndex(
        (f) => f.id === task.id || (task.ref && f.ref === task.ref)
      );
      const fulfillerTask: WorkItem = {
        ...updatedTask,
        location: updatedTask.location || (task.room ? `Room ${task.room}, Level ${task.floor || task.room[0]}` : undefined),
        evidenceRequired: task.category === 'maintenance' || task.category === 'housekeeping',
      };
      if (existingIdx >= 0) {
        nextFulfillerItems = nextFulfillerItems.map((f, i) => (i === existingIdx ? fulfillerTask : f));
      } else {
        nextFulfillerItems = [fulfillerTask, ...nextFulfillerItems];
      }

      const notif: InAppNotification = {
        id: uid(),
        roleId: 'task_fulfiller',
        title: 'Auto-Routed Task Assigned',
        message: `${task.title} auto-routed to your queue · SLA ${task.slaDue || '25m'}`,
        timestamp,
        read: false,
        type: 'task',
        itemId: task.id,
      };

      setState((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
          task_fulfiller: nextFulfillerItems,
        },
        notifications: [notif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: timestamp, role: 'Auto-Router', text: `Deterministic engine assigned ${task.ref || task.title} to ${assignedStaff.name}` },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Auto-Routing Engine',
        actorRole: 'Department Dispatcher',
        action: 'Deterministic auto-assignment executed',
        category: 'Workflow',
        resource: `Task ${task.ref || task.id}`,
        outcome: 'success',
        details: `Matched to ${assignedStaff.name} (${assignedStaff.employeeId}) with current load ${chosen.activeCount}/${chosen.maxLoad}`,
      });

      notify(`Auto-assigned to ${assignedStaff.name} (${assignedStaff.department})`);
      return { success: true, staffName: assignedStaff.name };
    },
    [notify, recordAuditEvent],
  );

  const reassignDispatcherTask = useCallback<DemoApi['reassignDispatcherTask']>(
    (taskId, newStaffId, reason) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        const newStaff = (prev.staffAccounts ?? []).find((s) => s.id === newStaffId || s.employeeId === newStaffId);
        if (!task || !newStaff) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Reassigned',
          note: `Reassigned to ${newStaff.name} (${newStaff.employeeId}) by Dispatcher.${reason ? ` Reason: ${reason}` : ''}`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Assigned',
          assignee: newStaff.name,
          assigneeId: newStaff.employeeId,
          assignedAt: timestamp,
          chip: `Reassigned: ${newStaff.name.split(' ')[0]}`,
          reassignPending: false,
          reassignReason: undefined,
          history: [...(task.history ?? []), historyEntry],
        };

        const nextFulfillerItems = (prev.items.task_fulfiller ?? []).map((f) => {
          if (f.id === task.id || (task.ref && f.ref === task.ref)) {
            return {
              ...f,
              assignee: newStaff.name,
              assigneeId: newStaff.employeeId,
              status: 'Assigned',
              reassignPending: false,
              history: [...(f.history ?? []), historyEntry],
            };
          }
          return f;
        });

        const notif: InAppNotification = {
          id: uid(),
          roleId: newStaff.roleId,
          title: 'Task Reassigned To You',
          message: `${task.title} reassigned to your queue.${reason ? ` Reason: ${reason}` : ''}`,
          timestamp,
          read: false,
          type: 'reassign',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
            task_fulfiller: nextFulfillerItems,
          },
          notifications: [notif, ...(prev.notifications ?? [])],
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `Reassigned ${task.ref || task.title} to ${newStaff.name}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Arjun Mehta',
        actorRole: 'Department Dispatcher',
        action: 'Task reassigned to new employee',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `New Assignee: ${newStaffId}${reason ? ` · Justification: ${reason}` : ''}`,
      });
      notify(`Reassigned task to ${newStaffId}`);
    },
    [notify, recordAuditEvent],
  );

  const autoAssignAllPending = useCallback<DemoApi['autoAssignAllPending']>(() => {
    const unassigned = (stateRef.current.items.department_dispatcher ?? []).filter(
      (i) => i.status === 'Unassigned' || i.status === 'Received'
    );
    let assignedCount = 0;
    unassigned.forEach((task) => {
      const res = autoAssignTask(task.id);
      if (res.success) assignedCount++;
    });
    const unassignedCount = unassigned.length - assignedCount;
    notify(`Auto-dispatch complete: ${assignedCount} assigned, ${unassignedCount} remaining unassigned`);
    return { assignedCount, unassignedCount };
  }, [autoAssignTask, notify]);

  const linkDuplicateTask = useCallback<DemoApi['linkDuplicateTask']>(
    (taskId, parentRef) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        if (!task) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Duplicate Linked',
          note: `Linked as duplicate of primary task ${parentRef} by Dispatcher Arjun Mehta`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Duplicate Linked',
          isLinkedDuplicate: true,
          linkedToRef: parentRef,
          chip: `Duplicate of ${parentRef}`,
          tone: 'neutral',
          history: [...(task.history ?? []), historyEntry],
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
          },
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `Task ${task.ref || task.title} linked as duplicate of ${parentRef}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Arjun Mehta',
        actorRole: 'Department Dispatcher',
        action: 'Task deduplicated and linked to primary reference',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `Primary Reference: ${parentRef}`,
      });
      notify(`Task linked as duplicate of ${parentRef}`);
    },
    [notify, recordAuditEvent],
  );

  const escalateTaskToManager = useCallback<DemoApi['escalateTaskToManager']>(
    (taskId, reason) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        if (!task) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Escalated',
          note: `Escalated to Duty Manager Marcus Vance: ${reason}`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Escalated',
          escalatedTo: 'Duty Manager Marcus Vance',
          escalatedAt: timestamp,
          escalationReason: reason,
          chip: 'Escalated to Duty Mgr',
          tone: 'danger',
          history: [...(task.history ?? []), historyEntry],
        };

        const managerItem: WorkItem = {
          id: uid(),
          department: task.department,
          ref: task.ref,
          title: `DISPATCH ESCALATION: ${task.title}`,
          meta: `${task.department || 'Operations'} · Room ${task.room || 'General'} · Escalated by Dispatcher`,
          status: 'Escalated',
          chip: 'Dispatcher Escalation',
          tone: 'danger',
          priority: 'critical',
          room: task.room,
          linkedRef: task.ref,
          description: `Operational SLA escalation. Justification: ${reason}`,
          createdAt: timestamp,
          history: [{ at: timestamp, status: 'Escalated', note: `Escalated by Arjun Mehta: ${reason}` }],
        };

        const managerNotif: InAppNotification = {
          id: uid(),
          roleId: 'department_manager',
          title: 'Urgent Dispatch Escalation',
          message: `${task.title} escalated by Dispatcher: ${reason}`,
          timestamp,
          read: false,
          type: 'alert',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
            department_manager: [managerItem, ...prev.items.department_manager],
          },
          notifications: [managerNotif, ...(prev.notifications ?? [])],
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `ESCALATION: ${task.ref || task.title} escalated to Duty Manager (${reason})` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Arjun Mehta',
        actorRole: 'Department Dispatcher',
        action: 'Task escalated to Duty Manager',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'warning',
        details: `Justification: ${reason}`,
      });
      notify(`Escalated to Duty Manager Marcus Vance`);
    },
    [notify, recordAuditEvent],
  );

  const redistributeUnstartedTasks = useCallback<DemoApi['redistributeUnstartedTasks']>(
    (department) => {
      const currentState = stateRef.current;
      const fulfillers = (currentState.staffAccounts ?? []).filter(
        (s) => s.roleId === 'task_fulfiller' && s.status === 'active' && s.availability === 'on_duty' &&
          (!department || s.department.toLowerCase().includes(department.toLowerCase()))
      );

      if (fulfillers.length < 2) {
        notify('Workload rebalance requires at least 2 active on-duty staff members in the department');
        return { movedCount: 0, message: 'Insufficient on-duty staff to rebalance' };
      }

      const loadMap = new Map<string, number>();
      fulfillers.forEach((f) => {
        const count = (currentState.items.task_fulfiller ?? []).filter(
          (t) => t.assigneeId === f.employeeId && t.status !== 'Completed' && t.status !== 'Cancelled'
        ).length;
        loadMap.set(f.employeeId, count);
      });

      const overloaded = fulfillers.filter((f) => (loadMap.get(f.employeeId) ?? 0) >= 4);
      const underloaded = fulfillers.filter((f) => (loadMap.get(f.employeeId) ?? 0) < 3);

      if (overloaded.length === 0 || underloaded.length === 0) {
        notify('Workload is already balanced across available on-duty staff');
        return { movedCount: 0, message: 'Workload already balanced' };
      }

      let movedCount = 0;
      overloaded.forEach((heavyStaff) => {
        const unstartedTasks = (currentState.items.department_dispatcher ?? []).filter(
          (t) => t.assigneeId === heavyStaff.employeeId && t.status === 'Assigned'
        );
        if (unstartedTasks.length > 0 && underloaded.length > 0) {
          const taskToMove = unstartedTasks[0];
          const targetStaff = underloaded[0];
          reassignDispatcherTask(taskToMove.id, targetStaff.employeeId, 'Automated workload rebalancing');
          movedCount++;
        }
      });

      const msg = `Rebalanced ${movedCount} task${movedCount === 1 ? '' : 's'} across field attendants`;
      notify(msg);
      return { movedCount, message: msg };
    },
    [reassignDispatcherTask, notify],
  );

  const toggleRoutingRule = useCallback<DemoApi['toggleRoutingRule']>(
    (ruleId) => {
      setState((prev) => {
        const rules = prev.routingRules ?? seedRoutingRules;
        const target = rules.find((r) => r.id === ruleId);
        if (!target) return prev;
        const nextActive = !target.active;
        return {
          ...prev,
          routingRules: rules.map((r) => (r.id === ruleId ? { ...r, active: nextActive } : r)),
          feed: [
            { id: uid(), at: nowLabel(), role: 'Dispatcher', text: `Routing rule "${target.category}" set to ${nextActive ? 'Active' : 'Disabled'}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify(`Routing rule updated`);
    },
    [notify],
  );

  const updateStaffAvailability = useCallback<DemoApi['updateStaffAvailability']>(
    (staffId, availability) => {
      setState((prev) => {
        const staffList = prev.staffAccounts ?? [];
        const staff = staffList.find((s) => s.id === staffId || s.employeeId === staffId);
        if (!staff) return prev;

        const isVikram = staff.employeeId === 'EMP-0103';

        return {
          ...prev,
          staffAccounts: staffList.map((s) => (s.id === staff.id ? { ...s, availability } : s)),
          fulfillerAvailability: isVikram ? availability : prev.fulfillerAvailability,
          feed: [
            { id: uid(), at: nowLabel(), role: 'Dispatcher', text: `${staff.name} availability updated: ${availability.replace('_', ' ')}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify(`Status updated to ${availability.replace('_', ' ')}`);
    },
    [notify],
  );

  const placeRoomServiceOrder = useCallback<DemoApi['placeRoomServiceOrder']>(
    (room, lines, note) => {
      const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) / 100;
      const ref = nextRef('DIN', room);
      const id = uid();
      const createdAt = nowLabel();
      const summary = lines.map((l) => `${l.qty}× ${l.name}`).join(', ');
      const newItem: WorkItem = {
        id,
        title: `Dining order ${ref}`,
        meta: `Dining · ${summary} · Room ${room}`,
        status: 'Order Placed',
        chip: 'Order Placed',
        tone: 'info',
        room,
        guest: true,
        category: 'room_service',
        description: note,
        ref,
        createdAt,
        orderLines: lines,
        amount: total,
        history: [{ at: createdAt, status: 'Order Placed' }],
      };

      setState((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          department_dispatcher: [newItem, ...prev.items.department_dispatcher],
          department_dispatcher_supervisor: [newItem, ...(prev.items.department_dispatcher_supervisor ?? [])],
        },
        folios: {
          ...prev.folios,
          [room]: [...(prev.folios[room] ?? []), { id: `fo-${id}`, label: `Dining · ${summary}`, amount: total, date: createdAt }],
        },
        feed: [
          { id: uid(), at: createdAt, role: 'Guest Portal', text: `${ref} placed · ${summary} · Room ${room}` },
          ...prev.feed,
        ].slice(0, 30),
      }));

      notify(`Dining order placed · Reference ${ref}`);
      scheduleLifecycle('department_dispatcher', id, ref, `Dining ${ref}`, ORDER_LIFECYCLE);
      return ref;
    },
    [notify, scheduleLifecycle],
  );

  const placeDiningOrder = placeRoomServiceOrder;

  const addDiningMenuItem = useCallback<DemoApi['addDiningMenuItem']>(
    (item) => {
      const id = `din-${Date.now().toString().slice(-6)}`;
      const newItem: DiningMenuItem = { ...item, id };
      setState((prev) => ({
        ...prev,
        diningMenu: [newItem, ...(prev.diningMenu ?? [])],
        feed: [
          {
            id: uid(),
            at: nowLabel(),
            role: 'F&B Manager',
            text: `Added dish: "${newItem.name}" (${newItem.category} · ₹${newItem.price})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));
      notify(`Dish "${newItem.name}" added to Dining menu`);
      return id;
    },
    [notify],
  );

  const updateDiningMenuItem = useCallback<DemoApi['updateDiningMenuItem']>(
    (id, updates) => {
      setState((prev) => ({
        ...prev,
        diningMenu: (prev.diningMenu ?? []).map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      }));
      notify('Dish details updated');
    },
    [notify],
  );

  const deleteDiningMenuItem = useCallback<DemoApi['deleteDiningMenuItem']>(
    (id) => {
      setState((prev) => ({
        ...prev,
        diningMenu: (prev.diningMenu ?? []).filter((item) => item.id !== id),
      }));
      notify('Dish removed from menu');
    },
    [notify],
  );

  const toggleDiningMenuItemAvailability = useCallback<DemoApi['toggleDiningMenuItemAvailability']>(
    (id) => {
      setState((prev) => ({
        ...prev,
        diningMenu: (prev.diningMenu ?? []).map((item) =>
          item.id === id ? { ...item, isAvailable: !item.isAvailable } : item,
        ),
      }));
    },
    [],
  );

  const addDiningCategory = useCallback<DemoApi['addDiningCategory']>(
    (category) => {
      const clean = category.trim();
      if (!clean) return;
      setState((prev) => {
        const existing = prev.diningCategories ?? [];
        if (existing.includes(clean)) return prev;
        return {
          ...prev,
          diningCategories: [...existing, clean],
        };
      });
      notify(`Category "${clean}" added`);
    },
    [notify],
  );

  const removeDiningCategory = useCallback<DemoApi['removeDiningCategory']>(
    (category) => {
      setState((prev) => ({
        ...prev,
        diningCategories: (prev.diningCategories ?? []).filter((c) => c !== category),
      }));
      notify(`Category "${category}" removed`);
    },
    [notify],
  );

  const cancelGuestItem = useCallback<DemoApi['cancelGuestItem']>(
    (roleId, itemId) => {
      patchGuestItem(roleId, itemId, { status: 'Cancelled', chip: 'Cancelled by guest', tone: 'neutral' });
      notify('Request cancelled');
    },
    [notify, patchGuestItem],
  );

  const submitGuestFeedback = useCallback<DemoApi['submitGuestFeedback']>(
    (roleId, itemId, rating, comment) => {
      patchGuestItem(roleId, itemId, { feedback: { rating, comment } });
      notify('Thanks for your feedback');
    },
    [notify, patchGuestItem],
  );

  const disputeFolioCharge = useCallback<DemoApi['disputeFolioCharge']>(
    (room, lineId, reason) => {
      setState((prev) => {
        const line = (prev.folios[room] ?? []).find((l) => l.id === lineId);
        if (!line) return prev;
        const ref = nextRef('FD', room);
        const disputeItem: WorkItem = {
          id: uid(),
          title: `Folio dispute · ${line.label}`,
          meta: `Requested by guest · Room ${room} · Card •••• 4242`,
          status: 'Pending approval',
          chip: 'Awaiting review',
          tone: 'warning',
          amount: line.amount,
          room,
          guest: true,
          category: 'folio',
          description: reason,
          ref,
          createdAt: nowLabel(),
          history: [{ at: nowLabel(), status: 'Pending approval', note: reason }],
        };
        return {
          ...prev,
          folios: {
            ...prev.folios,
            [room]: prev.folios[room].map((l) => (l.id === lineId ? { ...l, disputed: true, disputeReason: reason } : l)),
          },
          items: { ...prev.items, financial_operator: [disputeItem, ...prev.items.financial_operator] },
          feed: [
            { id: uid(), at: nowLabel(), role: 'Guest Portal', text: `Dispute opened · ${line.label} · Room ${room}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify('Dispute sent to Front Desk & Finance');
    },
    [notify],
  );

  const claimLostItem = useCallback<DemoApi['claimLostItem']>(
    (room, itemId) => {
      setState((prev) => {
        const found = (prev.lostFound ?? []).find((l) => l.id === itemId);
        if (!found || found.sensitive || found.claimed) return prev;
        const caseItem: WorkItem = {
          id: uid(),
          title: `Lost & found claim · ${found.name}`,
          meta: `Found ${found.foundLocation} · ${found.foundDate} · Owner: Front Desk`,
          status: 'Open',
          chip: 'Claim submitted',
          tone: 'warning',
          room,
          guest: true,
          category: 'lost_found',
          ref: nextRef('LF', room),
          createdAt: nowLabel(),
          history: [{ at: nowLabel(), status: 'Open' }],
        };
        return {
          ...prev,
          lostFound: prev.lostFound.map((l) => (l.id === itemId ? { ...l, claimed: true, claimedRoom: room } : l)),
          items: { ...prev.items, front_desk_coordinator: [caseItem, ...prev.items.front_desk_coordinator] },
          feed: [
            { id: uid(), at: nowLabel(), role: 'Guest Portal', text: `Lost & found claim · ${found.name} · Room ${room}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify('Claim sent to Front Desk for verification');
    },
    [notify],
  );

  const addLostFoundItem = useCallback<DemoApi['addLostFoundItem']>(
    (item) => {
      const entry: LostFoundItem = {
        ...item,
        id: `lf-${uid()}`,
        // sensitive items never carry a guest-visible photo
        photo: item.sensitive ? undefined : item.photo,
        loggedBy: 'Front Desk',
      };
      setState((prev) => ({
        ...prev,
        lostFound: [entry, ...prev.lostFound],
        feed: [
          {
            id: uid(),
            at: nowLabel(),
            role: 'Front Desk',
            text: item.sensitive
              ? `Restricted item logged · ${item.name} · hidden from guests`
              : `Found item logged · ${item.name} · now visible in Guest Lost & Found`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));
      notify(item.sensitive ? 'Logged as restricted · guests are told to ask Front Desk' : 'Item published to Guest Lost & Found');
    },
    [notify],
  );

  const expressCheckout = useCallback<DemoApi['expressCheckout']>(
    (room, guestName) => {
      const turnoverItem: WorkItem = {
        id: uid(),
        title: `Checkout turnover · Room ${room}`,
        meta: `Housekeeping · Floor ${room[0]} · Checkout turnover`,
        status: 'Assigned',
        chip: 'Due in 30m',
        tone: 'warning',
        room,
      };
      setState((prev) => ({
        ...prev,
        revokedRooms: prev.revokedRooms.includes(room) ? prev.revokedRooms : [...prev.revokedRooms, room],
        frontDesk: markCheckedOut(prev.frontDesk, room),
        items: { ...prev.items, task_fulfiller: [turnoverItem, ...prev.items.task_fulfiller] },
        feed: [
          { id: uid(), at: nowLabel(), role: 'Front Desk', text: `Express checkout · ${guestName} · Room ${room} · QR session revoked` },
          ...prev.feed,
        ].slice(0, 30),
      }));
      notify(`Checked out · Room ${room} session revoked`);
    },
    [notify],
  );

  const fdAction = useCallback<DemoApi['fdAction']>(
    (fn) => {
      const result = fn(stateRef.current);
      if ('error' in result) {
        notify(result.error);
        return result.error;
      }
      setState(result.next);
      notify(result.message);
      return null;
    },
    [notify],
  );

  const toggleStaffStatus = useCallback<DemoApi['toggleStaffStatus']>(
    (id) => {
      const staff = stateRef.current.staffAccounts?.find((s) => s.id === id);
      if (!staff) return;
      const nextStatus = staff.status === 'active' ? 'inactive' : 'active';
      setState((prev) => ({
        ...prev,
        staffAccounts: (prev.staffAccounts ?? []).map((s) => (s.id === id ? { ...s, status: nextStatus } : s)),
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Staff account status changed to ${nextStatus}`,
        category: 'Access',
        resource: `${staff.employeeId} · ${staff.name}`,
        outcome: 'success',
        details: `Role: ${roleById[staff.roleId]?.name} · Department: ${staff.department}`,
      });
      notify(`${staff.name} is now ${nextStatus}`);
    },
    [notify, recordAuditEvent],
  );

  const updateStaffRole = useCallback<DemoApi['updateStaffRole']>(
    (id, roleId, department, floorZone, shift) => {
      const staff = stateRef.current.staffAccounts?.find((s) => s.id === id);
      if (!staff) return;
      setState((prev) => ({
        ...prev,
        staffAccounts: (prev.staffAccounts ?? []).map((s) =>
          s.id === id ? { ...s, roleId, department, floorZone, shift } : s,
        ),
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Staff role & scopes updated`,
        category: 'Access',
        resource: `${staff.employeeId} · ${staff.name}`,
        outcome: 'success',
        details: `New Role: ${roleById[roleId]?.name} · Dept: ${department} · Scope: ${floorZone} · Shift: ${shift}`,
      });
      notify(`Permissions updated for ${staff.name}`);
    },
    [notify, recordAuditEvent],
  );

  const addStaffAccount = useCallback<DemoApi['addStaffAccount']>(
    (account) => {
      const newStaff: StaffAccount = {
        ...account,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
        lastActive: 'Just added',
      };
      setState((prev) => ({
        ...prev,
        staffAccounts: [newStaff, ...(prev.staffAccounts ?? [])],
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `New staff account provisioned`,
        category: 'Access',
        resource: `${newStaff.employeeId} · ${newStaff.name}`,
        outcome: 'success',
        details: `Role: ${roleById[newStaff.roleId]?.name} · Department: ${newStaff.department}`,
      });
      notify(`Added employee account for ${newStaff.name}`);
    },
    [notify, recordAuditEvent],
  );

  const updateWorkflowConfig = useCallback<DemoApi['updateWorkflowConfig']>(
    (partial) => {
      setState((prev) => ({
        ...prev,
        workflowConfig: { ...prev.workflowConfig, ...partial },
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Workflow & SLA configuration modified`,
        category: 'Workflow',
        resource: 'Property SLA Engine',
        outcome: 'success',
        details: `Parameters updated: ${Object.keys(partial).join(', ')}`,
      });
      notify('Workflow configuration saved');
    },
    [notify, recordAuditEvent],
  );

  const updateEventsConfig = useCallback<DemoApi['updateEventsConfig']>(
    (partial) => {
      setState((prev) => ({
        ...prev,
        eventsConfig: {
          ...(prev.eventsConfig ?? seedEventsConfig),
          ...partial,
        },
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Events & Celebrations configuration modified`,
        category: 'Workflow',
        resource: 'Events & Celebrations Service',
        outcome: 'success',
        details: `Parameters updated: ${Object.keys(partial).join(', ')}`,
      });
      notify('Events & Celebrations settings saved');
    },
    [notify, recordAuditEvent],
  );

  const revokeRoomSession = useCallback<DemoApi['revokeRoomSession']>(
    (room) => {
      setState((prev) => ({
        ...prev,
        revokedRooms: prev.revokedRooms.includes(room) ? prev.revokedRooms : [...prev.revokedRooms, room],
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Emergency QR session revoked`,
        category: 'Security',
        resource: `Room ${room} QR token`,
        outcome: 'warning',
        details: 'Instant access token invalidation applied',
      });
      notify(`Room ${room} guest QR session revoked`);
    },
    [notify, recordAuditEvent],
  );

  const restoreRoomSession = useCallback<DemoApi['restoreRoomSession']>(
    (room) => {
      setState((prev) => ({
        ...prev,
        revokedRooms: prev.revokedRooms.filter((r) => r !== room),
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `QR session re-authorized`,
        category: 'Access',
        resource: `Room ${room} QR token`,
        outcome: 'success',
        details: 'Session token digest restored to active status',
      });
      notify(`Room ${room} session restored`);
    },
    [notify, recordAuditEvent],
  );

  const setIntegrationState = useCallback<DemoApi['setIntegrationState']>(
    (id, next) => {
      const name = integrationList.find((i) => i.id === id)?.name ?? id.toUpperCase();
      setState((prev) => ({
        ...prev,
        integrations: { ...prev.integrations, [id]: next },
        feed: [{ id: uid(), at: nowLabel(), role: 'Admin', text: `${name} state set to ${next}` }, ...prev.feed].slice(0, 30),
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Integration state transitioned to ${next}`,
        category: 'Integration',
        resource: `${name} Connector`,
        outcome: next === 'down' ? 'warning' : 'success',
        details: next === 'down' ? 'Fallback simulation activated' : 'Connector operational',
      });
      notify(`${name} is now ${next}`);
    },
    [notify, recordAuditEvent],
  );

  const testConnector = useCallback<DemoApi['testConnector']>(
    (id) => {
      const name = integrationList.find((i) => i.id === id)?.name ?? id.toUpperCase();
      const currentState = stateRef.current.integrations[id] ?? 'healthy';
      const latency = currentState === 'healthy' ? Math.floor(25 + Math.random() * 30) : Math.floor(180 + Math.random() * 120);
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Diagnostic ping executed: ${currentState === 'down' ? 'FAILED' : 'SUCCESS'}`,
        category: 'Integration',
        resource: `${name} Endpoint`,
        outcome: currentState === 'down' ? 'denied' : 'success',
        details: currentState === 'down' ? 'Connection refused (simulated outage)' : `Roundtrip latency: ${latency}ms`,
      });
      notify(currentState === 'down' ? `Ping failed: ${name} is DOWN` : `Ping OK: ${name} responded in ${latency}ms`);
    },
    [notify, recordAuditEvent],
  );

  const simulateTestTask = useCallback<DemoApi['simulateTestTask']>(
    (department, priority = 'normal') => {
      const testId = uid();
      const testRef = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdAt = nowLabel();
      const testItem: WorkItem = {
        id: testId,
        title: `Workflow test: ${department} dispatch`,
        meta: `${department} · Triggered by Platform Admin · Ref ${testRef}`,
        status: 'Unassigned',
        chip: 'Admin test event',
        tone: 'accent',
        priority,
        createdAt,
        description: 'Simulated request to verify dual SLA timer countdown and auto-routing rules.',
        history: [{ at: createdAt, status: 'Unassigned', note: 'Injected by Platform Admin test' }],
      };
      setState((prev) => ({
        ...prev,
        items: { ...prev.items, department_dispatcher: [testItem, ...prev.items.department_dispatcher] },
        feed: [{ id: uid(), at: createdAt, role: 'Admin', text: `Test request dispatched to ${department} queue (${testRef})` }, ...prev.feed].slice(0, 30),
      }));
      recordAuditEvent({
        actor: 'Rajesh Sharma',
        actorRole: 'Platform Administrator',
        action: `Simulated workflow test request dispatched`,
        category: 'Workflow',
        resource: `${department} Dispatcher Queue`,
        outcome: 'success',
        details: `Reference: ${testRef} · Priority: ${priority}`,
      });
      notify(`Test task injected into ${department} queue (${testRef})`);
    },
    [notify, recordAuditEvent],
  );

  const updateStaffCapacity = useCallback<DemoApi['updateStaffCapacity']>(
    (staffId, maxWorkload) => {
      const validLoad = Math.max(1, Math.min(20, Math.round(maxWorkload)));
      const staff = stateRef.current.staffAccounts?.find((s) => s.id === staffId || s.employeeId === staffId);
      if (!staff) return;

      setState((prev) => ({
        ...prev,
        staffAccounts: (prev.staffAccounts ?? []).map((s) =>
          s.id === staff.id ? { ...s, maxWorkload: validLoad } : s,
        ),
      }));

      recordAuditEvent({
        actor: 'Arjun Mehta',
        actorRole: 'Department Dispatcher',
        action: 'Employee task capacity configured',
        category: 'Workflow',
        resource: `${staff.employeeId} · ${staff.name}`,
        outcome: 'success',
        details: `Max concurrent active tasks updated: ${validLoad} (prev: ${staff.maxWorkload || 5})`,
      });

      notify(`Updated max task capacity for ${staff.name} to ${validLoad}`);
    },
    [notify, recordAuditEvent],
  );

  const reviewResourceRequest = useCallback<DemoApi['reviewResourceRequest']>(
    (requestId, action, reviewNotes) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const req = (prev.resourceRequests ?? []).find((r) => r.id === requestId);
        if (!req) return prev;

        const updatedRequests = (prev.resourceRequests ?? []).map((r) =>
          r.id === requestId
            ? {
              ...r,
              status: action === 'approve' ? ('approved' as const) : ('rejected' as const),
              reviewedBy: 'Marcus Vance (Duty Manager)',
              reviewedAt: timestamp,
              reviewNotes: reviewNotes || (action === 'approve' ? 'Approved by Duty Operations' : 'Declined by Duty Operations'),
            }
            : r,
        );

        return {
          ...prev,
          resourceRequests: updatedRequests,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Resource request "${req.title}" was ${action === 'approve' ? 'approved' : 'rejected'}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Marcus Vance',
        actorRole: 'Duty Manager',
        action: `Resource request ${action === 'approve' ? 'approved' : 'rejected'}`,
        category: 'Hotel',
        resource: `Request ${requestId}`,
        outcome: 'success',
        details: reviewNotes || `Decision: ${action}`,
      });

      notify(`Resource request ${action === 'approve' ? 'approved' : 'rejected'}`);
    },
    [notify, recordAuditEvent],
  );

  const createResourceRequest = useCallback<DemoApi['createResourceRequest']>(
    (request) => {
      const timestamp = nowLabel();
      const newReq: ResourceRequest = {
        ...request,
        id: `res-${Date.now()}`,
        requestedAt: `Today ${timestamp}`,
        status: 'pending',
      };

      setState((prev) => ({
        ...prev,
        resourceRequests: [newReq, ...(prev.resourceRequests ?? [])],
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Operations',
            text: `New ${request.category} request logged: ${request.title}`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: request.requestedBy || 'Department Manager',
        actorRole: 'Operations',
        action: 'Resource request submitted',
        category: 'Hotel',
        resource: newReq.id,
        outcome: 'success',
        details: `Category: ${request.category} · Urgency: ${request.urgency}`,
      });

      notify(`Resource request submitted for ${request.department}`);
    },
    [notify, recordAuditEvent],
  );

  const submitShiftHandover = useCallback<DemoApi['submitShiftHandover']>(
    (handover) => {
      const timestamp = nowLabel();
      const newHandover: ShiftHandover = {
        ...handover,
        id: `sho-${Date.now()}`,
        timestamp: `Today ${timestamp}`,
        status: 'submitted',
      };

      setState((prev) => ({
        ...prev,
        shiftHandovers: [newHandover, ...(prev.shiftHandovers ?? [])],
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Duty Manager',
            text: `Shift handover submitted by ${handover.outgoingManager} (${handover.shift} Shift)`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: handover.outgoingManager,
        actorRole: 'Duty Manager',
        action: 'Shift handover briefing submitted',
        category: 'Workflow',
        resource: newHandover.id,
        outcome: 'success',
        details: `${handover.shift} Shift · Outstanding Tasks: ${handover.outstandingTasksCount} · Unresolved: ${handover.unresolvedComplaintsCount}`,
      });

      notify(`Shift handover recorded for ${handover.incomingManager}`);
    },
    [notify, recordAuditEvent],
  );

  const acknowledgeShiftHandover = useCallback<DemoApi['acknowledgeShiftHandover']>(
    (handoverId) => {
      setState((prev) => ({
        ...prev,
        shiftHandovers: (prev.shiftHandovers ?? []).map((h) =>
          h.id === handoverId ? { ...h, status: 'acknowledged' as const } : h,
        ),
      }));

      recordAuditEvent({
        actor: 'Marcus Vance',
        actorRole: 'Duty Manager',
        action: 'Shift handover briefing acknowledged',
        category: 'Workflow',
        resource: handoverId,
        outcome: 'success',
        details: 'Incoming manager confirmed handover notes and priority actions',
      });

      notify('Shift handover acknowledged and closed');
    },
    [notify, recordAuditEvent],
  );

  const resolveComplaintCase = useCallback<DemoApi['resolveComplaintCase']>(
    (complaintId, resolutionNotes, approvedComp) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const c = (prev.frontDesk?.complaints ?? []).find((x) => x.id === complaintId);
        if (!c) return prev;

        const compAmount = approvedComp !== undefined ? approvedComp : c.comp;
        const maxDutyLimit = prev.workflowConfig?.dutyManagerCompLimit || 16000;
        const withinLimit = compAmount <= maxDutyLimit;

        // Update frontDesk complaint
        const updatedComplaints = prev.frontDesk.complaints.map((item) =>
          item.id === c.id
            ? {
              ...item,
              comp: compAmount,
              compApplied: withinLimit && compAmount > 0 ? true : item.compApplied,
              managerNotes: resolutionNotes,
            }
            : item,
        );

        // Update manager alert item in items.department_manager
        const updatedMgrItems = prev.items.department_manager.map((item) => {
          if (item.id === c.managerItemId || item.room === c.room) {
            return {
              ...item,
              status: 'Resolved' as const,
              chip: 'Resolved by Duty Mgr',
              tone: 'success' as const,
              history: [
                ...(item.history ?? []),
                {
                  at: timestamp,
                  status: 'Resolved',
                  note: `Resolved by Marcus Vance: ${resolutionNotes}${compAmount > 0 ? ` · ₹${compAmount.toLocaleString('en-IN')} credit authorized` : ''}`,
                },
              ],
            };
          }
          return item;
        });

        // Add folio credit if applicable
        const updatedFolios =
          withinLimit && compAmount > 0
            ? {
              ...prev.folios,
              [c.room]: [
                ...(prev.folios[c.room] ?? []),
                {
                  id: uid(),
                  date: timestamp,
                  label: `Service recovery credit (Approved by Duty Manager)`,
                  amount: -compAmount,
                },
              ],
            }
            : prev.folios;

        return {
          ...prev,
          folios: updatedFolios,
          items: {
            ...prev.items,
            department_manager: updatedMgrItems,
          },
          frontDesk: {
            ...prev.frontDesk,
            complaints: updatedComplaints,
          },
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Complaint ${c.ref} (Room ${c.room}) resolved · ${resolutionNotes}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Marcus Vance',
        actorRole: 'Duty Manager',
        action: 'Guest complaint case resolved',
        category: 'Hotel',
        resource: `Complaint ${complaintId}`,
        outcome: 'success',
        details: `Notes: ${resolutionNotes} · Comp: ₹${approvedComp ?? 0}`,
      });

      notify(`Complaint case resolved and documented`);
    },
    [notify, recordAuditEvent],
  );

  const addManagerNote = useCallback<DemoApi['addManagerNote']>(
    (taskId, noteText) => {
      const timestamp = nowLabel();
      setState((prev) => {
        let found = false;
        const nextItems = { ...prev.items };

        (Object.keys(nextItems) as RoleId[]).forEach((r) => {
          nextItems[r] = nextItems[r].map((item) => {
            if (item.id === taskId || item.ref === taskId) {
              found = true;
              return {
                ...item,
                notes: item.notes ? `${item.notes}\n[${timestamp} Marcus Vance]: ${noteText}` : `[${timestamp} Marcus Vance]: ${noteText}`,
                history: [
                  ...(item.history ?? []),
                  {
                    at: timestamp,
                    status: item.status,
                    note: `Managerial note: ${noteText}`,
                  },
                ],
              };
            }
            return item;
          });
        });

        if (!found) return prev;

        return {
          ...prev,
          items: nextItems,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Managerial note appended to task ${taskId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify('Manager note saved to task record');
    },
    [notify],
  );

  const updateIncidentStatus = useCallback<DemoApi['updateIncidentStatus']>(
    (incidentId, status, noteText) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const inc = (prev.incidents ?? []).find((i) => i.id === incidentId || i.ref === incidentId);
        if (!inc) return prev;

        const timelineEntry = {
          at: timestamp,
          text: noteText || `Status transitioned to ${status} by Marcus Vance`,
        };

        const updatedIncidents = (prev.incidents ?? []).map((i) =>
          i.id === inc.id
            ? {
              ...i,
              status,
              timeline: [...i.timeline, timelineEntry],
            }
            : i,
        );

        return {
          ...prev,
          incidents: updatedIncidents,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Incident ${inc.ref} marked ${status}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Marcus Vance',
        actorRole: 'Duty Manager',
        action: `Incident operational status updated`,
        category: 'Security',
        resource: incidentId,
        outcome: 'success',
        details: `New status: ${status}${noteText ? ` · ${noteText}` : ''}`,
      });

      notify(`Incident updated to ${status}`);
    },
    [notify, recordAuditEvent],
  );

  const reviewExecutiveItem = useCallback<DemoApi['reviewExecutiveItem']>(
    (itemId, action, reason, comments) => {
      if (itemId.startsWith('gm-department-')) {
        try {
          const next = reviewManagerEscalation(stateRef.current, itemId, action, reason || comments || 'General Manager decision recorded.', crypto.randomUUID());
          stateRef.current = next;
          setState(next);
          notify('Decision sent to the department manager.');
        } catch (error) { notify(error instanceof Error ? error.message : 'Could not save decision.'); }
        return;
      }
      const timestamp = nowLabel();
      setState((prev) => {
        const list = prev.items.executive_viewer ?? [];
        const item = list.find((i) => i.id === itemId);
        if (!item) return prev;

        const nextStatus =
          action === 'approve'
            ? 'Approved'
            : action === 'reject'
              ? 'Rejected'
              : 'Info Requested';

        const nextChip =
          action === 'approve'
            ? 'GM Approved'
            : action === 'reject'
              ? 'Declined by GM'
              : 'Pending Clarification';

        const nextTone =
          action === 'approve'
            ? ('success' as const)
            : action === 'reject'
              ? ('danger' as const)
              : ('info' as const);

        const historyEntry = {
          at: timestamp,
          status: nextStatus,
          note:
            reason ||
            comments ||
            (action === 'approve'
              ? 'Authorized by Executive General Manager Priya Nair'
              : action === 'reject'
                ? 'Declined by Executive General Manager'
                : 'Clarification requested on budget impact'),
        };

        const updatedList = list.map((i) =>
          i.id === itemId
            ? {
              ...i,
              status: nextStatus,
              chip: nextChip,
              tone: nextTone,
              history: [...(i.history ?? []), historyEntry],
            }
            : i,
        );

        // Cross-role updates:
        let updatedComplaints = prev.frontDesk.complaints;
        let updatedFolios = prev.folios;
        if (action === 'approve' && item.room) {
          updatedComplaints = (prev.frontDesk.complaints ?? []).map((c) =>
            c.room === item.room ? { ...c, compApplied: true } : c,
          );
          if (item.amount && item.amount > 0) {
            const currentFolio = prev.folios[item.room] ?? [];
            const folioLine = {
              id: uid(),
              label: `Executive Goodwill Adjustment · Approved by GM`,
              amount: -item.amount,
              date: timestamp,
            };
            updatedFolios = {
              ...prev.folios,
              [item.room]: [folioLine, ...currentFolio],
            };
          }
        }

        const updatedResourceRequests = (prev.resourceRequests ?? []).map((r) => {
          if (
            (item.id === 'exe-3' && r.id === 'res-2') ||
            (item.id === 'exe-5' && r.id === 'res-3') ||
            r.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 15))
          ) {
            return {
              ...r,
              status: action === 'approve' ? ('approved' as const) : action === 'reject' ? ('rejected' as const) : r.status,
              reviewedBy: 'Priya Nair (General Manager)',
              reviewedAt: timestamp,
              reviewNotes: reason || comments || `Executive decision: ${action}`,
            };
          }
          return r;
        });

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Executive Decision: ${item.title.split('·')[0].trim()}`,
          message: `Priya Nair (GM) has marked "${item.title}" as ${nextStatus}.${reason ? ` Reason: ${reason}` : ''}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            executive_viewer: updatedList,
          },
          frontDesk: {
            ...prev.frontDesk,
            complaints: updatedComplaints,
          },
          folios: updatedFolios,
          resourceRequests: updatedResourceRequests,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Executive Office',
              text: `Priya Nair marked "${item.title}" as ${nextStatus}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Priya Nair',
        actorRole: 'Executive Director / GM',
        action: `Executive Approval: ${action.toUpperCase()}`,
        category: 'Workflow',
        resource: `Executive Item ${itemId}`,
        outcome: action === 'reject' ? 'denied' : 'success',
        details: reason ? `Reason: ${reason}` : comments || `Status transitioned to ${action} by Priya Nair`,
      });

      notify(`Executive decision recorded: ${action.replace('_', ' ')}`);
    },
    [notify, recordAuditEvent],
  );

  const addExecutiveComment = useCallback<DemoApi['addExecutiveComment']>(
    (itemId, comment) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const list = prev.items.executive_viewer ?? [];
        const item = list.find((i) => i.id === itemId);
        if (!item) return prev;

        const updatedList = list.map((i) =>
          i.id === itemId
            ? {
              ...i,
              history: [
                ...(i.history ?? []),
                { at: timestamp, status: 'Executive Note', note: `[Priya Nair - GM] ${comment}` },
              ],
            }
            : i,
        );

        return {
          ...prev,
          items: {
            ...prev.items,
            executive_viewer: updatedList,
          },
        };
      });

      recordAuditEvent({
        actor: 'Priya Nair',
        actorRole: 'Executive Director / GM',
        action: 'Executive Comment Added',
        category: 'Workflow',
        resource: `Executive Item ${itemId}`,
        outcome: 'success',
        details: comment,
      });

      notify('Executive note appended to case history');
    },
    [notify, recordAuditEvent],
  );

  const requestExecutiveDirective = useCallback<DemoApi['requestExecutiveDirective']>(
    (targetId, type, directiveText) => {
      const timestamp = nowLabel();
      setState((prev) => {
        let updatedIncidents = prev.incidents ?? [];
        if (type === 'incident') {
          updatedIncidents = updatedIncidents.map((i) =>
            i.id === targetId || i.ref === targetId
              ? {
                ...i,
                timeline: [
                  ...i.timeline,
                  { at: timestamp, text: `[Executive Directive - Priya Nair] ${directiveText}` },
                ],
              }
              : i,
          );
        }

        const newNotification: InAppNotification = {
          id: uid(),
          title: 'Executive Directive Issued',
          message: `GM Priya Nair dispatched directive on ${targetId}: "${directiveText}"`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
        };

        return {
          ...prev,
          incidents: updatedIncidents,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Executive Office',
              text: `Directive dispatched on ${targetId}: ${directiveText}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Priya Nair',
        actorRole: 'Executive Director / GM',
        action: 'Executive Operational Directive Issued',
        category: type === 'incident' ? 'Security' : 'Workflow',
        resource: targetId,
        outcome: 'success',
        details: directiveText,
      });

      notify('Executive directive dispatched to operational teams');
    },
    [notify, recordAuditEvent],
  );

  const acknowledgeSecurityItem = useCallback<DemoApi['acknowledgeSecurityItem']>(
    (itemId) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Acknowledged',
              chip: 'Responding',
              tone: 'warning' as Tone,
              acknowledgedAt: timestamp,
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: 'Acknowledged', note: 'Inspector Roy acknowledged alert · en route' },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              status: 'investigating' as const,
              timeline: [
                ...inc.timeline,
                { at: timestamp, text: 'Security Responder Inspector Roy acknowledged incident & en route' },
              ],
            };
          }
          return inc;
        });

        const updatedNotifs = (prev.notifications ?? []).map((n) =>
          n.itemId === itemId || (n.roleId === 'security_responder' && n.title.includes(itemId))
            ? { ...n, read: true }
            : n,
        );

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: updatedNotifs,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Inspector Roy acknowledged alert: ${updatedTitle || itemId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security Incident Acknowledged',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: 'Officer acknowledged incident alert and marked en route',
      });

      notify('Alert acknowledged: en route to incident location');
    },
    [notify, recordAuditEvent],
  );

  const arriveSecurityItem = useCallback<DemoApi['arriveSecurityItem']>(
    (itemId) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'On scene',
              chip: 'On Scene',
              tone: 'warning' as Tone,
              arrivedAt: timestamp,
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: 'On scene', note: 'Inspector Roy arrived on scene and secured perimeter' },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              timeline: [
                ...inc.timeline,
                { at: timestamp, text: 'Inspector Roy arrived on scene. Establishing containment.' },
              ],
            };
          }
          return inc;
        });

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Inspector Roy arrived on scene: ${updatedTitle || itemId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security On Scene',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: 'Officer confirmed arrival on scene',
      });

      notify('Marked on scene. Incident area under security assessment.');
    },
    [notify, recordAuditEvent],
  );

  const resolveSecurityItem = useCallback<DemoApi['resolveSecurityItem']>(
    (itemId, report) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Resolved',
              chip: 'Secured',
              tone: 'success' as Tone,
              resolvedAt: timestamp,
              photoUrl: report.photoUrl || item.photoUrl,
              securityReport: {
                ...report,
                filedAt: timestamp,
                officer: 'Inspector Roy (EMP-0108)',
              },
              history: [
                ...(item.history ?? []),
                {
                  at: timestamp,
                  status: 'Resolved',
                  note: `Formal Security Incident Report filed. Outcome: ${report.outcome}`,
                },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              status: 'resolved' as const,
              timeline: [
                ...inc.timeline,
                {
                  at: timestamp,
                  text: `Incident resolved by Inspector Roy. Report: ${report.summary}. Outcome: ${report.outcome}`,
                },
              ],
            };
          }
          return inc;
        });

        const dutyMgrNotification: InAppNotification = {
          id: uid(),
          title: `Security Resolved: ${updatedTitle.split('·')[0].trim() || itemId}`,
          message: `Inspector Roy resolved incident with formal report. Outcome: ${report.outcome}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: [dutyMgrNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Incident resolved and report submitted: ${updatedTitle || itemId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security Incident Resolved & Report Filed',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: `Report summary: ${report.summary}. Actions: ${report.actionsTaken}. Outcome: ${report.outcome}`,
      });

      notify('Security incident report logged and case resolved successfully');
    },
    [notify, recordAuditEvent],
  );

  const requestSecurityBackup = useCallback<DemoApi['requestSecurityBackup']>(
    (itemId, reason) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Backup requested',
              chip: 'Backup Requested',
              tone: 'danger' as Tone,
              backupReason: reason,
              backupRequestedAt: timestamp,
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: 'Backup requested', note: `Backup assistance requested: ${reason}` },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              timeline: [
                ...inc.timeline,
                { at: timestamp, text: `Officer requested immediate backup: ${reason}` },
              ],
            };
          }
          return inc;
        });

        const backupNotification: InAppNotification = {
          id: uid(),
          title: `URGENT: Security Backup Requested`,
          message: `Inspector Roy requested immediate backup for ${updatedTitle || itemId}. Reason: ${reason}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: [backupNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `BACKUP REQUESTED by Inspector Roy: ${reason}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security Backup Requested',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: reason,
      });

      notify('Immediate backup requested. Dispatcher & Duty Manager notified.');
    },
    [notify, recordAuditEvent],
  );

  const escalateSecurityItem = useCallback<DemoApi['escalateSecurityItem']>(
    (itemId, reason, notes) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Escalated',
              chip: 'Escalated to Duty Mgr',
              tone: 'danger' as Tone,
              escalatedTo: 'Duty Manager Marcus Vance',
              escalatedAt: timestamp,
              escalationReason: reason,
              history: [
                ...(item.history ?? []),
                {
                  at: timestamp,
                  status: 'Escalated',
                  note: `Escalated to Duty Manager Marcus Vance. Reason: ${reason}${notes ? ` (${notes})` : ''}`,
                },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              status: 'investigating' as const,
              timeline: [
                ...inc.timeline,
                {
                  at: timestamp,
                  text: `Escalated to Duty Manager Marcus Vance: ${reason}. Notes: ${notes || 'None'}`,
                },
              ],
            };
          }
          return inc;
        });

        const dutyMgrNotification: InAppNotification = {
          id: uid(),
          title: `Security Escalation: ${updatedTitle.split('·')[0].trim() || itemId}`,
          message: `Inspector Roy escalated incident to Marcus Vance (Duty Manager). Reason: ${reason}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: [dutyMgrNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Incident escalated to Duty Manager Marcus Vance: ${reason}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security Escalation to Duty Manager',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: `Reason: ${reason}. Notes: ${notes || 'N/A'}`,
      });

      notify('Incident escalated to Duty Manager Marcus Vance');
    },
    [notify, recordAuditEvent],
  );

  const addSecurityNote = useCallback<DemoApi['addSecurityNote']>(
    (itemId, text) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            const newNote = { at: timestamp, author: 'Inspector Roy', text };
            return {
              ...item,
              securityNotes: [...(item.securityNotes ?? []), newNote],
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: item.status, note: `Officer note: ${text}` },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              timeline: [...inc.timeline, { at: timestamp, text: `[Security Note - Inspector Roy] ${text}` }],
            };
          }
          return inc;
        });

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
        };
      });

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security Note Logged',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: text,
      });

      notify('Field note recorded in secure audit log');
    },
    [notify, recordAuditEvent],
  );

  const createSecurityIncident = useCallback<DemoApi['createSecurityIncident']>(
    (incident) => {
      const timestamp = nowLabel();
      const id = `sec-${Date.now().toString().slice(-4)}`;
      const ref = `SEC-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const toneMap: Record<string, Tone> = {
        critical: 'danger',
        major: 'danger',
        moderate: 'warning',
        minor: 'info',
      };
      const priorityMap: Record<string, WorkItem['priority']> = {
        critical: 'critical',
        major: 'urgent',
        moderate: 'normal',
        minor: 'normal',
      };

      const newItem: WorkItem = {
        id,
        ref,
        title: incident.title,
        meta: `${incident.location} · Logged by Inspector Roy`,
        status: 'New',
        chip: incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1),
        tone: toneMap[incident.severity] ?? 'info',
        priority: priorityMap[incident.severity] ?? 'normal',
        category: 'safety',
        location: incident.location,
        floor: incident.floor,
        room: incident.room,
        createdAt: timestamp,
        description: incident.description,
        history: [
          { at: timestamp, status: 'Logged', note: `Incident logged directly by Inspector Roy on patrol` },
        ],
      };

      const newIncidentRecord: IncidentRecord = {
        id,
        ref,
        title: incident.title,
        severity: incident.severity,
        affectedArea: incident.location,
        department: 'Safety & Security',
        coordinator: 'Inspector Roy',
        reportedAt: timestamp,
        status: 'investigating',
        timeline: [
          { at: timestamp, text: `Field incident logged by Inspector Roy: ${incident.description}` },
        ],
        relatedTaskRef: id,
      };

      const newNotification: InAppNotification = {
        id: uid(),
        title: `Security Alert: ${incident.title}`,
        message: `${incident.severity.toUpperCase()} incident logged at ${incident.location} by Inspector Roy`,
        timestamp,
        roleId: 'security_responder',
        read: false,
        type: 'alert',
        itemId: id,
      };

      const dutyMgrNotification: InAppNotification = {
        id: uid(),
        title: `Security Log: ${incident.title}`,
        message: `Field security incident filed at ${incident.location} (${incident.severity})`,
        timestamp,
        roleId: 'department_manager',
        read: false,
        type: 'alert',
        itemId: id,
      };

      setState((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          security_responder: [newItem, ...(prev.items.security_responder ?? [])],
        },
        incidents: [newIncidentRecord, ...(prev.incidents ?? [])],
        notifications: [newNotification, dutyMgrNotification, ...(prev.notifications ?? [])].slice(0, 50),
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Security Responder',
            text: `Field incident logged: ${incident.title} (${incident.location})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Inspector Roy',
        actorRole: 'Security Officer',
        action: 'Security Field Incident Created',
        category: 'Security',
        resource: id,
        outcome: 'success',
        details: `${incident.title} at ${incident.location} (${incident.severity})`,
      });

      notify('Field incident logged and added to active queue');
    },
    [notify, recordAuditEvent],
  );

  const recordInvoicePayment = useCallback<DemoApi['recordInvoicePayment']>(
    (invoiceId, amount, paymentMethod, referenceNumber, notes) => {
      const timestamp = nowLabel();
      let updatedGuest = '';
      let updatedRoom = '';
      let finalBal = 0;

      setState((prev) => {
        const invoices = (prev.invoices ?? seedInvoices).map((inv) => {
          if (inv.id === invoiceId) {
            updatedGuest = inv.guestName;
            updatedRoom = inv.roomNumber;
            const newPaid = inv.paidAmount + amount;
            const newOutstanding = Math.max(0, inv.totalAmount - newPaid);
            finalBal = newOutstanding;
            const newStatus: InvoiceStatus = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';
            return {
              ...inv,
              paidAmount: newPaid,
              outstandingBalance: newOutstanding,
              status: newStatus,
              paymentMethod: inv.paymentMethod ? `${inv.paymentMethod}, ${paymentMethod}` : paymentMethod,
              notes: notes ? (inv.notes ? `${inv.notes} | ${notes}` : notes) : inv.notes,
            };
          }
          return inv;
        });

        const newTxn: FinanceTransaction = {
          id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          invoiceId,
          guestName: updatedGuest || 'Guest',
          bookingRef: `BK-${invoiceId.slice(-4)}`,
          roomNumber: updatedRoom || 'N/A',
          amount,
          paymentMethod,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: timestamp,
          status: 'Successful',
          referenceNumber: referenceNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
          gateway:
            paymentMethod === 'Cash'
              ? 'Front Desk Cash Register'
              : paymentMethod === 'UPI'
                ? 'Razorpay Enterprise'
                : 'HDFC Merchant Gateway',
          notes: notes || 'Manual payment recorded via Financial Operator console',
          isReconciled: true,
        };

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Payment Recorded: ₹${amount.toLocaleString('en-IN')}`,
          message: `Recorded payment of ₹${amount.toLocaleString('en-IN')} for ${updatedGuest} (Room ${updatedRoom}, ${invoiceId}) via ${paymentMethod}.`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'task',
          itemId: invoiceId,
        };

        return {
          ...prev,
          invoices,
          transactions: [newTxn, ...(prev.transactions ?? seedTransactions)],
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${invoiceId} (${updatedGuest})`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Neha Kapoor',
        actorRole: 'Financial Controller',
        action: 'Invoice Payment Recorded',
        category: 'Finance',
        resource: invoiceId,
        outcome: 'success',
        details: `Recorded ₹${amount.toLocaleString('en-IN')} via ${paymentMethod} (Ref: ${referenceNumber}). Remaining balance: ₹${finalBal.toLocaleString('en-IN')}.`,
      });

      notify(`Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully.`);
    },
    [notify, recordAuditEvent],
  );

  const createInvoice = useCallback<DemoApi['createInvoice']>(
    (invInput) => {
      const timestamp = nowLabel();
      const id = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const outstandingBalance = Math.max(0, invInput.totalAmount - invInput.paidAmount);
      const status: InvoiceStatus =
        outstandingBalance <= 0
          ? 'Paid'
          : invInput.paidAmount > 0
            ? 'Partially Paid'
            : 'Unpaid';

      const newInvoice: FinanceInvoice = {
        ...invInput,
        id,
        createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        outstandingBalance,
        status,
      };

      setState((prev) => {
        let txns = prev.transactions ?? seedTransactions;
        if (invInput.paidAmount > 0) {
          const newTxn: FinanceTransaction = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceId: id,
            guestName: invInput.guestName,
            bookingRef: invInput.bookingId,
            roomNumber: invInput.roomNumber,
            amount: invInput.paidAmount,
            paymentMethod: (invInput.paymentMethod as PaymentMethod) || 'Credit Card',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: timestamp,
            status: 'Successful',
            referenceNumber: `AUTH-${Math.floor(10000 + Math.random() * 90000)}`,
            gateway: 'Front Desk Terminal',
            notes: 'Advance / partial payment collected at invoice creation',
            isReconciled: true,
          };
          txns = [newTxn, ...txns];
        }

        const newNotification: InAppNotification = {
          id: uid(),
          title: `New Invoice Generated: ${id}`,
          message: `Generated invoice ${id} for ${invInput.guestName} (Room ${invInput.roomNumber}) for ₹${invInput.totalAmount.toLocaleString('en-IN')}.`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'task',
          itemId: id,
        };

        return {
          ...prev,
          invoices: [newInvoice, ...(prev.invoices ?? seedInvoices)],
          transactions: txns,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Invoice ${id} created for ${invInput.guestName} · Room ${invInput.roomNumber} (₹${invInput.totalAmount.toLocaleString('en-IN')})`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Neha Kapoor',
        actorRole: 'Financial Controller',
        action: 'Invoice Created',
        category: 'Finance',
        resource: id,
        outcome: 'success',
        details: `Invoice for ${invInput.guestName} (Room ${invInput.roomNumber}) generated for ₹${invInput.totalAmount.toLocaleString('en-IN')}`,
      });

      notify(`Invoice ${id} generated successfully.`);
    },
    [notify, recordAuditEvent],
  );

  const reviewRefundRequest = useCallback<DemoApi['reviewRefundRequest']>(
    (refundId, action, notes, rejectionReason) => {
      const timestamp = nowLabel();
      let updatedGuest = '';
      let refundAmount = 0;
      let targetInvId = '';

      setState((prev) => {
        const refunds = (prev.refundRequests ?? seedRefundRequests).map((ref) => {
          if (ref.id === refundId) {
            updatedGuest = ref.guestName;
            refundAmount = ref.amount;
            targetInvId = ref.invoiceId;

            const nextStatus: RefundStatus =
              action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Executed';

            return {
              ...ref,
              status: nextStatus,
              reviewedBy: 'Neha Kapoor (Financial Controller)',
              reviewedAt: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${timestamp}`,
              reviewNotes: notes || ref.reviewNotes,
              rejectionReason: action === 'reject' ? rejectionReason || notes : ref.rejectionReason,
              transactionRef:
                action === 'execute'
                  ? `REFUND-CRED-${Math.floor(100 + Math.random() * 900)}`
                  : ref.transactionRef,
            };
          }
          return ref;
        });

        let updatedInvoices = prev.invoices ?? seedInvoices;
        let updatedTransactions = prev.transactions ?? seedTransactions;

        if (action === 'execute') {
          updatedInvoices = updatedInvoices.map((inv) => {
            if (inv.id === targetInvId) {
              const newPaid = Math.max(0, inv.paidAmount - refundAmount);
              return {
                ...inv,
                paidAmount: newPaid,
                status: 'Refunded' as InvoiceStatus,
                notes: inv.notes
                  ? `${inv.notes} | Refund of ₹${refundAmount.toLocaleString('en-IN')} executed`
                  : `Refund of ₹${refundAmount.toLocaleString('en-IN')} executed`,
              };
            }
            return inv;
          });

          const refundTxn: FinanceTransaction = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceId: targetInvId,
            guestName: updatedGuest,
            bookingRef: `REF-${refundId}`,
            roomNumber: 'N/A',
            amount: refundAmount,
            paymentMethod: 'Credit Card',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: timestamp,
            status: 'Refunded',
            referenceNumber: `REFUND-REV-${Math.floor(1000 + Math.random() * 9000)}`,
            gateway: 'HDFC Merchant Gateway',
            notes: notes || `Refund executed for ${refundId}`,
            isReconciled: true,
          };
          updatedTransactions = [refundTxn, ...updatedTransactions];
        }

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Refund Decision: ${refundId} (${action.toUpperCase()})`,
          message: `Neha Kapoor marked refund ${refundId} for ${updatedGuest} (₹${refundAmount.toLocaleString('en-IN')}) as ${action.toUpperCase()}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'alert',
          itemId: refundId,
        };

        return {
          ...prev,
          refundRequests: refunds,
          invoices: updatedInvoices,
          transactions: updatedTransactions,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Refund ${refundId} (${updatedGuest}, ₹${refundAmount.toLocaleString('en-IN')}) marked as ${action.toUpperCase()}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Neha Kapoor',
        actorRole: 'Financial Controller',
        action: `Refund ${action.toUpperCase()}`,
        category: 'Finance',
        resource: refundId,
        outcome: action === 'reject' ? 'failure' : 'success',
        details: `Refund for ${updatedGuest} (₹${refundAmount.toLocaleString('en-IN')}) ${action}ed.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      });

      notify(`Refund request ${refundId} marked as ${action.toUpperCase()}.`);
    },
    [notify, recordAuditEvent],
  );

  const updateTransactionStatus = useCallback<DemoApi['updateTransactionStatus']>(
    (txnId, status, notes) => {
      const timestamp = nowLabel();
      let updatedGuest = '';

      setState((prev) => {
        const transactions = (prev.transactions ?? seedTransactions).map((tx) => {
          if (tx.id === txnId) {
            updatedGuest = tx.guestName;
            return {
              ...tx,
              status,
              notes: notes || tx.notes,
              isReconciled: status === 'Successful' ? true : tx.isReconciled,
            };
          }
          return tx;
        });

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Transaction Updated: ${txnId}`,
          message: `Transaction ${txnId} for ${updatedGuest} status changed to ${status}.`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'task',
          itemId: txnId,
        };

        return {
          ...prev,
          transactions,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Transaction ${txnId} (${updatedGuest}) updated to ${status}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Neha Kapoor',
        actorRole: 'Financial Controller',
        action: 'Transaction Status Updated',
        category: 'Finance',
        resource: txnId,
        outcome: 'success',
        details: `Transaction status manually set to ${status}. Details: ${notes || 'Operator reconciliation override'}`,
      });

      notify(`Transaction ${txnId} updated to ${status}.`);
    },
    [notify, recordAuditEvent],
  );

  const reconcileTransaction = useCallback<DemoApi['reconcileTransaction']>(
    (txnId) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const transactions = (prev.transactions ?? seedTransactions).map((tx) => {
          if (tx.id === txnId) {
            return {
              ...tx,
              isReconciled: true,
              status: tx.status === 'Failed' ? ('Successful' as TransactionStatus) : tx.status,
            };
          }
          return tx;
        });

        return {
          ...prev,
          transactions,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Transaction ${txnId} reconciled against settlement batch`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Neha Kapoor',
        actorRole: 'Financial Controller',
        action: 'Transaction Reconciled',
        category: 'Finance',
        resource: txnId,
        outcome: 'success',
        details: 'Matched and cleared against bank settlement batch',
      });

      notify(`Transaction ${txnId} successfully reconciled.`);
    },
    [notify, recordAuditEvent],
  );

  const approveInspection = useCallback<DemoApi['approveInspection']>(
    (inspectionId, notes) => {
      const timestamp = nowLabel();
      let targetRoom = '';
      let targetTaskId: string | undefined;

      setState((prev) => {
        const inspections = (prev.inspections ?? seedInspections).map((insp) => {
          if (insp.id === inspectionId) {
            targetRoom = insp.roomNumber;
            targetTaskId = insp.taskId;
            return {
              ...insp,
              status: 'passed' as const,
              inspectedAt: timestamp,
              inspectedBy: 'Meera Nambiar (EMP-0105)',
              score: 100,
              notes: notes || insp.notes || 'Passed checklist. Room released to Front Desk inventory.',
            };
          }
          return insp;
        });

        // Update front desk room status to clean & ready
        const rooms = prev.frontDesk.rooms.map((rm) => {
          if (rm.no === targetRoom) {
            return {
              ...rm,
              readiness: 'ready' as const,
              note: `Inspected & Passed by Meera Nambiar at ${timestamp}`,
            };
          }
          return rm;
        });

        // Update task item if associated
        const updatedItems = { ...prev.items };
        if (targetTaskId) {
          Object.keys(updatedItems).forEach((roleKey) => {
            const role = roleKey as RoleId;
            updatedItems[role] = updatedItems[role].map((item) => {
              if (item.id === targetTaskId) {
                return {
                  ...item,
                  status: 'Completed',
                  notes: `${item.notes || ''} [Supervisor: Inspected & approved at ${timestamp}]`.trim(),
                };
              }
              return item;
            });
          });
        }

        const newNotification: InAppNotification = {
          id: `notif-${uid()}`,
          title: `Room ${targetRoom} Turnover Passed`,
          summary: `Supervisor Meera Nambiar certified Room ${targetRoom}. Inventory updated to Ready.`,
          timestamp,
          read: false,
          tone: 'info',
          targetRole: 'front_desk_coordinator',
          category: 'Operations',
        };

        return {
          ...prev,
          inspections,
          frontDesk: {
            ...prev.frontDesk,
            rooms,
          },
          items: updatedItems,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Housekeeping Supervisor',
              text: `Room ${targetRoom} turnover approved by Meera Nambiar. Marked Ready for check-in.`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Housekeeping Supervisor',
        action: 'Room Inspection Approved',
        category: 'Workflow',
        resource: targetRoom ? `Room ${targetRoom}` : inspectionId,
        outcome: 'success',
        details: `Passed quality checklist with score 100%. Room inventory marked ready. Notes: ${notes || 'Clean & verified'}`,
      });

      notify(`Room ${targetRoom || 'inspection'} approved & marked READY for check-in!`);
    },
    [notify, recordAuditEvent],
  );

  const reopenInspection = useCallback<DemoApi['reopenInspection']>(
    (inspectionId, reason, correctiveAction, reassignToStaffId) => {
      const timestamp = nowLabel();
      let targetRoom = '';
      let targetTaskId: string | undefined;
      let newAssigneeName: string | undefined;

      setState((prev) => {
        if (reassignToStaffId) {
          const staff = (prev.staffAccounts ?? []).find(
            (s) => s.id === reassignToStaffId || s.employeeId === reassignToStaffId,
          );
          if (staff) newAssigneeName = staff.name;
        }

        const inspections = (prev.inspections ?? seedInspections).map((insp) => {
          if (insp.id === inspectionId) {
            targetRoom = insp.roomNumber;
            targetTaskId = insp.taskId;
            return {
              ...insp,
              status: 'reopened' as const,
              inspectedAt: timestamp,
              inspectedBy: 'Meera Nambiar (EMP-0105)',
              score: 65,
              reopenReason: reason,
              correctiveAction: correctiveAction,
              attendantName: newAssigneeName || insp.attendantName,
              notes: `Failed inspection: ${reason}. Corrective action: ${correctiveAction}`,
            };
          }
          return insp;
        });

        // Set room status back to cleaning
        const rooms = prev.frontDesk.rooms.map((rm) => {
          if (rm.no === targetRoom) {
            return {
              ...rm,
              readiness: 'cleaning' as const,
              note: `Failed inspection: ${reason}. Corrective touch-up in progress.`,
            };
          }
          return rm;
        });

        // Update task item status back to In progress
        const updatedItems = { ...prev.items };
        if (targetTaskId) {
          Object.keys(updatedItems).forEach((roleKey) => {
            const role = roleKey as RoleId;
            updatedItems[role] = updatedItems[role].map((item) => {
              if (item.id === targetTaskId) {
                return {
                  ...item,
                  status: 'In progress',
                  assignee: newAssigneeName || item.assignee,
                  notes: `${item.notes || ''} [Supervisor Reopened: ${reason} - ${correctiveAction}]`.trim(),
                };
              }
              return item;
            });
          });
        }

        const newNotification: InAppNotification = {
          id: `notif-${uid()}`,
          title: `Room ${targetRoom} Corrective Touch-up Required`,
          summary: `Supervisor flagged: ${reason}. Action: ${correctiveAction}`,
          timestamp,
          read: false,
          tone: 'urgent',
          targetRole: 'room_attendant_fulfiller',
          category: 'Operations',
        };

        return {
          ...prev,
          inspections,
          frontDesk: {
            ...prev.frontDesk,
            rooms,
          },
          items: updatedItems,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Housekeeping Supervisor',
              text: `Room ${targetRoom} inspection reopened by Meera Nambiar (${reason}). Returned for touch-up.`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Housekeeping Supervisor',
        action: 'Room Inspection Reopened',
        category: 'Workflow',
        resource: targetRoom ? `Room ${targetRoom}` : inspectionId,
        outcome: 'warning',
        details: `Checklist failed. Reason: ${reason}. Required action: ${correctiveAction}. Assigned to: ${newAssigneeName || 'Original attendant'}`,
      });

      notify(`Inspection for Room ${targetRoom} returned for corrective cleaning.`);
    },
    [notify, recordAuditEvent],
  );

  const reviewFulfillerReassignment = useCallback<DemoApi['reviewFulfillerReassignment']>(
    (taskId, action, newAssigneeId, notes) => {
      const timestamp = nowLabel();
      let updatedTaskRef = '';
      let updatedTaskTitle = '';
      let targetAssigneeName = '';

      setState((prev) => {
        if (newAssigneeId) {
          const staff = (prev.staffAccounts ?? []).find(
            (s) => s.id === newAssigneeId || s.employeeId === newAssigneeId,
          );
          if (staff) targetAssigneeName = staff.name;
        }

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: action === 'reassign' ? 'Reassigned' : 'Assigned',
          note:
            action === 'reassign'
              ? `Reassigned to ${targetAssigneeName || 'colleague'} by Supervisor Meera Nambiar. Reason: ${notes || 'Approved'}`
              : `Reassignment declined by Supervisor Meera Nambiar. Note: ${notes || 'Attendant retained on task'}. Please proceed.`,
          actor: 'Meera Nambiar',
          role: 'Department Supervisor',
        };

        const updatedItems = { ...prev.items };
        Object.keys(updatedItems).forEach((roleKey) => {
          const role = roleKey as RoleId;
          updatedItems[role] = (updatedItems[role] ?? []).map((item) => {
            if (item.id === taskId || (updatedTaskRef && item.ref === updatedTaskRef)) {
              updatedTaskRef = item.ref || updatedTaskRef;
              updatedTaskTitle = item.title || updatedTaskTitle;
              if (action === 'reassign') {
                const isVikramStillAssignee = newAssigneeId === 'EMP-0103' || targetAssigneeName === 'Vikram Singh';
                return {
                  ...item,
                  reassignPending: false,
                  reassignReason: undefined,
                  assignee: targetAssigneeName || item.assignee,
                  assigneeId: newAssigneeId || item.assigneeId,
                  status: role === 'task_fulfiller' && !isVikramStillAssignee ? 'Reassigned' : 'Assigned',
                  chip: `Assigned: ${(targetAssigneeName || item.assignee || '').split(' ')[0]}`,
                  tone: 'info' as const,
                  history: [...(item.history ?? []), historyEntry],
                  notes: `${item.notes || ''} [Supervisor Reassigned to ${targetAssigneeName || 'colleague'}: ${notes || 'Approved'}]`.trim(),
                };
              } else {
                return {
                  ...item,
                  reassignPending: false,
                  status: 'Assigned',
                  chip: 'Reassignment declined',
                  tone: 'info' as const,
                  history: [...(item.history ?? []), historyEntry],
                  notes: `${item.notes || ''} [Supervisor Declined Reassignment: ${notes || 'Retain task'}]`.trim(),
                };
              }
            }
            return item;
          });
        });

        const fulfillerNotif: InAppNotification = {
          id: uid(),
          roleId: 'task_fulfiller',
          title: action === 'reassign' ? 'Reassignment Approved' : 'Reassignment Declined',
          message:
            action === 'reassign'
              ? `Supervisor Meera Nambiar approved reassignment of "${updatedTaskTitle || 'Task'}" to ${targetAssigneeName}.`
              : `Supervisor Meera Nambiar declined reassignment of "${updatedTaskTitle || 'Task'}". Note: ${notes || 'Please proceed with your assigned task.'}`,
          timestamp,
          read: false,
          type: 'reassign',
          itemId: taskId,
        };

        return {
          ...prev,
          items: updatedItems,
          notifications: [fulfillerNotif, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Housekeeping Supervisor',
              text:
                action === 'reassign'
                  ? `Task ${updatedTaskRef || taskId} reassigned to ${targetAssigneeName} by Meera Nambiar.`
                  : `Task ${updatedTaskRef || taskId} reassignment request declined by Meera Nambiar.`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Housekeeping Supervisor',
        action: action === 'reassign' ? 'Task Reassigned by Supervisor' : 'Reassignment Request Denied',
        category: 'Workflow',
        resource: updatedTaskRef || taskId,
        outcome: action === 'reassign' ? 'success' : 'warning',
        details:
          action === 'reassign'
            ? `Reassigned to ${targetAssigneeName}. Note: ${notes || 'Operational balance'}`
            : `Declined reassignment request. Note: ${notes || 'Attendant retained'}`,
      });

      notify(
        action === 'reassign'
          ? `Task reassigned to ${targetAssigneeName || 'attendant'}.`
          : 'Reassignment declined. Attendant retained on task.',
      );
    },
    [notify, recordAuditEvent],
  );

  const escalateSupervisorIssue = useCallback<DemoApi['escalateSupervisorIssue']>(
    (issue) => {
      const timestamp = nowLabel();
      const escId = `INC-${Date.now().toString().slice(-4)}`;
      const escRef = `ESC-${issue.room || 'HK'}-${Date.now().toString().slice(-3)}`;

      const newIncident: IncidentRecord = {
        id: escId,
        ref: escRef,
        title: issue.title,
        severity: issue.priority === 'critical' ? 'critical' : 'major',
        affectedArea: issue.room ? `Room ${issue.room}` : 'Housekeeping Dept',
        department: issue.department || 'Housekeeping',
        coordinator: 'Duty Manager Marcus Vance',
        reportedAt: timestamp,
        status: 'investigating',
        timeline: [
          { at: timestamp, text: `Escalated by Supervisor Meera Nambiar: ${issue.reason}` },
          ...(issue.notes ? [{ at: timestamp, text: `Supervisor Notes: ${issue.notes}` }] : []),
        ],
      };

      const newNotification: InAppNotification = {
        id: `notif-${uid()}`,
        roleId: 'department_manager',
        department: issue.department || 'Housekeeping',
        itemId: escId,
        message: issue.reason,
        title: `Supervisor Escalation: ${issue.title}`,
        summary: `${issue.room ? 'Room ' + issue.room + ' · ' : ''}${issue.reason}`,
        timestamp,
        read: false,
        tone: 'urgent',
        targetRole: 'duty_manager',
        category: 'Incident',
      };

      setState((prev) => ({
        ...prev,
        incidents: [newIncident, ...(prev.incidents ?? seedIncidents)],
        items: { ...prev.items, department_manager: [{ id: escId, ref: escRef, title: issue.title, room: issue.room, department: issue.department || 'Housekeeping', status: 'Escalated', priority: issue.priority, meta: 'Department supervisor · ' + issue.reason, description: issue.notes || issue.reason, createdAt: new Date().toISOString() }, ...(prev.items.department_manager ?? [])] },
        notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Housekeeping Supervisor',
            text: `Meera Nambiar escalated ${issue.title} to Duty Manager Marcus Vance.`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Housekeeping Supervisor',
        action: 'Issue Escalated to Duty Manager',
        category: 'Security',
        resource: escRef,
        outcome: 'warning',
        details: `Priority: ${issue.priority}. Reason: ${issue.reason}. Room: ${issue.room || 'N/A'}. Details: ${issue.notes || 'None'}`,
      });

      notify(`Issue escalated to Duty Manager Marcus Vance (${escRef})`);
    },
    [notify, recordAuditEvent],
  );

  const createDispatcherTask = useCallback<DemoApi['createDispatcherTask']>(
    (input) => {
      const timestamp = nowLabel();
      const id = `task-${Date.now().toString().slice(-5)}`;
      const refPrefix = input.department.toLowerCase().includes('house')
        ? 'HK'
        : input.department.toLowerCase().includes('maint')
          ? 'MNT'
          : 'ORD';
      const ref = `${refPrefix}-${input.room || 'FL'}-${Date.now().toString().slice(-3)}`;
      const floor = input.floor || (input.room ? parseInt(input.room[0], 10) || 1 : 1);
      const isAssigned = !!(input.assigneeId && input.assigneeName);

      const historyEntry: GuestHistoryEntry = {
        at: timestamp,
        status: isAssigned ? 'Assigned' : 'Unassigned',
        note: isAssigned
          ? `Created manually and assigned to ${input.assigneeName} by Supervisor Meera Nambiar`
          : 'Created manually by Supervisor Meera Nambiar (Open for claim)',
        actor: 'Meera Nambiar',
        role: 'Supervisor',
      };

      const newTask: WorkItem = {
        id,
        ref,
        title: input.title,
        room: input.room,
        floor,
        department: input.department,
        category: (input.category as WorkItem['category']) || 'maintenance',
        priority: (input.priority === 'low' ? 'normal' : input.priority === 'standard' ? 'normal' : input.priority) as WorkItem['priority'],

        slaDue: input.slaDue || '30 mins',
        status: isAssigned ? 'Assigned' : 'Unassigned',
        assignee: isAssigned ? input.assigneeName : undefined,
        assigneeId: isAssigned ? input.assigneeId : undefined,
        owner: isAssigned ? input.assigneeName : undefined,
        assignedAt: isAssigned ? timestamp : undefined,
        chip: isAssigned ? `Assigned: ${input.assigneeName!.split(' ')[0]}` : 'Open for claim',
        tone: input.priority === 'vip' ? 'warning' : input.priority === 'urgent' ? 'danger' : 'info',
        meta: `${input.room ? `Room ${input.room}` : `Floor ${floor}`} · ${input.department} · Created by Meera Nambiar`,
        description: input.description,
        createdAt: timestamp,
        history: [historyEntry],
        evidenceRequired: input.department.toLowerCase().includes('house') || input.department.toLowerCase().includes('maint'),
        location: input.room ? `Room ${input.room}, Level ${floor}` : `Floor ${floor}`,
      };

      setState((prev) => {
        let fulfillerItems = prev.items.task_fulfiller ?? [];
        if (isAssigned && (input.assigneeId === 'EMP-0103' || input.assigneeName === 'Vikram Singh')) {
          fulfillerItems = [newTask, ...fulfillerItems];
        }

        const fulfillerNotif: InAppNotification | null =
          isAssigned && (input.assigneeId === 'EMP-0103' || input.assigneeName === 'Vikram Singh')
            ? {
              id: uid(),
              roleId: 'task_fulfiller',
              title: 'New Task Assigned',
              message: `Supervisor assigned you ${newTask.title} (${newTask.room ? 'Room ' + newTask.room : 'Floor ' + floor})`,
              timestamp,
              read: false,
              type: 'task',
              itemId: newTask.id,
            }
            : null;

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher_supervisor: [newTask, ...(prev.items.department_dispatcher_supervisor ?? [])],
            department_dispatcher: [newTask, ...(prev.items.department_dispatcher ?? [])],
            task_fulfiller: fulfillerItems,
          },
          notifications: fulfillerNotif ? [fulfillerNotif, ...(prev.notifications ?? [])] : prev.notifications,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Supervisor',
              text: `Meera Nambiar created task: "${newTask.title}" (${newTask.room ? 'Room ' + newTask.room : 'General'}) · ${isAssigned ? 'Assigned to ' + input.assigneeName : 'Unassigned'}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Department Dispatcher / Supervisor',
        action: 'Task Created Manually',
        category: 'Workflow',
        resource: ref,
        outcome: 'success',
        details: `Created task "${input.title}". Department: ${input.department}. Room: ${input.room || 'General'}. Assignee: ${input.assigneeName || 'Unassigned'}`,
      });

      notify(`Task "${input.title}" created successfully.`);
    },
    [notify, recordAuditEvent],
  );

  const simulateGuestMessage = useCallback<DemoApi['simulateGuestMessage']>(
    (input) => {
      const timestamp = nowLabel();
      const msgId = `MSG-${Date.now().toString().slice(-4)}`;

      const messageRecord: GuestMessageRecord = {
        id: msgId,
        taskId: input.taskId,
        room: input.room,
        guestName: input.guestName || 'Valued Guest',
        templateType: input.templateType,
        messageText: input.messageText,
        sentAt: timestamp,
        sender: 'Meera Nambiar (Dispatcher / Supervisor)',
        channel: 'In-App Notification',
        status: 'Delivered (Simulated)',
      };

      const historyEntry: GuestHistoryEntry = {
        at: timestamp,
        status: 'Guest message simulated',
        note: `[Guest Alert Simulated] ${input.templateType}: "${input.messageText}"`,
        actor: 'Meera Nambiar',
        role: 'Supervisor',
      };

      setState((prev) => {
        const updateList = (list: WorkItem[] | undefined) =>
          (list ?? []).map((item) =>
            item.id === input.taskId || (item.room === input.room && item.status !== 'Completed')
              ? { ...item, history: [...(item.history ?? []), historyEntry] }
              : item,
          );

        const guestNotif: InAppNotification = {
          id: uid(),
          roleId: 'front_desk_coordinator',
          title: `Simulated Guest Alert: Room ${input.room}`,
          message: input.messageText,
          timestamp,
          read: false,
          type: 'alert',
          itemId: input.taskId,
        };

        return {
          ...prev,
          guestMessages: [messageRecord, ...(prev.guestMessages ?? [])],
          notifications: [guestNotif, ...(prev.notifications ?? [])],
          items: {
            ...prev.items,
            department_dispatcher_supervisor: updateList(prev.items.department_dispatcher_supervisor),
            department_dispatcher: updateList(prev.items.department_dispatcher),
            task_fulfiller: updateList(prev.items.task_fulfiller),
          },
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Guest Communication',
              text: `Simulated message sent to Room ${input.room}: "${input.templateType}"`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Department Dispatcher / Supervisor',
        action: 'Simulated Guest Message Sent',
        category: 'Workflow',
        resource: `Room ${input.room}`,
        outcome: 'success',
        details: `Template: ${input.templateType}. Message: ${input.messageText}`,
      });

      notify(`Simulated message sent to Room ${input.room}`);
    },
    [notify, recordAuditEvent],
  );

  const resolveFulfillerBlocker = useCallback<DemoApi['resolveFulfillerBlocker']>(
    (taskId, resolution, resumeStatus) => {
      const timestamp = nowLabel();
      const nextStatus = resumeStatus || 'In progress';
      let targetTitle = '';

      setState((prev) => {
        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: nextStatus,
          note: `Blocker cleared by Supervisor Meera Nambiar: ${resolution}`,
          actor: 'Meera Nambiar',
          role: 'Supervisor',
        };

        const updateList = (list: WorkItem[] | undefined) =>
          (list ?? []).map((item) => {
            if (item.id === taskId) {
              targetTitle = item.title;
              return {
                ...item,
                status: nextStatus,
                chip: 'Work resumed',
                tone: 'info' as const,
                blockerReason: undefined,
                history: [...(item.history ?? []), historyEntry],
              };
            }
            return item;
          });

        const fulfillerNotif: InAppNotification = {
          id: uid(),
          roleId: 'task_fulfiller',
          title: 'Blocker Cleared by Supervisor',
          message: `Supervisor Meera Nambiar cleared blocker on "${targetTitle || 'Task'}": ${resolution}. Please resume work.`,
          timestamp,
          read: false,
          type: 'task',
          itemId: taskId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher_supervisor: updateList(prev.items.department_dispatcher_supervisor),
            department_dispatcher: updateList(prev.items.department_dispatcher),
            task_fulfiller: updateList(prev.items.task_fulfiller),
          },
          notifications: [fulfillerNotif, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Supervisor',
              text: `Meera Nambiar resolved blocker on ${targetTitle || 'task'}: ${resolution}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Meera Nambiar',
        actorRole: 'Department Dispatcher / Supervisor',
        action: 'Blocker Resolved',
        category: 'Workflow',
        resource: taskId,
        outcome: 'success',
        details: `Resolution: ${resolution}. Status reset to ${nextStatus}`,
      });

      notify('Blocker resolved. Task resumed.');
    },
    [notify, recordAuditEvent],
  );

  const claimTask = useCallback<DemoApi['claimTask']>(
    (taskId, fulfillerId, fulfillerName) => {
      const currentAvail = stateRef.current.fulfillerAvailability ?? 'on_duty';
      if (currentAvail === 'break') {
        notify('Cannot self-assign tasks while on break. Switch to On Duty status to claim tasks.');
        return;
      }
      if (currentAvail === 'off_duty') {
        notify('Cannot self-assign tasks while off duty. Switch to On Duty status to claim tasks.');
        return;
      }

      const timestamp = nowLabel();
      let conflictError = false;

      setState((prev) => {
        const ddsItems = prev.items.department_dispatcher_supervisor ?? [];
        const ddItems = prev.items.department_dispatcher ?? [];
        const task = ddsItems.find((i) => i.id === taskId) || ddItems.find((i) => i.id === taskId);
        if (!task) return prev;

        // Conflicting claims validation: prevent conflicting claims using frontend state validation
        if (
          (task.status !== 'Unassigned' && task.status !== 'Received') ||
          (task.assignee && task.assignee !== fulfillerName)
        ) {
          conflictError = true;
          return prev;
        }

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Assigned',
          note: `Self-claimed from unassigned pool by ${fulfillerName} (${fulfillerId})`,
          actor: fulfillerName,
          role: 'Task Fulfiller',
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Assigned',
          assignee: fulfillerName,
          assigneeId: fulfillerId,
          owner: fulfillerName,
          assignedAt: timestamp,
          chip: `Claimed: ${fulfillerName.split(' ')[0]}`,
          tone: 'info',
          autoAssigned: false,
          assignmentFailureReason: undefined,
          history: [...(task.history ?? []), historyEntry],
        };

        const fulfillerTask: WorkItem = {
          ...updatedTask,
          location: updatedTask.location || (task.room ? `Room ${task.room}, Level ${task.floor || task.room[0]}` : undefined),
          evidenceRequired: task.category === 'maintenance' || task.category === 'housekeeping',
        };

        let nextFulfillerItems = prev.items.task_fulfiller ?? [];
        const existingIdx = nextFulfillerItems.findIndex((f) => f.id === task.id || (task.ref && f.ref === task.ref));
        if (existingIdx >= 0) {
          nextFulfillerItems = nextFulfillerItems.map((f, i) => (i === existingIdx ? fulfillerTask : f));
        } else {
          nextFulfillerItems = [fulfillerTask, ...nextFulfillerItems];
        }

        const notif: InAppNotification = {
          id: uid(),
          roleId: 'department_dispatcher_supervisor',
          department: task.department,
          title: 'Task Self-Claimed',
          message: `${fulfillerName} self-claimed ${task.title} (Room ${task.room || 'General'})`,
          timestamp,
          read: false,
          type: 'task',
          itemId: task.id,
        };

        const fulfillerNotif: InAppNotification = {
          id: uid(),
          roleId: 'task_fulfiller',
          department: task.department,
          title: 'Task Claimed',
          message: `You claimed "${task.title}" (Room ${task.room || 'General'}) into your active queue.`,
          timestamp,
          read: false,
          type: 'task',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher_supervisor: (prev.items.department_dispatcher_supervisor ?? []).map((i) =>
              i.id === taskId ? updatedTask : i,
            ),
            department_dispatcher: (prev.items.department_dispatcher ?? []).map((i) =>
              i.id === taskId ? updatedTask : i,
            ),
            task_fulfiller: nextFulfillerItems,
          },
          notifications: [fulfillerNotif, notif, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Fulfiller',
              text: `${fulfillerName} claimed ${task.ref || task.title} from open queue`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      if (conflictError) {
        notify('Cannot claim: Task has already been claimed or assigned by another staff member.');
        return;
      }

      recordAuditEvent({
        actor: fulfillerName,
        actorRole: 'Task Fulfiller',
        action: 'Task self-claimed by fulfiller',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `Claimed by ${fulfillerName} (${fulfillerId})`,
      });

      notify(`Task claimed: Assigned to ${fulfillerName}`);
    },
    [notify, recordAuditEvent],
  );

  const updateGuestPreferences = useCallback<DemoApi['updateGuestPreferences']>(
    (room, preferences) => {
      setState((prev) => {
        const currentPrefs = prev.guestPreferences?.[room] ?? {
          allergies: [],
          dietaryRestrictions: [],
          dnd: false,
          personalInstructions: '',
          specialRequests: [],
        };
        const updatedPrefs: GuestPreferences = {
          ...currentPrefs,
          ...preferences,
        };

        const updatedStays = (prev.frontDesk.stays ?? []).map((s) =>
          s.room === room ? { ...s, preferences: updatedPrefs } : s,
        );

        return {
          ...prev,
          guestPreferences: {
            ...(prev.guestPreferences ?? {}),
            [room]: updatedPrefs,
          },
          frontDesk: {
            ...prev.frontDesk,
            stays: updatedStays,
          },
          feed: [
            {
              id: uid(),
              at: nowLabel(),
              role: 'Guest Portal',
              text: `Guest preferences updated for Room ${room}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify(`Preferences updated for Room ${room}`);
    },
    [notify],
  );

  const createHotelService = useCallback<DemoApi['createHotelService']>(
    (service) => {
      const id = `srv-${Date.now().toString().slice(-4)}`;
      const newService: HotelServiceItem = {
        ...service,
        id,
      };

      setState((prev) => ({
        ...prev,
        hotelServices: [newService, ...(prev.hotelServices ?? [])],
        feed: [
          {
            id: uid(),
            at: nowLabel(),
            role: 'Department Manager',
            text: `New service added: "${newService.name}" (${newService.department} · ₹${newService.price})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Marcus Vance',
        actorRole: 'Department Manager',
        action: 'Service catalog item created',
        category: 'Workflow',
        resource: `Service ${newService.name}`,
        outcome: 'success',
        details: `Dept: ${newService.department}, Price: ₹${newService.price}, Guest-facing: ${newService.availableForGuest ? 'Yes' : 'No'}`,
      });

      notify(`Service created: "${newService.name}" mapped to ${newService.department}`);
    },
    [notify, recordAuditEvent],
  );

  const initiateInspectionDirective = useCallback<DemoApi['initiateInspectionDirective']>(
    (input) => {
      const timestamp = nowLabel();
      const id = `insp-${Date.now().toString().slice(-4)}`;
      const inspectionRef = `INSP-${input.roomNumber}-${Date.now().toString().slice(-3)}`;

      const newInspection: SupervisorInspection = {
        id,
        department: input.department || 'Housekeeping',
        roomNumber: input.roomNumber,
        floor: input.floor || parseInt(input.roomNumber[0], 10) || 1,
        roomType: input.roomType || 'Deluxe Room',
        attendantId: 'EMP-0103',
        attendantName: 'Vikram Singh',
        type: input.type,
        status: 'pending',
        priority: input.priority || 'normal',
        score: 0,
        completedChecklistCount: 0,
        totalChecklistCount: 15,
        scheduledTime: timestamp,
        createdAt: timestamp,
        completedAt: '',
        instructions: input.instructions,
        initiatedBy: input.initiatedBy,
        initiatedRole: input.initiatedRole,
        assignedSupervisorId: input.department ? undefined : 'EMP-0105',
        assignedSupervisorName: input.department ? undefined : 'Meera Nambiar',
        items: input.department ? [{ id: 'department-standard', category: 'Safety & Keycard', label: input.instructions, passed: false }] : [
          { id: 'chk-1', category: 'bedding', label: 'Linens crisp, taut, and stain-free', passed: true },
          { id: 'chk-2', category: 'bathroom', label: 'Shower glass & chrome polished', passed: false },
          { id: 'chk-3', category: 'amenities', label: 'Bathroom toiletries replenished to standard', passed: false },
          { id: 'chk-4', category: 'electronics', label: 'Smart TV & remote operational', passed: true },
          { id: 'chk-5', category: 'cleanliness', label: 'Dust-free surfaces, baseboards & vents', passed: false },
        ],
      };

      const supervisorNotif: InAppNotification = {
        id: uid(),
        department: input.department || 'Housekeeping',
        roleId: input.initiatedRole === 'general_manager' ? 'department_manager' : 'department_dispatcher_supervisor',
        title: `Inspection Directive: Room ${input.roomNumber}`,
        message: `${input.initiatedBy} requested ${input.type} inspection. Instructions: ${input.instructions}`,
        timestamp,
        read: false,
        type: 'alert',
        itemId: id,
      };

      setState((prev) => ({
        ...prev,
        inspections: [newInspection, ...(prev.inspections ?? [])],
        notifications: [supervisorNotif, ...(prev.notifications ?? [])],
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: input.initiatedRole === 'general_manager' ? 'General Manager' : 'Department Manager',
            text: `${input.initiatedBy} issued inspection directive for Room ${input.roomNumber} (${input.type})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: input.initiatedBy,
        actorRole: input.initiatedRole === 'general_manager' ? 'General Manager' : 'Department Manager',
        action: 'Quality Inspection Directive Initiated',
        category: 'Workflow',
        resource: inspectionRef,
        outcome: 'success',
        details: `Room: ${input.roomNumber}, Type: ${input.type}, Instructions: ${input.instructions}`,
      });

      notify(`Inspection directive issued for Room ${input.roomNumber} to Supervisor`);
    },
    [notify, recordAuditEvent],
  );

  /* ---- Phase 3: Compensation & Multi-Tier Escalation APIs ---- */

  const createCompensationRequest = useCallback<DemoApi['createCompensationRequest']>(
    (input) => {
      const timestamp = nowLabel();
      const id = `comp-${Date.now().toString().slice(-5)}`;
      const deptCode = (input.department || 'OPS').slice(0, 2).toUpperCase();
      const ref = `COMP-${deptCode}-${input.room || 'GEN'}-${Date.now().toString().slice(-3)}`;
      const tier = input.amount > MANAGER_COMPENSATION_THRESHOLD ? 'high_value' : 'standard';

      const newRequest: CompensationRequest = {
        ...input,
        id,
        ref,
        status: 'pending_dept_manager',
        tier,
        requestedAt: timestamp,
        history: [
          {
            at: timestamp,
            role: 'Department Manager',
            actor: input.requestedBy || 'Marcus Vance',
            action: 'Compensation Request Initiated',
            note: `Initiated ₹${input.amount.toLocaleString('en-IN')} claim for Room ${input.room}: ${input.reason}`,
          },
        ],
      };

      setState((prev) => ({
        ...prev,
        compensationRequests: [newRequest, ...(prev.compensationRequests ?? seedCompensationRequests)],
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Duty Manager',
            text: `Compensation claim logged for Room ${input.room}: ₹${input.amount.toLocaleString('en-IN')} (${input.reason})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      notify(`Compensation request ${ref} created (₹${input.amount.toLocaleString('en-IN')})`);
    },
    [notify],
  );

  const reviewDeptManagerCompensation = useCallback<DemoApi['reviewDeptManagerCompensation']>(
    (requestId, action, comments) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const requests = prev.compensationRequests ?? seedCompensationRequests;
        const target = requests.find((r) => r.id === requestId);
        if (!target) return prev;

        let nextStatus: CompensationStatus = target.status;
        let actionLabel = '';

        if (action === 'approve') {
          nextStatus = 'pending_financial_operator';
          actionLabel = 'Approved by Dept Manager → Forwarded to Financial Operator';
        } else if (action === 'escalate_gm') {
          nextStatus = 'pending_gm';
          actionLabel = 'Escalated to General Manager (Exceeds ₹10,000 threshold)';
        } else {
          nextStatus = 'rejected';
          actionLabel = 'Rejected by Department Manager';
        }

        const historyEntry = {
          at: timestamp,
          role: 'Department Manager',
          actor: 'Marcus Vance',
          action: actionLabel,
          note: comments,
        };

        const updatedRequest: CompensationRequest = {
          ...target,
          status: nextStatus,
          deptManagerDecision: {
            action: action === 'approve' ? 'approved' : action === 'escalate_gm' ? 'escalated_to_gm' : 'rejected',
            decidedBy: 'Marcus Vance (Department Manager)',
            decidedAt: timestamp,
            comments,
          },
          history: [...(target.history ?? []), historyEntry],
        };

        const notifs = [...(prev.notifications ?? [])];
        if (nextStatus === 'pending_financial_operator') {
          notifs.unshift({
            id: uid(),
            roleId: 'financial_operator',
            title: 'Compensation Review Required',
            message: `Marcus Vance approved ₹${target.amount.toLocaleString('en-IN')} credit for Room ${target.room} (${target.reason})`,
            timestamp,
            read: false,
            type: 'alert',
            itemId: target.id,
          });
        } else if (nextStatus === 'pending_gm') {
          notifs.unshift({
            id: uid(),
            roleId: 'general_manager',
            title: 'High-Value Compensation Escalation',
            message: `Marcus Vance escalated ₹${target.amount.toLocaleString('en-IN')} claim for Room ${target.room} to Executive Office`,
            timestamp,
            read: false,
            type: 'alert',
            itemId: target.id,
          });
        }

        return {
          ...prev,
          compensationRequests: requests.map((r) => (r.id === requestId ? updatedRequest : r)),
          notifications: notifs.slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Department Manager',
              text: `Marcus Vance ${action === 'approve' ? 'approved & forwarded to Finance' : action === 'escalate_gm' ? 'escalated to GM' : 'rejected'} ₹${target.amount.toLocaleString('en-IN')} claim for Room ${target.room}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify(
        action === 'approve'
          ? 'Standard compensation approved and forwarded to Financial Operator'
          : action === 'escalate_gm'
            ? 'High-value claim escalated to General Manager'
            : 'Compensation claim rejected',
      );
    },
    [notify],
  );

  const reviewGmCompensation = useCallback<DemoApi['reviewGmCompensation']>(
    (requestId, action, comments) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const requests = prev.compensationRequests ?? seedCompensationRequests;
        const target = requests.find((r) => r.id === requestId);
        if (!target) return prev;

        const nextStatus: CompensationStatus = action === 'forward_to_finance' ? 'pending_financial_operator' : 'rejected';
        const actionLabel = action === 'forward_to_finance' ? 'GM Concurrence Granted → Sent to Finance' : 'Rejected by General Manager';

        const historyEntry = {
          at: timestamp,
          role: 'General Manager',
          actor: 'Priya Nair',
          action: actionLabel,
          note: comments,
        };

        const updatedRequest: CompensationRequest = {
          ...target,
          status: nextStatus,
          gmDecision: {
            action: action === 'forward_to_finance' ? 'forwarded_to_finance' : 'rejected',
            decidedBy: 'Priya Nair (General Manager)',
            decidedAt: timestamp,
            comments,
          },
          history: [...(target.history ?? []), historyEntry],
        };

        const notifs = [...(prev.notifications ?? [])];
        if (nextStatus === 'pending_financial_operator') {
          notifs.unshift({
            id: uid(),
            roleId: 'financial_operator',
            title: 'High-Value Compensation Forwarded',
            message: `GM Priya Nair approved and forwarded ₹${target.amount.toLocaleString('en-IN')} claim for Room ${target.room} to Finance`,
            timestamp,
            read: false,
            type: 'alert',
            itemId: target.id,
          });
        }

        return {
          ...prev,
          compensationRequests: requests.map((r) => (r.id === requestId ? updatedRequest : r)),
          notifications: notifs.slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'General Manager',
              text: `Priya Nair ${action === 'forward_to_finance' ? 'approved & forwarded to Finance' : 'rejected'} ₹${target.amount.toLocaleString('en-IN')} claim for Room ${target.room}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify(action === 'forward_to_finance' ? 'High-value request forwarded to Financial Operator' : 'Request rejected by General Manager');
    },
    [notify],
  );

  const reviewFinancialCompensation = useCallback<DemoApi['reviewFinancialCompensation']>(
    (requestId, action, comments) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const requests = prev.compensationRequests ?? seedCompensationRequests;
        const target = requests.find((r) => r.id === requestId);
        if (!target) return prev;

        const isApproved = action === 'approve';
        const nextStatus: CompensationStatus = isApproved ? 'approved' : 'rejected';
        const actionLabel = isApproved ? 'Financial Approval Granted & Folio Credited' : 'Financial Approval Rejected';
        const folioLineId = isApproved ? `fo-comp-${uid()}` : undefined;

        const historyEntry = {
          at: timestamp,
          role: 'Financial Operator',
          actor: 'Neha Kapoor',
          action: actionLabel,
          note: comments,
        };

        const updatedRequest: CompensationRequest = {
          ...target,
          status: nextStatus,
          completedAt: isApproved ? timestamp : undefined,
          folioLineId,
          financeDecision: {
            action: isApproved ? 'approved' : 'rejected',
            decidedBy: 'Neha Kapoor (Financial Operator)',
            decidedAt: timestamp,
            comments,
          },
          history: [...(target.history ?? []), historyEntry],
        };

        // ONLY when approved, post credit entry to guest folio!
        let updatedFolios = prev.folios;
        if (isApproved && target.room) {
          const creditLine = {
            id: folioLineId!,
            label: `Service Recovery Credit · Ref: ${target.ref} · ${target.reason}`,
            amount: -target.amount,
            date: timestamp,
            room: target.room,
          };
          updatedFolios = {
            ...prev.folios,
            [target.room]: [...(prev.folios[target.room] ?? []), creditLine],
          };
        }

        const notifs = [
          {
            id: uid(),
            roleId: 'department_manager' as RoleId,
            title: isApproved ? 'Compensation Approved by Finance' : 'Compensation Declined by Finance',
            message: `Neha Kapoor ${isApproved ? 'approved' : 'rejected'} ₹${target.amount.toLocaleString('en-IN')} credit for Room ${target.room}`,
            timestamp,
            read: false,
            type: 'alert' as const,
            itemId: target.id,
          },
          {
            id: uid(),
            roleId: 'front_desk_coordinator' as RoleId,
            title: isApproved ? 'Folio Credit Applied' : 'Compensation Declined',
            message: isApproved
              ? `₹${target.amount.toLocaleString('en-IN')} recovery credit posted to Room ${target.room} folio`
              : `Compensation claim for Room ${target.room} declined by Finance`,
            timestamp,
            read: false,
            type: 'alert' as const,
            itemId: target.id,
          },
          ...(prev.notifications ?? []),
        ];

        return {
          ...prev,
          compensationRequests: requests.map((r) => (r.id === requestId ? updatedRequest : r)),
          folios: updatedFolios,
          notifications: notifs.slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Financial Operator',
              text: `Neha Kapoor ${isApproved ? `approved and applied ₹${target.amount.toLocaleString('en-IN')} credit to Room ${target.room} folio` : `rejected compensation for Room ${target.room}`}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify(
        action === 'approve'
          ? 'Financial approval granted: credit posted to guest folio & checkout updated'
          : 'Financial compensation rejected (folio was not modified)',
      );
    },
    [notify],
  );

  const acceptSupervisorEscalatedTask = useCallback<DemoApi['acceptSupervisorEscalatedTask']>(
    (taskId, managerNotes, actionType) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const updateItem = (item: WorkItem): WorkItem => {
          if (item.id !== taskId && (!item.ref || item.ref !== taskId)) return item;
          const newStatus = actionType === 'resolve' ? 'Resolved' : actionType === 'reject' ? 'In progress' : 'Escalated';
          const newChip = actionType === 'resolve' ? 'Resolved by Manager' : actionType === 'reject' ? 'Returned to Supervisor' : 'Escalated to GM';
          const newTone = actionType === 'resolve' ? ('success' as const) : actionType === 'reject' ? ('info' as const) : ('danger' as const);

          return {
            ...item,
            status: newStatus,
            chip: newChip,
            tone: newTone,
            history: [
              ...(item.history ?? []),
              {
                at: timestamp,
                status: newStatus,
                actor: 'Marcus Vance',
                role: 'Department Manager',
                note: `Manager ${actionType === 'resolve' ? 'Resolution' : actionType === 'reject' ? 'Directive' : 'Escalation to GM'}: ${managerNotes}`,
              },
            ],
          };
        };

        const notifToSupervisor: InAppNotification = {
          id: uid(),
          roleId: 'department_dispatcher_supervisor',
          title: actionType === 'resolve' ? 'Supervisor Escalation Resolved' : actionType === 'reject' ? 'Escalation Returned with Instructions' : 'Escalated to General Manager',
          message: `Duty Manager Marcus Vance: ${managerNotes}`,
          timestamp,
          read: false,
          type: 'alert',
          itemId: taskId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_manager: (prev.items.department_manager ?? []).map(updateItem),
            department_dispatcher_supervisor: (prev.items.department_dispatcher_supervisor ?? []).map(updateItem),
            department_dispatcher: (prev.items.department_dispatcher ?? []).map(updateItem),
            task_fulfiller: (prev.items.task_fulfiller ?? []).map(updateItem),
          },
          notifications: [notifToSupervisor, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Department Manager',
              text: `Marcus Vance acted on escalated task: ${managerNotes}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify(`Escalated task updated: ${actionType === 'resolve' ? 'Resolved' : actionType === 'reject' ? 'Returned to Supervisor' : 'Escalated to GM'}`);
    },
    [notify],
  );

  const updateStaffShiftSchedule = useCallback<DemoApi['updateStaffShiftSchedule']>(
    (scheduleId, shiftTypeOrUpdates, floorZoneArg, statusArg, notesArg) => {
      setState((prev) => {
        const schedules = prev.shiftSchedules ?? seedShiftSchedules;
        const target = schedules.find((s) => s.id === scheduleId);
        if (!target) return prev;

        let shiftType = target.shiftType;
        let floorZone = target.floorZone;
        let status = target.status;
        let notes = target.notes;
        let conflictReason = target.conflictReason;

        if (typeof shiftTypeOrUpdates === 'object' && shiftTypeOrUpdates !== null) {
          const up = shiftTypeOrUpdates as Partial<ShiftScheduleRecord>;
          if (up.shiftType) shiftType = up.shiftType;
          if (up.floorZone !== undefined) floorZone = up.floorZone;
          if (up.status !== undefined) status = up.status;
          if (up.notes !== undefined) notes = up.notes;
          if ('conflictReason' in up) conflictReason = up.conflictReason;
        } else if (typeof shiftTypeOrUpdates === 'string') {
          shiftType = shiftTypeOrUpdates;
          if (floorZoneArg !== undefined) floorZone = floorZoneArg;
          if (statusArg !== undefined) status = statusArg;
          if (notesArg !== undefined) notes = notesArg;
        }

        const startTime = shiftType === 'Morning' ? '07:00' : shiftType === 'Evening' ? '15:00' : '23:00';
        const endTime = shiftType === 'Morning' ? '15:30' : shiftType === 'Evening' ? '23:30' : '07:30';
        const shiftHours = `${startTime} – ${endTime}`;

        const updated: ShiftScheduleRecord = {
          ...target,
          shiftType,
          startTime,
          endTime,
          shiftHours,
          floorZone,
          status: status ?? target.status,
          conflictReason,
          notes: notes ?? target.notes,
        };

        const updatedStaff = (prev.staffAccounts ?? []).map((s) =>
          s.employeeId === target.employeeId
            ? {
              ...s,
              shift: shiftType === 'Morning' ? ('Day' as const) : shiftType === 'Evening' ? ('Evening' as const) : ('Night' as const),
              floorZone,
            }
            : s,
        );

        return {
          ...prev,
          shiftSchedules: schedules.map((s) => (s.id === scheduleId ? updated : s)),
          staffAccounts: updatedStaff,
        };
      });

      notify('Shift schedule updated and synchronized with department roster');
    },
    [notify],
  );

  const createStaffShiftSchedule = useCallback<DemoApi['createStaffShiftSchedule']>(
    (schedule) => {
      const id = `shift-${Date.now().toString().slice(-4)}`;
      setState((prev) => {
        const schedules = prev.shiftSchedules ?? seedShiftSchedules;
        return {
          ...prev,
          shiftSchedules: [{ ...schedule, id }, ...schedules],
        };
      });
      notify(`Shift scheduled for ${schedule.employeeName} (${schedule.shiftType} shift)`);
    },
    [notify],
  );

  const saveDepartmentServicePolicy = useCallback<DemoApi['saveDepartmentServicePolicy']>(
    (policy) => {
      setState((prev) => {
        const existing = prev.departmentPolicies ?? seedDepartmentPolicies;
        const idx = existing.findIndex((p) => p.id === policy.id);
        let nextPolicies = [...existing];
        if (idx >= 0) {
          nextPolicies[idx] = policy;
        } else {
          nextPolicies = [policy, ...nextPolicies];
        }
        return {
          ...prev,
          departmentPolicies: nextPolicies,
        };
      });
      notify(`Service Policy "${policy.title}" saved and published to department view`);
    },
    [notify],
  );

  const createGuestReminder = useCallback<DemoApi['createGuestReminder']>(
    (input) => {
      const id = `rem-${Date.now().toString().slice(-4)}`;
      const createdAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newReminder: GuestReminder = { ...input, id, createdAt };
      setState((prev) => ({
        ...prev,
        guestReminders: [newReminder, ...(prev.guestReminders ?? seedGuestReminders)],
        feed: [
          {
            id: uid(),
            at: nowLabel(),
            role: 'Front Desk',
            text: `Guest reminder logged for ${input.guestName} (Room ${input.room})`,
          },
          ...prev.feed,
        ],
      }));
      notify(`Reminder saved for ${input.guestName} (${input.dueDateTime})`);
    },
    [notify],
  );

  const updateGuestReminderStatus = useCallback<DemoApi['updateGuestReminderStatus']>(
    (id, status) => {
      setState((prev) => ({
        ...prev,
        guestReminders: (prev.guestReminders ?? seedGuestReminders).map((r) =>
          r.id === id ? { ...r, status } : r,
        ),
      }));
      notify(`Reminder status updated to ${status}`);
    },
    [notify],
  );

  const deleteGuestReminder = useCallback<DemoApi['deleteGuestReminder']>(
    (id) => {
      setState((prev) => ({
        ...prev,
        guestReminders: (prev.guestReminders ?? seedGuestReminders).filter((r) => r.id !== id),
      }));
      notify('Guest reminder deleted');
    },
    [notify],
  );

  const submitSecuritySafetyAlert = useCallback<DemoApi['submitSecuritySafetyAlert']>(
    (input) => {
      const alertId = `alert-${Date.now().toString().slice(-4)}`;
      const ref = `SFT-${String(Math.floor(100 + Math.random() * 900))}`;
      const now = nowLabel();
      const newAlert: SafetyAlertRecord = {
        ...input,
        id: alertId,
        ref,
        status: 'draft_pending_validation',
        reportedBy: 'Inspector Roy (EMP-0108)',
        reportedAt: `Today, ${now}`,
        auditHistory: [
          {
            at: now,
            actor: 'Inspector Roy',
            role: 'security_responder',
            action: 'Drafted safety broadcast alert and submitted for Front Desk validation',
          },
        ],
        acknowledgedBy: ['security_responder'],
      };

      const newNotif: InAppNotification = {
        id: uid(),
        roleId: 'front_desk_coordinator',
        title: `🚨 Urgent: New Safety Alert ${ref} Requires Front Desk Validation`,
        message: `${input.title} (${input.location}). Review operational impact and escalate to Manager for broadcast.`,
        timestamp: now,
        read: false,
        priority: 'urgent',
        link: '/staff/front-desk',
      };

      setState((prev) => ({
        ...prev,
        safetyAlerts: [newAlert, ...(prev.safetyAlerts ?? seedSafetyAlerts)],
        notifications: [newNotif, ...(prev.notifications ?? [])],
        feed: [
          {
            id: uid(),
            at: now,
            role: 'Security',
            text: `Draft safety alert ${ref} submitted to Front Desk for validation: ${input.title}`,
          },
          ...prev.feed,
        ],
      }));

      notify(`Safety Alert ${ref} submitted for Front Desk validation`);
    },
    [notify],
  );

  const validateSafetyAlertByFrontDesk = useCallback<DemoApi['validateSafetyAlertByFrontDesk']>(
    (alertId, notes) => {
      const now = nowLabel();
      let alertRef = '';
      setState((prev) => {
        const list = prev.safetyAlerts ?? seedSafetyAlerts;
        const target = list.find((a) => a.id === alertId);
        if (!target) return prev;
        alertRef = target.ref;

        const updated: SafetyAlertRecord = {
          ...target,
          status: 'validated_pending_approval',
          validatedBy: 'Maya Lin (Front Desk Lead)',
          validatedAt: `Today, ${now}`,
          auditHistory: [
            ...target.auditHistory,
            {
              at: now,
              actor: 'Maya Lin',
              role: 'front_desk_coordinator',
              action: 'Validated operational impact and forwarded to Manager for broadcast authorization',
              notes,
            },
          ],
        };

        const gmNotif: InAppNotification = {
          id: uid(),
          roleId: 'general_manager',
          title: `Broadcast Sign-Off Required: Safety Alert ${target.ref}`,
          message: `${target.title} validated by Front Desk. Executive broadcast approval required before property-wide activation.`,
          timestamp: now,
          read: false,
          priority: 'urgent',
          link: '/staff/general-manager',
        };

        const dmNotif: InAppNotification = {
          id: uid(),
          roleId: 'department_manager',
          title: `Broadcast Sign-Off Required: Safety Alert ${target.ref}`,
          message: `${target.title} validated by Front Desk. Manager review requested.`,
          timestamp: now,
          read: false,
          priority: 'urgent',
          link: '/staff/department-manager',
        };

        return {
          ...prev,
          safetyAlerts: list.map((a) => (a.id === alertId ? updated : a)),
          notifications: [gmNotif, dmNotif, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: now,
              role: 'Front Desk',
              text: `Front Desk validated safety alert ${target.ref}; escalated to General Manager for broadcast approval`,
            },
            ...prev.feed,
          ],
        };
      });

      notify(`Safety Alert ${alertRef} validated and escalated to General Manager for broadcast sign-off`);
    },
    [notify],
  );

  const approveSafetyAlertByManager = useCallback<DemoApi['approveSafetyAlertByManager']>(
    (alertId, approved, notes) => {
      const now = nowLabel();
      let alertRef = '';
      setState((prev) => {
        const list = prev.safetyAlerts ?? seedSafetyAlerts;
        const target = list.find((a) => a.id === alertId);
        if (!target) return prev;
        alertRef = target.ref;

        const nextStatus: SafetyAlertStatus = approved ? 'approved_ready_broadcast' : 'rejected';
        const updated: SafetyAlertRecord = {
          ...target,
          status: nextStatus,
          approvedBy: approved ? 'Priya Nair (General Manager)' : undefined,
          approvedAt: approved ? `Today, ${now}` : undefined,
          auditHistory: [
            ...target.auditHistory,
            {
              at: now,
              actor: 'Priya Nair',
              role: 'general_manager',
              action: approved
                ? 'Approved safety alert broadcast across hotel property'
                : 'Rejected broadcast of safety alert; returned for standard local handling',
              notes,
            },
          ],
        };

        const fdNotif: InAppNotification = {
          id: uid(),
          roleId: 'front_desk_coordinator',
          title: approved ? `✅ Safety Alert ${target.ref} APPROVED for Broadcast` : `❌ Safety Alert ${target.ref} REJECTED by Manager`,
          message: approved
            ? `General Manager approved broadcast of "${target.title}". Execute property broadcast now.`
            : `General Manager rejected broadcast: ${notes ?? 'Handle as local department issue'}.`,
          timestamp: now,
          read: false,
          priority: approved ? 'urgent' : 'warning',
          link: '/staff/front-desk',
        };

        const secNotif: InAppNotification = {
          id: uid(),
          roleId: 'security_responder',
          title: approved ? `Broadcast Approved: ${target.ref}` : `Broadcast Declined: ${target.ref}`,
          message: approved
            ? `General Manager approved broadcast of "${target.title}".`
            : `General Manager declined broadcast: ${notes ?? 'Standard resolution'}.`,
          timestamp: now,
          read: false,
          priority: approved ? 'urgent' : 'warning',
          link: '/staff/security',
        };

        return {
          ...prev,
          safetyAlerts: list.map((a) => (a.id === alertId ? updated : a)),
          notifications: [fdNotif, secNotif, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: now,
              role: 'General Manager',
              text: approved
                ? `General Manager APPROVED safety broadcast for ${target.ref}: ${target.title}`
                : `General Manager REJECTED safety broadcast for ${target.ref}`,
            },
            ...prev.feed,
          ],
        };
      });

      notify(
        approved
          ? `Safety Alert ${alertRef} APPROVED for broadcast by General Manager`
          : `Safety Alert ${alertRef} rejected by Manager`,
      );
    },
    [notify],
  );

  const broadcastSafetyAlert = useCallback<DemoApi['broadcastSafetyAlert']>(
    (alertId) => {
      const now = nowLabel();
      let alertRef = '';
      setState((prev) => {
        const list = prev.safetyAlerts ?? seedSafetyAlerts;
        const target = list.find((a) => a.id === alertId);
        if (!target) return prev;
        alertRef = target.ref;

        const updated: SafetyAlertRecord = {
          ...target,
          status: 'broadcast_active',
          broadcastAt: `Today, ${now}`,
          auditHistory: [
            ...target.auditHistory,
            {
              at: now,
              actor: 'Front Desk Broadcast Engine',
              role: 'front_desk_coordinator',
              action: 'Active broadcast dispatched across all staff consoles and property displays',
            },
          ],
        };

        const allRoles: RoleId[] = [
          'task_fulfiller',
          'department_dispatcher_supervisor',
          'department_manager',
          'front_desk_coordinator',
          'financial_operator',
          'security_responder',
          'general_manager',
        ];

        const broadcastNotifs: InAppNotification[] = allRoles.map((rId) => ({
          id: uid(),
          roleId: rId,
          title: `🚨 SAFETY ALERT BROADCAST: ${target.title}`,
          message: `${target.description} (Location: ${target.location}). Exercise operational precautions.`,
          timestamp: now,
          read: false,
          priority: 'critical',
          link: rId === 'security_responder' ? '/staff/security' : rId === 'general_manager' ? '/staff/general-manager' : '/staff/front-desk',
        }));

        return {
          ...prev,
          safetyAlerts: list.map((a) => (a.id === alertId ? updated : a)),
          notifications: [...broadcastNotifs, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: now,
              role: 'Front Desk',
              text: `BROADCAST ACTIVE: Safety Alert ${target.ref} activated hotel-wide!`,
            },
            ...prev.feed,
          ],
        };
      });

      notify(`🚨 Hotel-wide Safety Alert ${alertRef} is now BROADCAST ACTIVE!`);
    },
    [notify],
  );

  const resolveSafetyAlert = useCallback<DemoApi['resolveSafetyAlert']>(
    (alertId, notes) => {
      const now = nowLabel();
      setState((prev) => {
        const list = prev.safetyAlerts ?? seedSafetyAlerts;
        return {
          ...prev,
          safetyAlerts: list.map((a) =>
            a.id === alertId
              ? {
                ...a,
                status: 'resolved' as const,
                resolvedAt: `Today, ${now}`,
                auditHistory: [
                  ...a.auditHistory,
                  {
                    at: now,
                    actor: 'Security & Operations Command',
                    role: 'security_responder',
                    action: 'Safety alert resolved and stand-down order broadcasted',
                    notes,
                  },
                ],
              }
              : a,
          ),
          feed: [
            {
              id: uid(),
              at: now,
              role: 'Security',
              text: `Safety Alert stood down and marked resolved. All operational perimeters normal.`,
            },
            ...prev.feed,
          ],
        };
      });
      notify('Safety Alert marked resolved and stood down');
    },
    [notify],
  );

  const acknowledgeSafetyAlert = useCallback<DemoApi['acknowledgeSafetyAlert']>(
    (alertId, roleOrUser) => {
      setState((prev) => {
        const list = prev.safetyAlerts ?? seedSafetyAlerts;
        return {
          ...prev,
          safetyAlerts: list.map((a) => {
            if (a.id !== alertId) return a;
            const existing = a.acknowledgedBy ?? [];
            if (existing.includes(roleOrUser)) return a;
            return {
              ...a,
              acknowledgedBy: [...existing, roleOrUser],
            };
          }),
        };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState({ ...seedState(), theme: stateRef.current.theme });
    notify('Demo data reset to its initial state');
  }, [notify]);


  const updateDndStatus = useCallback<DemoApi['updateDndStatus']>(
    (room, active, duration, instructions) => {
      const timestamp = nowLabel();
      const newDndEntry: DndHistoryRecord = {
        id: `dnd-${uid()}`,
        room,
        action: active ? 'activated' : 'deactivated',
        duration: duration || (active ? 'Until further notice' : 'Manual release'),
        instructions: instructions || (active ? 'Do not disturb requested' : 'DND deactivated by guest'),
        timestamp,
        updatedBy: 'Guest (Mobile Portal)',
      };

      setState((prev) => {
        const nextRooms = (prev.frontDesk?.rooms ?? []).map((r) =>
          r.no === room ? { ...r, dnd: active } : r
        );
        const prevPrefs = prev.guestPreferences?.[room] ?? {
          allergies: [],
          dietaryRestrictions: [],
          dnd: false,
          personalInstructions: '',
          specialRequests: [],
        };
        const nextPrefs = {
          ...prev.guestPreferences,
          [room]: { ...prevPrefs, dnd: active, personalInstructions: instructions || prevPrefs.personalInstructions },
        };
        const nextHistory = [newDndEntry, ...(prev.dndHistory ?? [])];

        const guestNotif: GuestNotification = {
          id: `gnotif-${uid()}`,
          room,
          category: 'Service Request Updates',
          title: active ? 'Do Not Disturb Active' : 'Do Not Disturb Deactivated',
          message: active
            ? `DND is set for Room ${room} (${newDndEntry.duration}). Housekeeping and callers will hold service.`
            : 'DND has been cleared. Normal hotel service has resumed.',
          date: 'Today',
          time: timestamp,
          read: false,
          targetTab: 'services',
          targetSubtab: 'dnd',
        };

        const staffNotif: InAppNotification = {
          id: uid(),
          roleId: 'front_desk_coordinator',
          title: active ? `Room ${room} Activated DND` : `Room ${room} Cleared DND`,
          message: active
            ? `Guest in Room ${room} set DND (${newDndEntry.duration}). Note: ${newDndEntry.instructions}`
            : `Guest in Room ${room} cleared DND status.`,
          timestamp,
          read: false,
          type: 'alert',
        };

        return {
          ...prev,
          dndHistory: nextHistory,
          guestPreferences: nextPrefs,
          frontDesk: {
            ...prev.frontDesk,
            rooms: nextRooms,
          },
          guestNotifications: [guestNotif, ...(prev.guestNotifications ?? [])],
          notifications: [staffNotif, ...(prev.notifications ?? [])],
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Guest Portal',
              text: `Room ${room} ${active ? 'enabled' : 'disabled'} Do Not Disturb · ${newDndEntry.duration}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify(active ? `Do Not Disturb activated for Room ${room}` : 'Do Not Disturb turned off');
    },
    [notify],
  );

  const submitGuestMessageToFrontDesk = useCallback<DemoApi['submitGuestMessageToFrontDesk']>(
    (room, subject, message, instructions) => {
      const timestamp = nowLabel();
      const id = `msg-${uid()}`;
      const stay = (stateRef.current.frontDesk?.stays ?? []).find((s) => s.room === room && s.status === 'in_house');
      const guestName = stay?.guest ?? 'Guest of Room ' + room;

      const newMsg: GuestFrontDeskMessage = {
        id,
        room,
        guestName,
        subject,
        message,
        instructions,
        status: 'Received',
        createdAt: `Today, ${timestamp}`,
        replies: [],
        bookingRef: stay?.bookingRef ?? 'BK-7740',
      };

      const fdTask: WorkItem = {
        id: `fd-msg-${id}`,
        title: `Guest Message · ${subject}`,
        meta: `Direct Portal Message · Room ${room} · ${guestName}`,
        status: 'Open',
        chip: 'Guest message',
        tone: 'info',
        room,
        guest: true,
        category: 'front_desk',
        description: `${message}${instructions ? ` (Notes: ${instructions})` : ''}`,
        createdAt: timestamp,
        owner: 'Front Desk',
        ref: `MSG-${room}-${String(Date.now()).slice(-4)}`,
        history: [{ at: timestamp, status: 'Received', note: 'Received directly from Guest Portal' }],
      };

      const guestNotif: GuestNotification = {
        id: `gnotif-${uid()}`,
        room,
        category: 'Front Desk Messages',
        title: 'Message Delivered to Front Desk',
        message: `Your message "${subject}" has been received by our Front Desk team. We will respond promptly.`,
        date: 'Today',
        time: timestamp,
        read: false,
        targetTab: 'services',
        targetSubtab: 'front_desk',
        targetId: id,
      };

      setState((prev) => ({
        ...prev,
        frontDeskMessages: [newMsg, ...(prev.frontDeskMessages ?? [])],
        guestNotifications: [guestNotif, ...(prev.guestNotifications ?? [])],
        items: {
          ...prev.items,
          front_desk_coordinator: [fdTask, ...(prev.items.front_desk_coordinator ?? [])],
        },
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Guest Portal',
            text: `Guest message received from Room ${room}: "${subject}"`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      notify('Message sent to Front Desk');
      return id;
    },
    [notify],
  );

  const replyGuestMessage = useCallback<DemoApi['replyGuestMessage']>(
    (messageId, replyText, sender) => {
      const timestamp = nowLabel();
      const replyEntry: GuestFrontDeskReply = {
        id: `rep-${uid()}`,
        sender,
        senderName: sender === 'guest' ? 'You (Guest)' : 'Maya Lin (Front Desk Lead)',
        text: replyText.trim(),
        at: `Today, ${timestamp}`,
      };

      setState((prev) => {
        const msgs = (prev.frontDeskMessages ?? []).map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              status: (sender === 'guest' ? 'Sent' : 'Responded') as GuestFrontDeskMessage['status'],
              replies: [...m.replies, replyEntry],
            };
          }
          return m;
        });

        const target = (prev.frontDeskMessages ?? []).find((m) => m.id === messageId);
        const room = target?.room ?? '402';

        let guestNotifs = prev.guestNotifications ?? [];
        if (sender === 'front_desk') {
          guestNotifs = [
            {
              id: `gnotif-${uid()}`,
              room,
              category: 'Front Desk Messages',
              title: `Front Desk Replied: ${target?.subject || 'Inquiry'}`,
              message: replyText.slice(0, 120),
              date: 'Today',
              time: timestamp,
              read: false,
              targetTab: 'services',
              targetSubtab: 'front_desk',
              targetId: messageId,
            },
            ...guestNotifs,
          ];
        }

        return {
          ...prev,
          frontDeskMessages: msgs,
          guestNotifications: guestNotifs,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: sender === 'guest' ? 'Guest Portal' : 'Front Desk',
              text: sender === 'guest' ? `Guest reply on #${messageId}` : `Front Desk responded to Room ${room}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify(sender === 'guest' ? 'Reply sent to Front Desk' : 'Response dispatched to guest');
    },
    [notify],
  );

  const submitGuestComplaint = useCallback<DemoApi['submitGuestComplaint']>(
    (input) => {
      const timestamp = nowLabel();
      const complaintId = `CMP-${input.room}-${String(Date.now()).slice(-4)}`;
      const id = `cmp-${uid()}`;
      const stay = (stateRef.current.frontDesk?.stays ?? []).find((s) => s.room === input.room && s.status === 'in_house');

      const newRecord: GuestComplaintRecord = {
        id,
        complaintId,
        room: input.room,
        guestName: input.guestName,
        bookingRef: stay?.bookingRef,
        category: input.category,
        title: input.title,
        description: input.description,
        photoUrl: input.photoUrl,
        submittedAt: `Today, ${timestamp}`,
        status: 'Submitted',
        assignedTo: 'Front Desk & Duty Operations',
        history: [
          { at: timestamp, status: 'Submitted', note: 'Registered via Guest Portal' },
          { at: timestamp, status: 'Under Review', note: 'Routing to Duty Manager & Department Head' },
        ],
      };

      const complaintCase: ComplaintCase = {
        id: `cc-${id}`,
        ref: complaintId,
        room: input.room,
        guest: input.guestName,
        summary: `[${input.category}] ${input.title}: ${input.description.slice(0, 80)}`,
        severity: input.category === 'Staff Behaviour' || input.category === 'Billing' ? 'critical' : 'normal',
        comp: 0,
        compApplied: false,
        createdAt: timestamp,
        category: input.category,
        status: 'Submitted',
        photoUrl: input.photoUrl,
      };

      const managerTask: WorkItem = {
        id: `mgr-cmp-${id}`,
        title: `Guest Complaint · ${input.category}: ${input.title}`,
        meta: `Room ${input.room} · ${input.guestName} · Portal submission`,
        status: 'Open',
        chip: 'Guest Complaint',
        tone: 'danger',
        room: input.room,
        guest: true,
        priority: 'urgent',
        ref: complaintId,
        createdAt: timestamp,
        description: input.description,
        history: [{ at: timestamp, status: 'Submitted', note: 'Logged by guest' }],
      };

      const guestNotif: GuestNotification = {
        id: `gnotif-${uid()}`,
        room: input.room,
        category: 'Complaint Updates',
        title: `Complaint Registered · ${complaintId}`,
        message: `Your complaint regarding "${input.title}" is under active review by hotel management. Ticket: ${complaintId}`,
        date: 'Today',
        time: timestamp,
        read: false,
        targetTab: 'complaints',
        targetId: complaintId,
      };

      setState((prev) => ({
        ...prev,
        guestComplaints: [newRecord, ...(prev.guestComplaints ?? [])],
        guestNotifications: [guestNotif, ...(prev.guestNotifications ?? [])],
        frontDesk: {
          ...prev.frontDesk,
          complaints: [complaintCase, ...(prev.frontDesk?.complaints ?? [])],
        },
        items: {
          ...prev.items,
          department_manager: [managerTask, ...(prev.items.department_manager ?? [])],
          front_desk_coordinator: [managerTask, ...(prev.items.front_desk_coordinator ?? [])],
        },
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Guest Portal',
            text: `Complaint ${complaintId} registered for Room ${input.room} (${input.category})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      notify(`Complaint registered (ID: ${complaintId})`);
      return complaintId;
    },
    [notify],
  );

  const submitGuestLostItemReport = useCallback<DemoApi['submitGuestLostItemReport']>(
    (input) => {
      const timestamp = nowLabel();
      const ref = `LF-${input.room}-${String(Date.now()).slice(-4)}`;
      const id = `lr-${uid()}`;

      const newRecord: GuestLostItemRecord = {
        id,
        ref,
        room: input.room,
        guestName: input.guestName,
        itemName: input.itemName,
        category: input.category,
        description: input.description,
        dateLost: input.dateLost || "Today",
        lastLocation: input.lastLocation || "Hotel Property",
        photoUrl: input.photoUrl,
        additionalInfo: input.additionalInfo,
        status: 'Reported',
        submittedAt: `Today, ${timestamp}`,
        history: [
          { at: timestamp, status: 'Reported', note: 'Report logged via Guest Portal' },
          { at: timestamp, status: 'Under Investigation', note: 'Front Desk & Security cross-referencing found items inventory' },
        ],
      };

      const lostTask: WorkItem = {
        id: `fd-lf-${id}`,
        title: `Lost Item · ${input.itemName}`,
        meta: `Lost & Found · Room ${input.room} · ${input.guestName}`,
        status: 'Open',
        chip: 'Lost item report',
        tone: 'warning',
        room: input.room,
        guest: true,
        category: 'lost_found',
        description: `Item: ${input.itemName} (${input.category})\nLast location: ${input.lastLocation}\nLost around: ${input.dateLost}\n${input.description}`,
        createdAt: timestamp,
        ref,
        history: [{ at: timestamp, status: 'Reported', note: 'Report submitted by guest' }],
      };

      const guestNotif: GuestNotification = {
        id: `gnotif-${uid()}`,
        room: input.room,
        category: 'Service Request Updates',
        title: `Lost Item Reported · ${ref}`,
        message: `Your report for "${input.itemName}" has been received. Front Desk and Security are searching recent turn-in logs.`,
        date: 'Today',
        time: timestamp,
        read: false,
        targetTab: 'lost_found',
        targetId: ref,
      };

      setState((prev) => ({
        ...prev,
        guestLostReports: [newRecord, ...(prev.guestLostReports ?? [])],
        guestNotifications: [guestNotif, ...(prev.guestNotifications ?? [])],
        items: {
          ...prev.items,
          front_desk_coordinator: [lostTask, ...(prev.items.front_desk_coordinator ?? [])],
        },
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Guest Portal',
            text: `Lost item report ${ref} (${input.itemName}) filed for Room ${input.room}`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      notify(`Lost item report submitted (${ref})`);
      return ref;
    },
    [notify],
  );

  const submitGuestFoundItemClaim = useCallback<DemoApi['submitGuestFoundItemClaim']>(
    (input) => {
      const timestamp = nowLabel();
      const ref = `CLM-${input.room}-${String(Date.now()).slice(-4)}`;

      setState((prev) => {
        const nextLostFound = (prev.lostFound ?? []).map((item) => {
          if (item.id === input.itemId) {
            return {
              ...item,
              claimed: true,
              claimedRoom: input.room,
            };
          }
          return item;
        });

        const claimTask: WorkItem = {
          id: `clm-${uid()}`,
          title: `Found Item Claim · ${input.itemName}`,
          meta: `Ownership Verification · Room ${input.room} · ${input.guestName}`,
          status: 'Open',
          chip: 'Claim verification',
          tone: 'info',
          room: input.room,
          guest: true,
          category: 'lost_found',
          description: `Guest claims item ${input.itemName} (Found item #${input.itemId}). Note: ${input.message}`,
          createdAt: timestamp,
          ref,
          history: [{ at: timestamp, status: 'Verification Pending', note: 'Guest submitted ownership verification details' }],
        };

        const guestNotif: GuestNotification = {
          id: `gnotif-${uid()}`,
          room: input.room,
          category: 'Service Request Updates',
          title: `Claim Submitted for ${input.itemName}`,
          message: 'Your ownership claim has been submitted to Front Desk. Please present matching ID to verify and collect.',
          date: 'Today',
          time: timestamp,
          read: false,
          targetTab: 'lost_found',
          targetId: ref,
        };

        return {
          ...prev,
          lostFound: nextLostFound,
          guestNotifications: [guestNotif, ...(prev.guestNotifications ?? [])],
          items: {
            ...prev.items,
            front_desk_coordinator: [claimTask, ...(prev.items.front_desk_coordinator ?? [])],
          },
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Guest Portal',
              text: `Room ${input.room} claimed found item #${input.itemId} (${input.itemName})`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify('Claim submitted to Front Desk for verification');
      return ref;
    },
    [notify],
  );

  const markGuestNotificationRead = useCallback<DemoApi['markGuestNotificationRead']>(
    (id) => {
      setState((prev) => ({
        ...prev,
        guestNotifications: (prev.guestNotifications ?? []).map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
    },
    [],
  );

  const markAllGuestNotificationsRead = useCallback<DemoApi['markAllGuestNotificationsRead']>(
    (room) => {
      setState((prev) => ({
        ...prev,
        guestNotifications: (prev.guestNotifications ?? []).map((n) =>
          n.room === room ? { ...n, read: true } : n
        ),
      }));
      notify('All notifications marked as read');
    },
    [notify],
  );

  const updateGuestProfile = useCallback<DemoApi['updateGuestProfile']>(
    (room, profile) => {
      setState((prev) => {
        const nextStays = (prev.frontDesk?.stays ?? []).map((s) => {
          if (s.room === room) {
            return {
              ...s,
              guest: profile.name || s.guest,
            };
          }
          return s;
        });

        const prevPrefs = prev.guestPreferences?.[room] ?? {
          allergies: [],
          dietaryRestrictions: [],
          dnd: false,
          personalInstructions: '',
          specialRequests: [],
        };

        const nextPrefs = {
          ...prev.guestPreferences,
          [room]: {
            ...prevPrefs,
            ...(profile.preferences ?? {}),
          },
        };

        return {
          ...prev,
          frontDesk: {
            ...prev.frontDesk,
            stays: nextStays,
          },
          guestPreferences: nextPrefs,
        };
      });
      notify('Guest profile updated successfully');
    },
    [notify],
  );

  const resetActionableExamples = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        front_desk_coordinator: seedItems.front_desk_coordinator,
      },
      frontDesk: {
        ...prev.frontDesk,
        stays: prev.frontDesk.stays.map((st) =>
          st.id === 'stay-hannah' ? { ...st, idChecked: false, preCheckIn: 'pending_verify' } : st
        ),
      },
      safetyAlerts: (prev.safetyAlerts ?? seedSafetyAlerts).map((a) =>
        a.id === 'alert-3' ? { ...a, status: 'draft_pending_validation' } : a
      ),
    }));
    notify('Action items reset for demonstration');
  }, [notify]);

  const api = useMemo<DemoApi>(
    () => ({
      setManagerDepartment,
      departmentManagerCommand,
      state,
      hydrated,
      setPersona,
      advance,
      cycleIntegration,
      reset,
      notify,
      setTheme,
      setActiveDispatcherDept,
      submitGuestRequest,
      placeRoomServiceOrder,
      placeDiningOrder,
      addDiningMenuItem,
      updateDiningMenuItem,
      deleteDiningMenuItem,
      toggleDiningMenuItemAvailability,
      addDiningCategory,
      removeDiningCategory,
      cancelGuestItem,
      submitGuestFeedback,
      disputeFolioCharge,
      claimLostItem,
      addLostFoundItem,
      expressCheckout,
      fdAction,
      toggleStaffStatus,
      updateStaffRole,
      addStaffAccount,
      updateWorkflowConfig,
      updateEventsConfig,
      revokeRoomSession,
      restoreRoomSession,
      setIntegrationState,
      testConnector,
      simulateTestTask,
      recordAuditEvent,
      setSoundEnabled,
      setFulfillerAvailability,
      requestTaskReassignment,
      resolveReassignment,
      requestEmergencyShiftChange,
      attachTaskPhoto,
      markNotificationRead,
      clearAllNotifications,
      assignDispatcherTask,
      autoAssignTask,
      autoAssignAllPending,
      reassignDispatcherTask,
      linkDuplicateTask,
      escalateTaskToManager,
      redistributeUnstartedTasks,
      toggleRoutingRule,
      updateStaffAvailability,
      updateStaffCapacity,
      reviewResourceRequest,
      createResourceRequest,
      submitShiftHandover,
      acknowledgeShiftHandover,
      resolveComplaintCase,
      addManagerNote,
      updateIncidentStatus,
      reviewExecutiveItem,
      addExecutiveComment,
      requestExecutiveDirective,
      acknowledgeSecurityItem,
      arriveSecurityItem,
      resolveSecurityItem,
      requestSecurityBackup,
      escalateSecurityItem,
      addSecurityNote,
      createSecurityIncident,
      recordInvoicePayment,
      createInvoice,
      reviewRefundRequest,
      updateTransactionStatus,
      reconcileTransaction,
      approveInspection,
      reopenInspection,
      reviewFulfillerReassignment,
      escalateSupervisorIssue,
      createDispatcherTask,
      simulateGuestMessage,
      resolveFulfillerBlocker,
      claimTask,
      updateGuestPreferences,
      createHotelService,
      initiateInspectionDirective,
      createCompensationRequest,
      reviewDeptManagerCompensation,
      reviewGmCompensation,
      reviewFinancialCompensation,
      acceptSupervisorEscalatedTask,
      updateStaffShiftSchedule,
      createStaffShiftSchedule,
      saveDepartmentServicePolicy,
      createGuestReminder,
      updateGuestReminderStatus,
      deleteGuestReminder,
      submitSecuritySafetyAlert,
      validateSafetyAlertByFrontDesk,
      approveSafetyAlertByManager,
      broadcastSafetyAlert,
      resolveSafetyAlert,
      acknowledgeSafetyAlert,
      updateDndStatus,
      submitGuestMessageToFrontDesk,
      replyGuestMessage,
      submitGuestComplaint,
      submitGuestLostItemReport,
      submitGuestFoundItemClaim,
      markGuestNotificationRead,
      markAllGuestNotificationsRead,
      updateGuestProfile,
      gestureGuideOpen,
      setGestureGuideOpen,
      resetActionableExamples,
      toasts,
    }),
    [
      setManagerDepartment,
      departmentManagerCommand,
      state,
      hydrated,
      setPersona,
      advance,
      cycleIntegration,
      reset,
      notify,
      setTheme,
      submitGuestRequest,
      placeRoomServiceOrder,
      placeDiningOrder,
      addDiningMenuItem,
      updateDiningMenuItem,
      deleteDiningMenuItem,
      toggleDiningMenuItemAvailability,
      addDiningCategory,
      removeDiningCategory,
      cancelGuestItem,
      submitGuestFeedback,
      disputeFolioCharge,
      claimLostItem,
      addLostFoundItem,
      expressCheckout,
      fdAction,
      toggleStaffStatus,
      updateStaffRole,
      addStaffAccount,
      updateWorkflowConfig,
      updateEventsConfig,
      revokeRoomSession,
      restoreRoomSession,
      setIntegrationState,
      testConnector,
      simulateTestTask,
      recordAuditEvent,
      setSoundEnabled,
      setFulfillerAvailability,
      requestTaskReassignment,
      resolveReassignment,
      requestEmergencyShiftChange,
      attachTaskPhoto,
      markNotificationRead,
      clearAllNotifications,
      assignDispatcherTask,
      autoAssignTask,
      autoAssignAllPending,
      reassignDispatcherTask,
      linkDuplicateTask,
      escalateTaskToManager,
      redistributeUnstartedTasks,
      toggleRoutingRule,
      updateStaffAvailability,
      updateStaffCapacity,
      reviewResourceRequest,
      createResourceRequest,
      submitShiftHandover,
      acknowledgeShiftHandover,
      resolveComplaintCase,
      addManagerNote,
      updateIncidentStatus,
      reviewExecutiveItem,
      addExecutiveComment,
      requestExecutiveDirective,
      acknowledgeSecurityItem,
      arriveSecurityItem,
      resolveSecurityItem,
      requestSecurityBackup,
      escalateSecurityItem,
      addSecurityNote,
      createSecurityIncident,
      recordInvoicePayment,
      createInvoice,
      reviewRefundRequest,
      updateTransactionStatus,
      reconcileTransaction,
      approveInspection,
      reopenInspection,
      reviewFulfillerReassignment,
      escalateSupervisorIssue,
      createDispatcherTask,
      simulateGuestMessage,
      resolveFulfillerBlocker,
      claimTask,
      updateGuestPreferences,
      createHotelService,
      initiateInspectionDirective,
      createCompensationRequest,
      reviewDeptManagerCompensation,
      reviewGmCompensation,
      reviewFinancialCompensation,
      acceptSupervisorEscalatedTask,
      updateStaffShiftSchedule,
      createStaffShiftSchedule,
      saveDepartmentServicePolicy,
      createGuestReminder,
      updateGuestReminderStatus,
      deleteGuestReminder,
      submitSecuritySafetyAlert,
      validateSafetyAlertByFrontDesk,
      approveSafetyAlertByManager,
      broadcastSafetyAlert,
      resolveSafetyAlert,
      acknowledgeSafetyAlert,
      updateDndStatus,
      submitGuestMessageToFrontDesk,
      replyGuestMessage,
      submitGuestComplaint,
      submitGuestLostItemReport,
      submitGuestFoundItemClaim,
      markGuestNotificationRead,
      markAllGuestNotificationsRead,
      updateGuestProfile,
      gestureGuideOpen,
      setGestureGuideOpen,
      resetActionableExamples,
      toasts,
    ],
  );

  return (
    <DemoContext.Provider value={api}>
      {children}
      {state.persona !== 'task_fulfiller' && (
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-white/10 bg-ink-800/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur"
          >
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            <div>
              <p>{t.text}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-mist-400">Simulated action</p>
            </div>
          </div>
        ))}
      </div>
      )}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoApi {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>');
  return ctx;
}
