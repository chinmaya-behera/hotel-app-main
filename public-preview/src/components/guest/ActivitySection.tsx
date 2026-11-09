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
  Receipt,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Tag,
  ChefHat,
  Edit3,
  Calendar,
  FileText,
  Info,
  ThumbsUp,
  Image as ImageIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { RoleId, CustomDiningRequest, CompensationRefundRequest, WorkItem } from '@/types/demo';

/* ------------------------------------------------------------------ */
/* Service-Specific Feedback Tags Generator (Section 3.C)             */
/* ------------------------------------------------------------------ */

function getServiceFeedbackTags(category: string, serviceType?: string): string[] {
  const cat = (category || serviceType || '').toLowerCase();

  if (cat.includes('dining') || cat.includes('custom_dining') || cat.includes('room_service') || cat.includes('food')) {
    return [
      'Food Quality',
      'Delicious Taste',
      'Hot & Fresh',
      'On-Time Delivery',
      'Great Presentation',
      'Portion Size',
      'Friendly Server',
      'Needs Improvement',
    ];
  }
  if (cat.includes('housekeeping') || cat.includes('cleaning') || cat.includes('linen')) {
    return [
      'Impeccable Cleanliness',
      'Prompt Service',
      'Friendly Attendant',
      'Fresh Linens',
      'Attention to Detail',
      'Polite Staff',
      'Needs Improvement',
    ];
  }
  if (cat.includes('maintenance') || cat.includes('repair') || cat.includes('engineering')) {
    return [
      'Fixed Perfectly',
      'Prompt Response',
      'Courteous Engineer',
      'Clean Workmanship',
      'Clear Explanation',
      'Quick Resolution',
      'Needs Improvement',
    ];
  }
  if (cat.includes('spa') || cat.includes('wellness') || cat.includes('massage')) {
    return [
      'Deeply Relaxing',
      'Skilled Therapist',
      'Tranquil Ambience',
      'On Time',
      'Rejuvenating',
      'Great Atmosphere',
      'Needs Improvement',
    ];
  }
  if (cat.includes('concierge') || cat.includes('tour') || cat.includes('transport')) {
    return [
      'Highly Knowledgeable',
      'Great Recommendation',
      'Courteous Staff',
      'Fast Booking',
      'Seamless Service',
      'Helpful Advice',
      'Needs Improvement',
    ];
  }
  if (cat.includes('front_desk') || cat.includes('reception') || cat.includes('message')) {
    return [
      'Warm Welcome',
      'Rapid Resolution',
      'Very Helpful',
      'Clear Communication',
      'Polite Staff',
      'Attentive Care',
      'Could Be Faster',
    ];
  }
  if (cat.includes('compensation') || cat.includes('refund') || cat.includes('dispute')) {
    return [
      'Fair Resolution',
      'Speedy Processing',
      'Courteous Communication',
      'Clear Explanation',
      'Professional Handling',
      'Satisfied',
      'Needs Improvement',
    ];
  }
  if (cat.includes('lost') || cat.includes('found')) {
    return [
      'Quick Identification',
      'Safe Handling',
      'Helpful Staff',
      'Smooth Handover',
      'Reassuring',
      'Grateful',
      'Needs Improvement',
    ];
  }
  if (cat.includes('event') || cat.includes('celebration')) {
    return [
      'Stunning Setup',
      'Flawless Coordination',
      'Memorable Experience',
      'Attentive Team',
      'On Schedule',
      'Exceeded Expectations',
      'Needs Improvement',
    ];
  }
  return [
    'Excellent Service',
    'On Time',
    'Friendly Staff',
    'Good Quality',
    'Satisfied',
    'Needs Improvement',
  ];
}

/* ------------------------------------------------------------------ */
/* Multi-Step Service Request Timeline with Aligned Nodes             */
/* ------------------------------------------------------------------ */

interface TimelineStage {
  key: string;
  label: string;
  sublabel: string;
}

function getStagesForType(type: 'standard' | 'custom_dining' | 'refund' | 'lost', status: string, createdAt?: string): { stages: TimelineStage[]; currentStep: number; isCancelled: boolean } {
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

  if (type === 'custom_dining') {
    const isCancelled = status === 'Cancelled' || status === 'Rejected';
    let currentStep = 0;
    if (['Delivered', 'Completed'].includes(status)) currentStep = 3;
    else if (['In Preparation', 'Out for Delivery'].includes(status)) currentStep = 2;
    else if (['Price Quoted', 'Under Kitchen Review', 'Clarification Requested'].includes(status)) currentStep = 1;

    const stages: TimelineStage[] = [
      { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
      { key: 'review', label: 'Chef Review', sublabel: currentStep >= 1 ? (status === 'Price Quoted' ? 'Quote Ready' : 'Reviewed') : 'In Queue' },
      { key: 'cooking', label: 'Preparation', sublabel: currentStep >= 2 ? (status === 'Out for Delivery' ? 'On the Way' : 'Cooking') : 'Pending' },
      { key: 'delivered', label: 'Delivered', sublabel: currentStep >= 3 ? 'Delivered' : 'Pending' },
    ];
    return { stages, currentStep, isCancelled };
  }

  if (type === 'refund') {
    const isCancelled = status === 'Rejected' || status === 'Cancelled';
    let currentStep = 0;
    if (['Resolved', 'Completed'].includes(status)) currentStep = 3;
    else if (['Processing', 'Approved', 'Partially Approved'].includes(status)) currentStep = 2;
    else if (['Under Review', 'Additional Information Required'].includes(status)) currentStep = 1;

    const stages: TimelineStage[] = [
      { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
      { key: 'review', label: 'Under Review', sublabel: currentStep >= 1 ? (status === 'Additional Information Required' ? 'Info Needed' : 'Reviewing') : 'Queued' },
      { key: 'processing', label: 'Financial Action', sublabel: currentStep >= 2 ? (status === 'Approved' ? 'Approved' : 'Processing') : 'Pending' },
      { key: 'resolved', label: 'Resolved', sublabel: currentStep >= 3 ? 'Resolved' : 'Pending' },
    ];
    return { stages, currentStep, isCancelled };
  }

  if (type === 'lost') {
    const isCancelled = status === 'Cancelled' || status === 'Closed';
    let currentStep = 0;
    if (['Returned', 'Claimed', 'Claim Verified'].includes(status)) currentStep = 3;
    else if (['Found', 'Ready for Pickup', 'Item Located'].includes(status)) currentStep = 2;
    else if (['Searching', 'Under Investigation'].includes(status)) currentStep = 1;

    const stages: TimelineStage[] = [
      { key: 'reported', label: 'Reported', sublabel: formattedTime },
      { key: 'searching', label: 'Security Search', sublabel: currentStep >= 1 ? 'Searching' : 'Logged' },
      { key: 'located', label: 'Item Located', sublabel: currentStep >= 2 ? 'Matched' : 'Searching' },
      { key: 'returned', label: 'Handover', sublabel: currentStep >= 3 ? 'Handed Over' : 'Pending' },
    ];
    return { stages, currentStep, isCancelled };
  }

  // Standard work item timeline
  const isCancelled = status === 'Cancelled' || status === 'Rejected' || status === 'Blocked';
  let currentStep = 0;
  if (['Completed', 'Delivered', 'Resolved', 'Closed'].includes(status)) currentStep = 3;
  else if (['In Progress', 'Preparing', 'Ready', 'Out for Delivery', 'On the way'].includes(status)) currentStep = 2;
  else if (['Assigned', 'Accepted'].includes(status)) currentStep = 1;

  const stages: TimelineStage[] = [
    { key: 'requested', label: 'Requested', sublabel: formattedTime },
    { key: 'assigned', label: 'Assigned', sublabel: currentStep >= 1 ? 'Dispatched' : 'In queue' },
    { key: 'inprogress', label: 'In Progress', sublabel: currentStep >= 2 ? 'Underway' : 'Waiting' },
    { key: 'completed', label: 'Completed', sublabel: currentStep >= 3 ? 'Fulfilled' : 'Pending' },
  ];
  return { stages, currentStep, isCancelled };
}

function ServiceRequestTimeline({
  type = 'standard',
  status,
  createdAt,
}: {
  type?: 'standard' | 'custom_dining' | 'refund' | 'lost';
  status: string;
  createdAt?: string;
}) {
  const { stages, currentStep, isCancelled } = getStagesForType(type, status, createdAt);

  if (isCancelled) {
    return (
      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-semibold">
          This {type === 'refund' ? 'claim was declined or closed.' : type === 'custom_dining' ? 'custom food request was declined or cancelled.' : 'request was cancelled.'}
        </span>
      </div>
    );
  }

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
        {/* Background Track Line */}
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

/* ------------------------------------------------------------------ */
/* Section 3.B: Rating and Feedback for Completed Tasks Component     */
/* ------------------------------------------------------------------ */

interface RatingFeedbackProps {
  itemId: string;
  category: string;
  serviceType?: string;
  existingFeedback?: {
    rating: number;
    comment?: string;
    tags?: string[];
    submittedAt?: string;
  };
  onSubmitFeedback: (rating: number, comment?: string, tags?: string[]) => void;
}

function TaskRatingAndFeedback({
  itemId,
  category,
  serviceType,
  existingFeedback,
  onSubmitFeedback,
}: RatingFeedbackProps) {
  const [isEditing, setIsEditing] = useState(!existingFeedback);
  const [rating, setRating] = useState(existingFeedback?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingFeedback?.tags ?? []);
  const [comment, setComment] = useState(existingFeedback?.comment ?? '');

  const availableTags = useMemo(
    () => getServiceFeedbackTags(category, serviceType),
    [category, serviceType]
  );

  function handleSave() {
    onSubmitFeedback(rating, comment.trim() || undefined, selectedTags);
    setIsEditing(false);
  }

  // If already submitted and not editing, show the submitted review
  if (existingFeedback && !isEditing) {
    return (
      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-400/25 space-y-2.5 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'h-4 w-4',
                    s <= existingFeedback.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-white/20'
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {existingFeedback.rating}.0 / 5.0
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Feedback Submitted
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-semibold text-mist-300 hover:text-white flex items-center gap-1 underline underline-offset-2 transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            Edit Feedback
          </button>
        </div>

        {existingFeedback.tags && existingFeedback.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {existingFeedback.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-200 text-[10px] font-medium"
              >
                ✓ {tag}
              </span>
            ))}
          </div>
        )}

        {existingFeedback.comment && (
          <p className="text-xs text-mist-200 italic bg-white/5 p-2.5 rounded-xl border border-white/5">
            &ldquo;{existingFeedback.comment}&rdquo;
          </p>
        )}

        {existingFeedback.submittedAt && (
          <p className="text-[10px] text-mist-400">
            Recorded at {existingFeedback.submittedAt}
          </p>
        )}
      </div>
    );
  }

  // Interactive submission form
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-400/30 space-y-3.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h5 className="text-xs font-bold text-white uppercase tracking-wider">
            Rate Your Experience
          </h5>
        </div>
        {existingFeedback && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[11px] text-mist-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Star Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
        <span className="text-xs text-mist-300 font-medium">How would you rate this service?</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = (hoverRating || rating) >= star;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    active
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-white/20'
                  )}
                />
              </button>
            );
          })}
          <span className="ml-2 font-mono text-xs font-bold text-amber-300 w-8 text-right">
            {rating} / 5
          </span>
        </div>
      </div>

      {/* Service-Specific Quick Feedback Tags */}
      {availableTags.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-mist-400">
            Quick Feedback Tags (Select all that apply)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    );
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
                    isSelected
                      ? 'bg-amber-400 text-ink-950 font-bold border-amber-300 shadow-sm'
                      : 'bg-white/5 text-mist-300 border-white/10 hover:border-white/30 hover:text-white'
                  )}
                >
                  {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback Text Area */}
      <div className="space-y-1">
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any special remarks, compliments, or suggestions for the team? (Optional)"
          className="guest-field w-full px-3 py-2 text-xs text-white resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 shadow-md transition-all flex items-center gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{existingFeedback ? 'Update Feedback' : 'Submit Feedback'}</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main ActivitySection Component                                      */
/* ------------------------------------------------------------------ */

export function ActivitySection({ room, guestName, onNavigate }: GuestTabProps) {
  const {
    state,
    cancelGuestItem,
    submitGuestFeedback,
    updateGuestReminderStatus,
    replyGuestMessage,
    guestApproveCustomDiningQuote,
    guestReplyCustomDiningClarification,
    guestProvideAdditionalRefundInfo,
  } = useDemo();

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'dining' | 'services' | 'refunds' | 'reminders' | 'complaints' | 'messages' | 'lost_found'
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

  // Interactive inline replies for custom dining clarification
  const [clarificationReplies, setClarificationReplies] = useState<Record<string, string>>({});

  // Interactive inline replies for refund additional info
  const [refundInfoReplies, setRefundInfoReplies] = useState<Record<string, string>>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }

  // 1. Custom Dining Requests (Section 1 & 5)
  const myCustomDining = useMemo(() => {
    return (state.customDiningRequests ?? [])
      .filter((c) => c.room === room)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [state.customDiningRequests, room]);

  // 2. Compensation & Refund Requests (Section 4 & 5)
  const myCompensationRefunds = useMemo(() => {
    return (state.guestCompensationRefundRequests ?? [])
      .filter((cr) => cr.room === room)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [state.guestCompensationRefundRequests, room]);

  // 3. Regular Work Items (deduplicating linked customDiningId and compensationRefundId)
  const allItems = Object.values(state.items ?? {}).flat();
  const seenIds = new Set<string>();
  const uniqueItems: WorkItem[] = [];
  for (const item of allItems) {
    if (item && item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }

  const myWorkItems = useMemo(() => {
    return uniqueItems
      .filter(
        (i) =>
          i.guest &&
          i.room === room &&
          !i.customDiningId && // already rendered with full custom dish controls
          !i.compensationRefundId // already rendered with full refund controls
      )
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [uniqueItems, room]);

  // 4. Reminders
  const myReminders = useMemo(() => {
    return (state.guestReminders ?? []).filter((r) => r.room === room);
  }, [state.guestReminders, room]);

  // 5. Complaints
  const myComplaints = useMemo(() => {
    return (state.guestComplaints ?? []).filter((c) => c.room === room);
  }, [state.guestComplaints, room]);

  // 6. Front Desk Messages
  const myMessages = useMemo(() => {
    return (state.frontDeskMessages ?? []).filter((m) => m.room === room);
  }, [state.frontDeskMessages, room]);

  // 7. Lost & Found reports
  const myLostReports = useMemo(() => {
    return (state.guestLostReports ?? []).filter((r) => r.room === room);
  }, [state.guestLostReports, room]);

  // Active counts calculation
  const activeWorkCount = myWorkItems.filter(
    (r) => !['Completed', 'Delivered', 'Cancelled', 'Closed'].includes(r.status)
  ).length;

  const activeCustomDiningCount = myCustomDining.filter(
    (c) => !['Delivered', 'Cancelled', 'Rejected'].includes(c.status)
  ).length;

  const activeRefundsCount = myCompensationRefunds.filter(
    (r) => !['Resolved', 'Rejected', 'Cancelled'].includes(r.status)
  ).length;

  const activeRemindersCount = myReminders.filter((r) => r.status !== 'completed').length;
  const activeComplaintsCount = myComplaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length;

  const totalActiveCount =
    activeWorkCount +
    activeCustomDiningCount +
    activeRefundsCount +
    activeRemindersCount +
    activeComplaintsCount;

  // Filter conditions
  const showDining = activeFilter === 'all' || activeFilter === 'dining' || activeFilter === 'active';
  const showServices = activeFilter === 'all' || activeFilter === 'services' || activeFilter === 'active';
  const showRefunds = activeFilter === 'all' || activeFilter === 'refunds' || (activeFilter === 'active' && activeRefundsCount > 0);
  const showReminders = activeFilter === 'all' || activeFilter === 'reminders' || (activeFilter === 'active' && activeRemindersCount > 0);
  const showComplaints = activeFilter === 'all' || activeFilter === 'complaints' || (activeFilter === 'active' && activeComplaintsCount > 0);
  const showMessages = activeFilter === 'all' || activeFilter === 'messages';
  const showLostFound = activeFilter === 'all' || activeFilter === 'lost_found';

  // Filtered regular work items
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

  // Filtered custom dining items
  const filteredCustomDining = useMemo(() => {
    if (activeFilter === 'active') {
      return myCustomDining.filter((c) => !['Delivered', 'Cancelled', 'Rejected'].includes(c.status));
    }
    return myCustomDining;
  }, [myCustomDining, activeFilter]);

  // Filtered refund items
  const filteredRefunds = useMemo(() => {
    if (activeFilter === 'active') {
      return myCompensationRefunds.filter((r) => !['Resolved', 'Rejected', 'Cancelled'].includes(r.status));
    }
    return myCompensationRefunds;
  }, [myCompensationRefunds, activeFilter]);

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
      case 'dining':
      case 'custom_dining':
        return UtensilsCrossed;
      case 'maintenance':
        return Wrench;
      case 'spa':
      case 'concierge':
      case 'recreation':
        return Flower2;
      case 'compensation':
        return Receipt;
      case 'lost_found':
        return PackageSearch;
      case 'housekeeping':
      default:
        return Sparkles;
    }
  }

  return (
    <div data-tour="tour-activity-tab" className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs text-white shadow-lg animate-in fade-in slide-in-from-top duration-300">
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
              Interactive timeline, real-time tracking, quotes &amp; experience feedback for Room {room}
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
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'dining'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="h-3 w-3" />
            <span>Dining &amp; Custom Dishes</span>
            {myCustomDining.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400/20 text-amber-300">
                {myCustomDining.length}
              </span>
            )}
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
            onClick={() => setActiveFilter('refunds')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'refunds'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            <Receipt className="h-3 w-3" />
            <span>Refunds &amp; Disputes ({myCompensationRefunds.length})</span>
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

      {/* 1. CUSTOM DINING REQUESTS (Section 1 & Section 5) */}
      {showDining && filteredCustomDining.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Custom Dining &amp; Bespoke Chef Requests"
            hint={`${filteredCustomDining.length} custom food dish requests for Room ${room}`}
          />

          <div className="space-y-3">
            {filteredCustomDining.map((custom) => {
              const isExpanded = expandedItemId === custom.id;
              const isDelivered = custom.status === 'Delivered';
              const isPriceQuoted = custom.status === 'Price Quoted';
              const isClarificationNeeded = custom.status === 'Clarification Requested';
              const replyValue = clarificationReplies[custom.id] ?? '';

              return (
                <div
                  key={custom.id}
                  className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                >
                  {/* Compact Header (Always Visible) */}
                  <div
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedItemId(isExpanded ? null : custom.id)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
                        <ChefHat className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-white truncate">
                            Custom Dish: {custom.dishName || `${custom.cuisine} Dish`}
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            {custom.cuisine}
                          </span>
                        </div>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {custom.ref} · {custom.createdAt} · {custom.servings} {custom.servings === 1 ? 'serving' : 'servings'}
                        </p>
                        <p className="text-[11px] text-mist-300 line-clamp-1">
                          {custom.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <GuestPill tone={statusTone(custom.status)}>{custom.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Multi-step progress timeline */}
                  <div className="px-3.5 pb-2">
                    <ServiceRequestTimeline
                      type="custom_dining"
                      status={custom.status}
                      createdAt={custom.createdAt}
                    />
                  </div>

                  {/* Expanded Request Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* Dish Spec Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Dietary</span>
                          <span className="text-white font-medium">{custom.dietaryPreference}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Spice Level</span>
                          <span className="text-amber-300 font-medium">{custom.spiceLevel}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Delivery Time</span>
                          <span className="text-mist-200 font-medium">{custom.deliveryTimePreference}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Allergies to Avoid</span>
                          <span className={custom.allergiesToAvoid ? 'text-rose-300 font-semibold' : 'text-mist-400'}>
                            {custom.allergiesToAvoid || 'None stated'}
                          </span>
                        </div>
                      </div>

                      {/* Request Description & Special Instructions */}
                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">
                          Preparation Requirements
                        </span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{custom.description}</p>
                        {custom.specialPreferences && (
                          <p className="text-mist-300 text-[11px] pt-1">
                            <strong className="text-mist-400">Special Preferences:</strong> {custom.specialPreferences}
                          </p>
                        )}
                        {custom.additionalInstructions && (
                          <p className="text-mist-300 text-[11px] pt-0.5">
                            <strong className="text-mist-400">Chef Instructions:</strong> {custom.additionalInstructions}
                          </p>
                        )}
                      </div>

                      {/* Optional Photo Attachment */}
                      {custom.imageUrl && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                          <ImageIcon className="h-4 w-4 text-sky-400 shrink-0" />
                          <span className="text-[11px] text-mist-300">Reference Photo attached</span>
                          <span className="text-[10px] font-mono text-mist-400 truncate max-w-xs">{custom.imageUrl}</span>
                        </div>
                      )}

                      {/* Staff Quote & Prep Time */}
                      {custom.quotedPrice !== undefined && (
                        <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-3 flex-wrap">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                              Executive Chef Quoted Price &amp; Timeline
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-base font-bold text-white font-mono">
                                ₹{custom.quotedPrice.toLocaleString('en-IN')}
                              </span>
                              {custom.quotedPrepTime && (
                                <span className="text-xs text-amber-200 font-medium">
                                  Est. Time: {custom.quotedPrepTime}
                                </span>
                              )}
                            </div>
                            {custom.kitchenNote && (
                              <p className="text-[11px] text-mist-200 italic">&ldquo;{custom.kitchenNote}&rdquo;</p>
                            )}
                          </div>

                          {/* Guest Approval Buttons if pending quote approval */}
                          {isPriceQuoted && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => guestApproveCustomDiningQuote(custom.id, false)}
                                className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold"
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                onClick={() => guestApproveCustomDiningQuote(custom.id, true)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 shadow-md"
                              >
                                Approve Price &amp; Confirm Order
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Kitchen Clarification Inquiry & Guest Reply Form */}
                      {isClarificationNeeded && (
                        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-400/30 space-y-2.5">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Kitchen Clarification Inquiry
                            </span>
                            <p className="text-xs text-sky-100 italic bg-white/5 p-2 rounded-xl">
                              &ldquo;{custom.kitchenNote || 'The chef needs more information regarding your dish preferences.'}&rdquo;
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={replyValue}
                              onChange={(e) =>
                                setClarificationReplies((prev) => ({ ...prev, [custom.id]: e.target.value }))
                              }
                              placeholder="Type your response for the chef..."
                              className="guest-field flex-1 px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              disabled={!replyValue.trim()}
                              onClick={() => {
                                guestReplyCustomDiningClarification(custom.id, replyValue.trim());
                                setClarificationReplies((prev) => ({ ...prev, [custom.id]: '' }));
                                showToast('Clarification sent to the kitchen!');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-400 text-ink-950 font-bold text-xs hover:bg-sky-300 disabled:opacity-40"
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Guest Clarification Reply History */}
                      {custom.guestClarificationReply && (
                        <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-mist-300">
                          <strong className="text-mist-400">Your Response:</strong> &ldquo;{custom.guestClarificationReply}&rdquo;
                        </div>
                      )}

                      {/* Section 3.B: Rating and Feedback for genuinely Delivered/Completed custom dishes */}
                      {isDelivered && (
                        <TaskRatingAndFeedback
                          itemId={custom.id}
                          category="custom_dining"
                          serviceType="dining"
                          existingFeedback={custom.feedback}
                          onSubmitFeedback={(rating, comment, tags) => {
                            submitGuestFeedback('task_fulfiller', custom.id, rating, comment, tags);
                            showToast('Thank you for rating your custom dining experience!');
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. COMPENSATION & REFUND REQUESTS (Section 4 & Section 5) */}
      {showRefunds && filteredRefunds.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Compensation &amp; Refund Claims"
            hint={`${filteredRefunds.length} financial and billing dispute cases logged`}
          />

          <div className="space-y-3">
            {filteredRefunds.map((refund) => {
              const isExpanded = expandedItemId === refund.id;
              const isResolved = refund.status === 'Resolved';
              const isInfoRequired = refund.status === 'Additional Information Required';
              const replyInfoValue = refundInfoReplies[refund.id] ?? '';

              return (
                <div
                  key={refund.id}
                  className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                >
                  {/* Compact Header */}
                  <div
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedItemId(isExpanded ? null : refund.id)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-white truncate">
                            {refund.category}
                          </p>
                          {refund.amountRequested !== undefined && refund.amountRequested > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                              Claim: ₹{refund.amountRequested.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {refund.ref} · {refund.createdAt} · Room {refund.room}
                        </p>
                        <p className="text-[11px] text-mist-300 line-clamp-1">
                          {refund.reason}: {refund.detailedExplanation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <GuestPill tone={statusTone(refund.status)}>{refund.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Multi-step progress timeline */}
                  <div className="px-3.5 pb-2">
                    <ServiceRequestTimeline
                      type="refund"
                      status={refund.status}
                      createdAt={refund.createdAt}
                    />
                  </div>

                  {/* Expanded Claim Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* Meta Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Booking Reference</span>
                          <span className="text-white font-mono font-medium">{refund.bookingReference}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Preferred Resolution</span>
                          <span className="text-amber-300 font-medium">{refund.preferredResolution}</span>
                        </div>
                        {refund.relatedService && (
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-[10px] text-mist-400 block font-semibold uppercase">Related Service</span>
                            <span className="text-mist-200 font-medium">{refund.relatedService}</span>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">
                          Claim Description &amp; Incident Notes
                        </span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{refund.detailedExplanation}</p>
                      </div>

                      {/* Staff Guest-Visible Response */}
                      {refund.staffGuestResponse && (
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                            Front Desk Management Response
                          </span>
                          <p className="text-xs text-indigo-100">{refund.staffGuestResponse}</p>
                          {refund.approvedAmount !== undefined && (
                            <div className="pt-1.5 flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-mist-300">Approved Refund:</span>
                              <span className="text-sm font-bold text-emerald-400 font-mono">
                                ₹{refund.approvedAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                          {refund.resolutionDetails && (
                            <p className="text-[11px] text-mist-300 italic pt-0.5">
                              {refund.resolutionDetails}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Additional Information Request from Staff */}
                      {isInfoRequired && (
                        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-400/30 space-y-2.5">
                          <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Front Desk Needs Additional Information
                          </span>
                          <p className="text-xs text-sky-100 italic bg-white/5 p-2 rounded-xl">
                            &ldquo;{refund.additionalInfoRequested || 'Please provide further clarification or receipts.'}&rdquo;
                          </p>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={replyInfoValue}
                              onChange={(e) =>
                                setRefundInfoReplies((prev) => ({ ...prev, [refund.id]: e.target.value }))
                              }
                              placeholder="Provide additional details or transaction proof..."
                              className="guest-field flex-1 px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              disabled={!replyInfoValue.trim()}
                              onClick={() => {
                                guestProvideAdditionalRefundInfo(refund.id, replyInfoValue.trim());
                                setRefundInfoReplies((prev) => ({ ...prev, [refund.id]: '' }));
                                showToast('Information delivered to Front Desk.');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-400 text-ink-950 font-bold text-xs hover:bg-sky-300 disabled:opacity-40"
                            >
                              Submit Info
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Additional info already provided */}
                      {refund.additionalInfoProvided && (
                        <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-mist-300">
                          <strong className="text-mist-400">Information Provided by Guest:</strong> &ldquo;{refund.additionalInfoProvided}&rdquo;
                        </div>
                      )}

                      {/* Section 3.B: Rating and Feedback for genuinely Resolved refund claims */}
                      {isResolved && (
                        <TaskRatingAndFeedback
                          itemId={refund.id}
                          category="compensation"
                          serviceType="refund"
                          existingFeedback={refund.feedback}
                          onSubmitFeedback={(rating, comment, tags) => {
                            submitGuestFeedback('front_desk_coordinator', refund.id, rating, comment, tags);
                            showToast('Thank you for rating our resolution process!');
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. REGULAR SERVICE REQUESTS & ORDERS */}
      {(activeFilter === 'all' || activeFilter === 'active' || activeFilter === 'dining' || activeFilter === 'services') && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Service Requests &amp; Orders"
            hint={`${filteredWorkItems.length} operational tasks registered for Room ${room}`}
          />

          {filteredWorkItems.length === 0 ? (
            <div className="guest-card p-6 text-center text-xs text-mist-400">
              No matching service requests found in this view.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredWorkItems.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const isExpanded = expandedItemId === item.id;
                const canCancel = item.status === 'Open' || item.status === 'Pending' || item.status === 'Assigned';
                const isCompleted = item.status === 'Delivered' || item.status === 'Completed' || item.status === 'Resolved';
                const isDelivered = item.status === 'Delivered' || item.status === 'Completed';
                const roleId = (Object.entries(state.items).find(([, items]) => items.some(record => record.id === item.id))?.[0] || 'task_fulfiller') as RoleId;
                const orderLines = item.orderLines || (item as any).lines as { qty: number; name: string; price: number }[] | undefined;

                return (
                  <div
                    key={item.id}
                    className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                  >
                    {/* Compact Card Header */}
                    <div
                      className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
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
                          {item.description && (
                            <p className="text-[11px] text-mist-300 line-clamp-1">{item.description}</p>
                          )}
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
                            <p className="text-mist-200 text-xs whitespace-pre-line">{item.description}</p>
                          </div>
                        )}

                        {/* Order lines if dining / room service */}
                        {orderLines && orderLines.length > 0 && (
                          <div className="space-y-1 p-2.5 rounded-xl bg-white/5">
                            <span className="text-[10px] font-semibold text-mist-400 uppercase block mb-1">
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

                        {/* Staff Notes or Resolution Details */}
                        {item.notes && (
                          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-200">
                            <strong>Staff Remarks:</strong> {item.notes}
                          </div>
                        )}

                        {/* Cancel button if pending */}
                        {canCancel && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelTask(roleId, item.id, item.title);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-[11px] font-semibold transition-colors"
                            >
                              Cancel Request
                            </button>
                          </div>
                        )}

                        {/* Section 3.B: Rating and Feedback for genuinely completed work items */}
                        {isCompleted && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                            <TaskRatingAndFeedback
                              itemId={item.id}
                              category={item.category || 'room_service'}
                              serviceType={item.category}
                              existingFeedback={item.feedback}
                              onSubmitFeedback={(rating, comment, tags) => {
                                submitGuestFeedback(roleId, item.id, rating, comment, tags);
                                showToast('Thank you for rating our service!');
                              }}
                            />
                            {item.orderLines && item.orderLines.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeedbackItem({ roleId, itemId: item.id, title: item.title });
                                  setFeedbackRating(item.feedback?.rating || 5);
                                  setFeedbackComment(item.feedback?.comment || '');
                                  setDishRatings(Object.fromEntries(Object.entries(item.dishFeedback || {}).map(([id, review]) => [id, { rating: review.rating, comment: review.comment }])));
                                }}
                                className="self-end px-2.5 py-1.5 rounded-lg bg-amber-400 text-ink-950 font-bold text-[11px] hover:bg-amber-300"
                              >
                                Rate Dishes Separately
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. REMINDERS LIST */}
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

      {/* 5. COMPLAINTS LIST */}
      {showComplaints && myComplaints.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Service Recovery Cases"
            hint="Duty Manager Marcus Vance escalation cases"
          />

          <div className="space-y-2">
            {myComplaints.map((c) => {
              const isResolved = c.status === 'Resolved';

              return (
                <div
                  key={c.id}
                  className="guest-card p-3.5 space-y-2.5 border border-rose-500/20 hover:border-rose-500/40 transition-all"
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

                  {/* Rating for resolved complaint */}
                  {isResolved && (
                    <TaskRatingAndFeedback
                      itemId={c.id}
                      category="front_desk"
                      serviceType="complaint"
                      existingFeedback={c.feedback}
                      onSubmitFeedback={(rating, comment, tags) => {
                        submitGuestFeedback('front_desk_coordinator', c.id, rating, comment, tags);
                        showToast('Thank you for rating our service recovery!');
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. FRONT DESK CONVERSATION THREADS */}
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

      {/* 7. LOST AND FOUND TICKETS */}
      {showLostFound && myLostReports.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Lost &amp; Found Tickets"
            hint="Property tracking with Security &amp; Front Desk"
          />

          <div className="space-y-2">
            {myLostReports.map((r) => {
              const isResolved = ['Claim Verified', 'Returned', 'Item Found'].includes(r.status);

              return (
                <div key={r.id} className="guest-card p-3.5 space-y-2 border border-teal-500/20">
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

                  <ServiceRequestTimeline
                    type="lost"
                    status={r.status}
                    createdAt={r.submittedAt}
                  />

                  {/* Rating for returned or claimed item */}
                  {isResolved && (
                    <TaskRatingAndFeedback
                      itemId={r.id}
                      category="lost_found"
                      serviceType="lost"
                      existingFeedback={r.feedback}
                      onSubmitFeedback={(rating, comment, tags) => {
                        submitGuestFeedback('front_desk_coordinator', r.id, rating, comment, tags);
                        showToast('Thank you for rating our Lost & Found service!');
                      }}
                    />
                  )}
                </div>
              );
            })}
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
