'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Hotel,
  House,
  LogOut,
  Moon,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Sun,
  User,
  X,
  ChevronDown,
  ArrowUpRight,
  Building,
  Clock,
  MapPin,
  Mail,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ServiceAuthorityModal } from '@/components/shared/ServiceAuthorityModal';
import { GestureGuideModal } from '@/components/shared/GestureGuideModal';
import { useDemo } from '@/lib/store';
import { managerDepartment, managerNotifications } from '@/lib/manager-domain';
import { HOME_ACCENT, quickLinks, roles, roleById } from '@/lib/roles';
import { accentVars, cn } from '@/lib/utils';
import type { ActiveId, RoleId, StaffAccount } from '@/types/demo';

interface TopBarProps {
  active: ActiveId;
  showRail?: boolean;
  hideGestureButton?: boolean;
}

export function TopBar({ active, showRail = true, hideGestureButton = false }: TopBarProps) {
  const router = useRouter();
  const { state, reset, setTheme, markNotificationRead, clearAllNotifications, departmentManagerCommand, gestureGuideOpen, setGestureGuideOpen } = useDemo();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isRole = active !== 'home' && active !== 'guest' && active !== 'site';
  const roleId = isRole ? (active as RoleId) : null;
  const role = roleId ? roleById[roleId] : null;

  const isDispatcherSupervisor =
    roleId === 'department_dispatcher_supervisor' ||
    roleId === 'department_dispatcher' ||
    roleId === 'department_supervisor';

  const shouldHideGestureButton = hideGestureButton || isDispatcherSupervisor;

  // Active employee record from shared staff roster
  const department = managerDepartment(state.managerDepartment);
  const managerStaff = roleId === 'department_manager' ? { name: state.managerProfiles?.[department.id]?.name || department.person, employeeId: `MGR-${department.id.toUpperCase()}`, department: department.name, shift: 'Day' as const, floorZone: 'Property-Wide', email: `${department.id}@thegrandadp.com`, financialLimit: 15000 } : null;
  const staff = managerStaff ?? (roleId
    ? (state.staffAccounts ?? []).find((s) => {
        if (
          roleId === 'department_dispatcher_supervisor' ||
          roleId === 'department_dispatcher' ||
          roleId === 'department_supervisor'
        ) {
          const isDispRole =
            s.roleId === 'department_dispatcher_supervisor' ||
            s.roleId === 'department_dispatcher' ||
            s.roleId === 'department_supervisor';
          if (!isDispRole) return false;

          const activeDept = state.activeDispatcherDept || 'Housekeeping';
          const d = s.department.toLowerCase();
          if (activeDept === 'Housekeeping') return d.includes('house');
          if (activeDept === 'Wellness') return d.includes('spa') || d.includes('wellness');
          if (activeDept === 'Maintenance & Engineering') return d.includes('maint') || d.includes('eng');
          if (activeDept === 'Food & Beverages') return d.includes('food') || d.includes('bev');
          return true;
        }

        if (roleId === 'general_manager' || roleId === 'executive_viewer') {
          return s.roleId === 'general_manager' || s.roleId === 'executive_viewer';
        }

        return s.roleId === roleId;
      }) ?? {
        id: `staff-${roleId}`,
        name:
          roleId === 'department_dispatcher_supervisor'
            ? state.activeDispatcherDept === 'Wellness'
              ? 'Ananya Deshmukh'
              : state.activeDispatcherDept === 'Maintenance & Engineering'
              ? 'Arjun Mehta'
              : state.activeDispatcherDept === 'Food & Beverages'
              ? 'Marco Rossi'
              : 'Meera Nambiar'
            : role?.name ?? 'Staff Member',
        employeeId:
          roleId === 'department_dispatcher_supervisor'
            ? state.activeDispatcherDept === 'Wellness'
              ? 'EMP-0118'
              : state.activeDispatcherDept === 'Maintenance & Engineering'
              ? 'EMP-0104'
              : state.activeDispatcherDept === 'Food & Beverages'
              ? 'EMP-0116'
              : 'EMP-0105'
            : 'EMP-0100',
        email:
          roleId === 'department_dispatcher_supervisor'
            ? state.activeDispatcherDept === 'Wellness'
              ? 'a.deshmukh@thegrandadp.com'
              : state.activeDispatcherDept === 'Maintenance & Engineering'
              ? 'a.mehta@thegrandadp.com'
              : state.activeDispatcherDept === 'Food & Beverages'
              ? 'm.rossi@thegrandadp.com'
              : 'm.nambiar@thegrandadp.com'
            : `${(role?.name ?? 'staff').toLowerCase().replace(/\s+/g, '.')}@grandazure.com`,
        department:
          roleId === 'department_dispatcher_supervisor'
            ? state.activeDispatcherDept || 'Housekeeping'
            : role?.scopes[0] ?? 'Operations',
        shift: 'Day' as const,
        floorZone:
          roleId === 'department_dispatcher_supervisor'
            ? state.activeDispatcherDept === 'Wellness'
              ? 'Level 2 & Wellness Pavilion'
              : state.activeDispatcherDept === 'Maintenance & Engineering'
              ? 'All Floors & Plant Rooms'
              : state.activeDispatcherDept === 'Food & Beverages'
              ? 'Kitchen & In-Room Dining'
              : 'Floors 1–5'
            : 'Property-Wide',
        financialLimit: 25000,
        roleId,
        status: 'active' as const,
        createdAt: '2026-01-01',
      }
    : null);

  // Notifications for this specific active role
  const roleNotifications = roleId === 'department_manager' ? managerNotifications(state, department.id) : (state.notifications ?? []).filter((n) => !roleId || n.roleId === roleId);
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  // Close notification & profile popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileCardOpen(false);
      }
    }
    if (notifDropdownOpen || profileCardOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifDropdownOpen, profileCardOpen]);

  function handleLogoutConfirm() {
    setLogoutModalOpen(false);
    router.push('/login');
  }

  const isLight = state.theme === 'light';
  const isFd = roleId === 'front_desk_coordinator';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className={cn("mx-auto flex max-w-7xl items-center gap-3", isFd ? "px-4 sm:px-5 py-1.5 h-[52px] min-h-[52px]" : "px-4 py-3 sm:px-6")}>
          {/* Brand & Home Navigation */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            title="The Grand ADP Resort · View Public Website"
          >
            <span
              className={cn("icon-tile shrink-0", isFd ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl")}
              style={accentVars(role ?? HOME_ACCENT)}
            >
              <Hotel className="h-5 w-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className={cn("block font-display text-white", isFd ? "text-sm sm:text-base leading-snug" : "text-lg")}>The Grand ADP</span>
              <span className={cn("block uppercase text-mist-400", isFd ? "text-[9px] tracking-[0.2em]" : "text-[10px] tracking-[0.22em]")}>
                {isRole ? `${role?.name} Portal` : 'Resort · Staff Portals'}
              </span>
            </span>
          </Link>

          {/* Right Header Content */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {isRole && staff ? (
              /* Authentic Employee Account Header */
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Clickable Employee Profile Button & Popover Card */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isFd) {
                        window.dispatchEvent(new CustomEvent('fd-open-profile-drawer'));
                        return;
                      }
                      setProfileCardOpen(!profileCardOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className={cn(
                      'flex items-center rounded-full border shadow-inner transition-all text-left focus:outline-none focus:ring-2 focus:ring-amber-400/30 cursor-pointer',
                      isFd ? 'gap-2 py-0.5 pl-1 pr-2.5 text-xs' : 'gap-2.5 py-1 pl-1.5 pr-3',
                      profileCardOpen
                        ? isLight
                          ? 'border-amber-400 bg-white shadow-md'
                          : 'border-amber-400/50 bg-white/[0.1] shadow-lg shadow-amber-400/10'
                        : isLight
                          ? 'border-slate-300 bg-white hover:border-slate-400'
                          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]'
                    )}
                    style={isLight ? { backgroundColor: '#ffffff' } : undefined}
                    title="Click to view logged-in profile & role authority policies"
                    aria-expanded={profileCardOpen}
                  >
                    <div
                      className={cn("grid place-items-center rounded-full font-bold text-white shadow-sm shrink-0", isFd ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs")}
                      style={{
                        background: `linear-gradient(135deg, rgb(${role?.accent ?? '52 211 153'}), rgb(${role?.accent2 ?? '16 185 129'}))`,
                      }}
                    >
                      {staff.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="hidden text-left sm:block">
                      <p
                        className="text-xs font-bold leading-tight flex items-center gap-1"
                        style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                      >
                        <span>{staff.name}</span>
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 transition-transform duration-200',
                            profileCardOpen
                              ? isLight ? 'rotate-180 text-amber-600' : 'rotate-180 text-amber-300'
                              : isLight ? 'text-slate-500' : 'text-mist-400'
                          )}
                        />
                      </p>
                      <p
                        className="text-[10px] leading-tight font-medium"
                        style={{ color: isLight ? '#334155' : '#94a3b8' }}
                      >
                        {staff.department} · {staff.shift} Shift
                      </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Active on duty" />
                  </button>

                  {/* Profile Details Dropdown Card */}
                  {profileCardOpen && (
                    <div
                      className={cn(
                        'staff-profile-card absolute right-0 top-full mt-2 w-84 sm:w-96 rounded-3xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl shadow-2xl overflow-hidden border-2',
                        isLight
                          ? 'border-slate-300 shadow-[0_25px_60px_-15px_rgba(1,31,75,0.18)]'
                          : 'border-slate-600/90 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.15)] ring-1 ring-amber-400/30'
                      )}
                      style={{
                        backgroundColor: isLight ? '#ffffff' : '#121a2e',
                        color: isLight ? '#0f172a' : '#ffffff',
                      }}
                    >
                      {/* Top ambient luxury highlight line */}
                      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                      {/* Card Header with Avatar & Online Badge */}
                      <div
                        className="flex items-start justify-between pb-4 border-b"
                        style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="grid h-12 w-12 place-items-center rounded-2xl text-base font-bold text-white shadow-md border shrink-0"
                            style={{
                              background: `linear-gradient(135deg, rgb(${role?.accent ?? '52 211 153'}), rgb(${role?.accent2 ?? '16 185 129'}))`,
                              borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                            }}
                          >
                            {staff.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="font-display text-base font-bold truncate tracking-tight"
                              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                            >
                              {staff.name}
                            </h3>
                            <p
                              className="text-xs truncate font-semibold profile-dept-text mt-0.5"
                              style={{ color: isLight ? '#1e40af' : '#93c5fd' }}
                            >
                              {role?.name || staff.department}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: isLight ? '#047857' : '#34d399' }}
                              >
                                Active · On Duty
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setProfileCardOpen(false)}
                          className={cn(
                            'rounded-xl p-1.5 transition-colors cursor-pointer',
                            isLight
                              ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          )}
                          title="Close profile card"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>

                      {/* Logged-In Person Details Panel */}
                      <div
                        className="my-4 rounded-2xl p-3.5 space-y-2.5 text-xs border"
                        style={{
                          backgroundColor: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.4)',
                          borderColor: isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.8)',
                        }}
                      >
                        <div
                          className="flex items-center justify-between pb-2 border-b"
                          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <span
                            className="flex items-center gap-2 font-medium"
                            style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                          >
                            <User className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Employee ID
                          </span>
                          <span
                            className="font-mono font-bold"
                            style={{ color: isLight ? '#b45309' : '#fcd34d' }}
                          >
                            {staff.employeeId}
                          </span>
                        </div>

                        <div
                          className="flex items-center justify-between pb-2 border-b"
                          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <span
                            className="flex items-center gap-2 font-medium"
                            style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                          >
                            <Building className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Department
                          </span>
                          <span
                            className="font-bold text-xs"
                            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                          >
                            {staff.department}
                          </span>
                        </div>

                        <div
                          className="flex items-center justify-between pb-2 border-b"
                          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <span
                            className="flex items-center gap-2 font-medium"
                            style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Shift Schedule
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}
                          >
                            {staff.shift} Shift (07:00 - 15:30)
                          </span>
                        </div>

                        <div
                          className="flex items-center justify-between pb-2 border-b"
                          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <span
                            className="flex items-center gap-2 font-medium"
                            style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                          >
                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Zone / Station
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}
                          >
                            {('floorZone' in staff ? staff.floorZone : undefined) || 'Property-Wide'}
                          </span>
                        </div>

                        <div
                          className="flex items-center justify-between pb-2 border-b"
                          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <span
                            className="flex items-center gap-2 font-medium"
                            style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                          >
                            <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Work Email
                          </span>
                          <span
                            className="font-mono text-[11px] truncate max-w-[190px] font-medium"
                            style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}
                          >
                            {('email' in staff ? staff.email : undefined) || `${staff.name.toLowerCase().replace(/\s+/g, '.')}@grandazure.com`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span
                            className="flex items-center gap-2 font-medium"
                            style={{ color: isLight ? '#475569' : '#cbd5e1' }}
                          >
                            <CreditCard className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Financial Limit
                          </span>
                          <span
                            className="font-mono font-bold"
                            style={{ color: isLight ? '#047857' : '#34d399' }}
                          >
                            {'financialLimit' in staff && staff.financialLimit ? `₹${staff.financialLimit.toLocaleString('en-IN')}` : 'Operational Scope'}
                          </span>
                        </div>
                      </div>

                      {/* Embedded Policies & Authority Button */}
                      <div
                        className="pt-2 space-y-2 border-t"
                        style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.8)' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setProfileCardOpen(false);
                            setPoliciesModalOpen(true);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-2xl border transition text-left group shadow-sm cursor-pointer',
                            isLight
                              ? 'border-amber-300 hover:border-amber-400 hover:bg-amber-100/70'
                              : 'border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-white shadow-amber-400/10'
                          )}
                          style={isLight ? { backgroundColor: '#fffbeb' } : undefined}
                          title="View service authority limits, policies, and escalation pathways"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="grid h-8 w-8 place-items-center rounded-xl border shrink-0"
                              style={{
                                backgroundColor: isLight ? '#fef3c7' : 'rgba(251, 191, 36, 0.25)',
                                color: isLight ? '#b45309' : '#fcd34d',
                                borderColor: isLight ? '#fde68a' : 'rgba(251, 191, 36, 0.5)',
                              }}
                            >
                              <ShieldCheck className="h-4 w-4" aria-hidden />
                            </div>
                            <div>
                              <p
                                className="text-xs font-bold transition-colors"
                                style={{ color: isLight ? '#78350f' : '#ffffff' }}
                              >
                                Service Policies & Authority
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: isLight ? '#92400e' : 'rgba(252, 211, 77, 0.9)' }}
                              >
                                Limits, SOP standards & escalation tiers
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            style={{ color: isLight ? '#b45309' : '#fcd34d' }}
                          />
                        </button>

                        {/* Sign out link inside profile card */}
                        <button
                          type="button"
                          onClick={() => {
                            setProfileCardOpen(false);
                            setLogoutModalOpen(true);
                          }}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer',
                            isLight
                              ? 'border-rose-200 hover:bg-rose-100'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white'
                          )}
                          style={isLight ? { backgroundColor: '#fff1f2', color: '#be123c' } : undefined}
                        >
                          <LogOut className="h-3.5 w-3.5" aria-hidden />
                          <span>Sign Out Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Bell with Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isFd) {
                        window.dispatchEvent(new CustomEvent('fd-open-notifications-drawer'));
                        return;
                      }
                      setNotifDropdownOpen(!notifDropdownOpen);
                    }}
                    className={cn("relative grid place-items-center border border-white/10 bg-white/[0.04] text-mist-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white", isFd ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl")}
                    title="In-app role notifications"
                    aria-label={`Notifications, ${unreadCount} unread`}
                  >
                    <Bell className="h-4 w-4" aria-hidden />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Popover Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-2xl z-50">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {roleNotifications.length > 0 && (
                            <button
                              type="button"
                    onClick={() => roleId === 'department_manager' ? roleNotifications.filter(n => !n.read).forEach(n => departmentManagerCommand({ type: 'read', notificationId: n.id })) : clearAllNotifications(roleId ?? undefined)}
                              className="text-[11px] text-mist-400 hover:text-white transition-colors"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setNotifDropdownOpen(false)}
                            className="text-mist-400 hover:text-white"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </div>

                      {/* Security Safety Alert Highlight Banner */}
                      <div className="mt-3 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-left text-xs text-rose-200">
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white text-[11px] uppercase tracking-wide">
                              Safety Alert (From Security)
                            </span>
                            <span className="text-[10px] text-rose-300 font-mono">SFT-SEC-01</span>
                          </div>
                          <p className="text-[11px] text-rose-200/90 leading-tight mt-0.5">
                            Level 3 Emergency Fire Door breach sensor active. Patrol Unit 1 deployed.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto no-scrollbar">
                        {roleNotifications.length === 0 ? (
                          <p className="py-6 text-center text-xs text-mist-400">No new notifications for your shift.</p>
                        ) : (
                          roleNotifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={cn(
                                'flex items-start justify-between gap-3 rounded-xl p-2.5 transition-colors text-left',
                                notif.read ? 'bg-white/[0.02] text-mist-300' : 'bg-white/[0.06] text-white border border-white/10',
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold truncate">{notif.title}</p>
                                  <span className="text-[10px] text-mist-400 shrink-0">{notif.timestamp}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-mist-300 leading-relaxed">{notif.message}</p>
                              </div>
                              {!notif.read && (
                                <button
                                  type="button"
                                  onClick={() => markNotificationRead(notif.id)}
                                  className="shrink-0 text-mist-400 hover:text-emerald-400 p-1"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={() => setTheme(isLight ? 'dark' : 'light')}
                  className={cn("grid place-items-center border border-white/10 bg-white/[0.04] text-mist-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white", isFd ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl")}
                  title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label="Toggle theme"
                >
                  {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
                </button>

                {/* Gesture Guide Emoji Button (Only emoji, no text) - hidden in Department Dispatcher / Supervisor portal */}
                {!shouldHideGestureButton && (
                  <button
                    type="button"
                    onClick={() => setGestureGuideOpen(true)}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-base transition-all hover:border-amber-400/40 hover:bg-amber-400/10 hover:scale-105 active:scale-95 cursor-pointer"
                    title="Gesture & Keyboard Shortcuts"
                    aria-label="Gesture and keyboard shortcut instructions"
                  >
                    🖐️
                  </button>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className={cn("flex items-center border border-rose-400/30 bg-rose-500/10 font-semibold text-rose-300 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-200", isFd ? "gap-1.5 px-2.5 py-1 text-xs rounded-lg" : "gap-1.5 px-3 py-1.5 text-xs rounded-xl")}
                  title="Sign out of this staff account"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              /* Public / Portal Login View Controls */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(isLight ? 'dark' : 'light')}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label="Toggle theme"
                >
                  {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
                </button>
                <Button size="sm" variant="subtle" iconLeft={RotateCcw} onClick={reset} title="Reset demo data to initial state">
                  <span className="hidden md:inline">Reset demo</span>
                  <span className="sr-only md:hidden">Reset demo</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* The 9-Role Switcher Rail is ONLY rendered when active === 'home' (/login) */}
        {!isRole && showRail && (
          <nav aria-label="Switch staff portal" className="border-t border-white/[0.05]">
            <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
              <Link href="/login" className="rail-chip" style={accentVars(HOME_ACCENT)} aria-current={active === 'home' ? 'page' : undefined}>
                <House className="h-3.5 w-3.5" aria-hidden />
                Staff Login
              </Link>
              <span className="mx-1 h-4 w-px flex-none bg-white/10" aria-hidden />
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.id}
                    href={r.path}
                    className="rail-chip"
                    style={accentVars(r)}
                    aria-current={(active as string) === r.id ? 'page' : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {r.short}
                  </Link>
                );
              })}
              <span className="mx-1 h-4 w-px flex-none bg-white/10" aria-hidden />
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="rail-chip"
                    style={accentVars(link)}
                    aria-current={active === link.id ? 'page' : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {link.short}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Realistic Logout Confirmation Modal */}
      {logoutModalOpen && staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-ink-900 p-6 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-400">
                <LogOut className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg text-white">Sign out of employee session?</h3>
                <p className="mt-1 text-xs text-mist-300">
                  You are currently logged in as <strong className="text-white">{staff.name}</strong> ({staff.department} · {role?.name}).
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-mist-300 space-y-1">
                  <p><span className="text-mist-400">Employee ID:</span> {staff.employeeId}</p>
                  <p><span className="text-mist-400">Shift Status:</span> {staff.shift} Shift · Active</p>
                  <p className="text-[11px] text-mist-400 mt-1">Unsaved client-side inputs will be stored in your browser session.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-mist-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="rounded-xl border border-rose-400/40 bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-colors"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Service Authority & Policies Modal */}
      {policiesModalOpen && roleId && (
        <ServiceAuthorityModal
          isOpen={policiesModalOpen}
          onClose={() => setPoliciesModalOpen(false)}
          roleId={roleId}
        />
      )}
      {/* Reusable Gesture & Shortcut Guide Modal */}
      {!shouldHideGestureButton && (
        <GestureGuideModal
          isOpen={gestureGuideOpen}
          onClose={() => setGestureGuideOpen(false)}
        />
      )}
    </>
  );
}
