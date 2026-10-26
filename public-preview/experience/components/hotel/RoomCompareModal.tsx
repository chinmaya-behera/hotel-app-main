'use client';

import {
  Accessibility,
  ArrowRight,
  Check,
  Crown,
  Minus,
  Scale,
  Sparkles,
  Users,
  X,
  Bed,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  AMENITIES,
  priceStay,
  roomTypeById,
  type AmenityId,
  type RoomType,
} from '@/lib/hotelCatalog';
import {
  availableRoomsOfType,
  nightsBetween,
  type StayQuery,
} from '@/lib/bookings';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

interface RoomCompareModalProps {
  typeIds: string[];
  query: StayQuery;
  onClose: () => void;
  onRemove: (id: string) => void;
  onBook: (typeId: string) => void;
}

export function RoomCompareModal({
  typeIds,
  query,
  onClose,
  onRemove,
  onBook,
}: RoomCompareModalProps) {
  const { state } = useDemo();
  const rooms = typeIds.map((id) => roomTypeById[id]).filter(Boolean) as RoomType[];
  const nights = nightsBetween(query.checkIn, query.checkOut);

  if (rooms.length === 0) return null;

  const allAmenities = Object.keys(AMENITIES) as AmenityId[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="fixed inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl rounded-3xl border border-white/15 bg-ink-900/95 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Scale className="h-4 w-4" />
              <span>Side-by-Side Comparison</span>
            </div>
            <h3 id="compare-modal-title" className="font-display text-2xl font-bold text-white mt-1">
              Compare Room Categories & Specifications
            </h3>
            <p className="text-xs text-mist-300 mt-0.5">
              Comparing {rooms.length} room types for {nights} night{nights > 1 ? 's' : ''} ({query.checkIn} to {query.checkOut}).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comparison Table Grid */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 font-semibold text-mist-400 w-44">Feature / Metric</th>
                {rooms.map((room) => {
                  const free = availableRoomsOfType(state, room.id, query.checkIn, query.checkOut).length;
                  const pricing = priceStay(room.rate, nights);
                  return (
                    <th key={room.id} className="p-3 min-w-[200px] align-top">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-300">
                            {room.category}
                          </span>
                          <h4 className="font-display text-base font-bold text-white">{room.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemove(room.id)}
                          className="text-mist-400 hover:text-rose-400 p-1"
                          title="Remove from comparison"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 text-sm font-bold text-white">
                        {money(room.rate)} <span className="text-[10px] text-mist-400 font-normal">/ night</span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-medium">
                        Total {money(pricing.total)}
                      </div>

                      <div className="mt-2">
                        {free > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {free} available
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-400">Sold out</span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={free > 0 ? 'accent' : 'subtle'}
                        disabled={free === 0}
                        onClick={() => {
                          onClose();
                          onBook(room.id);
                        }}
                        className="w-full mt-3 justify-center"
                      >
                        {free > 0 ? 'Book Room' : 'Unavailable'}
                      </Button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05] text-mist-200">
              {/* Capacity */}
              <tr>
                <td className="p-3 font-semibold text-mist-400">Guest Capacity</td>
                {rooms.map((r) => (
                  <td key={r.id} className="p-3">
                    Up to {r.maxGuests} guests ({r.maxAdults} adults max)
                  </td>
                ))}
              </tr>

              {/* Bed */}
              <tr>
                <td className="p-3 font-semibold text-mist-400">Bedding Configuration</td>
                {rooms.map((r) => (
                  <td key={r.id} className="p-3 font-medium text-white">
                    {r.bedLabel}
                  </td>
                ))}
              </tr>

              {/* Floor Space */}
              <tr>
                <td className="p-3 font-semibold text-mist-400">Room Area</td>
                {rooms.map((r) => (
                  <td key={r.id} className="p-3">
                    {r.areaSqm} m² (approx)
                  </td>
                ))}
              </tr>

              {/* Accessibility */}
              <tr>
                <td className="p-3 font-semibold text-mist-400">Accessibility</td>
                {rooms.map((r) => (
                  <td key={r.id} className="p-3">
                    {r.accessible ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Roll-in, grab rails & wide door
                      </span>
                    ) : (
                      <span className="text-mist-500">Standard layout</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Signature Feature */}
              <tr>
                <td className="p-3 font-semibold text-mist-400">Signature Differentiator</td>
                {rooms.map((r) => (
                  <td key={r.id} className="p-3 text-amber-200">
                    {r.signature.join(' · ')}
                  </td>
                ))}
              </tr>

              {/* Amenities matrix rows */}
              {allAmenities.map((amenId) => {
                const def = AMENITIES[amenId];
                if (!def) return null;
                const Icon = def.icon;
                return (
                  <tr key={amenId}>
                    <td className="p-3 text-mist-300 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-mist-400" />
                      <span>{def.label}</span>
                    </td>
                    {rooms.map((r) => {
                      const has = r.amenities.includes(amenId);
                      return (
                        <td key={r.id} className="p-3">
                          {has ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Minus className="h-3.5 w-3.5 text-mist-600" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
