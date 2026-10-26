'use client';

import {
  BarChart3,
  Download,
  TrendingUp,
  ShieldCheck,
  Clock,
  Sparkles,
  BedDouble,
  Users,
  AlertTriangle,
} from 'lucide-react';
import type { SupervisorInspection, StaffAccount, RoomRecord } from '@/types/demo';

interface SupervisorReportsTabProps {
  inspections: SupervisorInspection[];
  staffList: StaffAccount[];
  rooms: RoomRecord[];
}

export function SupervisorReportsTab({
  inspections,
  staffList,
  rooms,
}: SupervisorReportsTabProps) {
  const passedInspections = inspections.filter((i) => i.status === 'passed');
  const reopenedInspections = inspections.filter((i) => i.status === 'reopened');
  const totalCompleted = passedInspections.length + reopenedInspections.length;
  const overallPassRate =
    totalCompleted > 0 ? ((passedInspections.length / totalCompleted) * 100).toFixed(1) : '91.4';

  const floorMetrics = [
    { floor: 1, name: 'Floor 1 (Garden Suites)', passRate: 95, roomsCleaned: 6, avgMins: 32 },
    { floor: 2, name: 'Floor 2 (Executive Wing)', passRate: 91, roomsCleaned: 8, avgMins: 35 },
    { floor: 3, name: 'Floor 3 (Standard & Studio)', passRate: 88, roomsCleaned: 9, avgMins: 30 },
    { floor: 4, name: 'Floor 4 (Deluxe Rooms)', passRate: 94, roomsCleaned: 7, avgMins: 33 },
    { floor: 5, name: 'Floor 5 (Royal & Presidential)', passRate: 98, roomsCleaned: 4, avgMins: 44 },
  ];

  const failureCategories = [
    { category: 'Bathroom & Chrome Polish', percentage: 42, count: 5, color: 'bg-rose-500' },
    { category: 'Minibar Restock & Seal', percentage: 28, count: 3, color: 'bg-amber-400' },
    { category: 'Bedding Linen Tight Fold', percentage: 18, count: 2, color: 'bg-sky-400' },
    { category: 'HVAC & Electronics Setup', percentage: 12, count: 1, color: 'bg-teal-400' },
  ];

  const handleExportCsv = () => {
    const headers = [
      'Inspection ID',
      'Room Number',
      'Room Type',
      'Floor',
      'Attendant Name',
      'Attendant ID',
      'Status',
      'Quality Score',
      'Completed At',
      'Inspected At',
      'Reopen Reason',
    ];

    const rows = inspections.map((i) => [
      i.id,
      i.roomNumber,
      `"${i.roomType}"`,
      i.floor,
      `"${i.attendantName}"`,
      i.attendantId,
      i.status,
      `${i.score ?? 100}%`,
      i.completedAt,
      i.inspectedAt || 'N/A',
      `"${i.reopenReason || 'None'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `housekeeping_quality_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Housekeeping Department Quality & Turnaround Analytics
            </h2>
            <p className="text-xs text-mist-400">
              Inspection trends, first-pass compliance by floor, and deficiency root causes
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition flex items-center gap-2 shadow-lg shadow-amber-400/20"
          >
            <Download className="h-4 w-4" />
            <span>Export Inspection CSV</span>
          </button>
        </div>

        {/* Top 3 High Level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400">First-Pass Rate</p>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">{overallPassRate}%</p>
            <p className="text-[11px] text-mist-400 mt-0.5">Hotel SLA baseline: 90.0%</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400">Avg Turnover Speed</p>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-1">34 Minutes</p>
            <p className="text-[11px] text-mist-400 mt-0.5">Target: 40m per suite</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400">Spot-Check Deficiencies</p>
            <p className="text-2xl font-bold font-mono text-rose-300 mt-1">
              {reopenedInspections.length} Today
            </p>
            <p className="text-[11px] text-mist-400 mt-0.5">Resolved within 20m average</p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Floor Compliance & Defect Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Floor Compliance */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-white">
              First-Pass Quality by Floor Zone
            </h3>
            <span className="text-xs text-mist-400">Floors 1 to 5</span>
          </div>

          <div className="space-y-3.5">
            {floorMetrics.map((fl) => (
              <div key={fl.floor} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{fl.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-mist-400 font-mono text-[11px]">
                      {fl.roomsCleaned} rms · {fl.avgMins}m avg
                    </span>
                    <span className="font-mono font-bold text-emerald-300 w-10 text-right">
                      {fl.passRate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                    style={{ width: `${fl.passRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Categories */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-white">
              Root Cause Breakdown of Deficiencies
            </h3>
            <span className="text-xs text-mist-400">Total 11 touch-ups</span>
          </div>

          <div className="space-y-3.5">
            {failureCategories.map((fc) => (
              <div key={fc.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{fc.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-mist-400 font-mono text-[11px]">{fc.count} occurrences</span>
                    <span className="font-mono font-bold text-amber-300 w-10 text-right">
                      {fc.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${fc.color} rounded-full`}
                    style={{ width: `${fc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-mist-400 pt-2 border-t border-white/[0.06]">
            Recommendation: Reinforce bathroom chrome descaling and minibar manifest verification during morning shift briefing.
          </p>
        </div>
      </div>
    </div>
  );
}
