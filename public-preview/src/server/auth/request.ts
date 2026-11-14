import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { isLoopback, readStaffAuthConfig, STAFF_CSRF_COOKIE, STAFF_SESSION_COOKIE } from './config.ts';
import { verifyStaffBearer } from './keycloak.ts';
import { findStaff, readStaffSession } from './sessions.ts';

export function csrfForRequest(request: NextRequest, origin: string) {
  const sentOrigin = request.headers.get('origin');
  if (sentOrigin && sentOrigin !== origin) return null;
  const cookie = request.cookies.get(STAFF_CSRF_COOKIE)?.value;
  const header = request.headers.get('x-csrf-token');
  if (!cookie || !header || !isSessionToken(cookie) || !isSessionToken(header)) return null;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(header)) ? cookie : null;
}

export function isSessionToken(value: string | undefined): value is string {
  return !!value && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export async function authenticateStaff(request: NextRequest) {
  const settings = readStaffAuthConfig();
  if (!settings) {
    // Local automation has no Keycloak dependency. This path cannot run on a deployment.
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1' &&
        process.env.STAFF_AUTH_LOCAL_TEST_HEADERS === 'true' && isLoopback(request.nextUrl.hostname)) {
      const role = request.headers.get('x-staff-role');
      const staffId = request.headers.get('x-staff-id');
      if (role && staffId) {
        return { staffId, role, name: request.headers.get('x-staff-name') || staffId,
          department: request.headers.get('x-staff-department') || undefined };
      }
    }
    return null;
  }
  const access = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  if (access !== undefined) {
    if (!isSessionToken(access)) return null;
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return readStaffSession(settings, access);
    const csrf = csrfForRequest(request, settings.origin);
    return csrf ? readStaffSession(settings, access, csrf) : null;
  }
  const token = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) return null;
  const subject = await verifyStaffBearer(settings, token);
  return subject ? findStaff(settings, subject) : null;
}
