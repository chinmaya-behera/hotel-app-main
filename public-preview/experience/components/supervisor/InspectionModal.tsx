'use client';

import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BedDouble,
  User,
  Clock,
  ShieldAlert,
  ClipboardCheck,
} from 'lucide-react';
import type { SupervisorInspection, InspectionCheckItem } from '@/types/demo';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: SupervisorInspection | null;
  onApprove: (inspectionId: string, notes?: string) => void;
  onOpenReopenModal: (inspection: SupervisorInspection) => void;
}

export function InspectionModal({
  isOpen,
  onClose,
  inspection,
  onApprove,
  onOpenReopenModal,
}: InspectionModalProps) {
  const [items, setItems] = useState<InspectionCheckItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (inspection) {
      setItems(
        inspection.items && inspection.items.length > 0
          ? inspection.items.map((it) => ({ ...it }))
          : [
              {
                id: 'chk-1',
                category: 'Bathroom & Sanitization',
                label: 'Vanity mirror spotless, chrome faucets polished, sanitary toilet seal placed',
                passed: true,
              },
              {
                id: 'chk-2',
                category: 'Bedding & Linens',
                label: 'Linens tight 45° hospital fold, pillows fluffed, runner centered',
                passed: true,
              },
              {
                id: 'chk-3',
                category: 'Minibar & Amenities',
                label: 'Bottled water sealed, glassware polished, complete amenity tray',
                passed: true,
              },
              {
                id: 'chk-4',
                category: 'Electronics & Climate',
                label: 'HVAC set to eco 22°C, master switch verified, TV welcome display operational',
                passed: true,
              },
              {
                id: 'chk-5',
                category: 'Safety & Keycard',
                label: 'RFID deadbolt strike confirmed, emergency exit floor map intact',
                passed: true,
              },
            ],
      );
      setNotes(inspection.notes || '');
    }
  }, [inspection]);

  if (!isOpen || !inspection) return null;

  const passedCount = items.filter((it) => it.passed).length;
  const totalCount = items.length;
  const scorePercent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100;
  const allPassed = passedCount === totalCount;

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, passed: !it.passed } : it)),
    );
  };

  const handleApprove = () => {
    onApprove(inspection.id, notes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="inspection-modal-title" className="text-lg font-bold font-display text-white">
                  Room {inspection.roomNumber} Quality Inspection
                </h2>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-mist-200">
                  {inspection.roomType}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    inspection.status === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : inspection.status === 'reopened'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {inspection.status}
                </span>
              </div>
              <p className="text-xs text-mist-400 mt-0.5">
                Turnover completed by {inspection.attendantName} ({inspection.attendantId}) · Floor {inspection.floor}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quality Score & Meta Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-mist-400">Quality Score</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-2xl font-bold font-mono ${
                  scorePercent >= 90
                    ? 'text-emerald-300'
                    : scorePercent >= 75
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {scorePercent}%
              </span>
              <span className="text-xs text-mist-400">
                ({passedCount}/{totalCount} checks)
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-mist-400">Attendant Roster</p>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-mist-300" />
              <span className="text-xs font-semibold text-white truncate">{inspection.attendantName}</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-mist-400">Completed At</p>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-mist-300" />
              <span className="text-xs text-white">{inspection.completedAt}</span>
            </div>
          </div>
        </div>

        {/* Reopened Banner if previously failed */}
        {inspection.status === 'reopened' && inspection.reopenReason && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              <span>Prior Deficiency Flagged: {inspection.reopenReason}</span>
            </div>
            {inspection.correctiveAction && (
              <p className="text-rose-200/90 pl-6">
                <span className="font-semibold">Corrective Directive:</span> {inspection.correctiveAction}
              </p>
            )}
          </div>
        )}

        {/* Quality Standards Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mist-300">
              Department Quality Verification Checklist
            </h3>
            <span className="text-[11px] text-mist-400">Tap item to toggle pass / fail</span>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                onClick={() => toggleCheck(it.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer select-none ${
                  it.passed
                    ? 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40'
                    : 'bg-rose-500/[0.06] border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                <div
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-lg border transition ${
                    it.passed
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                      : 'border-rose-400 bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {it.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${it.passed ? 'text-white' : 'text-rose-200'}`}>
                      {it.label}
                    </p>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        it.passed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {it.passed ? 'Passed' : 'Deficient'}
                    </span>
                  </div>
                  <p className="text-[11px] text-mist-400 mt-0.5">{it.category}</p>
                  {it.notes && <p className="text-[11px] text-amber-300/90 mt-1 italic">Note: {it.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supervisor Inspection Notes */}
        <div className="space-y-1.5">
          <label htmlFor="supervisor-notes" className="text-xs font-semibold text-mist-300">
            Supervisor Observation & Sign-off Notes
          </label>
          <textarea
            id="supervisor-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Linens pristine, VIP welcome fruits placed, turn-down gift card aligned..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReopenModal(inspection);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-semibold hover:bg-rose-500/20 hover:border-rose-500/50 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4 text-rose-300" />
            <span>Return for Correction (Reopen)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.06] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-ink-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve & Release Room to Front Desk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
