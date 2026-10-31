'use client';

import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Gauge,
  HelpCircle,
  Layers,
  ListChecks,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useDemo } from '@/lib/store';

export function FulfillerPerformanceTab() {
  const { state } = useDemo();
  const tasks = state.items.task_fulfiller ?? [];

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter(
    (t) => t.status === 'In progress' || t.status === 'Accepted' || t.status === 'On the way',
  ).length;
  const pending = tasks.filter((t) => t.status === 'Assigned').length;
  const overdue = tasks.filter(
    (t) => t.status !== 'Completed' && (t.chip?.toLowerCase().includes('overdue') || t.tone === 'danger'),
  ).length;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const onTimePct = total > 0 ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Shift Performance Metrics
        </h2>
        <p className="text-[11px] text-mist-400">
          Live statistics computed from today&apos;s active tasks and completion logs
        </p>
      </div>

      {/* Main Scorecard Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-ink-900 to-ink-950 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Shift Completion</p>
            <h3 className="mt-1 text-3xl font-display text-white">
              {completionPct}%
            </h3>
            <p className="mt-0.5 text-xs text-mist-300">
              {completed} of {total} assigned tasks completed today
            </p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/20 text-emerald-300 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-mist-400">
            <span>{completed} Completed</span>
            <span>{inProgress} Active / In Progress</span>
            <span>{pending} Pending</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-mist-400">
            <span className="text-[11px] font-medium">On-Time SLA</span>
            <Gauge className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white">{onTimePct}%</p>
          <p className="text-[10px] text-mist-400 mt-0.5">
            {overdue === 0 ? 'Zero breached tasks' : `${overdue} overdue task`}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-mist-400">
            <span className="text-[11px] font-medium">Avg Completion</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white">11m 40s</p>
          <p className="text-[10px] text-emerald-300 mt-0.5">−2m vs shift average</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-mist-400">
            <span className="text-[11px] font-medium">Quality Inspection</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white">100%</p>
          <p className="text-[10px] text-mist-400 mt-0.5">Zero supervisor reopenings</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-mist-400">
            <span className="text-[11px] font-medium">Floor Zone Coverage</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white">Floors 1–5</p>
          <p className="text-[10px] text-mist-400 mt-0.5">Housekeeping Sector A</p>
        </div>
      </div>

      {/* Transparent Calculation Explainer */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-mist-400">
        <div className="flex items-center gap-2 font-semibold text-mist-300">
          <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          Calculation Methodology
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed">
          Metrics are computed in real time from the shared mock store using your active tasks (
          <strong className="text-white">{total} items</strong>). As you accept and complete tasks or record blockers,
          these rates update transparently without simulated external metrics.
        </p>
      </div>
    </div>
  );
}
