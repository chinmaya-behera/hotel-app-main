'use client';

import { useDemo } from '@/lib/store';

export function FeedList({ limit = 6 }: { limit?: number }) {
  const { state } = useDemo();
  const rows = state.feed.slice(0, limit);

  return (
    <ul className="space-y-2.5">
      {rows.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 w-11 shrink-0 font-medium tabular-nums text-mist-500">{entry.at}</span>
          <div className="min-w-0">
            <span className="chip chip-neutral mr-2">{entry.role}</span>
            <span className="text-mist-200">{entry.text}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
