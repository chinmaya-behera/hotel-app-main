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
  MessageSquareWarning,
  HeartPulse,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection, RoleId, DispatcherDepartment, WorkItem, StaffAccount } from '@/types/demo';

// Dispatcher Tabs
import { DispatcherSupervisorOverviewTab } from './DispatcherSupervisorOverviewTab';
import { DispatcherQueueTab } from '@/components/dispatcher/DispatcherQueueTab';
import { DispatcherWorkloadTab } from '@/components/dispatcher/DispatcherWorkloadTab';
import { DispatcherRoutingTab } from '@/components/dispatcher/DispatcherRoutingTab';
import { DispatcherSlaTab } from '@/components/dispatcher/DispatcherSlaTab';
import { DispatcherReportsTab } from '@/components/dispatcher/DispatcherReportsTab';
import { DispatcherBlockersTab } from '@/components/dispatcher/DispatcherBlockersTab';
import { DispatcherGuestMessagesTab } from '@/components/dispatcher/DispatcherGuestMessagesTab';
import { DispatcherComplaintsTab, isComplaintInActiveDept } from '@/components/dispatcher/DispatcherComplaintsTab';
import { DispatcherPoliciesTab } from '@/components/dispatcher/DispatcherPoliciesTab';

// Supervisor Tabs

import { SupervisorInspectionsTab } from '@/components/supervisor/SupervisorInspectionsTab';
import { SupervisorRoomsTab } from '@/components/supervisor/SupervisorRoomsTab';
import { SupervisorMedicalTherapyTab } from '@/components/supervisor/SupervisorMedicalTherapyTab';
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
  | 'medical_therapy'
  | 'routing'
  | 'guest_messages'
  | 'complaints'
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

  // Redirect away from rooms tab if in Wellness or Food & Beverages department
  useEffect(() => {
    if ((currentDept === 'Wellness' || currentDept === 'Food & Beverages') && activeTab === 'rooms') {
      setActiveTab('overview');
    }
  }, [currentDept, activeTab]);

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
        ['spa', 'wellness', 'massage', 'hydrotherapy', 'medical', 'therapy'].includes(catStr)
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
    return state.frontDesk?.rooms ?? [];
  }, [state.frontDesk?.rooms]);

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

  const departmentComplaintsCount = useMemo(() => {
    const fromFrontDesk = (state.frontDesk?.complaints ?? []).filter(
      (c) => isComplaintInActiveDept(c, currentDept) && !c.compApplied && (c.status || '').toLowerCase() !== 'resolved',
    );
    const fromGuest = (state.guestComplaints ?? []).filter(
      (c) => isComplaintInActiveDept(c, currentDept) && c.status !== 'Resolved',
    );
    return fromFrontDesk.length + fromGuest.length;
  }, [state.frontDesk?.complaints, state.guestComplaints, currentDept]);

  const medicalTherapyCount = useMemo(() => {
    if (currentDept !== 'Wellness') return 0;
    return allTasks.filter((t) => {
      const cat = (t.category || '').toLowerCase();
      const ref = (t.ref || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const isMedOrTher =
        cat === 'medical' ||
        cat === 'therapy' ||
        ref.startsWith('med-') ||
        ref.startsWith('ther-') ||
        title.includes('asthma') ||
        title.includes('allergic') ||
        title.includes('therapy') ||
        title.includes('physiotherapy');
      return isMedOrTher && (t.status === 'Unassigned' || t.status === 'Received');
    }).length;
  }, [allTasks, currentDept]);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Console Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'queue',
      label: 'Task',
      shortLabel: 'Task',
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
    ...(currentDept !== 'Wellness' && currentDept !== 'Food & Beverages'
      ? [
          {
            id: 'rooms' as DispatcherSupervisorTab,
            label: 'Room Turnover & Readiness',
            shortLabel: 'Rooms',
            icon: BedDouble,
          },
        ]
      : []),
    ...(currentDept === 'Wellness'
      ? [
          {
            id: 'medical_therapy' as DispatcherSupervisorTab,
            label: 'Medical & Therapy',
            shortLabel: 'Medical & Therapy',
            icon: HeartPulse,
            badge: medicalTherapyCount > 0 ? `${medicalTherapyCount} Action` : undefined,
            badgeTone: 'danger' as const,
          },
        ]
      : []),
    {
      id: 'guest_messages',
      label: 'Guest Messages',
      shortLabel: 'Guest Messages',
      icon: MessageSquare,
    },
    {
      id: 'complaints',
      label: 'Guest Complaints',
      shortLabel: 'Complaints',
      icon: MessageSquareWarning,
      badge: departmentComplaintsCount > 0 ? departmentComplaintsCount : undefined,
      badgeTone: 'danger',
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


  ];

  return (
    <div className="w-full pb-16">
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
              department={currentDept}
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
              department={currentDept}
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

          {activeTab === 'medical_therapy' && (
            <SupervisorMedicalTherapyTab
              tasks={allTasks}
              staffList={staffList}
              department={currentDept}
            />
          )}

          {activeTab === 'workload' && <DispatcherWorkloadTab staffList={staffList} department={currentDept} />}

          {activeTab === 'blockers' && (
            <DispatcherBlockersTab onOpenEscalate={() => setIsEscalateModalOpen(true)} tasks={allTasks} />
          )}

          {activeTab === 'routing' && <DispatcherRoutingTab />}

          {activeTab === 'sla' && <DispatcherSlaTab tasks={allTasks} department={currentDept} />}

          {activeTab === 'guest_messages' && <DispatcherGuestMessagesTab activeDept={currentDept} />}

          {activeTab === 'complaints' && (
            <DispatcherComplaintsTab
              department={currentDept}
              onOpenEscalate={() => setIsEscalateModalOpen(true)}
            />
          )}

          {activeTab === 'handover' && (
            <SupervisorHandoverTab
              handovers={state.shiftHandovers ?? []}
              tasks={allTasks}
              inspections={inspections}
              incidents={incidents}
              department={currentDept}
              onSubmitHandover={submitShiftHandover}
              onAcknowledgeHandover={acknowledgeShiftHandover}
            />
          )}

          {activeTab === 'policies' && <DispatcherPoliciesTab department={currentDept} />}

          {activeTab === 'reports' && <DispatcherReportsTab department={currentDept} tasks={allTasks} />}

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
