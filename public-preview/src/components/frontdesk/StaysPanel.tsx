'use client';

import { useEffect, useRef, useState, useId } from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  BedDouble,
  CircleAlert,
  CircleCheck,
  Folder,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  Smartphone,
  Calendar,
  Filter as FilterIcon,
  Bell,
  Building,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  ChevronDown,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { LivePassDialog } from '@/components/frontdesk/LivePassDialog';
import { READINESS_TONE } from '@/components/frontdesk/RoomsPanel';
import {
  READINESS_LABEL,
  addStay,
  checkIn,
  checkInBlocker,
  checkOut,
  checkoutBlockers,
  decideEarlyCheckIn,
  inr,
  manualVerifyId,
  markRoomReady,
  moveRoom,
  openDisputeCount,
  settleBalance,
  stayBalance,
  type StayCategory,
} from '@/lib/frontDesk';
import { DEMO_TODAY, fmtDay, parseDemoDay } from '@/lib/bookings';
import { EARLY_CHECKIN_FEE, ROOM_TYPES, roomByNo, roomTypeById } from '@/lib/hotelCatalog';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { RoomRecord, StayRecord } from '@/types/demo';

type Filter = 'all' | 'arrivals' | 'inhouse' | 'departures';
type TimePeriod = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'tahun_ini';
type Dialog = { kind: 'verify' | 'checkout' | 'move' | 'livepass'; stayId: string } | { kind: 'add' } | null;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All (Booked)' },
  { id: 'arrivals', label: 'Arrivals (Check In)' },
  { id: 'inhouse', label: 'In House' },
  { id: 'departures', label: 'Departures (Check Out)' },
];

const TIME_PERIODS: Array<{ id: TimePeriod; label: string }> = [
  { id: 'hari_ini', label: 'Hari Ini' },
  { id: 'minggu_ini', label: 'Minggu Ini' },
  { id: 'bulan_ini', label: 'Bulan Ini' },
  { id: 'tahun_ini', label: 'Tahun Ini' },
];

const MOVE_REASONS = ['AC or maintenance fault', 'Noise complaint', 'Guest-requested upgrade', 'Room not as booked', 'Safety concern'];
const ORDER: Record<StayRecord['status'], number> = { expected: 0, in_house: 1, checked_out: 2 };

const catalogTypeName = (no: string): string | undefined => roomTypeById[roomByNo[no]?.typeId ?? '']?.name;
const departureIso = (st: StayRecord) => st.departureDate ?? parseDemoDay(st.departure);
const isDepartingToday = (st: StayRecord) => st.status === 'in_house' && (Boolean(st.departsToday) || departureIso(st) === DEMO_TODAY);
const idIsVerified = (st: StayRecord) => st.idChecked || st.idVerificationStatus === 'verified';

export function StaysPanel({ initialFilter = 'all' }: { initialFilter?: Filter }) {
  const { state, fdAction } = useDemo();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('hari_ini');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const stays = state.frontDesk?.stays ?? [];
  const rooms = state.frontDesk?.rooms ?? [];
  const folios = state.folios ?? {};
  const feed = state.feed ?? [];
  const term = query.trim().toLowerCase();

  const matches = (st: StayRecord, f: Filter) => {
    if (f === 'arrivals') return st.status === 'expected';
    if (f === 'inhouse') return st.status === 'in_house';
    if (f === 'departures') return isDepartingToday(st);
    return true;
  };

  const counts: Record<Filter, number> = {
    all: stays.length,
    arrivals: stays.filter((st) => matches(st, 'arrivals')).length,
    inhouse: stays.filter((st) => matches(st, 'inhouse')).length,
    departures: stays.filter((st) => matches(st, 'departures')).length,
  };

  // Calculate live room counts (total 133 or based on catalog/state)
  const totalRoomsCount = Math.max(rooms.length, 133);
  const occupiedRoomsCount = rooms.filter((r) => r.occupied).length || counts.inhouse || 17;
  const outOfOrderCount = rooms.filter((r) => r.readiness === 'out_of_order' || r.readiness === 'cleaning').length || 0;
  const availableRoomsCount = Math.max(0, totalRoomsCount - occupiedRoomsCount - outOfOrderCount);
  const occupancyPct = ((occupiedRoomsCount / totalRoomsCount) * 100).toFixed(1);

  // Revenue calculation from folios or stays
  const totalFolioRevenue = Object.values(folios).reduce(
    (acc, lines) => acc + lines.reduce((sub, line) => sub + (line.amount || 0), 0),
    0
  );
  const revenueDisplay = totalFolioRevenue > 0 ? inr(totalFolioRevenue) : 'IDR 0';

  const rows = stays
    .filter((st) => {
      const text = `${st.guest} ${st.room} ${st.roomType}`.toLowerCase();
      if (term && !text.includes(term)) return false;
      return matches(st, filter);
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const dialogStay = dialog && 'stayId' in dialog ? stays.find((st) => st.id === dialog.stayId) : undefined;

  return (
    <div className="w-full space-y-6 rounded-3xl bg-[#F8FAFC] p-4 text-slate-800 shadow-sm border border-slate-200/80 sm:p-6 lg:p-7 transition-all font-sans">
      {/* 1. Header with Period Selector & Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard Hotel
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Overview operasional &amp; performa hotel secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Capsule */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Periode</span>
            <span className="text-slate-400">|</span>
            <span className="tabular-nums text-slate-700">22-05-2026 - 22-05-2026</span>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
            {TIME_PERIODS.map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setTimePeriod(tp.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  timePeriod === tp.id
                    ? 'bg-[#1D68FE] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {tp.label}
              </button>
            ))}
          </div>

          {/* Filter Action */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
            <span>Filter</span>
          </button>

          {/* Add Stay Action */}
          <button
            type="button"
            onClick={() => setDialog({ kind: 'add' })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D68FE] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1253E0] active:scale-95 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Stay</span>
          </button>
        </div>
      </div>

      {/* 2. AKTIVITAS HARI INI - 4 Full Gradient Hero Metric Cards */}
      <section aria-labelledby="section-hero-metrics">
        <h2 id="section-hero-metrics" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Aktivitas Hari Ini
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Blue Card: Check-In Hari Ini */}
          <div
            onClick={() => setFilter('arrivals')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D68FE] to-[#0D4FDE] p-4 text-white shadow-[0_4px_16px_rgba(29,104,254,0.22)] transition-all hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(29,104,254,0.3)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-xs">
                <Bell className="h-5 w-5 text-white" />
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                <ArrowUpRight className="h-3 w-3" />
                <span>25% dari kemarin</span>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight tabular-nums">
                {counts.arrivals}
              </div>
              <div className="mt-1 text-xs font-medium text-blue-100">
                Check-In Hari Ini
              </div>
            </div>
          </div>

          {/* Cyan Card: Check-Out Hari Ini */}
          <div
            onClick={() => setFilter('departures')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#00A3FF] to-[#008BE3] p-4 text-white shadow-[0_4px_16px_rgba(0,163,255,0.22)] transition-all hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(0,163,255,0.3)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-xs">
                <LogOut className="h-5 w-5 text-white" />
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                <ArrowDownRight className="h-3 w-3" />
                <span>0% dari kemarin</span>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight tabular-nums">
                {counts.departures}
              </div>
              <div className="mt-1 text-xs font-medium text-sky-100">
                Check-Out Hari Ini
              </div>
            </div>
          </div>

          {/* Emerald Card: Tingkat Hunian (Occupancy Rate) */}
          <div
            onClick={() => setFilter('inhouse')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#00B074] to-[#008F5D] p-4 text-white shadow-[0_4px_16px_rgba(0,176,116,0.22)] transition-all hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(0,176,116,0.3)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-xs">
                <Home className="h-5 w-5 text-white" />
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                <ArrowUpRight className="h-3 w-3" />
                <span>8.4% dari kemarin</span>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight tabular-nums">
                {occupancyPct}%
              </div>
              <div className="mt-1 text-xs font-medium text-emerald-100">
                Tingkat Hunian
              </div>
            </div>
          </div>

          {/* Amber Card: Revenue Periode */}
          <div
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF9F29] to-[#E6820D] p-4 text-white shadow-[0_4px_16px_rgba(255,159,41,0.22)] transition-all hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(255,159,41,0.3)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-xs">
                <CreditCard className="h-5 w-5 text-white" />
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                <span>— 0% dari kemarin</span>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                {revenueDisplay}
              </div>
              <div className="mt-1 text-xs font-medium text-amber-100">
                Revenue Periode
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RINGKASAN BOOKING - 4 White Cards with Left Color Border */}
      <section aria-labelledby="section-booking-summary">
        <h2 id="section-booking-summary" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Ringkasan Booking (22-05-2026 - 22-05-2026)
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Total Booking (Blue) */}
          <div
            onClick={() => setFilter('all')}
            className={cn(
              'group cursor-pointer rounded-2xl bg-white p-4 shadow-sm border border-slate-100 border-l-4 border-l-[#1D68FE] transition hover:shadow-md',
              filter === 'all' && 'ring-2 ring-blue-500/20'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1D68FE]">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Booking
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {counts.all}
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-400">
              Semua status kamar
            </p>
          </div>

          {/* Card 2: Booking Confirmed (Green) */}
          <div
            onClick={() => setFilter('inhouse')}
            className={cn(
              'group cursor-pointer rounded-2xl bg-white p-4 shadow-sm border border-slate-100 border-l-4 border-l-[#00B074] transition hover:shadow-md',
              filter === 'inhouse' && 'ring-2 ring-emerald-500/20'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#00B074]">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Booking Confirmed
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {counts.inhouse}
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-emerald-600 font-medium">
              ↑ 0% dari total
            </p>
          </div>

          {/* Card 3: Booking Pending (Amber) */}
          <div
            onClick={() => setFilter('arrivals')}
            className={cn(
              'group cursor-pointer rounded-2xl bg-white p-4 shadow-sm border border-slate-100 border-l-4 border-l-[#FF9F29] transition hover:shadow-md',
              filter === 'arrivals' && 'ring-2 ring-amber-500/20'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-[#FF9F29]">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Booking Pending
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {counts.arrivals}
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-amber-600 font-medium">
              Menunggu konfirmasi / check-in
            </p>
          </div>

          {/* Card 4: Booking Cancelled (Rose) */}
          <div
            className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 border-l-4 border-l-[#FF4D4F] transition hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-[#FF4D4F]">
                <XCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Booking Cancelled
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  0
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-400">
              ↓ 0% cancellation rate
            </p>
          </div>
        </div>
      </section>

      {/* 4. STATUS KAMAR & TAMU - 4 White Cards with Bottom Sparkline Wave */}
      <section aria-labelledby="section-room-status">
        <h2 id="section-room-status" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Status Kamar &amp; Tamu
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Total Kamar */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-4 pb-2 shadow-sm border border-slate-100 border-l-4 border-l-[#3B82F6]">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#3B82F6]">
                <Home className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Kamar
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {totalRoomsCount}
                </p>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Kamar aktif terdaftar
            </p>
            {/* Sparkline Wave (Blue) */}
            <div className="mt-2 h-7 w-full text-blue-500/70">
              <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                <path d="M0,16 Q15,8 30,14 T60,10 T90,16 L100,12" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Kamar Tersedia (Green) */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-4 pb-2 shadow-sm border border-slate-100 border-l-4 border-l-[#00B074]">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-[#00B074] shadow-xs" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kamar Tersedia
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {availableRoomsCount}
                </p>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Siap dipesan
            </p>
            {/* Sparkline Wave (Green) */}
            <div className="mt-2 h-7 w-full text-emerald-500/70">
              <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                <path d="M0,18 Q20,10 40,16 T70,8 T100,14" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Kamar Terbooking (Cyan) */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-4 pb-2 shadow-sm border border-slate-100 border-l-4 border-l-[#00A3FF]">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-[#00A3FF] shadow-xs" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kamar Terbooking
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {occupiedRoomsCount}
                </p>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Sedang dihuni / reserved
            </p>
            {/* Sparkline Wave (Cyan) */}
            <div className="mt-2 h-7 w-full text-sky-500/70">
              <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                <path d="M0,14 Q25,20 50,10 T80,16 T100,8" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Kamar Tidak Siap (Red) */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-4 pb-2 shadow-sm border border-slate-100 border-l-4 border-l-[#FF4D4F]">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-[#FF4D4F] shadow-xs" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kamar Tidak Siap
                </p>
                <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
                  {outOfOrderCount}
                </p>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Maintenance / housekeeping
            </p>
            {/* Sparkline Wave (Red) */}
            <div className="mt-2 h-7 w-full text-rose-500/70">
              <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                <path d="M0,16 Q30,14 60,18 T100,15" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Analytics Grid: Occupancy Donut, Check-In vs Check-Out Bar Chart & Aktivitas Terbaru */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut Chart: Occupancy Overview */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Occupancy Overview</h3>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Hari Ini <ChevronDown className="h-3 w-3" />
            </span>
          </div>

          <div className="my-4 flex items-center justify-center gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                {/* Available Ring (Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#00B074"
                  strokeWidth="12"
                  strokeDasharray="238.76"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Occupied Ring (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#1D68FE"
                  strokeWidth="12"
                  strokeDasharray="238.76"
                  strokeDashoffset="195"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-slate-900 leading-none">
                  {occupancyPct}%
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Occupancy</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1D68FE]" />
                  Occupied
                </span>
                <span className="font-bold text-slate-800 tabular-nums">{occupiedRoomsCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00B074]" />
                  Available
                </span>
                <span className="font-bold text-slate-800 tabular-nums">{availableRoomsCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF4D4F]" />
                  Out of Order
                </span>
                <span className="font-bold text-slate-800 tabular-nums">{outOfOrderCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Check-In vs Check-Out */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Check-In vs Check-Out</h3>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Hari Ini <ChevronDown className="h-3 w-3" />
            </span>
          </div>

          <div className="my-2 flex items-center justify-end gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-[#1D68FE]" />
              Check-In
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-[#00B074]" />
              Check-Out
            </span>
          </div>

          {/* Bar Chart Visual */}
          <div className="mt-2 flex h-28 items-end justify-between gap-2 border-b border-slate-100 pb-1 text-[10px] text-slate-400">
            {[
              { slot: '00:00', inH: 20, outH: 0 },
              { slot: '06:00', inH: 45, outH: 25 },
              { slot: '12:00', inH: 75, outH: 60 },
              { slot: '18:00', inH: 90, outH: 40 },
              { slot: '24:00', inH: 30, outH: 15 },
            ].map((bar) => (
              <div key={bar.slot} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-1 h-20 w-full justify-center">
                  <div
                    style={{ height: `${bar.inH}%` }}
                    className="w-2.5 rounded-t-sm bg-[#1D68FE] transition-all hover:opacity-80"
                  />
                  <div
                    style={{ height: `${bar.outH}%` }}
                    className="w-2.5 rounded-t-sm bg-[#00B074] transition-all hover:opacity-80"
                  />
                </div>
                <span>{bar.slot}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h3>
            <span className="text-[11px] font-semibold text-[#1D68FE] cursor-pointer hover:underline">
              Lihat Semua
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: LogIn,
                iconTone: 'bg-blue-50 text-[#1D68FE]',
                title: 'Check-In Baru',
                desc: 'Tamu Mr. John Doe - Room 202',
                time: '10:24 AM',
              },
              {
                icon: Sparkles,
                iconTone: 'bg-emerald-50 text-[#00B074]',
                title: 'Kamar 104 Dibersihkan',
                desc: 'Housekeeping - Selesai',
                time: '09:45 AM',
              },
              {
                icon: LogOut,
                iconTone: 'bg-rose-50 text-[#FF4D4F]',
                title: 'Check-Out',
                desc: 'Tamu Ms. Jane Smith - Room 305',
                time: '09:20 AM',
              },
              {
                icon: CreditCard,
                iconTone: 'bg-amber-50 text-[#FF9F29]',
                title: 'Pembayaran Diterima',
                desc: 'IDR 2,350,000 - Room 201',
                time: '09:10 AM',
              },
            ].map((act, i) => {
              const ActIcon = act.icon;
              return (
                <div key={i} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', act.iconTone)}>
                      <ActIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{act.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{act.desc}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400 tabular-nums">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Guest Stays List & Action Section */}
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#1D68FE]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Daftar Reservasi &amp; Stays</h2>
              <p className="text-xs text-slate-500">Arrivals, in-house guests and scheduled departures</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="stay-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tamu atau nomor kamar..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#1D68FE] focus:bg-white focus:outline-none transition shadow-xs"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div role="group" aria-label="Filter stays" className="flex flex-wrap gap-2 pt-1 border-b border-slate-100 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                filter === f.id
                  ? 'bg-[#1D68FE] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums',
                  filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                )}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Rows List */}
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <BedDouble className="h-6 w-6 text-slate-400" aria-hidden />
            <p className="text-sm font-medium text-slate-500">
              {term ? `Tidak ada tamu yang cocok dengan “${query}”.` : 'Tidak ada reservasi di kategori ini.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((st) => (
              <StayCard key={st.id} stay={st} onDialog={(kind) => setDialog({ kind, stayId: st.id })} />
            ))}
          </ul>
        )}
      </section>

      {/* Dialogs */}
      {dialog?.kind === 'add' && <AddStayDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === 'verify' && dialogStay && <VerifyIdDialog stay={dialogStay} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'checkout' && dialogStay && (
        <CheckoutDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onSettle={() => fdAction((s) => settleBalance(s, dialogStay.id))}
          onCheckout={() => {
            if (!fdAction((s) => checkOut(s, dialogStay.id))) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'move' && dialogStay && (
        <MoveDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onConfirm={(toRoom, reason, roomType) => {
            if (!fdAction((s) => moveRoom(s, dialogStay.id, toRoom, reason, roomType))) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'livepass' && dialogStay && <LivePassDialog stay={dialogStay} onClose={() => setDialog(null)} />}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Moobi Styled Stay Card                                                */
/* --------------------------------------------------------------------- */

function checkInHint(stay: StayRecord, room: RoomRecord | undefined, blocker: string | null): string | null {
  if (!blocker) return null;
  if (stay.arrivalDate && stay.arrivalDate > DEMO_TODAY) return `Arrives ${fmtDay(stay.arrivalDate)}`;
  if (!idIsVerified(stay)) return 'Verify ID first';
  if (!room) return `Room ${stay.room} not found`;
  if (room.occupied) return `Room ${room.no} is occupied`;
  if (room.readiness !== 'ready') return `Room ${room.no} must be Ready`;
  return 'Not ready yet';
}

function StayCard({ stay, onDialog }: { stay: StayRecord; onDialog: (kind: 'verify' | 'checkout' | 'move' | 'livepass') => void }) {
  const { state, fdAction } = useDemo();
  const [cleanerAssigned, setCleanerAssigned] = useState(false);
  const room = (state.frontDesk?.rooms ?? []).find((r) => r.no === stay.room);
  const arriving = stay.status === 'expected';
  const inHouse = stay.status === 'in_house';
  const checkedOut = stay.status === 'checked_out';
  const blocker = arriving ? checkInBlocker(state, stay) : null;
  const hint = checkInHint(stay, room, blocker);
  const roomReady = Boolean(room && room.readiness === 'ready' && !room.occupied);
  const balance = stayBalance(state, stay);
  const early = stay.earlyCheckIn && stay.earlyCheckIn.status !== 'declined' ? stay.earlyCheckIn : undefined;
  const verified = idIsVerified(stay);

  // Status color accent on left border
  const borderTone = arriving
    ? 'border-l-[#1D68FE]'
    : inHouse
      ? 'border-l-[#00B074]'
      : 'border-l-slate-300';

  return (
    <li
      className={cn(
        'group rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 border-l-4 transition hover:shadow-md',
        borderTone
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{stay.guest}</h3>
            {stay.vip && (
              <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 tracking-wide uppercase">
                VIP
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              Kamar {stay.room}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            {stay.roomType} · {stay.nights} malam ·{' '}
            {arriving
              ? `Tiba ${stay.arrival}`
              : inHouse
                ? `Berangkat ${stay.departure}`
                : `Check-out ${stay.departure}`}
            {stay.movedFrom ? ` · Dipindah dari ${stay.movedFrom}` : ''}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {arriving && (
              <>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    verified
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  )}
                >
                  {verified ? '✓ ID Terverifikasi' : '⚠ Perlu Cek ID'}
                </span>
                {room && (
                  <RoomReadinessTag
                    room={room}
                    onMarkReady={() => fdAction((s) => markRoomReady(s, room.no))}
                  />
                )}
                {early && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold">
                    {early.status === 'approved'
                      ? `Early Check-In Disetujui · ${inr(early.fee)}`
                      : `Permintaan Early Check-In · ${inr(early.fee)}`}
                  </span>
                )}
              </>
            )}

            {inHouse && (
              <>
                {isDepartingToday(stay) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-[11px] font-semibold">
                    Check-Out Hari Ini
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    balance > 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  )}
                >
                  {balance > 0 ? `Sisa Tagihan ${inr(balance)}` : 'Lunas (Settled)'}
                </span>
              </>
            )}

            {checkedOut && (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold">
                  Sudah Check-out
                </span>
                {cleanerAssigned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
                    Turnover Ditugaskan · Housekeeping
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold">
                    Perlu Pembersihan Kamar
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {arriving && (
            <>
              {!verified && (
                <button
                  type="button"
                  onClick={() => onDialog('verify')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                  <span>Verifikasi ID</span>
                </button>
              )}
              {early?.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={!roomReady}
                    title={roomReady ? undefined : `Kamar ${stay.room} harus Siap sebelum early check-in disetujui`}
                    onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, true))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 disabled:opacity-50 transition"
                  >
                    Setujui Early · {inr(early.fee)}
                  </button>
                  <button
                    type="button"
                    onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, false))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Tolak Early
                  </button>
                </>
              )}
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled={blocker !== null}
                  title={blocker ?? undefined}
                  onClick={() => fdAction((s) => checkIn(s, stay.id))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D68FE] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1253E0] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Check In</span>
                </button>
                {hint && <span className="text-[11px] text-rose-500 font-medium">{hint}</span>}
              </div>
            </>
          )}

          {inHouse && (
            <>
              <button
                type="button"
                onClick={() => onDialog('livepass')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                <span>Live Pass</span>
              </button>
              <button
                type="button"
                onClick={() => onDialog('move')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Pindah Kamar</span>
              </button>
              <button
                type="button"
                onClick={() => onDialog('checkout')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00A3FF] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#008BE3] active:scale-95 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Folio &amp; Check-Out</span>
              </button>
            </>
          )}

          {checkedOut && (
            <>
              <button
                type="button"
                onClick={() => onDialog('livepass')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                <span>Live Pass</span>
              </button>
              <button
                type="button"
                disabled={cleanerAssigned}
                onClick={() => {
                  setCleanerAssigned(true);
                  fdAction((s) => {
                    const updatedRooms = (s.frontDesk?.rooms ?? []).map((rm) =>
                      rm.no === stay.room ? { ...rm, readiness: 'cleaning' as const, note: 'Housekeeping turnover assigned by Front Desk' } : rm,
                    );
                    return {
                      next: { ...s, frontDesk: { ...s.frontDesk, rooms: updatedRooms } },
                      message: 'Housekeeping turnover assigned',
                    };
                  });
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs',
                  cleanerAssigned
                    ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#00B074] text-white hover:bg-[#008F5D] active:scale-95'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{cleanerAssigned ? 'Cleaner Assigned' : 'Tugaskan Housekeeping'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function RoomReadinessTag({ room, onMarkReady }: { room: RoomRecord; onMarkReady: () => string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (room.readiness === 'ready' && !room.occupied) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
        Kamar {room.no}: Siap
      </span>
    );
  }

  if (room.readiness !== 'inspection_pending') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
          room.occupied
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        )}
      >
        Kamar {room.no}: {room.occupied ? 'Occupied' : READINESS_LABEL[room.readiness]}
      </span>
    );
  }

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Klik untuk menandai kamar Siap"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold hover:bg-amber-100 transition">
          Kamar {room.no}: Menunggu Inspeksi
        </span>
      </button>
      {open && (
        <span
          role="dialog"
          aria-label={`Mark Room ${room.no} Ready`}
          className="absolute left-0 top-full z-20 mt-1.5 block w-64 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs shadow-xl text-slate-700"
        >
          <span className="block font-bold text-slate-900">Tandai Kamar {room.no} Siap?</span>
          <span className="mt-1 block text-slate-500">Demo shortcut: Verifikasi kesiapan kamar untuk tamu yang akan check-in.</span>
          <span className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!onMarkReady()) setOpen(false);
              }}
              className="rounded-lg bg-[#00B074] px-3 py-1 text-xs font-semibold text-white hover:bg-[#008F5D]"
            >
              Tandai Siap
            </button>
          </span>
        </span>
      )}
    </span>
  );
}

/* --------------------------------------------------------------------- */
/* Dialogs                                                               */
/* --------------------------------------------------------------------- */

function VerifyIdDialog({ stay, onClose }: { stay: StayRecord; onClose: () => void }) {
  const { fdAction } = useDemo();
  const [docType, setDocType] = useState(stay.idDocType || 'Passport');
  const [docNumber, setDocNumber] = useState(stay.idDocNumber || `IND-${stay.room}779X`);
  const [tried, setTried] = useState(false);
  const bookingId = stay.bookingRef || `BK-${stay.room}-8402`;
  const numberOk = docNumber.trim().length >= 4;
  const initials = stay.guest
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function confirm() {
    setTried(true);
    if (!numberOk) return;
    const err = fdAction((s) =>
      manualVerifyId(s, stay.id, {
        docType,
        docNumber: docNumber.trim(),
        status: 'verified',
        notes: 'Verified at the Front Desk from the ID preview',
        verifiedBy: 'Front Desk Coordinator',
      }),
    );
    if (!err) onClose();
  }

  return (
    <Modal
      title={`Verify ID · ${stay.guest}`}
      description="Check the document against the booking, then confirm. The card switches to ID Verified."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={CircleCheck} onClick={confirm}>
            Confirm ID verified
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-mist-200">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.05] text-lg font-bold text-white" aria-hidden>
            {initials || <User className="h-6 w-6" />}
          </span>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <dt className="text-mist-400">Name on booking</dt>
              <dd className="truncate font-semibold text-white">{stay.guest}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Booking</dt>
              <dd className="font-semibold text-cyan-300">{bookingId}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Document</dt>
              <dd className="font-medium text-white">{docType}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Number</dt>
              <dd className="font-mono font-medium text-white">{docNumber.trim() ? `•••• ${docNumber.trim().slice(-4)}` : 'Not entered'}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="id-type">Document type</FieldLabel>
            <select id="id-type" value={docType} onChange={(e) => setDocType(e.target.value)} className="field w-full">
              <option value="Passport">Passport</option>
              <option value="Aadhaar / National ID">Aadhaar / National ID</option>
              <option value="Driver's License">Driver&apos;s License</option>
              <option value="Voter ID Card">Voter ID Card</option>
              <option value="Permanent Resident Card">Permanent Resident Card</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="id-number">Document number</FieldLabel>
            <input id="id-number" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="field w-full" aria-invalid={tried && !numberOk} />
            {tried && !numberOk && <p className="mt-1 text-xs text-rose-400">Enter the document number.</p>}
          </div>
        </div>
        <p className="text-[11px] text-mist-400">Frontend demo: no real document is scanned or stored. The result is logged in the Front Desk activity feed.</p>
      </div>
    </Modal>
  );
}

function AddStayDialog({ onClose }: { onClose: () => void }) {
  const { state, fdAction } = useDemo();
  const rooms = state.frontDesk?.rooms ?? [];
  const stays = state.frontDesk?.stays ?? [];
  const eligible = rooms
    .filter((r) => !r.occupied && r.readiness !== 'out_of_order' && !stays.some((st) => st.room === r.no && st.status !== 'checked_out'))
    .sort((a, b) => a.no.localeCompare(b.no));

  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState(eligible[0]?.no ?? '');
  const [roomType, setRoomType] = useState(eligible[0] ? (catalogTypeName(eligible[0].no) ?? ROOM_TYPES[0].name) : ROOM_TYPES[0].name);
  const [category, setCategory] = useState<StayCategory>('arriving');
  const [roomStatus, setRoomStatus] = useState<'ready' | 'inspection_pending'>('ready');
  const [idVerified, setIdVerified] = useState(false);
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [balance, setBalance] = useState('0');
  const [vip, setVip] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const arrivalsOnly = category !== 'arriving';
  const guestOk = guest.trim().length >= 2;
  const balanceNum = Number(balance);
  const balanceOk = balance.trim() !== '' && Number.isFinite(balanceNum) && balanceNum >= 0;

  function pickRoom(no: string) {
    setRoom(no);
    const t = catalogTypeName(no);
    if (t) setRoomType(t);
  }

  function submit() {
    setTried(true);
    setError(null);
    if (!guestOk || !balanceOk || !room) return;
    const err = fdAction((s) =>
      addStay(s, {
        guest,
        room,
        roomType,
        category,
        roomStatus,
        idVerified,
        earlyCheckIn,
        folioBalance: balanceNum,
        vip,
      }),
    );
    if (err) setError(err);
    else onClose();
  }

  const Seg = ({ options, value, onChange, disabled }: { options: Array<{ id: string; label: string }>; value: string; onChange: (id: string) => void; disabled?: boolean }) => (
    <div className={cn('flex flex-wrap gap-1.5', disabled && 'opacity-50')}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', value === o.id ? 'chip-accent' : 'border-white/10 text-mist-300 hover:bg-white/5')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <Modal
      title="Add Stay"
      description="Frontend test booking. It appears in Stays, the Rooms board and the filter counts straight away."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={Plus} disabled={eligible.length === 0} onClick={submit}>
            Add stay
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-mist-300">No vacant rooms are free to assign right now. Check out a guest or reset the demo.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <FieldLabel htmlFor="add-guest">Guest name</FieldLabel>
            <input id="add-guest" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="e.g. Anya Sharma" className="field w-full" aria-invalid={tried && !guestOk} />
            {tried && !guestOk && <p className="mt-1 text-xs text-rose-400">Enter the guest name.</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="add-room">Room number</FieldLabel>
              <select id="add-room" value={room} onChange={(e) => pickRoom(e.target.value)} className="field w-full">
                {eligible.map((r) => (
                  <option key={r.no} value={r.no}>
                    Room {r.no} · Floor {r.floor}
                    {catalogTypeName(r.no) ? ` · ${catalogTypeName(r.no)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="add-type">Room type</FieldLabel>
              <select id="add-type" value={roomType} onChange={(e) => setRoomType(e.target.value)} className="field w-full">
                {ROOM_TYPES.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Stay category</FieldLabel>
            <Seg
              value={category}
              onChange={(id) => setCategory(id as StayCategory)}
              options={[
                { id: 'arriving', label: 'Arriving' },
                { id: 'in_house', label: 'In House' },
                { id: 'departing', label: 'Departing' },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Initial room status</FieldLabel>
              <Seg
                disabled={arrivalsOnly}
                value={roomStatus}
                onChange={(id) => setRoomStatus(id as typeof roomStatus)}
                options={[
                  { id: 'ready', label: 'Ready' },
                  { id: 'inspection_pending', label: 'Awaiting Inspection' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Initial ID status</FieldLabel>
              <Seg
                disabled={arrivalsOnly}
                value={idVerified ? 'verified' : 'needed'}
                onChange={(id) => setIdVerified(id === 'verified')}
                options={[
                  { id: 'needed', label: 'ID Check Needed' },
                  { id: 'verified', label: 'ID Verified' },
                ]}
              />
            </div>
          </div>
          {arrivalsOnly && <p className="-mt-2 text-[11px] text-mist-400">Room status, ID status and early check-in apply to arrivals. In-house guests are already verified in an occupied room.</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="add-balance">Initial folio balance (₹)</FieldLabel>
              <input id="add-balance" type="number" min={0} step="1" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className="field w-full" aria-invalid={tried && !balanceOk} />
              {tried && !balanceOk && <p className="mt-1 text-xs text-rose-400">Enter 0 or more.</p>}
            </div>
            <div className="flex flex-col justify-end gap-2.5 pb-1">
              <label className={cn('flex cursor-pointer items-center gap-2.5 text-xs text-mist-200', arrivalsOnly && 'cursor-not-allowed opacity-50')}>
                <input type="checkbox" disabled={arrivalsOnly} checked={earlyCheckIn && !arrivalsOnly} onChange={(e) => setEarlyCheckIn(e.target.checked)} className="h-4 w-4" />
                <span>Request Early Check-In ({inr(EARLY_CHECKIN_FEE)})</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-mist-200">
                <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} className="h-4 w-4" />
                <span>VIP guest</span>
              </label>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function CheckoutDialog({
  stay,
  onClose,
  onSettle,
  onCheckout,
}: {
  stay: StayRecord;
  onClose: () => void;
  onSettle: () => void;
  onCheckout: () => void;
}) {
  const { state } = useDemo();
  const lines = state.folios[stay.room] ?? [];
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const balance = stayBalance(state, stay);
  const blockers = checkoutBlockers(state, stay);
  const disputes = openDisputeCount(state, stay.room);

  return (
    <Modal
      title={`Folio & checkout · Room ${stay.room}`}
      description={`${stay.guest}. Digital checkout needs a ₹0 balance and no open disputes (F34).`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          {balance > 0 && (
            <Button variant="ghost" onClick={onSettle} iconLeft={Folder}>
              Collect {inr(balance)} · card {stay.cardMask}
            </Button>
          )}
          <Button variant="accent" iconLeft={LogOut} disabled={blockers.length > 0} onClick={onCheckout}>
            Check out and revoke QR session
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-white/[0.08] rounded-xl border border-white/10 text-sm">
        {lines.length === 0 && <li className="px-3 py-3 text-mist-400">No charges on this folio.</li>}
        {lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0 text-mist-200">
              {l.label}
              {l.disputed && (
                <span className="ml-2 align-middle">
                  <Badge tone="warning">Disputed</Badge>
                </span>
              )}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-white">{inr(l.amount)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Charges</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{inr(total)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Paid</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{inr(stay.paid)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Balance</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{inr(balance)}</dd>
        </div>
      </dl>
      <ul className="space-y-1.5 text-sm" aria-label="Checkout checklist">
        <li className="flex items-center gap-2 text-mist-200">
          {balance <= 0 ? <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> : <CircleAlert className="h-4 w-4 text-amber-400" aria-hidden />}
          {balance <= 0 ? 'Balance is ₹0' : `Balance of ${inr(balance)} outstanding`}
        </li>
        <li className="flex items-center gap-2 text-mist-200">
          {disputes === 0 ? <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> : <CircleAlert className="h-4 w-4 text-amber-400" aria-hidden />}
          {disputes === 0 ? 'No open folio disputes' : `${disputes} dispute${disputes === 1 ? '' : 's'} waiting on Finance`}
        </li>
      </ul>
      <p className="text-[11px] text-mist-400">Cards appear only as masked tokens. Collecting payment here is simulated; no real processor is involved.</p>
    </Modal>
  );
}

function MoveDialog({ stay, onClose, onConfirm }: { stay: StayRecord; onClose: () => void; onConfirm: (toRoom: string, reason: string, roomType: string) => void }) {
  const { state } = useDemo();
  const reserved = new Set((state.frontDesk?.stays ?? []).filter((st) => st.status === 'expected').map((st) => st.room));
  const candidates = (state.frontDesk?.rooms ?? []).filter((r) => !r.occupied && r.readiness === 'ready' && !r.dnd && r.no !== stay.room && !reserved.has(r.no));
  const [toRoom, setToRoom] = useState(candidates[0]?.no ?? '');
  const [roomType, setRoomType] = useState(candidates[0] ? (catalogTypeName(candidates[0].no) ?? stay.roomType) : stay.roomType);
  const [reason, setReason] = useState(MOVE_REASONS[0]);
  const typeNames = ROOM_TYPES.map((t) => t.name);
  const typeOptions = typeNames.includes(roomType) ? typeNames : [roomType, ...typeNames];

  function pickRoom(no: string) {
    setToRoom(no);
    const t = catalogTypeName(no);
    if (t) setRoomType(t);
  }

  return (
    <Modal
      title={`Move ${stay.guest}`}
      description={`Currently in Room ${stay.room} (${stay.roomType}). Only vacant, inspected rooms can be assigned.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={ArrowRightLeft} disabled={!toRoom} onClick={() => onConfirm(toRoom, reason, roomType)}>
            Confirm move
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-mist-300">No vacant, inspected rooms are available right now. Check the Rooms tab.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="move-room">New room</FieldLabel>
              <select id="move-room" value={toRoom} onChange={(e) => pickRoom(e.target.value)} className="field w-full">
                {candidates.map((r) => (
                  <option key={r.no} value={r.no}>
                    Room {r.no} · Floor {r.floor}
                    {catalogTypeName(r.no) ? ` · ${catalogTypeName(r.no)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="move-type">Room type</FieldLabel>
              <select id="move-type" value={roomType} onChange={(e) => setRoomType(e.target.value)} className="field w-full">
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="move-reason">Reason</FieldLabel>
            <select id="move-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="field w-full">
              {MOVE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-mist-400">
            The old room&apos;s guest QR session is revoked immediately, the folio and open requests move with the guest, and Housekeeping receives a turnover task.
          </p>
        </>
      )}
    </Modal>
  );
}
