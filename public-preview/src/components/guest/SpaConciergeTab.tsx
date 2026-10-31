'use client';

import { useState } from 'react';
import { CheckCircle2, Flower2, Headset, Sparkles } from 'lucide-react';
import { conciergeServices, spaServices } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

const SLOTS = ['Today · 2:00 PM', 'Today · 4:30 PM', 'Tomorrow · 10:00 AM', 'Tomorrow · 3:00 PM'];

export function SpaConciergeTab({ room }: GuestTabProps) {
  const { submitGuestRequest } = useDemo();
  const [booking, setBooking] = useState<(typeof spaServices)[number] | null>(null);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [chargeToRoom, setChargeToRoom] = useState(true);
  const [concierge, setConcierge] = useState<(typeof conciergeServices)[number] | null>(null);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  function confirmBooking() {
    if (!booking) return;
    const ref = submitGuestRequest({
      room,
      title: `${booking.name} booking`,
      meta: `Spa & Wellness · ${booking.duration} · Reported via Guest Portal`,
      category: 'spa',
      description: `Slot: ${slot}${chargeToRoom ? ' · Charged to room' : ' · Pay at spa'}`,
      folioCharge: chargeToRoom ? { label: `Spa · ${booking.name}`, amount: booking.price } : undefined,
    });
    setConfirmed(ref);
    setBooking(null);
    window.setTimeout(() => setConfirmed(null), 6000);
  }

  function confirmConcierge() {
    if (!concierge) return;
    const ref = submitGuestRequest({
      room,
      title: concierge.name,
      meta: 'Concierge · Reported via Guest Portal',
      category: 'concierge',
      description: note || undefined,
    });
    setConfirmed(ref);
    setConcierge(null);
    setNote('');
    window.setTimeout(() => setConfirmed(null), 6000);
  }

  return (
    <div className="space-y-6 pb-4">
      {confirmed && (
        <div className="guest-card flex items-start gap-2 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <p>
            Request sent · Reference <span className="font-semibold">{confirmed}</span>. Track it from the Requests tab.
          </p>
        </div>
      )}

      <div>
        <GuestSectionHeader title="Spa & wellness" hint="Book a treatment or facility — optionally charged to your room" />
        <ul className="space-y-2.5">
          {spaServices.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.id} className="guest-card flex items-center justify-between gap-3 px-3.5 py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="guest-surface-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{s.name}</span>
                    <span className="guest-muted text-xs">
                      {s.duration} · {money(s.price)}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBooking(s);
                    setSlot(SLOTS[0]);
                    setChargeToRoom(true);
                  }}
                  className="guest-chip-btn shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold"
                >
                  Book
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <GuestSectionHeader title="Concierge & recreation" hint="Transfers, reservations, local tours and more" />
        <ul className="space-y-2.5">
          {conciergeServices.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.id} className="guest-card flex items-center justify-between gap-3 px-3.5 py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="guest-surface-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConcierge(c);
                    setNote('');
                  }}
                  className="guest-chip-btn shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold"
                >
                  Request
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {booking && (
        <GuestSheet
          title={booking.name}
          onClose={() => setBooking(null)}
          footer={
            <button type="button" onClick={confirmBooking} className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold">
              <Flower2 className="h-4 w-4" aria-hidden />
              Confirm booking · {money(booking.price)}
            </button>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="guest-muted mb-2 text-xs font-medium">Choose a time</p>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={slot === s}
                    onClick={() => setSlot(s)}
                    className="guest-chip-btn rounded-xl px-3 py-2.5 text-xs font-semibold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-pressed={chargeToRoom}
              onClick={() => setChargeToRoom((v) => !v)}
              className="guest-card flex w-full items-center justify-between px-3.5 py-3"
            >
              <span className="text-sm font-medium">Charge to room folio</span>
              <span
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                style={{ background: chargeToRoom ? 'rgb(var(--a))' : 'var(--gs-border)' }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-[#ffffff] shadow transition-transform"
                  style={{ transform: chargeToRoom ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </span>
            </button>
            <p className="guest-muted text-xs">By confirming you agree to the standard cancellation policy (24h notice).</p>
          </div>
        </GuestSheet>
      )}

      {concierge && (
        <GuestSheet
          title={concierge.name}
          onClose={() => setConcierge(null)}
          footer={
            <button type="button" onClick={confirmConcierge} className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold">
              <Headset className="h-4 w-4" aria-hidden />
              Send request
            </button>
          }
        >
          <label htmlFor="cc-note" className="guest-muted mb-1 block text-xs font-medium">
            Add details (optional)
          </label>
          <textarea
            id="cc-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. flight lands 6:40 PM, 2 guests, 1 large suitcase"
            className="guest-field w-full px-3 py-2.5 text-sm"
          />
        </GuestSheet>
      )}

      {!booking && !concierge && (
        <p className="guest-muted flex items-center gap-1.5 text-[11px]">
          <Sparkles className="h-3 w-3" aria-hidden /> All bookings are simulated — no live calendar or payment is involved.
        </p>
      )}
    </div>
  );
}
