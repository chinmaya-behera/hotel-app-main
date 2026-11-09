'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  HelpCircle,
  Info,
  Layers,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stamp,
  Sun,
  Tag,
  User,
  Wallet,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type {
  InAppNotification,
  WorkItem,
  SafetyAlertRecord,
  IncidentRecord,
  SupervisorInspection,
  CompensationRequest,
} from '@/types/demo';

interface ExecutiveProfileTabProps {
  initialSubTab?: 'profile' | 'notifications' | 'settings';
  permissionMode: 'viewer' | 'approver';
  onTogglePermissionMode: (mode: 'viewer' | 'approver') => void;
  onNavigateTab?: (tabId: string) => void;
  onNavigateToItem?: (notification: InAppNotification) => void;
}

interface ResolvedNotificationDetails {
  refNumber: string;
  title: string;
  categoryLabel: string;
  department: string;
  priority: string;
  priorityTone: 'critical' | 'urgent' | 'warning' | 'vip' | 'info' | 'normal';
  status: string;
  statusTone: 'warning' | 'success' | 'danger' | 'info';
  originator: string;
  timestamp: string;
  amount?: string;
  location?: string;
  deadline?: string;
  targetTab: string;
  targetTabName: string;
  description: string;
  justification?: string;
  actionItems?: string[];
  checklist?: Array<{ item: string; passed?: boolean; notes?: string }>;
  auditHistory?: Array<{ at: string; status: string; note: string }>;
  evidence?: string;
}

function normalizeDepartmentName(dept?: string): string {
  if (!dept) return 'Operations';
  if (/spa\s*(&|and)\s*wellness/i.test(dept) || dept.trim().toLowerCase() === 'spa') {
    return 'Wellness';
  }
  return dept;
}

function resolveNotificationDetails(notif: InAppNotification, state: any): ResolvedNotificationDetails {
  const { itemId } = notif;

  // 1. Check WorkItems (Capex & Approvals)
  const allApprovals: WorkItem[] = [
    ...(state.items?.general_manager ?? []),
    ...(state.items?.executive_viewer ?? []),
  ];
  const itemMatch = allApprovals.find((i) => i.id === itemId || i.ref === itemId);
  if (itemMatch) {
    const isApproved = itemMatch.status === 'Approved';
    const isRejected = itemMatch.status === 'Rejected';
    return {
      refNumber: itemMatch.ref || itemMatch.id,
      title: itemMatch.title,
      categoryLabel: itemMatch.category ? itemMatch.category.toUpperCase() : 'CAPEX REQUISITION',
      department: normalizeDepartmentName(itemMatch.department || notif.department),
      priority: itemMatch.priority || notif.priority || 'urgent',
      priorityTone: itemMatch.priority === 'urgent' ? 'urgent' : itemMatch.priority === 'vip' ? 'vip' : 'warning',
      status: itemMatch.status,
      statusTone: isApproved ? 'success' : isRejected ? 'danger' : 'warning',
      originator: itemMatch.meta?.includes('requested by')
        ? itemMatch.meta.split('requested by')[1].trim()
        : itemMatch.history?.[0]?.note || 'Operations Coordinator',
      timestamp: itemMatch.createdAt || notif.timestamp,
      amount: itemMatch.amount ? `₹${itemMatch.amount.toLocaleString('en-IN')}` : undefined,
      location: itemMatch.room ? `Room ${itemMatch.room}` : 'Central Plant / Property-wide',
      deadline: 'SLA: 2 hours before peak occupancy',
      targetTab: 'approvals',
      targetTabName: 'Approval Center',
      description: itemMatch.description || notif.message || '',
      justification: itemMatch.meta,
      auditHistory: itemMatch.history?.map((h: any) => ({ at: h.at, status: h.status, note: h.note })),
    };
  }

  // 2. Check Safety Alerts
  const safetyMatch: SafetyAlertRecord | undefined = (state.safetyAlerts ?? []).find(
    (a: any) => a.id === itemId || a.ref === itemId,
  );
  if (safetyMatch) {
    const isBroadcast = safetyMatch.status === 'broadcast_active';
    return {
      refNumber: safetyMatch.ref,
      title: safetyMatch.title,
      categoryLabel: 'EMERGENCY SAFETY BROADCAST',
      department: normalizeDepartmentName(notif.department || 'Safety & Security'),
      priority: safetyMatch.priority,
      priorityTone: safetyMatch.priority === 'urgent' ? 'urgent' : 'warning',
      status: safetyMatch.status === 'validated_pending_approval' ? 'Pending GM Broadcast Approval' : isBroadcast ? 'Broadcast Active' : safetyMatch.status,
      statusTone: isBroadcast ? 'success' : 'warning',
      originator: safetyMatch.reportedBy ? `${safetyMatch.reportedBy} (Validated by ${safetyMatch.validatedBy || 'Front Desk'})` : 'Security Directorate',
      timestamp: safetyMatch.reportedAt || notif.timestamp,
      location: safetyMatch.location,
      deadline: 'Immediate Broadcast Protocol',
      targetTab: 'approvals',
      targetTabName: 'Approval Center (Safety Authorizations)',
      description: safetyMatch.description || notif.message || '',
      justification: 'SOP 11.4: Zero unauthorized emergency broadcasts. Affirmative General Manager sign-off required.',
      actionItems: [
        `Affected Floors: ${safetyMatch.affectedFloors?.join(', ') || 'All Floors'}`,
        `Scope: ${safetyMatch.broadcastScope === 'hotel_wide' ? 'Hotel-Wide (Guests & Staff)' : 'All Operational Staff'}`,
        `Validated by: ${safetyMatch.validatedBy || 'Front Desk'}`,
      ],
      auditHistory: safetyMatch.auditHistory?.map((a: any) => ({ at: a.at, status: a.action, note: `${a.actor} (${a.role})` })),
    };
  }

  // 3. Check Incidents
  const incidentMatch: IncidentRecord | undefined = (state.incidents ?? []).find(
    (i: any) => i.id === itemId || i.ref === itemId,
  );
  if (incidentMatch) {
    const isResolved = incidentMatch.status === 'resolved';
    return {
      refNumber: incidentMatch.ref,
      title: incidentMatch.title,
      categoryLabel: 'PROPERTY INCIDENT ESCALATION',
      department: normalizeDepartmentName(notif.department || incidentMatch.department || 'Maintenance & Engineering'),
      priority: incidentMatch.severity,
      priorityTone: incidentMatch.severity === 'critical' ? 'critical' : incidentMatch.severity === 'major' ? 'urgent' : 'warning',
      status: incidentMatch.status === 'investigating' ? 'Active Investigation Underway' : incidentMatch.status === 'contained' ? 'Contained / Remediation' : 'Resolved',
      statusTone: isResolved ? 'success' : 'danger',
      originator: `Coordinator: ${incidentMatch.coordinator || 'Front Desk'}`,
      timestamp: incidentMatch.reportedAt || notif.timestamp,
      location: incidentMatch.affectedArea || 'Floor 3 East Corridor',
      deadline: 'Target containment: 15 minutes',
      targetTab: 'incidents',
      targetTabName: 'Property Incidents',
      description: notif.message || `Incident logged in ${incidentMatch.affectedArea}. Severity: ${incidentMatch.severity}.`,
      actionItems: [
        `Affected Area: ${incidentMatch.affectedArea}`,
        `Coordinator: ${incidentMatch.coordinator}`,
        'Safety cordon posted and technician isolating riser panel',
      ],
      auditHistory: incidentMatch.timeline?.map((t: any) => ({ at: t.at, status: 'Logged', note: t.text })),
    };
  }

  // 4. Check Inspections
  const inspectionMatch: SupervisorInspection | undefined = (state.inspections ?? []).find(
    (i: any) => i.id === itemId,
  );
  if (inspectionMatch) {
    const isPassed = inspectionMatch.status === 'passed';
    const inspTitle = notif.title || `${inspectionMatch.type.replace('_', ' ').toUpperCase()} - Room ${inspectionMatch.roomNumber}`;
    return {
      refNumber: inspectionMatch.id,
      title: inspTitle,
      categoryLabel: 'EXECUTIVE DEPARTMENT INSPECTION',
      department: normalizeDepartmentName(inspectionMatch.department),
      priority: notif.priority || 'vip',
      priorityTone: 'vip',
      status: inspectionMatch.status === 'reopened' ? 'Reopened / Due Review' : isPassed ? 'Completed / Passed' : 'Pending Inspection',
      statusTone: isPassed ? 'success' : 'warning',
      originator: `General Manager Priya Nair (Assigned: ${inspectionMatch.inspectedBy || inspectionMatch.attendantName || 'Senior Supervisor'})`,
      timestamp: notif.timestamp,
      location: `Room ${inspectionMatch.roomNumber} (Floor ${inspectionMatch.floor})`,
      deadline: inspectionMatch.scheduledTime || 'Today 11:30',
      targetTab: 'inspections',
      targetTabName: 'Department Inspections',
      description: inspectionMatch.notes || notif.message || `Inspection for room ${inspectionMatch.roomNumber}`,
      checklist: inspectionMatch.items?.map((it: any) => ({ item: it.label, passed: it.passed, notes: it.note })),
      actionItems: [
        `Inspection Type: ${inspectionMatch.type.replace('_', ' ').toUpperCase()}`,
        `Target Room: Room ${inspectionMatch.roomNumber} (${inspectionMatch.roomType})`,
        `Scheduled Target: ${inspectionMatch.scheduledTime || 'Today 11:30'}`,
      ],
    };
  }

  // 5. Check Compensation Requests
  const compMatch: CompensationRequest | undefined = (state.compensationRequests ?? []).find(
    (c: any) => c.id === itemId || c.ref === itemId,
  );
  if (compMatch) {
    return {
      refNumber: compMatch.ref,
      title: notif.title || `Guest Service Recovery: Room ${compMatch.room}`,
      categoryLabel: 'HIGH-VALUE GUEST SERVICE RECOVERY',
      department: normalizeDepartmentName(compMatch.department),
      priority: compMatch.tier === 'high_value' ? 'urgent' : 'normal',
      priorityTone: compMatch.tier === 'high_value' ? 'urgent' : 'info',
      status: compMatch.status === 'pending_gm' ? 'Pending General Manager Sign-Off' : compMatch.status,
      statusTone: 'warning',
      originator: compMatch.requestedBy,
      timestamp: compMatch.requestedAt || notif.timestamp,
      amount: `₹${compMatch.amount.toLocaleString('en-IN')}`,
      location: `Room ${compMatch.room} (${compMatch.stayId})`,
      deadline: 'Pre-Checkout Resolution Required',
      targetTab: 'approvals',
      targetTabName: 'Approval Center (High-Value Compensation)',
      description: compMatch.reason,
      evidence: compMatch.supportingEvidence,
      justification: compMatch.deptManagerDecision?.comments || 'Amount exceeds department manager ceiling. Escalated for GM executive endorsement.',
      auditHistory: compMatch.history?.map((h: any) => ({ at: h.at, status: h.action, note: `${h.actor} (${h.role}): ${h.note}` })),
    };
  }

  // 6. Check Escalated Tasks across roles
  const allTasks: WorkItem[] = [];
  (['department_manager', 'department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'] as const).forEach((r) => {
    (state.items?.[r] ?? []).forEach((item: any) => allTasks.push(item));
  });
  const taskMatch = allTasks.find((t) => t.id === itemId || t.ref === itemId);
  if (taskMatch) {
    return {
      refNumber: taskMatch.ref || taskMatch.id,
      title: taskMatch.title,
      categoryLabel: 'OPERATIONAL ESCALATION',
      department: normalizeDepartmentName(taskMatch.department || notif.department),
      priority: taskMatch.priority || 'critical',
      priorityTone: 'critical',
      status: taskMatch.status,
      statusTone: 'warning',
      originator: taskMatch.meta || 'Department Dispatcher',
      timestamp: notif.timestamp,
      location: 'Hotel Operations',
      deadline: 'Immediate Attendant Dispatch',
      targetTab: 'escalations',
      targetTabName: 'High Escalations',
      description: taskMatch.description || notif.message || '',
      justification: taskMatch.meta,
    };
  }

  // 7. General Fallback
  const lowerTitle = notif.title.toLowerCase();
  const lowerMsg = (notif.message ?? '').toLowerCase();
  let targetTab = 'approvals';
  let targetTabName = 'Approval Center';
  if (lowerTitle.includes('incident') || lowerMsg.includes('incident')) {
    targetTab = 'incidents';
    targetTabName = 'Property Incidents';
  } else if (lowerTitle.includes('inspection') || lowerMsg.includes('inspection')) {
    targetTab = 'inspections';
    targetTabName = 'Department Inspections';
  } else if (lowerTitle.includes('escalat') || lowerMsg.includes('escalat')) {
    targetTab = 'escalations';
    targetTabName = 'High Escalations';
  }

  return {
    refNumber: notif.itemId ? `REF: ${notif.itemId.toUpperCase()}` : 'EX-NOTIF',
    title: notif.title,
    categoryLabel: 'EXECUTIVE NOTIFICATION',
    department: normalizeDepartmentName(notif.department),
    priority: notif.priority || 'urgent',
    priorityTone: notif.priority === 'critical' ? 'critical' : notif.priority === 'vip' ? 'vip' : 'urgent',
    status: notif.read ? 'Acknowledged' : 'Pending Executive Review',
    statusTone: notif.read ? 'success' : 'warning',
    originator: 'Executive Notification Dispatcher',
    timestamp: notif.timestamp,
    location: 'Property-wide',
    deadline: 'Standard Executive Attention',
    targetTab,
    targetTabName,
    description: notif.message || '',
  };
}

export function ExecutiveProfileTab({
  initialSubTab = 'profile',
  permissionMode,
  onTogglePermissionMode,
  onNavigateTab,
  onNavigateToItem,
}: ExecutiveProfileTabProps) {
  const { state, markNotificationRead, clearAllNotifications, notify } = useDemo();
  const [subTab, setSubTab] = useState<'profile' | 'notifications' | 'settings'>(initialSubTab);

  // Settings state (frontend only)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsUrgent, setSmsUrgent] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('30s');
  const [displayDensity, setDisplayDensity] = useState('comfortable');

  // Notifications details modal & filter state
  const [selectedNotificationForDetails, setSelectedNotificationForDetails] = useState<InAppNotification | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [notificationSearch, setNotificationSearch] = useState('');

  // Priya Nair persona account
  const priyaAccount = (state.staffAccounts ?? []).find(
    (s) => s.employeeId === 'EMP-0109' || s.roleId === 'executive_viewer',
  ) || {
    id: 'usr-9',
    employeeId: 'EMP-0109',
    name: 'Priya Nair',
    email: 'p.nair@thegrandadp.com',
    department: 'Executive Office',
    floorZone: 'Property-wide',
    shift: 'Day',
    status: 'active',
    financialLimit: 200000,
    skills: ['Executive Oversight', 'High Limit Approvals'],
  };

  const notifications = state.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter(
    (n) => n.priority === 'urgent' || n.priority === 'critical' || n.priority === 'vip',
  ).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (notificationFilter === 'unread' && n.read) return false;
      if (
        notificationFilter === 'urgent' &&
        n.priority !== 'urgent' &&
        n.priority !== 'critical' &&
        n.priority !== 'vip'
      ) {
        return false;
      }
      if (notificationSearch.trim()) {
        const query = notificationSearch.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesMsg = (n.message ?? '').toLowerCase().includes(query);
        const matchesDept = n.department?.toLowerCase().includes(query);
        const matchesRef = n.itemId?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMsg && !matchesDept && !matchesRef) return false;
      }
      return true;
    });
  }, [notifications, notificationFilter, notificationSearch]);

  const handleSaveSettings = () => {
    notify('Executive account preferences updated successfully');
  };

  const activeNotificationDetails = useMemo(() => {
    if (!selectedNotificationForDetails) return null;
    return resolveNotificationDetails(selectedNotificationForDetails, state);
  }, [selectedNotificationForDetails, state]);

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Executive Profile & Workspace Settings
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
              Priya Nair · General Manager
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Credentialed profile, delegated sign-off limits, and executive notification channels.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
          {[
            { id: 'profile', label: 'My Profile' },
            { id: 'notifications', label: 'Notifications', count: unreadCount },
            { id: 'settings', label: 'Preferences' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                subTab === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    subTab === tab.id ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subtab 1: Profile View */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left card: Persona summary */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
            <div className="text-center space-y-2">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white grid place-items-center text-2xl font-black shadow-xl">
                PN
              </div>
              <h3 className="text-base font-black text-navy-950 dark:text-white">
                {priyaAccount.name}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                General Manager & Executive Director
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-[11px] font-mono text-slate-600 dark:text-mist-300">
                {priyaAccount.employeeId} · Active Status
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-mist-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-400" /> Email
                </span>
                <span className="font-mono text-navy-950 dark:text-white">{priyaAccount.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-mist-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" /> Office
                </span>
                <span className="font-medium text-navy-950 dark:text-white">{priyaAccount.department}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-mist-300">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-slate-400" /> Jurisdiction
                </span>
                <span className="font-medium text-navy-950 dark:text-white">Property-Wide (All Floors)</span>
              </div>
            </div>
          </div>

          {/* Right card: Authority, Limits, & Delegation Policy */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Delegated Authority & Statutory Governance
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">
                    Discretionary Financial Ceiling
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-300 mt-1">
                    ₹2,00,000
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-1">
                    Per-transaction capex and guest recovery ceiling. Requests above this require Board resolution.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/[0.08] border border-purple-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">
                    Policy Waiver Authority
                  </span>
                  <div className="text-base font-black text-navy-950 dark:text-white mt-1">
                    Unrestricted
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-1">
                    Authorized to waive cancellation fees, deposit guarantees, and VIP upgrade limits.
                  </p>
                </div>
              </div>

              {/* Separation of Duties Note */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <span className="font-bold text-navy-950 dark:text-white block">
                  Separation of Duties Policy (SOD Invariant):
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-mist-300">
                  <li>Executives hold oversight and sign-off authority only; direct physical task execution is reserved for operational fulfillers.</li>
                  <li>No self-approval of personal expense reimbursements or personal stay adjustments.</li>
                  <li>All authorizations are committed immutably to the permanent system audit trail.</li>
                </ul>
              </div>
            </div>

            {/* Permission Mode Switcher Demonstration Card */}
            <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                    Simulate Permission Mode (Viewer vs Approver)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-mist-400">
                    Toggle between read-only audit inspection and full approval sign-off authority.
                  </p>
                </div>

                <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
                  <button
                    type="button"
                    onClick={() => onTogglePermissionMode('viewer')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      permissionMode === 'viewer'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    Viewer (Read-Only)
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePermissionMode('approver')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      permissionMode === 'approver'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    Approver (Full Access)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Notifications Center */}
      {subTab === 'notifications' && (
        <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-5">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Executive Notification Stream
              </h3>
              <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                Real-time operational alerts, capex approvals, safety broadcast requests, and department inspection notices.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setNotificationFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  notificationFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                <span>All Alerts</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                  {notifications.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setNotificationFilter('unread')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  notificationFilter === 'unread'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setNotificationFilter('urgent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  notificationFilter === 'urgent'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                <span>Urgent & Critical</span>
                {urgentCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-900 dark:text-amber-200">
                    {urgentCount}
                  </span>
                )}
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={notificationSearch}
                onChange={(e) => setNotificationSearch(e.target.value)}
                placeholder="Search notifications by title, ref, or department..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950 text-xs text-navy-950 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 dark:text-mist-500 space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="font-semibold text-slate-600 dark:text-mist-300">
                No notifications matching current filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const details = resolveNotificationDetails(notif, state);
                const isUrgent =
                  notif.priority === 'urgent' ||
                  notif.priority === 'critical' ||
                  notif.priority === 'vip';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      setSelectedNotificationForDetails(notif);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                      notif.read
                        ? 'border-slate-200/80 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                        : 'border-amber-500/40 bg-amber-500/[0.06] hover:bg-amber-500/[0.09] shadow-sm'
                    }`}
                  >
                    {/* Top Row: Badges, Ref, Timestamp, Unread Dot */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            notif.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : notif.priority === 'urgent'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : notif.priority === 'vip'
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {notif.priority || 'Normal'}
                        </span>

                        {/* Department Badge */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-mist-200 border border-slate-200 dark:border-white/10">
                          {details.department}
                        </span>

                        {/* Reference Number */}
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {details.refNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-mist-500 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{notif.timestamp}</span>
                        {!notif.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-amber-500 animate-pulse ml-1"
                            title="Unread alert"
                          />
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Message */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-navy-950 dark:text-white">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-mist-300 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Bottom Metadata & Action Buttons */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-mist-400 flex-wrap">
                        {details.amount && (
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                            Amount: {details.amount}
                          </span>
                        )}
                        {details.location && (
                          <span>
                            Location: <strong className="text-navy-950 dark:text-white font-medium">{details.location}</strong>
                          </span>
                        )}
                        {details.deadline && (
                          <span>
                            Target: <strong className="text-navy-950 dark:text-white font-medium">{details.deadline}</strong>
                          </span>
                        )}
                        <span className="hidden md:inline">
                          Directs to: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{details.targetTabName}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(notif.id);
                            setSelectedNotificationForDetails(notif);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-navy-950 dark:text-white transition flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>View Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(notif.id);
                            if (onNavigateToItem) {
                              onNavigateToItem(notif);
                            } else if (onNavigateTab) {
                              onNavigateTab(details.targetTab);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                        >
                          <span>Direct to Field</span>
                          <ArrowRight className="h-3.5 w-3.5" />
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

      {/* Subtab 3: Preferences / Settings */}
      {subTab === 'settings' && (
        <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-950 dark:text-white">
              Executive Console Preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-mist-400">
              Customize real-time telemetry polling, notification thresholds, and currency formats.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* Toggle 1: Email Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <div>
                <span className="text-xs font-bold text-navy-950 dark:text-white block">
                  Email Dispatch on Capex &gt; ₹25,000
                </span>
                <span className="text-[11px] text-slate-500 dark:text-mist-400">
                  Sends formal quotation packages directly to Priya Nair's executive inbox.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
              />
            </div>

            {/* Toggle 2: SMS Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <div>
                <span className="text-xs font-bold text-navy-950 dark:text-white block">
                  SMS / WhatsApp on Critical Incidents
                </span>
                <span className="text-[11px] text-slate-500 dark:text-mist-400">
                  Immediate pager notification when security panic alarms or major water leaks occur.
                </span>
              </div>
              <input
                type="checkbox"
                checked={smsUrgent}
                onChange={(e) => setSmsUrgent(e.target.checked)}
                className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
              />
            </div>

            {/* Polling Interval */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5">
              <label className="text-xs font-bold text-navy-950 dark:text-white block">
                Telemetry Auto-Refresh Cadence
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white"
              >
                <option value="15s">15 seconds (High Frequency)</option>
                <option value="30s">30 seconds (Standard)</option>
                <option value="60s">60 seconds (Conservative)</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Executive Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Request Inspection Modal */}
      {selectedNotificationForDetails && activeNotificationDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20 bg-white dark:bg-ink-900 shadow-2xl p-6 space-y-5 text-navy-950 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center font-bold font-mono border border-amber-500/30 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {activeNotificationDetails.refNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300">
                      {activeNotificationDetails.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      {activeNotificationDetails.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-navy-950 dark:text-white mt-1">
                    {activeNotificationDetails.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotificationForDetails(null)}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notification Alert Message Banner */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <Bell className="h-4 w-4" />
                <span>Executive Alert Dispatch Notice</span>
                <span className="font-mono text-[10px] text-amber-600/80 dark:text-amber-400/80 ml-auto">
                  {selectedNotificationForDetails.timestamp}
                </span>
              </div>
              <p className="text-slate-700 dark:text-mist-200 leading-relaxed pl-6">
                {selectedNotificationForDetails.message}
              </p>
            </div>

            {/* Exact Request Fields Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                Detailed Request Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Field 1: Reference */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                    Item Reference / Case ID
                  </span>
                  <span className="font-mono font-bold text-navy-950 dark:text-white mt-0.5 block">
                    {activeNotificationDetails.refNumber}
                  </span>
                </div>

                {/* Field 2: Department */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                    Originating Department
                  </span>
                  <span className="font-bold text-navy-950 dark:text-white mt-0.5 block">
                    {activeNotificationDetails.department}
                  </span>
                </div>

                {/* Field 3: Submitter / Coordinator */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                    Requester / Assigned Coordinator
                  </span>
                  <span className="font-medium text-navy-950 dark:text-white mt-0.5 block">
                    {activeNotificationDetails.originator}
                  </span>
                </div>

                {/* Field 4: Urgency / Priority */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                    Priority & Escalation Tier
                  </span>
                  <span className="font-bold capitalize text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {activeNotificationDetails.priority} Priority
                  </span>
                </div>

                {/* Field 5: Financial Amount (if applicable) */}
                {activeNotificationDetails.amount && (
                  <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05]">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                      Requisition / Recovery Amount
                    </span>
                    <span className="font-mono text-base font-black text-amber-700 dark:text-amber-300 mt-0.5 block">
                      {activeNotificationDetails.amount}
                    </span>
                  </div>
                )}

                {/* Field 6: Target Location */}
                {activeNotificationDetails.location && (
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                      Target Location / Floor Zone
                    </span>
                    <span className="font-medium text-navy-950 dark:text-white mt-0.5 block">
                      {activeNotificationDetails.location}
                    </span>
                  </div>
                )}

                {/* Field 7: Target Deadline / SLA */}
                {activeNotificationDetails.deadline && (
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                      Target SLA / Deadline
                    </span>
                    <span className="font-medium text-navy-950 dark:text-white mt-0.5 block">
                      {activeNotificationDetails.deadline}
                    </span>
                  </div>
                )}

                {/* Field 8: Workflow Status */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                    Workflow Authority State
                  </span>
                  <span className="font-bold text-navy-950 dark:text-white mt-0.5 block">
                    {activeNotificationDetails.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Description / Narrative */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                Detailed Scope & Rationale
              </h4>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-slate-700 dark:text-mist-200 leading-relaxed">
                {activeNotificationDetails.description}
              </div>
            </div>

            {/* Checklist items (for Inspections) */}
            {activeNotificationDetails.checklist && activeNotificationDetails.checklist.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                  Inspection Checklist Standards
                </h4>
                <div className="space-y-1.5 p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs">
                  {activeNotificationDetails.checklist.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        {c.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className="text-navy-950 dark:text-white">{c.item}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        c.passed
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {c.passed ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items / Highlights (if present) */}
            {activeNotificationDetails.actionItems && activeNotificationDetails.actionItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                  Active Operational Directives
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-mist-300">
                  {activeNotificationDetails.actionItems.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Supporting Evidence (if present) */}
            {activeNotificationDetails.evidence && (
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                  Supporting Operational Documentation
                </span>
                <p className="text-slate-700 dark:text-mist-200">{activeNotificationDetails.evidence}</p>
              </div>
            )}

            {/* Audit History Timeline (if present) */}
            {activeNotificationDetails.auditHistory && activeNotificationDetails.auditHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                  Audit Trail & Escalation History
                </h4>
                <div className="space-y-2 pl-2 border-l-2 border-amber-500/30 text-xs">
                  {activeNotificationDetails.auditHistory.map((step, idx) => (
                    <div key={idx} className="relative pl-3">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-mist-500 block">
                        {step.at} · {step.status}
                      </span>
                      <p className="text-navy-950 dark:text-white mt-0.5">{step.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Direct Destination: <strong className="text-amber-600 dark:text-amber-400">{activeNotificationDetails.targetTabName}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNotificationForDetails(null)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const notif = selectedNotificationForDetails;
                    setSelectedNotificationForDetails(null);
                    if (onNavigateToItem) {
                      onNavigateToItem(notif);
                    } else if (onNavigateTab) {
                      onNavigateTab(activeNotificationDetails.targetTab);
                    }
                  }}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-lg shadow-amber-500/25 flex items-center gap-1.5"
                >
                  <span>Direct to Exact Field in {activeNotificationDetails.targetTabName}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
