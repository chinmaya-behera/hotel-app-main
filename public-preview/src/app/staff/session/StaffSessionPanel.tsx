'use client';

import { useEffect, useState } from 'react';
import { STAFF_CSRF_COOKIE } from '@/server/auth/config';

type Session = { name: string; role: string; department?: string };

function csrfToken() {
  return document.cookie.split('; ').find((cookie) => cookie.startsWith(`${STAFF_CSRF_COOKIE}=`))
    ?.slice(STAFF_CSRF_COOKIE.length + 1);
}

export function StaffSessionPanel({ authPath }: { authPath: string }) {
  const [session, setSession] = useState<Session | null>();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      let response = await fetch(`${authPath}/session`, { cache: 'no-store' });
      const csrf = csrfToken();
      if (response.status === 401 && csrf) {
        const refresh = await fetch(`${authPath}/refresh`, { method: 'POST', headers: { 'X-CSRF-Token': csrf } });
        if (refresh.status >= 500) throw new Error('Refresh unavailable');
        response = await fetch(`${authPath}/session`, { cache: 'no-store' });
      }
      if (response.status === 401) {
        if (active) setSession(null);
        return;
      }
      if (!response.ok) throw new Error('Session unavailable');
      const result: { data: Session } = await response.json();
      if (active) setSession(result.data);
    }

    void loadSession().catch(() => {
      if (active) {
        setSession(null);
        setError('Could not check your session. Reload to try again.');
      }
    });
    return () => { active = false; };
  }, [authPath]);

  async function signOut() {
    const csrf = csrfToken();
    if (!csrf) {
      setError('Your sign-out token is missing. Reload to try again.');
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`${authPath}/logout`, { method: 'POST', headers: { 'X-CSRF-Token': csrf } });
      if (!response.ok) throw new Error('Sign-out failed');
      setSession(null);
      setError('');
    } catch {
      setError('Could not sign out. Try again.');
    } finally {
      setPending(false);
    }
  }

  const action = 'inline-flex rounded-md border border-current px-4 py-2 text-sm font-medium disabled:opacity-50';

  return (
    <div className="space-y-4">
      {error && <p role="alert">{error}</p>}
      {session === undefined && <p role="status">Checking your session…</p>}
      {session === null && <a className={action} href={`${authPath}/login`}>Sign in with Keycloak</a>}
      {session && (
        <>
          <p>Signed in as <strong>{session.name}</strong></p>
          <p className="text-sm capitalize">{session.role.replaceAll('_', ' ')}{session.department && ` · ${session.department}`}</p>
          <button className={action} type="button" onClick={signOut} disabled={pending}>Sign out</button>
        </>
      )}
    </div>
  );
}
