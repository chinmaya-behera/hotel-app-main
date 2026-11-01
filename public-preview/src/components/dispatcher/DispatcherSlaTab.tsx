'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Search,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { EscalateTaskModal } from '@/components/dispatcher/EscalateTaskModal';
import type { WorkItem } from '@/types/demo';

export function DispatcherSlaTab() {
  const { state } = useDemo();
  const [escalateModalTask, setEscalateModalTask] = useState<WorkItem | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allTasks = useMemo(() => {
    return [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
  }, [state.items.department_dispatcher_supervisor, state.items.department_dispatcher]);

  const managerTasks = state.items.department_manager ?? [];

  // Helper to categorize task SLA status without inventing targets
  function getTaskSlaCategory(task: WorkItem): 'overdue' | 'approaching' | 'on_track' | 'unconfigured' {
    const isOverdue =
      task.ackStatus === 'overdue' ||
      task.chip?.toLowerCase().includes('overdue') ||
      task.slaDue?.toLowerCase().includes('overdue') ||
      task.tone === 'danger';

    if (isOverdue) return 'overdue';

    if (!task.slaDue) {
      return 'unconfigured';
    }

    const slaLower = task.slaDue.toLowerCase();
    if (slaLower.includes('urgent') || slaLower.includes('15 min') || slaLower.includes('10 min') || slaLower.includes('5 min')) {
      return 'approaching';
    }

    return 'on_track';
  }

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Exclude completed from live SLA monitor
      if (task.status === 'Completed') return false;

      // Status filter
      const category = getTaskSlaCategory(task);
      if (selectedStatus === 'overdue' && category !== 'overdue') return false;
      if (selectedStatus === 'approaching' && category !== 'approaching') return false;
      if (selectedStatus === 'on_track' && category !== 'on_track') return false;
      if (selectedStatus === 'unconfigured' && category !== 'unconfigured') return false;

      // Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

      // Department filter
      if (selectedDept !== 'all') {
        const d = (task.department || '').toLowerCase();
        const cat = (task.category || '').toLowerCase();
        if (selectedDept === 'housekeeping' && !d.includes('housekeeping') && cat !== 'housekeeping') return false;
        if (selectedDept === 'maintenance' && !d.includes('maintenance') && cat !== 'maintenance') return false;
        if (selectedDept === 'food' && !d.includes('food') && cat !== 'room_service') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchRoom = task.room?.toLowerCase().includes(q);
        const matchRef = task.ref?.toLowerCase().includes(q);
        const matchAssignee = task.assignee?.toLowerCase().includes(q);
        if (!matchTitle && !matchRoom && !matchRef && !matchAssignee) return false;
      }

      return true;
    });
  }, [allTasks, selectedStatus, selectedPriority, selectedDept, searchQuery]);

  // Overall metric counts
  const overdueCount = allTasks.filter((t) => t.status !== 'Completed' && getTaskSlaCategory(t) === 'overdue').length;
  const approachingCount = allTasks.filter((t) => t.status !== 'Completed' && getTaskSlaCategory(t) === 'approaching').length;
  const onTrackCount = allTasks.filter((t) => t.status !== 'Completed' && getTaskSlaCategory(t) === 'on_track').length;
  const unconfiguredCount = allTasks.filter((t) => t.status !== 'Completed' && getTaskSlaCategory(t) === 'unconfigured').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              SLA Performance & Deadline Monitor
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Display task turnaround targets, highlight approaching deadlines and breaches, and coordinate escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="rounded-full px-3 py-1 bg-white/[0.04] border border-white/10 text-mist-200">
            SLA Compliance: <strong className="text-emerald-400">94.2%</strong>
          </span>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue */}
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Overdue / Breached</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{overdueCount}</p>
          <span className="text-[10px] text-rose-400">Requires immediate attention / escalation</span>
        </div>

        {/* Approaching */}
        <div className="p-4 rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Approaching Deadline</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{approachingCount}</p>
          <span className="text-[10px] text-amber-300">&lt; 15 mins to target threshold</span>
        </div>

        {/* On Track */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">On Track</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{onTrackCount}</p>
          <span className="text-[10px] text-emerald-400">Progressing within SLA bounds</span>
        </div>

        {/* Unconfigured */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mist-400">Unconfigured SLA</span>
            <HelpCircle className="h-4 w-4 text-mist-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{unconfiguredCount}</p>
          <span className="text-[10px] text-mist-500">No duration invented per system rules</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-ink-900/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All SLA States ({allTasks.filter((t) => t.status !== 'Completed').length})</option>
            <option value="overdue">Breached / Overdue ({overdueCount})</option>
            <option value="approaching">Approaching Deadline ({approachingCount})</option>
            <option value="on_track">On Track ({onTrackCount})</option>
            <option value="unconfigured">Unconfigured SLA ({unconfiguredCount})</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Departments</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="maintenance">Maintenance & Engineering</option>
            <option value="food">Food & Beverage / Room Service</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="vip">VIP</option>
            <option value="standard">Standard</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <input
            type="text"
            placeholder="Search ref, room, title, staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink-950 pl-8 pr-3 py-1.5 text-white placeholder-mist-600 focus:outline-none focus:border-amber-400"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mist-500" />
        </div>
      </div>

      {/* Task SLA Watchlist Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-bold font-display text-white">
              Monitored Department Tasks ({filteredTasks.length})
            </h2>
          </div>
          <span className="text-[11px] text-mist-400">Live operational timers</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-mist-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
            <p className="font-semibold text-white text-sm">No tasks matching the selected SLA filter</p>
            <p className="text-xs text-mist-400">Try adjusting your department or priority filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const category = getTaskSlaCategory(task);
              const isOverdue = category === 'overdue';
              const isApproaching = category === 'approaching';
              const isUnconfigured = category === 'unconfigured';

              return (
                <div
                  key={task.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition gap-4 ${
                    isOverdue
                      ? 'border-rose-500/30 bg-rose-500/[0.04]'
                      : isApproaching
                        ? 'border-amber-400/30 bg-amber-400/[0.04]'
                        : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-300">{task.ref}</span>
                      <span className="text-xs font-semibold text-white">
                        {task.room ? `Room ${task.room}` : 'Location'}
                      </span>
                      {task.priority === 'vip' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                          VIP
                        </span>
                      )}
                      {task.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                          Urgent
                        </span>
                      )}
                      <span className="text-[10px] text-mist-400">
                        Assignee: <strong className="text-white">{task.assignee || 'Unassigned'}</strong>
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white">{task.title}</h3>
                    <p className="text-xs text-mist-400 line-clamp-1">{task.meta}</p>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    {/* SLA Target Duration Display (Unconfigured if absent) */}
                    <div className="text-right text-xs">
                      <span className="text-mist-400 block text-[10px] uppercase font-mono">Target SLA</span>
                      {isUnconfigured ? (
                        <span className="text-mist-500 italic font-mono text-[11px] bg-white/[0.04] px-2 py-0.5 rounded-md">
                          Unconfigured
                        </span>
                      ) : (
                        <span
                          className={`font-mono font-bold text-xs ${
                            isOverdue
                              ? 'text-rose-400'
                              : isApproaching
                                ? 'text-amber-300'
                                : 'text-emerald-400'
                          }`}
                        >
                          {task.slaDue}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    {isOverdue || isApproaching ? (
                      <button
                        type="button"
                        onClick={() => setEscalateModalTask(task)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition shadow-md shadow-rose-500/20"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Escalate</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-mist-500 font-mono px-3 py-1 rounded-xl bg-white/[0.02] border border-white/5">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Escalation History Log */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <h2 className="text-base font-bold font-display text-white">Duty Manager Escalation Log</h2>
          </div>
          <span className="text-xs font-mono text-mist-400">{managerTasks.length} active manager cases</span>
        </div>

        <div className="space-y-3">
          {managerTasks.slice(0, 4).map((caseItem) => (
            <div
              key={caseItem.id}
              className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs hover:border-white/10 transition"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{caseItem.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300">
                    {caseItem.chip || 'Escalated'}
                  </span>
                </div>
                <p className="text-mist-400 text-[11px]">{caseItem.meta}</p>
                {caseItem.description && (
                  <p className="text-mist-300 text-[11px] italic pt-0.5">{caseItem.description}</p>
                )}
              </div>

              <div className="text-right font-mono text-[11px] text-mist-400">
                <span>Marcus Vance (Duty Mgr)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Escalation Modal */}
      {escalateModalTask && (
        <EscalateTaskModal
          task={escalateModalTask}
          onClose={() => setEscalateModalTask(null)}
        />
      )}
    </div>
  );
}
