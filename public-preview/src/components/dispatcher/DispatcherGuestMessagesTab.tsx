'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Bot,
  Info,
  History,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';

const AUTOMATED_TEMPLATES = [
  {
    id: 'dispatched',
    label: 'Request Dispatched & En Route',
    category: 'Dispatch',
    template: (room: string, title: string, assignee: string) =>
      `Namaste from Grand Azure. Your request for "${title}" has been assigned to attendant ${assignee || 'our team'} and is now on the way to Room ${room}. Expected arrival in ~5–10 minutes.`,
  },
  {
    id: 'in_progress',
    label: 'Service In Progress',
    category: 'Status Update',
    template: (room: string, title: string, assignee: string) =>
      `Dear Guest, attendant ${assignee || 'our team'} has commenced work on "${title}" in Room ${room}. We will notify you once completed.`,
  },
  {
    id: 'inspected',
    label: 'Quality Inspection Passed',
    category: 'Quality Assurance',
    template: (room: string) =>
      `Dear Guest, your room ${room} has been personally inspected and approved to Grand Azure 5-star quality standards by Supervisor Meera Nambiar.`,
  },
  {
    id: 'completed',
    label: 'Service Completed',
    category: 'Completion',
    template: (room: string, title: string) =>
      `Dear Guest, your request for "${title}" has been completed. Please let us know if you require any further assistance. Dial 0 or reach out via your portal.`,
  },
  {
    id: 'turnaround_delay',
    label: 'Friendly Courtesy Notice',
    category: 'Alert',
    template: (room: string, title: string) =>
      `Dear Guest, thank you for your patience while we prepare your request for "${title}". Our team is ensuring every detail meets our luxury standards.`,
  },
];

export function DispatcherGuestMessagesTab() {
  const { state, simulateGuestMessage } = useDemo();

  const allTasks = [
    ...(state.items.department_dispatcher_supervisor ?? []),
    ...(state.items.department_dispatcher ?? []),
  ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const activeTasks = allTasks.filter((t) => t.status !== 'Completed' && t.room);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(AUTOMATED_TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [sentSuccessAlert, setSentSuccessAlert] = useState<string | null>(null);

  const currentTask = allTasks.find((t) => t.id === selectedTaskId) || activeTasks[0];
  const currentTemplate = AUTOMATED_TEMPLATES.find((tpl) => tpl.id === selectedTemplateId) || AUTOMATED_TEMPLATES[0];

  const targetRoom = currentTask?.room || '402';
  const targetTitle = currentTask?.title || 'Room Service';
  const targetAssignee = currentTask?.assignee || 'Attendant Vikram';

  const previewText = isCustomMode
    ? customMessage
    : currentTemplate.template(targetRoom, targetTitle, targetAssignee);

  function handleSendSimulation(e: React.FormEvent) {
    e.preventDefault();
    if (!previewText.trim()) return;

    simulateGuestMessage({
      taskId: currentTask?.id,
      room: targetRoom,
      guestName: currentTask?.room ? `Guest of Room ${currentTask.room}` : 'Valued Guest',
      templateType: isCustomMode ? 'Custom Message' : currentTemplate.label,
      messageText: previewText.trim(),
    });

    setSentSuccessAlert(`Automated update dispatched to Room ${targetRoom} (Simulated In-App Push)`);
    setTimeout(() => setSentSuccessAlert(null), 4000);
  }

  const messageLog = state.guestMessages ?? [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Automated Guest Messages & Updates
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Simulate department status updates, arrival ETAs, and quality assurance confirmations sent to guests.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="rounded-full px-3 py-1 bg-white/[0.04] border border-white/10 text-mist-300">
            {messageLog.length} simulated dispatches logged
          </span>
        </div>
      </div>

      {/* Mandatory Frontend Simulation Disclaimer */}
      <div className="p-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] flex items-start gap-3 text-xs text-mist-300">
        <Info className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-200">Frontend Simulation Only:</strong> Automated guest communications are simulated inside browser state and mirrored into the Guest Portal and activity feed. No actual SMS gateways or external telco networks are triggered.
        </div>
      </div>

      {sentSuccessAlert && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{sentSuccessAlert}</span>
        </div>
      )}

      {/* Main Grid: Message Composer vs Recent Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Message Composer Form */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-bold font-display text-white">Message Composer</h2>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              Department Automation
            </span>
          </div>

          <form onSubmit={handleSendSimulation} className="space-y-4 text-xs">
            {/* Target Request Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Target Guest Request / Room Stay</label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  setIsCustomMode(false);
                }}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-purple-400"
              >
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Room {t.room} · {t.title} ({t.status}) · {t.assignee || 'Unassigned'}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-mist-300">Automated Message Template</label>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-[11px] text-purple-300 hover:text-white underline"
                >
                  {isCustomMode ? 'Use Preset Template' : 'Write Custom Message'}
                </button>
              </div>

              {!isCustomMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AUTOMATED_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedTemplateId === tpl.id
                          ? 'border-purple-400 bg-purple-500/10 text-white font-semibold'
                          : 'border-white/5 bg-white/[0.02] text-mist-400 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-purple-300 block">
                        {tpl.category}
                      </span>
                      <span className="text-xs">{tpl.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Preview Box / Editor */}
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">
                {isCustomMode ? 'Custom Message Text' : 'Rendered Simulated Message Preview'}
              </label>

              {isCustomMode ? (
                <textarea
                  rows={4}
                  placeholder="Type simulated message to guest..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-ink-950 p-3 text-white placeholder-mist-600 focus:outline-none focus:border-purple-400"
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-mist-400 border-b border-white/5 pb-2">
                    <span>To: Room {targetRoom} (Guest Portal / Simulated SMS)</span>
                    <span className="font-mono text-purple-300 font-bold">Auto-populated</span>
                  </div>
                  <p className="text-white text-xs leading-relaxed italic bg-ink-950/60 p-3 rounded-xl border border-white/5">
                    &ldquo;{previewText}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-500 text-ink-950 text-xs font-bold hover:bg-purple-400 transition shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch Simulated Message</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recent Automated Message Log */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-mist-400" />
              <h2 className="text-base font-bold font-display text-white">Dispatched Log</h2>
            </div>
            <span className="text-[11px] font-mono text-mist-400">Simulated Feed</span>
          </div>

          {messageLog.length === 0 ? (
            <div className="py-12 text-center text-mist-500 space-y-2 text-xs">
              <MessageSquare className="h-7 w-7 mx-auto text-mist-600" />
              <p>No automated guest messages sent yet during this session.</p>
              <p className="text-[11px] text-mist-600">Choose a template on the left to trigger a simulated guest notice.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
              {messageLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Room {log.room}</span>
                    <span className="text-[10px] text-mist-400 font-mono">{log.sentAt}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/10 inline-block">
                    {log.templateType}
                  </span>
                  <p className="text-mist-300 text-[11px] leading-relaxed italic bg-ink-950/40 p-2 rounded-xl border border-white/5">
                    &ldquo;{log.messageText}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-mist-500 pt-1">
                    <span>Sender: {log.sender}</span>
                    <span className="text-emerald-400 font-semibold">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
