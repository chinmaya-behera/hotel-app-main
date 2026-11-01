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
  Sun,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ServiceAuthorityModal } from '@/components/shared/ServiceAuthorityModal';
import { useDemo } from '@/lib/store';
import { HOME_ACCENT, quickLinks, roles, roleById } from '@/lib/roles';
import { accentVars, cn } from '@/lib/utils';
import type { ActiveId, RoleId } from '@/types/demo';

interface TopBarProps {
  active: ActiveId;
  showRail?: boolean;
}

export function TopBar({ active, showRail = true }: TopBarProps) {
  const router = useRouter();
  const { state, reset, setTheme, markNotificationRead, clearAllNotifications } = useDemo();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isRole = active !== 'home' && active !== 'guest' && active !== 'site';
  const roleId = isRole ? (active as RoleId) : null;
  const role = roleId ? roleById[roleId] : null;

  // Active employee record from shared staff roster
  const staff = roleId
    ? (state.staffAccounts ?? []).find(
        (s) =>
          s.roleId === roleId ||
          (roleId === 'department_dispatcher_supervisor' &&
            (s.roleId === 'department_dispatcher' || s.roleId === 'department_supervisor')) ||
          ((roleId === 'general_manager' || roleId === 'executive_viewer') &&
            (s.roleId === 'general_manager' || s.roleId === 'executive_viewer')),
      ) ?? {
        name: role?.name ?? 'Staff Member',
        employeeId: 'EMP-0100',
        department: role?.scopes[0] ?? 'Operations',
        shift: 'Day' as const,
      }
    : null;

  // Notifications for this specific active role
  const roleNotifications = (state.notifications ?? []).filter((n) => !roleId || n.roleId === roleId);
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    if (notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifDropdownOpen]);

  function handleLogoutConfirm() {
    setLogoutModalOpen(false);
    router.push('/login');
  }

  const isLight = state.theme === 'light';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Brand & Home Navigation */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            title="The Grand ADP Resort · View Public Website"
          >
            <span
              className="icon-tile h-10 w-10 shrink-0 rounded-xl"
              style={accentVars(role ?? HOME_ACCENT)}
            >
              <Hotel className="h-5 w-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg text-white">The Grand ADP</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-mist-400">
                {isRole ? `${role?.name} Portal` : 'Resort · Staff Portals'}
              </span>
            </span>
          </Link>

          {/* Right Header Content */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {isRole && staff ? (
              /* Authentic Employee Account Header */
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Employee Card Pill */}
                <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-3 shadow-inner">
                  <div
                    className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, rgb(${role?.accent ?? '52 211 153'}), rgb(${role?.accent2 ?? '16 185 129'}))`,
                    }}
                  >
                    {staff.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold leading-tight text-white">{staff.name}</p>
                    <p className="text-[10px] text-mist-400 leading-tight">
                      {staff.department} · {staff.shift} Shift
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Active on duty" />
                </div>

                {/* Notifications Bell with Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
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
                              onClick={() => clearAllNotifications(roleId ?? undefined)}
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
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label="Toggle theme"
                >
                  {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
                </button>

                {/* Policies & Service Authority Button */}
                <button
                  type="button"
                  onClick={() => setPoliciesModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-mist-300 transition-colors hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-200"
                  title="View service authority limits, policies, and escalation pathways"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                  <span className="hidden sm:inline">Policies</span>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-200"
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
                    aria-current={active === r.id ? 'page' : undefined}
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
    </>
  );
}
