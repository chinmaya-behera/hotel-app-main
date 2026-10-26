'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BedDouble,
  ChevronLeft,
  CircleDollarSign,
  Hotel,
  House,
  ListChecks,
  LogOut,
  Moon,
  PackageSearch,
  ShieldOff,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { FolioTab } from '@/components/guest/FolioTab';
import { HomeTab } from '@/components/guest/HomeTab';
import { HousekeepingTab } from '@/components/guest/HousekeepingTab';
import { LostFoundTab } from '@/components/guest/LostFoundTab';
import { MaintenanceTab } from '@/components/guest/MaintenanceTab';
import { RequestsTab } from '@/components/guest/RequestsTab';
import { RoomServiceTab } from '@/components/guest/RoomServiceTab';
import { SpaConciergeTab } from '@/components/guest/SpaConciergeTab';
import { GuestConfirm, GuestPill } from '@/components/guest/guestUi';
import type { GuestTabId } from '@/components/guest/types';
import { guests } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

/** Bottom navigation. Housekeeping, Maintenance and Spa open from Home and keep Home highlighted. */
const NAV: { id: GuestTabId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'room_service', label: 'Dining', icon: UtensilsCrossed },
  { id: 'requests', label: 'Requests', icon: ListChecks },
  { id: 'folio', label: 'Folio', icon: CircleDollarSign },
  { id: 'lost_found', label: 'Lost & found', icon: PackageSearch },
];

const NAV_GROUP: Partial<Record<GuestTabId, GuestTabId>> = {
  housekeeping: 'home',
  maintenance: 'home',
  spa: 'home',
};

export function GuestPortalPreview({ room, token }: { room: string; token: string }) {
  const router = useRouter();
  const { state, setTheme, guestRoom } = useDemo();
  const [tab, setTab] = useState<GuestTabId>('home');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stay = state.frontDesk.stays.find((st) => st.room === room && st.status === 'in_house');
  const guest =
    (guestRoom?.id===room?{room,name:guestRoom.guest,checkout:stay?.departure||''}:undefined) ??
    (stay ? { room: stay.room, name: stay.guest, checkout: stay.departure } : undefined);
  const revoked = state.revokedRooms.includes(room);
  const valid = Boolean(guest) && guestRoom?.id === room && !revoked;
  const isLight = state.theme === 'light';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const tabProps = guest ? { room, guestName: guest.name, onNavigate: setTab } : null;
  const activeNav = NAV_GROUP[tab] ?? tab;

  return (
    <div className="guest-stage">
      <div className="guest-frame guest-shell">
        {!valid || !guest || !tabProps ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-500">
              <ShieldOff className="h-7 w-7" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-bold">{revoked ? 'QR session ended' : 'Invalid QR link'}</h1>
            <p className="guest-muted mt-2 max-w-xs text-sm">
              {revoked
                ? 'This room session ended after checkout or a room move. Ask Front Desk for a new code.'
                : 'This link does not match a verified stay. Scan the code in your room.'}
            </p>
            <div className="mt-4">
              <GuestPill tone={revoked ? 'warning' : 'danger'}>{revoked ? 'Session ended' : 'Not verified'}</GuestPill>
            </div>
            <Link href="/" className="btn btn-accent btn-md mt-6">
              Back to demo home
            </Link>
          </div>
        ) : (
          <>
            <header
              className="guest-surface guest-header flex shrink-0 items-center justify-between gap-3 px-4 pb-3"
              style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {tab !== 'home' && (
                  <button
                    type="button"
                    onClick={() => setTab('home')}
                    aria-label="Back to home"
                    className="guest-chip-btn grid h-9 w-9 shrink-0 place-items-center rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--a)), rgb(var(--b)))', color: 'var(--on-a)' }}
                >
                  <Hotel className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-bold">Atelier Hotel</span>
                  <span className="guest-muted flex items-center gap-1 text-[11px]">
                    <BedDouble className="h-3 w-3" aria-hidden /> Room {room}
                  </span>
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                  className="guest-chip-btn grid h-9 w-9 place-items-center rounded-full"
                >
                  {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  aria-label="Log out"
                  className="guest-chip-btn grid h-9 w-9 place-items-center rounded-full"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="guest-scroll">
              <div className="px-4 py-4">
                <TabPanel tab={tab} tabProps={tabProps} />
              </div>
            </div>

            <nav
              aria-label="Guest Portal sections"
              className="guest-tabbar shrink-0"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="grid grid-cols-5 gap-0.5 px-1.5 py-1.5">
                {NAV.map((t) => {
                  const Icon = t.icon;
                  const active = activeNav === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setTab(t.id)}
                      className="guest-tab-btn flex flex-col items-center gap-1 rounded-xl px-1 py-1.5"
                    >
                      <Icon className={cn('h-5 w-5', active && 'scale-110')} aria-hidden />
                      <span className="text-[10px] font-semibold leading-none">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {logoutOpen && (
          <GuestConfirm
            title="Log out of the guest portal?"
            body="You'll return to the demo home page. Your requests and orders stay saved."
            confirmLabel="Log out"
            onCancel={() => setLogoutOpen(false)}
            onConfirm={async () => {await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout',demo:new URLSearchParams(location.search).get('demo')})});location.assign('/');}}
          />
        )}

        {/* Sheets and dialogs render here so they stay inside the phone frame. */}
        <div id="guest-overlay-root" />
      </div>
    </div>
  );
}

function TabPanel({ tab, tabProps }: { tab: GuestTabId; tabProps: { room: string; guestName: string; onNavigate: (t: GuestTabId) => void } }) {
  switch (tab) {
    case 'home':
      return <HomeTab {...tabProps} />;
    case 'housekeeping':
      return <HousekeepingTab {...tabProps} />;
    case 'room_service':
      return <RoomServiceTab {...tabProps} />;
    case 'maintenance':
      return <MaintenanceTab {...tabProps} />;
    case 'spa':
      return <SpaConciergeTab {...tabProps} />;
    case 'requests':
      return <RequestsTab {...tabProps} />;
    case 'folio':
      return <FolioTab {...tabProps} />;
    case 'lost_found':
      return <LostFoundTab {...tabProps} />;
    default:
      return null;
  }
}
