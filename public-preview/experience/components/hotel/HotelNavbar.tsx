'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Compass,
  Flower2,
  Hotel,
  House,
  Image as ImageIcon,
  KeyRound,
  LogIn,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useDemo } from '@/lib/store';
import { HOTEL_NAME } from '@/lib/hotelCatalog';

interface HotelNavbarProps {
  onOpenBooking: () => void;
  onOpenManage: () => void;
  activeSection?: string;
}

export function HotelNavbar({ onOpenBooking, onOpenManage, activeSection }: HotelNavbarProps) {
  const { state } = useDemo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bookingCount = state.bookings.filter((b) => b.status !== 'cancelled').length;

  const navLinks = [
    { label: 'Rooms & Suites', href: '#rooms', icon: BedDouble },
    { label: 'Floor Explorer', href: '#explorer', icon: Compass },
    { label: 'Dining', href: '#dining', icon: UtensilsCrossed },
    { label: 'Wellness & Spa', href: '#spa', icon: Flower2 },
    { label: 'Gallery', href: '#gallery', icon: ImageIcon },
    { label: 'Location', href: '#location', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3" aria-label={`${HOTEL_NAME} Public Website`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-300/10 to-transparent border border-amber-300/30 text-amber-300 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Hotel className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
              {HOTEL_NAME}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.24em] text-amber-200/70 font-semibold">
              Resort & Residences
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav aria-label="Main hotel navigation" className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-mist-200 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenManage}
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            <span>Manage Stay</span>
            {bookingCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-ink-950">
                {bookingCount}
              </span>
            )}
          </button>

          <Button size="sm" variant="accent" iconLeft={Sparkles} onClick={onOpenBooking}>
            Book a Room
          </Button>

          <div className="mx-1 h-5 w-px bg-white/10" aria-hidden />

          <ThemeToggle />

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-300/20 transition shadow-sm"
            title="Open Staff Portals & Simulated Demo Login"
          >
            <LogIn className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            <span>Staff Login</span>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist-200"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-white/10 bg-ink-950/95 px-4 py-4 backdrop-blur-xl animate-in slide-in-from-top-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mist-200 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-amber-300" aria-hidden />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenManage();
              }}
              className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-300" />
                Manage Booking / Pre-Arrival
              </span>
              {bookingCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-ink-950">
                  {bookingCount} active
                </span>
              )}
            </button>

            <Button
              size="md"
              variant="accent"
              iconLeft={Sparkles}
              className="w-full justify-center"
              onClick={() => {
                setMobileOpen(false);
                onOpenBooking();
              }}
            >
              Book a Room Now
            </Button>

            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 py-2.5 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-300/20"
            >
              <LogIn className="h-4 w-4" />
              Staff Login (Simulated Roles)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
