'use client';

import { useState } from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  BedDouble,
  CircleAlert,
  CircleCheck,
  Folder,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Wifi,
  Clock,
  KeyRound,
} from 'lucide-react';
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
type Dialog = { kind: 'verify' | 'checkout' | 'move' | 'livepass'; stayId: string } | null;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All (Booked)' },
  { id: 'arrivals', label: 'Arrivals (Check In)' },
  { id: 'inhouse', label: 'In House' },
  { id: 'departures', label: 'Departures (Check Out)' },
  { id: 'checkedout', label: 'Post Departure' },
];

const MOVE_REASONS = ['AC or maintenance fault', 'Noise complaint', 'Guest-requested upgrade', 'Room not as booked', 'Safety concern'];

const ORDER: Record<StayRecord['status'], number> = { expected: 0, in_house: 1, checked_out: 2 };

export function StaysPanel() {
  const { state, fdAction } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  const stays = state.frontDesk?.stays ?? [];
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
            if (!fdAction((s) => verifyPreCheckIn(s, dialogStay.id))) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'checkout' && dialogStay && (
        <CheckoutDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onSettle={() => fdAction((s) => settleBalance(s, dialogStay.id))}
          onCheckout={() => {
            if (!fdAction((s) => checkOut(s, dialogStay.id))) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'move' && dialogStay && (
        <MoveDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
          onConfirm={(toRoom, reason) => {
            if (!fdAction((s) => moveRoom(s, dialogStay.id, toRoom, reason))) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'livepass' && dialogStay && (
        <LivePassDialog
          stay={dialogStay}
          onClose={() => setDialog(null)}
        />
      )}
    </Panel>
  );
}

function StayRow({ stay, onDialog }: { stay: StayRecord; onDialog: (kind: 'verify' | 'checkout' | 'move' | 'livepass') => void }) {
  const { state, fdAction } = useDemo();
  const [cleanerAssigned, setCleanerAssigned] = useState(false);
  const room = (state.frontDesk?.rooms ?? []).find((r) => r.no === stay.room);
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
            {stay.status === 'checked_out' && (
              <>
                <Badge tone="neutral">Checked out</Badge>
                {cleanerAssigned ? (
                  <Badge tone="success">Turnover assigned · Vikram S.</Badge>
                ) : (
                  <Badge tone="warning">Turnover pending · Needs HK</Badge>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stay.status === 'expected' && (
            <>
              <Button size="sm" variant="subtle" iconLeft={Smartphone} onClick={() => onDialog('livepass')}>
                Live Pass
              </Button>
              {!stay.idChecked && (
                <Button size="sm" variant="ghost" iconLeft={ShieldCheck} onClick={() => onDialog('verify')}>
                  Verify ID
                </Button>
              )}
              {early?.status === 'pending' && (
                <>
                  <Button size="sm" variant="ghost" disabled={!roomReady} onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, true))}>
                    Approve early · {money(early.fee)}
                  </Button>
                  <Button size="sm" variant="subtle" onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, false))}>
                    Decline early
                  </Button>
                </>
              )}
              <Button size="sm" variant="accent" iconLeft={LogIn} disabled={blocker !== null} onClick={() => fdAction((s) => checkIn(s, stay.id))}>
                Check in
              </Button>
            </>
          )}
          {stay.status === 'in_house' && (
            <>
              <Button size="sm" variant="subtle" iconLeft={Smartphone} onClick={() => onDialog('livepass')}>
                Live Pass
              </Button>
              <Button size="sm" variant="ghost" iconLeft={ArrowRightLeft} onClick={() => onDialog('move')}>
                Move room
              </Button>
              <Button size="sm" variant="accent" iconLeft={LogOut} onClick={() => onDialog('checkout')}>
                Folio & checkout
              </Button>
            </>
          )}
          {stay.status === 'checked_out' && (
            <>
              <Button size="sm" variant="subtle" iconLeft={Smartphone} onClick={() => onDialog('livepass')}>
                Live Pass
              </Button>
              <Button
                size="sm"
                variant={cleanerAssigned ? 'ghost' : 'accent'}
                iconLeft={Sparkles}
                disabled={cleanerAssigned}
                onClick={() => {
                  setCleanerAssigned(true);
                  if (fdAction) {
                    fdAction((s) => {
                      const r = s.frontDesk?.rooms.find((rm) => rm.no === stay.room);
                      if (r) {
                        r.readiness = 'cleaning';
                        r.note = 'Housekeeping turnover assigned by Front Desk';
                      }
                      return { next: s, message: 'Cleaner assigned' };
                    });
                  }
                }}
              >
                {cleanerAssigned ? 'Cleaner Assigned' : 'Assign Cleaner (Housekeeping)'}
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
  const reserved = new Set((state.frontDesk?.stays ?? []).filter((st) => st.status === 'expected').map((st) => st.room));
  const candidates = (state.frontDesk?.rooms ?? []).filter((r) => !r.occupied && r.readiness === 'ready' && !r.dnd && r.no !== stay.room && !reserved.has(r.no));
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

function LivePassDialog({ stay, onClose }: { stay: StayRecord; onClose: () => void }) {
  const [simulatedTime, setSimulatedTime] = useState<'arrival' | 'midstay' | 'checkout_morning' | 'checkout_expired' | 'custom'>('midstay');
  const [customDateTime, setCustomDateTime] = useState('2026-10-31T12:00');

  const getPassDetails = () => {
    switch (simulatedTime) {
      case 'arrival':
        return {
          status: stay.status === 'expected' ? 'pre_checkin' : 'active',
          label: stay.status === 'expected' ? 'Pre-Arrival · Room Access Pending Check-In' : 'Active · Room Access Granted',
          tone: stay.status === 'expected' ? 'info' : 'success',
          timeDesc: 'Day of Arrival (15:00 Check-In)',
          nfcStatus: stay.status === 'expected' ? 'Encrypted · Inactive until ID verification' : 'NFC Active & Transmitting',
          validUntil: `${stay.departure} 11:00`,
        };
      case 'midstay':
        return {
          status: 'active',
          label: 'Active · Room Key NFC Valid',
          tone: 'success',
          timeDesc: 'Mid-Stay (Evening Access Window)',
          nfcStatus: 'NFC Active · BLE Token Valid',
          validUntil: `${stay.departure} 11:00`,
        };
      case 'checkout_morning':
        return {
          status: 'checkout_due',
          label: 'Departure Day · Checkout in 2 Hours',
          tone: 'warning',
          timeDesc: `${stay.departure} 09:00`,
          nfcStatus: 'NFC Active · Auto-revocation at 11:00',
          validUntil: `${stay.departure} 11:00`,
        };
      case 'checkout_expired':
        return {
          status: 'expired',
          label: 'Expired · Room Access Revoked',
          tone: 'danger',
          timeDesc: `${stay.departure} 14:30 (Past checkout)`,
          nfcStatus: 'Revoked · QR Token Terminated',
          validUntil: 'Expired',
        };
      case 'custom':
        return {
          status: 'active',
          label: `Custom Time · ${customDateTime.replace('T', ' ')}`,
          tone: 'info',
          timeDesc: customDateTime.replace('T', ' '),
          nfcStatus: 'Simulated Dynamic Key Active',
          validUntil: `${stay.departure} 11:00`,
        };
    }
  };

  const pass = getPassDetails();

  return (
    <Modal
      title={`Live Pass · Room ${stay.room}`}
      description={`Interactive digital keycard & RFID pass simulation for ${stay.guest}.`}
      onClose={onClose}
      footer={
        <Button variant="accent" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Digital Keycard Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c192c] via-[#09121f] to-[#04080e] p-5 border border-sky-500/30 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400">
              Grand Azure Digital Live-Pass
            </span>
            <Badge tone={pass.tone as any}>{pass.label.split('·')[0]}</Badge>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-mist-400">Guest Name</p>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>{stay.guest}</span>
                {stay.vip && <Badge tone="accent">VIP</Badge>}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-mist-400">Assigned Suite</p>
              <p className="text-2xl font-black text-white font-mono">{stay.room}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-mist-400 block">NFC / RFID Status</span>
              <span className="text-white font-medium flex items-center gap-1 mt-0.5">
                <Wifi className="h-3 w-3 text-sky-400" />
                <span className="truncate">{pass.nfcStatus}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-mist-400 block">Valid Until</span>
              <span className="text-white font-medium flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-sky-400" />
                <span>{pass.validUntil}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Simulator Date & Time Controls */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2.5">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-300" />
            <span>Interactive Demo: Change Date / Time to Test Pass Updates</span>
          </span>
          <p className="text-[11px] text-mist-400">
            Select a simulated point in time during or after the stay to see live-pass status changes:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSimulatedTime('arrival')}
              className={cn(
                'p-2 rounded-xl border text-left transition',
                simulatedTime === 'arrival' ? 'border-sky-400 bg-sky-500/20 text-white font-semibold' : 'border-white/10 bg-ink-900 text-mist-300 hover:bg-white/5',
              )}
            >
              1. Arrival Day (15:00)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedTime('midstay')}
              className={cn(
                'p-2 rounded-xl border text-left transition',
                simulatedTime === 'midstay' ? 'border-emerald-400 bg-emerald-500/20 text-white font-semibold' : 'border-white/10 bg-ink-900 text-mist-300 hover:bg-white/5',
              )}
            >
              2. Mid-Stay (Evening)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedTime('checkout_morning')}
              className={cn(
                'p-2 rounded-xl border text-left transition',
                simulatedTime === 'checkout_morning' ? 'border-amber-400 bg-amber-500/20 text-white font-semibold' : 'border-white/10 bg-ink-900 text-mist-300 hover:bg-white/5',
              )}
            >
              3. Departure Day (09:00)
            </button>
            <button
              type="button"
              onClick={() => setSimulatedTime('checkout_expired')}
              className={cn(
                'p-2 rounded-xl border text-left transition',
                simulatedTime === 'checkout_expired' ? 'border-rose-400 bg-rose-500/20 text-white font-semibold' : 'border-white/10 bg-ink-900 text-mist-300 hover:bg-white/5',
              )}
            >
              4. Post-Checkout (Expired)
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-mist-400">Current Simulated Horizon:</span>
            <span className="font-semibold text-sky-300">{pass.timeDesc}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
