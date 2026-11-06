'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Coffee,
  Clock,
  X,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/lib/store';
import {
  BREAK_OPTIONS,
  DUTY_KIND_LABEL,
  OFF_DUTY_REASONS,
  ON_DUTY_REASONS,
  useBreakRequest,
  useDutyRequest,
  type RequestKind,
} from './breakRequests';
import type { FulfillerProfile } from './fulfillerProfiles';

type Availability = 'on_duty' | 'break' | 'off_duty';

interface BreakRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FulfillerProfile;
  isLight: boolean;
  currentAvail: Availability;
  onSetAvailability: (status: Availability) => void;
  onNotify?: (message: string) => void;
  /** Request type to pre-select when the dialog opens (defaults from the current status). */
  initialKind?: RequestKind;
}

const KIND_META: Record<RequestKind, { label: string; icon: typeof Coffee }> = {
  break: { label: 'Break', icon: Coffee },
  on_duty: { label: 'On Duty', icon: ShieldCheck },
  off_duty: { label: 'Off Duty', icon: Power },
};

/** Which requests make sense for the fulfiller's current status. */
function availableKinds(avail: Availability): RequestKind[] {
  if (avail === 'off_duty') return ['on_duty'];
  if (avail === 'on_duty') return ['break', 'off_duty'];
  return [];
}

const defaultKindFor = (avail: Availability): RequestKind =>
  avail === 'off_duty' ? 'on_duty' : 'break';

export function BreakRequestModal({
  isOpen,
  onClose,
  profile,
  isLight,
  currentAvail,
  onSetAvailability,
  onNotify,
  initialKind,
}: BreakRequestModalProps) {
  const { notifyDepartmentSupervisor } = useDemo();
  const {
    breakRequest,
    createBreakRequest,
    approveBreakRequest,
    cancelBreakRequest,
    completeBreakRequest,
  } = useBreakRequest();
  const { dutyRequest, createDutyRequest, approveDutyRequest, cancelDutyRequest } = useDutyRequest();

  const [requestKind, setRequestKind] = useState<RequestKind>(initialKind ?? defaultKindFor(currentAvail));
  const [selectedOptionId, setSelectedOptionId] = useState<string>(BREAK_OPTIONS[0].id);
  const [customMinutes, setCustomMinutes] = useState<number>(20);
  const [reason, setReason] = useState<string>('');
  const [dutyReasonId, setDutyReasonId] = useState<string>('');
  const [dutyNote, setDutyNote] = useState<string>('');

  // Pre-select the right request type each time the dialog opens.
  useEffect(() => {
    if (isOpen) {
      setRequestKind(initialKind ?? defaultKindFor(currentAvail));
      setDutyReasonId('');
      setDutyNote('');
    }
  }, [isOpen, initialKind, currentAvail]);

  if (!isOpen) return null;

  const kinds = availableKinds(currentAvail);
  const activeKind: RequestKind = kinds.includes(requestKind) ? requestKind : (kinds[0] ?? 'break');

  const selectedOption =
    BREAK_OPTIONS.find((opt) => opt.id === selectedOptionId) || BREAK_OPTIONS[0];

  const effectiveDuration =
    selectedOptionId === 'other' ? customMinutes : selectedOption.durationMinutes;

  const dutyReasons = activeKind === 'on_duty' ? ON_DUTY_REASONS : OFF_DUTY_REASONS;
  const selectedDutyReason = dutyReasons.find((r) => r.id === dutyReasonId) ?? dutyReasons[0];

  /* ---------------- Break request handlers ---------------- */

  const handleSubmitBreak = () => {
    createBreakRequest({
      employeeName: profile.employeeName,
      supervisorName: profile.supervisorName,
      breakType: selectedOption.label,
      durationMinutes: effectiveDuration,
      reason: reason.trim() || undefined,
    });
    notifyDepartmentSupervisor({
      department: profile.departmentName,
      title: `Break Request · ${profile.employeeName}`,
      message: `${profile.employeeName} (${profile.employeeId}, ${profile.departmentName}) is requesting a break: ${selectedOption.label} (${effectiveDuration} min).${reason.trim() ? ` Note: ${reason.trim()}` : ''}`,
      tone: 'warning',
    });
    if (onNotify) {
      onNotify(`Break request sent to ${profile.supervisorName} (${selectedOption.label})`);
    }
  };

  const handleSimulateApproval = () => {
    approveBreakRequest();
    onSetAvailability('break');
    if (onNotify) {
      onNotify(`Supervisor ${profile.supervisorName} approved your break request.`);
    }
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
      onNotify('Break request cancelled.');
    }
  };

  /* ---------------- On Duty / Off Duty request handlers ---------------- */

  const handleSubmitDuty = () => {
    if (activeKind !== 'on_duty' && activeKind !== 'off_duty') return;
    const kindLabel = DUTY_KIND_LABEL[activeKind];
    const note = dutyNote.trim();
    createDutyRequest({
      kind: activeKind,
      employeeName: profile.employeeName,
      employeeId: profile.employeeId,
      departmentName: profile.departmentName,
      supervisorName: profile.supervisorName,
      reasonLabel: selectedDutyReason.label,
      note: note || undefined,
    });
    notifyDepartmentSupervisor({
      department: profile.departmentName,
      title: `${kindLabel} Request · ${profile.employeeName}`,
      message: `${profile.employeeName} (${profile.employeeId}, ${profile.departmentName}) is requesting to go ${kindLabel}: ${selectedDutyReason.label}.${note ? ` Note: ${note}` : ''}`,
      tone: activeKind === 'off_duty' ? 'warning' : 'info',
    });
    if (onNotify) {
      onNotify(`${kindLabel} request sent to ${profile.supervisorName}`);
    }
  };

  const handleSimulateDutyApproval = () => {
    const approved = approveDutyRequest();
    if (!approved) return;
    onSetAvailability(approved.kind);
    if (onNotify) {
      onNotify(`Supervisor ${profile.supervisorName} approved your ${DUTY_KIND_LABEL[approved.kind]} request.`);
    }
    onClose();
  };

  const handleCancelDutyRequest = () => {
    cancelDutyRequest();
    if (onNotify) {
      onNotify('Duty request cancelled.');
    }
  };

  const isPending = breakRequest?.status === 'pending';
  const isDutyPending = dutyRequest?.status === 'pending';
  const isOnBreak = currentAvail === 'break';

  const headerTitle = isOnBreak
    ? 'Active Shift Break'
    : isPending
      ? 'Break Request Pending'
      : isDutyPending && dutyRequest
        ? `${DUTY_KIND_LABEL[dutyRequest.kind]} Request Pending`
        : activeKind === 'break'
          ? 'Request Break from Supervisor'
          : `Request ${DUTY_KIND_LABEL[activeKind]} from Supervisor`;

  const radioCardClass = (isSelected: boolean) =>
    cn(
      'flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition-all',
      isSelected
        ? isLight
          ? 'border-[#353229] bg-[#f6f3ec] shadow-xs'
          : 'border-[#dfc187] bg-[rgba(200,169,110,0.1)] shadow-sm'
        : isLight
          ? 'border-[#e7e2d7] bg-[#ffffff] hover:bg-[#fbfaf7]'
          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
    );

  const primaryButtonClass = cn(
    'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer',
    isLight
      ? 'bg-[#353229] text-white hover:bg-[#484438]'
      : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
  );

  const modalContent = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={cn(
          'w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto no-scrollbar',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
            : 'border-[rgba(165,130,95,0.3)] bg-[#161513] text-[#f7f4ed]',
        )}
      >
        {/* Modal Header */}
        <div
          className={cn(
            'flex items-start justify-between gap-3 border-b pb-3.5',
            isLight ? 'border-[#e7e2d7]' : 'border-[rgba(165,130,95,0.2)]',
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'grid h-10 w-10 place-items-center rounded-2xl border shrink-0',
                isLight
                  ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                  : 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.12)] text-[#dfc187]',
              )}
            >
              {(() => {
                const HeaderIcon =
                  isOnBreak || isPending || activeKind === 'break' ? Coffee : KIND_META[activeKind].icon;
                return <HeaderIcon className="h-5 w-5" />;
              })()}
            </div>
            <div>
              <h3 className={cn('text-sm sm:text-base font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
                {headerTitle}
              </h3>
              <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#686252]' : 'text-[#ded6c9]')}>
                Supervisor: <strong>{profile.supervisorName}</strong> ({profile.departmentName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'grid h-8 w-8 place-items-center rounded-full transition-colors cursor-pointer shrink-0',
              isLight
                ? 'bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                : 'bg-white/10 text-[#ded6c9] hover:text-white',
            )}
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Supervisor Management Policy Callout */}
        <div
          className={cn(
            'mt-3.5 rounded-2xl border p-3 text-xs space-y-1',
            isLight
              ? 'border-[#e7e2d7] bg-[#fbfaf7]'
              : 'border-[rgba(165,130,95,0.2)] bg-white/[0.02]',
          )}
        >
          <div className="flex items-center gap-1.5 font-bold text-[11px]">
            <ShieldCheck className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
            <span>Supervisor Managed Duty Policy</span>
          </div>
          <p className={cn('text-[11px] leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-400')}>
            <strong>On Duty</strong> and <strong>Off Duty</strong> statuses are roster-controlled and managed by your Department Supervisor. Send a break, On Duty or Off Duty request and it goes to your supervisor for approval.
          </p>
        </div>

        {/* State 1: Currently On Break */}
        {isOnBreak ? (
          <div className="mt-4 space-y-4">
            <div
              className={cn(
                'rounded-2xl border p-4 text-center space-y-2',
                isLight
                  ? 'border-[#ded6c1] bg-[#ebe2cc]/40'
                  : 'border-[rgba(165,130,95,0.4)] bg-[rgba(200,169,110,0.1)]',
              )}
            >
              <div
                className={cn(
                  'mx-auto grid h-12 w-12 place-items-center rounded-full border',
                  isLight
                    ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229]'
                    : 'border-[rgba(165,130,95,0.4)] bg-[#1a1918] text-[#dfc187]',
                )}
              >
                <Coffee className="h-6 w-6 animate-pulse" />
              </div>
              <h4 className={cn('text-sm font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
                You are currently On Break
              </h4>
              <p className={cn('text-xs max-w-sm mx-auto leading-relaxed', isLight ? 'text-[#686252]' : 'text-[#ded6c9]')}>
                Your break is recorded in the department roster. When you are ready to resume assigned guest services, click below.
              </p>
              {breakRequest?.status === 'approved' && breakRequest.endsAt && (
                <p className={cn('text-[11px] font-mono', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
                  Scheduled to end at{' '}
                  <strong>
                    {new Date(breakRequest.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>{' '}
                  · you return to On Duty automatically
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleEndBreak}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-bold transition-all shadow-md cursor-pointer',
                isLight
                  ? 'bg-[#353229] text-white hover:bg-[#484438]'
                  : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span>End Break & Return to On Duty</span>
            </button>
          </div>
        ) : isPending ? (
          /* State 2: Break Request Pending Supervisor Approval */
          <div className="mt-4 space-y-4">
            <div
              className={cn(
                'rounded-2xl border p-4 space-y-3',
                isLight
                  ? 'border-amber-300/80 bg-amber-50/50'
                  : 'border-amber-400/30 bg-amber-400/[0.06]',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Clock className="h-4 w-4 animate-spin text-amber-700" />
                  Awaiting Supervisor Approval
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border uppercase',
                    isLight
                      ? 'border-amber-300 bg-amber-100 text-amber-900'
                      : 'border-amber-400/40 bg-amber-400/20 text-amber-200',
                  )}
                >
                  Pending Review
                </span>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-3 text-xs space-y-1',
                  isLight ? 'border-[#e7e2d7] bg-[#ffffff]' : 'border-white/10 bg-black/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
                    {breakRequest?.breakType}
                  </span>
                  <span className={cn('text-[11px] font-mono', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
                    Requested: {breakRequest?.requestedAt}
                  </span>
                </div>
                <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                  Duration: <strong>{breakRequest?.durationMinutes} minutes</strong> · Supervisor: {breakRequest?.supervisorName}
                </p>
                {breakRequest?.reason && (
                  <p className={cn('text-[11px] italic pt-1 border-t', isLight ? 'border-[#e7e2d7] text-[#686252]' : 'border-white/5 text-mist-300')}>
                    &ldquo;{breakRequest.reason}&rdquo;
                  </p>
                )}
              </div>

              <p className={cn('text-[11px] leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                Supervisor <strong>{profile.supervisorName}</strong> has been notified via the department console. You will remain <strong>On Duty</strong> until approved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelRequest}
                className={cn(
                  'w-full sm:flex-1 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer text-center',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
                )}
              >
                Cancel Request
              </button>

              {/* Demo Helper: Simulate Supervisor Approval */}
              <button
                type="button"
                onClick={handleSimulateApproval}
                className={cn(
                  'w-full sm:flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all shadow-sm cursor-pointer',
                  isLight
                    ? 'bg-[#353229] text-white hover:bg-[#484438]'
                    : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
                )}
                title="Simulate supervisor approval to enter On Break status"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Simulate Approval (Demo)</span>
              </button>
            </div>
          </div>
        ) : isDutyPending && dutyRequest ? (
          /* State 3: On Duty / Off Duty Request Pending Supervisor Approval */
          <div className="mt-4 space-y-4">
            <div
              className={cn(
                'rounded-2xl border p-4 space-y-3',
                isLight
                  ? 'border-amber-300/80 bg-amber-50/50'
                  : 'border-amber-400/30 bg-amber-400/[0.06]',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Clock className="h-4 w-4 animate-spin text-amber-700" />
                  Awaiting Supervisor Approval
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border uppercase',
                    isLight
                      ? 'border-amber-300 bg-amber-100 text-amber-900'
                      : 'border-amber-400/40 bg-amber-400/20 text-amber-200',
                  )}
                >
                  Pending Review
                </span>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-3 text-xs space-y-1',
                  isLight ? 'border-[#e7e2d7] bg-[#ffffff]' : 'border-white/10 bg-black/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
                    {DUTY_KIND_LABEL[dutyRequest.kind]} Request
                  </span>
                  <span className={cn('text-[11px] font-mono', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
                    Requested: {dutyRequest.requestedAt}
                  </span>
                </div>
                <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                  Reason: <strong>{dutyRequest.reasonLabel}</strong> · Supervisor: {dutyRequest.supervisorName}
                </p>
                {dutyRequest.note && (
                  <p className={cn('text-[11px] italic pt-1 border-t', isLight ? 'border-[#e7e2d7] text-[#686252]' : 'border-white/5 text-mist-300')}>
                    &ldquo;{dutyRequest.note}&rdquo;
                  </p>
                )}
              </div>

              <p className={cn('text-[11px] leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                Supervisor <strong>{dutyRequest.supervisorName}</strong> has been notified via the department console. You will remain{' '}
                <strong>{currentAvail === 'off_duty' ? 'Off Duty' : 'On Duty'}</strong> until approved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelDutyRequest}
                className={cn(
                  'w-full sm:flex-1 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer text-center',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
                )}
              >
                Cancel Request
              </button>

              {/* Demo Helper: Simulate Supervisor Approval */}
              <button
                type="button"
                onClick={handleSimulateDutyApproval}
                className={cn(
                  'w-full sm:flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all shadow-sm cursor-pointer',
                  isLight
                    ? 'bg-[#353229] text-white hover:bg-[#484438]'
                    : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
                )}
                title={`Simulate supervisor approval to switch to ${DUTY_KIND_LABEL[dutyRequest.kind]}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Simulate Approval (Demo)</span>
              </button>
            </div>
          </div>
        ) : (
          /* State 4: Request Form (Break / On Duty / Off Duty) */
          <div className="mt-4 space-y-4">
            {/* Request type selector (only when more than one type applies) */}
            {kinds.length > 1 && (
              <div>
                <label className={cn('block text-xs font-bold mb-2', isLight ? 'text-[#353229]' : 'text-white')}>
                  Request Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {kinds.map((k) => {
                    const KindIcon = KIND_META[k].icon;
                    const isSelected = k === activeKind;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setRequestKind(k)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all cursor-pointer',
                          isSelected
                            ? isLight
                              ? 'border-[#353229] bg-[#f6f3ec] text-[#353229]'
                              : 'border-[#dfc187] bg-[rgba(200,169,110,0.1)] text-white'
                            : isLight
                              ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#fbfaf7]'
                              : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/[0.04]',
                        )}
                      >
                        <KindIcon className="h-3.5 w-3.5" />
                        <span>{KIND_META[k].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeKind === 'break' ? (
              <>
                <div>
                  <label className={cn('block text-xs font-bold mb-2', isLight ? 'text-[#353229]' : 'text-white')}>
                    Select Break Interval:
                  </label>

                  <div className="space-y-2">
                    {BREAK_OPTIONS.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <label
                          key={opt.id}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={radioCardClass(isSelected)}
                        >
                          <input
                            type="radio"
                            name="break_option"
                            checked={isSelected}
                            onChange={() => setSelectedOptionId(opt.id)}
                            className={cn('mt-0.5', isLight ? 'accent-[#353229]' : 'accent-[#dfc187]')}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn('text-xs font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
                                {opt.label}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold',
                                  isLight
                                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                                    : 'border-white/10 bg-black/30 text-[#dfc187]',
                                )}
                              >
                                {opt.durationMinutes} mins
                              </span>
                            </div>
                            <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#686252]' : 'text-mist-400')}>
                              {opt.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Minutes Input if 'other' is selected */}
                {selectedOptionId === 'other' && (
                  <div
                    className={cn(
                      'rounded-xl border p-3 animate-in fade-in duration-150',
                      isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/10 bg-white/[0.03]',
                    )}
                  >
                    <label className={cn('block text-xs font-semibold mb-1', isLight ? 'text-[#353229]' : 'text-white')}>
                      Requested Break Duration (Minutes):
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      step={5}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(5, Math.min(60, Number(e.target.value) || 20)))}
                      className={cn(
                        'w-full rounded-xl border p-2 text-xs focus:outline-none',
                        isLight
                          ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229] focus:border-[#353229]'
                          : 'border-white/20 bg-black/40 text-white focus:border-[#dfc187]',
                      )}
                    />
                  </div>
                )}

                {/* Optional Reason / Handover Note */}
                <div>
                  <label className={cn('block text-xs font-semibold mb-1', isLight ? 'text-[#353229]' : 'text-white')}>
                    Handover Notes / Coverage Reason (Optional):
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g. Completed room 402, floor runner is covering room 305..."
                    rows={2}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-xs focus:outline-none resize-none',
                      isLight
                        ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229] placeholder-[#8c8472] focus:border-[#353229]'
                        : 'border-white/20 bg-white/[0.04] text-white placeholder:text-mist-400 focus:border-[#dfc187]',
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={cn('block text-xs font-bold mb-2', isLight ? 'text-[#353229]' : 'text-white')}>
                    Reason for {DUTY_KIND_LABEL[activeKind]} Request:
                  </label>

                  <div className="space-y-2">
                    {dutyReasons.map((opt) => {
                      const isSelected = selectedDutyReason.id === opt.id;
                      return (
                        <label
                          key={opt.id}
                          onClick={() => setDutyReasonId(opt.id)}
                          className={radioCardClass(isSelected)}
                        >
                          <input
                            type="radio"
                            name="duty_reason"
                            checked={isSelected}
                            onChange={() => setDutyReasonId(opt.id)}
                            className={cn('mt-0.5', isLight ? 'accent-[#353229]' : 'accent-[#dfc187]')}
                          />
                          <div className="min-w-0 flex-1">
                            <span className={cn('text-xs font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
                              {opt.label}
                            </span>
                            <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#686252]' : 'text-mist-400')}>
                              {opt.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={cn('block text-xs font-semibold mb-1', isLight ? 'text-[#353229]' : 'text-white')}>
                    Note to Supervisor (Optional):
                  </label>
                  <textarea
                    value={dutyNote}
                    onChange={(e) => setDutyNote(e.target.value)}
                    placeholder={
                      activeKind === 'off_duty'
                        ? 'E.g. Rooms 402 and 305 handed over to the floor runner...'
                        : 'E.g. Ready to take Floors 1–5 from the start of the shift...'
                    }
                    rows={2}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-xs focus:outline-none resize-none',
                      isLight
                        ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229] placeholder-[#8c8472] focus:border-[#353229]'
                        : 'border-white/20 bg-white/[0.04] text-white placeholder:text-mist-400 focus:border-[#dfc187]',
                    )}
                  />
                </div>

                <p className={cn('text-[11px] leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-400')}>
                  {activeKind === 'off_duty'
                    ? 'Finish or hand over your active tasks before clock-out. You stay On Duty until your supervisor approves.'
                    : 'You stay Off Duty and cannot claim tasks until your supervisor approves.'}
                </p>
              </>
            )}

            {/* Actions */}
            <div
              className={cn(
                'flex items-center justify-end gap-2 border-t pt-3.5',
                isLight ? 'border-[#e7e2d7]' : 'border-white/10',
              )}
            >
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-white/10 text-mist-300 hover:text-white',
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={activeKind === 'break' ? handleSubmitBreak : handleSubmitDuty}
                className={primaryButtonClass}
              >
                {(() => {
                  const SubmitIcon = KIND_META[activeKind].icon;
                  return <SubmitIcon className="h-3.5 w-3.5" />;
                })()}
                <span>
                  {activeKind === 'break' ? 'Send Break Request' : `Send ${DUTY_KIND_LABEL[activeKind]} Request`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
