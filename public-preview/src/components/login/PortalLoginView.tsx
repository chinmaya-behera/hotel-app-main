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
  Check,
  Info,
  Globe,
  Sparkles,
  X,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
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

export function PortalLoginView() {
  const router = useRouter();
  const { state, setTheme, setPersona } = useDemo();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Success Modal
  const [successModalRole, setSuccessModalRole] = useState<PresetRole | {
    name: string;
    email: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    path: string;
  } | null>(null);

  // Toast
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

  const activeRole = PRESET_ROLES.find((r) => r.id === selectedRoleId);

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
    const htmlEl = document.documentElement;
    if (nextTheme === 'light') {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
    } else {
      htmlEl.classList.remove('light');
      htmlEl.classList.add('dark');
    }
  };

  const handleForgotPassword = () => {
    if (email.trim()) {
      showToast(`Password reset link sent to ${email}`);
    } else {
      showToast('Enter your email address first');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const matchedRole = PRESET_ROLES.find((r) => r.email.toLowerCase() === cleanEmail);

    if (matchedRole) {
      if (matchedRole.personaId) {
        setPersona(matchedRole.personaId);
      }
      setSuccessModalRole(matchedRole);
    } else {
      setSuccessModalRole({
        name: 'Staff Member',
        email: email || 'user@thegrandadp.com',
        icon: Check,
        color: 'from-amber-500 to-yellow-600',
        path: '/staff/department-manager',
      });
    }
  };

  const enterDashboard = () => {
    if (!successModalRole) return;
    showToast('Redirecting to dashboard...');
    setTimeout(() => {
      router.push(successModalRole.path);
    }, 400);
  };

  return (
    <div className="bg-[#080d1a] dark:bg-[#080d1a] light:bg-slate-100 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 transition-colors duration-300 relative overflow-x-hidden">
      {/* Ambient background glow elements */}
      <div className="glow-sphere-1" />
      <div className="glow-sphere-2" />

      {/* Top Navigation Header */}
      <header className="relative z-20 border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-[#070c17]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand badge */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfb96c] to-[#a47b31] text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-900/20 ring-1 ring-amber-300/30 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-slate-100 block">
              The Grand ADP
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block -mt-0.5">
              Resort & Staff Portals
            </span>
          </div>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Public Site</span>
          </Link>

          <button
            type="button"
            onClick={handleReset}
            title="Clear form"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label="Toggle Theme"
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 transition-all"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area - Expansive Large Size Frontend */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 flex flex-col justify-center">
        {/* Prominent Portal Login Line & Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-500 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Operational Portals & Consoles</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Portal Login
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                Authenticate your department credentials or use the quick role selector to populate instant access.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl">
                9 Active Roles Configured
              </span>
            </div>
          </div>
        </div>

        {/* Grid Layout - Large size & generous spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT: Clean Login Card */}
          <section className="lg:col-span-5 w-full">
            <div className="rounded-3xl bg-white/85 dark:bg-[#0c1424]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/60 dark:border-white/5">
                <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Sign In
                </h2>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeRole ? `bg-gradient-to-r ${activeRole.color}` : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-semibold">{activeRole ? activeRole.name : 'Standard'}</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="emailInput"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      id="emailInput"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@thegrandadp.com"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="passwordInput"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="passwordInput"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-slate-50 dark:bg-[#070d18] text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-white/10 focus:ring-0"
                    />
                    <span>Remember this workstation</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="submitBtn"
                  className="w-full mt-3 py-3 sm:py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] hover:to-[#d8a84a] shadow-lg shadow-amber-900/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT: Minimal Role Buttons Section */}
          <section className="lg:col-span-7 w-full">
            <div className="rounded-3xl bg-white/75 dark:bg-[#0c1424]/75 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick Role Fill
                </span>
                <span className="text-xs text-slate-400 font-mono">Select to populate</span>
              </div>

              {/* Minimal Role Buttons List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {PRESET_ROLES.map((role) => {
                  const isSelected = role.id === selectedRoleId;
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`w-full text-left flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400/70 text-slate-900 dark:text-white ring-1 ring-amber-400/40 shadow-sm'
                          : 'bg-white/50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold truncate">
                          {role.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 ml-2 flex-shrink-0 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
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

      {/* Login Success Preview Modal */}
      {successModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/15 p-6 sm:p-7 shadow-2xl text-center">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg bg-gradient-to-br ${successModalRole.color}`}
            >
              <successModalRole.icon className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Welcome, {successModalRole.name}
            </h3>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              {successModalRole.email}
            </p>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={enterDashboard}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-[#dfb96c] to-[#c79a40] hover:from-[#e8c57b] transition-all shadow-md"
              >
                Enter Dashboard
              </button>
              <button
                type="button"
                onClick={() => setSuccessModalRole(null)}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-none">
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
