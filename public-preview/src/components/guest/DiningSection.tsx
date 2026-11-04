'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  X,
  Flame,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Leaf,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type {
  DiningMenuItem,
  AllergenType,
  DietaryType,
  PortionOption,
  MenuItemAddon,
  OrderLine,
} from '@/types/demo';
import {
  INITIAL_DINING_CATEGORIES,
  INITIAL_DINING_MENU,
  COMMON_ALLERGENS,
  DINING_TIME_SLOTS,
} from './diningData';

// Cart line with dish details & selected customizations
interface CartLineItem {
  id: string; // unique cart key (dishId + portion + spice + addons hash)
  dishId: string;
  name: string;
  category: string;
  unitPrice: number;
  qty: number;
  portion?: PortionOption;
  spiceLevel?: string;
  addons: MenuItemAddon[];
  specialNote?: string;
  image: string;
  dietary: DietaryType;
}

export function DiningSection({ room, guestName, onNavigate }: GuestTabProps) {
  const { state, placeRoomServiceOrder } = useDemo();

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non_veg' | 'vegan'>('all');
  const [excludedAllergens, setExcludedAllergens] = useState<AllergenType[]>([]);
  const [allergenModalOpen, setAllergenModalOpen] = useState(false);

  // Cart state: array of CartLineItem
  const [cartLines, setCartLines] = useState<CartLineItem[]>([]);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  // Customization modal state
  const [customizingDish, setCustomizingDish] = useState<DiningMenuItem | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<PortionOption | undefined>(undefined);
  const [selectedSpice, setSelectedSpice] = useState<string>('Medium');
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [prepNote, setPrepNote] = useState('');

  // Dish info / ingredient modal state
  const [infoDish, setInfoDish] = useState<DiningMenuItem | null>(null);

  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'asap' | 'slot'>('asap');
  const [deliveryDate, setDeliveryDate] = useState<'today' | 'tomorrow'>('today');
  const [selectedSlot, setSelectedSlot] = useState<string>('08:00 PM');
  const [kitchenInstructions, setKitchenInstructions] = useState('');

  // Confirmed order state
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  // Dynamic dishes from store with fallback
  const menuList: DiningMenuItem[] = useMemo(() => {
    return state.diningMenu && state.diningMenu.length > 0
      ? state.diningMenu
      : INITIAL_DINING_MENU;
  }, [state.diningMenu]);

  // Dynamic categories from store with fallback
  const categoriesList: string[] = useMemo(() => {
    return state.diningCategories && state.diningCategories.length > 0
      ? state.diningCategories
      : INITIAL_DINING_CATEGORIES;
  }, [state.diningCategories]);

  // Filtering engine: category + dietary + allergens exclusion + search
  const filteredDishes = useMemo(() => {
    return menuList.filter((dish) => {
      // Admin availability check
      if (!dish.isAvailable) return false;

      // Category filter
      if (activeCategory !== 'all' && dish.category !== activeCategory) {
        return false;
      }

      // Dietary filter
      if (dietaryFilter !== 'all') {
        if (dietaryFilter === 'veg' && dish.dietary !== 'veg' && dish.dietary !== 'vegan') {
          return false;
        }
        if (dietaryFilter === 'non_veg' && dish.dietary !== 'non_veg') {
          return false;
        }
        if (dietaryFilter === 'vegan' && dish.dietary !== 'vegan') {
          return false;
        }
      }

      // Allergen exclusion filter: if dish contains ANY excluded allergen, hide it
      if (excludedAllergens.length > 0) {
        const hasExcludedAllergen = dish.allergens.some((a) =>
          excludedAllergens.includes(a),
        );
        if (hasExcludedAllergen) return false;
      }

      // Search query filter (matches name, description, ingredients, or category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesDesc = dish.desc?.toLowerCase().includes(q) ?? false;
        const matchesCat = dish.category.toLowerCase().includes(q);
        const matchesIng = dish.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesCat && !matchesIng) {
          return false;
        }
      }

      return true;
    });
  }, [menuList, activeCategory, dietaryFilter, excludedAllergens, searchQuery]);

  // Total quantity for a dish in cart
  const getDishQuantityInCart = (dishId: string) => {
    return cartLines
      .filter((l) => l.dishId === dishId)
      .reduce((sum, l) => sum + l.qty, 0);
  };

  // Cart summary computations
  const totalCartCount = useMemo(() => {
    return cartLines.reduce((sum, l) => sum + l.qty, 0);
  }, [cartLines]);

  const itemsSubtotal = useMemo(() => {
    return cartLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  }, [cartLines]);

  const taxGst = useMemo(() => {
    return Math.round(itemsSubtotal * 0.05); // 5% restaurant GST
  }, [itemsSubtotal]);

  const finalCartTotal = itemsSubtotal + taxGst;

  // Swiggy / Zomato ADD button handler
  function handleAddClick(dish: DiningMenuItem) {
    const isCustomizable =
      dish.supportsSpiceLevel ||
      dish.supportsPortionSize ||
      (dish.availableAddons && dish.availableAddons.length > 0) ||
      dish.prepNotesAllowed;

    if (isCustomizable) {
      // Open customization sheet
      setCustomizingDish(dish);
      setSelectedPortion(dish.portionOptions?.[0]);
      setSelectedSpice('Medium');
      setSelectedAddons([]);
      setPrepNote('');
    } else {
      // Add standard item directly
      setCartLines((prev) => {
        const existingIdx = prev.findIndex((l) => l.dishId === dish.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx].qty += 1;
          return next;
        }
        return [
          ...prev,
          {
            id: `${dish.id}-std`,
            dishId: dish.id,
            name: dish.name,
            category: dish.category,
            unitPrice: dish.price,
            qty: 1,
            addons: [],
            image: dish.image,
            dietary: dish.dietary,
          },
        ];
      });
    }
  }

  // Confirm customization modal
  function handleSaveCustomization() {
    if (!customizingDish) return;

    const basePrice = customizingDish.price;
    const portionDelta = selectedPortion?.priceDelta ?? 0;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + portionDelta + addonsTotal;

    const customKey = `${customizingDish.id}-${selectedPortion?.name ?? 'std'}-${selectedSpice}-${selectedAddons.map((a) => a.id).sort().join('-')}`;

    setCartLines((prev) => {
      const existingIdx = prev.findIndex((l) => l.id === customKey);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].qty += 1;
        return next;
      }
      return [
        ...prev,
        {
          id: customKey,
          dishId: customizingDish.id,
          name: customizingDish.name,
          category: customizingDish.category,
          unitPrice,
          qty: 1,
          portion: selectedPortion,
          spiceLevel: customizingDish.supportsSpiceLevel ? selectedSpice : undefined,
          addons: selectedAddons,
          specialNote: prepNote.trim() || undefined,
          image: customizingDish.image,
          dietary: customizingDish.dietary,
        },
      ];
    });

    setCustomizingDish(null);
  }

  // Stepper increment for a dish
  function handleIncrementDish(dish: DiningMenuItem) {
    // If multiple customized lines exist for this dish, add to the last one or open customize
    const matchingLines = cartLines.filter((l) => l.dishId === dish.id);
    if (matchingLines.length === 0) {
      handleAddClick(dish);
    } else {
      const targetId = matchingLines[matchingLines.length - 1].id;
      setCartLines((prev) =>
        prev.map((l) => (l.id === targetId ? { ...l, qty: l.qty + 1 } : l)),
      );
    }
  }

  // Stepper decrement for a dish
  function handleDecrementDish(dish: DiningMenuItem) {
    const matchingLines = cartLines.filter((l) => l.dishId === dish.id);
    if (matchingLines.length === 0) return;

    // Decrement the last configured variant
    const target = matchingLines[matchingLines.length - 1];
    if (target.qty <= 1) {
      setCartLines((prev) => prev.filter((l) => l.id !== target.id));
    } else {
      setCartLines((prev) =>
        prev.map((l) => (l.id === target.id ? { ...l, qty: l.qty - 1 } : l)),
      );
    }
  }

  // Cart sheet line increment/decrement
  function handleCartLineQty(lineId: string, delta: number) {
    setCartLines((prev) => {
      return prev
        .map((l) => {
          if (l.id !== lineId) return l;
          const newQty = l.qty + delta;
          return newQty > 0 ? { ...l, qty: newQty } : null;
        })
        .filter(Boolean) as CartLineItem[];
    });
  }

  // Schedule string helper
  const nowHour = new Date().getHours();
  const scheduleDisplay = useMemo(() => {
    if (scheduleType === 'asap') {
      return 'As soon as possible (~30 mins kitchen preparation)';
    }
    const dayStr = deliveryDate === 'today' ? 'Today' : 'Tomorrow';
    return `${dayStr} at ${selectedSlot}`;
  }, [scheduleType, deliveryDate, selectedSlot]);

  // Place Order Action
  function handleConfirmOrder() {
    if (cartLines.length === 0) return;

    // Format order lines for backend / dispatcher
    const orderLines: OrderLine[] = cartLines.map((l) => {
      const extras: string[] = [];
      if (l.portion && l.portion.name !== 'Standard') extras.push(l.portion.name);
      if (l.spiceLevel) extras.push(`${l.spiceLevel} spice`);
      if (l.addons.length > 0) extras.push(`Add-ons: ${l.addons.map((a) => a.name).join(', ')}`);
      if (l.specialNote) extras.push(`"${l.specialNote}"`);

      const nameWithDetails = extras.length > 0 ? `${l.name} (${extras.join(' · ')})` : l.name;

      return {
        itemId: l.dishId,
        name: nameWithDetails,
        qty: l.qty,
        price: l.unitPrice,
      };
    });

    const fullNotesParts = [
      `Schedule: ${scheduleDisplay}`,
      kitchenInstructions.trim() && `Kitchen Instructions: "${kitchenInstructions.trim()}"`,
      `Room Folio Billing: Room ${room} (${guestName})`,
    ].filter(Boolean);

    // Call store API
    const orderRef = placeRoomServiceOrder(room, orderLines, fullNotesParts.join('\n\n'));

    setConfirmedOrderId(orderRef);
    setCartSheetOpen(false);
    setCartLines([]);
    setKitchenInstructions('');
    setTrackingModalOpen(true);
  }

  // Active order from store matching room & dining
  const activeDiningOrder = useMemo(() => {
    if (!confirmedOrderId) return null;
    const allItems = [
      ...(state.items.department_dispatcher ?? []),
      ...(state.items.department_dispatcher_supervisor ?? []),
    ];
    return allItems.find((i) => i.ref === confirmedOrderId);
  }, [confirmedOrderId, state.items]);

  // Dietary symbol component (Swiggy/Zomato style)
  const renderDietaryIcon = (dietary: DietaryType) => {
    if (dietary === 'veg') {
      return (
        <span
          className="inline-flex items-center justify-center h-4 w-4 rounded-sm border border-emerald-500 p-0.5 bg-emerald-500/10 shrink-0"
          title="Vegetarian"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      );
    }
    if (dietary === 'vegan') {
      return (
        <span
          className="inline-flex items-center justify-center h-4 w-4 rounded-sm border border-teal-500 p-0.5 bg-teal-500/10 shrink-0"
          title="Vegan (100% Plant-Based)"
        >
          <Leaf className="h-2.5 w-2.5 text-teal-400" />
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center h-4 w-4 rounded-sm border border-rose-500 p-0.5 bg-rose-500/10 shrink-0"
        title="Non-Vegetarian"
      >
        <span className="h-2 w-2 rounded-full bg-rose-500" />
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-28 max-w-5xl mx-auto">
      {/* 1. SEARCH BAR - PROMINENT FIRST ELEMENT */}
      <div className="relative w-full pt-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dishes, cuisines, or ingredients..."
          className="w-full rounded-2xl bg-ink-900/90 border border-white/10 pl-10 pr-9 py-3 text-xs sm:text-sm text-white placeholder-mist-400 focus:outline-none focus:border-amber-400/60 shadow-md transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. COMPACT FOOD FILTERS & ALLERGENS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Dietary Filter Chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dietaryFilter === 'all'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow-sm'
                  : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Veg</span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'non_veg' ? 'all' : 'non_veg')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dietaryFilter === 'non_veg'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold'
                  : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Non-Veg</span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'vegan' ? 'all' : 'vegan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dietaryFilter === 'vegan'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold'
                  : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
              }`}
            >
              <Leaf className="h-3 w-3 text-teal-400" />
              <span>Vegan</span>
            </button>
          </div>

          {/* Allergen Filter Trigger */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setAllergenModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                excludedAllergens.length > 0
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                  : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Allergens</span>
              {excludedAllergens.length > 0 && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-ink-950 font-mono text-[10px] font-black">
                  {excludedAllergens.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Allergen Filter Banner */}
        {excludedAllergens.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <p className="truncate">
                Excluding dishes with:{' '}
                <span className="font-bold">{excludedAllergens.join(', ')}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExcludedAllergens([])}
              className="text-[11px] underline font-bold hover:text-white shrink-0"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* 3. MENU CATEGORIES (Configurable 10 Categories) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/5">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-white/15 text-white font-bold border-b-2 border-amber-400'
              : 'text-mist-400 hover:text-white'
          }`}
        >
          All Categories ({menuList.filter((d) => d.isAvailable).length})
        </button>

        {categoriesList.map((cat) => {
          const count = menuList.filter((d) => d.category === cat && d.isAvailable).length;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400/15 text-amber-300 font-bold border-b-2 border-amber-400'
                  : 'text-mist-400 hover:text-white'
              }`}
            >
              <span>{cat}</span>
              {count > 0 && (
                <span className="text-[10px] opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. DISHES MENU (Modern Swiggy / Zomato Image-First Grid) */}
      {filteredDishes.length === 0 ? (
        <div className="guest-card p-12 text-center space-y-3">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-mist-500" />
          <p className="text-sm font-bold text-white">No dishes found</p>
          <p className="text-xs text-mist-400 max-w-sm mx-auto">
            Try adjusting your search query, switching categories, or clearing allergen exclusion filters.
          </p>
          {(searchQuery || dietaryFilter !== 'all' || excludedAllergens.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDietaryFilter('all');
                setExcludedAllergens([]);
                setActiveCategory('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDishes.map((dish) => {
            const qty = getDishQuantityInCart(dish.id);
            const isCustomizable =
              dish.supportsSpiceLevel ||
              dish.supportsPortionSize ||
              (dish.availableAddons && dish.availableAddons.length > 0) ||
              dish.prepNotesAllowed;

            return (
              <div
                key={dish.id}
                className="guest-card p-3.5 sm:p-4 flex gap-3.5 items-start justify-between hover:border-amber-400/30 transition-all group"
              >
                {/* Left: Info, Price, Description, Rating */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {renderDietaryIcon(dish.dietary)}
                    {dish.rating && (
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400">
                        <span>★</span>
                        <span>{dish.rating.toFixed(1)}</span>
                        {dish.ratingCount && (
                          <span className="text-[10px] text-mist-400 font-normal">
                            ({dish.ratingCount})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                    {dish.name}
                  </h3>

                  <p className="text-xs font-mono font-bold text-amber-300">
                    ₹{dish.price}
                  </p>

                  {dish.desc && (
                    <p className="text-[11px] text-mist-400 line-clamp-2 leading-relaxed">
                      {dish.desc}
                    </p>
                  )}

                  {/* Allergen & Ingredients preview tag */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInfoDish(dish)}
                      className="text-[10px] text-mist-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Info className="h-3 w-3" />
                      <span>Ingredients &amp; Allergens</span>
                    </button>
                    {dish.allergens.length > 0 && (
                      <span className="text-[10px] text-mist-500">
                        &bull; Contains: {dish.allergens.slice(0, 2).join(', ')}
                        {dish.allergens.length > 2 && ' +more'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: High-Quality Food Photography with Swiggy/Zomato ADD Button */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden bg-ink-950/60 border border-white/10 shadow-md">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>

                  {/* ADD Button / Stepper (Swiggy / Zomato pattern) */}
                  <div className="absolute -bottom-2.5 z-10">
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleAddClick(dish)}
                        className="px-4 py-1 rounded-xl bg-ink-950/95 border border-emerald-500/50 text-emerald-400 font-extrabold text-[11px] hover:bg-emerald-500 hover:text-ink-950 shadow-lg active:scale-95 transition-all flex flex-col items-center leading-tight"
                      >
                        <span>ADD</span>
                        {isCustomizable && (
                          <span className="text-[8px] font-normal text-emerald-300/80 -mt-0.5">
                            customisable
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center rounded-xl bg-ink-950 border border-emerald-500/60 text-emerald-400 font-black text-xs shadow-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleDecrementDish(dish)}
                          className="px-2 py-1 hover:bg-emerald-500/20 active:scale-90 transition-transform"
                          title="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 font-mono text-white text-[11px] font-bold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrementDish(dish)}
                          className="px-2 py-1 hover:bg-emerald-500/20 active:scale-90 transition-transform"
                          title="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. STICKY BOTTOM CART SUMMARY (Swiggy / Zomato Pattern) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 z-40 px-4 max-w-xl mx-auto animate-in slide-in-from-bottom duration-300">
          <button
            type="button"
            onClick={() => setCartSheetOpen(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-3.5 shadow-2xl flex items-center justify-between font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all border border-emerald-400/40"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/25 text-white font-mono font-black text-xs">
                {totalCartCount}
              </span>
              <div className="text-left">
                <p className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  <span>View Cart</span>
                  <span className="text-emerald-200 text-xs font-normal">
                    &bull; {totalCartCount} {totalCartCount === 1 ? 'Item' : 'Items'}
                  </span>
                </p>
                <p className="text-[11px] text-emerald-100 font-normal">
                  Total: ₹{finalCartTotal} (incl. taxes)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl font-bold text-xs">
              <span>Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* 6. ALLERGEN EXCLUSION MODAL */}
      {allergenModalOpen && (
        <GuestSheet
          onClose={() => setAllergenModalOpen(false)}
          title="Filter by Allergens"
        >
          <div className="space-y-4">
            <p className="text-xs text-mist-300">
              Select any allergens you wish to exclude. Dishes containing these ingredients will be automatically hidden from your menu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_ALLERGENS.map((a) => {
                const isSelected = excludedAllergens.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setExcludedAllergens((prev) =>
                        isSelected ? prev.filter((id) => id !== a.id) : [...prev, a.id],
                      );
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/15 text-white'
                        : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{a.icon}</span>
                      <span className="text-xs font-bold">{a.label}</span>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-md border grid place-items-center ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-ink-950'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cross-contamination advisory notice */}
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200/90 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Kitchen Advisory:</strong> Ingredients are verified with our culinary team. However, as items are prepared in a shared luxury kitchen, cross-contamination is possible. Please inform us of severe allergies.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setExcludedAllergens([])}
                className="text-xs text-mist-400 hover:text-white underline font-semibold"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setAllergenModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Apply Filters ({excludedAllergens.length})
              </button>
            </div>
          </div>
        </GuestSheet>
      )}

      {/* 7. DISH INGREDIENTS & ALLERGENS INFO SHEET */}
      {infoDish && (
        <GuestSheet
          onClose={() => setInfoDish(null)}
          title={infoDish.name}
        >
          <div className="space-y-4">
            <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-ink-950 border border-white/10">
              <img
                src={infoDish.image}
                alt={infoDish.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-ink-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-300">
                ₹{infoDish.price} &bull; {infoDish.category}
              </div>
            </div>

            {infoDish.desc && (
              <p className="text-xs text-mist-200 leading-relaxed">
                {infoDish.desc}
              </p>
            )}

            {/* Ingredients */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Verified Ingredients</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {infoDish.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-mist-200"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Allergen Declaration</span>
              </h4>
              {infoDish.allergens.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {infoDish.allergens.map((alg, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[11px] font-bold text-rose-300"
                    >
                      Contains {alg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 font-semibold">
                  No common allergens declared in standard recipe.
                </p>
              )}
            </div>

            {/* Kitchen Cross-contamination note */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] text-mist-400 leading-relaxed">
              <strong>Notice:</strong> Never assume a dish is 100% allergen-free. Cross-contamination may still occur in a busy hotel kitchen. Please specify any strict medical requirements in your order notes.
            </div>

            <button
              type="button"
              onClick={() => {
                handleAddClick(infoDish);
                setInfoDish(null);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-ink-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md"
            >
              Add to Cart &bull; ₹{infoDish.price}
            </button>
          </div>
        </GuestSheet>
      )}

      {/* 8. FOOD CUSTOMISATION SHEET */}
      {customizingDish && (
        <GuestSheet
          onClose={() => setCustomizingDish(null)}
          title={`Customise ${customizingDish.name}`}
        >
          <div className="space-y-5">
            {/* Portion size selection (if applicable) */}
            {customizingDish.supportsPortionSize && customizingDish.portionOptions && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Portion Size</span>
                  <span className="text-[10px] text-mist-400 font-normal">Choose 1</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customizingDish.portionOptions.map((opt) => {
                    const isSelected = selectedPortion?.name === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setSelectedPortion(opt)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/15 text-white'
                            : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.name}</span>
                        <span className="text-xs font-mono text-amber-300">
                          {opt.priceDelta > 0 ? `+₹${opt.priceDelta}` : 'Included'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spice level selection (if applicable) */}
            {customizingDish.supportsSpiceLevel && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span>Spice Level</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Mild', 'Medium', 'Spicy'].map((level) => {
                    const isSelected = selectedSpice === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedSpice(level)}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400 text-ink-950'
                            : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-ons selection (if applicable) */}
            {customizingDish.availableAddons && customizingDish.availableAddons.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Available Add-ons</span>
                  <span className="text-[10px] text-mist-400 font-normal">Optional</span>
                </label>
                <div className="space-y-2">
                  {customizingDish.availableAddons.map((addon) => {
                    const isSelected = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddons((prev) =>
                            isSelected
                              ? prev.filter((a) => a.id !== addon.id)
                              : [...prev, addon],
                          );
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-medium">{addon.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-300">
                            +₹{addon.price}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-md border grid place-items-center ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500 text-ink-950'
                                : 'border-white/20'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preparation notes (if allowed) */}
            {customizingDish.prepNotesAllowed && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white">
                  Cooking / Preparation Preference
                </label>
                <textarea
                  value={prepNote}
                  onChange={(e) => setPrepNote(e.target.value)}
                  placeholder="e.g. Less oil, dressing on the side, extra crispy..."
                  rows={2}
                  className="w-full rounded-xl bg-ink-950/80 border border-white/10 p-2.5 text-xs text-white placeholder-mist-400 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            )}

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleSaveCustomization}
              className="w-full py-3 rounded-xl bg-emerald-500 text-ink-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg"
            >
              Add to Cart &bull; ₹
              {customizingDish.price +
                (selectedPortion?.priceDelta ?? 0) +
                selectedAddons.reduce((sum, a) => sum + a.price, 0)}
            </button>
          </div>
        </GuestSheet>
      )}

      {/* 9. CART & ORDER SUMMARY SHEET */}
      {cartSheetOpen && (
        <GuestSheet
          onClose={() => setCartSheetOpen(false)}
          title="Your Dining Order"
        >
          <div className="space-y-5">
            {/* Room & Guest Association Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-400/10 border border-amber-400/30">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-white">Deliver to Room {room}</p>
                  <p className="text-[10px] text-mist-300">Guest: {guestName}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-400/20 px-2 py-0.5 rounded-md">
                Folio Billing
              </span>
            </div>

            {/* Itemized Cart Lines */}
            <div className="space-y-3 divide-y divide-white/5">
              {cartLines.map((line) => (
                <div key={line.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {renderDietaryIcon(line.dietary)}
                      <p className="text-xs font-bold text-white truncate">{line.name}</p>
                    </div>

                    {/* Customization Details */}
                    <div className="text-[10px] text-mist-400 space-y-0.5 pl-5">
                      {line.portion && line.portion.name !== 'Standard' && (
                        <p>&bull; Portion: {line.portion.name}</p>
                      )}
                      {line.spiceLevel && <p>&bull; Spice: {line.spiceLevel}</p>}
                      {line.addons.length > 0 && (
                        <p>&bull; Add-ons: {line.addons.map((a) => a.name).join(', ')}</p>
                      )}
                      {line.specialNote && (
                        <p className="text-amber-200/80 italic">&bull; &ldquo;{line.specialNote}&rdquo;</p>
                      )}
                    </div>

                    <p className="text-xs font-mono font-bold text-amber-300 pl-5">
                      ₹{line.unitPrice * line.qty}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl bg-ink-950 border border-white/20 text-white font-mono text-xs font-bold shadow shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCartLineQty(line.id, -1)}
                      className="px-2.5 py-1 text-mist-300 hover:text-white hover:bg-white/5 active:scale-90"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleCartLineQty(line.id, 1)}
                      className="px-2.5 py-1 text-mist-300 hover:text-white hover:bg-white/5 active:scale-90"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery & Scheduling Section */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Delivery Time</span>
              </label>

              {/* ASAP vs Later Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('asap')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    scheduleType === 'asap'
                      ? 'border-amber-400 bg-amber-400 text-ink-950 shadow-md'
                      : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                  }`}
                >
                  Deliver ASAP (~30m)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('slot')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    scheduleType === 'slot'
                      ? 'border-amber-400 bg-amber-400 text-ink-950 shadow-md'
                      : 'border-white/10 bg-white/5 text-mist-300 hover:text-white'
                  }`}
                >
                  Schedule Later
                </button>
              </div>

              {/* Slot Picker if Later */}
              {scheduleType === 'slot' && (
                <div className="space-y-2.5 p-3 rounded-xl bg-ink-950/70 border border-white/10 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryDate('today')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        deliveryDate === 'today'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : 'text-mist-400 hover:text-white'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryDate('tomorrow')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        deliveryDate === 'tomorrow'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : 'text-mist-400 hover:text-white'
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {DINING_TIME_SLOTS.map((slot) => {
                      const isPast = deliveryDate === 'today' && slot.hour24 <= nowHour;
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={isPast}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`p-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                            isPast
                              ? 'opacity-30 bg-white/5 cursor-not-allowed line-through text-mist-500'
                              : isSelected
                              ? 'bg-amber-400 text-ink-950 font-bold'
                              : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Special Kitchen Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white">
                Special Kitchen Instructions
              </label>
              <textarea
                value={kitchenInstructions}
                onChange={(e) => setKitchenInstructions(e.target.value)}
                placeholder="e.g. Please send extra cutlery, no ice in beverages, leave tray on dining table..."
                rows={2}
                className="w-full rounded-xl bg-ink-950/80 border border-white/10 p-2.5 text-xs text-white placeholder-mist-400 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Bill Details Breakdown */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <h4 className="text-[11px] font-bold text-mist-300 uppercase tracking-wider">
                Bill Summary
              </h4>
              <div className="flex justify-between text-mist-300">
                <span>Item Subtotal ({totalCartCount} items)</span>
                <span className="font-mono text-white">₹{itemsSubtotal}</span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>Restaurant GST (5%)</span>
                <span className="font-mono text-white">₹{taxGst}</span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>Delivery / Room Tray Charge</span>
                <span className="font-mono text-emerald-400 font-semibold">Complimentary</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-white text-sm">
                <span>Total Payable</span>
                <span className="font-mono text-amber-300 text-base">₹{finalCartTotal}</span>
              </div>
              <p className="text-[10px] text-mist-400 text-right">
                Charged automatically to Room {room} Folio
              </p>
            </div>

            {/* Order Confirmation Action */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-ink-950 font-black text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-xl"
            >
              Place Dining Order &bull; ₹{finalCartTotal}
            </button>
          </div>
        </GuestSheet>
      )}

      {/* 10. ORDER CONFIRMATION & 6-STAGE TIMELINE TRACKER MODAL */}
      {trackingModalOpen && (
        <GuestSheet
          onClose={() => setTrackingModalOpen(false)}
          title="Order Tracking"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1 animate-in zoom-in-95">
              <span className="inline-grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-1">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Order Confirmed
              </p>
              <h3 className="text-base font-extrabold text-white font-mono">
                {confirmedOrderId}
              </h3>
              <p className="text-xs text-mist-300">
                Dispatched to our Executive Kitchen. Track preparation below.
              </p>
            </div>

            {/* 6-Step Order Status Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Kitchen Live Status</span>
              </h4>

              {(() => {
                const currentStatus = activeDiningOrder?.status || 'Order Placed';
                const stages = [
                  { label: 'Order Placed', desc: 'Order received at kitchen' },
                  { label: 'Accepted', desc: 'Chef acknowledged order' },
                  { label: 'Preparing', desc: 'Gourmet cooking in progress' },
                  { label: 'Ready', desc: 'Plated & packaged hot' },
                  { label: 'Out for Delivery', desc: 'Runner dispatched to room' },
                  { label: 'Delivered', desc: 'Delivered to Room ' + room },
                ];

                const currentIdx = stages.findIndex(
                  (s) =>
                    s.label.toLowerCase() === currentStatus.toLowerCase() ||
                    (s.label === 'Out for Delivery' && currentStatus === 'On the way') ||
                    (s.label === 'Order Placed' && currentStatus === 'Received'),
                );
                const activeIdx = currentIdx >= 0 ? currentIdx : 0;

                return (
                  <div className="relative pl-6 space-y-4 pt-1">
                    <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-white/10" />

                    {stages.map((stage, i) => {
                      const isDone = i <= activeIdx;
                      const isCurrent = i === activeIdx;

                      return (
                        <div key={stage.label} className="relative flex items-start gap-3">
                          <span
                            className={`absolute -left-6 top-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold ${
                              isCurrent
                                ? 'bg-amber-400 text-ink-950 ring-4 ring-amber-400/20'
                                : isDone
                                ? 'bg-emerald-500 text-ink-950'
                                : 'bg-white/10 text-mist-500'
                            }`}
                          >
                            {isDone ? '✓' : i + 1}
                          </span>

                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-amber-300'
                                  : isDone
                                  ? 'text-white'
                                  : 'text-mist-500'
                              }`}
                            >
                              {stage.label}
                            </p>
                            <p className="text-[10px] text-mist-400">{stage.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTrackingModalOpen(false);
                  onNavigate('home');
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md text-center"
              >
                View on Home Timeline
              </button>
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-mist-300 text-xs font-bold hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </GuestSheet>
      )}
    </div>
  );
}

