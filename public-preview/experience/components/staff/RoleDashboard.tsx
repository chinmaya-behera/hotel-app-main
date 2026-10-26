'use client';
import dynamic from 'next/dynamic';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { ChevronRight, LayoutGrid, Activity } from 'lucide-react';
import { TONE_ICONS } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FeedList } from '@/components/shared/FeedList';
import { StatCard } from '@/components/shared/StatCard';
import { TopBar } from '@/components/shared/TopBar';
const FrontDeskConsole=dynamic(()=>import('@/components/frontdesk/FrontDeskConsole').then(m=>m.FrontDeskConsole));
const AdminConsole=dynamic(()=>import('@/components/admin/AdminConsole').then(m=>m.AdminConsole));
const DispatcherConsole=dynamic(()=>import('@/components/dispatcher/DispatcherConsole').then(m=>m.DispatcherConsole));
const FulfillerApp=dynamic(()=>import('@/components/staff/fulfiller/FulfillerApp').then(m=>m.FulfillerApp));
const DutyManagerConsole=dynamic(()=>import('@/components/manager/DutyManagerConsole').then(m=>m.DutyManagerConsole));
const ExecutiveConsole=dynamic(()=>import('@/components/executive/ExecutiveConsole').then(m=>m.ExecutiveConsole));
const SecurityApp=dynamic(()=>import('@/components/staff/security/SecurityApp').then(m=>m.SecurityApp));
const FinanceConsole=dynamic(()=>import('@/components/finance/FinanceConsole').then(m=>m.FinanceConsole));
const SupervisorConsole=dynamic(()=>import('@/components/supervisor/SupervisorConsole').then(m=>m.SupervisorConsole));
import { SideWidgetView } from '@/components/staff/SideWidgets';
import { WorkList } from '@/components/staff/WorkList';
import { dashboards } from '@/lib/dashboards';
import { roleById } from '@/lib/roles';
import { useDemo } from '@/lib/store';
import { accentVars, cn } from '@/lib/utils';
import type { RoleId, Tone } from '@/types/demo';

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



  // Mobile-first Security Responder app for Hotel Security Officers
  if (roleId === 'security_responder') {
    return <SecurityApp />;
  }

  // Mobile-first dedicated Fulfiller app for Task Fulfillers (Attendants, Runners, Technicians)
  if (roleId === 'task_fulfiller') {
    return <FulfillerApp />;
  }

  // Department Dispatcher enterprise desktop console
  if (roleId === 'department_dispatcher') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
          <DispatcherConsole />
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
          <DutyManagerConsole />
        </main>
      </div>
    );
  }

  // Executive Viewer / Approver enterprise command center
  if (roleId === 'executive_viewer') {
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

  // Department Supervisor enterprise quality & team oversight console
  if (roleId === 'department_supervisor') {
    return (
      <div style={accentVars(role)} className="min-h-screen">
        <TopBar active={roleId} />
        <main className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 pt-4 pb-20">
          <SupervisorConsole />
        </main>
      </div>
    );
  }

 return null;
}
