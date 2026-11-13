import { z } from 'zod';
import {
  type IGuestStayRepository,
  type StayWithRoomDetails,
  type StayQueryFilters,
  getGuestStayRepository,
} from '../guest/repositories/GuestStayRepository.ts';

export const CheckInRequestSchema = z.object({
  verifyIdAtDesk: z.boolean().optional(),
  docType: z.string().optional(),
  docNumber: z.string().optional(),
  overrideRoomUnready: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export type CheckInRequestInput = z.infer<typeof CheckInRequestSchema>;

export interface StaffAuthUser {
  staffId: string;
  name: string;
  role: string; // 'front_desk' | 'duty_manager' | 'general_manager' | 'admin' | string
}

export interface FrontDeskStaySummary {
  stayId: string;
  bookingReference: string;
  guestName: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: 'reserved' | 'pending_verify' | 'checked_in' | 'checked_out' | 'cancelled';
  statusLabel: string;
  checkInDate: string;
  checkOutDate: string;
  cleanlinessStatus: 'dirty' | 'cleaning' | 'inspected' | 'ready';
  idVerificationStatus: 'none' | 'pending_verify' | 'verified' | 'failed';
  isIdChecked: boolean;
  canCheckIn: boolean;
  checkInBlockerReason?: string;
  welcomeTvPinMasked: string;
}

export interface FrontDeskStayListResult {
  success: boolean;
  statusCode: number;
  data?: {
    stays: FrontDeskStaySummary[];
    counts: {
      total: number;
      arrivals: number;
      inHouse: number;
      departures: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CheckInExecutionResult {
  success: boolean;
  statusCode: number;
  data?: {
    stayId: string;
    bookingReference: string;
    guestName: string;
    roomNumber: string;
    roomType: string;
    status: 'checked_in';
    checkInTime: string;
    idVerificationStatus: 'verified';
    qrSessionActive: boolean;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

const AUTHORIZED_ROLES = ['front_desk', 'duty_manager', 'general_manager', 'admin', 'supervisor'];

export class FrontDeskStayService {
  private stayRepo: IGuestStayRepository;

  constructor(stayRepo?: IGuestStayRepository) {
    this.stayRepo = stayRepo || getGuestStayRepository();
  }

  /**
   * Helper to validate staff authorization for Front Desk actions.
   */
  public static validateStaffRole(user: StaffAuthUser | null | undefined): { authorized: boolean; reason?: string } {
    if (!user || !user.role) {
      return { authorized: false, reason: 'Staff authentication required.' };
    }
    const normalizedRole = user.role.toLowerCase().replace(/[\s-]/g, '_');
    const isAuthorized = AUTHORIZED_ROLES.some((r) => normalizedRole.includes(r));
    if (!isAuthorized) {
      return {
        authorized: false,
        reason: `Role '${user.role}' is not authorized to perform Front Desk operations.`,
      };
    }
    return { authorized: true };
  }

  private mapStayToSummary(stayWithRoom: StayWithRoomDetails): FrontDeskStaySummary {
    const { stay, currentRoom, preArrival } = stayWithRoom;
    const isIdChecked = preArrival?.idVerificationStatus === 'verified';
    const idVerificationStatus = preArrival?.idVerificationStatus || 'none';

    let canCheckIn = false;
    let checkInBlockerReason: string | undefined;

    if (stay.status === 'checked_in') {
      checkInBlockerReason = 'Guest is already checked in.';
    } else if (stay.status === 'checked_out') {
      checkInBlockerReason = 'Stay has already concluded.';
    } else if (stay.status === 'cancelled') {
      checkInBlockerReason = 'Reservation is cancelled.';
    } else if (!isIdChecked && idVerificationStatus !== 'pending_verify') {
      checkInBlockerReason = 'Guest ID must be verified before check-in (F08).';
    } else if (currentRoom.cleanlinessStatus !== 'ready') {
      checkInBlockerReason = `Room ${currentRoom.roomNumber} is "${currentRoom.cleanlinessStatus}". Only inspected ready rooms can be assigned (F21).`;
    } else {
      canCheckIn = true;
    }

    const statusMap: Record<string, string> = {
      reserved: 'Expected Arrival',
      pending_verify: 'Pre-Checkin Pending Verify',
      checked_in: 'In-House',
      checked_out: 'Departed',
      cancelled: 'Cancelled',
    };

    return {
      stayId: stay.id,
      bookingReference: stay.bookingReference,
      guestName: `${stay.guestFirstName} ${stay.guestLastName}`,
      guestFirstName: stay.guestFirstName,
      guestLastName: stay.guestLastName,
      guestEmail: stay.guestEmail,
      guestPhone: stay.guestPhone,
      roomNumber: currentRoom.roomNumber,
      roomType: currentRoom.roomType,
      floor: currentRoom.floor,
      status: stay.status as FrontDeskStaySummary['status'],
      statusLabel: statusMap[stay.status] || stay.status,
      checkInDate: stay.checkInTime.toISOString().split('T')[0],
      checkOutDate: stay.checkOutTime.toISOString().split('T')[0],
      cleanlinessStatus: currentRoom.cleanlinessStatus as FrontDeskStaySummary['cleanlinessStatus'],
      idVerificationStatus,
      isIdChecked,
      canCheckIn,
      checkInBlockerReason,
      welcomeTvPinMasked: '****',
    };
  }

  public async getStays(
    staffUser: StaffAuthUser,
    filters?: StayQueryFilters,
  ): Promise<FrontDeskStayListResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Unauthorized for Front Desk operations.',
        },
      };
    }

    const allRecords = await this.stayRepo.getAllStays();

    // Compute category counts
    let arrivalsCount = 0;
    let inHouseCount = 0;
    let departuresCount = 0;

    for (const item of allRecords) {
      if (item.stay.status === 'reserved' || item.stay.status === 'pending_verify') {
        arrivalsCount++;
      } else if (item.stay.status === 'checked_in') {
        inHouseCount++;
        // Departures today or ongoing
        departuresCount++;
      }
    }

    // Filter list according to request query
    const filteredRecords = await this.stayRepo.getAllStays(filters);
    const summaries = filteredRecords.map((r) => this.mapStayToSummary(r));

    return {
      success: true,
      statusCode: 200,
      data: {
        stays: summaries,
        counts: {
          total: allRecords.length,
          arrivals: arrivalsCount,
          inHouse: inHouseCount,
          departures: departuresCount,
        },
      },
    };
  }

  public async getStayById(
    staffUser: StaffAuthUser,
    stayId: string,
  ): Promise<{ success: boolean; statusCode: number; data?: FrontDeskStaySummary; error?: { code: string; message: string } }> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: { code: 'FORBIDDEN', message: auth.reason || 'Unauthorized.' },
      };
    }

    const stayWithRoom = await this.stayRepo.getStayWithRoomById(stayId);
    if (!stayWithRoom) {
      return {
        success: false,
        statusCode: 404,
        error: { code: 'STAY_NOT_FOUND', message: `Stay with ID '${stayId}' not found.` },
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: this.mapStayToSummary(stayWithRoom),
    };
  }

  public async processCheckIn(
    staffUser: StaffAuthUser,
    stayId: string,
    input: CheckInRequestInput,
  ): Promise<CheckInExecutionResult> {
    // 1. Staff Authorization Guard
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Unauthorized for Front Desk operations.',
        },
      };
    }

    // 2. Query Stay Context
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

    const { stay, currentRoom, preArrival } = stayWithRoom;

    // 3. Status Guard
    if (stay.status === 'checked_in') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ALREADY_CHECKED_IN',
          message: `${stay.guestFirstName} ${stay.guestLastName} is already checked in to Room ${currentRoom.roomNumber}.`,
        },
      };
    }

    if (stay.status === 'cancelled') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'RESERVATION_CANCELLED',
          message: 'Cannot check in a cancelled reservation.',
        },
      };
    }

    if (stay.status === 'checked_out') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'STAY_ALREADY_COMPLETED',
          message: 'This stay has already concluded and was checked out.',
        },
      };
    }

    // 4. ID Verification Guard (F08)
    const isAlreadyVerified = preArrival?.idVerificationStatus === 'verified';
    const isDeskVerificationRequested = Boolean(input.verifyIdAtDesk);

    if (!isAlreadyVerified && !isDeskVerificationRequested) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ID_VERIFICATION_REQUIRED',
          message: 'Guest photo ID must be verified before completing check-in (F08).',
        },
      };
    }

    // 5. Room Readiness Guard (F21)
    if (currentRoom.cleanlinessStatus !== 'ready' && !input.overrideRoomUnready) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ROOM_NOT_READY',
          message: `Room ${currentRoom.roomNumber} is "${currentRoom.cleanlinessStatus}". Only supervisor-inspected ready rooms can be checked in (F21).`,
        },
      };
    }

    // 6. Room Occupancy Guard
    const inHouseStays = await this.stayRepo.getAllStays({ filter: 'inhouse' });
    const conflictingStay = inHouseStays.find(
      (s) => s.currentRoom.roomId === currentRoom.roomId && s.stay.id !== stay.id,
    );
    if (conflictingStay) {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_OCCUPIED',
          message: `Room ${currentRoom.roomNumber} is currently occupied by another active stay (${conflictingStay.stay.guestLastName}).`,
        },
      };
    }

    // 7. Execute State Transition
    const checkInTime = new Date();
    await this.stayRepo.updateStayStatus(stay.id, 'checked_in', checkInTime);

    // Record verified ID details
    const updatedPreArrival = {
      estimatedArrivalTime: preArrival?.estimatedArrivalTime,
      idDocumentType: input.docType || preArrival?.idDocumentType || 'passport',
      idDocumentNumberMasked: input.docNumber
        ? `******${input.docNumber.slice(-4)}`
        : preArrival?.idDocumentNumberMasked || '******9999',
      idIssuingCountry: preArrival?.idIssuingCountry || 'IND',
      idVerificationStatus: 'verified' as const,
      idVerifiedAt: checkInTime.toISOString(),
      idVerifiedBy: staffUser.name || 'Front Desk Coordinator',
      idVerificationNotes: input.notes || 'Verified at check-in counter',
    };
    await this.stayRepo.updatePreArrivalRegistration(stay.id, updatedPreArrival);

    // Mark room assignment as current and active
    await this.stayRepo.updateRoomAssignment(stay.id, {
      isCurrent: true,
      cleanlinessStatus: 'ready',
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        stayId: stay.id,
        bookingReference: stay.bookingReference,
        guestName: `${stay.guestFirstName} ${stay.guestLastName}`,
        roomNumber: currentRoom.roomNumber,
        roomType: currentRoom.roomType,
        status: 'checked_in',
        checkInTime: checkInTime.toISOString(),
        idVerificationStatus: 'verified',
        qrSessionActive: true,
        message: `${stay.guestFirstName} ${stay.guestLastName} successfully checked in to Room ${currentRoom.roomNumber}. In-room QR portal session is now unlocked.`,
      },
    };
  }
}
