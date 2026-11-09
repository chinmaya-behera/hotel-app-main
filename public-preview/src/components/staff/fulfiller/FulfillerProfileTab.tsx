'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  Clock,
  Coffee,
  HeartPulse,
  LogOut,
  Moon,
  Power,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserCheck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { FULFILLER_PROFILES, type FulfillerProfile } from './fulfillerProfiles';
import { cn } from '@/lib/utils';
import { playChime } from './chime';
import { BreakRequestModal } from './BreakRequestModal';
import { useBreakRequest, type DutyRequestType } from './breakRequests';

const EMERGENCY_REASONS = [
  'Medical emergency / sudden illness',
  'Family emergency requiring departure',
  'Severe physical fatigue / safety concern',
  'Extended shift relief / handover needed',
];


function FulfillerModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTarget(document.getElementById('fulfiller-phone-shell') || (typeof document !== 'undefined' ? document.body : null));
  }, []);

  if (!mounted || !target) return null;
  return createPortal(children, target);
}

interface FulfillerProfileTabProps {
  profile?: FulfillerProfile;
}

export function FulfillerProfileTab({ profile }: FulfillerProfileTabProps) {
  const activeProfile = profile || FULFILLER_PROFILES.housekeeping;
  const router = useRouter();
  const {
    state,
    setTheme,
    setSoundEnabled,
    setFulfillerAvailability,
    requestEmergencyShiftChange,
    notify,
  } = useDemo();

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [dutyModalInitialType, setDutyModalInitialType] = useState<DutyRequestType>('break');
  const [supervisorNotice, setSupervisorNotice] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState(EMERGENCY_REASONS[0]);
  const [emergencyNotes, setEmergencyNotes] = useState('');

  const { breakRequest, approveBreakRequest, completeBreakRequest } = useBreakRequest();

  const currentAvail = state.fulfillerAvailability ?? 'on_duty';
  const isSoundOn = state.soundEnabled ?? true;
  const isLight = state.theme === 'light';
  const shiftRequest = state.shiftChangeRequest;

  function handleEmergencySubmit() {
    requestEmergencyShiftChange(emergencyReason, emergencyNotes);
    setEmergencyModalOpen(false);
    setEmergencyNotes('');
  }

  function handleLogoutConfirm() {
    setLogoutModalOpen(false);
    router.push('/login');
  }

  return (
    <div className={cn('flex flex-col gap-4 pb-6 sm:pb-8 text-xs', isLight ? 'text-[#353229]' : 'text-white')}>
      {/* Profile Card */}
      <div
        className={cn(
          'rounded-3xl border p-5 transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-lg',
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn('grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br font-display text-lg font-bold text-ink-950 shadow-md', activeProfile.colorGradient)}>
            {activeProfile.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={cn('text-base font-bold', isLight ? 'text-[#353229]' : 'text-white')}>{activeProfile.employeeName}</h2>
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-bold font-mono border',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                    : 'bg-white/15 text-white border-transparent',
                )}
              >
                {activeProfile.employeeId}
              </span>
            </div>
            <p className={cn('text-xs mt-0.5 font-medium', isLight ? 'text-[#686252]' : 'text-mist-200')}>{activeProfile.roleTitle}</p>
            <p className={cn('text-[11px]', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>{activeProfile.zone}</p>
          </div>
        </div>

        {/* Assigned Work Callout */}
        <div
          className={cn(
            'mt-3.5 rounded-2xl border p-3 text-xs space-y-1.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#fbfaf7]'
              : 'border-emerald-400/20 bg-emerald-400/[0.04]',
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                isLight ? 'text-[#353229]' : 'text-emerald-300',
              )}
            >
              Documented Assigned Work
            </span>
            <span className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>{activeProfile.departmentName}</span>
          </div>
          <p className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>{activeProfile.assignedWork}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeProfile.assignedWorkTags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] border',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                    : 'bg-white/10 text-mist-200 border-transparent',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Supervisor & Shift Details */}
        <div
          className={cn(
            'mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs',
            isLight ? 'border-[#e7e2d7]' : 'border-white/10',
          )}
        >
          <div
            className={cn(
              'rounded-xl border p-2.5 transition-colors',
              isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/5 bg-white/[0.02]',
            )}
          >
            <span className={cn('text-[10px] flex items-center gap-1', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
              <UserCheck className={cn('h-3 w-3', isLight ? 'text-[#353229]' : 'text-emerald-400')} /> Department Supervisor
            </span>
            <p className={cn('mt-1 font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>{activeProfile.supervisorName}</p>
            <p className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>{activeProfile.supervisorCode} · {activeProfile.departmentName}</p>
          </div>

          <div
            className={cn(
              'rounded-xl border p-2.5 transition-colors',
              isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/5 bg-white/[0.02]',
            )}
          >
            <span className={cn('text-[10px] flex items-center gap-1', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
              <Clock className={cn('h-3 w-3', isLight ? 'text-[#353229]' : 'text-sky-400')} /> Current Shift
            </span>
            <p className={cn('mt-1 font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>Day Shift (08:00–16:30)</p>
            <p className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>Active Duty Window</p>
          </div>
        </div>
      </div>

      {/* Duty Availability Status Section */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 transition-colors space-y-3.5',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-[rgba(165,130,95,0.25)] bg-[#1a1918]',
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>Duty Availability Status</h3>
            <p className={cn('text-[10px] mt-0.5', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
              Managed by Department Supervisor <strong>{activeProfile.supervisorName}</strong>
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
              breakRequest?.status === 'pending'
                ? isLight
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                : currentAvail === 'on_duty'
                  ? isLight
                    ? 'bg-[#ebe2cc] text-[#353229] border-[#ded6c1]'
                    : 'bg-[#c8a96e]/20 text-[#dfc187] border-[rgba(165,130,95,0.3)]'
                  : currentAvail === 'break'
                    ? isLight
                      ? 'bg-[#f6f3ec] text-[#686252] border-[#e7e2d7]'
                      : 'bg-[#dfc187]/15 text-[#e2d2bd] border-[rgba(165,130,95,0.3)]'
                    : 'bg-rose-500/20 text-rose-500 border-rose-300',
            )}
          >
            {breakRequest?.status === 'pending'
              ? 'Break Requested'
              : currentAvail === 'on_duty'
                ? 'On Duty'
                : currentAvail === 'break'
                  ? 'On Break'
                  : 'Off Duty'}
          </span>
        </div>

        {/* 3 Status Cards: On Duty | Off Duty | On Break */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Card 1: On Duty */}
          <button
            type="button"
            onClick={() => {
              if (currentAvail === 'on_duty') {
                setSupervisorNotice(
                  `You are currently On Duty under Supervisor ${activeProfile.supervisorName}. Shift active on Floors 1–5 (08:00–16:30).`,
                );
              } else {
                setDutyModalInitialType('on_duty');
                setBreakModalOpen(true);
              }
            }}
            className={cn(
              'flex flex-col items-start gap-1 rounded-2xl p-3 text-xs transition-all cursor-pointer border text-left',
              currentAvail === 'on_duty' && breakRequest?.status !== 'pending'
                ? isLight
                  ? 'border-[#353229] bg-[#f6f3ec] text-[#353229] shadow-xs'
                  : 'border-[#dfc187] bg-[rgba(200,169,110,0.12)] text-white shadow-sm'
                : breakRequest?.status === 'pending' && breakRequest.requestType === 'on_duty'
                  ? isLight
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                  : isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#fbfaf7]'
                    : 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/[0.05]',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 font-bold">
                <Shield className="h-3.5 w-3.5" />
                <span>On Duty</span>
              </span>
              <span
                className={cn(
                  'text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase border',
                  currentAvail === 'on_duty'
                    ? isLight
                      ? 'bg-[#353229] text-white border-transparent'
                      : 'bg-[#c8a96e] text-[#14120e] border-transparent'
                    : breakRequest?.status === 'pending' && breakRequest.requestType === 'on_duty'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : isLight
                        ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#8c8472]'
                        : 'border-white/10 bg-black/30 text-mist-400',
                )}
              >
                {currentAvail === 'on_duty' ? 'Active' : breakRequest?.status === 'pending' && breakRequest.requestType === 'on_duty' ? 'Waiting' : 'Send Req'}
              </span>
            </div>
            <p className={cn('text-[10px] mt-1', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
              {currentAvail === 'on_duty'
                ? 'Active shift on duty'
                : 'Request On Duty from supervisor'}
            </p>
          </button>

          {/* Card 2: Off Duty */}
          <button
            type="button"
            onClick={() => {
              if (currentAvail === 'off_duty') {
                setSupervisorNotice(
                  `You are currently Off Duty under Supervisor ${activeProfile.supervisorName}. Clock-in or report on duty via request dialog.`,
                );
              } else {
                setDutyModalInitialType('off_duty');
                setBreakModalOpen(true);
              }
            }}
            className={cn(
              'flex flex-col items-start gap-1 rounded-2xl p-3 text-xs transition-all cursor-pointer border text-left',
              currentAvail === 'off_duty'
                ? isLight
                  ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-xs'
                  : 'border-rose-500/40 bg-rose-500/10 text-white shadow-sm'
                : breakRequest?.status === 'pending' && breakRequest.requestType === 'off_duty'
                  ? isLight
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                  : isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#fbfaf7]'
                    : 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/[0.05]',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 font-bold">
                <Power className="h-3.5 w-3.5" />
                <span>Off Duty</span>
              </span>
              <span
                className={cn(
                  'text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase border',
                  currentAvail === 'off_duty'
                    ? 'bg-rose-500 text-white border-transparent'
                    : breakRequest?.status === 'pending' && breakRequest.requestType === 'off_duty'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : isLight
                        ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#8c8472]'
                        : 'border-white/10 bg-black/30 text-mist-400',
                )}
              >
                {currentAvail === 'off_duty' ? 'Active' : breakRequest?.status === 'pending' && breakRequest.requestType === 'off_duty' ? 'Waiting' : 'Send Req'}
              </span>
            </div>
            <p className={cn('text-[10px] mt-1', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
              {currentAvail === 'off_duty'
                ? 'Shift signed off'
                : 'Request Off Duty from supervisor'}
            </p>
          </button>

          {/* Card 3: On Break */}
          <button
            type="button"
            onClick={() => {
              setDutyModalInitialType('break');
              setBreakModalOpen(true);
            }}
            className={cn(
              'flex flex-col items-start gap-1 rounded-2xl p-3 text-xs transition-all cursor-pointer border text-left',
              currentAvail === 'break'
                ? isLight
                  ? 'border-[#353229] bg-[#f6f3ec] text-[#353229] shadow-xs'
                  : 'border-[#dfc187] bg-[rgba(200,169,110,0.12)] text-white shadow-sm'
                : breakRequest?.status === 'pending' && breakRequest.requestType === 'break'
                  ? isLight
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                  : isLight
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#fbfaf7]'
                    : 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.05]',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 font-bold">
                <Coffee className="h-3.5 w-3.5" />
                <span>
                  {currentAvail === 'break'
                    ? 'On Break'
                    : breakRequest?.status === 'pending' && breakRequest.requestType === 'break'
                      ? 'Break Pending'
                      : 'Request Break'}
                </span>
              </span>
              <span
                className={cn(
                  'text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase border',
                  currentAvail === 'break'
                    ? isLight
                      ? 'bg-[#353229] text-white border-transparent'
                      : 'bg-[#c8a96e] text-[#14120e] border-transparent'
                    : breakRequest?.status === 'pending' && breakRequest.requestType === 'break'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : isLight
                        ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229]'
                        : 'border-[rgba(165,130,95,0.4)] text-[#dfc187]',
                )}
              >
                {currentAvail === 'break'
                  ? 'Active'
                  : breakRequest?.status === 'pending' && breakRequest.requestType === 'break'
                    ? 'Waiting'
                    : 'Send Req'}
              </span>
            </div>
            <p className={cn('text-[10px] mt-1', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
              {currentAvail === 'break'
                ? 'Click to end break & resume'
                : 'Request break window'}
            </p>
          </button>
        </div>

        {/* Supervisor Shift Notice Popover / Alert */}
        {supervisorNotice && (
          <div
            className={cn(
              'rounded-2xl border p-3 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-150',
              isLight
                ? 'border-[#b7b09e] bg-[#fbfaf7] text-[#353229]'
                : 'border-[rgba(165,130,95,0.4)] bg-[rgba(200,169,110,0.08)] text-[#f7f4ed]',
            )}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck className={cn('h-4 w-4 shrink-0 mt-0.5', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
              <div>
                <p className="font-bold text-xs">Supervisor Roster Authority</p>
                <p className={cn('text-[11px] mt-0.5 leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                  {supervisorNotice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSupervisorNotice(null)}
              className={cn(
                'grid h-6 w-6 place-items-center rounded-full shrink-0 cursor-pointer',
                isLight ? 'bg-[#f6f3ec] text-[#686252] hover:text-[#353229]' : 'bg-white/10 text-mist-300 hover:text-white',
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Active Break Banner if currently On Break */}
        {currentAvail === 'break' && (
          <div
            className={cn(
              'rounded-2xl border p-3 flex items-center justify-between gap-3',
              isLight ? 'border-[#ded6c1] bg-[#ebe2cc]/40' : 'border-amber-400/30 bg-amber-400/10',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Coffee className={cn('h-4 w-4 shrink-0', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
              <span className={cn('text-xs truncate', isLight ? 'text-[#353229]' : 'text-white')}>
                You are currently <strong>On Break</strong>. Guest requests paused.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                completeBreakRequest();
                setFulfillerAvailability('on_duty');
              }}
              className={cn(
                'shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all shadow-xs cursor-pointer',
                isLight ? 'bg-[#353229] text-white hover:bg-[#484438]' : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
              )}
            >
              End Break & Resume Duty
            </button>
          </div>
        )}

        {/* Pending Break Request Banner if request is pending */}
        {breakRequest?.status === 'pending' && (
          <div
            className={cn(
              'rounded-2xl border p-3 flex items-center justify-between gap-3',
              isLight ? 'border-amber-300 bg-amber-50/70' : 'border-amber-400/30 bg-amber-400/10',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 animate-spin" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-amber-900 block truncate">
                  Break Request Pending ({breakRequest.breakType})
                </span>
                <span className="text-[10px] text-amber-800">
                  Waiting for Supervisor {activeProfile.supervisorName} approval
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setBreakModalOpen(true)}
                className="rounded-xl border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-50 cursor-pointer"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => {
                  approveBreakRequest();
                  setFulfillerAvailability('break');
                }}
                className="rounded-xl bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 cursor-pointer"
                title="Simulate supervisor approval for testing"
              >
                Approve (Demo)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Options */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 space-y-3 transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-white/10 bg-white/[0.03]',
        )}
      >
        <h3 className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>App & Sound Settings</h3>

        {/* Chime Audio Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            {isSoundOn ? (
              <Volume2 className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-emerald-400')} />
            ) : (
              <VolumeX className={cn('h-4 w-4', isLight ? 'text-[#8c8472]' : 'text-mist-400')} />
            )}
            <div>
              <p className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>Task Chime Sound</p>
              <p className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>Play chime when new task is assigned</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!isSoundOn)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-out',
              isSoundOn
                ? isLight
                  ? 'bg-[#353229]'
                  : 'bg-emerald-500'
                : isLight
                  ? 'bg-[#ded6c1]'
                  : 'bg-white/20',
            )}
            title={isSoundOn ? 'Mute chime' : 'Enable chime'}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-out',
                isSoundOn ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        {/* Theme Toggle */}
        <div
          className={cn(
            'flex items-center justify-between border-t pt-3',
            isLight ? 'border-[#e7e2d7]' : 'border-white/[0.06]',
          )}
        >
          <div className="flex items-center gap-2.5">
            {isLight ? <Sun className="h-4 w-4 text-amber-600" /> : <Moon className="h-4 w-4 text-sky-400" />}
            <div>
              <p className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>Color Theme</p>
              <p className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>Currently in {isLight ? 'Light' : 'Dark'} mode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              isLight
                ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229] hover:bg-[#ebe2cc]'
                : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Switch to {isLight ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Emergency Shift Handover / Relief */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-amber-400/20 bg-amber-400/[0.04]',
        )}
      >
        <div className="flex items-center gap-2">
          <HeartPulse className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-amber-400')} />
          <h3 className={cn('text-xs font-bold', isLight ? 'text-[#353229]' : 'text-white')}>Emergency Shift Relief</h3>
        </div>
        <p className={cn('mt-1 text-[11px] leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-300')}>
          Need urgent coverage due to illness, fatigue, or personal emergency? Request immediate relief from Duty Manager.
        </p>

        {shiftRequest ? (
          <div
            className={cn(
              'mt-3 rounded-xl border p-3 text-xs',
              isLight
                ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                : 'border-amber-400/30 bg-amber-400/10',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('font-semibold', isLight ? 'text-[#353229]' : 'text-amber-200')}>Relief Request Logged</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30',
                )}
              >
                {shiftRequest.status}
              </span>
            </div>
            <p className={cn('mt-1 text-[11px]', isLight ? 'text-[#686252]' : 'text-mist-300')}>Reason: {shiftRequest.reason}</p>
            <p className={cn('text-[10px] mt-0.5', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>Submitted at {shiftRequest.requestedAt}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className={cn(
              'mt-3 w-full rounded-xl border py-2 px-3 text-xs font-semibold transition-colors cursor-pointer',
              isLight
                ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec]'
                : 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20',
            )}
          >
            Request Emergency Handover
          </button>
        )}
      </div>

      {/* Sign Out Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl border py-3 px-4 text-xs font-bold transition-colors cursor-pointer',
            isLight
              ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 shadow-2xs'
              : 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
          )}
        >
          <LogOut className="h-4 w-4" />
          Sign Out of Employee Session
        </button>
        <p className={cn('mt-2 text-center text-[10px]', isLight ? 'text-[#8c8472]' : 'text-mist-500')}>
          Returns to staff portal selection screen. Session inputs are preserved locally.
        </p>
      </div>

      {/* Emergency Shift Relief Modal */}
      {emergencyModalOpen && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={cn(
              'w-full max-w-md rounded-3xl border p-5 shadow-2xl',
              isLight
                ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                : 'border-amber-400/30 bg-ink-900 text-white',
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn('h-5 w-5', isLight ? 'text-[#353229]' : 'text-amber-400')} />
              <h3 className={cn('font-bold text-base', isLight ? 'text-[#353229]' : 'text-white')}>Emergency Shift Relief Request</h3>
            </div>
            <p className={cn('mt-1 text-xs', isLight ? 'text-[#686252]' : 'text-mist-300')}>
              This notice will alert Duty Manager <strong>Marcus Vance</strong> for priority shift relief dispatch.
            </p>

            <div className="mt-3 space-y-2">
              <p className={cn('text-[11px] font-semibold', isLight ? 'text-[#353229]' : 'text-mist-300')}>Reason:</p>
              {EMERGENCY_REASONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                    emergencyReason === r
                      ? isLight
                        ? 'border-[#353229] bg-[#f6f3ec] text-[#353229] font-bold'
                        : 'border-amber-400/50 bg-amber-400/10 text-white'
                      : isLight
                        ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#f6f3ec]'
                        : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                  )}
                >
                  <input
                    type="radio"
                    name="emerg"
                    checked={emergencyReason === r}
                    onChange={() => setEmergencyReason(r)}
                    className={isLight ? 'accent-[#353229]' : 'accent-amber-400'}
                  />
                  <span>{r}</span>
                </label>
              ))}

              <p className={cn('text-[11px] font-semibold mt-2', isLight ? 'text-[#353229]' : 'text-mist-300')}>Additional notes (optional):</p>
              <textarea
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="E.g. Completed room 402, need relief for floor 3 turn downs..."
                rows={2}
                className={cn(
                  'w-full rounded-xl border p-2.5 text-xs focus:outline-none',
                  isLight
                    ? 'border-[#e7e2d7] bg-[#fbfaf7] text-[#353229] placeholder-[#8c8472] focus:border-[#353229]'
                    : 'border-white/10 bg-white/[0.04] text-white placeholder-mist-500 focus:border-amber-400',
                )}
              />
            </div>

            <div
              className={cn(
                'mt-5 flex items-center justify-end gap-2 border-t pt-3',
                isLight ? 'border-[#e7e2d7]' : 'border-white/10',
              )}
            >
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs cursor-pointer',
                  isLight
                    ? 'border-[#e7e2d7] text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-white/10 text-mist-300 hover:text-white',
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmergencySubmit}
                className={cn(
                  'rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md cursor-pointer',
                  isLight
                    ? 'bg-[#353229] text-[#ffffff] hover:bg-[#484438]'
                    : 'bg-amber-400 text-ink-950 shadow-amber-400/30 hover:bg-amber-300',
                )}
              >
                Submit Relief Request
              </button>
            </div>
          </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={cn(
              'w-full max-w-sm rounded-3xl border p-5 shadow-2xl',
              isLight
                ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                : 'border-rose-500/30 bg-ink-900 text-white',
            )}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <LogOut className="h-5 w-5" />
              <h3 className={cn('font-bold text-base', isLight ? 'text-[#353229]' : 'text-white')}>Sign out of session?</h3>
            </div>
            <p className={cn('mt-2 text-xs', isLight ? 'text-[#686252]' : 'text-mist-300')}>
              You are signed in as <strong>{activeProfile.employeeName}</strong> ({activeProfile.departmentName}). You will return to the Portal login screen.
            </p>
            <div
              className={cn(
                'mt-4 flex items-center justify-end gap-2 border-t pt-3',
                isLight ? 'border-[#e7e2d7]' : 'border-white/10',
              )}
            >
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs cursor-pointer',
                  isLight
                    ? 'border-[#e7e2d7] text-[#686252] hover:bg-[#f6f3ec]'
                    : 'border-white/10 text-mist-300 hover:text-white',
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 cursor-pointer"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Break & Duty Request Modal */}
      <BreakRequestModal
        isOpen={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        profile={activeProfile}
        isLight={isLight}
        currentAvail={currentAvail}
        onSetAvailability={setFulfillerAvailability}
        onNotify={notify}
        initialType={dutyModalInitialType}
      />
    </div>
  );
}
