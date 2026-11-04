'use client';

import { useState, useMemo } from 'react';
import {
  BedDouble,
  Bell,
  Clock,
  Flower2,
  HeartHandshake,
  ListChecks,
  MessageSquare,
  MoonStar,
  PackageSearch,
  Receipt,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  ArrowRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Hotel,
  Compass,
  Palmtree,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

interface PendingTimelineItem {
  id: string;
  type: 'service' | 'dining' | 'reminder' | 'message' | 'complaint' | 'lost_found';
  category?: string;
  serviceName: string;
  description?: string;
  status: 'Pending' | 'Accepted' | 'Assigned' | 'In Progress';
  rawDate: string;
  timestamp: string;
}

function formatTimestamp(raw?: string): string {
  if (!raw) return 'Recently';
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return isToday
        ? `Today, ${timeStr}`
        : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    }
  } catch {
    // fallback
  }
  return raw;
}

function getItemIcon(type: string, category?: string) {
  if (type === 'dining' || category === 'room_service') return UtensilsCrossed;
  if (type === 'reminder') return Clock;
  if (type === 'message' || category === 'front_desk') return MessageSquare;
  if (type === 'complaint') return HeartHandshake;
  if (type === 'lost_found') return PackageSearch;
  if (category === 'maintenance') return Wrench;
  if (category === 'spa' || category === 'concierge' || category === 'recreation') return Flower2;
  return Sparkles;
}

function getStatusStyle(status: 'Pending' | 'Accepted' | 'Assigned' | 'In Progress') {
  switch (status) {
    case 'In Progress':
      return {
        dot: 'bg-emerald-400 ring-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse',
        badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40 ring-1 ring-emerald-400/20 font-bold',
      };
    case 'Assigned':
      return {
        dot: 'bg-sky-400 ring-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
        badge: 'bg-sky-400/15 text-sky-300 border-sky-400/30 font-bold',
      };
    case 'Accepted':
      return {
        dot: 'bg-indigo-400 ring-indigo-400/30 shadow-[0_0_12px_rgba(129,140,248,0.5)]',
        badge: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30 font-bold',
      };
    case 'Pending':
    default:
      return {
        dot: 'bg-amber-400 ring-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
        badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30 font-bold',
      };
  }
}

export function HomeDashboard({ room, guestName, onNavigate }: GuestTabProps) {
  const {
    state,
    updateDndStatus,
    submitGuestRequest,
    submitGuestMessageToFrontDesk,
    createGuestReminder,
  } = useDemo();

  const prefs = state.guestPreferences?.[room];

  // Critical Safety Alerts
  const safetyAlerts = state.safetyAlerts ?? [];
  const hotelAlerts = state.hotelAlerts ?? [];
  const criticalAlert =
    safetyAlerts.find((a) => a.priority === 'critical') ||
    hotelAlerts.find((a) => a.severity === 'Critical');

  // Interactive Quick Action Sheet states
  const [dndSheetOpen, setDndSheetOpen] = useState(false);
  const [dndDuration, setDndDuration] = useState('Until 12:00 PM Tomorrow');
  const [dndNote, setDndNote] = useState('Please hold all room service and knock delivery');

  const [fdSheetOpen, setFdSheetOpen] = useState(false);
  const [fdSubject, setFdSubject] = useState('Luggage assistance request');
  const [fdMessage, setFdMessage] = useState('');

  const [hkSheetOpen, setHkSheetOpen] = useState(false);
  const [hkService, setHkService] = useState('Extra towels & bath sheets');
  const [hkInstructions, setHkInstructions] = useState('');

  const [reminderSheetOpen, setReminderSheetOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('Wake-up Call');
  const [remTime, setRemTime] = useState('07:00 AM');
  const [remNotes, setRemNotes] = useState('Please ring room telephone twice');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function handleToggleDnd(enable: boolean) {
    updateDndStatus(room, enable, enable ? dndDuration : undefined, enable ? dndNote : undefined);
    setDndSheetOpen(false);
    showToast(enable ? 'Do Not Disturb activated' : 'DND deactivated');
  }

  function handleSendFdMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!fdMessage.trim()) return;
    submitGuestMessageToFrontDesk(room, fdSubject, fdMessage.trim());
    setFdSheetOpen(false);
    setFdMessage('');
    showToast('Message sent to Front Desk');
  }

  function handleSendHkRequest(e: React.FormEvent) {
    e.preventDefault();
    submitGuestRequest({
      room,
      title: hkService,
      category: 'housekeeping',
      description: hkInstructions || 'Requested via Quick Services',
      meta: 'Room Service · Room ' + room,
    });
    setHkSheetOpen(false);
    setHkInstructions('');
    showToast(`Room Service request submitted (${hkService})`);
  }

  function handleSendReminder(e: React.FormEvent) {
    e.preventDefault();
    createGuestReminder({
      guestName,
      room,
      title: remTitle,
      text: `${remTitle} scheduled for ${remTime}. ${remNotes}`,
      dueDateTime: `Tomorrow, ${remTime}`,
      priority: 'normal',
      assignedTo: 'Front Desk Coordinator',
      specialInstructions: remNotes,
    });
    setReminderSheetOpen(false);
    showToast(`Reminder set for ${remTime}`);
  }

  // Deduplicate work items
  const allItems = Object.values(state.items ?? {}).flat();
  const seenIds = new Set<string>();
  const uniqueItems: typeof allItems = [];
  for (const item of allItems) {
    if (item && item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }

  // PENDING REQUESTS TIMELINE (Excludes Completed, Delivered, Cancelled, Resolved, Rejected)
  const pendingItems = useMemo(() => {
    const list: PendingTimelineItem[] = [];

    // 1. Service requests & Dining orders
    for (const item of uniqueItems) {
      if (!item.guest || item.room !== room) continue;
      // AUTOMATIC REMOVAL: Exclude completed, delivered, cancelled, closed, rejected, resolved
      if (['Completed', 'Delivered', 'Cancelled', 'Closed', 'Rejected', 'Resolved'].includes(item.status)) {
        continue;
      }

      let status: 'Pending' | 'Accepted' | 'Assigned' | 'In Progress' = 'Pending';
      if (item.status === 'Accepted') status = 'Accepted';
      else if (item.status === 'Assigned') status = 'Assigned';
      else if (['In Progress', 'Preparing', 'Ready', 'Out for Delivery', 'On the way'].includes(item.status)) status = 'In Progress';

      list.push({
        id: item.id,
        type: item.category === 'room_service' ? 'dining' : 'service',
        category: item.category,
        serviceName: item.title,
        description: item.description,
        status,
        rawDate: item.createdAt || '',
        timestamp: formatTimestamp(item.createdAt),
      });
    }

    // 2. Active Reminders
    for (const rem of state.guestReminders ?? []) {
      if (rem.room !== room) continue;
      if (rem.status === 'dismissed') continue;

      list.push({
        id: rem.id,
        type: 'reminder',
        serviceName: rem.title || 'Scheduled Reminder',
        description: rem.text || rem.specialInstructions,
        status: 'Pending',
        rawDate: rem.createdAt || new Date().toISOString(),
        timestamp: rem.dueDateTime || formatTimestamp(rem.createdAt),
      });
    }

    // 3. Pending Front Desk Messages
    for (const msg of state.frontDeskMessages ?? []) {
      if (msg.room !== room) continue;
      if (msg.status === 'Closed') continue;

      const hasReplies = msg.replies && msg.replies.length > 0;
      list.push({
        id: msg.id,
        type: 'message',
        serviceName: msg.subject ? `Front Desk: ${msg.subject}` : 'Front Desk Inquiry',
        description: msg.message,
        status: hasReplies ? 'In Progress' : 'Pending',
        rawDate: msg.createdAt || new Date().toISOString(),
        timestamp: formatTimestamp(msg.createdAt),
      });
    }

    // 4. Active Complaints
    for (const cmp of state.guestComplaints ?? []) {
      if (cmp.room !== room) continue;
      if (['Resolved', 'Rejected', 'Cancelled', 'Closed'].includes(cmp.status)) continue;
      const cmpDate = (cmp as any).createdAt || (cmp as any).submittedAt || new Date().toISOString();

      list.push({
        id: cmp.id,
        type: 'complaint',
        serviceName: cmp.category ? `Complaint: ${cmp.category}` : 'Service Issue',
        description: cmp.description,
        status: cmp.status === 'In Progress' ? 'In Progress' : cmp.status === 'Assigned' ? 'Assigned' : 'Pending',
        rawDate: cmpDate,
        timestamp: formatTimestamp(cmpDate),
      });
    }

    // 5. Active Lost & Found Reports
    for (const rpt of state.guestLostReports ?? []) {
      if (rpt.room !== room) continue;
      if (['Resolved', 'Returned', 'Closed', 'Cancelled'].includes(rpt.status)) continue;
      const rptLocation = (rpt as any).location;
      const rptDate = (rpt as any).reportedAt || (rpt as any).createdAt || new Date().toISOString();

      list.push({
        id: rpt.id,
        type: 'lost_found',
        serviceName: `Lost & Found: ${rpt.itemName}`,
        description: rptLocation ? `Location: ${rptLocation}` : rpt.description,
        status: 'Pending',
        rawDate: rptDate,
        timestamp: formatTimestamp(rptDate),
      });
    }

    // Sort chronologically, newest at the top
    return list.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  }, [
    uniqueItems,
    state.guestReminders,
    state.frontDeskMessages,
    state.guestComplaints,
    state.guestLostReports,
    room,
  ]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl xl:max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs text-white shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="font-semibold text-emerald-300">{toastMessage}</p>
        </div>
      )}

      {/* CRITICAL SAFETY ADVISORY (If active) */}
      {criticalAlert && (
        <div className="guest-card p-3.5 sm:p-4.5 border-rose-500/50 bg-rose-500/15 flex items-center justify-between gap-3 sm:gap-4 shadow-md">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-rose-500/25 text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">{criticalAlert.title}</p>
              <p className="text-[11px] sm:text-xs text-mist-300 truncate">{criticalAlert.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('notifications', 'alerts')}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 shrink-0 transition-colors shadow-sm"
          >
            View
          </button>
        </div>
      )}

      {/* 1. COMPACT LUXURY HOTEL HEADER */}
      <div
        data-tour="tour-home"
        className="guest-card p-4 sm:p-6 lg:p-7 flex flex-row items-center justify-between gap-3 sm:gap-6 border border-cyan-500/25 bg-gradient-to-r from-ink-900/95 via-ink-900/80 to-ink-900/95 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="grid h-11 w-11 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-cyan-600/10 border border-cyan-400/35 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <Hotel className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                The Grand ADP
              </span>
              <span className="hidden sm:inline-block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-mist-400 border-l border-white/10 pl-2.5">
                Luxury Resort &amp; Suites
              </span>
            </div>
            <h1 className="text-base sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight truncate">
              Welcome, {guestName.split(' ')[0]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {prefs?.dnd && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              <MoonStar className="h-3.5 w-3.5" />
              <span>DND Active</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/40 text-xs sm:text-sm font-semibold text-mist-200 hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm group whitespace-nowrap"
            title="View Room & Stay Details"
          >
            <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Room {room}</span>
          </button>
        </div>
      </div>

      {/* 2. QUICK SERVICES (PRIMARY SECTION) */}
      <section
        data-tour="tour-services-grid"
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span>Quick Services</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="text-xs sm:text-sm font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors group"
          >
            <span>All Services</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 6 Essential Quick Services in an Evenly Balanced Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
          {/* 1. Dining */}
          <button
            data-tour="tour-quick-dining"
            type="button"
            onClick={() => onNavigate('services', 'dining')}
            className="guest-tile p-4 sm:p-4.5 lg:p-5 text-left flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_6px_24px_rgba(34,211,238,0.15)] transition-all group min-h-[136px] sm:min-h-[148px] lg:min-h-[156px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl shadow-sm bg-amber-400/15 text-amber-300 border border-amber-400/20 group-hover:scale-105 transition-transform p-2.5">
                <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-xs text-mist-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">&rarr;</span>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm lg:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">Dining</p>
              <p className="text-[11px] sm:text-xs text-mist-400 group-hover:text-mist-200 truncate mt-0.5 sm:mt-1 font-medium">Menu &amp; Order</p>
            </div>
          </button>

          {/* 2. Room Service */}
          <button
            data-tour="tour-quick-room-service"
            type="button"
            onClick={() => onNavigate('services', 'room_service')}
            className="guest-tile p-4 sm:p-4.5 lg:p-5 text-left flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_6px_24px_rgba(34,211,238,0.15)] transition-all group min-h-[136px] sm:min-h-[148px] lg:min-h-[156px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl shadow-sm bg-cyan-400/15 text-cyan-300 border border-cyan-400/20 group-hover:scale-105 transition-transform p-2.5">
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-xs text-mist-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">&rarr;</span>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm lg:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">Room Service</p>
              <p className="text-[11px] sm:text-xs text-mist-400 group-hover:text-mist-200 truncate mt-0.5 sm:mt-1 font-medium">Amenities &amp; Care</p>
            </div>
          </button>

          {/* 3. Maintenance */}
          <button
            data-tour="tour-quick-maintenance"
            type="button"
            onClick={() => onNavigate('services', 'maintenance')}
            className="guest-tile p-4 sm:p-4.5 lg:p-5 text-left flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_6px_24px_rgba(34,211,238,0.15)] transition-all group min-h-[136px] sm:min-h-[148px] lg:min-h-[156px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl shadow-sm bg-sky-400/15 text-sky-300 border border-sky-400/20 group-hover:scale-105 transition-transform p-2.5">
                <Wrench className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-xs text-mist-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">&rarr;</span>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm lg:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">Maintenance</p>
              <p className="text-[11px] sm:text-xs text-mist-400 group-hover:text-mist-200 truncate mt-0.5 sm:mt-1 font-medium">Room Repairs</p>
            </div>
          </button>

          {/* 4. Front Desk */}
          <button
            data-tour="tour-front-desk"
            type="button"
            onClick={() => setFdSheetOpen(true)}
            className="guest-tile p-4 sm:p-4.5 lg:p-5 text-left flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_6px_24px_rgba(34,211,238,0.15)] transition-all group min-h-[136px] sm:min-h-[148px] lg:min-h-[156px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl shadow-sm bg-indigo-400/15 text-indigo-300 border border-indigo-400/20 group-hover:scale-105 transition-transform p-2.5">
                <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-xs text-mist-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">&rarr;</span>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm lg:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">Front Desk</p>
              <p className="text-[11px] sm:text-xs text-mist-400 group-hover:text-mist-200 truncate mt-0.5 sm:mt-1 font-medium">24/7 Desk Chat</p>
            </div>
          </button>

          {/* 5. Reminders */}
          <button
            type="button"
            onClick={() => setReminderSheetOpen(true)}
            className="guest-tile p-4 sm:p-4.5 lg:p-5 text-left flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_6px_24px_rgba(34,211,238,0.15)] transition-all group min-h-[136px] sm:min-h-[148px] lg:min-h-[156px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl shadow-sm bg-amber-400/15 text-amber-300 border border-amber-400/20 group-hover:scale-105 transition-transform p-2.5">
                <Bell className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-xs text-mist-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">&rarr;</span>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm lg:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">Reminders</p>
              <p className="text-[11px] sm:text-xs text-mist-400 group-hover:text-mist-200 truncate mt-0.5 sm:mt-1 font-medium">Wake-up Calls</p>
            </div>
          </button>

          {/* 6. Lost & Found */}
          <button
            type="button"
            onClick={() => onNavigate('lost_found')}
            className="guest-tile p-4 sm:p-4.5 lg:p-5 text-left flex flex-col justify-between hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_6px_24px_rgba(34,211,238,0.15)] transition-all group min-h-[136px] sm:min-h-[148px] lg:min-h-[156px]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl shadow-sm bg-teal-400/15 text-teal-300 border border-teal-400/20 group-hover:scale-105 transition-transform p-2.5">
                <PackageSearch className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-xs text-mist-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">&rarr;</span>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm lg:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">Lost &amp; Found</p>
              <p className="text-[11px] sm:text-xs text-mist-400 group-hover:text-mist-200 truncate mt-0.5 sm:mt-1 font-medium">Item Inquiries</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. PENDING REQUESTS TIMELINE */}
      <section
        data-tour="tour-my-activity"
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
              <ListChecks className="h-5 w-5 text-cyan-400" />
              <span>Pending Requests</span>
            </h2>
            {pendingItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-400 text-ink-950">
                {pendingItems.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="text-xs sm:text-sm font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors group"
          >
            <span>History</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 4. REAL-WORLD TIMELINE LIST (ALIGNED STATUS TRACK) */}
        {pendingItems.length === 0 ? (
          <div className="guest-card p-8 text-center text-xs sm:text-sm text-mist-400 flex flex-col items-center justify-center gap-2.5 border border-white/5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <p className="font-semibold text-mist-200">You&apos;re all caught up!</p>
            <p className="text-xs text-mist-400">No active pending requests for Room {room}.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-3.5">
            {pendingItems.map((item, idx) => {
              const ItemIcon = getItemIcon(item.type, item.category);
              const style = getStatusStyle(item.status);
              const isLast = idx === pendingItems.length - 1;

              return (
                <div key={item.id} className="relative flex items-stretch gap-3 sm:gap-4 group">
                  {/* Dedicated Aligned Timeline Track (Node + Connector) */}
                  <div className="flex flex-col items-center shrink-0 w-6 sm:w-7 pt-4">
                    {/* Glowing Aligned Status Dot */}
                    <div className="relative flex items-center justify-center">
                      <span
                        className={cn(
                          'h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full ring-4 transition-transform group-hover:scale-125 duration-200 shadow-md',
                          style.dot
                        )}
                      />
                    </div>
                    {/* Continuous Vertical Connector */}
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-white/20 via-white/10 to-transparent mt-2 min-h-[30px]" />
                    )}
                  </div>

                  {/* Timeline Card */}
                  <div
                    onClick={() => onNavigate('activity')}
                    className="guest-card flex-1 p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-cyan-400/40 hover:bg-white/[0.03] transition-all cursor-pointer shadow-sm group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-white/5 text-cyan-300 border border-white/5 shrink-0 group-hover:scale-105 transition-transform">
                          <ItemIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </span>
                        <p className="text-sm sm:text-base font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {item.serviceName}
                        </p>
                      </div>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-mist-300 line-clamp-1 pl-11 sm:pl-12">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3.5 sm:gap-4 shrink-0 pl-11 sm:pl-0">
                      <span className="text-xs text-mist-400 font-mono flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-mist-400" />
                        <span>{item.timestamp}</span>
                      </span>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold border tracking-wide shadow-sm',
                          style.badge
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QUICK DND SHEET */}
      {dndSheetOpen && (
        <GuestSheet
          title="Do Not Disturb Setting"
          onClose={() => setDndSheetOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              {prefs?.dnd ? (
                <button
                  type="button"
                  onClick={() => handleToggleDnd(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-bold"
                >
                  Deactivate DND &amp; Allow Service
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleDnd(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold shadow-md"
                >
                  Activate Do Not Disturb
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-mist-400">Current Status</p>
                <p className="text-sm font-bold text-white">
                  {prefs?.dnd ? 'Privacy Active (DND Enabled)' : 'Ready for Service (DND Off)'}
                </p>
              </div>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-bold',
                  prefs?.dnd ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-400/20 text-emerald-300'
                )}
              >
                {prefs?.dnd ? 'Active' : 'Off'}
              </span>
            </div>

            <div className="space-y-1">
              <label htmlFor="dnd-dur" className="text-mist-300 font-semibold block">
                Duration
              </label>
              <select
                id="dnd-dur"
                value={dndDuration}
                onChange={(e) => setDndDuration(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                <option value="Until 12:00 PM Tomorrow" className="bg-ink-900 text-white">
                  Until 12:00 PM Tomorrow
                </option>
                <option value="Until 6:00 PM This Evening" className="bg-ink-900 text-white">
                  Until 6:00 PM This Evening
                </option>
                <option value="For 2 Hours" className="bg-ink-900 text-white">
                  For 2 Hours
                </option>
                <option value="Until Further Notice" className="bg-ink-900 text-white">
                  Until Further Notice
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="dnd-note" className="text-mist-300 font-semibold block">
                Delivery Notes
              </label>
              <textarea
                id="dnd-note"
                rows={2}
                value={dndNote}
                onChange={(e) => setDndNote(e.target.value)}
                placeholder="e.g. Leave newspapers outside, do not ring bell"
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </GuestSheet>
      )}

      {/* QUICK FRONT DESK MESSAGE SHEET */}
      {fdSheetOpen && (
        <GuestSheet
          title="Message Front Desk"
          onClose={() => setFdSheetOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setFdSheetOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 text-xs font-semibold text-mist-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!fdMessage.trim()}
                onClick={handleSendFdMessage}
                className="flex-2 py-2.5 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          }
        >
          <form onSubmit={handleSendFdMessage} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label htmlFor="qfd-subj" className="text-mist-300 font-semibold block">
                Subject
              </label>
              <select
                id="qfd-subj"
                value={fdSubject}
                onChange={(e) => setFdSubject(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                <option value="Luggage assistance request" className="bg-ink-900 text-white">
                  Luggage assistance request
                </option>
                <option value="Extra room amenities inquiry" className="bg-ink-900 text-white">
                  Extra room amenities inquiry
                </option>
                <option value="Transportation / Taxi booking" className="bg-ink-900 text-white">
                  Transportation / Taxi booking
                </option>
                <option value="Late departure assistance" className="bg-ink-900 text-white">
                  Late departure assistance
                </option>
                <option value="General Front Desk inquiry" className="bg-ink-900 text-white">
                  General Front Desk inquiry
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="qfd-msg" className="text-mist-300 font-semibold block">
                Message <span className="text-amber-400">*</span>
              </label>
              <textarea
                id="qfd-msg"
                required
                rows={3}
                value={fdMessage}
                onChange={(e) => setFdMessage(e.target.value)}
                placeholder="How can our Front Desk coordinator assist you?"
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </form>
        </GuestSheet>
      )}

      {/* QUICK ROOM SERVICE SHEET */}
      {hkSheetOpen && (
        <GuestSheet
          title="Request Room Service"
          onClose={() => setHkSheetOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setHkSheetOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendHkRequest}
                className="flex-2 py-2.5 px-3 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-md flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          }
        >
          <form onSubmit={handleSendHkRequest} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label htmlFor="qhk-srv" className="text-mist-300 font-semibold block">
                Service / Supplies
              </label>
              <select
                id="qhk-srv"
                value={hkService}
                onChange={(e) => setHkService(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                <option value="Extra towels & bath sheets" className="bg-ink-900 text-white">
                  Extra towels &amp; bath sheets
                </option>
                <option value="Full room refresh & cleaning" className="bg-ink-900 text-white">
                  Full room refresh &amp; cleaning
                </option>
                <option value="Toiletries refill" className="bg-ink-900 text-white">
                  Toiletries refill
                </option>
                <option value="Bed linen change" className="bg-ink-900 text-white">
                  Bed linen change
                </option>
                <option value="Evening turndown service" className="bg-ink-900 text-white">
                  Evening turndown service
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="qhk-note" className="text-mist-300 font-semibold block">
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                id="qhk-note"
                rows={2}
                value={hkInstructions}
                onChange={(e) => setHkInstructions(e.target.value)}
                placeholder="e.g. Leave package by vanity table, please knock softly..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </form>
        </GuestSheet>
      )}

      {/* QUICK REMINDER SHEET */}
      {reminderSheetOpen && (
        <GuestSheet
          title="Schedule a Reminder"
          onClose={() => setReminderSheetOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setReminderSheetOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 text-xs font-semibold text-mist-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReminder}
                className="flex-2 py-2.5 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md flex items-center justify-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Set Reminder</span>
              </button>
            </div>
          }
        >
          <form onSubmit={handleSendReminder} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label htmlFor="qrem-type" className="text-mist-300 font-semibold block">
                Reminder Type
              </label>
              <select
                id="qrem-type"
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                <option value="Wake-up Call" className="bg-ink-900 text-white">
                  Wake-up Call
                </option>
                <option value="Airport Taxi Transfer" className="bg-ink-900 text-white">
                  Airport Taxi Transfer
                </option>
                <option value="Luggage Collection" className="bg-ink-900 text-white">
                  Luggage Collection
                </option>
                <option value="Checkout Reminder" className="bg-ink-900 text-white">
                  Checkout Reminder
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="qrem-time" className="text-mist-300 font-semibold block">
                Time
              </label>
              <select
                id="qrem-time"
                value={remTime}
                onChange={(e) => setRemTime(e.target.value)}
                className="guest-field w-full px-3 py-2 text-xs text-white"
              >
                <option value="06:00 AM" className="bg-ink-900 text-white">
                  06:00 AM
                </option>
                <option value="06:30 AM" className="bg-ink-900 text-white">
                  06:30 AM
                </option>
                <option value="07:00 AM" className="bg-ink-900 text-white">
                  07:00 AM
                </option>
                <option value="07:30 AM" className="bg-ink-900 text-white">
                  07:30 AM
                </option>
                <option value="08:00 AM" className="bg-ink-900 text-white">
                  08:00 AM
                </option>
                <option value="09:00 AM" className="bg-ink-900 text-white">
                  09:00 AM
                </option>
                <option value="10:30 AM (Pre-Checkout)" className="bg-ink-900 text-white">
                  10:30 AM (Pre-Checkout)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="qrem-inst" className="text-mist-300 font-semibold block">
                Instructions
              </label>
              <input
                id="qrem-inst"
                type="text"
                value={remNotes}
                onChange={(e) => setRemNotes(e.target.value)}
                placeholder="e.g. Ring room phone twice"
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>
          </form>
        </GuestSheet>
      )}
    </div>
  );
}
