'use client';

import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Send,
  UserCheck,
  Activity,
  Layers,
  Wrench,
  Bed,
  BedDouble,
  UtensilsCrossed,
  Calendar,
  Flame,
  ClipboardCheck,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type {
  DispatcherDepartment,
  SupervisorInspection,
  RoomRecord,
  StaffAccount,
  WorkItem,
  IncidentRecord,
} from '@/types/demo';

interface DispatcherSupervisorOverviewTabProps {
  activeDept?: DispatcherDepartment;
  inspections?: SupervisorInspection[];
  rooms?: RoomRecord[];
  staffList?: StaffAccount[];
  tasks?: WorkItem[];
  incidents?: IncidentRecord[];
  onSelectInspection?: (inspection: SupervisorInspection) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenEscalate?: () => void;
}

export function DispatcherSupervisorOverviewTab({
  activeDept,
  inspections = [],
  rooms = [],
  staffList = [],
  tasks = [],
  incidents = [],
  onSelectInspection = () => {},
  onNavigateTab = () => {},
  onOpenEscalate = () => {},
}: DispatcherSupervisorOverviewTabProps) {
  const { state, autoAssignTask, autoAssignAllPending } = useDemo();

  // Tasks & Fulfiller metrics (Dispatcher Stream)
  const allTasks = tasks.length > 0 ? tasks : [
    ...(state.items.department_dispatcher_supervisor ?? []),
    ...(state.items.department_dispatcher ?? []),
  ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const totalTasks = allTasks.length;
  const unassignedTasks = allTasks.filter((t) => t.status === 'Unassigned' || t.status === 'Received');
  const activeTasks = allTasks.filter((t) => t.status === 'Assigned' || t.status === 'In progress' || t.status === 'Accepted');
  const overdueTasks = allTasks.filter(
    (t) => t.ackStatus === 'overdue' || t.chip?.toLowerCase().includes('overdue') || t.slaDue?.toLowerCase().includes('overdue'),
  );
  const autoAssignedCount = allTasks.filter((t) => t.autoAssigned).length;
  const autoAssignRate = totalTasks > 0 ? Math.round((autoAssignedCount / totalTasks) * 100) : 75;
  const escalatedCount = allTasks.filter((t) => t.status === 'Escalated' || t.escalatedTo).length;

  // Urgent attention items (Dispatcher)
  const urgentItems = allTasks.filter(
    (t) =>
      t.status === 'Unassigned' &&
      (t.priority === 'critical' || t.priority === 'urgent' || t.priority === 'safety' || t.priority === 'vip' || t.ackStatus === 'overdue'),
  );

  // Department workloads (Dispatcher)
  const hkTasks = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('housekeeping'));
  const mxTasks = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('maintenance'));
  const fbTasks = allTasks.filter((t) => (t.department || t.category || '').toLowerCase().includes('food') || t.category === 'room_service');

  // Inspection & Quality metrics (Supervisor)
  const pendingInspections = (inspections ?? []).filter((i) => i.status === 'pending');
  const reopenedInspections = (inspections ?? []).filter((i) => i.status === 'reopened');
  const passedInspections = (inspections ?? []).filter((i) => i.status === 'passed');
  const totalFinished = passedInspections.length + reopenedInspections.length;
  const firstPassRate =
    totalFinished > 0 ? ((passedInspections.length / totalFinished) * 100).toFixed(1) : '91.4';

  // Staff & Roster metrics (Supervisor & Dispatcher)
  const fulfillers = (staffList.length > 0 ? staffList : state.staffAccounts ?? []).filter(
    (s) => s.roleId === 'task_fulfiller',
  );
  const onDutyCount = fulfillers.filter((f) => f.status === 'active' && (!f.availability || f.availability !== 'off_duty')).length;

  // Rooms readiness pipeline (Supervisor)
  const allRooms = rooms.length > 0 ? rooms : state.frontDesk?.rooms ?? [];
  const readyRoomsCount = allRooms.filter((r) => r.readiness === 'ready').length;
  const inspectionPendingRooms = allRooms.filter((r) => r.readiness === 'inspection_pending').length;
  const cleaningRooms = allRooms.filter((r) => r.readiness === 'cleaning').length;
  const dirtyRooms = allRooms.filter((r) => r.readiness === 'dirty').length;

  // Reassignment requests pending supervisor approval
  const reassignRequests = allTasks.filter((t) => t.reassignPending);

  return (
    <div className="space-y-6">
      {/* Reassignment Urgent Notice Banner */}
      {reassignRequests.length > 0 && (
        <div className="p-4 rounded-3xl border border-amber-400/30 bg-amber-500/[0.08] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-400/20 text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-200">
                {reassignRequests.length} Attendant Reassignment Request Pending
              </p>
              <p className="text-[11px] text-amber-200/80">
                Task fulfillers flagged blockers requiring supervisor replacement approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('blockers')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
          >
            Review Reassignments
          </button>
        </div>
      )}

      {/* 8 Unified Overview KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Inbound Tickets */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inbound Today</span>
            <ArrowUpRight className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{totalTasks}</span>
            <span className="text-xs text-mist-400 font-mono">tickets</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Guest portal & sensors</p>
        </div>

        {/* Metric 2: Unassigned Queue */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.04] p-4 backdrop-blur-xl shadow-lg hover:border-amber-400/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unassigned Queue</span>
            <AlertTriangle className="h-4 w-4 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-amber-300">{unassignedTasks.length}</span>
            <span className="text-xs text-amber-200/70 font-mono">pending</span>
          </div>
          <p className="text-[10px] text-amber-200/70 mt-1">Awaiting dispatch</p>
        </div>

        {/* Metric 3: Active in Field */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active in Field</span>
            <Clock className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{activeTasks.length}</span>
            <span className="text-xs text-emerald-400 font-mono">in flight</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Accepted or in progress</p>
        </div>

        {/* Metric 4: Awaiting Inspection */}
        <div
          onClick={() => onNavigateTab('inspections')}
          className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] to-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-amber-400/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Awaiting Inspection</span>
            <ClipboardCheck className="h-4 w-4 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{pendingInspections.length}</span>
            <span className="text-xs text-amber-300 font-mono">
              {pendingInspections.filter((i) => i.priority === 'vip').length} VIP
            </span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">Turnovers awaiting supervisor sign-off</p>
        </div>

        {/* Metric 5: First-Pass Quality Rate */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] to-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-emerald-400/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">First-Pass Quality</span>
            <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{firstPassRate}%</span>
            <span className="text-xs text-emerald-300 font-mono flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +2.4%
            </span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">{passedInspections.length} certified of {totalFinished || 7}</p>
        </div>

        {/* Metric 6: Overdue SLAs */}
        <div
          onClick={() => onNavigateTab('sla')}
          className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.05] p-4 backdrop-blur-xl shadow-lg hover:border-rose-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue SLAs</span>
            <Flame className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-rose-400">{overdueTasks.length}</span>
            <span className="text-xs text-rose-300/70 font-mono">breached</span>
          </div>
          <p className="text-[10px] text-rose-300/70 mt-1">Requires immediate attention</p>
        </div>

        {/* Metric 7: On-Duty Team */}
        <div
          onClick={() => onNavigateTab('workload')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">On-Duty Roster</span>
            <Users className="h-4 w-4 group-hover:text-amber-300 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{onDutyCount}</span>
            <span className="text-xs text-mist-400 font-mono">/ {fulfillers.length}</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">{activeDept ? `${activeDept} Team` : 'Department Attendants'}</p>
        </div>

        {/* Metric 8: Auto-Assign & Escalations */}
        <div
          onClick={() => onNavigateTab('routing')}
          className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur-xl shadow-lg hover:border-white/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-mist-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Auto-Assign Rate</span>
            <Sparkles className="h-4 w-4 text-amber-300 group-hover:scale-110 transition" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-white">{autoAssignRate}%</span>
            <span className="text-xs text-emerald-400 font-mono">optimal</span>
          </div>
          <p className="text-[10px] text-mist-400 mt-1">{escalatedCount} escalated to Mgr</p>
        </div>
      </div>

      {/* Room Readiness Pipeline Strip (Supervisor) */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-amber-300" />
              Property Room Readiness Pipeline
            </h3>
            <p className="text-xs text-mist-400">
              Live turnover synchronization with Front Desk check-in inventory
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('rooms')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <span>Open Room Board</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigateTab('rooms')}
            className="p-3 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 cursor-pointer hover:border-rose-500/40 transition"
          >
            <p className="text-[10px] uppercase font-bold text-rose-300">Dirty / Turnover</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{dirtyRooms} Rooms</p>
          </div>
          <div
            onClick={() => onNavigateTab('rooms')}
            className="p-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition"
          >
            <p className="text-[10px] uppercase font-bold text-amber-300">Cleaning In Progress</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{cleaningRooms} Rooms</p>
          </div>
          <div
            onClick={() => onNavigateTab('inspections')}
            className="p-3 rounded-2xl bg-sky-500/[0.06] border border-sky-500/20 cursor-pointer hover:border-sky-500/40 transition"
          >
            <p className="text-[10px] uppercase font-bold text-sky-300">Awaiting Inspection</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              {inspectionPendingRooms || pendingInspections.length} Rooms
            </p>
          </div>
          <div
            onClick={() => onNavigateTab('rooms')}
            className="p-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition"
          >
            <p className="text-[10px] uppercase font-bold text-emerald-300">Ready for Check-In</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{readyRoomsCount} Rooms</p>
          </div>
        </div>
      </div>

      {/* Urgent Attention Queue (Dispatcher) */}
      {urgentItems.length > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.04] p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base font-bold font-display text-white">
                Urgent Inbound Attention Required ({urgentItems.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('queue')}
              className="text-xs text-rose-300 hover:text-white transition flex items-center gap-1 font-semibold"
            >
              <span>View in Queue</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-ink-950/70 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-300">{item.ref}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-mist-400 line-clamp-2">{item.description || item.meta}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <span className="text-[11px] font-mono text-rose-300">
                    Ack SLA: {item.ackSlaDue || 'Overdue'}
                  </span>
                  <button
                    type="button"
                    onClick={() => autoAssignTask(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Assign</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-Column Grid: Priority Inspections & Workload / Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Priority Inspection Queue & Workload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Inspection Queue (Supervisor) */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-300" />
                <h3 className="text-base font-bold font-display text-white">
                  Priority Inspection Queue ({pendingInspections.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('inspections')}
                className="text-xs text-amber-300 hover:text-white transition flex items-center gap-1 font-semibold"
              >
                <span>View all ({inspections.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {pendingInspections.length === 0 ? (
                <div className="p-8 rounded-3xl border border-white/10 bg-ink-900/60 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto" />
                  <p className="text-sm font-bold text-white">All Turnovers Inspected!</p>
                  <p className="text-xs text-mist-400">
                    No rooms are currently waiting for supervisor quality certification.
                  </p>
                </div>
              ) : (
                pendingInspections.slice(0, 4).map((insp) => (
                  <div
                    key={insp.id}
                    onClick={() => onSelectInspection(insp)}
                    className="group cursor-pointer p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold font-mono text-sm">
                        {insp.roomNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            Room {insp.roomNumber} ({insp.roomType})
                          </span>
                          {insp.priority === 'vip' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                              VIP Prep
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist-300 text-[10px]">
                            Floor {insp.floor}
                          </span>
                        </div>
                        <p className="text-xs text-mist-400 mt-0.5 truncate">
                          Attendant: {insp.attendantName} · Completed {insp.completedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInspection(insp);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Department Workload Distribution (Dispatcher) */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h2 className="text-base font-bold font-display text-white">Department Workload Distribution</h2>
                <p className="text-xs text-mist-400">Current active ticket demand and fulfillment balance</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('workload')}
                className="text-xs text-amber-300 hover:text-white font-semibold transition flex items-center gap-1"
              >
                <span>Manage Roster</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {/* Housekeeping Specific Workload */}
              {(!activeDept || activeDept === 'Housekeeping') && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <Bed className="h-4 w-4 text-emerald-400" />
                        Room Turnover & Linen Logistics
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => (t.category === 'housekeeping' || (t.department || '').toLowerCase().includes('house')) && !t.title.toLowerCase().includes('deep clean')).length} tasks
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: '65%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Floors 1–5 Attendants</span>
                      <span>Capacity: 65%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        Deep Cleaning & Sanitization Cycles
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => t.title.toLowerCase().includes('deep clean') || t.title.toLowerCase().includes('sanitiz')).length} tasks
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: '40%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Scheduled periodic cycles</span>
                      <span>Capacity: 40%</span>
                    </div>
                  </div>
                </>
              )}

              {/* Wellness Specific Workload */}
              {activeDept === 'Wellness' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <Sparkles className="h-4 w-4 text-teal-400" />
                        Ayurvedic & Aromatherapy Sessions
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => t.title.toLowerCase().includes('ayurvedic') || t.title.toLowerCase().includes('massage')).length} bookings
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full transition-all duration-500" style={{ width: '70%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Level 2 Treatment Suites</span>
                      <span>Capacity: 70%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <ShieldCheck className="h-4 w-4 text-cyan-400" />
                        Hydrotherapy Pools & Sauna Sterilization
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => t.title.toLowerCase().includes('hydro') || t.title.toLowerCase().includes('sauna')).length} protocols
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: '55%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Vitality Pool & Thermal Suite</span>
                      <span>Capacity: 55%</span>
                    </div>
                  </div>
                </>
              )}

              {/* Maintenance Specific Workload */}
              {activeDept === 'Maintenance & Engineering' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <Wrench className="h-4 w-4 text-amber-400" />
                        HVAC Climate & Mechanical Systems
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => t.title.toLowerCase().includes('ac') || t.title.toLowerCase().includes('hvac')).length} work orders
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: '80%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Air handlers & chiller loops</span>
                      <span>Capacity: 80%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <Activity className="h-4 w-4 text-rose-400" />
                        Plumbing, Electrical & IoT Telemetry
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => !t.title.toLowerCase().includes('ac') && !t.title.toLowerCase().includes('hvac')).length} alerts
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: '60%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Sensor alerts & elevators</span>
                      <span>Capacity: 60%</span>
                    </div>
                  </div>
                </>
              )}

              {/* Food & Beverage Specific Workload */}
              {activeDept === 'Food & Beverages' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <UtensilsCrossed className="h-4 w-4 text-purple-400" />
                        In-Room Dining & VIP Tray Delivery
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => t.title.toLowerCase().includes('tray') || t.title.toLowerCase().includes('platter') || t.title.toLowerCase().includes('tea')).length} orders
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full transition-all duration-500" style={{ width: '75%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Pantry runners & expedite</span>
                      <span>Capacity: 75%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-white">
                        <Clock className="h-4 w-4 text-pink-400" />
                        Minibar Inventory & Beverage Service
                      </span>
                      <span className="font-mono text-mist-300">
                        {allTasks.filter((t) => t.title.toLowerCase().includes('minibar') || t.title.toLowerCase().includes('wine') || t.title.toLowerCase().includes('champagne')).length} tasks
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-pink-400 rounded-full transition-all duration-500" style={{ width: '50%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-mist-500">
                      <span>Suite bars & replenishment</span>
                      <span>Capacity: 50%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Quick Actions, Quality Roster & Live Stream */}
        <div className="space-y-6">
          {/* Quick Operations & Supervisor Actions */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <h3 className="text-sm font-bold font-display text-white">Console Operations</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (pendingInspections[0]) onSelectInspection(pendingInspections[0]);
                  else onNavigateTab('inspections');
                }}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/30 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardCheck className="h-4 w-4 text-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-white">Quality Inspection</p>
                    <p className="text-[11px] text-mist-400">
                      {pendingInspections[0] ? `Inspect Room ${pendingInspections[0].roomNumber}` : 'Review pending queue'}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-mist-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  autoAssignAllPending();
                }}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-400/30 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Auto-Assign Pending</p>
                    <p className="text-[11px] text-mist-400">Dispatch unassigned queue</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-mist-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('handover')}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-sky-400/30 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-sky-300" />
                  <div>
                    <p className="text-xs font-bold text-white">Shift Handover</p>
                    <p className="text-[11px] text-mist-400">Transfer shift briefing log</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-mist-400" />
              </button>

              <button
                type="button"
                onClick={onOpenEscalate}
                className="w-full p-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08] hover:border-rose-500/40 transition text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-rose-300" />
                  <div>
                    <p className="text-xs font-bold text-rose-200">Escalate to Duty Manager</p>
                    <p className="text-[11px] text-rose-300/70">Raise blocker or safety issue</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Attendant Quality & Roster Snapshot */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-white">Attendant Quality Roster</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('workload')}
                className="text-xs text-amber-400 hover:text-amber-300 transition"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {fulfillers.slice(0, 4).map((att, idx) => {
                const passRate =
                  att.name === 'Vikram Singh'
                    ? 94
                    : att.name === 'Wayne Chen'
                    ? 89
                    : att.name === 'Kabir Sen'
                    ? 96
                    : 91 + (idx % 5);

                return (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{att.name}</p>
                      <p className="text-[11px] text-mist-400">
                        {att.floorZone || 'Floor 1-3'} · {att.shift || 'Day'} Shift
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-300">{passRate}%</span>
                      <p className="text-[10px] text-mist-400">Pass Rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Dispatch Stream Feed */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-white">Live Operations Feed</h3>
                <p className="text-xs text-mist-400">Real-time property events</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
              {(state.feed ?? []).slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-xs hover:bg-white/[0.03] transition"
                >
                  <div className="h-6 w-6 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                    {event.role ? event.role[0] : 'S'}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate text-[11px]">{event.role}</span>
                      <span className="font-mono text-[9px] text-mist-400 shrink-0">{event.at}</span>
                    </div>
                    <p className="text-mist-300 text-[11px] leading-relaxed line-clamp-2">{event.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

