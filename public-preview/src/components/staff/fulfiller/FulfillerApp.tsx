'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  House,
  ListChecks,
  Maximize2,
  Moon,
  Search,
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
import { INDIAN_LANGUAGES, getTranslation } from './fulfillerLanguages';
import '@/components/shared/warm-theme.css';

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
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fulfiller_language') || 'EN';
    }
    return 'EN';
  });
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [isLangFullPage, setIsLangFullPage] = useState(false);

  const t = getTranslation(selectedLang);

  const handleSelectLanguage = (code: string) => {
    setSelectedLang(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fulfiller_language', code);
    }
    setLangDropdownOpen(false);
    setIsLangFullPage(false);
  };

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.englishSub.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase()),
  );

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
        'fulfiller-root warm-theme fixed inset-0 flex flex-col overflow-hidden transition-colors duration-300',
        isLight
          ? 'fulfiller-light bg-[#fbfaf7] text-[#353229]'
          : 'fulfiller-dark bg-[#171715] text-[#eee8dc]',
      )}
      data-theme={isLight ? 'light' : 'dark'}
    >
      {/* Scoped Theme Styles for Task Fulfiller: Department Manager warm luxury palette in Light & Dark Mode */}
      <style>{`
        .fulfiller-root {
          font-family: Arial, Helvetica, sans-serif;
        }

        .fulfiller-root.fulfiller-dark {
          --dm-paper: var(--warm-panel);
          --dm-surface: var(--warm-highlight);
          --dm-line: var(--warm-line);
          --dm-accent: var(--warm-control);
          --dm-ink: var(--warm-ink);
          --dm-muted: var(--warm-muted);
          --warm-canvas: #171715;
          --warm-panel: #1e1e1b;
          --warm-sidebar: #1b1b18;
          --warm-soft: #282720;
          --warm-highlight: #343127;
          --warm-selected: #403b2f;
          --warm-line: #3d3a32;
          --warm-control: #867e6c;
          --warm-ink: #eee8dc;
          --warm-muted: #b7b0a1;
          --warm-primary: #ded6c1;
          --warm-on-primary: #28261f;
          --warm-focus: #d4c5a4;
          --warm-shadow: 0 4px 18px rgba(0, 0, 0, 0.14);

          --page: 23 23 21; /* #171715 */
          --ink-950: 30 30 27; /* #1e1e1b */
          --ink-900: 30 30 27;
          --ink-850: 27 27 24; /* #1b1b18 */
          --ink-800: 40 39 32; /* #282720 */
          --ink-700: 52 49 39; /* #343127 */
          --ink-600: 64 59 47; /* #403b2f */
          --white: 238 232 220; /* #eee8dc cream linen */
          --mist-100: 238 232 220;
          --mist-200: 212 197 164;
          --mist-300: 183 176 161; /* #b7b0a1 muted taupe */
          --mist-400: 134 126 108; /* #867e6c control border */
          --mist-500: 90 85 74;
          --a: 222 214 193; /* #ded6c1 champagne sand */
          --b: 134 126 108; /* #867e6c */
          --on-a: #28261f;
          --t-emerald: 222 214 193;
          --t-amber: 212 197 164;
          --t-sky: 183 176 161;
          --t-rose: 225 29 72;
          --t-violet: 183 176 161;
          color: #eee8dc;
        }

        .fulfiller-root.fulfiller-light {
          --dm-paper: var(--warm-panel);
          --dm-surface: var(--warm-highlight);
          --dm-line: var(--warm-line);
          --dm-accent: var(--warm-control);
          --dm-ink: var(--warm-ink);
          --dm-muted: var(--warm-muted);
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

        /* Department Manager Dark Theme Overrides */
        .fulfiller-dark #fulfiller-phone-shell {
          background-color: #171715 !important;
          border-color: #3d3a32 !important;
          color: #eee8dc !important;
        }
        .fulfiller-dark header {
          background-color: rgba(27, 27, 24, 0.98) !important;
          border-color: #3d3a32 !important;
        }
        .fulfiller-dark nav {
          background-color: rgba(27, 27, 24, 0.98) !important;
          border-color: #3d3a32 !important;
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
          border-color: #3d3a32 !important;
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
          background-color: #1e1e1b !important;
          color: #eee8dc !important;
          border-color: #3d3a32 !important;
        }
        .fulfiller-dark .text-white {
          color: #eee8dc !important;
        }
        .fulfiller-dark .text-mist-200,
        .fulfiller-dark .text-mist-300 {
          color: #b7b0a1 !important;
        }
        .fulfiller-dark .text-mist-400,
        .fulfiller-dark .text-mist-500 {
          color: #867e6c !important;
        }
        .fulfiller-dark .text-emerald-400,
        .fulfiller-dark .text-emerald-300,
        .fulfiller-dark .text-amber-400,
        .fulfiller-dark .text-amber-300,
        .fulfiller-dark .text-amber-200,
        .fulfiller-dark .text-sky-400 {
          color: #ded6c1 !important;
        }
        .fulfiller-dark .bg-emerald-500,
        .fulfiller-dark .bg-emerald-600,
        .fulfiller-dark .bg-amber-400,
        .fulfiller-dark .bg-sky-500 {
          background-color: #ded6c1 !important;
          color: #28261f !important;
          border-color: #ded6c1 !important;
        }
        .fulfiller-dark button.bg-emerald-500:hover,
        .fulfiller-dark button.bg-amber-400:hover,
        .fulfiller-dark button.bg-sky-500:hover {
          background-color: #e5dfcb !important;
          color: #28261f !important;
        }
        .fulfiller-dark .bg-emerald-500\/20,
        .fulfiller-dark .bg-emerald-400\/20,
        .fulfiller-dark .bg-amber-400\/20,
        .fulfiller-dark .bg-amber-500\/20,
        .fulfiller-dark .bg-sky-400\/20,
        .fulfiller-dark .bg-purple-400\/20 {
          background-color: #282720 !important;
          color: #eee8dc !important;
          border-color: #3d3a32 !important;
        }
        .fulfiller-dark textarea,
        .fulfiller-dark input[type="text"],
        .fulfiller-dark input[type="search"],
        .fulfiller-dark select {
          background-color: #1e1e1b !important;
          color: #eee8dc !important;
          border-color: #867e6c !important;
          border-radius: 7px !important;
        }
        .fulfiller-dark textarea:focus,
        .fulfiller-dark input[type="text"]:focus,
        .fulfiller-dark input[type="search"]:focus,
        .fulfiller-dark select:focus {
          border-color: #d4c5a4 !important;
          outline: 2px solid #d4c5a4 !important;
          outline-offset: 1px !important;
        }
        .fulfiller-dark textarea::placeholder,
        .fulfiller-dark input::placeholder {
          color: #b7b0a1 !important;
          opacity: 0.85;
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
            : 'bg-[#171715] text-[#eee8dc]',
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
                    : 'border-[#3d3a32] bg-[#1e1e1b]/95 text-[#eee8dc] shadow-[0_12px_40px_rgba(0,0,0,0.4)]',
                )}
              >
                <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
                <div className="min-w-0 flex-1">
                  <p className={cn('font-bold leading-snug', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>{t.text}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold',
                      isLight ? 'text-[#686252]' : 'text-[#b7b0a1]',
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
              : 'border-[#3d3a32] bg-[#1b1b18]/95 text-[#eee8dc] backdrop-blur-xl',
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
                      isLight ? 'text-[#353229]' : 'text-[#eee8dc]',
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
                          : 'bg-[#343127] text-[#ded6c1] border-[#867e6c]'
                        : currentAvail === 'break'
                          ? isLight
                            ? 'bg-[#ebe2cc] text-[#353229] border-[#b7b09e]'
                            : 'bg-[#343127] text-[#ded6c1] border-[#867e6c]'
                          : currentAvail === 'off_duty'
                            ? isLight
                              ? 'bg-[#f6f3ec] text-[#686252] border-[#e7e2d7] hover:border-[#b7b09e]'
                              : 'bg-[#282720] text-[#b7b0a1] border-[#3d3a32] hover:border-[#867e6c]'
                            : isLight
                              ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7] hover:border-[#b7b09e]'
                              : 'bg-[#282720] text-[#eee8dc] border-[#3d3a32] hover:border-[#867e6c]',
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
                            ? isLight ? 'bg-[#8b7550] animate-pulse' : 'bg-[#ded6c1] animate-pulse'
                            : currentAvail === 'off_duty'
                              ? isLight ? 'bg-[#8c8472]' : 'bg-[#867e6c]'
                              : isLight ? 'bg-[#353229]' : 'bg-[#ded6c1]',
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
                    {breakRequest?.status === 'pending' && (
                      <span className={cn('text-[8px] font-normal opacity-75 hidden sm:inline', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                        (Pending)
                      </span>
                    )}
                  </button>
                </div>
                <p
                  className={cn(
                    'text-[10px] sm:text-xs truncate font-medium mt-0.5',
                    isLight ? 'text-[#686252]' : 'text-[#b7b0a1]',
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
                    : 'border-[#3d3a32] bg-[#1e1e1b] text-[#eee8dc] hover:bg-[#282720] hover:border-[#867e6c]',
                )}
                title={isSoundOn ? 'Mute task chime' : 'Enable task chime'}
                aria-label="Toggle task chime"
              >
                {isSoundOn ? (
                  <Volume2 className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
                ) : (
                  <VolumeX className={cn('h-3.5 w-3.5', isLight ? 'text-[#8c8472]' : 'text-[#867e6c]')} />
                )}
              </button>

              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setLangDropdownOpen((prev) => !prev);
                    setNotifDropdownOpen(false);
                  }}
                  className={cn(
                    'h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer',
                    langDropdownOpen
                      ? isLight
                        ? 'border-[#b7b09e] bg-[#ebe2cc] text-[#353229] ring-2 ring-[#ded6c1]'
                        : 'border-[#ded6c1] bg-[#343127] text-[#ded6c1] ring-2 ring-[#403b2f]'
                      : isLight
                        ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
                        : 'border-[#3d3a32] bg-[#1e1e1b] text-[#eee8dc] hover:bg-[#282720] hover:border-[#867e6c]',
                  )}
                  title="Select Indian Language"
                  aria-label="Select Indian Language"
                >
                  <Globe className={cn('h-3.5 w-3.5 shrink-0', isLight ? 'text-[#8b7550]' : 'text-[#ded6c1]')} />
                  <span className="font-mono text-[11px] font-bold">{selectedLang}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {/* Dropdown Popover */}
                {langDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setLangDropdownOpen(false)}
                    />
                    <div
                      className={cn(
                        'absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl z-50 p-3 transition-all',
                        isLight
                          ? 'bg-[#ffffff] border-[#e7e2d7] text-[#353229] shadow-[0_12px_32px_rgba(53,50,41,0.12)]'
                          : 'bg-[#1e1e1b] border-[#3d3a32] text-[#eee8dc] shadow-[0_12px_32px_rgba(0,0,0,0.5)]',
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-inherit">
                        <div>
                          <h3 className={cn('text-xs sm:text-sm font-bold tracking-tight', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                            {t.indianLanguages}
                          </h3>
                          <p className={cn('text-[10px] font-medium', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                            {t.officialSubtitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLangFullPage(true);
                            setLangDropdownOpen(false);
                          }}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer',
                            isLight
                              ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7] hover:bg-[#ebe2cc]'
                              : 'bg-[#282720] text-[#ded6c1] border-[#3d3a32] hover:bg-[#343127]',
                          )}
                          title="Expand to Full Page"
                        >
                          <Maximize2 className="h-3 w-3" />
                          <span>{t.fullPage}</span>
                        </button>
                      </div>

                      {/* Search */}
                      <div className="relative mb-2">
                        <Search className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')} />
                        <input
                          type="text"
                          value={langSearch}
                          onChange={(e) => setLangSearch(e.target.value)}
                          placeholder={t.searchLanguage}
                          className={cn(
                            'w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-colors',
                            isLight
                              ? 'bg-[#f6f3ec] border-[#e7e2d7] text-[#353229] placeholder-[#8c8472] focus:border-[#b7b09e]'
                              : 'bg-[#141412] border-[#3d3a32] text-[#eee8dc] placeholder-[#867e6c] focus:border-[#867e6c]',
                          )}
                        />
                      </div>

                      {/* Scrollable Language List */}
                      <div className="max-h-72 overflow-y-auto space-y-1 no-scrollbar pr-0.5">
                        {filteredLanguages.map((lang) => {
                          const isSelected = selectedLang === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => handleSelectLanguage(lang.code)}
                              className={cn(
                                'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer border',
                                isSelected
                                  ? isLight
                                    ? 'bg-[#ebe2cc] border-[#ded6c1] text-[#353229] font-bold'
                                    : 'bg-[#282720] border-[#867e6c] text-[#eee8dc] font-bold'
                                  : isLight
                                    ? 'border-transparent hover:bg-[#f6f3ec] text-[#353229]'
                                    : 'border-transparent hover:bg-[#282720]/60 text-[#eee8dc]',
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0',
                                    isLight
                                      ? 'bg-[#f6f3ec] border-[#e7e2d7] text-[#686252]'
                                      : 'bg-[#171715] border-[#3d3a32] text-[#b7b0a1]',
                                  )}
                                >
                                  {lang.badge}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs leading-tight font-medium truncate">
                                    {lang.nativeName}
                                  </p>
                                  <p className={cn('text-[10px] leading-tight truncate', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                                    {lang.name} {lang.name !== lang.englishSub ? `(${lang.englishSub})` : ''}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className={cn('h-4 w-4 shrink-0', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
                              )}
                            </button>
                          );
                        })}
                        {filteredLanguages.length === 0 && (
                          <p className={cn('py-4 text-center text-xs', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')}>
                            No matching Indian language found
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-2 pt-2 border-t border-inherit text-center">
                        <p className={cn('text-[10px] font-medium tracking-tight', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                          {t.officialTagline}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Theme Change Toggle */}
              <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
                    : 'border-[#3d3a32] bg-[#1e1e1b] text-[#ded6c1] hover:bg-[#282720] hover:border-[#867e6c]',
                )}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle theme"
              >
                {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-[#ded6c1]" />}
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
                        : 'border-[#ded6c1] bg-[#343127] text-[#ded6c1] ring-2 ring-[#403b2f]'
                      : isLight
                        ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec] hover:border-[#b7b09e]'
                        : 'border-[#3d3a32] bg-[#1e1e1b] text-[#eee8dc] hover:bg-[#282720] hover:border-[#867e6c]',
                  )}
                  title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notifications` : 'Notifications & Alerts'}
                  aria-label="View notifications"
                >
                  <Bell className="h-3.5 w-3.5" />
                  {unreadNotifCount > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-extrabold shadow-sm animate-pulse',
                        isLight ? 'bg-[#353229] text-[#ffffff]' : 'bg-[#ded6c1] text-[#28261f]',
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
                          : 'border-[#3d3a32] bg-[#1e1e1b] text-[#eee8dc] shadow-[0_12px_36px_rgba(0,0,0,0.5)]',
                      )}
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between border-b pb-2 mb-2 border-inherit">
                        <div className="flex items-center gap-1.5">
                          <Bell className={cn('h-3.5 w-3.5', isLight ? 'text-[#8b7550]' : 'text-[#ded6c1]')} />
                          <span className="text-xs font-bold">Recent Messages</span>
                          {unreadNotifCount > 0 && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold',
                                isLight ? 'bg-[#353229] text-white' : 'bg-[#ded6c1] text-[#28261f]',
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
                            isLight ? 'hover:bg-[#f6f3ec] text-[#8c8472]' : 'hover:bg-[#282720] text-[#b7b0a1]',
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
                            <p className={cn('text-xs font-medium', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')}>
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
                                    ? 'border-[#3d3a32]/40 bg-transparent text-[#b7b0a1] hover:bg-[#282720]'
                                    : 'border-[#867e6c] bg-[#282720] text-[#eee8dc] font-medium hover:bg-[#343127]',
                              )}
                            >
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full shrink-0 mt-1',
                                  notif.read
                                    ? 'bg-transparent'
                                    : isLight
                                      ? 'bg-[#353229]'
                                      : 'bg-[#ded6c1]',
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
                            : 'bg-[#282720] hover:bg-[#343127] text-[#ded6c1]',
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
                    : 'border-[#3d3a32] bg-[#1e1e1b] text-[#eee8dc] hover:bg-[#282720] hover:border-[#867e6c]',
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
          {activeTab === 'tasks' && <FulfillerTasksTab profile={profile} currentLang={selectedLang} />}
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
              : 'border-[#3d3a32] bg-[#1b1b18]/95 text-[#b7b0a1]',
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
                    : 'text-[#ded6c1] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
                    : 'text-[#b7b0a1] hover:text-[#eee8dc]',
              )}
            >
              <span className="relative">
                <ListChecks className="h-4 w-4" />
                {activeTaskCount > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold',
                      isLight ? 'bg-[#353229] text-[#ffffff]' : 'bg-[#ded6c1] text-[#28261f]',
                    )}
                  >
                    {activeTaskCount}
                  </span>
                )}
              </span>
              <span className="text-[9px] leading-tight">{t.tasksTab}</span>
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
                    : 'text-[#ded6c1] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
                    : 'text-[#b7b0a1] hover:text-[#eee8dc]',
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[9px] leading-tight">{t.policiesTab}</span>
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
                    : 'text-[#ded6c1] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
                    : 'text-[#b7b0a1] hover:text-[#eee8dc]',
              )}
            >
              <Activity className="h-4 w-4" />
              <span className="text-[9px] leading-tight">{t.statsTab}</span>
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
                    : 'text-[#ded6c1] font-bold'
                  : isLight
                    ? 'text-[#686252] hover:text-[#353229]'
                    : 'text-[#b7b0a1] hover:text-[#eee8dc]',
              )}
            >
              <User className="h-4 w-4" />
              <span className="text-[9px] leading-tight">{t.profileTab}</span>
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

        {/* Full Page Indian Language Selection Modal */}
        {isLangFullPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
            <div
              className={cn(
                'w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden',
                isLight
                  ? 'bg-[#ffffff] border-[#e7e2d7] text-[#353229]'
                  : 'bg-[#1e1e1b] border-[#3d3a32] text-[#eee8dc]',
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-inherit">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-xl border shrink-0',
                      isLight ? 'bg-[#f6f3ec] border-[#e7e2d7]' : 'bg-[#282720] border-[#3d3a32]',
                    )}
                  >
                    <Globe className={cn('h-5 w-5', isLight ? 'text-[#8b7550]' : 'text-[#ded6c1]')} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg font-bold">
                      {t.indianLanguages}
                    </h2>
                    <p className={cn('text-xs', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                      {t.officialSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLangFullPage(false)}
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg border transition-colors cursor-pointer',
                    isLight
                      ? 'border-[#e7e2d7] bg-[#ffffff] hover:bg-[#f6f3ec]'
                      : 'border-[#3d3a32] bg-[#1e1e1b] hover:bg-[#282720]',
                  )}
                  title="Close Full Page"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Input */}
              <div className="p-3 sm:p-4 border-b border-inherit">
                <div className="relative">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')} />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder={t.searchLanguage}
                    className={cn(
                      'w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm outline-none transition-colors',
                      isLight
                        ? 'bg-[#f6f3ec] border-[#e7e2d7] text-[#353229] placeholder-[#8c8472] focus:border-[#b7b09e]'
                        : 'bg-[#141412] border-[#3d3a32] text-[#eee8dc] placeholder-[#867e6c] focus:border-[#867e6c]',
                    )}
                  />
                </div>
              </div>

              {/* Grid of Languages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 no-scrollbar">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? isLight
                            ? 'border-[#8b7550] bg-[#ebe2cc] text-[#353229] shadow-sm'
                            : 'border-[#ded6c1] bg-[#343127] text-[#eee8dc] shadow-sm'
                          : isLight
                            ? 'border-[#e7e2d7] bg-[#fbfaf7] hover:bg-[#f6f3ec] text-[#353229]'
                            : 'border-[#3d3a32] bg-[#171715] hover:bg-[#282720] text-[#eee8dc]',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0',
                            isLight
                              ? 'bg-[#ffffff] border-[#e7e2d7] text-[#686252]'
                              : 'bg-[#1e1e1b] border-[#3d3a32] text-[#b7b0a1]',
                          )}
                        >
                          {lang.badge}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate leading-snug">{lang.nativeName}</p>
                          <p className={cn('text-xs truncate leading-snug', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                            {lang.name} {lang.name !== lang.englishSub ? `· ${lang.englishSub}` : ''}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center shrink-0 ml-2',
                            isLight ? 'bg-[#353229] text-white' : 'bg-[#ded6c1] text-[#28261f]',
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3.5 border-t border-inherit flex items-center justify-between text-xs">
                <span className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                  {t.officialTagline}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLangFullPage(false)}
                  className={cn(
                    'px-4 py-1.5 rounded-xl font-bold transition-colors cursor-pointer',
                    isLight
                      ? 'bg-[#353229] text-white hover:bg-[#282720]'
                      : 'bg-[#ded6c1] text-[#28261f] hover:bg-[#ebe2cc]',
                  )}
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}
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
