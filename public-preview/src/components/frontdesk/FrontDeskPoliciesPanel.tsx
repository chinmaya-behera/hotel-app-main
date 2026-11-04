'use client';

import { useState } from 'react';
import {
  BookOpen,
  FileText,
  ShieldAlert,
  KeyRound,
  ArrowRightLeft,
  DollarSign,
  PhoneCall,
  UserCheck,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

export function FrontDeskPoliciesPanel() {
  const { state } = useDemo();
  const [filterDept, setFilterDept] = useState<'all' | 'front_office' | 'security' | 'gm'>('all');
  const [search, setSearch] = useState('');

  const policies = state.departmentPolicies ?? [];
  const filtered = policies.filter((p) => {
    if (filterDept === 'front_office' && !p.department.toLowerCase().includes('front')) return false;
    if (filterDept === 'security' && !p.department.toLowerCase().includes('security')) return false;
    if (filterDept === 'gm' && !p.department.toLowerCase().includes('management') && !p.department.toLowerCase().includes('operations')) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.scope.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Policy Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sky-400" />
          <span>Front Desk Service Authority & Operating Policies</span>
        </h2>
        <p className="text-xs text-mist-300 mt-1">
          Front office operational responsibilities, key issuing limits, ₹2,500 discretionary goodwill threshold, and manager escalation workflows.
        </p>
      </div>

      {/* Front Desk Quick Authority Reference Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Goodwill Compensation
          </span>
          <p className="text-xl font-bold text-white">Up to ₹2,500</p>
          <p className="text-[11px] text-mist-300">
            Instant Front Desk folio credit authority for check-in delays or amenity faults.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Room Relocation
          </span>
          <p className="text-xl font-bold text-white">Vacant & Inspected</p>
          <p className="text-[11px] text-mist-300">
            Authorized to move guests to "ready" rooms only. Old QR session immediately revoked.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Safety Escalation
          </span>
          <p className="text-xl font-bold text-white">Duty Manager / GM</p>
          <p className="text-[11px] text-mist-300">
            Safety alerts validated at Front Desk must be signed off by General Manager before broadcast.
          </p>
        </div>
      </div>

      {/* Policies Catalog */}
      <Panel
        title="Documented Hotel Service Policies"
        hint="Property-wide and front-office specific directives"
        icon={FileText}
        action={
          <div className="relative w-48">
            <input
              type="text"
              placeholder="Search policy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field text-xs w-full py-1.5"
            />
          </div>
        }
      >
        <div className="space-y-3">
          {filtered.map((pol) => (
            <div
              key={pol.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4.5 space-y-2.5 text-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{pol.department}</Badge>
                    <Badge tone="neutral">{pol.category}</Badge>
                    {pol.authorityLimit !== undefined && Number(pol.authorityLimit) > 0 && (
                      <Badge tone="success">Limit: {money(Number(pol.authorityLimit))}</Badge>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-white">{pol.title}</h3>
                </div>
                <span className="text-[11px] font-mono text-mist-400">
                  Updated: {pol.lastUpdated}
                </span>
              </div>

              <p className="text-xs text-mist-200">{pol.summary}</p>

              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-mist-400">
                <span>Scope: <strong className="text-mist-200">{pol.scope}</strong></span>
                <span className="text-amber-300">Escalation: {pol.escalationTarget}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
