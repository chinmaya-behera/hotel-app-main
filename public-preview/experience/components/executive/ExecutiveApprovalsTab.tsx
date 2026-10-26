'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  HelpCircle,
  History,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  Tag,
  User,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, Tone } from '@/types/demo';

interface ExecutiveApprovalsTabProps {
  permissionMode: 'viewer' | 'approver';
  initialStatusFilter?: string;
  selectedItemFromParent?: WorkItem | null;
  onClearSelectedItem?: () => void;
}

export function ExecutiveApprovalsTab({
  permissionMode,
  initialStatusFilter,
  selectedItemFromParent,
  onClearSelectedItem,
}: ExecutiveApprovalsTabProps) {
  const { state, reviewExecutiveItem, addExecutiveComment } = useDemo();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Selected item for drawer/modal
  const [activeItem, setActiveItem] = useState<WorkItem | null>(selectedItemFromParent || null);
  const [commentText, setCommentText] = useState('');

  // Modals for actions
  const [confirmApproveModal, setConfirmApproveModal] = useState<WorkItem | null>(null);
  const [confirmRejectModal, setConfirmRejectModal] = useState<WorkItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('Budget Constraints');
  const [requestInfoModal, setRequestInfoModal] = useState<WorkItem | null>(null);
  const [infoQuestions, setInfoQuestions] = useState('');

  // Items from store
  const items = state.items.executive_viewer ?? [];

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Status filter
        if (statusFilter === 'pending' && item.status !== 'Needs approval') return false;
        if (statusFilter === 'approved' && item.status !== 'Approved') return false;
        if (statusFilter === 'rejected' && item.status !== 'Rejected') return false;
        if (statusFilter === 'info' && item.status !== 'Info Requested') return false;

        // Department filter
        if (deptFilter !== 'all') {
          const itemDept = item.department || (item.meta?.includes('Front Office') ? 'Front Office' : item.meta?.includes('Engineering') ? 'Maintenance & Engineering' : '');
          if (!itemDept.toLowerCase().includes(deptFilter.toLowerCase())) return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchRef = (item.ref || item.id).toLowerCase().includes(q);
          const matchMeta = (item.meta || '').toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchRef && !matchMeta && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') {
          const valA = a.amount || 0;
          const valB = b.amount || 0;
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
        if (sortBy === 'priority') {
          const pOrder = { critical: 4, vip: 3, urgent: 2, normal: 1 };
          const pA = pOrder[a.priority as keyof typeof pOrder] || 0;
          const pB = pOrder[b.priority as keyof typeof pOrder] || 0;
          return sortOrder === 'desc' ? pB - pA : pA - pB;
        }
        // Default: date (or ID order)
        return sortOrder === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
      });
  }, [items, statusFilter, deptFilter, categoryFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  // Sync selected item with updated store item
  const currentItem = activeItem ? items.find((i) => i.id === activeItem.id) || activeItem : null;

  // Handlers
  const handleApprove = (item: WorkItem) => {
    if (permissionMode === 'viewer') return;
    reviewExecutiveItem(item.id, 'approve', 'Authorized by Executive General Manager Alex Morgan');
    setConfirmApproveModal(null);
  };

  const handleReject = () => {
    if (permissionMode === 'viewer' || !confirmRejectModal) return;
    if (!rejectionReason.trim()) return;
    reviewExecutiveItem(
      confirmRejectModal.id,
      'reject',
      `[${rejectionCategory}] ${rejectionReason}`,
    );
    setConfirmRejectModal(null);
    setRejectionReason('');
  };

  const handleRequestInfo = () => {
    if (permissionMode === 'viewer' || !requestInfoModal) return;
    if (!infoQuestions.trim()) return;
    reviewExecutiveItem(
      requestInfoModal.id,
      'info_requested',
      `Executive Query: ${infoQuestions}`,
    );
    setRequestInfoModal(null);
    setInfoQuestions('');
  };

  const handleAddComment = () => {
    if (!currentItem || !commentText.trim()) return;
    addExecutiveComment(currentItem.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <Stamp className="h-5 w-5 text-amber-500" />
              Executive Approval Center
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
              {filteredItems.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Sole authority for capex overhauls, high-limit service recoveries, and property policy waivers up to ₹2,00,000.
          </p>
        </div>

        {/* Viewer vs Approver Warning Banner */}
        {permissionMode === 'viewer' ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs">
            <Lock className="h-4 w-4 shrink-0 text-sky-400" />
            <span>
              <strong>Viewer Mode Active:</strong> Approvals are in read-only audit mode. Switch mode above to authorize requests.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Executive Approver Active:</strong> Authorized up to ₹2,00,000 delegation limit.
            </span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, department, or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">Status: All Records</option>
              <option value="pending">Needs Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="info">Info Requested</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">Department: All Departments</option>
              <option value="Maintenance">Maintenance & Engineering</option>
              <option value="Front Office">Front Office</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Spa">Spa & Wellness</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2 flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="date">Sort: Date</option>
              <option value="amount">Sort: Amount (₹)</option>
              <option value="priority">Sort: Priority</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white transition"
              title={`Sorting ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick status tabs pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Needs Approval', count: items.filter((i) => i.status === 'Needs approval').length },
            { id: 'approved', label: 'Authorized', count: items.filter((i) => i.status === 'Approved').length },
            { id: 'rejected', label: 'Declined', count: items.filter((i) => i.status === 'Rejected').length },
            { id: 'info', label: 'Clarification Needed', count: items.filter((i) => i.status === 'Info Requested').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-mist-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-white/30 text-white' : 'bg-black/10 dark:bg-white/10'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                <th className="px-4 py-3.5">Ref / ID</th>
                <th className="px-4 py-3.5">Requisition Title</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-mist-500">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-mist-600" />
                    <p className="font-semibold text-sm text-navy-950 dark:text-white">No requisitions matched your criteria</p>
                    <p className="text-xs mt-1">Try clearing filters or search parameters.</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isPending = item.status === 'Needs approval';
                  const isApproved = item.status === 'Approved';
                  const isRejected = item.status === 'Rejected';
                  const isInfo = item.status === 'Info Requested';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition group"
                    >
                      {/* Ref */}
                      <td className="px-4 py-3 font-mono font-bold text-navy-950 dark:text-white whitespace-nowrap">
                        {item.ref || item.id}
                      </td>

                      {/* Title & Category Chip */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-navy-950 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-mist-400 mt-0.5 line-clamp-1">
                          {item.meta}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-[11px] font-medium text-slate-600 dark:text-mist-300">
                          {item.department || (item.category === 'maintenance' ? 'Engineering' : 'Front Office')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                        {item.amount ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-mist-500">N/A (Policy)</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            item.priority === 'critical'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                              : item.priority === 'vip'
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                          }`}
                        >
                          {item.priority || 'Normal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                              : isInfo
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="h-3 w-3" />}
                          {isRejected && <XCircle className="h-3 w-3" />}
                          {isInfo && <HelpCircle className="h-3 w-3" />}
                          {item.chip || item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveItem(item)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-ink-950/50 hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-mist-200 text-xs font-semibold transition flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={permissionMode === 'viewer'}
                                onClick={() => setConfirmApproveModal(item)}
                                title={permissionMode === 'viewer' ? 'Disabled in Viewer Mode' : 'Approve Requisition'}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                  permissionMode === 'viewer'
                                    ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-mist-500 cursor-not-allowed opacity-60'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                                }`}
                              >
                                {permissionMode === 'viewer' && <Lock className="h-3 w-3" />}
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                disabled={permissionMode === 'viewer'}
                                onClick={() => setConfirmRejectModal(item)}
                                title={permissionMode === 'viewer' ? 'Disabled in Viewer Mode' : 'Decline Requisition'}
                                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition ${
                                  permissionMode === 'viewer'
                                    ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-mist-500 cursor-not-allowed opacity-60'
                                    : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] text-xs text-slate-500 dark:text-mist-400">
          <div>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono font-bold text-navy-950 dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer Modal */}
      {currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-ink-950/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-300 grid place-items-center font-bold font-mono">
                  EX
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {currentItem.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 font-bold">
                      {currentItem.ref || currentItem.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400">
                    {currentItem.meta}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveItem(null);
                  if (onClearSelectedItem) onClearSelectedItem();
                }}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-mist-500 block">
                    Financial Impact
                  </span>
                  <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    {currentItem.amount ? `₹${currentItem.amount.toLocaleString('en-IN')}` : 'Policy Exception (₹0)'}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-mist-500">
                    Limit: ₹2,00,000 · Manager ceiling: ₹16,000
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-mist-500 block">
                    Current Status
                  </span>
                  <div className="text-sm font-bold text-navy-950 dark:text-white mt-0.5">
                    {currentItem.status}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-mist-500">
                    Chip: {currentItem.chip || 'Standard'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-mist-500 block">
                    Department & Priority
                  </span>
                  <div className="text-sm font-bold text-navy-950 dark:text-white mt-0.5">
                    {currentItem.department || 'Property-wide'}
                  </div>
                  <span className="text-[11px] text-purple-500 font-semibold uppercase">
                    Priority: {currentItem.priority || 'Normal'}
                  </span>
                </div>
              </div>

              {/* Justification & Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                  Business Justification & Operational Context
                </h4>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-ink-950/60 text-xs leading-relaxed text-slate-700 dark:text-mist-200">
                  {currentItem.description ||
                    'Comprehensive proposal submitted for executive review. Escalated due to delegated financial limit threshold (Duty Manager cap: ₹16,000). Action ensures business continuity and aligns with luxury brand standards.'}
                </div>
              </div>

              {/* Safe Local Mock Attachments */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Verified Proposal Attachments (Mock Previews)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="text-xs font-bold text-navy-950 dark:text-white">
                          OEM-Proposal-Signed.pdf
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-mist-500">
                          1.4 MB · Digital Quote & Scope
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                      Valid
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck2 className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-xs font-bold text-navy-950 dark:text-white">
                          Incident-Report-Photos.pdf
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-mist-500">
                          3.8 MB · Technical Diagnostics
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission & Approval Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Submission & Decision Timeline
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 dark:border-white/10 pl-4 ml-2">
                  {(currentItem.history ?? [
                    { at: 'Today 09:15', status: 'Submitted', note: 'Escalated by Duty Operations' },
                  ]).map((h, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 dark:text-mist-500">
                        <span>{h.status}</span>
                        <span>{h.at}</span>
                      </div>
                      <div className="text-navy-950 dark:text-mist-200 mt-0.5">
                        {h.note || 'Recorded in executive system.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion Thread & Add Note */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Executive Comments & Clarification Log
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                    placeholder="Add an executive note or policy annotation..."
                    className="flex-1 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-ink-950/50 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-mist-400">
                {permissionMode === 'viewer' ? (
                  <span className="flex items-center gap-1 text-sky-500">
                    <Lock className="h-3.5 w-3.5" /> Read-only Viewer Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Executive Decision Authority Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(null);
                    if (onClearSelectedItem) onClearSelectedItem();
                  }}
                  className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  Close
                </button>

                {currentItem.status === 'Needs approval' && (
                  <>
                    <button
                      type="button"
                      disabled={permissionMode === 'viewer'}
                      onClick={() => setRequestInfoModal(currentItem)}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold border transition ${
                        permissionMode === 'viewer'
                          ? 'border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          : 'border-sky-500/30 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10'
                      }`}
                    >
                      Request Info
                    </button>

                    <button
                      type="button"
                      disabled={permissionMode === 'viewer'}
                      onClick={() => setConfirmRejectModal(currentItem)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition ${
                        permissionMode === 'viewer'
                          ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                      }`}
                    >
                      Decline
                    </button>

                    <button
                      type="button"
                      disabled={permissionMode === 'viewer'}
                      onClick={() => setConfirmApproveModal(currentItem)}
                      className={`px-5 py-2 rounded-2xl text-xs font-bold text-white transition shadow-md ${
                        permissionMode === 'viewer'
                          ? 'bg-slate-300 opacity-60 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    >
                      Authorize Approval
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Approve */}
      {confirmApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-500 grid place-items-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white">
                  Confirm Executive Authorization
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  {confirmApproveModal.ref || confirmApproveModal.id}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
              <div className="font-bold text-navy-950 dark:text-white">
                {confirmApproveModal.title}
              </div>
              <div className="flex justify-between text-slate-600 dark:text-mist-300">
                <span>Authorized Amount:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {confirmApproveModal.amount ? `₹${confirmApproveModal.amount.toLocaleString('en-IN')}` : 'Policy Exception'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-mist-400">
                Decision will be committed immediately to the audit ledger and operational queues will be notified.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmApproveModal(null)}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprove(confirmApproveModal)}
                className="px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md"
              >
                Confirm & Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {confirmRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-500 grid place-items-center">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white">
                  Decline Requisition
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  A documented policy reason is mandatory for all executive declines.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-mist-300 block mb-1">
                  Decline Category
                </label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-navy-950 dark:text-white"
                >
                  <option value="Budget Constraints">Quarterly Capex Budget Cap Reached</option>
                  <option value="Alternative Solution Available">Internal Reserve / Alternative In-House Spare Available</option>
                  <option value="Insufficient Justification">Vendor Quotation Lacks Multiple Bid Comparison</option>
                  <option value="Policy Non-Compliant">Non-Compliant with Corporate Procurement Guidelines</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-mist-300 block mb-1">
                  Executive Justification (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide explicit operational rationale for declining this request..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={handleReject}
                className="px-5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-md"
              >
                Decline Requisition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Information Modal */}
      {requestInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-sky-500/20 text-sky-500 grid place-items-center">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white">
                  Request Clarifying Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Sends this requisition back to submitter with your specific queries.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <textarea
                rows={4}
                value={infoQuestions}
                onChange={(e) => setInfoQuestions(e.target.value)}
                placeholder="E.g., Requesting comparative quotes from two alternate HVAC service providers before approving ₹65,000..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRequestInfoModal(null);
                  setInfoQuestions('');
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!infoQuestions.trim()}
                onClick={handleRequestInfo}
                className="px-5 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-md"
              >
                Send Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
