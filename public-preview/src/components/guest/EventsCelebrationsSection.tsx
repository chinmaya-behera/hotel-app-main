'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  PartyPopper,
  Calendar,
  Clock,
  Users,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  Palette,
  CheckCircle2,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Minus,
  Heart,
  Cake,
  Sun,
  Briefcase,
  Wine,
  Gem,
  Info,
  ShieldCheck,
  Send,
  Hotel,
  Sliders,
  ChevronRight,
  Eye,
  Camera,
  Music,
  Gift,
  Car,
  UserCheck,
  Flame,
  Star,
  Baby,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { money, cn } from '@/lib/utils';
import type { GuestTabProps } from '@/components/guest/types';
import {
  EVENT_CATEGORIES,
  EVENT_SPECIFIC_THEMES,
  EVENT_HEADINGS_AND_INTROS,
  DECOR_THEMES,
  CATERING_STYLES,
  EVENT_ADDONS,
  VENUE_OPTIONS,
  type EventCategoryItem,
  type DecorThemeOption,
} from './eventsData';

type ViewMode = 'listing' | 'details' | 'custom_builder' | 'review';

export function EventsCelebrationsSection({ room, guestName, onNavigate }: GuestTabProps) {
  const { state, submitGuestRequest } = useDemo();
  const eventsConfig = state.eventsConfig;

  // Active top-level view: 'listing' | 'details' | 'custom_builder' | 'review'
  const [viewMode, setViewMode] = useState<ViewMode>('listing');

  // Selected occasion
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('birthday');

  // Confirmation state
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Event details
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [eventDate, setEventDate] = useState<string>(defaultDateStr);
  const [eventSlot, setEventSlot] = useState<'evening' | 'morning' | 'afternoon' | 'full_day'>('evening');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [selectedVenue, setSelectedVenue] = useState<string>(VENUE_OPTIONS[0]);

  // Selected theme per category draft { [occasionId]: themeId }
  const [selectedThemeMap, setSelectedThemeMap] = useState<Record<string, string>>({
    birthday: 'bday_glam',
    wedding: 'wed_royal',
    anniversary: 'anniv_candle',
    engagement: 'eng_rose_neon',
    pooja: 'pooja_temple',
    baby_shower: 'baby_pastel',
    corporate_events: 'corp_formal',
    family_functions: 'fam_heritage',
    social_events: 'soc_gatsby',
  });

  // Selected catering & add-ons
  const [selectedCateringId, setSelectedCateringId] = useState<string>(CATERING_STYLES[1].id);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({
    photography: true,
    designer_cake: true,
  });

  // Custom budget & instructions
  const [customBudget, setCustomBudget] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // -------------------------------------------------------------
  // EVENT-SPECIFIC DRAFT CUSTOMIZATION FIELDS (Preserved on Back)
  // -------------------------------------------------------------
  const [customDrafts, setCustomDrafts] = useState<Record<string, any>>({
    birthday: {
      celebrantName: '',
      celebrantAge: '',
      cakeFlavor: 'Belgian Chocolate Truffle',
      cakeWeight: '2 kg',
      cakeMessage: 'Happy Birthday!',
      balloonStyle: 'Organic Garland Arch & Shimmer Wall',
      entertainment: ['Live DJ & Sound System', 'Instant Polaroid Photo Booth'],
      seatingStyle: 'Round Banquet Tables with Centerpieces',
    },
    wedding: {
      brideName: '',
      groomName: '',
      ceremonyType: 'Grand Wedding & Reception',
      mandapLocation: 'Grand Imperial Ballroom Stage',
      entranceStyle: 'Royal Dhol Welcome with Red Carpet Petals',
      cateringFeast: 'Royal 100-Item Multi-Cuisine Buffet',
      specialServices: ['Bridal Makeup Suite Coordination', 'Valet Concierge & Campus Shuttle'],
    },
    anniversary: {
      coupleNames: '',
      yearsTogether: '25 Years (Silver Jubilee)',
      diningSetup: 'Private Poolside Candlelight Cabana',
      cakeFlavor: 'Heart-Shaped Red Velvet with Rose Petals',
      musicAtmosphere: 'Solo Violinist Romantic Serenade',
      specialKeepsakes: ['Bouquet of 50 Dutch Long-Stem Roses', 'Personalized Souvenir Menu Cards'],
    },
    engagement: {
      coupleNames: '',
      proposalType: 'Grand Ring Ceremony & Cocktail',
      ringPresentation: 'Velvet Ring Box on Illuminated Crystal Pedestal',
      backdropStyle: 'Giant "Marry Me" / "Forever" LED Neon Sign',
      specialEffects: ['Cold Pyrotechnic Sparkler Fountains on "Yes!"', 'Hidden Candid Paparazzi Photographer'],
    },
    pooja: {
      poojaType: 'Satyanarayan Mahapooja & Katha',
      auspiciousTime: 'Morning Muhurat (08:30 AM - 11:30 AM)',
      priestArrangement: 'Request experienced Vedic Panditji through hotel concierge',
      seatingArrangement: 'Floor Mattresses with Pure Silk Covers & Wooden Bajots',
      prasadFeast: 'Traditional Satvik Pure Vegetarian Bhojanam (No Onion/Garlic)',
      ritualKitIncluded: true,
    },
    baby_shower: {
      parentsNames: '',
      showerType: 'First Baby Celebration (Mom-to-Be)',
      momSeating: 'Luxury Velvet Peacock Armchair with Floral Garland',
      cakeDessertTable: 'Custom 2-Tier Pastel Theme Cake & Macarons',
      welcomeSignage: 'Acrylic Welcome Easel with Baby Name & Balloons',
      funActivities: ['Baby Prediction & Wishes Cards', 'Instant Photo Booth with Baby Props'],
    },
    corporate_events: {
      companyName: '',
      eventPurpose: 'Annual Executive Leadership Summit & Dinner',
      seatingLayout: 'Classroom Setup with Notepads & Pens (AM) / Banquet (PM)',
      avPackage: 'Ultra-Wide 4K P2.5 LED Video Wall + Collar & Handheld Mics',
      stagePodium: 'Executive Speaking Podium with Custom Company Logo Riser',
      cateringBreaks: 'Continuous Coffee/Tea & Executive Snack Break + Lunch Buffet',
    },
    family_functions: {
      familyName: '',
      gatheringType: 'Multi-Generational Golden Family Reunion',
      interactiveCounters: ['Live Chaat Street Counter', 'Live Pasta & Tandoor Station', 'Ice Cream Sundae Bar'],
      entertainment: ['Family Karaoke Sound Setup', 'Memory Slideshow on 4K LED Screen', 'Group Portrait Photographer'],
    },
    social_events: {
      hostName: '',
      eventVibe: 'Black Tie Cocktail Gala & DJ Soirée',
      barService: 'Signature Cocktails with Flaring Mixologist + Mocktail Bar',
      entertainment: ['Club DJ with Subwoofer & Moving Stage Heads', 'Live Saxophone Accompaniment'],
    },
  });

  // -------------------------------------------------------------
  // "CREATE YOUR OWN EVENT" BUILDER STATE (Step-by-step)
  // -------------------------------------------------------------
  const [customStep, setCustomStep] = useState<number>(1);
  const [customEventData, setCustomEventData] = useState({
    name: '',
    type: 'Bespoke Celebration',
    purpose: '',
    date: defaultDateStr,
    startTime: '18:30',
    duration: '4 Hours',
    guestCount: 60,
    venue: 'Grand Imperial Ballroom',
    setupType: 'Indoor Luxury Ballroom',
    themeName: 'Custom Bespoke Elegance',
    colorPalette: 'Gold, Ivory & Emerald Green',
    customDecorNotes: '',
    referenceLink: '',
    cateringPreference: 'Grand Multi-Cuisine Gourmet Buffet',
    dietaryNotes: 'Pure vegetarian and gluten-free options required',
    entertainment: ['Live Acoustic Music', 'Professional Photographer'],
    budgetRange: '₹1,50,000 - ₹2,50,000',
    specialNotes: '',
  });

  // -------------------------------------------------------------
  // RELIABLE BROWSER & MOBILE HISTORY NAVIGATION SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if initial window history already has an event sub-state
    const currentState = window.history.state;
    if (currentState && currentState.portal && currentState.subtab === 'events_celebrations') {
      if (currentState.eventView === 'details' && currentState.eventId) {
        setSelectedOccasionId(currentState.eventId);
        setViewMode('details');
      } else if (currentState.eventView === 'custom_builder') {
        setViewMode('custom_builder');
      } else if (currentState.eventView === 'review') {
        setViewMode('review');
      } else {
        setViewMode('listing');
      }
    } else {
      // Ensure the base listing has a known history state marker
      window.history.replaceState(
        { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: 'listing' },
        ''
      );
    }

    const handlePopState = (e: PopStateEvent) => {
      const st = e.state;
      // If staying within events_celebrations subtab
      if (st && st.tab === 'services' && st.subtab === 'events_celebrations') {
        if (!st.eventView || st.eventView === 'listing') {
          setViewMode('listing');
        } else if (st.eventView === 'details' && st.eventId) {
          setSelectedOccasionId(st.eventId);
          setViewMode('details');
        } else if (st.eventView === 'custom_builder') {
          setViewMode('custom_builder');
        } else if (st.eventView === 'review') {
          setViewMode('review');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // -------------------------------------------------------------
  // COMPUTED VALUES
  // -------------------------------------------------------------
  const activeOccasion = useMemo(() => {
    return (
      EVENT_CATEGORIES.find((c) => c.id === selectedOccasionId) ||
      EVENT_CATEGORIES[0]
    );
  }, [selectedOccasionId]);

  // Heading & intro dynamically matching the selected occasion
  const headingInfo = useMemo(() => {
    return (
      EVENT_HEADINGS_AND_INTROS[selectedOccasionId] || {
        heading: activeOccasion.name,
        intro: activeOccasion.desc,
      }
    );
  }, [selectedOccasionId, activeOccasion]);

  // Available themes for the selected occasion
  const availableThemes: DecorThemeOption[] = useMemo(() => {
    return EVENT_SPECIFIC_THEMES[selectedOccasionId] || DECOR_THEMES;
  }, [selectedOccasionId]);

  // Active theme object
  const activeTheme = useMemo(() => {
    const currentThemeId = selectedThemeMap[selectedOccasionId];
    return (
      availableThemes.find((t) => t.id === currentThemeId) ||
      availableThemes[0] ||
      DECOR_THEMES[0]
    );
  }, [availableThemes, selectedThemeMap, selectedOccasionId]);

  // Selected catering object
  const activeCatering = useMemo(() => {
    return CATERING_STYLES.find((c) => c.id === selectedCateringId) || CATERING_STYLES[0];
  }, [selectedCateringId]);

  // Selected addons list
  const activeAddonsList = useMemo(() => {
    return EVENT_ADDONS.filter((a) => selectedAddons[a.id]);
  }, [selectedAddons]);

  // Estimated budget calculation
  const calculatedEstimate = useMemo(() => {
    if (viewMode === 'custom_builder') {
      return 85000 + (customEventData.guestCount * 1400);
    }
    const baseOccasion = activeOccasion.startingPrice;
    const decorPrice = activeTheme.addedPrice;
    const cateringTotal = activeCatering.pricePerPlate * guestCount;
    const addonsTotal = activeAddonsList.reduce((sum, a) => sum + a.price, 0);
    return baseOccasion + decorPrice + cateringTotal + addonsTotal;
  }, [viewMode, customEventData.guestCount, activeOccasion, activeTheme, activeCatering, guestCount, activeAddonsList]);

  // -------------------------------------------------------------
  // NAVIGATION HANDLERS (Mobile Back, Switching & History)
  // -------------------------------------------------------------

  // Open event details from card
  function handleOpenEventDetails(occasionId: string) {
    setSelectedOccasionId(occasionId);
    setViewMode('details');
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: 'details', eventId: occasionId },
        ''
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Back from details to event listing (reliably returning to listing, NEVER to home page)
  function handleBackToListing() {
    setViewMode('listing');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      if (window.history.state && window.history.state.eventView && window.history.state.eventView !== 'listing') {
        window.history.back();
      } else {
        window.history.replaceState(
          { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: 'listing' },
          ''
        );
      }
    }
  }

  // Open Custom Event Builder
  function handleOpenCustomBuilder() {
    setViewMode('custom_builder');
    setCustomStep(1);
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: 'custom_builder' },
        ''
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Proceed to review screen
  function handleProceedToReview() {
    setViewMode('review');
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: 'review' },
        ''
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Back from review screen to details / builder
  function handleBackFromReview() {
    const targetMode = selectedOccasionId === 'custom_builder' ? 'custom_builder' : 'details';
    setViewMode(targetMode);
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: targetMode, eventId: selectedOccasionId },
        ''
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handler to toggle add-on
  function handleToggleAddon(id: string) {
    setSelectedAddons((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // Handler to select theme for current occasion
  function handleSelectTheme(themeId: string) {
    setSelectedThemeMap((prev) => ({
      ...prev,
      [selectedOccasionId]: themeId,
    }));
  }

  // Handler to update custom draft fields
  function updateDraftField(field: string, value: any) {
    setCustomDrafts((prev) => ({
      ...prev,
      [selectedOccasionId]: {
        ...(prev[selectedOccasionId] || {}),
        [field]: value,
      },
    }));
  }

  // Final submission of event enquiry
  function handleFinalSubmit() {
    setIsSubmitting(true);

    let title = '';
    const descLines: string[] = [];

    if (viewMode === 'custom_builder') {
      title = `Custom Event: ${customEventData.name || 'Bespoke Celebration'}`;
      descLines.push(
        `Event: ${customEventData.name || 'Bespoke Celebration'} (${customEventData.type})`,
        `Purpose: ${customEventData.purpose || 'Custom celebration'}`,
        `Date & Time: ${customEventData.date} at ${customEventData.startTime} (${customEventData.duration})`,
        `Expected Guests: ${customEventData.guestCount} attendees`,
        `Preferred Venue: ${customEventData.venue} (${customEventData.setupType})`,
        `Theme & Palette: ${customEventData.themeName} · Colours: ${customEventData.colorPalette}`,
        customEventData.customDecorNotes ? `Decor Specifications: "${customEventData.customDecorNotes}"` : '',
        `Catering Style: ${customEventData.cateringPreference}`,
        customEventData.dietaryNotes ? `Dietary Instructions: "${customEventData.dietaryNotes}"` : '',
        `Entertainment & AV: ${customEventData.entertainment.join(', ')}`,
        `Estimated Budget: ${customEventData.budgetRange}`,
        customEventData.specialNotes ? `Special Notes: "${customEventData.specialNotes}"` : '',
        `Guest Stay: Room ${room} · ${guestName}`,
        `Booking Status: Pending Specialist Review & Venue Confirmation`
      );
    } else {
      const draft = customDrafts[selectedOccasionId] || {};
      const slotLabel =
        eventSlot === 'evening'
          ? 'Evening (18:00 - 23:00)'
          : eventSlot === 'morning'
          ? 'Morning (09:00 - 13:00)'
          : eventSlot === 'afternoon'
          ? 'Afternoon (13:00 - 17:00)'
          : 'Full Day Grand Event';

      title = `Events & Celebrations · ${headingInfo.heading}`;
      descLines.push(
        `Occasion: ${headingInfo.heading}`,
        `Date & Time: ${eventDate} · Slot: ${slotLabel}`,
        `Expected Guests: ${guestCount} attendees`,
        `Preferred Venue: ${selectedVenue}`,
        `Selected Theme: ${activeTheme.name} (+${money(activeTheme.addedPrice)})`,
        `Catering Style: ${activeCatering.name} (${money(activeCatering.pricePerPlate)}/plate)`,
        activeAddonsList.length > 0
          ? `Add-ons: ${activeAddonsList.map((a) => `${a.name} (${money(a.price)})`).join(', ')}`
          : 'Add-ons: None',
        // Event-specific details
        ...Object.entries(draft).map(([k, v]) => {
          if (!v) return '';
          if (Array.isArray(v)) return `${k.replace(/([A-Z])/g, ' $1')}: ${v.join(', ')}`;
          return `${k.replace(/([A-Z])/g, ' $1')}: ${v}`;
        }),
        `Estimated Budget: ${customBudget.trim() ? customBudget.trim() : money(calculatedEstimate)}`,
        specialInstructions.trim() ? `Special Notes: "${specialInstructions.trim()}"` : '',
        `Guest Stay: Room ${room} · ${guestName}`,
        `Booking Status: Pending Specialist Review & Venue Confirmation`
      );
    }

    const ref = submitGuestRequest({
      room,
      title,
      category: 'concierge',
      meta: `Events & Banqueting · Room ${room} · ${viewMode === 'custom_builder' ? customEventData.date : eventDate}`,
      description: descLines.filter(Boolean).join('\n'),
      priority: 'vip',
    });

    setConfirmedRef(ref);
    setIsSubmitting(false);
    setViewMode('listing');
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        { portal: true, tab: 'services', subtab: 'events_celebrations', eventView: 'listing' },
        ''
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // VIEW 1: EVENT LISTING DIRECTORY
  // =========================================================================
  if (viewMode === 'listing') {
    return (
      <div className="space-y-6 pb-28 max-w-5xl mx-auto animate-in fade-in duration-300">
        {/* SUCCESS CONFIRMATION BANNER */}
        {confirmedRef && (
          <div className="guest-card p-5 border-emerald-400/50 bg-emerald-400/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400/20 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Celebration Enquiry Successfully Registered!</span>
                  <span className="font-mono text-cyan-300 font-black">[{confirmedRef}]</span>
                </p>
                <p className="text-xs text-emerald-200">
                  Your enquiry has been routed with VIP priority to our Director of Banquets &amp; Events. A dedicated event specialist will connect with you in Room {room} within 60 minutes to review venue availability and customize your celebration.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('activity')}
                className="px-3.5 py-2 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-md transition-colors"
              >
                View in My Activity
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

        {/* HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-ink-900">
          <div className="h-48 sm:h-60 w-full relative">
            <img
              src={eventsConfig?.cardImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'}
              alt="Grand Hotel Banqueting & Celebrations"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/65 to-transparent" />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Grand Azure Event Studios</span>
            </div>

            <div className="absolute bottom-4 left-4 sm:left-6 sm:bottom-6 right-4 max-w-2xl space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-400/30">
                Luxury Event Management
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Events &amp; Celebrations</span>
                <span className="text-xl sm:text-2xl">🎉</span>
              </h1>
              <p className="text-xs sm:text-sm text-mist-200">
                {eventsConfig?.subtitle || 'Plan your special moments with us.'} Intimate birthday surprises, wedding banquets, poojas &amp; corporate galas.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION: CREATE YOUR OWN EVENT (Visually Distinct Highlighted Section) */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-950/40 via-ink-900 to-cyan-950/30 p-5 sm:p-6 shadow-xl backdrop-blur-sm group hover:border-amber-400/70 transition-all">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden shrink-0 border border-amber-400/30 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=300&q=80"
                  alt="Custom celebration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-1.5 left-1.5 text-amber-300">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                    Bespoke Event Studio
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  Create Your Own Event
                </h2>
                <p className="text-xs text-mist-300">
                  Have something unique in mind? Design your celebration your way with custom themes, flexible setups, tailor-made dining &amp; dedicated concierge assistance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCustomBuilder}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-ink-950 font-black text-xs sm:text-sm hover:shadow-lg hover:shadow-amber-500/25 active:scale-95 transition-all shrink-0 border border-amber-300/60"
            >
              <span>Start Customising</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SECTION: EVENT CATEGORIES DIRECTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-cyan-400" />
                <span>Featured Occasion Collections</span>
              </h2>
              <p className="text-xs text-mist-400">
                Select an occasion below to customize tailored themes, decoration, catering and arrangements.
              </p>
            </div>
            <span className="text-xs text-cyan-300 font-mono font-semibold">
              {EVENT_CATEGORIES.length} Collections
            </span>
          </div>

          {/* 9 Event Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EVENT_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="guest-card p-3.5 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.03] transition-all duration-300 group relative overflow-hidden"
              >
                {cat.popular && (
                  <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-amber-400 text-ink-950 text-[9px] font-black uppercase tracking-wider shadow">
                    Popular
                  </span>
                )}

                <div className="space-y-2.5">
                  <div className="relative h-40 w-full rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-ink-950/80 backdrop-blur-sm border border-white/10 text-[10px] text-amber-300 font-semibold">
                      Starting from {money(cat.startingPrice)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-mist-300 mt-1 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-mist-400 font-medium">
                    {EVENT_SPECIFIC_THEMES[cat.id]?.length || 4} Bespoke Themes
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenEventDetails(cat.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-400 hover:text-ink-950 transition-all group-hover:shadow-md active:scale-95"
                  >
                    <span>Customize</span>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DEDICATED EVENT DETAILS & CUSTOMISATION EXPERIENCE
  // EXACT REQUIRED HIERARCHY:
  // 1. Back to Events action
  // 2. Event-specific heading
  // 3. Short event-specific introduction
  // 4. Large event-specific hero image or banner
  // 5. Event-specific theme selection
  // 6. Decoration and colour customisation
  // 7. Event-specific requirements and arrangements
  // 8. Food, beverages and additional services
  // 9. Date, time, guest count and venue details
  // 10. Booking/enquiry summary and Continue/Review action
  // =========================================================================
  if (viewMode === 'details') {
    const draft = customDrafts[selectedOccasionId] || {};

    return (
      <div className="space-y-6 pb-28 max-w-5xl mx-auto animate-in fade-in duration-300">
        {/* 1. BACK TO EVENTS ACTION (Reliable return to listing, preserves all drafts) */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handleBackToListing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-cyan-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Event Collections</span>
          </button>
          <span className="text-[11px] font-semibold text-mist-400">
            Room {room} · {guestName}
          </span>
        </div>

        {/* 2. EVENT-SPECIFIC HEADING & 3. SHORT EVENT-SPECIFIC INTRODUCTION */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-400/30">
              Occasion Customisation
            </span>
            <span className="text-[11px] font-mono text-amber-300 font-bold">
              Starting from {money(activeOccasion.startingPrice)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{headingInfo.heading}</span>
            <span className="text-xl sm:text-2xl">🎉</span>
          </h1>

          <p className="text-xs sm:text-sm text-mist-200 max-w-2xl leading-relaxed">
            {headingInfo.intro}
          </p>
        </div>

        {/* 4. LARGE, ATTRACTIVE EVENT-SPECIFIC HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-ink-900">
          <div className="h-52 sm:h-72 w-full relative">
            <img
              src={activeOccasion.image}
              alt={headingInfo.heading}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Starting from {money(activeOccasion.startingPrice)}</span>
            </div>

            <div className="absolute bottom-4 left-4 sm:left-6 right-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {activeOccasion.suggestedVenues.map((v, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-ink-950/85 backdrop-blur-md border border-white/15 text-[10px] font-medium text-amber-200 flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3 text-amber-400" />
                    <span>{v}</span>
                  </span>
                ))}
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-400/90 text-ink-950 text-xs font-black shadow-md flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{availableThemes.length} Bespoke Themes Available</span>
              </span>
            </div>
          </div>
        </div>

        {/* 5. EVENT-SPECIFIC THEME SELECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Palette className="h-4 w-4 text-cyan-400" />
                <span>5. Select Decoration Theme &amp; Styling</span>
              </h2>
              <p className="text-xs text-mist-400">
                Curated visual styling themes specifically tailored for {headingInfo.heading}.
              </p>
            </div>
            <span className="text-xs text-cyan-300 font-mono font-semibold">
              Selected: {activeTheme.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {availableThemes.map((thm) => {
              const isSelected = activeTheme.id === thm.id;

              return (
                <div
                  key={thm.id}
                  onClick={() => handleSelectTheme(thm.id)}
                  className={cn(
                    'guest-card p-3 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between border group relative overflow-hidden',
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                      : 'border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.03]'
                  )}
                >
                  <div className="space-y-2.5">
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={thm.image}
                        alt={thm.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-amber-300">
                        +{money(thm.addedPrice)}
                      </span>
                      {isSelected && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyan-400 text-ink-950 text-[10px] font-black flex items-center gap-1 shadow">
                          <Check className="h-3 w-3" />
                          <span>Active Theme</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {thm.name}
                      </h4>
                      <p className="text-[11px] text-mist-300 mt-0.5 leading-relaxed">
                        {thm.desc}
                      </p>
                    </div>

                    {/* Color Palette Preview Dots */}
                    {thm.palette && thm.palette.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] text-mist-400 font-semibold uppercase tracking-wider">Palette:</span>
                        <div className="flex items-center gap-1">
                          {thm.palette.map((color, i) => (
                            <span
                              key={i}
                              className="h-3.5 w-3.5 rounded-full border border-white/30 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. DECORATION AND COLOUR CUSTOMISATION SUMMARY */}
        <div className="guest-card p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 shrink-0">
              <Palette className="h-5 w-5" />
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                Active Theme: {activeTheme.name}
              </span>
              <p className="text-[11px] text-mist-300">
                {activeTheme.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-mist-400 font-medium">Palette Swatches:</span>
            <div className="flex items-center gap-1">
              {activeTheme.palette?.map((c, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 ml-2">
              +{money(activeTheme.addedPrice)}
            </span>
          </div>
        </div>

        {/* 7. EVENT-SPECIFIC REQUIREMENTS AND ARRANGEMENTS */}
        <div className="guest-card p-5 space-y-4 border border-white/10 rounded-2xl">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>7. {headingInfo.heading} Requirements &amp; Arrangements</span>
            </h2>
            <p className="text-xs text-mist-400 mt-0.5">
              Customize arrangements specifically applicable to this celebration.
            </p>
          </div>

          {/* DYNAMIC FORM CONTROLS PER OCCASION */}
          {selectedOccasionId === 'birthday' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Birthday Celebrant Name</label>
                <input
                  type="text"
                  value={draft.celebrantName || ''}
                  onChange={(e) => updateDraftField('celebrantName', e.target.value)}
                  placeholder="e.g. Arjun / Maya"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Age / Milestone</label>
                <input
                  type="text"
                  value={draft.celebrantAge || ''}
                  onChange={(e) => updateDraftField('celebrantAge', e.target.value)}
                  placeholder="e.g. 5th Birthday / 30th Milestone"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Designer Cake Flavor</label>
                <select
                  value={draft.cakeFlavor || 'Belgian Chocolate Truffle'}
                  onChange={(e) => updateDraftField('cakeFlavor', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Belgian Chocolate Truffle">Belgian Chocolate Truffle</option>
                  <option value="Red Velvet with Cream Cheese">Red Velvet with Cream Cheese</option>
                  <option value="Madagascar Vanilla & Fresh Berries">Madagascar Vanilla & Fresh Berries</option>
                  <option value="New York Blueberry Cheesecake">New York Blueberry Cheesecake</option>
                  <option value="Mango Passionfruit Entremet">Mango Passionfruit Entremet</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Cake Size / Inscription</label>
                <input
                  type="text"
                  value={draft.cakeMessage || ''}
                  onChange={(e) => updateDraftField('cakeMessage', e.target.value)}
                  placeholder="e.g. 2 kg · 'Happy 30th Birthday Arjun!'"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Balloon &amp; Backdrop Styling</label>
                <select
                  value={draft.balloonStyle || 'Organic Garland Arch & Shimmer Wall'}
                  onChange={(e) => updateDraftField('balloonStyle', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Organic Garland Arch & Shimmer Wall">Organic Garland Arch & Shimmer Wall</option>
                  <option value="Circular Floral Ring Backdrop with Neon Sign">Circular Floral Ring Backdrop with Neon Sign</option>
                  <option value="Giant Marquee Light-up Age Numbers">Giant Marquee Light-up Age Numbers</option>
                  <option value="Kids Animated Character Cutouts & Balloon Pillars">Kids Animated Character Cutouts & Balloon Pillars</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Seating &amp; Table Setup</label>
                <select
                  value={draft.seatingStyle || 'Round Banquet Tables with Centerpieces'}
                  onChange={(e) => updateDraftField('seatingStyle', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Round Banquet Tables with Centerpieces">Round Banquet Tables with Centerpieces</option>
                  <option value="Lounge Clusters with High-Top Cocktail Tables">Lounge Clusters with High-Top Cocktail Tables</option>
                  <option value="Kids Themed Activity Table & Play Zone">Kids Themed Activity Table & Play Zone</option>
                </select>
              </div>
            </div>
          )}

          {selectedOccasionId === 'wedding' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Bride's Name</label>
                <input
                  type="text"
                  value={draft.brideName || ''}
                  onChange={(e) => updateDraftField('brideName', e.target.value)}
                  placeholder="e.g. Ananya"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Groom's Name</label>
                <input
                  type="text"
                  value={draft.groomName || ''}
                  onChange={(e) => updateDraftField('groomName', e.target.value)}
                  placeholder="e.g. Siddharth"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Ceremony &amp; Functions</label>
                <select
                  value={draft.ceremonyType || 'Grand Wedding & Reception'}
                  onChange={(e) => updateDraftField('ceremonyType', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Grand Wedding Ceremony & Reception">Grand Wedding Ceremony & Reception</option>
                  <option value="Sangeet & Cocktail Musical Night">Sangeet & Cocktail Musical Night</option>
                  <option value="Haldi & Mehendi Floral Pavilion">Haldi & Mehendi Floral Pavilion</option>
                  <option value="Complete 3-Day Wedding Extravaganza">Complete 3-Day Wedding Extravaganza</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Stage &amp; Mandap Location</label>
                <select
                  value={draft.mandapLocation || 'Grand Imperial Ballroom Stage'}
                  onChange={(e) => updateDraftField('mandapLocation', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Grand Imperial Ballroom Stage">Grand Imperial Ballroom Stage</option>
                  <option value="Royal Palms Open Lawn Pavilion">Royal Palms Open Lawn Pavilion</option>
                  <option value="Poolside Floating Mandap Setup">Poolside Floating Mandap Setup</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Grand Entrance Experience</label>
                <select
                  value={draft.entranceStyle || 'Royal Dhol Welcome with Red Carpet Petals'}
                  onChange={(e) => updateDraftField('entranceStyle', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Royal Dhol Welcome with Red Carpet Petals">Royal Dhol Welcome with Red Carpet Petals</option>
                  <option value="Cold Pyro Fireworks & Floral Tunnel Aisle">Cold Pyro Fireworks & Floral Tunnel Aisle</option>
                  <option value="Traditional Shehnai & Nagada Welcoming">Traditional Shehnai & Nagada Welcoming</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Bridal &amp; Hospitality Services</label>
                <input
                  type="text"
                  value={Array.isArray(draft.specialServices) ? draft.specialServices.join(', ') : draft.specialServices || ''}
                  onChange={(e) => updateDraftField('specialServices', e.target.value.split(', '))}
                  placeholder="e.g. Bridal Suite, Safa Turban Artist, Guest Valet"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {selectedOccasionId === 'anniversary' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Couple's Names</label>
                <input
                  type="text"
                  value={draft.coupleNames || ''}
                  onChange={(e) => updateDraftField('coupleNames', e.target.value)}
                  placeholder="e.g. Priya & Rajesh"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Milestone / Years Together</label>
                <input
                  type="text"
                  value={draft.yearsTogether || ''}
                  onChange={(e) => updateDraftField('yearsTogether', e.target.value)}
                  placeholder="e.g. 10th Anniversary / 25th Silver Jubilee"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Dining &amp; Cabana Ambience</label>
                <select
                  value={draft.diningSetup || 'Private Poolside Candlelight Cabana'}
                  onChange={(e) => updateDraftField('diningSetup', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Private Poolside Candlelight Cabana">Private Poolside Candlelight Cabana</option>
                  <option value="Skyline Rooftop Panoramic Table">Skyline Rooftop Panoramic Table</option>
                  <option value="Private Banquet Suite with Family Dining">Private Banquet Suite with Family Dining</option>
                  <option value="In-Suite Romantic Candlelight Dinner">In-Suite Romantic Candlelight Dinner</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Musical Atmosphere</label>
                <select
                  value={draft.musicAtmosphere || 'Solo Violinist Romantic Serenade'}
                  onChange={(e) => updateDraftField('musicAtmosphere', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Solo Violinist Romantic Serenade">Solo Violinist Romantic Serenade</option>
                  <option value="Acoustic Guitar Serenader">Acoustic Guitar Serenader</option>
                  <option value="Romantic Jazz Ambient Sound System">Romantic Jazz Ambient Sound System</option>
                </select>
              </div>
            </div>
          )}

          {selectedOccasionId === 'engagement' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Couple's Names</label>
                <input
                  type="text"
                  value={draft.coupleNames || ''}
                  onChange={(e) => updateDraftField('coupleNames', e.target.value)}
                  placeholder="e.g. Rohan & Tanya"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Occasion Type</label>
                <select
                  value={draft.proposalType || 'Grand Ring Ceremony & Cocktail'}
                  onChange={(e) => updateDraftField('proposalType', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Grand Ring Ceremony & Cocktail">Grand Ring Ceremony & Cocktail</option>
                  <option value="Secret Sunset Marriage Proposal">Secret Sunset Marriage Proposal</option>
                  <option value="Traditional Roka Ceremony & Dinner">Traditional Roka Ceremony & Dinner</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Ring Presentation Mechanism</label>
                <select
                  value={draft.ringPresentation || 'Velvet Ring Box on Illuminated Crystal Pedestal'}
                  onChange={(e) => updateDraftField('ringPresentation', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Velvet Ring Box on Illuminated Crystal Pedestal">Velvet Ring Box on Illuminated Crystal Pedestal</option>
                  <option value="Delivered by White-Glove Event Butler with Champagne">Delivered by White-Glove Event Butler with Champagne</option>
                  <option value="Glass Cloche Surrounded by Fairy Lights & Roses">Glass Cloche Surrounded by Fairy Lights & Roses</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Backdrop &amp; Neon Inscription</label>
                <input
                  type="text"
                  value={draft.backdropStyle || ''}
                  onChange={(e) => updateDraftField('backdropStyle', e.target.value)}
                  placeholder="e.g. Giant 'Will You Marry Me?' Neon / 'Better Together'"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {selectedOccasionId === 'pooja' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Ceremony / Pooja Type</label>
                <select
                  value={draft.poojaType || 'Satyanarayan Mahapooja & Katha'}
                  onChange={(e) => updateDraftField('poojaType', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Satyanarayan Mahapooja & Katha">Satyanarayan Mahapooja & Katha</option>
                  <option value="Griha Pravesh / Housewarming Havan">Griha Pravesh / Housewarming Havan</option>
                  <option value="Ganesha Pooja & Sankalp">Ganesha Pooja & Sankalp</option>
                  <option value="Rudrabhishek & Shiva Pooja">Rudrabhishek & Shiva Pooja</option>
                  <option value="Navagraha Shanti & Havan">Navagraha Shanti & Havan</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Auspicious Time (Muhurat)</label>
                <input
                  type="text"
                  value={draft.auspiciousTime || ''}
                  onChange={(e) => updateDraftField('auspiciousTime', e.target.value)}
                  placeholder="e.g. 08:30 AM Brahma Muhurat"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Vedic Priest / Pandit Arrangement</label>
                <select
                  value={draft.priestArrangement || 'Request experienced Vedic Panditji through hotel'}
                  onChange={(e) => updateDraftField('priestArrangement', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Request experienced Vedic Panditji through hotel concierge">Request experienced Vedic Panditji through hotel concierge</option>
                  <option value="Bringing our own family priest (Hotel provides samagri & setup)">Bringing our own family priest (Hotel provides samagri & setup)</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Prasad &amp; Bhojanam Feast</label>
                <select
                  value={draft.prasadFeast || 'Traditional Satvik Pure Vegetarian Bhojanam'}
                  onChange={(e) => updateDraftField('prasadFeast', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Traditional Satvik Pure Vegetarian Bhojanam (No Onion/Garlic)">Traditional Satvik Pure Vegetarian Bhojanam (No Onion/Garlic)</option>
                  <option value="Panchamrit, Halwa & Fruit Prasad Distribution">Panchamrit, Halwa & Fruit Prasad Distribution</option>
                  <option value="Traditional South Indian Banana Leaf Feast">Traditional South Indian Banana Leaf Feast</option>
                </select>
              </div>
            </div>
          )}

          {selectedOccasionId === 'baby_shower' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Parents-to-Be Names</label>
                <input
                  type="text"
                  value={draft.parentsNames || ''}
                  onChange={(e) => updateDraftField('parentsNames', e.target.value)}
                  placeholder="e.g. Simran & Kabir"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Celebration Type</label>
                <select
                  value={draft.showerType || 'First Baby Celebration (Mom-to-Be)'}
                  onChange={(e) => updateDraftField('showerType', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="First Baby Celebration (Mom-to-Be)">First Baby Celebration (Mom-to-Be)</option>
                  <option value="Traditional Godh Bharai / Seemantham">Traditional Godh Bharai / Seemantham</option>
                  <option value="Gender Reveal & Afternoon Tea Party">Gender Reveal & Afternoon Tea Party</option>
                  <option value="Twins Celebration Extravaganza">Twins Celebration Extravaganza</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Mom-to-Be Seating Throne</label>
                <select
                  value={draft.momSeating || 'Luxury Velvet Peacock Armchair with Floral Garland'}
                  onChange={(e) => updateDraftField('momSeating', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Luxury Velvet Peacock Armchair with Floral Garland">Luxury Velvet Peacock Armchair with Floral Garland</option>
                  <option value="Royal Gold Throne Chair with Velvet Cushions">Royal Gold Throne Chair with Velvet Cushions</option>
                  <option value="Boho Wicker Chair with Pampas & Fairy Lights">Boho Wicker Chair with Pampas & Fairy Lights</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Welcome Board &amp; Inscription</label>
                <input
                  type="text"
                  value={draft.welcomeSignage || ''}
                  onChange={(e) => updateDraftField('welcomeSignage', e.target.value)}
                  placeholder="e.g. 'Welcome to Baby Sharma's Shower' / 'Oh Baby!'"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {selectedOccasionId === 'corporate_events' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={draft.companyName || ''}
                  onChange={(e) => updateDraftField('companyName', e.target.value)}
                  placeholder="e.g. Acronis Technologies Ltd."
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Summit / Event Purpose</label>
                <input
                  type="text"
                  value={draft.eventPurpose || ''}
                  onChange={(e) => updateDraftField('eventPurpose', e.target.value)}
                  placeholder="e.g. Annual Executive Leadership Summit & Awards"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Seating Arrangement</label>
                <select
                  value={draft.seatingLayout || 'Classroom Setup with Notepads & Pens'}
                  onChange={(e) => updateDraftField('seatingLayout', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Theater Style with Center Aisles">Theater Style with Center Aisles</option>
                  <option value="Classroom Setup with Notepads & Pens">Classroom Setup with Notepads & Pens</option>
                  <option value="U-Shape Interactive Discussion">U-Shape Interactive Discussion</option>
                  <option value="Executive Boardroom Roundtable">Executive Boardroom Roundtable</option>
                  <option value="Cluster Round Banquet Tables">Cluster Round Banquet Tables</option>
                </select>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">AV &amp; Video Wall Package</label>
                <select
                  value={draft.avPackage || 'Ultra-Wide 4K P2.5 LED Video Wall'}
                  onChange={(e) => updateDraftField('avPackage', e.target.value)}
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                >
                  <option value="Ultra-Wide 4K P2.5 LED Video Wall + Collar & Handheld Mics">Ultra-Wide 4K P2.5 LED Video Wall + Collar & Handheld Mics</option>
                  <option value="Dual High-Lumen 4K Laser Projectors & Motorized Screens">Dual High-Lumen 4K Laser Projectors & Motorized Screens</option>
                  <option value="Standard Business AV Setup (Projector, Clicker & Audio)">Standard Business AV Setup (Projector, Clicker & Audio)</option>
                </select>
              </div>
            </div>
          )}

          {selectedOccasionId === 'family_functions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Family Name / Gathering Title</label>
                <input
                  type="text"
                  value={draft.familyName || ''}
                  onChange={(e) => updateDraftField('familyName', e.target.value)}
                  placeholder="e.g. The Kapoor Family Grand Reunion"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Gathering Occasion</label>
                <input
                  type="text"
                  value={draft.gatheringType || ''}
                  onChange={(e) => updateDraftField('gatheringType', e.target.value)}
                  placeholder="e.g. 50th Year Family Reunion / Graduation Celebration"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {selectedOccasionId === 'social_events' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Host Name / Occasion Title</label>
                <input
                  type="text"
                  value={draft.hostName || ''}
                  onChange={(e) => updateDraftField('hostName', e.target.value)}
                  placeholder="e.g. Vikram's Sunset Sundowner"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Party Theme / Dress Code</label>
                <input
                  type="text"
                  value={draft.eventVibe || ''}
                  onChange={(e) => updateDraftField('eventVibe', e.target.value)}
                  placeholder="e.g. All-White Sunset Chic / 80s Retro Disco"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* 8. FOOD, BEVERAGES AND ADDITIONAL SERVICES */}
        <div className="space-y-4">
          {/* Catering */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-cyan-400" />
                  <span>8. Catering &amp; Gastronomy Preference</span>
                </h2>
                <p className="text-xs text-mist-400">
                  Crafted by our Executive Master Chefs with customizable regional menus.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATERING_STYLES.map((c) => {
                const isSelected = selectedCateringId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCateringId(c.id)}
                    className={cn(
                      'guest-card p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between',
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/20 shadow-md'
                        : 'border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.02]'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-white">{c.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {money(c.pricePerPlate)}/plate
                        </span>
                      </div>
                      <p className="text-[11px] text-mist-300 leading-relaxed">{c.desc}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-mist-400">Total for {guestCount} guests:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {money(c.pricePerPlate * guestCount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VIP Addons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Optional VIP Enhancements &amp; Services</span>
                </h3>
                <p className="text-[11px] text-mist-400">
                  Elevate your celebration with signature audio, visual and concierge services.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EVENT_ADDONS.map((addon) => {
                const isChecked = Boolean(selectedAddons[addon.id]);

                return (
                  <div
                    key={addon.id}
                    onClick={() => handleToggleAddon(addon.id)}
                    className={cn(
                      'guest-card p-3 rounded-xl cursor-pointer transition-all border flex flex-col justify-between',
                      isChecked
                        ? 'border-amber-400/80 bg-amber-950/20'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white">{addon.name}</h4>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container
                          className="rounded border-white/20 bg-ink-950 text-amber-400 focus:ring-0 mt-0.5"
                        />
                      </div>
                      <p className="text-[10px] text-mist-300">{addon.desc}</p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/5 text-right">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        +{money(addon.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 9. DATE, TIME, GUEST COUNT AND VENUE DETAILS */}
        <div className="guest-card p-5 space-y-4 border border-white/10 rounded-2xl">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>9. Date, Time Slot &amp; Venue Details</span>
            </h2>
            <p className="text-xs text-mist-400 mt-0.5">
              Select your expected schedule, attendee count and preferred hotel banquet venue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-mist-300 font-semibold block mb-1">Event Date</label>
              <input
                type="date"
                value={eventDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setEventDate(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-mist-300 font-semibold block mb-1">Time Slot</label>
              <select
                value={eventSlot}
                onChange={(e) => setEventSlot(e.target.value as any)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                <option value="evening">Evening Gala (18:00 - 23:00)</option>
                <option value="morning">Morning Auspicious (09:00 - 13:00)</option>
                <option value="afternoon">Afternoon Soirée (13:00 - 17:00)</option>
                <option value="full_day">Full Day Grand Celebration</option>
              </select>
            </div>

            <div>
              <label className="text-mist-300 font-semibold block mb-1">Preferred Venue</label>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                {VENUE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guest Count Slider & Counter */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-mist-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>Estimated Attendees:</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuestCount((c) => Math.max(5, c - 10))}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-base font-black text-cyan-300 font-mono min-w-[50px] text-center">
                  {guestCount}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount((c) => Math.min(500, c + 10))}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-mist-400">guests</span>
              </div>
            </div>

            <input
              type="range"
              min={5}
              max={400}
              step={5}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* 10. BOOKING/ENQUIRY SUMMARY & CONTINUE/REVIEW ACTION */}
        <div className="guest-card p-5 space-y-4 border border-white/10 rounded-2xl bg-ink-900/90">
          <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>10. Estimated Budget &amp; Special Requests</span>
              </h2>
              <p className="text-xs text-mist-400">
                Transparent itemized budget breakdown. Subject to final review and venue confirmation.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-mist-400 block">Total Calculated Estimate</span>
              <span className="text-lg sm:text-xl font-black text-cyan-300 font-mono">
                {money(calculatedEstimate)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-mist-300 font-semibold block mb-1">
                Custom Budget Range / Limit (Optional)
              </label>
              <input
                type="text"
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                placeholder={`Leave blank to use estimate (${money(calculatedEstimate)})`}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-mist-400 mt-1 block">
                Specify if you have a capped budget or specific financial allocation.
              </span>
            </div>

            <div>
              <label className="text-mist-300 font-semibold block mb-1">
                Special Requests or Dietary Requirements
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Jain food counter, elderly wheelchair assistance, entry timing..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-mist-400 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Review full specifications before final submission to Director of Banquets.</span>
            </span>

            <button
              type="button"
              onClick={handleProceedToReview}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-cyan-400 text-ink-950 font-black text-xs sm:text-sm hover:bg-cyan-300 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all"
            >
              <span>Review &amp; Submit Event Enquiry</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: "CREATE YOUR OWN EVENT" FLEXIBLE BUILDER (6 Steps)
  // =========================================================================
  if (viewMode === 'custom_builder') {
    return (
      <div className="space-y-6 pb-28 max-w-4xl mx-auto animate-in fade-in duration-300">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackToListing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-cyan-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Event Collections</span>
          </button>
          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bespoke Event Studio</span>
          </span>
        </div>

        {/* BUILDER HEADER & STEP INDICATOR */}
        <div className="guest-card p-5 space-y-4 border border-amber-400/30 rounded-2xl bg-ink-900/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                Step {customStep} of 6
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white mt-1">
                {customStep === 1 && '1. Occasion Basics & Vision'}
                {customStep === 2 && '2. Date, Timing & Capacity'}
                {customStep === 3 && '3. Preferred Venue & Layout'}
                {customStep === 4 && '4. Theme, Decoration & Colours'}
                {customStep === 5 && '5. Catering, Entertainment & Tech'}
                {customStep === 6 && '6. Budget, Special Requests & Review'}
              </h1>
            </div>
            <span className="text-xs text-mist-400 font-mono">
              Room {room} · {guestName}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-cyan-400 h-full transition-all duration-300"
              style={{ width: `${(customStep / 6) * 100}%` }}
            />
          </div>

          {/* STEP 1: BASICS */}
          {customStep === 1 && (
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-mist-300 text-xs">
                Tell us about your celebration idea. Whether it is an art exhibit, intimate dinner, product demo, or bespoke gala, we will tailor the setup to your vision.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Event Name / Title *</label>
                  <input
                    type="text"
                    value={customEventData.name}
                    onChange={(e) => setCustomEventData({ ...customEventData, name: e.target.value })}
                    placeholder="e.g. Maya's Art & Wine Showcase / Sunset Soirée"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Occasion Type</label>
                  <select
                    value={customEventData.type}
                    onChange={(e) => setCustomEventData({ ...customEventData, type: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Bespoke Celebration">Bespoke Celebration</option>
                    <option value="Art & Cultural Exhibition">Art & Cultural Exhibition</option>
                    <option value="Private Milestone Dinner">Private Milestone Dinner</option>
                    <option value="VIP Networking Soirée">VIP Networking Soirée</option>
                    <option value="Spiritual / Ritual Gathering">Spiritual / Ritual Gathering</option>
                    <option value="Product Showcase">Product Showcase</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Event Purpose &amp; Vision</label>
                <textarea
                  rows={3}
                  value={customEventData.purpose}
                  onChange={(e) => setCustomEventData({ ...customEventData, purpose: e.target.value })}
                  placeholder="Describe your vision, attendee profile, key moments and what would make this celebration memorable..."
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE & CAPACITY */}
          {customStep === 2 && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Event Date</label>
                  <input
                    type="date"
                    value={customEventData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setCustomEventData({ ...customEventData, date: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={customEventData.startTime}
                    onChange={(e) => setCustomEventData({ ...customEventData, startTime: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Estimated Duration</label>
                  <select
                    value={customEventData.duration}
                    onChange={(e) => setCustomEventData({ ...customEventData, duration: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="2-3 Hours">2 - 3 Hours</option>
                    <option value="4-5 Hours (Half Day)">4 - 5 Hours (Half Day)</option>
                    <option value="Full Day (8+ Hours)">Full Day (8+ Hours)</option>
                    <option value="Multi-Day Event">Multi-Day Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-mist-300 font-semibold block mb-1">
                  Expected Attendees: <span className="text-cyan-300 font-bold">{customEventData.guestCount} guests</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={400}
                  step={5}
                  value={customEventData.guestCount}
                  onChange={(e) => setCustomEventData({ ...customEventData, guestCount: Number(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          )}

          {/* STEP 3: VENUE & LAYOUT */}
          {customStep === 3 && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Preferred Hotel Venue</label>
                  <select
                    value={customEventData.venue}
                    onChange={(e) => setCustomEventData({ ...customEventData, venue: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    {VENUE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    <option value="Suggest Best Venue Based on Concept">Suggest Best Venue Based on Concept</option>
                  </select>
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Atmosphere / Setup Style</label>
                  <select
                    value={customEventData.setupType}
                    onChange={(e) => setCustomEventData({ ...customEventData, setupType: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Indoor Luxury Ballroom">Indoor Luxury Ballroom</option>
                    <option value="Open-Air Lawn & Pavilion">Open-Air Lawn & Pavilion</option>
                    <option value="Skyline Rooftop Panoramic">Skyline Rooftop Panoramic</option>
                    <option value="Poolside Cabana Lounges">Poolside Cabana Lounges</option>
                    <option value="In-Suite Private Dining">In-Suite Private Dining</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: THEME & COLOURS */}
          {customStep === 4 && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Decoration Theme Name</label>
                  <input
                    type="text"
                    value={customEventData.themeName}
                    onChange={(e) => setCustomEventData({ ...customEventData, themeName: e.target.value })}
                    placeholder="e.g. Bohemian Sunset / Midnight Starry Sky"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Colour Palette Preference</label>
                  <input
                    type="text"
                    value={customEventData.colorPalette}
                    onChange={(e) => setCustomEventData({ ...customEventData, colorPalette: e.target.value })}
                    placeholder="e.g. Gold, Ivory & Emerald Green"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-mist-300 font-semibold block mb-1">Custom Decoration Notes &amp; Specifications</label>
                <textarea
                  rows={3}
                  value={customEventData.customDecorNotes}
                  onChange={(e) => setCustomEventData({ ...customEventData, customDecorNotes: e.target.value })}
                  placeholder="Detail any flower preferences, stage designs, lighting effects, photobooths, entrance arches..."
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 5: CATERING & SERVICES */}
          {customStep === 5 && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Catering &amp; Dining Style</label>
                  <select
                    value={customEventData.cateringPreference}
                    onChange={(e) => setCustomEventData({ ...customEventData, cateringPreference: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Grand Multi-Cuisine Gourmet Buffet">Grand Multi-Cuisine Gourmet Buffet</option>
                    <option value="Royal Vegetarian Heritage Feast">Royal Vegetarian Heritage Feast</option>
                    <option value="Passed Cocktail Hors d'oeuvres & Live Stations">Passed Cocktail Hors d'oeuvres & Live Stations</option>
                    <option value="5-Course Plated Chef Tasting Menu">5-Course Plated Chef Tasting Menu</option>
                    <option value="Custom Bespoke Menu (Discuss with Executive Chef)">Custom Bespoke Menu (Discuss with Executive Chef)</option>
                  </select>
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Dietary Instructions</label>
                  <input
                    type="text"
                    value={customEventData.dietaryNotes}
                    onChange={(e) => setCustomEventData({ ...customEventData, dietaryNotes: e.target.value })}
                    placeholder="e.g. Jain, Vegan, Nut-Free, Halal"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: BUDGET & REVIEW */}
          {customStep === 6 && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Estimated Budget Range</label>
                  <select
                    value={customEventData.budgetRange}
                    onChange={(e) => setCustomEventData({ ...customEventData, budgetRange: e.target.value })}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                    <option value="₹1,00,000 - ₹2,50,000">₹1,00,000 - ₹2,50,000</option>
                    <option value="₹2,50,000 - ₹5,00,000">₹2,50,000 - ₹5,00,000</option>
                    <option value="₹5,00,000+ (Ultra Luxury)">₹5,00,000+ (Ultra Luxury)</option>
                  </select>
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Special Instructions for Director of Banquets</label>
                  <input
                    type="text"
                    value={customEventData.specialNotes}
                    onChange={(e) => setCustomEventData({ ...customEventData, specialNotes: e.target.value })}
                    placeholder="e.g. VIP guests attending, need discreet private entry"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Custom Event Summary Preview:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-mist-400 block">Title:</span>
                    <span className="text-white font-semibold">{customEventData.name || 'Custom Celebration'}</span>
                  </div>
                  <div>
                    <span className="text-mist-400 block">Date &amp; Time:</span>
                    <span className="text-white font-semibold">{customEventData.date} ({customEventData.startTime})</span>
                  </div>
                  <div>
                    <span className="text-mist-400 block">Attendees:</span>
                    <span className="text-cyan-300 font-semibold">{customEventData.guestCount} guests</span>
                  </div>
                  <div>
                    <span className="text-mist-400 block">Venue:</span>
                    <span className="text-white font-semibold">{customEventData.venue}</span>
                  </div>
                  <div>
                    <span className="text-mist-400 block">Theme:</span>
                    <span className="text-white font-semibold">{customEventData.themeName}</span>
                  </div>
                  <div>
                    <span className="text-mist-400 block">Budget:</span>
                    <span className="text-amber-300 font-semibold">{customEventData.budgetRange}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BUILDER NAVIGATION BUTTONS */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              disabled={customStep === 1}
              onClick={() => setCustomStep((s) => Math.max(1, s - 1))}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors',
                customStep === 1
                  ? 'text-mist-500 cursor-not-allowed'
                  : 'bg-white/5 text-mist-200 hover:text-white hover:bg-white/10'
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            {customStep < 6 ? (
              <button
                type="button"
                onClick={() => setCustomStep((s) => Math.min(6, s + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-black text-xs hover:bg-amber-300 transition-colors shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 text-ink-950 font-black text-xs hover:shadow-lg transition-all"
              >
                <span>Review &amp; Finalize</span>
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: FINAL REVIEW & CONFIRMATION SCREEN
  // =========================================================================
  if (viewMode === 'review') {
    const isCustom = viewMode === 'review' && selectedOccasionId === 'custom_builder';
    const draft = customDrafts[selectedOccasionId] || {};

    return (
      <div className="space-y-6 pb-28 max-w-3xl mx-auto animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackFromReview}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-cyan-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Edit Selections</span>
          </button>
          <span className="text-[11px] font-semibold text-mist-400">
            Final Specification Review
          </span>
        </div>

        <div className="guest-card p-6 space-y-6 border border-cyan-400/30 rounded-3xl shadow-2xl bg-ink-900/95">
          <div className="border-b border-white/10 pb-4 flex items-start justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-400/40">
                VIP Enquiry Review
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {viewMode === 'review' && selectedOccasionId === 'custom_builder'
                  ? customEventData.name || 'Custom Bespoke Celebration'
                  : headingInfo.heading}
              </h1>
              <p className="text-xs text-mist-300 mt-0.5">
                Room {room} · Guest: {guestName}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-mist-400 block">Calculated Total</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {customBudget.trim() ? customBudget.trim() : money(calculatedEstimate)}
              </span>
            </div>
          </div>

          {/* ITEMISED SPECIFICATION BREAKDOWN */}
          <div className="space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mist-300">
              Celebration Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <div>
                <span className="text-mist-400 text-[11px] block">Scheduled Date &amp; Time:</span>
                <span className="text-white font-semibold">
                  {viewMode === 'review' && selectedOccasionId === 'custom_builder'
                    ? `${customEventData.date} (${customEventData.startTime}, ${customEventData.duration})`
                    : `${eventDate} (${eventSlot.toUpperCase()})`}
                </span>
              </div>
              <div>
                <span className="text-mist-400 text-[11px] block">Attendees Capacity:</span>
                <span className="text-cyan-300 font-semibold">
                  {viewMode === 'review' && selectedOccasionId === 'custom_builder'
                    ? `${customEventData.guestCount} guests`
                    : `${guestCount} guests`}
                </span>
              </div>
              <div>
                <span className="text-mist-400 text-[11px] block">Venue Selection:</span>
                <span className="text-white font-semibold">
                  {viewMode === 'review' && selectedOccasionId === 'custom_builder'
                    ? customEventData.venue
                    : selectedVenue}
                </span>
              </div>
              <div>
                <span className="text-mist-400 text-[11px] block">Decoration Theme:</span>
                <span className="text-amber-300 font-semibold">
                  {viewMode === 'review' && selectedOccasionId === 'custom_builder'
                    ? `${customEventData.themeName} (${customEventData.colorPalette})`
                    : activeTheme.name}
                </span>
              </div>
            </div>

            {/* Event-specific specifications list */}
            {selectedOccasionId !== 'custom_builder' && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-mist-400 text-[11px] font-semibold block">Custom Specifications:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(draft).map(([k, v]) => {
                    if (!v) return null;
                    return (
                      <div key={k} className="flex flex-col">
                        <span className="text-mist-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-white font-medium">
                          {Array.isArray(v) ? v.join(', ') : String(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catering & Add-ons */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-mist-400 text-[11px]">Catering Style:</span>
                <span className="text-white font-semibold">
                  {viewMode === 'review' && selectedOccasionId === 'custom_builder'
                    ? customEventData.cateringPreference
                    : `${activeCatering.name} (${money(activeCatering.pricePerPlate)}/guest)`}
                </span>
              </div>
              {activeAddonsList.length > 0 && selectedOccasionId !== 'custom_builder' && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-mist-400 text-[11px] block mb-1">Selected Enhancements:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAddonsList.map((a) => (
                      <span key={a.id} className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 text-[10px] border border-amber-400/20">
                        {a.name} (+{money(a.price)})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TRANSPARENT STATUS & DISCLAIMER */}
          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Enquiry Status: Pending Event Specialist Review &amp; Venue Confirmation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-mist-300">
              Submitting this enquiry does not immediately charge your hotel folio. Our Director of Banquets &amp; Events will inspect hall availability and connect directly with you in Room {room} to confirm dates, dietary preferences and contracts.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackFromReview}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-mist-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors"
            >
              &larr; Make Changes
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-ink-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Routing Enquiry...' : 'Confirm & Submit Event Enquiry'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
