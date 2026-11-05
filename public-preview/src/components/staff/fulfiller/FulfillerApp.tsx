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
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#070e1c] via-[#091322] to-[#040810]">
      {/* Fluid Responsive Container: Mobile full-bleed, Tablet max-w-4xl, Desktop max-w-7xl */}
      <div
        id="fulfiller-phone-shell"
        className="relative flex flex-col w-full h-full max-w-7xl mx-auto bg-ink-950 overflow-hidden text-white sm:border-x sm:border-white/[0.08] sm:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)]"
      >
        {/* In-App Toast Notification Banner */}
        {toasts && toasts.length > 0 && (
          <div className="absolute top-16 inset-x-3 sm:inset-x-6 z-[60] pointer-events-none flex flex-col items-center gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="toast-in pointer-events-auto w-full max-w-md flex items-start gap-2.5 rounded-2xl border border-emerald-400/40 bg-ink-900/95 backdrop-blur-xl px-3.5 py-2.5 text-xs text-white shadow-2xl animate-in slide-in-from-top-3 duration-200"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white leading-snug">{t.text}</p>
                  <p className="mt-0.5 text-[10px] uppercase font-mono tracking-wider text-mist-400">
                    Task Notification
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Responsive Header Bar: Mobile, Tablet & Desktop */}
        <header className="shrink-0 border-b border-white/[0.08] bg-ink-950/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 pt-3 pb-3 sm:py-4 z-40">
          <div className="flex items-center justify-between gap-3">
            {/* Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl sm:rounded-2xl bg-gradient-to-br text-xs sm:text-sm font-bold shadow-md shrink-0 text-ink-950',
                  profile.colorGradient,
                )}
              >
                {profile.avatarInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                    {profile.employeeName}
                  </h1>

                  <button
                    type="button"
                    onClick={() => setFulfillerAvailability(currentAvail === 'break' ? 'on_duty' : 'break')}
                    className={cn(
                      'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border transition-colors',
                      currentAvail === 'break'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                        : currentAvail === 'off_duty'
                          ? 'bg-rose-400/20 text-rose-300 border-rose-400/40 hover:bg-rose-400/30'
                          : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-400/30',
                    )}
                    title="Click to toggle On Duty / On Break"
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        currentAvail === 'break'
                          ? 'bg-amber-400 animate-pulse'
                          : currentAvail === 'off_duty'
                            ? 'bg-rose-400'
                            : 'bg-emerald-400',
                      )}
                    />
                    <span>
                      {currentAvail === 'break' ? 'On Break' : currentAvail === 'off_duty' ? 'Off Duty' : 'On Duty'}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-mist-300 truncate font-medium mt-0.5">
                  {profile.departmentName} · {profile.zone}
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!isSoundOn)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white transition-colors"
                title={isSoundOn ? 'Mute task chime' : 'Enable task chime'}
                aria-label="Toggle task chime"
              >
                {isSoundOn ? (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-mist-500" />
                )}
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white transition-colors"
                title={isLight ? 'Dark mode' : 'Light mode'}
                aria-label="Toggle theme"
              >
                {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </button>

              {/* Exit to Portals / Public */}
              <Link
                href="/login"
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white transition-colors"
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
          className="absolute inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-2xl pb-safe"
        >
          <div className="grid grid-cols-5 items-center px-2 py-1.5 max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
            {/* My Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'tasks' ? 'text-emerald-400 font-bold' : 'text-mist-400 hover:text-mist-200',
              )}
            >
              <span className="relative">
                <ListChecks className="h-4 w-4" />
                {activeTaskCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[8px] font-bold text-ink-950">
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
                activeTab === 'notifications' ? 'text-emerald-400 font-bold' : 'text-mist-400 hover:text-mist-200',
              )}
            >
              <span className="relative">
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-amber-400 px-0.5 text-[8px] font-bold text-ink-950 animate-pulse">
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
                activeTab === 'policies' ? 'text-emerald-400 font-bold' : 'text-mist-400 hover:text-mist-200',
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
                activeTab === 'performance' ? 'text-emerald-400 font-bold' : 'text-mist-400 hover:text-mist-200',
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
                activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-mist-400 hover:text-mist-200',
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
