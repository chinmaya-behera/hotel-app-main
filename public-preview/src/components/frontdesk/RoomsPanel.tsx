'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BedDouble,
  CheckCircle2,
  KeyRound,
  Sparkles,
  MoonStar,
  LogIn,
  LogOut,
  Search,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Printer,
  QrCode,
  Wrench,
  Clock,
  Plus,
  Send,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  User,
  Layers,
  Phone,
  Mail,
  Calendar,
  Hash,
  CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { RoomRecord, StayRecord, Readiness, Tone } from '@/types/demo';

export const READINESS_TONE: Record<Readiness, Tone> = {
  ready: 'success',
  dirty: 'warning',
  cleaning: 'info',
  inspection_pending: 'warning',
  inspection_failed: 'danger',
  out_of_order: 'danger',
};

export type StatusFilterId =
  | 'all'
  | 'ready'
  | 'occupied'
  | 'dirty_cleaning'
  | 'checkin'
  | 'checkout'
  | 'post_departure'
  | 'dnd';

export type CleaningSubfilter = 'all' | 'guest_request' | 'cycle' | 'post_departure';

export interface RoomTileData {
  no: string;
  floor: number;
  readiness: Readiness;
  occupied: boolean;
  dnd: boolean;
  typeTag: string; // DLX, STE, TWN, KNG, PRES, RYL, PNT
  typeFull: string;
  statusLabel: string;
  statusKind: 'ready' | 'occupied' | 'dirty' | 'cleaning' | 'dnd' | 'checkin' | 'checkout' | 'post_departure';
  badgeStatus: 'READY' | 'OCCUPIED' | 'INSPECTION PENDING' | 'CLEANING' | 'OUT_OF_ORDER';
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  bookingRef?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  guestsCount?: number;
  vipTier?: string;
  folioBalance?: string;
  preferences?: string;
  previousGuest?: string;
  checkoutTime?: string;
  cleanerAssigned?: string;
  cleaningCategory?: 'guest_request' | 'cycle' | 'post_departure';
  cycleInfo?: { dueDay: string; cycleDays: number; isOverdue: boolean; nextScheduled: string };
  vip?: boolean;
  stay?: StayRecord;
  pin: string;
}

// 5 floors supporting full 27-room hotel matrix
const FLOOR_INFO: Record<number, { name: string; wing: string }> = {
  1: { name: 'FLOOR 1', wing: 'North Garden Wing' },
  2: { name: 'FLOOR 2', wing: 'Central Atrium Wing' },
  3: { name: 'FLOOR 3', wing: 'East Garden Wing' },
  4: { name: 'FLOOR 4', wing: 'Executive Suites Wing' },
  5: { name: 'FLOOR 5', wing: 'Penthouse & Presidential Suites' },
};

function getRoomType(roomNo: string): { tag: string; full: string } {
  if (roomNo === '127') return { tag: 'TWN', full: 'Deluxe Twin' };
  if (roomNo === '210') return { tag: 'STE', full: 'Suite' };
  if (roomNo === '305') return { tag: 'STE', full: 'Suite' };
  if (roomNo.startsWith('30')) return { tag: 'STE', full: 'Executive Suite' };
  if (roomNo === '402') return { tag: 'DLX', full: 'Deluxe King' };
  if (roomNo.startsWith('40')) return { tag: 'RYL', full: 'Royal Suite' };
  if (roomNo === '502' || roomNo === '506') return { tag: 'PRS', full: 'Presidential Suite' };
  if (roomNo === '518') return { tag: 'PRS', full: 'Penthouse Grand Suite' };
  if (roomNo.startsWith('50')) return { tag: 'PNT', full: 'Penthouse Suite' };
  const last = parseInt(roomNo.slice(-2), 10);
  if (last % 3 === 0) return { tag: 'TWN', full: 'Deluxe Twin' };
  if (last % 2 === 0) return { tag: 'DLX', full: 'Deluxe King' };
  return { tag: 'KNG', full: 'Superior King' };
}

// Deterministic mock PIN based on room number
function getRoomPin(roomNo: string): string {
  const n = parseInt(roomNo, 10);
  const code = ((n * 137 + 49) % 9000) + 1000;
  return `${code}#`;
}

interface RoomInventorySeed {
  no: string;
  floor: number;
  typeTag: string;
  typeFull: string;
  readiness: Readiness;
  occupied: boolean;
  dnd?: boolean;
  badgeStatus: 'READY' | 'OCCUPIED' | 'INSPECTION PENDING' | 'CLEANING' | 'OUT_OF_ORDER';
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  bookingRef?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  guestsCount?: number;
  vipTier?: string;
  folioBalance?: string;
  preferences?: string;
  cleanerAssigned?: string;
  cleaningCategory?: 'guest_request' | 'cycle' | 'post_departure';
  vip?: boolean;
}

// The exact 27-room inventory matrix matching the front desk room specification
const ROOM_INVENTORY_27: RoomInventorySeed[] = [
  // Floor 1 (1 room)
  {
    no: '127',
    floor: 1,
    typeTag: 'TWN',
    typeFull: 'Deluxe Twin',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'READY',
    guestName: 'Hannah Weiss',
    guestPhone: '+1 (555) 349-8821',
    guestEmail: 'hannah.weiss@voyageur.com',
    bookingRef: 'BK-127-9481',
    checkInDate: 'Nov 05, 2026 · 14:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Gold Elite',
    vip: true,
    folioBalance: '₹0.00 (Settled)',
    preferences: 'Quiet room away from elevator, hypoallergenic bedding',
  },
  // Floor 2 (1 room)
  {
    no: '210',
    floor: 2,
    typeTag: 'STE',
    typeFull: 'Suite',
    readiness: 'inspection_pending',
    occupied: true,
    badgeStatus: 'INSPECTION PENDING',
    guestName: 'Tomás Silva',
    guestPhone: '+351 912 345 678',
    guestEmail: 'tomas.silva@skyline.org',
    bookingRef: 'BK-210-8832',
    checkInDate: 'Nov 04, 2026 · 15:00',
    checkOutDate: 'Nov 08, 2026 · 12:00',
    duration: '4 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Silver Elite',
    vip: true,
    folioBalance: '₹0.00 (Pre-authorized)',
    preferences: 'Late checkout requested (13:00), extra sparkling water',
  },
  // Floor 3 (8 rooms)
  {
    no: '301',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Liam Gallagher',
    guestPhone: '+44 7911 123456',
    guestEmail: 'liam.gallagher@manchester.co.uk',
    bookingRef: 'BK-301-1102',
    checkInDate: 'Nov 03, 2026 · 14:00',
    checkOutDate: 'Nov 07, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Club Member',
    folioBalance: '₹12,450 (Active Folio)',
    preferences: 'High floor, firm mattress, morning newspaper',
  },
  {
    no: '302',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Chloe Dupont',
    guestPhone: '+33 6 12 34 56 78',
    guestEmail: 'chloe.dupont@elysee.fr',
    bookingRef: 'BK-302-2245',
    checkInDate: 'Nov 05, 2026 · 13:30',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '3 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Silver Elite',
    folioBalance: '₹4,200 (Active Folio)',
    preferences: 'Airport transfer required on departure, green tea bags',
  },
  {
    no: '303',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '304',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'cleaning',
    occupied: false,
    badgeStatus: 'CLEANING',
    cleaningCategory: 'post_departure',
    cleanerAssigned: 'Sunita Rao (Housekeeping)',
  },
  {
    no: '305',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Marcus Chen',
    guestPhone: '+1 (415) 890-2341',
    guestEmail: 'marcus.chen@horizon.co',
    bookingRef: 'BK-305-7712',
    checkInDate: 'Nov 02, 2026 · 16:00',
    checkOutDate: 'Nov 07, 2026 · 11:00',
    duration: '5 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Platinum Elite',
    vip: true,
    folioBalance: '₹18,900 (Settled)',
    preferences: 'Corner suite preference, wake-up call at 07:00, espresso pods',
  },
  {
    no: '306',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Alexander Wright',
    guestPhone: '+1 (617) 555-0199',
    guestEmail: 'alex.wright@cambridge.edu',
    bookingRef: 'BK-306-4491',
    checkInDate: 'Nov 04, 2026 · 14:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '5 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Club Member',
    folioBalance: '₹0.00 (Settled)',
    preferences: 'High speed ethernet access, extra desk lamp',
  },
  {
    no: '307',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'out_of_order',
    occupied: false,
    badgeStatus: 'OUT_OF_ORDER',
  },
  {
    no: '308',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  // Floor 4 (8 rooms)
  {
    no: '401',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Devon Vance',
    guestPhone: '+1 (212) 555-8932',
    guestEmail: 'devon.vance@vanceholdings.com',
    bookingRef: 'BK-401-9011',
    checkInDate: 'Nov 01, 2026 · 12:00',
    checkOutDate: 'Nov 10, 2026 · 12:00',
    duration: '9 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Presidential VIP',
    vip: true,
    folioBalance: '₹45,000 (Active Folio)',
    preferences: 'Chilled Dom Pérignon on arrival, Butler service on call',
  },
  {
    no: '402',
    floor: 4,
    typeTag: 'DLX',
    typeFull: 'Deluxe King',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Elena Rostova',
    guestPhone: '+49 30 1234567',
    guestEmail: 'elena.rostova@aurora-lux.com',
    bookingRef: 'BK-402-6634',
    checkInDate: 'Nov 03, 2026 · 15:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '5 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Diamond Club',
    vip: true,
    folioBalance: '₹8,250 (Settled)',
    preferences: 'Extra velvet hangers, organic fruit basket, daily fresh lilies',
  },
  {
    no: '403',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '404',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Rajesh Kulkarni',
    guestPhone: '+91 98201 54321',
    guestEmail: 'rajesh.kulkarni@apexcorp.in',
    bookingRef: 'BK-404-3321',
    checkInDate: 'Nov 04, 2026 · 14:00',
    checkOutDate: 'Nov 07, 2026 · 11:00',
    duration: '3 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Gold Elite',
    vip: true,
    folioBalance: '₹0.00 (Settled)',
    preferences: 'Vegetarian breakfast preference, late checkout at 14:00',
  },
  {
    no: '405',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Sophia Reynolds',
    guestPhone: '+1 (312) 555-7643',
    guestEmail: 'sophia.reynolds@chicago-law.com',
    bookingRef: 'BK-405-8819',
    checkInDate: 'Nov 05, 2026 · 14:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '4 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Platinum Elite',
    vip: true,
    folioBalance: '₹15,300 (Pre-authorized)',
    preferences: 'Quiet room, yoga mat in room, extra sparkling mineral water',
  },
  {
    no: '406',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '407',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'David Kim',
    guestPhone: '+82 10 1234 5678',
    guestEmail: 'david.kim@seoul-tech.kr',
    bookingRef: 'BK-407-7720',
    checkInDate: 'Nov 04, 2026 · 16:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Silver Elite',
    folioBalance: '₹0.00 (Settled)',
    preferences: 'International multi-plug adapters, extra bottled water',
  },
  {
    no: '408',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  // Floor 5 (9 rooms)
  {
    no: '501',
    floor: 5,
    typeTag: 'PNT',
    typeFull: 'Penthouse Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Gabriel Rossi',
    guestPhone: '+39 02 1234567',
    guestEmail: 'gabriel.rossi@milano-design.it',
    bookingRef: 'BK-501-1188',
    checkInDate: 'Nov 02, 2026 · 14:00',
    checkOutDate: 'Nov 08, 2026 · 12:00',
    duration: '6 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Titanium Elite',
    vip: true,
    folioBalance: '₹32,000 (Active Folio)',
    preferences: 'Panoramic terrace dinner reservation, espresso machine',
  },
  {
    no: '502',
    floor: 5,
    typeTag: 'PRS',
    typeFull: 'Presidential Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '503',
    floor: 5,
    typeTag: 'PNT',
    typeFull: 'Penthouse Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Maya Patel',
    guestPhone: '+91 98110 99887',
    guestEmail: 'maya.patel@mumbai-ventures.in',
    bookingRef: 'BK-503-4412',
    checkInDate: 'Nov 05, 2026 · 15:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Gold Elite',
    vip: true,
    folioBalance: '₹0.00 (Settled)',
    preferences: 'Late check-in arrival, herbal tea selection',
  },
  {
    no: '504',
    floor: 5,
    typeTag: 'PNT',
    typeFull: 'Penthouse Suite',
    readiness: 'cleaning',
    occupied: false,
    badgeStatus: 'CLEANING',
    cleaningCategory: 'cycle',
    cleanerAssigned: 'Vikram Singh (Housekeeping)',
  },
  {
    no: '505',
    floor: 5,
    typeTag: 'PNT',
    typeFull: 'Penthouse Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Oliver Smith',
    guestPhone: '+61 2 9876 5432',
    guestEmail: 'oliver.smith@sydney-synergy.au',
    bookingRef: 'BK-505-8831',
    checkInDate: 'Nov 03, 2026 · 14:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '5 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Silver Elite',
    folioBalance: '₹21,500 (Pre-authorized)',
    preferences: 'Early morning run map, gym towel setup',
  },
  {
    no: '506',
    floor: 5,
    typeTag: 'PRS',
    typeFull: 'Presidential Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '507',
    floor: 5,
    typeTag: 'PNT',
    typeFull: 'Penthouse Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '508',
    floor: 5,
    typeTag: 'PNT',
    typeFull: 'Penthouse Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Isabella Martinez',
    guestPhone: '+34 91 123 4567',
    guestEmail: 'isabella.martinez@madrid-capital.es',
    bookingRef: 'BK-508-9923',
    checkInDate: 'Nov 04, 2026 · 14:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '4 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Club Member',
    folioBalance: '₹0.00 (Settled)',
    preferences: 'Extra bathrobes, late checkout at 13:00',
  },
  {
    no: '518',
    floor: 5,
    typeTag: 'PRS',
    typeFull: 'Penthouse Grand Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Priya Nair',
    guestPhone: '+91 98765 43210',
    guestEmail: 'priya.nair@summit.io',
    bookingRef: 'BK-518-5521',
    checkInDate: 'Nov 03, 2026 · 14:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '5 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Presidential VIP',
    vip: true,
    folioBalance: '₹0.00 (Settled)',
    preferences: 'VIP welcome champagne, fresh jasmine garland, executive meeting table',
  },
];

export function RoomsPanel() {
  const { state } = useDemo();

  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterId>('all');
  const [cleaningSubfilter, setCleaningSubfilter] = useState<CleaningSubfilter>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({});

  // Selected room highlight state (defaults to '303' per specification)
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>('303');

  // Slide-over Drawer State
  const [drawerRoomNo, setDrawerRoomNo] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'tasks' | 'timeline'>('overview');
  const [pinVisible, setPinVisible] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [qrRegenerated, setQrRegenerated] = useState(false);
  const [passSentToast, setPassSentToast] = useState(false);

  // Quick Task Modal
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [taskType, setTaskType] = useState('Turnover Deep Clean');
  const [taskAssignee, setTaskAssignee] = useState('Vikram Singh (Housekeeping)');
  const [taskPriority, setTaskPriority] = useState('Urgent');

  // Print Pass Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Local state for dynamic room overrides (status switching from drawer)
  const [roomOverrides, setRoomOverrides] = useState<
    Record<string, { readiness?: Readiness; occupied?: boolean; dnd?: boolean }>
  >({});

  const stays = state.frontDesk?.stays ?? [];
  const stateRooms = state.frontDesk?.rooms ?? [];

  // Generate complete 27 rooms matching the inventory matrix specification
  const allRooms: RoomTileData[] = useMemo(() => {
    return ROOM_INVENTORY_27.map((spec) => {
      const no = spec.no;
      const floor = spec.floor;

      // Find existing state room if any
      const existing = stateRooms.find((r) => r.no === no);
      const override = roomOverrides[no];
      const stay = stays.find((s) => s.room === no && s.status !== 'checked_out');
      const expectedStay = stays.find((s) => s.room === no && s.status === 'expected');
      const checkedOutStay = stays.find((s) => s.room === no && s.status === 'checked_out');

      let readiness: Readiness = existing?.readiness ?? spec.readiness;
      let occupied = existing?.occupied ?? spec.occupied;
      let dnd = existing?.dnd ?? spec.dnd ?? false;
      let badgeStatus = spec.badgeStatus;

      // Apply local overrides if changed by user
      if (override) {
        if (override.readiness !== undefined) readiness = override.readiness;
        if (override.occupied !== undefined) occupied = override.occupied;
        if (override.dnd !== undefined) dnd = override.dnd;
      }

      let statusKind: RoomTileData['statusKind'] = 'ready';
      let statusLabel = 'Ready';
      let previousGuest = checkedOutStay?.guest ?? (spec.cleaningCategory === 'post_departure' ? 'Clara Dupont' : undefined);
      let checkoutTime = checkedOutStay?.departure ?? (spec.cleaningCategory === 'post_departure' ? 'Today · 09:15 AM' : undefined);
      let cleanerAssigned = spec.cleanerAssigned;
      let cleaningCategory: RoomTileData['cleaningCategory'] = spec.cleaningCategory;
      let cycleInfo: RoomTileData['cycleInfo'] = spec.cleaningCategory === 'cycle' ? {
        dueDay: 'Due Today',
        cycleDays: 3,
        isOverdue: false,
        nextScheduled: 'Today 11:30 (Day 3 of 4)',
      } : undefined;

      if (dnd) {
        statusKind = 'dnd';
        statusLabel = 'DND';
        badgeStatus = 'OCCUPIED';
      } else if (stay && stay.status === 'in_house') {
        occupied = true;
        badgeStatus = 'OCCUPIED';
        if (stay.departsToday) {
          statusKind = 'checkout';
          statusLabel = `Check-Out · ${stay.guest.split(' ')[0]}`;
        } else {
          statusKind = 'occupied';
          statusLabel = stay.guest.split(' ')[0];
        }
      } else if (expectedStay) {
        statusKind = 'checkin';
        statusLabel = `Check-In · ${expectedStay.guest.split(' ')[0]}`;
      } else if (cleaningCategory === 'post_departure' || checkedOutStay) {
        statusKind = 'post_departure';
        statusLabel = readiness === 'ready' ? 'Turnover Ready' : 'Post-Departure';
        badgeStatus = readiness === 'ready' ? 'READY' : 'CLEANING';
      } else if (readiness === 'cleaning' || readiness === 'inspection_pending') {
        statusKind = 'cleaning';
        statusLabel = readiness === 'inspection_pending' ? 'Inspection' : 'Cleaning';
        badgeStatus = readiness === 'inspection_pending' ? 'INSPECTION PENDING' : 'CLEANING';
      } else if (readiness === 'dirty' || readiness === 'out_of_order') {
        statusKind = 'dirty';
        statusLabel = readiness === 'out_of_order' ? 'Out of Order' : 'Dirty';
        badgeStatus = readiness === 'out_of_order' ? 'OUT_OF_ORDER' : 'CLEANING';
      } else if (occupied) {
        statusKind = 'occupied';
        statusLabel = spec.guestName ? spec.guestName.split(' ')[0] : 'Occupied';
        badgeStatus = 'OCCUPIED';
      } else {
        statusKind = 'ready';
        statusLabel = 'Ready';
        badgeStatus = 'READY';
      }

      return {
        no,
        floor,
        readiness,
        occupied,
        dnd,
        typeTag: spec.typeTag,
        typeFull: spec.typeFull,
        statusLabel,
        statusKind,
        badgeStatus,
        guestName: stay?.guest ?? expectedStay?.guest ?? spec.guestName,
        guestPhone: spec.guestPhone,
        guestEmail: spec.guestEmail,
        bookingRef: stay?.id ?? spec.bookingRef,
        checkInDate: stay?.arrival ?? spec.checkInDate,
        checkOutDate: stay?.departure ?? spec.checkOutDate,
        duration: spec.duration,
        guestsCount: spec.guestsCount ?? 2,
        vipTier: stay?.vipTier ?? spec.vipTier,
        folioBalance: spec.folioBalance,
        preferences: stay?.preferencesSummary ?? spec.preferences,
        previousGuest,
        checkoutTime,
        cleanerAssigned,
        cleaningCategory,
        cycleInfo,
        vip: stay?.vip ?? expectedStay?.vip ?? spec.vip,
        stay: stay ?? expectedStay ?? checkedOutStay,
        pin: getRoomPin(no),
      };
    });
  }, [stateRooms, stays, roomOverrides]);

  // Compute live counts for left sidebar
  const counts = useMemo(() => {
    return {
      all: allRooms.length,
      ready: allRooms.filter((r) => r.statusKind === 'ready').length,
      occupied: allRooms.filter((r) => r.statusKind === 'occupied' || r.occupied).length,
      dirty_cleaning: allRooms.filter((r) => r.statusKind === 'dirty' || r.statusKind === 'cleaning' || r.cleaningCategory !== undefined).length,
      checkin: allRooms.filter((r) => r.statusKind === 'checkin' || stays.some((s) => s.room === r.no && s.status === 'expected')).length,
      checkout: allRooms.filter((r) => r.statusKind === 'checkout' || stays.some((s) => s.room === r.no && s.status === 'in_house' && s.departsToday)).length,
      post_departure: allRooms.filter((r) => r.statusKind === 'post_departure' || r.cleaningCategory === 'post_departure' || stays.some((s) => s.room === r.no && s.status === 'checked_out')).length,
      dnd: allRooms.filter((r) => r.dnd).length,
    };
  }, [allRooms, stays]);

  // Overall readiness percentage
  const readinessPercent = Math.round((counts.ready / (counts.all || 1)) * 100);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allRooms.filter((r) => {
      // Floor filter
      if (selectedFloorFilter !== 'all' && r.floor !== selectedFloorFilter) return false;

      // Status filter
      if (activeStatusFilter === 'ready' && r.statusKind !== 'ready') return false;
      if (activeStatusFilter === 'occupied' && !(r.statusKind === 'occupied' || r.occupied)) return false;
      if (activeStatusFilter === 'post_departure' && !(r.statusKind === 'post_departure' || r.cleaningCategory === 'post_departure' || stays.some((s) => s.room === r.no && s.status === 'checked_out'))) return false;
      if (activeStatusFilter === 'dirty_cleaning') {
        if (cleaningSubfilter === 'guest_request') {
          return r.cleaningCategory === 'guest_request';
        }
        if (cleaningSubfilter === 'cycle') {
          return r.cleaningCategory === 'cycle';
        }
        if (cleaningSubfilter === 'post_departure') {
          return r.statusKind === 'post_departure' || r.cleaningCategory === 'post_departure' || stays.some((s) => s.room === r.no && s.status === 'checked_out');
        }
        return r.statusKind === 'dirty' || r.statusKind === 'cleaning' || r.cleaningCategory !== undefined;
      }
      if (activeStatusFilter === 'checkin' && !(r.statusKind === 'checkin' || stays.some((s) => s.room === r.no && s.status === 'expected'))) return false;
      if (activeStatusFilter === 'checkout' && !(r.statusKind === 'checkout' || stays.some((s) => s.room === r.no && s.status === 'in_house' && s.departsToday))) return false;
      if (activeStatusFilter === 'dnd' && !r.dnd) return false;

      // Search query
      if (q) {
        const text = `${r.no} ${r.typeFull} ${r.guestName ?? ''} ${r.previousGuest ?? ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allRooms, activeStatusFilter, selectedFloorFilter, searchQuery, stays]);

  // Group rooms by floor (1 to 5)
  const floorsList = [1, 2, 3, 4, 5];

  const toggleFloorCollapse = (fl: number) => {
    setCollapsedFloors((prev) => ({ ...prev, [fl]: !prev[fl] }));
  };

  // Active drawer room
  const drawerRoom = allRooms.find((r) => r.no === drawerRoomNo);

  // Synchronize browser history for the room details drawer to allow Back navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (e: PopStateEvent) => {
      const st = e.state;
      if (st && st.staffRole === 'front-desk') {
        if (!st.roomDrawer) {
          setDrawerRoomNo(null);
        } else {
          setDrawerRoomNo(st.roomDrawer);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openRoomDrawer = (no: string) => {
    setDrawerRoomNo(no);
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { staffRole: 'front-desk', tab: 'rooms', roomDrawer: no },
        ''
      );
    }
  };

  const closeRoomDrawer = () => {
    setDrawerRoomNo(null);
    if (typeof window !== 'undefined' && window.history.state?.roomDrawer) {
      window.history.back();
    }
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard?.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 1500);
  };

  const handleRegenerateQr = () => {
    setQrRegenerated(true);
    setTimeout(() => setQrRegenerated(false), 1500);
  };

  const handleSendPass = () => {
    setPassSentToast(true);
    setTimeout(() => setPassSentToast(false), 2500);
  };

  const handleDrawerStatusChange = (newStatus: string) => {
    if (!drawerRoomNo) return;
    if (newStatus === 'Ready') {
      setRoomOverrides((prev) => ({
        ...prev,
        [drawerRoomNo]: { readiness: 'ready', occupied: false, dnd: false },
      }));
    } else if (newStatus === 'Dirty / Cleaning') {
      setRoomOverrides((prev) => ({
        ...prev,
        [drawerRoomNo]: { readiness: 'cleaning', occupied: false, dnd: false },
      }));
    } else if (newStatus === 'Occupied') {
      setRoomOverrides((prev) => ({
        ...prev,
        [drawerRoomNo]: { readiness: 'ready', occupied: true, dnd: false },
      }));
    } else if (newStatus === 'DND') {
      setRoomOverrides((prev) => ({
        ...prev,
        [drawerRoomNo]: { dnd: true },
      }));
    }
  };

  return (
    <div className="flex-1 min-h-0 h-auto lg:h-full flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-visible lg:overflow-hidden w-full">
      {/* ============================================================== */}
      {/* 1A. MOBILE CONTROLS BAR: Compact Filter, Readiness & Floors    */}
      {/* ============================================================== */}
      <div className="lg:hidden rounded-2xl border border-white/10 bg-ink-900/80 p-3 sm:p-3.5 space-y-3 shadow-md">
        {/* Readiness and Quick Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-mist-300">Room Readiness</span>
              <span className="text-cyan-300 tabular-nums">{readinessPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>

          {/* Search Room or Guest */}
          <div className="relative w-full sm:w-48 shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              placeholder="Search room or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field w-full text-xs py-1.5 pl-8 pr-7 rounded-lg bg-black/40 border-white/10 text-mist-200 placeholder:text-mist-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Chips (Scrollable touch row) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="group" aria-label="Filter rooms by status">
          {[
            { id: 'all', label: 'All', count: counts.all, icon: BedDouble, tone: 'text-mist-300' },
            { id: 'ready', label: 'Ready', count: counts.ready, icon: CheckCircle2, tone: 'text-emerald-400' },
            { id: 'occupied', label: 'Booked', count: counts.occupied, icon: KeyRound, tone: 'text-sky-400' },
            { id: 'dirty_cleaning', label: 'Cleaning', count: counts.dirty_cleaning, icon: Sparkles, tone: 'text-amber-400' },
            { id: 'post_departure', label: 'Post-Dept', count: counts.post_departure, icon: Clock, tone: 'text-violet-400' },
            { id: 'checkin', label: 'Check-In', count: counts.checkin, icon: LogIn, tone: 'text-cyan-300' },
            { id: 'checkout', label: 'Check-Out', count: counts.checkout, icon: LogOut, tone: 'text-amber-300' },
            { id: 'dnd', label: 'DND', count: counts.dnd, icon: MoonStar, tone: 'text-rose-400' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeStatusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveStatusFilter(item.id as StatusFilterId)}
                className={cn(
                  'px-2.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all',
                  isSelected
                    ? 'border-cyan-400/40 bg-cyan-500/20 text-white shadow-xs'
                    : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', item.tone)} />
                <span>{item.label}</span>
                <span className={cn('px-1.5 py-0.2 rounded-md text-[10px] tabular-nums font-bold', isSelected ? 'bg-cyan-400 text-ink-950' : 'bg-white/10 text-mist-300')}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Floor Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 shrink-0">Floors:</span>
          <button
            type="button"
            onClick={() => setSelectedFloorFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 transition',
              selectedFloorFilter === 'all'
                ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-200'
                : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5'
            )}
          >
            All Floors
          </button>
          {floorsList.map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setSelectedFloorFilter(fl)}
              className={cn(
                'px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 transition',
                selectedFloorFilter === fl
                  ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5'
              )}
            >
              Floor {fl}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1B. DESKTOP LEFT COLUMN: Status Distribution & Filter Sidebar    */}
      {/* ============================================================== */}
      <div className="hidden lg:flex w-[250px] shrink-0 h-full flex-col justify-between p-4 rounded-2xl border border-white/10 bg-ink-900/80 shadow-lg overflow-y-auto">
        {/* Top Zone — ROOM STATUSES (Interactive Filter List with Counts & Progress Bar) */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
              Status Distribution
            </p>
            <h2 className="text-base font-bold text-white mt-0.5">Room Statuses</h2>

            {/* Room Readiness Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-mist-300">Room Readiness</span>
                <span className="text-cyan-300 tabular-nums">{readinessPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Status Filter Rows */}
          <div className="space-y-1" role="group" aria-label="Filter rooms by status">
            {[
              { id: 'all', label: 'All Rooms', count: counts.all, icon: BedDouble, tone: 'text-mist-300' },
              { id: 'ready', label: 'Ready', count: counts.ready, icon: CheckCircle2, tone: 'text-emerald-400' },
              { id: 'occupied', label: 'Booked / In-House', count: counts.occupied, icon: KeyRound, tone: 'text-sky-400' },
              { id: 'dirty_cleaning', label: 'Dirty / Cleaning', count: counts.dirty_cleaning, icon: Sparkles, tone: 'text-amber-400' },
              { id: 'post_departure', label: 'Post-Departure', count: counts.post_departure, icon: Clock, tone: 'text-violet-400' },
              { id: 'checkin', label: 'Check-In', count: counts.checkin, icon: LogIn, tone: 'text-cyan-300' },
              { id: 'checkout', label: 'Check-Out', count: counts.checkout, icon: LogOut, tone: 'text-amber-300' },
              { id: 'dnd', label: 'DND', count: counts.dnd, icon: MoonStar, tone: 'text-rose-400' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeStatusFilter === item.id;
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStatusFilter(item.id as StatusFilterId);
                      if (item.id === 'dirty_cleaning') setCleaningSubfilter('all');
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all duration-150',
                      isSelected
                        ? 'border-cyan-400/40 bg-cyan-500/15 text-white shadow-sm'
                        : 'border-transparent text-mist-300 hover:bg-white/[0.04] hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', item.tone)} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[11px] tabular-nums font-bold shrink-0',
                        isSelected ? 'bg-cyan-400 text-ink-950' : 'bg-white/5 text-mist-300',
                      )}
                    >
                      {item.count}
                    </span>
                  </button>

                  {item.id === 'dirty_cleaning' && isSelected && (
                    <div className="ml-4 pl-2.5 py-1.5 space-y-1 border-l-2 border-amber-400/40 bg-white/[0.02] rounded-r-lg">
                      <button
                        type="button"
                        onClick={() => setCleaningSubfilter('all')}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded text-[11px] font-medium transition',
                          cleaningSubfilter === 'all'
                            ? 'text-cyan-300 font-bold bg-white/5'
                            : 'text-mist-400 hover:text-white'
                        )}
                      >
                        • All Cleaning
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleaningSubfilter('guest_request')}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded text-[11px] font-medium transition',
                          cleaningSubfilter === 'guest_request'
                            ? 'text-amber-300 font-bold bg-white/5'
                            : 'text-mist-400 hover:text-white'
                        )}
                      >
                        • On Guest Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleaningSubfilter('cycle')}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded text-[11px] font-medium transition',
                          cleaningSubfilter === 'cycle'
                            ? 'text-sky-300 font-bold bg-white/5'
                            : 'text-mist-400 hover:text-white'
                        )}
                      >
                        • Cleaning Cycle (3d)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleaningSubfilter('post_departure')}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded text-[11px] font-medium transition',
                          cleaningSubfilter === 'post_departure'
                            ? 'text-violet-300 font-bold bg-white/5'
                            : 'text-mist-400 hover:text-white'
                        )}
                      >
                        • Post-Departure
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MIDDLE COLUMN: Inventory Matrix Room Grid (Matching Design) */}
      {/* ============================================================== */}
      <div className="flex-1 min-w-0 h-auto lg:h-full flex flex-col rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#f8fafc]/80 dark:bg-ink-900/60 p-3 sm:p-5 shadow-lg overflow-visible lg:overflow-hidden backdrop-blur-sm">
        {/* Horizontal Floor Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-xs shrink-0 mr-1">
            <Layers className="h-4 w-4 text-amber-500" />
            <span>Floor:</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFloorFilter('all')}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer',
              selectedFloorFilter === 'all'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            )}
          >
            All Floors
          </button>
          {[1, 2, 3, 4, 5].map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setSelectedFloorFilter(fl)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer',
                selectedFloorFilter === fl
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              )}
            >
              Floor {fl}
            </button>
          ))}

          {/* Reset Filters Shortcut if active */}
          {(activeStatusFilter !== 'all' || selectedFloorFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveStatusFilter('all');
                setCleaningSubfilter('all');
                setSelectedFloorFilter('all');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-semibold shrink-0 cursor-pointer pl-2"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        {/* Subfilter Bar for Dirty / Cleaning if active */}
        {activeStatusFilter === 'dirty_cleaning' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-1 shrink-0">
            <span className="text-[11px] font-bold text-mist-400 mr-1 uppercase tracking-wider">Cleaning Subfilters:</span>
            {[
              { id: 'all', label: 'All Cleaning' },
              { id: 'guest_request', label: 'On Guest Request' },
              { id: 'cycle', label: 'Cleaning Cycle (Every 3 Days)' },
              { id: 'post_departure', label: 'Post-Departure Turnover' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setCleaningSubfilter(sub.id as CleaningSubfilter)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer',
                  cleaningSubfilter === sub.id
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5'
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Matrix Header Title */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-4 mb-3 shrink-0">
          INVENTORY MATRIX ({filteredRooms.length} ROOMS)
        </div>

        {/* Scrollable Room Card Grid (4 columns matching screenshot) */}
        <div className="flex-1 min-h-0 overflow-visible lg:overflow-y-auto pr-0 lg:pr-1 pb-2">
          {filteredRooms.length === 0 ? (
            <div className="p-12 text-center text-sm text-mist-400 flex flex-col items-center gap-2">
              <BedDouble className="h-8 w-8 text-mist-500" />
              <p>No rooms match the selected filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredRooms.map((room) => {
                const isSelected = selectedRoomNo === room.no;
                const isNamedGuest = Boolean(
                  ['127', '210', '305', '402', '518'].includes(room.no) && room.guestName
                );
                const isOccupied = room.badgeStatus === 'OCCUPIED' || room.occupied;

                const badgeColors: Record<string, string> = {
                  READY:
                    'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
                  OCCUPIED:
                    'bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
                  'INSPECTION PENDING':
                    'bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/40',
                  CLEANING:
                    'bg-[#fef3c7] text-[#b45309] border border-[#fde68a] dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
                  OUT_OF_ORDER:
                    'bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3] dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
                };

                const badgeClass =
                  badgeColors[room.badgeStatus ?? 'READY'] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                return (
                  <button
                    key={room.no}
                    type="button"
                    onClick={() => {
                      setSelectedRoomNo(room.no);
                      openRoomDrawer(room.no);
                    }}
                    className={cn(
                      'rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[148px] relative group',
                      isSelected
                        ? 'bg-[#fffbeb] border-2 border-amber-400 ring-2 ring-amber-300/50 shadow-md dark:bg-amber-500/10 dark:border-amber-400 dark:ring-amber-400/30'
                        : 'bg-[#ffffff] border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md dark:bg-[#0c1424]/90 dark:border-white/10 dark:hover:border-white/25 dark:hover:bg-[#111c33]'
                    )}
                  >
                    {/* Top: Room No & Room Type */}
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {room.no}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-mist-400 mt-1 truncate">
                        {room.typeFull}
                      </div>
                    </div>

                    {/* Middle: Guest Name or Occupied / Vacant */}
                    <div className="my-2.5">
                      {isNamedGuest ? (
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {room.guestName}
                        </div>
                      ) : isOccupied ? (
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          Occupied
                        </div>
                      ) : (
                        <div className="text-xs italic text-slate-400 dark:text-mist-500 font-medium">
                          Vacant
                        </div>
                      )}
                    </div>

                    {/* Bottom: Status Badge (left) & Floor (right) */}
                    <div className="flex items-center justify-between gap-1 pt-1 mt-auto">
                      <span
                        className={cn(
                          'text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wide leading-tight',
                          badgeClass
                        )}
                      >
                        {room.badgeStatus}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-mist-400 shrink-0">
                        Fl {room.floor}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. RIGHT-SIDE SLIDE-OVER ROOM DETAILS DRAWER                   */}
      {/* ============================================================== */}
      {drawerRoom && (
        <>
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40 transition-opacity animate-fade-in"
            onClick={closeRoomDrawer}
          />

          {/* Drawer Slide-Over Panel */}
          <aside
            className="fixed top-0 right-0 w-full sm:w-[420px] h-full sm:h-screen bg-ink-950 border-l border-white/10 z-50 shadow-2xl flex flex-col justify-between overflow-hidden animate-[fd-slide-from-right_0.25s_cubic-bezier(0.16,1,0.3,1)]"
            role="dialog"
            aria-label={`Room ${drawerRoom.no} details`}
          >
            {/* Drawer Header */}
            <div className="p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      Room {drawerRoom.no}
                    </h3>
                    {drawerRoom.vip && <Badge tone="accent">VIP</Badge>}
                  </div>
                  <p className="text-xs text-mist-300 font-medium mt-0.5">
                    Floor {drawerRoom.floor} · {drawerRoom.typeFull}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRoomDrawer}
                  className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-mist-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status Selector Dropdown */}
              <div className="mt-3.5 flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/10 text-xs">
                <span className="text-mist-400 text-[11px] font-semibold shrink-0">
                  Status:
                </span>
                <select
                  value={
                    drawerRoom.dnd
                      ? 'DND'
                      : drawerRoom.occupied
                        ? 'Occupied'
                        : drawerRoom.readiness === 'cleaning'
                          ? 'Dirty / Cleaning'
                          : 'Ready'
                  }
                  onChange={(e) => handleDrawerStatusChange(e.target.value)}
                  className="field py-1 px-2 text-xs w-full rounded-lg bg-ink-900 border-white/10 text-white font-bold"
                >
                  <option value="Ready">Ready (Vacant &amp; Inspected)</option>
                  <option value="Dirty / Cleaning">Dirty / Cleaning (Turnover)</option>
                  <option value="Occupied">Occupied (Guest In-House)</option>
                  <option value="DND">DND (Do Not Disturb)</option>
                </select>
              </div>

              {/* 3 Sub-Tabs inside Drawer */}
              <div className="mt-3 flex rounded-xl border border-white/10 bg-black/30 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDrawerTab('overview')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-center transition',
                    drawerTab === 'overview' ? 'accent-soft text-white' : 'text-mist-400 hover:text-white',
                  )}
                >
                  Overview &amp; Pass
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('tasks')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-center transition',
                    drawerTab === 'tasks' ? 'accent-soft text-white' : 'text-mist-400 hover:text-white',
                  )}
                >
                  Tasks &amp; Requests
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('timeline')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-center transition',
                    drawerTab === 'timeline' ? 'accent-soft text-white' : 'text-mist-400 hover:text-white',
                  )}
                >
                  Timeline
                </button>
              </div>
            </div>

            {/* Toast feedback if pass sent */}
            {passSentToast && (
              <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shrink-0">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Digital Pass &amp; Key PIN SMS/Email dispatched to guest!</span>
              </div>
            )}

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 1: OVERVIEW & DIGITAL PASS */}
              {drawerTab === 'overview' && (
                <>
                  {/* Guest & Stay Summary / Booked Member Information Card */}
                  {drawerRoom.occupied || drawerRoom.guestName || drawerRoom.stay ? (
                    <div className="p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-ink-900 to-ink-950 space-y-3.5 shadow-lg">
                      {/* Header: Member Name & VIP Badge */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/10">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                            Booked Member Profile
                          </span>
                          <h4 className="text-base font-extrabold text-white mt-0.5">
                            {drawerRoom.guestName || drawerRoom.stay?.guest || 'In-House Registered Guest'}
                          </h4>
                          <p className="text-[11px] text-mist-300">
                            Room {drawerRoom.no} · {drawerRoom.typeFull} (Floor {drawerRoom.floor})
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {drawerRoom.vipTier ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              ★ {drawerRoom.vipTier}
                            </span>
                          ) : drawerRoom.vip ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              ★ VIP Guest
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                              In-House Guest
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-emerald-400">
                            Checked-In &amp; In-House
                          </span>
                        </div>
                      </div>

                      {/* Key Member Details Grid */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        {/* Phone Number */}
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-semibold text-mist-400 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-cyan-400" />
                            Contact Phone
                          </span>
                          <a
                            href={`tel:${drawerRoom.guestPhone ?? '+1 (555) 782-1920'}`}
                            className="font-semibold text-white hover:text-cyan-300 transition text-[11px] truncate block"
                          >
                            {drawerRoom.guestPhone ?? '+1 (555) 782-1920'}
                          </a>
                        </div>

                        {/* Email Address */}
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-semibold text-mist-400 flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-cyan-400" />
                            Email Address
                          </span>
                          <a
                            href={`mailto:${drawerRoom.guestEmail ?? 'guest@voyageur.com'}`}
                            className="font-semibold text-white hover:text-cyan-300 transition text-[11px] truncate block"
                            title={drawerRoom.guestEmail ?? 'guest@voyageur.com'}
                          >
                            {drawerRoom.guestEmail ?? 'guest@voyageur.com'}
                          </a>
                        </div>

                        {/* Booking Reference ID */}
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-semibold text-mist-400 flex items-center gap-1.5">
                            <Hash className="h-3 w-3 text-amber-400" />
                            Booking Reference
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-[11px] block">
                            {drawerRoom.bookingRef ?? drawerRoom.stay?.id ?? `BK-${drawerRoom.no}-9821`}
                          </span>
                        </div>

                        {/* Length of Stay & Party */}
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-semibold text-mist-400 flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-sky-400" />
                            Duration &amp; Party
                          </span>
                          <span className="font-semibold text-white text-[11px] block">
                            {drawerRoom.duration ?? (drawerRoom.stay?.nights ? `${drawerRoom.stay.nights} Nights · 2 Guests` : '4 Nights · 2 Guests')}
                          </span>
                        </div>

                        {/* Check-In Date & Time */}
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-semibold text-mist-400 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-emerald-400" />
                            Check-In Date
                          </span>
                          <span className="font-semibold text-emerald-300 text-[11px] block">
                            {drawerRoom.checkInDate ?? drawerRoom.stay?.arrival ?? 'Nov 05, 2026 · 14:00'}
                          </span>
                        </div>

                        {/* Check-Out Date & Time */}
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                          <span className="text-[10px] font-semibold text-mist-400 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-rose-400" />
                            Check-Out Date
                          </span>
                          <span className="font-semibold text-rose-300 text-[11px] block">
                            {drawerRoom.checkOutDate ?? drawerRoom.stay?.departure ?? 'Nov 09, 2026 · 11:00'}
                          </span>
                        </div>
                      </div>

                      {/* Folio Balance & Card Mask */}
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-mist-400 text-[11px]">Folio Balance:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400 text-xs">
                            {drawerRoom.folioBalance ?? '₹0.00 (Settled)'}
                          </span>
                          <span className="text-[10px] text-mist-400 ml-1.5 font-mono">
                            · Visa •••• 4242
                          </span>
                        </div>
                      </div>

                      {/* Special Preferences / Guest Notes */}
                      {(drawerRoom.preferences || drawerRoom.stay?.preferencesSummary) && (
                        <div className="p-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                            Guest Preferences &amp; Requests
                          </span>
                          <p className="text-mist-200 text-[11px] leading-relaxed">
                            {drawerRoom.preferences ?? drawerRoom.stay?.preferencesSummary}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
                          Room Status
                        </span>
                        <Badge tone={drawerRoom.readiness === 'ready' ? 'success' : drawerRoom.readiness === 'cleaning' ? 'warning' : 'danger'}>
                          {drawerRoom.readiness === 'ready' ? 'Vacant & Inspected' : drawerRoom.readiness === 'cleaning' ? 'Turnover Cleaning' : 'Out of Order'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-semibold">
                          {drawerRoom.readiness === 'ready' ? 'Ready for Immediate Walk-In Assignment' : drawerRoom.readiness === 'cleaning' ? 'Housekeeping Turnover In Progress' : 'Maintenance Required'}
                        </p>
                        <p className="text-mist-400 text-[11px]">
                          {drawerRoom.readiness === 'ready'
                            ? 'Housekeeping inspection verified. All amenities replenished and keyless PIN ready.'
                            : drawerRoom.readiness === 'cleaning'
                            ? 'Assigned housekeeping team is freshening linens, towels, and minibar restock.'
                            : 'Room undergoing technical inspection and maintenance.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post-Departure Room Management Card (Requirement 7.A) */}
                  {(drawerRoom.cleaningCategory === 'post_departure' ||
                    drawerRoom.statusKind === 'post_departure' ||
                    drawerRoom.previousGuest) && (
                    <div className="p-3.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.04] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-violet-300">
                          Post-Departure Turnover Management
                        </span>
                        <Badge tone={drawerRoom.readiness === 'ready' ? 'success' : 'warning'}>
                          {drawerRoom.readiness === 'ready' ? 'Ready for New Guest' : 'Turnover Required'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-mist-400">Previous Guest</span>
                          <p className="font-semibold text-white mt-0.5">{drawerRoom.previousGuest || 'Clara Dupont'}</p>
                        </div>
                        <div>
                          <span className="text-mist-400">Checkout Time</span>
                          <p className="font-semibold text-mist-200 mt-0.5">{drawerRoom.checkoutTime || 'Today · 09:15 AM'}</p>
                        </div>
                        <div>
                          <span className="text-mist-400">Housekeeping Status</span>
                          <p className="font-semibold text-amber-300 capitalize mt-0.5">
                            {drawerRoom.readiness === 'ready' ? 'Inspected & Ready' : drawerRoom.readiness === 'cleaning' ? 'Cleaning In Progress' : 'Dirty (Awaiting Turnover)'}
                          </p>
                        </div>
                        <div>
                          <span className="text-mist-400">Cleaner Assigned</span>
                          <p className="font-semibold text-mist-200 mt-0.5">{drawerRoom.cleanerAssigned || 'Vikram Singh (Housekeeping)'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-mist-400">Front Desk Release:</span>
                          <span className={cn('font-bold', drawerRoom.readiness === 'ready' ? 'text-emerald-400' : 'text-amber-400')}>
                            {drawerRoom.readiness === 'ready' ? 'Released / Available' : 'Locked (Pending Turnover)'}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="subtle"
                            iconLeft={Sparkles}
                            onClick={() => {
                              setRoomOverrides((prev) => ({
                                ...prev,
                                [drawerRoom.no]: { readiness: 'cleaning', occupied: false, dnd: false },
                              }));
                            }}
                          >
                            Dispatch Turnover (HK)
                          </Button>
                          <Button
                            size="sm"
                            variant={drawerRoom.readiness === 'ready' ? 'accent' : 'subtle'}
                            iconLeft={CheckCircle2}
                            disabled={drawerRoom.readiness !== 'ready'}
                            onClick={() => {
                              setRoomOverrides((prev) => ({
                                ...prev,
                                [drawerRoom.no]: { readiness: 'ready', occupied: false, dnd: false },
                              }));
                            }}
                          >
                            Mark Room Available
                          </Button>
                        </div>
                        {drawerRoom.readiness !== 'ready' && (
                          <p className="text-[10px] text-amber-300/80 italic">
                            * Note: Front Desk cannot release this room until Housekeeping completes turnover and supervisor inspection is approved.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Routine Cleaning Cycle Card (Requirement 7.B.2) */}
                  {drawerRoom.cleaningCategory === 'cycle' && drawerRoom.cycleInfo && (
                    <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/[0.04] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300">
                          Routine Cleaning Cycle (SOP 3-Day Rule)
                        </span>
                        <Badge tone={drawerRoom.cycleInfo.isOverdue ? 'danger' : 'info'}>
                          {drawerRoom.cycleInfo.dueDay}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-mist-400">Cycle Policy</span>
                          <p className="font-semibold text-white mt-0.5">Every 3 Days</p>
                        </div>
                        <div>
                          <span className="text-mist-400">Scheduled Time</span>
                          <p className="font-semibold text-mist-200 mt-0.5">{drawerRoom.cycleInfo.nextScheduled}</p>
                        </div>
                        <div>
                          <span className="text-mist-400">Assigned Housekeeper</span>
                          <p className="font-semibold text-mist-200 mt-0.5">{drawerRoom.cleanerAssigned || 'Anita Sharma'}</p>
                        </div>
                        <div>
                          <span className="text-mist-400">Duplicate Check</span>
                          <p className="font-semibold text-emerald-400 mt-0.5">Protected (1 active/cycle)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* On Guest Request Cleaning Card (Requirement 7.B.1) */}
                  {drawerRoom.cleaningCategory === 'guest_request' && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                          Guest Requested Cleaning
                        </span>
                        <Badge tone="warning">On-Demand Request</Badge>
                      </div>
                      <p className="text-xs text-mist-200">
                        Guest submitted a priority housekeeping request via Guest Portal for full room freshening and towel turnover.
                      </p>
                      <p className="text-[11px] text-mist-400">
                        Assigned Attendant: <strong className="text-white">{drawerRoom.cleanerAssigned || 'Sunita Rao'}</strong>
                      </p>
                    </div>
                  )}

                  {/* Room Digital Access & QR Pass Card (Required) */}
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-cyan-300" />
                        <span className="font-bold text-white text-xs">
                          Room Digital Access &amp; Pass
                        </span>
                      </div>
                      <Badge tone="success">Active Key Session</Badge>
                    </div>

                    {/* QR Code SVG Display */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <svg
                        className="w-36 h-36 bg-white p-2.5 rounded-lg shadow-md"
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Top-left position marker */}
                        <rect x="5" y="5" width="25" height="25" fill="#000" rx="2" />
                        <rect x="9" y="9" width="17" height="17" fill="#fff" />
                        <rect x="13" y="13" width="9" height="9" fill="#000" />

                        {/* Top-right position marker */}
                        <rect x="70" y="5" width="25" height="25" fill="#000" rx="2" />
                        <rect x="74" y="9" width="17" height="17" fill="#fff" />
                        <rect x="78" y="13" width="9" height="9" fill="#000" />

                        {/* Bottom-left position marker */}
                        <rect x="5" y="70" width="25" height="25" fill="#000" rx="2" />
                        <rect x="9" y="74" width="17" height="17" fill="#fff" />
                        <rect x="13" y="78" width="9" height="9" fill="#000" />

                        {/* QR Data Grid Dots */}
                        <rect x="36" y="8" width="5" height="5" fill="#000" />
                        <rect x="46" y="8" width="5" height="5" fill="#000" />
                        <rect x="56" y="8" width="5" height="5" fill="#000" />
                        <rect x="36" y="18" width="5" height="5" fill="#000" />
                        <rect x="56" y="18" width="5" height="5" fill="#000" />

                        <rect x="8" y="36" width="5" height="5" fill="#000" />
                        <rect x="18" y="36" width="5" height="5" fill="#000" />
                        <rect x="28" y="36" width="5" height="5" fill="#000" />
                        <rect x="38" y="36" width="5" height="5" fill="#000" />
                        <rect x="48" y="36" width="5" height="5" fill="#000" />
                        <rect x="58" y="36" width="5" height="5" fill="#000" />
                        <rect x="68" y="36" width="5" height="5" fill="#000" />
                        <rect x="78" y="36" width="5" height="5" fill="#000" />

                        {/* Center Key Logo / ADP mark */}
                        <circle cx="50" cy="50" r="11" fill="#06b6d4" />
                        <text
                          x="50"
                          y="54"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#fff"
                        >
                          ADP
                        </text>

                        <rect x="8" y="46" width="5" height="5" fill="#000" />
                        <rect x="28" y="46" width="5" height="5" fill="#000" />
                        <rect x="68" y="46" width="5" height="5" fill="#000" />
                        <rect x="88" y="46" width="5" height="5" fill="#000" />

                        <rect x="8" y="56" width="5" height="5" fill="#000" />
                        <rect x="28" y="56" width="5" height="5" fill="#000" />
                        <rect x="68" y="56" width="5" height="5" fill="#000" />
                        <rect x="88" y="56" width="5" height="5" fill="#000" />

                        <rect x="36" y="74" width="5" height="5" fill="#000" />
                        <rect x="46" y="74" width="5" height="5" fill="#000" />
                        <rect x="56" y="74" width="5" height="5" fill="#000" />
                        <rect x="66" y="74" width="5" height="5" fill="#000" />
                        <rect x="76" y="74" width="5" height="5" fill="#000" />
                        <rect x="86" y="74" width="5" height="5" fill="#000" />

                        <rect x="36" y="84" width="5" height="5" fill="#000" />
                        <rect x="56" y="84" width="5" height="5" fill="#000" />
                        <rect x="76" y="84" width="5" height="5" fill="#000" />
                      </svg>

                      {/* QR Actions */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          type="button"
                          onClick={handleRegenerateQr}
                          className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>{qrRegenerated ? 'Regenerated!' : 'Regenerate QR'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPrintModal(true)}
                          className="text-[11px] font-semibold text-mist-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verify Pass</span>
                        </button>
                      </div>
                    </div>

                    {/* Room Access PIN / Password */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-mist-400 font-medium">Room Access PIN:</p>
                        <p className="font-mono text-sm font-extrabold text-white tracking-widest mt-0.5">
                          {pinVisible ? drawerRoom.pin : '••••••'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPinVisible(!pinVisible)}
                          className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-mist-400 hover:text-white"
                          title={pinVisible ? 'Hide PIN' : 'Show PIN'}
                        >
                          {pinVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPin(drawerRoom.pin)}
                          className="h-7 px-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1 text-[11px] text-mist-300 hover:text-white font-medium"
                        >
                          {copiedPin ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Send Digital Pass to Guest button */}
                    <Button
                      size="sm"
                      variant="accent"
                      iconLeft={Send}
                      onClick={handleSendPass}
                      className="w-full text-xs"
                    >
                      Send Digital Pass to Guest
                    </Button>
                  </div>
                </>
              )}

              {/* TAB 2: TASKS & REQUESTS */}
              {drawerTab === 'tasks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
                      Room Tasks &amp; Service Orders
                    </p>
                    <Badge tone="info">2 Active</Badge>
                  </div>

                  {/* Task 1 */}
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Extra bath sheets &amp; towels</span>
                      <Badge tone="warning">Due in 15m</Badge>
                    </div>
                    <p className="text-mist-300 text-[11px]">Housekeeping · Floor Attendant: Vikram Singh</p>
                    <p className="text-mist-400 text-[10px]">Requested via Guest Portal at 09:42 AM</p>
                  </div>

                  {/* Task 2 */}
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Evening turndown &amp; chamomile tea</span>
                      <Badge tone="info">Scheduled 18:00</Badge>
                    </div>
                    <p className="text-mist-300 text-[11px]">Housekeeping VIP Protocol</p>
                    <p className="text-mist-400 text-[10px]">Logged by Front Desk (Sunita Patel)</p>
                  </div>

                  {/* Assign Cleaning / Task button */}
                  <Button
                    size="sm"
                    variant="subtle"
                    iconLeft={Plus}
                    onClick={() => setShowAssignTaskModal(true)}
                    className="w-full text-xs mt-2"
                  >
                    + Assign Cleaning / Task
                  </Button>
                </div>
              )}

              {/* TAB 3: TIMELINE */}
              {drawerTab === 'timeline' && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
                    Activity &amp; Access Log
                  </p>

                  <div className="relative pl-5 space-y-4 border-l border-white/10 ml-2 text-xs">
                    <div className="relative">
                      <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-ink-950" />
                      <p className="font-semibold text-white">Digital Pass Verified at Reader</p>
                      <p className="text-mist-400 text-[11px]">10:25 AM · Level 4 Elevator Corridor reader</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 border-2 border-ink-950" />
                      <p className="font-semibold text-white">Towels Request Dispatched</p>
                      <p className="text-mist-400 text-[11px]">09:42 AM · Assigned to Vikram Singh</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-ink-950" />
                      <p className="font-semibold text-white">Pre-Arrival Inspection Passed</p>
                      <p className="text-mist-400 text-[11px]">08:30 AM · Signed off by Meera Nambiar</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-mist-400 border-2 border-ink-950" />
                      <p className="font-semibold text-white">Digital Pass Issued</p>
                      <p className="text-mist-400 text-[11px]">Yesterday 15:30 · Link delivered via SMS</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer Actions */}
            <div className="p-3 border-t border-white/10 bg-black/40 grid grid-cols-2 gap-2 shrink-0">
              <Button
                size="sm"
                variant="subtle"
                iconLeft={Printer}
                onClick={() => setShowPrintModal(true)}
                className="text-xs"
              >
                View / Print Pass
              </Button>
              <Button
                size="sm"
                variant="accent"
                iconLeft={Sparkles}
                onClick={() => setShowAssignTaskModal(true)}
                className="text-xs"
              >
                Dispatch Cleaner
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* Task Assignment Modal */}
      {showAssignTaskModal && drawerRoom && (
        <Modal
          title={`Assign Task · Room ${drawerRoom.no}`}
          description="Dispatch task fulfiller from Housekeeping or Engineering"
          onClose={() => setShowAssignTaskModal(false)}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="field w-full text-xs"
              >
                <option value="Turnover Deep Clean">Turnover Deep Clean (Check-Out)</option>
                <option value="Towel / Linen Replenish">Towel / Linen Replenish</option>
                <option value="AC / Thermostat Check">AC / Thermostat Check</option>
                <option value="Minibar Restock">Minibar Restock</option>
                <option value="Luggage Assistance">Luggage Assistance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Assignee</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="field w-full text-xs"
                >
                  <option value="Vikram Singh (Housekeeping)">Vikram Singh (Housekeeping)</option>
                  <option value="Meera Nambiar (Floor Supervisor)">Meera Nambiar (Floor Sup.)</option>
                  <option value="Arun Patel (Engineering)">Arun Patel (Engineering)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="field w-full text-xs"
                >
                  <option value="Urgent">Urgent (SLA 15m)</option>
                  <option value="High">High (SLA 30m)</option>
                  <option value="Normal">Normal (SLA 60m)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" onClick={() => setShowAssignTaskModal(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                iconLeft={Send}
                onClick={() => {
                  setShowAssignTaskModal(false);
                  handleDrawerStatusChange('Dirty / Cleaning');
                }}
              >
                Dispatch Task
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View / Print Pass Modal */}
      {showPrintModal && drawerRoom && (
        <Modal
          title={`Digital Room Pass · Room ${drawerRoom.no}`}
          description="Guest Key Token & Digital Access Summary"
          onClose={() => setShowPrintModal(false)}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-white text-ink-950 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-bold text-base">THE GRAND ADP</h4>
                  <p className="text-[11px] text-gray-600">Guest Access Keycard Pass</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-xl text-cyan-600">Room {drawerRoom.no}</p>
                  <p className="text-[10px] text-gray-500">{drawerRoom.typeFull}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Registered Guest</p>
                  <p className="font-bold text-sm text-gray-900">
                    {drawerRoom.stay?.guest ?? 'Authorized Guest'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Key PIN</p>
                  <p className="font-mono font-bold text-base text-gray-900">{drawerRoom.pin}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-100 flex items-center justify-between text-[11px]">
                <span>Wi-Fi SSID: <strong>GrandADP_Guest</strong></span>
                <span>Pass: <strong>ADP402Welcome</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="subtle" onClick={() => setShowPrintModal(false)}>
                Close
              </Button>
              <Button
                variant="accent"
                iconLeft={Printer}
                onClick={() => {
                  window.print?.();
                  setShowPrintModal(false);
                }}
              >
                Print Pass Slip
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
