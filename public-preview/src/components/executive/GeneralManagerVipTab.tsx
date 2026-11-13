'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Heart,
  Star,
  Sparkles,
  BedDouble,
  Clock,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  MessageSquareWarning,
  Plus,
  AlertCircle,
  Calendar,
  Gift,
  FileText,
  UserCheck,
  ChevronRight,
  X,
  ArrowRight,
  UserPlus,
  Receipt,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import { folioSeed } from '@/lib/mockData';
import type { GuestReminderPriority, StayRecord } from '@/types/demo';

interface GeneralManagerVipTabProps {
  onNavigateTab?: (tabId: string, filter?: Record<string, string>) => void;
}

export function GeneralManagerVipTab({ onNavigateTab }: GeneralManagerVipTabProps) {
  const { state, createGuestReminder, updateGuestReminderStatus, fdAction } = useDemo();
  const [selectedVipGuest, setSelectedVipGuest] = useState<StayRecord | null>(null);
  const [activeFolioStay, setActiveFolioStay] = useState<StayRecord | null>(null);

  // Custom client-side VIP additions
  const [customVipStays, setCustomVipStays] = useState<StayRecord[]>([]);
  const [showAddVipModal, setShowAddVipModal] = useState(false);
  const [addVipSuccess, setAddVipSuccess] = useState<string | null>(null);

  // New VIP Guest Form State
  const [newVipForm, setNewVipForm] = useState({
    guestName: '',
    roomNo: '',
    roomType: 'Presidential Suite',
    vipTier: "👑 Chairman's Club",
    status: 'in_house' as 'in_house' | 'expected',
    arrival: 'Today 12:00',
    departure: 'Sun 25 Oct',
    milestone: 'Executive VIP Stay',
    dietarySummary: 'Nut-Free · Organic produce',
    preferencesSummary: 'Hypoallergenic pillows & luxury suite amenities',
    specialInstructions: 'GM personal welcome letter & orchid bouquet',
  });

  // New reminder modal state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderDueTime, setReminderDueTime] = useState('18:00');
  const [reminderPriority, setReminderPriority] = useState<GuestReminderPriority>('vip');

  const baseVipStays = (state.frontDesk?.stays ?? []).filter((s) => s.vip);

  // Combined VIP stays list (custom additions first)
  const allVipStays = useMemo(() => {
    const map = new Map<string, StayRecord>();
    for (const s of customVipStays) {
      map.set(s.id, s);
    }
    for (const s of baseVipStays) {
      if (!map.has(s.id)) {
        map.set(s.id, s);
      }
    }
    return Array.from(map.values());
  }, [customVipStays, baseVipStays]);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddVipModal) {
          setShowAddVipModal(false);
        } else if (activeFolioStay) {
          setActiveFolioStay(null);
        } else if (showAddReminderModal) {
          setShowAddReminderModal(false);
        } else {
          setSelectedVipGuest(null);
        }
      }
    };
    if (selectedVipGuest || showAddReminderModal || showAddVipModal || activeFolioStay) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedVipGuest, showAddReminderModal, showAddVipModal, activeFolioStay]);

  const prefs = selectedVipGuest ? state.guestPreferences?.[selectedVipGuest.room] : null;
  const reminders = (state.guestReminders ?? []).filter(
    (r) => selectedVipGuest && (r.room === selectedVipGuest.room || r.guestName === selectedVipGuest.guest),
  );

  const complaints = (state.frontDesk?.complaints ?? []).filter(
    (c) =>
      selectedVipGuest &&
      (c.room === selectedVipGuest.room ||
        (c.guestName || c.guest || '').toLowerCase().includes(selectedVipGuest.guest.toLowerCase().split(' ')[0])),
  );

  // Initials generator
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-600 dark:text-amber-300 border border-amber-400/30">
            <Clock className="h-3 w-3" /> Late Checkout 16:00
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3" /> In-House
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
        <Clock className="h-3 w-3" /> Arriving 14:00
      </span>
    );
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVipGuest || !reminderTitle.trim()) return;

    createGuestReminder({
      guestName: selectedVipGuest.guest,
      room: selectedVipGuest.room,
      title: reminderTitle.trim(),
      notes: reminderNotes.trim() || undefined,
      dueTime: reminderDueTime,
      dueDate: 'Today',
      priority: reminderPriority,
      category: 'vip_concierge',
      assignedTo: 'GM Office / Front Desk Duty Manager',
    });

    setReminderTitle('');
    setReminderNotes('');
    setShowAddReminderModal(false);
  };

  // Add new VIP guest client-side handler
  const handleAddVipGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVipForm.guestName.trim() || !newVipForm.roomNo.trim()) return;

    const newStay: StayRecord = {
      id: `stay-vip-${Date.now()}`,
      guest: newVipForm.guestName.trim(),
      room: newVipForm.roomNo.trim(),
      roomType: newVipForm.roomType,
      vip: true,
      vipTier: newVipForm.vipTier,
      arrival: newVipForm.arrival || 'Today 12:00',
      departure: newVipForm.departure || 'Sun 25 Oct',
      nights: 3,
      status: newVipForm.status,
      milestone: newVipForm.milestone.trim() || 'Executive VIP Stay',
      dietarySummary: newVipForm.dietarySummary.trim() || 'Standard executive dining profile',
      preferencesSummary: newVipForm.preferencesSummary.trim() || 'Hypoallergenic pillows & luxury suite amenities',
      gmStatus: '✓ GM Welcome Protocol Active',
      paid: newVipForm.status === 'in_house' ? 95000 : 0,
      preCheckIn: 'verified',
      idChecked: true,
      cardMask: '•••• 8899',
    };

    setCustomVipStays((prev) => [newStay, ...prev]);

    if (fdAction) {
      fdAction((s) => {
        s.frontDesk.stays = [newStay, ...(s.frontDesk.stays || [])];
        if (!s.guestPreferences) s.guestPreferences = {};
        s.guestPreferences[newStay.room] = {
          allergies: [newStay.dietarySummary || 'None recorded'],
          dietaryRestrictions: [newStay.dietarySummary || 'Standard executive dining profile'],
          dietary: [newStay.dietarySummary || 'Standard executive dining profile'],
          dnd: false,
          personalInstructions: newStay.preferencesSummary || 'Hypoallergenic pillows & luxury suite amenities',
          specialRequests: [newStay.preferencesSummary || 'Hypoallergenic pillows & luxury suite amenities'],
          pillowPreference: 'Hypoallergenic luxury pillows',
          roomTemperature: '21°C',
        };
        return { next: s, message: `VIP Guest ${newStay.guest} registered successfully into Room ${newStay.room}` };
      });
    }

    setAddVipSuccess(`VIP Guest ${newStay.guest} (Room ${newStay.room}) successfully added!`);
    setTimeout(() => setAddVipSuccess(null), 5000);

    setShowAddVipModal(false);
    setNewVipForm({
      guestName: '',
      roomNo: '',
      roomType: 'Presidential Suite',
      vipTier: "👑 Chairman's Club",
      status: 'in_house',
      arrival: 'Today 12:00',
      departure: 'Sun 25 Oct',
      milestone: 'Executive VIP Stay',
      dietarySummary: 'Nut-Free · Organic produce',
      preferencesSummary: 'Hypoallergenic pillows & luxury suite amenities',
      specialInstructions: 'GM personal welcome letter & orchid bouquet',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-ink-900 to-amber-950/30 p-6 shadow-xl text-white backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shrink-0">
              <Crown className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold font-display text-white">VIP Guests</h2>
                <Badge tone="accent" className="px-2.5 py-0.5 text-xs font-mono">
                  GM Sovereign Oversight
                </Badge>
              </div>
              <p className="text-xs text-mist-300 mt-0.5">
                Direct executive profile tracking, bespoke preferences, proactive reminders, and VIP recovery cases.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={() => setShowAddVipModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 shadow-md transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Add VIP Guest</span>
            </Button>
            <Badge tone="accent" className="px-3 py-1.5 text-xs font-medium">
              {allVipStays.length} High-Value VIP Guests
            </Badge>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {addVipSuccess && (
        <div className="p-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5 backdrop-blur-xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{addVipSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setAddVipSuccess(null)}
            className="text-slate-400 hover:text-navy-950 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIP Guests Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-500 dark:text-mist-400 uppercase tracking-wider">
          In-House & Arriving VIP Guests
        </h3>
        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
          {allVipStays.length} Active Profiles
        </span>
      </div>

      {/* Grid: Front Desk VIP Card Design (Excluding Message Option) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allVipStays.map((st) => {
          const initials = getInitials(st.guest);

          return (
            <div
              key={st.id}
              className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/80 p-5 space-y-4 hover:border-amber-400/40 hover:shadow-xl transition-all duration-200 shadow-lg flex flex-col justify-between"
            >
              {/* Card Header Row */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full shrink-0 bg-gradient-to-br from-amber-400/25 to-amber-600/30 border border-amber-400/40 flex items-center justify-center font-bold text-amber-700 dark:text-amber-200 text-sm shadow-md">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-navy-950 dark:text-white truncate tracking-tight">{st.guest}</h3>
                      <p className="text-xs text-slate-500 dark:text-mist-300 font-medium truncate">
                        Room {st.room} · {st.roomType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm">
                    {st.vipTier ?? "👑 Chairman's Club"}
                  </span>
                  {getStayStatusBadge(st)}
                </div>
              </div>

              {/* Key Info Chips */}
              <div className="space-y-2 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-3 text-xs">
                {/* Milestone / Occasion */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 shrink-0">Milestone:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-200 text-xs truncate">
                    {st.milestone ?? '💼 Executive VIP Stay'}
                  </span>
                </div>

                {/* Dietary / Allergies */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 shrink-0">Dietary:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-300 text-xs truncate">
                    {st.dietarySummary ?? '🥜 Severe Nut Allergy'}
                  </span>
                </div>

                {/* Room & Arrival Preferences */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 shrink-0">Preferences:</span>
                  <span className="font-semibold text-slate-700 dark:text-mist-200 text-xs truncate">
                    {st.preferencesSummary ?? '🛏️ Hypoallergenic Pillows'}
                  </span>
                </div>
              </div>

              {/* Protocol Badge & Detailed View Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{st.gmStatus ?? '✓ GM Welcome Card Placed'}</span>
                  </span>
                </div>

                {/* Complete VIP Profile Button */}
                <button
                  type="button"
                  onClick={() => setSelectedVipGuest(st)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-bold text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition shadow-sm cursor-pointer"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  <span>View Complete VIP Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                {/* Bottom Row Actions: Message is intentionally excluded per request, Folio is included */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFolioStay(st)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition shadow-sm cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    <span>Folio & Billing Details</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Manager VIP Policy Note */}
      <Panel className="p-4 bg-white/40 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-mist-400 space-y-1.5 rounded-3xl">
        <div className="flex items-center gap-2 font-semibold text-navy-950 dark:text-white">
          <Star className="h-4 w-4 text-amber-500" />
          <span>General Manager VIP Sovereign Protocol</span>
        </div>
        <p>
          Click any VIP guest card to review complete arrival/departure timings, bespoke PMS dietary directives, scheduled VIP reminders, and recorded grievances. All Presidential Suite guests receive GM personal greetings upon check-in.
        </p>
      </Panel>

      {/* Elaborated VIP Details Modal */}
      {selectedVipGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedVipGuest(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden text-navy-950 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center border border-amber-500/30 shrink-0">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold font-display text-navy-950 dark:text-white">
                      {selectedVipGuest.guest}
                    </h3>
                    <Badge tone="accent" className="font-semibold text-xs">
                      {selectedVipGuest.vipTier || 'VIP Tier 1 Sovereign'}
                    </Badge>
                    <Badge tone={selectedVipGuest.status === 'in_house' ? 'success' : 'info'}>
                      {selectedVipGuest.status === 'in_house' ? 'In House (Checked In)' : 'Expected Today'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Room {selectedVipGuest.room} · {selectedVipGuest.roomType} · Booking Ref: {selectedVipGuest.id.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVipGuest(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Check-in and Check-out Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                    Check-in & Check-out Schedule
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-500" /> Check-in Time
                    </span>
                    <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                      {selectedVipGuest.arrival}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-amber-500" /> Check-out Time
                    </span>
                    <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                      {selectedVipGuest.departure}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                      <BedDouble className="h-3 w-3 text-purple-500" /> Stay Duration
                    </span>
                    <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                      {selectedVipGuest.nights ? `${selectedVipGuest.nights} Nights` : 'Multi-day Stay'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-sky-500" /> Assigned Butler
                    </span>
                    <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                      Vikram S. (Lead)
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Document Preferences and Dietary Directives */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                    Document Preferences & Dietary Directives
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {/* Allergies */}
                  <div className="p-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 dark:bg-rose-500/[0.07] space-y-2">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> Allergies & Intolerances
                    </span>
                    {prefs?.allergies && prefs.allergies.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-700 dark:text-mist-200">
                        {prefs.allergies.map((all, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {all}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 dark:text-mist-400 italic">No allergies recorded</p>
                    )}
                  </div>

                  {/* Dietary Directives */}
                  <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 dark:bg-amber-500/[0.07] space-y-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <UtensilsCrossed className="h-4 w-4" /> Dietary Directives
                    </span>
                    {prefs?.dietary && prefs.dietary.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-700 dark:text-mist-200">
                        {prefs.dietary.map((d, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    ) : selectedVipGuest.dietarySummary ? (
                      <p className="text-slate-700 dark:text-mist-200 font-medium">
                        {selectedVipGuest.dietarySummary}
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-mist-400 italic">Standard executive dining profile</p>
                    )}
                  </div>

                  {/* Room Atmosphere & Setup */}
                  <div className="p-4 rounded-2xl border border-sky-500/25 bg-sky-500/10 dark:bg-sky-500/[0.07] space-y-2">
                    <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Room Atmosphere
                    </span>
                    {prefs?.specialRequests && prefs.specialRequests.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-700 dark:text-mist-200">
                        {prefs.specialRequests.map((req, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    ) : selectedVipGuest.preferencesSummary ? (
                      <p className="text-slate-700 dark:text-mist-200 font-medium">
                        {selectedVipGuest.preferencesSummary}
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-mist-400 italic">Standard executive suite setup</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: VIP Schedule Reminders & Milestones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                      VIP Schedule Reminders & Milestones ({reminders.length})
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddReminderModal(true)}
                    className="gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Reminder
                  </Button>
                </div>

                {/* Milestone Highlight Banner */}
                {selectedVipGuest.milestone && (
                  <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/[0.07] flex items-center gap-2.5 text-xs">
                    <Gift className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="font-bold text-amber-700 dark:text-amber-300">
                      Guest Milestone: <span className="font-medium text-navy-950 dark:text-mist-200">{selectedVipGuest.milestone}</span>
                    </div>
                  </div>
                )}

                {/* Reminders List */}
                {reminders.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400 dark:text-mist-400">
                    No reminders currently active for {selectedVipGuest.guest}. Click &quot;Add Reminder&quot; to log a VIP milestone or directive.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reminders.map((rem) => {
                      const isPending = rem.status === 'pending';
                      return (
                        <div
                          key={rem.id}
                          className={cn(
                            'p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs',
                            isPending
                              ? 'border-amber-500/30 bg-amber-500/[0.04]'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] opacity-75',
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-navy-950 dark:text-white">{rem.title}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rem.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                    : rem.priority === 'vip'
                                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                                }`}
                              >
                                {rem.priority.toUpperCase()}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPending
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                }`}
                              >
                                {rem.status}
                              </span>
                            </div>
                            {rem.notes && (
                              <p className="text-xs text-slate-500 dark:text-mist-400">{rem.notes}</p>
                            )}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-mist-400">
                              <span>Due: {rem.dueTime} ({rem.dueDate})</span>
                              {rem.assignedTo && <span>· Assigned: {rem.assignedTo}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateGuestReminderStatus(rem.id, 'completed')}
                                className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark Done
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateGuestReminderStatus(rem.id, 'pending')}
                                className="text-xs text-slate-500 dark:text-mist-400 gap-1"
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 4: Recorded Guest Grievances */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4 text-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                    Recorded Guest Grievances ({complaints.length})
                  </h4>
                </div>

                {complaints.length > 0 ? (
                  <div className="space-y-2.5">
                    {complaints.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 dark:bg-rose-500/[0.05] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-navy-950 dark:text-white">
                            {c.summary || c.description || 'Guest Grievance Logged'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              c.compApplied
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {c.compApplied ? 'Resolved' : 'Pending Recovery'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-mist-300">
                          <span>
                            Category: <strong>{c.category || 'Duty / Front Desk'}</strong>
                          </span>
                          <span>
                            · Compensation: <strong>₹{c.comp ? (c.comp * 80).toLocaleString('en-IN') : 'None'}</strong>
                          </span>
                        </div>
                        {c.responseRemarks && (
                          <p className="text-[11px] text-slate-500 dark:text-mist-400 italic">
                            {c.responseRemarks}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>
                      No recorded grievances or active service issues for this VIP guest. Stay satisfaction conforms to 5-star executive benchmarks.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Booking ID: <strong className="font-mono text-navy-950 dark:text-white">{selectedVipGuest.id.toUpperCase()}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddReminderModal(true)}
                  className="gap-1.5 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Reminder
                </Button>
                {onNavigateTab && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedVipGuest(null);
                      onNavigateTab('complaints');
                    }}
                    className="gap-1.5 text-xs text-slate-600 dark:text-mist-300"
                  >
                    <MessageSquareWarning className="h-3.5 w-3.5" />
                    All Complaints
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setSelectedVipGuest(null)}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-md"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Folio Modal */}
      {activeFolioStay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveFolioStay(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl text-navy-950 dark:text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Guest Folio · {activeFolioStay.guest}
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                  Room {activeFolioStay.room} · {activeFolioStay.roomType} · VIP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFolioStay(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-mist-400 block font-medium">Stay Duration</span>
                <span className="font-bold text-navy-950 dark:text-white">
                  {activeFolioStay.arrival} → {activeFolioStay.departure}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 dark:text-mist-400 block font-medium">Settlement Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activeFolioStay.paid > 0 ? `${money(activeFolioStay.paid)} Settled` : 'Pre-Authorized Token'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-300">
                Folio Line Items
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden max-h-60 overflow-y-auto">
                {(folioSeed[activeFolioStay.room] ?? [
                  { id: 'item-1', label: `${activeFolioStay.roomType} (3 nights)`, amount: 2400, date: 'Today' },
                  { id: 'item-2', label: 'Resort Fee & Executive VIP Lounge Access', amount: 150, date: 'Today' },
                  { id: 'item-3', label: 'In-Room Private Dining & Vintage Champagne', amount: 320, date: 'Today' },
                  { id: 'item-4', label: 'Spa Wellness Sovereign Package', amount: 280, date: 'Today' },
                ]).map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-navy-950 dark:text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-mist-400">{item.date}</p>
                    </div>
                    <span className="font-bold text-navy-950 dark:text-white">{money(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-white/10">
              <Button size="sm" onClick={() => setActiveFolioStay(null)} className="text-xs">
                Close Folio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add VIP Guest Modal */}
      {showAddVipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAddVipModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl text-navy-950 dark:text-white overflow-hidden space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center border border-amber-500/30">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-950 dark:text-white">
                    Add New VIP Guest
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-mist-400">
                    Register a high-profile sovereign guest with tailored preferences.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVipModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddVipGuest} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVipForm.guestName}
                    onChange={(e) => setNewVipForm({ ...newVipForm, guestName: e.target.value })}
                    placeholder="e.g. Dr. Alistair Sterling"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVipForm.roomNo}
                    onChange={(e) => setNewVipForm({ ...newVipForm, roomNo: e.target.value })}
                    placeholder="e.g. 502"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Suite / Room Type
                  </label>
                  <select
                    value={newVipForm.roomType}
                    onChange={(e) => setNewVipForm({ ...newVipForm, roomType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Presidential Suite">Presidential Suite</option>
                    <option value="Royal Penthouse Suite">Royal Penthouse Suite</option>
                    <option value="Executive Bayview Suite">Executive Bayview Suite</option>
                    <option value="Deluxe Heritage Suite">Deluxe Heritage Suite</option>
                    <option value="Governor Suite">Governor Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    VIP Tier
                  </label>
                  <select
                    value={newVipForm.vipTier}
                    onChange={(e) => setNewVipForm({ ...newVipForm, vipTier: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="👑 Chairman's Club">👑 Chairman&apos;s Club</option>
                    <option value="VIP Tier 1 Sovereign">VIP Tier 1 Sovereign</option>
                    <option value="Diamond Ambassador">Diamond Ambassador</option>
                    <option value="Executive Patron">Executive Patron</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Stay Status
                  </label>
                  <select
                    value={newVipForm.status}
                    onChange={(e) => setNewVipForm({ ...newVipForm, status: e.target.value as 'in_house' | 'expected' })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="in_house">In-House (Checked In)</option>
                    <option value="expected">Expected Today</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Check-in / Arrival
                  </label>
                  <input
                    type="text"
                    value={newVipForm.arrival}
                    onChange={(e) => setNewVipForm({ ...newVipForm, arrival: e.target.value })}
                    placeholder="e.g. Today 14:00"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Check-out / Departure
                  </label>
                  <input
                    type="text"
                    value={newVipForm.departure}
                    onChange={(e) => setNewVipForm({ ...newVipForm, departure: e.target.value })}
                    placeholder="e.g. Sun 25 Oct"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                  Milestone / Purpose of Stay
                </label>
                <input
                  type="text"
                  value={newVipForm.milestone}
                  onChange={(e) => setNewVipForm({ ...newVipForm, milestone: e.target.value })}
                  placeholder="e.g. 25th Wedding Anniversary Celebration / Diplomatic State Visit"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Dietary Directives & Allergies
                  </label>
                  <input
                    type="text"
                    value={newVipForm.dietarySummary}
                    onChange={(e) => setNewVipForm({ ...newVipForm, dietarySummary: e.target.value })}
                    placeholder="e.g. Nut-Free · Gluten-Free · Organic only"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Room Preferences & Setup
                  </label>
                  <input
                    type="text"
                    value={newVipForm.preferencesSummary}
                    onChange={(e) => setNewVipForm({ ...newVipForm, preferencesSummary: e.target.value })}
                    placeholder="e.g. Hypoallergenic pillows · High floor · 21°C"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-mist-300 mb-1">
                  Special Protocols & Butler Directives
                </label>
                <textarea
                  rows={2}
                  value={newVipForm.specialInstructions}
                  onChange={(e) => setNewVipForm({ ...newVipForm, specialInstructions: e.target.value })}
                  placeholder="e.g. GM personal greeting upon arrival, Dom Pérignon champagne chilled at 18:00..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddVipModal(false)}
                  className="text-xs text-slate-500 dark:text-mist-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save VIP Guest
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddReminderModal && selectedVipGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl text-navy-950 dark:text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2 text-navy-950 dark:text-white">
                <Crown className="h-4 w-4 text-amber-500" />
                Add VIP Reminder
              </h3>
              <button
                type="button"
                onClick={() => setShowAddReminderModal(false)}
                className="text-slate-400 hover:text-navy-950 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-mist-400">
              For <strong>{selectedVipGuest.guest}</strong> in Room <strong>{selectedVipGuest.room}</strong>. Synchronizes across GM and Front Desk.
            </p>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-mist-300 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="e.g. Deliver chilled vintage champagne at 19:30"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-mist-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder="Specific butler instructions, allergies or dietary notes..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white placeholder-slate-400 dark:placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={reminderDueTime}
                    onChange={(e) => setReminderDueTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-mist-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={reminderPriority}
                    onChange={(e) => setReminderPriority(e.target.value as GuestReminderPriority)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950 px-3 py-2 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="vip">VIP Executive</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddReminderModal(false)}
                  className="text-xs text-slate-500 dark:text-mist-400"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-amber-500 text-white font-bold hover:bg-amber-600">
                  Save VIP Reminder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
