'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  FileCheck2,
  Filter,
  Flame,
  Layers,
  MessageSquareWarning,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Stamp,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, IncidentRecord, ComplaintCase } from '@/types/demo';

interface ExecutiveOverviewTabProps {
  permissionMode: 'viewer' | 'approver';
  onNavigateTab: (tabId: string, filter?: Record<string, string>) => void;
  onOpenApprovalDetail?: (item: WorkItem) => void;
}

export function ExecutiveOverviewTab({
  permissionMode,
  onNavigateTab,
  onOpenApprovalDetail,
}: ExecutiveOverviewTabProps) {
  const { state } = useDemo();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'ytd'>('today');

  // Executive pending approvals
  const executiveItems = state.items.executive_viewer ?? [];
  const pendingApprovals = executiveItems.filter((i) => i.status === 'Needs approval');
  const approvedItems = executiveItems.filter((i) => i.status === 'Approved');
  const rejectedItems = executiveItems.filter((i) => i.status === 'Rejected');

  // Incidents
  const incidents = state.incidents ?? [];
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalIncidents = activeIncidents.filter(
    (i) => i.severity === 'critical' || i.severity === 'major',
  );

  // Complaints
  const complaints = state.frontDesk.complaints ?? [];
  const unresolvedComplaints = complaints.filter((c) => !c.compApplied);

  // High priority requests across departments
  const allTasks: WorkItem[] = useMemo(() => {
    const list: WorkItem[] = [];
    const roles = ['task_fulfiller', 'department_dispatcher', 'department_manager', 'front_desk_coordinator'] as const;
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

  const highPriorityTasks = allTasks.filter(
    (t) => t.priority === 'critical' || t.priority === 'vip' || t.priority === 'urgent',
  );

  // Financial values
  const totalCapexPending = pendingApprovals.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalApprovedMTD = approvedItems.reduce((acc, curr) => acc + (curr.amount || 0), 0) + 141000;

  // Department health dataset
  const departmentMetrics = useMemo(() => {
    return [
      {
        id: 'maintenance',
        name: 'Maintenance & Engineering',
        icon: Wrench,
        head: 'James Chen',
        slaPercent: 91.4,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('maintenance')).length || 7,
        openEscalations: incidents.filter((i) => i.department?.toLowerCase().includes('maintenance')).length,
        status: 'warning',
        trend: '+2.1%',
        spending: '₹1,13,000',
      },
      {
        id: 'housekeeping',
        name: 'Housekeeping & Rooms',
        icon: Layers,
        head: 'Oliver Reed',
        slaPercent: 96.8,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('housekeeping')).length || 14,
        openEscalations: 0,
        status: 'optimal',
        trend: '+0.8%',
        spending: '₹35,000',
      },
      {
        id: 'front_office',
        name: 'Front Office & Stays',
        icon: Building2,
        head: 'Emma Wilson',
        slaPercent: 95.2,
        activeTasks: state.frontDesk.stays.filter((s) => s.status === 'in_house').length,
        openEscalations: unresolvedComplaints.length,
        status: 'optimal',
        trend: '+1.4%',
        spending: '₹28,000',
      },
      {
        id: 'food_beverage',
        name: 'Food & Beverage / In-Room',
        icon: Sparkles,
        head: 'Kabir Sen',
        slaPercent: 94.0,
        activeTasks: allTasks.filter((t) => t.department?.toLowerCase().includes('beverage') || t.department?.toLowerCase().includes('f&b')).length || 5,
        openEscalations: 0,
        status: 'optimal',
        trend: '-0.5%',
        spending: '₹35,000',
      },
      {
        id: 'spa_wellness',
        name: 'Spa & Wellness',
        icon: Star,
        head: 'T. Brandt',
        slaPercent: 98.5,
        activeTasks: 3,
        openEscalations: 0,
        status: 'optimal',
        trend: '+0.3%',
        spending: '₹12,500',
      },
      {
        id: 'security',
        name: 'Safety & Security',
        icon: ShieldAlert,
        head: 'Lucas Martin',
        slaPercent: 97.1,
        activeTasks: (state.items.security_responder ?? []).filter((s) => s.status !== 'Resolved').length || 2,
        openEscalations: 1,
        status: 'optimal',
        trend: '0.0%',
        spending: '₹18,000',
      },
    ];
  }, [allTasks, incidents, state.frontDesk.stays, unresolvedComplaints.length, state.items.security_responder]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Timeframe & Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-white/5 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-300 grid place-items-center border border-amber-500/30">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-navy-950 dark:text-white">
                Executive Operations Command
              </h2>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  permissionMode === 'approver'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
                }`}
              >
                {permissionMode === 'approver' ? 'Approver Authority' : 'Viewer Audit Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-mist-400">
              Live property metrics, SLA benchmarks, and beyond-manager approval authorizations.
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-black/5 dark:bg-ink-950/80">
          {(['today', 'week', 'month', 'ytd'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                timeframe === t
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              {t === 'today' ? 'Today' : t === 'week' ? '7 Days' : t === 'month' ? '30 Days' : 'YTD'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Departments */}
        <button
          type="button"
          onClick={() => onNavigateTab('performance')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Departments</span>
            <Building2 className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">6</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
            <ShieldCheck className="h-3 w-3" /> All active on-grid
          </div>
        </button>

        {/* KPI 2: Overall Operational SLA */}
        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Property SLA</span>
            <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">95.4%</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
            <ArrowUpRight className="h-3 w-3" /> +1.2% vs target (94%)
          </div>
        </button>

        {/* KPI 3: Pending Approvals */}
        <button
          type="button"
          onClick={() => onNavigateTab('approvals-pending')}
          className={`text-left p-4 rounded-3xl border transition group shadow-md hover:shadow-xl ${
            pendingApprovals.length > 0
              ? 'border-amber-500/40 bg-amber-500/[0.08]'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <Stamp className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-navy-950 dark:text-white">
              {pendingApprovals.length}
            </div>
            <span className="text-xs font-bold text-amber-500">
              ₹{(totalCapexPending / 1000).toFixed(0)}k req
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {pendingApprovals.length > 0 ? 'Requires executive sign-off' : 'All decisions cleared'}
          </div>
        </button>

        {/* KPI 4: High Priority Tasks */}
        <button
          type="button"
          onClick={() => onNavigateTab('escalations')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-purple-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">High Priority</span>
            <Flame className="h-4 w-4 text-purple-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {highPriorityTasks.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            <Clock className="h-3 w-3" /> VIP & Critical tracked
          </div>
        </button>

        {/* KPI 5: Critical Incidents */}
        <button
          type="button"
          onClick={() => onNavigateTab('incidents')}
          className={`text-left p-4 rounded-3xl border transition group shadow-md hover:shadow-xl ${
            criticalIncidents.length > 0
              ? 'border-rose-500/40 bg-rose-500/[0.08]'
              : 'border-white/10 bg-white/70 dark:bg-ink-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Incidents</span>
            <ShieldAlert className="h-4 w-4 text-rose-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {criticalIncidents.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
            {criticalIncidents.length > 0 ? 'Water seepage & lift fault' : 'No critical alerts'}
          </div>
        </button>

        {/* KPI 6: Unresolved Guest Complaints */}
        <button
          type="button"
          onClick={() => onNavigateTab('complaints')}
          className="text-left p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-2">
            <span className="text-xs font-medium">Guest Recovery</span>
            <MessageSquareWarning className="h-4 w-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {unresolvedComplaints.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {unresolvedComplaints.length > 0 ? 'VIP 518 Noise comp pending' : 'Zero outstanding'}
          </div>
        </button>
      </div>

      {/* Main Grid: Interactive Analytics + Operational Attention Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Department Performance & Throughput Charts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Performance Comparison Card */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Department Operational Pulse & SLA Benchmarks
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Real-time SLA adherence across all six operating units. Click a department to inspect.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('performance')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Inspect All <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Department Progress Bars */}
            <div className="space-y-3.5">
              {departmentMetrics.map((dept) => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.id}
                    onClick={() => onNavigateTab('performance', { department: dept.name })}
                    className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-white/10 hover:border-amber-500/30 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-xl bg-white/10 dark:bg-white/5 grid place-items-center text-navy-950 dark:text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-navy-950 dark:text-white">
                            {dept.name}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-mist-500 ml-2">
                            Lead: {dept.head} · {dept.activeTasks} open tasks
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-navy-950 dark:text-white">
                          {dept.slaPercent}%
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dept.slaPercent >= 95
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {dept.slaPercent >= 95 ? 'Target Met' : 'Attention'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-200 dark:bg-ink-950 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dept.slaPercent >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${dept.slaPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Charts Grid: Throughput & Capex Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Approval Decisions Trend */}
            <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-400" />
                  Executive Decision Volume
                </h4>
                <span className="text-xs font-mono text-slate-400 dark:text-mist-400">
                  Total: {executiveItems.length}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-300">
                    {pendingApprovals.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                    Pending
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-300">
                    {approvedItems.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-300/70 mt-0.5">
                    Authorized
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-xl font-black text-rose-600 dark:text-rose-300">
                    {rejectedItems.length}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-rose-600/80 dark:text-rose-300/70 mt-0.5">
                    Declined
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-slate-500 dark:text-mist-400 flex items-center justify-between">
                <span>Avg Decision Latency</span>
                <span className="font-mono font-bold text-navy-950 dark:text-white">
                  1.4 hours
                </span>
              </div>
            </div>

            {/* Financial Delegation Meter */}
            <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  Executive Financial Ceiling
                </h4>
                <span className="text-xs font-mono text-emerald-500 font-bold">
                  Limit: ₹2,00,000
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-mist-400">Month-to-Date Committed</span>
                  <span className="font-mono font-bold text-navy-950 dark:text-white">
                    ₹{totalApprovedMTD.toLocaleString('en-IN')} (70.5%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-ink-950 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                    style={{ width: '70.5%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-mist-500 mt-1.5">
                  <span>Duty Mgr Limit: ₹16,000</span>
                  <span>Remaining Room: ₹59,000</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                Any capex requisition exceeding ₹2,00,000 routes automatically to the Board of Directors.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Attention Panel (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-rose-500" />
                  Operational Attention Queue
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Critical items awaiting executive action or escalation review.
                </p>
              </div>
            </div>

            {/* Attention Items List */}
            <div className="space-y-3">
              {/* Item 1: Goodwill Comp Room 402 */}
              {executiveItems.find((i) => i.id === 'exe-1') && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] hover:bg-amber-500/[0.1] transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      Approval Over Limit
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-500">₹28,000</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy-950 dark:text-white">
                      Goodwill Credit · Room 402
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                      Duty Manager Isabella Scott escalated beyond ₹16,000 threshold following AC leak water damage.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 dark:text-mist-500">Ref: EX-2026-001</span>
                    <button
                      type="button"
                      onClick={() => {
                        const item = executiveItems.find((i) => i.id === 'exe-1');
                        if (item && onOpenApprovalDetail) onOpenApprovalDetail(item);
                        else onNavigateTab('approvals');
                      }}
                      className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      Review Requisition <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Item 2: Otis Lift 2 Controller Capex */}
              {executiveItems.find((i) => i.id === 'exe-3') && (
                <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] hover:bg-purple-500/[0.1] transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
                      Capex Authorization
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-500">₹48,000</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy-950 dark:text-white">
                      Freight Lift #2 Controller Board
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                      Otis contractor proposal for logic board replacement. Core service elevator down.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 dark:text-mist-500">Engineering · Quote Valid 14d</span>
                    <button
                      type="button"
                      onClick={() => {
                        const item = executiveItems.find((i) => i.id === 'exe-3');
                        if (item && onOpenApprovalDetail) onOpenApprovalDetail(item);
                        else onNavigateTab('approvals');
                      }}
                      className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      Authorize Capex <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Item 3: Active Incident Seepage */}
              {incidents[0] && (
                <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] hover:bg-rose-500/[0.1] transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300">
                      Major Property Incident
                    </span>
                    <span className="text-xs font-mono text-rose-500 font-bold">{incidents[0].reportedAt}</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy-950 dark:text-white">
                      {incidents[0].title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                      {incidents[0].affectedArea} · Lead: {incidents[0].coordinator}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 dark:text-mist-500">Ref: {incidents[0].ref}</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('incidents')}
                      className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      Issue Directive <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Executive Shortcuts */}
          <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
              Executive Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition"
              >
                <div className="text-xs font-bold text-navy-950 dark:text-white">CSV Export</div>
                <div className="text-[10px] text-slate-500 dark:text-mist-400 mt-0.5">Turnaround & SLA</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition"
              >
                <div className="text-xs font-bold text-navy-950 dark:text-white">Audit Ledger</div>
                <div className="text-[10px] text-slate-500 dark:text-mist-400 mt-0.5">Immutable records</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
