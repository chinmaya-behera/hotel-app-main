'use client';

import { useState } from 'react';
import {
  Flame,
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import type { IncidentRecord } from '@/types/demo';

interface SupervisorEscalationsTabProps {
  incidents: IncidentRecord[];
  onOpenEscalateModal: () => void;
}

export function SupervisorEscalationsTab({
  incidents,
  onOpenEscalateModal,
}: SupervisorEscalationsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'investigating' | 'resolved'>('all');

  const filtered = incidents.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchArea = inc.affectedArea.toLowerCase().includes(q);
      const matchRef = inc.ref.toLowerCase().includes(q);
      if (!matchTitle && !matchArea && !matchRef) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Supervisor Escalations & Duty Manager Blocker Workspace
            </h2>
            <p className="text-xs text-mist-400">
              Escalate physical defects, biohazards, and SLA risks directly to Duty Manager Isabella Scott
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenEscalateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-rose-500/20 transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Escalate New Issue</span>
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/[0.06]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search escalation by reference (ESC-502), room, or title..."
              className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-rose-400 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-full sm:w-auto">
            {(['all', 'investigating', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-rose-500 text-white font-bold shadow'
                    : 'text-mist-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Escalation Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/10 bg-ink-900/60 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto" />
            <p className="text-sm font-bold text-white">No Active Escalations</p>
            <p className="text-xs text-mist-400">
              Department operations are running within nominal parameters.
            </p>
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4 hover:border-rose-500/30 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-rose-300 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                      {inc.ref}
                    </span>
                    <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                  </div>
                  <p className="text-xs text-mist-400">
                    Location: <span className="text-white font-semibold">{inc.affectedArea}</span> ·
                    Reported: {inc.reportedAt} · Coordinator: {inc.coordinator}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inc.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              {inc.timeline && inc.timeline.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-mist-400">
                    Escalation Response Log
                  </p>
                  <div className="space-y-1.5">
                    {inc.timeline.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <span className="font-mono text-[11px] text-amber-300 shrink-0">
                          {entry.at}
                        </span>
                        <span className="text-mist-200">{entry.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
