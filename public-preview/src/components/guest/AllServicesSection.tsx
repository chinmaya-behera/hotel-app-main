'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps, GuestTabId, GuestServicesSubtab } from '@/components/guest/types';

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

export function AllServicesSection({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const { state, updateDndStatus } = useDemo();
  const prefs = state.guestPreferences?.[room];
  const folioLines = state.folios?.[room] ?? [];
  const currentBalance = folioLines.reduce((sum, l) => sum + l.amount, 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'room' | 'dining' | 'desk' | 'finance'>('all');
  const [activeSubView, setActiveSubView] = useState<GuestServicesSubtab | null>(
    (initialSubtab as GuestServicesSubtab) && initialSubtab !== 'all' ? (initialSubtab as GuestServicesSubtab) : null,
  );

  const SERVICES = [
    {
      id: 'housekeeping' as const,
      name: 'Housekeeping',
      category: 'room',
      icon: Sparkles,
      color: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
      tagline: 'Towels, bed linen, room refresh & luxury toiletries',
      highlights: ['Extra towels & pillows', 'Turndown service', 'Hygiene refills', 'Full room refresh'],
      actionText: 'Request Housekeeping',
    },
    {
      id: 'dining' as const,
      name: 'Dining',
      category: 'dining',
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
      icon: Flower2,
      color: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
      tagline: 'Holistic wellness treatments, airport transfers & leisure activities',
      highlights: ['Essential & luxury spa therapies', 'Chauffeur & airport transfers', 'Dining & ticket reservations', 'Fitness, sports & leisure activities'],
      actionText: 'Explore & Book Services',
    },
    {
      id: 'front_desk' as const,
      name: 'Front Desk Direct Channel',
      category: 'desk',
      icon: MessageSquare,
      color: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30',
      tagline: '24/7 direct communication with Front Desk team',
      highlights: ['Luggage & bell assistance', 'Document printing', 'Late checkout inquiries', 'Two-way message replies'],
      actionText: 'Message Front Desk',
    },
    {
      id: 'reminders' as const,
      name: 'Reminders & Wake-up Calls',
      category: 'desk',
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
      icon: MoonStar,
      color: prefs?.dnd
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        : 'bg-white/10 text-mist-300 border-white/10',
      tagline: 'Communicate privacy preferences directly to all staff',
      highlights: ['Instant activation/deactivation', 'Custom duration schedule', 'Special delivery notes', 'Front Desk live sync'],
      actionText: prefs?.dnd ? 'Manage DND (Active)' : 'Activate DND',
    },
    {
      id: 'complaints' as const,
      name: 'Complaints & Service Recovery',
      category: 'desk',
      icon: HeartHandshake,
      color: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
      tagline: 'Formal case registration escalated directly to Duty Manager',
      highlights: ['7 issue categories', 'Photo attachments', 'Resolution tracking & credits', 'Marcus Vance direct escalation'],
      actionText: 'Register Complaint',
    },
    {
      id: 'lost_found' as const,
      name: 'Lost and Found',
      category: 'desk',
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
    return (
      <div className="space-y-4">
        {/* Back to all services banner */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveSubView(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition-colors"
          >
            <span>&larr; Back to All Services</span>
          </button>
          <span className="text-[11px] font-semibold text-mist-400 capitalize">
            {activeSubView.replace('_', ' ')}
          </span>
        </div>

        {/* Render specific service component */}
        {(activeSubView === 'dining' || activeSubView === 'room_service') && (
          <DiningSection room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'complaints' && (
          <ComplaintsSection room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'lost_found' && (
          <LostFoundSection room={room} guestName={guestName} onNavigate={onNavigate} />
        )}
        {activeSubView === 'front_desk' && (
          <ToFrontDeskSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
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
        {activeSubView === 'housekeeping' && (
          <HousekeepingCatalogueSection room={room} guestName={guestName} onNavigate={onNavigate} />
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
    <div className="space-y-4 pb-8">
      {/* Header & Search */}
      <div className="guest-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              <span>All Hotel Services &amp; Amenities</span>
            </h2>
            <p className="text-[11px] text-mist-400">
              Access all 10 departments directly without navigating nested submenus
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search towels, dining, AC repair, wake-up call, taxi, folio..."
            className="guest-field w-full pl-10 pr-4 py-2 text-xs text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-mist-400 hover:text-white"
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
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
            }`}
          >
            All Services ({SERVICES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('room')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'room'
                ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Room Comfort (3)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('dining')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'dining'
                ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Dining &amp; Spa (2)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('desk')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'desk'
                ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Front Desk &amp; Care (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('finance')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'finance'
                ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Billing &amp; Folio (1)
          </button>
        </div>
      </div>

      {/* Services List / Cards */}
      <div className="space-y-3">
        <GuestSectionHeader
          title="Available Services Directory"
          hint={`${filteredServices.length} direct services ready for Room ${room}`}
        />

        {filteredServices.length === 0 ? (
          <div className="guest-card p-6 text-center text-xs text-mist-400">
            No services match &quot;{searchQuery}&quot;. Please try a different search keyword.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredServices.map((svc) => {
              const Icon = svc.icon;

              return (
                <div
                  key={svc.id}
                  className="guest-card p-4 flex flex-col justify-between space-y-3 hover:border-amber-400/40 transition-all border border-white/10"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-9 w-9 place-items-center rounded-xl border ${svc.color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-white">{svc.name}</h3>
                          <p className="text-[10px] text-mist-400">{svc.tagline}</p>
                        </div>
                      </div>
                    </div>

                    {/* Highlights bullet pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {svc.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-mist-300 font-medium"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    {svc.id === 'dnd' && prefs?.dnd && (
                      <span className="text-[10px] font-bold text-rose-300 flex items-center gap-1">
                        <MoonStar className="h-3 w-3" />
                        <span>Active</span>
                      </span>
                    )}

                    {svc.id === 'folio' && (
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        Due: {money(currentBalance)}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveSubView(svc.id)}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition-colors shadow-sm"
                    >
                      <span>{svc.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
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

