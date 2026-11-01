'use client';

import { useMemo, useState } from 'react';
import {
  Accessibility,
  ArrowRight,
  Bed,
  Check,
  Compass,
  Crown,
  Eye,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Scale,
  Sparkles,
  Sun,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FLOOR_INFO,
  ROOMS,
  VIEW_LABEL,
  roomByNo,
  roomTypeById,
  type FloorInfo,
  type RoomUnit,
  type ViewKind,
} from '@/lib/hotelCatalog';
import {
  roomAvailability,
  type StayQuery,
} from '@/lib/bookings';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

interface RoomExplorerProps {
  query: StayQuery;
  onBookRoom: (typeId: string, roomNo: string) => void;
  onViewDetails: (typeId: string) => void;
  comparedIds: string[];
  onToggleCompare: (typeId: string) => void;
}

export function RoomExplorer({
  query,
  onBookRoom,
  onViewDetails,
  comparedIds,
  onToggleCompare,
}: RoomExplorerProps) {
  const { state } = useDemo();
  const [activeFloor, setActiveFloor] = useState<number>(4); // default level 4
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>('403'); // sample corner room

  const floorData = FLOOR_INFO.find((f) => f.floor === activeFloor) ?? FLOOR_INFO[3];

  const selectedRoom = selectedRoomNo ? roomByNo[selectedRoomNo] : null;
  const selectedType = selectedRoom ? roomTypeById[selectedRoom.typeId] : null;
  const selectedAvail = selectedRoom
    ? roomAvailability(state, selectedRoom.no, query.checkIn, query.checkOut)
    : null;

  // View count on current floor
  const floorRooms = useMemo(() => {
    return ROOMS.filter((r) => r.floor === activeFloor);
  }, [activeFloor]);

  return (
    <section id="explorer" className="py-14 sm:py-20 border-t border-white/[0.08] bg-ink-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
            <Compass className="h-3.5 w-3.5" />
            <span>Architectural Property Map</span>
          </div>
          <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Interactive Floor-by-Floor Explorer
          </h2>
          <p className="mt-2 text-sm sm:text-base text-mist-300">
            Browse all 5 represented floors, inspect exact room layouts along the corridors, discover unique
            architectural features, and check real-time availability synced with Front Desk inventory.
          </p>
        </div>

        {/* Floor Switcher Navigation */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {FLOOR_INFO.map((f) => {
            const count = ROOMS.filter((r) => r.floor === f.floor).length;
            const isActive = activeFloor === f.floor;
            return (
              <button
                key={f.floor}
                type="button"
                onClick={() => {
                  setActiveFloor(f.floor);
                  const firstOnFloor = ROOMS.find((r) => r.floor === f.floor);
                  if (firstOnFloor) setSelectedRoomNo(firstOnFloor.no);
                }}
                className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-400 text-ink-950 shadow-lg font-bold'
                    : 'border border-white/10 bg-white/[0.04] text-mist-200 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{f.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isActive ? 'bg-ink-950/20 text-ink-950' : 'bg-white/10 text-mist-300'
                  }`}
                >
                  {count} {count === 1 ? 'room' : 'rooms'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explorer Workspace: Interactive Floor Plan + Detail Inspector */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Floor Plan Board (Col 1-8) */}
          <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-ink-900/80 p-5 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              {/* Floor Plan Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <span>{floorData.label}</span>
                    <span className="text-xs font-mono font-normal text-amber-300 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-300/20">
                      Level {floorData.floor}
                    </span>
                  </h3>
                  <p className="text-xs text-mist-400 mt-0.5">
                    Select any room cell to inspect its unique amenities, exact bed config, and live reservation status.
                  </p>
                </div>

                {/* Public amenities on this floor */}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-mist-300">
                  {floorData.areas.map((area, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-sky-200 font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Floor Plan Diagram Canvas */}
              <div className="mt-6 space-y-6">
                {floorData.rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-mist-400 uppercase tracking-wider">
                      <span>{rowIdx === 0 ? 'North Wing / City Facing' : 'South Wing / Pool Facing'}</span>
                      <span>{row.length} Rooms</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {row.map((no) => {
                        const unit = roomByNo[no];
                        if (!unit) return null;
                        const type = roomTypeById[unit.typeId];
                        const avail = roomAvailability(state, unit.no, query.checkIn, query.checkOut);
                        const isSelected = selectedRoomNo === unit.no;

                        // Visual color styles based on availability
                        const statusColor = !avail.available
                          ? avail.reason === 'out_of_order'
                            ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
                            : 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                          : isSelected
                          ? 'border-amber-400 bg-amber-400/15 text-white ring-2 ring-amber-400/40'
                          : 'border-white/10 bg-white/[0.04] text-mist-200 hover:border-white/30 hover:bg-white/[0.08]';

                        return (
                          <button
                            key={no}
                            type="button"
                            onClick={() => setSelectedRoomNo(unit.no)}
                            className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${statusColor}`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-mono text-base font-bold tracking-tight">
                                Room {unit.no}
                              </span>
                              {unit.typeId === 'presidential-suite' && (
                                <Crown className="h-4 w-4 text-amber-300" />
                              )}
                              {unit.typeId === 'accessible-king' && (
                                <Accessibility className="h-4 w-4 text-emerald-300" />
                              )}
                            </div>

                            <div className="mt-2">
                              <span className="block text-xs font-semibold truncate text-white">
                                {type?.name ?? unit.typeId}
                              </span>
                              <span className="block text-[11px] text-mist-400">
                                {VIEW_LABEL[unit.view]}
                              </span>
                            </div>

                            {/* Status tag */}
                            <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2 text-[10px]">
                              <span className="font-medium">
                                {!avail.available ? (
                                  avail.reason === 'out_of_order' ? (
                                    <span className="text-rose-400 flex items-center gap-1">
                                      <Wrench className="h-3 w-3" /> Maintenance
                                    </span>
                                  ) : (
                                    <span className="text-amber-400">Reserved</span>
                                  )
                                ) : (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Free
                                  </span>
                                )}
                              </span>

                              <span className="text-mist-400">{type ? `${money(type.rate)}/n` : ''}</span>
                            </div>

                            {unit.features.length > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-ink-950" title={unit.features[0]}>
                                ★
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Central Corridor Representation */}
                    {rowIdx === 0 && floorData.rows.length > 1 && (
                      <div className="my-2 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-2 text-[10px] uppercase tracking-widest text-mist-500 font-mono">
                        · Central Guest Corridor & Access Lifts ·
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Floor Map Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-4 text-xs text-mist-400">
              <span className="font-semibold text-white">Map Legend:</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Bookable online
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> In house / Reserved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Out of order / Maintenance
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-amber-300 font-bold">★</span> Distinctive unit feature
              </span>
            </div>
          </div>

          {/* Room Inspector Panel (Col 9-12) */}
          <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            {selectedRoom && selectedType ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300">
                      <span>Room {selectedRoom.no}</span>
                      <span>·</span>
                      <span>Floor {selectedRoom.floor}</span>
                    </div>
                    <h4 className="font-display text-2xl font-bold text-white mt-1">
                      {selectedType.name}
                    </h4>
                    <p className="text-xs text-mist-300 mt-1">{selectedType.blurb}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-display text-xl font-bold text-white">
                      {money(selectedType.rate)}
                    </span>
                    <span className="text-[10px] text-mist-400 uppercase">per night</span>
                  </div>
                </div>

                {/* Live Availability Status */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist-400">Status for your stay:</span>
                    {selectedAvail?.available ? (
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Bookable Now
                      </span>
                    ) : (
                      <span className="font-bold text-rose-400">
                        {selectedAvail?.label ?? 'Unavailable'}
                      </span>
                    )}
                  </div>
                  {selectedAvail?.prep && (
                    <p className="mt-1 text-[11px] text-amber-300">{selectedAvail.prep}</p>
                  )}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 text-xs text-mist-200">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[10px] text-mist-400 uppercase">Capacity</span>
                    <span className="font-semibold text-white">Up to {selectedType.maxGuests} guests</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[10px] text-mist-400 uppercase">Room View</span>
                    <span className="font-semibold text-white">{VIEW_LABEL[selectedRoom.view]}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[10px] text-mist-400 uppercase">Bedding</span>
                    <span className="font-semibold text-white">{selectedType.bedLabel}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                    <span className="block text-[10px] text-mist-400 uppercase">Dimensions</span>
                    <span className="font-semibold text-white">{selectedType.areaSqm} m² area</span>
                  </div>
                </div>

                {/* Distinctive Features for this individual unit */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    Individual Unit Distinctions:
                  </h5>
                  {selectedRoom.features.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-xs text-mist-200">
                      {selectedRoom.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 rounded-xl bg-amber-400/10 border border-amber-300/20 p-2 text-amber-200">
                          <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-xs text-mist-400 italic">
                      Standard luxury layout for {selectedType.name} with {VIEW_LABEL[selectedRoom.view]}.
                    </p>
                  )}
                </div>

                {/* Primary Booking Action */}
                <div className="space-y-2 pt-2">
                  <Button
                    size="md"
                    variant={selectedAvail?.available ? 'accent' : 'subtle'}
                    disabled={!selectedAvail?.available}
                    onClick={() => onBookRoom(selectedType.id, selectedRoom.no)}
                    className="w-full justify-center font-bold"
                  >
                    {selectedAvail?.available
                      ? `Book Room ${selectedRoom.no} Now`
                      : `Room ${selectedRoom.no} Unavailable`}
                  </Button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onViewDetails(selectedType.id)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-mist-200 hover:text-white"
                    >
                      Full Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleCompare(selectedType.id)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-amber-300 hover:bg-white/10"
                    >
                      {comparedIds.includes(selectedType.id) ? 'Comparing' : '+ Compare'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid place-items-center py-12 text-center text-mist-400">
                <Info className="h-6 w-6" />
                <p className="text-xs mt-2">Select a room on the floor plan to inspect its features.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
