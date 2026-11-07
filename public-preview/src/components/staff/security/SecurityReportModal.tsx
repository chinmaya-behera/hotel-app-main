'use client';

import { useState } from 'react';
import {
  X,
  FileCheck2,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { WorkItem } from '@/types/demo';

interface SecurityReportModalProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: {
    summary: string;
    observations: string;
    actionsTaken: string;
    outcome: string;
    followUp?: string;
    witnessDetails?: string;
    photoUrl?: string;
  }) => void;
}

export function SecurityReportModal({ item, isOpen, onClose, onSubmit }: SecurityReportModalProps) {
  const [summary, setSummary] = useState('');
  const [observations, setObservations] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [outcome, setOutcome] = useState('Secured & Stabilized');
  const [followUp, setFollowUp] = useState('');
  const [witnessDetails, setWitnessDetails] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'review'>('form');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('Incident summary is required.');
      return;
    }
    if (!observations.trim()) {
      setError('Scene observations are required.');
      return;
    }
    if (!actionsTaken.trim()) {
      setError('Actions taken must be documented.');
      return;
    }
    setError(null);
    setStep('review');
  };

  const handleFinalSubmit = () => {
    onSubmit({
      summary: summary.trim(),
      observations: observations.trim(),
      actionsTaken: actionsTaken.trim(),
      outcome,
      followUp: followUp.trim() || undefined,
      witnessDetails: witnessDetails.trim() || undefined,
      photoUrl: photoUrl || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="dm-dialog-card w-full max-w-lg bg-white border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto text-[var(--dm-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--dm-line)]">
          <div className="flex items-center gap-3">
            <span className="dm-attention-icon">
              <FileCheck2 size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--dm-ink)]">Final Security Incident Report</h3>
              <p className="text-xs text-[var(--dm-muted)]">{item.ref || item.id} · {item.title}</p>
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

        {error && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleProceedToReview} className="mt-4 space-y-4 text-xs">
            {/* Summary */}
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
                Incident Summary <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of resolution (e.g. Alarm verified as false sensor trip)"
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>

            {/* Observations */}
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
                Observations on Scene <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                placeholder="Physical state, presence of smoke/water, behavioral observations, door locks condition..."
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>

            {/* Actions Taken */}
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
                Actions Taken <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                rows={3}
                placeholder="Inspected room, verified guest safety, reset panel, coordinated with Engineering..."
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>

            {/* Outcome Selection */}
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Outcome Status</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              >
                <option value="Secured & Stabilized">Secured &amp; Stabilized</option>
                <option value="False Alarm - Reset Verified">False Alarm - Reset Verified</option>
                <option value="Guest Reassured & Matter Resolved">Guest Reassured &amp; Matter Resolved</option>
                <option value="Referred to Maintenance Work Order">Referred to Maintenance Work Order</option>
                <option value="Handed over to Police / External Authorities">Handed over to Police / External Authorities</option>
              </select>
            </div>

            {/* Photographic Evidence */}
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
                Attach Photographic Evidence
              </label>
              {photoUrl ? (
                <div className="relative rounded-xl border border-[var(--dm-line)] overflow-hidden bg-[var(--dm-surface)] p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={photoUrl} alt="Attached Evidence" className="h-14 w-14 object-cover rounded-lg border border-[var(--dm-line)]" />
                    <div>
                      <p className="text-xs text-[var(--dm-ink)] font-semibold">Evidence attached</p>
                      <p className="text-[10px] text-[var(--dm-muted)]">Timestamp logged · Permanent audit</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-[var(--dm-line)] bg-[var(--dm-surface)] hover:bg-[var(--warm-soft)] cursor-pointer transition-colors">
                  <Camera size={22} className="text-[var(--dm-muted)] mb-1" />
                  <span className="text-xs text-[var(--dm-ink)] font-medium">Capture or Upload Incident Photo</span>
                  <span className="text-[10px] text-[var(--dm-muted)] mt-0.5">JPG, PNG supported</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Optional Witness Details & Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Witness / Staff on Scene</label>
                <input
                  type="text"
                  value={witnessDetails}
                  onChange={(e) => setWitnessDetails(e.target.value)}
                  placeholder="e.g. Lifeguard Rajesh, Concierge Arun"
                  className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
                />
              </div>
              <div>
                <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Follow-up Recommendation</label>
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g. Schedule sensor recalibration"
                  className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
                />
              </div>
            </div>

            {/* Action Buttons */}
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
                Review Report &rarr;
              </button>
            </div>
          </form>
        ) : (
          /* Review Step */
          <div className="mt-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Review before permanent filing</p>
                <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                  Per Security SOP, once submitted, this report is committed to the incident audit trail and dispatched to Duty Manager Marcus Vance.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] text-xs">
              <div>
                <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block font-semibold">Officer</span>
                <span className="text-[var(--dm-ink)] font-semibold">Inspector Roy (EMP-0108)</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block font-semibold">Summary</span>
                <span className="text-[var(--dm-ink)]">{summary}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block font-semibold">Observations</span>
                <span className="text-[var(--dm-ink)]">{observations}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block font-semibold">Actions Taken</span>
                <span className="text-[var(--dm-ink)]">{actionsTaken}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block font-semibold">Outcome</span>
                <span className="dm-status good font-semibold">{outcome}</span>
              </div>
              {witnessDetails && (
                <div>
                  <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block font-semibold">Witnesses</span>
                  <span className="text-[var(--dm-ink)]">{witnessDetails}</span>
                </div>
              )}
              {photoUrl && (
                <div>
                  <span className="text-[10px] text-[var(--dm-muted)] uppercase tracking-wider block mb-1.5 font-semibold">Attached Evidence</span>
                  <img src={photoUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-[var(--dm-line)]" />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--dm-line)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="dm-secondary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="dm-primary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Confirm &amp; Resolve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
