import type { Metadata } from 'next';
import { PortalLoginView } from '@/components/login/PortalLoginView';

export const metadata: Metadata = {
  title: 'The Grand ADP — Portal Login',
  description: 'Luxury resort and operational staff portal login for The Grand ADP.',
};

export default function LoginPage() {
  return <PortalLoginView />;
}
