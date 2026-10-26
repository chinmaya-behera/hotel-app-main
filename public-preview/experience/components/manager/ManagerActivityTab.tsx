'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { AuditEvent } from '@/types/demo';

export function ManagerActivityTab() {
  const { state } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const auditEvents = state.auditTrail ?? [];
  const feed = state.feed ?? [];

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (categoryFilter !== 'all' && ev.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesAction = ev.action.toLowerCase().includes(q);
        const matchesActor = ev.actor.toLowerCase().includes(q);
        const matchesResource = ev.resource.toLowerCase().includes(q);
        const matchesDetails = (ev.details || '').toLowerCase().includes(q);
        if (!matchesAction && !matchesActor && !matchesResource && !matchesDetails) return false;
      }
      return true;
    });
  }, [auditEvents, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-300">
              <History className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold font-display text-white">Operations Audit Trail & Activity Log</h2>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Complete immutable ledger of task dispatches, managerial compensation approvals, and incident transitions.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs text-mist-300">
          {auditEvents.length} Verified Ledger Events
        </span>
      </div>

      {/* Filter and Search Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/80 p-3 backdrop-blur-md text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, action, or resource..."
            className="w-full h-8 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-mist-400 font-medium">Category:</span>
          {['all', 'Workflow', 'Hotel', 'Access', 'Security'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl border font-semibold transition ${
                categoryFilter === cat
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Events Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 pl-6 pr-3">Timestamp</th>
                <th className="px-3 py-3.5">Actor / Origin</th>
                <th className="px-3 py-3.5">Action Executed</th>
                <th className="px-3 py-3.5">Category</th>
                <th className="px-3 py-3.5">Target Resource</th>
                <th className="px-3 py-3.5">Outcome</th>
                <th className="py-3.5 pl-3 pr-6">Directives & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-mist-400 italic">
                    No activity records found matching active filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 pl-6 pr-3 font-mono text-mist-400 whitespace-nowrap">
                      {ev.timestamp}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-white block">{ev.actor}</span>
                      <span className="text-[10px] text-mist-400 block">{ev.actorRole}</span>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-white">{ev.action}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-mist-300">
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-amber-300 whitespace-nowrap">{ev.resource}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`font-bold text-[10px] px-2 py-0.5 rounded-full uppercase ${
                          ev.outcome === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : ev.outcome === 'warning'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {ev.outcome}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-mist-300 max-w-xs truncate">
                      {ev.details || '—'}
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
