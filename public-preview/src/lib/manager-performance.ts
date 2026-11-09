import type { DemoState, WorkItem } from '../types/demo';
import { departmentId, isOpen, managerInspections, managerTasks, taskDepartment, type ManagerDepartmentId } from './manager-domain';
import { managerComplaints } from './manager-workflows';

export type SlaOutcome = 'met' | 'breached' | 'at_risk' | 'pending' | 'unknown' | 'disabled' | 'excluded';
export interface SlaMeasurement { kind: string; reference: string; title: string; target?: number; deadline?: number; elapsed?: number; outcome: SlaOutcome; source: string }
export const timestamp = (value?: string): number | undefined => value && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : undefined;
export const hotelDate = (now: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const completed = (status: string) => /^(completed|resolved|delivered|closed)$/i.test(status);
const cancelled = (status: string) => /cancelled|canceled|rejected/i.test(status);
const acknowledged = (status: string) => /^(accepted|acknowledged|in progress|preparing|ready|out for delivery|on the way)$/i.test(status);
const validTarget = (value?: number) => value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined;
const duration = (value?: string) => {
  const match = /^(?:due in\s*)?(\d+(?:\.\d+)?)\s*(m|min|mins|minutes?|h|hrs?|hours?)$/i.exec(value?.trim() || '');
  return match ? Number(match[1]) * (/^h/i.test(match[2]) ? 60 : 1) : undefined;
};
export function taskPolicy(state: DemoState, task: WorkItem) {
  const rule = state.routingRules?.find(rule => rule.active && departmentId(rule.department) === taskDepartment(task) && rule.category.toLowerCase() === task.category?.toLowerCase());
  return { ackTargetMinutes: validTarget(rule?.ackSlaMinutes ?? state.workflowConfig?.ackSlaMinutes), resolutionTargetMinutes: validTarget(rule?.resolutionSlaMinutes ?? state.workflowConfig?.resolutionSlaMinutes), ackEnabled: state.workflowConfig?.dualSlaEnabled ?? true, policySource: rule ? `Routing rule: ${rule.id}` : 'Property workflow targets' };
}
const key = (item: WorkItem) => `${taskDepartment(item)}:${item.ref || item.id}`;
const taskMap = (state: DemoState) => new Map((['housekeeping', 'wellness', 'engineering', 'food-beverages'] as const).flatMap(dept => managerTasks(state, dept)).map(item => [key(item), item]));

/** Capture real observation timestamps for future changes; never date an old clock-only record. */
export function stampTaskTimings(previous: DemoState, next: DemoState, at: string): DemoState {
  if (previous.items === next.items) return next;
  const before = taskMap(previous), after = taskMap(next), patches = new Map<string, NonNullable<WorkItem['serviceTiming']>>();
  for (const [id, task] of after) {
    const old = before.get(id);
    if (JSON.stringify(task) === JSON.stringify(old)) continue;
    const timing: NonNullable<WorkItem['serviceTiming']> = { ...(old?.serviceTiming || task.serviceTiming || taskPolicy(next, task)) };
    if (!old) timing.createdAt = timing.createdAt || (timestamp(task.orderedAt || task.createdAt) !== undefined ? task.orderedAt || task.createdAt : at);
    else if (!timing.createdAt && timestamp(task.orderedAt || task.createdAt) !== undefined) timing.createdAt = task.orderedAt || task.createdAt;
    if (acknowledged(task.status) && (!old || !acknowledged(old.status)) && !timing.acknowledgedAt) timing.acknowledgedAt = at;
    if (completed(task.status) && (!old || !completed(old.status))) timing.completedAt = at;
    if (old && completed(old.status) && isOpen(task.status)) timing.completedAt = undefined;
    patches.set(id, timing);
  }
  if (!patches.size) return next;
  return { ...next, items: Object.fromEntries(Object.entries(next.items).map(([role, items]) => [role, items.map(item => patches.has(key(item)) ? { ...item, serviceTiming: patches.get(key(item)) } : item)])) as DemoState['items'] };
}

export function taskTimes(state: DemoState, task: WorkItem) {
  const history = task.history || [];
  const created = timestamp(task.serviceTiming?.createdAt || task.orderedAt || task.createdAt);
  const ack = timestamp(task.serviceTiming?.acknowledgedAt || task.acknowledgedAt) ?? history.map(entry => acknowledged(entry.status) ? timestamp(entry.at) : undefined).find(value => value !== undefined);
  const journal = state.departmentRecordHistory?.toReversed().find(event => event.record.reference === (task.ref || task.id) && event.record.department === taskDepartment(task) && event.action === 'completed');
  const resolved = completed(task.status) ? timestamp(task.serviceTiming?.completedAt) ?? [...history].reverse().map(entry => completed(entry.status) ? timestamp(entry.at) : undefined).find(value => value !== undefined) ?? timestamp(journal?.record.completedAt) : undefined;
  return { created, ack, resolved };
}

function deadline(value: string | undefined, created: number | undefined, minutes?: number) {
  const explicit = timestamp(value);
  if (explicit !== undefined) return explicit;
  if (created === undefined) return undefined;
  const clock = /^(\d{1,2}):(\d{2})$/.exec(value || '');
  if (clock && Number(clock[1]) < 24 && Number(clock[2]) < 60) {
    const candidate = Date.parse(`${hotelDate(created)}T${clock[1].padStart(2, '0')}:${clock[2]}:00+05:30`);
    return candidate < created ? candidate + 86400000 : candidate;
  }
  const target = duration(value) ?? minutes;
  return target === undefined ? undefined : created + target * 60000;
}
export function measureSla(input: { kind: string; reference: string; title: string; start?: number; end?: number; target?: number; deadline?: number; now: number; closed?: boolean; excluded?: boolean; disabled?: boolean; source: string }): SlaMeasurement {
  const due = input.deadline ?? (input.start !== undefined && input.target !== undefined ? input.start + input.target * 60000 : undefined);
  const target = input.target !== undefined && due !== undefined && input.start !== undefined && due >= input.start ? (due - input.start) / 60000 : input.target;
  let outcome: SlaOutcome = 'unknown';
  if (input.excluded) outcome = 'excluded';
  else if (input.disabled) outcome = 'disabled';
  else if (due !== undefined && (input.start === undefined || due >= input.start)) {
    if (input.end !== undefined) outcome = input.end < (input.start ?? -Infinity) ? 'unknown' : input.end <= due ? 'met' : 'breached';
    else if (!input.closed) outcome = input.now > due ? 'breached' : input.now >= due - Math.max((target ?? 5) * 60000 * 0.2, 60000) ? 'at_risk' : 'pending';
  }
  return { kind: input.kind, reference: input.reference, title: input.title, target, deadline: due, elapsed: input.start !== undefined && (input.end !== undefined || !input.closed) && (input.end ?? input.now) >= input.start ? ((input.end ?? input.now) - input.start) / 60000 : undefined, outcome, source: input.source };
}
export function taskSla(state: DemoState, task: WorkItem, now: number) {
  const times = taskTimes(state, task), policy = task.serviceTiming || taskPolicy(state, task);
  const common = { reference: task.ref || task.id, title: task.title, start: times.created, now, excluded: cancelled(task.status), source: task.serviceTiming ? policy.policySource : `${policy.policySource} · historical policy not recorded` };
  const scheduled = timestamp(task.requestedServiceAt || task.scheduledAt);
  const acknowledgementObserved = acknowledged(task.status) || task.ackStatus === 'acknowledged' || task.history?.some(entry => acknowledged(entry.status));
  const resolutionStart = scheduled !== undefined && times.created !== undefined ? Math.max(times.created, scheduled - (policy.resolutionTargetMinutes || 0) * 60000) : times.created;
  return { task, created: times.created, resolved: times.resolved, acknowledgedAt: times.ack, ack: measureSla({ ...common, kind: 'Acknowledgement', end: times.ack, target: duration(task.ackSlaDue) ?? policy.ackTargetMinutes, deadline: deadline(task.ackSlaDue, times.created, policy.ackTargetMinutes), closed: completed(task.status) || !!acknowledgementObserved && times.ack === undefined, disabled: !policy.ackEnabled }), resolution: measureSla({ ...common, kind: 'Resolution / delivery', start: resolutionStart, end: times.resolved, target: duration(task.slaDue) ?? policy.resolutionTargetMinutes, deadline: scheduled ?? deadline(task.slaDue, times.created, policy.resolutionTargetMinutes), closed: completed(task.status), source: scheduled !== undefined ? 'Scheduled guest delivery slot' : common.source }) };
}
export function isPastTaskDeadline({ task, resolution }: ReturnType<typeof taskSla>) {
  return isOpen(task.status) && resolution.outcome === 'breached';
}

export function serviceTargets(state: DemoState, department: ManagerDepartmentId) { return state.departmentServiceTargets?.[department] || { complaintMinutes: 60, inspectionMinutes: 30 }; }
export function operationalSlas(state: DemoState, department: ManagerDepartmentId, now: number, since: number) {
  const targets = serviceTargets(state, department), rows: SlaMeasurement[] = [];
  for (const record of managerComplaints(state, department)) {
    const start = timestamp(record.createdAt); if (start === undefined || start < since || start > now) continue;
    const end = [...record.history].reverse().map(entry => /resolved/i.test(entry.status) ? timestamp(entry.at) : undefined).find(value => value !== undefined);
    rows.push(measureSla({ kind: 'Complaint resolution', reference: record.reference, title: record.title, start, end, target: targets.complaintMinutes, now, closed: /resolved|closed/i.test(record.status), source: 'Department service target' }));
  }
  for (const record of managerInspections(state, department)) {
    const start = timestamp(record.createdAt); if (start === undefined || start < since || start > now) continue;
    rows.push(measureSla({ kind: 'Inspection turnaround', reference: record.ref || record.id, title: `${record.typeLabel || record.type} · ${record.roomNumber}`, start, end: record.status === 'passed' ? timestamp(record.completedAt || record.inspectedAt) : undefined, closed: record.status === 'passed', target: targets.inspectionMinutes, now, source: 'Department service target' }));
  }
  if (department === 'wellness') for (const record of state.managerOperations?.medicalCases || []) {
    const due = timestamp(record.followUpAt); if (due === undefined || due < since || due > now + 86400000) continue;
    const close = state.departmentRecordHistory?.toReversed().find(event => event.record.kind === 'medical' && event.record.reference === record.reference && event.action === 'completed');
    const ack = timestamp(record.followUpAcknowledgedAt);
    rows.push(measureSla({ kind: 'Medical follow-up', reference: record.reference, title: `Follow-up · ${record.location}`, start: timestamp(record.createdAt), deadline: due, end: ack !== undefined && ack >= due ? ack : record.status === 'closed' ? timestamp(close?.record.completedAt) : undefined, now, closed: record.status === 'closed', source: 'Scheduled case follow-up' }));
  }
  if (department === 'engineering') {
    for (const event of state.departmentRecordHistory || []) if (event.record.kind === 'asset' && event.action === 'completed') {
      const end = timestamp(event.record.completedAt), oldDue = event.changes.find(change => change.field === 'Next due')?.before;
      if (end === undefined || end < since || end > now || !/^\d{4}-\d{2}-\d{2}$/.test(oldDue || '')) continue;
      rows.push(measureSla({ kind: 'Preventive servicing', reference: event.record.reference, title: event.record.title, end, deadline: Date.parse(`${oldDue}T23:59:59+05:30`), now, closed: true, source: 'Asset due date before service' }));
    }
    for (const asset of state.managerOperations?.assets || []) if (asset.nextDue < hotelDate(now)) rows.push(measureSla({ kind: 'Preventive servicing', reference: asset.id, title: asset.name, deadline: Date.parse(`${asset.nextDue}T23:59:59+05:30`), now, source: 'Outstanding asset service date' }));
  }
  return rows;
}
export function slaSummary(rows: SlaMeasurement[]) {
  const met = rows.filter(row => row.outcome === 'met').length, breached = rows.filter(row => row.outcome === 'breached').length;
  return { met, breached, measured: met + breached, compliance: met + breached ? met / (met + breached) * 100 : undefined, atRisk: rows.filter(row => row.outcome === 'at_risk').length, unknown: rows.filter(row => row.outcome === 'unknown').length };
}
export function percentile(values: number[], percent: number): number | undefined { const sorted = values.filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b); return sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * percent) - 1)] : undefined; }
