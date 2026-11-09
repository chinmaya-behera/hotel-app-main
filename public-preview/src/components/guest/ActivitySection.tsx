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
  ShieldAlert,
  AlertCircle,
  Tag,
  ChefHat,
  Edit3,
  Calendar,
  FileText,
  Info,
  ThumbsUp,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { RoleId, CustomDiningRequest, CompensationRefundRequest, WorkItem, GuestComplaintRecord, GuestIncidentRecord, GuestFrontDeskMessage } from '@/types/demo';

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
  if (cat.includes('incident') || cat.includes('security')) {
    return [
      'Quick Response',
      'Professional Handling',
      'Reassuring Staff',
      'Clear Resolution',
      'Safety Prioritised',
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
/* Multi-Step Service Request Timelines for Every Specific Service   */
/* ------------------------------------------------------------------ */

export type ServiceTimelineType =
  | 'dining' // A. Dining / Custom Food Requests (5)
  | 'custom_dining'
  | 'amenities' // B. Room Services / Amenities (5)
  | 'cleaning' // C. Room Cleaning (5)
  | 'maintenance' // D. Maintenance & Technical Support (6)
  | 'front_desk' // E. Front Desk Requests (5)
  | 'incident'
  | 'complaint' // F. Complaints (6)
  | 'financial' // G. Financial Issues / Refunds & Disputes (6)
  | 'refund'
  | 'reminder' // H. Reminders (4)
  | 'chat' // I. Front Desk Chat (4)
  | 'lost_found' // J. Lost & Found (5)
  | 'lost';

interface TimelineStage {
  key: string;
  label: string;
  sublabel?: string;
}

function getStagesForService(
  type: ServiceTimelineType,
  status: string,
  createdAt?: string,
  meta?: { hasStaffReply?: boolean; isRejected?: boolean }
): { stages: TimelineStage[]; currentStep: number; isCancelled: boolean; isRejected: boolean } {
  const normStatus = (status || '').toLowerCase().trim();
  const isCancelled = ['cancelled', 'closed_unresolved', 'blocked'].includes(normStatus);
  const isRejected = ['rejected', 'declined'].includes(normStatus) || Boolean(meta?.isRejected);

  let formattedTime = 'Logged';
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

  switch (type) {
    case 'dining':
    case 'custom_dining': {
      // A. Dining / Custom Food Requests
      // 1. Submitted -> 2. Chef Review -> 3. Preparation -> 4. Ready for Delivery -> 5. Delivered
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'chef_review', label: 'Chef Review', sublabel: 'Kitchen Desk' },
        { key: 'preparation', label: 'Preparation', sublabel: 'In Kitchen' },
        { key: 'ready_delivery', label: 'Ready for Delivery', sublabel: 'Runner Ready' },
        { key: 'delivered', label: 'Delivered', sublabel: 'Delivered' },
      ];
      let currentStep = 0;
      if (['delivered', 'completed', 'fulfilled'].includes(normStatus)) currentStep = 4;
      else if (['ready for delivery', 'ready', 'out for delivery', 'on the way'].includes(normStatus)) currentStep = 3;
      else if (['preparation', 'in preparation', 'preparing', 'cooking', 'order confirmed'].includes(normStatus)) currentStep = 2;
      else if (['chef review', 'under review', 'under kitchen review', 'price quoted', 'clarification requested', 'assigned', 'accepted'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'amenities': {
      // B. Room Services / Amenities
      // 1. Submitted -> 2. Received by Housekeeping -> 3. Accepted -> 4. Service in Progress -> 5. Completed
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'received', label: 'Received by Housekeeping', sublabel: 'Housekeeping' },
        { key: 'accepted', label: 'Accepted', sublabel: 'Staff Confirmed' },
        { key: 'in_progress', label: 'Service in Progress', sublabel: 'Runner Dispatched' },
        { key: 'completed', label: 'Completed', sublabel: 'Delivered' },
      ];
      let currentStep = 0;
      if (['completed', 'delivered', 'closed'].includes(normStatus)) currentStep = 4;
      else if (['service in progress', 'in progress', 'dispatched', 'on the way'].includes(normStatus)) currentStep = 3;
      else if (['accepted', 'acknowledged'].includes(normStatus)) currentStep = 2;
      else if (['received by housekeeping', 'received', 'assigned', 'under review'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'cleaning': {
      // C. Room Cleaning
      // 1. Submitted -> 2. Received -> 3. Scheduled -> 4. Cleaning in Progress -> 5. Completed
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'received', label: 'Received', sublabel: 'Housekeeping Desk' },
        { key: 'scheduled', label: 'Scheduled', sublabel: 'Slot Confirmed' },
        { key: 'cleaning', label: 'Cleaning in Progress', sublabel: 'Attendant On Site' },
        { key: 'completed', label: 'Completed', sublabel: 'Room Inspected' },
      ];
      let currentStep = 0;
      if (['completed', 'finished', 'closed', 'inspected'].includes(normStatus)) currentStep = 4;
      else if (['cleaning in progress', 'in progress', 'started'].includes(normStatus)) currentStep = 3;
      else if (['scheduled', 'accepted', 'assigned'].includes(normStatus)) currentStep = 2;
      else if (['received', 'under review'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'maintenance': {
      // D. Maintenance & Technical Support
      // 1. Submitted -> 2. Received by Maintenance -> 3. Technician Assigned -> 4. Work in Progress -> 5. Resolved -> 6. Completed
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'received', label: 'Received by Maintenance', sublabel: 'Engineering' },
        { key: 'assigned', label: 'Technician Assigned', sublabel: 'Engineer On Duty' },
        { key: 'in_progress', label: 'Work in Progress', sublabel: 'Repair Underway' },
        { key: 'resolved', label: 'Resolved', sublabel: 'Fix Completed' },
        { key: 'completed', label: 'Completed', sublabel: 'Verified & Closed' },
      ];
      let currentStep = 0;
      if (['completed', 'closed'].includes(normStatus)) currentStep = 5;
      else if (['resolved', 'fixed'].includes(normStatus)) currentStep = 4;
      else if (['work in progress', 'in progress', 'in_progress'].includes(normStatus)) currentStep = 3;
      else if (['technician assigned', 'assigned', 'accepted'].includes(normStatus)) currentStep = 2;
      else if (['received by maintenance', 'received', 'under review'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'incident':
    case 'front_desk': {
      // E. Front Desk Requests
      // 1. Submitted -> 2. Received by Front Desk -> 3. Under Review -> 4. In Progress -> 5. Completed
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'received', label: 'Received by Front Desk', sublabel: 'Reception' },
        { key: 'under_review', label: 'Under Review', sublabel: 'Coordinator Desk' },
        { key: 'in_progress', label: 'In Progress', sublabel: 'In Action' },
        { key: 'completed', label: 'Completed', sublabel: 'Fulfilled' },
      ];
      let currentStep = 0;
      if (['completed', 'delivered', 'resolved', 'closed'].includes(normStatus)) currentStep = 4;
      else if (['in progress', 'processing', 'action in progress'].includes(normStatus)) currentStep = 3;
      else if (['under review', 'assigned', 'reviewing'].includes(normStatus)) currentStep = 2;
      else if (['received by front desk', 'received'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'complaint': {
      // F. Complaints
      // 1. Submitted -> 2. Received -> 3. Under Review -> 4. Action in Progress -> 5. Resolution Provided -> 6. Closed
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'received', label: 'Received', sublabel: 'Duty Desk' },
        { key: 'under_review', label: 'Under Review', sublabel: 'Investigation' },
        { key: 'action', label: 'Action in Progress', sublabel: 'Corrective Action' },
        { key: 'resolution', label: 'Resolution Provided', sublabel: 'Outcome Offered' },
        { key: 'closed', label: 'Closed', sublabel: 'Case Closed' },
      ];
      let currentStep = 0;
      if (['closed'].includes(normStatus)) currentStep = 5;
      else if (['resolution provided', 'resolved', 'settled'].includes(normStatus)) currentStep = 4;
      else if (['action in progress', 'investigating', 'in progress', 'action taken'].includes(normStatus)) currentStep = 3;
      else if (['under review', 'under investigation', 'assigned'].includes(normStatus)) currentStep = 2;
      else if (['received'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'refund':
    case 'financial': {
      // G. Financial Issues / Refunds & Disputes
      // 1. Submitted -> 2. Received -> 3. Under Verification -> 4. Approved / Rejected -> 5. Refund or Adjustment Processing -> 6. Resolved
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Submitted', sublabel: formattedTime },
        { key: 'received', label: 'Received', sublabel: 'Accounting' },
        { key: 'verification', label: 'Under Verification', sublabel: 'Folio Audit' },
        { key: 'approval', label: isRejected ? 'Rejected' : 'Approved / Rejected', sublabel: isRejected ? 'Claim Declined' : 'Decision Ready' },
        { key: 'processing', label: 'Refund or Adjustment Processing', sublabel: 'Finance Credit' },
        { key: 'resolved', label: 'Resolved', sublabel: 'Adjustment Done' },
      ];
      let currentStep = 0;
      if (['resolved', 'completed'].includes(normStatus)) currentStep = 5;
      else if (['refund or adjustment processing', 'processing', 'sent to finance'].includes(normStatus)) currentStep = 4;
      else if (['approved', 'partially approved', 'rejected'].includes(normStatus)) currentStep = 3;
      else if (['under verification', 'under review', 'additional information required'].includes(normStatus)) currentStep = 2;
      else if (['received'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'reminder': {
      // H. Reminders
      // 1. Reminder Scheduled -> 2. Upcoming -> 3. Triggered -> 4. Completed
      const stages: TimelineStage[] = [
        { key: 'scheduled', label: 'Reminder Scheduled', sublabel: formattedTime },
        { key: 'upcoming', label: 'Upcoming', sublabel: 'Queued' },
        { key: 'triggered', label: 'Triggered', sublabel: 'Calling Room' },
        { key: 'completed', label: 'Completed', sublabel: 'Handled' },
      ];
      let currentStep = 0;
      if (['completed', 'dismissed'].includes(normStatus)) currentStep = 3;
      else if (['triggered', 'ringing', 'calling', 'active'].includes(normStatus)) currentStep = 2;
      else if (['upcoming', 'pending'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'chat': {
      // I. Front Desk Chat
      // 1. Message Sent -> 2. Received -> 3. Staff Replied -> 4. Conversation Resolved
      const stages: TimelineStage[] = [
        { key: 'sent', label: 'Message Sent', sublabel: formattedTime },
        { key: 'received', label: 'Received', sublabel: 'Front Desk' },
        { key: 'replied', label: 'Staff Replied', sublabel: 'Reply Available' },
        { key: 'resolved', label: 'Conversation Resolved', sublabel: 'Resolved' },
      ];
      let currentStep = 0;
      if (['resolved', 'closed', 'completed'].includes(normStatus)) currentStep = 3;
      else if (meta?.hasStaffReply || ['replied', 'staff_replied'].includes(normStatus)) currentStep = 2;
      else if (['received', 'acknowledged', 'read'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }

    case 'lost':
    case 'lost_found': {
      // J. Lost & Found
      // 1. Claim Submitted -> 2. Verification in Progress -> 3. Approved / Rejected -> 4. Collection Arranged -> 5. Returned to Guest
      const stages: TimelineStage[] = [
        { key: 'submitted', label: 'Claim Submitted', sublabel: formattedTime },
        { key: 'verification', label: 'Verification in Progress', sublabel: 'Security Check' },
        { key: 'decision', label: isRejected ? 'Claim Rejected' : 'Approved / Rejected', sublabel: isRejected ? 'Declined' : 'Claim Verified' },
        { key: 'collection', label: 'Collection Arranged', sublabel: 'At Concierge' },
        { key: 'returned', label: 'Returned to Guest', sublabel: 'Handover' },
      ];
      let currentStep = 0;
      if (['returned', 'returned to guest', 'claimed'].includes(normStatus)) currentStep = 4;
      else if (['collection arranged', 'ready for pickup', 'item located', 'found'].includes(normStatus)) currentStep = 3;
      else if (['approved', 'claim verified', 'rejected'].includes(normStatus)) currentStep = 2;
      else if (['verification in progress', 'searching', 'under investigation'].includes(normStatus)) currentStep = 1;
      else currentStep = 0;

      return { stages, currentStep, isCancelled, isRejected };
    }
  }
}

function getWorkItemServiceType(item: WorkItem): ServiceTimelineType {
  const cat = (item.category || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  if (
    cat.includes('dining') ||
    cat.includes('food') ||
    cat === 'room_service' ||
    title.includes('dining') ||
    title.includes('breakfast') ||
    title.includes('meal')
  ) {
    return 'dining';
  }
  if (
    cat.includes('maintenance') ||
    cat.includes('repair') ||
    cat.includes('engineering') ||
    title.includes('repair') ||
    title.includes('maintenance')
  ) {
    return 'maintenance';
  }
  if (cat.includes('housekeeping')) {
    if (
      title.includes('cleaning') ||
      title.includes('clean') ||
      title.includes('turndown') ||
      title.includes('linen')
    ) {
      return 'cleaning';
    }
    return 'amenities';
  }
  if (cat.includes('front_desk') || cat.includes('reception')) {
    return 'front_desk';
  }
  return 'amenities';
}

function ServiceRequestTimeline({
  type = 'amenities',
  status = 'pending',
  createdAt,
  hasStaffReply,
  isRejected,
}: {
  type?: ServiceTimelineType;
  status?: string;
  createdAt?: string;
  hasStaffReply?: boolean;
  isRejected?: boolean;
}) {
  const { stages, currentStep, isCancelled, isRejected: rejected } = getStagesForService(
    type,
    status,
    createdAt,
    { hasStaffReply, isRejected }
  );

  if (isCancelled) {
    return (
      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-semibold">
          This request was cancelled or closed.
        </span>
      </div>
    );
  }

  const numStages = stages.length;
  const gridColClass =
    numStages === 4
      ? 'grid-cols-4'
      : numStages === 5
      ? 'grid-cols-5'
      : 'grid-cols-6';

  const progressPercent = Math.min(100, Math.max(0, (currentStep / (numStages - 1)) * 100));

  return (
    <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-3 sm:p-4 my-2 overflow-x-auto no-scrollbar">
      <div className="flex items-center justify-between text-xs mb-3 font-semibold text-mist-300 min-w-[340px]">
        <span className="flex items-center gap-1.5 text-cyan-300 text-[11px] uppercase tracking-wider font-bold">
          <Clock className="h-3.5 w-3.5" />
          <span>Operational Progress</span>
        </span>
        <span className="text-[11px] font-mono text-mist-400">
          Stage {currentStep + 1} of {numStages}:{' '}
          <span className={rejected ? 'text-rose-400 font-bold' : 'text-white font-bold'}>
            {stages[currentStep]?.label || status}
          </span>
        </span>
      </div>

      <div className="relative w-full min-w-[340px] pt-1">
        {/* Background Track Line */}
        <div
          className="absolute top-[13px] h-0.5 bg-white/10 -translate-y-1/2 z-0"
          style={{
            left: `${100 / (numStages * 2)}%`,
            right: `${100 / (numStages * 2)}%`,
          }}
        />

        {/* Active Progress Track Line */}
        <div
          className="absolute top-[13px] h-0.5 bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            left: `${100 / (numStages * 2)}%`,
            width: `calc(${progressPercent}% * ${(numStages - 1) / numStages})`,
          }}
        />

        {/* Dynamic Nodes Grid */}
        <div className={cn('relative z-10 grid w-full', gridColClass)}>
          {stages.map((stage, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;
            const isStageRejected = isCurrent && rejected;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center px-1">
                <div className="h-[26px] w-[26px] flex items-center justify-center">
                  <span
                    className={cn(
                      'rounded-full flex items-center justify-center transition-all duration-300',
                      isDone && 'h-5 w-5 bg-emerald-400 text-ink-950 shadow-[0_0_10px_rgba(52,211,153,0.5)] ring-2 ring-emerald-400/30',
                      isCurrent && !isStageRejected && 'h-6 w-6 bg-amber-400 text-ink-950 shadow-[0_0_12px_rgba(251,191,36,0.6)] ring-4 ring-amber-400/25 animate-pulse',
                      isStageRejected && 'h-6 w-6 bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] ring-4 ring-rose-500/30',
                      isUpcoming && 'h-4 w-4 bg-ink-900 border-2 border-white/20'
                    )}
                  >
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />}
                    {isCurrent && !isStageRejected && <span className="h-2 w-2 rounded-full bg-ink-950" />}
                    {isStageRejected && <XCircle className="h-3.5 w-3.5 stroke-[2.5]" />}
                  </span>
                </div>

                <p
                  className={cn(
                    'text-[9px] sm:text-[11px] font-bold mt-2 leading-tight transition-colors line-clamp-2',
                    isDone && 'text-emerald-300',
                    isCurrent && (isStageRejected ? 'text-rose-400' : 'text-amber-300'),
                    isUpcoming && 'text-mist-400'
                  )}
                >
                  {stage.label}
                </p>

                {stage.sublabel && (
                  <p
                    className={cn(
                      'text-[8px] sm:text-[9px] mt-0.5 truncate max-w-full font-medium',
                      isCurrent ? 'text-amber-200/90 font-semibold' : 'text-mist-500'
                    )}
                  >
                    {stage.sublabel}
                  </p>
                )}
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
  orderLines?: Array<{ itemId?: string; dishName?: string; name: string }>;
  existingFeedback?: {
    rating: number;
    comment?: string;
    tags?: string[];
    submittedAt?: string;
  };
  existingDishFeedback?: Record<string, { rating: number; comment?: string; submittedAt?: string }>;
  onSubmitFeedback: (
    rating: number,
    comment?: string,
    tags?: string[],
    dishes?: Record<string, { rating: number; comment?: string }>
  ) => void;
}

function TaskRatingAndFeedback({
  itemId,
  category,
  serviceType,
  orderLines,
  existingFeedback,
  existingDishFeedback,
  onSubmitFeedback,
}: RatingFeedbackProps) {
  const [isEditing, setIsEditing] = useState(!existingFeedback);
  const [rating, setRating] = useState(existingFeedback?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingFeedback?.tags ?? []);
  const [comment, setComment] = useState(existingFeedback?.comment ?? '');

  const [dishRatings, setDishRatings] = useState<Record<string, { rating: number; comment?: string }>>(() => {
    if (existingDishFeedback) {
      return Object.fromEntries(
        Object.entries(existingDishFeedback).map(([id, val]) => [id, { rating: val.rating, comment: val.comment }])
      );
    }
    return {};
  });

  const uniqueDishes = useMemo(() => {
    if (!orderLines || orderLines.length === 0) return [];
    const map = new Map<string, { itemId: string; name: string }>();
    for (const l of orderLines) {
      const id = l.itemId || l.name;
      if (!map.has(id)) {
        map.set(id, { itemId: id, name: l.dishName || l.name });
      }
    }
    return Array.from(map.values());
  }, [orderLines]);

  const availableTags = useMemo(
    () => getServiceFeedbackTags(category, serviceType),
    [category, serviceType]
  );

  function handleSave() {
    onSubmitFeedback(
      rating,
      comment.trim() || undefined,
      selectedTags,
      Object.keys(dishRatings).length ? dishRatings : undefined
    );
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

      {/* Optional per-dish rating for dining items */}
      {uniqueDishes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-[11px] font-semibold text-mist-400">
            Rate Your Ordered Dishes (Optional)
          </span>
          <div className="space-y-2">
            {uniqueDishes.map((dish) => (
              <div key={dish.itemId} className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between gap-2">
                <span className="text-xs text-mist-200 font-medium truncate">{dish.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setDishRatings((prev) => ({
                          ...prev,
                          [dish.itemId]: {
                            ...prev[dish.itemId],
                            rating: prev[dish.itemId]?.rating === s ? 0 : s,
                          },
                        }))
                      }
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          (dishRatings[dish.itemId]?.rating || 0) >= s
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-white/20'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
          <span>{existingFeedback ? 'Update Feedback' : 'Submit Review'}</span>
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
    'all' | 'active' | 'dining' | 'services' | 'refunds' | 'reminders' | 'complaints' | 'incidents' | 'messages' | 'lost_found'
  >('all');

  // Independent expand/collapse tracking for multiple tasks
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const isItemExpanded = (id: string) => Boolean(expandedItems[id]);

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

  // 1. Custom Dining Requests
  const myCustomDining = useMemo(() => {
    return (state.customDiningRequests ?? [])
      .filter((c) => c.room === room)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [state.customDiningRequests, room]);

  // 2. Compensation & Refund Requests
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
          !i.customDiningId &&
          !i.compensationRefundId
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

  // 6. Incidents
  const myIncidents = useMemo(() => {
    return (state.guestIncidents ?? [])
      .filter((inc) => inc.room === room)
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  }, [state.guestIncidents, room]);

  // 7. Front Desk Messages
  const myMessages = useMemo(() => {
    return (state.frontDeskMessages ?? []).filter((m) => m.room === room);
  }, [state.frontDeskMessages, room]);

  // 8. Lost & Found reports
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
  const activeIncidentsCount = myIncidents.filter((inc) => inc.status !== 'Resolved' && inc.status !== 'Closed').length;

  const totalActiveCount =
    activeWorkCount +
    activeCustomDiningCount +
    activeRefundsCount +
    activeRemindersCount +
    activeComplaintsCount +
    activeIncidentsCount;

  // Filter conditions
  const showDining = activeFilter === 'all' || activeFilter === 'dining' || activeFilter === 'active';
  const showServices = activeFilter === 'all' || activeFilter === 'services' || activeFilter === 'active';
  const showRefunds = activeFilter === 'all' || activeFilter === 'refunds' || (activeFilter === 'active' && activeRefundsCount > 0);
  const showReminders = activeFilter === 'all' || activeFilter === 'reminders' || (activeFilter === 'active' && activeRemindersCount > 0);
  const showComplaints = activeFilter === 'all' || activeFilter === 'complaints' || (activeFilter === 'active' && activeComplaintsCount > 0);
  const showIncidents = activeFilter === 'all' || activeFilter === 'incidents' || (activeFilter === 'active' && activeIncidentsCount > 0);
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

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    if (activeFilter === 'active') {
      return myComplaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status));
    }
    return myComplaints;
  }, [myComplaints, activeFilter]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    if (activeFilter === 'active') {
      return myIncidents.filter((inc) => !['Resolved', 'Closed'].includes(inc.status));
    }
    return myIncidents;
  }, [myIncidents, activeFilter]);

  function handleCancelTask(roleId: RoleId, itemId: string, title: string) {
    cancelGuestItem(roleId, itemId);
    showToast(`Request "${title}" cancelled`);
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

  const totalSubmittedTasksCount =
    myWorkItems.length +
    myCustomDining.length +
    myCompensationRefunds.length +
    myReminders.length +
    myComplaints.length +
    myIncidents.length +
    myMessages.length +
    myLostReports.length;

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
            All Activity ({totalSubmittedTasksCount})
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
            Services &amp; Maintenance ({myWorkItems.filter(i => i.category !== 'room_service').length})
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
            onClick={() => setActiveFilter('incidents')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === 'incidents'
                ? 'bg-amber-400 text-ink-950 font-bold'
                : 'bg-white/5 text-mist-300 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Incidents ({myIncidents.length})</span>
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
            Front Desk ({myMessages.length})
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
        </div>
      </div>

      {/* Zero State if guest has submitted no activities at all */}
      {totalSubmittedTasksCount === 0 && (
        <div className="guest-card p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-mist-400">
            <ListChecks className="h-6 w-6 text-amber-400/80" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No requests submitted yet</h3>
            <p className="text-xs text-mist-400 max-w-sm mx-auto">
              When you order dining, book spa appointments, request maintenance, or submit front desk inquiries, they will appear here with live tracking.
            </p>
          </div>
        </div>
      )}

      {/* 1. CUSTOM DINING REQUESTS */}
      {showDining && filteredCustomDining.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Custom Dining &amp; Bespoke Chef Requests"
            hint={`${filteredCustomDining.length} custom food dish requests for Room ${room}`}
          />

          <div className="space-y-3">
            {filteredCustomDining.map((custom) => {
              const isExpanded = isItemExpanded(custom.id);
              const isDelivered = custom.status === 'Delivered';
              const isPriceQuoted = custom.status === 'Price Quoted';
              const isClarificationNeeded = custom.status === 'Clarification Requested';
              const replyValue = clarificationReplies[custom.id] ?? '';

              return (
                <div
                  key={custom.id}
                  className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                >
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(custom.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                        <ChefHat className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          Custom Dish: {custom.dishName || `${custom.cuisine} Dish`}
                        </p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {custom.ref} · {custom.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(custom.status)}>{custom.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="custom_dining"
                        status={custom.status}
                        createdAt={custom.createdAt}
                      />

                      {/* 2. Rating & Detailed Review (Only when genuinely completed) */}
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

                      {/* 3. Relevant Task Details */}
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
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Servings</span>
                          <span className="text-white font-medium">{custom.servings}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Delivery Time</span>
                          <span className="text-mist-200 font-medium">{custom.deliveryTimePreference}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">
                          Preparation Requirements
                        </span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{custom.description}</p>
                        {custom.allergiesToAvoid && (
                          <p className="text-[11px] text-rose-300 pt-0.5">
                            <strong>Allergies to Avoid:</strong> {custom.allergiesToAvoid}
                          </p>
                        )}
                        {custom.specialPreferences && (
                          <p className="text-mist-300 text-[11px] pt-0.5">
                            <strong>Special Preferences:</strong> {custom.specialPreferences}
                          </p>
                        )}
                        {custom.additionalInstructions && (
                          <p className="text-mist-300 text-[11px] pt-0.5">
                            <strong>Chef Instructions:</strong> {custom.additionalInstructions}
                          </p>
                        )}
                      </div>

                      {custom.imageUrl && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                          <ImageIcon className="h-4 w-4 text-sky-400 shrink-0" />
                          <span className="text-[11px] text-mist-300">Reference Photo attached</span>
                          <span className="text-[10px] font-mono text-mist-400 truncate max-w-xs">{custom.imageUrl}</span>
                        </div>
                      )}

                      {/* 4. Staff Response / Kitchen Quote / Clarification */}
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

                      {custom.guestClarificationReply && (
                        <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-mist-300">
                          <strong className="text-mist-400">Your Response:</strong> &ldquo;{custom.guestClarificationReply}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. COMPENSATION & REFUND REQUESTS */}
      {showRefunds && filteredRefunds.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Compensation &amp; Refund Claims"
            hint={`${filteredRefunds.length} financial and billing dispute cases logged`}
          />

          <div className="space-y-3">
            {filteredRefunds.map((refund) => {
              const isExpanded = isItemExpanded(refund.id);
              const isResolved = refund.status === 'Resolved';
              const isInfoRequired = refund.status === 'Additional Information Required';
              const replyInfoValue = refundInfoReplies[refund.id] ?? '';

              return (
                <div
                  key={refund.id}
                  className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                >
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(refund.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          Financial Issue: {refund.category}
                        </p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {refund.ref} · {refund.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(refund.status)}>{refund.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="refund"
                        status={refund.status}
                        createdAt={refund.createdAt}
                      />

                      {/* 2. Rating & Review (Only when resolved) */}
                      {isResolved && (
                        <TaskRatingAndFeedback
                          itemId={refund.id}
                          category="compensation"
                          serviceType="finance"
                          existingFeedback={refund.feedback}
                          onSubmitFeedback={(rating, comment, tags) => {
                            submitGuestFeedback('front_desk_coordinator', refund.id, rating, comment, tags);
                            showToast('Thank you for rating our dispute resolution!');
                          }}
                        />
                      )}

                      {/* 3. Relevant Task Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Booking Ref</span>
                          <span className="text-white font-mono font-medium">{refund.bookingReference}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Claim Amount</span>
                          <span className="text-amber-300 font-bold font-mono">
                            {refund.amountRequested !== undefined ? `₹${refund.amountRequested.toLocaleString('en-IN')}` : 'Fair credit'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Preferred Resolution</span>
                          <span className="text-mist-200 font-medium">{refund.preferredResolution}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">
                          Claim Details
                        </span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{refund.detailedExplanation}</p>
                      </div>

                      {refund.attachments && refund.attachments.length > 0 && (
                        <div className="space-y-1.5 p-2.5 rounded-xl bg-white/5">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase block">Attachments</span>
                          <div className="flex flex-wrap gap-2">
                            {refund.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-mist-200">
                                <Paperclip className="h-3 w-3 text-sky-400" />
                                <span className="truncate max-w-[140px]">{att.name}</span>
                                <span className="text-[10px] text-mist-400 font-mono">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Staff Response / Resolution */}
                      {refund.resolutionNotes && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
                          <strong>Duty Manager / Finance Remarks:</strong> {refund.resolutionNotes}
                        </div>
                      )}

                      {isInfoRequired && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2.5">
                          <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Front Desk Request for Clarification
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={replyInfoValue}
                              onChange={(e) =>
                                setRefundInfoReplies((prev) => ({ ...prev, [refund.id]: e.target.value }))
                              }
                              placeholder="Provide the requested details..."
                              className="guest-field flex-1 px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              disabled={!replyInfoValue.trim()}
                              onClick={() => {
                                guestProvideAdditionalRefundInfo(refund.id, replyInfoValue.trim());
                                setRefundInfoReplies((prev) => ({ ...prev, [refund.id]: '' }));
                                showToast('Additional details sent to Front Desk!');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 disabled:opacity-40"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. REGULAR WORK ITEMS (Dining Orders, Maintenance, Spa, Concierge, Recreation, Events) */}
      {(showServices || showDining) && filteredWorkItems.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Service Requests &amp; Orders"
            hint={`${filteredWorkItems.length} guest requests for Room ${room}`}
          />

          <div className="space-y-2.5">
            {filteredWorkItems.map((item) => {
              const Icon = getCategoryIcon(item.category);
              const isExpanded = isItemExpanded(item.id);
              const canCancel = item.status === 'Open' || item.status === 'Pending' || item.status === 'Assigned';
              const isCompleted = ['Delivered', 'Completed', 'Resolved', 'Closed'].includes(item.status);
              const roleId = (Object.entries(state.items).find(([, items]) => items.some(record => record.id === item.id))?.[0] || 'task_fulfiller') as RoleId;
              const orderLines = item.orderLines || (item as any).lines as Array<{ itemId?: string; dishName?: string; name: string; qty: number; price: number }> | undefined;

              return (
                <div
                  key={item.id}
                  className="guest-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all"
                >
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300 shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {item.ref || 'Ref: REQ-' + item.id.slice(-4)} · {item.createdAt || 'Today'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(item.status)}>{item.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type={getWorkItemServiceType(item)}
                        status={item.status}
                        createdAt={item.createdAt}
                      />

                      {/* 2. Rating & Detailed Review (Only when genuinely completed) */}
                      {isCompleted && (
                        <TaskRatingAndFeedback
                          itemId={item.id}
                          category={item.category || 'room_service'}
                          serviceType={item.category}
                          orderLines={orderLines}
                          existingFeedback={item.feedback}
                          existingDishFeedback={item.dishFeedback}
                          onSubmitFeedback={(rating, comment, tags, dishes) => {
                            submitGuestFeedback(roleId, item.id, rating, comment, tags, dishes);
                            showToast('Thank you for rating our service!');
                          }}
                        />
                      )}

                      {/* 3. Relevant Task Details */}
                      {orderLines && orderLines.length > 0 && (
                        <div className="space-y-1 p-2.5 rounded-xl bg-white/5">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase block mb-1">
                            Ordered Items
                          </span>
                          <div className="space-y-1">
                            {orderLines.map((l, i) => (
                              <div key={i} className="flex justify-between text-[11px] text-mist-300">
                                <span>{l.qty}x {l.dishName || l.name}</span>
                                <span className="font-mono text-white">{money(l.price * l.qty)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.description && (
                        <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase">
                            Instructions &amp; Details
                          </span>
                          <p className="text-mist-200 text-xs whitespace-pre-line">{item.description}</p>
                        </div>
                      )}

                      {/* 4. Staff Response or Resolution */}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. COMPLAINTS */}
      {showComplaints && filteredComplaints.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Service Recovery &amp; Complaints"
            hint="Duty Manager Marcus Vance escalation cases"
          />

          <div className="space-y-2.5">
            {filteredComplaints.map((c) => {
              const isExpanded = isItemExpanded(c.id);
              const isResolved = c.status === 'Resolved';

              return (
                <div
                  key={c.id}
                  className="guest-card overflow-hidden border border-rose-500/20 hover:border-rose-500/40 transition-all"
                >
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(c.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                        <HeartHandshake className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Complaint: {c.title}</p>
                        <p className="text-[10px] text-mist-400 font-mono">{c.complaintId} · {c.submittedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(c.status)}>{c.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="complaint"
                        status={c.status}
                        createdAt={c.submittedAt}
                      />

                      {/* 2. Rating & Review (Only when resolved) */}
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

                      {/* 3. Relevant Details */}
                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">
                          Reported Concern ({c.category})
                        </span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{c.description}</p>
                        {c.preferredResolution && (
                          <p className="text-[11px] text-amber-300 pt-0.5">
                            <strong>Requested Resolution:</strong> {c.preferredResolution}
                          </p>
                        )}
                      </div>

                      {c.attachments && c.attachments.length > 0 && (
                        <div className="space-y-1.5 p-2.5 rounded-xl bg-white/5">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase block">Attachments</span>
                          <div className="flex flex-wrap gap-2">
                            {c.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-mist-200">
                                <Paperclip className="h-3 w-3 text-sky-400" />
                                <span className="truncate max-w-[140px]">{att.name}</span>
                                <span className="text-[10px] text-mist-400 font-mono">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Staff Response */}
                      {c.responseRemarks && (
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
                          <strong>Duty Manager Resolution:</strong> {c.responseRemarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. INCIDENTS */}
      {showIncidents && filteredIncidents.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Incident Reports"
            hint={`${filteredIncidents.length} safety & security reports on file`}
          />

          <div className="space-y-2.5">
            {filteredIncidents.map((inc) => {
              const isExpanded = isItemExpanded(inc.id);
              const isCompleted = inc.status === 'Resolved' || inc.status === 'Closed';

              return (
                <div
                  key={inc.id}
                  className="guest-card overflow-hidden border border-rose-500/20 hover:border-rose-500/40 transition-all"
                >
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(inc.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                        <ShieldAlert className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Incident: {inc.category}</p>
                        <p className="text-[10px] text-mist-400 font-mono">{inc.ref} · {inc.submittedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(inc.status)}>{inc.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="incident"
                        status={inc.status}
                        createdAt={inc.submittedAt}
                      />

                      {/* 2. Rating & Review (Only when resolved) */}
                      {isCompleted && (
                        <TaskRatingAndFeedback
                          itemId={inc.id}
                          category="incident"
                          serviceType="security"
                          existingFeedback={inc.feedback}
                          onSubmitFeedback={(rating, comment, tags) => {
                            submitGuestFeedback('front_desk_coordinator', inc.id, rating, comment, tags);
                            showToast('Thank you for rating our incident response!');
                          }}
                        />
                      )}

                      {/* 3. Relevant Task Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Location</span>
                          <span className="text-white font-medium">{inc.location}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Urgency</span>
                          <span className={cn('font-semibold uppercase text-[10px]', inc.immediateAssistanceRequired ? 'text-rose-400' : 'text-amber-300')}>
                            {inc.immediateAssistanceRequired ? 'Immediate Assistance' : 'Standard'}
                          </span>
                        </div>
                        {inc.peopleInvolved && (
                          <div className="p-2 rounded-xl bg-white/5">
                            <span className="text-[10px] text-mist-400 block font-semibold uppercase">People Involved</span>
                            <span className="text-mist-200">{inc.peopleInvolved}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">Description</span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{inc.description}</p>
                        {inc.additionalInfo && (
                          <p className="text-[11px] text-mist-300 pt-0.5">
                            <strong>Additional Info:</strong> {inc.additionalInfo}
                          </p>
                        )}
                      </div>

                      {inc.attachments && inc.attachments.length > 0 && (
                        <div className="space-y-1.5 p-2.5 rounded-xl bg-white/5">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase block">Attachments</span>
                          <div className="flex flex-wrap gap-2">
                            {inc.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-mist-200">
                                <Paperclip className="h-3 w-3 text-sky-400" />
                                <span className="truncate max-w-[140px]">{att.name}</span>
                                <span className="text-[10px] text-mist-400 font-mono">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Staff Response */}
                      {(inc.staffResponse || inc.internalStaffNote) && (
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-200 space-y-1">
                          {inc.staffResponse && <p><strong>Staff Response:</strong> {inc.staffResponse}</p>}
                          {inc.internalStaffNote && <p className="text-mist-300"><strong>Notes:</strong> {inc.internalStaffNote}</p>}
                        </div>
                      )}
                    </div>
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
            {myMessages.map((msg) => {
              const isExpanded = isItemExpanded(msg.id);
              const isResolved = msg.status === 'Resolved' || msg.status === 'Closed';

              return (
                <div key={msg.id} className="guest-card overflow-hidden border border-white/10 hover:border-indigo-400/30 transition-all">
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(msg.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{msg.subject}</p>
                        <p className="text-[10px] text-mist-400 font-mono">
                          {(msg as any).ref || 'MSG-' + msg.id.slice(-4)} · {msg.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(msg.status)}>{msg.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="chat"
                        status={msg.status}
                        createdAt={msg.createdAt}
                        hasStaffReply={Boolean(msg.replies && msg.replies.some((r) => r.sender === 'front_desk'))}
                      />

                      {/* 2. Rating & Review (Only when resolved) */}
                      {isResolved && (
                        <TaskRatingAndFeedback
                          itemId={msg.id}
                          category="front_desk"
                          serviceType="inquiry"
                          existingFeedback={msg.feedback}
                          onSubmitFeedback={(rating, comment, tags) => {
                            submitGuestFeedback('front_desk_coordinator', msg.id, rating, comment, tags);
                            showToast('Thank you for rating our front desk service!');
                          }}
                        />
                      )}

                      {/* 3. Relevant Task Details */}
                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">Message</span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{msg.message}</p>
                      </div>

                      {/* 4. Staff Replies */}
                      {msg.replies && msg.replies.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase block">Conversation Thread</span>
                          {msg.replies.map((rep) => (
                            <div
                              key={rep.id}
                              className={`p-2.5 rounded-xl text-[11px] ${
                                rep.sender === 'front_desk'
                                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200'
                                  : 'bg-white/5 text-mist-200'
                              }`}
                            >
                              <p className="text-[9px] font-bold opacity-75">{rep.senderName} · {rep.at}</p>
                              <p className="mt-0.5">{rep.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setReplyMessageId(msg.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 hover:bg-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <span>Reply to Front Desk</span>
                          <Send className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. LOST AND FOUND TICKETS */}
      {showLostFound && myLostReports.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Lost &amp; Found Claims"
            hint="Property tracking with Security &amp; Front Desk"
          />

          <div className="space-y-2.5">
            {myLostReports.map((r) => {
              const isExpanded = isItemExpanded(r.id);
              const isResolved = ['Claim Verified', 'Returned', 'Item Found'].includes(r.status);

              return (
                <div key={r.id} className="guest-card overflow-hidden border border-teal-500/20 hover:border-teal-500/40 transition-all">
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(r.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-400/20 text-teal-300 shrink-0">
                        <PackageSearch className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Claim: {r.itemName}</p>
                        <p className="text-[10px] text-mist-400 font-mono">{r.ref} · {r.submittedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={statusTone(r.status)}>{r.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Strict Order 1. Progress -> 2. Rating & Review -> 3. Details -> 4. Staff Response */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3.5 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="lost"
                        status={r.status}
                        createdAt={r.submittedAt}
                      />

                      {/* 2. Rating & Review (Only when resolved) */}
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

                      {/* 3. Relevant Task Details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Category</span>
                          <span className="text-white font-medium">{r.category}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-mist-400 block font-semibold uppercase">Reported Location</span>
                          <span className="text-mist-200 font-medium">{r.lastLocation}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-mist-400 uppercase">Item Description</span>
                        <p className="text-mist-200 text-xs whitespace-pre-line">{r.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. REMINDERS */}
      {showReminders && myReminders.length > 0 && (
        <div className="space-y-3">
          <GuestSectionHeader
            title="Scheduled Reminders"
            hint={`${myReminders.length} reminder alerts set with Front Desk`}
          />

          <div className="space-y-2">
            {myReminders.map((rem) => {
              const isDone = rem.status === 'completed';
              const isExpanded = isItemExpanded(rem.id);

              return (
                <div
                  key={rem.id}
                  className={`guest-card overflow-hidden border transition-all ${
                    isDone ? 'opacity-60 bg-white/[0.02] border-white/5' : 'border-sky-400/20 bg-sky-400/5'
                  }`}
                >
                  {/* Collapsed Header - Strictly Minimal */}
                  <div
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpanded(rem.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-400/20 text-sky-300 shrink-0">
                        <Clock className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className={`text-xs font-bold text-white truncate ${isDone ? 'line-through text-mist-400' : ''}`}>
                          {rem.title || rem.text}
                        </p>
                        <p className="text-[10px] text-mist-400">
                          {rem.dueDateTime} · Assigned: {rem.assignedTo || 'Front Desk'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <GuestPill tone={isDone ? 'neutral' : 'info'}>{rem.status}</GuestPill>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-mist-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-mist-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3 text-xs">
                      {/* 1. Operational Progress */}
                      <ServiceRequestTimeline
                        type="reminder"
                        status={rem.status}
                        createdAt={rem.createdAt}
                      />

                      {rem.specialInstructions && (
                        <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-mist-400 uppercase">Instructions</span>
                          <p className="text-mist-200 text-xs">{rem.specialInstructions}</p>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => updateGuestReminderStatus(rem.id, isDone ? 'pending' : 'completed')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isDone
                              ? 'border-white/10 text-mist-400 hover:text-white'
                              : 'border-sky-400/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20'
                          }`}
                        >
                          {isDone ? 'Mark Active' : 'Mark Completed'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
