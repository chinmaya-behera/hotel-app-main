'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  HelpCircle,
  Inbox,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { WorkItem, SafetyAlertRecord } from '@/types/demo';

export function NeedActionPanel({
  onSwitchTab,
}: {
  onSwitchTab?: (tab: string) => void;
}) {
  const {
    state,
    validateSafetyAlertByFrontDesk,
    broadcastSafetyAlert,
    advance,
    fdAction,
    notify,
  } = useDemo();

  const [validationNotes, setValidationNotes] = useState<Record<string, string>>({});
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlertRecord | null>(null);

  // 1. Safety Alerts needing validation or broadcast
  const pendingValidationAlerts = (state.safetyAlerts ?? []).filter(
    (a) => a.status === 'draft_pending_validation',
  );
  const approvedForBroadcastAlerts = (state.safetyAlerts ?? []).filter(
    (a) => a.status === 'approved_ready_broadcast',
  );

  // 2. Urgent / Critical Front Desk work items
  const queue = state.items.front_desk_coordinator ?? [];
  const urgentQueue = queue.filter(
    (i) =>
      i.priority === 'urgent' ||
      i.priority === 'critical' ||
      i.priority === 'safety' ||
      i.status === 'New' ||
      i.status === 'Needs action' ||
      i.status === 'Pending triage',
  );

  // 3. Stays needing check-in verification
  const arrivalsNeedingId = (state.frontDesk?.stays ?? []).filter(
    (st) => st.status === 'expected' && !st.idChecked,
  );

  // 4. Folio disputes needing front desk / finance escalation
  const complaintsNeedingAction = (state.frontDesk?.complaints ?? []).filter(
    (c) => c.comp > 0 && !c.compApplied,
  );

  const totalActionCount =
    pendingValidationAlerts.length +
    approvedForBroadcastAlerts.length +
    urgentQueue.length +
    arrivalsNeedingId.length;

  const handleValidateAlert = (alert: SafetyAlertRecord) => {
    const notes = validationNotes[alert.id] || 'Operational impact verified by Front Desk coordinator. Safety perimeter cleared.';
    validateSafetyAlertByFrontDesk(alert.id, notes);
  };

  const handleBroadcastAlert = (alert: SafetyAlertRecord) => {
    broadcastSafetyAlert(alert.id);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-ink-900 to-amber-950/20 p-5 shadow-xl text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Front Desk Operational Action Queue
              </h2>
              <p className="text-xs text-mist-300">
                Prioritized items requiring immediate front office triage, safety escalation, or guest resolution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={totalActionCount > 0 ? 'danger' : 'success'} className="px-3 py-1 text-xs">
              {totalActionCount} actionable item{totalActionCount === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Critical Section 1: Safety Alerts Workflow (Cross-role validation) */}
      {(pendingValidationAlerts.length > 0 || approvedForBroadcastAlerts.length > 0) && (
        <Panel
          title="Safety Alert Broadcast Escalations"
          hint="Security Responder drafted alerts requiring Front Desk validation or GM approved broadcast"
          icon={ShieldAlert}
        >
          <div className="space-y-3.5">
            {pendingValidationAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4.5 space-y-3 text-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="warning">Step 2: Front Desk Validation Required</Badge>
                      <Badge tone="danger">{alert.priority.toUpperCase()}</Badge>
                      <span className="text-xs font-mono text-mist-400">{alert.ref}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-white">{alert.title}</h3>
                    <p className="mt-0.5 text-xs text-mist-300">{alert.description}</p>
                    <p className="mt-1.5 text-[11px] text-amber-200 font-mono">
                      Location: {alert.location} · Reported by: {alert.reportedBy} ({alert.reportedAt})
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Optional front desk triage validation note..."
                      value={validationNotes[alert.id] || ''}
                      onChange={(e) =>
                        setValidationNotes((prev) => ({ ...prev, [alert.id]: e.target.value }))
                      }
                      className="field text-xs w-full"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="accent"
                    iconLeft={FileCheck2}
                    onClick={() => handleValidateAlert(alert)}
                  >
                    Validate & Escalate to Manager
                  </Button>
                </div>
              </div>
            ))}

            {approvedForBroadcastAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.05] p-4.5 space-y-3 text-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="success">Step 4: Manager Approved · Ready for Broadcast</Badge>
                      <Badge tone="danger">{alert.priority.toUpperCase()}</Badge>
                      <span className="text-xs font-mono text-mist-400">{alert.ref}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-white">{alert.title}</h3>
                    <p className="mt-0.5 text-xs text-mist-300">{alert.description}</p>
                    <p className="mt-1.5 text-[11px] text-emerald-300 font-mono">
                      Approved by: {alert.approvedBy} ({alert.approvedAt}) · Scope: Property-Wide
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="accent"
                    iconLeft={Radio}
                    onClick={() => handleBroadcastAlert(alert)}
                    className="shadow-lg shadow-emerald-500/20"
                  >
                    Broadcast Live Alert
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Section 2: Urgent Guest Requests & Operational Items */}
      <Panel
        title="Urgent Guest Cases & In-Flight Inquiries"
        hint="High priority guest requests routed through Front Desk requiring immediate assignment or status review"
        icon={Inbox}
      >
        {urgentQueue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-mist-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/80 mb-2" />
            <p className="font-medium text-white">No urgent guest requests pending Front Desk action.</p>
            <p className="text-xs text-mist-500 mt-1">All in-flight requests are actively claimed or dispatched to departments.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {urgentQueue.map((item) => (
              <div key={item.id} className="p-4 space-y-2 hover:bg-white/[0.02] transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-white">{item.title}</span>
                      <Badge tone={item.priority === 'critical' ? 'danger' : 'warning'}>
                        {item.priority?.toUpperCase() ?? 'URGENT'}
                      </Badge>
                      {item.room && <Badge tone="neutral">Room {item.room}</Badge>}
                      {item.ref && <span className="text-[11px] font-mono text-mist-400">{item.ref}</span>}
                    </div>
                    <p className="mt-1 text-xs text-mist-300">{item.description || item.meta}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-mist-400">
                      <span>Source: {item.guest ? 'Guest Portal (Digital)' : 'Front Desk Counter'}</span>
                      <span>·</span>
                      <span>Department: {item.routedTo || item.category || 'Front Office'}</span>
                      <span>·</span>
                      <span>Status: <strong className="text-white">{item.status}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        advance('front_desk_coordinator', item.id, 'Acknowledged');
                      }}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => {
                        if (onSwitchTab) onSwitchTab('requests');
                      }}
                    >
                      Open in Requests
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Section 3: Expected Arrivals Needing Identity Verification */}
      {arrivalsNeedingId.length > 0 && (
        <Panel
          title="Arrivals Requiring ID Verification"
          hint="Pre-arrival or arriving guests whose ID has not yet been verified at the counter"
          icon={UserCheck}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {arrivalsNeedingId.map((stay) => (
              <div
                key={stay.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      {stay.guest}
                      {stay.vip && <Badge tone="accent">VIP</Badge>}
                    </h4>
                    <p className="text-xs text-mist-400">
                      Room {stay.room} · {stay.roomType} · Arriving {stay.arrival}
                    </p>
                  </div>
                  <Badge tone="warning">ID Check Needed</Badge>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (onSwitchTab) onSwitchTab('stays');
                    }}
                  >
                    Go to Stays Board
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
