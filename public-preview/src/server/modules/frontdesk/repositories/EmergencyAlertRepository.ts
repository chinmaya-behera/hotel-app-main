export type EmergencyAlertType =
  | 'fire'
  | 'medical'
  | 'security'
  | 'evacuation'
  | 'severe_weather'
  | 'life_safety'
  | 'other';

export type AlertSeverity = 'critical' | 'urgent' | 'warning' | 'info';

export type AlertTargetScope =
  | 'hotel_wide'
  | 'property'
  | 'building'
  | 'floor'
  | 'zone'
  | 'room'
  | 'staff_only'
  | 'security_only';

export type AlertStatus = 'DRAFT' | 'ACTIVE' | 'RESOLVED' | 'CANCELLED';

export interface AlertRecipient {
  id: string;
  type: 'guest' | 'staff';
  name: string;
  roomNumber?: string;
  floor?: number;
}

export interface AlertAcknowledgement {
  recipientId: string;
  recipientType: 'guest' | 'staff';
  recipientName: string;
  roomNumber?: string;
  acknowledgedAt: string;
}

export interface AlertAuditStep {
  action: string;
  at: string;
  staffId: string;
  staffName: string;
  note?: string;
}

export interface EmergencyAlertRecord {
  id: string;
  ref: string;
  propertyId: string;
  title: string;
  alertType: EmergencyAlertType;
  severity: AlertSeverity;
  message: string;
  instructions: string;
  targetScope: AlertTargetScope;
  targetFloors?: number[];
  targetRooms?: string[];
  status: AlertStatus;
  incidentRef?: string;
  targetRecipientCount: number;
  targetRecipients: AlertRecipient[];
  acknowledgements: AlertAcknowledgement[];
  broadcastDeliveryStatus: 'simulated';
  createdByStaffId: string;
  createdByStaffName: string;
  createdAt: string;
  activatedByStaffId?: string;
  activatedByStaffName?: string;
  activatedAt?: string;
  resolvedByStaffId?: string;
  resolvedByStaffName?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  cancelledByStaffId?: string;
  cancelledByStaffName?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  updatedAt: string;
  auditHistory: AlertAuditStep[];
}

export interface IEmergencyAlertRepository {
  createAlert(record: EmergencyAlertRecord): Promise<EmergencyAlertRecord>;
  getAlertById(id: string): Promise<EmergencyAlertRecord | null>;
  getAlertByRef(ref: string): Promise<EmergencyAlertRecord | null>;
  updateAlert(id: string, updates: Partial<EmergencyAlertRecord>): Promise<EmergencyAlertRecord | null>;
  getAllAlerts(filters?: { status?: string; alertType?: string; severity?: string }): Promise<EmergencyAlertRecord[]>;
  recordAcknowledgement(alertId: string, ack: AlertAcknowledgement): Promise<EmergencyAlertRecord | null>;
  reset(): void;
}

export class InMemoryEmergencyAlertRepository implements IEmergencyAlertRepository {
  private static instance: InMemoryEmergencyAlertRepository;
  private alerts = new Map<string, EmergencyAlertRecord>();

  constructor() {
    this.seedDefaultAlerts();
  }

  public static getInstance(): InMemoryEmergencyAlertRepository {
    if (!InMemoryEmergencyAlertRepository.instance) {
      InMemoryEmergencyAlertRepository.instance = new InMemoryEmergencyAlertRepository();
    }
    return InMemoryEmergencyAlertRepository.instance;
  }

  private seedDefaultAlerts(): void {
    const now = Date.now();
    const alert1: EmergencyAlertRecord = {
      id: 'emg_seed_001',
      ref: 'EMG-2026-001',
      propertyId: 'prop_grand_adp_01',
      title: 'Scheduled Fire Alarm Evacuation Drill (Floor 4)',
      alertType: 'evacuation',
      severity: 'warning',
      message: 'Routine testing of Floor 4 emergency acoustic beacons and strobe indicators.',
      instructions: 'Please remain in your room unless directed by floor wardens. No action required.',
      targetScope: 'floor',
      targetFloors: [4],
      targetRooms: ['401', '402', '403'],
      status: 'ACTIVE',
      incidentRef: 'INC-2026-0091',
      targetRecipientCount: 3,
      targetRecipients: [
        { id: 'stay_seed_402', type: 'guest', name: 'Aarav Sharma', roomNumber: '402', floor: 4 },
        { id: 'staff_hk_01', type: 'staff', name: 'Sunita Patel', floor: 4 },
        { id: 'staff_dev_fd_01', type: 'staff', name: 'Marcus Vance' },
      ],
      acknowledgements: [
        {
          recipientId: 'stay_seed_402',
          recipientType: 'guest',
          recipientName: 'Aarav Sharma',
          roomNumber: '402',
          acknowledgedAt: new Date(now - 1200000).toISOString(),
        },
      ],
      broadcastDeliveryStatus: 'simulated',
      createdByStaffId: 'staff_dm_01',
      createdByStaffName: 'Marcus Vance',
      createdAt: new Date(now - 3600000).toISOString(),
      activatedByStaffId: 'staff_dm_01',
      activatedByStaffName: 'Marcus Vance',
      activatedAt: new Date(now - 1800000).toISOString(),
      updatedAt: new Date(now - 1200000).toISOString(),
      auditHistory: [
        {
          action: 'DRAFT_CREATED',
          at: new Date(now - 3600000).toISOString(),
          staffId: 'staff_dm_01',
          staffName: 'Marcus Vance',
          note: 'Evacuation drill drafted for Floor 4.',
        },
        {
          action: 'ACTIVATED',
          at: new Date(now - 1800000).toISOString(),
          staffId: 'staff_dm_01',
          staffName: 'Marcus Vance',
          note: 'Alert activated and simulated broadcast dispatched to 3 targeted recipients.',
        },
      ],
    };

    const alert2: EmergencyAlertRecord = {
      id: 'emg_seed_002',
      ref: 'EMG-2026-002',
      propertyId: 'prop_grand_adp_01',
      title: 'Monsoon High Winds Warning',
      alertType: 'severe_weather',
      severity: 'info',
      message: 'Squall advisory issued by regional meteorological center for coastal zone.',
      instructions: 'Please close balcony sliding doors securely. Pool deck cabanas closed until 22:00.',
      targetScope: 'hotel_wide',
      status: 'DRAFT',
      targetRecipientCount: 15,
      targetRecipients: [],
      acknowledgements: [],
      broadcastDeliveryStatus: 'simulated',
      createdByStaffId: 'staff_fd_01',
      createdByStaffName: 'Sunita Patel',
      createdAt: new Date(now - 7200000).toISOString(),
      updatedAt: new Date(now - 7200000).toISOString(),
      auditHistory: [
        {
          action: 'DRAFT_CREATED',
          at: new Date(now - 7200000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Sunita Patel',
          note: 'Drafted awaiting Duty Manager review.',
        },
      ],
    };

    this.alerts.set(alert1.id, alert1);
    this.alerts.set(alert2.id, alert2);
  }

  public async createAlert(record: EmergencyAlertRecord): Promise<EmergencyAlertRecord> {
    this.alerts.set(record.id, { ...record });
    return { ...record };
  }

  public async getAlertById(id: string): Promise<EmergencyAlertRecord | null> {
    const alert = this.alerts.get(id);
    return alert ? { ...alert } : null;
  }

  public async getAlertByRef(ref: string): Promise<EmergencyAlertRecord | null> {
    for (const alert of this.alerts.values()) {
      if (alert.ref === ref) return { ...alert };
    }
    return null;
  }

  public async updateAlert(id: string, updates: Partial<EmergencyAlertRecord>): Promise<EmergencyAlertRecord | null> {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    const updated: EmergencyAlertRecord = {
      ...alert,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.alerts.set(id, updated);
    return { ...updated };
  }

  public async getAllAlerts(filters?: { status?: string; alertType?: string; severity?: string }): Promise<EmergencyAlertRecord[]> {
    let list = Array.from(this.alerts.values());

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.alertType && filters.alertType !== 'all') {
      list = list.filter((a) => a.alertType === filters.alertType);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter((a) => a.severity === filters.severity);
    }

    // Sort descending by createdAt
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async recordAcknowledgement(alertId: string, ack: AlertAcknowledgement): Promise<EmergencyAlertRecord | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    // Idempotent: prevent duplicate acknowledgement from the same recipientId
    const exists = alert.acknowledgements.some((a) => a.recipientId === ack.recipientId);
    if (!exists) {
      alert.acknowledgements.push(ack);
      alert.updatedAt = new Date().toISOString();
      alert.auditHistory.push({
        action: 'ACKNOWLEDGEMENT_RECEIVED',
        at: ack.acknowledgedAt,
        staffId: ack.recipientId,
        staffName: ack.recipientName,
        note: `Acknowledged by ${ack.recipientType} (${ack.roomNumber ? `Room ${ack.roomNumber}` : 'Staff'})`,
      });
    }

    return { ...alert };
  }

  public reset(): void {
    this.alerts.clear();
    this.seedDefaultAlerts();
  }
}

export function getEmergencyAlertRepository(): IEmergencyAlertRepository {
  return InMemoryEmergencyAlertRepository.getInstance();
}
