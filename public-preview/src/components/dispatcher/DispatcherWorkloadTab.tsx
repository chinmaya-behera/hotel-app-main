'use client';

import { useState } from 'react';
import {
  Users,
  Layers,
  Sparkles,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Shield,
  Activity,
  Bed,
  Wrench,
  UtensilsCrossed,
  Filter,
  SlidersHorizontal,
  X,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { AssignTaskModal } from '@/components/dispatcher/AssignTaskModal';
import type { StaffAccount, WorkItem, DispatcherDepartment } from '@/types/demo';

interface DispatcherWorkloadTabProps {
  staffList?: StaffAccount[];
  department?: DispatcherDepartment;
}

export function DispatcherWorkloadTab({ staffList, department }: DispatcherWorkloadTabProps = {}) {
  const { state, redistributeUnstartedTasks, updateStaffCapacity } = useDemo();
  const [reassignModalTask, setReassignModalTask] = useState<WorkItem | null>(null);
  const [editingCapacityStaff, setEditingCapacityStaff] = useState<StaffAccount | null>(null);
  const [capacityInput, setCapacityInput] = useState<number>(5);
  const [selectedStaffModal, setSelectedStaffModal] = useState<StaffAccount | null>(null);

  const staffAccounts = staffList ?? (state.staffAccounts ?? []).filter((s) => {
    if (!department) return true;
    const d = s.department.toLowerCase();
    if (department === 'Housekeeping') return d.includes('house');
    if (department === 'Wellness') return d.includes('spa') || d.includes('wellness');
    if (department === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
    if (department === 'Food & Beverages') return d.includes('food') || d.includes('bev');
    return true;
  });
  const fulfillers = staffAccounts.filter((s) => s.roleId === 'task_fulfiller');
  const filteredFulfillers = fulfillers;

  // Calculate active workload and find tasks assigned to each fulfiller
  const getFulfillerTasks = (employeeId: string, staffName?: string) => {
    const allItems = [
      ...(state.items.task_fulfiller ?? []),
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ];
    // Deduplicate by task ID
    const uniqueItems = allItems.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

    return uniqueItems.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Cancelled') return false;
      const matchId = t.assigneeId && (t.assigneeId === employeeId || t.assigneeId.toLowerCase() === employeeId.toLowerCase());
      const matchName = staffName && t.assignee && (
        t.assignee.toLowerCase() === staffName.toLowerCase() ||
        t.assignee.toLowerCase().includes(staffName.toLowerCase()) ||
        staffName.toLowerCase().includes(t.assignee.toLowerCase())
      );
      return Boolean(matchId || matchName);
    });
  };

  const handleRebalance = () => {
    redistributeUnstartedTasks(department);
  };

  const openCapacityModal = (staff: StaffAccount) => {
    setEditingCapacityStaff(staff);
    setCapacityInput(staff.maxWorkload || 5);
  };

  const handleSaveCapacity = () => {
    if (!editingCapacityStaff) return;
    const validated = Math.max(1, Math.min(20, Math.round(capacityInput)));
    updateStaffCapacity(editingCapacityStaff.id, validated);
    setEditingCapacityStaff(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Rebalance Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Field Team Workload & Capacity Board
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Configure individual attendant task capacities (1–20), monitor saturation in real-time, and balance queues dynamically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRebalance}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>1-Click Rebalance Workload</span>
          </button>
        </div>
      </div>

      {/* Filter and Overview Metrics */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Department Info & Attendant Count */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-200 text-xs font-semibold flex items-center gap-2">
            <span>{department ? `${department} Field Attendants` : 'Field Attendants'}</span>
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
              {fulfillers.length}
            </span>
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-mist-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Available (&lt;60%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Moderate (60-80%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Overloaded / At Cap (&gt;80%)
          </span>
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFulfillers.map((staff) => {
          const activeTasks = getFulfillerTasks(staff.employeeId, staff.name);
          const maxLoad = staff.maxWorkload || 5;
          const remainingCapacity = Math.max(0, maxLoad - activeTasks.length);
          const percentage = Math.round((activeTasks.length / maxLoad) * 100);
          const isFull = activeTasks.length >= maxLoad;
          const isHeavy = percentage >= 80;
          const isModerate = percentage >= 60 && percentage < 80;
          const isUnavailable = staff.availability && staff.availability !== 'on_duty';

          return (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffModal(staff)}
              className={`rounded-3xl border bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 transition cursor-pointer hover:border-amber-400/50 hover:shadow-2xl hover:scale-[1.01] ${
                isFull
                  ? 'border-rose-500/30 ring-1 ring-rose-500/10'
                  : 'border-white/10'
              }`}
              title="Click to view employee details and assigned tasks"
            >
              {/* Header: Name, Employee ID, Availability Dropdown */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-extrabold flex items-center justify-center text-xs">
                      {staff.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{staff.name}</h3>
                        {isFull && (
                          <span className="rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[9px] font-extrabold px-1.5 py-0.2 uppercase">
                            Overloaded
                          </span>
                        )}
                        {isUnavailable && (
                          <span className="rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 uppercase">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-mist-400">
                        {staff.employeeId} · {staff.department}
                      </p>
                    </div>
                  </div>

                  {/* Availability Badge (Read-only; updated by employee) */}
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold select-none cursor-default ${
                      staff.availability === 'break'
                        ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                        : staff.availability === 'off_duty'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    }`}
                    title="Duty status is managed directly by the employee"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        staff.availability === 'break'
                          ? 'bg-amber-400'
                          : staff.availability === 'off_duty'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    <span>
                      {staff.availability === 'break'
                        ? 'On Break'
                        : staff.availability === 'off_duty'
                        ? 'Off Duty'
                        : 'On Duty'}
                    </span>
                  </div>
                </div>

                {/* Floor Zone & Shift */}
                <div className="flex flex-wrap items-center justify-between text-xs text-mist-400 border-t border-white/[0.04] pt-2">
                  <span className="flex items-center gap-1 font-medium text-white">
                    <MapPin className="h-3.5 w-3.5 text-amber-300" />
                    {staff.floorZone}
                  </span>
                  <span>{staff.shift} Shift</span>
                </div>

                {staff.skills && staff.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {staff.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-mist-300 px-2 py-0.5"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Capacity Gauge Meter & Controls */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-mist-400">Current Workload: </span>
                      <strong
                        className={`font-mono ${
                          isFull ? 'text-rose-400' : isModerate ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        {activeTasks.length} / {maxLoad} Tasks
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCapacityModal(staff);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                      title="Configure individual max concurrent task capacity"
                    >
                      <SlidersHorizontal className="h-3 w-3 text-amber-300" />
                      <span>Edit Limit</span>
                    </button>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : isHeavy ? 'bg-rose-400' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-mist-400 font-mono">
                    <span>Remaining capacity:</span>
                    <strong className={remainingCapacity === 0 ? 'text-rose-400 font-bold' : 'text-emerald-300'}>
                      {remainingCapacity === 0 ? '0 slots (Full)' : `${remainingCapacity} available`}
                    </strong>
                  </div>
                </div>

                {/* Assigned Active Tasks Preview */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 block">
                    Active Tasks in Queue ({activeTasks.length})
                  </span>
                  {activeTasks.length === 0 ? (
                    <p className="text-[11px] text-mist-500 italic py-1">
                      No active tasks currently assigned. Ready for immediate dispatch.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {activeTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-ink-950/60 border border-white/[0.04] text-xs hover:border-white/10 transition"
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold text-white truncate text-[11px]">{t.title}</p>
                            <span className="text-[10px] text-mist-400 font-mono">
                              {t.ref} · {t.status}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReassignModalTask(t);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-amber-400/30 bg-amber-400/10 text-[10px] font-bold text-amber-300 hover:bg-amber-400/20 transition shrink-0 flex items-center gap-1 cursor-pointer"
                            title="Reassign this task"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Reassign</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Details Card Footer */}
                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-mist-400 font-mono">
                    {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'} assigned
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffModal(staff);
                    }}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Details & Tasks</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reassign Modal */}
      {reassignModalTask && (
        <AssignTaskModal
          task={reassignModalTask}
          department={department}
          lockDepartment={true}
          onClose={() => setReassignModalTask(null)}
        />
      )}

      {/* Edit Individual Capacity Modal */}
      {editingCapacityStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="capacity-modal-title"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="capacity-modal-title" className="text-base font-bold font-display text-white">
                    Set Max Task Capacity
                  </h2>
                  <p className="text-xs text-mist-400">
                    {editingCapacityStaff.name} ({editingCapacityStaff.employeeId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCapacityStaff(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-mist-300 leading-relaxed">
                Configure the maximum concurrent tasks this employee can hold before being marked as overloaded and excluded from automated auto-routing.
              </p>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-2">
                  Concurrent Active Task Limit (1 – 20 tasks):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCapacityInput((prev) => Math.max(1, prev - 1))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-lg font-bold hover:bg-white/10 text-white transition flex items-center justify-center"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    className="flex-1 h-10 rounded-xl border border-white/10 bg-black/40 text-center font-mono text-lg font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCapacityInput((prev) => Math.min(20, prev + 1))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-lg font-bold hover:bg-white/10 text-white transition flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-mist-400 uppercase font-bold tracking-wider">Quick Presets:</span>
                <div className="flex gap-2">
                  {[3, 5, 8, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCapacityInput(preset)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                        capacityInput === preset
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEditingCapacityStaff(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCapacity}
                className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
              >
                Save Capacity Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details & Assigned Tasks Modal */}
      {selectedStaffModal && (() => {
        const staff = selectedStaffModal;
        const tasks = getFulfillerTasks(staff.employeeId, staff.name);
        const maxLoad = staff.maxWorkload || 5;
        const remainingCapacity = Math.max(0, maxLoad - tasks.length);
        const percentage = Math.round((tasks.length / maxLoad) * 100);
        const isFull = tasks.length >= maxLoad;
        const isHeavy = percentage >= 80;
        const isModerate = percentage >= 60 && percentage < 80;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-extrabold flex items-center justify-center text-sm shadow-inner">
                    {staff.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 id="employee-modal-title" className="text-lg font-bold font-display text-white">
                        {staff.name}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          staff.availability === 'break'
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : staff.availability === 'off_duty'
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            staff.availability === 'break'
                              ? 'bg-amber-400'
                              : staff.availability === 'off_duty'
                              ? 'bg-rose-400'
                              : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        {staff.availability === 'break'
                          ? 'On Break'
                          : staff.availability === 'off_duty'
                          ? 'Off Duty'
                          : 'On Duty'}
                      </span>
                    </div>
                    <p className="text-xs text-mist-400 font-mono mt-0.5">
                      {staff.employeeId} · {staff.department} · {staff.shift} Shift · Zone: {staff.floorZone}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStaffModal(null)}
                  className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
                {/* Workload / Capacity Overview Strip */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-mist-400">Current Workload: </span>
                      <strong
                        className={`font-mono text-sm ${
                          isFull ? 'text-rose-400' : isModerate ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        {tasks.length} / {maxLoad} Tasks ({percentage}%)
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-semibold ${remainingCapacity === 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                        {remainingCapacity === 0 ? 'Capacity Full' : `${remainingCapacity} slots remaining`}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCapacityModal(staff)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
                      >
                        <SlidersHorizontal className="h-3 w-3 text-amber-300" />
                        <span>Edit Limit</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : isHeavy ? 'bg-rose-400' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  {staff.skills && staff.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-mist-400 mr-1">Skills:</span>
                      {staff.skills.map((sk) => (
                        <span
                          key={sk}
                          className="rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-mist-300 px-2 py-0.5"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Tasks List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-mist-300 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-amber-300" />
                      <span>Assigned Tasks ({tasks.length})</span>
                    </h3>
                    <span className="text-xs text-mist-400">
                      Reassign any task to another attendant
                    </span>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center text-mist-400 space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400/60" />
                      <p className="font-semibold text-white text-sm">No Active Tasks Assigned</p>
                      <p className="text-xs text-mist-500 max-w-xs mx-auto">
                        This attendant currently has no queued tasks and is ready for immediate work orders.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-white/[0.08] bg-ink-950/70 p-3.5 sm:p-4 hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs text-amber-300">
                                {t.ref || t.id.slice(0, 8)}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  t.priority === 'critical' || t.priority === 'safety' || t.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : t.priority === 'vip'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-white/10 text-mist-300'
                                }`}
                              >
                                {t.priority || 'Normal'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono text-mist-300">
                                {t.status}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-white truncate">{t.title}</h4>

                            {(t.description || t.meta) && (
                              <p className="text-xs text-mist-400 line-clamp-2">
                                {t.description || t.meta}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-mist-400 pt-1 font-mono">
                              <span className="flex items-center gap-1 text-white">
                                <MapPin className="h-3 w-3 text-amber-300" />
                                {t.room ? `Room ${t.room}` : 'Property'}
                              </span>
                              {t.slaDue && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-mist-400" />
                                  Target SLA: {t.slaDue}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Task Reassign Button on the side */}
                          <div className="sm:pl-3 sm:border-l border-white/[0.08] flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={() => setReassignModalTask(t)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-400/40 bg-amber-400/10 text-xs font-bold text-amber-300 hover:bg-amber-400/20 hover:border-amber-400/70 transition cursor-pointer shadow-sm active:scale-95"
                              title="Reassign this task to another attendant"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Reassign Task</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-white/[0.08] p-4 bg-white/[0.02] flex items-center justify-between text-xs text-mist-400">
                <span>{tasks.length} active work orders</span>
                <button
                  type="button"
                  onClick={() => setSelectedStaffModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
