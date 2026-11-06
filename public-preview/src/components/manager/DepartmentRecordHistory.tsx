'use client';

import { useMemo, useState } from 'react';
import { Download, History } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { managerDepartment } from '@/lib/manager-domain';
import { completedSnapshot, departmentHistory, RECORD_KINDS, repairCompletion } from '@/lib/department-record-history';
import type { DepartmentRecordEvent, WorkItem } from '@/types/demo';

const date = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
const actionLabel: Record<DepartmentRecordEvent['action'], string> = { recorded: 'Existing record', created: 'Created', updated: 'Updated', completed: 'Completed', reopened: 'Reopened', deleted: 'Removed · retained in history' };
const completionEvent = (event: DepartmentRecordEvent) => event.action === 'completed' || event.action === 'recorded' && completedSnapshot(event.record);

function HistoryEntry({ event }: { event: DepartmentRecordEvent }) {
  const record = event.record;
  return <article className="dm-record dm-history-entry">
    <div className="dm-record-title"><div><small className="dm-reference">{RECORD_KINDS[record.kind]} · {record.reference}</small><h3>{record.title}</h3></div><span className="dm-status">{actionLabel[event.action]}</span></div>
    <dl className="dm-history-meta"><div><dt>Location</dt><dd>{record.location || 'Not applicable'}</dd></div><div><dt>Status at this version</dt><dd>{record.status}</dd></div><div><dt>Assigned / responsible</dt><dd>{record.owner || 'Not recorded'}</dd></div><div><dt>{completionEvent(event) ? 'Completed on' : 'History recorded on'}</dt><dd>{date(completionEvent(event) ? record.completedAt : event.recordedAt)}</dd></div></dl>
    <p className="dm-subtle">{event.action === 'recorded' ? `Existing record added to history ${date(event.recordedAt)}. Earlier completion times are shown only when recorded.` : `${event.actor} · ${event.actorRole} · ${date(event.recordedAt)}`}</p>
    {record.notes && <p className="dm-history-notes"><b>{event.action === 'completed' ? 'Completion notes' : 'Recorded notes'}:</b> {record.notes}</p>}
    <details className="dm-case-history"><summary>View saved details{event.changes.length ? ` & ${event.changes.length} field changes` : ''}</summary>
      {event.changes.length > 0 && <div className="dm-history-changes"><h4>What changed</h4>{event.changes.map(change => <div key={change.field}><strong>{change.field}</strong><p><small>Before</small>{change.before}</p><p><small>After</small>{change.after}</p></div>)}</div>}
      <h4 className="dm-history-detail-title">Details saved with this version</h4><dl className="dm-history-fields">{Object.entries(record.fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </details>
  </article>;
}

export function DepartmentRecordHistory({ initialSearch = '' }: { initialSearch?: string }) {
  const { state } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const [search, setSearch] = useState(initialSearch), [kind, setKind] = useState('all'), [view, setView] = useState(initialSearch ? 'all' : 'completed'), [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const entries = useMemo(() => departmentHistory(state, department.id), [state, department.id]);
  const kinds = [...new Set(entries.map(entry => entry.record.kind))];
  const query = search.trim().toLowerCase(), cutoff = Date.now() - Number(period) * 86400000;
  const visible = entries.filter(entry => {
    if (kind !== 'all' && entry.record.kind !== kind) return false;
    if (view === 'completed' && !completionEvent(entry)) return false;
    if (view === 'changes' && entry.action === 'recorded') return false;
    const timestamp = view === 'completed' ? entry.record.completedAt : entry.recordedAt;
    if (period !== 'all' && (!timestamp || Date.parse(timestamp) < cutoff)) return false;
    return !query || `${entry.record.reference} ${entry.record.title} ${entry.record.location} ${entry.record.owner} ${entry.actor} ${entry.record.notes} ${Object.values(entry.record.fields).join(' ')}`.toLowerCase().includes(query);
  });
  const shown = visible.slice(0, page * 20);
  const recordCount = new Set(visible.map(event => event.record.key)).size;
  const filter = (action: () => void) => { action(); setPage(1); };
  const exportHistory = () => {
    const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"';
    const rows = [['Department', 'Type', 'Reference', 'Record', 'Action', 'Status', 'Location', 'Assigned / responsible', 'Completed on', 'Recorded on', 'Actor', 'Notes', 'Changes'], ...visible.map(event => [department.name, RECORD_KINDS[event.record.kind], event.record.reference, event.record.title, actionLabel[event.action], event.record.status, event.record.location, event.record.owner, event.record.completedAt, event.recordedAt, event.actor, event.record.notes, event.changes.map(c => `${c.field}: ${c.before} → ${c.after}`).join('\n')])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `${department.id}-record-history.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="dm-panel"><div className="dm-panel-heading"><div><h2>{department.name} record history</h2><p>Completed work and saved versions, including what changed, who recorded it and the outcome.</p></div><button className="dm-secondary" onClick={exportHistory} disabled={!visible.length}><Download size={15}/> Export history</button></div>
    <div className="dm-toolbar"><input aria-label="Search record history" placeholder="Search reference, work, location, staff or notes" value={search} onChange={e => filter(() => setSearch(e.target.value))}/><select aria-label="Record history type" value={kind} onChange={e => filter(() => setKind(e.target.value))}><option value="all">All record types</option>{kinds.map(k => <option key={k} value={k}>{RECORD_KINDS[k]}</option>)}</select><select aria-label="Record history view" value={view} onChange={e => filter(() => setView(e.target.value))}><option value="completed">Completed work</option><option value="changes">Changes since history began</option><option value="all">All saved records & changes</option></select><select aria-label="Record history period" value={period} onChange={e => filter(() => setPeriod(e.target.value))}><option value="all">All dates</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option></select></div>
    <p className="dm-insight-note">{visible.length} saved record {visible.length === 1 ? 'version' : 'versions'} · {recordCount} {recordCount === 1 ? 'record' : 'records'}. Earlier versions remain after edits or removal. {period !== 'all' && view === 'completed' ? 'Older completions without a recorded completion time are excluded from this period.' : ''}{department.id === 'wellness' ? ' Medical case notes are shown only in the Wellness workspace.' : ''}</p>
    {!visible.length && <div className="dm-empty"><History size={26}/><h3>No matching history</h3><p>Completed work and record changes appear here automatically. Choose All saved records & changes to inspect existing records.</p></div>}
    {shown.map(event => <HistoryEntry key={event.id} event={event}/>)}
    {shown.length < visible.length && <div className="dm-history-more"><button className="dm-secondary" onClick={() => setPage(previous => previous + 1)}>Show 20 more versions</button></div>}
  </section>;
}

export function RepairCompletionSummary({ task }: { task: WorkItem }) {
  const { state } = useDemo();
  const event = repairCompletion(state, task.ref || task.id);
  if (!event) return null;
  return <div className="dm-completion-summary"><strong>Repair completion record</strong><p>{event.record.notes || 'No completion notes were recorded.'}</p><small>Completed: {date(event.record.completedAt)} · Assigned technician: {event.record.owner || 'Not recorded'}{event.action === 'completed' ? ` · Recorded by ${event.actor}` : ''}</small></div>;
}
