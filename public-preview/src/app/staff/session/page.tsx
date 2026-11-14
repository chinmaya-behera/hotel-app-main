import { readStaffAuthConfig, STAFF_AUTH_PATH } from '@/server/auth/config';
import { StaffSessionPanel } from './StaffSessionPanel';

export const dynamic = 'force-dynamic';

export default function StaffSessionPage() {
  let enabled = false;
  try {
    enabled = Boolean(readStaffAuthConfig());
  } catch {
    // Sign-in remains unavailable until the provider configuration is valid.
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="mb-4 text-2xl font-semibold">Staff sign-in</h1>
      {enabled ? <StaffSessionPanel authPath={STAFF_AUTH_PATH} /> : <p>Staff sign-in is unavailable.</p>}
    </main>
  );
}
