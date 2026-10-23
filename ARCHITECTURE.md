> Current implementation (2026-10-23): the original planning baseline below is preserved as history. The deployed client demonstration now implements the workflows described in [FEATURE_GUIDE.md](public-preview/FEATURE_GUIDE.md), with explicit sandbox/provider boundaries and verification evidence. Original statements such as “not started” refer to the document creation date, not the current app.

# Hotel Management App - Logical Architecture

Status: Proposed, technology-neutral | Updated: 2026-10-20

## Baseline

There is no application code, database or deployment configuration in this directory. This document proposes logical responsibilities to satisfy [PRD.md](PRD.md); it does not select a framework, database, vendor or hosting platform. Confirmed constraints and pending choices are tracked in [DECISIONS.md](DECISIONS.md).

## System boundaries

```text
Staff web/mobile interface
          |
Authenticated application boundary
          |
Authorization and scope checks -- audit recording
          |
Cases/tasks | Dispatch/SLAs | Approvals | Incident access | Administration
          |
Operational persistence + protected attachment storage
          |
Integration processing and notifications
          |
External PMS | POS | Payment provider | Messaging channels
```

These are logical modules; independently deployed services are not required. Select the simplest deployment structure that meets agreed security, workload and recovery requirements.

| Boundary | Responsibility |
| --- | --- |
| Client | Present permitted views, collect input, display results and errors; never decide final authorization |
| Application interface | Authenticate sessions, validate commands, authorize resource/action/scope, enforce workflow invariants and return filtered results |
| Cases and tasks | Preserve ownership, assignment, linked departmental work, progress, original timestamps and handover history |
| Dispatch and escalation | Evaluate approved targets, eligible staffing and shift coverage; notify primary/backup contacts; expose overdue and unowned work |
| Financial controls | Separate requests, approvals, entitled execution and reconciliation; enforce delegated limits and preserve external references |
| Incident records | Restrict incident details and evidence independently of general operational visibility |
| Administration | Apply approved access/configuration changes, expiry, QR mappings and temporary support access |
| Integration processing | Exchange authorized data, track attempts/outcomes and route failures to responsible operators |

## Conceptual information model

This model guides later schema design; names are conceptual rather than a public API contract.

| Concept | Relationships and purpose |
| --- | --- |
| Staff account | Employee identity, manager, active state and approved scoped profile grants |
| Profile grant | Profile, applicable scope, validity and approval record; multiple grants may belong to one employee |
| Property / department / outlet / floor / shift | Operational scope and eligible work boundaries |
| Guest case | Guest/service context, accountable owner, linked tasks and authorized communication history |
| Department task | Case link, category, assignee state, priority, timing targets, progress, blockers and inspection history |
| Category / coverage configuration | Owning department, eligible staff, SLA rules, escalation contacts and effective approved version |
| Handover | Open case/task references, next owner/action, ETA and backup |
| Financial exception | Request, evidence, original transaction reference, decision, executor and reconciliation outcome |
| Incident / evidence | Restricted response records and separately protected attachments |
| Guest session / QR mapping | Authorized property/room/table association, lifecycle and revocation linkage |
| Integration operation / audit event | External correlation, attempts and outcomes; attributable protected change history |

Keep essential guest/task information distinct from folios, sensitive incident records and payment-provider data so each can be independently authorized. Do not store raw card credentials.

## Data and command flows

### Operational request

Authenticate the actor, derive approved grants, validate scope and create the case/task with its original timing and history. Dispatch only to eligible staff. Record each assignment and progress change. Evaluate escalation from approved timing rules without allowing duplicate linking or reassignment to erase elapsed time. Resolve the guest case only after linked work is accounted for; exact cancellation and closure rules need Operations approval.

### Financial correction

Capture the exception and evidence, validate delegated authority, record independent approval, then authorize execution against the approved transaction and limits. Track the external result and reconcile separately. An ambiguous provider response remains unresolved until verified; do not present it as success or blindly repeat a financial operation.

### Room move and checkout

Validate the staff member's identity-check and PMS authority. Observe the authoritative PMS outcome, invalidate affected guest access and verify revocation. Expose failed or delayed lifecycle synchronization to an accountable operator. QR identifiers alone must not prove current guest entitlement.

## Reliability and integration contracts

- Define system-of-record ownership with each vendor: external PMS for reservation/stay facts, POS/payment systems for their transaction facts, application for its case/task history. Confirm these boundaries during integration design.
- Persist the operational change and its audit/outbound intent reliably so crashes cannot silently lose required follow-up. The transactional mechanism remains a stack decision.
- Use correlation and duplicate-prevention controls supported by each integration. Authenticate inbound events and reject unauthorized or stale lifecycle updates.
- Separate retryable failures from permanent or ambiguous outcomes. Retry counts, intervals, operator ownership and reconciliation procedures require vendor-specific design.
- Prevent concurrent reassignment, approval or completion from silently overwriting newer state; return a conflict and require refreshed context.
- Escalation processing must tolerate restart without losing overdue work or repeatedly issuing the same escalation. Emergency routing must not depend on routine SLA waiting.

## Interfaces, deployment and observability

No public API, route, wire schema or migration is introduced by this documentation. Later interface contracts must specify authentication, scope filtering, command validation, pagination, concurrency, error handling and external duplicate-prevention semantics before coding.

Record attributable workflow changes, authorization failures, escalation delivery, integration uncertainty and session revocation outcomes without logging secrets or unnecessary guest details. Define backup/restore verification and recovery ownership before production. Numeric service objectives, operational alerts and hosting topology remain pending. See [SECURITY.md](SECURITY.md) and [TEST_PLAN.md](TEST_PLAN.md).


## Suggested implementation supplement (2026-10-20)

The technology-neutral logical architecture above remains intact. [TECH_STACK.md](TECH_STACK.md) now recommends a TypeScript modular monolith: Next.js web/API, PostgreSQL with Drizzle, OIDC identity, private object storage and a separate BullMQ/Redis worker. This recommendation does not change the unimplemented baseline or formally select a provider.

[ER_DIAGRAMS.md](ER_DIAGRAMS.md) adds four related Mermaid ER diagrams with keys, cardinalities, scope constraints and indexing guidance. [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) explains proposed interfaces, transaction boundaries, durable outbox processing, migrations, verification and rollout. Its interfaces are proposals; none currently exists.
