'use client';

import { useState } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Flame,
  Leaf,
  ArrowRight,
  ChevronLeft,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestSheet } from '@/components/guest/guestUi';

interface CustomDishRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: string;
  guestName: string;
  onSubmitted?: (ref: string) => void;
}

const CUISINES = [
  'Continental',
  'Indian',
  'Italian',
  'Asian / Oriental',
  'Mediterranean',
  'Mexican',
  'American',
  'French',
  'Other',
];

const SPICE_LEVELS: Array<'None' | 'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy'> = [
  'None',
  'Mild',
  'Medium',
  'Spicy',
  'Extra Spicy',
];

const DIETARY_OPTIONS: Array<'Vegetarian' | 'Vegan' | 'Non-Vegetarian' | 'Other'> = [
  'Vegetarian',
  'Vegan',
  'Non-Vegetarian',
  'Other',
];

const TIME_SLOTS = [
  'As soon as possible (ASAP)',
  'Within 45 minutes',
  'Within 1 hour',
  'Lunch (12:30 PM - 02:00 PM)',
  'Evening High Tea (05:00 PM - 06:30 PM)',
  'Dinner (07:30 PM - 09:00 PM)',
  'Late Night (10:00 PM - 11:30 PM)',
];

const QUICK_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Dairy / Lactose',
  'Gluten / Wheat',
  'Shellfish',
  'Eggs',
  'Soy',
  'Sesame',
];

export function CustomDishRequestModal({
  isOpen,
  onClose,
  room,
  guestName,
  onSubmitted,
}: CustomDishRequestModalProps) {
  const { submitCustomDiningRequest } = useDemo();

  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');

  // Form State
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('Continental');
  const [customCuisine, setCustomCuisine] = useState('');
  const [specialPreferences, setSpecialPreferences] = useState('');
  const [spiceLevel, setSpiceLevel] = useState<'None' | 'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy'>('Medium');
  const [dietaryPreference, setDietaryPreference] = useState<'Vegetarian' | 'Vegan' | 'Non-Vegetarian' | 'Other'>('Vegetarian');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState('');
  const [servings, setServings] = useState(1);
  const [deliveryTime, setDeliveryTime] = useState('As soon as possible (ASAP)');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  function toggleAllergen(item: string) {
    if (selectedAllergens.includes(item)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== item));
    } else {
      setSelectedAllergens([...selectedAllergens, item]);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleProceedToReview(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe what food or dish you would like prepared.');
      return;
    }
    setErrorMsg(null);
    setStep('review');
  }

  function handleSubmitFinal() {
    const activeCuisine = cuisine === 'Other' && customCuisine.trim() ? customCuisine.trim() : cuisine;
    const combinedAllergies = [
      ...selectedAllergens,
      ...(customAllergies.trim() ? [customAllergies.trim()] : []),
    ].join(', ');

    const ref = submitCustomDiningRequest({
      room,
      guestName,
      dishName: dishName.trim() || undefined,
      description: description.trim(),
      cuisine: activeCuisine,
      specialPreferences: specialPreferences.trim() || undefined,
      spiceLevel,
      dietaryPreference,
      allergiesToAvoid: combinedAllergies || undefined,
      servings,
      deliveryTimePreference: deliveryTime,
      additionalInstructions: additionalInstructions.trim() || undefined,
      imageUrl: imagePreview || undefined,
    });

    setSubmittedRef(ref);
    setStep('success');
    if (onSubmitted) {
      onSubmitted(ref);
    }
  }

  function handleResetAndClose() {
    setStep('form');
    setDishName('');
    setDescription('');
    setCuisine('Continental');
    setCustomCuisine('');
    setSpecialPreferences('');
    setSpiceLevel('Medium');
    setDietaryPreference('Vegetarian');
    setSelectedAllergens([]);
    setCustomAllergies('');
    setServings(1);
    setDeliveryTime('As soon as possible (ASAP)');
    setAdditionalInstructions('');
    setImagePreview(null);
    setSubmittedRef(null);
    setErrorMsg(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-ink-900 via-ink-950 to-ink-950 border border-white/15 text-white shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <ChefHat className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {step === 'form' && 'Customise Your Order'}
                  {step === 'review' && 'Review Custom Food Request'}
                  {step === 'success' && 'Request Dispatched to Kitchen'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold uppercase">
                  Chef&apos;s Special
                </span>
              </div>
              <p className="text-[11px] text-mist-400 mt-0.5">
                {step === 'form' && 'Tell us what you crave. Our culinary team will check availability & quote a price.'}
                {step === 'review' && 'Confirm your specifications before submitting to the executive kitchen.'}
                {step === 'success' && 'Your request is in the kitchen dashboard for chef review.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: FORM */}
          {step === 'form' && (
            <form onSubmit={handleProceedToReview} className="space-y-4 text-xs">
              {/* Dish Name & Cuisine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200 flex items-center justify-between">
                    <span>Dish Name</span>
                    <span className="text-[10px] text-mist-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Porcini Mushroom Truffle Tagliatelle"
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white placeholder-mist-500 focus:border-amber-400 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">
                    Preferred Cuisine <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  >
                    {CUISINES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {cuisine === 'Other' && (
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Specify Cuisine Name</label>
                  <input
                    type="text"
                    value={customCuisine}
                    onChange={(e) => setCustomCuisine(e.target.value)}
                    placeholder="e.g. Lebanese, Greek, Ethiopian..."
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white placeholder-mist-500 focus:border-amber-400 outline-none"
                    required
                  />
                </div>
              )}

              {/* Detailed Description */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span>
                    Detailed Food Description <span className="text-amber-400">*</span>
                  </span>
                  <span className="text-[10px] text-mist-400 font-normal">Describe freely</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exactly how you'd like your dish prepared, sauces, texture, cooking style, seasonings, or specific flavors you crave..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white placeholder-mist-500 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              {/* Dietary Preference & Spice Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Dietary Preference</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DIETARY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDietaryPreference(opt)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all text-center ${
                          dietaryPreference === opt
                            ? 'bg-amber-400 text-ink-950 border-amber-400 font-bold shadow-sm'
                            : 'bg-white/5 border-white/10 text-mist-300 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>Spice Level</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {SPICE_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSpiceLevel(lvl)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                          spiceLevel === lvl
                            ? 'bg-amber-400 text-ink-950 border-amber-400 font-bold'
                            : 'bg-white/5 border-white/10 text-mist-300 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ingredients & Preferences */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200">
                  Ingredients &amp; Special Preferences
                </label>
                <input
                  type="text"
                  value={specialPreferences}
                  onChange={(e) => setSpecialPreferences(e.target.value)}
                  placeholder="e.g. Extra garlic, olive oil instead of butter, well done, less salt..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white placeholder-mist-500 focus:border-amber-400 outline-none"
                />
              </div>

              {/* Allergies / Ingredients to Avoid */}
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span>Allergies &amp; Ingredients to Avoid</span>
                  <span className="text-[10px] text-mist-400 font-normal">Select all that apply</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ALLERGENS.map((all) => {
                    const isSelected = selectedAllergens.includes(all);
                    return (
                      <button
                        key={all}
                        type="button"
                        onClick={() => toggleAllergen(all)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                            : 'bg-white/5 border-white/10 text-mist-300 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{all}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customAllergies}
                  onChange={(e) => setCustomAllergies(e.target.value)}
                  placeholder="Other specific ingredients or items you must avoid..."
                  className="w-full px-3 py-1.5 rounded-xl bg-ink-900 border border-white/15 text-white placeholder-mist-500 focus:border-amber-400 outline-none text-xs mt-1"
                />
              </div>

              {/* Quantity & Preferred Delivery Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Servings / Quantity</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={servings}
                      onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white text-center font-bold font-mono focus:border-amber-400 outline-none"
                    />
                    <span className="text-mist-400 text-xs">portion{servings > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Preferred Delivery Time</span>
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span>Additional Instructions</span>
                  <span className="text-[10px] text-mist-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Cut into small slices, warm plates, deliver with ice bucket..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white placeholder-mist-500 focus:border-amber-400 outline-none"
                />
              </div>

              {/* Optional Reference Image Upload */}
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                    <span>Reference Image</span>
                  </span>
                  <span className="text-[10px] text-mist-400 font-normal">Optional</span>
                </label>

                {imagePreview ? (
                  <div className="relative rounded-xl border border-white/15 overflow-hidden w-full max-h-48 bg-black/40 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Reference preview"
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]">
                    <Upload className="h-4 w-4 text-mist-400" />
                    <span className="text-xs text-mist-300">Click to attach photo or dish inspiration</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span>Review Request</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW */}
          {step === 'review' && (
            <div className="space-y-4 text-xs">
              <div className="guest-card p-4 space-y-3 border border-amber-400/30 bg-amber-400/[0.03]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      {cuisine === 'Other' && customCuisine ? customCuisine : cuisine} · {dietaryPreference}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {dishName.trim() || 'Custom Chef Preparation'}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[10px] border border-amber-400/30">
                    {servings} serving{servings > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-mist-400">Preparation Details</p>
                  <p className="text-mist-200 leading-relaxed text-xs">{description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-mist-400 block text-[9px] uppercase font-bold">Spice Level</span>
                    <span className="text-white font-semibold">{spiceLevel}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="text-mist-400 block text-[9px] uppercase font-bold">Target Delivery</span>
                    <span className="text-white font-semibold truncate block">{deliveryTime}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 col-span-2 sm:col-span-1">
                    <span className="text-mist-400 block text-[9px] uppercase font-bold">Avoid Allergens</span>
                    <span className="text-rose-300 font-semibold truncate block">
                      {[...selectedAllergens, ...(customAllergies ? [customAllergies] : [])].join(', ') || 'None listed'}
                    </span>
                  </div>
                </div>

                {specialPreferences && (
                  <div className="text-[11px] text-mist-300">
                    <strong className="text-mist-400">Special Preferences:</strong> {specialPreferences}
                  </div>
                )}

                {additionalInstructions && (
                  <div className="text-[11px] text-mist-300">
                    <strong className="text-mist-400">Additional Instructions:</strong> {additionalInstructions}
                  </div>
                )}

                {imagePreview && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-mist-400 uppercase block mb-1">Attached Reference</span>
                    <img
                      src={imagePreview}
                      alt="Reference"
                      className="h-28 w-44 rounded-lg object-cover border border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* Strict Notice */}
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1 text-[11px] text-cyan-200 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Important Approval Rule:</strong>
                  Your order is never automatically charged or prepared until staff reviews ingredient availability and quotes a fair price. You will receive an alert to review and approve the quoted price before confirmation.
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-3.5 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md flex items-center gap-1.5"
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  <span>Submit to Kitchen Team</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </span>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Custom Request Dispatched!</h3>
                <p className="text-xs text-mist-300 max-w-md mx-auto">
                  Reference <span className="font-mono font-bold text-amber-400">{submittedRef}</span> has been transmitted to Executive Chef Anand &amp; the Dining Dispatcher team.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-mist-300 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Clock className="h-4 w-4" />
                  <span>What happens next:</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] text-mist-400">
                  <li>Kitchen verifies pantry ingredients and culinary timing.</li>
                  <li>Chef quotes an estimated price &amp; preparation duration.</li>
                  <li>You will receive an alert in <strong className="text-white">My Activity</strong> to approve the quoted price before cooking begins.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md inline-flex items-center gap-1.5"
              >
                <span>Back to Dining Menu</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

