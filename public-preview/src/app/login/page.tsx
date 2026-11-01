import type { Metadata } from 'next';
import { HomeView } from '@/components/home/HomeView';

export const metadata: Metadata = {
  title: 'Portal Login · The Grand ADP',
  description: 'Portal login for The Grand ADP.',
};

export default function LoginPage() {
  return <HomeView />;
}
