'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  HeartHandshake,
  History,
  Layers,
  MapPin,
  Menu,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { ManagerOverviewTab } from '@/components/manager/ManagerOverviewTab';
import { ManagerOperationsTab } from '@/components/manager/ManagerOperationsTab';
import { ManagerWorkforceTab } from '@/components/manager/ManagerWorkforceTab';
import { ManagerEscalationsTab } from '@/components/manager/ManagerEscalationsTab';
import { ManagerResourcesTab } from '@/components/manager/ManagerResourcesTab';
import { DutyOperationsTab } from '@/components/manager/DutyOperationsTab';
import { ManagerHandoverTab } from '@/components/manager/ManagerHandoverTab';
import { ManagerReportsTab } from '@/components/manager/ManagerReportsTab';
import { ManagerActivityTab } from '@/components/manager/ManagerActivityTab';
import { useDemo } from '@/lib/store';

export type ManagerTabId =
  | 'overview'
  | 'operations'
  | 'workforce'
  | 'escalations'
  | 'resources'
  | 'duty-ops'
  | 'handover'
  | 'reports'
  | 'activity';

interface NavItem {
  id: ManagerTabId;
  label: string;
  shortLabel: string;
  icon: any;
  group: 'Overview' | 'Operations' | 'Workforce' | 'Quality' | 'Resources' | 'Reports' | 'Account';
  badgeCount?: number;
  badgeTone?: 'warning' | 'danger' | 'info';
}

export function DutyManagerConsole() {
  const { state } = useDemo();
  const [activeTab, setActiveTab] = useState<ManagerTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scope, setScope] = useState<'department' | 'hotel'>('hotel');

  // Filter passed from overview card clicks
  const [operationsFilter, setOperationsFilter] = useState<{ status?: string; priority?: string }>({});

  const complaints = state.frontDesk.complaints ?? [];
  const openComplaintsCount = complaints.filter((c) => !c.compApplied).length;
  const activeIncidentsCount = (state.incidents ?? []).filter((i) => i.status !== 'resolved').length;
  const pendingResourcesCount = (state.resourceRequests ?? []).filter((r) => r.status === 'pending').length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      shortLabel: 'Overview',
      icon: Gauge,
      group: 'Overview',
    },
    {
      id: 'operations',
      label: 'Task Monitoring',
      shortLabel: 'Operations',
      icon: Layers,
      group: 'Operations',
    },
    {
      id: 'workforce',
      label: 'Staff & Workload',
      shortLabel: 'Workforce',
      icon: Users,
      group: 'Workforce',
    },
    {
      id: 'escalations',
      label: 'Escalations & Recovery',
      shortLabel: 'Escalations',
      icon: Siren,
      group: 'Quality',
      badgeCount: openComplaintsCount,
      badgeTone: 'danger',
    },
    {
      id: 'resources',
      label: 'Resource Requisitions',
      shortLabel: 'Resources',
      icon: Boxes,
      group: 'Resources',
      badgeCount: pendingResourcesCount,
      badgeTone: 'warning',
    },
    {
      id: 'duty-ops',
      label: 'Incident Command',
      shortLabel: 'Incidents',
      icon: ShieldAlert,
      group: 'Operations',
      badgeCount: activeIncidentsCount,
      badgeTone: 'danger',
    },
    {
      id: 'handover',
      label: 'Shift Handover Log',
      shortLabel: 'Handover',
      icon: FileText,
      group: 'Operations',
    },
    {
      id: 'reports',
      label: 'Operational Analytics',
      shortLabel: 'Analytics',
      icon: BarChart3,
      group: 'Reports',
    },
    {
      id: 'activity',
      label: 'Activity & Audit Trail',
      shortLabel: 'Audit Log',
      icon: History,
      group: 'Account',
    },
  ];

  const handleNavigateTab = (tabId: string, filter?: { status?: string; priority?: string }) => {
    setActiveTab(tabId as ManagerTabId);
    if (tabId === 'operations' && filter) {
      setOperationsFilter(filter);
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Main Console Layout: Collapsible Sidebar + Content View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Collapsible Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-200 w-full ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl space-y-1 sticky top-24">
            {/* Collapse Toggle */}
            <div className="flex items-center justify-between px-2 py-1.5 text-xs text-mist-400 border-b border-white/[0.06] mb-2">
              {!sidebarCollapsed && <span className="font-semibold uppercase text-[10px] tracking-wider text-mist-400">Navigation</span>}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-mist-400 hover:text-white transition ml-auto"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-purple-500/15 text-purple-200 border border-purple-500/30 shadow-md'
                      : 'text-mist-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-purple-300' : 'text-mist-400'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!sidebarCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.2 font-mono text-[10px] font-bold ${
                        item.badgeTone === 'danger'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.badgeTone === 'warning'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-white/10 text-mist-300'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Functional Scope Selector at Bottom of Sidebar */}
            <div className="pt-3 mt-3 border-t border-white/[0.08]">
              {!sidebarCollapsed ? (
                <div className="space-y-1.5 px-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-mist-400 block px-1">
                    Scope
                  </span>
                  <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-ink-950/80 p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setScope('department')}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition text-center ${
                        scope === 'department'
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'text-mist-400 hover:text-white'
                      }`}
                    >
                      My Dept
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope('hotel')}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition text-center ${
                        scope === 'hotel'
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'text-mist-400 hover:text-white'
                      }`}
                    >
                      Entire Hotel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setScope(scope === 'department' ? 'hotel' : 'department')}
                    title={`Current Scope: ${scope === 'department' ? 'My Department' : 'Entire Hotel'} (click to toggle)`}
                    className="h-8 w-8 rounded-xl grid place-items-center bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold"
                  >
                    {scope === 'department' ? 'DEPT' : 'ALL'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {activeTab === 'overview' && (
            <ManagerOverviewTab scope={scope} onNavigateTab={handleNavigateTab} />
          )}
          {activeTab === 'operations' && (
            <ManagerOperationsTab
              scope={scope}
              initialStatusFilter={operationsFilter.status || 'all'}
              initialPriorityFilter={operationsFilter.priority || 'all'}
            />
          )}
          {activeTab === 'workforce' && (
            <ManagerWorkforceTab
              scope={scope}
              onRequestStaffing={() => setActiveTab('resources')}
            />
          )}
          {activeTab === 'escalations' && <ManagerEscalationsTab scope={scope} />}
          {activeTab === 'resources' && <ManagerResourcesTab scope={scope} />}
          {activeTab === 'duty-ops' && <DutyOperationsTab />}
          {activeTab === 'handover' && <ManagerHandoverTab scope={scope} />}
          {activeTab === 'reports' && <ManagerReportsTab scope={scope} />}
          {activeTab === 'activity' && <ManagerActivityTab />}
        </main>
      </div>
    </div>
  );
}
