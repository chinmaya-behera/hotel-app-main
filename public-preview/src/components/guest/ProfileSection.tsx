'use client';

import { useState, useEffect } from 'react';
import { User, CalendarCheck, Receipt } from 'lucide-react';
import { GuestProfileSubtab } from './GuestProfileSubtab';
import { MyBookingsSubtab } from './MyBookingsSubtab';
import { MyFolioSubtab } from './MyFolioSubtab';
import type { GuestTabProps, GuestProfileSubtab as ProfileSubtabType } from '@/components/guest/types';

export function ProfileSection({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const [activeSubtab, setActiveSubtab] = useState<ProfileSubtabType>(
    initialSubtab === 'bookings'
      ? 'bookings'
      : initialSubtab === 'folio'
      ? 'folio'
      : 'profile_info',
  );

  useEffect(() => {
    if (initialSubtab === 'bookings' || initialSubtab === 'folio' || initialSubtab === 'profile_info') {
      setActiveSubtab(initialSubtab);
    }
  }, [initialSubtab]);

  const SUBTABS: Array<{ id: ProfileSubtabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'profile_info', label: 'Guest Profile', icon: User },
    { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
    { id: 'folio', label: 'My Folio & Invoice', icon: Receipt },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Top 3-segment Navigation Pills */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5">
        {SUBTABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubtab(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-400 text-ink-950 shadow-md font-bold'
                  : 'text-mist-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Subsection */}
      {activeSubtab === 'profile_info' && (
        <GuestProfileSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
      )}
      {activeSubtab === 'bookings' && (
        <MyBookingsSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
      )}
      {activeSubtab === 'folio' && (
        <MyFolioSubtab room={room} guestName={guestName} onNavigate={onNavigate} />
      )}
    </div>
  );
}

