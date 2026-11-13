import test from 'node:test';
import assert from 'node:assert/strict';
import {
  db,
  client,
  sanitizeConnectionString,
  getConnectionString,
  checkDatabaseConnection,
  closeDatabaseConnection,
} from '../src/server/db/index.ts';

test('DEV1-TASK-01 Foundation: Database module exports canonical clients', () => {
  assert.ok(db, 'Drizzle ORM instance (db) must be exported');
  assert.ok(client, 'Postgres connection pool client must be exported');
  assert.equal(typeof db.select, 'function', 'Drizzle db instance must have query builders');
  assert.equal(typeof client, 'function', 'Postgres client must be callable as template tag');
});

test('DEV1-TASK-01 Foundation: Connection string sanitizer hides passwords', () => {
  const exposed = 'postgresql://admin:superSecret123@db.example.com:5432/grand_hotel_db?sslmode=require';
  const sanitized = sanitizeConnectionString(exposed);

  assert.ok(!sanitized.includes('superSecret123'), 'Sanitized URL must NEVER contain raw passwords');
  assert.ok(sanitized.includes('***'), 'Password must be masked with ***');
  assert.ok(sanitized.includes('admin'), 'User identifier is retained');
  assert.ok(sanitized.includes('db.example.com:5432'), 'Host and port are retained');
  assert.ok(sanitized.includes('grand_hotel_db'), 'Database name is retained');
});

test('DEV1-TASK-01 Foundation: Connection string sanitizer handles invalid or missing URLs gracefully', () => {
  assert.equal(sanitizeConnectionString(''), '[DATABASE_URL not set]');
  assert.equal(sanitizeConnectionString(undefined), '[DATABASE_URL not set]');
  assert.equal(sanitizeConnectionString('invalid_uri_without_scheme'), '[Invalid Connection URL format]');
});

test('DEV1-TASK-01 Foundation: getConnectionString provides development fallback if unset', () => {
  const url = getConnectionString();
  assert.ok(url.startsWith('postgresql://'), 'Connection URL must be a valid postgresql:// URI');
  assert.ok(url.includes('grand_hotel_db'), 'Fallback URI targets grand_hotel_db');
});

test('DEV1-TASK-01 Foundation: checkDatabaseConnection handles unavailable server without crashing', async () => {
  // Unless a live PostgreSQL is currently running on port 5432, this returns ok: false safely
  const result = await checkDatabaseConnection();
  assert.equal(typeof result, 'object', 'Result must be a structured object');
  assert.equal(typeof result.ok, 'boolean', 'Result.ok must be boolean');
  assert.ok(result.sanitizedUrl, 'Result must include sanitized URL');
  assert.ok(!result.sanitizedUrl.includes('postgres:postgres@') || result.sanitizedUrl.includes('***'), 'No password leaked');

  if (!result.ok) {
    assert.ok(result.error && result.error.length > 0, 'Error message must be present when unreachable');
  }

  // Graceful cleanup
  await closeDatabaseConnection();
});
