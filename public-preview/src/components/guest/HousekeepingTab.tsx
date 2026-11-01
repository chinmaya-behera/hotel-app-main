'use client';

import { useState } from 'react';
import { BedDouble, CalendarClock, CheckCircle2, Minus, MoonStar, Plus, Sparkles } from 'lucide-react';
import { housekeepingCatalog } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

const TIME_SLOTS = ['As soon as possible', 'This afternoon', 'This evening', 'Tomorrow morning'];

/** Inline stepper — bigger touch targets, accent colour highlights */
function AmenityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all
          disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          borderColor: value > 0 ? 'rgb(var(--a))' : 'var(--gs-border)',
          color: value > 0 ? 'rgb(var(--a))' : 'var(--gs-muted)',
          background: 'var(--gs-surface)',
        }}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <span
        className="w-6 text-center text-sm font-bold tabular-nums"
        style={{ color: value > 0 ? 'rgb(var(--a))' : 'var(--gs-muted)' }}
      >
        {value}
      </span>

      <button
        type="button"
        aria-label="Increase"
        disabled={value >= 9}
        onClick={() => onChange(Math.min(9, value + 1))}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all
          disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          borderColor: 'rgb(var(--a))',
          color: 'var(--on-a)',
          background: 'rgb(var(--a))',
        }}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function HousekeepingTab({ room }: GuestTabProps) {
  const { state, submitGuestRequest } = useDemo();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [dnd, setDnd] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const customServices = (state.hotelServices ?? []).filter(
    (s) => s.availableForGuest && s.department === 'Housekeeping',
  );

  const allItems = [
    ...housekeepingCatalog,
    ...customServices.map((s) => ({
      id: s.id,
      name: `${s.name}${s.price > 0 ? ` (\u20b9${s.price.toLocaleString('en-IN')})` : ''}`,
      icon: Sparkles,
      price: s.price,
      desc: s.description,
      image: undefined as string | undefined,
    })),
  ];

  const selectedItems = allItems.filter((c) => (qty[c.id] ?? 0) > 0);
  const canSubmit = !dnd && (selectedItems.length > 0 || slot !== null);

  function submit() {
    const itemSummary = selectedItems.map((c) => `${qty[c.id]}\u00d7 ${c.name}`).join(', ');
    const title = itemSummary ? `Housekeeping \u00b7 ${itemSummary}` : 'Room cleaning request';
    const descriptionParts = [
      itemSummary && `Requested: ${itemSummary}`,
      slot && `Preferred time: ${slot}`,
    ].filter(Boolean);
    const ref = submitGuestRequest({
      room,
      title,
      meta: 'Housekeeping \u00b7 Reported via Guest Portal',
      category: 'housekeeping',
      description: descriptionParts.join(' \u00b7 ') || undefined,
    });
    setConfirmed(ref);
    setQty({});
    setSlot(null);
    window.setTimeout(() => setConfirmed(null), 5000);
  }

  return (
    <div className="space-y-5 pb-4" style={{ overflowX: 'hidden' }}>
      {confirmed && (
        <div className="guest-card flex items-start gap-2 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <p>
            Request sent \u00b7 Reference <span className="font-semibold">{confirmed}</span>. Track it from the Requests tab.
          </p>
        </div>
      )}

      {/* Do not disturb */}
      <div>
        <GuestSectionHeader title="Do not disturb" hint="Toggle on and housekeeping will skip your room" />
        <button
          type="button"
          aria-pressed={dnd}
          onClick={() => setDnd((v) => !v)}
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
        {dnd && <p className="guest-muted mt-2 text-xs">DND is on \u2014 amenity and cleaning requests are paused until you turn it off.</p>}
      </div>

      <fieldset disabled={dnd} className="space-y-5 disabled:opacity-40">
        {/* Amenities */}
        <div>
          <GuestSectionHeader title="Amenities" hint="Pick what you need \u2014 a runner will bring it to your room" />
          <ul className="space-y-2.5">
            {allItems.map((item) => {
              const Icon = item.icon;
              const value = qty[item.id] ?? 0;
              const itemImage = 'image' in item ? (item.image as string | undefined) : undefined;
              const itemDesc = 'desc' in item ? (item.desc as string | undefined) : undefined;
              const itemPrice = 'price' in item ? (item.price as number | undefined) : undefined;
              const isSelected = value > 0;

              return (
                <li
                  key={item.id}
                  className="guest-card overflow-hidden transition-all duration-200"
                  style={isSelected ? {
                    borderColor: 'rgb(var(--a) / 0.4)',
                    boxShadow: '0 0 0 1px rgb(var(--a) / 0.15)',
                  } : {}}
                >
                  <div className="flex items-center gap-3 p-2.5">
                    {/* Left: image or icon */}
                    <div className="shrink-0">
                      {itemImage ? (
                        <div
                          className="overflow-hidden rounded-xl bg-neutral-100"
                          style={{ width: 72, height: 72, flexShrink: 0 }}
                        >
                          <img
                            src={itemImage}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ) : (
                        <div
                          className="guest-surface-2 grid place-items-center rounded-xl"
                          style={{ width: 72, height: 72, flexShrink: 0 }}
                        >
                          <Icon className="h-6 w-6 opacity-50" aria-hidden />
                        </div>
                      )}
                    </div>

                    {/* Center: text */}
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--gs-text)' }}>
                        {item.name}
                      </p>
                      {itemDesc && (
                        <p
                          className="mt-0.5 text-xs leading-relaxed line-clamp-2"
                          style={{ color: 'var(--gs-muted)' }}
                        >
                          {itemDesc}
                        </p>
                      )}
                      {itemPrice && itemPrice > 0 ? (
                        <p className="mt-1 text-xs font-semibold" style={{ color: 'rgb(var(--a))' }}>
                          \u20b9{itemPrice.toLocaleString('en-IN')}
                        </p>
                      ) : null}
                    </div>

                    {/* Right: stepper */}
                    <AmenityStepper
                      value={value}
                      onChange={(n) => setQty((q) => ({ ...q, [item.id]: n }))}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Room cleaning */}
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
