import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureManagerState, applyManagerCommand, isOpen } from '../src/lib/manager-domain.ts';
import { reviewDepartmentInspection } from '../src/lib/manager-workflows.ts';
import { initialiseDepartmentHistory, captureDepartmentHistory, departmentHistory, repairCompletion, restoreDepartmentQueue } from '../src/lib/department-record-history.ts';

const at = '2026-11-06T09:00:00Z';
function fixture(department = 'engineering') {
  return initialiseDepartmentHistory(ensureManagerState({ persona: 'department_manager', managerDepartment: department, staffAccounts: [], inspections: [], notifications: [], auditTrail: [], frontDesk: { rooms: [{ no: '402', floor: 4, readiness: 'dirty' }], stays: [], complaints: [] }, diningMenu: [{ id: 'dish', name: 'Garden Pasta', category: 'Main Course', cuisine: 'Italian', price: 400, dietary: 'veg', image: '', ingredients: ['Pasta'], allergens: ['Gluten'], isAvailable: true }], items: Object.fromEntries(['task_fulfiller','department_dispatcher','department_supervisor','department_dispatcher_supervisor','department_manager','front_desk_coordinator','financial_operator','security_responder','executive_viewer','general_manager','platform_admin'].map(role => [role, []])) }), at);
}
const command = (state, input, id, when = at) => captureDepartmentHistory(state, applyManagerCommand(state, input, id, when), when);
const events = (state, kind, ref) => (state.departmentRecordHistory || []).filter(event => event.record.kind === kind && (!ref || event.record.reference === ref));

test('repair completion records preserve work, technician, time and notes after later recategorisation', () => {
  let state = fixture();
  state.staffAccounts.push({ id: 'tech', name: 'Demo technician', department: 'Engineering', roleId: 'task_fulfiller', status: 'active', availability: 'on_duty' });
  state = command(state, { type: 'repair-create', title: 'Replace tap cartridge', location: 'Room 402', priority: 'urgent', note: 'Leaking tap', repairCategory: 'Plumbing', technicianId: 'tech' }, 'tap');
  state = command(state, { type: 'repair-update', taskId: 'tap', status: 'In progress', note: 'Water isolated; cartridge removed' }, 'progress', '2026-11-06T10:00:00Z');
  state = command(state, { type: 'repair-update', taskId: 'tap', status: 'Completed', note: 'New cartridge fitted; leak test passed' }, 'complete', '2026-11-06T11:00:00Z');
  const completion = repairCompletion(state, 'REP-TAP');
  assert.equal(completion.record.owner, 'Demo technician'); assert.equal(completion.record.location, 'Room 402'); assert.equal(completion.actor, 'Arjun Mehta');
  assert.equal(completion.record.completedAt, '2026-11-06T11:00:00Z'); assert.match(completion.record.notes, /leak test passed/);
  state = command(state, { type: 'repair-category', taskId: 'tap', repairCategory: 'Building & fixtures' }, 'category');
  assert.deepEqual(repairCompletion(state, 'REP-TAP'), completion);
  assert.equal(events(state, 'repair', 'REP-TAP').length, 4, 'queue mirrors do not duplicate events');
  assert.equal(events(state, 'repair', 'REP-TAP').at(-1).record.completedAt, completion.record.completedAt);
  assert.match(events(state, 'repair', 'REP-TAP')[1].record.notes, /Water isolated/);
});

test('saved queue rows override seed status and notes, and reload migration preserves journal exactly', () => {
  const seed = [{ id: 'repair', title: 'Repair', status: 'Open' }], saved = [{ id: 'repair', title: 'Repair', status: 'Completed', notes: 'Repaired' }];
  const restored = restoreDepartmentQueue(seed, saved);
  assert.equal(restored[0].status, 'Completed'); assert.equal(restored[0].notes, 'Repaired'); assert.equal(seed[0].status, 'Open');
  let state = fixture();
  state = command(state, { type: 'repair-create', title: 'Chair repair', location: 'Lobby', priority: 'normal', note: 'Loose support' }, 'chair');
  state = command(state, { type: 'repair-update', taskId: 'chair', status: 'Completed', note: 'Support replaced' }, 'done');
  const loaded = initialiseDepartmentHistory(ensureManagerState(JSON.parse(JSON.stringify(state))), '2026-11-07T09:00:00Z');
  assert.deepEqual(loaded.departmentRecordHistory, JSON.parse(JSON.stringify(state.departmentRecordHistory)));
  assert.equal(repairCompletion(loaded, 'REP-CHAIR').record.notes, 'Support replaced');
});

test('existing completed records do not invent missing completion times', () => {
  const state = fixture(); delete state.departmentRecordHistory;
  state.items.department_dispatcher_supervisor.push({ id: 'legacy', ref: 'MX-OLD', title: 'Old plumbing repair', meta: '', department: 'Engineering', category: 'maintenance', status: 'Completed', history: [{ at: '10:30 AM', status: 'Completed', note: 'Repaired' }] });
  const loaded = initialiseDepartmentHistory(state, at);
  const entry = repairCompletion(loaded, 'MX-OLD');
  assert.equal(entry.action, 'recorded'); assert.equal(entry.record.completedAt, undefined); assert.equal(entry.recordedAt, at);
});

test('complaint response versions and resolved outcomes persist in every department without cross-department access', () => {
  for (const dept of ['housekeeping','wellness','engineering','food-beverages']) {
    let state = fixture(dept);
    state = command(state, { type: 'complaint-create', title: 'Demo concern', guest: 'Demo guest', room: '402', description: 'Initial concern', priority: 'normal' }, 'concern');
    state = command(state, { type: 'complaint-update', reference: 'CMP-CONCERN', status: 'In Progress', note: 'Investigating' }, 'review');
    state = command(state, { type: 'complaint-update', reference: 'CMP-CONCERN', status: 'Resolved', note: 'Guest confirmed resolution' }, 'resolve');
    const history = events(state, 'complaint', 'CMP-CONCERN');
    assert.equal(history.length, 3); assert.equal(history.at(-1).action, 'completed'); assert.equal(history[1].record.notes, 'Investigating');
    assert.equal(departmentHistory(state, dept).filter(event => event.record.kind === 'complaint').length, 3);
    assert.equal(departmentHistory(state, dept === 'wellness' ? 'engineering' : 'wellness').filter(event => event.record.kind === 'complaint').length, 0);
  }
});

test('medical status, urgency, follow-ups and private note versions remain in Wellness including reopening', () => {
  let state = fixture('wellness');
  state = command(state, { type: 'medical-create', guest: 'Demo case', location: '402', urgency: 'routine', note: 'Private demo note', followUpAt: '2026-11-07T10:00:00Z' }, 'medical');
  state = command(state, { type: 'medical-update', caseId: 'medical', status: 'closed', urgency: 'urgent', note: 'Case closed after follow-up', followUpAt: undefined }, 'medical-close');
  state = command(state, { type: 'medical-update', caseId: 'medical', status: 'monitoring', urgency: 'routine', note: 'New follow-up required' }, 'medical-reopen');
  const history = events(state, 'medical');
  assert.equal(history[1].action, 'completed'); assert.equal(history[2].action, 'reopened');
  assert.equal(history[0].record.fields.Urgency, 'routine'); assert.equal(history[1].record.fields.Urgency, 'urgent');
  assert.match(history[0].record.fields['Private case notes'], /Private demo note/);
  for (const dept of ['engineering','housekeeping','food-beverages']) assert.equal(departmentHistory(state, dept).some(event => JSON.stringify(event).includes('Private demo note')), false);
});

test('menu price, allergen, availability and removal history retains original and edited dish versions', () => {
  let state = fixture('food-beverages');
  state = command(state, { type: 'menu-save', menuId: 'dish', item: { ...state.diningMenu[0], price: 500, allergens: ['Dairy'] } }, 'edit-dish');
  state = command(state, { type: 'menu-availability', menuId: 'dish', available: false }, 'pause-dish');
  state = command(state, { type: 'menu-delete', menuId: 'dish' }, 'remove-dish');
  const history = events(state, 'menu', 'dish');
  assert.equal(history.length, 4); assert.equal(history[0].record.fields.Price, '400'); assert.equal(history[0].record.fields.Allergens, 'Gluten');
  assert.equal(history[1].record.fields.Price, '500'); assert.equal(history.at(-1).action, 'deleted'); assert.equal(history.at(-1).record.title, 'Garden Pasta');
  assert.equal(state.diningMenu.length, 0); assert.equal(history.at(-1).record.fields.Allergens, 'Dairy');
});

test('stock history retains before and after counts without fabricating replenishment receipts', () => {
  let state = fixture('housekeeping');
  state = command(state, { type: 'stock-count', stockId: 'hk-linen', quantity: 20 }, 'count');
  state = command(state, { type: 'replenish', stockId: 'hk-linen' }, 'requisition');
  const history = events(state, 'stock', 'hk-linen');
  assert.deepEqual(history[1].changes.find(change => change.field === 'Quantity'), { field: 'Quantity', before: '38', after: '20' });
  assert.equal(state.managerOperations.stock.find(stock => stock.id === 'hk-linen').onHand, 20);
  assert.equal(events(state, 'supplies', 'requisition').length, 1);
});

test('multiple asset service cycles preserve previous service dates and linked work order references', () => {
  let state = fixture();
  for (let cycle = 1; cycle <= 2; cycle++) {
    state = command(state, { type: 'asset-work-order', assetId: 'asset-hvac' }, `cycle-${cycle}`);
    state = command(state, { type: 'repair-update', taskId: `cycle-${cycle}`, status: 'Completed', note: `Filters replaced cycle ${cycle}` }, `done-${cycle}`);
    state = command(state, { type: 'asset-service', assetId: 'asset-hvac' }, `service-${cycle}`, `2026-11-0${6 + cycle}T09:00:00Z`);
  }
  const history = events(state, 'asset', 'asset-hvac').filter(event => event.action === 'completed');
  assert.equal(history.length, 2); assert.equal(history[0].record.completedAt, '2026-11-07T09:00:00Z');
  assert.equal(history[1].record.completedAt, '2026-11-08T09:00:00Z');
  assert.ok(history[0].changes.some(change => change.field === 'Work order' && change.before === 'PM-cycle-1'));
});

test('housekeeping task completion and room readiness retain separate outcomes; kitchen Ready is not Delivered', () => {
  let state = fixture('housekeeping');
  state = command(state, { type: 'room-cleaning', room: '402' }, 'clean');
  const next = structuredClone(state);
  for (const queue of Object.values(next.items)) for (const task of queue) if (task.ref === 'HK-clean') { task.status = 'Completed'; task.notes = 'Linen replaced and bathroom cleaned'; }
  next.frontDesk.rooms[0].readiness = 'ready';
  state = captureDepartmentHistory(state, next, at);
  assert.equal(events(state, 'task', 'HK-clean').at(-1).action, 'completed');
  assert.equal(events(state, 'room', '402').at(-1).action, 'completed');
  assert.equal(isOpen('Delivered'), false); assert.equal(isOpen('Ready'), true);
});

test('inspection assignment, checklist and supervisor outcome versions remain traceable', () => {
  let state = fixture('housekeeping');
  state = command(state, { type: 'inspection-launch', scope: 'room', location: '402', inspectionType: 'turnover', priority: 'normal', instructions: 'Check room', supervisorId: 'dept-supervisor-housekeeping' }, 'inspect');
  state = { ...state, persona: 'department_dispatcher_supervisor', activeDispatcherDept: 'Housekeeping' };
  const record = state.inspections.find(i => i.id === 'inspect-1');
  const next = reviewDepartmentInspection(state, record.id, 'passed', 'All checks passed', record.items.map(item => ({ ...item, passed: true })));
  state = captureDepartmentHistory(state, next, at);
  const history = events(state, 'inspection', record.id);
  assert.equal(history.at(-1).action, 'completed'); assert.match(history.at(-1).record.fields.Checklist, /Passed/);
  assert.match(history[0].record.fields.Checklist, /Pending/); assert.equal(history.at(-1).record.notes, 'All checks passed');
});

test('unrelated UI changes do not create history, and earlier versions are not truncated or erased by stale snapshots', () => {
  let state = fixture('housekeeping');
  const initial = state.departmentRecordHistory.length;
  state = captureDepartmentHistory(state, { ...state, theme: 'dark', notifications: [] }, at);
  assert.equal(state.departmentRecordHistory.length, initial);
  for (let i = 0; i < 85; i++) state = command(state, { type: 'stock-count', stockId: 'hk-linen', quantity: i }, `count-${i}`);
  assert.equal(events(state, 'stock', 'hk-linen').length, 86);
  const stale = { ...state, departmentRecordHistory: undefined, theme: 'light' };
  assert.deepEqual(captureDepartmentHistory(state, stale, at).departmentRecordHistory, state.departmentRecordHistory);
});
