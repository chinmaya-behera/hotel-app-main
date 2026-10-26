'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Layers,
  Users,
  Clock,
  Sparkles,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Flame,
  Radio,
  History,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { DispatcherOverviewTab } from '@/components/dispatcher/DispatcherOverviewTab';
import { DispatcherQueueTab } from '@/components/dispatcher/DispatcherQueueTab';
import { DispatcherWorkloadTab } from '@/components/dispatcher/DispatcherWorkloadTab';
import { DispatcherRoutingTab } from '@/components/dispatcher/DispatcherRoutingTab';
import { DispatcherSlaTab } from '@/components/dispatcher/DispatcherSlaTab';
import { DispatcherReportsTab } from '@/components/dispatcher/DispatcherReportsTab';

export type DispatcherTab = 'overview' | 'queue' | 'workload' | 'routing' | 'sla' | 'reports';

interface NavItem {
  id: DispatcherTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  badge?: number | string;
  badgeTone?: 'neutral' | 'danger' | 'warning' | 'success';
}

export function DispatcherConsole() {
  const { state } = useDemo();
  const [activeTab, setActiveTab] = useState<DispatcherTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const allTasks = state.items.department_dispatcher ?? [];
  const unassignedCount = allTasks.filter((t) => t.status === 'Unassigned' || t.status === 'Received').length;
  const overdueCount = allTasks.filter(
    (t) =>
      t.ackStatus === 'overdue' ||
      t.chip?.toLowerCase().includes('overdue') ||
      t.slaDue?.toLowerCase().includes('overdue'),
  ).length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dispatcher Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'queue',
      label: 'Dispatch Queue',
      shortLabel: 'Queue',
      icon: Layers,
      badge: unassignedCount > 0 ? unassignedCount : undefined,
      badgeTone: 'warning',
    },
    {
      id: 'workload',
      label: 'Team Workload & Roster',
      shortLabel: 'Workload',
      icon: Users,
    },
    {
      id: 'routing',
      label: 'Auto-Routing Sandbox',
      shortLabel: 'Auto-Routing',
      icon: Sparkles,
    },
    {
      id: 'sla',
      label: 'Dual SLAs & Escalations',
      shortLabel: 'SLAs',
      icon: Clock,
      badge: overdueCount > 0 ? `${overdueCount} Breach` : undefined,
      badgeTone: 'danger',
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
      {/* Main Layout: Collapsible Sidebar + Dynamic View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Collapsible Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-200 w-full ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl space-y-1 sticky top-24">
            {/* Sidebar Header & Collapse Toggle */}
            <div className="flex items-center justify-between p-2 mb-2 border-b border-white/[0.06]">
              {!sidebarCollapsed && (
                <span className="text-[10px] uppercase font-bold tracking-widest text-mist-400">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-mist-400 hover:text-white transition ml-auto"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Nav Items */}
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
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-ink-950 text-amber-300'
                            : item.badgeTone === 'danger'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Guest Portal link */}
            <div className="pt-3 border-t border-white/[0.06] mt-3">
              <a
                href="/guest/portal?room=402"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex w-full items-center gap-2.5 rounded-2xl p-2.5 text-xs font-semibold text-mist-400 hover:text-white hover:bg-white/[0.05] transition ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title="Launch Guest Mobile Web Portal"
              >
                <Smartphone className="h-4 w-4 text-sky-400 shrink-0" />
                {!sidebarCollapsed && <span>Guest Portal (402)</span>}
              </a>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'overview' && (
            <DispatcherOverviewTab onNavigateTab={(tab) => setActiveTab(tab as DispatcherTab)} />
          )}
          {activeTab === 'queue' && <DispatcherQueueTab />}
          {activeTab === 'workload' && <DispatcherWorkloadTab />}
          {activeTab === 'routing' && <DispatcherRoutingTab />}
          {activeTab === 'sla' && <DispatcherSlaTab />}
          {activeTab === 'reports' && <DispatcherReportsTab />}
        </main>
      </div>
    </div>
  );
}
