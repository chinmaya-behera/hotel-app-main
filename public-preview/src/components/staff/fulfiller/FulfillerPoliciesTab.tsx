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
    <div className="flex flex-col gap-3.5 pb-6 sm:pb-8 text-xs">
      {/* Header Banner */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-[#3d3a32] bg-[#1e1e1b] text-[#eee8dc]',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
              isLight
                ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                : 'border-[#867e6c] bg-[#282720] text-[#ded6c1]',
            )}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className={cn('font-bold text-sm sm:text-base', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
              Service Authority & SOP Policies
            </h2>
            <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
              Operational boundaries, guest privacy standards & supervisor escalation protocol
            </p>
          </div>
        </div>

        {/* Financial Spending Limit Callout */}
        <div
          className={cn(
            'mt-3.5 flex items-center justify-between rounded-2xl border px-3.5 py-2.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#fbfaf7]'
              : 'border-[#3d3a32] bg-[#282720]/60',
          )}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
            <span className={cn('font-bold text-xs', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
              Financial Discretionary Limit
            </span>
          </div>
          <span
            className={cn(
              'font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] border',
              isLight
                ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]'
                : 'bg-[#343127] text-[#ded6c1] border-[#867e6c]',
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
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-[#3d3a32] bg-[#1e1e1b]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
            Operational Authority (Allowed Actions)
          </h3>
        </div>
        <ul className={cn('space-y-2 leading-relaxed', isLight ? 'text-[#686252] font-medium' : 'text-[#b7b0a1]')}>
          {(policy.operationalAuthority ?? policy.canDo ?? []).map((action, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-[#353229]' : 'bg-[#ded6c1]')} />
              <span>{action}</span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-[#353229]' : 'bg-[#ded6c1]')} />
            <span>Self-claim eligible unassigned department tasks across Floors 1–5 before supervisor assignment.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-[#353229]' : 'bg-[#ded6c1]')} />
            <span>Submit task reassignment requests with documented reason to your department supervisor.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', isLight ? 'bg-[#353229]' : 'bg-[#ded6c1]')} />
            <span>Attach photo proof for turnover readiness and maintenance completions.</span>
          </li>
        </ul>
      </div>

      {/* Strict Negative Boundaries: What You Cannot Do */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 space-y-3 transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-rose-500/40 bg-[#241215]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className={cn('h-4 w-4', isLight ? 'text-rose-700' : 'text-rose-400')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
            Strict Negative Boundaries (Escalation Required)
          </h3>
        </div>
        <ul className={cn('space-y-2 leading-relaxed', isLight ? 'text-[#686252] font-medium' : 'text-rose-200/90')}>
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
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-[#3d3a32] bg-[#1e1e1b]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <PhoneCall className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
            Escalation Guidance & Contacts
          </h3>
        </div>
        <div className="space-y-2">
          <div
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between gap-3',
              isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-[#3d3a32] bg-[#282720]/60',
            )}
          >
            <div>
              <span className={cn('font-bold block text-xs', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                Combined Dispatcher / Supervisor
              </span>
              <span className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Operational Blockers, Clean Supplies & Reassignments
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-bold text-xs shrink-0 px-2.5 py-1 rounded-xl border',
                isLight ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]' : 'border-[#867e6c] bg-[#343127] text-[#ded6c1]',
              )}
            >
              Radio Ch 3 / Ext 4020
            </span>
          </div>

          <div
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between gap-3',
              isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-[#3d3a32] bg-[#282720]/60',
            )}
          >
            <div>
              <span className={cn('font-bold block text-xs', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                Duty Manager
              </span>
              <span className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Guest Disputes, VIP Requests & Policy Escalations
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-bold text-xs shrink-0 px-2.5 py-1 rounded-xl border',
                isLight ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]' : 'border-[#867e6c] bg-[#343127] text-[#ded6c1]',
              )}
            >
              Ext 9999
            </span>
          </div>

          <div
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between gap-3',
              isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-[#3d3a32] bg-[#282720]/60',
            )}
          >
            <div>
              <span className={cn('font-bold block text-xs', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
                Security & Life Safety
              </span>
              <span className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                Immediate Hazard, Medical or Physical Safety Concern
              </span>
            </div>
            <span
              className={cn(
                'font-mono font-bold text-xs shrink-0 px-2.5 py-1 rounded-xl border',
                isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'text-rose-400 border-rose-500/30 bg-rose-500/10',
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
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-[#3d3a32] bg-[#1e1e1b]',
        )}
      >
        <div className="flex items-center gap-2 font-bold">
          <Clock className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
          <h3 className={cn('font-bold text-xs sm:text-sm', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
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
                  ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                  : 'border-[#3d3a32] bg-[#282720]/60',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('font-bold text-xs', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>{p.title}</span>
                {p.configured ? (
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      isLight ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]' : 'border-[#867e6c] bg-[#343127] text-[#ded6c1]',
                    )}
                  >
                    Configured
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[10px] italic px-2 py-0.5 rounded-full border',
                      isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'text-amber-300 border-amber-500/30 bg-amber-500/10',
                    )}
                  >
                    Unconfigured
                  </span>
                )}
              </div>
              <p className={cn('text-[11px] mt-1 leading-relaxed', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
                {p.summary ?? p.policySummary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
