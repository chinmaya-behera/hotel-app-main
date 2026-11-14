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
    <div className="flex flex-col gap-3 pb-6 sm:pb-8 text-xs">
      {/* Top Segmented Switcher: "Updates" vs "Hotel & Safety Alerts" */}
      <div
        className={cn(
          'grid grid-cols-2 gap-1.5 p-1 rounded-2xl border transition-colors shadow-xs',
          isLight
            ? 'border-[#e7e2d7] bg-[#f6f3ec]'
            : 'border-[#3d3a32] bg-[#1e1e1b]',
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
                : 'bg-[#ded6c1] text-[#28261f] shadow-md shadow-[#ded6c1]/20'
              : isLight
                ? 'text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                : 'text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#282720]',
          )}
        >
          <Bell className="h-4 w-4 shrink-0" />
          <span>All Notifications</span>
          {updatesUnreadCount > 0 && (
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none',
                mainTab === 'updates'
                  ? isLight
                    ? 'bg-[#353229] text-[#ffffff]'
                    : 'bg-[#28261f] text-[#ded6c1]'
                  : isLight
                    ? 'bg-[#ebe2cc] text-[#353229]'
                    : 'bg-[#343127] text-[#ded6c1]',
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
                : 'bg-[#ded6c1] text-[#28261f] shadow-md shadow-[#ded6c1]/20'
              : isLight
                ? 'text-[#686252] hover:text-[#353229] hover:bg-[#ebe2cc]/40'
                : 'text-[#b7b0a1] hover:text-[#eee8dc] hover:bg-[#282720]',
          )}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Security Alerts</span>
          {safetyUnreadCount > 0 && (
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none',
                mainTab === 'safety'
                  ? isLight
                    ? 'bg-[#353229] text-[#ffffff]'
                    : 'bg-[#28261f] text-[#ded6c1]'
                  : 'bg-rose-500/20 text-rose-500 border border-rose-400/40',
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
            : 'border-[#3d3a32] bg-[#1e1e1b]',
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
                  : 'bg-[#ded6c1] text-[#28261f] shadow-sm'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                  : 'border border-[#3d3a32] bg-[#282720] text-[#b7b0a1] hover:text-[#eee8dc]',
            )}
          >
            {mainTab === 'updates'
              ? `All Notifications (${updateNotifications.length})`
              : `Security Alerts (${allSafetyAlerts.length})`}
          </button>

          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              unreadOnly
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-[#ded6c1] text-[#28261f] font-bold shadow-sm'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                  : 'border border-[#3d3a32] bg-[#282720] text-[#b7b0a1] hover:text-[#eee8dc]',
            )}
          >
            <Filter className="h-3 w-3" />
            <span>Unread</span>
            {unreadOnly && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1 text-[10px] font-bold',
                  isLight ? 'bg-white/20 text-[#ffffff]' : 'bg-[#28261f] text-[#ded6c1]',
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
                  : 'border-[#867e6c] bg-[#343127] text-[#ded6c1]'
                : isLight
                  ? 'border-stone-200 bg-stone-100 text-stone-500'
                  : 'border-[#3d3a32] bg-[#282720] text-[#b7b0a1]',
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
                  ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229] hover:bg-[#ebe2cc]'
                  : 'border-[#867e6c] bg-[#343127] text-[#ded6c1] hover:bg-[#403b2f]',
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
                  ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229] hover:bg-[#ebe2cc]'
                  : 'border-[#867e6c] bg-[#343127] text-[#ded6c1] hover:bg-[#403b2f]',
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
                  : 'border-[#3d3a32] bg-[#282720] text-[#b7b0a1] hover:text-rose-400 hover:border-rose-400/30',
              )}
              title="Clear updates log"
              aria-label="Clear updates"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Activity Log Header */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <h3 className={cn('text-[11px] font-bold uppercase tracking-wider', isLight ? 'text-[#8b7550]' : 'text-[#ded6c1]')}>
          {mainTab === 'updates' ? 'ACTIVITY LOG' : 'SECURITY ALERTS LOG'}
        </h3>
        <p className={cn('text-[11px] font-mono', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')}>
          {mainTab === 'updates' ? `${displayedUpdates.length} notifications displayed` : `${displayedSafety.length} alerts displayed`}
        </p>
      </div>

      {/* Empty State */}
      {((mainTab === 'updates' && displayedUpdates.length === 0) ||
        (mainTab === 'safety' && displayedSafety.length === 0)) && (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-3xl border py-14 px-6 text-center space-y-3 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff] shadow-xs'
              : 'border-[#3d3a32] bg-[#1e1e1b] shadow-md',
          )}
        >
          <div
            className={cn(
              'grid h-12 w-12 place-items-center rounded-full border',
              isLight
                ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                : 'border-[#867e6c] bg-[#282720] text-[#ded6c1]',
            )}
          >
            {mainTab === 'updates' ? <Bell className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6 text-rose-400" />}
          </div>
          <div className="space-y-1">
            <p className={cn('text-sm font-bold', isLight ? 'text-[#353229]' : 'text-[#eee8dc]')}>
              {mainTab === 'updates' ? 'No notifications found' : 'No security alerts found'}
            </p>
            <p className={cn('text-xs max-w-sm mx-auto leading-relaxed', isLight ? 'text-[#686252]' : 'text-[#b7b0a1]')}>
              {unreadOnly
                ? 'All alerts have been acknowledged. Turn off "Unread" to view previous activity.'
                : mainTab === 'updates'
                  ? 'When supervisors assign tasks, dispatch updates, or update your work roster, they will appear here.'
                  : 'Property-wide broadcasts, emergency alerts, and safety protocols from security will appear here.'}
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
                    ? 'border-[#3d3a32] bg-[#1e1e1b] text-[#b7b0a1]'
                    : 'border-[#867e6c] bg-[#282720] text-[#eee8dc] shadow-md',
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
                            isLight ? 'bg-[#353229]' : 'bg-[#ded6c1] animate-pulse',
                          )}
                        />
                      )}
                      <h4
                        className={cn(
                          'text-xs font-bold truncate',
                          isLight ? 'text-[#353229]' : 'text-[#eee8dc]',
                        )}
                      >
                        {notif.title}
                      </h4>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-mono shrink-0',
                        isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]',
                      )}
                    >
                      {notif.timestamp}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed',
                      isLight ? 'text-[#686252]' : 'text-[#b7b0a1]',
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
                  isLight ? 'border-[#e7e2d7]' : 'border-[#3d3a32]',
                )}
              >
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-mono font-semibold',
                    isLight ? 'text-[#686252]' : 'text-[#ded6c1]/90',
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
                          : 'border-[#867e6c] bg-[#343127] text-[#ded6c1] hover:bg-[#403b2f]',
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
                          : 'bg-[#ded6c1] text-[#28261f] hover:bg-[#e5dfcb] border-[#867e6c]',
                      )}
                    >
                      <Check className="h-3 w-3" />
                      <span>Ack</span>
                    </button>
                  ) : (
                    <span
                      className={cn(
                        'flex items-center gap-0.5 text-[10px]',
                        isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]',
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
                      ? 'border-rose-500/50 bg-[#241215]'
                      : isUrgent
                        ? 'border-amber-500/40 bg-amber-500/[0.08]'
                        : 'border-[#3d3a32] bg-[#1e1e1b]',
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
                              : 'bg-[#343127] text-[#ded6c1] border border-[#867e6c]',
                      )}
                    >
                      {alert.priority} Priority
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border',
                        isLight
                          ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]'
                          : 'bg-[#282720] text-[#ded6c1] border-[#3d3a32]',
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
                        isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]',
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
                      isLight ? 'text-[#353229]' : 'text-[#eee8dc]',
                    )}
                  >
                    <ShieldAlert
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isCritical ? 'text-rose-600' : isUrgent ? 'text-amber-600' : isLight ? 'text-[#8b7550]' : 'text-[#ded6c1]',
                      )}
                    />
                    <span>{alert.title}</span>
                  </h4>
                  <p
                    className={cn(
                      'mt-1 text-xs leading-relaxed p-2 rounded-xl border',
                      isLight
                        ? 'bg-[#fbfaf7] border-[#e7e2d7] text-[#686252]'
                        : 'bg-[#282720]/60 border-[#3d3a32] text-[#b7b0a1]',
                    )}
                  >
                    {alert.description}
                  </p>
                </div>

                {/* Location */}
                <div
                  className={cn(
                    'flex items-center gap-2 text-[11px] flex-wrap',
                    isLight ? 'text-[#686252]' : 'text-[#ded6c1]',
                  )}
                >
                  <div className="flex items-center gap-1">
                    <MapPin className={cn('h-3.5 w-3.5 shrink-0', isLight ? 'text-[#353229]' : 'text-[#ded6c1]')} />
                    <span>{alert.location}</span>
                  </div>
                  {alert.affectedFloors && alert.affectedFloors.length > 0 && (
                    <span className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]/70')}>
                      (Floors: {alert.affectedFloors.join(', ')})
                    </span>
                  )}
                </div>

                {/* Footer: Reporter + Acknowledge Button */}
                <div
                  className={cn(
                    'flex items-center justify-between gap-2 pt-2 border-t text-xs',
                    isLight ? 'border-[#e7e2d7]' : 'border-[#3d3a32]',
                  )}
                >
                  <span className={cn('text-[10px]', isLight ? 'text-[#8c8472]' : 'text-[#b7b0a1]')}>
                    Reported by: <strong className={isLight ? 'text-[#353229]' : 'text-[#eee8dc]'}>{alert.reportedBy}</strong>
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
                            : 'bg-[#ded6c1] text-[#28261f] hover:bg-[#e5dfcb]',
                        )}
                      >
                        <Check className="h-3 w-3" />
                        <span>Acknowledge Alert</span>
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'text-[11px] font-semibold flex items-center gap-1',
                          isLight ? 'text-emerald-700' : 'text-[#ded6c1]',
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
