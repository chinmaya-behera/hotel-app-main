import test from 'node:test';
import assert from 'node:assert/strict';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';
import {
  GuestFeedbackService,
  SubmitFeedbackSchema,
} from '../src/server/modules/guest/GuestFeedbackService.ts';
import {
  InMemoryGuestFeedbackRepository,
} from '../src/server/modules/guest/repositories/GuestFeedbackRepository.ts';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import {
  RoomDiscoveryService,
} from '../src/server/modules/public/RoomDiscoveryService.ts';
import {
  OnlineBookingService,
  CreateBookingSchema,
} from '../src/server/modules/public/OnlineBookingService.ts';
import {
  InMemoryRoomCatalogRepository,
  InMemoryBookingRepository,
} from '../src/server/modules/public/repositories/RoomCatalogRepository.ts';
import { MockTaskQueryService } from '../src/server/modules/operations/MockTaskQueryService.ts';

test.beforeEach(() => {
  QrAuthService.clearTestData();
  InMemoryGuestStayRepository.getInstance().reset();
  InMemoryGuestFeedbackRepository.getInstance().reset();
  InMemoryBookingRepository.getInstance().reset();
  MockTaskQueryService.getInstance().reset();
});

// Helper to create an active session for Room 402 (Aarav Sharma)
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

// ============================================================================
// DEV3-TASK-05: GUEST FEEDBACK & STAR RATINGS
// ============================================================================

test('DEV3-TASK-05: 1. Guest successfully submits 5-star feedback on completed task', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // In MockTaskQueryService, 'task_req_402_02' (In-Room Dining) has status 'completed'
  const service = new GuestFeedbackService();
  const result = await service.submitFeedback(sessionToken, {
    taskId: 'task_req_402_02',
    rating: 5,
    comment: 'Towels arrived warm and fluffy within 10 minutes. Exceptional service!',
    tags: ['Prompt', 'Friendly', 'Courteous'],
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.equal(result.data.taskId, 'task_req_402_02');
  assert.equal(result.data.rating, 5);
  assert.equal(result.data.roomNumber, '402');
  assert.equal(result.data.comment, 'Towels arrived warm and fluffy within 10 minutes. Exceptional service!');
  assert.deepEqual(result.data.tags, ['Prompt', 'Friendly', 'Courteous']);
  assert.ok(result.data.feedbackId);
  assert.ok(result.data.submittedAt);
});

test('DEV3-TASK-05: 2. Feedback rejected with 400 when task is still in progress', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  // In MockTaskQueryService, 'task_req_402_01' (Extra Linens) is 'on_the_way'
  const service = new GuestFeedbackService();
  const result = await service.submitFeedback(sessionToken, {
    taskId: 'task_req_402_01',
    rating: 4,
    comment: 'Pillows look good.',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'TASK_NOT_COMPLETED');
});

test('DEV3-TASK-05: 3. Feedback rejected with 404 when taskId does not belong to the guest', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestFeedbackService();
  const result = await service.submitFeedback(sessionToken, {
    taskId: 'task_seed_alien_999',
    rating: 5,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'TASK_NOT_FOUND');
});

test('DEV3-TASK-05: 4. Duplicate feedback rejected with 409 conflict', async () => {
  const sessionToken = await createActiveSession402();
  assert.ok(sessionToken);

  const service = new GuestFeedbackService();

  // First feedback submission
  const first = await service.submitFeedback(sessionToken, {
    taskId: 'task_req_402_02',
    rating: 5,
    comment: 'Great service.',
  });
  assert.equal(first.success, true);

  // Duplicate submission attempt
  const second = await service.submitFeedback(sessionToken, {
    taskId: 'task_req_402_02',
    rating: 1,
    comment: 'Actually changed my mind.',
  });

  assert.equal(second.success, false);
  assert.equal(second.statusCode, 409);
  assert.equal(second.error?.code, 'FEEDBACK_ALREADY_EXISTS');
});

test('DEV3-TASK-05: 5. Zod schema rejects invalid ratings (< 1 or > 5) and empty taskId', () => {
  const invalidLow = SubmitFeedbackSchema.safeParse({ taskId: 'task_1', rating: 0 });
  assert.equal(invalidLow.success, false);

  const invalidHigh = SubmitFeedbackSchema.safeParse({ taskId: 'task_1', rating: 6 });
  assert.equal(invalidHigh.success, false);

  const missingTask = SubmitFeedbackSchema.safeParse({ taskId: '', rating: 5 });
  assert.equal(missingTask.success, false);

  const valid = SubmitFeedbackSchema.safeParse({ taskId: 'task_1', rating: 4 });
  assert.equal(valid.success, true);
});

test('DEV3-TASK-05: 6. Unauthenticated feedback request rejected with 401', async () => {
  const service = new GuestFeedbackService();
  const result = await service.submitFeedback('invalid_garbage_token', {
    taskId: 'task_req_402_02',
    rating: 5,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.error?.code, 'UNAUTHORIZED');
});

// ============================================================================
// DEV3-TASK-06: PUBLIC ROOM DISCOVERY & RESERVATION ENGINE
// ============================================================================

test('DEV3-TASK-06: 7. Public room discovery returns rooms without authentication', async () => {
  const service = new RoomDiscoveryService();
  const result = await service.searchRooms({});

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.ok(result.data.rooms.length > 0);
  assert.equal(result.data.totalCount, result.data.rooms.length);

  // Verify projection fields (no private staff or guest data exposed)
  const firstRoom = result.data.rooms[0];
  assert.ok(firstRoom.roomId);
  assert.ok(firstRoom.roomNumber);
  assert.ok(firstRoom.roomType);
  assert.ok(firstRoom.basePricePerNight > 0);
  assert.ok(Array.isArray(firstRoom.amenities));
  assert.ok(Array.isArray(firstRoom.images));
  assert.equal(firstRoom.currentGuest, undefined);
  assert.equal(firstRoom.staffNotes, undefined);
});

test('DEV3-TASK-06: 8. Room discovery filters by roomType and guest capacity', async () => {
  const service = new RoomDiscoveryService();

  // Filter by Presidential Suite
  const presResult = await service.searchRooms({ roomType: 'Presidential' });
  assert.equal(presResult.success, true);
  assert.ok(presResult.data?.rooms.every((r) => r.roomType.toLowerCase().includes('presidential')));

  // Filter by guest capacity (e.g. 4 guests)
  const capResult = await service.searchRooms({ guests: 4 });
  assert.equal(capResult.success, true);
  assert.ok(capResult.data?.rooms.every((r) => r.maxGuests >= 4));
});

test('DEV3-TASK-06: 9. Room discovery detects booked intervals and filters unavailable rooms', async () => {
  const service = new RoomDiscoveryService();

  // In seed data, Room 402 has a booking covering now - 1 day to now + 2 days
  const now = new Date();
  const checkIn = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString().split('T')[0];
  const checkOut = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString().split('T')[0];

  const searchOverlapping = await service.searchRooms({
    checkIn,
    checkOut,
  });

  assert.equal(searchOverlapping.success, true);
  // Room 402 should be omitted because of overlap
  const has402 = searchOverlapping.data?.rooms.some((r) => r.roomNumber === '402');
  assert.equal(has402, false);

  // Other rooms like 101 or 201 should be available
  const has101 = searchOverlapping.data?.rooms.some((r) => r.roomNumber === '101');
  assert.equal(has101, true);

  // Search far in the future (e.g. +30 days)
  const futureCheckIn = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const futureCheckOut = new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const searchFuture = await service.searchRooms({
    checkIn: futureCheckIn,
    checkOut: futureCheckOut,
  });

  assert.equal(searchFuture.success, true);
  // Room 402 is available far in the future
  const has402Future = searchFuture.data?.rooms.some((r) => r.roomNumber === '402');
  assert.equal(has402Future, true);
});

test('DEV3-TASK-06: 10. Room discovery validates dates properly', async () => {
  const service = new RoomDiscoveryService();

  // Missing checkOut when checkIn is given
  const missingOut = await service.searchRooms({ checkIn: '2026-12-01' });
  assert.equal(missingOut.success, false);
  assert.equal(missingOut.statusCode, 400);

  // CheckIn in past
  const pastCheckIn = await service.searchRooms({ checkIn: '2020-01-01', checkOut: '2020-01-05' });
  assert.equal(pastCheckIn.success, false);
  assert.equal(pastCheckIn.statusCode, 400);

  // CheckOut before CheckIn
  const invalidOrder = await service.searchRooms({ checkIn: '2026-12-05', checkOut: '2026-12-01' });
  assert.equal(invalidOrder.success, false);
  assert.equal(invalidOrder.statusCode, 400);
});

test('DEV3-TASK-06: 11. Online booking engine successfully creates reservation', async () => {
  const service = new OnlineBookingService();
  const futureCheckIn = '2026-12-10';
  const futureCheckOut = '2026-12-13';

  const result = await service.createBooking({
    roomId: 'room_id_201',
    checkInDate: futureCheckIn,
    checkOutDate: futureCheckOut,
    guestFirstName: 'Rohan',
    guestLastName: 'Verma',
    guestEmail: 'rohan.verma@example.com',
    guestPhone: '+91 98765 11223',
    numberOfGuests: 2,
    specialRequests: 'High floor preferred, extra pillows.',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.ok(result.data.bookingReference.startsWith('BK-201-'));
  assert.ok(result.data.welcomeTvPin);
  assert.equal(result.data.welcomeTvPin.length, 4);
  assert.equal(result.data.roomNumber, '201');
  assert.equal(result.data.roomType, 'Deluxe King');
  assert.equal(result.data.nights, 3);
  assert.equal(result.data.totalAmount, 3 * 270);
  assert.equal(result.data.status, 'reserved');
  assert.equal(result.data.guestFirstName, 'Rohan');
  assert.equal(result.data.guestLastName, 'Verma');
});

test('DEV3-TASK-06: 12. Overlapping reservation rejected with 409 conflict', async () => {
  const service = new OnlineBookingService();
  const futureCheckIn = '2026-12-20';
  const futureCheckOut = '2026-12-25';

  // First booking succeeds
  const first = await service.createBooking({
    roomId: 'room_id_101',
    checkInDate: futureCheckIn,
    checkOutDate: futureCheckOut,
    guestFirstName: 'Pooja',
    guestLastName: 'Mehta',
    guestEmail: 'pooja.mehta@example.com',
    guestPhone: '+91 98765 99887',
    numberOfGuests: 2,
  });
  assert.equal(first.success, true);

  // Second booking for overlapping dates (Dec 22 - Dec 27) fails with 409
  const second = await service.createBooking({
    roomId: 'room_id_101',
    checkInDate: '2026-12-22',
    checkOutDate: '2026-12-27',
    guestFirstName: 'Vikram',
    guestLastName: 'Singh',
    guestEmail: 'vikram.singh@example.com',
    guestPhone: '+91 98765 33445',
    numberOfGuests: 2,
  });

  assert.equal(second.success, false);
  assert.equal(second.statusCode, 409);
  assert.equal(second.error?.code, 'ROOM_UNAVAILABLE');
});

test('DEV3-TASK-06: 13. Exceeding room max capacity rejected with 400', async () => {
  const service = new OnlineBookingService();

  // Deluxe King accommodates max 2 guests. Requesting 4 guests must fail.
  const result = await service.createBooking({
    roomId: 'room_id_201',
    checkInDate: '2026-12-15',
    checkOutDate: '2026-12-18',
    guestFirstName: 'Anita',
    guestLastName: 'Desai',
    guestEmail: 'anita.desai@example.com',
    guestPhone: '+91 98765 55667',
    numberOfGuests: 4,
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'CAPACITY_EXCEEDED');
});

test('DEV3-TASK-06: 14. Idempotency key returns cached confirmation without duplicate booking', async () => {
  const service = new OnlineBookingService();
  const idempotencyKey = 'idemp_key_unique_test_123';

  const bookingInput = {
    roomId: 'room_id_505',
    checkInDate: '2026-12-10',
    checkOutDate: '2026-12-14',
    guestFirstName: 'Karan',
    guestLastName: 'Johar',
    guestEmail: 'karan.j@example.com',
    guestPhone: '+91 98765 00000',
    numberOfGuests: 2,
    idempotencyKey,
  };

  const first = await service.createBooking(bookingInput);
  assert.equal(first.success, true);
  assert.equal(first.statusCode, 201);

  // Duplicate submission with the same idempotency key
  const second = await service.createBooking(bookingInput);
  assert.equal(second.success, true);
  assert.equal(second.statusCode, 200);
  assert.equal(second.data?.bookingReference, first.data?.bookingReference);
  assert.equal(second.data?.welcomeTvPin, first.data?.welcomeTvPin);
});
