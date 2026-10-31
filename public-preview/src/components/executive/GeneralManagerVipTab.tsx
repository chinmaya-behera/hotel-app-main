'use client';

import { useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { GuestReminderPriority } from '@/types/demo';

interface GeneralManagerVipTabProps {
  onNavigateTab?: (tabId: string, filter?: Record<string, string>) => void;
}

export function GeneralManagerVipTab({ onNavigateTab }: GeneralManagerVipTabProps) {
  const { state, createGuestReminder, updateGuestReminderStatus } = useDemo();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // New reminder modal state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderDueTime, setReminderDueTime] = useState('18:00');
  const [reminderPriority, setReminderPriority] = useState<GuestReminderPriority>('vip');

  const stays = state.frontDesk?.stays ?? [];
  const vipStays = stays.filter((s) => s.vip);

  const activeSelected = selectedRoom
    ? vipStays.find((s) => s.room === selectedRoom) ?? vipStays[0]
    : vipStays[0];

  const prefs = activeSelected ? state.guestPreferences?.[activeSelected.room] : null;
  const reminders = (state.guestReminders ?? []).filter(
    (r) => activeSelected && (r.room === activeSelected.room || r.guestName === activeSelected.guest),
  );

  const complaints = (state.frontDesk?.complaints ?? []).filter(
    (c) => activeSelected && (c.room === activeSelected.room || c.guestName.toLowerCase().includes(activeSelected.guest.toLowerCase().split(' ')[0])),
  );

  const workItems = useMemoCombinedTasks(state, activeSelected?.room);

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelected || !reminderTitle.trim()) return;

    createGuestReminder({
      guestName: activeSelected.guest,
      room: activeSelected.room,
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
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,1.1fr)_minmax(0,2.9fr)]">
        {/* Left Column: VIP Guest List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-mist-400 uppercase tracking-wider">
              In-House & Arriving VIPs
            </h3>
            <span className="text-[11px] font-mono text-amber-400">{vipStays.length} Active</span>
          </div>

          <div className="space-y-2.5">
            {vipStays.map((st) => {
              const isSelected = activeSelected?.id === st.id;
              const guestPrefs = state.guestPreferences?.[st.room];
              const guestReminders = (state.guestReminders ?? []).filter(
                (r) => r.room === st.room && r.status === 'pending',
              );
              const guestComplaints = (state.frontDesk?.complaints ?? []).filter(
                (c) => c.room === st.room && !c.compApplied,
              );

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedRoom(st.room)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all relative text-white',
                    isSelected
                      ? 'border-amber-400/50 bg-amber-500/[0.12] shadow-xl shadow-amber-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span>{st.guest}</span>
                      </span>
                      <p className="mt-0.5 text-xs text-mist-300">
                        Room {st.room} · {st.roomType}
                      </p>
                    </div>
                    <Badge tone={st.status === 'in_house' ? 'success' : 'info'}>
                      {st.status === 'in_house' ? 'In House' : 'Expected'}
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 text-[11px] text-mist-400">
                    <span>
                      Stay: {st.status === 'in_house' ? `Departs ${st.departure}` : `Arrives ${st.arrival}`}
                    </span>
                    <span>·</span>
                    <span>Folio: {st.status === 'in_house' ? '₹74,500' : 'Pre-auth'}</span>
                  </div>

                  {/* Badges for pending items */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {guestPrefs?.allergies && guestPrefs.allergies.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <Heart className="h-2.5 w-2.5" /> Allergy Alert
                      </span>
                    )}
                    {guestReminders.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="h-2.5 w-2.5" /> {guestReminders.length} Reminder{guestReminders.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {guestComplaints.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-500/25 text-red-300 border border-red-500/40">
                        <MessageSquareWarning className="h-2.5 w-2.5" /> Issue Open
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Panel className="p-4 bg-white/[0.02] border-white/10 text-xs text-mist-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Star className="h-4 w-4 text-amber-400" />
              <span>General Manager VIP Policy</span>
            </div>
            <p>
              All VIPs in Presidential & Royal Suites are entitled to GM welcome greeting upon check-in, complimentary luxury airport transfer, and unmetered beverage amenity.
            </p>
          </Panel>
        </div>

        {/* Right Column: Detailed VIP Profile & Operations */}
        {activeSelected ? (
          <div className="space-y-6">
            {/* Guest Summary Card */}
            <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold font-display text-navy-950 dark:text-white">
                      {activeSelected.guest}
                    </h3>
                    <Badge tone="accent" className="font-semibold">
                      VIP Tier 1 Sovereign
                    </Badge>
                    <Badge tone={activeSelected.status === 'in_house' ? 'success' : 'info'}>
                      {activeSelected.status === 'in_house' ? 'Checked In' : 'Expected Today'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-1">
                    Room {activeSelected.room} · {activeSelected.roomType} · Booking Ref: {activeSelected.id.toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddReminderModal(true)}
                    className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Log Executive Reminder
                  </Button>
                  {onNavigateTab && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onNavigateTab('complaints')}
                      className="gap-1.5 text-xs text-mist-300"
                    >
                      <MessageSquareWarning className="h-3.5 w-3.5" />
                      View Complaints
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 block">Arrival Date</span>
                  <span className="font-bold text-navy-950 dark:text-white">{activeSelected.arrival}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 block">Departure Date</span>
                  <span className="font-bold text-navy-950 dark:text-white">{activeSelected.departure}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 block">Key Live Status</span>
                  <span className="font-bold text-emerald-500">Active Mobile Pass</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                  <span className="text-[11px] text-slate-400 dark:text-mist-400 block">Assigned Butler</span>
                  <span className="font-bold text-navy-950 dark:text-white">Vikram S. (Lead)</span>
                </div>
              </div>
            </div>

            {/* Documented Preferences & Allergies */}
            <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                  Documented Preferences & Dietary Directives
                </h4>
              </div>

              {prefs ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Allergies */}
                  <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> Allergies & Intolerances
                    </span>
                    {prefs.allergies && prefs.allergies.length > 0 ? (
                      <ul className="space-y-1 text-slate-700 dark:text-mist-200">
                        {prefs.allergies.map((all, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {all}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 dark:text-mist-400 italic">No allergies recorded</p>
                    )}
                  </div>

                  {/* Dietary Requirements */}
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <UtensilsCrossed className="h-4 w-4" /> Dietary Preferences
                    </span>
                    {prefs.dietary && prefs.dietary.length > 0 ? (
                      <ul className="space-y-1 text-slate-700 dark:text-mist-200">
                        {prefs.dietary.map((d, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 dark:text-mist-400 italic">Standard dining</p>
                    )}
                  </div>

                  {/* Special Requests & Room Setup */}
                  <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-2">
                    <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Room Atmosphere
                    </span>
                    {prefs.specialRequests && prefs.specialRequests.length > 0 ? (
                      <ul className="space-y-1 text-slate-700 dark:text-mist-200">
                        {prefs.specialRequests.map((req, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 dark:text-mist-400 italic">Standard executive setup</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs text-mist-400">
                  No custom profile stored in PMS for this room. Front Desk can capture preferences at check-in.
                </div>
              )}
            </div>

            {/* Guest Reminders & Milestones */}
            <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                    VIP Scheduled Reminders & Milestones ({reminders.length})
                  </h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddReminderModal(true)}
                  className="gap-1 text-xs text-amber-400 border-amber-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Reminder
                </Button>
              </div>

              {reminders.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400 dark:text-mist-400">
                  No reminders active for {activeSelected.guest}. Click &quot;Add Reminder&quot; to log a time-sensitive VIP milestone.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reminders.map((rem) => {
                    const isPending = rem.status === 'pending';
                    return (
                      <div
                        key={rem.id}
                        className={cn(
                          'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                          isPending
                            ? 'border-amber-500/30 bg-amber-500/[0.04]'
                            : 'border-white/10 bg-white/[0.02] opacity-75',
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-navy-950 dark:text-white">
                              {rem.title}
                            </span>
                            <Badge
                              tone={
                                rem.priority === 'urgent'
                                  ? 'danger'
                                  : rem.priority === 'vip'
                                  ? 'accent'
                                  : 'info'
                              }
                              className="text-[10px]"
                            >
                              {rem.priority.toUpperCase()}
                            </Badge>
                            <Badge tone={isPending ? 'warning' : 'success'} className="text-[10px]">
                              {rem.status}
                            </Badge>
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
                              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark Done
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateGuestReminderStatus(rem.id, 'pending')}
                              className="text-xs text-mist-400 gap-1"
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

            {/* Active Complaints & Recovery Status */}
            {complaints.length > 0 && (
              <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/[0.04] backdrop-blur-xl shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-rose-500">
                  <MessageSquareWarning className="h-5 w-5" />
                  <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                    Recorded Guest Grievances ({complaints.length})
                  </h4>
                </div>

                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy-950 dark:text-white flex items-center gap-1.5">
                          <span>{c.description}</span>
                        </span>
                        <Badge tone={c.compApplied ? 'success' : 'danger'}>
                          {c.compApplied ? 'Resolved' : 'Pending Recovery'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-mist-300">
                        <span>Category: {c.category}</span>
                        <span>· Compensation: {c.compOffered || 'None'}</span>
                        <span>· Amount: {money(c.compAmount || 0)}</span>
                      </div>
                      <div className="text-[11px] text-mist-400">Logged by: {c.loggedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-mist-400 rounded-3xl border border-dashed border-white/10">
            No VIP guest selected.
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddReminderModal && activeSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                Add VIP Reminder
              </h3>
              <button
                type="button"
                onClick={() => setShowAddReminderModal(false)}
                className="text-mist-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-mist-400">
              For <strong>{activeSelected.guest}</strong> in Room <strong>{activeSelected.room}</strong>. Synchronizes across GM and Front Desk.
            </p>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="e.g. Deliver chilled vintage champagne at 19:30"
                  className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  placeholder="Specific butler instructions, allergies or dietary notes..."
                  className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-mist-300 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={reminderDueTime}
                    onChange={(e) => setReminderDueTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mist-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={reminderPriority}
                    onChange={(e) => setReminderPriority(e.target.value as GuestReminderPriority)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="text-xs text-mist-400"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-amber-500 text-ink-950 font-bold hover:bg-amber-400">
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

function useMemoCombinedTasks(state: any, roomNumber?: string) {
  if (!roomNumber) return [];
  const list = [
    ...(state.items.front_desk_coordinator ?? []),
    ...(state.items.department_manager ?? []),
    ...(state.items.task_fulfiller ?? []),
  ];
  return list.filter((i) => i.room === roomNumber);
}
