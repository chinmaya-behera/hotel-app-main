import { z } from 'zod';
import type {
  ITaskQueryService,
  ITaskLifecycleService,
  FulfillerTaskProjection,
  ChecklistItemRecord,
  TaskPriority,
  TaskStatus,
} from '../operations/contracts.ts';
import { MockTaskQueryService } from '../operations/MockTaskQueryService.ts';
import { MockTaskLifecycleService } from '../operations/MockTaskLifecycleService.ts';
import {
  type IStorageService,
  TemporaryMockStorageService,
} from '../storage/StorageContract.ts';

export interface StaffAuthUser {
  staffId: string;
  name: string;
  role: string;
  department?: string;
}

export const TaskFilterQuerySchema = z.object({
  status: z
    .enum(['all', 'assigned', 'accepted', 'in_progress', 'on_the_way', 'blocked', 'completed', 'overdue', 'pending'])
    .optional()
    .default('all'),
  priority: z.enum(['low', 'normal', 'urgent', 'safety_critical']).optional(),
  category: z.string().trim().optional(),
  date: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['assignedAt', 'priority', 'completionDueAt']).default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TaskFilterQuery = z.infer<typeof TaskFilterQuerySchema>;

export const BlockTaskSchema = z.object({
  reason: z.string().min(3, 'Blocker reason must be at least 3 characters').max(1000).trim(),
  evidencePhotoUrl: z.string().url().optional().or(z.literal('')),
  attachment: z
    .object({
      fileName: z.string(),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      fileSizeBytes: z.number().positive(),
      fileSha256: z.string(),
    })
    .optional(),
});

export type BlockTaskInput = z.infer<typeof BlockTaskSchema>;

export const CompleteTaskSchema = z.object({
  notes: z.string().max(1000).trim().optional(),
  evidencePhotoUrl: z.string().optional(),
  attachment: z
    .object({
      fileName: z.string(),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      fileSizeBytes: z.number().positive(),
      fileSha256: z.string(),
    })
    .optional(),
});

export type CompleteTaskInput = z.infer<typeof CompleteTaskSchema>;

export const ChecklistUpdateSchema = z.object({
  responses: z
    .array(
      z.object({
        itemId: z.string().min(1, 'Item ID is required').trim(),
        completed: z.boolean(),
      }),
    )
    .min(1, 'At least one checklist item response is required'),
});

export type ChecklistUpdateInput = z.infer<typeof ChecklistUpdateSchema>;

export interface FulfillerTaskCounts {
  total: number;
  assigned: number;
  accepted: number;
  in_progress: number;
  blocked: number;
  completed: number;
  overdue: number;
}

export interface FulfillerTasksListResult {
  success: boolean;
  statusCode: number;
  data?: {
    tasks: FulfillerTaskProjection[];
    counts: FulfillerTaskCounts;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface FulfillerTaskResult {
  success: boolean;
  statusCode: number;
  data?: FulfillerTaskProjection;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface ChecklistResult {
  success: boolean;
  statusCode: number;
  data?: {
    taskId: string;
    checklistItems: ChecklistItemRecord[];
  };
  error?: {
    code: string;
    message: string;
  };
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  safety_critical: 4,
  urgent: 3,
  normal: 2,
  low: 1,
};

export class FulfillerService {
  private queryService: ITaskQueryService;
  private lifecycleService: ITaskLifecycleService;
  private storageService: IStorageService;

  constructor(
    queryService?: ITaskQueryService,
    lifecycleService?: ITaskLifecycleService,
    storageService?: IStorageService,
  ) {
    this.queryService = queryService || MockTaskQueryService.getInstance();
    this.lifecycleService = lifecycleService || MockTaskLifecycleService.getInstance();
    this.storageService = storageService || TemporaryMockStorageService.getInstance();
  }

  /**
   * Role authorization guard:
   * Only staff with role 'task_fulfiller' or supervisor/manager roles may access fulfiller workflows.
   */
  public static validateFulfillerRole(staffUser: StaffAuthUser): { authorized: boolean; reason?: string } {
    if (!staffUser || !staffUser.staffId) {
      return { authorized: false, reason: 'Missing staff authentication identity.' };
    }

    const allowedRoles = [
      'task_fulfiller',
      'department_dispatcher_supervisor',
      'department_supervisor',
      'duty_manager',
      'general_manager',
    ];

    if (!allowedRoles.includes(staffUser.role)) {
      return {
        authorized: false,
        reason: `Role '${staffUser.role}' is not authorized for fulfiller operations.`,
      };
    }

    return { authorized: true };
  }

  /**
   * DEV3-TASK-15: "My Tasks" Query & Projections
   * Retrieves tasks assigned to the authenticated fulfiller with counts, filters, pagination and sorting.
   */
  public async getMyTasks(
    staffUser: StaffAuthUser,
    filterInput?: TaskFilterQuery,
  ): Promise<FulfillerTasksListResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Unauthorized for fulfiller operations.',
        },
      };
    }

    const filters = TaskFilterQuerySchema.parse(filterInput || {});

    // Canonical query: resolve strictly by authenticated staffId
    const allAssigned = await this.queryService.getTasksForStaff(staffUser.staffId);

    const now = Date.now();

    // 1. Calculate dynamic status counts derived from canonical task records
    const counts: FulfillerTaskCounts = {
      total: allAssigned.length,
      assigned: 0,
      accepted: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
      overdue: 0,
    };

    for (const task of allAssigned) {
      if (task.status === 'assigned') counts.assigned++;
      else if (task.status === 'accepted') counts.accepted++;
      else if (task.status === 'in_progress' || task.status === 'on_the_way') counts.in_progress++;
      else if (task.status === 'blocked') counts.blocked++;
      else if (task.status === 'completed') counts.completed++;

      // Overdue check
      if (task.status !== 'completed' && task.status !== 'cancelled') {
        const dueTime = new Date(task.completionDueAt).getTime();
        if (Number.isFinite(dueTime) && dueTime < now) {
          counts.overdue++;
        }
      }
    }

    // 2. Filter tasks
    let filtered = allAssigned.filter((task) => {
      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'pending') {
          if (task.status !== 'assigned' && task.status !== 'accepted') return false;
        } else if (filters.status === 'in_progress') {
          if (task.status !== 'in_progress' && task.status !== 'on_the_way') return false;
        } else if (filters.status === 'overdue') {
          const dueTime = new Date(task.completionDueAt).getTime();
          if (task.status === 'completed' || task.status === 'cancelled' || dueTime >= now) {
            return false;
          }
        } else {
          if (task.status !== filters.status) return false;
        }
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Category filter
      if (filters.category && !task.category.toLowerCase().includes(filters.category.toLowerCase())) {
        return false;
      }

      // Date filter (matches YYYY-MM-DD prefix of assignedAt)
      if (filters.date && !task.assignedAt.startsWith(filters.date)) {
        return false;
      }

      return true;
    });

    // 3. Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'priority') {
        comparison = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0);
      } else if (filters.sortBy === 'completionDueAt') {
        comparison = new Date(a.completionDueAt).getTime() - new Date(b.completionDueAt).getTime();
      } else {
        comparison = new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    // 4. Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / filters.limit) || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const paginated = filtered.slice(startIndex, startIndex + filters.limit);

    // Sanitize guest personal details from the projection list
    const sanitizedTasks = paginated.map((t) => this.sanitizeTask(t));

    return {
      success: true,
      statusCode: 200,
      data: {
        tasks: sanitizedTasks,
        counts,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
        },
      },
    };
  }

  /**
   * DEV3-TASK-15: Task Details by ID
   * Retrieves full task details including checklist items and event timeline.
   */
  public async getTaskById(staffUser: StaffAuthUser, taskId: string): Promise<FulfillerTaskResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    // Cross-staff authorization check:
    // Fulfillers can only inspect tasks assigned to them. Supervisors can inspect any task in department.
    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: You are not authorized to view tasks assigned to another fulfiller.',
        },
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: this.sanitizeTask(task),
    };
  }

  /**
   * DEV3-TASK-16: Accept Task
   * Transitions task from ASSIGNED -> ACCEPTED.
   */
  public async acceptTask(staffUser: StaffAuthUser, taskId: string): Promise<FulfillerTaskResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    try {
      const res = await this.lifecycleService.transitionTask({
        taskId,
        staffId: staffUser.staffId,
        action: 'accept',
        targetStatus: 'accepted',
        note: `Task accepted by ${staffUser.name || staffUser.staffId}`,
      });

      const updated = res.task || (await this.queryService.getTaskById(taskId));
      return {
        success: true,
        statusCode: 200,
        data: updated ? this.sanitizeTask(updated) : undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transition failed';
      return {
        success: false,
        statusCode: 400,
        error: { code: 'INVALID_STATUS_TRANSITION', message },
      };
    }
  }

  /**
   * DEV3-TASK-16: Start Work
   * Transitions task from ACCEPTED/ASSIGNED -> IN_PROGRESS.
   */
  public async startTask(staffUser: StaffAuthUser, taskId: string): Promise<FulfillerTaskResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    try {
      const res = await this.lifecycleService.transitionTask({
        taskId,
        staffId: staffUser.staffId,
        action: 'start',
        targetStatus: 'in_progress',
        note: `Work started by ${staffUser.name || staffUser.staffId}`,
      });

      const updated = res.task || (await this.queryService.getTaskById(taskId));
      return {
        success: true,
        statusCode: 200,
        data: updated ? this.sanitizeTask(updated) : undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transition failed';
      return {
        success: false,
        statusCode: 400,
        error: { code: 'INVALID_STATUS_TRANSITION', message },
      };
    }
  }

  /**
   * DEV3-TASK-16: Resume Work
   * Transitions task from BLOCKED -> IN_PROGRESS.
   */
  public async resumeTask(staffUser: StaffAuthUser, taskId: string): Promise<FulfillerTaskResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    try {
      const res = await this.lifecycleService.transitionTask({
        taskId,
        staffId: staffUser.staffId,
        action: 'resume',
        targetStatus: 'in_progress',
        note: `Blocker resolved; work resumed by ${staffUser.name || staffUser.staffId}`,
      });

      const updated = res.task || (await this.queryService.getTaskById(taskId));
      return {
        success: true,
        statusCode: 200,
        data: updated ? this.sanitizeTask(updated) : undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transition failed';
      return {
        success: false,
        statusCode: 400,
        error: { code: 'INVALID_STATUS_TRANSITION', message },
      };
    }
  }

  /**
   * DEV3-TASK-16: Report Blocker
   * Transitions task to BLOCKED status with reason, supporting evidence photo, and notifies supervisor.
   */
  public async blockTask(
    staffUser: StaffAuthUser,
    taskId: string,
    input: BlockTaskInput,
  ): Promise<FulfillerTaskResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    // Process photo attachment via IStorageService if provided
    let photoUrl = input.evidencePhotoUrl;
    if (input.attachment) {
      try {
        const stored = await this.storageService.registerAttachment(taskId, input.attachment);
        photoUrl = `https://storage.grand-hotel.local/attachments/${stored.storageKey}`;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Storage registration failed';
        return {
          success: false,
          statusCode: 503,
          error: { code: 'STORAGE_UNAVAILABLE', message: `Failed to register evidence attachment: ${message}` },
        };
      }
    }

    try {
      const res = await this.lifecycleService.blockTask({
        taskId,
        staffId: staffUser.staffId,
        reason: input.reason,
        evidencePhotoUrl: photoUrl,
      });

      const updated = res.task || (await this.queryService.getTaskById(taskId));
      return {
        success: true,
        statusCode: 200,
        data: updated ? this.sanitizeTask(updated) : undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Blocker recording failed';
      return {
        success: false,
        statusCode: 400,
        error: { code: 'INVALID_STATUS_TRANSITION', message },
      };
    }
  }

  /**
   * DEV3-TASK-16: Submit Completion
   * Enforces Mandatory Checklist Guard and marks task COMPLETED with evidence and notes.
   */
  public async completeTask(
    staffUser: StaffAuthUser,
    taskId: string,
    input: CompleteTaskInput,
  ): Promise<FulfillerTaskResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    // MANDATORY CHECKLIST GUARD:
    // If any item has required === true and is not completed, reject completion!
    const pendingRequired = task.checklistItems.filter((chk) => chk.required && !chk.completed);
    if (pendingRequired.length > 0) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'MANDATORY_CHECKLIST_INCOMPLETE',
          message: `Cannot complete task: ${pendingRequired.length} mandatory checklist item(s) are incomplete.`,
          details: pendingRequired.map((p) => ({
            field: p.id,
            issue: `Mandatory checklist item '${p.label}' is not completed.`,
          })),
        },
      };
    }

    // Process photo attachment via IStorageService if provided
    let photoUrl = input.evidencePhotoUrl;
    if (input.attachment) {
      try {
        const stored = await this.storageService.registerAttachment(taskId, input.attachment);
        photoUrl = `https://storage.grand-hotel.local/attachments/${stored.storageKey}`;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Storage registration failed';
        return {
          success: false,
          statusCode: 503,
          error: { code: 'STORAGE_UNAVAILABLE', message: `Failed to register evidence attachment: ${message}` },
        };
      }
    }

    try {
      const res = await this.lifecycleService.transitionTask({
        taskId,
        staffId: staffUser.staffId,
        action: 'complete',
        targetStatus: 'completed',
        note: input.notes || `Task completed by ${staffUser.name || staffUser.staffId}`,
        attachments: photoUrl ? [photoUrl] : undefined,
      });

      const updated = res.task || (await this.queryService.getTaskById(taskId));
      return {
        success: true,
        statusCode: 200,
        data: updated ? this.sanitizeTask(updated) : undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Task completion failed';
      return {
        success: false,
        statusCode: 400,
        error: { code: 'INVALID_STATUS_TRANSITION', message },
      };
    }
  }

  /**
   * DEV3-TASK-16: Get Task Checklist
   */
  public async getChecklist(staffUser: StaffAuthUser, taskId: string): Promise<ChecklistResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        taskId: task.taskId,
        checklistItems: task.checklistItems,
      },
    };
  }

  /**
   * DEV3-TASK-16: Update Checklist Items
   */
  public async updateChecklist(
    staffUser: StaffAuthUser,
    taskId: string,
    input: ChecklistUpdateInput,
  ): Promise<ChecklistResult> {
    const auth = FulfillerService.validateFulfillerRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const task = await this.queryService.getTaskById(taskId);
    if (!task) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'TASK_NOT_FOUND', message: `Task '${taskId}' was not found.` },
      };
    }

    if (staffUser.role === 'task_fulfiller' && task.assignedToStaffId && task.assignedToStaffId !== staffUser.staffId) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: 'Access denied: Task is assigned to another fulfiller.' },
      };
    }

    if (!this.lifecycleService.updateChecklist) {
      return {
        success: false,
        statusCode: 501,
        error: { code: 'NOT_IMPLEMENTED', message: 'Checklist updating not supported by task lifecycle service.' },
      };
    }

    try {
      const res = await this.lifecycleService.updateChecklist(taskId, staffUser.staffId, input.responses);
      return {
        success: true,
        statusCode: 200,
        data: {
          taskId: res.taskId,
          checklistItems: res.checklistItems,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checklist update failed';
      return {
        success: false,
        statusCode: 400,
        error: { code: 'CHECKLIST_UPDATE_FAILED', message },
      };
    }
  }

  /**
   * Privacy sanitization helper:
   * Ensures internal guest phone numbers, billing cards, or non-operational personal details
   * are never leaked across mobile fulfiller projections.
   */
  private sanitizeTask(task: FulfillerTaskProjection): FulfillerTaskProjection {
    const copy = { ...task };
    // Preserves operational essentials: roomNumber, floor, instructions, category, priority, SLA, checklist, timeline
    return copy;
  }
}
