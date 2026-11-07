'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './portal-login.css';
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
import {
  MANAGER_DEPARTMENTS,
  MANAGER_DEMO_PASSWORD,
  managerDepartmentFromEmail,
  type ManagerDepartmentId,
} from '@/lib/manager-domain';
import {
  FULFILLER_PROFILES,
  type FulfillerDeptKey,
} from '@/components/staff/fulfiller/fulfillerProfiles';
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
    name: 'Maintenance & Engineering',
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
  ...MANAGER_DEPARTMENTS.map((d, index) => ({
    id: `manager-${d.id}`,
    num: `M${index + 1}`,
    name: `${d.name} Manager`,
    email: d.email,
    pass: MANAGER_DEMO_PASSWORD,
    icon: Gauge,
    color: 'from-purple-500 to-indigo-600',
    path: '/staff/department-manager',
    personaId: 'department_manager' as const,
    departmentId: d.id,
  })),
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
  const [fulfillerDropdownOpen, setFulfillerDropdownOpen] = useState(false);
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);

  const [selectedDept, setSelectedDept] = useState<DispatcherDepartment>(
    state.activeDispatcherDept || 'Housekeeping',
  );

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

  const handleSelectFulfillerDept = (dept: FulfillerDeptKey) => {
    setPreviewFulfillerDept(dept);
    const profile = FULFILLER_PROFILES[dept];
    setSelectedRoleId('fulfiller');
    setEmail(profile.email);
    setPassword('task123');
    showToast(`Task Fulfiller (${profile.departmentName}) loaded`);
  };

  const handleSelectManagerDept = (dept: ManagerDepartmentId) => {
    setPreviewDepartment(dept);
    const account = DEMO_ACCOUNTS.find(
      (role) => role.departmentId === dept && role.id !== 'manager',
    );
    if (account) {
      setSelectedRoleId('manager');
      setEmail(account.email);
      setPassword(account.pass);
      setManagerDepartment(dept);
      showToast(`${account.name} loaded`);
    }
  };

  const handleSelectRole = (role: PresetRole) => {
    if (role.id === 'fulfiller') {
      const nextOpen = !fulfillerDropdownOpen;
      setFulfillerDropdownOpen(nextOpen);
      setDispatcherDropdownOpen(false);
      setManagerDropdownOpen(false);
      setSelectedRoleId('fulfiller');
      handleSelectFulfillerDept(previewFulfillerDept);
      return;
    }

    if (role.id === 'dispatcher') {
      const nextOpen = !dispatcherDropdownOpen;
      setDispatcherDropdownOpen(nextOpen);
      setFulfillerDropdownOpen(false);
      setManagerDropdownOpen(false);
      setSelectedRoleId(role.id);
      const activeDeptConfig =
        DISPATCHER_DEPARTMENTS.find((d) => d.id === selectedDept) || DISPATCHER_DEPARTMENTS[0];
      setEmail(activeDeptConfig.email);
      setPassword(activeDeptConfig.pass);
      setActiveDispatcherDept(activeDeptConfig.id);
      showToast(`Dispatcher / Supervisor (${activeDeptConfig.name}) loaded`);
      return;
    }

    if (role.id === 'manager') {
      const nextOpen = !managerDropdownOpen;
      setManagerDropdownOpen(nextOpen);
      setDispatcherDropdownOpen(false);
      setFulfillerDropdownOpen(false);
      setSelectedRoleId('manager');
      handleSelectManagerDept(previewDepartment);
      return;
    }

    // Single-click role
    setDispatcherDropdownOpen(false);
    setFulfillerDropdownOpen(false);
    setManagerDropdownOpen(false);
    setSelectedRoleId(role.id);
    setEmail(role.email);
    setPassword(role.pass);
    showToast(`${role.name} loaded`);
  };

  const handleSelectDepartment = (dept: DispatcherDeptOption) => {
    setSelectedDept(dept.id);
    setSelectedRoleId('dispatcher');
    setEmail(dept.email);
    setPassword(dept.pass);
    setActiveDispatcherDept(dept.id);
    showToast(`Loaded ${dept.name} Dispatcher`);
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setSelectedRoleId(null);
    setDispatcherDropdownOpen(false);
    setFulfillerDropdownOpen(false);
    setManagerDropdownOpen(false);
    showToast('Cleared');
  };

  const handleToggleTheme = () => {
    const nextTheme = isLight ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const handleForgotPassword = () => {
    if (email.trim()) {
      showToast(`Reset email sent to ${email.trim()}`);
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
        showToast('Email or password does not match a demo account. Open credentials to autofill.');
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
      else if (cleanEmail.includes('dining') || cleanEmail.includes('fnb') || cleanEmail.includes('food'))
        targetDept = 'fnb';
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
      showToast('Email or password does not match a demo account. Open credentials to autofill.');
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

  // Determine active display name and indicator badge color
  let activeRoleDisplayName = 'Standard';
  let activeRoleDotClass = 'bg-slate-400';

  if (selectedRoleId) {
    if (selectedRoleId === 'dispatcher') {
      activeRoleDisplayName = `Dispatcher (${selectedDept})`;
      activeRoleDotClass = 'bg-gradient-to-r from-sky-500 to-blue-600';
    } else if (selectedRoleId === 'fulfiller') {
      activeRoleDisplayName = `Fulfiller (${FULFILLER_PROFILES[previewFulfillerDept].departmentName})`;
      activeRoleDotClass = 'bg-gradient-to-r from-emerald-500 to-teal-600';
    } else if (selectedRoleId === 'manager') {
      const mgrDept = MANAGER_DEPARTMENTS.find((d) => d.id === previewDepartment);
      activeRoleDisplayName = `${mgrDept?.name || 'Dept'} Manager`;
      activeRoleDotClass = 'bg-gradient-to-r from-purple-500 to-indigo-600';
    } else {
      const found = PRESET_ROLES.find((r) => r.id === selectedRoleId);
      if (found) {
        activeRoleDisplayName = found.name;
        activeRoleDotClass = `bg-gradient-to-r ${found.color}`;
      }
    }
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#E5C378] selection:text-slate-900 transition-colors duration-300 relative overflow-x-hidden portal-login-root ${
        isLight ? 'bg-slate-100 text-slate-900 light-mode' : 'bg-[#080d1a] text-slate-100 dark-mode'
      }`}
      data-theme={state.theme}
    >
      {/* Ambient background glow elements (cyan left, purple/pink right) */}
      <div className="glow-sphere-1" />
      <div className="glow-sphere-2" />

      {/* Top Navigation Header */}
      <header
        className={`relative z-20 px-5 sm:px-10 py-3.5 sm:py-4 flex items-center justify-between portal-login-header ${
          isLight
            ? 'border-b border-slate-200/70 bg-[#ffffff]/80 backdrop-blur-md'
            : 'border-b border-white/10 bg-[#070c17]/80 backdrop-blur-md'
        }`}
      >
        {/* Brand badge */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfb96c] to-[#a47b31] text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-900/20 ring-1 ring-amber-300/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`font-bold text-[15px] tracking-wide block ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              The Grand ADP
            </span>
            <span
              className={`text-[11px] block -mt-0.5 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Resort &amp; Staff Portals
            </span>
          </div>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className={`hidden sm:inline-flex items-center gap-2 text-xs sm:text-[13px] px-3.5 py-2 rounded-xl transition-all portal-header-btn ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-400 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Public site</span>
          </Link>

          <button
            type="button"
            id="resetDemoBtn"
            onClick={handleReset}
            title="Clear form"
            className={`inline-flex items-center gap-2 text-xs sm:text-[13px] px-3.5 py-2 rounded-xl transition-all cursor-pointer portal-header-btn ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-400 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            id="themeToggleBtn"
            onClick={handleToggleTheme}
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer portal-header-btn ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 bg-[#ffffff] border border-slate-200 hover:border-slate-300'
                : 'text-slate-300 hover:text-white bg-transparent border border-white/10 hover:border-white/20'
            }`}
          >
            {isLight ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Main Content Area - Scaled to 110% Zoom Proportion (max-w-[1140px]) */}
      <main className="relative z-10 flex-1 max-w-[1140px] w-full mx-auto px-5 sm:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <div className="mb-6">
          <h1
            className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            Portal Login
          </h1>
        </div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 items-start">
          {/* LEFT: Clean Login Card (lg:col-span-5) */}
          <section className="lg:col-span-5 w-full">
            <div
              className={`rounded-2xl p-7 sm:p-8 backdrop-blur-xl transition-all portal-card-left ${
                isLight
                  ? 'bg-[#ffffff]/95 border border-slate-200/80 shadow-xl shadow-slate-900/10'
                  : 'bg-[#0c1424]/90 border border-white/10 shadow-2xl shadow-black/50'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-4 mb-6 border-b ${
                  isLight ? 'border-slate-200/60' : 'border-white/5'
                }`}
              >
                <h2
                  className={`text-xs sm:text-sm font-semibold tracking-wide uppercase ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Sign In
                </h2>
                <div
                  id="activeRoleTag"
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium portal-active-role-tag ${
                    isLight
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-white/5 text-slate-300 border border-white/10'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeRoleDotClass}`} />
                  <span id="activeRoleName" className="truncate max-w-[150px]">
                    {activeRoleDisplayName}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form id="loginForm" onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="emailInput"
                    className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      id="emailInput"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@thegrandadp.com"
                      className={`w-full pl-11 pr-4 py-3 text-sm sm:text-[15px] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400/70 focus:border-amber-400 transition-all shadow-2xs portal-input ${
                        isLight
                          ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200'
                          : 'bg-[#070d18] text-white placeholder-slate-500 border border-white/10'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="passwordInput"
                      className={`block text-xs font-semibold uppercase tracking-wider ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className={`text-xs cursor-pointer hover:underline ${
                        isLight ? 'text-amber-600' : 'text-amber-400'
                      }`}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="passwordInput"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-11 py-3 text-sm sm:text-[15px] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400/70 focus:border-amber-400 transition-all shadow-2xs portal-input ${
                        isLight
                          ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200'
                          : 'bg-[#070d18] text-white placeholder-slate-500 border border-white/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-[13px] pt-1">
                  <label
                    className={`flex items-center gap-2.5 cursor-pointer select-none ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-100 border-slate-300 focus:ring-0"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="submitBtn"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-3.5 px-5 rounded-xl font-semibold text-xs sm:text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-md shadow-amber-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  <span id="submitBtnText">{isSubmitting ? 'Signing in…' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT: Minimal Role Buttons Section (lg:col-span-7) */}
          <section className="lg:col-span-7 w-full">
            <div
              className={`rounded-2xl p-6 sm:p-7 backdrop-blur-xl transition-all portal-card-right ${
                isLight
                  ? 'bg-[#ffffff]/90 border border-slate-200/70 shadow-sm'
                  : 'bg-[#0c1424]/70 border border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs sm:text-[13px] font-semibold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Quick Role Fill
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Select to populate
                </span>
              </div>

              {/* Minimal Role Buttons List */}
              <div id="roleGrid" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_ROLES.map((role) => {
                  const isManager = role.id === 'manager';
                  const isFulfiller = role.id === 'fulfiller';
                  const isDispatcher = role.id === 'dispatcher';
                  const isSelected =
                    isManager
                      ? selectedRoleId === 'manager' || selectedRoleId?.startsWith('manager-')
                      : isFulfiller
                      ? selectedRoleId === 'fulfiller' || selectedRoleId?.startsWith('fulfiller-')
                      : isDispatcher
                      ? selectedRoleId === 'dispatcher'
                      : selectedRoleId === role.id;

                  const Icon = role.icon;

                  return (
                    <React.Fragment key={role.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectRole(role)}
                        className={`w-full text-left flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all duration-150 cursor-pointer portal-role-btn ${
                          isSelected
                            ? 'portal-role-selected ' +
                              (isLight
                                ? 'bg-amber-400/15 border-amber-400/80 text-slate-950 ring-1 ring-amber-400/30'
                                : 'bg-amber-400/10 border-amber-400/70 text-white')
                            : isLight
                            ? 'bg-[#ffffff]/80 border-slate-200/80 hover:border-slate-300 hover:bg-[#ffffff] text-slate-700 shadow-2xs'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}
                          >
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-xs sm:text-[13.5px] font-medium truncate">
                            {role.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {(isDispatcher || isManager || isFulfiller) && (
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                (isDispatcher && dispatcherDropdownOpen) ||
                                (isFulfiller && fulfillerDropdownOpen) ||
                                (isManager && managerDropdownOpen)
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          )}
                          <span className="text-xs font-mono text-slate-400">
                            {role.num}
                          </span>
                        </div>
                      </button>

                      {/* Dispatcher minimal department options: ONLY name with button */}
                      {isDispatcher && dispatcherDropdownOpen && (
                        <div
                          className={`col-span-full p-3 rounded-xl border animate-in fade-in duration-200 portal-subdept-container ${
                            isLight
                              ? 'bg-slate-100/90 border-slate-200/80'
                              : 'bg-[#070d18]/90 border-white/10'
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {DISPATCHER_DEPARTMENTS.map((dept) => {
                              const DeptIcon = dept.icon;
                              const isDeptActive = isSelected && selectedDept === dept.id;
                              return (
                                <button
                                  type="button"
                                  key={dept.id}
                                  onClick={() => handleSelectDepartment(dept)}
                                  className={`w-full text-left flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all text-xs sm:text-[13px] font-medium cursor-pointer portal-subdept-btn ${
                                    isDeptActive
                                      ? 'portal-subdept-active ' +
                                        (isLight
                                          ? 'bg-amber-400/15 border-amber-400/80 text-slate-950'
                                          : 'bg-amber-400/10 border-amber-400/70 text-white')
                                      : isLight
                                      ? 'bg-[#ffffff] border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
                                      : 'bg-white/[0.04] border-white/5 hover:border-white/20 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${dept.color} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}
                                    >
                                      <DeptIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="truncate">{dept.name}</span>
                                  </div>
                                  {isDeptActive && (
                                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0 ml-1.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Task Fulfiller minimal department options: ONLY name with button */}
                      {isFulfiller && fulfillerDropdownOpen && (
                        <div
                          className={`col-span-full p-3 rounded-xl border animate-in fade-in duration-200 portal-subdept-container ${
                            isLight
                              ? 'bg-slate-100/90 border-slate-200/80'
                              : 'bg-[#070d18]/90 border-white/10'
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {FULFILLER_DEPARTMENTS.map((fd) => {
                              const profile = FULFILLER_PROFILES[fd.key];
                              const isDeptActive = isSelected && previewFulfillerDept === fd.key;
                              return (
                                <button
                                  type="button"
                                  key={fd.key}
                                  onClick={() => handleSelectFulfillerDept(fd.key)}
                                  className={`w-full text-left flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all text-xs sm:text-[13px] font-medium cursor-pointer portal-subdept-btn ${
                                    isDeptActive
                                      ? 'portal-subdept-active ' +
                                        (isLight
                                          ? 'bg-amber-400/15 border-amber-400/80 text-slate-950'
                                          : 'bg-amber-400/10 border-amber-400/70 text-white')
                                      : isLight
                                      ? 'bg-[#ffffff] border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
                                      : 'bg-white/[0.04] border-white/5 hover:border-white/20 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${profile.colorGradient} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}
                                    >
                                      <ClipboardCheck className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="truncate">{fd.name}</span>
                                  </div>
                                  {isDeptActive && (
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-1.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Department Manager minimal department options: ONLY name with button */}
                      {isManager && managerDropdownOpen && (
                        <div
                          className={`col-span-full p-3 rounded-xl border animate-in fade-in duration-200 portal-subdept-container ${
                            isLight
                              ? 'bg-slate-100/90 border-slate-200/80'
                              : 'bg-[#070d18]/90 border-white/10'
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {MANAGER_DEPARTMENTS.map((d) => {
                              const isDeptActive = isSelected && previewDepartment === d.id;
                              return (
                                <button
                                  type="button"
                                  key={d.id}
                                  onClick={() => handleSelectManagerDept(d.id)}
                                  className={`w-full text-left flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all text-xs sm:text-[13px] font-medium cursor-pointer portal-subdept-btn ${
                                    isDeptActive
                                      ? 'portal-subdept-active ' +
                                        (isLight
                                          ? 'bg-amber-400/15 border-amber-400/80 text-slate-950'
                                          : 'bg-amber-400/10 border-amber-400/70 text-white')
                                      : isLight
                                      ? 'bg-[#ffffff] border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-2xs'
                                      : 'bg-white/[0.04] border-white/5 hover:border-white/20 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                                      <Gauge className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="truncate">{d.name}</span>
                                  </div>
                                  {isDeptActive && (
                                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 ml-1.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Custom Alert Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-[13px] px-4 py-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
