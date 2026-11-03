'use client';

import { Hand, X } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GestureGuideModal({ isOpen, onClose }: GestureGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gesture-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/10 text-lg">
              🖐️
            </span>
            <div>
              <h2 id="gesture-modal-title" className="text-base font-bold font-display text-white">
                Gesture & Keyboard Shortcuts
              </h2>
              <p className="text-xs text-mist-400">Contextual navigation and touch gestures</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-1.5 text-mist-400 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="space-y-2.5 text-xs text-mist-200">
          <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <kbd className="kbd shrink-0 font-mono text-amber-300 font-semibold px-2 py-1 rounded bg-white/5 border border-white/10">Swipe →</kbd>
            <span>Advance request to next lifecycle status (Review, Confirm, Complete)</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <kbd className="kbd shrink-0 font-mono text-amber-300 font-semibold px-2 py-1 rounded bg-white/5 border border-white/10">← Swipe</kbd>
            <span>Instantly escalate complex guest cases to the Duty Manager</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <kbd className="kbd shrink-0 font-mono text-amber-300 font-semibold px-2 py-1 rounded bg-white/5 border border-white/10">Hold</kbd>
            <span>Press and hold sensitive confirmation buttons (checkout, payment reconciliation)</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <kbd className="kbd shrink-0 font-mono text-amber-300 font-semibold px-2 py-1 rounded bg-white/5 border border-white/10">Tap Tile</kbd>
            <span>Click any room tile to inspect occupancy, cleanliness, or issue an OOO block request</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <kbd className="kbd shrink-0 font-mono text-amber-300 font-semibold px-2 py-1 rounded bg-white/5 border border-white/10">← → Keys</kbd>
            <span>Arrow keys move between operational sections (Stays, Requests, Rooms, Recovery)</span>
          </li>
        </ul>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

