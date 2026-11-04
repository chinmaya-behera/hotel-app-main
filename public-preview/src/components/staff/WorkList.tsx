'use client';

import { useState } from 'react';
import { CircleCheck, Inbox, Lock, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn, statusTone } from '@/lib/utils';
import type { RoleId, Transition, WorkItem } from '@/types/demo';

const DELEGATED_LIMIT = 200;

type Filter = 'open' | 'done' | 'all';

interface WorkListProps {
  roleId: RoleId;
  title: string;
  hint: string;
  icon: LucideIcon;
  items: WorkItem[];
  transitions: Record<string, Transition[]>;
}

function blockNote(t: Transition, item: WorkItem): string | null {
  if (t.blockedIf === 'self' && item.selfRequested) {
    return 'Separation of duties (REQ-08): you cannot do this on your own request.';
  }
  if (t.blockedIf === 'overLimit' && (item.amount ?? 0) > DELEGATED_LIMIT) {
    return `Above the $${DELEGATED_LIMIT} delegated limit. Escalate this one to the GM.`;
  }
  return null;
}

export function WorkList({ roleId, title, hint, icon, items, transitions }: WorkListProps) {
  const { advance } = useDemo();
  const [filter, setFilter] = useState<Filter>('open');
  const [asking, setAsking] = useState<{ itemId: string; t: Transition } | null>(null);
  const [reason, setReason] = useState('');

  const isOpen = (i: WorkItem) => (transitions[i.status]?.length ?? 0) > 0;
  const openCount = items.filter(isOpen).length;
  const counts: Record<Filter, number> = { open: openCount, done: items.length - openCount, all: items.length };
  const shown = items.filter((i) => (filter === 'all' ? true : filter === 'open' ? isOpen(i) : !isOpen(i)));

  function run(item: WorkItem, t: Transition) {
    if (t.reasons?.length) {
      setAsking({ itemId: item.id, t });
      setReason(t.reasons[0]);
      return;
    }
    advance(roleId, item.id, t);
  }

  function confirm() {
    if (!asking || !reason) return;
    advance(roleId, asking.itemId, asking.t, reason);
    setAsking(null);
  }

  return (
    <Panel
      title={title}
      hint={hint}
      icon={icon}
      action={
        <div role="group" aria-label="Filter items" className="flex rounded-xl border border-white/10 bg-black/20 p-0.5">
          {(['open', 'done', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition',
                filter === f ? 'accent-soft' : 'text-mist-400 hover:text-white',
              )}
            >
              {f} <span className="tabular-nums opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>
      }
    >
      {shown.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <Inbox className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="text-sm text-mist-300">Nothing here. Use Reset demo in the top bar to start over.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((item) => {
            const actions = transitions[item.status] ?? [];
            const notes = actions.map((t) => blockNote(t, item)).filter((n): n is string => n !== null);
            const showAsk = asking?.itemId === item.id;

            return (
              <li key={item.id} className="work-row" data-priority={item.priority ?? 'normal'}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-mist-400">{item.meta}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      {item.chip && <Badge tone={item.tone ?? 'neutral'}>{item.chip}</Badge>}
                      {item.amount !== undefined && (
                        <Badge icon={false}>${item.amount.toLocaleString('en-US', { minimumFractionDigits: item.amount % 1 ? 2 : 0 })}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {actions.length === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-mist-400">
                        <CircleCheck className="h-4 w-4 text-emerald-300" aria-hidden />
                        No further action
                      </span>
                    ) : (
                      actions.map((t) => {
                        const blocked = blockNote(t, item) !== null;
                        const variant = blocked
                          ? 'ghost'
                          : t.variant === 'danger'
                            ? 'danger'
                            : t.variant === 'secondary'
                              ? 'ghost'
                              : 'accent';
                        return (
                          <Button
                            key={t.label}
                            size="sm"
                            variant={variant}
                            disabled={blocked}
                            iconLeft={blocked ? Lock : undefined}
                            onClick={() => run(item, t)}
                          >
                            {t.label}
                          </Button>
                        );
                      })
                    )}
                  </div>
                </div>

                {notes.map((n) => (
                  <p key={n} className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {n}
                  </p>
                ))}

                {showAsk && asking && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
                    <label htmlFor={`reason-${item.id}`} className="text-xs font-medium text-mist-300">
                      Reason required
                    </label>
                    <select
                      id={`reason-${item.id}`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="field"
                    >
                      {asking.t.reasons?.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="accent" onClick={confirm}>
                      Confirm: {asking.t.label}
                    </Button>
                    <Button size="sm" variant="subtle" onClick={() => setAsking(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
