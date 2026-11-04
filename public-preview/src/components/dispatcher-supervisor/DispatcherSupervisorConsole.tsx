'use client';

import { useState, useMemo } from 'react';
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
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection, RoleId } from '@/types/demo';
import { ROLE_AUTHORITY_PROFILES, SHARED_SERVICE_POLICIES } from '@/lib/policies';

// Dispatcher Tabs
// Unified Operations Desktop
import { UnifiedOperationsDesktop } from './UnifiedOperationsDesktop';
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

  // Unified items
  const allTasks = useMemo(
    () => [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i),
    [state.items.department_dispatcher_supervisor, state.items.department_dispatcher],
  );

  const inspections = useMemo(() => state.inspections ?? [], [state.inspections]);
  const rooms = useMemo(() => state.frontDesk?.rooms ?? [], [state.frontDesk?.rooms]);
  const staffList = useMemo(() => state.staffAccounts ?? [], [state.staffAccounts]);
  const incidents = useMemo(() => state.incidents ?? [], [state.incidents]);

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
      label: 'Quality Inspections',
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

  return (
    <div className="w-full pb-16">
      {/* Top Banner / Role Notification Bar */}
      <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            DS
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-display">
                Department Dispatcher / Supervisor Console
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Phase 2 Combined Role
              </span>
            </div>
            <p className="text-xs text-mist-300">
              Unified field orchestration, request auto-routing, quality inspections, shift handovers & SLA monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 hover:bg-amber-300 text-xs font-bold transition shadow-md shadow-amber-400/20 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEscalateModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Escalate Issue</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Sticky Sidebar + Dynamic View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-72'
          }`}
        >
          <div className="sticky top-20 rounded-3xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-2xl space-y-2">
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
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                      isActive
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          item.badgeTone === 'danger'
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
            <UnifiedOperationsDesktop
              onNavigateTab={(tab) => setActiveTab(tab as DispatcherSupervisorTab)}
              onSelectInspection={(insp) => {
                setSelectedInspection(insp);
                setIsInspectionModalOpen(true);
              }}
              onOpenCreateTask={() => setIsCreateTaskModalOpen(true)}
              onOpenEscalate={() => setIsEscalateModalOpen(true)}
            />
          )}
          {activeTab === 'queue' && <DispatcherQueueTab />}

          {activeTab === 'inspections' && (
            <SupervisorInspectionsTab
              inspections={inspections}
              onSelectInspection={(insp) => {
                setSelectedInspection(insp);
                setIsInspectionModalOpen(true);
              }}
            />
          )}

          {activeTab === 'rooms' && (
            <SupervisorRoomsTab
              rooms={rooms}
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

          {activeTab === 'workload' && <DispatcherWorkloadTab />}

          {activeTab === 'blockers' && (
            <DispatcherBlockersTab onOpenEscalate={() => setIsEscalateModalOpen(true)} />
          )}

          {activeTab === 'routing' && <DispatcherRoutingTab />}

          {activeTab === 'sla' && <DispatcherSlaTab />}

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
                          <p className="text-xs text-mist-300">{p.summary || p.content}</p>
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
