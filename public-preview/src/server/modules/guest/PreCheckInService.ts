import { z } from 'zod';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from './repositories/GuestStayRepository.ts';
import {
  type IStorageService,
  getStorageService,
} from '../storage/StorageContract.ts';

export const PreCheckInSchema = z.object({
  bookingReference: z.string().min(1, 'Booking reference is required').trim(),
  guestLastName: z.string().min(1, 'Guest last name is required').trim(),
  estimatedArrivalTime: z.string().min(1, 'Estimated arrival time is required').trim(),
  idDocumentType: z.enum(['passport', 'drivers_license', 'national_id', 'aadhaar'], {
    errorMap: () => ({ message: 'Document type must be passport, drivers_license, national_id, or aadhaar' }),
  }),
  idDocumentNumber: z.string().min(4, 'Document number must be at least 4 characters').max(50).trim(),
  idIssuingCountry: z.string().min(2, 'Issuing country code is required').max(3).trim(),
  attachmentMetadata: z
    .object({
      fileName: z.string().min(1, 'File name is required').max(255),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
        errorMap: () => ({ message: 'Attachment must be JPEG, PNG, WEBP, or PDF' }),
      }),
      fileSizeBytes: z.number().int().min(1).max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
      fileSha256: z.string().min(32, 'File SHA256 checksum is required').max(64),
    })
    .optional(),
  specialRequests: z.string().max(500, 'Special requests cannot exceed 500 characters').optional(),
});

export type PreCheckInInput = z.infer<typeof PreCheckInSchema>;

export interface PreCheckInResponseDto {
  stayId: string;
  bookingReference: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  estimatedArrivalTime: string;
  idVerificationStatus: 'pending_verify';
  idDocumentType: string;
  idDocumentNumberMasked: string;
  idIssuingCountry: string;
  attachmentRegistered: boolean;
  preCheckInCompletedAt: string;
  instructions: string;
}

export interface PreCheckInResult {
  success: boolean;
  statusCode: number;
  data?: PreCheckInResponseDto;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

/**
 * Service managing Guest Pre-Arrival Registration and ID Verification evidence intake (F08).
 * Strictly verifies booking reference and guest identity, enforces duplicate protection,
 * interacts with Developer 1's storage contract, and advances stay state to pending_verify.
 */
export class PreCheckInService {
  private stayRepo: IGuestStayRepository;
  private storageService: IStorageService;

  constructor(
    stayRepo?: IGuestStayRepository,
    storageService?: IStorageService,
  ) {
    this.stayRepo = stayRepo || getGuestStayRepository();
    this.storageService = storageService || getStorageService();
  }

  public static maskDocumentNumber(docNumber: string): string {
    const trimmed = docNumber.trim();
    if (trimmed.length <= 4) {
      return '*'.repeat(trimmed.length);
    }
    const visibleLength = 4;
    const maskedPart = '*'.repeat(trimmed.length - visibleLength);
    const visiblePart = trimmed.slice(-visibleLength);
    return `${maskedPart}${visiblePart}`;
  }

  public async submitPreCheckIn(input: PreCheckInInput): Promise<PreCheckInResult> {
    // 1. Booking reference and reservation verification
    const stayWithRoom = await this.stayRepo.getStayByBookingReference(input.bookingReference);

    if (!stayWithRoom) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: `No active reservation found matching booking reference '${input.bookingReference}'.`,
        },
      };
    }

    const { stay, currentRoom, preArrival } = stayWithRoom;

    // 2. Identity challenge: Guest last name verification (case-insensitive)
    if (stay.guestLastName.toLowerCase() !== input.guestLastName.toLowerCase()) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'The reservation details and guest surname do not match.',
        },
      };
    }

    // 3. Stay status guard
    if (stay.status === 'cancelled') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'RESERVATION_CANCELLED',
          message: 'This reservation has been cancelled and cannot be registered for pre-checkin.',
        },
      };
    }

    if (stay.status === 'checked_in') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ALREADY_CHECKED_IN',
          message: 'The guest is already checked in to the hotel.',
        },
      };
    }

    if (stay.status === 'checked_out') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'STAY_COMPLETED',
          message: 'This stay has already concluded.',
        },
      };
    }

    // 4. Duplicate pre-arrival submission protection
    if (stay.status === 'pending_verify' || preArrival?.idVerificationStatus === 'pending_verify') {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'PRE_CHECKIN_ALREADY_COMPLETED',
          message: `Pre-arrival registration has already been submitted for booking ${stay.bookingReference}.`,
        },
      };
    }

    // 5. Secure attachment registration via Developer 1's storage contract
    let attachmentKey: string | undefined;
    if (input.attachmentMetadata) {
      if (!this.storageService.isAvailable()) {
        return {
          success: false,
          statusCode: 503,
          error: {
            code: 'STORAGE_SERVICE_UNAVAILABLE',
            message: 'Identity document storage service is currently unreachable. Please try again shortly.',
          },
        };
      }

      try {
        const registered = await this.storageService.registerAttachment(stay.id, input.attachmentMetadata);
        attachmentKey = registered.storageKey;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to register identity document attachment';
        return {
          success: false,
          statusCode: 422,
          error: {
            code: 'ATTACHMENT_REJECTED',
            message,
          },
        };
      }
    }

    // 6. Mask ID document number for privacy & compliance
    const maskedDocNumber = PreCheckInService.maskDocumentNumber(input.idDocumentNumber);
    const nowIso = new Date().toISOString();

    // 7. Update stay repository with pre-arrival record and advance status to 'pending_verify'
    await this.stayRepo.updatePreArrivalRegistration(stay.id, {
      estimatedArrivalTime: input.estimatedArrivalTime,
      idDocumentType: input.idDocumentType,
      idDocumentNumberMasked: maskedDocNumber,
      idIssuingCountry: input.idIssuingCountry.toUpperCase(),
      idVerificationStatus: 'pending_verify',
      idAttachmentKey: attachmentKey,
      preCheckInCompletedAt: nowIso,
      specialRequests: input.specialRequests?.trim() || undefined,
    });

    const instructions =
      'Pre-arrival registration received. Front Desk will review your ID and prepare room keys for express arrival.';

    return {
      success: true,
      statusCode: 201,
      data: {
        stayId: stay.id,
        bookingReference: stay.bookingReference,
        guestName: `${stay.guestFirstName} ${stay.guestLastName}`,
        roomNumber: currentRoom.roomNumber,
        roomType: currentRoom.roomType,
        checkInDate: stay.checkInTime.toISOString().split('T')[0],
        estimatedArrivalTime: input.estimatedArrivalTime,
        idVerificationStatus: 'pending_verify',
        idDocumentType: input.idDocumentType,
        idDocumentNumberMasked: maskedDocNumber,
        idIssuingCountry: input.idIssuingCountry.toUpperCase(),
        attachmentRegistered: Boolean(attachmentKey),
        preCheckInCompletedAt: nowIso,
        instructions,
      },
    };
  }
}
