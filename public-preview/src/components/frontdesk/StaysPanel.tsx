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
import type { RoomRecord, StayRecord, FrontDeskPalette } from '@/types/demo';

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

export function StaysPanel({
  initialFilter = 'all',
  isLight: propIsLight,
  palette: propPalette,
}: {
  initialFilter?: Filter;
  isLight?: boolean;
  palette?: FrontDeskPalette;
} = {}) {
  const { state, fdAction } = useDemo();
  const palette = propPalette ?? (state.frontDeskPalette ?? 'moobi');
  const isLight = propIsLight ?? ((state.frontDeskTheme ?? 'light') === 'light');
  const isCosmic = palette === 'cosmic';
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('hari_ini');
  const [cosmicTimeframe, setCosmicTimeframe] = useState<'30d' | '90d' | '1y'>('30d');
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
    <div
      className={cn(
        "w-full space-y-6 rounded-3xl p-4 sm:p-6 lg:p-7 shadow-sm border transition-all font-sans",
        isLight
          ? isCosmic
            ? "bg-[#FAF9FC] border-purple-200/70 text-slate-900"
            : "bg-[#F1F5F9] border-slate-300 text-slate-900"
          : isCosmic
            ? "bg-[#0D0B18] border-[#2A2044] text-white"
            : "bg-[#0F172A] border-slate-800 text-white"
      )}
    >
      {/* ================================================================= */}
      {/* 1. HOTEL OPERATIONAL DASHBOARD (Moobi & Cosmic Forge Palettes)     */}
      {/* ================================================================= */}
      <div className="space-y-6">
        {/* 1. Header with Period Selector & Actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1
              className={cn("text-xl font-black tracking-tight sm:text-2xl", isLight ? "text-slate-950" : "text-white")}
              style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
            >
              Dashboard Hotel
            </h1>
            <p
              className={cn("mt-1 text-xs font-semibold", isLight ? (isCosmic ? "text-purple-900/80" : "text-slate-700") : (isCosmic ? "text-purple-200/80" : "text-slate-300"))}
              style={{ color: isLight ? '#334155' : '#CBD5E1' }}
            >
              Overview operasional &amp; performa hotel secara real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Picker Capsule */}
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs",
                isLight
                  ? isCosmic ? "border-purple-200/80 bg-[#FFFFFF] text-slate-800" : "border-slate-300 bg-[#FFFFFF] text-slate-800"
                  : isCosmic ? "border-[#352952] bg-[#1A162B] text-slate-200" : "border-slate-700 bg-[#1E293B] text-slate-200"
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <Calendar className={cn("h-3.5 w-3.5", isCosmic ? "text-purple-500" : "text-slate-500")} />
              <span className="font-extrabold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>Periode</span>
              <span className="text-slate-400">|</span>
              <span className="tabular-nums font-bold" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>22-05-2026 - 22-05-2026</span>
            </div>

            {/* Timeframe Filter Buttons */}
            <div
              className={cn(
                "inline-flex items-center rounded-xl border p-0.5 shadow-xs",
                isLight
                  ? isCosmic ? "border-purple-200/80 bg-[#FFFFFF]" : "border-slate-300 bg-[#FFFFFF]"
                  : isCosmic ? "border-[#352952] bg-[#1A162B]" : "border-slate-700 bg-[#1E293B]"
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              {TIME_PERIODS.map((tp) => {
                const isActive = timePeriod === tp.id;
                return (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setTimePeriod(tp.id)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
                      isActive
                        ? isCosmic ? 'bg-[#7C3AED] shadow-xs text-white' : 'bg-[#1E40AF] shadow-xs text-white'
                        : isLight
                          ? isCosmic ? 'text-purple-950 hover:bg-purple-50' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                          : isCosmic ? 'text-purple-200 hover:bg-purple-900/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                    style={isActive ? { backgroundColor: isCosmic ? '#7C3AED' : '#1E40AF', color: '#FFFFFF' } : undefined}
                  >
                    <span style={isActive ? { color: '#FFFFFF' } : undefined}>{tp.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Action */}
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer",
                isLight
                  ? isCosmic ? "border-purple-200/80 bg-[#FFFFFF] text-slate-800 hover:bg-purple-50" : "border-slate-300 bg-[#FFFFFF] text-slate-800 hover:bg-slate-100"
                  : isCosmic ? "border-[#352952] bg-[#1A162B] text-slate-200 hover:bg-[#251D3D]" : "border-slate-700 bg-[#1E293B] text-slate-200 hover:bg-slate-800"
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <FilterIcon className={cn("h-3.5 w-3.5", isCosmic ? "text-purple-500" : "text-slate-500")} />
              <span style={{ color: isLight ? '#1E293B' : '#FFFFFF' }}>Filter</span>
            </button>

            {/* Add Stay Action */}
            <button
              type="button"
              onClick={() => setDialog({ kind: 'add' })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer",
                isCosmic ? "bg-[#7C3AED] hover:bg-[#6D28D9]" : "bg-[#1E40AF] hover:bg-[#1D4ED8]"
              )}
              style={{ backgroundColor: isCosmic ? '#7C3AED' : '#1E40AF', color: '#FFFFFF' }}
            >
              <Plus className="h-3.5 w-3.5" style={{ color: '#FFFFFF' }} />
              <span style={{ color: '#FFFFFF' }}>Add Stay</span>
            </button>
          </div>
        </div>

        {/* 2. AKTIVITAS HARI INI - 4 Full Gradient Hero Metric Cards */}
        <section aria-labelledby="section-hero-metrics">
          <h2
            id="section-hero-metrics"
            className={cn("text-xs font-black uppercase tracking-wider mb-3", isLight ? (isCosmic ? "text-purple-950" : "text-slate-800") : (isCosmic ? "text-purple-200" : "text-slate-300"))}
            style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}
          >
            Aktivitas Hari Ini
          </h2>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Card 1: Check-In Hari Ini */}
            <div
              onClick={() => setFilter('arrivals')}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl p-4.5 transition-all hover:scale-[1.01]",
                isCosmic
                  ? "bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] shadow-[0_4px_18px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.5)]"
                  : "bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] shadow-[0_4px_16px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.45)]"
              )}
              style={{ color: '#FFFFFF' }}
            >
              {isCosmic && (
                <div className="pointer-events-none absolute -bottom-1 -right-2 h-16 w-36 opacity-30">
                  <svg viewBox="0 0 100 24" className="h-full w-full stroke-white fill-none" preserveAspectRatio="none">
                    <path d="M0,20 Q25,6 50,14 T100,8" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="flex items-start justify-between relative z-10">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl backdrop-blur-xs border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <Bell className="h-5 w-5" style={{ color: '#FFFFFF' }} />
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                  }}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>25% dari kemarin</span>
                </span>
              </div>
              <div className="mt-4 relative z-10">
                <div className="text-3xl font-black tracking-tight tabular-nums" style={{ color: '#FFFFFF' }}>
                  {counts.arrivals}
                </div>
                <div className="mt-1 text-xs font-bold tracking-wide" style={{ color: '#FFFFFF' }}>
                  Check-In Hari Ini
                </div>
              </div>
            </div>

            {/* Card 2: Check-Out Hari Ini */}
            <div
              onClick={() => setFilter('departures')}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl p-4.5 transition-all hover:scale-[1.01]",
                isCosmic
                  ? "bg-gradient-to-br from-[#6366F1] via-[#4F46E5] to-[#4338CA] shadow-[0_4px_18px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.5)]"
                  : "bg-gradient-to-br from-[#0EA5E9] via-[#0284C7] to-[#0369A1] shadow-[0_4px_16px_rgba(14,165,233,0.35)] hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)]"
              )}
              style={{ color: '#FFFFFF' }}
            >
              {isCosmic && (
                <div className="pointer-events-none absolute -bottom-1 -right-2 h-16 w-36 opacity-30">
                  <svg viewBox="0 0 100 24" className="h-full w-full stroke-white fill-none" preserveAspectRatio="none">
                    <path d="M0,14 Q25,22 55,10 T100,16" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="flex items-start justify-between relative z-10">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl backdrop-blur-xs border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <LogOut className="h-5 w-5" style={{ color: '#FFFFFF' }} />
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                  }}
                >
                  <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>0% dari kemarin</span>
                </span>
              </div>
              <div className="mt-4 relative z-10">
                <div className="text-3xl font-black tracking-tight tabular-nums" style={{ color: '#FFFFFF' }}>
                  {counts.departures}
                </div>
                <div className="mt-1 text-xs font-bold tracking-wide" style={{ color: '#FFFFFF' }}>
                  Check-Out Hari Ini
                </div>
              </div>
            </div>

            {/* Card 3: Tingkat Hunian (Occupancy Rate) */}
            <div
              onClick={() => setFilter('inhouse')}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl p-4.5 transition-all hover:scale-[1.01]",
                isCosmic
                  ? "bg-gradient-to-br from-[#059669] via-[#047857] to-[#065F46] shadow-[0_4px_18px_rgba(5,150,105,0.35)] hover:shadow-[0_6px_24px_rgba(5,150,105,0.5)]"
                  : "bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)]"
              )}
              style={{ color: '#FFFFFF' }}
            >
              {isCosmic && (
                <div className="pointer-events-none absolute -bottom-1 -right-2 h-16 w-36 opacity-30">
                  <svg viewBox="0 0 100 24" className="h-full w-full stroke-white fill-none" preserveAspectRatio="none">
                    <path d="M0,18 Q30,8 60,16 T100,10" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="flex items-start justify-between relative z-10">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl backdrop-blur-xs border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <Home className="h-5 w-5" style={{ color: '#FFFFFF' }} />
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                  }}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>8.4% dari kemarin</span>
                </span>
              </div>
              <div className="mt-4 relative z-10">
                <div className="text-3xl font-black tracking-tight tabular-nums" style={{ color: '#FFFFFF' }}>
                  {occupancyPct}%
                </div>
                <div className="mt-1 text-xs font-bold tracking-wide" style={{ color: '#FFFFFF' }}>
                  Tingkat Hunian
                </div>
              </div>
            </div>

            {/* Card 4: Revenue Periode */}
            <div
              className={cn(
                "group relative overflow-hidden rounded-2xl p-4.5 transition-all hover:scale-[1.01]",
                isCosmic
                  ? "bg-gradient-to-br from-[#C026D3] via-[#A21CAF] to-[#86198F] shadow-[0_4px_18px_rgba(192,38,211,0.35)] hover:shadow-[0_6px_24px_rgba(192,38,211,0.5)]"
                  : "bg-gradient-to-br from-[#F59E0B] via-[#EA580C] to-[#D97706] shadow-[0_4px_16px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)]"
              )}
              style={{ color: '#FFFFFF' }}
            >
              {isCosmic && (
                <div className="pointer-events-none absolute -bottom-1 -right-2 h-16 w-36 opacity-30">
                  <svg viewBox="0 0 100 24" className="h-full w-full stroke-white fill-none" preserveAspectRatio="none">
                    <path d="M0,16 Q20,22 45,10 T85,18 T100,12" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="flex items-start justify-between relative z-10">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl backdrop-blur-xs border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: '#FFFFFF' }} />
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                  }}
                >
                  <span style={{ color: '#FFFFFF' }}>— 0% dari kemarin</span>
                </span>
              </div>
              <div className="mt-4 relative z-10">
                <div className="text-2xl sm:text-3xl font-black tracking-tight truncate" style={{ color: '#FFFFFF' }}>
                  {revenueDisplay}
                </div>
                <div className="mt-1 text-xs font-bold tracking-wide" style={{ color: '#FFFFFF' }}>
                  Revenue Periode
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RINGKASAN BOOKING - 4 Cards with Left Color Border */}
        <section aria-labelledby="section-booking-summary">
          <h2
            id="section-booking-summary"
            className={cn("text-xs font-black uppercase tracking-wider mb-3", isLight ? (isCosmic ? "text-purple-950" : "text-slate-800") : (isCosmic ? "text-purple-200" : "text-slate-300"))}
            style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}
          >
            Ringkasan Booking (22-05-2026 - 22-05-2026)
          </h2>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Card 1: Total Booking */}
            <div
              onClick={() => setFilter('all')}
              className={cn(
                'group cursor-pointer rounded-2xl p-4 shadow-sm border border-l-4 transition hover:shadow-md',
                isCosmic ? 'border-l-[#7C3AED]' : 'border-l-[#1E40AF]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700',
                filter === 'all' && (isCosmic ? 'ring-2 ring-purple-600/30' : 'ring-2 ring-blue-600/30')
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl",
                  isCosmic
                    ? isLight ? "bg-purple-100 text-[#7C3AED]" : "bg-purple-950/60 text-[#C084FC]"
                    : "bg-blue-100 text-[#1E40AF]"
                )}>
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Total Booking
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {counts.all}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-xs font-semibold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>
                Semua status kamar
              </p>
            </div>

            {/* Card 2: Booking Confirmed */}
            <div
              onClick={() => setFilter('inhouse')}
              className={cn(
                'group cursor-pointer rounded-2xl p-4 shadow-sm border border-l-4 transition hover:shadow-md',
                isCosmic ? 'border-l-[#10B981]' : 'border-l-[#059669]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700',
                filter === 'inhouse' && 'ring-2 ring-emerald-600/30'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl",
                  isCosmic
                    ? isLight ? "bg-emerald-100 text-[#10B981]" : "bg-emerald-950/60 text-[#34D399]"
                    : "bg-emerald-100 text-[#059669]"
                )}>
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Booking Confirmed
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {counts.inhouse}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-emerald-600 font-bold">
                ↑ 0% dari total
              </p>
            </div>

            {/* Card 3: Booking Pending */}
            <div
              onClick={() => setFilter('arrivals')}
              className={cn(
                'group cursor-pointer rounded-2xl p-4 shadow-sm border border-l-4 transition hover:shadow-md',
                isCosmic ? 'border-l-[#F59E0B]' : 'border-l-[#D97706]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700',
                filter === 'arrivals' && 'ring-2 ring-amber-600/30'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl",
                  isCosmic
                    ? isLight ? "bg-amber-100 text-[#F59E0B]" : "bg-amber-950/60 text-[#FBBF24]"
                    : "bg-amber-100 text-[#D97706]"
                )}>
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Booking Pending
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {counts.arrivals}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-amber-600 font-bold">
                Menunggu konfirmasi / check-in
              </p>
            </div>

            {/* Card 4: Booking Cancelled */}
            <div
              className={cn(
                "rounded-2xl p-4 shadow-sm border border-l-4 transition hover:shadow-md",
                isCosmic ? 'border-l-[#EF4444]' : 'border-l-[#E11D48]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl",
                  isCosmic
                    ? isLight ? "bg-rose-100 text-[#EF4444]" : "bg-rose-950/60 text-[#F87171]"
                    : "bg-rose-100 text-[#E11D48]"
                )}>
                  <XCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Booking Cancelled
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    0
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-xs font-semibold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>
                ↓ 0% cancellation rate
              </p>
            </div>
          </div>
        </section>

        {/* 4. STATUS KAMAR & TAMU - 4 Cards with Bottom Sparklines */}
        <section aria-labelledby="section-room-status">
          <h2
            id="section-room-status"
            className={cn("text-xs font-black uppercase tracking-wider mb-3", isLight ? (isCosmic ? "text-purple-950" : "text-slate-800") : (isCosmic ? "text-purple-200" : "text-slate-300"))}
            style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}
          >
            Status Kamar &amp; Tamu
          </h2>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Card 1: Total Kamar */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 pb-2 shadow-sm border border-l-4",
                isCosmic ? 'border-l-[#7C3AED]' : 'border-l-[#1E40AF]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  isCosmic ? "bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60" : "bg-blue-100 text-[#1E40AF]"
                )}>
                  <Home className="h-4 w-4" />
                </span>
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Total Kamar
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {totalRoomsCount}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-xs font-semibold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>
                Kamar aktif terdaftar
              </p>
              {/* Sparkline Wave */}
              <div className="mt-2 h-7 w-full">
                <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                  {isCosmic ? (
                    <path d="M0,18 Q20,12 40,16 T70,10 T100,14" stroke={isLight ? '#7C3AED' : '#C084FC'} strokeWidth="2.5" strokeLinecap="round" />
                  ) : (
                    <path d="M0,16 Q15,8 30,14 T60,10 T90,16 L100,12" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
                  )}
                </svg>
              </div>
            </div>

            {/* Card 2: Kamar Tersedia */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 pb-2 shadow-sm border border-l-4",
                isCosmic ? 'border-l-[#10B981]' : 'border-l-[#059669]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("h-3.5 w-3.5 rounded-full shadow-xs", isCosmic ? "bg-[#10B981]" : "bg-[#059669]")} />
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Kamar Tersedia
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {availableRoomsCount}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-xs font-semibold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>
                Siap dipesan
              </p>
              {/* Sparkline Wave */}
              <div className="mt-2 h-7 w-full">
                <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                  {isCosmic ? (
                    <path d="M0,17 Q25,8 50,14 T80,9 T100,13" stroke={isLight ? '#10B981' : '#34D399'} strokeWidth="2.5" strokeLinecap="round" />
                  ) : (
                    <path d="M0,18 Q20,10 40,16 T70,8 T100,14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                  )}
                </svg>
              </div>
            </div>

            {/* Card 3: Kamar Terbooking */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 pb-2 shadow-sm border border-l-4",
                isCosmic ? 'border-l-[#6366F1]' : 'border-l-[#0284C7]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("h-3.5 w-3.5 rounded-full shadow-xs", isCosmic ? "bg-[#6366F1]" : "bg-[#0284C7]")} />
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Kamar Terbooking
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {occupiedRoomsCount}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-xs font-semibold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>
                Sedang dihuni / reserved
              </p>
              {/* Sparkline Wave */}
              <div className="mt-2 h-7 w-full">
                <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                  {isCosmic ? (
                    <path d="M0,15 Q25,19 50,11 T75,17 T100,10" stroke={isLight ? '#6366F1' : '#818CF8'} strokeWidth="2.5" strokeLinecap="round" />
                  ) : (
                    <path d="M0,14 Q25,20 50,10 T80,16 T100,8" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                  )}
                </svg>
              </div>
            </div>

            {/* Card 4: Kamar Tidak Siap */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 pb-2 shadow-sm border border-l-4",
                isCosmic ? 'border-l-[#EF4444]' : 'border-l-[#E11D48]',
                isLight
                  ? isCosmic ? 'bg-[#FFFFFF] border-purple-100' : 'bg-[#FFFFFF] border-slate-200'
                  : isCosmic ? 'bg-[#1A162B] border-[#352952]' : 'bg-[#1E293B] border-slate-700'
              )}
              style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("h-3.5 w-3.5 rounded-full shadow-xs", isCosmic ? "bg-[#EF4444]" : "bg-[#E11D48]")} />
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", isLight ? "text-slate-600" : (isCosmic ? "text-purple-300" : "text-slate-400"))}>
                    Kamar Tidak Siap
                  </p>
                  <p className="text-2xl font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {outOfOrderCount}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-xs font-semibold" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>
                Maintenance / housekeeping
              </p>
              {/* Sparkline Wave */}
              <div className="mt-2 h-7 w-full">
                <svg viewBox="0 0 100 24" className="h-full w-full stroke-current fill-none" preserveAspectRatio="none">
                  {isCosmic ? (
                    <path d="M0,17 Q30,12 60,19 T100,14" stroke={isLight ? '#EF4444' : '#F87171'} strokeWidth="2.5" strokeLinecap="round" />
                  ) : (
                    <path d="M0,16 Q30,14 60,18 T100,15" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Analytics Grid: Occupancy Donut, Check-In vs Check-Out Bar Chart & Aktivitas Terbaru */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Donut Chart: Occupancy Overview */}
          <div
            className={cn(
              "rounded-2xl p-5 shadow-sm border flex flex-col justify-between",
              isLight
                ? isCosmic ? "bg-[#FFFFFF] border-purple-100" : "bg-[#FFFFFF] border-slate-200"
                : isCosmic ? "bg-[#1A162B] border-[#352952]" : "bg-[#1E293B] border-slate-700"
            )}
            style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>Occupancy Overview</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold",
                  isLight
                    ? isCosmic ? "border-purple-200 text-purple-900 bg-purple-50" : "border-slate-300 text-slate-800 bg-slate-50"
                    : isCosmic ? "border-[#352952] text-purple-200 bg-[#251D3D]" : "border-slate-700 text-slate-200 bg-slate-800"
                )}
              >
                Hari Ini <ChevronDown className="h-3 w-3" />
              </span>
            </div>

            <div className="my-4 flex items-center justify-center gap-6">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Background Ring */}
                  <circle cx="50" cy="50" r="38" stroke={isLight ? (isCosmic ? '#EDE9FE' : '#CBD5E1') : (isCosmic ? '#2A2044' : '#334155')} strokeWidth="12" fill="none" />
                  {/* Available Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke={isCosmic ? '#10B981' : '#059669'}
                    strokeWidth="12"
                    strokeDasharray="238.76"
                    strokeDashoffset="60"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Occupied Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke={isCosmic ? '#7C3AED' : '#1E40AF'}
                    strokeWidth="12"
                    strokeDasharray="238.76"
                    strokeDashoffset="195"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black leading-none" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {occupancyPct}%
                  </span>
                  <span className="text-xs font-bold mt-0.5" style={{ color: isLight ? '#64748B' : (isCosmic ? '#C084FC' : '#94A3B8') }}>Occupancy</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}>
                    <span className={cn("h-3 w-3 rounded-full", isCosmic ? "bg-[#7C3AED]" : "bg-[#1E40AF]")} />
                    Occupied
                  </span>
                  <span className="font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{occupiedRoomsCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}>
                    <span className={cn("h-3 w-3 rounded-full", isCosmic ? "bg-[#10B981]" : "bg-[#059669]")} />
                    Available
                  </span>
                  <span className="font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{availableRoomsCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}>
                    <span className={cn("h-3 w-3 rounded-full", isCosmic ? "bg-[#EF4444]" : "bg-[#E11D48]")} />
                    Out of Order
                  </span>
                  <span className="font-black tabular-nums" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{outOfOrderCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart: Check-In vs Check-Out */}
          <div
            className={cn(
              "rounded-2xl p-5 shadow-sm border flex flex-col justify-between",
              isLight
                ? isCosmic ? "bg-[#FFFFFF] border-purple-100" : "bg-[#FFFFFF] border-slate-200"
                : isCosmic ? "bg-[#1A162B] border-[#352952]" : "bg-[#1E293B] border-slate-700"
            )}
            style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>Check-In vs Check-Out</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold",
                  isLight
                    ? isCosmic ? "border-purple-200 text-purple-900 bg-purple-50" : "border-slate-300 text-slate-800 bg-slate-50"
                    : isCosmic ? "border-[#352952] text-purple-200 bg-[#251D3D]" : "border-slate-700 text-slate-200 bg-slate-800"
                )}
              >
                Hari Ini <ChevronDown className="h-3 w-3" />
              </span>
            </div>

            <div className="my-2 flex items-center justify-end gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}>
                <span className={cn("h-2.5 w-2.5 rounded-full", isCosmic ? "bg-[#7C3AED]" : "bg-[#1E40AF]")} />
                Check-In
              </span>
              <span className="flex items-center gap-1.5 font-bold" style={{ color: isLight ? '#1E293B' : '#E2E8F0' }}>
                <span className={cn("h-2.5 w-2.5 rounded-full", isCosmic ? "bg-[#10B981]" : "bg-[#059669]")} />
                Check-Out
              </span>
            </div>

            {/* Bar Chart Visual */}
            <div
              className={cn(
                "mt-2 flex h-28 items-end justify-between gap-2 border-b pb-1 text-xs font-bold",
                isLight
                  ? isCosmic ? "border-purple-100 text-slate-700" : "border-slate-200 text-slate-700"
                  : isCosmic ? "border-[#352952] text-slate-300" : "border-slate-700 text-slate-300"
              )}
            >
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
                      style={{
                        height: `${bar.inH}%`,
                        backgroundColor: isCosmic ? '#7C3AED' : '#1E40AF',
                      }}
                      className="w-3 rounded-t-sm transition-all hover:opacity-85"
                    />
                    <div
                      style={{
                        height: `${bar.outH}%`,
                        backgroundColor: isCosmic ? '#10B981' : '#059669',
                      }}
                      className="w-3 rounded-t-sm transition-all hover:opacity-85"
                    />
                  </div>
                  <span>{bar.slot}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aktivitas Terbaru */}
          <div
            className={cn(
              "rounded-2xl p-5 shadow-sm border flex flex-col justify-between",
              isLight
                ? isCosmic ? "bg-[#FFFFFF] border-purple-100" : "bg-[#FFFFFF] border-slate-200"
                : isCosmic ? "bg-[#1A162B] border-[#352952]" : "bg-[#1E293B] border-slate-700"
            )}
            style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>Aktivitas Terbaru</h3>
              <span className={cn(
                "text-xs font-bold cursor-pointer hover:underline",
                isCosmic ? "text-[#7C3AED] hover:text-[#6D28D9]" : "text-[#1E40AF] hover:text-[#1D4ED8]"
              )}>
                Lihat Semua
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: LogIn,
                  iconTone: isCosmic ? 'bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60' : 'bg-blue-100 text-[#1E40AF]',
                  title: 'Check-In Baru',
                  desc: 'Tamu Mr. John Doe - Room 202',
                  time: '10:24 AM',
                },
                {
                  icon: Sparkles,
                  iconTone: isCosmic ? 'bg-emerald-100 text-[#10B981] dark:bg-emerald-950/60' : 'bg-emerald-100 text-[#059669]',
                  title: 'Kamar 104 Dibersihkan',
                  desc: 'Housekeeping - Selesai',
                  time: '09:45 AM',
                },
                {
                  icon: LogOut,
                  iconTone: isCosmic ? 'bg-indigo-100 text-[#6366F1] dark:bg-indigo-950/60' : 'bg-rose-100 text-[#E11D48]',
                  title: 'Check-Out',
                  desc: 'Tamu Ms. Jane Smith - Room 305',
                  time: '09:20 AM',
                },
                {
                  icon: CreditCard,
                  iconTone: isCosmic ? 'bg-fuchsia-100 text-[#C026D3] dark:bg-fuchsia-950/60' : 'bg-amber-100 text-[#D97706]',
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
                        <p className="font-bold truncate" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>{act.title}</p>
                        <p className="text-xs font-medium truncate" style={{ color: isLight ? '#334155' : '#CBD5E1' }}>{act.desc}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: isLight ? '#64748B' : '#94A3B8' }}>{act.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ================================================================= */}
      {/* 2. GUEST STAYS RESERVATION LIST (Themed for both palettes)        */}
      {/* ================================================================= */}
      <section
        className={cn(
          "space-y-4 rounded-2xl p-5 shadow-sm border transition-colors",
          isLight
            ? isCosmic
              ? "bg-[#FFFFFF] border-purple-100 text-slate-900"
              : "bg-[#FFFFFF] border-slate-200 text-slate-900"
            : isCosmic
              ? "bg-[#1A162B] border-[#352952] text-white"
              : "bg-[#1E293B] border-slate-700 text-white"
        )}
        style={{ backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className={cn("h-5 w-5", isCosmic ? "text-[#7C3AED]" : "text-[#1E40AF]")} />
            <div>
              <h2 className="text-base font-black" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
                Daftar Reservasi &amp; Stays
              </h2>
              <p className="text-xs font-medium" style={{ color: isLight ? '#475569' : '#CBD5E1' }}>
                Arrivals, in-house guests and scheduled departures
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="stay-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tamu atau nomor kamar..."
              className={cn(
                "w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-medium focus:outline-none transition shadow-xs",
                isLight
                  ? isCosmic
                    ? "border-purple-200 bg-[#FFFFFF] text-slate-900 placeholder-slate-400 focus:border-[#7C3AED]"
                    : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:border-[#1E40AF]"
                  : isCosmic
                    ? "border-[#352952] bg-[#141022] text-white placeholder-purple-300/40 focus:border-[#A855F7]"
                    : "border-slate-700 bg-[#0F172A] text-white placeholder-slate-400 focus:border-[#3B82F6]"
              )}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          role="group"
          aria-label="Filter stays"
          className={cn(
            "flex flex-wrap gap-2 pt-1 border-b pb-3",
            isLight ? "border-slate-200" : "border-slate-700/60"
          )}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer',
                filter === f.id
                  ? isCosmic ? 'bg-[#7C3AED] shadow-xs' : 'bg-[#1E40AF] shadow-xs'
                  : isLight
                    ? isCosmic
                      ? 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200/60'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300 hover:text-slate-950'
                    : isCosmic
                      ? 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 border border-purple-800/40'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
              )}
              style={filter === f.id ? { backgroundColor: isCosmic ? '#7C3AED' : '#1E40AF', color: '#FFFFFF' } : undefined}
            >
              <span style={filter === f.id ? { color: '#FFFFFF' } : undefined}>{f.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-black tabular-nums',
                  filter === f.id
                    ? 'bg-[rgba(255,255,255,0.25)]'
                    : isLight ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-slate-200'
                )}
                style={filter === f.id ? { backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF' } : undefined}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Rows List */}
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-slate-300 py-12 text-center">
            <BedDouble className="h-6 w-6 text-slate-400" aria-hidden />
            <p className="text-sm font-medium" style={{ color: isLight ? '#64748B' : '#94A3B8' }}>
              {term ? `Tidak ada tamu yang cocok dengan “${query}”.` : 'Tidak ada reservasi di kategori ini.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((st) => (
              <StayCard
                key={st.id}
                stay={st}
                onDialog={(kind) => setDialog({ kind, stayId: st.id })}
                isLight={isLight}
                palette={palette}
              />
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

function StayCard({
  stay,
  onDialog,
  isLight,
  palette,
}: {
  stay: StayRecord;
  onDialog: (kind: 'verify' | 'checkout' | 'move' | 'livepass') => void;
  isLight: boolean;
  palette: FrontDeskPalette;
}) {
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
  const isCosmic = palette === 'cosmic';

  // Status color accent on left border
  const borderTone = arriving
    ? isCosmic
      ? isLight ? 'border-l-[#7C3AED]' : 'border-l-[#A855F7]'
      : isLight ? 'border-l-[#1E40AF]' : 'border-l-[#3B82F6]'
    : inHouse
      ? 'border-l-[#059669]'
      : isLight ? 'border-l-slate-400' : 'border-l-slate-600';

  return (
    <li
      className={cn(
        'group rounded-2xl p-4 shadow-sm border border-l-4 transition hover:shadow-md',
        isLight
          ? isCosmic
            ? 'bg-[#FFFFFF] border-purple-200/70 text-slate-900'
            : 'bg-[#FFFFFF] border-slate-300 text-slate-900'
          : isCosmic
            ? 'bg-[#1A162B] border-[#352952] text-white'
            : 'bg-[#1E293B] border-slate-700 text-white',
        borderTone
      )}
      style={{
        backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#1A162B' : '#1E293B',
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-base font-black"
              style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
            >
              {stay.guest}
            </h3>
            {stay.vip && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-black text-amber-900 tracking-wider uppercase">
                VIP
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                isLight
                  ? "bg-slate-200 text-slate-900"
                  : isCosmic
                    ? "bg-purple-950/70 text-purple-200 border border-purple-800/50"
                    : "bg-slate-700 text-slate-200"
              )}
            >
              Kamar {stay.room}
            </span>
          </div>

          <p
            className="mt-1 text-xs font-bold"
            style={{ color: isLight ? '#334155' : '#CBD5E1' }}
          >
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
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                    verified
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 text-xs font-bold">
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 px-2.5 py-0.5 text-xs font-bold">
                    Check-Out Hari Ini
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                    balance > 0
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  )}
                >
                  {balance > 0 ? `Sisa Tagihan ${inr(balance)}` : 'Lunas (Settled)'}
                </span>
              </>
            )}

            {checkedOut && (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-0.5 text-xs font-bold">
                  Sudah Check-out
                </span>
                {cleanerAssigned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                    Turnover Ditugaskan · Housekeeping
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-xs font-bold">
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
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition",
                    isLight
                      ? isCosmic ? "border-purple-200 bg-[#FFFFFF] text-slate-800 hover:bg-purple-50" : "border-slate-300 bg-[#FFFFFF] text-slate-800 hover:bg-slate-100"
                      : isCosmic ? "border-purple-800/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50" : "border-slate-700 bg-[#1E293B] text-slate-200 hover:bg-slate-700"
                  )}
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : undefined,
                    color: isLight ? '#1E293B' : undefined,
                  }}
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
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-xs hover:bg-emerald-200 disabled:opacity-50 transition"
                  >
                    Setujui Early · {inr(early.fee)}
                  </button>
                  <button
                    type="button"
                    onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, false))}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                      isLight
                        ? "border-slate-300 bg-[#FFFFFF] text-slate-700 hover:bg-slate-100"
                        : "border-slate-700 bg-white/5 text-slate-300 hover:bg-white/10"
                    )}
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : undefined,
                      color: isLight ? '#334155' : undefined,
                    }}
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
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition",
                    isCosmic ? "bg-[#7C3AED] hover:bg-[#6D28D9]" : "bg-[#1E40AF] hover:bg-[#1D4ED8]"
                  )}
                  style={{
                    backgroundColor: isCosmic ? '#7C3AED' : '#1E40AF',
                    color: '#FFFFFF',
                  }}
                >
                  <LogIn className="h-3.5 w-3.5" style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>Check In</span>
                </button>
                {hint && <span className="text-xs text-rose-600 font-bold">{hint}</span>}
              </div>
            </>
          )}

          {inHouse && (
            <>
              <button
                type="button"
                onClick={() => onDialog('livepass')}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition",
                  isLight
                    ? isCosmic ? "border-purple-200 bg-[#FFFFFF] text-slate-800 hover:bg-purple-50" : "border-slate-300 bg-[#FFFFFF] text-slate-800 hover:bg-slate-100"
                    : isCosmic ? "border-purple-800/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50" : "border-slate-700 bg-[#1E293B] text-slate-200 hover:bg-slate-700"
                )}
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : undefined,
                  color: isLight ? '#1E293B' : undefined,
                }}
              >
                <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                <span>Live Pass</span>
              </button>
              <button
                type="button"
                onClick={() => onDialog('move')}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition",
                  isLight
                    ? isCosmic ? "border-purple-200 bg-[#FFFFFF] text-slate-800 hover:bg-purple-50" : "border-slate-300 bg-[#FFFFFF] text-slate-800 hover:bg-slate-100"
                    : isCosmic ? "border-purple-800/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50" : "border-slate-700 bg-[#1E293B] text-slate-200 hover:bg-slate-700"
                )}
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : undefined,
                  color: isLight ? '#1E293B' : undefined,
                }}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Pindah Kamar</span>
              </button>
              <button
                type="button"
                onClick={() => onDialog('checkout')}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black shadow-sm active:scale-95 transition",
                  isCosmic ? "bg-[#9333EA] hover:bg-[#7E22CE]" : "bg-[#0284C7] hover:bg-[#0369A1]"
                )}
                style={{
                  backgroundColor: isCosmic ? '#9333EA' : '#0284C7',
                  color: '#FFFFFF',
                }}
              >
                <LogOut className="h-3.5 w-3.5" style={{ color: '#FFFFFF' }} />
                <span style={{ color: '#FFFFFF' }}>Folio &amp; Check-Out</span>
              </button>
            </>
          )}

          {checkedOut && (
            <>
              <button
                type="button"
                onClick={() => onDialog('livepass')}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition",
                  isLight
                    ? isCosmic ? "border-purple-200 bg-[#FFFFFF] text-slate-800 hover:bg-purple-50" : "border-slate-300 bg-[#FFFFFF] text-slate-800 hover:bg-slate-100"
                    : isCosmic ? "border-purple-800/60 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50" : "border-slate-700 bg-[#1E293B] text-slate-200 hover:bg-slate-700"
                )}
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : undefined,
                  color: isLight ? '#1E293B' : undefined,
                }}
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
                  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition shadow-xs',
                  cleanerAssigned
                    ? 'border border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-[#059669] hover:bg-[#047857] active:scale-95'
                )}
                style={{
                  backgroundColor: cleanerAssigned ? undefined : '#059669',
                  color: cleanerAssigned ? undefined : '#FFFFFF',
                }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: cleanerAssigned ? undefined : '#FFFFFF' }} />
                <span style={{ color: cleanerAssigned ? undefined : '#FFFFFF' }}>{cleanerAssigned ? 'Cleaner Assigned' : 'Tugaskan Housekeeping'}</span>
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
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold">
        Kamar {room.no}: Siap
      </span>
    );
  }

  if (room.readiness !== 'inspection_pending') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
          room.occupied
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-slate-200 text-slate-900 border border-slate-300'
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
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/60"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-xs font-bold hover:bg-amber-200 transition">
          Kamar {room.no}: Menunggu Inspeksi
        </span>
      </button>
      {open && (
        <span
          role="dialog"
          aria-label={`Mark Room ${room.no} Ready`}
          className="absolute left-0 top-full z-20 mt-1.5 block w-64 rounded-2xl border border-slate-300 bg-[#FFFFFF] p-3.5 text-xs shadow-xl text-slate-800"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <span className="block font-black text-slate-950">Tandai Kamar {room.no} Siap?</span>
          <span className="mt-1 block text-slate-700 font-medium">Demo shortcut: Verifikasi kesiapan kamar untuk tamu yang akan check-in.</span>
          <span className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 bg-[#FFFFFF] px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
              style={{ backgroundColor: '#FFFFFF', color: '#334155' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!onMarkReady()) setOpen(false);
              }}
              className="rounded-lg bg-[#059669] px-3 py-1 text-xs font-bold hover:bg-[#047857]"
              style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
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
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.05] text-lg font-bold"
            style={{ color: '#FFFFFF' }}
            aria-hidden
          >
            {initials || <User className="h-6 w-6" style={{ color: '#FFFFFF' }} />}
          </span>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <dt className="text-mist-400">Name on booking</dt>
              <dd className="truncate font-semibold" style={{ color: '#FFFFFF' }}>{stay.guest}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Booking</dt>
              <dd className="font-semibold text-cyan-300">{bookingId}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Document</dt>
              <dd className="font-medium" style={{ color: '#FFFFFF' }}>{docType}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Number</dt>
              <dd className="font-mono font-medium" style={{ color: '#FFFFFF' }}>{docNumber.trim() ? `•••• ${docNumber.trim().slice(-4)}` : 'Not entered'}</dd>
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
            <span className="shrink-0 font-medium tabular-nums" style={{ color: '#FFFFFF' }}>{inr(l.amount)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Charges</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: '#FFFFFF' }}>{inr(total)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Paid</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: '#FFFFFF' }}>{inr(stay.paid)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Balance</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: '#FFFFFF' }}>{inr(balance)}</dd>
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
