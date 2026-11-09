'use client';

import {
  X,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Link2,
  FileText,
  Camera,
  History,
  Send,
  UserCheck,
  Sparkles,
  Star,
  Play,
  Check,
  RotateCcw,
} from 'lucide-react';
import type { WorkItem } from '@/types/demo';

interface TaskDetailsDrawerProps {
  task: WorkItem;
  onClose: () => void;
  onOpenAssign: () => void;
  onOpenDuplicate: () => void;
  onOpenEscalate: () => void;
  onAutoAssign: () => void;
  onUpdateStatus?: (status: string) => void;
  onUpdatePriority?: (priority: string) => void;
}

export function TaskDetailsDrawer({
  task,
  onClose,
  onOpenAssign,
  onOpenDuplicate,
  onOpenEscalate,
  onAutoAssign,
  onUpdateStatus,
  onUpdatePriority,
}: TaskDetailsDrawerProps) {
  const isOverdue =
    task.ackStatus === 'overdue' ||
    task.chip?.toLowerCase().includes('overdue') ||
    task.slaDue?.toLowerCase().includes('overdue');

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-task-title"
    >
      <div className="relative w-full max-w-xl h-full border-l border-white/10 bg-ink-900/98 p-6 shadow-2xl backdrop-blur-2xl text-white overflow-y-auto flex flex-col justify-between custom-scrollbar">
        {/* Top Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-300">
                  {task.ref || task.id}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    task.priority === 'critical' || task.priority === 'safety'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : task.priority === 'urgent'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : task.priority === 'vip'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/10 text-mist-300'
                  }`}
                >
                  {task.priority || 'Normal'} Priority
                </span>
                {task.isLinkedDuplicate && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Duplicate
                  </span>
                )}
              </div>
              <h2 id="drawer-task-title" className="text-xl font-bold font-display text-white">
                {task.title}
              </h2>
              <p className="text-xs text-mist-400">{task.meta}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
              aria-label="Close task details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-mist-500">Department</span>
              <p className="font-semibold text-white truncate">{task.department || 'General'}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-mist-500">Location</span>
              <p className="font-semibold text-white flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-amber-300" />
                {task.room ? `Room ${task.room}` : 'Property'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-mist-500">Status</span>
              <p className="font-semibold text-amber-300 truncate">{task.status}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-mist-500">Created At</span>
              <p className="font-semibold text-mist-200 font-mono truncate">{task.createdAt || 'Today'}</p>
            </div>
          </div>

          {/* Guest Review & Rating Feedback (Prominent on view details) */}
          {task.feedback && (
            <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-500/[0.12] to-amber-950/30 p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  Guest Review & Rating
                </span>
                <span className="text-sm font-mono font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                  {task.feedback.rating}.0 / 5.0
                </span>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= task.feedback!.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-mist-600'
                    }`}
                  />
                ))}
              </div>

              {task.feedback.comment && (
                <p className="text-xs text-mist-100 italic leading-relaxed bg-ink-950/60 p-3 rounded-xl border border-white/[0.06]">
                  &ldquo;{task.feedback.comment}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-mist-400 pt-1">
                <span className="font-semibold text-white">
                  {task.feedback.guestName || (task.guest ? 'Verified In-House Guest' : 'Guest')}
                </span>
                {task.feedback.reviewedAt && (
                  <span className="font-mono text-[10px]">
                    Reviewed at {task.feedback.reviewedAt}
                  </span>
                )}
              </div>

              {task.feedback.tags && task.feedback.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-400/20">
                  {task.feedback.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-400/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unreviewed status for completed tasks */}
          {task.status === 'Completed' && !task.feedback && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 flex items-center justify-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-mist-500" />
                Guest Review & Rating Status
              </span>
              <p className="text-xs text-mist-300">
                Awaiting guest post-service review. Task was verified and fulfilled by internal department staff.
              </p>
            </div>
          )}

          {/* Dual SLA Section */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-300" />
                Dual SLA Management
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Breach Detected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-mist-400">
                  <span>Acknowledgment SLA</span>
                  <span className="font-mono text-white">{task.ackSlaDue || '5 mins'}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      task.ackStatus === 'overdue'
                        ? 'bg-rose-400 animate-pulse'
                        : task.status !== 'Unassigned'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-xs font-semibold capitalize">
                    {task.ackStatus || (task.status !== 'Unassigned' ? 'Acknowledged' : 'Pending')}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-mist-400">
                  <span>Resolution SLA</span>
                  <span className="font-mono text-white">{task.slaDue || '30 mins'}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      task.status === 'Completed' ? 'bg-emerald-400' : isOverdue ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-xs font-semibold">
                    {task.status === 'Completed' ? 'Resolved On-Time' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Personnel Info */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 block">
              Assigned Field Attendant
            </span>
            {task.assignee ? (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-400 text-ink-950 font-bold flex items-center justify-center text-xs">
                    {task.assignee
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{task.assignee}</p>
                    <p className="text-mist-400 text-[11px]">
                      {task.assigneeId ? `ID: ${task.assigneeId} · ` : ''}
                      {task.assignedAt ? `Assigned at ${task.assignedAt}` : ''}
                    </p>
                  </div>
                </div>
                {task.autoAssigned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Auto-Dispatched
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 text-rose-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Unassigned — Awaiting Dispatcher Action</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAssign}
                  className="px-3 py-1 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
                >
                  Assign Now
                </button>
              </div>
            )}
          </div>

          {/* Description / Instructions */}
          {(task.description || task.meta) && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-300" />
                Work Order Details / Guest Remarks
              </span>
              <p className="text-xs text-mist-200 leading-relaxed bg-ink-950/40 p-3 rounded-xl border border-white/[0.04]">
                {task.description || task.meta}</p>
            </div>
          )}

          {/* Attached Photo Evidence */}
          {task.photoUrl && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                Attached Completion Evidence
              </span>
              <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={task.photoUrl}
                  alt="Task completion evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Chronological Event History */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-sky-400" />
              Event Timeline & State Transitions
            </span>
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08] pl-2">
              {(task.history && task.history.length > 0
                ? task.history
                : [{ at: task.createdAt || '09:00', status: task.status }]
              ).map((h, idx) => (
                <div key={idx} className="relative pl-6 space-y-0.5 text-xs">
                  <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-4 ring-ink-900" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{h.status}</span>
                    <span className="text-[10px] font-mono text-mist-400">· {h.at}</span>
                  </div>
                  {h.note && <p className="text-[11px] text-mist-400 italic">{h.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="border-t border-white/[0.08] pt-4 mt-6 space-y-2">
          {task.status === 'Completed' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Close Task Details</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {task.status === 'Unassigned' && (
                <>
                  <button
                    type="button"
                    onClick={onAutoAssign}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>1-Click Auto Assign</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAssign}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.08] transition"
                  >
                    <UserCheck className="h-4 w-4 text-amber-300" />
                    <span>Manual Assign</span>
                  </button>
                </>
              )}

              {/* Status Update Quick Buttons */}
              {onUpdateStatus && task.status !== 'Completed' && task.status !== 'In progress' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus('In progress')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Start Task</span>
                </button>
              )}

              {onUpdateStatus && task.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus('Completed')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Mark Done</span>
                </button>
              )}

              {task.status !== 'Unassigned' && (
                <button
                  type="button"
                  onClick={onOpenAssign}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5 text-amber-300" />
                  <span>Reassign</span>
                </button>
              )}

              {!task.isLinkedDuplicate && (
                <button
                  type="button"
                  onClick={onOpenDuplicate}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
                >
                  <Link2 className="h-4 w-4 text-sky-400" />
                  <span>Link Duplicate</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenEscalate}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <Send className="h-4 w-4 text-rose-400" />
                <span>Escalate to Duty Mgr</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
