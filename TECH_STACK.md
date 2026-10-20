# Suggested Technology Stack

Status: Recommendation, not an approved or installed stack | Updated: 2026-10-20

## Recommendation and rationale

Build a TypeScript modular monolith with a responsive Next.js staff interface, PostgreSQL persistence and a separately running worker. Share domain services between HTTP handlers and jobs. This fits the transactional case/task, scoped-permission and approval requirements without introducing independently owned microservices prematurely.

This is an engineering recommendation derived from the product requirements, not a constraint from the source PDF. The original technology-neutral documents remain valid; this supplement supplies a concrete implementation path. No dependencies or infrastructure have been installed. See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) and [ER_DIAGRAMS.md](ER_DIAGRAMS.md).

| Layer | Suggested choice | Application use and limits |
| --- | --- | --- |
| Runtime / language | Supported Node.js LTS, TypeScript strict mode, pnpm workspace | Shared types and tooling for web/worker; pin exact compatible versions and lockfile at bootstrap rather than assuming newest releases work together. |
| Web / HTTP API | Next.js App Router, React, Route Handlers | Responsive staff views and same-origin application endpoints. Keep authorization/domain logic outside components and handlers. [Official handler documentation](https://nextjs.org/docs/app/getting-started/route-handlers). |
| UI | Tailwind CSS, Radix UI primitives, React Hook Form, Zod | Accessible building blocks and shared input validation; business authorization stays server-side. Confirm dependency compatibility during bootstrap. |
| Database | Managed PostgreSQL | Relational integrity, transactions, foreign keys, checks and indexed scoped queries. Prefer managed backup/PITR support; confirm chosen plan and region. [Constraint documentation](https://www.postgresql.org/docs/current/ddl-constraints.html). |
| Data access / migrations | Drizzle ORM with node-postgres; Drizzle Kit plus reviewed SQL migrations | Explicit relational schema and transactions. Preserve SQL control for composite foreign keys and policies; inspect generated SQL before applying. [Transactions](https://orm.drizzle.team/docs/transactions), [migration workflow](https://orm.drizzle.team/docs/migrations). |
| Identity | OIDC with the hotel's existing enterprise identity provider; Keycloak as the reference option if none exists | Authorization Code flow with PKCE, server-managed sessions and approved MFA. Keycloak needs its own operations/patching ownership. Identity-provider groups do not replace application scope grants. [OIDC integration](https://www.keycloak.org/securing-apps/oidc-layers). |
| Jobs / timers | BullMQ on managed Redis, standalone Node.js worker | Escalation scans, notifications and connector attempts. PostgreSQL remains the durable business source; Redis/queue loss must be recoverable from due work/outbox rows. Retried jobs must be idempotent. [Job guidance](https://docs.bullmq.io/patterns/idempotent-jobs). |
| Attachments | Private S3-compatible object storage | Database stores metadata and authorization links; issue short-lived download access after authorization. Quarantine uploads pending validation/scanning. Separate ordinary attachments and restricted incident evidence logically and by policy. |
| Telemetry | OpenTelemetry, structured JSON logs and a managed metrics/log backend | Correlation across request, outbox and connector attempts; redact guest details and credentials. Vendor selection remains pending. |
| Verification | Vitest, real PostgreSQL/Redis integration fixtures, Playwright and axe-core | Permission/domain tests, transactional/concurrency tests and critical browser journeys. [Playwright documentation](https://playwright.dev/docs/intro). |
| Local / production deployment | Docker Compose locally; managed container platform with separate web and worker processes in production | Managed PostgreSQL, Redis and private object storage in compatible regions. Avoid process-local timers. Provider choice follows residency, availability, connectivity and budget decisions. |
| CI | Repository CI runner, recommended GitHub Actions if hosted on GitHub | Frozen-lockfile install, static checks, tests, migration review and deploy gates. Do not assume the repository is already hosted on GitHub. |

## Deployment shape

Deploy the web application and worker from the same versioned codebase as separately scalable processes. Only the web entry point is public; databases, Redis and worker management interfaces use private access. Vendor webhooks enter authenticated handler endpoints. Keep development, staging and production credentials/resources separate.

Run multiple workers only with safe claiming, duplicate prevention and transaction controls. Use a database outbox to recover outbound work after crashes. Redis is not the sole record of financial, escalation or revocation obligations. Prefer periodic authorized polling for initial staff queue refresh; a later push channel must preserve the same scope checks.

An alternative serverless deployment can be evaluated later, but it must provide durable worker/queue/timer equivalents. Do not deploy this proposed worker as a request handler and assume it will remain alive between requests.

## Authorization implementation

Use a centralized application policy service with explicit action identifiers and scope-bound grants. Each permission must come from a grant that independently satisfies both the action and its scope. Evaluate assignment, delegated finance limits, self-approval restrictions and incident-specific access as additional conditions. Authenticate identities through OIDC, then load current authorization from application storage.

PostgreSQL row security is an optional additional isolation layer after a tested connection/context design; it is not assumed in the initial recommendation and does not replace domain authorization. If enabled, account for owner/bypass roles and pool context leakage. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

## Version, cost and adoption policy

Use a supported Node.js LTS line, verified against framework and worker dependency requirements at implementation time. Record actual versions in the lockfile, runtime pin and CI/container images. Review upstream security support and compatible upgrades regularly. [Node.js release policy](https://nodejs.org/en/about/previous-releases).

No hosting cost is estimated because capacity, region, retention and availability requirements are unresolved. Begin with one deployable codebase and managed stateful services; expand only when measured workload or team ownership requires it. Obtain P-01/P-02 decisions in [DECISIONS.md](DECISIONS.md) before treating this recommendation as selected. PMS, POS, payment and messaging vendors remain separate decisions.

## Compatibility checkpoint

Before coding business features, prove a vertical spike: OIDC login, a database transaction through Drizzle, a durable outbox row processed by BullMQ, a private attachment retrieval and one Playwright journey. Record installed versions and results. This checks that the proposed components work together; this documentation does not claim that check has already passed.
