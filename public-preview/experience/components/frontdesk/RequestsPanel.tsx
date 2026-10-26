'use client';

import { useState, type CSSProperties } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Ban,
  CircleCheck,
  ClipboardPlus,
  Eye,
  Inbox,
  Route,
  Search,
  Send,
  Siren,
  ThumbsDown,
  ThumbsUp,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { HoldButton, SwipeRow, type SwipeSide } from '@/lib/gestures';
import {
  REQUEST_DONE,
  ROUTE_LABEL,
  captureCase,
  escalateRequest,
  requestStep,
  routeRequest,
  type RequestStep,
  type RouteDept,
} from '@/lib/frontDesk';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import type { WorkItem } from '@/types/demo';

export type RequestCategory = 'all' | 'concierge' | 'case' | 'lost_found';

type View = 'action' | 'guest' | 'done' | 'all';
type Dialog =
  | { kind: 'quote' | 'cancel' | 'route' | 'close' | 'detail'; id: string }
  | { kind: 'new' }
  | null;

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'action', label: 'Needs action' },
  { id: 'guest', label: 'Awaiting guest' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];

const CATEGORIES: Array<{ id: RequestCategory; label: string }> = [
  { id: 'all', label: 'Everything' },
  { id: 'concierge', label: 'Concierge' },
  { id: 'case', label: 'Guest cases' },
  { id: 'lost_found', label: 'Lost & found' },
];

const CANCEL_REASONS = ['Not available at that time', 'Service is not offered', 'Guest could not be reached', 'Duplicate of another request'];

export const isDone = (i: WorkItem) => REQUEST_DONE.includes(i.status);
export const needsAction = (i: WorkItem) => !isDone(i) && i.status !== 'Awaiting guest';

function categoryOf(i: WorkItem): RequestCategory {
  if (i.category === 'lost_found') return 'lost_found';
  if (i.category === 'concierge') return 'concierge';
  return 'case';
}

const CATEGORY_LABEL: Record<RequestCategory, string> = {
  all: 'Request',
  concierge: 'Concierge',
  case: 'Guest case',
  lost_found: 'Lost & found',
};

export function RequestsPanel({ initialCategory = 'all' }: { initialCategory?: RequestCategory }) {
  const { state, fdAction } = useDemo();
  const [view, setView] = useState<View>('action');
  const [category, setCategory] = useState<RequestCategory>(initialCategory);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  const all = state.items.front_desk_coordinator;
  const counts: Record<View, number> = {
    action: all.filter(needsAction).length,
    guest: all.filter((i) => i.status === 'Awaiting guest').length,
    done: all.filter(isDone).length,
    all: all.length,
  };
  const term = query.trim().toLowerCase();
  const rows = all.filter((i) => {
    if (view === 'action' && !needsAction(i)) return false;
    if (view === 'guest' && i.status !== 'Awaiting guest') return false;
    if (view === 'done' && !isDone(i)) return false;
    if (category !== 'all' && categoryOf(i) !== category) return false;
    if (term && !`${i.title} ${i.meta} ${i.ref ?? ''} ${i.room ?? ''}`.toLowerCase().includes(term)) return false;
    return true;
  });

  const run = (id: string, step: RequestStep) => fdAction('requestStep', [id, step]);
  const escalate = (id: string) => fdAction('escalateRequest', [id]);
  const dialogItem = dialog && 'id' in dialog ? all.find((i) => i.id === dialog.id) : undefined;

  return (
    <Panel
      title="Guest requests and cases"
      hint="Portal requests land here automatically. Swipe a card or use its buttons."
      icon={Inbox}
      action={
        <Button size="sm" variant="accent" iconLeft={ClipboardPlus} onClick={() => setDialog({ kind: 'new' })}>
          New case
        </Button>
      }
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by status" className="flex rounded-xl border border-white/10 bg-black/20 p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', view === v.id ? 'accent-soft' : 'text-mist-400 hover:text-white')}
            >
              {v.label} <span className="tabular-nums opacity-70">{counts[v.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" aria-hidden />
          <label htmlFor="req-search" className="sr-only">
            Search requests
          </label>
          <input id="req-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Room, guest or reference" autoComplete="off" className="field w-full pl-9" />
        </div>
      </div>

      <div role="group" aria-label="Filter by type" className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', category === c.id ? 'chip-accent' : 'border-white/10 text-mist-300 hover:bg-white/5')}
          >
            {c.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <Inbox className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="text-sm text-mist-300">
            {term ? `Nothing matches “${query}”.` : view === 'action' ? 'All caught up. New guest requests will appear here.' : 'Nothing in this view.'}
          </p>
        </div>
      ) : (
        <ul key={`${view}-${category}`} className="fd-stagger space-y-3">
          {rows.map((item, i) => (
            <li key={item.id} style={{ '--i': Math.min(i, 8) } as CSSProperties}>
              <RequestCard
                item={item}
                onStep={(step) => run(item.id, step)}
                onEscalate={() => escalate(item.id)}
                onDialog={(kind) => setDialog({ kind, id: item.id })}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog?.kind === 'new' && <NewCaseDialog onClose={() => setDialog(null)} />}
      {dialog && dialog.kind !== 'new' && dialogItem && dialog.kind === 'quote' && <QuoteDialog item={dialogItem} onClose={() => setDialog(null)} />}
      {dialog && dialog.kind !== 'new' && dialogItem && dialog.kind === 'cancel' && <CancelDialog item={dialogItem} onClose={() => setDialog(null)} />}
      {dialog && dialog.kind !== 'new' && dialogItem && dialog.kind === 'route' && <RouteDialog item={dialogItem} onClose={() => setDialog(null)} />}
      {dialog && dialog.kind !== 'new' && dialogItem && dialog.kind === 'close' && <CloseDialog item={dialogItem} onClose={() => setDialog(null)} />}
      {dialog && dialog.kind !== 'new' && dialogItem && dialog.kind === 'detail' && <DetailDialog item={dialogItem} onClose={() => setDialog(null)} />}
    </Panel>
  );
}

/* --------------------------------------------------------------------- */

interface CardProps {
  item: WorkItem;
  onStep: (step: RequestStep) => string | null;
  onEscalate: () => string | null;
  onDialog: (kind: 'quote' | 'cancel' | 'route' | 'close' | 'detail') => void;
}

function RequestCard({ item, onStep, onEscalate, onDialog }: CardProps) {
  const done = isDone(item);
  const escalated = item.chip === 'Escalated to Duty Manager';
  const isLf = item.category === 'lost_found';
  const canRoute = !done && !item.routedTo && !isLf;

  /** the one-tap "next sensible step" for this status; also bound to swipe right */
  let primary: (SwipeSide & { variant: 'accent' | 'ghost' }) | undefined;
  if (item.status === 'Received') primary = { label: 'Start review', icon: Eye, variant: 'accent', run: () => void onStep({ kind: 'review' }) };
  else if (item.status === 'Acknowledged') primary = { label: 'Confirm', icon: BadgeCheck, variant: 'accent', run: () => void onStep({ kind: 'confirm' }) };
  else if (item.status === 'In progress') primary = { label: 'Mark complete', icon: CircleCheck, variant: 'accent', run: () => void onStep({ kind: 'complete' }) };
  else if (item.status === 'Open') primary = { label: 'Close case', icon: CircleCheck, variant: 'accent', run: () => (isLf ? onDialog('close') : void onStep({ kind: 'close' })) };

  const escalateSide: SwipeSide | undefined =
    done || escalated ? undefined : { label: 'Escalate to Duty Manager', icon: Siren, run: () => void onEscalate() };

  return (
    <SwipeRow right={primary} left={escalateSide}>
      <div className="work-row" data-priority={item.priority ?? 'normal'}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-0.5 text-xs text-mist-400">{item.meta}</p>
            {item.description && <p className="mt-1 text-xs text-mist-300">{item.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              <Badge icon={false}>{CATEGORY_LABEL[categoryOf(item)]}</Badge>
              {item.priority === 'vip' && <Badge tone="accent">VIP</Badge>}
              {item.ref && <Badge icon={false}>{item.ref}</Badge>}
              {item.chip && <Badge tone={item.tone ?? 'neutral'}>{item.chip}</Badge>}
              {item.fee !== undefined && item.fee > 0 && <Badge icon={false}>{money(item.fee)}</Badge>}
              {item.routedTo && <Badge tone="info">{`Routed · ${item.routedTo}`}</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {primary && (
              <Button size="sm" variant={primary.variant} iconLeft={primary.icon} onClick={primary.run}>
                {primary.label}
              </Button>
            )}
            {(item.status === 'Received' || item.status === 'Acknowledged') && (
              <>
                {item.status === 'Received' && (
                  <Button size="sm" variant="ghost" iconLeft={BadgeCheck} onClick={() => onStep({ kind: 'confirm' })}>
                    Confirm
                  </Button>
                )}
                <Button size="sm" variant="ghost" iconLeft={Wallet} onClick={() => onDialog('quote')}>
                  Quote price
                </Button>
                <Button size="sm" variant="ghost" iconLeft={Ban} onClick={() => onDialog('cancel')}>
                  Not available
                </Button>
              </>
            )}
            {item.status === 'Awaiting guest' && (
              <>
                <Button size="sm" variant="accent" iconLeft={ThumbsUp} onClick={() => onStep({ kind: 'accepted' })}>
                  Guest accepts
                </Button>
                <Button size="sm" variant="ghost" iconLeft={ThumbsDown} onClick={() => onStep({ kind: 'declined' })}>
                  Guest declines
                </Button>
              </>
            )}
            {canRoute && (
              <Button size="sm" variant="ghost" iconLeft={Route} onClick={() => onDialog('route')}>
                Route
              </Button>
            )}
            {!done && !escalated && (
              <HoldButton variant="ghost" iconLeft={Siren} onConfirm={() => void onEscalate()}>
                Escalate
              </HoldButton>
            )}
            <Button size="sm" variant="subtle" iconLeft={ArrowUpRight} onClick={() => onDialog('detail')} aria-label={`Details for ${item.title}`}>
              Details
            </Button>
          </div>
        </div>
        {item.status === 'Awaiting guest' && <p className="mt-2 text-[11px] text-mist-400">Guest responses are simulated in this prototype; the buttons stand in for the guest tapping accept or decline.</p>}
      </div>
    </SwipeRow>
  );
}

/* --------------------------------------------------------------------- */
/* Dialogs                                                               */
/* --------------------------------------------------------------------- */

function QuoteDialog({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const { fdAction } = useDemo();
  const [fee, setFee] = useState('0');
  const [terms, setTerms] = useState('');
  const [error, setError] = useState<string | null>(null);

  function send() {
    const err = fdAction('requestStep', [item.id, { kind: 'quote', fee: Number(fee), terms }]);
    if (err) setError(err);
    else onClose();
  }

  return (
    <Modal
      title="Send price and terms"
      description={`${item.title}. The fee is posted to the folio only after the guest accepts.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={Send} onClick={send}>
            Send to guest
          </Button>
        </>
      }
    >
      <div>
        <FieldLabel htmlFor="quote-fee">Price (USD, 0 if free)</FieldLabel>
        <input id="quote-fee" type="number" min={0} step="0.01" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} className="field w-full" />
      </div>
      <div>
        <FieldLabel htmlFor="quote-terms">Terms the guest agrees to</FieldLabel>
        <textarea id="quote-terms" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. Late checkout until 15:00, charged per hour after 12:00" className="field w-full" />
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </Modal>
  );
}

function CancelDialog({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const { fdAction } = useDemo();
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  return (
    <Modal
      title="Not available"
      description={`${item.title}. The guest is told why and offered alternatives.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Back
          </Button>
          <Button
            variant="danger"
            iconLeft={Ban}
            onClick={() => {
              if (!fdAction('requestStep', [item.id, { kind: 'cancel', reason }])) onClose();
            }}
          >
            Cancel request
          </Button>
        </>
      }
    >
      <div>
        <FieldLabel htmlFor="cancel-reason">Reason shown to the guest</FieldLabel>
        <select id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="field w-full">
          {CANCEL_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
}

function RouteDialog({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const { fdAction } = useDemo();
  const depts = Object.keys(ROUTE_LABEL) as RouteDept[];
  const [dept, setDept] = useState<RouteDept>(depts[0]);
  return (
    <Modal
      title="Route to a department"
      description="Front Desk stays the case owner. The department gets a task with the original timestamp and SLA clock."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            iconLeft={Route}
            onClick={() => {
              if (!fdAction('routeRequest', [item.id, dept])) onClose();
            }}
          >
            Route task
          </Button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">Department</legend>
        {depts.map((d) => (
          <label key={d} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition', dept === d ? 'border-white/30 bg-white/[0.07]' : 'border-white/10 hover:bg-white/[0.04]')}>
            <input type="radio" name="dept" checked={dept === d} onChange={() => setDept(d)} className="h-4 w-4" />
            <span className="text-mist-100">{ROUTE_LABEL[d]}</span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}

function CloseDialog({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const { fdAction } = useDemo();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal
      title="Release found item"
      description={`${item.title}. Items are only released after an in-person ID check.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            iconLeft={CircleCheck}
            onClick={() => {
              const err = fdAction('requestStep', [item.id, { kind: 'close', idVerified: verified }]);
              if (err) setError(err);
              else onClose();
            }}
          >
            Release and close
          </Button>
        </>
      }
    >
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-mist-200">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>I checked a photo ID in person and it matches the guest who claimed this item.</span>
      </label>
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </Modal>
  );
}

function DetailDialog({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const history = item.history ?? [];
  return (
    <Modal title={item.title} description={item.meta} onClose={onClose} footer={<Button variant="subtle" onClick={onClose}>Close</Button>}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {[
          ['Reference', item.ref ?? 'Not assigned'],
          ['Status', item.status],
          ['Room', item.room ?? 'None'],
          ['Case owner', item.owner ?? 'Front Desk'],
          ['Received', item.createdAt ?? 'Unknown'],
          ['Routed to', item.routedTo ?? 'Not routed'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-mist-400">{k}</dt>
            <dd className="font-medium text-white">{v}</dd>
          </div>
        ))}
      </dl>
      {item.description && <p className="rounded-lg border border-white/10 px-3 py-2 text-sm text-mist-200">{item.description}</p>}
      <div>
        <h3 className="eyebrow mb-2">Timeline</h3>
        {history.length === 0 ? (
          <p className="text-xs text-mist-400">No history yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-white/15 pl-4">
            {history.map((h, idx) => (
              <li key={`${h.at}-${idx}`} className="relative">
                <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full border border-white/30 bg-ink-800" aria-hidden />
                <p className="text-sm font-medium text-white">
                  {h.status} <span className="text-xs font-normal text-mist-400">· {h.at}</span>
                </p>
                {h.note && <p className="text-xs text-mist-300">{h.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
}

function NewCaseDialog({ onClose }: { onClose: () => void }) {
  const { state, fdAction } = useDemo();
  const inHouse = state.frontDesk.stays.filter((st) => st.status === 'in_house');
  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<'Phone' | 'Walk-in' | 'Email'>('Walk-in');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestOk = guest.trim().length >= 2;
  const titleOk = title.trim().length >= 3;

  function pickRoom(no: string) {
    setRoom(no);
    const stay = inHouse.find((st) => st.room === no);
    if (stay && guest.trim().length === 0) setGuest(stay.guest);
  }

  function submit() {
    setTried(true);
    if (!guestOk || !titleOk) return;
    const err = fdAction('captureCase', [{ guest, room: room || undefined, title, channel, note }]);
    if (err) setError(err);
    else onClose();
  }

  return (
    <Modal
      title="Capture a guest case"
      description="Phone calls and walk-ins. Front Desk is the accountable owner until it is closed."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={ClipboardPlus} onClick={submit}>
            Open case
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="case-room">Room (optional)</FieldLabel>
          <select id="case-room" value={room} onChange={(e) => pickRoom(e.target.value)} className="field w-full">
            <option value="">No room</option>
            {inHouse.map((st) => (
              <option key={st.id} value={st.room}>
                {st.room} · {st.guest}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="case-channel">Channel</FieldLabel>
          <select id="case-channel" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="field w-full">
            <option>Walk-in</option>
            <option>Phone</option>
            <option>Email</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="case-guest">Guest name</FieldLabel>
        <input id="case-guest" value={guest} onChange={(e) => setGuest(e.target.value)} className="field w-full" aria-invalid={tried && !guestOk} />
        {tried && !guestOk && <p className="mt-1 text-xs text-rose-400">Enter the guest name.</p>}
      </div>
      <div>
        <FieldLabel htmlFor="case-title">What is the case about?</FieldLabel>
        <input id="case-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Needs an extra key card" className="field w-full" aria-invalid={tried && !titleOk} />
        {tried && !titleOk && <p className="mt-1 text-xs text-rose-400">Describe the case in a few words.</p>}
      </div>
      <div>
        <FieldLabel htmlFor="case-note">Note (optional)</FieldLabel>
        <textarea id="case-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="field w-full" />
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </Modal>
  );
}
