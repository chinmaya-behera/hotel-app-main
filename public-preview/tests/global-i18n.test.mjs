import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Import translation dictionaries directly
import { en } from '../src/lib/i18n/dictionaries/en.ts';
import { hi } from '../src/lib/i18n/dictionaries/hi.ts';
import { or } from '../src/lib/i18n/dictionaries/or.ts';
import { getTranslation, DICTIONARIES } from '../src/lib/i18n/dictionaries/index.ts';
import { formatMoney, formatDate, formatTime, formatNumber } from '../src/lib/i18n/formatters.ts';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types.ts';

describe('GLOBAL-I18N-01: Multilingual Platform Infrastructure', () => {
  test('SUPPORTED_LOCALES contains exclusively Indian languages with native names', () => {
    assert.ok(SUPPORTED_LOCALES.length >= 22);
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    assert.ok(codes.includes('en'));
    assert.ok(codes.includes('hi'));
    assert.ok(codes.includes('or'));
    assert.ok(codes.includes('bn'));
    assert.ok(codes.includes('te'));
    assert.ok(codes.includes('ta'));
    assert.ok(codes.includes('mr'));
    assert.ok(codes.includes('gu'));
    assert.ok(codes.includes('kn'));
    assert.ok(codes.includes('ml'));
    assert.ok(codes.includes('pa'));
    assert.ok(codes.includes('as'));
    assert.ok(codes.includes('ur'));
    assert.ok(codes.includes('sa'));

    // Verify NO outside India languages are included
    assert.ok(!codes.includes('es'), 'Spanish must not be included');
    assert.ok(!codes.includes('fr'), 'French must not be included');
    assert.ok(!codes.includes('de'), 'German must not be included');
    assert.ok(!codes.includes('ru'), 'Russian must not be included');
    assert.ok(!codes.includes('ja'), 'Japanese must not be included');

    const enMeta = SUPPORTED_LOCALES.find((l) => l.code === 'en');
    assert.equal(enMeta?.nativeName, 'English');

    const hiMeta = SUPPORTED_LOCALES.find((l) => l.code === 'hi');
    assert.equal(hiMeta?.nativeName, 'हिन्दी');

    const orMeta = SUPPORTED_LOCALES.find((l) => l.code === 'or');
    assert.equal(orMeta?.nativeName, 'ଓଡ଼ିଆ');
  });

  test('DICTIONARIES contains en, hi, and or', () => {
    assert.ok(DICTIONARIES.en);
    assert.ok(DICTIONARIES.hi);
    assert.ok(DICTIONARIES.or);
  });

  test('100% Namespace & Key Parity between English and Hindi', () => {
    const enNamespaces = Object.keys(en);
    const hiNamespaces = Object.keys(hi);

    assert.deepEqual(
      hiNamespaces.sort(),
      enNamespaces.sort(),
      'Hindi must have identical namespaces to English',
    );

    for (const ns of enNamespaces) {
      const enKeys = Object.keys(en[ns]);
      const hiKeys = Object.keys(hi[ns]);

      const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
      assert.deepEqual(
        missingInHi,
        [],
        `Namespace "${ns}" in Hindi is missing keys: ${missingInHi.join(', ')}`,
      );

      for (const k of enKeys) {
        const val = hi[ns][k];
        assert.ok(
          typeof val === 'string' && val.trim().length > 0,
          `Hindi key "${ns}.${k}" must be a non-empty string`,
        );
      }
    }
  });

  test('100% Namespace & Key Parity between English and Odia', () => {
    const enNamespaces = Object.keys(en);
    const orNamespaces = Object.keys(or);

    assert.deepEqual(
      orNamespaces.sort(),
      enNamespaces.sort(),
      'Odia must have identical namespaces to English',
    );

    for (const ns of enNamespaces) {
      const enKeys = Object.keys(en[ns]);
      const orKeys = Object.keys(or[ns]);

      const missingInOr = enKeys.filter((k) => !orKeys.includes(k));
      assert.deepEqual(
        missingInOr,
        [],
        `Namespace "${ns}" in Odia is missing keys: ${missingInOr.join(', ')}`,
      );

      for (const k of enKeys) {
        const val = or[ns][k];
        assert.ok(
          typeof val === 'string' && val.trim().length > 0,
          `Odia key "${ns}.${k}" must be a non-empty string`,
        );
      }
    }
  });

  test('getTranslation resolves keys across languages accurately', () => {
    // English
    assert.equal(getTranslation('en', 'common.save'), 'Save');
    assert.equal(getTranslation('en', 'nav.frontDesk'), 'Front Desk');

    // Hindi
    assert.equal(getTranslation('hi', 'common.save'), 'सहेजें');
    assert.equal(getTranslation('hi', 'nav.frontDesk'), 'फ़्रंट डेस्क');

    // Odia
    assert.equal(getTranslation('or', 'common.save'), 'ସାଇତନ୍ତୁ');
    assert.equal(getTranslation('or', 'nav.frontDesk'), 'ଫ୍ରଣ୍ଟ ଡେସ୍କ');
  });

  test('getTranslation parameter interpolation works correctly', () => {
    // English
    const enWelcome = getTranslation('en', 'guest.welcomeGuest', { name: 'Elena' });
    assert.equal(enWelcome, 'Welcome, Elena');

    // Hindi
    const hiWelcome = getTranslation('hi', 'guest.welcomeGuest', { name: 'Elena' });
    assert.equal(hiWelcome, 'स्वागत है, Elena');

    // Odia
    const orWelcome = getTranslation('or', 'guest.welcomeGuest', { name: 'Elena' });
    assert.equal(orWelcome, 'ସ୍ୱାଗତ, Elena');

    // Room badge interpolation
    assert.equal(getTranslation('en', 'guest.roomBadge', { room: '402' }), 'Room 402');
    assert.equal(getTranslation('hi', 'guest.roomBadge', { room: '402' }), 'कक्ष 402');
    assert.equal(getTranslation('or', 'guest.roomBadge', { room: '402' }), 'ରୁମ୍ 402');
  });

  test('getTranslation fallback to English when key is missing or invalid', () => {
    // Invalid key format returns the raw key
    assert.equal(getTranslation('hi', 'nonexistent_format'), 'nonexistent_format');

    // Nonexistent subkey returns the key string
    assert.equal(getTranslation('hi', 'common.this_does_not_exist'), 'common.this_does_not_exist');
  });

  test('formatMoney formats in INR with ₹ symbol across all locales', () => {
    const enMoney = formatMoney(2500, 'en');
    assert.ok(enMoney.includes('₹'), 'English money format must include ₹');
    assert.ok(enMoney.includes('2,500') || enMoney.includes('2500'), 'Formatted value should contain 2,500');

    const hiMoney = formatMoney(15000, 'hi');
    assert.ok(hiMoney.includes('₹'), 'Hindi money format must include ₹');

    const orMoney = formatMoney(750, 'or');
    assert.ok(orMoney.includes('₹'), 'Odia money format must include ₹');
  });

  test('formatDate and formatTime produce valid non-empty strings', () => {
    const testDate = new Date('2026-11-15T14:30:00Z');

    const enDate = formatDate(testDate, undefined, 'en');
    assert.ok(enDate.length > 0);

    const hiDate = formatDate(testDate, undefined, 'hi');
    assert.ok(hiDate.length > 0);

    const orDate = formatDate(testDate, undefined, 'or');
    assert.ok(orDate.length > 0);

    const enTime = formatTime(testDate, 'en');
    assert.ok(enTime.length > 0);
  });

  test('formatNumber formats numbers properly', () => {
    const enNum = formatNumber(123456, 'en');
    assert.ok(enNum.length > 0);

    const hiNum = formatNumber(123456, 'hi');
    assert.ok(hiNum.length > 0);

    const orNum = formatNumber(123456, 'or');
    assert.ok(orNum.length > 0);
  });
});
