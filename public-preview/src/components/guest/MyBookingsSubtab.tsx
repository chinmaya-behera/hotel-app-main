'use client';

import { useState } from 'react';
import {
  BedDouble,
  Calendar,
  Clock,
  QrCode,
  KeyRound,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Tv,
  Wifi,
  Coffee,
  Bath,
  SunMedium,
  Lock,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

interface BookingRecord {
  id: string;
  bookingRef: string;
  status: 'Upcoming' | 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled';
  roomNumber: string;
  roomType: string;
  roomCategory: string;
  floorZone: string;
  amenities: string[];
  primaryGuest: string;
  additionalGuests: string[];
  adultsCount: number;
  childrenCount: number;
  qrToken: string;
  doorPin: string;
  checkInDate: string;
  checkInTime: string;
  checkInStatus: string;
  checkInInstructions: string;
  checkOutDate: string;
  checkOutTime: string;
  checkOutStatus: string;
  canRequestLateCheckout: boolean;
}

export function MyBookingsSubtab({ room, guestName, onNavigate }: GuestTabProps) {
  const { state, submitGuestMessageToFrontDesk } = useDemo();

  const stays = state.frontDesk?.stays ?? [];
  const currentStay = stays.find((s) => s.room === room);

  // Curated bookings list for Elena Rostova
  const bookings: BookingRecord[] = [
    {
      id: 'bk-current',
      bookingRef: 'BK-8841-IN',
      status: 'Checked In',
      roomNumber: room,
      roomType: currentStay?.roomType || 'Deluxe King Suite',
      roomCategory: 'High Floor · Ocean & Skyline View',
      floorZone: 'Level 4, West Wing (Room 402)',
      amenities: [
        'King Pillowtop Bed',
        '55" 4K Smart OLED TV',
        'Nespresso Vertuo Coffee Bar',
        'Rainforest Walk-in Shower',
        'Private Sun Balcony',
        'High-Speed Wi-Fi 6',
        'Italian Marble Bathroom',
        'Touch-Screen Climate Control',
        'In-Room Digital Laptop Safe',
      ],
      primaryGuest: currentStay?.guest || guestName,
      additionalGuests: ['Viktor Rostov'],
      adultsCount: 2,
      childrenCount: 0,
      qrToken: `https://grand-azure.hotel/guest/portal?room=${room}&token=demo-token`,
      doorPin: `${room}8`,
      checkInDate: currentStay?.arrival || 'Wed, 21 Oct',
      checkInTime: '14:00',
      checkInStatus: 'Checked In · ID Verified',
      checkInInstructions:
        'Digital check-in completed. NFC mobile key active. Traditional physical RFID keycards are also available at Front Desk anytime upon presenting your room PIN.',
      checkOutDate: currentStay?.departure || 'Fri, 23 Oct',
      checkOutTime: '11:00 AM',
      checkOutStatus: 'Scheduled',
      canRequestLateCheckout: true,
    },
    {
      id: 'bk-upcoming',
      bookingRef: 'BK-9104-UP',
      status: 'Confirmed',
      roomNumber: '518 (Reserved)',
      roomType: 'Presidential Suite',
      roomCategory: 'Penthouse Level · Panoramic Bay & Harbour View',
      floorZone: 'Penthouse Level 5, North Wing',
      amenities: [
        'Master King Bedroom & Walk-in Dressing',
        'Private Rooftop Jacuzzi & Cabana',
        'Dedicated 24h Butler Service',
        'Formal Dining Salon for 8',
        'Bang & Olufsen Multi-Room Audio',
        'Complimentary Daily Limo Transfers',
      ],
      primaryGuest: guestName,
      additionalGuests: ['Viktor Rostov', 'Sofia Rostova'],
      adultsCount: 2,
      childrenCount: 1,
      qrToken: 'https://grand-azure.hotel/guest/portal?room=518&token=upcoming-token',
      doorPin: '5182',
      checkInDate: 'Fri, 14 Nov',
      checkInTime: '15:00',
      checkInStatus: 'Confirmed · Pre-registration Available',
      checkInInstructions:
        'Pre-registration opens 24 hours prior to arrival. VIP Butler team will meet you at the Porte Cochere for private in-suite check-in.',
      checkOutDate: 'Mon, 17 Nov',
      checkOutTime: '12:00 PM',
      checkOutStatus: 'Upcoming',
      canRequestLateCheckout: false,
    },
    {
      id: 'bk-past',
      bookingRef: 'BK-7219-PA',
      status: 'Checked Out',
      roomNumber: '305',
      roomType: 'Executive Suite',
      roomCategory: 'Level 3 · Courtyard Garden View',
      floorZone: 'Level 3, Garden Wing',
      amenities: [
        'Super King Luxury Bed',
        'Separate Executive Study & Lounge',
        'Deep Soaking Marble Bathtub',
        'Executive Club Lounge Privileges',
      ],
      primaryGuest: guestName,
      additionalGuests: [],
      adultsCount: 1,
      childrenCount: 0,
      qrToken: 'https://grand-azure.hotel/guest/portal?room=305&token=archived-token',
      doorPin: '3055',
      checkInDate: 'Mon, 10 Aug',
      checkInTime: '14:00',
      checkInStatus: 'Checked In',
      checkInInstructions: 'Stay completed.',
      checkOutDate: 'Thu, 13 Aug',
      checkOutTime: '11:00 AM',
      checkOutStatus: 'Checked Out · Zero Balance',
      canRequestLateCheckout: false,
    },
  ];

  const [selectedBookingId, setSelectedBookingId] = useState<string>('bk-current');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [lateCheckoutModal, setLateCheckoutModal] = useState<boolean>(false);
  const [requestedTime, setRequestedTime] = useState<string>('13:00 (1:00 PM) - Complimentary VIP');
  const [lateReason, setLateReason] = useState<string>('Evening flight departure at 17:30');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  function handleCopyPin() {
    navigator.clipboard?.writeText(selectedBooking.doorPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  }

  function handleLateCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitGuestMessageToFrontDesk(
      room,
      `Late Checkout Request (${selectedBooking.bookingRef})`,
      `Guest requested extension to ${requestedTime}. Reason: ${lateReason}`,
      'Please update PMS departure schedule.',
    );
    setLateCheckoutModal(false);
    setToastMessage(`Late checkout request (${requestedTime}) submitted to Front Desk coordinator Meera Nambiar.`);
    setTimeout(() => setToastMessage(null), 6000);
  }

  const STATUS_BADGE: Record<BookingRecord['status'], { tone: string; label: string }> = {
    'Checked In': {
      tone: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
      label: 'Checked In (Active Stay)',
    },
    Confirmed: {
      tone: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
      label: 'Confirmed (Upcoming)',
    },
    Upcoming: {
      tone: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
      label: 'Upcoming Reservation',
    },
    'Checked Out': {
      tone: 'bg-mist-600/20 text-mist-300 border-mist-500/30',
      label: 'Completed / Checked Out',
    },
    Cancelled: {
      tone: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      label: 'Cancelled',
    },
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-300">Request Sent</p>
            <p className="text-xs text-mist-200 mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Multiple Bookings Selector Mechanism */}
      <div className="space-y-2">
        <GuestSectionHeader
          title="Select Reservation"
          hint="Switch between your active stay, upcoming trips, or past booking receipts"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {bookings.map((b) => {
            const isSelected = b.id === selectedBookingId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBookingId(b.id)}
                className={`guest-card p-3.5 text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 shadow-md ring-1 ring-amber-400/30'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-300">{b.bookingRef}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_BADGE[b.status].tone}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{b.roomType}</h4>
                  <p className="text-[10px] text-mist-400">
                    Room {b.roomNumber} · {b.checkInDate}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SELECTED BOOKING DETAILS */}
      <div className="space-y-5">
        {/* Hero Header with Status */}
        <div data-tour="tour-my-stay" className="guest-card p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">{selectedBooking.bookingRef}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    STATUS_BADGE[selectedBooking.status].tone
                  }`}
                >
                  {STATUS_BADGE[selectedBooking.status].label}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">{selectedBooking.roomType}</h2>
              <p className="text-xs text-mist-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>{selectedBooking.roomCategory}</span>
                <span>·</span>
                <span>{selectedBooking.floorZone}</span>
              </p>
            </div>

            {selectedBooking.status === 'Checked In' && (
              <button
                type="button"
                onClick={() => onNavigate('profile', 'folio')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition-colors self-start sm:self-auto shrink-0 shadow-md"
              >
                <span>View Stay Folio &amp; Invoice</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1. ROOM DETAILS */}
        <div className="guest-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <BedDouble className="h-4 w-4" />
            <span>1. Room Details &amp; Suite Amenities</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Room Number</span>
              <p className="text-sm font-bold text-white mt-0.5">{selectedBooking.roomNumber}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Suite Class</span>
              <p className="text-xs font-bold text-white mt-0.5">{selectedBooking.roomType}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Location / View</span>
              <p className="text-xs font-bold text-white mt-0.5">{selectedBooking.roomCategory}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Wing / Floor</span>
              <p className="text-xs font-bold text-white mt-0.5">{selectedBooking.floorZone}</p>
            </div>
          </div>

          {/* Amenities List */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <p className="text-[10px] text-mist-400 uppercase font-semibold">Included Room Amenities</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedBooking.amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-mist-200 border border-white/5"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>{amenity}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2. GUEST DETAILS */}
        <div className="guest-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Users className="h-4 w-4" />
            <span>2. Registered Guest Party</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 space-y-0.5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Primary Registered Guest</span>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{selectedBooking.primaryGuest}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">Main</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 space-y-0.5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Additional Guests</span>
              <p className="text-xs font-bold text-white">
                {selectedBooking.additionalGuests.length > 0
                  ? selectedBooking.additionalGuests.join(', ')
                  : 'No additional companions'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 space-y-0.5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Party Occupancy</span>
              <p className="text-xs font-bold text-white">
                {selectedBooking.adultsCount} Adult{selectedBooking.adultsCount > 1 ? 's' : ''}
                {selectedBooking.childrenCount > 0
                  ? ` · ${selectedBooking.childrenCount} Child${selectedBooking.childrenCount > 1 ? 'ren' : ''}`
                  : ' · 0 Children'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. ROOM QR & ACCESS PASSWORD */}
        <div className="guest-card p-4 space-y-4 border border-amber-400/30 bg-gradient-to-br from-amber-400/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <QrCode className="h-4 w-4" />
              <span>3. Room Digital Access Key &amp; Door Password</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 text-[10px] font-bold border border-emerald-400/20">
              Active Key
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
            {/* Scannable Vector QR Code Graphic */}
            <div className="p-3 rounded-2xl bg-white shadow-xl flex flex-col items-center shrink-0">
              <svg
                width="140"
                height="140"
                viewBox="0 0 100 100"
                className="w-32 h-32"
                aria-label="Room digital key QR code"
              >
                {/* Background */}
                <rect width="100" height="100" fill="#ffffff" />
                {/* Top-Left Position Detection Marker */}
                <rect x="10" y="10" width="28" height="28" fill="#18181b" rx="4" />
                <rect x="16" y="16" width="16" height="16" fill="#ffffff" rx="2" />
                <rect x="20" y="20" width="8" height="8" fill="#18181b" rx="1" />
                {/* Top-Right Position Detection Marker */}
                <rect x="62" y="10" width="28" height="28" fill="#18181b" rx="4" />
                <rect x="68" y="16" width="16" height="16" fill="#ffffff" rx="2" />
                <rect x="72" y="20" width="8" height="8" fill="#18181b" rx="1" />
                {/* Bottom-Left Position Detection Marker */}
                <rect x="10" y="62" width="28" height="28" fill="#18181b" rx="4" />
                <rect x="16" y="68" width="16" height="16" fill="#ffffff" rx="2" />
                <rect x="20" y="72" width="8" height="8" fill="#18181b" rx="1" />
                {/* Timing patterns & Data dots */}
                <rect x="42" y="12" width="5" height="5" fill="#18181b" />
                <rect x="52" y="12" width="5" height="5" fill="#18181b" />
                <rect x="42" y="22" width="5" height="5" fill="#18181b" />
                <rect x="52" y="22" width="5" height="5" fill="#18181b" />
                <rect x="12" y="42" width="5" height="5" fill="#18181b" />
                <rect x="12" y="52" width="5" height="5" fill="#18181b" />
                <rect x="22" y="42" width="5" height="5" fill="#18181b" />
                {/* Center data matrix elements */}
                <rect x="42" y="42" width="16" height="16" fill="#d97706" rx="2" />
                <rect x="62" y="42" width="6" height="6" fill="#18181b" />
                <rect x="72" y="42" width="6" height="6" fill="#18181b" />
                <rect x="82" y="42" width="6" height="6" fill="#18181b" />
                <rect x="62" y="52" width="6" height="6" fill="#18181b" />
                <rect x="76" y="52" width="6" height="6" fill="#18181b" />
                <rect x="42" y="62" width="6" height="6" fill="#18181b" />
                <rect x="52" y="62" width="6" height="6" fill="#18181b" />
                <rect x="62" y="62" width="6" height="6" fill="#18181b" />
                <rect x="74" y="62" width="6" height="6" fill="#18181b" />
                <rect x="84" y="62" width="6" height="6" fill="#18181b" />
                <rect x="42" y="74" width="6" height="6" fill="#18181b" />
                <rect x="54" y="74" width="6" height="6" fill="#18181b" />
                <rect x="66" y="74" width="6" height="6" fill="#18181b" />
                <rect x="80" y="74" width="6" height="6" fill="#18181b" />
                <rect x="44" y="84" width="6" height="6" fill="#18181b" />
                <rect x="56" y="84" width="6" height="6" fill="#18181b" />
                <rect x="68" y="84" width="6" height="6" fill="#18181b" />
                <rect x="82" y="84" width="6" height="6" fill="#18181b" />
              </svg>
              <span className="text-[10px] font-mono font-bold text-ink-950 mt-1">Room {selectedBooking.roomNumber}</span>
            </div>

            {/* Password / PIN & Instructions */}
            <div className="space-y-3 flex-1 text-xs">
              <div className="space-y-1">
                <span className="text-mist-400 font-semibold block text-[10px] uppercase">
                  Door Access PIN &amp; Keypad Password
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-base font-bold text-amber-300 tracking-wider">
                    <KeyRound className="h-4 w-4 text-amber-400" />
                    <span>{showPin ? selectedBooking.doorPin : '••••'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 text-mist-300 hover:text-white transition-colors"
                    title={showPin ? 'Hide PIN' : 'Reveal PIN'}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 hover:border-amber-400/40 text-mist-300 hover:text-white transition-all"
                  >
                    {copiedPin ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Copy PIN</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Access Instructions */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 text-[11px] text-mist-300">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>How to Unlock Your Door</span>
                </p>
                <p className="leading-relaxed">
                  <strong>Option A:</strong> Present this scannable QR code to the optical lens reader on your suite door handle (keep 5-10cm away).
                </p>
                <p className="leading-relaxed">
                  <strong>Option B:</strong> Touch the door keypad to illuminate the backlight, enter your 4-digit PIN (<strong>{showPin ? selectedBooking.doorPin : '••••'}</strong>), followed by the <strong>#</strong> key.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CHECK-IN DETAILS */}
        <div className="guest-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Calendar className="h-4 w-4" />
            <span>4. Check-in Details &amp; Instructions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Check-in Date &amp; Time</span>
              <p className="text-xs font-bold text-white mt-0.5">
                {selectedBooking.checkInDate} · From {selectedBooking.checkInTime}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Check-in Status</span>
              <p className="text-xs font-bold text-emerald-300 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{selectedBooking.checkInStatus}</span>
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 sm:col-span-1">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Baggage / Keycard Assistance</span>
              <p className="text-xs font-bold text-white mt-0.5">Concierge Desk Open 24/7</p>
            </div>
          </div>

          <p className="text-[11px] text-mist-300 p-2.5 rounded-xl bg-white/5 leading-relaxed">
            {selectedBooking.checkInInstructions}
          </p>
        </div>

        {/* 5. CHECK-OUT DETAILS */}
        <div className="guest-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="h-4 w-4" />
              <span>5. Check-out Details &amp; Departure</span>
            </div>

            {selectedBooking.canRequestLateCheckout && (
              <button
                type="button"
                onClick={() => setLateCheckoutModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-ink-950 text-xs font-bold transition-all border border-amber-400/30"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Request Late Checkout</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Scheduled Departure</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {selectedBooking.checkOutDate} · By {selectedBooking.checkOutTime}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5">
              <span className="text-[10px] text-mist-400 uppercase font-semibold">Departure Status</span>
              <p className="text-xs font-bold text-white mt-0.5">{selectedBooking.checkOutStatus}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 text-[11px] text-mist-300 space-y-1">
            <p className="font-semibold text-white">Express Keycard Drop &amp; Luggage Storage:</p>
            <p className="leading-relaxed">
              When departing, simply leave your physical keycards on the suite console desk, or drop them in the Express Checkout Box in the Lobby. Complimentary secure luggage storage is available with the Bell Captain for up to 24 hours post-checkout.
            </p>
          </div>
        </div>
      </div>

      {/* LATE CHECKOUT REQUEST MODAL */}
      {lateCheckoutModal && (
        <GuestSheet
          title="Request Late Checkout"
          onClose={() => setLateCheckoutModal(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setLateCheckoutModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLateCheckoutSubmit}
                className="flex-2 py-3 px-4 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md flex items-center justify-center gap-2"
              >
                <Clock className="h-4 w-4" />
                <span>Submit Request to Front Desk</span>
              </button>
            </div>
          }
        >
          <form onSubmit={handleLateCheckoutSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200 space-y-1">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>VIP Emerald Privilege</span>
              </p>
              <p className="text-[11px] text-mist-300 leading-relaxed">
                As a valued VIP member, complimentary late checkout up to 13:00 (1:00 PM) is available subject to suite turnover scheduling. Front Desk will review immediately.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="lc-time" className="text-mist-300 font-semibold block">
                Requested Departure Time
              </label>
              <select
                id="lc-time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              >
                <option value="12:00 (12:00 PM) - 1 hour extension" className="bg-ink-900 text-white">
                  12:00 (12:00 PM) · 1 Hour Extension (Complimentary)
                </option>
                <option value="13:00 (1:00 PM) - Complimentary VIP" className="bg-ink-900 text-white">
                  13:00 (1:00 PM) · 2 Hour Extension (VIP Complimentary)
                </option>
                <option value="14:00 (2:00 PM) - Subject to availability" className="bg-ink-900 text-white">
                  14:00 (2:00 PM) · 3 Hour Extension
                </option>
                <option value="16:00 (4:00 PM) - Half day rate applies" className="bg-ink-900 text-white">
                  16:00 (4:00 PM) · Half-Day Extension (Subject to fee)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="lc-reason" className="text-mist-300 font-semibold block">
                Reason / Flight Information
              </label>
              <textarea
                id="lc-reason"
                rows={3}
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                placeholder="e.g. Flight leaves in evening, attending business lunch..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </form>
        </GuestSheet>
      )}
    </div>
  );
}

