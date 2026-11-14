import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { after, before, test } from 'node:test';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { beginKeycloakLogin, finishKeycloakLogin, verifyStaffBearer } from '../src/server/auth/keycloak.ts';
import { readStaffAuthConfig } from '../src/server/auth/config.ts';

let issuer;
let validKey;
let otherKey;
let publicKey;
let config;
const codes = new Map();
const clientId = 'grand-staff';
const clientSecret = 'test-only-client-secret';
const requiredAcr = '2';

function jwt(key, claims, overrides = {}) {
  const time = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, sub: 'staff-subject', aud: clientId, iat: time,
    exp: time + 60, acr: requiredAcr, ...claims, ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'current' }).sign(key);
}

const provider = createServer(async (request, response) => {
  function json(value, status = 200) {
    response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(value));
  }

  try {
    if (request.url === '/realms/test/.well-known/openid-configuration') {
      return json({ issuer, authorization_endpoint: issuer + '/auth', token_endpoint: issuer + '/token',
        jwks_uri: issuer + '/certs', response_types_supported: ['code'], subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'], code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['client_secret_basic'] });
    }
    if (request.url === '/realms/test/certs') return json({ keys: [publicKey] });
    if (request.method === 'POST' && request.url === '/realms/test/token') {
      const body = [];
      for await (const chunk of request) body.push(chunk);
      const form = new URLSearchParams(Buffer.concat(body).toString());
      const code = form.get('code');
      const flow = codes.get(code);
      const authorisation = /^Basic (.+)$/i.exec(request.headers.authorization ?? '')?.[1];
      const credentials = authorisation ? Buffer.from(authorisation, 'base64').toString().split(':') : [];
      const decode = (value) => decodeURIComponent(value.replaceAll('+', ' '));
      if (credentials.length !== 2 || decode(credentials[0]) !== clientId || decode(credentials[1]) !== clientSecret) {
        return json({ error: 'invalid_client', error_description: 'Client authentication failed' }, 400);
      }
      if (form.get('redirect_uri') !== config.callback.href) {
        return json({ error: 'invalid_grant', error_description: 'Redirect URI mismatch' }, 400);
      }
      if (!flow || createHash('sha256').update(form.get('code_verifier') ?? '').digest('base64url') !== flow.challenge) {
        return json({ error: 'invalid_grant', error_description: 'Code or PKCE mismatch' }, 400);
      }
      codes.delete(code);
      return json({ token_type: 'Bearer', access_token: 'unused',
        id_token: await jwt(flow.key, { nonce: flow.nonce }, flow.overrides) });
    }
    return json({}, 404);
  } catch {
    if (!response.headersSent) json({}, 500);
  }
});

before(async () => {
  const first = await generateKeyPair('RS256');
  validKey = first.privateKey;
  otherKey = (await generateKeyPair('RS256')).privateKey;
  publicKey = { ...await exportJWK(first.publicKey), kid: 'current', alg: 'RS256', use: 'sig' };
  await new Promise((resolve) => provider.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${provider.address().port}/realms/test`;
  config = readStaffAuthConfig({
    STAFF_OIDC_ISSUER: issuer, STAFF_OIDC_CLIENT_ID: clientId, STAFF_OIDC_CLIENT_SECRET: clientSecret,
    STAFF_AUTH_ORIGIN: 'http://127.0.0.1:3000', STAFF_AUTH_PROPERTY_ID: 'property', STAFF_OIDC_REQUIRED_ACR: requiredAcr,
  });
});
after(() => new Promise((resolve, reject) => provider.close((error) => error ? reject(error) : resolve())));

async function login(code, overrides = {}, key = validKey) {
  const { url, flow } = await beginKeycloakLogin(config);
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('acr_values'), requiredAcr);
  codes.set(code, { challenge: url.searchParams.get('code_challenge'), nonce: flow.nonce, key, overrides });
  const query = new URLSearchParams({ code, state: flow.state, iss: issuer });
  return { flow, query };
}

test('OIDC verifies a successful confidential-client code exchange and rejects code replay', async () => {
  const { flow, query } = await login('success');
  assert.equal(await finishKeycloakLogin(config, query.toString(), flow), 'staff-subject');
  await assert.rejects(finishKeycloakLogin(config, query.toString(), flow));
});

test('OIDC rejects invalid state, PKCE, nonce and signatures', async () => {
  for (const [code, overrides, key] of [
    ['nonce', { nonce: 'wrong-nonce' }, validKey],
    ['signature', {}, otherKey],
    ['state', {}, validKey],
    ['pkce', {}, validKey],
  ]) {
    const { flow, query } = await login(code, overrides, key);
    if (code === 'state') query.set('state', 'wrong-state');
    if (code === 'pkce') flow.verifier = 'x'.repeat(43);
    await assert.rejects(finishKeycloakLogin(config, query.toString(), flow));
  }
});

test('OIDC requires the configured MFA assurance and client', async () => {
  for (const [code, overrides] of [
    ['acr', { acr: '1' }], ['azp', { azp: 'another-client' }],
  ]) {
    const { flow, query } = await login(code, overrides);
    assert.equal(await finishKeycloakLogin(config, query.toString(), flow), null);
  }
});

test('bearer validation rejects ID tokens and invalid JWT claims or signatures', async () => {
  const token = (overrides = {}, key = validKey) => jwt(key, { typ: 'Bearer', azp: clientId }, overrides);
  assert.equal(await verifyStaffBearer(config, await token()), 'staff-subject');
  const expired = Math.floor(Date.now() / 1000) - 5;
  for (const overrides of [
    { typ: 'ID' }, { iss: 'https://wrong.example/realm' }, { aud: 'other-app' }, { azp: 'other-app' },
    { acr: '1' }, { exp: expired }, { iat: expired - 60 * 16 }, { sub: '' },
  ]) {
    assert.equal(await verifyStaffBearer(config, await token(overrides)), null);
  }
  assert.equal(await verifyStaffBearer(config, await token({}, otherKey)), null);
});

test('production config requires HTTPS and explicit MFA settings', () => {
  assert.equal(readStaffAuthConfig({}), null);
  assert.throws(() => readStaffAuthConfig({ STAFF_OIDC_ISSUER: issuer }), /Incomplete/);
  assert.throws(() => readStaffAuthConfig({
    NODE_ENV: 'production', STAFF_OIDC_ISSUER: issuer, STAFF_OIDC_CLIENT_ID: clientId,
    STAFF_OIDC_CLIENT_SECRET: clientSecret, STAFF_AUTH_ORIGIN: config.origin,
    STAFF_AUTH_PROPERTY_ID: 'property', STAFF_OIDC_REQUIRED_ACR: requiredAcr,
  }), /Invalid staff OIDC URL/);
});
