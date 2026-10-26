'use client';

import { useState } from 'react';
import {
  X,
  Link2,
  Copy,
  AlertCircle,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';

interface LinkDuplicateModalProps {
  task: WorkItem;
  onClose: () => void;
  onLinked?: (parentRef: string) => void;
}

export function LinkDuplicateModal({ task, onClose, onLinked }: LinkDuplicateModalProps) {
  const { state, linkDuplicateTask } = useDemo();
  const [selectedParentRef, setSelectedParentRef] = useState<string>('');

  // Find all active dispatcher tasks except the current one
  const activeTasks = (state.items.department_dispatcher ?? []).filter(
    (t) => t.id !== task.id && !t.isLinkedDuplicate,
  );

  // Recommendations based on same room or category
  const sameRoomTasks = activeTasks.filter((t) => t.room && t.room === task.room);
  const otherTasks = activeTasks.filter((t) => !t.room || t.room !== task.room);

  const handleLink = () => {
    if (!selectedParentRef) return;
    linkDuplicateTask(task.id, selectedParentRef);
    if (onLinked) onLinked(selectedParentRef);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                Ticket Deduplication Engine
              </p>
            </div>
            <h2 id="duplicate-modal-title" className="text-xl font-bold font-display text-white">
              Link Duplicate Request
            </h2>
            <p className="text-xs text-mist-300 truncate max-w-md">
              Link <strong className="text-white">{task.title}</strong> to a primary operational ticket.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informational banner */}
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-3 text-xs text-sky-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-sky-300 mt-0.5" />
          <p>
            Linking will mark this item as a duplicate, preventing multiple attendants from being dispatched to the same room or issue. The primary ticket will track SLA completion.
          </p>
        </div>

        {/* Suggested Parent Candidates */}
        <div className="space-y-3">
          {sameRoomTasks.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Suggested Matches (Same Room: {task.room})
              </span>
              <div className="space-y-2">
                {sameRoomTasks.map((candidate) => {
                  const refKey = candidate.ref || candidate.id;
                  const isSelected = selectedParentRef === refKey;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedParentRef(refKey)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-400 bg-sky-400/[0.1] shadow-md'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-300">{refKey}</span>
                          <span className="text-xs font-semibold text-white">{candidate.title}</span>
                        </div>
                        <p className="text-[11px] text-mist-400">{candidate.meta}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-mist-200">
                        {candidate.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Other Active Tasks */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400">
              Other Active Property Tasks
            </span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {otherTasks.map((candidate) => {
                const refKey = candidate.ref || candidate.id;
                const isSelected = selectedParentRef === refKey;
                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedParentRef(refKey)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-400 bg-sky-400/[0.1] shadow-md'
                        : 'border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="space-y-0.5 truncate max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-300">{refKey}</span>
                        <span className="text-xs font-medium text-mist-200 truncate">{candidate.title}</span>
                      </div>
                      <p className="text-[11px] text-mist-400 truncate">{candidate.meta}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-mist-300 shrink-0">
                      {candidate.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <p className="text-xs text-mist-400 truncate max-w-[260px]">
            {selectedParentRef ? (
              <span>
                Target: <strong className="text-sky-300 font-mono">{selectedParentRef}</strong>
              </span>
            ) : (
              'Select a parent task to link'
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.05] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedParentRef}
              onClick={handleLink}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-400 text-ink-950 text-xs font-bold hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-sky-500/20"
            >
              <Link2 className="h-4 w-4" />
              <span>Link as Duplicate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
