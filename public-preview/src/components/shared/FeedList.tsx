'use client';

import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

const DEPT_CONFIG: Record<string, { pill: string; dot: string; ring: string }> = {
  'Front Desk': {
    pill: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dot: 'bg-sky-400',
    ring: 'ring-sky-400/25',
  },
  Housekeeping: {
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400/25',
  },
  Dispatcher: {
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/25',
  },
  Finance: {
    pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
    ring: 'ring-purple-400/25',
  },
  Security: {
    pill: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-400',
    ring: 'ring-teal-400/25',
  },
};

const DEFAULT_CONFIG = {
  pill: 'bg-white/10 text-mist-200 border-white/15',
  dot: 'bg-mist-400',
  ring: 'ring-white/10',
};

function formatFeedText(text: string) {
  // Matches ticket IDs (FD-2042, SEC-001, BK-7740), room numbers (Room 518, Suite 402, Folio 402), and Overdue
  const regex = /(FD-\d+|SEC-\d+|BK-\d+|Room\s+\d+|Suite\s+\d+|Folio\s+\d+|Overdue)/gi;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (/^(FD-\d+|SEC-\d+|BK-\d+)$/i.test(part)) {
      return (
        <strong key={index} className="font-mono font-bold text-amber-300">
          {part}
        </strong>
      );
    }
    if (/^(Room\s+\d+|Suite\s+\d+|Folio\s+\d+)$/i.test(part)) {
      return (
        <strong key={index} className="font-bold text-white">
          {part}
        </strong>
      );
    }
    if (/^Overdue$/i.test(part)) {
      return (
        <span key={index} className="font-bold text-rose-400">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function FeedList({ limit = 25 }: { limit?: number }) {
  const { state } = useDemo();
  const rows = state.feed.slice(0, limit);

  return (
    <div className="relative pl-4 pr-0.5 py-1">
      {/* Subtle Vertical Timeline Track Line */}
      <div
        className="absolute left-[7px] top-3 bottom-3 w-[1.5px] bg-white/[0.08]"
        aria-hidden
      />

      <ul className="space-y-3">
        {rows.map((entry) => {
          const cfg = DEPT_CONFIG[entry.role] ?? DEFAULT_CONFIG;

          return (
            <li key={entry.id} className="relative flex items-start gap-2.5 group">
              {/* Timeline Status Dot */}
              <span
                className={cn(
                  'relative z-10 mt-3 -ml-[13px] h-2 w-2 shrink-0 rounded-full ring-4 shadow-sm transition-transform duration-200 group-hover:scale-125',
                  cfg.dot,
                  cfg.ring,
                )}
                aria-hidden
              />

              {/* Structured Activity Card */}
              <div className="flex-1 min-w-0 p-2.5 sm:px-3 sm:py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-150 shadow-sm space-y-1.5">
                {/* Top Meta Row: Department Badge Pill on left + Timestamp on far right */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs',
                      cfg.pill,
                    )}
                  >
                    {entry.role}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-mist-400 shrink-0">
                    {entry.at}
                  </span>
                </div>

                {/* Bottom Description Row with bolded ticket IDs, room numbers, and statuses */}
                <p className="text-xs text-mist-200 leading-snug break-words">
                  {formatFeedText(entry.text)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
