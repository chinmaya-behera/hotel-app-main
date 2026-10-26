'use client';

import { useState } from 'react';
import { X, Flame, AlertCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface EscalateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoom?: string;
  onSubmit: (issue: {
    title: string;
    room?: string;
    priority: 'urgent' | 'critical';
    reason: string;
    notes?: string;
  }) => void;
}

const ESCALATION_CATEGORIES = [
  'Maintenance defect preventing check-in',
  'Biohazard / deep sanitization required',
  'Severe staff shortage / SLA breach',
  'VIP guest arrival blocker',
  'Linen / amenities supply depletion',
  'Pest / health inspection concern',
] as const;

export function EscalateIssueModal({
  isOpen,
  onClose,
  initialRoom = '',
  onSubmit,
}: EscalateIssueModalProps) {
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState(initialRoom);
  const [priority, setPriority] = useState<'urgent' | 'critical'>('urgent');
  const [reason, setReason] = useState<string>(ESCALATION_CATEGORIES[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      room: room.trim() || undefined,
      priority,
      reason,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalate-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <h2 id="escalate-modal-title" className="text-base font-bold font-display text-white">
                Escalate Issue to Duty Manager Isabella Scott
              </h2>
              <p className="text-xs text-mist-400">
                Oliver Reed (EMP-0105) · Department Supervisor Escalation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Issue Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300">
              Incident / Issue Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master bathroom pipe leakage in Suite 502"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Room Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Room / Location</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. 502 or Floor 3 Pantry"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Escalation Severity</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'urgent' | 'critical')}
                className="w-full rounded-2xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
              >
                <option value="urgent" className="bg-ink-900 text-white">
                  Urgent (SLA risk &lt; 30m)
                </option>
                <option value="critical" className="bg-ink-900 text-white">
                  Critical (Property / VIP Stop)
                </option>
              </select>
            </div>
          </div>

          {/* Reason / Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300">Operational Blocker Category</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
            >
              {ESCALATION_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-ink-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300">Observation & Impact Details</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP guest checking in at 14:00. Requires immediate engineering dispatch and supervisor re-assignment..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Escalate to Duty Manager</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
