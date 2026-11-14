import { DEFAULT_LOCALE } from '../types.ts';
import type { SupportedLocale, TranslationDictionary } from '../types.ts';
import { en } from './en.ts';
import { hi } from './hi.ts';
import { or } from './or.ts';

export const DICTIONARIES: Record<SupportedLocale, TranslationDictionary> = {
  en,
  hi,
  or,
};

/**
 * Resolves a nested key (e.g. 'common.save', 'guest.welcomeGuest')
 * from the dictionary of the specified locale, falling back to English.
 */
export function getTranslation(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split('.');
  if (parts.length !== 2) {
    return key;
  }

  const [namespace, subKey] = parts as [keyof TranslationDictionary, string];

  // 1. Try active locale
  const dict = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
  let text = dict[namespace]?.[subKey];

  // 2. Fall back to English if missing or empty
  if (!text && locale !== DEFAULT_LOCALE) {
    text = DICTIONARIES[DEFAULT_LOCALE][namespace]?.[subKey];
  }

  // 3. Fall back to raw key if completely missing
  if (!text) {
    return key;
  }

  // 4. Parameter interpolation: replace {paramName} with value
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}
