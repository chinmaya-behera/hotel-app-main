'use client';

import { useMemo, useState } from 'react';
import {
  Accessibility,
  ArrowRight,
  Bath,
  Bed,
  Check,
  ChevronRight,
  Filter,
  Maximize2,
  Scale,
  Sparkles,
  Users,
  Eye,
  SlidersHorizontal,
  X,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SceneVisual } from '@/components/hotel/SceneVisual';
import {
  ROOM_TYPES,
  ROOMS,
  VIEW_LABEL,
  priceStay,
  roomsOfType,
  type BedKey,
  type RoomType,
  type ViewKind,
} from '@/lib/hotelCatalog';
import {
  availableRoomsOfType,
  nightsBetween,
  type StayQuery,
} from '@/lib/bookings';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

interface RoomCatalogProps {
  query: StayQuery;
  onSelectRoomType: (typeId: string) => void;
  onViewDetails: (typeId: string) => void;
  comparedIds: string[];
  onToggleCompare: (typeId: string) => void;
  onOpenCompare: () => void;
}

export function RoomCatalog({
  query,
  onSelectRoomType,
  onViewDetails,
  comparedIds,
  onToggleCompare,
  onOpenCompare,
}: RoomCatalogProps) {
  const { state } = useDemo();
  const [categoryFilter, setCategoryFilter] = useState<'All' | RoomType['category']>('All');
  const [bedFilter, setBedFilter] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<string>('all');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [maxRate, setMaxRate] = useState<number>(750);
  const [minGuests, setMinGuests] = useState<number>(1);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const nights = nightsBetween(query.checkIn, query.checkOut);

  // Compute live availability per room type using shared Front Desk state
  const availabilityMap = useMemo(() => {
    const map: Record<string, { total: number; available: number }> = {};
    for (const type of ROOM_TYPES) {
      const allUnits = roomsOfType(type.id);
      const freeUnits = availableRoomsOfType(state, type.id, query.checkIn, query.checkOut);
      map[type.id] = { total: allUnits.length, available: freeUnits.length };
    }
    return map;
  }, [state, query.checkIn, query.checkOut]);

  // Filtered list
  const filteredRooms = useMemo(() => {
    return ROOM_TYPES.filter((room) => {
      if (categoryFilter !== 'All' && room.category !== categoryFilter) return false;
      if (bedFilter !== 'all' && room.bedKey !== bedFilter) return false;
      if (accessibleOnly && !room.accessible) return false;
      if (room.rate > maxRate) return false;
      if (room.maxGuests < minGuests) return false;
      if (viewFilter !== 'all') {
        const units = roomsOfType(room.id);
        const hasView = units.some((u) => u.view === viewFilter);
        if (!hasView) return false;
      }
      return true;
    });
  }, [categoryFilter, bedFilter, accessibleOnly, maxRate, minGuests, viewFilter]);

  const categories: Array<'All' | RoomType['category']> = ['All', 'Standard', 'Deluxe', 'Accessible', 'Suite'];

  return (
    <section id="rooms" className="py-14 sm:py-20 border-t border-white/[0.08]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Room Discovery & Selection</span>
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Curated Accommodations
            </h2>
            <p className="mt-2 text-sm sm:text-base text-mist-300 max-w-2xl">
              From our intimate Deluxe Twin to the grand Presidential Residence, every space combines bespoke
              craftsmanship with modern comfort.
            </p>
          </div>

          {/* Quick summary of search query */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-mist-300 backdrop-blur self-start md:self-auto">
            <span className="font-semibold text-white">Selected Stay:</span> {query.checkIn} to {query.checkOut} ({nights} night{nights > 1 ? 's' : ''}), {query.adults + query.children} guest{query.adults + query.children > 1 ? 's' : ''}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
            <div role="tablist" aria-label="Room categories" className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === cat
                      ? 'bg-amber-400 text-ink-950 shadow-md font-bold'
                      : 'border border-white/10 text-mist-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-mist-200 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
              <span>{showFiltersMobile ? 'Hide Filters' : 'Refine Filters'}</span>
            </button>
          </div>

          {/* Refine Filters Tray */}
          {showFiltersMobile && (
            <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-4 backdrop-blur animate-in fade-in-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                {/* Bed Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-mist-300">Bed Configuration</label>
                  <select
                    value={bedFilter}
                    onChange={(e) => setBedFilter(e.target.value)}
                    className="field w-full text-xs"
                  >
                    <option value="all">Any Bed</option>
                    <option value="king">King Bed</option>
                    <option value="queen">Queen Bed</option>
                    <option value="twin">Twin Beds</option>
                  </select>
                </div>

                {/* View */}
                <div className="space-y-1">
                  <label className="font-semibold text-mist-300">Room View</label>
                  <select
                    value={viewFilter}
                    onChange={(e) => setViewFilter(e.target.value)}
                    className="field w-full text-xs"
                  >
                    <option value="all">Any View</option>
                    <option value="city">City View</option>
                    <option value="pool">Pool View</option>
                    <option value="garden">Garden View</option>
                    <option value="skyline">Skyline View</option>
                  </select>
                </div>

                {/* Min Guests */}
                <div className="space-y-1">
                  <label className="font-semibold text-mist-300">Min Capacity: {minGuests} guest{minGuests > 1 ? 's' : ''}</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={minGuests}
                    onChange={(e) => setMinGuests(Number(e.target.value))}
                    className="w-full accent-amber-400 mt-2"
                  />
                </div>

                {/* Max Budget */}
                <div className="space-y-1">
                  <label className="font-semibold text-mist-300">Max Nightly Rate: {money(maxRate)}</label>
                  <input
                    type="range"
                    min="195"
                    max="700"
                    step="25"
                    value={maxRate}
                    onChange={(e) => setMaxRate(Number(e.target.value))}
                    className="w-full accent-amber-400 mt-2"
                  />
                </div>

                {/* Accessible Toggle & Reset */}
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={accessibleOnly}
                      onChange={(e) => setAccessibleOnly(e.target.checked)}
                      className="rounded border-white/20 text-amber-400 focus:ring-amber-400"
                    />
                    <span className="font-medium text-mist-200">Accessible Only</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('All');
                      setBedFilter('all');
                      setViewFilter('all');
                      setAccessibleOnly(false);
                      setMaxRate(750);
                      setMinGuests(1);
                    }}
                    className="text-left text-[11px] text-amber-300 hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Cards Grid */}
        {filteredRooms.length === 0 ? (
          <div className="mt-12 grid place-items-center rounded-3xl border border-dashed border-white/10 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-mist-400" />
            <h3 className="mt-3 text-lg font-bold text-white">No room categories match your criteria</h3>
            <p className="mt-1 text-sm text-mist-300">Try broadening your rate budget or changing bed preferences.</p>
            <Button
              variant="subtle"
              size="sm"
              className="mt-4"
              onClick={() => {
                setCategoryFilter('All');
                setBedFilter('all');
                setViewFilter('all');
                setAccessibleOnly(false);
                setMaxRate(750);
                setMinGuests(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const avail = availabilityMap[room.id] ?? { total: 0, available: 0 };
              const isAvailable = avail.available > 0;
              const isCompared = comparedIds.includes(room.id);
              const pricing = priceStay(room.rate, nights);

              return (
                <div
                  key={room.id}
                  className="group relative flex flex-col rounded-3xl border border-white/[0.08] bg-ink-900/60 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-amber-400/30 hover:shadow-2xl overflow-hidden"
                >
                  {/* Artwork / Scene Preview */}
                  <div className="relative">
                    <SceneVisual
                      scene={room.scenes[0] ?? 'bedroom'}
                      aspect="video"
                      label={room.name}
                    />

                    {/* Category & Badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-ink-950/80 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur border border-amber-300/30">
                        {room.category}
                      </span>
                      {room.accessible && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur border border-emerald-400/30">
                          <Accessibility className="h-3 w-3" />
                          Accessible
                        </span>
                      )}
                    </div>

                    {/* Live Availability Pill */}
                    <div className="absolute top-3 right-3">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/85 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur border border-emerald-400/40 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {avail.available} {avail.available === 1 ? 'room' : 'rooms'} free
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/85 px-2.5 py-1 text-[11px] font-semibold text-rose-300 backdrop-blur border border-rose-400/40">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Room Body */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Title & Rate */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-bold text-white group-hover:text-amber-200 transition-colors">
                          {room.name}
                        </h3>
                        <p className="mt-1 text-xs text-mist-300 line-clamp-2">{room.blurb}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-display text-2xl font-bold text-white">
                          {money(room.rate)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-mist-400">
                          / night
                        </span>
                      </div>
                    </div>

                    {/* Room Quick Specs Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/[0.06] py-3 text-xs text-mist-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                        <span>Up to {room.maxGuests}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bed className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                        <span className="truncate">{room.bedLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                        <span>{room.areaSqm} m²</span>
                      </div>
                    </div>

                    {/* Signature Highlights */}
                    <div className="mt-3.5 flex-1 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
                        Signature Features:
                      </p>
                      <ul className="space-y-1 text-xs text-mist-200">
                        {room.signature.slice(0, 2).map((sig, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{sig}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price total for selected nights */}
                    <div className="mt-4 rounded-xl bg-white/[0.03] p-2.5 text-xs text-mist-300 border border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <span>Stay Total ({nights} night{nights > 1 ? 's' : ''}):</span>
                        <span className="font-bold text-white">{money(pricing.total)}</span>
                      </div>
                      <p className="text-[10px] text-mist-400 mt-0.5">
                        Includes resort fees & taxes (simulated demo)
                      </p>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(room.id)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                      >
                        <Eye className="h-3.5 w-3.5 text-mist-300" />
                        <span>View Details</span>
                      </button>

                      <Button
                        size="sm"
                        variant={isAvailable ? 'accent' : 'subtle'}
                        disabled={!isAvailable}
                        onClick={() => onSelectRoomType(room.id)}
                        className="flex-1 justify-center"
                      >
                        {isAvailable ? 'Book This Room' : 'Sold Out'}
                      </Button>
                    </div>

                    {/* Compare checkbox */}
                    <div className="mt-3 flex items-center justify-between text-xs text-mist-400">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => onToggleCompare(room.id)}
                          className="rounded border-white/20 text-amber-400 focus:ring-amber-400"
                        />
                        <span>Compare side-by-side</span>
                      </label>

                      <span className="text-[10px] text-mist-500">
                        {avail.total} total in property
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Compare Tray when rooms are selected */}
        {comparedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-ink-950/95 px-5 py-3 shadow-2xl backdrop-blur-xl ring-1 ring-amber-400/20">
            <Scale className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-medium text-white">
              <strong className="text-amber-300">{comparedIds.length}</strong> room{comparedIds.length > 1 ? 's' : ''} selected to compare
            </span>
            <Button size="sm" variant="accent" onClick={onOpenCompare}>
              Compare Now
            </Button>
            <button
              type="button"
              onClick={() => {
                comparedIds.forEach((id) => onToggleCompare(id));
              }}
              className="text-mist-400 hover:text-white p-1"
              title="Clear comparison list"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
