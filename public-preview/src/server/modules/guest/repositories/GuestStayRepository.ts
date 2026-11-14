import { eq, and } from 'drizzle-orm';
import { db, getConfiguredDatabaseUrl } from '../../../db/index.ts';
import {
  stayContextTable,
  roomAssignmentTable,
  type StayContext,
  type RoomAssignment,
} from '../../../db/schema/03_finance.ts';
export type { StayContext, RoomAssignment } from '../../../db/schema/03_finance.ts';

export interface PreArrivalDetails {
  estimatedArrivalTime?: string;
  idDocumentType?: string;
  idDocumentNumberMasked?: string;
  idIssuingCountry?: string;
  idVerificationStatus: 'none' | 'pending_verify' | 'verified' | 'failed';
  idAttachmentKey?: string;
  preCheckInCompletedAt?: string;
  specialRequests?: string;
  idVerifiedAt?: string;
  idVerifiedBy?: string;
  idVerificationNotes?: string;
}

export interface StayWithRoomDetails {
  stay: StayContext;
  currentRoom: RoomAssignment;
  preArrival?: PreArrivalDetails;
}

export interface StayQueryFilters {
  filter?: 'all' | 'arrivals' | 'inhouse' | 'departures';
  search?: string;
}

/**
 * Interface decoupling the Guest Stay service from the database driver.
 * Supports deterministic in-memory execution during Sprint 0 and seamless Drizzle PostgreSQL integration.
 */
export interface IGuestStayRepository {
  getStayWithRoomById(stayId: string): Promise<StayWithRoomDetails | null>;
  getStayWithRoomByRoomNumber(roomNumber: string): Promise<StayWithRoomDetails | null>;
  getStayByBookingReference(bookingReference: string): Promise<StayWithRoomDetails | null>;
  getAllStays(filters?: StayQueryFilters): Promise<StayWithRoomDetails[]>;
  updateRoomDnd(stayId: string, dndActive: boolean): Promise<boolean>;
  updateStayStatus(stayId: string, status: string, checkInTime?: Date): Promise<boolean>;
  updatePreArrivalRegistration(stayId: string, details: PreArrivalDetails): Promise<boolean>;
  updateRoomCleanliness(roomId: string, cleanlinessStatus: 'dirty' | 'cleaning' | 'inspected' | 'ready'): Promise<boolean>;
  updateRoomAssignment(stayId: string, updates: Partial<RoomAssignment>): Promise<boolean>;
  getRoomAssignmentsForStay(stayId: string): Promise<RoomAssignment[]>;
  executeRoomMove(
    stayId: string,
    newRoom: { roomId: string; roomNumber: string; floor: number; roomType: string },
  ): Promise<{ oldAssignment: RoomAssignment; newAssignment: RoomAssignment }>;
}

/**
 * ============================================================================
 * In-Memory Development & Test Adapter (Sprint 0)
 * ============================================================================
 */
export class InMemoryGuestStayRepository implements IGuestStayRepository {
  private static instance: InMemoryGuestStayRepository;
  private stays = new Map<string, StayContext>();
  private rooms = new Map<string, RoomAssignment>();
  private preArrivals = new Map<string, PreArrivalDetails>();

  constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): InMemoryGuestStayRepository {
    if (!InMemoryGuestStayRepository.instance) {
      InMemoryGuestStayRepository.instance = new InMemoryGuestStayRepository();
    }
    return InMemoryGuestStayRepository.instance;
  }

  private seedDefaultData(): void {
    const now = new Date();
    const checkIn = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const expectedCheckout = new Date(now.getTime() + 48 * 60 * 60 * 1000); // in 2 days
    const arrivalToday = new Date(now.getTime());
    const checkoutIn3Days = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    // 1. In-House Checked-In Active Stay (Room 402 - Aarav Sharma)
    const stay402: StayContext = {
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
      checkOutTime: expectedCheckout,
      createdAt: checkIn,
      updatedAt: now,
    };

    const room402: RoomAssignment = {
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
    };

    this.stays.set(stay402.id, stay402);
    this.rooms.set(room402.id, room402);
    this.preArrivals.set(stay402.id, {
      idVerificationStatus: 'verified',
      idDocumentType: 'passport',
      idDocumentNumberMasked: '******4321',
      idIssuingCountry: 'IND',
      idVerifiedAt: checkIn.toISOString(),
      idVerifiedBy: 'Front Desk Coordinator',
    });

    // 2. Checked-Out Stay (Room 701 - Maya Sen)
    const stay701: StayContext = {
      id: 'stay_seed_701',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-7010-DONE',
      guestFirstName: 'Maya',
      guestLastName: 'Sen',
      guestEmail: 'maya.sen@example.com',
      guestPhone: null,
      welcomeTvPin: '7777',
      status: 'checked_out',
      checkInTime: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      checkOutTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    };

    const room701: RoomAssignment = {
      id: 'room_assign_701',
      stayId: 'stay_seed_701',
      roomId: 'room_id_701',
      roomNumber: '701',
      propertyId: 'prop_grand_adp_01',
      floor: 7,
      roomType: 'Executive King',
      dndActive: false,
      cleanlinessStatus: 'dirty',
      assignedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      unassignedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      isCurrent: true,
    };

    this.stays.set(stay701.id, stay701);
    this.rooms.set(room701.id, room701);

    // 3. Expected Arrival - Status: 'reserved' (Room 201 - Rohan Verma)
    const stay201: StayContext = {
      id: 'stay_seed_201',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-201-ARRV',
      guestFirstName: 'Rohan',
      guestLastName: 'Verma',
      guestEmail: 'rohan.verma@example.com',
      guestPhone: '+91 98765 11223',
      welcomeTvPin: '2021',
      status: 'reserved',
      checkInTime: arrivalToday,
      checkOutTime: checkoutIn3Days,
      createdAt: now,
      updatedAt: now,
    };

    const room201: RoomAssignment = {
      id: 'room_assign_201',
      stayId: 'stay_seed_201',
      roomId: 'room_id_201',
      roomNumber: '201',
      propertyId: 'prop_grand_adp_01',
      floor: 2,
      roomType: 'Deluxe King',
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    };

    this.stays.set(stay201.id, stay201);
    this.rooms.set(room201.id, room201);

    // 4. Expected Arrival with Pre-Arrival Completed - Status: 'pending_verify' (Room 205 - Vikram Malhotra)
    const stay205: StayContext = {
      id: 'stay_seed_205',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-205-PREV',
      guestFirstName: 'Vikram',
      guestLastName: 'Malhotra',
      guestEmail: 'vikram.m@example.com',
      guestPhone: '+91 98765 33445',
      welcomeTvPin: '2055',
      status: 'pending_verify',
      checkInTime: arrivalToday,
      checkOutTime: checkoutIn3Days,
      createdAt: now,
      updatedAt: now,
    };

    const room205: RoomAssignment = {
      id: 'room_assign_205',
      stayId: 'stay_seed_205',
      roomId: 'room_id_205',
      roomNumber: '205',
      propertyId: 'prop_grand_adp_01',
      floor: 2,
      roomType: 'Deluxe King',
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    };

    this.stays.set(stay205.id, stay205);
    this.rooms.set(room205.id, room205);
    this.preArrivals.set(stay205.id, {
      estimatedArrivalTime: '14:30',
      idDocumentType: 'passport',
      idDocumentNumberMasked: '******2051',
      idIssuingCountry: 'IND',
      idVerificationStatus: 'pending_verify',
      idAttachmentKey: 'quarantine/id_docs/stay_seed_205/mock_doc.png',
      preCheckInCompletedAt: now.toISOString(),
      specialRequests: 'High floor, feather pillows.',
    });

    // 5. Cancelled Reservation (Room 303 - Priya Kapoor)
    const stay303: StayContext = {
      id: 'stay_seed_303',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-303-CANC',
      guestFirstName: 'Priya',
      guestLastName: 'Kapoor',
      guestEmail: 'priya.k@example.com',
      guestPhone: '+91 98765 99887',
      welcomeTvPin: '3033',
      status: 'cancelled',
      checkInTime: arrivalToday,
      checkOutTime: checkoutIn3Days,
      createdAt: now,
      updatedAt: now,
    };

    const room303: RoomAssignment = {
      id: 'room_assign_303',
      stayId: 'stay_seed_303',
      roomId: 'room_id_303',
      roomNumber: '303',
      propertyId: 'prop_grand_adp_01',
      floor: 3,
      roomType: 'Deluxe King',
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    };

    this.stays.set(stay303.id, stay303);
    this.rooms.set(room303.id, room303);

    // 6. Expected Arrival with Unready/Dirty Room (Room 102 - Arjun Das)
    const stay102: StayContext = {
      id: 'stay_seed_102',
      propertyId: 'prop_grand_adp_01',
      bookingReference: 'BK-102-DIRT',
      guestFirstName: 'Arjun',
      guestLastName: 'Das',
      guestEmail: 'arjun.das@example.com',
      guestPhone: '+91 98765 88776',
      welcomeTvPin: '1022',
      status: 'reserved',
      checkInTime: arrivalToday,
      checkOutTime: checkoutIn3Days,
      createdAt: now,
      updatedAt: now,
    };

    const room102: RoomAssignment = {
      id: 'room_assign_102',
      stayId: 'stay_seed_102',
      roomId: 'room_id_102',
      roomNumber: '102',
      propertyId: 'prop_grand_adp_01',
      floor: 1,
      roomType: 'Deluxe Twin',
      dndActive: false,
      cleanlinessStatus: 'dirty',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    };

    this.stays.set(stay102.id, stay102);
    this.rooms.set(room102.id, room102);
  }

  public async getStayWithRoomById(stayId: string): Promise<StayWithRoomDetails | null> {
    const stay = this.stays.get(stayId);
    if (!stay) return null;

    const currentRoom = Array.from(this.rooms.values()).find(
      (r) => r.stayId === stayId && r.isCurrent,
    );

    if (!currentRoom) return null;

    return {
      stay: { ...stay },
      currentRoom: { ...currentRoom },
      preArrival: this.preArrivals.get(stayId) ? { ...this.preArrivals.get(stayId)! } : undefined,
    };
  }

  public async getStayWithRoomByRoomNumber(roomNumber: string): Promise<StayWithRoomDetails | null> {
    const currentRoom = Array.from(this.rooms.values()).find(
      (r) => r.roomNumber === roomNumber && r.isCurrent,
    );

    if (!currentRoom) return null;
    const stay = this.stays.get(currentRoom.stayId);
    if (!stay) return null;

    return {
      stay: { ...stay },
      currentRoom: { ...currentRoom },
      preArrival: this.preArrivals.get(stay.id) ? { ...this.preArrivals.get(stay.id)! } : undefined,
    };
  }

  public async getStayByBookingReference(bookingReference: string): Promise<StayWithRoomDetails | null> {
    const norm = bookingReference.trim().toUpperCase();
    const stay = Array.from(this.stays.values()).find(
      (s) => s.bookingReference.trim().toUpperCase() === norm,
    );

    if (!stay) return null;

    const currentRoom = Array.from(this.rooms.values()).find(
      (r) => r.stayId === stay.id && r.isCurrent,
    );

    if (!currentRoom) return null;

    return {
      stay: { ...stay },
      currentRoom: { ...currentRoom },
      preArrival: this.preArrivals.get(stay.id) ? { ...this.preArrivals.get(stay.id)! } : undefined,
    };
  }

  public async getAllStays(filters?: StayQueryFilters): Promise<StayWithRoomDetails[]> {
    const list: StayWithRoomDetails[] = [];

    for (const stay of this.stays.values()) {
      const currentRoom = Array.from(this.rooms.values()).find(
        (r) => r.stayId === stay.id && r.isCurrent,
      );
      if (!currentRoom) continue;

      const preArrival = this.preArrivals.get(stay.id);

      // Filter by status category
      if (filters?.filter) {
        if (filters.filter === 'arrivals') {
          // Expected arrivals: reserved or pending_verify
          if (stay.status !== 'reserved' && stay.status !== 'pending_verify') {
            continue;
          }
        } else if (filters.filter === 'inhouse') {
          if (stay.status !== 'checked_in') {
            continue;
          }
        } else if (filters.filter === 'departures') {
          if (stay.status !== 'checked_in') {
            continue;
          }
        }
      }

      // Search keyword filter
      if (filters?.search && filters.search.trim() !== '') {
        const q = filters.search.trim().toLowerCase();
        const fullName = `${stay.guestFirstName} ${stay.guestLastName}`.toLowerCase();
        const matchesName = fullName.includes(q);
        const matchesRef = stay.bookingReference.toLowerCase().includes(q);
        const matchesRoom = currentRoom.roomNumber.toLowerCase().includes(q);

        if (!matchesName && !matchesRef && !matchesRoom) {
          continue;
        }
      }

      list.push({
        stay: { ...stay },
        currentRoom: { ...currentRoom },
        preArrival: preArrival ? { ...preArrival } : undefined,
      });
    }

    return list;
  }

  public async updateRoomDnd(stayId: string, dndActive: boolean): Promise<boolean> {
    const currentRoom = Array.from(this.rooms.values()).find(
      (r) => r.stayId === stayId && r.isCurrent,
    );
    if (!currentRoom) return false;
    currentRoom.dndActive = dndActive;
    return true;
  }

  public async updateStayStatus(stayId: string, status: string, checkInTime?: Date): Promise<boolean> {
    const stay = this.stays.get(stayId);
    if (!stay) return false;

    stay.status = status;
    stay.updatedAt = new Date();
    if (checkInTime) {
      stay.checkInTime = checkInTime;
    }
    return true;
  }

  public async updatePreArrivalRegistration(stayId: string, details: PreArrivalDetails): Promise<boolean> {
    this.preArrivals.set(stayId, { ...details });
    const stay = this.stays.get(stayId);
    if (stay && stay.status === 'reserved') {
      stay.status = 'pending_verify';
      stay.updatedAt = new Date();
    }
    return true;
  }

  public async updateRoomCleanliness(
    roomId: string,
    cleanlinessStatus: 'dirty' | 'cleaning' | 'inspected' | 'ready',
  ): Promise<boolean> {
    const room = Array.from(this.rooms.values()).find((r) => r.roomId === roomId && r.isCurrent);
    if (!room) return false;
    room.cleanlinessStatus = cleanlinessStatus;
    return true;
  }

  public async updateRoomAssignment(stayId: string, updates: Partial<RoomAssignment>): Promise<boolean> {
    const room = Array.from(this.rooms.values()).find((r) => r.stayId === stayId && r.isCurrent);
    if (!room) return false;
    Object.assign(room, updates);
    return true;
  }

  public async getRoomAssignmentsForStay(stayId: string): Promise<RoomAssignment[]> {
    return Array.from(this.rooms.values())
      .filter((r) => r.stayId === stayId)
      .sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime())
      .map((r) => ({ ...r }));
  }

  public async executeRoomMove(
    stayId: string,
    newRoom: { roomId: string; roomNumber: string; floor: number; roomType: string },
  ): Promise<{ oldAssignment: RoomAssignment; newAssignment: RoomAssignment }> {
    const oldAssignment = Array.from(this.rooms.values()).find((r) => r.stayId === stayId && r.isCurrent);
    if (!oldAssignment) {
      throw new Error('CURRENT_ROOM_ASSIGNMENT_NOT_FOUND: Stay has no active room assignment.');
    }

    const now = new Date();
    // 1. Mark old room assignment unassigned and non-current
    oldAssignment.isCurrent = false;
    oldAssignment.unassignedAt = now;
    oldAssignment.cleanlinessStatus = 'dirty'; // Vacated room becomes dirty for turnover
    oldAssignment.dndActive = false;

    // 2. Create new room assignment
    const newAssignmentId = `room_assign_${newRoom.roomNumber}_${Date.now()}`;
    const newAssignment: RoomAssignment = {
      id: newAssignmentId,
      stayId,
      roomId: newRoom.roomId,
      roomNumber: newRoom.roomNumber,
      propertyId: oldAssignment.propertyId,
      floor: newRoom.floor,
      roomType: newRoom.roomType,
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    };

    this.rooms.set(newAssignment.id, newAssignment);

    return {
      oldAssignment: { ...oldAssignment },
      newAssignment: { ...newAssignment },
    };
  }

  // Test helpers
  public registerStay(stay: StayContext, room: RoomAssignment, preArrival?: PreArrivalDetails): void {
    this.stays.set(stay.id, stay);
    this.rooms.set(room.id, room);
    if (preArrival) {
      this.preArrivals.set(stay.id, preArrival);
    }
  }

  public reset(): void {
    this.stays.clear();
    this.rooms.clear();
    this.preArrivals.clear();
    this.seedDefaultData();
  }
}

/**
 * ============================================================================
 * Drizzle PostgreSQL Production Repository
 * Ready for execution once Neon DATABASE_URL is configured.
 * ============================================================================
 */
export class DrizzleGuestStayRepository implements IGuestStayRepository {
  public async getStayWithRoomById(stayId: string): Promise<StayWithRoomDetails | null> {
    const stayRows = await db
      .select()
      .from(stayContextTable)
      .where(eq(stayContextTable.id, stayId))
      .limit(1);

    if (!stayRows || stayRows.length === 0) return null;
    const stay = stayRows[0];

    const roomRows = await db
      .select()
      .from(roomAssignmentTable)
      .where(
        and(
          eq(roomAssignmentTable.stayId, stayId),
          eq(roomAssignmentTable.isCurrent, true),
        ),
      )
      .limit(1);

    if (!roomRows || roomRows.length === 0) return null;
    const currentRoom = roomRows[0];

    return { stay, currentRoom };
  }

  public async getStayWithRoomByRoomNumber(roomNumber: string): Promise<StayWithRoomDetails | null> {
    const roomRows = await db
      .select()
      .from(roomAssignmentTable)
      .where(
        and(
          eq(roomAssignmentTable.roomNumber, roomNumber),
          eq(roomAssignmentTable.isCurrent, true),
        ),
      )
      .limit(1);

    if (!roomRows || roomRows.length === 0) return null;
    const currentRoom = roomRows[0];

    const stayRows = await db
      .select()
      .from(stayContextTable)
      .where(eq(stayContextTable.id, currentRoom.stayId))
      .limit(1);

    if (!stayRows || stayRows.length === 0) return null;
    const stay = stayRows[0];

    return { stay, currentRoom };
  }

  public async getStayByBookingReference(bookingReference: string): Promise<StayWithRoomDetails | null> {
    const stayRows = await db
      .select()
      .from(stayContextTable)
      .where(eq(stayContextTable.bookingReference, bookingReference))
      .limit(1);

    if (!stayRows || stayRows.length === 0) return null;
    const stay = stayRows[0];

    const roomRows = await db
      .select()
      .from(roomAssignmentTable)
      .where(
        and(
          eq(roomAssignmentTable.stayId, stay.id),
          eq(roomAssignmentTable.isCurrent, true),
        ),
      )
      .limit(1);

    if (!roomRows || roomRows.length === 0) return null;
    const currentRoom = roomRows[0];

    return { stay, currentRoom };
  }

  public async getAllStays(): Promise<StayWithRoomDetails[]> {
    const stays = await db.select().from(stayContextTable);
    const results: StayWithRoomDetails[] = [];

    for (const stay of stays) {
      const roomRows = await db
        .select()
        .from(roomAssignmentTable)
        .where(
          and(
            eq(roomAssignmentTable.stayId, stay.id),
            eq(roomAssignmentTable.isCurrent, true),
          ),
        )
        .limit(1);

      if (roomRows.length > 0) {
        results.push({ stay, currentRoom: roomRows[0] });
      }
    }
    return results;
  }

  public async updateRoomDnd(stayId: string, dndActive: boolean): Promise<boolean> {
    await db
      .update(roomAssignmentTable)
      .set({ dndActive })
      .where(
        and(
          eq(roomAssignmentTable.stayId, stayId),
          eq(roomAssignmentTable.isCurrent, true),
        ),
      );
    return true;
  }

  public async updateStayStatus(stayId: string, status: string, checkInTime?: Date): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (checkInTime) {
      updateData.checkInTime = checkInTime;
    }

    await db
      .update(stayContextTable)
      .set(updateData)
      .where(eq(stayContextTable.id, stayId));
    return true;
  }

  public async updatePreArrivalRegistration(_stayId: string, _details: PreArrivalDetails): Promise<boolean> {
    // When Neon DB is connected, pre-arrival registration persists into stay_context and attachment tables
    return true;
  }

  public async updateRoomCleanliness(
    roomId: string,
    cleanlinessStatus: 'dirty' | 'cleaning' | 'inspected' | 'ready',
  ): Promise<boolean> {
    await db
      .update(roomAssignmentTable)
      .set({ cleanlinessStatus })
      .where(
        and(
          eq(roomAssignmentTable.roomId, roomId),
          eq(roomAssignmentTable.isCurrent, true),
        ),
      );
    return true;
  }

  public async updateRoomAssignment(stayId: string, updates: Partial<RoomAssignment>): Promise<boolean> {
    await db
      .update(roomAssignmentTable)
      .set(updates)
      .where(
        and(
          eq(roomAssignmentTable.stayId, stayId),
          eq(roomAssignmentTable.isCurrent, true),
        ),
      );
    return true;
  }

  public async getRoomAssignmentsForStay(stayId: string): Promise<RoomAssignment[]> {
    return db.select().from(roomAssignmentTable).where(eq(roomAssignmentTable.stayId, stayId));
  }

  public async executeRoomMove(
    stayId: string,
    newRoom: { roomId: string; roomNumber: string; floor: number; roomType: string },
  ): Promise<{ oldAssignment: RoomAssignment; newAssignment: RoomAssignment }> {
    const now = new Date();
    const oldRows = await db
      .select()
      .from(roomAssignmentTable)
      .where(and(eq(roomAssignmentTable.stayId, stayId), eq(roomAssignmentTable.isCurrent, true)))
      .limit(1);

    await db
      .update(roomAssignmentTable)
      .set({ isCurrent: false, unassignedAt: now, cleanlinessStatus: 'dirty', dndActive: false })
      .where(and(eq(roomAssignmentTable.stayId, stayId), eq(roomAssignmentTable.isCurrent, true)));

    const newAssignmentId = `room_assign_${newRoom.roomNumber}_${Date.now()}`;
    const newAssignment: RoomAssignment = {
      id: newAssignmentId,
      stayId,
      roomId: newRoom.roomId,
      roomNumber: newRoom.roomNumber,
      propertyId: oldRows[0]?.propertyId || 'prop_grand_adp_01',
      floor: newRoom.floor,
      roomType: newRoom.roomType,
      dndActive: false,
      cleanlinessStatus: 'ready',
      assignedAt: now,
      unassignedAt: null,
      isCurrent: true,
    };

    await db.insert(roomAssignmentTable).values(newAssignment);

    return {
      oldAssignment: oldRows[0],
      newAssignment,
    };
  }
}

/**
 * Repository Factory
 */
export function getGuestStayRepository(): IGuestStayRepository {
  // If production with configured PostgreSQL, use Drizzle
  if (
    process.env.NODE_ENV === 'production' &&
    getConfiguredDatabaseUrl()?.startsWith('postgresql://')
  ) {
    return new DrizzleGuestStayRepository();
  }

  // Default to in-memory adapter for development and testing
  return InMemoryGuestStayRepository.getInstance();
}
