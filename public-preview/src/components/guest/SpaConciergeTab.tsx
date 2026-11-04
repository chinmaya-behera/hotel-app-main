'use client';

import { useState, useMemo } from 'react';
import {
  Flower2,
  Compass,
  Palmtree,
  Sparkles,
  Search,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Car,
  Plane,
  UtensilsCrossed,
  MapPin,
  Gift,
  Briefcase,
  ShieldCheck,
  X,
  Check,
  ArrowRight,
  Info,
  ChevronRight,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import {
  SPA_TREATMENTS,
  CONCIERGE_SERVICES,
  RECREATION_ACTIVITIES,
  SPA_TIME_SLOTS,
  type SpaTreatment,
  type ConciergeService,
  type RecreationActivity,
} from './spaConciergeData';

export function SpaConciergeTab({
  room,
  guestName,
  onNavigate,
  initialSubtab,
}: GuestTabProps) {
  const { state, submitGuestRequest } = useDemo();

  // Top Section Navigation: Spa & Wellness | Concierge | Recreation
  const [activeSection, setActiveSection] = useState<'spa' | 'concierge' | 'recreation'>(
    initialSubtab === 'concierge'
      ? 'concierge'
      : initialSubtab === 'recreation'
      ? 'recreation'
      : 'spa',
  );

  // Category filter state per section
  const [spaCategory, setSpaCategory] = useState<string>('all');
  const [conciergeCategory, setConciergeCategory] = useState<string>('all');
  const [recreationCategory, setRecreationCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Spa Booking Modal State
  const [bookingSpa, setBookingSpa] = useState<SpaTreatment | null>(null);
  const [spaSessionType, setSpaSessionType] = useState<'single' | 'couple'>('single');
  const [spaDate, setSpaDate] = useState<'today' | 'tomorrow' | 'day_after'>('today');
  const [spaTimeSlot, setSpaTimeSlot] = useState<string>('03:00 PM');
  const [therapistPref, setTherapistPref] = useState<'none' | 'female' | 'male'>('none');
  const [spaSpecialNotes, setSpaSpecialNotes] = useState('');
  const [spaChargeFolio, setSpaChargeFolio] = useState(true);

  // 2. Concierge Request Modal State
  const [activeConcierge, setActiveConcierge] = useState<ConciergeService | null>(null);
  const [isCustomConciergeOpen, setIsCustomConciergeOpen] = useState(false);
  const [ccDate, setCcDate] = useState('Tomorrow');
  const [ccTime, setCcTime] = useState('11:00 AM');
  const [ccFlightNo, setCcFlightNo] = useState('');
  const [ccPickupLocation, setCcPickupLocation] = useState('Resort Main Lobby');
  const [ccDestination, setCcDestination] = useState('');
  const [ccGuests, setCcGuests] = useState(2);
  const [ccLuggageCount, setCcLuggageCount] = useState(2);
  const [ccVehiclePref, setCcVehiclePref] = useState('Mercedes E-Class Executive Sedan');
  const [ccOccasionType, setCcOccasionType] = useState('Birthday Celebration');
  const [ccSpecialNote, setCcSpecialNote] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // 3. Recreation Reservation & Facility Modal State
  const [bookingRec, setBookingRec] = useState<RecreationActivity | null>(null);
  const [viewingFacility, setViewingFacility] = useState<RecreationActivity | null>(null);
  const [recDate, setRecDate] = useState<'today' | 'tomorrow'>('today');
  const [recTimeSlot, setRecTimeSlot] = useState<string>('10:00 AM');
  const [recParticipants, setRecParticipants] = useState<number>(2);
  const [recSpecialNote, setRecSpecialNote] = useState('');
  const [recChargeFolio, setRecChargeFolio] = useState(true);

  // Confirmation banner state
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [confirmedType, setConfirmedType] = useState<string>('');

  const nowHour = new Date().getHours();

  // Filtered Spa Treatments
  const filteredSpa = useMemo(() => {
    return SPA_TREATMENTS.filter((t) => {
      if (!t.isAvailable) return false;
      if (spaCategory !== 'all' && t.category !== spaCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [spaCategory, searchQuery]);

  // Filtered Concierge Services
  const filteredConcierge = useMemo(() => {
    return CONCIERGE_SERVICES.filter((c) => {
      if (!c.isAvailable) return false;
      if (conciergeCategory !== 'all' && c.category !== conciergeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conciergeCategory, searchQuery]);

  // Filtered Recreation Activities
  const filteredRecreation = useMemo(() => {
    return RECREATION_ACTIVITIES.filter((r) => {
      if (!r.isAvailable) return false;
      if (recreationCategory !== 'all' && r.category !== recreationCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.desc.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recreationCategory, searchQuery]);

  // Handle Spa Booking Submission
  function handleConfirmSpa() {
    if (!bookingSpa) return;

    const finalPrice =
      spaSessionType === 'couple' ? bookingSpa.couplePrice : bookingSpa.price;
    const sessionLabel =
      spaSessionType === 'couple' ? 'Couples Session (Dual Therapists)' : 'Single Session';
    const dateStr =
      spaDate === 'today' ? 'Today' : spaDate === 'tomorrow' ? 'Tomorrow' : 'Day After';

    const descLines = [
      `Treatment: ${bookingSpa.name} (${sessionLabel})`,
      `Duration: ${bookingSpa.duration}`,
      `Appointment Time: ${dateStr} at ${spaTimeSlot}`,
      `Therapist Preference: ${
        therapistPref === 'female'
          ? 'Female Therapist'
          : therapistPref === 'male'
          ? 'Male Therapist'
          : 'No Preference'
      }`,
      `Billing: ${spaChargeFolio ? `Charged to Room ${room} Folio (₹${finalPrice})` : 'Pay at Spa Reception'}`,
      spaSpecialNotes.trim() && `Guest Notes / Sensitivities: "${spaSpecialNotes.trim()}"`,
    ].filter(Boolean);

    const ref = submitGuestRequest({
      room,
      title: `${bookingSpa.name} · ${sessionLabel}`,
      meta: `Spa & Wellness · ${dateStr} at ${spaTimeSlot}`,
      category: 'spa',
      description: descLines.join('\n\n'),
      priority: 'normal',
      folioCharge: spaChargeFolio ? { label: `Spa · ${bookingSpa.name}`, amount: finalPrice } : undefined,
    });

    setConfirmedRef(ref);
    setConfirmedType('Spa Appointment');
    setBookingSpa(null);
    setSpaSpecialNotes('');
  }

  // Handle Concierge Request Submission
  function handleConfirmConcierge() {
    if (!activeConcierge && !isCustomConciergeOpen) return;

    const isCustom = isCustomConciergeOpen;
    const title = isCustom ? customSubject || 'General Concierge Request' : activeConcierge!.name;
    const descLines: string[] = [];

    if (isCustom) {
      descLines.push(`Request Details: ${customDescription.trim() || 'General inquiry'}`);
    } else {
      descLines.push(`Service: ${activeConcierge!.name} (${activeConcierge!.category})`);
      descLines.push(`Scheduled Date & Time: ${ccDate} at ${ccTime}`);

      if (activeConcierge!.requiresFlight && ccFlightNo.trim()) {
        descLines.push(`Flight / Train Details: ${ccFlightNo.trim()}`);
      }
      if (activeConcierge!.requiresDestination && ccDestination.trim()) {
        descLines.push(`Pickup / Destination: ${ccPickupLocation} → ${ccDestination.trim()}`);
      }
      if (activeConcierge!.requiresGuests) {
        descLines.push(`Number of Guests: ${ccGuests}`);
      }
      if (activeConcierge!.requiresVehicle) {
        descLines.push(`Vehicle Preference: ${ccVehiclePref} (Baggage: ${ccLuggageCount} pieces)`);
      }
      if (activeConcierge!.requiresOccasion) {
        descLines.push(`Special Occasion: ${ccOccasionType}`);
      }
      if (ccSpecialNote.trim()) {
        descLines.push(`Guest Special Instructions: "${ccSpecialNote.trim()}"`);
      }
    }

    const ref = submitGuestRequest({
      room,
      title,
      meta: `Concierge · Room ${room} · ${ccDate}`,
      category: 'concierge',
      description: descLines.join('\n\n'),
      priority: 'normal',
    });

    setConfirmedRef(ref);
    setConfirmedType('Concierge Request');
    setActiveConcierge(null);
    setIsCustomConciergeOpen(false);
    setCcSpecialNote('');
    setCustomSubject('');
    setCustomDescription('');
  }

  // Handle Recreation Reservation Submission
  function handleConfirmRecreation() {
    if (!bookingRec) return;

    const dateStr = recDate === 'today' ? 'Today' : 'Tomorrow';
    const descLines = [
      `Activity: ${bookingRec.name} (${bookingRec.category})`,
      `Location: ${bookingRec.location}`,
      `Reserved Slot: ${dateStr} at ${recTimeSlot}`,
      `Participants: ${recParticipants} guest(s)`,
      bookingRec.ageRestriction && `Age / Supervision: ${bookingRec.ageRestriction}`,
      `Charges: ${
        bookingRec.price > 0
          ? recChargeFolio
            ? `₹${bookingRec.price * recParticipants} billed to Room ${room}`
            : `₹${bookingRec.price * recParticipants} pay on arrival`
          : 'Complimentary Guest Activity'
      }`,
      recSpecialNote.trim() && `Special Requests: "${recSpecialNote.trim()}"`,
    ].filter(Boolean);

    const ref = submitGuestRequest({
      room,
      title: `${bookingRec.name} reservation`,
      meta: `Recreation · ${dateStr} at ${recTimeSlot}`,
      category: 'recreation',
      description: descLines.join('\n\n'),
      priority: 'normal',
      folioCharge:
        bookingRec.price > 0 && recChargeFolio
          ? { label: `Recreation · ${bookingRec.name}`, amount: bookingRec.price * recParticipants }
          : undefined,
    });

    setConfirmedRef(ref);
    setConfirmedType('Activity Reservation');
    setBookingRec(null);
    setRecSpecialNote('');
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 max-w-7xl mx-auto w-full">
      {/* CONFIRMATION BANNER */}
      {confirmedRef && (
        <div className="guest-card p-4 border-purple-400/50 bg-purple-400/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-400/20 text-purple-300 shrink-0 mt-0.5">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{confirmedType} Confirmed</span>
                <span className="font-mono text-amber-300 font-black">[{confirmedRef}]</span>
              </p>
              <p className="text-[11px] text-purple-200">
                Dispatched to our Guest Services &amp; Lifestyle team. Track live progress under Requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="px-3 py-1.5 rounded-xl bg-purple-400 text-ink-950 text-xs font-bold hover:bg-purple-300 shadow-sm transition-colors"
            >
              View in Requests
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

      {/* 1. 3-SEGMENT NAVIGATION TOGGLE (First prominent element) */}
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-ink-900/90 border border-white/10 shadow-md">
          <button
            type="button"
            onClick={() => {
              setActiveSection('spa');
              setSearchQuery('');
            }}
            className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
              activeSection === 'spa'
                ? 'bg-cyan-400 text-ink-950 font-black shadow-md'
                : 'text-mist-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flower2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Spa &amp; Wellness</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('concierge');
              setSearchQuery('');
            }}
            className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
              activeSection === 'concierge'
                ? 'bg-cyan-400 text-ink-950 font-black shadow-md'
                : 'text-mist-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="h-4 w-4 shrink-0" />
            <span className="truncate">Concierge</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('recreation');
              setSearchQuery('');
            }}
            className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
              activeSection === 'recreation'
                ? 'bg-cyan-400 text-ink-950 font-black shadow-md'
                : 'text-mist-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palmtree className="h-4 w-4 shrink-0" />
            <span className="truncate">Recreation</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSection === 'spa' ? 'spa treatments' : activeSection === 'concierge' ? 'concierge services' : 'activities & facilities'}...`}
            className="w-full rounded-xl bg-ink-900/80 border border-white/10 pl-9 pr-8 py-2.5 text-xs text-white placeholder-mist-400 focus:outline-none focus:border-cyan-400/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: SPA & WELLNESS                                */}
      {/* ======================================================== */}
      {activeSection === 'spa' && (
        <div className="space-y-4">
          {/* Category Navigation Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/5">
            {[
              { id: 'all', label: 'All Treatments' },
              { id: 'Essential Spa', label: 'Essential Spa' },
              { id: 'Exotic & Luxury Experiences', label: 'Exotic & Luxury' },
              { id: 'Wellness', label: 'Wellness Sessions' },
            ].map((cat) => {
              const isActive = spaCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? SPA_TREATMENTS.length
                  : SPA_TREATMENTS.filter((t) => t.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSpaCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-purple-400/20 text-purple-300 font-bold border-b-2 border-purple-400'
                      : 'text-mist-400 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Treatments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5.5">
            {filteredSpa.map((treatment) => (
              <div
                key={treatment.id}
                className="guest-card p-3.5 flex flex-col justify-between gap-3 hover:border-purple-400/40 transition-all group"
              >
                <div className="space-y-2.5">
                  {/* Media */}
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-ink-950 border border-white/10 shadow-md">
                    <img
                      src={treatment.image}
                      alt={treatment.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-ink-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-purple-300">
                      {treatment.category}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-ink-950/90 text-amber-300 font-mono font-bold text-xs border border-white/10">
                      ₹{treatment.price}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {treatment.name}
                    </h3>
                    <p className="text-[11px] text-mist-400 mt-1 line-clamp-2 leading-relaxed">
                      {treatment.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-mist-400">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    <span>{treatment.duration}</span>
                    {treatment.supportsCouple && (
                      <span className="text-[10px] text-purple-300 font-semibold ml-1">
                        &bull; Couple Option
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingSpa(treatment);
                      setSpaSessionType('single');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 active:scale-95 transition-all shadow-md"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: CONCIERGE                                     */}
      {/* ======================================================== */}
      {activeSection === 'concierge' && (
        <div className="space-y-4">
          {/* Category Navigation Chips */}
          <div className="flex items-center justify-between border-b border-white/5 pb-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'Travel & Transport', label: 'Travel & Transport' },
                { id: 'Reservations', label: 'Reservations' },
                { id: 'Explore & Experiences', label: 'Explore & Tours' },
                { id: 'Personal Assistance', label: 'Personal Assistance' },
                { id: 'Business Assistance', label: 'Business Support' },
              ].map((cat) => {
                const isActive = conciergeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setConciergeCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-purple-400/20 text-purple-300 font-bold border-b-2 border-purple-400'
                        : 'text-mist-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsCustomConciergeOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              + Custom Request
            </button>
          </div>

          {/* Concierge Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5.5">
            {filteredConcierge.map((service) => (
              <div
                key={service.id}
                className="guest-card p-3.5 flex flex-col justify-between gap-3 hover:border-purple-400/40 transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-ink-950 border border-white/10">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-ink-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-sky-300">
                      {service.category}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-[11px] text-mist-400 mt-1 line-clamp-2 leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300">
                    {service.pricingLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveConcierge(service)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 active:scale-95 transition-all shadow-md"
                  >
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: RECREATION                                    */}
      {/* ======================================================== */}
      {activeSection === 'recreation' && (
        <div className="space-y-4">
          {/* Category Navigation Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/5">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'Fitness & Sports', label: 'Fitness & Sports' },
              { id: 'Indoor Entertainment', label: 'Indoor Entertainment' },
              { id: 'Outdoor Activities', label: 'Outdoor Activities' },
              { id: 'Leisure & Experiences', label: 'Leisure & Experiences' },
            ].map((cat) => {
              const isActive = recreationCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? RECREATION_ACTIVITIES.length
                  : RECREATION_ACTIVITIES.filter((r) => r.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setRecreationCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-purple-400/20 text-purple-300 font-bold border-b-2 border-purple-400'
                      : 'text-mist-400 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5.5">
            {filteredRecreation.map((activity) => (
              <div
                key={activity.id}
                className="guest-card p-3.5 flex flex-col justify-between gap-3 hover:border-purple-400/40 transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-ink-950 border border-white/10 shadow-md">
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-ink-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-teal-300">
                      {activity.category}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-ink-950/90 text-white font-mono font-bold text-xs border border-white/10">
                      {activity.isComplimentary ? (
                        <span className="text-emerald-400">Complimentary</span>
                      ) : (
                        <span className="text-amber-300">₹{activity.price}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {activity.name}
                    </h3>
                    <p className="text-[11px] text-mist-400 mt-1 line-clamp-2 leading-relaxed">
                      {activity.desc}
                    </p>

                    {activity.ageRestriction && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-white/5 text-[10px] text-mist-300">
                        {activity.ageRestriction}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-mist-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="truncate max-w-[140px]">{activity.location}</span>
                  </span>

                  {activity.isOpenAccess ? (
                    <button
                      type="button"
                      onClick={() => setViewingFacility(activity)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                    >
                      Facility Info
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBookingRec(activity)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 active:scale-95 transition-all shadow-md"
                    >
                      Reserve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SPA BOOKING SHEET                               */}
      {/* ======================================================== */}
      {bookingSpa && (
        <GuestSheet
          onClose={() => setBookingSpa(null)}
          title={`Book ${bookingSpa.name}`}
        >
          <div className="space-y-4">
            {/* Treatment Summary Pill */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-400/10 border border-purple-400/30">
              <img
                src={bookingSpa.image}
                alt={bookingSpa.name}
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{bookingSpa.name}</p>
                <p className="text-[11px] text-purple-200">
                  {bookingSpa.duration} &bull; Base Price: ₹{bookingSpa.price}
                </p>
              </div>
            </div>

            {/* Individual vs Couple Selection (where supported) */}
            {bookingSpa.supportsCouple && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-purple-400" />
                  <span>Session Type</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpaSessionType('single')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      spaSessionType === 'single'
                        ? 'border-purple-400 bg-purple-400 text-ink-950 shadow-md'
                        : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                    }`}
                  >
                    <span>Individual (1 Person)</span>
                    <span className="block text-[10px] font-mono mt-0.5">₹{bookingSpa.price}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpaSessionType('couple')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      spaSessionType === 'couple'
                        ? 'border-purple-400 bg-purple-400 text-ink-950 shadow-md'
                        : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                    }`}
                  >
                    <span>Couple (Dual Therapists)</span>
                    <span className="block text-[10px] font-mono mt-0.5">₹{bookingSpa.couplePrice}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                <span>Appointment Date</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'day_after', label: 'Day After' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSpaDate(d.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all ${
                      spaDate === d.id
                        ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40'
                        : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <span>Available Treatment Slot (Spa Operating Hours: 08:30 AM – 09:00 PM)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {SPA_TIME_SLOTS.map((slot) => {
                  const isPast = spaDate === 'today' && slot.hour24 <= nowHour;
                  const isSelected = spaTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isPast}
                      onClick={() => setSpaTimeSlot(slot.time)}
                      className={`p-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                        isPast
                          ? 'opacity-30 bg-white/5 cursor-not-allowed line-through text-mist-500'
                          : isSelected
                          ? 'bg-purple-400 text-ink-950 font-bold shadow-md'
                          : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Therapist Gender Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white">Therapist Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'No Preference' },
                  { id: 'female', label: 'Female Therapist' },
                  { id: 'male', label: 'Male Therapist' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTherapistPref(opt.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                      therapistPref === opt.id
                        ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40 font-bold'
                        : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergy & Sensitivity Advisory */}
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Spa Advisory:</strong> Please inform our therapists about any allergies, skin sensitivities, or treatment pressure preferences prior to your session.
              </p>
            </div>

            {/* Special Request Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white">Special Requests / Preferences</label>
              <textarea
                value={spaSpecialNotes}
                onChange={(e) => setSpaSpecialNotes(e.target.value)}
                placeholder="e.g. Focus on lower back and shoulders, gentle pressure..."
                rows={2}
                className="w-full rounded-xl bg-ink-950 border border-white/10 p-2.5 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-purple-400/50"
              />
            </div>

            {/* Folio Billing Toggle */}
            <button
              type="button"
              onClick={() => setSpaChargeFolio(!spaChargeFolio)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-white">Charge to Room {room} Folio</p>
                <p className="text-[10px] text-mist-400">
                  {spaChargeFolio ? 'Will be settled on checkout' : 'Pay at spa reception upon arrival'}
                </p>
              </div>
              <div
                className={`h-5 w-5 rounded-md border grid place-items-center ${
                  spaChargeFolio
                    ? 'border-purple-400 bg-purple-400 text-ink-950 font-bold'
                    : 'border-white/20'
                }`}
              >
                {spaChargeFolio && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmSpa}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-xl"
            >
              Confirm Spa Booking &bull; ₹
              {spaSessionType === 'couple' ? bookingSpa.couplePrice : bookingSpa.price}
            </button>
          </div>
        </GuestSheet>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONCIERGE REQUEST SHEET                         */}
      {/* ======================================================== */}
      {(activeConcierge || isCustomConciergeOpen) && (
        <GuestSheet
          onClose={() => {
            setActiveConcierge(null);
            setIsCustomConciergeOpen(false);
          }}
          title={
            isCustomConciergeOpen
              ? 'Personal Concierge Request'
              : `Request ${activeConcierge?.name}`
          }
        >
          <div className="space-y-4 text-xs">
            {/* Service Headline */}
            {activeConcierge && (
              <div className="p-3 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{activeConcierge.name}</p>
                  <p className="text-[11px] text-sky-200">{activeConcierge.desc}</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 shrink-0 ml-2">
                  {activeConcierge.pricingLabel}
                </span>
              </div>
            )}

            {/* Custom Request Subject & Body */}
            {isCustomConciergeOpen && (
              <>
                <div className="space-y-1">
                  <label className="font-bold text-white">Request Subject *</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. Helicopter tour, Private yacht charter, Tailoring..."
                    className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-purple-400/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-white">Detailed Description *</label>
                  <textarea
                    rows={3}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Please explain what you require and any specific preferences or dates..."
                    className="w-full rounded-xl bg-ink-950 border border-white/10 p-2.5 text-white placeholder-mist-500 focus:outline-none focus:border-purple-400/50"
                  />
                </div>
              </>
            )}

            {/* Dynamic Contextual Fields for Pre-defined Services */}
            {activeConcierge && (
              <>
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-white">Preferred Date</label>
                    <input
                      type="text"
                      value={ccDate}
                      onChange={(e) => setCcDate(e.target.value)}
                      placeholder="e.g. Tomorrow"
                      className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-white">Preferred Time</label>
                    <input
                      type="text"
                      value={ccTime}
                      onChange={(e) => setCcTime(e.target.value)}
                      placeholder="e.g. 11:30 AM"
                      className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Airport / Transfer Fields */}
                {activeConcierge.requiresFlight && (
                  <div className="space-y-1">
                    <label className="font-bold text-white">Flight / Train Number</label>
                    <input
                      type="text"
                      value={ccFlightNo}
                      onChange={(e) => setCcFlightNo(e.target.value)}
                      placeholder="e.g. AI-804 / 6E-243"
                      className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white uppercase"
                    />
                  </div>
                )}

                {activeConcierge.requiresDestination && (
                  <div className="space-y-1">
                    <label className="font-bold text-white">Destination / Venue Name</label>
                    <input
                      type="text"
                      value={ccDestination}
                      onChange={(e) => setCcDestination(e.target.value)}
                      placeholder="e.g. Terminal 2, The Olive Terrace, City Palace..."
                      className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                )}

                {/* Vehicle Selection */}
                {activeConcierge.requiresVehicle && (
                  <div className="space-y-1">
                    <label className="font-bold text-white">Vehicle Class</label>
                    <select
                      value={ccVehiclePref}
                      onChange={(e) => setCcVehiclePref(e.target.value)}
                      className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                    >
                      <option value="Mercedes E-Class Executive Sedan">Mercedes E-Class Executive Sedan</option>
                      <option value="BMW 7 Series Luxury Flagship">BMW 7 Series Luxury Flagship</option>
                      <option value="Toyota Vellfire VIP Lounge MPV">Toyota Vellfire VIP Lounge MPV</option>
                    </select>
                  </div>
                )}

                {/* Number of Guests & Luggage */}
                {activeConcierge.requiresGuests && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-white">Number of Guests</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={ccGuests}
                        onChange={(e) => setCcGuests(Number(e.target.value))}
                        className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                      />
                    </div>
                    {activeConcierge.requiresVehicle && (
                      <div className="space-y-1">
                        <label className="font-bold text-white">Luggage Count</label>
                        <input
                          type="number"
                          min={0}
                          max={8}
                          value={ccLuggageCount}
                          onChange={(e) => setCcLuggageCount(Number(e.target.value))}
                          className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Occasion details */}
                {activeConcierge.requiresOccasion && (
                  <div className="space-y-1">
                    <label className="font-bold text-white">Occasion Type</label>
                    <select
                      value={ccOccasionType}
                      onChange={(e) => setCcOccasionType(e.target.value)}
                      className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white"
                    >
                      <option value="Birthday Celebration">Birthday Celebration</option>
                      <option value="Anniversary Dinner">Anniversary Dinner</option>
                      <option value="Romantic Proposal">Romantic Proposal</option>
                      <option value="Family Gathering">Family Gathering</option>
                    </select>
                  </div>
                )}

                {/* Instructions */}
                <div className="space-y-1">
                  <label className="font-bold text-white">Special Notes / Requirements</label>
                  <textarea
                    rows={2}
                    value={ccSpecialNote}
                    onChange={(e) => setCcSpecialNote(e.target.value)}
                    placeholder="Specific requests, dietary restrictions, preferred seating..."
                    className="w-full rounded-xl bg-ink-950 border border-white/10 p-2.5 text-white placeholder-mist-500 focus:outline-none focus:border-purple-400/50"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleConfirmConcierge}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-xl"
            >
              Submit Concierge Request
            </button>
          </div>
        </GuestSheet>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECREATION FACILITY INFO SHEET                  */}
      {/* ======================================================== */}
      {viewingFacility && (
        <GuestSheet
          onClose={() => setViewingFacility(null)}
          title={viewingFacility.name}
        >
          <div className="space-y-4">
            <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-ink-950 border border-white/10">
              <img
                src={viewingFacility.image}
                alt={viewingFacility.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-ink-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-emerald-300">
                Open Access Facility
              </div>
            </div>

            <p className="text-xs text-mist-200 leading-relaxed">
              {viewingFacility.desc}
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-mist-400">Operating Hours:</span>
                <span className="font-bold text-white">{viewingFacility.operatingHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist-400">Location:</span>
                <span className="font-bold text-white">{viewingFacility.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist-400">Access Rules:</span>
                <span className="font-bold text-white">{viewingFacility.ageRestriction}</span>
              </div>
            </div>

            {viewingFacility.rules && viewingFacility.rules.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                  <span>Facility Guidelines &amp; Etiquette</span>
                </h4>
                <ul className="space-y-1 text-xs text-mist-300 list-disc list-inside">
                  {viewingFacility.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => setViewingFacility(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </GuestSheet>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: RECREATION ACTIVITY RESERVATION SHEET           */}
      {/* ======================================================== */}
      {bookingRec && (
        <GuestSheet
          onClose={() => setBookingRec(null)}
          title={`Reserve ${bookingRec.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-teal-400/10 border border-teal-400/30 flex items-center gap-3">
              <img
                src={bookingRec.image}
                alt={bookingRec.name}
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{bookingRec.name}</p>
                <p className="text-[11px] text-teal-200">
                  {bookingRec.location} &bull;{' '}
                  {bookingRec.isComplimentary ? 'Complimentary' : `₹${bookingRec.price} / person`}
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-400" />
                <span>Reservation Date</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecDate('today')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all ${
                    recDate === 'today'
                      ? 'bg-teal-400/20 text-teal-300 border border-teal-400/40'
                      : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setRecDate('tomorrow')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all ${
                    recDate === 'tomorrow'
                      ? 'bg-teal-400/20 text-teal-300 border border-teal-400/40'
                      : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Time Slot Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white">Preferred Time Slot</label>
              <input
                type="text"
                value={recTimeSlot}
                onChange={(e) => setRecTimeSlot(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Participants */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white">Number of Participants</label>
              <input
                type="number"
                min={1}
                max={8}
                value={recParticipants}
                onChange={(e) => setRecParticipants(Number(e.target.value))}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>

            {bookingRec.ageRestriction && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-mist-300">
                <strong>Restriction Notice:</strong> {bookingRec.ageRestriction}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-white">Special Requests / Equipment notes</label>
              <textarea
                rows={2}
                value={recSpecialNote}
                onChange={(e) => setRecSpecialNote(e.target.value)}
                placeholder="e.g. Left-handed tennis racquet, dietary needs for cooking class..."
                className="w-full rounded-xl bg-ink-950 border border-white/10 p-2.5 text-xs text-white placeholder-mist-500"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmRecreation}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-ink-950 font-black text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-xl"
            >
              Confirm Reservation &bull;{' '}
              {bookingRec.price > 0 ? `₹${bookingRec.price * recParticipants}` : 'Complimentary'}
            </button>
          </div>
        </GuestSheet>
      )}
    </div>
  );
}
