import type { Metadata } from 'next';
import { HotelPreview } from '@/components/shared/HotelPreview';

export const metadata: Metadata = { title: 'The Grand ADP · Public Hotel Website & Booking' };

export default function HotelPage() {
  return <HotelPreview />;
}
