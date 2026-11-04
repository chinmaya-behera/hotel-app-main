'use client';

import { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowRight,
  X,
  AlertCircle,
  HelpCircle,
  BedDouble,
  Info,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import {
  INITIAL_AMENITIES,
  CLEANING_SERVICES,
  AMENITY_CATEGORIES,
  HOUSEKEEPING_TIME_SLOTS,
  type AmenityProduct,
  type CleaningService,
} from './housekeepingData';

export function HousekeepingCatalogueSection({ room, guestName, onNavigate }: GuestTabProps) {
  const { state, submitGuestRequest } = useDemo();

  // Active top view tab: Amenities Catalogue vs Room Cleaning Services
  const [activeTab, setActiveTab] = useState<'amenities' | 'cleaning'>('amenities');

  // Search and Category filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Amenity quantities state { [amenityId]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Selected cleaning services state (array of service IDs)
  const [selectedCleaning, setSelectedCleaning] = useState<string[]>([]);
  const [otherCleaningText, setOtherCleaningText] = useState('');

  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'asap' | 'slot'>('asap');
  const [selectedDateOption, setSelectedDateOption] = useState<'today' | 'tomorrow' | 'day_after'>('today');
  const [selectedSlot, setSelectedSlot] = useState<string>('11:00 AM');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Confirmation modal and toast state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  // Dynamic amenities from store if configured by admin, otherwise initial catalog
  const amenitiesList: AmenityProduct[] = useMemo(() => {
    // Allows admin/property overrides from state.hotelServices if present
    const customHk = (state.hotelServices ?? []).filter((s) => s.department === 'Housekeeping');
    if (!customHk || customHk.length === 0) return INITIAL_AMENITIES;

    // Merge or use initial list with updated availability
    return INITIAL_AMENITIES.map((a) => {
      const match = customHk.find((c) => c.name.toLowerCase() === a.name.toLowerCase());
      if (match) {
        return {
          ...a,
          available: match.availableForGuest,
          description: match.description || a.description,
        };
      }
      return a;
    });
  }, [state.hotelServices]);

  // Filtered amenities
  const filteredAmenities = useMemo(() => {
    return amenitiesList.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [amenitiesList, selectedCategory, searchQuery]);

  // Selected amenities array
  const selectedAmenitiesList = useMemo(() => {
    return amenitiesList
      .filter((a) => (quantities[a.id] ?? 0) > 0)
      .map((a) => ({
        ...a,
        qty: quantities[a.id],
      }));
  }, [amenitiesList, quantities]);

  const totalAmenityCount = selectedAmenitiesList.reduce((sum, item) => sum + item.qty, 0);
  const totalCleaningCount = selectedCleaning.length;
  const hasSelections = totalAmenityCount > 0 || totalCleaningCount > 0;

  // Quantity helpers
  function handleIncrease(id: string, maxQty: number) {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current >= maxQty) return prev;
      return { ...prev, [id]: current + 1 };
    });
  }

  function handleDecrease(id: string) {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  }

  function handleSetZero(id: string) {
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleToggleCleaning(serviceId: string) {
    setSelectedCleaning((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  }

  // Date label helpers
  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const dayAfterDate = new Date();
  dayAfterDate.setDate(todayDate.getDate() + 2);

  const DATE_OPTIONS = [
    {
      id: 'today' as const,
      label: 'Today',
      sublabel: todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    },
    {
      id: 'tomorrow' as const,
      label: 'Tomorrow',
      sublabel: tomorrowDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    },
    {
      id: 'day_after' as const,
      label: dayAfterDate.toLocaleDateString('en-US', { weekday: 'short' }),
      sublabel: dayAfterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
  ];

  // Time slot availability logic
  const currentHour = todayDate.getHours();

  function isSlotAvailable(slot: (typeof HOUSEKEEPING_TIME_SLOTS)[0]): {
    available: boolean;
    reason?: 'past' | 'booked';
  } {
    // If today is selected, slots in the past are disabled
    if (selectedDateOption === 'today') {
      if (slot.hour24 <= currentHour) {
        return { available: false, reason: 'past' };
      }
    }
    // Simulate high-demand peak slots (e.g. 10:00 AM on today)
    if (selectedDateOption === 'today' && slot.hour24 === 10) {
      return { available: false, reason: 'booked' };
    }
    return { available: true };
  }

  // Formatted schedule string for display & submission
  const scheduleDisplayString = useMemo(() => {
    if (scheduleType === 'asap') {
      return 'As soon as possible (~15–20 mins)';
    }
    const dateObj =
      selectedDateOption === 'today'
        ? todayDate
        : selectedDateOption === 'tomorrow'
        ? tomorrowDate
        : dayAfterDate;
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} at ${selectedSlot}`;
  }, [scheduleType, selectedDateOption, selectedSlot, todayDate, tomorrowDate, dayAfterDate]);

  // Submit Request Handler
  function handleConfirmSubmission() {
    if (!hasSelections) return;

    // Compile title
    let titleParts: string[] = [];
    if (totalAmenityCount > 0) {
      const summaryItems = selectedAmenitiesList.map((a) => `${a.qty}× ${a.name}`).join(', ');
      titleParts.push(summaryItems);
    }
    if (totalCleaningCount > 0) {
      const cleaningTitles = selectedCleaning.map((id) => {
        const s = CLEANING_SERVICES.find((c) => c.id === id);
        return s?.title ?? 'Room Cleaning';
      });
      titleParts.push(cleaningTitles.join(' + '));
    }
    const mainTitle = `Room Service · ${titleParts.join(' & ')}`;

    // Compile structured description
    const descSections: string[] = [];

    if (selectedAmenitiesList.length > 0) {
      const itemsList = selectedAmenitiesList
        .map((a) => `• ${a.qty}× ${a.name} (${a.categoryLabel})`)
        .join('\n');
      descSections.push(`Requested Amenities:\n${itemsList}`);
    }

    if (selectedCleaning.length > 0) {
      const cleanList = selectedCleaning
        .map((id) => {
          const s = CLEANING_SERVICES.find((c) => c.id === id);
          if (id === 'clean-other' && otherCleaningText.trim()) {
            return `• ${s?.title}: "${otherCleaningText.trim()}"`;
          }
          return `• ${s?.title}`;
        })
        .join('\n');
      descSections.push(`Cleaning Services:\n${cleanList}`);
    }

    descSections.push(`Delivery / Service Schedule: ${scheduleDisplayString}`);

    if (additionalNotes.trim()) {
      descSections.push(`Guest Special Instructions: "${additionalNotes.trim()}"`);
    }

    const fullDescription = descSections.join('\n\n');

    // Submit into store
    const ref = submitGuestRequest({
      room,
      title: mainTitle,
      meta: `Room Service · Room ${room} · ${scheduleDisplayString}`,
      category: 'housekeeping',
      description: fullDescription,
      priority: 'normal',
    });

    setConfirmedRef(ref);
    setReviewModalOpen(false);

    // Reset selections
    setQuantities({});
    setSelectedCleaning([]);
    setOtherCleaningText('');
    setAdditionalNotes('');
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 max-w-7xl mx-auto w-full">
      {/* SUCCESS CONFIRMATION BANNER */}
      {confirmedRef && (
        <div className="guest-card p-4 border-emerald-400/50 bg-emerald-400/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Room Service Request Confirmed</span>
                <span className="font-mono text-cyan-300 font-black">[{confirmedRef}]</span>
              </p>
              <p className="text-[11px] text-emerald-200">
                Dispatched to Room Service staff for Room {room}. Track progress live in your Pending Requests timeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-sm transition-colors"
            >
              View on Home Timeline
            </button>
            <button
              type="button"
              onClick={() => setConfirmedRef(null)}
              className="p-1.5 text-mist-400 hover:text-white"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2-SEGMENT SWITCHER AS TOP ELEMENT (HEADING CONTAINER COMPLETELY REMOVED) */}
      <div className="space-y-2.5 pt-1">
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 text-xs shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('amenities')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all ${
              activeTab === 'amenities'
                ? 'bg-cyan-400 text-ink-950 shadow-md'
                : 'text-mist-300 hover:text-white hover:bg-white/5 font-semibold'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Amenities Catalogue</span>
            {totalAmenityCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'amenities' ? 'bg-ink-950 text-cyan-400' : 'bg-cyan-400 text-ink-950'
                }`}
              >
                {totalAmenityCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cleaning')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all ${
              activeTab === 'cleaning'
                ? 'bg-cyan-400 text-ink-950 shadow-md'
                : 'text-mist-300 hover:text-white hover:bg-white/5 font-semibold'
            }`}
          >
            <BedDouble className="h-4 w-4" />
            <span>Room Cleaning Services</span>
            {totalCleaningCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'cleaning' ? 'bg-ink-950 text-cyan-400' : 'bg-cyan-400 text-ink-950'
                }`}
              >
                {totalCleaningCount}
              </span>
            )}
          </button>
        </div>

        {/* Subtle DND Active Alert if enabled */}
        {state.guestPreferences?.[room]?.dnd && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Do Not Disturb is Active · Room Service will respect your privacy preferences</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VISUAL AMENITIES CATALOGUE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'amenities' && (
        <div className="space-y-4">
          {/* Search Bar & Category Filter Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-mist-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search towels, shampoo, dental kit, pillows, bottled water..."
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

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {AMENITY_CATEGORIES.map((cat) => {
                const count =
                  cat.id === 'all'
                    ? amenitiesList.length
                    : amenitiesList.filter((a) => a.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                        : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amenity Cards Grid */}
          {filteredAmenities.length === 0 ? (
            <div className="guest-card p-8 text-center text-xs text-mist-400">
              No amenities match &quot;{searchQuery}&quot;. Please check the spelling or explore other categories.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
              {filteredAmenities.map((item) => {
                const qty = quantities[item.id] ?? 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={item.id}
                    className={`guest-card overflow-hidden flex flex-col justify-between transition-all duration-200 group ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/[0.04] ring-1 ring-amber-400/40 shadow-lg'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                  >
                    {/* Representative High-Res Product Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to stylish gradient block if remote image is blocked
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Category Pill Over Image */}
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-medium text-mist-200">
                        {item.categoryLabel.split(' ')[0]}
                      </span>

                      {/* Selected Badge */}
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-400 text-ink-950 text-[10px] font-extrabold shadow-md">
                          {qty} added
                        </span>
                      )}
                    </div>

                    {/* Content & Descriptions */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-mist-300 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Functional Quantity Stepper */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                        <span className="text-[10px] text-mist-400 font-mono">
                          Max {item.maxQty}
                        </span>

                        <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            disabled={qty === 0 || !item.available}
                            onClick={() => handleDecrease(item.id)}
                            className="h-7 w-7 grid place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-white/10 transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>

                          <span className="w-5 text-center text-xs font-bold text-white tabular-nums">
                            {qty}
                          </span>

                          <button
                            type="button"
                            disabled={qty >= item.maxQty || !item.available}
                            onClick={() => handleIncrease(item.id, item.maxQty)}
                            className="h-7 w-7 grid place-items-center rounded-lg bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROOM CLEANING SERVICES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'cleaning' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {CLEANING_SERVICES.map((srv) => {
              const isSelected = selectedCleaning.includes(srv.id);

              return (
                <div
                  key={srv.id}
                  className={`guest-card overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/[0.04] ring-1 ring-amber-400/40 shadow-lg'
                      : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                  }`}
                >
                  {/* High-res Cleaning Service Image */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
                    <img
                      src={srv.image}
                      alt={srv.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-mist-200 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>~{srv.estimatedMinutes} mins</span>
                    </span>

                    {isSelected && (
                      <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-400 text-ink-950 grid place-items-center shadow-lg font-bold">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">{srv.title}</h3>
                      <p className="text-xs text-mist-300 leading-relaxed">{srv.description}</p>
                    </div>

                    {/* If other cleaning is selected, show specialized prompt */}
                    {srv.id === 'clean-other' && isSelected && (
                      <div className="space-y-1 pt-1">
                        <label htmlFor="other-clean-note" className="text-[11px] font-semibold text-amber-300 block">
                          Specify your cleaning request:
                        </label>
                        <input
                          id="other-clean-note"
                          type="text"
                          value={otherCleaningText}
                          onChange={(e) => setOtherCleaningText(e.target.value)}
                          placeholder="e.g. Balcony window wipe, carpet spot clean..."
                          className="guest-field w-full px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    )}

                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCleaning(srv.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isSelected
                          ? 'bg-amber-400 text-ink-950 hover:bg-amber-300'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Service Selected</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Select Service</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SERVICE SCHEDULING SECTION (Visible whenever items are selected)          */}
      {/* ========================================================================= */}
      <div className="guest-card p-5 space-y-4 border-amber-400/20 bg-gradient-to-br from-amber-400/[0.02] to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Preferred Delivery &amp; Service Time</h2>
          </div>
          <span className="text-[10px] text-mist-400 font-mono">Operating Hours: 08:00 – 21:00</span>
        </div>

        {/* Schedule Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setScheduleType('asap')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
              scheduleType === 'asap'
                ? 'border-amber-400 bg-amber-400/10 text-white ring-1 ring-amber-400/30'
                : 'border-white/10 bg-white/5 text-mist-300 hover:text-white hover:border-white/20'
            }`}
          >
            <span
              className={`mt-0.5 grid h-6 w-6 place-items-center rounded-lg ${
                scheduleType === 'asap' ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-white/10 text-mist-400'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-white">As Soon As Possible</p>
              <p className="text-[11px] text-mist-400 mt-0.5">Immediate runner dispatch (~15–20 mins)</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScheduleType('slot')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
              scheduleType === 'slot'
                ? 'border-amber-400 bg-amber-400/10 text-white ring-1 ring-amber-400/30'
                : 'border-white/10 bg-white/5 text-mist-300 hover:text-white hover:border-white/20'
            }`}
          >
            <span
              className={`mt-0.5 grid h-6 w-6 place-items-center rounded-lg ${
                scheduleType === 'slot' ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-white/10 text-mist-400'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-white">Schedule Date &amp; Time Slot</p>
              <p className="text-[11px] text-mist-400 mt-0.5">Select convenient morning or evening window</p>
            </div>
          </button>
        </div>

        {/* Detailed Date & Slot Pickers (If slot mode selected) */}
        {scheduleType === 'slot' && (
          <div className="space-y-3 pt-2 border-t border-white/5 animate-in fade-in duration-200">
            {/* Date Options */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-mist-300 block">Select Date</label>
              <div className="grid grid-cols-3 gap-2">
                {DATE_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDateOption(d.id)}
                    className={`py-2 px-3 rounded-xl text-center border transition-all ${
                      selectedDateOption === d.id
                        ? 'border-amber-400 bg-amber-400/15 text-white font-bold ring-1 ring-amber-400/30'
                        : 'border-white/10 bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <p className="text-xs">{d.label}</p>
                    <p className="text-[10px] text-mist-400 mt-0.5">{d.sublabel}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-mist-300 block">
                Available Time Slots ({selectedDateOption === 'today' ? 'Today' : 'Upcoming'})
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {HOUSEKEEPING_TIME_SLOTS.map((slot) => {
                  const check = isSlotAvailable(slot);
                  const isSelected = selectedSlot === slot.time && check.available;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!check.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`py-2 px-2 rounded-xl text-center text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-ink-950 font-bold shadow-md'
                          : check.available
                          ? 'border-white/10 bg-white/5 text-mist-200 hover:border-amber-400/40 hover:text-white'
                          : 'border-white/5 bg-white/[0.02] text-mist-500 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span>{slot.time}</span>
                      {!check.available && (
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-mist-500 mt-0.5">
                          {check.reason === 'past' ? 'Past' : 'Booked'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected slot feedback pill */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-mist-400">Target Appointment:</span>
              <span className="text-amber-300 font-bold">{scheduleDisplayString}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM SELECTION SUMMARY BAR                                       */}
      {/* ========================================================================= */}
      {hasSelections && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-ink-950 font-bold shadow-md">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">
                  {totalAmenityCount > 0 && `${totalAmenityCount} Amenit${totalAmenityCount > 1 ? 'ies' : 'y'}`}
                  {totalAmenityCount > 0 && totalCleaningCount > 0 && ' · '}
                  {totalCleaningCount > 0 && `${totalCleaningCount} Cleaning Service${totalCleaningCount > 1 ? 's' : ''}`}
                </p>
                <p className="text-[11px] text-amber-300 font-medium">
                  {scheduleDisplayString}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuantities({});
                  setSelectedCleaning([]);
                }}
                className="px-3 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-mist-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Review &amp; Confirm Request</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REQUEST SUMMARY & CONFIRMATION MODAL (GuestSheet)                         */}
      {/* ========================================================================= */}
      {reviewModalOpen && (
        <GuestSheet
          title="Review Room Service Request"
          onClose={() => setReviewModalOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Back to Catalogue
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                className="flex-2 py-3 px-4 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-md flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Confirm &amp; Send Request</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Suite Room & Guest Info */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-mist-400 uppercase font-semibold">Service Destination</p>
                <p className="text-sm font-bold text-white">Room {room} · {guestName}</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-300 text-[10px] font-bold border border-emerald-400/20">
                Verified Stay
              </span>
            </div>

            {/* Selected Amenities List */}
            {selectedAmenitiesList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Selected Amenities ({totalAmenityCount})</span>
                  </h4>
                  <span className="text-[10px] text-mist-400">Complimentary</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedAmenitiesList.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-9 w-9 rounded-lg object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-mist-400">{item.categoryLabel}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {item.qty} {item.unit}{item.qty > 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetZero(item.id)}
                          className="text-mist-400 hover:text-rose-400 p-1"
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Cleaning Services */}
            {selectedCleaning.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-amber-400" />
                  <span>Selected Cleaning Services ({totalCleaningCount})</span>
                </h4>

                <div className="space-y-1.5">
                  {selectedCleaning.map((id) => {
                    const s = CLEANING_SERVICES.find((c) => c.id === id);
                    return (
                      <div
                        key={id}
                        className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={s?.image}
                            alt={s?.title}
                            className="h-9 w-9 rounded-lg object-cover shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{s?.title}</p>
                            <p className="text-[10px] text-mist-400">~{s?.estimatedMinutes} mins</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleCleaning(id)}
                          className="text-mist-400 hover:text-rose-400 p-1"
                          title="Remove service"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {selectedCleaning.includes('clean-other') && otherCleaningText.trim() && (
                  <p className="text-[11px] text-amber-200 italic p-2 rounded-lg bg-amber-400/10">
                    Note: &quot;{otherCleaningText.trim()}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Delivery / Service Schedule */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Service Schedule</span>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{scheduleDisplayString}</span>
              </p>
            </div>

            {/* Special Instructions Field */}
            <div className="space-y-1">
              <label htmlFor="hk-notes" className="text-mist-300 font-semibold block">
                Additional Instructions (Optional)
              </label>
              <textarea
                id="hk-notes"
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Leave package by vanity table, please knock softly, extra hangers in closet..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </GuestSheet>
      )}
    </div>
  );
}

