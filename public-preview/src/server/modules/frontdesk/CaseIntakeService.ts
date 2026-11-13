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
  type ITaskEngineService,
  type TaskPriority,
} from '../operations/contracts.ts';
import { MockTaskEngineService } from '../operations/MockTaskEngineService.ts';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from './FrontDeskStayService.ts';
import {
  type ICaseIntakeRepository,
  type CaseIntakeRecord,
  getCaseIntakeRepository,
} from './repositories/CaseIntakeRepository.ts';

export const CaseIntakeSchema = z.object({
  category: z.enum(['request', 'complaint', 'incident', 'dispute'], {
    errorMap: () => ({ message: 'Category must be one of: request, complaint, incident, dispute' }),
  }),
  department: z.string().min(2, 'Department is required').trim(),
  title: z.string().min(3, 'Title/summary must be at least 3 characters').max(200).trim(),
  description: z.string().min(5, 'Description/instructions must be at least 5 characters').max(2000).trim(),
  priority: z.enum(['low', 'normal', 'urgent', 'safety_critical'], {
    errorMap: () => ({ message: 'Invalid priority level' }),
  }).default('normal'),
  channel: z.enum(['walk_in', 'phone', 'in_person', 'front_desk', 'intercom']).default('in_person'),
  roomNumber: z.string().trim().optional(),
  stayId: z.string().trim().optional(),
  guestName: z.string().trim().optional(),
  propertyId: z.string().trim().default('prop_grand_adp_01'),
  idempotencyKey: z.string().trim().optional(),
  // Financial dispute specific fields
  disputedAmount: z.number().positive('Disputed amount must be greater than 0').optional(),
  currency: z.string().trim().default('USD').optional(),
  relatedCharge: z.string().trim().optional(),
  preferredResolution: z.enum(['folio_credit', 'card_refund', 'charge_removal', 'voucher']).optional(),
  // Complaint specific fields
  proposedCompensation: z.number().min(0, 'Proposed compensation must be 0 or more').optional(),
  severity: z.enum(['normal', 'vip', 'critical']).optional(),
  // Attachments / Evidence metadata
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      size: z.number().optional(),
      mimeType: z.string().optional(),
    }),
  ).optional(),
}).refine(
  (data) => {
    if (data.category === 'dispute') {
      return data.disputedAmount !== undefined && data.disputedAmount > 0;
    }
    return true;
  },
  {
    message: 'Disputed amount is required and must be greater than 0 for financial disputes.',
    path: ['disputedAmount'],
  },
);

export type CaseIntakeInput = z.infer<typeof CaseIntakeSchema>;

export interface CaseIntakeSuccessDto {
  caseId: string;
  caseRef: string;
  taskId: string;
  category: string;
  department: string;
  priority: string;
  status: string;
  roomNumber?: string;
  stayId?: string;
  guestName?: string;
  disputedAmount?: number;
  currency?: string;
  escalationRequired?: boolean;
  createdAt: string;
  ackDueAt?: string;
  message: string;
}

export interface CaseIntakeResult {
  success: boolean;
  statusCode: number;
  data?: CaseIntakeSuccessDto;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

// Front Desk financial dispute auto-triage threshold (F31 rule: up to ₹2,500 or $50)
const FD_DISPUTE_LIMIT = 2500;

export class CaseIntakeService {
  private stayRepo: IGuestStayRepository;
  private catalogRepo: IRoomCatalogRepository;
  private taskEngine: ITaskEngineService;
  private intakeRepo: ICaseIntakeRepository;

  constructor(
    stayRepo?: IGuestStayRepository,
    catalogRepo?: IRoomCatalogRepository,
    taskEngine?: ITaskEngineService,
    intakeRepo?: ICaseIntakeRepository,
  ) {
    this.stayRepo = stayRepo || getGuestStayRepository();
    this.catalogRepo = catalogRepo || getRoomCatalogRepository();
    this.taskEngine = taskEngine || MockTaskEngineService.getInstance();
    this.intakeRepo = intakeRepo || getCaseIntakeRepository();
  }

  public async submitCaseIntake(
    staffUser: StaffAuthUser,
    input: CaseIntakeInput,
    idempotencyKeyHeader?: string,
  ): Promise<CaseIntakeResult> {
    // 1. Staff Authorization Guard (F41: Front Desk, Supervisor, Duty Manager, GM, Admin)
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for Front Desk case intake.',
        },
      };
    }

    // 2. Idempotency Check
    const effectiveIdempotencyKey = idempotencyKeyHeader || input.idempotencyKey;
    if (effectiveIdempotencyKey) {
      const existing = await this.intakeRepo.getIdempotencyRecord(effectiveIdempotencyKey);
      if (existing) {
        return {
          success: true,
          statusCode: 200,
          data: {
            caseId: existing.caseId,
            caseRef: existing.caseRef,
            taskId: existing.taskId,
            category: existing.category,
            department: existing.department,
            priority: existing.priority,
            status: existing.status,
            roomNumber: existing.roomNumber,
            stayId: existing.stayId,
            guestName: existing.guestName,
            disputedAmount: existing.disputedAmount,
            currency: existing.currency,
            escalationRequired: existing.escalationRequired,
            createdAt: existing.createdAt,
            message: `Case ${existing.caseRef} retrieved from previous idempotent submission.`,
          },
        };
      }
    }

    // 3. Validate Context (Stay, Room, Guest)
    let roomNumber = input.roomNumber;
    let stayId = input.stayId;
    let guestName = input.guestName;
    let roomId: string | undefined;

    if (roomNumber) {
      const catalogRoom = await this.catalogRepo.getRoomByNumber(roomNumber);
      if (!catalogRoom) {
        return {
          success: false,
          statusCode: 404,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: `Room with number '${roomNumber}' was not found in the hotel inventory.`,
          },
        };
      }
      roomId = catalogRoom.roomId;

      // Check for active in-house stay to enrich context
      const stayWithRoom = await this.stayRepo.getStayWithRoomByRoomNumber(roomNumber);
      if (stayWithRoom) {
        stayId = stayId || stayWithRoom.stay.id;
        guestName = guestName || `${stayWithRoom.stay.guestFirstName} ${stayWithRoom.stay.guestLastName}`;
      }
    } else if (stayId) {
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
      roomNumber = stayWithRoom.currentRoom.roomNumber;
      roomId = stayWithRoom.currentRoom.roomId;
      guestName = guestName || `${stayWithRoom.stay.guestFirstName} ${stayWithRoom.stay.guestLastName}`;
    }

    // 4. Evaluate Financial Dispute Escalation Boundary (F31 rule)
    let escalationRequired = false;
    if (input.category === 'dispute' && input.disputedAmount !== undefined) {
      if (input.disputedAmount > FD_DISPUTE_LIMIT) {
        escalationRequired = true;
      }
    }

    // 5. Invoke Developer 2's Canonical Task/Case Engine Contract
    // Note: Developer 2 owns the canonical case/task engine (DEV2-TASK-02).
    // Developer 3 calls this interface contract and does not duplicate task state machines.
    let canonicalResult;
    try {
      canonicalResult = await this.taskEngine.createCaseAndTask({
        propertyId: input.propertyId || 'prop_grand_adp_01',
        stayId,
        roomId,
        department: input.department,
        category: input.category,
        priority: input.priority as TaskPriority,
        source: 'front_desk',
        instructions: `[Front Desk ${input.channel.toUpperCase()}] ${input.title}: ${input.description}`,
        createdByStaffId: staffUser.staffId,
        attachments: input.attachments,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Task engine submission failed';
      return {
        success: false,
        statusCode: 503,
        error: {
          code: 'OPERATIONS_SERVICE_UNAVAILABLE',
          message: `Developer 2 Task Engine is unavailable: ${message}`,
        },
      };
    }

    // 6. Record Intake in Front Desk Intake Repository (Audit History)
    const nowIso = new Date().toISOString();
    const intakeRecord: CaseIntakeRecord = {
      id: `intake_${canonicalResult.caseId}`,
      caseId: canonicalResult.caseId,
      caseRef: canonicalResult.caseRef,
      taskId: canonicalResult.taskId,
      category: input.category,
      department: input.department,
      priority: input.priority,
      channel: input.channel,
      title: input.title,
      description: input.description,
      propertyId: input.propertyId || 'prop_grand_adp_01',
      roomNumber,
      stayId,
      guestName,
      disputedAmount: input.disputedAmount,
      currency: input.currency,
      relatedCharge: input.relatedCharge,
      preferredResolution: input.preferredResolution,
      proposedCompensation: input.proposedCompensation,
      severity: input.severity,
      escalationRequired,
      status: canonicalResult.status,
      attachments: input.attachments,
      staffId: staffUser.staffId,
      staffName: staffUser.name || 'Front Desk Staff',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await this.intakeRepo.saveCaseIntake(intakeRecord);

    if (effectiveIdempotencyKey) {
      await this.intakeRepo.setIdempotencyRecord(effectiveIdempotencyKey, intakeRecord);
    }

    // 7. Return Permitted Front Desk Response
    return {
      success: true,
      statusCode: 201,
      data: {
        caseId: canonicalResult.caseId,
        caseRef: canonicalResult.caseRef,
        taskId: canonicalResult.taskId,
        category: input.category,
        department: input.department,
        priority: input.priority,
        status: canonicalResult.status,
        roomNumber,
        stayId,
        guestName,
        disputedAmount: input.disputedAmount,
        currency: input.currency,
        escalationRequired,
        createdAt: nowIso,
        ackDueAt: canonicalResult.ackDueAt?.toISOString(),
        message: `Case ${canonicalResult.caseRef} successfully created and dispatched to ${input.department}.${
          escalationRequired ? ' (Above ₹2,500 threshold - escalated to Duty Manager/GM)' : ''
        }`,
      },
    };
  }

  public async getCaseByRef(staffUser: StaffAuthUser, caseRef: string): Promise<CaseIntakeRecord | null> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) return null;
    return this.intakeRepo.getCaseByRef(caseRef);
  }

  public async getAllCases(
    staffUser: StaffAuthUser,
    filter?: { category?: string; roomNumber?: string },
  ): Promise<CaseIntakeRecord[]> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) return [];
    return this.intakeRepo.getAllCases(filter);
  }
}
