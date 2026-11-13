import crypto from 'node:crypto';
import { z } from 'zod';
import type { StayContext, RoomAssignment, QrMapping, GuestSession } from '../../db/schema/03_finance.ts';
import { getGuestStayRepository } from './repositories/GuestStayRepository.ts';

/**
 * Zod validation schema for the Guest QR Verification Request.
 */
export const VerifyQrRequestSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').trim(),
  qrSignature: z.string().min(1, 'QR HMAC signature is required').trim(),
  guestLastName: z.string().min(1, 'Guest last name is required').trim(),
  verificationCode: z.string().min(1, 'Verification code (Booking Ref or TV PIN) is required').trim(),
});

export type VerifyQrRequest = z.infer<typeof VerifyQrRequestSchema>;

export interface GuestSessionPayload {
  sessionId: string;
  sessionToken: string;
  stayId: string;
  roomId: string;
  roomNumber: string;
  guestFullName: string;
  bookingReference: string;
  expiresAt: string;
}

export interface QrAuthResult {
  success: boolean;
  statusCode: number;
  data?: GuestSessionPayload;
  error?: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
    details?: Array<{ field: string; issue: string }>;
  };
}

interface RateLimitRecord {
  attempts: number[];
  lockedUntil?: number;
}

/**
 * In-memory fallback and seed storage for Sprint 0 disconnected execution.
 */
interface InHouseStayFixture {
  stay: StayContext;
  room: RoomAssignment;
  qr: QrMapping;
}

/**
 * Service handling Guest QR authentication, challenge verification, rate limiting, and session tokens.
 */
export class QrAuthService {
  private static hmacSecret =
    process.env.GUEST_QR_HMAC_SECRET || 'dev_qr_hmac_secret_key_minimum_32_chars_long_adp_hotel!';

  // In-memory rate limiting map: key = `${ip}:${roomNumber}`
  private static rateLimits = new Map<string, RateLimitRecord>();

  // In-memory sessions store (for offline / test usage)
  private static inMemorySessions = new Map<string, GuestSession>();

  // In-memory mock stays for Sprint 0 stubbing
  private static mockStays = new Map<string, InHouseStayFixture>();

  static {
    // Seed initial mock stays for Sprint 0 local & unit test execution
    const now = new Date();
    const checkIn = new Date(now.getTime() - 1000 * 60 * 60 * 24); // Checked in yesterday
    const checkOut = new Date(now.getTime() + 1000 * 60 * 60 * 48); // Checks out in 2 days

    const room402Sig = QrAuthService.generateHmacSignature('402');
    QrAuthService.mockStays.set('402', {
      stay: {
        id: 'stay_seed_402',
        propertyId: 'prop_grand_adp_01',
        bookingReference: 'BK-7892-0402',
        guestFirstName: 'Aarav',
        guestLastName: 'Sharma',
        guestEmail: 'aarav.sharma@example.com',
        guestPhone: '+91 98765 43210',
        welcomeTvPin: '4829',
        status: 'checked_in',
        checkInTime: checkIn,
        checkOutTime: checkOut,
        createdAt: checkIn,
        updatedAt: now,
      },
      room: {
        id: 'room_assign_402',
        stayId: 'stay_seed_402',
        roomId: 'room_id_402',
        roomNumber: '402',
        propertyId: 'prop_grand_adp_01',
        floor: 4,
        roomType: 'Deluxe Suite',
        dndActive: false,
        cleanlinessStatus: 'ready',
        assignedAt: checkIn,
        unassignedAt: null,
        isCurrent: true,
      },
      qr: {
        id: 'qr_map_402',
        propertyId: 'prop_grand_adp_01',
        roomId: 'room_id_402',
        roomNumber: '402',
        staticHmacSignature: room402Sig,
        secretKey: QrAuthService.hmacSecret,
        active: true,
        createdAt: checkIn,
        updatedAt: now,
      },
    });
  }

  /**
   * Generates HMAC-SHA256 signature for a room number using the master HMAC secret.
   */
  public static generateHmacSignature(roomNumber: string): string {
    return crypto.createHmac('sha256', this.hmacSecret).update(roomNumber).digest('hex');
  }

  /**
   * Cryptographically validates the HMAC-SHA256 signature using timingSafeEqual.
   */
  public static verifyHmacSignature(roomNumber: string, clientSignature: string): boolean {
    const expected = this.generateHmacSignature(roomNumber);
    if (!clientSignature || typeof clientSignature !== 'string') return false;

    const expectedBuffer = Buffer.from(expected, 'hex');
    let clientBuffer: Buffer;
    try {
      clientBuffer = Buffer.from(clientSignature, 'hex');
    } catch {
      return false;
    }

    if (expectedBuffer.length !== clientBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, clientBuffer);
  }

  /**
   * Checks rate limiting window for an IP + Room pair.
   * Limit: 5 failed attempts within 15 minutes -> 30-minute lockout.
   */
  private static checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
    const record = this.rateLimits.get(key);
    const now = Date.now();

    if (!record) return { allowed: true };

    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    // Clean up attempts older than 15 minutes (900,000 ms)
    const windowStart = now - 15 * 60 * 1000;
    record.attempts = record.attempts.filter((ts) => ts > windowStart);

    return { allowed: true };
  }

  /**
   * Records a failed verification attempt and triggers lockout if threshold is exceeded.
   */
  private static recordFailedAttempt(key: string): void {
    const now = Date.now();
    let record = this.rateLimits.get(key);

    if (!record) {
      record = { attempts: [] };
      this.rateLimits.set(key, record);
    }

    record.attempts.push(now);

    // Filter to last 15 minutes
    const windowStart = now - 15 * 60 * 1000;
    record.attempts = record.attempts.filter((ts) => ts > windowStart);

    if (record.attempts.length >= 5) {
      // Lock for 30 minutes (1,800,000 ms)
      record.lockedUntil = now + 30 * 60 * 1000;
    }
  }

  /**
   * Resets rate limit records (e.g. upon successful verification or in tests).
   */
  public static resetRateLimit(key: string): void {
    this.rateLimits.delete(key);
  }

  /**
   * Main verification handler:
   * 1. Validates Rate Limits.
   * 2. Validates Room QR HMAC Signature.
   * 3. Validates Active Stay Context & Room Assignment.
   * 4. Validates Challenge (Last Name + TV PIN / Booking Ref).
   * 5. Creates Guest Session with expiration at (checkout + 2 hours).
   */
  public async verifyAndCreateSession(
    input: VerifyQrRequest,
    clientIp = '127.0.0.1',
    userAgent = 'unknown',
  ): Promise<QrAuthResult> {
    const rateLimitKey = `${clientIp}:${input.roomNumber}`;

    // 1. Rate Limit Gate
    const rateCheck = QrAuthService.checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return {
        success: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many failed verification attempts for Room ${input.roomNumber}. Access locked.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
      };
    }

    // 2. Room QR HMAC Validation
    const isHmacValid = QrAuthService.verifyHmacSignature(input.roomNumber, input.qrSignature);
    if (!isHmacValid) {
      QrAuthService.recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        statusCode: 401,
        error: {
          code: 'INVALID_QR_SIGNATURE',
          message: 'The scanned room QR code signature is invalid or has expired.',
        },
      };
    }

    // 3. Find Active Stay Context for Room
    let stay: StayContext | undefined;
    let room: RoomAssignment | undefined;

    const repoStay = await getGuestStayRepository().getStayWithRoomByRoomNumber(input.roomNumber);
    if (repoStay) {
      stay = repoStay.stay;
      room = repoStay.currentRoom;
    } else {
      const stayFixture = QrAuthService.mockStays.get(input.roomNumber);
      if (stayFixture) {
        stay = stayFixture.stay;
        room = stayFixture.room;
      }
    }

    if (!stay || !room) {
      QrAuthService.recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `No active stay record found for Room ${input.roomNumber}.`,
        },
      };
    }

    // Check Stay Status
    if (stay.status !== 'checked_in') {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'STAY_NOT_ACTIVE',
          message: `Stay status is '${stay.status}'. Room QR access requires an in-house checked-in guest.`,
        },
      };
    }

    // Check Stay Expiration
    const now = new Date();
    const stayGraceExpiry = new Date(stay.checkOutTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours grace period
    if (now > stayGraceExpiry) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'STAY_EXPIRED',
          message: 'This guest stay has ended. Please visit the Front Desk.',
        },
      };
    }

    // 4. Verification Challenge:
    // Primary: Guest Last Name (case-insensitive)
    const lastNameMatches =
      input.guestLastName.trim().toLowerCase() === stay.guestLastName.trim().toLowerCase();

    // Secondary: Booking Reference OR 4-digit Welcome TV PIN
    const normalizedCode = input.verificationCode.trim().toUpperCase();
    const codeMatches =
      normalizedCode === stay.bookingReference.trim().toUpperCase() ||
      input.verificationCode.trim() === stay.welcomeTvPin.trim();

    if (!lastNameMatches || !codeMatches) {
      QrAuthService.recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        statusCode: 401,
        error: {
          code: 'CHALLENGE_FAILED',
          message: 'Verification challenge failed. Last Name or Verification Code is incorrect.',
        },
      };
    }

    // 5. Successful Challenge -> Clear Rate Limit & Create Session
    QrAuthService.resetRateLimit(rateLimitKey);

    const sessionId = `sess_${crypto.randomUUID()}`;
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = stayGraceExpiry;

    const sessionRecord: GuestSession = {
      id: sessionId,
      sessionToken,
      stayId: stay.id,
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      ipAddress: clientIp,
      userAgent,
      isRevoked: false,
      revokedReason: null,
      expiresAt,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    };

    // Store in-memory
    QrAuthService.inMemorySessions.set(sessionToken, sessionRecord);

    const payload: GuestSessionPayload = {
      sessionId,
      sessionToken,
      stayId: stay.id,
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      guestFullName: `${stay.guestFirstName} ${stay.guestLastName}`,
      bookingReference: stay.bookingReference,
      expiresAt: expiresAt.toISOString(),
    };

    return {
      success: true,
      statusCode: 200,
      data: payload,
    };
  }

  /**
   * Validates an existing guest session token.
   */
  public static validateSession(sessionToken: string): {
    valid: boolean;
    session?: GuestSession;
    reason?: string;
  } {
    if (!sessionToken) {
      return { valid: false, reason: 'MISSING_TOKEN' };
    }

    const session = this.inMemorySessions.get(sessionToken);
    if (!session) {
      return { valid: false, reason: 'SESSION_NOT_FOUND' };
    }

    if (session.isRevoked) {
      return { valid: false, session, reason: session.revokedReason || 'SESSION_REVOKED' };
    }

    if (new Date() > session.expiresAt) {
      return { valid: false, session, reason: 'SESSION_EXPIRED' };
    }

    // Update lastSeenAt
    session.lastSeenAt = new Date();
    return { valid: true, session };
  }

  /**
   * Revokes an active session immediately (e.g. on room move, checkout, or logout).
   */
  public static revokeSession(sessionToken: string, reason = 'manual_revocation'): boolean {
    const session = this.inMemorySessions.get(sessionToken);
    if (!session) return false;

    session.isRevoked = true;
    session.revokedReason = reason;
    return true;
  }

  /**
   * Revokes all active sessions for a specific room (called during room move).
   */
  public static revokeAllSessionsForRoom(roomNumber: string, reason = 'room_move'): number {
    let count = 0;
    for (const session of this.inMemorySessions.values()) {
      if (session.roomNumber === roomNumber && !session.isRevoked) {
        session.isRevoked = true;
        session.revokedReason = reason;
        count++;
      }
    }
    // Also remove any in-memory mock fixture for this room upon move
    this.mockStays.delete(roomNumber);
    return count;
  }

  /**
   * Helper to register mock stay fixtures for test cases.
   */
  public static registerMockStay(roomNumber: string, fixture: InHouseStayFixture): void {
    this.mockStays.set(roomNumber, fixture);
  }

  /**
   * Helper to clear sessions and rate limits in test teardown.
   */
  public static clearTestData(): void {
    this.rateLimits.clear();
    this.inMemorySessions.clear();
    for (const key of Array.from(this.mockStays.keys())) {
      if (key !== '402') {
        this.mockStays.delete(key);
      }
    }

    if (!this.mockStays.has('402')) {
      const now = new Date();
      const checkIn = new Date(now.getTime() - 1000 * 60 * 60 * 24);
      const checkOut = new Date(now.getTime() + 1000 * 60 * 60 * 48);
      const room402Sig = QrAuthService.generateHmacSignature('402');
      this.mockStays.set('402', {
        stay: {
          id: 'stay_seed_402',
          propertyId: 'prop_grand_adp_01',
          bookingReference: 'BK-7892-0402',
          guestFirstName: 'Aarav',
          guestLastName: 'Sharma',
          guestEmail: 'aarav.sharma@example.com',
          guestPhone: '+91 98765 43210',
          welcomeTvPin: '4829',
          status: 'checked_in',
          checkInTime: checkIn,
          checkOutTime: checkOut,
          createdAt: checkIn,
          updatedAt: now,
        },
        room: {
          id: 'room_assign_402',
          stayId: 'stay_seed_402',
          roomId: 'room_id_402',
          roomNumber: '402',
          propertyId: 'prop_grand_adp_01',
          floor: 4,
          roomType: 'Deluxe Suite',
          dndActive: false,
          cleanlinessStatus: 'ready',
          assignedAt: checkIn,
          unassignedAt: null,
          isCurrent: true,
        },
        qr: {
          id: 'qr_map_402',
          propertyId: 'prop_grand_adp_01',
          roomNumber: '402',
          hmacSignature: room402Sig,
          qrVersion: 1,
          createdAt: checkIn,
          rotatedAt: null,
          isActive: true,
        },
      });
    }
  }
}

