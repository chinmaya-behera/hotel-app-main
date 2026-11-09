'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  Layers,
  Sparkles,
  Star,
  Timer,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, StaffAccount } from '@/types/demo';

interface DepartmentDetail {
  id: string;
  name: string;
  leadName: string;
  leadEmpId: string;
  icon: any;
  taskCompletionRate: number;
  avgResolutionMinutes: number;
  overdueTasksCount: number;
  escalationsCount: number;
  staffOnDutyCount: number;
  totalStaffCount: number;
  guestSatisfactionScore: number;
  activeTasks: WorkItem[];
  staffMembers: StaffAccount[];
  weeklyTrend: number[];
}

function getStaffDesignation(staff: StaffAccount): string {
  const deptLower = (staff.department || '').toLowerCase();

  if (staff.roleId === 'department_dispatcher_supervisor') {
    if (deptLower.includes('maintenance') || deptLower.includes('engineering')) return 'Engineering Shift Supervisor';
    if (deptLower.includes('housekeeping')) return 'Housekeeping Shift Supervisor';
    if (deptLower.includes('food') || deptLower.includes('beverage')) return 'F&B Shift Supervisor';
    if (deptLower.includes('spa') || deptLower.includes('wellness')) return 'Wellness Shift Supervisor';
    return 'Shift Supervisor';
  }

  if (staff.roleId === 'department_dispatcher') {
    if (deptLower.includes('housekeeping')) return 'Housekeeping Dispatcher';
    if (deptLower.includes('maintenance') || deptLower.includes('engineering')) return 'Maintenance Dispatcher';
    if (deptLower.includes('food') || deptLower.includes('beverage')) return 'F&B Dispatcher';
    if (deptLower.includes('spa') || deptLower.includes('wellness')) return 'Wellness Dispatcher';
    return 'Department Dispatcher';
  }

  if (staff.roleId === 'department_manager') {
    return 'Department Operations Manager';
  }

  if (staff.roleId === 'task_fulfiller') {
    if (deptLower.includes('maintenance') || deptLower.includes('engineering')) {
      if (staff.skills?.some((s) => s.toLowerCase().includes('hvac'))) return 'HVAC & Maintenance Technician';
      return 'Maintenance Technician';
    }
    if (deptLower.includes('housekeeping')) {
      return 'Housekeeping Associate';
    }
    if (deptLower.includes('food') || deptLower.includes('beverage')) {
      return 'F&B Server / Runner';
    }
    if (deptLower.includes('spa') || deptLower.includes('wellness')) {
      return 'Spa Therapist & Specialist';
    }
    return 'Field Operations Fulfiller';
  }

  return staff.roleId
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ExecutivePerformanceTab() {
  const { state } = useDemo();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');
  const [inspectingDept, setInspectingDept] = useState<DepartmentDetail | null>(null);

  // Aggregate all tasks across roles
  const allTasks: WorkItem[] = useMemo(() => {
    const list: WorkItem[] = [];
    const roles = ['task_fulfiller', 'department_dispatcher', 'department_manager', 'front_desk_coordinator', 'security_responder'] as const;
    const seen = new Set<string>();
    roles.forEach((r) => {
      (state.items[r] ?? []).forEach((item) => {
        const key = item.ref || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(item);
        }
      });
    });
    return list;
  }, [state.items]);

  const allStaff = state.staffAccounts ?? [];
  const incidents = state.incidents ?? [];

  // Compute metrics for the 4 operating departments
  const departments: DepartmentDetail[] = useMemo(() => {
    return [
      {
        id: 'maintenance',
        name: 'Maintenance & Engineering',
        leadName: 'Arjun Mehta',
        leadEmpId: 'EMP-0104',
        icon: Wrench,
        taskCompletionRate: 91.4,
        avgResolutionMinutes: 18,
        overdueTasksCount: 2,
        escalationsCount: incidents.filter((i) => i.department?.toLowerCase().includes('maintenance')).length,
        staffOnDutyCount: allStaff.filter(
          (s) => s.department.toLowerCase().includes('maintenance') && s.availability === 'on_duty',
        ).length || 3,
        totalStaffCount: allStaff.filter((s) => s.department.toLowerCase().includes('maintenance')).length || 4,
        guestSatisfactionScore: 4.6,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('maintenance') || t.category === 'maintenance'),
        staffMembers: allStaff.filter((s) => s.department.toLowerCase().includes('maintenance')),
        weeklyTrend: [88, 89, 90, 92, 91, 93, 91.4],
      },
      {
        id: 'housekeeping',
        name: 'Housekeeping & Rooms',
        leadName: 'Meera Nambiar',
        leadEmpId: 'EMP-0105',
        icon: Layers,
        taskCompletionRate: 96.8,
        avgResolutionMinutes: 12,
        overdueTasksCount: 0,
        escalationsCount: 0,
        staffOnDutyCount: allStaff.filter(
          (s) => s.department.toLowerCase().includes('housekeeping') && s.availability === 'on_duty',
        ).length || 4,
        totalStaffCount: allStaff.filter((s) => s.department.toLowerCase().includes('housekeeping')).length || 5,
        guestSatisfactionScore: 4.8,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('housekeeping') || t.category === 'housekeeping'),
        staffMembers: allStaff.filter((s) => s.department.toLowerCase().includes('housekeeping')),
        weeklyTrend: [95, 96, 94, 97, 98, 96, 96.8],
      },
      {
        id: 'food_beverage',
        name: 'Food & Beverage',
        leadName: 'Kabir Sen',
        leadEmpId: 'EMP-0113',
        icon: Sparkles,
        taskCompletionRate: 94.0,
        avgResolutionMinutes: 14,
        overdueTasksCount: 1,
        escalationsCount: 0,
        staffOnDutyCount: allStaff.filter(
          (s) => s.department.toLowerCase().includes('beverage') && s.availability === 'on_duty',
        ).length || 3,
        totalStaffCount: allStaff.filter((s) => s.department.toLowerCase().includes('beverage')).length || 4,
        guestSatisfactionScore: 4.9,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('beverage') || t.category === 'room_service'),
        staffMembers: allStaff.filter((s) => s.department.toLowerCase().includes('beverage')),
        weeklyTrend: [92, 93, 95, 94, 96, 95, 94.0],
      },
      {
        id: 'spa_wellness',
        name: 'Wellness',
        leadName: 'T. Brandt',
        leadEmpId: 'EMP-0110',
        icon: Star,
        taskCompletionRate: 98.5,
        avgResolutionMinutes: 8,
        overdueTasksCount: 0,
        escalationsCount: 0,
        staffOnDutyCount: 2,
        totalStaffCount: 2,
        guestSatisfactionScore: 4.95,
        activeTasks: allTasks.filter((t) => t.category === 'spa' || t.department?.toLowerCase().includes('wellness')),
        staffMembers: allStaff.filter((s) => s.department.toLowerCase().includes('spa') || s.department.toLowerCase().includes('wellness')),
        weeklyTrend: [97, 98, 99, 98, 97, 99, 98.5],
      },
    ];
  }, [allStaff, allTasks, incidents]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              Department Operational Performance
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
              Property Target: 94.0%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Turnaround velocity, SLA breach rates, staffing saturation, and service satisfaction across operating departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range */}
          <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
            {(['today', '7days', '30days'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeRange === r
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7days' ? '7D' : '30D'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const isHealthy = dept.taskCompletionRate >= 94;

          return (
            <div
              key={dept.id}
              className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg hover:border-amber-500/30 transition flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-amber-500/15 text-amber-500 grid place-items-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                        {dept.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-mist-500">
                        Lead: {dept.leadName} ({dept.leadEmpId})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isHealthy
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {isHealthy ? 'SLA Passed' : 'Attention'}
                  </span>
                </div>

                {/* Main SLA Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-mist-400">SLA Adherence</span>
                    <span className="font-mono font-bold text-navy-950 dark:text-white">
                      {dept.taskCompletionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-ink-950 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.taskCompletionRate}%` }}
                    />
                  </div>
                </div>

                {/* 4 Metric Chips Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                      Avg Turnaround
                    </span>
                    <div className="text-sm font-black font-mono text-navy-950 dark:text-white mt-0.5 flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5 text-amber-500" />
                      {dept.avgResolutionMinutes} min
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                      Guest Rating
                    </span>
                    <div className="text-sm font-black font-mono text-navy-950 dark:text-white mt-0.5 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      {dept.guestSatisfactionScore} / 5.0
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                      On-Duty Staff
                    </span>
                    <div className="text-sm font-black font-mono text-navy-950 dark:text-white mt-0.5 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {dept.staffOnDutyCount} of {dept.totalStaffCount}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                      Overdue Work
                    </span>
                    <div
                      className={`text-sm font-black font-mono mt-0.5 flex items-center gap-1 ${
                        dept.overdueTasksCount > 0 ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {dept.overdueTasksCount} overdue
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspect Button */}
              <button
                type="button"
                onClick={() => setInspectingDept(dept)}
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-navy-950 dark:text-white transition flex items-center justify-center gap-1.5"
              >
                <span>Drill Down Department</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Drill-down Department Inspection Modal / Drawer */}
      {inspectingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-ink-950/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center">
                  <inspectingDept.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-950 dark:text-white">
                    {inspectingDept.name} — Operational Audit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-mist-400">
                    Lead: {inspectingDept.leadName} ({inspectingDept.leadEmpId}) · SLA Benchmark: {inspectingDept.taskCompletionRate}%
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingDept(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Active Staff Roster in this Department */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Active Field Team Members ({inspectingDept.staffMembers.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {inspectingDept.staffMembers.map((staff) => (
                    <div
                      key={staff.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-navy-950 dark:text-white">
                          {staff.name}
                        </div>
                        <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {getStaffDesignation(staff)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-mist-500 font-mono mt-0.5">
                          {staff.employeeId} · Shift: {staff.shift}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            staff.availability === 'on_duty'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                          }`}
                        >
                          {staff.availability === 'on_duty' ? 'On Duty' : 'Off Shift'}
                        </span>
                        <div className="text-[10px] text-slate-400 dark:text-mist-500 mt-0.5">
                          Zone: {staff.floorZone || 'All'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Tasks in Department Queue */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  Live Operational Queue ({inspectingDept.activeTasks.length})
                </h4>
                {inspectingDept.activeTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-mist-500 rounded-2xl border border-slate-200 dark:border-white/10">
                    No active tasks currently pending in this queue.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                          <th className="px-4 py-2.5">Description</th>
                          <th className="px-4 py-2.5 text-center w-28">Priority</th>
                          <th className="px-4 py-2.5 text-right w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.05] text-xs">
                        {inspectingDept.activeTasks.slice(0, 5).map((task) => (
                          <tr key={task.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-navy-950 dark:text-white">
                                {task.title}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-mist-500">
                                {task.ref || task.id} · {task.meta}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  task.priority === 'critical'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                                }`}
                              >
                                {task.priority || 'Normal'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-[11px] font-mono font-bold text-navy-950 dark:text-white">
                                {task.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-ink-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingDept(null)}
                className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
