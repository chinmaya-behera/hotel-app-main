'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, Zap, Check, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuestAlarmTimePickerProps {
  value: string; // e.g. "07:30 AM" or "Immediately" or "Tomorrow at 11:15 AM"
  onChange: (newValue: string) => void;
  showImmediately?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function GuestAlarmTimePicker({
  value,
  onChange,
  showImmediately = true,
  label,
  placeholder = 'Select time...',
  className,
  id,
}: GuestAlarmTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse existing value or fallback to 07:00 AM
  const parseCurrentValue = (val: string) => {
    if (!val || val.toLowerCase().includes('immediately') || val.toLowerCase().includes('asap')) {
      return { isImmediately: true, hour: 7, minute: 0, ampm: 'AM' as 'AM' | 'PM' };
    }
    const match = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      let m = parseInt(match[2], 10);
      let p: 'AM' | 'PM' = 'AM';
      if (match[3]) {
        p = match[3].toUpperCase() as 'AM' | 'PM';
      } else if (h >= 12) {
        p = 'PM';
        if (h > 12) h -= 12;
      }
      if (h === 0) h = 12;
      return { isImmediately: false, hour: h, minute: m, ampm: p };
    }
    return { isImmediately: false, hour: 7, minute: 0, ampm: 'AM' as 'AM' | 'PM' };
  };

  const parsed = parseCurrentValue(value);
  const [selectedHour, setSelectedHour] = useState<number>(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed.minute);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(parsed.ampm);
  const [isImmediately, setIsImmediately] = useState<boolean>(parsed.isImmediately);

  // Sync state when incoming value changes
  useEffect(() => {
    const p = parseCurrentValue(value);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedAmPm(p.ampm);
    setIsImmediately(p.isImmediately);
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0 to 59

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to active items when picker opens
  useEffect(() => {
    if (isOpen && !isImmediately) {
      setTimeout(() => {
        const hourElem = document.getElementById(`alarm-hour-${selectedHour}`);
        if (hourElem && hourScrollRef.current) {
          hourElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        const minElem = document.getElementById(`alarm-min-${selectedMinute}`);
        if (minElem && minuteScrollRef.current) {
          minElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 80);
    }
  }, [isOpen, selectedHour, selectedMinute, isImmediately]);

  function handleSelectImmediately() {
    setIsImmediately(true);
    onChange('Immediately');
    setIsOpen(false);
  }

  function handleConfirmTime() {
    setIsImmediately(false);
    const formatted = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`;
    onChange(formatted);
    setIsOpen(false);
  }

  const displayTime = value || (isImmediately ? 'Immediately' : `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label htmlFor={id} className="block text-mist-300 font-semibold mb-1 text-xs">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full guest-field px-3 py-2 text-xs text-white flex items-center justify-between gap-2 hover:border-cyan-400/50 transition-colors text-left"
      >
        <span className="flex items-center gap-2 truncate">
          {isImmediately ? (
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Zap className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
              <span>Immediately (ASAP)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-white font-mono font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>{displayTime}</span>
            </span>
          )}
        </span>
        <span className="text-[10px] text-cyan-300 font-semibold shrink-0 uppercase tracking-wider">
          Change
        </span>
      </button>

      {/* Modal / Dialog Wheel Picker */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-3xl border border-cyan-400/30 bg-ink-950 p-5 shadow-2xl text-white space-y-4 ring-1 ring-cyan-400/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-400/20 text-cyan-300">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Preferred Time</h3>
                  <p className="text-[10px] text-mist-400">Alarm-style scroll picker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Immediately quick option if enabled */}
            {showImmediately && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSelectImmediately}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isImmediately
                      ? 'bg-cyan-400 text-ink-950 border-cyan-300 shadow-md ring-1 ring-cyan-300'
                      : 'bg-white/5 border-white/10 text-mist-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Request Immediately (ASAP)</span>
                </button>
              </div>
            )}

            {/* Digital Clock Display Preview */}
            <div className="text-center py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] uppercase font-semibold text-mist-400 tracking-wider block mb-1">
                Selected Window
              </span>
              <p className="text-2xl font-black font-mono tracking-wider text-cyan-300">
                {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}{' '}
                <span className="text-lg text-amber-300">{selectedAmPm}</span>
              </p>
            </div>

            {/* Alarm Wheel Columns */}
            <div className="relative py-2">
              {/* Center Highlight Lens Indicator */}
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-11 rounded-xl bg-cyan-400/15 border-y border-cyan-400/40 z-0" />

              <div className="grid grid-cols-3 gap-2 relative z-10">
                {/* 1. Hours Column */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-bold text-mist-400 uppercase tracking-wider block">
                    Hour
                  </span>
                  <div
                    ref={hourScrollRef}
                    className="h-36 overflow-y-auto no-scrollbar scroll-smooth space-y-1 py-12 px-1 snap-y snap-mandatory"
                  >
                    {hours.map((h) => {
                      const isSel = selectedHour === h;
                      return (
                        <button
                          key={h}
                          id={`alarm-hour-${h}`}
                          type="button"
                          onClick={() => {
                            setSelectedHour(h);
                            setIsImmediately(false);
                          }}
                          className={`w-full py-2 rounded-lg text-sm font-mono font-bold transition-all snap-center ${
                            isSel
                              ? 'text-cyan-300 scale-110'
                              : 'text-mist-500 hover:text-mist-300 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {String(h).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Minutes Column */}
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-bold text-mist-400 uppercase tracking-wider block">
                    Minute
                  </span>
                  <div
                    ref={minuteScrollRef}
                    className="h-36 overflow-y-auto no-scrollbar scroll-smooth space-y-1 py-12 px-1 snap-y snap-mandatory"
                  >
                    {minutes.map((m) => {
                      const isSel = selectedMinute === m;
                      return (
                        <button
                          key={m}
                          id={`alarm-min-${m}`}
                          type="button"
                          onClick={() => {
                            setSelectedMinute(m);
                            setIsImmediately(false);
                          }}
                          className={`w-full py-2 rounded-lg text-sm font-mono font-bold transition-all snap-center ${
                            isSel
                              ? 'text-cyan-300 scale-110'
                              : 'text-mist-500 hover:text-mist-300 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {String(m).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. AM / PM Column */}
                <div className="space-y-1 text-center flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-mist-400 uppercase tracking-wider block">
                    Period
                  </span>
                  <div className="flex flex-col gap-2 py-4 justify-center h-36">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAmPm('AM');
                        setIsImmediately(false);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        selectedAmPm === 'AM'
                          ? 'bg-amber-400 text-ink-950 shadow-md ring-1 ring-amber-300 font-black'
                          : 'bg-white/5 text-mist-400 hover:text-white border border-white/10'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAmPm('PM');
                        setIsImmediately(false);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        selectedAmPm === 'PM'
                          ? 'bg-amber-400 text-ink-950 shadow-md ring-1 ring-amber-300 font-black'
                          : 'bg-white/5 text-mist-400 hover:text-white border border-white/10'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
              {['07:00 AM', '08:30 AM', '12:00 PM', '06:30 PM'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const [t, p] = preset.split(' ');
                    const [h, m] = t.split(':').map(Number);
                    setSelectedHour(h);
                    setSelectedMinute(m);
                    setSelectedAmPm(p as 'AM' | 'PM');
                    setIsImmediately(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-mist-300 border border-white/5"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTime}
                className="flex-1 py-2 px-4 rounded-xl bg-cyan-400 text-ink-950 font-bold text-xs hover:bg-cyan-300 shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Confirm Time</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

