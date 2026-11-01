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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-ink-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Request Security Backup</h3>
              <p className="text-[11px] text-mist-400">{item.ref || item.id} · {item.location || 'Incident zone'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p>
            Calling secondary officer to your active coordinates. Dispatcher will alert available night patrol units and Duty Manager.
          </p>
        </div>

        {error && (
          <div className="mt-2 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-mist-300 font-medium mb-1">
              Backup Reason <span className="text-rose-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
              <label className="block text-mist-300 font-medium mb-1">Specify Reason</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason for backup..."
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-ink-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
            >
              Dispatch Backup Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
