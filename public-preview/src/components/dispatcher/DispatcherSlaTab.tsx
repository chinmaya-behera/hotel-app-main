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
  Table,
  LayoutGrid,
  MapPin,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { EscalateTaskModal } from '@/components/dispatcher/EscalateTaskModal';
import type { WorkItem } from '@/types/demo';

interface DispatcherSlaTabProps {
  tasks?: WorkItem[];
}

export function DispatcherSlaTab({ tasks }: DispatcherSlaTabProps = {}) {
  const { state } = useDemo();
  const [escalateModalTask, setEscalateModalTask] = useState<WorkItem | null>(null);

  // Filters & View Mode
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const allTasks = useMemo(() => {
    if (tasks) return tasks;
    return [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
  }, [tasks, state.items.department_dispatcher_supervisor, state.items.department_dispatcher]);

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

      {/* Task SLA Watchlist: Table or Cards View */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-bold font-display text-white">
              Monitored Department Tasks ({filteredTasks.length})
            </h2>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-[11px] text-mist-400 hidden sm:inline">Live operational timers</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-ink-950/60 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition ${
                  viewMode === 'table' ? 'bg-amber-400 text-ink-950' : 'text-mist-400 hover:text-white'
                }`}
                title="Table View"
              >
                <Table className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-xl transition ${
                  viewMode === 'cards' ? 'bg-amber-400 text-ink-950' : 'text-mist-400 hover:text-white'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-12 text-center text-mist-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
            <p className="font-semibold text-white text-sm">No tasks matching the selected SLA filter</p>
            <p className="text-xs text-mist-400">Try adjusting your department or priority filters.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase font-bold tracking-wider text-mist-400">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3">Ref & Priority</th>
                    <th className="py-3.5 px-3">Room / Loc</th>
                    <th className="py-3.5 px-3">Task Details</th>
                    <th className="py-3.5 px-3">Department</th>
                    <th className="py-3.5 px-3">SLA Status</th>
                    <th className="py-3.5 px-3">Target Turnaround</th>
                    <th className="py-3.5 px-3">Assignee</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredTasks.map((task) => {
                    const category = getTaskSlaCategory(task);
                    const isOverdue = category === 'overdue';
                    const isApproaching = category === 'approaching';
                    const isUnconfigured = category === 'unconfigured';

                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-white/[0.02] transition group ${
                          isOverdue
                            ? 'bg-rose-500/[0.03]'
                            : isApproaching
                            ? 'bg-amber-400/[0.02]'
                            : ''
                        }`}
                      >
                        {/* Ref & Priority */}
                        <td className="py-4 pl-6 pr-3 space-y-1">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                            <span>{task.ref || task.id.slice(0, 8)}</span>
                          </div>
                          <span
                            className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                              task.priority === 'critical' || task.priority === 'safety' || task.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'vip'
                                ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                                : 'bg-white/10 text-mist-300'
                            }`}
                          >
                            {task.priority || 'Normal'}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-1.5 font-semibold text-white">
                            <MapPin className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                            <span>{task.room ? `Room ${task.room}` : 'Property'}</span>
                          </div>
                          <span className="text-[10px] text-mist-400">
                            {task.floor ? `Level ${task.floor}` : task.room ? `Level ${task.room[0]}` : 'General Area'}
                          </span>
                        </td>

                        {/* Task title */}
                        <td className="py-4 px-3 max-w-xs">
                          <p className="font-semibold text-white truncate">{task.title}</p>
                          <p className="text-[11px] text-mist-400 truncate">{task.meta || task.description}</p>
                        </td>

                        {/* Department */}
                        <td className="py-4 px-3">
                          <span className="font-medium text-mist-200">
                            {task.department || (task.category ? task.category.toUpperCase() : 'Operations')}
                          </span>
                        </td>

                        {/* SLA Status Badge */}
                        <td className="py-4 px-3">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              <Flame className="h-3 w-3 text-rose-400 animate-pulse" />
                              Breached
                            </span>
                          ) : isApproaching ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                              <Clock className="h-3 w-3 text-amber-400" />
                              Approaching (&lt;15m)
                            </span>
                          ) : isUnconfigured ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] text-mist-400 text-[10px] font-medium font-mono">
                              Unconfigured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              On Track
                            </span>
                          )}
                        </td>

                        {/* Target SLA */}
                        <td className="py-4 px-3 font-mono">
                          {isUnconfigured ? (
                            <span className="text-mist-500 italic text-[11px]">Unconfigured</span>
                          ) : (
                            <span
                              className={`font-bold text-xs ${
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
                        </td>

                        {/* Assignee */}
                        <td className="py-4 px-3">
                          {task.assignee ? (
                            <span className="font-semibold text-white text-xs">{task.assignee}</span>
                          ) : (
                            <span className="text-rose-300 font-bold text-[10px] flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-3 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => setEscalateModalTask(task)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                              isOverdue || isApproaching
                                ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'
                                : 'border border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                            }`}
                            title="Escalate to Duty Manager"
                          >
                            <Send className="h-3 w-3" />
                            <span>Escalate</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const category = getTaskSlaCategory(task);
              const isOverdue = category === 'overdue';
              const isApproaching = category === 'approaching';
              const isUnconfigured = category === 'unconfigured';

              return (
                <div
                  key={task.id}
                  className={`rounded-3xl border p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 transition ${
                    isOverdue
                      ? 'border-rose-500/30 bg-ink-900/90 hover:border-rose-500/50'
                      : isApproaching
                      ? 'border-amber-400/30 bg-ink-900/90 hover:border-amber-400/50'
                      : 'border-white/10 bg-ink-900/90 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top line: Ref & Priority & Room */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-amber-300">
                        {task.ref || task.id.slice(0, 8)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-300" />
                          {task.room ? `Room ${task.room}` : task.location || 'General Area'}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            Urgent
                          </span>
                        )}
                        {task.priority === 'vip' && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm line-clamp-1">{task.title}</h3>
                      <p className="text-xs text-mist-400 line-clamp-2 mt-0.5">
                        {task.meta || task.description}
                      </p>
                    </div>

                    {/* SLA Status & Target Banner */}
                    <div
                      className={`p-3 rounded-2xl border space-y-1.5 ${
                        isOverdue
                          ? 'bg-rose-500/[0.08] border-rose-500/30'
                          : isApproaching
                          ? 'bg-amber-400/[0.08] border-amber-400/30'
                          : 'bg-white/[0.02] border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-mist-400 text-[10px] font-bold uppercase tracking-wider">
                          SLA Status
                        </span>
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300">
                            <Flame className="h-3 w-3 text-rose-400 animate-pulse" />
                            Breached
                          </span>
                        ) : isApproaching ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                            <Clock className="h-3 w-3 text-amber-400" />
                            Approaching (&lt;15m)
                          </span>
                        ) : isUnconfigured ? (
                          <span className="text-[10px] text-mist-500 font-mono italic">
                            Unconfigured
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            On Track
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
                        <span className="text-mist-400">Target Turnaround:</span>
                        {isUnconfigured ? (
                          <span className="text-mist-500 italic font-mono text-[11px]">Unconfigured</span>
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
                    </div>

                    {/* Department & Assignee */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-mist-400">
                        Dept: <strong className="text-mist-200">{task.department || (task.category ? task.category.toUpperCase() : 'General')}</strong>
                      </span>
                      <span className="text-mist-400">
                        Assignee:{' '}
                        {task.assignee ? (
                          <strong className="text-white">{task.assignee}</strong>
                        ) : (
                          <strong className="text-rose-300 font-bold">Unassigned</strong>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-mist-400">
                      Status: <span className="text-emerald-300 font-bold">{task.status || 'Active'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setEscalateModalTask(task)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        isOverdue || isApproaching
                          ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'
                          : 'border border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                      }`}
                    >
                      <Send className="h-3 w-3" />
                      <span>Escalate</span>
                    </button>
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
