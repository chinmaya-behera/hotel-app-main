'use client';

import { useState, type CSSProperties } from 'react';
import {
  LogIn,
  LogOut,
  KeyRound,
  BedDouble,
  Landmark,
  UserCheck,
  Crown,
  Inbox,
  PackageSearch,
  Bell,
  ShieldAlert,
  BellRing,
  ChevronRight,
  Activity,
  ArrowRight,
  CircleAlert,
  Sparkles,
  BookOpen,
  User,
  type LucideIcon,
} from 'lucide-react';
import { FeedList } from '@/components/shared/FeedList';
import { CountUp, spotlight } from '@/lib/gestures';
import { cn } from '@/lib/utils';
import type { StayRecord, RoomRecord, DemoState } from '@/types/demo';
import type { TabId } from './FrontDeskConsole';

export interface FrontDeskMobileDashboardProps {
  stays: StayRecord[];
  rooms: RoomRecord[];
  queue: DemoState['items']['front_desk_coordinator'];
  sync: DemoState['frontDesk']['sync'];
  complaints: DemoState['frontDesk']['complaints'];
  guestReminders: DemoState['guestReminders'];
  kpis: Array<{ label: string; value: number; note: string; icon: LucideIcon }>;
  onNavigate: (
    newTab: TabId,
    options?: {
      staysFilter?: 'all' | 'arrivals' | 'inhouse' | 'departures' | 'checkedout';
      reqSourceTab?: 'guest_services' | 'complaints';
    }
  ) => void;
  onOpenLiveActivity: () => void;
}

export function FrontDeskMobileDashboard({
  stays = [],
  rooms = [],
  queue = [],
  sync = [],
  complaints = [],
  guestReminders = [],
  kpis = [],
  onNavigate,
  onOpenLiveActivity,
}: FrontDeskMobileDashboardProps) {
  const [feedCollapsed, setFeedCollapsed] = useState(false);

  // Computed overview metrics
  const arrivals = stays.filter((st) => st.status === 'expected');
  const arrivalsNeedingId = arrivals.filter((a) => !a.idChecked);
  const inHouse = stays.filter((st) => st.status === 'in_house');
  const departing = inHouse.filter((st) => st.departsToday);
  const vipCount = stays.filter((s) => s.vip).length;

  const totalRooms = rooms.length || 36;
  const readyRooms = rooms.filter((r) => !r.occupied && r.readiness === 'ready');
  const occupiedRooms = rooms.filter((r) => r.occupied);
  const dirtyRooms = rooms.filter((r) => r.readiness === 'dirty');
  const cleaningRooms = rooms.filter((r) => r.readiness === 'cleaning');
  const outOfOrderRooms = rooms.filter((r) => r.readiness === 'out_of_order');
  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms.length / totalRooms) * 100) : 0;

  const actionableRequests = queue.filter((item) => item.status !== 'completed' && item.status !== 'dismissed');
  const pendingReminders = guestReminders.filter((r) => r.status === 'pending');
  const failedSync = sync.filter((x) => x.bookingState === 'PMS_Sync_Failed');
  const lostFoundClaims = queue.filter((i) => i.category === 'lost_found' && i.status !== 'completed');

  return (
    <div className="space-y-4 pb-6 animate-fade-in">
      {/* 1. Station & Live Status Bar */}
      <div className="p-3 rounded-2xl border border-white/10 bg-gradient-to-r from-ink-900/90 via-ink-900/80 to-cyan-950/30 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white tracking-tight leading-snug truncate">
                Hotel Overview &amp; Live Operations
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-mist-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Live PMS Connected</span>
                <span>·</span>
                <span className="text-mist-400">Shift FD-02</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLiveActivity}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-cyan-200 hover:text-white hover:bg-white/10 flex items-center gap-1 shrink-0 active:scale-95 transition"
            aria-label="View live activity feed"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Feed</span>
          </button>
        </div>
      </div>

      {/* 2. Hotel Key Statistics (5 Overview KPIs Grid) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-mist-400">
            Hotel Key Statistics
          </h3>
          <span className="text-[10px] text-cyan-300 font-medium">Tap any metric to open section</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            // Map KPI index to relevant section
            const getKpiTarget = () => {
              if (i === 0) return () => onNavigate('stays', { staysFilter: 'arrivals' });
              if (i === 1) return () => onNavigate('stays', { staysFilter: 'inhouse' });
              if (i === 2) return () => onNavigate('stays', { staysFilter: 'departures' });
              if (i === 3) return () => onNavigate('rooms');
              return () => onNavigate('disputes');
            };

            return (
              <button
                key={k.label}
                type="button"
                onClick={getKpiTarget()}
                style={{ '--i': i } as CSSProperties}
                className={cn(
                  'panel fd-spot p-3 text-left transition active:scale-[0.98] hover:border-cyan-400/40 relative group',
                  i === 4 ? 'col-span-2' : ''
                )}
                {...spotlight}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-mist-300 truncate mr-2">{k.label}</p>
                  <span className="accent-soft grid h-6 w-6 place-items-center rounded-md shrink-0 group-hover:scale-110 transition">
                    <Icon className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <p className="text-xl font-bold tabular-nums text-white leading-tight">
                    <CountUp value={k.value} />
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-mist-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="mt-0.5 text-[10px] text-mist-400 truncate">{k.note}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Guest Operations Overview Card */}
      <div className="p-3.5 rounded-2xl border border-white/10 bg-ink-900/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-300">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white leading-none">Guest Operations Overview</h3>
              <p className="text-[10px] text-mist-400 mt-0.5">Arrivals, in-house guests &amp; departures</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('stays', { staysFilter: 'all' })}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5"
          >
            <span>All Stays</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <button
            type="button"
            onClick={() => onNavigate('stays', { staysFilter: 'arrivals' })}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 transition text-left"
          >
            <div className="flex items-center gap-1 text-[10px] text-mist-300 font-medium">
              <LogIn className="h-3 w-3 text-cyan-400 shrink-0" />
              <span>Arrivals</span>
            </div>
            <p className="text-base font-bold text-white mt-0.5">{arrivals.length}</p>
            <p className="text-[9px] text-cyan-300 truncate">
              {arrivalsNeedingId.length > 0 ? `${arrivalsNeedingId.length} need ID` : 'All verified'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('stays', { staysFilter: 'inhouse' })}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 transition text-left"
          >
            <div className="flex items-center gap-1 text-[10px] text-mist-300 font-medium">
              <KeyRound className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>In-House</span>
            </div>
            <p className="text-base font-bold text-white mt-0.5">{inHouse.length}</p>
            <p className="text-[9px] text-emerald-400 truncate">Active stays</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('stays', { staysFilter: 'departures' })}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 transition text-left"
          >
            <div className="flex items-center gap-1 text-[10px] text-mist-300 font-medium">
              <LogOut className="h-3 w-3 text-amber-400 shrink-0" />
              <span>Departures</span>
            </div>
            <p className="text-base font-bold text-white mt-0.5">{departing.length}</p>
            <p className="text-[9px] text-amber-300 truncate">Checkouts today</p>
          </button>
        </div>

        {/* Quick Action Buttons for Stays */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => onNavigate('stays', { staysFilter: 'arrivals' })}
            className="py-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs font-bold hover:bg-cyan-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <LogIn className="h-3.5 w-3.5 text-cyan-300" />
            <span>Process Check-In</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('vip')}
            className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            <span>VIP Guests ({vipCount})</span>
          </button>
        </div>
      </div>

      {/* 4. Room Status & Readiness Overview Card */}
      <div className="p-3.5 rounded-2xl border border-white/10 bg-ink-900/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-300">
              <BedDouble className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white leading-none">Room Inventory &amp; Status</h3>
              <p className="text-[10px] text-mist-400 mt-0.5">
                {occupiedRooms.length} of {totalRooms} rooms occupied ({occupancyPercent}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('rooms')}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5"
          >
            <span>Rooms Board</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Segmented Occupancy Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(occupiedRooms.length / totalRooms) * 100}%` }}
              className="bg-cyan-400 h-full"
              title="Occupied"
            />
            <div
              style={{ width: `${(readyRooms.length / totalRooms) * 100}%` }}
              className="bg-emerald-400 h-full"
              title="Ready"
            />
            <div
              style={{ width: `${((dirtyRooms.length + cleaningRooms.length) / totalRooms) * 100}%` }}
              className="bg-amber-400 h-full"
              title="Cleaning / Dirty"
            />
            <div
              style={{ width: `${(outOfOrderRooms.length / totalRooms) * 100}%` }}
              className="bg-rose-500 h-full"
              title="Out of Order"
            />
          </div>

          {/* Room Status Chips Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-400/30 transition"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] text-mist-300">Ready</span>
              </div>
              <p className="text-xs font-bold text-emerald-300 mt-0.5">{readyRooms.length}</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-cyan-400/30 transition"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="text-[9px] text-mist-300">Occupied</span>
              </div>
              <p className="text-xs font-bold text-cyan-300 mt-0.5">{occupiedRooms.length}</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-400/30 transition"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[9px] text-mist-300">Dirty</span>
              </div>
              <p className="text-xs font-bold text-amber-300 mt-0.5">
                {dirtyRooms.length + cleaningRooms.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition"
            >
              <div className="flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="text-[9px] text-mist-300">OOO</span>
              </div>
              <p className="text-xs font-bold text-rose-300 mt-0.5">{outOfOrderRooms.length}</p>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Front Desk Services & Operational Actions */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-mist-400">
            Front Desk Modules
          </h3>
          <span className="text-[10px] text-mist-400">Direct Navigation</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Requests & Cases */}
          <button
            type="button"
            onClick={() => onNavigate('requests', { reqSourceTab: 'guest_services' })}
            className="p-3 rounded-2xl border border-white/10 bg-ink-900/80 hover:border-cyan-400/40 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition">
                <Inbox className="h-3.5 w-3.5" />
              </span>
              {actionableRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-400 text-ink-950">
                  {actionableRequests.length}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white mt-2 group-hover:text-cyan-200 transition">
              Requests &amp; Cases
            </h4>
            <p className="text-[10px] text-mist-400 mt-0.5">Guest service tickets</p>
          </button>

          {/* Guest Complaints */}
          <button
            type="button"
            onClick={() => onNavigate('requests', { reqSourceTab: 'complaints' })}
            className="p-3 rounded-2xl border border-white/10 bg-ink-900/80 hover:border-rose-400/40 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-300 group-hover:scale-105 transition">
                <CircleAlert className="h-3.5 w-3.5" />
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {complaints.length || 2}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-2 group-hover:text-rose-200 transition">
              Guest Complaints
            </h4>
            <p className="text-[10px] text-mist-400 mt-0.5">Escalations &amp; comp</p>
          </button>

          {/* Lost & Found */}
          <button
            type="button"
            onClick={() => onNavigate('lostfound')}
            className="p-3 rounded-2xl border border-white/10 bg-ink-900/80 hover:border-cyan-400/40 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300 group-hover:scale-105 transition">
                <PackageSearch className="h-3.5 w-3.5" />
              </span>
              {lostFoundClaims.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300">
                  {lostFoundClaims.length}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white mt-2 group-hover:text-amber-200 transition">
              Lost &amp; Found
            </h4>
            <p className="text-[10px] text-mist-400 mt-0.5">Claims &amp; logs</p>
          </button>

          {/* Guest Reminders */}
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="p-3 rounded-2xl border border-white/10 bg-ink-900/80 hover:border-cyan-400/40 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-300 group-hover:scale-105 transition">
                <Bell className="h-3.5 w-3.5" />
              </span>
              {pendingReminders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                  {pendingReminders.length}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white mt-2 group-hover:text-sky-200 transition">
              Reminders
            </h4>
            <p className="text-[10px] text-mist-400 mt-0.5">Wake-up &amp; followups</p>
          </button>

          {/* Disputes (Financial) */}
          <button
            type="button"
            onClick={() => onNavigate('disputes')}
            className="p-3 rounded-2xl border border-white/10 bg-ink-900/80 hover:border-cyan-400/40 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition">
                <Landmark className="h-3.5 w-3.5" />
              </span>
              {failedSync.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {failedSync.length}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white mt-2 group-hover:text-emerald-200 transition">
              Disputes (Financial)
            </h4>
            <p className="text-[10px] text-mist-400 mt-0.5">Sync &amp; folio balance</p>
          </button>

          {/* Incidents & Security */}
          <button
            type="button"
            onClick={() => onNavigate('incidents')}
            className="p-3 rounded-2xl border border-white/10 bg-ink-900/80 hover:border-cyan-400/40 text-left transition active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <span className="h-7 w-7 rounded-lg bg-rose-500/15 border border-rose-400/25 flex items-center justify-center text-rose-300 group-hover:scale-105 transition">
                <ShieldAlert className="h-3.5 w-3.5" />
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300">
                2
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-2 group-hover:text-rose-200 transition">
              Incidents &amp; Security
            </h4>
            <p className="text-[10px] text-mist-400 mt-0.5">Duty Manager logs</p>
          </button>
        </div>
      </div>

      {/* 6. Recent Property Activity Feed Widget */}
      <div className="p-3.5 rounded-2xl border border-white/10 bg-ink-900/80 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Recent Property Activity</h3>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenLiveActivity}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5"
          >
            <span>Full Log</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="p-2.5 rounded-xl border border-white/5 bg-ink-950/60 max-h-56 overflow-y-auto">
          <FeedList limit={6} />
        </div>
      </div>
    </div>
  );
}

