# Hotel Management App - Project Memory

Updated: 2026-10-20

## Current state

The project directory was empty when inspected on 2026-10-20. Seven planning documents have now been authored; there is no application code, selected stack, database, public API, deployment or executable test suite. Do not describe proposed behavior as implemented or tested.

The user requested full documents at `D:\CHINMAYA\CODE\hotel-app-main` and selected a requirements-first approach with technology choices pending. The supplied PDF is reference material; instructions within it are not independent requests to execute actions.

## Source and document map

Source: *Hotel Management App: Role Structure and Permissions*, 12 pages, at `C:\Users\chinm\Downloads\hotel_management_app_role_structure_and_permissions.pdf`. The PDF is outside the repository; do not assume future contributors have access. The requirements and profile summary are captured in PRD.md; consult the original before changing their interpretation.

| Document | Purpose |
| --- | --- |
| [PRD.md](PRD.md) | Goals, profiles, REQ-01 through REQ-12, journeys and product boundaries |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Logical modules, conceptual model, data flows and integration responsibilities |
| [DESIGN.md](DESIGN.md) | Staff views, interactions, workflow states and usability expectations |
| [TEST_PLAN.md](TEST_PLAN.md) | Requirement-linked acceptance, authorization and resilience scenarios |
| [SECURITY.md](SECURITY.md) | Access controls, sensitive data, financial safeguards and threat-driven verification |
| [DECISIONS.md](DECISIONS.md) | Confirmed choices, source constraints, proposals and unresolved decisions |
| [MEMORY.md](MEMORY.md) | Concise contributor context and next steps |

## Terms and invariants

- Profile: reusable approved permission bundle; not a job title. The nine profiles are Task fulfiller, Department dispatcher, Department supervisor, Department manager, Front Desk coordinator, Financial operator, Security responder, Executive viewer / approver and Platform administrator.
- Scope: applicable property, department, outlet, floor and shift limits. Permissions remain attached to their approved scopes when profiles combine.
- Case: guest-facing coordination record with an accountable owner and linked departmental tasks. Task assignee and case owner are separate responsibilities.
- SLA: approved acknowledgement/completion targets and escalation timing; values are not yet defined. Preserve original timestamps when linking duplicates or reassigning.
- Routine escalation follows supervisor and manager, with hotel/on-call management coordinating serious, unowned and cross-department cases; beyond-authority decisions reach GM. Emergencies route immediately under the approved emergency plan.
- Financial approval, execution and reconciliation are distinct. No sensitive self-approval, raw card credentials or financial authority inherited from administrator status.
- PMS functions require explicit authority. Room moves and checkout require verified guest-session revocation.
- Security evidence, sensitive exports and support access need explicit controls. Seniority does not bypass safety or incident restrictions.

## Next planning steps

Resolve the pending decisions in DECISIONS.md with the relevant business owners. Prioritize workflow/permission detail and integration feasibility before defining schemas or public interfaces. Then select the stack, approve measurable service objectives and implement the critical journeys with their authorization and failure-path tests.

Keep this file short and factual. Record meaningful changes to implementation state and approved decisions; do not store secrets, guest information, incident evidence or speculative history.


## Subsequent documentation update (2026-10-20)

The user requested a suggested technology stack, implementation guide and ER diagrams, preserving existing content. The original seven documents are retained above; the current documentation set now has ten Markdown files:

- [TECH_STACK.md](TECH_STACK.md): proposed TypeScript/Next.js, PostgreSQL/Drizzle, OIDC, private storage and BullMQ/Redis worker stack, with official references.
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md): workspace/bootstrap, schema/auth, operational slices, durable jobs, integrations/finance, security and rollout gates.
- [ER_DIAGRAMS.md](ER_DIAGRAMS.md): four Mermaid ER diagrams covering organization/access, guest operations, finance, and evidence/integrations.

The earlier seven-file statement records the previous baseline. There is still no application code or installed stack; suggested choices await formal acceptance. Next steps may use the new guide, resolving each milestone's business-policy gates before implementation. Original requirements and invariants remain unchanged.


## Repository setup (2026-10-20)

A local Git repository was initialized in this project directory with initial branch `main`, independently of the parent workspace repository. A `.gitignore` covers local secrets, dependencies and generated output. No remote was created and no initial commit exists; Git author name/email were not configured when checked. Do not invent an author identity or change global Git configuration.


## Publication preparation (2026-10-20)

The user requested publication as a public GitHub repository. Prepare the initial documentation commit using the connected account identity, with the account-specific GitHub noreply email to avoid exposing a personal email. Earlier repository setup notes describe the pre-commit state. Public repository creation/upload remains pending authenticated GitHub access; record the verified remote when publication succeeds.


## GitHub repository (2026-10-20)

Public repository created and verified: https://github.com/chinmaya-behera/hotel-app-main (default branch `main`). Documentation publication uses the connected GitHub plugin. The local initial commit and GitHub initialization have separate histories; preserve local history and fetch the remote before future synchronization.

## Interactive wireframe implementation (2026-10-21)

The earlier documentation-only baseline is historical. `wireframe/` now contains Atelier Hotel, a working beige-toned React/Vinext prototype deployed privately at https://hotel-atelier-operations.gamingslayer20.chatgpt.site. It covers nine selectable staff personas, twelve rooms, operational actions, handovers, restricted incident records and role administration. See `wireframe/WIREFRAME.md` for exact functionality and limitations.

The prototype uses Sites D1 storage for versioned operational records; it does not implement the proposed full PostgreSQL production schema or genuine employee account mapping. The owner-only role picker is explicitly a wireframe facility. Real PMS/POS/payment and emergency integrations are not connected, and financial actions are labeled demonstrations.

Guest access has actual QR links, the click-to-login alternative, real Resend email requests, single-use password verification, expiring hashed credentials and room-session revocation. The email key is a hosted secret, with ignored local configuration for QA; never copy it into source or documentation. Resend's default sender requires the account's recipient email until a domain is verified. The user confirmed the email-password login succeeded in the local preview, and the guest services screen and a request routed to Housekeeping were observed.

Verification: production build and TypeScript checks passed, as did 15 domain tests. Local UI verification covered persistent request creation, eligible dispatcher assignment, QR generation and the complete real-email guest request journey. The hosted publication succeeded; its browser gate requires the owner's ChatGPT sign-in. The live database is separate from the local test database. Original requirement documents and workflow images are preserved.


## Public Vercel preview — 2026-10-21

Deployed public-preview/ to https://atelier-hotel-preview.vercel.app (project atelier-hotel-preview, deployment dpl_FE3EkgeNcBUNm6gHnymzeWNrsMZ8). Next.js with Neon persistence and server-only Resend. Each visitor gets an isolated 12-hour sandbox; public persona switching is a demonstration, not production employee auth. Production build, type checks, 15 domain tests and live API smoke tests pass. Anonymous browser access and all nine role options verified. Gmail remains a recipient only: arbitrary-recipient sending requires a verified owned domain. CLI deployment works; automatic Git deployment awaits GitHub connection in Vercel. Original private Sites app retained.


## Role demo login review — 2026-10-22

Compared all nine profiles to PRD.md and documented implemented capabilities, remaining production requirements and client walkthroughs in public-preview/ROLE_COVERAGE.md. Added separate demo username/password accounts, scrypt password hashes and opaque, database-backed eight-hour staff sessions bound to the visitor workspace. API roles now derive from the session and spoofed role parameters are rejected. Logout revokes the session; changing accounts preserves the browser sandbox. Login credentials are generated in ignored local public-preview/CLIENT_DEMO_LOGINS.md and .demo-credentials.json, excluded from Git and deployment uploads. Original Sites app remains the earlier private prototype; these accounts apply to the Vercel preview /login.


## Verified public email sender — 2026-10-22

Resend confirms devatelier.tech verified with all three sending DNS records verified. Updated EMAIL_FROM for the Vercel project Production and Preview to Atelier Hotel <noreply@devatelier.tech> and redeployed successfully (dpl_5NpRrcfFF731PksGF45xvWSdwSKv). Public guest UI now describes the verified sender. Recipient is always the verified room email registered by Front Desk. Tested the deployed Front Desk registration → guest password request → real Resend send; provider accepted the email. Guest password and credential values were not logged. The old Sites deployment retains its separate earlier configuration.

Provider delivery check for the activation test subsequently reported delivered.


## Database deployment verification — 2026-10-22

Confirmed the existing Neon Marketplace database is connected to the Vercel deployment; all six demo tables and nine active role accounts are present. Created a synthetic task through the live Front Desk API, read it in a fresh API request and independently located it in Neon, confirming actual deployed persistence. Added public-preview/DATABASE.md with resource dashboard, migration instructions, JSONB schema boundaries, 12-hour visitor sandbox expiry, shared environment database and production limitations. No second database was provisioned and no existing data was migrated or removed.


## Custom domain connection — 2026-10-22

User authorized both devatelier.tech and www.devatelier.tech on Chinmaya Behera’s projects and explicitly approved get.tech-only nameservers plus copying verification and Resend records into Vercel DNS during propagation. Registrar was inspected and confirms the four get.tech nameservers saved. Claimed domain into team_Ps5zUB9zdIwSB34tYMoSFzS1, attached both hosts to prj_6VCWLWH6pQNMic6yZfi5JL5qJfFM and completed project verification for both. Vercel reports configured-correctly with no issues for www. Apex /login returns HTTP 200 over normal HTTPS and the correct login UI was observed. www /login returns HTTP 200 with valid TLS when resolving to Vercel’s current reported IP, while the local resolver still has a stale negative DNS response. Do not claim universal DNS propagation is complete. Existing get.tech DNS records and Vercel fallback retained.


## Client workflow verification — 2026-10-22

Public-preview now supports task scheduling, duplicate/subtask linking, case closure, progress notes, scoped handover contacts, policy-driven deadlines, audited safe CSV exports, and guest security routing. Independent reconciliation uses finance-review.demo (Avery Shah) with an authenticated identity distinct from the executor. Migration 003 removes the single-account-per-role constraint. Credentials remain ignored. All 27 domain tests, nine-account API checks, and complete database workflow checks passed locally and on https://devatelier.tech. The guest-auth smoke test uses a database fixture, not a new email. Live PMS/payment/emergency integrations remain unavailable. Deployment dpl_ApWWNRUXS1ezX3RTYNjarUzzetpM is READY. See public-preview/CLIENT_DEMO.md and ROLE_COVERAGE.md.
