import { COMMON_ALLERGENS } from './dining-allergens.ts';
import { nextOperationalReference } from './operational-references.ts';
import { REPAIR_CATEGORIES } from './department-insights.ts';
import type { ComplaintStatus, DemoState, DietaryType, DiningMenuItem, InspectionCheckItem, InspectionType, ManagerMedicalCase, SupervisorInspection, WorkItem } from '../types/demo';
import { departmentId, isOpen, managerDepartment, managerTasks, type ManagerDepartmentId } from './manager-domain.ts';

export const INSPECTION_OPTIONS: Record<ManagerDepartmentId, { type: InspectionType; label: string; checks: string[] }[]> = {
  housekeeping: [
    { type: 'turnover', label: 'Turnover clean', checks: ['Inspect linen and bathroom cleanliness', 'Verify amenities and room presentation', 'Confirm guest access and room readiness'] },
    { type: 'deep_clean', label: 'Deep clean', checks: ['Inspect surfaces, upholstery and ventilation', 'Verify bathroom deep-clean checklist', 'Record remaining cleaning defects'] },
    { type: 'vip_prep', label: 'VIP room preparation', checks: ['Verify requested room setup', 'Inspect linen and amenities', 'Confirm final supervisor sign-off'] },
  ],
  wellness: [
    { type: 'periodic', label: 'Wellness hygiene & readiness', checks: ['Check treatment-area cleanliness and linen', 'Verify guest-care supplies and equipment readiness', 'Confirm operational follow-up ownership'] },
    { type: 'maintenance_check', label: 'Wellness equipment check', checks: ['Verify equipment condition and service records', 'Record equipment defects for Engineering', 'Confirm treatment-area readiness'] },
  ],
  engineering: [
    { type: 'maintenance_check', label: 'Equipment & systems', checks: ['Check equipment operation and reported faults', 'Review repair evidence and outstanding defects', 'Verify return-to-service clearance'] },
    { type: 'periodic', label: 'Repair verification', checks: ['Verify the reported repair at its location', 'Record unresolved defects or repeat faults', 'Confirm supervisor acceptance of completed work'] },
  ],
  'food-beverages': [
    { type: 'periodic', label: 'Food safety & hygiene', checks: ['Review the configured food-safety checks and logs', 'Verify allergen information and service instructions', 'Check kitchen and dining-area cleanliness'] },
    { type: 'turnover', label: 'Dining service readiness', checks: ['Check table setup and service equipment', 'Verify the current dining menu and availability', 'Confirm kitchen-to-service handoff readiness'] },
  ],
};
export const INSPECTION_AREAS: Record<ManagerDepartmentId, string[]> = {
  housekeeping: ['Main lobby', 'Public restrooms', 'Laundry'],
  wellness: ['Treatment room 1', 'Treatment room 2', 'Treatment room 3', 'Spa reception', 'Wellness facilities'],
  engineering: ['Plant room', 'Basement utilities', 'Main kitchen', 'Lifts & service areas', 'Hotel exterior'],
  'food-beverages': ['Main restaurant', 'Main kitchen', 'Bar', 'In-room dining service area'],
};
export const MENU_ALLERGENS = COMMON_ALLERGENS.map(allergen => allergen.id);
export type WorkflowCommand =
  | { type: 'medical-create'; guest: string; location: string; urgency: ManagerMedicalCase['urgency']; note: string; followUpAt?: string }
  | { type: 'medical-update'; caseId: string; urgency: ManagerMedicalCase['urgency']; status: ManagerMedicalCase['status']; note: string; followUpAt?: string; acknowledge?: boolean }
  | { type: 'task-update'; taskId: string; staffId: string; priority: NonNullable<WorkItem['priority']>; status: 'Assigned' | 'Unassigned' | 'In progress' | 'Blocked' | 'Completed'; note: string; photoUrl?: string; scheduledAt?: string }
  | { type: 'complaint-create'; guest: string; room: string; title: string; description: string; priority: 'normal' | 'urgent' | 'critical' }
  | { type: 'complaint-update'; reference: string; status: ComplaintStatus; note: string }
  | { type: 'repair-create'; title: string; location: string; priority: 'normal' | 'urgent' | 'critical'; technicianId?: string; note: string; repairCategory?: string }
  | { type: 'repair-update'; taskId: string; status: 'In progress' | 'Blocked' | 'Completed'; note: string; repairCategory?: string }
  | { type: 'repair-category'; taskId: string; repairCategory: string }
  | { type: 'menu-save'; menuId?: string; item: Pick<DiningMenuItem, 'name' | 'category' | 'cuisine' | 'price' | 'dietary' | 'image' | 'desc' | 'ingredients' | 'allergens' | 'isAvailable'> }
  | { type: 'menu-delete'; menuId: string }
  | { type: 'inspection-launch'; scope: 'room' | 'floor' | 'all'; location?: string; floor?: number; inspectionType: InspectionType; priority: 'normal' | 'urgent' | 'vip'; instructions: string; supervisorId: string; scheduledAt?: string };

export interface ManagerComplaint {
  reference: string; guest: string; room: string; title: string; description: string; status: string; priority: string; createdAt: string;
  history: Array<{ at: string; status: string; note?: string; actor?: string }>;
  resolvedAt?: string; resolvedBy?: string; resolution?: string;
}
export function managerComplaints(state: DemoState, department: ManagerDepartmentId): ManagerComplaint[] {
  const result = new Map<string, ManagerComplaint>();
  for (const c of state.guestComplaints ?? []) {
    if (departmentId(c.department) !== department && (c.department || departmentId(c.category) !== department)) continue;
    result.set(c.complaintId, { reference: c.complaintId, guest: c.guestName, room: c.room, title: c.title, description: c.description, status: c.status, priority: 'normal', createdAt: c.submittedAt, history: c.history, resolvedAt: c.resolvedAt, resolvedBy: c.resolvedBy, resolution: c.responseRemarks });
  }
  for (const c of state.frontDesk?.complaints ?? []) {
    if (departmentId(c.department) !== department && (c.department || departmentId(c.category) !== department)) continue;
    const guest = result.get(c.ref);
    result.set(c.ref, { reference: c.ref, guest: c.guestName || c.guest, room: c.room, title: guest?.title || c.summary, description: guest?.description || c.description || c.summary, status: c.status || guest?.status || 'Submitted', priority: c.priority || (c.severity === 'critical' ? 'critical' : c.severity === 'vip' ? 'urgent' : 'normal'), createdAt: guest?.createdAt || c.createdAt, resolvedAt: c.resolvedAt || guest?.resolvedAt, resolvedBy: c.resolvedBy || guest?.resolvedBy, resolution: c.responseRemarks || guest?.resolution, history: guest?.history || c.history || (c.responseRemarks ? [{ at: c.createdAt, status: c.status || 'Under Review', note: c.responseRemarks }] : []) });
  }
  return [...result.values()];
}
export function managerRepairs(state: DemoState) {
  return managerTasks(state, 'engineering').filter(task => task.category === 'maintenance' || !/^(REC-|ESC-|CMP-|GC-|INC-)/.test(task.ref || '') && !/complaint|service recovery/i.test(task.title));
}
export function managerOrders(state: DemoState) {
  return managerTasks(state, 'food-beverages').filter(task => !!task.orderLines?.length || /^(DIN|FB|ORD)-/.test(task.ref || ''));
}
export function medicalReminders(state: DemoState, now: number) {
  return (state.managerOperations?.medicalCases ?? []).filter(c => c.status !== 'closed' && c.followUpAt && Date.parse(c.followUpAt) <= now && (!c.followUpAcknowledgedAt || Date.parse(c.followUpAcknowledgedAt) < Date.parse(c.followUpAt)));
}
export function inspectionTargets(state: DemoState, department: ManagerDepartmentId, input: { scope: 'room' | 'floor' | 'all'; location?: string; floor?: number }) {
  const rooms = state.frontDesk?.rooms ?? [];
  if (input.scope === 'room') {
    const room = rooms.find(r => r.no === input.location);
    if (room) return [{ location: room.no, floor: room.floor }];
    if (INSPECTION_AREAS[department].includes(input.location || '')) return [{ location: input.location!, floor: 0 }];
    throw Error('Choose an existing room or a listed department service area.');
  }
  if (!['floor', 'all'].includes(input.scope)) throw Error('Choose a valid inspection scope.');
  const selected = input.scope === 'floor' ? rooms.filter(r => r.floor === input.floor) : rooms;
  if (!selected.length) throw Error('No rooms are available in this inspection scope.');
  return selected.map(r => ({ location: r.no, floor: r.floor }));
}

export function applyManagerWorkflow(s: DemoState, c: WorkflowCommand, uid: string, now: string) {
  const d = managerDepartment(s.managerDepartment), person = s.managerProfiles?.[d.id]?.name || d.person;
  const text = (v: string, max = 2000) => { if (!v.trim() || v.length > max) throw Error(`Enter a value between 1 and ${max} characters.`); return v.trim(); };
  const only = (id: ManagerDepartmentId) => { if (d.id !== id) throw Error('This feature is outside your department.'); };
  const notify = (title: string, itemId: string, roleId: 'department_manager' | 'department_dispatcher_supervisor' = 'department_manager') => { s.notifications = [{ id: `${uid}-notice`, roleId, department: d.name, title, message: `${person} updated a ${d.name} record.`, itemId, timestamp: now, read: false, type: 'task' }, ...(s.notifications ?? [])]; };
  const technician = (id?: string) => {
    if (!id) return undefined;
    const member = s.staffAccounts.find(st => (st.id === id || st.employeeId === id) && departmentId(st.department) === 'engineering' && st.roleId === 'task_fulfiller' && st.status === 'active' && !['break', 'off_duty'].includes(st.availability || 'on_duty'));
    if (!member) throw Error('Choose an available Engineering technician.');
    return member;
  };
  const syncTask = (ref: string, update: Partial<WorkItem>) => { for (const key of Object.keys(s.items) as (keyof DemoState['items'])[]) s.items[key] = s.items[key].map(t => (t.ref || t.id) === ref ? { ...t, ...update } : t); };
  if (c.type === 'task-update') {
    const task = managerTasks(s, d.id).find(item => item.id === c.taskId && !item.managerEscalation && !/^ESC-/.test(item.ref || ''));
    if (!task || !isOpen(task.status)) throw Error('Open request unavailable.');
    if (!['low', 'normal', 'high', 'vip', 'urgent', 'critical', 'safety'].includes(c.priority)) throw Error('Choose a listed priority.');
    if (!['Assigned', 'Unassigned', 'In progress', 'Blocked', 'Completed'].includes(c.status)) throw Error('Choose a listed status.');
    const staff = c.staffId ? s.staffAccounts.find(member => [member.id, member.employeeId].includes(c.staffId) && departmentId(member.department) === d.id && member.roleId === 'task_fulfiller' && member.status === 'active') : undefined;
    const keep = c.staffId === 'keep';
    if (c.staffId && !staff && !keep) throw Error('Choose an active fulfiller from your department.');
    const assignee = keep ? task.assignee : staff?.name;
    const assigneeId = keep ? task.assigneeId : staff?.id;
    const status = ['Assigned', 'Unassigned'].includes(c.status) ? assignee ? 'Assigned' : 'Unassigned' : c.status;
    if (status === 'Blocked') text(c.note);
    if (c.scheduledAt && !Number.isFinite(Date.parse(c.scheduledAt))) throw Error('Choose a valid scheduled date and time.');
    if (c.photoUrl && !/^https?:\/\//i.test(c.photoUrl)) throw Error('Enter a valid photo URL.');
    if (status === 'Completed' && task.evidenceRequired && !c.photoUrl && !task.photoUrl) throw Error('Attach a completion photo for this request.');
    const update = {
      status, priority: c.priority, assignee, assigneeId,
      assignedAt: assignee && assignee !== task.assignee ? now : assignee ? task.assignedAt : undefined,
      scheduledAt: c.scheduledAt,
      blockerReason: status === 'Blocked' ? c.note.trim() : undefined,
      ...(status === 'Completed' && c.photoUrl ? { photoUrl: c.photoUrl, photoAttached: true } : {}),
      history: [...(task.history ?? []), { at: now, status, actor: person, note: c.note.trim() || (assignee ? 'Owner: ' + assignee : 'Request updated') }],
    };
    const reference = task.ref || task.id;
    syncTask(reference, update);
    if (assignee && !s.items.task_fulfiller.some(item => (item.ref || item.id) === reference)) {
      s.items.task_fulfiller.unshift({ ...task, ...update, id: uid });
    }
    notify('Request updated', task.id, 'department_dispatcher_supervisor');
  } else if (c.type === 'medical-create' || c.type === 'medical-update') {
    only('wellness');
    if (!['routine', 'urgent', 'critical'].includes(c.urgency)) throw Error('Choose a listed urgency.');
    const note = text(c.note);
    if (c.followUpAt && !Number.isFinite(Date.parse(c.followUpAt))) throw Error('Choose a valid follow-up time.');
    const cases = s.managerOperations!.medicalCases ??= [];
    if (c.type === 'medical-create') {
      const reference = nextOperationalReference(s, 'INC', c.location, now);
      cases.unshift({ id: uid, reference, guest: text(c.guest, 100), location: text(c.location, 100), urgency: c.urgency, status: 'open', createdAt: now, followUpAt: c.followUpAt, history: [{ at: now, author: person, note }] });
    } else {
      const record = cases.find(item => item.id === c.caseId);
      if (!record) throw Error('Medical case unavailable.');
      if (!['open', 'monitoring', 'closed'].includes(c.status)) throw Error('Choose a listed case status.');
      Object.assign(record, { urgency: c.urgency, status: c.status, followUpAt: c.followUpAt, followUpAcknowledgedAt: c.acknowledge ? now : record.followUpAcknowledgedAt });
      record.history.push({ at: now, author: person, note });
    }
    // Medical narratives stay in the Wellness case history, outside shared task and audit text.
  } else if (c.type === 'complaint-create') {
    if (!['normal', 'urgent', 'critical'].includes(c.priority)) throw Error('Choose a listed complaint priority.');
    const title = text(c.title, 160), description = text(c.description), room = text(c.room, 100), guest = text(c.guest, 100);
    const reference = nextOperationalReference(s, 'GC', room, now);
    const category = d.id === 'housekeeping' ? 'Housekeeping' : d.id === 'engineering' ? 'Maintenance' : d.id === 'food-beverages' ? 'Food and Dining' : 'Other';
    s.guestComplaints = [{ id: uid, complaintId: reference, department: d.name, guestName: guest, room, category, title, description, status: 'Submitted', assignedTo: person, submittedAt: now, history: [{ at: now, status: 'Submitted', actor: person, note: description }] }, ...(s.guestComplaints ?? [])];
    if (s.frontDesk) s.frontDesk.complaints.unshift({ id: `cc-${uid}`, ref: reference, department: d.name, room, guest, summary: title, description, category, priority: c.priority, severity: c.priority === 'critical' ? 'critical' : 'normal', comp: 0, compApplied: false, createdAt: now, status: 'Submitted', history: [{ at: now, status: 'Submitted', actor: person, note: description }] });
    const task: WorkItem = { id: uid, ref: reference, title: `Guest complaint · ${title}`, meta: `${room} · ${guest}`, description, department: d.name, status: 'Open', priority: c.priority, createdAt: now, room, guest: true };
    s.items.department_manager.unshift(task);
    s.items.department_dispatcher_supervisor.unshift({ ...task, id: `${uid}-dispatch` });
    notify('Guest complaint assigned to your department', uid, 'department_dispatcher_supervisor');
  } else if (c.type === 'complaint-update') {
    if (!managerComplaints(s, d.id).some(item => item.reference === c.reference)) throw Error('Complaint unavailable in your department.');
    if (!['Under Review', 'In Progress', 'Resolved'].includes(c.status)) throw Error('Choose a listed complaint status.');
    const note = text(c.note);
    for (const record of s.guestComplaints ?? []) if (record.complaintId === c.reference) {
      record.department = d.name; record.status = c.status; record.responseRemarks = note; record.resolvedAt = c.status === 'Resolved' ? now : undefined; record.resolvedBy = c.status === 'Resolved' ? person : undefined;
      record.history.push({ at: now, status: c.status, note, actor: person });
    }
    for (const record of s.frontDesk?.complaints ?? []) if (record.ref === c.reference) { record.department = d.name; record.status = c.status; record.responseRemarks = note; record.resolvedAt = c.status === 'Resolved' ? now : undefined; record.resolvedBy = c.status === 'Resolved' ? person : undefined; record.history = [...(record.history ?? []), { at: now, status: c.status, note, actor: person }]; }
    syncTask(c.reference, { status: c.status === 'Resolved' ? 'Resolved' : c.status, notes: note });
    notify(`Complaint ${c.status.toLowerCase()}`, c.reference);
  } else if (c.type === 'repair-category') {
    only('engineering');
    if (!REPAIR_CATEGORIES.includes(c.repairCategory as typeof REPAIR_CATEGORIES[number])) throw Error('Choose a listed repair category.');
    const task = managerRepairs(s).find(t => t.id === c.taskId);
    if (!task) throw Error('Repair unavailable.');
    syncTask(task.ref || task.id, { repairCategory: c.repairCategory, history: [...(task.history || []), { at: now, status: task.status, actor: person, note: 'Category: ' + c.repairCategory }] });
  } else if (c.type === 'repair-create' || c.type === 'repair-update') {
    only('engineering');
    const note = text(c.note), member = c.type === 'repair-create' ? technician(c.technicianId) : undefined;
    if (c.repairCategory && !REPAIR_CATEGORIES.includes(c.repairCategory as typeof REPAIR_CATEGORIES[number])) throw Error('Choose a listed repair category.');
    if (c.type === 'repair-create') {
      if (!['normal', 'urgent', 'critical'].includes(c.priority)) throw Error('Choose a listed repair priority.');
      const task: WorkItem = { id: uid, ref: nextOperationalReference(s, 'REP', c.location, now), title: text(c.title, 160), location: text(c.location, 150), room: s.frontDesk?.rooms?.find(room => room.no === c.location.trim().replace(/^Room\s+/i, ''))?.no, meta: c.location.trim(), department: d.name, category: 'maintenance', repairCategory: c.repairCategory || 'Other', status: member ? 'Assigned' : 'Unassigned', priority: c.priority, assignee: member?.name, assigneeId: member?.id, createdAt: now, description: note, history: [{ at: now, status: member ? 'Assigned' : 'Unassigned', actor: person, note }] };
      for (const key of ['department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'] as const) s.items[key].unshift({ ...task, id: key === 'task_fulfiller' ? `${uid}-fulfiller` : uid });
      notify('Hotel repair logged', uid, 'department_dispatcher_supervisor');
    } else {
      const task = managerRepairs(s).find(t => t.id === c.taskId);
      if (!task || !isOpen(task.status)) throw Error('Open repair unavailable.');
      if (!['In progress', 'Blocked', 'Completed'].includes(c.status)) throw Error('Choose a listed repair status.');
      syncTask(task.ref || task.id, { repairCategory: c.repairCategory || task.repairCategory, status: c.status, history: [...(task.history ?? []), { at: now, status: c.status, actor: person, note }], notes: note });
      notify(`Repair ${c.status.toLowerCase()}`, task.id, 'department_dispatcher_supervisor');
    }
  } else if (c.type === 'menu-save' || c.type === 'menu-delete') {
    only('food-beverages');
    const item = c.menuId ? s.diningMenu?.find(item => item.id === c.menuId) : undefined;
    if (c.menuId && !item) throw Error('Menu item unavailable.');
    if (c.type === 'menu-delete') s.diningMenu = s.diningMenu?.filter(item => item.id !== c.menuId);
    else {
      const value = c.item;
      if (!Number.isFinite(value.price) || value.price < 0 || value.price > 1000000) throw Error('Enter a valid menu price.');
      if (!['veg', 'non_veg', 'vegan'].includes(value.dietary) || value.allergens.some(a => !MENU_ALLERGENS.includes(a))) throw Error('Choose listed dietary and allergen values.');
      if (value.image && !/^https:\/\//i.test(value.image)) throw Error('Use an HTTPS image URL.');
      const updates = { ...value, name: text(value.name, 150), category: text(value.category, 80), cuisine: value.cuisine ? text(value.cuisine, 80) : item?.cuisine, desc: value.desc?.slice(0, 1000), ingredients: value.ingredients.map(v => text(v, 120)) };
      if (item) Object.assign(item, updates);
      else s.diningMenu = [{ ...updates, id: uid }, ...(s.diningMenu ?? [])];
      s.diningCategories = [...new Set([...(s.diningCategories ?? []), updates.category])];
    }
  } else if (c.type === 'inspection-launch') {
    const supervisor = s.staffAccounts.find(st => st.id === c.supervisorId && departmentId(st.department) === d.id && st.status === 'active' && ['department_supervisor', 'department_dispatcher_supervisor'].includes(st.roleId));
    if (!supervisor) throw Error('Select an active supervisor in your department.');
    const template = INSPECTION_OPTIONS[d.id].find(t => t.type === c.inspectionType);
    if (!template || !['normal', 'urgent', 'vip'].includes(c.priority)) throw Error('Choose a listed department inspection type and priority.');
    const targets = inspectionTargets(s, d.id, c);
    const instructions = c.instructions.trim() ? text(c.instructions) : d.standard;
    if (c.scheduledAt && !Number.isFinite(Date.parse(c.scheduledAt))) throw Error('Choose a valid inspection date and time.');
    const inspections: SupervisorInspection[] = targets.map((target, index) => ({ id: `${uid}-${index + 1}`, ref: nextOperationalReference(s, 'INS', target.location, now), scheduledAt: c.scheduledAt, batchId: uid, scope: c.scope, department: d.name, roomNumber: target.location, floor: target.floor, roomType: d.name, type: c.inspectionType, typeLabel: template.label, status: 'pending', priority: c.priority, attendantId: '', attendantName: 'Department inspection', createdAt: now, completedAt: '', initiatedBy: person, initiatedRole: 'department_manager', assignedSupervisorId: supervisor.id, assignedSupervisorName: supervisor.name, instructions, items: template.checks.map((label, n) => ({ id: `${uid}-${index}-${n}`, category: d.id === 'engineering' ? 'Electronics & Climate' : 'Safety & Keycard', label, passed: false })) }));
    s.inspections = [...inspections, ...(s.inspections ?? [])];
    notify(`${targets.length} ${d.name} inspection${targets.length === 1 ? '' : 's'} assigned`, inspections[0].id, 'department_dispatcher_supervisor');
  }
}

export function reviewDepartmentInspection(state: DemoState, id: string, decision: 'passed' | 'reopened', notes: string, checks?: InspectionCheckItem[]) {
  const s = structuredClone(state), inspection = s.inspections?.find(i => i.id === id);
  const department = departmentId(inspection?.department);
  if (!inspection || !department || !['department_dispatcher_supervisor', 'department_supervisor'].includes(s.persona || '') || departmentId(s.activeDispatcherDept) !== department) throw Error('Open the assigned supervisor department to review this inspection.');
  if (!inspection.assignedSupervisorId || !s.staffAccounts.some(st => st.id === inspection.assignedSupervisorId && departmentId(st.department) === department && st.status === 'active')) throw Error('An active department supervisor must be assigned.');
  if (!['pending', 'reopened'].includes(inspection.status)) throw Error('This inspection is already closed.');
  if (decision === 'passed' && (!checks || checks.length !== inspection.items.length || inspection.items.some(item => !checks.some(c => c.id === item.id && c.passed)))) throw Error('Complete every department checklist item before approval.');
  if (decision === 'reopened' && !notes.trim()) throw Error('Record the inspection findings.');
  const now = new Date().toISOString();
  Object.assign(inspection, { status: decision, inspectedBy: inspection.assignedSupervisorName, inspectedAt: now, notes, score: decision === 'passed' ? 100 : undefined, items: decision === 'passed' ? checks : inspection.items, completedAt: decision === 'passed' ? now : '', reopenReason: decision === 'reopened' ? notes : undefined });
  // Only a housekeeping inspection can release an actual room, and never clear an engineering hold.
  if (department === 'housekeeping') for (const room of s.frontDesk?.rooms ?? []) if (room.no === inspection.roomNumber && room.readiness !== 'out_of_order') room.readiness = decision === 'passed' ? 'ready' : 'inspection_failed';
  s.notifications = [{ id: `review-${id}-${now}`, roleId: 'department_manager', department: inspection.department, title: `Inspection ${decision}: ${inspection.roomNumber}`, message: `${inspection.assignedSupervisorName} recorded the inspection outcome.`, itemId: id, timestamp: now, read: false, type: 'task' }, ...(s.notifications ?? [])];
  s.auditTrail.unshift({ id: `review-${id}-${now}`, timestamp: now, actor: inspection.assignedSupervisorName || 'Department supervisor', actorRole: 'Department Supervisor', action: `Inspection ${decision}`, category: 'Workflow', resource: id, outcome: 'success' });
  return s;
}
