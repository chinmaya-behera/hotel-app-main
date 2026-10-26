'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Gauge,
  History,
  Hotel,
  KeyRound,
  LayoutDashboard,
  Layers,
  Lock,
  LogOut,
  QrCode,
  Radio,
  RefreshCw,
  Server,
  Settings2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { StaffRosterTab } from '@/components/admin/StaffRosterTab';
import { RoomQrTab } from '@/components/admin/RoomQrTab';
import { WorkflowConfigTab } from '@/components/admin/WorkflowConfigTab';
import { IntegrationsTab } from '@/components/admin/IntegrationsTab';
import { AuditTrailTab } from '@/components/admin/AuditTrailTab';
import { EnvironmentTab } from '@/components/admin/EnvironmentTab';
import { useDemo } from '@/lib/store';
import { roles } from '@/lib/roles';

export type AdminTab = 'overview' | 'users' | 'rooms' | 'workflow' | 'integrations' | 'audit' | 'environment';

interface NavItem {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  badge?: number | string;
  badgeTone?: 'neutral' | 'danger' | 'warning' | 'success';
}

export function AdminConsole() {
  const { state } = useDemo();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dynamic badges for sidebar
  const pendingStaffCount = state.items.platform_admin.filter((i) => i.status === 'Pending').length;
  const revokedQrCount = state.revokedRooms.length;
  const syncFailedCount = state.frontDesk.sync.filter((s) => s.bookingState === 'PMS_Sync_Failed').length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'System Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: pendingStaffCount > 0 ? pendingStaffCount : undefined,
      badgeTone: 'warning',
    },
    {
      id: 'users',
      label: 'Staff & RBAC Accounts',
      shortLabel: 'Staff RBAC',
      icon: Users,
    },
    {
      id: 'rooms',
      label: 'Rooms & QR Code Tokens',
      shortLabel: 'Room QRs',
      icon: QrCode,
      badge: revokedQrCount > 0 ? `${revokedQrCount} Revoked` : undefined,
      badgeTone: 'danger',
    },
    {
      id: 'workflow',
      label: 'Dual SLAs & Workflows',
      shortLabel: 'Workflows',
      icon: Clock,
    },
    {
      id: 'integrations',
      label: 'Gateways & Sync Reconcile',
      shortLabel: 'Integrations',
      icon: Server,
      badge: syncFailedCount > 0 ? `${syncFailedCount} Failed` : undefined,
      badgeTone: 'danger',
    },
    {
      id: 'audit',
      label: 'Immutable Audit Trail',
      shortLabel: 'Audit Trail',
      icon: History,
    },
    {
      id: 'environment',
      label: 'Environment & Demo Data',
      shortLabel: 'Environment',
      icon: Database,
    },
  ];

  return (
    <div className="w-full pb-16">
      {/* Main Admin Console Layout: Collapsible Sidebar + Content View */}
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

            {/* In-Room Portal Link in Sidebar */}
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
            <AdminOverviewTab onNavigateTab={(tab) => setActiveTab(tab as AdminTab)} />
          )}
          {activeTab === 'users' && <StaffRosterTab />}
          {activeTab === 'rooms' && <RoomQrTab />}
          {activeTab === 'workflow' && <WorkflowConfigTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'audit' && <AuditTrailTab />}
          {activeTab === 'environment' && <EnvironmentTab />}
        </main>
      </div>
    </div>
  );
}
