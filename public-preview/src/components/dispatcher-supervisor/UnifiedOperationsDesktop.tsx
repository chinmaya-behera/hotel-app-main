'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowUpRight,
  Flame,
  Bed,
  Wrench,
  UtensilsCrossed,
  ClipboardCheck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Radio,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type {
  SupervisorInspection,
  RoomRecord,
  StaffAccount,
  WorkItem,
} from '@/types/demo';

interface UnifiedOperationsDesktopProps {
  onNavigateTab: (tabId: string) => void;
  onSelectInspection: (inspection: SupervisorInspection) => void;
  onOpenCreateTask: () => void;
  onOpenEscalate: () => void;
}

export function UnifiedOperationsDesktop({
  onNavigateTab,
  onSelectInspection,
  onOpenCreateTask,
  onOpenEscalate,
}: UnifiedOperationsDesktopProps) {
  const { state, autoAssignTask, approveInspection } = useDemo();

  const allTasks = useMemo(() => {
    return [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
  }, [state.items]);

  const inspections = state.inspections ?? [];
  const rooms: RoomRecord[] = state.frontDesk?.rooms ?? [];
  const staffList = state.staffAccounts ?? [];

  // 1. Task Metrics
  const totalTasks = allTasks.length;
  const unassignedTasks = allTasks.filter(
    (t) => t.status === 'Unassigned' || t.status === 'Received',
  );
  const activeTasks = allTasks.filter(
    (t) => t.status === 'Assigned' || t.status === 'In progress' || t.status === 'Accepted',
  );
  const overdueTasks = allTasks.filter(
    (t) =>
      t.ackStatus === 'overdue' ||
      t.chip?.toLowerCase().includes('overdue') ||
      t.slaDue?.toLowerCase().includes('overdue'),
  );

  // 2. Inspection & Room Metrics
  const pendingInspections = inspections.filter((i) => i.status === 'pending');
  const readyRoomsCount = rooms.filter((r) => r.readiness === 'ready').length;
  const inspectionPendingRooms = rooms.filter((r) => r.readiness === 'inspection_pending').length;
  const cleaningRooms = rooms.filter((r) => r.readiness === 'cleaning').length;
  const dirtyRooms = rooms.filter((r) => r.readiness === 'dirty').length;

  // 3. Staff Metrics
  const fulfillers = staffList.filter((s) => s.roleId === 'task_fulfiller');
  const onDutyCount = fulfillers.filter(
    (f) => f.status === 'active' && (!f.availability || f.availability === 'on_duty'),
  ).length;

  // 4. Urgent Items
  const urgentTasks = allTasks.filter(
    (t) =>
      t.status === 'Unassigned' &&
      (t.priority === 'critical' ||
        t.priority === 'urgent' ||
        t.priority === 'safety' ||
        t.priority === 'vip' ||
        t.ackStatus === 'overdue'),
  );

  // Department distribution
  const hkTasks = allTasks.filter((t) =>
    (t.department || t.category || '').toLowerCase().includes('housekeeping'),
  );
  const mxTasks = allTasks.filter((t) =>
    (t.department || t.category || '').toLowerCase().includes('maintenance'),
  );
  const fbTasks = allTasks.filter(
    (t) =>
      (t.department || t.category || '').toLowerCase().includes('food') ||
      t.category === 'room_service',
  );

  return (
    <div className="space-y-6">
      {/* SECTION 1: CORE UNIFIED 4-METRIC STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Queue */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="group cursor-pointer rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] to-ink-900/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl hover:border-amber-400/40 transition"
        >
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-bold uppercase tracking-wider">Unassigned Queue</span>
            <AlertTriangle className="h-4 w-4 group-hover:scale-110 transition" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-300">
              {unassignedTasks.length}
            </span>
            <span className="text-xs text-mist-400 font-mono">/ {totalTasks} total</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-200/70">
            {urgentTasks.length > 0 ? `${urgentTasks.length} urgent priority` : 'Awaiting dispatch'}
          </p>
        </div>

        {/* Metric 2: Active Field Work */}
        <div
          onClick={() => onNavigateTab('workload')}
          className="group cursor-pointer rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] to-ink-900/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl hover:border-emerald-400/40 transition"
        >
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider">Active in Field</span>
            <Clock className="h-4 w-4 group-hover:text-emerald-200 transition" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {activeTasks.length}
            </span>
            <span className="text-xs text-emerald-400 font-mono">in progress</span>
          </div>
          <p className="mt-1 text-[11px] text-mist-400">
            {onDutyCount} attendants on duty
          </p>
        </div>

        {/* Metric 3: Overdue / Blockers */}
        <div
          onClick={() => onNavigateTab(overdueTasks.length > 0 ? 'blockers' : 'sla')}
          className="group cursor-pointer rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-ink-900/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl hover:border-rose-500/40 transition"
        >
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue / Blockers</span>
            <Flame className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {overdueTasks.length}
            </span>
            <span className="text-xs text-rose-300/70 font-mono">SLA breaches</span>
          </div>
          <p className="mt-1 text-[11px] text-mist-400">
            Requires immediate supervisor action
          </p>
        </div>

        {/* Metric 4: Room Quality & Readiness */}
        <div
          onClick={() => onNavigateTab('rooms')}
          className="group cursor-pointer rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.08] to-ink-900/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl hover:border-sky-400/40 transition"
        >
          <div className="flex items-center justify-between text-sky-300">
            <span className="text-xs font-bold uppercase tracking-wider">Room Readiness</span>
            <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {readyRoomsCount}
            </span>
            <span className="text-xs text-sky-300 font-mono">/ {rooms.length || 32} ready</span>
          </div>
          <p className="mt-1 text-[11px] text-sky-200/80">
            {pendingInspections.length} awaiting quality check
          </p>
        </div>
      </div>

      {/* SECTION 2: IMMEDIATE ATTENTION ACTION HUB (2-COLUMN SPLIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Urgent Dispatch Requests */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-base font-bold font-display text-white">
                  Priority Dispatch Queue ({unassignedTasks.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('queue')}
                className="text-xs text-amber-300 hover:text-white font-semibold transition flex items-center gap-1"
              >
                <span>Full Queue</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {unassignedTasks.length === 0 ? (
                <div className="text-center py-8 text-mist-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Queue is clear</p>
                  <p className="text-xs">All incoming tickets have been assigned.</p>
                </div>
              ) : (
                unassignedTasks.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-white/[0.06] bg-ink-950/70 hover:bg-white/[0.02] transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-amber-300">{item.ref}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.priority}
                        </span>
                        <span className="text-[11px] text-mist-400 truncate">
                          {item.department || item.category}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {item.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => autoAssignTask(item.id)}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Auto-Assign</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-mist-400">
            <span>Average response time: 2m 40s</span>
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="text-amber-300 hover:text-white font-semibold flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Manual Task</span>
            </button>
          </div>
        </div>

        {/* Right Column: Rooms Awaiting Quality Inspection */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
                <h2 className="text-base font-bold font-display text-white">
                  Awaiting Quality Sign-Off ({pendingInspections.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('inspections')}
                className="text-xs text-sky-300 hover:text-white font-semibold transition flex items-center gap-1"
              >
                <span>Inspections Board</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {pendingInspections.length === 0 ? (
                <div className="text-center py-8 text-mist-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No pending inspections</p>
                  <p className="text-xs">All cleaned rooms have been certified.</p>
                </div>
              ) : (
                pendingInspections.slice(0, 3).map((insp) => (
                  <div
                    key={insp.id}
                    className="p-3.5 rounded-2xl border border-white/[0.06] bg-ink-950/70 hover:bg-white/[0.02] transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white font-mono">
                          Room {insp.roomNumber}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {insp.roomType || 'Deluxe Room'}
                        </span>
                        {insp.priority === 'vip' && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-400 text-ink-950">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mist-400 truncate">
                        Attendant: {insp.attendantName} · Completed at {insp.completedAt || 'Recently'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectInspection(insp)}
                        className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] hover:bg-white/[0.1] text-xs font-semibold text-white transition"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => approveInspection(insp.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-ink-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        title="Quick approve and release to Front Desk"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Pass</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-mist-400">
            <span>First-Pass Quality Target: 90%</span>
            <button
              type="button"
              onClick={onOpenEscalate}
              className="text-rose-400 hover:text-white font-semibold flex items-center gap-1"
            >
              <Flame className="h-3 w-3" />
              <span>Escalate Discrepancy</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: ROOM READINESS PIPELINE & LIVE WORKLOAD (2-COLUMN SPLIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Readiness Pipeline */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Property Room Readiness Pipeline
              </h3>
              <p className="text-xs text-mist-400">
                Live synchronization with Front Desk check-in availability
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('rooms')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <span>Room Board</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 space-y-1">
              <p className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                Dirty
              </p>
              <p className="text-2xl font-bold font-mono text-white">{dirtyRooms}</p>
              <p className="text-[10px] text-mist-400">Turnover list</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 space-y-1">
              <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                Cleaning
              </p>
              <p className="text-2xl font-bold font-mono text-white">{cleaningRooms}</p>
              <p className="text-[10px] text-mist-400">In progress</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/[0.08] border border-sky-500/20 space-y-1">
              <p className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">
                Inspecting
              </p>
              <p className="text-2xl font-bold font-mono text-white">
                {inspectionPendingRooms || pendingInspections.length}
              </p>
              <p className="text-[10px] text-mist-400">Sign-off required</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 space-y-1">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Ready
              </p>
              <p className="text-2xl font-bold font-mono text-white">{readyRoomsCount}</p>
              <p className="text-[10px] text-mist-400">Front Desk ready</p>
            </div>
          </div>
        </div>

        {/* Live Department Workload Distribution */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Department Workload & Staffing
              </h3>
              <p className="text-xs text-mist-400">
                Operational capacity across active departments
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('workload')}
              className="text-xs text-amber-300 hover:text-white font-semibold transition flex items-center gap-1"
            >
              <span>Workforce Roster</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Housekeeping */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-white">
                  <Bed className="h-4 w-4 text-emerald-400" />
                  Housekeeping & Linen
                </span>
                <span className="font-mono text-mist-300">{hkTasks.length} active tasks</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, (hkTasks.length / 8) * 100))}%` }}
                />
              </div>
            </div>

            {/* Maintenance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-white">
                  <Wrench className="h-4 w-4 text-amber-400" />
                  Maintenance & Repairs
                </span>
                <span className="font-mono text-mist-300">{mxTasks.length} active tasks</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, (mxTasks.length / 8) * 100))}%` }}
                />
              </div>
            </div>

            {/* F&B */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-white">
                  <UtensilsCrossed className="h-4 w-4 text-purple-400" />
                  In-Room Dining
                </span>
                <span className="font-mono text-mist-300">{fbTasks.length} active tasks</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, (fbTasks.length / 8) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

