'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BellRing, CheckCheck, Plus, X } from 'lucide-react';
import { DateTimePickerInput, localDateTime } from '@/components/ui/TimePickerInput';
import { useDemo } from '@/lib/store';
import { departmentId, isOpen, managerDepartment } from '@/lib/manager-domain';
import { managerComplaints, managerRepairs, medicalReminders, type ManagerComplaint } from '@/lib/manager-workflows';
import { RepairCompletionSummary } from './DepartmentRecordHistory';
import { completedRecord } from '@/lib/department-record-history';
import { REPAIR_CATEGORIES, repairCategory } from '@/lib/department-insights';
import type { ComplaintStatus, ManagerMedicalCase, WorkItem } from '@/types/demo';

export const managerDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : value || 'Not scheduled';
export function useManagerClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  return now;
}
function values(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  return { text: (key: string) => String(data.get(key) || '').trim(), data };
}
function Empty({ text }: { text: string }) { return <div className="dm-empty"><CheckCheck size={26}/><h3>Nothing here yet</h3><p>{text}</p></div>; }
function History({ entries }: { entries: Array<{ at: string; note?: string; actor?: string; author?: string; status?: string }> }) {
  return <details className="dm-case-history"><summary>Case history · {entries.length} update{entries.length === 1 ? '' : 's'}</summary><ol>{entries.map((entry, i) => <li key={`${entry.at}-${i}`}><small>{managerDate(entry.at)} · {entry.author || entry.actor || 'Hotel operations'}{entry.status ? ` · ${entry.status}` : ''}</small><p>{entry.note}</p></li>)}</ol></details>;
}
const Priority = ({ value, medical = false }: { value?: string; medical?: boolean }) => <label className="dm-field">{medical ? 'Urgency level' : 'Priority'}<select name="priority" defaultValue={value || (medical ? 'routine' : 'normal')}><option value={medical ? 'routine' : 'normal'}>{medical ? 'Routine' : 'Normal'}</option><option value="urgent">Urgent</option><option value="critical">Critical</option></select></label>;

export function MedicalCases({ now }: { now: number }) {
  const { state, departmentManagerCommand } = useDemo();
  const [selected, setSelected] = useState<ManagerMedicalCase | 'new' | null>(null);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const cases = state.managerOperations?.medicalCases ?? [];
  const due = new Set(medicalReminders(state, now).map(c => c.id));
  const record = selected && selected !== 'new' ? selected : null;
  const open = (next: NonNullable<typeof selected>) => { setSelected(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setSelected(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const { text, data } = values(event), follow = text('followUp');
    const common = { urgency: text('priority') as ManagerMedicalCase['urgency'], note: text('note'), followUpAt: follow ? new Date(follow).toISOString() : undefined };
    const ok = record ? departmentManagerCommand({ type: 'medical-update', caseId: record.id, status: text('status') as ManagerMedicalCase['status'], acknowledge: data.get('acknowledge') === 'on', ...common }) : departmentManagerCommand({ type: 'medical-create', guest: text('guest'), location: text('location'), ...common });
    if (ok) close();
  };
  const visible = cases.filter(c => (filter === 'all' || filter === 'due' ? filter !== 'due' || due.has(c.id) : filter === 'closed' ? c.status === 'closed' : c.status !== 'closed') && `${c.reference} ${c.guest} ${c.location}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="dm-panel">
    <div className="dm-panel-heading"><div><h2>Guest medical cases</h2><p>Track guest-care cases, urgency, follow-up reminders and chronological case notes.</p></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> New medical case</button></div>
    <div className="dm-toolbar"><input aria-label="Search medical cases" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, guest or location"/><select aria-label="Filter medical cases" value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Active cases</option><option value="due">Follow-ups due ({due.size})</option><option value="closed">Closed case history</option><option value="all">All cases</option></select></div>
    {!visible.length && <Empty text="Log a case to keep its reference, notes and next follow-up together."/>}
    {visible.map(c => <article className="dm-record" key={c.id}><div className="dm-record-title"><div><small className="dm-reference">{c.reference}</small><h3>{c.guest} · {c.location}</h3></div><span className={`dm-status ${c.urgency !== 'routine' ? 'urgent' : ''}`}>{c.urgency} · {c.status}</span></div><p>{c.history.at(-1)?.note}</p><div className="dm-record-actions"><span className={due.has(c.id) ? 'dm-reminder-due' : 'dm-subtle'}><BellRing size={14}/> {due.has(c.id) ? 'Follow-up due' : 'Follow-up'} · {managerDate(c.followUpAt)}</span><button className="dm-small-button" onClick={() => open(c)}>Update case / reminder</button></div><History entries={c.history}/></article>)}
    <dialog className="dm-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="medical-title"><form key={selected ? record?.id || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="medical-title">{record ? 'Update medical case' : 'New medical case'}</h2><button className="dm-icon-button" type="button" aria-label="Close medical case" onClick={close}><X size={19}/></button></div><p className="dm-dialog-description">{record ? record.reference : 'A unique case reference will be generated when saved.'} · Wellness case records</p>
      {!record && <div className="dm-form-grid"><label className="dm-field">Guest / case identifier<input name="guest" required maxLength={100}/></label><label className="dm-field">Room / location<input name="location" required maxLength={100}/></label></div>}
      <div className="dm-form-grid"><Priority value={record?.urgency} medical/>{record && <label className="dm-field">Case status<select name="status" defaultValue={record.status}><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="closed">Closed</option></select></label>}</div>
      <DateTimePickerInput label="Follow-up reminder" name="followUp" defaultValue={localDateTime(record?.followUpAt)}/>
      {record && <label className="dm-check-label"><input type="checkbox" name="acknowledge"/> Acknowledge the current follow-up reminder</label>}
      <label className="dm-field">{record ? 'Add case note / follow-up outcome' : 'Initial case note'}<textarea name="note" required maxLength={2000}/></label><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={close}>Cancel</button><button className="dm-primary" type="submit">Save case</button></div></form></dialog>
  </section>;
}

export function DepartmentComplaints() {
  const { state, departmentManagerCommand } = useDemo();
  const d = managerDepartment(state.managerDepartment);
  const [selected, setSelected] = useState<ManagerComplaint | 'new' | null>(null);
  const [search, setSearch] = useState(''), [view, setView] = useState<'active' | 'history'>('active');
  const [filter, setFilter] = useState('all');
  const dialog = useRef<HTMLDialogElement>(null);
  const record = selected && selected !== 'new' ? selected : null;
  const departmentCases = managerComplaints(state, d.id);
  const cases = departmentCases.filter(c => view === 'active' ? isOpen(c.status) : !isOpen(c.status));
  const statuses = [...new Set(cases.map(c => c.status))];
  const complaints = cases.filter(c => (filter === 'all' || c.status === filter) &&
    [c.reference, c.title, c.room, c.guest, c.resolution, c.resolvedBy].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const show = (next: typeof view) => { setView(next); setFilter('all'); };
  const open = (next: NonNullable<typeof selected>) => { setSelected(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setSelected(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const { text } = values(event);
    const ok = record ? departmentManagerCommand({ type: 'complaint-update', reference: record.reference, status: text('status') as ComplaintStatus, note: text('note') }) : departmentManagerCommand({ type: 'complaint-create', guest: text('guest'), room: text('room'), title: text('title'), description: text('note'), priority: text('priority') as 'normal' | 'urgent' | 'critical' });
    if (ok) {
      close();
      if (record && text('status') === 'Resolved') show('history');
      else if (!record) show('active');
    }
  };
  return <section className="dm-panel"><div className="dm-panel-heading"><div><h2>{d.name} complaints</h2><p>Guest and Front Desk complaints routed to your department, with shared status updates.</p></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> Log complaint</button></div><div className="dm-category-chips" aria-label="Complaint views">
    <button aria-pressed={view === 'active'} onClick={() => show('active')}>Active complaints</button>
    <button aria-pressed={view === 'history'} onClick={() => show('history')}>Complaint History</button>
  </div>
  <div className="dm-toolbar"><input aria-label="Search complaints" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, complaint, guest or room"/>
    <select aria-label="Filter complaints" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select>
  </div>
    {!complaints.length && <Empty text="No matching department complaints."/>}
    {complaints.map(c => {
      const resolution = [...c.history].reverse().find(entry => /resolved|rejected|closed/i.test(entry.status));
      return <article key={c.reference} className="dm-record">
        <div className="dm-record-title"><div><small className="dm-reference">{c.reference}</small><h3>{c.title}</h3></div><span className="dm-status">{c.status}</span></div>
        <small>{c.guest} · {c.room} · {c.priority} · Reported {managerDate(c.createdAt)}</small>
        <p>{c.description}</p>
        {view === 'history' ? <div className="dm-insight-note"><strong>Resolution</strong><p>{c.resolution || resolution?.note || 'No resolution notes recorded.'}</p>
          <small>{c.resolvedBy || resolution?.actor || 'Hotel operations'} · {managerDate(c.resolvedAt || resolution?.at)}</small></div> :
          <button className="dm-small-button" onClick={() => open(c)}>Resolve complaints</button>}
        <History entries={c.history}/>
      </article>;
    })}
    <dialog className="dm-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="complaint-title"><form key={selected ? record?.reference || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="complaint-title">{record ? 'Resolve complaints' : 'Log department complaint'}</h2><button className="dm-icon-button" type="button" aria-label="Close complaint" onClick={close}><X size={19}/></button></div><p className="dm-dialog-description">{d.name}{record ? ` · ${record.reference}` : ' · Shared with guest and Front Desk records'}</p>
      {record ? <label className="dm-field">Complaint status<select name="status" defaultValue="Resolved"><option>Under Review</option><option>In Progress</option><option>Resolved</option></select></label> : <><label className="dm-field">Complaint title<input name="title" required maxLength={160}/></label><div className="dm-form-grid"><label className="dm-field">Guest name<input name="guest" required maxLength={100}/></label><label className="dm-field">Room / location<input name="room" required maxLength={100}/></label></div><Priority/></>}
      <label className="dm-field">{record ? 'Response / resolution shared with the guest' : 'Complaint details'}<textarea name="note" required maxLength={2000}/></label><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={close}>Cancel</button><button type="submit" className="dm-primary">Save complaint</button></div></form></dialog>
  </section>;
}

export function HotelRepairs() {
  const { state, departmentManagerCommand } = useDemo();
  const [selected, setSelected] = useState<WorkItem | 'new' | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('active'), [category, setCategory] = useState('all');
  const dialog = useRef<HTMLDialogElement>(null);
  const record = selected && selected !== 'new' ? selected : null;
  const staff = state.staffAccounts.filter(st => departmentId(st.department) === 'engineering' && st.roleId === 'task_fulfiller' && st.status === 'active' && !['break', 'off_duty'].includes(st.availability || 'on_duty'));
  const filtered = managerRepairs(state).filter(t => (filter === 'all' || (filter === 'history' ? completedRecord(t.status) : isOpen(t.status))) && `${t.ref} ${t.title} ${t.location} ${t.room} ${t.meta} ${repairCategory(t)}`.toLowerCase().includes(search.toLowerCase()));
  const groups = REPAIR_CATEGORIES.map(name => ({ name, repairs: filtered.filter(t => repairCategory(t) === name) })).filter(group => (category === 'all' || group.name === category) && group.repairs.length);
  const open = (next: NonNullable<typeof selected>) => { setEditing(next === 'new'); setSelected(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setSelected(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const { text } = values(event);
    const ok = record && !isOpen(record.status) ? departmentManagerCommand({ type: 'repair-category', taskId: record.id, repairCategory: text('repairCategory') }) : record ? departmentManagerCommand({ type: 'repair-update', taskId: record.id, repairCategory: text('repairCategory'), status: text('status') as 'In progress' | 'Blocked' | 'Completed', note: text('note') }) : departmentManagerCommand({ type: 'repair-create', repairCategory: text('repairCategory'), title: text('title'), location: text('location'), note: text('note'), priority: text('priority') as 'normal' | 'urgent' | 'critical', technicianId: text('technician') || undefined });
    if (ok) close();
  };
  return <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Hotel-wide repairs</h2><p>Engineering repairs across guest rooms, public spaces, kitchens and hotel facilities.</p></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> Log repair</button></div><div className="dm-toolbar"><input aria-label="Search hotel repairs" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repair, reference or location"/><select aria-label="Filter hotel repairs" value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Active repairs</option><option value="history">Completed repair history</option><option value="all">All repairs</option></select></div>
    <div className="dm-category-chips" aria-label="Repair categories"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All repairs · {filtered.length}</button>{REPAIR_CATEGORIES.map(name => <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name} · {filtered.filter(t => repairCategory(t) === name).length}</button>)}</div>
    <p className="dm-insight-note">Categories organise repairs across all hotel locations. Older uncategorised records show a suggested category that you can confirm or change.</p>
    {!groups.length && <Empty text="No matching repairs. Log a repair for any hotel location."/>}
    {groups.map(group => <section className="dm-repair-group" key={group.name} aria-label={group.name + ' repairs'}>
      <div className="dm-cuisine-heading"><h3>{group.name}</h3><small>{group.repairs.length} repairs</small></div>
      {group.repairs.map(task => <article className="dm-record dm-repair-summary" key={task.ref || task.id}>
        <div><small className="dm-reference">{task.ref || task.id}</small><h3>{task.title}</h3><small>{task.location || task.room || task.meta}</small></div>
        <span className="dm-status">{task.priority || 'normal'}</span><span className="dm-status">{task.status}</span>
        <button className="dm-small-button" onClick={() => open(task)} aria-label={'Details ' + (task.ref || task.id)}>Details</button>
      </article>)}
    </section>)}
    <dialog className="dm-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="repair-title">{record && !editing ? <>
      <div className="dm-dialog-heading"><h2 id="repair-title">Repair details</h2><button type="button" className="dm-icon-button" aria-label="Close repair" onClick={close}><X size={19}/></button></div>
      <div className="dm-record"><small className="dm-reference">{record.ref || record.id}</small><h3>{record.title}</h3><p>{record.description || record.meta}</p></div>
      <dl className="dm-history-fields">
        <div><dt>Room / location</dt><dd>{record.location || record.room || record.meta}</dd></div>
        <div><dt>Reported</dt><dd>{managerDate(record.createdAt)}</dd></div>
        <div><dt>Category</dt><dd>{repairCategory(record)}</dd></div>
        <div><dt>Status / priority</dt><dd>{record.status} · {record.priority || 'normal'}</dd></div>
        <div><dt>Technician</dt><dd>{record.assignee || 'Unassigned'}</dd></div>
        <div><dt>Room hold</dt><dd>{state.frontDesk.rooms.some(room => room.no === (record.room || record.location?.replace(/^Room\s+/i, '')) && room.readiness === 'out_of_order') ? 'Out of order' : 'No out-of-order hold recorded'}</dd></div>
        <div><dt>Repair notes</dt><dd>{record.notes || record.blockerReason || 'None recorded'}</dd></div>
      </dl>
      {record.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={record.photoUrl} alt={'Repair evidence for ' + (record.ref || record.id)} className="dm-proof-photo"/>
      )}
      {completedRecord(record.status) && <RepairCompletionSummary task={record}/>}
      <History entries={record.history || []}/>
      <div className="dm-dialog-actions"><button type="button" className="dm-primary" onClick={() => setEditing(true)}>{isOpen(record.status) ? 'Update repair' : 'Change category'}</button></div>
    </> : <form key={selected ? record?.id || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="repair-title">{record ? isOpen(record.status) ? 'Update repair' : 'Change repair category' : 'Log hotel repair'}</h2><button type="button" className="dm-icon-button" aria-label="Close repair" onClick={close}><X size={19}/></button></div><p className="dm-dialog-description">{record?.title || 'Maintenance & Engineering · All hotel locations'}</p>
      {!record && <><label className="dm-field">Repair title<input name="title" required maxLength={160}/></label><label className="dm-field">Hotel location<input name="location" required maxLength={150} placeholder="Room, floor, restaurant, lobby or facility"/></label><Priority/></>}
      <label className="dm-field">Repair category<select name="repairCategory" required defaultValue={record ? repairCategory(record) : 'Other'}>{REPAIR_CATEGORIES.map(name => <option key={name}>{name}</option>)}</select></label>
      {!record && <label className="dm-field">Assign Engineering technician<select name="technician" defaultValue=""><option value="">Awaiting dispatcher assignment</option>{staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}</select></label>}
      {record && isOpen(record.status) && <label className="dm-field">Repair status<select name="status" defaultValue={record.status === 'Blocked' ? 'Blocked' : 'In progress'}><option>In progress</option><option>Blocked</option><option>Completed</option></select></label>}
      <label className="dm-field">{record ? 'Progress / completion notes' : 'Repair details'}<textarea name="note" disabled={!!record && !isOpen(record.status)} required={!!record ? isOpen(record.status) : true} maxLength={2000}/></label><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={record ? () => setEditing(false) : close}>Cancel</button><button className="dm-primary" type="submit">Save repair</button></div></form>}</dialog>
  </section>;
}
