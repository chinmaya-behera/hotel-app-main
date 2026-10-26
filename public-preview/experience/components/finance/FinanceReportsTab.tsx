'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  FileText,
  CreditCard,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import type { FinanceInvoice, FinanceTransaction, FinanceRefundRequest } from '@/types/demo';

interface FinanceReportsTabProps {
  invoices: FinanceInvoice[];
  transactions: FinanceTransaction[];
  refundRequests: FinanceRefundRequest[];
}

export function FinanceReportsTab({
  invoices,
  transactions,
  refundRequests
}: FinanceReportsTabProps) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

  // Dynamically compute report data according to period
  const reportData = useMemo(() => {
    // 1. Invoices
    const totalInvoices = invoices.length;
    const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalRoomCharges = invoices.reduce((acc, inv) => acc + inv.roomCharges, 0);
    const totalServices = invoices.reduce((acc, inv) => acc + (inv.serviceCharges || 0), 0);
    const totalTax = invoices.reduce((acc, inv) => acc + (inv.taxAmount || 0), 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);

    // 2. Transactions
    const successfulTxns = transactions.filter(t => t.status === 'Successful');
    const totalCollected = successfulTxns.reduce((acc, t) => acc + t.amount, 0);
    const pendingTxns = transactions.filter(t => t.status === 'Pending');
    const totalPending = pendingTxns.reduce((acc, t) => acc + t.amount, 0);

    // 3. Refunds
    const executedRefunds = refundRequests.filter(r => r.status === 'Executed');
    const totalRefunded = executedRefunds.reduce((acc, r) => acc + r.amount, 0);

    // 4. Net Revenue
    const netRevenue = totalCollected - totalRefunded;

    // 5. Payment method breakdown
    const upiTotal = successfulTxns.filter(t => t.paymentMethod === 'UPI').reduce((acc, t) => acc + t.amount, 0);
    const cardTotal = successfulTxns.filter(t => t.paymentMethod === 'Credit Card' || t.paymentMethod === 'Debit Card').reduce((acc, t) => acc + t.amount, 0);
    const netBankTotal = successfulTxns.filter(t => t.paymentMethod === 'Net Banking').reduce((acc, t) => acc + t.amount, 0);
    const cashTotal = successfulTxns.filter(t => t.paymentMethod === 'Cash' || t.paymentMethod === 'Direct Bill').reduce((acc, t) => acc + t.amount, 0);

    return {
      totalInvoices,
      totalBilled,
      totalRoomCharges,
      totalServices,
      totalTax,
      totalOutstanding,
      totalCollected,
      totalPending,
      pendingCount: pendingTxns.length,
      totalRefunded,
      refundCount: executedRefunds.length,
      netRevenue,
      paymentBreakdown: {
        upi: upiTotal,
        card: cardTotal,
        netBank: netBankTotal,
        cash: cashTotal
      }
    };
  }, [invoices, transactions, refundRequests]);

  // Export CSV of the entire daily closing report
  const handleExportReportCSV = () => {
    const lines = [
      'GRAND HERITAGE PALACE - DAILY FINANCIAL OPERATIONS AUDIT REPORT',
      `Generated On: 2026-10-23 09:00 IST`,
      `Reporting Period: ${period.toUpperCase()}`,
      `Financial Operator: Noah Patel (EMP-0107)`,
      '',
      '=== SECTION 1: EXECUTIVE REVENUE SUMMARY ===',
      'Metric,Amount (INR)',
      `Total Invoices Generated,${reportData.totalInvoices} Invoices`,
      `Gross Billed Volume,${reportData.totalBilled}`,
      `Room Tariff Revenue,${reportData.totalRoomCharges}`,
      `F&B and Guest Services,${reportData.totalServices}`,
      `Hospitality GST (18%),${reportData.totalTax}`,
      `Total Collections Settled,${reportData.totalCollected}`,
      `Uncollected Outstanding Balances,${reportData.totalOutstanding}`,
      `Pending Gateway Clearances,${reportData.totalPending}`,
      `Total Executed Refunds,${reportData.totalRefunded}`,
      `NET REALIZED REVENUE,${reportData.netRevenue}`,
      '',
      '=== SECTION 2: PAYMENT METHOD SETTLEMENTS ===',
      'Payment Method,Volume (INR),Share (%)',
      `UPI / QR Gateways,${reportData.paymentBreakdown.upi},${Math.round((reportData.paymentBreakdown.upi / (reportData.totalCollected || 1)) * 100)}%`,
      `Credit & Debit Cards (POS/Online),${reportData.paymentBreakdown.card},${Math.round((reportData.paymentBreakdown.card / (reportData.totalCollected || 1)) * 100)}%`,
      `Corporate Net Banking,${reportData.paymentBreakdown.netBank},${Math.round((reportData.paymentBreakdown.netBank / (reportData.totalCollected || 1)) * 100)}%`,
      `Cash & Direct Billing,${reportData.paymentBreakdown.cash},${Math.round((reportData.paymentBreakdown.cash / (reportData.totalCollected || 1)) * 100)}%`,
      '',
      '=== SECTION 3: TRANSACTION AUDIT SUMMARY ===',
      'Transaction ID,Guest Name,Method,Amount (INR),Status,Date,Reconciled',
      ...transactions.map(t => `${t.id},"${t.guestName}",${t.paymentMethod},${t.amount},${t.status},${t.date},${t.isReconciled ? 'YES' : 'NO'}`),
      '',
      'Note: This report is generated from the verified local hotel financial state for daily audit reconciliation.'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_closing_report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-400" />
            Daily Financial Reports
          </h2>
          <p className="text-xs text-mist-400">
            Consolidated daily revenue summary, payment channel settlement, tax accruals, and refund deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-900 border border-white/10 text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                period === 'today' ? 'bg-primary-600 text-white shadow-sm' : 'text-mist-400 hover:text-white'
              }`}
            >
              Today (Oct 23)
            </button>
            <button
              onClick={() => setPeriod('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                period === 'yesterday' ? 'bg-primary-600 text-white shadow-sm' : 'text-mist-400 hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                period === 'week' ? 'bg-primary-600 text-white shadow-sm' : 'text-mist-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                period === 'month' ? 'bg-primary-600 text-white shadow-sm' : 'text-mist-400 hover:text-white'
              }`}
            >
              Month to Date
            </button>
          </div>

          <button
            onClick={handleExportReportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-white border border-white/10 text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Download CSV Report
          </button>
        </div>
      </div>

      {/* 6 Core KPI Summary Cards (Section 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card 1: Daily Revenue Summary */}
        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-mist-400">Total Billed Gross</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white mt-1">₹{reportData.totalBilled.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">
            Rooms: ₹{reportData.totalRoomCharges.toLocaleString('en-IN')} · F&B: ₹{reportData.totalServices.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Card 2: Payments Collected */}
        <div className="p-4 rounded-xl bg-ink-900 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-emerald-400">Payments Collected</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">₹{reportData.totalCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">Settled across UPI, Card, Net Banking & Cash</p>
        </div>

        {/* Card 3: Total Invoices */}
        <div className="p-4 rounded-xl bg-ink-900 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-mist-400">Total Folios / Invoices</span>
            <FileText className="h-4 w-4 text-primary-400" />
          </div>
          <h3 className="text-2xl font-black text-white mt-1">{reportData.totalInvoices} Invoices</h3>
          <p className="text-xs text-mist-400 mt-1">GST Tax Accrued: ₹{reportData.totalTax.toLocaleString('en-IN')}</p>
        </div>

        {/* Card 4: Outstanding Balances */}
        <div className="p-4 rounded-xl bg-ink-900 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-amber-400">Outstanding Balances</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-amber-400 mt-1">₹{reportData.totalOutstanding.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">Pending guest checkout settlement</p>
        </div>

        {/* Card 5: Refund Totals */}
        <div className="p-4 rounded-xl bg-ink-900 border border-purple-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-purple-400">Refund Disbursements</span>
            <RotateCcw className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="text-2xl font-black text-purple-400 mt-1">₹{reportData.totalRefunded.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">{reportData.refundCount} dispute refunds completed</p>
        </div>

        {/* Card 6: Net Realized Revenue */}
        <div className="p-4 rounded-xl bg-ink-900 border border-blue-500/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-blue-400">Net Realized Revenue</span>
            <CreditCard className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-white mt-1">₹{reportData.netRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-mist-400 mt-1">Collections minus processed refunds</p>
        </div>

      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Center Breakdown */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-400" />
              Revenue Centers Breakdown
            </h3>
            <span className="text-[11px] text-mist-400">GST Breakdown Included</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">Room Accommodation Tariff</span>
                <span className="font-semibold text-white">₹{reportData.totalRoomCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.totalRoomCharges / (reportData.totalBilled || 1)) * 100)}%` }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">F&B, Mini-bar & Service Charges</span>
                <span className="font-semibold text-white">₹{reportData.totalServices.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.totalServices / (reportData.totalBilled || 1)) * 100)}%` }}
                  className="h-full bg-teal-400 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">Hospitality GST (18% Accrued)</span>
                <span className="font-semibold text-white">₹{reportData.totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.totalTax / (reportData.totalBilled || 1)) * 100)}%` }}
                  className="h-full bg-indigo-400 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-ink-950/80 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-mist-400">Total Billed Gross:</span>
            <span className="font-bold text-white text-sm">₹{reportData.totalBilled.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-400" />
              Settlement Channels Breakdown
            </h3>
            <span className="text-[11px] text-mist-400">Bank & POS Gateways</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">UPI / QR Codes (PhonePe, GPay)</span>
                <span className="font-semibold text-white">₹{reportData.paymentBreakdown.upi.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.paymentBreakdown.upi / (reportData.totalCollected || 1)) * 100)}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">Credit / Debit Cards (POS & Web)</span>
                <span className="font-semibold text-white">₹{reportData.paymentBreakdown.card.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.paymentBreakdown.card / (reportData.totalCollected || 1)) * 100)}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">Net Banking (HDFC, ICICI, SBI)</span>
                <span className="font-semibold text-white">₹{reportData.paymentBreakdown.netBank.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.paymentBreakdown.netBank / (reportData.totalCollected || 1)) * 100)}%` }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mist-300">Cash & Direct Front Desk Settlement</span>
                <span className="font-semibold text-white">₹{reportData.paymentBreakdown.cash.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
                <div
                  style={{ width: `${Math.round((reportData.paymentBreakdown.cash / (reportData.totalCollected || 1)) * 100)}%` }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-ink-950/80 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-mist-400">Total Collected Volume:</span>
            <span className="font-bold text-emerald-400 text-sm">₹{reportData.totalCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
