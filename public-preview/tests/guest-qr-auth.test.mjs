import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QrAuthService,
  VerifyQrRequestSchema,
} from '../src/server/modules/guest/QrAuthService.ts';

test.beforeEach(() => {
  QrAuthService.clearTestData();
});

test('DEV3-TASK-01: Zod schema validates well-formed request payloads', () => {
  const valid = {
    roomNumber: '402',
    qrSignature: 'abc123def456',
    guestLastName: 'Sharma',
    verificationCode: 'BK-7892-0402',
  };
  const parsed = VerifyQrRequestSchema.safeParse(valid);
  assert.equal(parsed.success, true);

  const missingField = {
    roomNumber: '402',
    guestLastName: 'Sharma',
  };
  const invalidParsed = VerifyQrRequestSchema.safeParse(missingField);
  assert.equal(invalidParsed.success, false);
});

test('DEV3-TASK-01: Valid QR HMAC with Booking Reference challenge succeeds', async () => {
  const service = new QrAuthService();
  const validSig = QrAuthService.generateHmacSignature('402');

  const result = await service.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig,
    guestLastName: 'Sharma', // Case-insensitive
    verificationCode: 'BK-7892-0402',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data, 'Session data must be returned');
  assert.equal(result.data.roomNumber, '402');
  assert.equal(result.data.stayId, 'stay_seed_402');
  assert.equal(result.data.guestFullName, 'Aarav Sharma');
  assert.ok(result.data.sessionToken, 'Session token must be generated');

  // Verify session can be validated
  const validation = QrAuthService.validateSession(result.data.sessionToken);
  assert.equal(validation.valid, true);
  assert.equal(validation.session?.stayId, 'stay_seed_402');
});

test('DEV3-TASK-01: Valid QR HMAC with 4-digit Welcome TV PIN challenge succeeds', async () => {
  const service = new QrAuthService();
  const validSig = QrAuthService.generateHmacSignature('402');

  const result = await service.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig,
    guestLastName: 'sharma', // Lowercase test
    verificationCode: '4829', // 4-digit TV PIN
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.roomNumber, '402');
});

test('DEV3-TASK-01: Cross-room access denial (Signature from Room 403 used on Room 402)', async () => {
  const service = new QrAuthService();
  const sigFor403 = QrAuthService.generateHmacSignature('403');

  const result = await service.verifyAndCreateSession({
    roomNumber: '402', // Mismatched room
    qrSignature: sigFor403,
    guestLastName: 'Sharma',
    verificationCode: '4829',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.error?.code, 'INVALID_QR_SIGNATURE');
});

test('DEV3-TASK-01: Invalid challenge (Wrong Last Name or Wrong PIN) is rejected', async () => {
  const service = new QrAuthService();
  const validSig = QrAuthService.generateHmacSignature('402');

  // Wrong last name
  const wrongNameResult = await service.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig,
    guestLastName: 'Smith',
    verificationCode: '4829',
  });

  assert.equal(wrongNameResult.success, false);
  assert.equal(wrongNameResult.statusCode, 401);
  assert.equal(wrongNameResult.error?.code, 'CHALLENGE_FAILED');

  // Wrong verification code
  const wrongCodeResult = await service.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig,
    guestLastName: 'Sharma',
    verificationCode: '9999',
  });

  assert.equal(wrongCodeResult.success, false);
  assert.equal(wrongCodeResult.statusCode, 401);
  assert.equal(wrongCodeResult.error?.code, 'CHALLENGE_FAILED');
});

test('DEV3-TASK-01: Expired stay cannot authenticate via QR', async () => {
  const service = new QrAuthService();
  const expiredSig = QrAuthService.generateHmacSignature('505');

  // Register an expired stay (checked out yesterday)
  const now = Date.now();
  QrAuthService.registerMockStay('505', {
    stay: {
      id: 'stay_expired_505',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-5050-EXPD',
      guestFirstName: 'Rohan',
      guestLastName: 'Mehta',
      guestEmail: null,
      guestPhone: null,
      welcomeTvPin: '1111',
      status: 'checked_in',
      checkInTime: new Date(now - 1000 * 60 * 60 * 72),
      checkOutTime: new Date(now - 1000 * 60 * 60 * 24), // Expired 24 hours ago
      createdAt: new Date(now - 1000 * 60 * 60 * 72),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24),
    },
    room: {
      id: 'room_505',
      stayId: 'stay_expired_505',
      roomId: 'room_id_505',
      roomNumber: '505',
      propertyId: 'prop_grand_adp_01',
      floor: 5,
      roomType: 'Club Suite',
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: new Date(now - 1000 * 60 * 60 * 72),
      unassignedAt: null,
      isCurrent: true,
    },
    qr: {
      id: 'qr_505',
      propertyId: 'prop_grand_adp_01',
      roomId: 'room_id_505',
      roomNumber: '505',
      staticHmacSignature: expiredSig,
      secretKey: 'mock_key',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const result = await service.verifyAndCreateSession({
    roomNumber: '505',
    qrSignature: expiredSig,
    guestLastName: 'Mehta',
    verificationCode: '1111',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'STAY_EXPIRED');
});

test('DEV3-TASK-01: Non-checked-in stay (reserved only) is denied QR portal access', async () => {
  const service = new QrAuthService();
  const futureSig = QrAuthService.generateHmacSignature('601');

  const now = Date.now();
  QrAuthService.registerMockStay('601', {
    stay: {
      id: 'stay_reserved_601',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-6010-RSVD',
      guestFirstName: 'Vikram',
      guestLastName: 'Verma',
      guestEmail: null,
      guestPhone: null,
      welcomeTvPin: '2222',
      status: 'reserved', // Not checked in yet
      checkInTime: new Date(now + 1000 * 60 * 60 * 4),
      checkOutTime: new Date(now + 1000 * 60 * 60 * 48),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    room: {
      id: 'room_601',
      stayId: 'stay_reserved_601',
      roomId: 'room_id_601',
      roomNumber: '601',
      propertyId: 'prop_grand_adp_01',
      floor: 6,
      roomType: 'Penthouse',
      dndActive: false,
      cleanlinessStatus: 'inspected',
      assignedAt: new Date(),
      unassignedAt: null,
      isCurrent: true,
    },
    qr: {
      id: 'qr_601',
      propertyId: 'prop_grand_adp_01',
      roomId: 'room_id_601',
      roomNumber: '601',
      staticHmacSignature: futureSig,
      secretKey: 'mock_key',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const result = await service.verifyAndCreateSession({
    roomNumber: '601',
    qrSignature: futureSig,
    guestLastName: 'Verma',
    verificationCode: '2222',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'STAY_NOT_ACTIVE');
});

test('DEV3-TASK-01: Brute-force rate limiting locks after 5 failed attempts', async () => {
  const service = new QrAuthService();
  const validSig = QrAuthService.generateHmacSignature('402');
  const ip = '192.168.1.50';

  // Make 5 consecutive failed attempts
  for (let i = 1; i <= 5; i++) {
    const res = await service.verifyAndCreateSession(
      {
        roomNumber: '402',
        qrSignature: validSig,
        guestLastName: 'WrongName',
        verificationCode: '0000',
      },
      ip,
    );
    assert.equal(res.statusCode, 401);
  }

  // 6th attempt should now be blocked by rate limiter with 429
  const blockedRes = await service.verifyAndCreateSession(
    {
      roomNumber: '402',
      qrSignature: validSig,
      guestLastName: 'Sharma', // Even with correct credentials now!
      verificationCode: '4829',
    },
    ip,
  );

  assert.equal(blockedRes.success, false);
  assert.equal(blockedRes.statusCode, 429);
  assert.equal(blockedRes.error?.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(blockedRes.error?.retryAfterSeconds && blockedRes.error.retryAfterSeconds > 0);
});

test('DEV3-TASK-01: Session Revocation invalidates token immediately (Room Move / Checkout)', async () => {
  const service = new QrAuthService();
  const validSig = QrAuthService.generateHmacSignature('402');

  const res = await service.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig,
    guestLastName: 'Sharma',
    verificationCode: 'BK-7892-0402',
  });

  assert.equal(res.success, true);
  const token = res.data?.sessionToken;
  assert.ok(token);

  // Validate active session
  const check1 = QrAuthService.validateSession(token);
  assert.equal(check1.valid, true);

  // Trigger room move revocation
  const revokedCount = QrAuthService.revokeAllSessionsForRoom('402', 'room_move');
  assert.equal(revokedCount, 1);

  // Session must now be invalid
  const check2 = QrAuthService.validateSession(token);
  assert.equal(check2.valid, false);
  assert.equal(check2.reason, 'room_move');
});

