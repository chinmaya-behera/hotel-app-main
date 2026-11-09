'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  Sparkles,
  Link2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  CheckCircle2,
  Send,
  MoreVertical,
  Table,
  LayoutGrid,
  X,
  Eye,
  SlidersHorizontal,
  Plus,
  Play,
  Check,
  ChevronDown,
  ArrowRightLeft,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { AssignTaskModal } from '@/components/dispatcher/AssignTaskModal';
import { LinkDuplicateModal } from '@/components/dispatcher/LinkDuplicateModal';
import { EscalateTaskModal } from '@/components/dispatcher/EscalateTaskModal';
import { TaskDetailsDrawer } from '@/components/dispatcher/TaskDetailsDrawer';
import { CreateTaskModal } from '@/components/dispatcher/CreateTaskModal';
import { DispatcherCompletedTasksTab } from '@/components/dispatcher/DispatcherCompletedTasksTab';
import type { WorkItem, DispatcherDepartment } from '@/types/demo';

interface DispatcherQueueTabProps {
  tasks?: WorkItem[];
  activeDept?: DispatcherDepartment;
}

export function DispatcherQueueTab({ tasks, activeDept }: DispatcherQueueTabProps = {}) {
  const {
    state,
    autoAssignTask,
    autoAssignAllPending,
    updateDispatcherTaskStatus,
    updateDispatcherTaskPriority,
  } = useDemo();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [taskSubTab, setTaskSubTab] = useState<'queue' | 'completed'>('queue');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [assignModalTask, setAssignModalTask] = useState<WorkItem | null>(null);
  const [duplicateModalTask, setDuplicateModalTask] = useState<WorkItem | null>(null);
  const [escalateModalTask, setEscalateModalTask] = useState<WorkItem | null>(null);
  const [detailsDrawerTask, setDetailsDrawerTask] = useState<WorkItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const effectiveDept = activeDept || state.activeDispatcherDept || 'Housekeeping';

  const rawTasks = useMemo(() => {
    if (tasks) return tasks;
    const all = [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
    return all.filter((t) => {
      const deptStr = (t.department || '').toLowerCase();
      const catStr = (t.category || '').toLowerCase();
      if (effectiveDept === 'Housekeeping') {
        return (
          deptStr.includes('housekeeping') ||
          ['housekeeping', 'lost_found', 'turnover', 'linen'].includes(catStr)
        );
      }
      if (effectiveDept === 'Wellness') {
        return (
          deptStr.includes('spa') ||
          deptStr.includes('wellness') ||
          ['spa', 'wellness', 'massage', 'hydrotherapy', 'medical', 'therapy'].includes(catStr)
        );
      }
      if (effectiveDept === 'Maintenance & Engineering') {
        return (
          deptStr.includes('maintenance') ||
          deptStr.includes('engineering') ||
          ['maintenance', 'hvac', 'plumbing', 'electrical', 'repair'].includes(catStr)
        );
      }
      if (effectiveDept === 'Food & Beverages') {
        return (
          deptStr.includes('food') ||
          deptStr.includes('beverage') ||
          deptStr.includes('f&b') ||
          ['room_service', 'dining', 'fnb', 'kitchen', 'restaurant', 'bar'].includes(catStr)
        );
      }
      return true;
    });
  }, [tasks, state.items.department_dispatcher_supervisor, state.items.department_dispatcher, effectiveDept]);

  const completedCount = useMemo(() => {
    return rawTasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'completed' || s === 'delivered' || s === 'resolved';
    }).length;
  }, [rawTasks]);

  const activeQueueCount = useMemo(() => {
    return rawTasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s !== 'completed' && s !== 'delivered' && s !== 'resolved';
    }).length;
  }, [rawTasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return rawTasks.filter((task) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchMeta = task.meta.toLowerCase().includes(q);
        const matchRef = task.ref?.toLowerCase().includes(q);
        const matchRoom = task.room?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchAssignee = task.assignee?.toLowerCase().includes(q);
        if (!matchTitle && !matchMeta && !matchRef && !matchRoom && !matchDesc && !matchAssignee) {
          return false;
        }
      }

      // Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'unassigned' && task.status !== 'Unassigned' && task.status !== 'Received') return false;
        if (selectedStatus === 'assigned' && task.status !== 'Assigned') return false;
        if (selectedStatus === 'in_progress' && task.status !== 'In progress' && task.status !== 'Accepted') return false;
        if (selectedStatus === 'completed' && task.status !== 'Completed') return false;
        if (selectedStatus === 'duplicate' && !task.isLinkedDuplicate) return false;
        if (selectedStatus === 'escalated' && task.status !== 'Escalated') return false;
      }

      // Floor filter
      if (selectedFloor !== 'all') {
        const taskFloor = task.floor ? String(task.floor) : task.room ? task.room[0] : '';
        if (taskFloor !== selectedFloor) return false;
      }

      return true;
    });
  }, [rawTasks, searchQuery, selectedPriority, selectedStatus, selectedFloor]);

  const unassignedCount = rawTasks.filter(
    (t) => t.status === 'Unassigned' || t.status === 'Received',
  ).length;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setSelectedFloor('all');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedPriority !== 'all' ||
    selectedStatus !== 'all' ||
    selectedFloor !== 'all';

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Switcher: Task Queue vs Completed Task */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-ink-900/90 border border-white/10 backdrop-blur-xl w-fit shadow-lg">
        <button
          type="button"
          onClick={() => setTaskSubTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            taskSubTab === 'queue'
              ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/20'
              : 'text-mist-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Task Queue</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              taskSubTab === 'queue'
                ? 'bg-ink-950/20 text-ink-950'
                : 'bg-white/10 text-mist-300'
            }`}
          >
            {activeQueueCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTaskSubTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            taskSubTab === 'completed'
              ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/20'
              : 'text-mist-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Completed Task</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              taskSubTab === 'completed'
                ? 'bg-ink-950/20 text-ink-950'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {completedCount}
          </span>
        </button>
      </div>

      {taskSubTab === 'queue' ? (
        <>
          {/* Top Banner & Batch Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Live Inbound Requests & Dispatch Queue
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Orchestrate room requests, engineering defects, and room service deliveries across field personnel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>

          {unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => autoAssignAllPending()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold hover:bg-amber-400/20 transition shadow-lg shadow-amber-500/10 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Auto-Assign All Pending ({unassignedCount})</span>
            </button>
          )}

          {/* View Mode Toggle */}
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

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4 backdrop-blur-md shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ref, room number, guest, issue description..."
              className="w-full rounded-2xl border border-white/10 bg-ink-950/60 pl-10 pr-4 py-2 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">

            {/* Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="safety">Safety</option>
              <option value="urgent">Urgent</option>
              <option value="vip">VIP</option>
              <option value="normal">Normal</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unassigned">Unassigned / Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
              <option value="duplicate">Duplicate Linked</option>
            </select>

            {/* Floor */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">All Floors</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5 (VIP)</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results count strip */}
        <div className="flex items-center justify-between text-[11px] text-mist-400 pt-1">
          <span>
            Showing <strong className="text-white">{filteredTasks.length}</strong> of{' '}
            {rawTasks.length} tasks
          </span>
          <span className="font-mono">
            {unassignedCount} unassigned · {rawTasks.filter((t) => t.status === 'Completed').length} resolved today
          </span>
        </div>
      </div>

      {/* Main Task List: Table or Cards View */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-12 text-center text-mist-400 space-y-3">
          <Clock className="h-8 w-8 mx-auto text-mist-500" />
          <p className="font-semibold text-white text-base">No tasks match your current filter parameters</p>
          <p className="text-xs text-mist-400 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing department or priority filters, or resetting filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase font-bold tracking-wider text-mist-400">
                <tr>
                  <th className="py-3.5 pl-6 pr-3">Ref & Priority</th>
                  <th className="py-3.5 px-3">Room / Location</th>
                  <th className="py-3.5 px-3">Task Details</th>
                  <th className="py-3.5 px-3">Dual SLAs (Ack / Res)</th>
                  <th className="py-3.5 px-3">Status & Assignee</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredTasks.map((task) => {
                  const isUnassigned = task.status === 'Unassigned' || task.status === 'Received';
                  const isCompleted = task.status === 'Completed' || task.status === 'Delivered';
                  const isInProgress = task.status === 'In progress';
                  const isOverdue =
                    task.ackStatus === 'overdue' ||
                    task.chip?.toLowerCase().includes('overdue');

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-white/[0.02] transition group"
                    >
                      {/* Ref & Priority */}
                      <td className="py-4 pl-6 pr-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                          <span>{task.ref || task.id.slice(0, 8)}</span>
                        </div>
                        {/* Quick Priority Switcher */}
                        <select
                          aria-label="Change task priority"
                          value={task.priority || 'normal'}
                          onChange={(e) => updateDispatcherTaskPriority(task.id, e.target.value)}
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
                            task.priority === 'critical' || task.priority === 'safety'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : task.priority === 'urgent'
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                              : task.priority === 'vip'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-slate-800 text-mist-300 border-white/10'
                          }`}
                        >
                          <option value="low" className="bg-slate-900 text-white">Low</option>
                          <option value="normal" className="bg-slate-900 text-white">Normal</option>
                          <option value="urgent" className="bg-slate-900 text-white">Urgent</option>
                          <option value="vip" className="bg-slate-900 text-white">VIP</option>
                          <option value="critical" className="bg-slate-900 text-white">Critical</option>
                        </select>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <MapPin className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                          <span>{task.room ? `Room ${task.room}` : 'Property'}</span>
                        </div>
                        <span className="text-[10px] text-mist-400">
                          {task.floor ? `Level ${task.floor}` : task.room ? `Level ${task.room[0]}` : 'General'}
                        </span>
                      </td>

                      {/* Task title */}
                      <td className="py-4 px-3 max-w-xs">
                        <p onClick={() => setDetailsDrawerTask(task)} className="font-semibold text-white truncate cursor-pointer hover:text-amber-300 transition" title="Click to view full details">{task.title}</p>
                        {task.isLinkedDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-300 font-mono mt-0.5">
                            <Link2 className="h-3 w-3" />
                            Linked to {task.linkedToRef}
                          </span>
                        )}
                      </td>

                      {/* Dual SLAs */}
                      <td className="py-4 px-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              task.ackStatus === 'overdue'
                                ? 'bg-rose-400 animate-pulse'
                                : isUnassigned
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-[11px] font-mono font-medium">
                            Ack: {task.ackSlaDue || '5m'}
                          </span>
                        </div>
                        <div className="text-[10px] text-mist-400 font-mono">
                          Res: {task.slaDue || '30m'}
                        </div>
                      </td>

                      {/* Status & Assignee */}
                      <td className="py-4 px-3 space-y-1">
                        {isUnassigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            Unassigned
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[10px] font-semibold text-emerald-300">
                              {task.status}
                            </span>
                            <p className="text-[11px] font-bold text-white truncate max-w-[120px]">
                              {task.assignee || 'Assigned'}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Actions: Full suite of operations */}
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. Quick Status Controls */}
                          {!isCompleted && !isInProgress && (
                            <button
                              type="button"
                              onClick={() => updateDispatcherTaskStatus(task.id, 'In progress')}
                              className="p-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500 hover:text-white transition"
                              title="Start Task / Mark In Progress"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => updateDispatcherTaskStatus(task.id, 'Completed')}
                              className="p-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-white transition"
                              title="Mark Task Completed"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* 2. Assign / Reassign */}
                          {isUnassigned ? (
                            <>
                              <button
                                type="button"
                                onClick={() => autoAssignTask(task.id)}
                                className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-ink-950 font-bold text-[11px] transition flex items-center gap-1 px-2.5"
                                title="1-Click Auto Assign"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Auto</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssignModalTask(task)}
                                className="p-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white hover:bg-white/[0.06] text-[11px] font-semibold transition px-2"
                                title="Manual Assign Staff"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAssignModalTask(task)}
                              className="p-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white hover:bg-white/[0.06] text-[11px] font-semibold transition px-2"
                              title="Reassign Staff"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-amber-300" />
                            </button>
                          )}

                          {/* 3. Link Duplicate */}
                          <button
                            type="button"
                            onClick={() => setDuplicateModalTask(task)}
                            className="p-1.5 rounded-xl border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition"
                            title="Link Duplicate Task"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>

                          {/* 4. Escalate to Manager */}
                          <button
                            type="button"
                            onClick={() => setEscalateModalTask(task)}
                            className="p-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition"
                            title="Escalate to Duty Manager"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>

                          {/* 5. View Full Details */}
                          <button
                            type="button"
                            onClick={() => setDetailsDrawerTask(task)}
                            className="p-1.5 rounded-xl border border-white/10 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
                            title="View Full Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
            const isUnassigned = task.status === 'Unassigned' || task.status === 'Received';
            const isOverdue =
              task.ackStatus === 'overdue' ||
              task.chip?.toLowerCase().includes('overdue');

            return (
              <div
                key={task.id}
                className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-white/20 transition"
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
                        {task.room ? `Room ${task.room}` : 'Property'}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                          task.priority === 'critical' || task.priority === 'safety'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : task.priority === 'urgent'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : task.priority === 'vip'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/10 text-mist-300'
                        }`}
                      >
                        {task.priority || 'Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 onClick={() => setDetailsDrawerTask(task)} className="font-bold text-sm text-white line-clamp-1 cursor-pointer hover:text-amber-300 transition" title="Click to view full details">{task.title}</h3>
                  </div>

                  {/* SLA Strip */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-xs flex items-center justify-between font-mono">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          task.ackStatus === 'overdue' ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-[11px] text-mist-300">
                        Ack: {task.ackSlaDue || '5m'}
                      </span>
                    </div>
                    <span className="text-[11px] text-mist-400">
                      Res: {task.slaDue || '30m'}
                    </span>
                  </div>

                  {/* Assignee / Status */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-mist-400">Assignee:</span>
                    {task.assignee ? (
                      <span className="font-bold text-white">{task.assignee}</span>
                    ) : (
                      <span className="text-rose-300 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="border-t border-white/[0.08] pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Quick status actions */}
                    {task.status !== 'Completed' && task.status !== 'In progress' && (
                      <button
                        type="button"
                        onClick={() => updateDispatcherTaskStatus(task.id, 'In progress')}
                        className="p-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500 hover:text-white transition"
                        title="Start Task / Mark In Progress"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    )}

                    {task.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => updateDispatcherTaskStatus(task.id, 'Completed')}
                        className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-white transition"
                        title="Mark Task Completed"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}

                    {/* Link duplicate */}
                    <button
                      type="button"
                      onClick={() => setDuplicateModalTask(task)}
                      className="p-1.5 rounded-lg border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition"
                      title="Link Duplicate"
                    >
                      <Link2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isUnassigned ? (
                      <button
                        type="button"
                        onClick={() => autoAssignTask(task.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Auto</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssignModalTask(task)}
                        className="px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-mist-200 hover:bg-white/[0.05] transition"
                      >
                        Reassign
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEscalateModalTask(task)}
                      className="p-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition"
                      title="Escalate"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDetailsDrawerTask(task)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-mist-300 hover:text-white transition flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      ) : (
        <DispatcherCompletedTasksTab
          tasks={rawTasks}
          activeDept={effectiveDept}
          onOpenDetails={(t) => setDetailsDrawerTask(t)}
        />
      )}

      {/* Render Modals */}
      {assignModalTask && (
        <AssignTaskModal
          task={assignModalTask}
          department={effectiveDept}
          lockDepartment={true}
          onClose={() => setAssignModalTask(null)}
        />
      )}

      {duplicateModalTask && (
        <LinkDuplicateModal
          task={duplicateModalTask}
          onClose={() => setDuplicateModalTask(null)}
        />
      )}

      {escalateModalTask && (
        <EscalateTaskModal
          task={escalateModalTask}
          onClose={() => setEscalateModalTask(null)}
        />
      )}

      {detailsDrawerTask && (
        <TaskDetailsDrawer
          task={detailsDrawerTask}
          onClose={() => setDetailsDrawerTask(null)}
          onOpenAssign={() => {
            setAssignModalTask(detailsDrawerTask);
            setDetailsDrawerTask(null);
          }}
          onOpenDuplicate={() => {
            setDuplicateModalTask(detailsDrawerTask);
            setDetailsDrawerTask(null);
          }}
          onOpenEscalate={() => {
            setEscalateModalTask(detailsDrawerTask);
            setDetailsDrawerTask(null);
          }}
          onAutoAssign={() => {
            autoAssignTask(detailsDrawerTask.id);
            setDetailsDrawerTask(null);
          }}
          onUpdateStatus={(st) => {
            updateDispatcherTaskStatus(detailsDrawerTask.id, st);
            setDetailsDrawerTask((prev) => (prev ? { ...prev, status: st } : null));
          }}
          onUpdatePriority={(pr) => {
            updateDispatcherTaskPriority(detailsDrawerTask.id, pr);
            setDetailsDrawerTask((prev) => (prev ? { ...prev, priority: pr as any } : null));
          }}
        />
      )}

      {/* Manual Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
