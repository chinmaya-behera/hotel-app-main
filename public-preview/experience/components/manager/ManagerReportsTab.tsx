'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useDemo } from '@/lib/store';

interface ManagerReportsTabProps {
  scope: 'department' | 'hotel';
}

export function ManagerReportsTab({ scope }: ManagerReportsTabProps) {
  const { state } = useDemo();
  const [dateRange, setDateRange] = useState('today');
  const [deptFilter, setDeptFilter] = useState('all');

  // Collect all tasks
  const allTasks = useMemo(() => {
    const list: any[] = [];
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

  // Filter tasks based on selected department
  const filteredTasks = useMemo(() => {
    if (deptFilter === 'all') return allTasks;
    return allTasks.filter((t) => (t.department || '').toLowerCase().includes(deptFilter.toLowerCase()));
  }, [allTasks, deptFilter]);

  // Department report breakdown
  const departmentBreakdown = useMemo(() => {
    const depts = [
      { name: 'Housekeeping', code: 'HK' },
      { name: 'Maintenance & Engineering', code: 'MX' },
      { name: 'Food & Beverage', code: 'FB' },
      { name: 'Front Office', code: 'FO' },
      { name: 'Safety & Security', code: 'SEC' },
    ];

    return depts.map((d) => {
      const deptTasks = allTasks.filter((t) => (t.department || '').toLowerCase().includes(d.name.toLowerCase().split(' ')[0]));
      const total = deptTasks.length;
      const completed = deptTasks.filter((t) => t.status === 'Completed').length;
      const active = deptTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length;
      const breaches = deptTasks.filter((t) => t.chip?.toLowerCase().includes('breach') || t.tone === 'danger').length;
      const slaRate = total > 0 ? Math.round(((total - breaches) / total) * 100) : 100;
      const avgResponse = '4m 12s';
      const avgResolution = '18m 45s';

      return {
        ...d,
        total,
        completed,
        active,
        breaches,
        slaRate,
        avgResponse,
        avgResolution,
      };
    });
  }, [allTasks]);

  // Overall KPIs
  const totalTasks = filteredTasks.length;
  const completedCount = filteredTasks.filter((t) => t.status === 'Completed').length;
  const breachedCount = filteredTasks.filter((t) => t.chip?.toLowerCase().includes('breach') || t.tone === 'danger').length;
  const overallSla = totalTasks > 0 ? Math.round(((totalTasks - breachedCount) / totalTasks) * 100) : 95;

  // Floor Breakdown
  const floorBreakdown = useMemo(() => {
    const floors = [1, 2, 3, 4, 5];
    return floors.map((fl) => {
      const flTasks = filteredTasks.filter((t) => {
        const floorNo = t.floor || (t.room ? parseInt(t.room[0], 10) : undefined);
        return floorNo === fl;
      });
      const completed = flTasks.filter((t) => t.status === 'Completed').length;
      const active = flTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length;

      return {
        floor: fl,
        total: flTasks.length,
        completed,
        active,
      };
    });
  }, [filteredTasks]);

  // CSV Export Functionality (Native browser, zero dependencies)
  const handleExportCsv = () => {
    const headers = ['Department', 'Code', 'Total Tasks', 'Active', 'Completed', 'SLA Breaches', 'SLA Compliance %', 'Avg Response Time', 'Avg Resolution Time'];
    const rows = departmentBreakdown.map((d) => [
      `"${d.name}"`,
      d.code,
      d.total,
      d.active,
      d.completed,
      d.breaches,
      `${d.slaRate}%`,
      d.avgResponse,
      d.avgResolution,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `the_grand_adp_operations_report_${dateRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Operations Performance & SLA Analytics</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Department SLA metrics, average turnaround times, floor operational load, and one-click CSV export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-mist-400" />
          <span className="text-mist-400 font-medium">Time Window:</span>
          {['today', 'yesterday', 'week', 'month'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded-xl border font-semibold transition capitalize ${
                dateRange === range
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
              }`}
            >
              {range === 'today' ? 'Today (Active)' : range}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-mist-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950 text-white">All Departments</option>
            <option value="housekeeping" className="bg-ink-950 text-white">Housekeeping</option>
            <option value="maintenance" className="bg-ink-950 text-white">Maintenance & Eng</option>
            <option value="food" className="bg-ink-950 text-white">Food & Beverage</option>
            <option value="front" className="bg-ink-950 text-white">Front Office</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Total Filtered Tasks</span>
          <p className="text-2xl font-bold font-mono text-white">{totalTasks}</p>
          <span className="text-[11px] text-mist-400">{completedCount} fulfilled today</span>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Overall SLA Compliance</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">{overallSla}%</p>
          <span className="text-[11px] text-mist-400">{breachedCount} delayed or breached</span>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Avg First Response</span>
          <p className="text-2xl font-bold font-mono text-sky-300">4m 12s</p>
          <span className="text-[11px] text-mist-400">Target SLA: &lt; 5m 00s</span>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Avg Resolution Time</span>
          <p className="text-2xl font-bold font-mono text-amber-300">18m 45s</p>
          <span className="text-[11px] text-mist-400">Target SLA: &lt; 25m 00s</span>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Department SLA & Turnaround Performance</h3>
          <span className="text-xs text-mist-400 font-mono">Dataset Synced Live</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 pl-6 pr-3">Department</th>
                <th className="px-3 py-3">Total Tasks</th>
                <th className="px-3 py-3">Active Queue</th>
                <th className="px-3 py-3">Completed</th>
                <th className="px-3 py-3">SLA Breaches</th>
                <th className="px-3 py-3">Compliance Rate</th>
                <th className="px-3 py-3">Avg Response</th>
                <th className="py-3 pl-3 pr-6">Avg Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {departmentBreakdown.map((d) => (
                <tr key={d.name} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 pl-6 pr-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                        {d.code}
                      </span>
                      <span>{d.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-white">{d.total}</td>
                  <td className="px-3 py-3.5 font-mono text-mist-200">{d.active}</td>
                  <td className="px-3 py-3.5 font-mono text-emerald-300 font-semibold">{d.completed}</td>
                  <td className="px-3 py-3.5 font-mono text-rose-400 font-semibold">{d.breaches}</td>
                  <td className="px-3 py-3.5 font-mono">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        d.slaRate >= 90
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : d.slaRate >= 75
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {d.slaRate}%
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-mist-300">{d.avgResponse}</td>
                  <td className="py-3.5 pl-3 pr-6 font-mono text-mist-300">{d.avgResolution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floor by Floor Distribution Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <h3 className="font-bold text-sm text-white">Operational Load by Guest Floors (Levels 1–5)</h3>
        <div className="grid grid-cols-5 gap-3">
          {floorBreakdown.map((f) => (
            <div key={f.floor} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-mist-400 block">Level {f.floor}</span>
              <span className="text-xl font-bold font-mono text-white block">{f.total} Tasks</span>
              <div className="flex items-center justify-center gap-2 text-[10px] text-mist-400 font-mono">
                <span className="text-emerald-400">{f.completed} Done</span>
                <span>·</span>
                <span className="text-amber-300">{f.active} Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
