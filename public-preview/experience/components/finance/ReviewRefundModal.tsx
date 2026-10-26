'use client';

import { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Ban, FileText } from 'lucide-react';
import type { FinanceRefundRequest } from '@/types/demo';

interface ReviewRefundModalProps {
  refund: FinanceRefundRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (refundId: string, action: 'approve' | 'reject' | 'execute', notes?: string, rejectionReason?: string) => void;
}

export function ReviewRefundModal({ refund, isOpen, onClose, onSubmit }: ReviewRefundModalProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !refund) return null;

  const isPending = refund.status === 'Pending Review';
  const isApproved = refund.status === 'Approved';
  const isExecuted = refund.status === 'Executed';
  const isRejected = refund.status === 'Rejected';

  const handleApprove = () => {
    onSubmit(refund.id, 'approve', notes.trim() || undefined);
    onClose();
  };

  const handleExecute = () => {
    onSubmit(refund.id, 'execute', notes.trim() || undefined);
    onClose();
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a mandatory reason for rejecting this refund.');
      return;
    }
    onSubmit(refund.id, 'reject', notes.trim() || undefined, rejectionReason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-ink-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-ink-950">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Review Refund Request</h3>
              <p className="text-[10px] text-mist-400">{refund.id} · {refund.invoiceId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Dispute Card */}
          <div className="p-4 rounded-xl bg-ink-950 border border-white/10 space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-mist-400 uppercase font-semibold block">Guest & Room</span>
                <p className="text-sm font-bold text-white">{refund.guestName} · Room {refund.roomNumber}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isExecuted
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isRejected
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {refund.status}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-y border-white/5">
              <span className="text-mist-400">Claimed Refund Amount:</span>
              <span className="font-mono text-base font-bold text-rose-400">
                ₹{refund.amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-mist-400 uppercase font-semibold block">Dispute Justification</span>
              <p className="text-mist-200 mt-0.5 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                "{refund.reason}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-mist-400 pt-1">
              <div>
                <span>Requested At:</span> <span className="text-white font-medium">{refund.requestedAt}</span>
              </div>
              <div>
                <span>Requested By:</span> <span className="text-white font-medium">{refund.requestedBy}</span>
              </div>
            </div>

            {refund.reviewedBy && (
              <div className="pt-2 border-t border-white/5 text-[11px] text-mist-300">
                <span className="text-mist-400">Review Record:</span> Decision by {refund.reviewedBy} at {refund.reviewedAt}.
                {refund.reviewNotes && <p className="text-mist-200 mt-0.5">Notes: {refund.reviewNotes}</p>}
                {refund.rejectionReason && (
                  <p className="text-rose-400 font-medium mt-0.5">Rejection Reason: {refund.rejectionReason}</p>
                )}
                {refund.transactionRef && (
                  <p className="text-purple-400 font-mono mt-0.5">Payout Reference: {refund.transactionRef}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Form for Pending or Approved Requests */}
          {(isPending || isApproved) && !showRejectForm && (
            <div className="space-y-3">
              <div>
                <label className="block text-mist-300 font-medium mb-1">
                  Operator Review Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Verification against POS tickets or Duty Manager authorization..."
                  className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-mist-400 space-y-1">
                <p className="font-semibold text-mist-300 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-lime-400" /> Separation of Duties & Limits
                </p>
                <p>Refunds require independent Executive approval before a Finance operator executes them. All payment effects here are sandbox records.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Reject Refund</span>
                </button>

                {isPending && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-ink-950 font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Request Executive Approval</span>
                  </button>
                )}

                {isApproved && (
                  <button
                    type="button"
                    onClick={handleExecute}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Execute Payout (₹{refund.amount.toLocaleString('en-IN')})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <form onSubmit={handleReject} className="space-y-3 pt-2 border-t border-white/10">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                <strong>Mandatory Audit Requirement:</strong> State the precise policy or dispute reason for rejecting this refund.
              </div>

              <div>
                <label className="block text-mist-300 font-medium mb-1">
                  Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Minibar intake confirmed by attendant timestamp; guest accepted charges at checkout..."
                  className="w-full rounded-xl bg-ink-950 border border-rose-500/30 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          )}

          {/* Read-Only Status Info for Executed or Rejected */}
          {(isExecuted || isRejected) && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
              <p className="text-mist-400 text-[11px]">
                This refund case is closed and logged into the hotel financial audit trail.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
              >
                Close Case
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
