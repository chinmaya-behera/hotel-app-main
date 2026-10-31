'use client';

import { useState } from 'react';
import { BedDouble, CircleCheck, Hammer, LockKeyhole, MoonStar, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge, TONE_ICONS } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { READINESS_LABEL } from '@/lib/frontDesk';
import { applyOutOfOrder, oooState, requestOutOfOrder } from '@/lib/frontDeskRooms';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Readiness, RoomRecord, Tone } from '@/types/demo';

export const READINESS_TONE: Record<Readiness, Tone> = {
  ready: 'success',
  dirty: 'warning',
  cleaning: 'info',
  inspection_pending: 'warning',
  inspection_failed: 'danger',
  out_of_order: 'danger',
};

const TILE_TONE: Record<Tone, string> = {
  neutral: 'border-white/10 bg-white/[0.03]',
  info: 'border-sky-400/30 bg-sky-400/[0.08]',
  success: 'border-emerald-400/30 bg-emerald-400/[0.08]',
  warning: 'border-amber-300/35 bg-amber-300/[0.08]',
  danger: 'border-rose-400/35 bg-rose-500/[0.08]',
  accent: 'border-white/10 bg-white/5',
};

type Filter = 'all' | 'ready' | 'turnover' | 'checkin' | 'checkout' | 'dnd';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All rooms' },
  { id: 'ready', label: 'Ready' },
  { id: 'turnover', label: 'Dirty / cleaning' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'checkout', label: 'Check-Out' },
  { id: 'dnd', label: 'Do not disturb' },
];

function matches(r: RoomRecord, f: Filter, stays: Array<{ room: string; status: string; departsToday?: boolean }>): boolean {
  switch (f) {
    case 'ready':
      return r.readiness === 'ready' && !r.occupied;
    case 'turnover':
      return r.readiness === 'dirty' || r.readiness === 'cleaning';
    case 'checkin':
      return stays.some((st) => st.room === r.no && st.status === 'expected');
    case 'checkout':
      return stays.some((st) => st.room === r.no && st.status === 'in_house' && Boolean(st.departsToday));
    case 'dnd':
      return r.dnd;
    default:
      return true;
  }
}

const EXPLAIN: Record<Readiness, string> = {
  ready: 'Inspected and sellable. Guests can be checked in or moved here.',
  dirty: 'Waiting for a Housekeeping turnover. Front Desk cannot mark a room clean.',
  cleaning: 'Housekeeping is cleaning it now.',
  inspection_pending: 'Cleaned, awaiting inspection before check-in assignment.',
  inspection_failed: 'Turnover in progress.',
  out_of_order: 'Under scheduled maintenance.',
};

export function RoomsPanel() {
  const { state } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  const stays = state.frontDesk?.stays ?? [];
  const rooms = [...(state.frontDesk?.rooms ?? [])].sort((a, b) => a.no.localeCompare(b.no));
  const shown = rooms.filter((r) => matches(r, filter, stays));
  const floors = Array.from(new Set(shown.map((r) => r.floor))).sort((a, b) => a - b);
  const guestIn = (no: string) => stays.find((st) => st.room === no && st.status === 'in_house');

  const tally = {
    ready: rooms.filter((r) => matches(r, 'ready', stays)).length,
    turnover: rooms.filter((r) => matches(r, 'turnover', stays)).length,
    checkin: rooms.filter((r) => matches(r, 'checkin', stays)).length,
    checkout: rooms.filter((r) => matches(r, 'checkout', stays)).length,
  };

  return (
    <Panel title="Room board" hint="Occupancy and housekeeping readiness. Tap a room for detail." icon={BedDouble}>
      <dl className="fd-stagger mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ['Ready to sell', tally.ready, 'success'],
            ['Dirty / cleaning', tally.turnover, 'warning'],
            ['Check-In today', tally.checkin, 'info'],
            ['Check-Out today', tally.checkout, 'accent'],
          ] as const
        ).map(([label, n, tone], i) => (
          <div key={label} style={{ '--i': i } as React.CSSProperties} className={cn('rounded-xl border px-3 py-2', TILE_TONE[tone])}>
            <dt className="text-[11px] text-mist-300">{label}</dt>
            <dd className="text-xl font-bold tabular-nums text-white">{n}</dd>
          </div>
        ))}
      </dl>

      <div role="group" aria-label="Filter rooms" className="mb-4 flex flex-wrap gap-1.5">
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

      {shown.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <BedDouble className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="text-sm text-mist-300">No rooms match this filter right now.</p>
        </div>
      ) : (
        <div key={filter} className="space-y-5">
          {floors.map((floor) => (
            <section key={floor} aria-label={`Floor ${floor}`}>
              <h3 className="eyebrow mb-2">Floor {floor}</h3>
              <ul className="fd-stagger grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {shown
                  .filter((r) => r.floor === floor)
                  .map((r, i) => {
                    const guest = guestIn(r.no);
                    const tone = READINESS_TONE[r.readiness];
                    const Icon = TONE_ICONS[tone];
                    return (
                      <li key={r.no} style={{ '--i': i } as React.CSSProperties}>
                        <button
                          type="button"
                          onClick={() => setOpenRoom(r.no)}
                          data-working={r.readiness === 'cleaning'}
                          aria-label={`Room ${r.no}, ${r.occupied ? 'occupied' : 'vacant'}, ${READINESS_LABEL[r.readiness]}${r.dnd ? ', do not disturb' : ''}`}
                          className={cn('room-tile w-full', TILE_TONE[tone])}
                        >
                          <span className="flex w-full items-center justify-between">
                            <span className="text-base font-bold tabular-nums text-white">{r.no}</span>
                            <Icon className="h-3.5 w-3.5 text-mist-300" aria-hidden />
                          </span>
                          <span className="text-[11px] font-medium text-mist-200">{READINESS_LABEL[r.readiness]}</span>
                          <span className="truncate text-[11px] text-mist-400">{guest ? guest.guest : r.occupied ? 'Occupied' : 'Vacant'}</span>
                          {r.dnd && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                              <MoonStar className="h-3 w-3" aria-hidden /> DND
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {openRoom && <RoomDialog roomNo={openRoom} onClose={() => setOpenRoom(null)} />}
    </Panel>
  );
}

function RoomDialog({ roomNo, onClose }: { roomNo: string; onClose: () => void }) {
  const { state, fdAction } = useDemo();
  const room = (state.frontDesk?.rooms ?? []).find((r) => r.no === roomNo);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  if (!room) return null;

  const stay = (state.frontDesk?.stays ?? []).find((st) => st.room === room.no && st.status !== 'checked_out');
  const block = oooState(state, room.no);
  const tone = READINESS_TONE[room.readiness];
  const reasonOk = reason.trim().length >= 5;
  const canRequest = !room.occupied && room.readiness !== 'out_of_order' && block === 'none';

  return (
    <Modal
      title={`Room ${room.no}`}
      description={`Floor ${room.floor} · ${room.occupied ? 'Occupied' : 'Vacant'}`}
      onClose={onClose}
      footer={
        <Button variant="subtle" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={tone}>{READINESS_LABEL[room.readiness]}</Badge>
        <Badge tone={room.occupied ? 'info' : 'neutral'}>{room.occupied ? 'Occupied' : 'Vacant'}</Badge>
        {room.dnd && <Badge tone="warning">Do not disturb</Badge>}
      </div>
      <p className="text-sm text-mist-200">{EXPLAIN[room.readiness]}</p>
      {room.note && <p className="rounded-lg border border-white/10 px-3 py-2 text-xs text-mist-300">{room.note}</p>}
      {stay && (
        <p className="text-sm text-mist-200">
          {stay.status === 'in_house' ? 'In house' : 'Arriving'}: <strong className="text-white">{stay.guest}</strong> · {stay.roomType}
        </p>
      )}
      {room.dnd && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200">
          <MoonStar className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Guest has Do Not Disturb on (F04). Housekeeping tasks for this room are held, not skipped. Contact the guest before sending staff in.
        </p>
      )}

      <div className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <BedDouble className="h-4 w-4 text-sky-400" aria-hidden /> Front Desk Stay & Turnover Overview
        </h3>
        {stay ? (
          <div className="space-y-1.5 text-xs text-mist-300">
            <p className="flex items-center justify-between">
              <span className="text-mist-400">Guest Name:</span>
              <span className="font-semibold text-white">{stay.guest} {stay.vip ? '(VIP)' : ''}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-mist-400">Stay Status:</span>
              <span className="font-medium text-emerald-300 capitalize">{stay.status.replace('_', ' ')}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-mist-400">Dates:</span>
              <span className="text-white">{stay.arrival} → {stay.departure}</span>
            </p>
            {stay.departsToday && (
              <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-amber-200 mt-2">
                Checkout scheduled for today. Review folio balance before guest departure.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-mist-400">
            Room is currently unoccupied. {room.readiness === 'ready' ? 'Ready for new guest check-in or room move assignment.' : 'Turnover in progress by Housekeeping.'}
          </p>
        )}
      </div>
    </Modal>
  );
}
