'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Layers,
  PieChart,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { formatComplaintRef } from '@/components/executive/ExecutiveIncidentsTab';
import type { WorkItem, ComplaintCase, ResourceRequest } from '@/types/demo';

interface DepartmentMeta {
  name: string;
  departmentKey: string;
  lead: string;
  slaPercent: number;
  turnaround: string;
  count: number;
  icon: any;
  color: string;
  inspectionScore: string;
  budget: string;
}

const DEPARTMENTS_DATA: DepartmentMeta[] = [
  {
    name: 'Wellness',
    departmentKey: 'wellness',
    lead: 'Meera Sen (Spa & Wellness Director)',
    slaPercent: 98.5,
    turnaround: '8m',
    count: 3,
    icon: Sparkles,
    color: 'emerald',
    inspectionScore: '99.1%',
    budget: '₹42,000',
  },
  {
    name: 'Safety & Security',
    departmentKey: 'security',
    lead: 'Inspector Roy (Head of Security)',
    slaPercent: 97.1,
    turnaround: '4m',
    count: 2,
    icon: ShieldCheck,
    color: 'blue',
    inspectionScore: '98.5%',
    budget: '₹35,000',
  },
  {
    name: 'Housekeeping & Rooms',
    departmentKey: 'housekeeping',
    lead: 'Elena Rostova (Executive Housekeeper)',
    slaPercent: 96.8,
    turnaround: '12m',
    count: 14,
    icon: Layers,
    color: 'teal',
    inspectionScore: '97.4%',
    budget: '₹35,000',
  },
  {
    name: 'Front Office & Stays',
    departmentKey: 'front_office',
    lead: 'Marcus Vance (Duty Manager)',
    slaPercent: 95.2,
    turnaround: '6m',
    count: 9,
    icon: Building2,
    color: 'amber',
    inspectionScore: '96.2%',
    budget: '₹28,000',
  },
  {
    name: 'Food & Beverage',
    departmentKey: 'food_beverage',
    lead: 'Chef Vikram & Dev Malhotra (F&B Lead)',
    slaPercent: 94.0,
    turnaround: '14m',
    count: 5,
    icon: UtensilsCrossed,
    color: 'orange',
    inspectionScore: '95.8%',
    budget: '₹35,000',
  },
  {
    name: 'Maintenance & Engineering',
    departmentKey: 'engineering',
    lead: 'Wayne Chen (Chief Engineer)',
    slaPercent: 91.4,
    turnaround: '18m',
    count: 7,
    icon: Wrench,
    color: 'purple',
    inspectionScore: '93.5%',
    budget: '₹1,37,000',
  },
];

interface CapitalAllocationItem {
  category: string;
  amount: string;
  rawAmount: number;
  share: string;
  department: string;
  subtext: string;
}

const CAPITAL_ALLOCATIONS: CapitalAllocationItem[] = [
  {
    category: 'Heavy Equipment & Capex (Otis, Carrier)',
    amount: '₹1,13,000',
    rawAmount: 113000,
    share: '48%',
    department: 'Maintenance & Engineering',
    subtext: 'Freight elevator #2 controller & Chiller Plant overhaul',
  },
  {
    category: 'Guest Goodwill & VIP Compensations',
    amount: '₹28,000',
    rawAmount: 28000,
    share: '12%',
    department: 'Front Office & Stays',
    subtext: 'Presidential suite service recovery & tariff adjustments',
  },
  {
    category: 'Supply & Linen Replenishments',
    amount: '₹35,000',
    rawAmount: 35000,
    share: '15%',
    department: 'Housekeeping & Rooms',
    subtext: 'Egyptian cotton king duvet sets & guest bath sheets batch',
  },
  {
    category: 'Banquet & Peak Season Staffing',
    amount: '₹35,000',
    rawAmount: 35000,
    share: '15%',
    department: 'Food & Beverage',
    subtext: 'Grand Ballroom medical summit auxiliary runner roster',
  },
  {
    category: 'Routine Maintenance Spares',
    amount: '₹24,000',
    rawAmount: 24000,
    share: '10%',
    department: 'Maintenance & Engineering',
    subtext: 'Pressure sensors, pump seals & chemical reagents',
  },
];

export function ExecutiveReportsTab() {
  const { state, notify } = useDemo();
  const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly' | 'ytd'>('monthly');
  const [exporting, setExporting] = useState(false);

  // Department report modal state
  const [selectedDepartmentReport, setSelectedDepartmentReport] = useState<{
    name: string;
    percent?: number;
    turnaround?: string;
    count?: number;
    categoryContext?: { category: string; amount: string; share: string };
  } | null>(null);

  // Overview quick cards modal states
  const [selectedRequestsModal, setSelectedRequestsModal] = useState<'all' | 'resolved' | 'unresolved' | 'blockers' | null>(null);
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDepartmentReport(null);
        setSelectedRequestsModal(null);
        setShowComplaintsModal(false);
        setShowSlaModal(false);
      }
    };
    if (selectedDepartmentReport || selectedRequestsModal || showComplaintsModal || showSlaModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedDepartmentReport, selectedRequestsModal, showComplaintsModal, showSlaModal]);

  // Aggregate work items across all roles
  const allWorkItems = useMemo(() => {
    const itemsMap = state.items ?? {};
    const seen = new Set<string>();
    const list: WorkItem[] = [];

    // Collect all items from all roles
    Object.values(itemsMap).forEach((roleItems) => {
      if (Array.isArray(roleItems)) {
        roleItems.forEach((item) => {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            list.push(item);
          }
        });
      }
    });

    return list;
  }, [state.items]);

  // Status classifier helpers
  const isResolved = (status: string = '') => {
    const s = status.toLowerCase();
    return s === 'completed' || s === 'resolved' || s === 'approved' || s === 'confirmed';
  };

  const isBlocker = (status: string = '') => {
    const s = status.toLowerCase();
    return s === 'blocked' || s === 'escalated' || s === 'rejected';
  };

  const isUnresolved = (status: string = '') => {
    return !isResolved(status) && !isBlocker(status);
  };

  // Filtered request categories for "Number Of Requests"
  const resolvedRequests = useMemo(() => allWorkItems.filter((i) => isResolved(i.status)), [allWorkItems]);
  const unresolvedRequests = useMemo(() => allWorkItems.filter((i) => isUnresolved(i.status)), [allWorkItems]);
  const blockerRequests = useMemo(() => allWorkItems.filter((i) => isBlocker(i.status)), [allWorkItems]);
  const totalRequestsCount = allWorkItems.length;

  // Complaints
  const complaints = useMemo(() => {
    return state.frontDesk?.complaints ?? [];
  }, [state.frontDesk?.complaints]);

  const unresolvedComplaintsCount = useMemo(() => {
    return complaints.filter((c) => !c.compApplied && c.status !== 'Resolved').length;
  }, [complaints]);

  const resolvedComplaintsCount = useMemo(() => {
    return complaints.filter((c) => c.compApplied || c.status === 'Resolved').length;
  }, [complaints]);

  // Department helper functions
  const getDepartmentItems = (deptName: string) => {
    const norm = deptName.toLowerCase();
    return allWorkItems.filter((i) => {
      const dep = (i.department || '').toLowerCase();
      const cat = (i.category || '').toLowerCase();
      const id = (i.id || '').toLowerCase();
      if (norm.includes('wellness')) {
        return dep.includes('wellness') || dep.includes('spa') || cat.includes('spa') || cat.includes('wellness');
      }
      if (norm.includes('safety') || norm.includes('security')) {
        return dep.includes('safety') || dep.includes('security') || cat === 'safety' || id.startsWith('sec-');
      }
      if (norm.includes('housekeeping')) {
        return dep.includes('housekeeping') || cat === 'housekeeping';
      }
      if (norm.includes('front')) {
        return dep.includes('front') || cat === 'concierge' || cat === 'folio' || id.startsWith('fd-');
      }
      if (norm.includes('food')) {
        return dep.includes('food') || dep.includes('dining') || cat === 'room_service' || cat.includes('dining');
      }
      if (norm.includes('maintenance') || norm.includes('engineering')) {
        return dep.includes('maintenance') || dep.includes('engineering') || cat === 'maintenance';
      }
      return false;
    });
  };

  const getDepartmentComplaints = (deptName: string) => {
    const norm = deptName.toLowerCase();
    return complaints.filter((c) => {
      const dep = (c.department || c.category || '').toLowerCase();
      if (norm.includes('wellness')) return dep.includes('wellness') || dep.includes('spa');
      if (norm.includes('safety') || norm.includes('security')) return dep.includes('safety') || dep.includes('security');
      if (norm.includes('housekeeping')) return dep.includes('housekeeping');
      if (norm.includes('front')) return dep.includes('front') || dep.includes('stay') || dep.includes('concierge');
      if (norm.includes('food')) return dep.includes('food') || dep.includes('dining');
      if (norm.includes('maintenance') || norm.includes('engineering')) {
        return (
          dep.includes('maintenance') ||
          dep.includes('engineering') ||
          dep.includes('electrical') ||
          dep.includes('furniture') ||
          dep.includes('plumbing')
        );
      }
      return false;
    });
  };

  // Requisitions & Approvals data
  const executiveItems = state.items.executive_viewer ?? [];
  const approvedCount = executiveItems.filter((i) => i.status === 'Approved').length;
  const rejectedCount = executiveItems.filter((i) => i.status === 'Rejected').length;

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

  // Current active department metadata for modal
  const activeDeptMeta = useMemo(() => {
    if (!selectedDepartmentReport) return null;
    const found = DEPARTMENTS_DATA.find(
      (d) => d.name.toLowerCase() === selectedDepartmentReport.name.toLowerCase(),
    );
    return (
      found || {
        name: selectedDepartmentReport.name,
        departmentKey: 'dept',
        lead: 'Department Head',
        slaPercent: selectedDepartmentReport.percent || 95.0,
        turnaround: selectedDepartmentReport.turnaround || '10m',
        count: selectedDepartmentReport.count || 5,
        icon: Building2,
        color: 'amber',
        inspectionScore: '96.5%',
        budget: '₹35,000',
      }
    );
  }, [selectedDepartmentReport]);

  const activeDeptItems = useMemo(() => {
    if (!selectedDepartmentReport) return [];
    return getDepartmentItems(selectedDepartmentReport.name);
  }, [selectedDepartmentReport, allWorkItems]);

  const activeDeptComplaints = useMemo(() => {
    if (!selectedDepartmentReport) return [];
    return getDepartmentComplaints(selectedDepartmentReport.name);
  }, [selectedDepartmentReport, complaints]);

  // Modal filtered requests list
  const modalRequestsList = useMemo(() => {
    let list = allWorkItems;
    if (selectedRequestsModal === 'resolved') list = resolvedRequests;
    if (selectedRequestsModal === 'unresolved') list = unresolvedRequests;
    if (selectedRequestsModal === 'blockers') list = blockerRequests;

    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.department?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.room?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allWorkItems, selectedRequestsModal, resolvedRequests, unresolvedRequests, blockerRequests, modalSearchQuery]);

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

      {/* Quick Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Section 1: Number Of Requests (with Resolved, Unresolved, Blockers) */}
        <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
              <span className="text-xs font-bold text-navy-950 dark:text-white uppercase tracking-wider">
                Number Of Requests
              </span>
              <button
                type="button"
                onClick={() => setSelectedRequestsModal('all')}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                title="View all requests"
              >
                <span>View All</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <div
                className="text-2xl font-black font-mono text-navy-950 dark:text-white cursor-pointer hover:text-amber-500 transition"
                onClick={() => setSelectedRequestsModal('all')}
              >
                {totalRequestsCount}
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Total Live Queue</span>
            </div>
          </div>

          {/* 3 Options inside Number Of Requests: Resolved, Unresolved, Blockers */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-1.5 text-center">
            {/* Option 1: Resolved */}
            <button
              type="button"
              onClick={() => setSelectedRequestsModal('resolved')}
              className="p-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] hover:bg-emerald-500/20 transition flex flex-col items-center group cursor-pointer"
              title="Click to view Resolved requests"
            >
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                Resolved
              </span>
              <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300">
                {resolvedRequests.length}
              </span>
            </button>

            {/* Option 2: Unresolved */}
            <button
              type="button"
              onClick={() => setSelectedRequestsModal('unresolved')}
              className="p-1.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] hover:bg-amber-500/20 transition flex flex-col items-center group cursor-pointer"
              title="Click to view Unresolved requests"
            >
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                Unresolved
              </span>
              <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-300">
                {unresolvedRequests.length}
              </span>
            </button>

            {/* Option 3: Blockers */}
            <button
              type="button"
              onClick={() => setSelectedRequestsModal('blockers')}
              className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] hover:bg-rose-500/20 transition flex flex-col items-center group cursor-pointer"
              title="Click to view Blockers"
            >
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
                Blockers
              </span>
              <span className="text-xs font-black font-mono text-rose-700 dark:text-rose-300">
                {blockerRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: Total Number of Complaints */}
        <div
          onClick={() => setShowComplaintsModal(true)}
          className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between hover:border-amber-500/40 cursor-pointer transition group"
          role="button"
          tabIndex={0}
          title="Click to view detailed complaints breakdown"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowComplaintsModal(true);
            }
          }}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
              <span className="text-xs font-bold text-navy-950 dark:text-white uppercase tracking-wider group-hover:text-amber-500 transition">
                Total Number of Complaints
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black font-mono text-navy-950 dark:text-white">
                {complaints.length}
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Recorded Cases</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {unresolvedComplaintsCount} Active Pending
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {resolvedComplaintsCount} Resolved / Comped
            </span>
          </div>
        </div>

        {/* Section 3: SLA */}
        <div
          onClick={() => setShowSlaModal(true)}
          className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between hover:border-emerald-500/40 cursor-pointer transition group"
          role="button"
          tabIndex={0}
          title="Click to view property SLA performance audit"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowSlaModal(true);
            }
          }}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
              <span className="text-xs font-bold text-navy-950 dark:text-white uppercase tracking-wider group-hover:text-emerald-500 transition">
                SLA
              </span>
              <Timer className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black font-mono text-navy-950 dark:text-white">
                96.4%
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Property-Wide
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-mist-400 font-medium">Avg: 14.2m</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              -2.4m vs 20m SLA Ceiling
            </span>
          </div>
        </div>

        {/* Section 4: Total Capex Committed MTD */}
        <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-mist-400 mb-1">
              <span className="text-xs font-bold text-navy-950 dark:text-white uppercase tracking-wider">
                Total Capex Committed MTD
              </span>
              <Wallet className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-navy-950 dark:text-white">
              ₹1,41,000
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-purple-600 dark:text-purple-300 font-semibold flex items-center justify-between">
            <span>Limit: ₹2,00,000</span>
            <span>70.5% Allocated</span>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department SLA Rankings - All options clickable to show detailed department report */}
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Operational SLA Ranking by Operating Unit
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-mist-400">
              Click unit for detailed report
            </span>
          </div>

          <div className="space-y-3">
            {DEPARTMENTS_DATA.map((dept, idx) => {
              const deptItems = getDepartmentItems(dept.name);
              const deptComplaints = getDepartmentComplaints(dept.name);
              return (
                <div
                  key={dept.name}
                  onClick={() =>
                    setSelectedDepartmentReport({
                      name: dept.name,
                      percent: dept.slaPercent,
                      turnaround: dept.turnaround,
                      count: deptItems.length || dept.count,
                    })
                  }
                  className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.12] hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between text-xs group"
                  role="button"
                  tabIndex={0}
                  title={`Click to view detailed report for ${dept.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDepartmentReport({
                        name: dept.name,
                        percent: dept.slaPercent,
                        turnaround: dept.turnaround,
                        count: deptItems.length || dept.count,
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-white/10 grid place-items-center font-bold text-[11px] text-navy-950 dark:text-white group-hover:bg-amber-500 group-hover:text-white transition">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-navy-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition flex items-center gap-1.5">
                        <span>{dept.name}</span>
                        {deptComplaints.length > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
                            {deptComplaints.length} cmp
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-mist-500">
                        Avg Response: {dept.turnaround} · Active Tasks: {deptItems.length || dept.count} · Lead: {dept.lead.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20 sm:w-24 bg-slate-200 dark:bg-ink-950 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dept.slaPercent >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${dept.slaPercent}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-navy-950 dark:text-white w-10 text-right">
                      {dept.slaPercent}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 transition ml-1 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Capital Allocation & Requisition by Category - All options clickable to show detailed department report */}
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-400" />
              Capital Allocation &amp; Requisition by Category
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-mist-400">
              Click category for department report
            </span>
          </div>

          <div className="space-y-3">
            {CAPITAL_ALLOCATIONS.map((item) => (
              <div
                key={item.category}
                onClick={() =>
                  setSelectedDepartmentReport({
                    name: item.department,
                    categoryContext: {
                      category: item.category,
                      amount: item.amount,
                      share: item.share,
                    },
                  })
                }
                className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-purple-500/[0.08] dark:hover:bg-purple-500/[0.12] hover:border-purple-500/40 cursor-pointer transition flex items-center justify-between text-xs group"
                role="button"
                tabIndex={0}
                title={`Click to view detailed report for ${item.department} (${item.category})`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDepartmentReport({
                      name: item.department,
                      categoryContext: {
                        category: item.category,
                        amount: item.amount,
                        share: item.share,
                      },
                    });
                  }
                }}
              >
                <div>
                  <div className="font-semibold text-navy-950 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    {item.category}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-mist-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-bold text-purple-600 dark:text-purple-300">
                      Dept: {item.department}
                    </span>
                    <span>·</span>
                    <span>{item.subtext}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {item.amount}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                    {item.share}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-400 transition shrink-0" />
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

      {/* MODAL 1: Detailed Department Report */}
      {selectedDepartmentReport && activeDeptMeta && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedDepartmentReport(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/95 dark:bg-ink-900/95 backdrop-blur-2xl shadow-2xl p-6 space-y-6 text-navy-950 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 grid place-items-center">
                  <activeDeptMeta.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-navy-950 dark:text-white">
                      {activeDeptMeta.name} Detailed Operational Report
                    </h3>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                      SLA: {activeDeptMeta.slaPercent}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Lead: <strong className="text-navy-950 dark:text-white">{activeDeptMeta.lead}</strong> · Average Turnaround: <strong className="text-navy-950 dark:text-white">{activeDeptMeta.turnaround}</strong> · Quality Score: <strong className="text-emerald-600">{activeDeptMeta.inspectionScore}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDepartmentReport(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-white grid place-items-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* If opened from Capital Allocation context, show highlight banner */}
            {selectedDepartmentReport.categoryContext && (
              <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                    Category Allocation Context
                  </span>
                  <div className="text-sm font-bold text-navy-950 dark:text-white mt-0.5">
                    {selectedDepartmentReport.categoryContext.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {selectedDepartmentReport.categoryContext.amount}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {selectedDepartmentReport.categoryContext.share} of CapEx Pool
                  </div>
                </div>
              </div>
            )}

            {/* Department Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-400">Operational SLA</div>
                <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {activeDeptMeta.slaPercent}%
                </div>
                <div className="text-[10px] text-slate-500">Benchmark: 95.0%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-400">Requests Breakdown</div>
                <div className="text-lg font-black font-mono text-navy-950 dark:text-white mt-0.5">
                  {activeDeptItems.length} Total
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span className="text-emerald-600 font-bold">{activeDeptItems.filter((i) => isResolved(i.status)).length} Res</span>
                  <span>·</span>
                  <span className="text-amber-600 font-bold">{activeDeptItems.filter((i) => isUnresolved(i.status)).length} Unres</span>
                  <span>·</span>
                  <span className="text-rose-600 font-bold">{activeDeptItems.filter((i) => isBlocker(i.status)).length} Blk</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-400">Guest Grievances</div>
                <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                  {activeDeptComplaints.length} Cases
                </div>
                <div className="text-[10px] text-slate-500">
                  {activeDeptComplaints.filter((c) => !c.compApplied && c.status !== 'Resolved').length} Unresolved
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-400">Allocated Budget</div>
                <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-300 mt-0.5">
                  {activeDeptMeta.budget}
                </div>
                <div className="text-[10px] text-slate-500">Capex & Materials</div>
              </div>
            </div>

            {/* Live Operational Tasks & Requests Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  Live Operational Work Orders &amp; Requests ({activeDeptItems.length})
                </h4>
                <span className="text-[10px] text-slate-400">Department task queue &amp; fulfiller log</span>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-black/5 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Ref / Title</th>
                      <th className="px-3 py-2">Location / Room</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {activeDeptItems.length > 0 ? (
                      activeDeptItems.map((item) => (
                        <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="px-3 py-2 font-medium">
                            <div className="font-bold text-navy-950 dark:text-white">{item.title}</div>
                            {item.description && (
                              <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-500 dark:text-mist-400 whitespace-nowrap">
                            {item.room ? `Room ${item.room}` : item.location || 'BOH Facility'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                item.priority === 'critical'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                  : item.priority === 'urgent'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                              }`}
                            >
                              {item.priority || 'normal'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isResolved(item.status)
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                  : isBlocker(item.status)
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-[10px] font-mono">
                            {item.createdAt || 'Today'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                          No active work orders recorded for {activeDeptMeta.name}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Guest Complaints (if any) */}
            {activeDeptComplaints.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Guest Grievances Log ({activeDeptComplaints.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Front desk escalation history</span>
                </div>

                <div className="space-y-2">
                  {activeDeptComplaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-navy-950 dark:text-white">
                          Room {c.room} · {c.guest}: <span className="font-normal">{c.summary}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Assigned Lead: {c.assignedTo} · Ref: {formatComplaintRef(c)} · Logged: {c.createdAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {c.comp ? (
                          <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Comp ₹{(c.comp * 80).toLocaleString('en-IN')}
                          </span>
                        ) : null}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            c.compApplied || c.status === 'Resolved'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {c.status || (c.compApplied ? 'Resolved' : 'Pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Department Report generated at {new Date().toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    notify(`Exported ${activeDeptMeta.name} report summary`);
                    setSelectedDepartmentReport(null);
                  }}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Summary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDepartmentReport(null)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Number Of Requests Overview Modal (Resolved, Unresolved, Blockers) */}
      {selectedRequestsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedRequestsModal(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/95 dark:bg-ink-900/95 backdrop-blur-2xl shadow-2xl p-6 space-y-6 text-navy-950 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-navy-950 dark:text-white">
                    Operational Requests Queue
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10">
                    {modalRequestsList.length} Requests
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                  Full property operational activity across all departments and service roles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestsModal(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-white grid place-items-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
                {[
                  { id: 'all', label: `All (${totalRequestsCount})` },
                  { id: 'resolved', label: `Resolved (${resolvedRequests.length})` },
                  { id: 'unresolved', label: `Unresolved (${unresolvedRequests.length})` },
                  { id: 'blockers', label: `Blockers (${blockerRequests.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedRequestsModal(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedRequestsModal === tab.id
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Filter requests..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            {/* Requests Table */}
            <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Title &amp; Details</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">Priority</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {modalRequestsList.map((req) => (
                    <tr key={req.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-navy-950 dark:text-white">{req.title}</div>
                        {req.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">{req.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 dark:text-mist-300 font-medium">
                        {req.department || 'Property-wide'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            req.priority === 'critical'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                              : req.priority === 'urgent'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                          }`}
                        >
                          {req.priority || 'normal'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isResolved(req.status)
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                              : isBlocker(req.status)
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[10px] text-slate-400">
                        {req.createdAt || 'Today'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequestsModal(null)}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Total Number of Complaints Modal */}
      {showComplaintsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowComplaintsModal(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/95 dark:bg-ink-900/95 backdrop-blur-2xl shadow-2xl p-6 space-y-6 text-navy-950 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-navy-950 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Guest Grievances &amp; Complaints Log
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20">
                    {complaints.length} Total Cases
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                  Recorded incidents, service recoveries, and guest relations compensation logs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintsModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-white grid place-items-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Complaints List */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatComplaintRef(c)}
                      </span>
                      <span className="font-bold text-navy-950 dark:text-white">
                        Room {c.room} ({c.guest})
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-semibold text-slate-500 dark:text-mist-300">
                        {c.department || c.category || 'General'}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-mist-200 font-medium">
                      {c.summary}
                    </div>
                    {c.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-2">
                        {c.description}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Assigned Lead: <strong className="text-navy-950 dark:text-white">{c.assignedTo || 'Duty Manager'}</strong> · Logged: {c.createdAt || 'Today'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                    {c.comp ? (
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                        Comp ₹{(c.comp * 80).toLocaleString('en-IN')}
                      </span>
                    ) : null}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        c.compApplied || c.status === 'Resolved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {c.status || (c.compApplied ? 'Resolved' : 'Active Pending')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowComplaintsModal(false)}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Operational SLA Report Modal */}
      {showSlaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowSlaModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/95 dark:bg-ink-900/95 backdrop-blur-2xl shadow-2xl p-6 space-y-6 text-navy-950 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-navy-950 dark:text-white flex items-center gap-2">
                    <Timer className="h-5 w-5 text-emerald-500" />
                    Property-Wide Operational SLA Performance
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                    96.4% Compliance
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                  Audit benchmark against 20-minute SLA maximum threshold across all operational divisions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSlaModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-white grid place-items-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SLA Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Target Response Ceiling</span>
                <div className="text-xl font-black font-mono text-navy-950 dark:text-white mt-1">20.0 min</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Luxury service SLA standard</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Average Property Turnaround</span>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">14.2 min</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">-5.8m head of limit</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Critical Breaches</span>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">0 Cases</div>
                <div className="text-[10px] text-slate-500 mt-0.5">100% emergency response</div>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                Operating Unit Ranking &amp; Compliance Details
              </h4>
              <div className="space-y-2">
                {DEPARTMENTS_DATA.map((d, i) => (
                  <div
                    key={d.name}
                    className="p-3 rounded-2xl border border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-white/10 grid place-items-center font-bold text-[11px]">
                        #{i + 1}
                      </span>
                      <div>
                        <div className="font-bold text-navy-950 dark:text-white">{d.name}</div>
                        <div className="text-[10px] text-slate-400">Avg Turnaround: {d.turnaround} · Lead: {d.lead}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-emerald-600">Grade A</span>
                      <span className="font-mono font-bold text-navy-950 dark:text-white text-sm">{d.slaPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSlaModal(false)}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
