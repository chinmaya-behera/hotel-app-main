'use client';

import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ROLE_AUTHORITY_PROFILES, SHARED_SERVICE_POLICIES } from '@/lib/policies';

export function FulfillerPoliciesTab() {
  const { state } = useDemo();
  const isLight = state.theme === 'light';

  const policy = ROLE_AUTHORITY_PROFILES['task_fulfiller'];
  const hkServicePolicies = SHARED_SERVICE_POLICIES.filter(
    (p) => p.department === 'Housekeeping' || p.department === 'Operations',
  );

  return (
    <div className="flex flex-col gap-3.5 pb-24 text-xs">
      {/* Header Banner */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 transition-colors',
          isLight
            ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 shadow-xs'
            : 'border-emerald-500/30 bg-emerald-500/[0.06] text-white',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
              isLight
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                : 'border-emerald-400/30 bg-emerald-500/20 text-emerald-400',
            )}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className={cn('font-bold text-sm sm:text-base', isLight ? 'text-stone-900' : 'text-white')}>
              Service Authority & SOP Policies
            </h2>
            <p className={cn('text-[11px] mt-0.5', isLight ? 'text-stone-600' : 'text-mist-300')}>
              Operational boundaries, guest privacy standards & supervisor escalation protocol
            </p>
          </div>
        </div>

        {/* Financial Spending Limit Callout */}
        <div
          className={cn(
            'mt-3.5 flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition-colors',
            isLight
              ? 'border-emerald-200 bg-white/90 shadow-2xs'
              : 'border-emerald-400/20 bg-ink-950/60',
          )}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className={cn('h-4 w-4', isLight ? 'text-emerald-700' : 'text-emerald-400')} />
            <span className={cn('font-bold text-xs', isLight ? 'text-stone-800' : 'text-mist-200')}>
              Financial Discretionary Limit
            </span>
          </div>
          <span
            className={cn(
              'font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] border',
              isLight
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            )}
          >
            ₹0 (Strict Zero Limit)
          </span>
        </div>
      </div>

      {/* Operational Authority: What You Can Do */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 space-y-3 transition-colors',
          isLight
            ? 'border-emerald-200 bg-white shadow-xs'
            : 'border-white/10 bg-white/[0.03]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className={cn('h-4 w-4', isLight ? 'text-emerald-700' : 'text-emerald-400')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-emerald-950' : 'text-white')}>
            Operational Authority (Allowed Actions)
          </h3>
        </div>
        <ul className={cn('space-y-2 leading-relaxed', isLight ? 'text-stone-800 font-medium' : 'text-mist-300')}>
          {(policy.operationalAuthority ?? policy.canDo ?? []).map((action, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-emerald-600' : 'bg-emerald-400')} />
              <span>{action}</span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-emerald-600' : 'bg-emerald-400')} />
            <span>Self-claim eligible unassigned department tasks across Floors 1–5 before supervisor assignment.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-emerald-600' : 'bg-emerald-400')} />
            <span>Submit task reassignment requests with documented reason to your department supervisor.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-emerald-600' : 'bg-emerald-400')} />
            <span>Attach photo proof for turnover readiness and maintenance completions.</span>
          </li>
        </ul>
      </div>

      {/* Strict Negative Boundaries: What You Cannot Do */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 space-y-3 transition-colors',
          isLight
            ? 'border-rose-200 bg-rose-50/50 shadow-xs'
            : 'border-rose-500/30 bg-rose-500/[0.05]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className={cn('h-4 w-4', isLight ? 'text-rose-700' : 'text-rose-400')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-rose-950' : 'text-white')}>
            Strict Negative Boundaries (Escalation Required)
          </h3>
        </div>
        <ul className={cn('space-y-2 leading-relaxed', isLight ? 'text-rose-900 font-medium' : 'text-rose-200/90')}>
          {(policy.negativeBoundaries ?? policy.cannotDo ?? []).map((boundary, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-rose-600' : 'bg-rose-400')} />
              <span>{boundary}</span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-rose-600' : 'bg-rose-400')} />
            <span>Never override a guest Do Not Disturb (DND) without direct Supervisor instruction.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-rose-600' : 'bg-rose-400')} />
            <span>Cannot approve guest compensation, folio discounts, or refunds (Escalate to Duty Manager).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-rose-600' : 'bg-rose-400')} />
            <span>Cannot self-certify completed work (Supervisor inspection approval required).</span>
          </li>
        </ul>
      </div>

      {/* Escalation Guidance & Contacts */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 space-y-3 transition-colors',
          isLight
            ? 'border-amber-200 bg-white shadow-xs'
            : 'border-amber-400/20 bg-amber-400/[0.04]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <PhoneCall className={cn('h-4 w-4', isLight ? 'text-amber-700' : 'text-amber-300')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-amber-950' : 'text-white')}>
            Escalation Guidance & Contacts
          </h3>
        </div>
        <div className="space-y-2">
          <div
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between gap-3',
              isLight ? 'border-stone-200 bg-stone-50/80 text-stone-900' : 'border-white/10 bg-white/[0.02]',
            )}
          >
            <div>
              <span className={cn('font-bold block text-xs', isLight ? 'text-stone-900' : 'text-white')}>
                Combined Dispatcher / Supervisor
              </span>
              <span className={cn('text-[11px]', isLight ? 'text-stone-600' : 'text-mist-400')}>
                Operational Blockers, Clean Supplies & Reassignments
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded-lg border',
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'text-emerald-400 border-transparent',
              )}
            >
              Radio Ch 3 / Ext 4020
            </span>
          </div>

          <div
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between gap-3',
              isLight ? 'border-stone-200 bg-stone-50/80 text-stone-900' : 'border-white/10 bg-white/[0.02]',
            )}
          >
            <div>
              <span className={cn('font-bold block text-xs', isLight ? 'text-stone-900' : 'text-white')}>
                Duty Manager
              </span>
              <span className={cn('text-[11px]', isLight ? 'text-stone-600' : 'text-mist-400')}>
                Guest Disputes, VIP Requests & Policy Escalations
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded-lg border',
                isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'text-amber-300 border-transparent',
              )}
            >
              Ext 9999
            </span>
          </div>

          <div
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between gap-3',
              isLight ? 'border-stone-200 bg-stone-50/80 text-stone-900' : 'border-white/10 bg-white/[0.02]',
            )}
          >
            <div>
              <span className={cn('font-bold block text-xs', isLight ? 'text-stone-900' : 'text-white')}>
                Security & Life Safety
              </span>
              <span className={cn('text-[11px]', isLight ? 'text-stone-600' : 'text-mist-400')}>
                Immediate Hazard, Medical or Physical Safety Concern
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded-lg border',
                isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'text-rose-400 border-transparent',
              )}
            >
              Ext 0000 / Emergency
            </span>
          </div>
        </div>
      </div>

      {/* Department Standard SLAs */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 space-y-3 transition-colors',
          isLight
            ? 'border-stone-200 bg-white shadow-xs'
            : 'border-white/10 bg-white/[0.03]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <Clock className={cn('h-4 w-4', isLight ? 'text-emerald-700' : 'text-emerald-400')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-stone-900' : 'text-white')}>
            Service Standard SLAs
          </h3>
        </div>
        <div className="space-y-2">
          {hkServicePolicies.map((p) => (
            <div
              key={p.id}
              className={cn(
                'p-3 rounded-2xl border transition-colors',
                isLight
                  ? 'border-stone-200 bg-stone-50/80 text-stone-800'
                  : 'border-white/5 bg-white/[0.02]',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('font-bold text-xs', isLight ? 'text-stone-900' : 'text-white')}>{p.title}</span>
                {p.configured ? (
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'text-emerald-300 border-transparent',
                    )}
                  >
                    Configured
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[10px] italic px-2 py-0.5 rounded-full border',
                      isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'text-amber-300 border-transparent',
                    )}
                  >
                    Unconfigured
                  </span>
                )}
              </div>
              <p className={cn('text-[11px] mt-1 leading-relaxed', isLight ? 'text-stone-600' : 'text-mist-400')}>
                {p.summary ?? p.policySummary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
