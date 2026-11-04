'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  FileCheck2,
  KeyRound,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  requestStep,
  verifyPreCheckIn,
  type RequestStep,
} from '@/lib/frontDesk';
import { needsAction } from '@/components/frontdesk/RequestsPanel';
import type { WorkItem, SafetyAlertRecord } from '@/types/demo';

type FilterType = 'all' | 'requests' | 'checkin' | 'alerts';

export function NeedActionPanel({
  onSwitchTab,
}: {
  onSwitchTab?: (tab: string) => void;
}) {
  const {
    state,
    validateSafetyAlertByFrontDesk,
    fdAction,
    notify,
    resetActionableExamples,
  } = useDemo();

  const [filter, setFilter] = useState<FilterType>('all');

  // 1. Actionable guest requests and cases in Front Desk queue
  const queue = state.items.front_desk_coordinator ?? [];
  const actionableRequests = queue.filter(needsAction);

  // 2. Expected arrivals needing identity check / pre-arrival verification
  const arrivalsNeedingId = (state.frontDesk?.stays ?? []).filter(
    (st) => st.status === 'expected' && !st.idChecked,
  );

  // 3. Operational and safety advisories needing Front Desk validation
  const pendingAlerts = (state.safetyAlerts ?? []).filter(
    (a) => a.status === 'draft_pending_validation',
  );

  const totalCount =
    actionableRequests.length + arrivalsNeedingId.length + pendingAlerts.length;

  // Handlers with live simulated feedback
  const handleRequestAction = (
    itemId: string,
    step: RequestStep,
    successMsg: string,
  ) => {
    const err = fdAction((s) => requestStep(s, itemId, step));
    if (err) {
      notify(err);
    } else {
      notify(successMsg);
    }
  };

  const handleVerifyStayId = (stayId: string, guest: string, room: string) => {
    const err = fdAction((s) => verifyPreCheckIn(s, stayId));
    if (err) {
      notify(err);
    } else {
      notify(`✓ Verified ID for ${guest} · Room ${room}. Digital key activated.`);
    }
  };

  const handleValidateAlert = (alertId: string, title: string) => {
    validateSafetyAlertByFrontDesk(
      alertId,
      'Operational impact verified by Front Desk coordinator.',
    );
    notify(`✓ Advisory acknowledged: ${title}`);
  };

  return (
    <div className="space-y-4">
      {/* Minimal Header & Filter Strip */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-white">Action Queue</h2>
                <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  {totalCount} pending
                </span>
              </div>
              <p className="mt-0.5 text-xs text-mist-400">
                High-priority guest requests, arrival ID checks, and operational notices requiring immediate attention.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                filter === 'all'
                  ? 'bg-amber-400 text-ink-950 shadow-sm'
                  : 'text-mist-300 hover:text-white hover:bg-white/[0.04]',
              )}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('requests')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                filter === 'requests'
                  ? 'bg-amber-400 text-ink-950 shadow-sm'
                  : 'text-mist-300 hover:text-white hover:bg-white/[0.04]',
              )}
            >
              Requests ({actionableRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('checkin')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                filter === 'checkin'
                  ? 'bg-amber-400 text-ink-950 shadow-sm'
                  : 'text-mist-300 hover:text-white hover:bg-white/[0.04]',
              )}
            >
              Check-In & ID ({arrivalsNeedingId.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('alerts')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                filter === 'alerts'
                  ? 'bg-amber-400 text-ink-950 shadow-sm'
                  : 'text-mist-300 hover:text-white hover:bg-white/[0.04]',
              )}
            >
              Advisories ({pendingAlerts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {/* 1. Guest Requests & Inquiries */}
        {(filter === 'all' || filter === 'requests') &&
          actionableRequests.map((item) => {
            const isVip = item.priority === 'vip';
            const isAirportTransfer = item.id === 'fd-c1' || item.title.toLowerCase().includes('airport');
            const isLateCheckout = item.id === 'fd-c2' || item.title.toLowerCase().includes('checkout');
            const isLostKey = item.id === 'fd-5' || item.title.toLowerCase().includes('key');

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-4.5 transition-all hover:border-white/20 hover:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left info block */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm mt-0.5',
                        isVip
                          ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                          : isLateCheckout
                            ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                            : 'bg-sky-400/15 text-sky-300 border border-sky-400/30',
                      )}
                    >
                      {isVip ? (
                        <Crown className="h-4 w-4" />
                      ) : isAirportTransfer ? (
                        <Car className="h-4 w-4" />
                      ) : isLateCheckout ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>
                        {isVip && (
                          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                            VIP
                          </span>
                        )}
                        {item.room && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-mist-200">
                            Room {item.room}
                          </span>
                        )}
                        <Badge tone={item.tone ?? 'warning'} className="text-[10px]">
                          {item.chip || item.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-mist-200 leading-relaxed max-w-2xl">
                        {item.description || item.meta}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist-400 pt-0.5">
                        <span>{item.guest ? 'Guest Portal · Verified' : item.channel || 'Walk-in'}</span>
                        <span>·</span>
                        <span>Logged {item.createdAt}</span>
                        {item.ref && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-mist-400">{item.ref}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    {isAirportTransfer ? (
                      <>
                        <Button
                          size="sm"
                          variant="accent"
                          iconLeft={Car}
                          onClick={() =>
                            handleRequestAction(
                              item.id,
                              { kind: 'confirm' },
                              `✓ Confirmed airport chauffeur transfer for Room ${item.room || '518'}. Concierge dispatched.`,
                            )
                          }
                        >
                          Confirm & Dispatch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSwitchTab?.('requests')}
                        >
                          Details
                        </Button>
                      </>
                    ) : isLateCheckout ? (
                      <>
                        <Button
                          size="sm"
                          variant="accent"
                          iconLeft={Clock}
                          onClick={() =>
                            handleRequestAction(
                              item.id,
                              { kind: 'confirm' },
                              `✓ Approved 15:00 late checkout for Room ${item.room || '402'}. Housekeeping schedule updated.`,
                            )
                          }
                        >
                          Approve 15:00
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleRequestAction(
                              item.id,
                              { kind: 'cancel', reason: 'Late checkout unavailable due to immediate back-to-back arrival.' },
                              `Declined late checkout for Room ${item.room || '402'}.`,
                            )
                          }
                        >
                          Decline
                        </Button>
                      </>
                    ) : isLostKey ? (
                      <>
                        <Button
                          size="sm"
                          variant="accent"
                          iconLeft={KeyRound}
                          onClick={() =>
                            handleRequestAction(
                              item.id,
                              { kind: 'close' },
                              `✓ Handed over encoded RFID room key to guest. Case closed.`,
                            )
                          }
                        >
                          Confirm Key Handover
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() =>
                            handleRequestAction(
                              item.id,
                              { kind: 'confirm' },
                              `✓ Confirmed ${item.title}.`,
                            )
                          }
                        >
                          Confirm Action
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSwitchTab?.('requests')}
                        >
                          View
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {/* 2. Expected Arrivals Needing ID Check */}
        {(filter === 'all' || filter === 'checkin') &&
          arrivalsNeedingId.map((stay) => (
            <div
              key={stay.id}
              className="group relative rounded-2xl border border-sky-400/20 bg-sky-400/[0.02] p-4.5 transition-all hover:border-sky-400/40 hover:bg-sky-400/[0.04]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-400/15 text-sky-300 border border-sky-400/30 text-sm mt-0.5">
                    <UserCheck className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Pre-Arrival ID Check · {stay.guest}
                      </h3>
                      {stay.vip && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                          VIP
                        </span>
                      )}
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-mist-200">
                        Room {stay.room} ({stay.roomType})
                      </span>
                      <Badge tone="warning" className="text-[10px]">
                        ID Check Needed
                      </Badge>
                    </div>

                    <p className="text-xs text-mist-200 leading-relaxed max-w-2xl">
                      Guest arriving {stay.arrival}. Digital passport scan submitted via Guest Portal. Verify ID at the front desk to issue active digital room key.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist-400 pt-0.5">
                      <span>Card on file: {stay.cardMask}</span>
                      <span>·</span>
                      <span>{stay.nights} Nights stay</span>
                      <span>·</span>
                      <span>Departure: {stay.departure}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  <Button
                    size="sm"
                    variant="accent"
                    iconLeft={FileCheck2}
                    onClick={() => handleVerifyStayId(stay.id, stay.guest, stay.room)}
                  >
                    Verify ID & Ready Key
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSwitchTab?.('stays')}
                  >
                    Stays Board
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {/* 3. Safety & Maintenance Advisories */}
        {(filter === 'all' || filter === 'alerts') &&
          pendingAlerts.map((alert) => (
            <div
              key={alert.id}
              className="group relative rounded-2xl border border-amber-400/25 bg-amber-400/[0.02] p-4.5 transition-all hover:border-amber-400/40 hover:bg-amber-400/[0.04]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 text-sm mt-0.5">
                    <ShieldAlert className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">{alert.title}</h3>
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30 uppercase">
                        {alert.priority}
                      </span>
                      <span className="font-mono text-[10px] text-mist-400">{alert.ref}</span>
                    </div>

                    <p className="text-xs text-mist-200 leading-relaxed max-w-2xl">{alert.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist-400 pt-0.5">
                      <span>Location: {alert.location}</span>
                      <span>·</span>
                      <span>Reported by {alert.reportedBy} ({alert.reportedAt})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  <Button
                    size="sm"
                    variant="accent"
                    iconLeft={Check}
                    onClick={() => handleValidateAlert(alert.id, alert.title)}
                  >
                    Acknowledge Advisory
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {/* Empty State */}
        {totalCount === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Action Queue Is Clear</h3>
              <p className="mt-1 text-xs text-mist-400 max-w-md mx-auto">
                All high-priority guest inquiries, check-in ID verifications, and maintenance advisories have been addressed.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={resetActionableExamples}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-300" />
                <span>Reload Demo Items</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter empty state when total > 0 but selected filter has 0 */}
        {totalCount > 0 &&
          ((filter === 'requests' && actionableRequests.length === 0) ||
            (filter === 'checkin' && arrivalsNeedingId.length === 0) ||
            (filter === 'alerts' && pendingAlerts.length === 0)) && (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-mist-400">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400/80 mb-2" />
              <p className="font-semibold text-white">No pending items in this category.</p>
              <p className="mt-1">All items in this section have been completed.</p>
            </div>
          )}
      </div>
    </div>
  );
}
