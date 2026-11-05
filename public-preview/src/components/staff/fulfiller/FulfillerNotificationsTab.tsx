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
    const isForFulfiller =
      n.roleId === 'task_fulfiller' || (n as any).targetRole === 'task_fulfiller';
    if (!isForFulfiller) return false;
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

  function handleAcknowledgeAll() {
    allFulfillerNotifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
    if (isSoundOn) playChime();
  }

  return (
    <div className="flex flex-col gap-4 pb-24 text-white">
      {/* Sound Preference Card */}
      <div className="flex items-center justify-between rounded-2xl border border-[rgba(165,130,95,0.25)] bg-[#1a1918] p-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl transition-colors',
              isSoundOn
                ? 'bg-[rgba(200,169,110,0.15)] text-[#dfc187]'
                : 'bg-white/10 text-mist-400',
            )}
          >
            {isSoundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#f7f4ed]">Audio Alerts</p>
            <p className="text-[11px] text-[#ded6c9]">
              {isSoundOn ? 'Task dispatch chime enabled' : 'Muted'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled(!isSoundOn)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            isSoundOn ? 'bg-[#c8a96e]' : 'bg-white/20',
          )}
          role="switch"
          aria-checked={isSoundOn}
          title={isSoundOn ? 'Mute chime' : 'Enable chime'}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
              isSoundOn ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* Header with Counters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-sm font-bold text-[#f7f4ed] flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#dfc187]" />
            <span>{activeProfile.departmentName} Alerts & Dispatches</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[rgba(200,169,110,0.18)] border border-[rgba(165,130,95,0.35)] px-2 py-0.5 text-[10px] font-bold text-[#dfc187] animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-[11px] text-[#ded6c9] mt-0.5">
            Supervisor updates and room dispatch notifications
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#dfc187] hover:text-[#f7f4ed] transition-colors cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Ack All
            </button>
          )}
          {allFulfillerNotifications.length > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications('task_fulfiller')}
              className="flex items-center gap-1 text-[11px] font-medium text-[#a89f91] hover:text-rose-400 transition-colors cursor-pointer"
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
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
            filter === 'all'
              ? 'bg-[#c8a96e] text-[#14120e] font-bold shadow-md'
              : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
          )}
        >
          All ({allFulfillerNotifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
            filter === 'unread'
              ? 'bg-[#c8a96e] text-[#14120e] font-bold shadow-md'
              : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
          )}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('tasks')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
            filter === 'tasks'
              ? 'bg-[#c8a96e] text-[#14120e] font-bold shadow-md'
              : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
          )}
        >
          Task Dispatches
        </button>

        <button
          type="button"
          onClick={() => setFilter('alerts')}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
            filter === 'alerts'
              ? 'bg-[#c8a96e] text-[#14120e] font-bold shadow-md'
              : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
          )}
        >
          Supervisor Notes
        </button>
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(165,130,95,0.2)] bg-white/[0.02] py-12 px-4 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-[#a89f91]">
              <Bell className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-[#f7f4ed]">No alerts in this view</p>
            <p className="mt-0.5 text-[11px] text-[#ded6c9]">All notifications for this shift have been acknowledged.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border p-3.5 transition-all text-left',
                notif.read
                  ? 'border-[rgba(165,130,95,0.2)] bg-white/[0.02] text-[#ded6c9]'
                  : 'border-[rgba(200,169,110,0.35)] bg-[rgba(200,169,110,0.06)] text-[#f7f4ed] shadow-sm',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-[#dfc187] shrink-0" />}
                      <h4 className="text-xs font-semibold truncate text-[#f7f4ed]">{notif.title}</h4>
                    </div>
                    <span className="text-[10px] text-[#a89f91] font-mono shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#ded6c9] leading-relaxed">{notif.message}</p>
                </div>
              </div>

              {/* Action Strip: Acknowledge & Open Task */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[rgba(165,130,95,0.18)] text-xs">
                <span className="text-[10px] text-[#a89f91] uppercase tracking-wider font-mono">
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
                      className="flex items-center gap-1 rounded-lg bg-[rgba(200,169,110,0.12)] border border-[rgba(165,130,95,0.3)] px-2.5 py-1 text-[11px] font-semibold text-[#dfc187] hover:bg-[rgba(200,169,110,0.22)] transition-colors cursor-pointer"
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
                      className="flex items-center gap-1 rounded-lg border border-[rgba(165,130,95,0.25)] bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#f7f4ed] hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#a89f91] font-mono">Acknowledged ✓</span>
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
