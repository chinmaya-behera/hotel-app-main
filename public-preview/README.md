# Public hotel preview

Next.js application deployed on Vercel with Neon PostgreSQL and server-side Resend email.

See [deployment database configuration and persistence](DATABASE.md) for the connected resource, schema, migrations and demo retention behavior.

Each visitor receives an isolated, cookie-bound sandbox lasting 12 hours. Nine separate demo accounts open role-specific workspaces. Shared demo identities are not production employee authentication. See ROLE_COVERAGE.md for the requirement review and remaining scope. Room QR links share room context, while guest services require a single-use emailed password. Financial and external service integrations remain demonstrations.

## Local setup

Use Node.js 24 and run npm ci. Link the intended Vercel project and pull development environment variables before starting. Required variables are DATABASE_URL, RESEND_API_KEY, EMAIL_FROM and DEMO_EMAIL_ALLOWLIST when using Resend's default sender. Keep these in ignored .env.local or Vercel environment configuration.

Run npm run db:migrate for a new database, then node --env-file=.env.local scripts/seed-demo-accounts.mjs to provision the nine role accounts and create an ignored local CLIENT_DEMO_LOGINS.md sheet. Existing accounts are preserved; keep the local credential file to reproduce the sheet. Run npm test, npm run typecheck, npm run build, then npm start. Run node scripts/smoke.mjs for database/API checks; set BASE_URL to test the deployed URL.

## Email delivery

The deployed sender is Atelier Hotel <noreply@devatelier.tech>, using the verified devatelier.tech domain. Recipient addresses come from the room registration completed by Front Desk. DEMO_EMAIL_ALLOWLIST is used only if EMAIL_FROM points to the Resend default testing domain; it does not restrict this verified-domain sender. Passwords expire after ten minutes, are stored as hashes, have attempt limits and cannot be reused.

## Deployment

Deploy this folder with Vercel CLI using the linked atelier-hotel-preview project. GitHub source is maintained separately; automatic Git deployment requires connecting the GitHub account in Vercel. Environment files and platform credentials must never be committed.
