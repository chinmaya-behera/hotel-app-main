'use client';

import { useState } from 'react';
import {
  X,
  FileCheck2,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Eye,
  AlertTriangle,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-ink-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Final Security Incident Report</h3>
              <p className="text-[11px] text-mist-400">{item.ref || item.id} · {item.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleProceedToReview} className="mt-4 space-y-3.5 text-xs">
            {/* Summary */}
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Incident Summary <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of resolution (e.g. Alarm verified as false sensor trip)"
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Observations */}
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Observations on Scene <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                placeholder="Physical state, presence of smoke/water, behavioral observations, door locks condition..."
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions Taken */}
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Actions Taken <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                rows={3}
                placeholder="Inspected room, verified guest safety, reset panel, coordinated with Engineering..."
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Outcome Selection */}
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Final Outcome <span className="text-rose-400">*</span>
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Secured & Stabilized">Secured & Stabilized</option>
                <option value="False Alarm / Sensor Reset">False Alarm / Sensor Reset</option>
                <option value="Resolved with Verbal Advisory">Resolved with Verbal Advisory</option>
                <option value="Turned Over to Engineering">Turned Over to Engineering</option>
                <option value="Unattended Property Claimed / Stored">Unattended Property Claimed / Stored</option>
                <option value="Guest Re-accommodated peacefully">Guest Re-accommodated peacefully</option>
              </select>
            </div>

            {/* Photo Evidence Upload */}
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Attach Photographic Evidence
              </label>
              {photoUrl ? (
                <div className="relative rounded-xl border border-white/10 overflow-hidden bg-ink-950 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={photoUrl} alt="Attached Evidence" className="h-14 w-14 object-cover rounded-lg" />
                    <div>
                      <p className="text-xs text-white font-medium">Evidence attached</p>
                      <p className="text-[10px] text-emerald-400">Timestamp logged · Immutable</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors">
                  <Camera className="h-6 w-6 text-mist-400 mb-1" />
                  <span className="text-xs text-mist-300 font-medium">Capture or Upload Incident Photo</span>
                  <span className="text-[10px] text-mist-500 mt-0.5">JPG, PNG supported</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Optional Witness Details & Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-mist-300 font-medium mb-1">Witness / Staff on Scene</label>
                <input
                  type="text"
                  value={witnessDetails}
                  onChange={(e) => setWitnessDetails(e.target.value)}
                  placeholder="e.g. Lifeguard Rajesh, Concierge Arun"
                  className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-mist-300 font-medium mb-1">Follow-up Recommendation</label>
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g. Schedule sensor recalibration"
                  className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-ink-950 text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
              >
                Review Report
              </button>
            </div>
          </form>
        ) : (
          /* Review Step */
          <div className="mt-4 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Review before permanent filing</p>
                <p className="text-[11px] text-emerald-400/80">
                  Per Security SOP, once submitted, this report is committed immutably to the incident audit trail and dispatched to Duty Manager Isabella Scott.
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-ink-950 border border-white/10 text-mist-300">
              <div>
                <span className="text-[10px] text-mist-500 uppercase tracking-wider block">Officer</span>
                <span className="text-white font-medium">Lucas Martin (EMP-0108)</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-500 uppercase tracking-wider block">Summary</span>
                <span className="text-white font-medium">{summary}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-500 uppercase tracking-wider block">Observations</span>
                <span className="text-mist-200">{observations}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-500 uppercase tracking-wider block">Actions Taken</span>
                <span className="text-mist-200">{actionsTaken}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-500 uppercase tracking-wider block">Outcome</span>
                <span className="text-emerald-400 font-semibold">{outcome}</span>
              </div>
              {witnessDetails && (
                <div>
                  <span className="text-[10px] text-mist-500 uppercase tracking-wider block">Witnesses</span>
                  <span className="text-mist-200">{witnessDetails}</span>
                </div>
              )}
              {photoUrl && (
                <div>
                  <span className="text-[10px] text-mist-500 uppercase tracking-wider block mb-1">Attached Evidence</span>
                  <img src={photoUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-ink-950 text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
              >
                Confirm & Resolve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
