'use client';

import { useState, useEffect } from 'react';
import { User, CalendarCheck, Receipt } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestProfileSubtab } from './GuestProfileSubtab';
import { MyBookingsSubtab } from './MyBookingsSubtab';
import { MyFolioSubtab } from './MyFolioSubtab';
import type { GuestTabProps, GuestProfileSubtab as ProfileSubtabType } from '@/components/guest/types';

export function ProfileSection({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const { state } = useDemo();
  const guestPalette = state.guestPalette ?? 'emerald';

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

  const isBurgundy = guestPalette === 'burgundy';

  const containerClass = isBurgundy
    ? 'bg-[#F2E5D0] border-[#E0CBA9]'
    : 'bg-[#EDE8DA] border-[#DDD9CC]';

  const activeBtnClass = isBurgundy
    ? 'bg-[#74172F] text-[#FFF8F0] shadow-sm'
    : 'bg-[#175B49] text-[#F8F5EC] shadow-sm';

  const inactiveBtnClass = isBurgundy
    ? 'text-[#786B60] hover:text-[#332D2A] hover:bg-[#74172F]/10'
    : 'text-[#68736A] hover:text-[#173C32] hover:bg-[#175B49]/10';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Top 3-segment Navigation Pills */}
      <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl border shadow-sm ${containerClass}`}>
        <button
          type="button"
          onClick={() => setActiveSubtab('profile_info')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubtab === 'profile_info' ? activeBtnClass : inactiveBtnClass
          }`}
        >
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Guest Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubtab('bookings')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubtab === 'bookings' ? activeBtnClass : inactiveBtnClass
          }`}
        >
          <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">My Bookings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubtab('folio')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubtab === 'folio' ? activeBtnClass : inactiveBtnClass
          }`}
        >
          <Receipt className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">My Folio & Invoice</span>
        </button>
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
