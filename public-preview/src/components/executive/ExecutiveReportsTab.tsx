'use client';

import { useState, useMemo } from 'react';
import {
  ArrowDownToLine,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  PieChart,
  ShieldCheck,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useDemo } from '@/lib/store';

export function ExecutiveReportsTab() {
  const { state, notify } = useDemo();
  const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly' | 'ytd'>('monthly');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  // Requisitions & Approvals data
  const executiveItems = state.items.executive_viewer ?? [];
  const approvedCount = executiveItems.filter((i) => i.status === 'Approved').length;
  const rejectedCount = executiveItems.filter((i) => i.status === 'Rejected').length;
  const pendingCount = executiveItems.filter((i) => i.status === 'Needs approval').length;

  // Real client-side zero-package CSV export
  const handleExportCSV = () => {
    setExporting(true);
    try {
      const rows = [
        ['Requisition Ref', 'Title', 'Category', 'Department', 'Amount (INR)', 'Priority', 'Status', 'Date'],
        ...executiveItems.map((item) => [
          `"${item.ref || item.id}"`,
          `"${item.title.replace(/"/g, '""')}"`,
          `"${item.category || 'Requisition'}"`,
          `"${item.department || 'Property-wide'}"`,
          item.amount ? `${item.amount}` : '0',
          `"${item.priority || 'Normal'}"`,
          `"${item.status}"`,
          `"${item.createdAt || 'Today'}"`,
        ]),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Executive_Requisitions_Report_${reportRange}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify('CSV Report generated and downloaded successfully');
    } catch (err) {
      notify('Failed to generate export file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              Executive Analytics & Operational Reports
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
              Audit Grade
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Turnaround velocity, SLA distributions, capex allocation, and client-side data export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe pill */}
          <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'ytd', label: 'YTD' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  reportRange === tab.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-md flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
            <span className="text-xs font-medium">Approval Authorization Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">
            {executiveItems.length > 0
              ? `${Math.round((approvedCount / (approvedCount + rejectedCount || 1)) * 100)}%`
              : '85%'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {approvedCount} Authorized · {rejectedCount} Declined
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
            <span className="text-xs font-medium">Average Task Turnaround</span>
            <Timer className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">14.2 min</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            -2.4m faster than SLA ceiling (20m)
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
            <span className="text-xs font-medium">Guest Satisfaction Index</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-navy-950 dark:text-white">4.74 / 5.0</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Top 5% among luxury regional resorts
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
            <span className="text-xs font-medium">Total Capex Committed MTD</span>
            <Wallet className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-navy-950 dark:text-white">
            ₹1,41,000
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-300 font-semibold mt-1">
            70.5% of delegated limit (₹2,00,000)
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department SLA Rankings */}
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Operational SLA Ranking by Operating Unit
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Spa & Wellness', percent: 98.5, turnaround: '8m', count: 3 },
              { name: 'Safety & Security', percent: 97.1, turnaround: '4m', count: 2 },
              { name: 'Housekeeping & Rooms', percent: 96.8, turnaround: '12m', count: 14 },
              { name: 'Front Office & Stays', percent: 95.2, turnaround: '6m', count: 9 },
              { name: 'Food & Beverage', percent: 94.0, turnaround: '14m', count: 5 },
              { name: 'Maintenance & Engineering', percent: 91.4, turnaround: '18m', count: 7 },
            ].map((dept, idx) => (
              <div
                key={dept.name}
                className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-white/10 grid place-items-center font-bold text-[11px] text-navy-950 dark:text-white">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-navy-950 dark:text-white">{dept.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-mist-500">
                      Avg Response: {dept.turnaround} · Active Tasks: {dept.count}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 dark:bg-ink-950 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dept.percent >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.percent}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-navy-950 dark:text-white w-10 text-right">
                    {dept.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capital & Requisition Allocation */}
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
            <PieChart className="h-4 w-4 text-purple-400" />
            Capital Allocation & Requisitions by Category
          </h3>

          <div className="space-y-3">
            {[
              { category: 'Heavy Equipment & Capex (Otis, Carrier)', amount: '₹1,13,000', share: '48%' },
              { category: 'Guest Goodwill & VIP Compensations', amount: '₹28,000', share: '12%' },
              { category: 'Supply & Linen Replenishments', amount: '₹35,000', share: '15%' },
              { category: 'Banquet & Peak Season Staffing', amount: '₹35,000', share: '15%' },
              { category: 'Routine Maintenance Spares', amount: '₹24,000', share: '10%' },
            ].map((item) => (
              <div
                key={item.category}
                className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-xs"
              >
                <div className="font-medium text-navy-950 dark:text-white">
                  {item.category}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {item.amount}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                    {item.share}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] text-[11px] text-slate-500 dark:text-mist-400 flex items-center justify-between">
            <span>Fiscal Year Capex Budget</span>
            <span className="font-mono font-bold text-navy-950 dark:text-white">
              ₹24,00,000 Total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
