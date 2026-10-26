'use client';

import Link from 'next/link';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { LostFoundManager } from '@/components/staff/LostFoundManager';
import { integrationList, qrMappings, ROOM_LEGEND, roomGrid } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { IntegrationState, SideWidget, Tone } from '@/types/demo';

const INTEGRATION_TONE: Record<IntegrationState, Tone> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'danger',
};

export function SideWidgetView({ widget }: { widget: SideWidget }) {
  const { state, cycleIntegration, reset } = useDemo();
  const common = { title: widget.title, hint: widget.hint, icon: widget.icon };

  switch (widget.type) {
    case 'meters':
      return (
        <Panel {...common}>
          <ul className="space-y-4">
            {widget.rows.map((row) => (
              <li key={row.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-mist-200">{row.label}</span>
                  <span className="tabular-nums text-mist-400">{row.note ?? `${row.value}%`}</span>
                </div>
                <div
                  className="meter-track"
                  role="progressbar"
                  aria-label={row.label}
                  aria-valuenow={row.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={cn(
                      'meter-fill',
                      row.tone === 'warning' && 'meter-fill-warning',
                      row.tone === 'danger' && 'meter-fill-danger',
                    )}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      );

    case 'rooms':
      return (
        <Panel {...common}>
          <div className="grid grid-cols-8 gap-1.5">
            {roomGrid.map((room) => {
              const st = state.revokedRooms.includes(room.no) ? 'D' : room.state;
              return (
                <div
                  key={room.no}
                  className={cn('room-cell', `room-${st}`)}
                  title={`Room ${room.no}: ${ROOM_LEGEND.find((l) => l.state === st)?.label}`}
                >
                  <span className="text-[10px] opacity-80">{room.no}</span>
                  <span className="text-[11px] font-bold">{st}</span>
                </div>
              );
            })}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-mist-400">
            {ROOM_LEGEND.map((l) => (
              <li key={l.state}>
                <span className="font-bold text-mist-200">{l.state}</span> {l.label}
              </li>
            ))}
          </ul>
        </Panel>
      );

    case 'integrations':
      return (
        <Panel {...common}>
          <ul className="space-y-3">
            {integrationList.map((i) => {
              const s = state.integrations[i.id] ?? 'healthy';
              return (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{i.name}</p>
                    <p className="text-xs text-mist-400">{i.detail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={INTEGRATION_TONE[s]} className="capitalize">
                      {s}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => cycleIntegration(i.id)}>
                      Simulate
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button className="mt-5 w-full" variant="danger" iconLeft={RotateCcw} onClick={reset}>
            Reset demo data
          </Button>
        </Panel>
      );

    case 'qr':
      return (
        <Panel {...common}>
          <ul className="space-y-3">
            {qrMappings.map((q) => {
              const revoked = state.revokedRooms.includes(q.room);
              return (
                <li key={q.room} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Room {q.room}</p>
                    <p className="text-xs text-mist-400">{q.guest}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={revoked ? 'danger' : 'success'}>{revoked ? 'Revoked' : 'Active'}</Badge>
                    <Link
                      href={`/guest/portal?room=${q.room}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      );

    case 'lostfound':
      return <LostFoundManager {...common} />;

    case 'notes':
      return (
        <Panel {...common}>
          <ul className="space-y-2.5">
            {widget.rows.map((row) => (
              <li key={row} className="flex items-start gap-2.5 text-sm text-mist-300">
                <ShieldCheck className="accent-text mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {row}
              </li>
            ))}
          </ul>
        </Panel>
      );
  }
}
