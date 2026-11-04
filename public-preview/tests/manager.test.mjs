import test from 'node:test';
import assert from 'node:assert/strict';
import { MANAGER_DEPARTMENTS, applyManagerCommand, departmentId, ensureManagerState, managerTasks, managerInspections, managerNotifications, reviewManagerEscalation } from '../src/lib/manager-domain.ts';

function fixture(department = 'housekeeping') {
  return ensureManagerState({ persona: 'department_manager', managerDepartment: department, staffAccounts: [], inspections: [], notifications: [], auditTrail: [], items: Object.fromEntries(['task_fulfiller', 'department_dispatcher', 'department_supervisor', 'department_dispatcher_supervisor', 'department_manager', 'front_desk_coordinator', 'financial_operator', 'security_responder', 'executive_viewer', 'general_manager', 'platform_admin'].map(r => [r, []])) });
}
const command = (s, c, id = 'test-command') => applyManagerCommand(s, c, id, '2026-11-04T12:00:00.000Z');

test('all four demo identities have unique email addresses and department IDs', () => {
  assert.equal(MANAGER_DEPARTMENTS.length, 4);
  assert.equal(new Set(MANAGER_DEPARTMENTS.map(d => d.email)).size, 4);
  for (const d of MANAGER_DEPARTMENTS) assert.equal(departmentId(d.name), d.id);
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
