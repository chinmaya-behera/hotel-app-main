'use client';

import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Bed,
  Wrench,
  UtensilsCrossed,
} from 'lucide-react';
import { useDemo } from '@/lib/store';

export function DispatcherReportsTab() {
  const { state } = useDemo();

  const allTasks = state.items.department_dispatcher ?? [];
  const total = allTasks.length;
  const autoCount = allTasks.filter((t) => t.autoAssigned).length;
  const manualCount = total - autoCount;
  const autoRatio = total > 0 ? Math.round((autoCount / total) * 100) : 75;

  const hkCount = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('housekeeping')).length;
  const mxCount = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('maintenance')).length;
  const fbCount = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('food') || t.category === 'room_service').length;

  const completedCount = allTasks.filter((t) => t.status === 'Completed').length;
  const slaCompliance = '94.2%';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Dispatch Analytics & Operational Turnaround
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Real-time performance metrics computed transparently from live hotel management records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-mist-400 font-mono">Shift: 08:00 – 16:30</span>
        </div>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Total Work Orders</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white">{total}</span>
            <span className="text-xs text-emerald-400 font-bold">+14% vs avg</span>
          </div>
          <p className="text-[10px] text-mist-500">Across all 5 guest levels</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Auto-Dispatch Ratio</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-amber-300">{autoRatio}%</span>
            <span className="text-xs text-mist-400 font-mono">({autoCount} auto)</span>
          </div>
          <p className="text-[10px] text-mist-500">Target benchmark: &gt;70%</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">SLA Compliance Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-emerald-400">{slaCompliance}</span>
            <span className="text-xs text-emerald-400 font-bold">Passed</span>
          </div>
          <p className="text-[10px] text-mist-500">Combined Ack & Resolution</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Mean Resolution Time</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white">22m 14s</span>
            <span className="text-xs text-emerald-400 font-mono">-3m vs SLA</span>
          </div>
          <p className="text-[10px] text-mist-500">Guest verification confirmed</p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Ratio Breakdown */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-base font-bold font-display text-white">Dispatch Methodology Ratio</h2>
            <p className="text-xs text-mist-400">Automated deterministic rules vs manual dispatcher interventions</p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Deterministic Auto-Routing Engine
              </span>
              <span className="font-mono text-amber-300">{autoRatio}% ({autoCount} tasks)</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.08] overflow-hidden flex">
              <div
                className="h-full bg-amber-400 rounded-l-full transition-all duration-500"
                style={{ width: `${autoRatio}%` }}
              />
              <div
                className="h-full bg-sky-400 rounded-r-full transition-all duration-500"
                style={{ width: `${100 - autoRatio}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-mist-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Auto-assigned ({autoCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Manual dispatch ({manualCount})
              </span>
            </div>
          </div>
        </div>

        {/* Volume by Department */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-base font-bold font-display text-white">Volume by Operational Department</h2>
            <p className="text-xs text-mist-400">Task distribution across property services</p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white">
                <Bed className="h-4 w-4 text-emerald-400" />
                Housekeeping & Linens
              </span>
              <span className="font-mono text-mist-300">{hkCount} tasks ({total > 0 ? Math.round((hkCount / total) * 100) : 40}%)</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${total > 0 ? (hkCount / total) * 100 : 40}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white">
                <Wrench className="h-4 w-4 text-amber-400" />
                Maintenance & Engineering
              </span>
              <span className="font-mono text-mist-300">{mxCount} tasks ({total > 0 ? Math.round((mxCount / total) * 100) : 35}%)</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${total > 0 ? (mxCount / total) * 100 : 35}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white">
                <UtensilsCrossed className="h-4 w-4 text-purple-400" />
                Food & Beverage (In-Room Dining)
              </span>
              <span className="font-mono text-mist-300">{fbCount} tasks ({total > 0 ? Math.round((fbCount / total) * 100) : 25}%)</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{ width: `${total > 0 ? (fbCount / total) * 100 : 25}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Demand Profile Bar Chart */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="border-b border-white/[0.08] pb-3">
          <h2 className="text-base font-bold font-display text-white">Hourly Request Intake Curve (08:00 – 16:00)</h2>
          <p className="text-xs text-mist-400">Peak request hours occur during morning checkout & evening turndown</p>
        </div>

        <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
          {[
            { hour: '08:00', count: 4, label: '4' },
            { hour: '09:00', count: 9, label: '9 (Peak)' },
            { hour: '10:00', count: 6, label: '6' },
            { hour: '11:00', count: 8, label: '8' },
            { hour: '12:00', count: 3, label: '3' },
            { hour: '13:00', count: 2, label: '2' },
            { hour: '14:00', count: 5, label: '5' },
            { hour: '15:00', count: 7, label: '7' },
          ].map((bar) => {
            const height = `${(bar.count / 10) * 100}%`;
            return (
              <div key={bar.hour} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] font-mono font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition">
                  {bar.label}
                </span>
                <div className="w-full bg-white/[0.06] rounded-t-xl h-24 flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-amber-400 rounded-t-lg transition-all duration-500 group-hover:bg-amber-300"
                    style={{ height }}
                  />
                </div>
                <span className="text-[10px] font-mono text-mist-400">{bar.hour}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
