'use client';

import { Bell, Check, CheckCheck, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playChime } from './chime';

export function FulfillerNotificationsTab() {
  const { state, setSoundEnabled, markNotificationRead, clearAllNotifications } = useDemo();

  const notifications = (state.notifications ?? []).filter((n) => n.roleId === 'task_fulfiller');
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isSoundOn = state.soundEnabled ?? true;

  function handleTestSound() {
    if (!isSoundOn) {
      setSoundEnabled(true);
    }
    playChime();
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
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
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Notification History
            {unreadCount > 0 && (
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-[11px] text-mist-400">Shift alerts and dispatcher messages</p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => clearAllNotifications('task_fulfiller')}
            className="flex items-center gap-1 text-[11px] font-medium text-mist-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-2.5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-12 px-4 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-mist-400">
              <Bell className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-white">No notifications</p>
            <p className="mt-0.5 text-[11px] text-mist-400">All notifications for this shift have been acknowledged.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-2xl border p-3.5 transition-all text-left',
                notif.read
                  ? 'border-white/5 bg-white/[0.02] text-mist-300'
                  : 'border-emerald-500/25 bg-emerald-500/[0.05] text-white shadow-sm',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold truncate text-white">{notif.title}</h4>
                  <span className="text-[10px] text-mist-400 shrink-0">{notif.timestamp}</span>
                </div>
                <p className="mt-1 text-xs text-mist-300 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <button
                  type="button"
                  onClick={() => markNotificationRead(notif.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-mist-300 hover:bg-emerald-500 hover:text-ink-950 transition-colors"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
