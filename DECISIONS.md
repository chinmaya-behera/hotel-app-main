# Hotel Management App - Decision Register

Updated: 2026-10-20

## How to use this register

Distinguish confirmed documentation choices, source constraints, proposed design and pending decisions. A source requirement is not proof that a technical implementation exists. Record future decisions with date, accountable approver, rationale, consequences and links to affected requirements/tests. Supersede entries explicitly rather than silently rewriting decision history.

## Established baseline

| ID | Status | Decision or constraint | Rationale/source |
| --- | --- | --- | --- |
| D-01 | Confirmed documentation choice | Create seven substantive Markdown documents at the project root. | User request and approved plan, 2026-10-20. |
| D-02 | Confirmed documentation choice | Keep the specification requirements-first and technology-neutral. | User selected this approach; no implementation exists. |
| D-03 | Confirmed baseline fact | `hotel-app-main` was empty before documentation creation. | Local directory inspection, 2026-10-20. |
| D-04 | Source constraint | Model nine reusable profiles; an employee may hold multiple approved scoped profiles. | Reference PDF, pages 1-10 and 12; REQ-01. |
| D-05 | Source constraint | Preserve accountable guest cases, linked work, original timing and handover continuity. | PDF pages 1, 3 and 11; REQ-02/REQ-05/REQ-06. |
| D-06 | Source constraint | Separate delegated financial approval, entitled execution and reconciliation; restrict self-approval. | PDF pages 7 and 11-12; REQ-08. |
| D-07 | Source constraint | Management and technical administration do not automatically grant finance, incident or safety override powers. | PDF pages 4-5 and 8-10; REQ-01/REQ-09/REQ-10. |
| D-08 | Source constraint | Explicit PMS authority, identity checks and room-move/checkout session revocation are required. | PDF pages 4, 6 and 10; REQ-07. |
| D-09 | Proposed logical design | Separate authorization, operational workflows, restricted records and connector responsibilities logically; deployment topology remains open. | Simplifies responsibility boundaries without prematurely selecting a stack; ARCHITECTURE.md. |

## Pending decisions and release gates

Owner labels below identify the function expected to approve a decision; named individuals have not been assigned.

| ID | Decision needed | Accountable function | Required before |
| --- | --- | --- | --- |
| P-01 | Framework/runtime, database, attachment storage, hosting and deployment topology | Engineering / IT | Implementation foundation |
| P-02 | Identity provider, MFA policy, session duration, access expiry and support-access process | IT / designated access approvers | Authentication implementation |
| P-03 | Explicit action-by-profile permission matrix, scope applicability and exceptional access approval | Operations / Finance / IT / Security | Authorization implementation |
| P-04 | Task categories, state transitions, inspection/closure/cancellation rules and duplicate handling | Operations | Workflow implementation |
| P-05 | SLA targets, category priority rules, shift coverage, escalation deadlines and primary/backup contacts | Operations | Escalation implementation |
| P-06 | Financial amounts/currencies/types, reasons, evidence, delegation and independent review rules | Finance | Financial integration or release |
| P-07 | PMS/POS/payment/messaging vendors, supported actions, source-of-record contracts and failure/retry semantics | IT with Operations / Finance | Connector implementation |
| P-08 | Guest channels, identity verification, session model, QR association and lifecycle synchronization | Front Office / IT | Guest-session implementation |
| P-09 | Emergency procedures, restricted incident viewers, evidence handling and unsafe-room clearance | Security / Operations | Incident workflow implementation |
| P-10 | Data retention/deletion, masking, exports, attachment limits and access-review schedules | Designated data owners / Security / IT | Storage policy and production readiness |
| P-11 | Capacity, latency, availability, backup/restore objectives, monitoring and response ownership | Operations / IT | Performance and recovery acceptance |
| P-12 | Brand, component library, localization, time-zone presentation and staff usability approval | Product / Operations | Final UI acceptance |
| P-13 | Shift handover acknowledgement and ownership-transfer rules | Operations | Handover implementation |

## Change control

Operations approves task ownership and coverage, Finance approves financial controls, and IT configures and validates approved access. Operational rules, SLAs and content changes follow controlled approval and testing. Update [PRD.md](PRD.md), [DESIGN.md](DESIGN.md), [SECURITY.md](SECURITY.md) and [TEST_PLAN.md](TEST_PLAN.md) together when a decision changes behavior. Open decisions are requirements work, not authorization to invent business policy.


## Technical recommendation addendum (2026-10-20)

The user subsequently requested a suggested stack, implementation guide and ER diagrams while preserving existing content. D-02 remains the original requirements-first baseline; adding recommendations does not convert pending choices into approved decisions.

| ID | Status | Recommendation | Consequence |
| --- | --- | --- | --- |
| D-10 | Suggested, awaiting acceptance | TypeScript, Next.js, PostgreSQL/Drizzle, OIDC, private S3-compatible storage and a BullMQ/Redis worker; see [TECH_STACK.md](TECH_STACK.md). | P-01/P-02 remain open until compatible versions, provider/operations ownership and deployment requirements are accepted. |
| D-11 | Proposed engineering design | Shared domain authorization, scoped relational constraints, transactional history/outbox and idempotent integration processing; see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md). | Validate these mechanisms with real-database and failure-path tests before release. |
| D-12 | Proposed relational model | Four domain ER diagrams with explicit keys/cardinalities; see [ER_DIAGRAMS.md](ER_DIAGRAMS.md). | Review against approved workflow/permission policy before generating migrations. |

No financial amounts, SLA values, retention periods, vendor contracts or rollout dates have been approved through these additions. Suggested routes and entity names are design proposals, not compatibility guarantees for an existing API.
