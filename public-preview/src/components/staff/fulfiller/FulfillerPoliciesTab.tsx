'use client';

import { ShieldCheck, AlertTriangle, CheckCircle2, PhoneCall, ShieldAlert, BookOpen, Clock, Sparkles } from 'lucide-react';
import { ROLE_AUTHORITY_PROFILES, SHARED_SERVICE_POLICIES } from '@/lib/policies';

export function FulfillerPoliciesTab() {
  const policy = ROLE_AUTHORITY_PROFILES['task_fulfiller'];
  const hkServicePolicies = SHARED_SERVICE_POLICIES.filter(
    (p) => p.department === 'Housekeeping' || p.department === 'Operations',
  );

  return (
    <div className="flex flex-col gap-4 pb-24 text-xs">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Service Authority & Policies</h2>
            <p className="text-[11px] text-mist-300">Operational limits, safety rules & escalation protocol</p>
          </div>
        </div>

        {/* Financial Spending Limit Callout */}
        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-ink-950/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-mist-200">Financial Discretionary Limit</span>
          </div>
          <span className="font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs">
            ₹0 (Strict Zero Limit)
          </span>
        </div>
      </div>

      {/* Operational Authority: What You Can Do */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <CheckCircle2 className="h-4 w-4" />
          <h3 className="text-white font-semibold">Operational Authority (Allowed Actions)</h3>
        </div>
        <ul className="space-y-2 text-mist-300">
          {(policy.operationalAuthority ?? policy.canDo ?? []).map((action, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>{action}</span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <span>Self-claim eligible unassigned department tasks across Floors 1–5 before supervisor assignment.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <span>Submit task reassignment requests with documented reason to Supervisor Meera Nambiar.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <span>Attach photo proof for turnover readiness and maintenance completions.</span>
          </li>
        </ul>
      </div>

      {/* Strict Negative Boundaries: What You Cannot Do */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-4 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="text-white font-semibold">Strict Negative Boundaries (Escalation Required)</h3>
        </div>
        <ul className="space-y-2 text-rose-200/90">
          {(policy.negativeBoundaries ?? policy.cannotDo ?? []).map((boundary, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{boundary}</span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            <span>Never override a guest Do Not Disturb (DND) without direct Supervisor instruction.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            <span>Cannot approve guest compensation, folio discounts, or refunds (Escalate to Duty Manager).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            <span>Cannot certify final room turnover inspection (Supervisor QA approval required).</span>
          </li>
        </ul>
      </div>

      {/* Escalation Pathways */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <PhoneCall className="h-4 w-4" />
          <h3 className="text-white font-semibold">Escalation Guidance & Contacts</h3>
        </div>
        <div className="space-y-2 text-mist-300">
          <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Combined Dispatcher / Supervisor</span>
              <span className="text-[11px] text-mist-400">Meera Nambiar · Operational Blockers & Reassignments</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">Radio Ch 3 / Ext 4020</span>
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Duty Manager</span>
              <span className="text-[11px] text-mist-400">Marcus Vance · Guest Disputes & VIP Escalations</span>
            </div>
            <span className="font-mono text-amber-300 font-bold">Ext 9999</span>
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Security & Life Safety</span>
              <span className="text-[11px] text-mist-400">Immediate Hazard / Physical Safety Concern</span>
            </div>
            <span className="font-mono text-rose-400 font-bold">Ext 0000 / Emergency</span>
          </div>
        </div>
      </div>

      {/* Department Standard SLAs */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center gap-2 text-mist-200 font-bold">
          <Clock className="h-4 w-4 text-emerald-400" />
          <h3 className="text-white font-semibold">Service Standard SLAs</h3>
        </div>
        <div className="space-y-2">
          {hkServicePolicies.map((p) => (
            <div key={p.id} className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{p.title}</span>
                {p.configured ? (
                  <span className="text-[10px] text-emerald-300 font-semibold">Configured</span>
                ) : (
                  <span className="text-[10px] text-amber-300 italic">Unconfigured</span>
                )}
              </div>
              <p className="text-[11px] text-mist-400 mt-1">{p.summary ?? p.policySummary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
