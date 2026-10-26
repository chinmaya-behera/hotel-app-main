'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  KeyRound,
  Play,
  QrCode,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { ROOMS } from '@/lib/hotelCatalog';
import { roleById } from '@/lib/roles';

interface AdminOverviewTabProps {
  onNavigateTab: (tabId: string) => void;
}

export function AdminOverviewTab({ onNavigateTab }: AdminOverviewTabProps) {
  const { state, advance, simulateTestTask, testConnector, revokeRoomSession, restoreRoomSession } = useDemo();
  const [testingWorkflow, setTestingWorkflow] = useState(false);

  // Computed live metrics
  const staff = state.staffAccounts ?? [];
  const activeStaff = staff.filter((s) => s.status === 'active').length;
  const totalStaff = staff.length;

  const integrations = Object.entries(state.integrations);
  const healthyIntegrations = integrations.filter(([, s]) => s === 'healthy').length;
  const degradedIntegrations = integrations.filter(([, s]) => s === 'degraded').length;
  const downIntegrations = integrations.filter(([, s]) => s === 'down').length;

  const totalRooms = ROOMS.length;
  const revokedCount = state.revokedRooms.length;
  const activeQrCount = totalRooms - revokedCount;

  const openSyncIssues = state.frontDesk.sync.filter((s) => s.bookingState === 'PMS_Sync_Failed').length;
  const openCasesCount = state.items.front_desk_coordinator.filter((i) => i.status === 'Open' || i.status === 'Received').length;
  const pendingAdminItems = state.items.platform_admin.filter((i) => i.status === 'Pending');

  // Trigger simulated workflow test
  const handleTestWorkflow = (dept: string) => {
    setTestingWorkflow(true);
    simulateTestTask(dept, 'vip');
    setTimeout(() => setTestingWorkflow(false), 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & System Status Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-3xl border border-white/10 bg-gradient-to-r from-ink-900/90 via-ink-850/80 to-ink-900/90 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/10 border border-amber-300/20 text-amber-300 shadow-inner shrink-0">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
                Atelier Hotel · Admin & IT Infrastructure
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              Platform Overview & System Diagnostics
            </h2>
            <p className="mt-1 text-xs text-mist-300 max-w-2xl">
              Centralized administration console governing employee RBAC accounts, in-room QR tokens, dual SLA timers, connector health, and immutable audit logs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="accent"
            iconLeft={Play}
            disabled={testingWorkflow}
            onClick={() => handleTestWorkflow('Housekeeping')}
          >
            {testingWorkflow ? 'Injecting…' : 'Run Workflow Test'}
          </Button>
          <Button
            size="sm"
            variant="subtle"
            iconLeft={RefreshCw}
            onClick={() => testConnector('pms')}
          >
            Ping PMS
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Staff */}
        <div
          onClick={() => onNavigateTab('users')}
          className="cursor-pointer group rounded-2xl border border-white/10 bg-ink-900/80 p-5 hover:border-amber-300/30 transition shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mist-300">Active Staff Accounts</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-400/10 text-sky-300 border border-sky-400/20">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-white">
              {activeStaff}
            </span>
            <span className="text-xs text-mist-400">/ {totalStaff} total</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400 flex items-center justify-between">
            <span>Across 9 RBAC profiles</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-amber-300" />
          </p>
        </div>

        {/* Integration Connectors */}
        <div
          onClick={() => onNavigateTab('integrations')}
          className="cursor-pointer group rounded-2xl border border-white/10 bg-ink-900/80 p-5 hover:border-amber-300/30 transition shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mist-300">Integration Connectors</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
              <Server className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-emerald-400">
              {healthyIntegrations}
            </span>
            <span className="text-xs text-mist-400">/ {integrations.length} healthy</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            {degradedIntegrations > 0 && (
              <span className="text-amber-300 font-semibold">{degradedIntegrations} degraded</span>
            )}
            {downIntegrations > 0 && (
              <span className="text-rose-400 font-semibold">{downIntegrations} offline</span>
            )}
            {degradedIntegrations === 0 && downIntegrations === 0 && (
              <span className="text-emerald-300">All gateways nominal</span>
            )}
            <ArrowRight className="h-3 w-3 ml-auto group-hover:translate-x-1 transition-transform text-amber-300" />
          </div>
        </div>

        {/* QR Session State */}
        <div
          onClick={() => onNavigateTab('rooms')}
          className="cursor-pointer group rounded-2xl border border-white/10 bg-ink-900/80 p-5 hover:border-amber-300/30 transition shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mist-300">In-Room QR Sessions</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 border border-amber-300/20">
              <QrCode className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-white">
              {activeQrCount}
            </span>
            <span className="text-xs text-mist-400">/ {totalRooms} active</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400 flex items-center justify-between">
            <span className={revokedCount > 0 ? 'text-rose-400 font-semibold' : 'text-mist-400'}>
              {revokedCount} emergency revoked
            </span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-amber-300" />
          </p>
        </div>

        {/* Sync Reconciliation Issues */}
        <div
          onClick={() => onNavigateTab('integrations')}
          className="cursor-pointer group rounded-2xl border border-white/10 bg-ink-900/80 p-5 hover:border-amber-300/30 transition shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mist-300">Sync Reconciliations</span>
            <span className={`grid h-8 w-8 place-items-center rounded-xl border ${openSyncIssues > 0 ? 'bg-rose-400/10 text-rose-300 border-rose-400/20' : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'}`}>
              <RefreshCw className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-display text-3xl font-extrabold ${openSyncIssues > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {openSyncIssues}
            </span>
            <span className="text-xs text-mist-400">pending sync</span>
          </div>
          <p className="mt-2 text-[11px] text-mist-400 flex items-center justify-between">
            <span>Fix 1 Payment-PMS link</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-amber-300" />
          </p>
        </div>
      </div>

      {/* Main 2-Column Section: Pending Actions & Real-Time Security Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Pending Administrative Requests */}
        <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-300" />
                Pending Administrative Action Queue
              </h3>
              <p className="text-xs text-mist-300 mt-0.5">
                Staff access grants, revocation authorizations, and vendor support approvals (Backlog adm-1 to adm-3).
              </p>
            </div>
            <span className="rounded-full bg-amber-400/10 border border-amber-300/25 px-2.5 py-1 text-xs font-semibold text-amber-200">
              {pendingAdminItems.length} Pending
            </span>
          </div>

          {pendingAdminItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="mt-2 text-sm font-semibold text-white">All administrative requests resolved</p>
              <p className="text-xs text-mist-400 mt-1">Audit trail retains complete immutable decision history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAdminItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{item.title}</span>
                        {item.chip && <Badge tone={item.tone ?? 'info'}>{item.chip}</Badge>}
                      </div>
                      <p className="text-xs text-mist-300 mt-0.5">{item.meta}</p>
                    </div>
                    <span className="text-[11px] font-mono text-mist-400 shrink-0">
                      Ref: {item.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-white/[0.05] pt-3">
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => advance('platform_admin', item.id, { label: 'Reject', next: 'Rejected', message: 'Request denied by administrator', variant: 'secondary' }, 'Administrative review rejected')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => advance('platform_admin', item.id, { label: 'Approve & Execute', next: 'Approved', message: 'Action approved and committed to audit log', variant: 'primary' }, 'Approved following policy check')}
                    >
                      Approve & Grant
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Workflow Test Sandbox (from Admin and IT workflow.png) */}
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.03] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-amber-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Workflow Simulator Sandbox (Admin and IT workflow.png)
              </h4>
            </div>
            <p className="text-xs text-mist-300">
              Trigger sample requests to test dual SLA timer countdowns, department queue routing, and supervisor escalation paths.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="subtle"
                onClick={() => handleTestWorkflow('Housekeeping')}
              >
                + Test Housekeeping Task
              </Button>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => handleTestWorkflow('Maintenance')}
              >
                + Test Engineering Ticket
              </Button>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => handleTestWorkflow('Food & Beverage')}
              >
                + Test Room Service Order
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Security & RBAC Status Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Policies & Invariants */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-300" />
              Security & RBAC Enforcement
            </h3>
            <ul className="space-y-3 text-xs text-mist-300">
              <li className="flex items-start gap-2 rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Separation of Duties (REQ-08)</strong>
                  Exception requestors cannot approve or execute their own financial refunds.
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Two-Tier QR Security (Fix 3)</strong>
                  QR tokens bind room entry context; financial charges require stay verification.
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Lifecycle Session Revocation</strong>
                  Checkout and room moves immediately revoke active guest QR access tokens.
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Dual SLA Engine (Fix 4)</strong>
                  Response SLA ({state.workflowConfig?.ackSlaMinutes ?? 5}m) & Resolution SLA ({state.workflowConfig?.resolutionSlaMinutes ?? 20}m) tracked independently.
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Navigation Cards */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-5 backdrop-blur-xl shadow-xl space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 block mb-2">
              Management Consoles
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('users')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-white hover:border-amber-300/30 hover:bg-white/[0.06] transition"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" />
                Staff Accounts & Role Matrix
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-mist-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('rooms')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-white hover:border-amber-300/30 hover:bg-white/[0.06] transition"
            >
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-amber-400" />
                Room Units & QR Session Tokens
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-mist-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('workflow')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-white hover:border-amber-300/30 hover:bg-white/[0.06] transition"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Dual SLA & Financial Limits
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-mist-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('integrations')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-white hover:border-amber-300/30 hover:bg-white/[0.06] transition"
            >
              <span className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                Gateways & Payment Sync
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-mist-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
