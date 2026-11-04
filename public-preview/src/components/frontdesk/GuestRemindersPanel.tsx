'use client';

import { useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import type { GuestReminder } from '@/types/demo';

export function GuestRemindersPanel() {
  const { state, createGuestReminder, updateGuestReminderStatus, deleteGuestReminder } = useDemo();
  const [showAddForm, setShowAddForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [room, setRoom] = useState('402');
  const [text, setText] = useState('');
  const [dueDateTime, setDueDateTime] = useState('Today, 20:00');
  const [priority, setPriority] = useState<GuestReminder['priority']>('normal');

  const stays = state.frontDesk?.stays ?? [];
  const reminders = state.guestReminders ?? [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !text.trim()) return;

    createGuestReminder({
      guestName: guestName.trim(),
      room,
      text: text.trim(),
      dueDateTime,
      status: 'pending',
      priority,
      createdBy: 'Front Desk Coordinator',
    });

    setGuestName('');
    setText('');
    setShowAddForm(false);
  };

  const handleSelectStay = (stayId: string) => {
    const s = stays.find((x) => x.id === stayId);
    if (s) {
      setGuestName(s.guest);
      setRoom(s.room);
      if (s.vip) setPriority('vip');
    }
  };

  const pendingCount = reminders.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <span>Guest Operational Reminders</span>
          </h2>
          <p className="text-xs text-mist-400 mt-0.5">
            Internal front desk reminders for guest special requests, wake-up alerts, and VIP arrivals. (No automated external messages sent).
          </p>
        </div>

        <Button
          size="sm"
          variant="accent"
          iconLeft={Plus}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel Reminder' : 'Log New Reminder'}
        </Button>
      </div>

      {/* Creation Modal/Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/10 bg-ink-900/90 p-5 space-y-4 shadow-xl backdrop-blur-xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Create Guest Operational Reminder</span>
            </h3>
            <span className="text-[11px] text-mist-400">Authorized Front Desk Staff Only</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Quick Select Active Stay
              </label>
              <select
                onChange={(e) => handleSelectStay(e.target.value)}
                className="field w-full text-xs"
              >
                <option value="">-- Choose guest from in-house / expected stays --</option>
                {stays.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.guest} (Room {st.room} · {st.status === 'in_house' ? 'In House' : 'Expected'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Guest Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anya Sharma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Room Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 402"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Due Date / Time
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Today, 20:00 or Tomorrow, 06:30"
                value={dueDateTime}
                onChange={(e) => setDueDateTime(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Reminder Text & Action Instructions
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Deliver extra hypoallergenic pillows and confirm airport limousine transfer BK-7740"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GuestReminder['priority'])}
                className="field w-full text-xs"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="vip">VIP Guest</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.08]">
            <Button size="sm" variant="subtle" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="accent" type="submit">
              Save Reminder
            </Button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <Panel
        title={`Reminders Log (${pendingCount} Pending)`}
        hint="Track due items and mark completed when fulfilled"
        icon={Clock}
      >
        {reminders.length === 0 ? (
          <div className="p-8 text-center text-sm text-mist-400">
            No guest reminders recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08] rounded-2xl border border-white/10 bg-white/[0.02]">
            {reminders.map((rem) => {
              const isPending = rem.status === 'pending';
              return (
                <div
                  key={rem.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    !isPending ? 'opacity-60 bg-white/[0.01]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-white">{rem.guestName}</span>
                      <Badge tone="neutral">Room {rem.room}</Badge>
                      <Badge tone={rem.priority === 'vip' ? 'accent' : rem.priority === 'urgent' ? 'danger' : 'neutral'}>
                        {rem.priority.toUpperCase()}
                      </Badge>
                      <Badge tone={rem.status === 'completed' ? 'success' : rem.status === 'pending' ? 'warning' : 'neutral'}>
                        {(rem.status ?? "pending").toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-mist-200">{rem.text}</p>
                    <div className="flex items-center gap-3 text-[11px] text-mist-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-300" />
                        <span>Due: <strong className="text-white">{rem.dueDateTime}</strong></span>
                      </span>
                      <span>·</span>
                      <span>Created: {rem.createdAt} by {rem.createdBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        iconLeft={CheckCircle2}
                        onClick={() => updateGuestReminderStatus(rem.id, 'completed')}
                      >
                        Mark Completed
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => updateGuestReminderStatus(rem.id, 'pending')}
                      >
                        Reopen
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label="Delete reminder"
                      onClick={() => deleteGuestReminder(rem.id)}
                      className="p-1.5 text-mist-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
