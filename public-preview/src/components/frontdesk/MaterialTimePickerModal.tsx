'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Keyboard, Clock, X, Bell, FileText, Check } from 'lucide-react';
import { useDemo } from '@/lib/store';

export interface ReminderConfigData {
  title: string;
  room: string;
  guestName: string;
  assignedTo: string;
  instructions: string;
}

interface MaterialTimePickerModalProps {
  isOpen: boolean;
  initialTime?: string; // Format "HH:mm" e.g. "03:57" or "20:00"
  initialData?: Partial<ReminderConfigData>;
  showReminderFields?: boolean;
  onClose: () => void;
  onConfirm: (newTime: string, data?: ReminderConfigData) => void;
  title?: string;
  isLight?: boolean;
}

export function MaterialTimePickerModal({
  isOpen,
  initialTime = '17:20',
  initialData,
  showReminderFields = false,
  onClose,
  onConfirm,
  title,
  isLight: propIsLight,
}: MaterialTimePickerModalProps) {
  const { state } = useDemo();
  // Support both Dark and Light theme dynamically
  const isLight = propIsLight ?? (state ? state.theme === 'light' : false);

  // Parse initial time helper
  const parseTime = (t: string) => {
    const parts = (t || '00:00').split(':').map(Number);
    const h = isNaN(parts[0]) ? 0 : Math.min(23, Math.max(0, parts[0]));
    const m = isNaN(parts[1]) ? 0 : Math.min(59, Math.max(0, parts[1]));
    return { h, m };
  };

  const [hour, setHour] = useState<number>(() => parseTime(initialTime).h);
  const [minute, setMinute] = useState<number>(() => parseTime(initialTime).m);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);

  // Single authoritative text inputs for direct keyboard editing
  const [hourText, setHourText] = useState<string>('');
  const [minuteText, setMinuteText] = useState<string>('');
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 5 Reminder Fields
  const [remTitle, setRemTitle] = useState(initialData?.title || '');
  const [remRoom, setRemRoom] = useState(initialData?.room || '');
  const [remGuestName, setRemGuestName] = useState(initialData?.guestName || '');
  const [remAssignedStaff, setRemAssignedStaff] = useState(initialData?.assignedTo || 'Front Desk Coordinator');
  const [remInstructions, setRemInstructions] = useState(initialData?.instructions || '');

  // Extract base target service time (e.g. 17:20 or time extracted from instructions like 19:30)
  const baseTarget = useMemo(() => {
    // If instructions mention a specific target time e.g. "prior to 19:30" or "at 20:00"
    if (remInstructions) {
      const match = remInstructions.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        return { h, m, totalMinutes: h * 60 + m, isExtracted: true };
      }
    }
    const { h, m } = parseTime(initialTime || '17:20');
    return { h, m, totalMinutes: h * 60 + m, isExtracted: false };
  }, [initialTime, remInstructions]);

  // Helper to calculate time offsets from total minutes
  const getTimeOffset = (baseTotalMinutes: number, offsetMinutes: number) => {
    const total = (baseTotalMinutes + offsetMinutes + 1440 * 2) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return { h, m, formatted };
  };

  // Generate minimal suggested reminder timestamps (before 10 min, 15 min, 20 min, 30 min, and on service time)
  const reminderSuggestions = useMemo(() => {
    const base = baseTarget.totalMinutes;
    return [
      { label: '10 min before', offset: -10, ...getTimeOffset(base, -10) },
      { label: '15 min before', offset: -15, ...getTimeOffset(base, -15) },
      { label: '20 min before', offset: -20, ...getTimeOffset(base, -20) },
      { label: '30 min before', offset: -30, ...getTimeOffset(base, -30) },
      { label: 'At service time', offset: 0, ...getTimeOffset(base, 0) },
    ];
  }, [baseTarget]);

  // Reset values when modal opens
  useEffect(() => {
    if (isOpen) {
      const { h, m } = parseTime(initialTime);
      setHour(h);
      setMinute(m);
      setHourText(String(h).padStart(2, '0'));
      setMinuteText(String(m).padStart(2, '0'));
      setMode('hour');
      setIsKeyboardMode(false);

      if (initialData) {
        setRemTitle(initialData.title || '');
        setRemRoom(initialData.room || '');
        setRemGuestName(initialData.guestName || '');
        setRemAssignedStaff(initialData.assignedTo || 'Front Desk Coordinator');
        setRemInstructions(initialData.instructions || '');
      }
    }
  }, [isOpen, initialTime, initialData]);

  // Sync inputs with internal hour/minute
  useEffect(() => {
    setHourText(String(hour).padStart(2, '0'));
  }, [hour]);

  useEffect(() => {
    setMinuteText(String(minute).padStart(2, '0'));
  }, [minute]);

  // Direct Time Application Helper
  const applyTime = useCallback((newH: number, newM: number) => {
    const validH = Math.min(23, Math.max(0, newH));
    const validM = Math.min(59, Math.max(0, newM));
    setHour(validH);
    setMinute(validM);
    setHourText(String(validH).padStart(2, '0'));
    setMinuteText(String(validM).padStart(2, '0'));
  }, []);

  // Dial coordinate calculations
  const DIAL_RADIUS = 128;
  const OUTER_RADIUS = 96;
  const INNER_RADIUS = 60;

  const handleDialPointer = useCallback(
    (clientX: number, clientY: number, isFinalClick: boolean = false) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      if (mode === 'hour') {
        const step = Math.round(deg / 30) % 12;
        const threshold = ((OUTER_RADIUS + INNER_RADIUS) / 2) * (rect.width / (DIAL_RADIUS * 2));
        let selectedH: number;
        if (dist < threshold) {
          selectedH = step + 12; // Inner ring: 12..23
        } else {
          selectedH = step; // Outer ring: 0..11
        }
        setHour(selectedH);
        setHourText(String(selectedH).padStart(2, '0'));

        if (isFinalClick) {
          setTimeout(() => {
            setMode('minute');
            minuteInputRef.current?.focus();
            minuteInputRef.current?.select();
          }, 200);
        }
      } else {
        const selectedM = Math.round(deg / 6) % 60;
        setMinute(selectedM);
        setMinuteText(String(selectedM).padStart(2, '0'));
      }
    },
    [mode]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleDialPointer(e.clientX, e.clientY, false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    handleDialPointer(e.clientX, e.clientY, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault();
      setIsDragging(false);
      handleDialPointer(e.clientX, e.clientY, true);
    }
  };

  // Direct keyboard input handlers on the main time box
  const handleHourTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setHourText('');
      return;
    }

    // If 1 digit was typed into an already-filled 2-digit box, start fresh with that newly typed digit
    let val = raw;
    if (raw.length === 3) {
      val = raw.slice(-1);
    } else if (raw.length > 3) {
      val = raw.slice(-2);
    }

    const num = parseInt(val, 10);
    if (isNaN(num)) return;

    if (val.length === 1) {
      if (num >= 3) {
        // An hour in 24hr clock cannot start with 3..9, so e.g. 4 -> 04
        setHour(num);
        setHourText(String(num).padStart(2, '0'));
        setMode('minute');
        setTimeout(() => {
          minuteInputRef.current?.focus();
          minuteInputRef.current?.select();
        }, 50);
      } else {
        // For 0, 1, 2: wait for the second digit (e.g. 1 -> 13, 14, etc.)
        setHourText(val);
      }
    } else if (val.length === 2) {
      if (num <= 23) {
        setHour(num);
        setHourText(String(num).padStart(2, '0'));
      } else {
        // Clamped if > 23 (e.g. 24 -> 23)
        setHour(23);
        setHourText('23');
      }
      setMode('minute');
      setTimeout(() => {
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      }, 50);
    }
  };

  const handleHourBlur = () => {
    if (hourText === '' || isNaN(Number(hourText))) {
      setHourText(String(hour).padStart(2, '0'));
    } else {
      const num = Math.min(23, Math.max(0, parseInt(hourText, 10)));
      setHour(num);
      setHourText(String(num).padStart(2, '0'));
    }
  };

  const handleMinuteTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setMinuteText('');
      return;
    }

    let val = raw;
    if (raw.length === 3) {
      val = raw.slice(-1);
    } else if (raw.length > 3) {
      val = raw.slice(-2);
    }

    const num = parseInt(val, 10);
    if (isNaN(num)) return;

    if (val.length === 1) {
      if (num >= 6) {
        // Minutes only go up to 59, so 6..9 can only be 06..09
        setMinute(num);
        setMinuteText(String(num).padStart(2, '0'));
      } else {
        // For 0..5, wait for 2nd digit (e.g. 2 -> 20, 25, 40)
        setMinuteText(val);
      }
    } else if (val.length === 2) {
      if (num <= 59) {
        setMinute(num);
        setMinuteText(String(num).padStart(2, '0'));
      } else {
        setMinute(59);
        setMinuteText('59');
      }
    }
  };

  const handleMinuteBlur = () => {
    if (minuteText === '' || isNaN(Number(minuteText))) {
      setMinuteText(String(minute).padStart(2, '0'));
    } else {
      const num = Math.min(59, Math.max(0, parseInt(minuteText, 10)));
      setMinute(num);
      setMinuteText(String(num).padStart(2, '0'));
    }
  };

  const handleConfirm = () => {
    const finalH = String(hour).padStart(2, '0');
    const finalM = String(minute).padStart(2, '0');
    const formattedTime = `${finalH}:${finalM}`;

    if (showReminderFields) {
      onConfirm(formattedTime, {
        title: remTitle.trim() || 'Guest Operational Service Due',
        room: remRoom.trim() || 'General',
        guestName: remGuestName.trim() || 'Guest',
        assignedTo: remAssignedStaff,
        instructions: remInstructions.trim() || 'Attend to guest service at scheduled time.',
      });
    } else {
      onConfirm(formattedTime);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Active dial hand calculations
  let handAngle = 0;
  let handRadius = OUTER_RADIUS;
  let selectedValue = '';

  if (mode === 'hour') {
    if (hour < 12) {
      handAngle = hour * 30;
      handRadius = OUTER_RADIUS;
      selectedValue = String(hour);
    } else {
      handAngle = (hour - 12) * 30;
      handRadius = INNER_RADIUS;
      selectedValue = String(hour);
    }
  } else {
    handAngle = minute * 6;
    handRadius = OUTER_RADIUS;
    selectedValue = String(minute).padStart(2, '0');
  }

  const handRad = ((handAngle - 90) * Math.PI) / 180;
  const handX = DIAL_RADIUS + handRadius * Math.cos(handRad);
  const handY = DIAL_RADIUS + handRadius * Math.sin(handRad);

  const currentTimeFormatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const guestRequestedTimeFormatted = `${String(baseTarget.h).padStart(2, '0')}:${String(baseTarget.m).padStart(2, '0')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={`relative w-full rounded-3xl shadow-2xl p-5 sm:p-6 select-none transition-all border ${
          showReminderFields ? 'max-w-2xl' : 'max-w-[360px]'
        }`}
        style={{
          background: isLight ? '#ffffff' : '#1e1f25',
          borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
          color: isLight ? '#0f172a' : '#ffffff',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Minimized and Clean */}
        <div
          className="flex items-center justify-between pb-2.5 border-b"
          style={{ borderColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <h3
              className="text-xs font-semibold tracking-wide"
              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
            >
              {title || (showReminderFields ? 'Set Reminder & Service Time' : 'Select time')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full transition cursor-pointer"
            style={{
              color: isLight ? '#64748b' : '#94a4bf',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = isLight ? '#dc2626' : '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = isLight ? '#64748b' : '#94a4bf';
            }}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body: Left (Time Picker) + Right (Reminder Details) */}
        <div className={showReminderFields ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start py-4' : 'py-3'}>
          {/* Left Column: Single Authoritative Time Picker */}
          <div className={showReminderFields ? 'border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6' : ''}
            style={{ borderColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex flex-col items-center">
              {/* Upper Banner in Set Time section: clearly and minimally displays guest said time */}
              <div className="w-full flex items-center justify-between mb-1 px-0.5">
                <span
                  className="text-xs font-semibold"
                  style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                >
                  Select time
                </span>
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-mono border"
                  style={{
                    background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)',
                    borderColor: isLight ? '#bfdbfe' : 'rgba(96, 165, 250, 0.25)',
                    color: isLight ? '#1d4ed8' : '#8ab4f8',
                  }}
                  title="Guest's requested target service time"
                >
                  <span className="text-[10px] font-sans font-medium opacity-80">Guest Time:</span>
                  <span className="font-bold">{guestRequestedTimeFormatted}</span>
                </div>
              </div>

              {/* SINGLE MAIN TIME DISPLAY: 100% Directly Typable with Keyboard */}
              <div className="flex items-center justify-center gap-2.5 my-2.5">
                {/* Hour Box */}
                <input
                  ref={hourInputRef}
                  type="text"
                  inputMode="numeric"
                  value={hourText}
                  onChange={handleHourTextChange}
                  onBlur={handleHourBlur}
                  onClick={(e) => {
                    setMode('hour');
                    e.currentTarget.select();
                  }}
                  onFocus={(e) => {
                    setMode('hour');
                    e.currentTarget.select();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const nextH = (hour + 1) % 24;
                      setHour(nextH);
                      setHourText(String(nextH).padStart(2, '0'));
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextH = (hour - 1 + 24) % 24;
                      setHour(nextH);
                      setHourText(String(nextH).padStart(2, '0'));
                    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
                      minuteInputRef.current?.focus();
                      minuteInputRef.current?.select();
                    } else if (e.key === 'Enter') {
                      handleConfirm();
                    }
                  }}
                  className="w-24 h-20 rounded-2xl text-center text-5xl font-mono font-bold transition-all outline-none cursor-text shadow-sm"
                  style={{
                    background: mode === 'hour'
                      ? '#0b57d0'
                      : isLight
                      ? '#f1f5f9'
                      : '#282a30',
                    color: mode === 'hour'
                      ? '#ffffff'
                      : isLight
                      ? '#0f172a'
                      : '#e2e8f0',
                    border: mode === 'hour'
                      ? '2px solid #38bdf8'
                      : isLight
                      ? '1px solid #cbd5e1'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: mode === 'hour' ? '0 10px 25px -5px rgba(11, 87, 208, 0.5)' : undefined,
                  }}
                  aria-label="Hour (00 to 23)"
                  title="Hour (00-23)"
                />

                {/* Colon Separator */}
                <div
                  className="text-4xl font-bold select-none"
                  style={{ color: isLight ? '#94a3b8' : '#64748b' }}
                >
                  :
                </div>

                {/* Minute Box */}
                <input
                  ref={minuteInputRef}
                  type="text"
                  inputMode="numeric"
                  value={minuteText}
                  onChange={handleMinuteTextChange}
                  onBlur={handleMinuteBlur}
                  onClick={(e) => {
                    setMode('minute');
                    e.currentTarget.select();
                  }}
                  onFocus={(e) => {
                    setMode('minute');
                    e.currentTarget.select();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const nextM = (minute + 1) % 60;
                      setMinute(nextM);
                      setMinuteText(String(nextM).padStart(2, '0'));
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextM = (minute - 1 + 60) % 60;
                      setMinute(nextM);
                      setMinuteText(String(nextM).padStart(2, '0'));
                    } else if (e.key === 'ArrowLeft') {
                      hourInputRef.current?.focus();
                      hourInputRef.current?.select();
                    } else if (e.key === 'Backspace' && minuteText === '') {
                      hourInputRef.current?.focus();
                      hourInputRef.current?.select();
                    } else if (e.key === 'Enter') {
                      handleConfirm();
                    }
                  }}
                  className="w-24 h-20 rounded-2xl text-center text-5xl font-mono font-bold transition-all outline-none cursor-text shadow-sm"
                  style={{
                    background: mode === 'minute'
                      ? '#0b57d0'
                      : isLight
                      ? '#f1f5f9'
                      : '#282a30',
                    color: mode === 'minute'
                      ? '#ffffff'
                      : isLight
                      ? '#0f172a'
                      : '#e2e8f0',
                    border: mode === 'minute'
                      ? '2px solid #38bdf8'
                      : isLight
                      ? '1px solid #cbd5e1'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: mode === 'minute' ? '0 10px 25px -5px rgba(11, 87, 208, 0.5)' : undefined,
                  }}
                  aria-label="Minute (00 to 59)"
                  title="Minute (00-59)"
                />
              </div>

              {/* VIEW 1: Circular Clock Dial View */}
              {!isKeyboardMode ? (
                <div className="flex flex-col items-center w-full">
                  <div className="my-2 flex justify-center">
                    <div
                      ref={dialRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="relative w-64 h-64 rounded-full shadow-inner select-none cursor-pointer overflow-hidden touch-none"
                      style={{
                        background: isLight ? '#f1f5f9' : '#282a30',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {/* SVG Clock Hand & Indicator */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <circle
                          cx={DIAL_RADIUS}
                          cy={DIAL_RADIUS}
                          r={4}
                          fill={isLight ? '#0b57d0' : '#8ab4f8'}
                        />
                        <line
                          x1={DIAL_RADIUS}
                          y1={DIAL_RADIUS}
                          x2={handX}
                          y2={handY}
                          stroke={isLight ? '#0b57d0' : '#8ab4f8'}
                          strokeWidth={2}
                        />
                        <circle
                          cx={handX}
                          cy={handY}
                          r={18}
                          fill={isLight ? '#0b57d0' : '#8ab4f8'}
                        />
                        <text
                          x={handX}
                          y={handY + 5}
                          textAnchor="middle"
                          fill={isLight ? '#ffffff' : '#001d35'}
                          fontSize="15"
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
                        >
                          {selectedValue}
                        </text>
                      </svg>

                      {/* Clock Numbers */}
                      {mode === 'hour' ? (
                        <>
                          {/* Outer Ring: 0 to 11 */}
                          {Array.from({ length: 12 }, (_, i) => {
                            const angle = (i * 30 - 90) * (Math.PI / 180);
                            const x = DIAL_RADIUS + OUTER_RADIUS * Math.cos(angle);
                            const y = DIAL_RADIUS + OUTER_RADIUS * Math.sin(angle);
                            const isSelected = hour === i;

                            return (
                              <span
                                key={`outer-${i}`}
                                style={{
                                  left: `${x}px`,
                                  top: `${y}px`,
                                  transform: 'translate(-50%, -50%)',
                                  color: isLight ? '#1e293b' : '#e2e8f0',
                                }}
                                className={`absolute text-sm font-semibold transition-opacity select-none ${
                                  isSelected ? 'opacity-0' : 'opacity-100'
                                }`}
                              >
                                {i}
                              </span>
                            );
                          })}

                          {/* Inner Ring: 12 to 23 */}
                          {Array.from({ length: 12 }, (_, i) => {
                            const hVal = i + 12;
                            const angle = (i * 30 - 90) * (Math.PI / 180);
                            const x = DIAL_RADIUS + INNER_RADIUS * Math.cos(angle);
                            const y = DIAL_RADIUS + INNER_RADIUS * Math.sin(angle);
                            const isSelected = hour === hVal;

                            return (
                              <span
                                key={`inner-${hVal}`}
                                style={{
                                  left: `${x}px`,
                                  top: `${y}px`,
                                  transform: 'translate(-50%, -50%)',
                                  color: isLight ? '#64748b' : '#94a4bf',
                                }}
                                className={`absolute text-xs font-medium transition-opacity select-none ${
                                  isSelected ? 'opacity-0' : 'opacity-100'
                                }`}
                              >
                                {hVal}
                              </span>
                            );
                          })}
                        </>
                      ) : (
                        /* Minute Numbers: 00, 05, 10, ..., 55 */
                        Array.from({ length: 12 }, (_, i) => {
                          const mVal = i * 5;
                          const angle = (i * 30 - 90) * (Math.PI / 180);
                          const x = DIAL_RADIUS + OUTER_RADIUS * Math.cos(angle);
                          const y = DIAL_RADIUS + OUTER_RADIUS * Math.sin(angle);
                          const isSelected = minute === mVal;

                          return (
                            <span
                              key={`min-${mVal}`}
                              style={{
                                left: `${x}px`,
                                top: `${y}px`,
                                transform: 'translate(-50%, -50%)',
                                color: isLight ? '#1e293b' : '#e2e8f0',
                              }}
                              className={`absolute text-xs sm:text-sm font-semibold transition-opacity select-none ${
                                isSelected ? 'opacity-0' : 'opacity-100'
                              }`}
                            >
                              {String(mVal).padStart(2, '0')}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Clean, minimal Type with Keyboard button at bottom-left (Matches Screenshot 2) */}
                  <div className="w-full flex items-center justify-start mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsKeyboardMode(true);
                        setTimeout(() => {
                          hourInputRef.current?.focus();
                          hourInputRef.current?.select();
                        }, 50);
                      }}
                      className="flex items-center gap-2 text-xs font-medium transition cursor-pointer"
                      style={{
                        color: isLight ? '#64748b' : '#94a4bf',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isLight ? '#64748b' : '#94a4bf';
                      }}
                    >
                      <Keyboard className="w-4 h-4" />
                      <span>Type with Keyboard</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW 2: Keyboard & Minimal Before-Reminder Timings (Clock Dial Hidden) */
                <div className="w-64 h-64 flex flex-col justify-between py-1">
                  <div>
                    <div
                      className="text-xs font-semibold mb-1"
                      style={{ color: isLight ? '#334155' : '#e2e8f0' }}
                    >
                      Suggested Reminder Timings
                    </div>
                    <div
                      className="text-[11px] mb-3"
                      style={{ color: isLight ? '#64748b' : '#94a4bf' }}
                    >
                      Prior to service ({String(baseTarget.h).padStart(2, '0')}:{String(baseTarget.m).padStart(2, '0')}):
                    </div>

                    <div className="space-y-2">
                      {reminderSuggestions.map((sugg) => {
                        const isActive = currentTimeFormatted === sugg.formatted;
                        return (
                          <button
                            key={sugg.label}
                            type="button"
                            onClick={() => applyTime(sugg.h, sugg.m)}
                            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer border"
                            style={{
                              background: isActive
                                ? isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.25)'
                                : isLight ? '#f8fafc' : '#282a30',
                              borderColor: isActive
                                ? isLight ? '#2563eb' : '#3b82f6'
                                : isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.08)',
                              color: isActive
                                ? isLight ? '#1d4ed8' : '#93c5fd'
                                : isLight ? '#1e293b' : '#cbd5e1',
                              fontWeight: isActive ? '700' : '500',
                            }}
                          >
                            <span>{sugg.label}</span>
                            <span className="font-mono font-bold text-xs">{sugg.formatted}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-start mt-2">
                    <button
                      type="button"
                      onClick={() => setIsKeyboardMode(false)}
                      className="flex items-center gap-2 text-xs font-medium transition cursor-pointer"
                      style={{
                        color: isLight ? '#64748b' : '#94a4bf',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isLight ? '#64748b' : '#94a4bf';
                      }}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Use Clock Dial</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 5 Minimal Reminder Fields */}
          {showReminderFields && (
            <div className="space-y-3.5">
              <div
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b"
                style={{
                  color: isLight ? '#b45309' : '#fcd34d',
                  borderColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Reminder Details</span>
              </div>

              {/* 1. Reminder Title */}
              <div>
                <label
                  className="text-[11px] font-semibold mb-1 block"
                  style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                >
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Evening Turndown & Extra Towels"
                  className="w-full px-3 py-2 rounded-xl text-xs transition outline-none"
                  style={{
                    background: isLight ? '#ffffff' : '#16171c',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#0f172a' : '#ffffff',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = isLight ? '#0b57d0' : '#8ab4f8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
                  }}
                />
              </div>

              {/* 2 & 3. Room No & Guest Name in responsive row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label
                    className="text-[11px] font-semibold mb-1 block"
                    style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                  >
                    Room No
                  </label>
                  <input
                    type="text"
                    required
                    value={remRoom}
                    onChange={(e) => setRemRoom(e.target.value)}
                    placeholder="e.g. 402"
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold transition outline-none"
                    style={{
                      background: isLight ? '#ffffff' : '#16171c',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#0f172a' : '#ffffff',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = isLight ? '#0b57d0' : '#8ab4f8';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label
                    className="text-[11px] font-semibold mb-1 block"
                    style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                  >
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={remGuestName}
                    onChange={(e) => setRemGuestName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 rounded-xl text-xs transition outline-none"
                    style={{
                      background: isLight ? '#ffffff' : '#16171c',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isLight ? '#0f172a' : '#ffffff',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = isLight ? '#0b57d0' : '#8ab4f8';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
                    }}
                  />
                </div>
              </div>

              {/* 4. Assigned Staff */}
              <div>
                <label
                  className="text-[11px] font-semibold mb-1 block"
                  style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                >
                  Assigned Staff
                </label>
                <select
                  value={remAssignedStaff}
                  onChange={(e) => setRemAssignedStaff(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs transition outline-none"
                  style={{
                    background: isLight ? '#ffffff' : '#16171c',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#0f172a' : '#ffffff',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = isLight ? '#0b57d0' : '#8ab4f8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <option value="Front Desk Coordinator">Front Desk Coordinator</option>
                  <option value="Housekeeping Attendant">Housekeeping Attendant</option>
                  <option value="Engineering Maintenance">Engineering Maintenance</option>
                  <option value="F&B Room Service">F&B Room Service</option>
                  <option value="Concierge Chauffeur">Concierge Chauffeur</option>
                </select>
              </div>

              {/* 5. Reminder Instructions & Action Notes */}
              <div>
                <label
                  className="text-[11px] font-semibold mb-1 block"
                  style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                >
                  Reminder Instructions &amp; Action Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={remInstructions}
                  onChange={(e) => setRemInstructions(e.target.value)}
                  placeholder="Action notes for fulfillment team..."
                  className="w-full px-3 py-2 rounded-xl text-xs resize-none transition outline-none"
                  style={{
                    background: isLight ? '#ffffff' : '#16171c',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#0f172a' : '#ffffff',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = isLight ? '#0b57d0' : '#8ab4f8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
                  }}
                />
              </div>

              {/* Scheduled Service Time Preview Pill */}
              <div
                className="p-2.5 rounded-xl flex items-center justify-between text-xs"
                style={{
                  background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)',
                  border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(96, 165, 250, 0.2)',
                }}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                >
                  Scheduled Service Time:
                </span>
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: isLight ? '#1d4ed8' : '#8ab4f8' }}
                >
                  {currentTimeFormatted}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)' }}
        >
          <div
            className="text-[11px] font-mono"
            style={{ color: isLight ? '#64748b' : '#94a4bf' }}
          >
            {showReminderFields ? (
              <span>Station FD-02 · Ready to save</span>
            ) : (
              <span>24-Hour Time Format</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer"
              style={{
                color: isLight ? '#475569' : '#cbd5e1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isLight ? '#475569' : '#cbd5e1';
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              style={{
                background: '#0b57d0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0947a8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0b57d0';
              }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{showReminderFields ? 'Save Reminder' : 'OK'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
