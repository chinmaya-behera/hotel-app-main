import {
  type IRoomCatalogRepository,
  type IBookingRepository,
  type PublicRoomUnit,
  getRoomCatalogRepository,
  getBookingRepository,
} from './repositories/RoomCatalogRepository.ts';

export interface RoomDiscoveryQuery {
  checkIn?: string;
  checkOut?: string;
  guests?: number | string;
  roomType?: string;
}

export interface PublicRoomDto {
  roomId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  title: string;
  description: string;
  maxGuests: number;
  basePricePerNight: number;
  currency: string;
  amenities: string[];
  images: string[];
  estimatedTotalPrice?: number;
}

export interface RoomDiscoveryResult {
  success: boolean;
  statusCode: number;
  data?: {
    rooms: PublicRoomDto[];
    totalCount: number;
    searchCriteria?: {
      checkIn?: string;
      checkOut?: string;
      nights?: number;
      guests?: number;
      roomType?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

const MAX_BOOKING_NIGHTS = 14;

export class RoomDiscoveryService {
  private catalogRepo: IRoomCatalogRepository;
  private bookingRepo: IBookingRepository;

  constructor(
    catalogRepo?: IRoomCatalogRepository,
    bookingRepo?: IBookingRepository,
  ) {
    this.catalogRepo = catalogRepo || getRoomCatalogRepository();
    this.bookingRepo = bookingRepo || getBookingRepository();
  }

  public async searchRooms(query: RoomDiscoveryQuery): Promise<RoomDiscoveryResult> {
    const details: Array<{ field: string; issue: string }> = [];

    // 1. Validate dates if either is provided
    let parsedCheckIn: Date | null = null;
    let parsedCheckOut: Date | null = null;
    let totalNights = 0;

    if (query.checkIn || query.checkOut) {
      if (!query.checkIn) {
        details.push({ field: 'checkIn', issue: 'Check-in date is required when check-out date is specified.' });
      }
      if (!query.checkOut) {
        details.push({ field: 'checkOut', issue: 'Check-out date is required when check-in date is specified.' });
      }

      if (query.checkIn && query.checkOut) {
        parsedCheckIn = new Date(query.checkIn);
        parsedCheckOut = new Date(query.checkOut);

        if (Number.isNaN(parsedCheckIn.getTime())) {
          details.push({ field: 'checkIn', issue: 'Invalid check-in date format. Use YYYY-MM-DD.' });
        }
        if (Number.isNaN(parsedCheckOut.getTime())) {
          details.push({ field: 'checkOut', issue: 'Invalid check-out date format. Use YYYY-MM-DD.' });
        }

        if (!Number.isNaN(parsedCheckIn.getTime()) && !Number.isNaN(parsedCheckOut.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // We normalize parsedCheckIn and parsedCheckOut to midnight for comparison
          const checkInMidnight = new Date(parsedCheckIn);
          checkInMidnight.setHours(0, 0, 0, 0);

          if (checkInMidnight < today) {
            details.push({ field: 'checkIn', issue: 'Check-in date cannot be in the past.' });
          }

          if (parsedCheckOut <= parsedCheckIn) {
            details.push({ field: 'checkOut', issue: 'Check-out date must be strictly after check-in date.' });
          } else {
            const diffMs = parsedCheckOut.getTime() - parsedCheckIn.getTime();
            totalNights = Math.round(diffMs / (1000 * 60 * 60 * 24));
            if (totalNights > MAX_BOOKING_NIGHTS) {
              details.push({
                field: 'checkOut',
                issue: `Reservations cannot exceed ${MAX_BOOKING_NIGHTS} consecutive nights (requested ${totalNights}).`,
              });
            }
          }
        }
      }
    }

    // 2. Validate guests parameter if provided
    let numGuests: number | undefined;
    if (query.guests !== undefined && query.guests !== null && query.guests !== '') {
      numGuests = Number(query.guests);
      if (!Number.isInteger(numGuests) || numGuests < 1 || numGuests > 10) {
        details.push({ field: 'guests', issue: 'Guests must be a positive integer between 1 and 10.' });
      }
    }

    if (details.length > 0) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid room search parameters.',
          details,
        },
      };
    }

    // 3. Query all rooms from catalog
    const allRooms = await this.catalogRepo.getAllRooms();

    // 4. Apply filters
    const filteredRooms: PublicRoomDto[] = [];

    for (const room of allRooms) {
      // Filter by roomType
      if (query.roomType && query.roomType.trim() !== '') {
        const queryType = query.roomType.trim().toLowerCase();
        if (!room.roomType.toLowerCase().includes(queryType)) {
          continue;
        }
      }

      // Filter by guest capacity
      if (numGuests !== undefined && room.maxGuests < numGuests) {
        continue;
      }

      // Filter by date availability
      if (parsedCheckIn && parsedCheckOut) {
        const available = await this.bookingRepo.isRoomAvailable(room.roomId, parsedCheckIn, parsedCheckOut);
        if (!available) {
          continue;
        }
      }

      // Public Room Projection
      const dto: PublicRoomDto = {
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        title: room.title,
        description: room.description,
        maxGuests: room.maxGuests,
        basePricePerNight: room.basePricePerNight,
        currency: room.currency,
        amenities: [...room.amenities],
        images: [...room.images],
      };

      if (totalNights > 0) {
        dto.estimatedTotalPrice = totalNights * room.basePricePerNight;
      }

      filteredRooms.push(dto);
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        rooms: filteredRooms,
        totalCount: filteredRooms.length,
        searchCriteria: {
          checkIn: query.checkIn,
          checkOut: query.checkOut,
          nights: totalNights > 0 ? totalNights : undefined,
          guests: numGuests,
          roomType: query.roomType,
        },
      },
    };
  }
}
