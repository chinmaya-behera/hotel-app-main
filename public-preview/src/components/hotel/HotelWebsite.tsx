'use client';

import { useState } from 'react';
import { HotelNavbar } from '@/components/hotel/HotelNavbar';
import { HotelHero } from '@/components/hotel/HotelHero';
import { RoomCatalog } from '@/components/hotel/RoomCatalog';
import { RoomExplorer } from '@/components/hotel/RoomExplorer';
import { RoomDetailModal } from '@/components/hotel/RoomDetailModal';
import { RoomCompareModal } from '@/components/hotel/RoomCompareModal';
import { BookingWizardModal } from '@/components/hotel/BookingWizardModal';
import { ManageBookingModal } from '@/components/hotel/ManageBookingModal';
import { DiningSection } from '@/components/hotel/DiningSection';
import { SpaSection } from '@/components/hotel/SpaSection';
import { GallerySection } from '@/components/hotel/GallerySection';
import { LocationContactSection } from '@/components/hotel/LocationContactSection';
import { HotelFooter } from '@/components/hotel/HotelFooter';
import { defaultQuery, type StayQuery } from '@/lib/bookings';
import { quickLinkById } from '@/lib/roles';
import { accentVars } from '@/lib/utils';

export function HotelWebsite() {
  const link = quickLinkById.site;

  // Active query state
  const [query, setQuery] = useState<StayQuery>(defaultQuery);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [prefilledTypeId, setPrefilledTypeId] = useState<string | undefined>(undefined);
  const [prefilledRoomNo, setPrefilledRoomNo] = useState<string | undefined>(undefined);

  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageInitialRef, setManageInitialRef] = useState<string | undefined>(undefined);

  const [detailTypeId, setDetailTypeId] = useState<string | null>(null);

  // Comparison state
  const [comparedIds, setComparedIds] = useState<string[]>(['deluxe-twin', 'deluxe-king']);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Handlers
  const handleOpenBooking = (typeId?: string, roomNo?: string) => {
    setPrefilledTypeId(typeId);
    setPrefilledRoomNo(roomNo);
    setBookingModalOpen(true);
  };

  const handleOpenManage = (ref?: string) => {
    setManageInitialRef(ref);
    setManageModalOpen(true);
  };

  const handleToggleCompare = (id: string) => {
    setComparedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const handleScrollToExplorer = () => {
    const el = document.getElementById('explorer');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={accentVars(link)} className="min-h-screen text-mist-100 selection:bg-amber-400/30 selection:text-white">
      {/* Navbar */}
      <HotelNavbar
        onOpenBooking={() => handleOpenBooking()}
        onOpenManage={() => handleOpenManage()}
      />

      {/* Main Content */}
      <main>
        {/* Hero & Search Availability */}
        <HotelHero
          initialQuery={query}
          onSearch={(newQ) => {
            setQuery(newQ);
            const el = document.getElementById('rooms');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenExplorer={handleScrollToExplorer}
        />

        {/* Room Discovery & Catalog */}
        <RoomCatalog
          query={query}
          onSelectRoomType={(typeId) => handleOpenBooking(typeId)}
          onViewDetails={(typeId) => setDetailTypeId(typeId)}
          comparedIds={comparedIds}
          onToggleCompare={handleToggleCompare}
          onOpenCompare={() => setCompareModalOpen(true)}
        />

        {/* Floor-by-Floor Interactive Explorer */}
        <RoomExplorer
          query={query}
          onBookRoom={(typeId, roomNo) => handleOpenBooking(typeId, roomNo)}
          onViewDetails={(typeId) => setDetailTypeId(typeId)}
          comparedIds={comparedIds}
          onToggleCompare={handleToggleCompare}
        />

        {/* Dining Showcase */}
        <DiningSection />

        {/* Wellness & Spa */}
        <SpaSection />

        {/* Gallery */}
        <GallerySection />

        {/* Location & Contact Concierge */}
        <LocationContactSection />
      </main>

      {/* Footer */}
      <HotelFooter
        onOpenManage={() => handleOpenManage()}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* ================= MODALS ================= */}

      {/* Room Detail Modal */}
      {detailTypeId && (
        <RoomDetailModal
          typeId={detailTypeId}
          query={query}
          onClose={() => setDetailTypeId(null)}
          onBook={(tId) => {
            setDetailTypeId(null);
            handleOpenBooking(tId);
          }}
        />
      )}

      {/* Room Compare Modal */}
      {compareModalOpen && (
        <RoomCompareModal
          typeIds={comparedIds}
          query={query}
          onClose={() => setCompareModalOpen(false)}
          onRemove={(id) => handleToggleCompare(id)}
          onBook={(tId) => {
            setCompareModalOpen(false);
            handleOpenBooking(tId);
          }}
        />
      )}

      {/* Booking Engine Modal */}
      {bookingModalOpen && (
        <BookingWizardModal
          initialTypeId={prefilledTypeId}
          initialRoomNo={prefilledRoomNo}
          initialQuery={query}
          onClose={() => setBookingModalOpen(false)}
          onManageBooking={(ref) => {
            setBookingModalOpen(false);
            handleOpenManage(ref);
          }}
        />
      )}

      {/* Manage Booking & Pre-Arrival Modal */}
      {manageModalOpen && (
        <ManageBookingModal
          initialRef={manageInitialRef}
          onClose={() => setManageModalOpen(false)}
        />
      )}
    </div>
  );
}
