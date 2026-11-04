'use client';

import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, BookOpen, CalendarDays, CheckCheck, ChevronRight, ClipboardCheck, Download, Gauge, Handshake, LockKeyhole, LogOut, Menu, Search, Send, UserRound, Users, X, type LucideIcon } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { departmentId, isOpen, managerDepartment, managerInspections, managerNotifications, managerTasks } from '@/lib/manager-domain';
import type { SupervisorInspection, WorkItem } from '@/types/demo';
import { DepartmentDesk, DESK_LABELS } from './DepartmentDesk';
import './department-manager.css';

const NAV = [
  ['department', 'Department desk', ClipboardCheck],
  ['overview', 'Overview', Gauge], ['tasks', 'Task Monitoring', Activity],
  ['inspections', 'Inspections', ClipboardCheck], ['recovery', 'Escalations & Recovery', Handshake],
  ['staff', 'Staff & Workload', Users], ['policies', 'Policies', BookOpen],
  ['handover', 'Handover', Send], ['analytics', 'Analytics', BarChart3],
  ['notifications', 'Notifications', Bell], ['profile', 'Profile', UserRound],
] as const satisfies readonly (readonly [string, string, LucideIcon])[];
type Tab = typeof NAV[number][0];
type Modal = { kind: 'inspection'; inspection?: SupervisorInspection } | { kind: 'recovery'; task: WorkItem } | { kind: 'policy' } | { kind: 'handover' } | null;
const dateLabel = (value?: string) => { if (!value) return 'Not recorded'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); };
const statusClass = (status: string) => /resolved|completed|passed|acknowledged/i.test(status) ? 'dm-status good' : /escalat|blocked|reopened/i.test(status) ? 'dm-status urgent' : 'dm-status';

export function DepartmentManagerConsole() {
  const { state, hydrated, departmentManagerCommand } = useDemo();
  const d = managerDepartment(state.managerDepartment), profile = state.managerProfiles?.[d.id];
  const person = profile?.name || d.person;
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('week');
  const [modal, setModal] = useState<Modal>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const navigationClose = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    navigationClose.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); navigationTrigger.current?.focus(); };
  }, [sidebarOpen]);
  const tasks = managerTasks(state, d.id), active = tasks.filter(t => isOpen(t.status));
  const inspections = managerInspections(state, d.id);
  const staff = state.staffAccounts.filter(s => departmentId(s.department) === d.id);
  const supervisors = staff.filter(s => ['department_supervisor', 'department_dispatcher_supervisor'].includes(s.roleId) && s.status === 'active');
  const recovery = tasks.filter(t => /escalat|blocked/i.test(t.status));
  const notifications = managerNotifications(state, d.id), unread = notifications.filter(n => !n.read).length;
  const policies = (state.departmentPolicies ?? []).filter(p => departmentId(p.department) === d.id);
  const handovers = (state.shiftHandovers ?? []).filter(h => departmentId(h.department) === d.id);
  const pending = inspections.filter(i => i.status === 'pending');
  const completed = tasks.filter(t => !isOpen(t.status));
  const visibleTasks = tasks.filter(t => (status === 'all' || (status === 'open' ? isOpen(t.status) : !isOpen(t.status))) && `${t.title} ${t.ref} ${t.room} ${t.assignee}`.toLowerCase().includes(search.toLowerCase()));
  const navigate = (next: Tab) => { setTab(next); setSearch(''); setStatus('all'); setSidebarOpen(false); };
  const openModal = (next: NonNullable<Modal>) => { setModal(next); dialog.current?.showModal(); };
  const closeModal = () => { dialog.current?.close(); setModal(null); };
  const title = tab === 'department' ? DESK_LABELS[d.id] : NAV.find(n => n[0] === tab)?.[1];
  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget), text = (key: string) => String(form.get(key) || '').trim();
    const command = modal?.kind === 'inspection' ? { type: 'inspection' as const, location: text('location'), instructions: text('instructions'), supervisorId: text('supervisor'), inspectionId: modal.inspection?.id }
      : modal?.kind === 'recovery' ? { type: 'recovery' as const, taskId: modal.task.id, note: text('note'), decision: text('decision') as 'resolve' | 'escalate' }
      : modal?.kind === 'policy' ? { type: 'policy' as const, title: text('title'), content: text('content') }
      : { type: 'handover' as const, incoming: text('incoming'), notes: text('notes') };
    if (departmentManagerCommand(command)) closeModal();
  };
  const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const reportTasks = tasks.filter(t => { const at = Date.parse(t.createdAt || ''); return Number.isFinite(at) && at >= Date.now() - periodDays * 86400000 && at <= Date.now(); });
  const exportReport = () => {
    const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"';
    const csv = [['Department', 'Reference', 'Task', 'Status', 'Assignee', 'Created'], ...reportTasks.map(t => [d.name, t.ref || t.id, t.title, t.status, t.assignee, t.createdAt])].map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `${d.id}-${period}-report.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const taskRows = (rows: WorkItem[]) => rows.length ? <div className="dm-table-wrap"><table className="dm-table"><thead><tr><th>Request / location</th><th>Owner</th><th>Priority</th><th>Status</th><th>Follow-up</th></tr></thead><tbody>{rows.map(t => <tr key={t.id}><td><strong>{t.title}</strong><small>{t.ref || t.id}{t.room ? ` · Room ${t.room}` : ''}</small></td><td>{t.assignee || 'Awaiting assignment'}</td><td>{t.priority || 'normal'}</td><td><span className={statusClass(t.status)}>{t.status}</span></td><td>{isOpen(t.status) ? <button className="dm-text-button" onClick={() => openModal({ kind: 'recovery', task: t })}>Review <ChevronRight size={14}/></button> : 'Complete'}</td></tr>)}</tbody></table></div> : <div className="dm-empty"><CheckCheck size={26}/><h3>All clear here</h3><p>No matching department requests.</p></div>;

  const navigation = [NAV.find(n => n[0] === 'overview')!, ...NAV.filter(n => n[0] !== 'overview')];
  const completionRate = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
  const onDuty = staff.filter(member => member.status === 'active' && !['break', 'off_duty'].includes(member.availability || 'on_duty')).length;
  const kpis = [
    { label: 'Active requests', value: active.length, detail: 'Across your department', icon: Activity, next: 'tasks' as Tab },
    { label: 'Pending inspections', value: pending.length, detail: `${pending.filter(i => !i.assignedSupervisorId).length} awaiting assignment`, icon: ClipboardCheck, next: 'inspections' as Tab },
    { label: 'Open escalations', value: recovery.length, detail: 'Ready for your review', icon: Handshake, next: 'recovery' as Tab },
    { label: 'Team on duty', value: onDuty, detail: `of ${staff.filter(s => s.status === 'active').length} active team members`, icon: Users, next: 'staff' as Tab },
  ];

  if (!hydrated) return <div className="dm-loading" role="status"><span className="dm-monogram">G</span><p>Opening your department workspace…</p></div>;

  return <div className="dm-workspace" data-sidebar-open={sidebarOpen}>
    {sidebarOpen && <button className="dm-nav-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}
    <aside className="dm-sidebar" id="manager-navigation">
      <div className="dm-sidebar-brand"><span className="dm-monogram">G</span><div><strong>THE GRAND ADP</strong><small>Manager workspace</small></div><button ref={navigationClose} className="dm-mobile-close dm-icon-button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="dm-department-label"><span className="dm-department-icon"><LockKeyhole size={17}/></span><div><small>Your department</small><strong>{d.name}</strong></div></div>
      <nav aria-label="Department manager navigation">
        {navigation.map(([id, label, Icon]) => {
          const displayLabel = id === 'department' ? DESK_LABELS[d.id] : label;
          const badge = id === 'notifications' ? unread : id === 'recovery' ? recovery.length : 0;
          return <Fragment key={id}>
            {['overview', 'staff', 'notifications'].includes(id) && <p className="dm-nav-group-label">{id === 'overview' ? 'Workspace' : id === 'staff' ? 'Management' : 'Personal'}</p>}
            <button aria-label={badge > 0 ? `${displayLabel} ${badge}` : displayLabel} aria-current={tab === id ? 'page' : undefined} title={displayLabel} onClick={() => navigate(id)}><Icon size={19}/><span>{displayLabel}</span>{badge > 0 && <b>{badge}</b>}</button>
          </Fragment>;
        })}
      </nav>
      <div className="dm-sidebar-footer"><button className="dm-user-button" onClick={() => navigate('profile')} aria-label="Open manager profile"><span className="dm-avatar">{person.split(' ').map(p => p[0]).slice(0, 2).join('')}</span><span><strong>{person}</strong><small>Department Manager</small></span></button><a href="/login" aria-label="Change demo account" title="Change demo account"><LogOut size={18}/></a></div>
    </aside>

    <main className="dm-main" inert={sidebarOpen}>
      <header className="dm-topline"><div className="dm-breadcrumb"><button ref={navigationTrigger} className="dm-menu-toggle dm-icon-button" aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="manager-navigation" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><span>{d.name}</span><ChevronRight size={14}/><strong>{title === 'Overview' ? 'Overview' : title}</strong></div><div className="dm-topline-tools"><span className="dm-live"><i/> Department access</span><button className="dm-icon-button" aria-label={`Notifications, ${unread} unread`} onClick={() => navigate('notifications')}><Bell size={19}/>{unread > 0 && <b>{unread}</b>}</button><button className="dm-avatar" aria-label="View your profile" onClick={() => navigate('profile')}>{person.split(' ').map(p => p[0]).slice(0, 2).join('')}</button></div></header>

      <div className="dm-page-heading"><div><p className="dm-eyebrow">DEPARTMENT OPERATIONS</p><h1>{title === 'Overview' ? `${d.name} overview` : title}</h1><p>{d.focus}</p></div><div className="dm-heading-actions">{tab === 'overview' ? <button className="dm-primary" onClick={() => openModal({kind:'inspection'})}><ClipboardCheck size={17}/> New inspection</button> : <span className="dm-date"><CalendarDays size={16}/>{new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>}</div></div>

      {tab === 'department' && <DepartmentDesk onOpen={() => navigate('department')} onInspect={() => navigate('inspections')}/>}

      {tab === 'overview' && <>
        <div className="dm-overview-meta"><span><CalendarDays size={15}/>{new Date().toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long'})}</span><span><LockKeyhole size={14}/>{d.name} only</span></div>
        <div className="dm-kpis">{kpis.map(k => <button key={k.label} className="dm-kpi" onClick={() => navigate(k.next)}><span className="dm-kpi-label">{k.label}<span className="dm-kpi-icon"><k.icon size={19}/></span></span><strong>{k.value}</strong><span className="dm-kpi-bottom"><small>{k.detail}</small><ArrowUpRight size={15}/></span></button>)}</div>

        <div className="dm-overview-grid">
          <section className="dm-panel dm-priority-panel"><div className="dm-panel-heading"><div><div className="dm-section-title"><h2>Attention required</h2><span className="dm-count">{recovery.length}</span></div><p>Supervisor escalations waiting for a decision.</p></div><button className="dm-text-button" onClick={() => navigate('recovery')}>View all <ArrowUpRight size={15}/></button></div>
            {recovery.slice(0, 3).map(t => <article key={t.id} className="dm-attention-row"><span className="dm-attention-icon"><Handshake size={19}/></span><div><strong>{t.title}</strong><small>{t.meta}</small><span className="dm-status urgent">Needs review</span></div><button className="dm-small-button" onClick={() => openModal({kind:'recovery',task:t})}>Review <ArrowRight size={14}/></button></article>)}
            {recovery.length === 0 && <div className="dm-empty"><CheckCheck size={28}/><h3>Everything is in hand</h3><p>No escalations need your review.</p></div>}
            <div className="dm-panel-footnote"><LockKeyhole size={13}/><span>Cases are limited to your department.</span></div>
          </section>

          <section className="dm-panel dm-shift-card"><div className="dm-section-title"><h2>Shift snapshot</h2><span className="dm-shift-label">Day shift</span></div><div className="dm-completion"><strong>{completionRate}<span>%</span></strong><div><b>Request completion</b><small>{completed.length} of {tasks.length} requests complete</small></div></div><progress aria-label="Department request completion" max={Math.max(tasks.length,1)} value={completed.length}/><div className="dm-snapshot-details"><span>Team on duty<strong>{onDuty}</strong></span><span>Open requests<strong>{active.length}</strong></span></div><div className="dm-shift-actions"><button className="dm-secondary" onClick={() => openModal({kind:'handover'})}><Send size={16}/> Prepare handover <ArrowUpRight size={15}/></button></div></section>
        </div>

        <div className="dm-overview-grid dm-secondary-grid">
          <section className="dm-panel"><div className="dm-panel-heading"><div><div className="dm-section-title"><h2>Inspection queue</h2><span className="dm-count">{pending.length}</span></div><p>Quality checks and General Manager directives.</p></div><button className="dm-text-button" onClick={() => navigate('inspections')}>View all <ArrowUpRight size={15}/></button></div>{pending.slice(0,3).map(i => <article key={i.id} className="dm-attention-row dm-inspection-row"><span className="dm-attention-icon"><ClipboardCheck size={19}/></span><div><strong>{i.roomNumber} · {i.roomType}</strong><small>{i.assignedSupervisorName || 'Awaiting supervisor assignment'}</small></div><button className="dm-text-button" onClick={() => openModal({kind:'inspection',inspection:i})}>{i.assignedSupervisorId ? 'Manage' : 'Assign'} <ChevronRight size={15}/></button></article>)}{pending.length === 0 && <div className="dm-empty"><CheckCheck size={26}/><p>No inspections are waiting.</p></div>}</section>
          <DepartmentDesk summary onOpen={() => navigate('department')} onInspect={() => navigate('inspections')}/>
        </div>

        <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Active requests</h2><p>The latest work across {d.name.toLowerCase()}.</p></div><button className="dm-text-button" onClick={() => navigate('tasks')}>All requests <ArrowUpRight size={15}/></button></div>{taskRows(active.slice(0,5))}</section>
      </>}

      {tab === 'tasks' && <section className="dm-panel"><div className="dm-toolbar"><label className="dm-search"><Search size={16}/><input aria-label="Search department tasks" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search request, room or staff…"/></label><select aria-label="Filter task status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All requests</option><option value="open">Open requests</option><option value="complete">Completed requests</option></select></div>{taskRows(visibleTasks)}</section>}

      {tab === 'inspections' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Quality & inspection inbox</h2><p>Receive GM directives, assign your supervisors or create a department inspection.</p></div><button className="dm-primary" onClick={() => openModal({ kind: 'inspection' })}>Create inspection</button></div>{inspections.map(i => <article className="dm-record" key={i.id}><div className="dm-record-title"><h3>{i.roomNumber} · {i.roomType}</h3><span className={statusClass(i.status)}>{i.status}</span></div><p>{i.instructions || d.standard}</p><small>From {i.initiatedBy || 'Department supervisor'} · Assigned to {i.assignedSupervisorName || 'Unassigned'}</small>{i.status === 'pending' && <button className="dm-small-button" onClick={() => openModal({ kind: 'inspection', inspection: i })}>{i.assignedSupervisorId ? 'Reassign supervisor' : 'Assign supervisor'}</button>}</article>)}</section>}

      {tab === 'recovery' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Supervisor escalations & service recovery</h2><p>Record a resolution or send the case to the General Manager with context.</p></div></div>{taskRows(recovery)}</section>}

      {tab === 'staff' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Staff & workload</h2><p>Live assignments and availability within {d.name}.</p></div></div><div className="dm-staff-grid">{staff.map(member => { const load = active.filter(t => t.assigneeId === member.id || t.assignee === member.name).length; return <article key={member.id} className="dm-staff-card"><div className="dm-avatar">{member.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</div><h3>{member.name}</h3><small>{member.roleId.replaceAll('_', ' ')} · {member.shift}{member.status !== 'active' ? ' · Inactive account' : ''}</small><div className="dm-progress-label"><span>Active workload</span><strong>{load} / {member.maxWorkload || 5}</strong></div><progress value={load} max={Math.max(load, member.maxWorkload || 5)}/><label className="dm-field">Availability<select aria-label={`Availability for ${member.name}`} disabled={member.status !== 'active'} value={member.availability || 'on_duty'} onChange={e => departmentManagerCommand({ type: 'availability', staffId: member.id, value: e.target.value as 'on_duty' | 'break' | 'off_duty' })}><option value="on_duty">On duty</option><option value="break">On break</option><option value="off_duty">Off duty</option></select></label></article>; })}</div></section>}

      {tab === 'policies' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Department policies</h2><p>Service standards, procedures and escalation ownership.</p></div><button className="dm-primary" onClick={() => openModal({ kind: 'policy' })}>Add policy</button></div><article className="dm-record"><h3>Department quality standard</h3><p>{d.standard}</p><small>Owner: {person} · Escalation: General Manager</small></article>{policies.map(p => <article className="dm-record" key={p.id}><h3>{p.title}</h3><p>{p.content || p.summary}</p><small>{p.category} · {p.policyOwner} · Effective {p.effectiveDate}</small></article>)}</section>}

      {tab === 'handover' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Shift handover</h2><p>Carry forward department requests and priority actions.</p></div><button className="dm-primary" onClick={() => openModal({ kind: 'handover' })}>Prepare handover</button></div>{handovers.length === 0 && <p className="dm-empty">No handovers yet. Prepare the next shift’s briefing.</p>}{handovers.map(h => <article className="dm-record" key={h.id}><div className="dm-record-title"><h3>{h.outgoingManager} → {h.incomingManager}</h3><span className={statusClass(h.status)}>{h.status}</span></div><p>{h.notes}</p><small>{dateLabel(h.timestamp)} · {h.outstandingTasksCount} outstanding requests</small><ul>{h.priorityActions.map((p, index) => <li key={index}>{p}</li>)}</ul>{h.status === 'submitted' && h.incomingManager === person && h.outgoingManager !== person && <button className="dm-small-button" onClick={() => departmentManagerCommand({ type: 'acknowledge', handoverId: h.id })}>Acknowledge handover</button>}</article>)}</section>}

      {tab === 'analytics' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Department analytics & reports</h2><p>Reports include requests with recorded timestamps in the selected rolling period.</p></div><div className="dm-heading-actions"><select aria-label="Report period" value={period} onChange={e => setPeriod(e.target.value)}><option value="day">Day · 24 hours</option><option value="week">Week · 7 days</option><option value="month">Month · 30 days</option></select><button className="dm-secondary" onClick={exportReport}><Download size={15}/> Export CSV</button></div></div><div className="dm-report-bars">{[['Recorded requests', reportTasks.length], ['Open requests', reportTasks.filter(t => isOpen(t.status)).length], ['Completed requests', reportTasks.filter(t => !isOpen(t.status)).length]].map(([label, value]) => <div key={label}><div className="dm-progress-label"><span>{label}</span><strong>{value}</strong></div><progress max={Math.max(reportTasks.length, 1)} value={Number(value)}/></div>)}</div><p className="dm-report-note">{tasks.filter(t => !Number.isFinite(Date.parse(t.createdAt || ''))).length} older sample requests have no recorded date and are excluded from period reports.</p>{taskRows(reportTasks)}</section>}

      {tab === 'notifications' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Your department notifications</h2><p>{unread} unread · {d.name}</p></div></div>{notifications.length === 0 && <div className="dm-empty"><Bell size={26}/><h3>You’re up to date</h3><p>Department updates will appear here.</p></div>}{notifications.map(n => <article className="dm-record" key={n.id}><div className="dm-record-title"><h3>{n.title}</h3><span className="dm-status">{n.read ? 'Read' : 'Unread'}</span></div><p>{n.message}</p><small>{dateLabel(n.timestamp)}</small>{!n.read && <button className="dm-text-button" onClick={() => departmentManagerCommand({ type: 'read', notificationId: n.id })}>Mark as read</button>}</article>)}</section>}

      {tab === 'profile' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Manager profile</h2><p>Your demo identity and department access.</p></div></div><form className="dm-profile-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); departmentManagerCommand({ type: 'profile', name: String(f.get('name')), phone: String(f.get('phone') || '') }); }}><label className="dm-field">Display name<input name="name" defaultValue={person} required maxLength={100}/></label><label className="dm-field">Phone<input name="phone" type="tel" defaultValue={profile?.phone || ''} maxLength={40}/></label><label className="dm-field">Demo email<input value={d.email} readOnly/></label><label className="dm-field">Department<input value={d.name} readOnly/></label><button className="dm-primary" type="submit">Save profile</button><p className="dm-report-note">Standalone demonstration · work is saved in this browser. Department access here is a demo of the intended permissions.</p></form></section>}
      <footer className="dm-footer">THE GRAND ADP <span>Thoughtful service. Connected teams.</span></footer>
    </main>
    <dialog ref={dialog} className="dm-dialog" onClose={() => setModal(null)} aria-labelledby="dm-dialog-title"><form onSubmit={submitModal} key={modal?.kind === 'inspection' ? modal.inspection?.id || 'new-inspection' : modal?.kind}><div className="dm-dialog-heading"><h2 id="dm-dialog-title">{modal?.kind === 'inspection' ? modal.inspection ? 'Assign inspection' : 'Create inspection' : modal?.kind === 'recovery' ? 'Review service recovery' : modal?.kind === 'policy' ? 'Add department policy' : 'Prepare shift handover'}</h2><button className="dm-icon-button" type="button" aria-label="Close dialog" onClick={closeModal}><X size={19}/></button></div><p className="dm-dialog-description">{d.name} · {person}</p>
      {modal?.kind === 'inspection' && <><label className="dm-field">Room or service location<input name="location" defaultValue={modal.inspection?.roomNumber || ''} required maxLength={100} placeholder={d.id === 'wellness' ? 'Treatment room 1' : 'Room 402 or service area'}/></label><label className="dm-field">Assign to department supervisor<select name="supervisor" defaultValue={modal.inspection?.assignedSupervisorId || ''} required><option value="" disabled>Select supervisor</option>{supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="dm-field">Inspection instructions<textarea name="instructions" defaultValue={modal.inspection?.instructions || d.standard} required maxLength={2000}/></label></>}
      {modal?.kind === 'recovery' && <><p className="dm-dialog-description">{modal.task.title}</p><label className="dm-field">Decision<select name="decision"><option value="resolve">Resolve and notify supervisor</option><option value="escalate">Escalate to General Manager</option></select></label><label className="dm-field">Recovery notes / reason<textarea name="note" required maxLength={2000} placeholder="Describe the action taken or the decision needed from the GM."/></label></>}
      {modal?.kind === 'policy' && <><label className="dm-field">Policy title<input name="title" required maxLength={150}/></label><label className="dm-field">Service standard / procedure<textarea name="content" required maxLength={2000}/></label></>}
      {modal?.kind === 'handover' && <><label className="dm-field">Incoming manager<input name="incoming" required maxLength={100} placeholder="Name of the receiving manager"/></label><label className="dm-field">Shift notes & follow-up<textarea name="notes" required maxLength={2000}/></label><p className="dm-dialog-description">{active.length} open requests and their priority actions will be included.</p></>}
      <div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="dm-primary">{modal?.kind === 'recovery' ? 'Save decision' : 'Save & continue'}</button></div></form></dialog>
  </div>;
}
