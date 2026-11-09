'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  House,
  ListChecks,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sun,
  User,
  Volume2,
  VolumeX,
  X,
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
import { BreakRequestModal } from './BreakRequestModal';
import { useBreakRequest } from './breakRequests';

type FulfillerTab = 'tasks' | 'notifications' | 'policies' | 'performance' | 'profile';

function FulfillerAppContent() {
  const {
    state,
    setPersona,
    setSoundEnabled,
    setTheme,
    setActiveDispatcherDept,
    toasts,
    setFulfillerAvailability,
    notify,
    markNotificationRead,
  } = useDemo();
  const [activeTab, setActiveTab] = useState<FulfillerTab>('tasks');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const { breakRequest } = useBreakRequest();
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
  const safetyAlerts = state.safetyAlerts ?? [];
  const unacknowledgedSafetyAlerts = safetyAlerts.filter(
    (a) =>
      a.status === 'broadcast_active' &&
      !(a.acknowledgedBy ?? []).includes(profile.employeeName) &&
      !(a.acknowledgedBy ?? []).includes(profile.employeeId) &&
      !(a.acknowledgedBy ?? []).includes('task_fulfiller'),
  );
  const unreadNotifCount =
    notifications.filter((n) => !n.read).length + unacknowledgedSafetyAlerts.length;

  const isLight = state.theme === 'light';

  return (
    <div
      className={cn(
        'fulfiller-root fixed inset-0 flex flex-col overflow-hidden transition-colors duration-300',
        isLight
          ? 'fulfiller-light bg-[#fbfaf7] text-[#353229]'
          : 'fulfiller-dark bg-gradient-to-b from-[#0c0c0e] via-[#121215] to-[#09090b]',
      )}
    >
      {/* Scoped Theme Styles for Task Fulfiller: Matching Department Manager warm luxury palette in Light Mode */}
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
          --warm-canvas: #fbfaf7;
          --warm-panel: #ffffff;
          --warm-sidebar: #fbfaf7;
          --warm-soft: #f6f3ec;
          --warm-highlight: #ebe2cc;
          --warm-selected: #ded6c1;
          --warm-line: #e7e2d7;
          --warm-control: #b7b09e;
          --warm-ink: #353229;
          --warm-muted: #686252;
          --warm-primary: #353229;
          --warm-on-primary: #ffffff;
          --warm-focus: #8b7550;
          --warm-shadow: 0 4px 18px rgba(53, 50, 41, 0.04);

          --page: 251 250 247;
          --ink-950: 255 255 255;
          --ink-900: 255 255 255;
          --ink-850: 251 250 247;
          --ink-800: 246 243 236;
          --ink-700: 235 226 204;
          --ink-600: 222 214 193;
          --white: 53 50 41;
          --mist-100: 53 50 41;
          --mist-200: 65 60 50;
          --mist-300: 104 98 82;
          --mist-400: 140 132 114;
          --mist-500: 183 176 158;
          --a: 53 50 41;
          --b: 183 176 158;
          --on-a: #ffffff;
          --t-emerald: 53 50 41;
          --t-amber: 139 117 80;
          --t-sky: 104 98 82;
          --t-rose: 153 27 27;
          --t-violet: 104 98 82;
          color: #353229;
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

        /* Department Manager Light Theme Overrides */
        .fulfiller-light #fulfiller-phone-shell {
          background-color: #fbfaf7 !important;
          border-color: #e7e2d7 !important;
          color: #353229 !important;
        }
        .fulfiller-light header {
          background-color: rgba(255, 255, 255, 0.98) !important;
          border-color: #e7e2d7 !important;
          box-shadow: 0 1px 3px rgba(53, 50, 41, 0.03) !important;
        }
        .fulfiller-light nav {
          background-color: rgba(255, 255, 255, 0.98) !important;
          border-color: #e7e2d7 !important;
          box-shadow: 0 -4px 18px rgba(53, 50, 41, 0.04) !important;
        }
        .fulfiller-light .border-white\/10,
        .fulfiller-light .border-white\/20,
        .fulfiller-light .border-white\/\[0\.08\],
        .fulfiller-light .border-white\/\[0\.06\],
        .fulfiller-light .border-white\/\[0\.04\],
        .fulfiller-light .border-white\/\[0\.03\],
        .fulfiller-light .border-white\/\[0\.02\],
        .fulfiller-light .border-slate-300\/70,
        .fulfiller-light .border-slate-300\/80,
        .fulfiller-light .border-slate-200,
        .fulfiller-light .border-emerald-500\/40,
        .fulfiller-light .border-emerald-500\/30,
        .fulfiller-light .border-emerald-400\/40,
        .fulfiller-light .border-amber-400\/40,
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.18\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.2\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.24\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.25\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.28\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.3\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.35\)\],
        .fulfiller-light .border-\[rgba\(165\,130\,95\,0\.4\)\] {
          border-color: #e7e2d7 !important;
        }
        .fulfiller-light .bg-white\/\[0\.03\],
        .fulfiller-light .bg-white\/\[0\.04\],
        .fulfiller-light .bg-white\/\[0\.02\],
        .fulfiller-light .bg-white\/\[0\.06\],
        .fulfiller-light .bg-emerald-500\/\[0\.03\],
        .fulfiller-light .bg-emerald-500\/\[0\.06\],
        .fulfiller-light .bg-amber-400\/\[0\.03\],
        .fulfiller-light .bg-amber-400\/\[0\.04\],
        .fulfiller-light .bg-\[\#1a1918\],
        .fulfiller-light .bg-\[\#14120e\],
        .fulfiller-light .bg-\[\#161513\],
        .fulfiller-light .bg-\[\#1c1c20\],
        .fulfiller-light .bg-\[\#1e1c1a\],
        .fulfiller-light .bg-\[\#141417\],
        .fulfiller-light .bg-\[\#18181c\],
        .fulfiller-light .bg-ink-950,
        .fulfiller-light .bg-ink-900 {
          background-color: #ffffff !important;
          color: #353229 !important;
          border-color: #e7e2d7 !important;
          box-shadow: 0 4px 18px rgba(53, 50, 41, 0.04), 0 1px 3px rgba(53, 50, 41, 0.02);
        }

        /* High-Contrast Department Manager Text Colors */
        .fulfiller-light :not(button):not([class*="bg-[#353229]"]):not(.btn-dark).text-white,
        .fulfiller-light :not(button):not([class*="bg-[#353229]"]):not(.btn-dark).text-\[\#f7f4ed\],
        .fulfiller-light :not(button):not([class*="bg-[#353229]"]):not(.btn-dark).text-mist-100 {
          color: #353229 !important;
        }
        .fulfiller-light .text-\[\#ded6c9\],
        .fulfiller-light .text-\[\#d9cebe\],
        .fulfiller-light .text-mist-200,
        .fulfiller-light .text-mist-300 {
          color: #686252 !important;
        }
        .fulfiller-light .text-\[\#d4b896\],
        .fulfiller-light .text-\[\#a89f91\],
        .fulfiller-light .text-\[\#a69886\],
        .fulfiller-light .text-mist-400,
        .fulfiller-light .text-mist-500 {
          color: #8c8472 !important;
        }
        .fulfiller-light .text-\[\#dfc187\],
        .fulfiller-light .text-\[\#c8a96e\] {
          color: #8b7550 !important;
        }
        .fulfiller-light .text-emerald-600,
        .fulfiller-light .text-emerald-400,
        .fulfiller-light .text-emerald-300 {
          color: #353229 !important;
        }
        .fulfiller-light .text-amber-600,
        .fulfiller-light .text-amber-500,
        .fulfiller-light .text-amber-400,
        .fulfiller-light .text-amber-300 {
          color: #8b7550 !important;
        }
        .fulfiller-light .text-sky-600,
        .fulfiller-light .text-sky-400,
        .fulfiller-light .text-sky-300 {
          color: #4a5568 !important;
        }
        .fulfiller-light .text-rose-200,
        .fulfiller-light .text-rose-200\/90,
        .fulfiller-light .text-rose-300,
        .fulfiller-light .text-rose-400 {
          color: #991b1b !important;
        }

        /* Dark Luxury Primary Action Buttons in Light Mode: Guaranteed white text */
        .fulfiller-light button.bg-\[\#353229\],
        .fulfiller-light button.bg-\[\#353229\] *,
        .fulfiller-light button[class*="bg-[#353229]"],
        .fulfiller-light button[class*="bg-[#353229]"] *,
        .fulfiller-light [class*="bg-[#353229]"] button,
        .fulfiller-light [class*="bg-[#353229]"] button * {
          color: #ffffff !important;
        }
        .fulfiller-light button.bg-\[\#353229\]:hover,
        .fulfiller-light button[class*="bg-[#353229]"]:hover {
          background-color: #484438 !important;
          color: #ffffff !important;
        }

        /* Department Manager Style Action Buttons */
        .fulfiller-light .bg-emerald-500,
        .fulfiller-light .bg-emerald-600,
        .fulfiller-light .bg-amber-400,
        .fulfiller-light .bg-sky-500 {
          background-color: #353229 !important;
          color: #ffffff !important;
          border: 1px solid #353229 !important;
          font-weight: 600 !important;
        }
        .fulfiller-light button.bg-emerald-500:hover,
        .fulfiller-light button.bg-amber-400:hover,
        .fulfiller-light button.bg-sky-500:hover {
          background-color: #484438 !important;
          border-color: #484438 !important;
          color: #ffffff !important;
        }
        .fulfiller-light .bg-emerald-500\/20,
        .fulfiller-light .bg-emerald-400\/20,
        .fulfiller-light .bg-amber-400\/20,
        .fulfiller-light .bg-sky-400\/20,
        .fulfiller-light .bg-purple-400\/20 {
          background-color: #f6f3ec !important;
          color: #353229 !important;
          border-color: #e7e2d7 !important;
        }

        /* Department Manager Inputs, Selects & Modals */
        .fulfiller-light textarea,
        .fulfiller-light input[type="text"],
        .fulfiller-light input[type="search"],
        .fulfiller-light select {
          background-color: #ffffff !important;
          color: #353229 !important;
          border-color: #b7b09e !important;
          border-radius: 7px !important;
        }
        .fulfiller-light textarea:focus,
        .fulfiller-light input[type="text"]:focus,
        .fulfiller-light input[type="search"]:focus,
        .fulfiller-light select:focus {
          border-color: #8b7550 !important;
          outline: 2px solid #8b7550 !important;
          outline-offset: 1px !important;
        }
        .fulfiller-light textarea::placeholder,
        .fulfiller-light input::placeholder {
          color: #8c8472 !important;
        }
      `}</style>

      {/* Full-Screen Fluid Responsive Container */}
      <div
        id="fulfiller-phone-shell"
        className={cn(
          'relative flex flex-col w-full h-full overflow-hidden transition-colors duration-300',
          isLight
            ? 'bg-[#fbfaf7] text-[#353229]'
            : 'bg-[#141417] text-[#f7f4ed]',
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
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] shadow-[0_12px_40px_rgba(53,50,41,0.12)]'
                    : 'border-[rgba(165,130,95,0.4)] bg-[#1c1c20]/95 text-[#f7f4ed]',
                )}
              >
                <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', isLight ? 'text-[#353229]' : 'text-[#c8a96e]')} />
                <div className="min-w-0 flex-1">
                  <p className={cn('font-bold leading-snug', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>{t.text}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold',
                      isLight ? 'text-[#686252]' : 'text-[#a69886]',
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
              ? 'border-[#e7e2d7] bg-[#ffffff]/98 backdrop-blur-xl text-[#353229] shadow-xs'
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
                      isLight ? 'text-[#353229]' : 'text-[#f7f4ed]',
                    )}
                  >
                    {profile.employeeName}
                  </h1>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBreakModalOpen(true);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer',
                      breakRequest?.status === 'pending'
                        ? isLight
                          ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                          : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                        : currentAvail === 'break'
                          ? isLight
                            ? 'bg-[#ebe2cc] text-[#353229] border-[#b7b09e]'
                            : 'bg-[#dfc187]/20 text-[#e8cf9a] border-[#dfc187]/40'
                          : currentAvail === 'off_duty'
                            ? isLight
                              ? 'bg-[#f6f3ec] text-[#686252] border-[#e7e2d7] hover:border-[#b7b09e]'
                              : 'bg-white/[0.06] text-[#ded6c9] border-white/10 hover:border-white/20'
                            : isLight
                              ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7] hover:border-[#b7b09e]'
                              : 'bg-[#c8a96e]/20 text-[#dfc187] border-[#c8a96e]/40 hover:border-[#dfc187]',
                    )}
                    title={
                      breakRequest?.status === 'pending'
                        ? `${breakRequest.title || 'Duty request'} pending approval from Supervisor ${profile.supervisorName} (Click to view)`
                        : currentAvail === 'break'
                          ? 'Currently On Break (Click to manage duty status)'
                          : currentAvail === 'off_duty'
                            ? 'Currently Off Duty (Click to request On Duty from Supervisor)'
                            : `On Duty · Managed by Supervisor ${profile.supervisorName} (Click to request Break / Off Duty)`
                    }
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        breakRequest?.status === 'pending'
                          ? 'bg-amber-500 animate-pulse'
                          : currentAvail === 'break'
                            ? isLight ? 'bg-[#8b7550] animate-pulse' : 'bg-[#dfc187] animate-pulse'
                            : currentAvail === 'off_duty'
                              ? isLight ? 'bg-[#8c8472]' : 'bg-[#a69886]'
                              : isLight ? 'bg-[#353229]' : 'bg-[#c8a96e]',
                      )}
                    />
                    <span>
                      {breakRequest?.status === 'pending'
                        ? breakRequest.requestType === 'on_duty'
                          ? 'On Duty Requested'
                          : breakRequest.requestType === 'off_duty'
                            ? 'Off Duty Requested'
                            : breakRequest.requestType === 'break'
                              ? 'Break Requested'
                              : 'Duty Req Pending'
                        : currentAvail === 'break'
                          ? 'On Break'
                          : currentAvail === 'off_duty'
                            ? 'Off Duty'
                            : 'On Duty'}
                    </span>
                    <span className={cn('text-[8px] font-normal opacity-75 hidden sm:inline', isLight ? 'text-[#686252]' : 'text-mist-400')}>
                      {breakRequest?.status === 'pending' ? '(Pending)' : '(Duty Request)'}
                    </span>
                  </button>
                </div>
                <p
                  className={cn(
                    'text-[10px] sm:text-xs truncate font-medium mt-0.5',
                    isLight ? 'text-[#686252]' : 'text-[#d9cebe]',
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
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
                    : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#d9cebe] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                )}
                title={isSoundOn ? 'Mute task chime' : 'Enable task chime'}
                aria-label="Toggle task chime"
              >
                {isSoundOn ? (
                  <Volume2 className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                ) : (
                  <VolumeX className={cn('h-3.5 w-3.5', isLight ? 'text-[#8c8472]' : 'text-[#a69886]')} />
                )}
              </button>

              {/* Theme Change Toggle */}
              <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
                    : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#dfc187] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                )}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle theme"
              >
                {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-[#dfc187]" />}
              </button>

              {/* Notification Symbol Button with Recent Messages Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen((prev) => !prev)}
                  className={cn(
                    'relative grid h-8 w-8 place-items-center rounded-lg border transition-colors cursor-pointer',
                    notifDropdownOpen || activeTab === 'notifications'
                      ? isLight
                        ? 'border-[#b7b09e] bg-[#ebe2cc] text-[#353229] ring-2 ring-[#ded6c1]'
                        : 'border-[#dfc187] bg-[#c8a96e]/20 text-[#dfc187] ring-2 ring-[#dfc187]/25'
                      : isLight
                        ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
                        : 'border-[rgba(165,130,95,0.24)] bg-[#1f1f24] text-[#d9cebe] hover:text-[#f7f4ed] hover:border-[rgba(195,160,115,0.4)]',
                  )}
                  title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notifications` : 'Notifications & Alerts'}
                  aria-label="View notifications"
                >
                  <Bell className="h-3.5 w-3.5" />
                  {unreadNotifCount > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-extrabold shadow-sm animate-pulse',
                        isLight ? 'bg-[#353229] text-[#ffffff]' : 'bg-[#c8a96e] text-[#141417]',
                      )}
                    >
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Recent Notifications Dropdown Popover */}
                {notifDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
                      onClick={() => setNotifDropdownOpen(false)}
                    />
                    <div
                      className={cn(
                        'absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-2xl border p-3 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-150',
                        isLight
                          ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] shadow-[0_12px_36px_rgba(53,50,41,0.16)]'
                          : 'border-[rgba(165,130,95,0.35)] bg-[#1a1918] text-[#f7f4ed] shadow-2xl',
                      )}
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between border-b pb-2 mb-2 border-inherit">
                        <div className="flex items-center gap-1.5">
                          <Bell className={cn('h-3.5 w-3.5', isLight ? 'text-[#8b7550]' : 'text-[#dfc187]')} />
                          <span className="text-xs font-bold">Recent Messages</span>
                          {unreadNotifCount > 0 && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold',
                                isLight ? 'bg-[#353229] text-white' : 'bg-[#dfc187] text-[#14120e]',
                              )}
                            >
                              {unreadNotifCount} new
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifDropdownOpen(false)}
                          className={cn(
                            'grid h-6 w-6 place-items-center rounded-md text-xs cursor-pointer',
                            isLight ? 'hover:bg-[#f6f3ec] text-[#8c8472]' : 'hover:bg-white/10 text-[#a89f91]',
                          )}
                          title="Close"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Dropdown List */}
                      <div className="max-h-72 overflow-y-auto space-y-1.5 no-scrollbar">
                        {unacknowledgedSafetyAlerts.length > 0 && (
                          <div
                            onClick={() => {
                              setNotifDropdownOpen(false);
                              setActiveTab('notifications');
                            }}
                            className={cn(
                              'flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors',
                              isLight
                                ? 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
                                : 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
                            )}
                          >
                            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 mt-0.5 animate-pulse" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] truncate">Security Alert Broadcast</span>
                                <span className="text-[9px] font-mono uppercase bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold">Live</span>
                              </div>
                              <p className="text-[11px] line-clamp-1 mt-0.5">
                                {unacknowledgedSafetyAlerts[0].description}
                              </p>
                            </div>
                          </div>
                        )}

                        {notifications.length === 0 && unacknowledgedSafetyAlerts.length === 0 ? (
                          <div className="py-7 text-center">
                            <Bell className="h-6 w-6 mx-auto opacity-30 mb-1" />
                            <p className={cn('text-xs font-medium', isLight ? 'text-[#8c8472]' : 'text-[#a89f91]')}>
                              No recent messages
                            </p>
                          </div>
                        ) : (
                          notifications.slice(0, 4).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (!notif.read) markNotificationRead(notif.id);
                                setNotifDropdownOpen(false);
                                if (notif.itemId) {
                                  setActiveTab('tasks');
                                } else {
                                  setActiveTab('notifications');
                                }
                              }}
                              className={cn(
                                'flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors text-left',
                                isLight
                                  ? notif.read
                                    ? 'border-[#e7e2d7] bg-[#fbfaf7] text-[#686252] hover:bg-[#f6f3ec]'
                                    : 'border-[#b7b09e] bg-[#ffffff] text-[#353229] font-medium hover:bg-[#f6f3ec]'
                                  : notif.read
                                    ? 'border-white/5 bg-white/[0.02] text-[#ded6c9] hover:bg-white/[0.05]'
                                    : 'border-[rgba(200,169,110,0.3)] bg-[rgba(200,169,110,0.08)] text-[#f7f4ed] font-medium hover:bg-[rgba(200,169,110,0.12)]',
                              )}
                            >
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full shrink-0 mt-1',
                                  notif.read
                                    ? 'bg-transparent'
                                    : isLight
                                      ? 'bg-[#353229]'
                                      : 'bg-[#dfc187]',
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold truncate">{notif.title}</span>
                                  <span className="text-[9px] font-mono opacity-70 shrink-0">{notif.timestamp}</span>
                                </div>
                                <p className="text-[11px] line-clamp-1 opacity-80 mt-0.5">{notif.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Dropdown Footer: See All Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          setActiveTab('notifications');
                        }}
                        className={cn(
                          'w-full mt-2.5 pt-2 border-t flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-inherit shadow-2xs',
                          isLight
                            ? 'bg-[#f6f3ec] hover:bg-[#ebe2cc] text-[#353229]'
                            : 'bg-white/[0.05] hover:bg-white/[0.1] text-[#dfc187]',
                        )}
                      >
                        <span>See All Notifications & Alerts</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Exit to Portals / Public */}
              <Link
                href="/login"
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-6 sm:pb-8 no-scrollbar overscroll-contain">
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
            'relative shrink-0 z-40 border-t pb-safe transition-colors duration-300 backdrop-blur-2xl',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff]/98 text-[#686252] shadow-[0_-4px_18px_rgba(53,50,41,0.04)]'
              : 'border-[rgba(165,130,95,0.24)] bg-[#18181c]/95 text-[#d9cebe]',
          )}
        >
          <div className="grid grid-cols-4 items-center px-2 py-1.5 max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
            {/* My Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'tasks'
                  ? isLight
                    ? 'text-[#353229] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <span className="relative">
                <ListChecks className="h-4 w-4" />
                {activeTaskCount > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold',
                      isLight ? 'bg-[#353229] text-[#ffffff]' : 'bg-[#c8a96e] text-[#14120e]',
                    )}
                  >
                    {activeTaskCount}
                  </span>
                )}
              </span>
              <span className="text-[9px] leading-tight">Tasks</span>
            </button>

            {/* Policies */}
            <button
              type="button"
              onClick={() => setActiveTab('policies')}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1 text-center transition-colors',
                activeTab === 'policies'
                  ? isLight
                    ? 'text-[#353229] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
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
                    ? 'text-[#353229] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
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
                    ? 'text-[#353229] font-bold'
                    : 'text-[#dfc187] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
                    : 'text-[#a69886] hover:text-[#f7f4ed]',
              )}
            >
              <User className="h-4 w-4" />
              <span className="text-[9px] leading-tight">Profile</span>
            </button>
          </div>
        </nav>

        {/* Break Request & Supervisor Shift Management Modal */}
        <BreakRequestModal
          isOpen={breakModalOpen}
          onClose={() => setBreakModalOpen(false)}
          profile={profile}
          isLight={isLight}
          currentAvail={currentAvail}
          onSetAvailability={setFulfillerAvailability}
          onNotify={notify}
        />
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
