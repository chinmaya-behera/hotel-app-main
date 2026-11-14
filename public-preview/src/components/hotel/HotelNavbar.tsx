'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BedDouble,
  Compass,
  Flower2,
  Hotel,
  House,
  Image as ImageIcon,
  KeyRound,
  Loader2,
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
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useDemo } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { HOTEL_NAME } from '@/lib/hotelCatalog';

interface HotelNavbarProps {
  onOpenBooking: () => void;
  onOpenManage: () => void;
  activeSection?: string;
}

export function HotelNavbar({ onOpenBooking, onOpenManage, activeSection }: HotelNavbarProps) {
  const { state } = useDemo();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/login');
  }, [router]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bookingCount = state.bookings.filter((b) => b.status !== 'cancelled').length;

  const navLinks = [
    { label: t('nav.roomsSuites'), href: '#rooms', icon: BedDouble },
    { label: t('nav.floorExplorer'), href: '#explorer', icon: Compass },
    { label: t('nav.dining'), href: '#dining', icon: UtensilsCrossed },
    { label: t('nav.wellnessSpa'), href: '#spa', icon: Flower2 },
    { label: t('nav.gallery'), href: '#gallery', icon: ImageIcon },
    { label: 'Location', href: '#location', icon: MapPin },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? 'bg-ink-950/90 dark:bg-ink-950/95 backdrop-blur-2xl py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] border-b border-amber-500/20'
          : 'bg-ink-950/75 dark:bg-ink-950/80 backdrop-blur-xl py-3.5 border-b border-ink-900/10 dark:border-white/[0.08]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3" aria-label={`${HOTEL_NAME} Public Website`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-600 dark:text-amber-300 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-amber-400 group-hover:text-slate-950">
            <Hotel className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {HOTEL_NAME}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200/80 font-semibold">
              Resort & Residences
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links - Centered Floating Capsule */}
        <nav
          aria-label="Main hotel navigation"
          className="hidden lg:flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] p-1.5 backdrop-blur-md shadow-inner"
        >
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-slate-950 hover:bg-amber-400 dark:hover:bg-amber-400 hover:shadow-[0_2px_12px_rgba(251,191,36,0.35)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Manage Stay Glass Button */}
          <button
            type="button"
            onClick={onOpenManage}
            className="group relative inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 dark:border-white/15 bg-white/70 dark:bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-white hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 dark:hover:bg-amber-400 dark:hover:text-slate-950 dark:hover:border-amber-400 hover:shadow-[0_2px_12px_rgba(251,191,36,0.35)] hover:scale-105 transition-all duration-200 active:scale-95 shadow-xs"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 group-hover:text-slate-950 transition-colors" aria-hidden />
            <span>{t('nav.manageStay')}</span>
            {bookingCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-amber-400 shadow-sm animate-pulse">
                {bookingCount}
              </span>
            )}
          </button>

          {/* Luxury Primary Book CTA */}
          <button
            type="button"
            onClick={onOpenBooking}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-1.5 text-xs font-bold text-ink-950 shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all duration-300 hover:shadow-[0_4px_22px_rgba(245,158,11,0.55)] hover:scale-[1.03] active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-ink-950 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" aria-hidden />
            <span>{t('nav.bookRoom')}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
          </button>

          {/* Unified Utility Group */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] p-1 backdrop-blur-md">
            <LanguageSelector />
            <ThemeToggle className="hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 transition-colors rounded-lg" />
          </div>

          {/* Staff Login Pill */}
          <Link
            href="/login"
            prefetch={true}
            onClick={() => setIsNavigatingToLogin(true)}
            onMouseEnter={() => router.prefetch('/login')}
            className="group inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 dark:border-amber-400/35 bg-amber-500/10 dark:bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:text-slate-950 dark:hover:text-slate-950 hover:bg-amber-400 dark:hover:bg-amber-400 hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-[0_2px_12px_rgba(251,191,36,0.35)] hover:scale-105 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Open Staff Portals & Simulated Demo Login"
          >
            {isNavigatingToLogin ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" aria-hidden />
                <span>Opening...</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300 group-hover:text-slate-950 transition-colors" aria-hidden />
                <span>{t('nav.staffLogin')}</span>
              </>
            )}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white active:scale-90 transition-transform"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile luxury drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-amber-400/20 bg-ink-950/95 px-4 py-5 backdrop-blur-2xl animate-in slide-in-from-top-4 shadow-2xl">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-amber-400 hover:text-slate-950 transition-all duration-200"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400/15 text-amber-300 group-hover:bg-slate-950 group-hover:text-amber-400 transition-colors">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenManage();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white active:scale-98 transition"
            >
              <span className="flex items-center gap-2.5">
                <KeyRound className="h-4 w-4 text-amber-300" />
                <span>Manage Booking / Pre-Arrival</span>
              </span>
              {bookingCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-ink-950">
                  {bookingCount} active
                </span>
              )}
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 py-3 text-sm font-bold text-ink-950 shadow-lg shadow-amber-500/25 active:scale-98 transition"
              onClick={() => {
                setMobileOpen(false);
                onOpenBooking();
              }}
            >
              <Sparkles className="h-4 w-4 text-ink-950" />
              <span>Book a Room Now</span>
            </button>

            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 py-2.5 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-300/20 active:scale-98 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Staff Login (Simulated Roles)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
