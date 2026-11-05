'use client';

import { useState } from 'react';
import {
  Scale,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  Send,
  Landmark,
  ShieldCheck,
  Undo2,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import type { SyncIssue } from '@/types/demo';

export interface CompensationItem {
  id: string;
  guest: string;
  room: string;
  amount: number;
  type: 'Folio Credit' | 'Dining Voucher' | 'Rate Adjustment' | 'Spa Pass';
  reason: string;
  status: 'Pending Finance' | 'Routed to Financial Op.' | 'Approved & Applied';
  requestedAt: string;
  financialOperator?: string;
  withinSopLimit: boolean; // SOP goodwill limit $150 / ₹2,500
}

export interface RefundDisputeItem {
  id: string;
  guest: string;
  room: string;
  folioRef: string;
  category: 'Minibar Fault' | 'POS Double Charge' | 'Late Checkout Dispute' | 'Security Deposit Release';
  amount: number;
  cardMask: string;
  description: string;
  status: 'Pending Finance' | 'Approved' | 'Refunded';
  reportedAt: string;
  resolutionNote?: string;
}

const INITIAL_COMPENSATIONS: CompensationItem[] = [
  {
    id: 'cmp-1',
    guest: 'Priya Nair (VIP)',
    room: '518',
    amount: 120,
    type: 'Folio Credit',
    reason: 'Corridor maintenance noise during morning executive conference call.',
    status: 'Routed to Financial Op.',
    requestedAt: 'Today, 09:30 AM',
    financialOperator: 'Kavita Sundaram (Finance Desk)',
    withinSopLimit: true,
  },
  {
    id: 'cmp-2',
    guest: 'Lord Alistair Sterling',
    room: '401',
    amount: 85,
    type: 'Dining Voucher',
    reason: 'Executive lounge evening caviar service delay of 35 minutes.',
    status: 'Approved & Applied',
    requestedAt: 'Yesterday, 20:15',
    financialOperator: 'Kavita Sundaram (Finance Desk)',
    withinSopLimit: true,
  },
  {
    id: 'cmp-3',
    guest: 'Tomás Silva',
    room: '210',
    amount: 40,
    type: 'Rate Adjustment',
    reason: 'Early check-in approved with complimentary goodwill credit waiver.',
    status: 'Pending Finance',
    requestedAt: 'Today, 10:45 AM',
    withinSopLimit: true,
  },
];

const INITIAL_REFUNDS: RefundDisputeItem[] = [
  {
    id: 'ref-1',
    guest: 'Elena Rostova',
    room: '402',
    folioRef: 'FOL-402-21',
    category: 'Minibar Fault',
    amount: 85,
    cardMask: '•••• 4242',
    description: 'Automated minibar infrared sensor erroneously billed 2x Evian & Toblerone; guest confirmed seals intact.',
    status: 'Pending Finance',
    reportedAt: 'Today, 08:40 AM',
  },
  {
    id: 'ref-2',
    guest: 'Tomás Silva',
    room: '210',
    folioRef: 'FOL-210-09',
    category: 'Late Checkout Dispute',
    amount: 60,
    cardMask: '•••• 5521',
    description: 'Fee disputed due to 35-minute check-in queue on arrival day.',
    status: 'Approved',
    reportedAt: 'Today, 10:15 AM',
    resolutionNote: 'Duty Manager approved courtesy fee rebate.',
  },
  {
    id: 'ref-3',
    guest: 'Hannah Weiss',
    room: '127',
    folioRef: 'FOL-127-04',
    category: 'Security Deposit Release',
    amount: 250,
    cardMask: '•••• 7710',
    description: 'Pre-authorization hold release for incidentals upon room pre-inspection pass.',
    status: 'Refunded',
    reportedAt: 'Yesterday, 16:00',
    resolutionNote: 'Payment Gateway terminal hold reversed.',
  },
];

export function DisputesPanel() {
  const { state, fdAction } = useDemo();
  const [activeTab, setActiveTab] = useState<'compensation' | 'refunds' | 'sync'>('compensation');

  const [compensations, setCompensations] = useState<CompensationItem[]>(INITIAL_COMPENSATIONS);
  const [refunds, setRefunds] = useState<RefundDisputeItem[]>(INITIAL_REFUNDS);

  // New Compensation Modal
  const [showNewCompModal, setShowNewCompModal] = useState(false);
  const [compGuest, setCompGuest] = useState('Elena Rostova');
  const [compRoom, setCompRoom] = useState('402');
  const [compAmount, setCompAmount] = useState('50');
  const [compType, setCompType] = useState<CompensationItem['type']>('Folio Credit');
  const [compReason, setCompReason] = useState('');

  // Route to Finance feedback
  const [routedId, setRoutedId] = useState<string | null>(null);

  const stays = state.frontDesk?.stays ?? [];
  const syncIssues = state.frontDesk?.sync ?? [];

  const handleCreateCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(compAmount) || 0;
    const newItem: CompensationItem = {
      id: `cmp-${Date.now()}`,
      guest: compGuest,
      room: compRoom,
      amount: numAmount,
      type: compType,
      reason: compReason || 'Goodwill guest service recovery adjustment.',
      status: 'Routed to Financial Op.',
      requestedAt: 'Just now',
      financialOperator: 'Kavita Sundaram (Finance Desk)',
      withinSopLimit: numAmount <= 150,
    };

    setCompensations([newItem, ...compensations]);
    setShowNewCompModal(false);
    setCompReason('');
  };

  const handleRouteToFinance = (id: string) => {
    setRoutedId(id);
    setTimeout(() => {
      setCompensations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'Routed to Financial Op.' as const, financialOperator: 'Kavita Sundaram (Finance Desk)' } : c)),
      );
      setRoutedId(null);
    }, 600);
  };

  const handleUpdateRefundStatus = (id: string, nextStatus: RefundDisputeItem['status']) => {
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
            ...r,
            status: nextStatus,
            resolutionNote:
              nextStatus === 'Refunded'
                ? 'Processed via payment terminal · Settled to guest card'
                : 'Approved by Finance desk',
          }
          : r,
      ),
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-Navigation: Compensation | Refunds | PMS Sync Issues */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('compensation')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'compensation'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
              }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Compensation &amp; Service Recovery ({compensations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('refunds')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'refunds'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
              }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Refunds &amp; Disputes ({refunds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'sync'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
              }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>PMS Sync Issues ({syncIssues.filter((s) => s.bookingState === 'PMS_Sync_Failed').length})</span>
          </button>
        </div>

        {activeTab === 'compensation' && (
          <Button
            size="sm"
            variant="accent"
            iconLeft={Plus}
            onClick={() => setShowNewCompModal(true)}
          >
            + Log Compensation
          </Button>
        )}
      </div>

      {/* Sub-tab 1: Compensation (Log & manage guest service compensation, folio credits, vouchers, rate adjustments, route to Financial Operator) */}
      {activeTab === 'compensation' && (
        <Panel
          title="Guest Service Compensation & Folio Credits"
          hint="Front Desk operators can issue goodwill credits up to $150 (₹2,500) per SOP. Higher amounts route to Duty Manager / Finance."
          icon={Scale}
        >
          <div className="space-y-3">
            {compensations.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.guest}</span>
                    <Badge tone="neutral">Room {item.room}</Badge>
                    <Badge tone="accent">{item.type}</Badge>
                    <span className="font-extrabold text-amber-300 text-sm tabular-nums">
                      {money(item.amount)}
                    </span>
                    <Badge
                      tone={
                        item.status === 'Approved & Applied'
                          ? 'success'
                          : item.status === 'Routed to Financial Op.'
                            ? 'info'
                            : 'warning'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-mist-200">{item.reason}</p>
                  <div className="flex items-center gap-3 text-[11px] text-mist-400">
                    <span>Requested: {item.requestedAt}</span>
                    {item.financialOperator && (
                      <>
                        <span>·</span>
                        <span className="text-sky-300">Handled by: {item.financialOperator}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className={item.withinSopLimit ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                      {item.withinSopLimit ? '✓ Under SOP Goodwill Limit ($150)' : '⚠️ Exceeds SOP Limit · GM Approval Required'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'Pending Finance' && (
                    <Button
                      size="sm"
                      variant="accent"
                      iconLeft={Send}
                      disabled={routedId === item.id}
                      onClick={() => handleRouteToFinance(item.id)}
                    >
                      {routedId === item.id ? 'Routing...' : 'Route to Financial Op.'}
                    </Button>
                  )}
                  {item.status === 'Routed to Financial Op.' && (
                    <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Pending Finance Queue
                    </span>
                  )}
                  {item.status === 'Approved & Applied' && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Credited to Folio
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Sub-tab 2: Refunds (Track overcharges, minibar/POS disputes, deposit releases; Pending Finance -> Approved -> Refunded) */}
      {activeTab === 'refunds' && (
        <Panel
          title="Charge Disputes & Deposit Releases"
          hint="Track contested folio transactions. Manage workflow from Pending Finance → Approved → Refunded."
          icon={Receipt}
        >
          <div className="space-y-3">
            {refunds.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{ref.guest}</span>
                    <Badge tone="neutral">Room {ref.room}</Badge>
                    <Badge tone="info">{ref.category}</Badge>
                    <span className="font-mono text-mist-400 text-[11px]">{ref.folioRef}</span>
                    <span className="font-extrabold text-white text-sm tabular-nums">
                      {money(ref.amount)}
                    </span>
                    <span className="text-mist-400 font-mono text-[11px]">{ref.cardMask}</span>
                    <Badge
                      tone={
                        ref.status === 'Refunded'
                          ? 'success'
                          : ref.status === 'Approved'
                            ? 'info'
                            : 'warning'
                      }
                    >
                      {ref.status}
                    </Badge>
                  </div>
                  <p className="text-mist-200">{ref.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-mist-400">
                    <span>Logged: {ref.reportedAt}</span>
                    {ref.resolutionNote && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-300">{ref.resolutionNote}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Workflow Transitions: Pending Finance -> Approved -> Refunded */}
                <div className="flex items-center gap-2 shrink-0">
                  {ref.status === 'Pending Finance' && (
                    <Button
                      size="sm"
                      variant="accent"
                      iconLeft={Check}
                      onClick={() => handleUpdateRefundStatus(ref.id, 'Approved')}
                    >
                      Approve Dispute
                    </Button>
                  )}
                  {ref.status === 'Approved' && (
                    <Button
                      size="sm"
                      variant="subtle"
                      iconLeft={Send}
                      onClick={() => handleUpdateRefundStatus(ref.id, 'Refunded')}
                    >
                      Process &amp; Issue Refund
                    </Button>
                  )}
                  {ref.status === 'Refunded' && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Settled to Card
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Sub-tab 3: PMS Sync Issues (Reconcile sync failures) */}
      {activeTab === 'sync' && (
        <Panel
          title="PMS Integration Sync Failures"
          hint="Room bookings with captured payments where Opera PMS record synchronization encountered an exception."
          icon={Landmark}
        >
          <div className="space-y-3">
            {syncIssues.map((sync) => (
              <div
                key={sync.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sync.guest}</span>
                    <Badge tone="danger">{sync.bookingState}</Badge>
                    <span className="font-mono text-mist-300 font-semibold">{sync.bookingRef}</span>
                    <span className="font-extrabold text-white text-sm tabular-nums">
                      {money(sync.amount)}
                    </span>
                  </div>
                  <p className="text-mist-200">{sync.detail}</p>
                  <p className="text-[11px] text-mist-400">Payment: {sync.paymentState} ({sync.cardMask})</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="accent"
                    iconLeft={Undo2}
                    onClick={() => {
                      if (fdAction) {
                        fdAction((s) => {
                          const item = s.frontDesk?.sync.find((x) => x.id === sync.id);
                          if (item) item.bookingState = 'Refund_Requested';
                          return { next: s, message: 'Refund requested' };
                        });
                      }
                    }}
                  >
                    Send to Finance Refund
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Log New Compensation Modal */}
      {showNewCompModal && (
        <Modal
          title="Issue Guest Service Compensation"
          description="Log service recovery goodwill adjustment and route directly to Financial Operator."
          onClose={() => setShowNewCompModal(false)}
        >
          <form onSubmit={handleCreateCompensation} className="space-y-3 text-xs">
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Guest Selection</label>
              <select
                value={compGuest}
                onChange={(e) => {
                  setCompGuest(e.target.value);
                  const st = stays.find((s) => s.guest === e.target.value);
                  if (st) setCompRoom(st.room);
                }}
                className="field w-full text-xs"
              >
                {stays.map((st) => (
                  <option key={st.id} value={st.guest}>
                    {st.guest} (Room {st.room}) {st.vip ? '· VIP' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Room Number</label>
                <input
                  type="text"
                  value={compRoom}
                  onChange={(e) => setCompRoom(e.target.value)}
                  className="field w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Compensation Type</label>
                <select
                  value={compType}
                  onChange={(e) => setCompType(e.target.value as CompensationItem['type'])}
                  className="field w-full text-xs"
                >
                  <option value="Folio Credit">Folio Credit</option>
                  <option value="Dining Voucher">Dining Voucher</option>
                  <option value="Rate Adjustment">Rate Adjustment</option>
                  <option value="Spa Pass">Spa Pass</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Amount ($)</label>
              <input
                type="number"
                min="5"
                max="500"
                value={compAmount}
                onChange={(e) => setCompAmount(e.target.value)}
                className="field w-full text-xs"
                required
              />
              <p className="text-[10px] text-mist-400 mt-1">
                Note: Standard SOP Goodwill limit is $150. Amounts above $150 require Duty Manager authorization.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Reason &amp; Service Context</label>
              <textarea
                rows={2}
                placeholder="e.g. Excessive noise disturbance from adjacent elevator refurbishment; complimentary dinner credit."
                value={compReason}
                onChange={(e) => setCompReason(e.target.value)}
                className="field w-full text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" type="button" onClick={() => setShowNewCompModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" type="submit" iconLeft={Send}>
                Submit &amp; Route to Financial Op.
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

