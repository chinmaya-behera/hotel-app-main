'use client';

import { useState, useMemo, useEffect, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  History,
  Layers,
  MapPin,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Users,
} from 'lucide-react';
import { MANAGER_DEPARTMENTS, departmentId, managerDepartment } from '@/lib/manager-domain';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection, InspectionType, InspectionStatus } from '@/types/demo';

type InspectionsView = 'create' | 'due' | 'history';

// Helper to reliably extract department identifier and display name
function getInspectionDepartment(inspection: SupervisorInspection): { id: string; name: string } {
  const deptKey =
    departmentId(inspection.department) ??
    (inspection.type === 'maintenance_check' ? 'engineering' : 'housekeeping');
  const d = managerDepartment(deptKey);
  const name = d.id === 'wellness' ? 'Wellness' : d.name;
  return { id: d.id, name };
}

// Preset deadlines for realistic display
const PRESET_DEADLINES: Record<string, string> = {
  'INSP-WELL-01': 'Today 11:30',
  'INSP-WELL-02': 'Today 09:15',
  'INSP-FB-01': 'Today 10:45',
  'INSP-FB-02': 'Today 08:45',
  'INSP-MX-01': 'Today 11:00',
  'INSP-2026-01': 'Today 12:00',
  'INSP-2026-02': 'Today 11:15',
  'INSP-2026-03': 'Today 14:00',
  'INSP-2026-04': 'Today 08:30',
  'INSP-2026-05': 'Today 10:30',
  'INSP-2026-06': 'Yesterday 16:00',
  'INSP-2026-07': 'Yesterday 14:00',
};

// Helper to resolve an inspection deadline
function getInspectionDeadline(inspection: SupervisorInspection): string {
  if (inspection.scheduledTime && inspection.scheduledTime.trim()) {
    return inspection.scheduledTime;
  }
  if (PRESET_DEADLINES[inspection.id]) {
    return PRESET_DEADLINES[inspection.id];
  }
  if (inspection.priority === 'urgent') return 'Today 11:00';
  if (inspection.priority === 'vip') return 'Today 12:30';
  return 'Today 16:00';
}

const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  turnover: 'Turnover Inspection',
  deep_clean: 'Deep Clean Verification',
  vip_prep: 'VIP Arrival Prep',
  maintenance_check: 'Maintenance & Safety Check',
  periodic: 'Periodic Quality Audit',
};

export interface GeneralManagerInspectionsTabProps {
  selectedInspectionId?: string | null;
  onClearSelectedInspection?: () => void;
}

export function GeneralManagerInspectionsTab({
  selectedInspectionId,
  onClearSelectedInspection,
}: GeneralManagerInspectionsTabProps = {}) {
  const { state, initiateInspectionDirective, approveInspection } = useDemo();

  // Navigation: 3 primary options
  const [activeView, setActiveView] = useState<InspectionsView>('due');

  // Filtering & Search state
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedChecklistId, setExpandedChecklistId] = useState<string | null>(null);

  // Create form state
  const [createDeptId, setCreateDeptId] = useState<string>('housekeeping');
  const [createLocation, setCreateLocation] = useState<string>('');
  const [createType, setCreateType] = useState<InspectionType>('turnover');
  const [createPriority, setCreatePriority] = useState<'normal' | 'vip' | 'urgent'>('normal');
  const [createDeadlinePreset, setCreateDeadlinePreset] = useState<string>('Today 12:30');
  const [customDeadline, setCustomDeadline] = useState<string>('');
  const [createInstructions, setCreateInstructions] = useState<string>(
    managerDepartment('housekeeping').standard,
  );
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const selectedDepartment = managerDepartment(createDeptId);

  // Sync instructions when selected department changes in form
  const handleDeptChange = (deptId: string) => {
    setCreateDeptId(deptId);
    const d = managerDepartment(deptId);
    setCreateInstructions(d.standard);
    if (deptId === 'engineering') {
      setCreateType('maintenance_check');
    } else if (deptId === 'wellness') {
      setCreateType('vip_prep');
    } else {
      setCreateType('turnover');
    }
  };

  const allInspections = state.inspections ?? [];

  // Sync selectedInspectionId from parent notifications
  useEffect(() => {
    if (selectedInspectionId) {
      const match = allInspections.find((i) => i.id === selectedInspectionId);
      if (match) {
        if (match.status === 'passed') {
          setActiveView('history');
        } else {
          setActiveView('due');
        }
        setExpandedChecklistId(match.id);
      }
    }
  }, [selectedInspectionId, allInspections]);

  // Completed inspections for History view (status === 'passed')
  const completedInspections = useMemo(() => {
    return allInspections.filter((i) => i.status === 'passed');
  }, [allInspections]);

  // Due inspections (status !== 'passed': pending, reopened, escalated)
  const dueInspections = useMemo(() => {
    return allInspections.filter((i) => i.status !== 'passed');
  }, [allInspections]);

  // Computed summary counts
  const totalCount = allInspections.length;
  const dueCount = dueInspections.length;
  const passedCount = completedInspections.length;
  const urgentDueCount = dueInspections.filter((i) => i.priority === 'urgent' || i.status === 'reopened').length;
  const avgScore = useMemo(() => {
    const scores = completedInspections
      .map((i) => i.score)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));
    if (scores.length === 0) return 98;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [completedInspections]);

  // Filtered Due Inspections
  const filteredDueInspections = useMemo(() => {
    return dueInspections.filter((i) => {
      const dept = getInspectionDepartment(i);
      if (departmentFilter !== 'all' && dept.id !== departmentFilter) return false;
      if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = i.roomNumber.toLowerCase().includes(q);
        const matchesDept = dept.name.toLowerCase().includes(q);
        const matchesType = (INSPECTION_TYPE_LABELS[i.type] || i.type).toLowerCase().includes(q);
        const matchesAttendant = (i.attendantName || '').toLowerCase().includes(q);
        const matchesSupervisor = (i.assignedSupervisorName || '').toLowerCase().includes(q);
        const matchesInstructions = (i.instructions || '').toLowerCase().includes(q);
        const matchesNotes = (i.notes || '').toLowerCase().includes(q);
        const matchesReopen = (i.reopenReason || '').toLowerCase().includes(q);
        if (
          !matchesRoom &&
          !matchesDept &&
          !matchesType &&
          !matchesAttendant &&
          !matchesSupervisor &&
          !matchesInstructions &&
          !matchesNotes &&
          !matchesReopen
        ) {
          return false;
        }
      }
      return true;
    });
  }, [dueInspections, departmentFilter, priorityFilter, searchQuery]);

  // Filtered History Inspections
  const filteredHistoryInspections = useMemo(() => {
    return completedInspections.filter((i) => {
      const dept = getInspectionDepartment(i);
      if (departmentFilter !== 'all' && dept.id !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = i.roomNumber.toLowerCase().includes(q);
        const matchesDept = dept.name.toLowerCase().includes(q);
        const matchesType = (INSPECTION_TYPE_LABELS[i.type] || i.type).toLowerCase().includes(q);
        const matchesInspector = (i.inspectedBy || '').toLowerCase().includes(q);
        const matchesAttendant = (i.attendantName || '').toLowerCase().includes(q);
        const matchesNotes = (i.notes || '').toLowerCase().includes(q);
        if (
          !matchesRoom &&
          !matchesDept &&
          !matchesType &&
          !matchesInspector &&
          !matchesAttendant &&
          !matchesNotes
        ) {
          return false;
        }
      }
      return true;
    });
  }, [completedInspections, departmentFilter, searchQuery]);

  // Submit new inspection directive
  const handleSubmitDirective = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createLocation.trim()) return;

    const deadlineValue = customDeadline.trim() || createDeadlinePreset;

    const selectedDeptName = selectedDepartment.id === 'wellness' ? 'Wellness' : selectedDepartment.name;

    initiateInspectionDirective({
      department: selectedDeptName,
      roomNumber: createLocation.trim(),
      roomType: `${selectedDeptName} Location`,
      type: createType,
      priority: createPriority,
      instructions: createInstructions.trim(),
      scheduledTime: deadlineValue,
      initiatedBy: 'General Manager',
      initiatedRole: 'general_manager',
    });

    const targetRoom = createLocation.trim();
    setCreateLocation('');
    setCustomDeadline('');

    setFeedbackBanner({
      type: 'success',
      message: `Directive issued to ${selectedDepartment.person} (${selectedDeptName}). Target deadline: ${deadlineValue}.`,
      actionLabel: 'View in Due Inspections →',
      onAction: () => {
        setActiveView('due');
        setFeedbackBanner(null);
      },
    });
  };

  // Quick mark inspection as passed from Due view
  const handleMarkPassed = (inspectionId: string, roomNumber: string) => {
    approveInspection(inspectionId, 'Verified and passed by General Manager directive review.');
    setFeedbackBanner({
      type: 'success',
      message: `Inspection for ${roomNumber} approved & signed off! Moved to Inspection History.`,
      actionLabel: 'View Inspection History →',
      onAction: () => {
        setActiveView('history');
        setFeedbackBanner(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              General Manager Oversight
            </span>
            <span className="text-xs text-mist-400">· Quality & Standards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 dark:text-white">
            Department Inspections
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-mist-400 max-w-2xl">
            Dispatch operational directives to department heads, monitor active due inspections with clear deadlines, and inspect verified historical quality audits.
          </p>
        </div>

        {/* Top Stat Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">Due Now</div>
            <div className="text-base font-extrabold text-amber-500 dark:text-amber-400">{dueCount}</div>
          </div>
          <div className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">History</div>
            <div className="text-base font-extrabold text-emerald-500 dark:text-emerald-400">{passedCount}</div>
          </div>
          <div className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">Avg Score</div>
            <div className="text-base font-extrabold text-sky-500 dark:text-sky-400">{avgScore}%</div>
          </div>
        </div>
      </div>

      {/* Primary 3-Option Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option 1: Create Inspections */}
        <button
          type="button"
          onClick={() => {
            setActiveView('create');
            setFeedbackBanner(null);
          }}
          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${activeView === 'create'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-white/70 dark:bg-ink-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-amber-500/30'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${activeView === 'create'
                  ? 'bg-amber-500 text-ink-950 font-bold'
                  : 'bg-slate-100 dark:bg-ink-950 text-slate-500 dark:text-mist-400'
                }`}
            >
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy-950 dark:text-white">Create Inspections</div>
              <div className="text-xs text-slate-500 dark:text-mist-400">Dispatch quality directives</div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-mist-400">
            Form
          </span>
        </button>

        {/* Option 2: Due Inspections */}
        <button
          type="button"
          onClick={() => {
            setActiveView('due');
            setFeedbackBanner(null);
          }}
          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${activeView === 'due'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-white/70 dark:bg-ink-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-amber-500/30'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${activeView === 'due'
                  ? 'bg-amber-500 text-ink-950 font-bold'
                  : 'bg-slate-100 dark:bg-ink-950 text-slate-500 dark:text-mist-400'
                }`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy-950 dark:text-white">Due Inspections</div>
              <div className="text-xs text-slate-500 dark:text-mist-400">Not completed · With deadlines</div>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${urgentDueCount > 0
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
              }`}
          >
            {dueCount} Due
          </span>
        </button>

        {/* Option 3: History of Inspections */}
        <button
          type="button"
          onClick={() => {
            setActiveView('history');
            setFeedbackBanner(null);
          }}
          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${activeView === 'history'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-sm'
              : 'bg-white/70 dark:bg-ink-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-emerald-500/30'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${activeView === 'history'
                  ? 'bg-emerald-500 text-ink-950 font-bold'
                  : 'bg-slate-100 dark:bg-ink-950 text-slate-500 dark:text-mist-400'
                }`}
            >
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy-950 dark:text-white">History of Inspections</div>
              <div className="text-xs text-slate-500 dark:text-mist-400">Completed & verified audits</div>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            {passedCount} Passed
          </span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackBanner && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-navy-950 dark:text-white">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
            <span>{feedbackBanner.message}</span>
          </div>
          {feedbackBanner.actionLabel && feedbackBanner.onAction && (
            <button
              type="button"
              onClick={feedbackBanner.onAction}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition shrink-0"
            >
              {feedbackBanner.actionLabel}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION 1: CREATE INSPECTIONS FORM */}
      {/* ========================================================================= */}
      {activeView === 'create' && (
        <div className="space-y-6">
          <section className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-6">
            <div className="border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Executive Directive Dispatch</span>
              </div>
              <h2 className="text-xl font-bold text-navy-950 dark:text-white">
                Issue Department Inspection Directive
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-mist-400">
                Send an official quality inspection directive to a department manager. The department manager coordinates supervisor assignment and tracking.
              </p>
            </div>

            <form onSubmit={handleSubmitDirective} className="space-y-5">
              {/* Department Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-2">
                  Target Department
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MANAGER_DEPARTMENTS.map((d) => {
                    const isSelected = createDeptId === d.id;
                    const deptDisplayName = d.id === 'wellness' ? 'Wellness' : d.name;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDeptChange(d.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-navy-950 dark:text-white ring-2 ring-amber-500/20'
                            : 'bg-white dark:bg-ink-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-400 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                      >
                        <strong className="text-xs font-bold text-navy-950 dark:text-white">
                          {deptDisplayName}
                        </strong>
                        {isSelected && <Check className="h-4 w-4 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location and Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                    Room or Service Location <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                    <input
                      type="text"
                      required
                      value={createLocation}
                      onChange={(e) => setCreateLocation(e.target.value)}
                      placeholder="e.g. Room 402, Spa Hydrotherapy Pool, Main Restaurant, Chiller Plant..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Inspection Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                    Inspection Type
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value as InspectionType)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="turnover">Turnover Inspection</option>
                    <option value="deep_clean">Deep Clean Verification</option>
                    <option value="vip_prep">VIP Arrival Prep</option>
                    <option value="maintenance_check">Maintenance & Safety Check</option>
                    <option value="periodic">Periodic Quality Audit</option>
                  </select>
                </div>
              </div>

              {/* Priority & Deadline Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Priority */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                    Directive Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'normal', label: 'Normal', color: 'border-slate-200 text-slate-700 dark:text-mist-300' },
                      { id: 'vip', label: 'VIP Prep', color: 'border-purple-400/40 text-purple-600 dark:text-purple-400' },
                      { id: 'urgent', label: 'Urgent', color: 'border-red-400/40 text-red-600 dark:text-red-400' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCreatePriority(p.id as any)}
                        className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition ${createPriority === p.id
                            ? 'bg-amber-500/20 border-amber-500 text-navy-950 dark:text-white'
                            : 'bg-white dark:bg-ink-950/60 border-slate-200 dark:border-white/10 text-slate-500 dark:text-mist-400'
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline Selector */}
                <div className="md:col-span-8">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                    Inspection Deadline / Target Completion Time
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {[
                      'Today 11:30',
                      'Today 12:30',
                      'Today 14:00',
                      'Today 16:00',
                      'Today 18:00',
                      'Tomorrow 10:00',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setCreateDeadlinePreset(preset);
                          setCustomDeadline('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${createDeadlinePreset === preset && !customDeadline
                            ? 'bg-amber-400 text-ink-950 font-bold border-amber-400'
                            : 'bg-white dark:bg-ink-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-slate-300'
                          }`}
                      >
                        <Clock className="inline h-3 w-3 mr-1 -mt-0.5" />
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    placeholder="Or specify custom deadline (e.g. Today 15:45, End of PM shift...)"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Instructions Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                  Inspection Directive & Quality Standard Instructions
                </label>
                <textarea
                  required
                  rows={3}
                  value={createInstructions}
                  onChange={(e) => setCreateInstructions(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <p className="mt-1 text-[11px] text-slate-400 dark:text-mist-500">
                  Standard pre-loaded from {selectedDepartment.id === 'wellness' ? 'Wellness' : selectedDepartment.name} specifications. Edit if this inspection requires custom checks.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-white/10">
                <span className="text-xs text-slate-500 dark:text-mist-400">
                  Directive will be routed to <strong>{selectedDepartment.person}</strong> ({selectedDepartment.email})
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-ink-950 font-bold text-xs shadow-md transition"
                >
                  <Send className="h-4 w-4" />
                  Dispatch Directive to {selectedDepartment.id === 'wellness' ? 'Wellness' : selectedDepartment.name} Manager
                </button>
              </div>
            </form>
          </section>

          {/* Quick List of Recent Directives */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-950 dark:text-white">
                Active Directives Overview · All Departments
              </h3>
              <button
                type="button"
                onClick={() => setActiveView('due')}
                className="text-xs font-semibold text-amber-500 hover:underline"
              >
                View all in Due Inspections ({dueCount}) →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dueInspections.slice(0, 6).map((item) => {
                const dept = getInspectionDepartment(item);
                const deadline = getInspectionDeadline(item);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-bold text-navy-950 dark:text-white">
                        {item.roomNumber}
                      </strong>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                        {dept.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                      <Clock className="h-3 w-3" />
                      <span>Due: {deadline}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-mist-400 line-clamp-2">
                      {item.instructions || item.notes}
                    </p>
                    <div className="pt-2 text-[11px] text-slate-400 dark:text-mist-500 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span>Supervisor: {item.assignedSupervisorName || 'Pending'}</span>
                      <span className="capitalize">{item.priority}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION 2: DUE INSPECTIONS VIEW (WITH DEADLINES) */}
      {/* ========================================================================= */}
      {activeView === 'due' && (
        <div className="space-y-6">
          {/* Controls and Search Bar */}
          <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search due inspections by room, staff, instructions, or ID..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Department Filter */}
              <div className="md:col-span-4">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="all">Department: All Departments ({dueCount})</option>
                  <option value="housekeeping">
                    Housekeeping ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'housekeeping').length})
                  </option>
                  <option value="wellness">
                    Wellness ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'wellness').length})
                  </option>
                  <option value="engineering">
                    Maintenance & Engineering ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'engineering').length})
                  </option>
                  <option value="food-beverages">
                    Food & Beverages ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'food-beverages').length})
                  </option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="md:col-span-3">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="all">Priority: All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="vip">VIP Prep</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-mist-400">Active Due Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold border border-red-500/20">
                  {urgentDueCount} Urgent/Reopened
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                  {dueCount - urgentDueCount} Standard Due
                </span>
              </div>
              <span className="text-slate-400 dark:text-mist-500 text-[11px]">
                Showing {filteredDueInspections.length} of {dueCount} pending inspections
              </span>
            </div>
          </div>

          {/* Due Inspection Cards */}
          {filteredDueInspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-navy-950 dark:text-white">
                No Due Inspections Found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-mist-400 max-w-md mx-auto">
                {searchQuery || departmentFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No due inspections match your active filters. Try adjusting your search query or department filter.'
                  : 'All department quality inspections have been completed and verified! Use "Create Inspections" to dispatch a new directive.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveView('create')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs shadow-sm hover:bg-amber-300 transition"
              >
                <PlusCircle className="h-4 w-4" />
                Create New Inspection Directive
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDueInspections.map((item) => {
                const dept = getInspectionDepartment(item);
                const deadline = getInspectionDeadline(item);
                const isUrgent = item.priority === 'urgent' || item.status === 'reopened';
                const isVip = item.priority === 'vip';
                const isExpanded = expandedChecklistId === item.id;
                const itemsCount = item.items?.length ?? 0;
                const passedItems = (item.items ?? []).filter((ci) => ci.passed).length;

                const isTargetSelected = selectedInspectionId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`p-5 rounded-3xl border backdrop-blur-xl shadow-sm space-y-4 transition ${isTargetSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15'
                        : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/80 hover:border-amber-500/30'
                      }`}
                  >
                    {/* Header Row: Room, Department, Status, and DEADLINE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-center">
                          <span className="block text-xs font-mono font-bold text-navy-950 dark:text-white">
                            {item.roomNumber}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-navy-950 dark:text-white">
                              {item.roomType || `${dept.name} Inspection`}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300">
                              {dept.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-mist-400">
                            {INSPECTION_TYPE_LABELS[item.type] || item.type}
                          </div>
                        </div>
                      </div>

                      {/* Prominent Deadline Badge */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border ${isUrgent
                              ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 animate-pulse'
                              : isVip
                                ? 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            }`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>Deadline: {deadline}</span>
                          {isUrgent && <span className="text-[10px] uppercase font-extrabold ml-1">(Urgent)</span>}
                        </div>

                        {/* Status Tag */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${item.status === 'reopened'
                              ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                        >
                          {item.status === 'reopened' ? 'Reopened (Corrective)' : 'Pending Inspection'}
                        </span>
                      </div>
                    </div>

                    {/* Reopen Reason / Corrective Alert if applicable */}
                    {item.status === 'reopened' && (
                      <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Correction Required: {item.reopenReason}</span>
                        </div>
                        <p className="text-slate-600 dark:text-mist-300">
                          {item.correctiveAction}
                        </p>
                      </div>
                    )}

                    {/* Directives & Instructions */}
                    <div className="text-xs text-slate-600 dark:text-mist-300 bg-slate-50 dark:bg-ink-950/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <strong className="text-navy-950 dark:text-white">Directive Guidelines: </strong>
                      <span>{item.instructions || item.notes || 'Conduct comprehensive quality check adhering to departmental standards.'}</span>
                    </div>

                    {/* Metadata & Staff Personnel */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-mist-400">
                      <div>
                        <User className="inline h-3 w-3 mr-1" />
                        <span>Attendant: <strong>{item.attendantName || 'Awaiting assignment'}</strong></span>
                      </div>
                      <div>
                        <ShieldCheck className="inline h-3 w-3 mr-1" />
                        <span>Supervisor: <strong>{item.assignedSupervisorName || 'Department Manager'}</strong></span>
                      </div>
                      <div>
                        <Layers className="inline h-3 w-3 mr-1" />
                        <span>Checklist: <strong>{passedItems}/{itemsCount || 'Open'} verified</strong></span>
                      </div>
                    </div>

                    {/* Expandable Checklist Items */}
                    {isExpanded && item.items && item.items.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <h4 className="text-xs font-bold text-navy-950 dark:text-white">
                          Inspection Checklist Verification Items ({itemsCount}):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.items.map((chk) => (
                            <div
                              key={chk.id}
                              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${chk.passed
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-700 dark:text-mist-300'
                                  : 'bg-slate-50 dark:bg-ink-950/60 border-slate-200 dark:border-white/10 text-slate-500 dark:text-mist-400'
                                }`}
                            >
                              <div
                                className={`p-1 rounded-md mt-0.5 ${chk.passed
                                    ? 'bg-emerald-500 text-ink-950'
                                    : 'bg-slate-200 dark:bg-ink-800 text-slate-400'
                                  }`}
                              >
                                <Check className="h-3 w-3" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-navy-950 dark:text-white">{chk.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-mist-500 capitalize">
                                  {chk.category} {chk.notes ? `· ${chk.notes}` : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setExpandedChecklistId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{isExpanded ? 'Hide Checklist' : `View Checklist (${itemsCount} items)`}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMarkPassed(item.id, item.roomNumber)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink-950 font-bold text-xs shadow-sm transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark as Inspected & Passed
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION 3: HISTORY OF INSPECTIONS (COMPLETED AUDITS) */}
      {/* ========================================================================= */}
      {activeView === 'history' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-7 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inspection history by room, inspector, findings..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Department Filter */}
              <div className="md:col-span-5">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="all">Department: All Departments ({passedCount})</option>
                  <option value="housekeeping">
                    Housekeeping ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'housekeeping').length})
                  </option>
                  <option value="wellness">
                    Wellness ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'wellness').length})
                  </option>
                  <option value="engineering">
                    Maintenance & Engineering ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'engineering').length})
                  </option>
                  <option value="food-beverages">
                    Food & Beverages ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'food-beverages').length})
                  </option>
                </select>
              </div>
            </div>

            {/* Quality Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-mist-400">Quality History:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  {passedCount} Completed Inspections
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">
                  {avgScore}% Average Quality Score
                </span>
              </div>
              <span className="text-slate-400 dark:text-mist-500 text-[11px]">
                Showing {filteredHistoryInspections.length} completed records
              </span>
            </div>
          </div>

          {/* Completed History Cards */}
          {filteredHistoryInspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl">
              <History className="mx-auto h-10 w-10 text-slate-400 dark:text-mist-500 mb-3" />
              <h3 className="text-base font-bold text-navy-950 dark:text-white">
                No Completed Inspections Found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-mist-400 max-w-md mx-auto">
                No inspection history matches your search or department filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistoryInspections.map((item) => {
                const dept = getInspectionDepartment(item);
                const isExpanded = expandedChecklistId === item.id;
                const itemsCount = item.items?.length ?? 0;
                const passedItems = (item.items ?? []).filter((ci) => ci.passed).length;
                const score = item.score ?? 100;

                const isTargetSelected = selectedInspectionId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`p-5 rounded-3xl border backdrop-blur-xl shadow-sm space-y-4 transition ${isTargetSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                        : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/80 hover:border-emerald-500/30'
                      }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                          <span className="block text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.roomNumber}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-navy-950 dark:text-white">
                              {item.roomType || `${dept.name} Location`}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300">
                              {dept.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-mist-400">
                            {INSPECTION_TYPE_LABELS[item.type] || item.type}
                          </div>
                        </div>
                      </div>

                      {/* Score and Status Badges */}
                      <div className="flex items-center gap-2">
                        {/* Score Pill */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          <Award className="h-4 w-4" />
                          <span>{score}% Quality Score</span>
                        </div>

                        {/* Passed Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-ink-950">
                          <Check className="h-3 w-3 stroke-[3]" />
                          Passed & Verified
                        </span>
                      </div>
                    </div>

                    {/* Inspection Notes & Findings */}
                    <div className="text-xs text-slate-600 dark:text-mist-300 bg-slate-50 dark:bg-ink-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                      <div className="font-semibold text-navy-950 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Inspector Findings & Certification:</span>
                      </div>
                      <p className="text-slate-600 dark:text-mist-300">
                        {item.notes || 'Full standard compliance verified. Room and amenities cleared for executive guest occupancy.'}
                      </p>
                    </div>

                    {/* Verification Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-mist-400">
                      <div>
                        <Calendar className="inline h-3 w-3 mr-1" />
                        <span>Completed: <strong>{item.inspectedAt || item.completedAt || 'Today 09:00'}</strong></span>
                      </div>
                      <div>
                        <ShieldCheck className="inline h-3 w-3 mr-1" />
                        <span>Verified by: <strong>{item.inspectedBy || 'Quality Inspector'}</strong></span>
                      </div>
                      <div>
                        <CheckCircle2 className="inline h-3 w-3 mr-1 text-emerald-500" />
                        <span>Checklist: <strong>{passedItems}/{itemsCount || 4} checks passed (100%)</strong></span>
                      </div>
                    </div>

                    {/* Expandable Checklist View */}
                    {isExpanded && item.items && item.items.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <h4 className="text-xs font-bold text-navy-950 dark:text-white">
                          Verified Quality Checklist Items ({itemsCount}):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.items.map((chk) => (
                            <div
                              key={chk.id}
                              className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs flex items-start gap-2"
                            >
                              <div className="p-1 rounded-md bg-emerald-500 text-ink-950 mt-0.5">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-navy-950 dark:text-white">{chk.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-mist-500 capitalize">
                                  {chk.category} · Verified passed
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setExpandedChecklistId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{isExpanded ? 'Hide Verified Items' : `View Verified Items (${itemsCount || 4})`}</span>
                      </button>

                      <span className="text-[11px] text-slate-400 dark:text-mist-500">
                        Audit ID: <span className="font-mono">{item.id}</span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
