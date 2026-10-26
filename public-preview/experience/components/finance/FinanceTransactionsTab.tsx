'use client';

import { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Eye,
  ShieldCheck,
  RefreshCw,
  ArrowUpDown,
  Tag,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import type { FinanceTransaction, TransactionStatus, PaymentMethod } from '@/types/demo';

interface FinanceTransactionsTabProps {
  transactions: FinanceTransaction[];
  onSelectTransaction: (txn: FinanceTransaction) => void;
  onUpdateStatus: (txnId: string, status: TransactionStatus, notes?: string) => void;
  onReconcile: (txnId: string) => void;
}

export function FinanceTransactionsTab({
  transactions,
  onSelectTransaction,
  onUpdateStatus,
  onReconcile
}: FinanceTransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [reconciledFilter, setReconciledFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'id'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter & Sort
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((txn) => {
        // Status filter
        if (statusFilter !== 'ALL' && txn.status !== statusFilter) return false;

        // Method filter
        if (methodFilter !== 'ALL' && txn.paymentMethod !== methodFilter) return false;

        // Reconciled filter
        if (reconciledFilter === 'RECONCILED' && !txn.isReconciled) return false;
        if (reconciledFilter === 'UNRECONCILED' && txn.isReconciled) return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            txn.id.toLowerCase().includes(q) ||
            txn.guestName.toLowerCase().includes(q) ||
            txn.bookingRef.toLowerCase().includes(q) ||
            txn.referenceNumber.toLowerCase().includes(q) ||
            txn.gateway.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const dateA = `${a.date} ${a.time}`;
          const dateB = `${b.date} ${b.time}`;
          return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
        } else if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        } else {
          return sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
        }
      });
  }, [transactions, searchQuery, statusFilter, methodFilter, reconciledFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Metrics
  const summary = useMemo(() => {
    const successfulTotal = transactions
      .filter(t => t.status === 'Successful')
      .reduce((acc, t) => acc + t.amount, 0);
    const pendingCount = transactions.filter(t => t.status === 'Pending').length;
    const failedCount = transactions.filter(t => t.status === 'Failed').length;
    const unreconciledCount = transactions.filter(t => !t.isReconciled).length;

    return { successfulTotal, pendingCount, failedCount, unreconciledCount };
  }, [transactions]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Guest Name',
      'Booking Ref',
      'Room Number',
      'Amount (INR)',
      'Payment Method',
      'Gateway',
      'Reference Number',
      'Date',
      'Time',
      'Status',
      'Reconciled'
    ];

    const rows = filteredTransactions.map(t => [
      t.id,
      `"${t.guestName.replace(/"/g, '""')}"`,
      t.bookingRef,
      t.roomNumber,
      t.amount,
      t.paymentMethod,
      t.gateway,
      t.referenceNumber,
      t.date,
      t.time,
      t.status,
      t.isReconciled ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotel_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'Successful':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Successful
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Failed
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RotateCcw className="h-3 w-3" /> Refunded
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-400" />
            Payments & Transactions
          </h2>
          <p className="text-xs text-mist-400">
            Complete transaction ledger across UPI, Cards, Net Banking, and Front Desk POS.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-mist-200 border border-white/10 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export Ledger CSV
        </button>
      </div>

      {/* Metric Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-ink-900 border border-white/10">
          <p className="text-[10px] text-mist-400 uppercase font-semibold">Settled Volume</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">₹{summary.successfulTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-ink-900 border border-white/10">
          <p className="text-[10px] text-mist-400 uppercase font-semibold">Pending Gateway</p>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{summary.pendingCount} Trans.</p>
        </div>
        <div className="p-3 rounded-xl bg-ink-900 border border-white/10">
          <p className="text-[10px] text-mist-400 uppercase font-semibold">Failed Payments</p>
          <p className="text-lg font-bold text-rose-400 mt-0.5">{summary.failedCount} Declined</p>
        </div>
        <div className="p-3 rounded-xl bg-ink-900 border border-white/10">
          <p className="text-[10px] text-mist-400 uppercase font-semibold">Unreconciled Batches</p>
          <p className="text-lg font-bold text-sky-400 mt-0.5">{summary.unreconciledCount} Entries</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-ink-900 border border-white/10 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
            <input
              type="text"
              placeholder="Search by ID, guest, reference number, or gateway..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-mist-200 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Cash">Cash</option>
            <option value="Direct Bill">Direct Bill</option>
          </select>

          {/* Reconciliation Filter */}
          <select
            value={reconciledFilter}
            onChange={(e) => {
              setReconciledFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-mist-200 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="ALL">All Reconciliation</option>
            <option value="RECONCILED">Reconciled Only</option>
            <option value="UNRECONCILED">Unreconciled Only</option>
          </select>

        </div>

        {/* Status Filter buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {['ALL', 'Successful', 'Pending', 'Failed', 'Refunded'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-ink-950 hover:bg-ink-800 text-mist-400 hover:text-white border border-white/5'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-mist-400">
            <span>Sort:</span>
            <button
              onClick={() => {
                if (sortField === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('date'); setSortOrder('desc'); }
              }}
              className={`hover:text-white transition-colors ${sortField === 'date' ? 'text-primary-400 font-semibold' : ''}`}
            >
              Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('amount'); setSortOrder('desc'); }
              }}
              className={`hover:text-white transition-colors ${sortField === 'amount' ? 'text-primary-400 font-semibold' : ''}`}
            >
              Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-ink-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        {paginatedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="h-10 w-10 text-mist-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No transactions found</h4>
            <p className="text-xs text-mist-400 mt-1">
              No records match your selected search terms or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Guest / Reference</th>
                  <th className="py-3 px-4">Method & Gateway</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reconciled</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {txn.id}
                      <div className="text-[10px] text-mist-500 font-sans">Ref: {txn.referenceNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{txn.guestName}</div>
                      <div className="text-[10px] text-mist-400">
                        Room {txn.roomNumber} · {txn.bookingRef}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{txn.paymentMethod}</div>
                      <div className="text-[10px] text-mist-400">{txn.gateway}</div>
                    </td>
                    <td className="py-3.5 px-4 text-mist-300">
                      <div>{txn.date}</div>
                      <div className="text-[10px] text-mist-500">{txn.time}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(txn.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onReconcile(txn.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          txn.isReconciled
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {txn.isReconciled ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {txn.isReconciled ? 'Reconciled' : 'Unreconciled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectTransaction(txn)}
                        className="px-3 py-1.5 rounded-lg bg-ink-800 hover:bg-white/10 text-mist-200 hover:text-white text-xs font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-ink-950/60 text-xs">
            <span className="text-mist-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-ink-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-700 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-ink-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
