'use client';

import { useState } from 'react';
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
  SlidersHorizontal,
  Stamp,
  User,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { ExecutiveOverviewTab } from '@/components/executive/ExecutiveOverviewTab';
import { ExecutiveApprovalsTab } from '@/components/executive/ExecutiveApprovalsTab';
import { ExecutivePerformanceTab } from '@/components/executive/ExecutivePerformanceTab';
import { ExecutiveFinanceTab } from '@/components/executive/ExecutiveFinanceTab';
import { ExecutiveIncidentsTab } from '@/components/executive/ExecutiveIncidentsTab';
import { ExecutiveReportsTab } from '@/components/executive/ExecutiveReportsTab';
import { ExecutiveAuditTab } from '@/components/executive/ExecutiveAuditTab';
import { ExecutiveProfileTab } from '@/components/executive/ExecutiveProfileTab';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';

export type ExecutiveTabId =
  | 'overview'
  | 'approvals'
  | 'approvals-pending'
  | 'approvals-history'
  | 'performance'
  | 'escalations'
  | 'incidents'
  | 'complaints'
  | 'finance-purchases'
  | 'finance-equipment'
  | 'finance-resources'
  | 'reports'
  | 'audit'
  | 'notifications'
  | 'profile'
  | 'settings';

interface NavItem {
  id: ExecutiveTabId;
  label: string;
  shortLabel: string;
  icon: any;
  group: 'Overview' | 'Approvals' | 'Operations' | 'Finance & Resources' | 'Insights' | 'Account';
  badgeCount?: number;
  badgeTone?: 'warning' | 'danger' | 'info';
}

export function ExecutiveConsole() {
  const { state } = useDemo();
  const [activeTab, setActiveTab] = useState<ExecutiveTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Permission mode: 'approver' (full decision authority) vs 'viewer' (read-only audit)
  const [permissionMode, setPermissionMode] = useState<'viewer' | 'approver'>('approver');

  // Selected item passed into approvals drawer
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<WorkItem | null>(null);

  // Counts for sidebar badges
  const pendingApprovalsCount = (state.items.executive_viewer ?? []).filter(
    (i) => i.status === 'Needs approval',
  ).length;
  const activeIncidentsCount = (state.incidents ?? []).filter((i) => i.status !== 'resolved').length;
  const unresolvedComplaintsCount = (state.frontDesk.complaints ?? []).filter(
    (c) => !c.compApplied,
  ).length;
  const pendingResourcesCount = (state.resourceRequests ?? []).filter(
    (r) => r.status === 'pending',
  ).length;
  const unreadNotificationsCount = (state.notifications ?? []).filter((n) => !n.read).length;

  const navItems: NavItem[] = [
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
    },
    {
      id: 'approvals-pending',
      label: 'Pending Approvals',
      shortLabel: 'Pending',
      icon: Clock,
      group: 'Approvals',
      badgeCount: pendingApprovalsCount,
      badgeTone: 'warning',
    },
    {
      id: 'approvals-history',
      label: 'Approval History',
      shortLabel: 'History',
      icon: History,
      group: 'Approvals',
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
    },
    {
      id: 'incidents',
      label: 'Critical Incidents',
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

    // Group 4: Finance & Resources
    {
      id: 'finance-purchases',
      label: 'Purchase Requests',
      shortLabel: 'Purchases',
      icon: Wallet,
      group: 'Finance & Resources',
    },
    {
      id: 'finance-equipment',
      label: 'Equipment & Maintenance',
      shortLabel: 'Equipment',
      icon: Wrench,
      group: 'Finance & Resources',
    },
    {
      id: 'finance-resources',
      label: 'Resource Requests',
      shortLabel: 'Resources',
      icon: Boxes,
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
    {
      id: 'audit',
      label: 'Audit Log',
      shortLabel: 'Audit',
      icon: ShieldCheck,
      group: 'Insights',
    },

    // Group 6: Account
    {
      id: 'notifications',
      label: 'Notifications',
      shortLabel: 'Alerts',
      icon: Bell,
      group: 'Account',
      badgeCount: unreadNotificationsCount,
      badgeTone: 'info',
    },
    {
      id: 'profile',
      label: 'My Profile',
      shortLabel: 'Profile',
      icon: User,
      group: 'Account',
    },
    {
      id: 'settings',
      label: 'Settings',
      shortLabel: 'Settings',
      icon: SlidersHorizontal,
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
    setActiveTab(tabId as ExecutiveTabId);
  };

  const handleOpenApprovalDetail = (item: WorkItem) => {
    setSelectedApprovalItem(item);
    setActiveTab('approvals');
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
                Alex Morgan
              </span>
              <span className="text-xs text-slate-400 dark:text-mist-500">
                · General Manager (EMP-0109)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Cap: ₹2,00,000
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-mist-400">
              Atelier Executive Suite · Property Health & Beyond-Manager Authority
            </div>
          </div>
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

      {/* Main Console Layout: Collapsible Sidebar + Content View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Collapsible Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-200 w-full ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl space-y-3 sticky top-24">
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
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
            />
          )}

          {activeTab === 'approvals-pending' && (
            <ExecutiveApprovalsTab
              permissionMode={permissionMode}
              initialStatusFilter="pending"
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
            />
          )}

          {activeTab === 'approvals-history' && (
            <ExecutiveApprovalsTab
              permissionMode={permissionMode}
              initialStatusFilter="approved"
              selectedItemFromParent={selectedApprovalItem}
              onClearSelectedItem={() => setSelectedApprovalItem(null)}
            />
          )}

          {activeTab === 'performance' && <ExecutivePerformanceTab />}

          {activeTab === 'escalations' && (
            <ExecutiveIncidentsTab
              permissionMode={permissionMode}
              initialView="escalations"
            />
          )}

          {activeTab === 'incidents' && (
            <ExecutiveIncidentsTab
              permissionMode={permissionMode}
              initialView="incidents"
            />
          )}

          {activeTab === 'complaints' && (
            <ExecutiveIncidentsTab
              permissionMode={permissionMode}
              initialView="complaints"
            />
          )}

          {activeTab === 'finance-purchases' && (
            <ExecutiveFinanceTab
              permissionMode={permissionMode}
              initialCategory="purchases"
              onReviewItem={handleOpenApprovalDetail}
            />
          )}

          {activeTab === 'finance-equipment' && (
            <ExecutiveFinanceTab
              permissionMode={permissionMode}
              initialCategory="equipment"
              onReviewItem={handleOpenApprovalDetail}
            />
          )}

          {activeTab === 'finance-resources' && (
            <ExecutiveFinanceTab
              permissionMode={permissionMode}
              initialCategory="resources"
              onReviewItem={handleOpenApprovalDetail}
            />
          )}

          {activeTab === 'reports' && <ExecutiveReportsTab />}

          {activeTab === 'audit' && <ExecutiveAuditTab />}

          {activeTab === 'notifications' && (
            <ExecutiveProfileTab
              permissionMode={permissionMode}
              initialSubTab="notifications"
              onTogglePermissionMode={setPermissionMode}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'profile' && (
            <ExecutiveProfileTab
              permissionMode={permissionMode}
              initialSubTab="profile"
              onTogglePermissionMode={setPermissionMode}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'settings' && (
            <ExecutiveProfileTab
              permissionMode={permissionMode}
              initialSubTab="settings"
              onTogglePermissionMode={setPermissionMode}
              onNavigateTab={handleNavigateTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
