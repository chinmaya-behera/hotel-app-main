'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  Filter,
  Package,
  Plus,
  Send,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { ResourceRequest } from '@/types/demo';

interface ManagerResourcesTabProps {
  scope: 'department' | 'hotel';
}

export function ManagerResourcesTab({ scope }: ManagerResourcesTabProps) {
  const { state, reviewResourceRequest, createResourceRequest } = useDemo();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [reviewModalReq, setReviewModalReq] = useState<{ req: ResourceRequest; action: 'approve' | 'reject' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Form state for creating a new resource request
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceRequest['category']>('Supply');
  const [newDept, setNewDept] = useState('Housekeeping');
  const [newUrgency, setNewUrgency] = useState<ResourceRequest['urgency']>('medium');
  const [newDetails, setNewDetails] = useState('');

  const requests = (state.resourceRequests ?? []).filter((r) => {
    if (scope === 'department') {
      const d = r.department.toLowerCase();
      if (!d.includes('duty') && !d.includes('operations') && !d.includes('management')) {
        return false;
      }
    }
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const handleConfirmReview = () => {
    if (!reviewModalReq) return;
    reviewResourceRequest(reviewModalReq.req.id, reviewModalReq.action, reviewNotes.trim() || undefined);
    setReviewModalReq(null);
    setReviewNotes('');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDetails.trim()) return;

    createResourceRequest({
      title: newTitle.trim(),
      category: newCategory,
      department: newDept,
      urgency: newUrgency,
      requestedBy: 'Isabella Scott (Duty Manager)',
      details: newDetails.trim(),
    });

    setNewTitle('');
    setNewDetails('');
    setNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
              <Boxes className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Resource, Equipment & Replenishment Control</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Review emergency supply requisitions, equipment failure replacements, and additional field staffing requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-mist-400 font-medium">Category:</span>
          {['all', 'Supply', 'Equipment', 'Staffing', 'Maintenance'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-xl border font-semibold transition ${
                filterCategory === cat
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-mist-400 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-mist-200 focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-ink-950 text-white">All Statuses</option>
            <option value="pending" className="bg-ink-950 text-white">Pending Review</option>
            <option value="approved" className="bg-ink-950 text-white">Approved</option>
            <option value="rejected" className="bg-ink-950 text-white">Declined</option>
          </select>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-mist-400 italic rounded-3xl border border-white/10 bg-ink-900/50">
            No resource requests match your filter selection.
          </div>
        ) : (
          requests.map((r) => {
            const isCritical = r.urgency === 'critical';
            const isHigh = r.urgency === 'high';
            const isPending = r.status === 'pending';

            return (
              <div
                key={r.id}
                className={`p-5 rounded-3xl border bg-ink-900/90 shadow-xl backdrop-blur-xl space-y-4 transition ${
                  isPending
                    ? 'border-amber-400/30'
                    : r.status === 'approved'
                    ? 'border-emerald-500/20'
                    : 'border-white/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/10 text-mist-200 text-[10px] font-bold px-2 py-0.5">
                        {r.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-mist-300'
                        }`}
                      >
                        {r.urgency} Urgency
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{r.title}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                      r.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : r.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Details */}
                <p className="text-xs text-mist-200 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/[0.04]">
                  {r.details}
                </p>

                {/* Requester and Timestamps */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-mist-400 font-mono border-t border-white/[0.04] pt-2">
                  <span>Req by: {r.requestedBy}</span>
                  <span>{r.requestedAt}</span>
                </div>

                {/* Review details if reviewed */}
                {r.reviewedBy && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-semibold text-mist-300">
                      <span>Reviewed by {r.reviewedBy}</span>
                      <span>{r.reviewedAt}</span>
                    </div>
                    {r.reviewNotes && <p className="text-mist-400 italic">“{r.reviewNotes}”</p>}
                  </div>
                )}

                {/* Action Buttons for Pending Requisitions */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setReviewModalReq({ req: r, action: 'reject' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewModalReq({ req: r, action: 'approve' })}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 text-ink-950 text-xs font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Approve Request</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal Dialog */}
      {reviewModalReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">
                  {reviewModalReq.action === 'approve' ? 'Approve Resource Requisition' : 'Decline Resource Requisition'}
                </h3>
                <p className="text-xs text-mist-400">{reviewModalReq.req.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalReq(null)}
                className="text-mist-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Managerial Directive & Decision Notes (optional):
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewModalReq.action === 'approve'
                      ? 'e.g. Authorized expedited procurement; contractor assigned.'
                      : 'e.g. Alternate equipment unit available on Level 2.'
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setReviewModalReq(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`px-5 py-2 rounded-xl text-ink-950 text-xs font-bold transition shadow-lg ${
                  reviewModalReq.action === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-400'
                    : 'bg-rose-400 hover:bg-rose-300'
                }`}
              >
                Confirm {reviewModalReq.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Requisition Modal Dialog */}
      {newModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">Create Operational Resource Request</h3>
                <p className="text-xs text-mist-400">Request equipment replacement, staffing, or urgent supplies</p>
              </div>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="text-mist-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">Request Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Spare AC Pressure Transducer Floor 4"
                  className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ResourceRequest['category'])}
                    className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Supply">Supply</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Staffing">Staffing</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Department:</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Maintenance & Engineering">Maintenance</option>
                    <option value="Food & Beverage">F&B</option>
                    <option value="Front Office">Front Office</option>
                    <option value="Safety & Security">Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-mist-300 mb-1">Urgency:</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as ResourceRequest['urgency'])}
                    className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">Request Justification & Scope:</label>
                <textarea
                  rows={3}
                  required
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Describe the operational impact, affected rooms, or equipment specifics..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
