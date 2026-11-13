'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  Wrench,
  Flower2,
  MessageSquare,
  Bell,
  MoonStar,
  HeartHandshake,
  PackageSearch,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Layers,
  PartyPopper,
  Scale,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import { GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps, GuestTabId, GuestServicesSubtab } from '@/components/guest/types';
import { DEFAULT_EVENTS_CARD_IMAGE } from './eventsData';

// Specialized views for deep navigation when a service is opened
import { DiningSection } from './DiningSection';
import { RoomServiceTab } from './RoomServiceTab';
import { ComplaintsSection } from './ComplaintsSection';
import { LostFoundSection } from './LostFoundSection';
import { ToFrontDeskSubtab } from './ToFrontDeskSubtab';
import { RemindersSubtab } from './RemindersSubtab';
import { DndSubtab } from './DndSubtab';
import { MyFolioSubtab } from './MyFolioSubtab';
import { BookServiceSubtab } from './BookServiceSubtab';
import { HousekeepingCatalogueSection } from './HousekeepingCatalogueSection';
import { MaintenanceTab } from './MaintenanceTab';
import { SpaConciergeTab } from './SpaConciergeTab';
import { EventsCelebrationsSection } from './EventsCelebrationsSection';

export function AllServicesSection({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const { state, updateDndStatus } = useDemo();
  const prefs = state.guestPreferences?.[room];
  const folioLines = state.folios?.[room] ?? [];
  const currentBalance = folioLines.reduce((sum, l) => sum + l.amount, 0);

  const guestPalette = state.guestPalette ?? 'burgundy';
  const guestTheme = state.guestTheme ?? 'light';
  const isDark = guestTheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'room' | 'dining' | 'desk' | 'finance'>('all');
  const [activeSubView, setActiveSubView] = useState<GuestServicesSubtab | null>(
    (initialSubtab as GuestServicesSubtab) && initialSubtab !== 'all' ? (initialSubtab as GuestServicesSubtab) : null,
  );

  useEffect(() => {
    setActiveSubView(
      initialSubtab && initialSubtab !== 'all' ? (initialSubtab as GuestServicesSubtab) : null
    );
  }, [initialSubtab]);

  const isEventsEnabled = state.eventsConfig?.enabled !== false;
  const eventsCardImage = state.eventsConfig?.cardImage || DEFAULT_EVENTS_CARD_IMAGE;
  const eventsSubtitle = state.eventsConfig?.subtitle || 'Plan your special moments with us.';

  const SERVICES = [
    ...(isEventsEnabled
      ? [
          {
            id: 'events_celebrations' as const,
            name: 'Events & Celebrations 🎉',
            category: 'dining' as const,
            categoryBadge: 'Banquets & Celebrations',
            bannerImage: eventsCardImage,
            icon: PartyPopper,
            color: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
            tagline: eventsSubtitle,
            highlights: ['Weddings & Galas', 'Birthday & Anniversaries', 'Theme Decor & Catering', 'Dedicated Event Butler'],
            actionText: 'Plan an Event 🎉',
          },
        ]
      : []),
    {
      id: 'room_service' as const,
      name: 'Room Service',
      category: 'room',
      categoryBadge: 'Housekeeping & Care',
      bannerImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      icon: Sparkles,
      color: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
      tagline: 'Towels, bed linen, room refresh & luxury toiletries',
      highlights: ['Extra towels & pillows', 'Turndown service', 'Hygiene refills', 'Full room refresh'],
      actionText: 'Request Room Service',
    },
    {
      id: 'dining' as const,
      name: 'Dining',
      category: 'dining',
      categoryBadge: 'Gourmet Culinary',
      bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      icon: UtensilsCrossed,
      color: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
      tagline: 'Gourmet cuisine, chef specials, beverages & desserts',
      highlights: ['Artisan burgers & mains', 'Indian & Continental specials', 'Fine beverages & desserts', 'Live kitchen status'],
      actionText: 'Browse Dining Menu',
    },
    {
      id: 'maintenance' as const,
      name: 'Maintenance & Technical Support',
      category: 'room',
      categoryBadge: 'Engineering & Repairs',
      bannerImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      icon: Wrench,
      color: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
      tagline: 'AC temperature, plumbing, electrical & electronics',
      highlights: ['Climate control calibration', 'Plumbing & water', 'TV & audio connectivity', 'Rapid duty engineering'],
      actionText: 'Report an Issue',
    },
    {
      id: 'spa' as const,
      name: 'Spa, Concierge & Recreation',
      category: 'dining',
      categoryBadge: 'Wellness & Concierge',
      bannerImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      icon: Flower2,
      color: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
      tagline: 'Holistic wellness treatments, airport transfers & leisure activities',
      highlights: ['Essential & luxury spa therapies', 'Chauffeur & airport transfers', 'Dining & ticket reservations', 'Fitness, sports & leisure activities'],
      actionText: 'Explore & Book Services',
    },
    {
      id: 'front_desk' as const,
      name: 'Front Desk & Guest Support',
      category: 'desk' as const,
      categoryBadge: '24/7 Front Office',
      bannerImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      icon: MessageSquare,
      color: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30',
      tagline: '24/7 unified guest support: Complaints, Financial issues, Requests & Incidents',
      highlights: ['Formal complaints & resolution', 'Refund & compensation claims', 'Special requests & assistance', 'Incident reporting & safety'],
      actionText: 'Open Front Desk & Support',
    },
    {
      id: 'reminders' as const,
      name: 'Reminders & Wake-up Calls',
      category: 'desk',
      categoryBadge: 'Guest Reminders',
      bannerImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
      icon: Bell,
      color: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
      tagline: 'Scheduled telephone wake-up calls & taxi transfers',
      highlights: ['Automated wake-up rings', 'Airport taxi pickups', 'Luggage collection times', 'Scheduled front desk alerts'],
      actionText: 'Schedule Reminder',
    },
    {
      id: 'dnd' as const,
      name: 'Do Not Disturb (DND)',
      category: 'room',
      categoryBadge: 'Suite Privacy',
      bannerImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      icon: MoonStar,
      color: prefs?.dnd
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        : 'bg-white/10 text-mist-300 border-white/10',
      tagline: 'Communicate privacy preferences directly to all staff',
      highlights: ['Instant activation/deactivation', 'Custom duration schedule', 'Special delivery notes', 'Front Desk live sync'],
      actionText: prefs?.dnd ? 'Manage DND (Active)' : 'Activate DND',
    },
    {
      id: 'lost_found' as const,
      name: 'Lost and Found',
      category: 'desk',
      categoryBadge: 'Concierge Custody',
      bannerImage: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=800&q=80',
      icon: PackageSearch,
      color: 'bg-teal-400/15 text-teal-300 border-teal-400/30',
      tagline: 'Lodge missing items or enquire about property turned in',
      highlights: ['Search cataloged turn-ins', 'Ownership verification', 'File lost report', 'Security vault protection'],
      actionText: 'Open Lost & Found',
    },
    {
      id: 'folio' as const,
      name: 'Folio & Express Checkout',
      category: 'finance',
      categoryBadge: 'Billing & Folio',
      bannerImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      icon: Receipt,
      color: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
      tagline: 'Itemised charges, GST tax invoice & card settlement',
      highlights: ['Live balance calculation', 'Download official tax invoice', 'Charge dispute submission', 'Express digital checkout'],
      actionText: `View Folio (${money(currentBalance)})`,
    },
  ];

  const filteredServices = useMemo(() => {
    return SERVICES.filter((s) => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [SERVICES, activeCategory, searchQuery]);

  // If a subview is currently open, render it with a back button
  if (activeSubView) {
    // Events & Celebrations renders cleanly without duplicated back banner
    if (activeSubView === 'events_celebrations') {
      return (
        <EventsCelebrationsSection room={room} guestName={guestName} onNavigate={onNavigate} />
      );
    }

    return (
      <div className="space-y-4">
        {/* Sub-view rendered without top pill bar per specification */}

        {/* Render specific service component */}
        {activeSubView === 'dining' && (
          <DiningSection room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {(activeSubView === 'room_service' || activeSubView === 'housekeeping') && (
          <HousekeepingCatalogueSection room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'lost_found' && (
          <LostFoundSection room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {(activeSubView === 'front_desk' || activeSubView === 'compensation' || activeSubView === 'complaints') && (
          <ToFrontDeskSubtab
            room={room}
            guestName={guestName}
            onNavigate={onNavigate}
            initialSubtab={activeSubView}
          />
        )}
        {activeSubView === 'reminders' && (
          <RemindersSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'dnd' && (
          <DndSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'folio' && (
          <MyFolioSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'maintenance' && (
          <MaintenanceTab
            room={room}
            guestName={guestName}
            onNavigate={onNavigate}
          />
        )}
        {(activeSubView === 'spa' || activeSubView === 'concierge' || activeSubView === 'recreation') && (
          <SpaConciergeTab
            room={room}
            guestName={guestName}
            onNavigate={onNavigate}
            initialSubtab={activeSubView}
          />
        )}
        {activeSubView === 'book' && (
          <BookServiceSubtab
            room={room}
            guestName={guestName}
            onNavigate={onNavigate}
            initialSubtab={activeSubView}
          />
        )}
      </div>
    );
  }

  return (
    <div data-tour="tour-services-tab" className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Header & Search */}
      <div className={cn(
        'p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-sm border transition-colors',
        guestPalette === 'burgundy'
          ? 'bg-[#FFFCF8] dark:bg-[#220B15] border-[#E0CBA9] dark:border-[#461628]'
          : 'bg-white dark:bg-[#122C21] border-[#E5DFD3] dark:border-[#1E4F39]'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className={cn('h-4 w-4', guestPalette === 'burgundy' ? 'text-[#C9A45C]' : 'text-emerald-500')} />
              <span>All Hotel Services &amp; Amenities</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Explore dining, housekeeping, wellness, room maintenance, and concierge
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search towels, dining, AC repair, wake-up call, taxi, folio..."
            className="w-full rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 pl-10 pr-4 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm text-xs border',
              activeCategory === 'all'
                ? guestPalette === 'burgundy'
                  ? 'bg-[#74172F] text-[#FFF8F0] border-[#74172F]'
                  : 'bg-[#175B49] text-white border-[#175B49]'
                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10'
            )}
          >
            All Services ({SERVICES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('room')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm text-xs border',
              activeCategory === 'room'
                ? guestPalette === 'burgundy'
                  ? 'bg-[#74172F] text-[#FFF8F0] border-[#74172F]'
                  : 'bg-[#175B49] text-white border-[#175B49]'
                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10'
            )}
          >
            Room Comfort ({SERVICES.filter((s) => s.category === 'room').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('dining')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm text-xs border',
              activeCategory === 'dining'
                ? guestPalette === 'burgundy'
                  ? 'bg-[#74172F] text-[#FFF8F0] border-[#74172F]'
                  : 'bg-[#175B49] text-white border-[#175B49]'
                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10'
            )}
          >
            Dining &amp; Celebrations ({SERVICES.filter((s) => s.category === 'dining').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('desk')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm text-xs border',
              activeCategory === 'desk'
                ? guestPalette === 'burgundy'
                  ? 'bg-[#74172F] text-[#FFF8F0] border-[#74172F]'
                  : 'bg-[#175B49] text-white border-[#175B49]'
                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10'
            )}
          >
            Front Desk &amp; Care ({SERVICES.filter((s) => s.category === 'desk').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('finance')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm text-xs border',
              activeCategory === 'finance'
                ? guestPalette === 'burgundy'
                  ? 'bg-[#74172F] text-[#FFF8F0] border-[#74172F]'
                  : 'bg-[#175B49] text-white border-[#175B49]'
                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10'
            )}
          >
            Billing &amp; Folio ({SERVICES.filter((s) => s.category === 'finance').length})
          </button>
        </div>
      </div>

      {/* Services List / Cards */}
      <div className="space-y-4">
        <GuestSectionHeader
          title="Available Services Directory"
          hint={`${filteredServices.length} direct services ready for Room ${room}`}
        />

        {filteredServices.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900">
            No services match &quot;{searchQuery}&quot;. Please try a different search keyword.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {filteredServices.map((svc) => {
              const Icon = svc.icon;

              return (
                <div
                  key={svc.id}
                  className={cn(
                    'overflow-hidden flex flex-col justify-between rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border group',
                    guestPalette === 'burgundy'
                      ? 'bg-[#FFFCF8] dark:bg-[#220B15] border-[#E0CBA9] dark:border-[#461628]'
                      : 'bg-white dark:bg-[#122C21] border-[#E5DFD3] dark:border-[#1E4F39]'
                  )}
                >
                  {/* Card Banner Image with subtle gradient and Category Badge */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-900">
                    <img
                      src={svc.bannerImage}
                      alt={svc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Category badge pinned to top-left */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-md">
                        {svc.categoryBadge}
                      </span>
                    </div>

                    {/* Department icon floating on bottom-left */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className={cn(
                        'grid h-10 w-10 place-items-center rounded-xl shadow-lg border backdrop-blur-md',
                        guestPalette === 'burgundy'
                          ? 'bg-[#74172F]/90 text-[#FFF8F0] border-[#DEC9A4]/40'
                          : 'bg-[#175B49]/90 text-white border-[#C6D8CB]/40'
                      )}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className={cn(
                          'text-sm sm:text-base font-bold transition-colors text-stone-900 dark:text-stone-100',
                          guestPalette === 'burgundy' ? 'group-hover:text-[#74172F] dark:group-hover:text-[#C9A45C]' : 'group-hover:text-[#175B49] dark:group-hover:text-[#34D399]'
                        )}>
                          {svc.name}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                          {svc.tagline}
                        </p>
                      </div>

                      {/* Highlights bullet pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {svc.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 border border-stone-200 dark:border-white/10 text-[10px] text-stone-700 dark:text-stone-300 font-medium"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer with CTA */}
                    <div className="pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between gap-3">
                      {svc.id === 'dnd' && prefs?.dnd && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <MoonStar className="h-3.5 w-3.5 animate-pulse" />
                          <span>Active</span>
                        </span>
                      )}

                      {svc.id === 'folio' && (
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          Due: {money(currentBalance)}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubView(svc.id);
                          onNavigate('services', svc.id);
                        }}
                        className={cn(
                          'ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:translate-x-0.5',
                          guestPalette === 'burgundy'
                            ? 'bg-[#74172F] hover:bg-[#8A2443]'
                            : 'bg-[#175B49] hover:bg-[#206A55]'
                        )}
                      >
                        <span>{svc.actionText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
