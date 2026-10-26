'use client';

import { useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Filter,
  Globe,
  HelpCircle,
  Lock,
  Mail,
  Moon,
  Phone,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
  Wallet,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { InAppNotification } from '@/types/demo';

interface ExecutiveProfileTabProps {
  initialSubTab?: 'profile' | 'notifications' | 'settings';
  permissionMode: 'viewer' | 'approver';
  onTogglePermissionMode: (mode: 'viewer' | 'approver') => void;
  onNavigateTab?: (tabId: string) => void;
}

export function ExecutiveProfileTab({
  initialSubTab = 'profile',
  permissionMode,
  onTogglePermissionMode,
  onNavigateTab,
}: ExecutiveProfileTabProps) {
  const { state, markNotificationRead, clearAllNotifications, notify, savePreferences, account } = useDemo();
  const [subTab, setSubTab] = useState<'profile' | 'notifications' | 'settings'>(initialSubTab);

  const prefs=(state as any).preferences?.[account?.username||'']?.executive||{};
  // Preferences persist per authenticated account.
  const [emailAlerts, setEmailAlerts] = useState(prefs.emailAlerts??true);
  const [smsUrgent, setSmsUrgent] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(prefs.autoRefreshInterval??'30s');
  const [displayDensity, setDisplayDensity] = useState(prefs.displayDensity??'comfortable');

  // Alex Morgan persona account
  const priyaAccount = (state.staffAccounts ?? []).find(
    (s) => s.employeeId === 'EMP-0109' || s.roleId === 'executive_viewer',
  ) || {
    id: 'usr-9',
    employeeId: 'EMP-0109',
    name: 'Alex Morgan',
    email: 'p.nair@thegrandadp.com',
    department: 'Executive Office',
    floorZone: 'Property-wide',
    shift: 'Day',
    status: 'active',
    financialLimit: 200000,
    skills: ['Executive Oversight', 'High Limit Approvals'],
  };

  const notifications = state.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSaveSettings = () => {
    savePreferences('executive',{emailAlerts,smsUrgent,autoRefreshInterval,displayDensity});
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-navy-950 dark:text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Executive Profile & Workspace Settings
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20">
              Alex Morgan · General Manager
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
            Credentialed profile, delegated sign-off limits, and executive notification channels.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
          {[
            { id: 'profile', label: 'My Profile' },
            { id: 'notifications', label: 'Notifications', count: unreadCount },
            { id: 'settings', label: 'Preferences' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                subTab === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    subTab === tab.id ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subtab 1: Profile View */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left card: Persona summary */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
            <div className="text-center space-y-2">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white grid place-items-center text-2xl font-black shadow-xl">
                PN
              </div>
              <h3 className="text-base font-black text-navy-950 dark:text-white">
                {priyaAccount.name}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                General Manager & Executive Director
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-[11px] font-mono text-slate-600 dark:text-mist-300">
                {priyaAccount.employeeId} · Active Status
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-mist-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-400" /> Email
                </span>
                <span className="font-mono text-navy-950 dark:text-white">{priyaAccount.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-mist-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" /> Office
                </span>
                <span className="font-medium text-navy-950 dark:text-white">{priyaAccount.department}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-mist-300">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-slate-400" /> Jurisdiction
                </span>
                <span className="font-medium text-navy-950 dark:text-white">Property-Wide (All Floors)</span>
              </div>
            </div>
          </div>

          {/* Right card: Authority, Limits, & Delegation Policy */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Delegated Authority & Statutory Governance
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">
                    Discretionary Financial Ceiling
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-300 mt-1">
                    ₹2,00,000
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-1">
                    Per-transaction capex and guest recovery ceiling. Requests above this require Board resolution.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/[0.08] border border-purple-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">
                    Policy Waiver Authority
                  </span>
                  <div className="text-base font-black text-navy-950 dark:text-white mt-1">
                    Unrestricted
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-1">
                    Authorized to waive cancellation fees, deposit guarantees, and VIP upgrade limits.
                  </p>
                </div>
              </div>

              {/* Separation of Duties Note */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <span className="font-bold text-navy-950 dark:text-white block">
                  Separation of Duties Policy (SOD Invariant):
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-mist-300">
                  <li>Executives hold oversight and sign-off authority only; direct physical task execution is reserved for operational fulfillers.</li>
                  <li>No self-approval of personal expense reimbursements or personal stay adjustments.</li>
                  <li>All authorizations are committed immutably to the permanent system audit trail.</li>
                </ul>
              </div>
            </div>

            {/* Permission Mode Switcher Demonstration Card */}
            <div className="p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                    Simulate Permission Mode (Viewer vs Approver)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-mist-400">
                    Toggle between read-only audit inspection and full approval sign-off authority.
                  </p>
                </div>

                <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-ink-950/80">
                  <button
                    type="button"
                    onClick={() => onTogglePermissionMode('viewer')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      permissionMode === 'viewer'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    Viewer (Read-Only)
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePermissionMode('approver')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      permissionMode === 'approver'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    Approver (Full Access)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Notifications Center */}
      {subTab === 'notifications' && (
        <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-950 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Executive Notification Stream
              </h3>
              <p className="text-xs text-slate-500 dark:text-mist-400">
                Direct high-priority alerts regarding new capex requests, major incidents, and operational bottlenecks.
              </p>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllNotifications()}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 dark:text-mist-500">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              All notifications cleared.
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    notif.read
                      ? 'border-slate-200/70 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] opacity-75'
                      : 'border-amber-500/30 bg-amber-500/[0.06] shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-navy-950 dark:text-white">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-mist-300">
                      {notif.message}
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-mist-500">
                      {notif.timestamp}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(notif.id);
                      if (onNavigateTab && notif.itemId) onNavigateTab('approvals');
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Preferences / Settings */}
      {subTab === 'settings' && (
        <div className="p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-lg space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-950 dark:text-white">
              Executive Console Preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-mist-400">
              Customize real-time telemetry polling, notification thresholds, and currency formats.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* Toggle 1: Email Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <div>
                <span className="text-xs font-bold text-navy-950 dark:text-white block">
                  Email Dispatch on Capex &gt; ₹25,000
                </span>
                <span className="text-[11px] text-slate-500 dark:text-mist-400">
                  Sends formal quotation packages directly to Alex Morgan's executive inbox.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
              />
            </div>

            {/* Toggle 2: SMS Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <div>
                <span className="text-xs font-bold text-navy-950 dark:text-white block">
                  SMS / WhatsApp on Critical Incidents
                </span>
                <span className="text-[11px] text-slate-500 dark:text-mist-400">
                  Immediate pager notification when security panic alarms or major water leaks occur.
                </span>
              </div>
              <input
                type="checkbox"
                checked={smsUrgent}
                onChange={(e) => setSmsUrgent(e.target.checked)}
                className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
              />
            </div>

            {/* Polling Interval */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5">
              <label className="text-xs font-bold text-navy-950 dark:text-white block">
                Telemetry Auto-Refresh Cadence
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white"
              >
                <option value="15s">15 seconds (High Frequency)</option>
                <option value="30s">30 seconds (Standard)</option>
                <option value="60s">60 seconds (Conservative)</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Executive Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
