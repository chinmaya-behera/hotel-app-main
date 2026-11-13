import type {
  ITaskLifecycleService,
  TaskTransitionInput,
  TaskBlockInput,
  ChecklistItemRecord,
  FulfillerTaskProjection,
  TaskStatus,
} from './contracts.ts';
import { MockTaskStore } from './MockTaskStore.ts';

/**
 * ============================================================================
 * MockTaskLifecycleService (Development & Test Adapter for DEV2-TASK-03 & 04)
 * Owned by Developer 3 for Sprint 0 decoupled workflow execution.
 * When Developer 2 implements canonical TaskLifecycleService, this adapter is swapped.
 * ============================================================================
 */
export class MockTaskLifecycleService implements ITaskLifecycleService {
  private static instance: MockTaskLifecycleService;
  private store: MockTaskStore;

  constructor(store?: MockTaskStore) {
    this.store = store || MockTaskStore.getInstance();
  }

  public static getInstance(): MockTaskLifecycleService {
    if (!MockTaskLifecycleService.instance) {
      MockTaskLifecycleService.instance = new MockTaskLifecycleService();
    }
    return MockTaskLifecycleService.instance;
  }

  public async transitionTask(
    input: TaskTransitionInput,
  ): Promise<{ taskId: string; status: TaskStatus; updatedAt: Date; task?: FulfillerTaskProjection }> {
    const task = this.store.getTask(input.taskId);
    if (!task) {
      throw new Error(`TASK_NOT_FOUND: Task '${input.taskId}' was not found.`);
    }

    // Idempotent: If task is already at target status, return success
    if (task.status === input.targetStatus) {
      return {
        taskId: task.taskId,
        status: task.status,
        updatedAt: new Date(),
        task,
      };
    }

    // Enforce valid state transitions per Developer 2 state machine
    this.validateTransition(task.status, input.targetStatus, input.action);

    const now = new Date();
    const nowIso = now.toISOString();

    task.status = input.targetStatus;

    if (input.targetStatus === 'completed') {
      task.completedAt = nowIso;
      if (input.note) task.completionNotes = input.note;
      if (input.attachments && input.attachments.length > 0) {
        task.evidencePhotoUrl = input.attachments[0];
      }
    }

    // Record canonical event in timeline
    task.events.push({
      action: input.action.toUpperCase(),
      at: nowIso,
      staffId: input.staffId,
      note: input.note || `Task transitioned to ${input.targetStatus}`,
    });

    const saved = this.store.saveTask(task);

    return {
      taskId: saved.taskId,
      status: saved.status,
      updatedAt: now,
      task: saved,
    };
  }

  public async blockTask(
    input: TaskBlockInput,
  ): Promise<{ taskId: string; status: 'blocked'; blockedAt: Date; reason: string; task?: FulfillerTaskProjection }> {
    const task = this.store.getTask(input.taskId);
    if (!task) {
      throw new Error(`TASK_NOT_FOUND: Task '${input.taskId}' was not found.`);
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      throw new Error(
        `INVALID_STATUS_TRANSITION: Cannot block task '${task.taskId}' because it is already '${task.status}'.`,
      );
    }

    // Idempotent
    if (task.status === 'blocked' && task.blockedReason === input.reason) {
      return {
        taskId: task.taskId,
        status: 'blocked',
        blockedAt: new Date(task.blockedAt || Date.now()),
        reason: task.blockedReason,
        task,
      };
    }

    const now = new Date();
    const nowIso = now.toISOString();

    task.status = 'blocked';
    task.blockedAt = nowIso;
    task.blockedReason = input.reason;
    if (input.evidencePhotoUrl) {
      task.evidencePhotoUrl = input.evidencePhotoUrl;
    }

    task.events.push({
      action: 'BLOCKED',
      at: nowIso,
      staffId: input.staffId,
      note: `Task placed on hold: "${input.reason}"`,
    });

    const saved = this.store.saveTask(task);

    return {
      taskId: saved.taskId,
      status: 'blocked',
      blockedAt: now,
      reason: input.reason,
      task: saved,
    };
  }

  public async updateChecklist(
    taskId: string,
    staffId: string,
    items: Array<{ itemId: string; completed: boolean }>,
  ): Promise<{ taskId: string; checklistItems: ChecklistItemRecord[]; updatedAt: Date; task?: FulfillerTaskProjection }> {
    const task = this.store.getTask(taskId);
    if (!task) {
      throw new Error(`TASK_NOT_FOUND: Task '${taskId}' was not found.`);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    for (const update of items) {
      const existingItem = task.checklistItems.find((chk) => chk.id === update.itemId);
      if (existingItem) {
        existingItem.completed = update.completed;
        if (update.completed) {
          existingItem.completedAt = nowIso;
          existingItem.completedByStaffId = staffId;
        } else {
          existingItem.completedAt = undefined;
          existingItem.completedByStaffId = undefined;
        }
      }
    }

    task.events.push({
      action: 'CHECKLIST_UPDATED',
      at: nowIso,
      staffId,
      note: `Updated ${items.length} checklist item(s)`,
    });

    const saved = this.store.saveTask(task);

    return {
      taskId: saved.taskId,
      checklistItems: saved.checklistItems,
      updatedAt: now,
      task: saved,
    };
  }

  private validateTransition(current: TaskStatus, target: TaskStatus, action: string): void {
    if (current === target) return;

    if (current === 'completed') {
      throw new Error('INVALID_STATUS_TRANSITION: Cannot modify or transition a COMPLETED task.');
    }
    if (current === 'cancelled') {
      throw new Error('INVALID_STATUS_TRANSITION: Cannot modify or transition a CANCELLED task.');
    }

    const validMoves: Record<TaskStatus, TaskStatus[]> = {
      submitted: ['assigned', 'cancelled'],
      assigned: ['accepted', 'in_progress', 'on_the_way', 'blocked', 'cancelled'],
      accepted: ['in_progress', 'on_the_way', 'blocked', 'cancelled'],
      in_progress: ['on_the_way', 'completed', 'blocked', 'cancelled'],
      on_the_way: ['in_progress', 'completed', 'blocked', 'cancelled'],
      blocked: ['in_progress', 'on_the_way', 'cancelled'],
      completed: [],
      cancelled: [],
      reopened: ['assigned', 'in_progress', 'cancelled'],
    };

    const allowed = validMoves[current]?.includes(target);
    if (!allowed) {
      throw new Error(
        `INVALID_STATUS_TRANSITION: Cannot execute action '${action}' from '${current}' to '${target}'. Allowed next states: ${(
          validMoves[current] || []
        ).join(', ')}`,
      );
    }
  }

  public reset(): void {
    this.store.reset();
  }
}
