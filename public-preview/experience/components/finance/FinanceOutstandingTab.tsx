'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Search,
  Filter,
  Banknote,
  Clock,
  Eye,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  TrendingDown,
  ShieldAlert,
  User,
  Building2
} from 'lucide-react';
import type { FinanceInvoice, InvoiceStatus } from '@/types/demo';

interface FinanceOutstandingTabProps {
  invoices: FinanceInvoice[];
  onViewInvoice: (invoice: FinanceInvoice) => void;
  onRecordPayment: (invoice: FinanceInvoice) => void;
}

export function FinanceOutstandingTab({
  invoices,
  onViewInvoice,
  onRecordPayment
}: FinanceOutstandingTabProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'Overdue' | 'Partially Paid' | 'Unpaid'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Only invoices with an outstanding balance > 0
  const outstandingInvoices = useMemo(() => {
    return invoices.filter(inv => inv.outstandingBalance > 0);
  }, [invoices]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalOutstanding = outstandingInvoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);
    const overdueTotal = outstandingInvoices
      .filter(inv => inv.status === 'Overdue')
      .reduce((acc, inv) => acc + inv.outstandingBalance, 0);
    const partialTotal = outstandingInvoices
      .filter(inv => inv.status === 'Partially Paid')
      .reduce((acc, inv) => acc + inv.outstandingBalance, 0);
    const unpaidTotal = outstandingInvoices
      .filter(inv => inv.status === 'Unpaid')
      .reduce((acc, inv) => acc + inv.outstandingBalance, 0);

    return {
      totalOutstanding,
      overdueTotal,
      overdueCount: outstandingInvoices.filter(inv => inv.status === 'Overdue').length,
      partialTotal,
      partialCount: outstandingInvoices.filter(inv => inv.status === 'Partially Paid').length,
      unpaidTotal,
      unpaidCount: outstandingInvoices.filter(inv => inv.status === 'Unpaid').length,
      totalCount: outstandingInvoices.length
    };
  }, [outstandingInvoices]);

  // Filtered list
  const filteredList = useMemo(() => {
    return outstandingInvoices.filter(inv => {
      if (filterType !== 'ALL' && inv.status !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          inv.id.toLowerCase().includes(q) ||
          inv.guestName.toLowerCase().includes(q) ||
          inv.roomNumber.toLowerCase().includes(q) ||
          inv.bookingId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [outstandingInvoices, filterType, searchQuery]);

  const getAgingBadge = (dueDate: string, status: InvoiceStatus) => {
    const today = '2026-10-23';
    if (status === 'Overdue' || dueDate < today) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
          <Clock className="h-3 w-3" /> Overdue (Past Due)
        </span>
      );
    }
    if (dueDate === today) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
          <Clock className="h-3 w-3" /> Due Today
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-mist-400">
        <Calendar className="h-3 w-3" /> Due: {dueDate}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          Outstanding Guest Balances
        </h2>
        <p className="text-xs text-mist-400">
          Monitor unpaid and partially settled folios, track overdue aging, and record instant simulated settlements.
        </p>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-mist-400">Total Uncollected</p>
          <h3 className="text-2xl font-black text-amber-400 mt-1">₹{metrics.totalOutstanding.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{metrics.totalCount} active guest folios</p>
        </div>

        <div className="p-4 rounded-xl bg-ink-900 border border-rose-500/30 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-400 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Overdue Balances
          </p>
          <h3 className="text-2xl font-black text-rose-400 mt-1">₹{metrics.overdueTotal.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{metrics.overdueCount} accounts past due date</p>
        </div>

        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-mist-400">Partially Paid</p>
          <h3 className="text-2xl font-black text-white mt-1">₹{metrics.partialTotal.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{metrics.partialCount} folios with deposits paid</p>
        </div>

        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-mist-400">Full Pending</p>
          <h3 className="text-2xl font-black text-white mt-1">₹{metrics.unpaidTotal.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{metrics.unpaidCount} folios with zero payments</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-ink-900 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
          <input
            type="text"
            placeholder="Search by invoice ID, guest name, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'Overdue', 'Partially Paid', 'Unpaid'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-ink-950 hover:bg-ink-800 text-mist-400 hover:text-white border border-white/5'
              }`}
            >
              {type === 'ALL' ? `All Outstanding (${outstandingInvoices.length})` : `${type}`}
            </button>
          ))}
        </div>

      </div>

      {/* Outstanding Invoices Ledger */}
      <div className="bg-ink-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No outstanding balances</h4>
            <p className="text-xs text-mist-400 mt-1">
              All guest folios matching this filter have been fully settled or cleared.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Guest Details</th>
                  <th className="py-3 px-4">Room & Stay</th>
                  <th className="py-3 px-4 text-right">Total Charges</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Outstanding Amount</th>
                  <th className="py-3 px-4">Due Date & Aging</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {inv.id}
                      <div className="text-[10px] text-mist-500 font-sans">{inv.createdAt}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <User className="h-3 w-3 text-mist-400" />
                        {inv.guestName}
                      </div>
                      <div className="text-[10px] text-mist-400 font-mono">{inv.bookingId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">Room {inv.roomNumber}</div>
                      <div className="text-[10px] text-mist-500">
                        {inv.checkInDate} → {inv.checkOutDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-mist-300">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-400">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-400 text-sm">
                      ₹{inv.outstandingBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {getAgingBadge(inv.dueDate, inv.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.status === 'Overdue'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title="View Folio Details"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-white/10 text-mist-300 hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onRecordPayment(inv)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-ink-950 font-bold text-xs shadow-sm transition-all hover:scale-105"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                          Record Payment
                        </button>
                      </div>
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
