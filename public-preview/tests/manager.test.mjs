import { formatReferenceNumber } from '../src/lib/utils.ts';
import { migrateOperationalReferences } from '../src/lib/operational-references.ts';
import { managerEscalations } from '../src/lib/manager-domain.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MANAGER_DEPARTMENTS, applyManagerCommand, departmentId, ensureManagerState, managerTasks, managerInspections, managerNotifications, managerSafetyAlerts, reviewManagerEscalation, managerDepartmentFromEmail } from '../src/lib/manager-domain.ts';
import { INSPECTION_OPTIONS, managerComplaints, managerRepairs, medicalReminders, reviewDepartmentInspection, managerOrders } from '../src/lib/manager-workflows.ts';

function fixture(department = 'housekeeping') {
  return ensureManagerState({ persona: 'department_manager', managerDepartment: department, staffAccounts: [], inspections: [], notifications: [], auditTrail: [], items: Object.fromEntries(['task_fulfiller', 'department_dispatcher', 'department_supervisor', 'department_dispatcher_supervisor', 'department_manager', 'front_desk_coordinator', 'financial_operator', 'security_responder', 'executive_viewer', 'general_manager', 'platform_admin'].map(r => [r, []])) });
}
const command = (s, c, id = 'test-command') => applyManagerCommand(s, c, id, '2026-11-04T12:00:00.000Z');

test('all manager inboxes show published staff safety alerts without drafts or duplicate broadcast notifications', () => {
  const state = fixture();
  state.safetyAlerts = [
    { id: 'past', status: 'resolved', broadcastAt: 'Today, 08:00', broadcastScope: 'hotel_wide' },
    { id: 'staff', status: 'broadcast_active', broadcastScope: 'all_staff', priority: 'warning' },
    { id: 'hotel', status: 'broadcast_active', broadcastScope: 'hotel_wide', priority: 'urgent' },
    { id: 'security', status: 'broadcast_active', broadcastScope: 'security_only' },
    { id: 'draft', status: 'draft_pending_validation', broadcastScope: 'all_staff' },
    { id: 'pending', status: 'validated_pending_approval', broadcastScope: 'all_staff' },
    { id: 'approved', status: 'approved_ready_broadcast', broadcastScope: 'all_staff' },
    { id: 'not-broadcast', status: 'resolved', broadcastScope: 'hotel_wide' },
  ];
  for (const department of MANAGER_DEPARTMENTS) {
    state.managerDepartment = department.id;
    state.notifications.push(
      { id: department.id, roleId: 'department_manager', department: department.name, title: 'Task assigned', read: false },
      { id: `${department.id}-broadcast`, roleId: 'department_manager', department: department.name, title: '🚨 SAFETY ALERT BROADCAST: Test alert', read: false },
    );
    assert.deepEqual(managerSafetyAlerts(state).map(alert => alert.id), ['hotel', 'staff', 'past']);
    assert.deepEqual(managerNotifications(state, department.id).map(notice => notice.id), [department.id]);
  }
});

test('all four demo identities have unique email addresses and department IDs', () => {
  assert.equal(MANAGER_DEPARTMENTS.length, 4);
  assert.equal(new Set(MANAGER_DEPARTMENTS.map(d => d.email)).size, 4);
  for (const d of MANAGER_DEPARTMENTS) assert.equal(departmentId(d.name), d.id);
});
test('exact manager emails do not collide with dispatcher department names', () => {
  for (const department of MANAGER_DEPARTMENTS) assert.equal(managerDepartmentFromEmail(department.email), department.id);
  assert.equal(managerDepartmentFromEmail(' WELLNESS.MANAGER@THEGRANDADP.COM '), 'wellness');
  assert.equal(managerDepartmentFromEmail('manager@thegrandadp.com'), 'housekeeping');
  for (const email of ['wellness@thegrandadp.com', 'housekeeping.dispatcher@thegrandadp.com', 'engineering@thegrandadp.com', 'frontdesk@thegrandadp.com']) assert.equal(managerDepartmentFromEmail(email), undefined);
});
test('existing saves migrate without duplicating staff, recovery cases or inspections', () => {
  const s = fixture(), next = ensureManagerState(s);
  assert.equal(next.staffAccounts.length, s.staffAccounts.length);
  assert.deepEqual(next.items, s.items);
  assert.deepEqual(next.inspections, s.inspections);
});
test('each department sees only its tasks and GM inspection inbox', () => {
  const s = fixture();
  for (const d of MANAGER_DEPARTMENTS) {
    assert.equal(managerTasks(s, d.id).length, 1);
    assert.equal(managerInspections(s, d.id).length, 1);
    assert.ok(managerTasks(s, d.id).every(t => departmentId(t.department) === d.id));
    assert.ok(managerInspections(s, d.id).every(i => i.initiatedRole === 'general_manager'));
  }
});
test('queue mirrors are counted once and explicit department beats free-text mentions', () => {
  const s = fixture();
  const task = { id: 'dispatch', ref: 'REF-1', title: 'Wellness guest requests linen', meta: '', department: 'Housekeeping', status: 'In progress' };
  s.items.department_dispatcher.push(task);
  s.items.task_fulfiller.push({ ...task, id: 'fulfill' });
  assert.equal(managerTasks(s, 'housekeeping').filter(t => t.ref === 'REF-1').length, 1);
  assert.equal(managerTasks(s, 'wellness').filter(t => t.ref === 'REF-1').length, 0);
});
test('manager creates a department inspection and notifies its supervisor', () => {
  for (const d of MANAGER_DEPARTMENTS) {
    const s = fixture(d.id), id = `inspection-${d.id}`;
    const next = command(s, { type: 'inspection', location: 'Room 402', instructions: d.standard, supervisorId: `dept-supervisor-${d.id}` }, id);
    assert.equal(next.inspections[0].department, d.name);
    assert.equal(next.inspections[0].assignedSupervisorId, `dept-supervisor-${d.id}`);
    assert.equal(next.notifications[0].roleId, 'department_dispatcher_supervisor');
    assert.equal(next.notifications[0].department, d.name);
    assert.equal(s.inspections.some(i => i.id === id), false, 'input state is immutable');
  }
});
test('GM inspection can be delegated within the department without creating a duplicate', () => {
  const s = fixture(), inspection = managerInspections(s, 'housekeeping')[0];
  const next = command(s, { type: 'inspection', inspectionId: inspection.id, location: inspection.roomNumber, instructions: 'Inspect before arrival', supervisorId: 'dept-supervisor-housekeeping' });
  assert.equal(next.inspections.length, s.inspections.length);
  assert.equal(next.inspections.find(i => i.id === inspection.id).assignedSupervisorId, 'dept-supervisor-housekeeping');
});
test('cross-department inspection delegation and staff writes are rejected', () => {
  const s = fixture();
  assert.throws(() => command(s, { type: 'inspection', location: '402', instructions: 'Check', supervisorId: 'dept-supervisor-wellness' }), /outside your department/);
  assert.throws(() => command(s, { type: 'availability', staffId: 'dept-manager-wellness', value: 'off_duty' }), /outside your department/);
  assert.throws(() => command(s, { type: 'recovery', taskId: 'dept-case-wellness', decision: 'resolve', note: 'No access' }), /unavailable/);
});
test('escalation reaches the General Manager queue and notifications with context', () => {
  const s = fixture('wellness');
  const next = command(s, { type: 'recovery', taskId: 'dept-case-wellness', decision: 'escalate', note: 'Need GM authorization for recovery.' });
  assert.equal(next.items.general_manager[0].department, 'Spa & Wellness');
  assert.equal(next.items.general_manager[0].description, 'Need GM authorization for recovery.');
  assert.equal(next.notifications[0].roleId, 'general_manager');
  assert.equal(next.items.department_manager.find(t => t.id === 'dept-case-wellness').status, 'Escalated to GM');
});
test('resolving recovery updates mirrored task status and records the correct manager', () => {
  const s = fixture('engineering'), task = managerTasks(s, 'engineering')[0];
  s.items.department_dispatcher_supervisor.push({ ...task, id: 'mirror' });
  const next = command(s, { type: 'recovery', taskId: 'mirror', decision: 'resolve', note: 'Repair verified; guest informed.' });
  assert.equal(next.items.department_manager.find(t => t.ref === task.ref).status, 'Resolved');
  assert.equal(next.notifications[0].roleId, 'department_dispatcher_supervisor');
  assert.match(next.items.department_dispatcher_supervisor[0].history[0].note, /Arjun Mehta/);
});
test('handover snapshots only department requests and requires the named receiver', () => {
  const s = fixture(), next = command(s, { type: 'handover', incoming: 'Incoming manager', notes: 'Follow up before evening shift.' });
  assert.equal(next.shiftHandovers[0].scope, 'My Department');
  assert.equal(next.shiftHandovers[0].outstandingTasksCount, 1);
  assert.equal(next.shiftHandovers[0].department, 'Housekeeping');
  assert.throws(() => command(next, { type: 'acknowledge', handoverId: 'test-command' }), /named incoming/);
  next.managerProfiles = { housekeeping: { name: 'Incoming manager', phone: '' } };
  assert.equal(command(next, { type: 'acknowledge', handoverId: 'test-command' }).shiftHandovers[0].status, 'acknowledged');
});
test('policies, profile and notification reads remain scoped to the department', () => {
  let s = command(fixture(), { type: 'policy', title: 'Linen quality', content: 'Inspect replacement linen before delivery.', opensAt: '08:00', closesAt: '17:00', quietStart: '22:00', quietEnd: '07:00', slaMinutes: 30 });
  assert.equal(s.departmentPolicies[0].department, 'Housekeeping');
  assert.deepEqual(s.departmentPolicies[0].operatingWindow, { start: '08:00', end: '17:00' });
  assert.deepEqual(s.departmentPolicies[0].quietHours, { start: '22:00', end: '07:00' });
  assert.equal(s.departmentPolicies[0].slaMinutes, 30);
  s = command(s, { type: 'profile', name: 'Updated manager', phone: '100' });
  assert.equal(s.managerProfiles.housekeeping.name, 'Updated manager');
  assert.equal(s.managerProfiles.wellness, undefined);
  s.notifications.push({ id: 'wellness-private', roleId: 'department_manager', department: 'Spa & Wellness', title: 'Wellness', timestamp: '', read: false });
  assert.equal(managerNotifications(s, 'housekeeping').length, 0);
  assert.throws(() => command(s, { type: 'read', notificationId: 'wellness-private' }), /unavailable/);
});
test('blank decisions and non-manager mutations fail without changing state', () => {
  const s = fixture();
  assert.throws(() => command(s, { type: 'recovery', taskId: 'dept-case-housekeeping', decision: 'resolve', note: ' ' }), /Enter a value/);
  s.persona = 'task_fulfiller';
  assert.throws(() => command(s, { type: 'policy', title: 'x', content: 'x' }), /manager demo account/);
});

test('GM decision returns to the original department without modifying financial records', () => {
  let s = fixture('wellness');
  s.folios = { '402': [{ id: 'charge', label: 'Room', amount: 5000, date: 'Today' }] };
  s = command(s, { type: 'recovery', taskId: 'dept-case-wellness', decision: 'escalate', note: 'Please authorize recovery.' });
  s.persona = 'general_manager';
  const before = structuredClone(s.folios);
  const next = reviewManagerEscalation(s, s.items.general_manager[0].id, 'approve', 'Recovery plan approved; contact the guest.', 'gm-decision');
  assert.equal(managerTasks(next, 'wellness')[0].status, 'GM Approved');
  assert.equal(managerNotifications(next, 'wellness')[0].id, 'gm-decision');
  assert.equal(managerNotifications(next, 'housekeeping').length, 0);
  assert.deepEqual(next.folios, before);
  assert.throws(() => reviewManagerEscalation(next, s.items.general_manager[0].id, 'approve', 'Repeat', 'repeat'), /unavailable/);
});
test('re-escalating a pending GM case does not create a second approval', () => {
  const s = command(fixture(), { type: 'recovery', taskId: 'dept-case-housekeeping', decision: 'escalate', note: 'Please review.' });
  assert.throws(() => command(s, { type: 'recovery', taskId: 'dept-case-housekeeping', decision: 'escalate', note: 'Repeat' }), /already awaiting/);
  assert.equal(s.items.general_manager.length, 1);
});

function operationalFixture(department) {
  const s = fixture(department);
  s.frontDesk = { rooms: [{ no: '401', floor: 4, occupied: false, readiness: 'dirty', dnd: false }], stays: [], complaints: [], sync: [] };
  s.staffAccounts.push({ id: 'therapist-1', name: 'Demo therapist', department: 'Spa & Wellness', roleId: 'task_fulfiller', status: 'active', availability: 'on_duty' });
  return s;
}

test('stock counts persist through migration; replenishment does not invent received stock', () => {
  let s = operationalFixture('housekeeping');
  s = command(s, { type: 'stock-count', stockId: 'hk-linen', quantity: 12 });
  s = command(s, { type: 'replenish', stockId: 'hk-linen' }, 'restock-1');
  assert.equal(s.managerOperations.stock.find(i => i.id === 'hk-linen').onHand, 12);
  assert.match(s.resourceRequests[0].details, /48 sets/);
  assert.equal(s.resourceRequests[0].department, 'Housekeeping');
  assert.throws(() => command(s, { type: 'replenish', stockId: 'hk-linen' }), /already pending/);
  assert.equal(ensureManagerState(s).managerOperations.stock.find(i => i.id === 'hk-linen').onHand, 12);
});
test('stock actions reject other departments and invalid whole-unit counts', () => {
  const s = operationalFixture('housekeeping');
  assert.throws(() => command(s, { type: 'stock-count', stockId: 'fb-milk', quantity: 4 }), /unavailable/);
  for (const quantity of [-1, NaN, Infinity, 2.5]) assert.throws(() => command(s, { type: 'stock-count', stockId: 'hk-linen', quantity }));
});
test('housekeeping cleaning respects DND and engineering holds and deduplicates work', () => {
  const s = operationalFixture('housekeeping');
  s.frontDesk.rooms[0].dnd = true;
  assert.throws(() => command(s, { type: 'room-cleaning', room: '401' }), /Do Not Disturb/);
  s.frontDesk.rooms[0].dnd = false; s.frontDesk.rooms[0].readiness = 'out_of_order';
  assert.throws(() => command(s, { type: 'room-cleaning', room: '401' }), /engineering clearance/);
  s.frontDesk.rooms[0].readiness = 'dirty';
  const next = command(s, { type: 'room-cleaning', room: '401' });
  assert.equal(next.items.department_dispatcher_supervisor[0].category, 'housekeeping');
  assert.equal(next.frontDesk.rooms[0].readiness, 'dirty', 'queueing does not release or clean the room');
  assert.throws(() => command(next, { type: 'room-cleaning', room: '401' }), /already has/);
});
const appointment = { type: 'appointment', guest: 'Room 402', treatment: 'Relaxation massage', therapistId: 'therapist-1', room: 'Treatment room 1', start: '2026-11-05T10:00:00Z', durationMinutes: 60 };
test('wellness rejects room and therapist overlaps including the reset buffer', () => {
  const s = command(operationalFixture('wellness'), appointment, 'appointment-1');
  assert.equal(s.items.department_dispatcher_supervisor[0].category, 'spa');
  assert.throws(() => command(s, { ...appointment, start: '2026-11-05T11:10:00Z' }), /reset buffer/);
  assert.throws(() => command(s, { ...appointment, room: 'Treatment room 2', start: '2026-11-05T10:30:00Z' }), /already booked/);
  s.staffAccounts.push({ ...s.staffAccounts.find(st => st.id === 'therapist-1'), id: 'therapist-2' });
  assert.throws(() => command(s, { ...appointment, therapistId: 'therapist-2', start: '2026-11-05T10:30:00Z' }), /already booked/);
  assert.equal(command(s, { ...appointment, start: '2026-11-05T11:15:00Z' }, 'appointment-2').managerOperations.appointments.length, 2);
});
test('cancelling an appointment frees capacity and updates shared tasks', () => {
  let s = command(operationalFixture('wellness'), appointment, 'appointment-1');
  assert.throws(() => command(s, { type: 'appointment-status', appointmentId: 'appointment-1', status: 'completed' }), /not finished/);
  s = command(s, { type: 'appointment-status', appointmentId: 'appointment-1', status: 'cancelled' });
  assert.equal(s.items.task_fulfiller[0].status, 'Cancelled');
  assert.equal(command(s, appointment, 'replacement').managerOperations.appointments.length, 2);
});
test('wellness rejects unavailable therapists, invalid rooms and past appointments', () => {
  const s = operationalFixture('wellness');
  assert.throws(() => command(s, { ...appointment, start: '2026-11-03T10:00:00Z' }), /future appointment/);
  assert.throws(() => command(s, { ...appointment, room: 'Unknown room' }), /listed treatment room/);
  s.staffAccounts.find(st => st.id === 'therapist-1').availability = 'break';
  assert.throws(() => command(s, appointment), /available wellness therapist/);
});
test('maintenance work orders deduplicate and service dates require completed work', () => {
  const initial = operationalFixture('engineering');
  initial.items.department_manager.unshift({ id: 'legacy-without-ref', title: 'Maintenance issue', department: 'Maintenance & Engineering', meta: '', status: 'Escalated' });
  let s = command(initial, { type: 'asset-work-order', assetId: 'asset-hvac' }, 'pm-order');
  const ref = s.managerOperations.assets[0].workOrderRef;
  assert.throws(() => command(s, { type: 'asset-work-order', assetId: 'asset-hvac' }), /already has/);
  assert.throws(() => command(s, { type: 'asset-service', assetId: 'asset-hvac' }), /Complete the linked/);
  s.items.department_dispatcher_supervisor.find(t => t.ref === ref).status = 'Completed';
  s = command(s, { type: 'asset-service', assetId: 'asset-hvac' });
  assert.equal(s.managerOperations.assets[0].nextDue, '2026-12-04');
  assert.equal(s.managerOperations.assets[0].lastServiced, '2026-11-04T12:00:00.000Z');
  assert.equal(s.managerOperations.assets[0].workOrderRef, undefined);
});
test('F&B changes the shared guest menu while other departments cannot', () => {
  const s = operationalFixture('food-beverages');
  s.diningMenu = [{ id: 'menu-1', name: 'Demo dish', isAvailable: true, allergens: ['Dairy'] }];
  const next = command(s, { type: 'menu-availability', menuId: 'menu-1', available: false });
  assert.equal(next.diningMenu[0].isAvailable, false);
  assert.deepEqual(next.diningMenu[0].allergens, ['Dairy']);
  next.managerDepartment = 'housekeeping';
  assert.throws(() => command(next, { type: 'menu-availability', menuId: 'menu-1', available: true }), /outside your department/);
});

test('medical cases keep unique references, urgency, follow-up acknowledgement and append-only history', () => {
  assert.throws(() => command(fixture('wellness'), { type: 'policy', title: 'Unavailable', content: 'Policy action removed from Wellness.' }), /Policies are not available/);
  let s = command(fixture('wellness'), { type: 'medical-create', guest: 'Demo guest', location: '402', urgency: 'urgent', note: 'Private synthetic case note', followUpAt: '2026-11-04T11:00:00Z' }, 'case-1');
  const record = s.managerOperations.medicalCases[0];
  assert.equal(record.reference, 'INC-402-041126');
  assert.equal(medicalReminders(s, Date.parse('2026-11-04T12:00:00Z')).length, 1);
  assert.equal(s.notifications.length, 0, 'case narrative is not put in shared notifications');
  assert.ok(!JSON.stringify(s.auditTrail).includes('Private synthetic case note'));
  s = command(s, { type: 'medical-update', caseId: 'case-1', urgency: 'routine', status: 'monitoring', note: 'Follow-up recorded', followUpAt: record.followUpAt, acknowledge: true });
  assert.equal(s.managerOperations.medicalCases[0].history.length, 2);
  assert.equal(medicalReminders(s, Date.parse('2026-11-04T12:01:00Z')).length, 0);
  s = command(s, { type: 'medical-update', caseId: 'case-1', urgency: 'routine', status: 'monitoring', note: 'Schedule next review', followUpAt: '2026-11-04T13:00:00Z' });
  assert.equal(medicalReminders(s, Date.parse('2026-11-04T14:00:00Z')).length, 1);
  assert.equal(ensureManagerState(s).managerOperations.medicalCases.length, 1);
  assert.throws(() => command({ ...s, managerDepartment: 'engineering' }, { type: 'medical-update', caseId: 'case-1', urgency: 'routine', status: 'closed', note: 'No access' }), /outside your department/);
});

test('complaints are department scoped and update guest, Front Desk and task copies together', () => {
  for (const d of MANAGER_DEPARTMENTS) {
    let s = fixture(d.id);
    s.frontDesk = { rooms: [], stays: [], complaints: [] };
    s = command(s, { type: 'complaint-create', guest: 'Demo guest', room: '402', title: 'Service concern', description: 'Recorded test concern', priority: 'normal' }, `complaint-${d.id}`);
    const reference = managerComplaints(s, d.id)[0].reference;
    assert.equal(managerComplaints(s, d.id).length, 1, 'shared copies deduplicate');
    for (const other of MANAGER_DEPARTMENTS.filter(x => x.id !== d.id)) assert.equal(managerComplaints(s, other.id).length, 0);
    s = command(s, { type: 'complaint-update', reference, status: 'Resolved', note: 'Guest informed and follow-up completed' });
    assert.equal(s.guestComplaints[0].status, 'Resolved');
    assert.equal(s.frontDesk.complaints[0].status, 'Resolved');
    assert.equal(managerTasks(s, d.id).find(t => t.ref === reference).status, 'Resolved');
    assert.equal(s.frontDesk.complaints[0].compApplied, false);
    const other = { ...s, managerDepartment: d.id === 'wellness' ? 'engineering' : 'wellness' };
    assert.throws(() => command(other, { type: 'complaint-update', reference, status: 'Resolved', note: 'No access' }), /unavailable/);
  }
});

test('existing guest category routing is explicit and ambiguous complaints stay with Front Desk', () => {
  const s = fixture();
  s.guestComplaints = ['Housekeeping', 'Maintenance', 'Food and Dining', 'Other', 'Staff Behaviour'].map((category, i) => ({ id: `g-${i}`, complaintId: `C-${i}`, room: '402', guestName: 'Demo', category, title: 'Concern', description: 'Test', status: 'Submitted', submittedAt: '', history: [] }));
  assert.equal(managerComplaints(s, 'housekeeping').length, 1);
  assert.equal(managerComplaints(s, 'engineering').length, 1);
  assert.equal(managerComplaints(s, 'food-beverages').length, 1);
  assert.equal(managerComplaints(s, 'wellness').length, 0);
});

test('hotel repairs cover service areas, mirror workflow changes and reject unavailable technicians', () => {
  let s = fixture('engineering');
  s.staffAccounts.push({ id: 'tech', employeeId: 'TECH-1', name: 'Demo technician', roleId: 'task_fulfiller', department: 'Maintenance & Engineering', status: 'active', availability: 'on_duty' });
  s = command(s, { type: 'repair-create', title: 'Lobby fitting repair', location: 'Main lobby', note: 'Fitting needs repair', priority: 'urgent', technicianId: 'tech' }, 'repair-1');
  assert.equal(managerRepairs(s).length, 1);
  assert.equal(managerRepairs(s)[0].location, 'Main lobby');
  s = command(s, { type: 'repair-update', taskId: 'repair-1', status: 'Completed', note: 'Repair verified' });
  for (const key of ['department_dispatcher', 'department_dispatcher_supervisor', 'task_fulfiller']) assert.equal(s.items[key][0].status, 'Completed');
  assert.throws(() => command(s, { type: 'repair-create', title: 'Repair', location: 'Lobby', note: 'Test', priority: 'normal', technicianId: 'dept-manager-wellness' }), /technician/);
  assert.throws(() => command(fixture(), { type: 'repair-create', title: 'Repair', location: 'Lobby', note: 'Test', priority: 'normal' }), /outside/);
});

function roomFixture(department = 'housekeeping') {
  const s = fixture(department);
  s.frontDesk = { rooms: [{ no: '101', floor: 1, readiness: 'dirty' }, { no: '102', floor: 1, readiness: 'out_of_order' }, { no: '201', floor: 2, readiness: 'dirty' }], stays: [], complaints: [] };
  return s;
}
test('inspection sweeps create one real checklist per actual room with department-specific templates', () => {
  for (const d of MANAGER_DEPARTMENTS) {
    const s = roomFixture(d.id), before = s.inspections.length;
    const base = { type: 'inspection-launch', supervisorId: `dept-supervisor-${d.id}`, inspectionType: INSPECTION_OPTIONS[d.id][0].type, priority: 'urgent', instructions: 'Test directive' };
    const floor = command(s, { ...base, scope: 'floor', floor: 1 }, 'sweep');
    const created = floor.inspections.filter(i => i.batchId === 'sweep');
    assert.equal(floor.inspections.length, before + 2);
    assert.deepEqual(created.map(i => i.roomNumber), ['101', '102']);
    assert.ok(created.every(i => i.assignedSupervisorId === `dept-supervisor-${d.id}` && i.priority === 'urgent' && i.items.every(item => !item.passed)));
    assert.deepEqual(created[0].items.map(item => item.label), INSPECTION_OPTIONS[d.id][0].checks);
    const all = command(s, { ...base, scope: 'all' }, 'all');
    assert.equal(all.inspections.filter(i => i.batchId === 'all').length, 3);
    assert.throws(() => command(s, { ...base, scope: 'room', location: '999' }), /existing room/);
    assert.throws(() => command(s, { ...base, scope: 'floor', floor: 9 }), /No rooms/);
    assert.throws(() => command(s, { ...base, scope: 'all', supervisorId: `dept-supervisor-${d.id === 'wellness' ? 'engineering' : 'wellness'}` }), /supervisor/);
    assert.equal(s.inspections.length, before);
  }
});
test('supervisor must finish the correct department checklist and cannot clear engineering holds', () => {
  for (const id of ['housekeeping', 'wellness', 'engineering', 'food-beverages']) {
    let s = command(roomFixture(id), { type: 'inspection-launch', scope: 'all', supervisorId: `dept-supervisor-${id}`, inspectionType: INSPECTION_OPTIONS[id][0].type, priority: 'normal', instructions: '' }, 'batch');
    s.persona = 'department_dispatcher_supervisor';
    s.activeDispatcherDept = managerDepartmentForTest(id);
    const record = s.inspections.find(i => i.batchId === 'batch');
    assert.throws(() => reviewDepartmentInspection(s, record.id, 'passed', '', record.items), /Complete every/);
    const checks = record.items.map(item => ({ ...item, passed: true }));
    const passed = reviewDepartmentInspection(s, record.id, 'passed', 'Verified test checklist', checks);
    assert.equal(passed.inspections.find(i => i.id === record.id).status, 'passed');
    assert.equal(passed.frontDesk.rooms[0].readiness, id === 'housekeeping' ? 'ready' : 'dirty');
    assert.equal(passed.frontDesk.rooms[1].readiness, 'out_of_order');
    assert.equal(passed.inspections.find(i => i.id === record.id).items.every(i => i.passed), true);
    assert.throws(() => reviewDepartmentInspection({ ...s, activeDispatcherDept: id === 'wellness' ? 'Housekeeping' : 'Wellness' }, record.id, 'passed', '', checks), /supervisor department/);
  }
});
function managerDepartmentForTest(id) { return MANAGER_DEPARTMENTS.find(d => d.id === id).name; }

test('dining catalog edits preserve dish options and update shared categories; only F&B can edit', () => {
  let s = fixture('food-beverages');
  s.diningMenu = [{ id: 'dish', name: 'Old name', category: 'Breakfast', price: 100, dietary: 'veg', image: '', ingredients: [], allergens: [], isAvailable: true, mealTimes: ['breakfast'], supportsSpiceLevel: true }];
  const item = { name: 'Updated dish', category: 'Special menu', price: 220, dietary: 'vegan', image: '', ingredients: ['Rice', 'Soy'], allergens: ['Soy'], isAvailable: false };
  s = command(s, { type: 'menu-save', menuId: 'dish', item });
  assert.equal(s.diningMenu[0].name, 'Updated dish');
  assert.equal(s.diningMenu[0].supportsSpiceLevel, true);
  assert.deepEqual(s.diningMenu[0].mealTimes, ['breakfast']);
  assert.ok(s.diningCategories.includes('Special menu'));
  assert.throws(() => command({ ...s, managerDepartment: 'wellness' }, { type: 'menu-save', item }), /outside/);
  assert.throws(() => command(s, { type: 'menu-save', item: { ...item, price: -1 } }), /price/);
  s = command(s, { type: 'menu-delete', menuId: 'dish' });
  assert.equal(s.diningMenu.length, 0);
});
test('ordering overview deduplicates shared orders and excludes other departments', () => {
  const s = fixture('food-beverages');
  const order = { id: 'order', ref: 'DIN-1', category: 'room_service', status: 'Order Placed', title: 'Guest order', meta: '', orderLines: [{ itemId: 'dish', name: 'Dish', qty: 2, price: 100 }] };
  s.items.department_dispatcher.push(order);
  s.items.department_dispatcher_supervisor.push({ ...order, id: 'mirror' });
  s.items.department_dispatcher.push({ ...order, id: 'hk', ref: 'HK-1', category: 'housekeeping', department: 'Housekeeping' });
  s.items.department_dispatcher.push({ id: 'lift', ref: 'RS-LIFT', title: 'Service lift fault', category: 'room_service', status: 'Blocked', meta: '' });
  assert.equal(managerOrders(s).length, 1);
});


test('references keep a hotel-local date, share queue mirrors, and survive same-day collisions and reload', () => {
  assert.equal(formatReferenceNumber('GC', 'Room 502', '08-11-2026'), 'GC-502-081126');
  assert.equal(formatReferenceNumber('GC', 502, '2026-11-07T19:00:00Z'), 'GC-502-081126');
  let state = roomFixture();
  const input = { type: 'complaint-create', guest: 'Demo guest', room: '402', title: 'Service concern', description: 'A demo concern', priority: 'normal' };
  state = command(state, input, 'first-complaint');
  state = command(state, input, 'second-complaint');
  assert.deepEqual(state.guestComplaints.map(record => record.complaintId), ['GC-402-041126-2', 'GC-402-041126']);
  const legacy = { id: 'legacy-request', ref: 'HK-402-123', room: '402', title: 'Extra linen', meta: '', status: 'Unassigned', department: 'Housekeeping', createdAt: '2026-11-08T04:00:00Z' };
  state.items.department_dispatcher.push(legacy);
  state.items.task_fulfiller.push({ ...legacy, id: 'mirror' });
  state.items.department_manager.push({ id: 'mgr-legacy', title: 'AC failure · Room 305', meta: 'Maintenance', status: 'Escalated' });
  state.notifications.push({ id: 'legacy-alert', itemId: 'mgr-legacy', roleId: 'department_manager' });
  const reloaded = migrateOperationalReferences(JSON.parse(JSON.stringify(state)));
  assert.equal(reloaded.items.department_dispatcher.at(-1).ref, 'HK-402-081126');
  assert.equal(reloaded.items.task_fulfiller.at(-1).ref, 'HK-402-081126');
  assert.equal(managerEscalations(reloaded, 'engineering', 'to').find(item => item.id === 'mgr-legacy')?.ref, 'ESC-305-041126');
  assert.equal(reloaded.notifications.at(-1).itemId, 'mgr-legacy');
  assert.deepEqual(migrateOperationalReferences(structuredClone(reloaded)), reloaded);
});

test('task assignment, issues and completion evidence update all role mirrors', () => {
  let state = roomFixture();
  state.staffAccounts.push({ id: 'attendant', name: 'Demo attendant', roleId: 'task_fulfiller', department: 'Housekeeping', status: 'active' });
  state = command(state, { type: 'room-cleaning', room: '101' }, 'clean-room');
  const request = { type: 'task-update', taskId: 'clean-room', staffId: 'attendant', priority: 'high', status: 'Assigned', note: '' };
  state = command(state, request, 'assign');
  assert.equal(managerTasks(state, 'housekeeping').find(task => task.id === request.taskId).assignee, 'Demo attendant');
  assert.throws(() => command(state, { ...request, status: 'Blocked' }, 'missing-reason'), /Enter a value/);
  state = command(state, { ...request, status: 'Blocked', note: 'Waiting for supplies' }, 'block');
  assert.equal(state.items.task_fulfiller[0].blockerReason, 'Waiting for supplies');
  state = command(state, { ...request, status: 'Completed', note: 'Supplies replaced', photoUrl: 'https://example.com/proof.jpg' }, 'finish');
  for (const role of ['department_dispatcher', 'department_dispatcher_supervisor', 'task_fulfiller']) {
    assert.equal(state.items[role][0].status, 'Completed');
    assert.equal(state.items[role][0].blockerReason, undefined);
    assert.equal(state.items[role][0].photoUrl, 'https://example.com/proof.jpg');
  }
});

test('escalation decisions stay with the case and follow the assigned manager', () => {
  let state = migrateOperationalReferences(roomFixture());
  const itemId = managerEscalations(state, 'housekeeping', 'to')[0].id;
  const decision = { type: 'escalation-action', itemId };
  state = command(state, { ...decision, action: 'acknowledge' }, 'ack');
  assert.equal(managerEscalations(state, 'housekeeping', 'to')[0].managerEscalation.status, 'Acknowledged');
  state = command(state, { ...decision, action: 'escalate', target: 'engineering', note: 'Review plumbing' }, 'handoff');
  assert.equal(managerEscalations(state, 'housekeeping', 'to').length, 0);
  assert.equal(managerEscalations(state, 'housekeeping', 'from')[0].id, itemId);
  assert.ok(managerEscalations(state, 'engineering', 'to').some(record => record.id === itemId));
  state = command({ ...state, managerDepartment: 'engineering' }, { ...decision, action: 'reject', note: 'Work already complete' }, 'reject');
  const record = managerEscalations(state, 'housekeeping', 'from')[0];
  assert.deepEqual(record.managerEscalation.history.map(entry => entry.status), ['Acknowledged', 'Escalated', 'Rejected']);
  assert.equal(state.auditTrail[0].resource, record.ref);
});

test('department approval closes the escalation decision and records the audit entry', () => {
  const state = migrateOperationalReferences(roomFixture());
  const item = managerEscalations(state, 'housekeeping', 'to')[0];
  const approve = { type: 'escalation-action', itemId: item.id, action: 'approve' };
  const next = command(state, approve, 'approve');
  const updated = managerEscalations(next, 'housekeeping', 'to').find(record => record.id === item.id);
  assert.equal(updated.managerEscalation.status, 'Approved');
  assert.equal(updated.managerEscalation.history.at(-1).status, 'Approved');
  assert.equal(next.auditTrail[0].action, 'Escalation approved');
  assert.throws(() => command(next, approve, 'repeat'), /no longer awaiting/);
  assert.throws(() => command({ ...state, managerDepartment: 'wellness' }, approve, 'other'), /unavailable/);
});
