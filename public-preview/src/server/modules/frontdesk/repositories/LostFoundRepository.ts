export type LostFoundCategory =
  | 'electronics'
  | 'clothing'
  | 'jewelry_valuables'
  | 'documents'
  | 'luggage'
  | 'keys'
  | 'personal_items'
  | 'other';

export type LostFoundStatus =
  | 'FOUND'
  | 'STORED'
  | 'CLAIM_PENDING'
  | 'RELEASED'
  | 'DISPOSED';

export interface LostFoundEventHistory {
  status: LostFoundStatus;
  at: string;
  staffId: string;
  staffName: string;
  note?: string;
}

export interface LostFoundRecord {
  id: string;
  ref: string;
  propertyId: string;
  itemName: string;
  category: LostFoundCategory;
  description: string;
  foundLocation: string;
  foundDate: string; // YYYY-MM-DD
  foundTime?: string; // HH:mm
  roomNumber?: string;
  stayId?: string;
  storageLocation: string;
  sensitive: boolean;
  photoStorageKey?: string;
  photoUrl?: string;
  registeredByStaffId: string;
  registeredByStaffName: string;
  status: LostFoundStatus;
  // Claim & Release attributes
  claimantName?: string;
  claimantContact?: string;
  claimantVerificationMethod?: string;
  claimNotes?: string;
  claimedAt?: string;
  releasedByStaffId?: string;
  releasedByStaffName?: string;
  releasedAt?: string;
  disposalReason?: string;
  disposedAt?: string;
  createdAt: string;
  updatedAt: string;
  history: LostFoundEventHistory[];
}

export interface LostFoundQueryFilters {
  search?: string;
  category?: string;
  status?: string;
  roomNumber?: string;
  foundLocation?: string;
  page?: number;
  limit?: number;
}

export interface ILostFoundRepository {
  createItem(record: LostFoundRecord): Promise<LostFoundRecord>;
  getItemById(id: string): Promise<LostFoundRecord | null>;
  getItemByRef(ref: string): Promise<LostFoundRecord | null>;
  updateItem(id: string, updates: Partial<LostFoundRecord>): Promise<LostFoundRecord | null>;
  deleteItem(id: string): Promise<boolean>;
  getAllItems(filters?: LostFoundQueryFilters): Promise<{ items: LostFoundRecord[]; total: number }>;
  getIdempotencyRecord(key: string): Promise<LostFoundRecord | null>;
  setIdempotencyRecord(key: string, record: LostFoundRecord): Promise<void>;
  reset(): void;
}

export class InMemoryLostFoundRepository implements ILostFoundRepository {
  private static instance: InMemoryLostFoundRepository;
  private items = new Map<string, LostFoundRecord>();
  private idempotencyCache = new Map<string, LostFoundRecord>();
  private refCounter = 100;

  constructor() {
    this.seedDefaultItems();
  }

  public static getInstance(): InMemoryLostFoundRepository {
    if (!InMemoryLostFoundRepository.instance) {
      InMemoryLostFoundRepository.instance = new InMemoryLostFoundRepository();
    }
    return InMemoryLostFoundRepository.instance;
  }

  private seedDefaultItems(): void {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    const item1: LostFoundRecord = {
      id: 'lf_seed_001',
      ref: 'LF-2026-001',
      propertyId: 'prop_grand_adp_01',
      itemName: 'AirPods Pro with White Wireless Case',
      category: 'electronics',
      description: 'Found under bedside nightstand in room after checkout.',
      foundLocation: 'Room 402',
      foundDate: today,
      foundTime: '11:15',
      roomNumber: '402',
      stayId: 'stay_seed_402',
      storageLocation: 'Front Desk Safe A (Bin 03)',
      sensitive: false,
      registeredByStaffId: 'staff_hk_01',
      registeredByStaffName: 'Sunita Patel',
      status: 'STORED',
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 86400000).toISOString(),
      history: [
        {
          status: 'FOUND',
          at: new Date(now - 86400000).toISOString(),
          staffId: 'staff_hk_01',
          staffName: 'Sunita Patel',
          note: 'Logged by Housekeeping attendant upon room inspection.',
        },
        {
          status: 'STORED',
          at: new Date(now - 86000000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Marcus Vance',
          note: 'Secured into Front Desk Safe A.',
        },
      ],
    };

    const item2: LostFoundRecord = {
      id: 'lf_seed_002',
      ref: 'LF-2026-002',
      propertyId: 'prop_grand_adp_01',
      itemName: 'Navy Montblanc Leather Wallet',
      category: 'jewelry_valuables',
      description: 'Contains debit card and driver license. Kept in security vault.',
      foundLocation: 'Lobby Lounge Sofa',
      foundDate: today,
      foundTime: '14:30',
      storageLocation: 'Security Safe 01',
      sensitive: true, // Sensitive item hides photo
      registeredByStaffId: 'staff_fd_01',
      registeredByStaffName: 'Marcus Vance',
      status: 'CLAIM_PENDING',
      claimantName: 'Marcus Chen',
      claimantContact: '+1 555-019-2834',
      claimantVerificationMethod: 'government_id',
      claimedAt: new Date(now - 3600000).toISOString(),
      claimNotes: 'Guest called Front Desk describing initial embossed on interior leather.',
      createdAt: new Date(now - 14400000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
      history: [
        {
          status: 'FOUND',
          at: new Date(now - 14400000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Marcus Vance',
          note: 'Found on velvet sofa in lobby lounge.',
        },
        {
          status: 'STORED',
          at: new Date(now - 14000000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Marcus Vance',
          note: 'Transferred to Security Safe 01.',
        },
        {
          status: 'CLAIM_PENDING',
          at: new Date(now - 3600000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Marcus Vance',
          note: 'Claim filed by Marcus Chen; pending ID verification at desk.',
        },
      ],
    };

    const item3: LostFoundRecord = {
      id: 'lf_seed_003',
      ref: 'LF-2026-003',
      propertyId: 'prop_grand_adp_01',
      itemName: 'Ray-Ban Wayfarer Polarized Sunglasses',
      category: 'personal_items',
      description: 'Tortoiseshell frame with polarized green lenses.',
      foundLocation: 'Lagoon Pool Deck Cabana 4',
      foundDate: today,
      foundTime: '16:00',
      roomNumber: '205',
      storageLocation: 'Front Desk Drawer B',
      sensitive: false,
      registeredByStaffId: 'staff_fd_01',
      registeredByStaffName: 'Sunita Patel',
      status: 'RELEASED',
      claimantName: 'Vikram Malhotra',
      claimantContact: '+91 98765 33445',
      claimantVerificationMethod: 'room_verification',
      claimedAt: new Date(now - 7200000).toISOString(),
      releasedByStaffId: 'staff_fd_01',
      releasedByStaffName: 'Sunita Patel',
      releasedAt: new Date(now - 7000000).toISOString(),
      createdAt: new Date(now - 28800000).toISOString(),
      updatedAt: new Date(now - 7000000).toISOString(),
      history: [
        {
          status: 'FOUND',
          at: new Date(now - 28800000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Sunita Patel',
          note: 'Turned in by pool attendant.',
        },
        {
          status: 'STORED',
          at: new Date(now - 28000000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Sunita Patel',
          note: 'Stored at Front Desk.',
        },
        {
          status: 'RELEASED',
          at: new Date(now - 7000000).toISOString(),
          staffId: 'staff_fd_01',
          staffName: 'Sunita Patel',
          note: 'Returned to guest Vikram Malhotra after verifying room booking key.',
        },
      ],
    };

    this.items.set(item1.id, item1);
    this.items.set(item2.id, item2);
    this.items.set(item3.id, item3);
  }

  public async createItem(record: LostFoundRecord): Promise<LostFoundRecord> {
    this.items.set(record.id, { ...record });
    return { ...record };
  }

  public async getItemById(id: string): Promise<LostFoundRecord | null> {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  public async getItemByRef(ref: string): Promise<LostFoundRecord | null> {
    for (const item of this.items.values()) {
      if (item.ref === ref) return { ...item };
    }
    return null;
  }

  public async updateItem(id: string, updates: Partial<LostFoundRecord>): Promise<LostFoundRecord | null> {
    const item = this.items.get(id);
    if (!item) return null;

    const updated: LostFoundRecord = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return { ...updated };
  }

  public async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  public async getAllItems(filters?: LostFoundQueryFilters): Promise<{ items: LostFoundRecord[]; total: number }> {
    let list = Array.from(this.items.values());

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.ref.toLowerCase().includes(q) ||
          i.itemName.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.foundLocation.toLowerCase().includes(q) ||
          (i.roomNumber && i.roomNumber.toLowerCase().includes(q)),
      );
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((i) => i.category === filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((i) => i.status === filters.status);
    }

    if (filters?.roomNumber) {
      list = list.filter((i) => i.roomNumber === filters.roomNumber);
    }

    if (filters?.foundLocation) {
      const loc = filters.foundLocation.toLowerCase();
      list = list.filter((i) => i.foundLocation.toLowerCase().includes(loc));
    }

    // Sort descending by foundDate / createdAt
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems.map((item) => ({ ...item })),
      total,
    };
  }

  public async getIdempotencyRecord(key: string): Promise<LostFoundRecord | null> {
    const record = this.idempotencyCache.get(key);
    return record ? { ...record } : null;
  }

  public async setIdempotencyRecord(key: string, record: LostFoundRecord): Promise<void> {
    this.idempotencyCache.set(key, { ...record });
  }

  public reset(): void {
    this.items.clear();
    this.idempotencyCache.clear();
    this.refCounter = 100;
    this.seedDefaultItems();
  }
}

export function getLostFoundRepository(): ILostFoundRepository {
  return InMemoryLostFoundRepository.getInstance();
}
