'use client';

import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  ChefHat,
  Truck,
  Sparkles,
  ChevronRight,
  Flame,
  Leaf,
  DollarSign,
  Coffee,
  Eye,
  Info,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { DiningMenuItem, DietaryType, WorkItem } from '@/types/demo';
import { INITIAL_DINING_CATEGORIES } from '@/components/guest/diningData';

// Preset sample dish images for quick addition
const PRESET_DISH_IMAGES = [
  { label: 'Indian Curry / Paneer', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Biryani / Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Pasta / Continental', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=600&q=80' },
  { label: 'Burger & Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dessert / Pastry', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
  { label: 'Beverage / Coffee', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80' },
  { label: 'Salad / Healthy Bowl', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
];

export function DispatcherMenuOrdersTab() {
  const {
    state,
    addDiningMenuItem,
    deleteDiningMenuItem,
    toggleDiningMenuItemAvailability,
    updateOrderStatus,
  } = useDemo();

  // Active sub-section: 'menu' (Existing Menu) vs 'orders' (Guest Orders)
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'orders'>('menu');

  // -------------------------------------------------------------
  // MENU STATE & FILTERING
  // -------------------------------------------------------------
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<DiningMenuItem | null>(null);

  // New Dish Form State
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Main Course');
  const [newDishPrice, setNewDishPrice] = useState<number>(350);
  const [newDishDietary, setNewDishDietary] = useState<DietaryType>('veg');
  const [newDishCuisine, setNewDishCuisine] = useState('Indian');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishIngredients, setNewDishIngredients] = useState('');
  const [newDishImage, setNewDishImage] = useState(PRESET_DISH_IMAGES[0].url);
  const [newDishAvailable, setNewDishAvailable] = useState(true);

  // Available categories
  const categories = useMemo(() => {
    const fromState = state.diningCategories || INITIAL_DINING_CATEGORIES;
    const fromMenu = Array.from(new Set((state.diningMenu || []).map((m) => m.category))).filter(Boolean);
    return ['All', ...Array.from(new Set([...fromState, ...fromMenu]))];
  }, [state.diningCategories, state.diningMenu]);

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return (state.diningMenu || []).filter((item) => {
      const matchesSearch =
        !menuSearch ||
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.desc?.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.cuisine?.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.ingredients?.some((ing) => ing.toLowerCase().includes(menuSearch.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesDietary =
        selectedDietary === 'All' ||
        (selectedDietary === 'veg' && (item.dietary === 'veg' || item.dietary === 'vegan')) ||
        (selectedDietary === 'vegan' && item.dietary === 'vegan') ||
        (selectedDietary === 'non-veg' && item.dietary === 'non_veg');

      return matchesSearch && matchesCategory && matchesDietary;
    });
  }, [state.diningMenu, menuSearch, selectedCategory, selectedDietary]);

  // -------------------------------------------------------------
  // ORDERS STATE & FILTERING
  // -------------------------------------------------------------
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Gather all dining / room service orders
  const allOrders = useMemo(() => {
    const supervisorItems = state.items.department_dispatcher_supervisor || [];
    const dispatcherItems = state.items.department_dispatcher || [];
    const fulfillerItems = state.items.task_fulfiller || [];
    const combined = [...supervisorItems, ...dispatcherItems, ...fulfillerItems];

    // Filter by F&B or room service criteria
    const map = new Map<string, WorkItem>();
    combined.forEach((item) => {
      const isFnb =
        item.category === 'room_service' ||
        item.department === 'Food & Beverage' ||
        item.department === 'Food & Beverages' ||
        (item.orderLines && item.orderLines.length > 0) ||
        item.ref?.startsWith('DIN') ||
        item.ref?.startsWith('RS') ||
        item.ref?.startsWith('FB');

      if (isFnb) {
        // Keep the latest or most detailed version
        if (!map.has(item.id)) {
          map.set(item.id, item);
        } else {
          const prev = map.get(item.id)!;
          if (item.orderLines && (!prev.orderLines || prev.orderLines.length === 0)) {
            map.set(item.id, item);
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.orderedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.orderedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [state.items]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        !orderSearch ||
        order.ref?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.room?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.title?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.description?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.orderLines?.some((l) => l.name.toLowerCase().includes(orderSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (orderStatusFilter === 'All') return true;
      if (orderStatusFilter === 'active') {
        return (
          order.status !== 'Delivered' &&
          order.status !== 'Completed' &&
          order.status !== 'verified' &&
          order.status !== 'Cancelled'
        );
      }
      if (orderStatusFilter === 'placed') {
        return order.status === 'Order Placed' || order.status === 'pending' || order.status === 'Accepted';
      }
      if (orderStatusFilter === 'preparing') {
        return (
          order.status === 'Preparing' ||
          order.status === 'Preparing in Kitchen' ||
          order.status === 'in_progress'
        );
      }
      if (orderStatusFilter === 'out_for_delivery') {
        return order.status === 'Out for Delivery' || order.status === 'Ready';
      }
      if (orderStatusFilter === 'delivered') {
        return order.status === 'Delivered' || order.status === 'Completed' || order.status === 'verified';
      }
      return order.status === orderStatusFilter;
    });
  }, [allOrders, orderSearch, orderStatusFilter]);

  // Active orders count for badge
  const activeOrdersCount = useMemo(() => {
    return allOrders.filter(
      (o) =>
        o.status !== 'Delivered' &&
        o.status !== 'Completed' &&
        o.status !== 'verified' &&
        o.status !== 'Cancelled',
    ).length;
  }, [allOrders]);

  // Handle Add Dish Submit
  const handleAddDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const ingredientsList = newDishIngredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addDiningMenuItem({
      name: newDishName.trim(),
      category: newDishCategory,
      cuisine: newDishCuisine.trim(),
      price: Number(newDishPrice) || 100,
      dietary: newDishDietary,
      rating: 4.8,
      ratingCount: 1,
      image: newDishImage,
      desc: newDishDesc.trim() || undefined,
      ingredients: ingredientsList.length > 0 ? ingredientsList : ['Fresh Ingredients', 'Chef Secret Spices'],
      allergens: [],
      isAvailable: newDishAvailable,
    });

    // Reset Form
    setNewDishName('');
    setNewDishDesc('');
    setNewDishIngredients('');
    setIsAddDishModalOpen(false);
  };

  // Helper to get status color and badge
  const getOrderStatusConfig = (status: string) => {
    switch (status) {
      case 'Order Placed':
      case 'Accepted':
      case 'pending':
        return {
          label: 'Order Placed',
          tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500',
          icon: Clock,
          nextStatus: 'Preparing in Kitchen',
          nextLabel: 'Start Preparing',
        };
      case 'Preparing in Kitchen':
      case 'Preparing':
      case 'in_progress':
        return {
          label: 'Preparing in Kitchen',
          tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500 animate-pulse',
          icon: ChefHat,
          nextStatus: 'Out for Delivery',
          nextLabel: 'Dispatch for Delivery',
        };
      case 'Out for Delivery':
      case 'Ready':
        return {
          label: 'Out for Delivery',
          tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          dot: 'bg-purple-500 animate-pulse',
          icon: Truck,
          nextStatus: 'Delivered',
          nextLabel: 'Mark Delivered',
        };
      case 'Delivered':
      case 'Completed':
      case 'verified':
        return {
          label: 'Delivered',
          tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          nextStatus: null,
          nextLabel: null,
        };
      case 'Cancelled':
      case 'rejected':
        return {
          label: 'Cancelled',
          tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
          icon: X,
          nextStatus: null,
          nextLabel: null,
        };
      default:
        return {
          label: status,
          tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
          dot: 'bg-slate-400',
          icon: Info,
          nextStatus: 'Preparing in Kitchen',
          nextLabel: 'Move to Kitchen',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  Menu & Guest Orders
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Food & Beverages
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage the hotel dining catalog and monitor real-time guest food orders
                </p>
              </div>
            </div>
          </div>

          {/* Action button based on sub tab */}
          {activeSubTab === 'menu' && (
            <button
              onClick={() => setIsAddDishModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item to Menu</span>
            </button>
          )}
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'menu'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Existing Menu</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                activeSubTab === 'menu'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {state.diningMenu?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Guest Orders</span>
            {activeOrdersCount > 0 && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold animate-pulse ${
                  activeSubTab === 'orders'
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {activeOrdersCount} Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: EXISTING MENU                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'menu' && (
        <div className="space-y-6">
          {/* Controls: Search, Category pills, Dietary toggle */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] p-4 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes, ingredients, or cuisine..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                {menuSearch && (
                  <button
                    onClick={() => setMenuSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dietary Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
                {['All', 'veg', 'non-veg', 'vegan'].map((diet) => (
                  <button
                    key={diet}
                    onClick={() => setSelectedDietary(diet)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      selectedDietary === diet
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {diet === 'All' ? 'All Diets' : diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Categories:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Count Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredMenu.length}</strong> of{' '}
              {state.diningMenu?.length ?? 0} dishes
            </span>
            <span>
              Available:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {(state.diningMenu || []).filter((m) => m.isAvailable).length}
              </strong>{' '}
              · Unavailable:{' '}
              <strong className="text-rose-500">
                {(state.diningMenu || []).filter((m) => !m.isAvailable).length}
              </strong>
            </span>
          </div>

          {/* Grid of Dishes */}
          {filteredMenu.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center">
              <UtensilsCrossed className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No dishes found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No menu items match your search or filters. Try adjusting the category, dietary tag, or add a new dish.
              </p>
              <button
                onClick={() => {
                  setMenuSearch('');
                  setSelectedCategory('All');
                  setSelectedDietary('All');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map((dish) => {
                const isVeg = dish.dietary === 'veg' || dish.dietary === 'vegan';
                const isVegan = dish.dietary === 'vegan';

                return (
                  <div
                    key={dish.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                      dish.isAvailable
                        ? 'bg-white dark:bg-[#0c1424] border-slate-200 dark:border-white/10 shadow-xs hover:border-amber-400/50'
                        : 'bg-slate-50/60 dark:bg-[#080d17] border-slate-200 dark:border-white/5 opacity-70'
                    }`}
                  >
                    <div>
                      {/* Image Banner */}
                      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                              !dish.isAvailable ? 'grayscale' : ''
                            }`}
                            onError={(e) => {
                              // Fallback on image load error
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <UtensilsCrossed className="w-10 h-10 opacity-30" />
                          </div>
                        )}

                        {/* Badges on image */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          {/* Dietary badge */}
                          <div
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-xs ${
                              isVegan
                                ? 'bg-emerald-600/90 text-white'
                                : isVeg
                                ? 'bg-green-600/90 text-white'
                                : 'bg-rose-600/90 text-white'
                            }`}
                          >
                            {isVegan ? (
                              <Leaf className="w-3 h-3" />
                            ) : (
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isVeg ? 'bg-white' : 'bg-white'
                                }`}
                              />
                            )}
                            <span>{dish.dietary}</span>
                          </div>

                          {/* Category */}
                          <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white">
                            {dish.category}
                          </span>
                        </div>

                        {/* Availability Pill */}
                        <div className="absolute top-3 right-3">
                          <button
                            type="button"
                            onClick={() => toggleDiningMenuItemAvailability(dish.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                              dish.isAvailable
                                ? 'bg-emerald-500/90 hover:bg-emerald-600 text-white'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-rose-300'
                            }`}
                            title="Click to toggle availability"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                dish.isAvailable ? 'bg-white' : 'bg-rose-400'
                              }`}
                            />
                            <span>{dish.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                              {dish.name}
                            </h3>
                            {dish.cuisine && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                {dish.cuisine} Cuisine
                              </p>
                            )}
                          </div>
                          <span className="text-base font-bold text-slate-900 dark:text-white shrink-0 font-mono">
                            ₹{dish.price}
                          </span>
                        </div>

                        {dish.desc && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {dish.desc}
                          </p>
                        )}

                        {dish.ingredients && dish.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {dish.ingredients.slice(0, 4).map((ing, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                              >
                                {ing}
                              </span>
                            ))}
                            {dish.ingredients.length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md text-slate-400">
                                +{dish.ingredients.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions: Availability Toggle & Remove Button */}
                    <div className="p-4 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDiningMenuItemAvailability(dish.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                          dish.isAvailable
                            ? 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                            : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{dish.isAvailable ? 'Mark Unavailable' : 'Mark Available'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDishToDelete(dish)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                        title="Remove dish from menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: GUEST ORDERS                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          {/* Controls: Search & Order Status Filters */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] p-4 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by room, guest, order ref (e.g. RS-402), or dish name..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Status Filters */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0 overflow-x-auto">
                {[
                  { id: 'All', label: 'All Orders' },
                  { id: 'active', label: 'Active Orders' },
                  { id: 'placed', label: 'Order Placed' },
                  { id: 'preparing', label: 'Preparing' },
                  { id: 'out_for_delivery', label: 'Out for Delivery' },
                  { id: 'delivered', label: 'Delivered' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      orderStatusFilter === tab.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Counter Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> of{' '}
              {allOrders.length} guest orders
            </span>
            <span>
              Active Kitchen Orders:{' '}
              <strong className="text-amber-500">{activeOrdersCount}</strong>
            </span>
          </div>

          {/* Orders List / Cards */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No guest orders found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No food orders match your current filter criteria. Check back when guests place dining requests.
              </p>
              <button
                onClick={() => {
                  setOrderSearch('');
                  setOrderStatusFilter('All');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                Reset Order Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusConfig = getOrderStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] p-5 shadow-xs hover:border-amber-400/40 transition-all space-y-4"
                  >
                    {/* Top Row: Ref, Room, Placed Time, Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          #{order.ref || order.id.slice(-7)}
                        </span>

                        {order.room && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Room {order.room} {order.floor ? `· Floor ${order.floor}` : ''}
                          </span>
                        )}

                        {order.priority && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              order.priority === 'urgent'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : order.priority === 'vip'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                            }`}
                          >
                            {order.priority}
                          </span>
                        )}

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{order.createdAt || 'Recent'}</span>
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${statusConfig.tone}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusConfig.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Order Items List & Details */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Order Details:
                      </div>

                      {order.orderLines && order.orderLines.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3 border border-slate-100 dark:border-white/5">
                          {(order.orderLines as any[]).map((line: any, idx: number) => (
                            <div
                              key={idx}
                              className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                                  {line.qty}×
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {line.name}
                                </span>
                                {line.dietary && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 capitalize">
                                    {line.dietary}
                                  </span>
                                )}
                                {line.spiceLevel && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    {line.spiceLevel}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                ₹{line.lineTotal || (line.price ? line.price * line.qty : 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-3 border border-slate-100 dark:border-white/5 text-xs sm:text-sm">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {order.title || 'Room Service Dining Order'}
                          </p>
                          {order.meta && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {order.meta}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Guest Notes */}
                      {order.description && (
                        <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <div>
                            <strong className="font-semibold">Guest Note: </strong>
                            {order.description}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Total & Status Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 uppercase font-semibold">Total Amount:</span>
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                          ₹{order.amount || 0}
                        </span>
                      </div>

                      {/* Status Progression Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {statusConfig.nextStatus && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, statusConfig.nextStatus!)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{statusConfig.nextLabel}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'Cancelled', 'danger')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}

                        {/* Direct Status Selector Dropdown */}
                        <select
                          aria-label="Direct Status Selector"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Preparing in Kitchen">Preparing in Kitchen</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD DISH TO MENU                                  */}
      {/* ========================================================= */}
      {isAddDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Add Item to Dining Menu
                  </h2>
                  <p className="text-xs text-slate-400">Add a new dish to the hotel dining catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDishModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDishSubmit} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dish / Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala, Club Sandwich"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Category & Cuisine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    {categories
                      .filter((c) => c !== 'All')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cuisine / Style
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indian, Continental, Asian"
                    value={newDishCuisine}
                    onChange={(e) => setNewDishCuisine(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Price & Dietary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dietary Classification *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'veg' as DietaryType, label: 'Veg' },
                      { id: 'non_veg' as DietaryType, label: 'Non-Veg' },
                      { id: 'vegan' as DietaryType, label: 'Vegan' },
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setNewDishDietary(type.id)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          newDishDietary === type.id
                            ? type.id === 'veg'
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50 font-bold'
                              : type.id === 'vegan'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 font-bold'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the dish flavors, serving portion, or special preparation..."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ingredients (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cottage cheese, Cashew gravy, Cream, Butter, Spices"
                  value={newDishIngredients}
                  onChange={(e) => setNewDishIngredients(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Preset Image Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose Photo / Visual
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_DISH_IMAGES.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setNewDishImage(preset.url)}
                      className={`relative rounded-xl overflow-hidden border h-16 transition-all cursor-pointer ${
                        newDishImage === preset.url
                          ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
                          : 'border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                        <span className="text-[9px] font-bold text-white truncate">{preset.label}</span>
                      </div>
                      {newDishImage === preset.url && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newDishAvailable}
                    onChange={(e) => setNewDishAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-100 border-slate-300 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Immediately mark as available in guest dining catalog
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddDishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Dish to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRM DELETE DISH                               */}
      {/* ========================================================= */}
      {dishToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove Item from Menu?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">&ldquo;{dishToDelete.name}&rdquo;</strong> from the hotel menu? Guests will no longer be able to order this item.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDishToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDiningMenuItem(dishToDelete.id);
                  setDishToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
