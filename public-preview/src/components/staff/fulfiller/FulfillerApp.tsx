'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Bell,
  CheckCircle2,
  House,
  ListChecks,
  Moon,
  ShieldCheck,
  Sun,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FulfillerTasksTab } from './FulfillerTasksTab';
import { FulfillerNotificationsTab } from './FulfillerNotificationsTab';
import { FulfillerPerformanceTab } from './FulfillerPerformanceTab';
import { FulfillerProfileTab } from './FulfillerProfileTab';
import { FulfillerPoliciesTab } from './FulfillerPoliciesTab';
import {
  FULFILLER_PROFILES,
  type FulfillerDeptKey,
  type FulfillerProfile,
  taskMatchesFulfillerDept,
  isTaskAssignedToProfile,
} from './fulfillerProfiles';
import { playChime } from './chime';

type FulfillerTab = 'tasks' | 'notifications' | 'policies' | 'performance' | 'profile';

function FulfillerAppContent() {
  const { state, setPersona, setSoundEnabled, setTheme, setActiveDispatcherDept, toasts, setFulfillerAvailability } = useDemo();
  const [activeTab, setActiveTab] = useState<FulfillerTab>('tasks');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTaskCountRef = useRef<number | null>(null);

  const currentAvail = state.fulfillerAvailability ?? 'on_duty';

  const searchParams = useSearchParams();
  const rawParam = (searchParams?.get('dept') || '').toLowerCase();

  const getInitialDept = (): FulfillerDeptKey => {
    if (rawParam.includes('well') || rawParam.includes('spa')) return 'wellness';
    if (rawParam.includes('maint') || rawParam.includes('eng')) return 'maintenance';
    if (rawParam.includes('fnb') || rawParam.includes('food') || rawParam.includes('dining')) return 'fnb';
    if (state.activeDispatcherDept === 'Wellness') return 'wellness';
    if (state.activeDispatcherDept === 'Maintenance & Engineering') return 'maintenance';
    if (state.activeDispatcherDept === 'Food & Beverages') return 'fnb';
    return 'housekeeping';
  };

  const [activeDeptKey, setActiveDeptKey] = useState<FulfillerDeptKey>(getInitialDept);

  useEffect(() => {
    if (rawParam.includes('well') || rawParam.includes('spa')) setActiveDeptKey('wellness');
    else if (rawParam.includes('maint') || rawParam.includes('eng')) setActiveDeptKey('maintenance');
    else if (rawParam.includes('fnb') || rawParam.includes('food') || rawParam.includes('dining')) setActiveDeptKey('fnb');
    else if (rawParam.includes('house')) setActiveDeptKey('housekeeping');
  }, [rawParam]);

  const profile: FulfillerProfile = FULFILLER_PROFILES[activeDeptKey] || FULFILLER_PROFILES.housekeeping;

  // Set persona on mount
  useEffect(() => {
    setPersona('task_fulfiller');
  }, [setPersona]);

  // Audio chime trigger when new task enters queue
  const tasks = state.items.task_fulfiller ?? [];
  const isSoundOn = state.soundEnabled ?? true;

  useEffect(() => {
    if (prevTaskCountRef.current !== null && tasks.length > prevTaskCountRef.current) {
      if (isSoundOn) {
        playChime();
      }
    }
    prevTaskCountRef.current = tasks.length;
  }, [tasks.length, isSoundOn]);

  // Scroll to top on tab change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activeDeptKey]);

  const activeTaskCount = tasks.filter(
    (t) =>
      taskMatchesFulfillerDept(t, activeDeptKey) &&
      isTaskAssignedToProfile(t, profile) &&
      (t.status === 'Assigned' || t.status === 'Accepted' || t.status === 'In progress'),
  ).length;
  const notifications = (state.notifications ?? []).filter(
    (n) =>
      n.roleId === 'task_fulfiller' &&
      (n.department
        ? taskMatchesFulfillerDept({ department: n.department } as any, activeDeptKey)
        : true),
  );
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const isLight = state.theme === 'light';

  return (
    <div
      className={cn(
        'fulfiller-root fixed inset-0 flex flex-col overflow-hidden transition-colors duration-300',
        isLight
          ? 'fulfiller-light bg-[#f3efe8]'
          : 'fulfiller-dark bg-gradient-to-b from-[#0c0c0e] via-[#121215] to-[#09090b]',
      )}
    >
      {/* Scoped Theme Styles for Task Fulfiller: Charcoal, Champagne Gold, Warm Beige, Subtle Brown, Cream */}
      <style>{`
        .fulfiller-root.fulfiller-dark {
          --page: 12 12 14;
          --ink-950: 20 20 23;
          --ink-900: 28 28 32;
          --ink-850: 33 33 38;
          --ink-800: 42 41 47;
          --ink-700: 58 54 58;
          --ink-600: 78 72 74;
          --white: 247 244 237; /* Cream-coloured primary text */
          --mist-100: 247 244 237;
          --mist-200: 236 228 217;
          --mist-300: 217 206 190; /* Warm beige */
          --mist-400: 166 152 134; /* Warm taupe */
          --mist-500: 128 116 102; /* Subtle brown */
          --a: 223 193 135; /* Champagne-gold */
          --b: 200 169 110; /* Muted gold */
          --on-a: #141417;
          --t-emerald: 200 169 110;
          --t-amber: 223 193 135;
          --t-sky: 212 184 150;
          --t-rose: 206 142 122;
          --t-violet: 196 166 128;
          color: #f7f4ed;
        }

        .fulfiller-root.fulfiller-light {
          --page: 243 239 232;
          --ink-950: 250 248 244;
          --ink-900: 255 255 255;
          --ink-850: 247 244 238;
          --ink-800: 239 233 223;
          --ink-700: 226 218 206;
          --ink-600: 208 198 184;
          --white: 43 34 26; /* Deep espresso charcoal-brown */
          --mist-100: 43 34 26;
          --mist-200: 64 52 41;
          --mist-300: 104 87 71;
          --mist-400: 147 129 112;
          --mist-500: 182 167 150;
          --a: 191 161 95;
          --b: 168 138 78;
          --on-a: #ffffff;
          --t-emerald: 184 150 86;
          --t-amber: 200 169 110;
          --t-sky: 168 140 108;
          --t-rose: 184 102 82;
          --t-violet: 148 120 90;
          color: #2b221a;
        }

        /* Dark Theme Overrides */
        .fulfiller-dark #fulfiller-phone-shell {
          background-color: #141417 !important;
          border-color: rgba(165, 130, 95, 0.24) !important;
        }
        .fulfiller-dark header {
          background-color: rgba(24, 24, 28, 0.95) !important;
          border-color: rgba(165, 130, 95, 0.24) !important;
        }
        .fulfiller-dark nav {
          background-color: rgba(24, 24, 28, 0.95) !important;
          border-color: rgba(165, 130, 95, 0.24) !important;
        }
        .fulfiller-dark .border-white\/10,
        .fulfiller-dark .border-white\/20,
        .fulfiller-dark .border-white\/\[0\.08\],
        .fulfiller-dark .border-white\/\[0\.06\],
        .fulfiller-dark .border-white\/\[0\.04\],
        .fulfiller-dark .border-white\/\[0\.03\],
        .fulfiller-dark .border-white\/\[0\.02\],
        .fulfiller-dark .border-emerald-500\/40,
        .fulfiller-dark .border-emerald-500\/30,
        .fulfiller-dark .border-emerald-500\/20,
        .fulfiller-dark .border-emerald-400\/40,
        .fulfiller-dark .border-emerald-400\/30,
        .fulfiller-dark .border-emerald-400\/20,
        .fulfiller-dark .border-amber-400\/40,
        .fulfiller-dark .border-amber-400\/30,
        .fulfiller-dark .border-amber-400\/20,
        .fulfiller-dark .border-sky-500\/30,
        .fulfiller-dark .border-purple-400\/30 {
          border-color: rgba(165, 130, 95, 0.24) !important;
        }
        .fulfiller-dark .bg-white\/\[0\.03\],
        .fulfiller-dark .bg-white\/\[0\.04\],
        .fulfiller-dark .bg-white\/\[0\.02\],
        .fulfiller-dark .bg-white\/\[0\.06\],
        .fulfiller-dark .bg-emerald-500\/\[0\.03\],
        .fulfiller-dark .bg-emerald-500\/\[0\.06\],
        .fulfiller-dark .bg-emerald-500\/10,
        .fulfiller-dark .bg-amber-400\/\[0\.03\],
        .fulfiller-dark .bg-amber-400\/\[0\.04\],
        .fulfiller-dark .bg-amber-400\/10,
        .fulfiller-dark .bg-purple-400\/\[0\.04\] {
          background-color: #1c1c20 !important;
        }
        .fulfiller-dark .text-white {
          color: #f7f4ed !important;
        }
        .fulfiller-dark .text-mist-200,
        .fulfiller-dark .text-mist-300 {
          color: #d9cebe !important;
        }
        .fulfiller-dark .text-mist-400,
        .fulfiller-dark .text-mist-500 {
          color: #a69886 !important;
        }
        .fulfiller-dark .text-emerald-400,
        .fulfiller-dark .text-emerald-300,
        .fulfiller-dark .text-amber-400,
        .fulfiller-dark .text-amber-300,
        .fulfiller-dark .text-amber-200,
        .fulfiller-dark .text-sky-400 {
          color: #dfc187 !important;
        }
        .fulfiller-dark .bg-emerald-500,
        .fulfiller-dark .bg-emerald-600,
        .fulfiller-dark .bg-amber-400,
        .fulfiller-dark .bg-sky-500 {
          background-color: #c8a96e !important;
          color: #141417 !important;
        }
        .fulfiller-dark button.bg-emerald-500:hover,
        .fulfiller-dark button.bg-amber-400:hover,
        .fulfiller-dark button.bg-sky-500:hover {
          background-color: #dfc187 !important;
          color: #141417 !important;
        }
        .fulfiller-dark .bg-emerald-500\/20,
        .fulfiller-dark .bg-emerald-400\/20,
        .fulfiller-dark .bg-amber-400\/20,
        .fulfiller-dark .bg-amber-500\/20,
        .fulfiller-dark .bg-sky-400\/20,
        .fulfiller-dark .bg-purple-400\/20 {
          background-color: rgba(200, 169, 110, 0.16) !important;
          color: #dfc187 !important;
          border-color: rgba(165, 130, 95, 0.35) !important;
        }

        /* Light Theme Overrides */
        .fulfiller-light #fulfiller-phone-shell {
          background-color: #faf8f4 !important;
          border-color: rgba(180, 150, 120, 0.3) !important;
        }
        .fulfiller-light header {
          background-color: rgba(255, 255, 255, 0.96) !important;
          border-color: rgba(180, 150, 120, 0.3) !important;
        }
        .fulfiller-light nav {
          background-color: rgba(255, 255, 255, 0.96) !important;
          border-color: rgba(180, 150, 120, 0.3) !important;
        }
        .fulfiller-light .border-white\/10,
        .fulfiller-light .border-white\/20,
        .fulfiller-light .border-white\/\[0\.08\],
        .fulfiller-light .border-white\/\[0\.06\],
        .fulfiller-light .border-white\/\[0\.04\],
        .fulfiller-light .border-white\/\[0\.03\],
        .fulfiller-light .border-slate-300\/70,
        .fulfiller-light .border-slate-300\/80,
        .fulfiller-light .border-slate-200,
        .fulfiller-light .border-emerald-500\/40,
        .fulfiller-light .border-emerald-500\/30,
        .fulfiller-light .border-emerald-400\/40,
        .fulfiller-light .border-amber-400\/40 {
          border-color: rgba(180, 150, 120, 0.32) !important;
        }
        .fulfiller-light .bg-white\/\[0\.03\],
        .fulfiller-light .bg-white\/\[0\.04\],
        .fulfiller-light .bg-white\/\[0\.02\],
        .fulfiller-light .bg-white\/\[0\.06\],
        .fulfiller-light .bg-emerald-500\/\[0\.03\],
        .fulfiller-light .bg-emerald-500\/\[0\.06\],
        .fulfiller-light .bg-amber-400\/\[0\.03\],
        .fulfiller-light .bg-amber-400\/\[0\.04\] {
          background-color: #ffffff !important;
        }
        .fulfiller-light .text-white {
          color: #2b221a !important;
        }
        .fulfiller-light .text-mist-200,
        .fulfiller-light .text-mist-300 {
          color: #685747 !important;
        }
        .fulfiller-light .text-mist-400,
        .fulfiller-light .text-mist-500 {
          color: #938170 !important;
        }
        .fulfiller-light .text-emerald-600,
        .fulfiller-light .text-emerald-400,
        .fulfiller-light .text-amber-600,
        .fulfiller-light .text-amber-500,
        .fulfiller-light .text-amber-400,
        .fulfiller-light .text-sky-600 {
          color: #b89656 !important;
        }
        .fulfiller-light .bg-emerald-500,
        .fulfiller-light .bg-emerald-600,
        .fulfiller-light .bg-amber-400,
        .fulfiller-light .bg-sky-500 {
          background-color: #c8a96e !important;
          color: #1a1612 !important;
        }
        .fulfiller-light button.bg-emerald-500:hover,
        .fulfiller-light button.bg-amber-400:hover {
          background-color: #bfa15f !important;
          color: #1a1612 !important;
        }
        .fulfiller-light .bg-emerald-500\/20,
        .fulfiller-light .bg-emerald-400\/20,
        .fulfiller-light .bg-amber-400\/20,
        .fulfiller-light .bg-sky-400\/20,
        .fulfiller-light .bg-purple-400\/20 {
          background-color: rgba(200, 169, 110, 0.15) !important;
          color: #9c7836 !important;
          border-color: rgba(180, 150, 120, 0.4) !important;
        }
      `}</style>

      {/* Fluid Responsive Container: Mobile full-bleed, Tablet max-w-4xl, Desktop max-w-7xl */}
      <div
        id="fulfiller-phone-shell"
        className={cn(
          'relative flex flex-col w-full h-full max-w-7xl mx-auto overflow-hidden transition-colors duration-300 sm:border-x',
          isLight
            ? 'bg-[#faf8f4] text-[#2b221a] sm:border-[rgba(180,150,120,0.3)] sm:shadow-[0_20px_60px_-15px_rgba(80,60,40,0.08)]'
            : 'bg-[#141417] text-[#f7f4ed] sm:border-[rgba(165,130,95,0.24)] sm:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)]',
        )}
      >
        {/* In-App Toast Notification Banner */}
        {toasts && toasts.length > 0 && (
          <div className="absolute top-16 inset-x-3 sm:inset-x-6 z-[60] pointer-events-none flex flex-col items-center gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'toast-in pointer-events-auto w-full max-w-md flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs shadow-2xl animate-in slide-in-from-top-3 duration-200 backdrop-blur-xl',
                  isLight
                    ? 'border-[rgba(180,150,120,0.4)] bg-white/95 text-[#2b221a]'
                    : 'border-[rgba(165,130,95,0.4)] bg-[#1c1c20]/95 text-[#f7f4ed]',
                )}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c8a96e]" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{t.text}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-[10px] uppercase font-mono tracking-wider',
                      isLight ? 'text-[#938170]' : 'text-[#a69886]',
                    )}
                  >
                    Task Notification
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Responsive Header Bar: Mobile, Tablet & Desktop */}
        <header
          className={cn(
            'shrink-0 border-b px-4 sm:px-6 lg:px-8 pt-3 pb-3 sm:py-4 z-40 transition-colors duration-300',
            isLight
              ? 'border-[rgba(180,150,120,0.3)] bg-white/95 backdrop-blur-xl text-[#2b221a] shadow-xs'
              : 'border-[rgba(165,130,95,0.24)] bg-[#18181c]/95 text-[#f7f4ed] backdrop-blur-xl',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl sm:rounded-2xl shadow-md shrink-0 text-[#141417]"
              >
                <div
                  className={cn(
                    'w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br text-[#141417]',
                    profile.colorGradient,
                  )}
                >
                  {profile.avatarInitials}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className={cn(
                      'text-xs sm:text-sm md:text-base font-bold truncate max-w-[140px] sm:max-w-xs transition-colors',
                      isLight ? 'text-[#2b221a]' : 'text-[#f7f4ed]',
                    )}
                  >
                    {profile.employeeName}
                  </h1>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Cycle through: On Duty -> On Break -> Off Duty -> On Duty
                      const next =
                        currentAvail === 'on_duty'
                          ? 'break'
                          : currentAvail === 'break'
                            ? 'off_duty'
                            : 'on_duty';
                      setFulfillerAvailability(next);
                    }}
                    className={cn(
                      'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border transition-colors cursor-pointer',
                      currentAvail === 'break'
                        ? isLight
                          ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                          : 'bg-[#dfc187]/20 text-[#e8cf9a] border-[#dfc187]/40'
                        : currentAvail === 'off_duty'
                          ? isLight
                            ? 'bg-rose-500/15 text-rose-700 border-rose-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isLight
                            ? 'bg-[#c8a96e]/15 text-[#8c6b2d] border-[#c8a96e]/40'
                            : 'bg-[#c8a96e]/20 text-[#dfc187] border-[#c8a96e]/40',
                    )}
                    title="Click to switch duty status (On Duty / On Break / Off Duty)"
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        currentAvail === 'break'
                          ? isLight ? 'bg-amber-600 animate-pulse' : 'bg-[#dfc187] animate-pulse'
                          : currentAvail === 'off_duty'
                            ? 'bg-rose-500'
                            : isLight ? 'bg-[#8c6b2d]' : 'bg-[#c8a96e]',
                      )}
                    />
                    <span>
                      {currentAvail === 'break' ? 'On Break' : currentAvail === 'off_duty' ? 'Off Duty' : 'On Duty'}
                    </span>
                  </button>
                </div>
                <p
                  className={cn(
                    'text-[10px] sm:text-xs truncate font-medium mt-0.5',
                    isLight ? 'text-[#685747]' : 'text-[#d9cebe]',
                  )}
                >
                  {profile.departmentName} · {profile.zone}
                </p>
              </div>
            </div>

            {/* Quick Header Actions: Sound, Theme, Notification Symbol, Exit */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sound / Chime Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!isSoundOn)}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  isLight
                    ? 'border-[rgba(180,150,120,0.3)] bg-[#faf8f4] text-[#685747] hover:bg-[#f0ebe1]'
                    : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#d9cebe] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                )}
                title={isSoundOn ? 'Mute task chime' : 'Enable task chime'}
                aria-label="Toggle task chime"
              >
                {isSoundOn ? (
                  <Volume2 className={cn('h-3.5 w-3.5', isLight ? 'text-[#8c6b2d]' : 'text-[#dfc187]')} />
                ) : (
                  <VolumeX className={cn('h-3.5 w-3.5', isLight ? 'text-[#938170]' : 'text-[#a69886]')} />
                )}
              </button>

              {/* Theme Change Toggle */}
              <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  isLight
                    ? 'border-[rgba(180,150,120,0.3)] bg-[#faf8f4] text-[#b89656] hover:bg-[#f0ebe1]'
                    : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#dfc187] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                )}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle theme"
              >
                {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-[#dfc187]" />}
              </button>

              {/* Notification Symbol Button */}
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  'relative grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  activeTab === 'notifications'
                    ? isLight
                      ? 'border-[#b89656] bg-[#c8a96e]/15 text-[#9c7836] ring-2 ring-[#c8a96e]/30'
                      : 'border-[#dfc187] bg-[#c8a96e]/20 text-[#dfc187] ring-2 ring-[#dfc187]/25'
                    : isLight
                      ? 'border-[rgba(180,150,120,0.3)] bg-[#faf8f4] text-[#685747] hover:bg-[#f0ebe1]'
                      : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#d9cebe] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                )}
                title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notifications` : 'Notifications & Alerts'}
                aria-label="View notifications"
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c8a96e] px-1 text-[8px] font-extrabold text-[#141417] shadow-sm animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Exit to Portals / Public */}
              <Link
                href="/login"
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  isLight
                    ? 'border-[rgba(180,150,120,0.3)] bg-[#faf8f4] text-[#685747] hover:bg-[#f0ebe1]'
                    : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#d9cebe] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                )}
                title="Exit to staff login"
                aria-label="Exit to staff login"
              >
                <House className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable Tab Content Container: Mobile, Tablet & Desktop responsive padding */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-28 no-scrollbar overscroll-contain">
          {activeTab === 'tasks' && <FulfillerTasksTab profile={profile} />}
          {activeTab === 'notifications' && (
            <FulfillerNotificationsTab profile={profile} onNavigateToTasks={() => setActiveTab('tasks')} />
          )}
          {activeTab === 'policies' && <FulfillerPoliciesTab />}
          {activeTab === 'performance' && <FulfillerPerformanceTab profile={profile} />}
          {activeTab === 'profile' && <FulfillerProfileTab profile={profile} />}
        </div>

        {/* Bottom Navigation Bar: Mobile, Tablet & Desktop responsive centering */}
        <nav
          aria-label="Fulfiller app navigation"
          className={cn(
            'absolute inset-x-0 bottom-0 z-40 border-t pb-safe transition-colors duration-300 backdrop-blur-2xl',
            isLight
              ? 'border-[rgba(180,150,120,0.3)] bg-white/95 text-[#685747] shadow-[0_-4px_25px_rgba(80,60,40,0.06)]'
              : 'border-[rgba(165,130,95,0.24)] bg-[#18181c]/95 text-[#d9cebe]',
          )}
        >
          <div className="grid grid-cols-5 items-center px-2 py-1.5 max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
            {/* My Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'tasks'
                  ? isLight
                    ? 'text-[#8c6b2d] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#685747] hover:text-[#2b221a]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <span className="relative">
                <ListChecks className="h-4 w-4" />
                {activeTaskCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#c8a96e] px-0.5 text-[8px] font-bold text-[#141417]">
                    {activeTaskCount}
                  </span>
                )}
              </span>
              <span className="text-[9px] leading-tight">Tasks</span>
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'notifications'
                  ? isLight
                    ? 'text-[#8c6b2d] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#685747] hover:text-[#2b221a]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <span className="relative">
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#dfc187] px-0.5 text-[8px] font-bold text-[#141417] animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </span>
              <span className="text-[9px] leading-tight">Alerts</span>
            </button>

            {/* Policies */}
            <button
              type="button"
              onClick={() => setActiveTab('policies')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'policies'
                  ? isLight
                    ? 'text-[#8c6b2d] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#685747] hover:text-[#2b221a]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[9px] leading-tight">Policies</span>
            </button>

            {/* Performance */}
            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'performance'
                  ? isLight
                    ? 'text-[#8c6b2d] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#685747] hover:text-[#2b221a]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <Activity className="h-4 w-4" />
              <span className="text-[9px] leading-tight">Stats</span>
            </button>

            {/* Profile */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'profile'
                  ? isLight
                    ? 'text-[#8c6b2d] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#685747] hover:text-[#2b221a]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <User className="h-4 w-4" />
              <span className="text-[9px] leading-tight">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export function FulfillerApp() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-900 flex items-center justify-center text-stone-300">Loading Task Fulfiller Portal...</div>}>
      <FulfillerAppContent />
    </Suspense>
  );
}
