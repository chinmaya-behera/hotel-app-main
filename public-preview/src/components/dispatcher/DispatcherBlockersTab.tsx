'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Flame,
  ArrowRight,
  ShieldAlert,
  Send,
  MessageSquare,
  X,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';

interface DispatcherBlockersTabProps {
  onOpenEscalate?: () => void;
}

export function DispatcherBlockersTab({ onOpenEscalate }: DispatcherBlockersTabProps) {
  const { state, resolveFulfillerBlocker, reviewFulfillerReassignment } = useDemo();

  // All combined department tasks
  const allTasks = [
    ...(state.items.department_dispatcher_supervisor ?? []),
    ...(state.items.department_dispatcher ?? []),
  ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  // Active blockers
  const blockedTasks = allTasks.filter(
    (t) => t.status === 'Blocked' || (t.history && t.history[t.history.length - 1]?.status === 'Blocked'),
  );

  // Pending reassignment requests from fulfillers
  const pendingReassignments = allTasks.filter(
    (t) => t.reassignPending || t.status === 'Reassignment requested',
  );

  // Resolution modal state
  const [resolveTargetTask, setResolveTargetTask] = useState<WorkItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Reassignment decision modal state
  const [reassignTargetTask, setReassignTargetTask] = useState<WorkItem | null>(null);
  const [reassignDecisionMode, setReassignDecisionMode] = useState<'approve' | 'reject'>('approve');
  const [selectedColleagueId, setSelectedColleagueId] = useState('EMP-0104'); // default Priya Sharma
  const [supervisorDecisionNotes, setSupervisorDecisionNotes] = useState('');

  const staffAccounts = (state.staffAccounts ?? []).filter(
    (s) => s.roleId === 'task_fulfiller' || s.department.toLowerCase().includes('house'),
  );

  function handleResolveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolveTargetTask) return;
    resolveFulfillerBlocker(
      resolveTargetTask.id,
      resolutionNote.trim() || 'Blocker addressed and cleared by Supervisor Meera Nambiar',
      'In progress',
    );
    setResolveTargetTask(null);
    setResolutionNote('');
  }

  function handleReassignDecisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reassignTargetTask) return;
    reviewFulfillerReassignment(
      reassignTargetTask.id,
      reassignDecisionMode === 'approve' ? 'reassign' : 'reject',
      reassignDecisionMode === 'approve' ? selectedColleagueId : undefined,
      supervisorDecisionNotes.trim() || (reassignDecisionMode === 'approve' ? 'Approved for workload balance' : 'Attendant retained'),
    );
    setReassignTargetTask(null);
    setSupervisorDecisionNotes('');
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Field Blockers & Reassignment Approvals
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Review attendant impediments, resolve access blocks, and adjudicate task reassignment requests.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="rounded-full px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300">
            {blockedTasks.length} Active Blockers
          </span>
          <span className="rounded-full px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-300">
            {pendingReassignments.length} Reassignment Requests
          </span>
        </div>
      </div>

      {/* SECTION 1: Pending Fulfiller Reassignment Requests (Required Approval Workflow) */}
      <div className="rounded-3xl border border-amber-400/30 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-bold font-display text-white">
              Pending Fulfiller Reassignment Requests ({pendingReassignments.length})
            </h2>
          </div>
          <span className="text-[11px] text-amber-300 font-mono">Supervisor Decision Mandatory</span>
        </div>

        {pendingReassignments.length === 0 ? (
          <div className="py-8 text-center text-mist-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
            <p className="font-semibold text-white text-sm">No pending reassignment requests</p>
            <p className="text-xs text-mist-400">All task assignments are currently active and confirmed with field staff.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReassignments.map((task) => (
              <div
                key={task.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-300">{task.ref}</span>
                    <span className="text-xs font-semibold text-white">
                      {task.room ? `Room ${task.room}` : 'Location'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
                      Reassignment Requested
                    </span>
                    <span className="text-xs text-mist-300">
                      Assignee: <strong>{task.assignee || 'Vikram Singh'}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{task.title}</h3>
                  <p className="text-xs text-amber-200 bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                    <strong>Fulfiller Reason:</strong> {task.reassignReason || 'Fulfiller requested shift balance'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setReassignTargetTask(task);
                      setReassignDecisionMode('approve');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 text-ink-950 text-xs font-bold hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
                  >
                    Approve & Reassign
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReassignTargetTask(task);
                      setReassignDecisionMode('reject');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-300 hover:text-white transition"
                  >
                    Decline Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Active Fulfiller Task Blockers */}
      <div className="rounded-3xl border border-rose-500/30 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h2 className="text-base font-bold font-display text-white">
              Active Task Blockers Reported from Field ({blockedTasks.length})
            </h2>
          </div>
          <span className="text-[11px] text-rose-300 font-mono">Immediate Action Recommended</span>
        </div>

        {blockedTasks.length === 0 ? (
          <div className="py-8 text-center text-mist-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
            <p className="font-semibold text-white text-sm">Zero active task blockers</p>
            <p className="text-xs text-mist-400">All room attendants and engineers are operating with unhindered field access.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-300">{task.ref}</span>
                    <span className="text-xs font-semibold text-white">Room {task.room}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      Work Blocked
                    </span>
                    <span className="text-xs text-mist-400">
                      Reported by: <strong className="text-white">{task.assignee || 'Attendant'}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{task.title}</h3>
                  <p className="text-xs text-rose-200 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    <strong>Reported Blocker:</strong>{' '}
                    {task.blockerReason ||
                      task.history?.find((h) => h.status === 'Blocked')?.note ||
                      'Room access restricted (DND / Locked)'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setResolveTargetTask(task);
                      setResolutionNote('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 text-ink-950 text-xs font-bold hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
                  >
                    Clear Blocker & Resume
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReassignTargetTask(task);
                      setReassignDecisionMode('approve');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-300 hover:text-white transition"
                  >
                    Reassign Task
                  </button>

                  {onOpenEscalate && (
                    <button
                      type="button"
                      onClick={onOpenEscalate}
                      className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/20 text-xs font-bold text-rose-200 hover:bg-rose-500/30 transition flex items-center gap-1"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span>Escalate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESOLVE BLOCKER MODAL */}
      {resolveTargetTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-ink-900 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-bold text-base text-white">Resolve & Clear Blocker</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveTargetTask(null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-mist-300">
              Clearing blocker for <strong>{resolveTargetTask.title}</strong> (Room {resolveTargetTask.room}). The task status will resume to <strong>In progress</strong> and notify the attendant.
            </p>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200">Resolution Action / Note *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified with guest, DND cleared. Attendant safe to service room now."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-950 p-2.5 text-white placeholder-mist-600 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setResolveTargetTask(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-ink-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/25"
                >
                  Confirm & Resume Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGNMENT APPROVAL / REJECTION DECISION MODAL */}
      {reassignTargetTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-ink-900 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <RotateCcw className="h-5 w-5" />
                <h3 className="font-bold text-base text-white">Supervisor Reassignment Decision</h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignTargetTask(null)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-xs space-y-1">
              <p className="font-bold text-white">{reassignTargetTask.title}</p>
              <p className="text-mist-400">
                Current Assignee: <strong className="text-white">{reassignTargetTask.assignee || 'Vikram Singh'}</strong>
              </p>
              {reassignTargetTask.reassignReason && (
                <p className="text-amber-200 text-[11px]">
                  Reason requested: &ldquo;{reassignTargetTask.reassignReason}&rdquo;
                </p>
              )}
            </div>

            <form onSubmit={handleReassignDecisionSubmit} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200">Decision Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReassignDecisionMode('approve')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reassignDecisionMode === 'approve'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/10 bg-white/[0.02] text-mist-400'
                    }`}
                  >
                    Approve Reassignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setReassignDecisionMode('reject')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reassignDecisionMode === 'reject'
                        ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                        : 'border-white/10 bg-white/[0.02] text-mist-400'
                    }`}
                  >
                    Decline Request
                  </button>
                </div>
              </div>

              {reassignDecisionMode === 'approve' ? (
                <div className="space-y-1.5">
                  <label className="font-semibold text-mist-200">Select Alternate Attendant *</label>
                  <select
                    value={selectedColleagueId}
                    onChange={(e) => setSelectedColleagueId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-950 p-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="EMP-0104">Priya Sharma (EMP-0104) · Housekeeping · Floors 1–3</option>
                    <option value="EMP-0105">Arjun Nair (EMP-0105) · Maintenance · All Floors</option>
                    <option value="EMP-0106">Sneha Patil (EMP-0106) · Housekeeping · Floors 3–5</option>
                    <option value="EMP-0107">Rajesh Kumar (EMP-0107) · Room Service / Runner · Floors 1–5</option>
                  </select>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-[11px]">
                  Task will remain assigned to the original attendant ({reassignTargetTask.assignee || 'Vikram Singh'}). Attendant will be notified of the decision.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-mist-200">Supervisor Decision Instructions</label>
                <textarea
                  rows={2}
                  placeholder={
                    reassignDecisionMode === 'approve'
                      ? 'e.g. Reassigned due to DND status. Please take over room turnover.'
                      : 'e.g. Floor 4 attendants are fully occupied. Please re-check room at 12:30.'
                  }
                  value={supervisorDecisionNotes}
                  onChange={(e) => setSupervisorDecisionNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-950 p-2 text-white placeholder-mist-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReassignTargetTask(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                    reassignDecisionMode === 'approve'
                      ? 'bg-emerald-500 text-ink-950 hover:bg-emerald-400'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {reassignDecisionMode === 'approve' ? 'Reassign Task' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
