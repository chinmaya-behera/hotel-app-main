'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  Clock,
  Coffee,
  HeartPulse,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playChime } from './chime';

const EMERGENCY_REASONS = [
  'Medical emergency / sudden illness',
  'Family emergency requiring departure',
  'Severe physical fatigue / safety concern',
  'Extended shift relief / handover needed',
];

export function FulfillerProfileTab() {
  const router = useRouter();
  const {
    account,
    state,
    setTheme,
    setSoundEnabled,
    setFulfillerAvailability,
    requestEmergencyShiftChange,
  } = useDemo();

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState(EMERGENCY_REASONS[0]);
  const [emergencyNotes, setEmergencyNotes] = useState('');

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
    void fetch('/api/demo-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})}).then(()=>location.assign('/login'));
  }

  return (
    <div className="flex flex-col gap-4 pb-28 text-white">
      {/* Profile Card */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 font-display text-lg font-bold text-ink-950 shadow-md shadow-emerald-500/30">
            VS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{account?.person||'Staff member'}</h2>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                EMP-0103
              </span>
            </div>
            <p className="text-xs text-mist-300 mt-0.5">Task Fulfiller · Housekeeping</p>
            <p className="text-[11px] text-mist-400">Floors 1–5 · Level 4 Primary Attendant</p>
          </div>
        </div>

        {/* Supervisor & Shift Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
            <span className="text-[10px] text-mist-400 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-emerald-400" /> Department Supervisor
            </span>
            <p className="mt-1 font-semibold text-white">Oliver Reed</p>
            <p className="text-[10px] text-mist-400">EMP-0105 · Housekeeping</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
            <span className="text-[10px] text-mist-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-sky-400" /> Current Shift
            </span>
            <p className="mt-1 font-semibold text-white">Day Shift (08:00–16:30)</p>
            <p className="text-[10px] text-mist-400">Active Duty Window</p>
          </div>
        </div>
      </div>

      {/* Duty Availability Status Toggle */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">Duty Availability Status</h3>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              currentAvail === 'on_duty'
                ? 'bg-emerald-400/20 text-emerald-300'
                : currentAvail === 'break'
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-white/10 text-mist-400',
            )}
          >
            {currentAvail === 'on_duty' ? 'On Duty' : currentAvail === 'break' ? 'On Break' : 'Off Duty'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFulfillerAvailability('on_duty')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all',
              currentAvail === 'on_duty'
                ? 'bg-emerald-500 text-ink-950 shadow-md shadow-emerald-500/25 font-bold'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            On Duty
          </button>

          <button
            type="button"
            onClick={() => setFulfillerAvailability('break')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all',
              currentAvail === 'break'
                ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/25 font-bold'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            <Coffee className="h-3.5 w-3.5" />
            On Break
          </button>
        </div>
      </div>

      {/* Settings Options */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <h3 className="text-xs font-semibold text-white">App & Sound Settings</h3>

        {/* Chime Audio Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            {isSoundOn ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-mist-400" />}
            <div>
              <p className="text-xs font-semibold text-white">Task Chime Sound</p>
              <p className="text-[10px] text-mist-400">Play chime when new task is assigned</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playChime}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-mist-300 hover:text-white"
            >
              Test
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!isSoundOn)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                isSoundOn ? 'bg-emerald-500' : 'bg-white/20',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                  isSoundOn ? 'translate-x-4' : 'translate-x-0',
                )}
              />
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-2.5">
            {isLight ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-400" />}
            <div>
              <p className="text-xs font-semibold text-white">Color Theme</p>
              <p className="text-[10px] text-mist-400">Currently in {isLight ? 'Light' : 'Dark'} mode</p>
            </div>
          </div>
          <button
            type="button"
            disabled title="Atelier beige theme"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-mist-300 hover:text-white"
          >
            Beige theme
          </button>
        </div>
      </div>

      {/* Emergency Shift Handover / Relief */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white">Emergency Shift Relief</h3>
        </div>
        <p className="mt-1 text-[11px] text-mist-300 leading-relaxed">
          Need urgent coverage due to illness, fatigue, or personal emergency? Request immediate relief from Duty Manager.
        </p>

        {shiftRequest ? (
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-200">Relief Request Logged</span>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                {shiftRequest.status}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-mist-300">Reason: {shiftRequest.reason}</p>
            <p className="text-[10px] text-mist-400 mt-0.5">Submitted at {shiftRequest.requestedAt}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className="mt-3 w-full rounded-xl border border-amber-400/40 bg-amber-400/10 py-2 px-3 text-xs font-semibold text-amber-200 hover:bg-amber-400/20 transition-colors"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 py-3 px-4 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out of Employee Session
        </button>
        <p className="mt-2 text-center text-[10px] text-mist-500">
          Returns to staff portal selection screen. Session inputs are preserved locally.
        </p>
      </div>

      {/* Emergency Shift Relief Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-ink-900 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold text-base text-white">Emergency Shift Relief Request</h3>
            </div>
            <p className="mt-1 text-xs text-mist-300">
              This notice will alert Duty Manager <strong>Isabella Scott</strong> for priority shift relief dispatch.
            </p>

            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-semibold text-mist-300">Reason:</p>
              {EMERGENCY_REASONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                    emergencyReason === r
                      ? 'border-amber-400/50 bg-amber-400/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                  )}
                >
                  <input
                    type="radio"
                    name="emerg"
                    checked={emergencyReason === r}
                    onChange={() => setEmergencyReason(r)}
                    className="accent-amber-400"
                  />
                  <span>{r}</span>
                </label>
              ))}

              <p className="text-[11px] font-semibold text-mist-300 mt-2">Additional notes (optional):</p>
              <textarea
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="E.g. Completed room 402, need relief for floor 3 turn downs..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmergencySubmit}
                className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-ink-950 shadow-md shadow-amber-400/30 hover:bg-amber-300"
              >
                Submit Relief Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-ink-900 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <LogOut className="h-5 w-5" />
              <h3 className="font-bold text-base text-white">Sign out of session?</h3>
            </div>
            <p className="mt-2 text-xs text-mist-300">
              You are signed in as <strong>{account?.person||'Staff member'}</strong> (Housekeeping). You will return to the Portal login screen.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-600"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
