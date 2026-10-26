'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, statusTone } from '@/lib/utils';
import type { WorkItem } from '@/types/demo';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';

const BLOCKER_REASONS = [
  'Guest requested privacy (Do Not Disturb)',
  'Room locked / no answer',
  'Awaiting fresh linen or minibar stock',
  'Technical / plumbing issue requires Engineering',
  'Physical safety hazard inside room',
];

const REASSIGN_REASONS = [
  'Assigned room is currently DND / guest sleeping',
  'Urgent spill / turnover needed on another floor',
  'Missing cleaning equipment / chemical supplies',
  'Shift schedule ending / shift handover required',
  'Language / guest communication barrier',
];

export function FulfillerTasksTab() {
  const { state, advance, attachTaskPhoto, requestTaskReassignment } = useDemo();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [blockerModalTask, setBlockerModalTask] = useState<WorkItem | null>(null);
  const [reassignModalTask, setReassignModalTask] = useState<WorkItem | null>(null);
  const [blockerReason, setBlockerReason] = useState(BLOCKER_REASONS[0]);
  const [reassignReason, setReassignReason] = useState(REASSIGN_REASONS[0]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasks = state.items.task_fulfiller ?? [];

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return task.status !== 'Completed';
    if (filter === 'pending') return task.status === 'Assigned';
    if (filter === 'in_progress')
      return task.status === 'Accepted' || task.status === 'In progress' || task.status === 'On the way' || task.status === 'Blocked';
    if (filter === 'completed') return task.status === 'Completed';
    if (filter === 'overdue')
      return (
        task.status !== 'Completed' &&
        (task.chip?.toLowerCase().includes('overdue') || task.slaDue?.toLowerCase().includes('overdue') || task.tone === 'danger')
      );
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'Assigned').length;
  const inProgressCount = tasks.filter(
    (t) => t.status === 'Accepted' || t.status === 'In progress' || t.status === 'On the way' || t.status === 'Blocked',
  ).length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'Completed' && (t.chip?.toLowerCase().includes('overdue') || t.tone === 'danger'),
  ).length;

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>, task: WorkItem) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        attachTaskPhoto('task_fulfiller', task.id, dataUrl);
        // Update local modal state if open
        if (selectedTask?.id === task.id) {
          setSelectedTask({ ...selectedTask, photoUrl: dataUrl, photoAttached: true });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function handleComplete(task: WorkItem) {
    if (task.evidenceRequired && !task.photoUrl && !task.photoAttached) {
      setPhotoError('Completion evidence is mandatory for this task. Please attach a photo before completing.');
      setSelectedTask(task);
      return;
    }

    advance('task_fulfiller', task.id, {
      label: 'Complete',
      next: 'Completed',
      message: 'Task completed',
    });

    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    }
  }

  function handleBlockerSubmit() {
    if (!blockerModalTask) return;
    advance(
      'task_fulfiller',
      blockerModalTask.id,
      {
        label: 'Report blocker',
        next: 'Blocked',
        message: 'Blocker recorded',
        variant: 'danger',
      },
      blockerReason,
    );
    setBlockerModalTask(null);
    if (selectedTask?.id === blockerModalTask.id) {
      setSelectedTask(null);
    }
  }

  function handleReassignSubmit() {
    if (!reassignModalTask) return;
    requestTaskReassignment(reassignModalTask.id, reassignReason);
    setReassignModalTask(null);
    if (selectedTask?.id === reassignModalTask.id) {
      setSelectedTask(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Hidden File Input for Mobile Camera / Gallery Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => selectedTask && handlePhotoUpload(e, selectedTask)}
      />

      {/* Filter Tabs */}
      <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            filter === 'all'
              ? 'bg-emerald-500 text-ink-950 shadow-md shadow-emerald-500/25'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Active Tasks
          <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
            {tasks.filter((t) => t.status !== 'Completed').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            filter === 'pending'
              ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/25'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Pending
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-200">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('in_progress')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            filter === 'in_progress'
              ? 'bg-sky-400 text-ink-950 shadow-md shadow-sky-400/25'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          In Progress
          {inProgressCount > 0 && (
            <span className="rounded-full bg-sky-500/30 px-1.5 py-0.2 text-[10px] font-bold text-sky-200">
              {inProgressCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('overdue')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            filter === 'overdue'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Overdue
          {overdueCount > 0 && (
            <span className="rounded-full bg-rose-500/40 px-1.5 py-0.2 text-[10px] font-bold text-white">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            filter === 'completed'
              ? 'bg-emerald-400 text-ink-950 shadow-md shadow-emerald-400/25'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Completed
          <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
            {tasks.filter((t) => t.status === 'Completed').length}
          </span>
        </button>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] py-12 px-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-mist-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">All clear in this view</p>
            <p className="mt-1 text-xs text-mist-400 max-w-xs">
              No tasks currently matching the selected filter. Switch filters or wait for upcoming assignments.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isAssigned = task.status === 'Assigned';
            const isAccepted = task.status === 'Accepted';
            const isInProgress = task.status === 'In progress' || task.status === 'On the way';
            const isBlocked = task.status === 'Blocked';
            const isCompleted = task.status === 'Completed';
            const isReassignPending = task.status === 'Reassignment requested' || task.reassignPending;

            return (
              <div
                key={task.id}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-4 transition-all',
                  isCompleted
                    ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                    : isBlocked
                      ? 'border-rose-500/30 bg-rose-500/[0.05]'
                      : isReassignPending
                        ? 'border-amber-400/30 bg-amber-400/[0.04]'
                        : task.priority === 'vip'
                          ? 'border-amber-400/30 bg-amber-400/[0.03]'
                          : task.priority === 'urgent'
                            ? 'border-orange-400/30 bg-orange-400/[0.03]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                )}
              >
                {/* Header row: Location & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold text-white shrink-0">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      {task.room ? `Room ${task.room}` : task.location ?? 'Floor 4'}
                    </span>

                    {task.priority === 'vip' && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 shrink-0">
                        <Crown className="h-2.5 w-2.5" /> VIP
                      </span>
                    )}

                    {task.priority === 'urgent' && (
                      <span className="flex items-center gap-1 rounded-md bg-orange-400/20 px-2 py-0.5 text-[10px] font-bold text-orange-200 shrink-0">
                        <AlertCircle className="h-2.5 w-2.5" /> Urgent
                      </span>
                    )}

                    {task.guest && (
                      <span className="rounded-md bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200 shrink-0">
                        Guest Portal
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isCompleted
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : isBlocked
                          ? 'bg-rose-500/20 text-rose-300'
                          : isReassignPending
                            ? 'bg-amber-400/20 text-amber-200'
                            : isInProgress
                              ? 'bg-sky-400/20 text-sky-300'
                              : 'bg-white/10 text-mist-300',
                    )}
                  >
                    {task.status}
                  </span>
                </div>

                {/* Title & Metadata */}
                <div className="mt-2.5 cursor-pointer" onClick={() => setSelectedTask(task)}>
                  <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {task.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-mist-300 line-clamp-1">{task.meta}</p>
                </div>

                {/* SLA, Photo Requirement & Details strip */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-2.5 text-xs text-mist-400">
                  {task.slaDue && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-mist-400" />
                      {task.slaDue}
                    </span>
                  )}

                  {task.evidenceRequired && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-medium',
                        task.photoUrl ? 'text-emerald-400' : 'text-amber-300',
                      )}
                    >
                      <Camera className="h-3 w-3" />
                      {task.photoUrl ? 'Photo attached' : 'Photo required'}
                    </span>
                  )}

                  {task.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-1 text-[11px] text-emerald-300 underline hover:text-emerald-200"
                    >
                      <ImageIcon className="h-3 w-3" /> Preview
                    </button>
                  )}

                  {task.reassignPending && (
                    <span className="text-[11px] text-amber-300 font-medium">
                      Supervisor review pending ({task.reassignReason})
                    </span>
                  )}
                </div>

                {/* Mobile Touch-Friendly Action Buttons */}
                {!isCompleted && !isReassignPending && (
                  <div className="mt-3 flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                    {isAssigned && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Accept',
                              next: 'Accepted',
                              message: 'Task accepted',
                            })
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          Accept Task
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-mist-300 hover:text-white transition-colors"
                        >
                          Reassign
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Start work',
                              next: 'In progress',
                              message: 'Work started',
                            })
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-transform"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start Work
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-mist-300 hover:text-white transition-colors"
                        >
                          Reassign
                        </button>
                      </>
                    )}

                    {isInProgress && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleComplete(task)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Completed
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTask(task);
                            fileInputRef.current?.click();
                          }}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1',
                            task.photoUrl
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
                          )}
                          title="Attach completion evidence photo"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          {task.photoUrl ? 'Photo ✓' : 'Photo'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlockerModalTask(task)}
                          className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          Blocker
                        </button>
                      </>
                    )}

                    {isBlocked && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Resume',
                              next: 'In progress',
                              message: 'Blocker cleared, work resumed',
                            })
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md active:scale-[0.98] transition-transform"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Resume Work
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-mist-300 hover:text-white transition-colors"
                        >
                          Request Reassign
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/15 bg-ink-900 p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    {selectedTask.room ? `Room ${selectedTask.room}` : 'Location'}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-mist-300">
                    {selectedTask.status}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-white">{selectedTask.title}</h3>
                <p className="text-xs text-mist-300 mt-0.5">{selectedTask.meta}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  setPhotoError(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Description */}
              {selectedTask.description && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <h4 className="font-semibold text-mist-200 mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" /> Instructions & Notes
                  </h4>
                  <p className="text-mist-300 leading-relaxed">{selectedTask.description}</p>
                </div>
              )}

              {/* Order Lines if Room Service */}
              {selectedTask.orderLines && selectedTask.orderLines.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <h4 className="font-semibold text-mist-200 mb-2">Order Items:</h4>
                  <ul className="space-y-1.5 text-mist-300">
                    {selectedTask.orderLines.map((line) => (
                      <li key={line.itemId} className="flex justify-between items-center">
                        <span>
                          {line.qty}× {line.name}
                        </span>
                        <span className="text-mist-400">₹{line.price * line.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Photo Evidence Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-mist-200 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-emerald-400" /> Completion Evidence Photo
                  </h4>
                  {selectedTask.evidenceRequired && (
                    <span className="text-[10px] text-amber-300 font-bold">Mandatory</span>
                  )}
                </div>

                {photoError && (
                  <p className="mt-2 text-rose-400 text-xs bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    {photoError}
                  </p>
                )}

                {selectedTask.photoUrl ? (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-white/20 aspect-video bg-black/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTask.photoUrl}
                      alt="Task completion evidence preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex justify-between items-center">
                      <span className="text-[10px] text-emerald-300 font-semibold">Evidence attached (local demo preview)</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-white/20 px-2 py-1 text-[10px] text-white hover:bg-white/30"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 px-3 text-xs font-semibold text-mist-300 hover:border-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/[0.04] transition-all"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo / Attach Evidence
                    </button>
                    <p className="mt-1 text-center text-[10px] text-mist-500">
                      Files are previewed in browser memory via data-URL and not uploaded to external servers.
                    </p>
                  </div>
                )}
              </div>

              {/* Status Timeline History */}
              {selectedTask.history && selectedTask.history.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <h4 className="font-semibold text-mist-200 mb-2">Status Timeline</h4>
                  <ol className="space-y-2 border-l border-white/10 pl-3 ml-1">
                    {selectedTask.history.map((h, i) => (
                      <li key={i} className="relative text-xs">
                        <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-white">{h.status}</span>
                        {h.note && <p className="text-mist-400 text-[11px] mt-0.5">{h.note}</p>}
                        <span className="text-[10px] text-mist-500">{h.at}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  setPhotoError(null);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-mist-200"
              >
                Close
              </button>

              {selectedTask.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => handleComplete(selectedTask)}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-ink-950 shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
                >
                  Complete Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Blocker Modal */}
      {blockerModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-ink-900 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold text-base text-white">Report Task Blocker</h3>
            </div>
            <p className="mt-1 text-xs text-mist-300">
              Select reason for holding work on <strong>{blockerModalTask.title}</strong>:
            </p>

            <div className="mt-3 space-y-2">
              {BLOCKER_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                    blockerReason === reason
                      ? 'border-rose-400/50 bg-rose-500/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                  )}
                >
                  <input
                    type="radio"
                    name="blocker"
                    checked={blockerReason === reason}
                    onChange={() => setBlockerReason(reason)}
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setBlockerModalTask(null)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockerSubmit}
                className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-600"
              >
                Submit Blocker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Reassignment Modal */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-ink-900 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="h-5 w-5" />
              <h3 className="font-bold text-base text-white">Request Task Reassignment</h3>
            </div>
            <p className="mt-1 text-xs text-mist-300">
              This request will be routed to Supervisor <strong>Oliver Reed</strong> for review. The task remains assigned until approved.
            </p>

            <div className="mt-3 space-y-2">
              {REASSIGN_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                    reassignReason === reason
                      ? 'border-amber-400/50 bg-amber-400/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                  )}
                >
                  <input
                    type="radio"
                    name="reassign"
                    checked={reassignReason === reason}
                    onChange={() => setReassignReason(reason)}
                    className="accent-amber-400"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setReassignModalTask(null)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignSubmit}
                className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-ink-950 shadow-md shadow-amber-400/30 hover:bg-amber-300"
              >
                Send Request to Supervisor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
