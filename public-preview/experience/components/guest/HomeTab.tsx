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
} from 'lucide-react';
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
  const { state } = useDemo();
  const guest = guests.find((g) => g.room === room);
  const requests = Object.values(state.items)
    .flat()
    .filter((i) => i.guest && i.room === room)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const active = requests.filter((r) => !['Completed', 'Delivered', 'Cancelled', 'Closed'].includes(r.status));
  const orderInFlight = active.find((r) => r.category === 'room_service');

  return (
    <div className="space-y-6 pb-4">
      <div className="guest-card overflow-hidden">
        <div
          className="px-5 py-5"
          style={{ background: 'linear-gradient(135deg, rgb(var(--a) / 0.16), rgb(var(--b) / 0.1))' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgb(var(--a))' }}>
            Atelier Hotel
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
            {active.slice(0, 4).map((r) => (
              <li key={r.id} className="guest-card flex items-center justify-between gap-2 px-3.5 py-3">
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
    </div>
  );
}
