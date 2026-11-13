import { z } from 'zod';
import crypto from 'node:crypto';
import {
  type IRoomCatalogRepository,
  type IBookingRepository,
  type BookingInterval,
  getRoomCatalogRepository,
  getBookingRepository,
} from './repositories/RoomCatalogRepository.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from '../guest/repositories/GuestStayRepository.ts';

export const CreateBookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').trim(),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  guestFirstName: z.string().min(1, 'First name is required').max(100).trim(),
  guestLastName: z.string().min(1, 'Last name is required').max(100).trim(),
  guestEmail: z.string().email('Valid email address is required').trim(),
  guestPhone: z.string().min(5, 'Valid phone number is required').max(30).trim(),
  numberOfGuests: z.number().int().min(1, 'At least 1 guest required').max(10, 'Maximum 10 guests'),
  specialRequests: z.string().max(500, 'Special requests cannot exceed 500 characters').optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export interface ReservationConfirmation {
  bookingReference: string;
  stayId: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  numberOfGuests: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  nightlyRate: number;
  totalAmount: number;
  currency: string;
  status: 'reserved';
  welcomeTvPin: string;
  specialRequests?: string;
  createdAt: string;
}

export interface BookingResult {
  success: boolean;
  statusCode: number;
  data?: ReservationConfirmation;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

/**
 * In-memory sliding-window IP rate limiter to protect public booking endpoint.
 * Default: 10 booking submissions per 10 minutes per IP address.
 */
class BookingRateLimiter {
  private static instance: BookingRateLimiter;
  private requests = new Map<string, number[]>();
  private readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_PER_WINDOW = 10;

  public static getInstance(): BookingRateLimiter {
    if (!BookingRateLimiter.instance) {
      BookingRateLimiter.instance = new BookingRateLimiter();
    }
    return BookingRateLimiter.instance;
  }

  public checkAndIncrement(clientIp: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(clientIp) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.WINDOW_MS);

    if (validTimestamps.length >= this.MAX_PER_WINDOW) {
      this.requests.set(clientIp, validTimestamps);
      return false; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.requests.set(clientIp, validTimestamps);
    return true; // Allowed
  }

  public reset(): void {
    this.requests.clear();
  }
}

/**
 * In-memory idempotency cache for reservation creations.
 */
class IdempotencyCache {
  private static instance: IdempotencyCache;
  private cache = new Map<string, ReservationConfirmation>();

  public static getInstance(): IdempotencyCache {
    if (!IdempotencyCache.instance) {
      IdempotencyCache.instance = new IdempotencyCache();
    }
    return IdempotencyCache.instance;
  }

  public get(key: string): ReservationConfirmation | undefined {
    return this.cache.get(key);
  }

  public set(key: string, result: ReservationConfirmation): void {
    this.cache.set(key, result);
  }

  public reset(): void {
    this.cache.clear();
  }
}

const MAX_BOOKING_NIGHTS = 14;

export class OnlineBookingService {
  private catalogRepo: IRoomCatalogRepository;
  private bookingRepo: IBookingRepository;
  private stayRepo: IGuestStayRepository;
  private rateLimiter: BookingRateLimiter;
  private idempotencyCache: IdempotencyCache;

  constructor(
    catalogRepo?: IRoomCatalogRepository,
    bookingRepo?: IBookingRepository,
    stayRepo?: IGuestStayRepository,
  ) {
    this.catalogRepo = catalogRepo || getRoomCatalogRepository();
    this.bookingRepo = bookingRepo || getBookingRepository();
    this.stayRepo = stayRepo || getGuestStayRepository();
    this.rateLimiter = BookingRateLimiter.getInstance();
    this.idempotencyCache = IdempotencyCache.getInstance();
  }

  public async createBooking(
    input: CreateBookingInput,
    clientIp: string = '127.0.0.1',
  ): Promise<BookingResult> {
    // 1. IP Rate Limiting Guard
    const allowed = this.rateLimiter.checkAndIncrement(clientIp);
    if (!allowed) {
      return {
        success: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many booking attempts from this address. Please wait 10 minutes before trying again.',
        },
      };
    }

    // 2. Idempotency Check
    if (input.idempotencyKey) {
      const cached = this.idempotencyCache.get(input.idempotencyKey);
      if (cached) {
        return {
          success: true,
          statusCode: 200,
          data: cached,
        };
      }
    }

    // 3. Room Existence Verification
    const room = await this.catalogRepo.getRoomById(input.roomId);
    if (!room) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with ID '${input.roomId}' was not found in the hotel inventory.`,
        },
      };
    }

    // 4. Room Capacity Validation
    if (input.numberOfGuests > room.maxGuests) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: `The selected ${room.roomType} accommodates a maximum of ${room.maxGuests} guests (requested ${input.numberOfGuests}).`,
        },
      };
    }

    // 5. Date Validation
    const parsedCheckIn = new Date(input.checkInDate);
    const parsedCheckOut = new Date(input.checkOutDate);

    if (Number.isNaN(parsedCheckIn.getTime()) || Number.isNaN(parsedCheckOut.getTime())) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'INVALID_DATES',
          message: 'Check-in and check-out dates must be valid calendar dates in YYYY-MM-DD format.',
        },
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInMidnight = new Date(parsedCheckIn);
    checkInMidnight.setHours(0, 0, 0, 0);

    if (checkInMidnight < today) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'PAST_DATE_NOT_ALLOWED',
          message: 'Check-in date cannot be in the past.',
        },
      };
    }

    if (parsedCheckOut <= parsedCheckIn) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'INVALID_DATE_ORDER',
          message: 'Check-out date must be strictly after the check-in date.',
        },
      };
    }

    const diffMs = parsedCheckOut.getTime() - parsedCheckIn.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (nights > MAX_BOOKING_NIGHTS) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'MAX_NIGHTS_EXCEEDED',
          message: `Maximum allowed stay duration is ${MAX_BOOKING_NIGHTS} consecutive nights (requested ${nights}).`,
        },
      };
    }

    // 6. Concurrency / Overlapping Reservation Guard
    const isAvailable = await this.bookingRepo.isRoomAvailable(room.roomId, parsedCheckIn, parsedCheckOut);
    if (!isAvailable) {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_UNAVAILABLE',
          message: `Room ${room.roomNumber} (${room.roomType}) is no longer available for the selected dates. Please select alternative dates or a different room.`,
        },
      };
    }

    // 7. Generate Unique Reservation Identifiers
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const bookingReference = `BK-${room.roomNumber}-${randomHex}`;
    const welcomeTvPin = Math.floor(1000 + Math.random() * 9000).toString();
    const stayId = `stay_${crypto.randomUUID()}`;
    const totalAmount = nights * room.basePricePerNight;
    const now = new Date();

    const bookingRecord: BookingInterval = {
      stayId,
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      bookingReference,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      welcomeTvPin,
      checkInDate: parsedCheckIn,
      checkOutDate: parsedCheckOut,
      status: 'reserved',
      totalAmount,
      createdAt: now,
    };

    try {
      await this.bookingRepo.createBooking(bookingRecord);
    } catch {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'ROOM_UNAVAILABLE',
          message: 'Reservation collision detected. The selected room was just booked for these dates.',
        },
      };
    }

    const confirmation: ReservationConfirmation = {
      bookingReference,
      stayId,
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      checkInDate: parsedCheckIn.toISOString().split('T')[0],
      checkOutDate: parsedCheckOut.toISOString().split('T')[0],
      nights,
      numberOfGuests: input.numberOfGuests,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      nightlyRate: room.basePricePerNight,
      totalAmount,
      currency: room.currency,
      status: 'reserved',
      welcomeTvPin,
      specialRequests: input.specialRequests?.trim() || undefined,
      createdAt: now.toISOString(),
    };

    // Cache idempotency key if supplied
    if (input.idempotencyKey) {
      this.idempotencyCache.set(input.idempotencyKey, confirmation);
    }

    return {
      success: true,
      statusCode: 201,
      data: confirmation,
    };
  }
}
