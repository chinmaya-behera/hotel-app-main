'use client';

import { useState, useMemo } from 'react';
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
  | 'dnd';

interface RoomTileData {
  no: string;
  floor: number;
  readiness: Readiness;
  occupied: boolean;
  dnd: boolean;
  typeTag: string; // DLX, STE, TWN, KNG, PRES
  typeFull: string;
  statusLabel: string;
  statusKind: 'ready' | 'occupied' | 'dirty' | 'cleaning' | 'dnd' | 'checkin' | 'checkout';
  guestName?: string;
  vip?: boolean;
  stay?: StayRecord;
  pin: string;
}

// 12 rooms per floor for Floors 1, 2, 3, 4 (48 rooms total)
const FLOOR_INFO: Record<number, { name: string; wing: string }> = {
  1: { name: 'FLOOR 1', wing: 'North Wing' },
  2: { name: 'FLOOR 2', wing: 'Central Atrium' },
  3: { name: 'FLOOR 3', wing: 'East Garden Wing' },
  4: { name: 'FLOOR 4', wing: 'Executive Suites & Penthouse' },
};

function getRoomType(roomNo: string): { tag: string; full: string } {
  if (roomNo === '401') return { tag: 'STE', full: 'Ambassador Suite' };
  if (roomNo === '412') return { tag: 'PRES', full: 'Presidential Penthouse' };
  if (roomNo === '310') return { tag: 'STE', full: 'Penthouse Suite' };
  if (roomNo === '201') return { tag: 'STE', full: 'Executive Corner Suite' };
  if (roomNo === '105') return { tag: 'STE', full: 'Garden Terrace Suite' };
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

export function RoomsPanel() {
  const { state } = useDemo();

  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterId>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({});

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

  // Generate complete 12 rooms for floors 1 to 4 (48 rooms) guaranteed
  const allRooms: RoomTileData[] = useMemo(() => {
    const list: RoomTileData[] = [];

    for (let floor = 1; floor <= 4; floor++) {
      for (let i = 1; i <= 12; i++) {
        const no = `${floor}${String(i).padStart(2, '0')}`;
        const { tag, full } = getRoomType(no);

        // Find existing state room if any
        const existing = stateRooms.find((r) => r.no === no);
        const override = roomOverrides[no];

        let readiness: Readiness = existing?.readiness ?? 'ready';
        let occupied = existing?.occupied ?? false;
        let dnd = existing?.dnd ?? false;

        // Apply local overrides if changed by user
        if (override) {
          if (override.readiness !== undefined) readiness = override.readiness;
          if (override.occupied !== undefined) occupied = override.occupied;
          if (override.dnd !== undefined) dnd = override.dnd;
        }

        // Specific seeds if not in state
        if (!existing && !override) {
          if (no === '104' || no === '304') readiness = 'cleaning';
          if (no === '206') readiness = 'dirty';
          if (no === '308') readiness = 'out_of_order';
          if (no === '403') readiness = 'inspection_pending';
          if (no === '305') dnd = true;
        }

        // Match stay
        const stay = stays.find((s) => s.room === no && s.status !== 'checked_out');
        const expectedStay = stays.find((s) => s.room === no && s.status === 'expected');
        const checkedOutStay = stays.find((s) => s.room === no && s.status === 'checked_out');

        let statusKind: RoomTileData['statusKind'] = 'ready';
        let statusLabel = 'Ready';

        if (dnd) {
          statusKind = 'dnd';
          statusLabel = 'DND';
        } else if (stay && stay.status === 'in_house') {
          occupied = true;
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
        } else if (readiness === 'cleaning' || readiness === 'inspection_pending') {
          statusKind = 'cleaning';
          statusLabel = 'Cleaning';
        } else if (readiness === 'dirty' || readiness === 'out_of_order') {
          statusKind = 'dirty';
          statusLabel = readiness === 'out_of_order' ? 'Out of Order' : 'Dirty';
        } else if (occupied) {
          statusKind = 'occupied';
          statusLabel = 'Occupied';
        } else {
          statusKind = 'ready';
          statusLabel = 'Ready';
        }

        list.push({
          no,
          floor,
          readiness,
          occupied,
          dnd,
          typeTag: tag,
          typeFull: full,
          statusLabel,
          statusKind,
          guestName: stay?.guest ?? expectedStay?.guest,
          vip: stay?.vip ?? expectedStay?.vip,
          stay: stay ?? expectedStay ?? checkedOutStay,
          pin: getRoomPin(no),
        });
      }
    }
    return list;
  }, [stateRooms, stays, roomOverrides]);

  // Compute live counts for left sidebar
  const counts = useMemo(() => {
    return {
      all: allRooms.length,
      ready: allRooms.filter((r) => r.statusKind === 'ready').length,
      occupied: allRooms.filter((r) => r.statusKind === 'occupied' || r.occupied).length,
      dirty_cleaning: allRooms.filter((r) => r.statusKind === 'dirty' || r.statusKind === 'cleaning').length,
      checkin: allRooms.filter((r) => r.statusKind === 'checkin' || stays.some((s) => s.room === r.no && s.status === 'expected')).length,
      checkout: allRooms.filter((r) => r.statusKind === 'checkout' || stays.some((s) => s.room === r.no && s.status === 'in_house' && s.departsToday)).length,
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
      if (activeStatusFilter === 'dirty_cleaning' && !(r.statusKind === 'dirty' || r.statusKind === 'cleaning')) return false;
      if (activeStatusFilter === 'checkin' && !(r.statusKind === 'checkin' || stays.some((s) => s.room === r.no && s.status === 'expected'))) return false;
      if (activeStatusFilter === 'checkout' && !(r.statusKind === 'checkout' || stays.some((s) => s.room === r.no && s.status === 'in_house' && s.departsToday))) return false;
      if (activeStatusFilter === 'dnd' && !r.dnd) return false;

      // Search query
      if (q) {
        const text = `${r.no} ${r.typeFull} ${r.guestName ?? ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allRooms, activeStatusFilter, selectedFloorFilter, searchQuery, stays]);

  // Group rooms by floor (1 to 4)
  const floorsList = [1, 2, 3, 4];

  const toggleFloorCollapse = (fl: number) => {
    setCollapsedFloors((prev) => ({ ...prev, [fl]: !prev[fl] }));
  };

  // Active drawer room
  const drawerRoom = allRooms.find((r) => r.no === drawerRoomNo);

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
              );
            })}
          </div>
        </div>

        {/* Bottom Zone — FLOOR & QUICK SEARCH (Front Desk Controls) */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
            Floor &amp; Quick Search
          </p>

          {/* Search Room or Guest */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              placeholder="Search room or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field w-full text-xs py-1.5 pl-8 rounded-lg bg-black/40 border-white/10 text-mist-200 placeholder:text-mist-500"
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

          {/* Quick Floor Filter Buttons */}
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-mist-400">Floor Jump:</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedFloorFilter('all')}
                className={cn(
                  'px-2 py-1 rounded-lg border text-center transition font-semibold',
                  selectedFloorFilter === 'all'
                    ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-200'
                    : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5',
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
                    'px-2 py-1 rounded-lg border text-center transition font-semibold',
                    selectedFloorFilter === fl
                      ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5',
                  )}
                >
                  Floor {fl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MIDDLE COLUMN: High-Density Square Room Tiles Grouped by Floor */}
      {/* ============================================================== */}
      <div className="flex-1 min-w-0 h-auto lg:h-full flex flex-col rounded-xl sm:rounded-2xl border border-white/10 bg-ink-900/60 p-3 sm:p-4 shadow-lg overflow-visible lg:overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white tracking-tight">Room Board</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-cyan-300 border border-white/10 tabular-nums">
              {filteredRooms.length} Rooms
            </span>
          </div>

          {(activeStatusFilter !== 'all' || selectedFloorFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveStatusFilter('all');
                setSelectedFloorFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          )}
        </div>

        {/* Scrollable Room Board grouped by Floor (Floors 1 to 4 with 12 rooms each) */}
        <div className="flex-1 min-h-0 overflow-visible lg:overflow-y-auto pr-0 lg:pr-1 space-y-4 sm:space-y-5">
          {filteredRooms.length === 0 ? (
            <div className="p-12 text-center text-sm text-mist-400 flex flex-col items-center gap-2">
              <BedDouble className="h-8 w-8 text-mist-500" />
              <p>No rooms match the selected filters or search query.</p>
            </div>
          ) : (
            floorsList.map((fl) => {
              const floorRooms = filteredRooms.filter((r) => r.floor === fl);
              if (floorRooms.length === 0) return null;

              const isCollapsed = collapsedFloors[fl] ?? false;
              const info = FLOOR_INFO[fl];

              return (
                <section key={fl} className="space-y-2.5">
                  {/* Collapsible Floor Header Row */}
                  <button
                    type="button"
                    onClick={() => toggleFloorCollapse(fl)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition text-xs font-bold text-mist-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-mist-400 transition-transform group-hover:text-white',
                          isCollapsed && '-rotate-90',
                        )}
                      />
                      <span className="text-white uppercase tracking-wider">{info.name}</span>
                      <span className="text-[11px] font-normal text-mist-400">({info.wing})</span>
                    </div>
                    <span className="text-[11px] font-semibold text-mist-400 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 tabular-nums">
                      {floorRooms.length} rooms
                    </span>
                  </button>

                  {/* Clean Square Room Tiles (12 rooms per floor) */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-2.5">
                      {floorRooms.map((room) => {
                        // Tile Border & Background tone
                        let tileClasses =
                          'border-white/10 bg-white/[0.02] hover:border-white/30 text-white';
                        let StatusIcon = CheckCircle2;
                        let statusColor = 'text-emerald-400';
                        let showDot = false;
                        let dotColor = 'bg-amber-400';

                        if (room.dnd) {
                          tileClasses =
                            'border-rose-500/30 bg-rose-500/[0.06] hover:border-rose-500/50';
                          StatusIcon = MoonStar;
                          statusColor = 'text-rose-400';
                          showDot = true;
                          dotColor = 'bg-rose-500 animate-pulse';
                        } else if (room.statusKind === 'checkout') {
                          tileClasses =
                            'border-amber-500/30 bg-amber-500/[0.06] hover:border-amber-500/50';
                          StatusIcon = LogOut;
                          statusColor = 'text-amber-400';
                          showDot = true;
                          dotColor = 'bg-amber-400';
                        } else if (room.statusKind === 'checkin') {
                          tileClasses =
                            'border-cyan-500/30 bg-cyan-500/[0.06] hover:border-cyan-500/50';
                          StatusIcon = LogIn;
                          statusColor = 'text-cyan-300';
                        } else if (room.statusKind === 'occupied' || room.occupied) {
                          tileClasses =
                            'border-sky-500/25 bg-sky-500/[0.05] hover:border-sky-500/45';
                          StatusIcon = KeyRound;
                          statusColor = 'text-sky-300';
                        } else if (room.statusKind === 'cleaning' || room.statusKind === 'dirty') {
                          tileClasses =
                            'border-amber-500/25 bg-amber-500/[0.05] hover:border-amber-500/45';
                          StatusIcon = Sparkles;
                          statusColor = 'text-amber-300';
                          showDot = true;
                          dotColor = 'bg-amber-400';
                        } else {
                          // Ready
                          tileClasses =
                            'border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/45';
                          StatusIcon = CheckCircle2;
                          statusColor = 'text-emerald-400';
                        }

                        return (
                          <button
                            key={room.no}
                            type="button"
                            onClick={() => setDrawerRoomNo(room.no)}
                            className={cn(
                              'aspect-[1/0.92] p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 relative overflow-hidden group cursor-pointer',
                              tileClasses,
                            )}
                          >
                            {/* Top Corner: Status Icon & Type Tag */}
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">
                                {room.typeTag}
                              </span>
                              <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', statusColor)} />
                            </div>

                            {/* Center: Large Bold Centered Room Number */}
                            <div className="flex items-center justify-center gap-1.5 my-auto">
                              {showDot && (
                                <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
                              )}
                              <span className="text-lg sm:text-2xl font-black tracking-tight tabular-nums text-white group-hover:text-cyan-200 transition-colors">
                                {room.no}
                              </span>
                            </div>

                            {/* Bottom: Concise 1-line Room Type + Status/Guest pill */}
                            <div className="w-full text-center">
                              <span className="inline-block w-full truncate rounded-md px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-white/5 border border-white/10 text-mist-200 leading-tight">
                                {room.statusLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
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
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[999] transition-opacity animate-fade-in"
            onClick={() => setDrawerRoomNo(null)}
          />

          {/* Drawer Slide-Over Panel */}
          <aside
            className="fixed top-0 right-0 w-full sm:w-[420px] h-full sm:h-screen bg-ink-950 border-l border-white/10 z-[1000] shadow-2xl flex flex-col justify-between overflow-hidden animate-[fd-slide-from-right_0.25s_cubic-bezier(0.16,1,0.3,1)]"
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
                  onClick={() => setDrawerRoomNo(null)}
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
                  {/* Guest & Stay Summary Card */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
                      Stay &amp; Guest Summary
                    </p>
                    {drawerRoom.stay ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">
                            {drawerRoom.stay.guest}
                          </span>
                          {drawerRoom.stay.vip && <Badge tone="accent">VIP</Badge>}
                        </div>
                        <p className="text-mist-300">
                          Dates: {drawerRoom.stay.arrival} → {drawerRoom.stay.departure}
                        </p>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                          <span className="text-mist-400">Folio Balance:</span>
                          <span className="font-bold text-emerald-300">$0.00 (Settled)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-white font-semibold">Vacant &amp; Inspected</p>
                        <p className="text-mist-400 text-[11px]">
                          Ready for immediate walk-in assignment or scheduled arrival check-in.
                        </p>
                      </div>
                    )}
                  </div>

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
