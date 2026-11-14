import type { NextRequest } from 'next/server';
import { STAFF_REFRESH_COOKIE, STAFF_SESSION_COOKIE } from '@/server/auth/config';
import { authError, authResult, setStaffCookies, staffAuthSettings } from '@/server/auth/http';
import { csrfForRequest, isSessionToken } from '@/server/auth/request';
import { revokeStaffSession } from '@/server/auth/sessions';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const settings = staffAuthSettings();
  if (!settings) return authError(503, 'Staff sign-in is unavailable.');
  const csrf = csrfForRequest(request, settings.origin);
  if (!csrf) return authError(403, 'CSRF validation failed.');
  const access = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  const refresh = request.cookies.get(STAFF_REFRESH_COOKIE)?.value;
  try {
    await revokeStaffSession(isSessionToken(access) ? access : undefined, isSessionToken(refresh) ? refresh : undefined, csrf);
  } catch {
    return authError(503, 'Staff sign-out is unavailable.');
  }
  const response = authResult();
  setStaffCookies(response, settings);
  return response;
}
