'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  Download,
  Gauge,
  Handshake,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Send,
  UserRound,
  Users,
  X,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Radio,
  PhoneCall,
  Volume2,
  VolumeX,
  Camera,
  Eye,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, ShiftHandover } from '@/types/demo';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { SecurityIncidentDetailModal } from './SecurityIncidentDetailModal';
import { SecurityLogIncidentModal } from './SecurityLogIncidentModal';
import { playSecurityChime, playPanicSiren } from './securityChime';
import '../../shared/warm-theme.css';
import '../../manager/department-manager.css';

const NAV = [
  ['overview', 'Overview', Gauge, 'Workspace'],
  ['incidents', 'Incident Monitoring', Activity, 'Workspace'],
  ['recovery', 'Escalations & Recovery', Handshake, 'Workspace'],
  ['policies', 'PlayBook', BookOpen, 'Management'],
  ['handover', 'Shift Handover', Send, 'Management'],
  ['notifications', 'Notifications', Bell, 'Personal'],
  ['profile', 'Profile', UserRound, 'Personal'],
] as const satisfies readonly (readonly [string, string, LucideIcon, string])[];

type Tab = typeof NAV[number][0];
type Modal =
  | { kind: 'inspection'; id?: string; sector?: string }
  | { kind: 'recovery'; task: WorkItem }
  | { kind: 'policy' }
  | { kind: 'handover' }
  | null;

const dateLabel = (value?: string) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const statusClass = (status: string) =>
  /resolved|completed|passed|acknowledged/i.test(status)
    ? 'dm-status good'
    : /critical|escalat|blocked|reopened|high/i.test(status)
      ? 'dm-status urgent'
      : 'dm-status';

const getPriorityWeight = (priority?: string) => {
  const p = (priority || 'normal').toLowerCase();
  if (p === 'critical' || p === 'safety') return 0;
  if (p === 'urgent' || p === 'high') return 1;
  return 2;
};

const customLoggedPhotos: Record<string, string> = {};

const getIncidentPhoto = (item: WorkItem) => {
  if (customLoggedPhotos[item.id]) return customLoggedPhotos[item.id];
  if (item.incidentPhotoUrl) return item.incidentPhotoUrl;
  if (item.photoUrl) return item.photoUrl;
  if (item.securityReport?.photoUrl) return item.securityReport.photoUrl;
  if (item.id === 'sec-1') return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80';
  if (item.id === 'sec-2') return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';
  if (item.id === 'sec-3') return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=1200&q=80';
  if (item.id === 'sec-4') return 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1200&q=80';
  if (item.id === 'sec-5') return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';
  return null;
};

export function SecurityApp() {
  const {
    state,
    hydrated,
    setTheme,
    setPersona,
    setSoundEnabled,
    acknowledgeSecurityItem,
    arriveSecurityItem,
    resolveSecurityItem,
    requestSecurityBackup,
    escalateSecurityItem,
    addSecurityNote,
    createSecurityIncident,
    departmentManagerCommand,
  } = useDemo();

  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [period, setPeriod] = useState('week');
  const [modal, setModal] = useState<Modal>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<WorkItem | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Security shift handovers fallback local state if none in store
  const [localHandovers, setLocalHandovers] = useState<ShiftHandover[]>([
    {
      id: 'sec-ho-1',
      shift: 'Night',
      scope: 'My Department',
      department: 'Safety & Security',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      outgoingManager: 'Officer T. Chen (Evening)',
      incomingManager: 'Inspector Roy (Night)',
      notes:
        'Gate 3 magnetic latch recalibrated by Engineering. Suite 402 guest reported mild hallway foot traffic; quiet hours advisory active. Perimeter camera 4 cleared.',
      outstandingTasksCount: 3,
      unresolvedComplaintsCount: 0,
      criticalIncidentsCount: 1,
      priorityActions: [
        'Monitor Pool Deck quiet hours after 23:00',
        'Verify Executive Suite 509 smoke detector replacement ticket',
        'Hourly sweep of Basement Service Corridor B',
      ],
      status: 'submitted',
    },
  ]);

  const dialog = useRef<HTMLDialogElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const navigationClose = useRef<HTMLButtonElement>(null);
  const prevCountRef = useRef<number | null>(null);

  // Set persona on mount
  useEffect(() => {
    setPersona('security_responder');
  }, [setPersona]);

  // Initialize Lenis smooth scroll
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Pause Lenis smooth scroll whenever an interactive modal dialog is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedIncident || showLogModal || modal);

    if (isAnyModalOpen) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [selectedIncident, showLogModal, modal]);

  // GSAP Text & UI entrance animations
  useEffect(() => {
    // 1. Hero text stagger
    gsap.fromTo(
      '.gsap-hero-title',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.gsap-hero-sub',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.55, delay: 0.08, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.gsap-meta',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.14, ease: 'power2.out' }
    );

    // 2. KPI metrics entrance & numbers
    gsap.fromTo(
      '.dm-kpi',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.16, ease: 'power2.out', clearProps: 'transform' }
    );
    gsap.fromTo(
      '.gsap-kpi-num',
      { opacity: 0, scale: 0.94 },
      { opacity: 1, scale: 1, duration: 0.45, stagger: 0.06, delay: 0.22, ease: 'back.out(1.5)', clearProps: 'transform' }
    );

    // 3. Grid panels entrance
    gsap.fromTo(
      '.gsap-panel',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.24, ease: 'power2.out', clearProps: 'transform' }
    );

    // 4. Section headings
    gsap.fromTo(
      '.gsap-section-title',
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.5, delay: 0.3, ease: 'power2.out' }
    );
  }, [tab]);
  // Audio siren trigger when critical or new incident arrives
  const isSoundOn = state.soundEnabled ?? true;
  const items = state.items.security_responder ?? [];

  // Sort incidents by priority: Critical (0) -> Urgent (1) -> Normal (2)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => getPriorityWeight(a.priority) - getPriorityWeight(b.priority));
  }, [items]);

  useEffect(() => {
    if (prevCountRef.current !== null && items.length > prevCountRef.current) {
      if (isSoundOn) {
        const latest = items[0];
        if (latest?.priority === 'critical') {
          playPanicSiren();
        } else {
          playSecurityChime();
        }
      }
    }
    prevCountRef.current = items.length;
  }, [items, isSoundOn]);

  useEffect(() => {
    if (!sidebarOpen) return;
    navigationClose.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      navigationTrigger.current?.focus();
    };
  }, [sidebarOpen]);

  // Calculations
  const activeIncidents = items.filter((i) => i.status !== 'Resolved');
  const criticalItems = items.filter(
    (i) => (i.priority === 'critical' || i.status === 'New') && i.status !== 'Resolved',
  );
  const recoveryItems = items.filter((t) => /escalat|blocked/i.test(t.status));

  // Security staff accounts
  const securityStaff = state.staffAccounts.filter(
    (s) =>
      s.department === 'Safety & Security' ||
      s.roleId === 'security_responder' ||
      ['Inspector Roy', 'Officer Chen', 'Officer Marcus', 'Officer Sarah'].some((n) => s.name.includes(n)),
  );
  const onDutyCount = Math.max(
    4,
    securityStaff.filter((s) => s.availability === 'on_duty' || s.status === 'active').length,
  );

  const navigate = (next: Tab) => {
    setTab(next);
    setSearch('');
    setStatusFilter('all');
    setSidebarOpen(false);
  };

  const openModal = (next: NonNullable<Modal>) => {
    setModal(next);
    dialog.current?.showModal();
  };

  const closeModal = () => {
    dialog.current?.close();
    setModal(null);
  };

  const title = NAV.find((n) => n[0] === tab)?.[1] || 'Overview';

  const visibleIncidents = useMemo(() => {
    return sortedItems.filter((t) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'open'
            ? t.status !== 'Resolved'
            : t.status === 'Resolved';
      const matchesSearch = `${t.title} ${t.ref || ''} ${t.room || ''} ${t.assignee || ''} ${t.priority || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [sortedItems, statusFilter, search]);

  const exportReport = () => {
    const rows = [
      ['ID', 'Title', 'Location', 'Priority', 'Status', 'Assignee'],
      ...items.map((t) => [
        `"${t.id}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.room || '').replace(/"/g, '""')}"`,
        `"${t.priority}"`,
        `"${t.status}"`,
        `"${(t.assignee || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-incident-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || '').trim();

    if (modal?.kind === 'handover') {
      const newHo: ShiftHandover = {
        id: `sec-ho-${Date.now()}`,
        shift: 'Night',
        scope: 'My Department',
        department: 'Safety & Security',
        timestamp: new Date().toISOString(),
        outgoingManager: 'Inspector Roy (Night)',
        incomingManager: text('incoming') || 'Officer Morning Lead',
        notes: text('notes'),
        outstandingTasksCount: activeIncidents.length,
        unresolvedComplaintsCount: 0,
        criticalIncidentsCount: criticalItems.length,
        priorityActions: [
          'Verify fire suppression panels after overnight test',
          'Coordinate pool deck towel station access unlocks',
          'Review VIP arrivals briefing at front desk',
        ],
        status: 'submitted',
      };
      setLocalHandovers((prev) => [newHo, ...prev]);
    } else if (modal?.kind === 'recovery' && modal.task) {
      const decision = text('decision');
      const note = text('note');
      if (decision === 'resolve') {
        resolveSecurityItem(modal.task.id, {
          summary: 'Escalation resolved by Security Lead',
          observations: note,
          actionsTaken: 'Direct intervention completed & logged.',
          outcome: 'Case closed on night shift.',
        });
      } else {
        escalateSecurityItem(modal.task.id, note, 'Forwarded to General Manager for formal review.');
      }
    }
    closeModal();
  };

  const kpis = [
    {
      label: 'Active incidents',
      value: items.length || 5,
      detail: 'Across property',
      icon: Activity,
      next: 'incidents' as Tab,
    },
    {
      label: 'Critical alerts',
      value: criticalItems.length || 3,
      detail: 'Immediate response required',
      icon: ShieldAlert,
      next: 'notifications' as Tab,
    },
    {
      label: 'Open escalations',
      value: recoveryItems.length || 3,
      detail: 'Ready for your review',
      icon: Handshake,
      next: 'recovery' as Tab,
    },
    {
      label: 'Officers on duty',
      value: 4,
      detail: 'Night patrol active',
      icon: Users,
      next: 'staff' as Tab,
    },
  ];

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="dm-workspace" data-sidebar-open={sidebarOpen}>
      {sidebarOpen && (
        <button
          className="dm-nav-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---------------- LEFT SIDEBAR (WORKSPACE) ---------------- */}
      <aside className="dm-sidebar" id="security-navigation">
        <div className="dm-sidebar-brand">
          <span className="dm-monogram">H</span>
          <div>
            <strong>THE GRAND ADP</strong>
            <small>Security Workspace</small>
          </div>
          <button
            ref={navigationClose}
            className="dm-mobile-close dm-icon-button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="dm-department-label">
          <span className="dm-department-icon">
            <LockKeyhole size={17} />
          </span>
          <div>
            <small>Your department</small>
            <strong>Safety &amp; Security</strong>
          </div>
        </div>

        <nav aria-label="Security operations navigation">
          {NAV.map(([id, labelText, Icon, group], index) => {
            const prevGroup = index > 0 ? NAV[index - 1][3] : null;
            const showGroupHeader = group !== prevGroup;
            const badge =
              id === 'notifications'
                ? criticalItems.length
                : id === 'recovery'
                  ? recoveryItems.length || 3
                  : id === 'incidents'
                    ? activeIncidents.length
                    : 0;

            return (
              <Fragment key={id}>
                {showGroupHeader && <p className="dm-nav-group-label">{group}</p>}
                <button
                  aria-label={badge > 0 ? `${labelText} ${badge}` : labelText}
                  aria-current={tab === id ? 'page' : undefined}
                  title={labelText}
                  onClick={() => navigate(id)}
                >
                  <Icon size={18} />
                  <span>{labelText}</span>
                  {badge > 0 && <b>{badge}</b>}
                </button>
              </Fragment>
            );
          })}
        </nav>

        <div className="dm-sidebar-footer">
          <button
            className="dm-user-button"
            onClick={() => navigate('profile')}
            aria-label="Open officer profile"
          >
            <span className="dm-avatar">IR</span>
            <span>
              <strong>Inspector Roy</strong>
              <small>Safety &amp; Security Lead</small>
            </span>
          </button>
          <Link href="/staff" aria-label="Switch staff role" title="Switch staff role">
            <LogOut size={18} />
          </Link>
        </div>
      </aside>

      {/* ---------------- MAIN OPERATING CONSOLE ---------------- */}
      <main className="dm-main" inert={sidebarOpen ? true : undefined}>
        {/* Top Breadcrumb & Status Bar */}
        <header className="dm-topline">
          <div className="dm-breadcrumb">
            <button
              ref={navigationTrigger}
              className="dm-menu-toggle dm-icon-button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              aria-controls="security-navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>Safety &amp; Security</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>

          <div className="dm-topline-tools">
            <span className="dm-live">
              <i /> Department access
            </span>

            {/* Sound toggle button */}
            <button
              className="dm-icon-button"
              aria-label={isSoundOn ? 'Mute alert siren' : 'Enable alert siren'}
              title={isSoundOn ? 'Siren audible' : 'Siren muted'}
              onClick={() => setSoundEnabled(!isSoundOn)}
            >
              {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Theme switcher */}
            <button
              className="dm-icon-button"
              aria-label={state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              title={state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              onClick={() => setTheme(state.theme === 'light' ? 'dark' : 'light')}
            >
              {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notifications */}
            <button
              className="dm-icon-button"
              aria-label={`Notifications, ${criticalItems.length} alerts`}
              onClick={() => navigate('notifications')}
            >
              <Bell size={19} />
              {criticalItems.length > 0 && <b>{criticalItems.length}</b>}
            </button>

            {/* Profile Avatar */}
            <button
              className="dm-avatar"
              aria-label="View security officer profile"
              onClick={() => navigate('profile')}
            >
              IR
            </button>
          </div>
        </header>

        {/* Page Hero Header */}
        <div className="dm-page-heading">
          <div>
            <p className="dm-eyebrow">DEPARTMENT OPERATIONS</p>
            <h1 className="gsap-hero-title">{tab === 'overview' ? 'Safety & Security overview' : title}</h1>
            <p className="gsap-hero-sub">Rapid emergency response, patrol coverage, and guest safety facilities</p>
          </div>

          <div className="dm-heading-actions">
            {tab === 'overview' ? (
              <button className="dm-primary" onClick={() => setShowLogModal(true)}>
                <ClipboardCheck size={17} /> + Log incident
              </button>
            ) : (
              <span className="dm-date">
                <CalendarDays size={16} />
                {currentDateFormatted}
              </span>
            )}
          </div>
        </div>

        {/* ===================== TAB: OVERVIEW ===================== */}
        {tab === 'overview' && (
          <>
            {/* Meta Row: Date & Department Security Lock */}
            <div className="dm-overview-meta gsap-meta">
              <span>
                <CalendarDays size={15} />
                {currentDateFormatted}
              </span>
              <span>
                <LockKeyhole size={15} />
                Safety &amp; Security only
              </span>
            </div>

            {/* 4 Top KPI Cards in Luxury Card Boxes */}
            <div className="dm-kpis">
              {kpis.map((k) => (
                <button
                  key={k.label}
                  className="dm-kpi cursor-pointer"
                  onClick={() => navigate(k.next)}
                >
                  <span className="dm-kpi-label">{k.label}</span>
                  <strong className="gsap-kpi-num">{k.value}</strong>
                  <span className="dm-kpi-bottom">
                    <small>{k.detail}</small>
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              ))}
            </div>

            {/* Middle Grid: Left 8 cols, Right 4 cols */}
            <div className="dm-overview-grid">
              {/* Left Column */}
              <div className="dm-grid-stack">
                {/* 1. Attention Required Panel */}
                <section className="dm-panel dm-priority-panel gsap-panel">
                  <div className="dm-panel-heading">
                    <div>
                      <div className="dm-section-title">
                        <h2 className="gsap-section-title">Attention required</h2>
                        <span className="dm-count">{Math.max(3, criticalItems.length)}</span>
                      </div>
                      <p>Supervisor escalations waiting for a decision.</p>
                    </div>
                    <button className="dm-text-button" onClick={() => navigate('incidents')}>
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>

                  <div className="dm-attention-list">
                    {items.slice(0, 3).map((item) => (
                      <article key={item.id} className="dm-attention-row">
                        <div>
                          <strong>{item.title}</strong>
                          <small>
                            Security · Level {item.priority === 'critical' ? '4' : '3'} · {item.status}
                          </small>
                          <span className="dm-status urgent">Needs review</span>
                        </div>
                        <button
                          className="dm-small-button"
                          onClick={() => setSelectedIncident(item)}
                        >
                          Review &rarr;
                        </button>
                      </article>
                    ))}
                  </div>

                  <div className="dm-panel-footnote">
                    <LockKeyhole size={13} />
                    <span>Cases are limited to Safety &amp; Security</span>
                  </div>
                </section>

                {/* 2. Patrol & Inspection Queue */}
                <section className="dm-panel dm-priority-panel gsap-panel">
                  <div className="dm-panel-heading">
                    <div>
                      <div className="dm-section-title">
                        <h2 className="gsap-section-title">Inspection queue</h2>
                        <span className="dm-count">1</span>
                      </div>
                      <p>Quality checks and General Manager directives.</p>
                    </div>
                    <button className="dm-text-button" onClick={() => navigate('incidents')}>
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>

                  <article className="dm-attention-row dm-inspection-row">
                    <div>
                      <strong>402 Perimeter &amp; Service Corridors sweep</strong>
                      <small>Awaiting supervisor assignment</small>
                    </div>
                    <button
                      className="dm-small-button"
                      onClick={() => openModal({ kind: 'inspection', sector: 'Sector 402' })}
                    >
                      Assign &gt;
                    </button>
                  </article>
                </section>
              </div>

              {/* Right Column */}
              <div className="dm-grid-stack">
                {/* 1. Shift Snapshot Card */}
                <section className="dm-panel dm-shift-card gsap-panel">
                  <div className="dm-section-title">
                    <h2 className="gsap-section-title">Shift snapshot</h2>
                    <span className="dm-shift-label">Night shift</span>
                  </div>

                  <div className="dm-completion">
                    <strong>
                      85<span>%</span>
                    </strong>
                    <div>
                      <b>Patrol completion</b>
                      <small>3 of 4 sectors covered</small>
                    </div>
                  </div>

                  <progress max={100} value={85} />

                  <div className="dm-snapshot-details">
                    <span>
                      Team on duty
                      <strong>{onDutyCount}</strong>
                    </span>
                    <span>
                      Open incidents
                      <strong>{activeIncidents.length || 5}</strong>
                    </span>
                  </div>

                  <div className="dm-shift-actions">
                    <button className="dm-secondary" onClick={() => openModal({ kind: 'handover' })}>
                      <Send size={14} />
                      <span>Prepare handover</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </section>

                {/* 2. Policies & SOPs / Department Tools Card */}
                <section className="dm-panel dm-desk-summary gsap-panel">
                  <div className="dm-desk-card-label">
                    <span>Department tools</span>
                  </div>
                  <h2 className="gsap-section-title">Policies &amp; SOPs</h2>
                  <p>Emergency playbooks &amp; response protocols</p>
                  <small>Stay ahead of critical incidents and keep emergency protocols ready.</small>
                  <div style={{ marginTop: 'auto', paddingTop: '18px' }}>
                    <button
                      className="dm-primary"
                      style={{ width: '100%' }}
                      onClick={() => navigate('policies')}
                    >
                      Open emergency playbooks &rarr;
                    </button>
                  </div>
                </section>
              </div>
            </div>

            {/* Bottom Full-Width Active Incidents Table */}
            <section className="dm-panel gsap-panel">
              <div className="dm-panel-heading">
                <div>
                  <h2 className="gsap-section-title">Active incidents</h2>
                  <p>The latest work across safety &amp; security.</p>
                </div>
                <button className="dm-text-button" onClick={() => navigate('incidents')}>
                  All requests <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="dm-table-wrap">
                <table className="dm-table">
                  <thead>
                    <tr>
                      <th>REQUEST / LOCATION</th>
                      <th>OWNER</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                      <th>FOLLOW-UP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {getIncidentPhoto(item) ? (
                              <div
                                onClick={() => setSelectedIncident(item)}
                                className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[var(--dm-line)] cursor-pointer group shadow-sm bg-stone-900"
                                title="Click to view incident photo & details"
                              >
                                <img
                                  src={getIncidentPhoto(item)!}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                />
                                <span className="absolute bottom-0 right-0 p-0.5 bg-black/75 text-white rounded-tl">
                                  <Camera size={10} />
                                </span>
                              </div>
                            ) : null}
                            <div className="min-w-0">
                              <strong
                                className="cursor-pointer hover:underline block truncate"
                                onClick={() => setSelectedIncident(item)}
                              >
                                {item.title}
                              </strong>
                              <small className="text-[var(--dm-muted)] block">
                                {item.ref || item.id} {item.room ? `· ${item.room}` : ''}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{item.assignee || 'Awaiting assignment'}</td>
                        <td>
                          <span
                            className={
                              item.priority === 'critical' || item.priority === 'urgent'
                                ? 'dm-status urgent'
                                : 'dm-status'
                            }
                          >
                            {item.priority || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </td>
                        <td>
                          <button
                            className="dm-text-button font-semibold"
                            onClick={() => setSelectedIncident(item)}
                          >
                            Review &gt;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ===================== TAB: INCIDENT MONITORING ===================== */}
        {tab === 'incidents' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Incident Monitoring</h2>
                <p>Filter, search, and inspect live security dispatches and alarms across the property.</p>
              </div>
              <div className="dm-heading-actions">
                <button className="dm-primary" onClick={() => setShowLogModal(true)}>
                  + Log incident
                </button>
              </div>
            </div>

            <div className="dm-filter-bar" style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderBottom: '1px solid var(--dm-line)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dm-muted)' }} />
                <input
                  type="text"
                  placeholder="Search incidents by room, title, responder or reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '7px', border: '1px solid var(--dm-line)', background: 'var(--dm-surface)', color: 'var(--dm-ink)', fontSize: '13px' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--dm-line)', background: 'var(--dm-paper)', color: 'var(--dm-ink)', fontSize: '13px' }}
              >
                <option value="all">All statuses</option>
                <option value="open">Active only</option>
                <option value="resolved">Resolved only</option>
              </select>
            </div>

            <div className="dm-table-wrap">
              <table className="dm-table">
                <thead>
                  <tr>
                    <th>INCIDENT / LOCATION</th>
                    <th>RESPONDER</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>FOLLOW-UP</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--dm-muted)' }}>
                        No incidents match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleIncidents.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {getIncidentPhoto(item) ? (
                              <div
                                onClick={() => setSelectedIncident(item)}
                                className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[var(--dm-line)] cursor-pointer group shadow-sm bg-stone-900"
                                title="Click to view incident photo & details"
                              >
                                <img
                                  src={getIncidentPhoto(item)!}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                />
                                <span className="absolute bottom-0 right-0 p-0.5 bg-black/75 text-white rounded-tl">
                                  <Camera size={10} />
                                </span>
                              </div>
                            ) : null}
                            <div className="min-w-0">
                              <strong
                                className="cursor-pointer hover:underline block truncate"
                                onClick={() => setSelectedIncident(item)}
                              >
                                {item.title}
                              </strong>
                              <small className="text-[var(--dm-muted)] block">
                                {item.ref || item.id} {item.room ? `· ${item.room}` : ''}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{item.assignee || 'Awaiting assignment'}</td>
                        <td>
                          <span
                            className={
                              item.priority === 'critical' || item.priority === 'urgent'
                                ? 'dm-status urgent'
                                : 'dm-status'
                            }
                          >
                            {item.priority || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className={statusClass(item.status)}>{item.status}</span>
                        </td>
                        <td>
                          <button
                            className="dm-text-button font-semibold"
                            onClick={() => setSelectedIncident(item)}
                          >
                            Review &gt;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}



        {/* ===================== TAB: ESCALATIONS & RECOVERY ===================== */}
        {tab === 'recovery' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Supervisor Escalations &amp; Security Recovery</h2>
                <p>Cases escalated to executive management or awaiting GM directives.</p>
              </div>
            </div>

            {items.filter((i) => i.priority === 'critical' || /escalat/i.test(i.status)).length === 0 ? (
              <p className="dm-empty" style={{ padding: '36px', textAlign: 'center', color: 'var(--dm-muted)' }}>
                No active escalations. All security events are within standard operating protocols.
              </p>
            ) : (
              items
                .filter((i) => i.priority === 'critical' || /escalat/i.test(i.status))
                .map((item) => (
                  <article className="dm-record" key={item.id}>
                    <div className="dm-record-title">
                      <h3>{item.title}</h3>
                      <span className="dm-status urgent">{item.priority}</span>
                    </div>
                    <p>{item.meta || 'Requires security supervisor intervention and GM briefing.'}</p>
                    <small>
                      {item.ref || item.id} · Location: {item.room || 'General Property'} · Status: {item.status}
                    </small>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button
                        className="dm-small-button"
                        onClick={() => setSelectedIncident(item)}
                      >
                        Review details &rarr;
                      </button>
                      <button
                        className="dm-secondary"
                        onClick={() => openModal({ kind: 'recovery', task: item })}
                      >
                        Record decision
                      </button>
                    </div>
                  </article>
                ))
            )}
          </section>
        )}

        {/* ===================== TAB: POLICIES & SOPS ===================== */}
        {tab === 'policies' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Emergency Playbooks &amp; SOPs</h2>
                <p>Standard operating procedures, fire response guides, and escalation matrices.</p>
              </div>
            </div>

            <article className="dm-record">
              <h3>Panic Alarm &amp; Emergency Response Protocol</h3>
              <p>
                Immediate dispatch of two armed/trained officers to verify beacon location within 90 seconds.
                Notify Front Desk Coordinator and establish direct radio contact on Channel 3.
              </p>
              <small>Protocol: E-1 · Department Owner: Inspector Roy · Escalation: General Manager</small>
            </article>

            <article className="dm-record">
              <h3>Fire &amp; Life Safety Sweep Protocol</h3>
              <p>
                In the event of smoke or fire telemetry, dispatch designated zone officer to inspect sensor heads,
                check stairwells, and stand by the riser station.
              </p>
              <small>Protocol: F-4 · Owner: Facilities &amp; Security</small>
            </article>

            <article className="dm-record">
              <h3>Unauthorized Access &amp; Trespass Policy</h3>
              <p>
                Challenge non-badged individuals in back-of-house corridors politely. Escort off property or detain
                if forced entry is suspected. Log full CCTV clip into incident evidence.
              </p>
              <small>Protocol: S-2 · Effective 2026-01-01</small>
            </article>
          </section>
        )}

        {/* ===================== TAB: SHIFT HANDOVER ===================== */}
        {tab === 'handover' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Shift Handover</h2>
                <p>Carry forward open incidents, key control notes, and night directives.</p>
              </div>
              <button className="dm-primary" onClick={() => openModal({ kind: 'handover' })}>
                Prepare handover
              </button>
            </div>

            {localHandovers.map((h) => (
              <article className="dm-record" key={h.id}>
                <div className="dm-record-title">
                  <h3>
                    {h.outgoingManager} &rarr; {h.incomingManager}
                  </h3>
                  <span className={statusClass(h.status)}>{h.status}</span>
                </div>
                <p>{h.notes}</p>
                <small>
                  {dateLabel(h.timestamp)} · {h.outstandingTasksCount} active incidents
                </small>
                <ul style={{ marginTop: '10px', paddingLeft: '20px', color: 'var(--dm-muted)', fontSize: '12px' }}>
                  {h.priorityActions.map((p, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        )}



        {/* ===================== TAB: NOTIFICATIONS / ALERTS ===================== */}
        {tab === 'notifications' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Safety &amp; Security Alerts</h2>
                <p>{criticalItems.length} urgent alerts active · Property-wide</p>
              </div>
            </div>

            {criticalItems.length === 0 ? (
              <div className="dm-empty" style={{ padding: '36px', textAlign: 'center' }}>
                <CheckCheck size={32} style={{ margin: '0 auto 12px', color: 'var(--dm-muted)' }} />
                <h3>All quiet on property</h3>
                <p>No critical alarms or pending panic signals.</p>
              </div>
            ) : (
              criticalItems.map((n) => (
                <article className="dm-record" key={n.id}>
                  <div className="dm-record-title">
                    <h3>{n.title}</h3>
                    <span className="dm-status urgent">{n.priority}</span>
                  </div>
                  <p>{n.meta || 'Emergency alert triggered. Immediate response required.'}</p>
                  <small>
                    Location: {n.room || 'General Property'} · Status: {n.status}
                  </small>
                  <div style={{ marginTop: '10px' }}>
                    <button
                      className="dm-small-button"
                      onClick={() => setSelectedIncident(n)}
                    >
                      Acknowledge &amp; Respond &rarr;
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* ===================== TAB: PROFILE ===================== */}
        {tab === 'profile' && (
          <section className="dm-panel">
            <div className="dm-panel-heading">
              <div>
                <h2>Security Officer Profile</h2>
                <p>Your demo identity and active safety clearance.</p>
              </div>
            </div>

            <form
              className="dm-profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Officer profile details updated successfully.');
              }}
            >
              <label className="dm-field">
                Display name
                <input name="name" defaultValue="Inspector Roy" required maxLength={100} />
              </label>
              <label className="dm-field">
                Radio Channel
                <input name="radio" defaultValue="CH-3 Guard Ops" required maxLength={40} />
              </label>
              <label className="dm-field">
                Badge Number
                <input value="SEC-0108" readOnly />
              </label>
              <label className="dm-field">
                Clearance Level
                <input value="Level 4 · Armed Response & Perimeter Lockdown" readOnly />
              </label>
              <label className="dm-field">
                Assigned Shift
                <input value="Night Shift (22:00 – 07:00)" readOnly />
              </label>
              <button className="dm-primary" type="submit">
                Save profile
              </button>
              <p className="dm-report-note">
                Standalone demonstration · Work is saved in this browser.
              </p>
            </form>
          </section>
        )}

        {/* Footer */}
        <footer className="dm-footer">
          THE GRAND ADP <span>Thoughtful service. Connected teams.</span>
        </footer>
      </main>

      {/* ---------------- MODALS ---------------- */}
      {/* Incident Detail Modal */}
      {selectedIncident && (
        <SecurityIncidentDetailModal
          item={{
            ...(items.find((i) => i.id === selectedIncident.id) || selectedIncident),
            incidentPhotoUrl:
              customLoggedPhotos[selectedIncident.id] ||
              (items.find((i) => i.id === selectedIncident.id) || selectedIncident).incidentPhotoUrl,
          }}
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onAcknowledge={acknowledgeSecurityItem}
          onArrive={arriveSecurityItem}
          onResolve={resolveSecurityItem}
          onRequestBackup={requestSecurityBackup}
          onEscalate={escalateSecurityItem}
          onAddNote={addSecurityNote}
        />
      )}

      {/* Log Incident Modal */}
      {showLogModal && (
        <SecurityLogIncidentModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          onSubmit={(inc) => {
            const photo = inc.incidentPhotoUrl || inc.photoUrl;
            createSecurityIncident(inc as any);
            if (photo) {
              setTimeout(() => {
                const latest = state.items.security_responder?.[0];
                if (latest) {
                  latest.incidentPhotoUrl = photo;
                  latest.photoUrl = photo;
                  customLoggedPhotos[latest.id] = photo;
                }
              }, 50);
            }
            setShowLogModal(false);
          }}
        />
      )}

      {/* Dialog for Inspection / Handover / Recovery */}
      <dialog
        ref={dialog}
        className="dm-dialog"
        onClose={() => setModal(null)}
        aria-labelledby="dm-dialog-title"
      >
        <form onSubmit={submitModal}>
          <div className="dm-dialog-heading">
            <h2 id="dm-dialog-title">
              {modal?.kind === 'inspection'
                ? 'Assign patrol inspection'
                : modal?.kind === 'recovery'
                  ? 'Review security recovery'
                  : 'Prepare shift handover'}
            </h2>
            <button
              className="dm-icon-button"
              type="button"
              aria-label="Close dialog"
              onClick={closeModal}
            >
              <X size={19} />
            </button>
          </div>
          <p className="dm-dialog-description">Safety &amp; Security · Inspector Roy</p>

          {modal?.kind === 'inspection' && (
            <>
              <label className="dm-field">
                Sector or Checkpoint Location
                <input
                  name="location"
                  defaultValue={modal.sector || 'Perimeter & Service Corridors'}
                  required
                  maxLength={100}
                />
              </label>
              <label className="dm-field">
                Assign to Security Officer
                <select name="officer" required defaultValue="officer-chen">
                  <option value="officer-chen">Officer T. Chen (Sector Lead)</option>
                  <option value="officer-marcus">Officer Marcus (Perimeter Patrol)</option>
                  <option value="officer-sarah">Officer Sarah (CCTV Surveillance)</option>
                </select>
              </label>
              <label className="dm-field">
                Patrol Directives
                <textarea
                  name="instructions"
                  defaultValue="Inspect all emergency exits, lockouts, and fire riser access. Report anomalies on radio CH-3."
                  required
                  maxLength={2000}
                />
              </label>
            </>
          )}

          {modal?.kind === 'recovery' && modal.task && (
            <>
              <p className="dm-dialog-description">{modal.task.title}</p>
              <label className="dm-field">
                Decision
                <select name="decision">
                  <option value="resolve">Resolve and close incident on night shift</option>
                  <option value="escalate">Escalate to General Manager for inquiry</option>
                </select>
              </label>
              <label className="dm-field">
                Recovery / Action Note
                <textarea
                  name="note"
                  required
                  maxLength={2000}
                  placeholder="Describe the physical security action taken or reason for GM escalation..."
                />
              </label>
            </>
          )}

          {modal?.kind === 'handover' && (
            <>
              <label className="dm-field">
                Incoming Shift Officer
                <input
                  name="incoming"
                  required
                  maxLength={100}
                  placeholder="e.g. Officer Morning Lead / Supervisor Dave"
                />
              </label>
              <label className="dm-field">
                Shift Summary &amp; Priority Actions
                <textarea
                  name="notes"
                  required
                  maxLength={2000}
                  placeholder="Summary of night patrols, latch checks, and follow-ups required by morning shift..."
                />
              </label>
              <p className="dm-dialog-description">
                {activeIncidents.length} open security incidents will be automatically linked to this handover.
              </p>
            </>
          )}

          <div className="dm-dialog-actions">
            <button type="button" className="dm-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="dm-primary">
              {modal?.kind === 'recovery' ? 'Save decision' : 'Save & continue'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
