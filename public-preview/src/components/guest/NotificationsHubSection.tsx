'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { NotificationsSection } from './NotificationsSection';
import { AlertsSection } from './AlertsSection';
import type { GuestTabProps, GuestNotificationsSubtab } from '@/components/guest/types';

export function NotificationsHubSection({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const { state } = useDemo();

  const [activeSubtab, setActiveSubtab] = useState<GuestNotificationsSubtab>(
    initialSubtab === 'alerts' ? 'alerts' : 'personal',
  );

  useEffect(() => {
    if (initialSubtab === 'alerts' || initialSubtab === 'personal') {
      setActiveSubtab(initialSubtab);
    }
  }, [initialSubtab]);

  // Count unread personal notifications
  const unreadPersonalCount = useMemo(() => {
    return (state.guestNotifications ?? []).filter((n) => n.room === room && !n.read).length;
  }, [state.guestNotifications, room]);

  // Count critical / high hotel alerts
  const criticalAlertsCount = useMemo(() => {
    const safety = (state.safetyAlerts ?? []).filter(
      a => a.priority === 'critical' && a.status === 'broadcast_active' && a.broadcastScope === 'hotel_wide',
    );
    const hotel = (state.hotelAlerts ?? []).filter((a) => a.severity === 'Critical');
    return safety.length + hotel.length;
  }, [state.safetyAlerts, state.hotelAlerts]);

  return (
    <div data-tour="tour-notifications-tab" className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* 2-Segment Switcher keeping Personal Notifications and Hotel Alerts Strictly Separate */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/30 border border-white/5">
        <button
          type="button"
          onClick={() => setActiveSubtab('personal')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeSubtab === 'personal'
              ? 'bg-amber-400 text-ink-950 font-bold shadow-md'
              : 'text-mist-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="h-4 w-4 shrink-0" />
          <span>Personal Updates</span>
          {unreadPersonalCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubtab === 'personal' ? 'bg-black/20 text-ink-950' : 'bg-amber-400 text-ink-950'
              }`}
            >
              {unreadPersonalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubtab('alerts')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeSubtab === 'alerts'
              ? 'bg-amber-400 text-ink-950 font-bold shadow-md'
              : 'text-mist-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Hotel &amp; Safety Alerts</span>
          {criticalAlertsCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Render Active Subsection */}
      {activeSubtab === 'personal' ? (
        <NotificationsSection room={room} guestName={guestName} onNavigate={onNavigate} />
      ) : (
        <AlertsSection room={room} guestName={guestName} onNavigate={onNavigate} />
      )}
    </div>
  );
}

