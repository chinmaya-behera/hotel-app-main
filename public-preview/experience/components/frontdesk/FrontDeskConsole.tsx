'use client';

import './frontdesk.css';
import {RoomAccess} from '@/components/shared/RoomAccess';
import { useLayoutEffect, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  Activity,
  BedDouble,
  CircleHelp,
  HeartHandshake,
  Hand,
  Inbox,
  KeyRound,
  Landmark,
  LockKeyhole,
  LogIn,
  LogOut,
  PackageSearch,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FeedList } from '@/components/shared/FeedList';
import { LostFoundManager } from '@/components/staff/LostFoundManager';
import { ComplaintsPanel } from '@/components/frontdesk/ComplaintsPanel';
import { ReconcilePanel } from '@/components/frontdesk/ReconcilePanel';
import { RequestsPanel, isDone, needsAction, type RequestCategory } from '@/components/frontdesk/RequestsPanel';
import { RoomsPanel } from '@/components/frontdesk/RoomsPanel';
import { StaysPanel } from '@/components/frontdesk/StaysPanel';
import { CountUp, spotlight } from '@/lib/gestures';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

type TabId = 'access' | 'stays' | 'requests' | 'rooms' | 'recovery' | 'reconcile' | 'lostfound';

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
 {id:'access',label:'Guest access',icon:KeyRound},
  { id: 'stays', label: 'Stays', icon: UserCheck },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'rooms', label: 'Rooms', icon: BedDouble },
  { id: 'recovery', label: 'Recovery', icon: HeartHandshake },
  { id: 'reconcile', label: 'Reconcile', icon: Landmark },
  { id: 'lostfound', label: 'Lost & found', icon: PackageSearch },
];

export function FrontDeskConsole() {
  const { state } = useDemo();
  const [tab, setTab] = useState<TabId>('stays');
  const [reqCategory, setReqCategory] = useState<RequestCategory>('all');
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const prev = useRef(0);

  const { stays, rooms, sync, complaints } = state.frontDesk;
  const queue = state.items.front_desk_coordinator;
  const arrivals = stays.filter((st) => st.status === 'expected');
  const inHouse = stays.filter((st) => st.status === 'in_house');
  const departing = inHouse.filter((st) => st.departsToday);
  const actionable = queue.filter(needsAction);
  const readyRooms = rooms.filter((r) => !r.occupied && r.readiness === 'ready');
  const failedSync = sync.filter((x) => x.bookingState === 'PMS_Sync_Failed');
  const creditsWaiting = complaints.filter((c) => c.comp > 0 && !c.compApplied);
  const claims = queue.filter((i) => i.category === 'lost_found' && !isDone(i));

  const counts: Record<TabId, { n: number; alert: boolean }> = {
 access:{n:inHouse.length,alert:false},
    stays: { n: arrivals.length, alert: arrivals.some((a) => !a.idChecked) },
    requests: { n: actionable.length, alert: actionable.length > 0 },
    rooms: { n: rooms.filter((r) => r.readiness === 'inspection_pending' || r.readiness === 'inspection_failed').length, alert: false },
    recovery: { n: creditsWaiting.length, alert: creditsWaiting.length > 0 },
    reconcile: { n: failedSync.length, alert: failedSync.length > 0 },
    lostfound: { n: claims.length, alert: claims.length > 0 },
  };

  const kpis: Array<{ label: string; value: number; note: string; icon: LucideIcon }> = [
    { label: 'Arrivals expected', value: arrivals.length, note: `${arrivals.filter((a) => !a.idChecked).length} need ID check`, icon: LogIn },
    { label: 'In house', value: inHouse.length, note: 'Guests with an active QR session', icon: KeyRound },
    { label: 'Departing today', value: departing.length, note: 'Folio and checkout checks', icon: LogOut },
    { label: 'Needs action', value: actionable.length, note: 'Portal requests and cases', icon: Inbox },
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
  }, [tab, counts.requests.n, counts.stays.n, counts.recovery.n, counts.reconcile.n, counts.lostfound.n, counts.rooms.n]);

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

  const [showGestureModal, setShowGestureModal] = useState(false);

  return (
    <>
      {/* KPI Cards Strip */}
      <div className="fd-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ '--i': i } as CSSProperties} className="panel fd-spot p-4" {...spotlight}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-mist-300">{k.label}</p>
                <span className="accent-soft grid h-8 w-8 place-items-center rounded-lg">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                <CountUp value={k.value} />
              </p>
              <p className="mt-0.5 text-[11px] text-mist-400">{k.note}</p>
            </div>
          );
        })}
      </div>

      {/* Main Workspace Layout: Expanded 2-Column Desktop Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(320px,1fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="fd-tabs" role="tablist" aria-label="Front Desk sections" onKeyDown={onKeyDown}>
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
                  className="fd-tab"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t.label}
                  {c.n > 0 && (
                    <span className="fd-tab-count" data-alert={c.alert} aria-label={`${c.n} pending`}>
                      {c.n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowGestureModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition shadow-sm"
            aria-label="Open gesture guide and keyboard shortcut instructions"
          >
            <Hand className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            <span>Gesture Guide</span>
          </button>
        </div>

          <div key={tab} id={`fd-panel-${tab}`} role="tabpanel" aria-labelledby={`fd-tab-${tab}`} className={cn('mt-4', swap)}>
            {tab === 'access' && <RoomAccess/>}
{tab === 'stays' && <StaysPanel />}
            {tab === 'requests' && <RequestsPanel initialCategory={reqCategory} />}
            {tab === 'rooms' && <RoomsPanel />}
            {tab === 'recovery' && <ComplaintsPanel />}
            {tab === 'reconcile' && <ReconcilePanel />}
            {tab === 'lostfound' && (
              <div className="space-y-4">
                <LostFoundManager title="Log a found item" hint="Sensitive items never show a photo to guests" icon={PackageSearch} />
                <Panel title="Guest claims" hint="Release only after an in-person ID check" icon={PackageSearch}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-mist-200">
                      {claims.length === 0 ? 'No open claims from the Guest Portal.' : `${claims.length} open claim${claims.length === 1 ? '' : 's'} from guests.`}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReqCategory('lost_found');
                        setTab('requests');
                      }}
                    >
                      Open claims in Requests
                    </Button>
                  </div>
                </Panel>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="Recent activity" hint="Property activity log" icon={Activity}>
            <FeedList limit={8} />
          </Panel>
        </div>
      </div>

      {/* Contextual Gesture Guide Modal */}
      {showGestureModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gesture-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                  <Hand className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="gesture-modal-title" className="text-base font-bold font-display text-white">
                    Gesture & Keyboard Shortcuts
                  </h2>
                  <p className="text-xs text-mist-400">Contextual navigation and touch gestures</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGestureModal(false)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-3 text-xs text-mist-200">
              <li className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <kbd className="kbd shrink-0 font-mono text-amber-300">Swipe →</kbd>
                <span>Advance request to next lifecycle status (Review, Confirm, Complete)</span>
              </li>
              <li className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <kbd className="kbd shrink-0 font-mono text-amber-300">← Swipe</kbd>
                <span>Instantly escalate complex guest cases to the Duty Manager</span>
              </li>
              <li className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <kbd className="kbd shrink-0 font-mono text-amber-300">Hold</kbd>
                <span>Press and hold sensitive confirmation buttons (checkout, payment reconciliation)</span>
              </li>
              <li className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <kbd className="kbd shrink-0 font-mono text-amber-300">Tap Tile</kbd>
                <span>Click any room tile to inspect occupancy, cleanliness, or issue an OOO block request</span>
              </li>
              <li className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <kbd className="kbd shrink-0 font-mono text-amber-300">← → Keys</kbd>
                <span>Arrow keys move between operational sections (Stays, Requests, Rooms, Recovery)</span>
              </li>
            </ul>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGestureModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
