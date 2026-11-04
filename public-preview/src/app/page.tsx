import type { Metadata } from 'next';
import { HotelPreview } from '@/components/shared/HotelPreview';

export const metadata: Metadata = {
  title: 'The Grand ADP · Luxury Resort & Residences',
  description: 'Experience unparalleled coastal luxury, panoramic ocean views, curated dining, and world-class spa retreats at The Grand ADP.',
};

export default function RootPage() {
  return <HotelPreview />;
}
