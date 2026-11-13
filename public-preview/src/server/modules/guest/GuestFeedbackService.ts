import { z } from 'zod';
import { QrAuthService } from './QrAuthService.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from './repositories/GuestStayRepository.ts';
import {
  type IGuestFeedbackRepository,
  getGuestFeedbackRepository,
} from './repositories/GuestFeedbackRepository.ts';
import type { ITaskQueryService } from '../operations/contracts.ts';
import { MockTaskQueryService } from '../operations/MockTaskQueryService.ts';

export const SubmitFeedbackSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required').trim(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;

export interface GuestFeedbackResponse {
  feedbackId: string;
  taskId: string;
  stayId: string;
  roomNumber: string;
  rating: number;
  comment?: string;
  tags?: string[];
  submittedAt: string;
}

export interface FeedbackResult {
  success: boolean;
  statusCode: number;
  data?: GuestFeedbackResponse;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

/**
 * Service managing in-room guest feedback and star ratings on completed tasks.
 * Strictly verifies stay ownership, ensures request is completed, and blocks duplicates.
 */
export class GuestFeedbackService {
  private stayRepository: IGuestStayRepository;
  private feedbackRepository: IGuestFeedbackRepository;
  private taskQueryService: ITaskQueryService;

  constructor(
    stayRepository?: IGuestStayRepository,
    feedbackRepository?: IGuestFeedbackRepository,
    taskQueryService?: ITaskQueryService,
  ) {
    this.stayRepository = stayRepository || getGuestStayRepository();
    this.feedbackRepository = feedbackRepository || getGuestFeedbackRepository();
    this.taskQueryService = taskQueryService || MockTaskQueryService.getInstance();
  }

  public async submitFeedback(
    sessionToken: string,
    input: SubmitFeedbackInput,
  ): Promise<FeedbackResult> {
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

    // 2. Query Stay Context from Repository
    const stayDetails = await this.stayRepository.getStayWithRoomById(session.stayId);
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

    // 3. Verify Active In-House Stay Status
    if (stay.status !== 'checked_in') {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'STAY_NOT_ACTIVE',
          message: `Stay status is '${stay.status}'. Feedback can only be submitted for active stays.`,
        },
      };
    }

    // 4. Check if task belongs to this stay via Developer 2 contract
    const tasks = await this.taskQueryService.getTasksForStay(stay.id);
    const targetTask = tasks.find((t) => t.taskId === input.taskId);

    if (!targetTask) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Request ${input.taskId} was not found or does not belong to your stay.`,
        },
      };
    }

    // 5. Completion Check: Feedback is only permitted for COMPLETED requests!
    if (targetTask.status !== 'completed') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'TASK_NOT_COMPLETED',
          message: `Feedback can only be submitted for completed requests. Current status: '${targetTask.statusLabel || targetTask.status}'.`,
        },
      };
    }

    // 6. Duplicate Feedback Check
    const existingFeedback = await this.feedbackRepository.getFeedbackByTaskId(input.taskId);
    if (existingFeedback) {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'FEEDBACK_ALREADY_EXISTS',
          message: `Feedback has already been submitted for request ${input.taskId}.`,
        },
      };
    }

    // 7. Store feedback record
    const saved = await this.feedbackRepository.createFeedback({
      taskId: input.taskId,
      stayId: stay.id,
      guestName: `${stay.guestFirstName} ${stay.guestLastName}`,
      roomNumber: currentRoom.roomNumber,
      rating: input.rating,
      comment: input.comment?.trim(),
      tags: input.tags,
    });

    return {
      success: true,
      statusCode: 201,
      data: {
        feedbackId: saved.id,
        taskId: saved.taskId,
        stayId: saved.stayId,
        roomNumber: saved.roomNumber,
        rating: saved.rating,
        comment: saved.comment,
        tags: saved.tags,
        submittedAt: saved.submittedAt,
      },
    };
  }
}
