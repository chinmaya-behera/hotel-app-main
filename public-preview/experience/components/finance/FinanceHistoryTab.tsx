'use client';

import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  FileSpreadsheet,
  Eye,
  ShieldCheck
} from 'lucide-react';
import type { FinanceTransaction } from '@/types/demo';

interface FinanceHistoryTabProps {
  transactions: FinanceTransaction[];
  onSelectTransaction: (txn: FinanceTransaction) => void;
}

export function FinanceHistoryTab({
  transactions,
  onSelectTransaction
}: FinanceHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredHistory = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (methodFilter !== 'ALL' && t.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.guestName.toLowerCase().includes(q) ||
          t.referenceNumber.toLowerCase().includes(q) ||
          t.gateway.toLowerCase().includes(q) ||
          (t.invoiceId && t.invoiceId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, searchQuery, methodFilter, statusFilter]);

  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedList = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportHistoryCSV = () => {
    const headers = [
      'Historical ID',
      'Date & Time',
      'Guest Name',
      'Room Number',
      'Booking Ref',
      'Payment Method',
      'Gateway',
      'Reference UTR',
      'Amount (INR)',
      'Status',
      'Reconciliation State'
    ];

    const rows = filteredHistory.map(t => [
      t.id,
      `${t.date} ${t.time}`,
      `"${t.guestName.replace(/"/g, '""')}"`,
      t.roomNumber,
      t.bookingRef,
      t.paymentMethod,
      t.gateway,
      t.referenceNumber,
      t.amount,
      t.status,
      t.isReconciled ? 'Reconciled' : 'Unreconciled'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historical_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-primary-400" />
            Transaction History Archive
          </h2>
          <p className="text-xs text-mist-400">
            Immutable financial audit trail across previous settlement batches, guest checkouts, and terminal records.
          </p>
        </div>

        <button
          onClick={handleExportHistoryCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-mist-200 border border-white/10 text-xs font-semibold transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Historical Ledger (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-ink-900 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
          <input
            type="text"
            placeholder="Search archive by txn ID, guest name, UTR reference, gateway..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-mist-200 focus:outline-none focus:border-primary-500 cursor-pointer"
        >
          <option value="ALL">All Payment Channels</option>
          <option value="UPI">UPI Gateways</option>
          <option value="Credit Card">Credit Cards</option>
          <option value="Debit Card">Debit Cards</option>
          <option value="Net Banking">Net Banking</option>
          <option value="Cash">Cash & Direct</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-mist-200 focus:outline-none focus:border-primary-500 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="Successful">Successful</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-ink-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        {paginatedList.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="h-10 w-10 text-mist-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No historical transactions match</h4>
            <p className="text-xs text-mist-400 mt-1">Adjust search terms or reset filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Ledger ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Guest Reference</th>
                  <th className="py-3 px-4">Channel & Gateway</th>
                  <th className="py-3 px-4">Reference UTR</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedList.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3 px-4 font-mono font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {t.id}
                    </td>
                    <td className="py-3 px-4 text-mist-300">
                      <div>{t.date}</div>
                      <div className="text-[10px] text-mist-500">{t.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{t.guestName}</div>
                      <div className="text-[10px] text-mist-400">Room {t.roomNumber} · {t.bookingRef}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">{t.paymentMethod}</div>
                      <div className="text-[10px] text-mist-500">{t.gateway}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-mist-400 text-[11px]">
                      {t.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-white text-sm">
                      ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.status === 'Successful'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : t.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : t.status === 'Failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectTransaction(t)}
                        className="p-1.5 rounded-lg bg-ink-800 hover:bg-white/10 text-mist-300 hover:text-white transition-colors"
                        title="Inspect Transaction"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-ink-950/60 text-xs">
            <span className="text-mist-400">Page {currentPage} of {totalPages}</span>
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
