'use client';

import { useEffect, useRef } from 'react';
import { Check, Palette, Sparkles, X, Shield, Star, Gem } from 'lucide-react';
import type { GuestThemeOption } from '@/types/demo';
import { cn } from '@/lib/utils';

interface GuestThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: GuestThemeOption;
  onSelectTheme: (theme: GuestThemeOption) => void;
}

interface ThemeCardData {
  id: GuestThemeOption;
  name: string;
  badge: string;
  description: string;
  swatches: { color: string; label: string }[];
  headerBg: string;
  headerAccent: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  accentBg: string;
  accentText: string;
  icon: typeof Sparkles;
}

const THEMES: ThemeCardData[] = [
  {
    id: 'classic',
    name: 'Classic',
    badge: 'DEFAULT',
    description: 'Original Grand ADP Guest Experience.',
    swatches: [
      { color: '#0A1426', label: 'Navy' },
      { color: '#12203A', label: 'Surface' },
      { color: '#FBBF24', label: 'Amber' },
      { color: '#38BDF8', label: 'Cyan' },
      { color: '#F9F3F6', label: 'Porcelain' },
    ],
    headerBg: '#12203A',
    headerAccent: '#FBBF24',
    headerText: '#FFFFFF',
    cardBg: '#1A2942',
    cardBorder: 'rgba(255,255,255,0.12)',
    cardText: '#E7EDF8',
    accentBg: '#FBBF24',
    accentText: '#0B1426',
    icon: Shield,
  },
  {
    id: 'emerald',
    name: 'Emerald',
    badge: 'LUXURY RESORT',
    description: 'Elegant emerald tones with champagne gold accents.',
    swatches: [
      { color: '#0B3027', label: 'Deep Emerald' },
      { color: '#103E32', label: 'Emerald' },
      { color: '#C9A45C', label: 'Gold' },
      { color: '#F8F3E9', label: 'Ivory' },
      { color: '#302E29', label: 'Charcoal' },
    ],
    headerBg: '#0B3027',
    headerAccent: '#C9A45C',
    headerText: '#F8F3E9',
    cardBg: '#FFFCF7',
    cardBorder: '#DDD0B7',
    cardText: '#302E29',
    accentBg: '#C9A45C',
    accentText: '#0B3027',
    icon: Gem,
  },
  {
    id: 'burgundy',
    name: 'Burgundy',
    badge: 'TIMELESS HERITAGE',
    description: 'Timeless burgundy luxury with warm ivory and champagne gold.',
    swatches: [
      { color: '#641329', label: 'Deep Burgundy' },
      { color: '#74172F', label: 'Burgundy' },
      { color: '#C9A45C', label: 'Gold' },
      { color: '#F8F1E7', label: 'Warm Ivory' },
      { color: '#332D2A', label: 'Charcoal' },
    ],
    headerBg: '#641329',
    headerAccent: '#C9A45C',
    headerText: '#FFF8F0',
    cardBg: '#FFFCF8',
    cardBorder: '#E0CBA9',
    cardText: '#332D2A',
    accentBg: '#74172F',
    accentText: '#FFF8F0',
    icon: Star,
  },
];

export function GuestThemeSelectorModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}: GuestThemeSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-white/15 bg-ink-900/95 text-white shadow-2xl p-5 sm:p-7 space-y-6 box-border theme-selector-modal"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(201, 164, 92, 0.15)',
        }}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
              <Palette className="h-3 w-3" />
              <span>Theme Collection</span>
            </div>
            <h2 id="theme-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Choose Your Experience
            </h2>
            <p className="text-xs sm:text-sm text-mist-300">
              Personalize your Grand ADP guest experience.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close theme selector"
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 hover:bg-white/15 text-mist-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Theme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;
            const Icon = theme.icon;

            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={cn(
                  'relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-200 group text-left',
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/40 bg-white/[0.07] shadow-lg shadow-amber-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]'
                )}
              >
                {/* Top Badge & Active Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider',
                      isSelected
                        ? 'bg-amber-400 text-ink-950 shadow-sm'
                        : 'bg-white/10 text-mist-300'
                    )}
                  >
                    {theme.badge}
                  </span>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-ink-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-mist-400 group-hover:text-mist-200 transition-colors">
                      Select
                    </span>
                  )}
                </div>

                {/* Theme Name & Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', isSelected ? 'text-amber-400' : 'text-mist-300')} />
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {theme.name}
                    </h3>
                  </div>
                  <p className="text-xs text-mist-300 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Color Palette Swatches Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
                    Color Palette
                  </span>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/40 border border-white/5">
                    {theme.swatches.map((swatch, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-6 rounded-md border border-white/15 relative group/swatch"
                        style={{ backgroundColor: swatch.color }}
                        title={`${swatch.label}: ${swatch.color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Mini Component UI Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
                    Preview
                  </span>
                  <div
                    className="rounded-xl overflow-hidden border p-2.5 space-y-2 text-[11px] shadow-inner"
                    style={{
                      backgroundColor: theme.id === 'classic' ? '#0B1426' : theme.id === 'emerald' ? '#F5F0E5' : '#F3E8D5',
                      borderColor: theme.cardBorder,
                    }}
                  >
                    {/* Mini Header */}
                    <div
                      className="px-2.5 py-1.5 rounded-lg flex items-center justify-between shadow-sm"
                      style={{
                        backgroundColor: theme.headerBg,
                        color: theme.headerText,
                      }}
                    >
                      <span className="font-bold text-[10px] tracking-tight">The Grand ADP</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                        style={{
                          backgroundColor: theme.accentBg,
                          color: theme.accentText,
                        }}
                      >
                        Home
                      </span>
                    </div>

                    {/* Mini Service Tile */}
                    <div
                      className="p-2 rounded-lg border flex items-center gap-2"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                        color: theme.cardText,
                      }}
                    >
                      <div
                        className="h-5 w-5 rounded grid place-items-center text-[9px] shrink-0 font-bold"
                        style={{
                          backgroundColor: theme.id === 'classic' ? '#FBBF24' : theme.id === 'emerald' ? '#103E32' : '#74172F',
                          color: theme.id === 'classic' ? '#0B1426' : '#FFFFFF',
                        }}
                      >
                        ✓
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[10px] truncate">Quick Service</div>
                        <div className="text-[8px] opacity-70 truncate">Luxury Resort Care</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Select Theme Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTheme(theme.id);
                  }}
                  className={cn(
                    'w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm',
                    isSelected
                      ? 'bg-amber-400 text-ink-950 hover:bg-amber-300'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Active Theme</span>
                    </>
                  ) : (
                    <span>Select {theme.name}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-between text-[11px] text-mist-400 border-t border-white/10 pt-4">
          <p>Theme switches instantly and saves automatically for your room stay.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

