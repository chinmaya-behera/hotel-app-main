'use client';

import { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  MessageSquare,
  ShieldAlert,
  Siren,
  Sliders,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { IncidentRecord } from '@/types/demo';

export function DutyOperationsTab() {
  const { state, updateIncidentStatus } = useDemo();
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentRecord['status']>('contained');
  const [statusNote, setStatusNote] = useState('');

  const incidents = state.incidents ?? [];

  // Blocked or delayed cross-department tasks
  const blockedTasks = (state.items.department_dispatcher ?? []).filter(
    (t) => t.status === 'Escalated' || (t.notes && t.notes.toLowerCase().includes('block')),
  );

  const handleOpenStatusModal = (inc: IncidentRecord) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status === 'investigating' ? 'contained' : 'resolved');
    setStatusNote('');
  };

  const handleConfirmStatus = () => {
    if (!selectedIncident) return;
    updateIncidentStatus(selectedIncident.id, newStatus, statusNote.trim() || undefined);
    setSelectedIncident(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-300">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Duty Manager Operations & Incident Command</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Property-wide operational command: cross-department synchronization, blocked dependencies, and high-impact incident resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300 font-bold">
            Hotel-Wide Operational Scope
          </span>
        </div>
      </div>

      {/* Incidents Management Section */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Active Operational Incidents & Hazards</h3>
            <p className="text-xs text-mist-400">Physical facility events, infrastructure faults, and security escalations</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-mist-300 font-bold">
            {incidents.length} incidents logged
          </span>
        </div>

        <div className="space-y-4">
          {incidents.length === 0 ? (
            <p className="py-8 text-center text-xs text-mist-400 italic">No open incidents logged. Property operations nominal.</p>
          ) : (
            incidents.map((inc) => {
              const isCritical = inc.severity === 'critical';
              const isMajor = inc.severity === 'major';
              const isResolved = inc.status === 'resolved';

              return (
                <div
                  key={inc.id}
                  className={`p-5 rounded-3xl border transition space-y-3 ${
                    isResolved
                      ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                      : isCritical || isMajor
                      ? 'border-rose-500/30 bg-rose-500/[0.04]'
                      : 'border-amber-400/20 bg-amber-400/[0.03]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-amber-300 font-bold text-xs">{inc.ref}</span>
                      <h4 className="font-bold text-white text-sm">{inc.title}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCritical || isMajor
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inc.status === 'contained'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {inc.status}
                      </span>
                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(inc)}
                          className="px-3 py-1 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs p-3 rounded-2xl bg-black/30 border border-white/[0.04] text-mist-300">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-mist-500 block">Affected Area</span>
                      <span className="font-semibold text-white block mt-0.5">{inc.affectedArea}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-mist-500 block">Lead Coordinator</span>
                      <span className="font-semibold text-white block mt-0.5">{inc.coordinator}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-mist-500 block">Reported Time</span>
                      <span className="font-mono text-mist-200 block mt-0.5">{inc.reportedAt}</span>
                    </div>
                  </div>

                  {/* Incident Timeline */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-mist-400 block">Incident Progression Timeline:</span>
                    <div className="space-y-1.5 pl-3 border-l-2 border-white/10">
                      {inc.timeline.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <span className="font-mono text-[11px] text-amber-300 shrink-0">{item.at}</span>
                          <span className="text-mist-200">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cross-Department Blocked Tasks Section */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white">Blocked Tasks & Cross-Department Handshakes</h3>
            <p className="text-xs text-mist-400">Inter-department dependencies requiring managerial intervention</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-mist-300 font-bold">
            {blockedTasks.length} pending
          </span>
        </div>

        <div className="space-y-2.5">
          {blockedTasks.length === 0 ? (
            <p className="py-4 text-center text-xs text-mist-400 italic">No blocked cross-department tasks.</p>
          ) : (
            blockedTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{t.title}</span>
                    <span className="font-mono text-amber-300 text-[11px]">Room {t.room || 'General'}</span>
                  </div>
                  <p className="text-mist-400 text-[11px] mt-0.5">{t.meta || t.description}</p>
                </div>
                <span className="rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                  Inter-Department
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Update Modal Dialog */}
      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">Update Incident Status</h3>
                <p className="text-xs text-mist-400">{selectedIncident.ref} · {selectedIncident.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-mist-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1.5">New Operational Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['investigating', 'contained', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 rounded-xl border text-xs font-bold uppercase transition ${
                        newStatus === st
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist-300 mb-1">
                  Timeline Action / Directives Note:
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Chiller pipe isolated by Wayne Chen; dry vacuuming completed; reopened to normal operations."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
              >
                Save & Update Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
