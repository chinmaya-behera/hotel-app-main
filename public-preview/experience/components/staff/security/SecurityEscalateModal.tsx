'use client';

import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-ink-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Escalate to Duty Manager</h3>
              <p className="text-[11px] text-mist-400">{item.ref || item.id} · Isabella Scott</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning callout */}
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold">Formal Management Escalation</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">
              This action transfers primary incident oversight to Duty Manager Isabella Scott and triggers cross-department manager notifications.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Target Recipient (Read only) */}
          <div>
            <label className="block text-mist-400 font-medium mb-1">Target Authority</label>
            <div className="p-2.5 rounded-xl bg-ink-950 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Isabella Scott</p>
                <p className="text-[10px] text-mist-400">Duty Manager · Operations Command</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-semibold">
                SOP Level 2
              </span>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-mist-300 font-medium mb-1">
              Escalation Reason <span className="text-rose-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-rose-500"
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
              <label className="block text-mist-300 font-medium mb-1">
                Custom Reason <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific escalation reason..."
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-mist-300 font-medium mb-1">
              Situation Briefing & Handover Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Immediate observations, current guest location, assistance needed from Front Office or Engineering..."
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-mist-400">
            <span className="font-semibold text-mist-300">Demonstration notice:</span> Escalation dispatch is simulated inside the shared frontend memory store. Isabella Scott's Duty Manager console will immediately reflect this item.
          </div>

          {/* Buttons */}
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-500/20"
            >
              Confirm Escalation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
