'use client';

import { useState } from 'react';
import { ChevronDown, ClipboardList, X } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, statusTone } from '@/lib/utils';
import {
  DeliveryTracker,
  GuestConfirm,
  GuestEmptyState,
  GuestPill,
  GuestSectionHeader,
  StarRating,
  StatusTimeline,
} from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { RoleId, WorkItem } from '@/types/demo';

const DONE_STATUSES = ['Completed', 'Delivered', 'Cancelled', 'Closed'];
const CANCELLABLE_STATUSES = ['Unassigned', 'Acknowledged', 'Received', 'Preparing', 'Pending approval', 'Open'];

const CATEGORY_LABEL: Record<string, string> = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  spa: 'Spa & Wellness',
  concierge: 'Concierge',
  room_service: 'Room Service',
  folio: 'Folio',
  lost_found: 'Lost & Found',
};

export function RequestsTab({ room }: GuestTabProps) {
  const { state, cancelGuestItem, submitGuestFeedback } = useDemo();
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ roleId: RoleId; item: WorkItem } | null>(null);

  const seenKeys = new Set<string>();
  const entries: { roleId: RoleId; item: WorkItem }[] = [];
  const rolePriority: RoleId[] = [
    'task_fulfiller',
    'department_dispatcher',
    'front_desk_coordinator',
    'department_supervisor',
    'department_manager',
    'financial_operator',
    'security_responder',
    'executive_viewer',
    'platform_admin',
  ];
  rolePriority.forEach((roleId) => {
    state.items[roleId]?.forEach((item) => {
      if (item.guest && item.room === room) {
        const key = item.ref ?? `${item.room}-${item.title}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          entries.push({ roleId, item });
        }
      }
    });
  });

  const active = entries.filter((e) => !DONE_STATUSES.includes(e.item.status));
  const done = entries.filter((e) => DONE_STATUSES.includes(e.item.status));

  function Row({ roleId, item }: { roleId: RoleId; item: WorkItem }) {
    const open = openId === item.id;
    const canCancel = CANCELLABLE_STATUSES.includes(item.status);
    const canRate = ['Completed', 'Delivered'].includes(item.status) && !item.feedback;

    return (
      <li className="guest-card px-3.5 py-3.5">
        <button type="button" onClick={() => setOpenId(open ? null : item.id)} className="flex w-full items-center justify-between gap-3 text-left">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="guest-muted mt-0.5 text-[11px]">
              {item.ref ?? (item.category && CATEGORY_LABEL[item.category])} {item.createdAt && `· ${item.createdAt}`}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <GuestPill tone={statusTone(item.status)}>{item.status}</GuestPill>
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </span>
        </button>

        {item.category === 'room_service' && item.status !== 'Cancelled' && (
          <div className="mt-3">
            <DeliveryTracker status={item.status} />
          </div>
        )}

        {open && (
          <div className="guest-border mt-3 space-y-4 border-t pt-3">
            {item.description && <p className="guest-muted text-xs">{item.description}</p>}
            {item.orderLines && item.orderLines.length > 0 && (
              <ul className="guest-muted space-y-0.5 text-xs">
                {item.orderLines.map((l) => (
                  <li key={l.itemId} className="flex justify-between items-center">
                    <span>
                      {l.qty}× {l.name}
                    </span>
                    <span>₹{l.price * l.qty}</span>
                  </li>
                ))}
              </ul>
            )}
            {item.photoUrl && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                <p className="text-[11px] font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                  ✓ Service Completion Verified
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.photoUrl}
                  alt="Service completion evidence"
                  className="w-full max-h-48 object-cover rounded-lg border border-white/10"
                />
              </div>
            )}
            {item.history && item.history.length > 0 && <StatusTimeline history={item.history} />}

            {canCancel && (
              <button
                type="button"
                onClick={() => setCancelTarget({ roleId, item })}
                className="guest-chip-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Cancel request
              </button>
            )}

            {canRate && <FeedbackForm onSubmit={(rating, comment) => submitGuestFeedback(roleId, item.id, rating, comment)} />}
            {item.feedback && (
              <div className="guest-surface-2 rounded-xl px-3 py-2.5">
                <StarRating value={item.feedback.rating} size="sm" />
                {item.feedback.comment && <p className="guest-muted mt-1 text-xs">“{item.feedback.comment}”</p>}
              </div>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <GuestSectionHeader title="Requests & history" hint="Reference numbers, live status and your feedback" />

      {entries.length === 0 ? (
        <GuestEmptyState icon={ClipboardList} title="No requests yet" hint="Anything you request from this portal will appear here." />
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <p className="guest-muted mb-2 text-xs font-semibold uppercase tracking-wide">Active ({active.length})</p>
              <ul className="space-y-2">
                {active.map(({ roleId, item }) => (
                  <Row key={item.id} roleId={roleId} item={item} />
                ))}
              </ul>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="guest-muted mb-2 text-xs font-semibold uppercase tracking-wide">Completed ({done.length})</p>
              <ul className="space-y-2">
                {done.map(({ roleId, item }) => (
                  <Row key={item.id} roleId={roleId} item={item} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {cancelTarget && (
        <GuestConfirm
          title="Cancel this request?"
          body={`"${cancelTarget.item.title}" will be marked as cancelled and removed from staff queues.`}
          confirmLabel="Cancel request"
          tone="danger"
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => {
            cancelGuestItem(cancelTarget.roleId, cancelTarget.item.id);
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}

function FeedbackForm({ onSubmit }: { onSubmit: (rating: number, comment?: string) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) return <p className="text-xs font-medium text-emerald-500">Thanks for your feedback!</p>;

  return (
    <div className="guest-surface-2 space-y-2.5 rounded-xl px-3.5 py-3">
      <p className="text-xs font-semibold">How did we do?</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional comment"
        className="guest-field w-full px-3 py-2 text-xs"
      />
      <button
        type="button"
        disabled={rating === 0}
        onClick={() => {
          onSubmit(rating, comment || undefined);
          setSent(true);
        }}
        className="btn-accent rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
      >
        Submit feedback
      </button>
    </div>
  );
}
