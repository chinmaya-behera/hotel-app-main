import test from 'node:test';
import assert from 'node:assert/strict';
import { mealPeriod, scheduledDiningTime, orderTimestamp, dishCuisine, snapshotOrderLines, dishInsights, diningFeedbackPatch, patchDiningMirrors, repairCategory } from '../src/lib/department-insights.ts';
import { ensureManagerState, applyManagerCommand } from '../src/lib/manager-domain.ts';
import { managerOrders, managerRepairs } from '../src/lib/manager-workflows.ts';
import { CUISINES, MEAL_PERIODS } from '../src/lib/department-insights.ts';
import { createDiningShowcase } from '../src/lib/dining-showcase.ts';

const menu = [
  { id: 'pasta', name: 'Pasta', category: 'Main Course', cuisine: 'Italian', price: 200, dietary: 'veg', image: '', ingredients: [], allergens: [], isAvailable: true },
  { id: 'noodles', name: 'Noodles', category: 'Main Course', cuisine: 'Chinese', price: 150, dietary: 'vegan', image: '', ingredients: [], allergens: [], isAvailable: true },
];
const line = (id = 'pasta', qty = 1, price = 200) => ({ itemId: id, name: id, qty, price });
const order = (extra = {}) => ({ id: 'o1', ref: 'DIN-402-001', category: 'room_service', room: '402', title: 'Dining order', meta: '', status: 'Delivered', orderedAt: '2026-11-06T12:30:00Z', orderLines: [line()], ...extra });
const fixture = (department = 'engineering') => ensureManagerState({ persona: 'department_manager', managerDepartment: department, staffAccounts: [], inspections: [], notifications: [], auditTrail: [], items: Object.fromEntries(['task_fulfiller','department_dispatcher','department_supervisor','department_dispatcher_supervisor','department_manager','front_desk_coordinator','financial_operator','security_responder','executive_viewer','general_manager','platform_admin'].map(role => [role, []])) });
const command = (s, c, id = 'rep-test') => applyManagerCommand(s, c, id, '2026-11-06T12:30:00Z');

test('meal classification covers every boundary in hotel IST, including UTC date rollover', () => {
  assert.deepEqual(MEAL_PERIODS.map(period => period.id), ['breakfast', 'lunch', 'dinner']);
  for (const [clock, expected] of [['04:59','dinner'],['05:00','breakfast'],['10:59','breakfast'],['11:00','lunch'],['15:59','lunch'],['16:00','lunch'],['17:59','lunch'],['18:00','dinner'],['22:59','dinner'],['23:00','dinner']]) {
    assert.equal(mealPeriod(order({ orderedAt: `2026-11-06T${clock}:00+05:30` })), expected, clock);
  }
  assert.equal(mealPeriod(order({ orderedAt: '2026-11-05T23:30:00Z' })), 'breakfast');
});

test('showcase covers every meal and cuisine with multiple dishes, ratings and nontrivial frequencies', () => {
  const samples = createDiningShowcase(Date.parse('2026-11-06T12:00:00Z'));
  assert.equal(samples.length, 63);
  assert.equal(new Set(samples.map(sample => sample.id)).size, samples.length);
  assert.equal(new Set(samples.map(sample => sample.ref)).size, samples.length);
  for (const meal of MEAL_PERIODS) {
    const orders = samples.filter(sample => mealPeriod(sample) === meal.id);
    assert.equal(orders.length, 21);
    const dishes = dishInsights(orders, []);
    assert.equal(dishes.length, 14);
    assert.deepEqual([...new Set(dishes.map(dish => dish.cuisine))].sort(), [...CUISINES].sort());
    for (const cuisine of CUISINES) {
      const rows = dishes.filter(dish => dish.cuisine === cuisine);
      assert.equal(rows.length, 2);
      assert.equal(new Set(rows.flatMap(row => row.orders.map(order => order.ref))).size, 3);
      for (const row of rows) {
        assert.equal(row.orders.length, 2);
        assert.ok(row.averageRating >= 1 && row.averageRating <= 5);
        assert.ok(row.reviews.some(review => review.comment.startsWith('Demo review:')));
        assert.ok(row.value > 0);
      }
    }
  }
});

test('showcase dates support recent-period filters and sample totals match recorded lines', () => {
  const now = Date.parse('2027-01-01T00:15:00Z');
  const samples = createDiningShowcase(now);
  for (const sample of samples) {
    assert.ok(orderTimestamp(sample) <= now);
    assert.ok(orderTimestamp(sample) >= now - 7 * 86400000);
    assert.equal(sample.amount, sample.orderLines.reduce((sum, line) => sum + line.qty * line.price, 0));
    assert.equal(sample.demoSource, 'dining-showcase');
    assert.notEqual(sample.guest, true);
    assert.match(sample.ref, /^DEMO-DIN-/);
    if (sample.status !== 'Delivered') assert.equal(sample.dishFeedback, undefined);
  }
  assert.ok(samples.some(sample => sample.status === 'Preparing'));
  assert.ok(samples.some(sample => sample.status === 'Cancelled'));
});

test('recreating the showcase is deterministic without persisting or sharing mutable sample records', () => {
  const now = Date.parse('2026-11-06T12:00:00Z');
  const original = createDiningShowcase(now), next = createDiningShowcase(now);
  assert.deepEqual(original, next);
  original[0].orderLines[0].qty = 999;
  assert.notEqual(next[0].orderLines[0].qty, 999);
  const state = fixture('food-beverages');
  const before = structuredClone(state);
  createDiningShowcase(now);
  assert.deepEqual(state, before);
  assert.equal(managerOrders(state).some(order => order.demoSource), false);
});
test('scheduled service takes precedence over placement and menu availability', () => {
  assert.equal(mealPeriod(order({ requestedServiceAt: '2026-11-07T08:00:00+05:30' })), 'breakfast');
  assert.equal(orderTimestamp(order({ requestedServiceAt: '2026-11-07T08:00:00+05:30' })), Date.parse('2026-11-07T02:30:00Z'));
});
test('legacy clock-only orders classify without inventing a calendar date', () => {
  assert.equal(mealPeriod(order({ orderedAt: undefined, createdAt: '08:30 PM' })), 'dinner');
  assert.equal(mealPeriod(order({ orderedAt: undefined, createdAt: '12:00 AM' })), 'dinner');
  assert.equal(orderTimestamp(order({ orderedAt: undefined, createdAt: '08:30 PM' })), undefined);
  for (const createdAt of [undefined, 'yesterday', '25:00', '13:10 PM', '08:99']) assert.equal(mealPeriod(order({ orderedAt: undefined, createdAt })), 'unknown');
});
test('scheduled checkout uses hotel date across month, year and client timezone boundaries', () => {
  const now = new Date('2026-12-31T20:00:00Z'); // 1 January in hotel time
  assert.equal(scheduledDiningTime('today', '12:30 AM', now), '2027-01-01T00:30:00+05:30');
  assert.equal(scheduledDiningTime('tomorrow', '08:00 PM', now), '2027-01-02T20:00:00+05:30');
  assert.equal(scheduledDiningTime('today', '99:00 PM', now), undefined);
});
test('cuisine is distinct from menu course and available for old catalog saves', () => {
  assert.equal(dishCuisine({ id: 'din-st-3', category: 'Starters' }), 'Italian');
  assert.equal(dishCuisine({ id: 'din-de-2', category: 'Desserts' }), 'Italian');
  assert.equal(dishCuisine({ id: 'custom', category: 'Starters' }), 'Uncategorised');
  assert.equal(dishCuisine({ id: 'custom', category: 'Indian Cuisine' }), 'Indian');
  assert.equal(dishCuisine({ id: 'din-st-3', category: 'Starters', cuisine: 'Mediterranean' }), 'Mediterranean');
});
test('order snapshots retain dish names, course, cuisine and option pricing after menu edits or deletion', () => {
  const lines = snapshotOrderLines([line('pasta', 2, 250)], menu);
  const [row] = dishInsights([order({ orderLines: lines })], []);
  assert.equal(row.name, 'Pasta'); assert.equal(row.cuisine, 'Italian'); assert.equal(row.category, 'Main Course'); assert.equal(row.value, 500);
  assert.equal(dishInsights([order({ orderLines: lines })], [{ ...menu[0], name: 'Changed', cuisine: 'Indian' }])[0].cuisine, 'Italian');
});
test('dish counts deduplicate mirrored orders and variants but sum units and recorded line values', () => {
  const one = order({ orderLines: [line('pasta', 2, 200), line('pasta', 1, 250), line('noodles', 1, 150)] });
  const rows = dishInsights([one, { ...one, id: 'mirror' }, order({ id: 'o2', ref: 'DIN-402-002', orderLines: [line('pasta', 1, 180)] })], menu);
  const pasta = rows.find(r => r.itemId === 'pasta');
  assert.equal(pasta.orders.length, 2); assert.equal(pasta.units, 4); assert.equal(pasta.value, 830);
  assert.equal(rows.find(r => r.itemId === 'noodles').orders.length, 1);
});
test('cancelled and rejected dishes keep their order counts but contribute no units or item value', () => {
  const [row] = dishInsights([order({ status: 'Cancelled' }), order({ id: 'o2', ref: 'DIN-402-002', status: 'Rejected' }), order({ id: 'o3', ref: 'DIN-402-003', status: 'Preparing' })], menu);
  assert.equal(row.cancelled, 2); assert.equal(row.active, 1); assert.equal(row.completed, 0); assert.equal(row.units, 1); assert.equal(row.value, 200);
});
test('dish averages use real per-dish feedback once per order, separate from service feedback and catalog scores', () => {
  const first = order({ orderLines: [line('pasta', 5), line('pasta')], feedback: { rating: 1, comment: 'Service only' }, dishFeedback: { pasta: { rating: 4, comment: 'Excellent pasta', submittedAt: '2026-11-06T13:00:00Z' } } });
  const second = order({ id: 'o2', ref: 'DIN-402-002', dishFeedback: { pasta: { rating: 2, submittedAt: '2026-11-06T14:00:00Z' } } });
  const [row] = dishInsights([first, second], [{ ...menu[0], rating: 5, ratingCount: 100 }]);
  assert.equal(row.averageRating, 3); assert.equal(row.reviews.length, 2); assert.equal(row.reviews.filter(r => r.comment).length, 1);
  assert.equal(dishInsights([order({ feedback: { rating: 5 } })], menu)[0].averageRating, undefined);
});
test('invalid quantities and ratings never pollute metrics', () => {
  assert.equal(dishInsights([order({ orderLines: [line('pasta', -1), line('pasta', NaN), line('pasta', 1, Infinity)] })], menu).length, 0);
  assert.equal(dishInsights([order({ dishFeedback: { pasta: { rating: 99 } } })], menu)[0].averageRating, undefined);
});
test('feedback validates delivered ordered dishes and replaces existing review without inflating count', () => {
  const patch = diningFeedbackPatch(order(), 5, 'Quick service', { pasta: { rating: 4, comment: '  Lovely  ' } }, '2026-11-06T13:00:00Z');
  assert.equal(patch.feedback.rating, 5); assert.equal(patch.dishFeedback.pasta.comment, 'Lovely');
  const next = diningFeedbackPatch({ ...order(), ...patch }, 4, '', { pasta: { rating: 3 } }, '2026-11-06T14:00:00Z');
  assert.equal(Object.keys(next.dishFeedback).length, 1); assert.equal(next.dishFeedback.pasta.rating, 3);
  assert.throws(() => diningFeedbackPatch(order(), 5, '', { noodles: { rating: 5 } }, ''), /ordered dish/);
  assert.throws(() => diningFeedbackPatch(order({ status: 'Preparing' }), 5, '', {}, ''), /after delivery/);
  assert.throws(() => diningFeedbackPatch(order(), 0, '', {}, ''), /1 to 5/);
});
test('lifecycle and reviews reach manager queue mirrors without touching another room or original state', () => {
  const s = fixture('food-beverages');
  s.items.department_dispatcher = [order({ status: 'Preparing' })];
  s.items.department_dispatcher_supervisor = [order({ id: 'supervisor-copy', status: 'Preparing' })];
  s.items.task_fulfiller = [order({ room: '999', id: 'unrelated' })];
  const patch = diningFeedbackPatch(order(), 5, 'Fast', { pasta: { rating: 4 } }, '2026-11-06T13:00:00Z');
  const items = patchDiningMirrors(s.items, 'department_dispatcher', 'o1', { status: 'Delivered', ...patch }, { at: '13:00', status: 'Delivered' });
  assert.equal(managerOrders({ ...s, items }).length, 1); assert.equal(managerOrders({ ...s, items })[0].dishFeedback.pasta.rating, 4);
  assert.equal(items.department_dispatcher_supervisor[0].status, 'Delivered'); assert.equal(items.task_fulfiller[0].dishFeedback, undefined);
  assert.equal(s.items.department_dispatcher[0].status, 'Preparing');
});
test('legacy repair suggestions recognise hotel trades and explicit categories override guesses', () => {
  for (const [title, expected] of [['Lobby chair damaged','Furniture'],['Bathroom tap leaking','Plumbing'],['Guest fridge failure','Appliances'],['AC thermostat issue','HVAC'],['Lift stopped','Lifts & elevators'],['Socket wiring fault','Electrical'],['Door lock broken','Building & fixtures'],['General service','Other']]) assert.equal(repairCategory({ title }), expected);
  assert.equal(repairCategory({ title: 'Fridge door', repairCategory: 'Electrical' }), 'Electrical');
  assert.equal(repairCategory({ title: 'AC not cooling', description: 'Front desk requests furniture protection' }), 'HVAC');
});
test('repair category survives creation, status changes, completed recategorisation and save migration', () => {
  let s = command(fixture(), { type: 'repair-create', title: 'Chair repair', location: 'Lobby', priority: 'normal', note: 'Loose leg', repairCategory: 'Furniture' });
  s = command(s, { type: 'repair-update', taskId: 'rep-test', status: 'Completed', note: 'Repaired', repairCategory: 'Furniture' });
  s = command(s, { type: 'repair-category', taskId: 'rep-test', repairCategory: 'Building & fixtures' });
  for (const role of ['department_dispatcher','department_dispatcher_supervisor','task_fulfiller']) {
    const task = s.items[role].find(i => i.ref === 'REP-LOBBY-061126');
    assert.equal(task.repairCategory, 'Building & fixtures'); assert.equal(task.status, 'Completed'); assert.equal(task.notes, 'Repaired');
  }
  assert.equal(managerRepairs(ensureManagerState(s)).find(t => t.id === 'rep-test').repairCategory, 'Building & fixtures');
});
test('repair categories reject arbitrary values, other departments and missing records', () => {
  const s = fixture();
  assert.throws(() => command(s, { type: 'repair-create', title: 'Test', location: 'Lobby', priority: 'normal', note: 'Test', repairCategory: 'Unknown' }), /listed repair category/);
  assert.throws(() => command(fixture('housekeeping'), { type: 'repair-category', taskId: 'x', repairCategory: 'Furniture' }), /department/);
  assert.throws(() => command(s, { type: 'repair-category', taskId: 'x', repairCategory: 'Furniture' }), /unavailable/);
});
test('cuisine edits persist while historical snapshots keep original classification', () => {
  const s = fixture('food-beverages'); s.diningMenu = menu;
  const next = command(s, { type: 'menu-save', menuId: 'pasta', item: { ...menu[0], cuisine: 'Mediterranean' } });
  assert.equal(next.diningMenu[0].cuisine, 'Mediterranean'); assert.equal(s.diningMenu[0].cuisine, 'Italian');
});
