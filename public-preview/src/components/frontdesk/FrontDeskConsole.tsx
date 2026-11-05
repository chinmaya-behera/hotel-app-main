'use client';

import './frontdesk.css';
import { useLayoutEffect, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  Activity,
  BedDouble,
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
import { RequestsPanel, isDone, needsAction, type RequestCategory } from '@/components/frontdesk/RequestsPanel';
import { RoomsPanel } from '@/components/frontdesk/RoomsPanel';
import { StaysPanel } from '@/components/frontdesk/StaysPanel';
import { GuestRemindersPanel } from '@/components/frontdesk/GuestRemindersPanel';
import { VipPreviewPanel } from '@/components/frontdesk/VipPreviewPanel';
import { FrontDeskPoliciesPanel } from '@/components/frontdesk/FrontDeskPoliciesPanel';
import { CountUp, spotlight } from '@/lib/gestures';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

type TabId =
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

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon; group: 'operations' | 'services' | 'admin' }> = [
  { id: 'stays', label: 'Stays', icon: UserCheck, group: 'operations' },
  { id: 'vip', label: 'VIP guests', icon: Crown, group: 'operations' },
  { id: 'rooms', label: 'Rooms', icon: BedDouble, group: 'operations' },
  { id: 'requests', label: 'Requests', icon: Inbox, group: 'operations' },
  { id: 'lostfound', label: 'Lost & found', icon: PackageSearch, group: 'services' },
  { id: 'reminders', label: 'Reminders', icon: Bell, group: 'services' },
  { id: 'disputes', label: 'Dispute (Financial)', icon: Landmark, group: 'services' },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert, group: 'services' },
  { id: 'notifications', label: 'Notification', icon: BellRing, group: 'admin' },
  { id: 'profile', label: 'Profile', icon: User, group: 'admin' },
  { id: 'policies', label: 'Policies', icon: BookOpen, group: 'admin' },
];

export function FrontDeskConsole() {
  const { state } = useDemo();
  const [tab, setTab] = useState<TabId>('stays');
  const [reqCategory, setReqCategory] = useState<RequestCategory>('all');
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);
  const [mobileActivityCollapsed, setMobileActivityCollapsed] = useState(true);
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const prev = useRef(0);

  const { stays = [], rooms = [], sync = [], complaints = [] } = state.frontDesk ?? {};
  const queue = state.items.front_desk_coordinator ?? [];
  const arrivals = stays.filter((st) => st.status === 'expected');
  const inHouse = stays.filter((st) => st.status === 'in_house');
  const departing = inHouse.filter((st) => st.departsToday);
  const actionable = queue.filter(needsAction);
  const readyRooms = rooms.filter((r) => !r.occupied && r.readiness === 'ready');
  const failedSync = sync.filter((x) => x.bookingState === 'PMS_Sync_Failed');
  const claims = queue.filter((i) => i.category === 'lost_found' && !isDone(i));
  const vipCount = stays.filter((s) => s.vip).length;
  const pendingReminders = (state.guestReminders ?? []).filter((r) => r.status === 'pending');

  const counts: Record<TabId, { n: number; alert: boolean }> = {
    stays: { n: arrivals.length, alert: arrivals.some((a) => !a.idChecked) },
    vip: { n: vipCount, alert: false },
    rooms: { n: rooms.filter((r) => r.readiness === 'dirty').length, alert: false },
    requests: { n: actionable.length, alert: actionable.length > 0 },
    lostfound: { n: claims.length, alert: claims.length > 0 },
    reminders: { n: pendingReminders.length, alert: false },
    disputes: { n: failedSync.length + 3, alert: failedSync.length > 0 },
    incidents: { n: 2, alert: true },
    notifications: { n: 3, alert: true },
    profile: { n: 0, alert: false },
    policies: { n: 0, alert: false },
  };

  const kpis: Array<{ label: string; value: number; note: string; icon: LucideIcon }> = [
    { label: 'Arrivals expected', value: arrivals.length, note: `${arrivals.filter((a) => !a.idChecked).length} need ID check`, icon: LogIn },
    { label: 'In house', value: inHouse.length, note: 'Guests with active session', icon: KeyRound },
    { label: 'Departing today', value: departing.length, note: 'Folio and checkout checks', icon: LogOut },
    { label: 'Rooms ready', value: readyRooms.length, note: 'Vacant and inspected', icon: BedDouble },
    { label: 'Sync issues', value: failedSync.length, note: 'Paid but not booked', icon: Landmark },
  ];

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
    setTab(target.id);
    refs.current[target.id]?.focus();
  }

  const activeTabObj = TABS.find((t) => t.id === tab) ?? TABS[0];
  const ActiveIcon = activeTabObj.icon;
  const activeCount = counts[tab];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-visible lg:overflow-hidden w-full">
      {/* 1. Sticky/Fixed Numeric Overview KPI Row (5 cards: 2-col on mobile with 5th spanning full, 3-col tablet, 5-col desktop) */}
      <div className="shrink-0 mb-2 sm:mb-2.5">
        <div className="fd-stagger grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                style={{ '--i': i } as CSSProperties}
                className={cn(
                  'panel fd-spot p-2.5 sm:px-3.5 sm:py-2.5',
                  i === 4 ? 'col-span-2 sm:col-span-1' : ''
                )}
                {...spotlight}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-mist-300 truncate mr-2">{k.label}</p>
                  <span className="accent-soft grid h-6 w-6 place-items-center rounded-md shrink-0">
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                  </span>
                </div>
                <p className="mt-1 text-xl sm:text-[22px] font-bold tabular-nums text-white leading-tight">
                  <CountUp value={k.value} />
                </p>
                <p className="mt-0.5 text-[10px] text-mist-400 truncate">{k.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Workspace Split: Left Content + Sticky Right Activity Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 sm:gap-4 xl:gap-5 overflow-visible lg:overflow-hidden">
        {/* Left Column: Section Navigation + Content Area */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-visible lg:overflow-hidden">
          {/* A. Mobile Section Switcher Header (< lg) */}
          <div className="lg:hidden shrink-0 mb-2 flex items-center justify-between gap-2 p-2 rounded-xl border border-white/10 bg-ink-900/90 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="accent-soft grid h-7 w-7 place-items-center rounded-lg shrink-0">
                <ActiveIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">{activeTabObj.label}</span>
                  {activeCount && activeCount.n > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-400 text-ink-950">
                      {activeCount.n}
                    </span>
                  )}
                  {activeCount?.alert && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 active:scale-95 transition"
              aria-label="Switch Front Desk section"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Tabs</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* B. Horizontal Section Navigation Bar (Touch-scrollable on mobile, sliding pill on desktop) */}
          <div className="shrink-0 mb-2 sm:mb-2.5 flex items-center justify-between gap-3">
            <div
              className="fd-tabs flex-1 min-w-0 overflow-x-auto no-scrollbar scroll-smooth"
              role="tablist"
              aria-label="Front Desk sections"
              onKeyDown={onKeyDown}
            >
              <span className="fd-tab-pill hidden lg:block" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} aria-hidden />
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
                    onClick={() => {
                      if (t.id === 'requests') setReqCategory('all');
                      setTab(t.id);
                    }}
                    className={cn(
                      'fd-tab shrink-0 transition-colors',
                      selected ? 'text-white bg-white/10 lg:bg-transparent' : 'text-mist-300'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{t.label}</span>
                    {c && c.n > 0 && (
                      <span className="fd-tab-count" data-alert={c.alert} aria-label={`${c.n} pending`}>
                        {c.n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Main Section Content Area */}
          <div className={cn("flex-1 min-h-0 pr-0 lg:pr-1 pb-2", tab === 'rooms' ? "flex flex-col overflow-visible lg:overflow-hidden" : "overflow-visible lg:overflow-y-auto space-y-4")}>
            <div key={tab} id={`fd-panel-${tab}`} role="tabpanel" aria-labelledby={`fd-tab-${tab}`} className={cn(swap, tab === 'rooms' && "flex-1 min-h-0 flex flex-col overflow-visible lg:overflow-hidden")}>
              {tab === 'stays' && <StaysPanel />}
              {tab === 'vip' && <VipPreviewPanel onSwitchTab={(t) => setTab(t as TabId)} />}
              {tab === 'rooms' && <RoomsPanel />}
              {tab === 'requests' && <RequestsPanel initialCategory={reqCategory} />}
              {tab === 'lostfound' && (
                <FrontDeskLostFoundPanel
                  onOpenRequests={() => {
                    setReqCategory('lost_found');
                    setTab('requests');
                  }}
                />
              )}
              {tab === 'reminders' && <GuestRemindersPanel />}
              {tab === 'disputes' && <DisputesPanel />}
              {tab === 'incidents' && <IncidentsPanel />}
              {tab === 'notifications' && <NotificationsPanel onNavigate={(t) => setTab(t as TabId)} />}
              {tab === 'profile' && <StaffProfilePanel />}
              {tab === 'policies' && <FrontDeskPoliciesPanel />}
            </div>

            {/* D. Mobile Collapsible Activity Section (< lg) */}
            <div className="lg:hidden mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setMobileActivityCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-ink-900/90 text-xs font-bold text-white transition hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Recent Hotel Activity</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live</span>
                  </span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-mist-400 transition-transform', !mobileActivityCollapsed && 'rotate-180')} />
              </button>

              {!mobileActivityCollapsed && (
                <div className="mt-2.5 p-3 rounded-xl border border-white/10 bg-ink-900/70 max-h-80 overflow-y-auto">
                  <FeedList limit={15} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Recent Activity Sidebar (Unchanged on Desktop, hidden on mobile) */}
        <div className="hidden lg:flex w-full lg:w-72 xl:w-[285px] shrink-0 h-full min-h-0 flex-col overflow-hidden">
          <Panel
            title="Recent activity"
            hint="Property activity log"
            icon={Activity}
            action={
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </span>
            }
            className="h-full flex flex-col min-h-0 overflow-hidden shadow-lg"
            bodyClassName="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3"
          >
            <FeedList limit={25} />
          </Panel>
        </div>
      </div>

      {/* 3. Mobile Floating Quick-Action Pill for Live Feed (< lg) */}
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

      {/* 4. Mobile Section Navigation Sheet / Modal (< lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:max-w-md max-h-[85vh] bg-ink-950 border border-white/15 rounded-t-3xl sm:rounded-2xl p-4 flex flex-col overflow-hidden shadow-2xl animate-[fd-rise_0.25s_cubic-bezier(0.16,1,0.3,1)]"
            role="dialog"
            aria-label="Select Front Desk Section"
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-300" />
                <h3 className="text-sm font-bold text-white">Front Desk Sections</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sheet Sections List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs">
              {/* Group: Operations */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1.5 px-2">
                  Guest Operations
                </p>
                <div className="space-y-1">
                  {TABS.filter((t) => t.group === 'operations').map((t) => {
                    const Icon = t.icon;
                    const c = counts[t.id];
                    const isSelected = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (t.id === 'requests') setReqCategory('all');
                          setTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                          isSelected
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                            : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-cyan-300' : 'text-mist-400')} />
                          <span className="truncate">{t.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c && c.n > 0 && (
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', c.alert ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-mist-200')}>
                              {c.n}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-cyan-300 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group: Services */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1.5 px-2">
                  Front Desk Services
                </p>
                <div className="space-y-1">
                  {TABS.filter((t) => t.group === 'services').map((t) => {
                    const Icon = t.icon;
                    const c = counts[t.id];
                    const isSelected = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                          isSelected
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                            : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-cyan-300' : 'text-mist-400')} />
                          <span className="truncate">{t.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c && c.n > 0 && (
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', c.alert ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-mist-200')}>
                              {c.n}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-cyan-300 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group: Admin & Knowledge */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mist-400 mb-1.5 px-2">
                  Administration &amp; Protocols
                </p>
                <div className="space-y-1">
                  {TABS.filter((t) => t.group === 'admin').map((t) => {
                    const Icon = t.icon;
                    const c = counts[t.id];
                    const isSelected = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTab(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition',
                          isSelected
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-white font-bold'
                            : 'border-transparent text-mist-300 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-cyan-300' : 'text-mist-400')} />
                          <span className="truncate">{t.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c && c.n > 0 && (
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', c.alert ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-mist-200')}>
                              {c.n}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-cyan-300 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mobile Live Property Activity Sheet (< lg) */}
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
    </div>
  );
}
