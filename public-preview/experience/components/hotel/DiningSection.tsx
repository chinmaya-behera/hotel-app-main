'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Users,
  Wine,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SceneVisual } from '@/components/hotel/SceneVisual';
import { menuItems } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

export function DiningSection() {
  const { notify, submitEnquiry } = useDemo();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Starters' | 'Mains' | 'Drinks' | 'Desserts'>('All');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Form
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}));
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');

  const filteredMenu = activeCategory === 'All'
    ? menuItems
    : menuItems.filter((m) => m.category === activeCategory);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
    submitEnquiry({kind:'dining',name,details:date+' · '+time+' · '+guests+' guests'});
  };

  return (
    <section id="dining" className="py-14 sm:py-20 border-t border-white/[0.08]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span>Epicurean Journeys</span>
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Fine Dining & Skyline Lounge
            </h2>
            <p className="mt-2 text-sm sm:text-base text-mist-300 max-w-2xl">
              From fresh morning coastal fare to handcrafted evening cocktails under the stars. Room service is also
              available 24/7 directly through the in-room Guest Portal.
            </p>
          </div>

          <Button
            size="sm"
            variant="accent"
            iconLeft={Calendar}
            onClick={() => {
              setInquirySubmitted(false);
              setInquiryOpen(true);
            }}
          >
            Reserve a Table
          </Button>
        </div>

        {/* Venues Showcase Cards */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Venue 1 */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-6 backdrop-blur shadow-xl space-y-4">
            <SceneVisual scene="dining" aspect="video" label="The Azure Bistro & Terrace · Ground Floor" />
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold text-white">The Azure Bistro & Terrace</h3>
                <span className="rounded-full bg-amber-400/10 border border-amber-300/30 px-3 py-1 text-xs font-semibold text-amber-300">
                  Breakfast & Dinner
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-mist-300 leading-relaxed">
                Artisan farm-to-table cuisine, dry-aged steaks, and locally caught seafood prepared in an open theatre
                kitchen with al fresco terrace seating overlooking the garden courtyard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-mist-400 border-t border-white/[0.06] pt-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                Breakfast: 06:30 – 11:00
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                Dinner: 18:00 – 23:00
              </span>
            </div>
          </div>

          {/* Venue 2 */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-6 backdrop-blur shadow-xl space-y-4">
            <SceneVisual scene="rooftop" aspect="video" label="Skyline Lounge & Terrace · Level 5" />
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold text-white">Skyline Lounge & Terrace</h3>
                <span className="rounded-full bg-purple-400/10 border border-purple-300/30 px-3 py-1 text-xs font-semibold text-purple-300">
                  Evening Cocktails
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-mist-300 leading-relaxed">
                Perched high above the resort on Level 5, the Skyline Lounge features bespoke botanical mixology,
                sommelier-curated vintages, and light tapas with sweeping 360-degree twilight city views.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-mist-400 border-t border-white/[0.06] pt-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                Sunset Hours: 17:00 – 01:00
              </span>
              <span className="flex items-center gap-1">
                <Wine className="h-3.5 w-3.5 text-amber-300" />
                Dress code: Smart casual
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Menu Preview */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-ink-900/40 p-6 sm:p-8 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">Selected Menu Highlights</h3>
              <p className="text-xs text-mist-400 mt-0.5">Also available for order via the in-room Guest Portal</p>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Starters', 'Mains', 'Drinks', 'Desserts'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activeCategory === cat
                      ? 'bg-amber-400 text-ink-950 font-bold'
                      : 'border border-white/10 text-mist-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-white/15 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-xs sm:text-sm">{item.name}</h4>
                    {item.veg && (
                      <span className="rounded bg-emerald-500/20 text-emerald-300 px-1 py-0.2 text-[9px] font-bold">
                        VEG
                      </span>
                    )}
                  </div>
                  {item.desc && <p className="text-[11px] text-mist-400 mt-1">{item.desc}</p>}
                </div>
                <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                  {money(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Reservation Modal */}
        {inquiryOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-md"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-ink-900 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setInquiryOpen(false)}
                className="absolute top-4 right-4 text-mist-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {!inquirySubmitted ? (
                <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>Restaurant Reservation</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">Reserve a Dining Table</h3>

                  <div className="space-y-1">
                    <label className="font-semibold text-mist-200">Guest Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-mist-200">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="field w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-mist-200">Time</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="field w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-mist-200">Number of Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="field w-full text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} Guests
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="accent" size="md" className="w-full justify-center">
                      Confirm Table Inquiry
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-white">Inquiry Received</h4>
                  <p className="text-xs text-mist-300">
                    Table reserved for <strong className="text-white">{name}</strong> on {date} at {time} for {guests} guests.
                    (Simulated demo).
                  </p>
                  <Button variant="subtle" size="sm" onClick={() => setInquiryOpen(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
