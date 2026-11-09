'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCheck, X } from 'lucide-react';
import { DateTimePickerInput, localDateTime } from '@/components/ui/TimePickerInput';
import { useDemo } from '@/lib/store';
import { isOpen, managerDepartment, managerEscalations, managerEscalationStatus, MANAGER_DEPARTMENTS, departmentId } from '@/lib/manager-domain';
import { isPastTaskDeadline, taskSla } from '@/lib/manager-performance';
import type { WorkItem } from '@/types/demo';
import { managerDate } from './ManagerCases';

const priorities = ['low', 'normal', 'high', 'vip', 'urgent', 'critical', 'safety'] as const;
const labelPriority = (value = 'normal') => value === 'vip' ? 'VIP' : value[0].toUpperCase() + value.slice(1);
const location = (task: WorkItem) => task.room ? 'Room ' + task.room.replace(/^Room\s+/i, '') : task.location || 'General';
const reference = (task: WorkItem) => task.ref || task.id;
const filters = ['All requests', 'Past deadline', 'Completed', 'In progress', 'Assigned', 'Unassigned'] as const;

function taskStatus(task: WorkItem) {
  if (/^(completed|resolved|delivered|closed|passed)$/i.test(task.status)) return 'Completed';
  if (!isOpen(task.status)) return task.status;
  if (/blocked|escalat|issue to resolve/i.test(task.status) || task.blockerReason) return 'Issue to resolve';
  if (/progress|accepted|preparing|ready|delivery|on the way|inspection/i.test(task.status)) return 'In progress';
  return task.assignee || task.assigneeId ? 'Assigned' : 'Unassigned';
}

function RequestTable({ rows, status, owner, onDetails, actions }: {
  rows: WorkItem[];
  status: (task: WorkItem) => string;
  owner: (task: WorkItem) => string;
  onDetails: (task: WorkItem) => void;
  actions?: (task: WorkItem) => ReactNode;
}) {
  if (!rows.length) return <div className="dm-empty"><CheckCheck size={26}/><h3>No matching records</h3><p>Try changing your search or filters.</p></div>;
  return <div className="dm-table-wrap"><table className="dm-table">
    <thead><tr>
      {['Room No.', 'Owner', 'Priority', 'Status'].map(header => <th key={header} scope="col">{header}</th>)}
      {actions && <th scope="col">Actions</th>}
      <th scope="col" aria-label="Details"/>
    </tr></thead>
    <tbody>{rows.map(task => <tr key={task.id}>
      <td><strong>{location(task)}</strong><small className="dm-reference">{reference(task)}{task.id.startsWith('manager-demo-') && ' · Sample'}</small></td>
      <td>{owner(task)}</td>
      <td><span className={'dm-status ' + (['critical', 'urgent', 'safety', 'vip'].includes(task.priority || '') ? 'urgent' : '')}>{labelPriority(task.priority)}</span></td>
      <td><span className={'dm-status ' + (/^(Completed|Approved|GM Approved)$/.test(status(task)) ? 'good' : /^(Issue to resolve|Rejected|GM Rejected)$/.test(status(task)) ? 'urgent' : '')}>{status(task)}</span></td>
      {actions && <td>{actions(task)}</td>}
      <td><button type="button" className="dm-small-button" onClick={() => onDetails(task)} aria-label={'Details ' + reference(task)}>Details</button></td>
    </tr>)}</tbody>
  </table></div>;
}

function RequestDetails({ task, now, escalation, children, onHistory }: {
  task: WorkItem; now: number; escalation?: boolean; children?: ReactNode; onHistory?: () => void;
}) {
  const { state } = useDemo();
  const completed = taskStatus(task) === 'Completed';
  const deadline = taskSla(state, task, now).resolution.deadline;
  const minutes = deadline === undefined ? undefined : Math.ceil((deadline - now) / 60000);
  const issue = task.blockerReason || task.escalationReason || task.reassignReason;
  const compensation = escalation ? state.compensationRequests?.find(record => record.ref === task.linkedRef || record.ref === task.ref) : undefined;
  const history = [...(task.history ?? []), ...(task.managerEscalation?.history ?? [])];
  return <div className="dm-request-details">
    <section className="dm-record">
      <h3>{escalation ? 'What escalation' : 'What request'}</h3>
      <small className="dm-reference">{reference(task)}</small>
      <strong>{task.title}</strong>
      <small>{task.repairCategory || task.category?.replaceAll('_', ' ') || task.department || 'Service request'}</small>
      <p>{task.description || task.meta}</p>
      {escalation && task.escalationReason && <p><strong>Root cause</strong> {task.escalationReason}</p>}
    </section>
    <section className="dm-record">
      <h3>Task fulfiller assigned</h3><p>{task.assignee || task.fulfillerName || 'Unassigned'}</p>
    </section>
    {completed && task.photoUrl && <section className="dm-record"><h3>Completion photos</h3>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={task.photoUrl} alt={'Completion proof for ' + reference(task)} className="dm-proof-photo"/>
    </section>}
    <section className="dm-record">
      <h3>Other details</h3>
      <dl className="dm-history-fields">
        <div><dt>Room / location</dt><dd>{location(task)}</dd></div>
        <div><dt>Requested</dt><dd>{managerDate(task.createdAt || task.orderedAt)}</dd></div>
        <div><dt>Scheduled</dt><dd>{managerDate(task.scheduledAt || task.requestedServiceAt)}</dd></div>
        <div><dt>Priority</dt><dd>{labelPriority(task.priority)}</dd></div>
        <div><dt>Resolution SLA</dt><dd>{completed ? 'Completed' : minutes === undefined ? task.slaDue || 'Unavailable' : minutes > 0 ? minutes + ' min remaining' : minutes < 0 ? Math.abs(minutes) + ' min overdue' : 'Due now'}</dd></div>
        <div><dt>{escalation ? 'Recovery notes' : 'Guest notes'}</dt><dd>{task.notes || task.note || 'None recorded'}</dd></div>
        {escalation && <div><dt>Compensation</dt><dd>{compensation ? managerDate(compensation.requestedAt) + ' · ' + compensation.status.replaceAll('_', ' ') : task.amount ? '₹' + task.amount.toLocaleString('en-IN') : 'None recorded'}</dd></div>}
      </dl>
    </section>
    {!completed && (issue || taskStatus(task) === 'Issue to resolve') && <section className="dm-record"><h3>Issue to resolve</h3><p>{issue || 'See the issue log below.'}</p></section>}
    {children}
    {history.length > 0 && <details className="dm-case-history"><summary>Activity and issue log</summary>
      <ol>{history.map((entry, index) => <li key={entry.at + '-' + index}><small>{managerDate(entry.at)} · {entry.actor || 'Hotel operations'} · {entry.status}</small><p>{entry.note}</p></li>)}</ol>
    </details>}
    {onHistory && <button type="button" className="dm-text-button" onClick={onHistory}>View record history</button>}
  </div>;
}

function TaskEditor({ task, close }: { task: WorkItem; close: () => void }) {
  const { state, departmentManagerCommand } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const staff = state.staffAccounts.filter(member => member.roleId === 'task_fulfiller' && member.status === 'active' && departmentId(member.department) === department.id);
  const current = staff.find(member => member.id === task.assigneeId || member.employeeId === task.assigneeId || !task.assigneeId && member.name === task.assignee);
  const [owner, setOwner] = useState(current?.id || (task.assignee ? 'keep' : ''));
  const status = taskStatus(task);
  const [nextStatus, setNextStatus] = useState(status === 'Issue to resolve' ? 'Blocked' : status);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const scheduled = String(fields.get('scheduled') || '');
    const saved = departmentManagerCommand({
      type: 'task-update', taskId: task.id, staffId: owner,
      status: nextStatus as 'Assigned' | 'Unassigned' | 'In progress' | 'Blocked' | 'Completed',
      priority: String(fields.get('priority')) as NonNullable<WorkItem['priority']>,
      note: String(fields.get('note') || ''),
      photoUrl: String(fields.get('photo') || '').trim() || undefined,
      scheduledAt: scheduled ? new Date(scheduled).toISOString() : undefined,
    });
    if (saved) close();
  }
  return <form onSubmit={submit} className="dm-record">
    <h3>Update request</h3>
    <div className="dm-form-grid">
      <label className="dm-field">Assign task fulfiller<select value={owner} onChange={event => {
        setOwner(event.target.value);
        if (nextStatus === 'Assigned' || nextStatus === 'Unassigned') setNextStatus(event.target.value ? 'Assigned' : 'Unassigned');
      }}>
        <option value="">Unassigned</option>
        {!current && task.assignee && <option value="keep">Keep {task.assignee}</option>}
        {staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
      </select></label>
      <label className="dm-field">Priority<select name="priority" defaultValue={task.priority || 'normal'}>{priorities.map(value => <option key={value} value={value}>{labelPriority(value)}</option>)}</select></label>
      <label className="dm-field">Status<select value={nextStatus} onChange={event => setNextStatus(event.target.value)}>
        <option value={owner ? 'Assigned' : 'Unassigned'}>{owner ? 'Assigned' : 'Unassigned'}</option>
        <option>In progress</option><option value="Blocked">Issue to resolve</option><option>Completed</option>
      </select></label>
    </div>
    <DateTimePickerInput label="Scheduled service" name="scheduled" defaultValue={localDateTime(task.scheduledAt)}/>
    {nextStatus === 'Completed' && <label className="dm-field">Completion photo URL<input name="photo" type="url" required={task.evidenceRequired && !task.photoUrl} placeholder="https://…"/></label>}
    <label className="dm-field">{nextStatus === 'Blocked' ? 'Issue / blocker reason' : status === 'Issue to resolve' ? 'Issue resolution notes' : 'Update notes'}
      <textarea name="note" required={nextStatus === 'Blocked' || status === 'Issue to resolve'} maxLength={2000} defaultValue={task.blockerReason}/>
    </label>
    <button type="submit" className="dm-primary">Save request</button>
  </form>;
}

export function DepartmentRequests({ tasks, now, onHistory, compact = false, showOverdue = false }: {
  tasks: WorkItem[]; now: number; onHistory: (reference: string) => void; compact?: boolean; showOverdue?: boolean;
}) {
  const { state } = useDemo();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof filters[number]>(showOverdue ? 'Past deadline' : 'All requests');
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = tasks.filter(task =>
    (filter === 'Past deadline'
      ? isPastTaskDeadline(taskSla(state, task, now))
      : filter === 'All requests' || taskStatus(task) === filter || filter === 'In progress' && taskStatus(task) === 'Issue to resolve') &&
    [reference(task), location(task), task.title, task.assignee].join(' ').toLowerCase().includes(search.trim().toLowerCase()),
  );
  const close = () => dialog.current?.close();
  return <>
    {!compact && <div className="dm-toolbar">
      <input aria-label="Search department tasks" placeholder="Search reference, request, room or staff" value={search} onChange={event => setSearch(event.target.value)}/>
      <select aria-label="Filter task status" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}>
        {filters.map(value => <option key={value}>{value}</option>)}
      </select>
    </div>}
    <RequestTable rows={visible} status={taskStatus} owner={task => task.assignee || 'Unassigned'} onDetails={task => { setSelected(task); dialog.current?.showModal(); }}/>
    <dialog className="dm-dialog dm-history-dialog" ref={dialog} aria-label="Task details" onClose={() => setSelected(null)}>
      <div className="dm-dialog-heading"><h2>Task details</h2><button type="button" className="dm-icon-button" aria-label="Close task details" onClick={close}><X size={19}/></button></div>
      {selected && <RequestDetails task={selected} now={now} onHistory={() => { close(); onHistory(reference(selected)); }}>
        {isOpen(selected.status) && <TaskEditor task={selected} close={close}/>}
      </RequestDetails>}
    </dialog>
  </>;
}

export function DepartmentEscalations({ now }: { now: number }) {
  const { state, departmentManagerCommand } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const [direction, setDirection] = useState<'to' | 'from'>('to');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const [decision, setDecision] = useState<{ task: WorkItem; action: 'reject' | 'escalate' } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const decisionDialog = useRef<HTMLDialogElement>(null);
  const rows = managerEscalations(state, department.id, direction).filter(task =>
    [reference(task), location(task), task.title, task.assignee].join(' ').toLowerCase().includes(search.trim().toLowerCase()),
  );
  const status = (task: WorkItem) => {
    const current = managerEscalationStatus(task);
    return current === 'Pending' && direction === 'from' ? 'Escalated' : current;
  };
  const owner = (task: WorkItem) => {
    const target = task.managerEscalation?.target;
    if (target === 'general_manager') return 'General Manager';
    const manager = managerDepartment(target || department.id);
    return state.managerProfiles?.[manager.id]?.name || manager.person;
  };
  const canDecide = (task: WorkItem) => direction === 'to' && ['Pending', 'Acknowledged'].includes(managerEscalationStatus(task));
  function openDecision(task: WorkItem, action: 'reject' | 'escalate') {
    dialog.current?.close();
    setDecision({ task, action });
    decisionDialog.current?.showModal();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    const { task, action } = decision;
    const fields = new FormData(event.currentTarget);
    if (departmentManagerCommand({
      type: 'escalation-action', itemId: task.id, action,
      note: String(fields.get('note') || ''), target: String(fields.get('target') || ''),
    })) {
      decisionDialog.current?.close();
      if (action === 'escalate') setDirection('from');
    }
  }
  return <section className="dm-panel">
    <div className="dm-panel-heading"><div><h2>Escalations &amp; Recovery</h2><p>Track incoming cases and decisions sent to another manager.</p></div></div>
    <div className="dm-category-chips" aria-label="Escalation direction">
      <button aria-pressed={direction === 'to'} onClick={() => setDirection('to')}>To me</button>
      <button aria-pressed={direction === 'from'} onClick={() => setDirection('from')}>From me</button>
    </div>
    <div className="dm-toolbar"><input aria-label="Search escalations" placeholder="Search reference, room or escalation" value={search} onChange={event => setSearch(event.target.value)}/></div>
    <RequestTable rows={rows} status={status} owner={owner} onDetails={task => { setSelected(task); dialog.current?.showModal(); }}
      actions={direction === 'to' ? task => canDecide(task) && <div className="dm-row-actions">
        <button type="button" className="dm-small-button" disabled={status(task) !== 'Pending'}
          onClick={() => departmentManagerCommand({ type: 'escalation-action', itemId: task.id, action: 'acknowledge' })}>Acknowledge</button>
        <button type="button" className="dm-small-button" onClick={() => openDecision(task, 'reject')}>Reject</button>
        <button type="button" className="dm-primary" onClick={() => departmentManagerCommand({ type: 'escalation-action', itemId: task.id, action: 'approve' })}>Approve</button>
      </div> : undefined}/>
    <dialog className="dm-dialog dm-history-dialog" ref={dialog} aria-label="Escalation details" onClose={() => setSelected(null)}>
      <div className="dm-dialog-heading"><h2>Escalation details</h2><button type="button" className="dm-icon-button" aria-label="Close escalation details" onClick={() => dialog.current?.close()}><X size={19}/></button></div>
      {selected && <RequestDetails task={selected} now={now} escalation>
        <p className="dm-dialog-description">Owner: {owner(selected)} · {status(selected)}</p>
        {canDecide(selected) && <button type="button" className="dm-secondary" onClick={() => openDecision(selected, 'escalate')}>Route to another manager</button>}
      </RequestDetails>}
    </dialog>
    <dialog className="dm-dialog" ref={decisionDialog} aria-labelledby="dm-escalation-decision" onClose={() => setDecision(null)}>
      {decision && <form onSubmit={submit}>
        <div className="dm-dialog-heading"><h2 id="dm-escalation-decision">{decision.action === 'reject' ? 'Reject escalation' : 'Route escalation'}</h2></div>
        <p className="dm-dialog-description">{reference(decision.task)} · {decision.task.title}</p>
        {decision.action === 'escalate' && <label className="dm-field">Escalation target<select name="target" required defaultValue="">
          <option value="" disabled>Select recipient</option><option value="general_manager">General Manager</option>
          {MANAGER_DEPARTMENTS.filter(target => target.id !== department.id).map(target => <option key={target.id} value={target.id}>{target.name} Manager</option>)}
        </select></label>}
        <label className="dm-field">{decision.action === 'reject' ? 'Rejection reason' : 'Decision notes'}<textarea name="note" required maxLength={2000}/></label>
        <div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={() => decisionDialog.current?.close()}>Cancel</button>
          <button type="submit" className="dm-primary">{decision.action === 'reject' ? 'Reject' : 'Send escalation'}</button></div>
      </form>}
    </dialog>
  </section>;
}
