import type { DemoState, WorkItem, SupervisorInspection } from '../types/demo';

export const MANAGER_DEPARTMENTS = [
  { id: 'housekeeping', name: 'Housekeeping', person: 'Ananya Rao', email: 'housekeeping.manager@thegrandadp.com', focus: 'Room readiness, spotless spaces and thoughtful guest care.', standard: 'Verify linen, amenities, sanitation and room presentation.' },
  { id: 'wellness', name: 'Spa & Wellness', person: 'Leena Kapoor', email: 'wellness.manager@thegrandadp.com', focus: 'Calm treatment spaces, safe therapies and seamless appointments.', standard: 'Verify treatment-room hygiene, therapist readiness and appointment setup.' },
  { id: 'engineering', name: 'Maintenance & Engineering', person: 'Arjun Mehta', email: 'engineering.manager@thegrandadp.com', focus: 'Reliable systems, preventive maintenance and safe facilities.', standard: 'Verify equipment operation, repair evidence and safety clearance.' },
  { id: 'food-beverages', name: 'Food & Beverages', person: 'Vikram Joshi', email: 'dining.manager@thegrandadp.com', focus: 'Timely service, food safety and memorable dining experiences.', standard: 'Verify food temperatures, allergen checks, presentation and delivery.' },
] as const;
export type ManagerDepartmentId = typeof MANAGER_DEPARTMENTS[number]['id'];
export const MANAGER_DEMO_PASSWORD = 'manager123';
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
export function isOpen(status: string) { return !['completed', 'resolved', 'cancelled', 'closed', 'rejected', 'passed'].includes(status.toLowerCase()); }
export function managerTasks(s: DemoState, id: ManagerDepartmentId) {
  const unique = new Map<string, WorkItem>();
  // The departmental queue is authoritative for shared request references.
  for (const key of ['department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller', 'department_supervisor', 'department_manager'] as const)
    for (const item of s.items[key] ?? []) if (taskDepartment(item) === id && !unique.has(item.ref ?? item.id)) unique.set(item.ref ?? item.id, item);
  return [...unique.values()];
}
export function managerInspections(s: DemoState, id: ManagerDepartmentId) {
  return (s.inspections ?? []).filter(i => (departmentId(i.department) ?? (i.type === 'maintenance_check' ? 'engineering' : 'housekeeping')) === id);
}
export function managerNotifications(s: DemoState, id: ManagerDepartmentId) {
  const tasks = new Set(managerTasks(s, id).flatMap(t => [t.id, t.ref].filter(Boolean)));
  const inspections = new Set(managerInspections(s, id).map(i => i.id));
  return (s.notifications ?? []).filter(n => n.roleId === 'department_manager' && (departmentId(n.department) === id || !n.department && !!n.itemId && (tasks.has(n.itemId) || inspections.has(n.itemId))));
}
export function ensureManagerState(s: DemoState): DemoState {
  const next = { ...s, managerDepartment: s.managerDepartment ?? 'housekeeping' as const, staffAccounts: [...s.staffAccounts], items: { ...s.items }, inspections: [...(s.inspections ?? [])] };
  for (const d of MANAGER_DEPARTMENTS) {
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
  | { type: 'inspection'; location: string; instructions: string; supervisorId: string; inspectionId?: string }
  | { type: 'recovery'; taskId: string; decision: 'resolve' | 'escalate'; note: string }
  | { type: 'availability'; staffId: string; value: 'on_duty' | 'break' | 'off_duty' }
  | { type: 'handover'; incoming: string; notes: string }
  | { type: 'acknowledge'; handoverId: string }
  | { type: 'policy'; title: string; content: string }
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
  if (command.type === 'inspection') {
    const supervisor = scopedStaff(command.supervisorId);
    if (!['department_supervisor', 'department_dispatcher_supervisor'].includes(supervisor.roleId) || supervisor.status !== 'active') throw Error('Select an active department supervisor.');
    const instructions = required(command.instructions), location = required(command.location);
    if (command.inspectionId) {
      const inspection = managerInspections(s, d.id).find(i => i.id === command.inspectionId);
      if (!inspection || inspection.status !== 'pending') throw Error('Only pending inspections in your department can be assigned.');
      Object.assign(inspection, { assignedSupervisorId: supervisor.id, assignedSupervisorName: supervisor.name, instructions });
    } else {
      const inspection: SupervisorInspection = { id: uid, department: d.name, roomNumber: location, roomType: d.name, floor: Number(location[0]) || 1, attendantId: '', attendantName: 'Awaiting assignment', type: d.id === 'engineering' ? 'maintenance_check' : 'periodic', status: 'pending', priority: 'normal', completedAt: '', createdAt: now, initiatedBy: person, initiatedRole: 'department_manager', assignedSupervisorId: supervisor.id, assignedSupervisorName: supervisor.name, instructions, items: [{ id: `${uid}-standard`, category: 'Safety & Keycard', label: d.standard, passed: false }] };
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
    const staff = scopedStaff(command.staffId); staff.availability = command.value;
  } else if (command.type === 'handover') {
    const tasks = managerTasks(s, d.id).filter(t => isOpen(t.status));
    s.shiftHandovers = [{ id: uid, timestamp: now, outgoingManager: person, incomingManager: required(command.incoming), shift: 'Day', department: d.name, scope: 'My Department', outstandingTasksCount: tasks.length, unresolvedComplaintsCount: tasks.filter(t => /escalat|blocked/i.test(t.status)).length, criticalIncidentsCount: tasks.filter(t => t.priority === 'critical').length, notes: required(command.notes), priorityActions: tasks.slice(0, 5).map(t => t.title), status: 'submitted' }, ...(s.shiftHandovers ?? [])];
  } else if (command.type === 'acknowledge') {
    const handover = s.shiftHandovers?.find(h => h.id === command.handoverId && departmentId(h.department) === d.id);
    if (!handover || handover.outgoingManager === person || handover.incomingManager !== person) throw Error('Only the named incoming manager can acknowledge this handover.');
    handover.status = 'acknowledged'; handover.acknowledgedAt = now;
  } else if (command.type === 'policy') {
    s.departmentPolicies = [{ id: uid, department: d.name, title: required(command.title), category: 'Service Standard', summary: required(command.content), content: command.content.trim(), scope: d.name, policyOwner: person, escalationTarget: 'General Manager', effectiveDate: now.slice(0, 10), lastUpdated: now, isManagerLevel: true }, ...(s.departmentPolicies ?? [])];
  } else if (command.type === 'read') {
    if (!managerNotifications(s, d.id).some(n => n.id === command.notificationId)) throw Error('Notification unavailable in your department.');
    s.notifications = s.notifications?.map(n => n.id === command.notificationId ? { ...n, read: true } : n);
  } else if (command.type === 'profile') {
    s.managerProfiles = { ...s.managerProfiles, [d.id]: { name: required(command.name), phone: command.phone.slice(0, 40) } };
  }
  s.auditTrail = [{ id: uid, timestamp: now, actor: person, actorRole: 'Department Manager', action: command.type, category: 'Workflow', resource: d.name, outcome: 'success' }, ...s.auditTrail];
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
  for (const queue of ['department_manager', 'department_dispatcher', 'department_dispatcher_supervisor', 'task_fulfiller'] as const) s.items[queue] = (s.items[queue] ?? []).map(t => (t.ref || t.id) === item.linkedRef ? { ...t, status, history: [...(t.history ?? []), { at: now, status, note: `General Manager: ${note}` }] } : t);
  s.notifications = [{ id: uid, department: item.department, roleId: 'department_manager', title: `${status}: ${item.title}`, message: note, itemId: item.linkedRef, timestamp: now, read: false, type: 'alert' }, ...(s.notifications ?? [])];
  s.auditTrail = [{ id: uid, timestamp: now, actor: 'General Manager', actorRole: 'General Manager', action: status, category: 'Workflow', resource: item.department || '', outcome: 'success' }, ...s.auditTrail];
  return s;
}
