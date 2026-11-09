'use client';

import { useState, useMemo } from 'react';
import {
  Flame,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  User,
  MapPin,
  Camera,
  Star,
  Send,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  X,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Maximize2,
  FileText,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, SupervisorEscalationRecord, DispatcherDepartment } from '@/types/demo';
import { EscalateIssueModal } from '@/components/supervisor/EscalateIssueModal';

interface DispatcherEscalationsTabProps {
  department: DispatcherDepartment;
  tasks?: WorkItem[];
  onOpenEscalateModal?: () => void;
}

export function DispatcherEscalationsTab({
  department,
  tasks: propTasks,
  onOpenEscalateModal,
}: DispatcherEscalationsTabProps) {
  const {
    state,
    resolveFulfillerBlocker,
    acknowledgeSupervisorTask,
    rejectFulfillerTask,
    createSupervisorEscalation,
    updateSupervisorEscalationStatus,
    escalateSupervisorIssue,
  } = useDemo();

  // Top-level navigation: "For Me" (from fulfillers) vs "From Me" (to Dept Manager)
  const [activeSubTab, setActiveSubTab] = useState<'for_me' | 'from_me'>('for_me');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fromMeStatusFilter, setFromMeStatusFilter] = useState<'all' | 'Not Viewed' | 'Acknowledged' | 'Rejected'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'urgent' | 'normal'>('all');

  // Dialog States for "For Me"
  const [detailModalTask, setDetailModalTask] = useState<WorkItem | null>(null);
  const [rejectModalTask, setRejectModalTask] = useState<WorkItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [resolveModalTask, setResolveModalTask] = useState<WorkItem | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Dedicated Escalate Task Modal State
  const [escalateTaskTarget, setEscalateTaskTarget] = useState<WorkItem | null>(null);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  // Dialog States for "From Me"
  const [detailModalEscalation, setDetailModalEscalation] = useState<SupervisorEscalationRecord | null>(null);
  const [managerReviewModalEsc, setManagerReviewModalEsc] = useState<SupervisorEscalationRecord | null>(null);
  const [simulatedManagerStatus, setSimulatedManagerStatus] = useState<'Not Viewed' | 'Acknowledged' | 'Rejected'>('Acknowledged');
  const [simulatedManagerNote, setSimulatedManagerNote] = useState('');

  // -------------------------------------------------------------
  // Filter Tasks for "For Me"
  // -------------------------------------------------------------
  const allTasks = propTasks ?? [
    ...(state.items.department_dispatcher_supervisor ?? []),
    ...(state.items.department_dispatcher ?? []),
  ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  // Active fulfiller escalations / blockers
  const forMeTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const isBlocked =
        t.status === 'Blocked' ||
        t.reassignPending === true ||
        t.status === 'Reassignment requested' ||
        !!t.blockerReason ||
        (t.history && t.history[t.history.length - 1]?.status === 'Blocked');

      if (!isBlocked) return false;

      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchRef = (t.ref || '').toLowerCase().includes(q);
        const matchRoom = (t.room || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
        const matchReason = (t.blockerReason || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchRoom && !matchAssignee && !matchReason) return false;
      }

      return true;
    });
  }, [allTasks, priorityFilter, searchQuery]);

  // -------------------------------------------------------------
  // Filter Escalations for "From Me"
  // -------------------------------------------------------------
  const isEscInActiveDept = (esc: SupervisorEscalationRecord) => {
    const escDept = (esc.department || '').toLowerCase();
    const curr = department.toLowerCase();
    if (curr.includes('house')) return escDept.includes('house');
    if (curr.includes('well') || curr.includes('spa')) return escDept.includes('well') || escDept.includes('spa');
    if (curr.includes('maint') || curr.includes('eng')) return escDept.includes('maint') || escDept.includes('eng');
    if (curr.includes('food') || curr.includes('bev') || curr.includes('f&b')) {
      return escDept.includes('food') || escDept.includes('bev') || escDept.includes('f&b');
    }
    return true;
  };

  const rawSupervisorEscalations = state.supervisorEscalations ?? [];

  const fromMeEscalations = useMemo(() => {
    return rawSupervisorEscalations.filter(isEscInActiveDept).filter((esc) => {
      if (fromMeStatusFilter !== 'all' && esc.status !== fromMeStatusFilter) return false;

      if (priorityFilter !== 'all' && esc.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (esc.title || '').toLowerCase().includes(q);
        const matchRef = (esc.taskRef || '').toLowerCase().includes(q);
        const matchRoom = (esc.room || '').toLowerCase().includes(q);
        const matchReason = (esc.reason || '').toLowerCase().includes(q);
        const matchNotes = (esc.notes || '').toLowerCase().includes(q);
        const matchReview = (esc.managerReview || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchRoom && !matchReason && !matchNotes && !matchReview) return false;
      }

      return true;
    });
  }, [rawSupervisorEscalations, department, fromMeStatusFilter, priorityFilter, searchQuery]);

  const activeDepartmentEscalations = useMemo(() => {
    return rawSupervisorEscalations.filter(isEscInActiveDept);
  }, [rawSupervisorEscalations, department]);

  const countNotViewed = activeDepartmentEscalations.filter((e) => e.status === 'Not Viewed').length;
  const countAcknowledged = activeDepartmentEscalations.filter((e) => e.status === 'Acknowledged').length;
  const countRejected = activeDepartmentEscalations.filter((e) => e.status === 'Rejected').length;

  // -------------------------------------------------------------
  // Handlers for "For Me"
  // -------------------------------------------------------------
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalTask) return;
    rejectFulfillerTask(
      rejectModalTask.id,
      rejectReason.trim() || 'Escalation declined by Supervisor: proceed with standard operating procedure.',
    );
    setRejectModalTask(null);
    setRejectReason('');
    if (detailModalTask?.id === rejectModalTask.id) {
      setDetailModalTask(null);
    }
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalTask) return;
    resolveFulfillerBlocker(
      resolveModalTask.id,
      resolveNote.trim() || 'Blocker addressed and cleared by Supervisor',
      'In progress',
    );
    setResolveModalTask(null);
    setResolveNote('');
    if (detailModalTask?.id === resolveModalTask.id) {
      setDetailModalTask(null);
    }
  };

  const handleTriggerEscalateTask = (task: WorkItem) => {
    setEscalateTaskTarget(task);
    setIsEscalateModalOpen(true);
  };

  const handleConfirmEscalation = (issue: {
    department?: string;
    title: string;
    room?: string;
    priority: 'urgent' | 'critical';
    reason: string;
    notes?: string;
    photoUrl?: string;
    taskId?: string;
    taskRef?: string;
  }) => {
    const escDept = issue.department || department;
    const taskRef = issue.taskRef || escalateTaskTarget?.ref || `ESC-${Date.now().toString().slice(-4)}`;

    createSupervisorEscalation({
      taskId: issue.taskId || escalateTaskTarget?.id,
      taskRef,
      title: issue.title,
      department: escDept,
      room: issue.room,
      priority: issue.priority,
      reason: issue.reason,
      notes: issue.notes,
      photoUrl: issue.photoUrl || escalateTaskTarget?.photoUrl,
      fulfillerName: escalateTaskTarget?.assignee || 'Attendant',
      escalatedBy: 'Meera Nambiar (Supervisor)',
      escalatedAt: 'Just now',
      status: 'Not Viewed',
    });

    escalateSupervisorIssue({
      department: escDept,
      title: issue.title,
      room: issue.room,
      priority: issue.priority,
      reason: issue.reason,
      notes: issue.notes,
    });

    setIsEscalateModalOpen(false);
    setEscalateTaskTarget(null);
    if (detailModalTask) setDetailModalTask(null);
    // Switch to "From Me" so user immediately sees the escalated task under "Not Viewed"
    setActiveSubTab('from_me');
    setFromMeStatusFilter('all');
  };

  // -------------------------------------------------------------
  // Handlers for "From Me" (Simulate Manager Review / Update)
  // -------------------------------------------------------------
  const handleManagerReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerReviewModalEsc) return;

    let defaultReview = '';
    if (simulatedManagerStatus === 'Acknowledged') {
      defaultReview = `Acknowledged by Marcus Vance (Dept Manager): Approved emergency operational action. Task prioritized.`;
    } else if (simulatedManagerStatus === 'Rejected') {
      defaultReview = `Rejected by Marcus Vance (Dept Manager): Request declined after review. Please follow internal departmental shift protocol.`;
    } else {
      defaultReview = '';
    }

    updateSupervisorEscalationStatus(
      managerReviewModalEsc.id,
      simulatedManagerStatus,
      simulatedManagerNote.trim() || defaultReview || undefined,
    );
    setManagerReviewModalEsc(null);
    setSimulatedManagerNote('');
    if (detailModalEscalation?.id === managerReviewModalEsc.id) {
      setDetailModalEscalation(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* TOP HEADER STRIP                                          */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
              <Flame className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display text-white flex items-center gap-2">
                <span>{department} Escalations</span>
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/[0.06] text-mist-300 border border-white/10">
                  Dispatcher / Supervisor
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-mist-300">
            Adjudicate field fulfiller blockers under <strong>For Me</strong>, and monitor Department Manager escalation decisions under <strong>From Me</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEscalateTaskTarget(null);
              setIsEscalateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-rose-500/20 transition flex items-center gap-2"
          >
            <Flame className="h-4 w-4" />
            <span>Escalate New Issue to Dept Mgr</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TWO-OPTION SUB-TAB SELECTOR: "For Me" and "From Me"       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-3xl bg-ink-950/70 border border-white/10 backdrop-blur-md">
        {/* TAB 1: FOR ME */}
        <button
          type="button"
          onClick={() => setActiveSubTab('for_me')}
          className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 ${
            activeSubTab === 'for_me'
              ? 'bg-ink-800 text-white border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'text-mist-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl border ${
                activeSubTab === 'for_me'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-white/[0.04] text-mist-400 border-white/10'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">For Me</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {forMeTasks.length}
                </span>
              </div>
              <p className="text-xs text-mist-400">
                Issues & blockers reported by task fulfillers
              </p>
            </div>
          </div>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              activeSubTab === 'for_me' ? 'text-rose-400 translate-x-0.5' : 'text-mist-600'
            }`}
          />
        </button>

        {/* TAB 2: FROM ME */}
        <button
          type="button"
          onClick={() => setActiveSubTab('from_me')}
          className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 ${
            activeSubTab === 'from_me'
              ? 'bg-ink-800 text-white border border-amber-400/40 shadow-lg shadow-amber-400/10'
              : 'text-mist-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl border ${
                activeSubTab === 'from_me'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : 'bg-white/[0.04] text-mist-400 border-white/10'
              }`}
            >
              <Send className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">From Me</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  {activeDepartmentEscalations.length}
                </span>
                {countNotViewed > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 animate-pulse">
                    {countNotViewed} Not Viewed
                  </span>
                )}
              </div>
              <p className="text-xs text-mist-400">
                Escalations sent to Department Manager
              </p>
            </div>
          </div>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              activeSubTab === 'from_me' ? 'text-amber-400 translate-x-0.5' : 'text-mist-600'
            }`}
          />
        </button>
      </div>

      {/* ========================================================= */}
      {/* SEARCH AND FILTERS BAR                                    */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-ink-900/60 border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'for_me'
                ? 'Search by task ref (HK-CHUTE), room, title, or fulfiller name...'
                : 'Search escalation ref (ESC-HK-301), room, reason, or manager review...'
            }
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* DROPDOWN MENUS FOR FROM ME: Priorities & Status */}
        {activeSubTab === 'from_me' && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {/* Priority Dropdown Menu */}
            <div className="flex items-center gap-1.5 bg-ink-950/80 px-2.5 py-1.5 rounded-2xl border border-white/10 shadow-sm">
              <label htmlFor="from-me-priority-dropdown" className="text-xs font-semibold text-mist-300 pl-1 flex items-center gap-1.5 shrink-0">
                <Filter className="h-3.5 w-3.5 text-amber-400" />
                <span>Priority:</span>
              </label>
              <div className="relative">
                <select
                  id="from-me-priority-dropdown"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="appearance-none rounded-xl border border-white/10 bg-ink-900 pl-3 pr-7 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer hover:border-white/20 transition shadow-inner"
                >
                  <option value="all" className="bg-ink-950 text-white">All Priorities</option>
                  <option value="critical" className="bg-ink-950 text-rose-300 font-bold">Critical Priority</option>
                  <option value="urgent" className="bg-ink-950 text-amber-300 font-bold">Urgent Priority</option>
                  <option value="normal" className="bg-ink-950 text-mist-200">Normal Priority</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-mist-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status Dropdown Menu */}
            <div className="flex items-center gap-1.5 bg-ink-950/80 px-2.5 py-1.5 rounded-2xl border border-white/10 shadow-sm">
              <label htmlFor="from-me-status-dropdown" className="text-xs font-semibold text-mist-300 pl-1 flex items-center gap-1.5 shrink-0">
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>Status:</span>
              </label>
              <div className="relative">
                <select
                  id="from-me-status-dropdown"
                  value={fromMeStatusFilter}
                  onChange={(e) => setFromMeStatusFilter(e.target.value as any)}
                  className="appearance-none rounded-xl border border-white/10 bg-ink-900 pl-3 pr-7 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer hover:border-white/20 transition shadow-inner"
                >
                  <option value="all" className="bg-ink-950 text-white">All Statuses ({activeDepartmentEscalations.length})</option>
                  <option value="Not Viewed" className="bg-ink-950 text-amber-300 font-bold">Not Viewed ({countNotViewed})</option>
                  <option value="Acknowledged" className="bg-ink-950 text-emerald-300 font-bold">Acknowledged ({countAcknowledged})</option>
                  <option value="Rejected" className="bg-ink-950 text-rose-300 font-bold">Rejected ({countRejected})</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-mist-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Priority Dropdown Menu for "For Me" */}
        {activeSubTab === 'for_me' && (
          <div className="flex items-center gap-1.5 bg-ink-950/80 px-2.5 py-1.5 rounded-2xl border border-white/10 shadow-sm shrink-0">
            <label htmlFor="for-me-priority-dropdown" className="text-xs font-semibold text-mist-300 pl-1 flex items-center gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5 text-rose-400" />
              <span>Priority:</span>
            </label>
            <div className="relative">
              <select
                id="for-me-priority-dropdown"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="appearance-none rounded-xl border border-white/10 bg-ink-900 pl-3 pr-7 py-1 text-xs font-bold text-white focus:outline-none focus:border-rose-400 cursor-pointer hover:border-white/20 transition shadow-inner"
              >
                <option value="all" className="bg-ink-950 text-white">All Priorities</option>
                <option value="critical" className="bg-ink-950 text-rose-300 font-bold">Critical Priority</option>
                <option value="urgent" className="bg-ink-950 text-amber-300 font-bold">Urgent Priority</option>
                <option value="normal" className="bg-ink-950 text-mist-200">Normal Priority</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-mist-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: "FOR ME" (Task Fulfiller Escalations)              */}
      {/* ========================================================= */}
      {activeSubTab === 'for_me' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-mist-400 px-1">
            <span className="font-medium">
              Showing <strong>{forMeTasks.length}</strong> fulfiller escalation{forMeTasks.length === 1 ? '' : 's'} in {department}
            </span>
            <span className="text-mist-500 font-mono text-[11px]">
              Click card or &ldquo;View Details&rdquo; for full pictures & review
            </span>
          </div>

          {forMeTasks.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/10 bg-ink-900/60 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-base text-white">No Active Fulfiller Escalations</h3>
              <p className="text-xs text-mist-400 max-w-md mx-auto">
                All room attendants, runners, and technicians in <strong>{department}</strong> are currently operating without reported blockers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {forMeTasks.map((task) => {
                const hasPhoto = !!task.photoUrl || (task.attachments && task.attachments.length > 0);
                const hasReview = !!task.review || !!task.feedback || !!task.notes;
                const fulfillerName = task.assignee || 'Field Attendant';
                const blockerText =
                  task.blockerReason ||
                  task.history?.find((h) => h.status === 'Blocked')?.note ||
                  'Operational impediment reported';

                return (
                  <div
                    key={task.id}
                    className="group relative rounded-2xl border border-white/10 bg-ink-900/80 p-4 md:p-5 backdrop-blur-xl hover:border-rose-500/40 hover:bg-ink-900 transition-all shadow-md space-y-3"
                  >
                    {/* Top Row: Ref, Room, Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300">
                          {task.ref || `TSK-${task.id.slice(-4)}`}
                        </span>
                        <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-mist-400" />
                          <span>{task.room ? (task.room.startsWith('Room') ? task.room : `Room ${task.room}`) : 'Facility Area'}</span>
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                          }`}
                        >
                          {task.priority || 'Urgent'} Priority
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>Escalation / Blocker</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-mist-400 font-mono">
                        <Clock className="h-3 w-3 text-mist-500" />
                        <span>SLA: {task.slaDue || '30m target'}</span>
                      </div>
                    </div>

                    {/* Middle Row: Title & Fulfiller Details (Minimal summary front) */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm md:text-base text-white group-hover:text-rose-200 transition">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-mist-300 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-mist-400" />
                          <span>Reported by: <strong className="text-white">{fulfillerName}</strong></span>
                        </span>
                        <span className="text-mist-500">·</span>
                        <span className="text-rose-300 font-medium line-clamp-1">
                          <strong>Blocker:</strong> {blockerText}
                        </span>
                      </div>
                    </div>

                    {/* Indicator Chips (Photo Attached, Review Included, Supervisor Acknowledged, etc.) */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06] flex-wrap">
                      {(task.supervisorAcknowledged || task.ackStatus === 'acknowledged') && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Supervisor Acknowledged</span>
                        </span>
                      )}
                      {hasPhoto && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5">
                          <Camera className="h-3 w-3" />
                          <span>Photo Evidence Uploaded</span>
                        </span>
                      )}
                      {hasReview && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 flex items-center gap-1.5">
                          <Star className="h-3 w-3 fill-indigo-300" />
                          <span>Fulfiller Review & Notes</span>
                        </span>
                      )}
                      <span className="text-[11px] text-mist-400 font-mono ml-auto">
                        Assigned: {task.assignedAt || '09:20'}
                      </span>
                    </div>

                    {/* Action Bar (View Details, Acknowledge, Reject Task, Escalate Task) */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08] flex-wrap">
                      {/* Button: View Details */}
                      <button
                        type="button"
                        onClick={() => setDetailModalTask(task)}
                        className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] text-xs font-bold text-white hover:bg-white/[0.1] transition flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-mist-300" />
                        <span>View Details</span>
                      </button>

                      {/* Button: Acknowledge */}
                      {task.supervisorAcknowledged || task.ackStatus === 'acknowledged' ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Acknowledged</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgeSupervisorTask(task.id)}
                          className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {/* Button: Reject Task */}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalTask(task);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject Task</span>
                      </button>

                      {/* Button: Escalate Task */}
                      <button
                        type="button"
                        onClick={() => handleTriggerEscalateTask(task)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-xs font-bold text-white hover:brightness-110 shadow-md shadow-rose-500/25 transition flex items-center gap-1.5"
                      >
                        <Flame className="h-3.5 w-3.5" />
                        <span>Escalate Task</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: "FROM ME" (Supervisor to Department Manager)       */}
      {/* ========================================================= */}
      {activeSubTab === 'from_me' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-mist-400 px-1">
            <span className="font-medium">
              Showing <strong>{fromMeEscalations.length}</strong> escalation{fromMeEscalations.length === 1 ? '' : 's'} sent to Department Manager
            </span>
            <span className="text-mist-500 font-mono text-[11px]">
              Statuses: Not Viewed · Acknowledged · Rejected
            </span>
          </div>

          {fromMeEscalations.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/10 bg-ink-900/60 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-base text-white">No Escalations Under Current Filter</h3>
              <p className="text-xs text-mist-400 max-w-md mx-auto">
                No supervisor escalations match this filter in <strong>{department}</strong>. You can escalate any task from the &ldquo;For Me&rdquo; tab or click &ldquo;Escalate New Issue&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {fromMeEscalations.map((esc) => {
                const isNotViewed = esc.status === 'Not Viewed';
                const isAcknowledged = esc.status === 'Acknowledged';
                const isRejected = esc.status === 'Rejected';

                return (
                  <div
                    key={esc.id}
                    className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4 hover:border-white/20 transition"
                  >
                    {/* Top Row: Ref, Room, Priority, and Status strictly displayed */}
                    <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap border-b border-white/[0.08] pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300">
                          {esc.taskRef}
                        </span>
                        {esc.room && (
                          <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-mist-400" />
                            <span>Room {esc.room}</span>
                          </span>
                        )}
                        <span className="text-xs text-mist-300 font-medium">
                          {esc.department}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            esc.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                          }`}
                        >
                          {esc.priority}
                        </span>
                      </div>

                      {/* Status Badge: Not Viewed, Acknowledged, Rejected */}
                      <div className="flex items-center gap-2">
                        {isNotViewed && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 animate-pulse">
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Not Viewed</span>
                          </span>
                        )}
                        {isAcknowledged && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Acknowledged</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Title, Escalation Reason & Supervisor Notes */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-base text-white">{esc.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                            Escalation Reason
                          </span>
                          <p className="text-mist-200">{esc.reason}</p>
                        </div>
                        {esc.notes && (
                          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                              Supervisor Notes (Meera Nambiar)
                            </span>
                            <p className="text-mist-200">{esc.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Photo preview if photoUrl present */}
                    {esc.photoUrl && (
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <img
                          src={esc.photoUrl}
                          alt="Evidence preview"
                          className="h-14 w-20 object-cover rounded-xl border border-white/10 cursor-pointer hover:opacity-80 transition"
                          onClick={() => setLightboxPhoto(esc.photoUrl || null)}
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            <Camera className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Field Photo Evidence Attached</span>
                          </p>
                          <p className="text-mist-400 text-[11px]">Click thumbnail to inspect full photograph</p>
                        </div>
                      </div>
                    )}

                    {/* BOTTOM BOX: Department Manager Review & Feedback */}
                    <div className="space-y-1.5">
                      {isNotViewed && (
                        <div className="p-3.5 rounded-2xl bg-amber-400/[0.06] border border-amber-400/20 text-xs flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300 shrink-0">
                            <Clock className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-bold text-amber-200">Awaiting Department Manager Review</p>
                            <p className="text-mist-300 text-[11px]">
                              Escalated to Marcus Vance at {esc.escalatedAt}. Notification queued in Manager attention feed.
                            </p>
                          </div>
                        </div>
                      )}

                      {isAcknowledged && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 text-xs space-y-1">
                          <div className="flex items-center justify-between text-emerald-300">
                            <span className="font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Department Manager Review ({esc.managerName || 'Marcus Vance'})</span>
                            </span>
                            {esc.managerReviewedAt && (
                              <span className="font-mono text-[11px] text-emerald-400">
                                {esc.managerReviewedAt}
                              </span>
                            )}
                          </div>
                          <p className="text-white font-medium pl-5">
                            &ldquo;{esc.managerReview || 'Escalation acknowledged. Operational recovery initiated.'}&rdquo;
                          </p>
                        </div>
                      )}

                      {isRejected && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/25 text-xs space-y-1">
                          <div className="flex items-center justify-between text-rose-300">
                            <span className="font-bold flex items-center gap-1.5">
                              <XCircle className="h-4 w-4" />
                              <span>Department Manager Review ({esc.managerName || 'Marcus Vance'})</span>
                            </span>
                            {esc.managerReviewedAt && (
                              <span className="font-mono text-[11px] text-rose-400">
                                {esc.managerReviewedAt}
                              </span>
                            )}
                          </div>
                          <p className="text-white font-medium pl-5">
                            &ldquo;{esc.managerReview || 'Escalation declined. Please handle via internal shift protocols.'}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Metadata & Quick Simulation Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
                      <span className="text-mist-400">
                        Escalated by <strong className="text-white">{esc.escalatedBy}</strong> · {esc.escalatedAt}
                      </span>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setDetailModalEscalation(esc)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                        >
                          Full Details
                        </button>

                        {/* Interactive Manager Status Simulation */}
                        <button
                          type="button"
                          onClick={() => {
                            setManagerReviewModalEsc(esc);
                            setSimulatedManagerStatus(esc.status === 'Not Viewed' ? 'Acknowledged' : esc.status);
                            setSimulatedManagerNote(esc.managerReview || '');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition flex items-center gap-1.5"
                          title="Simulate Department Manager Review & Decision"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Simulate Mgr Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 1: "FOR ME" FULL TASK DETAILS MODAL                 */}
      {/* ========================================================= */}
      {detailModalTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300">
                    {detailModalTask.ref}
                  </span>
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/10">
                    {detailModalTask.room ? `Room ${detailModalTask.room}` : 'Department Area'}
                  </span>
                  <span className="text-xs font-semibold text-mist-400">
                    {department}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Work Blocked / Escalated
                  </span>
                </div>
                <h2 className="text-lg font-bold font-display text-white">
                  {detailModalTask.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalTask(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Task Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-mist-400 block mb-0.5">Assigned Fulfiller</span>
                <span className="font-bold text-white">{detailModalTask.assignee || 'Attendant'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-mist-400 block mb-0.5">Priority</span>
                <span className="font-bold text-rose-300 uppercase">{detailModalTask.priority || 'Urgent'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-mist-400 block mb-0.5">SLA Target</span>
                <span className="font-mono font-bold text-amber-300">{detailModalTask.slaDue || '30m'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-mist-400 block mb-0.5">Assigned At</span>
                <span className="font-mono font-bold text-white">{detailModalTask.assignedAt || '09:20'}</span>
              </div>
            </div>

            {/* Fulfiller Escalation Reason */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>Reported Fulfiller Blocker & Escalation Reason</span>
              </div>
              <p className="text-rose-100 font-medium">
                {detailModalTask.blockerReason ||
                  detailModalTask.history?.find((h) => h.status === 'Blocked')?.note ||
                  detailModalTask.description ||
                  'Field access restricted. Immediate supervisor intervention required.'}
              </p>
            </div>

            {/* Fulfiller Reviews & Ratings */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span>Fulfiller Field Review & Quality Notes</span>
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < (detailModalTask.rating ?? 2) ? 'fill-amber-400 text-amber-400' : 'text-mist-600'
                      }`}
                    />
                  ))}
                  <span className="font-mono font-bold ml-1 text-xs">{detailModalTask.rating ?? 2}/5</span>
                </div>
              </div>
              <p className="text-mist-200">
                {detailModalTask.review ||
                  detailModalTask.feedback?.comment ||
                  detailModalTask.description ||
                  'No formal review notes submitted with initial blocker alert.'}
              </p>
            </div>

            {/* Photographic Evidence / Pictures */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-400" />
                  <span>Photographic Evidence (Uploaded by Fulfiller)</span>
                </span>
                {detailModalTask.photoUrl && (
                  <span className="text-[11px] text-emerald-400 font-mono">1 verified image</span>
                )}
              </div>

              {detailModalTask.photoUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border border-white/15 bg-black/40">
                  <img
                    src={detailModalTask.photoUrl}
                    alt="Fulfiller photographic proof"
                    className="w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition duration-300"
                    onClick={() => setLightboxPhoto(detailModalTask.photoUrl || null)}
                  />
                  <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-ink-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-mist-300 text-[11px]">Click image for full-screen view</span>
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(detailModalTask.photoUrl || null)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-semibold text-[11px] flex items-center gap-1 hover:bg-white/20 transition"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span>Zoom</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center text-xs text-mist-400 space-y-1">
                  <Camera className="h-6 w-6 text-mist-500 mx-auto" />
                  <p className="font-semibold text-white">No photographic evidence uploaded</p>
                  <p className="text-[11px] text-mist-400">The fulfiller did not attach photo proof with this blocker.</p>
                </div>
              )}
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setResolveModalTask(detailModalTask);
                  setResolveNote('');
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition"
              >
                Clear Blocker & Resume
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Button: Acknowledge inside Modal */}
                {detailModalTask.supervisorAcknowledged || detailModalTask.ackStatus === 'acknowledged' ? (
                  <span className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Acknowledged by Supervisor</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      acknowledgeSupervisorTask(detailModalTask.id);
                      setDetailModalTask({
                        ...detailModalTask,
                        supervisorAcknowledged: true,
                        ackStatus: 'acknowledged',
                      });
                    }}
                    className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Acknowledge Escalation</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setRejectModalTask(detailModalTask);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerEscalateTask(detailModalTask)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-rose-500/25 transition flex items-center gap-1.5"
                >
                  <Flame className="h-4 w-4" />
                  <span>Escalate to Dept Manager</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 2: REJECT TASK CONFIRMATION MODAL                  */}
      {/* ========================================================= */}
      {rejectModalTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-ink-900 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle className="h-5 w-5" />
                <h3 className="font-bold text-base text-white">Reject Fulfiller Escalation</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-mist-300">
              Rejecting escalation on <strong>{rejectModalTask.title}</strong> ({rejectModalTask.ref}). The task will be sent back to <strong>{rejectModalTask.assignee || 'Attendant'}</strong> with your rejection directive.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200">Rejection Directive / Instructions *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Attendant instructed to proceed using backup chute key. Escalation rejected."
                  className="w-full rounded-xl border border-white/10 bg-ink-950 p-2.5 text-white placeholder-mist-600 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRejectModalTask(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-600 shadow-md shadow-rose-500/25"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 3: RESOLVE BLOCKER MODAL                           */}
      {/* ========================================================= */}
      {resolveModalTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-ink-900 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-bold text-base text-white">Clear Blocker & Resume Work</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveModalTask(null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-mist-300">
              Clearing blocker for <strong>{resolveModalTask.title}</strong>. Task status will resume to <strong>In progress</strong>.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200">Resolution Note *</label>
                <textarea
                  rows={3}
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="e.g. Verified with engineering, service chute cleared. Safe to resume."
                  className="w-full rounded-xl border border-white/10 bg-ink-950 p-2.5 text-white placeholder-mist-600 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setResolveModalTask(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-ink-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/25"
                >
                  Clear & Resume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 4: "FROM ME" FULL ESCALATION DETAILS MODAL          */}
      {/* ========================================================= */}
      {detailModalEscalation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300">
                    {detailModalEscalation.taskRef}
                  </span>
                  <span className="text-xs text-mist-400">
                    {detailModalEscalation.department} · {detailModalEscalation.escalatedAt}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white">{detailModalEscalation.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalEscalation(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  Escalation Reason
                </span>
                <p className="text-mist-200">{detailModalEscalation.reason}</p>
              </div>

              {detailModalEscalation.notes && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Supervisor Escalation Notes
                  </span>
                  <p className="text-mist-200">{detailModalEscalation.notes}</p>
                </div>
              )}

              {/* Status and Department Manager Review */}
              <div className="p-4 rounded-2xl border bg-ink-950/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 block">
                  Department Manager Adjudication
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-mist-300">Status:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      detailModalEscalation.status === 'Not Viewed'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : detailModalEscalation.status === 'Acknowledged'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {detailModalEscalation.status}
                  </span>
                </div>
                {detailModalEscalation.managerReview && (
                  <div className="mt-2 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white">
                    <p className="text-mist-300 text-[11px] mb-1">
                      Review from {detailModalEscalation.managerName || 'Marcus Vance'} ({detailModalEscalation.managerReviewedAt || 'Today'}):
                    </p>
                    <p className="font-medium">&ldquo;{detailModalEscalation.managerReview}&rdquo;</p>
                  </div>
                )}
              </div>

              {detailModalEscalation.photoUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 block">
                    Attached Photographic Evidence
                  </span>
                  <img
                    src={detailModalEscalation.photoUrl}
                    alt="Escalation attachment"
                    className="w-full max-h-60 object-cover rounded-2xl border border-white/10 cursor-pointer"
                    onClick={() => setLightboxPhoto(detailModalEscalation.photoUrl || null)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setDetailModalEscalation(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 5: SIMULATE DEPARTMENT MANAGER REVIEW              */}
      {/* ========================================================= */}
      {managerReviewModalEsc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-ink-900 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-bold text-base text-white">Simulate Dept Manager Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setManagerReviewModalEsc(null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-mist-300">
              Set the Department Manager status and review comments for{' '}
              <strong>{managerReviewModalEsc.title}</strong> ({managerReviewModalEsc.taskRef}).
            </p>

            <form onSubmit={handleManagerReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200">Department Manager Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Not Viewed', 'Acknowledged', 'Rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSimulatedManagerStatus(st)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center ${
                        simulatedManagerStatus === st
                          ? st === 'Acknowledged'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : st === 'Rejected'
                            ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                            : 'border-amber-400 bg-amber-400/20 text-amber-300'
                          : 'border-white/10 bg-white/[0.02] text-mist-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {simulatedManagerStatus !== 'Not Viewed' && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-mist-200">Department Manager Review Note</label>
                  <textarea
                    rows={3}
                    value={simulatedManagerNote}
                    onChange={(e) => setSimulatedManagerNote(e.target.value)}
                    placeholder={
                      simulatedManagerStatus === 'Acknowledged'
                        ? 'e.g. Acknowledged by Marcus Vance: Approved maintenance work order PO-9941. Prioritized.'
                        : 'e.g. Rejected by Marcus Vance: Please resolve using standard floor supply reserves.'
                    }
                    className="w-full rounded-xl border border-white/10 bg-ink-950 p-2.5 text-white placeholder-mist-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setManagerReviewModalEsc(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-xs font-bold text-ink-950 hover:bg-amber-300 shadow-md shadow-amber-400/25"
                >
                  Save Review Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 6: LIGHTBOX IMAGE ZOOM MODAL                       */}
      {/* ========================================================= */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxPhoto}
              alt="High-resolution evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition border border-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ESCALATE TASK TO DEPT MANAGER                      */}
      {/* ========================================================= */}
      <EscalateIssueModal
        isOpen={isEscalateModalOpen}
        onClose={() => {
          setIsEscalateModalOpen(false);
          setEscalateTaskTarget(null);
        }}
        initialTitle={escalateTaskTarget ? `Escalation: ${escalateTaskTarget.title}` : ''}
        initialDepartment={department}
        initialRoom={escalateTaskTarget?.room || ''}
        initialPriority={(escalateTaskTarget?.priority as 'urgent' | 'critical') || 'urgent'}
        initialReason={
          escalateTaskTarget?.blockerReason ||
          escalateTaskTarget?.history?.find((h) => h.status === 'Blocked')?.note ||
          ''
        }
        initialNotes={
          escalateTaskTarget
            ? `Reported by ${escalateTaskTarget.assignee || 'attendant'}. Requires Department Manager Marcus Vance authorization.`
            : ''
        }
        initialPhotoUrl={escalateTaskTarget?.photoUrl}
        initialTaskId={escalateTaskTarget?.id}
        initialTaskRef={escalateTaskTarget?.ref}
        onSubmit={handleConfirmEscalation}
        onEscalate={handleConfirmEscalation}
      />
    </div>
  );
}

