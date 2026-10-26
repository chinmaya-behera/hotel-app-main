'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Banknote,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import type { FinanceInvoice, InvoiceStatus } from '@/types/demo';

interface FinanceInvoicesTabProps {
  invoices: FinanceInvoice[];
  onOpenCreateInvoice: () => void;
  onViewInvoice: (invoice: FinanceInvoice) => void;
  onRecordPayment: (invoice: FinanceInvoice) => void;
}

export function FinanceInvoicesTab({
  invoices,
  onOpenCreateInvoice,
  onViewInvoice,
  onRecordPayment
}: FinanceInvoicesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'createdAt' | 'totalAmount' | 'outstandingBalance' | 'id'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter & Sort Logic
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            inv.id.toLowerCase().includes(q) ||
            inv.guestName.toLowerCase().includes(q) ||
            inv.roomNumber.toLowerCase().includes(q) ||
            inv.bookingId.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Date filter
        if (dateFilter === 'TODAY') {
          return inv.createdAt.startsWith('2026-10-23') || inv.checkInDate.startsWith('2026-10-23');
        } else if (dateFilter === 'WEEK') {
          return inv.createdAt >= '2026-10-16';
        } else if (dateFilter === 'MONTH') {
          return inv.createdAt.startsWith('2026-10');
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        } else {
          return sortOrder === 'asc'
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        }
      });
  }, [invoices, searchQuery, statusFilter, dateFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Invoice ID',
      'Guest Name',
      'Room Number',
      'Booking ID',
      'Room Charges (INR)',
      'Service Charges (INR)',
      'Taxes (INR)',
      'Discounts (INR)',
      'Total Amount (INR)',
      'Paid Amount (INR)',
      'Outstanding Balance (INR)',
      'Payment Status',
      'Created Date',
      'Due Date'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.id,
      `"${inv.guestName.replace(/"/g, '""')}"`,
      inv.roomNumber,
      inv.bookingId,
      inv.roomCharges,
      inv.serviceCharges,
      inv.taxAmount,
      inv.discountAmount,
      inv.totalAmount,
      inv.paidAmount,
      inv.outstandingBalance,
      inv.status,
      inv.createdAt,
      inv.dueDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotel_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Partially Paid
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AlertCircle className="h-3 w-3" /> Unpaid
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Overdue
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
            <FileText className="h-5 w-5 text-primary-400" />
            Guest Billing & Invoices
          </h2>
          <p className="text-xs text-mist-400">
            Manage guest room folios, tax invoices, additional charges, and payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-mist-200 border border-white/10 text-xs font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={onOpenCreateInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-ink-900 border border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">

          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
            <input
              type="text"
              placeholder="Search by invoice ID, guest name, room, or booking ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {['ALL', 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-ink-950 hover:bg-ink-800 text-mist-400 hover:text-white border border-white/5'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-mist-200 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today (Oct 23)</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
          </select>
        </div>

        {/* Sorting options summary */}
        <div className="flex items-center justify-between text-[11px] text-mist-400 pt-1 border-t border-white/5">
          <span>
            Showing <strong className="text-white">{filteredInvoices.length}</strong> invoices
          </span>
          <div className="flex items-center gap-3">
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortField === 'createdAt') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('createdAt'); setSortOrder('desc'); }
              }}
              className={`hover:text-white transition-colors ${sortField === 'createdAt' ? 'text-primary-400 font-semibold' : ''}`}
            >
              Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'totalAmount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('totalAmount'); setSortOrder('desc'); }
              }}
              className={`hover:text-white transition-colors ${sortField === 'totalAmount' ? 'text-primary-400 font-semibold' : ''}`}
            >
              Amount {sortField === 'totalAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'outstandingBalance') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('outstandingBalance'); setSortOrder('desc'); }
              }}
              className={`hover:text-white transition-colors ${sortField === 'outstandingBalance' ? 'text-primary-400 font-semibold' : ''}`}
            >
              Balance {sortField === 'outstandingBalance' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-ink-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        {paginatedInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="h-10 w-10 text-mist-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No invoices found</h4>
            <p className="text-xs text-mist-400 mt-1 max-w-sm mx-auto">
              No billing records match your current search or filter criteria. Try resetting the filters or generate a new guest invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Guest & Room</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4 text-right">Room Charges</th>
                  <th className="py-3 px-4 text-right">Services & Tax</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {inv.id}
                      <div className="text-[10px] text-mist-500 font-sans">{inv.createdAt}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{inv.guestName}</div>
                      <div className="text-[10px] text-mist-400">Room {inv.roomNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-mist-300">
                      {inv.bookingId}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-mist-200">
                      ₹{inv.roomCharges.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-mist-300">
                      <div>₹{((inv.serviceCharges || 0) + (inv.taxAmount || 0)).toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-mist-500">Tax: ₹{inv.taxAmount.toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-400">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      <span className={inv.outstandingBalance > 0 ? 'text-amber-400' : 'text-mist-500'}>
                        ₹{inv.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title="Preview & Print Invoice"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-white/10 text-mist-300 hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {inv.outstandingBalance > 0 && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                            className="p-1.5 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30 transition-colors"
                          >
                            <Banknote className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
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
