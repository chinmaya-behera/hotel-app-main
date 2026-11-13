import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LostFoundService,
  CreateLostFoundItemSchema,
  ClaimLostFoundItemSchema,
  ReleaseLostFoundItemSchema,
} from '../src/server/modules/frontdesk/LostFoundService.ts';
import {
  InMemoryLostFoundRepository,
} from '../src/server/modules/frontdesk/repositories/LostFoundRepository.ts';
import {
  EmergencyAlertService,
  CreateEmergencyAlertSchema,
  AcknowledgeAlertSchema,
  ResolveAlertSchema,
  CancelAlertSchema,
} from '../src/server/modules/frontdesk/EmergencyAlertService.ts';
import {
  InMemoryEmergencyAlertRepository,
} from '../src/server/modules/frontdesk/repositories/EmergencyAlertRepository.ts';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';

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
  staffId: 'staff_guest_01',
  name: 'Random Caller',
  role: 'guest',
};

test.beforeEach(() => {
  InMemoryLostFoundRepository.getInstance().reset();
  InMemoryEmergencyAlertRepository.getInstance().reset();
  InMemoryGuestStayRepository.getInstance().reset();
});

// ============================================================================
// PART 1 — DEV3-TASK-13: FRONT DESK LOST & FOUND REGISTRY & MATCHING ENGINE
// ============================================================================

test('DEV3-TASK-13: 1. Valid registration of found item returns 201 Created with ref and STORED status', async () => {
  const service = new LostFoundService();

  const result = await service.registerItem(mockFrontDeskStaff, {
    itemName: 'Bose QuietComfort 45 Headphones',
    category: 'electronics',
    description: 'Black over-ear noise cancelling headphones in black zip case.',
    foundLocation: 'Spa Reception Waiting Area',
    foundDate: '2026-11-13',
    foundTime: '11:15',
    storageLocation: 'Front Desk Electronics Cabinet B',
    sensitive: false,
    initialStatus: 'STORED',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.ref, /^LF-2026-/);
  assert.equal(result.data.itemName, 'Bose QuietComfort 45 Headphones');
  assert.equal(result.data.category, 'electronics');
  assert.equal(result.data.status, 'STORED');
  assert.equal(result.data.storageLocation, 'Front Desk Electronics Cabinet B');
  assert.equal(result.data.registeredByStaffId, 'staff_fd_01');
  assert.equal(result.data.history.length, 2); // FOUND + STORED
});

test('DEV3-TASK-13: 2. Attachment metadata registration integrates via IStorageService', async () => {
  const service = new LostFoundService();

  const result = await service.registerItem(mockFrontDeskStaff, {
    itemName: 'Silver iPad Pro 11-inch',
    category: 'electronics',
    description: 'Engraved with initials A.S. on the back corner.',
    foundLocation: 'Business Center Desk 3',
    foundDate: '2026-11-13',
    storageLocation: 'Security Safe 02',
    sensitive: false,
    attachment: {
      fileName: 'ipad_photo.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 2048500,
      fileSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.ok(result.data.photoStorageKey);
  assert.match(result.data.photoUrl || '', /^https:\/\/storage\.grand-hotel\.local\/attachments\//);
});

test('DEV3-TASK-13: 3. Sensitive items mask photo URL in general query listings for privacy', async () => {
  const service = new LostFoundService();

  // Register sensitive item (e.g. Leather wallet containing cards)
  const regResult = await service.registerItem(mockFrontDeskStaff, {
    itemName: 'Brown Bifold Wallet with ID',
    category: 'jewelry_valuables',
    description: 'Contains driver license, metro card, and cash.',
    foundLocation: 'Elevator Lobby 3rd Floor',
    foundDate: '2026-11-13',
    storageLocation: 'Duty Manager Safe',
    sensitive: true, // Sensitive flag enabled
    attachment: {
      fileName: 'wallet_contents.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1024000,
      fileSha256: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    },
  });

  assert.equal(regResult.success, true);
  assert.ok(regResult.data);
  assert.ok(regResult.data.photoUrl); // Returned on direct creation/detail

  // General list query must mask the photoUrl for sensitive items
  const listResult = await service.getItems(mockFrontDeskStaff);
  assert.equal(listResult.success, true);
  assert.ok(listResult.data);

  const foundInList = listResult.data.items.find((item) => item.id === regResult.data?.id);
  assert.ok(foundInList);
  assert.equal(foundInList.sensitive, true);
  assert.equal(foundInList.photoUrl, undefined); // Masked for guest privacy
});

test('DEV3-TASK-13: 4. Query filtering by category, room number, location, and status works with inventory counts', async () => {
  const service = new LostFoundService();

  // Query seeded electronics items
  const filterResult = await service.getItems(mockFrontDeskStaff, {
    category: 'electronics',
  });

  assert.equal(filterResult.success, true);
  assert.ok(filterResult.data);
  assert.ok(filterResult.data.items.length >= 1);
  assert.equal(filterResult.data.items.every((i) => i.category === 'electronics'), true);
  assert.ok(filterResult.data.counts.total >= 3);
  assert.ok(filterResult.data.counts.stored >= 1);
});

test('DEV3-TASK-13: 5. Claimant contact numbers are masked (******XXXX) in general list responses', async () => {
  const service = new LostFoundService();

  // Item lf_seed_002 has claimant contact: '+1 555-019-2834'
  const listResult = await service.getItems(mockFrontDeskStaff);
  assert.equal(listResult.success, true);
  assert.ok(listResult.data);

  const pendingItem = listResult.data.items.find((i) => i.id === 'lf_seed_002');
  assert.ok(pendingItem);
  assert.equal(pendingItem.claimantContact, '******2834');
});

test('DEV3-TASK-13: 6. Submitting a claim transitions item to CLAIM_PENDING with claimant details', async () => {
  const service = new LostFoundService();

  const claimResult = await service.claimItem(mockFrontDeskStaff, 'lf_seed_001', {
    claimantName: 'Rohan Verma',
    claimantContact: '+91 99887 76655',
    verificationMethod: 'item_description_match',
    claimNotes: 'Guest described the unique blue leather loop tag and scratched corner accurately.',
    releaseNow: false,
  });

  assert.equal(claimResult.success, true);
  assert.equal(claimResult.statusCode, 200);
  assert.ok(claimResult.data);
  assert.equal(claimResult.data.status, 'CLAIM_PENDING');
  assert.equal(claimResult.data.claimantName, 'Rohan Verma');
  assert.equal(claimResult.data.claimantVerificationMethod, 'item_description_match');
  assert.ok(claimResult.data.claimedAt);
  assert.equal(claimResult.data.history.some((h) => h.status === 'CLAIM_PENDING'), true);
});

test('DEV3-TASK-13: 7. Releasing an item to verified claimant transitions status to RELEASED with staff audit info', async () => {
  const service = new LostFoundService();

  // Item lf_seed_002 is CLAIM_PENDING for Marcus Chen
  const releaseResult = await service.releaseItem(mockFrontDeskStaff, 'lf_seed_002', {
    claimantName: 'Marcus Chen',
    verificationMethod: 'government_id',
    releaseNotes: 'Guest presented US Passport matching name and photo. Handed over wallet with all contents intact.',
  });

  assert.equal(releaseResult.success, true);
  assert.equal(releaseResult.statusCode, 200);
  assert.ok(releaseResult.data);
  assert.equal(releaseResult.data.status, 'RELEASED');
  assert.equal(releaseResult.data.releasedByStaffId, 'staff_fd_01');
  assert.ok(releaseResult.data.releasedAt);
  assert.equal(releaseResult.data.history.some((h) => h.status === 'RELEASED'), true);
});

test('DEV3-TASK-13: 8. Direct claim execution with releaseNow: true transitions directly to RELEASED', async () => {
  const service = new LostFoundService();

  // lf_seed_001 is STORED
  const directResult = await service.claimItem(mockFrontDeskStaff, 'lf_seed_001', {
    claimantName: 'Elena Rostova',
    claimantContact: '+1 415-555-0199',
    verificationMethod: 'room_verification',
    claimNotes: 'Guest was currently checking out at desk and identified the AirTag serial.',
    releaseNow: true,
  });

  assert.equal(directResult.success, true);
  assert.equal(directResult.statusCode, 200);
  assert.ok(directResult.data);
  assert.equal(directResult.data.status, 'RELEASED');
  assert.equal(directResult.data.claimantName, 'Elena Rostova');
  assert.ok(directResult.data.releasedAt);
  assert.equal(directResult.data.releasedByStaffId, 'staff_fd_01');
});

test('DEV3-TASK-13: 9. Invalid status transitions rejected (RELEASED cannot transition back to STORED)', async () => {
  const service = new LostFoundService();

  // Item lf_seed_003 is already RELEASED
  const updateResult = await service.updateItem(mockFrontDeskStaff, 'lf_seed_003', {
    status: 'STORED',
  });

  assert.equal(updateResult.success, false);
  assert.equal(updateResult.statusCode, 400);
  assert.equal(updateResult.error?.code, 'INVALID_STATUS_TRANSITION');
});

test('DEV3-TASK-13: 10. Nonexistent item returns 404 ITEM_NOT_FOUND', async () => {
  const service = new LostFoundService();

  const getResult = await service.getItemById(mockFrontDeskStaff, 'lf_nonexistent_999');
  assert.equal(getResult.success, false);
  assert.equal(getResult.statusCode, 404);
  assert.equal(getResult.error?.code, 'ITEM_NOT_FOUND');
});

test('DEV3-TASK-13: 11. Unauthorized staff role is rejected with 403 FORBIDDEN', async () => {
  const service = new LostFoundService();

  const result = await service.registerItem(mockUnauthorizedStaff, {
    itemName: 'Watch',
    category: 'jewelry_valuables',
    description: 'Gold watch',
    foundLocation: 'Lobby',
    foundDate: '2026-11-13',
    storageLocation: 'Desk',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'FORBIDDEN');
});

test('DEV3-TASK-13: 12. Duplicate registration with idempotency key returns cached item', async () => {
  const service = new LostFoundService();
  const idempotencyKey = 'idem_key_lf_register_001';

  const firstCall = await service.registerItem(
    mockFrontDeskStaff,
    {
      itemName: 'Kindle Paperwhite in Blue Case',
      category: 'electronics',
      description: 'E-reader left on pool lounger.',
      foundLocation: 'Poolside',
      foundDate: '2026-11-13',
      storageLocation: 'Front Desk Shelf 1',
    },
    idempotencyKey,
  );

  assert.equal(firstCall.success, true);
  assert.equal(firstCall.statusCode, 201);
  assert.ok(firstCall.data);

  // Re-run with the same idempotency key
  const secondCall = await service.registerItem(
    mockFrontDeskStaff,
    {
      itemName: 'Kindle Paperwhite in Blue Case',
      category: 'electronics',
      description: 'E-reader left on pool lounger.',
      foundLocation: 'Poolside',
      foundDate: '2026-11-13',
      storageLocation: 'Front Desk Shelf 1',
    },
    idempotencyKey,
  );

  assert.equal(secondCall.success, true);
  assert.equal(secondCall.statusCode, 200); // 200 OK from cache
  assert.equal(secondCall.data?.id, firstCall.data?.id);
  assert.equal(secondCall.data?.ref, firstCall.data?.ref);
});

// ============================================================================
// PART 2 — DEV3-TASK-14: FRONT DESK EMERGENCY ALERT BROADCAST SYSTEM
// ============================================================================

test('DEV3-TASK-14: 13. Creating draft alert returns 201 Created with status DRAFT and recipient target count', async () => {
  const service = new EmergencyAlertService();

  const result = await service.createDraftAlert(mockFrontDeskStaff, {
    title: 'Severe Thunderstorm & High Winds Advisory',
    alertType: 'severe_weather',
    severity: 'warning',
    message: 'High winds expected between 18:00 and 22:00. Please secure balcony doors.',
    instructions: 'Close all balcony sliders and keep curtains drawn. Pool area is closed until further notice.',
    targetScope: 'hotel_wide',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.ref, /^EMG-2026-/);
  assert.equal(result.data.status, 'DRAFT'); // Strictly DRAFT initially
  assert.ok(result.data.targetRecipientCount > 0);
  assert.equal(result.data.broadcastDeliveryStatus, 'simulated');
  assert.equal(result.data.auditHistory.length, 1);
  assert.equal(result.data.auditHistory[0].action, 'DRAFT_CREATED');
});

test('DEV3-TASK-14: 14. Explicit activation transitions DRAFT -> ACTIVE and reports broadcastDeliveryStatus: simulated', async () => {
  const service = new EmergencyAlertService();

  // Create a draft first
  const draftResult = await service.createDraftAlert(mockDutyManager, {
    title: 'Elevator Bank A Maintenance Shutoff',
    alertType: 'life_safety',
    severity: 'urgent',
    message: 'Elevator Bank A will be shut down for emergency cable inspection.',
    instructions: 'Use Elevator Bank B or the central service stairs located near room X12.',
    targetScope: 'hotel_wide',
  });

  assert.equal(draftResult.success, true);
  const alertId = draftResult.data?.id || '';

  // Explicitly activate
  const activateResult = await service.activateAlert(mockDutyManager, alertId);
  assert.equal(activateResult.success, true);
  assert.equal(activateResult.statusCode, 200);
  assert.ok(activateResult.data);
  assert.equal(activateResult.data.status, 'ACTIVE');
  assert.equal(activateResult.data.activatedByStaffId, 'staff_dm_01');
  assert.ok(activateResult.data.activatedAt);
  assert.equal(activateResult.data.broadcastDeliveryStatus, 'simulated');
  assert.equal(activateResult.data.auditHistory.some((a) => a.action === 'ACTIVATED'), true);
});

test('DEV3-TASK-14: 15. Duplicate activation attempt on active alert is rejected with 400 ALERT_ALREADY_ACTIVE', async () => {
  const service = new EmergencyAlertService();

  // emg_seed_001 is already seeded as ACTIVE
  const result = await service.activateAlert(mockDutyManager, 'emg_seed_001');

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.error?.code, 'ALERT_ALREADY_ACTIVE');
});

test('DEV3-TASK-14: 16. Targeted recipient records acknowledgement successfully and enforces idempotency', async () => {
  const service = new EmergencyAlertService();

  // emg_seed_001 is ACTIVE targeting Floor 4 (includes staff_hk_01 Sunita Patel and stay_seed_402)
  // 1. Record new acknowledgement from staff_hk_01
  const ackResult = await service.acknowledgeAlert('emg_seed_001', {
    recipientId: 'staff_hk_01',
    recipientType: 'staff',
    recipientName: 'Sunita Patel',
  });

  assert.equal(ackResult.success, true);
  assert.equal(ackResult.statusCode, 200);
  assert.ok(ackResult.data);
  assert.equal(ackResult.data.acknowledgements.length, 2);
  const staffAck = ackResult.data.acknowledgements.find((a) => a.recipientId === 'staff_hk_01');
  assert.ok(staffAck);
  assert.equal(staffAck.recipientName, 'Sunita Patel');
  assert.ok(staffAck.acknowledgedAt);

  // 2. Duplicate acknowledgement from already acknowledged stay_seed_402 is idempotent
  const dupResult = await service.acknowledgeAlert('emg_seed_001', {
    recipientId: 'stay_seed_402',
    recipientType: 'guest',
    recipientName: 'Aarav Sharma',
    roomNumber: '402',
  });

  assert.equal(dupResult.success, true);
  assert.equal(dupResult.data?.acknowledgements.length, 2); // Idempotent: does not create duplicate
});

test('DEV3-TASK-14: 17. Recipient outside targeted scope is rejected with 403 RECIPIENT_NOT_ELIGIBLE', async () => {
  const service = new EmergencyAlertService();

  // Create a room-scoped alert targeting only Room 501
  const draft = await service.createDraftAlert(mockDutyManager, {
    title: 'Room 501 Water Isolation Notice',
    alertType: 'other',
    severity: 'warning',
    message: 'Water supply isolated for Room 501 plumbing inspection.',
    instructions: 'Bottled water provided at door.',
    targetScope: 'room',
    targetRooms: ['501'],
  });

  assert.equal(draft.success, true);
  const alertId = draft.data?.id || '';
  await service.activateAlert(mockDutyManager, alertId);

  // Guest from Room 402 attempts to acknowledge an alert targeted only to Room 501
  const ackResult = await service.acknowledgeAlert(alertId, {
    recipientId: 'stay_seed_402',
    recipientType: 'guest',
    recipientName: 'Aarav Sharma',
    roomNumber: '402',
  });

  assert.equal(ackResult.success, false);
  assert.equal(ackResult.statusCode, 403);
  assert.equal(ackResult.error?.code, 'RECIPIENT_NOT_ELIGIBLE');
});

test('DEV3-TASK-14: 18. Acknowledgement on non-active alert is rejected with 400 ALERT_NOT_ACTIVE', async () => {
  const service = new EmergencyAlertService();

  // emg_seed_002 is seeded in DRAFT status
  const ackResult = await service.acknowledgeAlert('emg_seed_002', {
    recipientId: 'stay_seed_402',
    recipientType: 'guest',
    recipientName: 'Aarav Sharma',
    roomNumber: '402',
  });

  assert.equal(ackResult.success, false);
  assert.equal(ackResult.statusCode, 400);
  assert.equal(ackResult.error?.code, 'ALERT_NOT_ACTIVE');
});

test('DEV3-TASK-14: 19. Resolving an active alert requires resolution notes and transitions status to RESOLVED', async () => {
  const service = new EmergencyAlertService();

  // emg_seed_001 is ACTIVE
  const resolveResult = await service.resolveAlert(mockDutyManager, 'emg_seed_001', {
    resolutionNotes: 'Scheduled drill completed safely. All floor wardens reported clear corridors.',
  });

  assert.equal(resolveResult.success, true);
  assert.equal(resolveResult.statusCode, 200);
  assert.ok(resolveResult.data);
  assert.equal(resolveResult.data.status, 'RESOLVED');
  assert.equal(resolveResult.data.resolvedByStaffId, 'staff_dm_01');
  assert.ok(resolveResult.data.resolvedAt);
  assert.equal(
    resolveResult.data.resolutionNotes,
    'Scheduled drill completed safely. All floor wardens reported clear corridors.',
  );
  assert.equal(resolveResult.data.auditHistory.some((a) => a.action === 'RESOLVED'), true);
});

test('DEV3-TASK-14: 20. Cancelling an alert requires reason and transitions status to CANCELLED', async () => {
  const service = new EmergencyAlertService();

  // emg_seed_002 is DRAFT
  const cancelResult = await service.cancelAlert(mockFrontDeskStaff, 'emg_seed_002', {
    reason: 'Power grid stabilized by utility company; scheduled backup generator test postponed.',
  });

  assert.equal(cancelResult.success, true);
  assert.equal(cancelResult.statusCode, 200);
  assert.ok(cancelResult.data);
  assert.equal(cancelResult.data.status, 'CANCELLED');
  assert.equal(cancelResult.data.cancelledByStaffId, 'staff_fd_01');
  assert.ok(cancelResult.data.cancelledAt);
  assert.equal(
    cancelResult.data.cancelledReason,
    'Power grid stabilized by utility company; scheduled backup generator test postponed.',
  );
});

test('DEV3-TASK-14: 21. Re-activating a cancelled or resolved alert is rejected with 400 INVALID_STATUS_TRANSITION', async () => {
  const service = new EmergencyAlertService();

  // Cancel emg_seed_002 first
  await service.cancelAlert(mockDutyManager, 'emg_seed_002', {
    reason: 'Cancelled drill',
  });

  // Attempt to activate a cancelled alert
  const activateResult = await service.activateAlert(mockDutyManager, 'emg_seed_002');
  assert.equal(activateResult.success, false);
  assert.equal(activateResult.statusCode, 400);
  assert.equal(activateResult.error?.code, 'INVALID_STATUS_TRANSITION');
});

test('DEV3-TASK-14: 22. Nonexistent alert returns 404 ALERT_NOT_FOUND', async () => {
  const service = new EmergencyAlertService();

  const result = await service.getAlertById(mockFrontDeskStaff, 'emg_nonexistent_999');
  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'ALERT_NOT_FOUND');
});

test('DEV3-TASK-14: 23. Unauthorized staff role is rejected with 403 FORBIDDEN on alert drafting and activation', async () => {
  const service = new EmergencyAlertService();

  const draftResult = await service.createDraftAlert(mockUnauthorizedStaff, {
    title: 'Unauthorized Emergency Alert',
    alertType: 'security',
    severity: 'critical',
    message: 'Unauthorized test',
    instructions: 'Evacuate now',
    targetScope: 'hotel_wide',
  });

  assert.equal(draftResult.success, false);
  assert.equal(draftResult.statusCode, 403);
  assert.equal(draftResult.error?.code, 'FORBIDDEN');
});
