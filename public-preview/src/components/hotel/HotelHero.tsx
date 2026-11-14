'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import heroBg from '@/image/twilight-infinity-pool.png';
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
import { AnimatedHeroTitle } from './AnimatedHeroTitle';

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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentQuery: StayQuery = { checkIn, checkOut, adults, children };
  const err = queryError(currentQuery);
  const nights = nightsBetween(checkIn, checkOut);

  // Parallax and fade calculations during scroll
  const textTranslateY = Math.max(-100, -scrollY * 0.15);
  const textOpacity = Math.max(0, 1 - scrollY / 600);
  const bgTranslateY = scrollY * 0.08;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!err) {
      onSearch(currentQuery);
    }
  };

  return (
    <section className="relative isolate overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Hero Background Image & Layered Soft Black Left Gradient */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none transition-transform duration-75 ease-out"
        style={{ transform: `translate3d(0, ${bgTranslateY}px, 0)` }}
      >
        {/* The Twilight Infinity Pool Image */}
        <Image
          src={heroBg}
          alt="Twilight Infinity Pool Paradise"
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-[70%_center]"
        />

        {/* Soft, gentle black gradient from the left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent w-full md:w-1/2" />

        {/* Subtle soft bottom feathering */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />

        {/* Ambient warm glow accent */}
        <div className="absolute -top-24 left-1/4 h-[420px] w-[600px] rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/10 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div 
          className="text-center max-w-3xl mx-auto transition-all duration-150 ease-out"
          style={{
            transform: `translate3d(0, ${textTranslateY}px, 0)`,
            opacity: textOpacity,
          }}
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1 text-xs font-semibold text-[#ffffff] backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            <span className="text-[#ffffff]">Welcome to {HOTEL_NAME} · Seaside City Resort</span>
          </div>

          {/* Main Title: Animated with handwriting typing effect and scroll revealing dynamics */}
          <AnimatedHeroTitle />

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-[#ffffff] leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
            Discover 27 curated rooms across 5 boutique floors, artisan dining, and private wellness terraces.
            Connected seamlessly with live front-desk readiness and digital guest convenience.
          </p>

          {/* Hallmarks pills */}
          <div className="mt-7 flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs text-[#ffffff]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#ffffff]">
              <Building className="h-3.5 w-3.5 text-amber-300" />
              <span>27 Signature Rooms & Suites</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#ffffff]">
              <Compass className="h-3.5 w-3.5 text-sky-300" />
              <span>5 Interactive Floor Plans</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#ffffff]">
              <Flower2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>Spa, Pool & Sky Lounge</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[#ffffff]">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
              <span>Live PMS Sync Demo</span>
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
