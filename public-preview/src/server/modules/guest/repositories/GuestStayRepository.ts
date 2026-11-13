import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/index.ts';
import {
  stayContextTable,
  roomAssignmentTable,
  type StayContext,
  type RoomAssignment,
} from '../../../db/schema/03_finance.ts';

export interface StayWithRoomDetails {
  stay: StayContext;
  currentRoom: RoomAssignment;
}

/**
 * Interface decoupling the Guest Stay service from the database driver.
 * Supports deterministic in-memory execution during Sprint 0 and seamless Drizzle PostgreSQL integration.
 */
export interface IGuestStayRepository {
  getStayWithRoomById(stayId: string): Promise<StayWithRoomDetails | null>;
  getStayWithRoomByRoomNumber(roomNumber: string): Promise<StayWithRoomDetails | null>;
  updateRoomDnd(stayId: string, dndActive: boolean): Promise<boolean>;
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
    };
  }

  public async updateRoomDnd(stayId: string, dndActive: boolean): Promise<boolean> {
    const currentRoom = Array.from(this.rooms.values()).find(
      (r) => r.stayId === stayId && r.isCurrent,
    );
    if (!currentRoom) return false;
    currentRoom.dndActive = dndActive;
    return true;
  }

  // Test helpers
  public registerStay(stay: StayContext, room: RoomAssignment): void {
    this.stays.set(stay.id, stay);
    this.rooms.set(room.id, room);
  }

  public reset(): void {
    this.stays.clear();
    this.rooms.clear();
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
}

/**
 * Repository Factory
 */
export function getGuestStayRepository(): IGuestStayRepository {
  // If production with configured PostgreSQL, use Drizzle
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.startsWith('postgresql://')
  ) {
    return new DrizzleGuestStayRepository();
  }

  // Default to in-memory adapter for development and testing
  return InMemoryGuestStayRepository.getInstance();
}
