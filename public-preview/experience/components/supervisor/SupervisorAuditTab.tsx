'use client';

import { useState } from 'react';
import { History, Search, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { AuditEvent } from '@/types/demo';

interface SupervisorAuditTabProps {
  auditTrail: AuditEvent[];
}

export function SupervisorAuditTab({ auditTrail }: SupervisorAuditTabProps) {
  const [search, setSearch] = useState('');

  const supervisorEvents = auditTrail.filter(
    (ev) =>
      ev.actor?.includes('Meera') ||
      ev.actorRole?.includes('Supervisor') ||
      ev.category === 'Workflow' ||
      ev.action?.toLowerCase().includes('inspection') ||
      ev.action?.toLowerCase().includes('reopen'),
  );

  const filtered = supervisorEvents.filter((ev) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ev.action.toLowerCase().includes(q) ||
        ev.resource.toLowerCase().includes(q) ||
        ev.details?.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q)
      );
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
              Supervisor Quality & Verification Audit Trail
            </h2>
            <p className="text-xs text-mist-400">
              Immutable ledger of room inspection approvals, reopenings, and staff reassignments
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, room, or detail..."
              className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 overflow-hidden backdrop-blur-xl shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="h-10 w-10 text-mist-500 mx-auto" />
            <p className="text-sm font-bold text-white">No Supervisor Audit Events Found</p>
            <p className="text-xs text-mist-400">Audit events will appear as actions are executed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono text-mist-400 text-[11px] whitespace-nowrap">
                      {ev.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{ev.actor}</p>
                      <p className="text-[10px] text-mist-400">{ev.actorRole}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-amber-300">{ev.action}</td>
                    <td className="py-3.5 px-4 font-mono text-white">{ev.resource}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          ev.outcome === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : ev.outcome === 'warning'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {ev.outcome === 'success' && <CheckCircle2 className="h-3 w-3" />}
                        {ev.outcome === 'warning' && <AlertTriangle className="h-3 w-3" />}
                        {ev.outcome === 'denied' && <XCircle className="h-3 w-3" />}
                        <span>{ev.outcome}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-mist-300 max-w-sm truncate text-[11px]">
                      {ev.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
