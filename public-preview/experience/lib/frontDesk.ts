/**
 * Front Desk workflow logic (FRONTEND ONLY).
 *
 * Every function is a pure reducer over the shared in-browser demo state: it takes the current
 * state and returns the next state plus a toast message, or an error message. There is no
 * network, database or server code here; the store simply applies the result.
 *
 * Source of truth: backlog F04, F08, F09, F14, F21, F27, F32, F34 + RBAC sheet, the
 * "Front Desk and concierge" workflow, and Billing/folio workflow.
 */
import type {
  ComplaintCase,
  DemoState,
  FolioLine,
  FrontDeskState,
  Readiness,
  RoleId,
  RoomRecord,
  StayRecord,
  SyncIssue,
  WorkItem,
} from '../types/demo.ts';
import { DEMO_TODAY, fmtDay, settleBookingFromSync } from './bookings.ts';

export type FdResult = { next: DemoState; message: string } | { error: string };

/** Prototype default: backlog says Front Desk "cannot approve comps above front-desk limit" but gives no figure (DECISIONS P-06). */
export const FRONT_DESK_COMP_LIMIT = 50;

export const READINESS_LABEL: Record<Readiness, string> = {
  dirty: 'Dirty',
  cleaning: 'Cleaning',
  inspection_pending: 'Awaiting inspection',
  ready: 'Ready',
  inspection_failed: 'Inspection failed',
  out_of_order: 'Out of order',
};

export type RouteDept = 'housekeeping' | 'maintenance' | 'room_service' | 'spa';

export const ROUTE_LABEL: Record<RouteDept, string> = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance / Engineering',
  room_service: 'Food & Beverage',
  spa: 'Spa & Recreation',
};

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;
const round = (n: number) => Math.round(n * 100) / 100;

function feedWith(s: DemoState, role: string, text: string): DemoState['feed'] {
  return [{ id: uid('fd'), at: nowLabel(), role, text }, ...s.feed].slice(0, 30);
}

function patchRoom(rooms: RoomRecord[], no: string, patch: Partial<RoomRecord>): RoomRecord[] {
  return rooms.map((r) => (r.no === no ? { ...r, ...patch } : r));
}

function patchStay(stays: StayRecord[], id: string, patch: Partial<StayRecord>): StayRecord[] {
  return stays.map((st) => (st.id === id ? { ...st, ...patch } : st));
}

function addFolioLine(s: DemoState, room: string, label: string, amount: number): DemoState['folios'] {
  const line: FolioLine = { id: uid('fo'), label, amount: round(amount), date: nowLabel() };
  return { ...s.folios, [room]: [...(s.folios[room] ?? []), line] };
}

function turnoverItem(room: string): WorkItem {
  return {
    id: uid('turn'),
    title: `Checkout turnover · Room ${room}`,
    meta: `Housekeeping · Floor ${room[0]} · Checkout turnover`,
    status: 'Assigned',
    chip: 'Due in 30m',
    tone: 'warning',
    room,
  };
}

/* --------------------------------------------------------------------- */
/* Read helpers                                                          */
/* --------------------------------------------------------------------- */

export function folioTotal(s: DemoState, room: string): number {
  return round((s.folios[room] ?? []).reduce((sum, l) => sum + l.amount, 0));
}

export function stayBalance(s: DemoState, stay: StayRecord): number {
  return round(folioTotal(s, stay.room) - stay.paid);
}

/** Folio disputes raised by the guest that Finance has not yet executed or rejected. */
export function openDisputeCount(s: DemoState, room: string): number {
  return s.items.financial_operator.filter(
    (i) => i.category === 'folio' && i.room === room && (i.status === 'Pending approval' || i.status === 'Approved'),
  ).length;
}

/** F34: checkout needs balance == 0 and no open disputes. */
export function checkoutBlockers(s: DemoState, stay: StayRecord): string[] {
  const blockers: string[] = [];
  const balance = stayBalance(s, stay);
  if (balance > 0) blockers.push(`Outstanding balance of $${balance.toFixed(2)} must be settled first.`);
  const disputes = openDisputeCount(s, stay.room);
  if (disputes > 0) {
    blockers.push(`${disputes} open folio dispute${disputes === 1 ? '' : 's'} with Finance must be resolved first.`);
  }
  return blockers;
}

/** F21: Front Desk may only check a guest into an inspected, ready, vacant room. */
export function checkInBlocker(s: DemoState, stay: StayRecord): string | null {
  if (stay.arrivalDate && stay.arrivalDate > DEMO_TODAY) return `Arrives ${fmtDay(stay.arrivalDate)}. Check-in opens on the day of arrival.`;
  if (!stay.idChecked) return 'Verify the guest ID and pre-check-in first (F08).';
  const room = s.frontDesk.rooms.find((r) => r.no === stay.room);
  if (!room) return `Room ${stay.room} is not in the room inventory.`;
  if (room.occupied) return `Room ${room.no} is still occupied.`;
  if (room.readiness !== 'ready') {
    return `Room ${room.no} is "${READINESS_LABEL[room.readiness]}". Only a supervisor can mark it Ready; Front Desk cannot check a guest into an uninspected room (F21).`;
  }
  return null;
}

export function isFrontDeskRequest(i: WorkItem): boolean {
  return i.category === 'concierge' || i.category === 'lost_found' || i.owner === 'Front Desk';
}

export const REQUEST_DONE = ['Completed', 'Closed', 'Cancelled'];

/* --------------------------------------------------------------------- */
/* Stays: pre-arrival verify (F08), check-in, early check-in (F09)       */
/* --------------------------------------------------------------------- */

export function verifyPreCheckIn(s: DemoState, stayId: string): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.id === stayId);
  if (!stay) return { error: 'Stay not found.' };
  if (stay.idChecked) return { error: `${stay.guest} is already verified.` };
  return {
    next: {
      ...s,
      frontDesk: { ...s.frontDesk, stays: patchStay(s.frontDesk.stays, stayId, { preCheckIn: 'verified', idChecked: true }) },
      feed: feedWith(s, 'Front Desk', `Pre-check-in verified · ${stay.guest} · Room ${stay.room}`),
    },
    message: `${stay.guest} verified. ID and consent recorded (simulated).`,
  };
}

export function checkIn(s: DemoState, stayId: string): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.id === stayId);
  if (!stay) return { error: 'Stay not found.' };
  if (stay.status !== 'expected') return { error: `${stay.guest} is not an expected arrival.` };
  const blocker = checkInBlocker(s, stay);
  if (blocker) return { error: blocker };
  return {
    next: {
      ...s,
      folios:
        stay.charges && stay.charges.length > 0
          ? { ...s.folios, [stay.room]: stay.charges.map((c) => ({ id: uid('fo'), label: c.label, amount: c.amount, date: nowLabel() })) }
          : s.folios,
      frontDesk: {
        ...s.frontDesk,
        stays: patchStay(s.frontDesk.stays, stayId, { status: 'in_house', ...(stay.prepaid ? { paid: stay.prepaid } : {}) }),
        rooms: patchRoom(s.frontDesk.rooms, stay.room, { occupied: true }),
      },
      revokedRooms: s.revokedRooms.filter((r) => r !== stay.room),
      feed: feedWith(s, 'Front Desk', `Checked in · ${stay.guest} · Room ${stay.room} · QR session active`),
    },
    message: `${stay.guest} checked in to Room ${stay.room}. Guest QR session is now active.`,
  };
}

export function decideEarlyCheckIn(s: DemoState, stayId: string, approve: boolean): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.id === stayId);
  if (!stay || !stay.earlyCheckIn || stay.earlyCheckIn.status !== 'pending') return { error: 'No pending early check-in request.' };
  const early = stay.earlyCheckIn;
  if (!approve) {
    return {
      next: {
        ...s,
        frontDesk: { ...s.frontDesk, stays: patchStay(s.frontDesk.stays, stayId, { earlyCheckIn: { ...early, status: 'declined' } }) },
        feed: feedWith(s, 'Front Desk', `Early check-in declined · ${stay.guest} · luggage hold offered`),
      },
      message: 'Early check-in declined. Offer a luggage hold or lounge access.',
    };
  }
  const room = s.frontDesk.rooms.find((r) => r.no === stay.room);
  if (!room || room.readiness !== 'ready' || room.occupied) {
    return { error: `Room ${stay.room} is not inspected and ready yet, so early check-in cannot be promised (F09 checks housekeeping status).` };
  }
  return {
    next: {
      ...s,
      folios: addFolioLine(s, stay.room, 'Early check-in fee', early.fee),
      frontDesk: { ...s.frontDesk, stays: patchStay(s.frontDesk.stays, stayId, { earlyCheckIn: { ...early, status: 'approved' } }) },
      feed: feedWith(s, 'Front Desk', `Early check-in approved · ${stay.guest} · $${early.fee} posted to folio`),
    },
    message: `Early check-in approved. $${early.fee.toFixed(2)} posted to the folio.`,
  };
}

/* --------------------------------------------------------------------- */
/* Billing and checkout (F34)                                            */
/* --------------------------------------------------------------------- */

export function settleBalance(s: DemoState, stayId: string): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.id === stayId);
  if (!stay) return { error: 'Stay not found.' };
  const balance = stayBalance(s, stay);
  if (balance <= 0) return { error: 'Nothing to collect: the balance is already $0.' };
  return {
    next: {
      ...s,
      frontDesk: { ...s.frontDesk, stays: patchStay(s.frontDesk.stays, stayId, { paid: round(stay.paid + balance) }) },
      feed: feedWith(s, 'Front Desk', `Balance settled · Room ${stay.room} · card ${stay.cardMask}`),
    },
    message: `$${balance.toFixed(2)} collected on card ${stay.cardMask} (simulated, tokenised).`,
  };
}

/** Marks the stay checked out and the room dirty. Shared with the Guest Portal express checkout. */
export function markCheckedOut(fd: FrontDeskState, room: string): FrontDeskState {
  return {
    ...fd,
    stays: fd.stays.map((st) => (st.room === room && st.status === 'in_house' ? { ...st, status: 'checked_out' as const } : st)),
    rooms: patchRoom(fd.rooms, room, { occupied: false, readiness: 'dirty', dnd: false }),
  };
}

export function checkOut(s: DemoState, stayId: string): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.id === stayId);
  if (!stay) return { error: 'Stay not found.' };
  if (stay.status !== 'in_house') return { error: `${stay.guest} is not in house.` };
  const blockers = checkoutBlockers(s, stay);
  if (blockers.length > 0) return { error: blockers[0] };
  return {
    next: {
      ...s,
      frontDesk: markCheckedOut(s.frontDesk, stay.room),
      revokedRooms: s.revokedRooms.includes(stay.room) ? s.revokedRooms : [...s.revokedRooms, stay.room],
      items: { ...s.items, task_fulfiller: [turnoverItem(stay.room), ...s.items.task_fulfiller] },
      feed: feedWith(s, 'Front Desk', `Checked out · ${stay.guest} · Room ${stay.room} · QR session revoked · turnover dispatched`),
    },
    message: `${stay.guest} checked out. Room ${stay.room} session revoked and turnover sent to Housekeeping.`,
  };
}

/* --------------------------------------------------------------------- */
/* Room move                                                             */
/* --------------------------------------------------------------------- */

export function moveRoom(s: DemoState, stayId: string, toRoom: string, reason: string): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.id === stayId);
  if (!stay) return { error: 'Stay not found.' };
  if (stay.status !== 'in_house') return { error: 'Only in-house guests can be moved.' };
  if (reason.trim().length < 3) return { error: 'Enter a reason for the room move.' };
  const target = s.frontDesk.rooms.find((r) => r.no === toRoom);
  if (!target) return { error: 'Choose a destination room.' };
  if (target.occupied || target.readiness !== 'ready' || target.dnd) {
    return { error: `Room ${toRoom} is not vacant and inspected, so it cannot be assigned.` };
  }
  const from = stay.room;

  const items = { ...s.items };
  (Object.keys(items) as RoleId[]).forEach((roleId) => {
    items[roleId] = items[roleId].map((i) => (i.guest && i.room === from ? { ...i, room: toRoom } : i));
  });
  items.task_fulfiller = [turnoverItem(from), ...items.task_fulfiller];

  const folios = { ...s.folios };
  folios[toRoom] = folios[from] ?? [];
  delete folios[from];

  return {
    next: {
      ...s,
      items,
      folios,
      frontDesk: {
        ...s.frontDesk,
        stays: patchStay(s.frontDesk.stays, stayId, { room: toRoom, movedFrom: from }),
        rooms: patchRoom(patchRoom(s.frontDesk.rooms, from, { occupied: false, readiness: 'dirty', dnd: false }), toRoom, { occupied: true }),
      },
      revokedRooms: [...s.revokedRooms.filter((r) => r !== toRoom), ...(s.revokedRooms.includes(from) ? [] : [from])],
      feed: feedWith(s, 'Front Desk', `Room move · ${stay.guest} · ${from} → ${toRoom} · ${reason.trim()} · old session revoked`),
    },
    message: `${stay.guest} moved ${from} → ${toRoom}. Room ${from} session revoked, folio carried over.`,
  };
}

/* --------------------------------------------------------------------- */
/* Request queue (Front Desk and concierge workflow)                     */
/* --------------------------------------------------------------------- */

export type RequestStep =
  | { kind: 'review' }
  | { kind: 'confirm' }
  | { kind: 'quote'; fee: number; terms: string }
  | { kind: 'accepted' }
  | { kind: 'declined' }
  | { kind: 'complete' }
  | { kind: 'cancel'; reason: string }
  | { kind: 'close'; idVerified?: boolean };

export function requestStep(s: DemoState, itemId: string, step: RequestStep): FdResult {
  const item = s.items.front_desk_coordinator.find((i) => i.id === itemId);
  if (!item) return { error: 'That request is no longer in the Front Desk queue.' };

  let status: string;
  let chip: string;
  let tone: WorkItem['tone'];
  let note: string | undefined;
  let message: string;
  let fee = item.fee;
  let folios = s.folios;

  switch (step.kind) {
    case 'review':
      status = 'Acknowledged';
      chip = 'Front Desk reviewing';
      tone = 'info';
      message = `${item.title}: review started, guest notified.`;
      break;
    case 'confirm':
      status = 'In progress';
      chip = 'Confirmed';
      tone = 'success';
      message = `${item.title}: confirmed, no approval or payment needed.`;
      break;
    case 'quote': {
      if (!Number.isFinite(step.fee) || step.fee < 0) return { error: 'Enter a valid price (0 or more).' };
      if (step.terms.trim().length < 3) return { error: 'Add the terms the guest is agreeing to.' };
      status = 'Awaiting guest';
      chip = step.fee > 0 ? `Quote $${step.fee.toFixed(2)}` : 'Terms sent';
      tone = 'warning';
      note = `${step.fee > 0 ? `Price $${step.fee.toFixed(2)}. ` : ''}${step.terms.trim()}`;
      fee = step.fee;
      message = `${item.title}: price and terms sent, waiting for the guest.`;
      break;
    }
    case 'accepted':
      status = 'In progress';
      chip = 'Confirmed';
      tone = 'success';
      note = 'Guest accepted the price and terms';
      message = `${item.title}: guest accepted, booking confirmed.`;
      if (item.fee && item.fee > 0 && item.room) {
        const line: FolioLine = { id: uid('fo'), label: `${item.title.split(' · ')[0]} fee`, amount: item.fee, date: nowLabel() };
        folios = { ...s.folios, [item.room]: [...(s.folios[item.room] ?? []), line] };
        message = `${item.title}: guest accepted. $${item.fee.toFixed(2)} posted to the folio.`;
      }
      break;
    case 'declined':
      status = 'Cancelled';
      chip = 'Guest declined';
      tone = 'neutral';
      note = 'Guest declined; alternatives offered';
      message = `${item.title}: guest declined, alternatives offered.`;
      break;
    case 'complete':
      status = 'Completed';
      chip = 'Completed';
      tone = 'success';
      message = `${item.title}: completed and recorded.`;
      break;
    case 'cancel':
      if (step.reason.trim().length < 3) return { error: 'Choose a reason so the guest hears why.' };
      status = 'Cancelled';
      chip = 'Not available';
      tone = 'neutral';
      note = step.reason.trim();
      message = `${item.title}: cancelled with a reason, alternatives to be offered.`;
      break;
    case 'close':
      if (item.category === 'lost_found' && !step.idVerified) return { error: 'Verify the guest ID in person before releasing a found item.' };
      status = 'Closed';
      chip = 'Closed';
      tone = 'success';
      note = item.category === 'lost_found' ? 'Released after in-person ID check' : undefined;
      message = `${item.title}: case closed.`;
      break;
  }

  const entry = { at: nowLabel(), status, note };
  const items = {
    ...s.items,
    front_desk_coordinator: s.items.front_desk_coordinator.map((i) =>
      i.id === itemId ? { ...i, status, chip, tone, fee, history: [...(i.history ?? []), entry] } : i,
    ),
  };
  return { next: { ...s, items, folios, feed: feedWith(s, 'Front Desk', `${item.ref ?? 'Case'} → ${status} · ${item.title}`) }, message };
}

/** Routes the guest case to a department. The case stays owned by Front Desk; the original timestamp and SLA clock are kept. */
export function routeRequest(s: DemoState, itemId: string, dept: RouteDept): FdResult {
  const item = s.items.front_desk_coordinator.find((i) => i.id === itemId);
  if (!item) return { error: 'That request is no longer in the Front Desk queue.' };
  if (item.routedTo) return { error: `Already routed to ${item.routedTo}.` };
  const task: WorkItem = {
    id: uid('route'),
    title: `${item.title} · from Front Desk`,
    meta: `${ROUTE_LABEL[dept]} · Routed from ${item.ref ?? 'Front Desk case'}${item.room ? ` · Room ${item.room}` : ''}`,
    status: 'Unassigned',
    chip: 'Routed by Front Desk',
    tone: 'info',
    room: item.room,
    category: dept,
    priority: item.priority,
    description: item.description,
    linkedRef: item.ref,
    createdAt: item.createdAt,
    history: [{ at: nowLabel(), status: 'Unassigned', note: 'Routed by Front Desk, original timestamp kept' }],
  };
  const items = {
    ...s.items,
    department_dispatcher: [task, ...s.items.department_dispatcher],
    front_desk_coordinator: s.items.front_desk_coordinator.map((i) =>
      i.id === itemId
        ? { ...i, routedTo: ROUTE_LABEL[dept], history: [...(i.history ?? []), { at: nowLabel(), status: i.status, note: `Routed to ${ROUTE_LABEL[dept]}` }] }
        : i,
    ),
  };
  return {
    next: { ...s, items, feed: feedWith(s, 'Front Desk', `${item.ref ?? 'Case'} routed to ${ROUTE_LABEL[dept]} · original timestamp kept`) },
    message: `Routed to ${ROUTE_LABEL[dept]}. Front Desk remains the case owner.`,
  };
}

export function escalateRequest(s: DemoState, itemId: string): FdResult {
  const item = s.items.front_desk_coordinator.find((i) => i.id === itemId);
  if (!item) return { error: 'That request is no longer in the Front Desk queue.' };
  if (item.chip === 'Escalated to Duty Manager') return { error: 'Already escalated to the Duty Manager.' };
  const alert: WorkItem = {
    id: uid('esc'),
    title: `Escalated by Front Desk · ${item.title}`,
    meta: `${item.meta}${item.ref ? ` · ${item.ref}` : ''}`,
    status: 'Escalated',
    chip: 'From Front Desk',
    tone: 'warning',
    room: item.room,
    priority: item.priority === 'vip' ? 'vip' : 'normal',
    amount: item.fee,
  };
  const items = {
    ...s.items,
    department_manager: [alert, ...s.items.department_manager],
    front_desk_coordinator: s.items.front_desk_coordinator.map((i) =>
      i.id === itemId
        ? { ...i, chip: 'Escalated to Duty Manager', tone: 'warning' as const, history: [...(i.history ?? []), { at: nowLabel(), status: i.status, note: 'Escalated to Duty Manager' }] }
        : i,
    ),
  };
  return {
    next: { ...s, items, feed: feedWith(s, 'Front Desk', `Escalated to Duty Manager · ${item.title}`) },
    message: 'Escalated to the Duty Manager.',
  };
}

export interface CaptureInput {
  guest: string;
  room?: string;
  title: string;
  channel: 'Phone' | 'Walk-in' | 'Email';
  note?: string;
}

/** Front Desk captures a case itself (phone, walk-in). Front Desk is the accountable owner. */
export function captureCase(s: DemoState, input: CaptureInput): FdResult {
  if (input.guest.trim().length < 2) return { error: 'Enter the guest name.' };
  if (input.title.trim().length < 3) return { error: 'Describe the case in a few words.' };
  const seq = 2040 + s.items.front_desk_coordinator.length + 1;
  const created = nowLabel();
  const item: WorkItem = {
    id: uid('case'),
    title: `Guest case · ${input.title.trim()}`,
    meta: `${input.channel} · ${input.guest.trim()}${input.room ? ` · Room ${input.room}` : ''} · Owner: Front Desk`,
    status: 'Open',
    chip: `Case #${seq}`,
    tone: 'warning',
    room: input.room || undefined,
    owner: 'Front Desk',
    channel: input.channel,
    ref: `FD-${seq}`,
    description: input.note?.trim() || undefined,
    createdAt: created,
    history: [{ at: created, status: 'Open', note: `Captured by ${input.channel.toLowerCase()}` }],
  };
  return {
    next: {
      ...s,
      items: { ...s.items, front_desk_coordinator: [item, ...s.items.front_desk_coordinator] },
      feed: feedWith(s, 'Front Desk', `Guest case opened · ${input.title.trim()} · ${input.channel}`),
    },
    message: `Case FD-${seq} opened. Front Desk is the owner.`,
  };
}

/* --------------------------------------------------------------------- */
/* Complaint & recovery (F32)                                            */
/* --------------------------------------------------------------------- */

export interface ComplaintInput {
  room: string;
  summary: string;
  severity: ComplaintCase['severity'];
  comp: number;
}

export function logComplaint(s: DemoState, input: ComplaintInput): FdResult {
  const stay = s.frontDesk.stays.find((x) => x.room === input.room && x.status === 'in_house');
  if (!stay) return { error: 'Choose an in-house guest.' };
  if (input.summary.trim().length < 5) return { error: 'Describe the complaint (5+ characters).' };
  if (!Number.isFinite(input.comp) || input.comp < 0) return { error: 'Compensation must be 0 or more.' };

  const prior = s.frontDesk.complaints.find((c) => c.room === input.room);
  const severity: ComplaintCase['severity'] = stay.vip || prior ? (input.severity === 'critical' ? 'critical' : 'vip') : input.severity;
  const withinLimit = input.comp <= FRONT_DESK_COMP_LIMIT;
  const applied = withinLimit && input.comp > 0;
  const created = nowLabel();
  const ref = `CR-${input.room}-${String(s.frontDesk.complaints.filter((c) => c.room === input.room).length + 1).padStart(3, '0')}`;

  const alert: WorkItem = {
    id: uid('cmp-alert'),
    title: `Guest complaint · Room ${input.room}`,
    meta: `${stay.guest} · ${input.summary.trim()}${prior ? ` · Repeat complaint (see ${prior.ref})` : ''}`,
    status: 'Escalated',
    chip: withinLimit ? 'Alert from Front Desk' : 'Above Front Desk limit',
    tone: withinLimit ? 'info' : 'warning',
    room: input.room,
    priority: severity === 'normal' ? 'normal' : severity,
    amount: input.comp > 0 ? input.comp : undefined,
  };
  const complaint: ComplaintCase = {
    id: uid('cmp'),
    ref,
    room: input.room,
    guest: stay.guest,
    summary: input.summary.trim(),
    severity,
    comp: input.comp,
    compApplied: applied,
    createdAt: created,
    managerItemId: alert.id,
    repeatOf: prior?.ref,
  };
  return {
    next: {
      ...s,
      folios: applied ? addFolioLine(s, input.room, 'Service recovery credit', -input.comp) : s.folios,
      items: { ...s.items, department_manager: [alert, ...s.items.department_manager] },
      frontDesk: { ...s.frontDesk, complaints: [complaint, ...s.frontDesk.complaints] },
      feed: feedWith(s, 'Front Desk', `Complaint ${ref} logged · Room ${input.room} · Duty Manager alerted`),
    },
    message: applied
      ? `Complaint logged and Duty Manager alerted. $${input.comp.toFixed(2)} credit applied within your $${FRONT_DESK_COMP_LIMIT} limit.`
      : withinLimit
        ? 'Complaint logged and Duty Manager alerted.'
        : `Complaint logged. $${input.comp.toFixed(2)} is above your $${FRONT_DESK_COMP_LIMIT} limit, so it waits for Duty Manager approval.`,
  };
}

/** Posts a credit the Duty Manager has approved. Front Desk never approves above its own limit. */
export function applyApprovedComp(s: DemoState, complaintId: string): FdResult {
  const c = s.frontDesk.complaints.find((x) => x.id === complaintId);
  if (!c) return { error: 'Complaint not found.' };
  if (c.compApplied) return { error: 'This credit is already applied.' };
  const alert = s.items.department_manager.find((i) => i.id === c.managerItemId);
  if (!alert || alert.status !== 'Resolved') return { error: 'The Duty Manager has not approved this credit yet.' };
  return {
    next: {
      ...s,
      folios: addFolioLine(s, c.room, 'Service recovery credit (approved)', -c.comp),
      frontDesk: { ...s.frontDesk, complaints: s.frontDesk.complaints.map((x) => (x.id === c.id ? { ...x, compApplied: true } : x)) },
      feed: feedWith(s, 'Front Desk', `Approved credit applied · ${c.ref} · $${c.comp}`),
    },
    message: `Approved credit of $${c.comp.toFixed(2)} posted to the folio.`,
  };
}

/* --------------------------------------------------------------------- */
/* Booking-payment reconciliation (F14)                                  */
/* --------------------------------------------------------------------- */

export function syncAction(s: DemoState, issueId: string, action: 'retry' | 'confirm' | 'refund'): FdResult {
  const issue = s.frontDesk.sync.find((x) => x.id === issueId);
  if (!issue) return { error: 'Reconciliation item not found.' };
  if (issue.bookingState !== 'PMS_Sync_Failed') return { error: 'This booking is already resolved.' };

  const withState = (bookingState: SyncIssue['bookingState']): FrontDeskState => ({
    ...s.frontDesk,
    sync: s.frontDesk.sync.map((x) => (x.id === issueId ? { ...x, bookingState } : x)),
  });

  if (action === 'retry') {
    const pms = s.integrations.pms ?? 'healthy';
    if (pms !== 'healthy') return { error: `PMS is ${pms} (simulated), so the retry failed again. Retry after it recovers or confirm manually.` };
    return {
      next: settleBookingFromSync(
        { ...s, frontDesk: withState('PMS_Confirmed'), feed: feedWith(s, 'Front Desk', `PMS sync recovered · ${issue.bookingRef}`) },
        issue.bookingRef,
        'confirmed',
      ),
      message: `${issue.bookingRef} confirmed in the PMS. Payment was never duplicated.`,
    };
  }
  if (action === 'confirm') {
    return {
      next: settleBookingFromSync(
        { ...s, frontDesk: withState('Manual_Confirm'), feed: feedWith(s, 'Front Desk', `Booking manually confirmed · ${issue.bookingRef}`) },
        issue.bookingRef,
        'confirmed',
      ),
      message: `${issue.bookingRef} manually confirmed and audited.`,
    };
  }
  const request: WorkItem = {
    id: uid('refund'),
    title: `Authorized refund · booking ${issue.bookingRef}`,
    meta: `Requested by Front Desk · ${issue.guest} · Card ${issue.cardMask}`,
    status: 'Pending approval',
    chip: 'Booking not confirmed',
    tone: 'warning',
    amount: issue.amount,
  };
  return {
    next: settleBookingFromSync(
      {
        ...s,
        frontDesk: withState('Refund_Requested'),
        items: { ...s.items, financial_operator: [request, ...s.items.financial_operator] },
        feed: feedWith(s, 'Front Desk', `Refund requested · ${issue.bookingRef} · $${issue.amount}`),
      },
      issue.bookingRef,
      'cancelled',
    ),
    message: `Refund of $${issue.amount.toFixed(2)} sent to Finance for approval. Front Desk cannot execute it.`,
  };
}

/* --------------------------------------------------------------------- */
/* Housekeeping link (F21): other roles' actions update room readiness   */
/* --------------------------------------------------------------------- */

/**
 * Called by the store after another role advances an item. Keeps the Front Desk room board in step:
 * a fulfiller starting/finishing a vacant-room turnover moves it through Cleaning → Awaiting inspection,
 * and only a supervisor's approval makes it Ready.
 */
export function afterAdvance(s: DemoState, roleId: RoleId, next: string, room?: string): DemoState {
  if (!room) return s;
  const rec = s.frontDesk.rooms.find((r) => r.no === room);
  if (!rec || rec.occupied) return s;

  let readiness: Readiness | null = null;
  let items = s.items;
  let text = '';

  if (roleId === 'task_fulfiller') {
    if (next === 'In progress') {
      readiness = 'cleaning';
      text = `Room ${room} cleaning started`;
    }
    if (next === 'Completed') {
      readiness = 'inspection_pending';
      text = `Room ${room} cleaned, awaiting supervisor inspection`;
      const queued = items.department_supervisor.some((i) => i.room === room && i.status === 'Awaiting inspection');
      if (!queued) {
        const inspection: WorkItem = {
          id: uid('insp'),
          title: `Turnover inspection · Room ${room}`,
          meta: 'Housekeeping · Completed just now',
          status: 'Awaiting inspection',
          room,
        };
        items = { ...items, department_supervisor: [inspection, ...items.department_supervisor] };
      }
    }
  }
  if (roleId === 'department_supervisor') {
    if (next === 'Closed') {
      readiness = 'ready';
      text = `Room ${room} inspected and Ready`;
    }
    if (next === 'Reopened') {
      readiness = 'inspection_failed';
      text = `Room ${room} failed inspection`;
    }
  }
  if (!readiness) return s;
  return {
    ...s,
    items,
    frontDesk: { ...s.frontDesk, rooms: patchRoom(s.frontDesk.rooms, room, { readiness, note: undefined }) },
    feed: feedWith(s, 'Housekeeping', text),
  };
}
