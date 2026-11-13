'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  FileSpreadsheet,
  FileText,
  Gauge,
  History,
  Layers,
  Lock,
  MessageSquareWarning,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stamp,
  User,
  Users,
  Wallet,
  Wrench,
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
  | 'profile'

interface NavItem {
  id: ExecutiveTabId;
  label: string;
  shortLabel: string;
  icon: any;
  group: 'Overview' | 'Approvals' | 'Operations' | 'Finance & Resources' | 'Insights' | 'Account';
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

  // Navbar Notifications Popover & Category State
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [notifCategory, setNotifCategory] = useState<'all' | 'safety'>('all');
  const notifPopoverRef = useRef<HTMLDivElement>(null);

  // Categorized Notifications for GM
  const gmNotifications = useMemo(() => {
    return (state.notifications ?? []).filter(
      (n) => !n.roleId || n.roleId === 'general_manager' || n.roleId === 'executive_viewer',
    );
  }, [state.notifications]);
  const unreadNotificationsCount = gmNotifications.filter((n) => !n.read).length;

  const safetyNotifications = useMemo(() => {
    return gmNotifications.filter(isSafetyAlertNotification);
  }, [gmNotifications]);

  const categorizedNotifications = useMemo(() => {
    if (notifCategory === 'safety') return safetyNotifications;
    return gmNotifications;
  }, [notifCategory, safetyNotifications, gmNotifications]);

  // Close notifications popover on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifPopoverRef.current && !notifPopoverRef.current.contains(event.target as Node)) {
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

  // Permission mode: 'approver' (full decision authority) vs 'viewer' (read-only audit)
  const [permissionMode, setPermissionMode] = useState<'viewer' | 'approver'>('approver');

  // Selected items passed into tabs
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<WorkItem | null>(null);
  const [selectedSafetyAlertId, setSelectedSafetyAlertId] = useState<string | null>(null);
  const [selectedCompensationId, setSelectedCompensationId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [approvalInitialFilter, setApprovalInitialFilter] = useState<string>('all');

  // Counts for sidebar badges
  const pendingApprovalsCount = [
    ...(state.items.general_manager ?? []),
    ...(state.items.executive_viewer ?? []),
  ].filter((i, idx, arr) => arr.findIndex((x) => x.id === i.id) === idx && i.status === 'Needs approval').length;
  const activeIncidentsCount = (state.incidents ?? []).filter((i) => i.status !== 'resolved').length;
  const unresolvedComplaintsCount = (state.frontDesk?.complaints ?? []).filter(
    (c) => !c.compApplied,
  ).length;
  const escalatedTasksCount = useMemo(() => {
    const roles = ['department_manager', 'department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'] as const;
    const seen = new Set<string>();
    let count = 0;
    roles.forEach((r) => {
      (state.items[r] ?? []).forEach((item) => {
        if (item.status === 'Escalated' || item.priority === 'critical' || item.priority === 'vip') {
          const key = item.ref || item.id;
          if (!seen.has(key)) {
            seen.add(key);
            count++;
          }
        }
      });
    });
    return count;
  }, [state.items]);
  const pendingResourcesCount = (state.resourceRequests ?? []).filter(
    (r) => r.status === 'pending',
  ).length;
  const dueInspectionsCount = (state.inspections ?? []).filter(
    (i) => i.status !== 'passed',
  ).length;
  const vipCount = (state.frontDesk?.stays ?? []).filter((s) => s.vip).length;


  const navItems: NavItem[] = [
    {
      id: 'inspections',
      label: 'Department Inspections',
      shortLabel: 'Inspections',
      icon: ShieldCheck,
      group: 'Operations',
      badgeCount: dueInspectionsCount,
    },
    // Group 1: Overview
    {
      id: 'overview',
      label: 'Executive Dashboard',
      shortLabel: 'Overview',
      icon: Gauge,
      group: 'Overview',
    },

    // Group 2: Approvals
    {
      id: 'approvals',
      label: 'Approval Center',
      shortLabel: 'Approvals',
      icon: Stamp,
      group: 'Approvals',
      badgeCount: pendingApprovalsCount,
      badgeTone: 'warning',
    },

    // Group 3: Operations
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

    // Group 4: Finance & Resources
    {
      id: 'finance-requests',
      label: 'Finance Request',
      shortLabel: 'Finance Request',
      icon: Wallet,
      group: 'Finance & Resources',
      badgeCount: pendingResourcesCount,
      badgeTone: 'info',
    },

    // Group 5: Insights
    {
      id: 'reports',
      label: 'Reports & Analytics',
      shortLabel: 'Analytics',
      icon: FileSpreadsheet,
      group: 'Insights',
    },

    // Group 6: Account
    {
      id: 'profile',
      label: 'My Profile',
      shortLabel: 'Profile',
      icon: User,
      group: 'Account',
    },
  ];

  // Group items by group
  const groupedNav = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<NavItem['group'], NavItem[]>);

  const handleNavigateTab = (tabId: string, filter?: Record<string, string>) => {
    if (tabId === 'approvals-pending') {
      setActiveTab('approvals');
      setApprovalInitialFilter('pending');
      return;
    }
    if (tabId === 'approvals-history') {
      setActiveTab('approvals');
      setApprovalInitialFilter('approved');
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

  const handleNavigateToNotificationItem = (notification: InAppNotification) => {
    markNotificationRead(notification.id);
    const { itemId } = notification;

    if (!itemId) {
      setActiveTab('approvals');
      return;
    }

    // 1. Approvals check
    const allApprovals = [
      ...(state.items.general_manager ?? []),
      ...(state.items.executive_viewer ?? []),
    ];
    const approvalMatch = allApprovals.find((i) => i.id === itemId || i.ref === itemId);
    if (approvalMatch) {
      setSelectedApprovalItem(approvalMatch);
      setSelectedSafetyAlertId(null);
      setSelectedCompensationId(null);
      setActiveTab('approvals');
      return;
    }

    // 2. Safety Alert check
    const safetyMatch = (state.safetyAlerts ?? []).find((a) => a.id === itemId || a.ref === itemId);
    if (safetyMatch) {
      setSelectedSafetyAlertId(safetyMatch.id);
      setSelectedApprovalItem(null);
      setSelectedCompensationId(null);
      setActiveTab('approvals');
      return;
    }

    // 3. Compensation check
    const compMatch = (state.compensationRequests ?? []).find((c) => c.id === itemId || c.ref === itemId);
    if (compMatch) {
      setSelectedCompensationId(compMatch.id);
      setSelectedApprovalItem(null);
      setSelectedSafetyAlertId(null);
      setActiveTab('approvals');
      return;
    }

    // 4. Incident check
    const incidentMatch = (state.incidents ?? []).find((i) => i.id === itemId || i.ref === itemId);
    if (incidentMatch) {
      setSelectedIncident(incidentMatch);
      setActiveTab('incidents');
      return;
    }

    // 5. Inspection check
    const inspectionMatch = (state.inspections ?? []).find((i) => i.id === itemId);
    if (inspectionMatch) {
      setSelectedInspectionId(inspectionMatch.id);
      setActiveTab('inspections');
      return;
    }

    // 6. Escalated tasks check
    const allTasks: WorkItem[] = [];
    (['department_manager', 'department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'] as const).forEach((r) => {
      (state.items[r] ?? []).forEach((item) => allTasks.push(item));
    });
    const taskMatch = allTasks.find((t) => t.id === itemId || t.ref === itemId);
    if (taskMatch) {
      setSelectedTaskId(taskMatch.id);
      setActiveTab('escalations');
      return;
    }

    // 7. General Fallbacks
    const lowerTitle = notification.title.toLowerCase();
    const lowerMsg = (notification.message ?? '').toLowerCase();
    if (lowerTitle.includes('incident') || lowerMsg.includes('incident') || notification.link?.includes('incident')) {
      setActiveTab('incidents');
    } else if (lowerTitle.includes('inspection') || lowerMsg.includes('inspection')) {
      setActiveTab('inspections');
    } else if (lowerTitle.includes('escalat') || lowerMsg.includes('escalat')) {
      setActiveTab('escalations');
    } else {
      setActiveTab('approvals');
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Top Command Pill: Persona Context & Mode Switcher */}
      <div className="mb-6 p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-300 grid place-items-center font-bold font-mono border border-amber-500/30">
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
              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Cap: ₹2,00,000
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-mist-400">
              Grand Azure Executive Suite · Property Health & Beyond-Manager Authority
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
              onClick={() => setNotifPopoverOpen(!notifPopoverOpen)}
              className="relative p-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-mist-300 hover:text-navy-950 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
              title="Incoming Notifications & Safety Alerts"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold hidden sm:inline">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold grid place-items-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Popover with Two Sections: All notifications & Safety Alerts */}
            {notifPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border border-white/10 bg-white/95 dark:bg-ink-900/95 shadow-2xl backdrop-blur-2xl p-4 z-50 text-navy-950 dark:text-white space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-navy-950 dark:text-white">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
                        {unreadNotificationsCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {gmNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearAllNotifications('general_manager')}
                        className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifPopoverOpen(false)}
                      className="text-slate-400 hover:text-navy-950 dark:hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Two Category Sections: All notifications & Safety Alerts */}
                <div className="grid grid-cols-2 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80 text-xs font-bold">
                  <button
                    type="button"
                    id="tab-all-notifications"
                    onClick={() => setNotifCategory('all')}
                    className={`py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      notifCategory === 'all'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    <span>All notifications</span>
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-black/10 dark:bg-white/20">
                      {gmNotifications.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="tab-safety-alerts"
                    onClick={() => setNotifCategory('safety')}
                    className={`py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      notifCategory === 'safety'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Safety Alerts</span>
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-black/10 dark:bg-white/20">
                      {safetyNotifications.length}
                    </span>
                  </button>
                </div>

                {/* Categorized Notifications List */}
                <div className="max-h-72 overflow-y-auto space-y-2 no-scrollbar pr-0.5">
                  {categorizedNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-mist-500">
                      {notifCategory === 'safety' ? (
                        <div className="space-y-1">
                          <ShieldCheck className="h-6 w-6 mx-auto text-emerald-500" />
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
                        className={`p-3 rounded-2xl border transition text-left cursor-pointer group ${
                          notif.read
                            ? 'border-slate-100 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-slate-500 dark:text-mist-400'
                            : 'border-amber-500/30 dark:border-amber-500/20 bg-amber-500/[0.05] dark:bg-amber-500/[0.08] text-navy-950 dark:text-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs group-hover:text-amber-600 dark:group-hover:text-amber-400 transition flex items-center gap-1.5">
                            {isSafetyAlertNotification(notif) && (
                              <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="line-clamp-1">{notif.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        {notif.message && (
                          <p className="text-[11px] text-slate-500 dark:text-mist-300 mt-1 line-clamp-2">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(notif.id);
                              }}
                              className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
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
          <span className="text-xs font-bold text-slate-500 dark:text-mist-400 hidden md:inline">
            Mode:
          </span>
          <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
            <button
              type="button"
              onClick={() => setPermissionMode('viewer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                permissionMode === 'viewer'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Viewer (Read-Only)</span>
            </button>
            <button
              type="button"
              onClick={() => setPermissionMode('approver')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                permissionMode === 'approver'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
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
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Collapsible Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out lg:sticky lg:top-20 z-20 self-start ${
            sidebarCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-64'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/90 p-3 backdrop-blur-xl shadow-2xl space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
            {/* Collapse Toggle */}
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 dark:text-mist-400 border-b border-slate-100 dark:border-white/[0.06] pb-2">
              {!sidebarCollapsed && (
                <span className="font-bold uppercase text-[10px] tracking-wider text-slate-400 dark:text-mist-400">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.08] text-slate-400 hover:text-navy-950 dark:hover:text-white transition ml-auto"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            {/* Grouped Navigation */}
            <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5">
              {(Object.keys(groupedNav) as Array<NavItem['group']>).map((groupName) => (
                <div key={groupName} className="space-y-1">
                  {!sidebarCollapsed && (
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-mist-500">
                      {groupName}
                    </div>
                  )}

                  {groupedNav[groupName].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                        className={`w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'text-slate-600 dark:text-mist-300 hover:bg-black/5 dark:hover:bg-white/[0.04] hover:text-navy-950 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400 dark:text-mist-400'
                            }`}
                          />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.2 font-mono text-[10px] font-bold ${
                              isActive
                                ? 'bg-white/30 text-white'
                                : item.badgeTone === 'danger'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                : item.badgeTone === 'warning'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
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
        <main className="flex-1 min-w-0 w-full">
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

          {activeTab === 'approvals' && (
            <ExecutiveApprovalsTab
              permissionMode={permissionMode}
              initialStatusFilter={approvalInitialFilter}
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
              selectedSafetyAlertId={selectedSafetyAlertId}
              onClearSelectedSafetyAlert={() => setSelectedSafetyAlertId(null)}
              selectedCompensationId={selectedCompensationId}
              onClearSelectedCompensation={() => setSelectedCompensationId(null)}
            />
          )}

          {activeTab === 'approvals-pending' && (
            <ExecutiveApprovalsTab
              permissionMode={permissionMode}
              initialStatusFilter="pending"
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
              selectedSafetyAlertId={selectedSafetyAlertId}
              onClearSelectedSafetyAlert={() => setSelectedSafetyAlertId(null)}
              selectedCompensationId={selectedCompensationId}
              onClearSelectedCompensation={() => setSelectedCompensationId(null)}
            />
          )}

          {activeTab === 'approvals-history' && (
            <ExecutiveApprovalsTab
              permissionMode={permissionMode}
              initialStatusFilter="approved"
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
              selectedSafetyAlertId={selectedSafetyAlertId}
              onClearSelectedSafetyAlert={() => setSelectedSafetyAlertId(null)}
              selectedCompensationId={selectedCompensationId}
              onClearSelectedCompensation={() => setSelectedCompensationId(null)}
            />
          )}

          {activeTab === 'performance' && <ExecutivePerformanceTab />}

          {activeTab === 'escalations' && (
            <ExecutiveIncidentsTab
              permissionMode={permissionMode}
              initialView="escalations"
              selectedIncidentFromParent={selectedIncident}
              onClearSelectedIncident={() => setSelectedIncident(null)}
              selectedTaskIdFromParent={selectedTaskId}
            />
          )}

          {activeTab === 'incidents' && (
            <ExecutiveIncidentsTab
              permissionMode={permissionMode}
              initialView="incidents"
              selectedIncidentFromParent={selectedIncident}
              onClearSelectedIncident={() => setSelectedIncident(null)}
              selectedTaskIdFromParent={selectedTaskId}
            />
          )}

          {activeTab === 'complaints' && (
            <ExecutiveIncidentsTab
              permissionMode={permissionMode}
              initialView="complaints"
              selectedIncidentFromParent={selectedIncident}
              onClearSelectedIncident={() => setSelectedIncident(null)}
              selectedTaskIdFromParent={selectedTaskId}
            />
          )}

          {activeTab === 'vip' && <GeneralManagerVipTab onNavigateTab={handleNavigateTab} />}

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

          {activeTab === 'notifications' && (
            <ExecutiveProfileTab
              permissionMode={permissionMode}
              initialSubTab="notifications"
              onTogglePermissionMode={setPermissionMode}
              onNavigateTab={handleNavigateTab}
              onNavigateToItem={handleNavigateToNotificationItem}
            />
          )}

          {activeTab === 'profile' && (
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
