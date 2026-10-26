'use client';

import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Check,
  BedDouble,
  Sparkles,
} from 'lucide-react';
import type { InAppNotification } from '@/types/demo';

interface SupervisorNotificationsTabProps {
  notifications: InAppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab: (tab: string) => void;
}

export function SupervisorNotificationsTab({
  notifications,
  onMarkRead,
  onClearAll,
  onNavigateTab,
}: SupervisorNotificationsTabProps) {
  const supervisorNotifs = notifications.filter(
    (n) =>
      !n.targetRole ||
      n.targetRole === 'department_supervisor' ||
      n.targetRole === 'room_attendant_fulfiller' ||
      n.category === 'Operations' ||
      n.category === 'Incident',
  );

  const unreadCount = supervisorNotifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Department Operational Notifications
              </h2>
              <p className="text-xs text-mist-400">
                {unreadCount} unread alert{unreadCount === 1 ? '' : 's'} regarding turnover completions and breaches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearAll}
              className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-semibold text-mist-300 hover:text-white hover:bg-white/[0.06] transition flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {supervisorNotifs.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/10 bg-ink-900/60 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto" />
            <p className="text-sm font-bold text-white">All Caught Up!</p>
            <p className="text-xs text-mist-400">No unread notifications for your shift.</p>
          </div>
        ) : (
          supervisorNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-3xl border backdrop-blur-xl shadow-md transition flex items-start justify-between gap-4 ${
                n.read
                  ? 'border-white/10 bg-ink-900/60'
                  : 'border-amber-400/30 bg-amber-500/[0.05]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                    n.tone === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300'
                      : n.tone === 'warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </span>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{n.title}</p>
                    <span className="text-[10px] font-mono text-mist-400">{n.timestamp}</span>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-mist-300">{n.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className="p-1.5 rounded-lg border border-white/10 text-mist-400 hover:text-white transition"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigateTab('inspections')}
                  className="px-3 py-1 rounded-xl bg-white/[0.04] text-[11px] font-semibold text-mist-200 hover:text-white hover:bg-white/[0.08] transition"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
