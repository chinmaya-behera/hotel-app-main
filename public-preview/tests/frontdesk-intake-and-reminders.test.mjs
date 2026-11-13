import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryGuestStayRepository,
} from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import {
  MockTaskEngineService,
} from '../src/server/modules/operations/MockTaskEngineService.ts';
import {
  CaseIntakeService,
  CaseIntakeSchema,
} from '../src/server/modules/frontdesk/CaseIntakeService.ts';
import {
  InMemoryCaseIntakeRepository,
} from '../src/server/modules/frontdesk/repositories/CaseIntakeRepository.ts';
import {
  GuestReminderService,
  CreateGuestReminderSchema,
  UpdateGuestReminderSchema,
} from '../src/server/modules/frontdesk/GuestReminderService.ts';
import {
  InMemoryGuestReminderRepository,
} from '../src/server/modules/frontdesk/repositories/GuestReminderRepository.ts';

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
  staffId: 'staff_unauth_01',
  name: 'Guest User',
  role: 'guest',
};

test.beforeEach(() => {
  InMemoryGuestStayRepository.getInstance().reset();
  MockTaskEngineService.getInstance().reset();
  InMemoryCaseIntakeRepository.getInstance().reset();
  InMemoryGuestReminderRepository.getInstance().reset();
});

// ============================================================================
// PART 1 — DEV3-TASK-11: FRONT DESK MANUAL CASE & DISPUTE INTAKE
// ============================================================================

test('DEV3-TASK-11: 1. Valid manual complaint intake submits successfully and dispatches to Task Engine', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'complaint',
    department: 'Maintenance',
    title: 'Water pressure low in bathroom',
    description: 'Guest reports weak water pressure in the master shower since morning.',
    priority: 'urgent',
    channel: 'walk_in',
    roomNumber: '402',
    proposedCompensation: 0,
    severity: 'normal',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.caseRef, /^CMP-2026-/);
  assert.equal(result.data.category, 'complaint');
  assert.equal(result.data.department, 'Maintenance');
  assert.equal(result.data.roomNumber, '402');
  assert.match(result.data.guestName || '', /Aarav Sharma/);
  assert.equal(result.data.stayId, 'stay_seed_402');
  assert.ok(result.data.taskId);
  assert.ok(result.data.createdAt);

  // Verify Developer 2 task engine received the task
  const createdTasks = MockTaskEngineService.getInstance().getCreatedCases();
  assert.ok(createdTasks.length >= 1);
  const task = createdTasks.find((t) => t.taskId === result.data?.taskId);
  assert.ok(task);
  assert.equal(task.department, 'Maintenance');
});

test('DEV3-TASK-11: 2. Financial dispute within ₹2,500 threshold does not require escalation', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'dispute',
    department: 'Finance',
    title: 'Disputed minibar charge for nuts',
    description: 'Guest claims they did not consume salted almonds listed on billing statement.',
    priority: 'normal',
    channel: 'in_person',
    roomNumber: '402',
    disputedAmount: 450,
    currency: 'INR',
    relatedCharge: 'Minibar - Food & Beverage',
    preferredResolution: 'charge_removal',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.caseRef, /^DSP-2026-/);
  assert.equal(result.data.disputedAmount, 450);
  assert.equal(result.data.escalationRequired, false); // Within ₹2,500 limit (F31 rule)
});

test('DEV3-TASK-11: 3. Financial dispute above ₹2,500 threshold flags escalation required', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'dispute',
    department: 'Finance',
    title: 'Disputed spa package charge',
    description: 'Guest claims double-charge for full body massage session on folio.',
    priority: 'urgent',
    channel: 'front_desk',
    roomNumber: '402',
    disputedAmount: 6500, // Above ₹2,500 limit
    currency: 'INR',
    relatedCharge: 'Spa Wellness Package',
    preferredResolution: 'folio_credit',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.equal(result.data.disputedAmount, 6500);
  assert.equal(result.data.escalationRequired, true); // Requires Duty Manager / GM approval
  assert.match(result.data.message, /escalated/i);
});

test('DEV3-TASK-11: 4. Valid manual service request intake links stay context automatically', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'request',
    department: 'Housekeeping',
    title: 'Extra dental kits requested',
    description: 'Deliver two extra dental care kits and shaving cream to room.',
    priority: 'normal',
    channel: 'phone',
    stayId: 'stay_seed_402',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.caseRef, /^REQ-2026-/);
  assert.equal(result.data.roomNumber, '402'); // Auto-populated from stay
  assert.match(result.data.guestName || '', /Aarav Sharma/);
});

test('DEV3-TASK-11: 5. Valid manual incident intake with evidence attachments submits successfully', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'incident',
    department: 'Security',
    title: 'Keycard reader damaged on 4th floor corridor',
    description: 'Plastic faceplate on door lock 402 is cracked; reported by floor attendant.',
    priority: 'urgent',
    channel: 'in_person',
    roomNumber: '402',
    attachments: [
      {
        name: 'lock_crack_photo.jpg',
        url: 'https://storage.example.com/evidence/lock_crack_photo.jpg',
        size: 1048576,
        mimeType: 'image/jpeg',
      },
    ],
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.caseRef, /^INC-2026-/);
  assert.equal(result.data.category, 'incident');
  assert.equal(result.data.department, 'Security');
});

test('DEV3-TASK-11: 6. Duplicate intake request with same idempotency key returns cached result', async () => {
  const service = new CaseIntakeService();
  const idempotencyKey = 'idem_case_intake_test_key_001';

  const payload = {
    category: 'request',
    department: 'Housekeeping',
    title: 'Iron and ironing board',
    description: 'Deliver steam iron and board to room 402.',
    priority: 'normal',
    channel: 'phone',
    roomNumber: '402',
    idempotencyKey,
  };

  // First submission
  const first = await service.submitCaseIntake(mockFrontDeskStaff, payload, idempotencyKey);
  assert.equal(first.success, true);
  assert.equal(first.statusCode, 201);

  // Second submission with exact same key
  const second = await service.submitCaseIntake(mockFrontDeskStaff, payload, idempotencyKey);
  assert.equal(second.success, true);
  assert.equal(second.statusCode, 200);
  assert.equal(second.data?.caseId, first.data?.caseId);
  assert.equal(second.data?.caseRef, first.data?.caseRef);
  assert.match(second.data?.message || '', /idempotent/i);

  // Verify only 1 task was created in Developer 2 engine
  const cases = MockTaskEngineService.getInstance().getCreatedCases();
  const matches = cases.filter((c) => c.caseId === first.data?.caseId);
  assert.equal(matches.length, 1);
});

test('DEV3-TASK-11: 7. Missing disputedAmount for financial dispute is rejected by validation', () => {
  const invalid = CaseIntakeSchema.safeParse({
    category: 'dispute',
    department: 'Finance',
    title: 'Disputed minibar charges',
    description: 'Guest disputes minibar consumption.',
    priority: 'normal',
    // disputedAmount omitted
  });

  assert.equal(invalid.success, false);
});

test('DEV3-TASK-11: 8. Nonexistent room number returns 404 ROOM_NOT_FOUND', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'request',
    department: 'Housekeeping',
    title: 'Extra towels',
    description: 'Guest requested two bath towels.',
    priority: 'normal',
    channel: 'phone',
    roomNumber: '9999', // Nonexistent room
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'ROOM_NOT_FOUND');
});

test('DEV3-TASK-11: 9. Nonexistent stay ID returns 404 STAY_NOT_FOUND', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockFrontDeskStaff, {
    category: 'request',
    department: 'Housekeeping',
    title: 'Extra towels',
    description: 'Guest requested two bath towels.',
    priority: 'normal',
    channel: 'phone',
    stayId: 'stay_nonexistent_999',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'STAY_NOT_FOUND');
});

test('DEV3-TASK-11: 10. Unauthorized staff role is rejected with 403 FORBIDDEN', async () => {
  const service = new CaseIntakeService();

  const result = await service.submitCaseIntake(mockUnauthorizedStaff, {
    category: 'complaint',
    department: 'Maintenance',
    title: 'Noise complaint',
    description: 'Loud music from next door room.',
    priority: 'normal',
    channel: 'in_person',
    roomNumber: '402',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'FORBIDDEN');
});

// ============================================================================
// PART 2 — DEV3-TASK-12: GUEST REMINDERS & ALARMS (F30)
// ============================================================================

test('DEV3-TASK-12: 11. Create valid guest reminder successfully associates room and stay', async () => {
  const service = new GuestReminderService();

  const result = await service.createReminder(mockFrontDeskStaff, {
    roomNumber: '402',
    title: 'Morning wake-up call with espresso',
    instructions: 'Ring phone twice and deliver freshly brewed double espresso.',
    reminderType: 'wake_up_call',
    dueDate: 'Tomorrow',
    dueTime: '06:45',
    leadMinutes: 15,
    priority: 'vip',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.match(result.data.id, /^rem_/);
  assert.equal(result.data.roomNumber, '402');
  assert.match(result.data.guestName, /Aarav Sharma/);
  assert.equal(result.data.stayId, 'stay_seed_402');
  assert.equal(result.data.dueTime, '06:45');
  assert.equal(result.data.status, 'pending');
  assert.equal(result.data.alarmState, 'scheduled');
  assert.ok(result.data.dueDateTimeMs);
  assert.ok(result.data.alertAtMs);
  assert.equal(result.data.alertAtMs, result.data.dueDateTimeMs - 15 * 60 * 1000);
});

test('DEV3-TASK-12: 12. Retrieve reminders with accurate status counts and filtering', async () => {
  const service = new GuestReminderService();

  const result = await service.getReminders(mockFrontDeskStaff);
  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.ok(result.data.reminders.length >= 3);

  const { counts } = result.data;
  assert.equal(counts.total, result.data.reminders.length);
  assert.ok(counts.completed >= 1); // rem-demo-3 is completed

  // Filter by tab 'completed'
  const completedResult = await service.getReminders(mockFrontDeskStaff, { tab: 'completed' });
  assert.equal(completedResult.success, true);
  for (const r of completedResult.data?.reminders || []) {
    assert.equal(r.status, 'completed');
  }

  // Filter by roomNumber
  const room402Result = await service.getReminders(mockFrontDeskStaff, { roomNumber: '402' });
  assert.equal(room402Result.success, true);
  for (const r of room402Result.data?.reminders || []) {
    assert.equal(r.roomNumber, '402');
  }
});

test('DEV3-TASK-12: 13. Search filter matches title, guest name, or room number', async () => {
  const service = new GuestReminderService();

  const searchResult = await service.getReminders(mockFrontDeskStaff, { search: 'limousine' });
  assert.equal(searchResult.success, true);
  assert.ok(searchResult.data);
  assert.ok(searchResult.data.reminders.length >= 1);
  assert.match(searchResult.data.reminders[0].title, /Limousine/i);
});

test('DEV3-TASK-12: 14. Duplicate reminder for same room, same time, and same title is rejected with 409', async () => {
  const service = new GuestReminderService();

  // Create first reminder
  const first = await service.createReminder(mockFrontDeskStaff, {
    roomNumber: '202',
    title: 'Airport Transfer Shuttle',
    dueDate: 'Tomorrow',
    dueTime: '15:00',
    leadMinutes: 30,
    priority: 'normal',
  });
  assert.equal(first.success, true);

  // Attempt duplicate
  const second = await service.createReminder(mockFrontDeskStaff, {
    roomNumber: '202',
    title: 'Airport Transfer Shuttle',
    dueDate: 'Tomorrow',
    dueTime: '15:00',
    leadMinutes: 30,
    priority: 'normal',
  });

  assert.equal(second.success, false);
  assert.equal(second.statusCode, 409);
  assert.equal(second.error?.code, 'DUPLICATE_REMINDER');
});

test('DEV3-TASK-12: 15. Invalid date or time format is rejected with 400', async () => {
  const service = new GuestReminderService();

  // Invalid time 25:99
  const invalidTime = await service.createReminder(mockFrontDeskStaff, {
    roomNumber: '202',
    title: 'Wakeup',
    dueDate: 'Today',
    dueTime: '25:99',
  });
  assert.equal(invalidTime.success, false);
  assert.equal(invalidTime.statusCode, 400);

  // Invalid date format
  const invalidDate = await service.createReminder(mockFrontDeskStaff, {
    roomNumber: '202',
    title: 'Wakeup',
    dueDate: 'invalid-date-format',
    dueTime: '08:00',
  });
  assert.equal(invalidDate.success, false);
  assert.equal(invalidDate.statusCode, 400);
});

test('DEV3-TASK-12: 16. Acknowledge and snooze reminder updates alarm state and history', async () => {
  const service = new GuestReminderService();

  // 1. Acknowledge ringing reminder rem-demo-1
  const ackResult = await service.updateReminderAction(mockFrontDeskStaff, 'rem-demo-1', {
    action: 'acknowledge',
    notes: 'Front Desk acknowledged ringing alarm.',
  });

  assert.equal(ackResult.success, true);
  assert.equal(ackResult.statusCode, 200);
  assert.equal(ackResult.data?.alarmState, 'acknowledged');
  assert.equal(ackResult.data?.status, 'acknowledged');

  // 2. Snooze the reminder for 10 minutes
  const snoozeResult = await service.updateReminderAction(mockFrontDeskStaff, 'rem-demo-1', {
    action: 'snooze',
    snoozeMinutes: 10,
    notes: 'Guest requested 10 minute grace snooze.',
  });

  assert.equal(snoozeResult.success, true);
  assert.equal(snoozeResult.statusCode, 200);
  assert.equal(snoozeResult.data?.alarmState, 'snoozed');
  assert.equal(snoozeResult.data?.status, 'snoozed');
  assert.equal(snoozeResult.data?.snoozeCount, 1);
  assert.ok(snoozeResult.data?.snoozedUntilMs);
  assert.ok(snoozeResult.data?.snoozedUntilIso);
  assert.ok(snoozeResult.data?.history.length >= 3);
});

test('DEV3-TASK-12: 17. Complete reminder transitions state to completed and sets completedAt', async () => {
  const service = new GuestReminderService();

  const completeResult = await service.updateReminderAction(mockFrontDeskStaff, 'rem-demo-2', {
    action: 'complete',
    notes: 'Limousine departure confirmed with chauffeur.',
  });

  assert.equal(completeResult.success, true);
  assert.equal(completeResult.statusCode, 200);
  assert.equal(completeResult.data?.status, 'completed');
  assert.equal(completeResult.data?.alarmState, 'completed');
  assert.ok(completeResult.data?.completedAt);
});

test('DEV3-TASK-12: 18. Cancel reminder transitions status to cancelled', async () => {
  const service = new GuestReminderService();

  const cancelResult = await service.updateReminderAction(mockFrontDeskStaff, 'rem-demo-2', {
    action: 'cancel',
    notes: 'Guest rescheduled flight to tomorrow.',
  });

  assert.equal(cancelResult.success, true);
  assert.equal(cancelResult.statusCode, 200);
  assert.equal(cancelResult.data?.status, 'cancelled');
});

test('DEV3-TASK-12: 19. Nonexistent reminder ID returns 404 REMINDER_NOT_FOUND', async () => {
  const service = new GuestReminderService();

  const result = await service.updateReminderAction(mockFrontDeskStaff, 'rem-nonexistent-999', {
    action: 'complete',
  });

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'REMINDER_NOT_FOUND');
});

test('DEV3-TASK-12: 20. Unauthorized staff role is rejected with 403 FORBIDDEN', async () => {
  const service = new GuestReminderService();

  const getResult = await service.getReminders(mockUnauthorizedStaff);
  assert.equal(getResult.success, false);
  assert.equal(getResult.statusCode, 403);
  assert.equal(getResult.error?.code, 'FORBIDDEN');

  const createResult = await service.createReminder(mockUnauthorizedStaff, {
    roomNumber: '402',
    title: 'Wakeup',
    dueDate: 'Today',
    dueTime: '09:00',
  });
  assert.equal(createResult.success, false);
  assert.equal(createResult.statusCode, 403);
  assert.equal(createResult.error?.code, 'FORBIDDEN');
});

test('DEV3-TASK-12: 21. Delete reminder removes record successfully', async () => {
  const service = new GuestReminderService();

  const deleteResult = await service.deleteReminder(mockFrontDeskStaff, 'rem-demo-1');
  assert.equal(deleteResult.success, true);
  assert.equal(deleteResult.statusCode, 200);

  // Verifying it is gone
  const getResult = await service.updateReminderAction(mockFrontDeskStaff, 'rem-demo-1', { action: 'complete' });
  assert.equal(getResult.success, false);
  assert.equal(getResult.statusCode, 404);
});
