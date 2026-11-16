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
  Building2,
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
  typeTag: string;
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

const FLOOR_INFO: Record<number, { name: string; wing: string }> = {
  1: { name: 'FLOOR 1', wing: 'North Garden Wing' },
  2: { name: 'FLOOR 2', wing: 'Central Atrium Wing' },
  3: { name: 'FLOOR 3', wing: 'East Garden Wing' },
  4: { name: 'FLOOR 4', wing: 'Executive Suites Wing' },
  5: { name: 'FLOOR 5', wing: 'Penthouse & Presidential Suites' },
};

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
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '305',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Suite',
    readiness: 'cleaning',
    occupied: false,
    badgeStatus: 'CLEANING',
    cleaningCategory: 'post_departure',
    cleanerAssigned: 'Meera Nambiar (Housekeeping)',
  },
  {
    no: '306',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
  },
  {
    no: '307',
    floor: 3,
    typeTag: 'STE',
    typeFull: 'Executive Suite',
    readiness: 'ready',
    occupied: false,
    badgeStatus: 'READY',
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
    guestName: 'Lord Alistair Sterling',
    guestPhone: '+44 20 7946 0912',
    guestEmail: 'alistair.sterling@sterling-holding.co.uk',
    bookingRef: 'BK-401-9988',
    checkInDate: 'Nov 01, 2026 · 14:00',
    checkOutDate: 'Nov 08, 2026 · 16:00',
    duration: '7 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: "Chairman's Club",
    vip: true,
    folioBalance: '₹0.00 (Direct Bill)',
    preferences: 'Nut allergy, organic Darjeeling tea, late checkout confirmed',
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
    guestPhone: '+1 (555) 234-5678',
    guestEmail: 'elena.rostova@azure.test',
    bookingRef: 'BK-402-992',
    checkInDate: 'Nov 04, 2026 · 15:00',
    checkOutDate: 'Nov 09, 2026 · 11:00',
    duration: '5 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Gold Elite',
    vip: true,
    folioBalance: '₹3,450 (Active Folio)',
    preferences: 'Extra feather pillows, quiet floor away from ice machine',
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
    readiness: 'out_of_order',
    occupied: false,
    badgeStatus: 'OUT_OF_ORDER',
  },
  {
    no: '405',
    floor: 4,
    typeTag: 'RYL',
    typeFull: 'Royal Suite',
    readiness: 'ready',
    occupied: true,
    badgeStatus: 'OCCUPIED',
    guestName: 'Daisuke Takahashi',
    guestPhone: '+81 3 5555 0143',
    guestEmail: 'd.takahashi@tokyo-arch.jp',
    bookingRef: 'BK-405-3321',
    checkInDate: 'Nov 04, 2026 · 16:00',
    checkOutDate: 'Nov 08, 2026 · 11:00',
    duration: '4 Nights · 1 Guest',
    guestsCount: 1,
    vipTier: 'Gold Elite',
    vip: true,
    folioBalance: '₹8,900 (Active Folio)',
    preferences: 'Humidifier in room, Japanese green tea bags',
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
    occupied: false,
    badgeStatus: 'READY',
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
    occupied: false,
    badgeStatus: 'READY',
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
    guestPhone: '+91 98201 44921',
    guestEmail: 'priya.nair@nair-enterprises.in',
    bookingRef: 'BK-518-0001',
    checkInDate: 'Nov 02, 2026 · 12:00',
    checkOutDate: 'Nov 10, 2026 · 12:00',
    duration: '8 Nights · 2 Guests',
    guestsCount: 2,
    vipTier: 'Ambassador VIP',
    vip: true,
    folioBalance: '₹0.00 (House Account)',
    preferences: 'Aromatherapy lavender turn-down, organic coconut water',
  },
];

export function GeneralManagerRoomsTab() {
  const { state } = useDemo();

  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterId>('all');
  const [cleaningSubfilter, setCleaningSubfilter] = useState<CleaningSubfilter>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>(null);
  const [drawerRoomNo, setDrawerRoomNo] = useState<string | null>(null);

  const [pinVisible, setPinVisible] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const stateRooms: RoomRecord[] = state.frontDesk?.rooms ?? [];
  const stays: StayRecord[] = state.frontDesk?.stays ?? [];

  // Construct comprehensive 27-room data matching Front Desk RoomsPanel
  const allRooms: RoomTileData[] = useMemo(() => {
    return ROOM_INVENTORY_27.map((spec) => {
      const stateRoom = stateRooms.find((r) => r.no === spec.no);
      const stay = stays.find((s) => s.room === spec.no && s.status === 'in_house');
      const expectedStay = stays.find((s) => s.room === spec.no && s.status === 'expected');
      const checkedOutStay = stays.find((s) => s.room === spec.no && s.status === 'checked_out');

      const no = spec.no;
      const floor = spec.floor;
      let readiness: Readiness = stateRoom?.readiness ?? spec.readiness;
      let occupied = stateRoom?.occupied ?? spec.occupied;
      let dnd = Boolean(state.guestPreferences?.[no]?.dnd ?? spec.dnd);
      let badgeStatus = spec.badgeStatus;

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
  }, [stateRooms, stays, state.guestPreferences]);

  // Compute live counts matching Front Desk RoomsPanel
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

  const readinessPercent = Math.round((counts.ready / (counts.all || 1)) * 100);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allRooms.filter((r) => {
      if (selectedFloorFilter !== 'all' && r.floor !== selectedFloorFilter) return false;

      if (activeStatusFilter === 'ready' && r.statusKind !== 'ready') return false;
      if (activeStatusFilter === 'occupied' && !r.occupied && r.statusKind !== 'occupied') return false;
      if (activeStatusFilter === 'dirty_cleaning') {
        if (cleaningSubfilter === 'guest_request' && r.cleaningCategory !== 'guest_request') return false;
        if (cleaningSubfilter === 'cycle' && r.cleaningCategory !== 'cycle') return false;
        if (cleaningSubfilter === 'post_departure' && r.cleaningCategory !== 'post_departure') return false;
        if (r.statusKind !== 'dirty' && r.statusKind !== 'cleaning' && r.cleaningCategory === undefined) return false;
      }
      if (activeStatusFilter === 'checkin' && r.statusKind !== 'checkin') return false;
      if (activeStatusFilter === 'checkout' && r.statusKind !== 'checkout') return false;
      if (activeStatusFilter === 'post_departure' && r.statusKind !== 'post_departure') return false;
      if (activeStatusFilter === 'dnd' && !r.dnd) return false;

      if (q) {
        const matchNo = r.no.toLowerCase().includes(q);
        const matchGuest = r.guestName ? r.guestName.toLowerCase().includes(q) : false;
        const matchType = r.typeFull.toLowerCase().includes(q);
        if (!matchNo && !matchGuest && !matchType) return false;
      }

      return true;
    });
  }, [allRooms, selectedFloorFilter, activeStatusFilter, cleaningSubfilter, searchQuery]);

  const drawerRoom = allRooms.find((r) => r.no === drawerRoomNo);

  const openRoomDrawer = (no: string) => {
    setDrawerRoomNo(no);
  };

  const closeRoomDrawer = () => {
    setDrawerRoomNo(null);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard?.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 1500);
  };

  const STATUS_FILTERS: { id: StatusFilterId; label: string; count: number; tone: Tone; icon: any }[] = [
    { id: 'all', label: 'All Rooms', count: counts.all, tone: 'neutral', icon: Layers },
    { id: 'ready', label: 'Ready', count: counts.ready, tone: 'success', icon: CheckCircle2 },
    { id: 'occupied', label: 'Occupied', count: counts.occupied, tone: 'info', icon: BedDouble },
    { id: 'dirty_cleaning', label: 'Dirty / In Cleaning', count: counts.dirty_cleaning, tone: 'warning', icon: Sparkles },
    { id: 'checkin', label: 'Check-In Today', count: counts.checkin, tone: 'info', icon: LogIn },
    { id: 'checkout', label: 'Check-Out Today', count: counts.checkout, tone: 'warning', icon: LogOut },
    { id: 'post_departure', label: 'Post-Departure', count: counts.post_departure, tone: 'accent', icon: Clock },
    { id: 'dnd', label: 'Do Not Disturb (DND)', count: counts.dnd, tone: 'danger', icon: MoonStar },
  ];

  return (
    <div className="flex-1 min-h-0 h-auto flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-visible w-full">
      {/* ============================================================== */}
      {/* 1. LEFT COLUMN: Executive Readiness Gauge & Filters            */}
      {/* ============================================================== */}
      <div className="w-full lg:w-72 shrink-0 space-y-3 sm:space-y-4">
        {/* Readiness Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-ink-900/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Hotel Readiness
            </span>
            <span className="font-mono text-sm font-black text-amber-500">{readinessPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-mist-400 font-medium pt-1 border-t border-slate-100 dark:border-white/5">
            <span>{counts.ready} Ready to Sell</span>
            <span>{counts.occupied} In-House</span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room no, guest name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-ink-900/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Status Filters List */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-ink-900/90 p-2 shadow-sm space-y-1">
          {STATUS_FILTERS.map((f) => {
            const Icon = f.icon;
            const active = activeStatusFilter === f.id;

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setActiveStatusFilter(f.id);
                  if (f.id !== 'dirty_cleaning') setCleaningSubfilter('all');
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer',
                  active
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className={cn('h-3.5 w-3.5', active ? 'text-white' : 'text-slate-400 dark:text-mist-400')} />
                  <span>{f.label}</span>
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                  )}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MIDDLE COLUMN: Inventory Matrix Room Grid (Matching FD)     */}
      {/* ============================================================== */}
      <div className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-ink-900/60 p-3.5 sm:p-5 shadow-lg backdrop-blur-sm space-y-4">
        {/* Horizontal Floor Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
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

        {/* Room Grid */}
        {filteredRooms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/40 dark:bg-ink-950/40">
            <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-white">No rooms matching filter criteria</p>
            <p className="text-xs text-slate-400 dark:text-mist-500 mt-1">Try resetting the floor or status filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                badgeColors[room.badgeStatus ?? 'READY'] ||
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

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

      {/* ============================================================== */}
      {/* 3. SLIDE-OVER ROOM DETAILS DRAWER (Matching FD RoomsPanel)     */}
      {/* ============================================================== */}
      {drawerRoom && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40 transition-opacity animate-in fade-in"
            onClick={closeRoomDrawer}
          />

          <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] z-50 bg-[#f8fafc] dark:bg-[#0c1322] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 font-black text-xl border border-amber-500/30 shadow-xs">
                  {drawerRoom.no}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Room {drawerRoom.no}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-mist-400">
                    {drawerRoom.typeFull} · {FLOOR_INFO[drawerRoom.floor]?.wing ?? `Floor ${drawerRoom.floor}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRoomDrawer}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* Status Banner */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-mist-500 uppercase font-bold block">
                    Current Room Status
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {drawerRoom.badgeStatus}
                  </span>
                </div>
                {drawerRoom.dnd && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500 font-bold text-[11px] border border-rose-500/30">
                    <MoonStar className="h-3 w-3" /> DND Active
                  </span>
                )}
              </div>

              {/* Active Guest Stay Details */}
              {drawerRoom.guestName ? (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-500 block">
                        Verified Guest Stay
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {drawerRoom.guestName}
                      </h4>
                    </div>
                    {drawerRoom.vipTier && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-500 border border-amber-400/40">
                        {drawerRoom.vipTier}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-mist-300">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-mist-500 block">Check-In</span>
                      <span className="font-semibold">{drawerRoom.checkInDate || 'Today · 14:00'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-mist-500 block">Check-Out</span>
                      <span className="font-semibold">{drawerRoom.checkOutDate || 'Nov 09 · 11:00'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-mist-500 block">Booking Reference</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {drawerRoom.bookingRef || `BK-${drawerRoom.no}-992`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-mist-500 block">Folio Balance</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {drawerRoom.folioBalance || '₹0.00 (Settled)'}
                      </span>
                    </div>
                  </div>

                  {drawerRoom.preferences && (
                    <div className="pt-2 border-t border-amber-500/10">
                      <span className="text-[10px] text-slate-400 dark:text-mist-500 block mb-0.5">
                        Guest Preferences
                      </span>
                      <p className="text-slate-700 dark:text-mist-200 italic">{drawerRoom.preferences}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900/60 text-slate-500 dark:text-mist-400 text-center py-6">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="font-semibold text-slate-800 dark:text-white">Room is Currently Vacant</p>
                  <p className="text-[11px] text-slate-400 dark:text-mist-500 mt-0.5">
                    Clean and ready for new guest arrival or reservation assignment.
                  </p>
                </div>
              )}

              {/* Digital Access PIN */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                    <span>Digital Lock Key PIN</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPinVisible(!pinVisible)}
                    className="text-[11px] text-amber-500 hover:underline font-semibold"
                  >
                    {pinVisible ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5">
                  <span className="font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white">
                    {pinVisible ? drawerRoom.pin : '••••#'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(drawerRoom.pin)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
                  >
                    {copiedPin ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Housekeeping Cleaner Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900/60 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                  <span>Housekeeping Protocol</span>
                </span>
                <p className="text-slate-600 dark:text-mist-300">
                  Assigned Attendant:{' '}
                  <strong>{drawerRoom.cleanerAssigned || 'Housekeeping Duty Team (West Wing)'}</strong>
                </p>
                <p className="text-[11px] text-slate-400 dark:text-mist-500">
                  Daily turnover cycle inspected &amp; certified by Floor Supervisor.
                </p>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-ink-900/90 shrink-0 flex justify-end">
              <Button variant="accent" onClick={closeRoomDrawer}>
                Close Room Details
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
