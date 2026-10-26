'use client';

import { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BedDouble,
  User,
  Clock,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import type { SupervisorInspection, InspectionStatus, InspectionType } from '@/types/demo';

interface SupervisorInspectionsTabProps {
  inspections: SupervisorInspection[];
  onSelectInspection: (inspection: SupervisorInspection) => void;
}

export function SupervisorInspectionsTab({
  inspections,
  onSelectInspection,
}: SupervisorInspectionsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InspectionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | InspectionType>('all');
  const [floorFilter, setFloorFilter] = useState<'all' | string>('all');

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (floorFilter !== 'all' && String(i.floor) !== floorFilter) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchRoom = i.roomNumber.toLowerCase().includes(query);
        const matchAttendant = i.attendantName.toLowerCase().includes(query);
        const matchType = i.roomType.toLowerCase().includes(query);
        const matchReason = i.reopenReason?.toLowerCase().includes(query);
        if (!matchRoom && !matchAttendant && !matchType && !matchReason) return false;
      }
      return true;
    });
  }, [inspections, statusFilter, typeFilter, floorFilter, search]);

  const counts = useMemo(() => {
    return {
      all: inspections.length,
      pending: inspections.filter((i) => i.status === 'pending').length,
      passed: inspections.filter((i) => i.status === 'passed').length,
      reopened: inspections.filter((i) => i.status === 'reopened').length,
    };
  }, [inspections]);

  return (
    <div className="space-y-6">
      {/* Tab Header & Filter Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Room Turnover & Quality Inspections Queue
            </h2>
            <p className="text-xs text-mist-400">
              Verify housekeeping quality checklists before releasing rooms to Front Desk inventory
            </p>
          </div>

          {/* Quick status pill buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'text-mist-400 hover:text-white'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              <span>Pending</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-ink-950 font-bold">
                {counts.pending}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('passed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === 'passed'
                  ? 'bg-emerald-400 text-ink-950 font-bold shadow'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              Passed ({counts.passed})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('reopened')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === 'reopened'
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'text-rose-300 hover:text-white'
              }`}
            >
              Touch-up / Reopened ({counts.reopened})
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.06]">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Room # (e.g. 502), Attendant (Vikram), or deficiency..."
              className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | InspectionType)}
              className="w-full py-2 px-3 rounded-2xl border border-white/10 bg-ink-950 text-xs text-white focus:border-amber-400 focus:outline-none transition"
            >
              <option value="all">All Inspection Types</option>
              <option value="turnover">Turnover Clean</option>
              <option value="vip_prep">VIP Arrival Prep</option>
              <option value="deep_clean">Deep Clean Cycle</option>
              <option value="maintenance_check">Post-Maintenance</option>
              <option value="periodic">Periodic Audit</option>
            </select>
          </div>

          {/* Floor Filter */}
          <div>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-2xl border border-white/10 bg-ink-950 text-xs text-white focus:border-amber-400 focus:outline-none transition"
            >
              <option value="all">All Floors (1–5)</option>
              <option value="1">Floor 1 (Garden Suites)</option>
              <option value="2">Floor 2 (Executive Wing)</option>
              <option value="3">Floor 3 (Standard & Studio)</option>
              <option value="4">Floor 4 (Deluxe Rooms)</option>
              <option value="5">Floor 5 (Royal & Presidential)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table / Cards */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 overflow-hidden backdrop-blur-xl shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ClipboardCheck className="h-10 w-10 text-mist-500 mx-auto" />
            <p className="text-sm font-bold text-white">No Inspections Matching Filter</p>
            <p className="text-xs text-mist-400">
              Try adjusting your search criteria, floor zone, or inspection status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Room & Type</th>
                  <th className="py-3 px-4">Floor</th>
                  <th className="py-3 px-4">Attendant</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Checklist Checks</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Completed / Inspected</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((insp) => {
                  const passedChecks = insp.items.filter((it) => it.passed).length;
                  const totalChecks = insp.items.length;
                  const score = insp.score ?? Math.round((passedChecks / totalChecks) * 100);

                  return (
                    <tr
                      key={insp.id}
                      onClick={() => onSelectInspection(insp)}
                      className="group hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      {/* Room & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 font-mono font-bold text-xs border border-amber-400/20">
                            {insp.roomNumber}
                          </span>
                          <div>
                            <p className="font-bold text-white">Room {insp.roomNumber}</p>
                            <p className="text-[11px] text-mist-400">{insp.roomType}</p>
                          </div>
                        </div>
                      </td>

                      {/* Floor */}
                      <td className="py-3.5 px-4 font-mono text-mist-300">
                        Floor {insp.floor}
                      </td>

                      {/* Attendant */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-white">{insp.attendantName}</p>
                          <p className="text-[10px] text-mist-400 font-mono">{insp.attendantId}</p>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-mist-300 capitalize">
                          {insp.type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Checklist */}
                      <td className="py-3.5 px-4 font-mono text-mist-300">
                        <span className={passedChecks === totalChecks ? 'text-emerald-300' : 'text-rose-300'}>
                          {passedChecks}
                        </span>
                        /{totalChecks} items
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span
                          className={
                            score >= 90
                              ? 'text-emerald-300'
                              : score >= 75
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }
                        >
                          {score}%
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            insp.status === 'passed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : insp.status === 'reopened'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {insp.status === 'passed' && <Check className="h-3 w-3" />}
                          {insp.status === 'reopened' && <RotateCcw className="h-3 w-3" />}
                          {insp.status === 'pending' && <Clock className="h-3 w-3" />}
                          <span>{insp.status}</span>
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-mist-300 text-[11px]">
                        <p>Done: {insp.completedAt}</p>
                        {insp.inspectedAt && (
                          <p className="text-mist-400 text-[10px]">Sign-off: {insp.inspectedAt}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInspection(insp);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            insp.status === 'pending'
                              ? 'bg-amber-400 text-ink-950 hover:bg-amber-300'
                              : 'border border-white/10 bg-white/[0.04] text-mist-200 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {insp.status === 'pending' ? 'Inspect' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
