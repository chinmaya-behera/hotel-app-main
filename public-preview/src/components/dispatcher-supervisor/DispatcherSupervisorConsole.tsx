'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  ClipboardCheck,
  BedDouble,
  Users,
  Sparkles,
  Clock,
  Repeat,
  ShieldCheck,
  BarChart3,
  History,
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  HeartPulse,
  Wrench,
  UtensilsCrossed,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection, RoleId, DispatcherDepartment, WorkItem, StaffAccount } from '@/types/demo';
import { ROLE_AUTHORITY_PROFILES, SHARED_SERVICE_POLICIES } from '@/lib/policies';

// Dispatcher Tabs
import { DispatcherSupervisorOverviewTab } from './DispatcherSupervisorOverviewTab';
import { DispatcherQueueTab } from '@/components/dispatcher/DispatcherQueueTab';
import { DispatcherWorkloadTab } from '@/components/dispatcher/DispatcherWorkloadTab';
import { DispatcherRoutingTab } from '@/components/dispatcher/DispatcherRoutingTab';
import { DispatcherSlaTab } from '@/components/dispatcher/DispatcherSlaTab';
import { DispatcherReportsTab } from '@/components/dispatcher/DispatcherReportsTab';
import { DispatcherBlockersTab } from '@/components/dispatcher/DispatcherBlockersTab';
import { DispatcherGuestMessagesTab } from '@/components/dispatcher/DispatcherGuestMessagesTab';

// Supervisor Tabs

import { SupervisorInspectionsTab } from '@/components/supervisor/SupervisorInspectionsTab';
import { SupervisorRoomsTab } from '@/components/supervisor/SupervisorRoomsTab';
import { SupervisorHandoverTab } from '@/components/supervisor/SupervisorHandoverTab';
import { SupervisorAuditTab } from '@/components/supervisor/SupervisorAuditTab';
import { SupervisorNotificationsTab } from '@/components/supervisor/SupervisorNotificationsTab';

// Modals
import { InspectionModal } from '@/components/supervisor/InspectionModal';
import { ReopenTaskModal } from '@/components/supervisor/ReopenTaskModal';
import { EscalateIssueModal } from '@/components/supervisor/EscalateIssueModal';
import { CreateTaskModal } from '@/components/dispatcher/CreateTaskModal';

export type DispatcherSupervisorTab =
  | 'overview'
  | 'queue'
  | 'workload'
  | 'blockers'
  | 'inspections'
  | 'rooms'
  | 'routing'
  | 'guest_messages'
  | 'sla'
  | 'handover'
  | 'policies'
  | 'reports'
  | 'audit'
  | 'notifications';

interface NavItem {
  id: DispatcherSupervisorTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  badge?: number | string;
  badgeTone?: 'neutral' | 'danger' | 'warning' | 'success';
}

export function DispatcherSupervisorConsole() {
  const {
    state,
    setActiveDispatcherDept,
    approveInspection,
    reopenInspection,
    reviewFulfillerReassignment,
    escalateSupervisorIssue,
    submitShiftHandover,
    acknowledgeShiftHandover,
    updateStaffAvailability,
    updateStaffCapacity,
    markNotificationRead,
    clearAllNotifications,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<DispatcherSupervisorTab>('overview');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedInspection, setSelectedInspection] = useState<SupervisorInspection | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [reopenTargetInspection, setReopenTargetInspection] = useState<SupervisorInspection | null>(null);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  // Department state & URL query synchronization
  const currentDept: DispatcherDepartment = state.activeDispatcherDept || 'Housekeeping';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const deptParam = params.get('dept')?.toLowerCase();
      if (deptParam === 'wellness' || deptParam === 'spa') {
        setActiveDispatcherDept('Wellness');
      } else if (deptParam === 'maintenance' || deptParam === 'engineering') {
        setActiveDispatcherDept('Maintenance & Engineering');
      } else if (deptParam === 'fnb' || deptParam === 'food' || deptParam === 'beverage') {
        setActiveDispatcherDept('Food & Beverages');
      } else if (deptParam === 'housekeeping' || deptParam === 'hk') {
        setActiveDispatcherDept('Housekeeping');
      }
    }
  }, [setActiveDispatcherDept]);

  // Department-specific task filter
  const isTaskInActiveDept = (t: WorkItem) => {
    const deptStr = (t.department || '').toLowerCase();
    const catStr = (t.category || '').toLowerCase();
    if (currentDept === 'Housekeeping') {
      return (
        deptStr.includes('housekeeping') ||
        ['housekeeping', 'lost_found', 'turnover', 'linen'].includes(catStr)
      );
    }
    if (currentDept === 'Wellness') {
      return (
        deptStr.includes('spa') ||
        deptStr.includes('wellness') ||
        ['spa', 'wellness', 'massage', 'hydrotherapy'].includes(catStr)
      );
    }
    if (currentDept === 'Maintenance & Engineering') {
      return (
        deptStr.includes('maintenance') ||
        deptStr.includes('engineering') ||
        ['maintenance', 'hvac', 'plumbing', 'electrical', 'repair'].includes(catStr)
      );
    }
    if (currentDept === 'Food & Beverages') {
      return (
        deptStr.includes('food') ||
        deptStr.includes('beverage') ||
        deptStr.includes('f&b') ||
        ['room_service', 'dining', 'fnb', 'kitchen', 'restaurant', 'bar'].includes(catStr)
      );
    }
    return true;
  };

  // Department-specific staff filter
  const isStaffInActiveDept = (s: StaffAccount) => {
    const d = s.department.toLowerCase();
    if (currentDept === 'Housekeeping') return d.includes('house');
    if (currentDept === 'Wellness') return d.includes('spa') || d.includes('wellness');
    if (currentDept === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
    if (currentDept === 'Food & Beverages') return d.includes('food') || d.includes('bev');
    return true;
  };

  // Department-specific inspection filter
  const isInspectionInActiveDept = (i: SupervisorInspection) => {
    if (i.department) {
      const d = i.department.toLowerCase();
      if (currentDept === 'Housekeeping') return d.includes('house');
      if (currentDept === 'Wellness') return d.includes('spa') || d.includes('wellness');
      if (currentDept === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
      if (currentDept === 'Food & Beverages') return d.includes('food') || d.includes('bev');
    }
    const att = (i.attendantName || '').toLowerCase();
    const rType = (i.roomType || '').toLowerCase();
    const rNo = (i.roomNumber || '').toLowerCase();
    if (currentDept === 'Housekeeping') {
      return (
        !att.includes('wayne') &&
        !att.includes('rohan') &&
        !att.includes('leila') &&
        !att.includes('brandt') &&
        !att.includes('malhotra') &&
        !rType.includes('spa') &&
        !rType.includes('engineering') &&
        !rType.includes('f&b')
      );
    }
    if (currentDept === 'Wellness') {
      return (
        att.includes('leila') ||
        att.includes('brandt') ||
        att.includes('ananya') ||
        rType.includes('spa') ||
        rType.includes('wellness') ||
        rNo.includes('spa')
      );
    }
    if (currentDept === 'Maintenance & Engineering') {
      return (
        att.includes('wayne') ||
        att.includes('rohan') ||
        att.includes('arjun') ||
        rType.includes('engineering') ||
        rType.includes('maint')
      );
    }
    if (currentDept === 'Food & Beverages') {
      return (
        att.includes('kabir') ||
        att.includes('dev') ||
        att.includes('malhotra') ||
        att.includes('rossi') ||
        rType.includes('f&b') ||
        rType.includes('dining')
      );
    }
    return true;
  };

  // Unified department items
  const allTasks = useMemo(
    () =>
      [
        ...(state.items.department_dispatcher_supervisor ?? []),
        ...(state.items.department_dispatcher ?? []),
      ]
        .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
        .filter(isTaskInActiveDept),
    [state.items.department_dispatcher_supervisor, state.items.department_dispatcher, currentDept],
  );

  const inspections = useMemo(
    () => (state.inspections ?? []).filter(isInspectionInActiveDept),
    [state.inspections, currentDept],
  );

  const staffList = useMemo(
    () => (state.staffAccounts ?? []).filter(isStaffInActiveDept),
    [state.staffAccounts, currentDept],
  );

  const incidents = useMemo(
    () =>
      (state.incidents ?? []).filter((inc) => {
        const d = (inc.department || inc.title || '').toLowerCase();
        if (currentDept === 'Housekeeping') return d.includes('house');
        if (currentDept === 'Wellness') return d.includes('spa') || d.includes('wellness');
        if (currentDept === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng') || d.includes('safety');
        if (currentDept === 'Food & Beverages') return d.includes('food') || d.includes('bev') || d.includes('dining');
        return true;
      }),
    [state.incidents, currentDept],
  );

  const departmentRooms = useMemo(() => {
    const allRooms = state.frontDesk?.rooms ?? [];
    if (currentDept === 'Housekeeping') return allRooms;
    if (currentDept === 'Maintenance & Engineering') {
      return allRooms.filter(
        (r) =>
          r.readiness === 'out_of_order' ||
          r.readiness === 'inspection_failed' ||
          ['305', '412', '502', '108'].includes(r.no),
      );
    }
    if (currentDept === 'Wellness') {
      return allRooms.filter(
        (r) => r.floor === 2 || r.note?.toLowerCase().includes('suite') || ['202', '204', '210', '518'].includes(r.no),
      );
    }
    if (currentDept === 'Food & Beverages') {
      return allRooms.filter((r) => ['518', '402', '301', '305', '501'].includes(r.no));
    }
    return allRooms;
  }, [state.frontDesk?.rooms, currentDept]);

  const unassignedCount = allTasks.filter((t) => t.status === 'Unassigned' || t.status === 'Received').length;
  const pendingInspections = inspections.filter((i) => i.status === 'pending').length;
  const overdueCount = allTasks.filter(
    (t) =>
      t.ackStatus === 'overdue' ||
      t.chip?.toLowerCase().includes('overdue') ||
      t.slaDue?.toLowerCase().includes('overdue'),
  ).length;

  const blockedCount = allTasks.filter(
    (t) => t.status === 'Blocked' || (t.history && t.history[t.history.length - 1]?.status === 'Blocked'),
  ).length;
  const reassignPendingCount = allTasks.filter(
    (t) => t.reassignPending || t.status === 'Reassignment requested',
  ).length;

  const rolePolicy = ROLE_AUTHORITY_PROFILES['department_dispatcher_supervisor'];

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Console Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'queue',
      label: 'Task Queue',
      shortLabel: 'Task Queue',
      icon: Layers,
      badge: unassignedCount > 0 ? unassignedCount : undefined,
      badgeTone: 'warning',
    },
    {
      id: 'workload',
      label: 'Team Workload',
      shortLabel: 'Workload',
      icon: Users,
    },
    {
      id: 'blockers',
      label: 'Blockers & Issues',
      shortLabel: 'Blockers',
      icon: AlertTriangle,
      badge: blockedCount + reassignPendingCount > 0 ? blockedCount + reassignPendingCount : undefined,
      badgeTone: 'danger',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      shortLabel: 'Inspections',
      icon: ClipboardCheck,
      badge: pendingInspections > 0 ? pendingInspections : undefined,
      badgeTone: 'warning',
    },
    {
      id: 'rooms',
      label: 'Room Turnover & Readiness',
      shortLabel: 'Rooms',
      icon: BedDouble,
    },
    {
      id: 'routing',
      label: 'Auto-Routing Sandbox',
      shortLabel: 'Auto-Routing',
      icon: Sparkles,
    },
    {
      id: 'guest_messages',
      label: 'Guest Messages',
      shortLabel: 'Guest Messages',
      icon: MessageSquare,
    },
    {
      id: 'sla',
      label: 'SLA Monitor',
      shortLabel: 'SLA Monitor',
      icon: Clock,
      badge: overdueCount > 0 ? `${overdueCount} Breach` : undefined,
      badgeTone: 'danger',
    },
    {
      id: 'handover',
      label: 'Shift Handover Log',
      shortLabel: 'Handover',
      icon: Repeat,
    },
    {
      id: 'policies',
      label: 'Policies & Authority',
      shortLabel: 'Policies',
      icon: ShieldCheck,
    },
    {
      id: 'reports',
      label: 'Operational Analytics',
      shortLabel: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      shortLabel: 'Audit',
      icon: History,
    },
    {
      id: 'notifications',
      label: 'Alerts & Notifications',
      shortLabel: 'Alerts',
      icon: Bell,
    },
  ];

  // Visual details for active department
  const deptMeta = {
    'Housekeeping': {
      title: 'Housekeeping Operations',
      subtitle: 'Turnover readiness, room cleaning, deep clean sanitization & linen logistics',
      gradient: 'from-emerald-500 to-teal-600',
      icon: Sparkles,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    },
    'Wellness': {
      title: 'Wellness & Spa Operations',
      subtitle: 'Ayurvedic treatments, hydrotherapy pools, wellness suites & therapy appointments',
      gradient: 'from-teal-500 to-cyan-600',
      icon: HeartPulse,
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/10 border-cyan-500/30',
    },
    'Maintenance & Engineering': {
      title: 'Maintenance & Engineering Operations',
      subtitle: 'HVAC climate systems, plumbing, electrical repairs & IoT asset alerts',
      gradient: 'from-amber-500 to-orange-600',
      icon: Wrench,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
    },
    'Food & Beverages': {
      title: 'Food & Beverages Operations',
      subtitle: 'In-room dining orders, kitchen expediting, tray presentation & minibar replenishment',
      gradient: 'from-purple-500 to-pink-600',
      icon: UtensilsCrossed,
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/10 border-purple-500/30',
    },
  }[currentDept];

  const DeptIcon = deptMeta.icon;

  return (
    <div className="w-full pb-16">
      {/* Active Department Header Banner & Interactive Switcher */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 sm:p-5 backdrop-blur-xl shadow-2xl mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${deptMeta.gradient} flex items-center justify-center text-white shadow-lg shadow-black/40 shrink-0`}>
              <DeptIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${deptMeta.bgClass} ${deptMeta.colorClass}`}>
                  {currentDept} Portal
                </span>
                <span className="text-xs text-mist-400 font-mono">
                  {allTasks.length} {currentDept} Tasks · {staffList.length} Staff on Roster
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-display text-white mt-0.5 truncate">
                {deptMeta.title}
              </h1>
              <p className="text-xs text-mist-400 line-clamp-1">
                {deptMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Department Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-ink-950/80 shrink-0">
            {(['Housekeeping', 'Wellness', 'Maintenance & Engineering', 'Food & Beverages'] as DispatcherDepartment[]).map((d) => {
              const isCurrent = d === currentDept;
              const icons = {
                'Housekeeping': Sparkles,
                'Wellness': HeartPulse,
                'Maintenance & Engineering': Wrench,
                'Food & Beverages': UtensilsCrossed,
              };
              const PIcon = icons[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDispatcherDept(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-ink-950 shadow-md font-extrabold'
                      : 'text-mist-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <PIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{d}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Layout: Sticky Sidebar + Dynamic View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out lg:sticky lg:top-20 z-20 self-start ${
            sidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-72'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-2xl space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex items-center justify-center p-1 rounded-xl text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${isActive
                      ? 'bg-amber-400 text-ink-950 shadow-lg shadow-amber-400/20 font-bold'
                      : 'text-mist-300 hover:text-white hover:bg-white/[0.04]'
                      } ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${item.badgeTone === 'danger'
                          ? isActive
                            ? 'bg-ink-950 text-rose-300'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.badgeTone === 'warning'
                            ? isActive
                              ? 'bg-ink-950 text-amber-300'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isActive
                              ? 'bg-ink-950 text-emerald-300'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Dynamic Tab Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {activeTab === 'overview' && (
            <DispatcherSupervisorOverviewTab
              activeDept={currentDept}
              inspections={inspections}
              rooms={departmentRooms}
              staffList={staffList}
              tasks={allTasks}
              incidents={incidents}
              onSelectInspection={(insp) => {
                setSelectedInspection(insp);
                setIsInspectionModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab as DispatcherSupervisorTab)}
              onOpenEscalate={() => setIsEscalateModalOpen(true)}
            />
          )}

          {activeTab === 'queue' && <DispatcherQueueTab tasks={allTasks} activeDept={currentDept} />}

          {activeTab === 'inspections' && (
            <SupervisorInspectionsTab
              departmentName={currentDept}
              inspections={inspections}
              onSelectInspection={(insp) => {
                setSelectedInspection(insp);
                setIsInspectionModalOpen(true);
              }}
            />
          )}

          {activeTab === 'rooms' && (
            <SupervisorRoomsTab
              rooms={departmentRooms}
              inspections={inspections}
              onSelectInspectionByRoom={(roomNo) => {
                const existing = (inspections ?? []).find((i) => i.roomNumber === roomNo);
                if (existing) {
                  setSelectedInspection(existing);
                  setIsInspectionModalOpen(true);
                } else {
                  setActiveTab('inspections');
                }
              }}
              onOpenEscalateForRoom={() => {
                setIsEscalateModalOpen(true);
              }}
            />
          )}

          {activeTab === 'workload' && <DispatcherWorkloadTab staffList={staffList} department={currentDept} />}

          {activeTab === 'blockers' && (
            <DispatcherBlockersTab onOpenEscalate={() => setIsEscalateModalOpen(true)} tasks={allTasks} />
          )}

          {activeTab === 'routing' && <DispatcherRoutingTab />}

          {activeTab === 'sla' && <DispatcherSlaTab tasks={allTasks} />}

          {activeTab === 'guest_messages' && <DispatcherGuestMessagesTab />}

          {activeTab === 'handover' && (
            <SupervisorHandoverTab
              handovers={state.shiftHandovers ?? []}
              tasks={allTasks}
              inspections={inspections}
              incidents={incidents}
              onSubmitHandover={submitShiftHandover}
              onAcknowledgeHandover={acknowledgeShiftHandover}
            />
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Service Authority & Operational Policies
                  </h2>
                  <p className="text-xs text-mist-400">
                    Governing authority, dispatch boundaries, escalation triggers, and operational limits
                  </p>
                </div>

                {rolePolicy && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Operational Authority
                      </p>
                      <ul className="text-xs space-y-2 text-mist-300">
                        {(rolePolicy.operationalAuthority ?? rolePolicy.canDo ?? []).map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                      <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                        Strict Negative Boundaries (Escalate to Duty Manager)
                      </p>
                      <ul className="text-xs space-y-2 text-rose-200/90">
                        {(rolePolicy.negativeBoundaries ?? rolePolicy.cannotDo ?? []).map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Department Manager Active Directives */}
                {(state.departmentPolicies ?? []).length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      <h3 className="text-sm font-bold text-purple-200">
                        Department Manager Active Directives ({(state.departmentPolicies ?? []).length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(state.departmentPolicies ?? []).map((p) => (
                        <div key={p.id} className="p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{p.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-xs text-mist-300">{p.summary}</p>
                          <div className="flex items-center justify-between text-[11px] pt-1 text-mist-400">
                            <span className="text-amber-300 font-mono">Limit: {p.authorityLimit}</span>
                            <span>Owner: {p.policyOwner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">General Manager Property-Wide Service Standards</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SHARED_SERVICE_POLICIES.filter((p) => p.department === 'Housekeeping' || p.department === 'Operations').map((p) => (
                      <div key={p.id} className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{p.title}</span>
                          {!p.configured || p.needsConfiguration ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              Needs Config
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-mist-300">{p.summary ?? p.policySummary}</p>
                        <p className="text-[11px] text-mist-400">Escalation: {p.escalationTarget}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && <DispatcherReportsTab />}

          {activeTab === 'audit' && <SupervisorAuditTab auditTrail={state.auditTrail ?? []} />}

          {activeTab === 'notifications' && (
            <SupervisorNotificationsTab
              notifications={state.notifications ?? []}
              onMarkRead={markNotificationRead}
              onClearAll={clearAllNotifications}
              onNavigateTab={(tab) => setActiveTab(tab as DispatcherSupervisorTab)}
            />
          )}
        </div>
      </div>

      {/* Reusable Modals */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedInspection(null);
        }}
        inspection={selectedInspection}
        onApprove={approveInspection}
        onOpenReopenModal={(insp) => {
          setIsInspectionModalOpen(false);
          setReopenTargetInspection(insp);
          setIsReopenModalOpen(true);
        }}
      />

      <ReopenTaskModal
        isOpen={isReopenModalOpen}
        onClose={() => {
          setIsReopenModalOpen(false);
          setReopenTargetInspection(null);
        }}
        inspection={reopenTargetInspection}
        staffList={staffList}
        onSubmit={reopenInspection}
        onReopen={reopenInspection}
      />

      <EscalateIssueModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        onSubmit={escalateSupervisorIssue}
        onEscalate={escalateSupervisorIssue}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
      />
    </div>
  );
}
