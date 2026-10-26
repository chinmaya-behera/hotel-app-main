'use client';

import { useState } from 'react';
import {
  Accessibility,
  ArrowRight,
  Check,
  Crown,
  Maximize2,
  Sparkles,
  Users,
  X,
  Bed,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SceneVisual } from '@/components/hotel/SceneVisual';
import {
  AMENITIES,
  VIEW_LABEL,
  priceStay,
  roomTypeById,
  roomsOfType,
  uniqueAmenities,
  type SceneKind,
} from '@/lib/hotelCatalog';
import {
  availableRoomsOfType,
  nightsBetween,
  type StayQuery,
} from '@/lib/bookings';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

interface RoomDetailModalProps {
  typeId: string | null;
  query: StayQuery;
  onClose: () => void;
  onBook: (typeId: string) => void;
}

export function RoomDetailModal({ typeId, query, onClose, onBook }: RoomDetailModalProps) {
  const { state } = useDemo();
  const room = typeId ? roomTypeById[typeId] : null;
  const [activeScene, setActiveScene] = useState<SceneKind | null>(null);

  if (!room) return null;

  const currentScene = activeScene ?? room.scenes[0] ?? 'bedroom';
  const nights = nightsBetween(query.checkIn, query.checkOut);
  const pricing = priceStay(room.rate, nights);
  const freeUnits = availableRoomsOfType(state, room.id, query.checkIn, query.checkOut);
  const isAvailable = freeUnits.length > 0;
  const uniqueAmens = uniqueAmenities(room.id);
  const totalUnits = roomsOfType(room.id).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-ink-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-300 hover:text-white hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-400/15 border border-amber-300/30 px-3 py-1 text-xs font-bold text-amber-300">
              {room.category}
            </span>
            {room.accessible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                <Accessibility className="h-3.5 w-3.5" />
                Accessible Suite
              </span>
            )}
            <span className="text-[11px] text-mist-400 uppercase tracking-wider">
              {room.basis === 'source' ? 'Project Specification' : 'Demo Catalog'}
            </span>
          </div>

          <h3 id="room-detail-title" className="font-display text-2xl sm:text-4xl font-bold text-white mt-2">
            {room.name}
          </h3>
          <p className="mt-1 text-sm text-mist-200">{room.blurb}</p>
        </div>

        {/* Scene Gallery Artwork */}
        <div className="mt-6 space-y-3">
          <SceneVisual scene={currentScene} aspect="video" label={`${room.name} · ${currentScene}`} />

          {/* Scene selector thumbnails */}
          {room.scenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {room.scenes.map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setActiveScene(sc)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    currentScene === sc
                      ? 'bg-amber-400 text-ink-950 font-bold'
                      : 'border border-white/10 bg-white/5 text-mist-300 hover:text-white'
                  }`}
                >
                  {sc.replace('-', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Key Specifications Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-white/[0.08] py-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-mist-400">Total Capacity</span>
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-amber-300" />
              Up to {room.maxGuests} guests
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-mist-400">Bed Arrangement</span>
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-amber-300" />
              {room.bedLabel}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-mist-400">Floor Space</span>
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Maximize2 className="h-4 w-4 text-amber-300" />
              {room.areaSqm} m² (approx)
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-mist-400">Inventory</span>
            <p className="font-semibold text-white">
              {totalUnits} units on property
            </p>
          </div>
        </div>

        {/* Signature Distinctions */}
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Signature Differentiators
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {room.signature.map((sig, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-amber-400/10 border border-amber-300/20 p-2.5 text-amber-200">
                <Check className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                <span>{sig}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities Grid */}
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-mist-300">
            Room Amenities & Comforts
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {room.amenities.map((amenId) => {
              const def = AMENITIES[amenId];
              if (!def) return null;
              const Icon = def.icon;
              const isUnique = uniqueAmens.includes(amenId);
              return (
                <div
                  key={amenId}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs ${
                    isUnique
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 font-medium'
                      : 'border-white/5 bg-white/[0.02] text-mist-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isUnique ? 'text-amber-300' : 'text-mist-400'}`} />
                  <span className="truncate">{def.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* What is Included */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-mist-300 space-y-2">
          <h4 className="font-semibold text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Included with every stay:
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {room.included.map((inc, i) => (
              <li key={i} className="flex items-center gap-1.5 text-mist-200">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>{inc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price & Booking Footer */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-white">{money(room.rate)}</span>
              <span className="text-xs text-mist-400">per night</span>
            </div>
            <p className="text-xs text-mist-300 mt-0.5">
              Total stay ({nights} nights): <strong className="text-white">{money(pricing.total)}</strong> (incl. resort fee & taxes)
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="subtle" size="md" onClick={onClose} className="flex-1 sm:flex-initial">
              Back to Catalog
            </Button>
            <Button
              variant={isAvailable ? 'accent' : 'subtle'}
              size="md"
              disabled={!isAvailable}
              onClick={() => {
                onClose();
                onBook(room.id);
              }}
              iconRight={ArrowRight}
              className="flex-1 sm:flex-initial font-bold"
            >
              {isAvailable ? 'Book This Room' : 'Sold Out for Dates'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
