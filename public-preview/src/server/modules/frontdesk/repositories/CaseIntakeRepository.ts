export interface CaseAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface CaseIntakeRecord {
  id: string;
  caseId: string;
  caseRef: string;
  taskId: string;
  category: 'request' | 'complaint' | 'incident' | 'dispute';
  department: string;
  priority: 'low' | 'normal' | 'urgent' | 'safety_critical';
  channel: 'walk_in' | 'phone' | 'in_person' | 'front_desk' | 'intercom';
  title: string;
  description: string;
  propertyId: string;
  roomNumber?: string;
  stayId?: string;
  guestName?: string;
  disputedAmount?: number;
  currency?: string;
  relatedCharge?: string;
  preferredResolution?: string;
  proposedCompensation?: number;
  severity?: string;
  escalationRequired?: boolean;
  status: string;
  attachments?: CaseAttachment[];
  staffId: string;
  staffName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICaseIntakeRepository {
  saveCaseIntake(record: CaseIntakeRecord): Promise<CaseIntakeRecord>;
  getCaseById(caseId: string): Promise<CaseIntakeRecord | null>;
  getCaseByRef(caseRef: string): Promise<CaseIntakeRecord | null>;
  getAllCases(filter?: { category?: string; roomNumber?: string }): Promise<CaseIntakeRecord[]>;
  getIdempotencyRecord(key: string): Promise<CaseIntakeRecord | null>;
  setIdempotencyRecord(key: string, record: CaseIntakeRecord): Promise<void>;
  reset(): void;
}

export class InMemoryCaseIntakeRepository implements ICaseIntakeRepository {
  private static instance: InMemoryCaseIntakeRepository;
  private cases = new Map<string, CaseIntakeRecord>();
  private idempotencyCache = new Map<string, CaseIntakeRecord>();

  constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): InMemoryCaseIntakeRepository {
    if (!InMemoryCaseIntakeRepository.instance) {
      InMemoryCaseIntakeRepository.instance = new InMemoryCaseIntakeRepository();
    }
    return InMemoryCaseIntakeRepository.instance;
  }

  private seedDefaultData(): void {
    const seed1: CaseIntakeRecord = {
      id: 'case_intake_seed_1',
      caseId: 'case_seed_101',
      caseRef: 'CMP-2026-402-01',
      taskId: 'task_seed_101',
      category: 'complaint',
      department: 'Maintenance',
      priority: 'urgent',
      channel: 'phone',
      title: 'AC unit rattling noise in Room 402',
      description: 'Guest reports loud vibration coming from the ceiling FCU actuator.',
      propertyId: 'prop_grand_adp_01',
      roomNumber: '402',
      stayId: 'stay_seed_402',
      guestName: 'Aarav Sharma',
      status: 'submitted',
      staffId: 'staff_dev_fd_01',
      staffName: 'Sunita Patel',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    };

    const seed2: CaseIntakeRecord = {
      id: 'case_intake_seed_2',
      caseId: 'case_seed_102',
      caseRef: 'DSP-2026-305-01',
      taskId: 'task_seed_102',
      category: 'dispute',
      department: 'Finance',
      priority: 'normal',
      channel: 'walk_in',
      title: 'Minibar disputed charge for Sparkling Water',
      description: 'Guest claims minibar seal was already broken upon arrival.',
      propertyId: 'prop_grand_adp_01',
      roomNumber: '305',
      guestName: 'Marcus Chen',
      disputedAmount: 450,
      currency: 'INR',
      relatedCharge: 'Minibar Beverages',
      preferredResolution: 'charge_removal',
      escalationRequired: false,
      status: 'submitted',
      staffId: 'staff_dev_fd_01',
      staffName: 'Sunita Patel',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    };

    this.cases.set(seed1.caseId, seed1);
    this.cases.set(seed2.caseId, seed2);
  }

  public async saveCaseIntake(record: CaseIntakeRecord): Promise<CaseIntakeRecord> {
    this.cases.set(record.caseId, { ...record });
    return { ...record };
  }

  public async getCaseById(caseId: string): Promise<CaseIntakeRecord | null> {
    const record = this.cases.get(caseId);
    return record ? { ...record } : null;
  }

  public async getCaseByRef(caseRef: string): Promise<CaseIntakeRecord | null> {
    for (const record of this.cases.values()) {
      if (record.caseRef === caseRef) {
        return { ...record };
      }
    }
    return null;
  }

  public async getAllCases(filter?: { category?: string; roomNumber?: string }): Promise<CaseIntakeRecord[]> {
    let result = Array.from(this.cases.values());
    if (filter?.category) {
      result = result.filter((c) => c.category === filter.category);
    }
    if (filter?.roomNumber) {
      result = result.filter((c) => c.roomNumber === filter.roomNumber);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getIdempotencyRecord(key: string): Promise<CaseIntakeRecord | null> {
    const record = this.idempotencyCache.get(key);
    return record ? { ...record } : null;
  }

  public async setIdempotencyRecord(key: string, record: CaseIntakeRecord): Promise<void> {
    this.idempotencyCache.set(key, { ...record });
  }

  public reset(): void {
    this.cases.clear();
    this.idempotencyCache.clear();
    this.seedDefaultData();
  }
}

export function getCaseIntakeRepository(): ICaseIntakeRepository {
  return InMemoryCaseIntakeRepository.getInstance();
}
