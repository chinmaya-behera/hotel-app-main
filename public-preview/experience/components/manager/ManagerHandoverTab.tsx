'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Layers,
  ListChecks,
  Plus,
  Send,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { ShiftHandover } from '@/types/demo';

interface ManagerHandoverTabProps {
  scope: 'department' | 'hotel';
}

export function ManagerHandoverTab({ scope }: ManagerHandoverTabProps) {
  const { state, submitShiftHandover, acknowledgeShiftHandover } = useDemo();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<ShiftHandover | null>(null);

  // Form State
  const [shiftType, setShiftType] = useState<ShiftHandover['shift']>('Day');
  const [incomingManager, setIncomingManager] = useState('');
  const [notes, setNotes] = useState('');
  const [priorityAction1, setPriorityAction1] = useState('');
  const [priorityAction2, setPriorityAction2] = useState('');
  const [priorityAction3, setPriorityAction3] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Automatic calculation of live outstanding counts
  const outstandingTasksCount = useMemo(() => {
    return (state.items.department_dispatcher ?? []).filter(
      (t) => t.status !== 'Completed' && t.status !== 'Cancelled',
    ).length;
  }, [state.items.department_dispatcher]);

  const unresolvedComplaintsCount = useMemo(() => {
    return (state.frontDesk.complaints ?? []).filter((c) => !c.compApplied).length;
  }, [state.frontDesk.complaints]);

  const criticalIncidentsCount = useMemo(() => {
    return (state.incidents ?? []).filter((i) => i.status !== 'resolved').length;
  }, [state.incidents]);

  const handovers = state.shiftHandovers ?? [];

  const handleOpenCreate = () => {
    setShiftType('Duty');
    setIncomingManager('David Kalu (Morning Duty Manager)');
    setNotes('');
    setPriorityAction1('Verify pending check-outs and folio billing with Front Office');
    setPriorityAction2('Follow up on floor 4 HVAC pressure sensor replacement');
    setPriorityAction3('Check VIP guest satisfaction for Suite 518');
    setPreviewMode(false);
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingManager.trim() || !notes.trim()) return;

    const priorityActions = [priorityAction1, priorityAction2, priorityAction3]
      .map((s) => s.trim())
      .filter(Boolean);

    submitShiftHandover({
      outgoingManager: 'Isabella Scott (Duty Manager)',
      incomingManager: incomingManager.trim(),
      shift: shiftType,
      department: 'Duty & Operations',
      scope: scope === 'hotel' ? 'Entire Hotel' : 'My Department',
      outstandingTasksCount,
      unresolvedComplaintsCount,
      criticalIncidentsCount,
      notes: notes.trim(),
      priorityActions,
    });

    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Shift Handover & Operations Briefing Log</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Standardized operational briefings between shifts: open work queues, critical complaints, ongoing incidents, and handover sign-off.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Prepare Shift Briefing</span>
        </button>
      </div>

      {/* Live Operational Metrics Snapshot for Handover */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Current Outstanding Tasks</span>
          <p className="text-2xl font-bold font-mono text-white">{outstandingTasksCount}</p>
          <span className="text-[11px] text-mist-400">Active tasks across all field teams</span>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Unresolved Complaints</span>
          <p className="text-2xl font-bold font-mono text-amber-300">{unresolvedComplaintsCount}</p>
          <span className="text-[11px] text-mist-400">Pending manager compensation sign-off</span>
        </div>
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-1">
          <span className="text-[10px] uppercase font-bold text-mist-400">Active Incidents / Hazards</span>
          <p className="text-2xl font-bold font-mono text-rose-400">{criticalIncidentsCount}</p>
          <span className="text-[11px] text-mist-400">Investigating or contained events</span>
        </div>
      </div>

      {/* Handover History List */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Shift Handover Archives</h3>
            <p className="text-xs text-mist-400">Historical shift briefings with status confirmation and key directives</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-mist-300 font-bold">
            {handovers.length} records
          </span>
        </div>

        <div className="space-y-4">
          {handovers.map((h) => {
            const isAcknowledged = h.status === 'acknowledged';

            return (
              <div
                key={h.id}
                className={`p-5 rounded-3xl border transition space-y-3 ${
                  isAcknowledged ? 'border-white/10 bg-white/[0.02]' : 'border-amber-400/30 bg-amber-400/[0.03]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-white/10 text-mist-200 text-[10px] font-bold px-2 py-0.5">
                      {h.shift} Shift
                    </span>
                    <h4 className="font-bold text-white text-sm">
                      {h.outgoingManager} → {h.incomingManager}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-mist-400 text-xs font-mono">{h.timestamp}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isAcknowledged
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-mist-200 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/[0.04]">
                  {h.notes}
                </p>

                {/* Priority Actions */}
                {h.priorityActions && h.priorityActions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">Priority Follow-up Actions:</span>
                    <ul className="space-y-1 text-xs text-mist-300 list-disc list-inside">
                      {h.priorityActions.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer and Sign-off */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                  <div className="flex items-center gap-4 text-mist-400 font-mono text-[11px]">
                    <span>Tasks: {h.outstandingTasksCount}</span>
                    <span>Complaints: {h.unresolvedComplaintsCount}</span>
                    <span>Incidents: {h.criticalIncidentsCount}</span>
                  </div>

                  {!isAcknowledged && (
                    <button
                      type="button"
                      onClick={() => acknowledgeShiftHandover(h.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Acknowledge Handover</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Handover Modal Dialog */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">Record Shift Handover Briefing</h3>
                <p className="text-xs text-mist-400">Transfer operational responsibility and critical follow-up directives</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-mist-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {!previewMode ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-mist-300 mb-1">Shift Handed Over:</label>
                    <select
                      value={shiftType}
                      onChange={(e) => setShiftType(e.target.value as ShiftHandover['shift'])}
                      className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="Day">Day Shift</option>
                      <option value="Evening">Evening Shift</option>
                      <option value="Night">Night Shift</option>
                      <option value="Duty">Duty Shift</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-mist-300 mb-1">Incoming Manager:</label>
                    <input
                      type="text"
                      required
                      value={incomingManager}
                      onChange={(e) => setIncomingManager(e.target.value)}
                      placeholder="e.g. David Kalu (Morning Duty Manager)"
                      className="w-full h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">Open Tasks</span>
                    <span className="text-lg font-bold font-mono text-white mt-0.5 block">{outstandingTasksCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">Complaints</span>
                    <span className="text-lg font-bold font-mono text-amber-300 mt-0.5 block">{unresolvedComplaintsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">Incidents</span>
                    <span className="text-lg font-bold font-mono text-rose-400 mt-0.5 block">{criticalIncidentsCount}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-mist-300 mb-1">Operational Summary & Handover Notes:</label>
                  <textarea
                    rows={3}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Summarize occupancy, high priority cases, room blocks, and building status..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-mist-300">
                    Priority Directives for Incoming Shift (up to 3):
                  </label>
                  <input
                    type="text"
                    value={priorityAction1}
                    onChange={(e) => setPriorityAction1(e.target.value)}
                    placeholder="Action 1: e.g. Inspect Room 402 prior to VIP arrival"
                    className="w-full h-8 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={priorityAction2}
                    onChange={(e) => setPriorityAction2(e.target.value)}
                    placeholder="Action 2: e.g. Follow up on HVAC chiller pressure sensor"
                    className="w-full h-8 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={priorityAction3}
                    onChange={(e) => setPriorityAction3(e.target.value)}
                    placeholder="Action 3: e.g. Review PMS payment sync reconciliation"
                    className="w-full h-8 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className="text-amber-300 hover:text-amber-200 text-xs font-semibold"
                  >
                    Preview Briefing →
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
                    >
                      Submit Handover
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="font-bold text-white text-sm">Briefing Preview: {shiftType} Shift</span>
                    <span className="text-amber-300 font-mono text-[11px]">Isabella Scott → {incomingManager}</span>
                  </div>
                  <p className="text-mist-200 leading-relaxed">{notes || 'No notes entered.'}</p>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">Actions:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-mist-300">
                      {[priorityAction1, priorityAction2, priorityAction3].filter(Boolean).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className="text-amber-300 hover:text-amber-200 text-xs font-semibold"
                  >
                    ← Back to Edit
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit as any}
                    className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
                  >
                    Confirm & Submit Briefing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
