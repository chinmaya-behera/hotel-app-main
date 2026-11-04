'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { ChevronRight, LayoutGrid, Activity } from 'lucide-react';
import { TONE_ICONS } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FeedList } from '@/components/shared/FeedList';
import { StatCard } from '@/components/shared/StatCard';
import { TopBar } from '@/components/shared/TopBar';
import { FrontDeskConsole } from '@/components/frontdesk/FrontDeskConsole';
import { AdminConsole } from '@/components/admin/AdminConsole';
import { DispatcherSupervisorConsole } from '@/components/dispatcher-supervisor/DispatcherSupervisorConsole';
import { DispatcherConsole } from '@/components/dispatcher/DispatcherConsole';
import { FulfillerApp } from '@/components/staff/fulfiller/FulfillerApp';
import { DepartmentManagerConsole } from '@/components/manager/DepartmentManagerConsole';
import { ExecutiveConsole } from '@/components/executive/ExecutiveConsole';
import { SecurityApp } from '@/components/staff/security/SecurityApp';
import { FinanceConsole } from '@/components/finance/FinanceConsole';
import { SupervisorConsole } from '@/components/supervisor/SupervisorConsole';
import { SideWidgetView } from '@/components/staff/SideWidgets';
import { WorkList } from '@/components/staff/WorkList';
import { dashboards } from '@/lib/dashboards';
import { roleById } from '@/lib/roles';
import { useDemo } from '@/lib/store';
import { accentVars, cn } from '@/lib/utils';
import type { RoleId, Tone, WorkItem } from '@/types/demo';

const BANNER_TONE: Record<Tone, string> = {
  neutral: 'border-white/10 bg-white/5 text-mist-200',
  info: 'border-sky-400/25 bg-sky-400/[0.07] text-sky-200',
  success: 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200',
  warning: 'border-amber-300/25 bg-amber-300/[0.07] text-amber-100',
  danger: 'border-rose-400/30 bg-rose-500/[0.08] text-rose-100',
  accent: 'border-white/10 bg-white/5 text-mist-200',
};

export function RoleDashboard({ roleId }: { roleId: RoleId }) {
  const role = roleById[roleId];
  const cfg = dashboards[roleId];
  const { state, setPersona } = useDemo();

  useEffect(() => {
    setPersona(roleId);
  }, [roleId, setPersona]);

  // Mobile-first Security Responder app for Hotel Security Officers
  if (roleId === 'security_responder') {
    return <SecurityApp />;
  }

  // Mobile-first dedicated Fulfiller app for Task Fulfillers (Attendants, Runners, Technicians)
  if (roleId === 'task_fulfiller') {
    return <FulfillerApp />;
  }

  // Combined Department Dispatcher / Supervisor console
  if (
    roleId === 'department_dispatcher_supervisor' ||
    roleId === 'department_dispatcher' ||
    roleId === 'department_supervisor'
  ) {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 pt-4 pb-20">
          <DispatcherSupervisorConsole />
        </main>
      </div>
    );
  }

  // Platform Admin has its own full-width administrative console
  if (roleId === 'platform_admin') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
          <AdminConsole />
        </main>
      </div>
    );
  }

  // Front Desk Coordinator enterprise console (Full desktop width, polished)
  if (roleId === 'front_desk_coordinator') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
          <FrontDeskConsole />
        </main>
      </div>
    );
  }

  // Department Manager / Duty Manager enterprise operations console
  if (roleId === 'department_manager') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
          <DepartmentManagerConsole />
        </main>
      </div>
    );
  }

  // General Manager (replaces Executive Viewer / Approver) enterprise command center
  if (roleId === 'general_manager' || roleId === 'executive_viewer') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
          <ExecutiveConsole />
        </main>
      </div>
    );
  }

  // Financial Operator enterprise billing & accounting console
  if (roleId === 'financial_operator') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 pt-4 pb-20">
          <FinanceConsole />
        </main>
      </div>
    );
  }

  const items = state.items[roleId] ?? [];
  const openCount = (items as WorkItem[]).filter((i) => (cfg?.transitions?.[i.status]?.length ?? 0) > 0).length;
  const BannerIcon = cfg?.banner ? TONE_ICONS[cfg.banner.tone] : null;
  // Hide a banner once nothing is left open, so it never contradicts the list.
  const showBanner = Boolean(cfg?.banner && openCount > 0);

  const wrap = (children: ReactNode) => (
    <div style={accentVars(role)} className="min-h-screen">
      <TopBar active={roleId} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">{children}</main>
    </div>
  );

  return wrap(
    <>
      {showBanner && cfg.banner && BannerIcon && (
        <div
          role="status"
          className={cn('mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm', BANNER_TONE[cfg.banner.tone])}
        >
          <BannerIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{cfg.banner.text}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cfg.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} value={kpi.live === 'open' ? String(openCount) : undefined} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <WorkList
          roleId={roleId}
          title={cfg.listTitle}
          hint={cfg.listHint}
          icon={cfg.listIcon}
          items={items}
          transitions={cfg.transitions}
        />
        <div className="space-y-6">
          {cfg.side.map((widget) => (
            <SideWidgetView key={widget.title} widget={widget} />
          ))}
          <Panel title="Recent activity" hint="Property activity log" icon={Activity}>
            <FeedList limit={5} />
          </Panel>
        </div>
      </div>
      <footer className="mt-12 text-center text-[11px] text-mist-500 pb-8">
        The Grand ADP Hotel Management System · Verified Staff Operations
      </footer>
    </>,
  );
}
