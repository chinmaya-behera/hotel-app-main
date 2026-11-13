import { QrAuthService } from './QrAuthService.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from './repositories/GuestStayRepository.ts';
import type { ITaskQueryService, GuestTaskProjection } from '../operations/contracts.ts';
import { MockTaskQueryService } from '../operations/MockTaskQueryService.ts';

export interface GuestStaySummaryResponse {
  stay: {
    stayId: string;
    propertyId: string;
    roomNumber: string;
    floor: number;
    roomType: string;
    status: string;
    checkInAt: string;
    expectedCheckoutAt: string;
    dndActive: boolean;
  };
  guest: {
    displayName: string;
    firstName: string;
    lastName: string;
  };
  requests: GuestTaskProjection[];
}

export interface StaySummaryResult {
  success: boolean;
  statusCode: number;
  data?: GuestStaySummaryResponse;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Service orchestrating guest dashboard summary projections.
 * Strictly enforces guest privacy and session-anchored data access.
 */
export class GuestStayService {
  private repository: IGuestStayRepository;
  private taskQueryService: ITaskQueryService;

  constructor(
    repository?: IGuestStayRepository,
    taskQueryService?: ITaskQueryService,
  ) {
    this.repository = repository || getGuestStayRepository();
    this.taskQueryService = taskQueryService || MockTaskQueryService.getInstance();
  }

  /**
   * Retrieves the authenticated guest's stay summary and active request projections.
   *
   * SECURITY INVARIANT:
   * Data is retrieved ONLY using the verified session token.
   * Client-supplied stay IDs are NEVER accepted to prevent cross-stay data access.
   */
  public async getStaySummary(sessionToken: string): Promise<StaySummaryResult> {
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
    let stayDetails;
    try {
      stayDetails = await this.repository.getStayWithRoomById(session.stayId);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Database query failure';
      return {
        success: false,
        statusCode: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Failed to query stay details: ${errorMsg}`,
        },
      };
    }

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
          message: `Stay status is '${stay.status}'. Only in-house checked-in guests can access this dashboard.`,
        },
      };
    }

    // 4. Query Guest Request Projections via Developer 2 Contract
    let requests: GuestTaskProjection[] = [];
    try {
      requests = await this.taskQueryService.getTasksForStay(stay.id);
    } catch {
      // Degrade gracefully if task query encounters an error
      requests = [];
    }

    // 5. Construct Sanitized, Privacy-Safe Projection
    // NEVER includes internal notes, staff phone numbers, employee IDs, or financial calculations.
    const responsePayload: GuestStaySummaryResponse = {
      stay: {
        stayId: stay.id,
        propertyId: stay.propertyId,
        roomNumber: currentRoom.roomNumber,
        floor: currentRoom.floor,
        roomType: currentRoom.roomType,
        status: stay.status,
        checkInAt: stay.checkInTime.toISOString(),
        expectedCheckoutAt: stay.checkOutTime.toISOString(),
        dndActive: currentRoom.dndActive,
      },
      guest: {
        displayName: `${stay.guestFirstName} ${stay.guestLastName}`,
        firstName: stay.guestFirstName,
        lastName: stay.guestLastName,
      },
      requests: requests.map((r) => ({
        taskId: r.taskId,
        category: r.category,
        department: r.department,
        status: r.status,
        statusLabel: r.statusLabel,
        createdAt: r.createdAt,
        estimatedCompletionAt: r.estimatedCompletionAt,
        completedAt: r.completedAt,
      })),
    };

    return {
      success: true,
      statusCode: 200,
      data: responsePayload,
    };
  }
}
