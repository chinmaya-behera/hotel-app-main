'use client';

import { useState, useMemo } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  FileCheck2,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';
import type { WorkItem } from '@/types/demo';

interface SecurityHistoryTabProps {
  items: WorkItem[];
  onSelectIncident: (item: WorkItem) => void;
}

export function SecurityHistoryTab({ items, onSelectIncident }: SecurityHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter only resolved or historical incidents
  const historyItems = useMemo(() => {
    return items.filter((item) => {
      // Must be resolved
      if (item.status !== 'Resolved') return false;

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = (item.category || '').toLowerCase();
        if (categoryFilter === 'safety' && cat !== 'safety') return false;
        if (categoryFilter === 'maintenance' && cat !== 'maintenance') return false;
        if (categoryFilter === 'concierge' && cat !== 'concierge') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesRef = (item.ref || item.id).toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesReport = item.securityReport?.summary.toLowerCase().includes(query);
        return matchesTitle || matchesRef || matchesDesc || matchesReport;
      }

      return true;
    });
  }, [items, categoryFilter, searchQuery]);

  return (
    <div className="space-y-3.5 pb-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="px-1">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <History className="h-4 w-4 text-emerald-400" />
          <span>Security Resolution Archive</span>
        </h2>
        <p className="text-[11px] text-mist-400">
          Permanent read-only incident logs and filed officer reports
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resolved cases & reports..."
          className="w-full rounded-2xl bg-ink-900 border border-white/10 pl-10 pr-9 py-2.5 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
            categoryFilter === 'all'
              ? 'bg-emerald-500 text-ink-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          All Archived ({items.filter((i) => i.status === 'Resolved').length})
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('safety')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
            categoryFilter === 'safety'
              ? 'bg-emerald-500 text-ink-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Life Safety & Alarms
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('concierge')}
          className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
            categoryFilter === 'concierge'
              ? 'bg-emerald-500 text-ink-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Disturbances & Quiet Hours
        </button>
      </div>

      {/* History Items List */}
      {historyItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-ink-900/60 border border-white/10 text-center space-y-2">
          <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-semibold text-white">No historical records match</p>
          <p className="text-[11px] text-mist-400">
            Resolved security cases with filed reports will appear in this permanent archive.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectIncident(item)}
              className="p-3.5 rounded-2xl bg-ink-900 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-xs space-y-2.5 shadow-lg shadow-black/20 cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] font-bold text-mist-300">
                    {item.ref || item.id}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    Secured
                  </span>
                </div>

                <span className="text-[10px] text-mist-500 font-mono">
                  {item.createdAt || 'Archive'}
                </span>
              </div>

              {/* Title & Location */}
              <div>
                <h3 className="font-bold text-white text-xs hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-mist-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="h-3 w-3 text-mist-500 shrink-0" />
                  <span>{item.location || 'Hotel Property'}</span>
                </p>
              </div>

              {/* Resolution Summary Preview */}
              {item.securityReport ? (
                <div className="p-2.5 rounded-xl bg-ink-950/80 border border-emerald-500/20 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-emerald-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <FileCheck2 className="h-3 w-3" /> Report Filed
                    </span>
                    <span className="text-[10px] text-mist-400">{item.securityReport.filedAt || 'Confirmed'}</span>
                  </div>
                  <p className="text-mist-200 line-clamp-2">
                    {item.securityReport.summary}
                  </p>
                  <p className="text-[10px] text-emerald-400/90 font-medium">
                    Outcome: {item.securityReport.outcome}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-mist-400 italic bg-ink-950/50 p-2 rounded-xl">
                  {item.description}
                </p>
              )}

              {/* Read-Only Badge & View Details */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-mist-500 text-[10px] font-mono">Immutable Log</span>
                <span className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5">
                  <span>View Case File</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
