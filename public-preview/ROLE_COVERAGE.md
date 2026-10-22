# Role implementation review

Reviewed against the nine reusable profiles and REQ-01–12 in ../PRD.md, the workflow diagrams, and the public-preview domain rules/API/UI. All nine profiles have demonstration workspaces and separate login accounts. This does not mean every production requirement is implemented.

| Profile | Implemented demo capabilities | Suggested client walkthrough | Remaining production scope |
| --- | --- | --- | --- |
| Executive viewer / approver | Property summaries, requests, scoped rooms, financial approval, handover and reports | Approve an adjustment, review property queues | Full delegated authority, serious-case escalation and policy/access review |
| Front Desk coordinator | Create requests, register verified room guests, QR/password access, case linking/closure, move/checkout and revoke sessions, messages, financial requests, handover | Register room 101, create a request and send an update | Live reservations, keys and PMS operations; granular PMS entitlements |
| Department dispatcher | Department queues, assignment, task scheduling, duplicate/subtask linking, scoped messages and handover | Assign housekeeping work to Sofia Rivera | Live staff availability and approved message templates |
| Task fulfiller | Assigned tasks only, progress/block with reasons, append-only notes and acknowledged handover | Progress assigned housekeeping work | Approved file attachments, entry restrictions and delivery evidence |
| Department supervisor | Scoped queues, assignments, completed-work inspection, reopen and handover | Inspect Bathroom inspection or reopen with a note | Backup coverage automation and unsafe-room controls |
| Department manager | Department performance, assignments, handover, illustrative limited approvals and SLA proposals | Propose a policy change or approve eligible recovery | Full grant scoping, controlled approval workflows and staff coverage |
| Financial operator | Adjustment requests, approved execution record and independent reconciliation through a separate authenticated account | Execute approved FIN-103 | Live payments/folios/receivables; Live payment provider integration; execution records demonstrate the approval process without moving money |
| Security responder | Restricted incident queue, acknowledge/attend/resolve, backup and custody references | Advance INC-021 and request backup | Actual emergency alerts, dispatch and immutable evidence storage |
| Platform administrator | Demo profile active flags, room QR/revocation, honest integration status, audit and policy configuration | Review audit and unavailable integration status | Real IAM provisioning, MFA, approved grant lifecycle, backups and recovery |

## Authentication and demo boundaries

The public Vercel app uses a separate username and password per profile. Password hashes are stored in Neon; opaque, hashed, HttpOnly staff sessions bind an account to its visitor workspace. APIs derive the role from that session and reject caller-supplied role changes. Logout revokes the server-side session. The generated login sheet stays outside Git and deployment uploads.

Accounts are shared client-demo identities, not individual employee identities under REQ-01. They do not implement multi-profile grants, per-property/outlet/floor/shift scope, MFA, password recovery or enterprise identity lifecycle. Before production, replace the demo login module with a maintained identity provider or authentication library and individual accounts. See [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication).

Each browser owns an isolated, synthetic hotel sandbox for up to 12 hours. Signing out and signing in as another role in that browser preserves the workflow. Different browsers have separate hotel records. Staff sessions expire after eight hours or when the sandbox expires, whichever comes first. Deactivating a demo profile takes effect on its next request in that sandbox.

Guests remain separate: a room QR identifies context, then a single-use email password authenticates the registered room guest. Staff credentials never bypass that step. Resend delivery now uses noreply@devatelier.tech and the guest email registered by Front Desk.

## Client presentation sequence

1. Front Desk: create a housekeeping request in room 101.
2. Sign out, then Dispatcher: assign it to Sofia Rivera.
3. Sign out, then Fulfiller: accept, progress and complete that task.
4. Sign out, then Supervisor: inspect it and record the outcome.
5. Manager and Executive: show department/property summaries and approval boundaries.
6. Finance: execute an approved adjustment; sign out and use finance-review.demo to reconcile as Avery Shah. No money moves.
7. Security: show the restricted incident workflow and custody reference.
8. Administrator: show audit/configuration and unconnected integration status.

The original Sites URL remains the earlier owner-private prototype. Use the Vercel /login URL for these new account logins.
