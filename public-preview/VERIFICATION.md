# Feature showcase verification

Date: 2026-10-23 (Asia/Kolkata). Source: public-preview.

| Check | Result and evidence |
| --- | --- |
| Domain authorization/workflows | 55 tests passed: tests/domain.test.mjs, tests/workflows.test.mjs and tests/features.test.mjs |
| Production build | Next.js Webpack compilation and TypeScript checks passed; /features and /api/features included |
| Nine account checks | scripts/auth-smoke.mjs passed locally: all roles, role-spoof rejection, visitor isolation, protected guest access, conflicts and logout revocation |
| Original workflow | scripts/workflow-smoke.mjs passed locally: case/duplicate/task/inspection/handover/closure, independent Finance review, controlled SLA approval, guest security response and session revocation |
| Extended features API | scripts/features-smoke.mjs passed locally: actual approved role/scope switch, cross-floor denial, availability, safety, approved messaging, evidence download authorization, PMS failure/retry/keys/checkout, stale callbacks, financial uncertainty, independent review, exact confirmed POS revenue approval, duplicate prevention, emergency delivery recovery, independent configuration, export policy, MFA exercise and detached recovery |
| Browser | Feature catalogue rendered with all role/location/usage instructions; Coverage & SLA saved a form change and retained its saved state after refresh |
| External effects | Feature tests use synthetic provider adapters. Guest authentication in the original smoke test uses a database fixture; these checks send no email and make no live financial, physical key or emergency changes |

## Run locally

Use Node 24+, install the locked dependencies, configure the ignored environment, migrate/seed as documented in DATABASE.md, build and start the production server. Run npm test, node scripts/auth-smoke.mjs, node --env-file=.env.local scripts/workflow-smoke.mjs and node scripts/features-smoke.mjs. BASE_URL selects a deployed app. Scripts read credentials from ignored .demo-credentials.json and do not print passwords.

Writes use database versions and must not be blindly retried on conflict or uncertain network outcomes. The feature API applies current server-side role/grant/scope checks and private no-store responses. Database fetches and feature UI requests have bounded network timeouts.

These checks are demonstration validation, not certification of production identity/MFA, vendor webhooks, infrastructure backup/recovery, automatic worker scheduling, malware scanning, retention, accessibility conformance or performance SLAs. See FEATURE_GUIDE.md for provider and release boundaries.

## Public deployment checks

The public /features page returned HTTP 200 and rendered its catalogue in the browser. All nine public role-account checks passed. Public extended checks verified actual grant/scope changes, availability, messaging, room safety, evidence authorization, sandbox PMS recovery and lifecycle protection, financial uncertainty/independent reconciliation, approved synthetic POS revenue and duplicate prevention. Some long Node HTTPS runs encountered connection resets; the test helper now supports fresh HTTP/1 connections and a separately runnable final-controls scenario. Repeated login testing reached the configured sign-in limit (429); its normal window is respected, not disabled. Runtime error-log query returned zero error records for the preceding 15 minutes.

Final public control scenario passed after the normal sign-in window reset: immediate emergency routing/failure recovery, independent configuration approval/application, rejected export, one-use MFA exercise and detached restore validation. The final deployment is dpl_6NBpKxqnQdMDwqiTy4sVzhtwPZ4C (READY) at https://devatelier.tech. A subsequent ten-minute production runtime error-log query returned zero records. Public tests ran in isolated synthetic workspaces and did not send email or operate live providers.
