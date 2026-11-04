'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BedDouble,
  ChevronLeft,
  Hotel,
  House,
  LogOut,
  Moon,
  ShieldOff,
  Sun,
  Sparkles,
  ListChecks,
  Bell,
  User,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { HomeDashboard } from '@/components/guest/HomeDashboard';
import { AllServicesSection } from '@/components/guest/AllServicesSection';
import { ActivitySection } from '@/components/guest/ActivitySection';
import { NotificationsHubSection } from '@/components/guest/NotificationsHubSection';
import { ProfileSection } from '@/components/guest/ProfileSection';
import { GuestInteractiveTour } from '@/components/guest/GuestInteractiveTour';
import { useEmergencyBroadcast } from '@/lib/emergencyBroadcast';
import { GuestConfirm, GuestPill } from '@/components/guest/guestUi';
import type { GuestTabId, GuestMainSection } from '@/components/guest/types';
import { guests } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

/** The 5 navigation sections */
const NAV: { id: GuestMainSection; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'activity', label: 'My Activity', icon: ListChecks },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

const NAV_MAP: Record<string, GuestMainSection> = {
  home: 'home',
  services: 'services',
  activity: 'activity',
  notifications: 'notifications',
  profile: 'profile',
  // Backward compatibility mappings
  alerts: 'notifications',
  complaints: 'services',
  lost_found: 'services',
  dining: 'services',
  room_service: 'services',
  housekeeping: 'services',
  maintenance: 'services',
  spa: 'services',
  front_desk: 'services',
  reminders: 'services',
  dnd: 'services',
  requests: 'activity',
  folio: 'profile',
};

export function GuestPortalPreview({ room, token }: { room: string; token: string }) {
  const router = useRouter();
  const { state, setTheme } = useDemo();
  const [tab, setTab] = useState<GuestTabId>('home');
  const [subtab, setSubtab] = useState<string | undefined>(undefined);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stay = (state.frontDesk?.stays ?? []).find((st) => st.room === room && st.status === 'in_house');
  const guest =
    guests.find((g) => g.room === room) ??
    (stay ? { room: stay.room, name: stay.guest, checkout: stay.departure } : undefined);
  const revoked = (state.revokedRooms ?? []).includes(room);
  const valid = Boolean(guest) && token === 'demo-token' && !revoked;
  const isLight = state.theme === 'light';

  // Listen for custom open-guest-tour event
  useEffect(() => {
    const handleOpen = () => setTourOpen(true);
    window.addEventListener('open-guest-tour', handleOpen);
    return () => window.removeEventListener('open-guest-tour', handleOpen);
  }, []);

  // Active activity count for badge
  const activeActivityCount = useMemo(() => {
    const allItems = Object.values(state.items ?? {}).flat();
    const activeTasks = allItems.filter(
      (i) => i.guest && i.room === room && !['Completed', 'Delivered', 'Cancelled', 'Closed'].includes(i.status),
    ).length;
    const pendingReminders = (state.guestReminders ?? []).filter(
      (r) => r.room === room && r.status !== 'completed',
    ).length;
    return activeTasks + pendingReminders;
  }, [state.items, state.guestReminders, room]);

  // Unread personal notifications count for badge
  const unreadNotifCount = useMemo(() => {
    return (state.guestNotifications ?? []).filter((n) => n.room === room && !n.read).length;
  }, [state.guestNotifications, room]);

  const { alert: emergencyAlert, isBroadcastActive } = useEmergencyBroadcast();

  // Critical alerts count for badge - only active when Front Desk broadcast is live
  const criticalAlertsCount = isBroadcastActive && emergencyAlert ? 1 : 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, subtab]);

    // Browser History API integration for hardware / browser back button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Seed initial root state if not already set
    if (!window.history.state || !window.history.state.portal) {
      window.history.replaceState({ portal: true, tab: 'home', subtab: undefined }, '');
    }

    const onPopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.portal && state.tab) {
        setTab(state.tab as GuestTabId);
        setSubtab(state.subtab);
      } else {
        // Fallback safely to home tab - never exit or log the user out
        setTab('home');
        setSubtab(undefined);
        window.history.pushState({ portal: true, tab: 'home', subtab: undefined }, '');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function handleNavigate(targetTab: GuestTabId, targetSubtab?: string) {
    if (tab === targetTab && subtab === targetSubtab) return;
    setTab(targetTab);
    setSubtab(targetSubtab);

    if (typeof window !== 'undefined') {
      window.history.pushState(
        { portal: true, tab: targetTab, subtab: targetSubtab },
        ''
      );
    }
  }

  const tabProps = guest
    ? {
        room,
        guestName: guest.name,
        onNavigate: handleNavigate,
        initialSubtab: subtab,
      }
    : null;

  const activeNav = NAV_MAP[tab] ?? 'home';

  return (
    <div className="guest-stage">
      <div className="guest-frame guest-shell w-full max-w-full overflow-x-hidden box-border">
        {!valid || !guest || !tabProps ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center min-h-[500px]">
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
            {/* RESPONSIVE LUXURY HEADER */}
            <header
              className="guest-surface guest-header flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:px-12 py-3.5 sm:py-4 border-b border-white/10"
              style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
            >
              {/* Brand & Room Info */}
              <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                <span
                  className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl shadow-md cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--a)), rgb(var(--b)))', color: 'var(--on-a)' }}
                  onClick={() => handleNavigate('home')}
                >
                  <Hotel className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </span>
                <div
                  className="min-w-0 cursor-pointer"
                  onClick={() => handleNavigate('profile')}
                  title="View Profile & Stay"
                >
                  <div className="flex items-center gap-2">
                    <span className="block truncate text-xs sm:text-sm lg:text-base font-black tracking-tight text-white hover:text-amber-300 transition-colors">
                      The Grand ADP
                    </span>
                    <span className="hidden sm:inline-block text-[10px] sm:text-xs text-amber-400 font-mono font-semibold uppercase tracking-wider">
                      Resort &amp; Suites
                    </span>
                  </div>
                  <span className="guest-muted flex items-center gap-1.5 text-[10px] sm:text-xs">
                    <BedDouble className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" aria-hidden /> Room {room} · {guest.name}
                  </span>
                </div>
              </div>

              {/* DESKTOP TOP NAVIGATION BAR (Visible on md/lg screens) */}
              <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                {NAV.map((t) => {
                  const Icon = t.icon;
                  const active = activeNav === t.id;
                  const hasActivityBadge = t.id === 'activity' && activeActivityCount > 0;
                  const hasNotifBadge = t.id === 'notifications' && unreadNotifCount > 0;
                  const hasCriticalAlert = t.id === 'notifications' && criticalAlertsCount > 0;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleNavigate(t.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative',
                        active
                          ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                          : 'text-mist-300 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" />
                      <span>{t.label}</span>
                      {hasActivityBadge && (
                        <span
                          className={cn(
                            'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                            active ? 'bg-black/20 text-ink-950' : 'bg-amber-400 text-ink-950'
                          )}
                        >
                          {activeActivityCount}
                        </span>
                      )}
                      {hasNotifBadge && (
                        <span
                          className={cn(
                            'px-1.5 py-0.2 rounded-full text-[9px] font-bold',
                            active ? 'bg-black/20 text-ink-950' : 'bg-amber-400 text-ink-950'
                          )}
                        >
                          {unreadNotifCount}
                        </span>
                      )}
                      {hasCriticalAlert && !hasNotifBadge && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Header Right Actions */}
              <div data-tour="tour-header-controls" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                {/* Take Tour Button */}
                <button
                  type="button"
                  onClick={() => setTourOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-white/10 hover:border-amber-400/40 text-mist-300 hover:text-amber-300 text-xs sm:text-sm font-semibold transition-all"
                  title="Interactive App Guide"
                >
                  <Compass className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">App Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme(isLight ? 'dark' : 'light')}
                  aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                  className="guest-chip-btn grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full hover:border-amber-400/40"
                  title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                >
                  {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
                </button>

                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  aria-label="Log out"
                  className="guest-chip-btn grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full hover:border-rose-400/40"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 text-mist-400 hover:text-rose-400" aria-hidden />
                </button>
              </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div ref={scrollRef} className="guest-scroll w-full max-w-full overflow-x-hidden box-border">
              <div className="px-4 sm:px-8 lg:px-12 xl:px-16 py-5 sm:py-7 lg:py-9 max-w-[1540px] mx-auto w-full box-border overflow-x-hidden">
                <TabPanel tab={tab} subtab={subtab} tabProps={tabProps} />
              </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR (Hidden on md/lg screens) */}
            <nav
              aria-label="Guest Navigation"
              className="guest-tabbar shrink-0 md:hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="grid grid-cols-5 gap-0.5 px-1 py-1.5">
                {NAV.map((t) => {
                  const Icon = t.icon;
                  const active = activeNav === t.id;
                  const hasActivityBadge = t.id === 'activity' && activeActivityCount > 0;
                  const hasNotifBadge = t.id === 'notifications' && unreadNotifCount > 0;
                  const hasCriticalAlert = t.id === 'notifications' && criticalAlertsCount > 0;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => handleNavigate(t.id)}
                      className="guest-tab-btn flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 relative transition-all"
                    >
                      <div className="relative">
                        <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110 text-amber-400')} aria-hidden />
                        {hasActivityBadge && (
                          <span className="absolute -top-1 -right-1.5 px-1 min-w-[14px] h-3.5 rounded-full bg-amber-400 text-ink-950 font-bold text-[9px] flex items-center justify-center ring-2 ring-ink-950">
                            {activeActivityCount}
                          </span>
                        )}
                        {hasNotifBadge && (
                          <span className="absolute -top-1 -right-1.5 px-1 min-w-[14px] h-3.5 rounded-full bg-amber-400 text-ink-950 font-bold text-[9px] flex items-center justify-center ring-2 ring-ink-950">
                            {unreadNotifCount}
                          </span>
                        )}
                        {hasCriticalAlert && !hasNotifBadge && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-ink-950 animate-pulse" />
                        )}
                      </div>
                      <span className={cn('text-[10px] font-semibold leading-none truncate max-w-full', active && 'text-amber-400 font-bold')}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {/* LOGOUT CONFIRMATION MODAL */}
        {logoutOpen && (
          <GuestConfirm
            title="Log out of the guest portal?"
            body="You'll return to the demo home page. Your requests, messages and folio stay saved."
            confirmLabel="Log out"
            onCancel={() => setLogoutOpen(false)}
            onConfirm={() => router.push('/')}
          />
        )}

        {/* INTERACTIVE NAVIGATION ONBOARDING GUIDE */}
        {valid && guest && (
          <GuestInteractiveTour
            room={room}
            guestName={guest.name}
            isOpen={tourOpen}
            onClose={() => setTourOpen(false)}
            onNavigate={handleNavigate}
            isLight={isLight}
          />
        )}

        {/* Sheets and dialogs render here */}
        <div id="guest-overlay-root" />
      </div>
    </div>
  );
}

function TabPanel({
  tab,
  subtab,
  tabProps,
}: {
  tab: GuestTabId;
  subtab?: string;
  tabProps: {
    room: string;
    guestName: string;
    onNavigate: (t: GuestTabId, subtab?: string) => void;
    initialSubtab?: string;
  };
}) {
  switch (tab) {
    case 'home':
      return <HomeDashboard {...tabProps} />;
    case 'services':
      return <AllServicesSection {...tabProps} initialSubtab={subtab as any} />;
    case 'activity':
      return <ActivitySection {...tabProps} />;
    case 'notifications':
      return <NotificationsHubSection {...tabProps} initialSubtab={subtab as any} />;
    case 'profile':
      return <ProfileSection {...tabProps} initialSubtab={subtab as any} />;

    // Direct / backward-compatible links
    case 'alerts':
      return <NotificationsHubSection {...tabProps} initialSubtab="alerts" />;
    case 'complaints':
      return <AllServicesSection {...tabProps} initialSubtab="complaints" />;
    case 'lost_found':
      return <AllServicesSection {...tabProps} initialSubtab="lost_found" />;
    case 'dining':
      return <AllServicesSection {...tabProps} initialSubtab="dining" />;
    case 'room_service':
    case 'housekeeping':
      return <AllServicesSection {...tabProps} initialSubtab="room_service" />;
    case 'maintenance':
      return <AllServicesSection {...tabProps} initialSubtab="maintenance" />;
    case 'spa':
      return <AllServicesSection {...tabProps} initialSubtab="spa" />;
    case 'concierge':
      return <AllServicesSection {...tabProps} initialSubtab="concierge" />;
    case 'recreation':
      return <AllServicesSection {...tabProps} initialSubtab="recreation" />;
    case 'front_desk':
      return <AllServicesSection {...tabProps} initialSubtab="front_desk" />;
    case 'reminders':
      return <AllServicesSection {...tabProps} initialSubtab="reminders" />;
    case 'dnd':
      return <AllServicesSection {...tabProps} initialSubtab="dnd" />;
    case 'folio':
      return <ProfileSection {...tabProps} initialSubtab="folio" />;
    case 'requests':
      return <ActivitySection {...tabProps} />;

    default:
      return <HomeDashboard {...tabProps} />;
  }
}
