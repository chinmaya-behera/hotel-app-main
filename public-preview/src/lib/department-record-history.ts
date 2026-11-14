import type { DemoState, DepartmentRecordEvent, DepartmentRecordKind, DepartmentRecordSnapshot, WorkItem } from '../types/demo';
import { departmentId, taskDepartment } from './manager-domain.ts';

export const RECORD_KINDS: Record<DepartmentRecordKind, string> = {
  schedule: 'Shift schedules', repair: 'Repairs', task: 'Department tasks', order: 'Dining orders', medical: 'Medical cases', complaint: 'Complaints', inspection: 'Inspections',
  menu: 'Dining menu', stock: 'Stock counts', asset: 'Asset service', room: 'Room readiness', handover: 'Handovers', policy: 'Policies', staff: 'Staff availability', supplies: 'Supply requests',
};
const iso = (value?: string) => value && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : undefined;
const text = (value: unknown) => value === undefined || value === null || value === '' ? 'Not recorded' : typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value);
const timeline = (entries: Array<{ at: string; status?: string; note?: string; actor?: string; author?: string }> = []) => entries.map(entry => [entry.at, entry.actor || entry.author, entry.status, entry.note].filter(Boolean).join(' · ')).join('\n');
export const completedRecord = (status: string) => /^(completed|delivered|resolved|closed|passed|acknowledged|serviced)$/i.test(status);
export const completedSnapshot = (record: DepartmentRecordSnapshot) => completedRecord(record.status) || record.kind === 'room' && record.status === 'ready';

/** Only operational fields enter this department-scoped journal; no credentials or billing data. */
export function departmentRecordSnapshots(state: DemoState): Map<string, DepartmentRecordSnapshot> {
  const records = new Map<string, DepartmentRecordSnapshot>();
  const add = (department: DepartmentRecordSnapshot['department'] | undefined, kind: DepartmentRecordKind, reference: string, title: string, status: string, fields: Record<string, unknown>, location = '', owner = '', notes = '', completedAt?: string) => {
    if (!department) return;
    const key = `${department}:${kind}:${reference}`;
    records.set(key, { key, department, kind, reference, title, status, location, owner, notes, completedAt: iso(completedAt), fields: Object.fromEntries(Object.entries({ Title: title, Status: status, Location: location, 'Assigned / responsible': owner, ...fields }).map(([label, value]) => [label, text(value)])) });
  };
  const tasks = new Map<string, WorkItem>();
  for (const queue of ['department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller', 'department_supervisor', 'department_manager'] as const)
    for (const item of state.items[queue] || []) if (!item.demoSource && !tasks.has(item.ref || item.id)) tasks.set(item.ref || item.id, item);
  for (const item of tasks.values()) {
    const department = taskDepartment(item);
    const kind = item.orderLines?.length || /^(DIN|FB|ORD)-/.test(item.ref || '') ? 'order' : department === 'engineering' && (item.category === 'maintenance' || !/^(REC-|ESC-|CMP-|GC-|INC-)/.test(item.ref || '') && !/complaint|service recovery/i.test(item.title)) ? 'repair' : 'task';
    const completion = [...(item.history || [])].reverse().find(entry => completedRecord(entry.status));
    const notes = item.notes || item.note || completion?.note || item.description || '';
    add(department, kind, item.ref || item.id, item.title, item.status, {
      Created: item.serviceTiming?.createdAt || item.orderedAt || item.createdAt, 'Acknowledged at': item.serviceTiming?.acknowledgedAt, 'Completed at': item.serviceTiming?.completedAt, 'SLA policy': item.serviceTiming?.policySource, Priority: item.priority, Category: item.repairCategory || item.category,
      Description: item.description, 'Progress / completion notes': notes, 'Status and note history': timeline(item.history),
      'Photo evidence attached': !!item.photoUrl,
      ...(item.orderLines?.length ? { 'Ordered dishes': item.orderLines.map(line => `${line.qty} × ${line.name} · ${line.price}`).join('\n'), 'Service feedback': item.feedback ? `${item.feedback.rating}/5 · ${item.feedback.comment || ''}` : '', 'Dish feedback': Object.entries(item.dishFeedback || {}).map(([id, review]) => `${item.orderLines?.find(line => line.itemId === id)?.dishName || id}: ${review.rating}/5 · ${review.comment || ''}`).join('\n') } : {}),
    }, item.location || item.room || item.meta, item.assignee || '', notes, completion?.at);
  }
  const complaints = new Map<string, { department?: string; room: string; title: string; status: string; guest: string; description?: string; response?: string; resolvedAt?: string; history?: Parameters<typeof timeline>[0] }>();
  for (const record of state.frontDesk?.complaints || []) complaints.set(record.ref, { department: record.department || record.category, room: record.room, title: record.summary, status: record.status || 'Submitted', guest: record.guest, description: record.description, response: record.responseRemarks, history: record.history });
  for (const record of state.guestComplaints || []) complaints.set(record.complaintId, { department: record.department || record.category, room: record.room, title: record.title, status: record.status, guest: record.guestName, description: record.description, response: record.responseRemarks, resolvedAt: record.resolvedAt, history: record.history });
  for (const [ref, record] of complaints) add(departmentId(record.department), 'complaint', ref, record.title, record.status, { Guest: record.guest, Description: record.description, 'Response / resolution': record.response, History: timeline(record.history) }, record.room, '', record.response || '', record.resolvedAt);
  for (const record of state.managerOperations?.medicalCases || []) add('wellness', 'medical', record.reference, record.guest, record.status, { Urgency: record.urgency, 'Follow-up due': record.followUpAt, 'Follow-up acknowledged': record.followUpAcknowledgedAt, 'Private case notes': timeline(record.history) }, record.location, record.history.at(-1)?.author || '', record.history.at(-1)?.note || '');
  for (const record of state.inspections || []) add(departmentId(record.department) || (record.type === 'maintenance_check' ? 'engineering' : 'housekeeping'), 'inspection', record.ref || record.id, `${record.typeLabel || record.type} · ${record.roomNumber}`, record.status, { Type: record.typeLabel || record.type, Scope: record.scope, Scheduled: record.scheduledAt, Supervisor: record.assignedSupervisorName, Instructions: record.instructions, Checklist: record.items.map(item => `${item.passed ? 'Passed' : 'Pending'} · ${item.label}`).join('\n'), Findings: record.findings || record.notes, 'Reopen reason': record.reopenReason, Score: record.score }, record.roomNumber, record.assignedSupervisorName || record.inspectedBy || '', record.findings || record.notes || '', record.completedAt || record.inspectedAt);
  for (const record of state.diningMenu || []) add('food-beverages', 'menu', record.id, record.name, record.isAvailable ? 'Available' : 'Unavailable', { Price: record.price, Cuisine: record.cuisine, Category: record.category, Dietary: record.dietary, Ingredients: record.ingredients.join(', '), Allergens: record.allergens.join(', '), Description: record.desc });
  for (const record of state.managerOperations?.stock || []) add(departmentId(record.department), 'stock', record.id, record.name, 'Count recorded', { Quantity: record.onHand, Unit: record.unit, Target: record.par, 'Last counted': record.lastCountedAt, Requisition: record.requisitionId });
  for (const record of state.managerOperations?.assets || []) add('engineering', 'asset', record.id, record.name, record.lastServiced ? 'Serviced' : 'Scheduled', { 'Last serviced': record.lastServiced, 'Next due': record.nextDue, 'Service interval (days)': record.intervalDays, 'Work order': record.workOrderRef }, record.location, '', '', record.lastServiced);
  for (const record of state.frontDesk?.rooms || []) add('housekeeping', 'room', record.no, `Room ${record.no}`, record.readiness, { 'Do not disturb': record.dnd || state.guestPreferences?.[record.no]?.dnd || false, Floor: record.floor }, record.no);
  for (const record of state.shiftHandovers || []) add(departmentId(record.department), 'handover', record.id, `Handover to ${record.incomingManager}`, record.status, { Outgoing: record.outgoingManager, Incoming: record.incomingManager, Notes: record.notes, 'Outstanding tasks': record.outstandingTasksCount, 'Priority actions': record.priorityActions.join('\n'), Acknowledged: record.acknowledgedAt }, '', record.outgoingManager, record.notes, record.acknowledgedAt);
  for (const record of state.departmentPolicies || []) add(departmentId(record.department), 'policy', record.id, record.title, 'Published', { Content: record.content || record.summary, Owner: record.policyOwner, 'Effective date': record.effectiveDate, 'Last updated': record.lastUpdated }, '', record.policyOwner);
  for (const record of state.staffAccounts || []) add(departmentId(record.department), 'staff', record.id, record.name, record.status, { Availability: record.availability, Role: record.roleId, Shift: record.shift, Zone: record.floorZone }, '', record.name);
  for (const record of state.shiftSchedules || []) add(departmentId(record.department), 'schedule', record.id, record.employeeName + ' · ' + record.date, record.status, { Date: record.date, Shift: record.status === 'off' ? 'Off' : record.status === 'leave' ? 'Leave' : record.shiftType, Start: record.startTime, End: record.endTime, Reason: record.notes }, record.floorZone, record.employeeName, record.notes || '');
  for (const [department, targets] of Object.entries(state.departmentServiceTargets || {})) if (targets) add(department as DepartmentRecordSnapshot['department'], 'policy', 'service-targets-' + department, 'Department service targets', 'Published', { 'Complaint target (minutes)': targets.complaintMinutes, 'Inspection target (minutes)': targets.inspectionMinutes });
  for (const record of state.resourceRequests || []) add(departmentId(record.department), 'supplies', record.id, record.title, record.status, { Details: record.details, Urgency: record.urgency, 'Requested at': record.requestedAt }, '', record.requestedBy, record.details);
  return records;
}

export function initialiseDepartmentHistory(state: DemoState, now = new Date().toISOString()): DemoState {
  const history = state.departmentRecordHistory || [], known = new Set(history.map(event => event.record.key));
  const additions = [...departmentRecordSnapshots(state).values()].filter(record => !known.has(record.key)).map((record, index): DepartmentRecordEvent => ({
    id: `record-${history.length + index + 1}`, recordedAt: now, actor: 'Existing hotel record', actorRole: 'Imported record', action: 'recorded', record, changes: [],
  }));
  return { ...state, departmentRecordHistory: [...history, ...additions] };
}

export function captureDepartmentHistory(previous: DemoState, next: DemoState, now = new Date().toISOString()): DemoState {
  if (previous === next) return previous;
  const base = previous.departmentRecordHistory || initialiseDepartmentHistory(previous, now).departmentRecordHistory!;
  if (['items', 'frontDesk', 'managerOperations', 'inspections', 'diningMenu', 'shiftHandovers', 'departmentPolicies', 'staffAccounts', 'resourceRequests', 'guestComplaints', 'guestPreferences', 'shiftSchedules', 'departmentServiceTargets'].every(key => previous[key as keyof DemoState] === next[key as keyof DemoState])) return { ...next, departmentRecordHistory: base };
  const before = departmentRecordSnapshots(previous), after = departmentRecordSnapshots(next);
  const audit = next.auditTrail?.find(event => !previous.auditTrail?.some(old => old.id === event.id));
  const department = previous.managerDepartment || 'housekeeping';
  const managerName = previous.managerProfiles?.[department]?.name || { housekeeping: 'Ananya Rao', wellness: 'Leena Kapoor', engineering: 'Arjun Mehta', 'food-beverages': 'Vikram Joshi' }[department];
  const actorRole = audit?.actorRole || (previous.persona || 'Guest / service automation').replaceAll('_', ' ');
  const actor = audit?.actor || (previous.persona === 'department_manager' ? managerName : actorRole);
  const latest = new Map(base.map(event => [event.record.key, event]));
  const additions: DepartmentRecordEvent[] = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const old = before.get(key), current = after.get(key);
    if (JSON.stringify(old) === JSON.stringify(current)) continue;
    const raw = current || old!;
    const fields = new Set([...Object.keys(old?.fields || {}), ...Object.keys(current?.fields || {})]);
    const changes = [...fields].filter(field => old?.fields[field] !== current?.fields[field]).map(field => ({ field, before: old?.fields[field] || 'Not recorded', after: current?.fields[field] || 'Removed' }));
    const terminal = completedSnapshot(raw);
    const action = !current ? 'deleted' : !old ? terminal ? 'completed' : 'created' : terminal && (!completedSnapshot(old) || raw.kind === 'asset' && old.completedAt !== current.completedAt) ? 'completed' : completedSnapshot(old) && !terminal ? 'reopened' : 'updated';
    const record = structuredClone(raw);
    if (action === 'completed') record.completedAt = record.completedAt || now;
    else if (terminal) record.completedAt = latest.get(key)?.record.completedAt || record.completedAt;
    additions.push({ id: `record-${base.length + additions.length + 1}`, recordedAt: now, actor, actorRole, action, record, changes });
  }
  return { ...next, departmentRecordHistory: [...base, ...additions] };
}

export function departmentHistory(state: DemoState, department: DepartmentRecordSnapshot['department']) {
  return (state.departmentRecordHistory || []).filter(event => event.record.department === department).toReversed();
}
export function repairCompletion(state: DemoState, reference: string) {
  return departmentHistory(state, 'engineering').find(event => event.record.kind === 'repair' && event.record.reference === reference && (event.action === 'completed' || event.action === 'recorded' && completedRecord(event.record.status)));
}

/** Saved rows win over seed examples, so a reload cannot undo completed work. */
export function restoreDepartmentQueue(seed: WorkItem[], saved?: WorkItem[]): WorkItem[] {
  if (!saved) return seed;
  const known = new Map(seed.map(item => [item.id, item]));
  const savedIds = new Set(saved.map(item => item.id));
  return [...saved.map(item => ({ ...known.get(item.id), ...item })), ...seed.filter(item => !savedIds.has(item.id))];
}
