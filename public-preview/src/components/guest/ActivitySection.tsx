'use client';

import { useState, useMemo } from 'react';
import {
  ListChecks,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  Flower2,
  Bell,
  MessageSquare,
  HeartHandshake,
  PackageSearch,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  Star,
  Send,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader, DeliveryTracker, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps, GuestTabId } from '@/components/guest/types';
import type { WorkItem, RoleId } from '@/types/demo';


/* ------------------------------------------------------------------ */
/* Multi-Step Service Request Timeline with Perfectly Aligned Nodes    */
/* ------------------------------------------------------------------ */

function getRequestStepIndex(status: string): number {
  if (['Completed', 'Delivered', 'Resolved', 'Closed'].includes(status)) return 3;
  if (['In Progress', 'Preparing', 'Ready', 'Out for Delivery', 'On the way'].includes(status)) return 2;
  if (['Assigned', 'Accepted'].includes(status)) return 1;
  return 0; // 'Requested', 'Received', 'Pending', 'Open'
}

function ServiceRequestTimeline({ status, createdAt }: { status: string; createdAt?: string }) {
  const currentStep = getRequestStepIndex(status);
  const isCancelled = status === 'Cancelled' || status === 'Rejected';

  if (isCancelled) {
    return (
      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-semibold">This service request was cancelled.</span>
      </div>
    );
  }

  // Format initial logged time
  let formattedTime = 'Recently';
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      // fallback
    }
  }

  const stages = [
    { key: 'requested', label: 'Requested', sublabel: formattedTime },
    { key: 'assigned', label: 'Assigned', sublabel: currentStep >= 1 ? 'Desk Dispatched' : 'In dispatch' },
    { key: 'inprogress', label: 'In Progress', sublabel: currentStep >= 2 ? 'Underway' : 'In queue' },
    { key: 'completed', label: 'Completed', sublabel: currentStep >= 3 ? 'Delivered' : 'Pending' },
  ];

  return (
    <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-3 sm:p-4 my-2.5">
      <div className="flex items-center justify-between text-xs mb-3 font-semibold text-mist-300">
        <span className="flex items-center gap-1.5 text-cyan-300 text-[11px] uppercase tracking-wider font-bold">
          <Clock className="h-3.5 w-3.5" />
          <span>Operational Progress</span>
        </span>
        <span className="text-[11px] font-mono text-mist-400">
          Stage {currentStep + 1} of 4: <span className="text-white font-bold">{stages[currentStep].label}</span>
        </span>
      </div>

      <div className="relative w-full">
        {/* Background Track Line (aligned mathematically from column 1 center (12.5%) to column 4 center (87.5%)) */}
        <div className="absolute top-[13px] left-[12.5%] right-[12.5%] h-0.5 bg-white/10 -translate-y-1/2 z-0" />

        {/* Active Progress Track Line */}
        <div
          className="absolute top-[13px] left-[12.5%] h-0.5 bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${(currentStep / 3) * 75}%`,
          }}
        />

        {/* 4 Nodes Grid */}
        <div className="relative z-10 grid grid-cols-4 w-full">
          {stages.map((stage, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center px-1">
                {/* Centered Node Dot Container */}
                <div className="h-[26px] w-[26px] flex items-center justify-center">
                  <span
                    className={cn(
                      'rounded-full flex items-center justify-center transition-all duration-300',
                      isDone && 'h-5 w-5 bg-emerald-400 text-ink-950 shadow-[0_0_10px_rgba(52,211,153,0.5)] ring-2 ring-emerald-400/30',
                      isCurrent && 'h-6 w-6 bg-amber-400 text-ink-950 shadow-[0_0_12px_rgba(251,191,36,0.6)] ring-4 ring-amber-400/25 animate-pulse',
                      isUpcoming && 'h-4 w-4 bg-ink-900 border-2 border-white/20'
                    )}
                  >
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />}
                    {isCurrent && <span className="h-2 w-2 rounded-full bg-ink-950" />}
                  </span>
                </div>

                {/* Stage Title */}
                <p
                  className={cn(
                    'text-[10px] sm:text-xs font-bold mt-2 leading-tight transition-colors',
                    isDone && 'text-emerald-300',
                    isCurrent && 'text-amber-300',
                    isUpcoming && 'text-mist-400'
                  )}
                >
                  {stage.label}
                </p>

                {/* Subtitle / Timestamp */}
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] mt-0.5 truncate max-w-full font-medium',
                    isCurrent ? 'text-amber-200/90 font-semibold' : 'text-mist-400'
                  )}
                >
                  {stage.sublabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ActivitySection({ room, guestName, onNavigate }: GuestTabProps) {
  const {
    state,
    cancelGuestItem,
    submitGuestFeedback,
    updateGuestReminderStatus,
    replyGuestMessage,
  } = useDemo();

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'dining' | 'services' | 'reminders' | 'complaints' | 'messages' | 'lost_found'
  >('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Feedback modal state
  const [feedbackItem, setFeedbackItem] = useState<{ roleId: RoleId; itemId: string; title: string } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [dishRatings, setDishRatings] = useState<Record<string, { rating: number; comment?: string }>>({});
  const ratedOrder = feedbackItem ? state.items[feedbackItem.roleId]?.find(i => i.id === feedbackItem.itemId) : undefined;
  const feedbackDishes = [...new Map((ratedOrder?.orderLines || []).map(line => [line.itemId, line])).values()];

  // Quick reply modal state for messages
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
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

  // 1. Service requests & orders
  const myWorkItems = uniqueItems
    .filter((i) => i.guest && i.room === room)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  // 2. Reminders
  const myReminders = (state.guestReminders ?? []).filter((r) => r.room === room);

  // 3. Complaints
  const myComplaints = (state.guestComplaints ?? []).filter((c) => c.room === room);

  // 4. Front Desk Messages
  const myMessages = (state.frontDeskMessages ?? []).filter((m) => m.room === room);

  // 5. Lost & Found reports
  const myLostReports = (state.guestLostReports ?? []).filter((r) => r.room === room);

  // Counts
  const activeWorkCount = myWorkItems.filter(
    (r) => !['Completed', 'Delivered', 'Cancelled', 'Closed'].includes(r.status),
  ).length;
  const activeRemindersCount = myReminders.filter((r) => r.status !== 'completed').length;
  const activeComplaintsCount = myComplaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;
  const totalActiveCount = activeWorkCount + activeRemindersCount + activeComplaintsCount;

  // Filtered lists
  const filteredWorkItems = useMemo(() => {
    return myWorkItems.filter((item) => {
      if (activeFilter === 'active') {
        return !['Completed', 'Delivered', 'Cancelled', 'Closed'].includes(item.status);
      }
      if (activeFilter === 'dining') return item.category === 'room_service';
      if (activeFilter === 'services') return item.category !== 'room_service';
      return activeFilter === 'all';
    });
  }, [myWorkItems, activeFilter]);

  const showReminders = activeFilter === 'all' || activeFilter === 'active' || activeFilter === 'reminders';
  const showComplaints = activeFilter === 'all' || activeFilter === 'active' || activeFilter === 'complaints';
  const showMessages = activeFilter === 'all' || activeFilter === 'messages';
  const showLostFound = activeFilter === 'all' || activeFilter === 'lost_found';

  function handleCancelTask(roleId: RoleId, itemId: string, title: string) {
    cancelGuestItem(roleId, itemId);
    showToast(`Request "${title}" cancelled`);
  }

  function handleSendFeedback() {
    if (!feedbackItem) return;
    submitGuestFeedback(feedbackItem.roleId, feedbackItem.itemId, feedbackRating, feedbackComment, dishRatings);
    setFeedbackItem(null);
    setFeedbackComment('');
    setDishRatings({});
    showToast('Thank you for rating our service!');
  }

  function handleSendReply(messageId: string) {
    if (!replyText.trim()) return;
    replyGuestMessage(messageId, replyText.trim(), 'guest');
    setReplyMessageId(null);
    setReplyText('');
    showToast('Reply dispatched to Front Desk');
  }

  function getCategoryIcon(category?: string) {
    switch (category) {
      case 'room_service':
        return UtensilsCrossed;
      case 'maintenance':
        return Wrench;
      case 'spa':
      case 'concierge':
      case 'recreation':
        return Flower2;
      case 'housekeeping':
      default:
        return Sparkles;
    }
  }

  return (
    <div data-tour="tour-activity-tab" className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs text-white shadow-lg">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="font-semibold text-emerald-300">{toastMessage}</p>
        </div>
      )}

      {/* Header & Filter Pills */}
      <div className="guest-card p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-amber-400" />
              <span>My Activity &amp; Live Tracking</span>
            </h2>
            <p className="text-[11px] text-mist-400">
              Real-time progress for all your orders, service tickets, reminders &amp; communications
            </p>
          </div>

          {totalActiveCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-ink-950 font-bold text-[10px] shrink-0">
              {totalActiveCount} active now
            </span>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            All Activity
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'active'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Active Now</span>
            {totalActiveCount > 0 && <span className="opacity-80">({totalActiveCount})</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('dining')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'dining'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            Dining Orders
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('services')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'services'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            Room Services
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('reminders')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'reminders'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            Reminders ({myReminders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('complaints')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'complaints'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            Complaints ({myComplaints.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('messages')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'messages'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            Front Desk Chat ({myMessages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('lost_found')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'lost_found'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            Lost &amp; Found ({myLostReports.length})
          </button>
        </div>
      </div>

      {/* 1. SERVICE REQUESTS & DINING ORDERS LIST */}
      {(activeFilter === 'all' || activeFilter === 'active' || activeFilter === 'dining' || activeFilter === 'services') && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Service Requests &amp; Orders"
            hint={`${filteredWorkItems.length} tasks registered for Room ${room}`}
          />

          {filteredWorkItems.length === 0 ? (
            <div className="guest-card p-6 text-center text-xs text-mist-400">
              No matching service requests found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredWorkItems.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const isExpanded = expandedItemId === item.id;
                const canCancel = item.status === 'Open' || item.status === 'Pending' || item.status === 'Assigned';
                const isDelivered = item.status === 'Delivered' || item.status === 'Completed';
                const roleId = (Object.entries(state.items).find(([, items]) => items.some(record => record.id === item.id))?.[0] || 'task_fulfiller') as RoleId;
                const orderLines = item.orderLines;

                return (
                  <div
                    key={item.id}
                    className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                  >
                    <div
                      className="p-3.5 flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300 shrink-0 mt-0.5">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-mist-400 font-mono">
                            {item.ref || 'Ref: REQ-' + item.id.slice(-4)} · {item.createdAt || 'Today'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <GuestPill tone={statusTone(item.status)}>{item.status}</GuestPill>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-mist-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-mist-400" />
                        )}
                      </div>
                    </div>

                    {/* Live Step-by-Step Progress Timeline */}
                    <div className="px-3.5 pb-2">
                      <ServiceRequestTimeline status={item.status} createdAt={item.createdAt} />
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3 text-xs">
                        {item.description && (
                          <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                            <span className="text-[10px] font-semibold text-mist-400 uppercase">
                              Instructions &amp; Details
                            </span>
                            <p className="text-mist-200 text-xs">{item.description}</p>
                          </div>
                        )}

                        {/* Order lines if room service */}
                        {orderLines && orderLines.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-mist-400 uppercase">
                              Ordered Items
                            </span>
                            <div className="space-y-1">
                              {orderLines.map((l, i) => (
                                <div key={i} className="flex justify-between text-[11px] text-mist-300">
                                  <span>{l.qty}x {l.name}</span>
                                  <span className="font-mono text-white">{money(l.price * l.qty)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 justify-end">
                          {canCancel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelTask(roleId, item.id, item.title);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-[11px] font-semibold"
                            >
                              Cancel Request
                            </button>
                          )}

                          {isDelivered && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackItem({ roleId, itemId: item.id, title: item.title });
                                setFeedbackRating(item.feedback?.rating || 5);
                                setFeedbackComment(item.feedback?.comment || '');
                                setDishRatings(Object.fromEntries(Object.entries(item.dishFeedback || {}).map(([id, review]) => [id, { rating: review.rating, comment: review.comment }])));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-ink-950 font-bold text-[11px] hover:bg-amber-300"
                            >
                              Rate Experience
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. REMINDERS LIST */}
      {showReminders && myReminders.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Scheduled Reminders"
            hint={`${myReminders.length} reminder alerts set with Front Desk`}
          />

          <div className="space-y-2">
            {myReminders.map((rem) => {
              const isDone = rem.status === 'completed';

              return (
                <div
                  key={rem.id}
                  className={`guest-card p-3.5 flex items-center justify-between gap-3 ${
                    isDone ? 'opacity-60 bg-white/[0.02]' : 'border-sky-400/20 bg-sky-400/5'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-400/20 text-sky-300 shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <p className={`text-xs font-bold text-white truncate ${isDone ? 'line-through text-mist-400' : ''}`}>
                        {rem.title || rem.text}
                      </p>
                      <p className="text-[10px] text-mist-400">
                        {rem.dueDateTime} · Assigned to: {rem.assignedTo || 'Front Desk'}
                      </p>
                      {rem.specialInstructions && (
                        <p className="text-[10px] text-mist-300 italic">{rem.specialInstructions}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateGuestReminderStatus(rem.id, isDone ? 'pending' : 'completed')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      isDone
                        ? 'border-white/10 text-mist-400 hover:text-white'
                        : 'border-sky-400/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20'
                    }`}
                  >
                    {isDone ? 'Mark Active' : 'Mark Completed'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. COMPLAINTS LIST */}
      {showComplaints && myComplaints.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Service Recovery Cases"
            hint="Duty Manager Marcus Vance escalation cases"
          />

          <div className="space-y-2">
            {myComplaints.map((c) => (
              <div
                key={c.id}
                className="guest-card p-3.5 space-y-2 border border-rose-500/20 hover:border-rose-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-300 shrink-0 mt-0.5">
                      <HeartHandshake className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-300">{c.complaintId}</span>
                      <h4 className="text-xs font-bold text-white">{c.title}</h4>
                      <p className="text-[10px] text-mist-400">{c.category} · {c.submittedAt}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {c.status}
                  </span>
                </div>

                <p className="text-[11px] text-mist-200 bg-white/5 p-2 rounded-lg">{c.description}</p>

                {c.responseRemarks && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
                    <strong>Resolution Remarks:</strong> {c.responseRemarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FRONT DESK CONVERSATION THREADS */}
      {showMessages && myMessages.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Front Desk Communication"
            hint="2-way messages with Front Desk coordinator"
          />

          <div className="space-y-2.5">
            {myMessages.map((msg) => (
              <div key={msg.id} className="guest-card p-3.5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{msg.subject}</h4>
                    <p className="text-[10px] text-mist-400">{msg.createdAt}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-400/20 text-indigo-300">
                    {msg.status}
                  </span>
                </div>

                <p className="text-[11px] text-mist-200">{msg.message}</p>

                {/* Staff replies */}
                {msg.replies && msg.replies.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    {msg.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className={`p-2 rounded-lg text-[11px] ${
                          rep.sender === 'front_desk'
                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200'
                            : 'bg-white/5 text-mist-200'
                        }`}
                      >
                        <p className="text-[9px] font-bold opacity-75">{rep.senderName} · {rep.at}</p>
                        <p>{rep.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setReplyMessageId(msg.id)}
                    className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Reply</span>
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LOST AND FOUND TICKETS */}
      {showLostFound && myLostReports.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Lost &amp; Found Tickets"
            hint="Property tracking with Security &amp; Front Desk"
          />

          <div className="space-y-2">
            {myLostReports.map((r) => (
              <div key={r.id} className="guest-card p-3.5 space-y-1.5 border border-teal-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-amber-300 font-bold">{r.ref}</span>
                    <h4 className="text-xs font-bold text-white">{r.itemName}</h4>
                    <p className="text-[10px] text-mist-400">{r.category} · Lost at: {r.lastLocation}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                    {r.status}
                  </span>
                </div>
                <p className="text-[11px] text-mist-200">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RATING & FEEDBACK SHEET */}
      {feedbackItem && (
        <GuestSheet
          title={`Rate ${feedbackItem.title}`}
          onClose={() => { setFeedbackItem(null); setDishRatings({}); }}
          footer={
            <button
              type="button"
              onClick={handleSendFeedback}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md"
            >
              Submit Star Rating
            </button>
          }
        >
          <div className="space-y-4 text-xs text-center py-2">
            <p className="text-mist-300">How was your experience with this service?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Service rating ${star} of 5`} aria-pressed={star === feedbackRating}
                  onClick={() => setFeedbackRating(star)}
                  className="p-1.5 transition-transform hover:scale-125"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= feedbackRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-mist-500'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              aria-label="Service review" maxLength={1000}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Any compliments or suggestions for the team? (Optional)"
              className="guest-field w-full px-3 py-2 text-xs text-white text-left"
            />
            {feedbackDishes.length > 0 && <div className="space-y-4 text-left border-t border-white/10 pt-4"><h3 className="font-semibold">Rate your dishes (optional)</h3><p className="text-mist-300">These ratings are separate from the service rating.</p>{feedbackDishes.map(line => <div className="space-y-2" key={line.itemId}><label className="block">{line.dishName || line.name}<select aria-label={'Rating for ' + (line.dishName || line.name)} className="guest-field w-full mt-2 p-2" value={dishRatings[line.itemId]?.rating || ''} onChange={e => setDishRatings(prev => { const next = { ...prev }; if (!e.target.value) delete next[line.itemId]; else next[line.itemId] = { ...prev[line.itemId], rating: Number(e.target.value) }; return next; })}><option value="">Skip dish rating</option>{[5,4,3,2,1].map(r => <option key={r} value={r}>{r} / 5</option>)}</select></label>{dishRatings[line.itemId] && <textarea aria-label={'Review for ' + (line.dishName || line.name)} className="guest-field w-full p-2" rows={2} maxLength={1000} placeholder="Your dish review (optional)" value={dishRatings[line.itemId].comment || ''} onChange={e => setDishRatings(prev => ({ ...prev, [line.itemId]: { ...prev[line.itemId], comment: e.target.value } }))}/>}</div>)}</div>}
          </div>
        </GuestSheet>
      )}

      {/* QUICK REPLY SHEET */}
      {replyMessageId && (
        <GuestSheet
          title="Reply to Front Desk"
          onClose={() => setReplyMessageId(null)}
          footer={
            <button
              type="button"
              disabled={!replyText.trim()}
              onClick={() => handleSendReply(replyMessageId)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md disabled:opacity-40"
            >
              Send Reply
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply message..."
              className="guest-field w-full px-3 py-2 text-xs text-white"
            />
          </div>
        </GuestSheet>
      )}
    </div>
  );
}
