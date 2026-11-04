'use client';

import { useState, useId, useRef, useEffect } from 'react';
import {
  Wrench,
  Thermometer,
  Droplets,
  Droplet,
  Zap,
  Tv,
  Sofa,
  Armchair,
  BedDouble,
  DoorClosed,
  KeyRound,
  Lock,
  PanelTop,
  AlertTriangle,
  ShieldAlert,
  Camera,
  CheckCircle2,
  Clock,
  X,
  Check,
  Info,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Snowflake,
  Power,
  Volume2,
  Flame,
  Filter,
  RotateCcw,
  Lightbulb,
  Plug,
  WifiOff,
  Radio,
  Eye,
  Trash2,
  Plus,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

// Subcategory with individual icon
interface MaintenanceSubcategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// The 6 standard hotel maintenance categories with representative images
interface MaintenanceCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  subcategories: MaintenanceSubcategory[];
}

const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  {
    id: 'mc1',
    name: 'AC / Climate',
    icon: Thermometer,
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80',
    subcategories: [
      { id: 'ac-not-cooling', label: 'Not cooling', icon: Snowflake },
      { id: 'ac-not-switching-on', label: 'Not switching on', icon: Power },
      { id: 'ac-remote-issue', label: 'Remote issue', icon: Tv },
      { id: 'ac-unusual-noise', label: 'Unusual noise', icon: Volume2 },
      { id: 'ac-water-leakage', label: 'Water leakage', icon: Droplets },
    ],
  },
  {
    id: 'mc2',
    name: 'Plumbing',
    icon: Droplets,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
    subcategories: [
      { id: 'plumb-tap-leakage', label: 'Tap leakage', icon: Droplets },
      { id: 'plumb-shower-issue', label: 'Shower issue', icon: Droplet },
      { id: 'plumb-drain-blockage', label: 'Drain blockage', icon: Filter },
      { id: 'plumb-no-hot-water', label: 'No hot water', icon: Flame },
      { id: 'plumb-toilet-issue', label: 'Toilet issue', icon: RotateCcw },
    ],
  },
  {
    id: 'mc3',
    name: 'Electrical',
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=500&q=80',
    subcategories: [
      { id: 'elec-light', label: 'Light not working', icon: Lightbulb },
      { id: 'elec-power', label: 'Power issue', icon: Zap },
      { id: 'elec-socket', label: 'Switch/socket issue', icon: Plug },
    ],
  },
  {
    id: 'mc4',
    name: 'TV / Entertainment',
    icon: Tv,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=500&q=80',
    subcategories: [
      { id: 'tv-not-working', label: 'TV not working', icon: Tv },
      { id: 'tv-remote', label: 'Remote issue', icon: Radio },
      { id: 'tv-no-signal', label: 'No signal', icon: WifiOff },
    ],
  },
  {
    id: 'mc5',
    name: 'Furniture',
    icon: Sofa,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&q=80',
    subcategories: [
      { id: 'furn-broken-chair', label: 'Broken chair', icon: Armchair },
      { id: 'furn-bed-issue', label: 'Bed issue', icon: BedDouble },
      { id: 'furn-wardrobe-issue', label: 'Wardrobe issue', icon: DoorClosed },
      { id: 'furn-door-lock-issue', label: 'Door/lock issue', icon: KeyRound },
    ],
  },
  {
    id: 'mc6',
    name: 'Other',
    icon: Wrench,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=500&q=80',
    subcategories: [
      { id: 'other-safe', label: 'Safe / mini-bar issue', icon: Lock },
      { id: 'other-window', label: 'Window / curtain stuck', icon: PanelTop },
      { id: 'other-general', label: 'General maintenance', icon: Wrench },
      { id: 'other-custom', label: 'Custom issue description', icon: HelpCircle },
    ],
  },
];

// Available maintenance time slots
const MAINTENANCE_TIME_SLOTS = [
  { time: '08:00 AM', hour24: 8 },
  { time: '09:30 AM', hour24: 9 },
  { time: '11:00 AM', hour24: 11 },
  { time: '12:30 PM', hour24: 12 },
  { time: '02:00 PM', hour24: 14 },
  { time: '03:30 PM', hour24: 15 },
  { time: '05:00 PM', hour24: 17 },
  { time: '06:30 PM', hour24: 18 },
  { time: '08:00 PM', hour24: 20 },
];

export function MaintenanceTab({ room, guestName, onNavigate }: GuestTabProps) {
  const { submitGuestRequest } = useDemo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // 1. Category & Subcategory selection
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // 2. Issue Description (min 5, max 500)
  const [description, setDescription] = useState('');
  const [descTouched, setDescTouched] = useState(false);

  // 3. Priority Level (Minor, Urgent, Safety)
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'safety'>('normal');

  // 4. Real Photo Attachments (up to 3 files, base64 data URLs)
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);

  // 5. Preferred Visit Time
  const [visitType, setVisitType] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledDate, setScheduledDate] = useState<'today' | 'tomorrow'>('today');
  const [scheduledSlot, setScheduledSlot] = useState<string>('02:00 PM');

  // 6. Room Access Permission (deliberate choice, not assumed by default)
  const [roomAccess, setRoomAccess] = useState<'yes' | 'no' | null>(null);
  const [roomAccessTouched, setRoomAccessTouched] = useState(false);

  // 7. Submission status & Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  const selectedCategory = MAINTENANCE_CATEGORIES.find((c) => c.id === selectedCatId);
  const nowHour = new Date().getHours();

  // Handle ESC key to close photo preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewPhotoIndex !== null) {
        setPreviewPhotoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhotoIndex]);

  // Validations
  const isDescValid = description.trim().length >= 5 && description.length <= 500;
  const isRoomAccessChosen = roomAccess !== null;
  const canSubmit = Boolean(selectedCategory) && isDescValid && isRoomAccessChosen && !isSubmitting;

  // Handle Photo File Upload / Capture
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 3) {
      setPhotoError('You can attach a maximum of 3 photos.');
      return;
    }

    const readers: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPhotoError('Only image files (PNG, JPG, HEIC, WebP) are allowed.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('File size exceeds 5MB limit.');
        return;
      }

      const p = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      readers.push(p);
    }

    Promise.all(readers)
      .then((newPhotos) => {
        setPhotos((prev) => [...prev, ...newPhotos].slice(0, 3));
      })
      .catch(() => {
        setPhotoError('Error reading selected image files. Please try again.');
      });

    // Reset file input value so same file can be re-selected if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (previewPhotoIndex === index) {
      setPreviewPhotoIndex(null);
    } else if (previewPhotoIndex !== null && previewPhotoIndex > index) {
      setPreviewPhotoIndex(previewPhotoIndex - 1);
    }
    setPhotoError(null);
  }

  // Visit time display string
  const visitTimeDisplay =
    visitType === 'asap'
      ? 'As soon as possible (~15–30 mins)'
      : `${scheduledDate === 'today' ? 'Today' : 'Tomorrow'} at ${scheduledSlot}`;

  // Room access display string
  const roomAccessDisplay =
    roomAccess === 'yes'
      ? 'Yes, authorized team may enter with master key if guest is away'
      : roomAccess === 'no'
      ? 'No, staff must contact guest before entering room'
      : 'Not specified';

  // Submit Handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedCategory) {
      setDescTouched(true);
      setRoomAccessTouched(true);
      return;
    }

    setIsSubmitting(true);

    const fullTitle = selectedSubcategory
      ? `${selectedCategory.name} · ${selectedSubcategory}`
      : `${selectedCategory.name} issue`;

    const descriptionSections: string[] = [
      `Issue: ${description.trim()}`,
      `Preferred Visit Time: ${visitTimeDisplay}`,
      `Room Access Permission: ${roomAccessDisplay}`,
      photos.length > 0 ? `Attached Evidence: ${photos.length} photo(s) attached` : '',
    ].filter(Boolean);

    const ref = submitGuestRequest({
      room,
      title: fullTitle,
      meta: `Maintenance · Room ${room} · ${priority.toUpperCase()}`,
      category: 'maintenance',
      description: descriptionSections.join('\n\n'),
      priority,
      photoAttached: photos.length > 0,
      photoUrl: photos[0],
      tone: priority === 'safety' ? 'danger' : priority === 'urgent' ? 'warning' : 'info',
    });

    setConfirmedRef(ref);
    setIsSubmitting(false);

    // Reset form
    setSelectedCatId(null);
    setSelectedSubcategory(null);
    setDescription('');
    setDescTouched(false);
    setPriority('normal');
    setPhotos([]);
    setVisitType('asap');
    setRoomAccess(null);
    setRoomAccessTouched(false);
  }

  return (
    <div className="space-y-6 sm:space-y-7 pb-20 max-w-4xl lg:max-w-5xl mx-auto">
      {/* SUCCESS CONFIRMATION BANNER */}
      {confirmedRef && (
        <div className="guest-card p-4 border-cyan-400/50 bg-cyan-400/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/20 text-cyan-300 shrink-0 mt-0.5">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Maintenance Ticket Confirmed</span>
                <span className="font-mono text-cyan-300 font-black">[{confirmedRef}]</span>
              </p>
              <p className="text-[11px] text-cyan-200">
                Dispatched to our Engineering team for Room {room}. Track live progress under Requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-sm transition-colors"
            >
              View Ticket
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

      {/* 1. COMPACT STATUS INDICATOR */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold text-mist-300">
            Duty Engineer On Call &bull; Room {room}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
        {/* 2. VISUAL ISSUE CATEGORY GRID */}
        <div className="space-y-2.5 sm:space-y-3">
          <GuestSectionHeader
            title="1. What needs attention?"
            hint="Select the category that best describes the issue"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4">
            {MAINTENANCE_CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCatId === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedCatId(c.id);
                    setSelectedSubcategory(null);
                  }}
                  className={`p-2.5 sm:p-3 md:p-3.5 rounded-2xl border text-left flex flex-col gap-2.5 transition-all group overflow-hidden ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-400/15 text-white ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Category Thumbnail Image with Overlay Badge */}
                  <div className="relative h-20 sm:h-28 md:h-32 w-full rounded-xl overflow-hidden bg-ink-950 shrink-0">
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Gradient vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Floating Icon Pill */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg backdrop-blur-md transition-colors ${
                          isSelected
                            ? 'bg-cyan-400 text-ink-950 shadow-md font-bold'
                            : 'bg-ink-950/80 border border-white/10 text-cyan-300'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>

                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <span className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-full bg-cyan-400 text-ink-950 shadow-md text-[10px] sm:text-xs font-black">
                          ✓
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Name & Count */}
                  <div className="px-1 pb-0.5">
                    <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] sm:text-xs text-mist-400 block truncate">
                      {c.subcategories.length} issue options
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. VISUAL SUBCATEGORY SELECTION */}
        {selectedCategory && (
          <div className="space-y-2.5 p-4 rounded-2xl bg-cyan-400/[0.05] border border-cyan-400/20 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded bg-cyan-400/20 text-cyan-300">
                  <selectedCategory.icon className="h-3 w-3" />
                </span>
                <span>Common {selectedCategory.name} Issues:</span>
              </label>
              <span className="text-[10px] text-cyan-300">Tap to select or specify below</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCategory.subcategories.map((sub) => {
                const SubIcon = sub.icon;
                const isSelected = selectedSubcategory === sub.label;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? null : sub.label;
                      setSelectedSubcategory(next);
                      if (next && (!description.trim() || description === selectedSubcategory)) {
                        setDescription(next);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-400 text-ink-950 font-bold shadow-md ring-1 ring-cyan-300 scale-[1.02]'
                        : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <SubIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSelected ? 'text-ink-950' : 'text-cyan-300'}`} />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. ISSUE DESCRIPTION */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <GuestSectionHeader
              title="2. Describe the issue"
              hint="Provide details to help our engineers prepare"
            />
            <span
              className={`text-[11px] sm:text-xs font-mono font-semibold ${
                description.length > 500
                  ? 'text-rose-400'
                  : isDescValid
                  ? 'text-emerald-400'
                  : 'text-mist-400'
              }`}
            >
              {description.length} / 500 characters
            </span>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setDescTouched(true)}
            rows={3}
            maxLength={500}
            placeholder="Briefly describe what is wrong... (e.g. The AC is blowing warm air and the remote isn't responding)"
            className={`guest-field w-full px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-white rounded-xl bg-ink-950/80 border placeholder-mist-500 focus:outline-none transition-colors ${
              descTouched && !isDescValid
                ? 'border-rose-500 focus:border-rose-400'
                : 'border-white/10 focus:border-cyan-400/50'
            }`}
          />

          {/* Validation Feedback */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            {descTouched && !isDescValid ? (
              <p className="text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>
                  {description.trim().length === 0
                    ? 'Please provide a brief description of the issue.'
                    : `Please enter at least 5 characters (${description.trim().length}/5).`}
                </span>
              </p>
            ) : isDescValid ? (
              <p className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Description looks good</span>
              </p>
            ) : (
              <p className="text-mist-400">Minimum 5 characters required</p>
            )}
          </div>
        </div>

        {/* 5. PRIORITY SELECTION */}
        <div className="space-y-2.5 sm:space-y-3">
          <GuestSectionHeader
            title="3. Priority"
            hint="Select urgency to route to the correct duty team"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            {/* Minor */}
            <button
              type="button"
              aria-pressed={priority === 'normal'}
              onClick={() => setPriority('normal')}
              className={`p-3.5 sm:p-4 md:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                priority === 'normal'
                  ? 'border-cyan-400 bg-cyan-400/15 text-white ring-2 ring-cyan-400/30 shadow-md'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <div>
                <p className="text-xs sm:text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                  <span>Minor</span>
                </p>
                <p className="text-[11px] sm:text-xs text-mist-400 mt-1.5 leading-snug">
                  Not urgent — fix whenever convenient.
                </p>
              </div>
              <span className="mt-3 text-[9px] sm:text-[10px] font-bold text-mist-400 uppercase tracking-wider">
                Standard Queue
              </span>
            </button>

            {/* Urgent */}
            <button
              type="button"
              aria-pressed={priority === 'urgent'}
              onClick={() => setPriority('urgent')}
              className={`p-3.5 sm:p-4 md:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                priority === 'urgent'
                  ? 'border-cyan-400 bg-cyan-400/15 text-white ring-2 ring-cyan-400/30 shadow-md'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <div>
                <p className="text-xs sm:text-sm md:text-base font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                  <span>Urgent</span>
                </p>
                <p className="text-[11px] sm:text-xs text-mist-400 mt-1.5 leading-snug">
                  Affecting your stay — priority duty dispatch.
                </p>
              </div>
              <span className="mt-3 text-[9px] sm:text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                Fast Response
              </span>
            </button>

            {/* Safety */}
            <button
              type="button"
              aria-pressed={priority === 'safety'}
              onClick={() => setPriority('safety')}
              className={`p-3.5 sm:p-4 md:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                priority === 'safety'
                  ? 'border-cyan-400 bg-cyan-400/15 text-white ring-2 ring-cyan-400/30 shadow-md'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <div>
                <p className="text-xs sm:text-sm md:text-base font-bold text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                  <span>Safety</span>
                </p>
                <p className="text-[11px] sm:text-xs text-mist-400 mt-1.5 leading-snug">
                  Safety / security concern — alerts Duty Manager.
                </p>
              </div>
              <span className="mt-3 text-[9px] sm:text-[10px] font-bold text-rose-400/80 uppercase tracking-wider">
                Direct Escalation
              </span>
            </button>
          </div>

          {/* Safety Notice if Safety Priority Selected */}
          {priority === 'safety' && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert className="h-4 w-4" />
                <span>Important Safety Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Safety tickets instantly notify the Duty Manager and Lead Engineer. For immediate physical emergencies, medical issues, or fire hazards, please call the Front Desk directly by dialling <strong>0</strong> on your suite phone.
              </p>
            </div>
          )}
        </div>

        {/* 6. PHOTO ATTACHMENT AREA */}
        <div className="space-y-2.5">
          <GuestSectionHeader
            title="4. Photo attachment"
            hint="Upload clear photos of the issue to speed up troubleshooting"
          />

          {/* Hidden Real File Input */}
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Photos Grid & Upload Trigger */}
          <div className="space-y-2">
            {photos.length === 0 ? (
              /* Bordered Upload Dropzone when 0 photos */
              <label
                htmlFor={fileInputId}
                className="p-5 sm:p-7 md:p-8 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-cyan-400/[0.05] hover:border-cyan-400/40 flex flex-col items-center justify-center gap-2 cursor-pointer text-center transition-all group"
              >
                <span className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 group-hover:scale-110 transition-transform">
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-xs sm:text-sm md:text-base font-bold text-white group-hover:text-cyan-300">
                  Add photos
                </span>
                <span className="text-[11px] sm:text-xs text-mist-400">
                  Upload photos of the issue &bull; Tap to take a photo or select from gallery
                </span>
                <span className="text-[10px] sm:text-[11px] text-mist-500 font-mono">
                  Up to 3 images &bull; JPG, PNG, WebP (Max 5MB each)
                </span>
              </label>
            ) : (
              /* Thumbnails Grid when photos attached */
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                {photos.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewPhotoIndex(idx)}
                    className="relative h-24 sm:h-32 md:h-36 rounded-xl overflow-hidden border border-white/20 bg-ink-950 group shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
                    title="Click to preview full image"
                  >
                    <img
                      src={src}
                      alt={`Evidence thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[10px] sm:text-xs font-bold text-cyan-300 transition-opacity">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </span>
                    </div>

                    {/* Delete button in corner */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(idx);
                      }}
                      className="absolute top-1.5 right-1.5 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-ink-950/90 text-white hover:bg-rose-500 hover:text-white transition-colors shadow-md z-10"
                      title="Remove photo"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>

                    {/* Photo Index Tag */}
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] sm:text-[10px] font-mono font-bold bg-black/80 px-2 py-0.5 rounded text-white z-10">
                      Photo {idx + 1}
                    </span>
                  </div>
                ))}

                {/* Add More Card if under 3 photos */}
                {photos.length < 3 && (
                  <label
                    htmlFor={fileInputId}
                    className="h-24 sm:h-32 md:h-36 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-cyan-400/[0.05] hover:border-cyan-400/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-mist-400 hover:text-cyan-300 transition-colors text-center p-2"
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-[11px] sm:text-xs font-bold">Add more</span>
                    <span className="text-[9px] sm:text-[10px] text-mist-500">{3 - photos.length} remaining</span>
                  </label>
                )}
              </div>
            )}

            {photoError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{photoError}</span>
              </p>
            )}
          </div>
        </div>

        {/* 7. PREFERRED MAINTENANCE VISIT TIME */}
        <div className="space-y-2.5 sm:space-y-3">
          <GuestSectionHeader
            title="5. Preferred visit time"
            hint="Choose when it is most convenient for an engineer to arrive"
          />

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setVisitType('asap')}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all ${
                visitType === 'asap'
                  ? 'border-cyan-400 bg-cyan-400/15 text-white font-bold ring-2 ring-cyan-400/30'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold">As soon as possible</p>
              <p className="text-[10px] sm:text-xs text-mist-400 mt-0.5">~15–30 min response</p>
            </button>

            <button
              type="button"
              onClick={() => setVisitType('scheduled')}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all ${
                visitType === 'scheduled'
                  ? 'border-cyan-400 bg-cyan-400/15 text-white font-bold ring-2 ring-cyan-400/30'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold">Choose a time</p>
              <p className="text-[10px] sm:text-xs text-mist-400 mt-0.5">Schedule convenient slot</p>
            </button>
          </div>

          {/* Time slot picker if Scheduled */}
          {visitType === 'scheduled' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-ink-950/80 border border-white/10 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScheduledDate('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    scheduledDate === 'today'
                      ? 'bg-cyan-400 text-ink-950 shadow-sm'
                      : 'text-mist-400 hover:text-white border border-white/10'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setScheduledDate('tomorrow')}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    scheduledDate === 'tomorrow'
                      ? 'bg-cyan-400 text-ink-950 shadow-sm'
                      : 'text-mist-400 hover:text-white border border-white/10'
                  }`}
                >
                  Tomorrow
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {MAINTENANCE_TIME_SLOTS.map((slot) => {
                  const isPast = scheduledDate === 'today' && slot.hour24 <= nowHour;
                  const isSelected = scheduledSlot === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isPast}
                      onClick={() => setScheduledSlot(slot.time)}
                      className={`p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all ${
                        isPast
                          ? 'opacity-30 bg-white/5 cursor-not-allowed line-through text-mist-500'
                          : isSelected
                          ? 'bg-cyan-400 text-ink-950 font-bold shadow-md'
                          : 'bg-white/5 text-mist-300 hover:text-white border border-white/5'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] sm:text-xs text-mist-400 flex items-center gap-1.5">
                <Info className="h-3 w-3 text-cyan-400 shrink-0" />
                <span>Appointments are based on duty engineering availability and will be confirmed upon staff acknowledgement.</span>
              </p>
            </div>
          )}
        </div>

        {/* 8. ROOM ACCESS PERMISSION */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <GuestSectionHeader
              title="6. Can our maintenance team enter your room if you are away?"
              hint="Please select your suite entry preference"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
            <button
              type="button"
              aria-pressed={roomAccess === 'yes'}
              onClick={() => {
                setRoomAccess('yes');
                setRoomAccessTouched(true);
              }}
              className={`p-3.5 sm:p-4 md:p-4.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                roomAccess === 'yes'
                  ? 'border-emerald-400 bg-emerald-400/15 text-white ring-2 ring-emerald-400/30 shadow-md'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                  <span>Yes, I give permission</span>
                </p>
                <p className="text-[11px] sm:text-xs text-mist-400 leading-snug">
                  Authorized engineering staff may enter with master key if you are away.
                </p>
              </div>
              <div
                className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full border grid place-items-center shrink-0 mt-0.5 ${
                  roomAccess === 'yes'
                    ? 'border-emerald-400 bg-emerald-400 text-ink-950'
                    : 'border-white/20'
                }`}
              >
                {roomAccess === 'yes' && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />}
              </div>
            </button>

            <button
              type="button"
              aria-pressed={roomAccess === 'no'}
              onClick={() => {
                setRoomAccess('no');
                setRoomAccessTouched(true);
              }}
              className={`p-3.5 sm:p-4 md:p-4.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                roomAccess === 'no'
                  ? 'border-amber-400 bg-amber-400/15 text-white ring-2 ring-amber-400/30 shadow-md'
                  : 'border-white/10 bg-ink-900/80 text-mist-300 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                  <span>No, please contact me first</span>
                </p>
                <p className="text-[11px] sm:text-xs text-mist-400 leading-snug">
                  Staff must contact your suite phone or mobile before entering.
                </p>
              </div>
              <div
                className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full border grid place-items-center shrink-0 mt-0.5 ${
                  roomAccess === 'no'
                    ? 'border-amber-400 bg-amber-400 text-ink-950'
                    : 'border-white/20'
                }`}
              >
                {roomAccess === 'no' && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>

          {roomAccessTouched && roomAccess === null && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Please select whether staff has permission to enter if you are away.</span>
            </p>
          )}
        </div>

        {/* 9. COMPACT VISUAL REQUEST SUMMARY */}
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-cyan-400/[0.04] border border-cyan-400/25 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-400/20 text-cyan-300">
                <Wrench className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">Request Summary</span>
            </div>
            <span className="text-[11px] sm:text-xs font-mono text-cyan-300 font-semibold">
              Room {room} &bull; {guestName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
            {/* Category */}
            <div className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-mist-400 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                <Wrench className="h-3 w-3 text-cyan-400" />
                <span>Category</span>
              </div>
              <p className="font-bold text-white text-xs sm:text-sm truncate">
                {selectedCategory ? selectedCategory.name : '—'}
              </p>
            </div>

            {/* Issue */}
            <div className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-mist-400 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                <span>Issue</span>
              </div>
              <p className="font-bold text-white text-xs sm:text-sm truncate">
                {selectedSubcategory || (description ? description.slice(0, 24) : 'General')}
              </p>
            </div>

            {/* Priority */}
            <div className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-mist-400 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                {priority === 'safety' ? (
                  <ShieldAlert className="h-3 w-3 text-rose-400" />
                ) : priority === 'urgent' ? (
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                )}
                <span>Priority</span>
              </div>
              <p
                className={`font-bold text-xs sm:text-sm capitalize ${
                  priority === 'safety'
                    ? 'text-rose-400'
                    : priority === 'urgent'
                    ? 'text-amber-300'
                    : 'text-cyan-300'
                }`}
              >
                {priority === 'normal' ? 'Minor' : priority}
              </p>
            </div>

            {/* Visit Time */}
            <div className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-mist-400 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>Visit Time</span>
              </div>
              <p className="font-bold text-white text-xs sm:text-sm truncate">
                {visitType === 'asap'
                  ? 'ASAP (~15–30m)'
                  : `${scheduledDate === 'today' ? 'Today' : 'Tomorrow'} ${scheduledSlot}`}
              </p>
            </div>

            {/* Room Access */}
            <div className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-mist-400 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                <KeyRound className="h-3 w-3 text-cyan-400" />
                <span>Room Access</span>
              </div>
              <p
                className={`font-bold text-xs sm:text-sm truncate ${
                  roomAccess === 'yes'
                    ? 'text-emerald-300'
                    : roomAccess === 'no'
                    ? 'text-amber-300'
                    : 'text-mist-400'
                }`}
              >
                {roomAccess === 'yes'
                  ? 'Allowed while away'
                  : roomAccess === 'no'
                  ? 'Contact guest first'
                  : 'Pending choice'}
              </p>
            </div>

            {/* Photos */}
            <div className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-ink-950/60 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-mist-400 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">
                <Camera className="h-3 w-3 text-cyan-400" />
                <span>Attached Photos</span>
              </div>
              <p className="font-bold text-white text-xs sm:text-sm">
                {photos.length > 0 ? `${photos.length} photo(s)` : 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* 10. SUBMIT MAINTENANCE REQUEST BUTTON */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 sm:py-4 md:py-4.5 rounded-2xl bg-cyan-400 text-ink-950 font-black text-sm sm:text-base hover:bg-cyan-300 active:scale-[0.99] transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                <span>Logging Ticket...</span>
              </span>
            ) : (
              <>
                <Wrench className="h-4 w-4" />
                <span>Submit Maintenance Request</span>
              </>
            )}
          </button>

          {!selectedCategory && (
            <p className="text-[11px] text-mist-400 text-center">
              Please select an issue category above to proceed.
            </p>
          )}
        </div>
      </form>

      {/* PHOTO PREVIEW LIGHTBOX MODAL */}
      {previewPhotoIndex !== null && photos[previewPhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhotoIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Attached Photo Preview"
        >
          <div
            className="relative max-w-lg w-full bg-ink-900 border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  Photo Preview ({previewPhotoIndex + 1} of {photos.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoIndex(null)}
                className="p-1 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black max-h-[60vh] flex items-center justify-center">
              <img
                src={photos[previewPhotoIndex]}
                alt={`Attached issue photo ${previewPhotoIndex + 1}`}
                className="max-h-[60vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleRemovePhoto(previewPhotoIndex)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewPhotoIndex(null)}
                className="px-4 py-1.5 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
