'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  BedDouble,
  CircleAlert,
  CircleCheck,
  Folder,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { LivePassDialog } from '@/components/frontdesk/LivePassDialog';
import { READINESS_TONE } from '@/components/frontdesk/RoomsPanel';
import {
  READINESS_LABEL,
  addStay,
  checkIn,
  checkInBlocker,
  checkOut,
  checkoutBlockers,
  decideEarlyCheckIn,
  inr,
  manualVerifyId,
  markRoomReady,
  moveRoom,
  openDisputeCount,
  settleBalance,
  stayBalance,
  type StayCategory,
} from '@/lib/frontDesk';
import { DEMO_TODAY, fmtDay, parseDemoDay } from '@/lib/bookings';
import { EARLY_CHECKIN_FEE, ROOM_TYPES, roomByNo, roomTypeById } from '@/lib/hotelCatalog';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { RoomRecord, StayRecord } from '@/types/demo';

type Filter = 'all' | 'arrivals' | 'inhouse' | 'departures';
type Dialog = { kind: 'verify' | 'checkout' | 'move' | 'livepass'; stayId: string } | { kind: 'add' } | null;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All (Booked)' },
  { id: 'arrivals', label: 'Arrivals (Check In)' },
  { id: 'inhouse', label: 'In House' },
  { id: 'departures', label: 'Departures (Check Out)' },
];

const MOVE_REASONS = ['AC or maintenance fault', 'Noise complaint', 'Guest-requested upgrade', 'Room not as booked', 'Safety concern'];

const ORDER: Record<StayRecord['status'], number> = { expected: 0, in_house: 1, checked_out: 2 };

/** The catalog room type for a room number, when the sample dataset knows it. */
const catalogTypeName = (no: string): string | undefined => roomTypeById[roomByNo[no]?.typeId ?? '']?.name;

const departureIso = (st: StayRecord) => st.departureDate ?? parseDemoDay(st.departure);
const isDepartingToday = (st: StayRecord) => st.status === 'in_house' && (Boolean(st.departsToday) || departureIso(st) === DEMO_TODAY);
const idIsVerified = (st: StayRecord) => st.idChecked || st.idVerificationStatus === 'verified';

export function StaysPanel({ initialFilter = 'all' }: { initialFilter?: Filter }) {
  const { state, fdAction } = useDemo();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const stays = state.frontDesk?.stays ?? [];
  const term = query.trim().toLowerCase();

  const matches = (st: StayRecord, f: Filter) => {
    if (f === 'arrivals') return st.status === 'expected';
    if (f === 'inhouse') return st.status === 'in_house';
    if (f === 'departures') return isDepartingToday(st);
    return true;
  };

  const counts: Record<Filter, number> = {
    all: stays.length,
    arrivals: stays.filter((st) => matches(st, 'arrivals')).length,
    inhouse: stays.filter((st) => matches(st, 'inhouse')).length,
    departures: stays.filter((st) => matches(st, 'departures')).length,
  };

  const rows = stays
    .filter((st) => {
      const text = `${st.guest} ${st.room} ${st.roomType}`.toLowerCase();
      if (term && !text.includes(term)) return false;
      return matches(st, filter);
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const dialogStay = dialog && 'stayId' in dialog ? stays.find((st) => st.id === dialog.stayId) : undefined;

  return (
    <Panel
      title="Stays"
      hint="Arrivals, in-house guests and departures"
      icon={UserCheck}
      action={
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
          <Button size="sm" variant="accent" iconLeft={Plus} className="shrink-0" onClick={() => setDialog({ kind: 'add' })}>
            Add Stay
          </Button>
          <div className="relative w-full min-w-0 sm:w-56 sm:min-w-[12rem]">
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
            {f.label} <span className="ml-0.5 tabular-nums opacity-70">{counts[f.id]}</span>
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

      {dialog?.kind === 'add' && <AddStayDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === 'verify' && dialogStay && <VerifyIdDialog stay={dialogStay} onClose={() => setDialog(null)} />}
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
          onConfirm={(toRoom, reason, roomType) => {
            if (!fdAction((s) => moveRoom(s, dialogStay.id, toRoom, reason, roomType))) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'livepass' && dialogStay && <LivePassDialog stay={dialogStay} onClose={() => setDialog(null)} />}
    </Panel>
  );
}

/* --------------------------------------------------------------------- */
/* Guest card                                                            */
/* --------------------------------------------------------------------- */

/** Short reason shown next to a disabled Check in button. */
function checkInHint(stay: StayRecord, room: RoomRecord | undefined, blocker: string | null): string | null {
  if (!blocker) return null;
  if (stay.arrivalDate && stay.arrivalDate > DEMO_TODAY) return `Arrives ${fmtDay(stay.arrivalDate)}`;
  if (!idIsVerified(stay)) return 'Verify ID first';
  if (!room) return `Room ${stay.room} not found`;
  if (room.occupied) return `Room ${room.no} is occupied`;
  if (room.readiness !== 'ready') return `Room ${room.no} must be Ready`;
  return 'Not ready yet';
}

function StayRow({ stay, onDialog }: { stay: StayRecord; onDialog: (kind: 'verify' | 'checkout' | 'move' | 'livepass') => void }) {
  const { state, fdAction } = useDemo();
  const [cleanerAssigned, setCleanerAssigned] = useState(false);
  const room = (state.frontDesk?.rooms ?? []).find((r) => r.no === stay.room);
  const arriving = stay.status === 'expected';
  const blocker = arriving ? checkInBlocker(state, stay) : null;
  const hint = checkInHint(stay, room, blocker);
  const roomReady = Boolean(room && room.readiness === 'ready' && !room.occupied);
  const balance = stayBalance(state, stay);
  const early = stay.earlyCheckIn && stay.earlyCheckIn.status !== 'declined' ? stay.earlyCheckIn : undefined;
  const verified = idIsVerified(stay);

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
            {arriving ? `Arrives ${stay.arrival}` : stay.status === 'in_house' ? `Departs ${stay.departure}` : `Left ${stay.departure}`}
            {stay.movedFrom ? ` · Moved from ${stay.movedFrom}` : ''}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {arriving && (
              <>
                <Badge tone={verified ? 'success' : 'warning'}>{verified ? 'ID Verified' : 'ID Check Needed'}</Badge>
                {room && <RoomReadinessTag room={room} onMarkReady={() => fdAction((s) => markRoomReady(s, room.no))} />}
                {early && (
                  <Badge tone={early.status === 'approved' ? 'success' : 'warning'}>
                    {early.status === 'approved' ? `Early check-in approved · ${inr(early.fee)}` : `Early check-in requested · ${inr(early.fee)}`}
                  </Badge>
                )}
              </>
            )}
            {stay.status === 'in_house' && (
              <>
                {isDepartingToday(stay) && <Badge tone="warning">Departing Today</Badge>}
                <Badge tone={balance > 0 ? 'warning' : 'success'}>{balance > 0 ? `Balance ${inr(balance)}` : 'Settled'}</Badge>
              </>
            )}
            {stay.status === 'checked_out' && (
              <>
                <Badge tone="neutral">Checked out</Badge>
                {cleanerAssigned ? <Badge tone="success">Turnover assigned · Vikram S.</Badge> : <Badge tone="warning">Turnover pending · Needs HK</Badge>}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2 lg:justify-end">
          {arriving && (
            <>
              {!verified && (
                <Button size="sm" variant="ghost" iconLeft={ShieldCheck} onClick={() => onDialog('verify')}>
                  Verify ID
                </Button>
              )}
              {early?.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!roomReady}
                    title={roomReady ? undefined : `Room ${stay.room} must be Ready before early check-in can be approved`}
                    onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, true))}
                  >
                    Approve early · {inr(early.fee)}
                  </Button>
                  <Button size="sm" variant="subtle" onClick={() => fdAction((s) => decideEarlyCheckIn(s, stay.id, false))}>
                    Decline early
                  </Button>
                </>
              )}
              <div className="flex flex-col items-end gap-1">
                <Button
                  size="sm"
                  variant="accent"
                  iconLeft={LogIn}
                  disabled={blocker !== null}
                  title={blocker ?? undefined}
                  onClick={() => fdAction((s) => checkIn(s, stay.id))}
                >
                  Check in
                </Button>
                {hint && <span className="text-[11px] text-mist-400">{hint}</span>}
              </div>
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
                  fdAction((s) => {
                    const updatedRooms = (s.frontDesk?.rooms ?? []).map((rm) =>
                      rm.no === stay.room ? { ...rm, readiness: 'cleaning' as const, note: 'Housekeeping turnover assigned by Front Desk' } : rm,
                    );
                    return {
                      next: { ...s, frontDesk: { ...s.frontDesk, rooms: updatedRooms } },
                      message: 'Housekeeping turnover assigned',
                    };
                  });
                }}
              >
                {cleanerAssigned ? 'Cleaner Assigned' : 'Assign Cleaner (Housekeeping)'}
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/** "Room 304: Ready" or "Room 304: Awaiting Inspection". An awaiting room can be marked Ready from a small popover. */
function RoomReadinessTag({ room, onMarkReady }: { room: RoomRecord; onMarkReady: () => string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (room.readiness === 'ready' && !room.occupied) return <Badge tone="success">{`Room ${room.no}: Ready`}</Badge>;

  if (room.readiness !== 'inspection_pending') {
    // dirty, cleaning, failed inspection, out of order or occupied: show the real state
    return <Badge tone={room.occupied ? 'warning' : READINESS_TONE[room.readiness]}>{`Room ${room.no}: ${room.occupied ? 'Occupied' : READINESS_LABEL[room.readiness]}`}</Badge>;
  }

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Click to mark this room Ready"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
      >
        <Badge tone="warning">{`Room ${room.no}: Awaiting Inspection`}</Badge>
      </button>
      {open && (
        <span role="dialog" aria-label={`Mark Room ${room.no} Ready`} className="absolute left-0 top-full z-20 mt-1.5 block w-64 rounded-xl border border-white/15 bg-ink-900 p-3 text-xs shadow-2xl">
          <span className="block font-semibold text-white">Mark Room {room.no} Ready?</span>
          <span className="mt-1 block text-mist-400">Demo shortcut. Normally a supervisor approves the inspection.</span>
          <span className="mt-2.5 flex justify-end gap-2">
            <Button size="sm" variant="subtle" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="accent"
              iconLeft={CircleCheck}
              onClick={() => {
                if (!onMarkReady()) setOpen(false);
              }}
            >
              Mark Ready
            </Button>
          </span>
        </span>
      )}
    </span>
  );
}

/* --------------------------------------------------------------------- */
/* Dialogs                                                               */
/* --------------------------------------------------------------------- */

function VerifyIdDialog({ stay, onClose }: { stay: StayRecord; onClose: () => void }) {
  const { fdAction } = useDemo();
  const [docType, setDocType] = useState(stay.idDocType || 'Passport');
  const [docNumber, setDocNumber] = useState(stay.idDocNumber || `IND-${stay.room}779X`);
  const [tried, setTried] = useState(false);
  const bookingId = stay.bookingRef || `BK-${stay.room}-8402`;
  const numberOk = docNumber.trim().length >= 4;
  const initials = stay.guest
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function confirm() {
    setTried(true);
    if (!numberOk) return;
    const err = fdAction((s) =>
      manualVerifyId(s, stay.id, {
        docType,
        docNumber: docNumber.trim(),
        status: 'verified',
        notes: 'Verified at the Front Desk from the ID preview',
        verifiedBy: 'Front Desk Coordinator',
      }),
    );
    if (!err) onClose();
  }

  return (
    <Modal
      title={`Verify ID · ${stay.guest}`}
      description="Check the document against the booking, then confirm. The card switches to ID Verified."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={CircleCheck} onClick={confirm}>
            Confirm ID verified
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-mist-200">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.05] text-lg font-bold text-white" aria-hidden>
            {initials || <User className="h-6 w-6" />}
          </span>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <dt className="text-mist-400">Name on booking</dt>
              <dd className="truncate font-semibold text-white">{stay.guest}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Booking</dt>
              <dd className="font-semibold text-cyan-300">{bookingId}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Document</dt>
              <dd className="font-medium text-white">{docType}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Number</dt>
              <dd className="font-mono font-medium text-white">{docNumber.trim() ? `•••• ${docNumber.trim().slice(-4)}` : 'Not entered'}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="id-type">Document type</FieldLabel>
            <select id="id-type" value={docType} onChange={(e) => setDocType(e.target.value)} className="field w-full">
              <option value="Passport">Passport</option>
              <option value="Aadhaar / National ID">Aadhaar / National ID</option>
              <option value="Driver's License">Driver&apos;s License</option>
              <option value="Voter ID Card">Voter ID Card</option>
              <option value="Permanent Resident Card">Permanent Resident Card</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="id-number">Document number</FieldLabel>
            <input id="id-number" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="field w-full" aria-invalid={tried && !numberOk} />
            {tried && !numberOk && <p className="mt-1 text-xs text-rose-400">Enter the document number.</p>}
          </div>
        </div>
        <p className="text-[11px] text-mist-400">Frontend demo: no real document is scanned or stored. The result is logged in the Front Desk activity feed.</p>
      </div>
    </Modal>
  );
}

function AddStayDialog({ onClose }: { onClose: () => void }) {
  const { state, fdAction } = useDemo();
  const rooms = state.frontDesk?.rooms ?? [];
  const stays = state.frontDesk?.stays ?? [];
  const eligible = rooms
    .filter((r) => !r.occupied && r.readiness !== 'out_of_order' && !stays.some((st) => st.room === r.no && st.status !== 'checked_out'))
    .sort((a, b) => a.no.localeCompare(b.no));

  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState(eligible[0]?.no ?? '');
  const [roomType, setRoomType] = useState(eligible[0] ? (catalogTypeName(eligible[0].no) ?? ROOM_TYPES[0].name) : ROOM_TYPES[0].name);
  const [category, setCategory] = useState<StayCategory>('arriving');
  const [roomStatus, setRoomStatus] = useState<'ready' | 'inspection_pending'>('ready');
  const [idVerified, setIdVerified] = useState(false);
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [balance, setBalance] = useState('0');
  const [vip, setVip] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const arrivalsOnly = category !== 'arriving';
  const guestOk = guest.trim().length >= 2;
  const balanceNum = Number(balance);
  const balanceOk = balance.trim() !== '' && Number.isFinite(balanceNum) && balanceNum >= 0;

  function pickRoom(no: string) {
    setRoom(no);
    const t = catalogTypeName(no);
    if (t) setRoomType(t);
  }

  function submit() {
    setTried(true);
    setError(null);
    if (!guestOk || !balanceOk || !room) return;
    const err = fdAction((s) =>
      addStay(s, {
        guest,
        room,
        roomType,
        category,
        roomStatus,
        idVerified,
        earlyCheckIn,
        folioBalance: balanceNum,
        vip,
      }),
    );
    if (err) setError(err);
    else onClose();
  }

  const Seg = ({ options, value, onChange, disabled }: { options: Array<{ id: string; label: string }>; value: string; onChange: (id: string) => void; disabled?: boolean }) => (
    <div className={cn('flex flex-wrap gap-1.5', disabled && 'opacity-50')}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', value === o.id ? 'chip-accent' : 'border-white/10 text-mist-300 hover:bg-white/5')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <Modal
      title="Add Stay"
      description="Frontend test booking. It appears in Stays, the Rooms board and the filter counts straight away."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={Plus} disabled={eligible.length === 0} onClick={submit}>
            Add stay
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-mist-300">No vacant rooms are free to assign right now. Check out a guest or reset the demo.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <FieldLabel htmlFor="add-guest">Guest name</FieldLabel>
            <input id="add-guest" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="e.g. Anya Sharma" className="field w-full" aria-invalid={tried && !guestOk} />
            {tried && !guestOk && <p className="mt-1 text-xs text-rose-400">Enter the guest name.</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="add-room">Room number</FieldLabel>
              <select id="add-room" value={room} onChange={(e) => pickRoom(e.target.value)} className="field w-full">
                {eligible.map((r) => (
                  <option key={r.no} value={r.no}>
                    Room {r.no} · Floor {r.floor}
                    {catalogTypeName(r.no) ? ` · ${catalogTypeName(r.no)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="add-type">Room type</FieldLabel>
              <select id="add-type" value={roomType} onChange={(e) => setRoomType(e.target.value)} className="field w-full">
                {ROOM_TYPES.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Stay category</FieldLabel>
            <Seg
              value={category}
              onChange={(id) => setCategory(id as StayCategory)}
              options={[
                { id: 'arriving', label: 'Arriving' },
                { id: 'in_house', label: 'In House' },
                { id: 'departing', label: 'Departing' },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Initial room status</FieldLabel>
              <Seg
                disabled={arrivalsOnly}
                value={roomStatus}
                onChange={(id) => setRoomStatus(id as typeof roomStatus)}
                options={[
                  { id: 'ready', label: 'Ready' },
                  { id: 'inspection_pending', label: 'Awaiting Inspection' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Initial ID status</FieldLabel>
              <Seg
                disabled={arrivalsOnly}
                value={idVerified ? 'verified' : 'needed'}
                onChange={(id) => setIdVerified(id === 'verified')}
                options={[
                  { id: 'needed', label: 'ID Check Needed' },
                  { id: 'verified', label: 'ID Verified' },
                ]}
              />
            </div>
          </div>
          {arrivalsOnly && <p className="-mt-2 text-[11px] text-mist-400">Room status, ID status and early check-in apply to arrivals. In-house guests are already verified in an occupied room.</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="add-balance">Initial folio balance (₹)</FieldLabel>
              <input id="add-balance" type="number" min={0} step="1" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className="field w-full" aria-invalid={tried && !balanceOk} />
              {tried && !balanceOk && <p className="mt-1 text-xs text-rose-400">Enter 0 or more.</p>}
            </div>
            <div className="flex flex-col justify-end gap-2.5 pb-1">
              <label className={cn('flex cursor-pointer items-center gap-2.5 text-xs text-mist-200', arrivalsOnly && 'cursor-not-allowed opacity-50')}>
                <input type="checkbox" disabled={arrivalsOnly} checked={earlyCheckIn && !arrivalsOnly} onChange={(e) => setEarlyCheckIn(e.target.checked)} className="h-4 w-4" />
                <span>Request Early Check-In ({inr(EARLY_CHECKIN_FEE)})</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-mist-200">
                <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} className="h-4 w-4" />
                <span>VIP guest</span>
              </label>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
        </div>
      )}
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
      title={`Folio & checkout · Room ${stay.room}`}
      description={`${stay.guest}. Digital checkout needs a ₹0 balance and no open disputes (F34).`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          {balance > 0 && (
            <Button variant="ghost" onClick={onSettle} iconLeft={Folder}>
              Collect {inr(balance)} · card {stay.cardMask}
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
              {l.disputed && (
                <span className="ml-2 align-middle">
                  <Badge tone="warning">Disputed</Badge>
                </span>
              )}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-white">{inr(l.amount)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Charges</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{inr(total)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Paid</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{inr(stay.paid)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-2 py-2">
          <dt className="text-mist-400">Balance</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{inr(balance)}</dd>
        </div>
      </dl>
      <ul className="space-y-1.5 text-sm" aria-label="Checkout checklist">
        <li className="flex items-center gap-2 text-mist-200">
          {balance <= 0 ? <CircleCheck className="h-4 w-4 text-emerald-400" aria-hidden /> : <CircleAlert className="h-4 w-4 text-amber-400" aria-hidden />}
          {balance <= 0 ? 'Balance is ₹0' : `Balance of ${inr(balance)} outstanding`}
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

function MoveDialog({ stay, onClose, onConfirm }: { stay: StayRecord; onClose: () => void; onConfirm: (toRoom: string, reason: string, roomType: string) => void }) {
  const { state } = useDemo();
  const reserved = new Set((state.frontDesk?.stays ?? []).filter((st) => st.status === 'expected').map((st) => st.room));
  const candidates = (state.frontDesk?.rooms ?? []).filter((r) => !r.occupied && r.readiness === 'ready' && !r.dnd && r.no !== stay.room && !reserved.has(r.no));
  const [toRoom, setToRoom] = useState(candidates[0]?.no ?? '');
  const [roomType, setRoomType] = useState(candidates[0] ? (catalogTypeName(candidates[0].no) ?? stay.roomType) : stay.roomType);
  const [reason, setReason] = useState(MOVE_REASONS[0]);
  const typeNames = ROOM_TYPES.map((t) => t.name);
  const typeOptions = typeNames.includes(roomType) ? typeNames : [roomType, ...typeNames];

  function pickRoom(no: string) {
    setToRoom(no);
    const t = catalogTypeName(no);
    if (t) setRoomType(t);
  }

  return (
    <Modal
      title={`Move ${stay.guest}`}
      description={`Currently in Room ${stay.room} (${stay.roomType}). Only vacant, inspected rooms can be assigned.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={ArrowRightLeft} disabled={!toRoom} onClick={() => onConfirm(toRoom, reason, roomType)}>
            Confirm move
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-mist-300">No vacant, inspected rooms are available right now. Check the Rooms tab.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="move-room">New room</FieldLabel>
              <select id="move-room" value={toRoom} onChange={(e) => pickRoom(e.target.value)} className="field w-full">
                {candidates.map((r) => (
                  <option key={r.no} value={r.no}>
                    Room {r.no} · Floor {r.floor}
                    {catalogTypeName(r.no) ? ` · ${catalogTypeName(r.no)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="move-type">Room type</FieldLabel>
              <select id="move-type" value={roomType} onChange={(e) => setRoomType(e.target.value)} className="field w-full">
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
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
            The old room&apos;s guest QR session is revoked immediately, the folio and open requests move with the guest, and Housekeeping receives a turnover task.
          </p>
        </>
      )}
    </Modal>
  );
}

