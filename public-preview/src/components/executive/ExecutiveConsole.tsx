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
    <div className="w-full pb-16 bg-[#FAF9FC] text-slate-900 rounded-3xl p-4 sm:p-6 lg:p-7 shadow-sm border border-purple-100/60 font-sans">
      {/* Top Command Pill: Persona Context & Mode Switcher */}
      <div className="mb-6 p-4 rounded-3xl border border-purple-100/80 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] grid place-items-center font-bold font-mono border border-purple-200/60 shadow-xs">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">
                Priya Nair
              </span>
              <span className="text-xs text-slate-400">
                · General Manager (EMP-0109)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200/60">
                Cap: ₹2,00,000
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Grand Azure Executive Suite · Property Health &amp; Beyond-Manager Authority
            </div>
          </div>
        </div>

        {/* Permission Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 hidden md:inline">
            Mode:
          </span>
          <div className="flex items-center p-1 rounded-2xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setPermissionMode('viewer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                permissionMode === 'viewer'
                  ? 'bg-purple-100 text-purple-700 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
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
                  ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Approver (Full Access)</span>
            </button>
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
          <div className="rounded-3xl border border-purple-100/60 bg-white p-3 shadow-sm space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
            {/* Collapse Toggle */}
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 border-b border-slate-100 pb-2">
              {!sidebarCollapsed && (
                <span className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition ml-auto"
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
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                            ? 'bg-[#F3E8FF] text-[#7C3AED] shadow-xs font-bold'
                            : 'text-slate-600 hover:bg-purple-50/70 hover:text-[#7C3AED]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-[#7C3AED]' : 'text-slate-400'
                            }`}
                          />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.2 font-mono text-[10px] font-bold ${
                              isActive
                                ? 'bg-[#7C3AED] text-white'
                                : item.badgeTone === 'danger'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : item.badgeTone === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-purple-100 text-purple-700'
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

            {/* User Profile in sidebar footer (like "Daniel Okoro" in Cosmic Forge screenshot) */}
            {!sidebarCollapsed && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2.5 px-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-purple-400 text-white font-bold text-xs grid place-items-center shrink-0 shadow-xs">
                  PN
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Priya Nair</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">General Manager · Lead</p>
                </div>
              </div>
            )}
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

      {/* Footer matching Cosmic Forge screenshot */}
      <footer className="mt-12 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <p>© 2026 Cosmic Forge &amp; Grand Azure. All systems operational.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-purple-600 cursor-pointer">Docs</span>
          <span className="hover:text-purple-600 cursor-pointer">Status</span>
          <span className="hover:text-purple-600 cursor-pointer">Support</span>
        </div>
      </footer>
    </div>
  );
}
