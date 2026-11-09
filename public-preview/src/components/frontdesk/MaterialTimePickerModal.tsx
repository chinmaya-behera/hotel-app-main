'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Clock, X, User, Bell, FileText, Check } from 'lucide-react';

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
}

export function MaterialTimePickerModal({
  isOpen,
  initialTime = '03:57',
  initialData,
  showReminderFields = false,
  onClose,
  onConfirm,
  title,
}: MaterialTimePickerModalProps) {
  // Parse initial time
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

  // Text inputs for keyboard editing
  const [hourText, setHourText] = useState<string>('');
  const [minuteText, setMinuteText] = useState<string>('');
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Minimal 5 Reminder Fields requested by user:
  // 1. Reminder Title
  // 2. Room No
  // 3. Guest Name
  // 4. Assigned Staff
  // 5. Reminder Instructions & Action Notes
  const [remTitle, setRemTitle] = useState(initialData?.title || '');
  const [remRoom, setRemRoom] = useState(initialData?.room || '');
  const [remGuestName, setRemGuestName] = useState(initialData?.guestName || '');
  const [remAssignedStaff, setRemAssignedStaff] = useState(initialData?.assignedTo || 'Front Desk Coordinator');
  const [remInstructions, setRemInstructions] = useState(initialData?.instructions || '');

  // Reset values when modal opens or initial values change
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

  // Keep text strings in sync when hour/minute state updates from dial
  useEffect(() => {
    setHourText(String(hour).padStart(2, '0'));
  }, [hour]);

  useEffect(() => {
    setMinuteText(String(minute).padStart(2, '0'));
  }, [minute]);

  // When switching to keyboard mode, focus on the hour input
  useEffect(() => {
    if (isKeyboardMode) {
      setTimeout(() => {
        hourInputRef.current?.focus();
        hourInputRef.current?.select();
      }, 50);
    }
  }, [isKeyboardMode]);

  // Dial coordinate calculations:
  // Center is at (128, 128) in a 256x256 coordinate system
  const DIAL_RADIUS = 128;
  const OUTER_RADIUS = 96; // Outer ring (0-11 hours, or minutes)
  const INNER_RADIUS = 60; // Inner ring (12-23 hours)

  const handleDialPointer = useCallback(
    (clientX: number, clientY: number, isFinalClick: boolean = false) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Angle in degrees clockwise from 12 o'clock
      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      if (mode === 'hour') {
        const step = Math.round(deg / 30) % 12;
        // Midpoint threshold between inner and outer ring
        const threshold = ((OUTER_RADIUS + INNER_RADIUS) / 2) * (rect.width / (DIAL_RADIUS * 2));
        let selectedH: number;
        if (dist < threshold) {
          // Inner ring: 12..23
          selectedH = step + 12;
        } else {
          // Outer ring: 0..11
          selectedH = step;
        }
        setHour(selectedH);

        // On final click, transition to minute mode smoothly
        if (isFinalClick) {
          setTimeout(() => {
            setMode('minute');
          }, 250);
        }
      } else {
        // Minute mode: 0..59
        const selectedM = Math.round(deg / 6) % 60;
        setMinute(selectedM);
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

  // Keyboard inputs handlers
  const handleHourTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHourText(val);
    if (val !== '') {
      const num = parseInt(val, 10);
      if (num >= 0 && num <= 23) {
        setHour(num);
        if (val.length === 2 || num > 2) {
          minuteInputRef.current?.focus();
          minuteInputRef.current?.select();
        }
      }
    }
  };

  const handleMinuteTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinuteText(val);
    if (val !== '') {
      const num = parseInt(val, 10);
      if (num >= 0 && num <= 59) {
        setMinute(num);
      }
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

  // Active hand calculations
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

  // Hand tip position in 256x256 coordinate system
  const handRad = ((handAngle - 90) * Math.PI) / 180;
  const handX = DIAL_RADIUS + handRadius * Math.cos(handRad);
  const handY = DIAL_RADIUS + handRadius * Math.sin(handRad);

  // Time Picker Component sub-render
  const renderTimePickerSection = () => (
    <div className="flex flex-col items-center">
      {/* Title inside dial column */}
      <span className="text-xs font-medium text-slate-300 self-start mb-1">
        Select time
      </span>

      {/* Digital Time Display (Hour : Minute) matching screenshot */}
      <div className="flex items-center justify-center gap-2.5 my-3">
        {/* Hour Box */}
        <button
          type="button"
          onClick={() => {
            setMode('hour');
            if (isKeyboardMode) hourInputRef.current?.focus();
          }}
          className={`w-24 h-20 rounded-xl flex items-center justify-center text-5xl font-normal transition-all ${
            mode === 'hour'
              ? 'bg-[#0b57d0] text-white shadow-lg ring-2 ring-blue-400/40'
              : 'bg-[#282a30] text-slate-200 hover:bg-[#31333b]'
          }`}
        >
          {String(hour).padStart(2, '0')}
        </button>

        {/* Separator */}
        <div className="text-4xl font-bold text-slate-300 select-none pb-1">
          :
        </div>

        {/* Minute Box */}
        <button
          type="button"
          onClick={() => {
            setMode('minute');
            if (isKeyboardMode) minuteInputRef.current?.focus();
          }}
          className={`w-24 h-20 rounded-xl flex items-center justify-center text-5xl font-normal transition-all ${
            mode === 'minute'
              ? 'bg-[#0b57d0] text-white shadow-lg ring-2 ring-blue-400/40'
              : 'bg-[#282a30] text-slate-200 hover:bg-[#31333b]'
          }`}
        >
          {String(minute).padStart(2, '0')}
        </button>
      </div>

      {/* Interactive Center: Dial Mode vs Keyboard Mode */}
      {!isKeyboardMode ? (
        /* MODE A: Dial Mode (Circular 24h Clock Face matching screenshot) */
        <div className="my-2 flex justify-center">
          <div
            ref={dialRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-64 h-64 rounded-full bg-[#282a30] shadow-inner select-none cursor-pointer overflow-hidden touch-none"
          >
            {/* Dial SVG Hand & Center Dot */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <circle cx={DIAL_RADIUS} cy={DIAL_RADIUS} r={4} fill="#8ab4f8" />
              <line
                x1={DIAL_RADIUS}
                y1={DIAL_RADIUS}
                x2={handX}
                y2={handY}
                stroke="#8ab4f8"
                strokeWidth={2}
              />
              <circle cx={handX} cy={handY} r={18} fill="#8ab4f8" />
              <text
                x={handX}
                y={handY + 5}
                textAnchor="middle"
                fill="#001d35"
                fontSize="15"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {selectedValue}
              </text>
            </svg>

            {/* Dial Numbers */}
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
                      }}
                      className={`absolute text-sm font-medium transition-opacity ${
                        isSelected ? 'opacity-0' : 'text-slate-200'
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
                      }}
                      className={`absolute text-xs font-normal transition-opacity ${
                        isSelected ? 'opacity-0' : 'text-slate-400'
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
                    }}
                    className={`absolute text-xs sm:text-sm font-medium transition-opacity ${
                      isSelected ? 'opacity-0' : 'text-slate-200'
                    }`}
                  >
                    {String(mVal).padStart(2, '0')}
                  </span>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* MODE B: Keyboard / Text Input Mode */
        <div className="w-full my-3 p-4 rounded-2xl bg-[#282a30] space-y-3">
          <div className="text-center text-xs text-slate-300 font-medium">
            Enter time directly using keyboard
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <input
                ref={hourInputRef}
                type="text"
                inputMode="numeric"
                value={hourText}
                onChange={handleHourTextChange}
                onFocus={() => setMode('hour')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'ArrowUp') setHour((prev) => (prev + 1) % 24);
                  if (e.key === 'ArrowDown') setHour((prev) => (prev - 1 + 24) % 24);
                }}
                className="w-20 h-14 text-center text-3xl font-mono font-bold bg-[#1e1f25] border border-blue-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                placeholder="HH"
              />
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Hour (00-23)</span>
            </div>

            <span className="text-3xl font-bold text-slate-300 -mt-3">:</span>

            <div className="flex flex-col items-center">
              <input
                ref={minuteInputRef}
                type="text"
                inputMode="numeric"
                value={minuteText}
                onChange={handleMinuteTextChange}
                onFocus={() => setMode('minute')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'ArrowUp') setMinute((prev) => (prev + 1) % 60);
                  if (e.key === 'ArrowDown') setMinute((prev) => (prev - 1 + 60) % 60);
                }}
                className="w-20 h-14 text-center text-3xl font-mono font-bold bg-[#1e1f25] border border-blue-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                placeholder="MM"
              />
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Minute (00-59)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '21:30', '22:00'].map((preset) => {
              const [ph, pm] = preset.split(':').map(Number);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setHour(ph);
                    setMinute(pm);
                  }}
                  className="py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300 hover:text-white transition"
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyboard/Dial Switch Button */}
      <div className="w-full flex items-center justify-start pt-1">
        <button
          type="button"
          onClick={() => setIsKeyboardMode(!isKeyboardMode)}
          className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
          title={isKeyboardMode ? 'Switch to clock dial' : 'Switch to keyboard text entry'}
        >
          {isKeyboardMode ? (
            <>
              <Clock className="w-4 h-4 text-[#8ab4f8]" />
              <span className="text-[11px] text-[#8ab4f8]">Use Clock Dial</span>
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4 text-slate-300" />
              <span className="text-[11px] text-slate-300">Type with Keyboard</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={`relative w-full rounded-3xl bg-[#1e1f25] border border-white/10 shadow-2xl p-6 text-white select-none transition-all ${
          showReminderFields ? 'max-w-2xl' : 'max-w-[328px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300" />
              <span>{title || (showReminderFields ? 'Set Reminder & Service Time' : 'Select time')}</span>
            </h3>
            {showReminderFields && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Set reminding time on the clock and configure dispatch notes on the side.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Either Side-by-Side (Time Picker + Minimal Side Section) or Standalone Time Picker */}
        {showReminderFields ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start py-4">
            {/* Left Column: Timer Selection */}
            <div className="border-b md:border-b-0 md:border-r border-white/[0.08] pb-4 md:pb-0 md:pr-6">
              {renderTimePickerSection()}
            </div>

            {/* Right Column: Minimal 5 Fields Requested by User */}
            <div className="space-y-3.5">
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/[0.06]">
                <FileText className="w-3.5 h-3.5" />
                <span>Reminder Details</span>
              </div>

              {/* 1. Reminder Title */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Evening Turndown & Extra Towels"
                  className="field w-full text-xs"
                />
              </div>

              {/* 2 & 3. Room No & Guest Name in responsive row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                    Room No
                  </label>
                  <input
                    type="text"
                    required
                    value={remRoom}
                    onChange={(e) => setRemRoom(e.target.value)}
                    placeholder="e.g. 402"
                    className="field w-full text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={remGuestName}
                    onChange={(e) => setRemGuestName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="field w-full text-xs"
                  />
                </div>
              </div>

              {/* 4. Assigned Staff */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                  Assigned Staff
                </label>
                <select
                  value={remAssignedStaff}
                  onChange={(e) => setRemAssignedStaff(e.target.value)}
                  className="field w-full text-xs"
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
                <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                  Reminder Instructions &amp; Action Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={remInstructions}
                  onChange={(e) => setRemInstructions(e.target.value)}
                  placeholder="Action notes for fulfillment team..."
                  className="field w-full text-xs resize-none"
                />
              </div>

              {/* Time Preview Pill */}
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-between text-xs">
                <span className="text-slate-300 text-[11px]">Scheduled Service Time:</span>
                <span className="font-mono font-bold text-[#8ab4f8] text-sm">
                  {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Standalone Time Picker when no side fields requested */
          <div className="py-2">
            {renderTimePickerSection()}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <div className="text-[11px] text-slate-400 font-mono">
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
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold bg-[#0b57d0] hover:bg-blue-600 text-white rounded-xl shadow-lg transition flex items-center gap-1.5"
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
