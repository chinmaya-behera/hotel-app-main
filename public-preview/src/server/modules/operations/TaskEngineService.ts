import crypto from 'node:crypto';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import { db, getConfiguredDatabaseUrl } from '../../db/index.ts';
import {
  departmentTable,
  roomTable,
  staffMembershipTable,
  staffAccountTable,
} from '../../db/schema/01_identity.ts';
import {
  taskCategoryTable,
  guestCaseTable,
  departmentTaskTable,
  taskEventTable,
  slaPolicyTable,
} from '../../db/schema/02_operations.ts';
import {
  stayContextTable,
  roomAssignmentTable,
  attachmentTable,
} from '../../db/schema/03_finance.ts';
import type {
  ITaskEngineService,
  CreateCaseAndTaskInput,
  CanonicalTaskResult,
  TaskPriority,
  TaskStatus,
} from './contracts.ts';
import { MockTaskEngineService } from './MockTaskEngineService.ts';
import { MockTaskQueryService } from './MockTaskQueryService.ts';

/**
 * Domain error class representing operational task engine business logic errors.
 */
export class TaskEngineDomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'TaskEngineDomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const SUPPORTED_SOURCES = ['guest_portal', 'front_desk', 'system'] as const;
const SUPPORTED_PRIORITIES = ['low', 'normal', 'urgent', 'safety_critical'] as const;

/**
 * ============================================================================
 * Production Canonical TaskEngineService (DEV2-TASK-01 / DEV2-TASK-02)
 *
 * Implements ITaskEngineService:
 * 1. Resolves and scopes department & category to propertyId.
 * 2. Enforces category-to-department ownership invariants.
 * 3. Validates creator staff membership relationships safely.
 * 4. Resolves stay context and room number mappings.
 * 5. Computes response and resolution SLA deadlines from policies.
 * 6. Generates collision-resistant unique case and task references.
 * 7. Atomically creates Guest Case and Department Task within one DB transaction.
 * 8. Records the initial 'submitted' task lifecycle event and attachments.
 * ============================================================================
 */
export class TaskEngineService implements ITaskEngineService {
  private static instance: TaskEngineService;

  public static getInstance(): TaskEngineService {
    if (!TaskEngineService.instance) {
      TaskEngineService.instance = new TaskEngineService();
    }
    return TaskEngineService.instance;
  }

  public async createCaseAndTask(input: CreateCaseAndTaskInput): Promise<CanonicalTaskResult> {
    // 1. Validate Base Required Parameters
    if (!input.propertyId?.trim()) {
      throw new TaskEngineDomainError('PROPERTY_REQUIRED', 'propertyId is mandatory for task engine operations.', 400);
    }
    if (!input.department?.trim()) {
      throw new TaskEngineDomainError('DEPARTMENT_REQUIRED', 'department identifier or name is required.', 400);
    }
    if (!input.category?.trim()) {
      throw new TaskEngineDomainError('CATEGORY_REQUIRED', 'category identifier or name is required.', 400);
    }
    if (!input.instructions?.trim()) {
      throw new TaskEngineDomainError('INSTRUCTIONS_REQUIRED', 'instructions are required to create a work order.', 400);
    }

    // 2. Validate Source
    if (!SUPPORTED_SOURCES.includes(input.source as (typeof SUPPORTED_SOURCES)[number])) {
      throw new TaskEngineDomainError(
        'INVALID_SOURCE',
        `Unsupported source '${input.source}'. Allowed values: ${SUPPORTED_SOURCES.join(', ')}`,
        400,
      );
    }

    // 3. Resolve Department (Scoped to propertyId)
    const rawDept = input.department.trim();
    const departmentRows = await db
      .select()
      .from(departmentTable)
      .where(
        and(
          eq(departmentTable.propertyId, input.propertyId),
          or(
            eq(departmentTable.id, rawDept),
            ilike(departmentTable.name, rawDept),
            ilike(departmentTable.code, rawDept),
          ),
        ),
      )
      .limit(1);

    if (!departmentRows || departmentRows.length === 0) {
      throw new TaskEngineDomainError(
        'DEPARTMENT_NOT_FOUND',
        `Department '${rawDept}' does not exist for property '${input.propertyId}'.`,
        404,
      );
    }
    const resolvedDepartment = departmentRows[0];

    // 4. Resolve Category (Scoped to propertyId and resolvedDepartment.id)
    const rawCat = input.category.trim();
    let categoryRows = await db
      .select()
      .from(taskCategoryTable)
      .where(
        and(
          eq(taskCategoryTable.propertyId, input.propertyId),
          eq(taskCategoryTable.departmentId, resolvedDepartment.id),
          or(
            eq(taskCategoryTable.id, rawCat),
            ilike(taskCategoryTable.name, rawCat),
            ilike(taskCategoryTable.code, rawCat),
          ),
        ),
      )
      .limit(1);

    if (!categoryRows || categoryRows.length === 0) {
      // Check if the category exists under a different department for this property
      const globalCategoryRows = await db
        .select()
        .from(taskCategoryTable)
        .where(
          and(
            eq(taskCategoryTable.propertyId, input.propertyId),
            or(
              eq(taskCategoryTable.id, rawCat),
              ilike(taskCategoryTable.name, rawCat),
              ilike(taskCategoryTable.code, rawCat),
            ),
          ),
        )
        .limit(1);

      if (!globalCategoryRows || globalCategoryRows.length === 0) {
        throw new TaskEngineDomainError(
          'CATEGORY_NOT_FOUND',
          `Task category '${rawCat}' does not exist for property '${input.propertyId}'.`,
          404,
        );
      }

      // Category was found under another department
      throw new TaskEngineDomainError(
        'CATEGORY_DEPARTMENT_MISMATCH',
        `Category '${globalCategoryRows[0].name}' does not belong to department '${resolvedDepartment.name}'.`,
        400,
      );
    }
    const resolvedCategory = categoryRows[0];

    // 6. Validate & Normalize Priority
    let resolvedPriority: TaskPriority = input.priority;
    if (!SUPPORTED_PRIORITIES.includes(resolvedPriority)) {
      resolvedPriority = (resolvedCategory.defaultPriority as TaskPriority) || 'normal';
    }

    // 7. Validate Creator Staff Context (Avoid treating staffId as membershipId without validation)
    let validatedMembershipId: string | null = null;
    let staffNotes: string | null = null;

    if (input.createdByStaffId?.trim()) {
      const rawStaffId = input.createdByStaffId.trim();

      // Check 1: Is rawStaffId a direct staff_membership.id in this property?
      const directMembership = await db
        .select({ id: staffMembershipTable.id })
        .from(staffMembershipTable)
        .where(
          and(
            eq(staffMembershipTable.propertyId, input.propertyId),
            eq(staffMembershipTable.id, rawStaffId),
          ),
        )
        .limit(1);

      if (directMembership.length > 0) {
        validatedMembershipId = directMembership[0].id;
      } else {
        // Check 2: Is rawStaffId a staff_account.id or staff_account.employee_identifier?
        const accountMembership = await db
          .select({ membershipId: staffMembershipTable.id })
          .from(staffMembershipTable)
          .innerJoin(
            staffAccountTable,
            eq(staffMembershipTable.staffAccountId, staffAccountTable.id),
          )
          .where(
            and(
              eq(staffMembershipTable.propertyId, input.propertyId),
              or(
                eq(staffAccountTable.id, rawStaffId),
                ilike(staffAccountTable.employeeIdentifier, rawStaffId),
              ),
            ),
          )
          .limit(1);

        if (accountMembership.length > 0) {
          validatedMembershipId = accountMembership[0].membershipId;
        } else {
          // Record unmapped staff identifier in notes without breaking foreign key integrity
          staffNotes = `[Created by staff ref: ${rawStaffId}]`;
        }
      }
    }

    // 8. Map Stay Context & Room Number
    let resolvedStayId: string | null = null;
    let resolvedRoomId: string | null = null;
    let resolvedRoomNumber: string | null = null;
    let resolvedGuestName: string | null = null;

    if (input.stayId?.trim()) {
      const stayRows = await db
        .select()
        .from(stayContextTable)
        .where(
          and(
            eq(stayContextTable.propertyId, input.propertyId),
            eq(stayContextTable.id, input.stayId.trim()),
          ),
        )
        .limit(1);

      if (stayRows.length > 0) {
        resolvedStayId = stayRows[0].id;
        resolvedGuestName = `${stayRows[0].guestFirstName} ${stayRows[0].guestLastName}`.trim();

        // If roomId was not passed directly, look up active room assignment for this stay
        if (!input.roomId?.trim()) {
          const currentAssignment = await db
            .select()
            .from(roomAssignmentTable)
            .where(
              and(
                eq(roomAssignmentTable.stayId, resolvedStayId),
                eq(roomAssignmentTable.isCurrent, true),
              ),
            )
            .limit(1);

          if (currentAssignment.length > 0) {
            resolvedRoomId = currentAssignment[0].roomId;
            resolvedRoomNumber = currentAssignment[0].roomNumber;
          }
        }
      }
    }

    // Resolve Room ID / Room Number if roomId was provided or if room details needed lookup
    if (input.roomId?.trim()) {
      const rawRoom = input.roomId.trim();
      const roomRows = await db
        .select()
        .from(roomTable)
        .where(
          and(
            eq(roomTable.propertyId, input.propertyId),
            or(eq(roomTable.id, rawRoom), eq(roomTable.roomNumber, rawRoom)),
          ),
        )
        .limit(1);

      if (roomRows.length > 0) {
        resolvedRoomId = roomRows[0].id;
        resolvedRoomNumber = roomRows[0].roomNumber;
      } else {
        // If the identifier is not found in roomTable, avoid FK violation on room(id)
        resolvedRoomId = null;
        resolvedRoomNumber = rawRoom;
      }
    }

    // 9. Calculate Acknowledgment and Completion Deadlines from Configured SLA Data
    const now = new Date();
    let ackSeconds = 15 * 60; // 15 mins default
    let compSeconds = 45 * 60; // 45 mins default

    // Query active SLA policy for this category & priority
    const slaPolicyRows = await db
      .select()
      .from(slaPolicyTable)
      .where(
        and(
          eq(slaPolicyTable.propertyId, input.propertyId),
          eq(slaPolicyTable.categoryId, resolvedCategory.id),
          eq(slaPolicyTable.priority, resolvedPriority),
          eq(slaPolicyTable.isActive, true),
        ),
      )
      .orderBy(desc(slaPolicyTable.version))
      .limit(1);

    if (slaPolicyRows.length > 0) {
      ackSeconds = slaPolicyRows[0].acknowledgementSeconds;
      compSeconds = slaPolicyRows[0].completionSeconds;
    } else {
      // Default SLA targets based on category baseline and priority rules
      const catAck = (resolvedCategory.slaResponseMinutes || 15) * 60;
      const catComp = (resolvedCategory.slaResolutionMinutes || 45) * 60;

      if (resolvedPriority === 'safety_critical') {
        ackSeconds = Math.min(catAck, 5 * 60);
        compSeconds = Math.min(catComp, 10 * 60);
      } else if (resolvedPriority === 'urgent') {
        ackSeconds = Math.min(catAck, 5 * 60);
        compSeconds = Math.min(catComp, 25 * 60);
      } else if (resolvedPriority === 'low') {
        ackSeconds = Math.max(catAck, 30 * 60);
        compSeconds = Math.max(catComp, 120 * 60);
      } else {
        ackSeconds = catAck;
        compSeconds = catComp;
      }
    }

    const ackDueAt = new Date(now.getTime() + ackSeconds * 1000);
    const completionDueAt = new Date(now.getTime() + compSeconds * 1000);

    // 10. Generate Collision-Resistant Unique Case & Task References
    const dateStamp = formatDateStamp(now); // e.g. '141126'
    const roomSlug = resolvedRoomNumber || 'GEN';
    const catLower = resolvedCategory.name.toLowerCase();

    const casePrefix = catLower.includes('complaint')
      ? 'GC'
      : catLower.includes('dispute')
        ? 'DSP'
        : catLower.includes('incident')
          ? 'INC'
          : 'REQ';

    const caseEntropy = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const caseRef = `${casePrefix}-${roomSlug}-${dateStamp}-${caseEntropy}`;

    const deptCode = resolvedDepartment.code || resolvedDepartment.name.slice(0, 3).toUpperCase();
    const taskEntropy = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
    const taskRef = `${deptCode}-${roomSlug}-${dateStamp}-${taskEntropy}`;

    const initialStatus: TaskStatus = 'submitted';

    // 11. Atomic Database Transaction: Create Guest Case, Department Task & Attachments
    const result = await db.transaction(async (tx) => {
      // A. Insert Guest Case
      const [createdCase] = await tx
        .insert(guestCaseTable)
        .values({
          ref: caseRef,
          propertyId: input.propertyId,
          stayId: resolvedStayId,
          roomId: resolvedRoomId,
          roomNumber: resolvedRoomNumber,
          guestName: resolvedGuestName,
          ownerMembershipId: validatedMembershipId,
          title: input.instructions.slice(0, 140),
          description: input.instructions,
          priority: resolvedPriority,
          status: 'open',
          source: input.source,
          category: resolvedCategory.name,
          version: 1,
        })
        .returning();

      // B. Insert Department Task
      const taskNotes = staffNotes
        ? `${staffNotes} ${input.instructions}`.trim()
        : null;

      const [createdTask] = await tx
        .insert(departmentTaskTable)
        .values({
          ref: taskRef,
          propertyId: input.propertyId,
          caseId: createdCase.id,
          departmentId: resolvedDepartment.id,
          categoryId: resolvedCategory.id,
          roomId: resolvedRoomId,
          roomNumber: resolvedRoomNumber,
          stayId: resolvedStayId,
          title: input.instructions.slice(0, 140),
          instructions: input.instructions,
          notes: taskNotes,
          priority: resolvedPriority,
          status: initialStatus,
          guestVisible: true,
          source: input.source,
          acknowledgementDueAt: ackDueAt,
          completionDueAt: completionDueAt,
          version: 1,
        })
        .returning();

      // C. Record Initial Task Event in State Machine Log
      await tx.insert(taskEventTable).values({
        propertyId: input.propertyId,
        taskId: createdTask.id,
        actorMembershipId: validatedMembershipId,
        eventType: 'submitted',
        fromStatus: null,
        toStatus: 'submitted',
        notes: `Task submitted via ${input.source}`,
        metadata: {
          caseRef: createdCase.ref,
          taskRef: createdTask.ref,
          source: input.source,
          originalStaffIdentifier: input.createdByStaffId || null,
          hasAttachments: Boolean(input.attachments && input.attachments.length > 0),
        },
      });

      // D. Persist Supported Attachment Metadata
      if (input.attachments && input.attachments.length > 0) {
        for (const att of input.attachments) {
          const uniqueEntropy = crypto.randomBytes(4).toString('hex');
          const objectKey = `case_${createdCase.id}/${uniqueEntropy}_${encodeURIComponent(att.name)}`;
          await tx.insert(attachmentTable).values({
            propertyId: input.propertyId,
            objectKey,
            fileName: att.name,
            contentDigest: att.url || null,
            mediaType: att.mimeType || 'application/octet-stream',
            byteSize: att.size || 0,
            classification: 'general',
            scanStatus: 'clean',
            uploadedByMembershipId: validatedMembershipId,
          });
        }
      }

      return {
        caseId: createdCase.id,
        caseRef: createdCase.ref,
        taskId: createdTask.id,
        department: resolvedDepartment.name,
        category: resolvedCategory.name,
        status: initialStatus,
        ackDueAt,
        completionDueAt,
      };
    });

    // 12. Non-blocking In-Memory Query Projection Sync
    // Updates MockTaskQueryService if active stay exists so guest stay-summary reflects immediately
    if (resolvedStayId) {
      try {
        const queryService = MockTaskQueryService.getInstance();
        const currentTasks = await queryService.getTasksForStay(resolvedStayId);
        currentTasks.unshift({
          taskId: result.taskId,
          category: resolvedCategory.name,
          department: resolvedDepartment.name,
          status: 'received',
          statusLabel: 'Request Received',
          createdAt: now.toISOString(),
          estimatedCompletionAt: completionDueAt.toISOString(),
        });
        queryService.setStayTasks(resolvedStayId, currentTasks);
      } catch {
        // Query projection fallback is non-fatal
      }
    }

    return result;
  }
}

/**
 * Formats a Date object as DDMMYY (e.g. 14th Nov 2026 -> '141126').
 */
function formatDateStamp(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Production wiring point for the canonical task engine.
 * Callers use this function by default; MockTaskEngineService is preserved for explicit testing.
 */
export function getTaskEngineService(): ITaskEngineService {
  if (process.env.USE_MOCK_TASK_ENGINE === 'true') {
    return MockTaskEngineService.getInstance();
  }
  if (process.env.USE_MOCK_TASK_ENGINE === 'false') {
    return TaskEngineService.getInstance();
  }
  if (
    process.env.NODE_ENV === 'production' &&
    getConfiguredDatabaseUrl()?.startsWith('postgresql://')
  ) {
    return TaskEngineService.getInstance();
  }
  return MockTaskEngineService.getInstance();
}
