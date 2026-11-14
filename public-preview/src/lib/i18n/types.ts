export type SupportedLocale =
  | 'en'
  | 'hi'
  | 'or'
  | 'bn'
  | 'te'
  | 'ta'
  | 'mr'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'pa'
  | 'as'
  | 'ur'
  | 'sa'
  | 'mai'
  | 'ne'
  | 'gom'
  | 'sd'
  | 'doi'
  | 'mni-Mtei'
  | 'brx'
  | 'sat'
  | string;

export interface LocaleMeta {
  code: string;
  name: string;
  nativeName: string;
  intlLocale: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

/**
 * Exclusively Indian languages (Official 22 8th Schedule languages of India + Indian English).
 * Zero outside-India languages.
 */
export const SUPPORTED_LOCALES: LocaleMeta[] = [
  {
    code: 'en',
    name: 'English (India)',
    nativeName: 'English',
    intlLocale: 'en-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    intlLocale: 'hi-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    intlLocale: 'or-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    intlLocale: 'bn-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    intlLocale: 'te-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    intlLocale: 'ta-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    intlLocale: 'mr-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    intlLocale: 'gu-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    intlLocale: 'kn-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    intlLocale: 'ml-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    intlLocale: 'pa-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    intlLocale: 'as-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    intlLocale: 'ur-IN',
    direction: 'rtl',
    flag: '🇮🇳',
  },
  {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    intlLocale: 'sa-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    intlLocale: 'mai-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    intlLocale: 'ne-NP',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'gom',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    intlLocale: 'kok-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي / सिंधी',
    intlLocale: 'sd-IN',
    direction: 'rtl',
    flag: '🇮🇳',
  },
  {
    code: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    intlLocale: 'doi-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'mni-Mtei',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোନ୍',
    intlLocale: 'mni-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो',
    intlLocale: 'brx-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  {
    code: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    intlLocale: 'sat-IN',
    direction: 'ltr',
    flag: '🇮🇳',
  },
];

export const DEFAULT_LOCALE: string = 'en';

export interface TranslationDictionary {
  common: Record<string, string>;
  nav: Record<string, string>;
  auth: Record<string, string>;
  hotel: Record<string, string>;
  guest: Record<string, string>;
  frontdesk: Record<string, string>;
  fulfiller: Record<string, string>;
  dispatcher: Record<string, string>;
  manager: Record<string, string>;
  gm: Record<string, string>;
  finance: Record<string, string>;
  security: Record<string, string>;
  admin: Record<string, string>;
  help: Record<string, string>;
  status: Record<string, string>;
}
