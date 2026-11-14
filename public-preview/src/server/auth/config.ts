export const STAFF_AUTH_PATH = '/api/v1/auth';
export const STAFF_SESSION_COOKIE = 'grand_staff_session';
export const STAFF_REFRESH_COOKIE = 'grand_staff_refresh';
export const STAFF_CSRF_COOKIE = 'grand_csrf_token';
export const STAFF_FLOW_COOKIE = 'grand_staff_oidc';
export const ACCESS_SECONDS = 15 * 60;
export const REFRESH_SECONDS = 8 * 60 * 60;
export const FLOW_SECONDS = 5 * 60;

export function isLoopback(host: string) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(host);
}

export function readStaffAuthConfig(env = process.env) {
  const { STAFF_OIDC_ISSUER, STAFF_OIDC_CLIENT_ID, STAFF_OIDC_CLIENT_SECRET,
    STAFF_OIDC_REQUIRED_ACR, STAFF_AUTH_ORIGIN, STAFF_AUTH_PROPERTY_ID } = env;
  if (!STAFF_OIDC_ISSUER?.trim()) return null;
  if (!STAFF_OIDC_CLIENT_ID?.trim() || !STAFF_OIDC_CLIENT_SECRET?.trim() || !STAFF_AUTH_ORIGIN?.trim() ||
      !STAFF_AUTH_PROPERTY_ID?.trim() || !STAFF_OIDC_REQUIRED_ACR?.trim()) {
    throw new Error('Incomplete staff OIDC configuration');
  }

  const issuer = new URL(STAFF_OIDC_ISSUER);
  const origin = new URL(STAFF_AUTH_ORIGIN);
  for (const url of [issuer, origin]) {
    const local = env.NODE_ENV !== 'production' && url.protocol === 'http:' && isLoopback(url.hostname);
    if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash) {
      throw new Error('Invalid staff OIDC URL');
    }
  }
  if (origin.pathname !== '/') throw new Error('STAFF_AUTH_ORIGIN must be an origin');

  return {
    issuer: new URL(issuer.href.replace(/\/$/, '')),
    origin: origin.origin,
    callback: new URL(`${STAFF_AUTH_PATH}/callback`, origin),
    secure: origin.protocol === 'https:',
    clientId: STAFF_OIDC_CLIENT_ID,
    clientSecret: STAFF_OIDC_CLIENT_SECRET,
    requiredAcr: STAFF_OIDC_REQUIRED_ACR,
    propertyId: STAFF_AUTH_PROPERTY_ID,
  };
}

export type StaffAuthConfig = NonNullable<ReturnType<typeof readStaffAuthConfig>>;
