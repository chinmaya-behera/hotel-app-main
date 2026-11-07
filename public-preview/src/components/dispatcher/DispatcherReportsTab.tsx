'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Bed,
  Wrench,
  UtensilsCrossed,
  Droplets,
  Zap,
  Key,
  Coffee,
  User,
  Building2,
  ShieldCheck,
  Calendar,
  Timer,
  ChevronDown,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, DispatcherDepartment } from '@/types/demo';

export type AnalyticsTimeframe = 'per_day' | 'per_week' | 'per_month';

export interface DispatcherReportsTabProps {
  department?: DispatcherDepartment;
  tasks?: WorkItem[];
}

export function DispatcherReportsTab({ department, tasks }: DispatcherReportsTabProps = {}) {
  const { state } = useDemo();

  const currentDept: DispatcherDepartment = department || state.activeDispatcherDept || 'Housekeeping';

  // Timeframe state: per_day | per_week | per_month
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('per_day');

  // Fallback task filtering if tasks prop not provided
  const deptTasks = useMemo(() => {
    if (tasks && tasks.length > 0) return tasks;

    const rawAllTasks = [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

    return rawAllTasks.filter((t) => {
      const deptStr = (t.department || '').toLowerCase();
      const catStr = (t.category || '').toLowerCase();
      if (currentDept === 'Housekeeping') {
        return deptStr.includes('housekeeping') || ['housekeeping', 'lost_found', 'turnover', 'linen'].includes(catStr);
      }
      if (currentDept === 'Wellness') {
        return deptStr.includes('spa') || deptStr.includes('wellness') || ['spa', 'wellness', 'massage', 'hydrotherapy'].includes(catStr);
      }
      if (currentDept === 'Maintenance & Engineering') {
        return deptStr.includes('maintenance') || deptStr.includes('engineering') || ['maintenance', 'hvac', 'plumbing', 'electrical', 'repair'].includes(catStr);
      }
      if (currentDept === 'Food & Beverages') {
        return deptStr.includes('food') || deptStr.includes('beverage') || deptStr.includes('f&b') || ['room_service', 'dining', 'fnb', 'kitchen', 'restaurant', 'bar'].includes(catStr);
      }
      return true;
    });
  }, [tasks, state.items, currentDept]);

  // Multiplier and label based on selected timeframe
  const timeframeConfig = useMemo(() => {
    if (timeframe === 'per_week') {
      return {
        multiplier: 7.2,
        label: 'Last 7 Days',
        subtext: 'Weekly Aggregate (Last 7 Days)',
        periodLabel: 'Last 7 Days',
      };
    }
    if (timeframe === 'per_month') {
      return {
        multiplier: 31.5,
        label: 'Month',
        subtext: 'Monthly Aggregate (Last 30 Days)',
        periodLabel: 'Month',
      };
    }
    return {
      multiplier: 1,
      label: 'Today',
      subtext: 'Daily Cycle (Today)',
      periodLabel: 'Today (08:00 – 16:30)',
    };
  }, [timeframe]);

  // Dynamic calculations adjusted for timeframe
  const rawTotal = deptTasks.length || 14;
  const total = Math.round(rawTotal * timeframeConfig.multiplier);

  const rawAuto = deptTasks.filter((t) => t.autoAssigned).length || Math.round(rawTotal * 0.72);
  const autoRatio = rawTotal > 0 ? Math.round((rawAuto / rawTotal) * 100) : 72;
  const autoCount = Math.round(total * (autoRatio / 100));
  const manualCount = total - autoCount;

  const completedCount = Math.round(total * 0.78);
  const inProgressCount = Math.round(total * 0.16);
  const pendingCount = Math.max(0, total - completedCount - inProgressCount);

  // Department and Timeframe-specific SLA metrics (including Avg SLA values)
  const slaMetrics = useMemo(() => {
    if (timeframe === 'per_week') {
      if (currentDept === 'Housekeeping') {
        return {
          avgSla: '23m 15s',
          mtta: '3m 45s',
          mttr: '23m 15s',
          compliance: '95.8%',
          meanTime: '23m 15s',
          variance: '-6m vs SLA',
          slaStatus: 'Met SLA Target (<= 30m)',
        };
      }
      if (currentDept === 'Maintenance & Engineering') {
        return {
          avgSla: '19m 30s',
          mtta: '4m 10s',
          mttr: '19m 30s',
          compliance: '94.2%',
          meanTime: '19m 30s',
          variance: '-5m vs SLA',
          slaStatus: 'Met SLA Target (<= 25m)',
        };
      }
      if (currentDept === 'Food & Beverages') {
        return {
          avgSla: '22m 10s',
          mtta: '3m 15s',
          mttr: '22m 10s',
          compliance: '96.5%',
          meanTime: '22m 10s',
          variance: '-8m vs SLA',
          slaStatus: 'Met SLA Target (<= 30m)',
        };
      }
      return {
        avgSla: '17m 20s',
        mtta: '2m 50s',
        mttr: '17m 20s',
        compliance: '97.8%',
        meanTime: '17m 20s',
        variance: '-8m vs SLA',
        slaStatus: 'Met SLA Target (<= 25m)',
      };
    }

    if (timeframe === 'per_month') {
      if (currentDept === 'Housekeeping') {
        return {
          avgSla: '24m 40s',
          mtta: '4m 05s',
          mttr: '24m 40s',
          compliance: '95.1%',
          meanTime: '24m 40s',
          variance: '-5m vs SLA',
          slaStatus: 'Met SLA Target (<= 30m)',
        };
      }
      if (currentDept === 'Maintenance & Engineering') {
        return {
          avgSla: '20m 15s',
          mtta: '4m 25s',
          mttr: '20m 15s',
          compliance: '93.5%',
          meanTime: '20m 15s',
          variance: '-5m vs SLA',
          slaStatus: 'Met SLA Target (<= 25m)',
        };
      }
      if (currentDept === 'Food & Beverages') {
        return {
          avgSla: '23m 05s',
          mtta: '3m 35s',
          mttr: '23m 05s',
          compliance: '95.9%',
          meanTime: '23m 05s',
          variance: '-7m vs SLA',
          slaStatus: 'Met SLA Target (<= 30m)',
        };
      }
      return {
        avgSla: '18m 05s',
        mtta: '3m 10s',
        mttr: '18m 05s',
        compliance: '97.2%',
        meanTime: '18m 05s',
        variance: '-7m vs SLA',
        slaStatus: 'Met SLA Target (<= 25m)',
      };
    }

    // Default: per_day
    if (currentDept === 'Housekeeping') {
      return {
        avgSla: '22m 10s',
        mtta: '3m 20s',
        mttr: '22m 10s',
        compliance: '96.8%',
        meanTime: '22m 10s',
        variance: '-8m vs SLA',
        slaStatus: 'Met SLA Target (<= 30m)',
      };
    }
    if (currentDept === 'Maintenance & Engineering') {
      return {
        avgSla: '18m 45s',
        mtta: '3m 50s',
        mttr: '18m 45s',
        compliance: '94.6%',
        meanTime: '18m 45s',
        variance: '-6m vs SLA',
        slaStatus: 'Met SLA Target (<= 25m)',
      };
    }
    if (currentDept === 'Food & Beverages') {
      return {
        avgSla: '21m 30s',
        mtta: '2m 55s',
        mttr: '21m 30s',
        compliance: '97.4%',
        meanTime: '21m 30s',
        variance: '-9m vs SLA',
        slaStatus: 'Met SLA Target (<= 30m)',
      };
    }
    return {
      avgSla: '16m 15s',
      mtta: '2m 30s',
      mttr: '16m 15s',
      compliance: '98.5%',
      meanTime: '16m 15s',
      variance: '-9m vs SLA',
      slaStatus: 'Met SLA Target (<= 25m)',
    };
  }, [timeframe, currentDept]);

  // Dynamic Service Category Breakdown strictly for current department scaled by timeframe
  const categoryBreakdown = useMemo(() => {
    if (currentDept === 'Housekeeping') {
      const base1 = Math.max(1, Math.round(total * 0.44));
      const base2 = Math.max(1, Math.round(total * 0.26));
      const base3 = Math.max(1, Math.round(total * 0.18));
      const base4 = Math.max(0, total - (base1 + base2 + base3));

      return [
        {
          id: 'hk-1',
          name: 'Departure Turnover & Deep Cleaning',
          count: base1,
          icon: Bed,
          color: 'text-emerald-400',
          bgBar: 'bg-emerald-400',
        },
        {
          id: 'hk-2',
          name: 'Stayover Refresh & Linen Replacement',
          count: base2,
          icon: Layers,
          color: 'text-sky-400',
          bgBar: 'bg-sky-400',
        },
        {
          id: 'hk-3',
          name: 'Guest In-Room Amenities & Essentials',
          count: base3,
          icon: Sparkles,
          color: 'text-amber-400',
          bgBar: 'bg-amber-400',
        },
        {
          id: 'hk-4',
          name: 'VIP Turndown & Quality Rework Sweeps',
          count: base4,
          icon: Clock,
          color: 'text-purple-400',
          bgBar: 'bg-purple-400',
        },
      ];
    }

    if (currentDept === 'Maintenance & Engineering') {
      const base1 = Math.max(1, Math.round(total * 0.38));
      const base2 = Math.max(1, Math.round(total * 0.28));
      const base3 = Math.max(1, Math.round(total * 0.20));
      const base4 = Math.max(0, total - (base1 + base2 + base3));

      return [
        {
          id: 'mx-1',
          name: 'HVAC & Climate Control Systems',
          count: base1,
          icon: Wrench,
          color: 'text-amber-400',
          bgBar: 'bg-amber-400',
        },
        {
          id: 'mx-2',
          name: 'Plumbing, Water Pressure & Fixtures',
          count: base2,
          icon: Droplets,
          color: 'text-sky-400',
          bgBar: 'bg-sky-400',
        },
        {
          id: 'mx-3',
          name: 'Electrical, Lighting & In-Room AV',
          count: base3,
          icon: Zap,
          color: 'text-yellow-400',
          bgBar: 'bg-yellow-400',
        },
        {
          id: 'mx-4',
          name: 'RFID Door Locks & BMS Hardware',
          count: base4,
          icon: Key,
          color: 'text-purple-400',
          bgBar: 'bg-purple-400',
        },
      ];
    }

    if (currentDept === 'Food & Beverages') {
      const base1 = Math.max(1, Math.round(total * 0.40));
      const base2 = Math.max(1, Math.round(total * 0.30));
      const base3 = Math.max(1, Math.round(total * 0.18));
      const base4 = Math.max(0, total - (base1 + base2 + base3));

      return [
        {
          id: 'fb-1',
          name: 'In-Room Breakfast & Express Orders',
          count: base1,
          icon: UtensilsCrossed,
          color: 'text-purple-400',
          bgBar: 'bg-purple-400',
        },
        {
          id: 'fb-2',
          name: 'Course Dining & Beverage Service',
          count: base2,
          icon: Coffee,
          color: 'text-amber-400',
          bgBar: 'bg-amber-400',
        },
        {
          id: 'fb-3',
          name: 'VIP Welcome Amenities & Platters',
          count: base3,
          icon: Sparkles,
          color: 'text-rose-400',
          bgBar: 'bg-rose-400',
        },
        {
          id: 'fb-4',
          name: 'Corridor Tray Clearance & Sweeps',
          count: base4,
          icon: Layers,
          color: 'text-sky-400',
          bgBar: 'bg-sky-400',
        },
      ];
    }

    // Wellness
    const base1 = Math.max(1, Math.round(total * 0.42));
    const base2 = Math.max(1, Math.round(total * 0.26));
    const base3 = Math.max(1, Math.round(total * 0.18));
    const base4 = Math.max(0, total - (base1 + base2 + base3));

    return [
      {
        id: 'wel-1',
        name: 'Ayurvedic Massage & Body Therapies',
        count: base1,
        icon: Sparkles,
        color: 'text-emerald-400',
        bgBar: 'bg-emerald-400',
      },
      {
        id: 'wel-2',
        name: 'Private Beach Yoga & Meditation',
        count: base2,
        icon: User,
        color: 'text-sky-400',
        bgBar: 'bg-sky-400',
      },
      {
        id: 'wel-3',
        name: 'Hydrotherapy Circuit & Steam Safety',
        count: base3,
        icon: Droplets,
        color: 'text-cyan-400',
        bgBar: 'bg-cyan-400',
      },
      {
        id: 'wel-4',
        name: 'In-Room Wellness Amenity Drops',
        count: base4,
        icon: Layers,
        color: 'text-purple-400',
        bgBar: 'bg-purple-400',
      },
    ];
  }, [total, currentDept]);

  // Floor distribution scaled for timeframe
  const floorDistribution = useMemo(() => {
    const weights = [0.18, 0.24, 0.22, 0.20, 0.16];
    return weights.map((w, idx) => ({
      floor: idx + 1,
      count: Math.round(total * w),
    }));
  }, [total]);

  // Timeframe-sensitive demand intake chart data
  const chartData = useMemo(() => {
    if (timeframe === 'per_week') {
      return {
        title: `Daily Request Intake Trend (${currentDept} · Last 7 Days: Mon – Sun)`,
        subtitle: `Daily work order intake pattern strictly for ${currentDept} over the last 7 days`,
        bars: [
          { label: 'Mon', count: Math.round(total * 0.14), display: String(Math.round(total * 0.14)) },
          { label: 'Tue', count: Math.round(total * 0.16), display: String(Math.round(total * 0.16)) },
          { label: 'Wed', count: Math.round(total * 0.13), display: String(Math.round(total * 0.13)) },
          { label: 'Thu', count: Math.round(total * 0.15), display: String(Math.round(total * 0.15)) },
          { label: 'Fri', count: Math.round(total * 0.18), display: `${Math.round(total * 0.18)} (Peak)` },
          { label: 'Sat', count: Math.round(total * 0.14), display: String(Math.round(total * 0.14)) },
          { label: 'Sun', count: Math.round(total * 0.10), display: String(Math.round(total * 0.10)) },
        ],
      };
    }

    if (timeframe === 'per_month') {
      return {
        title: `Weekly Aggregated Intake Trend (${currentDept} · Month: 4 Weeks)`,
        subtitle: `Weekly work order cadence strictly for ${currentDept} across the last 30 days`,
        bars: [
          { label: 'Week 1', count: Math.round(total * 0.23), display: String(Math.round(total * 0.23)) },
          { label: 'Week 2', count: Math.round(total * 0.26), display: String(Math.round(total * 0.26)) },
          { label: 'Week 3', count: Math.round(total * 0.28), display: `${Math.round(total * 0.28)} (Peak)` },
          { label: 'Week 4', count: Math.round(total * 0.23), display: String(Math.round(total * 0.23)) },
        ],
      };
    }

    // per_day: Hourly curve
    return {
      title: `Hourly ${currentDept} Intake Curve (Today: 08:00 – 16:00)`,
      subtitle: `Hourly intake cadence and peak rush intervals strictly for ${currentDept} today`,
      bars: [
        { label: '08:00', count: 4, display: '4' },
        { label: '09:00', count: 9, display: '9 (Peak)' },
        { label: '10:00', count: 6, display: '6' },
        { label: '11:00', count: 8, display: '8' },
        { label: '12:00', count: 3, display: '3' },
        { label: '13:00', count: 2, display: '2' },
        { label: '14:00', count: 5, display: '5' },
        { label: '15:00', count: 7, display: '7' },
      ],
    };
  }, [timeframe, currentDept, total]);

  const maxChartCount = Math.max(...chartData.bars.map((b) => b.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner with Timeframe Dropdown */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              {currentDept} Operational Analytics
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {currentDept} Only
            </span>
          </div>
          <p className="text-xs text-mist-300">
            Performance metrics, average SLA turnaround, and service category volume computed strictly for <strong className="text-mist-200">{currentDept}</strong>.
          </p>
        </div>

        {/* Timeframe Controls (Dropdown & Pills) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown Selector */}
          <div className="flex items-center gap-2 bg-ink-950/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <label htmlFor="timeframe-dropdown" className="text-xs font-semibold text-mist-300 pl-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              <span>Interval:</span>
            </label>
            <div className="relative">
              <select
                id="timeframe-dropdown"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as AnalyticsTimeframe)}
                className="appearance-none rounded-xl border border-white/10 bg-ink-900 px-3.5 py-1.5 pr-8 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-md cursor-pointer hover:border-white/20 transition"
              >
                <option value="per_day">Today</option>
                <option value="per_week">Last 7 Days</option>
                <option value="per_month">Month</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-mist-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4-KPI CARD GRID: INCLUDING DEDICATED "AVG SLA" CARD                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Work Orders */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-mist-400">Total Work Orders</span>
            <span className="text-[10px] font-mono text-purple-300 font-semibold">{timeframeConfig.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white">{total}</span>
            <span className="text-xs text-emerald-400 font-bold">+12%</span>
          </div>
          <p className="text-[10px] text-mist-500">Strictly {currentDept}</p>
        </div>

        {/* 2. Auto-Dispatch Ratio */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-mist-400">Auto-Dispatch</span>
            <span className="text-[10px] font-mono text-amber-300 font-semibold">{timeframeConfig.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-amber-300">{autoRatio}%</span>
            <span className="text-xs text-mist-400 font-mono">({autoCount} auto)</span>
          </div>
          <p className="text-[10px] text-mist-500">Deterministic routing</p>
        </div>

        {/* 3. DEDICATED AVG SLA CARD */}
        <div className="rounded-3xl border border-purple-500/30 bg-purple-950/20 p-4 backdrop-blur-xl shadow-lg space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-purple-300 flex items-center gap-1">
              <Timer className="h-3 w-3 text-purple-400" />
              <span>Avg SLA Turnaround</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
              Compliant
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-white">{slaMetrics.avgSla}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">{slaMetrics.variance}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-mist-400 pt-0.5 border-t border-purple-500/20">
            <span>MTTA: <strong className="text-white">{slaMetrics.mtta}</strong></span>
            <span>MTTR: <strong className="text-white">{slaMetrics.mttr}</strong></span>
          </div>
        </div>

        {/* 4. SLA Compliance Rate */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-mist-400">SLA Compliance</span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">{timeframeConfig.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-emerald-400">{slaMetrics.compliance}</span>
            <span className="text-xs text-emerald-400 font-bold">Passed</span>
          </div>
          <p className="text-[10px] text-mist-500">Benchmark: &gt;90%</p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Ratio Breakdown */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-white">
                Dispatch Methodology ({currentDept})
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white/[0.04] text-mist-300">
                {timeframeConfig.label}: {total} Total
              </span>
            </div>
            <p className="text-xs text-mist-400">
              Automated deterministic rules vs manual dispatcher interventions ({timeframeConfig.periodLabel})
            </p>
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

          {/* Workflow Stage distribution */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-bold text-mist-400 tracking-wider">
              {currentDept} Workflow Stages ({timeframeConfig.label})
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-mist-500 block">Pending Dispatch</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{pendingCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-mist-500 block">In Progress</span>
                <span className="font-mono font-bold text-sky-300 text-sm">{inProgressCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-mist-500 block">Completed</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">{completedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Volume Breakdown for Particular Logged In Department */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-white">
                  Volume by Service Category
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentDept} Only
                </span>
              </div>
              <span className="font-mono text-xs text-mist-300">
                {timeframeConfig.label}: {total} Tasks
              </span>
            </div>
            <p className="text-xs text-mist-400">
              Task category distribution strictly for {currentDept} ({timeframeConfig.periodLabel})
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryBreakdown.map((item) => {
              const IconComp = item.icon;
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 25;

              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white font-medium">
                      <IconComp className={`h-4 w-4 ${item.color}`} />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono text-mist-300">
                      {item.count} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full ${item.bgBar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floor-wise distribution for this department */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-bold text-mist-400 tracking-wider">
              {currentDept} Floor Distribution ({timeframeConfig.label})
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              {floorDistribution.map((fl) => (
                <div key={fl.floor} className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-mist-500 block">Fl {fl.floor}</span>
                  <span className="font-mono font-bold text-white text-xs">{fl.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demand Profile Bar Chart (Adapts to Per Day / Per Week / Per Month) */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="border-b border-white/[0.08] pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-white">
              {chartData.title}
            </h2>
            <span className="text-[10px] font-mono text-purple-300 font-semibold px-2 py-0.5 rounded-full bg-purple-500/20">
              {timeframeConfig.label} Interval
            </span>
          </div>
          <p className="text-xs text-mist-400">
            {chartData.subtitle}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2">
          {chartData.bars.map((bar) => {
            const height = `${Math.max(12, Math.round((bar.count / maxChartCount) * 100))}%`;
            return (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] font-mono font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {bar.display}
                </span>
                <div className="w-full bg-white/[0.06] rounded-t-xl h-24 flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-amber-400 rounded-t-lg transition-all duration-500 group-hover:bg-amber-300"
                    style={{ height }}
                  />
                </div>
                <span className="text-[10px] font-mono text-mist-400 whitespace-nowrap">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
