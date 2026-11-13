import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Global singleton typing for Next.js hot-module replacement (HMR) connection pooling.
 * Prevents exhausting PostgreSQL connections during local development reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __grand_pg_client: postgres.Sql | undefined;
  // eslint-disable-next-line no-var
  var __grand_drizzle_db: PostgresJsDatabase | undefined;
}

/**
 * Sanitizes a connection string to strip credentials for safe logging and status reporting.
 */
export function sanitizeConnectionString(url?: string): string {
  if (!url) return '[DATABASE_URL not set]';
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '[Invalid Connection URL format]';
  }
}

/**
 * Retrieves the validated PostgreSQL connection URL.
 */
export function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Fallback connection string for local development, CI, and build time
    return 'postgresql://postgres:postgres@localhost:5432/grand_hotel_db';
  }
  return url;
}

/**
 * Instantiates or retrieves the cached PostgreSQL connection pool client.
 */
function createPostgresClient(): postgres.Sql {
  if (process.env.NODE_ENV !== 'production' && globalThis.__grand_pg_client) {
    return globalThis.__grand_pg_client;
  }

  const connectionString = getConnectionString();
  const maxConnections = process.env.DB_POOL_MAX
    ? parseInt(process.env.DB_POOL_MAX, 10)
    : process.env.NODE_ENV === 'production'
      ? 10
      : 5;

  const idleTimeout = process.env.DB_IDLE_TIMEOUT
    ? parseInt(process.env.DB_IDLE_TIMEOUT, 10)
    : 20;

  const connectTimeout = process.env.DB_CONNECT_TIMEOUT
    ? parseInt(process.env.DB_CONNECT_TIMEOUT, 10)
    : 5;

  const client = postgres(connectionString, {
    max: maxConnections,
    idle_timeout: idleTimeout,
    connect_timeout: connectTimeout,
    onnotice: () => {}, // Suppress noisy database notices
  });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__grand_pg_client = client;
  }

  return client;
}

/**
 * Instantiates or retrieves the cached Drizzle ORM client.
 */
function createDrizzleDatabase(client: postgres.Sql): PostgresJsDatabase {
  if (process.env.NODE_ENV !== 'production' && globalThis.__grand_drizzle_db) {
    return globalThis.__grand_drizzle_db;
  }

  const instance = drizzle(client);

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__grand_drizzle_db = instance;
  }

  return instance;
}

// Canonical database exports
export const client = createPostgresClient();
export const db = createDrizzleDatabase(client);

/**
 * Verifies live database connectivity without leaking credentials.
 * Used for readiness probes, health checks, and connection tests.
 */
export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
  sanitizedUrl: string;
}> {
  const activeUrl = getConnectionString();
  const sanitizedUrl = sanitizeConnectionString(activeUrl);
  const start = Date.now();

  try {
    const result = await client`SELECT 1 as alive`;
    const latencyMs = Date.now() - start;

    if (result && result.length > 0 && result[0].alive === 1) {
      return { ok: true, latencyMs, sanitizedUrl };
    }

    return {
      ok: false,
      error: 'Unexpected ping response from database',
      sanitizedUrl,
    };
  } catch (err: unknown) {
    let errorMessage = 'Unknown database connection failure';
    if (err instanceof Error) {
      errorMessage = err.message || (err as Record<string, unknown>).code as string || err.name;
    } else if (typeof err === 'object' && err !== null) {
      const rec = err as Record<string, unknown>;
      errorMessage = (rec.message || rec.code || rec.name || JSON.stringify(rec)) as string;
    }
    return {
      ok: false,
      error: errorMessage,
      sanitizedUrl,
    };
  }
}

/**
 * Gracefully closes the connection pool (for test runners, CI, and shutdown).
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (globalThis.__grand_pg_client) {
    await globalThis.__grand_pg_client.end({ timeout: 5 });
    globalThis.__grand_pg_client = undefined;
    globalThis.__grand_drizzle_db = undefined;
  } else {
    await client.end({ timeout: 5 });
  }
}
