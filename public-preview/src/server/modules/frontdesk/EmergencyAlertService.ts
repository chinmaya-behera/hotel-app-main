import { z } from 'zod';
import crypto from 'node:crypto';
import {
  type IEmergencyAlertRepository,
  type EmergencyAlertRecord,
  type EmergencyAlertType,
  type AlertSeverity,
  type AlertTargetScope,
  type AlertStatus,
  type AlertRecipient,
  getEmergencyAlertRepository,
} from './repositories/EmergencyAlertRepository.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from '../guest/repositories/GuestStayRepository.ts';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from './FrontDeskStayService.ts';

export const CreateEmergencyAlertSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  alertType: z.enum([
    'fire',
    'medical',
    'security',
    'evacuation',
    'severe_weather',
    'life_safety',
    'other',
  ], { errorMap: () => ({ message: 'Invalid emergency alert type' }) }),
  severity: z.enum(['critical', 'urgent', 'warning', 'info'], {
    errorMap: () => ({ message: 'Invalid severity level' }),
  }),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000).trim(),
  instructions: z.string().min(5, 'Instructions must be at least 5 characters').max(2000).trim(),
  targetScope: z.enum([
    'hotel_wide',
    'property',
    'building',
    'floor',
    'zone',
    'room',
    'staff_only',
    'security_only',
  ]).default('hotel_wide'),
  targetFloors: z.array(z.number().int().min(1).max(20)).optional(),
  targetRooms: z.array(z.string().min(1)).optional(),
  incidentRef: z.string().trim().optional(),
});

export type CreateEmergencyAlertInput = z.infer<typeof CreateEmergencyAlertSchema>;

export const AcknowledgeAlertSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required').trim(),
  recipientType: z.enum(['guest', 'staff']),
  recipientName: z.string().min(2, 'Recipient name is required').trim(),
  roomNumber: z.string().trim().optional(),
});

export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertSchema>;

export const ResolveAlertSchema = z.object({
  resolutionNotes: z.string().min(3, 'Resolution notes must be at least 3 characters').max(2000).trim(),
});

export type ResolveAlertInput = z.infer<typeof ResolveAlertSchema>;

export const CancelAlertSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters').max(2000).trim(),
});

export type CancelAlertInput = z.infer<typeof CancelAlertSchema>;

export interface EmergencyAlertResult {
  success: boolean;
  statusCode: number;
  data?: EmergencyAlertRecord;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface EmergencyAlertListResult {
  success: boolean;
  statusCode: number;
  data?: {
    alerts: EmergencyAlertRecord[];
    counts: {
      total: number;
      active: number;
      draft: number;
      resolved: number;
      cancelled: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class EmergencyAlertService {
  private alertRepo: IEmergencyAlertRepository;
  private stayRepo: IGuestStayRepository;
  private static sequence = 100;

  constructor(
    alertRepo?: IEmergencyAlertRepository,
    stayRepo?: IGuestStayRepository,
  ) {
    this.alertRepo = alertRepo || getEmergencyAlertRepository();
    this.stayRepo = stayRepo || getGuestStayRepository();
  }

  /**
   * Resolves recipient scope against active in-house stays and roster staff.
   */
  private async resolveRecipients(
    scope: AlertTargetScope,
    targetFloors?: number[],
    targetRooms?: string[],
  ): Promise<AlertRecipient[]> {
    const recipients: AlertRecipient[] = [];

    // 1. Staff recipients (always targeted except in guest-only scopes)
    recipients.push({
      id: 'staff_dev_fd_01',
      type: 'staff',
      name: 'Sunita Patel',
    });
    recipients.push({
      id: 'staff_dm_01',
      type: 'staff',
      name: 'Marcus Vance',
    });

    if (scope === 'staff_only' || scope === 'security_only') {
      return recipients;
    }

    // 2. In-House guest recipients from GuestStayRepository
    const inHouseStays = await this.stayRepo.getAllStays({ filter: 'inhouse' });

    for (const item of inHouseStays) {
      const roomNum = item.currentRoom.roomNumber;
      const floor = item.currentRoom.floor;

      if (scope === 'room' && targetRooms && !targetRooms.includes(roomNum)) {
        continue;
      }

      if (scope === 'floor' && targetFloors && !targetFloors.includes(floor)) {
        continue;
      }

      recipients.push({
        id: item.stay.id,
        type: 'guest',
        name: `${item.stay.guestFirstName} ${item.stay.guestLastName}`,
        roomNumber: roomNum,
        floor,
      });
    }

    return recipients;
  }

  /**
   * Creates a DRAFT emergency alert.
   * Safety Invariant: Drafting an alert NEVER activates or broadcasts it.
   */
  public async createDraftAlert(
    staffUser: StaffAuthUser,
    input: CreateEmergencyAlertInput,
  ): Promise<EmergencyAlertResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for emergency alerts.',
        },
      };
    }

    // Resolve target recipients to calculate and display target count before activation
    const recipients = await this.resolveRecipients(input.targetScope, input.targetFloors, input.targetRooms);

    EmergencyAlertService.sequence++;
    const ref = `EMG-2026-${EmergencyAlertService.sequence.toString().padStart(4, '0')}`;
    const id = `emg_${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    const record: EmergencyAlertRecord = {
      id,
      ref,
      propertyId: 'prop_grand_adp_01',
      title: input.title,
      alertType: input.alertType as EmergencyAlertType,
      severity: input.severity as AlertSeverity,
      message: input.message,
      instructions: input.instructions,
      targetScope: input.targetScope as AlertTargetScope,
      targetFloors: input.targetFloors,
      targetRooms: input.targetRooms,
      status: 'DRAFT', // Strictly DRAFT initially
      incidentRef: input.incidentRef,
      targetRecipientCount: recipients.length,
      targetRecipients: recipients,
      acknowledgements: [],
      broadcastDeliveryStatus: 'simulated',
      createdByStaffId: staffUser.staffId,
      createdByStaffName: staffUser.name || 'Staff User',
      createdAt: nowIso,
      updatedAt: nowIso,
      auditHistory: [
        {
          action: 'DRAFT_CREATED',
          at: nowIso,
          staffId: staffUser.staffId,
          staffName: staffUser.name || staffUser.staffId,
          note: `Draft emergency alert created with ${recipients.length} target recipients. Activation required.`,
        },
      ],
    };

    const saved = await this.alertRepo.createAlert(record);

    return {
      success: true,
      statusCode: 201,
      data: saved,
    };
  }

  /**
   * Explicit Activation Action:
   * Transitions DRAFT -> ACTIVE and initiates simulated multi-channel broadcast.
   */
  public async activateAlert(staffUser: StaffAuthUser, alertId: string): Promise<EmergencyAlertResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized to activate emergency alerts.',
        },
      };
    }

    const existing = await this.alertRepo.getAlertById(alertId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Emergency alert with ID '${alertId}' was not found.`,
        },
      };
    }

    if (existing.status === 'ACTIVE') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ALERT_ALREADY_ACTIVE',
          message: `Alert ${existing.ref} is already active. Duplicate activation prevented.`,
        },
      };
    }

    if (existing.status === 'RESOLVED' || existing.status === 'CANCELLED') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot activate an alert that is '${existing.status}'.`,
        },
      };
    }

    // Re-evaluate recipient count at time of activation to capture real-time room occupancy
    const freshRecipients = await this.resolveRecipients(
      existing.targetScope,
      existing.targetFloors,
      existing.targetRooms,
    );

    const nowIso = new Date().toISOString();
    const newHistory = [...existing.auditHistory];
    newHistory.push({
      action: 'ACTIVATED',
      at: nowIso,
      staffId: staffUser.staffId,
      staffName: staffUser.name || staffUser.staffId,
      note: `Alert explicitly activated by ${staffUser.name || staffUser.staffId} (${staffUser.role}). Simulated broadcast dispatched to ${freshRecipients.length} recipients.`,
    });

    const updates: Partial<EmergencyAlertRecord> = {
      status: 'ACTIVE',
      activatedAt: nowIso,
      activatedByStaffId: staffUser.staffId,
      activatedByStaffName: staffUser.name || staffUser.staffId,
      targetRecipientCount: freshRecipients.length,
      targetRecipients: freshRecipients,
      broadcastDeliveryStatus: 'simulated', // Explicitly reported as simulated
      auditHistory: newHistory,
    };

    const updated = await this.alertRepo.updateAlert(alertId, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  /**
   * Recipient Acknowledgement Guard:
   * Records that an eligible recipient received and acknowledged the emergency alert.
   */
  public async acknowledgeAlert(
    alertId: string,
    input: AcknowledgeAlertInput,
  ): Promise<EmergencyAlertResult> {
    const existing = await this.alertRepo.getAlertById(alertId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Emergency alert with ID '${alertId}' was not found.`,
        },
      };
    }

    if (existing.status !== 'ACTIVE') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ALERT_NOT_ACTIVE',
          message: `Cannot acknowledge alert with status '${existing.status}'. Only ACTIVE alerts accept acknowledgements.`,
        },
      };
    }

    // Eligibility check: If alert targets specific rooms or floors, verify recipient room matches target
    if (input.recipientType === 'guest' && input.roomNumber) {
      if (existing.targetScope === 'room' && existing.targetRooms) {
        if (!existing.targetRooms.includes(input.roomNumber)) {
          return {
            success: false,
            statusCode: 403,
            error: {
              code: 'RECIPIENT_NOT_ELIGIBLE',
              message: `Room ${input.roomNumber} is not in the targeted scope for this emergency alert.`,
            },
          };
        }
      }
    }

    const nowIso = new Date().toISOString();
    const updated = await this.alertRepo.recordAcknowledgement(alertId, {
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      recipientName: input.recipientName,
      roomNumber: input.roomNumber,
      acknowledgedAt: nowIso,
    });

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  /**
   * Resolves an ACTIVE alert.
   */
  public async resolveAlert(
    staffUser: StaffAuthUser,
    alertId: string,
    input: ResolveAlertInput,
  ): Promise<EmergencyAlertResult> {
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

    const existing = await this.alertRepo.getAlertById(alertId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Emergency alert with ID '${alertId}' was not found.`,
        },
      };
    }

    if (existing.status !== 'ACTIVE') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'ALERT_NOT_ACTIVE',
          message: `Only ACTIVE alerts can be resolved (current status: '${existing.status}').`,
        },
      };
    }

    const nowIso = new Date().toISOString();
    const newHistory = [...existing.auditHistory];
    newHistory.push({
      action: 'RESOLVED',
      at: nowIso,
      staffId: staffUser.staffId,
      staffName: staffUser.name || staffUser.staffId,
      note: `Resolved by ${staffUser.name || staffUser.staffId}: ${input.resolutionNotes}`,
    });

    const updates: Partial<EmergencyAlertRecord> = {
      status: 'RESOLVED',
      resolvedAt: nowIso,
      resolvedByStaffId: staffUser.staffId,
      resolvedByStaffName: staffUser.name || staffUser.staffId,
      resolutionNotes: input.resolutionNotes,
      auditHistory: newHistory,
    };

    const updated = await this.alertRepo.updateAlert(alertId, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  /**
   * Cancels a DRAFT or ACTIVE alert (e.g. false alarm or drill completion).
   */
  public async cancelAlert(
    staffUser: StaffAuthUser,
    alertId: string,
    input: CancelAlertInput,
  ): Promise<EmergencyAlertResult> {
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

    const existing = await this.alertRepo.getAlertById(alertId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Emergency alert with ID '${alertId}' was not found.`,
        },
      };
    }

    if (existing.status === 'CANCELLED' || existing.status === 'RESOLVED') {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot cancel an alert that is already '${existing.status}'.`,
        },
      };
    }

    const nowIso = new Date().toISOString();
    const newHistory = [...existing.auditHistory];
    newHistory.push({
      action: 'CANCELLED',
      at: nowIso,
      staffId: staffUser.staffId,
      staffName: staffUser.name || staffUser.staffId,
      note: `Cancelled by ${staffUser.name || staffUser.staffId}. Reason: ${input.reason}`,
    });

    const updates: Partial<EmergencyAlertRecord> = {
      status: 'CANCELLED',
      cancelledAt: nowIso,
      cancelledByStaffId: staffUser.staffId,
      cancelledByStaffName: staffUser.name || staffUser.staffId,
      cancelledReason: input.reason,
      auditHistory: newHistory,
    };

    const updated = await this.alertRepo.updateAlert(alertId, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  public async getAlerts(
    staffUser: StaffAuthUser,
    filters?: { status?: string; alertType?: string; severity?: string },
  ): Promise<EmergencyAlertListResult> {
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

    const alerts = await this.alertRepo.getAllAlerts(filters);
    const all = await this.alertRepo.getAllAlerts();

    const counts = {
      total: all.length,
      active: 0,
      draft: 0,
      resolved: 0,
      cancelled: 0,
    };

    for (const a of all) {
      if (a.status === 'ACTIVE') counts.active++;
      else if (a.status === 'DRAFT') counts.draft++;
      else if (a.status === 'RESOLVED') counts.resolved++;
      else if (a.status === 'CANCELLED') counts.cancelled++;
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        alerts,
        counts,
      },
    };
  }

  public async getAlertById(staffUser: StaffAuthUser, alertId: string): Promise<EmergencyAlertResult> {
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

    const alert = await this.alertRepo.getAlertById(alertId);
    if (!alert) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: `Emergency alert with ID '${alertId}' was not found.`,
        },
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: alert,
    };
  }
}
