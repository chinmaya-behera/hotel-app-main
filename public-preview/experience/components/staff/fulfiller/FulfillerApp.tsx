'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Gauge,
  Hotel,
  House,
  ListChecks,
  Moon,
  Sparkles,
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
import { playChime } from './chime';

type FulfillerTab = 'tasks' | 'notifications' | 'performance' | 'profile';

export function FulfillerApp() {
  const { account, state, setPersona, setSoundEnabled, setTheme } = useDemo();
  const [activeTab, setActiveTab] = useState<FulfillerTab>('tasks');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTaskCountRef = useRef<number | null>(null);

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
  }, [activeTab]);

  const activeTaskCount = tasks.filter((t) => t.status === 'Assigned' || t.status === 'Accepted' || t.status === 'In progress').length;
  const notifications = (state.notifications ?? []).filter((n) => n.roleId === 'task_fulfiller');
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const isLight = state.theme === 'light';

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#070e1c] via-[#091322] to-[#040810]">
      {/* Centered Phone Shell Container on Desktop, Full Screen on Mobile */}
      <div className="relative flex flex-col w-full h-full sm:h-[844px] sm:max-h-[calc(100dvh-2rem)] sm:w-[412px] sm:rounded-[2.8rem] sm:border-[8px] sm:border-[#0f172a] sm:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] bg-ink-950 overflow-hidden text-white">
        {/* Phone Speaker Notch (Desktop Shell Only) */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 z-50 justify-center pointer-events-none pt-2">
          <div className="h-4 w-28 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            <span className="h-1 w-10 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Mobile Header Bar */}
        <header className="shrink-0 border-b border-white/[0.08] bg-ink-950/90 backdrop-blur-xl px-4 pt-3 pb-3 sm:pt-6 z-40">
          <div className="flex items-center justify-between gap-3">
            {/* Identity */}
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-ink-950 shadow-md shadow-emerald-500/20">
                VS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-bold text-white truncate">{account?.person||'Staff member'}</h1>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 shrink-0" />
                </div>
                <p className="text-[10px] text-mist-400 truncate">Housekeeping · Floors 1–5</p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!isSoundOn)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white transition-colors"
                title={isSoundOn ? 'Mute task chime' : 'Enable task chime'}
                aria-label="Toggle task chime"
              >
                {isSoundOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-mist-500" />}
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                disabled
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white transition-colors"
                title="Atelier beige theme"
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

        {/* Scrollable Tab Content Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-3 no-scrollbar overscroll-contain">
          {activeTab === 'tasks' && <FulfillerTasksTab />}
          {activeTab === 'notifications' && <FulfillerNotificationsTab />}
          {activeTab === 'performance' && <FulfillerPerformanceTab />}
          {activeTab === 'profile' && <FulfillerProfileTab />}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Fulfiller app navigation"
          className="absolute inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-2xl pb-safe"
        >
          <div className="grid grid-cols-4 items-center px-1 py-1.5">
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
                <ListChecks className="h-5 w-5" />
                {activeTaskCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-ink-950">
                    {activeTaskCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-tight">My Tasks</span>
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
                <Bell className="h-5 w-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-ink-950 animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-tight">Alerts</span>
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
              <Activity className="h-5 w-5" />
              <span className="text-[10px] leading-tight">Performance</span>
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
              <User className="h-5 w-5" />
              <span className="text-[10px] leading-tight">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
