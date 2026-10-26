'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
  BedDouble,
  UserCheck,
} from 'lucide-react';
import type { StaffAccount, WorkItem, SupervisorInspection } from '@/types/demo';

interface SupervisorTeamTabProps {
  staffList: StaffAccount[];
  tasks: WorkItem[];
  inspections: SupervisorInspection[];
  onUpdateAvailability: (staffId: string, availability: 'on_duty' | 'break' | 'off_duty') => void;
  onUpdateCapacity: (staffId: string, maxWorkload: number) => void;
}

export function SupervisorTeamTab({
  staffList,
  tasks,
  inspections,
  onUpdateAvailability,
  onUpdateCapacity,
}: SupervisorTeamTabProps) {
  const [search, setSearch] = useState('');

  // Housekeeping attendants
  const attendants = staffList.filter(
    (s) =>
      s.department === 'Housekeeping' ||
      s.roleId === 'task_fulfiller' ||
      ['Sofia Rivera', 'Wayne Chen', 'Kabir Sen', 'Sana Sheikh', 'Rohan Verma'].includes(s.name),
  );

  const filteredAttendants = attendants.filter((a) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.employeeId.toLowerCase().includes(q) ||
        a.floorZone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metric Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Housekeeping Team Workload & Quality Oversight
            </h2>
            <p className="text-xs text-mist-400">
              Monitor attendant task capacities, shift availability, and first-pass room inspection scores
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search attendant by name or zone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Attendant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAttendants.map((att) => {
          const attendantTasks = tasks.filter(
            (t) =>
              t.assignee?.toLowerCase().includes(att.name.toLowerCase()) &&
              t.status !== 'Completed',
          );
          const maxCapacity = att.maxWorkload || 5;
          const currentLoad = attendantTasks.length;
          const loadPercent = Math.min(Math.round((currentLoad / maxCapacity) * 100), 100);

          const attendantInspections = inspections.filter(
            (i) => i.attendantName?.toLowerCase().includes(att.name.toLowerCase()),
          );
          const passedCount = attendantInspections.filter((i) => i.status === 'passed').length;
          const totalInspections = attendantInspections.length;
          const qualityScore =
            totalInspections > 0
              ? Math.round((passedCount / totalInspections) * 100)
              : att.name === 'Sofia Rivera'
              ? 94
              : att.name === 'Wayne Chen'
              ? 89
              : att.name === 'Kabir Sen'
              ? 96
              : 92;

          return (
            <div
              key={att.id}
              className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4 hover:border-amber-400/30 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-teal-400/20 text-amber-300 font-bold font-mono border border-amber-400/30 text-sm">
                    {att.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{att.name}</h3>
                    <p className="text-xs text-mist-400 font-mono">
                      {att.employeeId} · {att.shift} Shift
                    </p>
                  </div>
                </div>

                {/* Live Availability Dropdown */}
                <select
                  value={att.availability || 'on_duty'}
                  onChange={(e) =>
                    onUpdateAvailability(
                      att.id,
                      e.target.value as 'on_duty' | 'break' | 'off_duty',
                    )
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border focus:outline-none transition ${
                    att.availability === 'off_duty'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : att.availability === 'break'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <option value="on_duty" className="bg-ink-900 text-white">
                    On Duty
                  </option>
                  <option value="break" className="bg-ink-900 text-white">
                    On Break
                  </option>
                  <option value="off_duty" className="bg-ink-900 text-white">
                    Off Duty
                  </option>
                </select>
              </div>

              {/* Zone & Quality Row */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-mist-400">Assigned Zone</p>
                  <p className="font-semibold text-white mt-0.5">{att.floorZone || 'Floors 1-5'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-mist-400">Pass Rate</p>
                  <p className="font-semibold font-mono text-emerald-300 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{qualityScore}% Quality</span>
                  </p>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist-400">Current Workload</span>
                  <span className="font-mono font-bold text-white">
                    {currentLoad} / {maxCapacity} tasks ({loadPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      loadPercent >= 90
                        ? 'bg-rose-500'
                        : loadPercent >= 70
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>

              {/* Capacity Limit Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                <span className="text-mist-400">Max Capacity Limit</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateCapacity(att.id, Math.max(1, maxCapacity - 1))}
                    className="h-6 w-6 rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-white w-5 text-center">
                    {maxCapacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateCapacity(att.id, maxCapacity + 1)}
                    className="h-6 w-6 rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Active Assigned Tasks list snippet */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] uppercase tracking-wider text-mist-400">
                  Active Room Assignments ({attendantTasks.length})
                </p>
                {attendantTasks.length === 0 ? (
                  <p className="text-xs text-mist-500 italic">No tasks currently queued.</p>
                ) : (
                  <div className="space-y-1">
                    {attendantTasks.slice(0, 2).map((tsk) => (
                      <div
                        key={tsk.id}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px]"
                      >
                        <span className="text-white truncate">{tsk.title}</span>
                        {tsk.room && (
                          <span className="font-mono text-amber-300 shrink-0 ml-2">
                            R{tsk.room}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
