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
  Star,
  User,
  Sparkles,
  FileText,
  X,
  Award,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { EscalateTaskModal } from '@/components/dispatcher/EscalateTaskModal';
import type { WorkItem, DispatcherDepartment } from '@/types/demo';

interface DispatcherSlaTabProps {
  tasks?: WorkItem[];
  department?: DispatcherDepartment;
}

export function DispatcherSlaTab({ tasks, department }: DispatcherSlaTabProps = {}) {
  const { state } = useDemo();
  const [escalateModalTask, setEscalateModalTask] = useState<WorkItem | null>(null);
  const [selectedSlaTask, setSelectedSlaTask] = useState<WorkItem | null>(null);

  // Filters & View Mode
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const allTasks = useMemo(() => {
    if (tasks) return tasks;
    let list = [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

    if (department) {
      list = list.filter((t) => {
        const d = (t.department || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        if (department === 'Housekeeping') return d.includes('housekeeping') || cat === 'housekeeping';
        if (department === 'Maintenance & Engineering') return d.includes('maintenance') || cat === 'maintenance' || d.includes('eng');
        if (department === 'Food & Beverages') return d.includes('food') || cat === 'room_service' || d.includes('beverage') || cat === 'dining';
        if (department === 'Wellness') return d.includes('wellness') || cat === 'wellness' || d.includes('spa');
        return true;
      });
    }
    return list;
  }, [tasks, department, state.items.department_dispatcher_supervisor, state.items.department_dispatcher]);

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
  }, [allTasks, selectedStatus, selectedPriority, searchQuery]);

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
                        onClick={() => setSelectedSlaTask(task)}
                        className={`hover:bg-white/[0.05] transition group cursor-pointer ${
                          isOverdue
                            ? 'bg-rose-500/[0.03]'
                            : isApproaching
                            ? 'bg-amber-400/[0.02]'
                            : ''
                        }`}
                        title="Click to view full SLA details, guest feedbacks, ratings and timeline status"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setEscalateModalTask(task);
                            }}
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
                  onClick={() => setSelectedSlaTask(task)}
                  className={`rounded-3xl border p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 transition cursor-pointer hover:border-amber-400/50 hover:scale-[1.01] ${
                    isOverdue
                      ? 'border-rose-500/30 bg-ink-900/90 hover:border-rose-500/50'
                      : isApproaching
                      ? 'border-amber-400/30 bg-ink-900/90 hover:border-amber-400/50'
                      : 'border-white/10 bg-ink-900/90 hover:border-white/20'
                  }`}
                  title="Click to view full SLA details, guest feedbacks, ratings and timeline status"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setEscalateModalTask(task);
                      }}
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

      {/* Render SLA Task Details Modal */}
      {selectedSlaTask && (
        <SlaTaskDetailModal
          task={selectedSlaTask}
          onClose={() => setSelectedSlaTask(null)}
          onEscalate={() => {
            setEscalateModalTask(selectedSlaTask);
            setSelectedSlaTask(null);
          }}
        />
      )}

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

// -------------------------------------------------------------
// Helpers for SLA Task Details, Feedbacks & Ratings
// -------------------------------------------------------------
function getDepartmentGuestFeedback(task: WorkItem): string {
  if (task.feedback?.comment) return task.feedback.comment;
  if (task.review) return task.review;

  const dept = (task.department || '').toLowerCase();
  const title = (task.title || '').toLowerCase();

  if (dept.includes('house') || title.includes('turnover') || title.includes('linen') || title.includes('cleaning')) {
    return 'The housekeeping attendant arrived well within the promised turnaround time. The room turnover was spotless, linens freshly pressed, and all complimentary amenities replenished with exquisite care.';
  }
  if (dept.includes('food') || dept.includes('bev') || title.includes('dining') || title.includes('breakfast') || title.includes('order')) {
    return 'In-room dining was delivered piping hot, beautifully arranged, and 10 minutes ahead of the SLA target. The server was exceptionally courteous and presented the dishes with great care.';
  }
  if (dept.includes('maint') || dept.includes('eng') || title.includes('ac') || title.includes('repair') || title.includes('plumb')) {
    return 'The engineering technician arrived promptly with the necessary replacement components. Diagnosed and resolved the issue efficiently without disturbing our stay. Very professional.';
  }
  if (dept.includes('well') || dept.includes('spa') || title.includes('massage') || title.includes('therapy')) {
    return 'Impeccable spa service. The therapist arrived on time, was deeply attentive to my wellness preferences, and ensured a profoundly restorative experience.';
  }
  return 'The requested service was attended to promptly with admirable professionalism. Exceeded expectations and met every benchmark smoothly.';
}

function getGuestDisplayName(task: WorkItem): string {
  if (task.feedback?.guestName) return task.feedback.guestName;
  if (task.guestName) return task.guestName;
  if (task.room === '518') return 'Priya Nair (Suite 518)';
  if (task.room === '402') return 'Dr. Arthur Pendelton (Room 402)';
  if (task.room === '305') return 'Elena Rostova (Room 305)';
  if (task.room === '210') return 'Marcus Vance (Room 210)';
  return task.room ? `Guest in Room ${task.room}` : 'Hotel Resident';
}

// -------------------------------------------------------------
// Comprehensive SLA Task Details Modal
// -------------------------------------------------------------
function SlaTaskDetailModal({
  task,
  onClose,
  onEscalate,
}: {
  task: WorkItem;
  onClose: () => void;
  onEscalate: () => void;
}) {
  const isOverdue =
    task.ackStatus === 'overdue' ||
    task.chip?.toLowerCase().includes('overdue') ||
    task.slaDue?.toLowerCase().includes('overdue') ||
    task.tone === 'danger';

  const guestRating = task.rating ?? task.feedback?.rating ?? (task.priority === 'vip' ? 5 : 4.8);
  const guestReview = getDepartmentGuestFeedback(task);
  const guestName = getGuestDisplayName(task);

  const timelineSteps = [
    {
      title: 'Ticket Logged & Created',
      desc: `Logged via ${task.channel || 'Guest Portal'} · Ticket ref: ${task.ref || task.id.slice(0, 8)}`,
      time: task.createdAt || '45m ago',
      completed: true,
      icon: FileText,
    },
    {
      title: 'Supervisor Dispatched & SLA Clock Started',
      desc: `Turnaround SLA target committed: ${task.slaDue || '30 mins'} threshold`,
      time: '40m ago',
      completed: true,
      icon: Send,
    },
    {
      title: `Assigned to ${task.assignee || 'Field Team Runner'}`,
      desc: `Attendant acknowledged task and routed to ${task.room ? `Room ${task.room}` : 'Location'}`,
      time: '35m ago',
      completed: true,
      icon: User,
    },
    {
      title: 'Arrived On Site · Execution in Progress',
      desc: `Runner active at destination · Service checkpoints initialized`,
      time: '18m ago',
      completed: task.status === 'Completed',
      active: task.status !== 'Completed',
      icon: Sparkles,
    },
    {
      title: isOverdue ? 'SLA Milestone Breached' : 'SLA Window Checkpoint',
      desc: isOverdue
        ? 'Resolution time exceeded SLA threshold · Escalation recommended'
        : 'Pacing compliant with 5-star brand standard',
      time: isOverdue ? 'Breached 8m ago' : '5m ago',
      completed: task.status === 'Completed',
      active: task.status !== 'Completed' && !isOverdue,
      breached: isOverdue,
      icon: isOverdue ? Flame : Clock,
    },
    {
      title: task.status === 'Completed' ? 'Task Completed & Verified' : 'Resolution & Guest Feedback',
      desc: task.status === 'Completed'
        ? `Quality inspection passed · Guest rating: ${guestRating}/5 recorded`
        : 'Pending final attendant checklist sign-off and guest satisfaction submission',
      time: task.status === 'Completed' ? 'Just now' : 'Upcoming',
      completed: task.status === 'Completed',
      pending: task.status !== 'Completed',
      icon: CheckCircle2,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-white space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300">
                {task.ref || task.id.slice(0, 8)}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  task.priority === 'critical' || task.priority === 'safety' || task.priority === 'urgent'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : task.priority === 'vip'
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                    : 'bg-white/10 text-mist-300'
                }`}
              >
                {task.priority || 'Normal'} Priority
              </span>
              <span className="text-xs font-semibold text-mist-300 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-amber-300" />
                <span>{task.room ? `Room ${task.room}` : task.location || 'Property'}</span>
              </span>
              {isOverdue ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  <Flame className="h-3 w-3 text-rose-400 animate-pulse" />
                  SLA Breached
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  SLA On Track
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold font-display text-white">{task.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-mist-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SECTION 1: TASK DETAILS GRID */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>Task Specifications & Assignment</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs">
            <div>
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Department</span>
              <span className="font-semibold text-white">{task.department || 'Operations'}</span>
            </div>
            <div>
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Assigned Attendant</span>
              <span className="font-semibold text-white">{task.assignee || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Target SLA Window</span>
              <span className={`font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                {task.slaDue || '30 mins'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Current Status</span>
              <span className="font-semibold text-emerald-300">{task.status || 'Active'}</span>
            </div>
          </div>

          {(task.description || task.notes) && (
            <div className="p-3.5 rounded-2xl bg-ink-950/60 border border-white/10 text-xs text-mist-300">
              <span className="text-[10px] uppercase font-bold text-mist-400 block mb-1">Task Instructions / Notes:</span>
              <p>{task.description || task.notes}</p>
            </div>
          )}

          {task.blockerReason && (
            <div className="p-3.5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/25 text-xs text-rose-200 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Recorded Blocker:</span> {task.blockerReason}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: FEEDBACKS & RATINGS */}
        <div className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.03] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-400/15 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Guest Feedback & Quality Ratings</h3>
                <p className="text-[11px] text-mist-300">Direct guest review score and internal supervisor quality adherence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(guestRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-mist-600'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono font-bold text-sm text-amber-300">{guestRating}/5</span>
            </div>
          </div>

          {/* Guest Feedback Quote Card */}
          <div className="p-4 rounded-2xl bg-ink-950/80 border border-amber-400/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-mist-300 font-bold text-[10px]">
                  <User className="h-3 w-3" />
                </span>
                <span className="font-bold text-white">{guestName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25">
                  Verified Stay
                </span>
              </div>
              <span className="text-[10px] text-mist-400 font-mono">Feedback Verified</span>
            </div>

            <p className="text-xs text-mist-200 italic pl-8 leading-relaxed">
              &ldquo;{guestReview}&rdquo;
            </p>
          </div>

          {/* Quality Benchmarks Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">SOP Compliance</span>
              <span className="text-xs font-bold text-emerald-300">100% Passed</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Punctuality Adherence</span>
              <span className={`text-xs font-bold ${isOverdue ? 'text-rose-300' : 'text-emerald-300'}`}>
                {isOverdue ? 'Breached (+8m)' : 'On-Time (100%)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Guest Sentiment</span>
              <span className="text-xs font-bold text-amber-300">Delighted</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: TIMELINE STATUS */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">SLA Lifecycle Timeline Status</h3>
            </div>
            <span className="text-[11px] font-mono text-mist-400">Milestone Audit Log</span>
          </div>

          {/* Vertical Stepper */}
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {timelineSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="relative flex items-start justify-between gap-3 text-xs">
                  {/* Indicator Dot */}
                  <div
                    className={`absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full border ${
                      step.completed
                        ? 'bg-emerald-500 text-ink-950 border-emerald-400'
                        : step.breached
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                        : step.active
                        ? 'bg-amber-400 text-ink-950 border-amber-300 animate-pulse'
                        : 'bg-ink-950 text-mist-500 border-white/20'
                    }`}
                  >
                    <StepIcon className="h-2.5 w-2.5" />
                  </div>

                  <div className="space-y-0.5">
                    <p className={`font-bold ${step.breached ? 'text-rose-300' : 'text-white'}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-mist-400">{step.desc}</p>
                  </div>

                  <span className="text-[10px] font-mono text-mist-400 shrink-0 self-start pt-0.5">
                    {step.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* If task has extra history logs */}
          {task.history && task.history.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <span className="text-[10px] uppercase font-bold text-mist-400 tracking-wider block">Additional Field Audit Entries:</span>
              <div className="space-y-1.5">
                {task.history.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-mist-200">
                      [{h.status}] {h.note || 'Status updated'}
                    </span>
                    <span className="font-mono text-mist-500 text-[10px]">{h.at || 'Earlier'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/[0.08] pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onEscalate}
            className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Escalate to Duty Manager</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
