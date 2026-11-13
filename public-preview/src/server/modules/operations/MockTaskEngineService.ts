import crypto from 'node:crypto';
import type {
  ITaskEngineService,
  CreateCaseAndTaskInput,
  CanonicalTaskResult,
  TaskStatus,
} from './contracts.ts';
import { MockTaskQueryService } from './MockTaskQueryService.ts';

/**
 * ============================================================================
 * MockTaskEngineService (Development & Test Adapter for DEV2-TASK-02)
 * Owned by Developer 3 for Sprint 0 independent workflow execution.
 * When Developer 2 implements canonical TaskEngineService, this adapter is swapped.
 * ============================================================================
 */
export class MockTaskEngineService implements ITaskEngineService {
  private static instance: MockTaskEngineService;
  private createdCases: CanonicalTaskResult[] = [];
  private simulateFailure = false;
  private caseSequence = 4020;

  public static getInstance(): MockTaskEngineService {
    if (!MockTaskEngineService.instance) {
      MockTaskEngineService.instance = new MockTaskEngineService();
    }
    return MockTaskEngineService.instance;
  }

  public setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail;
  }

  public async createCaseAndTask(input: CreateCaseAndTaskInput): Promise<CanonicalTaskResult> {
    if (this.simulateFailure) {
      throw new Error('OPERATIONS_SERVICE_UNAVAILABLE: Task engine is temporarily offline');
    }

    this.caseSequence++;
    const caseId = `case_${crypto.randomUUID()}`;
    const taskId = `task_${crypto.randomUUID()}`;
    const caseRef = `REQ-2026-${this.caseSequence}`;

    const now = new Date();
    // Default SLAs based on priority
    const ackMinutes = input.priority === 'urgent' || input.priority === 'safety_critical' ? 5 : 15;
    const compMinutes = input.priority === 'urgent' ? 25 : input.priority === 'safety_critical' ? 10 : 45;

    const ackDueAt = new Date(now.getTime() + ackMinutes * 60 * 1000);
    const completionDueAt = new Date(now.getTime() + compMinutes * 60 * 1000);
    const status: TaskStatus = 'submitted';

    const result: CanonicalTaskResult = {
      caseId,
      caseRef,
      taskId,
      department: input.department,
      category: input.category,
      status,
      ackDueAt,
      completionDueAt,
    };

    this.createdCases.push(result);

    // If submitted for an active stay, also update the MockTaskQueryService
    // so GET /api/v1/guest/stay-summary immediately reflects the new request!
    if (input.stayId) {
      const queryService = MockTaskQueryService.getInstance();
      const currentTasks = await queryService.getTasksForStay(input.stayId);
      currentTasks.unshift({
        taskId,
        category: input.category,
        department: input.department,
        status: 'received',
        statusLabel: 'Request Received',
        createdAt: now.toISOString(),
        estimatedCompletionAt: completionDueAt.toISOString(),
      });
      queryService.setStayTasks(input.stayId, currentTasks);
    }

    return result;
  }

  public getCreatedCases(): CanonicalTaskResult[] {
    return [...this.createdCases];
  }

  public reset(): void {
    this.createdCases = [];
    this.simulateFailure = false;
    this.caseSequence = 4020;
  }
}
