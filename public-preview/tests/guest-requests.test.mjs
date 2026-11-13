import test from 'node:test';
import assert from 'node:assert/strict';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';
import { GuestRequestService } from '../src/server/modules/guest/GuestRequestService.ts';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import { MockTaskEngineService } from '../src/server/modules/operations/MockTaskEngineService.ts';
import { MockTaskQueryService } from '../src/server/modules/operations/MockTaskQueryService.ts';

test.beforeEach(() => {
  QrAuthService.clearTestData();
  GuestRequestService.clearIdempotencyCache();
  InMemoryGuestStayRepository.getInstance().reset();
  MockTaskEngineService.getInstance().reset();
  MockTaskQueryService.getInstance().resetSeed();
});

// Helper to create an active session for Room 402
async function createActiveSession402() {
  const authService = new QrAuthService();
  const validSig = QrAuthService.generateHmacSignature('402');
  const authResult = await authService.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig,
    guestLastName: 'Sharma',
    verificationCode: 'BK-7892-0402',
  });
  assert.equal(authResult.success, true);
  return authResult.data?.sessionToken;
}

test('DEV3-TASK-03: 1. Valid authenticated guest request submits successfully', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestRequestService();
  const result = await service.submitRequest(sessionToken, {
    department: 'Housekeeping',
    category: 'Extra Towels',
    instructions: 'Please bring 2 extra bath towels and bathrobes.',
    priority: 'normal',
    preferredTime: 'As soon as possible (~15 mins)',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.ok(result.data.caseRef.startsWith('REQ-2026-'));
  assert.ok(result.data.caseId.startsWith('case_'));
  assert.ok(result.data.taskId.startsWith('task_'));
  assert.equal(result.data.department, 'Housekeeping');
  assert.equal(result.data.category, 'Extra Towels');
  assert.equal(result.data.status, 'submitted');
  assert.equal(result.data.statusLabel, 'Request Received');
  assert.ok(result.data.estimatedCompletionAt);

  // Verify that the task immediately appears in the stay query service
  const queryService = MockTaskQueryService.getInstance();
  const tasks = await queryService.getTasksForStay('stay_seed_402');
  assert.ok(tasks.length > 2);
  assert.equal(tasks[0].taskId, result.data.taskId);
  assert.equal(tasks[0].category, 'Extra Towels');
});

test('DEV3-TASK-03: 2. Missing, expired or revoked session returns 401 UNAUTHORIZED', async () => {
  const service = new GuestRequestService();

  // Missing token
  const resMissing = await service.submitRequest('', {
    department: 'Housekeeping',
    category: 'Water',
    instructions: '1 bottle of water',
    priority: 'normal',
  });
  assert.equal(resMissing.success, false);
  assert.equal(resMissing.statusCode, 401);
  assert.equal(resMissing.error?.code, 'UNAUTHORIZED');

  // Expired token
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);
  const sessionVal = QrAuthService.validateSession(sessionToken);
  if (sessionVal.session) {
    sessionVal.session.expiresAt = new Date(Date.now() - 1000 * 60);
  }
  const resExpired = await service.submitRequest(sessionToken, {
    department: 'Housekeeping',
    category: 'Water',
    instructions: '1 bottle of water',
    priority: 'normal',
  });
  assert.equal(resExpired.success, false);
  assert.equal(resExpired.statusCode, 401);

  // Revoked token
  const token2 = await createActiveSession402();
  assert.ok(token2);
  QrAuthService.revokeSession(token2, 'room_move');
  const resRevoked = await service.submitRequest(token2, {
    department: 'Housekeeping',
    category: 'Water',
    instructions: '1 bottle of water',
    priority: 'normal',
  });
  assert.equal(resRevoked.success, false);
  assert.equal(resRevoked.statusCode, 401);
});

test('DEV3-TASK-03: 3. Guest attempting to submit for another room is rejected with 403', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestRequestService();
  const result = await service.submitRequest(sessionToken, {
    department: 'Food & Beverage',
    category: 'Room Service',
    instructions: 'Deliver wine to room 505',
    priority: 'normal',
    targetRoomNumber: '505', // Attempt to submit for different room!
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'CROSS_ROOM_SUBMISSION_DENIED');
  assert.ok(result.error?.message.includes('Room 505'));
});

test('DEV3-TASK-03: 4. Idempotency protection prevents duplicate case submissions', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestRequestService();
  const idempotencyKey = 'client_unique_submit_token_999';

  // First submission
  const firstRes = await service.submitRequest(sessionToken, {
    department: 'Maintenance & Engineering',
    category: 'AC Temperature',
    instructions: 'AC is blowing warm air.',
    priority: 'urgent',
    idempotencyKey,
  });

  assert.equal(firstRes.success, true);
  assert.equal(firstRes.statusCode, 201);
  const originalCaseRef = firstRes.data?.caseRef;

  // Duplicate submission with the same idempotency key (e.g. double-click)
  const duplicateRes = await service.submitRequest(sessionToken, {
    department: 'Maintenance & Engineering',
    category: 'AC Temperature',
    instructions: 'AC is blowing warm air.',
    priority: 'urgent',
    idempotencyKey,
  });

  assert.equal(duplicateRes.success, true);
  assert.equal(duplicateRes.statusCode, 200); // 200 Cached
  assert.equal(duplicateRes.data?.caseRef, originalCaseRef);

  // Verify Developer 2 engine only received 1 case creation call
  const createdCases = MockTaskEngineService.getInstance().getCreatedCases();
  assert.equal(createdCases.length, 1);
});

test('DEV3-TASK-03: 5. Developer 2 service failure returns 503 OPERATIONS_SERVICE_UNAVAILABLE', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Simulate Developer 2 service failure
  MockTaskEngineService.getInstance().setSimulateFailure(true);

  const service = new GuestRequestService();
  const result = await service.submitRequest(sessionToken, {
    department: 'Concierge',
    category: 'Luggage Assistance',
    instructions: 'Need assistance with bags at checkout.',
    priority: 'normal',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 503);
  assert.equal(result.error?.code, 'OPERATIONS_SERVICE_UNAVAILABLE');
  assert.ok(result.error?.message.includes('unavailable'));
});

test('DEV3-TASK-03: 6. Guest-safe response strictly excludes internal staff details', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestRequestService();
  const result = await service.submitRequest(sessionToken, {
    department: 'Housekeeping',
    category: 'Turndown Service',
    instructions: 'Please arrange evening turndown.',
    priority: 'normal',
  });

  assert.equal(result.success, true);
  assert.ok(result.data);

  // Verify internal fields are omitted
  const raw = result.data;
  assert.equal(raw.staffId, undefined, 'Staff ID must not be exposed');
  assert.equal(raw.staffPhone, undefined, 'Staff Phone must not be exposed');
  assert.equal(raw.internalNotes, undefined, 'Internal notes must not be exposed');
  assert.equal(raw.assignedTo, undefined, 'Assigned staff must not be exposed');
});

test('DEV3-TASK-03: 7. Checked-out stay cannot submit in-room requests', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Mark stay as checked_out in repository
  const repo = InMemoryGuestStayRepository.getInstance();
  const details = await repo.getStayWithRoomById('stay_seed_402');
  assert.ok(details);
  details.stay.status = 'checked_out';
  repo.registerStay(details.stay, details.currentRoom);

  const service = new GuestRequestService();
  const result = await service.submitRequest(sessionToken, {
    department: 'Housekeeping',
    category: 'Extra Towels',
    instructions: 'Towels please',
    priority: 'normal',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'STAY_NOT_ACTIVE');
});
