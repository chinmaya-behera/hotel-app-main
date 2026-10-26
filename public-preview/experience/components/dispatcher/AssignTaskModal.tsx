'use client';

import { useState } from 'react';
import {
  X,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, StaffAccount } from '@/types/demo';

interface AssignTaskModalProps {
  task: WorkItem;
  onClose: () => void;
  onAssigned?: (staffName: string) => void;
}

export function AssignTaskModal({ task, onClose, onAssigned }: AssignTaskModalProps) {
  const { state, assignDispatcherTask, reassignDispatcherTask } = useDemo();
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [dispatchReason, setDispatchReason] = useState<string>('');
  const [overrideAuthorized, setOverrideAuthorized] = useState<boolean>(false);

  // Find fulfillers & dispatchers
  const staffAccounts = state.staffAccounts ?? [];

  // Determine matching department
  const taskDept =
    task.department ||
    (task.category === 'housekeeping'
      ? 'Housekeeping'
      : task.category === 'maintenance'
      ? 'Maintenance & Engineering'
      : task.category === 'room_service'
      ? 'Food & Beverage'
      : '');

  // Filter staff by department if selected
  const filteredStaff = staffAccounts.filter((s) => {
    if (s.roleId !== 'task_fulfiller' && s.roleId !== 'department_dispatcher') return false;
    if (filterDept !== 'all' && !s.department.toLowerCase().includes(filterDept.toLowerCase())) return false;
    return true;
  });

  // Calculate active workload per staff member
  const getActiveWorkload = (staff: StaffAccount) => {
    return (state.items.task_fulfiller ?? []).filter(
      (f) => f.assigneeId === staff.employeeId && f.status !== 'Completed' && f.status !== 'Cancelled',
    ).length;
  };

  const selectedStaff = staffAccounts.find((s) => s.id === selectedStaffId || s.employeeId === selectedStaffId);
  const selectedActiveLoad = selectedStaff ? getActiveWorkload(selectedStaff) : 0;
  const selectedMaxLoad = selectedStaff ? selectedStaff.maxWorkload || 5 : 5;
  const isSelectedOverloaded = selectedStaff ? selectedActiveLoad >= selectedMaxLoad : false;
  const selectedRemaining = selectedStaff ? Math.max(0, selectedMaxLoad - selectedActiveLoad) : 0;

  const handleAssign = () => {
    if (!selectedStaffId || !selectedStaff) return;
    if (isSelectedOverloaded && !overrideAuthorized) return;

    if (task.assigneeId && task.assigneeId !== selectedStaff.employeeId) {
      reassignDispatcherTask(task.id, selectedStaff.employeeId, dispatchReason || 'Manual rebalance by Dispatcher');
    } else {
      assignDispatcherTask(task.id, selectedStaff.employeeId);
    }

    if (onAssigned) onAssigned(selectedStaff.name);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                {task.assigneeId ? 'Workload Reassignment & Balancing' : 'Manual Dispatch Assignment'}
              </p>
            </div>
            <h2 id="assign-modal-title" className="text-xl font-bold font-display text-white">
              {task.assigneeId ? 'Reassign Task to Employee' : 'Assign Task to Attendant / Engineer'}
            </h2>
            <p className="text-xs text-mist-300 truncate max-w-lg">
              {task.ref ? <span className="font-mono text-amber-300 font-semibold">{task.ref} · </span> : null}
              {task.title} {task.room ? `· Room ${task.room}` : ''}
              {task.assignee ? ` (Currently: ${task.assignee})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Details summary strip */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs flex flex-wrap items-center gap-4 text-mist-300">
          <div>
            <span className="text-mist-500 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-medium text-white">{task.category || 'General'}</span>
          </div>
          <div>
            <span className="text-mist-500 block text-[10px] uppercase font-bold">Location</span>
            <span className="font-medium text-white">{task.location || (task.room ? `Room ${task.room}` : 'Property')}</span>
          </div>
          <div>
            <span className="text-mist-500 block text-[10px] uppercase font-bold">Priority</span>
            <span className="capitalize font-semibold text-amber-300">{task.priority || 'Normal'}</span>
          </div>
          <div>
            <span className="text-mist-500 block text-[10px] uppercase font-bold">SLA Target</span>
            <span className="font-mono text-mist-200">{task.slaDue || '25m'}</span>
          </div>
          {task.floor && (
            <div>
              <span className="text-mist-500 block text-[10px] uppercase font-bold">Floor / Level</span>
              <span className="font-mono text-emerald-300 font-semibold">Floor {task.floor}</span>
            </div>
          )}
        </div>

        {/* Department Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mist-400 font-medium">Filter by Department:</span>
            <span className="text-[11px] text-mist-500">{filteredStaff.length} eligible staff members</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'all', label: 'All Departments' },
              { id: 'housekeeping', label: 'Housekeeping' },
              { id: 'maintenance', label: 'Maintenance & Eng' },
              { id: 'food', label: 'Food & Beverage' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setFilterDept(d.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  filterDept === d.id
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200 shadow-sm'
                    : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Selection Roster */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredStaff.map((staff) => {
            const activeLoad = getActiveWorkload(staff);
            const maxLoad = staff.maxWorkload || 5;
            const isFull = activeLoad >= maxLoad;
            const isSelected = selectedStaffId === staff.employeeId || selectedStaffId === staff.id;
            const isOffDuty = staff.availability && staff.availability !== 'on_duty';
            const matchesFloor = task.floor && staff.floorZone?.includes(String(task.floor));
            const remaining = Math.max(0, maxLoad - activeLoad);

            return (
              <div
                key={staff.id}
                onClick={() => {
                  if (!isOffDuty) setSelectedStaffId(staff.employeeId);
                }}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/[0.08] shadow-md'
                    : isOffDuty
                    ? 'border-white/[0.04] bg-white/[0.01] opacity-50 cursor-not-allowed'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-amber-400 text-ink-950 font-extrabold' : 'bg-white/10 text-mist-200'
                    }`}
                  >
                    {staff.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{staff.name}</span>
                      <span className="text-[10px] font-mono text-mist-400">{staff.employeeId}</span>
                      {matchesFloor ? (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.5 font-bold">
                          Floor Match
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-mist-400 mt-0.5">
                      <span>{staff.department}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-mist-500" />
                        {staff.floorZone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Workload Gauge & Remaining Capacity */}
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isFull ? 'text-rose-400' : activeLoad > 2 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {activeLoad} / {maxLoad}
                    </span>
                    <span className="text-[10px] text-mist-400">({remaining} left)</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      staff.availability === 'break'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : staff.availability === 'off_duty'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isFull
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isFull ? 'At Capacity' : staff.availability ? staff.availability.replace('_', ' ') : 'On Duty'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workload Impact Preview & Reason Input */}
        {selectedStaff && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-mist-400">Workload Impact:</span>
              <span className="font-mono font-semibold text-white">
                Current: <strong className="text-mist-200">{selectedActiveLoad}/{selectedMaxLoad}</strong> → Proposed:{' '}
                <strong className={selectedActiveLoad + 1 > selectedMaxLoad ? 'text-rose-400' : 'text-amber-300'}>
                  {selectedActiveLoad + 1}/{selectedMaxLoad}
                </strong>{' '}
                ({Math.max(0, selectedRemaining - 1)} slots remaining)
              </span>
            </div>

            {isSelectedOverloaded && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Target employee is at maximum configured capacity ({selectedActiveLoad}/{selectedMaxLoad})</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={overrideAuthorized}
                    onChange={(e) => setOverrideAuthorized(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-amber-400 focus:ring-0"
                  />
                  <span>Authorized Dispatcher Capacity Override</span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-mist-400 mb-1">
                Dispatch / Reassignment Reason (optional):
              </label>
              <input
                type="text"
                value={dispatchReason}
                onChange={(e) => setDispatchReason(e.target.value)}
                placeholder="e.g. Lowest active queue, urgent floor 4 priority, VIP coverage"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <p className="text-xs text-mist-400">
            {selectedStaff ? (
              <span>
                Selected:{' '}
                <strong className="text-amber-300">{selectedStaff.name}</strong>
              </span>
            ) : (
              'Select an attendant from the list above'
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedStaffId || (isSelectedOverloaded && !overrideAuthorized)}
              onClick={handleAssign}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/20"
            >
              <UserCheck className="h-4 w-4" />
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
