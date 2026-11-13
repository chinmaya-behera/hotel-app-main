'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Crown,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Sparkles,
  Heart,
  Thermometer,
  Coffee,
  BedDouble,
  CreditCard,
  Calendar,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

export function GuestProfileSubtab({ room, guestName }: GuestTabProps) {
  const { state, updateGuestProfile } = useDemo();
  const guestPalette = state.guestPalette ?? 'burgundy';

  // Find stay and preferences
  const stay = (state.frontDesk?.stays ?? []).find((s) => s.room === room);
  const prefs = state.guestPreferences?.[room] ?? {
    allergies: ['Gluten (Celiac)'],
    dietaryRestrictions: ['Vegetarian'],
    dnd: false,
    personalInstructions: 'Extra down-feather pillows requested upon evening turndown service.',
  };

  // State for editable profile
  const [email, setEmail] = useState('elena.rostova@prestige-holdings.eu');
  const [phone, setPhone] = useState('+1 (555) 382-9014');
  const [preferredTemp, setPreferredTemp] = useState('21°C / 70°F');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states inside modal
  const [formName, setFormName] = useState(guestName);
  const [formEmail, setFormEmail] = useState(email);
  const [formPhone, setFormPhone] = useState(phone);
  const [formTemp, setFormTemp] = useState(preferredTemp);
  const [formAllergies, setFormAllergies] = useState((prefs.allergies ?? []).join(', '));
  const [formDietary, setFormDietary] = useState((prefs.dietaryRestrictions ?? []).join(', '));
  const [formInstructions, setFormInstructions] = useState(prefs.personalInstructions ?? '');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    setEmail(formEmail);
    setPhone(formPhone);
    setPreferredTemp(formTemp);

    const updatedAllergies = formAllergies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updatedDietary = formDietary
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateGuestProfile(room, {
      name: formName.trim() || guestName,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      preferences: {
        allergies: updatedAllergies,
        dietaryRestrictions: updatedDietary,
        personalInstructions: formInstructions.trim(),
      },
    });

    setIsEditOpen(false);
    setToastMessage('Guest profile and stay preferences successfully updated.');
    setTimeout(() => setToastMessage(null), 5000);
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="text-xs text-emerald-300 font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Profile Header Hero Card */}
      <div
        className={cn(
          'p-5 space-y-4 rounded-2xl shadow-sm border transition-colors',
          guestPalette === 'burgundy'
            ? 'bg-white dark:bg-[#270D18] border-[#EADBCC] dark:border-[#461628]'
            : 'bg-white dark:bg-[#122C21] border-[#E5DFD3] dark:border-[#1E4F39]'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-ink-950 text-2xl font-black shadow-lg">
                {guestName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-ink-950 shadow-md">
                <ShieldCheck className="h-3 w-3 stroke-[3]" />
              </span>
            </div>

            {/* Basic Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">{stay?.guest || guestName}</h2>
                {stay?.vip && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                    <Crown className="h-3 w-3" />
                    <span>VIP Member</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <span>Room {room}</span>
                <span>·</span>
                <span>{stay?.roomType || 'Deluxe King Suite'}</span>
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-[10px] text-stone-700 dark:text-stone-300 font-mono">
                  Club Tier: Emerald Elite
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-300 font-mono font-bold">ID: GC-9823410</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => {
              setFormName(stay?.guest || guestName);
              setFormEmail(email);
              setFormPhone(phone);
              setFormTemp(preferredTemp);
              setFormAllergies((prefs.allergies ?? []).join(', '));
              setFormDietary((prefs.dietaryRestrictions ?? []).join(', '));
              setFormInstructions(prefs.personalInstructions ?? '');
              setIsEditOpen(true);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm self-start sm:self-center',
              guestPalette === 'burgundy'
                ? 'bg-[#74172F] hover:bg-[#8A2443]'
                : 'bg-[#175B49] hover:bg-[#206A55]'
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-200 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
            <Mail className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-semibold">Email Address</p>
              <p className="text-stone-900 dark:text-stone-100 truncate font-medium">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
            <Phone className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-semibold">Mobile Number</p>
              <p className="text-stone-900 dark:text-stone-100 truncate font-medium">{phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Stay Preferences & Personalized Instructions */}
      <div className="space-y-3">
        <GuestSectionHeader
          title="Personalized Stay Preferences"
          hint="Registered hospitality preferences automatically observed by Housekeeping, Dining & Front Desk"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Allergies & Dietary */}
          <div className="guest-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Coffee className="h-4 w-4" />
              <span>Dietary &amp; Food Allergens</span>
            </div>
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div>
                <span className="text-mist-400 font-medium">Allergies:</span>
                <p className="text-white font-semibold">
                  {prefs.allergies && prefs.allergies.length > 0
                    ? prefs.allergies.join(', ')
                    : 'None registered'}
                </p>
              </div>
              <div>
                <span className="text-mist-400 font-medium">Dietary Restrictions:</span>
                <p className="text-white font-semibold">
                  {prefs.dietaryRestrictions && prefs.dietaryRestrictions.length > 0
                    ? prefs.dietaryRestrictions.join(', ')
                    : 'Standard / No restrictions'}
                </p>
              </div>
            </div>
          </div>

          {/* Climate & Room Preferences */}
          <div className="guest-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
              <Thermometer className="h-4 w-4" />
              <span>Climate &amp; Turndown Service</span>
            </div>
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div>
                <span className="text-mist-400 font-medium">Preferred Suite Temperature:</span>
                <p className="text-white font-semibold">{preferredTemp}</p>
              </div>
              <div>
                <span className="text-mist-400 font-medium">Pillow Selection:</span>
                <p className="text-white font-semibold">Goose Down &amp; Memory Foam Dual Set</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="guest-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
            <Heart className="h-4 w-4" />
            <span>Standing Room Instructions</span>
          </div>
          <p className="text-xs text-mist-200 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/5">
            &quot;{prefs.personalInstructions || 'No custom standing instructions provided.'}&quot;
          </p>
        </div>
      </div>

      {/* Active Stay Credentials Card */}
      <div className="guest-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" />
            <span>Guaranteed Card on File</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 font-semibold">
            Authorized
          </span>
        </div>
        <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-mist-300">Visa ending in {stay?.cardMask || '•••• 4242'}</span>
            <span className="text-mist-500 text-[10px]">· Exp 08/28</span>
          </div>
          <span className="text-[11px] text-mist-400 font-medium">Pre-auth hold: ₹15,000</span>
        </div>
      </div>

      {/* App Guide & Interactive Walkthrough Card */}
      <div className="guest-card p-4 space-y-3 border-amber-400/20 bg-gradient-to-br from-amber-400/[0.04] to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Compass className="h-4 w-4" />
            <span>Interactive App Walkthrough</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 font-medium">
            7 Steps
          </span>
        </div>
        <p className="text-xs text-mist-300 leading-relaxed">
          Need a quick refresher on how to order room services, track delivery status, use your digital room key, or complete express checkout?
        </p>
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-guest-tour'));
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition-colors shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start Interactive Tour</span>
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(`grand_azure_tour_completed_${room}`);
                window.dispatchEvent(new CustomEvent('open-guest-tour'));
              } catch (e) {
                // ignore
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-mist-300 font-medium transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset &amp; Replay</span>
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <GuestSheet
          title="Edit Profile &amp; Preferences"
          onClose={() => setIsEditOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-2 py-3 px-4 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          }
        >
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="ep-name" className="text-mist-300 font-semibold block">
                Primary Guest Name
              </label>
              <input
                id="ep-name"
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="ep-email" className="text-mist-300 font-semibold block">
                  Email Address
                </label>
                <input
                  id="ep-email"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="guest-field w-full px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="ep-phone" className="text-mist-300 font-semibold block">
                  Mobile Number
                </label>
                <input
                  id="ep-phone"
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="guest-field w-full px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="ep-temp" className="text-mist-300 font-semibold block">
                Preferred Suite Temperature
              </label>
              <select
                id="ep-temp"
                value={formTemp}
                onChange={(e) => setFormTemp(e.target.value)}
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              >
                <option value="19°C / 66°F" className="bg-ink-900 text-white">19°C / 66°F (Cool)</option>
                <option value="20°C / 68°F" className="bg-ink-900 text-white">20°C / 68°F (Brisk)</option>
                <option value="21°C / 70°F" className="bg-ink-900 text-white">21°C / 70°F (Optimal)</option>
                <option value="22°C / 72°F" className="bg-ink-900 text-white">22°C / 72°F (Mild)</option>
                <option value="23°C / 73°F" className="bg-ink-900 text-white">23°C / 73°F (Warm)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="ep-allergies" className="text-mist-300 font-semibold block">
                Food Allergies (comma-separated)
              </label>
              <input
                id="ep-allergies"
                type="text"
                value={formAllergies}
                onChange={(e) => setFormAllergies(e.target.value)}
                placeholder="e.g. Peanuts, Shellfish, Gluten"
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ep-dietary" className="text-mist-300 font-semibold block">
                Dietary Preferences (comma-separated)
              </label>
              <input
                id="ep-dietary"
                type="text"
                value={formDietary}
                onChange={(e) => setFormDietary(e.target.value)}
                placeholder="e.g. Vegetarian, Halal, Kosher, Vegan"
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ep-instructions" className="text-mist-300 font-semibold block">
                Special Stay Instructions
              </label>
              <textarea
                id="ep-instructions"
                rows={3}
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                placeholder="Turndown timing, extra hangers, feather pillow preference..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </form>
        </GuestSheet>
      )}
    </div>
  );
}

