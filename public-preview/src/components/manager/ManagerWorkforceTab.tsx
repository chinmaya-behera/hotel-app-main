import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { StaffAccount, ShiftScheduleRecord } from '@/types/demo';

function getShiftHoursDisplay(s?: ShiftScheduleRecord | null): string {
  if (!s) return '07:00 – 15:30';
  if (s.startTime && s.endTime) return `${s.startTime} – ${s.endTime}`;
  const raw = s.shiftHours;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (s.shiftType === 'Evening') return '15:00 – 23:30';
  if (s.shiftType === 'Night') return '23:00 – 07:30';
  return '07:00 – 15:30';
}

function getShiftStartDisplay(s?: ShiftScheduleRecord | null): string {
  if (!s) return '07:00';
  if (s.startTime) return s.startTime;
  const raw = s.shiftHours;
  if (typeof raw === 'string' && raw.includes('–')) return raw.split('–')[0].trim();
  if (typeof raw === 'string' && raw.includes('-')) return raw.split('-')[0].trim();
  if (s.shiftType === 'Evening') return '15:00';
  if (s.shiftType === 'Night') return '23:00';
  return '07:00';
}

interface ManagerWorkforceTabProps {
  scope: 'department' | 'hotel';
  onRequestStaffing?: () => void;
}

export function ManagerWorkforceTab({ scope, onRequestStaffing }: ManagerWorkforceTabProps) {
  const { state, redistributeUnstartedTasks, updateStaffShiftSchedule, createStaffShiftSchedule, notify } = useDemo();
  const [workforceSubTab, setWorkforceSubTab] = useState<'workload' | 'roster'>('workload');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'Morning' | 'Evening' | 'Night'>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);

  // Shift schedule modal states
  const [editingSchedule, setEditingSchedule] = useState<ShiftScheduleRecord | null>(null);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [newScheduleForm, setNewScheduleForm] = useState({
    employeeId: '',
    shiftType: 'Morning' as 'Morning' | 'Evening' | 'Night',
    floorZone: 'Suites Floor 4',
    notes: '',
  });

  const shiftSchedules = state.shiftSchedules ?? [];
  const conflicts = useMemo(
    () => shiftSchedules.filter((s) => s.status === 'conflict'),
    [shiftSchedules],
  );

  const staffAccounts = useMemo(() => {
    const list = state.staffAccounts ?? [];
    if (scope === 'department') {
      return list.filter(
        (s) =>
          s.department.toLowerCase().includes('duty') ||
          s.department.toLowerCase().includes('operations') ||
          s.department.toLowerCase().includes('management'),
      );
    }
    return list;
  }, [state.staffAccounts, scope]);

  // Tasks mapped by assignee
  const tasksByAssignee = useMemo(() => {
    const map = new Map<string, { active: number; completed: number; items: any[] }>();

    staffAccounts.forEach((s) => {
      map.set(s.employeeId, { active: 0, completed: 0, items: [] });
    });

    // Check task_fulfiller queue
    (state.items.task_fulfiller ?? []).forEach((t) => {
      if (t.assigneeId && map.has(t.assigneeId)) {
        const entry = map.get(t.assigneeId)!;
        entry.items.push(t);
        if (t.status === 'Completed') {
          entry.completed++;
        } else if (t.status !== 'Cancelled') {
          entry.active++;
        }
      }
    });

    return map;
  }, [state.items.task_fulfiller, staffAccounts]);

  const filteredStaff = useMemo(() => {
    return staffAccounts.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesId = s.employeeId.toLowerCase().includes(q);
        const matchesDept = s.department.toLowerCase().includes(q);
        const matchesZone = s.floorZone?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept && !matchesZone) return false;
      }
      if (deptFilter !== 'all' && !s.department.toLowerCase().includes(deptFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [staffAccounts, searchQuery, deptFilter]);

  const scheduleByEmployeeId = useMemo(() => {
    const map = new Map<string, ShiftScheduleRecord>();
    shiftSchedules.forEach((s) => map.set(s.employeeId, s));
    return map;
  }, [shiftSchedules]);

  const filteredSchedules = useMemo(() => {
    return shiftSchedules.filter((s) => {
      if (shiftFilter !== 'all' && s.shiftType !== shiftFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          s.employeeName.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.floorZone.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (deptFilter !== 'all' && !s.department.toLowerCase().includes(deptFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [shiftSchedules, shiftFilter, searchQuery, deptFilter]);

  const handleRedistribute = () => {
    const res = redistributeUnstartedTasks(deptFilter === 'all' ? undefined : deptFilter);
    notify(res.message);
  };

  const handleFlagIssue = (staff: StaffAccount) => {
    notify(`Workload flag recorded for ${staff.name} (${staff.employeeId}) — Dispatch notified`);
  };

  const handleSaveEditSchedule = () => {
    if (!editingSchedule) return;

    const hours = getShiftHoursDisplay(editingSchedule);
    const startTime = editingSchedule.startTime || (hours.includes('–') ? hours.split('–')[0].trim() : '07:00');
    const endTime = editingSchedule.endTime || (hours.includes('–') ? hours.split('–')[1].trim() : '15:30');
    updateStaffShiftSchedule(editingSchedule.id, {
      shiftType: editingSchedule.shiftType,
      startTime,
      endTime,
      shiftHours: hours,
      floorZone: editingSchedule.floorZone,
      status: editingSchedule.status,
      notes: editingSchedule.notes,
      conflictReason: editingSchedule.status === 'conflict' ? editingSchedule.conflictReason : undefined,
    });
    notify(`Shift roster updated for ${editingSchedule.employeeName}`);
    setEditingSchedule(null);
  };

  const handleResolveConflict = (item: ShiftScheduleRecord) => {
    (updateStaffShiftSchedule as any)(item.id, {
      status: 'scheduled',
      conflictReason: undefined,
      notes: (item.notes ? item.notes + ' · ' : '') + 'Conflict resolved by Department Manager',
    });
    notify(`Conflict cleared for ${item.employeeName} — assigned to ${item.shiftType} Shift`);
  };

  const handleCreateSchedule = () => {
    const staff = staffAccounts.find((s) => s.employeeId === newScheduleForm.employeeId);
    if (!staff) {
      notify('Please select an employee.');
      return;
    }
    const hours =
      newScheduleForm.shiftType === 'Morning'
        ? '07:00 – 15:30'
        : newScheduleForm.shiftType === 'Evening'
        ? '15:00 – 23:30'
        : '23:00 – 07:30';
    const startTime = newScheduleForm.shiftType === 'Morning' ? '07:00' : newScheduleForm.shiftType === 'Evening' ? '15:00' : '23:00';
    const endTime = newScheduleForm.shiftType === 'Morning' ? '15:30' : newScheduleForm.shiftType === 'Evening' ? '23:30' : '07:30';

    createStaffShiftSchedule({
      employeeId: staff.employeeId,
      employeeName: staff.name,
      department: staff.department,
      roleId: staff.roleId || 'task_fulfiller',
      shiftType: newScheduleForm.shiftType,
      startTime,
      endTime,
      shiftHours: hours,
      floorZone: newScheduleForm.floorZone,
      date: '2026-10-30',
      status: 'scheduled',
      notes: newScheduleForm.notes || 'Assigned by Department Manager',
    });
    notify(`New shift scheduled for ${staff.name}`);
    setIsNewScheduleModalOpen(false);
    setNewScheduleForm({
      employeeId: '',
      shiftType: 'Morning',
      floorZone: 'Suites Floor 4',
      notes: '',
    });
  };

  // Shift counts
  const morningCount = shiftSchedules.filter((s) => s.shiftType === 'Morning').length;
  const eveningCount = shiftSchedules.filter((s) => s.shiftType === 'Evening').length;
  const nightCount = shiftSchedules.filter((s) => s.shiftType === 'Night').length;

  return (
    <div className="space-y-5">
      {/* Top Banner with Workforce Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-bold font-display text-white">Workforce & Shift Management</h2>
          </div>
          <p className="text-xs text-mist-400 mt-0.5">
            Real-time field attendance, shift rosters, scheduling conflicts, and task capacity limits
          </p>
        </div>

        <div className="flex items-center gap-3">
          {workforceSubTab === 'roster' ? (
            <button
              type="button"
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Assign Staff Shift</span>
            </button>
          ) : (
            <>
              {onRequestStaffing && (
                <button
                  type="button"
                  onClick={onRequestStaffing}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                >
                  + Request Reinforcement
                </button>
              )}

              <button
                type="button"
                onClick={handleRedistribute}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Redistribute Unstarted Tasks</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-navigation: Workload vs Shift Scheduling */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="inline-flex p-1 rounded-2xl bg-ink-900/80 border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setWorkforceSubTab('workload')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              workforceSubTab === 'workload'
                ? 'bg-amber-400 text-ink-950 shadow-md font-bold'
                : 'text-mist-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Live Staff Workload ({filteredStaff.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkforceSubTab('roster')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              workforceSubTab === 'roster'
                ? 'bg-amber-400 text-ink-950 shadow-md font-bold'
                : 'text-mist-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Shift Scheduling & Roster ({shiftSchedules.length})</span>
            {conflicts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                {conflicts.length} conflict
              </span>
            )}
          </button>
        </div>

        {workforceSubTab === 'roster' && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-mist-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <Sun className="h-3 w-3" /> Morning: {morningCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-400/10 text-sky-300 border border-sky-400/20">
              <Sunset className="h-3 w-3" /> Evening: {eveningCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-400/10 text-purple-300 border border-purple-400/20">
              <Moon className="h-3 w-3" /> Night: {nightCount}
            </span>
          </div>
        )}
      </div>

      {/* Conflicts Alert Banner */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-200">
                  {conflicts.length} Shift Scheduling Conflict Detected
                </h4>
                <p className="text-xs text-mist-300 mt-0.5">
                  Overlapping shifts or back-to-back assignments require immediate manager resolution to avoid floor coverage gaps.
                </p>
                <div className="mt-2 space-y-1.5">
                  {conflicts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs bg-rose-950/40 border border-rose-500/20 rounded-xl px-3 py-1.5">
                      <span className="font-semibold text-white">
                        {c.employeeName} ({c.employeeId}) · {c.shiftType} ({getShiftHoursDisplay(c)}) · <span className="text-rose-300">{c.conflictReason}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResolveConflict(c)}
                        className="ml-3 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold transition border border-emerald-500/30"
                      >
                        Resolve & Clear
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              workforceSubTab === 'roster'
                ? 'Search shift roster by staff name, ID, zone, or shift...'
                : 'Search staff by name, ID, department, or zone...'
            }
            className="w-full h-8 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {workforceSubTab === 'roster' && (
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-ink-950 text-white">All Shifts</option>
              <option value="Morning" className="bg-ink-950 text-white">Morning (07:00–15:30)</option>
              <option value="Evening" className="bg-ink-950 text-white">Evening (15:00–23:30)</option>
              <option value="Night" className="bg-ink-950 text-white">Night (23:00–07:30)</option>
            </select>
          )}

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
          </select>
        </div>
      </div>

      {/* VIEW 1: Live Staff Workload Grid */}
      {workforceSubTab === 'workload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const stats = tasksByAssignee.get(staff.employeeId) || { active: 0, completed: 0, items: [] };
            const maxLoad = staff.maxWorkload || 5;
            const isOverloaded = stats.active >= maxLoad;
            const isNearCap = stats.active === maxLoad - 1 && maxLoad > 1;
            const isOffDuty = staff.availability && staff.availability !== 'on_duty';
            const saturation = Math.min(100, Math.round((stats.active / maxLoad) * 100));
            const schedule = scheduleByEmployeeId.get(staff.employeeId);
            const hasConflict = schedule?.status === 'conflict';

            return (
              <div
                key={staff.id}
                className={`rounded-3xl border bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4 transition ${
                  hasConflict
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : isOverloaded
                    ? 'border-rose-500/30'
                    : isNearCap
                    ? 'border-amber-400/30'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                      {staff.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{staff.name}</h3>
                      <p className="text-[11px] font-mono text-mist-400">
                        {staff.employeeId} · {staff.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        hasConflict
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isOffDuty
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {hasConflict ? 'Shift Conflict' : staff.availability ? staff.availability.replace('_', ' ') : 'On Duty'}
                    </span>
                    {schedule && (
                      <span className="text-[10px] text-amber-300 font-mono">
                        {schedule.shiftType} ({getShiftStartDisplay(schedule)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Zone and Shift */}
                <div className="flex items-center justify-between text-xs text-mist-300 border-t border-white/[0.04] pt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-300" />
                    {schedule?.floorZone || staff.floorZone}
                  </span>
                  <span>{schedule?.shiftType || staff.shift} Shift</span>
                </div>

                {/* Capacity & Workload Meter */}
                <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist-400">Active Load:</span>
                    <span
                      className={`font-mono font-bold ${
                        isOverloaded ? 'text-rose-400' : isNearCap ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {stats.active} / {maxLoad} Tasks ({saturation}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverloaded ? 'bg-rose-500' : isNearCap ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${saturation}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-mist-400 font-mono">
                    <span>Completed today: {stats.completed}</span>
                    {isOverloaded ? (
                      <span className="text-rose-400 font-bold">⚠️ Overloaded</span>
                    ) : (
                      <span>{Math.max(0, maxLoad - stats.active)} slots available</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => handleFlagIssue(staff)}
                    className="text-[11px] text-mist-400 hover:text-amber-300 font-medium transition"
                  >
                    Flag Workload
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStaff(staff)}
                    className="px-3 py-1 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Shift Scheduling & Roster View */}
      {workforceSubTab === 'roster' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/90 shadow-xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Shift & Hours</th>
                    <th className="p-4">Floor / Zone</th>
                    <th className="p-4">Status & Conflict Status</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-white">
                  {filteredSchedules.map((item) => {
                    const isConflict = item.status === 'conflict';
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                              {item.employeeName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{item.employeeName}</p>
                              <p className="text-[11px] font-mono text-mist-400">
                                {item.employeeId} · {item.department}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border bg-white/[0.03]">
                            {item.shiftType === 'Morning' ? (
                              <Sun className="h-3.5 w-3.5 text-amber-300" />
                            ) : item.shiftType === 'Evening' ? (
                              <Sunset className="h-3.5 w-3.5 text-sky-300" />
                            ) : (
                              <Moon className="h-3.5 w-3.5 text-purple-300" />
                            )}
                            <span className="font-bold">{item.shiftType}</span>
                            <span className="text-mist-400 text-[11px]">({getShiftHoursDisplay(item)})</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-mist-200">
                            <MapPin className="h-3.5 w-3.5 text-amber-400" />
                            <span>{item.floorZone}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {isConflict ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                <AlertTriangle className="h-3 w-3" /> Conflict Detected
                              </span>
                              <p className="text-[11px] text-rose-300 max-w-xs">{item.conflictReason}</p>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'on_duty'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : item.status === 'off_duty'
                                  ? 'bg-white/10 text-mist-300 border border-white/10'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" /> {item.status.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-mist-400 max-w-xs">
                          {item.notes || '—'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isConflict && (
                              <button
                                type="button"
                                onClick={() => handleResolveConflict(item)}
                                className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition border border-emerald-500/30"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingSchedule(item)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
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
        </div>
      )}

      {/* Edit Shift Schedule Modal */}
      {editingSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Edit Shift Assignment: {editingSchedule.employeeName}
                </h3>
                <p className="text-xs text-mist-400">
                  {editingSchedule.employeeId} · {editingSchedule.department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Shift Type
                </label>
                <select
                  value={editingSchedule.shiftType}
                  onChange={(e) => {
                    const val = e.target.value as 'Morning' | 'Evening' | 'Night';
                    const hrs =
                      val === 'Morning'
                        ? '07:00 – 15:30'
                        : val === 'Evening'
                        ? '15:00 – 23:30'
                        : '23:00 – 07:30';
                    const [sTime, eTime] = hrs.split(' – ');
                    setEditingSchedule({
                      ...editingSchedule,
                      shiftType: val,
                      startTime: sTime,
                      endTime: eTime,
                      shiftHours: hrs,
                    });
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Morning" className="bg-ink-950">Morning (07:00 – 15:30)</option>
                  <option value="Evening" className="bg-ink-950">Evening (15:00 – 23:30)</option>
                  <option value="Night" className="bg-ink-950">Night (23:00 – 07:30)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Floor / Zone Assignment
                </label>
                <input
                  type="text"
                  value={editingSchedule.floorZone}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, floorZone: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Schedule Status
                </label>
                <select
                  value={editingSchedule.status}
                  onChange={(e) =>
                    setEditingSchedule({
                      ...editingSchedule,
                      status: e.target.value as any,
                      conflictReason: e.target.value !== 'conflict' ? undefined : editingSchedule.conflictReason,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="scheduled" className="bg-ink-950">Scheduled</option>
                  <option value="on_duty" className="bg-ink-950">On Duty</option>
                  <option value="conflict" className="bg-ink-950">Flag as Conflict</option>
                  <option value="off_duty" className="bg-ink-950">Off Duty</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Manager Notes
                </label>
                <textarea
                  value={editingSchedule.notes || ''}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Specific handoff directives or special instructions..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditSchedule}
                className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
              >
                Save Schedule Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Shift Schedule Modal */}
      {isNewScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Assign Staff Shift</h3>
                <p className="text-xs text-mist-400">
                  Assign an employee to a scheduled hotel shift with floor zone coverage
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewScheduleModalOpen(false)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Select Employee *
                </label>
                <select
                  value={newScheduleForm.employeeId}
                  onChange={(e) =>
                    setNewScheduleForm({ ...newScheduleForm, employeeId: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="" className="bg-ink-950">Select staff member...</option>
                  {staffAccounts.map((s) => (
                    <option key={s.id} value={s.employeeId} className="bg-ink-950">
                      {s.name} ({s.employeeId}) — {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Shift Type *
                </label>
                <select
                  value={newScheduleForm.shiftType}
                  onChange={(e) =>
                    setNewScheduleForm({
                      ...newScheduleForm,
                      shiftType: e.target.value as any,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Morning" className="bg-ink-950">Morning (07:00 – 15:30)</option>
                  <option value="Evening" className="bg-ink-950">Evening (15:00 – 23:30)</option>
                  <option value="Night" className="bg-ink-950">Night (23:00 – 07:30)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Assigned Floor / Zone *
                </label>
                <input
                  type="text"
                  value={newScheduleForm.floorZone}
                  onChange={(e) =>
                    setNewScheduleForm({ ...newScheduleForm, floorZone: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="e.g. Suites Floor 4, Dining Hall, Ground Floor"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 uppercase mb-1">
                  Handoff Directives / Notes
                </label>
                <textarea
                  value={newScheduleForm.notes}
                  onChange={(e) =>
                    setNewScheduleForm({ ...newScheduleForm, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Priority areas or specific handover notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsNewScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSchedule}
                className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
              >
                Confirm Shift Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-detail-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 id="staff-detail-title" className="text-lg font-bold font-display text-white">
                  {selectedStaff.name}
                </h3>
                <p className="text-xs text-mist-400">
                  {selectedStaff.employeeId} · {selectedStaff.department} · {selectedStaff.roleId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <span className="text-mist-500 uppercase font-bold text-[10px] block">Assigned Floor/Zone</span>
                  <span className="font-semibold text-white mt-0.5 block">{selectedStaff.floorZone}</span>
                </div>
                <div>
                  <span className="text-mist-500 uppercase font-bold text-[10px] block">Shift</span>
                  <span className="font-semibold text-white mt-0.5 block">{selectedStaff.shift} Shift</span>
                </div>
                <div>
                  <span className="text-mist-500 uppercase font-bold text-[10px] block">Configured Task Capacity</span>
                  <span className="font-mono text-amber-300 font-bold mt-0.5 block">{selectedStaff.maxWorkload || 5} concurrent tasks</span>
                </div>
                <div>
                  <span className="text-mist-500 uppercase font-bold text-[10px] block">Live Status</span>
                  <span className="capitalize font-semibold text-emerald-400 mt-0.5 block">
                    {selectedStaff.availability || 'On Duty'}
                  </span>
                </div>
              </div>

              {selectedStaff.skills && selectedStaff.skills.length > 0 && (
                <div>
                  <span className="text-mist-400 uppercase font-bold text-[10px] block mb-1.5">Specialized Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStaff.skills.map((sk) => (
                      <span key={sk} className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] text-white">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
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
