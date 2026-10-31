'use client';

import { HotelWebsite } from '@/components/hotel/HotelWebsite';

/**
 * Public Hotel Website view mounted at /hotel.
 * Connects the responsive hotel website, interactive floor explorer,
 * end-to-end booking engine, and pre-arrival workflows to the shared store.
 */
export function HotelPreview() {
  return <HotelWebsite />;
}
