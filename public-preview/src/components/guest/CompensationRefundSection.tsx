'use client';

import { useState, useMemo } from 'react';
import {
  Scale,
  Receipt,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Upload,
  FileText,
  Send,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { claimView } from '@/lib/financialClaims';
import { money } from '@/lib/utils';
import { GuestSheet, GuestPill } from '@/components/guest/guestUi';
import type {
  CompensationRefundCategory,
  CompensationRefundStatus,
  CompensationRefundRequest,
  CompensationRefundAttachment,
} from '@/types/demo';

interface CompensationRefundSectionProps {
  room: string;
  guestName: string;
  onNavigate?: (tab: any, subtab?: string) => void;
}

const CATEGORIES: Array<{
  id: CompensationRefundCategory;
  title: string;
  desc: string;
  icon: typeof Scale;
}> = [
  {
    id: 'Refund Request',
    title: 'Refund Request',
    desc: 'Full refund request for cancelled service, room downgrade, or stay disruption.',
    icon: Receipt,
  },
  {
    id: 'Partial Refund',
    title: 'Partial Refund',
    desc: 'Partial fee reimbursement or pro-rated adjustment for amenities not delivered.',
    icon: DollarSign,
  },
  {
    id: 'Compensation for Service Issues',
    title: 'Compensation for Service Issues',
    desc: 'Goodwill recovery, delay compensation, or inconvenience credits.',
    icon: Sparkles,
  },
  {
    id: 'Billing Dispute',
    title: 'Billing Dispute',
    desc: 'Dispute an item on your folio or room charges you did not authorize.',
    icon: Scale,
  },
  {
    id: 'Incorrect Charges',
    title: 'Incorrect Charges',
    desc: 'Wrong room tariff, automated sensor error, or miscalculated restaurant bill.',
    icon: AlertCircle,
  },
  {
    id: 'Duplicate Payment',
    title: 'Duplicate Payment',
    desc: 'Double deduction from card, UPI, or dual terminal transaction.',
    icon: Receipt,
  },
  {
    id: 'Deposit Refund',
    title: 'Deposit Refund',
    desc: 'Release or return of pre-authorization incidental security holds.',
    icon: ShieldCheck,
  },
  {
    id: 'Other Financial Concern',
    title: 'Other Financial Concern',
    desc: 'Any other financial reconciliation, tax invoice query or settlement matter.',
    icon: HelpCircle,
  },
];

const PREFERRED_RESOLUTIONS = [
  'Full Refund to Original Payment Method',
  'Partial Refund',
  'Folio Credit / Waiver',
  'Dining / Service Voucher',
  'Direct Bank / UPI Transfer',
  'Other',
];

export function CompensationRefundSection({
  room,
  guestName,
  onNavigate,
}: CompensationRefundSectionProps) {
  const {
    state,
    submitCompensationRefundRequest,
    guestProvideAdditionalRefundInfo,
  } = useDemo();

  // Requests for this room
  const myRequests = useMemo(() => {
    return (state.guestCompensationRefundRequests ?? [])
      .filter((r) => r.room === room)
      .map((r) => claimView(state, r));
  }, [state, room]);

  // Folio lines for transaction reference
  const folioLines = state.folios?.[room] ?? [];
  const stays = state.frontDesk?.stays ?? [];
  const myStay = stays.find((s) => s.room === room);
  const bookingRef = myStay ? `BK-${room}-${myStay.departure.replace(/-/g, '').slice(4)}` : `BK-${room}-21`;

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [additionalInfoTargetId, setAdditionalInfoTargetId] = useState<string | null>(null);
  const [additionalInfoInput, setAdditionalInfoInput] = useState('');

  // Form State
  const [category, setCategory] = useState<CompensationRefundCategory>('Refund Request');
  const [relatedTransaction, setRelatedTransaction] = useState('');
  const [customTransaction, setCustomTransaction] = useState('');
  const [amountRequested, setAmountRequested] = useState('');
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [incidentDate, setIncidentDate] = useState('Today');
  const [preferredResolution, setPreferredResolution] = useState(PREFERRED_RESOLUTIONS[0]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [attachments, setAttachments] = useState<CompensationRefundAttachment[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  function handleOpenForm(preselectedCategory?: CompensationRefundCategory) {
    if (preselectedCategory) {
      setCategory(preselectedCategory);
    }
    setReason('');
    setExplanation('');
    setAmountRequested('');
    setRelatedTransaction(folioLines.length > 0 ? folioLines[0].label : '');
    setCustomTransaction('');
    setIncidentDate('Today');
    setPreferredResolution(PREFERRED_RESOLUTIONS[0]);
    setAdditionalInstructions('');
    setAttachments([]);
    setFormError(null);
    setIsModalOpen(true);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: CompensationRefundAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      newAttachments.push({
        name: f.name,
        size: `${Math.round(f.size / 1024)} KB`,
        type: f.type || 'document',
      });
    }
    setAttachments([...attachments, ...newAttachments]);
  }

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setFormError('Please enter a brief summary / reason for your request.');
      return;
    }
    if (!explanation.trim()) {
      setFormError('Please provide a detailed explanation.');
      return;
    }

    const finalRelated =
      relatedTransaction === 'other' && customTransaction.trim()
        ? customTransaction.trim()
        : relatedTransaction;

    const numAmount = amountRequested.trim() ? parseFloat(amountRequested) : undefined;

    const ref = submitCompensationRefundRequest({
      room,
      guestName,
      bookingRef,
      category,
      relatedServiceOrTransaction: finalRelated || undefined,
      amountRequested: numAmount && !isNaN(numAmount) ? numAmount : undefined,
      reason: reason.trim(),
      explanation: explanation.trim(),
      incidentDate: incidentDate.trim() || undefined,
      preferredResolution,
      attachments: attachments.length > 0 ? attachments : undefined,
      additionalInstructions: additionalInstructions.trim() || undefined,
    });

    setIsModalOpen(false);
    setSuccessToast(`Request ${ref} submitted. Front Desk team is reviewing your case.`);
    setExpandedRequestId(ref);
    setTimeout(() => setSuccessToast(null), 6000);
  }

  function handleSendAdditionalInfo(reqId: string) {
    if (!additionalInfoInput.trim()) return;
    guestProvideAdditionalRefundInfo(reqId, additionalInfoInput.trim());
    setAdditionalInfoTargetId(null);
    setAdditionalInfoInput('');
    setSuccessToast('Additional information delivered to Front Desk Coordinator.');
    setTimeout(() => setSuccessToast(null), 5000);
  }

  function getStatusTone(status: CompensationRefundStatus): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
    switch (status) {
      case 'Resolved':
        return 'success';
      case 'Approved':
      case 'Partially Approved':
        return 'info';
      case 'Processing':
      case 'Under Review':
        return 'warning';
      case 'Additional Information Required':
        return 'warning';
      case 'Rejected':
        return 'danger';
      case 'Submitted':
      default:
        return 'neutral';
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {successToast && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs text-white shadow-lg animate-in fade-in">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="font-semibold text-emerald-300">{successToast}</p>
        </div>
      )}

      {/* Hero Header */}
      <div className="guest-card p-4 sm:p-5 border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-ink-950 to-ink-900 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 mt-0.5 sm:mt-0">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Compensation &amp; Refund Requests
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold uppercase">
                  Front Desk Billing
                </span>
              </div>
              <p className="text-xs text-mist-300 mt-1 max-w-2xl leading-relaxed">
                Need help with a billing issue, refund or compensation? Submit your request for our team to review.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* 8 Clear Request Categories Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mist-400">
            Select a Request Category
          </h3>
          <span className="text-[11px] text-mist-400 font-mono">
            Room {room} · {guestName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleOpenForm(cat.id)}
                className="guest-card p-3.5 text-left border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.04] transition-all group flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-1.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 group-hover:bg-amber-400 group-hover:text-ink-950 transition-colors">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {cat.title}
                  </h4>
                  <p className="text-[11px] text-mist-400 leading-snug line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold pt-1 border-t border-white/5">
                  <span>Start Request</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* My Submitted Requests List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Your Submitted Requests ({myRequests.length})</span>
            </h3>
            <p className="text-[11px] text-mist-400">
              Track status, review staff responses, and provide additional details
            </p>
          </div>
        </div>

        {myRequests.length === 0 ? (
          <div className="guest-card p-8 text-center space-y-2 border border-white/10">
            <Scale className="mx-auto h-8 w-8 text-mist-500" />
            <p className="text-xs font-bold text-white">No compensation or refund requests logged</p>
            <p className="text-[11px] text-mist-400 max-w-sm mx-auto">
              If you experienced any billing irregularity, duplicate deduction, or service shortfall, tap &quot;New Request&quot; above to submit your case.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => {
              const isExpanded = expandedRequestId === req.id || expandedRequestId === req.ref;
              const tone = getStatusTone(req.status);
              const needsMoreInfo = req.status === 'Additional Information Required';

              return (
                <div
                  key={req.id}
                  className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all shadow-md"
                >
                  {/* Compact Header Bar */}
                  <div
                    className="p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() =>
                      setExpandedRequestId(isExpanded ? null : req.id)
                    }
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/15 text-amber-300 shrink-0 mt-0.5">
                        <Scale className="h-4.5 w-4.5" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">{req.ref}</span>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {req.category}
                          </h4>
                        </div>
                        <p className="text-[11px] text-mist-300 line-clamp-1">{req.reason}</p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          Submitted {req.createdAt} · Room {req.room} · Stay {req.bookingRef || `BK-${room}`}
                          {req.amountRequested ? ` · Requested: ${money(req.amountRequested)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <GuestPill tone={tone}>{req.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-4 text-xs">
                      {/* Request Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                        <div className="p-2.5 rounded-xl bg-white/[0.04]">
                          <span className="text-[10px] uppercase font-bold text-mist-400 block">
                            Category &amp; Resolution
                          </span>
                          <span className="text-white font-semibold block">{req.category}</span>
                          <span className="text-mist-400 text-[11px] block mt-0.5">
                            Pref: {req.preferredResolution || 'Standard Adjustment'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.04]">
                          <span className="text-[10px] uppercase font-bold text-mist-400 block">
                            Financial Reconciliation
                          </span>
                          <span className="text-white font-semibold font-mono block">
                            Requested: {req.amountRequested ? money(req.amountRequested) : 'Open review'}
                          </span>
                          {req.approvedAmount !== undefined && (
                            <span className="text-emerald-400 font-bold font-mono text-[11px] block mt-0.5">
                              Approved: {money(req.approvedAmount)}
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.04]">
                          <span className="text-[10px] uppercase font-bold text-mist-400 block">
                            Linked Stay / Reference
                          </span>
                          <span className="text-white font-semibold font-mono block">
                            {req.bookingRef || `BK-${room}-21`}
                          </span>
                          {req.relatedServiceOrTransaction && (
                            <span className="text-mist-400 text-[10px] block truncate mt-0.5">
                              Tx: {req.relatedServiceOrTransaction}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="p-3 rounded-xl bg-white/[0.03] space-y-1">
                        <span className="text-[10px] uppercase font-bold text-mist-400">
                          Your Detailed Statement
                        </span>
                        <p className="text-mist-200 leading-relaxed text-xs">{req.explanation}</p>
                      </div>

                      {/* Attachments if any */}
                      {req.attachments && req.attachments.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-mist-400">
                            Supporting Attachments ({req.attachments.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {req.attachments.map((att, i) => (
                              <div
                                key={i}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-mist-200 text-xs flex items-center gap-2"
                              >
                                <FileText className="h-3.5 w-3.5 text-amber-400" />
                                <span>{att.name}</span>
                                {att.size && <span className="text-[10px] text-mist-500">({att.size})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staff Response / Decision */}
                      {req.staffResponse && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                          <div className="flex items-center justify-between text-emerald-300">
                            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-emerald-400" />
                              <span>Front Desk Official Response</span>
                            </span>
                            {req.resolvedAt && (
                              <span className="text-[10px] font-mono text-emerald-400/80">
                                {req.resolvedAt}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white leading-relaxed">{req.staffResponse}</p>
                          {req.resolutionDetails && (
                            <div className="pt-1.5 border-t border-emerald-500/20 text-[11px] text-emerald-200">
                              <strong>Resolution Details:</strong> {req.resolutionDetails}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Needs Information Alert & Reply Action */}
                      {needsMoreInfo && (
                        <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-2.5">
                          <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <AlertCircle className="h-4 w-4" />
                            <span>Action Required: Front Desk requested additional details</span>
                          </div>
                          <p className="text-xs text-mist-200">
                            Please provide the additional information requested by the Front Desk coordinator to proceed with your claim review.
                          </p>

                          {additionalInfoTargetId === req.id ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                rows={2}
                                value={additionalInfoInput}
                                onChange={(e) => setAdditionalInfoInput(e.target.value)}
                                placeholder="Enter requested details, transaction receipt number, or explanations..."
                                className="w-full px-3 py-2 rounded-xl bg-ink-950 border border-white/15 text-white text-xs outline-none focus:border-amber-400"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAdditionalInfoTargetId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-white/10 text-mist-300 text-xs"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={!additionalInfoInput.trim()}
                                  onClick={() => handleSendAdditionalInfo(req.id)}
                                  className="px-4 py-1.5 rounded-lg bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 disabled:opacity-40"
                                >
                                  Send to Front Desk
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAdditionalInfoTargetId(req.id);
                                setAdditionalInfoInput('');
                              }}
                              className="px-4 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 shadow-md inline-flex items-center gap-1.5"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Provide Additional Details</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Guest provided additional info record */}
                      {req.additionalInfoProvided && (
                        <div className="p-3 rounded-xl bg-white/[0.04] text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-mist-400">
                            Additional Information Provided by You
                          </span>
                          <p className="text-mist-200">{req.additionalInfoProvided}</p>
                        </div>
                      )}

                      {/* Audit History Timeline */}
                      {req.history && req.history.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-white/10">
                          <span className="text-[10px] uppercase font-bold text-mist-400">
                            Activity History
                          </span>
                          <div className="space-y-1 pl-2 border-l border-white/10">
                            {req.history.map((h, i) => (
                              <div key={i} className="text-[11px] text-mist-300 pl-2 py-0.5">
                                <span className="font-mono text-mist-500 text-[10px]">{h.at}</span> ·{' '}
                                <strong className="text-amber-300">{h.status}</strong>
                                {h.note ? ` — ${h.note}` : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REQUEST SUBMISSION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-ink-900 via-ink-950 to-ink-950 border border-white/15 text-white shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Submit Compensation &amp; Refund Request
                  </h3>
                  <p className="text-[11px] text-mist-400 mt-0.5">
                    Review and formal submission directly to Front Desk Duty Management
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRequest} className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Auto-populated Booking & Stay Context */}
              <div className="p-3 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-[9px] uppercase font-bold text-mist-400 block">Stay Record</span>
                  <span className="text-white font-semibold font-mono block truncate">{bookingRef}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-mist-400 block">Assigned Suite</span>
                  <span className="text-white font-semibold block">Room {room}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[9px] uppercase font-bold text-mist-400 block">Guest Profile</span>
                  <span className="text-amber-300 font-semibold block truncate">{guestName}</span>
                </div>
              </div>

              {/* Category & Amount Requested */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">
                    Request Category <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CompensationRefundCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200 flex items-center justify-between">
                    <span>Amount Requested (₹)</span>
                    <span className="text-[10px] text-mist-400 font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amountRequested}
                      onChange={(e) => setAmountRequested(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white font-mono focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Related Folio Service or Transaction */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span>Related Service or Folio Transaction</span>
                  <span className="text-[10px] text-mist-400 font-normal">Where applicable</span>
                </label>
                <select
                  value={relatedTransaction}
                  onChange={(e) => setRelatedTransaction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                >
                  <option value="">-- None / General Stay Concern --</option>
                  {folioLines.map((line) => (
                    <option key={line.id} value={`${line.label} (${money(line.amount)})`}>
                      {line.label} · {money(line.amount)} ({line.date})
                    </option>
                  ))}
                  <option value="other">Other transaction / unlisted charge</option>
                </select>
              </div>

              {relatedTransaction === 'other' && (
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Specify Transaction / Charge</label>
                  <input
                    type="text"
                    value={customTransaction}
                    onChange={(e) => setCustomTransaction(e.target.value)}
                    placeholder="e.g. POS Bar charge from 09:30 PM, laundry ticket #402-08..."
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              )}

              {/* Reason / Title */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200">
                  Reason for Request <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Duplicate charge on credit card terminal, AC failure during night..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              {/* Detailed Explanation */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200">
                  Detailed Explanation <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide full context, including times, personnel spoken to, or circumstances leading to this compensation/refund request..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              {/* Incident Date & Preferred Resolution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Date of Incident / Charge</label>
                  <input
                    type="text"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    placeholder="e.g. Today 08:30 AM, or 2026-11-05"
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Preferred Resolution</label>
                  <select
                    value={preferredResolution}
                    onChange={(e) => setPreferredResolution(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                  >
                    {PREFERRED_RESOLUTIONS.map((res) => (
                      <option key={res} value={res}>
                        {res}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supporting Attachments Upload */}
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span>Supporting Attachments</span>
                  <span className="text-[10px] text-mist-400 font-normal">Receipt, bill, photo, or document</span>
                </label>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-mist-200 text-xs flex items-center gap-1.5"
                      >
                        <FileText className="h-3 w-3 text-amber-400" />
                        <span className="truncate max-w-[160px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          className="text-mist-400 hover:text-rose-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]">
                  <Upload className="h-4 w-4 text-mist-400" />
                  <span className="text-xs text-mist-300">Click to upload receipts or documentation</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-1">
                <label className="font-semibold text-mist-200 flex items-center justify-between">
                  <span>Additional Instructions / Communication Note</span>
                  <span className="text-[10px] text-mist-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Please call my mobile number after 02:00 PM..."
                  className="w-full px-3 py-2 rounded-xl bg-ink-900 border border-white/15 text-white focus:border-amber-400 outline-none"
                />
              </div>

              {/* Strict Notice */}
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <p>
                  Financial reviews follow hotel auditing SOP. Front Desk coordinates with Finance Desk for ledger updates and terminal reversals. You will be updated upon each review milestone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 shadow-md flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Request to Front Desk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

