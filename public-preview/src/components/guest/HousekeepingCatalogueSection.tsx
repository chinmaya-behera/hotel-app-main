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
  ChevronDown,
  ChevronUp,
  Receipt,
  Zap,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import {
  INITIAL_AMENITIES,
  CLEANING_SERVICES,
  AMENITY_CATEGORIES,
  HOUSEKEEPING_TIME_SLOTS,
  calculateItemPrice,
  HOTEL_HOUSEKEEPING_PRICING,
  type AmenityProduct,
  type CleaningService,
} from './housekeepingData';
import { GuestAlarmTimePicker } from './GuestAlarmTimePicker';

export function HousekeepingCatalogueSection({ room, guestName, onNavigate }: GuestTabProps) {
  const { state, submitGuestRequest } = useDemo();

  // Active top view tab: Amenities Catalogue vs Room Cleaning Services
  const [activeTab, setActiveTab] = useState<'amenities' | 'cleaning'>('amenities');

  // Search and Category filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Amenity quantities state { [amenityId]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Cleaning service quantities state { [serviceId]: quantity }
  const [cleaningQuantities, setCleaningQuantities] = useState<Record<string, number>>({});
  const [otherCleaningText, setOtherCleaningText] = useState('');

  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'asap' | 'slot'>('asap');
  const [selectedDateOption, setSelectedDateOption] = useState<'today' | 'tomorrow' | 'day_after'>('today');
  const [selectedSlot, setSelectedSlot] = useState<string>('11:00 AM');
  const [customAlarmTime, setCustomAlarmTime] = useState<string>('11:00 AM');
  const [isScheduleCollapsed, setIsScheduleCollapsed] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Confirmation modal and toast state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  // Dynamic amenities from store if configured by admin, otherwise initial catalog
  const amenitiesList: AmenityProduct[] = useMemo(() => {
    const customHk = (state.hotelServices ?? []).filter((s) => s.department === 'Housekeeping');
    if (!customHk || customHk.length === 0) return INITIAL_AMENITIES;

    return INITIAL_AMENITIES.map((a) => {
      const match = customHk.find((c) => c.name.toLowerCase() === a.name.toLowerCase());
      if (match) {
        return {
          ...a,
          available: match.availableForGuest,
          description: match.description || a.description,
          image: match.imageUrl || a.image,
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

  // Selected amenities array with price breakdown
  const selectedAmenitiesList = useMemo(() => {
    return amenitiesList
      .filter((a) => (quantities[a.id] ?? 0) > 0)
      .map((a) => {
        const qty = quantities[a.id];
        const priceInfo = calculateItemPrice(a.id, qty);
        return {
          ...a,
          qty,
          priceInfo,
        };
      });
  }, [amenitiesList, quantities]);

  // Selected cleaning services array with price breakdown
  const selectedCleaningList = useMemo(() => {
    return CLEANING_SERVICES
      .filter((s) => (cleaningQuantities[s.id] ?? 0) > 0)
      .map((s) => {
        const qty = cleaningQuantities[s.id];
        const priceInfo = calculateItemPrice(s.id, qty);
        return {
          ...s,
          qty,
          priceInfo,
        };
      });
  }, [cleaningQuantities]);

  const totalAmenityCount = selectedAmenitiesList.reduce((sum, item) => sum + item.qty, 0);
  const totalCleaningCount = selectedCleaningList.reduce((sum, item) => sum + item.qty, 0);
  const hasSelections = totalAmenityCount > 0 || totalCleaningCount > 0;

  // Pricing calculations
  const amenitiesSubtotal = useMemo(() => {
    return selectedAmenitiesList.reduce((sum, item) => sum + item.priceInfo.price, 0);
  }, [selectedAmenitiesList]);

  const cleaningSubtotal = useMemo(() => {
    return selectedCleaningList.reduce((sum, item) => sum + item.priceInfo.price, 0);
  }, [selectedCleaningList]);

  const taxableSubtotal = amenitiesSubtotal + cleaningSubtotal;
  // If taxable subtotal > 0, 5% GST; if all complimentary, 0 tax
  const taxAmount = taxableSubtotal > 0 ? Math.round(taxableSubtotal * 0.05) : 0;
  const additionalCharges = 0;
  const finalTotal = taxableSubtotal + taxAmount + additionalCharges;

  const totalComplimentaryUnits = useMemo(() => {
    const amenFree = selectedAmenitiesList.reduce((sum, item) => sum + item.priceInfo.freeCount, 0);
    const cleanFree = selectedCleaningList.reduce((sum, item) => sum + item.priceInfo.freeCount, 0);
    return amenFree + cleanFree;
  }, [selectedAmenitiesList, selectedCleaningList]);

  const totalBillableUnits = useMemo(() => {
    const amenBillable = selectedAmenitiesList.reduce((sum, item) => sum + item.priceInfo.billableCount, 0);
    const cleanBillable = selectedCleaningList.reduce((sum, item) => sum + item.priceInfo.billableCount, 0);
    return amenBillable + cleanBillable;
  }, [selectedAmenitiesList, selectedCleaningList]);

  // Quantity helpers for amenities
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

  // Quantity helpers for cleaning
  function handleIncreaseCleaning(id: string, maxQty: number = 3) {
    setCleaningQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current >= maxQty) return prev;
      return { ...prev, [id]: current + 1 };
    });
  }

  function handleDecreaseCleaning(id: string) {
    setCleaningQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  }

  function handleSetZeroCleaning(id: string) {
    setCleaningQuantities((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
    if (selectedDateOption === 'today') {
      if (slot.hour24 <= currentHour) {
        return { available: false, reason: 'past' };
      }
    }
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
    const chosenTime = customAlarmTime || selectedSlot;
    return `${dateStr} at ${chosenTime}`;
  }, [scheduleType, selectedDateOption, selectedSlot, customAlarmTime, todayDate, tomorrowDate, dayAfterDate]);

  // Submit Request Handler
  function handleConfirmSubmission() {
    if (!hasSelections) return;

    let titleParts: string[] = [];
    if (totalAmenityCount > 0) {
      const summaryItems = selectedAmenitiesList.map((a) => `${a.qty}× ${a.name}`).join(', ');
      titleParts.push(summaryItems);
    }
    if (totalCleaningCount > 0) {
      const cleaningTitles = selectedCleaningList.map((s) => `${s.qty}× ${s.title}`).join(' + ');
      titleParts.push(cleaningTitles);
    }
    const mainTitle = `Room Service · ${titleParts.join(' & ')}`;

    // Compile structured description with bill details
    const descSections: string[] = [];

    if (selectedAmenitiesList.length > 0) {
      const itemsList = selectedAmenitiesList
        .map(
          (a) =>
            `• ${a.qty}× ${a.name} (${a.priceInfo.freeCount} complimentary, ${a.priceInfo.billableCount} paid) — ${a.priceInfo.price === 0 ? 'Complimentary' : `₹${a.priceInfo.price}`}`
        )
        .join('\n');
      descSections.push(`Requested Amenities:\n${itemsList}`);
    }

    if (selectedCleaningList.length > 0) {
      const cleanList = selectedCleaningList
        .map((s) => {
          const costStr = s.priceInfo.price === 0 ? 'Complimentary' : `₹${s.priceInfo.price}`;
          const countDetail = `(${s.priceInfo.freeCount} complimentary, ${s.priceInfo.billableCount} paid)`;
          if (s.id === 'clean-other' && otherCleaningText.trim()) {
            return `• ${s.qty}× ${s.title}: "${otherCleaningText.trim()}" ${countDetail} — ${costStr}`;
          }
          return `• ${s.qty}× ${s.title} ${countDetail} — ${costStr}`;
        })
        .join('\n');
      descSections.push(`Cleaning Services:\n${cleanList}`);
    }

    descSections.push(`Delivery / Service Schedule: ${scheduleDisplayString}`);

    // Bill summary
    descSections.push(
      `Billing Summary:\n• Complimentary Items: ${totalComplimentaryUnits} units (₹0)\n• Paid Items: ${totalBillableUnits} units\n• Amenities Subtotal: ₹${amenitiesSubtotal}\n• Cleaning Subtotal: ₹${cleaningSubtotal}\n• Taxes (5% GST): ₹${taxAmount}\n• Final Total: ${finalTotal === 0 ? '₹0 (Complimentary)' : `₹${finalTotal}`}`
    );

    if (additionalNotes.trim()) {
      descSections.push(`Guest Special Instructions: "${additionalNotes.trim()}"`);
    }

    const fullDescription = descSections.join('\n\n');

    // Submit into store
    const ref = submitGuestRequest({
      room,
      title: mainTitle,
      meta: `Room Service · Room ${room} · ${scheduleDisplayString} · ${finalTotal === 0 ? 'Complimentary' : `₹${finalTotal}`}`,
      category: 'housekeeping',
      description: fullDescription,
      priority: 'normal',
      amount: finalTotal,
    });

    setConfirmedRef(ref);
    setReviewModalOpen(false);

    // Reset selections
    setQuantities({});
    setCleaningQuantities({});
    setOtherCleaningText('');
    setAdditionalNotes('');
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-48 max-w-7xl mx-auto w-full">
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
                Dispatched to Room Service staff for Room {room}. Track live progress under My Activity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="px-3 py-1.5 rounded-xl bg-emerald-400 text-ink-950 text-xs font-bold hover:bg-emerald-300 shadow-sm transition-colors"
            >
              Track Progress
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

      {/* 2-SEGMENT NAVIGATION SWITCHER */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('amenities')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'amenities'
              ? 'bg-amber-400 text-ink-950 shadow-md ring-1 ring-amber-300'
              : 'text-mist-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Room Service &amp; Amenities</span>
          {totalAmenityCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-ink-950 text-amber-300 text-[10px] font-black">
              {totalAmenityCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cleaning')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'cleaning'
              ? 'bg-amber-400 text-ink-950 shadow-md ring-1 ring-amber-300'
              : 'text-mist-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <BedDouble className="h-4 w-4" />
          <span>Room Cleaning Services</span>
          {totalCleaningCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-ink-950 text-amber-300 text-[10px] font-black">
              {totalCleaningCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AMENITIES CATALOGUE                                                */}
      {/* ========================================================================= */}
      {activeTab === 'amenities' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Search Bar & Categories */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search towels, dental kit, slippers, toiletries..."
                className="guest-field w-full pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-mist-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {AMENITY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                      : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities Grid */}
          {filteredAmenities.length === 0 ? (
            <div className="guest-card p-8 text-center text-xs text-mist-400">
              No amenities match &quot;{searchQuery}&quot;. Please check the spelling or explore other categories.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
              {filteredAmenities.map((item) => {
                const qty = quantities[item.id] ?? 0;
                const isSelected = qty > 0;
                const priceInfo = calculateItemPrice(item.id, qty);

                return (
                  <div
                    key={item.id}
                    className={`guest-card overflow-hidden flex flex-col justify-between transition-all duration-200 group ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/[0.04] ring-1 ring-amber-400/40 shadow-lg'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-medium text-mist-200">
                        {item.categoryLabel.split(' ')[0]}
                      </span>

                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-400 text-ink-950 text-[10px] font-extrabold shadow-md">
                          {qty} added
                        </span>
                      )}
                    </div>

                    {/* Content & Descriptions */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-[11px] sm:text-xs text-mist-300 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Pricing, Unit Rate & Free Allowance */}
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] text-mist-400 block font-mono">
                              Rate:{' '}
                              <span className="text-white font-semibold">
                                {priceInfo.unitPrice > 0 ? `₹${priceInfo.unitPrice}/${item.unit}` : 'Complimentary'}
                              </span>
                            </span>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 font-semibold border border-emerald-400/20 text-[9px]">
                              {priceInfo.freeLimit >= 99 ? 'Complimentary' : `First ${priceInfo.freeLimit} Free`}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-mist-400 uppercase tracking-wider block">Total</span>
                            <span className="font-mono font-bold text-xs">
                              {qty === 0 ? (
                                <span className="text-mist-400">₹0</span>
                              ) : priceInfo.price === 0 ? (
                                <span className="text-emerald-300">₹0 Free</span>
                              ) : (
                                <span className="text-amber-300">₹{priceInfo.price}</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center justify-between gap-1">
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
              const qty = cleaningQuantities[srv.id] ?? 0;
              const isSelected = qty > 0;
              const priceInfo = calculateItemPrice(srv.id, qty);

              return (
                <div
                  key={srv.id}
                  className={`guest-card overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/[0.04] ring-1 ring-amber-400/40 shadow-lg'
                      : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                  }`}
                >
                  {/* Cleaning Service Image */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
                    <img
                      src={srv.image}
                      alt={srv.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-mist-200 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>~{srv.estimatedMinutes} mins</span>
                    </span>

                    {isSelected && (
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-ink-950 shadow-lg font-bold text-xs">
                        {qty} selected
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">{srv.title}</h3>
                      <p className="text-xs text-mist-300 leading-relaxed">{srv.description}</p>
                    </div>

                    {/* Special instruction input if Other is selected */}
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

                    {/* Pricing, Rate & Free Allowance */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] text-mist-400 block font-mono">
                            Rate:{' '}
                            <span className="text-white font-semibold">
                              {priceInfo.unitPrice > 0 ? `₹${priceInfo.unitPrice} / session` : 'Complimentary'}
                            </span>
                          </span>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 font-semibold border border-emerald-400/20 text-[9px]">
                            {priceInfo.freeLimit >= 99 ? 'Complimentary' : `First ${priceInfo.freeLimit} Session Free`}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] text-mist-400 uppercase tracking-wider block">Total</span>
                          <span className="font-mono font-bold text-xs">
                            {qty === 0 ? (
                              <span className="text-mist-400">₹0</span>
                            ) : priceInfo.price === 0 ? (
                              <span className="text-emerald-300">₹0 Free</span>
                            ) : (
                              <span className="text-amber-300">₹{priceInfo.price}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Stepper / Toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-mist-400">Select Sessions</span>

                        <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            disabled={qty === 0}
                            onClick={() => handleDecreaseCleaning(srv.id)}
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
                            disabled={qty >= 3}
                            onClick={() => handleIncreaseCleaning(srv.id, 3)}
                            className="h-7 w-7 grid place-items-center rounded-lg bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOWER AREA: PREFERRED SERVICE TIME & ACTION BAR (Screenshot 1)            */}
      {/* Docked immediately above the bottom action bar for instant accessibility  */}
      {/* ========================================================================= */}
      {hasSelections && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto">
            {/* 1. PREFERRED DELIVERY & SERVICE TIME SECTION */}
            <div className="px-3 sm:px-5 pt-3 pb-2.5 border-b border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-amber-400 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">Preferred Delivery &amp; Service Time</h3>
                </div>
                <span className="text-[10px] text-mist-400 font-mono">Operating Hours: 08:00 – 21:00</span>
              </div>

              {/* Quick Mode Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('asap')}
                  className={`py-2 px-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    scheduleType === 'asap'
                      ? 'border-amber-400 bg-amber-400/15 text-white ring-1 ring-amber-400/30'
                      : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg ${
                      scheduleType === 'asap' ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-white/10 text-mist-400'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">As Soon As Possible</p>
                    <p className="text-[10px] text-mist-400 truncate">Immediate runner (~15–20 mins)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('slot')}
                  className={`py-2 px-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    scheduleType === 'slot'
                      ? 'border-amber-400 bg-amber-400/15 text-white ring-1 ring-amber-400/30'
                      : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg ${
                      scheduleType === 'slot' ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-white/10 text-mist-400'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">Schedule Date &amp; Time</p>
                    <p className="text-[10px] text-mist-400 truncate">Choose date &amp; custom time</p>
                  </div>
                </button>
              </div>

              {/* If Schedule Date & Time Slot selected */}
              {scheduleType === 'slot' && (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
                  {/* Date Options */}
                  <div className="flex items-center gap-1.5">
                    {DATE_OPTIONS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDateOption(d.id)}
                        className={`py-1.5 px-2.5 rounded-lg text-center border text-[11px] font-semibold transition-all ${
                          selectedDateOption === d.id
                            ? 'border-amber-400 bg-amber-400 text-ink-950 font-bold'
                            : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Alarm Style Time Selector */}
                  <div className="w-full sm:w-64">
                    <GuestAlarmTimePicker
                      value={customAlarmTime}
                      onChange={(t) => {
                        setCustomAlarmTime(t);
                        setSelectedSlot(t);
                      }}
                      showImmediately={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. STICKY BOTTOM ACTION BAR */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-4">
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

                {/* Live Subtotal Pill */}
                <div className="text-right sm:text-left sm:pl-4 sm:border-l border-white/10">
                  <span className="text-[10px] uppercase font-semibold text-mist-400 block">Estimated Total</span>
                  <p className="text-sm font-black text-white font-mono">
                    {finalTotal === 0 ? (
                      <span className="text-emerald-300">₹0 (Free)</span>
                    ) : (
                      <span className="text-cyan-300">₹{finalTotal}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuantities({});
                    setCleaningQuantities({});
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINAL BILL REVIEW & CONFIRMATION MODAL (Screenshot 2)                     */}
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
            {/* Service Destination */}
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
                  <span className="text-[10px] text-mist-400">
                    {amenitiesSubtotal === 0 ? 'Complimentary' : `Subtotal: ₹${amenitiesSubtotal}`}
                  </span>
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
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-mist-400">
                            {item.qty} {item.unit}{item.qty > 1 ? 's' : ''} &bull;{' '}
                            {item.priceInfo.freeCount > 0 && (
                              <span className="text-emerald-300 font-medium">
                                {item.priceInfo.freeCount} Free
                              </span>
                            )}
                            {item.priceInfo.billableCount > 0 && (
                              <span className="text-amber-300 font-medium ml-1">
                                + {item.priceInfo.billableCount} paid (@ ₹{item.priceInfo.unitPrice})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-xs">
                          {item.priceInfo.price === 0 ? (
                            <span className="text-emerald-300">₹0</span>
                          ) : (
                            <span className="text-amber-300">₹{item.priceInfo.price}</span>
                          )}
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
            {selectedCleaningList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <BedDouble className="h-3.5 w-3.5 text-amber-400" />
                    <span>Selected Cleaning Services ({totalCleaningCount})</span>
                  </h4>
                  <span className="text-[10px] text-mist-400">
                    {cleaningSubtotal === 0 ? 'Complimentary' : `Subtotal: ₹${cleaningSubtotal}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedCleaningList.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="h-9 w-9 rounded-lg object-cover shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{s.title}</p>
                          <p className="text-[10px] text-mist-400">
                            ~{s.estimatedMinutes} mins &bull; {s.qty} session{s.qty > 1 ? 's' : ''}{' '}
                            {s.priceInfo.freeCount > 0 && (
                              <span className="text-emerald-300 font-medium">
                                ({s.priceInfo.freeCount} Free
                              </span>
                            )}
                            {s.priceInfo.billableCount > 0 && (
                              <span className="text-amber-300 font-medium ml-1">
                                + {s.priceInfo.billableCount} paid @ ₹{s.priceInfo.unitPrice})
                              </span>
                            )}
                            {s.priceInfo.freeCount > 0 && s.priceInfo.billableCount === 0 && (
                              <span className="text-emerald-300 font-medium">)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-xs">
                          {s.priceInfo.price === 0 ? (
                            <span className="text-emerald-300">₹0</span>
                          ) : (
                            <span className="text-amber-300">₹{s.priceInfo.price}</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetZeroCleaning(s.id)}
                          className="text-mist-400 hover:text-rose-400 p-1"
                          title="Remove service"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCleaningList.some((s) => s.id === 'clean-other') && otherCleaningText.trim() && (
                  <p className="text-[11px] text-amber-200 italic p-2 rounded-lg bg-amber-400/10">
                    Note: &quot;{otherCleaningText.trim()}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Service Schedule */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Service Schedule</span>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{scheduleDisplayString}</span>
              </p>
            </div>

            {/* Additional Instructions */}
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

            {/* FINAL BILL BREAKDOWN CARD (Requirement 2) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-black/40 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-white/5 text-amber-300 font-bold">
                <Receipt className="h-4 w-4" />
                <span className="uppercase text-[11px] tracking-wider">Final Bill Breakdown</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-mist-300">
                  <span>Amenities Subtotal</span>
                  <span className="font-mono">{amenitiesSubtotal === 0 ? '₹0 (Complimentary)' : `₹${amenitiesSubtotal}`}</span>
                </div>

                <div className="flex items-center justify-between text-mist-300">
                  <span>Cleaning Services Subtotal</span>
                  <span className="font-mono">{cleaningSubtotal === 0 ? '₹0 (Complimentary)' : `₹${cleaningSubtotal}`}</span>
                </div>

                <div className="flex items-center justify-between text-mist-300">
                  <span>Complimentary Items / Allowance</span>
                  <span className="font-mono text-emerald-300">
                    {totalComplimentaryUnits} units (₹0 Free)
                  </span>
                </div>

                <div className="flex items-center justify-between text-mist-300">
                  <span>Additional Charges ({totalBillableUnits} billable units)</span>
                  <span className="font-mono">{taxableSubtotal === 0 ? '₹0' : `₹${taxableSubtotal}`}</span>
                </div>

                <div className="flex items-center justify-between text-mist-300">
                  <span>Taxes (5% GST)</span>
                  <span className="font-mono">₹{taxAmount}</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between font-bold text-sm text-white">
                  <span>Final Payable Total</span>
                  <span className="font-mono text-base text-cyan-300">
                    {finalTotal === 0 ? '₹0' : `₹${finalTotal}`}
                  </span>
                </div>
              </div>

              {finalTotal === 0 && (
                <p className="text-[10px] text-emerald-300 text-center pt-1 font-medium">
                  ✓ All selected services are complimentary within standard suite allowances.
                </p>
              )}
            </div>
          </div>
        </GuestSheet>
      )}
    </div>
  );
}
