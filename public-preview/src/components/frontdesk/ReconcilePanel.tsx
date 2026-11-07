'use client';

import { useState, type CSSProperties } from 'react';
import {
  CircleCheck,
  Landmark,
  RefreshCcw,
  Undo2,
  FileSpreadsheet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { HoldButton } from '@/lib/gestures';
import { syncAction } from '@/lib/frontDesk';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { IntegrationState, SyncIssue, Tone } from '@/types/demo';

const PMS_TONE: Record<IntegrationState, Tone> = { healthy: 'success', degraded: 'warning', down: 'danger' };

const BOOKING_LABEL: Record<SyncIssue['bookingState'], { text: string; tone: Tone }> = {
  PMS_Sync_Failed: { text: 'Booking not confirmed in PMS', tone: 'danger' },
  PMS_Confirmed: { text: 'Confirmed in PMS', tone: 'success' },
  Manual_Confirm: { text: 'Manually confirmed (audited)', tone: 'success' },
  Refund_Requested: { text: 'Refund sent to Finance', tone: 'info' },
};

interface DisputedFolioItem {
  id: string;
  folio: string;
  guest: string;
  amount: number;
  category: 'Minibar' | 'Room Service' | 'Late Checkout';
  description: string;
  cardMask: string;
  status: 'pending' | 'resolved_credit' | 'escalated';
}

const INITIAL_DISPUTES: DisputedFolioItem[] = [
  {
    id: 'disp-1',
    folio: 'Folio 402',
    guest: 'Elena Rostova',
    amount: 85,
    category: 'Minibar',
    description: 'Automated bar sensor posted 2x Evian + Toblerone; guest confirms seals intact.',
    cardMask: '•••• 4242',
    status: 'pending',
  },
  {
    id: 'disp-2',
    folio: 'Folio 210',
    guest: 'Tomás Silva',
    amount: 60,
    category: 'Late Checkout',
    description: 'Departure fee disputed; guest experienced 40m arrival queue on check-in day.',
    cardMask: '•••• 5521',
    status: 'pending',
  },
  {
    id: 'disp-3',
    folio: 'Folio 518',
    guest: 'Priya Nair (VIP)',
    amount: 42.5,
    category: 'Room Service',
    description: 'Breakfast POS transaction ref #POS-8891 duplicated on room account.',
    cardMask: '•••• 1881',
    status: 'pending',
  },
];

export function ReconcilePanel() {
  const { state, fdAction } = useDemo();
  const [activeTab, setActiveTab] = useState<'pms' | 'folios'>('pms');
  const [refundFor, setRefundFor] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<DisputedFolioItem[]>(INITIAL_DISPUTES);

  const pms = state.integrations?.pms ?? 'healthy';
  const issues = state.frontDesk?.sync ?? [];
  const refundIssue = issues.find((x) => x.id === refundFor);

  const handleResolveDispute = (id: string, action: 'credit' | 'escalate') => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: action === 'credit' ? 'resolved_credit' : 'escalated' } : d,
      ),
    );
  };

  const pendingDisputes = disputes.filter((d) => d.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Reconciliation Mode Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pms')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              activeTab === 'pms' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white',
            )}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>PMS Sync Issues ({issues.filter((x) => x.bookingState === 'PMS_Sync_Failed').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('folios')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              activeTab === 'folios' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white',
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Folio & Charge Disputes ({pendingDisputes.length})</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-2 text-xs text-mist-300">
          PMS Connection:
          <Badge tone={PMS_TONE[pms]} className="capitalize">
            {pms}
          </Badge>
        </span>
      </div>

      {activeTab === 'pms' ? (
        <Panel
          title="Booking & Payment Synchronization"
          hint="Payment captured but the PMS booking failed (F14). Never charge the guest twice."
          icon={Landmark}
        >
          {issues.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <CircleCheck className="h-6 w-6 text-mist-500" aria-hidden />
              <p className="text-sm text-mist-300">Every captured payment has a confirmed booking.</p>
            </div>
          ) : (
            <ul className="fd-stagger space-y-3">
              {issues.map((x, i) => {
                const failed = x.bookingState === 'PMS_Sync_Failed';
                const b = BOOKING_LABEL[x.bookingState];
                return (
                  <li
                    key={x.id}
                    style={{ '--i': i } as CSSProperties}
                    className="work-row p-3.5 rounded-xl border border-white/10 bg-white/[0.02]"
                    data-priority={failed ? 'critical' : 'normal'}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <span>{x.bookingRef}</span>
                          <span className="text-mist-400">·</span>
                          <span>{x.guest}</span>
                        </h3>
                        <p className="mt-0.5 text-xs text-mist-400">{x.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="success">Payment captured</Badge>
                          <Badge icon={false}>{`${money(x.amount)} · card ${x.cardMask}`}</Badge>
                          <Badge tone={b.tone}>{b.text}</Badge>
                        </div>
                      </div>
                      {failed && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="accent"
                            iconLeft={RefreshCcw}
                            onClick={() => fdAction((s) => syncAction(s, x.id, 'retry'))}
                          >
                            Retry PMS sync
                          </Button>
                          <HoldButton
                            variant="ghost"
                            iconLeft={CircleCheck}
                            onConfirm={() => fdAction((s) => syncAction(s, x.id, 'confirm'))}
                          >
                            Confirm manually
                          </HoldButton>
                          <Button
                            size="sm"
                            variant="danger"
                            iconLeft={Undo2}
                            onClick={() => setRefundFor(x.id)}
                          >
                            Request refund
                          </Button>
                        </div>
                      )}
                    </div>
                    {failed && pms !== 'healthy' && (
                      <p className="mt-2 text-[11px] text-amber-200">
                        PMS is {pms} (simulated), so a retry will fail until it recovers.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-4 text-[11px] text-mist-400">
            Front Desk can retry, confirm manually or request a refund. Executing the refund belongs to Finance, who must be a different operator.
          </p>

          {refundIssue && (
            <Modal
              title="Request an authorized refund"
              description={`${refundIssue.bookingRef} · ${refundIssue.guest}`}
              onClose={() => setRefundFor(null)}
              footer={
                <>
                  <Button variant="subtle" onClick={() => setRefundFor(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    iconLeft={Undo2}
                    onClick={() => {
                      if (!fdAction((s) => syncAction(s, refundIssue.id, 'refund'))) setRefundFor(null);
                    }}
                  >
                    Send to Finance
                  </Button>
                </>
              }
            >
              <p className="text-sm text-mist-200">
                {money(refundIssue.amount)} on card {refundIssue.cardMask} goes into Finance&apos;s queue for approval. Front Desk cannot execute or approve it.
              </p>
            </Modal>
          )}
        </Panel>
      ) : (
        /* Folio & Minibar / POS Discrepancies */
        <Panel
          title="Guest Folio & Disputed Charges"
          hint="Front Desk authority permits discretionary credit up to ₹2,500 per stay without prior Duty Manager escalation."
          icon={Receipt}
        >
          <div className="space-y-3">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{d.folio}</span>
                    <span className="text-mist-400">·</span>
                    <span className="text-mist-200 font-medium">{d.guest}</span>
                    <Badge tone="accent">{d.category}</Badge>
                    <Badge tone={d.status === 'pending' ? 'warning' : 'success'}>
                      {d.status === 'pending'
                        ? 'Under Review'
                        : d.status === 'resolved_credit'
                        ? 'Goodwill Credited'
                        : 'Escalated to GM'}
                    </Badge>
                  </div>
                  <p className="text-mist-300 text-xs">{d.description}</p>
                  <p className="text-[11px] text-mist-400 font-mono">
                    Disputed Amount: <strong className="text-amber-300">{money(d.amount)}</strong> · Card {d.cardMask}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {d.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => handleResolveDispute(d.id, 'credit')}
                      >
                        Apply Goodwill Credit ({money(d.amount)})
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolveDispute(d.id, 'escalate')}
                      >
                        Escalate
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Action Processed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
