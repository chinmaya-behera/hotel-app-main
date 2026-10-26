'use client';

import { useMemo, useState } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Plus,
  ShieldCheck,
  ChevronRight,
  Banknote,
  Calendar,
  Sparkles
} from 'lucide-react';
import type { FinanceInvoice, FinanceTransaction, FinanceRefundRequest } from '@/types/demo';

interface FinanceOverviewTabProps {
  invoices: FinanceInvoice[];
  transactions: FinanceTransaction[];
  refundRequests: FinanceRefundRequest[];
  onOpenCreateInvoice: () => void;
  onOpenRecordPayment: (invoice?: FinanceInvoice) => void;
  onSelectTransaction: (txn: FinanceTransaction) => void;
  onNavigateTab: (tabId: string) => void;
}

export function FinanceOverviewTab({
  invoices,
  transactions,
  refundRequests,
  onOpenCreateInvoice,
  onOpenRecordPayment,
  onSelectTransaction,
  onNavigateTab
}: FinanceOverviewTabProps) {
  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('7d');

  // KPI Calculations
  const stats = useMemo(() => {
    // 1. Payments Received (All successful transactions)
    const totalPaymentsReceived = transactions
      .filter(t => t.status === 'Successful')
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Today's Revenue (Transactions from today or last 24h)
    const todayTransactions = transactions.filter(t => t.status === 'Successful' && t.date === '2026-10-23');
    const todayRevenue = todayTransactions.length > 0
      ? todayTransactions.reduce((acc, t) => acc + t.amount, 0)
      : 142850; // fallback realistic figure

    // 3. Outstanding Guest Balances (Sum of unpaid + partially paid balances)
    const outstandingBalances = invoices.reduce((acc, inv) => acc + (inv.outstandingBalance || 0), 0);

    // 4. Pending Payments (Transactions awaiting gateway clearance or settlement)
    const pendingTransactions = transactions.filter(t => t.status === 'Pending');
    const pendingAmount = pendingTransactions.reduce((acc, t) => acc + t.amount, 0);

    // 5. Refund Requests (Count & sum of active pending refund disputes)
    const pendingRefunds = refundRequests.filter(r => r.status === 'Pending Review');
    const refundAmount = pendingRefunds.reduce((acc, r) => acc + r.amount, 0);

    // 6. Unreconciled Transactions (Transactions not yet matched with bank batch)
    const unreconciledCount = transactions.filter(t => !t.isReconciled).length;
    const unreconciledAmount = transactions
      .filter(t => !t.isReconciled)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      todayRevenue,
      totalPaymentsReceived,
      outstandingBalances,
      pendingAmount,
      pendingCount: pendingTransactions.length,
      refundAmount,
      refundCount: pendingRefunds.length,
      unreconciledCount,
      unreconciledAmount
    };
  }, [invoices, transactions, refundRequests]);

  // Daily revenue mock trend points
  const revenueTrendData = [
    { day: 'Sat', date: 'Oct 17', amount: 165000, height: 65 },
    { day: 'Sun', date: 'Oct 18', amount: 198000, height: 78 },
    { day: 'Mon', date: 'Oct 19', amount: 142000, height: 56 },
    { day: 'Tue', date: 'Oct 20', amount: 185000, height: 72 },
    { day: 'Wed', date: 'Oct 21', amount: 215000, height: 85 },
    { day: 'Thu', date: 'Oct 22', amount: 178000, height: 70 },
    { day: 'Fri', date: 'Oct 23', amount: stats.todayRevenue, height: 82 },
  ];

  // Recent transactions list
  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 5);
  }, [transactions]);

  // Payment method distribution
  const methodBreakdown = useMemo(() => {
    const total = transactions.reduce((acc, t) => acc + t.amount, 0) || 1;
    const upi = transactions.filter(t => t.paymentMethod === 'UPI').reduce((acc, t) => acc + t.amount, 0);
    const card = transactions.filter(t => t.paymentMethod === 'Credit Card' || t.paymentMethod === 'Debit Card').reduce((acc, t) => acc + t.amount, 0);
    const net = transactions.filter(t => t.paymentMethod === 'Net Banking').reduce((acc, t) => acc + t.amount, 0);
    const cash = transactions.filter(t => t.paymentMethod === 'Cash' || t.paymentMethod === 'Direct Bill').reduce((acc, t) => acc + t.amount, 0);

    return {
      upiPct: Math.round((upi / total) * 100),
      cardPct: Math.round((card / total) * 100),
      netPct: Math.round((net / total) * 100),
      cashPct: Math.max(0, 100 - Math.round((upi / total) * 100) - Math.round((card / total) * 100) - Math.round((net / total) * 100))
    };
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Top Banner / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary-500/20 text-primary-300 border border-primary-500/30">
              Live Financial State
            </span>
            <span className="text-xs text-mist-400">Shift: Day · Clearance Limit: ₹80,000</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Financial Operations Console</h2>
          <p className="text-xs text-mist-400">
            Real-time hotel billing, payment reconciliation, guest folios, and refund authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenCreateInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-900/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
          <button
            onClick={() => onOpenRecordPayment()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-white border border-white/10 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <Banknote className="h-4 w-4 text-lime-400" />
            Record Payment
          </button>
        </div>
      </div>

      {/* 6 Core KPI Cards (Section 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* KPI 1: Today's Revenue */}
        <div className="p-4 rounded-xl bg-ink-900/90 border border-white/10 shadow-sm relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-mist-400">Today&apos;s Revenue</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{stats.todayRevenue.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="flex items-center text-emerald-400 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" /> +14.2%
            </span>
            <span className="text-mist-500">vs yesterday (₹1,25,000)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent" />
        </div>

        {/* KPI 2: Payments Received */}
        <div className="p-4 rounded-xl bg-ink-900/90 border border-white/10 shadow-sm relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-mist-400">Payments Received</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{stats.totalPaymentsReceived.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="text-mist-400">Settled via UPI, Card, Net Banking & POS</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
        </div>

        {/* KPI 3: Outstanding Guest Balances */}
        <div
          onClick={() => onNavigateTab('outstanding')}
          className="p-4 rounded-xl bg-ink-900/90 border border-white/10 shadow-sm relative overflow-hidden group hover:border-amber-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-400/90">Outstanding Balances</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">₹{stats.outstandingBalances.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-mist-400">Unsettled post-checkout or in-house</span>
            <span className="text-amber-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
              View Invoices <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-transparent" />
        </div>

        {/* KPI 4: Pending Payments */}
        <div
          onClick={() => onNavigateTab('transactions')}
          className="p-4 rounded-xl bg-ink-900/90 border border-white/10 shadow-sm relative overflow-hidden group hover:border-blue-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-mist-400">Pending Payments</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{stats.pendingAmount.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-mist-400">{stats.pendingCount} transactions awaiting gateway settlement</span>
            <span className="text-primary-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
              Manage <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-transparent" />
        </div>

        {/* KPI 5: Refund Requests */}
        <div
          onClick={() => onNavigateTab('refunds')}
          className="p-4 rounded-xl bg-ink-900/90 border border-white/10 shadow-sm relative overflow-hidden group hover:border-purple-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-purple-400/90">Refund Requests</p>
              <h3 className="text-2xl font-black text-purple-400 mt-1">₹{stats.refundAmount.toLocaleString('en-IN')}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-mist-400">{stats.refundCount} pending operator clearance</span>
            <span className="text-purple-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
              Review Queue <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
        </div>

        {/* KPI 6: Unreconciled Transactions */}
        <div
          onClick={() => onNavigateTab('transactions')}
          className="p-4 rounded-xl bg-ink-900/90 border border-white/10 shadow-sm relative overflow-hidden group hover:border-rose-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-rose-400/90">Unreconciled Batches</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{stats.unreconciledCount} Entries</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-mist-400">Total volume: ₹{stats.unreconciledAmount.toLocaleString('en-IN')}</span>
            <span className="text-rose-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
              Reconcile <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-transparent" />
        </div>

      </div>

      {/* Grid: 7-Day Revenue Trend Chart & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Trend Chart (2 columns on large screens) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Daily Revenue Trend</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  +18.4% Week-over-Week
                </span>
              </div>
              <p className="text-xs text-mist-400 mt-0.5">Aggregated hotel folio receipts across rooms & F&B services</p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-ink-950 border border-white/10 text-xs">
              <button
                onClick={() => setTrendRange('7d')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  trendRange === '7d' ? 'bg-primary-600 text-white' : 'text-mist-400 hover:text-white'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTrendRange('30d')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  trendRange === '30d' ? 'bg-primary-600 text-white' : 'text-mist-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Simple Clean SVG / Bar Chart Representation */}
          <div className="h-52 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-white/10">
            {revenueTrendData.map((item, idx) => {
              const isToday = idx === revenueTrendData.length - 1;
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-ink-950 border border-white/20 rounded px-1.5 py-0.5 text-white font-mono shadow-md whitespace-nowrap mb-1">
                    ₹{(item.amount / 1000).toFixed(1)}k
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-ink-800 rounded-t-lg relative overflow-hidden h-full flex items-end">
                    <div
                      style={{ height: `${item.height}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-primary-600 to-primary-400'
                          : 'bg-gradient-to-t from-sky-600/70 to-teal-400/80 group-hover:from-sky-500 group-hover:to-teal-300'
                      }`}
                    />
                  </div>

                  {/* Labels */}
                  <div className="text-center pt-1">
                    <p className={`text-xs font-semibold ${isToday ? 'text-primary-400' : 'text-mist-300'}`}>
                      {item.day}
                    </p>
                    <p className="text-[10px] text-mist-500">{item.date}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 text-[11px] text-mist-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-500" /> Current Day Settlement
              <span className="h-2 w-2 rounded-full bg-teal-400 ml-2" /> Past Days Audited
            </span>
            <span>Average: ₹1,75,000 / day</span>
          </div>
        </div>

        {/* Payment Channels & Gateways */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Payment Methods</h3>
              <span className="text-[10px] text-mist-400">Settled Volume</span>
            </div>

            {/* Proportion Bar */}
            <div className="h-3 w-full rounded-full bg-ink-950 overflow-hidden flex mb-5 border border-white/10">
              <div style={{ width: `${methodBreakdown.upiPct}%` }} className="bg-emerald-500" title="UPI" />
              <div style={{ width: `${methodBreakdown.cardPct}%` }} className="bg-blue-500" title="Cards" />
              <div style={{ width: `${methodBreakdown.netPct}%` }} className="bg-purple-500" title="Net Banking" />
              <div style={{ width: `${methodBreakdown.cashPct}%` }} className="bg-amber-500" title="Cash & Direct" />
            </div>

            {/* Method Breakdown List */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-white font-medium">UPI / QR Code</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{methodBreakdown.upiPct}%</span>
                  <p className="text-[10px] text-mist-500">PhonePe, GooglePay, Paytm</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-white font-medium">Credit / Debit Cards</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{methodBreakdown.cardPct}%</span>
                  <p className="text-[10px] text-mist-500">Visa, MasterCard, Amex POS</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-white font-medium">Net Banking</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{methodBreakdown.netPct}%</span>
                  <p className="text-[10px] text-mist-500">HDFC, ICICI, SBI Corporate</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-white font-medium">Cash / Direct Bill</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{methodBreakdown.cashPct}%</span>
                  <p className="text-[10px] text-mist-500">Front Desk Counter</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-mist-400">Gateway Health:</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Razorpay & PineLabs Online
            </span>
          </div>
        </div>

      </div>

      {/* Recent Transactions List (Section 1 requirement) */}
      <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-mist-400">Latest financial receipts, gateway clearances, and refunds</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
          >
            View All Ledger Entries <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table on medium/large screens */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="pb-3 pl-2">Transaction ID</th>
                <th className="pb-3">Guest / Booking</th>
                <th className="pb-3">Payment Method</th>
                <th className="pb-3">Date & Time</th>
                <th className="pb-3">Amount (INR)</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentTransactions.map((txn) => {
                const getStatusPill = (status: string) => {
                  switch (status) {
                    case 'Successful':
                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Successful</span>;
                    case 'Pending':
                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
                    case 'Failed':
                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Failed</span>;
                    case 'Refunded':
                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Refunded</span>;
                    default:
                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-mist-300">{status}</span>;
                  }
                };

                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 pl-2 font-mono font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {txn.id}
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-white">{txn.guestName}</div>
                      <div className="text-[10px] text-mist-500">Room {txn.roomNumber} · {txn.bookingRef}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-white">{txn.paymentMethod}</div>
                      <div className="text-[10px] text-mist-500">{txn.gateway}</div>
                    </td>
                    <td className="py-3 text-mist-400">
                      <div>{txn.date}</div>
                      <div className="text-[10px] text-mist-500">{txn.time}</div>
                    </td>
                    <td className="py-3 font-semibold text-white">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      {getStatusPill(txn.status)}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <span className="text-xs text-mist-400 group-hover:text-white font-medium transition-colors">
                        Inspect
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
