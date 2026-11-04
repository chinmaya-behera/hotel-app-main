'use client';

import { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Flame,
  Check,
  X,
  Sparkles,
  Layers,
  Leaf,
  Info,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import {
  INITIAL_DINING_CATEGORIES,
  INITIAL_DINING_MENU,
  COMMON_ALLERGENS,
} from '@/components/guest/diningData';
import type {
  DiningMenuItem,
  DietaryType,
  AllergenType,
  MealTimeSlot,
  PortionOption,
  MenuItemAddon,
} from '@/types/demo';

export function AdminDiningTab() {
  const {
    state,
    addDiningMenuItem,
    updateDiningMenuItem,
    deleteDiningMenuItem,
    toggleDiningMenuItemAvailability,
    addDiningCategory,
    removeDiningCategory,
  } = useDemo();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DiningMenuItem | null>(null);
  const [newCatInput, setNewCatInput] = useState('');

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Breakfast');
  const [formPrice, setFormPrice] = useState<number>(450);
  const [formDietary, setFormDietary] = useState<DietaryType>('veg');
  const [formImage, setFormImage] = useState(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  );
  const [formDesc, setFormDesc] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formAllergens, setFormAllergens] = useState<AllergenType[]>([]);
  const [formMealTimes, setFormMealTimes] = useState<MealTimeSlot[]>(['all_day']);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formSpiceLevel, setFormSpiceLevel] = useState(false);
  const [formPortionSize, setFormPortionSize] = useState(false);
  const [formAddons, setFormAddons] = useState<MenuItemAddon[]>([]);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(60);

  const categories: string[] = state.diningCategories && state.diningCategories.length > 0
    ? state.diningCategories
    : INITIAL_DINING_CATEGORIES;

  const menu: DiningMenuItem[] = state.diningMenu && state.diningMenu.length > 0
    ? state.diningMenu
    : INITIAL_DINING_MENU;

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter((dish) => {
      if (selectedCategory !== 'all' && dish.category !== selectedCategory) {
        return false;
      }
      if (selectedDietary !== 'all' && dish.dietary !== selectedDietary) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          dish.name.toLowerCase().includes(q) ||
          dish.category.toLowerCase().includes(q) ||
          (dish.desc && dish.desc.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [menu, selectedCategory, selectedDietary, search]);

  const totalCount = menu.length;
  const availableCount = menu.filter((d) => d.isAvailable).length;
  const disabledCount = totalCount - availableCount;

  // Open Edit Form
  function handleOpenEdit(dish: DiningMenuItem) {
    setEditingDish(dish);
    setFormName(dish.name);
    setFormCategory(dish.category);
    setFormPrice(dish.price);
    setFormDietary(dish.dietary);
    setFormImage(dish.image);
    setFormDesc(dish.desc ?? '');
    setFormIngredients(dish.ingredients.join(', '));
    setFormAllergens(dish.allergens);
    setFormMealTimes(dish.mealTimes ?? ['all_day']);
    setFormAvailable(dish.isAvailable);
    setFormSpiceLevel(Boolean(dish.supportsSpiceLevel));
    setFormPortionSize(Boolean(dish.supportsPortionSize));
    setFormAddons(dish.availableAddons ?? []);
  }

  // Open Add Form
  function handleOpenAdd() {
    setEditingDish(null);
    setFormName('');
    setFormCategory(categories[0] || 'Breakfast');
    setFormPrice(450);
    setFormDietary('veg');
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setFormDesc('');
    setFormIngredients('');
    setFormAllergens([]);
    setFormMealTimes(['all_day']);
    setFormAvailable(true);
    setFormSpiceLevel(false);
    setFormPortionSize(false);
    setFormAddons([]);
    setIsAddModalOpen(true);
  }

  // Save Add / Edit
  function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedIngredients = formIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (editingDish) {
      updateDiningMenuItem(editingDish.id, {
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        dietary: formDietary,
        image: formImage.trim(),
        desc: formDesc.trim(),
        ingredients: parsedIngredients,
        allergens: formAllergens,
        mealTimes: formMealTimes,
        isAvailable: formAvailable,
        supportsSpiceLevel: formSpiceLevel,
        supportsPortionSize: formPortionSize,
        availableAddons: formAddons,
        prepNotesAllowed: true,
      });
      setEditingDish(null);
    } else {
      addDiningMenuItem({
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        dietary: formDietary,
        image: formImage.trim(),
        desc: formDesc.trim(),
        ingredients: parsedIngredients,
        allergens: formAllergens,
        mealTimes: formMealTimes,
        isAvailable: formAvailable,
        supportsSpiceLevel: formSpiceLevel,
        supportsPortionSize: formPortionSize,
        availableAddons: formAddons,
        prepNotesAllowed: true,
        rating: 4.8,
        ratingCount: 1,
      });
      setIsAddModalOpen(false);
    }
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    addDiningCategory(newCatInput.trim());
    setNewCatInput('');
  }

  function handleAddAddon() {
    if (!newAddonName.trim()) return;
    setFormAddons((prev) => [
      ...prev,
      { id: `addon-${Date.now()}`, name: newAddonName.trim(), price: Number(newAddonPrice) || 0 },
    ]);
    setNewAddonName('');
    setNewAddonPrice(60);
  }

  function handleRemoveAddon(id: string) {
    setFormAddons((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRICS */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/20 text-amber-300">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dining Menu &amp; Kitchen Catalog
              </h2>
              <p className="text-xs text-mist-400">
                Manage hotel dishes, pricing, dietary flags, ingredients, allergens and meal availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs font-semibold">
            <span className="text-white">
              Total Dishes: <strong className="font-mono text-amber-300">{totalCount}</strong>
            </span>
            <span className="text-emerald-400">
              Available: <strong className="font-mono">{availableCount}</strong>
            </span>
            {disabledCount > 0 && (
              <span className="text-rose-400">
                Disabled: <strong className="font-mono">{disabledCount}</strong>
              </span>
            )}
            <span className="text-mist-400">
              Categories: <strong className="font-mono">{categories.length}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 shadow-lg flex items-center gap-2 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* 2. CATEGORY CREATION BAR */}
      <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Layers className="h-4 w-4 text-amber-400" />
          <span>Menu Categories:</span>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-mist-300 flex items-center gap-1"
              >
                <span>{cat}</span>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDiningCategory(cat)}
                    className="text-mist-500 hover:text-rose-400"
                    title={`Remove category "${cat}"`}
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            placeholder="New Category..."
            className="rounded-lg bg-ink-950 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-amber-400/50"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
          >
            + Add
          </button>
        </form>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish, category or ingredient..."
            className="w-full rounded-xl bg-ink-950/80 border border-white/10 pl-9 pr-4 py-2 text-xs text-white placeholder-mist-400 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
          {/* Category dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl bg-ink-950/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Categories ({menu.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({menu.filter((d) => d.category === c).length})
              </option>
            ))}
          </select>

          {/* Dietary dropdown */}
          <select
            value={selectedDietary}
            onChange={(e) => setSelectedDietary(e.target.value)}
            className="rounded-xl bg-ink-950/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Dietary</option>
            <option value="veg">Vegetarian</option>
            <option value="non_veg">Non-Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>
      </div>

      {/* 4. DISHES TABLE / CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenu.map((dish) => (
          <div
            key={dish.id}
            className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
              dish.isAvailable
                ? 'bg-ink-900/80 border-white/10 hover:border-amber-400/30'
                : 'bg-ink-950/40 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-3">
              {/* Media header */}
              <div className="relative h-36 w-full rounded-xl overflow-hidden bg-ink-950">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      dish.dietary === 'veg'
                        ? 'bg-emerald-500 text-ink-950'
                        : dish.dietary === 'vegan'
                        ? 'bg-teal-500 text-ink-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {dish.dietary}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-ink-950/80 text-amber-300 border border-white/10">
                    {dish.category}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => toggleDiningMenuItemAvailability(dish.id)}
                    className={`p-1.5 rounded-lg text-xs font-bold shadow-md transition-colors ${
                      dish.isAvailable
                        ? 'bg-emerald-500/90 text-ink-950 hover:bg-emerald-400'
                        : 'bg-rose-500/90 text-white hover:bg-rose-400'
                    }`}
                    title={dish.isAvailable ? 'Click to disable dish' : 'Click to enable dish'}
                  >
                    {dish.isAvailable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-ink-950/90 text-amber-300 font-mono font-bold text-xs border border-white/10">
                  ₹{dish.price}
                </div>
              </div>

              {/* Title & Desc */}
              <div>
                <h3 className="text-sm font-bold text-white">{dish.name}</h3>
                {dish.desc && (
                  <p className="text-[11px] text-mist-400 line-clamp-2 mt-0.5">
                    {dish.desc}
                  </p>
                )}
              </div>

              {/* Ingredients & Allergens badge */}
              <div className="space-y-1 text-[11px]">
                <p className="text-mist-400">
                  <strong className="text-mist-300">Ingredients:</strong>{' '}
                  {dish.ingredients.join(', ') || 'Standard recipe'}
                </p>
                {dish.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dish.allergens.map((a) => (
                      <span
                        key={a}
                        className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Edit & Delete */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span
                className={`text-[11px] font-bold ${
                  dish.isAvailable ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dish.isAvailable ? '● Available' : '○ Disabled'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(dish)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-mist-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove "${dish.name}" from dining menu?`)) {
                      deleteDiningMenuItem(dish.id);
                    }
                  }}
                  className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-mist-400 hover:text-rose-400 transition-colors"
                  title="Delete dish"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. ADD / EDIT DISH MODAL */}
      {(isAddModalOpen || editingDish) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-ink-900 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-amber-400" />
                <span>{editingDish ? `Edit ${editingDish.name}` : 'Add New Dining Dish'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDish(null);
                }}
                className="p-1 text-mist-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-mist-300">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Truffle Mushroom Fettuccine"
                    className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-mist-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/50"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="font-bold text-mist-300">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                {/* Dietary */}
                <div className="space-y-1">
                  <label className="font-bold text-mist-300">Dietary Classification *</label>
                  <select
                    value={formDietary}
                    onChange={(e) => setFormDietary(e.target.value as DietaryType)}
                    className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/50"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Live Preview */}
              <div className="space-y-1">
                <label className="font-bold text-mist-300">Food Image URL</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/50 font-mono text-[11px]"
                  />
                  <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-ink-950">
                    <img src={formImage} alt="preview" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-mist-300">Short Appetizing Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Appetizing summary of ingredients and taste notes..."
                  className="w-full rounded-xl bg-ink-950 border border-white/10 p-2.5 text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-1">
                <label className="font-bold text-mist-300">
                  Ingredients (comma separated)
                </label>
                <input
                  type="text"
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  placeholder="e.g. Sourdough, Bacon, Free-range Eggs, Avocado, Hollandaise"
                  className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Allergens selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-mist-300">Allergen Declarations</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGENS.map((a) => {
                    const isSelected = formAllergens.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setFormAllergens((prev) =>
                            isSelected ? prev.filter((id) => id !== a.id) : [...prev, a.id],
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : 'bg-white/5 text-mist-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <span>{a.icon}</span>
                        <span>{a.id}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customizations Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSpiceLevel}
                    onChange={(e) => setFormSpiceLevel(e.target.checked)}
                    className="rounded border-white/20 bg-ink-950 text-amber-400"
                  />
                  <span className="font-semibold text-white">Enable Spice Level Selection</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPortionSize}
                    onChange={(e) => setFormPortionSize(e.target.checked)}
                    className="rounded border-white/20 bg-ink-950 text-amber-400"
                  />
                  <span className="font-semibold text-white">Enable Portion Sizing</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="rounded border-white/20 bg-ink-950 text-emerald-400"
                  />
                  <span className="font-semibold text-white">Dish Currently Available</span>
                </label>
              </div>

              {/* Addons Manager */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="font-bold text-mist-300">Configured Add-ons</label>
                <div className="flex flex-wrap gap-2">
                  {formAddons.map((addon) => (
                    <span
                      key={addon.id}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs flex items-center gap-1.5"
                    >
                      <span>{addon.name}</span>
                      <span className="text-amber-300 font-mono">+₹{addon.price}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddon(addon.id)}
                        className="text-mist-400 hover:text-rose-400 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    placeholder="Add-on Name (e.g. Extra Truffle Dip)"
                    className="flex-1 rounded-lg bg-ink-950 border border-white/10 px-3 py-1.5 text-white"
                  />
                  <input
                    type="number"
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(Number(e.target.value))}
                    placeholder="Price"
                    className="w-20 rounded-lg bg-ink-950 border border-white/10 px-2 py-1.5 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-ink-950 font-bold hover:bg-amber-300"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingDish(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 text-mist-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 shadow-md"
                >
                  {editingDish ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

