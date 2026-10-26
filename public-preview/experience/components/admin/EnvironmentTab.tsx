'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  HardDrive,
  Info,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { roles } from '@/lib/roles';

export function EnvironmentTab() {
  const { state, reset, notify, recordAuditEvent, systemDiagnostic } = useDemo();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Computed record stats
  const totalTasks = Object.values(state.items).reduce((sum, list) => sum + list.length, 0);
  const totalStays = state.frontDesk.stays.length;
  const totalBookings = state.bookings.length;
  const totalFolios = Object.keys(state.folios).length;
  const totalStaff = state.staffAccounts?.length ?? 0;
  const totalAuditEvents = state.auditTrail?.length ?? 0;
  const totalLostFound = state.lostFound.length;

  const handleSimulateNightAudit = () => {
    systemDiagnostic();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-sky-400" />
            Workspace diagnostics
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Inspect your persisted workspace and check ledger consistency without changing financial records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="accent"
            iconLeft={Zap}
            onClick={handleSimulateNightAudit}
          >
            Check balance consistency
          </Button>

          <Button
            size="sm"
            variant="subtle"
            iconLeft={RotateCcw}
            onClick={() => setResetConfirmOpen(true)}
            className="hover:border-rose-400/50 hover:text-rose-300"
          >
            Reset Demo State
          </Button>
        </div>
      </div>

      {/* Storage and Architecture Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-2">
          <span className="text-xs font-semibold text-mist-400">Total Work Items</span>
          <span className="font-display text-3xl font-extrabold text-white block">
            {totalTasks}
          </span>
          <span className="text-[11px] text-mist-400 block">Across 9 role queues</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-2">
          <span className="text-xs font-semibold text-mist-400">In-House Stays & Bookings</span>
          <span className="font-display text-3xl font-extrabold text-white block">
            {totalStays + totalBookings}
          </span>
          <span className="text-[11px] text-mist-400 block">{totalStays} stays · {totalBookings} web bookings</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-2">
          <span className="text-xs font-semibold text-mist-400">Staff Accounts (RBAC)</span>
          <span className="font-display text-3xl font-extrabold text-white block">
            {totalStaff}
          </span>
          <span className="text-[11px] text-mist-400 block">All 9 operational profiles</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-2">
          <span className="text-xs font-semibold text-mist-400">Audit Trail Events</span>
          <span className="font-display text-3xl font-extrabold text-emerald-400 block">
            {totalAuditEvents}
          </span>
          <span className="text-[11px] text-mist-400 block">Chronological change logs</span>
        </div>
      </div>

      {/* Architecture Boundaries Guarantee */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Frontend-Only Architectural Boundary Guarantees
        </h3>
        <p className="text-xs text-mist-300">
          This prototype operates with zero live server dependencies. All state management, role authorization, and workflow progression run locally within this browser session.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-1.5">
            <strong className="text-white block font-semibold">1. Zero Live Backends</strong>
            <p className="text-mist-400">
              No real databases, API server actions, or external microservices are contacted.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-1.5">
            <strong className="text-white block font-semibold">2. Masked Card Credentials</strong>
            <p className="text-mist-400">
              Only simulated tokens (`•••• 4242`) are retained. Raw payment information is never stored.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-1.5">
            <strong className="text-white block font-semibold">3. Cross-Role Reactivity</strong>
            <p className="text-mist-400">
              Changes committed here immediately propagate to Front Desk, Dispatcher, Guest Portal, and Finance.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-ink-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-display text-lg font-bold text-white">Reset Demo State?</h4>
                <p className="text-xs text-mist-300">Restores all tasks, stays, staff, and folios to default seed data.</p>
              </div>
            </div>

            <p className="text-xs text-mist-400">
              This will clear all changes made during this browsing session, including custom staff accounts, mock bookings, and simulated QR session revocations.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="subtle" size="sm" onClick={() => setResetConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  setResetConfirmOpen(false);
                  reset();
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold"
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
