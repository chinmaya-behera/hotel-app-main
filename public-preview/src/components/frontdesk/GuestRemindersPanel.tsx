'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  User,
  AlertCircle,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  AlarmClock,
  Check,
  CheckCheck,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import type { GuestReminder } from '@/types/demo';
import { MaterialTimePickerModal, type ReminderConfigData } from './MaterialTimePickerModal';

type ReminderTab = 'all' | 'upcoming' | 'overdue' | 'completed';

export function GuestRemindersPanel() {
  const {
    state,
    createGuestReminder,
    updateGuestReminderStatus,
    updateGuestReminder,
    deleteGuestReminder,
  } = useDemo();
  const [activeTab, setActiveTab] = useState<ReminderTab>('all');

  // Side-by-Side Time Picker & Minimal Details Modal state
  const [editingReminder, setEditingReminder] = useState<GuestReminder | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated ringing alarm state (can be triggered by timer or test button)
  const [ringingReminderId, setRingingReminderId] = useState<string | null>('rem-demo-1');
  const [snoozedMessage, setSnoozedMessage] = useState<string | null>(null);

  const reminders = state.guestReminders ?? [];

  // Seed default realistic reminders if none exist
  const effectiveReminders: GuestReminder[] = reminders.length > 0 ? reminders : [
    {
      id: 'rem-demo-1',
      title: 'Evening Turndown & Extra Pillows',
      guestName: 'Elena Rostova',
      room: '402',
      caseRef: 'REQ-2026-402',
      dueDateTime: 'Today, 20:00',
      dueDate: 'Today',
      dueTime: '20:00',
      leadMinutes: 15,
      alertAtMs: Date.now() - 60000, // triggered
      status: 'pending',
      priority: 'vip',
      assignedTo: 'Sunita Patel (Front Desk)',
      text: 'Deliver extra hypoallergenic pillows and confirm evening dinner reservation at Azure Coastal.',
      createdAt: '09:30',
      createdBy: 'Front Desk Coordinator',
      alarm: { state: 'ringing', firedAtMs: Date.now() - 60000 },
    },
    {
      id: 'rem-demo-2',
      title: 'Airport Limousine Pickup Check',
      guestName: 'Priya Nair',
      room: '518',
      caseRef: 'FD-2042',
      dueDateTime: 'Today, 18:00',
      dueDate: 'Today',
      dueTime: '18:00',
      leadMinutes: 30,
      alertAtMs: Date.now() + 3600000,
      status: 'pending',
      priority: 'vip',
      assignedTo: 'Concierge Team',
      text: 'Confirm Mercedes S-Class chauffeur dispatch with driver Imran for Terminal 2 arrival.',
      createdAt: '09:15',
      createdBy: 'Front Desk Coordinator',
      alarm: { state: 'scheduled' },
    },
    {
      id: 'rem-demo-3',
      title: 'AC Maintenance Follow-Up Call',
      guestName: 'Marcus Chen',
      room: '305',
      caseRef: 'CMP-2026-102',
      dueDateTime: 'Today, 11:30',
      dueDate: 'Today',
      dueTime: '11:30',
      leadMinutes: 10,
      status: 'completed',
      priority: 'urgent',
      assignedTo: 'Wei Chen (Engineering)',
      text: 'Verify FCU actuator vibration eliminated and room temperature at 20°C.',
      createdAt: '08:45',
      createdBy: 'Front Desk Coordinator',
    },
  ];

  // Calculate alert time display string
  const calculateAlertTimeString = (timeStr: string, leadMins: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return `${leadMins} mins before service`;
    let totalMins = h * 60 + m - leadMins;
    if (totalMins < 0) totalMins += 24 * 60;
    const alertH = Math.floor(totalMins / 60);
    const alertM = totalMins % 60;
    return `${alertH.toString().padStart(2, '0')}:${alertM.toString().padStart(2, '0')} (${leadMins}m lead time)`;
  };

  const handleOpenAddModal = () => {
    setEditingReminder(null);
    setIsCreatingNew(true);
  };

  const handleOpenEditModal = (rem: GuestReminder) => {
    setEditingReminder(rem);
    setIsCreatingNew(false);
  };

  const handleSaveReminder = (newTime: string, data?: ReminderConfigData) => {
    if (editingReminder) {
      const day = editingReminder.dueDate || 'Today';
      const updatedDueDateTime = `${day}, ${newTime}`;
      updateGuestReminder(editingReminder.id, {
        dueTime: newTime,
        dueDateTime: updatedDueDateTime,
        title: data?.title || editingReminder.title,
        room: data?.room || editingReminder.room,
        guestName: data?.guestName || editingReminder.guestName,
        assignedTo: data?.assignedTo || editingReminder.assignedTo,
        text: data?.instructions || editingReminder.text,
      });
      setToastMessage(
        `✓ Reminder updated for ${data?.guestName || editingReminder.guestName} (Room ${data?.room || editingReminder.room}) at ${newTime}`
      );
    } else if (isCreatingNew && data) {
      createGuestReminder({
        title: data.title.trim() || 'Guest Service Reminder',
        room: data.room.trim() || 'General',
        guestName: data.guestName.trim() || 'In-House Guest',
        assignedTo: data.assignedTo || 'Front Desk Coordinator',
        text: data.instructions.trim() || 'Attend to guest service at scheduled time.',
        dueTime: newTime,
        dueDateTime: `Today, ${newTime}`,
        dueDate: 'Today',
        leadMinutes: 15,
        priority: 'vip',
        status: 'pending',
        createdBy: 'Front Desk Coordinator',
        alarm: { state: 'scheduled' },
      });
      setToastMessage(
        `✓ New reminder scheduled for ${data.guestName} (Room ${data.room}) at ${newTime}`
      );
    }
    setEditingReminder(null);
    setIsCreatingNew(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Alarm actions
  const handleAcknowledgeAlarm = () => {
    setRingingReminderId(null);
    setSnoozedMessage('Alarm acknowledged. Front Desk coordinator attending to guest service.');
    setTimeout(() => setSnoozedMessage(null), 4000);
  };

  const handleSnoozeAlarm = (minutes: number) => {
    setRingingReminderId(null);
    setSnoozedMessage(`Alarm snoozed for +${minutes} minutes.`);
    setTimeout(() => setSnoozedMessage(null), 4000);
  };

  const handleCompleteAlarm = (id: string) => {
    setRingingReminderId(null);
    updateGuestReminderStatus(id, 'completed');
    setSnoozedMessage('Reminder marked completed and closed.');
    setTimeout(() => setSnoozedMessage(null), 4000);
  };

  // Filter reminders
  const filteredReminders = effectiveReminders.filter((rem) => {
    if (activeTab === 'upcoming') return rem.status === 'pending';
    if (activeTab === 'overdue') return rem.status === 'pending' && rem.dueTime && rem.dueTime < '12:00';
    if (activeTab === 'completed') return rem.status === 'completed';
    return true;
  });

  const ringingItem = effectiveReminders.find((r) => r.id === ringingReminderId && r.status !== 'completed');

  return (
    <div className="space-y-5">
      {/* 1. In-App Ringing Alarm Banner */}
      {ringingItem && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 shadow-2xl shadow-amber-500/20 backdrop-blur-xl animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-amber-400 text-ink-950 flex items-center justify-center font-extrabold shadow-lg shrink-0">
                <BellRing className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-ink-950">
                    Lead Service Alarm Ringing
                  </span>
                  <span className="text-xs font-bold text-amber-200">
                    Room {ringingItem.room} · {ringingItem.guestName}
                  </span>
                  {ringingItem.caseRef && (
                    <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/30">
                      {ringingItem.caseRef}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {ringingItem.title || 'Guest Operational Service Due'}
                </h3>
                <p className="text-xs text-mist-200 leading-relaxed">
                  {ringingItem.text}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-mist-300 pt-1">
                  <span>Scheduled Time: <strong className="text-white">{ringingItem.dueDateTime}</strong></span>
                  <span>· Assigned to: <strong className="text-cyan-300">{ringingItem.assignedTo || 'Front Desk'}</strong></span>
                </div>
              </div>
            </div>

            {/* Alarm Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                variant="accent"
                iconLeft={CheckCircle2}
                onClick={handleAcknowledgeAlarm}
              >
                Acknowledge
              </Button>
              <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSnoozeAlarm(5)}
                  className="px-2 py-1 text-[11px] text-mist-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  Snooze +5m
                </button>
                <button
                  type="button"
                  onClick={() => handleSnoozeAlarm(10)}
                  className="px-2 py-1 text-[11px] text-mist-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  +10m
                </button>
                <button
                  type="button"
                  onClick={() => handleSnoozeAlarm(15)}
                  className="px-2 py-1 text-[11px] text-mist-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  +15m
                </button>
              </div>
              <Button
                size="sm"
                variant="subtle"
                iconLeft={Check}
                onClick={() => handleCompleteAlarm(ringingItem.id)}
              >
                Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snooze Toast Feedback */}
      {snoozedMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{snoozedMessage}</span>
        </div>
      )}

      {/* Reminder Custom Time Toast Feedback */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls Row: Sub-Tabs + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          {(['all', 'upcoming', 'overdue', 'completed'] as ReminderTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${activeTab === t
                  ? 'bg-amber-400 text-ink-950 shadow-sm'
                  : 'text-mist-300 hover:text-white'
                }`}
            >
              {t} ({
                t === 'all'
                  ? effectiveReminders.length
                  : t === 'upcoming'
                    ? effectiveReminders.filter((r) => r.status === 'pending').length
                    : t === 'overdue'
                      ? effectiveReminders.filter((r) => r.status === 'pending' && r.dueTime && r.dueTime < '12:00').length
                      : effectiveReminders.filter((r) => r.status === 'completed').length
              })
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="accent"
          iconLeft={Plus}
          onClick={handleOpenAddModal}
        >
          Add Reminder
        </Button>
      </div>

      {/* 2. Reminders Hub List */}
      <Panel
        title={`Reminders Schedule (${effectiveReminders.filter((r) => r.status === 'pending').length} Active)`}
        hint="Configured timers with lead alarms, stay links, and operational status."
        icon={Clock}
      >
        {filteredReminders.length === 0 ? (
          <div className="p-8 text-center text-sm text-mist-400">
            No reminders match this filter view.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08] rounded-2xl border border-white/10 bg-white/[0.02]">
            {filteredReminders.map((rem) => {
              const isPending = rem.status === 'pending';
              const isRinging = rem.id === ringingReminderId;

              return (
                <div
                  key={rem.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${isRinging
                      ? 'bg-amber-400/10 border-l-4 border-l-amber-400'
                      : !isPending
                        ? 'opacity-60 bg-white/[0.01]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {rem.title || rem.guestName}
                      </span>
                      <Badge tone="neutral">Room {rem.room}</Badge>
                      <Badge tone={rem.priority === 'vip' ? 'accent' : rem.priority === 'urgent' ? 'danger' : 'neutral'}>
                        {rem.priority.toUpperCase()}
                      </Badge>
                      <Badge tone={rem.status === 'completed' ? 'success' : rem.status === 'pending' ? 'warning' : 'neutral'}>
                        {(rem.status ?? 'pending').toUpperCase()}
                      </Badge>
                      {rem.caseRef && (
                        <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                          {rem.caseRef}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-mist-200">{rem.text}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-mist-400 pt-0.5">
                      <button
                        type="button"
                        onClick={() => isPending && handleOpenEditModal(rem)}
                        className={`inline-flex items-center gap-1 text-left ${isPending ? 'hover:text-blue-300 hover:underline cursor-pointer group' : ''
                          }`}
                        title={isPending ? 'Click to customize reminding time and notes' : undefined}
                      >
                        <Clock className="h-3 w-3 text-amber-300 group-hover:text-blue-300" />
                        <span>Due: <strong className="text-white group-hover:text-blue-200">{rem.dueDateTime}</strong></span>
                      </button>
                      <span>·</span>
                      <span>Lead: <strong className="text-cyan-300">{rem.leadMinutes ?? 15}m before</strong></span>
                      <span>·</span>
                      <span>Assigned: <strong className="text-mist-200">{rem.assignedTo || 'Front Desk'}</strong></span>
                      <span>·</span>
                      <span>Guest: <strong>{rem.guestName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Individual Reminder Time Customization Button */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(rem)}
                        className="px-2.5 py-1 rounded-lg border border-blue-400/40 bg-blue-500/10 text-[#8ab4f8] text-[11px] font-semibold hover:bg-blue-500/20 transition flex items-center gap-1.5 shadow-sm"
                        title="Customize reminding time and reminder details"
                      >
                        <Clock className="h-3 w-3" />
                        <span>Set Time</span>
                      </button>
                    )}

                    {/* Ring Now Test Button */}
                    {isPending && !isRinging && (
                      <button
                        type="button"
                        onClick={() => setRingingReminderId(rem.id)}
                        className="px-2.5 py-1 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300 text-[11px] font-semibold hover:bg-amber-400/20 transition flex items-center gap-1"
                        title="Simulate alarm trigger now for demo inspection"
                      >
                        <BellRing className="h-3 w-3" />
                        <span>Test Alarm</span>
                      </button>
                    )}

                    {isPending ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        iconLeft={CheckCircle2}
                        onClick={() => handleCompleteAlarm(rem.id)}
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

      {/* 3. Material 3 Side-by-Side Time Picker & Minimal Details Modal */}
      <MaterialTimePickerModal
        isOpen={Boolean(editingReminder) || isCreatingNew}
        showReminderFields={true}
        initialTime={editingReminder?.dueTime || '20:00'}
        initialData={
          editingReminder
            ? {
              title: editingReminder.title,
              room: editingReminder.room,
              guestName: editingReminder.guestName,
              assignedTo: editingReminder.assignedTo || 'Front Desk Coordinator',
              instructions: editingReminder.text,
            }
            : {
              title: '',
              room: '',
              guestName: '',
              assignedTo: 'Front Desk Coordinator',
              instructions: '',
            }
        }
        title={
          editingReminder
            ? `Set Time & Details · Room ${editingReminder.room} (${editingReminder.guestName})`
            : 'New Guest Reminder · Timer & Details'
        }
        onClose={() => {
          setEditingReminder(null);
          setIsCreatingNew(false);
        }}
        onConfirm={handleSaveReminder}
      />
    </div>
  );
}
