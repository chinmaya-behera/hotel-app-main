import type { Metadata } from 'next';
import { GuestPortalPreview } from '@/components/shared/GuestPortalPreview';

export const metadata: Metadata = { title: 'Guest Portal · Grand Azure Demo' };

export default async function GuestPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; token?: string }>;
}) {
  const { room = '402', token = '' } = await searchParams;
  return <GuestPortalPreview room={room} token={token} />;
}
