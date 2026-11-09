import type { DemoState, WorkItem } from '../types/demo';
import { formatReferenceNumber, uniqueReferenceNumber } from './utils';

const legacyDate = '2026-11-04';
const currentFormat = /^(GC|ESC|INC|HK|TSK|REP|FB|ORD|INS)-[A-Z0-9]+-\d{6}(?:-\d+)?$/;

export function taskReferenceInitial(category?: WorkItem['category']) {
  switch (category) {
    case 'housekeeping':
    case 'laundry': return 'HK';
    case 'maintenance': return 'REP';
    case 'room_service': return 'FB';
    case 'medical':
    case 'safety': return 'INC';
    default: return 'TSK';
  }
}

function knownReferences(state: DemoState) {
  return new Set([
    ...Object.values(state.items).flatMap(items => items.map(item => item.ref)),
    ...(state.frontDesk?.complaints ?? []).map(record => record.ref),
    ...(state.guestComplaints ?? []).map(record => record.complaintId),
    ...(state.guestIncidents ?? []).map(record => record.ref),
    ...(state.incidents ?? []).map(record => record.ref),
    ...(state.safetyAlerts ?? []).map(record => record.ref),
    ...(state.inspections ?? []).map(record => record.ref),
    ...(state.customDiningRequests ?? []).map(record => record.ref),
    ...(state.managerOperations?.medicalCases ?? []).map(record => record.reference),
  ].filter((ref): ref is string => !!ref));
}

export function nextOperationalReference(state: DemoState, initial: string, room = '', date?: Date | string, pending?: ReadonlySet<string>) {
  const taken = knownReferences(state);
  pending?.forEach(reference => taken.add(reference));
  return uniqueReferenceNumber(formatReferenceNumber(initial, room, date), taken);
}

const legacyInitials: Record<string, string> = {
  CMP: 'GC', CR: 'GC', GC: 'GC', REC: 'ESC', ESC: 'ESC',
  INC: 'INC', SEC: 'INC', SFT: 'INC', MED: 'INC',
  ENG: 'REP', MX: 'REP', MNT: 'REP', REP: 'REP', PM: 'REP',
  HK: 'HK', RS: 'FB', FB: 'FB', DIN: 'FB', CST: 'FB',
  FD: 'TSK', REQ: 'TSK', SPA: 'TSK', WELL: 'TSK', SP: 'TSK', THER: 'TSK', GR: 'TSK',
};

/** Normalize demo seeds and older browser saves together so linked role queues keep the same reference. */
export function migrateOperationalReferences(state: DemoState): DemoState {
  const taken = knownReferences(state);
  const aliases = new Map<string, string>();
  const itemIds = new Set(Object.values(state.items).flatMap(rows => rows.map(row => row.id)));
  const convert = (initial: string, old: string, room?: string, date?: string) => {
    if (currentFormat.test(old)) return old;
    const existing = aliases.get(old);
    if (existing) return existing;
    const epoch = old.match(/(?:^|-)(1[0-9]{12})(?:-|$)/)?.[1];
    const created = date?.match(/\d{4}-\d{2}-\d{2}/) && Number.isFinite(Date.parse(date))
      ? date : epoch ? new Date(Number(epoch)) : legacyDate;
    const oldRoom = old.match(/^[A-Z]+-(\d{2,3}[A-Z]?)-/i)?.[1];
    const ref = uniqueReferenceNumber(formatReferenceNumber(initial, room || oldRoom || '', created), taken);
    taken.add(ref);
    aliases.set(old, ref);
    return ref;
  };
  for (const row of state.guestComplaints ?? []) row.complaintId = convert('GC', row.complaintId, row.room, row.submittedAt);
  for (const row of state.frontDesk?.complaints ?? []) row.ref = convert('GC', row.ref, row.room, row.createdAt);
  for (const row of state.guestIncidents ?? []) row.ref = convert('INC', row.ref, row.room || row.location, row.submittedAt);
  for (const row of state.incidents ?? []) row.ref = convert(row.ref.startsWith('ESC-') ? 'ESC' : 'INC', row.ref, row.affectedArea, row.reportedAt);
  for (const row of state.safetyAlerts ?? []) row.ref = convert('INC', row.ref, row.location, row.reportedAt);
  for (const row of state.customDiningRequests ?? []) row.ref = convert('FB', row.ref, row.room, row.createdAt);
  for (const row of state.managerOperations?.medicalCases ?? []) row.reference = convert('INC', row.reference, row.location, row.createdAt);
  for (const row of state.inspections ?? []) row.ref = convert('INS', row.ref || row.id, row.roomNumber, row.createdAt);
  for (const [role, rows] of Object.entries(state.items)) {
    for (const row of rows) {
      const previous = row.ref || row.id;
      const prefix = legacyInitials[previous.split('-')[0]];
      if (row.category === 'lost_found' || row.category === 'folio' || row.compensationRefundId || /^(LF|CLM|REF|COMP|EVT)-/.test(previous)) continue;
      const legacyEscalation = role === 'department_manager' &&
        (/^DISPATCH ESCALATION:/i.test(row.title) || (!row.ref && /^Escalated\b/i.test(row.status)));
      if (legacyEscalation && !previous.startsWith('ESC-')) {
        row.linkedRef ??= row.ref;
        row.room ||= row.title.match(/\bRoom\s+([0-9]{2,4}[A-Z]?)\b/i)?.[1];
        row.ref = convert('ESC', row.id, row.room || row.location, row.createdAt);
        continue;
      }
      if (!prefix && !row.category && !['department_dispatcher', 'department_dispatcher_supervisor', 'department_supervisor', 'task_fulfiller'].includes(role)) continue;
      row.ref = convert(prefix || taskReferenceInitial(row.category), previous, row.room || row.location, row.createdAt || row.orderedAt);
    }
  }
  const linked = (value?: string) => value ? aliases.get(value) ?? value : value;
  for (const rows of Object.values(state.items)) {
    for (const row of rows) {
      row.linkedRef = linked(row.linkedRef);
      row.complaintId = linked(row.complaintId);
    }
  }
  for (const row of state.frontDesk?.complaints ?? []) row.repeatOf = linked(row.repeatOf);
  for (const row of state.incidents ?? []) {
    if (row.relatedTaskRef && !itemIds.has(row.relatedTaskRef)) row.relatedTaskRef = linked(row.relatedTaskRef);
  }
  for (const row of state.notifications ?? []) {
    if (row.itemId && !itemIds.has(row.itemId)) row.itemId = linked(row.itemId);
  }
  for (const row of state.managerOperations?.appointments ?? []) row.taskRef = linked(row.taskRef)!;
  for (const row of state.managerOperations?.assets ?? []) row.workOrderRef = linked(row.workOrderRef);
  for (const event of state.departmentRecordHistory ?? []) {
    const record = event.record;
    const reference = linked(record.reference)!;
    if (reference === record.reference) continue;
    record.key = record.key.replace(/:[^:]+$/, ':' + reference);
    record.reference = reference;
  }
  return state;
}
