> Current implementation (2026-10-23): the original planning baseline below is preserved as history. The deployed client demonstration now implements the workflows described in [FEATURE_GUIDE.md](public-preview/FEATURE_GUIDE.md), with explicit sandbox/provider boundaries and verification evidence. Original statements such as “not started” refer to the document creation date, not the current app.

# Hotel Management App - Security Requirements

Status: Required controls and proposed design; not an implementation assurance | Updated: 2026-10-20

## Context and assets

Protect staff identity, guest/stay context, operational instructions, folios, financial approvals, security evidence, guest sessions, connector credentials and audit history. Requirements derive from [PRD.md](PRD.md) and the role-permissions reference. No application has been implemented or audited; this document is not a compliance certification or legal assessment.

## Identity and authorization

- Use individual staff accounts with approved profile grants, scope, manager, active status and expiry. Apply least privilege and deny access without an applicable entitlement.
- Enforce authorization on the server for every action and object, including searches, bulk operations, attachment URLs and exports. Do not trust client-selected property IDs, role names or hidden controls.
- Keep each permission tied to its approved scope; combining profiles must not accidentally combine one grant's action with another grant's unrelated scope.
- Enforce financial, sensitive-incident, PMS and export permissions separately. Executive title and platform administration confer no automatic operational or financial authority.
- Apply approved MFA and session policy. Reevaluate effective access after account/grant changes and revoke expired or deactivated access. Authentication provider, session lifetime and MFA rollout remain pending.
- Support approved, time-limited, attributable support access. Prohibit self-approved elevation and silent guest impersonation.

## Financial and safety boundaries

Check amount, currency, reason, transaction type, property, evidence and delegated authority against the specific proposed action. Bind execution to the approved transaction/action; changes require renewed validation and approval as applicable. Prevent sensitive self-approval even for users holding multiple profiles. Preserve independent reconciliation evidence and original payment references.

Do not expose or store raw card credentials. Use the selected payment provider's approved token/reference mechanism once defined. Never record secrets or card details in notes, logs or attachments.

Safety restrictions remain effective for supervisors and executives. Security incidents use the approved emergency plan and restricted responder access. Evidence preservation, access, retention and exceptional disclosure require approved procedures; ordinary users must not delete evidence or protected logs.

## Guest sessions and data handling

QR mappings identify context, not proof of a current guest's entitlement. Identity verification and authorized stay/session association are required. Room moves and checkout invalidate affected access, and revocation failure must remain visible until resolved. Specific guest authentication and offline behavior require design approval.

Minimize guest details shown to fulfillers and responders. Separate ordinary operational records from sensitive incidents and financial details. Apply explicit authorization to export and attachment retrieval; use masked information where possible. Approve data retention and deletion schedules by record class, including protected evidence, before production; no durations are assumed here.

## Application and infrastructure controls

- Encrypt network traffic and sensitive stored data using the selected platform's supported controls; restrict key/secret access and define rotation procedures.
- Validate inputs and parameterize data access. Apply framework-appropriate protections against injection, cross-site scripting, request forgery and session abuse after the stack is selected.
- Restrict attachment type/size, validate actual content, quarantine or scan as appropriate, and prevent executable or unauthorized public delivery. Exact policy remains pending.
- Authenticate connector traffic and callbacks, protect credentials and validate event scope, freshness and duplicate handling according to vendor contracts.
- Protect audit records from ordinary modification/deletion; capture actor, action, target, time, outcome and applicable approval/correlation without unnecessary sensitive payloads.
- Separate production access from routine development, use synthetic test data, review dependencies and test backup restoration. Hosting, incident tooling and environment boundaries remain decisions.

## Threat-driven verification

| Threat | Required defense and verification |
| --- | --- |
| Guessing another property's record/attachment identifier | Object-level scope checks across retrieval, mutation, search and export; T-01/T-02 |
| Combining profiles to gain excess authority | Scope-bound grants and independent action constraints; T-03/T-11 |
| Reusing a room QR/session after departure | Verified stay association and lifecycle revocation; T-10 |
| Duplicate refund or ambiguous payment retry | Bound approval, duplicate prevention and independent outcome verification; T-11/T-12 |
| Privileged insider altering evidence or access | Approved access changes, restricted evidence and protected audit history; T-13/T-14/T-18 |
| Connector outage hiding failed operations | Explicit uncertainty, controlled retry and reconciliation; T-15 |

Full scenarios appear in [TEST_PLAN.md](TEST_PLAN.md).

## Operational ownership and response

Operations approves ownership, coverage and emergency routing; Finance approves transaction controls; IT implements and validates access/configuration. Define named incident contacts, escalation paths, containment authority and communication procedures before release. Suspected compromise should trigger access containment, credential/session revocation where appropriate, evidence preservation and verified recovery under the approved response plan. Do not put secrets, real guest records or security evidence in this repository.


## Suggested stack control mapping (2026-10-20)

The [stack recommendation](TECH_STACK.md) maps identity to OIDC, business authorization to shared server domain policies, persistence to PostgreSQL/Drizzle, asynchronous processing to BullMQ/Redis and attachments to private object storage. Use server-managed Secure/HttpOnly session cookies, appropriate CSRF protection and current grant checks. Do not cache protected Next.js responses across users or properties.

Redis jobs do not establish authority or durable financial truth. Recheck domain conditions when executing delayed work and recover obligations from PostgreSQL. Restrict database roles, keep secrets outside connector rows and ensure signed download access is short-lived. Optional database row security requires a separate tested pooling/context design. The [ER model](ER_DIAGRAMS.md) and [implementation guide](IMPLEMENTATION_GUIDE.md) describe proposed constraints and processing controls; no security control is claimed to be deployed.
