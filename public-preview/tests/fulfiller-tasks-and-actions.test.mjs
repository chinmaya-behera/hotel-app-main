import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FulfillerService,
} from '../src/server/modules/fulfiller/FulfillerService.ts';
import {
  MockTaskStore,
} from '../src/server/modules/operations/MockTaskStore.ts';
import {
  MockTaskQueryService,
} from '../src/server/modules/operations/MockTaskQueryService.ts';
import {
  MockTaskLifecycleService,
} from '../src/server/modules/operations/MockTaskLifecycleService.ts';

const mockFulfillerVikram = {
  staffId: 'EMP-0103',
  name: 'Vikram Singh',
  role: 'task_fulfiller',
  department: 'Housekeeping',
};

const mockFulfillerWei = {
  staffId: 'EMP-0112',
  name: 'Wei Chen',
  role: 'task_fulfiller',
  department: 'Maintenance & Engineering',
};

const mockSupervisorMeera = {
  staffId: 'EMP-0105',
  name: 'Meera Nambiar',
  role: 'department_supervisor',
  department: 'Housekeeping',
};

const mockUnauthorizedCaller = {
  staffId: 'guest_user_999',
  name: 'Anonymous Caller',
  role: 'guest',
};

test.beforeEach(() => {
  MockTaskStore.getInstance().reset();
  MockTaskQueryService.getInstance().reset();
  MockTaskLifecycleService.getInstance().reset();
});

// ============================================================================
// PART 1 — DEV3-TASK-15: FULFILLER MY TASKS PROJECTION
// ============================================================================

test('DEV3-TASK-15: 1. Authenticated fulfiller sees only their assigned tasks', async () => {
  const service = new FulfillerService();

  const result = await service.getMyTasks(mockFulfillerVikram);

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.ok(result.data.tasks.length >= 4);
  // All tasks must be assigned to Vikram Singh (EMP-0103)
  assert.equal(
    result.data.tasks.every((t) => t.assignedToStaffId === 'EMP-0103'),
    true,
  );
  // Tasks assigned to Wei Chen (EMP-0112) must NOT be present
  assert.equal(
    result.data.tasks.some((t) => t.assignedToStaffId === 'EMP-0112'),
    false,
  );
});

test('DEV3-TASK-15: 2. Cross-fulfiller task isolation: Wei Chen sees only maintenance tasks', async () => {
  const service = new FulfillerService();

  const result = await service.getMyTasks(mockFulfillerWei);

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.equal(result.data.tasks.length, 1);
  assert.equal(result.data.tasks[0].taskId, 'task_ful_005');
  assert.equal(result.data.tasks[0].assignedToStaffId, 'EMP-0112');
  assert.equal(result.data.tasks[0].department, 'Maintenance & Engineering');
});

test('DEV3-TASK-15: 3. Dynamic status counts are accurately derived from canonical task records', async () => {
  const service = new FulfillerService();

  const result = await service.getMyTasks(mockFulfillerVikram);

  assert.equal(result.success, true);
  assert.ok(result.data);
  const counts = result.data.counts;
  assert.equal(counts.total, 4);
  assert.equal(counts.assigned, 1); // task_ful_001
  assert.equal(counts.in_progress, 1); // task_ful_002
  assert.equal(counts.blocked, 1); // task_ful_003
  assert.equal(counts.completed, 1); // task_ful_004
});

test('DEV3-TASK-15: 4. Filter by status returns strictly matching tasks', async () => {
  const service = new FulfillerService();

  // Query only assigned tasks
  const assignedResult = await service.getMyTasks(mockFulfillerVikram, { status: 'assigned' });
  assert.equal(assignedResult.success, true);
  assert.ok(assignedResult.data);
  assert.equal(assignedResult.data.tasks.length, 1);
  assert.equal(assignedResult.data.tasks[0].status, 'assigned');
  assert.equal(assignedResult.data.tasks[0].taskId, 'task_ful_001');

  // Query only blocked tasks
  const blockedResult = await service.getMyTasks(mockFulfillerVikram, { status: 'blocked' });
  assert.equal(blockedResult.success, true);
  assert.ok(blockedResult.data);
  assert.equal(blockedResult.data.tasks.length, 1);
  assert.equal(blockedResult.data.tasks[0].status, 'blocked');
  assert.equal(blockedResult.data.tasks[0].taskId, 'task_ful_003');
  assert.equal(blockedResult.data.tasks[0].guestDndActive, true);
});

test('DEV3-TASK-15: 5. Filter by priority returns strictly matching tasks', async () => {
  const service = new FulfillerService();

  const result = await service.getMyTasks(mockFulfillerVikram, { priority: 'urgent' });
  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.equal(result.data.tasks.length, 1);
  assert.equal(result.data.tasks[0].priority, 'urgent');
  assert.equal(result.data.tasks[0].taskId, 'task_ful_001');
});

test('DEV3-TASK-15: 6. Sorting by priority places urgent tasks first', async () => {
  const service = new FulfillerService();

  const result = await service.getMyTasks(mockFulfillerVikram, {
    sortBy: 'priority',
    sortOrder: 'desc',
  });

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.equal(result.data.tasks[0].priority, 'urgent'); // task_ful_001 is urgent
  assert.equal(result.data.tasks[result.data.tasks.length - 1].priority, 'low'); // task_ful_004 is low
});

test('DEV3-TASK-15: 7. Pagination limits page size and reports totalPages', async () => {
  const service = new FulfillerService();

  const page1 = await service.getMyTasks(mockFulfillerVikram, { page: 1, limit: 2 });
  assert.equal(page1.success, true);
  assert.ok(page1.data);
  assert.equal(page1.data.tasks.length, 2);
  assert.equal(page1.data.pagination.page, 1);
  assert.equal(page1.data.pagination.limit, 2);
  assert.equal(page1.data.pagination.total, 4);
  assert.equal(page1.data.pagination.totalPages, 2);

  const page2 = await service.getMyTasks(mockFulfillerVikram, { page: 2, limit: 2 });
  assert.equal(page2.success, true);
  assert.ok(page2.data);
  assert.equal(page2.data.tasks.length, 2);
  assert.equal(page2.data.pagination.page, 2);
});

test('DEV3-TASK-15: 8. Task details by ID returns checklist and event timeline', async () => {
  const service = new FulfillerService();

  const result = await service.getTaskById(mockFulfillerVikram, 'task_ful_001');

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.equal(result.data.taskId, 'task_ful_001');
  assert.equal(result.data.roomNumber, '402');
  assert.equal(result.data.floor, 4);
  assert.ok(result.data.checklistItems.length >= 3);
  assert.ok(result.data.events.length >= 1);
  assert.equal(result.data.events[0].action, 'ASSIGNED');
});

test('DEV3-TASK-15: 9. Cross-staff task access is rejected with 403 FORBIDDEN', async () => {
  const service = new FulfillerService();

  // Vikram (EMP-0103) tries to view task_ful_005 assigned to Wei Chen (EMP-0112)
  const result = await service.getTaskById(mockFulfillerVikram, 'task_ful_005');

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'FORBIDDEN');
  assert.match(result.error?.message || '', /another fulfiller/i);
});

test('DEV3-TASK-15: 10. Supervisor can inspect any task within department', async () => {
  const service = new FulfillerService();

  // Meera Nambiar (supervisor) can inspect task_ful_001 assigned to Vikram
  const result = await service.getTaskById(mockSupervisorMeera, 'task_ful_001');

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.equal(result.data.taskId, 'task_ful_001');
});

test('DEV3-TASK-15: 11. Nonexistent task ID returns 404 TASK_NOT_FOUND', async () => {
  const service = new FulfillerService();

  const result = await service.getTaskById(mockFulfillerVikram, 'task_nonexistent_999');

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.error?.code, 'TASK_NOT_FOUND');
});

test('DEV3-TASK-15: 12. Unauthorized caller role is rejected with 403 FORBIDDEN', async () => {
  const service = new FulfillerService();

  const result = await service.getMyTasks(mockUnauthorizedCaller);

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.error?.code, 'FORBIDDEN');
});

// ============================================================================
// PART 2 — DEV3-TASK-16: FULFILLER TASK ACTIONS, CHECKLIST & BLOCKERS
// ============================================================================

test('DEV3-TASK-16: 13. Accept assigned task transitions status to accepted and records event', async () => {
  const service = new FulfillerService();

  // task_ful_001 is assigned
  const result = await service.acceptTask(mockFulfillerVikram, 'task_ful_001');

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.ok(result.data);
  assert.equal(result.data.status, 'accepted');
  assert.equal(result.data.events.some((e) => e.action === 'ACCEPT'), true);
});

test('DEV3-TASK-16: 14. Accept task is idempotent: duplicate accept returns success', async () => {
  const service = new FulfillerService();

  await service.acceptTask(mockFulfillerVikram, 'task_ful_001');
  const second = await service.acceptTask(mockFulfillerVikram, 'task_ful_001');

  assert.equal(second.success, true);
  assert.equal(second.statusCode, 200);
  assert.equal(second.data?.status, 'accepted');
});

test('DEV3-TASK-16: 15. Start work transitions task from accepted/assigned to in_progress', async () => {
  const service = new FulfillerService();

  // Accept then start
  await service.acceptTask(mockFulfillerVikram, 'task_ful_001');
  const startResult = await service.startTask(mockFulfillerVikram, 'task_ful_001');

  assert.equal(startResult.success, true);
  assert.equal(startResult.statusCode, 200);
  assert.ok(startResult.data);
  assert.equal(startResult.data.status, 'in_progress');
  assert.equal(startResult.data.events.some((e) => e.action === 'START'), true);
});

test('DEV3-TASK-16: 16. Report blocker records reason, sets status to blocked, and dispatches simulated supervisor notification', async () => {
  const service = new FulfillerService();

  // task_ful_002 is in_progress
  const blockResult = await service.blockTask(mockFulfillerVikram, 'task_ful_002', {
    reason: 'Water supply line in bathroom valve leaking; requires engineering plumber before floor cleaning.',
    evidencePhotoUrl: 'https://storage.grand-hotel.local/attachments/leak_photo.jpg',
  });

  assert.equal(blockResult.success, true);
  assert.equal(blockResult.statusCode, 200);
  assert.ok(blockResult.data);
  assert.equal(blockResult.data.status, 'blocked');
  assert.equal(
    blockResult.data.blockedReason,
    'Water supply line in bathroom valve leaking; requires engineering plumber before floor cleaning.',
  );
  assert.ok(blockResult.data.blockedAt);
  assert.equal(blockResult.data.events.some((e) => e.action === 'BLOCKED'), true);
});

test('DEV3-TASK-16: 17. Resume work transitions blocked task back to in_progress', async () => {
  const service = new FulfillerService();

  // task_ful_003 is blocked
  const resumeResult = await service.resumeTask(mockFulfillerVikram, 'task_ful_003');

  assert.equal(resumeResult.success, true);
  assert.equal(resumeResult.statusCode, 200);
  assert.ok(resumeResult.data);
  assert.equal(resumeResult.data.status, 'in_progress');
  assert.equal(resumeResult.data.events.some((e) => e.action === 'RESUME'), true);
});

test('DEV3-TASK-16: 18. Mandatory Checklist Guard: completion rejected when required checklist item is incomplete', async () => {
  const service = new FulfillerService();

  // task_ful_002 is in_progress, but chk_002_3 (vacuum carpet) is required and incomplete!
  const completeResult = await service.completeTask(mockFulfillerVikram, 'task_ful_002', {
    notes: 'Completed all cleaning',
  });

  assert.equal(completeResult.success, false);
  assert.equal(completeResult.statusCode, 400);
  assert.equal(completeResult.error?.code, 'MANDATORY_CHECKLIST_INCOMPLETE');
  assert.match(completeResult.error?.message || '', /mandatory checklist item/i);
  assert.ok(completeResult.error?.details && completeResult.error.details.length > 0);
  assert.equal(completeResult.error.details[0].field, 'chk_002_3');
});

test('DEV3-TASK-16: 19. Updating checklist marks item complete with timestamp and fulfiller identity', async () => {
  const service = new FulfillerService();

  // Mark the pending checklist item chk_002_3 as complete
  const updateResult = await service.updateChecklist(mockFulfillerVikram, 'task_ful_002', {
    responses: [{ itemId: 'chk_002_3', completed: true }],
  });

  assert.equal(updateResult.success, true);
  assert.equal(updateResult.statusCode, 200);
  assert.ok(updateResult.data);

  const updatedItem = updateResult.data.checklistItems.find((chk) => chk.id === 'chk_002_3');
  assert.ok(updatedItem);
  assert.equal(updatedItem.completed, true);
  assert.ok(updatedItem.completedAt);
  assert.equal(updatedItem.completedByStaffId, 'EMP-0103');
});

test('DEV3-TASK-16: 20. Completing task succeeds once all mandatory checklist items are satisfied', async () => {
  const service = new FulfillerService();

  // 1. Complete the pending mandatory checklist item
  await service.updateChecklist(mockFulfillerVikram, 'task_ful_002', {
    responses: [{ itemId: 'chk_002_3', completed: true }],
  });

  // 2. Submit completion
  const completeResult = await service.completeTask(mockFulfillerVikram, 'task_ful_002', {
    notes: 'Room 304 turnover complete. Sanitized and inspected per 5-star brand guidelines.',
    evidencePhotoUrl: 'https://storage.grand-hotel.local/attachments/room_304_clean.jpg',
  });

  assert.equal(completeResult.success, true);
  assert.equal(completeResult.statusCode, 200);
  assert.ok(completeResult.data);
  assert.equal(completeResult.data.status, 'completed');
  assert.ok(completeResult.data.completedAt);
  assert.equal(
    completeResult.data.completionNotes,
    'Room 304 turnover complete. Sanitized and inspected per 5-star brand guidelines.',
  );
  assert.equal(completeResult.data.events.some((e) => e.action === 'COMPLETE'), true);
});

test('DEV3-TASK-16: 21. Complete task is idempotent: completing already completed task returns success', async () => {
  const service = new FulfillerService();

  // task_ful_004 is already completed
  const result = await service.completeTask(mockFulfillerVikram, 'task_ful_004', {
    notes: 'Already done',
  });

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.data?.status, 'completed');
});

test('DEV3-TASK-16: 22. Invalid status transition: cannot modify or block an already COMPLETED task', async () => {
  const service = new FulfillerService();

  // task_ful_004 is completed; attempting to block it must fail
  const blockResult = await service.blockTask(mockFulfillerVikram, 'task_ful_004', {
    reason: 'Trying to block completed task',
  });

  assert.equal(blockResult.success, false);
  assert.equal(blockResult.statusCode, 400);
  assert.equal(blockResult.error?.code, 'INVALID_STATUS_TRANSITION');
});
