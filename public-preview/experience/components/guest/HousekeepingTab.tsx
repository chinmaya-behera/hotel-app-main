'use client';

import { useState } from 'react';
import { BedDouble, CalendarClock, CheckCircle2, MoonStar } from 'lucide-react';
import { housekeepingCatalog } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { QuantityStepper, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

const TIME_SLOTS = ['As soon as possible', 'This afternoon', 'This evening', 'Tomorrow morning'];

export function HousekeepingTab({ room }: GuestTabProps) {
  const { state,submitGuestRequest,setRoomDnd } = useDemo();
  const [qty, setQty] = useState<Record<string, number>>({});
  const dnd=state.frontDesk.rooms.find(r=>r.no===room)?.dnd||false;
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const selectedItems = housekeepingCatalog.filter((c) => (qty[c.id] ?? 0) > 0);
  const canSubmit = !dnd && (selectedItems.length > 0 || slot !== null);

  function submit() {
    const itemSummary = selectedItems.map((c) => `${qty[c.id]}× ${c.name}`).join(', ');
    const title = itemSummary ? `Housekeeping · ${itemSummary}` : 'Room cleaning request';
    const descriptionParts = [
      itemSummary && `Requested: ${itemSummary}`,
      slot && `Preferred time: ${slot}`,
    ].filter(Boolean);
    const ref = submitGuestRequest({
      room,
      title,
      meta: 'Housekeeping · Reported via Guest Portal',
      category: 'housekeeping',
      description: descriptionParts.join(' · ') || undefined,
    });
    setConfirmed(ref);
    setQty({});
    setSlot(null);
    window.setTimeout(() => setConfirmed(null), 5000);
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
        <GuestSectionHeader title="Do not disturb" hint="Toggle on and housekeeping will skip your room" />
        <button
          type="button"
          aria-pressed={dnd}
          onClick={() => setRoomDnd(room,!dnd)}
          className="guest-card flex w-full items-center justify-between px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <MoonStar className="h-4 w-4" aria-hidden style={dnd ? { color: 'rgb(var(--a))' } : undefined} />
            Do not disturb
          </span>
          <span
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: dnd ? 'rgb(var(--a))' : 'var(--gs-border)' }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-[#ffffff] shadow transition-transform"
              style={{ transform: dnd ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </span>
        </button>
        {dnd && <p className="guest-muted mt-2 text-xs">DND is on — amenity and cleaning requests are paused until you turn it off.</p>}
      </div>

      <fieldset disabled={dnd} className="space-y-6 disabled:opacity-40">
        <div>
          <GuestSectionHeader title="Amenities" hint="Pick what you need — a runner will bring it to your room" />
          <ul className="space-y-2">
            {housekeepingCatalog.map((item) => {
              const Icon = item.icon;
              const value = qty[item.id] ?? 0;
              return (
                <li key={item.id} className="guest-card flex items-center justify-between gap-3 px-3.5 py-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="guest-surface-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="truncate text-sm font-medium">{item.name}</span>
                  </span>
                  <QuantityStepper value={value} onChange={(n) => setQty((q) => ({ ...q, [item.id]: n }))} />
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <GuestSectionHeader title="Room cleaning" hint="Choose a window for a full clean" />
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={slot === s}
                onClick={() => setSlot(slot === s ? null : s)}
                className="guest-chip-btn flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold"
              >
                <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {s}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <BedDouble className="h-4 w-4" aria-hidden />
        Send housekeeping request
      </button>
      {!canSubmit && !dnd && <p className="guest-muted text-center text-xs">Select at least one amenity or a cleaning time.</p>}
    </div>
  );
}
