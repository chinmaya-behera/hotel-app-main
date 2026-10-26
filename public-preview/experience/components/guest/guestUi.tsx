'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Minus, Plus, Star, Truck, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GuestHistoryEntry, Tone } from '@/types/demo';

/* ------------------------------------------------------------------ */
/* Overlay root: sheets render inside the phone frame, not the page    */
/* ------------------------------------------------------------------ */

function overlayRoot(): HTMLElement {
  return document.getElementById('guest-overlay-root') ?? document.body;
}

/* ------------------------------------------------------------------ */
/* Bottom sheet / modal                                                */
/* ------------------------------------------------------------------ */

export function GuestSheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const node = (
    <div className="guest-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="guest-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="guest-surface sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="guest-chip-btn grid h-8 w-8 place-items-center rounded-full"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="guest-surface sticky bottom-0 border-t px-5 py-4">{footer}</div>}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(node, overlayRoot());
}

/* ------------------------------------------------------------------ */
/* Confirmation dialog (lighter weight than a full sheet)              */
/* ------------------------------------------------------------------ */

export function GuestConfirm({
  title,
  body,
  confirmLabel,
  tone = 'default',
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="guest-overlay" role="alertdialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="guest-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-5">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="guest-muted mt-2 text-sm">{body}</p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button type="button" onClick={onCancel} className="guest-chip-btn rounded-xl px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold text-[#ffffff]',
                tone === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 'btn-accent',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    overlayRoot(),
  );
}

/* ------------------------------------------------------------------ */
/* Quantity stepper                                                    */
/* ------------------------------------------------------------------ */

export function QuantityStepper({ value, onChange, min = 0, max = 9 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="guest-chip-btn inline-flex items-center gap-1 rounded-full px-1 py-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-6 w-6 place-items-center rounded-full disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-6 w-6 place-items-center rounded-full disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Star rating input + display                                         */
/* ------------------------------------------------------------------ */

export function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (n: number) => void; size?: 'sm' | 'md' }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7';
  return (
    <div className="flex items-center gap-1" role={onChange ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-checked={value === n}
          role={onChange ? 'radio' : undefined}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(null)}
          onClick={() => onChange?.(n)}
          className={cn('disabled:cursor-default', onChange && 'cursor-pointer')}
        >
          <Star className={cn(cls, n <= shown ? 'fill-amber-400 text-amber-400' : 'guest-muted fill-transparent')} aria-hidden />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status timeline                                                     */
/* ------------------------------------------------------------------ */

export function StatusTimeline({ history }: { history: GuestHistoryEntry[] }) {
  return (
    <ol className="space-y-0">
      {history.map((h, i) => (
        <li key={`${h.at}-${h.status}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
          {i < history.length - 1 && <span className="guest-border absolute left-[5px] top-3 h-full w-px border-l" aria-hidden />}
          <span
            className={cn(
              'relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2',
              i === history.length - 1 ? 'border-current bg-current' : 'guest-border bg-transparent',
            )}
            style={i === history.length - 1 ? { color: 'rgb(var(--a))' } : undefined}
            aria-hidden
          />
          <div className="min-w-0 pb-0.5">
            <p className="text-sm font-medium">{h.status}</p>
            {h.note && <p className="guest-muted text-xs">{h.note}</p>}
            <p className="guest-muted text-[11px]">{h.at}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery tracking (room-service orders)                             */
/* ------------------------------------------------------------------ */

const DELIVERY_STEPS = ['Received', 'Preparing', 'Ready', 'On the way', 'Delivered'];
const DELIVERY_ETA: Record<string, string> = {
  Received: 'Arrives in ~25 min',
  Preparing: 'Arrives in ~20 min',
  Ready: 'Arrives in ~10 min',
  'On the way': 'Arriving in ~3 min',
  Delivered: 'Delivered',
};

export function DeliveryTracker({ status }: { status: string }) {
  if (status === 'Cancelled') return null;
  const idx = Math.max(0, DELIVERY_STEPS.indexOf(status));
  return (
    <div className="guest-surface-2 rounded-xl px-3 py-3" aria-label={`Delivery status: ${status}`}>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold">
          <Truck className="h-3.5 w-3.5" aria-hidden /> Delivery tracking
        </span>
        <span className="guest-muted">{DELIVERY_ETA[status] ?? status}</span>
      </div>
      <ol className="mt-3 flex items-start">
        {DELIVERY_STEPS.map((step, i) => {
          const done = i < idx || status === 'Delivered';
          const current = i === idx && status !== 'Delivered';
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center gap-1">
              {i < DELIVERY_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-[9px] h-0.5 w-full"
                  style={{ background: i < idx ? 'rgb(var(--a))' : 'var(--gs-border)' }}
                />
              )}
              <span
                className="relative z-10 grid h-[18px] w-[18px] place-items-center rounded-full border-2"
                style={{
                  borderColor: done || current ? 'rgb(var(--a))' : 'var(--gs-border)',
                  background: done ? 'rgb(var(--a))' : 'var(--gs-surface)',
                  color: 'var(--on-a)',
                }}
              >
                {done && <Check className="h-2.5 w-2.5" aria-hidden />}
                {current && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--a))' }} />}
              </span>
              <span className={cn('text-center text-[9px] font-semibold leading-tight', !done && !current && 'guest-muted')}>{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function GuestEmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="guest-border grid place-items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center">
      <span className="guest-surface-2 grid h-10 w-10 place-items-center rounded-full">
        <Icon className="guest-muted h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="guest-muted max-w-[16rem] text-xs">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */

export function GuestSectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgb(var(--a))' }}>
        {title}
      </p>
      {hint && <p className="guest-muted mt-0.5 text-xs">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small status pill (tone-aware, text + no reliance on colour alone)  */
/* ------------------------------------------------------------------ */

const TONE_CLS: Record<Tone, string> = {
  neutral: 'border-black/10 bg-black/5 text-current',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-600',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-600',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-600',
  danger: 'border-rose-400/35 bg-rose-500/10 text-rose-600',
  accent: 'border-current/30 bg-current/10 text-current',
};

export function GuestPill({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', TONE_CLS[tone])}>{children}</span>;
}
