'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldAlert,
  Filter,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playChime } from './chime';
import { FULFILLER_PROFILES, type FulfillerProfile, taskMatchesFulfillerDept } from './fulfillerProfiles';
import type { SafetyAlertRecord } from '@/types/demo';

interface FulfillerNotificationsTabProps {
  profile?: FulfillerProfile;
  onNavigateToTasks?: (taskId?: string) => void;
}

export function FulfillerNotificationsTab({ profile, onNavigateToTasks }: FulfillerNotificationsTabProps) {
  const {
    state,
    setSoundEnabled,
    markNotificationRead,
    clearAllNotifications,
    acknowledgeSafetyAlert,
  } = useDemo();

  const isLight = state.theme === 'light';
  const activeProfile = profile || FULFILLER_PROFILES.housekeeping;
  const isSoundOn = state.soundEnabled ?? true;

  // Segmented top tabs: "Updates" vs "Hotel & Safety Alerts"
  const [mainTab, setMainTab] = useState<'updates' | 'safety'>('updates');
  // Unread filter toggle
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // All notifications routed to this fulfiller
  const allFulfillerNotifications = (state.notifications ?? []).filter((n) => {
    const isForFulfiller =
      n.roleId === 'task_fulfiller' || (n as any).targetRole === 'task_fulfiller';
    if (!isForFulfiller) return false;
    if (n.department) {
      return taskMatchesFulfillerDept({ department: n.department } as any, activeProfile.deptKey);
    }
    return true;
  });

  // Updates: task dispatches, assignments, reminders, supervisor notes
  const updateNotifications = allFulfillerNotifications.filter(
    (n) => n.type !== 'alert' && !(n as any).incidentType && !n.title.toLowerCase().includes('safety alert'),
  );

  const updatesUnreadCount = updateNotifications.filter((n) => !n.read).length;

  const displayedUpdates = updateNotifications.filter((n) => {
    if (unreadOnly) return !n.read;
    return true;
  });

  // Hotel & Safety alerts
  const allSafetyAlerts: SafetyAlertRecord[] = state.safetyAlerts ?? [];

  const isSafetyAlertAcknowledged = (alert: SafetyAlertRecord): boolean => {
    const ackList = alert.acknowledgedBy ?? [];
    return (
      ackList.includes(activeProfile.employeeName) ||
      ackList.includes(activeProfile.employeeId) ||
      ackList.includes('task_fulfiller') ||
      ackList.includes('staff')
    );
  };

  const safetyUnreadCount = allSafetyAlerts.filter(
    (a) => a.status === 'broadcast_active' && !isSafetyAlertAcknowledged(a),
  ).length;

  const displayedSafety = allSafetyAlerts.filter((a) => {
    if (unreadOnly) {
      return !isSafetyAlertAcknowledged(a);
    }
    return true;
  });

  function handleAckAllUpdates() {
    updateNotifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
    if (isSoundOn) playChime();
  }

  function handleAckAllSafety() {
    allSafetyAlerts
      .filter((a) => !isSafetyAlertAcknowledged(a))
      .forEach((a) => acknowledgeSafetyAlert(a.id, activeProfile.employeeName));
    if (isSoundOn) playChime();
  }

  function handleAcknowledgeSafety(alertId: string) {
    acknowledgeSafetyAlert(alertId, activeProfile.employeeName);
    if (isSoundOn) playChime();
  }

  return (
    <div className="flex flex-col gap-3 pb-24 text-xs">
      {/* Top Segmented Switcher: "Updates" vs "Hotel & Safety Alerts" */}
      <div
        className={cn(
          'grid grid-cols-2 gap-1.5 p-1 rounded-2xl border transition-colors shadow-xs',
          isLight
            ? 'border-[#e7e2d7] bg-[#f6f3ec]'
            : 'border-[rgba(165,130,95,0.25)] bg-[#14120e]',
        )}
      >
        <button
          type="button"
          onClick={() => setMainTab('updates')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            mainTab === 'updates'
              ? isLight
                ? 'bg-[#ffffff] text-[#353229] border border-[#e7e2d7] shadow-sm font-bold'
                : 'bg-[#dfc187] text-[#14120e] shadow-md shadow-[#dfc187]/20'
              : isLight
                ? 'text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                : 'text-[#ded6c9] hover:text-[#f7f4ed] hover:bg-white/[0.04]',
          )}
        >
          <Bell className="h-4 w-4 shrink-0" />
          <span>Updates</span>
          {updatesUnreadCount > 0 && (
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none',
                mainTab === 'updates'
                  ? isLight
                    ? 'bg-[#353229] text-[#ffffff]'
                    : 'bg-[#14120e] text-[#dfc187]'
                  : isLight
                    ? 'bg-[#ebe2cc] text-[#353229]'
                    : 'bg-[rgba(200,169,110,0.25)] text-[#8c6b2d]',
              )}
            >
              {updatesUnreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainTab('safety')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            mainTab === 'safety'
              ? isLight
                ? 'bg-[#ffffff] text-[#353229] border border-[#e7e2d7] shadow-sm font-bold'
                : 'bg-[#dfc187] text-[#14120e] shadow-md shadow-[#dfc187]/20'
              : isLight
                ? 'text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                : 'text-[#ded6c9] hover:text-[#f7f4ed] hover:bg-white/[0.04]',
          )}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Hotel & Safety Alerts</span>
          {safetyUnreadCount > 0 && (
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none',
                mainTab === 'safety'
                  ? isLight
                    ? 'bg-[#353229] text-[#ffffff]'
                    : 'bg-[#14120e] text-[#dfc187]'
                  : 'bg-rose-500/20 text-rose-700 border border-rose-400/40',
              )}
            >
              {safetyUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Streamlined Filter & Action Bar (Clean UI without redundant banner card) */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 p-2.5 rounded-2xl border transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_2px_8px_rgba(53,50,41,0.04)]'
            : 'border-[rgba(165,130,95,0.25)] bg-[#1a1918]',
        )}
      >
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer',
              !unreadOnly
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] shadow-xs'
                  : 'bg-[#dfc187] text-[#14120e] shadow-sm'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                  : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
            )}
          >
            {mainTab === 'updates'
              ? `All Updates (${updateNotifications.length})`
              : `All Alerts (${allSafetyAlerts.length})`}
          </button>

          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              unreadOnly
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-[#dfc187] text-[#14120e] font-bold shadow-sm'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                  : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
            )}
          >
            <Filter className="h-3 w-3" />
            <span>Unread</span>
            {unreadOnly && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1 text-[10px] font-bold',
                  isLight ? 'bg-white/20 text-[#ffffff]' : 'bg-[#14120e] text-[#dfc187]',
                )}
              >
                {mainTab === 'updates' ? updatesUnreadCount : safetyUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick Utility Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!isSoundOn)}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-lg border transition-colors cursor-pointer',
              isSoundOn
                ? isLight
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.12)] text-[#dfc187]'
                : isLight
                  ? 'border-stone-200 bg-stone-100 text-stone-500'
                  : 'border-white/10 bg-white/[0.04] text-mist-400',
            )}
            title={isSoundOn ? 'Mute alert chimes' : 'Enable alert chimes'}
            aria-label="Toggle chime sound"
          >
            {isSoundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {mainTab === 'updates' && updatesUnreadCount > 0 && (
            <button
              type="button"
              onClick={handleAckAllUpdates}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer',
                isLight
                  ? 'border-stone-200 bg-stone-100 text-stone-800 hover:bg-stone-200'
                  : 'border-[rgba(165,130,95,0.3)] bg-[rgba(200,169,110,0.1)] text-[#dfc187] hover:bg-[rgba(200,169,110,0.2)]',
              )}
              title="Acknowledge all unread updates"
            >
              <CheckCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Ack All</span>
            </button>
          )}

          {mainTab === 'safety' && safetyUnreadCount > 0 && (
            <button
              type="button"
              onClick={handleAckAllSafety}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer',
                isLight
                  ? 'border-stone-200 bg-stone-100 text-stone-800 hover:bg-stone-200'
                  : 'border-[rgba(165,130,95,0.3)] bg-[rgba(200,169,110,0.1)] text-[#dfc187] hover:bg-[rgba(200,169,110,0.2)]',
              )}
              title="Acknowledge all safety alerts"
            >
              <CheckCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Ack All</span>
            </button>
          )}

          {mainTab === 'updates' && updateNotifications.length > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications('task_fulfiller')}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-lg border transition-colors cursor-pointer',
                isLight
                  ? 'border-stone-200 bg-stone-100 text-stone-500 hover:text-rose-700 hover:border-rose-300'
                  : 'border-white/10 bg-white/[0.04] text-[#a89f91] hover:text-rose-400 hover:border-rose-400/30',
              )}
              title="Clear updates log"
              aria-label="Clear updates"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {((mainTab === 'updates' && displayedUpdates.length === 0) ||
        (mainTab === 'safety' && displayedSafety.length === 0)) && (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-3xl border border-dashed py-14 px-6 text-center space-y-2.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#fbfaf7]'
              : 'border-[rgba(165,130,95,0.28)] bg-[#1a1918]/60',
          )}
        >
          <div
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full border',
              isLight
                ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252]'
                : 'border-[rgba(165,130,95,0.2)] bg-white/[0.04] text-[#a89f91]',
            )}
          >
            {mainTab === 'updates' ? <Bell className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <p className={cn('text-xs font-bold', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>
              {mainTab === 'updates' ? 'No updates in this view' : 'No safety alerts'}
            </p>
            <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#686252]' : 'text-[#ded6c9]')}>
              {unreadOnly
                ? 'All notifications have been acknowledged.'
                : 'New task dispatches and broadcast alerts will appear here.'}
            </p>
          </div>
        </div>
      )}

      {/* Updates List */}
      {mainTab === 'updates' && displayedUpdates.length > 0 && (
        <div className="flex flex-col gap-2">
          {displayedUpdates.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border p-3.5 transition-all text-left',
                isLight
                  ? notif.read
                    ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
                    : 'border-[#b7b09e] bg-[#fbfaf7] text-[#353229] shadow-[0_2px_8px_rgba(53,50,41,0.05)]'
                  : notif.read
                    ? 'border-[rgba(165,130,95,0.2)] bg-[#1a1918]/80 text-[#ded6c9]'
                    : 'border-[rgba(200,169,110,0.4)] bg-[rgba(200,169,110,0.06)] text-[#f7f4ed] shadow-md',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!notif.read && (
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            isLight ? 'bg-[#353229]' : 'bg-[#dfc187] animate-pulse',
                          )}
                        />
                      )}
                      <h4
                        className={cn(
                          'text-xs font-bold truncate',
                          isLight ? 'text-[#353229]' : 'text-[#f7f4ed]',
                        )}
                      >
                        {notif.title}
                      </h4>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-mono shrink-0',
                        isLight ? 'text-[#8c8472]' : 'text-[#a89f91]',
                      )}
                    >
                      {notif.timestamp}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed',
                      isLight ? 'text-[#686252]' : 'text-[#ded6c9]',
                    )}
                  >
                    {notif.message}
                  </p>
                </div>
              </div>

              {/* Action Strip: Department Tag + View Task + Acknowledge */}
              <div
                className={cn(
                  'flex items-center justify-between gap-2 pt-2 border-t text-xs',
                  isLight ? 'border-[#e7e2d7]' : 'border-[rgba(165,130,95,0.18)]',
                )}
              >
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-mono font-semibold',
                    isLight ? 'text-[#686252]' : 'text-[#dfc187]/80',
                  )}
                >
                  {notif.department || activeProfile.departmentName}
                </span>

                <div className="flex items-center gap-1.5">
                  {notif.itemId && onNavigateToTasks && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!notif.read) markNotificationRead(notif.id);
                        onNavigateToTasks(notif.itemId);
                      }}
                      className={cn(
                        'flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer border',
                        isLight
                          ? 'border-[#353229] bg-[#353229] text-[#ffffff] hover:bg-[#484438]'
                          : 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.14)] text-[#dfc187] hover:bg-[rgba(200,169,110,0.24)]',
                      )}
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
                      className={cn(
                        'flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer shadow-xs border',
                        isLight
                          ? 'border-[#b7b09e] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec]'
                          : 'bg-[#c8a96e] text-stone-900 hover:bg-[#bfa15f]',
                      )}
                    >
                      <Check className="h-3 w-3" />
                      <span>Ack</span>
                    </button>
                  ) : (
                    <span
                      className={cn(
                        'flex items-center gap-0.5 text-[10px]',
                        isLight ? 'text-[#8c8472]' : 'text-mist-500',
                      )}
                    >
                      <Check className="h-2.5 w-2.5" /> Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Alerts List */}
      {mainTab === 'safety' && displayedSafety.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {displayedSafety.map((alert) => {
            const isAcked = isSafetyAlertAcknowledged(alert);
            const isCritical = alert.priority === 'critical';
            const isUrgent = alert.priority === 'urgent';

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex flex-col gap-2 rounded-2xl border p-3.5 transition-all text-left',
                  isLight
                    ? isCritical
                      ? 'border-rose-300 bg-rose-50/70 shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
                      : isUrgent
                        ? 'border-amber-300 bg-amber-50/70 shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
                        : 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
                    : isCritical
                      ? 'border-rose-500/50 bg-rose-500/[0.08]'
                      : isUrgent
                        ? 'border-amber-500/40 bg-amber-500/[0.06]'
                        : 'border-[rgba(165,130,95,0.3)] bg-[#1a1918]',
                )}
              >
                {/* Header: Priority + Ref Code + Status + Timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        isCritical
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isUrgent
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isLight
                              ? 'bg-[#f6f3ec] text-[#353229] border border-[#e7e2d7]'
                              : 'bg-[rgba(200,169,110,0.2)] text-[#dfc187] border border-[rgba(165,130,95,0.35)]',
                      )}
                    >
                      {alert.priority} Priority
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border',
                        isLight
                          ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]'
                          : 'bg-black/40 text-[#dfc187] border-[rgba(165,130,95,0.2)]',
                      )}
                    >
                      {alert.ref}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        alert.status === 'broadcast_active'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : alert.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300',
                      )}
                    >
                      {alert.status === 'broadcast_active'
                        ? 'Broadcast Active'
                        : alert.status === 'resolved'
                          ? 'Resolved'
                          : 'Validating'}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono',
                        isLight ? 'text-[#8c8472]' : 'text-[#a89f91]',
                      )}
                    >
                      {alert.reportedAt}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4
                    className={cn(
                      'text-xs sm:text-sm font-bold flex items-center gap-1.5',
                      isLight ? 'text-[#353229]' : 'text-[#f7f4ed]',
                    )}
                  >
                    <ShieldAlert
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isCritical ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-[#c8a96e]',
                      )}
                    />
                    <span>{alert.title}</span>
                  </h4>
                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed p-2 rounded-xl border',
                      isLight
                        ? 'bg-[#fbfaf7] border-[#e7e2d7] text-[#686252]'
                        : 'bg-black/25 border-white/5 text-[#ded6c9]',
                    )}
                  >
                    {alert.description}
                  </p>
                </div>

                {/* Location */}
                <div
                  className={cn(
                    'flex items-center gap-2 text-[11px] flex-wrap',
                    isLight ? 'text-[#686252]' : 'text-[#d4b896]',
                  )}
                >
                  <div className="flex items-center gap-1">
                    <MapPin className={cn('h-3.5 w-3.5 shrink-0', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                    <span>{alert.location}</span>
                  </div>
                  {alert.affectedFloors && alert.affectedFloors.length > 0 && (
                    <span className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-[#ded6c9]/70')}>
                      (Floors: {alert.affectedFloors.join(', ')})
                    </span>
                  )}
                </div>

                {/* Footer: Reporter + Acknowledge Button */}
                <div
                  className={cn(
                    'flex items-center justify-between gap-2 pt-2 border-t text-xs',
                    isLight ? 'border-[#e7e2d7]' : 'border-[rgba(165,130,95,0.18)]',
                  )}
                >
                  <span className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-[#a89f91]')}>
                    Reported by: <strong className={isLight ? 'text-[#353229]' : 'text-[#ded6c9]'}>{alert.reportedBy}</strong>
                  </span>

                  <div>
                    {!isAcked ? (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeSafety(alert.id)}
                        className={cn(
                          'flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition-all shadow-xs cursor-pointer',
                          isLight
                            ? 'bg-[#353229] text-[#ffffff] hover:bg-[#484438]'
                            : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
                        )}
                      >
                        <Check className="h-3 w-3" />
                        <span>Acknowledge Alert</span>
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'text-[11px] font-semibold flex items-center gap-1',
                          isLight ? 'text-emerald-700' : 'text-[#dfc187]',
                        )}
                      >
                        <Check className="h-3.5 w-3.5" /> Acknowledged ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
