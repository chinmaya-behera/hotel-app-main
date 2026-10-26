'use client';

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  User,
  ArrowUpDown
} from 'lucide-react';
import type { AuditEvent } from '@/types/demo';

interface FinanceAuditTabProps {
  auditTrail: AuditEvent[];
}

export function FinanceAuditTab({ auditTrail }: FinanceAuditTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'success' | 'warning' | 'denied'>('ALL');
  const [financeOnly, setFinanceOnly] = useState(true);

  // Filter financial events
  const filteredEvents = useMemo(() => {
    return auditTrail.filter((item) => {
      // Outcome filter
      if (outcomeFilter !== 'ALL' && item.outcome !== outcomeFilter) return false;

      // Finance filter
      if (financeOnly) {
        const isFin =
          item.actorRole.toLowerCase().includes('finan') ||
          item.actor.toLowerCase().includes('neha') ||
          item.action.toLowerCase().includes('invoice') ||
          item.action.toLowerCase().includes('payment') ||
          item.action.toLowerCase().includes('refund') ||
          item.action.toLowerCase().includes('reconcil') ||
          item.action.toLowerCase().includes('settle') ||
          item.resource.toLowerCase().includes('inv-') ||
          item.resource.toLowerCase().includes('txn-') ||
          item.resource.toLowerCase().includes('ref-');
        if (!isFin) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.action.toLowerCase().includes(q) ||
          item.actor.toLowerCase().includes(q) ||
          item.resource.toLowerCase().includes(q) ||
          (item.details && item.details.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [auditTrail, outcomeFilter, financeOnly, searchQuery]);

  const getOutcomeBadge = (outcome: AuditEvent['outcome']) => {
    switch (outcome) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Success
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Denied
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-400" />
            Financial Audit Log
          </h2>
          <p className="text-xs text-mist-400">
            Immutable chronicle of all invoice generations, payment records, refund authorizations, and reconciliation operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-mist-300 bg-ink-900 border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={financeOnly}
              onChange={(e) => setFinanceOnly(e.target.checked)}
              className="rounded bg-ink-950 border-white/20 text-primary-600 focus:ring-0"
            />
            <span>Filter Financial Actions Only</span>
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-ink-900 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
          <input
            type="text"
            placeholder="Search by action, actor, resource ID, or detail notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-950 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-mist-400">Outcome:</span>
          {(['ALL', 'success', 'warning', 'denied'] as const).map((out) => (
            <button
              key={out}
              onClick={() => setOutcomeFilter(out)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                outcomeFilter === out
                  ? 'bg-primary-600 text-white'
                  : 'bg-ink-950 hover:bg-ink-800 text-mist-400 hover:text-white border border-white/5'
              }`}
            >
              {out === 'ALL' ? 'All' : out}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline / Table */}
      <div className="bg-ink-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-10 w-10 text-mist-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No audit entries found</h4>
            <p className="text-xs text-mist-400 mt-1">Try broadening your search or disabling the finance filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / Actor</th>
                  <th className="py-3 px-4">Financial Action</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Description / Audit Notes</th>
                  <th className="py-3 px-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 text-mist-400 font-mono text-[11px] whitespace-nowrap">
                      {evt.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <User className="h-3 w-3 text-mist-400" />
                        {evt.actor}
                      </div>
                      <div className="text-[10px] text-mist-500">{evt.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {evt.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary-400 font-medium">
                      {evt.resource}
                    </td>
                    <td className="py-3 px-4 text-mist-300 max-w-sm">
                      {evt.details || 'System operation executed.'}
                    </td>
                    <td className="py-3 px-4">
                      {getOutcomeBadge(evt.outcome)}
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
