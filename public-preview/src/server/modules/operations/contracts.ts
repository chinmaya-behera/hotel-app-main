/**
 * ============================================================================
 * DOMAIN 2: OPERATIONS CONTRACTS & SHARED INTERFACES
 * Canonical Owner: DEVELOPER 2 (DEV2-TASK-13)
 * Documented in BACKEND_TEAM_DIVISION_V2.md (Part 5.1 Shared Service Contracts)
 * ============================================================================
 */

export type TaskPriority = 'low' | 'normal' | 'urgent' | 'safety_critical';
export type TaskStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'on_the_way'
  | 'completed'
  | 'blocked'
  | 'cancelled'
  | 'reopened';

export interface CreateCaseAndTaskInput {
  propertyId: string;
  stayId?: string;
  roomId?: string;
  department: string;
  category: string;
  priority: TaskPriority;
  source: 'guest_portal' | 'front_desk' | 'system';
  instructions: string;
  createdByStaffId?: string;
  attachments?: Array<{ name: string; url: string; size: number; mimeType: string }>;
}

export interface CanonicalTaskResult {
  caseId: string;
  caseRef: string;
  taskId: string;
  department: string;
  status: TaskStatus;
  ackDueAt: Date;
  completionDueAt: Date;
}

export interface TaskTransitionInput {
  taskId: string;
  staffId: string;
  action: 'accept' | 'start' | 'on_the_way' | 'complete';
  targetStatus: TaskStatus;
  note?: string;
  checklistResponses?: Record<string, boolean>;
  attachments?: string[];
}

export interface TaskBlockInput {
  taskId: string;
  staffId: string;
  reason: string;
  evidencePhotoUrl?: string;
}

/**
 * Sanitized, privacy-safe projection of operational tasks visible to the in-room guest.
 * Enforces strict information boundary: NEVER includes staff IDs, internal notes, or phone numbers.
 */
export interface GuestTaskProjection {
  taskId: string;
  category: string;
  department: string;
  status: 'received' | 'in_progress' | 'on_the_way' | 'completed' | 'blocked';
  statusLabel: string;
  createdAt: string;
  estimatedCompletionAt?: string;
  completedAt?: string;
}

/**
 * Full operational task projection for staff fulfillers on mobile devices.
 */
export interface FulfillerTaskProjection {
  taskId: string;
  caseRef: string;
  roomNumber: string;
  floor: number;
  category: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  instructions: string;
  guestDndActive: boolean;
  assignedAt: string;
  ackDueAt: string;
  completionDueAt: string;
  checklistItems: Array<{ id: string; label: string; required: boolean }>;
}

export interface ITaskEngineService {
  createCaseAndTask(input: CreateCaseAndTaskInput): Promise<CanonicalTaskResult>;
}

export interface ITaskLifecycleService {
  transitionTask(
    input: TaskTransitionInput,
  ): Promise<{ taskId: string; status: TaskStatus; updatedAt: Date }>;
  blockTask(
    input: TaskBlockInput,
  ): Promise<{ taskId: string; status: 'blocked'; blockedAt: Date; reason: string }>;
}

/**
 * Master query service interface.
 * Implemented canonically by Developer 2 (DEV2-TASK-13).
 */
export interface ITaskQueryService {
  getTasksForStaff(staffId: string): Promise<FulfillerTaskProjection[]>;
  getTasksForStay(stayId: string): Promise<GuestTaskProjection[]>;
  getTaskById(taskId: string): Promise<FulfillerTaskProjection | null>;
}
