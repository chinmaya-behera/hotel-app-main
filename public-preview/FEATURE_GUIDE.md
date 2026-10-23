# Feature guide and client demonstration

Updated: 2026-10-23 (Asia/Kolkata). Open https://devatelier.tech/features after signing in. Return to https://devatelier.tech/ for the original hotel screens.

## Scope and setup

Each repository business workflow has an interactive demonstration or an existing hotel-screen journey below. Architecture/stack recommendations are engineering plans, not additional guest features. Real provider integration and production release gates are distinguished from these exercises.

Use the private CLIENT_DEMO_LOGINS.md sheet. Nine role profiles plus finance-review.demo are available. Access grants target the individual username; elevating finance.demo does not also elevate finance-review.demo. Keep the same browser and sign out between profiles to retain the same isolated synthetic hotel. A different browser owns separate records. Workspaces expire after 12 hours; staff sessions last at most eight hours or the approved shorter duration on new sign-ins. Credentials stay outside Git and deployment uploads.

The Main hotel contains twelve rooms. Annex adds A101 (floor 1 / Day) and A201 (floor 2 / Night). A selected Annex grant cannot retrieve Main property records. Profile and scope are bound together on the server. Expired or revoked additional grants return to the base role.

## Every feature and how to use it

### REQ-01 — Individual role accounts

- **Role:** All roles
- **Where:** Hotel → Sign in
- **How:** Use the private login sheet. Sign out between accounts in the same browser to preserve the shared demonstration.

### REQ-01 — Approved multiple profiles and scopes

- **Role:** Manager → Executive → Administrator → recipient
- **Where:** Access
- **How:** Request an additional profile with property, outlet, floor, shift and expiry. Another actor approves, Admin applies, and the recipient selects it. Hotel API reads and writes use that selected grant.

### REQ-01 — Inactive and expired access

- **Role:** Administrator
- **Where:** Access / Hotel → Access & roles
- **How:** Revoke a grant or deactivate a profile; the next server request reevaluates access. Expired extra profiles return to the account’s base role.

### REQ-02 — Cases, priorities, ownership and linked tasks

- **Role:** Front Desk / Dispatcher
- **Where:** Hotel → Requests
- **How:** Create requests; open a task to link duplicates or subtasks in the same room. Original capture times remain unchanged. Close only after nonduplicate work is resolved.

### REQ-03 — Assignment, progress, blockers and notes

- **Role:** Dispatcher → Fulfiller
- **Where:** Hotel → Requests / My tasks
- **How:** Assign active available staff. Accept, progress, block with a reason, resume and complete; every step enters history.

### REQ-03 — Task scheduling and staff coverage

- **Role:** Dispatcher / Supervisor / Manager
- **Where:** Coverage & SLA
- **How:** Set availability, shift and backup, then assign in Hotel. Unavailable or Night-shift staff cannot receive Day-shift work.

### REQ-04 — Inspection, correction and reopening

- **Role:** Supervisor
- **Where:** Hotel → Inspections
- **How:** Open completed work; record a passed inspection or reopen with corrective instructions.

### REQ-04 — Restricted entry, unsafe rooms and readiness

- **Role:** Front Desk / Supervisor / Security
- **Where:** Rooms & safety
- **How:** Apply Do not enter; the task API blocks entry progress. Security marks/clears unsafe rooms; supervisors cannot release an occupied, unsafe or restricted room.

### REQ-05 — Category targets and primary/backup contacts

- **Role:** Manager / Administrator
- **Where:** Hotel → Service policies
- **How:** Propose and apply target changes. New requests use the updated targets; old task timestamps stay intact.

### REQ-05 — Durable escalation, backup and serious-case routing

- **Role:** Dispatcher / Supervisor / Manager / Executive
- **Where:** Coverage & SLA
- **How:** Advance the demonstration clock and scan due work. Levels reach supervisor/backup, manager and hotel management. Repeated scans deduplicate the same task/level. Persisted obligations survive reload.

### REQ-06 — Approved guest updates

- **Role:** Front Desk / Dispatcher
- **Where:** Coverage & SLA / Hotel → Guest messages
- **How:** Choose an approved template and room; the authenticated room guest sees the update. Delays require a next-update time.

### REQ-06 — Accountable handover and receiving acknowledgement

- **Role:** Operational roles
- **Where:** Hotel → Handover
- **How:** Record open work, next owner, distinct backup, next action and ETA. Only the named receiving owner can acknowledge.

### REQ-07 — Reservation coordination, readiness and check-in

- **Role:** Front Desk
- **Where:** Rooms & safety
- **How:** Create a sandbox reservation for an available room. Verify identity and check in. A failed PMS operation remains visible and can be retried with the same key.

### REQ-07 — Keys, checkout and stale lifecycle events

- **Role:** Front Desk
- **Where:** Rooms & safety / Integrations
- **How:** Issue a sandbox key after check-in. Checkout revokes the key and actual demo guest sessions. Replaying a stale callback never restores a guest entitlement. No physical lock is operated.

### REQ-07 — Verified room guest, QR and email password

- **Role:** Front Desk → Guest
- **Where:** Hotel → Rooms & guests
- **How:** Register name/email after identity verification. Open room QR, scan or click login, request an actual email password and verify it. The Main property has twelve rooms; Annex adds two scope-testing fixtures.

### REQ-07 — Room move and session revocation

- **Role:** Front Desk / Administrator
- **Where:** Hotel → Rooms & guests / Rooms & QR
- **How:** Move to an available room, checkout or revoke. Prior guest codes and sessions are removed atomically.

### REQ-08 — Folio adjustments, refunds and receivables

- **Role:** Finance
- **Where:** Finance
- **How:** Record exact amount, USD/INR, type, reason, original reference and evidence. The sandbox adapter does not create a replacement accounting ledger.

### REQ-08 — Delegated approval and independent reconciliation

- **Role:** Executive → Finance → Finance reviewer
- **Where:** Finance
- **How:** Approve a bound request, execute as Finance and reconcile as finance-review.demo. Self-approval and self-reconciliation are rejected. Limits and currencies shown are illustrative.

### REQ-08 — Uncertain payments and duplicate prevention

- **Role:** Finance
- **Where:** Finance / Integrations
- **How:** Execute with Timeout after success. Retry is blocked until provider verification. Repeated commands reuse one provider key and create one synthetic effect.

### REQ-09 — Immediate emergency routing and delivery failures

- **Role:** Security
- **Where:** Rooms & safety
- **How:** Create an incident; Security and management sandbox inbox entries appear immediately. Offline Emergency adapter shows failure and allows a controlled retry. This never calls real emergency responders.

### REQ-09 — Response, backup and evidence custody

- **Role:** Security
- **Where:** Hotel → Incidents / Evidence
- **How:** Acknowledge, attend, request backup and resolve. Append references or private text evidence. Ordinary roles cannot retrieve incident evidence.

### REQ-10 — Independent configuration approval

- **Role:** Manager / Admin → Executive → Admin
- **Where:** Configuration
- **How:** Propose session duration or export policy, approve independently and apply. Exports obey the applied policy; newly created sessions obey the selected lifetime.

### REQ-10 — MFA policy demonstration

- **Role:** All roles / Administrator
- **Where:** Configuration
- **How:** The labelled exercise verifies a one-use code and gates feature changes for five minutes when required. It is a workflow simulation, not an independent second authentication factor.

### REQ-10 — Temporary, approved support access

- **Role:** Manager → Executive → Admin → recipient
- **Where:** Access
- **How:** Request a read-only support grant. Approved recipients can inspect aggregate diagnostics until expiry; no impersonation, folio or evidence access is granted.

### REQ-10 — Private backups and restore verification

- **Role:** Administrator
- **Where:** Recovery
- **How:** Save an operational recovery point; restore into a detached drill copy and validate room/task references. Active records, protected history and revoked sessions cannot be rolled back.

### REQ-11 — PMS/POS/payment/messaging/emergency adapters

- **Role:** Administrator / authorized operators
- **Where:** Integrations
- **How:** Toggle a sandbox provider offline, submit work, inspect its failed outcome, bring it online and retry. Online means simulated provider availability, not a live connection.

### REQ-11 — Outcomes, retries, callbacks and source revisions

- **Role:** Authorized operators
- **Where:** Integrations
- **How:** Verify uncertain outcomes, ignore stale or duplicate callbacks, and reject reusing a key with different request content. Pending operations persist across refresh.

### REQ-12 — Scoped metrics, summaries and export permission

- **Role:** Manager / Executive / Finance
- **Where:** Hotel → Reports
- **How:** Inspect scoped operational metrics and financial exceptions. Finance syncs monetary sandbox POS receipts, Executive publishes approved revenue snapshots by currency in Finance, and permitted accounts can review them. Exports are scoped and audited; live revenue is not fabricated.

### REQ-12 — Private attachments, controlled download and immutable history

- **Role:** Fulfiller / Supervisor / Manager / Security
- **Where:** Evidence / Hotel → Audit trail
- **How:** Upload a synthetic plain .txt file (3,000 characters maximum). Server validates content and computes SHA-256; authorized download rechecks current scope. No evidence/audit delete action exists.

### Cross-cutting — Concurrency, errors, expired sessions and isolation

- **Role:** All roles
- **Where:** All forms
- **How:** Every mutation carries a database version. Conflicting changes require refresh. Visitors have separate synthetic workspaces; session expiry and sign-out remove access.

### Cross-cutting — Accessible desktop/mobile beige interface

- **Role:** All roles
- **Where:** All workspaces
- **How:** Use labeled controls, keyboard focus and responsive layouts. Status text accompanies muted colors. No purple styling or bright category colors are used.

## Presentation sequence for the extended workflows

1. **Access:** Manager requests Dispatcher for frontdesk, Main / Rooms / floor 1 / Day / 30 minutes. Executive approves; Admin applies. Front Desk selects the grant and returns to Hotel: the identity stays Emma Wilson, profile becomes Dispatcher, and floor 2 writes are denied. Select base profile to resume Front Desk. Repeat with Annex floor 2 / Night to show A201 only. Admin can revoke; grants expire on real time.
2. **Support:** Request a grant with read-only support enabled. Executive approves and Admin applies. Its recipient can read aggregate diagnostics until expiry; no impersonation, guest identity, incident evidence or folio access is granted.
3. **Coverage:** Dispatcher marks Sofia unavailable, then attempts an assignment in Hotel: it fails. Restore Day availability and assign. A Night worker cannot receive Day work. Schedule with a reason. Fulfiller records progress/blockers and Supervisor inspects/reopens.
4. **Safety:** Security marks room 101 unsafe. Task entry progress and PMS occupancy are blocked. Only Security can clear after recording independent verification. Supervisor may release a cleaned, unoccupied, unrestricted room after inspection. Do not enter and Contact-free are separate entry instructions.
5. **Escalation:** Dispatcher advances the controlled clock and scans. Original deadlines remain; repeated task/level scans do not duplicate delivery. Admin sets Messaging offline to show failed delivery, restores it, and the authorized operator retries. The simulation clock does not affect passwords or grant expiry.
6. **Handover:** In Hotel, create a handover with linked case, next owner, distinct backup, next action and ETA. The receiving owner alone acknowledges and accepts case ownership. Front Desk closes only after nonduplicate work resolves. Use approved templates for guest updates; delays require the next-update time.
7. **PMS:** Front Desk reserves available room 106, verifies identity, checks in, then issues a sandbox key. Admin can take PMS offline before check-in to show a failed operation. After recovery, Front Desk retries the same key. Checkout clears the synthetic key and actual demo guest entitlement. Duplicate/stale callbacks cannot revive departed stays.
8. **Guest email:** Use Hotel → Rooms & guests, register a current guest email after identity checks, open QR, scan/click login, and request a real one-use email password. Verify it in the room portal. Moves, checkout and revocation remove prior codes/sessions atomically. Sender remains the configured verified Resend domain.
9. **Finance:** Finance requests an exact USD/INR Refund, Folio adjustment or Receivable, with original reference, evidence and reason. Executive approves; Finance chooses Timeout after success. Blind retry is rejected until Integrations → Verify provider outcome. A repeated command/callback keeps one synthetic effect. Sign in as finance-review.demo to reconcile; the executor cannot reconcile its own record. Admin has no financial authority.
10. **POS:** Finance submits a sandbox POS operation twice using the same key/payload. One effect remains. Reuse with different content is rejected. Optionally enter a monetary receipt amount/currency, then Executive → Finance publishes an approved revenue snapshot from confirmed receipts. This is a connector exercise, not a replacement ledger.
11. **Emergency:** Admin sets Emergency offline; Security creates an incident in Rooms & safety. Security/management alerts appear immediately with failed delivery. Restore the adapter and retry. Use Hotel → Incidents for acknowledge/attend/backup/resolve. Guest-origin and original-screen incidents route into the same sandbox inboxes. Real emergencies require actual property emergency channels.
12. **Evidence:** Upload a synthetic plain .txt file (3,000 characters maximum) linked to an assigned/scoped task or a Security incident. The server validates content, computes SHA-256 and rechecks authorization at download. Front Desk cannot download incident evidence. There is no ordinary delete action.
13. **Configuration:** Manager/Admin proposes SLA targets and contacts, session duration, export permission or MFA-exercise policy. Executive independently approves; Admin applies. Earlier task deadlines stay unchanged. New tasks use approved targets; new sign-ins use the selected session duration. Disabling exports blocks the next export.
14. **MFA exercise:** Enable the approved policy, then attempt a feature change: it is blocked. Start the labelled exercise, enter the displayed one-use code and retry. Verification lasts five minutes. This visibly demonstrates policy gating and is not a real independent authentication factor.
15. **Recovery:** Admin saves an operational recovery point and runs a detached restore drill. Room/task references are checked and the outcome is recorded. Active hotel data, revoked sessions, money/evidence/audit history cannot be rolled back.
16. **Reports:** Manager/Executive see their authorized service metrics; Finance sees permitted exceptions. Export is separately authorized, audited, scoped and protected against spreadsheet-formula injection. Live revenue is not fabricated.

## Verification and production boundaries

Domain tests, account API checks, full workflow scripts and browser evidence are recorded in VERIFICATION.md. Feature state is versioned and stored in Neon with the hotel sandbox. Private text contents are excluded from ordinary hotel responses and public source control. Real room-password email remains configured; automated feature tests do not send mail or move real funds.

These workflows demonstrate business behavior, not every production release gate. Production individual employee identity/OIDC and real MFA, physical locks, contracted PMS/POS/payment adapters and signed vendor callbacks, real emergency delivery, private object storage/malware scanning, automatic workers, infrastructure backup/PITR, retention enforcement, performance targets and organizational approvals still need selected providers and operational decisions. A manual durable escalation scan is not a production scheduler. A private text attachment is not a malware scanner. A detached recovery drill is not infrastructure disaster recovery. No production readiness or compliance claim is made.
