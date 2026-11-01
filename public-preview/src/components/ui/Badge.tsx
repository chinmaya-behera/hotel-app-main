import type { ReactNode } from 'react';
import { Circle, CircleCheck, CircleDot, OctagonAlert, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tone } from '@/types/demo';

export const TONE_ICONS: Record<Tone, LucideIcon> = {
  neutral: Circle,
  info: CircleDot,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonAlert,
  accent: Sparkles,
};

interface BadgeProps {
  tone?: Tone;
  icon?: boolean;
  className?: string;
  children: ReactNode;
}

/** Status chip: always pairs text with an icon so meaning never relies on colour alone. */
export function Badge({ tone = 'neutral', icon = true, className, children }: BadgeProps) {
  const Icon = TONE_ICONS[tone];
  return (
    <span className={cn('chip', `chip-${tone}`, className)}>
      {icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}
