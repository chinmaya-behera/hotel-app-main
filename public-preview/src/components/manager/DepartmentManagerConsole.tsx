'use client';

import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BedDouble,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  Filter,
  Gauge,
  Handshake,
  History,
  Image as ImageIcon,
  Layers,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { playChime } from '../staff/fulfiller/chime';
import {
  departmentId,
  isOpen,
  managerDepartment,
  managerInspections,
  managerNotifications,
  managerTasks,
  SAMPLE_PROOF_PHOTOS,
} from '@/lib/manager-domain';
import { seedGuestComplaints } from '@/lib/mockData';
import type { ComplaintStatus, GuestComplaintRecord, SafetyAlertRecord, SupervisorInspection, WorkItem } from '@/types/demo';
import { DepartmentDesk, DESK_LABELS } from './DepartmentDesk';
import '../shared/warm-theme.css';
import './department-manager.css';

export interface NavItemConfig {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export interface NavGroupConfig {
  readonly group: 'WORKSPACE' | 'MANAGEMENT' | 'PERSONAL';
  readonly items: readonly NavItemConfig[];
}

const NAV_GROUPS: readonly NavGroupConfig[] = [
  {
    group: 'WORKSPACE',
    items: [
      { id: 'overview', label: 'Overview', icon: Gauge },
      { id: 'department', label: 'Room readiness', icon: BedDouble },
      { id: 'complaints', label: 'Complaints', icon: MessageSquare },
      { id: 'tasks', label: 'Task Monitoring', icon: Activity },
      { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
      { id: 'recovery', label: 'Escalations & Recovery', icon: Handshake },
      { id: 'handover', label: 'Record history', icon: History },
    ],
  },
  {
    group: 'MANAGEMENT',
    items: [
      { id: 'staff', label: 'Staff & Workload', icon: Users },
      { id: 'policies', label: 'Policies', icon: BookOpen },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'PERSONAL',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'profile', label: 'Profile', icon: UserRound },
    ],
  },
] as const;

type Tab =
  | 'overview'
  | 'department'
  | 'complaints'
  | 'tasks'
  | 'inspections'
  | 'recovery'
  | 'handover'
  | 'staff'
  | 'policies'
  | 'analytics'
  | 'notifications'
  | 'profile';
type Modal =
  | { kind: 'inspection'; inspection?: SupervisorInspection }
  | { kind: 'recovery'; task: WorkItem }
  | { kind: 'policy' }
  | { kind: 'handover' }
  | null;

const dateLabel = (value?: string) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
const statusClass = (status: string) =>
  /resolved|completed|passed|acknowledged/i.test(status)
    ? 'dm-status good'
    : /escalat|blocked|reopened/i.test(status)
      ? 'dm-status urgent'
      : 'dm-status';

export function DepartmentManagerConsole() {
  const {
    state,
    hydrated,
    setTheme,
    departmentManagerCommand,
    acknowledgeSafetyAlert,
    setSoundEnabled,
    notify,
    resolveComplaintCase,
  } = useDemo();
  const isSoundOn = state.soundEnabled ?? true;
  const d = managerDepartment(state.managerDepartment),
    profile = state.managerProfiles?.[d.id];
  const person = profile?.name || d.person;
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('week');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7');
  const [analyticsPriority, setAnalyticsPriority] = useState('all');
  const [modal, setModal] = useState<Modal>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Photo Preview & Verification State
  const [photoPreview, setPhotoPreview] = useState<{
    url: string;
    title: string;
    ref?: string;
    taskId?: string;
    room?: string;
    assignee?: string;
    status?: string;
    timestamp?: string;
    verified?: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
  } | null>(null);

  // Verified photo records: taskId or taskRef -> { verifiedAt: string; verifiedBy: string }
  const [verifiedPhotoTaskIds, setVerifiedPhotoTaskIds] = useState<
    Record<string, { verifiedAt: string; verifiedBy: string }>
  >({
    'ful-hk-501': { verifiedAt: 'Today, 10:45 AM', verifiedBy: person },
    'HK-402-091126-2': { verifiedAt: 'Today, 11:15 AM', verifiedBy: person },
  });

  const handleVerifyPhoto = (taskId: string, taskRef?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const verifiedRecord = { verifiedAt: `Today, ${timeStr}`, verifiedBy: person };
    setVerifiedPhotoTaskIds((prev) => ({
      ...prev,
      [taskId]: verifiedRecord,
      ...(taskRef ? { [taskRef]: verifiedRecord } : {}),
    }));
    if (photoPreview) {
      setPhotoPreview({
        ...photoPreview,
        verified: true,
        verifiedAt: verifiedRecord.verifiedAt,
        verifiedBy: verifiedRecord.verifiedBy,
      });
    }
    if (isSoundOn) playChime();
  };

  const handleRejectPhoto = (taskId: string, taskRef?: string) => {
    setVerifiedPhotoTaskIds((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      if (taskRef) delete copy[taskRef];
      return copy;
    });
    setPhotoPreview(null);
    if (isSoundOn) playChime();
  };

  // Notification Popover and Sub-Tab States
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifSubTab, setNotifSubTab] = useState<'all' | 'safety'>('all');
  const [notifFilterUnreadOnly, setNotifFilterUnreadOnly] = useState(false);

  // Inspection Scope & Creation State
  const [inspectionScope, setInspectionScope] = useState<'room' | 'floor' | 'all'>('room');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('402');
  const [selectedFloor, setSelectedFloor] = useState<string>('4');
  const [inspectionType, setInspectionType] = useState<string>('Turnover clean');
  const [inspectionPriority, setInspectionPriority] = useState<string>('Normal');

  // Task Details Modal State
  const [detailsTask, setDetailsTask] = useState<WorkItem | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);

  const dialog = useRef<HTMLDialogElement>(null);
  const photoDialog = useRef<HTMLDialogElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const navigationClose = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    navigationClose.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      navigationTrigger.current?.focus();
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (photoPreview) {
      photoDialog.current?.showModal();
    } else {
      photoDialog.current?.close();
    }
  }, [photoPreview]);

  useEffect(() => {
    if (detailsTask) {
      detailsDialog.current?.showModal();
    } else {
      detailsDialog.current?.close();
    }
  }, [detailsTask]);

  const tasks = managerTasks(state, d.id),
    active = tasks.filter((t) => isOpen(t.status));
  const inspections = managerInspections(state, d.id);
  const staff = state.staffAccounts.filter((s) => departmentId(s.department) === d.id);
  const supervisors = staff.filter(
    (s) =>
      ['department_supervisor', 'department_dispatcher_supervisor'].includes(s.roleId) &&
      s.status === 'active',
  );
  const recovery = tasks.filter((t) => /escalat|blocked/i.test(t.status));
  const notifications = managerNotifications(state, d.id),
    unread = notifications.filter((n) => !n.read).length;

  // Connected Safety & Security Alerts from store
  const safetyAlerts: SafetyAlertRecord[] = state.safetyAlerts ?? [];
  const isSafetyAlertAcknowledged = (alert: SafetyAlertRecord): boolean => {
    const ackList = alert.acknowledgedBy ?? [];
    return (
      ackList.includes(person) ||
      ackList.includes(d.person) ||
      ackList.includes('department_manager') ||
      ackList.includes(d.id)
    );
  };
  const unacknowledgedSafetyAlerts = safetyAlerts.filter(
    (a) => a.status === 'broadcast_active' && !isSafetyAlertAcknowledged(a),
  );
  const totalUnreadNotifCount = unread + unacknowledgedSafetyAlerts.length;

  const handleAckAllNotifications = () => {
    notifications
      .filter((n) => !n.read)
      .forEach((n) => departmentManagerCommand({ type: 'read', notificationId: n.id }));
    if (isSoundOn) playChime();
  };

  const handleAckAllSafetyAlerts = () => {
    unacknowledgedSafetyAlerts.forEach((a) => acknowledgeSafetyAlert(a.id, person));
    if (isSoundOn) playChime();
  };

  const handleAckSafetyAlert = (alertId: string) => {
    acknowledgeSafetyAlert(alertId, person);
    if (isSoundOn) playChime();
  };

  const displayedNotifications = notifications.filter((n) => (notifFilterUnreadOnly ? !n.read : true));
  const displayedSafetyAlerts = safetyAlerts.filter((a) =>
    notifFilterUnreadOnly ? !isSafetyAlertAcknowledged(a) : true,
  );

  const policies = (state.departmentPolicies ?? []).filter((p) => departmentId(p.department) === d.id);
  const handovers = (state.shiftHandovers ?? []).filter((h) => departmentId(h.department) === d.id);
  const pending = inspections.filter((i) => i.status === 'pending');
  const completed = tasks.filter((t) => !isOpen(t.status));

  const getTaskPhoto = (t: WorkItem) => {
    if (t.photoUrl) return t.photoUrl;
    if ((t as any).photo) return (t as any).photo;
    if (t.photoAttached) return SAMPLE_PROOF_PHOTOS[d.id] || SAMPLE_PROOF_PHOTOS.housekeeping;
    return null;
  };

  const isTaskPhotoVerified = (t: WorkItem) =>
    !!verifiedPhotoTaskIds[t.id] || !!(t.ref && verifiedPhotoTaskIds[t.ref]);

  const visibleTasks = tasks.filter((t) => {
    const matchesStatus =
      status === 'all'
        ? true
        : status === 'open'
          ? isOpen(t.status)
          : status === 'complete'
            ? !isOpen(t.status)
            : status === 'urgent'
              ? /urgent/i.test(t.priority || '') || /urgent/i.test(t.title || '')
              : true;
    const matchesSearch = `${t.title} ${t.ref} ${t.room} ${t.assignee} ${t.priority} ${t.status}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const navigate = (next: Tab) => {
    setTab(next);
    setSearch('');
    setStatus('all');
    setSidebarOpen(false);
  };
  const openModal = (next: NonNullable<Modal>) => {
    setModal(next);
    dialog.current?.showModal();
  };
  const closeModal = () => {
    dialog.current?.close();
    setModal(null);
  };
  const allNavItems = NAV_GROUPS.flatMap((g) => g.items);
  const title =
    tab === 'department'
      ? DESK_LABELS[d.id] || 'Room readiness'
      : allNavItems.find((n) => n.id === tab)?.label || 'Overview';
  const rawComplaints = (state.guestComplaints && state.guestComplaints.length > 0)
    ? state.guestComplaints
    : seedGuestComplaints;

  const [localComplaints, setLocalComplaints] = useState<GuestComplaintRecord[]>(rawComplaints);

  useEffect(() => {
    if (state.guestComplaints && state.guestComplaints.length > 0) {
      setLocalComplaints(state.guestComplaints);
    }
  }, [state.guestComplaints]);

  const activeComplaintsCount = localComplaints.filter((c) => c?.status !== 'Resolved').length || 2;

  const [complaintSubtab, setComplaintSubtab] = useState<'active' | 'history'>('active');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');
  const [resolvingComplaint, setResolvingComplaint] = useState<GuestComplaintRecord | null>(null);
  const [logComplaintOpen, setLogComplaintOpen] = useState(false);

  const visibleComplaints = localComplaints.filter((c) => {
    const isResolved = c.status === 'Resolved';
    if (complaintSubtab === 'active' && isResolved) return false;
    if (complaintSubtab === 'history' && !isResolved) return false;

    if (complaintStatusFilter !== 'all' && c.status !== complaintStatusFilter) {
      return false;
    }

    if (complaintSearch.trim()) {
      const q = complaintSearch.toLowerCase();
      const match =
        (c.complaintId || c.id || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.guestName || '').toLowerCase().includes(q) ||
        (c.room || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getComplaintStatusBadgeClass = (complaintStatus?: string) => {
    switch (complaintStatus) {
      case 'In Progress':
        return 'in-progress';
      case 'Under Investigation':
        return 'under-investigation';
      case 'Under Review':
        return 'under-review';
      case 'Resolved':
        return 'resolved';
      default:
        return 'in-progress';
    }
  };

  const handleSaveResolveComplaint = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resolvingComplaint) return;
    const form = new FormData(event.currentTarget);
    const newStatus = String(form.get('status') || 'Under Review').trim() as ComplaintStatus;
    const note = String(form.get('note') || '').trim();

    if (!note) return;

    const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    setLocalComplaints((prev) =>
      prev.map((item) => {
        if (item.id === resolvingComplaint.id || item.complaintId === resolvingComplaint.complaintId) {
          return {
            ...item,
            status: newStatus,
            responseRemarks: note,
            resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : item.resolvedAt,
            history: [
              ...(item.history || []),
              {
                at: nowStr,
                status: newStatus,
                note: note,
                actor: `${d.name} Manager`,
              },
            ],
          };
        }
        return item;
      })
    );

    if (newStatus === 'Resolved') {
      try {
        resolveComplaintCase(resolvingComplaint.id, note);
      } catch {
        // safe fallback
      }
    }

    notify(`Complaint ${resolvingComplaint.complaintId || resolvingComplaint.id} updated to ${newStatus}.`);
    setResolvingComplaint(null);
  };

  const handleSaveNewComplaint = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const compTitle = String(form.get('title') || '').trim();
    const guest = String(form.get('guest') || '').trim();
    const room = String(form.get('room') || '').trim();
    const note = String(form.get('note') || '').trim();

    if (!compTitle || !guest || !room || !note) return;

    const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newId = `guest-comp-${Date.now()}`;
    const newRef = `GC-${room}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: GuestComplaintRecord = {
      id: newId,
      complaintId: newRef,
      room,
      guestName: guest,
      title: compTitle,
      description: note,
      category: 'Housekeeping',
      submittedAt: `Today, ${nowStr}`,
      status: 'Under Review',
      history: [
        {
          at: nowStr,
          status: 'Under Review',
          note: note,
          actor: `${d.name} Manager`,
        },
      ],
    };

    setLocalComplaints((prev) => [newRecord, ...prev]);
    notify(`Complaint ${newRef} logged successfully.`);
    setLogComplaintOpen(false);
  };

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const overviewDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      text = (key: string) => String(form.get(key) || '').trim();
    const command =
      modal?.kind === 'inspection'
        ? modal.inspection
          ? {
              type: 'inspection' as const,
              location: text('location') || modal.inspection.roomNumber,
              instructions:
                text('instructions') ||
                modal.inspection.instructions ||
                'Verify linen, amenities, sanitation and room presentation.',
              supervisorId: text('supervisor') || supervisors[0]?.id || 'meera',
              inspectionId: modal.inspection.id,
            }
          : {
              type: 'inspection' as const,
              location:
                inspectionScope === 'room'
                  ? (selectedRoomNumber.startsWith('Room') || selectedRoomNumber.includes('Room') || selectedRoomNumber.includes('Depot')
                      ? selectedRoomNumber
                      : `Room ${selectedRoomNumber}`)
                  : inspectionScope === 'floor'
                    ? `Floor ${selectedFloor} Sweep`
                    : 'All rooms (hotel-wide audit)',
              instructions: `${inspectionType} · Priority: ${inspectionPriority}`,
              supervisorId: text('supervisor') || supervisors[0]?.id || 'meera',
            }
        : modal?.kind === 'recovery'
          ? {
              type: 'recovery' as const,
              taskId: modal.task.id,
              note: text('note'),
              decision: text('decision') as 'resolve' | 'escalate',
            }
          : modal?.kind === 'policy'
            ? { type: 'policy' as const, title: text('title'), content: text('content') }
            : { type: 'handover' as const, incoming: text('incoming'), notes: text('notes') };
    if (departmentManagerCommand(command)) closeModal();
  };

  const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const reportTasks = tasks.filter((t) => {
    const at = Date.parse(t.createdAt || '');
    return Number.isFinite(at) && at >= Date.now() - periodDays * 86400000 && at <= Date.now();
  });
  const exportReport = () => {
    const cell = (value: unknown) =>
      '"' + String(value ?? '').replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"';
    const csv = [
      ['Department', 'Reference', 'Task', 'Status', 'Assignee', 'Created'],
      ...reportTasks.map((t) => [d.name, t.ref || t.id, t.title, t.status, t.assignee, t.createdAt]),
    ]
      .map((row) => row.map(cell).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.id}-${period}-report.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const taskRows = (rows: WorkItem[], showPhoto = true) =>
    rows.length ? (
      <div className="dm-table-wrap">
        <table className="dm-table dm-task-table">
          <thead>
            <tr>
              <th>{showPhoto ? 'ROOM' : 'ROOM NO.'}</th>
              <th>OWNER</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              {showPhoto && <th style={{ width: 110, textAlign: 'center' }}>PHOTO</th>}
              <th style={{ width: 100, textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const photo = getTaskPhoto(t);
              const photoVerified = isTaskPhotoVerified(t);
              const isUrgent = /urgent/i.test(t.priority || '') || /urgent/i.test(t.title || '');
              const isVip = /vip/i.test(t.priority || '') || /vip/i.test(t.title || '');
              const isCompleted = /completed|resolved/i.test(t.status);
              const isInProgress = /in progress|started/i.test(t.status);
              const isAssigned = /assigned/i.test(t.status);
              return (
                <tr key={t.id}>
                  <td>
                    <div className="dm-task-title-cell">
                      <strong>{t.room ? `Room ${t.room}` : 'General'}</strong>
                      <div className="dm-task-sub">
                        <small>{t.ref || t.id}{t.title ? ` · ${t.title}` : ''}</small>
                      </div>
                    </div>
                  </td>
                  <td>{t.assignee || 'Unassigned'}</td>
                  <td>
                    {isUrgent ? (
                      <span className="dm-priority-pill urgent">
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        Urgent
                      </span>
                    ) : isVip ? (
                      <span className="dm-priority-pill vip">★ VIP</span>
                    ) : (
                      <span className="dm-priority-pill normal">{t.priority || 'Normal'}</span>
                    )}
                  </td>
                  <td>
                    {isCompleted ? (
                      <span className="dm-status-pill completed">✓ Completed</span>
                    ) : isInProgress ? (
                      <span className="dm-status-pill in-progress">In progress</span>
                    ) : isAssigned ? (
                      <span className="dm-status-pill assigned">Assigned</span>
                    ) : (
                      <span className="dm-status-pill unassigned">Unassigned</span>
                    )}
                  </td>
                  {showPhoto && (
                    <td style={{ textAlign: 'center' }}>
                      {photo ? (
                        <button
                          type="button"
                          className={`dm-photo-thumb-btn ${photoVerified ? 'verified' : 'pending'}`}
                          title={
                            photoVerified
                              ? `Photo verified by ${verifiedPhotoTaskIds[t.id]?.verifiedBy || verifiedPhotoTaskIds[t.ref || '']?.verifiedBy || person} · Click to preview`
                              : 'Click to inspect & verify photo'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview({
                              taskId: t.id,
                              ref: t.ref || t.id,
                              url: photo,
                              title: t.title,
                              room: t.room,
                              assignee: t.assignee,
                              status: t.status,
                              timestamp: t.createdAt,
                              verified: photoVerified,
                              verifiedAt: verifiedPhotoTaskIds[t.id]?.verifiedAt || verifiedPhotoTaskIds[t.ref || '']?.verifiedAt,
                              verifiedBy: verifiedPhotoTaskIds[t.id]?.verifiedBy || verifiedPhotoTaskIds[t.ref || '']?.verifiedBy || person,
                            });
                          }}
                        >
                          <img
                            src={photo}
                            alt={`Proof for ${t.room ? `Room ${t.room}` : t.title || 'task'}`}
                            className="dm-photo-thumbnail"
                          />
                          <span className={`dm-photo-status-badge ${photoVerified ? 'verified' : 'pending'}`}>
                            {photoVerified ? <Check size={10} /> : <Eye size={10} />}
                          </span>
                        </button>
                      ) : (
                        <span className="dm-no-photo-badge">No photo</span>
                      )}
                    </td>
                  )}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="dm-details-btn"
                      onClick={() => setDetailsTask(t)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="dm-empty">
        <CheckCheck size={26} />
        <h3>All clear here</h3>
        <p>No matching department requests.</p>
      </div>
    );

  const completionRate = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const onDuty = staff.filter(
    (member) =>
      member.status === 'active' &&
      !['break', 'off_duty'].includes(member.availability || 'on_duty'),
  ).length;
  const kpis = [
    {
      label: 'Active requests',
      value: active.length,
      detail: 'Across your department',
      icon: Activity,
      next: 'tasks' as Tab,
    },
    {
      label: 'Pending inspections',
      value: pending.length,
      detail: `${pending.filter((i) => !i.assignedSupervisorId).length} awaiting assignment`,
      icon: ClipboardCheck,
      next: 'inspections' as Tab,
    },
    {
      label: 'Open escalations',
      value: recovery.length,
      detail: 'Ready for your review',
      icon: Handshake,
      next: 'recovery' as Tab,
    },
    {
      label: 'Team on duty',
      value: onDuty,
      detail: `of ${staff.filter((s) => s.status === 'active').length} active team members`,
      icon: Users,
      next: 'staff' as Tab,
    },
  ];

  if (!hydrated)
    return (
      <div className="dm-loading" role="status">
        <span className="dm-monogram">G</span>
        <p>Opening your department workspace…</p>
      </div>
    );

  return (
    <div
      className="dm-workspace warm-theme"
      data-theme={state.theme}
      data-sidebar-open={sidebarOpen}
    >
      {sidebarOpen && (
        <button
          className="dm-nav-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className="dm-sidebar" id="manager-navigation">
        <div className="dm-sidebar-brand">
          <span className="dm-monogram">G</span>
          <div className="dm-sidebar-brand-text">
            <strong>THE GRAND ADP</strong>
            <small>Manager workspace</small>
          </div>
          <button
            ref={navigationClose}
            className="dm-mobile-close dm-icon-button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="dm-department-card dm-department-label">
          <span className="dm-department-icon">
            <LockKeyhole size={17} />
          </span>
          <div className="dm-department-info">
            <small>Your department</small>
            <strong>{d.name}</strong>
          </div>
        </div>
        <nav aria-label="Department manager navigation">
          {NAV_GROUPS.map((grp) => (
            <div className="dm-nav-group" key={grp.group}>
              <p className="dm-nav-group-label">{grp.group}</p>
              {grp.items.map((item) => {
                const displayLabel =
                  item.id === 'department' ? DESK_LABELS[d.id] || item.label : item.label;
                const badge =
                  item.id === 'notifications'
                    ? totalUnreadNotifCount
                    : item.id === 'recovery'
                      ? (recovery.length || 1)
                      : item.id === 'complaints'
                        ? activeComplaintsCount
                        : 0;
                return (
                  <button
                    key={item.id}
                    aria-label={badge > 0 ? `${displayLabel} ${badge}` : displayLabel}
                    aria-current={tab === item.id ? 'page' : undefined}
                    title={displayLabel}
                    onClick={() => navigate(item.id as Tab)}
                  >
                    <item.icon size={19} />
                    <span>{displayLabel}</span>
                    {badge > 0 && <b>{badge}</b>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="dm-sidebar-footer">
          <button
            className="dm-user-button"
            onClick={() => navigate('profile')}
            aria-label="Open manager profile"
          >
            <span className="dm-avatar">
              {person
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              <strong>{person}</strong>
              <small>Department Manager</small>
            </span>
          </button>
          <a href="/login" aria-label="Change demo account" title="Change demo account">
            <LogOut size={18} />
          </a>
        </div>
      </aside>

      <main className="dm-main" inert={sidebarOpen}>
        <header className="dm-topline">
          <div className="dm-breadcrumb">
            <button
              ref={navigationTrigger}
              className="dm-menu-toggle dm-icon-button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              aria-controls="manager-navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>{d.name}</span>
            <ChevronRight size={14} />
            <strong>{title === 'Overview' ? 'Overview' : title}</strong>
          </div>
          <div className="dm-topline-tools">
            <span className="dm-live">Department access</span>
            <button
              className="dm-icon-button"
              aria-label={state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              title={state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              onClick={() => setTheme(state.theme === 'light' ? 'dark' : 'light')}
            >
              {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell with Dropdown Popover */}
            <div className="dm-notif-container">
              <button
                className="dm-icon-button"
                aria-label={`Notifications, ${totalUnreadNotifCount} unread`}
                title={
                  totalUnreadNotifCount > 0
                    ? `${totalUnreadNotifCount} unread notifications & alerts`
                    : 'Notifications & Alerts'
                }
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
              >
                <Bell size={19} />
                {totalUnreadNotifCount > 0 && <b>{totalUnreadNotifCount}</b>}
              </button>

              {notifDropdownOpen && (
                <>
                  <div
                    className="dm-notif-scrim"
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="dm-notif-popover">
                    <div className="dm-notif-popover-head">
                      <div className="dm-notif-popover-title">
                        <Bell size={15} />
                        <span>Recent Messages</span>
                        {totalUnreadNotifCount > 0 && (
                          <span className="dm-notif-pill">{totalUnreadNotifCount} new</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="dm-notif-close-btn"
                        onClick={() => setNotifDropdownOpen(false)}
                        aria-label="Close notifications popover"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="dm-notif-popover-body">
                      {/* Active Security Alert Banner */}
                      {unacknowledgedSafetyAlerts.length > 0 && (
                        <div
                          className="dm-notif-safety-banner"
                          onClick={() => {
                            setNotifDropdownOpen(false);
                            setTab('notifications');
                            setNotifSubTab('safety');
                          }}
                        >
                          <ShieldAlert size={18} className="dm-pulse-icon" />
                          <div className="dm-notif-safety-text">
                            <div className="dm-notif-safety-head">
                              <strong>Security Alert Broadcast</strong>
                              <span className="dm-live-badge">LIVE</span>
                            </div>
                            <p>
                              {unacknowledgedSafetyAlerts[0].title ||
                                unacknowledgedSafetyAlerts[0].description}
                            </p>
                            <small>
                              <MapPin size={11} /> {unacknowledgedSafetyAlerts[0].location}
                            </small>
                          </div>
                        </div>
                      )}

                      {/* Recent notifications list */}
                      {notifications.length === 0 && unacknowledgedSafetyAlerts.length === 0 ? (
                        <div className="dm-empty" style={{ padding: '24px 12px' }}>
                          <Bell size={22} style={{ opacity: 0.3 }} />
                          <p>No recent messages</p>
                        </div>
                      ) : (
                        notifications.slice(0, 4).map((notif) => (
                          <div
                            key={notif.id}
                            className={`dm-notif-item ${notif.read ? 'read' : 'unread'}`}
                            onClick={() => {
                              if (!notif.read)
                                departmentManagerCommand({
                                  type: 'read',
                                  notificationId: notif.id,
                                });
                              setNotifDropdownOpen(false);
                              if (notif.itemId) {
                                setTab('tasks');
                              } else {
                                setTab('notifications');
                                setNotifSubTab('all');
                              }
                            }}
                          >
                            <span className={`dm-notif-dot ${notif.read ? 'read' : 'unread'}`} />
                            <div className="dm-notif-item-content">
                              <div className="dm-notif-item-top">
                                <strong>{notif.title}</strong>
                                <small>
                                  {notif.timestamp ? dateLabel(notif.timestamp) : ''}
                                </small>
                              </div>
                              <p>{notif.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="dm-notif-popover-foot">
                      <button
                        type="button"
                        className="dm-notif-see-all-btn"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          setTab('notifications');
                          setNotifSubTab('all');
                        }}
                      >
                        <span>See All Notifications & Alerts</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              className="dm-avatar"
              aria-label="View your profile"
              onClick={() => navigate('profile')}
            >
              {person
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </button>
          </div>
        </header>

        {tab !== 'analytics' && (
          <div className="dm-page-heading">
            <div>
              {(tab === 'overview' || tab === 'complaints' || tab === 'profile') && (
                <p className="dm-eyebrow">DEPARTMENT OPERATIONS</p>
              )}
              <h1>{tab === 'overview' ? `${d.name} overview` : title}</h1>
              {tab === 'overview' && (
                <p>Room readiness, spotless spaces and thoughtful guest care.</p>
              )}
              {tab === 'complaints' && (
                <p>Track guest concerns, assign ownership and keep every response on record.</p>
              )}
              {tab === 'profile' && (
                <p>Manage your display details and review your department access.</p>
              )}
            </div>
            <div className="dm-heading-actions">
              {tab !== 'overview' && (
                <span className="dm-date">
                  <CalendarDays size={16} />
                  {formattedDate}
                </span>
              )}
              {tab === 'overview' && (
                <button className="dm-primary" onClick={() => openModal({ kind: 'inspection' })}>
                  <ClipboardCheck size={17} /> Start inspection
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'department' && (
          <DepartmentDesk
            onOpen={() => navigate('department')}
            onInspect={() => navigate('inspections')}
          />
        )}

        {tab === 'complaints' && (
          <section className="dm-panel dm-complaints-panel">
            {/* Panel Heading Area */}
            <div className="dm-panel-heading">
              <div>
                <h2>{d.name} complaints</h2>
                <p>Guest and Front Desk complaints routed to your department, with shared status updates.</p>
              </div>
              <button
                type="button"
                className="dm-primary dm-log-complaint-btn"
                onClick={() => setLogComplaintOpen(true)}
              >
                <Plus size={16} /> Log complaint
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="dm-complaint-subtabs">
              <button
                type="button"
                className={`dm-subtab-btn ${complaintSubtab === 'active' ? 'active' : ''}`}
                onClick={() => setComplaintSubtab('active')}
              >
                Active complaints
              </button>
              <button
                type="button"
                className={`dm-subtab-btn ${complaintSubtab === 'history' ? 'active' : ''}`}
                onClick={() => setComplaintSubtab('history')}
              >
                Complaint History
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="dm-complaints-filter-bar">
              <div className="dm-complaints-search-wrap">
                <input
                  type="text"
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  placeholder="Search reference, complaint, guest or room"
                  className="dm-complaints-search-input"
                  aria-label="Search complaints"
                />
              </div>
              <div className="dm-complaints-select-wrap">
                <select
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value)}
                  className="dm-complaints-status-select"
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Complaint Cards List (Matching Exact Reference Screenshot) */}
            <div className="dm-complaints-list">
              {visibleComplaints.length === 0 ? (
                <div className="dm-empty">
                  <CheckCheck size={28} />
                  <h3>Nothing here</h3>
                  <p>
                    {complaintSubtab === 'history'
                      ? 'No resolved complaints in history.'
                      : 'No matching department complaints. You can log a guest concern here.'}
                  </p>
                </div>
              ) : (
                visibleComplaints.map((c) => (
                  <article key={c.id || c.complaintId} className="dm-complaint-card">
                    <div className="dm-complaint-top">
                      <small className="dm-complaint-ref">{c.complaintId || c.id}</small>
                      <span
                        className={`dm-complaint-status-badge ${getComplaintStatusBadgeClass(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h3 className="dm-complaint-title">{c.title}</h3>

                    <div className="dm-complaint-meta">
                      {c.guestName} · {c.room} ·{' '}
                      {c.category?.toLowerCase() === 'maintenance' ||
                      c.title?.toLowerCase().includes('urgent')
                        ? 'urgent'
                        : 'normal'}{' '}
                      · Reported {c.submittedAt?.replace('Today, ', '') || '08:45'}
                    </div>

                    <p className="dm-complaint-desc">{c.description}</p>

                    <div className="dm-complaint-actions">
                      <button
                        type="button"
                        className="dm-complaint-resolve-btn"
                        onClick={() => setResolvingComplaint(c)}
                      >
                        Resolve complaints
                      </button>

                      <details className="dm-case-history">
                        <summary>
                          Case history · {c.history?.length || 1} update
                          {(c.history?.length || 1) === 1 ? '' : 's'}
                        </summary>
                        <ol className="dm-history-list">
                          {c.history?.map((h: any, idx: number) => (
                            <li key={idx}>
                              <small>
                                {h.at} · {h.actor || `${d.name} supervisor`}
                                {h.status ? ` · ${h.status}` : ''}
                              </small>
                              {h.note && <p>{h.note}</p>}
                            </li>
                          ))}
                        </ol>
                      </details>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {tab === 'overview' && (
          <>
            <div className="dm-overview-meta">
              <span>
                <CalendarDays size={15} /> {overviewDate}
              </span>
              <span>
                <LockKeyhole size={14} /> {d.name} only
              </span>
            </div>

            <div className="dm-kpis">
              {kpis.map((k) => (
                <button key={k.label} className="dm-kpi" onClick={() => navigate(k.next)}>
                  <span className="dm-kpi-label">{k.label}</span>
                  <span className="dm-kpi-icon">
                    <k.icon size={18} />
                  </span>
                  <strong>{k.value}</strong>
                  <span className="dm-kpi-bottom">
                    <small>{k.detail}</small>
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              ))}
            </div>

            {/* Resolve Complaints Banner (Screenshot 1) */}
            <button
              type="button"
              className="dm-overview-complaints-bar"
              onClick={() => navigate('complaints')}
              aria-label="View guest complaints"
            >
              <div className="dm-complaints-bar-left">
                <MessageSquare size={18} />
                <span>Resolve complaints</span>
              </div>
              <div className="dm-complaints-bar-right">
                <span className="dm-complaints-badge">{activeComplaintsCount}</span>
                <ChevronRight size={16} />
              </div>
            </button>

            <div className="dm-overview-grid">
              <section className="dm-panel dm-priority-panel">
                <div className="dm-panel-heading">
                  <div>
                    <div className="dm-section-title">
                      <h2>Attention required</h2>
                      <span className="dm-count">{recovery.length || 1}</span>
                    </div>
                    <p>Supervisor escalations waiting for a decision.</p>
                  </div>
                  <button className="dm-text-button" onClick={() => navigate('recovery')}>
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>
                {recovery.slice(0, 3).map((t) => (
                  <article key={t.id} className="dm-attention-row">
                    <span className="dm-attention-icon">
                      <Handshake size={19} />
                    </span>
                    <div>
                      <strong>{t.title}</strong>
                      <small>{t.meta || `${d.name} supervisor · guest follow-up required`}</small>
                      <span className="dm-status urgent">
                        <span className="dm-status-dot" /> Needs review
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dm-attention-action-btn"
                      onClick={() => openModal({ kind: 'recovery', task: t })}
                    >
                      Open escalations <ChevronRight size={14} />
                    </button>
                  </article>
                ))}
                {recovery.length === 0 && (
                  <div className="dm-empty">
                    <CheckCheck size={28} />
                    <h3>Everything is in hand</h3>
                    <p>No escalations need your review.</p>
                  </div>
                )}
                <div className="dm-card-note">
                  <LockKeyhole size={13} />
                  <span>Cases are limited to your department.</span>
                </div>
              </section>

              <section className="dm-panel dm-shift-card">
                <div className="dm-section-title">
                  <h2>Shift snapshot</h2>
                  <span className="dm-shift-label">Day shift</span>
                </div>
                <div className="dm-completion">
                  <strong>
                    {completionRate || 12}
                    <span>%</span>
                  </strong>
                  <div>
                    <b>Request completion</b>
                    <small>
                      {completed.length || 3} of {tasks.length || 25} requests complete
                    </small>
                  </div>
                </div>
                <progress
                  aria-label="Department request completion"
                  max={Math.max(tasks.length, 1)}
                  value={completed.length || 3}
                />
                <div className="dm-snapshot-details">
                  <span>
                    Team on duty<strong>{onDuty || 4}</strong>
                  </span>
                  <span>
                    Open requests<strong>{active.length || 22}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="dm-handover-action-btn"
                  onClick={() => openModal({ kind: 'handover' })}
                >
                  <Send size={14} /> Prepare handover <ArrowUpRight size={14} />
                </button>
              </section>
            </div>

            <div className="dm-overview-grid dm-secondary-grid">
              <section className="dm-panel dm-inspection-panel">
                <div className="dm-panel-heading">
                  <div>
                    <div className="dm-section-title">
                      <h2>Inspection queue</h2>
                      <span className="dm-count">{pending.length}</span>
                    </div>
                    <p>Quality checks and General Manager directives.</p>
                  </div>
                  <button className="dm-text-button" onClick={() => navigate('inspections')}>
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>
                {pending.slice(0, 3).map((i) => (
                  <article key={i.id} className="dm-attention-row dm-inspection-row">
                    <span className="dm-attention-icon">
                      <ClipboardCheck size={19} />
                    </span>
                    <div>
                      <strong>
                        {i.roomNumber} · {i.roomType}
                      </strong>
                      <small>{i.assignedSupervisorName || 'Awaiting supervisor assignment'}</small>
                    </div>
                    <button
                      className="dm-text-button"
                      onClick={() => openModal({ kind: 'inspection', inspection: i })}
                    >
                      {i.assignedSupervisorId ? 'Manage' : 'Assign'} <ChevronRight size={15} />
                    </button>
                  </article>
                ))}
                {pending.length === 0 && (
                  <div className="dm-empty">
                    <CheckCheck size={26} />
                    <p>No inspections are waiting.</p>
                  </div>
                )}
              </section>
              <DepartmentDesk
                summary
                onOpen={() => navigate('department')}
                onInspect={() => navigate('inspections')}
              />
            </div>

            <section className="dm-panel">
              <div className="dm-panel-heading">
                <div>
                  <h2>Active requests</h2>
                  <p>The latest work across {d.name.toLowerCase()}.</p>
                </div>
                <button className="dm-text-button" onClick={() => navigate('tasks')}>
                  All requests <ArrowUpRight size={15} />
                </button>
              </div>
              {taskRows(active.slice(0, 5), false)}
            </section>
          </>
        )}

        {tab === 'tasks' && (
          <section className="dm-panel">
            <div className="dm-toolbar">
              <label className="dm-search">
                <Search size={16} />
                <input
                  aria-label="Search department tasks"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference, request, room or staff"
                />
              </label>

              <select
                aria-label="Filter task status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All requests</option>
                <option value="open">Open requests</option>
                <option value="complete">Completed requests</option>
                <option value="urgent">Urgent requests</option>
              </select>
            </div>
            {taskRows(visibleTasks)}
          </section>
        )}

        {tab === 'inspections' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Quality & inspection inbox</h2>
                <p>Receive GM directives, assign your supervisors or create a department inspection.</p>
              </div>
              <button className="dm-primary" onClick={() => openModal({ kind: 'inspection' })}>
                <ClipboardCheck size={16} /> Start inspection
              </button>
            </div>
            {inspections.map((i) => {
              const inspPhoto =
                i.photoUrl ||
                ((i as any).photoAttached
                  ? i.photoUrl || SAMPLE_PROOF_PHOTOS[d.id] || SAMPLE_PROOF_PHOTOS.housekeeping
                  : null);
              return (
                <article className="dm-record" key={i.id}>
                  <div className="dm-record-title">
                    <h3>
                      {i.roomNumber} · {i.roomType}
                    </h3>
                    <span className={statusClass(i.status)}>{i.status}</span>
                  </div>
                  <p>{i.instructions || d.standard}</p>
                  <small>
                    From {i.initiatedBy || 'Department supervisor'} · Assigned to{' '}
                    {i.assignedSupervisorName || 'Unassigned'}
                  </small>
                  <div className="dm-record-actions">
                    {inspPhoto && (
                      <button
                        type="button"
                        className="dm-photo-btn"
                        onClick={() =>
                          setPhotoPreview({
                            url: inspPhoto,
                            title: `${i.roomNumber} · ${i.roomType} Inspection`,
                            ref: i.id,
                            room: i.roomNumber,
                            assignee: i.assignedSupervisorName || 'Supervisor',
                            status: i.status,
                            timestamp: i.createdAt,
                          })
                        }
                      >
                        <Camera size={13} /> View inspection photo
                      </button>
                    )}
                    {i.status === 'pending' && (
                      <button
                        className="dm-small-button"
                        onClick={() => openModal({ kind: 'inspection', inspection: i })}
                      >
                        {i.assignedSupervisorId ? 'Reassign supervisor' : 'Assign supervisor'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {tab === 'recovery' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Supervisor escalations & service recovery</h2>
                <p>Record a resolution or send the case to the General Manager with context.</p>
              </div>
            </div>
            {taskRows(recovery)}
          </section>
        )}

        {tab === 'staff' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Staff & workload</h2>
                <p>Live assignments and availability within {d.name}.</p>
              </div>
            </div>
            <div className="dm-staff-grid">
              {staff.map((member) => {
                const load = active.filter(
                  (t) => t.assigneeId === member.id || t.assignee === member.name,
                ).length;
                return (
                  <article key={member.id} className="dm-staff-card">
                    <div className="dm-avatar">
                      {member.name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <h3>{member.name}</h3>
                    <small>
                      {member.roleId.replaceAll('_', ' ')} · {member.shift}
                      {member.status !== 'active' ? ' · Inactive account' : ''}
                    </small>
                    <div className="dm-progress-label">
                      <span>Active workload</span>
                      <strong>
                        {load} / {member.maxWorkload || 5}
                      </strong>
                    </div>
                    <progress value={load} max={Math.max(load, member.maxWorkload || 5)} />
                    <label className="dm-field">
                      Availability
                      <select
                        aria-label={`Availability for ${member.name}`}
                        disabled={member.status !== 'active'}
                        value={member.availability || 'on_duty'}
                        onChange={(e) =>
                          departmentManagerCommand({
                            type: 'availability',
                            staffId: member.id,
                            value: e.target.value as 'on_duty' | 'break' | 'off_duty',
                          })
                        }
                      >
                        <option value="on_duty">On duty</option>
                        <option value="break">On break</option>
                        <option value="off_duty">Off duty</option>
                      </select>
                    </label>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'policies' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Department policies</h2>
                <p>Service standards, procedures and escalation ownership.</p>
              </div>
              <button className="dm-primary" onClick={() => openModal({ kind: 'policy' })}>
                Add policy
              </button>
            </div>
            <article className="dm-record">
              <h3>Department quality standard</h3>
              <p>{d.standard}</p>
              <small>Owner: {person} · Escalation: General Manager</small>
            </article>
            {policies.map((p) => (
              <article className="dm-record" key={p.id}>
                <h3>{p.title}</h3>
                <p>{p.content || p.summary}</p>
                <small>
                  {p.category} · {p.policyOwner} · Effective {p.effectiveDate}
                </small>
              </article>
            ))}
          </section>
        )}

        {tab === 'handover' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Shift handover</h2>
                <p>Carry forward department requests and priority actions.</p>
              </div>
              <button className="dm-primary" onClick={() => openModal({ kind: 'handover' })}>
                Prepare handover
              </button>
            </div>
            {handovers.length === 0 && (
              <p className="dm-empty">No handovers yet. Prepare the next shift’s briefing.</p>
            )}
            {handovers.map((h) => (
              <article className="dm-record" key={h.id}>
                <div className="dm-record-title">
                  <h3>
                    {h.outgoingManager} → {h.incomingManager}
                  </h3>
                  <span className={statusClass(h.status)}>{h.status}</span>
                </div>
                <p>{h.notes}</p>
                <small>
                  {dateLabel(h.timestamp)} · {h.outstandingTasksCount} outstanding requests
                </small>
                <ul>
                  {h.priorityActions.map((p, index) => (
                    <li key={index}>{p}</li>
                  ))}
                </ul>
                {h.status === 'submitted' &&
                  h.incomingManager === person &&
                  h.outgoingManager !== person && (
                    <button
                      className="dm-small-button"
                      onClick={() =>
                        departmentManagerCommand({ type: 'acknowledge', handoverId: h.id })
                      }
                    >
                      Acknowledge handover
                    </button>
                  )}
              </article>
            ))}
          </section>
        )}

        {tab === 'analytics' && (
          <div className="dm-analytics-container">
            {/* 1. Service Performance Top Panel */}
            <section className="dm-panel dm-analytics-top-panel">
              <div className="dm-analytics-top-head">
                <div>
                  <h2 className="dm-analytics-title">Service performance</h2>
                  <p className="dm-analytics-sub">
                    See how much work came in, how much was finished, and what needs attention now.
                  </p>
                </div>
                <button
                  type="button"
                  className="dm-secondary dm-analytics-export-btn"
                  onClick={exportReport}
                >
                  <Download size={15} /> Export task report
                </button>
              </div>

              <div className="dm-analytics-toolbar">
                <div className="dm-analytics-filters">
                  <select
                    aria-label="Analytics period"
                    value={analyticsPeriod}
                    onChange={(e) => setAnalyticsPeriod(e.target.value)}
                    className="dm-analytics-select"
                  >
                    <option value="7">Past 7 days</option>
                    <option value="1">Past 24 hours</option>
                    <option value="30">Past 30 days</option>
                  </select>

                  <select
                    aria-label="Task priority filter"
                    value={analyticsPriority}
                    onChange={(e) => setAnalyticsPriority(e.target.value)}
                    className="dm-analytics-select"
                  >
                    <option value="all">All task priorities</option>
                    <option value="urgent">Urgent / critical</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>

                <span className="dm-analytics-timestamp">Updated 02:47 am IST</span>
              </div>
            </section>

            {/* 2. Four KPI Metric Cards */}
            <div className="dm-analytics-kpi-grid">
              <div className="dm-analytics-kpi-card">
                <small className="dm-analytics-kpi-label">Requests opened</small>
                <strong className="dm-analytics-kpi-val">2</strong>
                <p className="dm-analytics-kpi-sub">Created in the selected period</p>
              </div>

              <div className="dm-analytics-kpi-card">
                <small className="dm-analytics-kpi-label">Requests completed</small>
                <strong className="dm-analytics-kpi-val">1</strong>
                <p className="dm-analytics-kpi-sub">Finished in the selected period, including older requests</p>
              </div>

              <div className="dm-analytics-kpi-card">
                <small className="dm-analytics-kpi-label">Completed on time</small>
                <strong className="dm-analytics-kpi-val">100%</strong>
                <p className="dm-analytics-kpi-sub">1 of 1 completed requests with a measurable deadline</p>
              </div>

              <div className="dm-analytics-kpi-card">
                <small className="dm-analytics-kpi-label">Median turnaround</small>
                <strong className="dm-analytics-kpi-val">25 min</strong>
                <p className="dm-analytics-kpi-sub">Time from opening to completion across 1 timed requests</p>
              </div>
            </div>

            {/* 3. Main Two-Column Grid: Chart & Room Readiness */}
            <div className="dm-analytics-main-grid">
              {/* Left Column: Requests opened vs. completed */}
              <section className="dm-panel dm-analytics-chart-panel">
                <h2 className="dm-analytics-panel-title">Requests opened vs. completed</h2>
                <p className="dm-analytics-panel-sub">
                  Compare incoming work with work finished in the same time window.
                </p>

                <div className="dm-chart-legend">
                  <span className="dm-chart-legend-item">
                    <span className="dm-chart-legend-dot opened" /> Opened
                  </span>
                  <span className="dm-chart-legend-item">
                    <span className="dm-chart-legend-dot completed" /> Completed
                  </span>
                </div>

                <div className="dm-barchart-container">
                  <div className="dm-barchart-plot">
                    {[
                      { label: '9 Nov', opened: 0, completed: 0 },
                      { label: '10 Nov', opened: 2, completed: 1 },
                      { label: '11 Nov', opened: 0, completed: 0 },
                      { label: '12 Nov', opened: 0, completed: 0 },
                      { label: '13 Nov', opened: 0, completed: 0 },
                      { label: '14 Nov', opened: 0, completed: 0 },
                      { label: '15 Nov', opened: 0, completed: 0 },
                    ].map((col) => {
                      const maxVal = 2;
                      const openedHeight = col.opened > 0 ? (col.opened / maxVal) * 140 : 0;
                      const completedHeight = col.completed > 0 ? (col.completed / maxVal) * 140 : 0;
                      return (
                        <div key={col.label} className="dm-barchart-col">
                          <div className="dm-barchart-bars">
                            {openedHeight > 0 && (
                              <span
                                className="dm-bar opened"
                                style={{ height: `${openedHeight}px` }}
                                title={`${col.label}: ${col.opened} opened`}
                              />
                            )}
                            {completedHeight > 0 && (
                              <span
                                className="dm-bar completed"
                                style={{ height: `${completedHeight}px` }}
                                title={`${col.label}: ${col.completed} completed`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="dm-barchart-axis">
                    {['9 Nov', '10 Nov', '11 Nov', '12 Nov', '13 Nov', '14 Nov', '15 Nov'].map(
                      (label) => (
                        <span key={label} className="dm-barchart-label">
                          {label}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <details className="dm-chart-details">
                  <summary>View chart data</summary>
                  <table className="dm-table" style={{ marginTop: '12px' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Opened</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>10 Nov</td>
                        <td>2</td>
                        <td>1</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
              </section>

              {/* Right Column: Room readiness Snapshot */}
              <section className="dm-panel dm-analytics-readiness-panel">
                <h2 className="dm-analytics-panel-title">Room readiness</h2>
                <p className="dm-analytics-panel-sub">
                  Current department snapshot across all dates and priorities.
                </p>

                <div className="dm-readiness-rows">
                  <div className="dm-readiness-row">
                    <div>
                      <strong className="dm-readiness-title">Arrival rooms not ready</strong>
                      <p className="dm-readiness-sub">
                        Assigned rooms for expected arrivals. Open Room readiness and choose Expected arrivals.
                      </p>
                    </div>
                    <span className="dm-readiness-stat">2</span>
                  </div>

                  <div className="dm-readiness-row">
                    <div>
                      <strong className="dm-readiness-title">Rooms awaiting inspection</strong>
                      <p className="dm-readiness-sub">
                        Check the inspection queue and assign a supervisor if needed.
                      </p>
                    </div>
                    <span className="dm-readiness-stat">2</span>
                  </div>

                  <div className="dm-readiness-row">
                    <div>
                      <strong className="dm-readiness-title">Open requests past deadline</strong>
                      <p className="dm-readiness-sub">
                        Open work already past its resolution or delivery deadline.
                      </p>
                    </div>
                    <span className="dm-readiness-stat">1</span>
                  </div>
                </div>

                <div className="dm-analytics-action-links">
                  <button
                    type="button"
                    className="dm-link-action"
                    onClick={() => navigate('department')}
                  >
                    Open room readiness →
                  </button>
                  <button
                    type="button"
                    className="dm-link-action"
                    onClick={() => navigate('inspections')}
                  >
                    Open inspections →
                  </button>
                  <button
                    type="button"
                    className="dm-link-action"
                    onClick={() => navigate('tasks')}
                  >
                    Open overdue requests →
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB: Two-Segment Switcher (All Notifications vs Security Alerts) like Task Fulfiller */}
        {tab === 'notifications' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Department Notifications & Hotel Alerts</h2>
                <p>
                  {unread} unread notifications · {unacknowledgedSafetyAlerts.length} active security alerts · {d.name}
                </p>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              {/* Segmented Switcher */}
              <div className="dm-notif-segmented">
                <button
                  type="button"
                  className={`dm-segmented-pill ${notifSubTab === 'all' ? 'active' : ''}`}
                  onClick={() => setNotifSubTab('all')}
                >
                  <Bell size={16} />
                  <span>All Notifications</span>
                  {unread > 0 && <span className="dm-notif-count-badge">{unread}</span>}
                </button>
                <button
                  type="button"
                  className={`dm-segmented-pill alert-pill ${notifSubTab === 'safety' ? 'active' : ''}`}
                  onClick={() => setNotifSubTab('safety')}
                >
                  <ShieldAlert size={16} className={unacknowledgedSafetyAlerts.length > 0 ? 'dm-pulse-icon' : ''} />
                  <span>Security Alerts</span>
                  {unacknowledgedSafetyAlerts.length > 0 ? (
                    <span className="dm-notif-count-badge danger">{unacknowledgedSafetyAlerts.length}</span>
                  ) : (
                    safetyAlerts.length > 0 && <span className="dm-notif-count-badge">{safetyAlerts.length}</span>
                  )}
                </button>
              </div>

              {/* Filter & Action Toolbar */}
              <div className="dm-notif-subfilter-bar">
                <div className="dm-subfilter-left">
                  <button
                    type="button"
                    className={`dm-filter-pill ${!notifFilterUnreadOnly ? 'active' : ''}`}
                    onClick={() => setNotifFilterUnreadOnly(false)}
                  >
                    {notifSubTab === 'all'
                      ? `All Notifications (${notifications.length})`
                      : `Security Alerts (${safetyAlerts.length})`}
                  </button>
                  <button
                    type="button"
                    className={`dm-filter-pill ${notifFilterUnreadOnly ? 'active' : ''}`}
                    onClick={() => setNotifFilterUnreadOnly(!notifFilterUnreadOnly)}
                  >
                    <Filter size={12} />
                    <span>{notifSubTab === 'all' ? 'Unread' : 'Unacknowledged'}</span>
                    {notifFilterUnreadOnly && (
                      <span className="dm-filter-badge">
                        {notifSubTab === 'all' ? unread : unacknowledgedSafetyAlerts.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="dm-subfilter-right">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!isSoundOn)}
                    className="dm-chime-toggle-btn"
                    title={isSoundOn ? 'Mute alert chimes' : 'Enable alert chimes'}
                    aria-label="Toggle chime sound"
                  >
                    {isSoundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>

                  {notifSubTab === 'all' && unread > 0 && (
                    <button
                      type="button"
                      className="dm-ack-all-btn"
                      onClick={handleAckAllNotifications}
                      title="Mark all notifications as read"
                    >
                      <CheckCheck size={14} />
                      <span>Ack All</span>
                    </button>
                  )}

                  {notifSubTab === 'safety' && unacknowledgedSafetyAlerts.length > 0 && (
                    <button
                      type="button"
                      className="dm-ack-all-btn"
                      onClick={handleAckAllSafetyAlerts}
                      title="Acknowledge all safety alerts"
                    >
                      <CheckCheck size={14} />
                      <span>Ack All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-heading Activity Log Header */}
              <div className="dm-notif-activity-header">
                <h3>{notifSubTab === 'all' ? 'ACTIVITY LOG' : 'SECURITY ALERTS LOG'}</h3>
                <p>
                  {notifSubTab === 'all'
                    ? `${displayedNotifications.length} notifications displayed`
                    : `${displayedSafetyAlerts.length} alerts displayed`}
                </p>
              </div>

              {/* Sub-Tab 1: All Notifications */}
              {notifSubTab === 'all' && (
                <div>
                  {displayedNotifications.map((n) => (
                    <div className={`dm-notif-card ${n.read ? 'read' : 'unread'}`} key={n.id}>
                      <div className="dm-notif-card-top">
                        <div className="dm-notif-title-wrap">
                          {!n.read && <span className="dm-notif-pulse-dot" />}
                          <h4>{n.title}</h4>
                        </div>
                        <span className="dm-notif-timestamp">{dateLabel(n.timestamp)}</span>
                      </div>
                      <p className="dm-notif-message">{n.message}</p>
                      <div className="dm-notif-card-foot">
                        <span className="dm-notif-dept-tag">
                          {n.department || d.name}
                        </span>
                        <div className="dm-notif-actions">
                          {n.itemId && (
                            <button
                              type="button"
                              className="dm-view-task-btn"
                              onClick={() => {
                                if (!n.read) {
                                  departmentManagerCommand({ type: 'read', notificationId: n.id });
                                }
                                setTab('tasks');
                              }}
                            >
                              <span>View Task</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                          {!n.read ? (
                            <button
                              type="button"
                              className="dm-ack-btn"
                              onClick={() => {
                                departmentManagerCommand({ type: 'read', notificationId: n.id });
                                if (isSoundOn) playChime();
                              }}
                            >
                              <Check size={13} />
                              <span>Ack</span>
                            </button>
                          ) : (
                            <span className="dm-read-label">
                              <Check size={13} /> Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {displayedNotifications.length === 0 && (
                    <div className="dm-notif-empty-state">
                      <div className="dm-notif-empty-icon">
                        <Bell size={24} />
                      </div>
                      <h4>No notifications found</h4>
                      <p>
                        {notifFilterUnreadOnly
                          ? 'All notifications have been acknowledged. Turn off "Unread" to view previous activity.'
                          : 'When supervisors assign tasks, dispatch updates, or update your department roster, they will appear here.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Security & Safety Alerts */}
              {notifSubTab === 'safety' && (
                <div>
                  {displayedSafetyAlerts.map((alert) => {
                    const isAcked = isSafetyAlertAcknowledged(alert);
                    const isActive = alert.status === 'broadcast_active';
                    const isCritical = alert.priority === 'critical';
                    const isUrgent = alert.priority === 'urgent';

                    return (
                      <div
                        className={`dm-alert-card ${alert.priority} ${isActive ? 'active' : ''}`}
                        key={alert.id}
                      >
                        {/* Header: Priority + Ref Code + Status + Timestamp */}
                        <div className="dm-alert-card-head">
                          <div className="dm-alert-badge-group">
                            <span className={`dm-alert-priority-pill ${alert.priority}`}>
                              {alert.priority} Priority
                            </span>
                            <span className="dm-alert-ref-pill">{alert.ref}</span>
                          </div>
                          <div className="dm-alert-status-group">
                            <span
                              className={`dm-alert-status-badge ${
                                isActive ? 'active' : alert.status === 'resolved' ? 'resolved' : 'validating'
                              }`}
                            >
                              {isActive ? 'Broadcast Active' : alert.status === 'resolved' ? 'Resolved' : 'Validating'}
                            </span>
                            <span className="dm-alert-timestamp">{alert.reportedAt}</span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="dm-alert-title-row">
                          <ShieldAlert
                            size={18}
                            className={`dm-alert-icon ${isCritical ? 'critical' : isUrgent ? 'urgent' : ''} ${
                              isActive ? 'dm-pulse-icon' : ''
                            }`}
                          />
                          <h4>{alert.title}</h4>
                        </div>
                        <p className="dm-alert-desc-box">{alert.description}</p>

                        {/* Location */}
                        <div className="dm-alert-location-row">
                          <MapPin size={14} />
                          <span>{alert.location}</span>
                          {alert.affectedFloors && alert.affectedFloors.length > 0 && (
                            <span className="dm-alert-floors">
                              (Floors: {alert.affectedFloors.join(', ')})
                            </span>
                          )}
                          {alert.incidentType && (
                            <span className="dm-alert-incident-type">
                              · Type: {alert.incidentType.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Footer: Reporter + Acknowledge Button */}
                        <div className="dm-alert-foot-row">
                          <span className="dm-alert-reporter">
                            Reported by: <strong>{alert.reportedBy}</strong>
                            {alert.approvedBy && ` · Approved by ${alert.approvedBy}`}
                          </span>

                          <div>
                            {!isAcked ? (
                              <button
                                type="button"
                                className="dm-primary"
                                onClick={() => handleAckSafetyAlert(alert.id)}
                              >
                                <ShieldCheck size={14} />
                                <span>Acknowledge Alert</span>
                              </button>
                            ) : (
                              <span className="dm-ack-badge">
                                <Check size={14} /> Acknowledged by you ({person})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {displayedSafetyAlerts.length === 0 && (
                    <div className="dm-notif-empty-state">
                      <div className="dm-notif-empty-icon alert">
                        <ShieldAlert size={24} />
                      </div>
                      <h4>No security alerts found</h4>
                      <p>
                        {notifFilterUnreadOnly
                          ? 'All alerts have been acknowledged. Turn off "Unread" to view previous activity.'
                          : 'Property-wide broadcasts, emergency alerts, and safety protocols from security will appear here.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'profile' && (
          <section className="dm-panel dm-profile-card">
            <div className="dm-profile-card-header">
              <h2>Manager profile</h2>
              <p>Your demo identity and department access.</p>
            </div>
            <form
              className="dm-profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                departmentManagerCommand({
                  type: 'profile',
                  name: String(f.get('name') || '').trim(),
                  phone: String(f.get('phone') || '').trim(),
                });
                notify?.('Profile updated successfully.');
              }}
            >
              <div className="dm-profile-field">
                <label htmlFor="dm-profile-name">Display name</label>
                <input
                  id="dm-profile-name"
                  name="name"
                  defaultValue={person}
                  required
                  maxLength={100}
                />
              </div>

              <div className="dm-profile-field">
                <label htmlFor="dm-profile-phone">Phone</label>
                <input
                  id="dm-profile-phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile?.phone || ''}
                  placeholder="+91 98765 43210"
                  maxLength={40}
                />
              </div>

              <div className="dm-profile-field">
                <label htmlFor="dm-profile-email">Demo email</label>
                <input
                  id="dm-profile-email"
                  name="email"
                  value={d.email}
                  readOnly
                  tabIndex={-1}
                />
              </div>

              <div className="dm-profile-field">
                <label htmlFor="dm-profile-dept">Department</label>
                <input
                  id="dm-profile-dept"
                  name="department"
                  value={d.name}
                  readOnly
                  tabIndex={-1}
                />
              </div>

              <button className="dm-profile-save-btn" type="submit">
                Save profile
              </button>

              <p className="dm-profile-note">
                Standalone demonstration · work is saved in this browser. Department access here is a demo of the
                intended permissions.
              </p>
            </form>
          </section>
        )}
      </main>

      {/* Main Action Modal Dialog */}
      <dialog
        ref={dialog}
        className={`dm-dialog ${modal?.kind === 'inspection' && !modal.inspection ? 'dm-inspection-dialog' : ''}`}
        onClose={() => setModal(null)}
        aria-labelledby="dm-dialog-title"
        style={!modal ? { display: 'none' } : undefined}
      >
        <form
          onSubmit={submitModal}
          key={modal?.kind === 'inspection' ? modal.inspection?.id || 'new-inspection' : modal?.kind}
        >
          {modal?.kind === 'inspection' && modal.inspection ? (
            <>
              <div className="dm-dialog-heading">
                <h2 id="dm-dialog-title">Assign inspection</h2>
                <button
                  className="dm-icon-button"
                  type="button"
                  aria-label="Close dialog"
                  onClick={closeModal}
                >
                  <X size={19} />
                </button>
              </div>
              <p className="dm-dialog-description">
                {d.name} · {person}
              </p>

              <label className="dm-field">
                Room or service location
                <input
                  name="location"
                  defaultValue={modal.inspection.roomNumber}
                  required
                  maxLength={100}
                />
              </label>

              <label className="dm-field">
                Assign to department supervisor
                <select
                  name="supervisor"
                  defaultValue={modal.inspection.assignedSupervisorId || ''}
                  required
                >
                  <option value="">Select supervisor</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="dm-field">
                Inspection instructions
                <textarea
                  name="instructions"
                  defaultValue={
                    modal.inspection.instructions ||
                    'Verify linen, amenities, sanitation and room presentation.'
                  }
                  required
                  maxLength={2000}
                  rows={4}
                />
              </label>

              <div className="dm-dialog-actions">
                <button type="button" className="dm-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="dm-primary">
                  Save & continue
                </button>
              </div>
            </>
          ) : modal?.kind === 'inspection' ? (
            <>
              <div className="dm-dialog-heading" style={{ alignItems: 'flex-start' }}>
                <div className="dm-modal-badge-title">
                  <div className="dm-modal-icon-badge">
                    <ClipboardCheck size={20} />
                  </div>
                  <div className="dm-modal-title-group">
                    <h2 id="dm-dialog-title">Conduct quality inspection</h2>
                    <p>{d.name} · Assign a supervisor to inspect a room, a floor or all rooms.</p>
                  </div>
                </div>
                <button
                  className="dm-icon-button"
                  type="button"
                  aria-label="Close dialog"
                  onClick={closeModal}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="dm-scope-title">SELECT INSPECTION SCOPE</div>
              <div className="dm-scope-grid">
                <button
                  type="button"
                  className={`dm-scope-card ${inspectionScope === 'room' ? 'active' : ''}`}
                  onClick={() => setInspectionScope('room')}
                >
                  <div className="dm-scope-top">
                    <BedDouble size={20} />
                    <span className="dm-scope-tag">1 location</span>
                  </div>
                  <strong>Particular room / area</strong>
                  <p>Inspect one room or department service area</p>
                </button>

                <button
                  type="button"
                  className={`dm-scope-card ${inspectionScope === 'floor' ? 'active' : ''}`}
                  onClick={() => setInspectionScope('floor')}
                >
                  <div className="dm-scope-top">
                    <Layers size={20} />
                    <span className="dm-scope-tag">Floor sweep</span>
                  </div>
                  <strong>Overall rooms on floor</strong>
                  <p>Create one inspection for each room on a floor</p>
                </button>

                <button
                  type="button"
                  className={`dm-scope-card ${inspectionScope === 'all' ? 'active' : ''}`}
                  onClick={() => setInspectionScope('all')}
                >
                  <div className="dm-scope-top">
                    <Building2 size={20} />
                    <span className="dm-scope-tag">27 rooms</span>
                  </div>
                  <strong>All rooms (hotel-wide)</strong>
                  <p>Department quality checks throughout the hotel</p>
                </button>
              </div>

              <div className="dm-room-select-box">
                {inspectionScope === 'room' && (
                  <>
                    <label className="dm-field" style={{ marginBottom: 10 }}>
                      Room or department service area
                      <select
                        value={selectedRoomNumber}
                        onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      >
                        <option value="402">Room 402 · Floor 4</option>
                        <option value="127">Room 127 · Floor 1</option>
                        <option value="210">Room 210 · Floor 2</option>
                        <option value="301">Room 301 · Floor 3</option>
                        <option value="302">Room 302 · Floor 3</option>
                        <option value="303">Room 303 · Floor 3</option>
                        <option value="501">Room 501 · Penthouse</option>
                        <option value="Linen Room · Floor 2">Linen Room · Floor 2</option>
                        <option value="Main Service Depot · Ground">Main Service Depot · Ground</option>
                      </select>
                    </label>
                    <div className="dm-chips-row">
                      {['127', '210', '301', '302', '303'].map((rm) => (
                        <button
                          type="button"
                          key={rm}
                          className={`dm-chip ${selectedRoomNumber === rm ? 'active' : ''}`}
                          onClick={() => setSelectedRoomNumber(rm)}
                        >
                          {rm}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {inspectionScope === 'floor' && (
                  <>
                    <label className="dm-field" style={{ marginBottom: 10 }}>
                      Floor sweep target
                      <select
                        value={selectedFloor}
                        onChange={(e) => setSelectedFloor(e.target.value)}
                      >
                        <option value="1">Floor 1 · 5 rooms</option>
                        <option value="2">Floor 2 · 5 rooms</option>
                        <option value="3">Floor 3 · 6 rooms</option>
                        <option value="4">Floor 4 · 6 rooms</option>
                        <option value="5">Floor 5 · 5 penthouse suites</option>
                      </select>
                    </label>
                    <div className="dm-chips-row">
                      {['1', '2', '3', '4', '5'].map((fl) => (
                        <button
                          type="button"
                          key={fl}
                          className={`dm-chip ${selectedFloor === fl ? 'active' : ''}`}
                          onClick={() => setSelectedFloor(fl)}
                        >
                          Floor {fl}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {inspectionScope === 'all' && (
                  <div style={{ padding: '6px 0', fontSize: '13px', color: 'var(--dm-muted)' }}>
                    Comprehensive hotel-wide audit: Creates quality verification tickets for all 27 guest rooms and common departmental zones.
                  </div>
                )}
              </div>

              <div className="dm-two-col-grid">
                <label className="dm-field">
                  Inspection type
                  <select
                    value={inspectionType}
                    onChange={(e) => setInspectionType(e.target.value)}
                  >
                    <option value="Turnover clean">Turnover clean</option>
                    <option value="Deep clean audit">Deep clean audit</option>
                    <option value="VIP arrival readiness">VIP arrival readiness</option>
                    <option value="Safety & linen standard">Safety & linen standard</option>
                  </select>
                </label>
                <label className="dm-field">
                  Priority
                  <select
                    value={inspectionPriority}
                    onChange={(e) => setInspectionPriority(e.target.value)}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="VIP">VIP</option>
                  </select>
                </label>
              </div>

              <label className="dm-field" style={{ display: 'none' }}>
                <select name="supervisor" defaultValue={supervisors[0]?.id || ''}>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="dm-inspection-foot">
                <div className="dm-scope-summary">
                  Scope:{' '}
                  {inspectionScope === 'room'
                    ? `${selectedRoomNumber} · 1 inspection`
                    : inspectionScope === 'floor'
                      ? `Floor ${selectedFloor} · 6 inspections`
                      : 'All rooms · 27 inspections'}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button type="button" className="dm-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dm-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                  >
                    <ClipboardCheck size={16} /> Launch inspection
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dm-dialog-heading">
                <h2 id="dm-dialog-title">
                  {modal?.kind === 'recovery'
                    ? 'Review service recovery'
                    : modal?.kind === 'policy'
                      ? 'Add department policy'
                      : 'Prepare shift handover'}
                </h2>
                <button
                  className="dm-icon-button"
                  type="button"
                  aria-label="Close dialog"
                  onClick={closeModal}
                >
                  <X size={19} />
                </button>
              </div>
              <p className="dm-dialog-description">
                {d.name} · {person}
              </p>

          {modal?.kind === 'recovery' && (
            <>
              <p className="dm-dialog-description">{modal.task.title}</p>
              {(modal.task.photoUrl || (modal.task as any).photoAttached || (modal.task as any).photo) && (
                <div className="dm-dialog-photo-box">
                  <span className="dm-photo-label">
                    <Camera size={13} /> Attached Photo Evidence
                  </span>
                  <img
                    src={getTaskPhoto(modal.task)!}
                    alt="Evidence"
                    className="dm-dialog-photo"
                    onClick={() =>
                      setPhotoPreview({
                        url: getTaskPhoto(modal.task)!,
                        title: modal.task.title,
                        ref: modal.task.ref || modal.task.id,
                        room: modal.task.room,
                        assignee: modal.task.assignee,
                        status: modal.task.status,
                        timestamp: modal.task.createdAt,
                      })
                    }
                    title="Click to view full photo"
                  />
                </div>
              )}
              <label className="dm-field">
                Decision
                <select name="decision">
                  <option value="resolve">Resolve and notify supervisor</option>
                  <option value="escalate">Escalate to General Manager</option>
                </select>
              </label>
              <label className="dm-field">
                Recovery notes / reason
                <textarea
                  name="note"
                  required
                  maxLength={2000}
                  placeholder="Describe the action taken or the decision needed from the GM."
                />
              </label>
            </>
          )}

          {modal?.kind === 'policy' && (
            <>
              <label className="dm-field">
                Policy title
                <input name="title" required maxLength={150} />
              </label>
              <label className="dm-field">
                Service standard / procedure
                <textarea name="content" required maxLength={2000} />
              </label>
            </>
          )}

          {modal?.kind === 'handover' && (
            <>
              <label className="dm-field">
                Incoming manager
                <input
                  name="incoming"
                  required
                  maxLength={100}
                  placeholder="Name of the receiving manager"
                />
              </label>
              <label className="dm-field">
                Shift notes & follow-up
                <textarea name="notes" required maxLength={2000} />
              </label>
              <p className="dm-dialog-description">
                {active.length} open requests and their priority actions will be included.
              </p>
            </>
          )}

          <div className="dm-dialog-actions">
            <button type="button" className="dm-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="dm-primary">
              {modal?.kind === 'recovery' ? 'Save decision' : 'Save & continue'}
            </button>
          </div>
            </>
          )}
        </form>
      </dialog>

      {/* TASK DETAILS MODAL DIALOG */}
      <dialog
        ref={detailsDialog}
        className="dm-details-dialog"
        onClose={() => setDetailsTask(null)}
        aria-labelledby="dm-details-title"
        style={!detailsTask ? { display: 'none' } : undefined}
      >
        {detailsTask && (
          <div className="dm-details-modal-wrapper">
            <div className="dm-details-head">
              <div className="dm-details-head-left">
                <div className="dm-modal-icon-badge">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 id="dm-details-title">Task Details</h3>
                  <small className="dm-details-subtitle">
                    {detailsTask.room ? `Room ${detailsTask.room} · ` : ''}
                    {detailsTask.ref || detailsTask.id}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="dm-icon-button"
                aria-label="Close task details"
                onClick={() => setDetailsTask(null)}
                style={{ marginLeft: 'auto' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dm-details-body">
              <div className="dm-details-hero-card">
                <h4 className="dm-details-hero-title">{detailsTask.title}</h4>
                {detailsTask.description && (
                  <p className="dm-details-hero-desc">{detailsTask.description}</p>
                )}
              </div>

              <div className="dm-details-meta-grid">
                <div className="dm-details-meta-item" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="dm-details-meta-label" style={{ display: 'block', marginBottom: 4 }}>Room / Area</span>
                  <strong className="dm-details-meta-val" style={{ display: 'block' }}>
                    {detailsTask.room ? `Room ${detailsTask.room}` : 'General / Common'}
                  </strong>
                </div>

                <div className="dm-details-meta-item" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="dm-details-meta-label" style={{ display: 'block', marginBottom: 4 }}>Owner</span>
                  <strong className="dm-details-meta-val" style={{ display: 'block' }}>
                    {detailsTask.assignee || 'Unassigned'}
                  </strong>
                </div>

                <div className="dm-details-meta-item" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="dm-details-meta-label" style={{ display: 'block', marginBottom: 4 }}>Priority</span>
                  <div className="dm-details-meta-val" style={{ display: 'block' }}>
                    {/urgent/i.test(detailsTask.priority || '') ? (
                      <span className="dm-priority-pill urgent">
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        Urgent
                      </span>
                    ) : /vip/i.test(detailsTask.priority || '') ? (
                      <span className="dm-priority-pill vip">★ VIP</span>
                    ) : (
                      <span className="dm-priority-pill normal">{detailsTask.priority || 'Normal'}</span>
                    )}
                  </div>
                </div>

                <div className="dm-details-meta-item" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="dm-details-meta-label" style={{ display: 'block', marginBottom: 4 }}>Status</span>
                  <div className="dm-details-meta-val" style={{ display: 'block' }}>
                    {/completed|resolved/i.test(detailsTask.status) ? (
                      <span className="dm-status-pill completed">✓ Completed</span>
                    ) : /in progress|started/i.test(detailsTask.status) ? (
                      <span className="dm-status-pill in-progress">In progress</span>
                    ) : /assigned/i.test(detailsTask.status) ? (
                      <span className="dm-status-pill assigned">Assigned</span>
                    ) : (
                      <span className="dm-status-pill unassigned">Unassigned</span>
                    )}
                  </div>
                </div>

                {(detailsTask.meta || (detailsTask as any).targetTime) && (
                  <div className="dm-details-meta-item dm-details-meta-span2" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="dm-details-meta-label" style={{ display: 'block', marginBottom: 4 }}>Target / Schedule</span>
                    <strong className="dm-details-meta-val" style={{ display: 'block' }}>
                      {(detailsTask as any).targetTime || detailsTask.meta}
                    </strong>
                  </div>
                )}

                {detailsTask.createdAt && (
                  <div className="dm-details-meta-item" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="dm-details-meta-label" style={{ display: 'block', marginBottom: 4 }}>Created</span>
                    <strong className="dm-details-meta-val" style={{ display: 'block' }}>
                      {dateLabel(detailsTask.createdAt)}
                    </strong>
                  </div>
                )}
              </div>

              {getTaskPhoto(detailsTask) && (
                <div className="dm-details-photo-section">
                  <div className="dm-details-photo-header">
                    <span className="dm-photo-label" style={{ margin: 0 }}>
                      <Camera size={14} /> Attached Photographic Proof
                    </span>
                    {isTaskPhotoVerified(detailsTask) ? (
                      <span className="dm-photo-action-btn verified" style={{ cursor: 'default' }}>
                        <Check size={12} /> Photo Verified
                      </span>
                    ) : (
                      <span className="dm-photo-action-btn to-verify" style={{ cursor: 'default' }}>
                        <Camera size={12} /> Awaiting Verification
                        <span className="dm-pulse-indicator" />
                      </span>
                    )}
                  </div>
                  <div className="dm-details-photo-wrapper">
                    <img
                      src={getTaskPhoto(detailsTask)!}
                      alt={detailsTask.title}
                      className="dm-dialog-photo"
                      onClick={() => {
                        const photo = getTaskPhoto(detailsTask);
                        if (photo) {
                          const verified = isTaskPhotoVerified(detailsTask);
                          setPhotoPreview({
                            taskId: detailsTask.id,
                            ref: detailsTask.ref || detailsTask.id,
                            url: photo,
                            title: detailsTask.title,
                            room: detailsTask.room,
                            assignee: detailsTask.assignee,
                            status: detailsTask.status,
                            timestamp: detailsTask.createdAt,
                            verified,
                            verifiedAt: verifiedPhotoTaskIds[detailsTask.id]?.verifiedAt || verifiedPhotoTaskIds[detailsTask.ref || '']?.verifiedAt,
                            verifiedBy: verifiedPhotoTaskIds[detailsTask.id]?.verifiedBy || verifiedPhotoTaskIds[detailsTask.ref || '']?.verifiedBy || person,
                          });
                        }
                      }}
                      title="Click to view full photo and verify"
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="dm-details-foot">
              <div className="dm-details-foot-left">
                {isOpen(detailsTask.status) && (
                  <button
                    type="button"
                    className="dm-secondary"
                    onClick={() => {
                      const task = detailsTask;
                      setDetailsTask(null);
                      openModal({ kind: 'recovery', task });
                    }}
                  >
                    Review / Escalate
                  </button>
                )}
              </div>
              <button
                type="button"
                className="dm-primary"
                onClick={() => setDetailsTask(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>

      {/* PHOTO PREVIEW & VERIFICATION MODAL DIALOG */}
      <dialog
        ref={photoDialog}
        className="dm-photo-preview-dialog"
        onClose={() => setPhotoPreview(null)}
        aria-labelledby="dm-photo-preview-title"
        style={!photoPreview ? { display: 'none' } : undefined}
      >
        {photoPreview && (
          <>
            <div className="dm-photo-preview-head">
              <h3 id="dm-photo-preview-title">
                <Camera size={18} />
                <span>Task Photo Proof & Evidence</span>
              </h3>
              <button
                type="button"
                className="dm-icon-button"
                aria-label="Close photo preview"
                onClick={() => setPhotoPreview(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dm-photo-preview-body">
              {/* Verification Status Banner */}
              {photoPreview.verified ? (
                <div className="dm-photo-verify-banner verified">
                  <Sparkles className="dm-photo-verify-banner-icon" size={20} />
                  <div>
                    <strong>Photographic Proof Verified</strong>
                    <p>
                      Verified by {photoPreview.verifiedBy || person}
                      {photoPreview.verifiedAt ? ` on ${photoPreview.verifiedAt}` : ''}. Meets luxury housekeeping standards.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="dm-photo-verify-banner pending">
                  <AlertTriangle className="dm-photo-verify-banner-icon" size={20} />
                  <div>
                    <strong>Photo Proof Awaiting Manager Verification</strong>
                    <p>
                      Attendant has submitted photographic evidence of task completion. Inspect the photo quality and approve or request a retake.
                    </p>
                  </div>
                </div>
              )}

              <div className="dm-photo-preview-img-wrap">
                <img src={photoPreview.url} alt={photoPreview.title} />
              </div>

              <div className="dm-photo-preview-meta-grid">
                <div className="dm-meta-item">
                  <small>Task Title</small>
                  <strong>{photoPreview.title}</strong>
                </div>
                <div className="dm-meta-item">
                  <small>Reference ID</small>
                  <strong>{photoPreview.ref || 'N/A'}</strong>
                </div>
                {photoPreview.room && (
                  <div className="dm-meta-item">
                    <small>Room / Location</small>
                    <strong>Room {photoPreview.room}</strong>
                  </div>
                )}
                {photoPreview.assignee && (
                  <div className="dm-meta-item">
                    <small>Attendant / Assignee</small>
                    <strong>{photoPreview.assignee}</strong>
                  </div>
                )}
                {photoPreview.status && (
                  <div className="dm-meta-item">
                    <small>Current Status</small>
                    <strong>{photoPreview.status}</strong>
                  </div>
                )}
                {photoPreview.timestamp && (
                  <div className="dm-meta-item">
                    <small>Timestamp</small>
                    <strong>{dateLabel(photoPreview.timestamp)}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="dm-photo-preview-foot">
              <div className="dm-photo-foot-left">
                {!photoPreview.verified ? (
                  <>
                    <button
                      type="button"
                      className="dm-verify-action-btn approve"
                      onClick={() => {
                        if (photoPreview.taskId) {
                          handleVerifyPhoto(photoPreview.taskId, photoPreview.ref);
                        }
                      }}
                    >
                      <Check size={14} /> Verify & Approve Photo
                    </button>
                    <button
                      type="button"
                      className="dm-verify-action-btn reject"
                      onClick={() => {
                        if (photoPreview.taskId) {
                          handleRejectPhoto(photoPreview.taskId, photoPreview.ref);
                        }
                      }}
                    >
                      <RotateCcw size={14} /> Request Retake
                    </button>
                  </>
                ) : (
                  <span className="dm-ack-badge">
                    <Check size={13} /> Verified by {photoPreview.verifiedBy || person}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={photoPreview.url}
                  download={`photo-proof-${photoPreview.ref || 'task'}.jpg`}
                  className="dm-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={14} /> Download
                </a>
                <button
                  type="button"
                  className="dm-primary"
                  onClick={() => setPhotoPreview(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>

      {/* Resolve Complaints Modal Dialog (Exact Reference Image 3) */}
      {resolvingComplaint && (
        <div className="dm-modal-backdrop" onClick={() => setResolvingComplaint(null)}>
          <div
            className="dm-resolve-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolve-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveResolveComplaint}>
              <div className="dm-resolve-modal-head">
                <div>
                  <h2 id="resolve-modal-title" className="dm-resolve-modal-title">
                    Resolve complaints
                  </h2>
                  <p className="dm-resolve-modal-sub">
                    {d.name} · {resolvingComplaint.complaintId || resolvingComplaint.id}
                  </p>
                </div>
                <button
                  type="button"
                  className="dm-modal-close-btn"
                  aria-label="Close dialog"
                  onClick={() => setResolvingComplaint(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="dm-resolve-modal-body">
                <div className="dm-form-group">
                  <label htmlFor="complaint-status-select" className="dm-modal-label">
                    Complaint status
                  </label>
                  <select
                    id="complaint-status-select"
                    name="status"
                    defaultValue={resolvingComplaint.status || 'Under Review'}
                    className="dm-modal-select"
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="dm-form-group">
                  <label htmlFor="complaint-note-textarea" className="dm-modal-label">
                    Response / resolution shared with the guest
                  </label>
                  <textarea
                    id="complaint-note-textarea"
                    name="note"
                    required
                    rows={5}
                    defaultValue={resolvingComplaint.responseRemarks || ''}
                    className="dm-modal-textarea"
                  />
                </div>
              </div>

              <div className="dm-resolve-modal-foot">
                <button
                  type="button"
                  className="dm-modal-cancel-btn"
                  onClick={() => setResolvingComplaint(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="dm-modal-save-btn">
                  Save complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Complaint Modal Dialog */}
      {logComplaintOpen && (
        <div className="dm-modal-backdrop" onClick={() => setLogComplaintOpen(false)}>
          <div
            className="dm-resolve-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveNewComplaint}>
              <div className="dm-resolve-modal-head">
                <div>
                  <h2 id="log-modal-title" className="dm-resolve-modal-title">
                    Log department complaint
                  </h2>
                  <p className="dm-resolve-modal-sub">
                    {d.name} · Shared with guest and Front Desk records
                  </p>
                </div>
                <button
                  type="button"
                  className="dm-modal-close-btn"
                  aria-label="Close dialog"
                  onClick={() => setLogComplaintOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="dm-resolve-modal-body">
                <div className="dm-form-group">
                  <label className="dm-modal-label">Complaint title</label>
                  <input
                    name="title"
                    required
                    maxLength={160}
                    placeholder="e.g. Linen replacement delay, AC whistling..."
                    className="dm-modal-input"
                  />
                </div>

                <div className="dm-form-row">
                  <div className="dm-form-group">
                    <label className="dm-modal-label">Guest name</label>
                    <input
                      name="guest"
                      required
                      maxLength={100}
                      placeholder="Guest full name"
                      className="dm-modal-input"
                    />
                  </div>
                  <div className="dm-form-group">
                    <label className="dm-modal-label">Room / location</label>
                    <input
                      name="room"
                      required
                      maxLength={100}
                      placeholder="e.g. 304, 210, Suite 402"
                      className="dm-modal-input"
                    />
                  </div>
                </div>

                <div className="dm-form-group">
                  <label className="dm-modal-label">Complaint details</label>
                  <textarea
                    name="note"
                    required
                    maxLength={2000}
                    rows={4}
                    placeholder="Describe the guest concern and circumstances..."
                    className="dm-modal-textarea"
                  />
                </div>
              </div>

              <div className="dm-resolve-modal-foot">
                <button
                  type="button"
                  className="dm-modal-cancel-btn"
                  onClick={() => setLogComplaintOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dm-modal-save-btn">
                  Save complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
