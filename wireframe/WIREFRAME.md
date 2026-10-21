# Atelier Hotel interactive wireframe

This directory implements the repository's role structure as a private, interactive prototype. It preserves the beige/cream/taupe/muted-olive visual brief. It is not a production hotel management system.

## Working functionality

- Nine selectable staff personas with server-checked actions and scoped task retrieval.
- Persisted request creation, eligible assignment, progress, blockers, inspection and corrective reopening.
- Twelve rooms, identity-verified guest/email registration, room move and checkout, session revocation.
- Actual locally generated QR codes and a “Click me to login” alternative.
- Real Resend email requests, generated single-use passwords, expiry, attempt limits and hashed server-side storage. API keys and passwords are never returned to the client.
- Room-authenticated guest services routed to the corresponding department and in-app guest updates.
- Handover ownership, next action, ETA, backup and acknowledgement.
- Financial request, approval, separate execution and independent review as explicitly labeled demonstrations; no payment or external accounting effects.
- Restricted security incident records, response stages and evidence/custody references. No actual emergency dispatch.
- Approved access activation/deactivation, proposed/approved service configuration, connector status and protected history.

## Run and verify

Use the pinned lockfile and a compatible Node.js runtime. The portable Sites workflow uses `npm run dev`, then the printed loopback URL. Local preview sign-in is `/signin-with-chatgpt?return_to=/`; this development identity emulation is not deployed.

Run `node --test tests/domain.test.mjs` using Node with TypeScript stripping support. Run `node node_modules/typescript/bin/tsc --noEmit` and `npm run build`. Generate migrations with `npm run db:generate`; apply the generated SQL to local D1 following the starter instructions. Hosted publishing applies migration files.

## Email setup

Set `RESEND_API_KEY` as a secret and `EMAIL_FROM` as the approved sender in the hosted Site environment. Never put the key in Git or browser JavaScript. The default sender is `Atelier Hotel <onboarding@resend.dev>`; Resend restricts it to the account's own recipient email. To send to arbitrary guests, verify a domain and update `EMAIL_FROM`. See [Resend sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

Front Desk must register the guest name/email and confirm identity/stay verification before requesting a room password. The email is sent to that stored address only. Passwords expire after ten minutes, allow limited attempts and can be consumed once. Guest sessions expire after twelve hours and are revalidated against current room registration. QR codes contain room context only, never a password or registered email.

## Prototype boundaries

Sites remains owner-private. Its ChatGPT sign-in protects this role preview; the persona picker is intentionally available to the owner and is not an employee login system. Guest room verification is an additional application entitlement within that private preview. Public guest use requires a separate reviewed staff/guest access deployment; do not make the role picker publicly accessible.

This prototype uses versioned D1 operational state rather than applying the full production PostgreSQL ER model. It covers one illustrative property. Initial records, SLA targets and approval limits are demonstration configuration. PMS, POS, refunds, payments, emergency dispatch, real evidence uploads and revenue synchronization are not connected. Migration to the repository's production architecture requires approved business policies, genuine employee identity mapping, connector contracts and the full security/test plan.

Original specification documents and workflow images remain unchanged. Runtime guest registrations and secrets must never be exported into the public repository.
