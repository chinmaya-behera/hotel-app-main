import { z } from 'zod';
import { QrAuthService } from './QrAuthService.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from './repositories/GuestStayRepository.ts';

export const UpdateDndRequestSchema = z.object({
  dndActive: z.boolean({ required_error: 'dndActive boolean is required' }),
  duration: z.string().optional(),
  instructions: z.string().max(500, 'Instructions cannot exceed 500 characters').optional(),
  targetRoomNumber: z.string().optional(),
});

export type UpdateDndRequestInput = z.infer<typeof UpdateDndRequestSchema>;

export interface GuestDndResponse {
  roomNumber: string;
  dndActive: boolean;
  statusLabel: string;
  updatedAt: string;
  duration?: string;
  instructions?: string;
}

export interface GuestDndResult {
  success: boolean;
  statusCode: number;
  data?: GuestDndResponse;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

/**
 * Service orchestrating guest digital Do Not Disturb (DND) state changes.
 * Enforces session-anchored room ownership, prevents cross-room tampering,
 * and guards against post-checkout modifications.
 */
export class GuestDndService {
  private repository: IGuestStayRepository;

  constructor(repository?: IGuestStayRepository) {
    this.repository = repository || getGuestStayRepository();
  }

  public async setDndStatus(
    sessionToken: string,
    input: UpdateDndRequestInput,
  ): Promise<GuestDndResult> {
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

    // 2. Cross-Room Tamper Guard
    if (input.targetRoomNumber && input.targetRoomNumber !== session.roomNumber) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'CROSS_ROOM_UPDATE_DENIED',
          message: `Cannot update DND status for Room ${input.targetRoomNumber} from a Room ${session.roomNumber} session.`,
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
          message: `Stay status is '${stay.status}'. DND can only be toggled for currently checked-in guests.`,
        },
      };
    }

    // 5. Update DND state in Repository
    await this.repository.updateRoomDnd(session.stayId, input.dndActive);

    const now = new Date().toISOString();
    return {
      success: true,
      statusCode: 200,
      data: {
        roomNumber: currentRoom.roomNumber,
        dndActive: input.dndActive,
        statusLabel: input.dndActive ? 'DND ACTIVE' : 'STANDARD SERVICE',
        updatedAt: now,
        duration: input.duration || (input.dndActive ? 'Until I Turn It Off' : 'Manual release'),
        instructions: input.instructions?.trim() || undefined,
      },
    };
  }
}
