'use client';

import { useState } from 'react';
import {
  Calendar,
  Compass,
  MapPin,
  Search,
  Sparkles,
  Users,
  ShieldCheck,
  Building,
  Utensils,
  Flower2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DEMO_TODAY,
  addDays,
  nightsBetween,
  queryError,
  type StayQuery,
} from '@/lib/bookings';
import { HOTEL_NAME } from '@/lib/hotelCatalog';

interface HotelHeroProps {
  initialQuery: StayQuery;
  onSearch: (q: StayQuery) => void;
  onOpenExplorer: () => void;
}

export function HotelHero({ initialQuery, onSearch, onOpenExplorer }: HotelHeroProps) {
  const [checkIn, setCheckIn] = useState(initialQuery.checkIn);
  const [checkOut, setCheckOut] = useState(initialQuery.checkOut);
  const [adults, setAdults] = useState(initialQuery.adults);
  const [children, setChildren] = useState(initialQuery.children);

  const currentQuery: StayQuery = { checkIn, checkOut, adults, children };
  const err = queryError(currentQuery);
  const nights = nightsBetween(checkIn, checkOut);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!err) {
      onSearch(currentQuery);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[480px] w-[800px] rounded-full bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-sky-500/15 blur-3xl opacity-70" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>Welcome to {HOTEL_NAME} · Seaside City Resort</span>
          </div>

          {/* Main Title */}
          <h1 className="mt-5 font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Where Timeless <span className="text-gradient">Luxury</span> Meets Coastal Calm
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-mist-200 leading-relaxed max-w-2xl mx-auto">
            Discover 27 curated rooms across 5 boutique floors, artisan dining, and private wellness terraces.
            Connected seamlessly with live front-desk readiness and digital guest convenience.
          </p>

          {/* Hallmarks pills */}
          <div className="mt-7 flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs text-mist-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <Building className="h-3.5 w-3.5 text-amber-300" />
              27 Signature Rooms & Suites
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <Compass className="h-3.5 w-3.5 text-sky-300" />
              5 Interactive Floor Plans
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <Flower2 className="h-3.5 w-3.5 text-emerald-300" />
              Spa, Pool & Sky Lounge
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
              Live PMS Sync Demo
            </span>
          </div>
        </div>

        {/* Hero Search & Booking Bar */}
        <div className="mt-10 max-w-5xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="rounded-3xl border border-white/15 bg-ink-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              {/* Check-in */}
              <div className="space-y-1.5">
                <label htmlFor="hero-check-in" className="flex items-center gap-1.5 text-xs font-semibold text-mist-300">
                  <Calendar className="h-3.5 w-3.5 text-amber-300" />
                  Check-in Date
                </label>
                <input
                  id="hero-check-in"
                  type="date"
                  min={DEMO_TODAY}
                  value={checkIn}
                  onChange={(e) => {
                    const newIn = e.target.value;
                    setCheckIn(newIn);
                    if (newIn >= checkOut) {
                      setCheckOut(addDays(newIn, 2));
                    }
                  }}
                  className="field w-full text-sm font-medium"
                  required
                />
              </div>

              {/* Check-out */}
              <div className="space-y-1.5">
                <label htmlFor="hero-check-out" className="flex items-center gap-1.5 text-xs font-semibold text-mist-300">
                  <Calendar className="h-3.5 w-3.5 text-amber-300" />
                  Check-out Date
                  {nights > 0 && (
                    <span className="ml-auto text-[11px] font-normal text-amber-300">
                      ({nights} night{nights > 1 ? 's' : ''})
                    </span>
                  )}
                </label>
                <input
                  id="hero-check-out"
                  type="date"
                  min={addDays(checkIn, 1)}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="field w-full text-sm font-medium"
                  required
                />
              </div>

              {/* Guests */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-mist-300">
                  <Users className="h-3.5 w-3.5 text-amber-300" />
                  Guests & Party
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="field text-xs font-medium"
                    aria-label="Adults count"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Adult{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="field text-xs font-medium"
                    aria-label="Children count"
                  >
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} Child{n !== 1 ? 'ren' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 pt-1 lg:pt-0">
                <Button
                  type="submit"
                  size="md"
                  variant="accent"
                  iconLeft={Search}
                  className="w-full justify-center text-sm font-semibold shadow-lg"
                  disabled={Boolean(err)}
                >
                  Find Available Rooms
                </Button>
              </div>
            </div>

            {/* Validation or hint message */}
            <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/[0.08] pt-3 text-xs">
              {err ? (
                <span className="text-rose-400 font-medium">{err}</span>
              ) : (
                <span className="text-mist-400">
                  ✨ Demo dates default to today ({DEMO_TODAY}). Live pricing includes resort fees & demo taxes.
                </span>
              )}

              <button
                type="button"
                onClick={onOpenExplorer}
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition font-semibold"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Explore Floor-by-Floor Map</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
