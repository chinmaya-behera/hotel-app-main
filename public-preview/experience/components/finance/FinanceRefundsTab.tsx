'use client';

import { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  User,
  FileText,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import type { FinanceRefundRequest, RefundStatus } from '@/types/demo';

interface FinanceRefundsTabProps {
  refundRequests: FinanceRefundRequest[];
  onSelectRefund: (refund: FinanceRefundRequest) => void;
}

export function FinanceRefundsTab({
  refundRequests,
  onSelectRefund
}: FinanceRefundsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary Metrics
  const summary = useMemo(() => {
    const pending = refundRequests.filter(r => r.status === 'Pending Review');
    const approved = refundRequests.filter(r => r.status === 'Approved');
    const executed = refundRequests.filter(r => r.status === 'Executed');
    const rejected = refundRequests.filter(r => r.status === 'Rejected');

    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((acc, r) => acc + r.amount, 0),
      approvedCount: approved.length,
      approvedTotal: approved.reduce((acc, r) => acc + r.amount, 0),
      executedCount: executed.length,
      executedTotal: executed.reduce((acc, r) => acc + r.amount, 0),
      rejectedCount: rejected.length
    };
  }, [refundRequests]);

  // Filtered List
  const filteredList = useMemo(() => {
    return refundRequests.filter(r => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.id.toLowerCase().includes(q) ||
          r.guestName.toLowerCase().includes(q) ||
          r.invoiceId.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [refundRequests, statusFilter, searchQuery]);

  const getStatusBadge = (status: RefundStatus) => {
    switch (status) {
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'Executed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck className="h-3 w-3" /> Executed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-400" />
            Refund Management Queue
          </h2>
          <p className="text-xs text-mist-400">
            Audit guest dispute claims, evaluate billing disputes, and approve or reject refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-300 border border-primary-500/30">
            Operator Clearance Limit: ₹80,000
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-4 rounded-xl bg-ink-900 border border-amber-500/30 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </p>
          <h3 className="text-2xl font-black text-amber-400 mt-1">₹{summary.pendingTotal.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{summary.pendingCount} requests requiring decision</p>
        </div>

        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved / Queued
          </p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">₹{summary.approvedTotal.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{summary.approvedCount} ready for payout</p>
        </div>

        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Disbursed / Executed
          </p>
          <h3 className="text-2xl font-black text-white mt-1">₹{summary.executedTotal.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{summary.executedCount} settled back to guests</p>
        </div>

        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-400 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> Declined Claims
          </p>
          <h3 className="text-2xl font-black text-white mt-1">{summary.rejectedCount} Cases</h3>
          <p className="text-xs text-mist-400 mt-1">Audit reasons documented</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-ink-900 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
          <input
            type="text"
            placeholder="Search by refund ID, guest, invoice, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'Pending Review', 'Approved', 'Executed', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-ink-950 hover:bg-ink-800 text-mist-400 hover:text-white border border-white/5'
              }`}
            >
              {status === 'ALL' ? `All Requests (${refundRequests.length})` : status}
            </button>
          ))}
        </div>

      </div>

      {/* Refund Queue Table */}
      <div className="bg-ink-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No refund requests in this view</h4>
            <p className="text-xs text-mist-400 mt-1">
              All guest disputes have been reviewed or no requests match the filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Guest & Room</th>
                  <th className="py-3 px-4">Linked Invoice</th>
                  <th className="py-3 px-4">Dispute Reason</th>
                  <th className="py-3 px-4 text-right">Refund Amount</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((refund) => (
                  <tr key={refund.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {refund.id}
                      <div className="text-[10px] text-mist-500 font-sans">by {refund.requestedBy}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <User className="h-3 w-3 text-mist-400" />
                        {refund.guestName}
                      </div>
                      <div className="text-[10px] text-mist-400">Room {refund.roomNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-primary-400">
                      {refund.invoiceId}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-mist-200 line-clamp-2">{refund.reason}</p>
                      {refund.rejectionReason && (
                        <p className="text-[10px] text-rose-400 mt-0.5 italic">Decline reason: {refund.rejectionReason}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-purple-400 text-sm">
                      ₹{refund.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-mist-400 text-[11px]">
                      {refund.requestedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectRefund(refund)}
                        className="px-3 py-1.5 rounded-lg bg-ink-800 hover:bg-purple-600 hover:text-white text-mist-200 text-xs font-semibold border border-white/10 transition-colors"
                      >
                        Review Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
