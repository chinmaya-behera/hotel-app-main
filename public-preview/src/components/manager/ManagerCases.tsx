'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BellRing, CheckCheck, Plus, X } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { departmentId, isOpen, managerDepartment } from '@/lib/manager-domain';
import { managerComplaints, managerRepairs, medicalReminders, type ManagerComplaint } from '@/lib/manager-workflows';
import { REPAIR_CATEGORIES, repairCategory } from '@/lib/department-insights';
import type { ComplaintStatus, ManagerMedicalCase, WorkItem } from '@/types/demo';

export const managerDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : value || 'Not scheduled';
function localDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
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
  const visible = cases.filter(c => (filter === 'all' || filter === 'due' ? filter !== 'due' || due.has(c.id) : c.status !== 'closed') && `${c.reference} ${c.guest} ${c.location}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="dm-panel">
    <div className="dm-panel-heading"><div><h2>Guest medical cases</h2><p>Track guest-care cases, urgency, follow-up reminders and chronological case notes.</p></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> New medical case</button></div>
    <div className="dm-toolbar"><input aria-label="Search medical cases" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, guest or location"/><select aria-label="Filter medical cases" value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Active cases</option><option value="due">Follow-ups due ({due.size})</option><option value="all">All cases</option></select></div>
    {!visible.length && <Empty text="Log a case to keep its reference, notes and next follow-up together."/>}
    {visible.map(c => <article className="dm-record" key={c.id}><div className="dm-record-title"><div><small className="dm-reference">{c.reference}</small><h3>{c.guest} · {c.location}</h3></div><span className={`dm-status ${c.urgency !== 'routine' ? 'urgent' : ''}`}>{c.urgency} · {c.status}</span></div><p>{c.history.at(-1)?.note}</p><div className="dm-record-actions"><span className={due.has(c.id) ? 'dm-reminder-due' : 'dm-subtle'}><BellRing size={14}/> {due.has(c.id) ? 'Follow-up due' : 'Follow-up'} · {managerDate(c.followUpAt)}</span><button className="dm-small-button" onClick={() => open(c)}>Update case / reminder</button></div><History entries={c.history}/></article>)}
    <dialog className="dm-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="medical-title"><form key={selected ? record?.id || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="medical-title">{record ? 'Update medical case' : 'New medical case'}</h2><button className="dm-icon-button" type="button" aria-label="Close medical case" onClick={close}><X size={19}/></button></div><p className="dm-dialog-description">{record ? record.reference : 'A unique case reference will be generated when saved.'} · Wellness case records</p>
      {!record && <div className="dm-form-grid"><label className="dm-field">Guest / case identifier<input name="guest" required maxLength={100}/></label><label className="dm-field">Room / location<input name="location" required maxLength={100}/></label></div>}
      <div className="dm-form-grid"><Priority value={record?.urgency} medical/>{record && <label className="dm-field">Case status<select name="status" defaultValue={record.status}><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="closed">Closed</option></select></label>}</div>
      <label className="dm-field">Follow-up reminder<input type="datetime-local" name="followUp" defaultValue={localDate(record?.followUpAt)}/></label>
      {record && <label className="dm-check-label"><input type="checkbox" name="acknowledge"/> Acknowledge the current follow-up reminder</label>}
      <label className="dm-field">{record ? 'Add case note / follow-up outcome' : 'Initial case note'}<textarea name="note" required maxLength={2000}/></label><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={close}>Cancel</button><button className="dm-primary" type="submit">Save case</button></div></form></dialog>
  </section>;
}

export function DepartmentComplaints() {
  const { state, departmentManagerCommand } = useDemo();
  const d = managerDepartment(state.managerDepartment);
  const [selected, setSelected] = useState<ManagerComplaint | 'new' | null>(null);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('active');
  const dialog = useRef<HTMLDialogElement>(null);
  const record = selected && selected !== 'new' ? selected : null;
  const complaints = managerComplaints(state, d.id).filter(c => (filter === 'all' || isOpen(c.status)) && `${c.reference} ${c.title} ${c.room} ${c.guest}`.toLowerCase().includes(search.toLowerCase()));
  const open = (next: NonNullable<typeof selected>) => { setSelected(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setSelected(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const { text } = values(event);
    const ok = record ? departmentManagerCommand({ type: 'complaint-update', reference: record.reference, status: text('status') as ComplaintStatus, note: text('note') }) : departmentManagerCommand({ type: 'complaint-create', guest: text('guest'), room: text('room'), title: text('title'), description: text('note'), priority: text('priority') as 'normal' | 'urgent' | 'critical' });
    if (ok) close();
  };
  return <section className="dm-panel"><div className="dm-panel-heading"><div><h2>{d.name} complaints</h2><p>Guest and Front Desk complaints routed to your department, with shared status updates.</p></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> Log complaint</button></div><div className="dm-toolbar"><input aria-label="Search complaints" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaint, guest or room"/><select aria-label="Filter complaints" value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Active complaints</option><option value="all">All complaints</option></select></div>
    {!complaints.length && <Empty text="No matching department complaints. You can log a guest concern here."/>}
    {complaints.map(c => <article key={c.reference} className="dm-record"><div className="dm-record-title"><div><small className="dm-reference">{c.reference}</small><h3>{c.title}</h3></div><span className="dm-status">{c.status}</span></div><small>{c.guest} · {c.room} · {c.priority} · {managerDate(c.createdAt)}</small><p>{c.description}</p><button className="dm-small-button" onClick={() => open(c)}>Review complaint</button><History entries={c.history}/></article>)}
    <dialog className="dm-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="complaint-title"><form key={selected ? record?.reference || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="complaint-title">{record ? 'Review complaint' : 'Log department complaint'}</h2><button className="dm-icon-button" type="button" aria-label="Close complaint" onClick={close}><X size={19}/></button></div><p className="dm-dialog-description">{d.name}{record ? ` · ${record.reference}` : ' · Shared with guest and Front Desk records'}</p>
      {record ? <label className="dm-field">Complaint status<select name="status" defaultValue={['Under Review', 'In Progress', 'Resolved'].includes(record.status) ? record.status : 'Under Review'}><option>Under Review</option><option>In Progress</option><option>Resolved</option></select></label> : <><label className="dm-field">Complaint title<input name="title" required maxLength={160}/></label><div className="dm-form-grid"><label className="dm-field">Guest name<input name="guest" required maxLength={100}/></label><label className="dm-field">Room / location<input name="room" required maxLength={100}/></label></div><Priority/></>}
      <label className="dm-field">{record ? 'Response / resolution shared with the guest' : 'Complaint details'}<textarea name="note" required maxLength={2000}/></label><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={close}>Cancel</button><button type="submit" className="dm-primary">Save complaint</button></div></form></dialog>
  </section>;
}

export function HotelRepairs() {
  const { state, departmentManagerCommand } = useDemo();
  const [selected, setSelected] = useState<WorkItem | 'new' | null>(null);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('active'), [category, setCategory] = useState('all');
  const dialog = useRef<HTMLDialogElement>(null);
  const record = selected && selected !== 'new' ? selected : null;
  const staff = state.staffAccounts.filter(st => departmentId(st.department) === 'engineering' && st.roleId === 'task_fulfiller' && st.status === 'active' && !['break', 'off_duty'].includes(st.availability || 'on_duty'));
  const filtered = managerRepairs(state).filter(t => (filter === 'all' || isOpen(t.status)) && `${t.ref} ${t.title} ${t.location} ${t.room} ${t.meta} ${repairCategory(t)}`.toLowerCase().includes(search.toLowerCase()));
  const groups = REPAIR_CATEGORIES.map(name => ({ name, repairs: filtered.filter(t => repairCategory(t) === name) })).filter(group => (category === 'all' || group.name === category) && group.repairs.length);
  const open = (next: NonNullable<typeof selected>) => { setSelected(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setSelected(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const { text } = values(event);
    const ok = record && !isOpen(record.status) ? departmentManagerCommand({ type: 'repair-category', taskId: record.id, repairCategory: text('repairCategory') }) : record ? departmentManagerCommand({ type: 'repair-update', taskId: record.id, repairCategory: text('repairCategory'), status: text('status') as 'In progress' | 'Blocked' | 'Completed', note: text('note'), technicianId: text('technician') || undefined }) : departmentManagerCommand({ type: 'repair-create', repairCategory: text('repairCategory'), title: text('title'), location: text('location'), note: text('note'), priority: text('priority') as 'normal' | 'urgent' | 'critical', technicianId: text('technician') || undefined });
    if (ok) close();
  };
  return <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Hotel-wide repairs</h2><p>Engineering repairs across guest rooms, public spaces, kitchens and hotel facilities.</p></div><button className="dm-primary" onClick={() => open('new')}><Plus size={16}/> Log repair</button></div><div className="dm-toolbar"><input aria-label="Search hotel repairs" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repair, reference or location"/><select aria-label="Filter hotel repairs" value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Active repairs</option><option value="all">All repairs</option></select></div>
    <div className="dm-category-chips" aria-label="Repair categories"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All repairs · {filtered.length}</button>{REPAIR_CATEGORIES.map(name => <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name} · {filtered.filter(t => repairCategory(t) === name).length}</button>)}</div>
    <p className="dm-insight-note">Categories organise repairs across all hotel locations. Older uncategorised records show a suggested category that you can confirm or change.</p>
    {!groups.length && <Empty text="No matching repairs. Log a repair for any hotel location."/>}
    {groups.map(group => <section className="dm-repair-group" key={group.name} aria-label={group.name + ' repairs'}><div className="dm-cuisine-heading"><h3>{group.name}</h3><small>{group.repairs.length} repairs</small></div>{group.repairs.map(t => <article className="dm-record" key={t.ref || t.id}><div className="dm-record-title"><div><small className="dm-reference">{t.ref || t.id}</small><h3>{t.title}</h3></div><span className="dm-status">{t.status}</span></div><p>{t.location || t.room || t.meta}</p><small>{t.assignee || 'Awaiting technician'} · {t.priority || 'normal'}</small>{t.notes && <p>{t.notes}</p>}<small className="dm-repair-category">{repairCategory(t)}{t.repairCategory ? '' : ' · Suggested'}</small><button className="dm-small-button" onClick={() => open(t)}>{isOpen(t.status) ? 'Update repair' : 'Change category'}</button><History entries={t.history || []}/></article>)}</section>)}
    <dialog className="dm-dialog" ref={dialog} onClose={() => setSelected(null)} aria-labelledby="repair-title"><form key={selected ? record?.id || 'new' : 'closed'} onSubmit={submit}><div className="dm-dialog-heading"><h2 id="repair-title">{record ? isOpen(record.status) ? 'Update hotel repair' : 'Change repair category' : 'Log hotel repair'}</h2><button type="button" className="dm-icon-button" aria-label="Close repair" onClick={close}><X size={19}/></button></div><p className="dm-dialog-description">{record?.title || 'Maintenance & Engineering · All hotel locations'}</p>
      {!record && <><label className="dm-field">Repair title<input name="title" required maxLength={160}/></label><label className="dm-field">Hotel location<input name="location" required maxLength={150} placeholder="Room, floor, restaurant, lobby or facility"/></label><Priority/></>}
      <label className="dm-field">Repair category<select name="repairCategory" required defaultValue={record ? repairCategory(record) : 'Other'}>{REPAIR_CATEGORIES.map(name => <option key={name}>{name}</option>)}</select></label>
      <label className="dm-field">Assign Engineering technician<select disabled={!!record && !isOpen(record.status)} name="technician" defaultValue={staff.some(st => st.id === record?.assigneeId) ? record?.assigneeId : ''}><option value="">{record?.assignee ? `Keep current · ${record.assignee}` : 'Awaiting dispatcher assignment'}</option>{staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}</select></label>
      {record && isOpen(record.status) && <label className="dm-field">Repair status<select name="status" defaultValue={record.status === 'Blocked' ? 'Blocked' : 'In progress'}><option>In progress</option><option>Blocked</option><option>Completed</option></select></label>}
      <label className="dm-field">{record ? 'Progress / completion notes' : 'Repair details'}<textarea name="note" disabled={!!record && !isOpen(record.status)} required={!!record ? isOpen(record.status) : true} maxLength={2000}/></label><div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={close}>Cancel</button><button className="dm-primary" type="submit">Save repair</button></div></form></dialog>
  </section>;
}
