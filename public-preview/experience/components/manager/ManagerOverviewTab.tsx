'use client';

import { useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bed,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ShieldAlert,
  Siren,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, StaffAccount } from '@/types/demo';

interface ManagerOverviewTabProps {
  scope: 'department' | 'hotel';
  onNavigateTab: (tabId: string, filter?: { status?: string; priority?: string; department?: string }) => void;
}

export function ManagerOverviewTab({ scope, onNavigateTab }: ManagerOverviewTabProps) {
  const { state } = useDemo();

  // Aggregate tasks across roles based on scope
  const allTasks = useMemo(() => {
    const list: WorkItem[] = [];
    // Collect from dispatcher, fulfiller, manager, and front desk
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
      // Duty & Operations / Management department scope
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

  // Staff accounts based on scope
  const staff = useMemo(() => {
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

  // Complaints / Escalations
  const complaints = state.frontDesk.complaints ?? [];
  const incidents = state.incidents ?? [];

  // Metrics
  const activeTasks = allTasks.filter((t) => t.status === 'In Progress' || t.status === 'Assigned' || t.status === 'Acknowledged');
  const pendingTasks = allTasks.filter((t) => t.status === 'Received' || t.status === 'Pending' || t.status === 'Queued');
  const inProgressTasks = allTasks.filter((t) => t.status === 'In Progress');
  const completedToday = allTasks.filter((t) => t.status === 'Completed');
  const overdueTasks = allTasks.filter((t) => t.chip?.toLowerCase().includes('breach') || t.tone === 'danger');
  const criticalEscalations = allTasks.filter((t) => t.status === 'Escalated' || t.priority === 'critical' || t.priority === 'vip');

  const fulfillers = staff.filter((s) => s.roleId === 'task_fulfiller');
  const availableStaff = fulfillers.filter((f) => {
    if (f.availability && f.availability !== 'on_duty') return false;
    const load = (state.items.task_fulfiller ?? []).filter(
      (t) => t.assigneeId === f.employeeId && t.status !== 'Completed' && t.status !== 'Cancelled',
    ).length;
    return load < (f.maxWorkload || 5);
  });

  // Department saturation & breakdown
  const departmentStats = useMemo(() => {
    const depts = [
      { name: 'Housekeeping', code: 'HK' },
      { name: 'Maintenance & Engineering', code: 'MX' },
      { name: 'Food & Beverage', code: 'FB' },
      { name: 'Front Office', code: 'FO' },
      { name: 'Safety & Security', code: 'SEC' },
    ];

    return depts.map((d) => {
      const deptTasks = allTasks.filter((t) => (t.department || '').toLowerCase().includes(d.name.toLowerCase().split(' ')[0]));
      const activeCount = deptTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length;
      const deptStaff = staff.filter((s) => s.department.toLowerCase().includes(d.name.toLowerCase().split(' ')[0]));
      const totalCapacity = deptStaff.reduce((acc, s) => acc + (s.maxWorkload || 5), 0) || 10;
      const saturation = Math.min(100, Math.round((activeCount / totalCapacity) * 100));

      return {
        ...d,
        activeCount,
        staffCount: deptStaff.length,
        saturation,
        needsAttention: saturation >= 80,
      };
    });
  }, [allTasks, staff]);

  const deptsNeedingAttention = departmentStats.filter((d) => d.needsAttention).length;

  // Tasks by floor distribution
  const floorStats = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allTasks.forEach((t) => {
      const fl = t.floor || (t.room ? parseInt(t.room[0], 10) : undefined);
      if (fl && fl in counts) {
        if (t.status !== 'Completed' && t.status !== 'Cancelled') {
          counts[fl]++;
        }
      }
    });
    return counts;
  }, [allTasks]);

  const kpis = [
    {
      label: 'Active Tasks',
      value: activeTasks.length,
      note: `${inProgressTasks.length} in progress`,
      icon: Activity,
      tone: 'info' as const,
      onClick: () => onNavigateTab('operations', { status: 'In Progress' }),
    },
    {
      label: 'Pending Dispatches',
      value: pendingTasks.length,
      note: 'Awaiting fulfillment',
      icon: Clock,
      tone: 'warning' as const,
      onClick: () => onNavigateTab('operations', { status: 'Received' }),
    },
    {
      label: 'In Progress',
      value: inProgressTasks.length,
      note: 'Field action active',
      icon: Layers,
      tone: 'info' as const,
      onClick: () => onNavigateTab('operations', { status: 'In Progress' }),
    },
    {
      label: 'Completed Today',
      value: completedToday.length,
      note: 'Closed shifts & runs',
      icon: CheckCircle2,
      tone: 'success' as const,
      onClick: () => onNavigateTab('operations', { status: 'Completed' }),
    },
    {
      label: 'Overdue / Breaches',
      value: overdueTasks.length,
      note: overdueTasks.length > 0 ? 'Requires immediate action' : 'All SLAs nominal',
      icon: AlertTriangle,
      tone: overdueTasks.length > 0 ? ('danger' as const) : ('success' as const),
      onClick: () => onNavigateTab('operations', { priority: 'critical' }),
    },
    {
      label: 'Critical Escalations',
      value: criticalEscalations.length + complaints.filter((c) => !c.compApplied && c.comp > 0).length,
      note: `${complaints.length} guest complaints`,
      icon: Siren,
      tone: 'danger' as const,
      onClick: () => onNavigateTab('escalations'),
    },
    {
      label: 'Available Staff',
      value: availableStaff.length,
      note: `of ${fulfillers.length} active field team`,
      icon: Users,
      tone: 'success' as const,
      onClick: () => onNavigateTab('workforce'),
    },
    {
      label: 'Depts Near Capacity',
      value: deptsNeedingAttention,
      note: deptsNeedingAttention > 0 ? 'High queue saturation' : 'Workload balanced',
      icon: AlertOctagon,
      tone: deptsNeedingAttention > 0 ? ('warning' as const) : ('success' as const),
      onClick: () => onNavigateTab('workforce'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 8 Summary KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          const isDanger = k.tone === 'danger';
          const isWarn = k.tone === 'warning';
          const isSuccess = k.tone === 'success';

          return (
            <button
              key={k.label}
              type="button"
              onClick={k.onClick}
              className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 shadow-sm group ${
                isDanger
                  ? 'border-rose-500/30 bg-rose-500/[0.06] hover:bg-rose-500/10'
                  : isWarn
                  ? 'border-amber-400/30 bg-amber-400/[0.06] hover:bg-amber-400/10'
                  : isSuccess
                  ? 'border-emerald-500/30 bg-emerald-500/[0.06] hover:bg-emerald-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-mist-300 truncate">{k.label}</span>
                <span
                  className={`grid h-7 w-7 place-items-center rounded-lg ${
                    isDanger
                      ? 'bg-rose-500/20 text-rose-300'
                      : isWarn
                      ? 'bg-amber-400/20 text-amber-300'
                      : isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-mist-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-white">{k.value}</p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-mist-400">
                <span className="truncate">{k.note}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-mist-300" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Overview Panels: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Department Workload & Floor Distribution (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Department Workload Distribution */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-300">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Department Workload Saturation</h3>
                  <p className="text-xs text-mist-400">Active tasks vs. configured department staff capacity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('workforce')}
                className="text-xs text-purple-300 hover:text-purple-200 font-semibold"
              >
                View Roster →
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{dept.name}</span>
                      <span className="text-[10px] text-mist-400">({dept.staffCount} staff)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-mist-200">
                        {dept.activeCount} active tasks
                      </span>
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          dept.saturation >= 80
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : dept.saturation >= 60
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {dept.saturation}% saturation
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.saturation >= 80 ? 'bg-rose-500' : dept.saturation >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${dept.saturation}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tasks by Floor */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Guest Floor Operations Distribution</h3>
                  <p className="text-xs text-mist-400">Active tasks mapped across Levels 1 through 5</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 pt-2">
              {[1, 2, 3, 4, 5].map((floor) => {
                const count = floorStats[floor] || 0;
                return (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => onNavigateTab('operations')}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] transition text-center space-y-1"
                  >
                    <span className="text-[10px] font-bold uppercase text-mist-400 block">Level {floor}</span>
                    <span
                      className={`text-2xl font-bold font-mono block ${
                        count > 3 ? 'text-amber-300' : count > 0 ? 'text-white' : 'text-mist-500'
                      }`}
                    >
                      {count}
                    </span>
                    <span className="text-[10px] text-mist-400 block">{count === 1 ? 'task' : 'tasks'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Urgent Escalations & Recent Operational Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Urgent Issues & Escalations Ticker */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-300">
                  <Siren className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Active Operational Escalations</h3>
                  <p className="text-xs text-mist-400">Cases requiring Duty Manager oversight & approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('escalations')}
                className="text-xs text-rose-300 hover:text-rose-200 font-semibold"
              >
                All Cases ({criticalEscalations.length + complaints.length}) →
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {criticalEscalations.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab('escalations')}
                  className="p-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08] transition cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-200 truncate">{item.title}</span>
                    <span className="rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5">
                      {item.chip || 'Escalated'}
                    </span>
                  </div>
                  <p className="text-[11px] text-mist-300 line-clamp-2">{item.meta || item.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-mist-400 font-mono">
                    <span>{item.room ? `Room ${item.room}` : 'Property-wide'}</span>
                    <span>{item.amount ? `Comp req: ₹${item.amount.toLocaleString('en-IN')}` : 'Action required'}</span>
                  </div>
                </div>
              ))}

              {incidents.slice(0, 1).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onNavigateTab('duty-ops')}
                  className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] transition cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-200 truncate">{inc.title}</span>
                    <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 uppercase">
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-mist-300 line-clamp-2">{inc.affectedArea}</p>
                  <div className="flex items-center justify-between text-[10px] text-mist-400 font-mono">
                    <span>Ref: {inc.ref}</span>
                    <span>Coordinator: {inc.coordinator.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Operations Actions Strip */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Managerial Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('handover')}
                className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition font-semibold text-left text-mist-200 hover:text-white"
              >
                📋 Submit Shift Briefing
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('resources')}
                className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition font-semibold text-left text-mist-200 hover:text-white"
              >
                📦 Review Resource Reqs
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('duty-ops')}
                className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition font-semibold text-left text-mist-200 hover:text-white"
              >
                🛡️ Incident Operations
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition font-semibold text-left text-mist-200 hover:text-white"
              >
                📊 Analytics & CSV Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
