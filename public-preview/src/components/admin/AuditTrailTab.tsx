'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  History,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import type { AuditEvent } from '@/types/demo';

export function AuditTrailTab() {
  const { state, notify } = useDemo();
  const events = state.auditTrail ?? [];

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        ev.actor.toLowerCase().includes(q) ||
        ev.action.toLowerCase().includes(q) ||
        ev.resource.toLowerCase().includes(q) ||
        (ev.details && ev.details.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'all' || ev.category === categoryFilter;
      const matchesOutcome = outcomeFilter === 'all' || ev.outcome === outcomeFilter;

      return matchesQuery && matchesCategory && matchesOutcome;
    });
  }, [events, query, categoryFilter, outcomeFilter]);

  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `the-grand-adp-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify('Audit log exported to JSON');
  };

  const getOutcomeBadge = (outcome: AuditEvent['outcome']) => {
    switch (outcome) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Success
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-200">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
            <ShieldAlert className="h-3 w-3" /> Denied
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <History className="h-6 w-6 text-amber-300" />
            Immutable Audit Trail & Compliance Log
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Attributable record of all administrative grants, session revocations, workflow changes, and operational exceptions (ER_DIAGRAMS Domain 4 & SECURITY.md).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="subtle"
            iconLeft={Download}
            onClick={handleExportAudit}
          >
            Export Log (.JSON)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by actor, action, or resource…"
            className="w-full rounded-xl border border-white/10 bg-ink-950/70 py-2 pl-10 pr-4 text-xs text-white placeholder:text-mist-500 focus:outline-none focus:border-amber-400/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category & Outcome Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Categories</option>
            <option value="Access">Access & Grants</option>
            <option value="Workflow">Workflow & SLAs</option>
            <option value="Integration">Connectors & PMS</option>
            <option value="Hotel">Hotel Operations</option>
            <option value="Security">Security Protocols</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-mist-200 focus:outline-none focus:border-amber-400/50"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-mist-400">
                <th className="p-4 font-semibold w-24">Timestamp</th>
                <th className="p-4 font-semibold w-56">Actor & Persona</th>
                <th className="p-4 font-semibold">Action Executed</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Resource Target</th>
                <th className="p-4 font-semibold text-center">Outcome</th>
                <th className="p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-mist-300">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-mist-400">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.02] transition">
                    {/* Timestamp */}
                    <td className="p-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {ev.timestamp}
                    </td>

                    {/* Actor */}
                    <td className="p-4 whitespace-nowrap">
                      <strong className="text-white block font-semibold">{ev.actor}</strong>
                      <span className="text-[11px] text-mist-400 block">{ev.actorRole}</span>
                    </td>

                    {/* Action */}
                    <td className="p-4">
                      <span className="font-semibold text-white block">{ev.action}</span>
                    </td>

                    {/* Category */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-mist-200">
                        {ev.category}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="p-4">
                      <span className="font-mono text-mist-200 text-[11px] block">{ev.resource}</span>
                    </td>

                    {/* Outcome */}
                    <td className="p-4 text-center whitespace-nowrap">
                      {getOutcomeBadge(ev.outcome)}
                    </td>

                    {/* Details */}
                    <td className="p-4 text-mist-400 max-w-xs truncate text-[11px]">
                      {ev.details ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
