'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  Sparkles,
  Clock,
  MessageSquare,
  HeartHandshake,
  CreditCard,
  Megaphone,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestEmptyState, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { GuestNotificationCategory, GuestNotification } from '@/types/demo';

const CATEGORY_MAP: Record<
  GuestNotificationCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string; subtab?: string }
> = {
  'Booking Updates': {
    label: 'Bookings',
    icon: CalendarCheck,
    tone: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  },
  'Service Request Updates': {
    label: 'Services',
    icon: Sparkles,
    tone: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    subtab: 'book',
  },
  'Reminder Updates': {
    label: 'Reminders',
    icon: Clock,
    tone: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    subtab: 'reminders',
  },
  'Front Desk Messages': {
    label: 'Front Desk',
    icon: MessageSquare,
    tone: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30',
    subtab: 'front_desk',
  },
  'Complaint Updates': {
    label: 'Complaints',
    icon: HeartHandshake,
    tone: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
  },
  'Payment/Billing Updates': {
    label: 'Billing',
    icon: CreditCard,
    tone: 'bg-teal-400/15 text-teal-300 border-teal-400/30',
    subtab: 'folio',
  },
  'General Announcements': {
    label: 'Announcements',
    icon: Megaphone,
    tone: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
  },
};

export function NotificationsSection({ room, onNavigate }: GuestTabProps) {
  const { state, markGuestNotificationRead, markAllGuestNotificationsRead } = useDemo();
  const guestPalette = state.guestPalette ?? 'burgundy';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);

  const allNotifications = useMemo(() => {
    return (state.guestNotifications ?? []).filter((n) => n.room === room);
  }, [state.guestNotifications, room]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      const matchCat = selectedCategory === 'all' || n.category === selectedCategory;
      const matchRead = !filterUnreadOnly || !n.read;
      return matchCat && matchRead;
    });
  }, [allNotifications, selectedCategory, filterUnreadOnly]);

  function handleNotificationClick(n: GuestNotification) {
    if (!n.read) {
      markGuestNotificationRead(n.id);
    }

    // Interactive navigation
    if (n.targetTab) {
      const subtab = n.targetSubtab || CATEGORY_MAP[n.category]?.subtab;
      onNavigate(n.targetTab as any, subtab);
    } else {
      // Default mappings if targetTab wasn't populated
      if (n.category === 'Service Request Updates') onNavigate('services', 'book');
      else if (n.category === 'Reminder Updates') onNavigate('services', 'reminders');
      else if (n.category === 'Front Desk Messages') onNavigate('services', 'front_desk');
      else if (n.category === 'Complaint Updates') onNavigate('complaints');
      else if (n.category === 'Payment/Billing Updates') onNavigate('profile', 'folio');
      else if (n.category === 'Booking Updates') onNavigate('profile', 'bookings');
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header Card with Actions */}
      <div
        className={cn(
          'p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-sm border transition-colors',
          guestPalette === 'burgundy'
            ? 'bg-[#FFFCF8] dark:bg-[#220B15] border-[#E0CBA9] dark:border-[#461628]'
            : 'bg-white dark:bg-[#122C21] border-[#E5DFD3] dark:border-[#1E4F39]'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl',
                guestPalette === 'burgundy'
                  ? 'bg-[#F2E4CE] text-[#74172F] dark:bg-[#381222] dark:text-[#C9A45C]'
                  : 'bg-[#F1EBDD] text-[#1A6650] dark:bg-[#193E2F] dark:text-[#34D399]'
              )}
            >
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Personal Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold text-white',
                      guestPalette === 'burgundy' ? 'bg-[#74172F]' : 'bg-[#1C6B53]'
                    )}
                  >
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Chronological updates from your requests, billing, and Front Desk messages
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllGuestNotificationsRead(room)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/10 text-xs text-stone-700 dark:text-stone-300 transition-all font-semibold shadow-sm"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark all as read</span>
              <span className="sm:hidden">Read all</span>
            </button>
          )}
        </div>

        {/* Category Pills & Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-white/10 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-sm border',
              selectedCategory === 'all'
                ? guestPalette === 'burgundy'
                  ? 'bg-[#74172F] text-[#FFF8F0] border-[#74172F]'
                  : 'bg-[#175B49] text-white border-[#175B49]'
                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-white/10'
            )}
          >
            All Updates ({allNotifications.length})
          </button>

          {Object.entries(CATEGORY_MAP).map(([catKey, config]) => {
            const count = allNotifications.filter((n) => n.category === catKey).length;
            if (count === 0 && selectedCategory !== catKey) return null;

            return (
              <button
                type="button"
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === catKey
                    ? 'bg-amber-400 text-ink-950 font-bold'
                    : 'bg-white/5 text-mist-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <config.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{config.label}</span>
                {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setFilterUnreadOnly((prev) => !prev)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              filterUnreadOnly
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-white/5 text-mist-400 hover:text-white'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Unread only</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <GuestSectionHeader
          title="Activity Log"
          hint={`${filteredNotifications.length} notification${filteredNotifications.length === 1 ? '' : 's'} displayed`}
        />

        {filteredNotifications.length === 0 ? (
          <GuestEmptyState
            icon={Bell}
            title={filterUnreadOnly ? 'No unread notifications' : 'No notifications found'}
            hint={
              filterUnreadOnly
                ? "You've read all your notifications. Toggle off 'Unread only' to see past history."
                : 'When hotel staff responds to your requests, posts service updates, or updates your folio, they will appear here.'
            }
          />
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((n) => {
              const catConfig = CATEGORY_MAP[n.category] || CATEGORY_MAP['General Announcements'];
              const IconComp = catConfig.icon;

              return (
                <div
                  key={n.id}
                  className={`guest-card p-4 transition-all relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !n.read
                      ? 'border-amber-400/40 bg-amber-400/5 shadow-sm'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Left Side: Unread Dot + Icon + Content */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Unread indicator */}
                    <div className="pt-2 shrink-0">
                      {!n.read ? (
                        <span className="block h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20 animate-pulse" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-white/10" />
                      )}
                    </div>

                    {/* Category Icon */}
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 mt-0.5 border ${catConfig.tone}`}
                    >
                      <IconComp className="h-4 w-4" />
                    </span>

                    {/* Text Details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">
                          {catConfig.label}
                        </span>
                        <span className="text-mist-500 text-[10px]">·</span>
                        <span className="text-[11px] text-mist-400">
                          {n.date} at {n.time}
                        </span>
                      </div>

                      <h3
                        className={`text-xs font-bold leading-snug cursor-pointer ${
                          !n.read ? 'text-white' : 'text-mist-200'
                        }`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        {n.title}
                      </h3>

                      <p
                        className="text-[11px] text-mist-300 leading-relaxed cursor-pointer"
                        onClick={() => handleNotificationClick(n)}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Actions (Mark Read & View Section) */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:pl-3 border-t sm:border-t-0 border-white/5 shrink-0 self-end sm:self-center">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markGuestNotificationRead(n.id)}
                        title="Mark as read"
                        className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-mist-400 hover:text-white transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-400 hover:text-ink-950 text-xs font-semibold text-mist-200 transition-all border border-white/10"
                    >
                      <span>View</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

