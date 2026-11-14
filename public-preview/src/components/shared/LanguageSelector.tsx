'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Check, ChevronDown, Search, Sparkles } from 'lucide-react';
import { useI18n, SupportedLocale } from '@/lib/i18n';
import { translateWholePage } from '@/components/shared/GoogleTranslate';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface LanguageSelectorProps {
  variant?: 'pill' | 'compact' | 'minimal' | 'header';
  className?: string;
  isLight?: boolean;
}

export function LanguageSelector({
  variant = 'pill',
  className,
  isLight: propIsLight,
}: LanguageSelectorProps) {
  const { locale, setLocale, availableLocales, localeMeta, t } = useI18n();
  const { state } = useDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive light mode from store or prop
  const isLight = propIsLight !== undefined ? propIsLight : state?.theme === 'light';

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (code: SupportedLocale) => {
    setLocale(code);
    translateWholePage(code);
    setIsOpen(false);
  };

  const filteredLocales = useMemo(() => {
    if (!searchQuery.trim()) return availableLocales;
    const q = searchQuery.toLowerCase();
    return availableLocales.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [availableLocales, searchQuery]);

  return (
    <div className={cn('relative inline-block text-left notranslate', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Current language: ${localeMeta.nativeName}. Change language.`}
          title={`Language: ${localeMeta.nativeName}`}
          className={cn(
            'flex items-center justify-center gap-1 h-8 px-2 sm:h-9 sm:px-2.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer',
            isLight
              ? 'border-slate-300 bg-[#ffffff] text-slate-800 hover:border-amber-400 hover:bg-amber-50/50'
              : 'border-white/10 bg-white/[0.04] text-mist-200 hover:border-amber-400/40 hover:bg-white/[0.08] hover:text-white',
          )}
        >
          <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden />
          <span className="font-bold text-[11px] sm:text-xs tracking-tight">
            {localeMeta.code.toUpperCase()}
          </span>
          <ChevronDown
            className={cn('h-3 w-3 transition-transform duration-200 text-mist-400', isOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
      ) : variant === 'minimal' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Change language, currently ${localeMeta.nativeName}`}
          title={`Language: ${localeMeta.nativeName}`}
          className={cn(
            'grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl border transition-colors cursor-pointer',
            isLight
              ? 'border-slate-200 bg-[#ffffff] text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              : 'border-white/10 bg-white/[0.04] text-mist-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
          )}
        >
          <Globe className="h-4 w-4 text-amber-400" aria-hidden />
        </button>
      ) : (
        /* Default 'pill' / 'header' variant */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Select language. Currently ${localeMeta.nativeName}`}
          className={cn(
            'flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs cursor-pointer',
            isLight
              ? 'border-slate-200/80 bg-[#ffffff] text-slate-800 hover:border-amber-400/80 hover:bg-amber-50/30'
              : 'border-white/10 bg-white/[0.04] text-mist-200 hover:border-amber-400/40 hover:bg-white/[0.08] hover:text-white',
          )}
        >
          <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden />
          <span className="font-semibold text-xs tracking-wide">
            {localeMeta.nativeName}
          </span>
          <ChevronDown
            className={cn('h-3 w-3 transition-transform duration-200 opacity-60', isOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Indian Languages"
          className={cn(
            'absolute right-0 top-full mt-2 w-72 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95',
            isLight
              ? 'border-slate-200 bg-[#ffffff]/98 text-slate-900 shadow-slate-900/15'
              : 'border-white/15 bg-[#0a1224]/95 text-slate-100 shadow-black/80',
          )}
        >
          {/* Header with Title and Auto-Translate Badge */}
          <div
            className="flex items-center justify-between px-2 py-1.5 border-b mb-2"
            style={{
              borderColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex flex-col">
              <span
                className="text-[11px] font-bold tracking-wide"
                style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
              >
                Indian Languages
              </span>
              <span
                className="text-[9px] font-medium"
                style={{ color: isLight ? '#64748b' : '#94a3b8' }}
              >
                भारतीय भाषाएं (22 Official)
              </span>
            </div>
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isLight ? '#ecfeff' : 'rgba(34, 211, 238, 0.15)',
                color: isLight ? '#0e7490' : '#38bdf8',
                border: isLight ? '1px solid #cffafe' : '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <Sparkles className="h-2.5 w-2.5" /> Full Page
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2 px-1">
            <Search
              className="absolute left-3 top-2.5 h-3.5 w-3.5"
              style={{ color: isLight ? '#94a3b8' : '#64748b' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian language..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all"
              style={{
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                color: isLight ? '#0f172a' : '#f8fafc',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          {/* Language Options List */}
          <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5 scroll-smooth">
            {filteredLocales.length === 0 ? (
              <p
                className="py-4 text-center text-xs"
                style={{ color: isLight ? '#94a3b8' : '#64748b' }}
              >
                No matching Indian languages
              </p>
            ) : (
              filteredLocales.map((item) => {
                const isSelected = item.code === locale;
                return (
                  <button
                    key={item.code}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelect(item.code)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left',
                      isSelected
                        ? isLight
                          ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                          : 'bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30'
                        : isLight
                          ? 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
                          : 'text-mist-200 hover:bg-white/[0.08] hover:text-white',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm shrink-0" aria-hidden>
                        {item.flag}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{item.nativeName}</span>
                        <span
                          className="text-[10px] font-normal leading-tight opacity-75"
                          style={{ color: isLight ? '#64748b' : '#94a3b8' }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-amber-400 shrink-0" aria-hidden />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Info Footer */}
          <div
            className="mt-2 pt-2 border-t px-2 text-[10px] text-center"
            style={{
              borderColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              color: isLight ? '#94a3b8' : '#64748b',
            }}
          >
            Official Languages of India · Live Translation
          </div>
        </div>
      )}
    </div>
  );
}
