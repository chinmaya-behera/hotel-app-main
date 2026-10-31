'use client';

import {
  BedDouble,
  Bell,
  CircleDollarSign,
  Flower2,
  ListChecks,
  PackageSearch,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  ShieldAlert,
  Edit3,
  MoonStar,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { guests } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { statusTone } from '@/lib/utils';
import { GuestPill, GuestSectionHeader, GuestEmptyState, DeliveryTracker } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

const TILES = [
  { tab: 'housekeeping' as const, label: 'Housekeeping', hint: 'Towels, amenities, cleaning', icon: Sparkles },
  { tab: 'room_service' as const, label: 'Room service', hint: 'Order food & drinks', icon: UtensilsCrossed },
  { tab: 'maintenance' as const, label: 'Maintenance', hint: 'Report an issue', icon: Wrench },
  { tab: 'spa' as const, label: 'Spa & concierge', hint: 'Treatments, bookings', icon: Flower2 },
  { tab: 'folio' as const, label: 'Folio & checkout', hint: 'Bill, express checkout', icon: CircleDollarSign },
  { tab: 'lost_found' as const, label: 'Lost & found', hint: 'Report or claim an item', icon: PackageSearch },
];

export function HomeTab({ room, guestName, onNavigate }: GuestTabProps) {
  const { state, updateGuestPreferences } = useDemo();
  const guest = guests.find((g) => g.room === room);
  const prefs = state.guestPreferences?.[room];

  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [allergiesText, setAllergiesText] = useState((prefs?.allergies ?? []).join(', '));
  const [dietaryText, setDietaryText] = useState((prefs?.dietaryRestrictions ?? []).join(', '));
  const [instructionsText, setInstructionsText] = useState(prefs?.personalInstructions ?? '');
  const [dndVal, setDndVal] = useState(prefs?.dnd ?? false);

  // Deduplicate items to prevent duplicate key errors across merged role queues
  const allItems = Object.values(state.items ?? {}).flat();
  const seenIds = new Set<string>();
  const uniqueItems: typeof allItems = [];
  for (const item of allItems) {
    if (item && item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }

  const requests = uniqueItems
    .filter((i) => i.guest && i.room === room)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const active = requests.filter((r) => !['Completed', 'Delivered', 'Cancelled', 'Closed'].includes(r.status));
  const orderInFlight = active.find((r) => r.category === 'room_service');

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateGuestPreferences(room, {
      allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
      dietaryRestrictions: dietaryText.split(',').map((s) => s.trim()).filter(Boolean),
      personalInstructions: instructionsText.trim(),
      dnd: dndVal,
    });
    setIsPrefsOpen(false);
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="guest-card overflow-hidden">
        <div
          className="px-5 py-5"
          style={{ background: 'linear-gradient(135deg, rgb(var(--a) / 0.16), rgb(var(--b) / 0.1))' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgb(var(--a))' }}>
            The Grand ADP
          </p>
          <h1 className="mt-1 text-xl font-bold">Welcome back, {guestName.split(' ')[0]}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <GuestPill tone="success">
              <BedDouble className="h-3 w-3" aria-hidden /> Room {room}
            </GuestPill>
            {guest && <GuestPill tone="neutral">Check-out {guest.checkout}</GuestPill>}
            <GuestPill tone="info">Verified stay</GuestPill>
          </div>
        </div>
      </div>

      {/* Guest Personal Stay Preferences & Service Instructions */}
      <div className="guest-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, rgb(var(--a) / 0.2), rgb(var(--b) / 0.1))', color: 'rgb(var(--a))' }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-white">Stay Preferences &amp; Instructions</p>
              <p className="text-[10px] text-mist-400">Dietary, allergies, and future-service notes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAllergiesText((prefs?.allergies ?? []).join(', '));
              setDietaryText((prefs?.dietaryRestrictions ?? []).join(', '));
              setInstructionsText(prefs?.personalInstructions ?? '');
              setDndVal(prefs?.dnd ?? false);
              setIsPrefsOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05]"
          >
            <Edit3 className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-white/[0.06]">
          <div>
            <span className="text-[10px] uppercase font-bold text-mist-400">Allergies &amp; Dietary</span>
            <p className="text-mist-200 mt-0.5">
              {prefs?.allergies && prefs.allergies.length > 0 ? prefs.allergies.join(', ') : 'None registered'}
              {prefs?.dietaryRestrictions && prefs.dietaryRestrictions.length > 0 ? ` · ${prefs.dietaryRestrictions.join(', ')}` : ''}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-mist-400">Service Instructions</span>
            <p className="text-mist-200 mt-0.5 italic">
              {prefs?.personalInstructions || 'No custom room instructions set'}
            </p>
          </div>
        </div>

        {prefs?.dnd && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            <MoonStar className="h-3.5 w-3.5" />
            <span>Do Not Disturb is currently active for your room</span>
          </div>
        )}
      </div>

      <div>
        <GuestSectionHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.tab}
                type="button"
                onClick={() => onNavigate(t.tab)}
                className="guest-tile p-3 text-left"
              >
                <span
                  className="icon-tile h-9 w-9 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--a)), rgb(var(--b)))' }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="mt-2 text-xs font-semibold">{t.label}</p>
                <p className="guest-muted text-[11px]">{t.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <GuestSectionHeader title="Active requests" hint="Live status for everything you've submitted this stay" />
        {active.length === 0 ? (
          <GuestEmptyState icon={Bell} title="No active requests" hint="Anything you request will track here in real time." />
        ) : (
          <>
          <ul className="space-y-2">
            {active.slice(0, 4).map((r, idx) => (
              <li key={`${r.id}-${r.ref || idx}`} className="guest-card flex items-center justify-between gap-2 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{r.title}</p>
                  {r.ref && <p className="guest-muted text-[11px]">{r.ref}</p>}
                </div>
                <GuestPill tone={statusTone(r.status)}>{r.status}</GuestPill>
              </li>
            ))}
          </ul>
          {orderInFlight && (
            <div className="mt-3">
              <DeliveryTracker status={orderInFlight.status} />
            </div>
          )}
          </>
        )}
        {requests.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('requests')}
            className="guest-chip-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            See all requests &amp; history
          </button>
        )}
      </div>

      {/* Stay Preferences Modal */}
      {isPrefsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400/20 text-amber-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-bold">Stay Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrefsOpen(false)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-3 text-xs">
              <div>
                <label className="block text-mist-300 font-semibold mb-1">
                  Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="e.g. Peanuts, Shellfish, Latex"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={dietaryText}
                  onChange={(e) => setDietaryText(e.target.value)}
                  placeholder="e.g. Vegetarian, Gluten-sensitive, Jain"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">
                  Room &amp; Personal Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder="e.g. Hypoallergenic pillows preferred, service after 14:00..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={dndVal}
                  onChange={(e) => setDndVal(e.target.checked)}
                  className="rounded border-white/20 bg-ink-950 text-amber-400 focus:ring-0"
                />
                <span className="text-mist-200">Enable Do Not Disturb (DND)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsPrefsOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
