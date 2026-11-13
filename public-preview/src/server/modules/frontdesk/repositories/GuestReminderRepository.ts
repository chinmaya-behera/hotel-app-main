export type ReminderType =
  | 'wake_up_call'
  | 'airport_transfer'
  | 'service_followup'
  | 'medication'
  | 'turndown'
  | 'general';

export type ReminderPriority = 'normal' | 'urgent' | 'vip';
export type ReminderStatus = 'pending' | 'acknowledged' | 'snoozed' | 'completed' | 'cancelled';
export type AlarmState = 'scheduled' | 'ringing' | 'snoozed' | 'acknowledged' | 'completed';

export interface ReminderHistoryEntry {
  status: string;
  at: string;
  note?: string;
  staffId?: string;
}

export interface GuestReminderRecord {
  id: string;
  propertyId: string;
  stayId?: string;
  roomNumber: string;
  guestName: string;
  title: string;
  instructions?: string;
  reminderType: ReminderType;
  dueDate: string;
  dueTime: string;
  dueDateTimeIso: string;
  dueDateTimeMs: number;
  leadMinutes: number;
  alertAtIso: string;
  alertAtMs: number;
  priority: ReminderPriority;
  status: ReminderStatus;
  alarmState: AlarmState;
  snoozeCount: number;
  snoozedUntilMs?: number;
  snoozedUntilIso?: string;
  assignedTo?: string;
  caseRef?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: ReminderHistoryEntry[];
}

export interface IGuestReminderRepository {
  createReminder(record: GuestReminderRecord): Promise<GuestReminderRecord>;
  getReminderById(id: string): Promise<GuestReminderRecord | null>;
  updateReminder(id: string, updates: Partial<GuestReminderRecord>): Promise<GuestReminderRecord | null>;
  deleteReminder(id: string): Promise<boolean>;
  getAllReminders(filters?: { roomNumber?: string; status?: string; tab?: string }): Promise<GuestReminderRecord[]>;
  findConflictingReminder(roomNumber: string, dueDateTimeMs: number, title: string): Promise<GuestReminderRecord | null>;
  reset(): void;
}

export class InMemoryGuestReminderRepository implements IGuestReminderRepository {
  private static instance: InMemoryGuestReminderRepository;
  private reminders = new Map<string, GuestReminderRecord>();

  constructor() {
    this.seedDefaultReminders();
  }

  public static getInstance(): InMemoryGuestReminderRepository {
    if (!InMemoryGuestReminderRepository.instance) {
      InMemoryGuestReminderRepository.instance = new InMemoryGuestReminderRepository();
    }
    return InMemoryGuestReminderRepository.instance;
  }

  private seedDefaultReminders(): void {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Reminder 1: Fired / Ringing demo alarm for Room 402
    const target1 = now - 60 * 1000;
    const alert1 = target1 - 15 * 60 * 1000;
    const rem1: GuestReminderRecord = {
      id: 'rem-demo-1',
      propertyId: 'prop_grand_adp_01',
      stayId: 'stay_seed_402',
      roomNumber: '402',
      guestName: 'Aarav Sharma',
      title: 'Evening Turndown & Extra Pillows',
      instructions: 'Deliver extra hypoallergenic pillows and confirm evening dinner reservation.',
      reminderType: 'turndown',
      dueDate: 'Today',
      dueTime: '20:00',
      dueDateTimeIso: new Date(target1).toISOString(),
      dueDateTimeMs: target1,
      leadMinutes: 15,
      alertAtIso: new Date(alert1).toISOString(),
      alertAtMs: alert1,
      priority: 'vip',
      status: 'pending',
      alarmState: 'ringing',
      snoozeCount: 0,
      assignedTo: 'Sunita Patel (Front Desk)',
      caseRef: 'REQ-2026-402',
      notes: 'Guest requested hypoallergenic options specifically.',
      createdBy: 'Front Desk Coordinator',
      createdAt: new Date(now - 3600000).toISOString(),
      updatedAt: new Date(now - 60000).toISOString(),
      history: [
        { status: 'pending', at: new Date(now - 3600000).toISOString(), note: 'Scheduled' },
        { status: 'ringing', at: new Date(alert1).toISOString(), note: 'Alarm threshold reached' },
      ],
    };

    // Reminder 2: Upcoming scheduled reminder for Room 205 (Vikram Malhotra)
    const target2 = now + 4 * 3600 * 1000;
    const alert2 = target2 - 30 * 60 * 1000;
    const rem2: GuestReminderRecord = {
      id: 'rem-demo-2',
      propertyId: 'prop_grand_adp_01',
      stayId: 'stay_seed_205',
      roomNumber: '205',
      guestName: 'Vikram Malhotra',
      title: 'Airport Limousine Pickup Check',
      instructions: 'Confirm chauffeur dispatch with driver for Terminal 2 departure.',
      reminderType: 'airport_transfer',
      dueDate: 'Today',
      dueTime: '18:00',
      dueDateTimeIso: new Date(target2).toISOString(),
      dueDateTimeMs: target2,
      leadMinutes: 30,
      alertAtIso: new Date(alert2).toISOString(),
      alertAtMs: alert2,
      priority: 'vip',
      status: 'pending',
      alarmState: 'scheduled',
      snoozeCount: 0,
      assignedTo: 'Concierge Team',
      caseRef: 'REQ-2026-205',
      createdBy: 'Front Desk Coordinator',
      createdAt: new Date(now - 7200000).toISOString(),
      updatedAt: new Date(now - 7200000).toISOString(),
      history: [{ status: 'pending', at: new Date(now - 7200000).toISOString(), note: 'Scheduled' }],
    };

    // Reminder 3: Completed reminder for Room 102 (Arjun Das)
    const target3 = now - 5 * 3600 * 1000;
    const alert3 = target3 - 10 * 60 * 1000;
    const rem3: GuestReminderRecord = {
      id: 'rem-demo-3',
      propertyId: 'prop_grand_adp_01',
      stayId: 'stay_seed_102',
      roomNumber: '102',
      guestName: 'Arjun Das',
      title: 'Morning Wake-Up Call',
      instructions: 'Personal wake-up call requested with room service coffee.',
      reminderType: 'wake_up_call',
      dueDate: 'Today',
      dueTime: '07:30',
      dueDateTimeIso: new Date(target3).toISOString(),
      dueDateTimeMs: target3,
      leadMinutes: 10,
      alertAtIso: new Date(alert3).toISOString(),
      alertAtMs: alert3,
      priority: 'urgent',
      status: 'completed',
      alarmState: 'completed',
      snoozeCount: 1,
      assignedTo: 'Sunita Patel (Front Desk)',
      caseRef: 'REQ-2026-102',
      notes: 'Completed. Guest answered and confirmed wakeup.',
      createdBy: 'Front Desk Coordinator',
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 14400000).toISOString(),
      completedAt: new Date(now - 14400000).toISOString(),
      history: [
        { status: 'pending', at: new Date(now - 86400000).toISOString(), note: 'Scheduled' },
        { status: 'snoozed', at: new Date(alert3).toISOString(), note: 'Snoozed 5 minutes' },
        { status: 'completed', at: new Date(now - 14400000).toISOString(), note: 'Completed' },
      ],
    };

    this.reminders.set(rem1.id, rem1);
    this.reminders.set(rem2.id, rem2);
    this.reminders.set(rem3.id, rem3);
  }

  public async createReminder(record: GuestReminderRecord): Promise<GuestReminderRecord> {
    this.reminders.set(record.id, { ...record });
    return { ...record };
  }

  public async getReminderById(id: string): Promise<GuestReminderRecord | null> {
    const record = this.reminders.get(id);
    return record ? { ...record } : null;
  }

  public async updateReminder(id: string, updates: Partial<GuestReminderRecord>): Promise<GuestReminderRecord | null> {
    const record = this.reminders.get(id);
    if (!record) return null;

    const updated: GuestReminderRecord = {
      ...record,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.reminders.set(id, updated);
    return { ...updated };
  }

  public async deleteReminder(id: string): Promise<boolean> {
    return this.reminders.delete(id);
  }

  public async getAllReminders(filters?: { roomNumber?: string; status?: string; tab?: string }): Promise<GuestReminderRecord[]> {
    let list = Array.from(this.reminders.values());

    if (filters?.roomNumber) {
      list = list.filter((r) => r.roomNumber === filters.roomNumber);
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }

    const now = Date.now();
    if (filters?.tab && filters.tab !== 'all') {
      if (filters.tab === 'upcoming') {
        list = list.filter((r) => r.status === 'pending' && now < r.alertAtMs);
      } else if (filters.tab === 'overdue') {
        list = list.filter((r) => r.status !== 'completed' && r.status !== 'cancelled' && now > r.dueDateTimeMs);
      } else if (filters.tab === 'completed') {
        list = list.filter((r) => r.status === 'completed');
      } else if (filters.tab === 'ringing') {
        list = list.filter((r) => (r.status === 'pending' || r.status === 'snoozed') && r.alarmState === 'ringing');
      }
    }

    // Sort by dueDateTimeMs ascending (earliest due first)
    return list.sort((a, b) => a.dueDateTimeMs - b.dueDateTimeMs);
  }

  public async findConflictingReminder(
    roomNumber: string,
    dueDateTimeMs: number,
    title: string,
  ): Promise<GuestReminderRecord | null> {
    const normTitle = title.trim().toLowerCase();
    for (const rem of this.reminders.values()) {
      if (
        rem.roomNumber === roomNumber &&
        Math.abs(rem.dueDateTimeMs - dueDateTimeMs) < 60000 && // within 1 minute of same time
        rem.title.trim().toLowerCase() === normTitle &&
        (rem.status === 'pending' || rem.status === 'snoozed')
      ) {
        return { ...rem };
      }
    }
    return null;
  }

  public reset(): void {
    this.reminders.clear();
    this.seedDefaultReminders();
  }
}

export function getGuestReminderRepository(): IGuestReminderRepository {
  return InMemoryGuestReminderRepository.getInstance();
}
