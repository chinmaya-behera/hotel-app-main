'use client';

import { useState } from 'react';
import {
  Scale,
  Receipt,
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
  FileText,
  DollarSign,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Building2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import { money, cn } from '@/lib/utils';
import type { SyncIssue, WorkItem, CompensationRefundRequest } from '@/types/demo';

export interface DisputeRecord {
  id: string;
  complaintId?: string;
  guest: string;
  room: string;
  bookingRef: string;
  invoiceRef: string;
  category: 'Billing error' | 'Service failure' | 'Facility outage' | 'Food & Beverage' | 'Cleanliness';
  complaintText: string;
  originalCharge: number;
  disputedAmount: number;
  status:
    | 'Awaiting Front Desk Decision'
    | 'Compensation Proposed'
    | 'Compensation Approved'
    | 'Refund Proposed'
    | 'Sent to Financial Operator'
    | 'Awaiting Approval'
    | 'Resolved'
    | 'Rejected';
  decisionType?: 'compensation' | 'refund';
  createdAt: string;
  investigationNotes: string;
  timeline: Array<{ at: string; action: string; note: string }>;
  // Compensation fields
  compensationAmount?: number;
  compensationMethod?: 'Folio Credit' | 'Food & Beverage Voucher' | 'Spa Voucher' | 'Future Stay Credit' | 'Rate Adjustment';
  compensationJustification?: string;
  // Refund fields
  refundAmount?: number;
  refundBatchRef?: string;
  refundReason?: string;
  refundNotes?: string;
  cardMask?: string;
}

export interface PmsSyncScenario {
  id: string;
  title: string;
  scenarioType: 'checkin' | 'room_status' | 'payment' | 'checkout';
  affectedRecord: string;
  guestName: string;
  expectedState: string;
  pmsState: string;
  errorDescription: string;
  retryCount: number;
  status: 'Sync Failed' | 'Sync In Progress...' | 'Resolved' | 'Verified';
  lastAttemptAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

const INITIAL_DISPUTES: DisputeRecord[] = [
  {
    id: 'DSP-2026-001',
    complaintId: 'CMP-2026-102',
    guest: 'Marcus Chen',
    room: '305',
    bookingRef: 'BK-305-9921',
    invoiceRef: 'FOL-305-18',
    category: 'Facility outage',
    complaintText: 'AC cooling failure and severe compressor vibration throughout the night. Room temp reached 26.5°C.',
    originalCharge: 12500,
    disputedAmount: 2500,
    status: 'Awaiting Front Desk Decision',
    createdAt: 'Today, 09:12 AM',
    investigationNotes: 'Technician Wayne Chen verified FCU actuator fault. Guest offered complimentary room move or service recovery credit.',
    cardMask: '•••• 3308',
    timeline: [
      { at: '09:10 AM', action: 'Complaint Submitted', note: 'Logged via Guest Portal' },
      { at: '09:12 AM', action: 'Dispute Created', note: 'Case flagged for financial evaluation' },
    ],
  },
  {
    id: 'DSP-2026-002',
    complaintId: 'CMP-2026-105',
    guest: 'Clara Dupont',
    room: '102',
    bookingRef: 'BK-102-4410',
    invoiceRef: 'INV-102-09',
    category: 'Billing error',
    complaintText: 'Minibar sensor charged ₹1,850 for vintage champagne bottle that was never consumed or opened.',
    originalCharge: 1850,
    disputedAmount: 1850,
    status: 'Sent to Financial Operator',
    decisionType: 'refund',
    refundAmount: 1850,
    refundBatchRef: 'BATCH-RF-1029',
    refundReason: 'Minibar sensor malfunction; guest verified seals untouched.',
    cardMask: '•••• 1290',
    createdAt: 'Today, 09:20 AM',
    investigationNotes: 'Housekeeping visual inspection confirmed minibar seal intact. Reversal requested to Financial Operator.',
    timeline: [
      { at: '09:18 AM', action: 'Counter Dispute', note: 'Guest contested folio charge at departure' },
      { at: '09:22 AM', action: 'Refund Batch Generated', note: 'Batch BATCH-RF-1029 dispatched to Finance' },
    ],
  },
  {
    id: 'DSP-2026-003',
    complaintId: 'CMP-2026-103',
    guest: 'Elena Rostova',
    room: '402',
    bookingRef: 'BK-402-7721',
    invoiceRef: 'FOL-402-88',
    category: 'Food & Beverage',
    complaintText: 'Room service breakfast delivered over 45 minutes late, arriving cold with spilt espresso.',
    originalCharge: 1600,
    disputedAmount: 1600,
    status: 'Compensation Approved',
    decisionType: 'compensation',
    compensationAmount: 1600,
    compensationMethod: 'Food & Beverage Voucher',
    compensationJustification: 'In-Room dining morning rush delay courtesy compensation within SOP limit.',
    cardMask: '•••• 4242',
    createdAt: 'Today, 09:25 AM',
    investigationNotes: 'F&B kitchen log confirms ticket delay. 100% courtesy voucher issued.',
    timeline: [
      { at: '09:20 AM', action: 'Complaint Received', note: 'Guest Portal ticket CMP-2026-103' },
      { at: '09:26 AM', action: 'Compensation Approved', note: '₹1,600 F&B voucher issued under SOP limit' },
    ],
  },
  {
    id: 'DSP-2026-004',
    complaintId: 'CMP-2026-101',
    guest: 'Rajesh Verma',
    room: '204',
    bookingRef: 'BK-204-1010',
    invoiceRef: 'INV-204-01',
    category: 'Cleanliness',
    complaintText: 'Bathroom floor damp and soiled bath towels found on rack upon arrival.',
    originalCharge: 8200,
    disputedAmount: 1500,
    status: 'Awaiting Front Desk Decision',
    createdAt: 'Today, 08:50 AM',
    investigationNotes: 'Housekeeping supervisor rectified room within 15 minutes. Reviewing goodwill token.',
    cardMask: '•••• 6621',
    timeline: [
      { at: '08:45 AM', action: 'Complaint Submitted', note: 'Portal submission' },
      { at: '08:50 AM', action: 'Dispute Case Opened', note: 'Awaiting front desk recovery decision' },
    ],
  },
];

const INITIAL_SYNC_SCENARIOS: PmsSyncScenario[] = [
  {
    id: 'pms-sync-01',
    title: 'Check-In Status Mismatch',
    scenarioType: 'checkin',
    affectedRecord: 'BK-7731 · Room 214',
    guestName: 'Ananya Rao',
    expectedState: 'In-House (Guest Checked In online via Portal)',
    pmsState: 'Expected (PMS shows guest has not arrived)',
    errorDescription: 'Opera PMS interface timed out (HTTP 504) during automated guest mobile key creation webhook.',
    retryCount: 2,
    status: 'Sync Failed',
    lastAttemptAt: 'Today, 09:15 AM',
  },
  {
    id: 'pms-sync-02',
    title: 'Room Readiness Status Mismatch',
    scenarioType: 'room_status',
    affectedRecord: 'Room 304 · Deluxe Suite',
    guestName: 'Marcus Chen (Next Arrival)',
    expectedState: 'Ready (Housekeeping Supervisor inspected & approved)',
    pmsState: 'Dirty (Opera PMS room rack reflects uncleaned)',
    errorDescription: 'Housekeeping staff mobile app update dropped connection during service floor WiFi roaming.',
    retryCount: 1,
    status: 'Sync Failed',
    lastAttemptAt: 'Today, 09:30 AM',
  },
  {
    id: 'pms-sync-03',
    title: 'Folio / Payment Ledger Mismatch',
    scenarioType: 'payment',
    affectedRecord: 'Folio 402 · Elena Rostova',
    guestName: 'Elena Rostova',
    expectedState: 'Payment Captured (₹18,500 settled via Gateway)',
    pmsState: 'Unpaid Folio Balance ₹18,500 (No payment credit line)',
    errorDescription: 'Payment gateway transaction token ACK was dropped prior to Opera PMS ledger posting.',
    retryCount: 3,
    status: 'Sync Failed',
    lastAttemptAt: 'Today, 09:40 AM',
  },
  {
    id: 'pms-sync-04',
    title: 'Check-Out Status Mismatch',
    scenarioType: 'checkout',
    affectedRecord: 'Room 102 · Clara Dupont',
    guestName: 'Clara Dupont',
    expectedState: 'Checked Out (Express Checkout completed 09:15)',
    pmsState: 'Occupied (Opera PMS room rack still shows guest in-house)',
    errorDescription: 'Keycard session revoked in Assa Abloy door server, but PMS night audit lock was active.',
    retryCount: 1,
    status: 'Sync Failed',
    lastAttemptAt: 'Today, 09:22 AM',
  },
];

export function DisputesPanel() {
  const { state, fdAction, reviewCompensationRefundRequest } = useDemo();
  const [subTab, setSubTab] = useState<'disputes' | 'guest_claims' | 'compensations' | 'refunds' | 'sync'>('disputes');

  const guestRequests = state.guestCompensationRefundRequests ?? [];
  const pendingGuestCount = guestRequests.filter((r) => !['Resolved', 'Rejected'].includes(r.status)).length;

  // Guest Claim Review Modal State
  const [selectedGuestClaim, setSelectedGuestClaim] = useState<CompensationRefundRequest | null>(null);
  const [claimAction, setClaimAction] = useState<'approve' | 'partially_approve' | 'reject' | 'request_info' | 'process' | 'resolve'>('approve');
  const [approvedAmountInput, setApprovedAmountInput] = useState('');
  const [guestResponseInput, setGuestResponseInput] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [resolutionDetailsInput, setResolutionDetailsInput] = useState('');

  const [disputes, setDisputes] = useState<DisputeRecord[]>(INITIAL_DISPUTES);
  const [syncScenarios, setSyncScenarios] = useState<PmsSyncScenario[]>(INITIAL_SYNC_SCENARIOS);

  // Selected dispute for detail / decision modal
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  // Decision Modal State
  const [decisionPath, setDecisionPath] = useState<'compensation' | 'refund'>('compensation');

  // Compensation Form State
  const [compAmount, setCompAmount] = useState('2500');
  const [compMethod, setCompMethod] = useState<DisputeRecord['compensationMethod']>('Folio Credit');
  const [compJustification, setCompJustification] = useState('');

  // Refund Form State
  const [refundAmount, setRefundAmount] = useState('1850');
  const [refundReason, setRefundReason] = useState('Minibar Sensor Error / Sealed Items Verified');
  const [refundNotes, setRefundNotes] = useState('');

  const selectedDispute = disputes.find((d) => d.id === selectedDisputeId);

  // Computed KPIs (Requirement 5.A)
  const totalOpen = disputes.filter((d) => d.status !== 'Resolved' && d.status !== 'Rejected').length;
  const awaitingDecision = disputes.filter((d) => d.status === 'Awaiting Front Desk Decision').length;
  const compProposed = disputes.filter((d) => d.status === 'Compensation Proposed').length;
  const refundProposed = disputes.filter((d) => d.status === 'Refund Proposed').length;
  const sentToFinance = disputes.filter((d) => d.status === 'Sent to Financial Operator').length;
  const awaitingApproval = disputes.filter((d) => d.status === 'Awaiting Approval').length;
  const resolvedCount = disputes.filter((d) => d.status === 'Resolved' || d.status === 'Compensation Approved').length;
  const rejectedCount = disputes.filter((d) => d.status === 'Rejected').length;

  const handleOpenDecision = (dispute: DisputeRecord) => {
    setSelectedDisputeId(dispute.id);
    setCompAmount(String(dispute.disputedAmount));
    setRefundAmount(String(dispute.disputedAmount));
    setCompJustification(dispute.investigationNotes);
    setRefundNotes(dispute.investigationNotes);
    setDecisionPath(dispute.decisionType || 'compensation');
  };

  // Submit Compensation (Option 1)
  const handleSubmitCompensation = () => {
    if (!selectedDispute) return;
    const amountNum = Number(compAmount) || selectedDispute.disputedAmount;
    const isUnderLimit = amountNum <= 2500; // ₹2,500 SOP limit
    const nextStatus = isUnderLimit ? 'Compensation Approved' : 'Compensation Proposed';

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? {
              ...d,
              status: nextStatus,
              decisionType: 'compensation',
              compensationAmount: amountNum,
              compensationMethod: compMethod,
              compensationJustification: compJustification.trim(),
              timeline: [
                ...d.timeline,
                {
                  at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  action: isUnderLimit ? 'Compensation Applied' : 'Compensation Escalated',
                  note: `${money(amountNum)} via ${compMethod} (${isUnderLimit ? 'Applied under SOP limit' : 'Escalated to Duty Manager'})`,
                },
              ],
            }
          : d
      )
    );

    // Record in global demo feed
    fdAction((s) => ({
      next: {
        ...s,
        feed: [
          {
            id: `feed-cmp-${Date.now()}`,
            at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: 'Front Desk',
            text: `Compensation ${money(amountNum)} (${compMethod}) logged for ${selectedDispute.guest} (Room ${selectedDispute.room})`,
          },
          ...s.feed,
        ],
      },
      message: `Compensation of ${money(amountNum)} logged for ${selectedDispute.guest}.`,
    }));

    setSelectedDisputeId(null);
  };

  // Submit Refund (Option 2)
  const handleSubmitRefund = () => {
    if (!selectedDispute) return;
    const amountNum = Number(refundAmount) || selectedDispute.disputedAmount;
    const batchId = `BATCH-RF-${Math.floor(1000 + Math.random() * 9000)}`;

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? {
              ...d,
              status: 'Sent to Financial Operator',
              decisionType: 'refund',
              refundAmount: amountNum,
              refundBatchRef: batchId,
              refundReason,
              refundNotes: refundNotes.trim(),
              timeline: [
                ...d.timeline,
                {
                  at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  action: 'Refund Dispatched to Finance',
                  note: `Generated batch ${batchId} for ${money(amountNum)} reversal.`,
                },
              ],
            }
          : d
      )
    );

    // Route refund request to Financial Operator queue (Requirement 5.C)
    fdAction((s) => {
      const financeItem: WorkItem = {
        id: `fin-batch-${Date.now()}`,
        title: `Refund batch ${batchId} · Room ${selectedDispute.room}`,
        meta: `Financial Operator · ${selectedDispute.guest} · Card ${selectedDispute.cardMask || '•••• 4242'}`,
        status: 'Pending approval',
        amount: amountNum,
        chip: batchId,
        tone: 'warning',
        room: selectedDispute.room,
        ref: batchId,
        description: `Dispute ${selectedDispute.id}: ${refundReason}. Notes: ${refundNotes}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const existingFinItems = s.items.financial_operator ?? [];

      return {
        next: {
          ...s,
          items: {
            ...s.items,
            financial_operator: [financeItem, ...existingFinItems],
          },
          feed: [
            {
              id: `feed-rf-${Date.now()}`,
              at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              role: 'Front Desk',
              text: `Refund batch ${batchId} for ${money(amountNum)} dispatched to Financial Operator queue`,
            },
            ...s.feed,
          ],
        },
        message: `Refund batch ${batchId} created and routed to Financial Operator.`,
      };
    });

    setSelectedDisputeId(null);
  };

  // PMS Sync Actions (Requirement 6.C)
  const handleRetrySync = (id: string) => {
    setSyncScenarios((prev) =>
      prev.map((sc) => (sc.id === id ? { ...sc, status: 'Sync In Progress...' as const } : sc))
    );

    setTimeout(() => {
      setSyncScenarios((prev) =>
        prev.map((sc) =>
          sc.id === id
            ? {
                ...sc,
                status: 'Resolved' as const,
                pmsState: sc.expectedState,
                retryCount: sc.retryCount + 1,
                lastAttemptAt: 'Just now',
              }
            : sc
        )
      );

      fdAction((s) => ({
        next: {
          ...s,
          feed: [
            {
              id: `feed-sync-${Date.now()}`,
              at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              role: 'Front Desk',
              text: `PMS sync retried and resolved for ${id}`,
            },
            ...s.feed,
          ],
        },
        message: 'PMS Sync retried. Target state synchronized.',
      }));
    }, 800);
  };

  const handleVerifySync = (id: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSyncScenarios((prev) =>
      prev.map((sc) =>
        sc.id === id
          ? {
              ...sc,
              status: 'Verified' as const,
              verifiedBy: 'Front Desk Coordinator',
              verifiedAt: now,
            }
          : sc
      )
    );

    fdAction((s) => ({
      next: {
        ...s,
        feed: [
          {
            id: `feed-v-sync-${Date.now()}`,
            at: now,
            role: 'Front Desk',
            text: `PMS Sync issue ${id} verified and audited by Front Desk Coordinator`,
          },
          ...s.feed,
        ],
      },
      message: `Reconciliation verified for ${id}. Recorded in audit trail.`,
    }));
  };

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* 5.A TOP KPI DASHBOARD SUMMARY (Requirement 5.A)                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">Total Open</span>
          <p className="text-xl font-black text-white mt-0.5 tabular-nums">{totalOpen}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Awaiting Decision</span>
          <p className="text-xl font-black text-amber-300 mt-0.5 tabular-nums">{awaitingDecision}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Comp. Proposed</span>
          <p className="text-xl font-black text-cyan-300 mt-0.5 tabular-nums">{compProposed}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Refund Proposed</span>
          <p className="text-xl font-black text-violet-300 mt-0.5 tabular-nums">{refundProposed}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">To Finance</span>
          <p className="text-xl font-black text-sky-300 mt-0.5 tabular-nums">{sentToFinance}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">Awaiting Appr.</span>
          <p className="text-xl font-black text-mist-200 mt-0.5 tabular-nums">{awaitingApproval}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Resolved</span>
          <p className="text-xl font-black text-emerald-400 mt-0.5 tabular-nums">{resolvedCount}</p>
        </div>
        <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.05]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Rejected</span>
          <p className="text-xl font-black text-rose-400 mt-0.5 tabular-nums">{rejectedCount}</p>
        </div>
      </div>

      {/* Sub-Navigation: Disputes Board | Guest Claims & Refunds | Compensation Ledger | Refund Batches | PMS Sync */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('disputes')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              subTab === 'disputes' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white'
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Disputes &amp; Claims ({disputes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('guest_claims')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              subTab === 'guest_claims' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white'
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Guest Claims &amp; Refunds ({guestRequests.length})</span>
            {pendingGuestCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {pendingGuestCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('compensations')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              subTab === 'compensations' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white'
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Compensation Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('refunds')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              subTab === 'refunds' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white'
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Refund Batches (To Finance)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('sync')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
              subTab === 'sync' ? 'bg-amber-400 text-ink-950 shadow-sm' : 'text-mist-300 hover:text-white'
            )}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>PMS Sync Issues ({syncScenarios.filter((s) => s.status === 'Sync Failed').length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. DISPUTES & CLAIMS BOARD                                     */}
      {/* ============================================================== */}
      {subTab === 'disputes' && (
        <Panel
          title="Dispute Financial: Resolution Management"
          hint="Review contested folios and customer complaints. Choose between Goodwill Compensation or Transaction Refund."
          icon={Scale}
        >
          <div className="space-y-3">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{d.guest}</span>
                    <Badge tone="neutral">Room {d.room}</Badge>
                    <Badge tone="info">{d.category}</Badge>
                    <span className="font-mono text-cyan-300 text-[11px] font-semibold">{d.id}</span>
                    <span className="font-extrabold text-amber-300 text-sm tabular-nums">
                      Disputed: {money(d.disputedAmount)}
                    </span>
                    <span className="text-mist-400 text-[11px]">Orig: {money(d.originalCharge)}</span>
                    <Badge
                      tone={
                        d.status === 'Resolved' || d.status === 'Compensation Approved'
                          ? 'success'
                          : d.status === 'Sent to Financial Operator'
                          ? 'info'
                          : d.status === 'Rejected'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-mist-200">{d.complaintText}</p>
                  <div className="flex items-center gap-3 text-[11px] text-mist-400">
                    <span>Booking: {d.bookingRef}</span>
                    <span>·</span>
                    <span>Invoice: {d.invoiceRef}</span>
                    <span>·</span>
                    <span>Logged: {d.createdAt}</span>
                    {d.refundBatchRef && (
                      <>
                        <span>·</span>
                        <span className="text-violet-300 font-bold">Batch: {d.refundBatchRef}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={d.status === 'Awaiting Front Desk Decision' ? 'accent' : 'subtle'}
                    iconLeft={ArrowUpRight}
                    onClick={() => handleOpenDecision(d)}
                  >
                    {d.status === 'Awaiting Front Desk Decision' ? 'Decide Resolution' : 'Review Case'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ============================================================== */}
      {/* GUEST PORTAL CLAIMS & REFUNDS                                  */}
      {/* ============================================================== */}
      {subTab === 'guest_claims' && (
        <Panel
          title="Guest Portal Compensation & Refund Requests"
          hint="Review guest-submitted financial claims, billing disputes, and compensation requests. All financial approvals must follow authorized limits."
          icon={Scale}
        >
          {guestRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-mist-400">
              No guest compensation or refund requests logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-mist-400 font-semibold">
                    <th className="py-2.5 px-3">Ref / Date</th>
                    <th className="py-2.5 px-3">Guest / Room</th>
                    <th className="py-2.5 px-3">Category &amp; Reason</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Resolution Details</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {guestRequests.map((req) => {
                    const isPending = !['Resolved', 'Rejected'].includes(req.status);
                    return (
                      <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-amber-300 block">{req.ref}</span>
                          <span className="text-[10px] text-mist-400">{req.createdAt}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{req.guestName}</span>
                          <span className="text-[10px] text-mist-400">Room {req.room}</span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <Badge tone="neutral" className="mb-1">{req.category}</Badge>
                          <p className="text-mist-200 truncate font-medium">{req.reason}</p>
                          <p className="text-[10px] text-mist-400 line-clamp-1">{req.explanation}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-white block">
                            {req.amountRequested ? money(req.amountRequested) : 'TBD'}
                          </span>
                          {req.approvedAmount !== undefined && (
                            <span className="font-mono text-emerald-400 text-[10px] block font-bold">
                              Appr: {money(req.approvedAmount)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            tone={
                              req.status === 'Resolved'
                                ? 'success'
                                : req.status === 'Approved' || req.status === 'Partially Approved'
                                ? 'info'
                                : req.status === 'Rejected'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {req.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          {req.staffResponse ? (
                            <p className="text-[11px] text-mist-300 truncate" title={req.staffResponse}>
                              {req.staffResponse}
                            </p>
                          ) : (
                            <span className="text-mist-500 text-[10px] italic">Awaiting staff response</span>
                          )}
                          {req.internalStaffNote && (
                            <span className="text-[10px] text-amber-300/80 block truncate">
                              Internal: {req.internalStaffNote}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant={isPending ? 'accent' : 'subtle'}
                            onClick={() => {
                              setSelectedGuestClaim(req);
                              setClaimAction(req.status === 'Approved' ? 'resolve' : 'approve');
                              setApprovedAmountInput(req.approvedAmount?.toString() || req.amountRequested?.toString() || '');
                              setGuestResponseInput(req.staffResponse || '');
                              setInternalNoteInput(req.internalStaffNote || '');
                              setResolutionDetailsInput(req.resolutionDetails || '');
                            }}
                          >
                            {isPending ? 'Review Case' : 'View / Edit'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* ============================================================== */}
      {/* 2. COMPENSATION LEDGER                                         */}
      {/* ============================================================== */}
      {subTab === 'compensations' && (
        <Panel
          title="Service Recovery & Goodwill Compensation Ledger"
          hint="Compensations granted without reversing card transactions. Front Desk SOP limit: ₹2,500 ($150)."
          icon={FileSpreadsheet}
        >
          <div className="space-y-3">
            {disputes
              .filter((d) => d.decisionType === 'compensation' || d.compensationAmount)
              .map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{d.guest}</span>
                      <Badge tone="neutral">Room {d.room}</Badge>
                      <Badge tone="accent">{d.compensationMethod || 'Folio Credit'}</Badge>
                      <span className="font-extrabold text-amber-300 text-sm tabular-nums">
                        {money(d.compensationAmount || d.disputedAmount)}
                      </span>
                      <Badge tone="success">{d.status}</Badge>
                    </div>
                    <p className="text-mist-200">{d.compensationJustification || d.investigationNotes}</p>
                    <p className="text-[11px] text-mist-400">Dispute Ref: {d.id} · Applied via Front Desk Console</p>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      )}

      {/* ============================================================== */}
      {/* 3. REFUND BATCHES (TO FINANCIAL OPERATOR)                      */}
      {/* ============================================================== */}
      {subTab === 'refunds' && (
        <Panel
          title="Dispatched Refund Batches (Sent to Financial Operator)"
          hint="Payment reversals dispatched to the Financial Operator refund queue with unique batch references."
          icon={Receipt}
        >
          <div className="space-y-3">
            {disputes
              .filter((d) => d.decisionType === 'refund' || d.refundBatchRef)
              .map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{d.guest}</span>
                      <Badge tone="neutral">Room {d.room}</Badge>
                      <span className="font-mono text-violet-300 font-bold">{d.refundBatchRef}</span>
                      <span className="font-extrabold text-white text-sm tabular-nums">
                        {money(d.refundAmount || d.disputedAmount)}
                      </span>
                      <Badge tone="info">{d.status}</Badge>
                    </div>
                    <p className="text-mist-200">{d.refundReason || d.complaintText}</p>
                    <p className="text-[11px] text-mist-400">Card: {d.cardMask || '•••• 4242'} · Queue: Financial Operator Reconciliation</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[11px] text-sky-400 font-medium">● Tracked in Finance Queue</span>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      )}

      {/* ============================================================== */}
      {/* 4. PMS SYNC ISSUES — RECONCILIATION & VERIFICATION (Req 6)     */}
      {/* ============================================================== */}
      {subTab === 'sync' && (
        <div className="space-y-4">
          {/* Educational Header (Requirement 6.A) */}
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-ink-900 to-indigo-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Building2 className="h-5 w-5" />
              <span>Property Management System (Opera PMS) Synchronization Architecture</span>
            </div>
            <p className="text-xs text-mist-200 leading-relaxed">
              In enterprise hospitality, the core Property Management System (such as Oracle Opera PMS) maintains the master ledger, room inventory, and check-in audit records. Discrepancies occasionally arise between guest-facing digital portals, mobile housekeeping terminals, and the on-premise PMS due to network packet loss, webhook timeouts, or midnight audit lockouts.
            </p>
            <p className="text-[11px] text-cyan-400 italic font-medium">
              * Note: External PMS integration is simulated in this prototype. Front Desk staff must retry failed synchronization and explicitly verify reconciliation before closing issues.
            </p>
          </div>

          <Panel
            title="Active PMS Sync Mismatches & Reconciliation"
            hint="Side-by-side reconciliation between Expected State and Opera PMS State."
            icon={Landmark}
          >
            <div className="space-y-4">
              {syncScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{sc.title}</span>
                      <Badge tone="neutral">{sc.affectedRecord}</Badge>
                      <span className="text-mist-400">Guest: {sc.guestName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          sc.status === 'Verified'
                            ? 'success'
                            : sc.status === 'Resolved'
                            ? 'info'
                            : sc.status === 'Sync In Progress...'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {sc.status}
                      </Badge>
                      <span className="text-[11px] text-mist-400">Retries: {sc.retryCount}</span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Expected Internal State
                        </span>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">{sc.expectedState}</p>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          Opera PMS Current State
                        </span>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <p className="text-xs font-semibold text-amber-200">{sc.pmsState}</p>
                    </div>
                  </div>

                  {/* Error & Audit Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-mist-400 space-y-0.5">
                      <p><strong className="text-mist-300">Fault Root:</strong> {sc.errorDescription}</p>
                      {sc.verifiedBy && (
                        <p className="text-emerald-400 font-medium">
                          ✓ Verified by {sc.verifiedBy} at {sc.verifiedAt}
                        </p>
                      )}
                    </div>

                    {/* Actions: Retry Sync vs Verify Sync (Requirement 6.C) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {sc.status === 'Sync Failed' && (
                        <Button
                          size="sm"
                          variant="accent"
                          iconLeft={RefreshCw}
                          onClick={() => handleRetrySync(sc.id)}
                        >
                          Retry Sync
                        </Button>
                      )}
                      {sc.status === 'Sync In Progress...' && (
                        <Button size="sm" variant="subtle" disabled iconLeft={RefreshCw}>
                          Sync in progress...
                        </Button>
                      )}
                      {sc.status === 'Resolved' && (
                        <Button
                          size="sm"
                          variant="accent"
                          iconLeft={CheckCircle2}
                          onClick={() => handleVerifySync(sc.id)}
                        >
                          Verify Sync (Reconciliation)
                        </Button>
                      )}
                      {sc.status === 'Verified' && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Reconciliation Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ============================================================== */}
      {/* DECISION MODAL: MUTUALLY EXCLUSIVE TWO-PATH WORKFLOW (Req 5.C) */}
      {/* ============================================================== */}
      {selectedDispute && (
        <Modal
          title={`Dispute Resolution — ${selectedDispute.id}`}
          description="Front Desk must explicitly choose ONE of two resolution paths: Goodwill Compensation or Transaction Refund."
          onClose={() => setSelectedDisputeId(null)}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              <Button variant="subtle" onClick={() => setSelectedDisputeId(null)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {decisionPath === 'compensation' ? (
                  <Button
                    variant="accent"
                    iconLeft={Scale}
                    onClick={handleSubmitCompensation}
                  >
                    Confirm &amp; Apply Compensation
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    iconLeft={Send}
                    onClick={handleSubmitRefund}
                  >
                    Submit Refund to Financial Operator
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-mist-200">
            {/* Dispute Case Summary (Requirement 5.B) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div>
                <span className="text-mist-400">Guest Name</span>
                <p className="font-bold text-white mt-0.5">{selectedDispute.guest}</p>
                <p className="text-[11px] text-mist-400">Room {selectedDispute.room}</p>
              </div>
              <div>
                <span className="text-mist-400">Related Complaint</span>
                <p className="font-bold text-cyan-300 mt-0.5">{selectedDispute.complaintId || 'Direct Claim'}</p>
              </div>
              <div>
                <span className="text-mist-400">Dispute Category</span>
                <p className="font-bold text-white mt-0.5">{selectedDispute.category}</p>
              </div>
              <div>
                <span className="text-mist-400">Original Folio Charge</span>
                <p className="font-bold text-mist-200 mt-0.5">{money(selectedDispute.originalCharge)}</p>
              </div>
              <div>
                <span className="text-mist-400">Contested Disputed Amount</span>
                <p className="font-bold text-amber-300 mt-0.5">{money(selectedDispute.disputedAmount)}</p>
              </div>
              <div>
                <span className="text-mist-400">Booking / Invoice</span>
                <p className="font-bold text-mist-200 mt-0.5">{selectedDispute.bookingRef} · {selectedDispute.invoiceRef}</p>
              </div>
            </div>

            {/* Complaint Text */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">
                Original Complaint &amp; Evidence
              </span>
              <p className="text-xs text-white mt-1 leading-relaxed">{selectedDispute.complaintText}</p>
            </div>

            {/* MUTUALLY EXCLUSIVE TWO-PATH RESOLUTION SELECTOR (Requirement 5.C) */}
            <div>
              <span className="text-xs font-bold text-white block mb-1.5">
                Select Resolution Path (Mutually Exclusive)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionPath('compensation')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition',
                    decisionPath === 'compensation'
                      ? 'border-cyan-400/60 bg-cyan-500/20 ring-1 ring-cyan-400/50 text-white'
                      : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Option 1: Compensation</span>
                    <span className={cn('h-2.5 w-2.5 rounded-full', decisionPath === 'compensation' ? 'bg-cyan-400' : 'bg-transparent')} />
                  </div>
                  <p className="text-[11px] text-mist-400 leading-tight">
                    Goodwill credits, meal/spa vouchers, or rate adjustments without reversing transactions.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionPath('refund')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition',
                    decisionPath === 'refund'
                      ? 'border-violet-400/60 bg-violet-500/20 ring-1 ring-violet-400/50 text-white'
                      : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Option 2: Refund</span>
                    <span className={cn('h-2.5 w-2.5 rounded-full', decisionPath === 'refund' ? 'bg-violet-400' : 'bg-transparent')} />
                  </div>
                  <p className="text-[11px] text-mist-400 leading-tight">
                    Request payment reversal batch dispatched to Financial Operator queue.
                  </p>
                </button>
              </div>
            </div>

            {/* PATH 1 FORM: COMPENSATION */}
            {decisionPath === 'compensation' && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/[0.04] p-3.5 space-y-3 animate-fade-in">
                <span className="font-bold text-cyan-300 text-xs block">
                  Goodwill Compensation Details
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                      Compensation Amount (INR ₹)
                    </label>
                    <input
                      type="number"
                      value={compAmount}
                      onChange={(e) => setCompAmount(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                      Recovery Method
                    </label>
                    <select
                      value={compMethod}
                      onChange={(e) => setCompMethod(e.target.value as typeof compMethod)}
                      className="field w-full text-xs"
                    >
                      <option value="Folio Credit">Folio Credit</option>
                      <option value="Food & Beverage Voucher">Food &amp; Beverage Voucher</option>
                      <option value="Spa Voucher">Spa Voucher</option>
                      <option value="Future Stay Credit">Future Stay Credit</option>
                      <option value="Rate Adjustment">Rate Adjustment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                    Justification &amp; Service Context
                  </label>
                  <textarea
                    rows={2}
                    value={compJustification}
                    onChange={(e) => setCompJustification(e.target.value)}
                    placeholder="Enter reason for goodwill compensation..."
                    className="field w-full text-xs resize-none"
                  />
                </div>

                {/* SOP Limit Validation Check */}
                <div className="p-2.5 rounded-lg border border-white/10 bg-black/30 flex items-center justify-between text-xs">
                  <span>Front Desk SOP Goodwill Threshold: <strong>₹2,500</strong></span>
                  <span className={cn('font-bold', Number(compAmount) <= 2500 ? 'text-emerald-400' : 'text-amber-400')}>
                    {Number(compAmount) <= 2500
                      ? '✓ Within Front Desk Limit (Instant Apply)'
                      : '⚠️ Exceeds Limit (Escalates to Duty Manager)'}
                  </span>
                </div>
              </div>
            )}

            {/* PATH 2 FORM: REFUND */}
            {decisionPath === 'refund' && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-3.5 space-y-3 animate-fade-in">
                <span className="font-bold text-violet-300 text-xs block">
                  Payment Reversal &amp; Refund Request
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                      Refund Amount (INR ₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                      Original Transaction Reference
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${selectedDispute.invoiceRef} (${selectedDispute.cardMask || '•••• 4242'})`}
                      className="field w-full text-xs bg-black/40 text-mist-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                    Refund Reason
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="field w-full text-xs"
                  >
                    <option value="Minibar Sensor Error / Sealed Items Verified">Minibar Sensor Error / Sealed Items Verified</option>
                    <option value="POS Double Charge / Duplicate Gateway Debit">POS Double Charge / Duplicate Gateway Debit</option>
                    <option value="Late Checkout Fee Reversal">Late Checkout Fee Reversal</option>
                    <option value="Security Deposit Pre-Auth Hold Release">Security Deposit Pre-Auth Hold Release</option>
                    <option value="Service Failure Partial Refund">Service Failure Partial Refund</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-mist-300 block mb-1">
                    Supporting Notes for Financial Operator
                  </label>
                  <textarea
                    rows={2}
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder="Provide justification and audit proof for Finance team..."
                    className="field w-full text-xs resize-none"
                  />
                </div>

                <div className="p-2.5 rounded-lg border border-violet-500/20 bg-black/30 text-[11px] text-violet-200">
                  ⚡ <strong>Batch Generation:</strong> Submitting will generate unique batch reference (<code>BATCH-RF-xxxx</code>) and dispatch to Financial Operator queue. Duplicate submissions are strictly blocked.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* GUEST COMPENSATION / REFUND REVIEW MODAL */}
      {selectedGuestClaim && (
        <Modal
          title={`Review Case: ${selectedGuestClaim.ref} · Room ${selectedGuestClaim.room}`}
          onClose={() => setSelectedGuestClaim(null)}
        >
          <div className="space-y-4 text-xs">
            {/* Case Summary */}
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm">{selectedGuestClaim.guestName}</span>
                  <span className="text-mist-400 text-[11px] block">
                    Room {selectedGuestClaim.room} · Stay {selectedGuestClaim.bookingRef || 'In-House'} · Category: <strong className="text-amber-300">{selectedGuestClaim.category}</strong>
                  </span>
                </div>
                <Badge tone="warning">{selectedGuestClaim.status}</Badge>
              </div>

              <div className="pt-1 text-mist-200">
                <strong className="text-mist-400 block text-[10px] uppercase">Reason &amp; Statement:</strong>
                <p className="font-semibold text-white mt-0.5">{selectedGuestClaim.reason}</p>
                <p className="text-mist-300 text-[11px] mt-1 leading-relaxed bg-black/20 p-2 rounded-lg">
                  {selectedGuestClaim.explanation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                <div>
                  <span className="text-mist-400 block text-[10px]">Requested Amount:</span>
                  <span className="text-white font-mono font-bold">
                    {selectedGuestClaim.amountRequested ? money(selectedGuestClaim.amountRequested) : 'Open review'}
                  </span>
                </div>
                <div>
                  <span className="text-mist-400 block text-[10px]">Preferred Resolution:</span>
                  <span className="text-amber-300 font-medium">
                    {selectedGuestClaim.preferredResolution || 'Standard Adjustment'}
                  </span>
                </div>
              </div>

              {selectedGuestClaim.additionalInfoProvided && (
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-200 text-[11px]">
                  <strong>Guest Provided Additional Info:</strong> {selectedGuestClaim.additionalInfoProvided}
                </div>
              )}
            </div>

            {/* Decision Action Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Staff Action / Decision *</label>
                <select
                  value={claimAction}
                  onChange={(e) => setClaimAction(e.target.value as any)}
                  className="field w-full text-xs"
                >
                  <option value="approve">Approve Request</option>
                  <option value="partially_approve">Partially Approve</option>
                  <option value="request_info">Request Additional Information</option>
                  <option value="reject">Reject Request</option>
                  <option value="process">Mark Processing (Accounting Settlement)</option>
                  <option value="resolve">Record Resolution &amp; Mark Resolved</option>
                </select>
              </div>

              {(claimAction === 'approve' || claimAction === 'partially_approve' || claimAction === 'resolve') && (
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">
                    Approved Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={approvedAmountInput}
                    onChange={(e) => setApprovedAmountInput(e.target.value)}
                    placeholder="e.g. 1200"
                    className="field w-full text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">
                  Guest-Visible Response (Shown to guest in portal) *
                </label>
                <textarea
                  rows={2}
                  value={guestResponseInput}
                  onChange={(e) => setGuestResponseInput(e.target.value)}
                  placeholder="e.g. Front Desk Duty Manager Marcus Vance reviewed your dispute and approved a ₹450 folio credit adjustment..."
                  className="field w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">
                  Internal Staff Note (Audit &amp; Finance Record - Private)
                </label>
                <input
                  type="text"
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  placeholder="e.g. Sensor fault verified with housekeeping; covered under Goodwill SOP..."
                  className="field w-full text-xs"
                />
              </div>

              {claimAction === 'resolve' && (
                <div>
                  <label className="text-xs font-semibold text-mist-300 mb-1 block">
                    Resolution &amp; Payment Details
                  </label>
                  <input
                    type="text"
                    value={resolutionDetailsInput}
                    onChange={(e) => setResolutionDetailsInput(e.target.value)}
                    placeholder="e.g. Reversal settled via HDFC Payment Gateway Terminal #TXN-9021..."
                    className="field w-full text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button variant="subtle" type="button" onClick={() => setSelectedGuestClaim(null)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  type="button"
                  disabled={!guestResponseInput.trim()}
                  onClick={() => {
                    const parsedAmount = approvedAmountInput.trim() ? parseFloat(approvedAmountInput) : undefined;
                    reviewCompensationRefundRequest(selectedGuestClaim.id, claimAction, {
                      approvedAmount: parsedAmount && !isNaN(parsedAmount) ? parsedAmount : undefined,
                      guestResponse: guestResponseInput.trim(),
                      internalNote: internalNoteInput.trim() || undefined,
                      resolutionDetails: resolutionDetailsInput.trim() || undefined,
                    });
                    setSelectedGuestClaim(null);
                  }}
                >
                  Save Decision &amp; Update Guest
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
