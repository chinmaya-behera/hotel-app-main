'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Building2,
  Clock,
  Sparkles,
  ShieldAlert,
  Receipt,
  Crown,
  Wrench,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';

export interface FrontDeskNotification {
  id: string;
  title: string;
  message: string;
  relatedRef?: string;
  room?: string;
  guestName?: string;
  dept: 'Housekeeping' | 'Maintenance' | 'Security' | 'Finance' | 'GM Office' | 'Front Desk';
  priority: 'normal' | 'urgent' | 'vip';
  timestamp: string;
  read: boolean;
  actionText?: string;
  actionTargetTab?: string;
}

const INITIAL_NOTIFICATIONS: FrontDeskNotification[] = [
  {
    id: 'notif-1',
    title: 'Room 304 Plumbing Escalation',
    message: 'Housekeeping paused cleaning due to pipe seepage. Forwarded to Engineering for emergency repair.',
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
    id: 'notif-2',
    title: 'VIP Guest Arrival Scheduled',
    message: 'Dr. Soren Lindqvist arriving at 15:00 for Suite 201. Personalized amenities placed.',
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
    id: 'notif-3',
    title: 'Folio Dispute Escalation',
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
  const [notifications, setNotifications] = useState<FrontDeskNotification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  const getDeptIcon = (dept: FrontDeskNotification['dept']) => {
    switch (dept) {
      case 'GM Office':
        return Crown;
      case 'Housekeeping':
        return Sparkles;
      case 'Maintenance':
        return Wrench;
      case 'Security':
        return ShieldAlert;
      case 'Finance':
        return Receipt;
      case 'Front Desk':
      default:
        return Building2;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Filter Pills & Mark All Read */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <Button
          size="sm"
          variant="subtle"
          iconLeft={CheckCheck}
          disabled={unreadCount === 0}
          onClick={handleMarkAllRead}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Notifications Hub List */}
      <Panel
        title="Front Desk Operational Notifications"
        hint="Shift alerts, guest service updates, and departmental escalations."
        icon={Bell}
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-mist-400">
            No notifications match this filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => {
              const Icon = getDeptIcon(item.dept);
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs ${
                    !item.read
                      ? 'bg-white/[0.05] border-white/20'
                      : 'bg-white/[0.01] border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center bg-white/5 border border-white/10 text-amber-300">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        <Badge tone="neutral">{item.dept}</Badge>
                        <Badge tone={item.priority === 'vip' ? 'accent' : item.priority === 'urgent' ? 'danger' : 'neutral'}>
                          {item.priority.toUpperCase()}
                        </Badge>
                        {item.relatedRef && (
                          <span className="font-mono text-[11px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20">
                            {item.relatedRef}
                          </span>
                        )}
                        {item.room && (
                          <span className="text-[11px] text-mist-300 font-medium">
                            Room {item.room}
                          </span>
                        )}
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400" title="Unread" />
                        )}
                      </div>

                      <p className="text-mist-200 leading-relaxed">{item.message}</p>

                      <div className="flex items-center gap-3 text-[11px] text-mist-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.timestamp}</span>
                        </span>
                        {item.guestName && (
                          <span>· Guest: <strong>{item.guestName}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {item.actionText && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          if (item.actionTargetTab && onNavigate) {
                            onNavigate(item.actionTargetTab);
                          }
                        }}
                      >
                        {item.actionText}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleRead(item.id)}
                      className="text-[11px] text-mist-400 hover:text-white px-2 py-1 rounded transition"
                    >
                      {item.read ? 'Mark Unread' : 'Mark as Read'}
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
