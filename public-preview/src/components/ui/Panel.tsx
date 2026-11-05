import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title?: string;
  hint?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({ title, hint, icon: Icon, action, className, bodyClassName, children }: PanelProps) {
  return (
    <section className={cn('panel', className)}>
      {(title || action) && (
        <header className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3 border-b border-white/[0.06] px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="accent-soft grid h-9 w-9 place-items-center rounded-xl shrink-0">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            )}
            <div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              {hint && <p className="mt-0.5 text-xs text-mist-400">{hint}</p>}
            </div>
          </div>
          {action && <div className="w-full sm:w-auto shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('p-3.5 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
