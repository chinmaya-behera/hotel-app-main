import { z } from 'zod';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from '../guest/repositories/GuestStayRepository.ts';
import {
  type IRoomCatalogRepository,
  getRoomCatalogRepository,
} from '../public/repositories/RoomCatalogRepository.ts';
import {
  type ICleanlinessInspectionService,
  type RoomReadinessStatus,
  MockCleanlinessInspectionService,
} from '../operations/MockCleanlinessInspectionService.ts';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from './FrontDeskStayService.ts';

export const UpdateRoomReadinessSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').trim(),
  targetStatus: z.enum(['dirty', 'cleaning', 'inspection_pending', 'inspected', 'ready', 'out_of_order'], {
    errorMap: () => ({ message: 'Invalid target cleanliness status' }),
  }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  inspectionPassed: z.boolean().optional(),
});

export type UpdateRoomReadinessInput = z.infer<typeof UpdateRoomReadinessSchema>;

export interface RoomReadinessQueryFilters {
  floor?: number | string;
  readiness?: 'all' | 'dirty' | 'cleaning' | 'inspection_pending' | 'inspected' | 'ready' | 'out_of_order';
  occupancy?: 'all' | 'occupied' | 'vacant';
  search?: string;
}

export interface FrontDeskRoomReadinessItem {
  roomId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  readinessStatus: RoomReadinessStatus;
  readinessLabel: string;
  isOccupied: boolean;
  currentStayId?: string;
  currentGuestName?: string;
  dndActive: boolean;
  canCheckIn: boolean;
  notes?: string;
}

export interface RoomReadinessSummaryResult {
  success: boolean;
  statusCode: number;
  data?: {
    rooms: FrontDeskRoomReadinessItem[];
    counts: {
      total: number;
      ready: number;
      dirty: number;
      cleaning: number;
      inspected: number;
      outOfOrder: number;
      occupied: number;
      vacant: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface UpdateReadinessResult {
  success: boolean;
  statusCode: number;
  data?: {
    roomNumber: string;
    previousStatus: RoomReadinessStatus;
    currentStatus: RoomReadinessStatus;
    updatedAt: string;
    updatedBy: string;
    notes?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

const READINESS_LABELS: Record<RoomReadinessStatus, string> = {
  dirty: 'Dirty',
  cleaning: 'Cleaning in Progress',
  inspection_pending: 'Awaiting Inspection',
  inspected: 'Inspection Passed',
  ready: 'Ready for Arrival',
  out_of_order: 'Out of Order',
};

export class RoomReadinessService {
  private stayRepo: IGuestStayRepository;
  private catalogRepo: IRoomCatalogRepository;
  private inspectionService: ICleanlinessInspectionService;

  constructor(
    stayRepo?: IGuestStayRepository,
    catalogRepo?: IRoomCatalogRepository,
    inspectionService?: ICleanlinessInspectionService,
  ) {
    this.stayRepo = stayRepo || getGuestStayRepository();
    this.catalogRepo = catalogRepo || getRoomCatalogRepository();
    this.inspectionService = inspectionService || MockCleanlinessInspectionService.getInstance();
  }

  public async getReadinessBoard(
    staffUser: StaffAuthUser,
    filters?: RoomReadinessQueryFilters,
  ): Promise<RoomReadinessSummaryResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for Front Desk readiness board.',
        },
      };
    }

    const [allCatalogRooms, inHouseStays] = await Promise.all([
      this.catalogRepo.getAllRooms(),
      this.stayRepo.getAllStays({ filter: 'inhouse' }),
    ]);

    // Map active occupancy by roomNumber
    const occupancyByRoom = new Map<string, { stayId: string; guestName: string; dndActive: boolean }>();
    for (const item of inHouseStays) {
      occupancyByRoom.set(item.currentRoom.roomNumber, {
        stayId: item.stay.id,
        guestName: `${item.stay.guestFirstName} ${item.stay.guestLastName}`,
        dndActive: item.currentRoom.dndActive,
      });
    }

    const items: FrontDeskRoomReadinessItem[] = [];
    const counts = {
      total: allCatalogRooms.length,
      ready: 0,
      dirty: 0,
      cleaning: 0,
      inspected: 0,
      outOfOrder: 0,
      occupied: 0,
      vacant: 0,
    };

    for (const room of allCatalogRooms) {
      const occupancy = occupancyByRoom.get(room.roomNumber);
      const isOccupied = Boolean(occupancy);

      if (isOccupied) {
        counts.occupied++;
      } else {
        counts.vacant++;
      }

      // Check synchronized cleanliness status from Developer 2 inspection service
      const inspectionMock = MockCleanlinessInspectionService.getInstance();
      const readinessStatus = inspectionMock.getStatus(room.roomNumber);

      if (readinessStatus === 'ready') counts.ready++;
      else if (readinessStatus === 'dirty') counts.dirty++;
      else if (readinessStatus === 'cleaning') counts.cleaning++;
      else if (readinessStatus === 'inspected' || readinessStatus === 'inspection_pending') counts.inspected++;
      else if (readinessStatus === 'out_of_order') counts.outOfOrder++;

      const canCheckIn = !isOccupied && readinessStatus === 'ready';

      const item: FrontDeskRoomReadinessItem = {
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        readinessStatus,
        readinessLabel: READINESS_LABELS[readinessStatus] || readinessStatus,
        isOccupied,
        currentStayId: occupancy?.stayId,
        currentGuestName: occupancy?.guestName,
        dndActive: occupancy?.dndActive || false,
        canCheckIn,
      };

      // Apply query filters
      if (filters?.floor !== undefined && filters.floor !== '') {
        const targetFloor = Number(filters.floor);
        if (room.floor !== targetFloor) continue;
      }

      if (filters?.readiness && filters.readiness !== 'all') {
        if (readinessStatus !== filters.readiness) continue;
      }

      if (filters?.occupancy && filters.occupancy !== 'all') {
        if (filters.occupancy === 'occupied' && !isOccupied) continue;
        if (filters.occupancy === 'vacant' && isOccupied) continue;
      }

      if (filters?.search && filters.search.trim() !== '') {
        const q = filters.search.trim().toLowerCase();
        const matchesNo = room.roomNumber.toLowerCase().includes(q);
        const matchesType = room.roomType.toLowerCase().includes(q);
        const matchesGuest = occupancy?.guestName.toLowerCase().includes(q);
        if (!matchesNo && !matchesType && !matchesGuest) continue;
      }

      items.push(item);
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        rooms: items,
        counts,
      },
    };
  }

  public async updateReadiness(
    staffUser: StaffAuthUser,
    input: UpdateRoomReadinessInput,
  ): Promise<UpdateReadinessResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for Front Desk readiness updates.',
        },
      };
    }

    // Verify room exists in catalog
    const room = await this.catalogRepo.getRoomByNumber(input.roomNumber);
    if (!room) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with number '${input.roomNumber}' was not found in hotel catalog.`,
        },
      };
    }

    // If attempting to place out_of_order, verify room is not currently occupied (F27 rule)
    if (input.targetStatus === 'out_of_order') {
      const inHouseStays = await this.stayRepo.getAllStays({ filter: 'inhouse' });
      const isOccupied = inHouseStays.some((s) => s.currentRoom.roomNumber === input.roomNumber);
      if (isOccupied) {
        return {
          success: false,
          statusCode: 400,
          error: {
            code: 'CANNOT_BLOCK_OCCUPIED_ROOM',
            message: `Room ${input.roomNumber} is currently occupied by an active guest. Move the guest before blocking the room (F27).`,
          },
        };
      }
    }

    // Delegate to Developer 2's canonical inspection synchronization contract
    try {
      const syncResult = await this.inspectionService.syncRoomCleanliness({
        roomNumber: input.roomNumber,
        targetStatus: input.targetStatus,
        staffId: staffUser.staffId,
        staffRole: staffUser.role,
        notes: input.notes,
        inspectionPassed: input.inspectionPassed,
      });

      // Also sync room cleanliness in guest stay repository if room has active assignment
      await this.stayRepo.updateRoomCleanliness(room.roomId, input.targetStatus as any);

      return {
        success: true,
        statusCode: 200,
        data: syncResult,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cleanliness status update failed';
      const isForbidden = message.startsWith('INSPECTION_SUPERVISOR_REQUIRED') || message.startsWith('MANAGER_APPROVAL_REQUIRED');

      return {
        success: false,
        statusCode: isForbidden ? 403 : 400,
        error: {
          code: isForbidden ? 'UNAUTHORIZED_STATUS_CHANGE' : 'UPDATE_FAILED',
          message,
        },
      };
    }
  }
}
