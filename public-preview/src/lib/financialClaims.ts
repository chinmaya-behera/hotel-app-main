/**
 * Guest financial claims workflow (FRONTEND ONLY, pure reducers over the shared demo state).
 *
 *   Guest Portal form  ->  Front Desk "Dispute Financial"  ->  decision
 *      reject / ask for info                 : closed or waiting for the guest
 *      compensation within the limit         : credit applied, guest told
 *      refund within the limit               : Financial Officer refund queue
 *      anything above the Front Desk limit   : General Manager approval, then Finance
 *
 * One list is the single source of truth: state.guestCompensationRefundRequests.
 * The GM and Finance outcomes are read back from the linked records (see claimView), so every
 * role sees the same status without extra wiring.
 */
import type {
  AuditEvent,
  CompensationRefundRequest,
  CompensationRefundStatus,
  CompensationRequest,
  DemoState,
  FinanceRefundRequest,
  FolioLine,
  GuestNotification,
  InAppNotification,
  RoleId,
  Tone,
} from '@/types/demo';
import type { FdResult } from '@/lib/frontDesk';

/** Maximum amount Front Desk may decide alone. Anything above goes to the General Manager. */
export const FD_CLAIM_LIMIT = 2500;

export const COMPENSATION_METHODS = [
  'Folio Credit',
  'Food & Beverage Voucher',
  'Spa Voucher',
  'Future Stay Credit',
  'Rate Adjustment',
] as const;
export type CompensationMethod = (typeof COMPENSATION_METHODS)[number];

/** Methods that change the guest's folio right away; vouchers and future credit are issued separately. */
const POSTS_TO_FOLIO: readonly string[] = ['Folio Credit', 'Rate Adjustment'];

export type ClaimStage = 'front_desk' | 'general_manager' | 'finance' | 'closed';
export type ClaimFilter = 'new' | 'general_manager' | 'finance' | 'closed';

export const CLAIM_FILTERS: Array<{ id: ClaimFilter; label: string }> = [
  { id: 'new', label: 'New' },
  { id: 'general_manager', label: 'With General Manager' },
  { id: 'finance', label: 'With Finance' },
  { id: 'closed', label: 'Closed' },
];

export interface ClaimView extends CompensationRefundRequest {
  stage: ClaimStage;
  stageLabel: string;
  tone: Tone;
}

export type ClaimDecision = 'compensation' | 'refund' | 'reject' | 'request_info';

export interface DecideClaimInput {
  claimId: string;
  decision: ClaimDecision;
  amount?: number;
  method?: CompensationMethod;
  /** shown to the guest in the portal (reason when rejecting, question when asking for info) */
  guestMessage: string;
  internalNote?: string;
}

const FD_ACTOR = 'Front Desk · Sunita Patel';
const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;
const round = (n: number) => Math.round(n * 100) / 100;
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/* --------------------------------------------------------------------- */
/* Read side: one status for every role                                  */
/* --------------------------------------------------------------------- */

/** Resolves the live stage of a claim from the General Manager / Finance records it is linked to. */
export function claimView(s: DemoState, c: CompensationRefundRequest): ClaimView {
  if (c.linkedCompId) {
    const comp = (s.compensationRequests ?? []).find((x) => x.id === c.linkedCompId);
    if (comp) {
      if (comp.status === 'pending_gm' || comp.status === 'pending_dept_manager') {
        return { ...c, status: 'Processing', stage: 'general_manager', stageLabel: 'With General Manager', tone: 'warning' };
      }
      if (comp.status === 'pending_financial_operator') {
        return { ...c, status: 'Processing', stage: 'finance', stageLabel: 'With Financial Officer', tone: 'info' };
      }
      if (comp.status === 'approved') {
        return {
          ...c,
          status: 'Resolved',
          approvedAmount: comp.amount,
          resolutionDetails: c.resolutionDetails ?? 'Approved by the General Manager and settled by Finance.',
          stage: 'closed',
          stageLabel: 'Approved',
          tone: 'success',
        };
      }
      if (comp.status === 'rejected') {
        const byGm = comp.gmDecision?.action === 'rejected';
        const why = (byGm ? comp.gmDecision?.comments : comp.financeDecision?.comments) ?? 'Not approved.';
        return {
          ...c,
          status: 'Rejected',
          rejectionReason: why,
          staffResponse: `${byGm ? 'General Manager' : 'Finance'}: ${why}`,
          stage: 'closed',
          stageLabel: byGm ? 'Declined by General Manager' : 'Declined by Finance',
          tone: 'danger',
        };
      }
    }
  }
  const refund = c.linkedRefundId
    ? (s.refundRequests ?? []).find((x) => x.id === c.linkedRefundId)
    : (s.refundRequests ?? []).find((x) => x.sourceCaseRef === c.ref);
  if (refund) {
    if (refund.status === 'Pending Review' || refund.status === 'Approved') {
      return {
        ...c,
        status: 'Processing',
        stage: 'finance',
        stageLabel: refund.status === 'Approved' ? 'Approved, payout pending' : 'With Financial Officer',
        tone: 'info',
      };
    }
    if (refund.status === 'Executed') {
      return {
        ...c,
        status: 'Resolved',
        approvedAmount: refund.amount,
        resolutionDetails: `Refund of ${inr(refund.amount)} paid by Finance${refund.transactionRef ? ` · ref ${refund.transactionRef}` : ''}.`,
        stage: 'closed',
        stageLabel: 'Refund paid',
        tone: 'success',
      };
    }
    if (refund.status === 'Rejected') {
      const why = refund.rejectionReason ?? 'Not approved by Finance.';
      return {
        ...c,
        status: 'Rejected',
        rejectionReason: why,
        staffResponse: `Finance: ${why}`,
        stage: 'closed',
        stageLabel: 'Declined by Finance',
        tone: 'danger',
      };
    }
  }
  switch (c.status) {
    case 'Resolved':
    case 'Approved':
    case 'Partially Approved':
      return { ...c, stage: 'closed', stageLabel: 'Resolved', tone: 'success' };
    case 'Rejected':
      return { ...c, stage: 'closed', stageLabel: 'Rejected', tone: 'danger' };
    case 'Processing':
      return { ...c, stage: 'finance', stageLabel: 'With Financial Officer', tone: 'info' };
    case 'Additional Information Required':
      return { ...c, stage: 'front_desk', stageLabel: 'Waiting for guest', tone: 'warning' };
    default:
      return { ...c, stage: 'front_desk', stageLabel: 'New', tone: 'accent' };
  }
}

export function allClaimViews(s: DemoState): ClaimView[] {
  return (s.guestCompensationRefundRequests ?? []).map((c) => claimView(s, c));
}

export function claimFilterOf(stage: ClaimStage): ClaimFilter {
  return stage === 'front_desk' ? 'new' : stage;
}

/** Claims where the next move belongs to Front Desk (drives badges and dashboard counts). */
export function claimsNeedingFrontDesk(s: DemoState): ClaimView[] {
  return allClaimViews(s).filter((c) => c.stage === 'front_desk' && c.status !== 'Additional Information Required');
}

/* --------------------------------------------------------------------- */
/* Write side: Front Desk decision                                       */
/* --------------------------------------------------------------------- */

function feedWith(s: DemoState, text: string): DemoState['feed'] {
  return [{ id: uid('fd'), at: nowLabel(), role: 'Front Desk', text }, ...s.feed].slice(0, 30);
}

function auditWith(s: DemoState, action: string, resource: string, details: string): AuditEvent[] {
  const event: AuditEvent = {
    id: uid('aud'),
    timestamp: new Date().toLocaleString('en-IN'),
    actor: 'Sunita Patel',
    actorRole: 'Front Desk Coordinator',
    action,
    category: 'Finance',
    resource,
    outcome: 'success',
    details,
  };
  return [event, ...(s.auditTrail ?? [])];
}

function roleNotice(s: DemoState, role: RoleId, title: string, message: string): InAppNotification[] {
  const note: InAppNotification = {
    id: uid('note'),
    title,
    message,
    timestamp: nowLabel(),
    roleId: role,
    targetRole: role,
    read: false,
    type: 'alert',
    priority: 'normal',
    category: 'Finance',
  };
  return [note, ...(s.notifications ?? [])];
}

function guestNotice(s: DemoState, room: string, title: string, message: string): GuestNotification[] {
  const note: GuestNotification = {
    id: uid('gn'),
    room,
    category: 'Payment/Billing Updates',
    title,
    message,
    date: 'Today',
    time: nowLabel(),
    read: false,
    targetTab: 'services',
    targetSubtab: 'compensation',
  };
  return [note, ...(s.guestNotifications ?? [])];
}

function addFolioCredit(s: DemoState, room: string, label: string, amount: number): DemoState['folios'] {
  const line: FolioLine = { id: uid('fo'), label, amount: -round(amount), date: nowLabel() };
  return { ...s.folios, [room]: [...(s.folios[room] ?? []), line] };
}

/** Applies Front Desk's decision to a claim: close it, ask the guest, or route it to Finance / the General Manager. */
export function decideClaim(s: DemoState, input: DecideClaimInput): FdResult {
  const list = s.guestCompensationRefundRequests ?? [];
  const raw = list.find((c) => c.id === input.claimId);
  if (!raw) return { error: 'That claim no longer exists.' };
  const claim = claimView(s, raw);
  if (claim.stage !== 'front_desk') {
    return { error: `This claim is already "${claim.stageLabel}". It cannot be decided twice.` };
  }

  const message = input.guestMessage.trim();
  const internal = input.internalNote?.trim() || undefined;
  const at = nowLabel();

  if (input.decision === 'request_info' && message.length < 5) return { error: 'Write the question for the guest (5+ characters).' };
  if (input.decision === 'reject' && message.length < 5) return { error: 'Give the guest a reason for the rejection (5+ characters).' };
  if ((input.decision === 'compensation' || input.decision === 'refund') && message.length < 5) {
    return { error: 'Write a short message the guest will see (5+ characters).' };
  }

  const commit = (
    patch: Partial<CompensationRefundRequest>,
    entry: { status: CompensationRefundStatus; note: string },
    extra: Partial<DemoState>,
    feed: string,
    auditAction: string,
    guest: { title: string; body: string },
    toRole: { role: RoleId; title: string; body: string } | null,
    toast: string,
  ): FdResult => {
    const history = [...(claim.history ?? []), { at, status: entry.status, note: entry.note, staff: FD_ACTOR }];
    const claims = list.map((c) => (c.id === claim.id ? { ...c, ...patch, internalStaffNote: internal ?? c.internalStaffNote, history, updatedAt: at } : c));
    return {
      next: {
        ...s,
        ...extra,
        guestCompensationRefundRequests: claims,
        notifications: toRole ? roleNotice(s, toRole.role, toRole.title, toRole.body) : s.notifications,
        guestNotifications: guestNotice(s, claim.room, guest.title, guest.body),
        feed: feedWith(s, feed),
        auditTrail: auditWith(s, auditAction, claim.ref, `${entry.note}${internal ? ` · note: ${internal}` : ''}`),
      },
      message: toast,
    };
  };

  /* ---- ask the guest for more details ---- */
  if (input.decision === 'request_info') {
    return commit(
      { status: 'Additional Information Required', staffResponse: message, additionalInfoRequested: message },
      { status: 'Additional Information Required', note: `Front Desk asked: ${message}` },
      {},
      `${claim.ref} · more details requested from ${claim.guestName}`,
      'Claim: information requested',
      { title: 'We need a little more information', body: `Front Desk needs more details for ${claim.ref}. Open Financial Issues to reply.` },
      null,
      `Question sent to ${claim.guestName}. The claim stays open.`,
    );
  }

  /* ---- reject ---- */
  if (input.decision === 'reject') {
    return commit(
      { status: 'Rejected', staffResponse: message, rejectionReason: message, resolvedAt: at, resolvedBy: FD_ACTOR, decidedBy: FD_ACTOR, decidedAt: at },
      { status: 'Rejected', note: `Rejected by Front Desk: ${message}` },
      {},
      `${claim.ref} rejected · ${claim.guestName} · Room ${claim.room}`,
      'Claim: rejected',
      { title: 'Update on your financial request', body: `${claim.ref} was reviewed and could not be approved. Open Financial Issues to see the reason.` },
      null,
      `${claim.ref} rejected and the guest has been told why.`,
    );
  }

  /* ---- compensation / refund: amount rules ---- */
  const amount = input.amount ?? NaN;
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount greater than 0.' };
  if (amount > 10_000_000) return { error: 'That amount is too large to enter here.' };
  const decided = round(amount);
  const overLimit = decided > FD_CLAIM_LIMIT;
  const isRefund = input.decision === 'refund';
  if (!isRefund && !input.method) return { error: 'Choose the compensation method.' };
  const method = input.method ?? 'Folio Credit';

  /* ---- above the Front Desk limit: General Manager first (never the Duty Manager) ---- */
  if (overLimit) {
    if ((s.compensationRequests ?? []).some((x) => x.ref === `${claim.ref}-GM`)) {
      return { error: 'This claim was already sent to the General Manager.' };
    }
    const stay = s.frontDesk.stays.find((st) => st.room === claim.room);
    const request: CompensationRequest = {
      id: uid('gmc'),
      ref: `${claim.ref}-GM`,
      room: claim.room,
      guestName: claim.guestName,
      stayId: stay?.id,
      department: 'Front Office',
      amount: decided,
      reason: `${isRefund ? 'Refund' : `Compensation (${method})`} · ${claim.category}: ${claim.reason}`,
      supportingEvidence: claim.explanation,
      category: isRefund ? 'Guest refund' : 'Guest compensation',
      requestedBy: FD_ACTOR,
      requestedAt: at,
      status: 'pending_gm',
      tier: decided > 10_000 ? 'high_value' : 'standard',
      history: [
        {
          at,
          role: 'Front Desk',
          actor: 'Sunita Patel',
          action: 'Escalated to General Manager',
          note: `${inr(decided)} is above the Front Desk limit of ${inr(FD_CLAIM_LIMIT)}.${internal ? ` ${internal}` : ''}`,
        },
      ],
    };
    return commit(
      { status: 'Processing', decision: input.decision === 'refund' ? 'refund' : 'compensation', decidedAmount: decided, compensationMethod: isRefund ? undefined : method, linkedCompId: request.id, staffResponse: message, decidedBy: FD_ACTOR, decidedAt: at },
      { status: 'Processing', note: `${inr(decided)} ${isRefund ? 'refund' : `compensation (${method})`} is above the Front Desk limit and was sent to the General Manager.` },
      { compensationRequests: [request, ...(s.compensationRequests ?? [])] },
      `${claim.ref} sent to the General Manager · ${inr(decided)} above the Front Desk limit`,
      'Claim: escalated to General Manager',
      { title: 'Your request is being reviewed', body: `${claim.ref} needs General Manager approval. We will update you here.` },
      { role: 'general_manager', title: `Approval needed · ${claim.ref}`, body: `${claim.guestName} · Room ${claim.room} · ${inr(decided)} guest ${isRefund ? 'refund' : 'compensation'} above the Front Desk limit.` },
      `Above your ${inr(FD_CLAIM_LIMIT)} limit. Sent to the General Manager for approval.`,
    );
  }

  /* ---- refund within the limit: Financial Officer queue ---- */
  if (isRefund) {
    const refundId = `RFD-${claim.ref}`;
    if ((s.refundRequests ?? []).some((r) => r.id === refundId || r.sourceCaseRef === claim.ref)) {
      return { error: 'A refund for this claim is already in the Finance queue.' };
    }
    const invoice = (s.invoices ?? []).find((i) => i.roomNumber === claim.room);
    const cardMaskDigits = claim.additionalInstructions?.match(/\b\d{4}\b/)?.[0];
    const cardMask = cardMaskDigits ? `•••• ${cardMaskDigits}` : '•••• 4242';
    const refund: FinanceRefundRequest = {
      id: refundId,
      invoiceId: invoice?.id ?? `FOL-${claim.room}`,
      guestName: claim.guestName,
      roomNumber: claim.room,
      amount: decided,
      reason: `${claim.category} · ${claim.reason}${internal ? ` · ${internal}` : ''}`,
      requestedAt: `Today, ${at}`,
      requestedBy: FD_ACTOR,
      status: 'Pending Review',
      sourceCaseRef: claim.ref,
      cardMask,
    };
    return commit(
      { status: 'Processing', decision: 'refund', decidedAmount: decided, linkedRefundId: refund.id, staffResponse: message, decidedBy: FD_ACTOR, decidedAt: at },
      { status: 'Processing', note: `Refund of ${inr(decided)} sent to the Financial Officer.` },
      { refundRequests: [refund, ...(s.refundRequests ?? [])] },
      `${claim.ref} · refund ${inr(decided)} sent to the Financial Officer`,
      'Claim: refund sent to Finance',
      { title: 'Your refund is being processed', body: `${claim.ref}: a refund of ${inr(decided)} was approved by Front Desk and sent to Finance.` },
      { role: 'financial_operator', title: `Refund to review · ${claim.ref}`, body: `${claim.guestName} · Room ${claim.room} · ${inr(decided)} · sent by Front Desk.` },
      `Refund of ${inr(decided)} sent to the Financial Officer. Front Desk cannot pay it out.`,
    );
  }

  /* ---- compensation within the limit: applied now ---- */
  const posted = POSTS_TO_FOLIO.includes(method);
  return commit(
    {
      status: 'Resolved',
      decision: 'compensation',
      decidedAmount: decided,
      approvedAmount: decided,
      compensationMethod: method,
      staffResponse: message,
      resolutionDetails: `${method} of ${inr(decided)} ${posted ? 'posted to your folio' : 'issued to you'}.`,
      resolvedAt: at,
      resolvedBy: FD_ACTOR,
      decidedBy: FD_ACTOR,
      decidedAt: at,
    },
    { status: 'Resolved', note: `${method} of ${inr(decided)} applied by Front Desk.` },
    posted ? { folios: addFolioCredit(s, claim.room, `Goodwill credit · ${method} · ${claim.ref}`, decided) } : {},
    `${claim.ref} · ${method} ${inr(decided)} applied for ${claim.guestName}`,
    'Claim: compensation applied',
    { title: 'Compensation approved', body: `${claim.ref}: ${method} of ${inr(decided)} ${posted ? 'was posted to your folio' : 'has been issued'}.` },
    null,
    `${method} of ${inr(decided)} applied for ${claim.guestName}.`,
  );
}

/* --------------------------------------------------------------------- */
/* Sample claims (migrated from the old Dispute board)                    */
/* --------------------------------------------------------------------- */

const seedEntry = (at: string, status: CompensationRefundStatus, note: string) => ({ at, status, note });

export const seedFrontDeskClaims: CompensationRefundRequest[] = [
  {
    id: 'crr-fd-001',
    ref: 'DSP-2026-001',
    room: '305',
    guestName: 'Marcus Chen',
    bookingRef: 'BK-305-9921',
    category: 'Compensation for Service Issues',
    relatedServiceOrTransaction: 'Room Stay / Nightly Rate (₹12,500)',
    amountRequested: 2500,
    reason: 'AC cooling failure overnight',
    explanation: 'AC cooling failure and severe compressor vibration throughout the night. Room temperature reached 26.5°C. Engineering confirmed a fan-coil actuator fault.',
    incidentDate: 'Today',
    preferredResolution: 'Folio Credit / Charge Removal',
    attachments: [
      {
        name: 'room305_thermostat_26.5C.jpg',
        size: '340 KB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&auto=format&fit=crop&q=80',
      },
    ],
    status: 'Submitted',
    createdAt: 'Today, 09:12 AM',
    history: [seedEntry('09:12 AM', 'Submitted', 'Submitted from the Guest Portal')],
  },
  {
    id: 'crr-fd-002',
    ref: 'DSP-2026-002',
    room: '102',
    guestName: 'Clara Dupont',
    bookingRef: 'BK-102-4410',
    category: 'Incorrect Charges',
    relatedServiceOrTransaction: 'Minibar (₹1,850)',
    amountRequested: 1850,
    reason: 'Minibar charge for an unopened bottle',
    explanation: 'Minibar sensor charged ₹1,850 for a vintage champagne bottle that was never consumed or opened. Housekeeping saw the seal intact.',
    incidentDate: 'Today',
    preferredResolution: 'Refund to Original Card',
    additionalInstructions: 'Card ending 1290',
    attachments: [
      {
        name: 'champagne_bottle_seal_intact.jpg',
        size: '412 KB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
      },
    ],
    status: 'Submitted',
    createdAt: 'Today, 09:20 AM',
    history: [seedEntry('09:20 AM', 'Submitted', 'Submitted from the Guest Portal')],
  },
  {
    id: 'crr-fd-003',
    ref: 'DSP-2026-003',
    room: '402',
    guestName: 'Elena Rostova',
    bookingRef: 'BK-402-7721',
    category: 'Compensation for Service Issues',
    relatedServiceOrTransaction: 'Room service breakfast (₹1,600)',
    amountRequested: 1600,
    approvedAmount: 1600,
    reason: 'Breakfast delivered 45 minutes late',
    explanation: 'Room service breakfast arrived over 45 minutes late, cold, with spilt espresso.',
    incidentDate: 'Today',
    preferredResolution: 'Hotel Credit Voucher',
    decision: 'compensation',
    decidedAmount: 1600,
    compensationMethod: 'Food & Beverage Voucher',
    staffResponse: 'We are sorry about the delay. A ₹1,600 Food & Beverage voucher has been issued to you.',
    resolutionDetails: 'Food & Beverage Voucher of ₹1,600 issued to you.',
    resolvedAt: '09:26 AM',
    resolvedBy: FD_ACTOR,
    status: 'Resolved',
    createdAt: 'Today, 09:25 AM',
    history: [
      seedEntry('09:25 AM', 'Submitted', 'Submitted from the Guest Portal'),
      seedEntry('09:26 AM', 'Resolved', 'Food & Beverage Voucher of ₹1,600 applied by Front Desk.'),
    ],
  },
  {
    id: 'crr-fd-004',
    ref: 'DSP-2026-004',
    room: '204',
    guestName: 'Rajesh Verma',
    bookingRef: 'BK-204-1010',
    category: 'Compensation for Service Issues',
    relatedServiceOrTransaction: 'Room Stay / Nightly Rate (₹8,200)',
    amountRequested: 1500,
    reason: 'Room not clean on arrival',
    explanation: 'Bathroom floor damp and soiled bath towels found on the rack on arrival. Housekeeping fixed it within 15 minutes.',
    incidentDate: 'Today',
    preferredResolution: 'Folio Credit / Charge Removal',
    status: 'Submitted',
    createdAt: 'Today, 08:50 AM',
    history: [seedEntry('08:45 AM', 'Submitted', 'Submitted from the Guest Portal')],
  },
  {
    id: 'crr-fd-005',
    ref: 'DSP-2026-005',
    room: '518',
    guestName: 'Vikramaditya Singhania',
    bookingRef: 'BK-518-9002',
    category: 'Compensation for Service Issues',
    relatedServiceOrTransaction: 'Presidential Suite Nightly Rate (₹45,000)',
    amountRequested: 14500,
    reason: 'Presidential Suite HVAC Chiller Failure & VIP Meeting Disruption',
    explanation: 'HVAC cooling failed during a diplomatic delegate meeting in the Presidential Suite. Temperature logged at 31°C for over 3 hours. Conference had to be relocated to the boardroom. Requested suite stay credit compensation.',
    incidentDate: 'Today',
    preferredResolution: 'Folio Credit / Charge Waiver',
    decision: 'compensation',
    decidedAmount: 14500,
    compensationMethod: 'Folio Credit',
    linkedCompId: 'comp-2',
    staffResponse: '₹14,500 compensation is above the Front Desk limit of ₹2,500. Escalated to General Manager Priya Nair for executive authorization.',
    decidedBy: FD_ACTOR,
    decidedAt: '10:00 AM',
    status: 'Processing',
    createdAt: 'Today, 09:30 AM',
    attachments: [
      {
        name: 'suite518_hvac_thermostat_error.jpg',
        size: '420 KB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&auto=format&fit=crop&q=80',
      },
    ],
    history: [
      seedEntry('09:30 AM', 'Submitted', 'Submitted from the Guest Portal'),
      seedEntry('10:00 AM', 'Processing', '₹14,500 compensation (Folio Credit) is above the Front Desk limit and was sent to the General Manager.'),
    ],
  },
  {
    id: 'crr-fd-006',
    ref: 'DSP-2026-006',
    room: '402',
    guestName: 'David Miller',
    bookingRef: 'BK-402-3310',
    category: 'Duplicate Payment',
    relatedServiceOrTransaction: 'Gourmet In-Room Dining (₹2,400)',
    amountRequested: 2400,
    reason: 'POS terminal duplicate card charge',
    explanation: 'Card terminal timed out on the first tap, and the attendant tapped a second time. My banking app shows two debits of ₹2,400 each for the same transaction ref #POS-8891.',
    incidentDate: 'Today',
    preferredResolution: 'Refund to Original Card',
    additionalInstructions: 'Card ending 5542',
    decision: 'refund',
    decidedAmount: 2400,
    linkedRefundId: 'RFD-DSP-2026-006',
    staffResponse: 'Front Desk verified duplicate POS transaction #POS-8891. Refund of ₹2,400 approved and sent to the Financial Officer for card payout.',
    decidedBy: FD_ACTOR,
    decidedAt: '10:30 AM',
    status: 'Processing',
    createdAt: 'Today, 10:15 AM',
    attachments: [
      {
        name: 'duplicate_bank_debit_sms.jpg',
        size: '295 KB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80',
      },
    ],
    history: [
      seedEntry('10:15 AM', 'Submitted', 'Submitted from the Guest Portal'),
      seedEntry('10:30 AM', 'Processing', 'Refund of ₹2,400 sent to the Financial Officer.'),
    ],
  },
];
