'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  SupportedLocale,
  LocaleMeta,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from './types.ts';
import { getTranslation } from './dictionaries/index.ts';
import {
  formatMoney as fmtMoney,
  formatDate as fmtDate,
  formatTime as fmtTime,
  formatNumber as fmtNumber,
} from './formatters.ts';

export const LOCALE_STORAGE_KEY = 'grand_hotel_locale';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatMoney: (amount: number) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number) => string;
  formatNumber: (value: number) => string;
  availableLocales: LocaleMeta[];
  localeMeta: LocaleMeta;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage after mounting
  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale;
      if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
        setLocaleState(stored);
        document.documentElement.lang = stored;
      } else {
        document.documentElement.lang = DEFAULT_LOCALE;
      }
    } catch {
      // Storage access may be restricted
    }
  }, []);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_STORAGE_KEY && e.newValue) {
        const next = e.newValue as SupportedLocale;
        if (SUPPORTED_LOCALES.some((l) => l.code === next)) {
          setLocaleState(next);
          document.documentElement.lang = next;
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    if (!SUPPORTED_LOCALES.some((l) => l.code === newLocale)) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;

      // Trigger Google Translate on the entire page
      if (typeof window !== 'undefined') {
        window.__applyGoogleTranslate?.(newLocale);
      }
    } catch {
      // Fallback
    }
  };

  const localeMeta = useMemo(() => {
    return SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      return getTranslation(locale, key, params);
    };
  }, [locale]);

  const formatMoney = useMemo(() => {
    return (amount: number) => fmtMoney(amount, locale);
  }, [locale]);

  const formatDate = useMemo(() => {
    return (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      fmtDate(date, options, locale);
  }, [locale]);

  const formatTime = useMemo(() => {
    return (date: Date | string | number) => fmtTime(date, locale);
  }, [locale]);

  const formatNumber = useMemo(() => {
    return (value: number) => fmtNumber(value, locale);
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    formatMoney,
    formatDate,
    formatTime,
    formatNumber,
    availableLocales: SUPPORTED_LOCALES,
    localeMeta,
    dir: localeMeta.direction,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for non-provider renders / testing
    const defaultMeta = SUPPORTED_LOCALES[0];
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) =>
        getTranslation(DEFAULT_LOCALE, key, params),
      formatMoney: (amount: number) => fmtMoney(amount, DEFAULT_LOCALE),
      formatDate: (date, options) => fmtDate(date, options, DEFAULT_LOCALE),
      formatTime: (date) => fmtTime(date, DEFAULT_LOCALE),
      formatNumber: (value) => fmtNumber(value, DEFAULT_LOCALE),
      availableLocales: SUPPORTED_LOCALES,
      localeMeta: defaultMeta,
      dir: defaultMeta.direction,
    };
  }
  return context;
}

export * from './types';
export * from './formatters';
