'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { GuestReminderPriority, StayRecord } from '@/types/demo';

interface GeneralManagerVipTabProps {
  onNavigateTab?: (tabId: string, filter?: Record<string, string>) => void;
}

export function GeneralManagerVipTab({ onNavigateTab }: GeneralManagerVipTabProps) {
  const { state, createGuestReminder, updateGuestReminderStatus } = useDemo();
  const [selectedVipGuest, setSelectedVipGuest] = useState<StayRecord | null>(null);

  // New reminder modal state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderDueTime, setReminderDueTime] = useState('18:00');
  const [reminderPriority, setReminderPriority] = useState<GuestReminderPriority>('vip');

  const stays = state.frontDesk?.stays ?? [];
  const vipStays = stays.filter((s) => s.vip);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddReminderModal) {
          setShowAddReminderModal(false);
        } else {
          setSelectedVipGuest(null);
        }
      }
    };
    if (selectedVipGuest || showAddReminderModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedVipGuest, showAddReminderModal]);

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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-white">
                  VIP Guest Portfolio & Executive Protocols
                </h2>
                <Badge tone="accent" className="px-2.5 py-0.5 text-xs font-mono">
                  GM Sovereign Oversight
                </Badge>
              </div>
              <p className="text-xs text-mist-300 mt-0.5">
                Direct executive profile tracking, bespoke preferences, proactive reminders, and VIP recovery cases.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge tone="accent" className="px-3 py-1.5 text-xs font-medium">
              {vipStays.length} High-Value VIP Guests
            </Badge>
          </div>
        </div>
      </div>

      {/* VIP Portfolio Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-500 dark:text-mist-400 uppercase tracking-wider">
          In-House & Arriving VIP Guests
        </h3>
        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
          {vipStays.length} Active Profiles
        </span>
      </div>

      {/* Grid: Only the VIP guest name box with room is shown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {vipStays.map((st) => (
          <div
            key={st.id}
            onClick={() => setSelectedVipGuest(st)}
            className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg hover:border-amber-500/50 hover:bg-amber-500/[0.06] dark:hover:bg-amber-500/[0.08] transition-all cursor-pointer group flex items-center justify-between gap-4"
            title={`Click to view full VIP details for ${st.guest}`}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 dark:text-amber-400 grid place-items-center font-bold border border-amber-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-navy-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {st.guest}
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-mist-400 mt-0.5">
                  Room {st.room}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition">
              <span>Details</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {/* General Manager VIP Policy Note */}
      <Panel className="p-4 bg-white/40 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-mist-400 space-y-1.5 rounded-3xl">
        <div className="flex items-center gap-2 font-semibold text-navy-950 dark:text-white">
          <Star className="h-4 w-4 text-amber-500" />
          <span>General Manager VIP Sovereign Protocol</span>
        </div>
        <p>
          Click any VIP guest box to review complete arrival/departure timings, bespoke PMS dietary directives, scheduled VIP reminders, and recorded grievances. All Presidential Suite guests receive GM personal greetings upon check-in.
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
