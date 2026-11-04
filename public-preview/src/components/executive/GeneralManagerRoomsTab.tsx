'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  BedDouble,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  DoorOpen,
  Filter,
  Search,
  Layers,
  ArrowRight,
  ShieldCheck,
  Wrench,
  DollarSign,
  Crown,
  MoonStar,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { RoomRecord, Readiness } from '@/types/demo';

export function GeneralManagerRoomsTab() {
  const { state } = useDemo();
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);

  const rooms: RoomRecord[] = state.frontDesk?.rooms ?? [];
  const stays = state.frontDesk?.stays ?? [];

  // Compute metrics
  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.occupied).length;
  const cleaningCount = rooms.filter((r) => r.readiness === 'dirty' || r.readiness === 'cleaning').length;
  const readyCount = rooms.filter((r) => r.readiness === 'ready' && !r.occupied).length;
  const checkInTodayCount = stays.filter((s) => s.status === 'expected').length;
  const checkOutTodayCount = stays.filter(
    (s) => s.status === 'in_house' && (s.departure === 'Today' || Boolean((s as any).departsToday)),
  ).length;
  const outOfOrderCount = rooms.filter(
    (r) => r.readiness === 'out_of_order' || r.readiness === 'inspection_failed',
  ).length;

  const occupancyRate = totalRooms > 0 ? ((occupiedCount / totalRooms) * 100).toFixed(1) : '0';
  const revPAR = totalRooms > 0 ? money((occupiedCount * 18500) / totalRooms) : '₹0';

  // Helper to determine display status
  const getRoomDisplayStatus = (r: RoomRecord) => {
    if (r.readiness === 'out_of_order' || r.readiness === 'inspection_failed') return 'out_of_order';
    if (r.occupied) return 'occupied';
    return r.readiness || 'ready';
  };

  // Helper to get room type
  const getRoomType = (r: RoomRecord, stay?: any) => {
    if (stay?.roomType) return stay.roomType;
    if (r.floor === 5) return 'Presidential Suite';
    if (r.floor === 4) return 'Royal Suite';
    if (r.floor === 3) return 'Executive Suite';
    return 'Deluxe Heritage Room';
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedFloor !== 'all' && r.floor !== selectedFloor) return false;

      const displayStatus = getRoomDisplayStatus(r);
      if (statusFilter !== 'all') {
        if (statusFilter === 'occupied' && !r.occupied) return false;
        if (statusFilter === 'ready' && (r.occupied || r.readiness !== 'ready')) return false;
        if (statusFilter === 'dirty' && r.readiness !== 'dirty' && r.readiness !== 'cleaning') return false;
        if (statusFilter === 'ooo' && r.readiness !== 'out_of_order' && r.readiness !== 'inspection_failed')
          return false;
        if (statusFilter === 'checkin') {
          const stay = stays.find((s) => s.room === r.no);
          if (!stay || stay.status !== 'expected') return false;
        }
        if (statusFilter === 'checkout') {
          const stay = stays.find((s) => s.room === r.no);
          if (!stay || (stay.departure !== 'Today' && !Boolean((stay as any).departsToday))) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const stay = stays.find((s) => s.room === r.no);
        const type = getRoomType(r, stay).toLowerCase();
        const matchesNum = r.no.toLowerCase().includes(q);
        const matchesGuest = stay?.guest?.toLowerCase().includes(q) ?? false;
        const matchesType = type.includes(q);
        if (!matchesNum && !matchesGuest && !matchesType) return false;
      }

      return true;
    });
  }, [rooms, stays, selectedFloor, statusFilter, searchQuery]);

  // Selected room details
  const activeRoom = selectedRoomNumber
    ? rooms.find((r) => r.no === selectedRoomNumber)
    : filteredRooms[0] ?? rooms[0];

  const activeStay = activeRoom ? stays.find((s) => s.room === activeRoom.no) : null;
  const activeDisplayStatus = activeRoom ? getRoomDisplayStatus(activeRoom) : 'ready';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center border border-amber-500/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-navy-950 dark:text-white">
                  Hotel-Wide Room & Inventory Command
                </h2>
                <Badge tone="accent" className="font-mono text-xs">
                  5 Floors · {totalRooms} Suites & Rooms
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                Executive room occupancy, housekeeping turnaround rates, check-in pipelines, and revenue yield.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>Occupancy: {occupancyRate}%</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span>RevPAR: {revPAR}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Occupied */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
          className={cn(
            'p-4 rounded-2xl border text-left transition backdrop-blur-xl shadow-md',
            statusFilter === 'occupied'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90',
          )}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-mist-400 block">Occupied</span>
          <div className="text-2xl font-black text-navy-950 dark:text-white mt-1">{occupiedCount}</div>
          <span className="text-[11px] text-indigo-500 font-medium">In-House Guests</span>
        </button>

        {/* Ready to Sell */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
          className={cn(
            'p-4 rounded-2xl border text-left transition backdrop-blur-xl shadow-md',
            statusFilter === 'ready'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90',
          )}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-mist-400 block">Ready to Sell</span>
          <div className="text-2xl font-black text-navy-950 dark:text-white mt-1">{readyCount}</div>
          <span className="text-[11px] text-emerald-500 font-medium">Vacant & Clean</span>
        </button>

        {/* Cleaning / Dirty */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
          className={cn(
            'p-4 rounded-2xl border text-left transition backdrop-blur-xl shadow-md',
            statusFilter === 'dirty'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90',
          )}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-mist-400 block">Cleaning In-Progress</span>
          <div className="text-2xl font-black text-navy-950 dark:text-white mt-1">{cleaningCount}</div>
          <span className="text-[11px] text-amber-500 font-medium">Housekeeping active</span>
        </button>

        {/* Check-In Today */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'checkin' ? 'all' : 'checkin')}
          className={cn(
            'p-4 rounded-2xl border text-left transition backdrop-blur-xl shadow-md',
            statusFilter === 'checkin'
              ? 'border-sky-500 bg-sky-500/10'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90',
          )}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-mist-400 block">Check-In Today</span>
          <div className="text-2xl font-black text-navy-950 dark:text-white mt-1">{checkInTodayCount}</div>
          <span className="text-[11px] text-sky-500 font-medium">Expected Arrivals</span>
        </button>

        {/* Check-Out Today */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'checkout' ? 'all' : 'checkout')}
          className={cn(
            'p-4 rounded-2xl border text-left transition backdrop-blur-xl shadow-md',
            statusFilter === 'checkout'
              ? 'border-rose-500 bg-rose-500/10'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90',
          )}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-mist-400 block">Check-Out Today</span>
          <div className="text-2xl font-black text-navy-950 dark:text-white mt-1">{checkOutTodayCount}</div>
          <span className="text-[11px] text-rose-500 font-medium">Scheduled departures</span>
        </button>

        {/* Out of Order */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'ooo' ? 'all' : 'ooo')}
          className={cn(
            'p-4 rounded-2xl border text-left transition backdrop-blur-xl shadow-md',
            statusFilter === 'ooo'
              ? 'border-red-500 bg-red-500/10'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90',
          )}
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-mist-400 block">Out of Order</span>
          <div className="text-2xl font-black text-navy-950 dark:text-white mt-1">{outOfOrderCount}</div>
          <span className="text-[11px] text-red-500 font-medium">Engineering block</span>
        </button>
      </div>

      {/* Filters & Floor Selector Bar */}
      <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Floor tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 dark:text-mist-400 mr-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Floor:
            </span>
            {(['all', 1, 2, 3, 4, 5] as const).map((fl) => (
              <button
                key={fl}
                type="button"
                onClick={() => setSelectedFloor(fl)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                  selectedFloor === fl
                    ? 'bg-amber-500 text-ink-950 font-bold shadow'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white bg-white/40 dark:bg-white/[0.04]',
                )}
              >
                {fl === 'all' ? 'All Floors' : `Floor ${fl}`}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room number or guest..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950 text-xs text-navy-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Room Cards + Inspection Details */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(300px,1.1fr)]">
        {/* Rooms Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 dark:text-mist-400 uppercase tracking-wider">
              Inventory Matrix ({filteredRooms.length} rooms)
            </span>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-xs text-amber-500 hover:underline"
              >
                Clear filter ({statusFilter})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredRooms.map((rm) => {
              const isSelected = activeRoom?.no === rm.no;
              const stay = stays.find((s) => s.room === rm.no);
              const isVip = stay?.vip;
              const displayStatus = getRoomDisplayStatus(rm);
              const roomType = getRoomType(rm, stay);

              return (
                <button
                  key={rm.no}
                  type="button"
                  onClick={() => setSelectedRoomNumber(rm.no)}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[115px]',
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-500/[0.08] shadow-lg'
                      : 'border-white/10 bg-white/70 dark:bg-ink-900/80 hover:bg-white/90 dark:hover:bg-ink-900',
                  )}
                >
                  <div className="flex items-start justify-between w-full gap-1">
                    <span className="font-mono font-bold text-base text-navy-950 dark:text-white">
                      {rm.no}
                    </span>
                    <div className="flex items-center gap-1">
                      {rm.dnd && (
                        <span className="grid h-5 w-5 place-items-center rounded-md bg-rose-500/20 text-rose-400" title="Do Not Disturb">
                          <MoonStar className="h-3 w-3" />
                        </span>
                      )}
                      {isVip && (
                        <span className="grid h-5 w-5 place-items-center rounded-md bg-amber-500/20 text-amber-400" title="VIP Guest">
                          <Crown className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mt-1">
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 line-clamp-1">
                      {roomType}
                    </p>
                    <p className="text-xs font-medium text-navy-950 dark:text-white truncate">
                      {stay?.guest || (rm.occupied ? 'Occupied' : <span className="text-slate-400 dark:text-mist-500 italic">Vacant</span>)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider',
                        displayStatus === 'occupied' && 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300',
                        displayStatus === 'ready' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
                        (displayStatus === 'dirty' || displayStatus === 'cleaning') &&
                          'bg-amber-500/15 text-amber-600 dark:text-amber-300',
                        displayStatus === 'out_of_order' &&
                          'bg-rose-500/15 text-rose-600 dark:text-rose-300',
                      )}
                    >
                      {String(displayStatus).replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-mist-400">Fl {rm.floor}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Room Details Panel */}
        {activeRoom ? (
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-mono text-navy-950 dark:text-white">
                    Room {activeRoom.no}
                  </h3>
                  {activeStay?.vip && (
                    <Badge tone="accent" className="text-xs">
                      VIP Guest
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Floor {activeRoom.floor} · {getRoomType(activeRoom, activeStay)}
                </p>
              </div>
              <Badge
                tone={
                  activeDisplayStatus === 'occupied'
                    ? 'neutral'
                    : activeDisplayStatus === 'ready'
                    ? 'success'
                    : activeDisplayStatus === 'out_of_order'
                    ? 'danger'
                    : 'warning'
                }
              >
                {String(activeDisplayStatus).replace('_', ' ')}
              </Badge>
            </div>

            {/* In-House Guest / Reservation Information */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-3">
              <span className="text-xs font-bold text-slate-400 dark:text-mist-400 uppercase tracking-wider block">
                Stay Details
              </span>

              {activeStay ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-mist-400">Primary Guest</span>
                    <span className="font-bold text-navy-950 dark:text-white">{activeStay.guest}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-mist-400">Status</span>
                    <span className="font-semibold text-emerald-500">
                      {activeStay.status === 'in_house' ? 'In House' : 'Expected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-mist-400">Stay Dates</span>
                    <span className="text-navy-950 dark:text-white font-medium">
                      {activeStay.arrival} → {activeStay.departure}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-mist-400">NFC Key Access</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Active Live Pass
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-mist-400 italic">
                  Room is currently unoccupied. Available for walk-in or new Front Desk allocation.
                </p>
              )}
            </div>

            {/* Room Rate & Revenue Details */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/40 dark:bg-white/[0.02] space-y-2 text-xs">
              <span className="text-xs font-bold text-slate-400 dark:text-mist-400 uppercase tracking-wider block">
                Commercial Metrics
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-mist-400">Nightly Rack Rate</span>
                <span className="font-mono font-bold text-navy-950 dark:text-white">₹22,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-mist-400">Housekeeping Route</span>
                <span className="text-navy-950 dark:text-white">Zone B (Attendant Maya R.)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-mist-400">Readiness State</span>
                <span className="font-semibold text-navy-950 dark:text-white uppercase tracking-wider text-[11px]">
                  {activeRoom.readiness}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <p>
                <strong>Executive Notice:</strong> Front Desk manages check-ins and room moves. Department Manager oversees physical out-of-order blocks.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
