import type { NextRequest, NextResponse } from 'next/server';
import { authError, authRedirect, flowCookieName, readLoginFlow, setLoginFlow, setStaffCookies, staffAuthSettings } from '@/server/auth/http';
import { finishKeycloakLogin } from '@/server/auth/keycloak';
import { createStaffSession, findStaff } from '@/server/auth/sessions';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const settings = staffAuthSettings();
  if (!settings) return authError(503, 'Staff sign-in is unavailable.');
  if (request.nextUrl.origin !== settings.origin) return authError(400, 'Use the configured staff sign-in address.');

  const flow = readLoginFlow(request.cookies.get(flowCookieName(settings))?.value);
  let response: NextResponse = authError(401, 'Staff sign-in could not be verified. Start sign-in again.');
  if (flow) {
    const subject = await finishKeycloakLogin(settings, request.nextUrl.search, flow).catch(() => null);
    if (subject) {
      try {
        const staff = await findStaff(settings, subject);
        if (staff) {
          const credentials = await createStaffSession(staff.membershipId);
          response = authRedirect(new URL('/staff/session', settings.origin));
          setStaffCookies(response, settings, credentials);
        } else {
          response = authError(403, 'This account has no active staff membership at this property.');
        }
      } catch {
        response = authError(503, 'Staff sign-in is unavailable.');
      }
    }
  }
  setLoginFlow(response, settings);
  return response;
}
