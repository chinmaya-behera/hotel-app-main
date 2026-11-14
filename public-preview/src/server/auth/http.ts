import { NextResponse } from 'next/server';
import {
  ACCESS_SECONDS, FLOW_SECONDS, REFRESH_SECONDS, readStaffAuthConfig, STAFF_AUTH_PATH, STAFF_CSRF_COOKIE,
  STAFF_FLOW_COOKIE, STAFF_REFRESH_COOKIE, STAFF_SESSION_COOKIE, type StaffAuthConfig,
} from './config.ts';
import { isSessionToken } from './request.ts';
import type { LoginFlow } from './keycloak.ts';
import type { StaffCredentials } from './sessions.ts';

const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };

export function authError(status: number, message: string) {
  return NextResponse.json({ success: false, error: { message } }, { status, headers });
}

export function authResult(data?: object) {
  return data ? NextResponse.json({ success: true, data }, { headers }) : new NextResponse(null, { status: 204, headers });
}

export function staffAuthSettings() {
  try {
    return readStaffAuthConfig();
  } catch {
    return null;
  }
}

export function authRedirect(url: URL) {
  return NextResponse.redirect(url, { status: 303, headers });
}

function options(settings: StaffAuthConfig, path: string, maxAge: number, httpOnly = true) {
  return { path, maxAge, httpOnly, sameSite: 'lax' as const, secure: settings.secure };
}

export const flowCookieName = (settings: StaffAuthConfig) => settings.secure ? `__Host-${STAFF_FLOW_COOKIE}` : STAFF_FLOW_COOKIE;

export function setLoginFlow(response: NextResponse, settings: StaffAuthConfig, flow?: LoginFlow) {
  response.cookies.set(flowCookieName(settings), flow ? Buffer.from(JSON.stringify(flow)).toString('base64url') : '',
    options(settings, '/', flow ? FLOW_SECONDS : 0));
}

export function readLoginFlow(raw?: string): LoginFlow | null {
  if (!raw || raw.length > 512) return null;
  try {
    const flow: Partial<LoginFlow> | null = JSON.parse(Buffer.from(raw, 'base64url').toString());
    if (isSessionToken(flow?.state) && isSessionToken(flow?.nonce) && isSessionToken(flow?.verifier)) {
      return { state: flow.state, nonce: flow.nonce, verifier: flow.verifier };
    }
  } catch { /* A malformed cookie cannot resume a login. */ }
  return null;
}

export function setStaffCookies(response: NextResponse, settings: StaffAuthConfig, credentials?: StaffCredentials) {
  response.cookies.set(STAFF_SESSION_COOKIE, credentials?.access ?? '', options(settings, '/', credentials ? ACCESS_SECONDS : 0));
  response.cookies.set(STAFF_REFRESH_COOKIE, credentials?.refresh ?? '', options(settings, STAFF_AUTH_PATH, credentials ? REFRESH_SECONDS : 0));
  response.cookies.set(STAFF_CSRF_COOKIE, credentials?.csrf ?? '', options(settings, '/', credentials ? REFRESH_SECONDS : 0, false));
}
