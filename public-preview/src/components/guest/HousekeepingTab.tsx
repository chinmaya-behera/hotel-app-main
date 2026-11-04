'use client';

import { HousekeepingCatalogueSection } from './HousekeepingCatalogueSection';
import type { GuestTabProps } from '@/components/guest/types';

export function HousekeepingTab(props: GuestTabProps) {
  return <HousekeepingCatalogueSection {...props} />;
}
