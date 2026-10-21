# Public hotel preview

Next.js application deployed on Vercel with Neon PostgreSQL and server-side Resend email.

Each visitor receives an isolated, cookie-bound sandbox lasting 12 hours. The nine-role selector demonstrates permissions; it is not production employee authentication. Room QR links share room context, while guest services require a single-use emailed password. Financial and external service integrations remain demonstrations.

## Local setup

Use Node.js 24 and run npm ci. Link the intended Vercel project and pull development environment variables before starting. Required variables are DATABASE_URL, RESEND_API_KEY, EMAIL_FROM and DEMO_EMAIL_ALLOWLIST when using Resend's default sender. Keep these in ignored .env.local or Vercel environment configuration.

Run npm run db:migrate once for a new database, npm test, npm run typecheck, npm run build, then npm start. Run node scripts/smoke.mjs for database/API checks; set BASE_URL to test the deployed URL.

## Email limits

The default Resend sender is restricted to the configured account-recipient allowlist. A Gmail mailbox is a recipient, not a verifiable sender domain. To support arbitrary guest recipients, verify a domain you own in Resend and update EMAIL_FROM to that domain. Passwords expire after ten minutes, are stored as hashes, have attempt limits and cannot be reused.

## Deployment

Deploy this folder with Vercel CLI using the linked atelier-hotel-preview project. GitHub source is maintained separately; automatic Git deployment requires connecting the GitHub account in Vercel. Environment files and platform credentials must never be committed.
