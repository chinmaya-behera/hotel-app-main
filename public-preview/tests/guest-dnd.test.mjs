import test from 'node:test';
import assert from 'node:assert/strict';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';
import { GuestDndService, UpdateDndRequestSchema } from '../src/server/modules/guest/GuestDndService.ts';
import { GuestStayService } from '../src/server/modules/guest/GuestStayService.ts';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';

test.beforeEach(() => {
  QrAuthService.clearTestData();
  InMemoryGuestStayRepository.getInstance().reset();
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

test('DEV3-TASK-04: 1. Guest enables DND successfully', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestDndService();
  const result = await service.setDndStatus(sessionToken, {
    dndActive: true,
    duration: 'For 4 Hours',
    instructions: 'Please do not disturb during my afternoon conference call.',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.equal(result.data.roomNumber, '402');
  assert.equal(result.data.dndActive, true);
  assert.equal(result.data.statusLabel, 'DND ACTIVE');
  assert.equal(result.data.duration, 'For 4 Hours');
  assert.equal(result.data.instructions, 'Please do not disturb during my afternoon conference call.');
  assert.ok(result.data.updatedAt);
});

test('DEV3-TASK-04: 2. Guest disables DND successfully', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestDndService();

  // First enable
  await service.setDndStatus(sessionToken, { dndActive: true });

  // Then disable
  const result = await service.setDndStatus(sessionToken, {
    dndActive: false,
    duration: 'Manual release',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.dndActive, false);
  assert.equal(result.data?.statusLabel, 'STANDARD SERVICE');
});

test('DEV3-TASK-04: 3. Missing or invalid session is rejected with 401', async () => {
  const service = new GuestDndService();

  // Missing token
  const resMissing = await service.setDndStatus('', { dndActive: true });
  assert.equal(resMissing.success, false);
  assert.equal(resMissing.statusCode, 401);
  assert.equal(resMissing.error?.code, 'UNAUTHORIZED');

  // Invalid token
  const resInvalid = await service.setDndStatus('invalid_token_xyz', { dndActive: true });
  assert.equal(resInvalid.success, false);
  assert.equal(resInvalid.statusCode, 401);
});

test('DEV3-TASK-04: 4. Expired or revoked session is rejected with 401', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Expire session
  const val = QrAuthService.validateSession(sessionToken);
  if (val.session) {
    val.session.expiresAt = new Date(Date.now() - 1000 * 60);
  }

  const service = new GuestDndService();
  const resExpired = await service.setDndStatus(sessionToken, { dndActive: true });
  assert.equal(resExpired.success, false);
  assert.equal(resExpired.statusCode, 401);

  // Revoked session
  const token2 = await createActiveSession402();
  assert.ok(token2);
  QrAuthService.revokeSession(token2, 'room_move');
  const resRevoked = await service.setDndStatus(token2, { dndActive: true });
  assert.equal(resRevoked.success, false);
  assert.equal(resRevoked.statusCode, 401);
});

test('DEV3-TASK-04: 5. Checked-out stay cannot change DND (403 STAY_NOT_ACTIVE)', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // Mark stay as checked_out in repository
  const repo = InMemoryGuestStayRepository.getInstance();
  const details = await repo.getStayWithRoomById('stay_seed_402');
  assert.ok(details);
  details.stay.status = 'checked_out';
  repo.registerStay(details.stay, details.currentRoom);

  const service = new GuestDndService();
  const result = await service.setDndStatus(sessionToken, { dndActive: true });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'STAY_NOT_ACTIVE');
});

test('DEV3-TASK-04: 6. Guest cannot change DND for another room (403 CROSS_ROOM_UPDATE_DENIED)', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestDndService();
  const result = await service.setDndStatus(sessionToken, {
    dndActive: true,
    targetRoomNumber: '505', // Attempt to tamper with Room 505
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'CROSS_ROOM_UPDATE_DENIED');
  assert.ok(result.error?.message.includes('Room 505'));
});

test('DEV3-TASK-04: 7. Invalid request body is rejected via Zod schema', () => {
  // Missing required dndActive boolean
  const missingDnd = { duration: '2h' };
  const res1 = UpdateDndRequestSchema.safeParse(missingDnd);
  assert.equal(res1.success, false);

  // Non-boolean dndActive
  const invalidType = { dndActive: 'active' };
  const res2 = UpdateDndRequestSchema.safeParse(invalidType);
  assert.equal(res2.success, false);

  // Valid body
  const valid = { dndActive: true, duration: '2h' };
  const res3 = UpdateDndRequestSchema.safeParse(valid);
  assert.equal(res3.success, true);
});

test('DEV3-TASK-04: 8. Repeated updates remain consistent (idempotent state)', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestDndService();

  // First enable
  const res1 = await service.setDndStatus(sessionToken, { dndActive: true });
  assert.equal(res1.data?.dndActive, true);

  // Second enable (identical state)
  const res2 = await service.setDndStatus(sessionToken, { dndActive: true });
  assert.equal(res2.data?.dndActive, true);

  const repo = InMemoryGuestStayRepository.getInstance();
  const details = await repo.getStayWithRoomById('stay_seed_402');
  assert.equal(details?.currentRoom.dndActive, true);
});

test('DEV3-TASK-04: 9. Stay-summary API immediately reflects updated DND status', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const dndService = new GuestDndService();
  const stayService = new GuestStayService();

  // Initial stay summary (dndActive = false)
  const initialSummary = await stayService.getStaySummary(sessionToken);
  assert.equal(initialSummary.data?.stay.dndActive, false);

  // Enable DND
  await dndService.setDndStatus(sessionToken, { dndActive: true });

  // Refreshed stay summary must now show dndActive = true!
  const updatedSummary = await stayService.getStaySummary(sessionToken);
  assert.equal(updatedSummary.data?.stay.dndActive, true);

  // Disable DND
  await dndService.setDndStatus(sessionToken, { dndActive: false });

  // Refreshed stay summary must now show dndActive = false!
  const finalSummary = await stayService.getStaySummary(sessionToken);
  assert.equal(finalSummary.data?.stay.dndActive, false);
});
