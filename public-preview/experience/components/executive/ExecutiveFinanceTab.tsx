'use client';

import { useState, useMemo } from 'react';
import {
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  FileCheck2,
  Filter,
  Layers,
  Lock,
  Package,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tag,
  User,
  Users,
  Wallet,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { ResourceRequest, WorkItem } from '@/types/demo';

interface ExecutiveFinanceTabProps {
  permissionMode: 'viewer' | 'approver';
  initialCategory?: 'all' | 'purchases' | 'equipment' | 'resources';
  onReviewItem?: (item: WorkItem) => void;
}

export function ExecutiveFinanceTab({
  permissionMode,
  initialCategory = 'all',
  onReviewItem,
}: ExecutiveFinanceTabProps) {
  const { state, reviewResourceRequest, reviewExecutiveItem } = useDemo();
  const [activeCategory, setActiveCategory] = useState<'all' | 'purchases' | 'equipment' | 'resources'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState<ResourceRequest | null>(null);

  // Executive items with amounts
  const executiveCapexItems = (state.items.executive_viewer ?? []).filter(
    (i) => i.amount && i.amount > 0,
  );

  // Department resource requests
  const resourceRequests = state.resourceRequests ?? [];

  // Metrics
  const totalApprovedMTD = 141000;
  const pendingCapexTotal = executiveCapexItems
    .filter((i) => i.status === 'Needs approval')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remainingHeadroom = Math.max(0, 200000 - totalApprovedMTD);

  // Requisitions list combining executive capex and department requisitions
  const filteredResourceRequests = useMemo(() => {
    return resourceRequests.filter((r) => {
      if (activeCategory === 'purchases' && r.category !== 'Equipment' && r.category !== 'Supply') return false;
      if (activeCategory === 'equipment' && r.category !== 'Equipment' && r.category !== 'Maintenance') return false;
      if (activeCategory === 'resources' && r.category !== 'Staffing' && r.category !== 'Supply') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resourceRequests, activeCategory, searchQuery]);

  const handleReviewResource = (reqId: string, action: 'approve' | 'reject') => {
    if (permissionMode === 'viewer') return;
    reviewResourceRequest(
      reqId,
      action,
      action === 'approve'
        ? 'Authorized by Executive General Manager Alex Morgan (High-limit sign-off)'
        : 'Declined by Executive General Manager',
    );
    setSelectedReq(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              Capital Expenditures & Resource Authorizations
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
              Authority: ₹2,00,000
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Oversight and high-limit decision center for heavy equipment, inventory stockouts, and peak staffing contracts.
          </p>
        </div>

        {/* Financial Delegation Summary Card */}
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08]">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">
              Remaining Monthly Headroom
            </div>
            <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-300">
              ₹{remainingHeadroom.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="h-8 w-px bg-amber-500/20" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">
              Pending Requisitions
            </div>
            <div className="text-lg font-black font-mono text-navy-950 dark:text-white">
              ₹{pendingCapexTotal.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Capex Highlight Banner (Major requisitions) */}
      <div className="p-5 rounded-3xl border border-purple-500/30 bg-purple-500/[0.06] backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-purple-500/20 text-purple-400 grid place-items-center">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950 dark:text-white">
                Executive Major Requisitions Queue (&gt; ₹16,000 Duty Manager Threshold)
              </h3>
              <p className="text-xs text-slate-500 dark:text-mist-400">
                These requests exceed standard operating limits and require Executive sign-off.
              </p>
            </div>
          </div>
        </div>

        {/* Grid of Capex Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {executiveCapexItems.map((item) => {
            const isPending = item.status === 'Needs approval';
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-white/10 bg-white/70 dark:bg-ink-950/70 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-mist-300">
                      {item.ref || item.id}
                    </span>
                    <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                      ₹{item.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-navy-950 dark:text-white mt-2">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-0.5 line-clamp-2">
                    {item.description || item.meta}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Approved'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : item.status === 'Rejected'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    }`}
                  >
                    {item.chip || item.status}
                  </span>

                  {isPending && onReviewItem && (
                    <button
                      type="button"
                      onClick={() => onReviewItem(item)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Authorize &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Tabs & Requisitions Table */}
      <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'purchases', label: 'Purchases & Capex' },
              { id: 'equipment', label: 'Equipment & Spares' },
              { id: 'resources', label: 'Staffing & Supplies' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeCategory === tab.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requisitions..."
              className="w-full pl-9 pr-3 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* Requisitions List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Title & Request Details</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
              {filteredResourceRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 font-semibold text-[11px] text-slate-700 dark:text-mist-300">
                      {req.category}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-bold text-navy-950 dark:text-white">{req.title}</div>
                    <div className="text-[11px] text-slate-400 dark:text-mist-400 mt-0.5 line-clamp-1">
                      {req.details}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600 dark:text-mist-300">
                    {req.department}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-mist-400">
                    {req.requestedBy}
                    <div className="text-[10px] text-slate-400 dark:text-mist-500">{req.requestedAt}</div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.urgency === 'critical'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                          : req.urgency === 'high'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedReq(req)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition"
                      >
                        Inspect
                      </button>

                      {req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={permissionMode === 'viewer'}
                            onClick={() => handleReviewResource(req.id, 'approve')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                              permissionMode === 'viewer'
                                ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={permissionMode === 'viewer'}
                            onClick={() => handleReviewResource(req.id, 'reject')}
                            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition ${
                              permissionMode === 'viewer'
                                ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25'
                            }`}
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Requisition Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-950 dark:text-white">
                    {selectedReq.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-mist-400 font-mono">
                    Category: {selectedReq.category} · {selectedReq.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950/70 text-xs leading-relaxed space-y-2">
              <div>
                <strong className="text-navy-950 dark:text-white block">Submitted Details:</strong>
                <p className="text-slate-600 dark:text-mist-300 mt-0.5">{selectedReq.details}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-400 dark:text-mist-500">
                Requested by: {selectedReq.requestedBy} at {selectedReq.requestedAt}
              </div>
            </div>

            {selectedReq.reviewNotes && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                <strong>Review Decision:</strong> {selectedReq.reviewNotes}
                <div className="text-[11px] opacity-80 mt-0.5">By {selectedReq.reviewedBy} at {selectedReq.reviewedAt}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300"
              >
                Close
              </button>
              {selectedReq.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={permissionMode === 'viewer'}
                    onClick={() => handleReviewResource(selectedReq.id, 'reject')}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                      permissionMode === 'viewer'
                        ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={permissionMode === 'viewer'}
                    onClick={() => handleReviewResource(selectedReq.id, 'approve')}
                    className={`px-5 py-2 rounded-2xl text-xs font-bold text-white transition ${
                      permissionMode === 'viewer'
                        ? 'bg-slate-300 opacity-60 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-md'
                    }`}
                  >
                    Authorize Requisition
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
