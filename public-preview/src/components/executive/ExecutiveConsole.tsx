'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileSpreadsheet,
  Gauge,
  History,
  Lock,
  Menu,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stamp,
  User,
  Wallet,
  X,
  Layers,
  Wrench,
} from 'lucide-react';
import { ExecutiveOverviewTab } from '@/components/executive/ExecutiveOverviewTab';
import { ExecutiveApprovalsTab } from '@/components/executive/ExecutiveApprovalsTab';
import { ExecutivePerformanceTab } from '@/components/executive/ExecutivePerformanceTab';
import { ExecutiveFinanceTab } from '@/components/executive/ExecutiveFinanceTab';
import { ExecutiveIncidentsTab } from '@/components/executive/ExecutiveIncidentsTab';
import { ExecutiveReportsTab } from '@/components/executive/ExecutiveReportsTab';
import { ExecutiveProfileTab } from '@/components/executive/ExecutiveProfileTab';
import { ExecutiveAuditTab } from '@/components/executive/ExecutiveAuditTab';
import { GeneralManagerVipTab } from '@/components/executive/GeneralManagerVipTab';
import { GeneralManagerRoomsTab } from '@/components/executive/GeneralManagerRoomsTab';
import { GeneralManagerInspectionsTab } from '@/components/executive/GeneralManagerInspectionsTab';
import { GeneralManagerBroadcastTab } from '@/components/executive/GeneralManagerBroadcastTab';
import { useEmergencyBroadcast } from '@/lib/emergencyBroadcast';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { WorkItem, IncidentRecord, InAppNotification } from '@/types/demo';

export type ExecutiveTabId =
  | 'overview'
  | 'rooms'
  | 'vip'
  | 'broadcast'
  | 'front-desk-ops'
  | 'performance'
  | 'approvals'
  | 'property-health'
  | 'reports'
  | 'audit'
  | 'settings'
  // Legacy aliases for deep navigation
  | 'inspections'
  | 'incidents'
  | 'complaints'
  | 'escalations'
  | 'approvals-pending'
  | 'approvals-history'
  | 'finance'
  | 'finance-requests'
  | 'finance-purchases'
  | 'finance-equipment'
  | 'finance-resources'
  | 'profile'
  | 'notifications';

interface NavItem {
  id: ExecutiveTabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeTone?: 'warning' | 'danger' | 'info';
}

export function isSafetyAlertNotification(notif: InAppNotification): boolean {
  const cat = (notif.category || '').toLowerCase();
  const title = (notif.title || '').toLowerCase();
  const msg = (notif.message || '').toLowerCase();
  const dept = (notif.department || '').toLowerCase();
  const itemId = (notif.itemId || '').toLowerCase();

  return (
    cat === 'safety' ||
    cat === 'safety_alert' ||
    dept.includes('safety') ||
    dept.includes('security') ||
    itemId.startsWith('alert-') ||
    itemId.startsWith('alt-') ||
    itemId.startsWith('sec-') ||
    itemId.startsWith('sft-') ||
    title.includes('safety') ||
    title.includes('fire') ||
    title.includes('smoke') ||
    title.includes('hazard') ||
    title.includes('emergency') ||
    title.includes('broadcast') ||
    msg.includes('safety alert') ||
    msg.includes('life safety') ||
    msg.includes('hazard') ||
    msg.includes('evacuat') ||
    msg.includes('security')
  );
}

export function ExecutiveConsole() {
  const { state, markNotificationRead, clearAllNotifications } = useDemo();
  const { alert: emergencyAlert, isBroadcastActive } = useEmergencyBroadcast();

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<ExecutiveTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Subtab State for Composite Tabs
  const [frontDeskSubView, setFrontDeskSubView] = useState<'complaints' | 'escalations'>('complaints');
  const [propertyHealthSubView, setPropertyHealthSubView] = useState<'inspections' | 'incidents'>('inspections');

  // Permission Mode State (Viewer vs Approver)
  const [permissionMode, setPermissionMode] = useState<'viewer' | 'approver'>('approver');

  // Notifications State
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [notifCategory, setNotifCategory] = useState<'all' | 'safety'>('all');
  const notifPopoverRef = useRef<HTMLDivElement>(null);

  // Selected Item States for Deep Link Navigation
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<WorkItem | null>(null);
  const [selectedSafetyAlertId, setSelectedSafetyAlertId] = useState<string | null>(null);
  const [selectedCompensationId, setSelectedCompensationId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [approvalInitialFilter, setApprovalInitialFilter] = useState('all');

  const gmNotifications = useMemo(
    () =>
      (state.notifications ?? []).filter(
        (n) =>
          !n.roleId ||
          n.roleId === 'general_manager' ||
          n.roleId === 'executive_viewer',
      ),
    [state.notifications],
  );

  const unreadNotificationsCount = gmNotifications.filter((n) => !n.read).length;

  const safetyNotifications = useMemo(
    () => gmNotifications.filter(isSafetyAlertNotification),
    [gmNotifications],
  );

  const categorizedNotifications = useMemo(
    () => (notifCategory === 'safety' ? safetyNotifications : gmNotifications),
    [notifCategory, safetyNotifications, gmNotifications],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifPopoverRef.current &&
        !notifPopoverRef.current.contains(event.target as Node)
      ) {
        setNotifPopoverOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotifPopoverOpen(false);
        setMobileDrawerOpen(false);
      }
    }

    if (notifPopoverOpen || mobileDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifPopoverOpen, mobileDrawerOpen]);

  // Operational Counts
  const pendingApprovalsCount = [
    ...(state.items.general_manager ?? []),
    ...(state.items.executive_viewer ?? []),
  ].filter(
    (item, index, allItems) =>
      allItems.findIndex((candidate) => candidate.id === item.id) === index &&
      item.status === 'Needs approval',
  ).length;

  const activeIncidentsCount = (state.incidents ?? []).filter(
    (incident) => incident.status !== 'resolved',
  ).length;

  const unresolvedComplaintsCount = (
    state.frontDesk?.complaints ?? []
  ).filter((complaint) => !complaint.compApplied).length;

  const escalatedTasksCount = useMemo(() => {
    const roles = [
      'department_manager',
      'department_dispatcher_supervisor',
      'department_dispatcher',
      'task_fulfiller',
    ] as const;
    const seen = new Set<string>();
    let count = 0;

    roles.forEach((role) => {
      (state.items[role] ?? []).forEach((item) => {
        if (
          item.status === 'Escalated' ||
          item.priority === 'critical' ||
          item.priority === 'vip'
        ) {
          const key = item.ref || item.id;
          if (!seen.has(key)) {
            seen.add(key);
            count += 1;
          }
        }
      });
    });

    return count;
  }, [state.items]);

  const pendingResourcesCount = (state.resourceRequests ?? []).filter(
    (request) => request.status === 'pending',
  ).length;

  const dueInspectionsCount = (state.inspections ?? []).filter(
    (inspection) => inspection.status !== 'passed',
  ).length;

  const vipCount = (state.frontDesk?.stays ?? []).filter(
    (stay) => stay.vip,
  ).length;

  // 11-step Executive Hierarchy Navigation
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Executive Dashboard',
      shortLabel: 'Dashboard',
      icon: Gauge,
    },
    {
      id: 'rooms',
      label: 'Hotel-Wide Room Matrix',
      shortLabel: 'Room Matrix',
      icon: Building2,
    },
    {
      id: 'vip',
      label: 'VIP Guests',
      shortLabel: 'VIP Guests',
      icon: Crown,
      badgeCount: vipCount,
      badgeTone: 'warning',
    },
    {
      id: 'broadcast',
      label: 'Life Safety & Broadcast',
      shortLabel: 'Life Safety',
      icon: Siren,
      badgeCount: isBroadcastActive ? 1 : 0,
      badgeTone: 'danger',
    },
    {
      id: 'front-desk-ops',
      label: 'Front Desk / Guest Operations',
      shortLabel: 'Guest Operations',
      icon: MessageSquareWarning,
      badgeCount: unresolvedComplaintsCount + escalatedTasksCount,
      badgeTone: 'warning',
    },
    {
      id: 'performance',
      label: 'Department & Staff Performance',
      shortLabel: 'Performance',
      icon: BarChart3,
    },
    {
      id: 'approvals',
      label: 'Financial Overview & Approvals',
      shortLabel: 'Approvals & Finance',
      icon: Stamp,
      badgeCount: pendingApprovalsCount + pendingResourcesCount,
      badgeTone: 'warning',
    },
    {
      id: 'property-health',
      label: 'Property Health / Maintenance',
      shortLabel: 'Property Health',
      icon: ShieldCheck,
      badgeCount: dueInspectionsCount + activeIncidentsCount,
      badgeTone: 'danger',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      shortLabel: 'Reports',
      icon: FileSpreadsheet,
    },
    {
      id: 'audit',
      label: 'Audit Trail / Activity Logs',
      shortLabel: 'Audit Trail',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings & Administration',
      shortLabel: 'Settings',
      icon: User,
    },
  ];

  const handleNavigateTab = (
    tabId: string,
    filter?: Record<string, string>,
  ) => {
    if (tabId === 'approvals-pending') {
      setApprovalInitialFilter('pending');
      setActiveTab('approvals');
      return;
    }

    if (tabId === 'approvals-history') {
      setApprovalInitialFilter('approved');
      setActiveTab('approvals');
      return;
    }

    if (tabId === 'finance-requests' || tabId === 'finance') {
      setActiveTab('approvals');
      return;
    }

    if (tabId === 'approvals') {
      if (filter?.status) {
        setApprovalInitialFilter(filter.status);
      }
      setActiveTab('approvals');
      return;
    }

    if (tabId === 'complaints') {
      setFrontDeskSubView('complaints');
      setActiveTab('front-desk-ops');
      return;
    }

    if (tabId === 'escalations') {
      setFrontDeskSubView('escalations');
      setActiveTab('front-desk-ops');
      return;
    }

    if (tabId === 'inspections') {
      setPropertyHealthSubView('inspections');
      setActiveTab('property-health');
      return;
    }

    if (tabId === 'incidents') {
      setPropertyHealthSubView('incidents');
      setActiveTab('property-health');
      return;
    }

    if (tabId === 'profile' || tabId === 'notifications') {
      setActiveTab('settings');
      return;
    }

    setActiveTab(tabId as ExecutiveTabId);
  };

  const handleOpenApprovalDetail = (item: WorkItem) => {
    setSelectedApprovalItem(item);
    setActiveTab('approvals');
  };

  const handleNavigateToNotificationItem = (
    notification: InAppNotification,
  ) => {
    markNotificationRead(notification.id);
    const { itemId } = notification;

    if (!itemId) {
      setActiveTab('approvals');
      return;
    }

    const allApprovals = [
      ...(state.items.general_manager ?? []),
      ...(state.items.executive_viewer ?? []),
    ];
    const approvalMatch = allApprovals.find(
      (item) => item.id === itemId || item.ref === itemId,
    );

    if (approvalMatch) {
      setSelectedApprovalItem(approvalMatch);
      setSelectedSafetyAlertId(null);
      setSelectedCompensationId(null);
      setActiveTab('approvals');
      return;
    }

    const safetyMatch = (state.safetyAlerts ?? []).find(
      (alert) => alert.id === itemId || alert.ref === itemId,
    );

    if (safetyMatch) {
      setActiveTab('broadcast');
      return;
    }

    const compensationMatch = (state.compensationRequests ?? []).find(
      (request) => request.id === itemId || request.ref === itemId,
    );

    if (compensationMatch) {
      setSelectedCompensationId(compensationMatch.id);
      setSelectedApprovalItem(null);
      setSelectedSafetyAlertId(null);
      setActiveTab('approvals');
      return;
    }

    const incidentMatch = (state.incidents ?? []).find(
      (incident) => incident.id === itemId || incident.ref === itemId,
    );

    if (incidentMatch) {
      setSelectedIncident(incidentMatch);
      setPropertyHealthSubView('incidents');
      setActiveTab('property-health');
      return;
    }

    const inspectionMatch = (state.inspections ?? []).find(
      (inspection) => inspection.id === itemId,
    );

    if (inspectionMatch) {
      setSelectedInspectionId(inspectionMatch.id);
      setPropertyHealthSubView('inspections');
      setActiveTab('property-health');
      return;
    }

    const taskRoles = [
      'department_manager',
      'department_dispatcher_supervisor',
      'department_dispatcher',
      'task_fulfiller',
    ] as const;

    const allTasks: WorkItem[] = [];
    taskRoles.forEach((role) => {
      allTasks.push(...(state.items[role] ?? []));
    });

    const taskMatch = allTasks.find(
      (task) => task.id === itemId || task.ref === itemId,
    );

    if (taskMatch) {
      setSelectedTaskId(taskMatch.id);
      setFrontDeskSubView('escalations');
      setActiveTab('front-desk-ops');
      return;
    }

    const lowerTitle = (notification.title ?? '').toLowerCase();
    const lowerMessage = (notification.message ?? '').toLowerCase();
    const lowerLink = (notification.link ?? '').toLowerCase();

    if (lowerTitle.includes('broadcast') || lowerMessage.includes('broadcast') || lowerTitle.includes('safety')) {
      setActiveTab('broadcast');
    } else if (lowerTitle.includes('incident') || lowerMessage.includes('incident')) {
      setPropertyHealthSubView('incidents');
      setActiveTab('property-health');
    } else if (lowerTitle.includes('inspection') || lowerMessage.includes('inspection')) {
      setPropertyHealthSubView('inspections');
      setActiveTab('property-health');
    } else if (lowerTitle.includes('complaint') || lowerMessage.includes('complaint')) {
      setFrontDeskSubView('complaints');
      setActiveTab('front-desk-ops');
    } else if (lowerTitle.includes('escalat') || lowerMessage.includes('escalat')) {
      setFrontDeskSubView('escalations');
      setActiveTab('front-desk-ops');
    } else {
      setActiveTab('approvals');
    }
  };

  const activeItem = navItems.find((item) => item.id === activeTab);

  return (
    <div className="w-full pb-16">
      {/* ============================================================== */}
      {/* MOBILE TOP CONTROLS BAR (< 1024px)                             */}
      {/* ============================================================== */}
      <div className="lg:hidden mb-4 flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-ink-900/90 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-mist-200 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
              General Manager Portal
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white truncate block">
              {activeItem?.label || 'Executive Dashboard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Notifications Button */}
          <div className="relative" ref={notifPopoverRef}>
            <button
              id="gm-navbar-notifications-btn"
              type="button"
              onClick={() => setNotifPopoverOpen((open) => !open)}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-ink-950/80 text-slate-700 dark:text-mist-300 transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4 text-amber-500" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notifPopoverOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 space-y-3 rounded-2xl border border-white/10 bg-white/95 dark:bg-ink-900/95 p-4 text-navy-950 dark:text-white shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                  <span className="text-xs font-bold">Shift Notifications</span>
                  <button
                    type="button"
                    onClick={() => setNotifPopoverOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Category Filter Pills: All notifications vs Safety Alerts */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setNotifCategory('all')}
                    className={cn(
                      'flex-1 py-1 px-2 rounded-lg font-bold transition text-center',
                      notifCategory === 'all'
                        ? 'bg-amber-400 text-ink-950 shadow-sm'
                        : 'text-slate-500 dark:text-mist-400 hover:text-white'
                    )}
                  >
                    All notifications
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifCategory('safety')}
                    className={cn(
                      'flex-1 py-1 px-2 rounded-lg font-bold transition text-center flex items-center justify-center gap-1',
                      notifCategory === 'safety'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-mist-400 hover:text-rose-400'
                    )}
                  >
                    <Siren className="h-3 w-3" />
                    <span>Safety Alerts</span>
                  </button>
                </div>

                <div className="max-h-60 space-y-2 overflow-y-auto text-xs">
                  {categorizedNotifications.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No new notifications.</p>
                  ) : (
                    categorizedNotifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          handleNavigateToNotificationItem(n);
                          setNotifPopoverOpen(false);
                        }}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] cursor-pointer hover:border-amber-400/30 transition"
                      >
                        <p className="font-bold truncate text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-mist-400 line-clamp-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE RESPONSIVE NAVIGATION DRAWER                            */}
      {/* ============================================================== */}
      {mobileDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <aside className="fixed top-0 bottom-0 left-0 w-4/5 max-w-[320px] bg-white dark:bg-ink-900 border-r border-slate-200 dark:border-white/10 p-4 z-50 flex flex-col space-y-4 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-white font-bold text-xs shadow-sm">
                  GM
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">General Manager</h3>
                  <p className="text-[10px] text-slate-400 dark:text-mist-500">Executive Console</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Authority Mode Switcher in Drawer */}
            <div className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950/70 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-mist-500">
                  Authority Mode
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                  permissionMode === 'approver' ? "bg-emerald-500/20 text-emerald-500" : "bg-sky-500/20 text-sky-400"
                )}>
                  {permissionMode === 'approver' ? 'Full Access' : 'Read-Only'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setPermissionMode('viewer')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer",
                    permissionMode === 'viewer'
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-slate-500 dark:text-mist-400 hover:bg-slate-200 dark:hover:bg-white/5"
                  )}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Viewer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionMode('approver')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer",
                    permissionMode === 'approver'
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-slate-500 dark:text-mist-400 hover:bg-slate-200 dark:hover:bg-white/5"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Approval</span>
                </button>
              </div>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar pr-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition cursor-pointer",
                      isActive
                        ? "bg-amber-500 text-white shadow-sm font-bold"
                        : "text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-mist-400")} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                        isActive ? "bg-white/30 text-white" : "bg-amber-500/20 text-amber-500"
                      )}>
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </>
      )}

      {/* ============================================================== */}
      {/* MAIN DESKTOP CONSOLE LAYOUT: Sticky Sidebar + Main Content     */}
      {/* ============================================================== */}
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {/* DESKTOP STICKY SIDEBAR */}
        <aside
          className={cn(
            "hidden lg:flex flex-col shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-ink-900/90 shadow-2xl backdrop-blur-xl p-3 z-30 transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-68"
          )}
        >
          {/* Sidebar Top: Collapse Control & Notifications */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] px-2 py-1 pb-2.5 text-xs text-slate-400 dark:text-mist-400 shrink-0">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-mist-500">
                Executive Menu
              </span>
            )}

            <div className="flex items-center gap-1 ml-auto">
              {/* Notifications Popover Trigger */}
              <div className="relative" ref={notifPopoverRef}>
                <button
                  type="button"
                  onClick={() => setNotifPopoverOpen((open) => !open)}
                  className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
                  title="Shift Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4 text-amber-500" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {notifPopoverOpen && (
                  <div className="absolute left-full top-0 ml-2 z-50 w-80 space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-ink-900/95 p-4 text-navy-950 dark:text-white shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-bold">Notifications</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearAllNotifications('general_manager')}
                        className="text-[10px] font-bold text-amber-500 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    {/* Category Filter Pills: All notifications vs Safety Alerts */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setNotifCategory('all')}
                        className={cn(
                          'flex-1 py-1 px-2 rounded-lg font-bold transition text-center',
                          notifCategory === 'all'
                            ? 'bg-amber-400 text-ink-950 shadow-sm'
                            : 'text-slate-500 dark:text-mist-400 hover:text-white'
                        )}
                      >
                        All notifications
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifCategory('safety')}
                        className={cn(
                          'flex-1 py-1 px-2 rounded-lg font-bold transition text-center flex items-center justify-center gap-1',
                          notifCategory === 'safety'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-slate-500 dark:text-mist-400 hover:text-rose-400'
                        )}
                      >
                        <Siren className="h-3 w-3" />
                        <span>Safety Alerts</span>
                      </button>
                    </div>

                    <div className="max-h-64 space-y-2 overflow-y-auto text-xs no-scrollbar">
                      {categorizedNotifications.length === 0 ? (
                        <p className="text-slate-400 text-center py-4">No new notifications.</p>
                      ) : (
                        categorizedNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              handleNavigateToNotificationItem(n);
                              setNotifPopoverOpen(false);
                            }}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] cursor-pointer hover:border-amber-400/30 transition text-left"
                          >
                            <p className="font-bold truncate text-slate-900 dark:text-white">{n.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-mist-400 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Collapse/Expand Toggle */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                className="p-1 rounded-lg text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Authority Mode Switcher in Sidebar (Requirement 2) */}
          <div className="my-2.5 p-2 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-ink-950/70 space-y-1.5 shrink-0">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-mist-500">
                  Authority Mode
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                  permissionMode === 'approver' ? "bg-emerald-500/20 text-emerald-500" : "bg-sky-500/20 text-sky-400"
                )}>
                  {permissionMode === 'approver' ? 'Full Access' : 'Read-Only'}
                </span>
              </div>
            )}
            <div className={cn("grid gap-1", sidebarCollapsed ? "grid-cols-1" : "grid-cols-2")}>
              <button
                type="button"
                onClick={() => setPermissionMode('viewer')}
                title="Viewer Mode (Read-Only)"
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer",
                  permissionMode === 'viewer'
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-slate-500 dark:text-mist-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
                )}
              >
                <Lock className="h-3.5 w-3.5" />
                {!sidebarCollapsed && <span>Viewer</span>}
              </button>
              <button
                type="button"
                onClick={() => setPermissionMode('approver')}
                title="Approval Mode (Full Access)"
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer",
                  permissionMode === 'approver'
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-500 dark:text-mist-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {!sidebarCollapsed && <span>Approval</span>}
              </button>
            </div>
          </div>

          {/* Reorganised 11-Step Navigation Hierarchy (Requirement 4) */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold transition cursor-pointer",
                    isActive
                      ? "bg-amber-500 text-white shadow-md font-bold"
                      : "text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-white" : "text-slate-400 dark:text-mist-400"
                      )}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </span>

                  {!sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                        isActive
                          ? "bg-white/30 text-white"
                          : item.badgeTone === 'danger'
                            ? "border border-rose-500/30 bg-rose-500/20 text-rose-600 dark:text-rose-300"
                            : item.badgeTone === 'warning'
                              ? "border border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-300"
                              : "bg-sky-500/20 text-sky-600 dark:text-sky-300"
                      )}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* DYNAMIC EXECUTIVE TAB CONTENT AREA */}
        <main className="min-w-0 w-full flex-1">
          {/* EXACT GUEST PORTAL EMERGENCY BROADCAST BANNER (Across GM Console) */}
          {isBroadcastActive && emergencyAlert && activeTab !== 'broadcast' && activeTab !== 'overview' && (
            <div className="mb-4 p-3 sm:p-4 rounded-2xl border border-rose-500/50 bg-rose-500/15 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-rose-500/25 text-rose-400 shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-extrabold uppercase bg-rose-500 text-white tracking-wider shrink-0">
                      {emergencyAlert.severity || 'Urgent'}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{emergencyAlert.title}</p>
                  </div>
                  <p className="text-[11px] sm:text-xs text-rose-200/90 truncate mt-0.5">{emergencyAlert.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('broadcast')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition-colors shadow-sm cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          )}

          {/* 1. EXECUTIVE DASHBOARD */}
          {activeTab === 'overview' && (
            <ExecutiveOverviewTab
              permissionMode={permissionMode}
              onNavigateTab={handleNavigateTab}
              onOpenApprovalDetail={handleOpenApprovalDetail}
            />
          )}

          {/* 2. HOTEL-WIDE ROOM MATRIX */}
          {activeTab === 'rooms' && <GeneralManagerRoomsTab />}

          {/* 3. VIP GUESTS */}
          {activeTab === 'vip' && <GeneralManagerVipTab onNavigateTab={handleNavigateTab} />}

          {/* 4. LIFE SAFETY & BROADCAST */}
          {activeTab === 'broadcast' && (
            <GeneralManagerBroadcastTab permissionMode={permissionMode} />
          )}

          {/* 5. FRONT DESK / GUEST OPERATIONS (Complaints & Escalations) */}
          {activeTab === 'front-desk-ops' && (
            <div className="space-y-4">
              {/* Subtab Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFrontDeskSubView('complaints')}
                  className={cn(
                    "px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2",
                    frontDeskSubView === 'complaints'
                      ? "bg-amber-500 text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-mist-300 hover:text-white"
                  )}
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  <span>Guest Complaints</span>
                  {unresolvedComplaintsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                      {unresolvedComplaintsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFrontDeskSubView('escalations')}
                  className={cn(
                    "px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2",
                    frontDeskSubView === 'escalations'
                      ? "bg-amber-500 text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-mist-300 hover:text-white"
                  )}
                >
                  <Siren className="h-3.5 w-3.5" />
                  <span>Escalated Guest Tasks</span>
                  {escalatedTasksCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-ink-950 font-mono font-bold">
                      {escalatedTasksCount}
                    </span>
                  )}
                </button>
              </div>

              <ExecutiveIncidentsTab
                permissionMode={permissionMode}
                initialView={frontDeskSubView}
                selectedTaskIdFromParent={selectedTaskId}
              />
            </div>
          )}

          {/* 6. DEPARTMENT & STAFF PERFORMANCE */}
          {activeTab === 'performance' && <ExecutivePerformanceTab />}

          {/* 7. FINANCIAL OVERVIEW & APPROVALS */}
          {(activeTab === 'approvals' ||
            activeTab === 'approvals-pending' ||
            activeTab === 'approvals-history' ||
            activeTab === 'finance' ||
            activeTab === 'finance-requests') && (
            <ExecutiveApprovalsTab
              permissionMode={permissionMode}
              initialStatusFilter={
                activeTab === 'approvals-pending'
                  ? 'pending'
                  : activeTab === 'approvals-history'
                    ? 'approved'
                    : approvalInitialFilter
              }
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
              selectedSafetyAlertId={selectedSafetyAlertId}
              onClearSelectedSafetyAlert={() => setSelectedSafetyAlertId(null)}
              selectedCompensationId={selectedCompensationId}
              onClearSelectedCompensation={() => setSelectedCompensationId(null)}
            />
          )}

          {/* 8. PROPERTY HEALTH / MAINTENANCE */}
          {activeTab === 'property-health' && (
            <div className="space-y-4">
              {/* Subtab Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPropertyHealthSubView('inspections')}
                  className={cn(
                    "px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2",
                    propertyHealthSubView === 'inspections'
                      ? "bg-amber-500 text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-mist-300 hover:text-white"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Department Inspections</span>
                  {dueInspectionsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-500 font-mono">
                      {dueInspectionsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyHealthSubView('incidents')}
                  className={cn(
                    "px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2",
                    propertyHealthSubView === 'incidents'
                      ? "bg-amber-500 text-white shadow-sm font-bold"
                      : "text-slate-600 dark:text-mist-300 hover:text-white"
                  )}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Property Incidents</span>
                  {activeIncidentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                      {activeIncidentsCount}
                    </span>
                  )}
                </button>
              </div>

              {propertyHealthSubView === 'inspections' ? (
                <GeneralManagerInspectionsTab
                  selectedInspectionId={selectedInspectionId}
                  onClearSelectedInspection={() => setSelectedInspectionId(null)}
                />
              ) : (
                <ExecutiveIncidentsTab
                  permissionMode={permissionMode}
                  initialView="incidents"
                  selectedIncidentFromParent={selectedIncident}
                  onClearSelectedIncident={() => setSelectedIncident(null)}
                />
              )}
            </div>
          )}

          {/* 9. REPORTS & ANALYTICS */}
          {activeTab === 'reports' && <ExecutiveReportsTab />}

          {/* 10. AUDIT TRAIL / ACTIVITY LOGS */}
          {activeTab === 'audit' && <ExecutiveAuditTab />}

          {/* 11. SETTINGS & ADMINISTRATION */}
          {activeTab === 'settings' && (
            <ExecutiveProfileTab
              permissionMode={permissionMode}
              initialSubTab="profile"
              onTogglePermissionMode={setPermissionMode}
              onNavigateTab={handleNavigateTab}
              onNavigateToItem={handleNavigateToNotificationItem}
            />
          )}
        </main>
      </div>
    </div>
  );
}
