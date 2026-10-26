'use client';

import { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ArrowRight,
  Filter,
  CheckCheck,
} from 'lucide-react';
import type { WorkItem, InAppNotification } from '@/types/demo';

interface SecurityAlertsTabProps {
  items: WorkItem[];
  notifications: InAppNotification[];
  onSelectIncident: (item: WorkItem) => void;
  onAcknowledge: (id: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
}

export function SecurityAlertsTab({
  items,
  notifications,
  onSelectIncident,
  onAcknowledge,
  onMarkNotificationRead,
  onClearAllNotifications,
}: SecurityAlertsTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'unack' | 'critical'>('all');

  // Filter alerts from security items
  const alertItems = items.filter((item) => {
    if (filterType === 'unack') return item.status === 'New';
    if (filterType === 'critical') return item.priority === 'critical';
    return true;
  });

  const securityNotifs = notifications.filter((n) => n.roleId === 'security_responder');
  const unreadCount = securityNotifs.filter((n) => !n.read).length + items.filter((i) => i.status === 'New').length;

  return (
    <div className="space-y-3.5 pb-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-rose-400" />
            <span>Emergency Alert Inbox</span>
          </h2>
          <p className="text-[11px] text-mist-400">
            {unreadCount > 0 ? (
              <span className="text-rose-400 font-semibold">{unreadCount} active alerts requiring response</span>
            ) : (
              <span>All current security dispatches acknowledged</span>
            )}
          </p>
        </div>

        {securityNotifs.some((n) => !n.read) && (
          <button
            type="button"
            onClick={onClearAllNotifications}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-semibold transition-all text-center ${
            filterType === 'all'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          All Alerts ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('unack')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-semibold transition-all text-center ${
            filterType === 'unack'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Pending Ack ({items.filter((i) => i.status === 'New').length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('critical')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-semibold transition-all text-center ${
            filterType === 'critical'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Critical SOS ({items.filter((i) => i.priority === 'critical').length})
        </button>
      </div>

      {/* Alert Cards */}
      <div className="space-y-2.5">
        {alertItems.map((item) => {
          const isNew = item.status === 'New';
          const isCritical = item.priority === 'critical';

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 shadow-lg ${
                isNew
                  ? 'bg-gradient-to-r from-rose-950/60 to-ink-900 border-rose-500/40'
                  : 'bg-ink-900 border-white/10'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {isNew && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                  <span className="font-mono text-[11px] font-bold text-mist-300">
                    {item.ref || item.id}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.priority || 'Normal'}
                  </span>
                </div>

                <span className="text-[10px] text-mist-400 font-mono">
                  {item.createdAt || 'Recent'}
                </span>
              </div>

              {/* Title & Location */}
              <div>
                <h3
                  onClick={() => onSelectIncident(item)}
                  className="font-bold text-white text-xs hover:text-rose-300 transition-colors cursor-pointer"
                >
                  {item.title}
                </h3>
                <p className="text-[11px] text-mist-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                  <span>{item.location || 'Location on file'}</span>
                </p>
              </div>

              {/* Description preview */}
              {item.description && (
                <p className="text-[11px] text-mist-300 line-clamp-2 bg-ink-950/50 p-2 rounded-xl border border-white/5">
                  {item.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'Resolved'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isNew
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {item.chip || item.status}
                </span>

                <div className="flex items-center gap-2">
                  {isNew ? (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 flex items-center gap-1 active:scale-[0.98] transition-all"
                    >
                      <span>Acknowledge</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectIncident(item)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
