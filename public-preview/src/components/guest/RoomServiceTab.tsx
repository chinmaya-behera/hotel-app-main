'use client';

import { HousekeepingCatalogueSection } from './HousekeepingCatalogueSection';
import type { GuestTabProps } from '@/components/guest/types';

/**
 * RoomServiceTab renders the Room Service section (Room cleaning, amenities & supplies).
 * (Note: Food & beverage ordering is handled by DiningSection).
 */
export function RoomServiceTab(props: GuestTabProps) {
  return <HousekeepingCatalogueSection {...props} />;
}
