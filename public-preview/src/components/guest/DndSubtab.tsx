'use client';

import { useState } from 'react';
import {
  MoonStar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  History,
  Check,
  Sliders,
  VolumeX,
  BellOff,
  BedDouble,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

const DND_DURATIONS = [
  { id: 'indefinite', label: 'Until I Turn It Off', hint: 'Remains active until manual deactivation' },
  { id: '2h', label: 'For 2 Hours', hint: 'Power nap / quick rest window' },
  { id: '4h', label: 'For 4 Hours', hint: 'Uninterrupted work or afternoon rest' },
  { id: 'tomorrow_morning', label: 'Until 11:00 AM Tomorrow', hint: 'Overnight rest without morning housekeeping' },
  { id: 'checkout', label: 'Until Scheduled Check-Out', hint: 'Privacy until departure day' },
];

export function DndSubtab({ room, guestName }: GuestTabProps) {
  const { state, updateDndStatus } = useDemo();
  const roomRecord = (state.frontDesk?.rooms ?? []).find((r) => r.no === room);
  const prefs = state.guestPreferences?.[room];
  const isDndActive = Boolean(prefs?.dnd ?? roomRecord?.dnd ?? false);

  const [selectedDuration, setSelectedDuration] = useState<string>(DND_DURATIONS[0].label);
  const [instructions, setInstructions] = useState<string>(prefs?.personalInstructions ?? '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter DND history for this room
  const history = (state.dndHistory ?? []).filter((h) => h.room === room);

  function handleToggleDnd(enable: boolean) {
    setIsUpdating(true);
    updateDndStatus(room, enable, enable ? selectedDuration : 'Manual release', instructions.trim());
    setTimeout(() => setIsUpdating(false), 300);
  }

  function handleSaveInstructions() {
    updateDndStatus(room, isDndActive, selectedDuration, instructions.trim());
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Hero DND Status Card */}
      <div
        className={cn(
          'guest-card p-5 relative overflow-hidden transition-all duration-300',
          isDndActive
            ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-ink-900 to-ink-950 shadow-rose-950/30 shadow-xl'
            : 'border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]',
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span
              className={cn(
                'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300',
                isDndActive
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 scale-105'
                  : 'bg-white/5 text-mist-400 border border-white/10',
              )}
            >
              {isDndActive ? <MoonStar className="h-6 w-6 animate-pulse" /> : <VolumeX className="h-6 w-6" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-mist-400">
                  Room {room} Status
                </span>
                <GuestPill tone={isDndActive ? 'danger' : 'neutral'}>
                  {isDndActive ? 'DND ACTIVE' : 'STANDARD SERVICE'}
                </GuestPill>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                {isDndActive ? 'Do Not Disturb is Active' : 'Do Not Disturb is Turned Off'}
              </h2>
              <p className="text-xs text-mist-300 mt-0.5">
                {isDndActive
                  ? 'Housekeeping cleaning, turndown, and room phone chimes are paused.'
                  : 'Hotel staff and housekeeping will service your room as regularly scheduled.'}
              </p>
            </div>
          </div>

          {/* Master Toggle Button */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleToggleDnd(!isDndActive)}
            className={cn(
              'shrink-0 px-5 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2',
              isDndActive
                ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-400/50'
                : 'bg-amber-400 text-ink-950 hover:bg-amber-300',
            )}
          >
            <MoonStar className="h-4 w-4" />
            <span>{isDndActive ? 'Deactivate DND' : 'Activate Do Not Disturb'}</span>
          </button>
        </div>

        {/* Live sync badge */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-mist-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Front Desk &amp; Housekeeping live synchronized</span>
          </span>
          <span className="font-mono text-mist-300">
            {isDndActive ? `Duration: ${selectedDuration}` : 'Normal stay mode'}
          </span>
        </div>
      </div>

      {/* DND Duration Selector */}
      <div className="space-y-3">
        <GuestSectionHeader title="Preferred Duration" hint="Select how long you wish Do Not Disturb to remain active" />
        <div className="space-y-2">
          {DND_DURATIONS.map((dur) => {
            const isSelected = selectedDuration === dur.label;
            return (
              <button
                key={dur.id}
                type="button"
                onClick={() => {
                  setSelectedDuration(dur.label);
                  if (isDndActive) {
                    updateDndStatus(room, true, dur.label, instructions.trim());
                  }
                }}
                className={cn(
                  'guest-card p-3 w-full flex items-center justify-between text-left transition',
                  isSelected && 'ring-2 ring-amber-400 border-amber-400/40 bg-amber-400/10',
                )}
              >
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{dur.label}</span>
                    {dur.id === 'indefinite' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-mist-400">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-mist-400 mt-0.5">{dur.hint}</p>
                </div>
                {isSelected && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-ink-950 shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Instructions Field */}
      <div className="guest-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-400/15 text-amber-300">
              <Sliders className="h-3 w-3" />
            </span>
            <span className="text-xs font-bold text-white">Special Front Desk &amp; Service Instructions</span>
          </div>
          {instructions.trim() && (
            <button
              type="button"
              onClick={handleSaveInstructions}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              Save Notes
            </button>
          )}
        </div>

        <textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Please do not knock before 11:00 AM. Leave morning newspaper silently outside the suite door. Essential phone calls permitted."
          className="guest-field w-full px-3 py-2 text-xs"
        />

        <div className="flex items-center justify-between text-[11px] text-mist-400">
          <span>Notified directly to Floor Attendants &amp; Front Office.</span>
          <button
            type="button"
            onClick={handleSaveInstructions}
            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10"
          >
            Update Instructions
          </button>
        </div>
      </div>

      {/* DND Status Changes Record / History */}
      <div className="space-y-3">
        <GuestSectionHeader title="DND Status Change Record" hint="Chronological log of your stay's privacy setting changes" />

        {history.length === 0 ? (
          <GuestEmptyState icon={History} title="No status changes recorded yet" hint="Whenever you activate or release Do Not Disturb, a tamper-proof timestamp log records here." />
        ) : (
          <div className="guest-card divide-y border-white/[0.08] overflow-hidden">
            {history.map((entry) => {
              const isAct = entry.action === 'activated';
              return (
                <div key={entry.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'grid h-6 w-6 place-items-center rounded-lg shrink-0 mt-0.5',
                        isAct ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400',
                      )}
                    >
                      {isAct ? <MoonStar className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <p className="font-bold text-white capitalize">
                        DND {entry.action} {entry.duration && `· ${entry.duration}`}
                      </p>
                      {entry.instructions && (
                        <p className="text-mist-300 text-[11px] mt-0.5 italic">&ldquo;{entry.instructions}&rdquo;</p>
                      )}
                      <p className="text-mist-400 text-[10px] mt-1">{entry.updatedBy}</p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-amber-300 shrink-0">{entry.timestamp}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

