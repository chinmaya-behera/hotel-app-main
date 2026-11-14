import { z } from 'zod';
import { QrAuthService } from './QrAuthService.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from './repositories/GuestStayRepository.ts';
import type { ITaskEngineService } from '../operations/contracts.ts';
import {
  getTaskEngineService,
  TaskEngineDomainError,
} from '../operations/TaskEngineService.ts';


export const CreateGuestRequestSchema = z.object({
  department: z.string().min(1, 'Department is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  instructions: z.string().min(1, 'Instructions cannot be empty').max(1000, 'Instructions cannot exceed 1000 characters').trim(),
  priority: z.enum(['low', 'normal', 'urgent', 'safety_critical']).default('normal'),
  preferredTime: z.string().optional(),
  idempotencyKey: z.string().optional(),
  targetRoomNumber: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        size: z.number().nonnegative(),
        mimeType: z.string().min(1),
      }),
    )
    .optional(),
});

export type CreateGuestRequestInput = z.infer<typeof CreateGuestRequestSchema>;

export interface GuestRequestSubmissionResponse {
  caseRef: string;
  caseId: string;
  taskId: string;
  department: string;
  category: string;
  status: string;
  statusLabel: string;
  estimatedCompletionAt: string;
  createdAt: string;
}

export interface GuestRequestResult {
  success: boolean;
  statusCode: number;
  data?: GuestRequestSubmissionResponse;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

interface IdempotencyCacheEntry {
  response: GuestRequestSubmissionResponse;
  timestamp: number;
}

/**
 * Service orchestrating guest in-room service request submissions.
 * Verifies guest authorization, protects against tampering and duplicate submissions,
 * and delegates case creation to Developer 2's canonical TaskEngineService.
 */
export class GuestRequestService {
  private repository: IGuestStayRepository;
  private taskEngineService: ITaskEngineService;

  // In-memory idempotency cache (keyed by idempotencyKey or stayId:category:instructionsHash)
  private static idempotencyStore = new Map<string, IdempotencyCacheEntry>();

  constructor(
    repository?: IGuestStayRepository,
    taskEngineService?: ITaskEngineService,
  ) {
    this.repository = repository || getGuestStayRepository();
    this.taskEngineService = taskEngineService || getTaskEngineService();
  }

  /**
   * Submits an in-room guest service request.
   */
  public async submitRequest(
    sessionToken: string,
    rawInput: CreateGuestRequestInput,
  ): Promise<GuestRequestResult> {
    // 1. Session Token Validation
    const authResult = QrAuthService.validateSession(sessionToken);
    if (!authResult.valid || !authResult.session) {
      const reason = authResult.reason || 'UNAUTHORIZED';
      let message = 'Guest session is invalid or not found.';
      if (reason === 'MISSING_TOKEN') {
        message = 'Authentication required. Active guest session cookie is missing.';
      } else if (reason === 'SESSION_EXPIRED') {
        message = 'Guest session has expired. Please re-authenticate at your room QR.';
      } else if (reason === 'room_move') {
        message = 'Session invalidated due to room change. Please scan the QR code in your new room.';
      } else if (reason === 'checkout') {
        message = 'Session closed because the stay has been checked out.';
      }

      return {
        success: false,
        statusCode: 401,
        error: {
          code: 'UNAUTHORIZED',
          message,
        },
      };
    }

    const { session } = authResult;

    // 2. Cross-Room Tamper Guard:
    // If the client explicitly passed a targetRoomNumber and it doesn't match session.roomNumber, reject immediately!
    if (rawInput.targetRoomNumber && rawInput.targetRoomNumber !== session.roomNumber) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'CROSS_ROOM_SUBMISSION_DENIED',
          message: `Cannot submit request for Room ${rawInput.targetRoomNumber} from a Room ${session.roomNumber} session.`,
        },
      };
    }

    // 3. Query Stay Context from Repository
    const stayDetails = await this.repository.getStayWithRoomById(session.stayId);
    if (!stayDetails) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'STAY_NOT_FOUND',
          message: 'Active stay record could not be found for this session.',
        },
      };
    }

    const { stay, currentRoom } = stayDetails;

    // 4. Verify Active In-House Stay Status
    if (stay.status !== 'checked_in') {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'STAY_NOT_ACTIVE',
          message: `Stay status is '${stay.status}'. Only in-house checked-in guests can submit requests.`,
        },
      };
    }

    // 5. Idempotency Protection
    const cacheKey = rawInput.idempotencyKey
      ? `idemp_${session.stayId}_${rawInput.idempotencyKey}`
      : `idemp_${session.stayId}_${rawInput.category}_${rawInput.instructions.slice(0, 30)}`;

    const existingEntry = GuestRequestService.idempotencyStore.get(cacheKey);
    const now = Date.now();
    if (existingEntry && now - existingEntry.timestamp < 10 * 60 * 1000) {
      // Return cached result (duplicate submission prevented)
      return {
        success: true,
        statusCode: 200,
        data: existingEntry.response,
      };
    }

    // 6. Format Instructions with Preferred Time if specified
    const instructions = rawInput.preferredTime
      ? `${rawInput.instructions}\n[Preferred Time: ${rawInput.preferredTime}]`
      : rawInput.instructions;

    // 7. Delegate to Developer 2's Canonical Task Engine Service
    let taskResult;
    try {
      taskResult = await this.taskEngineService.createCaseAndTask({
        propertyId: stay.propertyId,
        stayId: stay.id,
        roomId: currentRoom.roomId,
        department: rawInput.department,
        category: rawInput.category,
        priority: rawInput.priority,
        source: 'guest_portal',
        instructions,
        attachments: rawInput.attachments,
      });
    } catch (err: unknown) {
      if (err instanceof TaskEngineDomainError) {
        return {
          success: false,
          statusCode: err.statusCode,
          error: {
            code: err.code,
            message: err.message,
          },
        };
      }
      const errorMsg = err instanceof Error ? err.message : 'Unknown task engine error';
      return {
        success: false,
        statusCode: 503,
        error: {
          code: 'OPERATIONS_SERVICE_UNAVAILABLE',
          message: `Operations task engine is temporarily unavailable: ${errorMsg}`,
        },
      };
    }

    // 8. Construct Guest-Safe Response
    const submissionResponse: GuestRequestSubmissionResponse = {
      caseRef: taskResult.caseRef,
      caseId: taskResult.caseId,
      taskId: taskResult.taskId,
      department: taskResult.department,
      category: rawInput.category,
      status: taskResult.status,
      statusLabel: 'Request Received',
      estimatedCompletionAt: taskResult.completionDueAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Cache in idempotency store
    GuestRequestService.idempotencyStore.set(cacheKey, {
      response: submissionResponse,
      timestamp: now,
    });

    return {
      success: true,
      statusCode: 201,
      data: submissionResponse,
    };
  }

  public static clearIdempotencyCache(): void {
    this.idempotencyStore.clear();
  }
}
