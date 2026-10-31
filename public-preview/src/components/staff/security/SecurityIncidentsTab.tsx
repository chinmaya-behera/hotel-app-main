'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Compass,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { WorkItem } from '@/types/demo';
import { SecurityFloorPlanModal } from './SecurityFloorPlanModal';

interface SecurityIncidentsTabProps {
  items: WorkItem[];
  onSelectIncident: (item: WorkItem) => void;
}

export function SecurityIncidentsTab({ items, onSelectIncident }: SecurityIncidentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [floorPlanItem, setFloorPlanItem] = useState<WorkItem | null>(null);

  // Status Filter Pills
  const statusOptions = ['All', 'New', 'Acknowledged', 'On scene', 'Backup requested', 'Escalated', 'Resolved'];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== 'All' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Floor filter
      if (floorFilter !== 'all') {
        if (floorFilter === 'ground' && item.floor !== 0 && item.floor !== 1) return false;
        if (floorFilter !== 'ground' && item.floor !== Number(floorFilter)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesRef = (item.ref || item.id).toLowerCase().includes(query);
        const matchesLoc = (item.location || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        return matchesTitle || matchesRef || matchesLoc || matchesDesc;
      }

      return true;
    });
  }, [items, statusFilter, floorFilter, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setFloorFilter('all');
  };

  return (
    <div className="space-y-3.5 pb-6 animate-in fade-in duration-150">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ID, keyword, or room..."
          className="w-full rounded-2xl bg-ink-900 border border-white/10 pl-10 pr-9 py-2.5 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-sky-500"
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

      {/* Horizontal Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt;
          const count =
            opt === 'All'
              ? items.length
              : items.filter((i) => i.status.toLowerCase() === opt.toLowerCase()).length;

          return (
            <button
              key={opt}
              type="button"
              onClick={() => setStatusFilter(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-sky-500 text-ink-950 shadow-md shadow-sky-500/20'
                  : 'bg-ink-900 border border-white/10 text-mist-300 hover:bg-white/10'
              }`}
            >
              <span>{opt}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-ink-950/20 text-ink-950 font-bold' : 'bg-white/10 text-mist-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floor Filter Row */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-[11px] text-mist-400">
          Showing <span className="font-bold text-white">{filteredItems.length}</span> incident
          {filteredItems.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-mist-400">Level:</label>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="rounded-lg bg-ink-900 border border-white/10 px-2 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Floors</option>
            <option value="ground">Ground / Lobby</option>
            <option value="3">Floor 3</option>
            <option value="5">Floor 5</option>
            <option value="0">Basement</option>
          </select>
        </div>
      </div>

      {/* Incidents Cards List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-ink-900/60 border border-white/10 text-center space-y-3">
          <ShieldAlert className="h-8 w-8 text-mist-500 mx-auto" />
          <div>
            <p className="text-xs font-semibold text-white">No incidents match criteria</p>
            <p className="text-[11px] text-mist-400 mt-0.5">
              Try adjusting your search terms or status filters.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isCritical = item.priority === 'critical';
            const isResolved = item.status === 'Resolved';
            const isOnScene = item.status === 'On scene';
            const isAck = item.status === 'Acknowledged';

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-ink-900 border border-white/10 hover:border-white/20 transition-all text-xs space-y-2.5 shadow-lg shadow-black/20"
              >
                {/* Header row: ID, priority pill, status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isCritical
                          ? 'bg-rose-500 animate-pulse'
                          : item.priority === 'urgent'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    />
                    <span className="font-mono text-[11px] font-bold text-mist-300">
                      {item.ref || item.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-white/10 text-mist-400'
                      }`}
                    >
                      {item.priority || 'Normal'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isResolved
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.status === 'Escalated'
                        ? 'bg-rose-500/20 text-rose-300'
                        : item.status === 'Backup requested'
                        ? 'bg-rose-500/20 text-rose-300'
                        : isOnScene
                        ? 'bg-amber-500/20 text-amber-300'
                        : isAck
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {item.chip || item.status}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectIncident(item)}
                  className="font-bold text-white text-xs hover:text-sky-300 transition-colors cursor-pointer"
                >
                  {item.title}
                </h3>

                {/* Location with Floor Plan shortcut */}
                <div className="flex items-center justify-between text-[11px] text-mist-300 bg-ink-950/60 p-2 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{item.location || 'Location on file'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloorPlanItem(item);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 shrink-0 ml-2"
                  >
                    <Compass className="h-3 w-3" />
                    <span>Map</span>
                  </button>
                </div>

                {/* Meta details & Actions */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-mist-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.createdAt || 'Recent'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectIncident(item)}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>View Details</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floor Plan Modal */}
      {floorPlanItem && (
        <SecurityFloorPlanModal
          isOpen={!!floorPlanItem}
          onClose={() => setFloorPlanItem(null)}
          location={floorPlanItem.location || 'Incident zone'}
          floor={floorPlanItem.floor}
          room={floorPlanItem.room}
          title={floorPlanItem.title}
        />
      )}
    </div>
  );
}
