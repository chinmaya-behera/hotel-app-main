'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Shield,
  ShieldAlert,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useDemo } from '@/lib/store';
import type { ShiftHandover } from '@/types/demo';

export function SecurityHandoverTab() {
  const { state, submitShiftHandover, acknowledgeShiftHandover } = useDemo();
  const [showLogModal, setShowLogModal] = useState(false);

  // Form State
  const [incomingOfficer, setIncomingOfficer] = useState('Officer Marcus Chen (EMP-0112)');
  const [shiftType, setShiftType] = useState<ShiftHandover['shift']>('Night');
  const [notes, setNotes] = useState('');
  const [priorityAction1, setPriorityAction1] = useState('Continue hourly physical patrol of Floor 4 West Wing');
  const [priorityAction2, setPriorityAction2] = useState('Monitor secure evidence locker key log');

  const handovers = state.shiftHandovers ?? [];
  const activeIncidents = (state.incidents ?? []).filter((i) => i.status !== 'resolved');
  const activeSecurityItems = (state.items.security_responder ?? []).filter((i) => i.status !== 'Resolved');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    submitShiftHandover({
      outgoingManager: 'Senior Officer Roy (EMP-0108)',
      incomingManager: incomingOfficer,
      shift: shiftType,
      department: 'Security & Safety',
      scope: 'Property-Wide Security Patrol',
      outstandingTasksCount: activeSecurityItems.length,
      unresolvedComplaintsCount: 0,
      criticalIncidentsCount: activeIncidents.filter((i) => i.severity === 'critical' || i.severity === 'major').length,
      notes: notes.trim(),
      priorityActions: [priorityAction1, priorityAction2].filter(Boolean),
    });

    setNotes('');
    setShowLogModal(false);
  };

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-150 text-white">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-sky-400" />
            <span>Security Shift Handover Log</span>
          </h2>
          <p className="text-[11px] text-mist-400">
            Shift transition records, active patrol issues, evidence references and follow-up tasks
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1.5 rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-1 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Handover</span>
        </button>
      </div>

      {/* Active Shift Briefing Banner */}
      <div className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-3.5 space-y-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
          Current Shift Briefing (Night 22:00–07:00)
        </span>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-ink-900 border border-white/5">
            <span className="text-mist-400 text-[10px] block">Active Dispatches</span>
            <span className="font-bold text-white text-sm">{activeSecurityItems.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-ink-900 border border-white/5">
            <span className="text-mist-400 text-[10px] block">Major Incidents</span>
            <span className="font-bold text-rose-400 text-sm">
              {activeIncidents.filter((i) => i.severity === 'critical' || i.severity === 'major').length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-ink-900 border border-white/5">
            <span className="text-mist-400 text-[10px] block">Evidence Logs</span>
            <span className="font-bold text-emerald-400 text-sm">3 Active</span>
          </div>
        </div>
      </div>

      {/* Handover Records List */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 px-1">
          Historical Shift Records
        </span>

        {handovers.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-mist-400">
            No shift handovers logged yet.
          </div>
        ) : (
          handovers.map((ho) => {
            const isAck = ho.status === 'acknowledged';
            return (
              <div
                key={ho.id}
                className="rounded-2xl border border-white/10 bg-ink-900 p-4 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge tone="info">{ho.shift} Shift</Badge>
                      <Badge tone={isAck ? 'success' : 'warning'}>
                        {isAck ? 'Acknowledged' : 'Pending Ack'}
                      </Badge>
                    </div>
                    <p className="mt-1 font-semibold text-white text-xs">
                      {ho.outgoingManager} → {ho.incomingManager}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-mist-400">{ho.timestamp}</span>
                </div>

                <p className="text-mist-200 text-xs leading-relaxed">{ho.notes}</p>

                {/* Priority Follow-up Actions */}
                {ho.priorityActions && ho.priorityActions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-ink-950 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                      Follow-up Responsibilities & Evidence Refs:
                    </span>
                    <ul className="space-y-0.5 text-[11px] text-mist-300 list-disc list-inside">
                      {ho.priorityActions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-mist-400">
                  <span>Scope: {ho.scope}</span>
                  {!isAck && (
                    <button
                      type="button"
                      onClick={() => acknowledgeShiftHandover(ho.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-ink-950 font-bold text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Acknowledge Handover</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Handover Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-sky-400" />
                <span>Log Security Shift Handover</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-mist-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-mist-300 block mb-1">Incoming Officer</label>
                <input
                  type="text"
                  required
                  value={incomingOfficer}
                  onChange={(e) => setIncomingOfficer(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-mist-300 block mb-1">Incoming Shift</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as ShiftHandover['shift'])}
                  className="field w-full text-xs"
                >
                  <option value="Day">Day Shift (07:00–15:00)</option>
                  <option value="Evening">Evening Shift (15:00–23:00)</option>
                  <option value="Night">Night Shift (23:00–07:00)</option>
                </select>
              </div>

              <div>
                <label className="text-mist-300 block mb-1">
                  Active Incidents & Unresolved Issues Summary
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record open perimeters, active backup requests, evidence locker status..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-mist-300 block mb-1">Follow-up Priority Action 1</label>
                <input
                  type="text"
                  value={priorityAction1}
                  onChange={(e) => setPriorityAction1(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-mist-300 block mb-1">Follow-up Priority Action 2 (Optional)</label>
                <input
                  type="text"
                  value={priorityAction2}
                  onChange={(e) => setPriorityAction2(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-ink-950 font-bold"
                >
                  Save Handover Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
