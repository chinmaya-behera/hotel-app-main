import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Kpi } from '@/types/demo';

interface StatCardProps {
  kpi: Kpi;
  /** overrides kpi.value (used for live, store-derived numbers) */
  value?: string;
  compact?: boolean;
}

export function StatCard({ kpi, value, compact = false }: StatCardProps) {
  const Icon = kpi.icon;
  const TrendIcon = kpi.trend === 'down' ? TrendingDown : TrendingUp;

  return (
    <div className={cn('rounded-2xl border border-white/[0.07] bg-white/[0.03]', compact ? 'p-3.5' : 'p-4')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-mist-400">{kpi.label}</p>
        <span className="accent-soft grid h-7 w-7 place-items-center rounded-lg">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <p className={cn('mt-2 font-display tabular-nums text-white', compact ? 'text-2xl' : 'text-3xl')}>
        {value ?? kpi.value}
      </p>
      {kpi.delta && (
        <p
          className={cn(
            'mt-1 inline-flex items-center gap-1 text-xs font-medium',
            kpi.trend ? (kpi.good ? 'text-emerald-300' : 'text-rose-300') : 'text-mist-400',
          )}
        >
          {kpi.trend && <TrendIcon className="h-3 w-3" aria-hidden />}
          {kpi.delta}
        </p>
      )}
    </div>
  );
}
