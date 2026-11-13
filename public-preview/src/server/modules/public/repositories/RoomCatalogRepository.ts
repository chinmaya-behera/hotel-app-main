export interface PublicRoomUnit {
  roomId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  title: string;
  description: string;
  maxGuests: number;
  basePricePerNight: number;
  currency: string;
  amenities: string[];
  images: string[];
}

export interface AvailabilityQuery {
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  guests?: number;
  roomType?: string;
}

export interface IRoomCatalogRepository {
  getAllRooms(): Promise<PublicRoomUnit[]>;
  getRoomById(roomId: string): Promise<PublicRoomUnit | null>;
  getRoomByNumber(roomNumber: string): Promise<PublicRoomUnit | null>;
}

export interface BookingInterval {
  stayId: string;
  roomId: string;
  roomNumber: string;
  bookingReference: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  welcomeTvPin: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
}

export interface IBookingRepository {
  isRoomAvailable(roomId: string, checkIn: Date, checkOut: Date): Promise<boolean>;
  createBooking(booking: BookingInterval): Promise<BookingInterval>;
  getBookingByReference(bookingReference: string): Promise<BookingInterval | null>;
  getBookingsForRoom(roomId: string): Promise<BookingInterval[]>;
}

/**
 * Deterministic standard room catalog (27 rooms matching hotelCatalog.ts)
 */
const SEED_CATALOG: PublicRoomUnit[] = [
  {
    roomId: 'room_id_101',
    roomNumber: '101',
    floor: 1,
    roomType: 'Deluxe Twin',
    title: 'Garden View Deluxe Twin',
    description: 'Ground-floor room with private garden terrace and twin plush beds.',
    maxGuests: 2,
    basePricePerNight: 240,
    currency: 'USD',
    amenities: ['Terrace', 'High-Speed Wi-Fi', 'Rain Shower', 'Espresso Machine'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_102',
    roomNumber: '102',
    floor: 1,
    roomType: 'Deluxe Twin',
    title: 'Garden Courtyard Deluxe Twin',
    description: 'Quiet ground-floor twin room opening to the garden courtyard.',
    maxGuests: 2,
    basePricePerNight: 240,
    currency: 'USD',
    amenities: ['High-Speed Wi-Fi', 'Rain Shower', 'Garden View'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_201',
    roomNumber: '201',
    floor: 2,
    roomType: 'Deluxe King',
    title: 'Pool View Deluxe King',
    description: 'Spacious king bedroom with floor-to-ceiling windows overlooking the lagoon pool.',
    maxGuests: 2,
    basePricePerNight: 270,
    currency: 'USD',
    amenities: ['Pool View', 'Balcony', 'King Bed', 'Marble Bath', 'Smart TV'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_202',
    roomNumber: '202',
    floor: 2,
    roomType: 'Deluxe King',
    title: 'Lagoon Deluxe King',
    description: 'Mid-floor king room overlooking the serene lagoon pool.',
    maxGuests: 2,
    basePricePerNight: 270,
    currency: 'USD',
    amenities: ['Pool View', 'Balcony', 'King Bed', 'Rain Shower'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_203',
    roomNumber: '203',
    floor: 2,
    roomType: 'Deluxe King',
    title: 'Sun terrace Deluxe King',
    description: 'Corner second-floor king bedroom with private sun terrace.',
    maxGuests: 2,
    basePricePerNight: 275,
    currency: 'USD',
    amenities: ['Balcony', 'King Bed', 'Marble Bath'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_205',
    roomNumber: '205',
    floor: 2,
    roomType: 'Deluxe King',
    title: 'Executive Poolside King',
    description: 'Plush poolside room with direct access to pool deck.',
    maxGuests: 2,
    basePricePerNight: 280,
    currency: 'USD',
    amenities: ['Pool Access', 'Smart TV', 'King Bed'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_301',
    roomNumber: '301',
    floor: 3,
    roomType: 'Deluxe Twin',
    title: 'City View Deluxe Twin',
    description: 'Third-floor twin room with city views.',
    maxGuests: 2,
    basePricePerNight: 245,
    currency: 'USD',
    amenities: ['City View', 'Twin Beds', 'High-Speed Wi-Fi'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_302',
    roomNumber: '302',
    floor: 3,
    roomType: 'Deluxe Twin',
    title: 'City View Deluxe Twin (Maintenance)',
    description: 'Third-floor twin room currently offline for maintenance.',
    maxGuests: 2,
    basePricePerNight: 245,
    currency: 'USD',
    amenities: ['City View', 'Twin Beds'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_303',
    roomNumber: '303',
    floor: 3,
    roomType: 'Deluxe King',
    title: 'Atrium Deluxe King',
    description: 'Quiet room facing the indoor garden atrium.',
    maxGuests: 2,
    basePricePerNight: 260,
    currency: 'USD',
    amenities: ['Atrium View', 'King Bed', 'Rain Shower'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_401',
    roomNumber: '401',
    floor: 4,
    roomType: 'Deluxe King',
    title: 'Skyline View Deluxe King',
    description: 'High-floor room with panoramic city view.',
    maxGuests: 2,
    basePricePerNight: 280,
    currency: 'USD',
    amenities: ['Skyline View', 'King Bed', 'Marble Bath'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_402',
    roomNumber: '402',
    floor: 4,
    roomType: 'Deluxe Suite',
    title: 'Skyline Deluxe Suite',
    description: 'Corner luxury suite featuring separate living lounge, deep soaking tub and skyline views.',
    maxGuests: 3,
    basePricePerNight: 295,
    currency: 'USD',
    amenities: ['City Skyline View', 'Separate Living Room', 'Soaking Tub', 'Minibar', 'Butler Call'],
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_403',
    roomNumber: '403',
    floor: 4,
    roomType: 'Deluxe King',
    title: 'Corner Skyline Deluxe King',
    description: 'Corner room with wrap-around floor-to-ceiling windows.',
    maxGuests: 2,
    basePricePerNight: 285,
    currency: 'USD',
    amenities: ['Corner View', 'Wrap-around Windows', 'King Bed'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_505',
    roomNumber: '505',
    floor: 5,
    roomType: 'Club Suite',
    title: 'Executive Club Suite',
    description: 'High-floor club suite with complimentary executive lounge access and evening cocktails.',
    maxGuests: 3,
    basePricePerNight: 350,
    currency: 'USD',
    amenities: ['Club Lounge Access', 'Complimentary Cocktails', 'Work Desk', 'Panoramic View'],
    images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_601',
    roomNumber: '601',
    floor: 6,
    roomType: 'Presidential Suite',
    title: 'The Grand Presidential Suite',
    description: 'Top-tier master suite with dining for 8, private pantry, dual balconies and master spa bath.',
    maxGuests: 4,
    basePricePerNight: 700,
    currency: 'USD',
    amenities: ['Private Dining Table', 'Private Pantry', 'Dual Balconies', 'Jacuzzi', '24/7 Butler Service'],
    images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'],
  },
  {
    roomId: 'room_id_701',
    roomNumber: '701',
    floor: 7,
    roomType: 'Executive King',
    title: 'Penthouse Executive King',
    description: 'Seventh-floor executive king bedroom with top-floor terrace.',
    maxGuests: 2,
    basePricePerNight: 400,
    currency: 'USD',
    amenities: ['Penthouse Terrace', 'Executive Lounge', 'King Bed'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
];

/**
 * In-Memory Room Catalog Repository
 */
export class InMemoryRoomCatalogRepository implements IRoomCatalogRepository {
  private static instance: InMemoryRoomCatalogRepository;

  public static getInstance(): InMemoryRoomCatalogRepository {
    if (!InMemoryRoomCatalogRepository.instance) {
      InMemoryRoomCatalogRepository.instance = new InMemoryRoomCatalogRepository();
    }
    return InMemoryRoomCatalogRepository.instance;
  }

  public async getAllRooms(): Promise<PublicRoomUnit[]> {
    return JSON.parse(JSON.stringify(SEED_CATALOG));
  }

  public async getRoomById(roomId: string): Promise<PublicRoomUnit | null> {
    const room = SEED_CATALOG.find((r) => r.roomId === roomId);
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }

  public async getRoomByNumber(roomNumber: string): Promise<PublicRoomUnit | null> {
    const room = SEED_CATALOG.find((r) => r.roomNumber === roomNumber);
    return room ? JSON.parse(JSON.stringify(room)) : null;
  }
}

/**
 * In-Memory Booking & Availability Repository
 */
export class InMemoryBookingRepository implements IBookingRepository {
  private static instance: InMemoryBookingRepository;
  private bookings: BookingInterval[] = [];

  constructor() {
    this.seedDefaultBookings();
  }

  public static getInstance(): InMemoryBookingRepository {
    if (!InMemoryBookingRepository.instance) {
      InMemoryBookingRepository.instance = new InMemoryBookingRepository();
    }
    return InMemoryBookingRepository.instance;
  }

  private seedDefaultBookings(): void {
    const now = new Date();
    // Seed in-house stay for Room 402: checked in yesterday, checks out in 2 days
    const checkIn402 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const checkOut402 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    this.bookings = [
      {
        stayId: 'stay_seed_402',
        roomId: 'room_id_402',
        roomNumber: '402',
        bookingReference: 'BK-7892-0402',
        guestFirstName: 'Aarav',
        guestLastName: 'Sharma',
        guestEmail: 'aarav.sharma@example.com',
        guestPhone: '+91 98765 43210',
        welcomeTvPin: '4829',
        checkInDate: checkIn402,
        checkOutDate: checkOut402,
        status: 'checked_in',
        totalAmount: 590,
        createdAt: checkIn402,
      },
    ];
  }

  /**
   * Checks whether a room is free between checkIn and checkOut.
   * Overlap rule: (existingCheckIn < requestedCheckOut) AND (existingCheckOut > requestedCheckIn)
   * If any active reservation matches this condition, the room is NOT available.
   */
  public async isRoomAvailable(roomId: string, checkIn: Date, checkOut: Date): Promise<boolean> {
    const conflict = this.bookings.find((b) => {
      if (b.roomId !== roomId) return false;
      if (b.status === 'cancelled' || b.status === 'checked_out') return false;

      // Overlap condition
      return b.checkInDate < checkOut && b.checkOutDate > checkIn;
    });

    return !conflict;
  }

  public async createBooking(booking: BookingInterval): Promise<BookingInterval> {
    // Re-verify availability to prevent race conditions
    const available = await this.isRoomAvailable(booking.roomId, booking.checkInDate, booking.checkOutDate);
    if (!available) {
      throw new Error('OVERLAPPING_RESERVATION: The room is already booked for the requested dates.');
    }

    this.bookings.push({ ...booking });
    return { ...booking };
  }

  public async getBookingByReference(bookingReference: string): Promise<BookingInterval | null> {
    const found = this.bookings.find((b) => b.bookingReference.toUpperCase() === bookingReference.trim().toUpperCase());
    return found ? { ...found } : null;
  }

  public async getBookingsForRoom(roomId: string): Promise<BookingInterval[]> {
    return this.bookings
      .filter((b) => b.roomId === roomId && b.status !== 'cancelled')
      .map((b) => ({ ...b }));
  }

  public reset(): void {
    this.bookings = [];
    this.seedDefaultBookings();
  }
}

export function getRoomCatalogRepository(): IRoomCatalogRepository {
  return InMemoryRoomCatalogRepository.getInstance();
}

export function getBookingRepository(): IBookingRepository {
  return InMemoryBookingRepository.getInstance();
}

