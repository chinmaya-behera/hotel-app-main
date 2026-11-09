'use client';

import { useMemo } from 'react';
import { useDemo } from '@/lib/store';
import type {
  SupervisorInspection,
  WorkItem,
} from '@/types/demo';

interface UnifiedOperationsDesktopProps {
  onNavigateTab: (tabId: string) => void;
  onSelectInspection: (inspection: SupervisorInspection) => void;
  onOpenCreateTask: () => void;
  onOpenEscalate: () => void;
  activeDept?: string;
  onSelectDept?: (dept: string) => void;
}

export function UnifiedOperationsDesktop({
  onNavigateTab,
  onOpenCreateTask,
  onOpenEscalate,
  activeDept = 'all',
  onSelectDept,
}: UnifiedOperationsDesktopProps) {
  const { state, autoAssignTask } = useDemo();

  // Combine all dispatcher and supervisor tasks
  const allTasks = useMemo(() => {
    return [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
  }, [state.items]);

  const staffList = state.staffAccounts ?? [];

  // Filter tasks by active department
  const filteredTasks = useMemo(() => {
    if (!activeDept || activeDept === 'all') return allTasks;
    const key = activeDept.toLowerCase();
    return allTasks.filter((t) => {
      const d = (t.department || '').toLowerCase();
      const c = (t.category || '').toLowerCase();
      const m = (t.meta || '').toLowerCase();
      if (key === 'maintenance' || key === 'engineering') {
        return d.includes('maintenance') || d.includes('engineering') || c.includes('maintenance') || m.includes('maintenance');
      }
      if (key === 'housekeeping') {
        return d.includes('housekeeping') || c.includes('housekeeping') || m.includes('housekeeping');
      }
      if (key === 'f&b' || key === 'food_beverage' || key === 'dining') {
        return d.includes('food') || d.includes('beverage') || c.includes('f&b') || c.includes('dining') || m.includes('f&b') || c.includes('room_service');
      }
      return true;
    });
  }, [allTasks, activeDept]);

  // Filter staff by department
  const filteredStaff = useMemo(() => {
    const fulfillers = staffList.filter((s) => s.roleId === 'task_fulfiller');
    if (!activeDept || activeDept === 'all') return fulfillers;
    const key = activeDept.toLowerCase();
    return fulfillers.filter((s) => {
      const d = (s.department || '').toLowerCase();
      if (key === 'maintenance' || key === 'engineering') {
        return d.includes('maintenance') || d.includes('engineering');
      }
      if (key === 'housekeeping') {
        return d.includes('housekeeping');
      }
      if (key === 'f&b' || key === 'food_beverage') {
        return d.includes('food') || d.includes('beverage');
      }
      return true;
    });
  }, [staffList, activeDept]);

  // Task KPI calculations
  const unassignedTasks = filteredTasks.filter(
    (t) => t.status === 'Unassigned' || t.status === 'Received',
  );
  const activeTasks = filteredTasks.filter(
    (t) => t.status === 'Assigned' || t.status === 'In progress' || t.status === 'Accepted',
  );
  const overdueOrBlockedTasks = filteredTasks.filter(
    (t) =>
      t.status === 'Blocked' ||
      t.status === 'Failed' ||
      t.ackStatus === 'overdue' ||
      t.chip?.toLowerCase().includes('overdue') ||
      t.slaDue?.toLowerCase().includes('overdue'),
  );

  // Department counts for switcher pills
  const deptCounts = useMemo(() => {
    const getCount = (k: string) => {
      return allTasks.filter((t) => {
        const d = (t.department || '').toLowerCase();
        const c = (t.category || '').toLowerCase();
        const m = (t.meta || '').toLowerCase();
        if (k === 'maintenance') {
          return d.includes('maintenance') || d.includes('engineering') || c.includes('maintenance') || m.includes('maintenance');
        }
        if (k === 'housekeeping') {
          return d.includes('housekeeping') || c.includes('housekeeping') || m.includes('housekeeping');
        }
        if (k === 'f&b') {
          return d.includes('food') || d.includes('beverage') || c.includes('f&b') || c.includes('dining') || m.includes('f&b') || c.includes('room_service');
        }
        return false;
      }).length;
    };
    return {
      all: allTasks.length,
      maintenance: getCount('maintenance'),
      housekeeping: getCount('housekeeping'),
      fnb: getCount('f&b'),
    };
  }, [allTasks]);

  // Urgent pending queue items
  const priorityQueue = unassignedTasks
    .sort((a, b) => (b.priority === 'critical' ? 2 : b.priority === 'urgent' ? 1 : 0) - (a.priority === 'critical' ? 2 : a.priority === 'urgent' ? 1 : 0))
    .slice(0, 5);

  // Active in-field tickets
  const activeWorkOrders = activeTasks.slice(0, 5);

  const isMaintenance = activeDept.toLowerCase() === 'maintenance' || activeDept.toLowerCase() === 'engineering';

  return (
    <div className="space-y-6">
      {/* DEPARTMENT CONTEXT FILTER BAR (Clean text-first pills, no icons, no image boxes) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.08] bg-ink-900/80 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 pl-1">
            Department Stream:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectDept?.('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeDept === 'all'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              All Operations ({deptCounts.all})
            </button>

            <button
              type="button"
              onClick={() => onSelectDept?.('maintenance')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                isMaintenance
                  ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              Maintenance & Engineering ({deptCounts.maintenance})
            </button>

            <button
              type="button"
              onClick={() => onSelectDept?.('housekeeping')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeDept === 'housekeeping'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              Housekeeping ({deptCounts.housekeeping})
            </button>

            <button
              type="button"
              onClick={() => onSelectDept?.('food_beverage')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeDept === 'food_beverage'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              F&B / In-Room Dining ({deptCounts.fnb})
            </button>
          </div>
        </div>

        {isMaintenance && (
          <div className="px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold">
            Engineering Active Desk &bull; Lead: Arjun Mehta
          </div>
        )}
      </div>

      {/* SECTION 1: CORE 4-METRIC OPERATIONAL STRIP (Clean Text-First, No Icon Boxes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="group cursor-pointer rounded-xl border border-white/[0.08] bg-ink-900/60 p-4 backdrop-blur-xl hover:border-amber-400/40 hover:bg-ink-900/90 transition shadow-sm"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-mist-400 mb-1.5">
            Unassigned Queue
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {unassignedTasks.length}
            </span>
            <span className="text-xs text-amber-400 font-medium">Awaiting Dispatch</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400">
            {isMaintenance ? 'Engineering work orders' : 'Cross-department tickets'} &rarr;
          </p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateTab('workload')}
          className="group cursor-pointer rounded-xl border border-white/[0.08] bg-ink-900/60 p-4 backdrop-blur-xl hover:border-emerald-400/40 hover:bg-ink-900/90 transition shadow-sm"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-mist-400 mb-1.5">
            Active Field Work
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {activeTasks.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">In Progress</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400">
            {filteredStaff.length} technicians on duty &rarr;
          </p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('blockers')}
          className="group cursor-pointer rounded-xl border border-white/[0.08] bg-ink-900/60 p-4 backdrop-blur-xl hover:border-rose-400/40 hover:bg-ink-900/90 transition shadow-sm"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-mist-400 mb-1.5">
            Overdue & Escalations
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-300 tracking-tight">
              {overdueOrBlockedTasks.length}
            </span>
            <span className="text-xs text-rose-400 font-medium">Attention Needed</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400">
            SLA breaches or dependencies &rarr;
          </p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('sla')}
          className="group cursor-pointer rounded-xl border border-white/[0.08] bg-ink-900/60 p-4 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-ink-900/90 transition shadow-sm"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-mist-400 mb-1.5">
            {isMaintenance ? 'Engineering SLA Health' : 'Service SLA Health'}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-300 tracking-tight">
              96.4%
            </span>
            <span className="text-xs text-cyan-300 font-medium">On-Time Rate</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400">
            Avg dispatch response: 3.8m &rarr;
          </p>
        </div>
      </div>

      {/* SECTION 2: IMMEDIATE DISPATCH STREAM & ACTIVE WORK ORDERS (2-COLUMN GRID, NO ICON BOXES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Priority Dispatch Requests */}
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold font-display text-white">
                  Priority Dispatch Stream
                </h2>
                <p className="text-xs text-mist-400">
                  {priorityQueue.length} pending requests awaiting assignment
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('queue')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
              >
                View Full Queue &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {priorityQueue.length === 0 ? (
                <div className="py-10 text-center text-mist-400 space-y-1">
                  <p className="text-sm font-semibold text-white">All Requests Dispatched</p>
                  <p className="text-xs">No pending requests in the unassigned queue.</p>
                </div>
              ) : (
                priorityQueue.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            task.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : task.priority === 'urgent'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/10 text-mist-300 border border-white/10'
                          }`}
                        >
                          {task.priority || 'Normal'}
                        </span>
                        {task.room && (
                          <span className="text-[11px] font-mono text-mist-300 bg-white/[0.06] px-1.5 py-0.5 rounded">
                            Room {task.room}
                          </span>
                        )}
                        <span className="text-xs text-mist-400 truncate">
                          {task.department || 'Operations'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-mist-400 truncate mt-0.5">
                        {task.meta || task.description || 'Standard response protocol'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => autoAssignTask(task.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold transition shadow-sm"
                      >
                        Auto-Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-mist-400">
            <span>Urgent SLA: 15-minute acknowledgment window</span>
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              + New Work Order
            </button>
          </div>
        </div>

        {/* Right Column: Active In-Field Work Orders & Issues */}
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold font-display text-white">
                  Active Field Work Orders
                </h2>
                <p className="text-xs text-mist-400">
                  Jobs currently in progress by field technicians
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('blockers')}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition"
              >
                View Escalations &rarr;
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {activeWorkOrders.length === 0 ? (
                <div className="py-10 text-center text-mist-400 space-y-1">
                  <p className="text-sm font-semibold text-white">No Active Jobs In Flight</p>
                  <p className="text-xs">Assign pending items from the queue to start work orders.</p>
                </div>
              ) : (
                activeWorkOrders.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {task.status}
                        </span>
                        {task.room && (
                          <span className="text-[11px] font-mono text-mist-300 bg-white/[0.06] px-1.5 py-0.5 rounded">
                            Room {task.room}
                          </span>
                        )}
                        <span className="text-xs text-mist-400 truncate">
                          Assigned: {task.assignee || 'Wayne Chen'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-mist-400 truncate mt-0.5">
                        Due: {task.slaDue || '10:30'} &bull; Ref: {task.ref || task.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={onOpenEscalate}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 transition"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-mist-400">
            <span>Track live progress and communication</span>
            <button
              type="button"
              onClick={() => onNavigateTab('workload')}
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              Manage Assignments &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: ON-DUTY PERSONNEL & SYSTEM SHORTCUTS (2-COLUMN GRID, NO IMAGE/AVATAR BOXES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Duty Field Personnel (Clean text rows, NO avatar image boxes) */}
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-base font-bold font-display text-white">
                {isMaintenance ? 'On-Duty Engineering Crew' : 'On-Duty Field Crew'}
              </h3>
              <p className="text-xs text-mist-400">
                {filteredStaff.length} technicians available for dispatch
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('workload')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Workload Matrix &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredStaff.length === 0 ? (
              <p className="text-xs text-mist-400 py-4 text-center">No staff found for this department.</p>
            ) : (
              filteredStaff.slice(0, 4).map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{tech.name}</p>
                    <p className="text-xs text-mist-400">
                      {tech.department} &bull; {tech.floorZone || 'Floors 1-6'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      Available
                    </span>
                    <span className="text-xs font-mono text-mist-300">
                      Shift: {tech.shift || 'Day'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Specialized Workflows Quick Launch (Clean Cards, No Icon Boxes) */}
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Specialized Operations Tools
              </h3>
              <p className="text-xs text-mist-400">
                Full control panels kept in the left-side navigation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('inspections')}
              className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/30 text-left transition space-y-1"
            >
              <p className="text-sm font-bold text-white">Quality Inspections &rarr;</p>
              <p className="text-xs text-mist-400">Room checklists & sign-offs</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('rooms')}
              className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/30 text-left transition space-y-1"
            >
              <p className="text-sm font-bold text-white">Room Readiness &rarr;</p>
              <p className="text-xs text-mist-400">Turnover & cleaning pipeline</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('routing')}
              className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/30 text-left transition space-y-1"
            >
              <p className="text-sm font-bold text-white">Auto-Routing &rarr;</p>
              <p className="text-xs text-mist-400">Rules & assignment simulator</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('handover')}
              className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/30 text-left transition space-y-1"
            >
              <p className="text-sm font-bold text-white">Shift Handover &rarr;</p>
              <p className="text-xs text-mist-400">Logs & cross-shift notes</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
