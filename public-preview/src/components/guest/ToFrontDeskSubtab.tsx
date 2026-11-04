'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  Plus,
  ArrowRight,
  CornerDownRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, statusTone } from '@/lib/utils';
import { Radio, AlertTriangle, Trash2, Megaphone } from 'lucide-react';
import { useEmergencyBroadcast, ALERT_PRESETS, type AlertSeverity } from '@/lib/emergencyBroadcast';
import { GuestEmptyState, GuestPill, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { GuestFrontDeskMessage } from '@/types/demo';

const FAST_EXAMPLES = [
  {
    subject: 'Extra blanket & hypoallergenic pillows',
    message: 'Hello Front Desk, could you please arrange an extra plush blanket and 2 hypoallergenic pillows for Room {room}?',
    instructions: 'Please deliver around 20:00 this evening if possible.',
  },
  {
    subject: 'Luggage assistance for departure',
    message: 'Good morning, I will be checking out tomorrow at 11:30 AM and need assistance bringing 3 suitcases down to the lobby.',
    instructions: 'Please send a bellhop at 11:15 AM.',
  },
  {
    subject: 'Airport car transfer arrangement',
    message: 'Could you please arrange premium private car transportation from the hotel to the airport for my flight tomorrow?',
    instructions: 'Flight departure is at 16:30. 2 passengers with hand luggage.',
  },
  {
    subject: 'Late return / keycard query',
    message: 'Hello, I will be returning late tonight around 01:30 AM after a business dinner. Just wanted to verify if the side entrance remains keycard-accessible.',
    instructions: 'No immediate reply required, thank you.',
  },
];

export function ToFrontDeskSubtab({ room, guestName }: GuestTabProps) {
  const { state, submitGuestMessageToFrontDesk, replyGuestMessage } = useDemo();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const {
    alert: activeEmergencyAlert,
    isBroadcastActive,
    broadcast: broadcastEmergency,
    clear: clearEmergency,
  } = useEmergencyBroadcast();

  // Emergency Broadcast Form States
  const [alertTitle, setAlertTitle] = useState(
    activeEmergencyAlert?.title || ALERT_PRESETS[0].title
  );
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>(
    activeEmergencyAlert?.severity || ALERT_PRESETS[0].severity
  );
  const [alertDescription, setAlertDescription] = useState(
    activeEmergencyAlert?.description || ALERT_PRESETS[0].description
  );
  const [alertLocation, setAlertLocation] = useState(
    activeEmergencyAlert?.location || ALERT_PRESETS[0].location
  );
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);

  useEffect(() => {
    if (activeEmergencyAlert) {
      setAlertTitle(activeEmergencyAlert.title);
      setAlertSeverity(activeEmergencyAlert.severity);
      setAlertDescription(activeEmergencyAlert.description);
      setAlertLocation(activeEmergencyAlert.location || '');
    }
  }, [activeEmergencyAlert]);

  function handleBroadcast(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!alertTitle.trim() || !alertDescription.trim()) return;
    broadcastEmergency({
      title: alertTitle.trim(),
      description: alertDescription.trim(),
      severity: alertSeverity,
      location: alertLocation.trim() || undefined,
    });
    setSuccessToast(`Emergency Broadcast published: "${alertTitle.trim()}"`);
    setTimeout(() => setSuccessToast(null), 5000);
  }

  function handleClearAlert() {
    clearEmergency();
    setSuccessToast('Emergency Broadcast cleared & deactivated');
    setTimeout(() => setSuccessToast(null), 5000);
  }

  function applyPreset(preset: (typeof ALERT_PRESETS)[0]) {
    setAlertTitle(preset.title);
    setAlertSeverity(preset.severity);
    setAlertDescription(preset.description);
    setAlertLocation(preset.location);
    setIsAlertExpanded(true);
  }

  // Messages for this room
  const messages = (state.frontDeskMessages ?? []).filter((m) => m.room === room);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const id = submitGuestMessageToFrontDesk(room, subject.trim(), message.trim(), instructions.trim() || undefined);
    setSubject('');
    setMessage('');
    setInstructions('');
    setIsComposeOpen(false);
    setSelectedMessageId(id);
    setSuccessToast(`Message delivered to Front Desk coordinator`);
    setTimeout(() => setSuccessToast(null), 5000);
  }

  function handleSendReply(messageId: string) {
    if (!replyInput.trim()) return;
    replyGuestMessage(messageId, replyInput.trim(), 'guest');
    setReplyInput('');
  }

  function applyExample(ex: (typeof FAST_EXAMPLES)[0]) {
    setSubject(ex.subject);
    setMessage(ex.message.replace('{room}', room));
    setInstructions(ex.instructions);
    setIsComposeOpen(true);
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {successToast && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <p className="font-semibold text-emerald-300">Front Desk Dispatch</p>
            <p className="text-xs text-mist-200 mt-0.5">{successToast}</p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="guest-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Front Desk Direct Chat</h2>
              <p className="text-[11px] text-mist-400">Two-way message channel directly with duty coordinators</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubject('');
              setMessage('');
              setInstructions('');
              setIsComposeOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Message</span>
          </button>
        </div>
      </div>

      {/* FRONT DESK EMERGENCY ALERT / URGENT BROADCAST CONSOLE */}
      <div className="guest-card p-4 sm:p-5 border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-ink-950 to-ink-900 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Megaphone className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Emergency Alert / Urgent Broadcast</h3>
                {isBroadcastActive ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-extrabold text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                    LIVE BROADCAST ACTIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    NORMAL OPERATIONS
                  </span>
                )}
              </div>
              <p className="text-[11px] text-mist-400 mt-0.5">
                Front Desk broadcast simulator &mdash; triggers the top emergency alert banner on guest displays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isBroadcastActive && (
              <button
                type="button"
                onClick={handleClearAlert}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear / Deactivate Alert</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAlertExpanded(!isAlertExpanded)}
              className="text-xs font-semibold text-mist-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10"
            >
              {isAlertExpanded ? 'Collapse' : 'Configure Alert'}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-mist-400">
            One-Click Preset Advisories:
          </p>
          <div className="flex flex-wrap gap-2">
            {ALERT_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-rose-400/40 hover:bg-rose-500/10 text-mist-200 hover:text-white transition-all text-left"
              >
                <span className="font-semibold">{preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</span>
                <span className="text-[10px] text-mist-400 ml-1.5">({preset.severity})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration / Custom Alert Form */}
        {isAlertExpanded && (
          <form onSubmit={handleBroadcast} className="space-y-3 pt-2 border-t border-white/10 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-mist-300">Alert Title</label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="e.g. Basement Utility Substation Thermal Fluctuation"
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white text-xs focus:border-rose-400 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-mist-300">Severity</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as AlertSeverity)}
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white text-xs focus:border-rose-400 outline-none"
                >
                  <option value="Critical">Critical (Immediate Action)</option>
                  <option value="Warning">Warning (Advisory)</option>
                  <option value="Urgent">Urgent (Maintenance Notice)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-mist-300">Advisory Details &amp; Guidance</label>
              <textarea
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
                rows={2}
                placeholder="Describe the incident, safety recommendations, or service notice..."
                className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white text-xs focus:border-rose-400 outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                value={alertLocation || ''}
                onChange={(e) => setAlertLocation(e.target.value)}
                placeholder="Affected Location (optional)"
                className="px-3 py-1.5 rounded-xl bg-ink-900 border border-white/10 text-white text-xs w-64 outline-none"
              />

              <div className="flex items-center gap-2">
                {isBroadcastActive && (
                  <button
                    type="button"
                    onClick={handleClearAlert}
                    className="px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
                  >
                    Deactivate
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>{isBroadcastActive ? 'Update Broadcast' : 'Broadcast Emergency Alert'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Fast Message Examples */}
      <div>
        <GuestSectionHeader title="Quick Inquiries &amp; Requests" hint="Tap any template to draft immediately" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FAST_EXAMPLES.map((ex) => (
            <button
              key={ex.subject}
              type="button"
              onClick={() => applyExample(ex)}
              className="guest-tile p-3 text-left flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{ex.subject}</p>
                <p className="text-[11px] text-mist-400 line-clamp-1 mt-0.5">{ex.message.replace('{room}', room)}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-amber-300 shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Message History & Active Thread View */}
      <div className="space-y-3">
        <GuestSectionHeader title="Message Conversations" hint="Full conversation history and Front Desk replies" />

        {messages.length === 0 ? (
          <GuestEmptyState icon={MessageSquare} title="No messages sent yet" hint="Send a message to Front Desk above for any custom assistance or stay queries." />
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => {
              const isSelected = selectedMessageId === msg.id;
              const hasReplies = msg.replies && msg.replies.length > 0;

              return (
                <li key={msg.id} className="guest-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">{msg.subject}</span>
                      </div>
                      <p className="text-mist-400 text-[11px] mt-0.5">
                        {msg.createdAt} · Room {msg.room} · {msg.guestName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <GuestPill
                        tone={
                          msg.status === 'Responded'
                            ? 'success'
                            : msg.status === 'Received'
                              ? 'info'
                              : msg.status === 'Closed'
                                ? 'neutral'
                                : 'warning'
                        }
                      >
                        {msg.status}
                      </GuestPill>
                    </div>
                  </div>

                  {/* Primary Message Body */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-xs space-y-1">
                    <p className="text-mist-200">{msg.message}</p>
                    {msg.instructions && (
                      <p className="text-[11px] text-amber-300/90 pt-1 border-t border-white/5 italic">
                        Special Instructions: {msg.instructions}
                      </p>
                    )}
                  </div>

                  {/* Two-Way Reply Thread */}
                  {hasReplies && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] uppercase font-bold text-mist-400 tracking-wider block">
                        Conversation Thread ({msg.replies.length} replies)
                      </span>

                      <div className="space-y-2">
                        {msg.replies.map((reply) => {
                          const isStaff = reply.sender === 'front_desk';
                          return (
                            <div
                              key={reply.id}
                              className={cn(
                                'p-3 rounded-xl text-xs space-y-1 max-w-[90%]',
                                isStaff
                                  ? 'bg-amber-400/10 border border-amber-400/20 text-white mr-auto'
                                  : 'bg-white/5 border border-white/10 text-mist-200 ml-auto',
                              )}
                            >
                              <div className="flex items-center justify-between text-[10px] text-mist-400">
                                <span className={cn('font-bold', isStaff && 'text-amber-300')}>
                                  {reply.senderName}
                                </span>
                                <span>{reply.at}</span>
                              </div>
                              <p className="text-xs leading-relaxed">{reply.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reply Input Bar */}
                  {msg.status !== 'Closed' && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                      <input
                        type="text"
                        value={isSelected ? replyInput : ''}
                        onFocus={() => setSelectedMessageId(msg.id)}
                        onChange={(e) => {
                          setSelectedMessageId(msg.id);
                          setReplyInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && replyInput.trim()) {
                            handleSendReply(msg.id);
                          }
                        }}
                        placeholder="Type a follow-up reply to Front Desk..."
                        className="guest-field flex-1 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        disabled={!isSelected || !replyInput.trim()}
                        onClick={() => handleSendReply(msg.id)}
                        className="px-3.5 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 disabled:opacity-40 text-xs flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400/20 text-amber-300">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold">Message to Front Desk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
              <div>
                <label className="block text-mist-300 font-semibold mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Extra blanket, Late arrival, Luggage inquiry"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Message Body *</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain your inquiry or request to the Front Desk team..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Additional Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Preferred delivery time, passenger count, special handling notes"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-mist-400">
                Associated automatically with Room {room} · {guestName}.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!subject.trim() || !message.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

