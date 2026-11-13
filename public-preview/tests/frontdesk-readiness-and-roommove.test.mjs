import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import {
  MockCleanlinessInspectionService,
} from '../src/server/modules/operations/MockCleanlinessInspectionService.ts';
import {
  MockTaskEngineService,
} from '../src/server/modules/operations/MockTaskEngineService.ts';
import {
  QrAuthService,
} from '../src/server/modules/guest/QrAuthService.ts';
import {
  RoomReadinessService,
  UpdateRoomReadinessSchema,
} from '../src/server/modules/frontdesk/RoomReadinessService.ts';
import {
  RoomMoveService,
  RoomMoveSchema,
} from '../src/server/modules/frontdesk/RoomMoveService.ts';

const mockFrontDeskStaff = {
  staffId: 'staff_fd_01',
  name: 'Sunita Patel',
  role: 'front_desk',
};

const mockSupervisorStaff = {
  staffId: 'staff_hk_sup_01',
  name: 'Devika Sharma',
  role: 'housekeeping_supervisor',
};

const mockDutyManager = {
  staffId: 'staff_dm_01',
  name: 'Marcus Vance',
  role: 'duty_manager',
};

const mockUnauthorizedStaff = {
  staffId: 'staff_unauth_01',
  name: 'Guest User',
  role: 'guest',
};

test.beforeEach(() => {
  InMemoryGuestStayRepository.getInstance().reset();
  MockCleanlinessInspectionService.getInstance().reset();
  MockTaskEngineService.getInstance().reset();
  QrAuthService.clearTestData();
});

// ============================================================================
// PART 1 — DEV3-TASK-09: FRONT DESK ROOM READINESS BOARD & CLEANLINESS SYNC
// ============================================================================

test('DEV3-TASK-09: 1. Front Desk retrieves room readiness board with accurate counts', async () => {
  const service = new RoomReadinessService();
  const result = await service.getReadinessBoard(mockFrontDeskStaff);

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.ok(result.data.rooms.length > 0);

  const { counts } = result.data;
  assert.equal(counts.total, result.data.rooms.length);
  assert.ok(counts.ready > 0);
  assert.ok(counts.occupied >= 1); // Room 402 is occupied by Aarav Sharma
  assert.ok(counts.vacant > 0);

  // Verify occupied room flag and guest context
  const room402 = result.data.rooms.find((r) => r.roomNumber === '402');
  assert.ok(room402);
  assert.equal(room402.isOccupied, true);
  assert.equal(room402.canCheckIn, false); // Cannot check into occupied room
  assert.match(room402.currentGuestName || '', /Aarav Sharma/);

  // Verify vacant ready room flag
  const room202 = result.data.rooms.find((r) => r.roomNumber === '202');
  assert.ok(room202);
  assert.equal(room202.isOccupied, false);
  assert.equal(room202.readinessStatus, 'ready');
  assert.equal(room202.canCheckIn, true);
});

test('DEV3-TASK-09: 2. Query filter by floor restricts room items to selected floor', async () => {
  const service = new RoomReadinessService();
  const result = await service.getReadinessBoard(mockFrontDeskStaff, { floor: 2 });

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.ok(result.data.rooms.length > 0);
  for (const room of result.data.rooms) {
    assert.equal(room.floor, 2);
  }
});

test('DEV3-TASK-09: 3. Query filter by readiness status filters accurately', async () => {
  const service = new RoomReadinessService();
  const result = await service.getReadinessBoard(mockFrontDeskStaff, { readiness: 'dirty' });

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.ok(result.data.rooms.length > 0);
  for (const room of result.data.rooms) {
    assert.equal(room.readinessStatus, 'dirty');
  }
});

test('DEV3-TASK-09: 4. Query filter by occupancy filters occupied and vacant rooms', async () => {
  const service = new RoomReadinessService();

  const occupiedResult = await service.getReadinessBoard(mockFrontDeskStaff, { occupancy: 'occupied' });
  assert.equal(occupiedResult.success, true);
  assert.ok(occupiedResult.data);
  for (const room of occupiedResult.data.rooms) {
    assert.equal(room.isOccupied, true);
  }

  const vacantResult = await service.getReadinessBoard(mockFrontDeskStaff, { occupancy: 'vacant' });
  assert.equal(vacantResult.success, true);
  assert.ok(vacantResult.data);
  for (const room of vacantResult.data.rooms) {
    assert.equal(room.isOccupied, false);
  }
});

test('DEV3-TASK-09: 5. Search query matches room number, room type, or guest name', async () => {
  const service = new RoomReadinessService();

  // Search by guest name
  const guestSearchResult = await service.getReadinessBoard(mockFrontDeskStaff, { search: 'Aarav' });
  assert.equal(guestSearchResult.success, true);
  assert.ok(guestSearchResult.data);
  assert.equal(guestSearchResult.data.rooms.length, 1);
  assert.equal(guestSearchResult.data.rooms[0].roomNumber, '402');

  // Search by room number
  const roomSearchResult = await service.getReadinessBoard(mockFrontDeskStaff, { search: '202' });
  assert.equal(roomSearchResult.success, true);
  assert.ok(roomSearchResult.data);
  assert.equal(roomSearchResult.data.rooms.length, 1);
  assert.equal(roomSearchResult.data.rooms[0].roomNumber, '202');
});

test('DEV3-TASK-09: 6. Front Desk agent can update room to dirty or cleaning', async () => {
  const service = new RoomReadinessService();

  const updateResult = await service.updateReadiness(mockFrontDeskStaff, {
    roomNumber: '202',
    targetStatus: 'cleaning',
    notes: 'Housekeeper began refresh cleaning.',
  });

  assert.equal(updateResult.success, true);
  assert.equal(updateResult.statusCode, 200);
  assert.ok(updateResult.data);
  assert.equal(updateResult.data.roomNumber, '202');
  assert.equal(updateResult.data.previousStatus, 'ready');
  assert.equal(updateResult.data.currentStatus, 'cleaning');

  // Verify status reflected on board
  const inspectionMock = MockCleanlinessInspectionService.getInstance();
  assert.equal(inspectionMock.getStatus('202'), 'cleaning');
});

test('DEV3-TASK-09: 7. Front Desk agent cannot mark room ready without supervisor role (F21 guard)', async () => {
  const service = new RoomReadinessService();

  // Room 102 starts dirty
  const updateResult = await service.updateReadiness(mockFrontDeskStaff, {
    roomNumber: '102',
    targetStatus: 'ready',
    notes: 'Front desk attempting to mark clean directly without inspection.',
  });

  assert.equal(updateResult.success, false);
  assert.equal(updateResult.statusCode, 403);
  assert.equal(updateResult.error?.code, 'UNAUTHORIZED_STATUS_CHANGE');
  assert.match(updateResult.error?.message || '', /supervisor/i);
});

test('DEV3-TASK-09: 8. Supervisor or Duty Manager successfully marks room ready after inspection (F21)', async () => {
  const service = new RoomReadinessService();

  const updateResult = await service.updateReadiness(mockSupervisorStaff, {
    roomNumber: '102',
    targetStatus: 'ready',
    notes: 'Housekeeping supervisor passed physical room inspection.',
    inspectionPassed: true,
  });

  assert.equal(updateResult.success, true);
  assert.equal(updateResult.statusCode, 200);
  assert.ok(updateResult.data);
  assert.equal(updateResult.data.currentStatus, 'ready');

  const inspectionMock = MockCleanlinessInspectionService.getInstance();
  assert.equal(inspectionMock.getStatus('102'), 'ready');
});

test('DEV3-TASK-09: 9. Cannot place occupied room out of order before moving guest (F27 guard)', async () => {
  const service = new RoomReadinessService();

  // Room 402 is occupied by Ananya Sharma
  const updateResult = await service.updateReadiness(mockDutyManager, {
    roomNumber: '402',
    targetStatus: 'out_of_order',
    notes: 'Maintenance required.',
  });

  assert.equal(updateResult.success, false);
  assert.equal(updateResult.statusCode, 400);
  assert.equal(updateResult.error?.code, 'CANNOT_BLOCK_OCCUPIED_ROOM');
});

test('DEV3-TASK-09: 10. Duty Manager successfully blocks vacant room out of order (F27)', async () => {
  const service = new RoomReadinessService();

  // Room 202 is vacant
  const updateResult = await service.updateReadiness(mockDutyManager, {
    roomNumber: '202',
    targetStatus: 'out_of_order',
    notes: 'Deep plumbing inspection scheduled.',
  });

  assert.equal(updateResult.success, true);
  assert.equal(updateResult.statusCode, 200);
  assert.ok(updateResult.data);
  assert.equal(updateResult.data.currentStatus, 'out_of_order');

  const inspectionMock = MockCleanlinessInspectionService.getInstance();
  assert.equal(inspectionMock.getStatus('202'), 'out_of_order');
});

test('DEV3-TASK-09: 11. Unauthorized staff role is rejected with 403 FORBIDDEN', async () => {
  const service = new RoomReadinessService();

  const getResult = await service.getReadinessBoard(mockUnauthorizedStaff);
  assert.equal(getResult.success, false);
  assert.equal(getResult.statusCode, 403);
  assert.equal(getResult.error?.code, 'FORBIDDEN');

  const patchResult = await service.updateReadiness(mockUnauthorizedStaff, {
    roomNumber: '202',
    targetStatus: 'cleaning',
  });
  assert.equal(patchResult.success, false);
  assert.equal(patchResult.statusCode, 403);
  assert.equal(patchResult.error?.code, 'FORBIDDEN');
});

test('DEV3-TASK-09: 12. Zod schema validation rejects invalid target status', () => {
  const invalid = UpdateRoomReadinessSchema.safeParse({
    roomNumber: '202',
    targetStatus: 'sparkling_clean',
  });

  assert.equal(invalid.success, false);
});

// ============================================================================
// PART 2 — DEV3-TASK-10: FRONT DESK ROOM MOVE ENGINE & SESSION REVOCATION
// ============================================================================

test('DEV3-TASK-10: 13. Valid room move moves active guest from Room 402 to Room 202', async () => {
  const service = new RoomMoveService();

  // Initial state: stay_seed_402 is checked_in in Room 402
  const moveResult = await service.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Air conditioning malfunction in Room 402',
    notes: 'Guest requested higher floor or equivalent suite on Floor 2',
  });

  assert.equal(moveResult.success, true);
  assert.equal(moveResult.statusCode, 200);
  assert.ok(moveResult.data);
  assert.equal(moveResult.data.stayId, 'stay_seed_402');
  assert.equal(moveResult.data.previousRoomNumber, '402');
  assert.equal(moveResult.data.newRoomNumber, '202');
  assert.equal(moveResult.data.turnoverTaskCreated, true);
  assert.ok(moveResult.data.turnoverTaskId);
  assert.ok(moveResult.data.movedAt);
});

test('DEV3-TASK-10: 14. Destination room becomes occupied, and old room is marked dirty', async () => {
  const moveService = new RoomMoveService();
  const readinessService = new RoomReadinessService();
  const inspectionMock = MockCleanlinessInspectionService.getInstance();

  await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Guest room upgrade on request',
  });

  // Old room 402 must now be dirty
  assert.equal(inspectionMock.getStatus('402'), 'dirty');

  // Check readiness board: Room 202 is now occupied; Room 402 is now vacant and dirty
  const board = await readinessService.getReadinessBoard(mockFrontDeskStaff);
  assert.equal(board.success, true);

  const room202 = board.data?.rooms.find((r) => r.roomNumber === '202');
  assert.ok(room202);
  assert.equal(room202.isOccupied, true);
  assert.equal(room202.canCheckIn, false);
  assert.match(room202.currentGuestName || '', /Aarav Sharma/);

  const room402 = board.data?.rooms.find((r) => r.roomNumber === '402');
  assert.ok(room402);
  assert.equal(room402.isOccupied, false);
  assert.equal(room402.readinessStatus, 'dirty');
  assert.equal(room402.canCheckIn, false); // Not ready because it is dirty
});

test('DEV3-TASK-10: 15. Old room guest QR session is immediately revoked with reason room_move', async () => {
  // 1. Establish active QR session for Room 402
  const qrAuth = new QrAuthService();
  const validSig402 = QrAuthService.generateHmacSignature('402');
  const loginResult = await qrAuth.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: validSig402,
    guestLastName: 'Sharma',
    verificationCode: 'BK-7892-0402',
  });

  assert.equal(loginResult.success, true);
  const sessionToken = loginResult.data?.sessionToken;
  assert.ok(sessionToken);

  // Verify session is active before move
  const preCheck = QrAuthService.validateSession(sessionToken);
  assert.equal(preCheck.valid, true);

  // 2. Perform Room Move
  const moveService = new RoomMoveService();
  const moveResult = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Noise complaint from adjacent room',
  });

  assert.equal(moveResult.success, true);
  assert.equal(moveResult.data?.oldSessionsRevoked, 1);

  // 3. Security invariant check: old session is immediately rejected with reason 'room_move'
  const postCheck = QrAuthService.validateSession(sessionToken);
  assert.equal(postCheck.valid, false);
  assert.equal(postCheck.reason, 'room_move');
});

test('DEV3-TASK-10: 16. Guest must re-authenticate using the new room QR code', async () => {
  const qrAuth = new QrAuthService();
  const moveService = new RoomMoveService();

  // Move guest to Room 202
  await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Room maintenance',
  });

  // Attempting to re-auth against old room 402 fails (no active stay in Room 402)
  const oldSig = QrAuthService.generateHmacSignature('402');
  const oldAuth = await qrAuth.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: oldSig,
    guestLastName: 'Sharma',
    verificationCode: 'BK-7892-0402',
  });
  assert.equal(oldAuth.success, false);

  // Authenticating against new room 202 succeeds!
  const newSig202 = QrAuthService.generateHmacSignature('202');
  const newAuth = await qrAuth.verifyAndCreateSession({
    roomNumber: '202',
    qrSignature: newSig202,
    guestLastName: 'Sharma',
    verificationCode: 'BK-7892-0402',
  });

  assert.equal(newAuth.success, true);
  assert.ok(newAuth.data?.sessionToken);
  assert.equal(newAuth.data?.roomNumber, '202');
  assert.equal(newAuth.data?.stayId, 'stay_seed_402');

  const newSessionCheck = QrAuthService.validateSession(newAuth.data.sessionToken);
  assert.equal(newSessionCheck.valid, true);
  assert.equal(newSessionCheck.session?.roomNumber, '202');
});

test('DEV3-TASK-10: 17. Room assignment history is preserved across room moves', async () => {
  const moveService = new RoomMoveService();

  await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Water heater issue in Room 402',
  });

  const history = await moveService.getStayRoomHistory('stay_seed_402');
  assert.equal(history.length, 2);

  const [oldAssignment, currentAssignment] = history;
  assert.equal(oldAssignment.roomNumber, '402');
  assert.equal(oldAssignment.isCurrent, false);
  assert.ok(oldAssignment.unassignedAt);
  assert.equal(oldAssignment.cleanlinessStatus, 'dirty');

  assert.equal(currentAssignment.roomNumber, '202');
  assert.equal(currentAssignment.isCurrent, true);
  assert.equal(currentAssignment.unassignedAt, null);
});

test('DEV3-TASK-10: 18. Turnover cleaning task is dispatched via Developer 2 Task Engine', async () => {
  const moveService = new RoomMoveService();
  const taskEngine = MockTaskEngineService.getInstance();

  const moveResult = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Plumbing repair in old room',
  });

  assert.equal(moveResult.success, true);
  const createdTasks = taskEngine.getCreatedCases();
  assert.ok(createdTasks.length >= 1);

  const turnoverTask = createdTasks.find((t) => t.category === 'Turnover Cleaning');
  assert.ok(turnoverTask);
  assert.equal(turnoverTask.department, 'Housekeeping');
  assert.equal(turnoverTask.taskId, moveResult.data?.turnoverTaskId);
});

test('DEV3-TASK-10: 19. Move to the exact same room is rejected with 400 SAME_ROOM_MOVE_REJECTED', async () => {
  const moveService = new RoomMoveService();

  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '402',
    reason: 'Attempting to move to current room',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'SAME_ROOM_MOVE_REJECTED');
});

test('DEV3-TASK-10: 20. Move to an occupied destination room is rejected with 409 DESTINATION_ROOM_OCCUPIED', async () => {
  const moveService = new RoomMoveService();
  const repo = InMemoryGuestStayRepository.getInstance();

  // Create another in-house stay occupying Room 202
  repo.registerStay(
    {
      id: 'stay_inhouse_202',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-202-OCCU',
      guestFirstName: 'Deepak',
      guestLastName: 'Chopra',
      guestEmail: 'deepak@example.com',
      guestPhone: null,
      welcomeTvPin: '2020',
      status: 'checked_in',
      checkInTime: new Date(),
      checkOutTime: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'room_assign_inhouse_202',
      stayId: 'stay_inhouse_202',
      roomId: 'room_id_202',
      roomNumber: '202',
      propertyId: 'prop_grand_adp_01',
      floor: 2,
      roomType: 'Deluxe King',
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: new Date(),
      unassignedAt: null,
      isCurrent: true,
    },
  );

  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Move attempt to occupied room',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 409);
  assert.equal(result.error?.code, 'DESTINATION_ROOM_OCCUPIED');
});

test('DEV3-TASK-10: 21. Move to unready/dirty room is rejected with 400 DESTINATION_ROOM_NOT_READY', async () => {
  const moveService = new RoomMoveService();

  // Room 102 has cleanlinessStatus 'dirty'
  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '102',
    reason: 'Move to dirty room',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'DESTINATION_ROOM_NOT_READY');
});

test('DEV3-TASK-10: 22. Supervisor override allows move to unready room when overrideUnready is true', async () => {
  const moveService = new RoomMoveService();

  // Move with supervisor override
  const result = await moveService.executeRoomMove(mockDutyManager, 'stay_seed_402', {
    toRoomNumber: '102',
    reason: 'Emergency move while housekeeping completes turndown',
    overrideUnready: true,
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.newRoomNumber, '102');
});

test('DEV3-TASK-10: 23. Move to out-of-order room is rejected with 400 DESTINATION_ROOM_OUT_OF_ORDER', async () => {
  const moveService = new RoomMoveService();

  // Room 302 is out_of_order
  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '302',
    reason: 'Move to out of order room',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'DESTINATION_ROOM_OUT_OF_ORDER');
});

test('DEV3-TASK-10: 24. Move for non-checked-in stay is rejected with 400 STAY_NOT_ACTIVE', async () => {
  const moveService = new RoomMoveService();

  // stay_seed_201 is status 'reserved' (not checked_in)
  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_201', {
    toRoomNumber: '202',
    reason: 'Guest requested different room prior to arrival',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'STAY_NOT_ACTIVE');
});

test('DEV3-TASK-10: 25. Nonexistent stay ID returns 404 STAY_NOT_FOUND', async () => {
  const moveService = new RoomMoveService();

  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_nonexistent_999', {
    toRoomNumber: '202',
    reason: 'Move for nonexistent stay',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'STAY_NOT_FOUND');
});

test('DEV3-TASK-10: 26. Nonexistent destination room returns 404 DESTINATION_ROOM_NOT_FOUND', async () => {
  const moveService = new RoomMoveService();

  const result = await moveService.executeRoomMove(mockFrontDeskStaff, 'stay_seed_402', {
    toRoomNumber: '9999',
    reason: 'Move to nonexistent room number',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'DESTINATION_ROOM_NOT_FOUND');
});

test('DEV3-TASK-10: 27. Unauthorized staff role is rejected with 403 FORBIDDEN', async () => {
  const moveService = new RoomMoveService();

  const result = await moveService.executeRoomMove(mockUnauthorizedStaff, 'stay_seed_402', {
    toRoomNumber: '202',
    reason: 'Guest trying to execute their own room move',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'FORBIDDEN');
});

test('DEV3-TASK-10: 28. Zod schema validation rejects empty or too-short reason', () => {
  const invalid = RoomMoveSchema.safeParse({
    toRoomNumber: '202',
    reason: 'no', // too short (< 3 chars)
  });

  assert.equal(invalid.success, false);
});
