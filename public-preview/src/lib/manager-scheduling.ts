import type { DemoState, ShiftScheduleRecord, StaffAccount, WorkItem } from '../types/demo';
import { departmentId, isOpen, managerDepartment, managerTasks, type ManagerDepartmentId } from './manager-domain.ts';

export const REST_HOURS = 11;
export const SHIFT_PATTERNS = {
  Morning: { start: '07:00', end: '15:00' }, Day: { start: '08:00', end: '16:00' }, Evening: { start: '15:00', end: '23:00' }, Night: { start: '23:00', end: '07:00' }, Off: { start: '', end: '' },
} as const;
export type ShiftPattern = keyof typeof SHIFT_PATTERNS;
export type ScheduleCommand = { type: 'schedule-shift'; staffId: string; date: string; pattern: ShiftPattern; start: string; end: string; zone: string; reason: string };
export const localDay = (now: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export const addDays = (date: string, days: number) => new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
export function operationalWeek(date: string) { const day = new Date(date + 'T12:00:00Z').getUTCDay(); return Array.from({ length: 7 }, (_, index) => addDays(date, index - (day + 6) % 7)); }
export function shiftInterval(record: Pick<ShiftScheduleRecord, 'date' | 'startTime' | 'endTime' | 'status'>) {
  if (['off', 'leave'].includes(record.status) || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.endTime)) return undefined;
  const start = Date.parse(`${record.date}T${record.startTime}:00+05:30`);
  let end = Date.parse(`${record.date}T${record.endTime}:00+05:30`);
  if (end <= start) end += 86400000;
  return { start, end, hours: (end - start) / 3600000 };
}
export function staffSchedules(state: DemoState, staff: StaffAccount) { return (state.shiftSchedules || []).filter(record => record.employeeId === staff.employeeId || record.employeeId === staff.id); }
export function scheduleFor(state: DemoState, staff: StaffAccount, date: string) { return staffSchedules(state, staff).filter(record => record.date === date); }
export function assignmentMatches(task: WorkItem, staff: StaffAccount, roster: StaffAccount[]) {
  if (task.assigneeId) return [staff.id, staff.employeeId].includes(task.assigneeId);
  return task.assignee === staff.name && roster.filter(member => member.name === staff.name).length === 1;
}
export function rosterWorkload(state: DemoState, department: ManagerDepartmentId, now: number) {
  const roster = state.staffAccounts.filter(staff => departmentId(staff.department) === department && staff.roleId !== 'department_manager');
  const tasks = managerTasks(state, department);
  return roster.map(staff => {
    const assigned = tasks.filter(task => assignmentMatches(task, staff, roster));
    const active = assigned.filter(task => isOpen(task.status));
    const capacity = staff.maxWorkload && staff.maxWorkload > 0 ? staff.maxWorkload : 5;
    const onShift = staffSchedules(state, staff).some(record => { const interval = shiftInterval(record); return record.status !== 'conflict' && interval && interval.start <= now && interval.end > now; });
    return { staff, active, assigned, capacity, onShift, available: staff.status === 'active' && staff.roleId === 'task_fulfiller' && staff.availability !== 'break' && staff.availability !== 'off_duty' && onShift && active.length < capacity };
  });
}
export function schedulingConflicts(records: ShiftScheduleRecord[]) {
  const issues: Array<{ employeeId: string; first: string; second: string; message: string }> = [];
  const ordered = records.map(record => ({ record, interval: shiftInterval(record) })).filter(row => row.interval !== undefined).sort((a, b) => a.interval!.start - b.interval!.start);
  const last = new Map<string, typeof ordered[number]>();
  for (const row of ordered) {
    const previous = last.get(row.record.employeeId);
    if (row.interval!.hours > 12) issues.push({ employeeId: row.record.employeeId, first: row.record.id, second: row.record.id, message: 'Shift exceeds the 12-hour hotel limit' });
    if (previous) {
      const rest = (row.interval!.start - previous.interval!.end) / 3600000;
      if (rest < REST_HOURS) issues.push({ employeeId: row.record.employeeId, first: previous.record.id, second: row.record.id, message: rest < 0 ? 'Overlapping shifts' : `${rest.toFixed(1)} hours rest; ${REST_HOURS} required` });
    }
    if (!previous || row.interval!.end > previous.interval!.end) last.set(row.record.employeeId, row);
  }
  return issues;
}
export function applyScheduleCommand(state: DemoState, command: ScheduleCommand, uid: string, now: string) {
  const department = managerDepartment(state.managerDepartment);
  const staff = state.staffAccounts.find(staff => staff.id === command.staffId && departmentId(staff.department) === department.id && staff.status === 'active');
  if (!staff) throw Error('Select an active staff member in your department.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(command.date) || !Number.isFinite(Date.parse(command.date + 'T12:00:00Z')) || new Date(command.date + 'T12:00:00Z').toISOString().slice(0, 10) !== command.date || command.date < localDay(Date.parse(now))) throw Error('Choose today or a future date. Past shifts are read-only.');
  if (!Object.prototype.hasOwnProperty.call(SHIFT_PATTERNS, command.pattern)) throw Error('Choose a listed shift pattern.');
  if (!command.reason.trim() || command.reason.length > 1000 || !command.zone.trim() || command.zone.length > 150) throw Error('Enter a work zone and an audit reason.');
  const existing = scheduleFor(state, staff, command.date);
  if (existing.length > 1) throw Error('Multiple schedules exist for this employee and date. Resolve the existing conflict before editing.');
  const record: ShiftScheduleRecord = { id: existing[0]?.id || uid, employeeId: staff.employeeId, employeeName: staff.name, department: department.name, roleId: staff.roleId, date: command.date, shiftType: command.pattern === 'Off' ? 'Morning' : command.pattern, startTime: command.pattern === 'Off' ? '' : command.start, endTime: command.pattern === 'Off' ? '' : command.end, floorZone: command.zone.trim(), status: command.pattern === 'Off' ? 'off' : 'scheduled', notes: command.reason.trim() };
  const interval = shiftInterval(record);
  if (command.pattern !== 'Off' && (!interval || interval.hours < 0.5 || interval.hours > 12)) throw Error('Enter valid shift times between 30 minutes and 12 hours, including overnight shifts.');
  const other = staffSchedules(state, staff).filter(schedule => schedule.id !== record.id);
  const issues = schedulingConflicts([...other.map(schedule => ({ ...schedule, employeeId: staff.employeeId })), record]).filter(issue => issue.first === record.id || issue.second === record.id);
  if (issues.length) throw Error(issues[0].message + '. Adjust the start/end time or choose Off.');
  state.shiftSchedules = [record, ...(state.shiftSchedules || []).filter(schedule => schedule.id !== record.id)];
}
