import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types.ts';
import type { SupportedLocale } from './types.ts';

function getIntlLocale(locale: SupportedLocale): string {
  const meta = SUPPORTED_LOCALES.find((l) => l.code === locale);
  return meta?.intlLocale || 'en-IN';
}

/**
 * Formats a monetary amount in Indian Rupees (INR, ₹) according to the active locale.
 */
export function formatMoney(amount: number, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const intlLoc = getIntlLocale(locale);
  try {
    return new Intl.NumberFormat(intlLoc, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Formats a date according to the active locale.
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const intlLoc = getIntlLocale(locale);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  try {
    return new Intl.DateTimeFormat(intlLoc, options || defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Formats time according to the active locale.
 */
export function formatTime(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const intlLoc = getIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(intlLoc, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Formats a numeric value according to the active locale.
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const intlLoc = getIntlLocale(locale);
  try {
    return new Intl.NumberFormat(intlLoc).format(value);
  } catch {
    return value.toLocaleString();
  }
}
