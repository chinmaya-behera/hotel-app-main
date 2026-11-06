import type { LucideIcon } from 'lucide-react';

export type RoleId =
  | 'task_fulfiller'
  | 'department_dispatcher_supervisor'
  | 'department_manager'
  | 'front_desk_coordinator'
  | 'financial_operator'
  | 'security_responder'
  | 'general_manager'
  | 'platform_admin'
  // Backward compatibility aliases
  | 'department_dispatcher'
  | 'department_supervisor'
  | 'executive_viewer';

export type ActiveId = RoleId | 'home' | 'guest' | 'site';

export type DispatcherDepartment =
  | 'Housekeeping'
  | 'Wellness'
  | 'Maintenance & Engineering'
  | 'Food & Beverages';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

export interface RoleMeta {
  id: RoleId;
  slug: string;
  path: string;
  name: string;
  short: string;
  tagline: string;
  scopes: string[];
  keywords: string[];
  icon: LucideIcon;
  /** "r g b" triplet used as --a */
  accent: string;
  /** "r g b" triplet used as --b */
  accent2: string;
  surface: 'mobile' | 'desktop';
}

export interface QuickLink {
  id: 'guest' | 'site';
  name: string;
  short: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  accent2: string;
  keywords: string;
}

export interface WorkItem {
  id: string;
  title: string;
  meta: string;
  status: string;
  chip?: string;
  tone?: Tone;
  amount?: number;
  room?: string;
  /** visible to the matching guest in the Guest Portal */
  guest?: boolean;
  /** acted on / requested by the current persona (separation of duties) */
  selfRequested?: boolean;
  priority?: 'normal' | 'vip' | 'critical' | 'urgent' | 'safety';
  /** reference number shown to the guest, e.g. "HK-402-003" */
  ref?: string;
  /** guest-portal originating module, when this item came from the Guest Portal */
  category?: 'housekeeping' | 'maintenance' | 'spa' | 'concierge' | 'recreation' | 'room_service' | 'folio' | 'lost_found' | 'safety' | 'laundry' | 'front_desk';
  notes?: string;
  note?: string;
  description?: string;
  createdAt?: string;
  history?: GuestHistoryEntry[];
  dnd?: boolean;
  photoAttached?: boolean;
  feedback?: { rating: number; comment?: string };
  dishFeedback?: Record<string, { rating: number; comment?: string; submittedAt: string }>;
  orderedAt?: string;
  requestedServiceAt?: string;
  demoSource?: 'dining-showcase';
  repairCategory?: string;
  orderLines?: OrderLine[];
  /** accountable owner of a guest case (Front Desk owns cases; departments own routed tasks) */
  owner?: string;
  /** quoted fee for a concierge / upsell request, posted to the folio only after the guest accepts */
  fee?: number;
  /** department a Front Desk case was routed to */
  routedTo?: string;
  /** reference of the original guest case when this is a routed department task */
  linkedRef?: string;
  /** how a Front Desk case was captured */
  channel?: string;
  /** Frontend-only data-URL of photo evidence attached by fulfiller */
  photoUrl?: string;
  /** whether completion evidence / photo is strictly required before completing */
  evidenceRequired?: boolean;
  /** reason when task reassignment is requested */
  reassignReason?: string;
  /** whether reassignment request is pending review by supervisor/dispatcher */
  reassignPending?: boolean;
  /** recorded blocker reason (e.g. DND, Missing parts) */
  blockerReason?: string;
  /** target SLA deadline time string or badge */
  slaDue?: string;
  /** specific room/floor location */
  location?: string;
  /** assigned fulfiller name */
  assignee?: string;
  /** Assigned fulfiller employee ID */
  assigneeId?: string;
  /** Timestamp when assigned */
  assignedAt?: string;
  /** Whether this task was linked as a duplicate of an existing task */
  isLinkedDuplicate?: boolean;
  /** Reference of the primary task this duplicate is linked to */
  linkedToRef?: string;
  /** Escalation target (e.g. Duty Manager) */
  escalatedTo?: string;
  /** Escalation timestamp */
  escalatedAt?: string;
  /** Escalation justification / note */
  escalationReason?: string;
  /** Whether the task was assigned via automated routing */
  autoAssigned?: boolean;
  /** Reason why auto-assignment could not match a staff member */
  assignmentFailureReason?: string;
  /** Acknowledgment SLA deadline */
  ackSlaDue?: string;
  /** Acknowledgment SLA status */
  ackStatus?: 'pending' | 'acknowledged' | 'overdue';
  /** Department name for direct filtering */
  department?: string;
  /** Floor number for spatial assignment */
  floor?: number;
  /** Security Responder Report details filed upon resolution */
  securityReport?: {
    summary: string;
  content?: string;
    observations: string;
    actionsTaken: string;
    outcome: string;
    followUp?: string;
    witnessDetails?: string;
    photoUrl?: string;
    filedAt?: string;
    officer?: string;
  };
  /** Security officer logged notes (immutable chronological log) */
  securityNotes?: Array<{ at: string; author: string; text: string }>;
  /** Security backup requested reason */
  backupReason?: string;
  backupRequestedAt?: string;
  /** Security officer arrival timestamp */
  arrivedAt?: string;
  /** Security officer acknowledgment timestamp */
  acknowledgedAt?: string;
}

export interface InAppNotification {
  department?: string;
  id: string;
  title: string;
  message?: string;
  summary?: string;
  timestamp: string;
  roleId?: RoleId;
  read: boolean;
  type?: 'task' | 'alert' | 'system' | 'reassign';
  itemId?: string;
  priority?: 'normal' | 'urgent' | 'vip' | 'critical' | 'warning';
  link?: string;
  tone?: string;
  targetRole?: RoleId | string;
  category?: string;
}

export interface GuestHistoryEntry {
  at: string;
  status: string;
  note?: string;
  actor?: string;
  role?: string;
}

export interface GuestMessageRecord {
  id: string;
  taskId?: string;
  room: string;
  guestName?: string;
  templateType: string;
  messageText: string;
  sentAt: string;
  sender: string;
  channel: 'In-App Notification' | 'Simulated SMS' | 'Portal Alert';
  status: 'Delivered (Simulated)';
}

export interface OrderLine {
  itemId: string;
  name: string;
  dishName?: string;
  cuisine?: string;
  menuCategory?: string;
  qty: number;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Starters' | 'Mains' | 'Drinks' | 'Desserts';
  price: number;
  desc?: string;
  veg?: boolean;
}

export type DietaryType = 'veg' | 'non_veg' | 'vegan';

export type AllergenType =
  | 'Dairy'
  | 'Nuts'
  | 'Peanuts'
  | 'Gluten'
  | 'Soy'
  | 'Eggs'
  | 'Shellfish'
  | 'Fish';

export interface PortionOption {
  name: string;
  priceDelta: number;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
}

export type MealTimeSlot = 'breakfast' | 'lunch' | 'dinner' | 'all_day' | 'late_night';

export interface DiningMenuItem {
  id: string;
  name: string;
  category: string;
  cuisine?: string;
  price: number;
  dietary: DietaryType;
  rating?: number;
  ratingCount?: number;
  image: string;
  desc?: string;
  ingredients: string[];
  allergens: AllergenType[];
  isAvailable: boolean;
  mealTimes?: MealTimeSlot[];
  supportsSpiceLevel?: boolean;
  supportsPortionSize?: boolean;
  portionOptions?: PortionOption[];
  availableAddons?: MenuItemAddon[];
  prepNotesAllowed?: boolean;
}

export interface FolioLine {
  id: string;
  label: string;
  amount: number;
  date: string;
  disputed?: boolean;
  disputeReason?: string;
}

/* ---- Financial Operator & Guest Billing Models (ER_DIAGRAMS Domain 3) ---- */

export type InvoiceStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'Refunded';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: 'Room' | 'F&B' | 'Spa' | 'Laundry' | 'Service' | 'Tax';
  amount: number;
}

export interface FinanceInvoice {
  id: string;
  guestName: string;
  roomNumber: string;
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
  createdAt: string;
  dueDate: string;
  roomCharges: number;
  serviceCharges: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  paymentMethod?: string;
  notes?: string;
  items?: InvoiceLineItem[];
}

export type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded';
export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash' | 'Direct Bill';

export interface FinanceTransaction {
  id: string;
  invoiceId?: string;
  guestName: string;
  bookingRef: string;
  roomNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
  status: TransactionStatus;
  referenceNumber: string;
  gateway: string;
  notes?: string;
  isReconciled?: boolean;
}

export type RefundStatus = 'Pending Review' | 'Approved' | 'Executed' | 'Rejected';

export interface FinanceRefundRequest {
  id: string;
  invoiceId: string;
  guestName: string;
  roomNumber: string;
  amount: number;
  reason: string;
  requestedAt: string;
  requestedBy: string;
  status: RefundStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  transactionRef?: string;
}

export type InspectionStatus = 'pending' | 'passed' | 'reopened' | 'escalated';
export type InspectionType = 'turnover' | 'deep_clean' | 'vip_prep' | 'maintenance_check' | 'periodic';

export interface InspectionCheckItem {
  id: string;
  category: 'Bathroom & Sanitization' | 'Bedding & Linens' | 'Minibar & Amenities' | 'Electronics & Climate' | 'Safety & Keycard' | 'bedding' | 'bathroom' | 'amenities' | 'electronics' | 'cleanliness';
  label: string;
  passed: boolean;
  notes?: string;
}

export interface SupervisorInspection {
  batchId?: string;
  scope?: 'room' | 'floor' | 'all';
  typeLabel?: string;
  department?: string;
  createdAt?: string;
  scheduledTime?: string;
  completedChecklistCount?: number;
  totalChecklistCount?: number;
  id: string;
  taskId?: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  attendantName: string;
  attendantId: string;
  type: InspectionType;
  status: InspectionStatus;
  priority: 'normal' | 'vip' | 'urgent';
  completedAt: string;
  inspectedAt?: string;
  inspectedBy?: string;
  score?: number;
  items: InspectionCheckItem[];
  reopenReason?: string;
  correctiveAction?: string;
  notes?: string;
  photoUrl?: string;
  /** Inspection directive initiated by Department Manager or General Manager */
  initiatedBy?: string;
  initiatedRole?: RoleId;
  instructions?: string;
  findings?: string;
  followUpRequired?: boolean;
  followUpAction?: string;
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
}

export interface LostFoundItem {
  id: string;
  name: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  /** sensitive items (documents, valuables, jewelry) never expose a photo to guests */
  sensitive: boolean;
  /** small data-URL photo added by Front Desk; shown to guests only when not sensitive */
  photo?: string;
  loggedBy?: string;
  claimed?: boolean;
  claimedRoom?: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Transition {
  label: string;
  next: string;
  message: string;
  variant?: 'primary' | 'secondary' | 'danger';
  /** mandatory reason picker */
  reasons?: string[];
  blockedIf?: 'self' | 'overLimit';
  /** marks the item as acted on by the current persona */
  marksSelf?: boolean;
  /** revokes the guest QR session for item.room */
  revokesQr?: boolean;
}

export interface Kpi {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  /** true when the trend direction is good news */
  good?: boolean;
  icon: LucideIcon;
  /** value is computed from open items */
  live?: 'open';
}

export interface Meter {
  label: string;
  value: number;
  note?: string;
  tone?: Tone;
}

export type SideWidget =
  | { type: 'meters'; title: string; hint?: string; icon: LucideIcon; rows: Meter[] }
  | { type: 'rooms'; title: string; hint?: string; icon: LucideIcon }
  | { type: 'integrations'; title: string; hint?: string; icon: LucideIcon }
  | { type: 'qr'; title: string; hint?: string; icon: LucideIcon }
  | { type: 'lostfound'; title: string; hint?: string; icon: LucideIcon }
  | { type: 'notes'; title: string; hint?: string; icon: LucideIcon; rows: string[] };

export interface DashboardConfig {
  sub: string;
  listTitle: string;
  listHint: string;
  listIcon: LucideIcon;
  banner?: { tone: Tone; text: string };
  kpis: Kpi[];
  transitions: Record<string, Transition[]>;
  side: SideWidget[];
}

export interface FeedEntry {
  id: string;
  at: string;
  role: string;
  text: string;
}

export type IntegrationState = 'healthy' | 'degraded' | 'down';

export interface Integration {
  id: string;
  name: string;
  detail: string;
}

export type RoomState = 'O' | 'V' | 'D' | 'L' | 'X';

/* ---- Front Desk (frontend-only mock records; shapes follow ER_DIAGRAMS / backlog F08-F34) ---- */

/** Housekeeping room status machine (backlog F21). Occupancy is kept separate from cleanliness. */
export type Readiness = 'dirty' | 'cleaning' | 'inspection_pending' | 'ready' | 'inspection_failed' | 'out_of_order';

export type StayStatus = 'expected' | 'in_house' | 'checked_out';

export interface GuestPreferences {
  allergies: string[];
  dietaryRestrictions: string[];
  dietary?: string[];
  dnd: boolean;
  personalInstructions: string;
  pillowPreference?: string;
  roomTemperature?: string;
  specialRequests: string[];
}

export interface StayRecord {
  id: string;
  room: string;
  guest: string;
  vip?: boolean;
  roomType: string;
  arrival: string;
  departure: string;
  nights: number;
  status: StayStatus;
  departsToday?: boolean;
  vipTier?: string;
  milestone?: string;
  dietarySummary?: string;
  preferencesSummary?: string;
  gmStatus?: string;
  /** F08: pre-arrival registration state */
  preCheckIn: 'none' | 'pending_verify' | 'verified';
  idChecked: boolean;
  /** payments collected against the folio (simulated, tokenised card) */
  paid: number;
  cardMask: string;
  /** F09: early check-in request with a fee */
  earlyCheckIn?: { fee: number; status: 'pending' | 'approved' | 'declined' };
  movedFrom?: string;
  /** set when the stay came from a public-website booking (frontend demo) */
  bookingRef?: string;
  /** ISO yyyy-mm-dd dates; the text fields above stay the display labels */
  arrivalDate?: string;
  departureDate?: string;
  /** folio lines posted at check-in for a website booking */
  charges?: Array<{ label: string; amount: number }>;
  /** amount already paid online (simulated); becomes `paid` at check-in */
  prepaid?: number;
  guests?: number;
  /** Guest personal preferences & future service instructions (allergies, DND, dietary) */
  preferences?: GuestPreferences;
}

export interface RoomRecord {
  no: string;
  floor: number;
  occupied: boolean;
  readiness: Readiness;
  /** F04: guest Do Not Disturb */
  dnd: boolean;
  note?: string;
}

/** F14: payment succeeded but the PMS booking did not (payment state is kept separate from booking state). */
export interface SyncIssue {
  id: string;
  bookingRef: string;
  guest: string;
  amount: number;
  cardMask: string;
  detail: string;
  paymentState: 'Payment_Captured';
  bookingState: 'PMS_Sync_Failed' | 'PMS_Confirmed' | 'Manual_Confirm' | 'Refund_Requested';
}

/** F32: complaint & recovery case. */
export interface ComplaintCase {
  department?: string;
  priority?: 'normal' | 'urgent' | 'critical';
  history?: GuestHistoryEntry[];
  id: string;
  ref: string;
  room: string;
  guest: string;
  summary: string;
  severity: 'normal' | 'vip' | 'critical';
  comp: number;
  compApplied: boolean;
  createdAt: string;
  managerItemId?: string;
  repeatOf?: string;
  guestName?: string;
  description?: string;
  category?: string;
  compOffered?: boolean;
  compAmount?: number;
  loggedBy?: string;
  status?: string;
  responseRemarks?: string;
  photoUrl?: string;
}

/* ---- Public website bookings (frontend-only simulation; never a real reservation or payment) ---- */

/** pending_confirmation: payment captured but the PMS booking is not confirmed yet (shows as Needs Reconciliation to Front Desk). */
export type BookingStatus = 'confirmed' | 'pending_confirmation' | 'cancelled';

export interface BookingPricing {
  nightlyRate: number;
  nights: number;
  roomSubtotal: number;
  resortFee: number;
  taxes: number;
  total: number;
}

export interface WebBooking {
  ref: string;
  status: BookingStatus;
  /** room type id from the sample catalog */
  roomType: string;
  roomTypeName: string;
  room: string;
  /** ISO yyyy-mm-dd */
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guest: { name: string; email: string; phone: string };
  requests?: string;
  pricing: BookingPricing;
  /** only a masked card token is ever kept */
  payment: { mask: string; amount: number; state: 'captured' | 'refund_requested'; refund?: number };
  createdAt: string;
  history: Array<{ at: string; text: string }>;
  stayId: string;
  preArrival: { status: 'none' | 'submitted' | 'verified'; arrivalTime?: string };
}

export interface FrontDeskState {
  stays: StayRecord[];
  rooms: RoomRecord[];
  sync: SyncIssue[];
  complaints: ComplaintCase[];
}

/* ---- Platform Administrator Domain Models (ER_DIAGRAMS / Admin and IT workflow) ---- */

export interface StaffAccount {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  roleId: RoleId;
  department: string;
  floorZone: string;
  shift: 'Day' | 'Evening' | 'Night' | 'Rotating';
  status: 'active' | 'inactive';
  financialLimit: number;
  createdAt: string;
  lastActive?: string;
  /** Specialised task skills (e.g. HVAC, Plumbing, Turndown, VIP amenities) */
  skills?: string[];
  /** Maximum concurrent active tasks before considered overloaded (default: 5) */
  maxWorkload?: number;
  /** Live shift availability status */
  availability?: 'on_duty' | 'break' | 'off_duty';
  /** Current floor/zone assignment */
  currentFloor?: number;
}

export interface RoutingRule {
  id: string;
  category: string;
  department: string;
  targetRole: RoleId;
  defaultPriority: 'normal' | 'vip' | 'critical' | 'urgent' | 'safety';
  ackSlaMinutes: number;
  resolutionSlaMinutes: number;
  active: boolean;
  description?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  category: 'Access' | 'Workflow' | 'Integration' | 'Hotel' | 'Security' | 'Finance';
  resource: string;
  outcome: 'success' | 'warning' | 'denied' | 'failure';
  details?: string;
}

export interface WorkflowConfig {
  ackSlaMinutes: number;
  resolutionSlaMinutes: number;
  dualSlaEnabled: boolean;
  fdCompLimit: number;
  dutyManagerCompLimit: number;
  execApprovalThreshold: number;
  freeCancellationDays: number;
  earlyCheckInFee: number;
  resortFeePerNight: number;
  autoEscalateOnOverdue: boolean;
}

export interface EventCategoryConfig {
  id: string;
  name: string;
  startingPrice: number;
  available: boolean;
}

export interface EventsCelebrationsConfig {
  enabled: boolean;
  cardImage: string;
  subtitle: string;
  categories?: EventCategoryConfig[];
}

export interface PermissionRule {
  key: string;
  label: string;
  category: 'Operations' | 'Guest & Stays' | 'Finance & Folios' | 'Security & Evidence' | 'Administration';
  allowedRoles: RoleId[];
  description: string;
}

export interface ResourceRequest {
  id: string;
  title: string;
  category: 'Supply' | 'Equipment' | 'Staffing' | 'Maintenance';
  department: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  requestedAt: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ShiftHandover {
  id: string;
  timestamp: string;
  outgoingManager: string;
  incomingManager: string;
  shift: 'Day' | 'Evening' | 'Night' | 'Duty';
  department: string;
  scope: 'My Department' | 'Entire Hotel';
  outstandingTasksCount: number;
  unresolvedComplaintsCount: number;
  criticalIncidentsCount: number;
  notes: string;
  priorityActions: string[];
  status: 'submitted' | 'acknowledged';
  outgoingStaffName?: string;
  outgoingStaffId?: string;
  incomingStaffName?: string;
  incomingStaffId?: string;
  followUpResponsibility?: string;
  acknowledgedAt?: string;
  pendingTasksList?: Array<{ id: string; ref?: string; title: string; room?: string; priority?: string; followUpAssignee?: string }>;
}

export interface HotelServiceItem {
  id: string;
  name: string;
  department: string;
  category: WorkItem['category'] | string;
  description: string;
  price: number;
  estimatedMinutes?: number;
  availableForGuest: boolean;
  requiresSpecialist?: boolean;
  iconName?: string;
}

export interface IncidentRecord {
  id: string;
  ref: string;
  title: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedArea: string;
  department: string;
  coordinator: string;
  reportedAt: string;
  status: 'investigating' | 'contained' | 'resolved';
  timeline: Array<{ at: string; text: string }>;
  relatedTaskRef?: string;
}

/* ---- Phase 3: Compensation & Multi-Tier Financial Escalations ---- */

export type CompensationStatus =
  | 'pending_dept_manager'
  | 'pending_gm'
  | 'pending_financial_operator'
  | 'approved'
  | 'rejected';

export interface CompensationHistoryEntry {
  at: string;
  role: string;
  actor: string;
  action: string;
  note: string;
}

export interface CompensationRequest {
  id: string;
  ref: string;
  room: string;
  guestName: string;
  stayId?: string;
  incidentRef?: string;
  taskId?: string;
  department: string;
  amount: number;
  reason: string;
  supportingEvidence?: string;
  category?: string;
  evidence?: string;
  requestedBy: string;
  requestedAt: string;
  status: CompensationStatus;
  tier: 'standard' | 'high_value'; // standard: <= 10000, high_value: > 10000
  deptManagerDecision?: {
    action: 'approved' | 'escalated_to_gm' | 'rejected';
    decidedBy: string;
    decidedAt: string;
    comments: string;
  };
  gmDecision?: {
    action: 'forwarded_to_finance' | 'rejected';
    decidedBy: string;
    decidedAt: string;
    comments: string;
  };
  financeDecision?: {
    action: 'approved' | 'rejected';
    decidedBy: string;
    decidedAt: string;
    comments: string;
  };
  history: CompensationHistoryEntry[];
  folioLineId?: string;
  completedAt?: string;
}

/* ---- Phase 3: Staff & Shift Scheduling ---- */

export interface ShiftScheduleRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  roleId: RoleId;
  date: string;
  shiftType: 'Morning' | 'Evening' | 'Night';
  startTime: string;
  endTime: string;
  shiftHours?: string;
  floorZone: string;
  status: 'scheduled' | 'on_duty' | 'completed' | 'leave' | 'conflict';
  conflictReason?: string;
  notes?: string;
}

/* ---- Phase 3: Department Service Policies ---- */

export interface DepartmentServicePolicy {
  id: string;
  department: string;
  title: string;
  category: 'Service Standard' | 'Escalation Threshold' | 'Operating Procedure' | 'Guest Recovery' | string;
  content?: string;
  scope: string;
  policyOwner: string;
  summary: string;
  authorityLimit?: number | string;
  escalationTarget: string;
  effectiveDate: string;
  lastUpdated: string;
  isManagerLevel?: boolean;
}

export interface ManagerStockItem {
  id: string;
  department: string;
  name: string;
  unit: string;
  onHand: number;
  par: number;
  lastCountedAt?: string;
  requisitionId?: string;
}

export interface ManagerAppointment {
  id: string;
  guest: string;
  treatment: string;
  therapistId: string;
  room: string;
  start: string;
  durationMinutes: number;
  bufferMinutes: number;
  status: 'booked' | 'completed' | 'cancelled';
  taskRef: string;
}

export interface ManagerAsset {
  id: string;
  name: string;
  location: string;
  intervalDays: number;
  nextDue: string;
  lastServiced?: string;
  workOrderRef?: string;
}

export interface ManagerMedicalCase {
  id: string;
  reference: string;
  guest: string;
  location: string;
  urgency: 'routine' | 'urgent' | 'critical';
  status: 'open' | 'monitoring' | 'closed';
  followUpAt?: string;
  followUpAcknowledgedAt?: string;
  createdAt: string;
  history: Array<{ at: string; author: string; note: string }>;
}

export type DepartmentRecordKind = 'repair' | 'task' | 'order' | 'medical' | 'complaint' | 'inspection' | 'menu' | 'stock' | 'asset' | 'room' | 'handover' | 'policy' | 'staff' | 'supplies';
export interface DepartmentRecordSnapshot {
  key: string;
  department: 'housekeeping' | 'wellness' | 'engineering' | 'food-beverages';
  kind: DepartmentRecordKind;
  reference: string;
  title: string;
  status: string;
  location: string;
  owner: string;
  notes: string;
  completedAt?: string;
  fields: Record<string, string>;
}
export interface DepartmentRecordEvent {
  id: string;
  recordedAt: string;
  actor: string;
  actorRole: string;
  action: 'recorded' | 'created' | 'updated' | 'completed' | 'reopened' | 'deleted';
  record: DepartmentRecordSnapshot;
  changes: Array<{ field: string; before: string; after: string }>;
}

export interface DemoState {
  departmentRecordHistory?: DepartmentRecordEvent[];
  managerOperations?: { stock: ManagerStockItem[]; appointments: ManagerAppointment[]; assets: ManagerAsset[]; medicalCases?: ManagerMedicalCase[] };
  managerDepartment?: 'housekeeping' | 'wellness' | 'engineering' | 'food-beverages';
  managerProfiles?: Record<string, { name: string; phone: string }>;
  persona: RoleId | null;
  items: Record<RoleId, WorkItem[]>;
  feed: FeedEntry[];
  integrations: Record<string, IntegrationState>;
  revokedRooms: string[];
  folios: Record<string, FolioLine[]>;
  lostFound: LostFoundItem[];
  theme: ThemeMode;
  frontDesk: FrontDeskState;
  /** bookings made on the public website (simulated) */
  bookings: WebBooking[];
  /** Staff accounts and memberships (ER_DIAGRAMS Domain 1) */
  staffAccounts: StaffAccount[];
  /** Immutable audit event trail (ER_DIAGRAMS Domain 4 / SECURITY.md) */
  auditTrail: AuditEvent[];
  /** Workflow, SLA, and operational configuration (Admin and IT workflow) */
  workflowConfig: WorkflowConfig;
  /** Events & Celebrations hotel configuration */
  eventsConfig?: EventsCelebrationsConfig;
  /** In-app notification sounds enabled */
  soundEnabled?: boolean;
  /** Fulfiller shift availability */
  fulfillerAvailability?: 'on_duty' | 'break' | 'off_duty';
  /** In-app role notifications */
  notifications?: InAppNotification[];
  /** Emergency shift handover request */
  shiftChangeRequest?: { requestedAt: string; reason: string; status: 'pending' | 'approved'; details?: string } | null;
  /** Auto-routing engine category-to-department rules */
  routingRules?: RoutingRule[];
  /** Department & Duty Manager resource requests */
  resourceRequests?: ResourceRequest[];
  /** Shift handover log */
  shiftHandovers?: ShiftHandover[];
  /** Cross-department incident management records */
  incidents?: IncidentRecord[];
  /** Guest Billing Invoices (Financial Operator) */
  invoices?: FinanceInvoice[];
  /** Payments & Transactions (Financial Operator) */
  transactions?: FinanceTransaction[];
  /** Refund Requests Queue (Financial Operator) */
  refundRequests?: FinanceRefundRequest[];
  /** Room Turnover & Quality Inspections (Department Supervisor) */
  inspections?: SupervisorInspection[];
  /** Guest-facing and internal hotel services created by Department Manager */
  hotelServices?: HotelServiceItem[];
  /** Guest personal preferences indexed by room number */
  guestPreferences?: Record<string, GuestPreferences>;
  /** Automated guest message simulation history */
  guestMessages?: GuestMessageRecord[];
  /** Compensation and financial approval requests (Phase 3) */
  compensationRequests?: CompensationRequest[];
  /** Staff and shift schedule assignments (Phase 3) */
  shiftSchedules?: ShiftScheduleRecord[];
  /** Department-specific service policies (Phase 3) */
  departmentPolicies?: DepartmentServicePolicy[];
  /** Guest Operational Reminders (Front Desk & GM VIP) - Phase 4 */
  guestReminders?: GuestReminder[];
  /** Safety Alert Broadcasts (Security -> Front Desk -> Manager -> All) - Phase 4 */
  safetyAlerts?: SafetyAlertRecord[];
  dndHistory?: DndHistoryRecord[];
  frontDeskMessages?: GuestFrontDeskMessage[];
  guestComplaints?: GuestComplaintRecord[];
  guestLostReports?: GuestLostItemRecord[];
  guestNotifications?: GuestNotification[];
  hotelAlerts?: HotelAlert[];
  diningMenu?: DiningMenuItem[];
  diningCategories?: string[];
  activeDispatcherDept?: DispatcherDepartment;
}

/* ---- Phase 4: Guest Reminders & Safety Alert Broadcast Engine ---- */

export type GuestReminderPriority = 'normal' | 'urgent' | 'vip';

export interface GuestReminder {
  id: string;
  guestName: string;
  room: string;
  stayId?: string;
  title?: string;
  text?: string;
  notes?: string;
  dueDateTime?: string;
  dueDate?: string;
  dueTime?: string;
  status?: 'pending' | 'completed' | 'dismissed';
  priority: GuestReminderPriority;
  createdBy?: string;
  assignedTo?: string;
  createdAt: string;
  specialInstructions?: string;
  category?: string;
}

export type SafetyAlertStatus =
  | 'draft_pending_validation'
  | 'validated_pending_approval'
  | 'approved_ready_broadcast'
  | 'broadcast_active'
  | 'rejected'
  | 'resolved';

export interface SafetyAlertAuditStep {
  at: string;
  actor: string;
  role: string;
  action: string;
  notes?: string;
  note?: string;
}

export interface SafetyAlertRecord {
  id: string;
  ref: string;
  title: string;
  priority: 'critical' | 'urgent' | 'warning';
  location: string;
  affectedFloors?: string[];
  incidentType: 'life_safety' | 'fire_sensor' | 'hvac_leak' | 'security_breach' | 'weather';
  description: string;
  status: SafetyAlertStatus;
  reportedBy: string;
  reportedAt: string;
  validatedBy?: string;
  validatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  broadcastAt?: string;
  resolvedAt?: string;
  broadcastScope: 'all_staff' | 'hotel_wide' | 'security_only';
  auditHistory: SafetyAlertAuditStep[];
  acknowledgedBy?: string[];
}

/* ---- Guest Side Domain Models (Six Main Sections) ---- */

export interface DndHistoryRecord {
  id: string;
  room: string;
  action: 'activated' | 'deactivated';
  duration?: string;
  instructions?: string;
  timestamp: string;
  updatedBy: string;
}

export interface GuestFrontDeskReply {
  id: string;
  sender: 'guest' | 'front_desk';
  senderName: string;
  text: string;
  at: string;
}

export interface GuestFrontDeskMessage {
  id: string;
  room: string;
  guestName: string;
  subject: string;
  message: string;
  instructions?: string;
  status: 'Sent' | 'Received' | 'Responded' | 'Closed';
  createdAt: string;
  replies: GuestFrontDeskReply[];
  bookingRef?: string;
}

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type ComplaintCategory =
  | 'Room Issues'
  | 'Housekeeping'
  | 'Food and Dining'
  | 'Staff Behaviour'
  | 'Maintenance'
  | 'Billing'
  | 'Other';

export interface GuestComplaintRecord {
  department?: string;
  id: string;
  complaintId: string;
  room: string;
  guestName: string;
  bookingRef?: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  photoUrl?: string;
  submittedAt: string;
  status: ComplaintStatus;
  assignedTo?: string;
  responseRemarks?: string;
  resolvedAt?: string;
  compensationOffered?: number;
  history: Array<{ at: string; status: string; note?: string; actor?: string }>;
}

export type LostItemStatus =
  | 'Reported'
  | 'Under Investigation'
  | 'Item Found'
  | 'Verification Pending'
  | 'Returned to Guest'
  | 'Closed';

export interface GuestLostItemRecord {
  id: string;
  ref: string;
  room: string;
  guestName: string;
  guestPhone?: string;
  itemName: string;
  category: string;
  description: string;
  dateLost: string;
  timeLost?: string;
  lastLocation: string;
  photoUrl?: string;
  additionalInfo?: string;
  status: LostItemStatus;
  submittedAt: string;
  claimNote?: string;
  staffNotes?: string;
  matchedFoundItemId?: string;
  history: Array<{ at: string; status: string; note?: string }>;
}

export type GuestNotificationCategory =
  | 'Booking Updates'
  | 'Service Request Updates'
  | 'Reminder Updates'
  | 'Front Desk Messages'
  | 'Complaint Updates'
  | 'Payment/Billing Updates'
  | 'General Announcements';

export interface GuestNotification {
  id: string;
  room: string;
  category: GuestNotificationCategory;
  title: string;
  message: string;
  date: string;
  time: string;
  read: boolean;
  targetTab?: 'services' | 'alerts' | 'complaints' | 'lost_found' | 'notifications' | 'profile';
  targetSubtab?: string;
  targetId?: string;
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type AlertCategory =
  | 'Emergency Alerts'
  | 'Safety Alerts'
  | 'Weather Alerts'
  | 'Hotel Announcements'
  | 'Important Operational Alerts';

export interface HotelAlert {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  timestamp: string;
  location?: string;
  affectedFloors?: string[];
  guidance?: string;
  active: boolean;
  requiresAcknowledgement?: boolean;
}

