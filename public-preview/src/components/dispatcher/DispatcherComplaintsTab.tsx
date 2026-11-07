'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquareWarning,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Plus,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  HeartPulse,
  Users,
  UserCheck,
  Crown,
  FileText,
  AlertCircle,
  X,
  Send,
  Building2,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  Zap,
  Droplets,
  BedDouble,
  Filter,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { ComplaintCase, DispatcherDepartment, GuestComplaintRecord } from '@/types/demo';

interface DispatcherComplaintsTabProps {
  department: DispatcherDepartment;
  onOpenEscalate?: () => void;
}

export type MaintenanceComplaintCategory = 'furniture' | 'electrical_appliances' | 'plumbing';

export function getMaintenanceCategory(c: ComplaintCase | GuestComplaintRecord): MaintenanceComplaintCategory {
  if ('maintenanceCategory' in c && c.maintenanceCategory) {
    if (c.maintenanceCategory === 'washroom') return 'plumbing';
    return c.maintenanceCategory as MaintenanceComplaintCategory;
  }
  const text = `${c.category || ''} ${'summary' in c ? c.summary : ''} ${'title' in c ? c.title : ''} ${c.description || ''}`.toLowerCase();

  // Plumbing checks
  if (
    text.includes('plumb') ||
    text.includes('pipe') ||
    text.includes('leak') ||
    text.includes('drain') ||
    text.includes('faucet') ||
    text.includes('tap') ||
    text.includes('sink') ||
    text.includes('shower') ||
    text.includes('washroom') ||
    text.includes('bathroom') ||
    text.includes('toilet') ||
    text.includes('cistern') ||
    text.includes('bidet') ||
    text.includes('bathtub') ||
    text.includes('jacuzzi') ||
    text.includes('water') ||
    text.includes('clog') ||
    text.includes('pressure')
  ) {
    return 'plumbing';
  }

  // Electrical appliances checks
  if (
    text.includes('electrical') ||
    text.includes('appliance') ||
    text.includes('ac') ||
    text.includes('air conditioning') ||
    text.includes('hvac') ||
    text.includes('cooling') ||
    text.includes('thermostat') ||
    text.includes('heater') ||
    text.includes('tv') ||
    text.includes('television') ||
    text.includes('remote') ||
    text.includes('light') ||
    text.includes('lamp') ||
    text.includes('bulb') ||
    text.includes('sensor') ||
    text.includes('socket') ||
    text.includes('outlet') ||
    text.includes('fridge') ||
    text.includes('cooler') ||
    text.includes('minibar') ||
    text.includes('hairdryer') ||
    text.includes('kettle') ||
    text.includes('switch') ||
    text.includes('breaker') ||
    text.includes('fan') ||
    text.includes('spark')
  ) {
    return 'electrical_appliances';
  }

  // Furniture checks
  return 'furniture';
}

export function isComplaintInActiveDept(
  c: ComplaintCase | GuestComplaintRecord,
  currentDept: DispatcherDepartment,
): boolean {
  if ('department' in c && c.department) {
    if (c.department === currentDept) return true;
  }
  const text = `${c.category || ''} ${'summary' in c ? c.summary : ''} ${'title' in c ? c.title : ''} ${c.description || ''} ${'assignedTo' in c ? c.assignedTo : ''}`.toLowerCase();

  if (currentDept === 'Housekeeping') {
    return (
      text.includes('housekeep') ||
      text.includes('linen') ||
      text.includes('towel') ||
      text.includes('clean') ||
      text.includes('turndown') ||
      text.includes('amenit') ||
      text.includes('hygiene') ||
      text.includes('mat') ||
      text.includes('bed') ||
      text.includes('pillow') ||
      text.includes('dust')
    );
  }
  if (currentDept === 'Maintenance & Engineering') {
    return (
      text.includes('maint') ||
      text.includes('engineer') ||
      text.includes('ac') ||
      text.includes('hvac') ||
      text.includes('leak') ||
      text.includes('water') ||
      text.includes('pipe') ||
      text.includes('plumb') ||
      text.includes('electric') ||
      text.includes('door') ||
      text.includes('lock') ||
      text.includes('thermostat') ||
      text.includes('shower') ||
      text.includes('toilet') ||
      text.includes('cistern') ||
      text.includes('furnitur') ||
      text.includes('chair') ||
      text.includes('appliance') ||
      text.includes('washroom') ||
      text.includes('whistle')
    );
  }
  if (currentDept === 'Food & Beverages') {
    return (
      text.includes('food') ||
      text.includes('dining') ||
      text.includes('beverag') ||
      text.includes('breakfast') ||
      text.includes('dinner') ||
      text.includes('lunch') ||
      text.includes('minibar') ||
      text.includes('room service') ||
      text.includes('meal') ||
      text.includes('kitchen') ||
      text.includes('chef') ||
      text.includes('cart') ||
      text.includes('wine') ||
      text.includes('cold')
    );
  }
  if (currentDept === 'Wellness') {
    return (
      text.includes('well') ||
      text.includes('spa') ||
      text.includes('steam') ||
      text.includes('hydro') ||
      text.includes('massage') ||
      text.includes('ayur') ||
      text.includes('therap') ||
      text.includes('diffuser') ||
      text.includes('pool')
    );
  }
  return true;
}

export function DispatcherComplaintsTab({
  department,
  onOpenEscalate,
}: DispatcherComplaintsTabProps) {
  const { state, resolveComplaintCase } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'under_investigation' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'vip' | 'normal'>('all');
  const [maintenanceCategoryFilter, setMaintenanceCategoryFilter] = useState<'all' | MaintenanceComplaintCategory>('all');

  // Local additions and updates to ensure instant reactivity
  const [localComplaints, setLocalComplaints] = useState<ComplaintCase[]>([]);
  const [selectedComplaintForResolve, setSelectedComplaintForResolve] = useState<ComplaintCase | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveCompAmount, setResolveCompAmount] = useState<number>(0);

  // New complaint modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [newGuest, setNewGuest] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<'normal' | 'vip' | 'critical'>('normal');
  const [newCategory, setNewCategory] = useState(department);
  const [newMaintenanceCategory, setNewMaintenanceCategory] = useState<MaintenanceComplaintCategory>('furniture');

  // Department icon and styling
  const deptIcon = useMemo(() => {
    switch (department) {
      case 'Housekeeping':
        return <Sparkles className="h-5 w-5 text-emerald-400" />;
      case 'Maintenance & Engineering':
        return <Wrench className="h-5 w-5 text-amber-400" />;
      case 'Food & Beverages':
        return <UtensilsCrossed className="h-5 w-5 text-rose-400" />;
      case 'Wellness':
        return <HeartPulse className="h-5 w-5 text-purple-400" />;
    }
  }, [department]);

  // Combined complaints from store + local additions
  const departmentComplaints = useMemo(() => {
    const fromFrontDesk = (state.frontDesk?.complaints ?? []).filter((c) =>
      isComplaintInActiveDept(c, department),
    );
    const fromGuestComplaints = (state.guestComplaints ?? [])
      .filter((gc) => isComplaintInActiveDept(gc, department))
      .map((gc) => ({
        id: gc.id,
        ref: gc.complaintId,
        room: gc.room,
        guest: gc.guestName,
        summary: gc.title,
        description: gc.description,
        severity: 'normal' as const,
        comp: 0,
        compApplied: gc.status === 'Resolved',
        createdAt: gc.submittedAt,
        category: gc.category,
        department,
        status: gc.status,
        responseRemarks: gc.responseRemarks,
      }));

    // Merge by id/ref
    const map = new Map<string, ComplaintCase>();
    [...fromFrontDesk, ...fromGuestComplaints, ...localComplaints].forEach((c) => {
      map.set(c.id || c.ref, c);
    });

    return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.frontDesk?.complaints, state.guestComplaints, localComplaints, department]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return departmentComplaints.filter((c) => {
      // Status filter
      if (statusFilter === 'in_progress') {
        const s = (c.status || '').toLowerCase();
        if (s !== 'in progress' && s !== 'in_progress' && c.compApplied) return false;
      } else if (statusFilter === 'under_investigation') {
        const s = (c.status || '').toLowerCase();
        if (s !== 'under investigation' && s !== 'under_investigation') return false;
      } else if (statusFilter === 'resolved') {
        const s = (c.status || '').toLowerCase();
        if (s !== 'resolved' && !c.compApplied) return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false;

      // Maintenance Category filter
      if (department === 'Maintenance & Engineering' && maintenanceCategoryFilter !== 'all') {
        if (getMaintenanceCategory(c) !== maintenanceCategoryFilter) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const mRef = (c.ref || '').toLowerCase().includes(q);
        const mRoom = (c.room || '').toLowerCase().includes(q);
        const mGuest = (c.guest || '').toLowerCase().includes(q);
        const mSummary = (c.summary || '').toLowerCase().includes(q);
        const mDesc = (c.description || '').toLowerCase().includes(q);
        if (!mRef && !mRoom && !mGuest && !mSummary && !mDesc) return false;
      }

      return true;
    });
  }, [departmentComplaints, statusFilter, severityFilter, maintenanceCategoryFilter, department, search]);

  // Metric counts
  const totalCount = departmentComplaints.length;
  const inProgressCount = departmentComplaints.filter(
    (c) => (c.status || '').toLowerCase().includes('progress') || (c.status || '').toLowerCase().includes('investigation') || !c.compApplied,
  ).length;
  const criticalCount = departmentComplaints.filter(
    (c) => (c.severity === 'critical' || c.severity === 'vip') && !c.compApplied,
  ).length;
  const resolvedCount = departmentComplaints.filter(
    (c) => (c.status || '').toLowerCase().includes('resolved') || c.compApplied,
  ).length;

  // Maintenance & Engineering Category Counts
  const furnitureCount = useMemo(() => {
    return departmentComplaints.filter((c) => getMaintenanceCategory(c) === 'furniture').length;
  }, [departmentComplaints]);

  const electricalCount = useMemo(() => {
    return departmentComplaints.filter((c) => getMaintenanceCategory(c) === 'electrical_appliances').length;
  }, [departmentComplaints]);

  const plumbingCount = useMemo(() => {
    return departmentComplaints.filter((c) => getMaintenanceCategory(c) === 'plumbing').length;
  }, [departmentComplaints]);

  const handleResolveSubmit = () => {
    if (!selectedComplaintForResolve) return;
    const complaintId = selectedComplaintForResolve.id || selectedComplaintForResolve.ref;
    
    // Call store API
    resolveComplaintCase(complaintId, resolveNotes, resolveCompAmount);

    // Update local state
    setLocalComplaints((prev) => {
      const existing = prev.find((x) => x.id === complaintId || x.ref === complaintId);
      const updated: ComplaintCase = {
        ...(existing || selectedComplaintForResolve),
        status: 'Resolved',
        compApplied: true,
        responseRemarks: resolveNotes,
        comp: resolveCompAmount || selectedComplaintForResolve.comp,
      };
      return [updated, ...prev.filter((x) => x.id !== complaintId && x.ref !== complaintId)];
    });

    setSelectedComplaintForResolve(null);
    setResolveNotes('');
    setResolveCompAmount(0);
  };

  const handleCreateComplaint = () => {
    if (!newRoom || !newTitle) return;
    const id = `CMP-${newRoom}-${Date.now().toString().slice(-4)}`;
    const newCase: ComplaintCase = {
      id,
      ref: id,
      room: newRoom,
      guest: newGuest || `Room ${newRoom} Guest`,
      summary: newTitle,
      description: newDescription,
      severity: newSeverity,
      category: newCategory,
      maintenanceCategory: department === 'Maintenance & Engineering' ? newMaintenanceCategory : undefined,
      department,
      status: 'In Progress',
      assignedTo: `${department} Supervisor`,
      createdAt: 'Just now',
      comp: 0,
      compApplied: false,
    };

    setLocalComplaints((prev) => [newCase, ...prev]);
    setIsNewModalOpen(false);
    setNewRoom('');
    setNewGuest('');
    setNewTitle('');
    setNewDescription('');
    setNewSeverity('normal');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center shrink-0">
            {deptIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-display text-white">
                Guest Complaints & Service Recovery
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-mist-300 border border-white/10">
                {department}
              </span>
            </div>
            <p className="text-xs text-mist-400 mt-1">
              Active guest complaints and dissatisfaction logs received for {department}. Monitor resolution progress and execute recovery protocols.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-400/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Guest Complaint</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Received */}
        <div className="p-4 rounded-2xl border border-white/10 bg-ink-900/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mist-400">Total Department Complaints</span>
            <MessageSquareWarning className="h-4 w-4 text-mist-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{totalCount}</p>
          <span className="text-[10px] text-mist-400">Logged across digital portal & desk</span>
        </div>

        {/* Active / In Progress */}
        <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.05] backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-300">In Progress / Active</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{inProgressCount}</p>
          <span className="text-[10px] text-sky-300">Staff dispatched & investigating</span>
        </div>

        {/* Critical / VIP */}
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Critical / VIP Escalations</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{criticalCount}</p>
          <span className="text-[10px] text-rose-300">Requires urgent supervisor turnaround</span>
        </div>

        {/* Resolved */}
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Resolved / Closed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{resolvedCount}</p>
          <span className="text-[10px] text-emerald-300">Service recovery documented</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-ink-900/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses ({totalCount})</option>
            <option value="in_progress">In Progress ({inProgressCount})</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="resolved">Resolved ({resolvedCount})</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-ink-950 px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="vip">VIP</option>
            <option value="normal">Standard</option>
          </select>

          {/* Maintenance Category Filter Dropdown */}
          {department === 'Maintenance & Engineering' && (
            <select
              value={maintenanceCategoryFilter}
              onChange={(e) => setMaintenanceCategoryFilter(e.target.value as any)}
              className="rounded-xl border border-amber-400/40 bg-ink-950 px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 shadow-sm"
              title="Filter by Maintenance Category"
            >
              <option value="all">All Categories ({totalCount})</option>
              <option value="furniture">Furniture ({furnitureCount})</option>
              <option value="electrical_appliances">Electrical appliances ({electricalCount})</option>
              <option value="plumbing">Plumbing ({plumbingCount})</option>
            </select>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, room, guest, keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 bg-ink-950 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Category Pills Filter Strip for Maintenance & Engineering */}
      {department === 'Maintenance & Engineering' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              Category Filter:
            </span>
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-ink-950/80 border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setMaintenanceCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  maintenanceCategoryFilter === 'all'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-400 hover:text-white'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceCategoryFilter('furniture')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  maintenanceCategoryFilter === 'furniture'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <BedDouble className="h-3.5 w-3.5" />
                <span>Furniture ({furnitureCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceCategoryFilter('electrical_appliances')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  maintenanceCategoryFilter === 'electrical_appliances'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Electrical appliances ({electricalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceCategoryFilter('plumbing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  maintenanceCategoryFilter === 'plumbing'
                    ? 'bg-amber-400 text-ink-950 font-bold shadow'
                    : 'text-mist-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Droplets className="h-3.5 w-3.5 text-sky-400" />
                <span>Plumbing ({plumbingCount})</span>
              </button>
            </div>
          </div>

          {maintenanceCategoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setMaintenanceCategoryFilter('all')}
              className="text-[11px] text-amber-300 hover:text-white underline shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Clear Category Filter
            </button>
          )}
        </div>
      )}

      {/* Complaints List / Cards */}
      <div className="space-y-4">
        {filteredComplaints.map((c) => {
          const isResolved = (c.status || '').toLowerCase() === 'resolved' || c.compApplied;
          const isCritical = c.severity === 'critical';
          const isVip = c.severity === 'vip';

          return (
            <div
              key={c.id || c.ref}
              className={`rounded-3xl border p-5 backdrop-blur-xl transition shadow-lg space-y-4 ${
                isResolved
                  ? 'border-emerald-500/20 bg-emerald-950/10'
                  : isCritical
                  ? 'border-rose-500/30 bg-rose-950/15'
                  : isVip
                  ? 'border-purple-500/30 bg-purple-950/15'
                  : 'border-white/10 bg-ink-900/90'
              }`}
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-bold font-mono text-white">
                    Room {c.room}
                  </span>
                  <span className="text-xs text-mist-300 font-semibold flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-mist-400" />
                    <span>{c.guest}</span>
                  </span>
                  <span className="font-mono text-[10px] text-mist-400 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">
                    {c.ref}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 font-semibold">
                    {c.category || department}
                  </span>

                  {department === 'Maintenance & Engineering' && (() => {
                    const mCat = getMaintenanceCategory(c);
                    return (
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold flex items-center gap-1 ${
                          mCat === 'furniture'
                            ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                            : mCat === 'electrical_appliances'
                            ? 'bg-sky-400/15 text-sky-300 border-sky-400/30'
                            : 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30'
                        }`}
                      >
                        {mCat === 'furniture' && <BedDouble className="h-3 w-3" />}
                        {mCat === 'electrical_appliances' && <Zap className="h-3 w-3" />}
                        {mCat === 'plumbing' && <Droplets className="h-3 w-3" />}
                        <span>
                          {mCat === 'furniture'
                            ? 'Furniture'
                            : mCat === 'electrical_appliances'
                            ? 'Electrical appliances'
                            : 'Plumbing'}
                        </span>
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Severity Pill */}
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isVip
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 flex items-center gap-1'
                        : 'bg-white/10 text-mist-300 border-white/10'
                    }`}
                  >
                    {isVip && <Crown className="h-3 w-3 text-purple-300" />}
                    <span>{c.severity}</span>
                  </span>

                  {/* Status Pill */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isResolved
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {c.status || (isResolved ? 'Resolved' : 'In Progress')}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white">
                  {c.summary}
                </h3>
                {c.description && (
                  <p className="text-xs text-mist-300 leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>

              {/* Attendant & Remarks Inset Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-mist-400 tracking-wider flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-mist-300" />
                    <span>Assigned Lead / Fulfiller</span>
                  </span>
                  <p className="font-semibold text-white">
                    {c.assignedTo || `${department} Lead`}
                  </p>
                  <p className="text-[10px] text-mist-400">Received: {c.createdAt}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-mist-400 tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-mist-300" />
                    <span>Resolution Notes & Corrective Remarks</span>
                  </span>
                  {c.responseRemarks ? (
                    <p className="text-xs text-emerald-300/90 italic">
                      &quot;{c.responseRemarks}&quot;
                    </p>
                  ) : (
                    <p className="text-xs text-mist-400 italic">
                      Under active investigation. Fulfiller dispatched to room.
                    </p>
                  )}
                  {c.comp > 0 && (
                    <p className="text-[11px] text-amber-300 font-mono">
                      Service Compensation: ₹{(c.comp * 80).toLocaleString('en-IN')} {c.compApplied ? '(Credit Authorized)' : '(Pending Review)'}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => onOpenEscalate?.()}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5"
                  title="Escalate blocker to Department Manager"
                >
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  <span>Escalate to Department Manager</span>
                </button>

                <div className="flex items-center gap-2">
                  {!isResolved ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplaintForResolve(c);
                        setResolveNotes(c.responseRemarks || '');
                        setResolveCompAmount(c.comp || 0);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Resolve Complaint</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Case Closed</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredComplaints.length === 0 && (
          <div className="py-16 px-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 text-mist-400 mx-auto grid place-items-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">No complaints found</h3>
            <p className="text-xs text-mist-400 max-w-sm mx-auto">
              There are currently no guest complaints matching the selected filters for {department}.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Resolve Complaint Modal */}
      {selectedComplaintForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Resolve Guest Complaint</h3>
                <p className="text-xs text-mist-400">
                  {selectedComplaintForResolve.ref} · Room {selectedComplaintForResolve.room} ({selectedComplaintForResolve.guest})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaintForResolve(null)}
                className="p-1 rounded-xl text-mist-400 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-white block mb-1">Issue Summary</span>
                <p className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-mist-300">
                  {selectedComplaintForResolve.summary}
                </p>
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">
                  Resolution Notes & Actions Taken *
                </label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Detail corrective actions (e.g. Attendant delivered fresh towels and deluxe amenity pack. Guest verified satisfaction)..."
                  className="w-full p-3 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">
                  Goodwill Compensation / Recovery Credit (₹)
                </label>
                <input
                  type="number"
                  value={resolveCompAmount}
                  onChange={(e) => setResolveCompAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:outline-none focus:border-emerald-400"
                />
                <p className="text-[10px] text-mist-400 mt-1">
                  Supervisor authority limit: ₹4,000. Amounts above require Department Manager approval.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedComplaintForResolve(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resolveNotes.trim()}
                onClick={handleResolveSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-ink-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirm Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log New Complaint Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Department Guest Complaint</h3>
                <p className="text-xs text-mist-400">
                  Record an in-person, phone, or radio complaint received directly for {department}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-xl text-mist-400 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white block mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. 304, 518"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-white block mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={newGuest}
                    onChange={(e) => setNewGuest(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">Complaint Title / Summary *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Linen replacement delay, AC whistling, cold breakfast delivery..."
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-white block mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide complete context of guest feedback..."
                  className="w-full p-2.5 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-ink-950 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="normal">Standard</option>
                    <option value="vip">VIP Guest</option>
                    <option value="critical">Critical / Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-white block mb-1">Assigned Department</label>
                  <input
                    type="text"
                    disabled
                    value={department}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-mist-300 cursor-not-allowed"
                  />
                </div>
                {department === 'Maintenance & Engineering' && (
                  <div className="col-span-2">
                    <label className="font-semibold text-white block mb-1">Maintenance Category</label>
                    <select
                      value={newMaintenanceCategory}
                      onChange={(e) => setNewMaintenanceCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-ink-950 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="furniture">Furniture</option>
                      <option value="electrical_appliances">Electrical appliances</option>
                      <option value="plumbing">Plumbing</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newRoom.trim() || !newTitle.trim()}
                onClick={handleCreateComplaint}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-ink-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save Complaint</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

