'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { StaffAccount } from '@/types/demo';

interface ManagerWorkforceTabProps {
  scope: 'department' | 'hotel';
  onRequestStaffing?: () => void;
}

export function ManagerWorkforceTab({ scope, onRequestStaffing }: ManagerWorkforceTabProps) {
  const { state, redistributeUnstartedTasks, notify, flagWorkload } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);

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

  const handleRedistribute = () => {
    const res = redistributeUnstartedTasks(deptFilter === 'all' ? undefined : deptFilter);
    notify(res.message);
  };

  const handleFlagIssue = (staff: StaffAccount) => {
    flagWorkload(staff.id);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Workforce Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-bold font-display text-white">Staff Directory & Capacity Oversight</h2>
          </div>
          <p className="text-xs text-mist-400 mt-0.5">
            Real-time field attendance, floor zones, task capacity limits, and workload distribution
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, ID, department, or zone..."
            className="w-full h-8 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
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

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const stats = tasksByAssignee.get(staff.employeeId) || { active: 0, completed: 0, items: [] };
          const maxLoad = staff.maxWorkload || 5;
          const isOverloaded = stats.active >= maxLoad;
          const isNearCap = stats.active === maxLoad - 1 && maxLoad > 1;
          const isOffDuty = staff.availability && staff.availability !== 'on_duty';
          const saturation = Math.min(100, Math.round((stats.active / maxLoad) * 100));

          return (
            <div
              key={staff.id}
              className={`rounded-3xl border bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4 transition ${
                isOverloaded
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

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isOffDuty
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {staff.availability ? staff.availability.replace('_', ' ') : 'On Duty'}
                </span>
              </div>

              {/* Zone and Shift */}
              <div className="flex items-center justify-between text-xs text-mist-300 border-t border-white/[0.04] pt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-300" />
                  {staff.floorZone}
                </span>
                <span>{staff.shift} Shift</span>
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
