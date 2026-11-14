import * as oidc from 'openid-client';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ACCESS_SECONDS, type StaffAuthConfig } from './config.ts';

type Provider = { client: oidc.Configuration; keys: ReturnType<typeof createRemoteJWKSet> };
let cached: { key: string; provider: Promise<Provider> } | undefined;

function discover(settings: StaffAuthConfig) {
  const key = JSON.stringify(settings);
  if (cached?.key === key) return cached.provider;

  const provider = oidc.discovery(
    settings.issuer,
    settings.clientId,
    { client_secret: settings.clientSecret, id_token_signed_response_alg: 'RS256' },
    oidc.ClientSecretBasic(settings.clientSecret),
    { timeout: 5, execute: settings.issuer.protocol === 'http:' ? [oidc.allowInsecureRequests] : [] },
  ).then((client) => {
    const metadata = client.serverMetadata();
    if (!metadata.jwks_uri || !metadata.authorization_endpoint || !metadata.token_endpoint) {
      throw new Error('Incomplete Keycloak discovery metadata');
    }
    for (const value of [metadata.jwks_uri, metadata.authorization_endpoint, metadata.token_endpoint]) {
      const endpoint = new URL(value);
      if (endpoint.origin !== settings.issuer.origin || endpoint.username || endpoint.password) {
        throw new Error('Keycloak endpoints must use the configured issuer origin');
      }
    }
    oidc.enableNonRepudiationChecks(client);
    return { client, keys: createRemoteJWKSet(new URL(metadata.jwks_uri), { timeoutDuration: 5000 }) };
  });
  cached = { key, provider };
  void provider.catch(() => {
    if (cached?.provider === provider) cached = undefined;
  });
  return provider;
}

export async function beginKeycloakLogin(settings: StaffAuthConfig) {
  const { client } = await discover(settings);
  const flow = {
    verifier: oidc.randomPKCECodeVerifier(),
    state: oidc.randomState(),
    nonce: oidc.randomNonce(),
  };
  const url = oidc.buildAuthorizationUrl(client, {
    redirect_uri: settings.callback.href,
    scope: 'openid',
    code_challenge: await oidc.calculatePKCECodeChallenge(flow.verifier),
    code_challenge_method: 'S256',
    state: flow.state,
    nonce: flow.nonce,
    acr_values: settings.requiredAcr,
  });
  return { url, flow };
}

export type LoginFlow = Awaited<ReturnType<typeof beginKeycloakLogin>>['flow'];

export async function finishKeycloakLogin(settings: StaffAuthConfig, query: string, flow: LoginFlow) {
  const { client } = await discover(settings);
  const url = new URL(settings.callback);
  url.search = query;
  const response = await oidc.authorizationCodeGrant(client, url, {
    expectedState: flow.state,
    expectedNonce: flow.nonce,
    pkceCodeVerifier: flow.verifier,
    idTokenExpected: true,
  });
  const claims = response.claims();
  if (!claims?.sub || claims.acr !== settings.requiredAcr ||
      !Number.isSafeInteger(claims.iat) || Math.abs(Date.now() / 1000 - claims.iat) > ACCESS_SECONDS ||
      (claims.azp !== undefined && claims.azp !== settings.clientId) ||
      (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp !== settings.clientId)) {
    return null;
  }
  return claims.sub;
}

export async function verifyStaffBearer(settings: StaffAuthConfig, token: string) {
  try {
    const { keys } = await discover(settings);
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ['RS256'],
      issuer: settings.issuer.href,
      audience: settings.clientId,
      requiredClaims: ['exp', 'iat', 'sub'],
      maxTokenAge: ACCESS_SECONDS,
    });
    if (payload.typ !== 'Bearer' || payload.azp !== settings.clientId ||
        payload.acr !== settings.requiredAcr || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
