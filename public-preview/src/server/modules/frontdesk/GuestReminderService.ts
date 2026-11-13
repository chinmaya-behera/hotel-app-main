import { z } from 'zod';
import crypto from 'node:crypto';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from '../guest/repositories/GuestStayRepository.ts';
import {
  type IRoomCatalogRepository,
  getRoomCatalogRepository,
} from '../public/repositories/RoomCatalogRepository.ts';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from './FrontDeskStayService.ts';
import {
  type IGuestReminderRepository,
  type GuestReminderRecord,
  type ReminderType,
  type ReminderPriority,
  type ReminderStatus,
  type AlarmState,
  getGuestReminderRepository,
} from './repositories/GuestReminderRepository.ts';

export const CreateGuestReminderSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').trim(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  instructions: z.string().max(1000).optional(),
  reminderType: z.enum([
    'wake_up_call',
    'airport_transfer',
    'service_followup',
    'medication',
    'turndown',
    'general',
  ]).default('general'),
  dueDate: z.string().min(1, 'Due date is required').trim(), // e.g. 'Today', 'Tomorrow', '2026-11-14'
  dueTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Due time must be in HH:mm 24-hour format').trim(),
  leadMinutes: z.number().int().min(0).max(180).default(15),
  priority: z.enum(['normal', 'urgent', 'vip']).default('normal'),
  stayId: z.string().trim().optional(),
  guestName: z.string().trim().optional(),
  assignedTo: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  caseRef: z.string().trim().optional(),
});

export type CreateGuestReminderInput = z.infer<typeof CreateGuestReminderSchema>;

export const UpdateGuestReminderSchema = z.object({
  action: z.enum(['acknowledge', 'snooze', 'complete', 'cancel', 'update']),
  snoozeMinutes: z.number().int().min(1).max(120).default(10).optional(),
  notes: z.string().max(500).optional(),
  dueTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  title: z.string().min(3).max(200).optional(),
  instructions: z.string().max(1000).optional(),
});

export type UpdateGuestReminderInput = z.infer<typeof UpdateGuestReminderSchema>;

export interface GuestReminderResult {
  success: boolean;
  statusCode: number;
  data?: GuestReminderRecord;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface GuestReminderListResult {
  success: boolean;
  statusCode: number;
  data?: {
    reminders: GuestReminderRecord[];
    counts: {
      total: number;
      upcoming: number;
      ringing: number;
      overdue: number;
      completed: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class GuestReminderService {
  private stayRepo: IGuestStayRepository;
  private catalogRepo: IRoomCatalogRepository;
  private reminderRepo: IGuestReminderRepository;

  constructor(
    stayRepo?: IGuestStayRepository,
    catalogRepo?: IRoomCatalogRepository,
    reminderRepo?: IGuestReminderRepository,
  ) {
    this.stayRepo = stayRepo || getGuestStayRepository();
    this.catalogRepo = catalogRepo || getRoomCatalogRepository();
    this.reminderRepo = reminderRepo || getGuestReminderRepository();
  }

  /**
   * Helper to parse date string and time (HH:mm) into epoch milliseconds and ISO string.
   */
  public static calculateTargetTime(dueDate: string, dueTime: string): { timeMs: number; iso: string } | null {
    const [hoursStr, minutesStr] = dueTime.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    const now = new Date();
    const target = new Date();

    const lowerDate = dueDate.toLowerCase().trim();
    if (lowerDate === 'today') {
      target.setHours(hours, minutes, 0, 0);
    } else if (lowerDate === 'tomorrow') {
      target.setDate(now.getDate() + 1);
      target.setHours(hours, minutes, 0, 0);
    } else {
      // Expect YYYY-MM-DD
      const parts = dueDate.split('-');
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = Number(parts[2]);
        if (isNaN(y) || isNaN(m) || isNaN(d) || m < 0 || m > 11 || d < 1 || d > 31) {
          return null;
        }
        target.setFullYear(y, m, d);
        target.setHours(hours, minutes, 0, 0);
      } else {
        return null;
      }
    }

    return {
      timeMs: target.getTime(),
      iso: target.toISOString(),
    };
  }

  public async createReminder(
    staffUser: StaffAuthUser,
    input: CreateGuestReminderInput,
  ): Promise<GuestReminderResult> {
    // 1. Staff Authorization Guard
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for managing guest reminders.',
        },
      };
    }

    // 2. Validate Room Context
    const room = await this.catalogRepo.getRoomByNumber(input.roomNumber);
    if (!room) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with number '${input.roomNumber}' was not found in the hotel inventory.`,
        },
      };
    }

    // Enrich with stay context if active guest is in the room
    let stayId = input.stayId;
    let guestName = input.guestName;
    const activeStay = await this.stayRepo.getStayWithRoomByRoomNumber(input.roomNumber);
    if (activeStay) {
      stayId = stayId || activeStay.stay.id;
      guestName = guestName || `${activeStay.stay.guestFirstName} ${activeStay.stay.guestLastName}`;
    } else if (!guestName) {
      guestName = `Guest in Room ${input.roomNumber}`;
    }

    // 3. Compute Timing & Validate Dates
    const parsedTarget = GuestReminderService.calculateTargetTime(input.dueDate, input.dueTime);
    if (!parsedTarget) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'INVALID_DATETIME',
          message: `Invalid due date ('${input.dueDate}') or due time ('${input.dueTime}'). Expected 'Today', 'Tomorrow', or 'YYYY-MM-DD' and 'HH:mm'.`,
        },
      };
    }

    const { timeMs: dueDateTimeMs, iso: dueDateTimeIso } = parsedTarget;
    const alertAtMs = dueDateTimeMs - input.leadMinutes * 60 * 1000;
    const alertAtIso = new Date(alertAtMs).toISOString();

    // 4. Duplicate Check Guard
    const conflicting = await this.reminderRepo.findConflictingReminder(
      input.roomNumber,
      dueDateTimeMs,
      input.title,
    );
    if (conflicting) {
      return {
        success: false,
        statusCode: 409,
        error: {
          code: 'DUPLICATE_REMINDER',
          message: `A reminder titled '${input.title}' is already scheduled for Room ${input.roomNumber} at ${input.dueTime} (${conflicting.id}).`,
        },
      };
    }

    // 5. Initial Alarm State Calculation
    const nowMs = Date.now();
    let alarmState: AlarmState = 'scheduled';
    if (nowMs >= alertAtMs && nowMs <= dueDateTimeMs) {
      alarmState = 'ringing';
    }

    const nowIso = new Date().toISOString();
    const reminderId = `rem_${crypto.randomUUID().slice(0, 8)}`;

    const record: GuestReminderRecord = {
      id: reminderId,
      propertyId: 'prop_grand_adp_01',
      stayId,
      roomNumber: input.roomNumber,
      guestName,
      title: input.title,
      instructions: input.instructions,
      reminderType: input.reminderType,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      dueDateTimeIso,
      dueDateTimeMs,
      leadMinutes: input.leadMinutes,
      alertAtIso,
      alertAtMs,
      priority: input.priority,
      status: 'pending',
      alarmState,
      snoozeCount: 0,
      assignedTo: input.assignedTo || `${staffUser.name || 'Front Desk'} (Front Desk)`,
      caseRef: input.caseRef,
      notes: input.notes,
      createdBy: staffUser.name || staffUser.staffId,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          status: 'pending',
          at: nowIso,
          note: `Created by ${staffUser.name || staffUser.staffId} (${staffUser.role})`,
          staffId: staffUser.staffId,
        },
      ],
    };

    const saved = await this.reminderRepo.createReminder(record);

    return {
      success: true,
      statusCode: 201,
      data: saved,
    };
  }

  public async getReminders(
    staffUser: StaffAuthUser,
    filters?: { roomNumber?: string; status?: string; tab?: string; search?: string },
  ): Promise<GuestReminderListResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for viewing guest reminders.',
        },
      };
    }

    let reminders = await this.reminderRepo.getAllReminders(filters);

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      reminders = reminders.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.guestName.toLowerCase().includes(q) ||
          r.roomNumber.toLowerCase().includes(q) ||
          (r.instructions && r.instructions.toLowerCase().includes(q)),
      );
    }

    // Compute live counts
    const allReminders = await this.reminderRepo.getAllReminders();
    const now = Date.now();
    const counts = {
      total: allReminders.length,
      upcoming: 0,
      ringing: 0,
      overdue: 0,
      completed: 0,
    };

    for (const r of allReminders) {
      if (r.status === 'completed') {
        counts.completed++;
      } else if (r.status === 'cancelled') {
        // cancelled not in active metrics
      } else if (now > r.dueDateTimeMs) {
        counts.overdue++;
        if (r.alarmState === 'ringing') counts.ringing++;
      } else if (now >= r.alertAtMs && now <= r.dueDateTimeMs) {
        counts.ringing++;
      } else {
        counts.upcoming++;
      }
    }

    return {
      success: true,
      statusCode: 200,
      data: {
        reminders,
        counts,
      },
    };
  }

  public async updateReminderAction(
    staffUser: StaffAuthUser,
    reminderId: string,
    input: UpdateGuestReminderInput,
  ): Promise<GuestReminderResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for updating reminders.',
        },
      };
    }

    const existing = await this.reminderRepo.getReminderById(reminderId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'REMINDER_NOT_FOUND',
          message: `Guest reminder with ID '${reminderId}' was not found.`,
        },
      };
    }

    const now = Date.now();
    const nowIso = new Date().toISOString();
    const updates: Partial<GuestReminderRecord> = {};
    const newHistory = [...existing.history];

    if (input.action === 'acknowledge') {
      updates.alarmState = 'acknowledged';
      updates.status = 'acknowledged';
      newHistory.push({
        status: 'acknowledged',
        at: nowIso,
        note: input.notes || `Alarm acknowledged by ${staffUser.name || staffUser.staffId}`,
        staffId: staffUser.staffId,
      });
    } else if (input.action === 'snooze') {
      const snoozeMins = input.snoozeMinutes || 10;
      const snoozedUntilMs = now + snoozeMins * 60 * 1000;
      updates.snoozeCount = existing.snoozeCount + 1;
      updates.snoozedUntilMs = snoozedUntilMs;
      updates.snoozedUntilIso = new Date(snoozedUntilMs).toISOString();
      updates.alarmState = 'snoozed';
      updates.status = 'snoozed';
      newHistory.push({
        status: 'snoozed',
        at: nowIso,
        note: input.notes || `Snoozed for ${snoozeMins} minutes by ${staffUser.name || staffUser.staffId}`,
        staffId: staffUser.staffId,
      });
    } else if (input.action === 'complete') {
      updates.status = 'completed';
      updates.alarmState = 'completed';
      updates.completedAt = nowIso;
      newHistory.push({
        status: 'completed',
        at: nowIso,
        note: input.notes || `Reminder fulfilled by ${staffUser.name || staffUser.staffId}`,
        staffId: staffUser.staffId,
      });
    } else if (input.action === 'cancel') {
      updates.status = 'cancelled';
      updates.alarmState = 'completed';
      newHistory.push({
        status: 'cancelled',
        at: nowIso,
        note: input.notes || `Reminder cancelled by ${staffUser.name || staffUser.staffId}`,
        staffId: staffUser.staffId,
      });
    } else if (input.action === 'update') {
      if (input.title) updates.title = input.title;
      if (input.instructions) updates.instructions = input.instructions;
      if (input.notes) updates.notes = input.notes;
      if (input.dueTime) {
        const recalculated = GuestReminderService.calculateTargetTime(existing.dueDate, input.dueTime);
        if (recalculated) {
          updates.dueTime = input.dueTime;
          updates.dueDateTimeMs = recalculated.timeMs;
          updates.dueDateTimeIso = recalculated.iso;
          updates.alertAtMs = recalculated.timeMs - existing.leadMinutes * 60000;
          updates.alertAtIso = new Date(updates.alertAtMs).toISOString();
        }
      }
      newHistory.push({
        status: existing.status,
        at: nowIso,
        note: `Details updated by ${staffUser.name || staffUser.staffId}`,
        staffId: staffUser.staffId,
      });
    }

    updates.history = newHistory;
    const updated = await this.reminderRepo.updateReminder(reminderId, updates);

    return {
      success: true,
      statusCode: 200,
      data: updated || undefined,
    };
  }

  public async deleteReminder(staffUser: StaffAuthUser, reminderId: string): Promise<GuestReminderResult> {
    const auth = FrontDeskStayService.validateStaffRole(staffUser);
    if (!auth.authorized) {
      return {
        success: false,
        statusCode: 403,
        error: {
          code: 'FORBIDDEN',
          message: auth.reason || 'Staff role unauthorized for deleting reminders.',
        },
      };
    }

    const existing = await this.reminderRepo.getReminderById(reminderId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'REMINDER_NOT_FOUND',
          message: `Guest reminder with ID '${reminderId}' was not found.`,
        },
      };
    }

    await this.reminderRepo.deleteReminder(reminderId);

    return {
      success: true,
      statusCode: 200,
      data: existing,
    };
  }
}
