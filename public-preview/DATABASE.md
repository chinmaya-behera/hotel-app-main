# Deployment database

Verified on 2026-10-22 for https://atelier-hotel-preview.vercel.app.

## Connected resource

- Provider: Neon PostgreSQL through Vercel Marketplace.
- Resource: `neon-yellow-anchor`.
- Vercel project: `atelier-hotel-preview`, scope `chinmaya-beheras-projects`.
- [Database management dashboard](https://vercel.com/d/dashboard/integrations/neon/icfg_1ucbHkBEAcGU3kGQXGAXRo84/resources/store_ES3m6LjfvvZG7c2z).
- Server connection: `DATABASE_URL`, provisioned for Production, Preview and Development. Do not expose this variable to browser code or commit it.
- Driver: `@neondatabase/serverless`; SQL queries run in server route handlers.

## Applied schema

| Table | Stored data |
| --- | --- |
| `demo_workspaces` | Visitor token hash, version, expiry and JSONB hotel state: rooms, requests, finance demonstrations, incidents, handovers, staff configuration, messages and audit |
| `demo_staff_accounts` | Nine role accounts, salted password hashes and active flags |
| `demo_staff_sessions` | Hashed staff session tokens bound to an account and workspace |
| `demo_guest_codes` | Hashed one-use room passwords, expiry and attempt counts |
| `demo_guest_sessions` | Hashed room-guest sessions |
| `demo_rate_limits` | Database-backed request and email attempt counters |

Migrations are in `migrations/001_preview.sql` and `migrations/002_demo_accounts.sql`. From this directory, run `npm run db:migrate` with an ignored `.env.local` containing the intended database connection. The migrations create missing objects without dropping existing tables. Account provisioning is a separate `node --env-file=.env.local scripts/seed-demo-accounts.mjs` command; retain the ignored credential file for existing account passwords.

## Persistence and isolation

This deployment is a client demonstration. Each browser receives its own hotel sandbox for up to 12 hours. Staff sessions expire after eight hours or when the workspace expires, whichever is earlier. Changing demo accounts in one browser preserves that sandbox; using another browser creates separate records. Expiry prevents access; it does not currently delete expired database rows automatically.

Hotel operations are stored as versioned JSONB state, not the fully normalized production schema proposed in the root ER diagrams. Updates check the previous version to prevent silent concurrent overwrites. Guest session revocation is included in the same database operation for relevant stay changes.

Production, Preview and Development currently use the same provisioned database. Before using real hotel records, separate those environments, implement individual staff identities and permanent property records, and establish retention, cleanup, recovery and backup procedures. This setup does not claim those production operations are configured.

## Verification evidence

The database accepted a direct connection; all six required tables and nine active demo profiles were found. A synthetic housekeeping request created through the deployed Front Desk API was returned by a fresh request and independently found in the connected Neon database. Staff logout completed successfully. No credentials or guest passwords were logged.


## Extended feature state (2026-10-23)

The existing versioned demo_workspaces JSONB stores an optional featureLab document. It contains approved grants and per-username selection, coverage, room restrictions, escalation obligations, text evidence/digests, sandbox operations and idempotency keys, reservation and financial-exception fixtures, notification outcomes, independent configuration changes, MFA-exercise state, private operational snapshots and restore-drill results. It is excluded from ordinary hotel/guest responses. The features API returns role-scoped metadata; text downloads reauthorize the current account/scope. No new credential table or external service is provisioned. Atomic workspace version checks protect concurrent updates. Infrastructure backup/retention and production malware scanning are not supplied by this JSONB demo model.
