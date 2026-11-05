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

  const activeProfile = profile || FULFILLER_PROFILES.housekeeping;
  const isSoundOn = state.soundEnabled ?? true;

  // Segmented top tabs matching reference photo: Personal Updates vs Hotel & Safety Alerts
  const [mainTab, setMainTab] = useState<'personal' | 'safety'>('personal');
  // Unread filter toggle
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // All notifications routed to the fulfiller
  const allFulfillerNotifications = (state.notifications ?? []).filter((n) => {
    const isForFulfiller =
      n.roleId === 'task_fulfiller' || (n as any).targetRole === 'task_fulfiller';
    if (!isForFulfiller) return false;
    if (n.department) {
      return taskMatchesFulfillerDept({ department: n.department } as any, activeProfile.deptKey);
    }
    return true;
  });

  // Personal updates: dispatches, task assignments, supervisor notes, status changes
  const personalNotifications = allFulfillerNotifications.filter(
    (n) => n.type !== 'alert' && !(n as any).incidentType && !n.title.toLowerCase().includes('safety alert'),
  );

  const personalUnreadCount = personalNotifications.filter((n) => !n.read).length;

  const displayedPersonal = personalNotifications.filter((n) => {
    if (unreadOnly) return !n.read;
    return true;
  });

  // Hotel & Safety alerts from central system
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

  function handleAckAllPersonal() {
    personalNotifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
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
    <div className="flex flex-col gap-4 pb-24 text-white">
      {/* Top Segmented Control (Matching Reference Photo) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#14120e] border border-[rgba(165,130,95,0.25)] shadow-inner">
        <button
          type="button"
          onClick={() => setMainTab('personal')}
          className={cn(
            'flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            mainTab === 'personal'
              ? 'bg-[#dfc187] text-[#14120e] shadow-md shadow-[#dfc187]/20'
              : 'text-[#ded6c9] hover:text-[#f7f4ed] hover:bg-white/[0.04]',
          )}
        >
          <Bell className="h-4 w-4 shrink-0" />
          <span>Personal Updates</span>
          {personalUnreadCount > 0 && (
            <span
              className={cn(
                'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none',
                mainTab === 'personal'
                  ? 'bg-[#14120e] text-[#dfc187]'
                  : 'bg-[rgba(200,169,110,0.25)] text-[#dfc187]',
              )}
            >
              {personalUnreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainTab('safety')}
          className={cn(
            'flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            mainTab === 'safety'
              ? 'bg-[#dfc187] text-[#14120e] shadow-md shadow-[#dfc187]/20'
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
                  ? 'bg-[#14120e] text-[#dfc187]'
                  : 'bg-rose-500/25 text-rose-300 border border-rose-500/40',
              )}
            >
              {safetyUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Banner Card (Matching Reference Photo) */}
      <div className="rounded-3xl border border-[rgba(165,130,95,0.25)] bg-[#1a1918] p-4 sm:p-5 shadow-lg space-y-4">
        {/* Top Info Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgba(200,169,110,0.14)] text-[#dfc187] border border-[rgba(165,130,95,0.3)]">
              {mainTab === 'personal' ? (
                <Bell className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#f7f4ed]">
                {mainTab === 'personal' ? 'Personal Notifications' : 'Hotel & Safety Alerts'}
              </h2>
              <p className="text-xs text-[#ded6c9] mt-0.5 leading-relaxed">
                {mainTab === 'personal'
                  ? 'Chronological updates from your requests, task dispatches, and supervisor notes'
                  : 'Property-wide broadcasts, emergency alerts, and safety protocols'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Audio chime toggle + Ack All / Clear */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!isSoundOn)}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-xl border transition-colors cursor-pointer',
                isSoundOn
                  ? 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.12)] text-[#dfc187]'
                  : 'border-white/10 bg-white/[0.04] text-mist-400',
              )}
              title={isSoundOn ? 'Mute alert chimes' : 'Enable alert chimes'}
              aria-label={isSoundOn ? 'Mute chimes' : 'Enable chimes'}
            >
              {isSoundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {mainTab === 'personal' && personalUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleAckAllPersonal}
                className="flex items-center gap-1 rounded-xl border border-[rgba(165,130,95,0.3)] bg-[rgba(200,169,110,0.1)] px-2.5 py-1.5 text-[11px] font-semibold text-[#dfc187] hover:bg-[rgba(200,169,110,0.2)] transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ack All</span>
              </button>
            )}

            {mainTab === 'safety' && safetyUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleAckAllSafety}
                className="flex items-center gap-1 rounded-xl border border-[rgba(165,130,95,0.3)] bg-[rgba(200,169,110,0.1)] px-2.5 py-1.5 text-[11px] font-semibold text-[#dfc187] hover:bg-[rgba(200,169,110,0.2)] transition-colors cursor-pointer"
                title="Acknowledge all safety alerts"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ack All</span>
              </button>
            )}

            {mainTab === 'personal' && personalNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllNotifications('task_fulfiller')}
                className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#a89f91] hover:text-rose-400 hover:border-rose-400/30 transition-colors cursor-pointer"
                title="Clear personal history"
                aria-label="Clear notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Row (Matching Reference Photo) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(165,130,95,0.15)]">
          {/* Left Chip: All Updates / All Alerts */}
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
              !unreadOnly
                ? 'bg-[#dfc187] text-[#14120e] shadow-sm'
                : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
            )}
          >
            {mainTab === 'personal'
              ? `All Updates (${personalNotifications.length})`
              : `All Alerts (${allSafetyAlerts.length})`}
          </button>

          {/* Right Button: Unread Only */}
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              unreadOnly
                ? 'bg-[#dfc187] text-[#14120e] font-bold shadow-sm'
                : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Unread only</span>
            {unreadOnly && (
              <span className="ml-0.5 rounded-full bg-[#14120e] text-[#dfc187] px-1.5 text-[10px] font-bold">
                {mainTab === 'personal' ? personalUnreadCount : safetyUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Activity Log Header (Matching Reference Photo) */}
      <div className="px-1 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#dfc187]">
          {mainTab === 'personal' ? 'ACTIVITY LOG' : 'HOTEL & SAFETY LOG'}
        </h3>
        <p className="text-xs text-[#ded6c9] mt-0.5">
          {mainTab === 'personal'
            ? `${displayedPersonal.length} notifications displayed`
            : `${displayedSafety.length} alerts displayed`}
        </p>
      </div>

      {/* Empty State Card (Matching Reference Photo) */}
      {((mainTab === 'personal' && displayedPersonal.length === 0) ||
        (mainTab === 'safety' && displayedSafety.length === 0)) && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(165,130,95,0.28)] bg-[#1a1918]/60 py-16 px-6 text-center space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.04] border border-[rgba(165,130,95,0.2)] text-[#a89f91]">
            {mainTab === 'personal' ? (
              <Bell className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#f7f4ed]">
              {mainTab === 'personal' ? 'No notifications found' : 'No safety alerts found'}
            </p>
            <p className="text-xs text-[#ded6c9] max-w-sm mx-auto leading-relaxed">
              {mainTab === 'personal'
                ? unreadOnly
                  ? 'All notifications have been acknowledged. Turn off "Unread only" to view previous activity.'
                  : 'When hotel staff responds to your requests, posts service updates, or updates your folio, they will appear here.'
                : unreadOnly
                  ? 'No unacknowledged safety alerts at this time.'
                  : 'No active property-wide emergencies or safety broadcast advisories currently reported.'}
            </p>
          </div>
        </div>
      )}

      {/* Personal Updates List */}
      {mainTab === 'personal' && displayedPersonal.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {displayedPersonal.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border p-4 transition-all text-left',
                notif.read
                  ? 'border-[rgba(165,130,95,0.2)] bg-[#1a1918]/80 text-[#ded6c9]'
                  : 'border-[rgba(200,169,110,0.4)] bg-[rgba(200,169,110,0.06)] text-[#f7f4ed] shadow-md',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-[#dfc187] shrink-0 animate-pulse" />
                      )}
                      <h4 className="text-xs font-bold truncate text-[#f7f4ed]">{notif.title}</h4>
                    </div>
                    <span className="text-[10px] text-[#a89f91] font-mono shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#ded6c9] leading-relaxed">{notif.message}</p>
                </div>
              </div>

              {/* Action Strip: Department Tag + View Task + Acknowledge */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(165,130,95,0.18)] text-xs">
                <span className="text-[10px] text-[#dfc187]/80 uppercase tracking-wider font-mono font-semibold">
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
                      className="flex items-center gap-1 rounded-xl bg-[rgba(200,169,110,0.14)] border border-[rgba(165,130,95,0.35)] px-2.5 py-1 text-[11px] font-semibold text-[#dfc187] hover:bg-[rgba(200,169,110,0.24)] transition-colors cursor-pointer"
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
                      className="flex items-center gap-1 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] px-2.5 py-1 text-[11px] font-bold text-[#14120e] transition-colors cursor-pointer shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#a89f91] font-mono flex items-center gap-1">
                      <Check className="h-3 w-3 text-[#dfc187]" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hotel & Safety Alerts List */}
      {mainTab === 'safety' && displayedSafety.length > 0 && (
        <div className="flex flex-col gap-3">
          {displayedSafety.map((alert) => {
            const isAcked = isSafetyAlertAcknowledged(alert);
            const isCritical = alert.priority === 'critical';
            const isUrgent = alert.priority === 'urgent';

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex flex-col gap-2.5 rounded-2xl border p-4 transition-all text-left',
                  isCritical
                    ? 'border-rose-500/50 bg-rose-500/[0.08]'
                    : isUrgent
                      ? 'border-amber-500/40 bg-amber-500/[0.06]'
                      : 'border-[rgba(165,130,95,0.3)] bg-[#1a1918]',
                )}
              >
                {/* Header: Priority + Ref Code + Status + Timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                          : isUrgent
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : 'bg-[rgba(200,169,110,0.2)] text-[#dfc187] border border-[rgba(165,130,95,0.35)]',
                      )}
                    >
                      {alert.priority} Priority
                    </span>
                    <span className="text-[10px] text-[#dfc187] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-md border border-[rgba(165,130,95,0.2)]">
                      {alert.ref}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase',
                        alert.status === 'broadcast_active'
                          ? 'bg-rose-500/20 text-rose-300 animate-pulse border border-rose-500/30'
                          : alert.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                      )}
                    >
                      {alert.status === 'broadcast_active'
                        ? 'Broadcast Active'
                        : alert.status === 'resolved'
                          ? 'Resolved'
                          : 'Validating'}
                    </span>
                    <span className="text-[10px] text-[#a89f91] font-mono">{alert.reportedAt}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-[#f7f4ed] flex items-center gap-1.5">
                    <ShieldAlert
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isCritical ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-[#dfc187]',
                      )}
                    />
                    <span>{alert.title}</span>
                  </h4>
                  <p className="mt-1.5 text-xs text-[#ded6c9] leading-relaxed bg-black/25 p-2.5 rounded-xl border border-white/5">
                    {alert.description}
                  </p>
                </div>

                {/* Location & Details */}
                <div className="flex items-center gap-3 text-[11px] text-[#d4b896] flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#dfc187] shrink-0" />
                    <span>{alert.location}</span>
                  </div>
                  {alert.affectedFloors && alert.affectedFloors.length > 0 && (
                    <span className="text-[10px] text-[#ded6c9]/70">
                      Floors affected: {alert.affectedFloors.join(', ')}
                    </span>
                  )}
                </div>

                {/* Footer: Reporter + Acknowledge Button */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(165,130,95,0.18)] text-xs">
                  <span className="text-[10px] text-[#a89f91]">
                    Reported by: <strong className="text-[#ded6c9]">{alert.reportedBy}</strong>
                  </span>

                  <div>
                    {!isAcked ? (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeSafety(alert.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] px-3 py-1.5 text-xs font-bold text-[#14120e] transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Acknowledge Alert</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#dfc187] font-semibold flex items-center gap-1">
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
