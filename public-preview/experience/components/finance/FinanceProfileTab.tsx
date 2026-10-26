'use client';

import {useDemo} from '@/lib/store';
import { useState } from 'react';
import {
  User,
  Shield,
  Lock,
  Check,
  X,
  Bell,
  Mail,
  Building2,
  Clock,
  Award,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';

export function FinanceProfileTab() {
  const {state,account,savePreferences}=useDemo();
  const preferences=(state as any).preferences?.[account?.username||'']?.financeProfile||{};
  const [soundAlerts, setSoundAlerts] = useState(preferences.soundAlerts??true);
  const [highValueAlerts, setHighValueAlerts] = useState(preferences.highValueAlerts??true);
  const [dailyClosingAlerts, setDailyClosingAlerts] = useState(preferences.dailyClosingAlerts??true);
  const [refundEscalationAlerts, setRefundEscalationAlerts] = useState(preferences.refundEscalationAlerts??true);

  // Read-only permissions matrix
  const permissions = [
    { key: 'view_folios', label: 'View Guest Folios & Invoices', category: 'Guest Billing', granted: true, note: 'Full read access to all guest bills' },
    { key: 'generate_invoices', label: 'Generate Itemized Invoices', category: 'Guest Billing', granted: true, note: 'Create new 18% GST compliant tax folios' },
    { key: 'record_payments', label: 'Record & Settle Payments', category: 'Transactions', granted: true, note: 'Clear folios via UPI, Card, Net Banking & Cash' },
    { key: 'reconcile_transactions', label: 'Reconcile Bank Statements', category: 'Ledger Audit', granted: true, note: 'Independently review recorded sandbox transactions' },
    { key: 'approve_refunds', label: 'Request Refund Approval', category: 'Refunds', granted: true, note: 'Executive approval precedes Finance execution' },
    { key: 'export_reports', label: 'Export Financial & Audit CSVs', category: 'Reports', granted: true, note: 'Download daily revenue summaries and ledgers' },
    { key: 'exec_comp_waiver', label: 'Executive Comp Waivers', category: 'Authorizations', granted: false, note: 'Requires Executive Approver / GM authorization' },
    { key: 'ledger_write_off', label: 'Bad Debt Write-Offs', category: 'Authorizations', granted: false, note: 'Restricted to Chief Financial Officer' },
    { key: 'modify_permissions', label: 'Self-Modify Clearance Limits', category: 'Administration', granted: false, note: 'Enforced by IT / Platform Administrator' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="h-5 w-5 text-primary-400" />
          Employee Profile & Financial Permissions
        </h2>
        <p className="text-xs text-mist-400">
          Operator credentials, transaction authorization thresholds, and assigned role scopes.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-ink-900 border border-white/10 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-teal-400 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-primary-900/30">
            NK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{account?.person||'Finance operator'}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" /> Active Session
              </span>
            </div>
            <p className="text-xs text-mist-300 font-mono">EMP-0107 · Financial Operator</p>
            <p className="text-xs text-mist-400 mt-1">Finance & Accounts Department · Day Shift</p>
          </div>
        </div>

        {/* Clearance Limit Pill */}
        <div className="p-4 rounded-xl bg-ink-950 border border-white/10 w-full md:w-auto">
          <p className="text-[10px] uppercase font-semibold text-mist-400">Approved Clearance Threshold</p>
          <p className="text-xl font-black text-primary-400 mt-0.5">₹80,000 / transaction</p>
          <p className="text-[10px] text-mist-500 mt-0.5">Dual SLA Escalation enabled for &gt; ₹80,000</p>
        </div>
      </div>

      {/* Grid: Details & Notification Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Operator Workstation Information */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-400" />
            Station & Department Assignment
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-mist-400">Workstation:</span>
              <span className="text-white font-semibold">Finance & Accounting Suite (Room 204)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-mist-400">Operating Shift:</span>
              <span className="text-white font-semibold">Day Shift (08:00 - 17:00 IST)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-mist-400">Direct Supervisor:</span>
              <span className="text-white font-semibold">Sunil Sharma (Duty Manager)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-mist-400">PMS & POS Terminal:</span>
              <span className="text-white font-mono font-semibold">TERM-FIN-02 (Verified)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-mist-400">Compliance Certification:</span>
              <span className="text-emerald-400 font-semibold">Hospitality GST & PCI-DSS L1</span>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary-400" />
            Notification Preferences
          </h4>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-white/5 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Payment Decline Audible Alert</p>
                <p className="text-[10px] text-mist-400">Play alert sound when gateway transaction fails</p>
              </div>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="rounded bg-ink-900 border-white/20 text-primary-600 h-4 w-4 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-white/5 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">High-Value Transaction Alerts</p>
                <p className="text-[10px] text-mist-400">Instant notification for payments exceeding ₹50,000</p>
              </div>
              <input
                type="checkbox"
                checked={highValueAlerts}
                onChange={(e) => setHighValueAlerts(e.target.checked)}
                className="rounded bg-ink-900 border-white/20 text-primary-600 h-4 w-4 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-white/5 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Refund Escalation Notices</p>
                <p className="text-[10px] text-mist-400">Notify when guest disputes remain unreviewed for &gt; 2h</p>
              </div>
              <input
                type="checkbox"
                checked={refundEscalationAlerts}
                onChange={(e) => setRefundEscalationAlerts(e.target.checked)}
                className="rounded bg-ink-900 border-white/20 text-primary-600 h-4 w-4 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-white/5 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Daily Financial Closing Digest</p>
                <p className="text-[10px] text-mist-400">Receive shift handover revenue CSV summary</p>
              </div>
              <input
                type="checkbox"
                checked={dailyClosingAlerts}
                onChange={(e) => setDailyClosingAlerts(e.target.checked)}
                className="rounded bg-ink-900 border-white/20 text-primary-600 h-4 w-4 focus:ring-0"
              />
            </label>
          </div>
        </div>

      </div>

      {/* Permissions Matrix (Requirement 8) */}
      <div className="p-5 rounded-2xl bg-ink-900 border border-white/10 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Role Authorization Matrix (Read-Only)
            </h4>
            <p className="text-xs text-mist-400">
              Role permissions are centrally provisioned in accordance with enterprise separation of duties.
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-ink-950 text-mist-400 border border-white/10">
            <Lock className="h-3 w-3 text-amber-400" /> Self-Modification Disabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-ink-950/60 text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-2.5 px-3">Permission Scope</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Enforcement Details</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-semibold text-white">
                    {perm.label}
                  </td>
                  <td className="py-3 px-3 text-mist-400">
                    {perm.category}
                  </td>
                  <td className="py-3 px-3 text-mist-300">
                    {perm.note}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {perm.granted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-mist-500 border border-white/10">
                        <Lock className="h-3 w-3" /> Restricted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Security Policy: Financial Operators cannot elevate their own transaction clearance limits or alter permission scopes. Contact your Platform Administrator or General Manager for scope modifications.
          </span>
        </div>
      </div>

    </div>
  );
}
