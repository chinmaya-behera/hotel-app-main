'use client';

import { useState, useMemo } from 'react';
import {
  BedDouble,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  Moon,
} from 'lucide-react';
import type { RoomRecord, SupervisorInspection, Readiness } from '@/types/demo';

interface SupervisorRoomsTabProps {
  rooms: RoomRecord[];
  inspections: SupervisorInspection[];
  onSelectInspectionByRoom: (roomNumber: string) => void;
  onOpenEscalateForRoom: (roomNumber: string) => void;
}

export function SupervisorRoomsTab({
  rooms,
  inspections,
  onSelectInspectionByRoom,
  onOpenEscalateForRoom,
}: SupervisorRoomsTabProps) {
  const [floorFilter, setFloorFilter] = useState<'all' | number>('all');
  const [readinessFilter, setReadinessFilter] = useState<'all' | Readiness>('all');
  const [search, setSearch] = useState('');

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (floorFilter !== 'all' && r.floor !== floorFilter) return false;
      if (readinessFilter !== 'all' && r.readiness !== readinessFilter) return false;
      if (search.trim() && !r.no.toLowerCase().includes(search.toLowerCase().trim()))
        return false;
      return true;
    });
  }, [rooms, floorFilter, readinessFilter, search]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      ready: rooms.filter((r) => r.readiness === 'ready').length,
      inspectionPending: rooms.filter((r) => r.readiness === 'inspection_pending').length,
      cleaning: rooms.filter((r) => r.readiness === 'cleaning').length,
      dirty: rooms.filter((r) => r.readiness === 'dirty').length,
      ooo: rooms.filter((r) => r.readiness === 'out_of_order' || r.readiness === 'inspection_failed').length,
    };
  }, [rooms]);

  return (
    <div className="space-y-6">
      {/* Header & Metric Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Property Room Readiness & Turnover Grid
            </h2>
            <p className="text-xs text-mist-400">
              Floor-by-floor room sanitation statuses connected directly to the Front Desk inventory
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setReadinessFilter('all')}
            className={`p-2.5 rounded-2xl border text-left transition ${
              readinessFilter === 'all'
                ? 'bg-white/10 border-white/20 text-white font-bold'
                : 'bg-white/[0.02] border-white/[0.04] text-mist-400 hover:text-white'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">All Rooms</p>
            <p className="text-base font-bold font-mono mt-0.5">{stats.total}</p>
          </button>

          <button
            type="button"
            onClick={() => setReadinessFilter('ready')}
            className={`p-2.5 rounded-2xl border text-left transition ${
              readinessFilter === 'ready'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold'
                : 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300 hover:border-emerald-500/40'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">Ready ({stats.ready})</p>
            <p className="text-base font-bold font-mono mt-0.5">Clean & Inspected</p>
          </button>

          <button
            type="button"
            onClick={() => setReadinessFilter('inspection_pending')}
            className={`p-2.5 rounded-2xl border text-left transition ${
              readinessFilter === 'inspection_pending'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-bold'
                : 'bg-amber-500/[0.04] border-amber-500/20 text-amber-300 hover:border-amber-500/40'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">Inspection Due ({stats.inspectionPending})</p>
            <p className="text-base font-bold font-mono mt-0.5">Cleaned</p>
          </button>

          <button
            type="button"
            onClick={() => setReadinessFilter('cleaning')}
            className={`p-2.5 rounded-2xl border text-left transition ${
              readinessFilter === 'cleaning'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 font-bold'
                : 'bg-sky-500/[0.04] border-sky-500/20 text-sky-300 hover:border-sky-500/40'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">In Progress ({stats.cleaning})</p>
            <p className="text-base font-bold font-mono mt-0.5">Attendant On Site</p>
          </button>

          <button
            type="button"
            onClick={() => setReadinessFilter('dirty')}
            className={`p-2.5 rounded-2xl border text-left transition ${
              readinessFilter === 'dirty'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 font-bold'
                : 'bg-rose-500/[0.04] border-rose-500/20 text-rose-300 hover:border-rose-500/40'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider">Dirty ({stats.dirty})</p>
            <p className="text-base font-bold font-mono mt-0.5">Turnover Queued</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((rm) => {
          const inspection = inspections.find((i) => i.roomNumber === rm.no);
          const isPending = rm.readiness === 'inspection_pending' || inspection?.status === 'pending';
          const isReady = rm.readiness === 'ready';
          const isCleaning = rm.readiness === 'cleaning';
          const isDirty = rm.readiness === 'dirty';

          return (
            <div
              key={rm.no}
              className={`rounded-3xl border p-4.5 transition-all duration-200 backdrop-blur-xl shadow-lg space-y-3 ${
                isPending
                  ? 'border-amber-400/40 bg-amber-500/[0.08] hover:border-amber-400'
                  : isReady
                  ? 'border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/50'
                  : isCleaning
                  ? 'border-sky-500/25 bg-sky-500/[0.04] hover:border-sky-500/50'
                  : 'border-white/10 bg-ink-900/90 hover:border-white/20'
              }`}
            >
              {/* Room Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-white">
                      Room {rm.no}
                    </span>
                    {rm.dnd && (
                      <span className="p-1 rounded-lg bg-rose-500/20 text-rose-300" title="Do Not Disturb">
                        <Moon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-mist-400">
                    Floor {rm.floor} · {rm.occupied ? 'Occupied Guest Stay' : 'Vacant Inventory'}
                  </p>
                </div>

                {/* Status Pill */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isReady
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isPending
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : isCleaning
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {rm.readiness.replace('_', ' ')}
                </span>
              </div>

              {/* Note / Attendant Info */}
              <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] space-y-1">
                {rm.note ? (
                  <p className="text-mist-300 italic truncate">&quot;{rm.note}&quot;</p>
                ) : (
                  <p className="text-mist-400">No special inspection flags noted.</p>
                )}
                {inspection && (
                  <p className="text-mist-400 text-[10px]">
                    Attendant: <span className="text-white">{inspection.attendantName}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => onOpenEscalateForRoom(rm.no)}
                  className="p-1.5 rounded-xl border border-rose-500/20 text-rose-300 hover:bg-rose-500/10 text-xs transition"
                  title="Escalate blocker to Duty Manager"
                >
                  <Flame className="h-3.5 w-3.5" />
                </button>

                {isPending ? (
                  <button
                    type="button"
                    onClick={() => onSelectInspectionByRoom(rm.no)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Perform Inspection</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectInspectionByRoom(rm.no)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.06] transition text-center"
                  >
                    View Status Log
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
