'use client';

import { useState, useMemo } from 'react';
import {
  Crown,
  Sparkles,
  BedDouble,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Send,
  Calendar,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  History,
  TrendingUp,
  Plus,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  X,
  Check,
  Layers,
  Inbox,
  Filter,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import { folioSeed } from '@/lib/mockData';
import { requestStep, escalateRequest, routeRequest, type RouteDept } from '@/lib/frontDesk';
import type { StayRecord, WorkItem } from '@/types/demo';

export interface VipDetailedProfile {
  id: string;
  guestId: string;
  guest: string;
  room: string;
  roomType: string;
  vipTier: string;
  memberSince: string;
  phone: string;
  email: string;
  currentStay: {
    arrival: string;
    departure: string;
    nights: number;
    status: string;
    roomRatePerNight: number;
  };
  previousStays: Array<{
    stayRef: string;
    dates: string;
    room: string;
    roomType: string;
    totalSpend: number;
  }>;
  preferences: {
    pillow: string;
    roomTemp: string;
    floorZone: string;
    newspaper: string;
  };
  dietary: {
    restrictions: string;
    allergies: string;
    preferences: string;
  };
  occasionsNotes: {
    milestone: string;
    notes: string;
    vipProtocol: string;
  };
  serviceRecoveryHistory: Array<{
    id: string;
    date: string;
    issue: string;
    resolution: string;
    compensationAmount: number;
    status: string;
  }>;
  financialHistory: Array<{
    ref: string;
    type: string;
    amount: number;
    date: string;
    status: string;
  }>;
  timeline: Array<{
    at: string;
    action: string;
    staff: string;
  }>;
}

// Rich detailed profiles for VIP guests
const VIP_PROFILES_DATA: Record<string, VipDetailedProfile> = {
  'stay-alistair': {
    id: 'stay-alistair',
    guestId: 'VIP-CH-4019',
    guest: 'Lord Alistair Sterling',
    room: '401',
    roomType: 'Ambassador Suite',
    vipTier: "👑 Chairman's Club",
    memberSince: '14 May 2019',
    phone: '+44 20 7946 0912',
    email: 'alistair.sterling@sterling-holding.co.uk',
    currentStay: {
      arrival: 'Mon 19 Oct',
      departure: 'Today · Late Checkout 16:00',
      nights: 4,
      status: 'In-House (Late Checkout)',
      roomRatePerNight: 45000,
    },
    previousStays: [
      { stayRef: 'STAY-2026-081', dates: '12 Aug - 16 Aug 2026', room: '401', roomType: 'Ambassador Suite', totalSpend: 245000 },
      { stayRef: 'STAY-2025-119', dates: '04 Dec - 09 Dec 2025', room: '412', roomType: 'Presidential Penthouse', totalSpend: 380000 },
      { stayRef: 'STAY-2025-044', dates: '18 Apr - 22 Apr 2025', room: '401', roomType: 'Ambassador Suite', totalSpend: 210000 },
    ],
    preferences: {
      pillow: 'Hypoallergenic goose down & memory foam',
      roomTemp: '20.0°C ambient climate',
      floorZone: 'High floor quiet executive wing',
      newspaper: 'Financial Times & The Economist (printed morning editions)',
    },
    dietary: {
      restrictions: 'Strictly nut-free culinary protocol',
      allergies: 'Severe peanut & tree nut anaphylactic allergy',
      preferences: 'High-altitude organic Darjeeling tea, sparkling mineral glass bottles',
    },
    occasionsNotes: {
      milestone: '💼 Executive Board Global Summit',
      notes: 'Requires absolute confidentiality. Do not distribute room keys without photo ID verification.',
      vipProtocol: 'GM Welcome card & orchids placed · Chauffeur Mercedes S-Class on standby',
    },
    serviceRecoveryHistory: [
      {
        id: 'SR-401-1',
        date: 'Yesterday, 20:15',
        issue: 'Executive lounge caviar service delayed by 35 minutes.',
        resolution: 'Provided ₹6,500 complimentary private dining credit & personal apology from F&B Director.',
        compensationAmount: 6500,
        status: 'Resolved & Settled',
      },
    ],
    financialHistory: [
      { ref: 'DSP-401-01', type: 'Folio Credit Waiver', amount: 6500, date: 'Yesterday', status: 'Approved & Applied' },
      { ref: 'AUTH-401-09', type: 'Pre-Authorization Token', amount: 150000, date: '19 Oct', status: 'Pre-Authorized' },
    ],
    timeline: [
      { at: '19 Oct, 11:30 AM', action: 'Private Express Check-In at VIP Lounge Desk', staff: 'Sunita Patel (Front Desk)' },
      { at: '19 Oct, 12:00 PM', action: 'GM Welcome Gift & Handwritten Letter Placed in Suite', staff: 'Executive Butler' },
      { at: '20 Oct, 08:00 AM', action: 'Financial Times hand-delivered to door rack', staff: 'Floor Attendant' },
      { at: 'Today, 09:30 AM', action: 'Late checkout confirmed until 16:00 without fee', staff: 'Sunita Patel (Front Desk)' },
    ],
  },
  'stay-priya': {
    id: 'stay-priya',
    guestId: 'VIP-AM-5182',
    guest: 'Priya Nair',
    room: '518',
    roomType: 'Presidential Suite',
    vipTier: '💎 Ambassador VIP',
    memberSince: '22 Feb 2021',
    phone: '+91 98201 44921',
    email: 'priya.nair@nair-enterprises.in',
    currentStay: {
      arrival: 'Thu 22 Oct',
      departure: 'Sun 25 Oct',
      nights: 3,
      status: 'In-House',
      roomRatePerNight: 55000,
    },
    previousStays: [
      { stayRef: 'STAY-2026-033', dates: '10 Feb - 14 Feb 2026', room: '518', roomType: 'Presidential Suite', totalSpend: 290000 },
      { stayRef: 'STAY-2025-098', dates: '15 Oct - 19 Oct 2025', room: '518', roomType: 'Presidential Suite', totalSpend: 315000 },
    ],
    preferences: {
      pillow: 'Plush botanical organic microfiber pillows',
      roomTemp: '21.5°C ambient climate',
      floorZone: 'Penthouse floor North view',
      newspaper: 'Mint & Economic Times',
    },
    dietary: {
      restrictions: 'Pure Jain vegetarian preparations',
      allergies: 'Severe shellfish & crustacean contact allergy',
      preferences: 'Warm almond milk with saffron, fresh jasmine florals',
    },
    occasionsNotes: {
      milestone: '🎂 Milestone 40th Birthday Celebration',
      notes: 'Private dinner party planned at Skyline Terrace. Butler assigned for evening.',
      vipProtocol: 'Chauffeur airport transfer completed · Fresh white orchids delivered',
    },
    serviceRecoveryHistory: [
      {
        id: 'SR-518-1',
        date: 'Today, 09:30 AM',
        issue: 'Corridor maintenance noise during morning executive video conference.',
        resolution: 'Front Desk issued ₹9,500 Folio Credit waiver and halted all corridor works.',
        compensationAmount: 9500,
        status: 'Routed to Financial Op.',
      },
    ],
    financialHistory: [
      { ref: 'CMP-518-88', type: 'Folio Credit Compensation', amount: 9500, date: 'Today', status: 'Routed to Finance' },
      { ref: 'INV-518-01', type: 'Room & Banquet Prepayment', amount: 165000, date: '21 Oct', status: 'Paid in Full' },
    ],
    timeline: [
      { at: '22 Oct, 14:15 PM', action: 'Mercedes Airport Chauffeur transfer greeted at Terminal 2', staff: 'Concierge Team' },
      { at: '22 Oct, 15:00 PM', action: 'Suite Key & RFID Live Pass handed over in-suite', staff: 'Duty Manager' },
      { at: 'Today, 09:35 AM', action: 'Corridor maintenance noise escalation addressed with ₹9,500 credit', staff: 'Sunita Patel' },
    ],
  },
  'stay-vance': {
    id: 'stay-vance',
    guestId: 'VIP-RP-3108',
    guest: 'Camilla & Julian Vance',
    room: '310',
    roomType: 'Penthouse Suite',
    vipTier: '⭐ Royal Patron Society',
    memberSince: '18 Nov 2020',
    phone: '+1 415 892 3310',
    email: 'vance.family@vance-holdings.com',
    currentStay: {
      arrival: 'Today · Arriving 14:00',
      departure: 'Sun 25 Oct',
      nights: 4,
      status: 'Expected Today (Pre-Checked In)',
      roomRatePerNight: 40000,
    },
    previousStays: [
      { stayRef: 'STAY-2025-067', dates: '22 Jun - 26 Jun 2025', room: '310', roomType: 'Penthouse Suite', totalSpend: 195000 },
    ],
    preferences: {
      pillow: 'Down surround medium pillows with silk pillowcases',
      roomTemp: '20.5°C ambient climate',
      floorZone: 'East Garden Wing secluded corridor',
      newspaper: 'The Wall Street Journal',
    },
    dietary: {
      restrictions: 'Gluten-free & Organic produce only',
      allergies: 'No known medical allergies',
      preferences: 'Sommelier vintage French champagne & artisan dark chocolate truffles',
    },
    occasionsNotes: {
      milestone: '🥂 10th Wedding Anniversary',
      notes: 'Surprise private beachside gazebo candlelit dinner booked for Friday 19:30.',
      vipProtocol: 'Chilled vintage champagne & floral canopy setup confirmed for 18:00',
    },
    serviceRecoveryHistory: [],
    financialHistory: [
      { ref: 'DEP-310-99', type: 'Anniversary Package Deposit', amount: 160000, date: '18 Oct', status: 'Settled' },
    ],
    timeline: [
      { at: '18 Oct, 10:00 AM', action: 'Online Pre-Check-In and Passport Verification Completed', staff: 'Guest Portal' },
      { at: 'Today, 08:30 AM', action: 'Suite 310 Housekeeping VIP Inspection Signed Off', staff: 'Meera Nambiar (Supervisor)' },
      { at: 'Today, 11:00 AM', action: 'Florist deliver bespoke red rose canopy in master bedroom', staff: 'Banquet Decor Team' },
    ],
  },
};

export function VipPreviewPanel({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const { state, fdAction } = useDemo();

  // Active top-level subtab: 'profiles' vs 'requests'
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'requests'>('profiles');

  // Modals & Drawers
  const [selectedVipProfile, setSelectedVipProfile] = useState<VipDetailedProfile | null>(null);
  const [activeFolioStay, setActiveFolioStay] = useState<StayRecord | null>(null);
  const [activeMessageStay, setActiveMessageStay] = useState<StayRecord | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Add New VIP Member Modal
  const [showAddVipModal, setShowAddVipModal] = useState(false);
  const [addVipForm, setAddVipForm] = useState({
    guestName: '',
    roomNo: '',
    contactPhone: '',
    contactEmail: '',
    vipTier: "👑 Chairman's Club",
    membershipDate: new Date().toISOString().split('T')[0],
    designationReason: '',
    pillowPreference: 'Hypoallergenic foam & goose down',
    dietaryPreferences: 'Nut-Free · Organic produce',
    specialInstructions: 'GM personal welcome letter & orchid bouquet on arrival',
    internalNotes: 'Executive corporate account partner.',
  });
  const [addVipConfirmStep, setAddVipConfirmStep] = useState(false);
  const [addVipError, setAddVipError] = useState<string | null>(null);

  // Detail Modal for VIP Requests
  const [activeRequestDetail, setActiveRequestDetail] = useState<WorkItem | null>(null);
  const [forwardDept, setForwardDept] = useState<RouteDept>('housekeeping');
  const [forwardNotes, setForwardNotes] = useState('');
  const [forwardSuccess, setForwardSuccess] = useState(false);

  const stays = state.frontDesk?.stays ?? [];
  const vipStays = stays.filter((s) => s.vip);

  // VIP Requests from shared queue: Priority VIP or room belonging to VIP guest
  const allDeskRequests = state.items.front_desk_coordinator ?? [];
  const vipRoomNumbers = useMemo(() => new Set(vipStays.map((s) => s.room)), [vipStays]);
  const vipRequests = useMemo(() => {
    return allDeskRequests.filter(
      (item) => item.priority === 'vip' || (item.room && vipRoomNumbers.has(item.room))
    );
  }, [allDeskRequests, vipRoomNumbers]);

  // Helper for initials
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  // Helper for stay status pill
  const getStayStatusBadge = (st: StayRecord) => {
    if (st.status === 'in_house') {
      if (st.departsToday) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
            <Clock className="h-3 w-3" /> Late Checkout 16:00
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
          <CheckCircle2 className="h-3 w-3" /> In-House
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-400/15 text-sky-300 border border-sky-400/30">
        <Clock className="h-3 w-3" /> Arriving 14:00
      </span>
    );
  };

  const handleOpenDetailedProfile = (st: StayRecord) => {
    const existing = VIP_PROFILES_DATA[st.id];
    if (existing) {
      setSelectedVipProfile(existing);
    } else {
      // Dynamic profile fallback
      setSelectedVipProfile({
        id: st.id,
        guestId: `VIP-REG-${st.room}`,
        guest: st.guest,
        room: st.room,
        roomType: st.roomType,
        vipTier: st.vipTier ?? "👑 Chairman's Club",
        memberSince: '2023',
        phone: '+91 98200 11200',
        email: `${st.guest.toLowerCase().replace(/[^a-z]/g, '')}@vip.thegrandadp.com`,
        currentStay: {
          arrival: st.arrival,
          departure: st.departure,
          nights: st.nights,
          status: st.status === 'in_house' ? 'In-House' : 'Expected Arrival',
          roomRatePerNight: 35000,
        },
        previousStays: [
          { stayRef: 'STAY-PREV-01', dates: 'Previous Year Stay', room: st.room, roomType: st.roomType, totalSpend: 105000 },
        ],
        preferences: {
          pillow: 'Hypoallergenic plush down pillows',
          roomTemp: '20.5°C ambient',
          floorZone: 'Quiet wing',
          newspaper: 'Daily National Edition',
        },
        dietary: {
          restrictions: st.dietarySummary ?? 'Nut-Free',
          allergies: 'No recorded anaphylaxis',
          preferences: 'Fresh cut fruit platter & mineral water',
        },
        occasionsNotes: {
          milestone: st.milestone ?? 'Executive Stay',
          notes: 'High-value guest. Expedite all requests immediately.',
          vipProtocol: st.gmStatus ?? '✓ GM Welcome Card Placed',
        },
        serviceRecoveryHistory: [],
        financialHistory: [],
        timeline: [
          { at: 'Today 09:00 AM', action: 'VIP Registration checked by Front Desk', staff: 'Sunita Patel' },
        ],
      });
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setMessageText('');
      setActiveMessageStay(null);
    }, 1200);
  };

  // Add VIP Member Form Submission
  const handleAddVipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddVipError(null);

    if (!addVipForm.guestName.trim()) {
      setAddVipError('Guest name is required.');
      return;
    }

    if (!addVipForm.contactPhone.trim() && !addVipForm.contactEmail.trim()) {
      setAddVipError('Please provide a contact phone number or email.');
      return;
    }

    // Check duplicate
    const exists = vipStays.some(
      (s) => s.guest.toLowerCase() === addVipForm.guestName.trim().toLowerCase()
    );
    if (exists) {
      setAddVipError('This guest is already registered as an active VIP member.');
      return;
    }

    // Advance to confirmation step
    setAddVipConfirmStep(true);
  };

  const handleConfirmAddVip = () => {
    if (!fdAction) return;

    fdAction((s) => {
      const targetRoom = addVipForm.roomNo.trim() || '405';
      const newStayId = `stay-vip-${Date.now()}`;

      // Check if existing stay for room
      const existingStayIndex = s.frontDesk?.stays.findIndex(
        (st) => st.guest.toLowerCase() === addVipForm.guestName.toLowerCase() || st.room === targetRoom
      );

      if (existingStayIndex !== undefined && existingStayIndex >= 0) {
        // Upgrade existing stay to VIP
        s.frontDesk.stays[existingStayIndex].vip = true;
        s.frontDesk.stays[existingStayIndex].vipTier = addVipForm.vipTier;
        s.frontDesk.stays[existingStayIndex].milestone = addVipForm.designationReason || 'Executive VIP';
        s.frontDesk.stays[existingStayIndex].dietarySummary = addVipForm.dietaryPreferences;
        s.frontDesk.stays[existingStayIndex].preferencesSummary = addVipForm.pillowPreference;
        s.frontDesk.stays[existingStayIndex].gmStatus = '✓ GM Welcome Protocol Active';
      } else {
        // Add new VIP stay record
        const newStay: StayRecord = {
          id: newStayId,
          guest: addVipForm.guestName.trim(),
          room: targetRoom,
          roomType: 'Deluxe Suite',
          vip: true,
          vipTier: addVipForm.vipTier,
          arrival: 'Today · Registered at Desk',
          departure: 'Sun 25 Oct',
          nights: 3,
          status: 'in_house',
          milestone: addVipForm.designationReason || 'Executive VIP Member',
          dietarySummary: addVipForm.dietaryPreferences,
          preferencesSummary: addVipForm.pillowPreference,
          gmStatus: '✓ GM Welcome Protocol Active',
          preCheckIn: 'verified',
          idChecked: true,
          paid: 0,
          cardMask: '•••• 8899',
        };
        s.frontDesk.stays = [newStay, ...(s.frontDesk.stays || [])];
      }

      // Add audit feed entry
      s.feed = [
        {
          id: `feed-vip-${Date.now()}`,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: 'Front Desk',
          text: `VIP Member Registration: ${addVipForm.guestName} enrolled into ${addVipForm.vipTier}`,
        },
        ...s.feed,
      ];

      return { next: s, message: `VIP Member ${addVipForm.guestName} registered successfully` };
    });

    setShowAddVipModal(false);
    setAddVipConfirmStep(false);
    setAddVipForm({
      guestName: '',
      roomNo: '',
      contactPhone: '',
      contactEmail: '',
      vipTier: "👑 Chairman's Club",
      membershipDate: new Date().toISOString().split('T')[0],
      designationReason: '',
      pillowPreference: 'Hypoallergenic foam & goose down',
      dietaryPreferences: 'Nut-Free · Organic produce',
      specialInstructions: 'GM personal welcome letter & orchid bouquet on arrival',
      internalNotes: 'Executive corporate account partner.',
    });
  };

  // Forward VIP Request to Department
  const handleForwardVipRequest = () => {
    if (!activeRequestDetail || !fdAction) return;

    fdAction((s) => routeRequest(s, activeRequestDetail.id, forwardDept));
    setForwardSuccess(true);
    setTimeout(() => {
      setForwardSuccess(false);
      setActiveRequestDetail(null);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Subtab Toggle Bar + Add VIP Member Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('profiles')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeSubTab === 'profiles'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            )}
          >
            <Crown className="h-3.5 w-3.5" />
            <span>VIP Members &amp; Profiles</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-black/20">
              {vipStays.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeSubTab === 'requests'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>VIP Active Requests &amp; SLA</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-black/20">
              {vipRequests.length}
            </span>
          </button>
        </div>

        <Button
          size="sm"
          variant="accent"
          iconLeft={UserPlus}
          onClick={() => {
            setAddVipConfirmStep(false);
            setAddVipError(null);
            setShowAddVipModal(true);
          }}
          className="shrink-0"
        >
          + Add VIP Member
        </Button>
      </div>

      {/* VIEW 1: VIP Profiles Grid */}
      {activeSubTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
          {vipStays.map((st) => {
            const initials = getInitials(st.guest);

            return (
              <div
                key={st.id}
                className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-4 hover:border-amber-400/40 transition-all duration-200 shadow-xl flex flex-col justify-between"
              >
                {/* Card Header Row */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-full shrink-0 bg-gradient-to-br from-amber-400/25 to-amber-600/30 border border-amber-400/40 flex items-center justify-center font-bold text-amber-200 text-sm shadow-md">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-white truncate tracking-tight">{st.guest}</h3>
                        <p className="text-xs text-mist-300 font-medium truncate">
                          Room {st.room} · {st.roomType}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
                      {st.vipTier ?? "👑 Chairman's Club"}
                    </span>
                    {getStayStatusBadge(st)}
                  </div>
                </div>

                {/* Key Info Chips */}
                <div className="space-y-2 rounded-xl bg-white/[0.03] border border-white/5 p-3 text-xs">
                  {/* Milestone / Occasion */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-mist-400 shrink-0">Milestone:</span>
                    <span className="font-semibold text-amber-200 text-xs truncate">
                      {st.milestone ?? '💼 Executive VIP Stay'}
                    </span>
                  </div>

                  {/* Dietary / Allergies */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-mist-400 shrink-0">Dietary:</span>
                    <span className="font-semibold text-rose-300 text-xs truncate">
                      {st.dietarySummary ?? '🥜 Severe Nut Allergy'}
                    </span>
                  </div>

                  {/* Room & Arrival Preferences */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-mist-400 shrink-0">Preferences:</span>
                    <span className="font-semibold text-mist-200 text-xs truncate">
                      {st.preferencesSummary ?? '🛏️ Hypoallergenic Pillows'}
                    </span>
                  </div>
                </div>

                {/* Protocol Badge & Detailed View Action */}
                <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{st.gmStatus ?? '✓ GM Welcome Card Placed'}</span>
                    </span>
                  </div>

                  {/* Complete VIP Profile Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenDetailedProfile(st)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-xs font-bold text-amber-200 hover:text-amber-100 transition shadow-sm cursor-pointer"
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <span>View Complete VIP Profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveMessageStay(st)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-mist-200 hover:text-white transition shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                      <span>Message</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFolioStay(st)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-amber-200 hover:text-amber-100 transition shadow-sm cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      <span>Folio</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: VIP Active Requests & SLA Subsection (Requirement 2C) */}
      {activeSubTab === 'requests' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <Crown className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Displaying real-time requests initiated by VIP Guests. Prioritized under Front Desk VIP Service Authority.
              </span>
            </div>
            <span className="font-bold text-amber-300 tabular-nums">
              {vipRequests.filter((r) => r.status !== 'Done' && r.status !== 'Resolved').length} Active
            </span>
          </div>

          {vipRequests.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white">No pending VIP requests</p>
              <p className="text-xs text-mist-400 mt-1">All VIP guest requests have been resolved on schedule.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {vipRequests.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/10 bg-ink-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs hover:border-amber-400/30 transition shadow-sm"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        👑 VIP REQUEST
                      </span>
                      <span className="font-bold text-white text-sm truncate">{item.title}</span>
                      {item.room && <Badge tone="neutral">Room {item.room}</Badge>}
                      <Badge tone={item.status === 'Done' || item.status === 'Resolved' ? 'success' : 'warning'}>
                        {item.status}
                      </Badge>
                      {item.ref && <span className="text-[11px] font-mono text-mist-400">{item.ref}</span>}
                    </div>

                    <p className="text-mist-200 text-xs">{item.description ?? item.meta}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-mist-400">
                      <span>Created: {item.createdAt ?? 'Today'}</span>
                      {item.department && <span>· Dept: {item.department}</span>}
                      {item.assignee && <span className="text-cyan-300">· Assigned: {item.assignee}</span>}
                      {item.slaDue && <span className="text-amber-300">· SLA Due: {item.slaDue}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => setActiveRequestDetail(item)}
                    >
                      View Details
                    </Button>

                    {item.status !== 'Done' && item.status !== 'Resolved' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (fdAction) fdAction((s) => requestStep(s, item.id, { kind: 'accepted' }));
                          }}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => {
                            if (fdAction) fdAction((s) => escalateRequest(s, item.id));
                          }}
                        >
                          Escalate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: VIP COMPLETE PROFILE DRAWER / MODAL (Requirement 2A) */}
      {selectedVipProfile && (
        <Modal
          title={`VIP Member Profile · ${selectedVipProfile.guest}`}
          description={`Membership ID: ${selectedVipProfile.guestId} · Member Since: ${selectedVipProfile.memberSince}`}
          onClose={() => setSelectedVipProfile(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-mist-400">Station FD-02 · Verified VIP Profile</span>
              <Button variant="accent" onClick={() => setSelectedVipProfile(null)}>
                Close Profile
              </Button>
            </div>
          }
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
            {/* Top Identity Header */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-transparent border border-amber-400/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-bold text-amber-200 text-base">
                  {getInitials(selectedVipProfile.guest)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedVipProfile.guest}</h3>
                  <p className="text-[11px] text-amber-300 font-semibold">{selectedVipProfile.vipTier}</p>
                  <p className="text-[10px] text-mist-400">Current Room {selectedVipProfile.room} · {selectedVipProfile.roomType}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                  {selectedVipProfile.currentStay.status}
                </span>
                <p className="text-[10px] text-mist-400 mt-1">₹{selectedVipProfile.currentStay.roomRatePerNight.toLocaleString('en-IN')}/night</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-mist-400 block">Phone</span>
                  <span className="font-semibold text-white">{selectedVipProfile.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-mist-400 block">Email</span>
                  <span className="font-semibold text-white truncate max-w-[170px] block">{selectedVipProfile.email}</span>
                </div>
              </div>
            </div>

            {/* Preferences & Dietary Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Special Preferences &amp; Requirements</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-mist-400 font-semibold uppercase block">Room Preferences</span>
                  <p className="text-mist-200"><strong className="text-white">Pillow:</strong> {selectedVipProfile.preferences.pillow}</p>
                  <p className="text-mist-200"><strong className="text-white">Climate:</strong> {selectedVipProfile.preferences.roomTemp}</p>
                  <p className="text-mist-200"><strong className="text-white">Zone:</strong> {selectedVipProfile.preferences.floorZone}</p>
                  <p className="text-mist-200"><strong className="text-white">Press:</strong> {selectedVipProfile.preferences.newspaper}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-mist-400 font-semibold uppercase block">Dietary &amp; Allergies</span>
                  <p className="text-rose-300"><strong className="text-white">Allergies:</strong> {selectedVipProfile.dietary.allergies}</p>
                  <p className="text-mist-200"><strong className="text-white">Diet:</strong> {selectedVipProfile.dietary.restrictions}</p>
                  <p className="text-mist-200"><strong className="text-white">Beverages:</strong> {selectedVipProfile.dietary.preferences}</p>
                </div>
              </div>
            </div>

            {/* Occasion & VIP Protocol Notes */}
            <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/25 space-y-1.5">
              <span className="text-[10px] text-amber-300 font-semibold uppercase block">Special Occasion &amp; Concierge Protocol</span>
              <p className="font-semibold text-white">{selectedVipProfile.occasionsNotes.milestone}</p>
              <p className="text-mist-200">{selectedVipProfile.occasionsNotes.notes}</p>
              <div className="pt-1 text-[11px] text-emerald-300 font-medium">
                {selectedVipProfile.occasionsNotes.vipProtocol}
              </div>
            </div>

            {/* Previous Stays History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-sky-400" />
                <span>Stay &amp; Folio History</span>
              </h4>
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {selectedVipProfile.previousStays.map((st) => (
                  <div key={st.stayRef} className="p-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{st.dates} ({st.roomType})</p>
                      <p className="text-[10px] text-mist-400">Ref: {st.stayRef} · Room {st.room}</p>
                    </div>
                    <span className="font-bold text-amber-300 tabular-nums">
                      ₹{st.totalSpend.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Recovery & Complaints History */}
            {selectedVipProfile.serviceRecoveryHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  <span>Service Recovery &amp; Compensation Log</span>
                </h4>
                <div className="space-y-2">
                  {selectedVipProfile.serviceRecoveryHistory.map((sr) => (
                    <div key={sr.id} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{sr.issue}</span>
                        <span className="text-rose-300 tabular-nums">₹{sr.compensationAmount.toLocaleString('en-IN')} Comp</span>
                      </div>
                      <p className="text-mist-300 text-[11px] mt-0.5">{sr.resolution}</p>
                      <span className="text-[10px] text-mist-400 mt-1 block">Logged: {sr.date} · {sr.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>VIP Service Activity Timeline</span>
              </h4>
              <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/10">
                {selectedVipProfile.timeline.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-white font-medium">{entry.action}</span>
                      <p className="text-[10px] text-mist-400">{entry.at} · {entry.staff}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: ADD NEW VIP GUEST (Requirement 2B) */}
      {showAddVipModal && (
        <Modal
          title={addVipConfirmStep ? 'Confirm VIP Registration' : 'Register New VIP Member'}
          description={
            addVipConfirmStep
              ? 'Please review VIP membership details before confirming enrollment.'
              : 'Enroll an existing in-house guest or register a new VIP profile.'
          }
          onClose={() => setShowAddVipModal(false)}
        >
          {addVipError && (
            <div className="p-3 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{addVipError}</span>
            </div>
          )}

          {!addVipConfirmStep ? (
            <form onSubmit={handleAddVipSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Guest Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Anand Verma"
                  value={addVipForm.guestName}
                  onChange={(e) => setAddVipForm({ ...addVipForm, guestName: e.target.value })}
                  className="field w-full text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">Assigned Room</label>
                  <input
                    type="text"
                    placeholder="e.g. 405"
                    value={addVipForm.roomNo}
                    onChange={(e) => setAddVipForm({ ...addVipForm, roomNo: e.target.value })}
                    className="field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">VIP Membership Category *</label>
                  <select
                    value={addVipForm.vipTier}
                    onChange={(e) => setAddVipForm({ ...addVipForm, vipTier: e.target.value })}
                    className="field w-full text-xs font-semibold text-amber-300"
                  >
                    <option value="👑 Chairman's Club">👑 Chairman&apos;s Club</option>
                    <option value="💎 Ambassador VIP">💎 Ambassador VIP</option>
                    <option value="⭐ Royal Patron Society">⭐ Royal Patron Society</option>
                    <option value="🌟 Executive Privileged">🌟 Executive Privileged</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">Contact Phone *</label>
                  <input
                    type="tel"
                    placeholder="+91 98..."
                    value={addVipForm.contactPhone}
                    onChange={(e) => setAddVipForm({ ...addVipForm, contactPhone: e.target.value })}
                    className="field w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">Contact Email</label>
                  <input
                    type="email"
                    placeholder="guest@domain.com"
                    value={addVipForm.contactEmail}
                    onChange={(e) => setAddVipForm({ ...addVipForm, contactEmail: e.target.value })}
                    className="field w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Reason for VIP Designation</label>
                <input
                  type="text"
                  placeholder="e.g. High-net-worth corporate account sponsor / Diplomatic delegate"
                  value={addVipForm.designationReason}
                  onChange={(e) => setAddVipForm({ ...addVipForm, designationReason: e.target.value })}
                  className="field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">Pillow / Room Preferences</label>
                  <input
                    type="text"
                    value={addVipForm.pillowPreference}
                    onChange={(e) => setAddVipForm({ ...addVipForm, pillowPreference: e.target.value })}
                    className="field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">Dietary Preferences &amp; Allergies</label>
                  <input
                    type="text"
                    value={addVipForm.dietaryPreferences}
                    onChange={(e) => setAddVipForm({ ...addVipForm, dietaryPreferences: e.target.value })}
                    className="field w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Special Concierge Protocols</label>
                <textarea
                  rows={2}
                  value={addVipForm.specialInstructions}
                  onChange={(e) => setAddVipForm({ ...addVipForm, specialInstructions: e.target.value })}
                  className="field w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button variant="subtle" type="button" onClick={() => setShowAddVipModal(false)}>
                  Cancel
                </Button>
                <Button variant="accent" type="submit">
                  Continue to Confirmation
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{addVipForm.guestName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-ink-950">
                    {addVipForm.vipTier}
                  </span>
                </div>
                <p className="text-mist-200">Room: {addVipForm.roomNo || 'Auto-assign Suite'}</p>
                <p className="text-mist-200">Phone: {addVipForm.contactPhone} · Email: {addVipForm.contactEmail || 'N/A'}</p>
                <p className="text-mist-300 text-[11px]">Reason: {addVipForm.designationReason || 'Standard VIP Promotion'}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-mist-300 space-y-1 text-[11px]">
                <p className="font-semibold text-white">Enrollment Confirmation Notice:</p>
                <p>• VIP status badge will immediately activate across Front Desk, Housekeeping and Concierge boards.</p>
                <p>• Duty Manager &amp; GM welcome protocols will be triggered.</p>
                <p>• Action will be permanently logged in the property audit trail.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button variant="subtle" onClick={() => setAddVipConfirmStep(false)}>
                  Back
                </Button>
                <Button variant="accent" iconLeft={Check} onClick={handleConfirmAddVip}>
                  Confirm &amp; Register VIP
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL 3: VIEW & FORWARD VIP REQUEST (Requirement 2C) */}
      {activeRequestDetail && (
        <Modal
          title={`VIP Request Details · ${activeRequestDetail.title}`}
          description={`Room ${activeRequestDetail.room ?? 'General'} · Ref: ${activeRequestDetail.ref ?? activeRequestDetail.id}`}
          onClose={() => setActiveRequestDetail(null)}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="subtle" onClick={() => setActiveRequestDetail(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                iconLeft={Send}
                onClick={handleForwardVipRequest}
                disabled={forwardSuccess}
              >
                {forwardSuccess ? 'Forwarded ✓' : 'Forward to Department'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{activeRequestDetail.title}</span>
                <Badge tone="accent">VIP Priority</Badge>
              </div>
              <p className="text-mist-200">{activeRequestDetail.description ?? activeRequestDetail.meta}</p>
              <div className="flex items-center gap-3 text-[11px] text-mist-400 pt-1">
                <span>Status: <strong className="text-white">{activeRequestDetail.status}</strong></span>
                {activeRequestDetail.department && <span>· Dept: {activeRequestDetail.department}</span>}
                {activeRequestDetail.assignee && <span>· Assignee: {activeRequestDetail.assignee}</span>}
              </div>
            </div>

            {/* Department Forwarding Controls */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <label className="font-semibold text-mist-300 block">Forward to Responsible Department:</label>
              <select
                value={forwardDept}
                onChange={(e) => setForwardDept(e.target.value as RouteDept)}
                className="field w-full text-xs font-semibold"
              >
                <option value="housekeeping">Housekeeping (Turnover, Amenities &amp; Cleanliness)</option>
                <option value="maintenance">Maintenance &amp; Engineering (HVAC, Electrical, Plumbing)</option>
                <option value="room_service">Food &amp; Beverage (Banquets, Room Service &amp; Pantry)</option>
                <option value="spa">Spa &amp; Wellness (Treatments, Cabanas &amp; Fitness)</option>
              </select>

              <textarea
                rows={2}
                placeholder="Add special VIP handling instructions for the department supervisor..."
                value={forwardNotes}
                onChange={(e) => setForwardNotes(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            {forwardSuccess && (
              <p className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-4 w-4" /> Request forwarded to {forwardDept} queue successfully.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* View Folio Modal */}
      {activeFolioStay && (
        <Modal
          title={`Guest Folio · ${activeFolioStay.guest}`}
          description={`Room ${activeFolioStay.room} · ${activeFolioStay.roomType} · VIP`}
          onClose={() => setActiveFolioStay(null)}
          footer={
            <Button variant="subtle" onClick={() => setActiveFolioStay(null)}>
              Close Folio
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div>
                <span className="text-xs text-mist-400 block">Stay Duration</span>
                <span className="text-sm font-semibold text-white">
                  {activeFolioStay.arrival} → {activeFolioStay.departure}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-mist-400 block">Settlement Status</span>
                <span className="text-sm font-bold text-emerald-400">
                  {activeFolioStay.paid > 0 ? `${money(activeFolioStay.paid)} Settled` : 'Pre-Authorized Token'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300">Folio Line Items</h4>
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {(folioSeed[activeFolioStay.room] ?? [
                  { id: 'item-1', label: `${activeFolioStay.roomType} (4 nights)`, amount: 1800, date: 'Today' },
                  { id: 'item-2', label: 'Resort Fee & VIP Lounge Access', amount: 90, date: 'Today' },
                ]).map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-[11px] text-mist-400">{item.date}</p>
                    </div>
                    <span className="font-semibold text-white">{money(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Message Guest Modal */}
      {activeMessageStay && (
        <Modal
          title={`Direct Message · Room ${activeMessageStay.room}`}
          description={`Recipient: ${activeMessageStay.guest} (${activeMessageStay.vipTier ?? 'VIP'})`}
          onClose={() => {
            setActiveMessageStay(null);
            setMessageSent(false);
          }}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="subtle"
                onClick={() => {
                  setActiveMessageStay(null);
                  setMessageSent(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleSendMessage}
                disabled={!messageText.trim() || messageSent}
              >
                {messageSent ? 'Sent ✓' : 'Send Message'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-mist-300">
              Sends an instant Front Desk VIP message to the guest&apos;s mobile portal and active in-room tablet.
            </p>
            <div className="relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Type a personalized concierge message for ${activeMessageStay.guest}...`}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white placeholder-mist-400 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50 resize-none"
              />
            </div>
            {messageSent && (
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Message successfully dispatched to Room {activeMessageStay.room}.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
