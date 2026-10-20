# Hotel Management App - Product Requirements

Status: Proposed product baseline | Updated: 2026-10-20 | Implementation: not started

## Purpose and sources

Coordinate hotel service delivery through accountable guest cases, departmental tasks and controlled staff access. Success means staff can deliver services, communicate progress and hand over work without losing ownership or exceeding their authority.

The reference is *Hotel Management App: Role Structure and Permissions*, supplied as `C:\Users\chinm\Downloads\hotel_management_app_role_structure_and_permissions.pdf` (12 pages). It defines operational requirements, not executable instructions. This repository was empty when these documents were created; no described capability is claimed to exist.

Related: [architecture](ARCHITECTURE.md), [interaction design](DESIGN.md), [tests](TEST_PLAN.md), [security](SECURITY.md), [decisions](DECISIONS.md), [project memory](MEMORY.md).

## Goals and success criteria

- Every active case has an accountable owner; every operational task has an assignee or an explicitly visible unassigned state, priority, timing targets and history.
- Guest-facing cases retain linked departmental work and communication through resolution and shift changes.
- Authorization enforces approved profiles, scopes and action-specific limits on the server.
- Approval, financial execution and reconciliation are separately controlled and traceable.
- Critical incidents reach designated responders immediately without waiting for routine SLA escalation.

Acceptance requires all critical scenarios in TEST_PLAN.md to pass. Production service targets, adoption targets and measurement periods require Operations approval; no numeric targets have been established.

## Users and reusable profiles

An employee may hold multiple approved profiles. A profile is a permission bundle, not a job title or unrestricted seniority level. Each grant has applicable property, department, outlet, floor and shift scope, plus expiry where required.

| Profile | Intended capabilities | Key boundary |
| --- | --- | --- |
| Task fulfiller | View essential assigned work; accept; record progress, confirmation, notes and approved attachments; report blockers | No colleague reassignment, full folios, refunds or safety override |
| Department dispatcher | View scoped queues and availability; create, categorize, assign and schedule tasks; link duplicates/subtasks; send approved updates | No compensation, price overrides or concealment of delays |
| Department supervisor | Reassign; arrange backup; inspect; reopen incomplete work; record corrective action and handover | PMS room status requires separate entitlement; no unrestricted refunds or unsafe-room release |
| Department manager | Review department performance; manage coverage; resolve complaints; approve recovery within delegated limits; propose controlled rule changes | No automatic administration, unrestricted finance or incident access |
| Front Desk coordinator | Capture and coordinate guest cases; use separately authorized PMS workflows; coordinate maintenance, room moves and guest-session changes | Identity checks and separate financial permissions still apply |
| Financial operator | Entitled folio/payment operations, approved adjustments, reconciliation, receivables and financial exceptions | Individual authorizations, delegated limits, no raw card credentials or sensitive self-approval |
| Security responder | Receive relevant alerts; acknowledge/attend; request backup; record actions and preserve evidence | No unrelated guest/folio access, evidence deletion or compensation authority |
| Executive viewer / approver | Review authorized summaries; coordinate serious cases; approve within delegated authority; review policies/access | Title grants no automatic admin, raw payment data or safety bypass |
| Platform administrator | Apply approved access/configuration; maintain integrations, MFA/session settings, backups and recovery | No financial authority, self-approved elevation, silent impersonation or protected-log deletion |

## Functional requirements

| ID | Requirement and acceptance outcome | PDF pages |
| --- | --- | --- |
| REQ-01 | Individual staff accounts support approved multi-profile grants, manager, active status, scope, shift and expiry. Server checks reject unauthorized actions and data access. | 1, 10, 12 |
| REQ-02 | A guest-facing case links departmental tasks, requests and updates. Each request records owner, assignee state, priority, SLA targets and history; linking duplicates preserves original timestamps and evidence. | 1, 3, 6, 11 |
| REQ-03 | Eligible staff can be assigned within scope; fulfillers see only necessary assigned-task details and record acceptance, In Progress, On the Way, Completed or Blocked as applicable. | 2-4 |
| REQ-04 | Supervisors can inspect, reopen and assign corrective work. Restricted entry and unsafe-room controls remain effective regardless of profile. | 2, 4 |
| REQ-05 | Categories define acknowledgement/completion targets, escalation deadlines and primary/backup contacts. Routine escalation follows supervisor, manager, then designated hotel management for serious, unowned or cross-department cases; beyond-authority decisions reach GM. | 1, 11-12 |
| REQ-06 | Front Desk or designated case owner maintains approved guest communication and records open work, next owner/action, ETA and backup at handover. | 3, 6, 11 |
| REQ-07 | Authorized PMS functions support reservation coordination, registration, room readiness, check-in/keys, checkout and room moves. Identity verification and room-move/departure session revocation are required; PMS permissions are explicit. | 4, 6, 10 |
| REQ-08 | Financial operations enforce entitlement, property, amount/currency, reason, transaction type, evidence and delegated approval. Sensitive self-approval is prevented; approval, execution and independent reconciliation are recorded separately with original payment references. | 6-7, 9, 11-12 |
| REQ-09 | Security incidents immediately alert designated Security/management under the emergency plan. Response actions and restricted evidence are preserved; unrelated users cannot retrieve them. | 8, 11-12 |
| REQ-10 | Administrators apply approved account, scope, session, QR mapping and configuration changes with audit history; support access is approved, temporary and reviewable. | 10, 12 |
| REQ-11 | Integration failures are visible and support controlled retries, duplicate prevention and verification of outcomes. Payment/PMS/POS truth is reconciled with its authoritative external system. | 3, 7, 10, 12 |
| REQ-12 | Department and executive views expose authorized operational metrics and approved revenue summaries. Sensitive exports require explicit permission and logging. | 5, 7, 9, 12 |

## Principal journeys

1. Front Desk captures a guest request, chooses an accountable department and records priority; the dispatcher assigns eligible staff. Staff accept and deliver; the case owner communicates progress and closes the case after linked work is resolved.
2. A blocked maintenance task retains its original timing. Front Desk coordinates the maintenance owner/vendor and ETA; unresolved or cross-department failures escalate to hotel management, with room moves controlled by Front Office authority.
3. Front Desk initiates a duplicate-charge dispute. A delegated approver authorizes an eligible correction, an entitled operator executes it and Finance verifies settlement.
4. A supervisor hands over open work with the next owner, action, ETA and backup. The receiving shift can see unresolved obligations and escalation history.

## Boundaries and dependencies

The initial specification covers staff operations and guest-session lifecycle coordination. A complete guest-facing portal, booking engine, payroll, inventory procurement and replacement PMS/POS/payment systems are not established requirements. QR mapping and session revocation are required capabilities, but guest login/channel design remains pending.

External PMS, POS, payment and messaging capabilities depend on selected vendors and approved contracts. Monetary thresholds, currencies, SLAs, emergency procedures, room-clearance authority, retention and deployment targets remain business decisions in DECISIONS.md.

## Non-functional requirements

Authorization must apply consistently to screens, APIs, attachments, searches and exports. Changes affecting ownership, permissions, evidence or money must be traceable. Concurrent updates must not silently overwrite operational decisions. Failures must preserve recorded work and expose uncertain external outcomes. Interfaces must support accessible keyboard operation, clear status labels and usable layouts on staff phones and desktop workstations. Availability, latency, recovery and capacity targets must be agreed before release.


## Technical planning supplement (2026-10-20)

The original requirements above remain unchanged. A suggested implementation stack is now documented in [TECH_STACK.md](TECH_STACK.md), with a phased [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) and proposed [ER_DIAGRAMS.md](ER_DIAGRAMS.md). These are recommendations, not selected vendors, approved business policies or implemented features. The technology choices described above as pending remain pending formal acceptance.
