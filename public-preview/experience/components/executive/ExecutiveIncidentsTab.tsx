'use client';

import { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
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
import type { IncidentRecord, ComplaintCase, WorkItem } from '@/types/demo';

interface ExecutiveIncidentsTabProps {
  permissionMode: 'viewer' | 'approver';
  initialView?: 'incidents' | 'complaints' | 'escalations';
}

export function ExecutiveIncidentsTab({
  permissionMode,
  initialView = 'incidents',
}: ExecutiveIncidentsTabProps) {
  const { state, requestExecutiveDirective, updateIncidentStatus } = useDemo();
  const [activeView, setActiveView] = useState<'incidents' | 'complaints' | 'escalations'>(initialView);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintCase | null>(null);

  // Executive Directive Modal
  const [directiveModalTarget, setDirectiveModalTarget] = useState<{ id: string; title: string; type: 'incident' | 'complaint' } | null>(null);
  const [directiveText, setDirectiveText] = useState('');

  // Incidents
  const incidents = state.incidents ?? [];
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, severityFilter]);

  // Complaints
  const complaints = state.frontDesk.complaints ?? [];

  // Escalated tasks from other departments
  const escalatedTasks: WorkItem[] = useMemo(() => {
    const list: WorkItem[] = [];
    const roles = ['department_manager', 'department_dispatcher', 'task_fulfiller'] as const;
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

  const handleDispatchDirective = () => {
    if (!directiveModalTarget || !directiveText.trim() || permissionMode === 'viewer') return;
    requestExecutiveDirective(directiveModalTarget.id, directiveModalTarget.type, directiveText.trim());
    setDirectiveModalTarget(null);
    setDirectiveText('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Incident Command & Executive Recovery
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20">
              {incidents.filter((i) => i.status !== 'resolved').length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Cross-department emergency oversight, critical guest escalations, and binding executive directives.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
          {[
            { id: 'incidents', label: 'Property Incidents', count: incidents.length },
            { id: 'complaints', label: 'Guest Complaints', count: complaints.length },
            { id: 'escalations', label: 'High Escalations', count: escalatedTasks.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === tab.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeView === tab.id ? 'bg-white/30 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
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

                    <h4 className="text-sm font-bold text-navy-950 dark:text-white mt-2">
                      {incident.title}
                    </h4>

                    <div className="text-[11px] text-slate-500 dark:text-mist-400 mt-1 space-y-1">
                      <div>Area: {incident.affectedArea}</div>
                      <div>Coordinator: {incident.coordinator}</div>
                      <div>Reported: {incident.reportedAt}</div>
                    </div>

                    {/* Timeline Snippet */}
                    <div className="mt-3 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-500 block">
                        Latest Activity
                      </span>
                      {incident.timeline.slice(-2).map((t, idx) => (
                        <div key={idx} className="text-[11px] text-slate-600 dark:text-mist-300 flex items-start gap-1.5">
                          <span className="font-mono text-slate-400 shrink-0">{t.at}:</span>
                          <span className="line-clamp-1">{t.text}</span>
                        </div>
                      ))}
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
                        onClick={() => setSelectedIncident(incident)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
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
                  <th className="px-4 py-3">Summary & Complaint</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Proposed Comp</th>
                  <th className="px-4 py-3">Recovery Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3 font-mono font-bold text-navy-950 dark:text-white">
                      {c.ref}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-950 dark:text-white">Room {c.room}</div>
                      <div className="text-[11px] text-slate-400 dark:text-mist-400">{c.guest}</div>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="text-navy-950 dark:text-white font-medium">{c.summary}</div>
                      <div className="text-[10px] text-slate-400 dark:text-mist-500 mt-0.5">Logged: {c.createdAt}</div>
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
                      <button
                        type="button"
                        disabled={permissionMode === 'viewer'}
                        onClick={() =>
                          setDirectiveModalTarget({
                            id: c.ref,
                            title: `Room ${c.room} Complaint (${c.guest})`,
                            type: 'complaint',
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          permissionMode === 'viewer'
                            ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        Directive
                      </button>
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
                {escalatedTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3 font-mono font-bold text-navy-950 dark:text-white">
                      {t.ref || t.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-950 dark:text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-400 dark:text-mist-400">{t.meta}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-mist-300">
                      {t.department || 'Property Operations'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                        {t.priority || 'VIP'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-navy-950 dark:text-white">
                      {t.status}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-mist-400">
                      {t.owner || t.assignee || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Timeline Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-white dark:bg-ink-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-500 grid place-items-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-950 dark:text-white">
                    {selectedIncident.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-mist-400 font-mono">
                    Ref: {selectedIncident.ref} · Coordinator: {selectedIncident.coordinator}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-mist-400">
                Chronological Incident Timeline
              </h4>
              <div className="space-y-2.5 border-l-2 border-slate-200 dark:border-white/10 pl-4 ml-2 max-h-60 overflow-y-auto">
                {selectedIncident.timeline.map((entry, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-ink-900" />
                    <div className="font-mono text-[11px] text-slate-400">{entry.at}</div>
                    <div className="text-navy-950 dark:text-mist-200 mt-0.5">{entry.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md"
              >
                Close Timeline
              </button>
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

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              Directives from the Executive Office take top operational precedence and notify all department supervisors immediately.
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
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-mist-300"
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
    </div>
  );
}
