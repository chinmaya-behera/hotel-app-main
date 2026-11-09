'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Activity, ArrowUpRight, BarChart3, Bell, BookOpen, CalendarDays, CheckCheck, ChevronRight, ClipboardCheck, Gauge, Handshake, History, LockKeyhole, LogOut, Menu, MessageSquare, Moon, ShoppingBag, Wrench, Sun, UserRound, Users, X, type LucideIcon } from 'lucide-react';
import { TimePickerInput } from '@/components/ui/TimePickerInput';
import { displayTime } from '@/components/ui/TimePickerModal';
import { useDemo } from '@/lib/store';
import { departmentId, isOpen, managerDepartment, managerEscalations, managerInspections, managerTasks, type ManagerDepartmentId } from '@/lib/manager-domain';
import type { SupervisorInspection } from '@/types/demo';
import { DepartmentDesk, DESK_LABELS } from './DepartmentDesk';
import '../shared/warm-theme.css';
import './department-manager.css';
import { DepartmentComplaints, HotelRepairs, MedicalCases, managerDate, useManagerClock } from './ManagerCases';
import { DiningKitchenMenu, OrderingOverview } from './ManagerDining';
import { DepartmentAnalytics, type AnalyticsDestination } from './DepartmentAnalytics';
import { DepartmentRequests, DepartmentEscalations } from './DepartmentRequests';
import { DepartmentStaffing } from './DepartmentStaffing';
import { DepartmentRecordHistory } from './DepartmentRecordHistory';
import { ManagerNotifications } from './ManagerNotifications';
import { InspectionLauncher } from './InspectionLauncher';
import { managerComplaints, managerOrders, managerRepairs, medicalReminders } from '@/lib/manager-workflows';

const NAV = [
  ['department', 'Department desk', ClipboardCheck],
  ['overview', 'Overview', Gauge], ['complaints', 'Complaints', MessageSquare], ['repairs', 'Repairs', Wrench], ['orders', 'Ordering overview', ShoppingBag], ['tasks', 'Task Monitoring', Activity],
  ['inspections', 'Inspections', ClipboardCheck], ['recovery', 'Escalations & Recovery', Handshake],
  ['history', 'Record history', History], ['staff', 'Staff & Workload', Users], ['policies', 'Policies', BookOpen],
  ['analytics', 'Analytics', BarChart3],
  ['profile', 'Profile', UserRound],
] as const satisfies readonly (readonly [string, string, LucideIcon])[];
type Tab = typeof NAV[number][0];
type View = Tab | 'staff-workload' | AnalyticsDestination;

function isAvailableTab(tab: Tab, department: ManagerDepartmentId) {
  if (tab === 'repairs') return department === 'engineering';
  if (tab === 'orders') return department === 'food-beverages';
  if (tab === 'policies') return department !== 'wellness';
  return true;
}

const VIEW_DESCRIPTIONS: Partial<Record<Tab, string>> = {
  complaints: 'Track guest concerns, assign ownership and keep every response on record.',
  repairs: 'Coordinate hotel-wide repairs by trade, location and progress.',
  orders: 'Explore meal periods, cuisine demand and guest ratings.',
  tasks: 'Find department requests, review ownership and follow work through to completion.',
  inspections: 'Launch quality checks, delegate to a supervisor and review inspection progress.',
  recovery: 'Acknowledge, reject or route cases to another manager with context.',
  history: 'A clear record of completed work and updates. Open any record for its full history.',
  staff: 'Plan the week, check coverage and balance work across your team.',
  policies: 'Keep department procedures, service standards and escalation ownership in one place.',
  analytics: 'Track department service performance and see what needs attention now.',
  profile: 'Manage your display details and review your department access.',
};
type Modal = { kind: 'inspection'; inspection?: SupervisorInspection } | { kind: 'policy' } | null;
const statusClass = (status: string) => /resolved|completed|passed|acknowledged/i.test(status) ? 'dm-status good' : /escalat|blocked|reopened/i.test(status) ? 'dm-status urgent' : 'dm-status';

function PolicyTime({ label, name }: { label: string; name: string }) {
  const [time, setTime] = useState('');
  return <div className="dm-field"><span>{label}</span><TimePickerInput label={label} value={time} onChange={setTime}/>
    <input type="hidden" name={name} value={time}/>
  </div>;
}
export function DepartmentManagerConsole() {
  const { state, hydrated, setTheme, departmentManagerCommand } = useDemo();
  const d = managerDepartment(state.managerDepartment), profile = state.managerProfiles?.[d.id];
  const person = profile?.name || d.person;
  const now = useManagerClock();
  const reminders = d.id === 'wellness' ? medicalReminders(state, now) : [];
  const complaints = managerComplaints(state, d.id);
  const [view, setView] = useState<View>('overview');
  const tab = view === 'staff-workload' ? 'staff' : view === 'overdue-tasks' ? 'tasks' : view === 'live-orders' ? 'orders' : view;
  const [historySearch, setHistorySearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const navigationClose = useRef<HTMLButtonElement>(null);
  const showView = useCallback((next: View, reference = '') => {
    setView(next);
    setHistorySearch(reference);
    setSidebarOpen(false);
    dialog.current?.close();
    setModal(null);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const workspacePath = window.location.pathname;
    const restoreView = () => {
      if (window.location.pathname !== workspacePath) return;
      const requested = new URLSearchParams(window.location.search).get('view');
      const next = requested === 'staff-workload' || requested === 'overdue-tasks' || requested === 'live-orders' && d.id === 'food-beverages'
        ? requested
        : NAV.find(([id]) => id === requested && isAvailableTab(id, d.id))?.[0] ?? 'overview';
      const reference = window.history.state?.managerHistorySearch;
      showView(next, next === 'history' && typeof reference === 'string' ? reference : '');
    };
    restoreView();
    window.addEventListener('popstate', restoreView);
    return () => window.removeEventListener('popstate', restoreView);
  }, [hydrated, d.id, showView]);

  useEffect(() => {
    if (!sidebarOpen) return;
    navigationClose.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); navigationTrigger.current?.focus(); };
  }, [sidebarOpen]);
  const tasks = managerTasks(state, d.id).filter(task => !task.managerEscalation && !/^(ESC|REC)-/.test(task.ref || '')), active = tasks.filter(t => isOpen(t.status));
  const inspections = managerInspections(state, d.id);
  const staff = state.staffAccounts.filter(s => departmentId(s.department) === d.id && s.roleId !== 'department_manager');
  const supervisors = staff.filter(s => ['department_supervisor', 'department_dispatcher_supervisor'].includes(s.roleId) && s.status === 'active');
  const recovery = managerEscalations(state, d.id, 'to').filter(task => (task.managerEscalation?.status || 'Pending') === 'Pending');
  const policies = (state.departmentPolicies ?? []).filter(p => departmentId(p.department) === d.id);
  const pending = inspections.filter(i => i.status === 'pending');
  const completed = tasks.filter(t => !isOpen(t.status));
  const navigate = (next: View, reference = '') => {
    if (next !== view || reference !== historySearch) {
      const url = new URL(window.location.href);
      if (next === 'overview') url.searchParams.delete('view');
      else url.searchParams.set('view', next);
      window.history.pushState(reference ? { managerHistorySearch: reference } : null, '', url);
    }
    showView(next, reference);
    if (tab !== 'staff' || (next !== 'staff' && next !== 'staff-workload')) {
      window.scrollTo(0, 0);
    }
  };
  const openModal = (next: NonNullable<Modal>) => { setModal(next); dialog.current?.showModal(); };
  const closeModal = () => { dialog.current?.close(); setModal(null); };
  const title = tab === 'department' ? DESK_LABELS[d.id] : NAV.find(n => n[0] === tab)?.[1];
  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget), text = (key: string) => String(form.get(key) || '').trim();
    if (!modal) return;
    const command = modal.kind === 'inspection'
      ? { type: 'inspection' as const, location: text('location'), instructions: text('instructions'), supervisorId: text('supervisor'), inspectionId: modal.inspection?.id }
      : { type: 'policy' as const, title: text('title'), content: text('content'), opensAt: text('opensAt'), closesAt: text('closesAt'), quietStart: text('quietStart'), quietEnd: text('quietEnd'), slaMinutes: Number(text('slaMinutes')) || undefined };
    if (departmentManagerCommand(command)) closeModal();
  };

  const navigation = [NAV.find(n => n[0] === 'overview')!, ...NAV.filter(([id]) => id !== 'overview' && isAvailableTab(id, d.id))];
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
    <a className="dm-skip-link" href="#manager-content">Skip to workspace</a>
    {sidebarOpen && <button className="dm-nav-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}
    <aside className="dm-sidebar" id="manager-navigation">
      <div className="dm-sidebar-brand"><span className="dm-monogram">G</span><div><strong>THE GRAND ADP</strong><small>Manager workspace</small></div><button ref={navigationClose} className="dm-mobile-close dm-icon-button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="dm-department-label"><span className="dm-department-icon"><LockKeyhole size={17}/></span><div><small>Your department</small><strong>{d.name}</strong></div></div>
      <nav aria-label="Department manager navigation">
        {navigation.map(([id, label, Icon]) => {
          const displayLabel = id === 'department' ? DESK_LABELS[d.id] : label;
          const badge = id === 'recovery' ? recovery.length : id === 'complaints' ? complaints.filter(c => isOpen(c.status)).length : id === 'department' ? reminders.length : 0;
          return <Fragment key={id}>
            {['overview', 'staff', 'profile'].includes(id) && <p className="dm-nav-group-label">{id === 'overview' ? 'Workspace' : id === 'staff' ? 'Management' : 'Personal'}</p>}
            <button aria-label={badge > 0 ? `${displayLabel} ${badge}` : displayLabel} aria-current={tab === id ? 'page' : undefined} title={displayLabel} onClick={() => navigate(id)}><Icon size={19}/><span>{displayLabel}</span>{badge > 0 && <b>{badge}</b>}</button>
          </Fragment>;
        })}
      </nav>
      <div className="dm-sidebar-footer"><button className="dm-user-button" onClick={() => navigate('profile')} aria-label="Open manager profile"><span className="dm-avatar">{person.split(' ').map(p => p[0]).slice(0, 2).join('')}</span><span><strong>{person}</strong><small>Department Manager</small></span></button><a href="/login" aria-label="Change demo account" title="Change demo account"><LogOut size={18}/></a></div>
    </aside>

    <main className="dm-main" id="manager-content" tabIndex={-1} inert={sidebarOpen}>
      <header className="dm-topline"><div className="dm-breadcrumb"><button ref={navigationTrigger} className="dm-menu-toggle dm-icon-button" aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="manager-navigation" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><span>{d.name}</span><ChevronRight size={14}/><strong>{title === 'Overview' ? 'Overview' : title}</strong></div><div className="dm-topline-tools"><span className="dm-live"><i/> Department access</span><button className="dm-icon-button" aria-label={state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title={state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} onClick={() => setTheme(state.theme === 'light' ? 'dark' : 'light')}>{state.theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button><ManagerNotifications key={view} reminders={reminders} onOpenMedicalCases={() => navigate('department')}/><button className="dm-avatar" aria-label="View your profile" onClick={() => navigate('profile')}>{person.split(' ').map(p => p[0]).slice(0, 2).join('')}</button></div></header>

      <div className="dm-page-heading"><div><p className="dm-eyebrow">DEPARTMENT OPERATIONS</p><h1>{title === 'Overview' ? `${d.name} overview` : title}</h1><p>{VIEW_DESCRIPTIONS[tab] || d.focus}</p></div><div className="dm-heading-actions">{tab === 'overview' ? <InspectionLauncher/> : <span className="dm-date"><CalendarDays size={16}/>{new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>}</div></div>

      {tab === 'department' && (d.id === 'wellness' ? <><MedicalCases now={now}/><DepartmentDesk onOpen={() => navigate('department')} onInspect={() => navigate('inspections')}/></> : d.id === 'food-beverages' ? <DiningKitchenMenu/> : <DepartmentDesk onOpen={() => navigate('department')} onInspect={() => navigate('inspections')}/>)}
      {tab === 'history' && <DepartmentRecordHistory key={historySearch} initialSearch={historySearch}/>}
      {tab === 'complaints' && <DepartmentComplaints/>}
      {tab === 'repairs' && d.id === 'engineering' && <HotelRepairs/>}
      {tab === 'orders' && d.id === 'food-beverages' && <OrderingOverview key={view} activeLive={view === 'live-orders'}/>}

      {tab === 'overview' && <>
        <div className="dm-overview-meta"><span><CalendarDays size={15}/>{new Date().toLocaleDateString('en-IN', {weekday:'long',day:'numeric',month:'long'})}</span><span><LockKeyhole size={14}/>{d.name} only</span></div>
        <div className="dm-kpis">{kpis.map(k => <button key={k.label} className="dm-kpi" onClick={() => navigate(k.next)}><span className="dm-kpi-label">{k.label}<span className="dm-kpi-icon"><k.icon size={19}/></span></span><strong>{k.value}</strong><span className="dm-kpi-bottom"><small>{k.detail}</small><ArrowUpRight size={15}/></span></button>)}</div>

        <div className="dm-workflow-links"><button onClick={() => navigate('complaints')}><MessageSquare size={17}/><span>Resolve complaints</span><strong>{complaints.filter(c => isOpen(c.status)).length}</strong><ChevronRight size={15}/></button>{d.id === 'engineering' && <button onClick={() => navigate('repairs')}><Wrench size={17}/><span>Hotel-wide repairs</span><strong>{managerRepairs(state).filter(t => isOpen(t.status)).length}</strong><ChevronRight size={15}/></button>}{d.id === 'food-beverages' && <button onClick={() => navigate('orders')}><ShoppingBag size={17}/><span>Recorded dining orders</span><strong>{managerOrders(state).length}</strong><ChevronRight size={15}/></button>}{d.id === 'wellness' && <button onClick={() => navigate('department')}><Bell size={17}/><span>Medical follow-ups due</span><strong>{reminders.length}</strong><ChevronRight size={15}/></button>}</div><div className="dm-overview-grid">
          <section className="dm-panel dm-priority-panel"><div className="dm-panel-heading"><div><div className="dm-section-title"><h2>Attention required</h2><span className="dm-count">{recovery.length}</span></div><p>Supervisor escalations waiting for a decision.</p></div><button className="dm-text-button" onClick={() => navigate('recovery')}>View all <ArrowUpRight size={15}/></button></div>
            {recovery.slice(0, 3).map(t => <article key={t.id} className="dm-attention-row"><span className="dm-attention-icon"><Handshake size={19}/></span><div><strong>{t.title}</strong><small>{t.meta}</small><span className="dm-status urgent">Needs review</span></div><button className="dm-small-button" onClick={() => navigate('recovery')}>Open escalations <ChevronRight size={14}/></button></article>)}
            {recovery.length === 0 && <div className="dm-empty"><CheckCheck size={28}/><h3>Everything is in hand</h3><p>No escalations need your review.</p></div>}
            <div className="dm-panel-footnote"><LockKeyhole size={13}/><span>Cases are limited to your department.</span></div>
          </section>

          <section className="dm-panel dm-shift-card"><div className="dm-section-title"><h2>Shift snapshot</h2><span className="dm-shift-label">Day shift</span></div><div className="dm-completion"><strong>{completionRate}<span>%</span></strong><div><b>Request completion</b><small>{completed.length} of {tasks.length} requests complete</small></div></div><progress aria-label="Department request completion" max={Math.max(tasks.length,1)} value={completed.length}/><div className="dm-snapshot-details"><span>Team on duty<strong>{onDuty}</strong></span><span>Open requests<strong>{active.length}</strong></span></div></section>
        </div>

        <div className="dm-overview-grid dm-secondary-grid">
          <section className="dm-panel"><div className="dm-panel-heading"><div><div className="dm-section-title"><h2>Inspection queue</h2><span className="dm-count">{pending.length}</span></div><p>Quality checks and General Manager directives.</p></div><button className="dm-text-button" onClick={() => navigate('inspections')}>View all <ArrowUpRight size={15}/></button></div>{pending.slice(0,3).map(i => <article key={i.id} className="dm-attention-row dm-inspection-row"><span className="dm-attention-icon"><ClipboardCheck size={19}/></span><div><strong>{i.roomNumber} · {i.roomType}</strong><small>{i.assignedSupervisorName || 'Awaiting supervisor assignment'}</small></div><button className="dm-text-button" onClick={() => openModal({kind:'inspection',inspection:i})}>{i.assignedSupervisorId ? 'Manage' : 'Assign'} <ChevronRight size={15}/></button></article>)}{pending.length === 0 && <div className="dm-empty"><CheckCheck size={26}/><p>No inspections are waiting.</p></div>}</section>
          <DepartmentDesk summary onOpen={() => navigate('department')} onInspect={() => navigate('inspections')}/>
        </div>

        <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Active requests</h2><p>The latest work across {d.name.toLowerCase()}.</p></div><button className="dm-text-button" onClick={() => navigate('tasks')}>All requests <ArrowUpRight size={15}/></button></div><DepartmentRequests compact tasks={active.slice(0, 5)} now={now} onHistory={reference => navigate('history', reference)}/></section>
      </>}


      {tab === 'tasks' && <section className="dm-panel"><DepartmentRequests key={view} tasks={tasks} now={now} showOverdue={view === 'overdue-tasks'} onHistory={reference => navigate('history', reference)}/></section>}

      {tab === 'inspections' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Quality & inspection inbox</h2><p>Receive GM directives, assign your supervisors or create a department inspection.</p></div><InspectionLauncher/></div>{inspections.map(i => <article className="dm-record" key={i.id}><div className="dm-record-title"><div><small className="dm-reference">{i.ref || i.id}</small><h3>{i.roomNumber} · {i.roomType}</h3></div><span className={statusClass(i.status)}>{i.status}</span></div><p>{i.typeLabel || i.type.replaceAll('_', ' ')}{i.scope ? ` · ${(i.scope === 'all' || i.scope === 'all_rooms') ? 'Hotel-wide sweep' : i.scope === 'floor' ? 'Floor sweep' : 'Single location'}` : ''}</p><p>{i.instructions || d.standard}</p>{i.scheduledAt && <p>Scheduled {managerDate(i.scheduledAt)}</p>}<small>From {i.initiatedBy || 'Department supervisor'} · Assigned to {i.assignedSupervisorName || 'Unassigned'}</small>{i.status === 'pending' && <button className="dm-small-button" onClick={() => openModal({ kind: 'inspection', inspection: i })}>{i.assignedSupervisorId ? 'Reassign supervisor' : 'Assign supervisor'}</button>}</article>)}</section>}

      {tab === 'recovery' && <DepartmentEscalations now={now}/>}

      {tab === 'staff' && (
        <DepartmentStaffing
          view={view === 'staff-workload' ? 'workload' : 'schedule'}
          onViewChange={next => navigate(next === 'workload' ? 'staff-workload' : 'staff')}
        />
      )}

      {tab === 'policies' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Department policies</h2><p>Service standards, procedures and escalation ownership.</p></div><button className="dm-primary" onClick={() => openModal({ kind: 'policy' })}>Add policy</button></div><article className="dm-record"><h3>Department quality standard</h3><p>{d.standard}</p><small>Owner: {person} · Escalation: General Manager</small></article>{policies.map(p => <article className="dm-record" key={p.id}><h3>{p.title}</h3><p>{p.content || p.summary}</p>
      {p.operatingWindow && <p>Operating window · {displayTime(p.operatingWindow.start)}–{displayTime(p.operatingWindow.end)}</p>}
      {p.quietHours && <p>Quiet hours · {displayTime(p.quietHours.start)}–{displayTime(p.quietHours.end)}</p>}
      {p.slaMinutes && <p>SLA target · {p.slaMinutes} minutes</p>}
      <small>{p.category} · {p.policyOwner} · Effective {p.effectiveDate}</small></article>)}</section>}


      {tab === 'analytics' && <DepartmentAnalytics tasks={tasks} now={now} onOpen={navigate}/>}


      {tab === 'profile' && <section className="dm-panel"><div className="dm-panel-heading"><div><h2>Manager profile</h2><p>Your demo identity and department access.</p></div></div><form className="dm-profile-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); departmentManagerCommand({ type: 'profile', name: String(f.get('name')), phone: String(f.get('phone') || '') }); }}><label className="dm-field">Display name<input name="name" defaultValue={person} required maxLength={100}/></label><label className="dm-field">Phone<input name="phone" type="tel" defaultValue={profile?.phone || ''} maxLength={40}/></label><label className="dm-field">Demo email<input value={d.email} readOnly/></label><label className="dm-field">Department<input value={d.name} readOnly/></label><button className="dm-primary" type="submit">Save profile</button><p className="dm-report-note">Standalone demonstration · work is saved in this browser. Department access here is a demo of the intended permissions.</p></form></section>}
      <footer className="dm-footer">THE GRAND ADP <span>Thoughtful service. Connected teams.</span></footer>
    </main>
    <dialog ref={dialog} className="dm-dialog" onClose={() => setModal(null)} aria-labelledby="dm-dialog-title"><form onSubmit={submitModal} key={modal?.kind === 'inspection' ? modal.inspection?.id || 'new-inspection' : modal?.kind}><div className="dm-dialog-heading"><h2 id="dm-dialog-title">{modal?.kind === 'inspection' ? modal.inspection ? 'Assign inspection' : 'Create inspection' : 'Add department policy'}</h2><button className="dm-icon-button" type="button" aria-label="Close dialog" onClick={closeModal}><X size={19}/></button></div><p className="dm-dialog-description">{d.name} · {person}</p>
      {modal?.kind === 'inspection' && <><label className="dm-field">Room or service location<input name="location" defaultValue={modal.inspection?.roomNumber || ''} required maxLength={100} placeholder={d.id === 'wellness' ? 'Treatment room 1' : 'Room 402 or service area'}/></label><label className="dm-field">Assign to department supervisor<select name="supervisor" defaultValue={modal.inspection?.assignedSupervisorId || ''} required><option value="" disabled>Select supervisor</option>{supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="dm-field">Inspection instructions<textarea name="instructions" defaultValue={modal.inspection?.instructions || d.standard} required maxLength={2000}/></label></>}
      {modal?.kind === 'policy' && <><label className="dm-field">Policy title<input name="title" required maxLength={150}/></label><label className="dm-field">Service standard / procedure<textarea name="content" required maxLength={2000}/></label>
        <div className="dm-form-grid"><PolicyTime label="Operating window start" name="opensAt"/><PolicyTime label="Operating window end" name="closesAt"/>
          <PolicyTime label="Quiet hours start" name="quietStart"/><PolicyTime label="Quiet hours end" name="quietEnd"/>
        </div>
        <label className="dm-field">SLA target (minutes)<input type="number" name="slaMinutes" min="1" max="10080"/></label>
      </>}
      <div className="dm-dialog-actions"><button type="button" className="dm-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="dm-primary">Save &amp; continue</button></div></form></dialog>
  </div>;
}
