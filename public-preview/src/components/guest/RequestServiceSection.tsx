'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  ConciergeBell,
  Flame,
  MessageSquare,
  MoonStar,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookServiceSubtab } from '@/components/guest/BookServiceSubtab';
import { RemindersSubtab } from '@/components/guest/RemindersSubtab';
import { DndSubtab } from '@/components/guest/DndSubtab';
import { ToFrontDeskSubtab } from '@/components/guest/ToFrontDeskSubtab';
import type { GuestServicesSubtab, GuestTabProps } from '@/components/guest/types';

const SUBTABS: { id: GuestServicesSubtab; label: string; icon: LucideIcon }[] = [
  { id: 'book', label: 'Book a Service', icon: Sparkles },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'dnd', label: 'DND', icon: MoonStar },
  { id: 'front_desk', label: 'To Front Desk', icon: MessageSquare },
];

export function RequestServiceSection(props: GuestTabProps) {
  const [activeSubtab, setActiveSubtab] = useState<GuestServicesSubtab>(
    (props.initialSubtab as GuestServicesSubtab) || 'book',
  );

  useEffect(() => {
    if (props.initialSubtab && ['book', 'reminders', 'dnd', 'front_desk'].includes(props.initialSubtab)) {
      setActiveSubtab(props.initialSubtab as GuestServicesSubtab);
    }
  }, [props.initialSubtab]);

  return (
    <div className="space-y-4">
      {/* Subtab Navigation Pills */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl p-1 bg-white/[0.04] border border-white/[0.08] shadow-inner">
        {SUBTABS.map((sub) => {
          const Icon = sub.icon;
          const active = activeSubtab === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubtab(sub.id)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all',
                active
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-ink-950 font-bold shadow-md scale-[1.02]'
                  : 'text-mist-300 hover:text-white hover:bg-white/[0.05]',
              )}
            >
              <Icon className={cn('h-4 w-4 mb-0.5', active ? 'text-ink-950' : 'text-amber-400')} />
              <span className="text-[11px] leading-tight truncate w-full">{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab View */}
      {activeSubtab === 'book' && <BookServiceSubtab {...props} />}
      {activeSubtab === 'reminders' && <RemindersSubtab {...props} />}
      {activeSubtab === 'dnd' && <DndSubtab {...props} />}
      {activeSubtab === 'front_desk' && <ToFrontDeskSubtab {...props} />}
    </div>
  );
}
