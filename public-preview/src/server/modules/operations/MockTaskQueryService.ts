import type {
  ITaskQueryService,
  GuestTaskProjection,
  FulfillerTaskProjection,
} from './contracts';

/**
 * ============================================================================
 * MockTaskQueryService (Development & Test Adapter for DEV2-TASK-13)
 * Owned by Developer 3 for Sprint 0 independent workflow execution.
 * When Developer 2 implements canonical TaskQueryService, this adapter is swapped
 * without touching Developer 3 consumer code.
 * ============================================================================
 */
export class MockTaskQueryService implements ITaskQueryService {
  private static instance: MockTaskQueryService;
  private tasksByStay = new Map<string, GuestTaskProjection[]>();

  constructor() {
    this.seedDefaultTasks();
  }

  public static getInstance(): MockTaskQueryService {
    if (!MockTaskQueryService.instance) {
      MockTaskQueryService.instance = new MockTaskQueryService();
    }
    return MockTaskQueryService.instance;
  }

  private seedDefaultTasks(): void {
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const estArrival = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    // Default seed requests for Aarav Sharma (Room 402)
    this.tasksByStay.set('stay_seed_402', [
      {
        taskId: 'task_req_402_01',
        category: 'Housekeeping / Extra Linens',
        department: 'Housekeeping',
        status: 'on_the_way',
        statusLabel: 'Attendant On The Way',
        createdAt: tenMinsAgo,
        estimatedCompletionAt: estArrival,
      },
      {
        taskId: 'task_req_402_02',
        category: 'In-Room Dining',
        department: 'Food & Beverage',
        status: 'completed',
        statusLabel: 'Delivered',
        createdAt: thirtyMinsAgo,
        completedAt: tenMinsAgo,
      },
    ]);
  }

  public async getTasksForStay(stayId: string): Promise<GuestTaskProjection[]> {
    const list = this.tasksByStay.get(stayId) || [];
    // Deep clone to prevent accidental outside mutation
    return JSON.parse(JSON.stringify(list));
  }

  public async getTasksForStaff(_staffId: string): Promise<FulfillerTaskProjection[]> {
    return [];
  }

  public async getTaskById(_taskId: string): Promise<FulfillerTaskProjection | null> {
    return null;
  }

  // Test helpers
  public setStayTasks(stayId: string, tasks: GuestTaskProjection[]): void {
    this.tasksByStay.set(stayId, tasks);
  }

  public clearTasks(): void {
    this.tasksByStay.clear();
  }

  public resetSeed(): void {
    this.tasksByStay.clear();
    this.seedDefaultTasks();
  }

  public reset(): void {
    this.resetSeed();
  }
}
