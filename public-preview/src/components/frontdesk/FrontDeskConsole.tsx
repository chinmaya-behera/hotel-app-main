'use client';

import './frontdesk.css';
import type { FrontDeskPalette } from '@/types/demo';
import { useLayoutEffect, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  Activity,
  BedDouble,
  LayoutDashboard,
  Inbox,
  KeyRound,
  Landmark,
  LogIn,
  LogOut,
  PackageSearch,
  UserCheck,
  Crown,
  Bell,
  BellRing,
  BookOpen,
  ShieldAlert,
  User,
  ChevronDown,
  Layers,
  X,
  Check,
  Radio,
  Menu,
  ArrowLeft,
  CircleAlert,
  ArrowUpRight,
  Calendar,
  Clock,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FeedList } from '@/components/shared/FeedList';
import { FrontDeskLostFoundPanel } from '@/components/frontdesk/FrontDeskLostFoundPanel';
import { DisputesPanel } from '@/components/frontdesk/DisputesPanel';
import { IncidentsPanel } from '@/components/frontdesk/IncidentsPanel';
import { NotificationsPanel } from '@/components/frontdesk/NotificationsPanel';
import { StaffProfilePanel } from '@/components/frontdesk/StaffProfilePanel';
import { RequestsPanel, isDone, needsAction, type RequestCategory, type RequestSourceTab } from '@/components/frontdesk/RequestsPanel';
import { RoomsPanel } from '@/components/frontdesk/RoomsPanel';
import { StaysPanel } from '@/components/frontdesk/StaysPanel';
import { GuestRemindersPanel } from '@/components/frontdesk/GuestRemindersPanel';
import { VipPreviewPanel } from '@/components/frontdesk/VipPreviewPanel';
import { FrontDeskPoliciesPanel } from '@/components/frontdesk/FrontDeskPoliciesPanel';
import { FrontDeskMobileDashboard } from '@/components/frontdesk/FrontDeskMobileDashboard';
import { CountUp, spotlight } from '@/lib/gestures';
import { claimsNeedingFrontDesk } from '@/lib/financialClaims';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

export type TabId =
  | 'dashboard'
  | 'stays'
  | 'vip'
  | 'rooms'
  | 'requests'
  | 'lostfound'
  | 'reminders'
  | 'disputes'
  | 'incidents'
  | 'notifications'
  | 'profile'
  | 'policies';

const DASHBOARD_TAB: { id: TabId; label: string; icon: LucideIcon } = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

type StaysFilterType = 'all' | 'arrivals' | 'inhouse' | 'departures';

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon; group: 'operations' | 'services' }> = [
  { id: 'stays', label: 'Stays', icon: UserCheck, group: 'operations' },
  { id: 'vip', label: 'VIP guests', icon: Crown, group: 'operations' },
  { id: 'rooms', label: 'Rooms', icon: BedDouble, group: 'operations' },
  { id: 'requests', label: 'Requests', icon: Inbox, group: 'operations' },
  { id: 'lostfound', label: 'Lost & found', icon: PackageSearch, group: 'services' },
  { id: 'reminders', label: 'Reminders', icon: Bell, group: 'services' },
  { id: 'disputes', label: 'Dispute Financial', icon: Landmark, group: 'services' },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert, group: 'services' },
];

export function FrontDeskConsole({
  isLight: propIsLight,
  palette: propPalette,
}: {
  isLight?: boolean;
  palette?: FrontDeskPalette;
} = {}) {
  const { state } = useDemo();
  const isLight = propIsLight ?? ((state.frontDeskTheme ?? 'light') === 'light');
  const palette = propPalette ?? (state.frontDeskPalette ?? 'moobi');
  const isCosmic = palette === 'cosmic';
  const [tab, setTab] = useState<TabId>('stays');
  const [staysFilter, setStaysFilter] = useState<StaysFilterType>('all');
  const [reqCategory, setReqCategory] = useState<RequestCategory>('all');
  const [reqSourceTab, setReqSourceTab] = useState<RequestSourceTab>('guest_requests');
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);
  const [mobileActivityCollapsed, setMobileActivityCollapsed] = useState(true);
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const prev = useRef(0);

  useEffect(() => {
    const onOpenProfile = () => setProfileDrawerOpen(true);
    const onOpenNotifs = () => setNotificationsDrawerOpen(true);
    window.addEventListener('fd-open-profile-drawer', onOpenProfile);
    window.addEventListener('fd-open-notifications-drawer', onOpenNotifs);
    return () => {
      window.removeEventListener('fd-open-profile-drawer', onOpenProfile);
      window.removeEventListener('fd-open-notifications-drawer', onOpenNotifs);
    };
  }, []);

  const { stays = [], rooms = [], complaints = [] } = state.frontDesk ?? {};
  const queue = state.items.front_desk_coordinator ?? [];
  const arrivals = stays.filter((st) => st.status === 'expected');
  const inHouse = stays.filter((st) => st.status === 'in_house');
  const departing = inHouse.filter((st) => st.departsToday);
  const actionable = queue.filter(needsAction);
  const readyRooms = rooms.filter((r) => !r.occupied && r.readiness === 'ready');
  const financialToAct = claimsNeedingFrontDesk(state).length;
  const claims = queue.filter((i) => i.category === 'lost_found' && !isDone(i));
  const vipCount = stays.filter((s) => s.vip).length;
  const pendingReminders = (state.guestReminders ?? []).filter((r) => r.status === 'pending');

  const counts: Record<TabId, { n: number; alert: boolean }> = {
    dashboard: { n: 0, alert: false },
    stays: { n: arrivals.length, alert: arrivals.some((a) => !a.idChecked) },
    vip: { n: vipCount, alert: false },
    rooms: { n: rooms.filter((r) => r.readiness === 'dirty').length, alert: false },
    requests: { n: actionable.length, alert: actionable.length > 0 },
    lostfound: { n: claims.length, alert: claims.length > 0 },
    reminders: { n: pendingReminders.length, alert: false },
    disputes: { n: financialToAct, alert: financialToAct > 0 },
    incidents: { n: 2, alert: true },
    notifications: { n: 3, alert: true },
    profile: { n: 0, alert: false },
    policies: { n: 0, alert: false },
  };

  const kpis: Array<{
    label: string;
    value: number;
    note: string;
    icon: LucideIcon;
    tab: TabId;
    options?: { reqSourceTab?: RequestSourceTab; staysFilter?: StaysFilterType };
  }> = [
    {
      label: 'New Submissions',
      value: queue.filter((i) => i.status === 'Received' || i.status === 'New').length || 2,
      note: 'Awaiting review',
      icon: Inbox,
      tab: 'requests',
      options: { reqSourceTab: 'guest_requests' },
    },
    {
      label: 'Pending Requests',
      value: queue.filter((i) => !isDone(i) && !i.complaintId && !i.isEventRequest).length || 3,
      note: 'Active service tickets',
      icon: Layers,
      tab: 'requests',
      options: { reqSourceTab: 'guest_requests' },
    },
    {
      label: 'Open Complaints',
      value: queue.filter((i) => (i.complaintId || /^(?:GC|CMP)-/.test(i.ref ?? '')) && !isDone(i)).length || 1,
      note: 'Service recovery queue',
      icon: CircleAlert,
      tab: 'requests',
      options: { reqSourceTab: 'complaints' },
    },
    {
      label: 'Active Incidents',
      value: (state.fdIncidents ?? []).filter((i) => i.status !== 'resolved').length || 2,
      note: 'Security & safety alerts',
      icon: ShieldAlert,
      tab: 'incidents',
    },
    {
      label: 'Pending Financial',
      value: financialToAct,
      note: 'Claims awaiting decision',
      icon: Landmark,
      tab: 'disputes',
    },
    {
      label: 'Upcoming Events',
      value: queue.filter((i) => i.isEventRequest && !isDone(i)).length || 1,
      note: 'Banquet & celebrations',
      icon: Calendar,
      tab: 'requests',
      options: { reqSourceTab: 'event_requests' },
    },
    {
      label: 'Overdue Cases',
      value: queue.filter((i) => !isDone(i) && (i.chip?.toLowerCase().includes('overdue') || i.meta?.toLowerCase().includes('overdue'))).length || 1,
      note: 'Breached SLA response',
      icon: Clock,
      tab: 'requests',
      options: { reqSourceTab: 'fulfiller_escalations' },
    },
    {
      label: 'Upcoming Reminders',
      value: pendingReminders.length || 2,
      note: 'Timers & lead alarms',
      icon: Bell,
      tab: 'reminders',
    },
  ];

  // -------------------------------------------------------------
  // RELIABLE BROWSER & MOBILE HISTORY NAVIGATION (Prevents Logout)
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if initial window history already has front-desk state
    const isMobile = window.innerWidth < 1024;
    const currentState = window.history.state;
    if (currentState && currentState.staffRole === 'front-desk' && currentState.tab) {
      setTab(currentState.tab);
      if (currentState.staysFilter) setStaysFilter(currentState.staysFilter);
      if (currentState.reqSourceTab) setReqSourceTab(currentState.reqSourceTab);
    } else {
      // On mobile, default initial section is Dashboard; on desktop, default is Stays
      const initialTab: TabId = isMobile ? 'dashboard' : 'stays';
      setTab(initialTab);
      window.history.replaceState(
        { staffRole: 'front-desk', tab: initialTab, staysFilter: 'all' },
        ''
      );
    }

    const handlePopState = (e: PopStateEvent) => {
      const st = e.state;
      // Close mobile navigation drawer if open
      setSidebarOpen(false);
      setMobileActivityOpen(false);

      if (st && st.staffRole === 'front-desk') {
        if (st.tab) {
          setTab(st.tab);
          if (st.staysFilter) setStaysFilter(st.staysFilter);
          if (st.reqSourceTab) setReqSourceTab(st.reqSourceTab);
        }
      } else {
        // If the browser would otherwise pop out to /login,
        // preserve authenticated session and return to Front Desk dashboard on mobile, stays on desktop
        const isMob = window.innerWidth < 1024;
        const defaultTab: TabId = isMob ? 'dashboard' : 'stays';
        window.history.pushState(
          { staffRole: 'front-desk', tab: defaultTab, staysFilter: 'all' },
          ''
        );
        setTab(defaultTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (
    newTab: TabId,
    options?: {
      staysFilter?: StaysFilterType;
      reqSourceTab?: RequestSourceTab;
      reqCategory?: RequestCategory;
    }
  ) => {
    const sFilter = options?.staysFilter ?? 'all';
    const rSourceTab = options?.reqSourceTab ?? 'guest_requests';
    const rCategory = options?.reqCategory ?? 'all';

    setTab(newTab);
    setStaysFilter(sFilter);
    setReqSourceTab(rSourceTab);
    setReqCategory(rCategory);
    setSidebarOpen(false);

    if (typeof window !== 'undefined') {
      window.history.pushState(
        { staffRole: 'front-desk', tab: newTab, staysFilter: sFilter, reqSourceTab: rSourceTab },
        ''
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const idx = TABS.findIndex((t) => t.id === tab);
  const swap = idx >= prev.current ? 'fd-swap-right' : 'fd-swap-left';
  useEffect(() => {
    prev.current = idx;
  }, [idx]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[tab];
      if (!el) return;
      setPill({ left: el.offsetLeft, width: el.offsetWidth });
      el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tab, counts.vip.n, counts.reminders.n, counts.requests.n, counts.stays.n, counts.disputes.n, counts.lostfound.n, counts.rooms.n, counts.incidents.n, counts.notifications.n]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    const target = TABS[next];
    handleNavigate(target.id);
    refs.current[target.id]?.focus();
  }

  const activeTabObj = tab === 'dashboard' ? DASHBOARD_TAB : (TABS.find((t) => t.id === tab) ?? TABS[0]);
  const ActiveIcon = activeTabObj.icon;
  const activeCount = counts[tab];

  return (
    <div
      data-fd-theme={isLight ? 'light' : 'dark'}
      data-fd-palette={palette}
      className={cn(
        "flex-1 min-h-0 flex flex-col overflow-visible lg:overflow-hidden w-full",
        isLight ? "fd-light" : "fd-dark",
        isCosmic ? "fd-cosmic" : "fd-moobi"
      )}
    >
      {/* 1. Mobile Front Desk App Header with Hamburger Menu (< lg) */}
      <header className={cn(
        "lg:hidden shrink-0 mb-2.5 flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl border shadow-md backdrop-blur-md transition-colors",
        isLight
          ? isCosmic
            ? "border-purple-200/80 bg-[#FFFFFF] text-slate-900 shadow-xs"
            : "border-slate-200 bg-[#FFFFFF] text-slate-900 shadow-xs"
          : isCosmic
            ? "border-[#352952] bg-[#1A162B] text-white shadow-md"
            : "border-slate-700 bg-[#1E293B] text-white shadow-md"
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center active:scale-95 transition shrink-0 border shadow-xs cursor-pointer",
              isLight
                ? isCosmic
                  ? "bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100"
                  : "bg-slate-100 border-slate-300 text-[#1E40AF] hover:bg-slate-200"
                : isCosmic
                  ? "bg-[#251D3D] border-[#3D2D63] text-purple-200 hover:bg-[#322652]"
                  : "bg-[#0F172A] border-slate-700 text-blue-200 hover:bg-slate-800"
            )}
            aria-label="Open Front Desk navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "grid h-7 w-7 place-items-center rounded-lg shrink-0 border",
              isCosmic
                ? isLight
                  ? "bg-purple-100 border-purple-200 text-[#7C3AED]"
                  : "bg-[#251D3D] border-[#3D2D63] text-[#C084FC]"
                : isLight
                  ? "bg-blue-100 border-blue-200 text-[#1E40AF]"
                  : "bg-[#0F172A] border-slate-700 text-[#60A5FA]"
            )}>
              <ActiveIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className={cn("text-xs font-black truncate", isLight ? "text-slate-950" : "text-white")}>
                  {tab === 'dashboard'
                    ? 'Dashboard'
                    : tab === 'stays' && staysFilter === 'arrivals'
                      ? 'Arrivals (Check-In)'
                      : tab === 'stays' && staysFilter === 'departures'
                        ? 'Departures (Check-Out)'
                        : tab === 'requests' && reqSourceTab === 'complaints'
                          ? 'Guest Complaints'
                          : activeTabObj.label}
                </h1>
                {activeCount && activeCount.n > 0 && tab !== 'dashboard' && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    isCosmic
                      ? isLight ? "bg-purple-200 text-purple-900" : "bg-[#7C3AED] text-white"
                      : isLight ? "bg-blue-200 text-blue-900" : "bg-[#1E40AF] text-white"
                  )}>
                    {activeCount.n}
                  </span>
                )}
                {activeCount?.alert && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <p className={cn("text-[10px] font-medium truncate", isLight ? "text-slate-500" : isCosmic ? "text-purple-300/80" : "text-slate-400")}>Station FD-02 · Sunita P.</p>
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {tab !== 'dashboard' && (
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className={cn(
                "px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 active:scale-95 transition shadow-xs cursor-pointer",
                isLight
                  ? isCosmic
                    ? "bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100"
                    : "bg-slate-100 border-slate-300 text-[#1E40AF] hover:bg-slate-200"
                  : isCosmic
                    ? "bg-[#251D3D] border-[#3D2D63] text-purple-200 hover:bg-[#322652]"
                    : "bg-[#0F172A] border-slate-700 text-blue-200 hover:bg-slate-800"
              )}
              title="Return to Dashboard Overview"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setNotificationsDrawerOpen(true)}
            className={cn(
              'h-8 w-8 rounded-lg border flex items-center justify-center transition relative shrink-0 cursor-pointer shadow-xs',
              notificationsDrawerOpen
                ? 'bg-amber-400/20 border-amber-400/50 text-white'
                : isLight
                  ? isCosmic
                    ? 'bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100'
                    : 'bg-slate-100 border-slate-300 text-[#1E40AF] hover:bg-slate-200'
                  : isCosmic
                    ? 'bg-[#251D3D] border-[#3D2D63] text-purple-200 hover:bg-[#322652]'
                    : 'bg-[#0F172A] border-slate-700 text-blue-200 hover:bg-slate-800'
            )}
            title="Open Department Operations Notifications"
            aria-label="Open notifications"
          >
            <BellRing className="h-4 w-4 text-amber-500" />
            {counts.notifications && counts.notifications.n > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {counts.notifications.n}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setProfileDrawerOpen(true)}
            className={cn(
              'h-8 w-8 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs',
              profileDrawerOpen
                ? 'bg-rose-100 border-rose-300 text-rose-800'
                : isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-[#29131C] border-rose-500/40 text-rose-200 hover:bg-[#3B1925]'
            )}
            title="Open Staff Profile & Policies"
            aria-label="Open staff profile"
          >
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">SP</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileActivityOpen(true)}
            className={cn(
              "h-8 w-8 rounded-lg border flex items-center justify-center transition relative shrink-0 cursor-pointer shadow-xs",
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
            )}
            title="Property Live Feed"
            aria-label="Open property live activity"
          >
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </header>

      {/* 2. Numeric Overview KPI Row - Preserved 100% on Desktop (Hidden on mobile) */}
      <div className="hidden lg:block shrink-0 mb-2 sm:mb-2.5">
        <div className="fd-stagger grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <button
                key={k.label}
                type="button"
                onClick={() => handleNavigate(k.tab, k.options)}
                style={{
                  '--i': i,
                  backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#191528' : undefined,
                  borderColor: isLight
                    ? isCosmic ? '#E9D5FF' : '#E2E8F0'
                    : isCosmic ? '#352952' : undefined,
                } as CSSProperties}
                className={cn(
                  "p-2.5 sm:px-3 sm:py-2.5 text-left cursor-pointer transition-all group rounded-2xl border",
                  isLight
                    ? isCosmic
                      ? "bg-[#FFFFFF] border-purple-200 hover:border-purple-300 hover:shadow-md shadow-xs text-slate-900"
                      : "bg-[#FFFFFF] border-slate-200 hover:border-slate-300 hover:shadow-md shadow-xs text-slate-900"
                    : isCosmic
                      ? "bg-[#191528] border-[#352952] hover:border-purple-500/50 hover:bg-[#201a35] text-white shadow-sm"
                      : "panel fd-spot hover:border-cyan-400/40 hover:bg-white/[0.06]"
                )}
                {...(!isLight ? spotlight : {})}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-[11px] font-bold truncate mr-1.5 transition-colors",
                      isLight
                        ? isCosmic ? "text-purple-900 group-hover:text-purple-950" : "text-slate-600 group-hover:text-slate-950"
                        : isCosmic ? "text-purple-200/90 group-hover:text-white" : "text-mist-300 group-hover:text-cyan-200"
                    )}
                  >
                    {k.label}
                  </p>
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-lg shrink-0 group-hover:scale-105 transition-transform",
                      isLight
                        ? isCosmic ? "bg-purple-100/70 border border-purple-200 text-purple-700" : "bg-cyan-50 border border-cyan-200 text-cyan-600"
                        : isCosmic ? "bg-purple-950/70 border border-purple-800/60 text-purple-300" : "accent-soft text-cyan-300"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 text-lg sm:text-xl font-black tabular-nums leading-tight",
                    isLight ? "text-slate-950" : "text-white"
                  )}
                  style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
                >
                  <CountUp value={k.value} />
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px] truncate font-medium",
                    isLight
                      ? isCosmic ? "text-purple-600/80" : "text-slate-500"
                      : isCosmic ? "text-purple-300/70" : "text-mist-400"
                  )}
                >
                  {k.note}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace Split: Left Content + Sticky Right Activity Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4 xl:gap-5 overflow-visible lg:overflow-hidden">
        {/* Left Column: Section Navigation + Content Area */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-visible lg:overflow-hidden">
          {/* Horizontal Section Navigation Bar (Preserved 100% on Desktop, Hidden on Mobile only) */}
          <div className="hidden lg:flex shrink-0 mb-2 sm:mb-2.5 items-center w-full">
            <div
              className={cn(
                "flex-1 min-w-0 overflow-x-auto scroll-smooth flex items-center gap-1.5 p-1 rounded-2xl border transition-colors",
                isLight
                  ? isCosmic ? "bg-[#FFFFFF] border-purple-200/70 shadow-xs" : "bg-[#FFFFFF] border-slate-200 shadow-xs"
                  : isCosmic ? "bg-[#141022] border-[#2A2044] shadow-md" : "fd-tabs"
              )}
              style={{
                backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#141022' : undefined,
                borderColor: isLight
                  ? isCosmic ? '#E9D5FF' : '#E2E8F0'
                  : isCosmic ? '#2A2044' : undefined,
              }}
              role="tablist"
              aria-label="Front Desk sections"
              onKeyDown={onKeyDown}
              onWheel={(e) => {
                if (e.deltaY !== 0 && !e.shiftKey) {
                  e.currentTarget.scrollLeft += e.deltaY * 0.85;
                }
              }}
            >
              {!isLight && !isCosmic && (
                <span className="fd-tab-pill hidden lg:block" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} aria-hidden />
              )}
              {TABS.map((t) => {
                const Icon = t.icon;
                const c = counts[t.id];
                const selected = tab === t.id;
                return (
                  <button
                    key={t.id}
                    ref={(el) => {
                      refs.current[t.id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`fd-tab-${t.id}`}
                    aria-selected={selected}
                    aria-controls={`fd-panel-${t.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => handleNavigate(t.id)}
                    className={cn(
                      'shrink-0 transition-all inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer',
                      isLight
                        ? selected
                          ? isCosmic
                            ? 'bg-[#EDE9FE] text-[#5B21B6] border border-[#C4B5FD] shadow-xs'
                            : 'bg-rose-100 text-rose-950 border border-rose-300 shadow-xs'
                          : isCosmic
                            ? 'text-slate-700 hover:text-purple-950 hover:bg-purple-50/60'
                            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                        : selected
                          ? isCosmic
                            ? 'bg-[#4C1D95]/60 text-[#E9D5FF] border border-[#7C3AED]/60 shadow-xs'
                            : 'fd-tab text-white bg-white/10 lg:bg-transparent'
                          : isCosmic
                            ? 'text-purple-200/80 hover:text-white hover:bg-purple-950/40'
                            : 'fd-tab text-mist-300'
                    )}
                    style={
                      selected
                        ? isLight
                          ? isCosmic
                            ? { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD', color: '#5B21B6' }
                            : { backgroundColor: '#FFE4E6', borderColor: '#FDA4AF', color: '#881337' }
                          : isCosmic
                            ? { backgroundColor: 'rgba(76, 29, 149, 0.6)', borderColor: 'rgba(124, 58, 237, 0.6)', color: '#E9D5FF' }
                            : undefined
                        : undefined
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{t.label}</span>
                    {c && c.n > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-black tabular-nums",
                          isLight
                            ? selected
                              ? isCosmic ? "bg-purple-200 text-purple-900" : "bg-rose-200 text-rose-950"
                              : c.alert
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : isCosmic ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-800"
                            : isCosmic
                              ? selected
                                ? "bg-purple-800 text-purple-100 border border-purple-600/50"
                                : "bg-purple-950/80 text-purple-300 border border-purple-800/40"
                              : "fd-tab-count"
                        )}
                        data-alert={c.alert}
                        aria-label={`${c.n} pending`}
                      >
                        {c.n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Section Content Area */}
          <div className={cn("flex-1 min-h-0 pr-0 lg:pr-1 pb-2", tab === 'rooms' ? "flex flex-col overflow-visible lg:overflow-hidden" : "overflow-visible lg:overflow-y-auto space-y-4")}>
            <div key={tab} id={`fd-panel-${tab}`} role="tabpanel" aria-labelledby={`fd-tab-${tab}`} className={cn(swap, tab === 'rooms' && "flex-1 min-h-0 flex flex-col overflow-visible lg:overflow-hidden")}>
              {/* On Mobile: Dashboard displays ONLY the complete Dashboard overview */}
              {tab === 'dashboard' && (
                <div className="lg:hidden">
                  <FrontDeskMobileDashboard
                    stays={stays}
                    rooms={rooms}
                    queue={queue}
                    disputeCount={financialToAct}
                    complaints={complaints}
                    guestReminders={state.guestReminders ?? []}
                    kpis={kpis}
                    onNavigate={handleNavigate}
                    onOpenLiveActivity={() => setMobileActivityOpen(true)}
                  />
                </div>
              )}

              {/* Stays Section - on desktop, default/dashboard falls back to Stays */}
              {(tab === 'stays' || tab === 'dashboard') && (
                <div className={tab === 'dashboard' ? 'hidden lg:block' : 'block'}>
                  <StaysPanel initialFilter={staysFilter} isLight={isLight} palette={palette} />
                </div>
              )}
              {tab === 'vip' && <VipPreviewPanel onSwitchTab={(t) => handleNavigate(t as TabId)} />}
              {tab === 'rooms' && <RoomsPanel />}
              {tab === 'requests' && <RequestsPanel initialCategory={reqCategory} initialSourceTab={reqSourceTab} />}
              {tab === 'lostfound' && (
                <FrontDeskLostFoundPanel
                  onOpenRequests={() => handleNavigate('requests', { reqSourceTab: 'guest_requests' })}
                />
              )}
              {tab === 'reminders' && <GuestRemindersPanel />}
              {tab === 'disputes' && <DisputesPanel />}
              {tab === 'incidents' && <IncidentsPanel />}
              {tab === 'notifications' && <NotificationsPanel onNavigate={(t) => handleNavigate(t as TabId)} />}
              {(tab === 'profile' || tab === 'policies') && <StaffProfilePanel />}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Recent Activity Sidebar (Unchanged on Desktop, hidden on mobile) */}
        <div className="hidden lg:flex w-full lg:w-72 xl:w-[285px] shrink-0 h-full min-h-0 flex-col overflow-hidden">
          <div
            className={cn(
              "h-full flex flex-col min-h-0 overflow-hidden rounded-3xl border shadow-sm transition-colors",
              isLight
                ? isCosmic
                  ? "bg-[#FFFFFF] border-purple-200/70 shadow-xs"
                  : "bg-[#FFFFFF] border-slate-200 shadow-xs"
                : isCosmic
                  ? "bg-[#191528] border-[#32274E] shadow-lg"
                  : "border-white/10 bg-ink-900 shadow-lg"
            )}
            style={{
              backgroundColor: isLight ? '#FFFFFF' : isCosmic ? '#191528' : undefined,
              borderColor: isLight
                ? isCosmic ? '#E9D5FF' : '#E2E8F0'
                : isCosmic ? '#32274E' : undefined,
            }}
          >
            {/* Header */}
            <div
              className={cn(
                "p-3.5 border-b flex items-center justify-between shrink-0",
                isLight
                  ? isCosmic ? "border-purple-100 bg-purple-50/40" : "border-slate-100 bg-slate-50/50"
                  : isCosmic ? "border-[#2A2044] bg-[#141022]" : "border-white/10 bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl shrink-0",
                    isLight
                      ? isCosmic ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                      : isCosmic ? "bg-purple-950 text-purple-300 border border-purple-800/40" : "bg-white/5 text-cyan-300 border border-white/10"
                  )}
                >
                  <Activity className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3
                    className={cn("text-xs font-black truncate", isLight ? "text-slate-950" : "text-white")}
                    style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}
                  >
                    Recent activity
                  </h3>
                  <p
                    className={cn("text-[10px] font-medium truncate", isLight ? "text-slate-500" : "text-mist-400")}
                  >
                    Property activity log
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs shrink-0",
                  isLight
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </span>
            </div>

            {/* Feed List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3">
              <FeedList limit={25} isLight={isLight} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Floating Quick-Action Pill for Live Feed (< lg) */}
      <button
        type="button"
        onClick={() => setMobileActivityOpen(true)}
        className="fixed bottom-5 right-4 z-40 lg:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-ink-900/95 border border-cyan-400/40 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md active:scale-95 transition-all"
        aria-label="Open live property activity feed"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <Activity className="h-3.5 w-3.5 text-cyan-300" />
        <span>Live Feed</span>
      </button>

      {/* 5. SLIDE-IN MOBILE NAVIGATION DRAWER (< lg) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Subtle Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />

          {/* Compact Slide-In Navigation Drawer (Slides from left) */}
          <aside
            className="relative w-[310px] max-w-[85vw] h-full bg-ink-950 border-r border-white/15 z-10 shadow-2xl flex flex-col justify-between overflow-hidden animate-[fd-slide-from-left_0.25s_cubic-bezier(0.16,1,0.3,1)]"
            role="dialog"
            aria-label="Front Desk Navigation Sidebar"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-sky-600/30 border border-cyan-400/40 flex items-center justify-center font-black text-cyan-300 text-base shadow-sm">
                    FD
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight leading-tight">The Grand ADP</h2>
                    <p className="text-[11px] text-cyan-300 font-medium">Front Desk Console</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-mist-400 hover:text-white transition"
                  aria-label="Close navigation sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Staff Status Chip */}
              <div className="mt-3.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-semibold">Sunita Patel</span>
                </div>
                <span className="text-mist-400 font-mono">Station FD-02</span>
              </div>
            </div>

            {/* Drawer Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
              {/* TOP: Dedicated Dashboard Overview */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1 px-2.5">
                  Overview
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                    tab === 'dashboard'
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                      : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LayoutDashboard className={cn('h-4 w-4 shrink-0', tab === 'dashboard' ? 'text-cyan-300' : 'text-mist-400')} />
                    <span className="truncate font-semibold">Dashboard</span>
                  </div>
                  {tab === 'dashboard' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                </button>
              </div>

              {/* GROUP 1: Core Operations */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1 px-2.5">
                  Core Operations
                </p>
                <div className="space-y-0.5">
                  {/* Stays */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('stays', { staysFilter: 'all' })}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'stays' && staysFilter === 'all'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserCheck className={cn('h-4 w-4 shrink-0', tab === 'stays' && staysFilter === 'all' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Stays</span>
                    </div>
                    {tab === 'stays' && staysFilter === 'all' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                  </button>

                  {/* Sub-item: Check-In / Arrivals */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('stays', { staysFilter: 'arrivals' })}
                    className={cn(
                      'w-full flex items-center justify-between pl-8 pr-3 py-1.5 rounded-lg text-left transition text-[11px]',
                      tab === 'stays' && staysFilter === 'arrivals'
                        ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                        : 'text-mist-400 hover:text-white hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <LogIn className="h-3 w-3 text-cyan-400" />
                      <span>Check-In / Arrivals</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                      {arrivals.length}
                    </span>
                  </button>

                  {/* Sub-item: Check-Out / Departures */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('stays', { staysFilter: 'departures' })}
                    className={cn(
                      'w-full flex items-center justify-between pl-8 pr-3 py-1.5 rounded-lg text-left transition text-[11px]',
                      tab === 'stays' && staysFilter === 'departures'
                        ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                        : 'text-mist-400 hover:text-white hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-3 w-3 text-amber-400" />
                      <span>Check-Out / Departures</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                      {departing.length}
                    </span>
                  </button>

                  {/* Sub-item: In-House Guests */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('stays', { staysFilter: 'inhouse' })}
                    className={cn(
                      'w-full flex items-center justify-between pl-8 pr-3 py-1.5 rounded-lg text-left transition text-[11px]',
                      tab === 'stays' && staysFilter === 'inhouse'
                        ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                        : 'text-mist-400 hover:text-white hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-3 w-3 text-emerald-400" />
                      <span>In-House Guests</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                      {inHouse.length}
                    </span>
                  </button>

                  {/* VIP Guests */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('vip')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition mt-1',
                      tab === 'vip'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Crown className={cn('h-4 w-4 shrink-0', tab === 'vip' ? 'text-amber-300' : 'text-amber-400/70')} />
                      <span className="truncate">VIP Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {vipCount}
                      </span>
                      {tab === 'vip' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                    </div>
                  </button>

                  {/* Rooms Board */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('rooms')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'rooms'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BedDouble className={cn('h-4 w-4 shrink-0', tab === 'rooms' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Rooms Management</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                        {counts.rooms.n} dirty
                      </span>
                      {tab === 'rooms' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                    </div>
                  </button>

                  {/* Requests & Cases */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('requests', { reqSourceTab: 'guest_requests' })}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'requests' && reqSourceTab === 'guest_requests'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Inbox className={cn('h-4 w-4 shrink-0', tab === 'requests' && reqSourceTab === 'guest_requests' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Requests &amp; Cases</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-400 text-ink-950">
                        {actionable.length}
                      </span>
                      {tab === 'requests' && reqSourceTab === 'guest_requests' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                    </div>
                  </button>

                  {/* Sub-item: Complaints */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('requests', { reqSourceTab: 'complaints' })}
                    className={cn(
                      'w-full flex items-center justify-between pl-8 pr-3 py-1.5 rounded-lg text-left transition text-[11px]',
                      tab === 'requests' && reqSourceTab === 'complaints'
                        ? 'bg-rose-500/20 text-rose-200 font-semibold'
                        : 'text-mist-400 hover:text-white hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CircleAlert className="h-3 w-3 text-rose-400" />
                      <span>Guest Complaints</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                      {complaints.length || 2}
                    </span>
                  </button>
                </div>
              </div>

              {/* GROUP 2: Front Desk Services */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1 px-2.5">
                  Guest Services &amp; Recovery
                </p>
                <div className="space-y-0.5">
                  {/* Lost & Found */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('lostfound')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'lostfound'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PackageSearch className={cn('h-4 w-4 shrink-0', tab === 'lostfound' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Lost &amp; Found</span>
                    </div>
                    {counts.lostfound.n > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {counts.lostfound.n}
                      </span>
                    )}
                  </button>

                  {/* Reminders */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('reminders')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'reminders'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Bell className={cn('h-4 w-4 shrink-0', tab === 'reminders' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Guest Reminders</span>
                    </div>
                    {pendingReminders.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-mist-300">
                        {pendingReminders.length}
                      </span>
                    )}
                  </button>

                  {/* Disputes */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('disputes')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'disputes'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Landmark className={cn('h-4 w-4 shrink-0', tab === 'disputes' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Dispute Financial</span>
                    </div>
                    {financialToAct > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {financialToAct}
                      </span>
                    )}
                  </button>

                  {/* Incidents */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('incidents')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'incidents'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldAlert className={cn('h-4 w-4 shrink-0', tab === 'incidents' ? 'text-rose-400' : 'text-mist-400')} />
                      <span className="truncate">Incidents &amp; Security</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      2
                    </span>
                  </button>
                </div>
              </div>

              {/* GROUP 3: Administration & Knowledge */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1 px-2.5">
                  Administration &amp; Protocols
                </p>
                <div className="space-y-0.5">
                  {/* Notifications */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('notifications')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'notifications'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BellRing className={cn('h-4 w-4 shrink-0', tab === 'notifications' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Notification Alerts</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      3
                    </span>
                  </button>

                  {/* Profile */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('profile')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'profile'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <User className={cn('h-4 w-4 shrink-0', tab === 'profile' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Staff Station Profile</span>
                    </div>
                    {tab === 'profile' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                  </button>

                  {/* Policies */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('policies')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                      tab === 'policies'
                        ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                        : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className={cn('h-4 w-4 shrink-0', tab === 'policies' ? 'text-cyan-300' : 'text-mist-400')} />
                      <span className="truncate">Operating Policies SOP</span>
                    </div>
                    {tab === 'policies' && <Check className="h-3.5 w-3.5 text-cyan-300" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] shrink-0 text-xs">
              <div className="flex items-center justify-between text-mist-400 text-[11px] mb-2">
                <span>Grand Azure PMS v2.4</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Connected</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('dashboard')}
                className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-cyan-200 hover:text-white text-xs font-bold text-center transition"
              >
                Return to Dashboard
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 6. Mobile Live Property Activity Sheet (< lg) */}
      {mobileActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:max-w-lg max-h-[85vh] bg-ink-950 border border-white/15 rounded-t-3xl sm:rounded-2xl p-4 flex flex-col overflow-hidden shadow-2xl animate-[fd-rise_0.25s_cubic-bezier(0.16,1,0.3,1)]"
            role="dialog"
            aria-label="Live Property Activity Feed"
          >
            {/* Activity Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Property Activity</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Feed</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileActivityOpen(false)}
                className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Activity Feed */}
            <div className="flex-1 overflow-y-auto py-3">
              <FeedList limit={25} />
            </div>
          </div>
        </div>
      )}

      {/* 7. Right-Side Detailed Staff Profile Floating Drawer */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-5 animate-fade-in">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setProfileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Staff Profile & Policies"
            className="relative z-10 w-[95vw] sm:w-[85vw] md:w-[60vw] lg:w-[48%] max-w-2xl h-[90vh] max-h-[90vh] rounded-3xl border border-white/10 bg-ink-950/95 shadow-2xl shadow-black/80 backdrop-blur-2xl flex flex-col overflow-hidden animate-slide-left ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-white/[0.02]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-400" />
                  <span>Staff Profile &amp; Role Policies</span>
                </h2>
                <p className="text-xs text-mist-400">Sunita Patel · Station FD-02</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileDrawerOpen(false)}
                className="rounded-xl p-2 text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close profile drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
              <StaffProfilePanel />
            </div>
          </aside>
        </div>
      )}

      {/* 8. Right-Side Detailed Notifications Floating Drawer */}
      {notificationsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-5 animate-fade-in">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setNotificationsDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Department Notifications"
            className="relative z-10 w-[95vw] sm:w-[85vw] md:w-[60vw] lg:w-[48%] max-w-2xl h-[90vh] max-h-[90vh] rounded-3xl border border-white/10 bg-ink-950/95 shadow-2xl shadow-black/80 backdrop-blur-2xl flex flex-col overflow-hidden animate-slide-left ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-white/[0.02]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-amber-400" />
                  <span>Operations &amp; Guest Notifications</span>
                </h2>
                <p className="text-xs text-mist-400">Front Desk Dispatch &amp; Handover Alerts</p>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsDrawerOpen(false)}
                className="rounded-xl p-2 text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notifications drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
              <NotificationsPanel
                onNavigate={(targetTab) => {
                  setNotificationsDrawerOpen(false);
                  handleNavigate(targetTab as TabId);
                }}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
