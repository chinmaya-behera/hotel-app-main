# Hotel Management App - Test Plan

Status: Planned; no application or test suite exists | Updated: 2026-10-20

## Strategy and fixtures

Validate [PRD.md](PRD.md) behavior at authorization/domain, persistence/integration and complete user-journey levels. Use unit tests for permission and workflow rules, integration tests for durable changes and connector behavior, and browser tests for critical staff journeys once a stack is selected. Documentation checks alone do not prove runtime behavior.

Use synthetic fixtures: two properties; multiple departments, outlets, floors and shifts; all nine profiles; approved combined profiles; inactive/expired accounts; scoped primary/backup contacts; guest cases with linked tasks; restricted incidents; and financial actors with separate approval, execution and reconciliation authority. Test values immediately below, equal to and above configured limits once Finance supplies them. Never use real guest data or card credentials.

## Required scenarios

| ID | Requirements | Scenario and expected result |
| --- | --- | --- |
| T-01 | REQ-01 | Exercise allowed and denied actions for every profile through UI and direct server requests; deny by default when no entitlement applies. |
| T-02 | REQ-01, REQ-12 | Attempt cross-property/department/outlet/floor/shift access through detail, search, report, attachment and export paths; return no unauthorized data. |
| T-03 | REQ-01, REQ-10 | Combine profiles, expire a grant, deactivate an account and change scopes during a session; enforce current grants without bypassing financial restrictions. |
| T-04 | REQ-02 | Create a case with several departmental tasks and link duplicates; retain original timing, ownership, evidence and guest-facing history. |
| T-05 | REQ-03 | Dispatcher assigns eligible staff; reject out-of-scope/ineligible assignment. Fulfiller sees essential assigned-task data and cannot reassign colleagues or retrieve full folios. |
| T-06 | REQ-03, REQ-04 | Accept, progress, block and complete a task; inspect/reopen incomplete work with corrective history. Reject unauthorized entry or unsafe-room release. |
| T-07 | REQ-05 | Advance a controlled clock through acknowledgement/completion deadlines, absent primary coverage and worker restart; escalate to approved primary/backup without timing reset or duplicate escalation. |
| T-08 | REQ-05, REQ-09 | Raise a serious/security case; initiate immediate designated routing without waiting for routine SLA deadlines. Surface delivery failure and preserve response history. |
| T-09 | REQ-06 | Hand over open linked work with next owner/action, ETA and backup; preserve unresolved obligations and original timestamps. Verify guest communication is limited to authorized senders/content. |
| T-10 | REQ-07 | Allow PMS operations only with explicit entitlement; verify identity workflow, room move and checkout revocation. Simulate delayed, failed and out-of-order external events without restoring obsolete guest access. |
| T-11 | REQ-08 | Request, independently approve, execute and reconcile an exception; retain reason, evidence and original reference. Reject self-approval, wrong property/currency/type and excess authority. |
| T-12 | REQ-08, REQ-11 | Simulate duplicate submission, provider timeout after success and repeated callback; prevent duplicate financial effect and show uncertainty until verified. |
| T-13 | REQ-09 | Security responder accesses assigned/relevant incident information; deny unrelated guest/folio/evidence access and protected evidence deletion. |
| T-14 | REQ-10 | Apply approved access/configuration changes, revoke temporary support access and record actor/approval/history; deny self-elevation and financial actions by admin status alone. |
| T-15 | REQ-11 | Disconnect PMS/POS/messaging; verify visible failure, controlled retry, accountable recovery and reconciliation. Restart processing without losing recorded work. |
| T-16 | REQ-12 | Compare scoped operational reports and approved revenue summaries against fixtures; reject/log unauthorized exports and sensitive-data overexposure. |
| T-17 | REQ-02, REQ-08 | Submit concurrent assignment, progress and approval changes; prevent silent overwrite and incompatible duplicate decisions. |
| T-18 | REQ-01, REQ-09, REQ-10 | Upload prohibited/oversized content and request another scope's attachment; reject safely. Verify protected audit/evidence cannot be altered through ordinary access. |

## Broader validation

- Accessibility/usability: keyboard-only critical journeys, focus behavior, labels, contrast, non-color statuses, phone layout, clear empty/error/conflict states and time-zone presentation.
- Security: session expiry/revocation, credential handling, object-level authorization, input handling, upload controls and sensitive-data masking. Select protocol-specific tests after stack/auth decisions.
- Resilience: crash between local mutation and outbound processing, failed notifications, unavailable identity provider, backup restoration and prolonged connector outages.
- Performance: realistic dispatch, task update, report and escalation workloads against approved capacity/latency targets. Targets remain pending; do not claim performance acceptance yet.

## Entry, exit and evidence

Before execution, approve workflow transitions, permission matrix, financial policies, SLA configuration, integration contracts and measurable service objectives. Use vendor sandboxes and controlled clocks where possible; never run financial failure tests against live guest transactions.

Release requires passing applicable critical journeys and all authorization/isolation/financial integrity tests, no unresolved critical security or data-integrity defects, verified restore procedures and named operational owners. Record build/environment, configuration, scenario results, failures and approved exceptions. Confirm emergency and handover behavior with Operations, financial controls with Finance, and access/recovery controls with IT. No tests have been executed against an application at this baseline.


## Stack-specific implementation supplement (2026-10-20)

For the suggested [stack](TECH_STACK.md), use Vitest for policy/domain rules, real PostgreSQL and Redis fixtures for transactional/job scenarios, and Playwright with accessibility checks for staff journeys. Verify composite property foreign keys reject invalid references, concurrent financial commands produce one logical execution, outbox redelivery is idempotent and queue loss can be recovered from database obligations.

Test migrations both from empty storage and from the preceding release. Validate the [ER model](ER_DIAGRAMS.md) against implemented migrations, including nullable relationships, unique keys and restricted history deletion. Verify OIDC callback/session handling, current grant revocation, webhook verification, private-object downloads and log redaction. Run these checks at the completion gates in [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md). They remain planned tests; no application tests have run.
