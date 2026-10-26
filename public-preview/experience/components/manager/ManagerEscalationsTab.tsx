'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { ComplaintCase, WorkItem } from '@/types/demo';

interface ManagerEscalationsTabProps {
  scope: 'department' | 'hotel';
}

export function ManagerEscalationsTab({ scope }: ManagerEscalationsTabProps) {
  const { state, resolveComplaintCase, addManagerNote } = useDemo();
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintCase | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [approvedCompInput, setApprovedCompInput] = useState<number>(0);

  const complaints = state.frontDesk.complaints ?? [];
  const managerTasks = (state.items.department_manager ?? []).filter((i) => i.status === 'Escalated');
  const dutyCompLimit = state.workflowConfig?.dutyManagerCompLimit || 16000;

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
            <h2 className="text-xl font-bold font-display text-white">Guest Escalations & Service Recovery</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Empowered to resolve guest disputes, approve goodwill compensation credits up to ₹{dutyCompLimit.toLocaleString('en-IN')}, and coordinate recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-xs text-purple-300 font-bold">
            Comp Approval Limit: ₹{dutyCompLimit.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Front Desk Logged Complaints Cases */}
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
                      <span className="font-mono text-amber-300 font-bold text-xs">{c.ref}</span>
                      <span className="font-semibold text-white text-sm">Room {c.room} · {c.guest}</span>
                      {isVip && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                          <Crown className="h-3 w-3" />
                          <span>VIP Escalation</span>
                        </span>
                      )}
                      {c.repeatOf && (
                        <span className="rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5">
                          Repeat of {c.repeatOf}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-mist-400 font-mono">Logged at {c.createdAt}</span>
                      {isResolved ? (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5">
                          Resolved & Credited
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold px-2.5 py-0.5">
                          Awaiting Resolution
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-mist-200 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                    {c.summary}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2 text-mist-300">
                      <CircleDollarSign className="h-4 w-4 text-amber-300" />
                      <span>Compensation Requested: </span>
                      <strong className="text-white font-mono">
                        {c.comp > 0 ? `₹${c.comp.toLocaleString('en-IN')}` : 'None requested'}
                      </strong>
                      {c.comp > 0 && !c.compApplied && (
                        <span className="text-amber-300 text-[11px] font-semibold">(Requires Duty Mgr Authorization)</span>
                      )}
                    </div>

                    {!isResolved && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenResolve(c)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 transition shadow-sm"
                        >
                          <HeartHandshake className="h-3.5 w-3.5" />
                          <span>Authorize Recovery & Close</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Operational Escalated Tasks */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">SLA Breached & Cross-Department Operational Alerts</h3>
            <p className="text-xs text-mist-400">Field tasks automatically escalated due to delays or dependencies</p>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-mist-300 font-bold">
            {managerTasks.length} alerts
          </span>
        </div>

        <div className="space-y-3">
          {managerTasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-mist-400 italic">No operational escalation alerts.</p>
          ) : (
            managerTasks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.title}</span>
                    <span className="rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5">
                      {item.chip || 'Escalated'}
                    </span>
                  </div>
                  <p className="text-mist-300 text-[11px]">{item.meta || item.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-mist-400 text-[11px]">
                    {item.amount ? `₹${item.amount.toLocaleString('en-IN')}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => addManagerNote(item.id, 'Duty Manager acknowledged operational alert.')}
                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resolve / Compensation Approval Modal */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 id="resolve-modal-title" className="text-base font-bold font-display text-white">
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

            <div className="space-y-4 text-xs">
              <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                <span className="text-mist-400 text-[10px] uppercase font-bold block mb-1">Guest Summary</span>
                <p className="text-mist-200 leading-relaxed">{selectedComplaint.summary}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Authorize Service Recovery Goodwill Credit (₹):
                </label>
                <input
                  type="number"
                  min={0}
                  max={dutyCompLimit}
                  value={approvedCompInput}
                  onChange={(e) => setApprovedCompInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/40 px-3 font-mono text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-mist-400 block mt-1">
                  Maximum permitted without GM authorization: ₹{dutyCompLimit.toLocaleString('en-IN')}
                </span>
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
