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

type Filter = 'all' | 'ready' | 'turnover' | 'inspection' | 'blocked' | 'dnd';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All rooms' },
  { id: 'ready', label: 'Ready' },
  { id: 'turnover', label: 'Dirty / cleaning' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'blocked', label: 'Out of order' },
  { id: 'dnd', label: 'Do not disturb' },
];

function matches(r: RoomRecord, f: Filter): boolean {
  switch (f) {
    case 'ready':
      return r.readiness === 'ready' && !r.occupied;
    case 'turnover':
      return r.readiness === 'dirty' || r.readiness === 'cleaning';
    case 'inspection':
      return r.readiness === 'inspection_pending' || r.readiness === 'inspection_failed';
    case 'blocked':
      return r.readiness === 'out_of_order';
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
  inspection_pending: 'Cleaned, waiting for a supervisor inspection before it can be sold.',
  inspection_failed: 'Failed inspection. Housekeeping must redo it.',
  out_of_order: 'Blocked in the PMS with Duty Manager approval. It cannot be assigned.',
};

export function RoomsPanel() {
  const { state } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  const rooms = [...state.frontDesk.rooms].sort((a, b) => a.no.localeCompare(b.no));
  const shown = rooms.filter((r) => matches(r, filter));
  const floors = Array.from(new Set(shown.map((r) => r.floor))).sort((a, b) => a - b);
  const guestIn = (no: string) => state.frontDesk.stays.find((st) => st.room === no && st.status === 'in_house');

  const tally = {
    ready: rooms.filter((r) => matches(r, 'ready')).length,
    turnover: rooms.filter((r) => matches(r, 'turnover')).length,
    inspection: rooms.filter((r) => matches(r, 'inspection')).length,
    blocked: rooms.filter((r) => matches(r, 'blocked')).length,
  };

  return (
    <Panel title="Room board" hint="Occupancy and housekeeping readiness. Tap a room for detail." icon={BedDouble}>
      <dl className="fd-stagger mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ['Ready to sell', tally.ready, 'success'],
            ['Dirty / cleaning', tally.turnover, 'warning'],
            ['Awaiting inspection', tally.inspection, 'info'],
            ['Out of order', tally.blocked, 'danger'],
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
  const room = state.frontDesk.rooms.find((r) => r.no === roomNo);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  if (!room) return null;

  const stay = state.frontDesk.stays.find((st) => st.room === room.no && st.status !== 'checked_out');
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

      <div className="rounded-xl border border-white/10 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <Hammer className="h-4 w-4" aria-hidden /> Out-of-order block (needs Duty Manager)
        </h3>
        {block === 'applied' && (
          <p className="flex items-center gap-2 text-xs text-mist-300">
            <LockKeyhole className="h-4 w-4" aria-hidden /> This room is blocked. Only Maintenance and the Duty Manager can release it.
          </p>
        )}
        {block === 'pending' && (
          <p className="flex items-center gap-2 text-xs text-amber-200">
            <ShieldAlert className="h-4 w-4" aria-hidden /> Request sent. Waiting for the Duty Manager to approve (switch to that role to try it).
          </p>
        )}
        {block === 'approved' && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-xs text-emerald-300">
              <CircleCheck className="h-4 w-4" aria-hidden /> Duty Manager approved.
            </p>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                if (!fdAction('applyOutOfOrder', [room.no])) onClose();
              }}
            >
              Apply block
            </Button>
          </div>
        )}
        {canRequest && (
          <div className="space-y-2">
            <div>
              <FieldLabel htmlFor="ooo-reason">Reason</FieldLabel>
              <input
                id="ooo-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Water leak in bathroom"
                className="field w-full"
                aria-invalid={tried && !reasonOk}
              />
              {tried && !reasonOk && <p className="mt-1 text-xs text-rose-400">Give a reason (5+ characters).</p>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              iconLeft={Sparkles}
              onClick={() => {
                setTried(true);
                if (!reasonOk) return;
                if (!fdAction('requestOutOfOrder', [room.no, reason])) onClose();
              }}
            >
              Request approval
            </Button>
          </div>
        )}
        {room.occupied && block === 'none' && <p className="text-xs text-mist-400">Occupied rooms cannot be blocked. Move the guest first.</p>}
      </div>
    </Modal>
  );
}
