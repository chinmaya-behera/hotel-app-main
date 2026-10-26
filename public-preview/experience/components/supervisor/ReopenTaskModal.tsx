'use client';

import { useState } from 'react';
import { X, RotateCcw, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import type { SupervisorInspection, StaffAccount } from '@/types/demo';

interface ReopenTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: SupervisorInspection | null;
  staffList: StaffAccount[];
  onSubmit: (
    inspectionId: string,
    reason: string,
    correctiveAction: string,
    reassignToStaffId?: string,
  ) => void;
}

const REOPEN_REASONS = [
  'Bathroom not clean',
  'Items missing or wrong',
  'Guest complaint',
  'Safety concern',
  'Bedding / linen wrinkles or stains',
  'Minibar inventory discrepancy',
  'Electronics / HVAC malfunction',
] as const;

export function ReopenTaskModal({
  isOpen,
  onClose,
  inspection,
  staffList,
  onSubmit,
}: ReopenTaskModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(REOPEN_REASONS[0]);
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [reassignStaffId, setReassignStaffId] = useState('');

  if (!isOpen || !inspection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctiveAction.trim()) return;

    onSubmit(
      inspection.id,
      selectedReason,
      correctiveAction.trim(),
      reassignStaffId || undefined,
    );
    onClose();
  };

  // Filter available attendants
  const attendants = staffList.filter(
    (s) =>
      s.department === 'Housekeeping' ||
      s.roleId === 'task_fulfiller' ||
      s.name.includes('Singh') ||
      s.name.includes('Chen') ||
      s.name.includes('Sen') ||
      s.name.includes('Sheikh') ||
      s.name.includes('Verma'),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reopen-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <RotateCcw className="h-5 w-5" />
            </span>
            <div>
              <h2 id="reopen-modal-title" className="text-base font-bold font-display text-white">
                Return Room {inspection.roomNumber} for Corrective Action
              </h2>
              <p className="text-xs text-mist-400">
                Current attendant: {inspection.attendantName} ({inspection.attendantId})
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
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
              <span>Mandatory Deficiency Reason</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
            >
              {REOPEN_REASONS.map((r) => (
                <option key={r} value={r} className="bg-ink-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Corrective Action Directive */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300">
              Corrective Action Instructions <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="e.g. Chrome showerhead has water residue. Rescrub tile grout and place missing luxury bathrobes from the linen pantry..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 transition"
            />
          </div>

          {/* Optional Attendant Reassignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-sky-300" />
              <span>Assign Attendant for Corrective Touch-up (Optional)</span>
            </label>
            <select
              value={reassignStaffId}
              onChange={(e) => setReassignStaffId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
            >
              <option value="" className="bg-ink-900 text-white">
                Retain original attendant ({inspection.attendantName})
              </option>
              {attendants.map((s) => (
                <option key={s.id} value={s.id} className="bg-ink-900 text-white">
                  {s.name} ({s.employeeId}) · {s.floorZone || 'Floors 1-5'} · {s.availability || 'on_duty'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-mist-400">
              Room will transition to &quot;cleaning&quot; in Front Desk inventory until reinspected.
            </p>
          </div>

          {/* Action buttons */}
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
              disabled={!correctiveAction.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Submit Reopen Directive</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
