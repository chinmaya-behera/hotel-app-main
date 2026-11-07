'use client';

import {
  User,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  Clock,
  KeyRound,
  FileCheck2,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';

interface RolePolicyItem {
  code: string;
  title: string;
  summary: string;
  authority: string;
}

const ESSENTIAL_POLICIES: RolePolicyItem[] = [
  {
    code: 'POL-FO-101',
    title: 'Mandatory Government ID Verification',
    summary: 'Physical inspection of valid government photo ID (Passport / Driving License / Aadhaar) is mandatory prior to encoding and issuing RFID keycards.',
    authority: 'Standard Operating Procedure · Zero Discretion',
  },
  {
    code: 'POL-FO-102',
    title: 'Check-In & Check-Out Operational Windows',
    summary: 'Official check-in at 15:00, check-out at 11:00. VIP tier courtesy late checkout granted until 14:00 subject to occupancy availability.',
    authority: 'Front Office Standard',
  },
  {
    code: 'POL-REC-201',
    title: 'Autonomous Goodwill Compensation Authority',
    summary: 'Front Desk coordinators possess autonomous goodwill authorization up to ₹2,500 ($150) for immediate service recovery without manager approval.',
    authority: 'Front Desk Limit: ₹2,500 · Above requires Duty Manager',
  },
  {
    code: 'POL-SEC-301',
    title: 'Disturbance & Emergency Escalation Protocol',
    summary: 'Any safety breach, unauthorized access, or unresolvable guest dispute must immediately be escalated simultaneously to the Duty Manager and Security Responder.',
    authority: 'Safety & Security Directive · Immediate Escalation',
  },
];

const CORE_RESPONSIBILITIES = [
  {
    title: 'Guest Check-In & Identity Verification',
    desc: 'Verify reservation details, validate photo identification, check payment guarantees, and issue encoded keycards.',
    icon: KeyRound,
  },
  {
    title: 'Central Communications & Routing',
    desc: 'Receive guest requests and complaints via portal, counter or phone, and route them to Housekeeping, Wellness, Maintenance or F&B.',
    icon: Sparkles,
  },
  {
    title: 'Service Recovery & Compensation',
    desc: 'Autonomously resolve guest dissatisfaction with up to ₹2,500 in goodwill adjustments, dining vouchers, or amenity credits.',
    icon: FileCheck2,
  },
  {
    title: 'Safety & Emergency Escalation',
    desc: 'Monitor station panic alerts and dispatch incident reports directly to Security Responder Unit and Duty Manager.',
    icon: AlertOctagon,
  },
];

export function StaffProfilePanel() {
  return (
    <div className="space-y-5">
      {/* 1. Concise Operator Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-ink-900 via-white/[0.03] to-ink-900 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/40 border border-amber-400/50 flex items-center justify-center text-amber-200 font-extrabold text-2xl shadow-lg shrink-0">
              SP
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Sunita Patel</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active · On Duty</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-amber-300">
                Lead Front Desk Coordinator
              </p>
              <p className="text-xs text-mist-300 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-mist-400" />
                <span>Front Office Department · Station FD-02</span>
              </p>
            </div>
          </div>

          {/* Quick Contact & Shift Details */}
          <div className="flex flex-col gap-1.5 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-5 text-xs text-mist-300 shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-mist-400 font-medium">Employee ID:</span>
              <strong className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">EMP-4089</strong>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-mist-400 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" /> Shift:
              </span>
              <strong className="text-amber-200">Day Shift (07:00 – 15:30)</strong>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-mist-400 font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 text-cyan-400" /> Email:
              </span>
              <span className="text-mist-200 font-mono text-[11px]">s.patel@thegrandadp.com</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-mist-400 font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-400" /> Intercom:
              </span>
              <span className="text-mist-200">Ext. 204 (Front Desk Direct)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Essential Permissions & Responsibilities */}
      <Panel
        title="Essential Permissions & Operational Responsibilities"
        hint="Delegated front office authorities and cross-department coordinator scopes."
        icon={ShieldCheck}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CORE_RESPONSIBILITIES.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{r.title}</h4>
                  <p className="text-[11px] text-mist-300 mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 3. Short Essential Policy Section */}
      <Panel
        title="Essential Role Policies & Responsibilities"
        hint="Key operational standards, verification rules, and financial authority limits governing the Front Desk."
        icon={FileCheck2}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ESSENTIAL_POLICIES.map((p) => (
            <div
              key={p.code}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  {p.code}
                </span>
                <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Mandatory Standard
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">{p.title}</h3>
              <p className="text-xs text-mist-300 leading-relaxed">{p.summary}</p>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-mist-400">
                <span className="font-medium text-cyan-300">{p.authority}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
