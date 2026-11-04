'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  History,
  Info,
  Layers,
  MapPin,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { MANAGER_COMPENSATION_THRESHOLD } from '@/lib/mockData';
import type { CompensationRequest } from '@/types/demo';

export function FinanceApprovalsTab() {
  const { state, reviewFinancialCompensation, notify } = useDemo();
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Modal adjudication state
  const [selectedClaim, setSelectedClaim] = useState<CompensationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [viewHistoryClaim, setViewHistoryClaim] = useState<CompensationRequest | null>(null);

  const claims = state.compensationRequests ?? [];

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Tab filter
      if (filterTab === 'pending' && claim.status !== 'pending_financial_operator') return false;
      if (filterTab === 'approved' && claim.status !== 'approved') return false;
      if (filterTab === 'rejected' && claim.status !== 'rejected') return false;

      // Department filter
      if (selectedDept !== 'all' && !claim.department.toLowerCase().includes(selectedDept.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = claim.ref.toLowerCase().includes(q);
        const matchGuest = claim.guestName.toLowerCase().includes(q);
        const matchRoom = claim.room.toLowerCase().includes(q);
        const matchReason = claim.reason.toLowerCase().includes(q);
        const matchDept = claim.department.toLowerCase().includes(q);
        if (!matchRef && !matchGuest && !matchRoom && !matchReason && !matchDept) return false;
      }

      return true;
    });
  }, [claims, filterTab, selectedDept, searchQuery]);

  // Counts
  const pendingCount = claims.filter((c) => c.status === 'pending_financial_operator').length;
  const approvedCount = claims.filter((c) => c.status === 'approved').length;
  const rejectedCount = claims.filter((c) => c.status === 'rejected').length;

  const handleOpenAdjudicate = (claim: CompensationRequest) => {
    setSelectedClaim(claim);
    setReviewAction('approve');
    setReviewComments(
      `Financial review complete. Approved ₹${claim.amount.toLocaleString(
        'en-IN',
      )} service recovery credit for Room ${claim.room}.`,
    );
  };

  const handleConfirmDecision = () => {
    if (!selectedClaim) return;
    if (!reviewComments.trim()) {
      notify('Please enter review remarks for audit compliance.');
      return;
    }

    reviewFinancialCompensation(selectedClaim.id, reviewAction, reviewComments.trim());
    setSelectedClaim(null);
    setReviewComments('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-300">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">
              Compensation & Folio Adjustment Approval Inbox
            </h2>
          </div>
          <p className="text-xs text-mist-400 mt-1">
            Review service recovery and guest compensation claims forwarded via Department Manager and General Manager escalation paths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-semibold">
            Financial Operator: Neha Kapoor
          </span>
        </div>
      </div>

      {/* Escalation Hierarchy and Threshold Banner */}
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 mt-0.5">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-amber-200">
                Connected Escalation & Approval Hierarchy Invariant
              </h4>
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-400/30">
                Threshold: ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-mist-300 leading-relaxed">
              <strong>Standard Requests (≤ ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}):</strong> Approved by Department Manager → Reviewed and finalized by Financial Operator → Posted to guest folio.<br />
              <strong>High-Value Requests (&gt; ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}):</strong> Escalated by Department Manager → Concurred by General Manager → Reviewed and finalized by Financial Operator → Posted to guest folio.<br />
              <span className="text-mist-400 italic">Note: Exactly ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')} is configured under standard department manager ceiling. Disapproved/rejected requests are NEVER posted to guest folio.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'pending', label: 'Pending Financial Review', count: pendingCount },
            { id: 'approved', label: 'Approved & Credited', count: approvedCount },
            { id: 'rejected', label: 'Rejected Claims', count: rejectedCount },
            { id: 'all', label: 'All Requests', count: claims.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl border font-semibold transition flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? 'border-purple-400 bg-purple-500/20 text-purple-200 shadow-sm'
                  : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono ${
                    tab.id === 'pending'
                      ? 'bg-amber-400 text-ink-950'
                      : 'bg-white/10 text-mist-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, room, ref, or reason..."
              className="w-48 sm:w-64 h-8 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-mist-500 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist-200 focus:border-purple-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950">All Departments</option>
            <option value="Housekeeping" className="bg-ink-950">Housekeeping</option>
            <option value="Maintenance" className="bg-ink-950">Maintenance</option>
            <option value="Food" className="bg-ink-950">Food & Beverage</option>
            <option value="Operations" className="bg-ink-950">Operations & Duty</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-12 text-center backdrop-blur-xl">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white font-display">No Claims In Selected Queue</h3>
            <p className="text-xs text-mist-400 mt-1 max-w-md mx-auto">
              There are no compensation claims matching the current filter. Forwarded requests from Department Managers and General Manager will appear here for financial settlement.
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const isHighValue = claim.tier === 'high_value' || claim.amount > MANAGER_COMPENSATION_THRESHOLD;
            const isPendingFinance = claim.status === 'pending_financial_operator';
            const isApproved = claim.status === 'approved';
            const isRejected = claim.status === 'rejected';

            return (
              <div
                key={claim.id}
                className={`rounded-3xl border bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4 transition ${
                  isPendingFinance
                    ? 'border-purple-500/40 bg-purple-950/10'
                    : isApproved
                    ? 'border-emerald-500/30'
                    : 'border-white/10'
                }`}
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.04] border border-white/10 text-white font-mono font-bold text-xs">
                      {claim.room}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{claim.guestName}</h3>
                        <span className="font-mono text-[11px] text-mist-400">· Room {claim.room}</span>
                        {claim.stayId && (
                          <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[10px] text-mist-300">
                            {claim.stayId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-mist-400 font-mono">
                        Ref: {claim.ref} · {claim.department} · {claim.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Amount Card */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-mist-400 block">
                        Requested Credit
                      </span>
                      <span className="text-xl font-bold font-mono text-amber-300">
                        ₹{claim.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Tier badge */}
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                        isHighValue
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {isHighValue ? 'High-Value (> ₹10k)' : 'Standard (≤ ₹10k)'}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isRejected
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-400/20 text-amber-300 border-amber-400/40 animate-pulse'
                      }`}
                    >
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Body: Reason, Evidence, Prior Review Comments */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  {/* Incident Reason & Evidence */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5 lg:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">
                      Incident Summary & Justification
                    </span>
                    <p className="text-white font-medium">{claim.reason}</p>
                    {claim.evidence && (
                      <div className="mt-2 text-[11px] text-mist-300 bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                        <strong className="text-mist-400 block text-[10px] uppercase">Evidence:</strong>
                        {claim.evidence}
                      </div>
                    )}
                  </div>

                  {/* Department Manager & GM Endorsements */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2 lg:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">
                      Upstream Management Approvals
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Department Manager Decision */}
                      <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-purple-300">Department Manager Review</span>
                          <span className="text-emerald-400 font-bold uppercase">
                            {claim.deptManagerDecision ? 'Approved / Escalated' : 'Verified'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white">
                          {claim.deptManagerDecision?.comments || 'Approved within department recovery budget.'}
                        </p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          By: {claim.deptManagerDecision?.decidedBy || 'Marcus Vance'}
                        </p>
                      </div>

                      {/* General Manager Decision (if high-value) */}
                      <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 p-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-300">General Manager Review</span>
                          <span className="text-amber-200 font-bold uppercase">
                            {isHighValue ? (claim.gmDecision ? 'Endorsed' : 'Pending Concurrence') : 'N/A (Standard)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white">
                          {isHighValue
                            ? claim.gmDecision?.comments || 'Forwarded to Finance for account settlement.'
                            : 'Standard threshold does not require GM review.'}
                        </p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {isHighValue ? `By: ${claim.gmDecision?.decidedBy || 'Robert Sterling'}` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Financial Operator decision record (if already reviewed) */}
                    {claim.financeDecision && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-mist-300 block">Finance Settlement Audit:</span>
                          <span className="text-white">{claim.financeDecision.comments}</span>
                        </div>
                        <div className="text-right text-[10px] text-mist-400 font-mono">
                          <span>{claim.financeDecision.decidedBy}</span>
                          <span className="block">{claim.financeDecision.decidedAt}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewHistoryClaim(claim)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.08] transition"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Audit Trail ({claim.history?.length ?? 1} events)</span>
                    </button>

                    {isApproved && claim.folioLineId && (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Folio Line Posted: {claim.folioLineId}
                      </span>
                    )}
                  </div>

                  {isPendingFinance && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjudicate(claim)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-400 transition shadow-lg shadow-purple-500/20"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Adjudicate & Settle Claim</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adjudicate Modal */}
      {selectedClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Financial Adjudication: {selectedClaim.ref}
                </h3>
                <p className="text-xs text-mist-400">
                  Guest: {selectedClaim.guestName} · Room {selectedClaim.room} · Stay {selectedClaim.stayId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Claim details card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-mist-400">Compensation Amount:</span>
                <span className="text-lg font-bold font-mono text-amber-300">
                  ₹{selectedClaim.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mist-400">Escalation Tier:</span>
                <span className="font-semibold text-white">
                  {selectedClaim.tier === 'high_value' ? 'High-Value Tier' : 'Standard Tier'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mist-400">Department:</span>
                <span className="font-semibold text-white">{selectedClaim.department}</span>
              </div>
              <div className="pt-2 border-t border-white/[0.04]">
                <span className="text-mist-400 block text-[10px] uppercase font-bold">Reason:</span>
                <p className="text-mist-200 mt-0.5">{selectedClaim.reason}</p>
              </div>
            </div>

            {/* Action Selector */}
            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-semibold text-mist-300 uppercase">
                Financial Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('approve')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    reviewAction === 'approve'
                      ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold shadow-md'
                      : 'border-white/10 bg-white/[0.02] text-mist-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Approve & Credit
                  </span>
                  <p className="text-[10px] text-mist-400 mt-1 font-normal">
                    Posts ₹{selectedClaim.amount.toLocaleString('en-IN')} credit to Room {selectedClaim.room} folio.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('reject')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    reviewAction === 'reject'
                      ? 'border-rose-500 bg-rose-500/15 text-white font-bold shadow-md'
                      : 'border-white/10 bg-white/[0.02] text-mist-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs text-rose-400">
                    <X className="h-4 w-4" /> Reject Claim
                  </span>
                  <p className="text-[10px] text-mist-400 mt-1 font-normal">
                    Rejects request. Folio remains untouched.
                  </p>
                </button>
              </div>
            </div>

            {/* Comments Field */}
            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-semibold text-mist-300 uppercase">
                Finance Operator Ledger & Audit Comments *
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={3}
                placeholder="Audit notes or account reference..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white placeholder-mist-500 focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'
                }`}
              >
                {reviewAction === 'approve' ? 'Confirm Approval & Post Credit' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {viewHistoryClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Audit Trail: {viewHistoryClaim.ref}
                </h3>
                <p className="text-xs text-mist-400">
                  Guest: {viewHistoryClaim.guestName} · ₹{viewHistoryClaim.amount.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryClaim(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {(viewHistoryClaim.history ?? []).map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <div className="h-2 w-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{entry.action}</span>
                      <span className="font-mono text-[10px] text-mist-400">{entry.at}</span>
                    </div>
                    <p className="text-[11px] text-mist-300">
                      Role: <span className="text-amber-300">{entry.role}</span> ({entry.actor})
                    </p>
                    {entry.note && (
                      <p className="text-mist-400 text-[11px] italic mt-1 bg-black/20 p-2 rounded-xl">
                        &ldquo;{entry.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewHistoryClaim(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
