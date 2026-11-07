'use client';

import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { WorkItem } from '@/types/demo';

interface SecurityEscalateModalProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes?: string) => void;
}

export function SecurityEscalateModal({ item, isOpen, onClose, onSubmit }: SecurityEscalateModalProps) {
  const [reason, setReason] = useState('Perimeter breach beyond lone responder capacity');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Please provide an escalation reason.');
      return;
    }
    onSubmit(finalReason, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="dm-dialog-card w-full max-w-lg bg-white border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-[var(--dm-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--dm-line)]">
          <div className="flex items-center gap-3">
            <span className="dm-attention-icon">
              <ShieldAlert size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--dm-ink)]">Escalate to Duty Manager</h3>
              <p className="text-xs text-[var(--dm-muted)]">{item.ref || item.id} · Marcus Vance (Operations Lead)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="dm-icon-button"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Formal Management Escalation</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              This action transfers primary incident oversight to Duty Manager Marcus Vance and triggers cross-department manager notifications.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Target Recipient */}
          <div>
            <label className="block text-[var(--dm-muted)] font-medium mb-1.5">Target Authority</label>
            <div className="p-3 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] flex items-center justify-between">
              <div>
                <p className="text-[var(--dm-ink)] font-semibold text-xs">Marcus Vance</p>
                <p className="text-[10px] text-[var(--dm-muted)]">Duty Manager · Operations Command</p>
              </div>
              <span className="dm-status urgent">
                SOP Level 2
              </span>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
              Escalation Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
            >
              <option value="Perimeter breach beyond lone responder capacity">Perimeter breach beyond lone responder capacity</option>
              <option value="Physical altercation / violent guest behavior">Physical altercation / violent guest behavior</option>
              <option value="Medical emergency / paramedic dispatch requested">Medical emergency / paramedic dispatch requested</option>
              <option value="Active water burst / electrical hazard threatening guests">Active water burst / electrical hazard threatening guests</option>
              <option value="Suspected criminal trespass / property theft">Suspected criminal trespass / property theft</option>
              <option value="Other">Other reason (specify below)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
                Custom Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific escalation reason..."
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
              Situation Briefing &amp; Handover Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Immediate observations, current guest location, assistance needed from Front Office or Engineering..."
              className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[var(--warm-soft)] border border-[var(--dm-line)] text-[11px] text-[var(--dm-muted)]">
            <span className="font-semibold text-[var(--dm-ink)]">Demonstration notice:</span> Escalation dispatch is simulated inside the shared demo store. The Duty Manager console will immediately reflect this item.
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-[var(--dm-line)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="dm-secondary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dm-primary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              Confirm Escalation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
