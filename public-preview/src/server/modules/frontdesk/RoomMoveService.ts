import { z } from 'zod';
import {
  type IGuestStayRepository,
  type RoomAssignment,
  getGuestStayRepository,
} from '../guest/repositories/GuestStayRepository.ts';
import {
  type IRoomCatalogRepository,
  getRoomCatalogRepository,
} from '../public/repositories/RoomCatalogRepository.ts';
import { QrAuthService } from '../guest/QrAuthService.ts';
import { MockTaskEngineService } from '../operations/MockTaskEngineService.ts';
import { MockCleanlinessInspectionService } from '../operations/MockCleanlinessInspectionService.ts';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from './FrontDeskStayService.ts';

export const RoomMoveSchema = z.object({
  toRoomNumber: z.string().min(1, 'Destination room number is required').trim(),
  reason: z.string().min(3, 'A valid reason for the room move is required (min 3 characters)').max(500).trim(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  overrideUnready: z.boolean().optional(),
});

export type RoomMoveInput = z.infer<typeof RoomMoveSchema>;

export interface RoomMoveSuccessDto {
  stayId: string;
  bookingReference: string;
  guestName: string;
  previousRoomNumber: string;
  newRoomNumber: string;
  newRoomType: string;
  floor: number;
  movedAt: string;
  reason: string;
  oldSessionsRevoked: number;
  turnoverTaskCreated: boolean;
  turnoverTaskId?: string;
  message: string;
}

export interface RoomMoveResult {
  success: boolean;
  statusCode: number;
  data?: RoomMoveSuccessDto;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export class RoomMoveService {
  private stayRepo: IGuestStayRepository;
  private catalogRepo: IRoomCatalogRepository;
  private taskEngine: MockTaskEngineService;
  private inspectionService: MockCleanlinessInspectionService;

  constructor(
    stayRepo?: IGuestStayRepository,
    catalogRepo?: IRoomCatalogRepository,
    taskEngine?: MockTaskEngineService,
    inspectionService?: MockCleanlinessInspectionService,
  ) {
    this.stayRepo = stayRepo || getGuestStayRepository();
    this.catalogRepo = catalogRepo || getRoomCatalogRepository();
    this.taskEngine = taskEngine || MockTaskEngineService.getInstance();
    this.inspectionService = inspectionService || MockCleanlinessInspectionService.getInstance();
  }

  public async executeRoomMove(
    staffUser: StaffAuthUser,
    stayId: string,
    input: RoomMoveInput,
  ): Promise<RoomMoveResult> {
    // 1. Staff Authorization Guard (staff only, never guest initiated)
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for room move operations.',
        },
      };
    }

    // 2. Validate Stay Context
    const stayWithRoom = await this.stayRepo.getStayWithRoomById(stayId);
    if (!stayWithRoom) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'STAY_NOT_FOUND',
          message: `Stay record with ID '${stayId}' was not found.`,
        },
      };
    }

    const { stay, currentRoom } = stayWithRoom;

    // 3. Status Guard: Only active in-house stays can be moved
    if (stay.status !== 'checked_in') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'STAY_NOT_ACTIVE',
          message: `Stay status is '${stay.status}'. Only active in-house checked-in guests can be moved to another room.`,
        },
      };
    }

    // 4. Verify Destination Room Exists in Catalog (Developer 1 Master Data)
    const destinationRoom = await this.catalogRepo.getRoomByNumber(input.toRoomNumber);
    if (!destinationRoom) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'DESTINATION_ROOM_NOT_FOUND',
          message: `Destination Room ${input.toRoomNumber} is not in the room inventory.`,
        },
      };
    }

    // 5. Prevent Move to the Exact Same Room
    if (currentRoom.roomNumber === input.toRoomNumber) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'SAME_ROOM_MOVE_REJECTED',
          message: `Guest is already assigned to Room ${input.toRoomNumber}. Please choose a different room.`,
        },
      };
    }

    // 6. Destination Room Occupancy Guard
    const inHouseStays = await this.stayRepo.getAllStays({ filter: 'inhouse' });
    const isOccupied = inHouseStays.some(
      (s) => s.currentRoom.roomNumber === input.toRoomNumber && s.stay.id !== stay.id,
    );
    if (isOccupied) {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'DESTINATION_ROOM_OCCUPIED',
          message: `Destination Room ${input.toRoomNumber} is currently occupied by another active guest.`,
        },
      };
    }

    // 7. Destination Room Cleanliness & Readiness Guard
    const cleanlinessStatus = this.inspectionService.getStatus(input.toRoomNumber);

    if (cleanlinessStatus === 'out_of_order') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'DESTINATION_ROOM_OUT_OF_ORDER',
          message: `Room ${input.toRoomNumber} is blocked out of order and cannot be assigned.`,
        },
      };
    }

    if (cleanlinessStatus !== 'ready' && !input.overrideUnready) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'DESTINATION_ROOM_NOT_READY',
          message: `Room ${input.toRoomNumber} is "${cleanlinessStatus}". Only supervisor-inspected ready rooms can be assigned (F21).`,
        },
      };
    }

    // 8. Execute Atomic Room Move in Repository (Preserving Full History)
    await this.stayRepo.executeRoomMove(stay.id, {
      roomId: destinationRoom.roomId,
      roomNumber: destinationRoom.roomNumber,
      floor: destinationRoom.floor,
      roomType: destinationRoom.roomType,
    });

    // 9. Mark Old Room Dirty in Cleanliness Service
    await this.inspectionService.syncRoomCleanliness({
      roomNumber: currentRoom.roomNumber,
      targetStatus: 'dirty',
      staffId: staffUser.staffId,
      staffRole: staffUser.role,
      notes: `Turnover initiated by room move to ${destinationRoom.roomNumber}. Reason: ${input.reason}`,
    });

    // 10. Immediately Revoke Old Room Guest Sessions using existing QrAuthService
    // Security Invariant: The guest's old room QR session is immediately revoked with reason 'room_move'
    const revokedCount = QrAuthService.revokeAllSessionsForRoom(currentRoom.roomNumber, 'room_move');

    // 11. Trigger Turnover Cleaning Task via Developer 2 Task Engine Contract (Table 14.4 / Line 805)
    let turnoverTaskId: string | undefined;
    try {
      const turnoverResult = await this.taskEngine.createCaseAndTask({
        propertyId: stay.propertyId,
        roomId: currentRoom.roomId,
        department: 'Housekeeping',
        category: 'Turnover Cleaning',
        priority: 'urgent',
        source: 'front_desk',
        instructions: `Checkout turnover cleaning for Room ${currentRoom.roomNumber} following guest move to Room ${destinationRoom.roomNumber}. Reason: ${input.reason}`,
        createdByStaffId: staffUser.staffId,
      });
      turnoverTaskId = turnoverResult.taskId;
    } catch {
      // Non-blocking fallback for task engine stub
    }

    const movedAt = new Date().toISOString();
    const guestFullName = `${stay.guestFirstName} ${stay.guestLastName}`;
    const message = `${guestFullName} successfully moved from Room ${currentRoom.roomNumber} to Room ${destinationRoom.roomNumber}. Old room session was revoked, and turnover cleaning was scheduled.`;

    return {
      success: true,
      statusCode: 200,
      data: {
        stayId: stay.id,
        bookingReference: stay.bookingReference,
        guestName: guestFullName,
        previousRoomNumber: currentRoom.roomNumber,
        newRoomNumber: destinationRoom.roomNumber,
        newRoomType: destinationRoom.roomType,
        floor: destinationRoom.floor,
        movedAt,
        reason: input.reason,
        oldSessionsRevoked: revokedCount,
        turnoverTaskCreated: Boolean(turnoverTaskId),
        turnoverTaskId,
        message,
      },
    };
  }

  public async getStayRoomHistory(stayId: string): Promise<RoomAssignment[]> {
    return this.stayRepo.getRoomAssignmentsForStay(stayId);
  }
}
