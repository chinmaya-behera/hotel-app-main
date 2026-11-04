'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { MANAGER_DEPARTMENTS, MANAGER_DEMO_PASSWORD, type ManagerDepartmentId } from '@/lib/manager-domain';
import { DemoCredentialsDialog } from './DemoCredentialsDialog';
import type { RoleId } from '@/types/demo';

interface PresetRole {
  id: string;
  num: string;
  name: string;
  email: string;
  pass: string;
  icon: React.ComponentType<{ className?: string }>;
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
    name: 'Housekeeping Manager (legacy login)',
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

const DEMO_ACCOUNTS: PresetRole[] = [
  ...MANAGER_DEPARTMENTS.map((d, index) => ({ id: `manager-${d.id}`, num: `M${index + 1}`, name: `${d.name} Manager`, email: d.email, pass: MANAGER_DEMO_PASSWORD, icon: Gauge, color: 'from-purple-500 to-indigo-600', path: '/staff/department-manager', personaId: 'department_manager' as const, departmentId: d.id })),
  ...PRESET_ROLES,
];

export function PortalLoginView() {
  const router = useRouter();
  const { state, setTheme, setPersona, setManagerDepartment } = useDemo();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
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

  useEffect(() => {
    DEMO_ACCOUNTS.forEach((r) => {
      router.prefetch(r.path);
    });
  }, [router]);

  const activeRole = DEMO_ACCOUNTS.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (role: PresetRole) => {
    setSelectedRoleId(role.id);
    setEmail(role.email);
    setPassword(role.pass);
    showToast(`${role.name} loaded`);
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setSelectedRoleId(null);
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
    const matchedRole = DEMO_ACCOUNTS.find((r) => r.email.toLowerCase() === cleanEmail && r.pass === password);

    if (!matchedRole) {
      showToast('Email or password does not match a demo account. Open demo credentials to autofill.');
      return;
    }

    setIsSubmitting(true);

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
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 transition-colors duration-300 relative overflow-x-hidden portal-page-wrap ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#080d1a] text-slate-100'
      }`}
    >
      {/* Ambient background glow elements (hidden in light mode via CSS & condition) */}
      {!isLight && (
        <>
          <div className="glow-sphere-1" />
          <div className="glow-sphere-2" />
        </>
      )}

      {/* Top Navigation Header */}
      <header
        className={`relative z-20 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors login-header ${
          isLight
            ? 'border-slate-200 bg-[#ffffff] shadow-sm'
            : 'border-white/10 bg-[#070c17]/80'
        }`}
      >
        {/* Brand badge */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfb96c] to-[#a47b31] text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-900/20 ring-1 ring-amber-300/30 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span
              className={`font-bold text-sm sm:text-base tracking-wide block ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              The Grand ADP
            </span>
            <span
              className={`text-[11px] block -mt-0.5 font-medium ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Resort & Staff Portals
            </span>
          </div>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              isLight
                ? 'text-slate-700 hover:text-slate-950 border-slate-300 bg-[#ffffff] hover:bg-slate-100 shadow-xs'
                : 'text-slate-300 hover:text-white border-white/10 hover:border-white/20 bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>Public Site</span>
          </Link>

          <button
            type="button"
            onClick={handleReset}
            title="Clear form"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-950 border-slate-300 bg-[#ffffff] hover:bg-slate-100 shadow-xs'
                : 'text-slate-300 hover:text-white border-white/10 hover:border-white/20 bg-white/5'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isLight
                ? 'text-slate-800 border-slate-300 bg-[#ffffff] hover:bg-slate-100 shadow-xs'
                : 'text-slate-300 border-white/10 hover:bg-white/10 bg-white/5'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-amber-600" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </header>

      {/* Main Content Area - Expansive Large Size Frontend */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 flex flex-col justify-center">
        {/* Clean Portal Login Heading */}
        <div className="mb-8">
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}
          >
            Portal Login
          </h1>
        </div>

        {/* Grid Layout - Large size & generous spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT: Clean Login Card */}
          <section className="lg:col-span-5 w-full">
            <div
              className={`rounded-3xl border p-6 sm:p-8 transition-colors login-card ${
                isLight
                  ? 'bg-[#ffffff] border-slate-200/90 shadow-2xl shadow-slate-300/40 text-slate-900'
                  : 'bg-[#0c1424]/90 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/60 text-white'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-4 mb-6 border-b ${
                  isLight ? 'border-slate-200' : 'border-white/5'
                }`}
              >
                <h2
                  className={`text-sm font-bold tracking-wider uppercase login-card-title ${
                    isLight ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  Sign In
                </h2>
                <div
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold border login-card-badge ${
                    isLight
                      ? 'bg-slate-100 text-slate-800 border-slate-200'
                      : 'bg-white/5 text-slate-300 border-white/10'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeRole ? `bg-gradient-to-r ${activeRole.color}` : 'bg-slate-400'
                    }`}
                  />
                  <span>{activeRole ? activeRole.name : 'Standard'}</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="emailInput"
                    className={`block text-xs font-bold uppercase tracking-wider mb-2 login-card-label ${
                      isLight ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <span
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      id="emailInput"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@thegrandadp.com"
                      className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium login-input ${
                        isLight
                          ? 'bg-[#ffffff] text-slate-900 placeholder-slate-400 border-slate-300 shadow-xs'
                          : 'bg-[#070d18] text-white placeholder-slate-500 border-white/10'
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="passwordInput"
                      className={`block text-xs font-bold uppercase tracking-wider login-card-label ${
                        isLight ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="passwordInput"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium login-input ${
                        isLight
                          ? 'bg-[#ffffff] text-slate-900 placeholder-slate-400 border-slate-300 shadow-xs'
                          : 'bg-[#070d18] text-white placeholder-slate-500 border-white/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors cursor-pointer ${
                        isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                  <label
                    className={`flex items-center gap-2.5 cursor-pointer select-none font-medium login-card-label ${
                      isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 bg-slate-100 border-slate-300 focus:ring-0"
                    />
                    <span>Remember this workstation</span>
                  </label>
                </div>

                {/* Submit Button - Direct Sign In */}
                <button
                  type="submit"
                  id="submitBtn"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-3 sm:py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-lg shadow-amber-900/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <DemoCredentialsDialog accounts={DEMO_ACCOUNTS} onSelect={handleSelectRole}/>
            </div>
          </section>

          {/* RIGHT: Minimal Role Buttons Section */}
          <section className="lg:col-span-7 w-full">
            <div
              className={`rounded-3xl border p-6 sm:p-7 transition-colors login-card ${
                isLight
                  ? 'bg-[#ffffff] border-slate-200/90 shadow-2xl shadow-slate-300/40 text-slate-900'
                  : 'bg-[#0c1424]/75 backdrop-blur-2xl border-white/10 shadow-xl text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <span
                  className={`text-xs sm:text-sm font-bold uppercase tracking-wider login-card-title ${
                    isLight ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  Quick Role Fill
                </span>
                <span className={`text-xs font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Select to populate
                </span>
              </div>

              {/* Minimal Role Buttons List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {DEMO_ACCOUNTS.filter(role => role.id !== 'manager').map((role) => {
                  const isSelected = role.id === selectedRoleId;
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`w-full text-left flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer login-role-btn ${
                        isSelected ? 'active' : ''
                      } ${
                        isSelected
                          ? isLight
                            ? 'bg-amber-50/90 border-2 border-amber-500 text-slate-950 ring-2 ring-amber-400/30 shadow-md'
                            : 'bg-amber-400/10 border-amber-400/70 text-white ring-1 ring-amber-400/40 shadow-sm'
                          : isLight
                          ? 'bg-slate-50/90 border-slate-200 hover:bg-[#ffffff] hover:border-slate-300 text-slate-800 shadow-xs hover:shadow-sm'
                          : 'bg-white/[0.03] border-white/5 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <span className={`text-xs sm:text-sm truncate ${isSelected && isLight ? 'font-bold text-slate-950' : 'font-semibold'}`}>
                          {role.name}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-mono ml-2 flex-shrink-0 px-2 py-0.5 rounded font-medium login-role-num ${
                          isSelected && isLight
                            ? 'bg-amber-200 text-amber-950 font-bold'
                            : isLight
                            ? 'bg-slate-200/90 text-slate-700'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {role.num}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Custom Alert Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-none">
          <div
            className={`text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 ${
              isLight
                ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/40'
                : 'bg-slate-900 text-white border-white/10'
            }`}
          >
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
