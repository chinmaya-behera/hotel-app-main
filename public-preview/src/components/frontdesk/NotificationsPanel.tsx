'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Building2,
  Clock,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Receipt,
  Crown,
  Wrench,
  CheckCircle2,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';

export interface FrontDeskNotification {
  id: string;
  title: string;
  message: string;
  relatedRef?: string;
  room?: string;
  guestName?: string;
  dept: 'Housekeeping' | 'Maintenance' | 'Security' | 'Finance' | 'GM Office' | 'Front Desk';
  priority: 'normal' | 'urgent' | 'vip' | 'critical' | 'warning';
  timestamp: string;
  read: boolean;
  actionText?: string;
  actionTargetTab?: string;
  isSafetyAlert?: boolean;
}

const INITIAL_NOTIFICATIONS: FrontDeskNotification[] = [
  {
    id: 'notif-sec-01',
    title: 'Stairwell B Fire Exit Alarm',
    message: 'Perimeter magnetic sensor tripped on Level 3 fire door. Patrol Unit 1 deployed.',
    relatedRef: 'SFT-SEC-01',
    room: 'Fl 3 Fire Door',
    dept: 'Security',
    priority: 'critical',
    timestamp: '3 mins ago',
    read: false,
    actionText: 'View Incident',
    actionTargetTab: 'incidents',
    isSafetyAlert: true,
  },
  {
    id: 'notif-1',
    title: 'Room 304 Pipe Seepage',
    message: 'Housekeeping paused cleaning due to pipe seepage. Forwarded to Engineering for repair.',
    relatedRef: 'ESC-HK-304',
    room: '304',
    guestName: 'Marcus Chen',
    dept: 'Maintenance',
    priority: 'urgent',
    timestamp: '10 mins ago',
    read: false,
    actionText: 'View Case',
    actionTargetTab: 'requests',
  },
  {
    id: 'notif-sec-02',
    title: 'Elevator B Leak Cordon Active',
    message: 'BMS line pressure drop detected near riser 4-W. Caution barricades placed on Floor 3.',
    relatedRef: 'INC-204',
    room: 'Fl 3 Elevator',
    dept: 'Security',
    priority: 'urgent',
    timestamp: '15 mins ago',
    read: false,
    actionText: 'View Incident',
    actionTargetTab: 'incidents',
    isSafetyAlert: true,
  },
  {
    id: 'notif-2',
    title: 'VIP Arrival: Dr. Soren Lindqvist',
    message: 'Scheduled arrival at 15:00 for Suite 201. Personalized amenities placed.',
    relatedRef: 'VIP-201',
    room: '201',
    guestName: 'Dr. Soren Lindqvist',
    dept: 'GM Office',
    priority: 'vip',
    timestamp: '25 mins ago',
    read: false,
    actionText: 'View Stay',
    actionTargetTab: 'stays',
  },
  {
    id: 'notif-sec-03',
    title: 'Poolside Vapor Sensor Warning',
    message: 'Chlorine sensor #2 logged minor elevation during refill. Auto-exhaust engaged; deck secured.',
    relatedRef: 'SFT-SEC-03',
    room: 'Pool Plant',
    dept: 'Security',
    priority: 'warning',
    timestamp: '30 mins ago',
    read: false,
    actionText: 'View Incident',
    actionTargetTab: 'incidents',
    isSafetyAlert: true,
  },
  {
    id: 'notif-3',
    title: 'Minibar Folio Dispute',
    message: 'Guest disputed minibar charge of ₹4,200. Front Desk discretionary credit pending.',
    relatedRef: 'DISP-402',
    room: '402',
    guestName: 'Elena Rostova',
    dept: 'Finance',
    priority: 'urgent',
    timestamp: '45 mins ago',
    read: false,
    actionText: 'View Dispute',
    actionTargetTab: 'disputes',
  },
  {
    id: 'notif-sec-04',
    title: 'Basement Substation Thermal Check',
    message: 'Thermal sensor in substation B2 triggered 4°C above baseline. Patrol confirmed normal chiller cycle.',
    relatedRef: 'SFT-SEC-04',
    room: 'Substation B2',
    dept: 'Security',
    priority: 'urgent',
    timestamp: '50 mins ago',
    read: true,
    actionText: 'View Incident',
    actionTargetTab: 'incidents',
    isSafetyAlert: true,
  },
  {
    id: 'notif-4',
    title: 'Room 502 Inspection Passed',
    message: 'Supervisor completed turnover audit. Room marked Ready for immediate check-in.',
    relatedRef: 'ROOM-502',
    room: '502',
    dept: 'Housekeeping',
    priority: 'normal',
    timestamp: '1 hour ago',
    read: true,
    actionText: 'View Room',
    actionTargetTab: 'rooms',
  },
];

export function NotificationsPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { notify } = useDemo();
  const [notifications, setNotifications] = useState<FrontDeskNotification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'safety'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const safetyCount = notifications.filter((n) => n.isSafetyAlert || n.dept === 'Security').length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'safety') return n.isSafetyAlert || n.dept === 'Security';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notify?.('All notifications marked as read');
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  const getDeptIcon = (dept: FrontDeskNotification['dept'], isSafetyAlert?: boolean) => {
    if (isSafetyAlert || dept === 'Security') return ShieldAlert;
    switch (dept) {
      case 'GM Office':
        return Crown;
      case 'Housekeeping':
        return Sparkles;
      case 'Maintenance':
        return Wrench;
      case 'Finance':
        return Receipt;
      case 'Front Desk':
      default:
        return Building2;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Filter Bar: All, Unread, and Safety Alerts (Security) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('safety')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'safety'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-rose-300 hover:text-white hover:bg-rose-500/10'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Safety Alerts ({safetyCount})</span>
          </button>
        </div>

        <Button
          size="sm"
          variant="subtle"
          iconLeft={CheckCheck}
          disabled={unreadCount === 0}
          onClick={handleMarkAllRead}
          className="text-xs self-start sm:self-auto"
        >
          Mark All Read
        </Button>
      </div>

      {/* Single Unified Notifications Feed (Minimal & Compressed) */}
      <Panel
        title="Notifications & Safety Alerts"
        hint="Operational dispatches, shift notices, and security alerts in one feed."
        icon={Bell}
      >
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-mist-400">
            No notifications match this filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const Icon = getDeptIcon(item.dept, item.isSafetyAlert);
              const isSafety = item.isSafetyAlert || item.dept === 'Security';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    !item.read
                      ? isSafety
                        ? 'bg-rose-950/25 border-rose-500/30'
                        : 'bg-white/[0.05] border-white/15'
                      : 'bg-white/[0.015] border-white/5 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${
                        isSafety
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : 'bg-white/5 border border-white/10 text-amber-300'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isSafety ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Radio className="h-2.5 w-2.5 animate-pulse" /> Safety Alert · Security
                          </span>
                        ) : (
                          <Badge tone="neutral">{item.dept}</Badge>
                        )}

                        <span className="font-bold text-white text-xs truncate">{item.title}</span>

                        <Badge
                          tone={
                            item.priority === 'vip'
                              ? 'accent'
                              : item.priority === 'critical' || item.priority === 'urgent'
                                ? 'danger'
                                : 'neutral'
                          }
                        >
                          {item.priority.toUpperCase()}
                        </Badge>

                        {item.relatedRef && (
                          <span className="font-mono text-[10px] font-semibold text-cyan-300 px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-400/20">
                            {item.relatedRef}
                          </span>
                        )}

                        {item.room && (
                          <span className="text-[10px] text-mist-400 font-medium">
                            {item.room.startsWith('Room') || item.room.startsWith('Fl') ? item.room : `Room ${item.room}`}
                          </span>
                        )}

                        {!item.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" title="Unread" />
                        )}
                      </div>

                      <p className="text-mist-300 text-[11px] leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-mist-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{item.timestamp}</span>
                        </span>
                        {item.guestName && (
                          <span>· Guest: <strong className="text-mist-300">{item.guestName}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Compact View Button + Mark Read Toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {item.actionText && (
                      <Button
                        size="sm"
                        variant={isSafety ? 'accent' : 'subtle'}
                        onClick={() => {
                          if (item.actionTargetTab && onNavigate) {
                            onNavigate(item.actionTargetTab);
                          }
                        }}
                        className={`text-xs py-1 h-7 ${
                          isSafety ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''
                        }`}
                      >
                        {item.actionText}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleRead(item.id)}
                      className="text-[10px] text-mist-400 hover:text-white px-1.5 py-1 rounded transition"
                    >
                      {item.read ? 'Unread' : 'Read'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
