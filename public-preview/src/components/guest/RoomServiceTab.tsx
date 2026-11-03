'use client';

import { DiningSection } from './DiningSection';
import type { GuestTabProps } from '@/components/guest/types';

/**
 * Backward-compatible wrapper for DiningSection
 * All guest-facing instances have been renamed to Dining.
 */
export function RoomServiceTab(props: GuestTabProps) {
  return <DiningSection {...props} />;
}
