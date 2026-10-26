'use client';

import { useState } from 'react';
import { ArrowRightLeft, BedDouble, CircleAlert, CircleCheck, Folder, LogIn, LogOut, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { READINESS_TONE } from '@/components/frontdesk/RoomsPanel';
import {
  READINESS_LABEL,
  checkIn,
  checkInBlocker,
  checkOut,
  checkoutBlockers,
  decideEarlyCheckIn,
  moveRoom,
  openDisputeCount,
  settleBalance,
  stayBalance,
  verifyPreCheckIn,
} from '@/lib/frontDesk';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { StayRecord } from '@/types/demo';

type Filter = 'all' | 'arrivals' | 'inhouse' | 'departures' | 'checkedout';
type Dialog = { kind: 'verify' | 'checkout' | 'move'; stayId: string } | null;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'arrivals', label: 'Arrivals' },
  { id: 'inhouse', label: 'In house' },
  { id: 'departures', label: 'Departures' },
  { id: 'checkedout', label: 'Checked out' },
];

const MOVE_REASONS = ['AC or maintenance fault', 'Noise complaint', 'Guest-requested upgrade', 'Room not as booked', 'Safety concern'];

const ORDER: Record<StayRecord['status'], number> = { expected: 0, in_house: 1, checked_out: 2 };

export function StaysPanel() {
  const { state, fdAction } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  const stays = state.frontDesk.stays;
  const term = query.trim().toLowerCase();
  const rows = stays
    .filter((st) => {
      const text = `${st.guest} ${st.room} ${st.roomType}`.toLowerCase();
      if (term && !text.includes(term)) return false;
      if (filter === 'arrivals') return st.status === 'expected';
      if (filter === 'inhouse') return st.status === 'in_house';
      if (filter === 'departures') return st.status === 'in_house' && Boolean(st.departsToday);
      if (filter === 'checkedout') return st.status === 'checked_out';
      return true;
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const dialogStay = dialog ? stays.find((st) => st.id === dialog.stayId) : undefined;

  return (
    <Panel
      title="Stays"
      hint="Arrivals, in-house guests and departures"
      icon={UserCheck}
      action={
        <div className="relative w-full min-w-[12rem] sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" aria-hidden />
          <label htmlFor="stay-search" className="sr-only">
            Search guests or rooms
          </label>
          <input
            id="stay-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Guest or room"
            autoComplete="off"
            className="field w-full pl-9"
          />
        </div>
      }
    >
      <div role="group" aria-label="Filter stays" className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', filter === f.id ? 'chip-accent' : 'border-white/10 text-mist-300 hover:bg-white/5')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <BedDouble className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="text-sm text-mist-300">{term ? `No stays match “${query}”.` : 'No stays in this view.'}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((st) => (
            <StayRow key={st.id} stay={st} onDialog={(kind) => setDialog({ kind, stayId: st.id })} />
          ))}
        </ul>
      )}

      {dialog?.kind === 'verify' && dialogStay && (
        <VerifyDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            if (!fdAction('verifyPreCheckIn', [dialogStay.id])) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'checkout' && dialogStay && (
        <CheckoutDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onSettle={() => fdAction('settleBalance', [dialogStay.id])}
          onCheckout={() => {
            if (!fdAction('checkOut', [dialogStay.id])) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'move' && dialogStay && (
        <MoveDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onConfirm={(toRoom, reason) => {
            if (!fdAction('moveRoom', [dialogStay.id, toRoom, reason])) setDialog(null);
          }}
        />
      )}
    </Panel>
  );
}

function StayRow({ stay, onDialog }: { stay: StayRecord; onDialog: (kind: 'verify' | 'checkout' | 'move') => void }) {
  const { state, fdAction } = useDemo();
  const room = state.frontDesk.rooms.find((r) => r.no === stay.room);
  const blocker = stay.status === 'expected' ? checkInBlocker(state, stay) : null;
  const roomReady = Boolean(room && room.readiness === 'ready' && !room.occupied);
  const balance = stayBalance(state, stay);
  const disputes = openDisputeCount(state, stay.room);
  const early = stay.earlyCheckIn;

  return (
    <li className="work-row" data-priority={stay.vip ? 'vip' : 'normal'}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
            {stay.guest}
            {stay.vip && <Badge tone="accent">VIP</Badge>}
          </h3>
          <p className="mt-0.5 text-xs text-mist-400">
            Room {stay.room} · {stay.roomType} · {stay.nights} night{stay.nights === 1 ? '' : 's'} ·{' '}
            {stay.status === 'expected' ? `Arrives ${stay.arrival}` : stay.status === 'in_house' ? `Departs ${stay.departure}` : `Left ${stay.departure}`}
            {stay.movedFrom ? ` · Moved from ${stay.movedFrom}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stay.status === 'expected' && (
              <>
                <Badge tone="info">Arriving</Badge>
                <Badge tone={stay.preCheckIn === 'verified' ? 'success' : stay.preCheckIn === 'pending_verify' ? 'warning' : 'neutral'}>
                  {stay.preCheckIn === 'verified' ? 'Pre-check-in verified' : stay.preCheckIn === 'pending_verify' ? 'Pending staff verify' : 'No pre-check-in'}
                </Badge>
                <Badge tone={stay.idChecked ? 'success' : 'warning'}>{stay.idChecked ? 'ID verified' : 'ID check needed'}</Badge>
                {room && <Badge tone={READINESS_TONE[room.readiness]}>{`Room ${room.no}: ${READINESS_LABEL[room.readiness]}`}</Badge>}
                {early && (
                  <Badge tone={early.status === 'approved' ? 'success' : early.status === 'declined' ? 'neutral' : 'warning'}>
                    {early.status === 'pending' ? `Early check-in requested · ${money(early.fee)}` : early.status === 'approved' ? 'Early check-in approved' : 'Early check-in declined'}
                  </Badge>
                )}
              </>
            )}
            {stay.status === 'in_house' && (
              <>
                <Badge tone="success">In house</Badge>
                {stay.departsToday && <Badge tone="warning">Departing today</Badge>}
                <Badge tone={balance > 0 ? 'warning' : 'success'}>{balance > 0 ? `Balance ${money(balance)}` : 'Balance $0.00'}</Badge>
                {disputes > 0 && <Badge tone="danger">{`${disputes} open dispute${disputes === 1 ? '' : 's'}`}</Badge>}
                {room?.dnd && <Badge tone="warning">Do not disturb</Badge>}
              </>
            )}
            {stay.status === 'checked_out' && <Badge tone="neutral">Checked out</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stay.status === 'expected' && (
            <>
              {!stay.idChecked && (
                <Button size="sm" variant="ghost" iconLeft={ShieldCheck} onClick={() => onDialog('verify')}>
                  Verify ID
                </Button>
              )}
              {early?.status === 'pending' && (
                <>
                  <Button size="sm" variant="ghost" disabled={!roomReady} onClick={() => fdAction('decideEarlyCheckIn', [stay.id, true])}>
                    Approve early · {money(early.fee)}
                  </Button>
                  <Button size="sm" variant="subtle" onClick={() => fdAction('decideEarlyCheckIn', [stay.id, false])}>
                    Decline early
                  </Button>
                </>
              )}
              <Button size="sm" variant="accent" iconLeft={LogIn} disabled={blocker !== null} onClick={() => fdAction('checkIn', [stay.id])}>
                Check in
              </Button>
            </>
          )}
          {stay.status === 'in_house' && (
            <>
              <Button size="sm" variant="ghost" iconLeft={ArrowRightLeft} onClick={() => onDialog('move')}>
                Move room
              </Button>
              <Button size="sm" variant="accent" iconLeft={LogOut} onClick={() => onDialog('checkout')}>
                Folio & checkout
              </Button>
            </>
          )}
        </div>
      </div>

      {stay.status === 'expected' && (blocker || (early?.status === 'pending' && !roomReady)) && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {blocker ?? `Room ${stay.room} is not inspected and ready, so early check-in cannot be approved yet.`}
        </p>
      )}
    </li>
  );
}

function VerifyDialog({ stay, onClose, onConfirm }: { stay: StayRecord; onClose: () => void; onConfirm: () => void }) {
  const [matches, setMatches] = useState(false);
  return (
    <Modal
      title={`Verify ${stay.guest}`}
      description="Pre-arrival registration (F08): the guest's arrival time, ID photo and signature are checked by staff."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" disabled={!matches} onClick={onConfirm} iconLeft={CircleCheck}>
            Confirm verification
          </Button>
        </>
      }
    >
      <ul className="space-y-2 text-sm text-mist-200">
        <li className="flex items-center gap-2">
          <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> Arrival time submitted · {stay.arrival}
        </li>
        <li className="flex items-center gap-2">
          <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> ID photo on file (encrypted, simulated)
        </li>
        <li className="flex items-center gap-2">
          <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> Signature and consent recorded
        </li>
      </ul>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-mist-200">
        <input type="checkbox" checked={matches} onChange={(e) => setMatches(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>The ID matches the guest booking and the person in front of me.</span>
      </label>
    </Modal>
  );
}

function CheckoutDialog({
  stay,
  onClose,
  onSettle,
  onCheckout,
}: {
  stay: StayRecord;
  onClose: () => void;
  onSettle: () => void;
  onCheckout: () => void;
}) {
  const { state } = useDemo();
  const lines = state.folios[stay.room] ?? [];
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const balance = stayBalance(state, stay);
  const blockers = checkoutBlockers(state, stay);
  const disputes = openDisputeCount(state, stay.room);

  return (
    <Modal
      title={`Checkout · Room ${stay.room}`}
      description={`${stay.guest}. Digital checkout needs a $0 balance and no open disputes (F34).`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          {balance > 0 && (
            <Button variant="ghost" onClick={onSettle} iconLeft={Folder}>
              Collect {money(balance)} · card {stay.cardMask}
            </Button>
          )}
          <Button variant="accent" iconLeft={LogOut} disabled={blockers.length > 0} onClick={onCheckout}>
            Check out and revoke QR session
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-white/[0.08] rounded-xl border border-white/10 text-sm">
        {lines.length === 0 && <li className="px-3 py-3 text-mist-400">No charges on this folio.</li>}
        {lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0 text-mist-200">
              {l.label}
              {l.disputed && <span className="ml-2 align-middle"><Badge tone="warning">Disputed</Badge></span>}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-white">{money(l.amount)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Charges</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{money(total)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Paid</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{money(stay.paid)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Balance</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{money(balance)}</dd>
        </div>
      </dl>
      <ul className="space-y-1.5 text-sm" aria-label="Checkout checklist">
        <li className="flex items-center gap-2 text-mist-200">
          {balance <= 0 ? <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> : <CircleAlert className="h-4 w-4 text-amber-400" aria-hidden />}
          {balance <= 0 ? 'Balance is $0.00' : `Balance of ${money(balance)} outstanding`}
        </li>
        <li className="flex items-center gap-2 text-mist-200">
          {disputes === 0 ? <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> : <CircleAlert className="h-4 w-4 text-amber-400" aria-hidden />}
          {disputes === 0 ? 'No open folio disputes' : `${disputes} dispute${disputes === 1 ? '' : 's'} waiting on Finance`}
        </li>
      </ul>
      <p className="text-[11px] text-mist-400">Cards appear only as masked tokens. Collecting payment here is simulated; no real processor is involved.</p>
    </Modal>
  );
}

function MoveDialog({ stay, onClose, onConfirm }: { stay: StayRecord; onClose: () => void; onConfirm: (toRoom: string, reason: string) => void }) {
  const { state } = useDemo();
  const reserved = new Set(state.frontDesk.stays.filter((st) => st.status === 'expected').map((st) => st.room));
  const candidates = state.frontDesk.rooms.filter((r) => !r.occupied && r.readiness === 'ready' && !r.dnd && r.no !== stay.room && !reserved.has(r.no));
  const [toRoom, setToRoom] = useState(candidates[0]?.no ?? '');
  const [reason, setReason] = useState(MOVE_REASONS[0]);

  return (
    <Modal
      title={`Move ${stay.guest}`}
      description={`Currently in Room ${stay.room}. Only vacant, inspected rooms can be assigned.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={ArrowRightLeft} disabled={!toRoom} onClick={() => onConfirm(toRoom, reason)}>
            Confirm move
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-mist-300">
          No vacant, inspected rooms are available right now. Check the Rooms tab.
        </p>
      ) : (
        <>
          <div>
            <FieldLabel htmlFor="move-room">New room</FieldLabel>
            <select id="move-room" value={toRoom} onChange={(e) => setToRoom(e.target.value)} className="field w-full">
              {candidates.map((r) => (
                <option key={r.no} value={r.no}>
                  Room {r.no} · Floor {r.floor}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="move-reason">Reason</FieldLabel>
            <select id="move-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="field w-full">
              {MOVE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-mist-400">
            The old room's guest QR session is revoked immediately, the folio and open requests move with the guest, and Housekeeping receives a turnover task.
          </p>
        </>
      )}
    </Modal>
  );
}
