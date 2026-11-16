'use client';

import { useState, useMemo } from 'react';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Send,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  ArrowRight,
  Check,
  Inbox,
  Receipt,
  X,
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
  roomPreferences: string;
  foodPreferences: string;
  notes: string;
  gmProtocol?: string;
  verifiedBy?: string;
  totalSpend: number;
  timeline: Array<{
    at: string;
    action: string;
    staff: string;
  }>;
}

// Rich detailed profiles for VIP guests
const GM_VIP_PROFILES_DATA: Record<string, VipDetailedProfile> = {
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
    roomPreferences: 'Hypoallergenic goose down & memory foam pillows. 20.0°C ambient climate. High floor quiet executive wing. Printed morning Financial Times.',
    foodPreferences: 'Strictly nut-free culinary protocol. Severe peanut & tree nut anaphylactic allergy. Organic high-altitude Darjeeling tea.',
    notes: 'Executive Board Global Summit stay. Requires absolute confidentiality. Do not distribute room keys without photo ID verification.',
    gmProtocol: '✓ GM Welcome Card Placed',
    verifiedBy: 'Front Desk',
    totalSpend: 420000,
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
      arrival: 'Wed 21 Oct',
      departure: 'Fri 23 Oct · Normal Checkout',
      nights: 2,
      status: 'In-House',
      roomRatePerNight: 65000,
    },
    roomPreferences: 'Presidential Master Suite setup. Firm orthopaedic mattress. Lavender aromatherapy diffuser active on turn-down.',
    foodPreferences: 'Jain vegetarian culinary guidelines. Fresh tender coconut water upon wake-up. No garlic or onion.',
    notes: 'Managing Director, South Asian hospitality conglomerate. Extended courtesy car airport transfer on departure.',
    gmProtocol: '✓ GM Welcome Card Placed',
    verifiedBy: 'Front Desk',
    totalSpend: 580000,
    timeline: [
      { at: '21 Oct, 02:15 PM', action: 'Personal Greeting at Hotel Portico', staff: 'Priya Nair (GM)' },
      { at: '21 Oct, 03:00 PM', action: 'Bespoke high-tea hamper delivered to suite', staff: 'Pastry Chef Team' },
      { at: 'Yesterday, 07:00 PM', action: 'Private dining arrangement confirmed at Terrace Pergola', staff: 'F&B Manager' },
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
    roomPreferences: 'Down surround medium pillows with silk pillowcases. 20.5°C ambient climate. East Garden Wing secluded corridor. The Wall Street Journal.',
    foodPreferences: 'Gluten-free & Organic produce only. No known medical allergies. Sommelier vintage French champagne & artisan dark chocolate truffles.',
    notes: '10th Wedding Anniversary celebration. Surprise private beachside gazebo candlelit dinner booked for Friday 19:30. Chilled vintage champagne confirmed.',
    gmProtocol: '✓ GM Welcome Card Placed',
    verifiedBy: 'Front Desk',
    totalSpend: 355000,
    timeline: [
      { at: '18 Oct, 10:00 AM', action: 'Online Pre-Check-In and Passport Verification Completed', staff: 'Guest Portal' },
      { at: 'Today, 08:30 AM', action: 'Suite 310 Housekeeping VIP Inspection Signed Off', staff: 'Meera Nambiar (Supervisor)' },
      { at: 'Today, 11:00 AM', action: 'Florist deliver bespoke red rose canopy in master bedroom', staff: 'Banquet Decor Team' },
    ],
  },
};

interface GeneralManagerVipTabProps {
  onNavigateTab?: (tabId: string, filter?: Record<string, string>) => void;
}

export function GeneralManagerVipTab({ onNavigateTab: _onNavigateTab }: GeneralManagerVipTabProps) {
  const { state, fdAction } = useDemo();

  // Active subtab: 'profiles' vs 'requests'
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'requests'>('profiles');

  // Modals
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
    vipTier: 'In-House VIP',
    contactPhone: '',
    contactEmail: '',
    roomPreferences: '',
    foodPreferences: '',
    note: '',
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
    const existing =
      GM_VIP_PROFILES_DATA[st.id] ??
      Object.values(GM_VIP_PROFILES_DATA).find(
        (p) => p.room === st.room || p.guest.toLowerCase() === st.guest.toLowerCase()
      );

    if (existing) {
      setSelectedVipProfile({
        ...existing,
        verifiedBy: st.verifiedBy || existing.verifiedBy || 'Front Desk',
      });
    } else {
      setSelectedVipProfile({
        id: st.id,
        guestId: `VIP-REG-${st.room}`,
        guest: st.guest,
        room: st.room,
        roomType: st.roomType,
        vipTier: st.vipTier ?? 'In-House VIP',
        memberSince: '2024',
        phone: '+91 98200 11200',
        email: `${st.guest.toLowerCase().replace(/[^a-z0-9]/g, '')}@vip.thegrandadp.com`,
        currentStay: {
          arrival: st.arrival,
          departure: st.departure,
          nights: st.nights,
          status: st.status === 'in_house' ? 'In-House' : 'Expected Arrival',
          roomRatePerNight: 35000,
        },
        roomPreferences: st.preferencesSummary || 'Hypoallergenic pillows and quiet floor',
        foodPreferences: st.dietarySummary || 'Standard dietary protocol',
        notes: st.milestone || 'High-value guest. Expedite all requests immediately.',
        gmProtocol: st.gmStatus ?? '✓ GM Welcome Card Placed',
        verifiedBy: st.verifiedBy || 'Front Desk',
        totalSpend: st.paid && st.paid > 0 ? st.paid : 105000,
        timeline: [
          { at: 'Today 09:00 AM', action: 'VIP Registration validated', staff: 'General Manager Desk' },
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

    const exists = vipStays.some(
      (s) => s.guest.toLowerCase() === addVipForm.guestName.trim().toLowerCase()
    );
    if (exists) {
      setAddVipError('This guest is already registered as an active VIP member.');
      return;
    }

    setAddVipConfirmStep(true);
  };

  const handleConfirmAddVip = () => {
    if (!fdAction) return;

    const rawRoom = addVipForm.roomNo.trim();
    const roomMatch = rawRoom.match(/\b\d{3,4}\b/);
    const targetRoom = roomMatch ? roomMatch[0] : (rawRoom.replace(/[^0-9]/g, '') || '518');
    const targetRoomType = rawRoom.includes('·')
      ? rawRoom.split('·')[1].trim()
      : (rawRoom.toLowerCase().includes('suite') ? rawRoom : 'Executive VIP Suite');

    const newStayId = `stay-vip-${Date.now()}`;

    fdAction((s) => {
      const existingStayIndex = s.frontDesk?.stays.findIndex(
        (st) => st.guest.toLowerCase() === addVipForm.guestName.trim().toLowerCase() || st.room === targetRoom
      );

      if (existingStayIndex !== undefined && existingStayIndex >= 0) {
        s.frontDesk.stays[existingStayIndex].vip = true;
        s.frontDesk.stays[existingStayIndex].vipTier = addVipForm.vipTier;
        s.frontDesk.stays[existingStayIndex].milestone = addVipForm.note || 'In-House VIP';
        s.frontDesk.stays[existingStayIndex].dietarySummary = addVipForm.foodPreferences || 'Standard Protocol';
        s.frontDesk.stays[existingStayIndex].preferencesSummary = addVipForm.roomPreferences || 'Hypoallergenic Pillows';
        s.frontDesk.stays[existingStayIndex].gmStatus = '✓ GM Welcome Card Placed';
        s.frontDesk.stays[existingStayIndex].verifiedBy = 'General Manager';
      } else {
        const newStay: StayRecord = {
          id: newStayId,
          guest: addVipForm.guestName.trim(),
          room: targetRoom,
          roomType: targetRoomType,
          vip: true,
          vipTier: addVipForm.vipTier,
          arrival: 'Today · Registered by GM',
          departure: 'Sun 25 Oct',
          nights: 3,
          status: 'in_house',
          milestone: addVipForm.note || 'Executive VIP Member',
          dietarySummary: addVipForm.foodPreferences || 'Standard Protocol',
          preferencesSummary: addVipForm.roomPreferences || 'Hypoallergenic Pillows',
          gmStatus: '✓ GM Welcome Card Placed',
          verifiedBy: 'General Manager',
          preCheckIn: 'verified',
          idChecked: true,
          paid: 185000,
          cardMask: '•••• 8899',
        };
        s.frontDesk.stays = [newStay, ...(s.frontDesk.stays || [])];
      }

      s.feed = [
        {
          id: `feed-vip-${Date.now()}`,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: 'General Manager',
          text: `VIP Member Registration: ${addVipForm.guestName.trim()} enrolled into ${addVipForm.vipTier} (Verified by GM)`,
        },
        ...s.feed,
      ];

      return { next: s, message: `VIP Member ${addVipForm.guestName.trim()} registered successfully` };
    });

    GM_VIP_PROFILES_DATA[newStayId] = {
      id: newStayId,
      guestId: `VIP-${targetRoom}-${Date.now().toString().slice(-4)}`,
      guest: addVipForm.guestName.trim(),
      room: targetRoom,
      roomType: targetRoomType,
      vipTier: addVipForm.vipTier,
      memberSince: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      phone: addVipForm.contactPhone.trim() || '+91 98200 11200',
      email:
        addVipForm.contactEmail.trim() ||
        `${addVipForm.guestName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@vip.thegrandadp.com`,
      currentStay: {
        arrival: 'Today · Registered by GM',
        departure: 'Sun 25 Oct',
        nights: 3,
        status: 'In-House',
        roomRatePerNight: 45000,
      },
      roomPreferences: addVipForm.roomPreferences.trim() || 'Hypoallergenic pillows and quiet floor',
      foodPreferences: addVipForm.foodPreferences.trim() || 'No specific dietary restrictions recorded',
      notes: addVipForm.note.trim() || 'VIP member registered by General Manager.',
      gmProtocol: '✓ GM Welcome Card Placed',
      verifiedBy: 'General Manager',
      totalSpend: 185000,
      timeline: [
        {
          at: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: `VIP Member Registration enrolled into ${addVipForm.vipTier}`,
          staff: 'Priya Nair (General Manager)',
        },
      ],
    };

    setShowAddVipModal(false);
    setAddVipConfirmStep(false);
    setAddVipForm({
      guestName: '',
      roomNo: '',
      vipTier: 'In-House VIP',
      contactPhone: '',
      contactEmail: '',
      roomPreferences: '',
      foodPreferences: '',
      note: '',
    });
  };

  const handleAddVipGuest = handleConfirmAddVip;

  const handleForwardVipRequest = () => {
    if (!activeRequestDetail || !fdAction) return;

    fdAction((s) => {
      const res = routeRequest(s, activeRequestDetail.id, forwardDept);
      if ('error' in res) {
        return { error: res.error };
      }
      const nextState = res.next;
      nextState.feed = [
        {
          id: `feed-vip-fwd-${Date.now()}`,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: 'General Manager',
          text: `VIP Request [${activeRequestDetail.ref || activeRequestDetail.id}] routed to ${forwardDept}: ${forwardNotes || 'High Priority VIP fulfillment'}`,
        },
        ...nextState.feed,
      ];
      return { next: nextState, message: `VIP Request routed to ${forwardDept}` };
    });

    setForwardSuccess(true);
    setTimeout(() => {
      setForwardSuccess(false);
      setActiveRequestDetail(null);
      setForwardNotes('');
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header and Subtab Toggle Bar + Add VIP Guest Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg font-black text-white">VIP Guests</h2>
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
            <span>VIP Member Profiles</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
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
            <Sparkles className="h-3.5 w-3.5" />
            <span>VIP Requests Queue</span>
            {vipRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold">
                {vipRequests.length}
              </span>
            )}
          </button>
          </div>
        </div>

        <Button
          variant="accent"
          size="sm"
          iconLeft={UserPlus}
          onClick={() => {
            setAddVipError(null);
            setAddVipConfirmStep(false);
            setShowAddVipModal(true);
          }}
          className="shrink-0"
        >
          + Add VIP Guest
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
                className="rounded-2xl border border-white/10 bg-ink-900/90 p-4.5 space-y-4 hover:border-amber-400/40 transition-all shadow-md group relative overflow-hidden"
              >
                {/* Top: Avatar, Name, Room, Tier Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 font-black text-sm border border-amber-400/30 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-amber-300 transition-colors">
                        {st.guest}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-mist-400 mt-0.5">
                        <span className="font-semibold text-white">Room {st.room}</span>
                        <span>·</span>
                        <span className="truncate">{st.roomType}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                    {st.vipTier ?? 'VIP'}
                  </span>
                </div>

                {/* Status Pill & Stay Duration */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">{getStayStatusBadge(st)}</div>
                  <span className="text-mist-400 text-[11px] font-medium">{st.departure}</span>
                </div>

                {/* Key Info Box: Milestone, Dietary, Preferences */}
                <div className="space-y-1 text-xs bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 text-mist-300">
                    <span className="text-[11px] font-semibold text-mist-400">Milestone:</span>
                    <span className="truncate text-white font-medium">{st.milestone || 'In-House VIP'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-mist-300">
                    <span className="text-[11px] font-semibold text-mist-400">Dietary:</span>
                    <span className="truncate text-white font-medium">{st.dietarySummary || 'Standard Protocol'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-mist-300">
                    <span className="text-[11px] font-semibold text-mist-400">Preferences:</span>
                    <span className="truncate text-white font-medium">{st.preferencesSummary || 'Hypoallergenic Pillows'}</span>
                  </div>
                </div>

                {/* Protocol Badge */}
                {st.gmStatus && (
                  <div className="text-[11px] font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
                    {st.gmStatus}
                  </div>
                )}

                {/* Key Numbers (Spend, Folio) */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-mist-400 font-medium block">Total Spend</span>
                    <span className="text-white font-bold font-mono">
                      {money(st.paid && st.paid > 0 ? st.paid : 185000)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-mist-400 font-medium block">Folio Status</span>
                    <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                      Verified (Settled)
                    </span>
                  </div>
                </div>

                {/* Actions: View Complete VIP Profile, Folio (No Message button for GM) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDetailedProfile(st)}
                    className="col-span-2 py-2 px-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>View Complete VIP Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFolioStay(st)}
                    className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-mist-200 border border-white/10 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="View Folio & Billing"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Folio</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: VIP Requests Queue */}
      {activeSubTab === 'requests' && (
        <div className="space-y-3">
          {vipRequests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-12 text-center">
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
                      {item.department && <span className="text-mist-400">Dept: {item.department}</span>}
                    </div>
                    {(item.description || item.meta) && <p className="text-mist-300 line-clamp-1">{item.description || item.meta}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveRequestDetail(item);
                        setForwardNotes('');
                        setForwardSuccess(false);
                      }}
                    >
                      Route / Act
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: VIEW COMPLETE VIP PROFILE */}
      {selectedVipProfile && (
        <Modal
          title={`VIP Member Profile · ${selectedVipProfile.guest}`}
          description={`Membership ID: ${selectedVipProfile.guestId} · Member Since: ${selectedVipProfile.memberSince}`}
          onClose={() => setSelectedVipProfile(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-mist-400">
                {selectedVipProfile.verifiedBy === 'General Manager'
                  ? 'Verified by General Manager'
                  : 'Verified by Front Desk'}
              </span>
              <Button variant="accent" onClick={() => setSelectedVipProfile(null)}>
                Close Profile
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Top Identity Header */}
            <div className="p-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-ink-950 font-black text-sm shadow-md">
                  {getInitials(selectedVipProfile.guest)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedVipProfile.guest}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      [{selectedVipProfile.vipTier}]
                    </span>
                  </h3>
                  <p className="text-xs text-mist-300 mt-0.5">
                    Room {selectedVipProfile.room} · {selectedVipProfile.roomType}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-mist-400 uppercase font-semibold block">Total Lifetime Spend</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {money(selectedVipProfile.totalSpend)}
                </span>
              </div>
            </div>

            {/* Current Stay & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Current Stay Itinerary</span>
                </h4>
                <div className="space-y-1 text-mist-300">
                  <p><strong>Arrival:</strong> {selectedVipProfile.currentStay.arrival}</p>
                  <p><strong>Departure:</strong> {selectedVipProfile.currentStay.departure}</p>
                  <p><strong>Duration:</strong> {selectedVipProfile.currentStay.nights} Nights</p>
                  <p><strong>Status:</strong> {selectedVipProfile.currentStay.status}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Verified Contact Details</span>
                </h4>
                <div className="space-y-1 text-mist-300">
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-mist-400" />
                    <span>{selectedVipProfile.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 text-mist-400" />
                    <span className="truncate">{selectedVipProfile.email}</span>
                  </p>
                  <p className="text-[11px] text-mist-400 pt-1">
                    Emergency Dispatch PIN: <strong>4492#</strong> (Concierge Line)
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Preferences &amp; Care Protocol</span>
              </h4>
              <div className="space-y-2 text-mist-300">
                <div>
                  <strong className="text-white block text-[11px]">Suite &amp; Room Preferences:</strong>
                  <p>{selectedVipProfile.roomPreferences}</p>
                </div>
                <div>
                  <strong className="text-white block text-[11px]">Culinary &amp; Dietary Protocol:</strong>
                  <p>{selectedVipProfile.foodPreferences}</p>
                </div>
                {selectedVipProfile.notes && (
                  <div>
                    <strong className="text-amber-300 block text-[11px]">Confidential Executive Notes:</strong>
                    <p className="italic text-amber-200/90">{selectedVipProfile.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Timeline */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <h4 className="font-bold text-white text-xs">Recent VIP Operational Timeline</h4>
              <div className="space-y-2">
                {selectedVipProfile.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                    <span className="text-amber-400 font-mono shrink-0">{item.at}</span>
                    <span className="text-mist-200">
                      {item.action} <span className="text-mist-400">({item.staff})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: ADD VIP MEMBER */}
      {showAddVipModal && (
        <Modal
          title={addVipConfirmStep ? 'Confirm VIP Member Enrollment' : 'Add New VIP Member'}
          description={
            addVipConfirmStep
              ? 'Please review the details below before completing registration.'
              : 'Enroll a high-value guest into the hotel VIP Program.'
          }
          onClose={() => {
            setShowAddVipModal(false);
            setAddVipConfirmStep(false);
          }}
          footer={
            <div className="flex items-center justify-between w-full">
              {addVipConfirmStep ? (
                <>
                  <Button variant="outline" onClick={() => setAddVipConfirmStep(false)}>
                    Back to Edit
                  </Button>
                  <Button variant="accent" onClick={handleConfirmAddVip}>
                    Confirm &amp; Register VIP
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddVipModal(false);
                      setAddVipConfirmStep(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="accent" onClick={handleAddVipSubmit}>
                    Next: Review &amp; Confirm
                  </Button>
                </>
              )}
            </div>
          }
        >
          {addVipConfirmStep ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-400">Guest Name</span>
                  <span className="font-bold text-white text-sm">{addVipForm.guestName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-400">Assigned Room</span>
                  <span className="font-bold text-white">{addVipForm.roomNo || 'Unassigned / Pre-Checkin'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-400">VIP Tier</span>
                  <span className="font-bold text-amber-300">{addVipForm.vipTier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-400">Verification Authority</span>
                  <span className="font-bold text-emerald-400">Verified by General Manager</span>
                </div>
              </div>
              <p className="text-mist-400 text-[11px]">
                Upon confirmation, this profile will be registered across all consoles as Verified by General Manager.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddVipSubmit} className="space-y-3 text-xs">
              {addVipError && (
                <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{addVipError}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={addVipForm.guestName}
                  onChange={(e) => setAddVipForm({ ...addVipForm, guestName: e.target.value })}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="field w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={addVipForm.roomNo}
                    onChange={(e) => setAddVipForm({ ...addVipForm, roomNo: e.target.value })}
                    placeholder="e.g. 518"
                    className="field w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Suite / Room Type</label>
                  <input
                    type="text"
                    defaultValue="Presidential Suite"
                    className="field w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">VIP Tier</label>
                  <select
                    value={addVipForm.vipTier}
                    onChange={(e) => setAddVipForm({ ...addVipForm, vipTier: e.target.value })}
                    className="field w-full"
                  >
                    <option value="👑 Chairman's Club">👑 Chairman's Club</option>
                    <option value="💎 Ambassador VIP">💎 Ambassador VIP</option>
                    <option value="⭐ Royal Patron Society">⭐ Royal Patron Society</option>
                    <option value="In-House VIP">In-House VIP</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Stay Status</label>
                  <select className="field w-full" defaultValue="in_house">
                    <option value="in_house">In-House</option>
                    <option value="pre_checkin">Pre-Arrival</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={addVipForm.contactPhone}
                    onChange={(e) => setAddVipForm({ ...addVipForm, contactPhone: e.target.value })}
                    placeholder="+91 98200 00000"
                    className="field w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={addVipForm.contactEmail}
                    onChange={(e) => setAddVipForm({ ...addVipForm, contactEmail: e.target.value })}
                    placeholder="guest@domain.com"
                    className="field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Room Preferences & Setup</label>
                <input
                  type="text"
                  value={addVipForm.roomPreferences}
                  onChange={(e) => setAddVipForm({ ...addVipForm, roomPreferences: e.target.value })}
                  placeholder="e.g. Goose down pillows, 20°C, quiet wing"
                  className="field w-full"
                />
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Dietary Directives & Allergies</label>
                <input
                  type="text"
                  value={addVipForm.foodPreferences}
                  onChange={(e) => setAddVipForm({ ...addVipForm, foodPreferences: e.target.value })}
                  placeholder="e.g. Nut allergy, organic produce only"
                  className="field w-full"
                />
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Milestone / Purpose of Stay</label>
                <input
                  type="text"
                  value={addVipForm.note}
                  onChange={(e) => setAddVipForm({ ...addVipForm, note: e.target.value })}
                  placeholder="e.g. CEO Annual Summit, 40th Anniversary"
                  className="field w-full"
                />
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Special Protocols & Butler Directives</label>
                <textarea
                  rows={2}
                  placeholder="e.g. GM greeting upon arrival, private elevator priority"
                  className="field w-full resize-none"
                />
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* MODAL 3: FOLIO MODAL */}
      {activeFolioStay && (
        <Modal
          title={`Guest Folio · ${activeFolioStay.guest}`}
          description={`Room ${activeFolioStay.room} · ${activeFolioStay.roomType} · Stay ${activeFolioStay.id}`}
          onClose={() => setActiveFolioStay(null)}
          footer={
            <Button variant="accent" onClick={() => setActiveFolioStay(null)}>
              Close Folio
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-mist-400 uppercase font-semibold block">Billing Total</span>
                <span className="text-base font-bold font-mono text-white">
                  {money(activeFolioStay.paid && activeFolioStay.paid > 0 ? activeFolioStay.paid : 185000)}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Settled / Credit Guaranteed
              </span>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between text-mist-300">
                <span>Room Accommodation ({activeFolioStay.nights} Nights)</span>
                <span className="font-mono text-white">
                  {money((activeFolioStay.nights || 3) * 45000)}
                </span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>VIP Concierge &amp; Butler Amenity</span>
                <span className="font-mono text-white">{money(25000)}</span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>Fine Dining &amp; Executive Bar</span>
                <span className="font-mono text-white">{money(25000)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: ROUTE VIP REQUEST */}
      {activeRequestDetail && (
        <Modal
          title={`Route VIP Request · ${activeRequestDetail.title}`}
          description={`Room ${activeRequestDetail.room || 'General'} · Priority: VIP`}
          onClose={() => setActiveRequestDetail(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setActiveRequestDetail(null)}>
                Cancel
              </Button>
              <Button variant="accent" onClick={handleForwardVipRequest}>
                {forwardSuccess ? 'Routed Successfully!' : 'Dispatch to Department'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-mist-300 block mb-1">Target Department</label>
              <select
                value={forwardDept}
                onChange={(e) => setForwardDept(e.target.value as RouteDept)}
                className="field w-full"
              >
                <option value="housekeeping">Housekeeping</option>
                <option value="food_beverage">Food &amp; Beverage</option>
                <option value="maintenance">Engineering / Maintenance</option>
                <option value="concierge">Concierge &amp; Transport</option>
                <option value="front_desk">Front Desk Direct</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-mist-300 block mb-1">Executive VIP Instructions</label>
              <textarea
                rows={3}
                value={forwardNotes}
                onChange={(e) => setForwardNotes(e.target.value)}
                placeholder="e.g. VIP Priority: Expedite immediately with supervisor signoff"
                className="field w-full resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
