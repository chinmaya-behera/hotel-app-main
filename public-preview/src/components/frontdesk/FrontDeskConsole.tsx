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

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'stays', label: 'Stays', icon: UserCheck },
  { id: 'vip', label: 'VIP guests', icon: Crown },
  { id: 'rooms', label: 'Rooms', icon: BedDouble },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'lostfound', label: 'Lost & found', icon: PackageSearch },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'disputes', label: 'Dispute (Financial)', icon: Landmark },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert },
  { id: 'notifications', label: 'Notification', icon: BellRing },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'policies', label: 'Policies', icon: BookOpen },
];

export function FrontDeskConsole() {
  const { state } = useDemo();
  const [tab, setTab] = useState<TabId>('stays');
  const [reqCategory, setReqCategory] = useState<RequestCategory>('all');
  const [pill, setPill] = useState({ left: 0, width: 0 });
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
    { label: 'In house', value: inHouse.length, note: 'Guests with an active QR session', icon: KeyRound },
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

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
      {/* 1. Sticky/Fixed Numeric Overview KPI Row (5 evenly spaced cards) */}
      <div className="shrink-0 mb-2 sm:mb-2.5">
        <div className="fd-stagger grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={k.label} style={{ '--i': i } as CSSProperties} className="panel fd-spot p-2.5 sm:px-3.5 sm:py-2.5" {...spotlight}>
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
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 xl:gap-5 overflow-hidden">
        {/* Left Column: Horizontal Section Navigation Bar + Independently Scrollable Section Content */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Horizontal Section Navigation Bar (Sticky at top of content area) */}
          <div className="shrink-0 mb-2 sm:mb-2.5 flex items-center justify-between gap-3">
            <div className="fd-tabs flex-1 min-w-0 overflow-x-auto no-scrollbar" role="tablist" aria-label="Front Desk sections" onKeyDown={onKeyDown}>
              <span className="fd-tab-pill" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} aria-hidden />
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
                    className="fd-tab shrink-0"
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

          {/* Independently Scrollable Main Section Content Area */}
          <div className={cn("flex-1 min-h-0 pr-1 pb-2", tab === 'rooms' ? "flex flex-col overflow-hidden" : "overflow-y-auto space-y-4")}>
            <div key={tab} id={`fd-panel-${tab}`} role="tabpanel" aria-labelledby={`fd-tab-${tab}`} className={cn(swap, tab === 'rooms' && "flex-1 min-h-0 flex flex-col overflow-hidden")}>
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
          </div>
        </div>

        {/* Right Column: Sticky Recent Activity Sidebar (Reduced Width ~285px, Stretches Full Height) */}
        <div className="w-full lg:w-72 xl:w-[285px] shrink-0 h-full min-h-0 flex flex-col overflow-hidden">
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
    </div>
  );
}
