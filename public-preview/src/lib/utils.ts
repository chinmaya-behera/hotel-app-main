import type { CSSProperties } from 'react';
import type { Tone } from '@/types/demo';

const referenceDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit',
});

export function formatReferenceNumber(initial: string, roomNumber: string | number, dateInput: Date | string = new Date()): string {
  const date = typeof dateInput === 'string'
    ? new Date(dateInput.replace(/^(\d{2})[-/](\d{2})[-/](\d{4})$/, '$3-$2-$1'))
    : dateInput;
  const room = String(roomNumber).trim().replace(/^Room\s+(?:No\.?\s*)?/i, '');
  const code = room.match(/^\d+[A-Z]?\b/i)?.[0] || room.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${initial.toUpperCase()}-${code || 'GEN'}-${referenceDate.format(Number.isNaN(+date) ? new Date() : date).replaceAll('/', '')}`;
}

export function uniqueReferenceNumber(base: string, taken: ReadonlySet<string>): string {
  let reference = base;
  for (let suffix = 2; taken.has(reference); suffix++) reference = `${base}-${suffix}`;
  return reference;
}

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
