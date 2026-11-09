'use client';

import { useState } from 'react';
import {
  Users,
  Layers,
  Sparkles,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Shield,
  Activity,
  Bed,
  Wrench,
  UtensilsCrossed,
  Filter,
  SlidersHorizontal,
  X,
  ChevronRight,
  Briefcase,
  Inbox,
  Check,
  Send,
  Coffee,
  UserMinus,
  MessageSquare,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  UserPlus,
  BadgeAlert,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { AssignTaskModal } from '@/components/dispatcher/AssignTaskModal';
import type {
  StaffAccount,
  WorkItem,
  DispatcherDepartment,
  DutyStatusRequest,
  DutyStatusType,
  TaskReassignRequest,
} from '@/types/demo';

interface DispatcherWorkloadTabProps {
  staffList?: StaffAccount[];
  department?: DispatcherDepartment;
}

export function DispatcherWorkloadTab({ staffList, department }: DispatcherWorkloadTabProps = {}) {
  const {
    state,
    redistributeUnstartedTasks,
    updateStaffCapacity,
    approveDutyStatusRequest,
    rejectDutyStatusRequest,
    approveTaskReassignRequest,
    rejectTaskReassignRequest,
  } = useDemo();

  // Top Section Switcher: 'requests' vs 'workload'
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'workload'>('requests');

  // Workload states
  const [reassignModalTask, setReassignModalTask] = useState<WorkItem | null>(null);
  const [editingCapacityStaff, setEditingCapacityStaff] = useState<StaffAccount | null>(null);
  const [capacityInput, setCapacityInput] = useState<number>(5);
  const [selectedStaffModal, setSelectedStaffModal] = useState<StaffAccount | null>(null);

  // Requests states
  const [requestCategoryFilter, setRequestCategoryFilter] = useState<'all' | 'duty' | 'reassign'>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dutyTypeFilter, setDutyTypeFilter] = useState<'all' | DutyStatusType>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');

  // Duty status reject modal
  const [rejectingDutyRequest, setRejectingDutyRequest] = useState<DutyStatusRequest | null>(null);
  const [dutyRejectReason, setDutyRejectReason] = useState('');
  const [dutyRejectionError, setDutyRejectionError] = useState('');

  // Task reassign modals
  const [reassigningRequest, setReassigningRequest] = useState<TaskReassignRequest | null>(null);
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState('');
  const [reassignSupervisorNote, setReassignSupervisorNote] = useState('');
  const [reassignSelectionError, setReassignSelectionError] = useState('');

  const [rejectingReassignRequest, setRejectingReassignRequest] = useState<TaskReassignRequest | null>(null);
  const [reassignRejectReason, setReassignRejectReason] = useState('');
  const [reassignRejectError, setReassignRejectError] = useState('');

  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Filter staff by department (same department members)
  const staffAccounts = staffList ?? (state.staffAccounts ?? []).filter((s) => {
    if (!department) return true;
    const d = s.department.toLowerCase();
    if (department === 'Housekeeping') return d.includes('house');
    if (department === 'Wellness') return d.includes('spa') || d.includes('wellness');
    if (department === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
    if (department === 'Food & Beverages') return d.includes('food') || d.includes('bev');
    return true;
  });
  const fulfillers = staffAccounts.filter((s) => s.roleId === 'task_fulfiller');
  const filteredFulfillers = fulfillers;

  // Calculate active workload and find tasks assigned to each fulfiller
  const getFulfillerTasks = (employeeId: string, staffName?: string) => {
    const allItems = [
      ...(state.items.task_fulfiller ?? []),
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
    ];
    // Deduplicate by task ID
    const uniqueItems = allItems.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

    return uniqueItems.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Cancelled') return false;
      const matchId = t.assigneeId && (t.assigneeId === employeeId || t.assigneeId.toLowerCase() === employeeId.toLowerCase());
      const matchName = staffName && t.assignee && (
        t.assignee.toLowerCase() === staffName.toLowerCase() ||
        t.assignee.toLowerCase().includes(staffName.toLowerCase()) ||
        staffName.toLowerCase().includes(t.assignee.toLowerCase())
      );
      return Boolean(matchId || matchName);
    });
  };

  const handleRebalance = () => {
    redistributeUnstartedTasks(department);
  };

  const openCapacityModal = (staff: StaffAccount) => {
    setEditingCapacityStaff(staff);
    setCapacityInput(staff.maxWorkload || 5);
  };

  const handleSaveCapacity = () => {
    if (!editingCapacityStaff) return;
    const validated = Math.max(1, Math.min(20, Math.round(capacityInput)));
    updateStaffCapacity(editingCapacityStaff.id, validated);
    setEditingCapacityStaff(null);
  };

  // Filter Duty Requests for this department
  const allDutyRequests = state.dutyStatusRequests ?? [];
  const deptDutyRequests = allDutyRequests.filter((req) => {
    if (!department) return true;
    const d = req.department.toLowerCase();
    if (department === 'Housekeeping') return d.includes('house');
    if (department === 'Wellness') return d.includes('spa') || d.includes('wellness');
    if (department === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
    if (department === 'Food & Beverages') return d.includes('food') || d.includes('bev');
    return true;
  });

  // Filter Task Reassign Requests for this department
  const allTaskReassignRequests = state.taskReassignRequests ?? [];
  const deptTaskReassignRequests = allTaskReassignRequests.filter((req) => {
    if (!department) return true;
    const d = req.department.toLowerCase();
    if (department === 'Housekeeping') return d.includes('house');
    if (department === 'Wellness') return d.includes('spa') || d.includes('wellness');
    if (department === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
    if (department === 'Food & Beverages') return d.includes('food') || d.includes('bev');
    return true;
  });

  const pendingDutyCount = deptDutyRequests.filter((r) => r.status === 'pending').length;
  const pendingReassignCount = deptTaskReassignRequests.filter((r) => r.status === 'pending').length;
  const totalPendingRequestsCount = pendingDutyCount + pendingReassignCount;

  // Filtered Duty Requests
  const filteredDutyRequests = deptDutyRequests.filter((req) => {
    if (requestCategoryFilter === 'reassign') return false;
    if (requestStatusFilter !== 'all' && req.status !== requestStatusFilter) return false;
    if (dutyTypeFilter !== 'all' && req.requestedStatus !== dutyTypeFilter) return false;
    if (requestSearchQuery.trim()) {
      const q = requestSearchQuery.toLowerCase();
      const matchName = req.employeeName.toLowerCase().includes(q);
      const matchEmpId = req.employeeId.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      const matchRole = req.role.toLowerCase().includes(q);
      if (!matchName && !matchEmpId && !matchReason && !matchRole) return false;
    }
    return true;
  });

  // Filtered Task Reassign Requests
  const filteredTaskReassignRequests = deptTaskReassignRequests.filter((req) => {
    if (requestCategoryFilter === 'duty') return false;
    if (requestStatusFilter === 'pending' && req.status !== 'pending') return false;
    if (requestStatusFilter === 'approved' && req.status !== 'reassigned') return false;
    if (requestStatusFilter === 'rejected' && req.status !== 'rejected') return false;
    if (requestSearchQuery.trim()) {
      const q = requestSearchQuery.toLowerCase();
      const matchName = req.requesterName.toLowerCase().includes(q);
      const matchEmpId = req.requesterEmployeeId.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      const matchTitle = req.taskTitle.toLowerCase().includes(q);
      const matchRef = (req.taskRef || '').toLowerCase().includes(q);
      if (!matchName && !matchEmpId && !matchReason && !matchTitle && !matchRef) return false;
    }
    return true;
  });

  // Handlers for Duty Requests
  const handleApproveDuty = (req: DutyStatusRequest) => {
    approveDutyStatusRequest(req.id);
    setActionSuccessNotice(`Approved duty status change to ${formatDutyStatus(req.requestedStatus)} for ${req.employeeName}`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const handleOpenRejectDutyModal = (req: DutyStatusRequest) => {
    setRejectingDutyRequest(req);
    setDutyRejectReason('');
    setDutyRejectionError('');
  };

  const handleConfirmRejectDuty = () => {
    if (!rejectingDutyRequest) return;
    if (!dutyRejectReason.trim()) {
      setDutyRejectionError('Please provide a reason for rejecting this request.');
      return;
    }
    rejectDutyStatusRequest(rejectingDutyRequest.id, dutyRejectReason.trim());
    setActionSuccessNotice(`Rejected duty change for ${rejectingDutyRequest.employeeName} with explanation sent.`);
    setRejectingDutyRequest(null);
    setDutyRejectReason('');
    setDutyRejectionError('');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Handlers for Task Reassign Requests
  const handleOpenReassignModal = (req: TaskReassignRequest) => {
    setReassigningRequest(req);
    // Auto-select first available same-dept colleague (excluding requester)
    const otherColleagues = fulfillers.filter((s) => s.employeeId !== req.requesterEmployeeId && s.id !== req.requesterStaffId);
    setSelectedNewAssigneeId(otherColleagues[0]?.id || otherColleagues[0]?.employeeId || '');
    setReassignSupervisorNote('');
    setReassignSelectionError('');
  };

  const handleConfirmReassign = () => {
    if (!reassigningRequest) return;
    if (!selectedNewAssigneeId) {
      setReassignSelectionError('Please choose a member from the same department.');
      return;
    }
    approveTaskReassignRequest(reassigningRequest.id, selectedNewAssigneeId, reassignSupervisorNote.trim());
    const targetStaff = fulfillers.find((s) => s.id === selectedNewAssigneeId || s.employeeId === selectedNewAssigneeId);
    setActionSuccessNotice(`Reassigned "${reassigningRequest.taskTitle}" to ${targetStaff?.name || 'department member'}.`);
    setReassigningRequest(null);
    setSelectedNewAssigneeId('');
    setReassignSupervisorNote('');
    setReassignSelectionError('');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const handleOpenRejectReassignModal = (req: TaskReassignRequest) => {
    setRejectingReassignRequest(req);
    setReassignRejectReason('');
    setReassignRejectError('');
  };

  const handleConfirmRejectReassign = () => {
    if (!rejectingReassignRequest) return;
    if (!reassignRejectReason.trim()) {
      setReassignRejectError('Please provide a reason for rejecting this reassignment request.');
      return;
    }
    rejectTaskReassignRequest(rejectingReassignRequest.id, reassignRejectReason.trim());
    setActionSuccessNotice(`Declined reassignment for ${rejectingReassignRequest.requesterName}. Attendant retained.`);
    setRejectingReassignRequest(null);
    setReassignRejectReason('');
    setReassignRejectError('');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  function formatDutyStatus(status: DutyStatusType) {
    switch (status) {
      case 'on_duty':
        return 'On Duty';
      case 'break':
        return 'Break';
      case 'off_duty':
        return 'Off Duty';
    }
  }

  function getDutyStatusBadge(status: DutyStatusType) {
    switch (status) {
      case 'on_duty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            On Duty
          </span>
        );
      case 'break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Coffee className="w-3 h-3 text-amber-400" />
            On Break
          </span>
        );
      case 'off_duty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <UserMinus className="w-3 h-3 text-slate-400" />
            Off Duty
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Section Switcher */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Team Management
                  {department && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                      {department}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review duty status and task reassignment requests from staff, and balance department capacity
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="inline-flex items-center p-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveSubTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'requests'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Requests</span>
              {totalPendingRequestsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeSubTab === 'requests'
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {totalPendingRequestsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('workload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'workload'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Team Workload</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {fulfillers.length} staff
              </span>
            </button>
          </div>
        </div>

        {/* Global Notice Toast */}
        {actionSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: REQUESTS (Duty Status + Task Reassignments)                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'requests' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Requests</span>
                <Inbox className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-bold text-white mt-2 font-mono">
                {deptDutyRequests.length + deptTaskReassignRequests.length}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{department ?? 'All departments'}</span>
            </div>

            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-medium">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-2 font-mono">{totalPendingRequestsCount}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-amber-400/80">
                <span>{pendingDutyCount} duty</span>
                <span>•</span>
                <span>{pendingReassignCount} reassign</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-sky-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-300 font-medium">Task Reassignments</span>
                <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-sky-400 mt-2 font-mono">
                {deptTaskReassignRequests.length}
              </p>
              <span className="text-[11px] text-sky-400/70 mt-0.5 block">From field attendants</span>
            </div>

            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">Resolved / Approved</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
                {deptDutyRequests.filter((r) => r.status === 'approved').length +
                  deptTaskReassignRequests.filter((r) => r.status === 'reassigned').length}
              </p>
              <span className="text-[11px] text-emerald-400/70 mt-0.5 block">Approved or Reassigned</span>
            </div>
          </div>

          {/* Search & Category Tabs & Filters */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            {/* Category Switcher: All vs Duty Status vs Task Reassignments */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="inline-flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRequestCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    requestCategoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Requests ({deptDutyRequests.length + deptTaskReassignRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestCategoryFilter('reassign')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    requestCategoryFilter === 'reassign'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Task Reassignments ({deptTaskReassignRequests.length})</span>
                  {pendingReassignCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                      {pendingReassignCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRequestCategoryFilter('duty')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    requestCategoryFilter === 'duty'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Duty Status ({deptDutyRequests.length})</span>
                  {pendingDutyCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                      {pendingDutyCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRequestStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                      requestStatusFilter === st
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'approved' ? 'Resolved' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar + Optional Type Filter */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by staff name, ID, task title, ref, or reason..."
                  value={requestSearchQuery}
                  onChange={(e) => setRequestSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
                {requestSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRequestSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {requestCategoryFilter !== 'reassign' && (
                <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-400 shrink-0">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span className="mr-2 text-slate-400">Target Duty:</span>
                  <select
                    aria-label="Filter by target duty status"
                    value={dutyTypeFilter}
                    onChange={(e) => setDutyTypeFilter(e.target.value as any)}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Duty Types</option>
                    <option value="break" className="bg-slate-900 text-white">Break</option>
                    <option value="off_duty" className="bg-slate-900 text-white">Off Duty</option>
                    <option value="on_duty" className="bg-slate-900 text-white">On Duty</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* List of Requests */}
          {filteredDutyRequests.length === 0 && filteredTaskReassignRequests.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No requests found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {requestSearchQuery || requestStatusFilter !== 'all' || dutyTypeFilter !== 'all'
                  ? 'Try adjusting your search query or filters to see more requests.'
                  : 'All staff duty status and task reassignment requests have been reviewed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. TASK REASSIGNMENT REQUESTS CARDS */}
              {filteredTaskReassignRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isReassigned = req.status === 'reassigned';
                const isRejected = req.status === 'rejected';

                return (
                  <div
                    key={req.id}
                    className={`bg-slate-900/90 rounded-2xl border transition-all duration-200 p-5 ${
                      isPending
                        ? 'border-sky-500/40 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/20'
                        : isReassigned
                        ? 'border-emerald-500/20 hover:border-emerald-500/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Requester & Task Reassign Details */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                          <ArrowRightLeft className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              Task Reassign Request
                            </span>
                            <span className="text-[11px] font-mono font-bold text-amber-300">
                              {req.taskRef || req.taskId}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                req.priority === 'critical' || req.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : req.priority === 'vip'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              {req.priority}
                            </span>
                            {req.room && (
                              <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-300" />
                                {req.room}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-white mt-1">{req.taskTitle}</h3>

                          {/* Requester Identity Strip */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>Requested by:</span>
                            <strong className="text-white">{req.requesterName}</strong>
                            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                              {req.requesterEmployeeId}
                            </span>
                            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              {req.department}
                            </span>
                            <span className="text-slate-500 text-[11px] ml-auto">
                              Submitted {req.submittedAt}
                            </span>
                          </div>

                          {/* Reassign Reason Note */}
                          <div className="mt-2.5 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <span className="text-sky-300 font-semibold">Attendant Reassign Reason: </span>
                                <span className="text-slate-200">{req.reason}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reassigned Stamp */}
                          {isReassigned && (
                            <div className="mt-2.5 p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Reassigned to same-department member: </span>
                                <strong className="text-white">{req.reassignedToName || 'Colleague'}</strong>
                                {req.supervisorNotes && (
                                  <p className="text-[11px] text-emerald-400/80 mt-0.5 italic">
                                    "{req.supervisorNotes}"
                                  </p>
                                )}
                                <span className="block text-[10px] text-emerald-400/70 mt-1 font-mono">
                                  Approved by {req.reviewedBy || 'Supervisor'} · {req.reviewedAt || 'recently'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Rejected Stamp */}
                          {isRejected && (
                            <div className="mt-2.5 p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Reassignment Request Declined: </span>
                                <span className="text-rose-200">{req.supervisorNotes || 'Task retained on attendant.'}</span>
                                <span className="block text-[10px] text-rose-400/70 mt-1 font-mono">
                                  Reviewed by {req.reviewedBy || 'Supervisor'} · {req.reviewedAt || 'recently'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex items-center gap-2 pt-2 lg:pt-0 border-t border-slate-800 lg:border-t-0">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenReassignModal(req)}
                              className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                              title="Reassign to another colleague from the same department"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              Reassign
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectReassignModal(req)}
                              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                              title="Decline reassignment request and retain current attendant"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        ) : isReassigned ? (
                          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Reassigned
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" />
                            Declined
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 2. DUTY STATUS REQUESTS CARDS */}
              {filteredDutyRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';

                return (
                  <div
                    key={req.id}
                    className={`bg-slate-900/90 rounded-2xl border transition-all duration-200 p-5 ${
                      isPending
                        ? 'border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                        : isApproved
                        ? 'border-emerald-500/20 hover:border-emerald-500/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Employee Info & Request Transition */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {req.avatar ? (
                            <img
                              src={req.avatar}
                              alt={req.employeeName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-800"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-extrabold flex items-center justify-center text-sm">
                              {req.employeeName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                              req.currentStatus === 'on_duty'
                                ? 'bg-emerald-500'
                                : req.currentStatus === 'break'
                                ? 'bg-amber-500'
                                : 'bg-slate-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Duty Status Change
                            </span>
                            <h3 className="text-sm font-bold text-white">{req.employeeName}</h3>
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                              {req.employeeId}
                            </span>
                            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                              {req.role}
                            </span>
                            <span className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              {req.department}
                            </span>
                          </div>

                          {/* Status Transition Row */}
                          <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
                            <span className="text-slate-400">Current:</span>
                            {getDutyStatusBadge(req.currentStatus)}
                            <span className="text-amber-400 font-bold">→</span>
                            <span className="text-slate-400 font-medium">Requested:</span>
                            {getDutyStatusBadge(req.requestedStatus)}
                            <span className="text-slate-500 text-[11px] ml-auto">
                              Submitted {req.submittedAt}
                            </span>
                          </div>

                          {/* Reason Box */}
                          <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <span className="text-slate-400 font-medium">Employee note: </span>
                                <span className="text-slate-200">{req.reason}</span>
                              </div>
                            </div>
                          </div>

                          {/* Supervisor Rejection Feedback (if rejected) */}
                          {isRejected && req.supervisorReviewNotes && (
                            <div className="mt-2.5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                                <div className="text-xs">
                                  <span className="text-rose-400 font-bold">Rejection Reason from Supervisor: </span>
                                  <span className="text-rose-200">{req.supervisorReviewNotes}</span>
                                  {req.reviewedBy && (
                                    <span className="block text-[10px] text-rose-400/70 mt-1 font-mono">
                                      Reviewed by {req.reviewedBy} at {req.reviewedAt}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Approved Stamp */}
                          {isApproved && (
                            <div className="mt-2 text-[11px] text-emerald-400/90 font-mono flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              Approved by {req.reviewedBy ?? 'Supervisor'} at {req.reviewedAt ?? 'recently'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="shrink-0 flex items-center gap-2 pt-2 lg:pt-0 border-t border-slate-800 lg:border-t-0">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveDuty(req)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectDutyModal(req)}
                              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        ) : isApproved ? (
                          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: TEAM WORKLOAD (Preserved Workload Board)                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'workload' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner & Rebalance Action */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-xl font-bold font-display text-white">
                  Field Team Workload & Capacity Board
                </h1>
              </div>
              <p className="text-xs text-mist-300 mt-1">
                Configure individual attendant task capacities (1–20), monitor saturation in real-time, and balance queues dynamically.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRebalance}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>1-Click Rebalance Workload</span>
              </button>
            </div>
          </div>

          {/* Filter and Overview Metrics */}
          <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-200 text-xs font-semibold flex items-center gap-2">
                <span>{department ? `${department} Field Attendants` : 'Field Attendants'}</span>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                  {fulfillers.length}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-mist-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Available (&lt;60%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Moderate (60-80%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Overloaded / At Cap (&gt;80%)
              </span>
            </div>
          </div>

          {/* Staff Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFulfillers.map((staff) => {
              const activeTasks = getFulfillerTasks(staff.employeeId, staff.name);
              const maxLoad = staff.maxWorkload || 5;
              const remainingCapacity = Math.max(0, maxLoad - activeTasks.length);
              const percentage = Math.round((activeTasks.length / maxLoad) * 100);
              const isFull = activeTasks.length >= maxLoad;
              const isHeavy = percentage >= 80;
              const isModerate = percentage >= 60 && percentage < 80;
              const isUnavailable = staff.availability && staff.availability !== 'on_duty';

              return (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaffModal(staff)}
                  className={`rounded-3xl border bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 transition cursor-pointer hover:border-amber-400/50 hover:shadow-2xl hover:scale-[1.01] ${
                    isFull
                      ? 'border-rose-500/30 ring-1 ring-rose-500/10'
                      : 'border-white/10'
                  }`}
                  title="Click to view employee details and assigned tasks"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 font-extrabold flex items-center justify-center text-xs">
                          {staff.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{staff.name}</h3>
                            {isFull && (
                              <span className="rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[9px] font-extrabold px-1.5 py-0.2 uppercase">
                                Overloaded
                              </span>
                            )}
                            {isUnavailable && (
                              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 uppercase">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-mist-400">
                            {staff.employeeId} · {staff.department}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold select-none cursor-default ${
                          staff.availability === 'break'
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : staff.availability === 'off_duty'
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        }`}
                        title="Duty status is managed directly by the employee"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            staff.availability === 'break'
                              ? 'bg-amber-400'
                              : staff.availability === 'off_duty'
                              ? 'bg-rose-400'
                              : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        <span>
                          {staff.availability === 'break'
                            ? 'On Break'
                            : staff.availability === 'off_duty'
                            ? 'Off Duty'
                            : 'On Duty'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-mist-400 border-t border-white/[0.04] pt-2">
                      <span className="flex items-center gap-1 font-medium text-white">
                        <MapPin className="h-3.5 w-3.5 text-amber-300" />
                        {staff.floorZone}
                      </span>
                      <span>{staff.shift} Shift</span>
                    </div>

                    {staff.skills && staff.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {staff.skills.map((sk) => (
                          <span
                            key={sk}
                            className="rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-mist-300 px-2 py-0.5"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-mist-400">Current Workload: </span>
                          <strong
                            className={`font-mono ${
                              isFull ? 'text-rose-400' : isModerate ? 'text-amber-300' : 'text-emerald-400'
                            }`}
                          >
                            {activeTasks.length} / {maxLoad} Tasks
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCapacityModal(staff);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
                          title="Configure individual max concurrent task capacity"
                        >
                          <SlidersHorizontal className="h-3 w-3 text-amber-300" />
                          <span>Edit Limit</span>
                        </button>
                      </div>

                      <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-rose-500' : isHeavy ? 'bg-rose-400' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-mist-400 font-mono">
                        <span>Remaining capacity:</span>
                        <strong className={remainingCapacity === 0 ? 'text-rose-400 font-bold' : 'text-emerald-300'}>
                          {remainingCapacity === 0 ? '0 slots (Full)' : `${remainingCapacity} available`}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 block">
                        Active Tasks in Queue ({activeTasks.length})
                      </span>
                      {activeTasks.length === 0 ? (
                        <p className="text-[11px] text-mist-500 italic py-1">
                          No active tasks currently assigned. Ready for immediate dispatch.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                          {activeTasks.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-ink-950/60 border border-white/[0.04] text-xs hover:border-white/10 transition"
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-white truncate text-[11px]">{t.title}</p>
                                <span className="text-[10px] text-mist-400 font-mono">
                                  {t.ref} · {t.status}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReassignModalTask(t);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-amber-400/30 bg-amber-400/10 text-[10px] font-bold text-amber-300 hover:bg-amber-400/20 transition shrink-0 flex items-center gap-1 cursor-pointer"
                                title="Reassign this task"
                              >
                                <UserCheck className="h-3 w-3" />
                                <span>Reassign</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] text-mist-400 font-mono">
                        {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'} assigned
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffModal(staff);
                        }}
                        className="text-xs font-bold text-amber-300 hover:text-amber-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Details & Tasks</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TASK REASSIGNMENT MODAL (Same Department Members Only)            */}
      {/* ========================================================================= */}
      {reassigningRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setReassigningRequest(null);
                setSelectedNewAssigneeId('');
                setReassignSupervisorNote('');
                setReassignSelectionError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reassign Task to Colleague</h3>
                <p className="text-xs text-slate-400">
                  Select a team member from <strong className="text-amber-300">{department || reassigningRequest.department}</strong>
                </p>
              </div>
            </div>

            {/* Task Info Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 mb-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Task Title:</span>
                <span className="text-white font-bold">{reassigningRequest.taskTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Assignee:</span>
                <span className="text-slate-200">
                  {reassigningRequest.requesterName} ({reassigningRequest.requesterEmployeeId})
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-400 shrink-0">Reason:</span>
                <span className="text-sky-300 italic text-right max-w-xs truncate">
                  "{reassigningRequest.reason}"
                </span>
              </div>
            </div>

            {/* Same Department Staff List */}
            <div className="space-y-2 mb-4">
              <label className="block text-xs font-semibold text-slate-200">
                Choose Same-Department Attendant <span className="text-rose-400">*</span>
              </label>

              {fulfillers.filter((s) => s.employeeId !== reassigningRequest.requesterEmployeeId).length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  No other staff members found in this department.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fulfillers
                    .filter((s) => s.employeeId !== reassigningRequest.requesterEmployeeId)
                    .map((colleague) => {
                      const activeCount = getFulfillerTasks(colleague.employeeId, colleague.name).length;
                      const isSelected = selectedNewAssigneeId === colleague.id || selectedNewAssigneeId === colleague.employeeId;

                      return (
                        <div
                          key={colleague.id}
                          onClick={() => {
                            setSelectedNewAssigneeId(colleague.id);
                            if (reassignSelectionError) setReassignSelectionError('');
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-400 ring-1 ring-sky-400 text-white'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center">
                              {colleague.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{colleague.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {colleague.employeeId} · Shift: {colleague.shift} · Zone: {colleague.floorZone}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {activeCount} / {colleague.maxWorkload || 5} Active
                            </span>
                            <span
                              className={`block text-[10px] font-bold mt-0.5 ${
                                colleague.availability === 'break'
                                  ? 'text-amber-400'
                                  : colleague.availability === 'off_duty'
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {colleague.availability?.replace('_', ' ') || 'on duty'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {reassignSelectionError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {reassignSelectionError}
                </p>
              )}
            </div>

            {/* Optional Supervisor Note */}
            <div className="space-y-1.5 mb-5">
              <label className="block text-xs font-semibold text-slate-200">
                Supervisor Reassignment Note (Optional)
              </label>
              <textarea
                rows={2}
                value={reassignSupervisorNote}
                onChange={(e) => setReassignSupervisorNote(e.target.value)}
                placeholder="e.g., Reassigned to balance 4th floor checkout rush."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setReassigningRequest(null);
                  setSelectedNewAssigneeId('');
                  setReassignSupervisorNote('');
                  setReassignSelectionError('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Confirm Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT TASK REASSIGNMENT MODAL                                   */}
      {/* ========================================================================= */}
      {rejectingReassignRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setRejectingReassignRequest(null);
                setReassignRejectReason('');
                setReassignRejectError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Decline Task Reassignment</h3>
                <p className="text-xs text-slate-400">
                  Retain {rejectingReassignRequest.requesterName} on "{rejectingReassignRequest.taskTitle}"
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Reason for Declining Reassignment <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={reassignRejectReason}
                onChange={(e) => {
                  setReassignRejectReason(e.target.value);
                  if (reassignRejectError) setReassignRejectError('');
                }}
                placeholder="e.g., Other attendants are currently engaged with checkout cleans. Please proceed with this task or notify supervisor if immediate assistance is required."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
              />
              {reassignRejectError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {reassignRejectError}
                </p>
              )}

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'All other department members are at maximum workload capacity.',
                    'Task is already past acknowledgment SLA; immediate on-site action needed.',
                    'Requested tool/kit is available in the Floor service closet.',
                    'Please complete this guest request before taking scheduled break.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReassignRejectReason(preset)}
                      className="text-[10px] px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 transition-colors text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectingReassignRequest(null);
                  setReassignRejectReason('');
                  setReassignRejectError('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectReassign}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REJECT DUTY STATUS MODAL                                         */}
      {/* ========================================================================= */}
      {rejectingDutyRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setRejectingDutyRequest(null);
                setDutyRejectReason('');
                setDutyRejectionError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Duty Status Request</h3>
                <p className="text-xs text-slate-400">
                  Provide a clear explanation for {rejectingDutyRequest.employeeName}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Staff:</span>
                <span className="text-white font-medium">
                  {rejectingDutyRequest.employeeName} ({rejectingDutyRequest.employeeId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Transition:</span>
                <span className="text-amber-400 font-medium">
                  {formatDutyStatus(rejectingDutyRequest.currentStatus)} → {formatDutyStatus(rejectingDutyRequest.requestedStatus)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Employee Note:</span>
                <span className="text-slate-300 italic truncate max-w-[280px]">"{rejectingDutyRequest.reason}"</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Reason for Rejection <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={dutyRejectReason}
                onChange={(e) => {
                  setDutyRejectReason(e.target.value);
                  if (dutyRejectionError) setDutyRejectionError('');
                }}
                placeholder="e.g., High guest checkout volume from 11:00-13:00 requires full staff coverage. Please reschedule your break after 13:00."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
              />
              {dutyRejectionError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {dutyRejectionError}
                </p>
              )}

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'High occupancy period; minimum floor coverage required.',
                    'Urgent VIP room turnover pending in your zone.',
                    'Another team member is already on scheduled break.',
                    'Please coordinate with supervisor for shift coverage first.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDutyRejectReason(preset)}
                      className="text-[10px] px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 transition-colors text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectingDutyRequest(null);
                  setDutyRejectReason('');
                  setDutyRejectionError('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectDuty}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Individual Capacity Modal */}
      {editingCapacityStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="capacity-modal-title"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="capacity-modal-title" className="text-base font-bold font-display text-white">
                    Set Max Task Capacity
                  </h2>
                  <p className="text-xs text-mist-400">
                    {editingCapacityStaff.name} ({editingCapacityStaff.employeeId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCapacityStaff(null)}
                className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-mist-300 leading-relaxed">
                Configure the maximum concurrent tasks this employee can hold before being marked as overloaded and excluded from automated auto-routing.
              </p>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-2">
                  Concurrent Active Task Limit (1 – 20 tasks):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCapacityInput((prev) => Math.max(1, prev - 1))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-lg font-bold hover:bg-white/10 text-white transition flex items-center justify-center cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    className="flex-1 h-10 rounded-xl border border-white/10 bg-black/40 text-center font-mono text-lg font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCapacityInput((prev) => Math.min(20, prev + 1))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] text-lg font-bold hover:bg-white/10 text-white transition flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-mist-400 uppercase font-bold tracking-wider">Quick Presets:</span>
                <div className="flex gap-2">
                  {[3, 5, 8, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCapacityInput(preset)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer ${
                        capacityInput === preset
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEditingCapacityStaff(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCapacity}
                className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Save Capacity Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details & Assigned Tasks Modal */}
      {selectedStaffModal && (() => {
        const staff = selectedStaffModal;
        const tasks = getFulfillerTasks(staff.employeeId, staff.name);
        const maxLoad = staff.maxWorkload || 5;
        const remainingCapacity = Math.max(0, maxLoad - tasks.length);
        const percentage = Math.round((tasks.length / maxLoad) * 100);
        const isFull = tasks.length >= maxLoad;
        const isHeavy = percentage >= 80;
        const isModerate = percentage >= 60 && percentage < 80;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
              <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6 bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-extrabold flex items-center justify-center text-sm shadow-inner">
                    {staff.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 id="employee-modal-title" className="text-lg font-bold font-display text-white">
                        {staff.name}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          staff.availability === 'break'
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : staff.availability === 'off_duty'
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            staff.availability === 'break'
                              ? 'bg-amber-400'
                              : staff.availability === 'off_duty'
                              ? 'bg-rose-400'
                              : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        {staff.availability === 'break'
                          ? 'On Break'
                          : staff.availability === 'off_duty'
                          ? 'Off Duty'
                          : 'On Duty'}
                      </span>
                    </div>
                    <p className="text-xs text-mist-400 font-mono mt-0.5">
                      {staff.employeeId} · {staff.department} · {staff.shift} Shift · Zone: {staff.floorZone}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStaffModal(null)}
                  className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-mist-400">Current Workload: </span>
                      <strong
                        className={`font-mono text-sm ${
                          isFull ? 'text-rose-400' : isModerate ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        {tasks.length} / {maxLoad} Tasks ({percentage}%)
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-semibold ${remainingCapacity === 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                        {remainingCapacity === 0 ? 'Capacity Full' : `${remainingCapacity} slots remaining`}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCapacityModal(staff)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
                      >
                        <SlidersHorizontal className="h-3 w-3 text-amber-300" />
                        <span>Edit Limit</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : isHeavy ? 'bg-rose-400' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  {staff.skills && staff.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-mist-400 mr-1">Skills:</span>
                      {staff.skills.map((sk) => (
                        <span
                          key={sk}
                          className="rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-mist-300 px-2 py-0.5"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-mist-300 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-amber-300" />
                      <span>Assigned Tasks ({tasks.length})</span>
                    </h3>
                    <span className="text-xs text-mist-400">
                      Reassign any task to another attendant
                    </span>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center text-mist-400 space-y-2">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400/60" />
                      <p className="font-semibold text-white text-sm">No Active Tasks Assigned</p>
                      <p className="text-xs text-mist-500 max-w-xs mx-auto">
                        This attendant currently has no queued tasks and is ready for immediate work orders.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-white/[0.08] bg-ink-950/70 p-3.5 sm:p-4 hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs text-amber-300">
                                {t.ref || t.id.slice(0, 8)}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  t.priority === 'critical' || t.priority === 'safety' || t.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : t.priority === 'vip'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-white/10 text-mist-300'
                                }`}
                              >
                                {t.priority || 'Normal'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono text-mist-300">
                                {t.status}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-white truncate">{t.title}</h4>

                            {(t.description || t.meta) && (
                              <p className="text-xs text-mist-400 line-clamp-2">
                                {t.description || t.meta}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-mist-400 pt-1 font-mono">
                              <span className="flex items-center gap-1 text-white">
                                <MapPin className="h-3 w-3 text-amber-300" />
                                {t.room ? `Room ${t.room}` : 'Property'}
                              </span>
                              {t.slaDue && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-mist-400" />
                                  Target SLA: {t.slaDue}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="sm:pl-3 sm:border-l border-white/[0.08] flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={() => setReassignModalTask(t)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-400/40 bg-amber-400/10 text-xs font-bold text-amber-300 hover:bg-amber-400/20 hover:border-amber-400/70 transition cursor-pointer shadow-sm active:scale-95"
                              title="Reassign this task to another attendant"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Reassign Task</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/[0.08] p-4 bg-white/[0.02] flex items-center justify-between text-xs text-mist-400">
                <span>{tasks.length} active work orders</span>
                <button
                  type="button"
                  onClick={() => setSelectedStaffModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reassign Modal */}
      {reassignModalTask && (
        <AssignTaskModal
          task={reassignModalTask}
          department={department}
          lockDepartment={true}
          onClose={() => setReassignModalTask(null)}
        />
      )}
    </div>
  );
}
