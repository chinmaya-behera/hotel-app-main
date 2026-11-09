'use client';

import { useState, useMemo } from 'react';
import {
  BedDouble,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Flame,
  Moon,
  Users,
  UserCheck,
  Crown,
  FileText,
  AlertCircle,
  Wrench,
  DoorOpen,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { RoomRecord, SupervisorInspection, DispatcherDepartment } from '@/types/demo';

interface SupervisorRoomsTabProps {
  rooms?: RoomRecord[];
  inspections?: SupervisorInspection[];
  department?: DispatcherDepartment;
  onSelectInspectionByRoom?: (roomNumber: string) => void;
  onOpenEscalateForRoom?: (roomNumber: string) => void;
  onInspectRoom?: (roomNumber: string) => void;
}

export function SupervisorRoomsTab({
  rooms = [],
  inspections = [],
  department,
  onSelectInspectionByRoom,
  onOpenEscalateForRoom,
  onInspectRoom,
}: SupervisorRoomsTabProps) {
  const { state } = useDemo();
  const [floorFilter, setFloorFilter] = useState<'all' | number>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'cleaning' | 'dirty' | 'dnd' | 'out_of_order'>('all');
  const [search, setSearch] = useState('');

  const isMaintenance = department === 'Maintenance & Engineering';

  const stays = state.frontDesk?.stays ?? [];
  const allTasks = useMemo(() => {
    return [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
      ...(state.items.task_fulfiller ?? []),
    ];
  }, [state.items]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (floorFilter !== 'all' && r.floor !== floorFilter) return false;
      if (statusFilter === 'dnd') {
        if (!r.dnd) return false;
      } else if (statusFilter === 'out_of_order') {
        if (r.readiness !== 'out_of_order' && r.readiness !== 'inspection_failed') return false;
      } else if (statusFilter !== 'all') {
        if (r.readiness !== statusFilter) return false;
      }
      if (search.trim() && !r.no.toLowerCase().includes(search.toLowerCase().trim()))
        return false;
      return true;
    });
  }, [rooms, floorFilter, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      ready: rooms.filter((r) => r.readiness === 'ready').length,
      cleaning: rooms.filter((r) => r.readiness === 'cleaning').length,
      dirty: rooms.filter((r) => r.readiness === 'dirty').length,
      dnd: rooms.filter((r) => r.dnd).length,
      ooo: rooms.filter((r) => r.readiness === 'out_of_order' || r.readiness === 'inspection_failed').length,
    };
  }, [rooms]);

  function getRoomType(rm: RoomRecord): string {
    if (rm.no === '518') return 'Presidential Ocean Suite';
    if (rm.floor === 5) return 'Executive Penthouse Suite';
    if (rm.floor === 4) return 'Premium Deluxe Suite';
    if (rm.floor === 2 && ['202', '204', '210'].includes(rm.no)) return 'Wellness Spa Suite';
    return 'Deluxe King / Twin';
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-base font-bold font-display text-white">
                Property Room Readiness & Turnover Grid
              </h2>
              {department && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-mist-300 border border-white/10">
                  {department}
                </span>
              )}
            </div>
            <p className="text-xs text-mist-400 mt-1">
              Floor-by-floor room sanitation and operational statuses synchronized with Front Desk inventory
            </p>
          </div>

          {/* Quick floor tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFloorFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                floorFilter === 'all'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'text-mist-400 hover:text-white'
              }`}
            >
              All Floors
            </button>
            {[1, 2, 3, 4, 5].map((fl) => (
              <button
                key={fl}
                type="button"
                onClick={() => setFloorFilter(fl)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  floorFilter === fl
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-400 hover:text-white'
                }`}
              >
                F{fl}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 overflow-hidden ${
              statusFilter === 'all'
                ? 'bg-white/10 border-white/25 text-white font-bold ring-1 ring-white/20'
                : 'bg-white/[0.02] border-white/[0.05] text-mist-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold truncate">All Rooms</p>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5 text-white truncate">{stats.total}</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ready')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 overflow-hidden ${
              statusFilter === 'ready'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                : 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 truncate">Ready ({stats.ready})</p>
            <p className="text-xs sm:text-sm font-bold font-mono mt-0.5 text-emerald-200 truncate">Clean & Ready</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('cleaning')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 overflow-hidden ${
              statusFilter === 'cleaning'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 font-bold ring-1 ring-sky-500/30'
                : 'bg-sky-500/[0.04] border-sky-500/20 text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/10'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 truncate">
              {isMaintenance ? 'Repairing' : 'Cleaning'} ({stats.cleaning})
            </p>
            <p className="text-xs sm:text-sm font-bold font-mono mt-0.5 text-sky-200 truncate">In Progress</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('dirty')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 overflow-hidden ${
              statusFilter === 'dirty'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-bold ring-1 ring-rose-500/30'
                : 'bg-rose-500/[0.04] border-rose-500/20 text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-400 truncate">
              {isMaintenance ? 'Damaged' : 'Dirty'} ({stats.dirty})
            </p>
            <p className="text-xs sm:text-sm font-bold font-mono mt-0.5 text-rose-200 truncate">
              {isMaintenance ? 'Need to Repair' : 'Need to Clean'}
            </p>
          </button>

          {/* DND Button */}
          <button
            type="button"
            onClick={() => setStatusFilter('dnd')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 overflow-hidden ${
              statusFilter === 'dnd'
                ? 'bg-purple-500/25 border-purple-400/60 text-purple-200 font-bold ring-1 ring-purple-400/40 shadow-sm'
                : 'bg-purple-500/[0.06] border-purple-400/25 text-purple-300 hover:border-purple-400/50 hover:bg-purple-500/10'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider flex items-center gap-1 font-semibold text-purple-300 truncate">
              <Moon className="h-3 w-3 text-purple-300 shrink-0" />
              <span className="truncate">DND ({stats.dnd})</span>
            </p>
            <p className="text-xs sm:text-sm font-bold font-mono mt-0.5 text-purple-200 truncate">Do Not Disturb</p>
          </button>

          {/* Out of Order Button */}
          <button
            type="button"
            onClick={() => setStatusFilter('out_of_order')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer min-w-0 overflow-hidden ${
              statusFilter === 'out_of_order'
                ? 'bg-slate-700/80 border-slate-400 text-white font-bold ring-1 ring-slate-400/40 shadow-md'
                : 'bg-slate-800/40 border-slate-600/40 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider flex items-center gap-1 font-semibold text-slate-300 truncate">
              <AlertTriangle className="h-3 w-3 text-slate-300 shrink-0" />
              <span className="truncate">OOO ({stats.ooo})</span>
            </p>
            <p className="text-xs sm:text-sm font-bold font-mono mt-0.5 text-slate-200 truncate">Out of Order</p>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room number (e.g. 101, 204, 509)..."
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredRooms.map((rm) => {
          const inspection = (inspections ?? []).find((i) => i.roomNumber === rm.no);
          const isPending = rm.readiness === 'inspection_pending' || inspection?.status === 'pending';
          const isReady = rm.readiness === 'ready';
          const isCleaning = rm.readiness === 'cleaning';
          const isDirty = rm.readiness === 'dirty';
          const isOoo = rm.readiness === 'out_of_order' || rm.readiness === 'inspection_failed';

          const stay = stays.find((s) => s.room === rm.no);
          const isOccupied = rm.occupied || Boolean(stay && stay.status === 'in_house');
          const isVip = Boolean(stay?.vip);
          const guestName = stay?.guest;

          // Find attendant
          const relatedTask = allTasks.find((t) => t.room === rm.no || t.title.includes(`Room ${rm.no}`));
          const attendantName =
            inspection?.attendantName ||
            relatedTask?.assignee ||
            (isCleaning ? 'Attendant On Site' : isReady ? 'Meera Nambiar' : 'Unassigned');

          const roomType = getRoomType(rm);

          // Card theme classes
          let cardTheme = 'border-white/10 bg-ink-900/90 hover:border-white/20';
          let badgeTheme = 'bg-white/10 text-mist-300 border-white/10';
          let badgeLabel = rm.readiness.replace('_', ' ');
          let badgeIcon = <Sparkles className="h-3 w-3 shrink-0" />;

          if (isPending) {
            cardTheme = 'border-amber-400/50 bg-gradient-to-b from-amber-500/[0.12] to-amber-950/20 hover:border-amber-400 ring-1 ring-amber-400/30 shadow-lg shadow-amber-950/20';
            badgeTheme = 'bg-amber-400/20 text-amber-300 border-amber-400/40 animate-pulse';
            badgeLabel = 'Inspection Due';
            badgeIcon = <Clock className="h-3 w-3 shrink-0" />;
          } else if (isReady) {
            cardTheme = 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-950/20 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/20';
            badgeTheme = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            badgeLabel = 'Ready';
            badgeIcon = <CheckCircle2 className="h-3 w-3 shrink-0" />;
          } else if (isCleaning) {
            cardTheme = 'border-sky-500/30 bg-gradient-to-b from-sky-500/[0.08] to-sky-950/20 hover:border-sky-500/50 shadow-lg shadow-sky-950/20';
            badgeTheme = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
            badgeLabel = isMaintenance ? 'Repairing' : 'Cleaning';
            badgeIcon = isMaintenance ? <Wrench className="h-3 w-3 shrink-0" /> : <RotateCcw className="h-3 w-3 shrink-0" />;
          } else if (isDirty) {
            cardTheme = 'border-rose-500/30 bg-gradient-to-b from-rose-500/[0.08] to-rose-950/20 hover:border-rose-500/50 shadow-lg shadow-rose-950/20';
            badgeTheme = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            badgeLabel = isMaintenance ? 'Need to Repair' : 'Need to Clean';
            badgeIcon = isMaintenance ? <Wrench className="h-3 w-3 shrink-0" /> : <AlertCircle className="h-3 w-3 shrink-0" />;
          } else if (isOoo) {
            cardTheme = 'border-slate-600/50 bg-gradient-to-b from-slate-800/50 to-slate-900/60 hover:border-slate-500 shadow-lg shadow-slate-950/30';
            badgeTheme = 'bg-slate-700/80 text-slate-200 border-slate-500/50';
            badgeLabel = 'Out of Order';
            badgeIcon = <Wrench className="h-3 w-3 shrink-0" />;
          }

          return (
            <div
              key={rm.no}
              className={`rounded-3xl border p-4 transition-all duration-200 backdrop-blur-xl shadow-lg flex flex-col justify-between gap-3 min-w-0 overflow-hidden ${cardTheme}`}
            >
              {/* Card Top Header */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xl font-black font-mono tracking-tight text-white shrink-0">
                        Room {rm.no}
                      </span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-white/[0.06] text-mist-300 border border-white/10 shrink-0">
                        Floor {rm.floor}
                      </span>
                    </div>
                    <p className="text-xs text-mist-400 mt-1 font-medium truncate" title={roomType}>
                      {roomType}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Status Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border shadow-sm shrink-0 whitespace-nowrap ${badgeTheme}`}
                    >
                      {badgeIcon}
                      <span>{badgeLabel}</span>
                    </span>

                    {/* Secondary flags (DND / VIP) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {rm.dnd && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/50 flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0"
                          title="Do Not Disturb"
                        >
                          <Moon className="h-3 w-3 shrink-0" />
                          <span>DND</span>
                        </span>
                      )}
                      {isVip && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0"
                          title="VIP Guest"
                        >
                          <Crown className="h-3 w-3 shrink-0" />
                          <span>VIP</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Occupancy Indicator Strip */}
                <div className="flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] min-w-0">
                  <span className="text-mist-400 text-[11px] flex items-center gap-1 shrink-0">
                    <Users className="h-3 w-3 shrink-0" /> Occupancy:
                  </span>
                  {isOccupied ? (
                    <span
                      className="text-sky-300 font-semibold text-[11px] truncate text-right min-w-0 flex-1"
                      title={guestName || 'Occupied (In-House)'}
                    >
                      {guestName ? guestName : 'Occupied (In-House)'}
                    </span>
                  ) : (
                    <span className="text-emerald-400/90 font-medium text-[11px] flex items-center gap-1 shrink-0">
                      <DoorOpen className="h-3 w-3 shrink-0" /> Vacant
                    </span>
                  )}
                </div>
              </div>

              {/* Sanitation & Attendant Box */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2 text-[11px] min-w-0">
                  <span className="text-mist-400 flex items-center gap-1.5 shrink-0">
                    <UserCheck className="h-3.5 w-3.5 text-mist-300 shrink-0" /> Attendant:
                  </span>
                  <span
                    className="font-semibold text-white truncate text-right min-w-0 flex-1"
                    title={attendantName}
                  >
                    {attendantName}
                  </span>
                </div>

                {/* Flags / Notes */}
                {rm.note ? (
                  <div className="flex items-start gap-1.5 p-2 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-[11px] text-amber-200 min-w-0">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                    <span className="line-clamp-2 break-words min-w-0 flex-1 leading-snug" title={rm.note}>
                      {rm.note}
                    </span>
                  </div>
                ) : inspection?.notes ? (
                  <div className="flex items-start gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-mist-300 min-w-0">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-mist-400 mt-0.5" />
                    <span className="line-clamp-2 break-words min-w-0 flex-1 leading-snug" title={inspection.notes}>
                      {inspection.notes}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-mist-400 py-0.5 min-w-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate min-w-0 flex-1">Standard 5-category checklist</span>
                  </div>
                )}

                {inspection?.score !== undefined && (
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/[0.04] min-w-0">
                    <span className="text-mist-400 truncate">Quality Benchmark</span>
                    <span className={`font-mono font-bold shrink-0 ${inspection.score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {inspection.score}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] mt-auto min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenEscalateForRoom?.(rm.no)}
                  className="p-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:text-white text-xs transition shrink-0 cursor-pointer"
                  title="Escalate blocker to Duty Manager"
                >
                  <Flame className="h-4 w-4" />
                </button>

                {isPending ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectInspectionByRoom) onSelectInspectionByRoom(rm.no);
                      else onInspectRoom?.(rm.no);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 min-w-0 truncate cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Perform Inspection</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectInspectionByRoom) onSelectInspectionByRoom(rm.no);
                      else onInspectRoom?.(rm.no);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center gap-1.5 min-w-0 truncate cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-mist-400 shrink-0" />
                    <span className="truncate">Inspect / Status Log</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredRooms.length === 0 && (
          <div className="col-span-full py-16 px-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 text-mist-400 mx-auto grid place-items-center">
              <BedDouble className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No rooms found</h3>
            <p className="text-xs text-mist-400 max-w-sm mx-auto">
              No rooms match the selected floor {floorFilter !== 'all' ? `(Floor ${floorFilter})` : ''} and readiness filter {statusFilter !== 'all' ? `(${statusFilter})` : ''}.
            </p>
            <button
              type="button"
              onClick={() => {
                setFloorFilter('all');
                setStatusFilter('all');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
