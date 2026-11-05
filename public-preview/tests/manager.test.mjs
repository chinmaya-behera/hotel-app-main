import test from 'node:test';
import assert from 'node:assert/strict';
import { MANAGER_DEPARTMENTS, applyManagerCommand, departmentId, ensureManagerState, managerTasks, managerInspections, managerNotifications, reviewManagerEscalation, managerDepartmentFromEmail } from '../src/lib/manager-domain.ts';

function fixture(department = 'housekeeping') {
  return ensureManagerState({ persona: 'department_manager', managerDepartment: department, staffAccounts: [], inspections: [], notifications: [], auditTrail: [], items: Object.fromEntries(['task_fulfiller', 'department_dispatcher', 'department_supervisor', 'department_dispatcher_supervisor', 'department_manager', 'front_desk_coordinator', 'financial_operator', 'security_responder', 'executive_viewer', 'general_manager', 'platform_admin'].map(r => [r, []])) });
}
const command = (s, c, id = 'test-command') => applyManagerCommand(s, c, id, '2026-11-04T12:00:00.000Z');

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
  let s = command(fixture(), { type: 'policy', title: 'Linen quality', content: 'Inspect replacement linen before delivery.' });
  assert.equal(s.departmentPolicies[0].department, 'Housekeeping');
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
