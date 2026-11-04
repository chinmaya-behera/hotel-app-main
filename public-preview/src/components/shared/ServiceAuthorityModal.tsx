'use client';

import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  HelpCircle,
  X,
  FileText,
  BadgeAlert,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROLE_AUTHORITY_PROFILES, SHARED_SERVICE_POLICIES, type ServicePolicy } from '@/lib/policies';
import type { RoleId } from '@/types/demo';
import { useDemo } from '@/lib/store';

interface ServiceAuthorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: RoleId;
}

export function ServiceAuthorityModal({ isOpen, onClose, roleId }: ServiceAuthorityModalProps) {
  const { state } = useDemo();
  const [activeTab, setActiveTab] = useState<'authority' | 'policies' | 'departments' | 'escalations'>('authority');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const liveDeptPolicies = state.departmentPolicies ?? [];

  if (!isOpen) return null;

  const profile = ROLE_AUTHORITY_PROFILES[roleId] ?? ROLE_AUTHORITY_PROFILES.platform_admin;

  // Filter policies applicable to this role or general
  const applicablePolicies = SHARED_SERVICE_POLICIES.filter(
    (p) => p.appliesTo.includes(roleId) || p.department === 'Property-Wide' || p.department === 'All Departments',
  );

  const departments = ['all', 'Housekeeping', 'Maintenance', 'Front Office', 'Finance & Accounts', 'Safety & Security', 'Procurement'];
  const departmentFilteredPolicies = SHARED_SERVICE_POLICIES.filter(
    (p) => selectedDeptFilter === 'all' || p.department === selectedDeptFilter,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-ink-900 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg text-white font-bold flex items-center gap-2">
                Service Authority & Policies
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-mist-300 uppercase tracking-wider">
                  {profile.roleName}
                </span>
              </h2>
              <p className="text-xs text-mist-400">
                Official operational permissions, authority thresholds, and escalation pathways.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-white/[0.01]">
          <button
            type="button"
            onClick={() => setActiveTab('authority')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'authority'
                ? 'border-amber-400 text-white bg-white/[0.05]'
                : 'border-transparent text-mist-400 hover:text-white'
            }`}
          >
            My Role Authority & Boundaries
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'policies'
                ? 'border-amber-400 text-white bg-white/[0.05]'
                : 'border-transparent text-mist-400 hover:text-white'
            }`}
          >
            Operational Policies ({applicablePolicies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'departments'
                ? 'border-amber-400 text-white bg-white/[0.05]'
                : 'border-transparent text-mist-400 hover:text-white'
            }`}
          >
            Department Policies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escalations')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'escalations'
                ? 'border-amber-400 text-white bg-white/[0.05]'
                : 'border-transparent text-mist-400 hover:text-white'
            }`}
          >
            Escalation Paths
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'authority' && (
            <div className="space-y-6">
              {/* Financial & Delegation Card */}
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Financial Discretion Limit
                    </span>
                    <h3 className="text-2xl font-display font-bold text-white mt-1">
                      {profile.financialLimitDisplay}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-mist-400">Assigned Department</span>
                    <p className="text-sm font-semibold text-mist-200">{profile.department}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-mist-300">
                  Transactions or recovery compensations exceeding this limit must be routed according to the established
                  escalation path.
                </p>
              </div>

              {/* Authorized Operational Powers */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  What You Can View, Create & Approve
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-mist-200">
                  {profile.operationalAuthority.map((power, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{power}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strict Negative Boundaries */}
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Negative Boundaries (Strictly Prohibited)
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-mist-200">
                  {profile.negativeBoundaries.map((boundary, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{boundary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              {applicablePolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-mist-300">
                          {policy.category}
                        </span>
                        <span className="text-[10px] text-amber-300 font-semibold">{policy.department}</span>
                        {!policy.configured && (
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                            <BadgeAlert className="h-3 w-3" />
                            Needs Configuration
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-white mt-2">{policy.title}</h4>
                      <p className="text-xs text-mist-300 mt-1">{policy.summary}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
                    {policy.rules.map((rule, idx) => (
                      <p key={idx} className="text-xs text-mist-400 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">•</span>
                        <span>{rule}</span>
                      </p>
                    ))}
                  </div>

                  {policy.authorityLimit && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[11px] text-amber-300 font-medium">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      <span>Limit: {policy.authorityLimit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-4">
              {/* Department Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      selectedDeptFilter === dept
                        ? 'bg-amber-400 text-ink-950 font-bold'
                        : 'border border-white/10 bg-white/[0.03] text-mist-300 hover:text-white'
                    }`}
                  >
                    {dept === 'all' ? 'All Departments' : dept}
                  </button>
                ))}
              </div>

              {/* Department Manager Policies Section */}
              {liveDeptPolicies.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-purple-500/30 pb-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Department Manager Active Directives ({liveDeptPolicies.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {liveDeptPolicies
                      .filter(
                        (p) =>
                          selectedDeptFilter === 'all' ||
                          p.department.toLowerCase().includes(selectedDeptFilter.toLowerCase()),
                      )
                      .map((policy) => (
                        <div
                          key={policy.id}
                          className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 transition hover:border-purple-500/50 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {policy.category}
                              </span>
                              <span className="text-xs font-bold text-white">{policy.department}</span>
                            </div>
                            <span className="text-[10px] text-mist-400 font-mono">
                              Owner: {policy.policyOwner}
                            </span>
                          </div>

                          <h4 className="font-semibold text-sm text-white">{policy.title}</h4>
                          <p className="text-xs text-mist-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                            {policy.content}
                          </p>

                          <div className="flex items-center justify-between text-[11px] pt-1 text-mist-400">
                            {policy.authorityLimit && (
                              <span className="text-amber-300 font-mono">
                                Ceiling: {policy.authorityLimit}
                              </span>
                            )}
                            {policy.escalationTarget && (
                              <span className="text-mist-300">
                                Escalation: {policy.escalationTarget}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Property-Wide GM Policies Section */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-mist-300">
                    Property-Wide Standards & GM Policies
                  </h3>
                </div>

                <div className="space-y-4">
                  {departmentFilteredPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-sky-400" />
                          <span className="text-xs font-bold text-white">{policy.department ?? 'General'}</span>
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-mist-400">
                            {policy.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-mist-500 font-mono">
                          Owner: General Manager (Property-Wide)
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-white mt-2">{policy.title}</h4>
                      <p className="text-xs text-mist-300 mt-1">{policy.summary}</p>
                      <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                        {policy.rules.map((rule, idx) => (
                          <p key={idx} className="text-xs text-mist-400 flex items-start gap-2">
                            <span className="text-sky-400 font-bold">•</span>
                            <span>{rule}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escalations' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Standard Escalation Chain For Your Role
                </h4>
                <div className="mt-4 space-y-3">
                  {profile.escalationPath.map((path, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-mist-400">Escalate To:</span>
                        <p className="text-sm font-bold text-white mt-0.5">{path.targetRole}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-300">Under Condition:</span>
                        <p className="text-xs text-mist-300 mt-0.5">{path.condition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Escalation Tier Hierarchy */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-400">
                  Property-Wide Authority Escalation Tiers
                </h4>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Tier 1</span>
                    <p className="font-bold text-white mt-1">Frontline Fulfiller</p>
                    <p className="text-[11px] text-mist-400 mt-0.5">Execution / Blocker Reports</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-sky-400">Tier 2</span>
                    <p className="font-bold text-white mt-1">Dispatcher / Supervisor</p>
                    <p className="text-[11px] text-mist-400 mt-0.5">SLA & Quality Inspections</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Tier 3</span>
                    <p className="font-bold text-white mt-1">Department Manager</p>
                    <p className="text-[11px] text-mist-400 mt-0.5">Comp & Capex up to ₹16,000</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-400">Tier 4</span>
                    <p className="font-bold text-white mt-1">General Manager</p>
                    <p className="text-[11px] text-mist-400 mt-0.5">Approvals up to ₹2,00,000</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-white/[0.02]">
          <span className="text-xs text-mist-400">
            Documented in PRD.md, DECISIONS.md & SECURITY.md. Indian Rupee (₹) limits active.
          </span>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
