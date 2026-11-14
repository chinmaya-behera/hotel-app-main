'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Coffee,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Power,
  Sliders,
  Send,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ON_DUTY_REASONS,
  OFF_DUTY_REASONS,
  BREAK_OPTIONS,
  useBreakRequest,
  type DutyRequestType,
  type DutyRequestRecord,
} from './breakRequests';
import type { FulfillerProfile } from './fulfillerProfiles';

interface BreakRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FulfillerProfile;
  isLight: boolean;
  currentAvail: 'on_duty' | 'break' | 'off_duty';
  onSetAvailability: (status: 'on_duty' | 'break' | 'off_duty') => void;
  onNotify?: (message: string) => void;
  initialType?: DutyRequestType;
}

export function BreakRequestModal({
  isOpen,
  onClose,
  profile,
  isLight,
  currentAvail,
  onSetAvailability,
  onNotify,
  initialType,
}: BreakRequestModalProps) {
  const {
    breakRequest,
    createDutyRequest,
    approveBreakRequest,
    cancelBreakRequest,
    completeBreakRequest,
  } = useBreakRequest();

  // Active request tab: 'on_duty' | 'off_duty' | 'break' | 'other'
  const defaultTab = (): DutyRequestType => {
    if (initialType) return initialType;
    if (currentAvail === 'off_duty') return 'on_duty';
    if (currentAvail === 'break') return 'on_duty';
    return 'break';
  };

  const [activeType, setActiveType] = useState<DutyRequestType>(defaultTab);

  useEffect(() => {
    if (initialType) {
      setActiveType(initialType);
    } else if (currentAvail === 'off_duty') {
      setActiveType('on_duty');
    }
  }, [initialType, currentAvail]);

  // Selected reasons per type
  const [onDutyReasonId, setOnDutyReasonId] = useState<string>(ON_DUTY_REASONS[0].id);
  const [customOnDutyReason, setCustomOnDutyReason] = useState<string>('');

  const [offDutyReasonId, setOffDutyReasonId] = useState<string>(OFF_DUTY_REASONS[0].id);
  const [customOffDutyReason, setCustomOffDutyReason] = useState<string>('');

  const [breakOptionId, setBreakOptionId] = useState<string>(BREAK_OPTIONS[0].id);
  const [customBreakMinutes, setCustomBreakMinutes] = useState<number>(20);
  const [customBreakReason, setCustomBreakReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    let title = '';
    let reason = '';
    let customReason: string | undefined = undefined;
    let durationMinutes: number | undefined = undefined;

    if (activeType === 'on_duty') {
      const selected = ON_DUTY_REASONS.find((r) => r.id === onDutyReasonId) || ON_DUTY_REASONS[0];
      title = 'Request On Duty';
      reason = selected.label;
      if (onDutyReasonId === 'other') {
        customReason = customOnDutyReason.trim() || 'Attendant requested On Duty status';
      }
    } else if (activeType === 'off_duty') {
      const selected = OFF_DUTY_REASONS.find((r) => r.id === offDutyReasonId) || OFF_DUTY_REASONS[0];
      title = 'Request Off Duty';
      reason = selected.label;
      if (offDutyReasonId === 'other') {
        customReason = customOffDutyReason.trim() || 'Attendant requested Off Duty status';
      }
    } else {
      const selected = BREAK_OPTIONS.find((r) => r.id === breakOptionId) || BREAK_OPTIONS[0];
      title = selected.label;
      reason = selected.label;
      durationMinutes = breakOptionId === 'other' ? customBreakMinutes : selected.durationMinutes;
      if (breakOptionId === 'other' || customBreakReason.trim()) {
        customReason = customBreakReason.trim() || undefined;
      }
    }

    createDutyRequest({
      employeeName: profile.employeeName,
      supervisorName: profile.supervisorName,
      requestType: activeType,
      title,
      reason,
      customReason,
      durationMinutes,
    });

    if (onNotify) {
      onNotify(`Request sent to Supervisor ${profile.supervisorName} (${title})`);
    }
  };

  const handleSimulateApproval = () => {
    if (!breakRequest) return;
    approveBreakRequest();

    const targetType = breakRequest.requestType;
    if (targetType === 'on_duty') {
      onSetAvailability('on_duty');
      if (onNotify) onNotify(`Supervisor ${profile.supervisorName} approved your request. You are now On Duty.`);
    } else if (targetType === 'off_duty') {
      onSetAvailability('off_duty');
      if (onNotify) onNotify(`Supervisor ${profile.supervisorName} approved your request. You are now Off Duty.`);
    } else if (targetType === 'break') {
      onSetAvailability('break');
      if (onNotify) onNotify(`Supervisor ${profile.supervisorName} approved your break request.`);
    } else {
      if (onNotify) onNotify(`Supervisor ${profile.supervisorName} approved your duty request.`);
    }
    onClose();
  };

  const handleEndBreak = () => {
    completeBreakRequest();
    onSetAvailability('on_duty');
    if (onNotify) {
      onNotify('Break ended. You are now back On Duty.');
    }
    onClose();
  };

  const handleCancelRequest = () => {
    cancelBreakRequest();
    if (onNotify) {
      onNotify('Shift request cancelled.');
    }
  };

  const isPending = breakRequest?.status === 'pending';
  const isOnBreak = currentAvail === 'break';

  const modalContent = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={cn(
          'w-full max-w-lg rounded-3xl border p-4 sm:p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
            : 'border-[#867e6c] bg-[#1e1e1b] text-[#eee8dc]',
        )}
      >
        {/* Modal Header */}
        <div
          className={cn(
            'flex items-start justify-between gap-3 border-b pb-3 shrink-0',
            isLight ? 'border-[#e7e2d7]' : 'border-[#3d3a32]',
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl border shrink-0',
                isLight
                  ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                  : 'border-[#867e6c] bg-[#282720] text-[#ded6c1]',
              )}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className={cn('text-sm sm:text-base font-bold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                {isPending
                  ? 'Duty Request Pending Approval'
                  : isOnBreak
                    ? 'Active Shift Break'
                    : 'Supervisor Duty & Shift Request'}
              </h3>
              <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Supervisor: <strong>{profile.supervisorName}</strong> ({profile.departmentName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-lg transition-colors cursor-pointer shrink-0',
              isLight
                ? 'bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                : 'bg-[#282720] text-[#b7b0a1] hover:text-[#eee8dc]',
            )}
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* State 1: Currently On Break (and no pending request) */}
        {isOnBreak && !isPending && (
          <div className="mt-4 space-y-3.5">
            <div
              className={cn(
                'rounded-2xl border p-4 text-center space-y-2',
                isLight
                  ? 'border-[#ded6c1] bg-[#ebe2cc]/30'
                  : 'border-[#867e6c] bg-[#343127]',
              )}
            >
              <div
                className={cn(
                  'mx-auto grid h-11 w-11 place-items-center rounded-full border',
                  isLight
                    ? 'border-[#b7b09e] bg-white text-[#353229]'
                    : 'border-[#867e6c] bg-[#1e1e1b] text-[#ded6c1]',
                )}
              >
                <Coffee className="h-5 w-5 animate-pulse" />
              </div>
              <h4 className={cn('text-sm font-bold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                You are currently On Break
              </h4>
              <p className={cn('text-xs max-w-sm mx-auto leading-relaxed', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Click below when you are ready to return to duty.
              </p>
            </div>

            <button
              type="button"
              onClick={handleEndBreak}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-xs cursor-pointer',
                isLight
                  ? 'bg-[#353229] text-white hover:bg-[#484438]'
                  : 'bg-[#ded6c1] text-[#28261f] hover:bg-[#e5dfcb]',
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span>End Break & Back to Work</span>
            </button>
          </div>
        )}

        {/* State 2: Request Pending Supervisor Approval */}
        {isPending ? (
          <div className="mt-4 space-y-3.5">
            <div
              className={cn(
                'rounded-2xl border p-3.5 space-y-3',
                isLight
                  ? 'border-amber-300 bg-amber-50/60'
                  : 'border-amber-400/30 bg-amber-400/[0.06]',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Clock className="h-4 w-4 animate-spin text-amber-700 shrink-0" />
                  Waiting for Supervisor
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border uppercase',
                    isLight
                      ? 'border-amber-300 bg-white text-amber-900'
                      : 'border-amber-400/40 bg-amber-400/20 text-amber-200',
                  )}
                >
                  Pending
                </span>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-3 text-xs space-y-1.5',
                  isLight ? 'border-[#e7e2d7] bg-white' : 'border-[#3d3a32] bg-[#282720]/60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('font-bold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                    {breakRequest?.title || 'Duty Request'}
                  </span>
                  <span className={cn('text-[10px] font-mono', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')}>
                    {breakRequest?.requestedAt}
                  </span>
                </div>
                <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                  Reason: <strong>{breakRequest?.reason}</strong>
                </p>
                {breakRequest?.durationMinutes && (
                  <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                    Requested Duration: <strong>{breakRequest.durationMinutes} minutes</strong>
                  </p>
                )}
                {breakRequest?.customReason && (
                  <p className={cn('text-[11px] italic pt-1 border-t', isLight ? 'border-[#e7e2d7] text-[#686252]' : 'border-[#3d3a32] text-[#b7b0a1]')}>
                    &ldquo;{breakRequest.customReason}&rdquo;
                  </p>
                )}
              </div>

              <p className={cn('text-[11px] leading-relaxed', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Supervisor <strong>{profile.supervisorName}</strong> has been notified on the department roster. Status remains unchanged until approved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelRequest}
                className={cn(
                  'w-full sm:flex-1 rounded-xl border py-2 px-3 text-xs font-semibold transition-colors cursor-pointer text-center',
                  isLight
                    ? 'border-[#e7e2d7] bg-white text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-[#3d3a32] bg-[#1e1e1b] text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#282720]',
                )}
              >
                Cancel Request
              </button>

              <button
                type="button"
                onClick={handleSimulateApproval}
                className={cn(
                  'w-full sm:flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all shadow-xs cursor-pointer',
                  isLight
                    ? 'bg-[#353229] text-white hover:bg-[#484438]'
                    : 'bg-[#ded6c1] text-[#28261f] hover:bg-[#e5dfcb]',
                )}
                title="Simulate supervisor approval to transition duty status"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Approve (Demo)</span>
              </button>
            </div>
          </div>
        ) : !isOnBreak && (
          /* State 3: Duty & Shift Request Form */
          <div className="mt-3.5 flex-1 flex flex-col space-y-3.5 overflow-y-auto no-scrollbar">
            {/* Request Type Selector: 3 Tabs */}
            <div>
              <label className={cn('block text-[11px] font-semibold uppercase tracking-wider mb-1.5', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Select Request Type:
              </label>
              <div
                className={cn(
                  'grid grid-cols-3 gap-1.5 p-1 rounded-2xl border transition-colors',
                  isLight ? 'border-[#e7e2d7] bg-[#f6f3ec]' : 'border-[#3d3a32] bg-[#282720]',
                )}
              >
                {/* On Duty */}
                <button
                  type="button"
                  onClick={() => setActiveType('on_duty')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer',
                    activeType === 'on_duty'
                      ? isLight
                        ? 'bg-[#353229] text-white shadow-xs'
                        : 'bg-[#ded6c1] text-[#28261f] shadow-xs'
                      : isLight
                        ? 'border border-transparent text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                        : 'border border-transparent text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#1e1e1b]',
                  )}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>On Duty</span>
                </button>

                {/* Off Duty */}
                <button
                  type="button"
                  onClick={() => setActiveType('off_duty')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer',
                    activeType === 'off_duty'
                      ? isLight
                        ? 'bg-[#353229] text-white shadow-xs'
                        : 'bg-[#ded6c1] text-[#28261f] shadow-xs'
                      : isLight
                        ? 'border border-transparent text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                        : 'border border-transparent text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#1e1e1b]',
                  )}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>Off Duty</span>
                </button>

                {/* On Break */}
                <button
                  type="button"
                  onClick={() => setActiveType('break')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer',
                    activeType === 'break'
                      ? isLight
                        ? 'bg-[#353229] text-white shadow-xs'
                        : 'bg-[#ded6c1] text-[#28261f] shadow-xs'
                      : isLight
                        ? 'border border-transparent text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                        : 'border border-transparent text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#1e1e1b]',
                  )}
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>On Break</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ON DUTY REASONS */}
            {activeType === 'on_duty' && (
              <div className="space-y-2">
                <label className={cn('block text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                  Select On Duty Reason:
                </label>
                <div className="space-y-1.5 max-h-[38vh] overflow-y-auto no-scrollbar pr-0.5">
                  {ON_DUTY_REASONS.map((opt) => {
                    const isSelected = onDutyReasonId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setOnDutyReasonId(opt.id)}
                        className={cn(
                          'flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all',
                          isSelected
                            ? isLight
                              ? 'border-[#353229] bg-[#f6f3ec] shadow-2xs font-medium'
                              : 'border-[#867e6c] bg-[#343127] text-[#ded6c1] font-medium'
                            : isLight
                              ? 'border-[#e7e2d7] bg-white text-[#686252] hover:bg-[#fbfaf7]'
                              : 'border-[#3d3a32] bg-[#1e1e1b] text-[#b7b0a1] hover:bg-[#282720] hover:text-[#eee8dc]',
                        )}
                      >
                        <input
                          type="radio"
                          name="on_duty_reason"
                          checked={isSelected}
                          onChange={() => setOnDutyReasonId(opt.id)}
                          className={cn('mt-0.5', isLight ? 'accent-[#353229]' : 'accent-[#ded6c1]')}
                        />
                        <div className="min-w-0 flex-1">
                          <span className={cn('text-xs font-semibold block', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                            {opt.label}
                          </span>
                          <span className={cn('text-[11px] block mt-0.5', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                            {opt.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                  {onDutyReasonId === 'other' && (
                    <div className="pt-1">
                      <textarea
                        value={customOnDutyReason}
                        onChange={(e) => setCustomOnDutyReason(e.target.value)}
                        placeholder="Type custom explanation for requesting On Duty status..."
                        rows={2}
                        className={cn(
                          'w-full rounded-xl border p-2 text-xs focus:outline-none resize-none',
                          isLight
                            ? 'border-[#b7b09e] bg-white text-[#353229] placeholder-[#8c8472] focus:border-[#353229]'
                            : 'border-[#3d3a32] bg-[#282720]/60 text-[#eee8dc] placeholder-[#b7b0a1] focus:border-[#867e6c]',
                        )}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: OFF DUTY REASONS */}
            {activeType === 'off_duty' && (
              <div className="space-y-2">
                <label className={cn('block text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                  Select Off Duty Reason:
                </label>
                <div className="space-y-1.5 max-h-[38vh] overflow-y-auto no-scrollbar pr-0.5">
                  {OFF_DUTY_REASONS.map((opt) => {
                    const isSelected = offDutyReasonId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setOffDutyReasonId(opt.id)}
                        className={cn(
                          'flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all',
                          isSelected
                            ? isLight
                              ? 'border-[#353229] bg-[#f6f3ec] shadow-2xs font-medium'
                              : 'border-[#867e6c] bg-[#343127] text-[#ded6c1] font-medium'
                            : isLight
                              ? 'border-[#e7e2d7] bg-white text-[#686252] hover:bg-[#fbfaf7]'
                              : 'border-[#3d3a32] bg-[#1e1e1b] text-[#b7b0a1] hover:bg-[#282720] hover:text-[#eee8dc]',
                        )}
                      >
                        <input
                          type="radio"
                          name="off_duty_reason"
                          checked={isSelected}
                          onChange={() => setOffDutyReasonId(opt.id)}
                          className={cn('mt-0.5', isLight ? 'accent-[#353229]' : 'accent-[#ded6c1]')}
                        />
                        <div className="min-w-0 flex-1">
                          <span className={cn('text-xs font-semibold block', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                            {opt.label}
                          </span>
                          <span className={cn('text-[11px] block mt-0.5', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                            {opt.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                  {offDutyReasonId === 'other' && (
                    <div className="pt-1">
                      <textarea
                        value={customOffDutyReason}
                        onChange={(e) => setCustomOffDutyReason(e.target.value)}
                        placeholder="Type custom explanation for signing Off Duty..."
                        rows={2}
                        className={cn(
                          'w-full rounded-xl border p-2 text-xs focus:outline-none resize-none',
                          isLight
                            ? 'border-[#b7b09e] bg-white text-[#353229] placeholder-[#8c8472] focus:border-[#353229]'
                            : 'border-[#3d3a32] bg-[#282720]/60 text-[#eee8dc] placeholder-[#b7b0a1] focus:border-[#867e6c]',
                        )}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BREAK OPTIONS */}
            {activeType === 'break' && (
              <div className="space-y-2">
                <label className={cn('block text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                  Select Break Window:
                </label>
                <div className="space-y-1.5 max-h-[38vh] overflow-y-auto no-scrollbar pr-0.5">
                  {BREAK_OPTIONS.map((opt) => {
                    const isSelected = breakOptionId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setBreakOptionId(opt.id)}
                        className={cn(
                          'flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all',
                          isSelected
                            ? isLight
                              ? 'border-[#353229] bg-[#f6f3ec] shadow-2xs font-medium'
                              : 'border-[#867e6c] bg-[#343127] text-[#ded6c1] font-medium'
                            : isLight
                              ? 'border-[#e7e2d7] bg-white text-[#686252] hover:bg-[#fbfaf7]'
                              : 'border-[#3d3a32] bg-[#1e1e1b] text-[#b7b0a1] hover:bg-[#282720] hover:text-[#eee8dc]',
                        )}
                      >
                        <input
                          type="radio"
                          name="break_reason"
                          checked={isSelected}
                          onChange={() => setBreakOptionId(opt.id)}
                          className={cn('mt-0.5', isLight ? 'accent-[#353229]' : 'accent-[#ded6c1]')}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                              {opt.label}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold',
                                isLight ? 'border-[#e7e2d7] bg-white' : 'border-[#3d3a32] bg-[#282720] text-[#ded6c1]',
                              )}
                            >
                              {opt.durationMinutes}m
                            </span>
                          </div>
                          <span className={cn('text-[11px] block mt-0.5', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                            {opt.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                  {breakOptionId === 'other' && (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[11px] font-semibold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                          Break Duration:
                        </span>
                        <input
                          type="number"
                          min={5}
                          max={60}
                          step={5}
                          value={customBreakMinutes}
                          onChange={(e) => setCustomBreakMinutes(Math.max(5, Math.min(60, Number(e.target.value) || 20)))}
                          className={cn(
                            'w-20 rounded-lg border p-1 text-xs text-center focus:outline-none',
                            isLight ? 'border-[#b7b09e] bg-white text-[#353229]' : 'border-[#3d3a32] bg-[#282720] text-[#eee8dc]',
                          )}
                        />
                        <span className="text-[11px]">minutes</span>
                      </div>
                      <textarea
                        value={customBreakReason}
                        onChange={(e) => setCustomBreakReason(e.target.value)}
                        placeholder="Type coverage note / reason..."
                        rows={2}
                        className={cn(
                          'w-full rounded-xl border p-2 text-xs focus:outline-none resize-none',
                          isLight
                            ? 'border-[#b7b09e] bg-white text-[#353229] placeholder-[#8c8472] focus:border-[#353229]'
                            : 'border-[#3d3a32] bg-[#282720]/60 text-[#eee8dc] placeholder-[#b7b0a1] focus:border-[#867e6c]',
                        )}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div
              className="flex items-center justify-end gap-2 pt-3 mt-auto shrink-0"
            >
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  isLight
                    ? 'border-[#e7e2d7] bg-white text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-[#3d3a32] text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#282720]',
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer',
                  isLight
                    ? 'bg-[#353229] text-white hover:bg-[#484438]'
                    : 'bg-[#ded6c1] text-[#28261f] hover:bg-[#e5dfcb]',
                )}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Request</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
