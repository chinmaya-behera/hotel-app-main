'use client';

import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Send,
  UserCheck,
  Activity,
  Layers,
  Wrench,
  Bed,
  UtensilsCrossed,
  Calendar,
  Flame,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';

interface DispatcherOverviewTabProps {
  onNavigateTab: (tabId: string) => void;
}

export function DispatcherOverviewTab({ onNavigateTab }: DispatcherOverviewTabProps) {
  const { state, autoAssignTask, autoAssignAllPending } = useDemo();

  const allTasks = state.items.department_dispatcher ?? [];
  const fulfillers = (state.staffAccounts ?? []).filter((s) => s.roleId === 'task_fulfiller');

  // Metrics
  const totalTasks = allTasks.length;
  const unassignedTasks = allTasks.filter((t) => t.status === 'Unassigned' || t.status === 'Received');
  const activeTasks = allTasks.filter((t) => t.status === 'Assigned' || t.status === 'In progress' || t.status === 'Accepted');
  const completedTasks = allTasks.filter((t) => t.status === 'Completed');
  const overdueTasks = allTasks.filter(
    (t) => t.ackStatus === 'overdue' || t.chip?.toLowerCase().includes('overdue') || t.slaDue?.toLowerCase().includes('overdue'),
  );
  const onDutyCount = fulfillers.filter((f) => f.status === 'active' && (!f.availability || f.availability === 'on_duty')).length;
  const autoAssignedCount = allTasks.filter((t) => t.autoAssigned).length;
  const autoAssignRate = totalTasks > 0 ? Math.round((autoAssignedCount / totalTasks) * 100) : 75;
  const escalatedCount = allTasks.filter((t) => t.status === 'Escalated' || t.escalatedTo).length;

  // Urgent items (overdue, safety, critical, vip)
  const urgentItems = allTasks.filter(
    (t) =>
      t.status === 'Unassigned' &&
      (t.priority === 'critical' || t.priority === 'urgent' || t.priority === 'safety' || t.priority === 'vip' || t.ackStatus === 'overdue'),
  );

  // Department workloads
  const hkTasks = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('housekeeping'));
  const mxTasks = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('maintenance'));
  const fbTasks = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('food') || t.category === 'room_service');

  return (
    <div className="space-y-6">
      {/* 8 Live Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inbound Today</span>
            <ArrowUpRight className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{totalTasks}</span>
            <span className="text-xs text-mist-400 font-mono">tickets</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Guest portal & sensors</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.04] p-4 backdrop-blur-xl shadow-lg hover:border-amber-400/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unassigned Queue</span>
            <AlertTriangle className="h-4 w-4 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-amber-300">{unassignedTasks.length}</span>
            <span className="text-xs text-amber-200/70 font-mono">pending</span>
          </div>
          <p className="text-[10px] text-amber-200/70 mt-1">Awaiting dispatch</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active in Field</span>
            <Clock className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{activeTasks.length}</span>
            <span className="text-xs text-emerald-400 font-mono">in flight</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Accepted or in progress</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('sla')}
          className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.05] p-4 backdrop-blur-xl shadow-lg hover:border-rose-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue SLAs</span>
            <Flame className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-rose-400">{overdueTasks.length}</span>
            <span className="text-xs text-rose-300/70 font-mono">breached</span>
          </div>
          <p className="text-[10px] text-rose-300/70 mt-1">Requires immediate attention</p>
        </div>

        {/* Metric 5 */}
        <div
          onClick={() => onNavigateTab('workload')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">On-Duty Attendants</span>
            <Users className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{onDutyCount}</span>
            <span className="text-xs text-mist-400 font-mono">/ {fulfillers.length}</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">HK, MX & FB Runners</p>
        </div>

        {/* Metric 6 */}
        <div
          onClick={() => onNavigateTab('routing')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Auto-Assign Ratio</span>
            <Sparkles className="h-4 w-4 text-amber-300 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{autoAssignRate}%</span>
            <span className="text-xs text-emerald-400 font-mono">optimal</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Deterministic routing</p>
        </div>

        {/* Metric 7 */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Response Time</span>
            <Clock className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">2m 40s</span>
            <span className="text-xs text-emerald-400 font-mono">Ack SLA</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Within target (&lt;5m)</p>
        </div>

        {/* Metric 8 */}
        <div
          onClick={() => onNavigateTab('sla')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Escalated to Mgr</span>
            <ShieldAlert className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{escalatedCount}</span>
            <span className="text-xs text-mist-400 font-mono">logged</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Duty Manager review</p>
        </div>
      </div>

      {/* Urgent Attention Queue */}
      {urgentItems.length > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.04] p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base font-bold font-display text-white">
                Urgent Attention Required ({urgentItems.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('queue')}
              className="text-xs text-rose-300 hover:text-white transition flex items-center gap-1 font-semibold"
            >
              <span>View in Queue</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-ink-950/70 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-300">{item.ref}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-mist-400 line-clamp-2">{item.description || item.meta}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <span className="text-[11px] font-mono text-rose-300">
                    Ack SLA: {item.ackSlaDue || 'Overdue'}
                  </span>
                  <button
                    type="button"
                    onClick={() => autoAssignTask(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Assign</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Grid: Department Workload & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Distribution */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-base font-bold font-display text-white">Department Workload Distribution</h2>
              <p className="text-xs text-mist-400">Current ticket distribution and operational demand</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('workload')}
              className="text-xs text-amber-300 hover:text-white font-semibold transition flex items-center gap-1"
            >
              <span>Manage Roster</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {/* Housekeeping */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-white">
                  <Bed className="h-4 w-4 text-emerald-400" />
                  Housekeeping & Linen
                </span>
                <span className="font-mono text-mist-300">{hkTasks.length} tasks</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (hkTasks.length / 10) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-mist-500">
                <span>Floors 1–5 coverage</span>
                <span>Capacity: 60%</span>
              </div>
            </div>

            {/* Maintenance & Engineering */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-white">
                  <Wrench className="h-4 w-4 text-amber-400" />
                  Maintenance & Engineering
                </span>
                <span className="font-mono text-mist-300">{mxTasks.length} tasks</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (mxTasks.length / 10) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-mist-500">
                <span>HVAC & plumbing repairs</span>
                <span>Capacity: 75%</span>
              </div>
            </div>

            {/* Food & Beverage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-white">
                  <UtensilsCrossed className="h-4 w-4 text-purple-400" />
                  Food & Beverage (In-Room Dining)
                </span>
                <span className="font-mono text-mist-300">{fbTasks.length} tasks</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (fbTasks.length / 10) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-mist-500">
                <span>Tray delivery & bar setups</span>
                <span>Capacity: 40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Dispatch Feed Stream */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-base font-bold font-display text-white">Live Property Dispatch Stream</h2>
              <p className="text-xs text-mist-400">Real-time status updates and fulfillment events</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {state.feed.slice(0, 8).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-xs hover:bg-white/[0.03] transition"
              >
                <div className="h-7 w-7 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {event.role[0]}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{event.role}</span>
                    <span className="font-mono text-[10px] text-mist-400">{event.at}</span>
                  </div>
                  <p className="text-mist-300 text-[11px] leading-relaxed">{event.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
