import { nextOperationalReference } from './operational-references.ts';
import type { DemoState, WorkItem, SupervisorInspection } from '../types/demo';
import { applyManagerWorkflow, type WorkflowCommand } from './manager-workflows.ts';
import { applyScheduleCommand, type ScheduleCommand } from './manager-scheduling.ts';

export const MANAGER_DEPARTMENTS = [
  { id: 'housekeeping', name: 'Housekeeping', person: 'Ananya Rao', email: 'housekeeping.manager@thegrandadp.com', focus: 'Room readiness, spotless spaces and thoughtful guest care.', standard: 'Verify linen, amenities, sanitation and room presentation.' },
  { id: 'wellness', name: 'Spa & Wellness', person: 'Leena Kapoor', email: 'wellness.manager@thegrandadp.com', focus: 'Guest care, medical case follow-up and wellness service quality.', standard: 'Verify wellness-area hygiene, guest-care readiness and follow-up ownership.' },
  { id: 'engineering', name: 'Maintenance & Engineering', person: 'Arjun Mehta', email: 'engineering.manager@thegrandadp.com', focus: 'Reliable systems, preventive maintenance and safe facilities.', standard: 'Verify equipment operation, repair evidence and safety clearance.' },
  { id: 'food-beverages', name: 'Food & Beverages', person: 'Vikram Joshi', email: 'dining.manager@thegrandadp.com', focus: 'Timely service, food safety and memorable dining experiences.', standard: 'Verify food temperatures, allergen checks, presentation and delivery.' },
] as const;
export type ManagerDepartmentId = typeof MANAGER_DEPARTMENTS[number]['id'];
export const MANAGER_DEMO_PASSWORD = 'manager123';
export function managerDepartmentFromEmail(email: string): ManagerDepartmentId | undefined {
  const normalized = email.trim().toLowerCase();
  if (normalized === 'manager@thegrandadp.com') return 'housekeeping';
  return MANAGER_DEPARTMENTS.find(department => department.email === normalized)?.id;
}
export function managerDepartment(id?: string) { return MANAGER_DEPARTMENTS.find(d => d.id === id) ?? MANAGER_DEPARTMENTS[0]; }

export function departmentId(value?: string): ManagerDepartmentId | undefined {
  const text = (value ?? '').toLowerCase();
  if (/housekeep|\bhk\b|linen|cleaning/.test(text)) return 'housekeeping';
  if (/wellness|\bspa\b|therapy|treatment/.test(text)) return 'wellness';
  if (/maintenan|engineering|\bhvac\b|plumbing/.test(text)) return 'engineering';
  if (/food|beverage|dining|room.service|\bf&b\b/.test(text)) return 'food-beverages';
}
export function taskDepartment(item: WorkItem): ManagerDepartmentId | undefined {
  return departmentId(item.department) ?? departmentId(item.category) ?? departmentId(item.routedTo) ?? departmentId(`${item.title} ${item.meta}`);
}
export function isOpen(status: string) { return !['completed', 'delivered', 'resolved', 'cancelled', 'canceled', 'closed', 'rejected', 'passed'].includes(status.toLowerCase()); }
export function managerTasks(s: DemoState, id: ManagerDepartmentId) {
  const unique = new Map<string, WorkItem>();
  // The departmental queue is authoritative for shared request references.
  for (const key of ['department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller', 'department_supervisor', 'department_manager'] as const)
    for (const item of s.items[key] ?? []) if (taskDepartment(item) === id && !unique.has(item.ref ?? item.id)) unique.set(item.ref ?? item.id, item);
  return [...unique.values()];
}
export function managerEscalations(state: DemoState, department: ManagerDepartmentId, direction: 'to' | 'from') {
  return (state.items.department_manager ?? []).filter(item => {
    const route = item.managerEscalation;
    if (route) return direction === 'to' ? route.target === department : route.sentBy?.includes(department) || route.source === department;
    return direction === 'to' && taskDepartment(item) === department && /^(ESC|REC)-/.test(item.ref || '');
  });
}

export function managerInspections(s: DemoState, id: ManagerDepartmentId) {
  return (s.inspections ?? []).filter(i => (departmentId(i.department) ?? (i.type === 'maintenance_check' ? 'engineering' : 'housekeeping')) === id);
}
export function managerNotifications(s: DemoState, id: ManagerDepartmentId) {
  const tasks = new Set(managerTasks(s, id).flatMap(t => [t.id, t.ref].filter(Boolean)));
  const inspections = new Set(managerInspections(s, id).map(i => i.id));
  return (s.notifications ?? []).filter(n =>
    n.roleId === 'department_manager'
    // Broadcasts come from the safety alert record so acknowledgments and resolution stay current.
    && !/^(?:🚨\s*)?SAFETY ALERT BROADCAST:/i.test(n.title)
    && (departmentId(n.department) === id || !n.department && !!n.itemId && (tasks.has(n.itemId) || inspections.has(n.itemId)))
  );
}

export function managerSafetyAlerts(s: DemoState) {
  const priorityOrder = { critical: 0, urgent: 1, warning: 2 };
  return (s.safetyAlerts ?? [])
    .filter(alert =>
      (alert.broadcastScope === 'all_staff' || alert.broadcastScope === 'hotel_wide')
      && (alert.status === 'broadcast_active' || (alert.status === 'resolved' && !!alert.broadcastAt))
    )
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'broadcast_active' ? -1 : 1;
      return a.status === 'broadcast_active' ? priorityOrder[a.priority] - priorityOrder[b.priority] : 0;
    });
}
export function ensureManagerState(s: DemoState): DemoState {
  const next = { ...s, managerOperations: { ...(s.managerOperations ?? seedManagerOperations()), medicalCases: s.managerOperations?.medicalCases ?? [] }, managerDepartment: s.managerDepartment ?? 'housekeeping' as const, staffAccounts: [...s.staffAccounts], items: { ...s.items }, inspections: [...(s.inspections ?? [])] };
  for (const d of MANAGER_DEPARTMENTS) {
    if (d.id === 'wellness' && !next.staffAccounts.some(st => st.id === 'dept-therapist-wellness')) next.staffAccounts.push({ id: 'dept-therapist-wellness', employeeId: 'SPA-0201', name: 'Maya Sen', email: 'maya.sen@thegrandadp.com', roleId: 'task_fulfiller', department: d.name, floorZone: 'Spa treatment rooms', shift: 'Day', status: 'active', financialLimit: 0, createdAt: '2026-11-04', availability: 'on_duty', skills: ['Wellness treatments'], maxWorkload: 4 });
    if (!next.staffAccounts.some(st => st.id === `dept-manager-${d.id}`)) next.staffAccounts.push({ id: `dept-manager-${d.id}`, employeeId: `MGR-${d.id.toUpperCase()}`, name: d.person, email: d.email, roleId: 'department_manager', department: d.name, floorZone: 'All floors', shift: 'Day', status: 'active', financialLimit: 16000, createdAt: '2026-11-04', availability: 'on_duty' });
    if (!next.staffAccounts.some(st => departmentId(st.department) === d.id && ['department_supervisor', 'department_dispatcher_supervisor'].includes(st.roleId))) next.staffAccounts.push({ id: `dept-supervisor-${d.id}`, employeeId: `SUP-${d.id.toUpperCase()}`, name: `${d.name} Supervisor`, email: '', roleId: 'department_dispatcher_supervisor', department: d.name, floorZone: 'All floors', shift: 'Day', status: 'active', financialLimit: 0, createdAt: '2026-11-04', availability: 'on_duty' });
    const caseId = `dept-case-${d.id}`;
    if (!next.items.department_manager.some(t => t.id === caseId)) next.items.department_manager = [...next.items.department_manager, { id: caseId, ref: `REC-${d.id.toUpperCase()}`, title: `${d.name}: supervisor requests service recovery`, meta: 'Department supervisor · guest follow-up required', department: d.name, status: 'Escalated', priority: 'urgent', room: '402', createdAt: '2026-11-04T08:00:00+05:30' }];
    const inspectionId = `dept-gm-inspection-${d.id}`;
    if (!next.inspections.some(i => i.id === inspectionId)) next.inspections.push({ id: inspectionId, department: d.name, roomNumber: d.id === 'wellness' ? 'Spa 1' : d.id === 'food-beverages' ? 'Main restaurant' : '402', roomType: d.name, floor: 4, attendantId: '', attendantName: 'Awaiting assignment', type: d.id === 'engineering' ? 'maintenance_check' : 'periodic', status: 'pending', priority: 'normal', completedAt: '', createdAt: '2026-11-04T08:00:00+05:30', initiatedBy: 'General Manager', initiatedRole: 'general_manager', instructions: d.standard, items: [] });
  }
  return next;
}

export type ManagerCommand =
  | ScheduleCommand
  | { type: 'service-targets'; inspectionMinutes: number; complaintMinutes: number }
  | WorkflowCommand
  | { type: 'stock-count'; stockId: string; quantity: number }
  | { type: 'replenish'; stockId: string }
  | { type: 'room-cleaning'; room: string }
  | { type: 'appointment'; guest: string; treatment: string; therapistId: string; room: string; start: string; durationMinutes: number }
  | { type: 'appointment-status'; appointmentId: string; status: 'completed' | 'cancelled' }
  | { type: 'asset-work-order'; assetId: string }
  | { type: 'asset-service'; assetId: string }
  | { type: 'menu-availability'; menuId: string; available: boolean }
  | { type: 'inspection'; location: string; instructions: string; supervisorId: string; inspectionId?: string }
  | { type: 'escalation-action'; itemId: string; action: 'acknowledge' | 'reject' | 'escalate'; note?: string; target?: string }
  | { type: 'recovery'; taskId: string; decision: 'resolve' | 'escalate'; note: string }
  | { type: 'availability'; staffId: string; value: 'on_duty' | 'break' | 'off_duty' }
  | { type: 'handover'; incoming: string; notes: string }
  | { type: 'acknowledge'; handoverId: string }
  | { type: 'policy'; title: string; content: string; opensAt?: string; closesAt?: string; quietStart?: string; quietEnd?: string; slaMinutes?: number }
  | { type: 'read'; notificationId: string }
  | { type: 'profile'; name: string; phone: string };

export function applyManagerCommand(state: DemoState, command: ManagerCommand, uid: string, now = new Date().toISOString()): DemoState {
  if (state.persona !== 'department_manager') throw Error('Open a department manager demo account first.');
  const s = structuredClone(state), d = managerDepartment(s.managerDepartment), person = s.managerProfiles?.[d.id]?.name || d.person;
  const required = (text: string) => { if (!text.trim() || text.length > 2000) throw Error('Enter a value between 1 and 2,000 characters.'); return text.trim(); };
  const scopedStaff = (id: string) => { const staff = s.staffAccounts.find(st => st.id === id && departmentId(st.department) === d.id); if (!staff) throw Error('Staff member is outside your department.'); return staff; };
  const pushNotification = (roleId: 'department_manager' | 'department_dispatcher_supervisor' | 'general_manager', title: string, message: string, itemId: string) => {
    s.notifications = [{ id: `${uid}-${roleId}`, roleId, title, message, itemId, department: d.name, timestamp: now, read: false, type: 'alert' }, ...(s.notifications ?? [])];
  };
  let auditAction: string = command.type;
  let auditResource: string = d.name;
  let auditDetails: string | undefined;
  if (command.type === 'escalation-action') {
    const item = managerEscalations(s, d.id, 'to').find(record => record.id === command.itemId);
    if (!item) throw Error('Escalation unavailable in your inbox.');
    const previous = item.managerEscalation;
    if (previous?.status === 'Rejected') throw Error('This escalation has already been rejected.');
    if (command.action === 'acknowledge' && previous?.status === 'Acknowledged') throw Error('This escalation is already acknowledged.');
    const outgoing = command.action === 'escalate';
    const status = command.action === 'reject' ? 'Rejected' : outgoing ? 'Escalated' : 'Acknowledged';
    const note = command.action === 'acknowledge' ? command.note?.trim() : required(command.note || '');
    const target = outgoing ? command.target : d.id;
    if (!target || outgoing && (target === d.id || !['general_manager', ...MANAGER_DEPARTMENTS.map(department => department.id)].includes(target))) {
      throw Error('Choose a recipient for the escalation.');
    }
    const history = [...(previous?.history ?? []), { at: now, actor: person, status, note }];
    item.managerEscalation = {
      status: outgoing && target !== 'general_manager' ? 'Pending' : status,
      source: outgoing ? d.id : previous?.source,
      sentBy: outgoing ? [...new Set([...(previous?.sentBy ?? []), d.id])] : previous?.sentBy,
      target, history,
    };
    if (outgoing && target === 'general_manager') {
      const id = 'gm-department-' + uid;
      s.items.general_manager.unshift({ ...item, id, linkedRef: item.ref || item.id, amount: undefined, status: 'Needs approval', escalatedTo: 'General Manager', escalatedAt: now, notes: note });
      pushNotification('general_manager', 'Department escalation: ' + item.title, note || '', id);
    } else if (outgoing) {
      s.notifications = [{ id: uid, roleId: 'department_manager', department: managerDepartment(target).name, title: 'Escalation from ' + d.name, message: note || '', itemId: item.id, timestamp: now, read: false, type: 'alert' }, ...(s.notifications ?? [])];
    }
    auditAction = 'Escalation ' + status.toLowerCase();
    auditResource = item.ref || item.id;
    auditDetails = note;
  } else if (command.type === 'schedule-shift') {
    applyScheduleCommand(s, command, uid, now);
  } else if (command.type === 'service-targets') {
    if (![command.inspectionMinutes, command.complaintMinutes].every(value => Number.isInteger(value) && value >= 1 && value <= 10080)) throw Error('Service targets must be whole minutes between 1 and 10,080.');
    s.departmentServiceTargets = { ...s.departmentServiceTargets, [d.id]: { inspectionMinutes: command.inspectionMinutes, complaintMinutes: command.complaintMinutes } };
  } else if (['task-update', 'medical-create', 'medical-update', 'complaint-create', 'complaint-update', 'repair-create', 'repair-update', 'repair-category', 'menu-save', 'menu-delete', 'inspection-launch'].includes(command.type)) {
    s.managerOperations ??= seedManagerOperations();
    applyManagerWorkflow(s, command as WorkflowCommand, uid, now);
  } else if (['stock-count', 'replenish', 'room-cleaning', 'appointment', 'appointment-status', 'asset-work-order', 'asset-service', 'menu-availability'].includes(command.type)) {
    applyDepartmentOperation(s, command, uid, now);
  } else if (command.type === 'inspection') {
    const supervisor = scopedStaff(command.supervisorId);
    if (!['department_supervisor', 'department_dispatcher_supervisor'].includes(supervisor.roleId) || supervisor.status !== 'active') throw Error('Select an active department supervisor.');
    const instructions = required(command.instructions), location = required(command.location);
    if (command.inspectionId) {
      const inspection = managerInspections(s, d.id).find(i => i.id === command.inspectionId);
      if (!inspection || inspection.status !== 'pending') throw Error('Only pending inspections in your department can be assigned.');
      Object.assign(inspection, { assignedSupervisorId: supervisor.id, assignedSupervisorName: supervisor.name, instructions });
    } else {
      const inspection: SupervisorInspection = { id: uid, ref: nextOperationalReference(s, 'INS', location, now), department: d.name, roomNumber: location, roomType: d.name, floor: Number(location[0]) || 1, attendantId: '', attendantName: 'Awaiting assignment', type: d.id === 'engineering' ? 'maintenance_check' : 'periodic', status: 'pending', priority: 'normal', completedAt: '', createdAt: now, initiatedBy: person, initiatedRole: 'department_manager', assignedSupervisorId: supervisor.id, assignedSupervisorName: supervisor.name, instructions, items: [{ id: `${uid}-standard`, category: 'Safety & Keycard', label: d.standard, passed: false }] };
      s.inspections = [inspection, ...(s.inspections ?? [])];
    }
    pushNotification('department_dispatcher_supervisor', `${d.name} inspection assigned`, `${person}: ${instructions}`, command.inspectionId || uid);
  } else if (command.type === 'recovery') {
    const task = managerTasks(s, d.id).find(t => t.id === command.taskId);
    if (!task || !isOpen(task.status)) throw Error('Open task unavailable in your department.');
    const note = required(command.note), status = command.decision === 'resolve' ? 'Resolved' : 'Escalated to GM';
    if (task.status === 'Escalated to GM') throw Error('This request is already awaiting a General Manager decision.');
    const matches = (i: WorkItem) => i.id === task.id || !!task.ref && i.ref === task.ref;
    for (const queue of Object.keys(s.items) as (keyof DemoState['items'])[]) s.items[queue] = s.items[queue].map(i => matches(i) ? { ...i, status, escalatedTo: command.decision === 'escalate' ? 'General Manager' : i.escalatedTo, history: [...(i.history ?? []), { at: now, status, note: `${person}: ${note}` }] } : i);
    if (command.decision === 'resolve') s.incidents = s.incidents?.map(i => i.id === task.id ? { ...i, status: 'resolved', timeline: [...i.timeline, { at: now, text: `${person}: ${note}` }] } : i);
    if (command.decision === 'escalate') {
      s.items.general_manager = [{ ...task, id: `gm-department-${uid}`, linkedRef: task.ref || task.id, amount: undefined, status: 'Needs approval', department: d.name, description: note, escalatedTo: 'General Manager', escalatedAt: now }, ...(s.items.general_manager ?? [])];
      pushNotification('general_manager', `${d.name}: manager escalation`, note, `gm-department-${uid}`);
    } else pushNotification('department_dispatcher_supervisor', `${d.name}: recovery resolved`, note, task.id);
  } else if (command.type === 'availability') {
    const staff = scopedStaff(command.staffId); if (staff.status !== 'active') throw Error('Inactive staff cannot be scheduled.'); staff.availability = command.value;
  } else if (command.type === 'handover') {
    const tasks = managerTasks(s, d.id).filter(t => isOpen(t.status));
    s.shiftHandovers = [{ id: uid, timestamp: now, outgoingManager: person, incomingManager: required(command.incoming), shift: 'Day', department: d.name, scope: 'My Department', outstandingTasksCount: tasks.length, unresolvedComplaintsCount: tasks.filter(t => /escalat|blocked/i.test(t.status)).length, criticalIncidentsCount: tasks.filter(t => t.priority === 'critical').length, notes: required(command.notes), priorityActions: tasks.slice(0, 5).map(t => t.title), status: 'submitted' }, ...(s.shiftHandovers ?? [])];
  } else if (command.type === 'acknowledge') {
    const handover = s.shiftHandovers?.find(h => h.id === command.handoverId && departmentId(h.department) === d.id);
    if (!handover || handover.outgoingManager === person || handover.incomingManager !== person) throw Error('Only the named incoming manager can acknowledge this handover.');
    handover.status = 'acknowledged'; handover.acknowledgedAt = now;
  } else if (command.type === 'policy') {
    if (d.id === 'wellness') throw Error('Policies are not available in the Wellness manager workspace.');
    const window = (start?: string, end?: string) => {
      if (!start && !end) return undefined;
      if (!start || !end || ![start, end].every(time => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) || start === end) throw Error('Choose distinct start and end times for each time window.');
      return { start, end };
    };
    if (command.slaMinutes !== undefined && (!Number.isInteger(command.slaMinutes) || command.slaMinutes < 1 || command.slaMinutes > 10080)) throw Error('Choose an SLA target between 1 and 10,080 minutes.');
    s.departmentPolicies = [{ id: uid, operatingWindow: window(command.opensAt, command.closesAt), quietHours: window(command.quietStart, command.quietEnd), slaMinutes: command.slaMinutes, department: d.name, title: required(command.title), category: 'Service Standard', summary: required(command.content), content: command.content.trim(), scope: d.name, policyOwner: person, escalationTarget: 'General Manager', effectiveDate: now.slice(0, 10), lastUpdated: now, isManagerLevel: true }, ...(s.departmentPolicies ?? [])];
  } else if (command.type === 'read') {
    if (!managerNotifications(s, d.id).some(n => n.id === command.notificationId)) throw Error('Notification unavailable in your department.');
    s.notifications = s.notifications?.map(n => n.id === command.notificationId ? { ...n, read: true } : n);
  } else if (command.type === 'profile') {
    s.managerProfiles = { ...s.managerProfiles, [d.id]: { name: required(command.name), phone: command.phone.slice(0, 40) } };
  }
  s.auditTrail = [{ id: uid, timestamp: now, actor: person, actorRole: 'Department Manager', action: auditAction, category: 'Workflow', resource: auditResource, details: auditDetails, outcome: 'success' }, ...s.auditTrail];
  return s;
}

/** Complete the GM -> department feedback loop without touching billing records. */
export function reviewManagerEscalation(state: DemoState, itemId: string, decision: 'approve' | 'reject' | 'info_requested', note: string, uid: string): DemoState {
  if (!['general_manager', 'executive_viewer'].includes(state.persona || '')) throw Error('General Manager authority is required.');
  const s = structuredClone(state), item = s.items.general_manager.find(i => i.id === itemId);
  if (!item || !item.id.startsWith('gm-department-') || item.status !== 'Needs approval') throw Error('Pending department escalation unavailable.');
  if (!note.trim()) throw Error('Record the decision context for the department manager.');
  const now = new Date().toISOString(), status = decision === 'approve' ? 'GM Approved' : decision === 'reject' ? 'GM Rejected' : 'Info Requested';
  item.status = decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Info Requested';
  item.history = [...(item.history ?? []), { at: now, status: item.status, note }];
  for (const queue of ['department_manager', 'department_dispatcher', 'department_dispatcher_supervisor', 'task_fulfiller'] as const) s.items[queue] = (s.items[queue] ?? []).map(t => (t.ref || t.id) === item.linkedRef ? { ...t, status, ...(t.managerEscalation ? { managerEscalation: { ...t.managerEscalation, status: status as NonNullable<WorkItem['managerEscalation']>['status'], history: [...t.managerEscalation.history, { at: now, status, note, actor: 'General Manager' }] } } : {}), history: [...(t.history ?? []), { at: now, status, note: `General Manager: ${note}` }] } : t);
  s.notifications = [{ id: uid, department: item.department, roleId: 'department_manager', title: `${status}: ${item.title}`, message: note, itemId: item.linkedRef, timestamp: now, read: false, type: 'alert' }, ...(s.notifications ?? [])];
  s.auditTrail = [{ id: uid, timestamp: now, actor: 'General Manager', actorRole: 'General Manager', action: status, category: 'Workflow', resource: item.department || '', outcome: 'success' }, ...s.auditTrail];
  return s;
}

export function seedManagerOperations(): NonNullable<DemoState['managerOperations']> {
  const due = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  return {
    stock: [
      { id: 'hk-linen', department: 'Housekeeping', name: 'Bed linen sets', unit: 'sets', onHand: 38, par: 60 },
      { id: 'hk-towels', department: 'Housekeeping', name: 'Bath towels', unit: 'pieces', onHand: 90, par: 100 },
      { id: 'spa-oil', department: 'Spa & Wellness', name: 'Treatment oil', unit: 'bottles', onHand: 6, par: 10 },
      { id: 'spa-linen', department: 'Spa & Wellness', name: 'Treatment linen', unit: 'sets', onHand: 18, par: 20 },
      { id: 'eng-filter', department: 'Maintenance & Engineering', name: 'HVAC filters', unit: 'pieces', onHand: 3, par: 6 },
      { id: 'eng-lamps', department: 'Maintenance & Engineering', name: 'LED lamps', unit: 'pieces', onHand: 9, par: 12 },
      { id: 'fb-milk', department: 'Food & Beverages', name: 'Milk', unit: 'litres', onHand: 8, par: 15 },
      { id: 'fb-coffee', department: 'Food & Beverages', name: 'Coffee beans', unit: 'kg', onHand: 4, par: 8 },
    ],
    appointments: [],
    assets: [
      { id: 'asset-hvac', name: 'Guest-floor air handling unit', location: 'Level 4 · plant room', intervalDays: 30, nextDue: due(-2) },
      { id: 'asset-pump', name: 'Water circulation pump', location: 'Basement · utility room', intervalDays: 14, nextDue: due(0) },
      { id: 'asset-cold', name: 'Kitchen cold-room compressor', location: 'Main kitchen', intervalDays: 30, nextDue: due(3) },
    ],
  };
}

function applyDepartmentOperation(s: DemoState, command: ManagerCommand, uid: string, now: string): void {
  const d = managerDepartment(s.managerDepartment), person = s.managerProfiles?.[d.id]?.name || d.person;
  const operations = s.managerOperations ??= seedManagerOperations();
  const requireDepartment = (id: ManagerDepartmentId) => { if (d.id !== id) throw Error('This feature is outside your department.'); };
  const text = (value: string) => { if (!value.trim() || value.length > 200) throw Error('Enter a value between 1 and 200 characters.'); return value.trim(); };
  const notify = (title: string, message: string, itemId: string) => { s.notifications = [{ id: uid, roleId: 'department_dispatcher_supervisor', department: d.name, title, message, itemId, timestamp: now, read: false, type: 'task' }, ...(s.notifications ?? [])]; };
  const addTask = (task: WorkItem) => {
    s.items.department_dispatcher_supervisor = [task, ...(s.items.department_dispatcher_supervisor ?? [])];
    s.items.department_dispatcher = [{ ...task }, ...(s.items.department_dispatcher ?? [])];
    s.items.task_fulfiller = [{ ...task, id: `${uid}-fulfiller` }, ...(s.items.task_fulfiller ?? [])];
    notify(task.title, `${person} requested department follow-up.`, task.id);
  };
  if (command.type === 'stock-count' || command.type === 'replenish') {
    const stock = operations.stock.find(item => item.id === command.stockId && departmentId(item.department) === d.id);
    if (!stock) throw Error('Stock item unavailable in your department.');
    if (command.type === 'stock-count') {
      if (!Number.isFinite(command.quantity) || command.quantity < 0 || command.quantity > 1000000) throw Error('Enter a valid non-negative stock count.');
      if (['sets', 'pieces', 'bottles'].includes(stock.unit) && !Number.isInteger(command.quantity)) throw Error('Count this item in whole units.');
      stock.onHand = command.quantity; stock.lastCountedAt = now;
    } else {
      if (stock.onHand >= stock.par) throw Error('Stock is already at or above its target.');
      if (s.resourceRequests?.some(r => r.id === stock.requisitionId && r.status === 'pending')) throw Error('A replenishment request is already pending.');
      stock.requisitionId = uid;
      s.resourceRequests = [{ id: uid, title: `Replenish ${stock.name}`, category: 'Supply', department: d.name, urgency: stock.onHand === 0 ? 'high' : 'medium', requestedBy: person, requestedAt: now, details: `Request ${stock.par - stock.onHand} ${stock.unit}; count ${stock.onHand}, target ${stock.par}.`, status: 'pending' }, ...(s.resourceRequests ?? [])];
      notify('Supply replenishment requested', `${stock.name}: ${stock.par - stock.onHand} ${stock.unit} requested.`, uid);
    }
  } else if (command.type === 'room-cleaning') {
    requireDepartment('housekeeping');
    const room = s.frontDesk.rooms.find(r => r.no === command.room);
    if (!room) throw Error('Room unavailable.');
    if (room.dnd || s.guestPreferences?.[room.no]?.dnd) throw Error('Do Not Disturb is active. Room entry cannot be requested.');
    if (room.readiness === 'out_of_order') throw Error('Out-of-order rooms require engineering clearance.');
    if (!['dirty', 'inspection_failed'].includes(room.readiness)) throw Error('This room does not need a new cleaning request.');
    if (managerTasks(s, d.id).some(t => t.room === room.no && isOpen(t.status) && t.category === 'housekeeping')) throw Error('This room already has an open housekeeping request.');
    const stay = s.frontDesk.stays.find(stay => stay.room === room.no && stay.status === 'expected');
    addTask({ id: uid, ref: nextOperationalReference(s, 'HK', room.no, now), title: `Room ${room.no}: prepare for arrival`, meta: d.name, department: d.name, category: 'housekeeping', room: room.no, floor: room.floor, status: 'Unassigned', priority: stay?.vip ? 'vip' : 'normal', createdAt: now });
  } else if (command.type === 'appointment') {
    requireDepartment('wellness');
    const therapist = s.staffAccounts.find(st => st.id === command.therapistId && departmentId(st.department) === 'wellness' && st.roleId === 'task_fulfiller' && st.status === 'active' && !['break', 'off_duty'].includes(st.availability || 'on_duty'));
    if (!therapist) throw Error('Select an available wellness therapist.');
    const start = Date.parse(command.start), duration = command.durationMinutes, buffer = 15;
    if (!Number.isFinite(start) || start < Date.parse(now) || ![30, 45, 60, 90].includes(duration)) throw Error('Choose a future appointment and a listed treatment duration.');
    if (!['Treatment room 1', 'Treatment room 2', 'Treatment room 3'].includes(command.room)) throw Error('Choose a listed treatment room.');
    const end = start + (duration + buffer) * 60000;
    if (operations.appointments.some(a => a.status !== 'cancelled' && (a.therapistId === therapist.id || a.room === command.room) && start < Date.parse(a.start) + (a.durationMinutes + a.bufferMinutes) * 60000 && end > Date.parse(a.start))) throw Error('Therapist or room is already booked, including the 15-minute reset buffer.');
    const ref = nextOperationalReference(s, 'TSK', command.room, now);
    operations.appointments.push({ id: uid, guest: text(command.guest), treatment: text(command.treatment), therapistId: therapist.id, room: command.room, start: new Date(start).toISOString(), durationMinutes: duration, bufferMinutes: buffer, status: 'booked', taskRef: ref });
    addTask({ id: uid, ref, title: `${command.treatment} · ${command.guest}`, department: d.name, category: 'spa', location: command.room, meta: `${command.room} · ${therapist.name}`, assignee: therapist.name, assigneeId: therapist.id, status: 'Assigned', createdAt: now });
  } else if (command.type === 'appointment-status') {
    requireDepartment('wellness');
    const appointment = operations.appointments.find(a => a.id === command.appointmentId && a.status === 'booked');
    if (!appointment) throw Error('Active appointment unavailable.');
    if (command.status === 'completed' && Date.parse(now) < Date.parse(appointment.start) + appointment.durationMinutes * 60000) throw Error('The scheduled treatment has not finished yet.');
    appointment.status = command.status;
    for (const queue of Object.keys(s.items) as (keyof DemoState['items'])[]) s.items[queue] = s.items[queue].map(t => t.ref === appointment.taskRef ? { ...t, status: command.status === 'completed' ? 'Completed' : 'Cancelled' } : t);
    notify(`Appointment ${command.status}`, appointment.treatment, appointment.id);
  } else if (command.type === 'asset-work-order' || command.type === 'asset-service') {
    requireDepartment('engineering');
    const asset = operations.assets.find(a => a.id === command.assetId);
    if (!asset) throw Error('Asset unavailable.');
    const linked = asset.workOrderRef ? managerTasks(s, 'engineering').find(t => t.ref === asset.workOrderRef) : undefined;
    if (command.type === 'asset-work-order') {
      if (linked && isOpen(linked.status)) throw Error('This asset already has an open work order.');
      asset.workOrderRef = nextOperationalReference(s, 'REP', asset.location, now);
      addTask({ id: uid, ref: asset.workOrderRef, title: `Preventive maintenance · ${asset.name}`, meta: asset.location, department: d.name, category: 'maintenance', location: asset.location, status: 'Unassigned', createdAt: now });
    } else {
      if (!linked || !['completed', 'resolved'].includes(linked.status.toLowerCase())) throw Error('Complete the linked work order before recording service.');
      asset.lastServiced = now; asset.nextDue = new Date(Date.parse(now) + asset.intervalDays * 86400000).toISOString().slice(0, 10); asset.workOrderRef = undefined;
    }
  } else if (command.type === 'menu-availability') {
    requireDepartment('food-beverages');
    const item = s.diningMenu?.find(item => item.id === command.menuId);
    if (!item) throw Error('Menu item unavailable.');
    item.isAvailable = command.available;
  }
}
