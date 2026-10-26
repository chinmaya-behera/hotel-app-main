'use client';

import { useState } from 'react';
import { AlertCircle, CircleDollarSign, LogOut, PenLine, Receipt } from 'lucide-react';
import { guests } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { FolioLine } from '@/types/demo';

export function FolioTab({ room, guestName }: GuestTabProps) {
  const { state, disputeFolioCharge, expressCheckout } = useDemo();
  const [disputeLine, setDisputeLine] = useState<FolioLine | null>(null);
  const [reason, setReason] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [signature, setSignature] = useState('');

  const lines = state.folios[room] ?? [];
  const paid=state.frontDesk.stays.find(st=>st.room===room&&st.status==='in_house')?.paid||0;
  const total = Math.max(0,lines.reduce((sum, l) => sum + l.amount, 0)-paid);
  const guest = guests.find((g) => g.room === room);

  function submitDispute() {
    if (!disputeLine || !reason.trim()) return;
    disputeFolioCharge(room, disputeLine.id, reason.trim());
    setDisputeLine(null);
    setReason('');
  }

  function confirmCheckout() {
    expressCheckout(room, guestName);
    setCheckoutOpen(false);
  }

  return (
    <div className="space-y-6 pb-4">
      <GuestSectionHeader title="Folio" hint={`Room ${room} · ${guest?.checkout ? `Check-out ${guest.checkout}` : 'Current stay'}`} />

      <ul className="guest-card divide-y" style={{ borderColor: 'var(--gs-border)' }}>
        {lines.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm guest-muted">No charges yet.</li>
        ) : (
          lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.label}</p>
                <p className="guest-muted text-[11px]">
                  {l.date}
                  {l.disputed && ' · Dispute submitted'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold">{money(l.amount)}</span>
                {!l.disputed && l.amount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeLine(l);
                      setReason('');
                    }}
                    className="guest-chip-btn rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  >
                    Dispute
                  </button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="guest-card flex items-center justify-between px-4 py-3.5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4" aria-hidden /> Balance due
        </span>
        <span className="text-lg font-bold">{money(total)}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          setCheckoutOpen(true);
          setSignature('');
        }}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Express checkout
      </button>
      <p className="guest-muted flex items-start gap-1.5 text-[11px]">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        Recorded payments are deducted from this balance. Express checkout settles this folio with your card on file (•••• 4242, simulated) and immediately ends this room's guest session.
      </p>

      {disputeLine && (
        <GuestSheet
          title={`Dispute · ${disputeLine.label}`}
          onClose={() => setDisputeLine(null)}
          footer={
            <button
              type="button"
              disabled={!reason.trim()}
              onClick={submitDispute}
              className="btn-accent w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
            >
              Submit dispute
            </button>
          }
        >
          <p className="guest-muted mb-3 text-xs">
            Charge amount: <span className="font-semibold">{money(disputeLine.amount)}</span>. This will be reviewed by Front Desk & Finance.
          </p>
          <label htmlFor="dispute-reason" className="guest-muted mb-1 block text-xs font-medium">
            Why are you disputing this charge?
          </label>
          <textarea
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. I did not order from the minibar"
            className="guest-field w-full px-3 py-2.5 text-sm"
          />
        </GuestSheet>
      )}

      {checkoutOpen && (
        <GuestSheet
          title="Express checkout"
          onClose={() => setCheckoutOpen(false)}
          footer={
            <button
              type="button"
              disabled={signature.trim().length < 2}
              onClick={confirmCheckout}
              className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
            >
              <CircleDollarSign className="h-4 w-4" aria-hidden />
              Confirm & check out · {money(total)}
            </button>
          }
        >
          <div className="space-y-4">
            <div className="guest-surface-2 rounded-xl px-3.5 py-3 text-sm">
              <p className="flex items-center justify-between">
                <span>Balance</span>
                <span className="font-semibold">{money(total)}</span>
              </p>
              <p className="guest-muted mt-1 text-xs">Charged to card •••• 4242 (simulated, tokenised).</p>
            </div>
            <div>
              <label htmlFor="signature" className="guest-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                <PenLine className="h-3.5 w-3.5" aria-hidden /> Sign to confirm (type your full name)
              </label>
              <input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={guestName}
                className="guest-field w-full px-3 py-2.5 text-sm"
              />
            </div>
            <p className="guest-muted text-[11px]">
              Confirming ends your in-room digital access immediately and notifies Housekeeping for turnover.
            </p>
          </div>
        </GuestSheet>
      )}
    </div>
  );
}
