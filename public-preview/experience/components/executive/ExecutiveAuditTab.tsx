'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Lock,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { AuditEvent } from '@/types/demo';

export function ExecutiveAuditTab() {
  const { state } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const auditEvents = state.auditTrail ?? [];

  // Filter audit events
  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
      if (outcomeFilter !== 'all' && ev.outcome !== outcomeFilter) return false;
      if (actorFilter !== 'all' && !ev.actor.toLowerCase().includes(actorFilter.toLowerCase())) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.action.toLowerCase().includes(q) ||
          ev.actor.toLowerCase().includes(q) ||
          ev.resource.toLowerCase().includes(q) ||
          (ev.details || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditEvents, categoryFilter, outcomeFilter, actorFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              Executive Audit Log & Decision Ledger
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
              Immutable Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Real-time chronological verification of all executive approvals, policy waivers, directives, and operational decisions.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'timeline'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'table'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit actions, resources, or details..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">Category: All</option>
              <option value="Workflow">Workflow</option>
              <option value="Hotel">Hotel</option>
              <option value="Security">Security</option>
              <option value="Access">Access</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">Outcome: All</option>
              <option value="success">Success / Authorized</option>
              <option value="denied">Denied / Declined</option>
              <option value="warning">Warning</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">Actor: All Users</option>
              <option value="Alex Morgan">Alex Morgan (GM)</option>
              <option value="Isabella Scott">Isabella Scott (Duty Mgr)</option>
              <option value="Amelia Brooks">Amelia Brooks (Admin)</option>
              <option value="Emma Wilson">Emma Wilson (Front Desk)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Display */}
      {viewMode === 'timeline' ? (
        <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="space-y-4 border-l-2 border-slate-200 dark:border-white/10 pl-6 ml-2">
            {filteredEvents.map((ev) => {
              const isPriya = ev.actor.includes('Priya');
              return (
                <div key={ev.id} className="relative group text-xs">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-ink-900 ${
                      ev.outcome === 'denied'
                        ? 'bg-rose-500'
                        : isPriya
                        ? 'bg-amber-500 ring-4 ring-amber-500/20'
                        : 'bg-emerald-500'
                    }`}
                  />

                  <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 dark:text-white">
                          {ev.actor}
                        </span>
                        <span className="text-slate-400 dark:text-mist-500 font-mono">
                          ({ev.actorRole})
                        </span>
                        <span className="px-2 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-bold">
                          {ev.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-slate-400 dark:text-mist-500">
                        <span>{ev.timestamp}</span>
                        <span
                          className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
                            ev.outcome === 'denied'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          }`}
                        >
                          {ev.outcome}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-navy-950 dark:text-white">
                      {ev.action}
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-mist-300 leading-relaxed">
                      Target: <span className="font-mono text-amber-600 dark:text-amber-400">{ev.resource}</span>
                      {ev.details && <span> &middot; {ev.details}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-mist-400">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource Target</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                    {ev.timestamp}
                  </td>
                  <td className="px-4 py-3 font-bold text-navy-950 dark:text-white whitespace-nowrap">
                    {ev.actor}
                    <div className="text-[10px] font-normal text-slate-400 dark:text-mist-500">
                      {ev.actorRole}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 font-semibold text-[11px]">
                      {ev.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-950 dark:text-white font-medium">
                    {ev.action}
                    {ev.details && (
                      <div className="text-[10px] text-slate-400 dark:text-mist-500 mt-0.5 line-clamp-1">
                        {ev.details}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-mist-300">
                    {ev.resource}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ev.outcome === 'denied'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {ev.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
