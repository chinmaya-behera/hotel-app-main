/**
 * Public-website booking logic (FRONTEND ONLY, SIMULATED).
 *
 * Pure reducers over the shared in-browser demo state, in the same style as src/lib/frontDesk.ts:
 * each takes the current state and returns the next state plus a toast message, or an error.
 * There is no network, database, payment processor or PMS here. Availability, prices, payment
 * outcomes and confirmations are all demo behaviour.
 *
 * How it connects to staff roles:
 *  - A confirmed booking adds a StayRecord to the Front Desk (Stays tab, Rooms board, check-in rules).
 *  - If the simulated PMS is not healthy, payment is captured but the booking stays "pending
 *    confirmation" and a SyncIssue appears in Front Desk > Reconcile (the F14 flow in frontDesk.ts).
 *  - Room availability reads the same room readiness / out-of-order state Front Desk and Housekeeping change.
 *  - Cancellations and price reductions create a refund request in the Finance queue (never auto-approved).
 */
import {
  EARLY_CHECKIN_FEE,
  FREE_CANCEL_DAYS,
  MAX_NIGHTS,
  ROOMS,
  priceStay,
  roomByNo,
  roomTypeById,
  round2,
  type RoomUnit,
} from './hotelCatalog.ts';
import type { BookingPricing, DemoState, StayRecord, SyncIssue, WebBooking, WorkItem } from '../types/demo.ts';
import type { FdResult } from './frontDesk.ts';

/* --------------------------------------------------------------------- */
/* Dates (anchored to the demo's "today" so the seeded stays line up)    */
/* --------------------------------------------------------------------- */

export const DEMO_TODAY = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
const DEMO_YEAR = 2026;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: string): boolean {
  if (!ISO_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/** "Fri 23 Oct", the same label style the seeded stays use. */
export function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`;
}

export function fmtLong(iso: string): string {
  return `${fmtDay(iso)} ${new Date(`${iso}T00:00:00Z`).getUTCFullYear()}`;
}

/** Reads "Fri 23 Oct" or "Wed 21 Oct · 14:00" back into an ISO date (demo year). */
export function parseDemoDay(label?: string): string | null {
  if (!label) return null;
  const m = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.exec(label);
  if (!m) return null;
  return `${DEMO_YEAR}-${String(MO.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/* --------------------------------------------------------------------- */
/* Search query (shared by the home search, explorer, detail and booking) */
/* --------------------------------------------------------------------- */

export interface StayQuery {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export const MAX_ADULTS = 6;
export const MAX_CHILDREN = 4;

export function defaultQuery(): StayQuery {
  return { checkIn: DEMO_TODAY, checkOut: addDays(DEMO_TODAY, 2), adults: 2, children: 0 };
}

export function parseQuery(sp: { get(name: string): string | null }): StayQuery {
  const d = defaultQuery();
  const ci = sp.get('in');
  const co = sp.get('out');
  const adults = Number(sp.get('adults'));
  const children = Number(sp.get('children'));
  const checkIn = ci && isIsoDate(ci) ? ci : d.checkIn;
  return {
    checkIn,
    checkOut: co && isIsoDate(co) ? co : addDays(checkIn, 2),
    adults: Number.isInteger(adults) && adults >= 1 && adults <= MAX_ADULTS ? adults : d.adults,
    children: Number.isInteger(children) && children >= 0 && children <= MAX_CHILDREN ? children : 0,
  };
}

export function queryToParams(q: StayQuery, extra?: Record<string, string | undefined>): string {
  const p = new URLSearchParams({ in: q.checkIn, out: q.checkOut, adults: String(q.adults), children: String(q.children) });
  Object.entries(extra ?? {}).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  return p.toString();
}

export function validateDates(checkIn: string, checkOut: string): string | null {
  if (!isIsoDate(checkIn)) return 'Choose a check-in date.';
  if (!isIsoDate(checkOut)) return 'Choose a check-out date.';
  if (checkIn < DEMO_TODAY) return 'Check-in cannot be in the past.';
  if (checkOut <= checkIn) return 'Check-out must be after check-in.';
  if (nightsBetween(checkIn, checkOut) > MAX_NIGHTS) return `Online stays are limited to ${MAX_NIGHTS} nights.`;
  return null;
}

export function validateGuests(adults: number, children: number): string | null {
  if (!Number.isInteger(adults) || adults < 1) return 'At least one adult is needed.';
  if (adults > MAX_ADULTS) return `Up to ${MAX_ADULTS} adults per search.`;
  if (!Number.isInteger(children) || children < 0) return 'Children cannot be negative.';
  if (children > MAX_CHILDREN) return `Up to ${MAX_CHILDREN} children per search.`;
  return null;
}

export function queryError(q: StayQuery): string | null {
  return validateDates(q.checkIn, q.checkOut) ?? validateGuests(q.adults, q.children);
}

export function validateContact(g: { name: string; email: string; phone: string }): string | null {
  if (g.name.trim().length < 2 || !/[a-zA-Z]/.test(g.name)) return 'Enter the guest name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g.email.trim())) return 'Enter a valid email address.';
  if (g.phone.replace(/\D/g, '').length < 7) return 'Enter a phone number with at least 7 digits.';
  return null;
}

/* --------------------------------------------------------------------- */
/* Simulated card (nothing is stored except a masked token)              */
/* --------------------------------------------------------------------- */

export const DEMO_CARD = '4242 4242 4242 4242';
export const DECLINE_CARD = '4000 0000 0000 0002';

export function luhnOk(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function validExpiry(v: string): boolean {
  const m = /^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/.exec(v.trim());
  if (!m) return false;
  const yy = Number(m[2]);
  const mm = Number(m[1]);
  return yy > 26 || (yy === 26 && mm >= 10);
}

export type CardOutcome = { ok: true; mask: string } | { ok: false; message: string };

/** Pretends to charge the card. Only the last four digits ever leave this function. */
export function simulateCardCharge(raw: string): CardOutcome {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19 || !luhnOk(digits)) return { ok: false, message: 'That card number does not look valid. Check the digits and try again.' };
  if (digits === DECLINE_CARD.replace(/\s/g, '')) {
    return { ok: false, message: 'Your card was declined (simulated test card). No charge was made. Try a different card or contact your bank.' };
  }
  return { ok: true, mask: `•••• ${digits.slice(-4)}` };
}

export function makeBookingRef(): string {
  return `GA-${Math.floor(100000 + Math.random() * 900000)}`;
}

/* --------------------------------------------------------------------- */
/* Availability (reads the same room readiness the staff roles change)   */
/* --------------------------------------------------------------------- */

export type UnavailableReason = 'out_of_order' | 'reserved' | 'pending' | 'occupied';

export interface Availability {
  available: boolean;
  reason?: UnavailableReason;
  label: string;
  /** vacant and inspected right now (matters for same-day arrival) */
  readyNow: boolean;
  /** note shown when a same-day arrival still needs housekeeping */
  prep?: string;
}

/** [arrival, departure) in ISO dates for a stay record. */
export function stayInterval(st: StayRecord): [string, string] {
  let dep = st.departureDate ?? parseDemoDay(st.departure) ?? addDays(DEMO_TODAY, Math.max(1, st.nights));
  let arr = st.arrivalDate ?? parseDemoDay(st.arrival) ?? addDays(dep, -Math.max(1, st.nights));
  if (st.status === 'in_house' && arr > DEMO_TODAY) arr = DEMO_TODAY;
  if (dep <= arr) dep = addDays(arr, 1);
  return [arr, dep];
}

export function roomAvailability(s: DemoState, roomNo: string, checkIn: string, checkOut: string, excludeRef?: string): Availability {
  const rec = s.frontDesk.rooms.find((r) => r.no === roomNo);
  if (!rec) return { available: false, reason: 'out_of_order', label: 'Not in inventory', readyNow: false };
  if (rec.readiness === 'out_of_order') return { available: false, reason: 'out_of_order', label: 'Out of order', readyNow: false };

  const overlaps = (a: string, b: string) => checkIn < b && checkOut > a;

  for (const b of s.bookings) {
    if (b.ref === excludeRef || b.status === 'cancelled') continue;
    const stay = s.frontDesk.stays.find((st) => st.bookingRef === b.ref);
    if (stay?.status === 'checked_out') continue;
    if ((stay?.room ?? b.room) !== roomNo) continue;
    if (overlaps(b.checkIn, b.checkOut)) {
      const pending = b.status === 'pending_confirmation';
      return { available: false, reason: pending ? 'pending' : 'reserved', label: pending ? 'Pending confirmation' : 'Reserved', readyNow: false };
    }
  }

  for (const st of s.frontDesk.stays) {
    if (st.room !== roomNo || st.status === 'checked_out' || st.bookingRef) continue;
    const [a, b] = stayInterval(st);
    if (overlaps(a, b)) {
      const inHouse = st.status === 'in_house';
      return { available: false, reason: inHouse ? 'occupied' : 'reserved', label: inHouse ? 'Occupied' : 'Reserved', readyNow: false };
    }
  }

  // Demo model: an occupied room with no stay record keeps its guest for 1 to 3 more nights.
  const hasStay = s.frontDesk.stays.some((st) => st.room === roomNo && st.status !== 'checked_out');
  if (rec.occupied && !hasStay) {
    const until = addDays(DEMO_TODAY, 1 + (Number(roomNo) % 3));
    if (checkIn < until) return { available: false, reason: 'occupied', label: 'Reserved', readyNow: false };
  }

  const readyNow = rec.readiness === 'ready' && !rec.occupied;
  return {
    available: true,
    label: 'Available',
    readyNow,
    prep: checkIn === DEMO_TODAY && !readyNow ? 'Housekeeping will prepare this room before arrival' : undefined,
  };
}

export function availableRoomsOfType(s: DemoState, typeId: string, checkIn: string, checkOut: string, excludeRef?: string): RoomUnit[] {
  return ROOMS.filter((r) => r.typeId === typeId && roomAvailability(s, r.no, checkIn, checkOut, excludeRef).available);
}

/** A guest-chosen room is never swapped silently; otherwise prefer rooms that are ready now. */
export function pickRoom(s: DemoState, typeId: string, checkIn: string, checkOut: string, preferred?: string, excludeRef?: string): RoomUnit | null {
  if (preferred) {
    const r = roomByNo[preferred];
    return r && r.typeId === typeId && roomAvailability(s, r.no, checkIn, checkOut, excludeRef).available ? r : null;
  }
  const list = availableRoomsOfType(s, typeId, checkIn, checkOut, excludeRef);
  list.sort((a, b) => {
    const ra = roomAvailability(s, a.no, checkIn, checkOut, excludeRef).readyNow ? 0 : 1;
    const rb = roomAvailability(s, b.no, checkIn, checkOut, excludeRef).readyNow ? 0 : 1;
    return ra - rb || a.no.localeCompare(b.no);
  });
  return list[0] ?? null;
}

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;

function feedWith(s: DemoState, role: string, text: string): DemoState['feed'] {
  return [{ id: uid('web'), at: nowLabel(), role, text }, ...s.feed].slice(0, 30);
}

export function chargesFrom(p: BookingPricing, typeName: string): Array<{ label: string; amount: number }> {
  return [
    { label: `Room charge · ${typeName} (${p.nights} night${p.nights === 1 ? '' : 's'})`, amount: p.roomSubtotal },
    { label: 'Resort fee', amount: p.resortFee },
    { label: 'Taxes & service charge', amount: p.taxes },
  ];
}

export function stayFromBooking(b: WebBooking): StayRecord {
  const pre = b.preArrival.status;
  return {
    id: b.stayId,
    room: b.room,
    guest: b.guest.name,
    roomType: b.roomTypeName,
    arrival: `${fmtDay(b.checkIn)} · ${b.preArrival.arrivalTime ?? '14:00'}`,
    departure: fmtDay(b.checkOut),
    nights: b.pricing.nights,
    status: 'expected',
    preCheckIn: pre === 'verified' ? 'verified' : pre === 'submitted' ? 'pending_verify' : 'none',
    idChecked: pre === 'verified',
    paid: 0,
    cardMask: b.payment.mask,
    bookingRef: b.ref,
    arrivalDate: b.checkIn,
    departureDate: b.checkOut,
    charges: chargesFrom(b.pricing, b.roomTypeName),
    prepaid: b.payment.amount,
    guests: b.adults + b.children,
  };
}

export type BookingStage = 'pending' | 'upcoming' | 'checked_in' | 'checked_out' | 'cancelled';

export function bookingStage(s: DemoState, b: WebBooking): BookingStage {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'pending_confirmation') return 'pending';
  const st = s.frontDesk.stays.find((x) => x.bookingRef === b.ref);
  if (st?.status === 'in_house') return 'checked_in';
  if (st?.status === 'checked_out') return 'checked_out';
  return 'upcoming';
}

/** The room the guest is really in (Front Desk may have moved them). */
export function currentRoom(s: DemoState, b: WebBooking): string {
  return s.frontDesk.stays.find((st) => st.bookingRef === b.ref)?.room ?? b.room;
}

function refundItem(title: string, b: WebBooking, amount: number, chip: string): WorkItem {
  return {
    id: uid('refund'),
    title,
    meta: `Requested via website · ${b.guest.name} · Card ${b.payment.mask}`,
    status: 'Pending approval',
    chip,
    tone: 'warning',
    amount,
  };
}

/* --------------------------------------------------------------------- */
/* Create                                                                */
/* --------------------------------------------------------------------- */

export interface BookingInput {
  /** generated once per booking attempt so a double submit cannot create two bookings */
  ref: string;
  typeId: string;
  roomNo?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guest: { name: string; email: string; phone: string };
  requests?: string;
  cardMask: string;
}

export function createBooking(s: DemoState, input: BookingInput): FdResult {
  if (s.bookings.some((b) => b.ref === input.ref)) return { error: 'This booking was already submitted. Open Manage booking to see it.' };
  const type = roomTypeById[input.typeId];
  if (!type) return { error: 'Choose a room type.' };
  const err = validateDates(input.checkIn, input.checkOut) ?? validateGuests(input.adults, input.children) ?? validateContact(input.guest);
  if (err) return { error: err };
  if (input.adults + input.children > type.maxGuests) return { error: `${type.name} sleeps up to ${type.maxGuests} guests.` };
  if (input.adults > type.maxAdults) return { error: `${type.name} takes up to ${type.maxAdults} adults.` };
  if ((s.integrations.pay ?? 'healthy') === 'down') {
    return { error: 'The payment provider is unavailable (simulated). No charge was made. Please try again shortly.' };
  }

  const room = pickRoom(s, type.id, input.checkIn, input.checkOut, input.roomNo);
  if (!room) {
    return { error: input.roomNo ? `Room ${input.roomNo} is no longer available for these dates. Choose another room.` : `${type.name} is no longer available for these dates.` };
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const pricing = priceStay(type.rate, nights);
  const pmsOk = (s.integrations.pms ?? 'healthy') === 'healthy';
  const created = nowLabel();
  const guest = { name: input.guest.name.trim(), email: input.guest.email.trim(), phone: input.guest.phone.trim() };

  const booking: WebBooking = {
    ref: input.ref,
    status: pmsOk ? 'confirmed' : 'pending_confirmation',
    roomType: type.id,
    roomTypeName: type.name,
    room: room.no,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.children,
    guest,
    requests: input.requests?.trim() || undefined,
    pricing,
    payment: { mask: input.cardMask, amount: pricing.total, state: 'captured' },
    createdAt: created,
    history: [
      { at: created, text: 'Booking received from the website. Payment captured (simulated).' },
      pmsOk
        ? { at: created, text: 'Confirmed in the PMS. Front Desk can see the arrival.' }
        : { at: created, text: 'PMS sync failed. Held for Front Desk reconciliation, payment is not charged twice.' },
    ],
    stayId: `stay-${input.ref}`,
    preArrival: { status: 'none' },
  };

  const issue: SyncIssue = {
    id: uid('sync'),
    bookingRef: input.ref,
    guest: guest.name,
    amount: pricing.total,
    cardMask: input.cardMask,
    detail: `${type.name} · ${fmtDay(input.checkIn)} · ${nights} night${nights === 1 ? '' : 's'}`,
    paymentState: 'Payment_Captured',
    bookingState: 'PMS_Sync_Failed',
  };

  return {
    next: {
      ...s,
      bookings: [booking, ...s.bookings],
      frontDesk: {
        ...s.frontDesk,
        stays: pmsOk ? [...s.frontDesk.stays, stayFromBooking(booking)] : s.frontDesk.stays,
        sync: pmsOk ? s.frontDesk.sync : [issue, ...s.frontDesk.sync],
      },
      feed: feedWith(
        s,
        'Website',
        pmsOk
          ? `Web booking ${input.ref} · ${guest.name} · ${type.name} · ${fmtDay(input.checkIn)} to ${fmtDay(input.checkOut)}`
          : `Web booking ${input.ref} paid but PMS sync failed · needs reconciliation`,
      ),
    },
    message: pmsOk
      ? `Booking ${input.ref} confirmed (demo). It now appears in Front Desk arrivals.`
      : `Booking ${input.ref} received. Payment captured, PMS confirmation pending (simulated).`,
  };
}

/* --------------------------------------------------------------------- */
/* Cancel                                                                */
/* --------------------------------------------------------------------- */

export interface CancelQuote {
  free: boolean;
  refund: number;
  penalty: number;
  note: string;
}

/** Demo policy: free up to FREE_CANCEL_DAYS before arrival, then the first night is kept. Pending bookings refund in full. */
export function cancellationQuote(b: WebBooking): CancelQuote {
  if (b.status === 'pending_confirmation') {
    return { free: true, refund: b.payment.amount, penalty: 0, note: 'The hotel has not confirmed this booking yet, so you are refunded in full.' };
  }
  const free = nightsBetween(DEMO_TODAY, b.checkIn) >= FREE_CANCEL_DAYS;
  const firstNight = priceStay(b.pricing.nightlyRate, 1).total;
  const penalty = free ? 0 : Math.min(firstNight, b.payment.amount);
  return {
    free,
    penalty,
    refund: round2(b.payment.amount - penalty),
    note: free ? `Free cancellation (more than ${FREE_CANCEL_DAYS} days before arrival).` : `Inside ${FREE_CANCEL_DAYS} days of arrival the first night is kept.`,
  };
}

export function cancelBooking(s: DemoState, ref: string): FdResult {
  const b = s.bookings.find((x) => x.ref === ref);
  if (!b) return { error: 'Booking not found.' };
  if (b.status === 'cancelled') return { error: 'This booking is already cancelled.' };
  const stay = s.frontDesk.stays.find((st) => st.bookingRef === ref);
  if (stay && stay.status !== 'expected') return { error: 'This stay has already started. Please ask the Front Desk to make changes.' };

  const q = cancellationQuote(b);
  const created = nowLabel();
  const items = q.refund > 0 ? { ...s.items, financial_operator: [refundItem(`Booking cancellation refund · ${ref}`, b, q.refund, 'Website cancellation'), ...s.items.financial_operator] } : s.items;

  return {
    next: {
      ...s,
      items,
      bookings: s.bookings.map((x) =>
        x.ref === ref
          ? {
              ...x,
              status: 'cancelled' as const,
              payment: { ...x.payment, state: q.refund > 0 ? ('refund_requested' as const) : x.payment.state, refund: q.refund },
              history: [...x.history, { at: created, text: q.refund > 0 ? `Cancelled by guest. Refund of $${q.refund.toFixed(2)} sent to Finance for approval.` : 'Cancelled by guest. No refund due under the demo policy.' }],
            }
          : x,
      ),
      frontDesk: {
        ...s.frontDesk,
        stays: s.frontDesk.stays.filter((st) => st.bookingRef !== ref),
        sync: s.frontDesk.sync.map((x) => (x.bookingRef === ref && x.bookingState === 'PMS_Sync_Failed' ? { ...x, bookingState: 'Refund_Requested' as const } : x)),
      },
      feed: feedWith(s, 'Website', `Web booking ${ref} cancelled by guest${q.refund > 0 ? ` · refund $${q.refund.toFixed(2)} requested` : ''}`),
    },
    message: q.refund > 0 ? `Booking ${ref} cancelled. A refund of $${q.refund.toFixed(2)} was sent to Finance for approval.` : `Booking ${ref} cancelled.`,
  };
}

/* --------------------------------------------------------------------- */
/* Modify                                                                */
/* --------------------------------------------------------------------- */

export interface BookingPatch {
  checkIn?: string;
  checkOut?: string;
  guest?: { name: string; email: string; phone: string };
  requests?: string;
}

export function modifyBooking(s: DemoState, ref: string, patch: BookingPatch): FdResult {
  const b = s.bookings.find((x) => x.ref === ref);
  if (!b) return { error: 'Booking not found.' };
  if (b.status === 'cancelled') return { error: 'A cancelled booking cannot be changed.' };
  const stay = s.frontDesk.stays.find((st) => st.bookingRef === ref);
  if (stay && stay.status !== 'expected') return { error: 'This stay has already started. Please ask the Front Desk to make changes.' };
  const type = roomTypeById[b.roomType];
  if (!type) return { error: 'Room type not found.' };

  const guest = patch.guest ?? b.guest;
  const contactErr = validateContact(guest);
  if (contactErr) return { error: contactErr };

  const checkIn = patch.checkIn ?? b.checkIn;
  const checkOut = patch.checkOut ?? b.checkOut;
  const datesChanged = checkIn !== b.checkIn || checkOut !== b.checkOut;
  const created = nowLabel();
  let room = b.room;
  let pricing = b.pricing;
  let diff = 0;
  const notes: string[] = [];

  if (datesChanged) {
    const dErr = validateDates(checkIn, checkOut);
    if (dErr) return { error: dErr };
    const current = stay?.room ?? b.room;
    if (roomAvailability(s, current, checkIn, checkOut, ref).available) {
      room = current;
    } else {
      const alt = pickRoom(s, type.id, checkIn, checkOut, undefined, ref);
      if (!alt) return { error: `${type.name} is not available for ${fmtDay(checkIn)} to ${fmtDay(checkOut)}. Try other dates.` };
      room = alt.no;
      notes.push(`Moved to Room ${alt.no} for the new dates`);
    }
    pricing = priceStay(type.rate, nightsBetween(checkIn, checkOut));
    diff = round2(pricing.total - b.pricing.total);
    if (diff > 0 && (s.integrations.pay ?? 'healthy') === 'down') {
      return { error: 'The payment provider is unavailable (simulated), so a price increase cannot be charged right now. Please try again shortly.' };
    }
    notes.push(`Dates changed to ${fmtDay(checkIn)} to ${fmtDay(checkOut)}`);
    if (diff > 0) notes.push(`additional $${diff.toFixed(2)} charged to card ${b.payment.mask} (simulated)`);
    if (diff < 0) notes.push(`$${Math.abs(diff).toFixed(2)} difference sent to Finance as a refund request`);
  }
  if (patch.guest && (guest.name !== b.guest.name || guest.email !== b.guest.email || guest.phone !== b.guest.phone)) notes.push('Contact details updated');
  if (patch.requests !== undefined && patch.requests.trim() !== (b.requests ?? '')) notes.push('Special requests updated');
  if (notes.length === 0) return { error: 'Nothing was changed.' };

  const updated: WebBooking = {
    ...b,
    room,
    checkIn,
    checkOut,
    guest: { name: guest.name.trim(), email: guest.email.trim(), phone: guest.phone.trim() },
    requests: patch.requests !== undefined ? patch.requests.trim() || undefined : b.requests,
    pricing,
    payment: { ...b.payment, amount: round2(b.payment.amount + diff) },
    history: [...b.history, { at: created, text: `${notes.join('. ')}.` }],
  };

  const items = diff < 0 ? { ...s.items, financial_operator: [refundItem(`Booking date-change refund · ${ref}`, b, Math.abs(diff), 'Website change'), ...s.items.financial_operator] } : s.items;

  return {
    next: {
      ...s,
      items,
      bookings: s.bookings.map((x) => (x.ref === ref ? updated : x)),
      frontDesk: {
        ...s.frontDesk,
        stays: s.frontDesk.stays.map((st) => (st.bookingRef === ref ? { ...stayFromBooking(updated), preCheckIn: st.preCheckIn, idChecked: st.idChecked, earlyCheckIn: st.earlyCheckIn, arrival: `${fmtDay(checkIn)} · ${updated.preArrival.arrivalTime ?? '14:00'}` } : st)),
        sync: s.frontDesk.sync.map((x) => (x.bookingRef === ref && x.bookingState === 'PMS_Sync_Failed' ? { ...x, amount: updated.payment.amount, detail: `${type.name} · ${fmtDay(checkIn)} · ${pricing.nights} night${pricing.nights === 1 ? '' : 's'}` } : x)),
      },
      feed: feedWith(s, 'Website', `Web booking ${ref} changed by guest · ${notes[0]}`),
    },
    message: `Booking ${ref} updated. ${notes.join('. ')}.`,
  };
}

/* --------------------------------------------------------------------- */
/* Pre-arrival (F08 from the guest side) and early check-in (F09)         */
/* --------------------------------------------------------------------- */

export const ARRIVAL_TIMES = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export function submitPreArrival(s: DemoState, ref: string, arrivalTime: string, consent: boolean): FdResult {
  const b = s.bookings.find((x) => x.ref === ref);
  if (!b || b.status !== 'confirmed') return { error: 'Pre-arrival check-in opens once the booking is confirmed.' };
  const stay = s.frontDesk.stays.find((st) => st.bookingRef === ref);
  if (!stay || stay.status !== 'expected') return { error: 'Pre-arrival check-in is only for upcoming stays.' };
  if (b.preArrival.status !== 'none') return { error: 'Pre-arrival details were already sent. Front Desk will verify your ID on arrival.' };
  if (!ARRIVAL_TIMES.includes(arrivalTime)) return { error: 'Choose your expected arrival time.' };
  if (!consent) return { error: 'Please confirm the registration consent to continue.' };
  const created = nowLabel();
  return {
    next: {
      ...s,
      bookings: s.bookings.map((x) => (x.ref === ref ? { ...x, preArrival: { status: 'submitted' as const, arrivalTime }, history: [...x.history, { at: created, text: `Pre-arrival details sent. Arrival around ${arrivalTime}. Front Desk verifies ID on arrival.` }] } : x)),
      frontDesk: {
        ...s.frontDesk,
        stays: s.frontDesk.stays.map((st) => (st.bookingRef === ref ? { ...st, preCheckIn: 'pending_verify' as const, arrival: `${fmtDay(b.checkIn)} · ${arrivalTime}` } : st)),
      },
      feed: feedWith(s, 'Website', `Pre-arrival check-in submitted · ${b.guest.name} · ${ref}`),
    },
    message: 'Pre-arrival details sent. Front Desk will verify your ID when you arrive.',
  };
}

export function requestEarlyCheckIn(s: DemoState, ref: string): FdResult {
  const b = s.bookings.find((x) => x.ref === ref);
  if (!b || b.status !== 'confirmed') return { error: 'Early check-in can be requested once the booking is confirmed.' };
  const stay = s.frontDesk.stays.find((st) => st.bookingRef === ref);
  if (!stay || stay.status !== 'expected') return { error: 'Early check-in is only for upcoming stays.' };
  if (b.checkIn !== DEMO_TODAY) return { error: 'Early check-in can be requested on your day of arrival.' };
  if (stay.earlyCheckIn) return { error: 'You already requested early check-in.' };
  const created = nowLabel();
  return {
    next: {
      ...s,
      bookings: s.bookings.map((x) => (x.ref === ref ? { ...x, history: [...x.history, { at: created, text: `Early check-in requested (fee $${EARLY_CHECKIN_FEE}). Front Desk decides once the room is inspected and ready.` }] } : x)),
      frontDesk: { ...s.frontDesk, stays: s.frontDesk.stays.map((st) => (st.bookingRef === ref ? { ...st, earlyCheckIn: { fee: EARLY_CHECKIN_FEE, status: 'pending' as const } } : st)) },
      feed: feedWith(s, 'Website', `Early check-in requested · ${b.guest.name} · Room ${stay.room}`),
    },
    message: `Early check-in requested ($${EARLY_CHECKIN_FEE}). Front Desk will confirm when the room is ready.`,
  };
}

/* --------------------------------------------------------------------- */
/* Called by Front Desk reconciliation (F14) so the guest sees the result */
/* --------------------------------------------------------------------- */

export function settleBookingFromSync(s: DemoState, ref: string, outcome: 'confirmed' | 'cancelled'): DemoState {
  const b = s.bookings.find((x) => x.ref === ref);
  if (!b) return s;
  const created = nowLabel();
  if (outcome === 'confirmed') {
    const confirmed: WebBooking = { ...b, status: 'confirmed', history: [...b.history, { at: created, text: 'Confirmed by Front Desk after PMS reconciliation.' }] };
    const hasStay = s.frontDesk.stays.some((st) => st.bookingRef === ref);
    return {
      ...s,
      bookings: s.bookings.map((x) => (x.ref === ref ? confirmed : x)),
      frontDesk: { ...s.frontDesk, stays: hasStay ? s.frontDesk.stays : [...s.frontDesk.stays, stayFromBooking(confirmed)] },
    };
  }
  return {
    ...s,
    bookings: s.bookings.map((x) =>
      x.ref === ref
        ? { ...x, status: 'cancelled' as const, payment: { ...x.payment, state: 'refund_requested' as const, refund: x.payment.amount }, history: [...x.history, { at: created, text: 'Booking could not be confirmed. Full refund sent to Finance for approval.' }] }
        : x,
    ),
    frontDesk: { ...s.frontDesk, stays: s.frontDesk.stays.filter((st) => st.bookingRef !== ref) },
  };
}
