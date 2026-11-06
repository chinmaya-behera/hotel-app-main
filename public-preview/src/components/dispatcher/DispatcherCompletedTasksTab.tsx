'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  CheckCircle2,
  MapPin,
  User,
  Sparkles,
  MessageSquare,
  Eye,
  Table as TableIcon,
  LayoutGrid,
  X,
  Award,
  FileText,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import type { WorkItem, DispatcherDepartment } from '@/types/demo';

interface DispatcherCompletedTasksTabProps {
  tasks: WorkItem[];
  activeDept?: DispatcherDepartment;
  onOpenDetails?: (task: WorkItem) => void;
}

export function DispatcherCompletedTasksTab({
  tasks,
  activeDept,
}: DispatcherCompletedTasksTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'review_and_rating'>('all');
  const [ratingSubFilter, setRatingSubFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedTaskForDialog, setSelectedTaskForDialog] = useState<WorkItem | null>(null);

  // Close dialog on Escape key and handle body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTaskForDialog(null);
      }
    };
    if (selectedTaskForDialog) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedTaskForDialog]);

  // Completed tasks strictly
  const completedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const status = (t.status || '').toLowerCase();
      return status === 'completed' || status === 'delivered' || status === 'resolved';
    });
  }, [tasks]);

  // Review statistics
  const stats = useMemo(() => {
    const total = completedTasks.length;
    const reviewed = completedTasks.filter((t) => Boolean(t.feedback?.rating));
    const ratings = reviewed.map((t) => t.feedback!.rating);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '5.0';
    const fiveStars = completedTasks.filter((t) => t.feedback?.rating === 5).length;
    const fourStars = completedTasks.filter((t) => t.feedback?.rating === 4).length;
    const reviewRate = total > 0 ? Math.round((reviewed.length / total) * 100) : 0;

    return {
      total,
      reviewedCount: reviewed.length,
      avgRating,
      fiveStars,
      fourStars,
      reviewRate,
    };
  }, [completedTasks]);

  // Filtered completed tasks
  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter((t) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchRef = (t.ref || '').toLowerCase().includes(q);
        const matchRoom = (t.room || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchReview = (t.feedback?.comment || '').toLowerCase().includes(q);
        const matchGuest = (t.feedback?.guestName || '').toLowerCase().includes(q);

        if (!matchTitle && !matchRef && !matchRoom && !matchAssignee && !matchDesc && !matchReview && !matchGuest) {
          return false;
        }
      }

      // Review and Rating filter
      if (filterMode === 'review_and_rating') {
        const hasFeedback = Boolean(t.feedback?.rating) || Boolean(t.feedback?.comment);
        if (!hasFeedback) return false;

        if (ratingSubFilter !== 'all' && t.feedback?.rating !== Number(ratingSubFilter)) {
          return false;
        }
      }

      // Floor filter
      if (selectedFloor !== 'all') {
        const tFloor = t.floor ? String(t.floor) : t.room ? t.room[0] : '';
        if (tFloor !== selectedFloor) return false;
      }

      return true;
    });
  }, [completedTasks, searchQuery, filterMode, ratingSubFilter, selectedFloor]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterMode('all');
    setRatingSubFilter('all');
    setSelectedFloor('all');
  };

  const hasActiveFilters = searchQuery !== '' || filterMode !== 'all' || ratingSubFilter !== 'all' || selectedFloor !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Summary */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-xl font-bold font-display text-white">
                Completed Tasks & Audit Log
              </h2>
              {activeDept && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {activeDept}
                </span>
              )}
            </div>
            <p className="text-xs text-mist-300 mt-1">
              Audit log of fulfilled room orders and turnarounds. Front of the card displays operational details; click View Details to inspect guest review and ratings along with complete task specifications.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-2xl border border-white/10 bg-ink-950/60 p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'cards' ? 'bg-amber-400 text-ink-950 font-bold shadow' : 'text-mist-400 hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-amber-400 text-ink-950 font-bold shadow' : 'text-mist-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Completed Tasks</span>
            </p>
            <p className="text-xl font-bold font-mono text-white mt-1">{stats.total}</p>
            <p className="text-[11px] text-emerald-400 font-medium">100% Resolved in department</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 space-y-1">
            <p className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Average Guest Rating</span>
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-amber-300">{stats.avgRating}</span>
              <span className="text-xs text-amber-400/80">/ 5.0</span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium">{stats.fiveStars} perfect 5-star ratings</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
              <span>Guest Review Rate</span>
            </p>
            <p className="text-xl font-bold font-mono text-white mt-1">{stats.reviewRate}%</p>
            <p className="text-[11px] text-sky-300 font-medium">{stats.reviewedCount} of {stats.total} guests reviewed</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-purple-400" />
              <span>Top Attendant CSAT</span>
            </p>
            <p className="text-base font-bold text-white mt-1 truncate">
              {completedTasks[0]?.assignee || 'Field Team'}
            </p>
            <p className="text-[11px] text-purple-300 font-medium">High satisfaction rate</p>
          </div>
        </div>
      </div>

      {/* Filter and Navbar Bar */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4 backdrop-blur-md shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ref, room, attendant, or task title..."
              className="w-full rounded-2xl border border-white/10 bg-ink-950/60 pl-10 pr-4 py-2 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Navbar: All Completed vs Review and Rating */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => {
                setFilterMode('all');
                setRatingSubFilter('all');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterMode === 'all' && ratingSubFilter === 'all'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>All Completed ({completedTasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('review_and_rating')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterMode === 'review_and_rating'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Review and Rating ({stats.reviewedCount})</span>
            </button>

            {/* When Review & Rating is selected, allow refining by Rating */}
            {filterMode === 'review_and_rating' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 shrink-0">
                <span className="text-[11px] font-semibold text-mist-400">Rating:</span>
                <select
                  value={ratingSubFilter}
                  onChange={(e) => setRatingSubFilter(e.target.value as 'all' | '5' | '4' | '3')}
                  className="rounded-xl border border-white/10 bg-ink-950/80 px-2.5 py-1 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">All ({stats.reviewedCount})</option>
                  <option value="5">5 Stars ({stats.fiveStars})</option>
                  <option value="4">4 Stars ({stats.fourStars})</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Floor Filter Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-mist-400 uppercase tracking-wider shrink-0">
              Floor:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedFloor('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedFloor === 'all'
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-mist-400 hover:text-white'
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4, 5].map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setSelectedFloor(String(fl))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedFloor === String(fl)
                      ? 'bg-amber-400 text-ink-950 font-bold'
                      : 'text-mist-400 hover:text-white'
                  }`}
                >
                  Floor {fl}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-amber-300 hover:text-amber-200 underline shrink-0 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCompletedTasks.map((task) => {
            return (
              <div
                key={task.id}
                className="group rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4 transition-all duration-200 min-w-0 overflow-hidden hover:border-white/20"
              >
                {/* Front of the Card: Essential Operational Details Only */}
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                          {task.ref || task.id}
                        </span>
                        {task.room && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/[0.06] text-mist-200 border border-white/10 shrink-0 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-amber-300" />
                            Room {task.room}
                          </span>
                        )}
                        {task.priority && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                              task.priority === 'urgent' || task.priority === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'vip'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-white/[0.06] text-mist-300 border border-white/10'
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>

                      {/* Task Title */}
                      <h3
                        className="text-sm font-bold text-white mt-2 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors"
                        title={task.title}
                      >
                        {task.title}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>Completed</span>
                      </span>
                      {task.chip && (
                        <span className="text-[10px] font-mono text-mist-400 shrink-0 truncate max-w-[120px]">
                          {task.chip}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendant & Execution Strip (Front of the card) */}
                  <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-2 text-xs min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-7 w-7 rounded-lg bg-amber-400 text-ink-950 font-bold text-xs flex items-center justify-center shrink-0">
                        {(task.assignee || 'Attendant')[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate text-xs">
                          {task.assignee || 'Assigned Staff'}
                        </p>
                        <p className="text-[10px] text-mist-400 truncate">
                          {task.assigneeId ? `${task.assigneeId} · ` : ''}
                          Resolved {task.assignedAt ? `from ${task.assignedAt}` : 'Today'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {task.slaDue ? `SLA: ${task.slaDue}` : 'On-Time'}
                      </span>
                    </div>
                  </div>

                  {/* Department Tag */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-[11px] font-semibold text-mist-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-mist-500" />
                      <span>{task.department || activeDept || 'Department'}</span>
                    </span>
                  </div>
                </div>

                {/* Footer Action: Details shown only upon clicking View Details button */}
                <div className="pt-2.5 border-t border-white/[0.06] mt-auto flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskForDialog(task)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/[0.04] text-mist-200 hover:text-ink-950 hover:bg-amber-400 hover:font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-300 group-hover:text-ink-950" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredCompletedTasks.length === 0 && (
            <div className="col-span-full py-16 px-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 text-mist-400 mx-auto grid place-items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">No completed tasks match your criteria</h3>
              <p className="text-xs text-mist-400 max-w-sm mx-auto">
                No completed work orders found for the active rating or floor filter. Try resetting filters to see all completed tasks.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-3xl border border-white/10 bg-ink-900/80 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-mist-300">
              <thead className="border-b border-white/10 bg-ink-950/70 text-[11px] uppercase tracking-wider text-mist-400">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 font-semibold">Ref & Room</th>
                  <th className="py-3.5 px-3 font-semibold">Task Title</th>
                  <th className="py-3.5 px-3 font-semibold">Attendant</th>
                  <th className="py-3.5 px-3 font-semibold">Completed Time</th>
                  <th className="py-3.5 px-3 font-semibold">Status</th>
                  <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredCompletedTasks.map((task) => {
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="font-mono font-bold text-amber-300 text-xs">
                          {task.ref || task.id}
                        </div>
                        <div className="text-[11px] text-mist-400 flex items-center gap-1 mt-0.5">
                          {task.room ? `Room ${task.room}` : 'General'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="font-semibold text-white truncate" title={task.title}>
                          {task.title}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{task.assignee || 'Field Team'}</div>
                        <div className="text-[10px] text-mist-400">{task.assigneeId || 'Verified'}</div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{task.chip || 'Resolved'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-mist-400 mt-0.5">
                          {task.assignedAt ? `Started ${task.assignedAt}` : 'Today'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-[11px] text-mist-400">
                          Completed
                        </span>
                      </td>

                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForDialog(task)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:bg-amber-400 hover:text-ink-950 transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCompletedTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-mist-400">
                      No completed tasks found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Task Details Dialog Modal */}
      {selectedTaskForDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedTaskForDialog(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-ink-900 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/10 bg-ink-950/60">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/25">
                    {selectedTaskForDialog.ref || selectedTaskForDialog.id}
                  </span>
                  {selectedTaskForDialog.room && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white/[0.06] text-mist-200 border border-white/10 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-300" />
                      Room {selectedTaskForDialog.room}
                    </span>
                  )}
                  {selectedTaskForDialog.floor && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-mist-400">
                      Floor {selectedTaskForDialog.floor}
                    </span>
                  )}
                  {selectedTaskForDialog.priority && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        selectedTaskForDialog.priority === 'urgent' || selectedTaskForDialog.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : selectedTaskForDialog.priority === 'vip'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-white/[0.06] text-mist-300 border border-white/10'
                      }`}
                    >
                      {selectedTaskForDialog.priority}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Completed</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white leading-snug">
                  {selectedTaskForDialog.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTaskForDialog(null)}
                className="h-8 w-8 rounded-xl border border-white/10 bg-white/[0.04] text-mist-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition shrink-0 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dialog Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* 1. Review and Ratings Section */}
              {selectedTaskForDialog.feedback?.rating ? (
                <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.12] to-amber-950/20 p-4 sm:p-5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4.5 w-4.5 ${
                            star <= (selectedTaskForDialog.feedback?.rating || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-mist-600 fill-transparent'
                          }`}
                        />
                      ))}
                      <span className="text-sm font-bold font-mono text-amber-300 ml-1.5">
                        {selectedTaskForDialog.feedback.rating}.0 / 5.0
                      </span>
                    </div>

                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 shrink-0">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Guest Review & Rating</span>
                    </span>
                  </div>

                  {selectedTaskForDialog.feedback.comment && (
                    <p className="text-xs sm:text-sm text-mist-100 italic leading-relaxed bg-ink-950/70 p-3.5 rounded-xl border border-white/[0.06]">
                      &ldquo;{selectedTaskForDialog.feedback.comment}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 text-xs text-mist-400 pt-1">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-300" />
                      {selectedTaskForDialog.feedback.guestName || (selectedTaskForDialog.guest ? 'Verified In-House Guest' : 'In-House Guest')}
                    </span>
                    {selectedTaskForDialog.feedback.reviewedAt && (
                      <span className="text-[11px] font-mono text-mist-400">
                        Submitted at {selectedTaskForDialog.feedback.reviewedAt}
                      </span>
                    )}
                  </div>

                  {selectedTaskForDialog.feedback.tags && selectedTaskForDialog.feedback.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-400/15">
                      {selectedTaskForDialog.feedback.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-400/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center space-y-1.5">
                  <p className="text-xs text-mist-300 flex items-center justify-center gap-2 font-medium">
                    <MessageSquare className="h-4 w-4 text-mist-500" />
                    <span>No guest review submitted yet</span>
                  </p>
                  <p className="text-[11px] text-mist-500 max-w-sm mx-auto">
                    Work order completed on schedule and verified internally by the assigned department fulfiller.
                  </p>
                </div>
              )}

              {/* 2. Operational Details & Work Order Scope */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <span className="text-[11px] uppercase font-bold text-mist-400 tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-300" />
                  <span>Work Order Scope & Operational Details</span>
                </span>

                {(selectedTaskForDialog.description || selectedTaskForDialog.meta) && (
                  <p className="text-xs text-mist-200 leading-relaxed bg-ink-950/50 p-3 rounded-xl border border-white/[0.04]">
                    {selectedTaskForDialog.description || selectedTaskForDialog.meta}
                  </p>
                )}

                {/* Attendant & Assignment Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-ink-950/40 border border-white/[0.04] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-mist-500 block">Fulfilled By</span>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-400 text-ink-950 font-bold text-xs flex items-center justify-center shrink-0">
                        {(selectedTaskForDialog.assignee || 'Attendant')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {selectedTaskForDialog.assignee || 'Field Team'}
                        </p>
                        <p className="text-[10px] text-mist-400 truncate">
                          {selectedTaskForDialog.assigneeId || 'Verified Staff'} · Resolved
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-ink-950/40 border border-white/[0.04] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-mist-500 block">Department & SLA</span>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-mist-400" />
                      <span>{selectedTaskForDialog.department || activeDept || 'Department'}</span>
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      Target SLA: {selectedTaskForDialog.slaDue || 'Resolved On-Time'}
                    </p>
                  </div>
                </div>

                {/* Timing Metrics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <span className="text-mist-500 block text-[9px] uppercase font-bold">Created At</span>
                    <span className="font-mono text-white text-xs">{selectedTaskForDialog.createdAt || '08:00'}</span>
                  </div>
                  <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <span className="text-mist-500 block text-[9px] uppercase font-bold">Assigned At</span>
                    <span className="font-mono text-white text-xs">{selectedTaskForDialog.assignedAt || 'Today'}</span>
                  </div>
                  <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <span className="text-mist-500 block text-[9px] uppercase font-bold">Duration / Time</span>
                    <span className="font-mono text-emerald-400 text-xs">{selectedTaskForDialog.chip || 'Fulfilled'}</span>
                  </div>
                </div>

                {/* Execution History */}
                {selectedTaskForDialog.history && selectedTaskForDialog.history.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-mist-400 block tracking-wider">
                      Execution Audit Trail
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedTaskForDialog.history.map((h, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-ink-950/40 border border-white/[0.04]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="font-semibold text-white capitalize">{h.status}</span>
                            {h.note && (
                              <span className="text-mist-400 truncate text-[11px]">- {h.note}</span>
                            )}
                          </div>
                          <span className="font-mono text-mist-400 text-[10px] shrink-0 ml-2">{h.at}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
