/**
 * Sample hotel dataset for the public website (FRONTEND ONLY, DEMO DATA).
 *
 * The project documents do not contain a real room inventory, so this catalog is a clearly labelled
 * sample. It deliberately reuses what the demo already knows:
 *  - the 27 room numbers in the Front Desk inventory (src/lib/mockData.ts), so availability and
 *    readiness come from the same shared store the staff screens use;
 *  - room-type names that appear in the seeded stays (Deluxe Twin, Deluxe King, Suite, Presidential Suite);
 *  - nightly rates implied by the seeded folios (Deluxe King $270, Suite $295, Presidential Suite $700).
 * Everything else (Standard Queen, Accessible King, views, areas, extras, tax rate) is a demo example, not a hotel fact.
 */
import {
  Accessibility,
  Bath,
  Briefcase,
  Coffee,
  Crown,
  Droplets,
  ShieldCheck,
  Shirt,
  Sofa,
  Sun,
  Thermometer,
  Tv,
  UtensilsCrossed,
  Wifi,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import type { BookingPricing } from '../types/demo.ts';

export const HOTEL_NAME = 'Atelier Hotel';
export const CATALOG_NOTE = 'Sample hotel dataset for the demo. Rooms, rates, views and features are illustrative, not real hotel facts.';

export const CHECK_IN_TIME = '14:00';
export const CHECK_OUT_TIME = '11:00';
/** Seeded folios show $22.50 per night (45 for 2 nights, 90 for 4 nights). */
export const RESORT_FEE_PER_NIGHT = 22.5;
/** Demo placeholder: the sources do not define a tax / service-charge rate. */
export const TAX_RATE = 0.11;
/** Matches the seeded early check-in request in the Front Desk data. */
export const EARLY_CHECKIN_FEE = 40;
export const MAX_NIGHTS = 14;

export type ViewKind = 'city' | 'pool' | 'garden' | 'skyline';
export const VIEW_LABEL: Record<ViewKind, string> = {
  city: 'City view',
  pool: 'Pool view',
  garden: 'Garden view',
  skyline: 'Skyline view',
};

export type SceneKind =
  | 'bedroom'
  | 'bath'
  | 'living'
  | 'view-city'
  | 'view-pool'
  | 'view-garden'
  | 'view-skyline'
  | 'lobby'
  | 'pool'
  | 'spa'
  | 'dining'
  | 'rooftop'
  | 'fitness';

export type AmenityId =
  | 'wifi'
  | 'ac'
  | 'tv'
  | 'desk'
  | 'coffee'
  | 'safe'
  | 'minibar'
  | 'bathtub'
  | 'rainshower'
  | 'rollin'
  | 'robes'
  | 'balcony'
  | 'lounge'
  | 'dining'
  | 'concierge';

export const AMENITIES: Record<AmenityId, { label: string; icon: LucideIcon }> = {
  wifi: { label: 'Free Wi-Fi', icon: Wifi },
  ac: { label: 'Air conditioning', icon: Thermometer },
  tv: { label: 'Smart TV', icon: Tv },
  desk: { label: 'Work desk', icon: Briefcase },
  coffee: { label: 'Coffee & tea set', icon: Coffee },
  safe: { label: 'In-room safe', icon: ShieldCheck },
  minibar: { label: 'Minibar', icon: Wine },
  bathtub: { label: 'Soaking bathtub', icon: Bath },
  rainshower: { label: 'Rain shower', icon: Droplets },
  rollin: { label: 'Roll-in shower & grab rails', icon: Accessibility },
  robes: { label: 'Robes & slippers', icon: Shirt },
  balcony: { label: 'Balcony or terrace', icon: Sun },
  lounge: { label: 'Separate living area', icon: Sofa },
  dining: { label: 'In-suite dining table', icon: UtensilsCrossed },
  concierge: { label: 'Dedicated concierge line', icon: Crown },
};

export type BedKey = 'king' | 'queen' | 'twin';

export interface RoomType {
  id: string;
  name: string;
  category: 'Standard' | 'Deluxe' | 'Accessible' | 'Suite';
  /** whether the name/rate come from the project's seeded data or are a demo example */
  basis: 'source' | 'demo';
  /** USD per night */
  rate: number;
  maxGuests: number;
  maxAdults: number;
  bedKey: BedKey;
  bedLabel: string;
  areaSqm: number;
  blurb: string;
  highlights: string[];
  /** what makes this type different from the others */
  signature: string[];
  amenities: AmenityId[];
  accessible: boolean;
  included: string[];
  scenes: SceneKind[];
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: 'standard-queen',
    name: 'Standard Queen',
    category: 'Standard',
    basis: 'demo',
    rate: 195,
    maxGuests: 2,
    maxAdults: 2,
    bedKey: 'queen',
    bedLabel: '1 queen bed',
    areaSqm: 24,
    blurb: 'A calm, well-planned room for one or two guests.',
    highlights: ['Queen bed with premium linen', 'Compact work desk', 'Walk-in shower'],
    signature: ['The most affordable way to stay', 'Efficient layout for short trips'],
    amenities: ['wifi', 'ac', 'tv', 'desk', 'coffee', 'safe'],
    accessible: false,
    included: ['Free Wi-Fi', 'Daily housekeeping', 'Pool and fitness access (demo)'],
    scenes: ['bedroom', 'bath', 'view-city'],
  },
  {
    id: 'deluxe-twin',
    name: 'Deluxe Twin',
    category: 'Deluxe',
    basis: 'source',
    rate: 255,
    maxGuests: 3,
    maxAdults: 2,
    bedKey: 'twin',
    bedLabel: '2 twin beds',
    areaSqm: 30,
    blurb: 'Two full-size beds, ideal for friends, colleagues or a family of three.',
    highlights: ['Two twin beds (can join as a king on request)', 'Space for a rollaway for a child', 'Minibar and rain shower'],
    signature: ['The only type with two separate beds as standard', 'Extra floor space for luggage'],
    amenities: ['wifi', 'ac', 'tv', 'desk', 'coffee', 'safe', 'minibar', 'rainshower'],
    accessible: false,
    included: ['Free Wi-Fi', 'Daily housekeeping', 'Pool and fitness access (demo)'],
    scenes: ['bedroom', 'bath', 'view-pool'],
  },
  {
    id: 'deluxe-king',
    name: 'Deluxe King',
    category: 'Deluxe',
    basis: 'source',
    rate: 270,
    maxGuests: 3,
    maxAdults: 2,
    bedKey: 'king',
    bedLabel: '1 king bed',
    areaSqm: 32,
    blurb: 'Generous space, a king bed and a soaking bathtub for a more relaxed stay.',
    highlights: ['King bed', 'Soaking bathtub and rain shower', 'Robes, slippers and minibar'],
    signature: ['Soaking bathtub', 'Robes and slippers included'],
    amenities: ['wifi', 'ac', 'tv', 'desk', 'coffee', 'safe', 'minibar', 'bathtub', 'rainshower', 'robes'],
    accessible: false,
    included: ['Free Wi-Fi', 'Daily housekeeping', 'Pool and fitness access (demo)'],
    scenes: ['bedroom', 'bath', 'view-city'],
  },
  {
    id: 'accessible-king',
    name: 'Accessible King',
    category: 'Accessible',
    basis: 'demo',
    rate: 270,
    maxGuests: 3,
    maxAdults: 2,
    bedKey: 'king',
    bedLabel: '1 king bed (lowered frame)',
    areaSqm: 36,
    blurb: 'Step-free and designed for independent travel, with extra turning space.',
    highlights: ['Roll-in shower with fold-down seat and grab rails', 'Lowered switches, wardrobe rail and peephole', 'Visual and vibrating door and fire alerts'],
    signature: ['Roll-in shower and grab rails', 'Visual door and fire alerts', 'Widest doorways and turning space'],
    amenities: ['wifi', 'ac', 'tv', 'desk', 'coffee', 'safe', 'minibar', 'rollin'],
    accessible: true,
    included: ['Free Wi-Fi', 'Daily housekeeping', 'Pool and fitness access (demo)', 'Priority lift access'],
    scenes: ['bedroom', 'bath', 'view-city'],
  },
  {
    id: 'suite',
    name: 'Suite',
    category: 'Suite',
    basis: 'source',
    rate: 295,
    maxGuests: 4,
    maxAdults: 3,
    bedKey: 'king',
    bedLabel: '1 king bed + sofa bed',
    areaSqm: 52,
    blurb: 'A separate living room, a king bedroom and room for the whole family.',
    highlights: ['Separate living room with sofa bed', 'Soaking bathtub and rain shower', 'Larger work area'],
    signature: ['Separate living area', 'Sleeps four with the sofa bed', 'Terrace or balcony in selected suites'],
    amenities: ['wifi', 'ac', 'tv', 'desk', 'coffee', 'safe', 'minibar', 'bathtub', 'rainshower', 'robes', 'lounge'],
    accessible: false,
    included: ['Free Wi-Fi', 'Daily housekeeping', 'Pool and fitness access (demo)'],
    scenes: ['living', 'bedroom', 'bath', 'view-pool'],
  },
  {
    id: 'presidential-suite',
    name: 'Presidential Suite',
    category: 'Suite',
    basis: 'source',
    rate: 700,
    maxGuests: 5,
    maxAdults: 4,
    bedKey: 'king',
    bedLabel: '1 king bed + 1 twin room',
    areaSqm: 110,
    blurb: 'The signature residence: skyline views, a dining room and a dedicated concierge line.',
    highlights: ['Skyline views from the top floor', 'Private dining table and living room', 'Dedicated concierge line'],
    signature: ['The only dining room in a guest room', 'Dedicated concierge line', 'Largest layout in the hotel'],
    amenities: ['wifi', 'ac', 'tv', 'desk', 'coffee', 'safe', 'minibar', 'bathtub', 'rainshower', 'robes', 'balcony', 'lounge', 'dining', 'concierge'],
    accessible: false,
    included: ['Free Wi-Fi', 'Daily housekeeping', 'Pool and fitness access (demo)', 'Welcome amenities (demo)'],
    scenes: ['living', 'bedroom', 'view-skyline', 'bath'],
  },
];

export const roomTypeById: Record<string, RoomType> = Object.fromEntries(ROOM_TYPES.map((t) => [t.id, t]));

export interface RoomUnit {
  no: string;
  floor: number;
  typeId: string;
  view: ViewKind;
  /** features that belong to this individual room, beyond its room type */
  features: string[];
}

/** One entry per room in the Front Desk inventory (27 rooms). */
export const ROOMS: RoomUnit[] = [
  { no: '127', floor: 1, typeId: 'deluxe-twin', view: 'garden', features: ['Private garden patio with its own door'] },
  { no: '210', floor: 2, typeId: 'suite', view: 'pool', features: ['Terrace directly above the pool deck'] },

  { no: '301', floor: 3, typeId: 'accessible-king', view: 'city', features: ['Closest room to the lifts'] },
  { no: '302', floor: 3, typeId: 'standard-queen', view: 'city', features: [] },
  { no: '303', floor: 3, typeId: 'standard-queen', view: 'city', features: [] },
  { no: '304', floor: 3, typeId: 'deluxe-king', view: 'city', features: [] },
  { no: '305', floor: 3, typeId: 'suite', view: 'pool', features: [] },
  { no: '306', floor: 3, typeId: 'deluxe-king', view: 'pool', features: [] },
  { no: '307', floor: 3, typeId: 'deluxe-twin', view: 'pool', features: [] },
  { no: '308', floor: 3, typeId: 'standard-queen', view: 'pool', features: [] },

  { no: '401', floor: 4, typeId: 'deluxe-king', view: 'city', features: [] },
  { no: '402', floor: 4, typeId: 'deluxe-king', view: 'city', features: [] },
  { no: '403', floor: 4, typeId: 'deluxe-king', view: 'city', features: ['Corner room with wrap-around windows'] },
  { no: '404', floor: 4, typeId: 'deluxe-twin', view: 'city', features: [] },
  { no: '405', floor: 4, typeId: 'deluxe-twin', view: 'pool', features: [] },
  { no: '406', floor: 4, typeId: 'deluxe-king', view: 'pool', features: [] },
  { no: '407', floor: 4, typeId: 'suite', view: 'pool', features: ['Private terrace with seating'] },
  { no: '408', floor: 4, typeId: 'deluxe-king', view: 'pool', features: ['Quietest position, away from the lifts'] },

  { no: '501', floor: 5, typeId: 'suite', view: 'skyline', features: [] },
  { no: '502', floor: 5, typeId: 'suite', view: 'skyline', features: [] },
  { no: '503', floor: 5, typeId: 'suite', view: 'skyline', features: ['Corner suite with two-sided views'] },
  { no: '504', floor: 5, typeId: 'deluxe-king', view: 'skyline', features: [] },
  { no: '505', floor: 5, typeId: 'deluxe-king', view: 'skyline', features: [] },
  { no: '506', floor: 5, typeId: 'suite', view: 'skyline', features: [] },
  { no: '507', floor: 5, typeId: 'deluxe-king', view: 'skyline', features: [] },
  { no: '508', floor: 5, typeId: 'suite', view: 'skyline', features: [] },
  { no: '518', floor: 5, typeId: 'presidential-suite', view: 'skyline', features: ['Only Presidential Suite in the hotel', 'Private lift key access'] },
];

export const roomByNo: Record<string, RoomUnit> = Object.fromEntries(ROOMS.map((r) => [r.no, r]));

export interface FloorInfo {
  floor: number;
  label: string;
  /** public areas shown on the plan (not bookable) */
  areas: string[];
  /** room rows drawn on either side of the corridor */
  rows: string[][];
}

export const FLOOR_INFO: FloorInfo[] = [
  { floor: 1, label: 'Ground floor', areas: ['Lobby & Front Desk', 'Restaurant', 'Garden courtyard'], rows: [['127']] },
  { floor: 2, label: 'Level 2', areas: ['Spa & wellness', 'Fitness studio', 'Pool deck'], rows: [['210']] },
  { floor: 3, label: 'Level 3', areas: ['Guest lifts', 'Ice & vending'], rows: [['301', '302', '303', '304'], ['305', '306', '307', '308']] },
  { floor: 4, label: 'Level 4', areas: ['Guest lifts', 'Ice & vending'], rows: [['401', '402', '403', '404'], ['405', '406', '407', '408']] },
  { floor: 5, label: 'Level 5', areas: ['Guest lifts', 'Sky lounge access'], rows: [['501', '502', '503', '504'], ['505', '506', '507', '508', '518']] },
];

/* --------------------------------------------------------------------- */
/* Derived helpers                                                       */
/* --------------------------------------------------------------------- */

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceStay(rate: number, nights: number): BookingPricing {
  const roomSubtotal = round2(rate * nights);
  const resortFee = round2(RESORT_FEE_PER_NIGHT * nights);
  const taxes = round2((roomSubtotal + resortFee) * TAX_RATE);
  return { nightlyRate: rate, nights, roomSubtotal, resortFee, taxes, total: round2(roomSubtotal + resortFee + taxes) };
}

export const roomsOfType = (typeId: string): RoomUnit[] => ROOMS.filter((r) => r.typeId === typeId);

/** Amenities that only this room type offers. */
export function uniqueAmenities(typeId: string): AmenityId[] {
  const others = new Set(ROOM_TYPES.filter((t) => t.id !== typeId).flatMap((t) => t.amenities));
  return (roomTypeById[typeId]?.amenities ?? []).filter((a) => !others.has(a));
}

/** Amenities offered by every room type. */
export const SHARED_AMENITIES: AmenityId[] = (Object.keys(AMENITIES) as AmenityId[]).filter((a) =>
  ROOM_TYPES.every((t) => t.amenities.includes(a)),
);

export const CHILD_NOTE = 'Children count toward the room capacity. Cots and rollaways are subject to availability (demo).';

/* --------------------------------------------------------------------- */
/* Policies (DEMO placeholders: the sources available to this prototype   */
/* do not define cancellation terms; replace when the backlog is verified) */
/* --------------------------------------------------------------------- */

export const FREE_CANCEL_DAYS = 2;

export const POLICIES: Array<{ title: string; text: string }> = [
  { title: 'Check-in and check-out', text: `Check-in from ${CHECK_IN_TIME}, check-out by ${CHECK_OUT_TIME}. Early check-in depends on the room being inspected and ready.` },
  { title: 'Cancellation (demo placeholder)', text: `Free cancellation up to ${FREE_CANCEL_DAYS} days before arrival. After that the first night is kept. Refunds are reviewed by Finance before they are paid.` },
  { title: 'Payment', text: 'This demo takes no real payment. Only a masked card reference is kept, never the card number.' },
  { title: 'Children and extra beds', text: CHILD_NOTE },
  { title: 'Prices and fees', text: `Rates are per room per night in INR. A resort fee of ₹${RESORT_FEE_PER_NIGHT.toFixed(2)} per night and a demo tax and service charge of ${Math.round(TAX_RATE * 100)}% are added.` },
];

/* --------------------------------------------------------------------- */
/* Site content (sample)                                                 */
/* --------------------------------------------------------------------- */

export const FACILITIES: Array<{ title: string; text: string; scene: SceneKind }> = [
  { title: 'Pool deck', text: 'A sunny terrace pool with loungers and cabanas.', scene: 'pool' },
  { title: 'Spa & wellness', text: 'Massages, facials and a quiet relaxation room.', scene: 'spa' },
  { title: 'Fitness studio', text: 'Cardio, weights and morning yoga.', scene: 'fitness' },
  { title: 'Sky lounge', text: 'Evening drinks above the city.', scene: 'rooftop' },
];

export const GALLERY: Array<{ title: string; scene: SceneKind }> = [
  { title: 'Lobby', scene: 'lobby' },
  { title: 'Pool deck', scene: 'pool' },
  { title: 'Restaurant', scene: 'dining' },
  { title: 'Spa', scene: 'spa' },
  { title: 'Sky lounge', scene: 'rooftop' },
  { title: 'Presidential Suite', scene: 'living' },
];

export const CONTACT = {
  address: 'Demo address, not a real location',
  phone: '+1 (555) 010-0199',
  email: 'reservations@grandadp.example',
  hours: 'Front Desk open 24 hours',
};
