import type { StayRecord, Tone } from '@/types/demo';

/** Room QR pass helpers (frontend demo). Credentials are stored on the stay once set; until then a stable demo value is derived. */

export const CHECKOUT_TIME = '11:00';
export const DEMO_PIN_FALLBACK = '0000';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'guest';

export interface PassCredentials {
  email: string;
  phone: string;
  pin: string;
}

export function passCredentials(stay: StayRecord): PassCredentials {
  const n = 9000000000 + (hash(`${stay.id}:phone`) % 999999999);
  const digits = String(n);
  return {
    email: stay.guestEmail ?? `${slug(stay.guest)}@example.com`,
    phone: stay.guestPhone ?? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
    pin: stay.accessPin ?? String(1000 + (hash(`${stay.id}:pin`) % 9000)),
  };
}

export function newPin(current: string): string {
  let next = current;
  while (next === current) next = String(1000 + Math.floor(Math.random() * 9000));
  return next;
}

export function passStatus(stay: StayRecord): { label: string; tone: Tone; active: boolean } {
  if (stay.status === 'in_house') return { label: 'Active', tone: 'success', active: true };
  if (stay.status === 'checked_out') return { label: 'Expired', tone: 'neutral', active: false };
  return { label: 'Not active yet', tone: 'info', active: false };
}

export const validUntil = (stay: StayRecord) => `${stay.departure} · ${CHECKOUT_TIME}`;
