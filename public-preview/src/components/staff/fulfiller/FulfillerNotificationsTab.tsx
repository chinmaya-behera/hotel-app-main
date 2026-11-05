'use client';

import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Volume2, VolumeX, ArrowRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playChime } from './chime';
import { FULFILLER_PROFILES, type FulfillerProfile, taskMatchesFulfillerDept } from './fulfillerProfiles';

interface FulfillerNotificationsTabProps {
  profile?: FulfillerProfile;
  onNavigateToTasks?: (taskId?: string) => void;
}

type NotifFilter = 'all' | 'unread' | 'tasks' | 'alerts';

export function FulfillerNotificationsTab({ profile, onNavigateToTasks }: FulfillerNotificationsTabProps) {
  const { state, setSoundEnabled, markNotificationRead, clearAllNotifications } = useDemo();
  const activeProfile = profile || FULFILLER_PROFILES.housekeeping;
  const [filter, setFilter] = useState<NotifFilter>('all');

  const allFulfillerNotifications = (state.notifications ?? []).filter((n) => {
    if (n.roleId !== 'task_fulfiller') return false;
    if (n.department) {
      return taskMatchesFulfillerDept({ department: n.department } as any, activeProfile.deptKey);
    }
    return true;
  });

  const unreadCount = allFulfillerNotifications.filter((n) => !n.read).length;
  const isSoundOn = state.soundEnabled ?? true;

  const filteredNotifications = allFulfillerNotifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'tasks') return n.type === 'task';
    if (filter === 'alerts') return n.type === 'alert' || n.type === 'system';
    return true;
  });

  function handleTestSound() {
    if (!isSoundOn) {
      setSoundEnabled(true);
    }
    playChime();
  }

  function handleAcknowledgeAll() {
    allFulfillerNotifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
    if (isSoundOn) playChime();
  }

  return (
    <div className="flex flex-col gap-4 pb-24 text-white">
      {/* Sound Preference Card */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl transition-colors',
              isSoundOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-mist-400',
            )}
          >
            {isSoundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">In-App Chime Audio</p>
            <p className="text-[11px] text-mist-400">
              {isSoundOn ? 'Melodic chime plays on new task dispatches' : 'Sound alerts muted'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestSound}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-mist-300 hover:text-white"
          >
            Test
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!isSoundOn)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
              isSoundOn ? 'bg-emerald-500' : 'bg-white/20',
            )}
            role="switch"
            aria-checked={isSoundOn}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                isSoundOn ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </div>

      {/* Header with Counters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            <span>{activeProfile.departmentName} Alerts & Dispatches</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-[11px] text-mist-400 mt-0.5">
            Supervisor instructions, quality sign-offs and room dispatch orders for {activeProfile.employeeName}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Ack All
            </button>
          )}
          {allFulfillerNotifications.length > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications('task_fulfiller')}
              className="flex items-center gap-1 text-[11px] font-medium text-mist-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
            filter === 'all'
              ? 'bg-emerald-500 text-ink-950 font-bold shadow-md shadow-emerald-500/20'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          All ({allFulfillerNotifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
            filter === 'unread'
              ? 'bg-amber-400 text-ink-950 font-bold shadow-md shadow-amber-400/20'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('tasks')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
            filter === 'tasks'
              ? 'bg-sky-400 text-ink-950 font-bold shadow-md shadow-sky-400/20'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Task Dispatches
        </button>

        <button
          type="button"
          onClick={() => setFilter('alerts')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
            filter === 'alerts'
              ? 'bg-purple-400 text-ink-950 font-bold shadow-md shadow-purple-400/20'
              : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
          )}
        >
          Supervisor Notes
        </button>
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-12 px-4 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-mist-400">
              <Bell className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-white">No alerts in this view</p>
            <p className="mt-0.5 text-[11px] text-mist-400">All notifications for this shift have been acknowledged.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border p-3.5 transition-all text-left',
                notif.read
                  ? 'border-white/5 bg-white/[0.02] text-mist-300'
                  : 'border-emerald-500/25 bg-emerald-500/[0.05] text-white shadow-sm',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />}
                      <h4 className="text-xs font-semibold truncate text-white">{notif.title}</h4>
                    </div>
                    <span className="text-[10px] text-mist-400 font-mono shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs text-mist-300 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              {/* Action Strip: Acknowledge & Open Task */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06] text-xs">
                <span className="text-[10px] text-mist-400 uppercase tracking-wider font-mono">
                  {notif.department || activeProfile.departmentName}
                </span>

                <div className="flex items-center gap-2">
                  {notif.itemId && onNavigateToTasks && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!notif.read) markNotificationRead(notif.id);
                        onNavigateToTasks(notif.itemId);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                    >
                      <span>View Task</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}

                  {!notif.read ? (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (isSoundOn) playChime();
                      }}
                      className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-mist-200 hover:bg-white/20 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-mist-500 font-mono">Acknowledged ✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
