'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  KeyRound,
  Layers,
  Lock,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  Smartphone,
  Unlock,
  Wrench,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { ROOMS, roomTypeById, VIEW_LABEL } from '@/lib/hotelCatalog';

export function RoomQrTab() {
  const { state, revokeRoomSession, restoreRoomSession, notify } = useDemo();
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'revoked' | 'active'>('all');
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null);

  // In-house stays lookup by room
  const inHouseByRoom = useMemo(() => {
    const map = new Map<string, typeof state.frontDesk.stays[0]>();
    (state.frontDesk?.stays ?? [])
      .filter((s) => s.status === 'in_house')
      .forEach((s) => map.set(s.room, s));
    return map;
  }, [state.frontDesk?.stays]);

  // Front Desk rooms lookup by room no
  const fdRoomsByNo = useMemo(() => {
    const map = new Map<string, typeof state.frontDesk.rooms[0]>();
    (state.frontDesk?.rooms ?? []).forEach((r) => map.set(r.no, r));
    return map;
  }, [state.frontDesk?.rooms]);

  const filteredRooms = useMemo(() => {
    return ROOMS.filter((unit) => {
      const matchesFloor = floorFilter === 'all' || unit.floor === floorFilter;
      const isRevoked = (state.revokedRooms ?? []).includes(unit.no);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'revoked' && isRevoked) ||
        (statusFilter === 'active' && !isRevoked);

      return matchesFloor && matchesStatus;
    });
  }, [floorFilter, statusFilter, state.revokedRooms]);

  const handleCopyLink = (roomNo: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/guest/portal?room=${roomNo}&token=demo-token`;
    navigator.clipboard?.writeText(url);
    setCopiedRoom(roomNo);
    notify(`Copied QR portal URL for Room ${roomNo}`);
    setTimeout(() => setCopiedRoom(null), 2500);
  };

  const handleEmergencyLockdownAll = () => {
    ROOMS.forEach((r) => {
      if (!state.revokedRooms.includes(r.no)) {
        revokeRoomSession(r.no);
      }
    });
    notify('Emergency lockdown: all 27 room QR sessions revoked');
  };

  const handleRestoreAll = () => {
    state.revokedRooms.forEach((r) => restoreRoomSession(r));
    notify('All room QR sessions restored');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <QrCode className="h-6 w-6 text-amber-400" />
            Room Inventory & In-Room QR Code Tokens
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Governs public QR mapping tokens, stay-linked guest verification, and instant emergency revocation across all 27 property units (ER_DIAGRAMS Domain 2 & Fix 3).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {state.revokedRooms.length > 0 ? (
            <Button
              size="sm"
              variant="subtle"
              iconLeft={Unlock}
              onClick={handleRestoreAll}
            >
              Restore All ({state.revokedRooms.length})
            </Button>
          ) : (
            <Button
              size="sm"
              variant="subtle"
              iconLeft={Lock}
              onClick={handleEmergencyLockdownAll}
              className="hover:border-rose-400/50 hover:text-rose-300"
            >
              Lock Down All Units
            </Button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-4">
        {/* Floor Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-mist-400 mr-2 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Floor:
          </span>
          <button
            type="button"
            onClick={() => setFloorFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              floorFilter === 'all'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white hover:bg-white/5'
            }`}
          >
            All Floors (27)
          </button>
          {[1, 2, 3, 4, 5].map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setFloorFilter(fl)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                floorFilter === fl
                  ? 'bg-amber-400 text-ink-950 shadow-sm'
                  : 'text-mist-300 hover:text-white hover:bg-white/5'
              }`}
            >
              L{fl} ({ROOMS.filter((r) => r.floor === fl).length})
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Session States</option>
            <option value="active">Active Sessions Only</option>
            <option value="revoked">Revoked / Locked Only ({state.revokedRooms.length})</option>
          </select>
        </div>
      </div>

      {/* 27 Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRooms.map((unit) => {
          const type = roomTypeById[unit.typeId];
          const inHouseStay = inHouseByRoom.get(unit.no);
          const fdRoom = fdRoomsByNo.get(unit.no);
          const isRevoked = state.revokedRooms.includes(unit.no);
          const isOccupied = Boolean(inHouseStay || fdRoom?.occupied);
          const isOOO = fdRoom?.readiness === 'out_of_order';
          const tokenDigest = `qr_tok_adp_${unit.no}_${unit.floor}`;

          return (
            <div
              key={unit.no}
              className={`rounded-2xl border p-5 backdrop-blur-xl transition shadow-lg flex flex-col justify-between ${
                isRevoked
                  ? 'border-rose-500/40 bg-rose-500/[0.04]'
                  : isOccupied
                  ? 'border-sky-400/30 bg-ink-900/90'
                  : 'border-white/10 bg-ink-900/80'
              }`}
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-lg text-white">
                        Room {unit.no}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-300">
                        Floor {unit.floor}
                      </span>
                    </div>
                    <span className="text-xs text-mist-300 block font-medium mt-0.5">
                      {type?.name ?? unit.typeId} · {VIEW_LABEL[unit.view]}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isRevoked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[10px] font-bold text-rose-300">
                        <AlertOctagon className="h-3 w-3" />
                        REVOKED
                      </span>
                    ) : isOccupied ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/15 border border-sky-400/30 px-2.5 py-1 text-[10px] font-bold text-sky-300">
                        <Check className="h-3 w-3" />
                        VERIFIED IN-HOUSE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        <Check className="h-3 w-3" />
                        STANDBY / VACANT
                      </span>
                    )}
                  </div>
                </div>

                {/* Guest Context or Readiness */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1">
                  {inHouseStay ? (
                    <div>
                      <span className="text-mist-400 text-[10px] uppercase font-semibold block">
                        Verified Guest
                      </span>
                      <strong className="text-white font-bold block text-sm">
                        {inHouseStay.guest} {inHouseStay.vip && <span className="text-amber-300 text-xs">★ VIP</span>}
                      </strong>
                      <span className="text-mist-400 text-[11px] block">
                        Departs: {inHouseStay.departure} · Folio Card: {inHouseStay.cardMask}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-mist-400 text-[10px] uppercase font-semibold block">
                        Unit State
                      </span>
                      <span className="text-mist-200 block">
                        {isOOO ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <Wrench className="h-3 w-3" /> Out of order (Maintenance)
                          </span>
                        ) : fdRoom?.readiness ? (
                          <span className="capitalize">{fdRoom.readiness.replace('_', ' ')}</span>
                        ) : (
                          'Ready for arrival'
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Token Digest */}
                <div className="text-[11px] text-mist-400 font-mono flex items-center justify-between border-t border-white/[0.05] pt-2">
                  <span>Digest:</span>
                  <span className="text-mist-300 truncate max-w-[180px]">{tokenDigest}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(unit.no)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                    title="Copy QR Portal direct URL"
                  >
                    {copiedRoom === unit.no ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-amber-300" />
                    )}
                    <span>{copiedRoom === unit.no ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href={`/guest/portal?room=${unit.no}&token=demo-token`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                    title="Launch In-Room Guest Portal in new window"
                  >
                    <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                    <span>Launch</span>
                  </a>
                </div>

                {isRevoked ? (
                  <Button
                    size="sm"
                    variant="subtle"
                    iconLeft={Unlock}
                    onClick={() => restoreRoomSession(unit.no)}
                    className="text-emerald-300 hover:border-emerald-400/40"
                  >
                    Restore
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    iconLeft={Lock}
                    onClick={() => revokeRoomSession(unit.no)}
                    className="text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
