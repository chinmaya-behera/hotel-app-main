import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import {
  PreCheckInService,
  PreCheckInSchema,
} from '../src/server/modules/guest/PreCheckInService.ts';
import {
  TemporaryMockStorageService,
} from '../src/server/modules/storage/StorageContract.ts';
import {
  FrontDeskStayService,
} from '../src/server/modules/frontdesk/FrontDeskStayService.ts';
import {
  QrAuthService,
} from '../src/server/modules/guest/QrAuthService.ts';

const mockFrontDeskStaff = {
  staffId: 'staff_fd_01',
  name: 'Sunita Patel',
  role: 'front_desk',
};

const mockDutyManager = {
  staffId: 'staff_dm_01',
  name: 'Marcus Vance',
  role: 'duty_manager',
};

const mockUnauthorizedStaff = {
  staffId: 'staff_hk_01',
  name: 'Laxmi Devi',
  role: 'housekeeping_attendant',
};

test.beforeEach(() => {
  InMemoryGuestStayRepository.getInstance().reset();
  TemporaryMockStorageService.getInstance().reset();
  QrAuthService.clearTestData();
});

// ============================================================================
// PART 1 — DEV3-TASK-07: PRE-ARRIVAL REGISTRATION & ID VERIFICATION
// ============================================================================

test('DEV3-TASK-07: 1. Valid pre-arrival registration advances stay to pending_verify and masks document number', async () => {
  const service = new PreCheckInService();

  // Room 201 (Rohan Verma) has initial status 'reserved'
  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-201-ARRV',
    guestLastName: 'Verma',
    estimatedArrivalTime: '15:30',
    idDocumentType: 'passport',
    idDocumentNumber: 'P89218274',
    idIssuingCountry: 'IND',
    specialRequests: 'Quiet corner room preferred.',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.equal(result.data.bookingReference, 'BK-201-ARRV');
  assert.equal(result.data.idVerificationStatus, 'pending_verify');
  assert.equal(result.data.idDocumentType, 'passport');
  // Document number must be masked (e.g. '*****8274')
  assert.equal(result.data.idDocumentNumberMasked, '*****8274');
  assert.equal(result.data.estimatedArrivalTime, '15:30');
  assert.equal(result.data.attachmentRegistered, false);
  assert.ok(result.data.preCheckInCompletedAt);

  // Check that repository state advanced to 'pending_verify'
  const repo = InMemoryGuestStayRepository.getInstance();
  const stay = await repo.getStayByBookingReference('BK-201-ARRV');
  assert.equal(stay?.stay.status, 'pending_verify');
  assert.equal(stay?.preArrival?.idVerificationStatus, 'pending_verify');
});

test('DEV3-TASK-07: 2. Valid pre-arrival registration with attachment registers metadata safely without storing raw base64', async () => {
  const service = new PreCheckInService();

  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-201-ARRV',
    guestLastName: 'Verma',
    estimatedArrivalTime: '16:00',
    idDocumentType: 'drivers_license',
    idDocumentNumber: 'DL-2026-99128',
    idIssuingCountry: 'IND',
    attachmentMetadata: {
      fileName: 'drivers_license_scan.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 245000,
      fileSha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.equal(result.data.attachmentRegistered, true);

  // Verify attachment metadata exists in storage vault without containing raw file bytes
  const storage = TemporaryMockStorageService.getInstance();
  const repo = InMemoryGuestStayRepository.getInstance();
  const stay = await repo.getStayByBookingReference('BK-201-ARRV');
  const storageKey = stay?.preArrival?.idAttachmentKey;
  assert.ok(storageKey);
  const meta = storage.getAttachmentMeta(storageKey);
  assert.ok(meta);
  assert.equal(meta.fileName, 'drivers_license_scan.jpg');
  assert.equal(meta.mimeType, 'image/jpeg');
  assert.equal(meta.quarantineStatus, 'pending_scan');
  // Raw base64 or file buffers must never be stored
  assert.equal(meta.data, undefined);
  assert.equal(meta.fileBase64, undefined);
});

test('DEV3-TASK-07: 3. Nonexistent booking reference returns 404 RESERVATION_NOT_FOUND', async () => {
  const service = new PreCheckInService();

  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-GHOST-9999',
    guestLastName: 'Sharma',
    estimatedArrivalTime: '14:00',
    idDocumentType: 'passport',
    idDocumentNumber: 'A12345678',
    idIssuingCountry: 'IND',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'RESERVATION_NOT_FOUND');
});

test('DEV3-TASK-07: 4. Mismatched guest surname returns 404 RESERVATION_NOT_FOUND (anti-enumeration)', async () => {
  const service = new PreCheckInService();

  // Booking 'BK-201-ARRV' belongs to 'Verma', not 'Kapoor'
  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-201-ARRV',
    guestLastName: 'Kapoor',
    estimatedArrivalTime: '14:00',
    idDocumentType: 'passport',
    idDocumentNumber: 'A12345678',
    idIssuingCountry: 'IND',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'RESERVATION_NOT_FOUND');
});

test('DEV3-TASK-07: 5. Cancelled reservation returns 400 RESERVATION_CANCELLED', async () => {
  const service = new PreCheckInService();

  // Room 303 (Priya Kapoor) is cancelled
  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-303-CANC',
    guestLastName: 'Kapoor',
    estimatedArrivalTime: '14:00',
    idDocumentType: 'passport',
    idDocumentNumber: 'A98765432',
    idIssuingCountry: 'IND',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'RESERVATION_CANCELLED');
});

test('DEV3-TASK-07: 6. Already checked-in reservation returns 400 ALREADY_CHECKED_IN', async () => {
  const service = new PreCheckInService();

  // Room 402 (Aarav Sharma) is already checked in
  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-7892-0402',
    guestLastName: 'Sharma',
    estimatedArrivalTime: '14:00',
    idDocumentType: 'passport',
    idDocumentNumber: 'A11223344',
    idIssuingCountry: 'IND',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'ALREADY_CHECKED_IN');
});

test('DEV3-TASK-07: 7. Duplicate pre-arrival submission returns 409 conflict', async () => {
  const service = new PreCheckInService();

  // Room 205 (Vikram Malhotra) already has pre-arrival status 'pending_verify'
  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-205-PREV',
    guestLastName: 'Malhotra',
    estimatedArrivalTime: '15:00',
    idDocumentType: 'passport',
    idDocumentNumber: 'P55019922',
    idIssuingCountry: 'IND',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 409);
  assert.equal(result.error?.code, 'PRE_CHECKIN_ALREADY_COMPLETED');
});

test('DEV3-TASK-07: 8. Unavailable attachment storage service returns 503 without crashing', async () => {
  const storage = TemporaryMockStorageService.getInstance();
  storage.setAvailable(false); // Simulate S3 vault outage

  const service = new PreCheckInService();
  const result = await service.submitPreCheckIn({
    bookingReference: 'BK-201-ARRV',
    guestLastName: 'Verma',
    estimatedArrivalTime: '15:30',
    idDocumentType: 'passport',
    idDocumentNumber: 'P89218274',
    idIssuingCountry: 'IND',
    attachmentMetadata: {
      fileName: 'passport.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 100000,
      fileSha256: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 503);
  assert.equal(result.error?.code, 'STORAGE_SERVICE_UNAVAILABLE');
});

test('DEV3-TASK-07: 9. Zod schema rejects invalid document type and file > 10MB', () => {
  const invalidType = PreCheckInSchema.safeParse({
    bookingReference: 'BK-1',
    guestLastName: 'Verma',
    estimatedArrivalTime: '14:00',
    idDocumentType: 'library_card',
    idDocumentNumber: '12345',
    idIssuingCountry: 'IND',
  });
  assert.equal(invalidType.success, false);

  const oversizedFile = PreCheckInSchema.safeParse({
    bookingReference: 'BK-1',
    guestLastName: 'Verma',
    estimatedArrivalTime: '14:00',
    idDocumentType: 'passport',
    idDocumentNumber: '12345',
    idIssuingCountry: 'IND',
    attachmentMetadata: {
      fileName: 'huge.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 15 * 1024 * 1024, // 15 MB
      fileSha256: '1234567890123456789012345678901234567890123456789012345678901234',
    },
  });
  assert.equal(oversizedFile.success, false);
});

// ============================================================================
// PART 2 — DEV3-TASK-08: FRONT DESK STAY MANAGEMENT & ARRIVAL CHECK-IN
// ============================================================================

test('DEV3-TASK-08: 10. Front Desk retrieves arrivals list and computes accurate counts', async () => {
  const service = new FrontDeskStayService();
  const result = await service.getStays(mockFrontDeskStaff, { filter: 'arrivals' });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  // Stays in arrivals list should have status 'reserved' or 'pending_verify'
  assert.ok(result.data.stays.length >= 2);
  assert.ok(result.data.stays.every((s) => s.status === 'reserved' || s.status === 'pending_verify'));
  assert.ok(result.data.counts.total >= 4);
  assert.ok(result.data.counts.arrivals >= 2);
  assert.ok(result.data.counts.inHouse >= 1);
});

test('DEV3-TASK-08: 11. Front Desk keyword search filters stays accurately', async () => {
  const service = new FrontDeskStayService();

  // Search by guest surname
  const searchName = await service.getStays(mockFrontDeskStaff, { search: 'Verma' });
  assert.equal(searchName.success, true);
  assert.ok(searchName.data?.stays.some((s) => s.guestLastName === 'Verma'));

  // Search by room number
  const searchRoom = await service.getStays(mockFrontDeskStaff, { search: '402' });
  assert.equal(searchRoom.success, true);
  assert.ok(searchRoom.data?.stays.some((s) => s.roomNumber === '402'));

  // Search by booking reference
  const searchRef = await service.getStays(mockFrontDeskStaff, { search: 'BK-205-PREV' });
  assert.equal(searchRef.success, true);
  assert.ok(searchRef.data?.stays.some((s) => s.bookingReference === 'BK-205-PREV'));
});

test('DEV3-TASK-08: 12. Unauthorized staff role is rejected with 403 FORBIDDEN', async () => {
  const service = new FrontDeskStayService();
  const result = await service.getStays(mockUnauthorizedStaff);

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'FORBIDDEN');
});

test('DEV3-TASK-08: 13. Valid guest check-in with pre-verified ID succeeds and unlocks QR session', async () => {
  const service = new FrontDeskStayService();

  // Room 205 (Vikram Malhotra) has pre-arrival status 'pending_verify', and room is 'ready'
  const result = await service.processCheckIn(mockFrontDeskStaff, 'stay_seed_205', {
    verifyIdAtDesk: true,
    docType: 'passport',
    docNumber: 'P55019922',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.equal(result.data.stayId, 'stay_seed_205');
  assert.equal(result.data.status, 'checked_in');
  assert.equal(result.data.roomNumber, '205');
  assert.equal(result.data.idVerificationStatus, 'verified');
  assert.equal(result.data.qrSessionActive, true);
  assert.ok(result.data.checkInTime);

  // CRITICAL VERIFICATION: Guest QR Session Auth (DEV3-TASK-01) must now succeed for Room 205!
  const qrService = new QrAuthService();
  const validSig205 = QrAuthService.generateHmacSignature('205');
  const qrAuth = await qrService.verifyAndCreateSession({
    roomNumber: '205',
    qrSignature: validSig205,
    guestLastName: 'Malhotra',
    verificationCode: 'BK-205-PREV',
  });

  assert.equal(qrAuth.success, true);
  assert.ok(qrAuth.data?.sessionToken);
});

test('DEV3-TASK-08: 14. Guest check-in without ID verification is rejected with 400 ID_VERIFICATION_REQUIRED', async () => {
  const service = new FrontDeskStayService();

  // Room 201 (Rohan Verma) has status 'reserved' with no prior ID verification
  const result = await service.processCheckIn(mockFrontDeskStaff, 'stay_seed_201', {
    verifyIdAtDesk: false, // ID was not checked at desk
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'ID_VERIFICATION_REQUIRED');
});

test('DEV3-TASK-08: 15. Check-in rejected with 400 ROOM_NOT_READY when room is dirty', async () => {
  const service = new FrontDeskStayService();

  // Room 102 (Arjun Das) has room cleanliness status 'dirty'
  const result = await service.processCheckIn(mockFrontDeskStaff, 'stay_seed_102', {
    verifyIdAtDesk: true,
    docType: 'national_id',
    docNumber: 'ID-102-9988',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'ROOM_NOT_READY');
});

test('DEV3-TASK-08: 16. Check-in succeeds with supervisor override for unready room', async () => {
  const service = new FrontDeskStayService();

  // Duty Manager overrides room cleanliness check
  const result = await service.processCheckIn(mockDutyManager, 'stay_seed_102', {
    verifyIdAtDesk: true,
    docType: 'national_id',
    docNumber: 'ID-102-9988',
    overrideRoomUnready: true,
    notes: 'Duty manager expedited check-in while turndown is completed.',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.status, 'checked_in');
});

test('DEV3-TASK-08: 17. Check-in for cancelled reservation rejected with 400', async () => {
  const service = new FrontDeskStayService();

  const result = await service.processCheckIn(mockFrontDeskStaff, 'stay_seed_303', {
    verifyIdAtDesk: true,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'RESERVATION_CANCELLED');
});

test('DEV3-TASK-08: 18. Check-in for already checked-in stay rejected with 400', async () => {
  const service = new FrontDeskStayService();

  const result = await service.processCheckIn(mockFrontDeskStaff, 'stay_seed_402', {
    verifyIdAtDesk: true,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'ALREADY_CHECKED_IN');
});

test('DEV3-TASK-08: 19. Check-in rejected with 409 ROOM_OCCUPIED if room is occupied by another stay', async () => {
  const service = new FrontDeskStayService();
  const repo = InMemoryGuestStayRepository.getInstance();

  // Create an overlapping expected arrival stay assigned to Room 402 (which is already occupied by Aarav Sharma)
  const conflictingStay = {
    id: 'stay_conflict_402',
    propertyId: 'prop_grand_adp_01',
    bookingReference: 'BK-402-CONF',
    guestFirstName: 'Dev',
    guestLastName: 'Anand',
    guestEmail: 'dev.anand@example.com',
    guestPhone: null,
    welcomeTvPin: '4022',
    status: 'pending_verify',
    checkInTime: new Date(),
    checkOutTime: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const conflictingRoom = {
    id: 'room_assign_conflict_402',
    stayId: 'stay_conflict_402',
    roomId: 'room_id_402',
    roomNumber: '402',
    propertyId: 'prop_grand_adp_01',
    floor: 4,
    roomType: 'Deluxe Suite',
    dndActive: false,
    cleanlinessStatus: 'ready',
    assignedAt: new Date(),
    unassignedAt: null,
    isCurrent: true,
  };

  repo.registerStay(conflictingStay, conflictingRoom, {
    idVerificationStatus: 'verified',
  });

  const result = await service.processCheckIn(mockFrontDeskStaff, 'stay_conflict_402', {
    verifyIdAtDesk: true,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 409);
  assert.equal(result.error?.code, 'ROOM_OCCUPIED');
});
