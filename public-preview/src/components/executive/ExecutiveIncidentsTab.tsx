'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Filter,
  History,
  Lock,
  MessageSquareWarning,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { taskDepartment, managerDepartment } from '@/lib/manager-domain';
import type { IncidentRecord, ComplaintCase, WorkItem } from '@/types/demo';

function getTaskDepartmentDisplay(item: WorkItem): string {
  if (item.department) {
    if (/spa\s*(&|and)\s*wellness/i.test(item.department) || item.department.trim().toLowerCase() === 'spa') {
      return 'Wellness';
    }
    return item.department;
  }
  const deptId = taskDepartment(item);
  if (deptId) {
    return deptId === 'wellness' ? 'Wellness' : managerDepartment(deptId).name;
  }
  return 'Property Operations';
}

function formatTaskMeta(meta?: string): string {
  if (!meta) return '';
  return meta
    .replace(/\bSpa\s*(&|and)\s*Wellness\b/gi, 'Wellness')
    .replace(/\bSpa\b(\s*·)/g, 'Wellness$1');
}

interface ExecutiveIncidentsTabProps {
  permissionMode: 'viewer' | 'approver';
  initialView?: 'incidents' | 'complaints' | 'escalations';
  selectedIncidentFromParent?: IncidentRecord | null;
  onClearSelectedIncident?: () => void;
  selectedTaskIdFromParent?: string | null;
}

export function ExecutiveIncidentsTab({
  permissionMode,
  initialView = 'incidents',
  selectedIncidentFromParent,
  onClearSelectedIncident,
  selectedTaskIdFromParent,
}: ExecutiveIncidentsTabProps) {
  const { state, requestExecutiveDirective, updateIncidentStatus } = useDemo();
  const activeView = initialView;
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(selectedIncidentFromParent || null);
  const [incidentModalTab, setIncidentModalTab] = useState<'details' | 'timeline'>('details');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintCase | null>(null);
  const [selectedEscalatedTask, setSelectedEscalatedTask] = useState<WorkItem | null>(null);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEscalatedTask(null);
        setSelectedIncident(null);
        setSelectedComplaint(null);
        onClearSelectedIncident?.();
      }
    };
    if (selectedEscalatedTask || selectedIncident || selectedComplaint) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedEscalatedTask, selectedIncident, selectedComplaint, onClearSelectedIncident]);

  // Sync selectedIncidentFromParent
  useEffect(() => {
    if (selectedIncidentFromParent) {
      setSelectedIncident(selectedIncidentFromParent);
      setIncidentModalTab('details');
    }
  }, [selectedIncidentFromParent]);

  // Executive Directive Modal
  const [directiveModalTarget, setDirectiveModalTarget] = useState<{ id: string; title: string; type: 'incident' | 'complaint' } | null>(null);
  const [directiveText, setDirectiveText] = useState('');
  const [directiveDepartment, setDirectiveDepartment] = useState('All departments');

  // Incidents
  const incidents = state.incidents ?? [];
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, severityFilter]);

  // Complaints
  const complaints = state.frontDesk?.complaints ?? [];

  // Escalated tasks from other departments
  const escalatedTasks: WorkItem[] = useMemo(() => {
    const list: WorkItem[] = [];
    const roles = ['department_manager', 'department_dispatcher_supervisor', 'department_dispatcher', 'task_fulfiller'] as const;
    const seen = new Set<string>();
    roles.forEach((r) => {
      (state.items[r] ?? []).forEach((item) => {
        if (item.status === 'Escalated' || item.priority === 'critical' || item.priority === 'vip') {
          const key = item.ref || item.id;
          if (!seen.has(key)) {
            seen.add(key);
            list.push(item);
          }
        }
      });
    });
    return list;
  }, [state.items]);

  // Sync selectedTaskIdFromParent to open elaborated details
  useEffect(() => {
    if (selectedTaskIdFromParent) {
      const match = escalatedTasks.find(
        (t) => t.id === selectedTaskIdFromParent || t.ref === selectedTaskIdFromParent
      );
      if (match) {
        setSelectedEscalatedTask(match);
      }
    }
  }, [selectedTaskIdFromParent, escalatedTasks]);

  const handleDispatchDirective = () => {
    if (!directiveModalTarget || !directiveText.trim() || permissionMode === 'viewer') return;
    const finalDirectiveText =
      directiveDepartment && directiveDepartment !== 'All departments'
        ? `[Direct to ${directiveDepartment} Supervisor] ${directiveText.trim()}`
        : directiveText.trim();
    requestExecutiveDirective(directiveModalTarget.id, directiveModalTarget.type, finalDirectiveText);
    setDirectiveModalTarget(null);
    setDirectiveText('');
    setDirectiveDepartment('All departments');
  };

  const viewMetadata = useMemo(() => {
    switch (activeView) {
      case 'complaints':
        return {
          title: 'Guest Complaints',
          subtitle: 'Duty Manager escalations, unresolved service recovery cases, and goodwill gestures.',
          icon: MessageSquareWarning,
          iconColor: 'text-amber-500',
          badgeText: `${complaints.filter((c) => !c.compApplied).length} Unresolved`,
          badgeTone: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20',
          countLabel: `${complaints.length} ${complaints.length === 1 ? 'case' : 'cases'}`,
        };
      case 'escalations':
        return {
          title: 'High Escalations',
          subtitle: 'Cross-department operational bottlenecks, urgent task fulfiller issues, and manager escalations.',
          icon: Siren,
          iconColor: 'text-purple-500 dark:text-purple-400',
          badgeText: `${escalatedTasks.length} Escalated Tasks`,
          badgeTone: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/20',
          countLabel: `${escalatedTasks.length} ${escalatedTasks.length === 1 ? 'task' : 'tasks'}`,
        };
      case 'incidents':
      default:
        return {
          title: 'Property Incidents',
          subtitle: 'Cross-department emergency oversight, fire/safety responses, and building security command.',
          icon: ShieldAlert,
          iconColor: 'text-rose-500',
          badgeText: `${incidents.filter((i) => i.status !== 'resolved').length} Active`,
          badgeTone: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/20',
          countLabel: `${incidents.length} ${incidents.length === 1 ? 'incident' : 'incidents'}`,
        };
    }
  }, [activeView, complaints, escalatedTasks.length, incidents]);

  const CurrentViewIcon = viewMetadata.icon;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <CurrentViewIcon className={`h-5 w-5 ${viewMetadata.iconColor}`} />
              {viewMetadata.title}
            </h2>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${viewMetadata.badgeTone}`}>
              {viewMetadata.badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            {viewMetadata.subtitle}
          </p>
        </div>

        {/* Page Opened Name Display (replaces the removed navbar) */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80 text-xs font-bold text-navy-950 dark:text-white shadow-sm self-start md:self-auto">
          <CurrentViewIcon className={`h-4 w-4 ${viewMetadata.iconColor}`} />
          <span>{viewMetadata.title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-slate-600 dark:text-mist-300">
            {viewMetadata.countLabel}
          </span>
        </div>
      </div>

      {/* View 1: Property Incidents */}
      {activeView === 'incidents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredIncidents.map((incident) => {
              const isResolved = incident.status === 'resolved';
              return (
                <div
                  key={incident.id}
                  className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg hover:border-rose-500/30 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-mist-300">
                        {incident.ref}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          incident.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                            : incident.severity === 'major'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </div>

                    <div
                      className="cursor-pointer group mt-2"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setIncidentModalTab('details');
                      }}
                      title="Click to view detailed incident information"
                    >
                      <h4 className="text-sm font-bold text-navy-950 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 transition">
                        {incident.title}
                      </h4>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {incident.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIncident(incident);
                          setIncidentModalTab('details');
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold transition"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIncident(incident);
                          setIncidentModalTab('timeline');
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-mist-300 transition"
                      >
                        Timeline
                      </button>
                      <button
                        type="button"
                        disabled={permissionMode === 'viewer'}
                        onClick={() =>
                          setDirectiveModalTarget({
                            id: incident.id,
                            title: incident.title,
                            type: 'incident',
                          })
                        }
                        title={permissionMode === 'viewer' ? 'Disabled in Viewer Mode' : 'Issue Executive Directive'}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          permissionMode === 'viewer'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
                        }`}
                      >
                        Directive
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Guest Complaints */}
      {activeView === 'complaints' && (
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Room / Guest</th>
                  <th className="px-4 py-3">Complaint Title</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Proposed Comp</th>
                  <th className="px-4 py-3">Recovery Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className="cursor-pointer group hover:bg-amber-500/[0.07] dark:hover:bg-white/[0.04] transition"
                    title="Click complaint to view detailed information"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-navy-950 dark:text-white">
                      {c.ref}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-950 dark:text-white">Room {c.room}</div>
                      <div className="text-[11px] text-slate-400 dark:text-mist-400">{c.guest}</div>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="text-navy-950 dark:text-white font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {c.summary}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          c.severity === 'critical'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                            : c.severity === 'vip'
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                        }`}
                      >
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      ₹{c.comp ? (c.comp * 80).toLocaleString('en-IN') : '₹4,000'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          c.compApplied
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {c.compApplied ? 'Credit Applied' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition flex items-center">
                          Details <ChevronRight className="h-3 w-3" />
                        </span>
                        <button
                          type="button"
                          disabled={permissionMode === 'viewer'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDirectiveModalTarget({
                              id: c.ref,
                              title: `Room ${c.room} Complaint (${c.guest})`,
                              type: 'complaint',
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            permissionMode === 'viewer'
                              ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          }`}
                        >
                          Directive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Escalated Tasks */}
      {activeView === 'escalations' && (
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                  <th className="px-4 py-3">Task ID</th>
                  <th className="px-4 py-3">Task Title & Details</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                {escalatedTasks.map((t) => {
                  const isHighlighted = Boolean(
                    selectedTaskIdFromParent &&
                      (t.id === selectedTaskIdFromParent || t.ref === selectedTaskIdFromParent),
                  );
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedEscalatedTask(t)}
                      className={`cursor-pointer group transition ${
                        isHighlighted
                          ? 'bg-amber-500/15 dark:bg-amber-500/25 font-bold border-l-4 border-l-amber-500 shadow-sm'
                          : 'hover:bg-purple-500/[0.07] dark:hover:bg-white/[0.04]'
                      }`}
                      title="Click task to view elaborated details"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-navy-950 dark:text-white">
                        {t.ref || t.id}
                        {isHighlighted && (
                          <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-navy-950 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {t.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-mist-300">
                        {getTaskDepartmentDisplay(t)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                          {t.priority || 'VIP'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-navy-950 dark:text-white">
                        {t.status}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-mist-400 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <span>{t.owner || t.assignee || 'Unassigned'}</span>
                          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition flex items-center">
                            Details <ChevronRight className="h-3 w-3" />
                          </span>
                          <button
                            type="button"
                            disabled={permissionMode === 'viewer'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDirectiveDepartment('All departments');
                              setDirectiveModalTarget({
                                id: t.ref || t.id,
                                title: t.title,
                                type: 'incident',
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              permissionMode === 'viewer'
                                ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                            }`}
                          >
                            Directive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Detail & Timeline Modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setSelectedIncident(null);
            onClearSelectedIncident?.();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-500 grid place-items-center border border-rose-500/30">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {selectedIncident.title}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-mist-300">
                      {selectedIncident.ref}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Coordinator: <span className="font-semibold text-navy-950 dark:text-white">{selectedIncident.coordinator}</span> · Reported: <span className="font-semibold text-navy-950 dark:text-white">{selectedIncident.reportedAt}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedIncident(null);
                  onClearSelectedIncident?.();
                }}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs: Details vs Timeline */}
            <div className="px-6 pt-3 border-b border-slate-200 dark:border-white/10 flex items-center gap-2 bg-slate-50/40 dark:bg-ink-950/40">
              <button
                type="button"
                onClick={() => setIncidentModalTab('details')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                  incidentModalTab === 'details'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Detailed Information
              </button>
              <button
                type="button"
                onClick={() => setIncidentModalTab('timeline')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                  incidentModalTab === 'timeline'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Incident Timeline ({selectedIncident.timeline.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {incidentModalTab === 'details' ? (
                <>
                  {/* 4 Quick Stat Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-amber-500" /> Affected Area
                      </span>
                      <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={selectedIncident.affectedArea}>
                        {selectedIncident.affectedArea}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                        <User className="h-3 w-3 text-sky-500" /> Coordinator
                      </span>
                      <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={selectedIncident.coordinator}>
                        {selectedIncident.coordinator}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                        <Users className="h-3 w-3 text-purple-500" /> Department
                      </span>
                      <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={selectedIncident.department || 'Property Operations'}>
                        {selectedIncident.department || 'Property Operations'}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-500" /> Reported At
                      </span>
                      <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                        {selectedIncident.reportedAt}
                      </div>
                    </div>
                  </div>

                  {/* Incident Operational Scope & Overview */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-rose-500" />
                      Detailed Incident Scope & Assessment
                    </h4>
                    <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                      Incident logged under executive property surveillance. Immediate response activated under lead coordinator <strong>{selectedIncident.coordinator}</strong> targeting <strong>{selectedIncident.affectedArea}</strong>. Containment protocols and safety mitigations are under active executive monitoring.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        selectedIncident.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                          : selectedIncident.severity === 'major'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300'
                      }`}>
                        Severity: {selectedIncident.severity}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        selectedIncident.status === 'resolved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      }`}>
                        Status: {selectedIncident.status}
                      </span>
                      {selectedIncident.relatedTaskRef && (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300 flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-amber-500" /> Task Ref: {selectedIncident.relatedTaskRef}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Activity Highlight & Timeline Shortcut */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                        <History className="h-4 w-4 text-rose-500" />
                        Latest Recorded Activity
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIncidentModalTab('timeline')}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                      >
                        Full Timeline ({selectedIncident.timeline.length}) <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    {selectedIncident.timeline.length > 0 ? (
                      <div className="text-xs text-navy-950 dark:text-mist-200 flex items-start gap-2 pt-1">
                        <span className="font-mono text-slate-400 shrink-0 font-bold">
                          {selectedIncident.timeline[selectedIncident.timeline.length - 1].at}:
                        </span>
                        <span>{selectedIncident.timeline[selectedIncident.timeline.length - 1].text}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No activity logged yet.</p>
                    )}
                  </div>
                </>
              ) : (
                /* Timeline View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                      <History className="h-4 w-4 text-rose-500" />
                      Chronological Incident Timeline
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIncidentModalTab('details')}
                      className="text-xs font-bold text-slate-500 hover:text-navy-950 dark:hover:text-white transition"
                    >
                      ← Back to Details
                    </button>
                  </div>

                  <div className="space-y-3 border-l-2 border-rose-500/30 dark:border-rose-500/20 pl-4 ml-2 max-h-72 overflow-y-auto">
                    {selectedIncident.timeline.map((entry, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{entry.at}</div>
                        <div className="text-navy-950 dark:text-mist-200 mt-0.5">{entry.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Ref: <strong className="font-mono text-navy-950 dark:text-white">{selectedIncident.ref}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={permissionMode === 'viewer'}
                  onClick={() => {
                    const inc = selectedIncident;
                    setSelectedIncident(null);
                    onClearSelectedIncident?.();
                    setDirectiveModalTarget({
                      id: inc.id,
                      title: inc.title,
                      type: 'incident',
                    });
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    permissionMode === 'viewer'
                      ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Issue Directive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIncident(null);
                    onClearSelectedIncident?.();
                  }}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Executive Directive Modal */}
      {directiveModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-500 grid place-items-center">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-950 dark:text-white">
                  Issue Executive Directive
                </h3>
                <p className="text-xs text-slate-500 dark:text-mist-400">
                  Target: {directiveModalTarget.title}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="directive-department-select" className="text-xs font-bold text-slate-700 dark:text-mist-300">
                Target Department
              </label>
              <select
                id="directive-department-select"
                value={directiveDepartment}
                onChange={(e) => setDirectiveDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <option value="All departments">All departments</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Wellness">Wellness</option>
                <option value="Maintenance & Engineering">Maintenance & Engineering</option>
                <option value="Food & Beverages">Food & Beverages</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              {directiveDepartment === 'All departments'
                ? 'Directives from the Executive Office take top operational precedence and notify all department supervisors immediately.'
                : `Directives from the Executive Office take top operational precedence and will be routed to the ${directiveDepartment} supervisor.`}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-mist-300">
                Executive Instruction
              </label>
              <textarea
                rows={4}
                value={directiveText}
                onChange={(e) => setDirectiveText(e.target.value)}
                placeholder="E.g., Prioritize vacuum drying of Rooms 305–309. Relocate affected guests to Floor 5 Presidential suites with complimentary dinner vouchers..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDirectiveModalTarget(null);
                  setDirectiveText('');
                  setDirectiveDepartment('All departments');
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!directiveText.trim()}
                onClick={handleDispatchDirective}
                className="px-5 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-md"
              >
                Dispatch Directive
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Elaborated Escalated Task Detail Modal */}
      {selectedEscalatedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedEscalatedTask(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 grid place-items-center border border-purple-500/30">
                  <Siren className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {selectedEscalatedTask.title}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-mist-300">
                      {selectedEscalatedTask.ref || selectedEscalatedTask.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Department: <span className="font-semibold text-navy-950 dark:text-white">{getTaskDepartmentDisplay(selectedEscalatedTask)}</span> · Priority: <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedEscalatedTask.priority || 'VIP / Escalated'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEscalatedTask(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Elaborated Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 4 Quick Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Department</span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5">{getTaskDepartmentDisplay(selectedEscalatedTask)}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Status</span>
                  <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{selectedEscalatedTask.status}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Priority</span>
                  <div className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">{selectedEscalatedTask.priority || 'Critical / VIP'}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">Assigned Lead</span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5">{selectedEscalatedTask.owner || selectedEscalatedTask.assignee || 'Duty Supervisor'}</div>
                </div>
              </div>

              {/* Elaborated Details & Scope */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Elaborated Task Scope & Operational Meta
                </h4>
                <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                  {formatTaskMeta(selectedEscalatedTask.meta) || selectedEscalatedTask.description || selectedEscalatedTask.notes || 'Full operational escalation logged under executive surveillance. Requires supervisor and general manager coordination.'}
                </p>
                {selectedEscalatedTask.room && (
                  <div className="pt-2 text-xs text-slate-500 dark:text-mist-400 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-amber-500" />
                    <span>Room / Suite Location: <strong>Room {selectedEscalatedTask.room}</strong></span>
                  </div>
                )}
                {selectedEscalatedTask.repairCategory && (
                  <div className="text-xs text-slate-500 dark:text-mist-400 flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-amber-500" />
                    <span>Repair Category: <strong>{selectedEscalatedTask.repairCategory}</strong></span>
                  </div>
                )}
              </div>

              {/* Chronological Audit / Escalation Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-amber-500" />
                  Escalation Audit Trail & Timeline
                </h4>
                <div className="space-y-2.5 border-l-2 border-purple-500/30 dark:border-purple-500/20 pl-4 ml-2">
                  {selectedEscalatedTask.history && selectedEscalatedTask.history.length > 0 ? (
                    selectedEscalatedTask.history.map((h, i) => (
                      <div key={i} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{h.at}</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">{h.status}</div>
                        {h.note && <div className="text-slate-500 dark:text-mist-400 mt-0.5">{h.note}</div>}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{selectedEscalatedTask.createdAt || 'Today 08:30'}</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">Logged by Dispatch Coordinator</div>
                        <div className="text-slate-500 dark:text-mist-400 mt-0.5">Assigned to {selectedEscalatedTask.owner || 'field operations team'} with priority {selectedEscalatedTask.priority || 'VIP'}.</div>
                      </div>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">Today 10:15</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">Escalated to General Manager Oversight</div>
                        <div className="text-slate-500 dark:text-mist-400 mt-0.5">Operational bottleneck or SLA threshold approached. Requires GM visibility.</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Ref: <strong className="font-mono text-navy-950 dark:text-white">{selectedEscalatedTask.ref || selectedEscalatedTask.id}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={permissionMode === 'viewer'}
                  onClick={() => {
                    const t = selectedEscalatedTask;
                    setSelectedEscalatedTask(null);
                    setDirectiveModalTarget({
                      id: t.ref || t.id,
                      title: t.title,
                      type: 'incident',
                    });
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    permissionMode === 'viewer'
                      ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Issue Directive
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEscalatedTask(null)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Guest Complaint Modal */}
      {selectedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedComplaint(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center border border-amber-500/30">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      {selectedComplaint.summary}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-mist-300">
                      {selectedComplaint.ref}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Room {selectedComplaint.room} · Guest: <span className="font-semibold text-navy-950 dark:text-white">{selectedComplaint.guest}</span> · Logged: <span className="font-semibold text-navy-950 dark:text-white">{selectedComplaint.createdAt}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Elaborated Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 4 Quick Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-amber-500" /> Room / Guest
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={`Room ${selectedComplaint.room} - ${selectedComplaint.guest}`}>
                    Room {selectedComplaint.room} · {selectedComplaint.guest}
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <Users className="h-3 w-3 text-purple-500" /> Department
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5 truncate" title={selectedComplaint.department || selectedComplaint.category || 'Duty / Guest Services'}>
                    {selectedComplaint.department || selectedComplaint.category || 'Duty / Guest Services'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-rose-500" /> Severity
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5 uppercase">
                    {selectedComplaint.severity}
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block flex items-center gap-1">
                    <Clock className="h-3 w-3 text-sky-500" /> Logged Time
                  </span>
                  <div className="font-bold text-navy-950 dark:text-white mt-0.5">
                    {selectedComplaint.createdAt}
                  </div>
                </div>
              </div>

              {/* Financial Compensation & Service Recovery Overview */}
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                    Proposed Service Recovery Compensation
                  </span>
                  <div className="text-lg font-mono font-black text-amber-600 dark:text-amber-300 mt-0.5">
                    ₹{selectedComplaint.comp ? (selectedComplaint.comp * 80).toLocaleString('en-IN') : '₹4,000'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-mist-400">Recovery Status:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                    selectedComplaint.compApplied
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    {selectedComplaint.compApplied ? 'Credit Applied / Resolved' : 'Pending Review'}
                  </span>
                </div>
              </div>

              {/* Elaborated Complaint Description */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Elaborated Guest Complaint Details
                </h4>
                <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                  {selectedComplaint.description || selectedComplaint.summary || 'Guest reported service dissatisfaction during stay. Service recovery dispatched under Duty Manager coordination.'}
                </p>
                {selectedComplaint.assignedTo && (
                  <div className="pt-2 text-xs text-slate-500 dark:text-mist-400 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-sky-500" />
                    <span>Assigned Lead: <strong className="text-navy-950 dark:text-white">{selectedComplaint.assignedTo}</strong></span>
                  </div>
                )}
              </div>

              {/* Response Remarks / Manager Notes */}
              {(selectedComplaint.responseRemarks || selectedComplaint.managerNotes) && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Duty Manager Action & Response Remarks
                  </h4>
                  <p className="text-xs text-navy-950 dark:text-mist-200 leading-relaxed">
                    {selectedComplaint.responseRemarks || selectedComplaint.managerNotes}
                  </p>
                </div>
              )}

              {/* Chronological Audit / Escalation Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-amber-500" />
                  Service Recovery Timeline & Log
                </h4>
                <div className="space-y-2.5 border-l-2 border-amber-500/30 dark:border-amber-500/20 pl-4 ml-2">
                  {selectedComplaint.history && selectedComplaint.history.length > 0 ? (
                    selectedComplaint.history.map((h, i) => (
                      <div key={i} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{h.at}</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">{h.status}</div>
                        {h.note && <div className="text-slate-500 dark:text-mist-400 mt-0.5">{h.note}</div>}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">{selectedComplaint.createdAt}</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">Incident Reported by Guest</div>
                        <div className="text-slate-500 dark:text-mist-400 mt-0.5">Logged via Front Desk Coordinator for Room {selectedComplaint.room} ({selectedComplaint.guest}).</div>
                      </div>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-ink-900" />
                        <div className="font-mono text-[11px] text-slate-400">Review In Progress</div>
                        <div className="text-navy-950 dark:text-mist-200 font-semibold">Duty Manager & Department Review</div>
                        <div className="text-slate-500 dark:text-mist-400 mt-0.5">Service recovery action dispatched. Goodwill comp of ₹{selectedComplaint.comp ? (selectedComplaint.comp * 80).toLocaleString('en-IN') : '₹4,000'} queued for executive sign-off.</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Ref: <strong className="font-mono text-navy-950 dark:text-white">{selectedComplaint.ref}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={permissionMode === 'viewer'}
                  onClick={() => {
                    const c = selectedComplaint;
                    setSelectedComplaint(null);
                    setDirectiveModalTarget({
                      id: c.ref,
                      title: `Room ${c.room} Complaint (${c.guest})`,
                      type: 'complaint',
                    });
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    permissionMode === 'viewer'
                      ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Issue Directive
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
