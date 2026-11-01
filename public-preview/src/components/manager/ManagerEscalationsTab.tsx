'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Crown,
  HeartHandshake,
  MessageSquare,
  ShieldAlert,
  Siren,
  User,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { MANAGER_COMPENSATION_THRESHOLD } from '@/lib/mockData';
import type { ComplaintCase, CompensationRequest } from '@/types/demo';

interface ManagerEscalationsTabProps {
  scope: 'department' | 'hotel';
}

export function ManagerEscalationsTab({ scope }: ManagerEscalationsTabProps) {
  const {
    state,
    resolveComplaintCase,
    addManagerNote,
    createCompensationRequest,
    reviewDeptManagerCompensation,
    reviewGmCompensation,
  } = useDemo();

  // Compensation list filter
  const [compFilter, setCompFilter] = useState<'all' | 'pending_dept_manager' | 'pending_gm' | 'pending_financial_operator' | 'approved' | 'rejected'>('all');
  const [selectedCompForReview, setSelectedCompForReview] = useState<CompensationRequest | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New claim form state
  const [newRoom, setNewRoom] = useState('402');
  const [newGuestName, setNewGuestName] = useState('Vikram & Ananya Singhania');
  const [newDept, setNewDept] = useState('Housekeeping');
  const [newAmount, setNewAmount] = useState<number>(4500);
  const [newReason, setNewReason] = useState('');
  const [newEvidence, setNewEvidence] = useState('');

  // Complaint cases resolution state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintCase | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [approvedCompInput, setApprovedCompInput] = useState<number>(0);

  const complaints = state.frontDesk?.complaints ?? [];
  const compensationRequests = state.compensationRequests ?? [];

  // Filtered compensation requests
  const filteredCompRequests = useMemo(() => {
    return compensationRequests.filter((r) => {
      if (compFilter === 'all') return true;
      return r.status === compFilter;
    });
  }, [compensationRequests, compFilter]);

  const pendingDeptManagerCount = compensationRequests.filter((r) => r.status === 'pending_dept_manager').length;
  const pendingGmCount = compensationRequests.filter((r) => r.status === 'pending_gm').length;
  const pendingFinanceCount = compensationRequests.filter((r) => r.status === 'pending_financial_operator').length;

  const handleOpenReview = (req: CompensationRequest) => {
    setSelectedCompForReview(req);
    setDecisionNotes('');
  };

  const handleConfirmReview = (action: 'approve' | 'escalate_gm' | 'reject') => {
    if (!selectedCompForReview) return;
    reviewDeptManagerCompensation(
      selectedCompForReview.id,
      action,
      decisionNotes.trim() || (action === 'approve' ? 'Approved by Department Manager' : action === 'escalate_gm' ? 'Escalated to GM due to limit' : 'Claim rejected'),
    );
    setSelectedCompForReview(null);
    setDecisionNotes('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim() || newAmount <= 0) return;

    createCompensationRequest({
      room: newRoom.trim(),
      guestName: newGuestName.trim(),
      department: newDept,
      amount: newAmount,
      reason: newReason.trim(),
      supportingEvidence: newEvidence.trim() || 'Logged by Department Manager Marcus Vance during service recovery triage.',
      requestedBy: 'Duty Manager Marcus Vance',
    });

    setIsCreateModalOpen(false);
    setNewReason('');
    setNewEvidence('');
  };

  const handleOpenResolve = (c: ComplaintCase) => {
    setSelectedComplaint(c);
    setApprovedCompInput(c.comp || 0);
    setResolveNotes('');
  };

  const handleConfirmResolve = () => {
    if (!selectedComplaint) return;
    resolveComplaintCase(selectedComplaint.id, resolveNotes || 'Resolved by Duty Manager', approvedCompInput);
    setSelectedComplaint(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-rose-500/20 bg-rose-500/[0.04] p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-300">
              <Siren className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Guest Escalations, Compensation & Service Recovery</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Standard compensation claims (≤ ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}) are approved by Department Manager and sent to Financial Operator. High-value claims (&gt; ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}) require General Manager escalation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Compensation Claim</span>
          </button>
        </div>
      </div>

      {/* Configurable Threshold Notice & Legend */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-3 text-xs text-mist-300 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-200">Configurable Approval Boundary: </span>
          <span>
            Standard requests <strong>≤ ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}</strong> are approved by Department Manager Marcus Vance → forwarded to Financial Operator Neha Kapoor for folio credit.
            Requests <strong>&gt; ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')}</strong> exceed department authority and must be escalated to General Manager Priya Nair.
            <em> (Note: Exactly ₹{MANAGER_COMPENSATION_THRESHOLD.toLocaleString('en-IN')} is configured as inclusive of Department Manager authority).</em>
          </span>
        </div>
      </div>

      {/* SECTION 1: Connected Compensation Escalation Queue */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Multi-Tier Compensation Approval Workflow</h3>
              {pendingDeptManagerCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                  {pendingDeptManagerCount} Action Required
                </span>
              )}
            </div>
            <p className="text-xs text-mist-400">
              Traceable flow: Fulfiller / Dispatcher → Department Manager → General Manager (if &gt; ₹10k) → Financial Operator → Guest Folio
            </p>
          </div>

          {/* Sub-Filters */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setCompFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                compFilter === 'all' ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-white/5 text-mist-300 hover:text-white'
              }`}
            >
              All ({compensationRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setCompFilter('pending_dept_manager')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                compFilter === 'pending_dept_manager' ? 'bg-rose-500 text-white font-bold' : 'bg-white/5 text-mist-300 hover:text-white'
              }`}
            >
              My Review ({pendingDeptManagerCount})
            </button>
            <button
              type="button"
              onClick={() => setCompFilter('pending_gm')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                compFilter === 'pending_gm' ? 'bg-purple-500 text-white font-bold' : 'bg-white/5 text-mist-300 hover:text-white'
              }`}
            >
              With GM ({pendingGmCount})
            </button>
            <button
              type="button"
              onClick={() => setCompFilter('pending_financial_operator')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                compFilter === 'pending_financial_operator' ? 'bg-sky-500 text-white font-bold' : 'bg-white/5 text-mist-300 hover:text-white'
              }`}
            >
              With Finance ({pendingFinanceCount})
            </button>
            <button
              type="button"
              onClick={() => setCompFilter('approved')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                compFilter === 'approved' ? 'bg-emerald-500 text-ink-950 font-bold' : 'bg-white/5 text-mist-300 hover:text-white'
              }`}
            >
              Approved
            </button>
          </div>
        </div>

        {/* List of Claims */}
        <div className="space-y-3">
          {filteredCompRequests.length === 0 ? (
            <div className="py-10 text-center text-xs text-mist-400 italic bg-white/[0.01] rounded-2xl border border-white/5">
              No compensation requests match the selected filter.
            </div>
          ) : (
            filteredCompRequests.map((req) => {
              const isHighValue = req.amount > MANAGER_COMPENSATION_THRESHOLD;
              const isMyActionNeeded = req.status === 'pending_dept_manager';

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition space-y-3.5 ${
                    req.status === 'approved'
                      ? 'border-emerald-500/25 bg-emerald-500/[0.02]'
                      : req.status === 'rejected'
                        ? 'border-rose-500/20 bg-rose-500/[0.02] opacity-80'
                        : isMyActionNeeded
                          ? 'border-amber-400/40 bg-amber-400/[0.04] shadow-md shadow-amber-500/5'
                          : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                        {req.ref}
                      </span>
                      <span className="font-semibold text-white text-xs">Room {req.room}</span>
                      <span className="text-mist-400 text-xs">· {req.guestName}</span>
                      <span className="text-[11px] text-mist-400 font-mono">({req.department})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isHighValue
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {isHighValue ? 'High-Value (> ₹10k · GM Tier)' : 'Standard (≤ ₹10k · Manager Tier)'}
                      </span>

                      <span className="font-mono font-bold text-sm text-white px-2 py-0.5 rounded-lg bg-ink-950/60 border border-white/10">
                        ₹{req.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-mist-400 block">Incident Reason</span>
                      <p className="text-white font-medium mt-0.5">{req.reason}</p>
                    </div>

                    {req.supportingEvidence && (
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] uppercase font-bold text-mist-400 block mb-0.5">Evidence & Observations</span>
                        <p className="text-mist-300 text-[11px] leading-relaxed italic">{req.supportingEvidence}</p>
                      </div>
                    )}
                  </div>

                  {/* Status & History Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-mist-400 text-[11px]">Status:</span>
                      {req.status === 'pending_dept_manager' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          Pending Department Manager Decision
                        </span>
                      )}
                      {req.status === 'pending_gm' && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                          Awaiting General Manager Concurrence
                        </span>
                      )}
                      {req.status === 'pending_financial_operator' && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                          Forwarded to Financial Operator for Folio Credit
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          Approved & Credited to Guest Folio ✓
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          Claim Rejected (No Folio Impact)
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {isMyActionNeeded ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(req)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 transition text-xs flex items-center gap-1 shadow-md shadow-amber-400/20"
                          >
                            <span>Adjudicate Claim</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : req.status === 'pending_gm' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              reviewGmCompensation(req.id, 'forward_to_finance', 'General Manager Priya Nair concurred with recovery claim; forwarded to Finance.');
                            }}
                            className="px-3 py-1 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[11px] font-bold hover:bg-purple-500/20 transition flex items-center gap-1"
                            title="Simulate executive approval without switching role"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Simulate GM Forward to Finance</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-mist-400 font-mono">
                          {req.history.length} audit event{req.history.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: Front Desk Logged Complaints Cases */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Guest Complaint Cases (Front Desk Sync)</h3>
            <p className="text-xs text-mist-400">Formal complaints reported by front desk or guest portal requiring manager sign-off</p>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-mist-300 font-bold">
            {complaints.length} cases
          </span>
        </div>

        <div className="space-y-3">
          {complaints.length === 0 ? (
            <p className="py-8 text-center text-xs text-mist-400 italic">No open complaint cases on record.</p>
          ) : (
            complaints.map((c) => {
              const isVip = c.severity === 'vip' || c.severity === 'critical';
              const isResolved = c.compApplied || (state.items.department_manager ?? []).some((i) => i.id === c.managerItemId && i.status === 'Resolved');

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isResolved
                      ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                      : isVip
                        ? 'border-rose-500/30 bg-rose-500/[0.05]'
                        : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                        {c.ref}
                      </span>
                      <span className="font-semibold text-white text-xs">Room {c.room}</span>
                      <span className="text-mist-400 text-xs">· {c.guest}</span>
                      {isVip && (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                          <Crown className="h-2.5 w-2.5" />
                          VIP
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {c.comp > 0 && (
                        <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 font-mono text-xs text-amber-300 font-bold">
                          Proposed Comp: ₹{c.comp.toLocaleString('en-IN')}
                        </span>
                      )}
                      {isResolved ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenResolve(c)}
                          className="px-3 py-1 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition shadow-md shadow-amber-400/20"
                        >
                          Resolve Case
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-mist-200 bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                    {c.summary}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: Adjudicate Compensation Claim */}
      {selectedCompForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-300">{selectedCompForReview.ref}</span>
                <h3 className="text-base font-bold font-display text-white mt-0.5">
                  Adjudicate Compensation Claim
                </h3>
                <p className="text-xs text-mist-400">
                  Room {selectedCompForReview.room} · {selectedCompForReview.guestName} ({selectedCompForReview.department})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompForReview(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-mist-400 block">Requested Amount</span>
                  <span className="font-mono text-base font-bold text-amber-300">
                    ₹{selectedCompForReview.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-mist-400 block">Approval Tier</span>
                  <span className={`font-semibold text-xs ${
                    selectedCompForReview.amount > MANAGER_COMPENSATION_THRESHOLD ? 'text-purple-300' : 'text-sky-300'
                  }`}>
                    {selectedCompForReview.amount > MANAGER_COMPENSATION_THRESHOLD
                      ? 'High-Value (> ₹10,000 → Requires GM)'
                      : 'Standard (≤ ₹10,000 → Manager Authority)'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-mist-400 block mb-1">Reason & Claim Details</span>
                <p className="text-mist-200 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {selectedCompForReview.reason}
                </p>
              </div>

              {selectedCompForReview.supportingEvidence && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-mist-400 block mb-1">Supporting Evidence</span>
                  <p className="text-mist-300 bg-black/40 p-2.5 rounded-xl border border-white/5 italic">
                    {selectedCompForReview.supportingEvidence}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Managerial Decision Notes / Directives:
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Document the operational basis for your decision or guidance to the next tier..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCompForReview(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmReview('reject')}
                className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-bold hover:bg-rose-500/20 transition text-xs"
              >
                Decline Claim
              </button>

              {selectedCompForReview.amount <= MANAGER_COMPENSATION_THRESHOLD ? (
                <button
                  type="button"
                  onClick={() => handleConfirmReview('approve')}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-ink-950 font-bold hover:bg-emerald-400 transition text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve & Send to Finance</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmReview('escalate_gm')}
                  className="px-5 py-2 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
                >
                  <Crown className="h-4 w-4" />
                  <span>Escalate to General Manager</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Compensation Request */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">Create Guest Compensation Claim</h3>
                <p className="text-xs text-mist-400">Initiate service recovery claim for guest dispute or defect</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Room Number:</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Guest Name:</label>
                  <input
                    type="text"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Department:</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full h-9 rounded-xl border border-white/10 bg-ink-950 px-3 text-xs text-white"
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Maintenance & Engineering">Maintenance & Engineering</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Front Office">Front Office</option>
                    <option value="Operations">Operations / General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Amount (₹ INR):</label>
                  <input
                    type="number"
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-3 font-mono font-bold text-amber-300 text-xs"
                    required
                  />
                  <span className="text-[10px] text-mist-400 mt-0.5 block">
                    {newAmount > MANAGER_COMPENSATION_THRESHOLD
                      ? 'Requires General Manager escalation (> ₹10k)'
                      : 'Department Manager standard authority (≤ ₹10k)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 mb-1">Incident Reason & Failure:</label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Ruined garment from ceiling leak / 4-hour power outage during dinner"
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-mist-300 mb-1">Supporting Evidence / Notes:</label>
                <textarea
                  rows={2}
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  placeholder="e.g. Attendant photo inspection report, guest invoice copy..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 transition text-xs shadow-md shadow-amber-400/20"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Complaint Case Resolution */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">
                  Resolve Complaint: {selectedComplaint.ref}
                </h3>
                <p className="text-xs text-mist-400">
                  Room {selectedComplaint.room} · {selectedComplaint.guest}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                <span className="text-mist-400 text-[10px] uppercase font-bold block mb-1">Guest Summary</span>
                <p className="text-mist-200 leading-relaxed">{selectedComplaint.summary}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Authorize Goodwill Credit (₹):
                </label>
                <input
                  type="number"
                  min={0}
                  value={approvedCompInput}
                  onChange={(e) => setApprovedCompInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3 font-mono text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Managerial Resolution Notes & Directives:
                </label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="e.g. Personally spoke with guest; room quiet hours verified with Security; spa credit posted."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
              >
                Approve & Resolve Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
