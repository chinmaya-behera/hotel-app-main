'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bed,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  HOTEL_NAME,
  POLICIES,
  RESORT_FEE_PER_NIGHT,
  TAX_RATE,
  priceStay,
  roomByNo,
  roomTypeById,
  ROOM_TYPES,
  ROOMS,
} from '@/lib/hotelCatalog';
import {
  DECLINE_CARD,
  DEMO_CARD,
  DEMO_TODAY,
  addDays,
  availableRoomsOfType,
  createBooking,
  makeBookingRef,
  nightsBetween,
  queryError,
  simulateCardCharge,
  validExpiry,
  validateContact,
  type BookingInput,
  type StayQuery,
} from '@/lib/bookings';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import type { WebBooking } from '@/types/demo';

interface BookingWizardModalProps {
  initialTypeId?: string;
  initialRoomNo?: string;
  initialQuery: StayQuery;
  onClose: () => void;
  onManageBooking: (ref: string) => void;
}

type Step = 'room' | 'guest' | 'payment' | 'confirmed';

export function BookingWizardModal({
  initialTypeId,
  initialRoomNo,
  initialQuery,
  onClose,
  onManageBooking,
}: BookingWizardModalProps) {
  const { state, fdAction } = useDemo();

  // Wizard state
  const [step, setStep] = useState<Step>('room');
  const [typeId, setTypeId] = useState<string>(initialTypeId ?? 'deluxe-king');
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | undefined>(initialRoomNo);
  const [checkIn, setCheckIn] = useState(initialQuery.checkIn);
  const [checkOut, setCheckOut] = useState(initialQuery.checkOut);
  const [adults, setAdults] = useState(initialQuery.adults);
  const [children, setChildren] = useState(initialQuery.children);

  // Guest details form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState('');

  // Payment form
  const [cardNumber, setCardNumber] = useState(DEMO_CARD);
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState('');
  const [agreePolicies, setAgreePolicies] = useState(true);

  // Submission results
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef] = useState<string>(() => makeBookingRef());
  const [confirmedBooking, setConfirmedBooking] = useState<WebBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedType = roomTypeById[typeId] ?? ROOM_TYPES[0];
  const nights = nightsBetween(checkIn, checkOut);
  const pricing = priceStay(selectedType.rate, Math.max(1, nights));

  // Current query validation
  const currentQuery: StayQuery = { checkIn, checkOut, adults, children };
  const dateErr = queryError(currentQuery);

  // Available room units of selected type for these dates
  const freeRooms = useMemo(() => {
    return availableRoomsOfType(state, selectedType.id, checkIn, checkOut);
  }, [state, selectedType.id, checkIn, checkOut]);

  // Integration state
  const pmsStatus = state.integrations.pms ?? 'healthy';
  const payStatus = state.integrations.pay ?? 'healthy';

  // Advance from Step 1 (Room)
  const handleProceedToGuest = () => {
    setErrorMessage(null);
    if (dateErr) {
      setErrorMessage(dateErr);
      return;
    }
    if (freeRooms.length === 0) {
      setErrorMessage(`${selectedType.name} is not available for these dates. Please choose another room type or adjust dates.`);
      return;
    }
    if (adults + children > selectedType.maxGuests) {
      setErrorMessage(`${selectedType.name} accommodates up to ${selectedType.maxGuests} guests.`);
      return;
    }
    setStep('guest');
  };

  // Advance from Step 2 (Guest)
  const handleProceedToPayment = () => {
    setErrorMessage(null);
    const contactErr = validateContact({ name, email, phone });
    if (contactErr) {
      setErrorMessage(contactErr);
      return;
    }
    if (!cardHolder) {
      setCardHolder(name);
    }
    setStep('payment');
  };

  // Submit Booking (Step 3)
  const handleCompleteBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreePolicies) {
      setErrorMessage('Please accept the reservation terms and cancellation policy to proceed.');
      return;
    }

    if (payStatus === 'down') {
      setErrorMessage('The simulated payment gateway is currently down (simulated in Platform Admin). No charge was made.');
      return;
    }

    if (!validExpiry(expiry)) {
      setErrorMessage('Card expiry date must be valid (MM/YY) and not in the past.');
      return;
    }

    // Simulate card charge
    const outcome = simulateCardCharge(cardNumber);
    if (!outcome.ok) {
      setErrorMessage(outcome.message);
      return;
    }

    setSubmitting(true);

    const input: BookingInput = {
      ref: bookingRef,
      typeId: selectedType.id,
      roomNo: selectedRoomNo,
      checkIn,
      checkOut,
      adults,
      children,
      guest: { name: name.trim(), email: email.trim(), phone: phone.trim() },
      requests: requests.trim(),
      cardMask: outcome.mask,
    };

    const result = fdAction('createBooking', [input]);

    setSubmitting(false);

    if (result) {
      // Returned an error message
      setErrorMessage(result);
    } else {
      // Succeeded! Find created booking in store
      const created = state.bookings.find((b) => b.ref === bookingRef) ?? {
        ref: bookingRef,
        status: pmsStatus === 'healthy' ? 'confirmed' : 'pending_confirmation',
        roomType: selectedType.id,
        roomTypeName: selectedType.name,
        room: selectedRoomNo ?? freeRooms[0]?.no ?? '302',
        checkIn,
        checkOut,
        adults,
        children,
        guest: { name, email, phone },
        requests,
        pricing,
        payment: { mask: outcome.mask, amount: pricing.total, state: 'captured' },
        createdAt: 'Just now',
        history: [],
        stayId: `stay-${bookingRef}`,
        preArrival: { status: 'none' },
      };
      setConfirmedBooking(created as WebBooking);
      setStep('confirmed');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="fixed inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-ink-900/95 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulated Reservation Engine</span>
            </div>
            <h3 id="booking-modal-title" className="font-display text-2xl font-bold text-white mt-1">
              {step === 'confirmed' ? 'Reservation Confirmed' : `Reserve at ${HOTEL_NAME}`}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Pills (if not confirmed) */}
        {step !== 'confirmed' && (
          <div className="mt-5 flex items-center justify-between text-xs font-semibold border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  step === 'room'
                    ? 'bg-amber-400 text-ink-950'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                1
              </span>
              <span className={step === 'room' ? 'text-white' : 'text-mist-400'}>
                Dates & Room
              </span>
            </div>

            <div className="h-px w-6 sm:w-12 bg-white/10" />

            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  step === 'guest'
                    ? 'bg-amber-400 text-ink-950'
                    : step === 'payment'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-mist-400'
                }`}
              >
                2
              </span>
              <span className={step === 'guest' ? 'text-white' : 'text-mist-400'}>
                Guest Details
              </span>
            </div>

            <div className="h-px w-6 sm:w-12 bg-white/10" />

            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  step === 'payment' ? 'bg-amber-400 text-ink-950' : 'bg-white/10 text-mist-400'
                }`}
              >
                3
              </span>
              <span className={step === 'payment' ? 'text-white' : 'text-mist-400'}>
                Payment & Review
              </span>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* ================= STEP 1: DATES & ROOM ================= */}
        {step === 'room' && (
          <div className="mt-6 space-y-5">
            {/* Stay Dates & Party */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                1. Stay Dates & Guest Count
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Check-in</label>
                  <input
                    type="date"
                    min={DEMO_TODAY}
                    value={checkIn}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckIn(v);
                      if (v >= checkOut) setCheckOut(addDays(v, 2));
                    }}
                    className="field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Check-out ({nights} nights)</label>
                  <input
                    type="date"
                    min={addDays(checkIn, 1)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Adults</label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="field w-full text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Adult{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-mist-300 font-semibold block mb-1">Children</label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="field w-full text-xs"
                  >
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} Child{n !== 1 ? 'ren' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Room Type Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                2. Select Room Type
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROOM_TYPES.map((type) => {
                  const free = availableRoomsOfType(state, type.id, checkIn, checkOut).length;
                  const isSelected = typeId === type.id;
                  const isSoldOut = free === 0;

                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        setTypeId(type.id);
                        setSelectedRoomNo(undefined);
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-white ring-2 ring-amber-400/30'
                          : isSoldOut
                          ? 'opacity-40 border-white/5 bg-white/[0.01] cursor-not-allowed text-mist-500'
                          : 'border-white/10 bg-white/[0.03] text-mist-200 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-amber-300">
                            {type.category}
                          </span>
                          <h5 className="font-display text-base font-bold text-white">{type.name}</h5>
                        </div>
                        <span className="font-display text-base font-bold text-white">
                          ${type.rate}
                          <span className="text-[10px] text-mist-400 font-normal">/n</span>
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-mist-300 line-clamp-1">{type.blurb}</p>

                      <div className="mt-3 flex items-center justify-between text-[11px] border-t border-white/[0.06] pt-2 text-mist-400">
                        <span>{type.bedLabel} · up to {type.maxGuests}</span>
                        {free > 0 ? (
                          <span className="text-emerald-400 font-medium">{free} available</span>
                        ) : (
                          <span className="text-rose-400">Sold out</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Specific Room Unit Selection */}
            {freeRooms.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-mist-200">
                    Specific Room Preference (Optional)
                  </span>
                  <span className="text-[11px] text-mist-400">
                    {freeRooms.length} rooms ready or inspectable
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomNo(undefined)}
                    className={`rounded-xl px-3 py-1.5 font-medium transition ${
                      !selectedRoomNo
                        ? 'bg-amber-400 text-ink-950 font-bold'
                        : 'border border-white/10 text-mist-300 hover:text-white'
                    }`}
                  >
                    Auto-Assign Best Room
                  </button>
                  {freeRooms.map((r) => (
                    <button
                      key={r.no}
                      type="button"
                      onClick={() => setSelectedRoomNo(r.no)}
                      className={`rounded-xl px-3 py-1.5 font-medium transition ${
                        selectedRoomNo === r.no
                          ? 'bg-amber-400 text-ink-950 font-bold'
                          : 'border border-white/10 text-mist-300 hover:text-white'
                      }`}
                    >
                      Room {r.no} (Floor {r.floor})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Summary Strip */}
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Estimated Stay Cost ({nights} nights):</span>
                <p className="text-mist-400 text-[11px]">Includes ${RESORT_FEE_PER_NIGHT}/night resort fee & demo taxes</p>
              </div>
              <span className="font-display text-2xl font-bold text-amber-300">
                {money(pricing.total)}
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="subtle" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="md"
                iconRight={ArrowRight}
                onClick={handleProceedToGuest}
                disabled={freeRooms.length === 0 || Boolean(dateErr)}
              >
                Continue to Guest Details
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: GUEST DETAILS ================= */}
        {step === 'guest' && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">{selectedType.name}</span>
                <p className="text-mist-400 text-[11px]">{checkIn} to {checkOut} ({nights} nights) · {adults} adults{children > 0 ? `, ${children} children` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('room')}
                className="text-amber-300 hover:underline font-semibold"
              >
                Change room
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProceedToPayment();
              }}
              className="space-y-4 text-xs"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Guest & Contact Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-mist-200">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samantha Sterling"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field w-full text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Email Address (for confirmation) *</label>
                  <input
                    type="email"
                    required
                    placeholder="samantha@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field w-full text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2831"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="field w-full text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-mist-200">Special Requests / Preferences</label>
                  <textarea
                    rows={2}
                    placeholder="High floor, quiet wing, extra feather pillows, baby cot..."
                    value={requests}
                    onChange={(e) => setRequests(e.target.value)}
                    className="field w-full text-xs resize-none"
                  />
                  <p className="text-[10px] text-mist-400">Special requests are forwarded to Front Desk & Housekeeping.</p>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="subtle"
                  size="md"
                  iconLeft={ArrowLeft}
                  onClick={() => setStep('room')}
                >
                  Back
                </Button>
                <Button type="submit" variant="accent" size="md" iconRight={ArrowRight}>
                  Continue to Payment
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT & REVIEW ================= */}
        {step === 'payment' && (
          <form onSubmit={handleCompleteBooking} className="mt-6 space-y-5 text-xs">
            {/* Transparent Price Breakdown */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Transparent Price Breakdown
              </h4>

              <div className="space-y-1.5 divide-y divide-white/[0.05]">
                <div className="flex justify-between pt-1">
                  <span className="text-mist-300">
                    {selectedType.name} (${selectedType.rate} × {nights} nights)
                  </span>
                  <span className="text-white font-medium">{money(pricing.roomSubtotal)}</span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-mist-300">
                    Resort & Wellness Fee (${RESORT_FEE_PER_NIGHT} × {nights} nights)
                  </span>
                  <span className="text-white font-medium">{money(pricing.resortFee)}</span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-mist-300">
                    Taxes & Service Charge ({Math.round(TAX_RATE * 100)}% demo rate)
                  </span>
                  <span className="text-white font-medium">{money(pricing.taxes)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                  <span className="text-white">Total Amount Due</span>
                  <span className="text-amber-300 font-display text-base">{money(pricing.total)}</span>
                </div>
              </div>
            </div>

            {/* Simulated Card Payment Form */}
            <div className="rounded-2xl border border-white/10 bg-ink-950/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  Simulated Card Payment
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <Lock className="h-3 w-3" /> Tokenised Demo Security
                </span>
              </div>

              {/* Quick fill buttons */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber(DEMO_CARD);
                    setErrorMessage(null);
                  }}
                  className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-300 hover:bg-emerald-400/20"
                >
                  Fill Valid Test Card (•••• 4242)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber(DECLINE_CARD);
                    setErrorMessage(null);
                  }}
                  className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-rose-300 hover:bg-rose-400/20"
                >
                  Fill Decline Test Card (simulates bank decline)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-mist-200">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="field w-full font-mono text-xs"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="field w-full font-mono text-xs text-center"
                    placeholder="12/28"
                  />
                </div>
              </div>

              {/* System integrations status banner */}
              {pmsStatus !== 'healthy' && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-[11px] text-amber-200">
                  ⚠️ Note: Hotel PMS is currently {pmsStatus} (simulated). Your payment will be captured, and booking
                  held for Front Desk reconciliation (F14). You will never be charged twice.
                </div>
              )}
            </div>

            {/* Terms and Cancellation Agreement */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreePolicies}
                  onChange={(e) => setAgreePolicies(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-mist-300 leading-relaxed">
                  I agree to the hotel policies: Free cancellation up to 2 days prior to arrival. Check-in from{' '}
                  {CHECK_IN_TIME}, check-out by {CHECK_OUT_TIME}. I understand this is a simulated demo booking.
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="subtle"
                size="md"
                iconLeft={ArrowLeft}
                onClick={() => setStep('guest')}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="md"
                disabled={submitting}
                className="font-bold shadow-lg"
              >
                {submitting ? 'Processing Simulation...' : `Pay ${money(pricing.total)} & Confirm`}
              </Button>
            </div>
          </form>
        )}

        {/* ================= STEP 4: CONFIRMED ================= */}
        {step === 'confirmed' && confirmedBooking && (
          <div className="mt-6 space-y-6 text-center animate-in zoom-in-95">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-xl">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                {confirmedBooking.status === 'confirmed' ? 'PMS Synchronized' : 'Payment Captured · Pending PMS Sync'}
              </span>
              <h3 className="font-display text-3xl font-extrabold text-white mt-1">
                Your Stay is Reserved
              </h3>
              <p className="text-xs text-mist-300 mt-1 max-w-md mx-auto">
                A confirmation has been simulated for <strong className="text-white">{confirmedBooking.guest.name}</strong>.
                Reference number below:
              </p>
            </div>

            {/* Reference Badge Card */}
            <div className="mx-auto max-w-md rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">
                Booking Reference Number
              </span>
              <span className="font-mono text-3xl font-extrabold text-white tracking-wider block mt-1">
                {confirmedBooking.ref}
              </span>
              <span className="text-[10px] text-amber-200/80 block mt-1">
                Keep this code to manage your stay or complete Pre-Arrival check-in
              </span>
            </div>

            {/* Details Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs max-w-lg mx-auto space-y-2">
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-mist-400">Room Category</span>
                <span className="font-semibold text-white">{confirmedBooking.roomTypeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-mist-400">Assigned Unit</span>
                <span className="font-semibold text-white">Room {confirmedBooking.room}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-mist-400">Dates</span>
                <span className="font-semibold text-white">
                  {confirmedBooking.checkIn} to {confirmedBooking.checkOut} ({confirmedBooking.pricing.nights} nights)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-mist-400">Guests</span>
                <span className="font-semibold text-white">
                  {confirmedBooking.adults} Adults{confirmedBooking.children > 0 ? `, ${confirmedBooking.children} Children` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-mist-400">Total Paid (Demo)</span>
                <span className="font-bold text-amber-300 font-display text-sm">
                  {money(confirmedBooking.payment.amount)} (Card {confirmedBooking.payment.mask})
                </span>
              </div>
            </div>

            {/* Front Desk Connection Notice */}
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs text-sky-200 max-w-lg mx-auto text-left flex items-start gap-2.5">
              <Building className="h-4 w-4 shrink-0 mt-0.5 text-sky-300" />
              <div>
                <p className="font-semibold text-white">Front Desk Workflow Connected</p>
                <p className="text-[11px] text-mist-300 mt-0.5">
                  This reservation is instantly available in the staff Front Desk arrivals tab (`/staff/front-desk`).
                  Once Front Desk completes check-in on arrival day, the in-room Guest QR session activates!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Button
                variant="accent"
                size="md"
                onClick={() => {
                  onClose();
                  onManageBooking(confirmedBooking.ref);
                }}
              >
                Pre-Arrival Check-in (F08)
              </Button>

              <Button
                variant="subtle"
                size="md"
                href="/staff/front-desk"
              >
                View in Front Desk Console
              </Button>

              <Button variant="ghost" size="md" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
