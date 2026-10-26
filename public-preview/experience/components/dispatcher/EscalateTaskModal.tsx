'use client';

import { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Send,
  User,
  Clock,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';

interface EscalateTaskModalProps {
  task: WorkItem;
  onClose: () => void;
  onEscalated?: () => void;
}

export function EscalateTaskModal({ task, onClose, onEscalated }: EscalateTaskModalProps) {
  const { escalateTaskToManager } = useDemo();
  const [selectedQuickReason, setSelectedQuickReason] = useState<string>('SLA Breached - Urgent Assistance Needed');
  const [customNote, setCustomNote] = useState<string>('');

  const quickReasons = [
    'SLA Breached - Urgent Assistance Needed',
    'VIP Guest Dissatisfaction / Escalation',
    'Safety or Physical Hazard Identified',
    'Specialist Technician / Parts Unavailable',
    'Potential Room Move / Out of Order Required',
  ];

  const handleEscalate = () => {
    const finalReason = customNote.trim()
      ? `${selectedQuickReason}: ${customNote.trim()}`
      : selectedQuickReason;

    escalateTaskToManager(task.id, finalReason);
    if (onEscalated) onEscalated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalate-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                Supervisor & Duty Management Escalation
              </p>
            </div>
            <h2 id="escalate-modal-title" className="text-xl font-bold font-display text-white">
              Escalate to Duty Manager
            </h2>
            <p className="text-xs text-mist-300 truncate max-w-md">
              Target: <strong className="text-white">Isabella Scott</strong> (Duty Manager · EMP-0106)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Summary Banner */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs text-rose-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              {task.ref ? `${task.ref} · ` : ''}{task.title}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-rose-300">
              <span>Room: {task.room || 'General'}</span>
              <span>·</span>
              <span>Dept: {task.department || 'Operations'}</span>
              <span>·</span>
              <span>Priority: <strong className="uppercase">{task.priority || 'Normal'}</strong></span>
            </div>
          </div>
        </div>

        {/* Reason Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-mist-300 block">
            Select Escalation Justification:
          </label>
          <div className="space-y-1.5">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedQuickReason(r)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition ${
                  selectedQuickReason === r
                    ? 'border-rose-400 bg-rose-500/10 text-rose-200 font-semibold'
                    : 'border-white/10 bg-white/[0.02] text-mist-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-mist-300 block">
            Additional Operational Details (Optional):
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            rows={2}
            placeholder="Add context, guest remarks, or parts required..."
            className="w-full rounded-xl border border-white/10 bg-ink-950/60 p-2.5 text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <span className="text-[11px] text-mist-400 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            Alerts Duty Manager directly
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEscalate}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition shadow-lg shadow-rose-500/20"
            >
              <Send className="h-4 w-4" />
              <span>Confirm Escalation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
