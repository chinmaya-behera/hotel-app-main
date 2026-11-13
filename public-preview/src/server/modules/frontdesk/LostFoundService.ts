import { z } from 'zod';
import crypto from 'node:crypto';
import {
  type ILostFoundRepository,
  type LostFoundRecord,
  type LostFoundCategory,
  type LostFoundStatus,
  type LostFoundQueryFilters,
  getLostFoundRepository,
} from './repositories/LostFoundRepository.ts';
import {
  type IStorageService,
  TemporaryMockStorageService,
} from '../storage/StorageContract.ts';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from './FrontDeskStayService.ts';

export const CreateLostFoundItemSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(200).trim(),
  category: z.enum(
    [
      'electronics',
      'clothing',
      'jewelry_valuables',
      'documents',
      'luggage',
      'keys',
      'personal_items',
      'other',
    ],
    { errorMap: () => ({ message: 'Invalid lost and found category' }) },
  ),
  description: z.string().min(3, 'Description must be at least 3 characters').max(2000).trim(),
  foundLocation: z.string().min(2, 'Found location is required').max(200).trim(),
  foundDate: z.string().min(1, 'Found date is required').trim(),
  foundTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format').optional(),
  roomNumber: z.string().trim().optional(),
  stayId: z.string().trim().optional(),
  storageLocation: z.string().min(2, 'Storage location is required').max(200).trim(),
  sensitive: z.boolean().default(false),
  initialStatus: z.enum(['FOUND', 'STORED']).default('STORED'),
  idempotencyKey: z.string().trim().optional(),
  attachment: z
    .object({
      fileName: z.string(),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
      fileSizeBytes: z.number().positive(),
      fileSha256: z.string(),
    })
    .optional(),
});

export type CreateLostFoundItemInput = z.infer<typeof CreateLostFoundItemSchema>;

export const UpdateLostFoundItemSchema = z.object({
  storageLocation: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['FOUND', 'STORED', 'CLAIM_PENDING', 'RELEASED', 'DISPOSED']).optional(),
  disposalReason: z.string().max(500).optional(),
});

export type UpdateLostFoundItemInput = z.infer<typeof UpdateLostFoundItemSchema>;

export const ClaimLostFoundItemSchema = z.object({
  claimantName: z.string().min(2, 'Claimant name must be at least 2 characters').max(200).trim(),
  claimantContact: z.string().min(5, 'Valid contact information is required').max(100).trim(),
  verificationMethod: z.enum(
    ['government_id', 'room_verification', 'item_description_match', 'receipt_proof'],
    { errorMap: () => ({ message: 'Invalid claimant verification method' }) },
  ),
  claimNotes: z.string().max(1000).optional(),
  releaseNow: z.boolean().default(false),
});

export type ClaimLostFoundItemInput = z.infer<typeof ClaimLostFoundItemSchema>;

export const ReleaseLostFoundItemSchema = z.object({
  claimantName: z.string().min(2, 'Claimant name must be at least 2 characters').max(200).trim(),
  verificationMethod: z.enum(
    ['government_id', 'room_verification', 'item_description_match', 'receipt_proof'],
    { errorMap: () => ({ message: 'Invalid claimant verification method' }) },
  ),
  releaseNotes: z.string().max(1000).optional(),
});

export type ReleaseLostFoundItemInput = z.infer<typeof ReleaseLostFoundItemSchema>;

export interface LostFoundResult {
  success: boolean;
  statusCode: number;
  data?: LostFoundRecord;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface LostFoundListResult {
  success: boolean;
  statusCode: number;
  data?: {
    items: LostFoundRecord[];
    total: number;
    counts: {
      total: number;
      found: number;
      stored: number;
      claimPending: number;
      released: number;
      disposed: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class LostFoundService {
  private repo: ILostFoundRepository;
  private storage: IStorageService;
  private static sequence = 100;

  constructor(repo?: ILostFoundRepository, storage?: IStorageService) {
    this.repo = repo || getLostFoundRepository();
    this.storage = storage || TemporaryMockStorageService.getInstance();
  }

  public async registerItem(
    staffUser: StaffAuthUser,
    input: CreateLostFoundItemInput,
    idempotencyKeyHeader?: string,
  ): Promise<LostFoundResult> {
    // 1. Staff Authorization Guard
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for Lost & Found registration.',
        },
      };
    }

    // 2. Idempotency Check
    const effectiveKey = idempotencyKeyHeader || input.idempotencyKey;
    if (effectiveKey) {
      const existing = await this.repo.getIdempotencyRecord(effectiveKey);
      if (existing) {
        return {
          success: true,
          statusCode: 200,
          data: existing,
        };
      }
    }

    // 3. Register Attachment via IStorageService (Dev 1 contract)
    let photoStorageKey: string | undefined;
    let photoUrl: string | undefined;
    if (input.attachment) {
      try {
        const stored = await this.storage.registerAttachment(input.stayId || 'general_lost_found', input.attachment);
        photoStorageKey = stored.storageKey;
        photoUrl = `https://storage.grand-hotel.local/attachments/${stored.storageKey}`;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Storage registration failed';
        return {
          success: false,
          statusCode: 503,
          error: {
            code: 'STORAGE_UNAVAILABLE',
            message: `Attachment registration failed: ${message}`,
          },
        };
      }
    }

    // 4. Generate Unique Reference
    LostFoundService.sequence++;
    const ref = `LF-2026-${LostFoundService.sequence.toString().padStart(4, '0')}`;
    const id = `lf_${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    const record: LostFoundRecord = {
      id,
      ref,
      propertyId: 'prop_grand_adp_01',
      itemName: input.itemName,
      category: input.category as LostFoundCategory,
      description: input.description,
      foundLocation: input.foundLocation,
      foundDate: input.foundDate,
      foundTime: input.foundTime,
      roomNumber: input.roomNumber,
      stayId: input.stayId,
      storageLocation: input.storageLocation,
      sensitive: input.sensitive,
      photoStorageKey,
      photoUrl,
      registeredByStaffId: staffUser.staffId,
      registeredByStaffName: staffUser.name || 'Front Desk Staff',
      status: input.initialStatus as LostFoundStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          status: 'FOUND',
          at: nowIso,
          staffId: staffUser.staffId,
          staffName: staffUser.name || staffUser.staffId,
          note: `Item registered by ${staffUser.name || staffUser.staffId} (${staffUser.role})`,
        },
      ],
    };

    if (input.initialStatus === 'STORED') {
      record.history.push({
        status: 'STORED',
        at: nowIso,
        staffId: staffUser.staffId,
        staffName: staffUser.name || staffUser.staffId,
        note: `Item secured into ${input.storageLocation}`,
      });
    }

    const saved = await this.repo.createItem(record);

    if (effectiveKey) {
      await this.repo.setIdempotencyRecord(effectiveKey, saved);
    }

    return {
      success: true,
      statusCode: 201,
      data: saved,
    };
  }

  public async getItems(
    staffUser: StaffAuthUser,
    filters?: LostFoundQueryFilters,
  ): Promise<LostFoundListResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for viewing Lost & Found items.',
        },
      };
    }

    const { items, total } = await this.repo.getAllItems(filters);

    // Compute live status counts across whole inventory
    const all = await this.repo.getAllItems({ limit: 10000 });
    const counts = {
      total: all.total,
      found: 0,
      stored: 0,
      claimPending: 0,
      released: 0,
      disposed: 0,
    };

    for (const item of all.items) {
      if (item.status === 'FOUND') counts.found++;
      else if (item.status === 'STORED') counts.stored++;
      else if (item.status === 'CLAIM_PENDING') counts.claimPending++;
      else if (item.status === 'RELEASED') counts.released++;
      else if (item.status === 'DISPOSED') counts.disposed++;
    }

    // Privacy guard: in general listing, mask sensitive item contact and photo
    const sanitizedItems = items.map((item) => {
      const sanitized = { ...item };
      if (sanitized.claimantContact) {
        sanitized.claimantContact = '******' + sanitized.claimantContact.slice(-4);
      }
      if (sanitized.sensitive) {
        sanitized.photoUrl = undefined; // Suppress photo on sensitive items for privacy
      }
      return sanitized;
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        items: sanitizedItems,
        total,
        counts,
      },
    };
  }

  public async getItemById(staffUser: StaffAuthUser, id: string): Promise<LostFoundResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized.',
        },
      };
    }

    const item = await this.repo.getItemById(id);
    if (!item) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Lost & Found record with ID '${id}' was not found.`,
        },
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: item,
    };
  }

  public async updateItem(
    staffUser: StaffAuthUser,
    id: string,
    input: UpdateLostFoundItemInput,
  ): Promise<LostFoundResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized.',
        },
      };
    }

    const existing = await this.repo.getItemById(id);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Lost & Found record with ID '${id}' was not found.`,
        },
      };
    }

    // State machine check if status transition requested
    if (input.status && input.status !== existing.status) {
      const allowed = this.validateTransition(existing.status, input.status);
      if (!allowed.valid) {
        return {
          success: false,
          statusCode: 400,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: allowed.reason,
          },
        };
      }
    }

    const nowIso = new Date().toISOString();
    const updates: Partial<LostFoundRecord> = {};
    const newHistory = [...existing.history];

    if (input.storageLocation) updates.storageLocation = input.storageLocation;
    if (input.description) updates.description = input.description;

    if (input.status && input.status !== existing.status) {
      updates.status = input.status;
      if (input.status === 'DISPOSED') {
        updates.disposedAt = nowIso;
        updates.disposalReason = input.disposalReason || 'Policy retention period exceeded';
      }
      newHistory.push({
        status: input.status,
        at: nowIso,
        staffId: staffUser.staffId,
        staffName: staffUser.name || staffUser.staffId,
        note: input.notes || `Status changed from ${existing.status} to ${input.status}`,
      });
    } else if (input.notes) {
      newHistory.push({
        status: existing.status,
        at: nowIso,
        staffId: staffUser.staffId,
        staffName: staffUser.name || staffUser.staffId,
        note: input.notes,
      });
    }

    updates.history = newHistory;
    const updated = await this.repo.updateItem(id, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  public async claimItem(
    staffUser: StaffAuthUser,
    id: string,
    input: ClaimLostFoundItemInput,
  ): Promise<LostFoundResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for processing claims.',
        },
      };
    }

    const existing = await this.repo.getItemById(id);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Lost & Found record with ID '${id}' was not found.`,
        },
      };
    }

    if (existing.status === 'RELEASED') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ITEM_ALREADY_RELEASED',
          message: `Item ${existing.ref} was already released to ${existing.claimantName} on ${existing.releasedAt}.`,
        },
      };
    }

    if (existing.status === 'DISPOSED') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ITEM_ALREADY_DISPOSED',
          message: `Item ${existing.ref} was disposed on ${existing.disposedAt} and cannot be claimed.`,
        },
      };
    }

    const nowIso = new Date().toISOString();
    const newHistory = [...existing.history];

    newHistory.push({
      status: 'CLAIM_PENDING',
      at: nowIso,
      staffId: staffUser.staffId,
      staffName: staffUser.name || staffUser.staffId,
      note: `Claim submitted by ${input.claimantName} (Verified by ${input.verificationMethod})`,
    });

    const updates: Partial<LostFoundRecord> = {
      claimantName: input.claimantName,
      claimantContact: input.claimantContact,
      claimantVerificationMethod: input.verificationMethod,
      claimedAt: nowIso,
      claimNotes: input.claimNotes,
      status: 'CLAIM_PENDING',
    };

    if (input.releaseNow) {
      updates.status = 'RELEASED';
      updates.releasedAt = nowIso;
      updates.releasedByStaffId = staffUser.staffId;
      updates.releasedByStaffName = staffUser.name || staffUser.staffId;
      newHistory.push({
        status: 'RELEASED',
        at: nowIso,
        staffId: staffUser.staffId,
        staffName: staffUser.name || staffUser.staffId,
        note: `Direct release executed to claimant ${input.claimantName} after successful ${input.verificationMethod}.`,
      });
    }

    updates.history = newHistory;
    const updated = await this.repo.updateItem(id, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  public async releaseItem(
    staffUser: StaffAuthUser,
    id: string,
    input: ReleaseLostFoundItemInput,
  ): Promise<LostFoundResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for releasing items.',
        },
      };
    }

    const existing = await this.repo.getItemById(id);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Lost & Found record with ID '${id}' was not found.`,
        },
      };
    }

    if (existing.status === 'RELEASED') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ITEM_ALREADY_RELEASED',
          message: `Item ${existing.ref} has already been released.`,
        },
      };
    }

    if (existing.status === 'DISPOSED') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ITEM_ALREADY_DISPOSED',
          message: `Item ${existing.ref} was disposed and cannot be released.`,
        },
      };
    }

    // Require matching claimant or verified claimant
    const finalClaimant = input.claimantName || existing.claimantName;
    if (!finalClaimant || finalClaimant.trim().length < 2) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'CLAIMANT_VERIFICATION_REQUIRED',
          message: 'Claimant name and verification are required before item can be released.',
        },
      };
    }

    const nowIso = new Date().toISOString();
    const newHistory = [...existing.history];
    newHistory.push({
      status: 'RELEASED',
      at: nowIso,
      staffId: staffUser.staffId,
      staffName: staffUser.name || staffUser.staffId,
      note: input.releaseNotes || `Item released to verified claimant ${finalClaimant} (${input.verificationMethod})`,
    });

    const updates: Partial<LostFoundRecord> = {
      status: 'RELEASED',
      claimantName: finalClaimant,
      claimantVerificationMethod: input.verificationMethod,
      releasedByStaffId: staffUser.staffId,
      releasedByStaffName: staffUser.name || staffUser.staffId,
      releasedAt: nowIso,
      history: newHistory,
    };

    const updated = await this.repo.updateItem(id, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  private validateTransition(
    current: LostFoundStatus,
    target: LostFoundStatus,
  ): { valid: boolean; reason: string } {
    if (current === target) return { valid: true, reason: '' };

    if (current === 'RELEASED') {
      return { valid: false, reason: 'Cannot transition an item that has already been RELEASED.' };
    }
    if (current === 'DISPOSED') {
      return { valid: false, reason: 'Cannot transition an item that has already been DISPOSED.' };
    }

    const validMoves: Record<LostFoundStatus, LostFoundStatus[]> = {
      FOUND: ['STORED', 'DISPOSED'],
      STORED: ['CLAIM_PENDING', 'RELEASED', 'DISPOSED'],
      CLAIM_PENDING: ['STORED', 'RELEASED', 'DISPOSED'],
      RELEASED: [],
      DISPOSED: [],
    };

    const isAllowed = validMoves[current]?.includes(target);
    if (!isAllowed) {
      return {
        valid: false,
        reason: `Invalid lifecycle transition from ${current} to ${target}. Valid next states: ${(
          validMoves[current] || []
        ).join(', ')}`,
      };
    }

    return { valid: true, reason: '' };
  }
}
