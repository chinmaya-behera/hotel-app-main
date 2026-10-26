'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Layers,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, RoleId } from '@/types/demo';

interface ManagerOperationsTabProps {
  scope: 'department' | 'hotel';
  initialStatusFilter?: string;
  initialPriorityFilter?: string;
}

export function ManagerOperationsTab({
  scope,
  initialStatusFilter = 'all',
  initialPriorityFilter = 'all',
}: ManagerOperationsTabProps) {
  const { state, addManagerNote } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState(initialPriorityFilter);
  const [floorFilter, setFloorFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Collect tasks from operational queues
  const allTasks = useMemo(() => {
    const list: WorkItem[] = [];
    const sourceRoles = ['department_dispatcher', 'task_fulfiller', 'department_manager', 'front_desk_coordinator'] as const;
    const seen = new Set<string>();

    sourceRoles.forEach((role) => {
      (state.items[role] ?? []).forEach((item) => {
        const key = item.ref || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(item);
        }
      });
    });

    if (scope === 'department') {
      return list.filter(
        (t) =>
          !t.department ||
          t.department.toLowerCase().includes('duty') ||
          t.department.toLowerCase().includes('operations') ||
          t.department.toLowerCase().includes('management'),
      );
    }
    return list;
  }, [state.items, scope]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesRef = t.ref?.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesRoom = t.room?.toLowerCase().includes(q);
        const matchesAssignee = t.assignee?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesRoom && !matchesAssignee && !matchesDesc) return false;
      }

      // Department filter
      if (deptFilter !== 'all') {
        const dept = (t.department || '').toLowerCase();
        if (!dept.includes(deptFilter.toLowerCase())) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if ((t.priority || 'normal').toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Floor filter
      if (floorFilter !== 'all') {
        const fl = t.floor || (t.room ? parseInt(t.room[0], 10) : undefined);
        if (fl !== parseInt(floorFilter, 10)) return false;
      }

      return true;
    });
  }, [allTasks, searchQuery, deptFilter, statusFilter, priorityFilter, floorFilter]);

  const handleAddNote = () => {
    if (!selectedTask || !noteInput.trim()) return;
    addManagerNote(selectedTask.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Toolbar */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task reference, title, room #, assignee, or keyword..."
              className="w-full h-10 rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-mist-400 font-mono text-[11px] whitespace-nowrap">
              Showing <strong>{filteredTasks.length}</strong> of {allTasks.length} tasks
            </span>
          </div>
        </div>

        {/* Filter Dropdowns Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950 text-white">All Departments</option>
            <option value="housekeeping" className="bg-ink-950 text-white">Housekeeping</option>
            <option value="maintenance" className="bg-ink-950 text-white">Maintenance & Eng</option>
            <option value="food" className="bg-ink-950 text-white">Food & Beverage</option>
            <option value="front" className="bg-ink-950 text-white">Front Office</option>
            <option value="security" className="bg-ink-950 text-white">Safety & Security</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950 text-white">All Statuses</option>
            <option value="Received" className="bg-ink-950 text-white">Received / Queued</option>
            <option value="Assigned" className="bg-ink-950 text-white">Assigned</option>
            <option value="In Progress" className="bg-ink-950 text-white">In Progress</option>
            <option value="Completed" className="bg-ink-950 text-white">Completed</option>
            <option value="Escalated" className="bg-ink-950 text-white">Escalated</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950 text-white">All Priorities</option>
            <option value="normal" className="bg-ink-950 text-white">Normal Priority</option>
            <option value="vip" className="bg-ink-950 text-white">VIP Priority</option>
            <option value="critical" className="bg-ink-950 text-white">Critical Priority</option>
            <option value="urgent" className="bg-ink-950 text-white">Urgent Priority</option>
          </select>

          {/* Floor Filter */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950 text-white">All Floors</option>
            <option value="1" className="bg-ink-950 text-white">Floor 1</option>
            <option value="2" className="bg-ink-950 text-white">Floor 2</option>
            <option value="3" className="bg-ink-950 text-white">Floor 3</option>
            <option value="4" className="bg-ink-950 text-white">Floor 4</option>
            <option value="5" className="bg-ink-950 text-white">Floor 5</option>
          </select>

          {(deptFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || floorFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setDeptFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
                setFloorFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 pl-6 pr-3">Task Ref & Title</th>
                <th className="px-3 py-3.5">Department</th>
                <th className="px-3 py-3.5">Location</th>
                <th className="px-3 py-3.5">Assigned To</th>
                <th className="px-3 py-3.5">Priority</th>
                <th className="px-3 py-3.5">SLA Target</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-mist-400 italic">
                    No operational tasks match your active filters or search criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const isCritical = t.priority === 'critical' || t.priority === 'vip';
                  const isCompleted = t.status === 'Completed';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-white/[0.02] transition cursor-pointer"
                      onClick={() => setSelectedTask(t)}
                    >
                      {/* Ref & Title */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-300 font-bold text-[11px]">
                              {t.ref || t.id.slice(0, 8)}
                            </span>
                            {t.chip && (
                              <span className="text-[9px] rounded-full px-1.5 py-0.2 bg-white/10 text-mist-200">
                                {t.chip}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-white max-w-xs truncate">{t.title}</p>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-3 py-3.5 text-mist-300 font-medium whitespace-nowrap">
                        {t.department || 'Operations'}
                      </td>

                      {/* Location */}
                      <td className="px-3 py-3.5 text-mist-300 whitespace-nowrap">
                        {t.location || (t.room ? `Room ${t.room}` : 'Property-wide')}
                      </td>

                      {/* Assigned Employee */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {t.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-white font-medium">{t.assignee}</span>
                          </div>
                        ) : (
                          <span className="text-mist-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : t.priority === 'urgent'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/10 text-mist-300'
                          }`}
                        >
                          {t.priority || 'Normal'}
                        </span>
                      </td>

                      {/* SLA */}
                      <td className="px-3 py-3.5 font-mono text-mist-300 whitespace-nowrap">
                        {t.slaDue || '25m'}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : t.status === 'In Progress'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : t.status === 'Escalated'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(t);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-detail-title"
        >
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-300 font-bold text-xs">
                    {selectedTask.ref || selectedTask.id}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-mist-300">
                    {selectedTask.department || 'Operations'}
                  </span>
                </div>
                <h2 id="task-detail-title" className="text-lg font-bold font-display text-white mt-1">
                  {selectedTask.title}
                </h2>
                <p className="text-xs text-mist-400 mt-0.5">
                  Location: {selectedTask.location || (selectedTask.room ? `Room ${selectedTask.room}` : 'Property')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
                aria-label="Close task details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status & Key Metrics Strip */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-mist-400 block">Status</span>
                <span className="font-bold text-amber-300 block mt-0.5">{selectedTask.status}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-mist-400 block">Priority</span>
                <span className="font-bold text-white block mt-0.5 capitalize">{selectedTask.priority || 'Normal'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-mist-400 block">Assignee</span>
                <span className="font-bold text-white block mt-0.5 truncate">{selectedTask.assignee || 'Unassigned'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-mist-400 block">SLA Target</span>
                <span className="font-mono text-mist-200 block mt-0.5">{selectedTask.slaDue || '25m'}</span>
              </div>
            </div>

            {/* Description & Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-mist-400">Task Information</h4>
              <p className="text-xs text-mist-200 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl leading-relaxed">
                {selectedTask.description || selectedTask.meta || 'No description provided.'}
              </p>
            </div>

            {/* Existing Notes & History */}
            {selectedTask.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-400">Managerial Notes & History</h4>
                <div className="bg-black/30 border border-white/[0.06] p-3 rounded-2xl text-xs text-mist-200 whitespace-pre-wrap font-mono">
                  {selectedTask.notes}
                </div>
              </div>
            )}

            {/* Append Manager Note Input */}
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <label className="block text-xs font-semibold text-white">
                Add Managerial Note / Directive:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Type an operational note or priority directive..."
                  className="flex-1 h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote();
                  }}
                />
                <button
                  type="button"
                  disabled={!noteInput.trim()}
                  onClick={handleAddNote}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 disabled:opacity-40 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Note</span>
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
