'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import type { IntegrationState } from '@/types/demo';

interface ConnectorSpec {
  id: string;
  name: string;
  category: string;
  provider: string;
  icon: typeof Server;
  endpoint: string;
  fallbackRule: string;
}

const CONNECTORS: ConnectorSpec[] = [
  {
    id: 'pms',
    name: 'Opera Cloud PMS',
    category: 'Core Hotel Master',
    provider: 'Oracle Hospitality',
    icon: Server,
    endpoint: 'https://api.operacloud.oracle.com/v1/property/ADPRESORT',
    fallbackRule: 'Fix 1: Capture payment as pending_confirmation and queue to Front Desk Reconcile.',
  },
  {
    id: 'pos',
    name: 'Micros Simphony POS & KDS',
    category: 'Food & Beverage',
    provider: 'Oracle Simphony',
    icon: UtensilsCrossed,
    endpoint: 'https://simphony.adpresort.internal/pos/kds/tickets',
    fallbackRule: 'Queues kitchen order locally using client operation_id (idempotency key).',
  },
  {
    id: 'pay',
    name: 'Razorpay / Stripe Gateway',
    category: 'Payment Tokenization',
    provider: 'Razorpay (India) / Stripe',
    icon: Wallet,
    endpoint: 'https://api.razorpay.com/v1/orders · Webhooks active',
    fallbackRule: 'Masks card credentials (•••• 4242). Rejects unverified payment links.',
  },
  {
    id: 'msg',
    name: 'WhatsApp Cloud & Twilio Bridge',
    category: 'Guest Messaging',
    provider: 'Meta Cloud API / Twilio',
    icon: MessageSquare,
    endpoint: 'https://graph.facebook.com/v18.0/messages/whatsapp',
    fallbackRule: 'Falls back to standard in-room tablet notifications and Front Desk case alerts.',
  },
];

export function IntegrationsTab() {
  const { state, setIntegrationState, testConnector, notify } = useDemo();
  const [testingId, setTestingId] = useState<string | null>(null);

  const syncIssues = state.frontDesk.sync;
  const failedSyncCount = syncIssues.filter((s) => s.bookingState === 'PMS_Sync_Failed').length;

  const handlePing = (id: string) => {
    setTestingId(id);
    testConnector(id);
    setTimeout(() => setTestingId(null), 600);
  };

  const getStatusBadge = (status: IntegrationState) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Healthy (200 OK)
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 text-xs font-bold text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Degraded (High Latency)
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-300">
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            Down (Offline Fallback)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-emerald-400" />
            External Integration Gateways & Reconciliation
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Simulate connector states for PMS, POS, Payments, and Messaging channels. Execute diagnostic latency pings and monitor payment-to-booking reconciliation (Admin and IT workflow.png & Fix 1).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="accent"
            iconLeft={RefreshCw}
            onClick={() => {
              CONNECTORS.forEach((c) => testConnector(c.id));
              notify('Diagnostic ping dispatched to all connectors');
            }}
          >
            Ping All Connectors
          </Button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CONNECTORS.map((conn) => {
          const currentStatus = state.integrations[conn.id] ?? 'healthy';
          const Icon = conn.icon;
          const isPinging = testingId === conn.id;

          return (
            <div
              key={conn.id}
              className={`rounded-3xl border p-6 backdrop-blur-xl transition shadow-xl space-y-4 flex flex-col justify-between ${
                currentStatus === 'down'
                  ? 'border-rose-500/40 bg-rose-500/[0.04]'
                  : currentStatus === 'degraded'
                  ? 'border-amber-400/30 bg-amber-400/[0.03]'
                  : 'border-white/10 bg-ink-900/80'
              }`}
            >
              <div className="space-y-3">
                {/* Header & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04] border border-white/10 text-amber-300 shrink-0">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                        {conn.category}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white">
                        {conn.name}
                      </h3>
                      <span className="text-xs text-mist-400 block font-medium">
                        Provider: {conn.provider}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(currentStatus)}</div>
                </div>

                {/* Endpoint & Fallback Rule */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1.5 font-mono">
                  <div className="text-[11px] text-mist-400 truncate">
                    <span className="text-mist-500">URI:</span> {conn.endpoint}
                  </div>
                  <div className="text-[11px] text-amber-200/90 font-sans border-t border-white/[0.05] pt-1.5">
                    <strong>Fallback:</strong> {conn.fallbackRule}
                  </div>
                </div>
              </div>

              {/* Status Controls and Ping Button */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-mist-400 mr-1">Simulate:</span>
                  {(['healthy', 'degraded', 'down'] as IntegrationState[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setIntegrationState(conn.id, st)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition ${
                        currentStatus === st
                          ? st === 'healthy'
                            ? 'bg-emerald-400 text-ink-950'
                            : st === 'degraded'
                            ? 'bg-amber-400 text-ink-950'
                            : 'bg-rose-500 text-white'
                          : 'bg-white/5 text-mist-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="subtle"
                  iconLeft={RefreshCw}
                  disabled={isPinging}
                  onClick={() => handlePing(conn.id)}
                >
                  {isPinging ? 'Pinging…' : 'Ping Test'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment-PMS Reconciliation Status Card (Fix 1 / F14) */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-amber-300">
                Fix 1 Implementation Architecture
              </span>
              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                {failedSyncCount} Active Issues
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-white mt-1">
              Payment-to-PMS Booking Reconciliation Queue
            </h3>
            <p className="text-xs text-mist-300 mt-0.5 max-w-2xl">
              Payment Success != Booking Confirmation. When PMS times out, payments are captured but reservations stay as pending_confirmation until Front Desk reconciles.
            </p>
          </div>

          <Link
            href="/staff/front-desk"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition shrink-0"
          >
            <span>Open Front Desk Reconcile Tab</span>
            <ExternalLink className="h-3.5 w-3.5 text-amber-300" />
          </Link>
        </div>

        {/* Sync Issues List */}
        {syncIssues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-mist-400">
            Zero pending sync issues. All transactions reconciled.
          </div>
        ) : (
          <div className="space-y-3">
            {syncIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm font-bold font-mono">
                      {issue.bookingRef}
                    </strong>
                    <span className="text-amber-300 font-semibold">{issue.guest}</span>
                    <Badge tone={issue.bookingState === 'PMS_Sync_Failed' ? 'danger' : 'info'}>
                      {issue.bookingState}
                    </Badge>
                  </div>
                  <p className="text-mist-300 mt-1">{issue.detail}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-mist-400 block font-mono">Card {issue.cardMask}</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-display">
                      {money(issue.amount)}
                    </span>
                  </div>

                  <span className="rounded-lg bg-emerald-400/10 border border-emerald-400/25 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    Payment Captured
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
