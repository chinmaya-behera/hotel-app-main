'use client';

import {
  User,
  ShieldCheck,
  Building2,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Lock,
  KeyRound,
} from 'lucide-react';

export function SupervisorProfileTab() {
  const permissions = [
    { name: 'Room Quality Inspection Approval', granted: true, scope: 'Housekeeping Floors 1–5' },
    { name: 'Turnover Deficiencies Flag & Reopen', granted: true, scope: 'Attendant Corrective Queue' },
    { name: 'Attendant Workload & Reassignment Review', granted: true, scope: 'Department Roster' },
    { name: 'Shift Handover Log Submission', granted: true, scope: 'Outgoing to Evening HK' },
    { name: 'Escalate to Duty Manager', granted: true, scope: 'Direct Isabella Scott Dispatch' },
    { name: 'Department Quality Analytics Export', granted: true, scope: 'CSV / Operational Scope' },
    { name: 'System Role & Staff Account Creation', granted: false, scope: 'Restricted to Platform Admin' },
    { name: 'Executive Financial Approvals', granted: false, scope: 'Restricted to Executive Approver' },
    { name: 'Folio Dispute Adjustments > ₹5,000', granted: false, scope: 'Restricted to Duty Manager / Finance' },
    { name: 'RFID Master Lock Emergency Override', granted: false, scope: 'Restricted to Security Responder' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-teal-400 text-ink-950 font-bold font-mono text-2xl shadow-xl">
              MN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-white">Oliver Reed</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[11px] font-bold">
                  EMP-0105
                </span>
              </div>
              <p className="text-xs text-mist-400 mt-0.5">
                Housekeeping Supervisor · Department Operations
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Shift On Duty</span>
          </div>
        </div>

        {/* Operational Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>Department</span>
            </p>
            <p className="text-xs font-bold text-white mt-1">Housekeeping & Facilities</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>Authorized Zones</span>
            </p>
            <p className="text-xs font-bold text-white mt-1">Floors 1 to 5 (All Wings)</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Shift Window</span>
            </p>
            <p className="text-xs font-bold text-white mt-1">Day Shift (07:00 – 15:30)</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase font-bold text-mist-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Reports To</span>
            </p>
            <p className="text-xs font-bold text-white mt-1">Duty Manager Isabella Scott</p>
          </div>
        </div>
      </div>

      {/* RBAC Permissions Matrix */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.04] text-amber-300 border border-white/10">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold font-display text-white">
              Role Authority & Security Permissions Matrix
            </h3>
            <p className="text-xs text-mist-400">
              Department Supervisor permissions derived from Role-Mainaccess.csv and PRD.md REQ-04/05
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {permissions.map((p, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-start justify-between gap-3 ${
                p.granted
                  ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                  : 'bg-white/[0.01] border-white/[0.04] opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <p className={`text-xs font-semibold ${p.granted ? 'text-white' : 'text-mist-400'}`}>
                  {p.name}
                </p>
                <p className="text-[11px] text-mist-400">{p.scope}</p>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  p.granted
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-mist-400'
                }`}
              >
                {p.granted ? 'Authorized' : 'Restricted'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
