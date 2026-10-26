'use client';

import { useState } from 'react';
import {
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Bell,
  Lock,
  FileCheck2,
  AlertTriangle,
  BadgeCheck,
  Radio,
} from 'lucide-react';
import { useDemo } from '@/lib/store';

export function SecurityProfileTab() {
  const { state, setSoundEnabled, notify, setResponderStatus } = useDemo();
  const [availability, setAvailability] = useState<'on_patrol' | 'responding' | 'break' | 'off_duty'>((state as any).responderStatus||'on_patrol');
  const isSoundOn = state.soundEnabled ?? true;

  const handleAvailabilityChange = (newStatus: 'on_patrol' | 'responding' | 'break' | 'off_duty') => {
    setAvailability(newStatus);
    const labelMap = {
      on_patrol: 'On Active Patrol',
      responding: 'Responding to Incident',
      break: 'On Break (Emergency Standby)',
      off_duty: 'Off Duty',
    };
    setResponderStatus(newStatus);
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-150">
      {/* Officer Credential Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0c1a30] via-ink-900 to-ink-950 border border-sky-500/20 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-lg font-black text-ink-950 shadow-lg shadow-sky-500/30">
            IR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Lucas Martin</h2>
              <BadgeCheck className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-xs text-sky-300 font-medium">Senior Security Officer</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-mist-400 font-mono">
              <span>ID: EMP-0108</span>
              <span>·</span>
              <span>Class 1 Clearance</span>
            </div>
          </div>
        </div>

        {/* Shift Details */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Assigned Shift</span>
            <span className="text-white font-medium flex items-center gap-1 mt-0.5">
              <Moon className="h-3 w-3 text-sky-400" /> Night (22:00–07:00)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Patrol Scope</span>
            <span className="text-white font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-sky-400" /> Property-Wide
            </span>
          </div>
        </div>
      </div>

      {/* Responder Availability Status Toggle */}
      <div className="p-3.5 rounded-2xl bg-ink-900 border border-white/10 text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-sky-400" /> Patrol Availability
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              availability === 'on_patrol'
                ? 'bg-emerald-500/20 text-emerald-300'
                : availability === 'responding'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/10 text-mist-400'
            }`}
          >
            {availability === 'on_patrol'
              ? 'On Active Patrol'
              : availability === 'responding'
              ? 'Responding'
              : availability === 'break'
              ? 'Break / Standby'
              : 'Off Duty'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleAvailabilityChange('on_patrol')}
            className={`py-2 px-3 rounded-xl font-semibold transition-all text-center ${
              availability === 'on_patrol'
                ? 'bg-emerald-500 text-ink-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-ink-950 border border-white/10 text-mist-300 hover:bg-white/5'
            }`}
          >
            On Active Patrol
          </button>

          <button
            type="button"
            onClick={() => handleAvailabilityChange('responding')}
            className={`py-2 px-3 rounded-xl font-semibold transition-all text-center ${
              availability === 'responding'
                ? 'bg-amber-500 text-ink-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-ink-950 border border-white/10 text-mist-300 hover:bg-white/5'
            }`}
          >
            Responding
          </button>

          <button
            type="button"
            onClick={() => handleAvailabilityChange('break')}
            className={`py-2 px-3 rounded-xl font-semibold transition-all text-center ${
              availability === 'break'
                ? 'bg-sky-500 text-ink-950 font-bold shadow-md shadow-sky-500/20'
                : 'bg-ink-950 border border-white/10 text-mist-300 hover:bg-white/5'
            }`}
          >
            Break (Standby)
          </button>

          <button
            type="button"
            onClick={() => handleAvailabilityChange('off_duty')}
            className={`py-2 px-3 rounded-xl font-semibold transition-all text-center ${
              availability === 'off_duty'
                ? 'bg-white/20 text-white font-bold'
                : 'bg-ink-950 border border-white/10 text-mist-400 hover:bg-white/5'
            }`}
          >
            Off Duty
          </button>
        </div>
      </div>

      {/* Audio Alerts & Notification Preferences */}
      <div className="p-3.5 rounded-2xl bg-ink-900 border border-white/10 text-xs space-y-3">
        <h3 className="font-semibold text-white flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-sky-400" /> Audio & Alert Preferences
        </h3>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-ink-950 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isSoundOn ? 'bg-sky-500/20 text-sky-400' : 'bg-white/10 text-mist-500'}`}>
              {isSoundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-white font-medium">SOS Siren & Chimes</p>
              <p className="text-[10px] text-mist-400">Web Audio synthesizer alert tones</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!isSoundOn)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
              isSoundOn
                ? 'bg-sky-500 text-ink-950'
                : 'bg-white/10 text-mist-400 hover:bg-white/20'
            }`}
          >
            {isSoundOn ? 'Enabled' : 'Muted'}
          </button>
        </div>
      </div>

      {/* Security Isolation Boundary & Compliance Box (PRD & SECURITY.md) */}
      <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/20 text-xs space-y-2">
        <div className="flex items-center gap-2 text-sky-300 font-semibold">
          <Lock className="h-4 w-4 text-sky-400" />
          <span>Security Isolation Boundary</span>
        </div>
        <p className="text-[11px] text-mist-300 leading-relaxed">
          Per hotel security compliance rules (ISO 27001 / Hospitality Security Framework):
        </p>
        <ul className="space-y-1 text-[11px] text-mist-400 list-disc list-inside">
          <li><strong>Restricted Access:</strong> Zero visibility into guest room folios, invoices, or billing transactions.</li>
          <li><strong>Guest Privacy:</strong> Non-security guest details (loyalty balances, profile notes) are withheld.</li>
          <li><strong>Evidence Immutability:</strong> Submitted incident reports and photographic evidence cannot be edited or deleted once filed.</li>
          <li><strong>Dual Escalation:</strong> Escalations route strictly to Duty Manager Isabella Scott.</li>
        </ul>
      </div>

      {/* Hardware / Keycard Badge Credential */}
      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-mist-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Security RFID Master Badge: Active</span>
        </div>
        <span className="font-mono text-[10px] text-mist-500">SN: 884-RFID-SEC</span>
      </div>
    </div>
  );
}
