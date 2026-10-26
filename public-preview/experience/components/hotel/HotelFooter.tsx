'use client';

import Link from 'next/link';
import { ArrowUp, Hotel, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { HOTEL_NAME, POLICIES } from '@/lib/hotelCatalog';

interface HotelFooterProps {
  onOpenManage: () => void;
  onOpenBooking: () => void;
}

export function HotelFooter({ onOpenManage, onOpenBooking }: HotelFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 bg-ink-950 pt-16 pb-12 text-xs text-mist-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-white/[0.08]">
          {/* Brand Col (1-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 border border-amber-300/30 text-amber-300">
                <Hotel className="h-5 w-5" />
              </span>
              <div>
                <span className="block font-display text-lg font-bold text-white tracking-tight">
                  {HOTEL_NAME}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
                  Resort & Residences
                </span>
              </div>
            </div>

            <p className="text-mist-300 text-xs leading-relaxed max-w-sm">
              An architectural beachfront resort offering 27 boutique guest suites across 5 floors, world-class dining,
              and seamless connected guest workflows.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenManage}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-300" />
                <span>Manage My Stay</span>
              </button>
              <button
                type="button"
                onClick={onOpenBooking}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-ink-950 hover:bg-amber-300 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Book a Room</span>
              </button>
            </div>
          </div>

          {/* Nav Links (Col 5-7) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-white text-[11px]">
              Property Discovery
            </h4>
            <ul className="space-y-2 text-mist-300">
              <li>
                <a href="#rooms" className="hover:text-amber-300 transition">
                  Rooms & Suites Catalog
                </a>
              </li>
              <li>
                <a href="#explorer" className="hover:text-amber-300 transition">
                  Floor-by-Floor Interactive Map
                </a>
              </li>
              <li>
                <a href="#dining" className="hover:text-amber-300 transition">
                  The Azure Bistro & Skyline Lounge
                </a>
              </li>
              <li>
                <a href="#spa" className="hover:text-amber-300 transition">
                  Wellness Sanctuary & Pool Deck
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-amber-300 transition">
                  Resort Photography & Gallery
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-amber-300 transition">
                  Location & Contact Concierge
                </a>
              </li>
            </ul>
          </div>

          {/* Connected Workflows & Staff Switcher (Col 8-10) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-white text-[11px]">
              Connected Prototype Hubs
            </h4>
            <ul className="space-y-2 text-mist-300">
              <li>
                <Link href="/guest/portal?room=402" className="hover:text-teal-300 transition flex items-center gap-1.5">
                  <span>In-Room Guest QR Portal (Room 402)</span>
                </Link>
              </li>
              <li>
                <Link href="/staff/front-desk" className="hover:text-amber-300 transition">
                  Front Desk Coordinator Console
                </Link>
              </li>
              <li>
                <Link href="/staff/duty-manager" className="hover:text-amber-300 transition">
                  Duty Manager & Service Recovery
                </Link>
              </li>
              <li>
                <Link href="/staff/finance" className="hover:text-amber-300 transition">
                  Financial Operations & Refunds
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-amber-300 transition">
                  Sprint Demo Control & Role Switcher
                </Link>
              </li>
            </ul>
          </div>

          {/* Back to top (Col 11-12) */}
          <div className="lg:col-span-2 flex flex-col justify-between items-start lg:items-end">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-mist-200 hover:text-white hover:bg-white/10 transition"
              aria-label="Back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <div className="text-[11px] text-mist-500 pt-6">
              24-Hour Front Office
            </div>
          </div>
        </div>

        {/* Hotel Policies Drawer Summary */}
        <div className="py-6 border-b border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px] text-mist-400">
          {POLICIES.slice(0, 4).map((p, i) => (
            <div key={i} className="space-y-1">
              <span className="font-semibold text-white block">{p.title}</span>
              <p className="leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom copyright & simulation note */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-mist-500">
          <p>
            © 2026 {HOTEL_NAME}. Frontend-only architectural prototype. All guest stays, rates, and payments are simulated in browser state.
          </p>
          <div className="flex items-center gap-2 text-amber-300/80 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Zero Backend Footprint · In-Browser Simulation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
