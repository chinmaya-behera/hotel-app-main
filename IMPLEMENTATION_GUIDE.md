# Hotel Management App - Implementation Guide

Status: Proposed build sequence; no application has been scaffolded | Updated: 2026-10-20

## Starting point and intended result

Implement [PRD.md](PRD.md) using the suggested [TECH_STACK.md](TECH_STACK.md) and proposed [ER_DIAGRAMS.md](ER_DIAGRAMS.md). Preserve the nine profiles, scoped authorization, financial separation and evidence safeguards. The existing documents are requirements; this guide adds engineering defaults without approving unknown hotel business policies.

Build staff workflows first, then verified external integrations. Use synthetic fixtures and adapter simulations until vendor contracts and permissions are approved. Do not implement a replacement PMS, POS or accounting ledger.

## 1. Confirm contracts and bootstrap

Resolve the decisions needed for the current milestone rather than inventing SLA values or financial thresholds. Obtain an action-by-profile matrix and scope examples from Operations/Finance/Security; record them in DECISIONS.md. Identify the OIDC provider and initial administrator provisioning process. Confirm external sandbox availability and permitted stay/session lifecycle operations.

Create a pnpm workspace with the following proposed layout; these paths do not exist yet:

```text
apps/web/                 Next.js views and thin HTTP handlers
apps/worker/              Outbox relay, escalation scans and connector jobs
packages/domain/          Authorization, workflow and financial services
packages/db/              Drizzle schema, reviewed SQL migrations and repositories
packages/contracts/       Validated request/response DTOs and event contracts
packages/integrations/    PMS/POS/payment/messaging adapters and simulations
packages/ui/              Shared accessible components
tests/integration/        Real database/queue integration scenarios
tests/e2e/                Staff and lifecycle browser journeys
infra/                    Local Compose and deployment definitions
```

Pin compatible runtime/package versions, commit a lockfile and enable strict TypeScript, linting and CI checks. Provision local PostgreSQL, Redis, a private object-storage emulator and development OIDC without embedding credentials in source. Define scripts for `dev`, `build`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e` and `db:migrate`. These names are proposed project scripts, not runnable commands in the current documentation-only folder.

Suggested environment names: `DATABASE_URL`, `REDIS_URL`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `SESSION_SECRET`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET` and `OTEL_EXPORTER_OTLP_ENDPOINT`. Keep actual values in local ignored configuration or the deployment secret manager. Never expose server secrets through public client environment variables. Provider-specific storage credentials come from scoped runtime identities or secret injection.

Completion gate: the compatibility spike in TECH_STACK.md passes and CI can build both processes reproducibly.

## 2. Implement schema, identity and authorization

Create reviewed migrations in domain order: organization/access, cases/tasks/stays, finance, restricted incidents, integrations/audit/outbox. Use ER_DIAGRAMS.md's UUIDs, composite property FKs, exact money values, temporal checks and unique duplicate-prevention keys. Seed the nine profile codes and explicit permission mappings; do not seed permissive production grants or example financial limits. Add synthetic cross-property fixtures separately from production seeds.

Authenticate through OIDC Authorization Code with PKCE using a maintained compatible server library. Validate issuer, audience, state, nonce and callback URLs. Map issuer/subject to an individual account and use server-managed sessions with Secure, HttpOnly, SameSite cookies. Apply CSRF protection to cookie-authenticated mutations and clear protected client state on logout/scope change. Never rely on a long-lived token's profile claims as the current authorization source.

Centralize `authorize(actor, action, resourceContext)` in the domain layer. Evaluate active account/membership, grant validity, permission, all grant scopes and domain conditions. Require one qualifying grant to cover both action and scope. Query within authorized properties before fetching details; apply resource-specific rules to assignment, incidents, exports and attachments. Every handler, worker and import path calls the same policy/domain service; a worker acts as a constrained system principal, not an unrestricted administrator.

Completion gate: T-01 through T-03 pass against direct server requests, including combined grants and revoked sessions. Log access denials without protected payloads.

## 3. Deliver one operational vertical slice

Build create-case, create-task, dispatch, accept/progress/block/complete, inspection/reopen and case timeline. Keep case owner mandatory and task assignee nullable. Use the approved workflow transition matrix; On the Way is category-dependent. Reject conflicting or out-of-scope transitions, require a reason for correction and preserve original timestamps.

For every successful command, use one PostgreSQL transaction to authorize current state, conditionally update by version, append history/audit and insert any required outbound event. Roll back all of them if validation fails. Do not make external HTTP calls inside the database transaction. On optimistic-version conflict, return a conflict result and refresh the UI rather than silently retrying a changed human decision.

### Proposed application interface

All routes below are proposals under `/api/v1`; they do not currently exist. Use server-derived actor identity, validated DTOs and explicit property context. Client-provided identifiers never establish authorization.

| Interface | Intended operation |
| --- | --- |
| `GET /me` | Current permitted memberships, scopes and action hints; no secret tokens |
| `GET /properties/{propertyId}/tasks` | Cursor-paginated authorized queue; scoped filters |
| `POST /properties/{propertyId}/cases` | Create accountable case with validated context |
| `POST /properties/{propertyId}/cases/{caseId}/tasks` | Create departmental work using approved category/SLA |
| `POST /properties/{propertyId}/tasks/{taskId}/assignments` | Assign/reassign eligible staff, with expected version |
| `POST /properties/{propertyId}/tasks/{taskId}/transitions` | Apply an authorized workflow transition with expected version |
| `POST /properties/{propertyId}/cases/{caseId}/handovers` | Record next owner/action, ETA and backup |
| `POST /properties/{propertyId}/financial-exceptions` | Initiate a controlled correction request |
| `POST /properties/{propertyId}/financial-exceptions/{id}/approvals` | Record delegated decision against request version |
| `POST /properties/{propertyId}/financial-exceptions/{id}/executions` | Create one eligible logical execution and queue processing |
| `POST /webhooks/{connectorId}` | Verify vendor-specific authentication, persist/deduplicate input and acknowledge durable receipt |

Use typed DTOs rather than exposing database rows. Standardize errors as code, safe message and correlation ID; use 401 for unauthenticated, 403 for known forbidden actions, 404 for inaccessible resource identifiers, 409 for conflicts and 422 for validated-domain input errors. Avoid differences that reveal cross-property record existence. Protect mutation retries with an idempotency key scoped to actor/property/action plus a request digest; reject reuse with different content. Validate and cap list limits server-side.

Completion gate: T-04 through T-06 and T-17 pass with real PostgreSQL, plus one staff browser journey and accessible phone/desktop views.

## 4. Add durable escalation, handover and messaging

Version approved SLA configuration and compute acknowledgement/completion due times on task creation. Store due work in PostgreSQL. Implement an outbox relay that claims rows using transactional leases, enqueues an event ID, and tolerates duplicate delivery. Consumers must deduplicate by event/business key before producing effects. Marking an outbox event queued is not proof a notification or external action completed; retain delivery/operation outcomes separately and periodically recover overdue work from database state.

Run escalation scans at a configurable interval compatible with the eventual SLA targets. Each scan finds due tasks, resolves approved current-shift primary/backup contacts and creates a unique escalation plus outbound intent transactionally. Missing coverage remains an operational exception. Queue/job restart must neither reset deadlines nor lose obligations. Emergency routing is immediate via an urgent durable path, separate from routine SLA waiting, and delivery failures are surfaced to designated staff.

Implement handover and guest communication with approved ownership-transfer/acknowledgement policy. Retain next owner/action, ETA, backup and delivery history. Use simulated messaging until approved channel templates, consent requirements and vendor credentials are available.

Completion gate: T-07 through T-09 and T-15 pass under controlled clocks, queue loss, worker restart and delivery failures.

## 5. Integrate stay lifecycle and finance safely

Define typed adapter contracts for permitted PMS/POS/payment functions and normalized outcomes: confirmed success, confirmed failure, retryable failure and uncertain outcome. Each adapter documents source revision ordering, event identifiers, authentication, timeout/retry policy and reconciliation/query capability. Verify signatures against raw webhook bytes as required by the vendor, then persist deduplicated input before acknowledging it.

Mirror only necessary stay references and room assignments. Authenticate guest sessions against verified stay/identity context, store token digests and bind room sessions to assignment validity. On room move/checkout, revoke affected access transactionally with the local lifecycle update and schedule any external follow-up. Prevent delayed events from reactivating an obsolete assignment. Do not cache a guest entitlement beyond its valid revocation policy.

For finance, implement request -> delegated approval -> one logical execution -> independent reconciliation. Approval binds the exact request version; validate current grants/limits and prevent sensitive self-approval. Create the execution/outbox atomically before contacting the provider. On retries reuse the same provider-supported idempotency key. When the provider cannot safely deduplicate or a result is ambiguous, stop automatic financial retries and require verified lookup/reconciliation. Record every attempt; do not equate a queue acknowledgement with a refund settlement.

Completion gate: T-10 through T-12 pass in simulated and selected vendor sandbox environments. Production financial execution stays disabled until Finance approves limits, review rules and reconciliation procedures.

## 6. Add incidents, attachments, reporting and administration

Implement restricted incident access separately from general cases; ordinary case timelines show only permitted summaries. Initial responder access comes from approved emergency routing. Record response and custody actions; block ordinary evidence/audit deletion.

Uploads use private object storage and database metadata: issue scoped upload intent, validate size/type/content digest, scan/quarantine, then link to an authorized case/task/incident/financial request. Downloads require current authorization and short-lived access. Do not treat an object key or previously obtained URL as permanent permission.

Implement scope-filtered reports and separately entitled exports, approved access/configuration requests, temporary support grants and integration health/reconciliation queues. Maintain protected audit records with actor/system origin, target, outcome, approval and correlation. Add alerts for aged unowned work, revocation failure, uncertain financial outcomes, dead-letter work and missing shift coverage.

Completion gate: T-13 through T-18 pass, including direct attachment/export probes and access expiry while a session is active.

## 7. Production readiness and rollout

CI gates: frozen dependency install, lint/typecheck, domain tests, real database/Redis integration tests, web/worker builds and critical Playwright journeys. Test migrations from an empty database and from the previous release schema. Review SQL and run migrations once with a deployment identity; do not let every app replica race to migrate.

Use additive, backward-compatible migrations first, deploy compatible code, backfill with verification, then remove obsolete fields in a later release. Restore staging backups and measure recovery against approved objectives. Configure graceful worker shutdown, redacted telemetry, health/readiness checks and actionable alerts. Rollbacks must not replay completed financial work or reverse verified guest revocation.

Pilot one property with approved staff accounts and non-financial workflows, verify handovers and escalation coverage, then enable tested integrations and separately approved financial capabilities. Select rollout dates and capacity only after P-11 is resolved. Define named on-call, Operations and Finance owners, pause/rollback criteria and a manual fallback for application or connector outages. Use controlled configuration gates for risky capabilities; a feature-flag service is optional.

Release acceptance follows [TEST_PLAN.md](TEST_PLAN.md), including no unresolved critical access/financial-integrity defects and demonstrated restore procedures. Update MEMORY.md with actual implementation status and DECISIONS.md with accepted stack/provider choices. Documentation generation is not evidence that any implementation milestone has passed.
