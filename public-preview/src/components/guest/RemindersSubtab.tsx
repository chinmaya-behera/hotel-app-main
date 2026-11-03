'use client';

import { useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  User,
  Car,
  PhoneCall,
  LogOut,
  Briefcase,
  AlertCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { GuestReminder } from '@/types/demo';

const QUICK_PRESETS = [
  {
    title: 'Wake-Up Call at 06:00 AM',
    dueTime: 'Tomorrow, 06:00 AM',
    icon: PhoneCall,
    description: 'Automated and operator follow-up wake-up call to room telephone.',
    priority: 'normal' as const,
  },
  {
    title: 'Airport Taxi at 08:00 AM',
    dueTime: 'Tomorrow, 08:00 AM',
    icon: Car,
    description: 'Arrange private chauffeur or airport premium taxi at the main lobby.',
    priority: 'vip' as const,
  },
  {
    title: 'Checkout Reminder at 11:00 AM',
    dueTime: 'Departure Day, 11:00 AM',
    icon: LogOut,
    description: 'Front Desk alert prior to scheduled noon checkout.',
    priority: 'normal' as const,
  },
  {
    title: 'Luggage Collection Assistance',
    dueTime: 'Departure Day, 11:30 AM',
    icon: Briefcase,
    description: 'Bellhop to collect checked baggage from room for vehicle loading.',
    priority: 'normal' as const,
  },
];

export function RemindersSubtab({ room, guestName }: GuestTabProps) {
  const { state, createGuestReminder, updateGuestReminderStatus, deleteGuestReminder } = useDemo();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateTime, setDueDateTime] = useState('Tomorrow, 07:00 AM');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [priority, setPriority] = useState<GuestReminder['priority']>('normal');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter reminders for this room / guest
  const roomReminders = (state.guestReminders ?? []).filter(
    (r) => r.room === room || r.guestName.toLowerCase().includes(guestName.toLowerCase().split(' ')[0]),
  );

  const pendingReminders = roomReminders.filter((r) => r.status === 'pending');
  const completedReminders = roomReminders.filter((r) => r.status === 'completed' || r.status === 'dismissed');

  const displayedList =
    filter === 'pending' ? pendingReminders : filter === 'completed' ? completedReminders : roomReminders;

  function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    createGuestReminder({
      guestName,
      room,
      title: title.trim(),
      text: description.trim() || title.trim(),
      notes: specialInstructions.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      dueDateTime,
      dueDate: dueDateTime.split(',')[0]?.trim() || 'Today',
      dueTime: dueDateTime.split(',')[1]?.trim() || dueDateTime,
      status: 'pending',
      priority,
      category: 'front_desk_guest',
      createdBy: `${guestName} (Guest Portal)`,
      assignedTo: 'Front Desk Team',
    });

    setTitle('');
    setDescription('');
    setSpecialInstructions('');
    setIsModalOpen(false);
    setSuccessToast(`Reminder "${title.trim()}" dispatched to Front Desk`);
    setTimeout(() => setSuccessToast(null), 5000);
  }

  function applyPreset(p: (typeof QUICK_PRESETS)[0]) {
    setTitle(p.title);
    setDescription(p.description);
    setDueDateTime(p.dueTime);
    setPriority(p.priority);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <p className="font-semibold text-emerald-300">Front Desk Scheduled</p>
            <p className="text-xs text-mist-200 mt-0.5">{successToast}</p>
          </div>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="guest-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Front Desk Reminders</h2>
              <p className="text-[11px] text-mist-400">Scheduled services requiring Front Desk staff coordination</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
              setSpecialInstructions('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Reminder</span>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <GuestSectionHeader title="Popular Front Desk Reminders" hint="Tap any preset to prefill and customize" />
        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.title}
                type="button"
                onClick={() => applyPreset(p)}
                className="guest-tile p-3 text-left flex flex-col justify-between"
              >
                <div>
                  <span className="icon-tile h-7 w-7 rounded-lg bg-amber-400/15 text-amber-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="mt-2 text-xs font-bold text-white">{p.title}</p>
                  <p className="text-[10px] text-mist-400 mt-0.5 line-clamp-2">{p.description}</p>
                </div>
                <span className="text-[10px] text-amber-300 font-semibold mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {p.dueTime}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminders List & Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <GuestSectionHeader title="Your Scheduled Reminders" />
          <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08] text-[11px]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-2 py-0.5 rounded font-semibold transition',
                filter === 'all' ? 'bg-amber-400 text-ink-950' : 'text-mist-400 hover:text-white',
              )}
            >
              All ({roomReminders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={cn(
                'px-2 py-0.5 rounded font-semibold transition',
                filter === 'pending' ? 'bg-amber-400 text-ink-950' : 'text-mist-400 hover:text-white',
              )}
            >
              Upcoming ({pendingReminders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={cn(
                'px-2 py-0.5 rounded font-semibold transition',
                filter === 'completed' ? 'bg-amber-400 text-ink-950' : 'text-mist-400 hover:text-white',
              )}
            >
              Completed ({completedReminders.length})
            </button>
          </div>
        </div>

        {displayedList.length === 0 ? (
          <GuestEmptyState icon={Bell} title="No reminders found" hint="Create a reminder above or pick a quick preset for Front Desk action." />
        ) : (
          <ul className="space-y-2.5">
            {displayedList.map((rem) => {
              const isPending = rem.status === 'pending';
              return (
                <li key={rem.id} className="guest-card p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{rem.title || rem.text}</span>
                        {rem.priority === 'vip' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-mist-300 text-xs mt-1">{rem.text}</p>
                      {rem.specialInstructions && (
                        <p className="text-[11px] text-amber-200/90 bg-white/[0.02] p-1.5 rounded mt-1 border border-white/5 italic">
                          Special Note: {rem.specialInstructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <GuestPill tone={isPending ? 'warning' : 'success'}>
                        {isPending ? 'Upcoming' : 'Completed'}
                      </GuestPill>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-mist-400">
                    <span className="flex items-center gap-1 text-mist-300">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{rem.dueDateTime}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => updateGuestReminderStatus(rem.id, 'completed')}
                          className="text-xs text-emerald-400 hover:underline font-semibold"
                        >
                          Mark Done
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteGuestReminder(rem.id)}
                        className="p-1 rounded text-mist-400 hover:text-rose-400"
                        title="Delete reminder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400/20 text-amber-300">
                  <Bell className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold">Schedule Front Desk Reminder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3 text-xs">
              <div>
                <label className="block text-mist-300 font-semibold mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wake-up call, Taxi arrangement, Checkout prep"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Date &amp; Time Window *</label>
                <input
                  type="text"
                  required
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  placeholder="e.g. Tomorrow, 06:30 AM or 2026-10-24 14:00"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Description / Request Details</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context for the Front Desk team..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Special Instructions for Front Desk</label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. If no answer on phone, please send attendant to knock gently."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-center font-semibold transition',
                      priority === 'normal'
                        ? 'border-amber-400 bg-amber-400/20 text-white'
                        : 'border-white/10 text-mist-400 hover:text-white',
                    )}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('vip')}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-center font-semibold transition',
                      priority === 'vip'
                        ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                        : 'border-white/10 text-mist-400 hover:text-white',
                    )}
                  >
                    VIP Priority
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 disabled:opacity-40"
                >
                  Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

