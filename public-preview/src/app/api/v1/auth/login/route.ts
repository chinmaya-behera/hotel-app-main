import type { NextRequest } from 'next/server';
import { authError, authRedirect, setLoginFlow, staffAuthSettings } from '@/server/auth/http';
import { beginKeycloakLogin } from '@/server/auth/keycloak';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const settings = staffAuthSettings();
    if (!settings) return authError(503, 'Staff sign-in is unavailable.');
    if (request.nextUrl.origin !== settings.origin) return authError(400, 'Use the configured staff sign-in address.');
    const { url, flow } = await beginKeycloakLogin(settings);
    const response = authRedirect(url);
    setLoginFlow(response, settings, flow);
    return response;
  } catch {
    return authError(503, 'Staff sign-in is unavailable.');
  }
}
