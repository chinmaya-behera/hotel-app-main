'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  ShieldAlert,
  Receipt,
  Crown,
  Home,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { frontDeskNotificationsSeed, type FDNotification } from '@/lib/mockData';

export function NotificationsPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [notifications, setNotifications] = useState<FDNotification[]>(frontDeskNotificationsSeed);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.urgent).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'urgent') return n.urgent;
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

  const getDeptIcon = (dept: FDNotification['dept']) => {
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
      {/* Top Controls: Filter Pills (All, Urgent, Unread) & Mark All Read */}
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
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'urgent'
                ? 'bg-amber-400 text-ink-950 shadow-sm'
                : 'text-mist-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Urgent ({urgentCount})</span>
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
          Mark All Read
        </Button>
      </div>

      {/* Notifications Hub List */}
      <Panel
        title="Department Operations Hub & Alerts"
        hint="Live operational alerts from Housekeeping, Engineering, Finance, Security, and General Manager."
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
                  } ${item.urgent ? 'border-l-4 border-l-rose-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg shrink-0 flex items-center justify-center ${
                        item.urgent
                          ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                          : 'bg-white/5 border border-white/10 text-mist-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.title}</span>
                        <Badge tone={item.urgent ? 'danger' : 'neutral'}>
                          {item.dept}
                        </Badge>
                        {item.urgent && (
                          <Badge tone="danger">URGENT</Badge>
                        )}
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        )}
                      </div>

                      <p className="text-mist-200 leading-relaxed">{item.message}</p>

                      <div className="flex items-center gap-3 text-[11px] text-mist-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.timestamp}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {item.actionText && (
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => {
                          if (item.actionText === 'View Stay' && onNavigate) onNavigate('stays');
                          else if (item.actionText === 'View Room' && onNavigate) onNavigate('rooms');
                          else if (item.actionText === 'Open Dispute' && onNavigate) onNavigate('disputes');
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
                      {item.read ? 'Mark Unread' : 'Mark Read'}
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

