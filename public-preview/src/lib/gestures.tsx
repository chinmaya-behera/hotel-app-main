'use client';

/**
 * Gesture + motion toolkit (FRONTEND ONLY, zero dependencies).
 *
 * - SwipeRow: drag a card left/right to trigger an action, with rubber-band resistance, an
 *   armed threshold, haptic tick (where supported) and a springy release.
 * - HoldButton: press-and-hold to confirm a consequential action; keyboard / screen-reader
 *   activation confirms immediately so nothing is gesture-only.
 * - useCountUp / CountUp: eased number transitions for KPIs.
 * - spotlight: pointer-follow glow for cards.
 *
 * Every gesture has a plain button equivalent next to it; gestures are an accelerator.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function buzz(ms: number) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* --------------------------------------------------------------------- */
/* Count-up                                                              */
/* --------------------------------------------------------------------- */

export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (prefersReducedMotion() || from === target) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      fromRef.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function CountUp({ value }: { value: number }) {
  const v = useCountUp(value);
  return <>{v}</>;
}

/* --------------------------------------------------------------------- */
/* Pointer-follow spotlight                                              */
/* --------------------------------------------------------------------- */

export const spotlight = {
  onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  },
};

/* --------------------------------------------------------------------- */
/* SwipeRow                                                              */
/* --------------------------------------------------------------------- */

export interface SwipeSide {
  label: string;
  icon: LucideIcon;
  run: () => void;
}

interface SwipeRowProps {
  /** swipe right (reveals on the left edge) */
  right?: SwipeSide;
  /** swipe left (reveals on the right edge) */
  left?: SwipeSide;
  children: ReactNode;
  className?: string;
}

const THRESHOLD = 96;
const MAX_PULL = 150;

export function SwipeRow({ right, left, children, className }: SwipeRowProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const axis = useRef<'h' | 'v' | null>(null);
  const armed = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!right && !left) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, label, summary')) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    axis.current = null;
    armed.current = false;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!axis.current) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      axis.current = Math.abs(mx) > Math.abs(my) ? 'h' : 'v';
      if (axis.current === 'h') {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (axis.current !== 'h') return;
    let next = mx;
    // rubber band when that direction has no action
    if ((next > 0 && !right) || (next < 0 && !left)) next *= 0.18;
    next = Math.max(-MAX_PULL, Math.min(MAX_PULL, next));
    const isArmed = (next >= THRESHOLD && Boolean(right)) || (next <= -THRESHOLD && Boolean(left));
    if (isArmed && !armed.current) buzz(10);
    armed.current = isArmed;
    setDx(next);
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    start.current = null;
    const horizontal = axis.current === 'h';
    axis.current = null;
    const final = dx;
    setDragging(false);
    setDx(0);
    if (!horizontal) return;
    if (final >= THRESHOLD && right) right.run();
    else if (final <= -THRESHOLD && left) left.run();
  };

  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);
  const RightIcon = right?.icon;
  const LeftIcon = left?.icon;

  return (
    <div className={cn('swipe-wrap', className)}>
      {right && RightIcon && (
        <div className="swipe-bg swipe-bg-right" aria-hidden data-armed={dx >= THRESHOLD} style={{ opacity: dx > 0 ? 0.35 + progress * 0.65 : 0 }}>
          <RightIcon className="swipe-ico h-5 w-5" />
          <span>{right.label}</span>
        </div>
      )}
      {left && LeftIcon && (
        <div className="swipe-bg swipe-bg-left" aria-hidden data-armed={dx <= -THRESHOLD} style={{ opacity: dx < 0 ? 0.35 + progress * 0.65 : 0 }}>
          <span>{left.label}</span>
          <LeftIcon className="swipe-ico h-5 w-5" />
        </div>
      )}
      <div
        className="swipe-surface"
        data-dragging={dragging}
        data-swipeable={Boolean(right || left)}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* HoldButton                                                            */
/* --------------------------------------------------------------------- */

interface HoldButtonProps {
  onConfirm: () => void;
  holdMs?: number;
  variant?: 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  iconLeft?: LucideIcon;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function HoldButton({ onConfirm, holdMs = 900, variant = 'ghost', size = 'sm', iconLeft: Icon, disabled, className, children }: HoldButtonProps) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const t0 = useRef(0);
  const holding = useRef(false);
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const stop = useCallback(() => {
    holding.current = false;
    cancelAnimationFrame(raf.current);
    setP(0);
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (!holding.current) return;
      const v = Math.min(1, (now - t0.current) / holdMs);
      setP(v);
      if (v >= 1) {
        holding.current = false;
        setP(0);
        buzz(18);
        confirmRef.current();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    },
    [holdMs],
  );

  const begin = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled || holding.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    holding.current = true;
    t0.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      type="button"
      disabled={disabled}
      title="Press and hold to confirm. Keyboard and screen readers: press Enter."
      className={cn('btn', `btn-${variant}`, `btn-${size}`, 'hold-btn', p > 0 && 'is-holding', className)}
      style={{ '--p': p } as CSSProperties}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      // detail === 0 means keyboard or assistive-tech activation: confirm straight away
      onClick={(e) => {
        if (e.detail === 0 && !disabled) confirmRef.current();
      }}
    >
      {Icon && <Icon className="relative h-4 w-4 shrink-0" aria-hidden />}
      <span className="relative">{children}</span>
      <span className="relative rounded border border-white/25 px-1 text-[9px] font-bold uppercase tracking-wider opacity-70">hold</span>
    </button>
  );
}
