'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileSpreadsheet,
  Gauge,
  Lock,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stamp,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { ExecutiveOverviewTab } from '@/components/executive/ExecutiveOverviewTab';
import { ExecutiveApprovalsTab } from '@/components/executive/ExecutiveApprovalsTab';
import { ExecutivePerformanceTab } from '@/components/executive/ExecutivePerformanceTab';
import { ExecutiveFinanceTab } from '@/components/executive/ExecutiveFinanceTab';
import { ExecutiveIncidentsTab } from '@/components/executive/ExecutiveIncidentsTab';
import { ExecutiveReportsTab } from '@/components/executive/ExecutiveReportsTab';
import { ExecutiveProfileTab } from '@/components/executive/ExecutiveProfileTab';
import { GeneralManagerVipTab } from '@/components/executive/GeneralManagerVipTab';
import { GeneralManagerRoomsTab } from '@/components/executive/GeneralManagerRoomsTab';
import { GeneralManagerInspectionsTab } from '@/components/executive/GeneralManagerInspectionsTab';
import { useDemo } from '@/lib/store';
import type { WorkItem, IncidentRecord, InAppNotification } from '@/types/demo';

export type ExecutiveTabId =
  | 'inspections'
  | 'overview'
  | 'approvals'
  | 'approvals-pending'
  | 'approvals-history'
  | 'performance'
  | 'escalations'
  | 'incidents'
  | 'complaints'
  | 'vip'
  | 'rooms'
  | 'finance'
  | 'finance-requests'
  | 'finance-purchases'
  | 'finance-equipment'
  | 'finance-resources'
  | 'reports'
  | 'audit'
  | 'notifications'
  | 'profile';

type NavGroup =
  | 'Overview'
  | 'Approvals'
  | 'Operations'
  | 'Finance & Resources'
  | 'Insights'
  | 'Account';

interface NavItem {
  id: ExecutiveTabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  group: NavGroup;
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
  const [activeTab, setActiveTab] = useState<ExecutiveTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [notifCategory, setNotifCategory] = useState<'all' | 'safety'>('all');
  const notifPopoverRef = useRef<HTMLDivElement>(null);

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
      }
    }

    if (notifPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifPopoverOpen]);

  const [permissionMode, setPermissionMode] = useState<'viewer' | 'approver'>(
    'approver',
  );

  const [selectedApprovalItem, setSelectedApprovalItem] =
    useState<WorkItem | null>(null);
  const [selectedSafetyAlertId, setSelectedSafetyAlertId] = useState<
    string | null
  >(null);
  const [selectedCompensationId, setSelectedCompensationId] = useState<
    string | null
  >(null);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentRecord | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<
    string | null
  >(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [approvalInitialFilter, setApprovalInitialFilter] = useState('all');

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

  const navItems: NavItem[] = [
    {
      id: 'inspections',
      label: 'Department Inspections',
      shortLabel: 'Inspections',
      icon: ShieldCheck,
      group: 'Operations',
      badgeCount: dueInspectionsCount,
    },
    {
      id: 'overview',
      label: 'Executive Dashboard',
      shortLabel: 'Overview',
      icon: Gauge,
      group: 'Overview',
    },
    {
      id: 'approvals',
      label: 'Approval Center',
      shortLabel: 'Approvals',
      icon: Stamp,
      group: 'Approvals',
      badgeCount: pendingApprovalsCount,
      badgeTone: 'warning',
    },
    {
      id: 'performance',
      label: 'Department Performance',
      shortLabel: 'Performance',
      icon: BarChart3,
      group: 'Operations',
    },
    {
      id: 'escalations',
      label: 'Escalations',
      shortLabel: 'Escalations',
      icon: Siren,
      group: 'Operations',
      badgeCount: escalatedTasksCount,
      badgeTone: 'warning',
    },
    {
      id: 'incidents',
      label: 'Property Incidents',
      shortLabel: 'Incidents',
      icon: ShieldAlert,
      group: 'Operations',
      badgeCount: activeIncidentsCount,
      badgeTone: 'danger',
    },
    {
      id: 'complaints',
      label: 'Guest Complaints',
      shortLabel: 'Complaints',
      icon: MessageSquareWarning,
      group: 'Operations',
      badgeCount: unresolvedComplaintsCount,
      badgeTone: 'warning',
    },
    {
      id: 'vip',
      label: 'VIP Guests',
      shortLabel: 'VIP Guests',
      icon: Crown,
      group: 'Operations',
      badgeCount: vipCount,
      badgeTone: 'warning',
    },
    {
      id: 'rooms',
      label: 'Hotel-Wide Room Matrix',
      shortLabel: 'Rooms & Inventory',
      icon: Building2,
      group: 'Operations',
    },
    {
      id: 'finance-requests',
      label: 'Finance Request',
      shortLabel: 'Finance Request',
      icon: Wallet,
      group: 'Finance & Resources',
      badgeCount: pendingResourcesCount,
      badgeTone: 'info',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      shortLabel: 'Analytics',
      icon: FileSpreadsheet,
      group: 'Insights',
    },
    {
      id: 'profile',
      label: 'My Profile',
      shortLabel: 'Profile',
      icon: User,
      group: 'Account',
    },
  ];

  const groupedNav = navItems.reduce(
    (groups, item) => {
      (groups[item.group] ??= []).push(item);
      return groups;
    },
    {} as Partial<Record<NavGroup, NavItem[]>>,
  );

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
      setActiveTab('finance-requests');
      return;
    }

    if (tabId === 'approvals') {
      if (filter?.status) {
        setApprovalInitialFilter(filter.status);
      }
      setActiveTab('approvals');
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
      setSelectedSafetyAlertId(safetyMatch.id);
      setSelectedApprovalItem(null);
      setSelectedCompensationId(null);
      setActiveTab('approvals');
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
      setActiveTab('incidents');
      return;
    }

    const inspectionMatch = (state.inspections ?? []).find(
      (inspection) => inspection.id === itemId,
    );

    if (inspectionMatch) {
      setSelectedInspectionId(inspectionMatch.id);
      setActiveTab('inspections');
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
      setActiveTab('escalations');
      return;
    }

    const lowerTitle = (notification.title ?? '').toLowerCase();
    const lowerMessage = (notification.message ?? '').toLowerCase();
    const lowerLink = (notification.link ?? '').toLowerCase();

    if (
      lowerTitle.includes('incident') ||
      lowerMessage.includes('incident') ||
      lowerLink.includes('incident')
    ) {
      setActiveTab('incidents');
    } else if (
      lowerTitle.includes('inspection') ||
      lowerMessage.includes('inspection')
    ) {
      setActiveTab('inspections');
    } else if (
      lowerTitle.includes('escalat') ||
      lowerMessage.includes('escalat')
    ) {
      setActiveTab('escalations');
    } else {
      setActiveTab('approvals');
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Top Command Pill: Persona Context & Mode Switcher */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/70 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center dark:bg-ink-900/80">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/20 font-mono font-bold text-amber-500 dark:text-amber-300">
            <Crown className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-navy-950 dark:text-white">
                Priya Nair
              </span>
              <span className="text-xs text-slate-400 dark:text-mist-500">
                · General Manager (EMP-0109)
              </span>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                Cap: ₹2,00,000
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-mist-400">
              Grand Azure Executive Suite · Property Health &amp; Beyond-Manager
              Authority
            </div>
          </div>
        </div>

        {/* Navbar Controls: Notifications & Permission Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* Notifications in Navbar */}
          <div className="relative" ref={notifPopoverRef}>
            <button
              type="button"
              id="gm-navbar-notifications-btn"
              onClick={() => setNotifPopoverOpen((open) => !open)}
              className="relative flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-black/5 p-2 text-slate-700 transition hover:bg-black/10 hover:text-navy-950 dark:border-white/10 dark:bg-ink-950/80 dark:text-mist-300 dark:hover:bg-white/10 dark:hover:text-white"
              title="Incoming Notifications & Safety Alerts"
              aria-label="Notifications"
              aria-expanded={notifPopoverOpen}
            >
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="hidden text-xs font-bold sm:inline">
                Notifications
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="grid h-5 min-w-5 animate-pulse place-items-center rounded-full bg-rose-500 px-1.5 font-mono text-[10px] font-bold text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notifPopoverOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 space-y-3 rounded-3xl border border-white/10 bg-white/95 p-4 text-navy-950 shadow-2xl backdrop-blur-2xl sm:w-96 dark:bg-ink-900/95 dark:text-white">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-600 dark:text-rose-300">
                        {unreadNotificationsCount} unread
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {gmNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          clearAllNotifications('general_manager')
                        }
                        className="cursor-pointer text-[11px] font-semibold text-amber-600 hover:underline dark:text-amber-400"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifPopoverOpen(false)}
                      className="cursor-pointer text-slate-400 hover:text-navy-950 dark:hover:text-white"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-black/5 p-1 text-xs font-bold dark:border-white/10 dark:bg-ink-950/80">
                  <button
                    type="button"
                    id="tab-all-notifications"
                    onClick={() => setNotifCategory('all')}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 transition ${notifCategory === 'all'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-navy-950 dark:text-mist-400 dark:hover:text-white'
                      }`}
                  >
                    <span>All notifications</span>
                    <span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/20">
                      {gmNotifications.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="tab-safety-alerts"
                    onClick={() => setNotifCategory('safety')}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 transition ${notifCategory === 'safety'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-navy-950 dark:text-mist-400 dark:hover:text-white'
                      }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Safety Alerts</span>
                    <span className="rounded-full bg-black/10 px-1.5 font-mono text-[10px] dark:bg-white/20">
                      {safetyNotifications.length}
                    </span>
                  </button>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5 no-scrollbar">
                  {categorizedNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-mist-500">
                      {notifCategory === 'safety' ? (
                        <div className="space-y-1">
                          <ShieldCheck className="mx-auto h-6 w-6 text-emerald-500" />
                          <p>Zero active safety alerts. All systems secure.</p>
                        </div>
                      ) : (
                        <p>No incoming notifications for your shift.</p>
                      )}
                    </div>
                  ) : (
                    categorizedNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          handleNavigateToNotificationItem(notif);
                          setNotifPopoverOpen(false);
                        }}
                        className={`group cursor-pointer rounded-2xl border p-3 text-left transition ${notif.read
                            ? 'border-slate-100 bg-black/[0.02] text-slate-500 dark:border-white/5 dark:bg-white/[0.02] dark:text-mist-400'
                            : 'border-amber-500/30 bg-amber-500/[0.05] text-navy-950 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-white'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold transition group-hover:text-amber-600 dark:group-hover:text-amber-400">
                            {isSafetyAlertNotification(notif) && (
                              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                            )}
                            <span className="line-clamp-1">{notif.title}</span>
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-slate-400">
                            {notif.timestamp}
                          </span>
                        </div>

                        {notif.message && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-mist-300">
                            {notif.message}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-400">
                            {notif.department || 'Property-Wide'}
                          </span>
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                markNotificationRead(notif.id);
                              }}
                              className="font-bold text-amber-600 hover:underline dark:text-amber-400"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Permission Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-slate-500 dark:text-mist-400 md:inline">
              Mode:
            </span>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-black/5 p-1 dark:border-white/10 dark:bg-ink-950/80">
              <button
                type="button"
                onClick={() => setPermissionMode('viewer')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${permissionMode === 'viewer'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-navy-950 dark:text-mist-400 dark:hover:text-white'
                  }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Viewer (Read-Only)</span>
              </button>
              <button
                type="button"
                onClick={() => setPermissionMode('approver')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${permissionMode === 'approver'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-navy-950 dark:text-mist-400 dark:hover:text-white'
                  }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Approver (Full Access)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Console Layout: Collapsible Sidebar + Content View */}
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <aside
          className={`z-20 shrink-0 self-start transition-all duration-300 ease-in-out lg:sticky lg:top-20 ${sidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-64'
            }`}
        >
          <div className="max-h-[calc(100vh-6rem)] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-white/70 p-3 shadow-2xl backdrop-blur-xl no-scrollbar dark:bg-ink-900/90">
            <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1 pb-2 text-xs text-slate-400 dark:border-white/[0.06] dark:text-mist-400">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                className="ml-auto rounded-lg p-1 text-slate-400 transition hover:bg-black/5 hover:text-navy-950 dark:hover:bg-white/[0.08] dark:hover:text-white"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={
                  sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto pr-0.5">
              {(Object.keys(groupedNav) as NavGroup[]).map((groupName) => (
                <div key={groupName} className="space-y-1">
                  {!sidebarCollapsed && (
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-mist-500">
                      {groupName}
                    </div>
                  )}

                  {(groupedNav[groupName] ?? []).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold transition ${isActive
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'text-slate-600 hover:bg-black/5 hover:text-navy-950 dark:text-mist-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
                          }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${isActive
                                ? 'text-white'
                                : 'text-slate-400 dark:text-mist-400'
                              }`}
                          />
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </span>

                        {!sidebarCollapsed &&
                          item.badgeCount !== undefined &&
                          item.badgeCount > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${isActive
                                  ? 'bg-white/30 text-white'
                                  : item.badgeTone === 'danger'
                                    ? 'border border-rose-500/30 bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                    : item.badgeTone === 'warning'
                                      ? 'border border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                      : 'bg-sky-500/20 text-sky-600 dark:text-sky-300'
                                }`}
                            >
                              {item.badgeCount}
                            </span>
                          )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Dynamic Tab Content Area */}
        <main className="min-w-0 w-full flex-1">
          {activeTab === 'inspections' && (
            <GeneralManagerInspectionsTab
              selectedInspectionId={selectedInspectionId}
              onClearSelectedInspection={() => setSelectedInspectionId(null)}
            />
          )}

          {activeTab === 'overview' && (
            <ExecutiveOverviewTab
              permissionMode={permissionMode}
              onNavigateTab={handleNavigateTab}
              onOpenApprovalDetail={handleOpenApprovalDetail}
            />
          )}

          {(activeTab === 'approvals' ||
            activeTab === 'approvals-pending' ||
            activeTab === 'approvals-history') && (
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

          {activeTab === 'performance' && <ExecutivePerformanceTab />}

          {(activeTab === 'escalations' ||
            activeTab === 'incidents' ||
            activeTab === 'complaints') && (
              <ExecutiveIncidentsTab
                permissionMode={permissionMode}
                initialView={
                  activeTab === 'escalations'
                    ? 'escalations'
                    : activeTab === 'complaints'
                      ? 'complaints'
                      : 'incidents'
                }
                selectedIncidentFromParent={selectedIncident}
                onClearSelectedIncident={() => setSelectedIncident(null)}
                selectedTaskIdFromParent={selectedTaskId}
              />
            )}

          {activeTab === 'vip' && (
            <GeneralManagerVipTab onNavigateTab={handleNavigateTab} />
          )}

          {activeTab === 'rooms' && <GeneralManagerRoomsTab />}

          {(activeTab === 'finance-requests' ||
            activeTab === 'finance' ||
            activeTab === 'finance-purchases' ||
            activeTab === 'finance-equipment' ||
            activeTab === 'finance-resources') && (
              <ExecutiveFinanceTab
                permissionMode={permissionMode}
                initialCategory={
                  activeTab === 'finance-purchases'
                    ? 'purchases'
                    : activeTab === 'finance-equipment'
                      ? 'equipment'
                      : activeTab === 'finance-resources'
                        ? 'resources'
                        : 'all'
                }
                onReviewItem={handleOpenApprovalDetail}
              />
            )}

          {activeTab === 'reports' && <ExecutiveReportsTab />}

          {(activeTab === 'notifications' || activeTab === 'profile') && (
            <ExecutiveProfileTab
              permissionMode={permissionMode}
              initialSubTab={
                activeTab === 'notifications' ? 'notifications' : 'profile'
              }
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