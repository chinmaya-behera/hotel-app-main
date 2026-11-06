'use client';

import { useState, useMemo, Fragment } from 'react';
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
  Layers,
  Building,
  X,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type {
  SupervisorInspection,
  InspectionStatus,
  InspectionType,
  DispatcherDepartment,
} from '@/types/demo';

interface SupervisorInspectionsTabProps {
  inspections?: SupervisorInspection[];
  department?: DispatcherDepartment;
  onSelectInspection?: (inspection: SupervisorInspection) => void;
}

export function SupervisorInspectionsTab({
  inspections = [],
  department = 'Housekeeping',
  onSelectInspection,
}: SupervisorInspectionsTabProps) {
  const { initiateInspectionDirective, notify } = useDemo();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InspectionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | InspectionType>('all');
  const [floorFilter, setFloorFilter] = useState<'all' | string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'single_room' | 'floor' | 'all_rooms'>('all');



  const floorLabels: Record<number, string> = {
    1: 'Garden Suites',
    2: 'Executive Wing',
    3: 'Standard & Studio',
    4: 'Deluxe Rooms',
    5: 'Royal & Presidential',
  };

  const floorRoomsMap: Record<number, string[]> = {
    1: ['101', '102', '103', '104', '105', '106', '107', '108', '127'],
    2: ['201', '202', '203', '204', '205', '206', '207', '208', '210'],
    3: ['301', '302', '303', '304', '305', '306', '307', '308'],
    4: ['401', '402', '403', '404', '405', '406', '407', '408'],
    5: ['501', '502', '503', '504', '505', '506', '507', '508', '509', '518', '520'],
  };

  const allRoomsList = useMemo(() => Object.values(floorRoomsMap).flat(), []);

  const counts = useMemo(() => {
    const list = inspections ?? [];
    return {
      all: list.length,
      pending: list.filter((i) => i.status === 'pending').length,
      passed: list.filter((i) => i.status === 'passed').length,
      reopened: list.filter((i) => i.status === 'reopened').length,
      singleRoom: list.filter((i) => !i.scope || i.scope === 'single_room').length,
      floor: list.filter((i) => i.scope === 'floor').length,
      allRooms: list.filter((i) => i.scope === 'all_rooms').length,
    };
  }, [inspections]);

  const filtered = useMemo(() => {
    return (inspections ?? []).filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (floorFilter !== 'all' && String(i.floor) !== floorFilter) return false;

      if (scopeFilter !== 'all') {
        const itemScope = i.scope || 'single_room';
        if (itemScope !== scopeFilter) return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchRoom = (i.roomNumber || '').toLowerCase().includes(query);
        const matchAttendant = (i.attendantName || '').toLowerCase().includes(query);
        const matchType = (i.roomType || '').toLowerCase().includes(query);
        const matchReason = (i.reopenReason || '').toLowerCase().includes(query);
        const matchScope = (i.scopeLabel || '').toLowerCase().includes(query);
        const matchAffected = (i.affectedRooms || []).some((r) => r.toLowerCase().includes(query));
        if (!matchRoom && !matchAttendant && !matchType && !matchReason && !matchScope && !matchAffected) return false;
      }
      return true;
    });
  }, [inspections, statusFilter, typeFilter, floorFilter, scopeFilter, search]);

  const floorWiseGroups = useMemo(() => {
    const map = new Map<number, SupervisorInspection[]>();

    filtered.forEach((item) => {
      const fl = item.floor || parseInt(item.roomNumber?.[0] || '1', 10) || 1;
      if (!map.has(fl)) {
        map.set(fl, []);
      }
      map.get(fl)!.push(item);
    });

    const sortedFloors = Array.from(map.keys()).sort((a, b) => a - b);

    return sortedFloors.map((floor) => {
      const items = map.get(floor)!;
      items.sort((a, b) => {
        // Floor sweeps first, then property wide, then room numbers
        if (a.scope === 'all_rooms') return -1;
        if (b.scope === 'all_rooms') return 1;
        if (a.scope === 'floor' && b.scope !== 'floor') return -1;
        if (b.scope === 'floor' && a.scope !== 'floor') return 1;

        const numA = parseInt(a.roomNumber.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.roomNumber.replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
        return (a.roomNumber || '').localeCompare(b.roomNumber || '');
      });

      return {
        floor,
        label: floorLabels[floor] || `Level ${floor}`,
        items,
        total: items.length,
        pending: items.filter((i) => i.status === 'pending').length,
        passed: items.filter((i) => i.status === 'passed').length,
        reopened: items.filter((i) => i.status === 'reopened').length,
      };
    });
  }, [filtered]);

  // Handle Quick Floor Sweep trigger
  const handleQuickFloorSweep = (floorNum: number) => {
    // Check if a pending floor sweep already exists for this floor
    const existing = (inspections ?? []).find(
      (i) => i.scope === 'floor' && i.floor === floorNum && i.status === 'pending'
    );
    if (existing) {
      onSelectInspection?.(existing);
      return;
    }

    const roomsOnFloor = floorRoomsMap[floorNum] || [];
    initiateInspectionDirective({
      department: department || 'Housekeeping',
      roomNumber: `Floor ${floorNum} (All Rooms)`,
      roomType: `${floorLabels[floorNum] || `Floor ${floorNum}`} Sweep (${roomsOnFloor.length} Rooms)`,
      floor: floorNum,
      type: 'turnover',
      priority: 'urgent',
      instructions: `Floor-wide quality sweep for all rooms on Floor ${floorNum} (${roomsOnFloor.join(', ')}) before check-in surge.`,
      initiatedBy: 'Supervisor Meera Nambiar',
      initiatedRole: 'department_dispatcher_supervisor',
      scope: 'floor',
      scopeLabel: `Floor ${floorNum} Sweep · All ${roomsOnFloor.length} Rooms`,
      affectedRooms: roomsOnFloor,
    });
    notify(`Created Floor ${floorNum} Turnover Sweep covering all ${roomsOnFloor.length} rooms`);
  };



  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Scope Controls Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-base font-bold font-display text-white">
                {department} Quality & Turnover Inspections
              </h2>
              <span className="rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                {department} Portal
              </span>
            </div>
            <p className="text-xs text-mist-400 mt-0.5">
              Conduct quality inspections for a <strong>particular room</strong>, <strong>overall rooms on a floor</strong>, or <strong>all rooms across the hotel</strong> before releasing to Front Desk inventory.
            </p>
          </div>

          {/* Quick status pill buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'reopened'
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'text-rose-300 hover:text-white'
              }`}
            >
              Touch-up / Reopened ({counts.reopened})
            </button>
          </div>
        </div>

        {/* Scope Selector: Single Room | Floor-Wide | All Rooms + Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-mist-300 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              <span>Inspection Scope:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-400 hover:text-white'
                }`}
              >
                All Scopes ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('single_room')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  scopeFilter === 'single_room'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-300 hover:text-white'
                }`}
              >
                <BedDouble className="h-3.5 w-3.5" />
                <span>Particular Room ({counts.singleRoom})</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('floor')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  scopeFilter === 'floor'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Floor-Wide (All Rooms on Floor) ({counts.floor})</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all_rooms')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  scopeFilter === 'all_rooms'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>All Rooms (Hotel-Wide) ({counts.allRooms})</span>
              </button>
            </div>
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
              placeholder="Search by Room # (e.g. 402, Floor 4), Attendant, or Scope..."
              className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | InspectionType)}
              className="w-full py-2 px-3 rounded-2xl border border-white/10 bg-ink-950 text-xs text-white focus:border-amber-400 focus:outline-none transition cursor-pointer"
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
              className="w-full py-2 px-3 rounded-2xl border border-white/10 bg-ink-950 text-xs text-white focus:border-amber-400 focus:outline-none transition cursor-pointer"
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
              Try adjusting your search query, inspection scope (Single Room / Floor-Wide / All Rooms), or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Room & Inspection Scope</th>
                  <th className="py-3 px-4">Floor / Zone</th>
                  <th className="py-3 px-4">Attendant</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Checklist Checks</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Completed / Signed-off</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {floorWiseGroups.map((group) => (
                  <Fragment key={group.floor}>
                    {/* Floor Header Bar with Quick Floor Sweep Action */}
                    <tr className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-y border-amber-400/20">
                      <td colSpan={9} className="py-2.5 px-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="h-6 w-6 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                              {group.floor}
                            </span>
                            <span className="font-bold text-white text-xs">
                              Floor {group.floor} · {group.label}
                            </span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-mist-200 font-mono font-medium">
                              {group.total} {group.total === 1 ? 'Inspection' : 'Inspections'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 text-[11px] font-mono">
                              <span className="text-amber-300 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending: <strong>{group.pending}</strong>
                              </span>
                              <span className="text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Passed: <strong>{group.passed}</strong>
                              </span>
                              {group.reopened > 0 && (
                                <span className="text-rose-300 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Reopened: <strong>{group.reopened}</strong>
                                </span>
                              )}
                            </div>

                            {/* Quick Sweep Button for this entire floor */}
                            <button
                              type="button"
                              onClick={() => handleQuickFloorSweep(group.floor)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                              title={`Inspect overall rooms on Floor ${group.floor} as a batch sweep`}
                            >
                              <Layers className="h-3.5 w-3.5" />
                              <span>Sweep Entire Floor {group.floor}</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {group.items.map((insp) => {
                      const passedChecks = insp.items.filter((it) => it.passed).length;
                      const totalChecks = insp.items.length;
                      const score = insp.score ?? (totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100);
                      const isFloorScope = insp.scope === 'floor';
                      const isAllRoomsScope = insp.scope === 'all_rooms';
                      const isSingleRoomScope = !insp.scope || insp.scope === 'single_room';

                      return (
                        <tr
                          key={insp.id}
                          onClick={() => onSelectInspection?.(insp)}
                          className="group hover:bg-white/[0.03] transition cursor-pointer"
                        >
                          {/* Room & Scope */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`grid h-8 w-8 place-items-center rounded-xl font-mono font-bold text-xs shrink-0 border ${
                                  isAllRoomsScope
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : isFloorScope
                                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                    : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                                }`}
                              >
                                {isAllRoomsScope ? <Building className="h-4 w-4" /> : isFloorScope ? <Layers className="h-4 w-4" /> : insp.roomNumber}
                              </span>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {isAllRoomsScope ? (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-200">
                                      Property-Wide · All 40 Rooms
                                    </span>
                                  ) : isFloorScope ? (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-[10px] font-bold text-amber-200">
                                      Floor {insp.floor} Sweep · All Rooms
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-mist-300 border border-white/10 text-[10px] font-medium">
                                      Particular Room · {insp.roomNumber}
                                    </span>
                                  )}
                                </div>

                                <p className="font-bold text-white text-xs">{insp.roomType}</p>

                                {/* Affected Rooms Preview for batch sweeps */}
                                {insp.affectedRooms && insp.affectedRooms.length > 1 && (
                                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                    <span className="text-[10px] text-mist-400 font-mono">Rooms ({insp.affectedRooms.length}):</span>
                                    {insp.affectedRooms.slice(0, 5).map((r) => (
                                      <span
                                        key={r}
                                        className="rounded bg-white/[0.04] border border-white/10 px-1 py-0.2 text-[9px] font-mono text-mist-300"
                                      >
                                        {r}
                                      </span>
                                    ))}
                                    {insp.affectedRooms.length > 5 && (
                                      <span className="text-[9px] font-mono text-amber-300/80">
                                        +{insp.affectedRooms.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                )}

                                {insp.instructions && (
                                  <p className="text-[10px] text-amber-200/90 italic line-clamp-1 max-w-[240px]" title={insp.instructions}>
                                    &ldquo;{insp.instructions}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Floor / Zone */}
                          <td className="py-3.5 px-4 font-mono text-mist-300 text-xs">
                            {isAllRoomsScope ? 'All Floors (1–5)' : `Floor ${insp.floor}`}
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
                                onSelectInspection?.(insp);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                                insp.status === 'pending'
                                  ? isAllRoomsScope
                                    ? 'bg-purple-500 text-white hover:bg-purple-400'
                                    : isFloorScope
                                    ? 'bg-amber-400 text-ink-950 hover:bg-amber-300'
                                    : 'bg-amber-400 text-ink-950 hover:bg-amber-300'
                                  : 'border border-white/10 bg-white/[0.04] text-mist-200 hover:text-white hover:bg-white/[0.08]'
                              }`}
                            >
                              {insp.status === 'pending'
                                ? isAllRoomsScope
                                  ? 'Inspect All Rooms'
                                  : isFloorScope
                                  ? 'Inspect Floor'
                                  : 'Inspect Room'
                                : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
}
