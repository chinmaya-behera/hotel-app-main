'use client';

import { useState } from 'react';
import { X, Users, ShieldAlert, AlertCircle } from 'lucide-react';
import type { WorkItem } from '@/types/demo';

interface SecurityBackupModalProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function SecurityBackupModal({ item, isOpen, onClose, onSubmit }: SecurityBackupModalProps) {
  const [reason, setReason] = useState('Dispersal assistance required for large gathering');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Please provide a reason for backup.');
      return;
    }
    onSubmit(finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-[var(--dm-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--dm-line)]">
          <div className="flex items-center gap-3">
            <span className="dm-attention-icon">
              <Users size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--dm-ink)]">Request Security Backup</h3>
              <p className="text-xs text-[var(--dm-muted)]">{item.ref || item.id} · {item.room ? `Room ${item.room}` : item.location || 'Incident zone'}</p>
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

        <div className="mt-4 p-3.5 rounded-xl bg-[var(--warm-soft)] border border-[var(--dm-line)] text-xs flex items-start gap-2.5">
          <ShieldAlert size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <p className="text-[var(--dm-ink)] leading-relaxed">
            Calling secondary officer to your active coordinates. Dispatcher will alert available night patrol units and Duty Manager.
          </p>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
              Backup Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
            >
              <option value="Dispersal assistance required for large gathering">Dispersal assistance required for large gathering</option>
              <option value="Dual officer perimeter sweep required">Dual officer perimeter sweep required</option>
              <option value="Aggressive or uncooperative subject">Aggressive or uncooperative subject</option>
              <option value="Medical bystander crowd management">Medical bystander crowd management</option>
              <option value="Unattended baggage cordon support">Unattended baggage cordon support</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Specify Reason</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason for backup call..."
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>
          )}

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
              Dispatch Backup Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
