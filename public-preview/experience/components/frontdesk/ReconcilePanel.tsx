'use client';

import { useState, type CSSProperties } from 'react';
import { CircleCheck, Landmark, RefreshCcw, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { HoldButton } from '@/lib/gestures';
import { syncAction } from '@/lib/frontDesk';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import type { IntegrationState, SyncIssue, Tone } from '@/types/demo';

const PMS_TONE: Record<IntegrationState, Tone> = { healthy: 'success', degraded: 'warning', down: 'danger' };

const BOOKING_LABEL: Record<SyncIssue['bookingState'], { text: string; tone: Tone }> = {
  PMS_Sync_Failed: { text: 'Booking not confirmed in PMS', tone: 'danger' },
  PMS_Confirmed: { text: 'Confirmed in PMS', tone: 'success' },
  Manual_Confirm: { text: 'Manually confirmed (audited)', tone: 'success' },
  Refund_Requested: { text: 'Refund sent to Finance', tone: 'info' },
};

export function ReconcilePanel() {
  const { state, fdAction } = useDemo();
  const [refundFor, setRefundFor] = useState<string | null>(null);
  const pms = state.integrations.pms ?? 'healthy';
  const issues = state.frontDesk.sync;
  const refundIssue = issues.find((x) => x.id === refundFor);

  return (
    <Panel
      title="Booking and payment reconciliation"
      hint="Payment captured but the PMS booking failed (F14). Never charge the guest twice."
      icon={Landmark}
      action={
        <span className="inline-flex items-center gap-2 text-xs text-mist-300">
          PMS
          <Badge tone={PMS_TONE[pms]} className="capitalize">
            {pms}
          </Badge>
        </span>
      }
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
              <li key={x.id} style={{ '--i': i } as CSSProperties} className="work-row" data-priority={failed ? 'critical' : 'normal'}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">
                      {x.bookingRef} · {x.guest}
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
                      <Button size="sm" variant="accent" iconLeft={RefreshCcw} onClick={() => fdAction('syncAction', [x.id, 'retry'])}>
                        Retry PMS sync
                      </Button>
                      <HoldButton variant="ghost" iconLeft={CircleCheck} onConfirm={() => fdAction('syncAction', [x.id, 'confirm'])}>
                        Confirm manually
                      </HoldButton>
                      <Button size="sm" variant="danger" iconLeft={Undo2} onClick={() => setRefundFor(x.id)}>
                        Request refund
                      </Button>
                    </div>
                  )}
                </div>
                {failed && pms !== 'healthy' && <p className="mt-2 text-[11px] text-amber-200">PMS is {pms} (simulated), so a retry will fail until it recovers.</p>}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-mist-400">Front Desk can retry, confirm manually or request a refund. Executing the refund belongs to Finance, who must be a different person.</p>

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
                  if (!fdAction('syncAction', [refundIssue.id, 'refund'])) setRefundFor(null);
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
  );
}
