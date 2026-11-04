'use client';

import React, { useState, useEffect } from 'react';
import '../shared/warm-theme.css';
import './portal-login.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  RotateCcw,
  Sun,
  Moon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Smartphone,
  ClipboardCheck,
  Radio,
  Gauge,
  BellRing,
  Wallet,
  ShieldAlert,
  Crown,
  Sliders,
  Globe,
  Info,
  Sparkles,
  HeartPulse,
  Wrench,
  UtensilsCrossed,
  ChevronDown,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { MANAGER_DEPARTMENTS, MANAGER_DEMO_PASSWORD, managerDepartmentFromEmail, type ManagerDepartmentId } from '@/lib/manager-domain';
import { DemoCredentialsDialog } from './DemoCredentialsDialog';
import { FULFILLER_PROFILES, type FulfillerDeptKey } from '@/components/staff/fulfiller/fulfillerProfiles';
import type { RoleId, DispatcherDepartment } from '@/types/demo';

interface PresetRole {
  id: string;
  num: string;
  name: string;
  email: string;
  pass: string;
  icon: LucideIcon;
  color: string;
  path: string;
  personaId?: RoleId;
  departmentId?: ManagerDepartmentId;
}

const PRESET_ROLES: PresetRole[] = [
  {
    id: 'guest',
    num: '00',
    name: 'Guest Portal',
    email: 'guest@thegrandadp.com',
    pass: 'guest123',
    icon: Smartphone,
    color: 'from-cyan-500 to-teal-500',
    path: '/guest/portal?room=402&token=demo-token',
  },
  {
    id: 'fulfiller',
    num: '01',
    name: 'Task Fulfiller',
    email: 'fulfiller@thegrandadp.com',
    pass: 'task123',
    icon: ClipboardCheck,
    color: 'from-emerald-500 to-teal-600',
    path: '/staff/fulfiller',
    personaId: 'task_fulfiller',
  },
  {
    id: 'dispatcher',
    num: '02',
    name: 'Dispatcher / Supervisor',
    email: 'dispatcher@thegrandadp.com',
    pass: 'dispatch123',
    icon: Radio,
    color: 'from-sky-500 to-blue-600',
    path: '/staff/dispatcher-supervisor',
    personaId: 'department_dispatcher_supervisor',
  },
  {
    id: 'manager',
    num: '03',
    name: 'Department Manager',
    email: 'manager@thegrandadp.com',
    pass: 'manager123',
    icon: Gauge,
    color: 'from-purple-500 to-indigo-600',
    path: '/staff/department-manager',
    personaId: 'department_manager',
    departmentId: 'housekeeping',
  },
  {
    id: 'frontdesk',
    num: '04',
    name: 'Front Desk',
    email: 'frontdesk@thegrandadp.com',
    pass: 'desk123',
    icon: BellRing,
    color: 'from-pink-500 to-rose-600',
    path: '/staff/front-desk',
    personaId: 'front_desk_coordinator',
  },
  {
    id: 'finance',
    num: '05',
    name: 'Financial Operator',
    email: 'finance@thegrandadp.com',
    pass: 'finance123',
    icon: Wallet,
    color: 'from-lime-500 to-emerald-600',
    path: '/staff/finance',
    personaId: 'financial_operator',
  },
  {
    id: 'security',
    num: '06',
    name: 'Security Responder',
    email: 'security@thegrandadp.com',
    pass: 'secure123',
    icon: ShieldAlert,
    color: 'from-red-500 to-rose-700',
    path: '/staff/security',
    personaId: 'security_responder',
  },
  {
    id: 'gm',
    num: '07',
    name: 'General Manager',
    email: 'gm@thegrandadp.com',
    pass: 'gm123',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    path: '/staff/general-manager',
    personaId: 'general_manager',
  },
  {
    id: 'admin',
    num: '08',
    name: 'Platform Administrator',
    email: 'admin@thegrandadp.com',
    pass: 'admin123',
    icon: Sliders,
    color: 'from-cyan-500 to-blue-600',
    path: '/staff/admin',
    personaId: 'platform_admin',
  },
];

export interface DispatcherDeptOption {
  id: DispatcherDepartment;
  slug: string;
  name: string;
  email: string;
  pass: string;
  path: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const DISPATCHER_DEPARTMENTS: DispatcherDeptOption[] = [
  {
    id: 'Housekeeping',
    slug: 'housekeeping',
    name: 'Housekeeping',
    email: 'dispatcher.housekeeping@thegrandadp.com',
    pass: 'dispatch123',
    path: '/staff/dispatcher-supervisor?dept=housekeeping',
    description: 'Turnover, deep clean, linen logistics & quality inspections',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'Wellness',
    slug: 'wellness',
    name: 'Wellness',
    email: 'dispatcher.wellness@thegrandadp.com',
    pass: 'dispatch123',
    path: '/staff/dispatcher-supervisor?dept=wellness',
    description: 'Spa treatments, hydrotherapy pools & wellness sessions',
    icon: HeartPulse,
    color: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'Maintenance & Engineering',
    slug: 'maintenance',
    name: 'Maintainance & Engineering',
    email: 'dispatcher.engineering@thegrandadp.com',
    pass: 'dispatch123',
    path: '/staff/dispatcher-supervisor?dept=maintenance',
    description: 'HVAC climate, plumbing, electrical & asset work orders',
    icon: Wrench,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'Food & Beverages',
    slug: 'fnb',
    name: 'Food & Beverages',
    email: 'dispatcher.fnb@thegrandadp.com',
    pass: 'dispatch123',
    path: '/staff/dispatcher-supervisor?dept=fnb',
    description: 'In-room dining, bar services, pantry & meal delivery',
    icon: UtensilsCrossed,
    color: 'from-purple-500 to-pink-600',
  },
];

const FULFILLER_DEPARTMENTS: { key: FulfillerDeptKey; name: string }[] = [
  { key: 'housekeeping', name: 'Housekeeping' },
  { key: 'wellness', name: 'Spa & Wellness' },
  { key: 'maintenance', name: 'Maintenance & Engineering' },
  { key: 'fnb', name: 'Food & Beverages' },
];

const DEMO_ACCOUNTS: PresetRole[] = [
  ...MANAGER_DEPARTMENTS.map((d, index) => ({ id: `manager-${d.id}`, num: `M${index + 1}`, name: `${d.name} Manager`, email: d.email, pass: MANAGER_DEMO_PASSWORD, icon: Gauge, color: 'from-purple-500 to-indigo-600', path: '/staff/department-manager', personaId: 'department_manager' as const, departmentId: d.id })),
  ...FULFILLER_DEPARTMENTS.map((fd, index) => ({
    id: `fulfiller-${fd.key}`,
    num: `F${index + 1}`,
    name: `Task Fulfiller — ${fd.name} (${FULFILLER_PROFILES[fd.key].employeeName})`,
    email: FULFILLER_PROFILES[fd.key].email,
    pass: 'task123',
    icon: ClipboardCheck,
    color: FULFILLER_PROFILES[fd.key].colorGradient,
    path: `/staff/fulfiller?dept=${fd.key}`,
    personaId: 'task_fulfiller' as const,
  })),
  ...PRESET_ROLES,
];

export function PortalLoginView() {
  const router = useRouter();
  const { state, setTheme, setPersona, setActiveDispatcherDept, setManagerDepartment } = useDemo();
  const [dispatcherDropdownOpen, setDispatcherDropdownOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DispatcherDepartment>(state.activeDispatcherDept || 'Housekeeping');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [previewDepartment, setPreviewDepartment] = useState<ManagerDepartmentId>('housekeeping');
  const [previewFulfillerDept, setPreviewFulfillerDept] = useState<FulfillerDeptKey>('housekeeping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isLight = state.theme === 'light';

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const htmlEl = document.documentElement;
    htmlEl.dataset.theme = state.theme;
    if (isLight) {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
    } else {
      htmlEl.classList.remove('light');
      htmlEl.classList.add('dark');
    }
  }, [isLight, state.theme]);

  const managerSelected = selectedRoleId === 'manager' || selectedRoleId?.startsWith('manager-');
  const fulfillerSelected = selectedRoleId === 'fulfiller' || selectedRoleId?.startsWith('fulfiller-');
  const activeRole = DEMO_ACCOUNTS.find((r) => r.id === selectedRoleId) || PRESET_ROLES.find((r) => r.id === selectedRoleId);

  const handleSelectFulfillerDept = (dept: FulfillerDeptKey) => {
    setPreviewFulfillerDept(dept);
    const profile = FULFILLER_PROFILES[dept];
    setSelectedRoleId(`fulfiller-${dept}`);
    setEmail(profile.email);
    setPassword('task123');
    showToast(`Task Fulfiller (${profile.departmentName}) loaded`);
  };

  const handleSelectRole = (role: PresetRole) => {
    if (role.id === 'fulfiller') {
      setDispatcherDropdownOpen(false);
      handleSelectFulfillerDept(previewFulfillerDept);
      return;
    }

    if (role.id === 'dispatcher') {
      setDispatcherDropdownOpen(!dispatcherDropdownOpen);
      setSelectedRoleId(role.id);
      const activeDeptConfig = DISPATCHER_DEPARTMENTS.find((d) => d.id === selectedDept) || DISPATCHER_DEPARTMENTS[0];
      setEmail(activeDeptConfig.email);
      setPassword(activeDeptConfig.pass);
      setActiveDispatcherDept(activeDeptConfig.id);
      showToast(`Dispatcher / Supervisor (${activeDeptConfig.name}) loaded`);
      return;
    }

    setDispatcherDropdownOpen(false);
    const selected = role.id === 'manager' ? DEMO_ACCOUNTS.find(account => account.departmentId === previewDepartment && account.id !== 'manager')! : role;
    if (selected.departmentId) setPreviewDepartment(selected.departmentId);
    setSelectedRoleId(selected.id);
    setEmail(selected.email);
    setPassword(selected.pass);
    showToast(`${role.name} loaded`);
  };

  const handleSelectDepartment = (dept: DispatcherDeptOption) => {
    setSelectedDept(dept.id);
    setSelectedRoleId('dispatcher');
    setEmail(dept.email);
    setPassword(dept.pass);
    setActiveDispatcherDept(dept.id);
    setDispatcherDropdownOpen(false);
    showToast(`Loaded ${dept.name} Dispatcher`);
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setSelectedRoleId(null);
    setDispatcherDropdownOpen(false);
    showToast('Cleared');
  };

  const handleToggleTheme = () => {
    const nextTheme = isLight ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const handleForgotPassword = () => {
    if (email.trim()) {
      showToast('Use View demo login credentials to autofill a public demo account.');
    } else {
      showToast('Enter your email address first');
    }
  };

    const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    // Exact manager identities take precedence over broad dispatcher department matching.
    const managerDepartment = managerDepartmentFromEmail(cleanEmail);
    if (managerDepartment) {
      if (password !== MANAGER_DEMO_PASSWORD) {
        showToast('Email or password does not match a demo account. Open demo credentials to autofill.');
        return;
      }
      setIsSubmitting(true);
      setManagerDepartment(managerDepartment);
      setPersona('department_manager');
      router.push('/staff/department-manager');
      return;
    }
    const isFulfiller =
      selectedRoleId === 'fulfiller' ||
      selectedRoleId?.startsWith('fulfiller-') ||
      cleanEmail.includes('fulfiller');

    if (isFulfiller) {
      let targetDept: FulfillerDeptKey = previewFulfillerDept;
      if (cleanEmail.includes('wellness')) targetDept = 'wellness';
      else if (cleanEmail.includes('eng') || cleanEmail.includes('maint')) targetDept = 'maintenance';
      else if (cleanEmail.includes('dining') || cleanEmail.includes('fnb') || cleanEmail.includes('food')) targetDept = 'fnb';
      else if (cleanEmail.includes('housekeeping')) targetDept = 'housekeeping';

      setIsSubmitting(true);
      setPersona('task_fulfiller');
      showToast(`Signing in as Task Fulfiller (${FULFILLER_PROFILES[targetDept].departmentName})...`);
      router.push(`/staff/fulfiller?dept=${targetDept}`);
      return;
    }

    const isDispatcher =
      selectedRoleId === 'dispatcher' ||
      cleanEmail.includes('dispatcher') ||
      cleanEmail.includes('housekeeping') ||
      cleanEmail.includes('wellness') ||
      cleanEmail.includes('engineering') ||
      cleanEmail.includes('maintenance') ||
      cleanEmail.includes('fnb');

    setIsSubmitting(true);

    if (isDispatcher) {
      let targetDept: DispatcherDepartment = selectedDept;
      let deptSlug = 'housekeeping';

      if (cleanEmail.includes('wellness') || (selectedRoleId === 'dispatcher' && selectedDept === 'Wellness')) {
        targetDept = 'Wellness';
        deptSlug = 'wellness';
      } else if (
        cleanEmail.includes('engineering') ||
        cleanEmail.includes('maintenance') ||
        (selectedRoleId === 'dispatcher' && selectedDept === 'Maintenance & Engineering')
      ) {
        targetDept = 'Maintenance & Engineering';
        deptSlug = 'maintenance';
      } else if (
        cleanEmail.includes('fnb') ||
        cleanEmail.includes('food') ||
        (selectedRoleId === 'dispatcher' && selectedDept === 'Food & Beverages')
      ) {
        targetDept = 'Food & Beverages';
        deptSlug = 'fnb';
      } else {
        targetDept = 'Housekeeping';
        deptSlug = 'housekeeping';
      }

      setActiveDispatcherDept(targetDept);
      setPersona('department_dispatcher_supervisor');
      showToast(`Signing in as Dispatcher (${targetDept})...`);
      router.push(`/staff/dispatcher-supervisor?dept=${deptSlug}`);
      return;
    }

    const matchedRole =
      DEMO_ACCOUNTS.find((r) => r.email.toLowerCase() === cleanEmail) ||
      PRESET_ROLES.find((r) => r.email.toLowerCase() === cleanEmail) ||
      (selectedRoleId ? DEMO_ACCOUNTS.find((r) => r.id === selectedRoleId) : null);

    if (!matchedRole) {
      showToast('Email or password does not match a demo account. Open demo credentials to autofill.');
      setIsSubmitting(false);
      return;
    }

    if (matchedRole) {
      if (matchedRole.departmentId) setManagerDepartment(matchedRole.departmentId);
      if (matchedRole.personaId) {
        setPersona(matchedRole.personaId);
      }
      showToast(`Signing in as ${matchedRole.name}...`);
      router.push(matchedRole.path);
    }
  };

  return (
    <div className="portal-page-wrap warm-theme" data-theme={state.theme}>
      <header className="portal-header">
        <Link href="/" className="portal-brand">
          <span className="portal-brand-mark"><Building2 size={22}/></span>
          <span><strong>The Grand ADP</strong><small>Resort & staff portals</small></span>
        </Link>
        <div className="portal-header-actions">
          <Link href="/" className="portal-control portal-public-link"><Globe size={15}/> Public site</Link>
          <button type="button" onClick={handleReset} className="portal-control" title="Clear form"><RotateCcw size={15}/><span>Reset</span></button>
          <button type="button" onClick={handleToggleTheme} className="portal-control portal-theme-toggle" aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'} title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}>{isLight ? <Moon size={18}/> : <Sun size={18}/>}</button>
        </div>
      </header>

      <main className="portal-main">
        <div className="portal-intro"><p className="portal-eyebrow">THE GRAND ADP · STAFF ACCESS</p><h1>Your workspace, ready.</h1><p>Choose your role and sign in to continue the day.</p></div>
        <div className="portal-grid">
          <section className="portal-card portal-signin" aria-labelledby="portal-signin-title">
            <div className="portal-card-heading"><div><p className="portal-eyebrow">01 / YOUR ACCOUNT</p><h2 id="portal-signin-title">Sign in</h2></div><span className="portal-account-badge"><Lock size={13}/>{managerSelected ? 'Department manager' : fulfillerSelected ? `Task Fulfiller (${FULFILLER_PROFILES[previewFulfillerDept].departmentName})` : activeRole?.name || 'Staff access'}</span></div>
            <form onSubmit={handleLoginSubmit} className="portal-form">
              <div className="portal-field"><label htmlFor="emailInput">Email address</label><div className="portal-input-wrap"><Mail size={17}/><input id="emailInput" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@thegrandadp.com"/></div></div>
              <div className="portal-field"><div className="portal-label-row"><label htmlFor="passwordInput">Password</label><button type="button" className="portal-text-button" onClick={handleForgotPassword}>Forgot?</button></div><div className="portal-input-wrap"><Lock size={17}/><input id="passwordInput" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" aria-label="Toggle password visibility" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
              <label className="portal-remember"><input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}/>Remember this workstation</label>
              <button type="submit" id="submitBtn" disabled={isSubmitting} className="portal-submit"><span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span><ArrowRight size={17}/></button>
            </form>
            <DemoCredentialsDialog accounts={DEMO_ACCOUNTS.filter(account => account.id !== 'manager')} onSelect={handleSelectRole}/>
            <p className="portal-demo-note">Preview accounts use sample hotel records.</p>
          </section>

          <section className="portal-card portal-workspaces" aria-labelledby="portal-workspaces-title">
            <div className="portal-card-heading"><div><p className="portal-eyebrow">02 / CHOOSE A WORKSPACE</p><h2 id="portal-workspaces-title">Quick logins</h2></div><span className="portal-helper">Autofill your account</span></div>
            <div className="portal-role-grid">
              {PRESET_ROLES.map(role => {
                const isSelected = role.id === 'manager' ? !!managerSelected : role.id === selectedRoleId;
                const Icon = role.icon;
                const isDispatcher = role.id === 'dispatcher';
                return <React.Fragment key={role.id}>
                  <button type="button" className="portal-role" data-selected={isSelected} onClick={() => handleSelectRole(role)} aria-pressed={isSelected} aria-expanded={isManager ? !!managerSelected : isFulfiller ? !!fulfillerSelected : isDispatcher ? dispatcherDropdownOpen : undefined} aria-controls={isManager ? 'manager-preview-selector' : isFulfiller ? 'fulfiller-preview-selector' : isDispatcher ? 'dispatcher-preview-selector' : undefined}>
                    <span className={`portal-role-icon ${role.color}`}><Icon size={18}/></span><span className="portal-role-name">{role.name}{isDispatcher && isSelected && <small>{selectedDept}</small>}{isFulfiller && isSelected && <small>{FULFILLER_PROFILES[previewFulfillerDept].departmentName}</small>}</span><span className="portal-role-number">{isSelected ? <Check size={15}/> : role.num}</span>{(isDispatcher || isManager || isFulfiller) && <ChevronDown size={14} className="portal-role-chevron"/>}
                  </button>
                  {isDispatcher && dispatcherDropdownOpen && <div className="portal-department-picker" id="dispatcher-preview-selector"><div className="portal-picker-heading"><strong>Choose department console</strong><span>4 departments</span></div><p>Choose a department to load its dispatcher account.</p><div className="portal-dispatcher-grid">{DISPATCHER_DEPARTMENTS.map(dept => {
                    const DeptIcon = dept.icon;
                    return <button type="button" key={dept.id} className="portal-department-option" aria-pressed={selectedDept === dept.id} onClick={() => handleSelectDepartment(dept)}><DeptIcon size={17}/><span><strong>{dept.name}</strong><small>{dept.description}</small></span>{selectedDept === dept.id && <Check size={15}/>}</button>;
                  })}</div></div>}
                </React.Fragment>;
              })}
            </div>
                        {fulfillerSelected && (
              <div id="fulfiller-preview-selector" className="manager-preview-selector">
                <div className="portal-picker-heading">
                  <label htmlFor="fulfiller-preview-department">Task fulfiller preview</label>
                  <span>4 departments</span>
                </div>
                <select
                  id="fulfiller-preview-department"
                  value={previewFulfillerDept}
                  onChange={(event) => {
                    const department = event.target.value as FulfillerDeptKey;
                    handleSelectFulfillerDept(department);
                  }}
                >
                  {FULFILLER_DEPARTMENTS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p>Select a department to autofill its preview login.</p>
              </div>
            )}
            {managerSelected && <div id="manager-preview-selector" className="manager-preview-selector"><div className="portal-picker-heading"><label htmlFor="manager-preview-department">Department manager preview</label><span>4 departments</span></div><select id="manager-preview-department" value={previewDepartment} onChange={event => { const department = event.target.value as ManagerDepartmentId; const account = DEMO_ACCOUNTS.find(role => role.departmentId === department && role.id !== 'manager'); if (account) handleSelectRole(account); }}>{MANAGER_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><p>Select a department to autofill its preview login.</p></div>}
            <div className="portal-scope-note"><ShieldAlert size={15}/><span>Each workspace opens the tools for its selected role.</span></div>
          </section>
        </div>
        <footer className="portal-footer"><span>THE GRAND ADP</span><span>One hotel. Every department connected.</span></footer>
      </main>
      {toastMessage && <div role="status" className="portal-toast"><Info size={17}/><span>{toastMessage}</span></div>}
    </div>
  );
}
