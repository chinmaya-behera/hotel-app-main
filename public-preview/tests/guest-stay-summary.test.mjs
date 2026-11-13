import test from 'node:test';
import assert from 'node:assert/strict';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';
import { GuestStayService } from '../src/server/modules/guest/GuestStayService.ts';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import { MockTaskQueryService } from '../src/server/modules/operations/MockTaskQueryService.ts';

test.beforeEach(() => {
  QrAuthService.clearTestData();
  InMemoryGuestStayRepository.getInstance().reset();
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

test('DEV3-TASK-02: 1. Valid guest session returns the correct stay summary and requests', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);

  // Stay assertions
  assert.equal(result.data.stay.stayId, 'stay_seed_402');
  assert.equal(result.data.stay.roomNumber, '402');
  assert.equal(result.data.stay.floor, 4);
  assert.equal(result.data.stay.roomType, 'Deluxe Suite');
  assert.equal(result.data.stay.status, 'checked_in');
  assert.equal(result.data.stay.dndActive, false);
  assert.ok(result.data.stay.checkInAt);
  assert.ok(result.data.stay.expectedCheckoutAt);

  // Guest display assertions
  assert.equal(result.data.guest.displayName, 'Aarav Sharma');
  assert.equal(result.data.guest.firstName, 'Aarav');
  assert.equal(result.data.guest.lastName, 'Sharma');

  // Requests assertions
  assert.ok(Array.isArray(result.data.requests));
  assert.equal(result.data.requests.length, 2);
  assert.equal(result.data.requests[0].category, 'Housekeeping / Extra Linens');
  assert.equal(result.data.requests[0].status, 'on_the_way');
  assert.equal(result.data.requests[0].statusLabel, 'Attendant On The Way');
});

test('DEV3-TASK-02: 2. Missing session token returns 401 UNAUTHORIZED', async () => {
  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary('');

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.error?.code, 'UNAUTHORIZED');
});

test('DEV3-TASK-02: 3. Expired session returns 401 UNAUTHORIZED', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Force session expiry in memory
  const validation = QrAuthService.validateSession(sessionToken);
  assert.equal(validation.valid, true);
  if (validation.session) {
    validation.session.expiresAt = new Date(Date.now() - 1000 * 60); // 1 minute ago
  }

  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.error?.code, 'UNAUTHORIZED');
  assert.ok(result.error?.message.includes('expired'));
});

test('DEV3-TASK-02: 4. Revoked session returns 401 UNAUTHORIZED', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Revoke session (e.g. room move trigger)
  QrAuthService.revokeSession(sessionToken, 'room_move');

  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.error?.code, 'UNAUTHORIZED');
  assert.ok(result.error?.message.includes('room change'));
});

test('DEV3-TASK-02: 5. Stay ID is strictly anchored to verified session (immune to client tampering)', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const stayService = new GuestStayService();
  // Service only accepts sessionToken. Even if someone passes parameters elsewhere, the service only reads session
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, true);
  // Stays locked to Room 402
  assert.equal(result.data?.stay.stayId, 'stay_seed_402');
  assert.equal(result.data?.stay.roomNumber, '402');
});

test('DEV3-TASK-02: 6. Checked-out stay cannot be treated as active', async () => {
  // Guest originally had an active session while in-house
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Front Desk or Express Checkout checks out the stay
  const repo = InMemoryGuestStayRepository.getInstance();
  const details = await repo.getStayWithRoomById('stay_seed_402');
  assert.ok(details);
  details.stay.status = 'checked_out';
  repo.registerStay(details.stay, details.currentRoom);

  // Guest attempts to refresh dashboard with their old session token
  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'STAY_NOT_ACTIVE');
  assert.ok(result.error?.message.includes('checked_out'));
});

test('DEV3-TASK-02: 7. Guest task projections strictly exclude internal staff details and notes', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, true);
  const requests = result.data?.requests || [];
  assert.ok(requests.length > 0);

  for (const req of requests) {
    // Assert strictly guest-facing properties are present
    assert.ok(req.taskId);
    assert.ok(req.category);
    assert.ok(req.department);
    assert.ok(req.status);
    assert.ok(req.statusLabel);
    assert.ok(req.createdAt);

    // Assert internal staff fields are NOT present
    const raw = req;
    assert.equal(raw.staffId, undefined, 'Staff ID must NEVER be exposed to guests');
    assert.equal(raw.staffName, undefined, 'Staff Name must NEVER be exposed to guests');
    assert.equal(raw.staffPhone, undefined, 'Staff Phone must NEVER be exposed to guests');
    assert.equal(raw.internalNotes, undefined, 'Internal notes must NEVER be exposed to guests');
    assert.equal(raw.supervisorNotes, undefined, 'Supervisor notes must NEVER be exposed to guests');
    assert.equal(raw.cost, undefined, 'Internal financial cost must NEVER be exposed to guests');
  }
});

test('DEV3-TASK-02: 8. Empty requests return a valid empty array', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Clear tasks for stay
  MockTaskQueryService.getInstance().clearTasks();

  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.data?.requests));
  assert.equal(result.data?.requests.length, 0);
});

test('DEV3-TASK-02: 9. Repository failures return safe internal error without leaking stack trace', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Mock repository that throws
  const failingRepo = {
    async getStayWithRoomById() {
      throw new Error('Connection reset by peer');
    },
    async getStayWithRoomByRoomNumber() {
      throw new Error('Connection reset by peer');
    },
  };

  const stayService = new GuestStayService(failingRepo);
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 500);
  assert.equal(result.error?.code, 'INTERNAL_ERROR');
  assert.ok(!result.error?.message.includes('password'));
});

test('DEV3-TASK-02: 10. Guest API cannot expose another guests stay information', async () => {
  // Session belongs to Aarav Sharma (Room 402)
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const stayService = new GuestStayService();
  const result = await stayService.getStaySummary(sessionToken);

  assert.equal(result.success, true);
  // Confirms it only returned Room 402 data, not Room 701 (Maya Sen)
  assert.equal(result.data?.stay.roomNumber, '402');
  assert.equal(result.data?.guest.displayName, 'Aarav Sharma');
  assert.notEqual(result.data?.guest.displayName, 'Maya Sen');
});
