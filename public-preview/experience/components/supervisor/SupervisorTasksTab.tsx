'use client';

import { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  BedDouble,
  ArrowRight,
} from 'lucide-react';
import type { WorkItem, StaffAccount } from '@/types/demo';

interface SupervisorTasksTabProps {
  tasks: WorkItem[];
  staffList: StaffAccount[];
  onReviewReassignment: (
    taskId: string,
    action: 'reassign' | 'reject',
    newAssigneeId?: string,
    notes?: string,
  ) => void;
}

export function SupervisorTasksTab({
  tasks,
  staffList,
  onReviewReassignment,
}: SupervisorTasksTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Assigned' | 'In progress' | 'Completed'>(
    'all',
  );
  const [selectedTaskForReassign, setSelectedTaskForReassign] = useState<WorkItem | null>(null);
  const [targetStaffId, setTargetStaffId] = useState('');
  const [reassignNote, setReassignNote] = useState('');

  // Attendants available for reassignment
  const attendants = staffList.filter(
    (s) =>
      s.department === 'Housekeeping' ||
      s.roleId === 'task_fulfiller' ||
      ['Sofia Rivera', 'Wayne Chen', 'Kabir Sen', 'Sana Sheikh', 'Rohan Verma'].includes(s.name),
  );

  // Filter tasks with reassignment pending
  const pendingReassignments = tasks.filter((t) => t.reassignPending);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchRoom = t.room?.toLowerCase().includes(q);
      const matchAssignee = t.assignee?.toLowerCase().includes(q);
      if (!matchTitle && !matchRoom && !matchAssignee) return false;
    }
    return true;
  });

  const handleExecuteReassignment = (action: 'reassign' | 'reject') => {
    if (!selectedTaskForReassign) return;
    onReviewReassignment(
      selectedTaskForReassign.id,
      action,
      action === 'reassign' ? targetStaffId : undefined,
      reassignNote.trim() || undefined,
    );
    setSelectedTaskForReassign(null);
    setTargetStaffId('');
    setReassignNote('');
  };

  return (
    <div className="space-y-6">
      {/* Reassignment Queue Section */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Attendant Reassignment Review Queue ({pendingReassignments.length})
              </h2>
              <p className="text-xs text-mist-400">
                Fulfillers encountering physical blockers, supply delays, or workload overload
              </p>
            </div>
          </div>
        </div>

        {pendingReassignments.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-300 mx-auto mb-1" />
            <p className="text-xs font-semibold text-white">No Pending Reassignment Requests</p>
            <p className="text-[11px] text-mist-400">
              All room attendants are actively progressing assigned tasks without reported blockers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReassignments.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-amber-400/30 bg-amber-500/[0.05] space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase font-mono">
                        {t.ref}
                      </span>
                      <span className="text-xs font-bold text-white">{t.title}</span>
                      {t.room && (
                        <span className="text-xs text-amber-200 font-mono">· Room {t.room}</span>
                      )}
                    </div>
                    <p className="text-xs text-amber-200/90">
                      <span className="font-semibold text-white">Attendant:</span> {t.assignee || 'Unassigned'}
                      {t.reassignReason && (
                        <span className="ml-2 italic text-rose-300">
                          (Blocker: {t.reassignReason})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onReviewReassignment(t.id, 'reject', undefined, 'Declined: Attendant retained')}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForReassign(t)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition flex items-center gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Reassign Attendant</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reassignment Action Modal if selected */}
      {selectedTaskForReassign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <h3 className="text-base font-bold font-display text-white">
              Reassign Task {selectedTaskForReassign.ref}
            </h3>
            <p className="text-xs text-mist-400">
              Task: {selectedTaskForReassign.title} ({selectedTaskForReassign.room || 'General'})
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Select Replacement Attendant</label>
              <select
                value={targetStaffId}
                onChange={(e) => setTargetStaffId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none transition"
              >
                <option value="">Choose available attendant...</option>
                {attendants.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employeeId}) · {s.floorZone || 'Floors 1-5'} · {s.availability || 'on_duty'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Supervisor Note</label>
              <input
                type="text"
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
                placeholder="Reason for reassignment..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedTaskForReassign(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-mist-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetStaffId}
                onClick={() => handleExecuteReassignment('reassign')}
                className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 disabled:opacity-50 transition"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Tasks List */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Housekeeping Department Active Task Board
            </h2>
            <p className="text-xs text-mist-400">
              Live monitoring of fulfiller cleaning tasks, VIP turn-downs, and maintenance requests
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            {(['all', 'Assigned', 'In progress', 'Completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task by title, room number, or attendant name..."
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Ref & Title</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">SLA / Time</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-mono font-bold text-amber-300 text-[11px]">{t.ref}</span>
                      <p className="text-white font-medium">{t.title}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white">
                    {t.room ? `Room ${t.room}` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.priority === 'urgent' || t.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : t.priority === 'vip'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/10 text-mist-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-white">{t.assignee || 'Unassigned'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'In progress'
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-white/10 text-mist-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-mist-400 font-mono text-[11px]">
                    {t.slaDue || t.at}
                  </td>
                  <td className="py-3.5 px-4 text-mist-400 max-w-xs truncate text-[11px]">
                    {t.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
