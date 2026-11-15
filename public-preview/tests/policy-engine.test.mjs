import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  POLICY_ACTIONS, PolicyEngineService,
} from '../src/server/modules/policy/PolicyEngineService.ts';

const actor = { membershipId: 'operator', propertyId: 'hotel-a' };
const firstFloor = {
  propertyId: actor.propertyId, departmentId: 'front-desk', floorId: 'floor1',
  resourceType: 'stay_context', resourceId: 'stay-1',
};
const grant = (id, scope = {}, maximumAmount = null) => ({
  id, scope: { propertyId: actor.propertyId, ...scope }, maximumAmount,
});

test('all restricted scope dimensions must match on one permission-bearing grant', async () => {
  const resource = { ...firstFloor, outletId: 'lobby', shiftId: 'morning' };
  const service = new PolicyEngineService({
    async findActiveGrants(by, action) {
      assert.deepEqual(by, actor);
      assert.equal(action, 'stay.read');
      return [
        grant('incorrect-shift', { departmentId: 'front-desk', outletId: 'lobby', floorId: 'floor1', shiftId: 'night' }),
        grant('incorrect-floor', { departmentId: 'front-desk', outletId: 'lobby', floorId: 'floor2', shiftId: 'morning' }),
        grant('match', { departmentId: 'front-desk', outletId: 'lobby', floorId: 'floor1', shiftId: 'morning' }),
      ];
    },
  });
  assert.deepEqual(await service.authorize(actor, 'stay.read', resource), { authorized: true, grantId: 'match' });
  assert.deepEqual(await service.authorize(actor, 'stay.read', { ...resource, outletId: 'other' }),
    { authorized: false, reason: 'NO_MATCHING_GRANT' });
  assert.deepEqual(await service.authorize(actor, 'stay.read', { ...resource, shiftId: null, floorId: null }),
    { authorized: false, reason: 'NO_MATCHING_GRANT' });
});

test('a property-wide grant covers narrower resources and a missing permission denies access', async () => {
  const service = new PolicyEngineService({
    async findActiveGrants(_, action) {
      return action === 'stay.read' ? [grant('read')] : [];
    },
  });
  assert.equal((await service.authorize(actor, 'stay.read', firstFloor)).authorized, true);
  assert.deepEqual(await service.authorize(actor, 'stay.update', firstFloor),
    { authorized: false, reason: 'NO_MATCHING_GRANT' });
});

test('cross-property access and invalid scope are rejected before looking up grants', async () => {
  const service = new PolicyEngineService({
    async findActiveGrants() { assert.fail('Grant lookup should not run'); },
  });
  assert.deepEqual(await service.authorize(actor, 'stay.read', { ...firstFloor, propertyId: 'hotel-b' }),
    { authorized: false, reason: 'PROPERTY_MISMATCH' });
  assert.deepEqual(await service.authorize(actor, 'stay.read', { ...firstFloor, outletId: 'lobby', departmentId: null }),
    { authorized: false, reason: 'INVALID_CONTEXT' });
});

test('a fulfiller can use the assigned-task permission only for tasks assigned to that membership', async () => {
  const service = new PolicyEngineService({ async findActiveGrants() { return [grant('task')]; } });
  const action = POLICY_ACTIONS.readAssignedTask;
  const task = { ...firstFloor, resourceType: 'department_task', assigneeMembershipId: actor.membershipId };
  assert.equal((await service.authorize(actor, action, task)).authorized, true);
  assert.deepEqual(await service.authorize(actor, action, { ...task, assigneeMembershipId: 'another-member' }),
    { authorized: false, reason: 'ASSIGNMENT_REQUIRED' });
  assert.deepEqual(await service.authorize(actor, action, firstFloor),
    { authorized: false, reason: 'INVALID_CONTEXT' });
});

const financial = {
  amount: '2500.0000', currency: 'INR', transactionType: 'refund',
  requestedByMembershipId: 'requester', approvedByMembershipId: 'approver',
};
const exception = { ...firstFloor, resourceType: 'financial_exception', resourceId: 'refund-1', financial };

test('one grant must cover permission, entire scope and the exact financial cap', async () => {
  const service = new PolicyEngineService({
    async findActiveGrants(_, __, { currency, transactionType }) {
      assert.equal(currency, 'INR');
      assert.equal(transactionType, 'refund');
      return [
        grant('wrong-scope', { floorId: 'floor2' }, '9000.0000'),
        grant('no-limit', { floorId: 'floor1' }),
        grant('matching', { floorId: 'floor1' }, '2500'),
      ];
    },
  });
  assert.deepEqual(await service.authorize(actor, POLICY_ACTIONS.approveFinancialException, exception),
    { authorized: true, grantId: 'matching' });
  const aboveLimit = { ...exception, financial: { ...financial, amount: '2500.0001' } };
  assert.deepEqual(await service.authorize(actor, POLICY_ACTIONS.approveFinancialException, aboveLimit),
    { authorized: false, reason: 'FINANCIAL_LIMIT_EXCEEDED' });
});

test('financial actions reject missing or malformed amounts and enforce independent actors', async () => {
  const service = new PolicyEngineService({
    async findActiveGrants() { assert.fail('Grant lookup should not run'); },
  });
  const { approveFinancialException: approve, executeFinancialException: execute } = POLICY_ACTIONS;
  const check = async (action, changes, reason) => {
    assert.deepEqual(await service.authorize(actor, action, { ...exception, financial: { ...financial, ...changes } }),
      { authorized: false, reason });
  };
  for (const amount of ['0', '-1', 'NaN', '1e3', '2.00001', '100000000000000']) {
    await check(approve, { amount }, 'INVALID_CONTEXT');
  }
  await check(approve, { requestedByMembershipId: actor.membershipId }, 'SEPARATION_OF_DUTIES');
  await check(execute, { requestedByMembershipId: actor.membershipId }, 'SEPARATION_OF_DUTIES');
  await check(execute, { approvedByMembershipId: actor.membershipId }, 'SEPARATION_OF_DUTIES');
  await check(execute, { approvedByMembershipId: financial.requestedByMembershipId }, 'SEPARATION_OF_DUTIES');
  await check(execute, { approvedByMembershipId: undefined }, 'INVALID_CONTEXT');
  assert.deepEqual(await service.authorize(actor, approve, { ...exception, financial: undefined }),
    { authorized: false, reason: 'INVALID_CONTEXT' });
});
