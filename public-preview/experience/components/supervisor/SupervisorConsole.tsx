'use client';

import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  BedDouble,
  Layers,
  Users,
  Flame,
  Clock,
  BarChart3,
  History,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection } from '@/types/demo';

// Tabs
import { SupervisorOverviewTab } from './SupervisorOverviewTab';
import { SupervisorInspectionsTab } from './SupervisorInspectionsTab';
import { SupervisorRoomsTab } from './SupervisorRoomsTab';
import { SupervisorTasksTab } from './SupervisorTasksTab';
import { SupervisorTeamTab } from './SupervisorTeamTab';
import { SupervisorEscalationsTab } from './SupervisorEscalationsTab';
import { SupervisorHandoverTab } from './SupervisorHandoverTab';
import { SupervisorReportsTab } from './SupervisorReportsTab';
import { SupervisorAuditTab } from './SupervisorAuditTab';
import { SupervisorNotificationsTab } from './SupervisorNotificationsTab';
import { SupervisorProfileTab } from './SupervisorProfileTab';

// Modals
import { InspectionModal } from './InspectionModal';
import { ReopenTaskModal } from './ReopenTaskModal';
import { EscalateIssueModal } from './EscalateIssueModal';

export type SupervisorTab =
  | 'overview'
  | 'inspections'
  | 'rooms'
  | 'tasks'
  | 'team'
  | 'escalations'
  | 'handover'
  | 'reports'
  | 'audit'
  | 'notifications'
  | 'profile';

interface NavItem {
  id: SupervisorTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  badge?: number | string;
  badgeTone?: 'neutral' | 'danger' | 'warning' | 'success';
}

export function SupervisorConsole() {
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

  const [activeTab, setActiveTab] = useState<SupervisorTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedInspection, setSelectedInspection] = useState<SupervisorInspection | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [reopenTargetInspection, setReopenTargetInspection] = useState<SupervisorInspection | null>(
    null,
  );
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateInitialRoom, setEscalateInitialRoom] = useState('');

  // Centralized Mock Records
  const inspections = useMemo(() => state.inspections ?? [], [state.inspections]);
  const rooms = useMemo(() => state.frontDesk.rooms ?? [], [state.frontDesk.rooms]);
  const staffList = useMemo(() => state.staffAccounts ?? [], [state.staffAccounts]);
  const tasks = useMemo(
    () => [
      ...(state.items.task_fulfiller ?? []),
      ...(state.items.task_fulfiller ?? []),
      ...(state.items.task_fulfiller ?? []),
    ],
    [state.items],
  );
  const incidents = useMemo(() => state.incidents ?? [], [state.incidents]);
  const handovers = useMemo(() => state.shiftHandovers ?? [], [state.shiftHandovers]);
  const auditTrail = useMemo(() => state.auditTrail ?? [], [state.auditTrail]);
  const notifications = useMemo(() => state.notifications ?? [], [state.notifications]);

  // Dynamic counts for sidebar badges
  const pendingInspectionsCount = inspections.filter((i) => i.status === 'pending').length;
  const reassignPendingCount = tasks.filter((t) => t.reassignPending).length;
  const unreadNotifsCount = notifications.filter(
    (n) => !n.read && (!n.targetRole || n.targetRole === 'department_supervisor'),
  ).length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Supervisor Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'inspections',
      label: 'Inspection Queue',
      shortLabel: 'Inspections',
      icon: ClipboardCheck,
      badge: pendingInspectionsCount > 0 ? pendingInspectionsCount : undefined,
      badgeTone: 'warning',
    },
    {
      id: 'rooms',
      label: 'Room Readiness Board',
      shortLabel: 'Rooms',
      icon: BedDouble,
    },
    {
      id: 'tasks',
      label: 'Tasks & Reassignments',
      shortLabel: 'Tasks',
      icon: Layers,
      badge: reassignPendingCount > 0 ? `${reassignPendingCount} Reassign` : undefined,
      badgeTone: 'danger',
    },
    {
      id: 'team',
      label: 'Team & Workload Roster',
      shortLabel: 'Team',
      icon: Users,
    },
    {
      id: 'escalations',
      label: 'Escalations to Duty Mgr',
      shortLabel: 'Escalations',
      icon: Flame,
    },
    {
      id: 'handover',
      label: 'Shift Handover Log',
      shortLabel: 'Handover',
      icon: Clock,
    },
    {
      id: 'reports',
      label: 'Quality Analytics',
      shortLabel: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'audit',
      label: 'Supervisor Audit Trail',
      shortLabel: 'Audit',
      icon: History,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      shortLabel: 'Alerts',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeTone: 'warning',
    },
    {
      id: 'profile',
      label: 'Profile & Permissions',
      shortLabel: 'Profile',
      icon: User,
    },
  ];

  const handleOpenInspection = (insp: SupervisorInspection) => {
    setSelectedInspection(insp);
    setIsInspectionModalOpen(true);
  };

  const handleOpenInspectionByRoom = (roomNo: string) => {
    const insp = inspections.find((i) => i.roomNumber === roomNo);
    if (insp) {
      setSelectedInspection(insp);
      setIsInspectionModalOpen(true);
    } else {
      // Create on-the-fly inspection for room
      const dummyInsp: SupervisorInspection = {
        id: `INSP-TEMP-${roomNo}`,
        roomNumber: roomNo,
        roomType: 'Deluxe Room',
        floor: parseInt(roomNo[0], 10) || 1,
        attendantName: 'Sofia Rivera',
        attendantId: 'EMP-0103',
        type: 'turnover',
        status: 'pending',
        priority: 'normal',
        completedAt: 'Just now',
        items: [
          {
            id: 'chk-1',
            category: 'Bathroom & Sanitization',
            label: 'Vanity mirror spotless & toilet sanitization seal placed',
            passed: true,
          },
          {
            id: 'chk-2',
            category: 'Bedding & Linens',
            label: 'Linens tight 45° hospital fold & spotless duvets',
            passed: true,
          },
          {
            id: 'chk-3',
            category: 'Minibar & Amenities',
            label: 'Bottled water sealed & complete luxury vanity amenities',
            passed: true,
          },
          {
            id: 'chk-4',
            category: 'Electronics & Climate',
            label: 'HVAC set to eco 22°C & electronic deadbolt verified',
            passed: true,
          },
        ],
      };
      setSelectedInspection(dummyInsp);
      setIsInspectionModalOpen(true);
    }
  };

  const handleOpenReopenModal = (insp: SupervisorInspection) => {
    setReopenTargetInspection(insp);
    setIsReopenModalOpen(true);
  };

  const handleOpenEscalateForRoom = (roomNo: string) => {
    setEscalateInitialRoom(roomNo);
    setIsEscalateModalOpen(true);
  };

  return (
    <div className="w-full pb-16">
      {/* Mobile Horizontal Navigation Strip */}
      <div className="lg:hidden mb-4 overflow-x-auto pb-2 flex items-center gap-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'bg-amber-400 text-ink-950 font-bold shadow-md'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.shortLabel}</span>
              {item.badge && (
                <span className="rounded-full bg-ink-950/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Layout: Sticky & Collapsible Sidebar + Content View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sticky Collapsible Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-200 hidden lg:block ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl space-y-1 sticky top-24">
            {/* Header & Toggle Button */}
            <div className="flex items-center justify-between p-2 mb-2 border-b border-white/[0.06]">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-lg bg-amber-400/20 text-amber-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-mist-400">
                    Supervisor Desk
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-mist-400 hover:text-white transition ml-auto"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-400 text-ink-950 font-bold shadow-md'
                        : 'text-mist-300 hover:text-white hover:bg-white/[0.05]'
                    } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-ink-950 text-amber-300'
                            : item.badgeTone === 'danger'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.badgeTone === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-mist-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Supervisor Profile Snapshot */}
            {!sidebarCollapsed && (
              <div className="mt-4 pt-3 border-t border-white/[0.06] p-2 rounded-2xl bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300 font-bold font-mono text-xs">
                    MN
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Oliver Reed</p>
                    <p className="text-[10px] text-mist-400 truncate">EMP-0105 · Day Shift</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Dynamic Content View Area */}
        <main className="flex-1 min-w-0 w-full">
          {activeTab === 'overview' && (
            <SupervisorOverviewTab
              inspections={inspections}
              rooms={rooms}
              staffList={staffList}
              tasks={tasks}
              incidents={incidents}
              onSelectInspection={handleOpenInspection}
              onNavigateTab={(tab) => setActiveTab(tab as SupervisorTab)}
              onOpenEscalate={() => {
                setEscalateInitialRoom('');
                setIsEscalateModalOpen(true);
              }}
            />
          )}

          {activeTab === 'inspections' && (
            <SupervisorInspectionsTab
              inspections={inspections}
              onSelectInspection={handleOpenInspection}
            />
          )}

          {activeTab === 'rooms' && (
            <SupervisorRoomsTab
              rooms={rooms}
              inspections={inspections}
              onSelectInspectionByRoom={handleOpenInspectionByRoom}
              onOpenEscalateForRoom={handleOpenEscalateForRoom}
            />
          )}

          {activeTab === 'tasks' && (
            <SupervisorTasksTab
              tasks={tasks}
              staffList={staffList}
              onReviewReassignment={reviewFulfillerReassignment}
            />
          )}

          {activeTab === 'team' && (
            <SupervisorTeamTab
              staffList={staffList}
              tasks={tasks}
              inspections={inspections}
              onUpdateAvailability={updateStaffAvailability}
              onUpdateCapacity={updateStaffCapacity}
            />
          )}

          {activeTab === 'escalations' && (
            <SupervisorEscalationsTab
              incidents={incidents}
              onOpenEscalateModal={() => {
                setEscalateInitialRoom('');
                setIsEscalateModalOpen(true);
              }}
            />
          )}

          {activeTab === 'handover' && (
            <SupervisorHandoverTab
              handovers={handovers}
              tasks={tasks}
              inspections={inspections}
              incidents={incidents}
              onSubmitHandover={submitShiftHandover}
              onAcknowledgeHandover={acknowledgeShiftHandover}
            />
          )}

          {activeTab === 'reports' && (
            <SupervisorReportsTab
              inspections={inspections}
              staffList={staffList}
              rooms={rooms}
            />
          )}

          {activeTab === 'audit' && <SupervisorAuditTab auditTrail={auditTrail} />}

          {activeTab === 'notifications' && (
            <SupervisorNotificationsTab
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onClearAll={clearAllNotifications}
              onNavigateTab={(tab) => setActiveTab(tab as SupervisorTab)}
            />
          )}

          {activeTab === 'profile' && <SupervisorProfileTab />}
        </main>
      </div>

      {/* Interactive Modals */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        inspection={selectedInspection}
        onApprove={approveInspection}
        onOpenReopenModal={handleOpenReopenModal}
      />

      <ReopenTaskModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        inspection={reopenTargetInspection}
        staffList={staffList}
        onSubmit={reopenInspection}
      />

      <EscalateIssueModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        initialRoom={escalateInitialRoom}
        onSubmit={escalateSupervisorIssue}
      />
    </div>
  );
}
