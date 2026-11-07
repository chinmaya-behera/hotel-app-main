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
import type { GuestReminder, GuestReminderPriority } from '@/types/demo';

type ReminderTab = 'all' | 'upcoming' | 'overdue' | 'completed';

const LEAD_TIME_OPTIONS = [
  { label: '5 minutes before', minutes: 5 },
  { label: '10 minutes before', minutes: 10 },
  { label: '15 minutes before (Recommended)', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '60 minutes before (1 hour)', minutes: 60 },
  { label: 'At service time (0m)', minutes: 0 },
];

export function GuestRemindersPanel() {
  const { state, createGuestReminder, updateGuestReminderStatus, deleteGuestReminder } = useDemo();
  const [activeTab, setActiveTab] = useState<ReminderTab>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('Evening Turndown & Extra Towels');
  const [guestName, setGuestName] = useState('Elena Rostova');
  const [room, setRoom] = useState('402');
  const [caseRef, setCaseRef] = useState('REQ-2026-402');
  const [serviceDate, setServiceDate] = useState('Today');
  const [serviceTime, setServiceTime] = useState('20:00');
  const [leadMinutes, setLeadMinutes] = useState(15);
  const [assignedTo, setAssignedTo] = useState('Front Desk Coordinator');
  const [instructions, setInstructions] = useState('Verify guest is in room and deliver extra plush towels with lavender pillow mist.');
  const [priority, setPriority] = useState<GuestReminderPriority>('vip');

  // Simulated ringing alarm state (can be triggered by timer or test button)
  const [ringingReminderId, setRingingReminderId] = useState<string | null>('rem-demo-1');
  const [snoozedMessage, setSnoozedMessage] = useState<string | null>(null);

  const stays = state.frontDesk?.stays ?? [];
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !title.trim()) return;

    createGuestReminder({
      title: title.trim(),
      guestName: guestName.trim(),
      room,
      caseRef: caseRef.trim() || undefined,
      dueDateTime: `${serviceDate}, ${serviceTime}`,
      dueDate: serviceDate,
      dueTime: serviceTime,
      leadMinutes,
      status: 'pending',
      priority,
      assignedTo,
      text: instructions.trim(),
      createdBy: 'Sunita Patel (Front Desk)',
      alarm: { state: 'scheduled' },
    });

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

      {/* Top Controls Row: Sub-Tabs + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          {(['all', 'upcoming', 'overdue', 'completed'] as ReminderTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                activeTab === t
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
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel Form' : '+ Create Customizable Reminder'}
        </Button>
      </div>

      {/* 2. Customizable Reminder Creation Drawer / Modal */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/15 bg-ink-900/95 p-5 sm:p-6 space-y-4 shadow-2xl backdrop-blur-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Configure Guest Service Reminder &amp; Alarm Timer</span>
              </h3>
              <p className="text-xs text-mist-400">
                Calculates automatic alarm lead-time before guest requested service.
              </p>
            </div>
            <span className="text-[11px] text-amber-300 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Station FD-02
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            {/* Quick Stay Select */}
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Quick Select Active In-House Guest Stay
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

            {/* Reminder Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Reminder Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Evening Turndown & Extra Towels"
                className="field w-full text-xs"
              />
            </div>

            {/* Related Case Ref */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Related Case / Request ID
              </label>
              <input
                type="text"
                value={caseRef}
                onChange={(e) => setCaseRef(e.target.value)}
                placeholder="e.g. REQ-2026-402"
                className="field w-full text-xs font-mono"
              />
            </div>

            {/* Guest Name */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Guest Full Name
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="field w-full text-xs"
              />
            </div>

            {/* Room */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Room Number
              </label>
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. 402"
                className="field w-full text-xs"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GuestReminderPriority)}
                className="field w-full text-xs"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="vip">VIP Guest</option>
              </select>
            </div>

            {/* Guest Requested Service Date */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Service Date
              </label>
              <input
                type="text"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                placeholder="Today / Tomorrow"
                className="field w-full text-xs"
              />
            </div>

            {/* Guest Requested Service Time */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Requested Service Time (24h)
              </label>
              <input
                type="time"
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
                className="field w-full text-xs font-mono"
              />
            </div>

            {/* Custom Lead Time Selector */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Alarm Lead Time Before Service
              </label>
              <select
                value={leadMinutes}
                onChange={(e) => setLeadMinutes(Number(e.target.value))}
                className="field w-full text-xs"
              >
                {LEAD_TIME_OPTIONS.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculated Alert Time Badge Display */}
            <div className="sm:col-span-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-mist-200">
                  Calculated In-App Alert Alarm Time:
                </span>
                <strong className="text-amber-300 font-mono text-sm">
                  {calculateAlertTimeString(serviceTime, leadMinutes)}
                </strong>
              </div>
              <span className="text-[11px] text-mist-400 italic">
                * Rings banner and notifies coordinator before fulfillment window.
              </span>
            </div>

            {/* Assigned Staff */}
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Assigned Staff / Team
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="field w-full text-xs"
              >
                <option value="Front Desk Coordinator">Front Desk Coordinator</option>
                <option value="Housekeeping Attendant">Housekeeping Attendant</option>
                <option value="Engineering Maintenance">Engineering Maintenance</option>
                <option value="F&B Room Service">F&B Room Service</option>
                <option value="Concierge Chauffeur">Concierge Chauffeur</option>
              </select>
            </div>

            {/* Instructions */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-mist-300 mb-1 block">
                Reminder Instructions &amp; Action Notes
              </label>
              <textarea
                required
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Action notes for fulfillment team..."
                className="field w-full text-xs resize-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
            <Button size="sm" variant="subtle" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="accent" type="submit">
              Save Reminder &amp; Arm Alarm
            </Button>
          </div>
        </form>
      )}

      {/* 3. Reminders Hub List */}
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
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isRinging
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
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-300" />
                        <span>Due: <strong className="text-white">{rem.dueDateTime}</strong></span>
                      </span>
                      <span>·</span>
                      <span>Lead: <strong className="text-cyan-300">{rem.leadMinutes ?? 15}m before</strong></span>
                      <span>·</span>
                      <span>Assigned: <strong className="text-mist-200">{rem.assignedTo || 'Front Desk'}</strong></span>
                      <span>·</span>
                      <span>Guest: <strong>{rem.guestName}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
    </div>
  );
}
