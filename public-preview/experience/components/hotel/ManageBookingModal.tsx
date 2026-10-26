'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  KeyRound,
  Mail,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Undo2,
  User,
  Users,
  X,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ARRIVAL_TIMES,
  DEMO_TODAY,
  addDays,
  bookingStage,
  cancelBooking,
  cancellationQuote,
  currentRoom,
  modifyBooking,
  nightsBetween,
  requestEarlyCheckIn,
  submitPreArrival,
  type BookingPatch,
} from '@/lib/bookings';
import {
  EARLY_CHECKIN_FEE,
  HOTEL_NAME,
  roomTypeById,
} from '@/lib/hotelCatalog';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import type { WebBooking } from '@/types/demo';

interface ManageBookingModalProps {
  initialRef?: string;
  onClose: () => void;
}

export function ManageBookingModal({ initialRef, onClose }: ManageBookingModalProps) {
  const { state, fdAction } = useDemo();
  const [searchRef, setSearchRef] = useState(initialRef ?? '');
  const [activeRef, setActiveRef] = useState<string | null>(initialRef ?? null);

  // Sub-action views
  const [view, setView] = useState<'details' | 'prearrival' | 'modify' | 'cancel'>('details');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-arrival form
  const [arrivalTime, setArrivalTime] = useState<string>('14:00');
  const [preArrivalConsent, setPreArrivalConsent] = useState<boolean>(true);

  // Modify form
  const [modCheckIn, setModCheckIn] = useState('');
  const [modCheckOut, setModCheckOut] = useState('');
  const [modName, setModName] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modPhone, setModPhone] = useState('');
  const [modRequests, setModRequests] = useState('');

  // Find booking
  const booking = state.bookings.find((b) => b.ref.toLowerCase() === (activeRef ?? '').toLowerCase().trim());
  const activeStay = booking
    ? state.frontDesk.stays.find((st) => st.bookingRef === booking.ref)
    : null;

  const stage = booking ? bookingStage(state, booking) : 'upcoming';
  const assignedRoom = booking ? currentRoom(state, booking) : '';
  const cancelQuote = booking ? cancellationQuote(booking) : null;

  // Sync initial modify fields when booking selected
  const handleSelectBooking = (b: WebBooking) => {
    setActiveRef(b.ref);
    setSearchRef(b.ref);
    setModCheckIn(b.checkIn);
    setModCheckOut(b.checkOut);
    setModName(b.guest.name);
    setModEmail(b.guest.email);
    setModPhone(b.guest.phone);
    setModRequests(b.requests ?? '');
    setView('details');
    setErrorMessage(null);
  };

  // Pre-arrival submission
  const handleSubmitPreArrival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setErrorMessage(null);
    const err = fdAction('submitPreArrival', [booking.ref, arrivalTime, preArrivalConsent]);
    if (err) {
      setErrorMessage(err);
    } else {
      setView('details');
    }
  };

  // Early check-in request
  const handleRequestEarlyCheckIn = () => {
    if (!booking) return;
    setErrorMessage(null);
    const err = fdAction('requestEarlyCheckIn', [booking.ref]);
    if (err) {
      setErrorMessage(err);
    }
  };

  // Modify submission
  const handleSubmitModify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setErrorMessage(null);

    const patch: BookingPatch = {
      checkIn: modCheckIn,
      checkOut: modCheckOut,
      guest: { name: modName, email: modEmail, phone: modPhone },
      requests: modRequests,
    };

    const err = fdAction('modifyBooking', [booking.ref, patch]);
    if (err) {
      setErrorMessage(err);
    } else {
      setView('details');
    }
  };

  // Cancel reservation
  const handleConfirmCancel = () => {
    if (!booking) return;
    setErrorMessage(null);
    const err = fdAction('cancelBooking', [booking.ref]);
    if (err) {
      setErrorMessage(err);
    } else {
      setView('details');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="fixed inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-ink-900/95 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <KeyRound className="h-4 w-4" />
              <span>Guest Reservation Management</span>
            </div>
            <h3 id="manage-modal-title" className="font-display text-2xl font-bold text-white mt-1">
              Manage Your Stay & Pre-Arrival
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

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Search Bar / Booking Selector */}
        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" />
              <input
                type="text"
                placeholder="Enter booking reference (e.g. GA-123456 or guest name)..."
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="field w-full pl-9 text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                setActiveRef(searchRef.trim());
                setView('details');
                setErrorMessage(null);
              }}
            >
              Lookup
            </Button>
          </div>

          {/* Quick list of all simulated demo bookings */}
          {state.bookings.length > 0 && !booking && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
              <span className="font-semibold text-mist-300 block">Or select an existing demo booking:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.bookings.map((b) => (
                  <button
                    key={b.ref}
                    type="button"
                    onClick={() => handleSelectBooking(b)}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-left hover:border-amber-400/40 hover:bg-white/[0.06] transition"
                  >
                    <div>
                      <span className="font-mono font-bold text-white block">{b.ref}</span>
                      <span className="text-[11px] text-mist-400 block">{b.guest.name} · {b.roomTypeName}</span>
                    </div>
                    <Badge tone={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'neutral' : 'warning'}>
                      {b.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Booking Content */}
        {booking ? (
          <div className="mt-6 space-y-5">
            {/* Booking Title Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-white">{booking.ref}</span>
                  <Badge tone={stage === 'checked_in' ? 'success' : stage === 'checked_out' ? 'neutral' : stage === 'cancelled' ? 'danger' : 'info'}>
                    {stage === 'checked_in' ? 'In House (Checked In)' : stage === 'checked_out' ? 'Checked Out' : stage === 'cancelled' ? 'Cancelled' : booking.status === 'pending_confirmation' ? 'Needs PMS Reconciliation' : 'Confirmed Upcoming'}
                  </Badge>
                </div>
                <p className="text-xs text-mist-300 mt-1">
                  {booking.roomTypeName} (Room {assignedRoom}) · {booking.checkIn} to {booking.checkOut} ({booking.pricing.nights} nights)
                </p>
              </div>

              <div className="text-right">
                <span className="block text-xs text-mist-400">Total Paid (Demo)</span>
                <span className="font-display text-lg font-bold text-amber-300">
                  {money(booking.payment.amount)}
                </span>
              </div>
            </div>

            {/* ================= VIEW: DETAILS ================= */}
            {view === 'details' && (
              <div className="space-y-5 text-xs">
                {/* Guest & Stay Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Guest Info */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                    <span className="font-semibold text-mist-200 block">Guest Information</span>
                    <div className="space-y-1 text-mist-300">
                      <p className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-amber-300" />
                        {booking.guest.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-amber-300" />
                        {booking.guest.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-amber-300" />
                        {booking.guest.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-amber-300" />
                        {booking.adults} Adults{booking.children > 0 ? `, ${booking.children} Children` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Pre-Arrival Status & Guest Portal Gateway */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                    <span className="font-semibold text-mist-200 block">Pre-Arrival & Check-in Status</span>
                    <div className="space-y-1.5 text-mist-300">
                      <div className="flex items-center justify-between">
                        <span>Pre-arrival details:</span>
                        <Badge tone={booking.preArrival.status === 'verified' ? 'success' : booking.preArrival.status === 'submitted' ? 'warning' : 'neutral'}>
                          {booking.preArrival.status === 'verified' ? 'ID Verified' : booking.preArrival.status === 'submitted' ? 'Submitted (Staff verifying)' : 'Not submitted'}
                        </Badge>
                      </div>

                      {activeStay?.earlyCheckIn && (
                        <div className="flex items-center justify-between">
                          <span>Early check-in ({money(activeStay.earlyCheckIn.fee)}):</span>
                          <Badge tone={activeStay.earlyCheckIn.status === 'approved' ? 'success' : activeStay.earlyCheckIn.status === 'declined' ? 'neutral' : 'warning'}>
                            {activeStay.earlyCheckIn.status}
                          </Badge>
                        </div>
                      )}

                      {/* In-room Guest Portal Link */}
                      {stage === 'checked_in' ? (
                        <div className="pt-2">
                          <Link
                            href={`/guest/portal?room=${assignedRoom}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500/20 border border-teal-400/30 px-3 py-2 font-bold text-teal-300 hover:bg-teal-500/30 transition"
                          >
                            <Smartphone className="h-4 w-4" />
                            Open In-Room Guest Portal
                          </Link>
                        </div>
                      ) : (
                        <p className="text-[11px] text-mist-400 pt-1">
                          In-room Guest Portal activates once Front Desk completes arrival check-in.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {booking.requests && (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-mist-300">
                    <span className="font-semibold text-white block mb-0.5">Special Requests:</span>
                    <p>{booking.requests}</p>
                  </div>
                )}

                {/* Timeline / History */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                  <span className="font-semibold text-mist-200 block">Reservation Audit History</span>
                  <ul className="space-y-1.5">
                    {booking.history.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-mist-300">
                        <span className="font-mono text-amber-300/80 shrink-0">{h.at}</span>
                        <span>{h.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                {booking.status !== 'cancelled' && stage !== 'checked_out' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.08]">
                    {/* Pre-arrival check-in (F08) */}
                    {booking.status === 'confirmed' && booking.preArrival.status === 'none' && stage === 'upcoming' && (
                      <Button
                        size="sm"
                        variant="accent"
                        iconLeft={ShieldCheck}
                        onClick={() => setView('prearrival')}
                      >
                        Submit Pre-Arrival Check-in (F08)
                      </Button>
                    )}

                    {/* Early check-in (F09) */}
                    {booking.status === 'confirmed' && booking.checkIn === DEMO_TODAY && !activeStay?.earlyCheckIn && stage === 'upcoming' && (
                      <Button
                        size="sm"
                        variant="subtle"
                        iconLeft={Clock}
                        onClick={handleRequestEarlyCheckIn}
                      >
                        Request Early Check-in (${EARLY_CHECKIN_FEE})
                      </Button>
                    )}

                    {/* Modify dates/guests */}
                    {stage === 'upcoming' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        iconLeft={RotateCcw}
                        onClick={() => {
                          setModCheckIn(booking.checkIn);
                          setModCheckOut(booking.checkOut);
                          setModName(booking.guest.name);
                          setModEmail(booking.guest.email);
                          setModPhone(booking.guest.phone);
                          setModRequests(booking.requests ?? '');
                          setView('modify');
                        }}
                      >
                        Modify Dates / Details
                      </Button>
                    )}

                    {/* Cancel booking */}
                    {stage === 'upcoming' && (
                      <Button
                        size="sm"
                        variant="danger"
                        iconLeft={Trash2}
                        onClick={() => setView('cancel')}
                      >
                        Cancel Reservation
                      </Button>
                    )}

                    {/* Link to Front Desk Console */}
                    <Link
                      href="/staff/front-desk"
                      className="ml-auto inline-flex items-center gap-1 text-xs text-mist-400 hover:text-white"
                    >
                      <span>Inspect in Front Desk</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ================= VIEW: PRE-ARRIVAL CHECK-IN (F08) ================= */}
            {view === 'prearrival' && (
              <form onSubmit={handleSubmitPreArrival} className="space-y-4 text-xs animate-in fade-in-50">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sky-200">
                  <h4 className="font-semibold text-white">Pre-Arrival Digital Check-in (F08)</h4>
                  <p className="mt-0.5 text-mist-300 text-[11px]">
                    Submitting your expected arrival time allows Housekeeping and Front Desk to prioritize room inspection.
                    Front Desk will verify your ID upon arrival.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Estimated Arrival Time on {booking.checkIn}</label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="field w-full text-xs font-medium"
                  >
                    {ARRIVAL_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t} hrs
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={preArrivalConsent}
                      onChange={(e) => setPreArrivalConsent(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 text-amber-400 focus:ring-amber-400"
                    />
                    <span className="text-mist-300 text-[11px]">
                      I confirm that guest details provided match my valid government photo ID, and I consent to the
                      hotel registration policy.
                    </span>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button type="button" variant="subtle" size="sm" onClick={() => setView('details')}>
                    Back
                  </Button>
                  <Button type="submit" variant="accent" size="sm" iconRight={ShieldCheck}>
                    Submit Pre-Arrival Details
                  </Button>
                </div>
              </form>
            )}

            {/* ================= VIEW: MODIFY ================= */}
            {view === 'modify' && (
              <form onSubmit={handleSubmitModify} className="space-y-4 text-xs animate-in fade-in-50">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-200">
                  <h4 className="font-semibold text-white">Modify Reservation Dates or Contact</h4>
                  <p className="mt-0.5 text-mist-300 text-[11px]">
                    Changing dates checks live availability. If stay price increases, additional amount will be simulated.
                    If price decreases, the difference is sent to Finance as a refund request.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-mist-200 block mb-1">Check-in Date</label>
                    <input
                      type="date"
                      min={DEMO_TODAY}
                      value={modCheckIn}
                      onChange={(e) => setModCheckIn(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-mist-200 block mb-1">Check-out Date</label>
                    <input
                      type="date"
                      min={addDays(modCheckIn, 1)}
                      value={modCheckOut}
                      onChange={(e) => setModCheckOut(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-mist-200 block mb-1">Guest Name</label>
                    <input
                      type="text"
                      required
                      value={modName}
                      onChange={(e) => setModName(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-mist-200 block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={modEmail}
                      onChange={(e) => setModEmail(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-mist-200 block mb-1">Special Requests</label>
                    <textarea
                      rows={2}
                      value={modRequests}
                      onChange={(e) => setModRequests(e.target.value)}
                      className="field w-full text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button type="button" variant="subtle" size="sm" onClick={() => setView('details')}>
                    Back
                  </Button>
                  <Button type="submit" variant="accent" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {/* ================= VIEW: CANCEL ================= */}
            {view === 'cancel' && cancelQuote && (
              <div className="space-y-4 text-xs animate-in fade-in-50">
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                  <h4 className="font-semibold text-rose-200">Cancellation Policy & Refund Quote</h4>
                  <p className="text-mist-200 leading-relaxed">{cancelQuote.note}</p>

                  <div className="mt-3 border-t border-rose-500/20 pt-3 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-mist-400 block text-[10px] uppercase">Penalty Retained</span>
                      <span className="font-bold text-white text-sm">{money(cancelQuote.penalty)}</span>
                    </div>
                    <div>
                      <span className="text-mist-400 block text-[10px] uppercase">Refund Due</span>
                      <span className="font-bold text-emerald-400 text-sm">{money(cancelQuote.refund)}</span>
                    </div>
                  </div>
                </div>

                {cancelQuote.refund > 0 && (
                  <p className="text-[11px] text-mist-400 leading-relaxed">
                    Under the separation of duties rule (REQ-08), refunds are sent to Finance (`financial_operator`)
                    queue for review and approval before execution.
                  </p>
                )}

                <div className="flex justify-between items-center pt-2">
                  <Button type="button" variant="subtle" size="sm" onClick={() => setView('details')}>
                    Keep Reservation
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    iconLeft={Trash2}
                    onClick={handleConfirmCancel}
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : activeRef ? (
          <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-white/10 py-12 text-center text-xs text-mist-400">
            <AlertCircle className="h-6 w-6 text-mist-500 mb-2" />
            <p>No reservation found matching reference &ldquo;{activeRef}&rdquo;.</p>
            <p className="text-[11px] text-mist-500 mt-1">Check the code from your confirmation or choose from demo bookings above.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
