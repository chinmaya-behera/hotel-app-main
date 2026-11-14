import type { NextRequest } from 'next/server';
import { STAFF_REFRESH_COOKIE } from '@/server/auth/config';
import { authError, authResult, setStaffCookies, staffAuthSettings } from '@/server/auth/http';
import { csrfForRequest, isSessionToken } from '@/server/auth/request';
import { rotateStaffSession } from '@/server/auth/sessions';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const settings = staffAuthSettings();
  if (!settings) return authError(503, 'Staff sign-in is unavailable.');
  const csrf = csrfForRequest(request, settings.origin);
  if (!csrf) return authError(403, 'CSRF validation failed.');
  const refresh = request.cookies.get(STAFF_REFRESH_COOKIE)?.value;
  if (!isSessionToken(refresh)) return authError(401, 'Staff session has expired.');
  try {
    const credentials = await rotateStaffSession(settings, refresh, csrf);
    if (!credentials) return authError(401, 'Staff session has expired.');
    const response = authResult();
    setStaffCookies(response, settings, credentials);
    return response;
  } catch {
    return authError(503, 'Staff session refresh is unavailable.');
  }
}
