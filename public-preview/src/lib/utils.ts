import type { CSSProperties } from 'react';
import type { Tone } from '@/types/demo';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Sets the per-role accent variables consumed by the CSS component classes. */
export function accentVars(colors: { accent: string; accent2: string }): CSSProperties {
  return { '--a': colors.accent, '--b': colors.accent2 } as CSSProperties;
}

const STATUS_TONE: Record<string, Tone> = {
  Assigned: 'info',
  Accepted: 'info',
  'In progress': 'info',
  'On the way': 'info',
  Acknowledged: 'info',
  Received: 'info',
  Preparing: 'info',
  Ready: 'info',
  Delivered: 'success',
  'On scene': 'info',
  Dispatched: 'info',
  Expected: 'info',
  'Backup requested': 'warning',
  'Awaiting inspection': 'warning',
  Escalated: 'warning',
  Departing: 'warning',
  Open: 'warning',
  Unassigned: 'warning',
  'Pending approval': 'warning',
  'Awaiting reconciliation': 'warning',
  'Needs approval': 'warning',
  Pending: 'warning',
  New: 'danger',
  Blocked: 'danger',
  Reopened: 'danger',
  Declined: 'danger',
  Rejected: 'danger',
  'In house': 'success',
  Approved: 'success',
  Completed: 'success',
  Closed: 'success',
  Resolved: 'success',
  Executed: 'success',
  Reconciled: 'success',
  Applied: 'success',
  'Checked out': 'success',
  'Room moved': 'success',
  'With GM': 'accent',
  Linked: 'neutral',
};

export function statusTone(status: string): Tone {
  return STATUS_TONE[status] ?? 'neutral';
}

/** Consistent Indian Rupee (INR) formatting with Indian-style digit grouping (e.g., ₹1,500, ₹2,499, ₹12,000). */
export function money(amount: number): string {
  const hasDecimals = amount % 1 !== 0;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
