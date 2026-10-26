# Reference implementation upgrade

Implemented in the existing public-preview app inside hotel-app-main. hotel_app_main_riku is a read-only reference and was not changed.

## What moved

Nine dedicated consoles, the hotel website, room catalog/search/comparison/booking/booking management, guest service portal, dining cart, housekeeping and Do Not Disturb, maintenance/safety, spa/concierge, folio/disputes/checkout, lost-and-found, notifications, role reports/exports and administrative controls now use the richer reference interface in experience/.

The reference's localStorage store was replaced by /api/experience and a server-side workflow engine. Synthetic workspace state persists in the existing Neon demo_workspaces JSONB record. Authentication, one-use email passwords, Resend sender, and the existing deployment remain in the same project. There is no second database or frontend project.

## Client demonstration map

| Area | Where and how to use it | Persistence / boundary |
| --- | --- | --- |
| Public hotel | /hotel: filter rooms, compare, inspect a room, book with the wizard, manage/modify/cancel by reference | Server validates availability, dates and prices. Card entry is a simulator; only the displayed mask crosses the API. |
| Public inquiries | Dining, Spa, Contact forms | Saved Front Desk cases, not a real restaurant/spa scheduling service. |
| Room login | Front Desk > Guest access > registered email > QR or Click me to login | Real QR, one-use email password, verified guest session. No demo-token bypass. |
| Guest services | /guest/portal after verification | Dining, amenities, cleaning, maintenance, safety, spa, concierge; requests persist and progress through staff actions. No automatic completion timers. |
| Guest billing | Guest Folio | Net balance after recorded payments, charge dispute, early cancellation credit and sandbox express checkout. Open disputes block checkout. |
| Guest lost property | Guest Lost & found | Non-sensitive item claims; sensitive custody records remain with staff. |
| Front Desk | Stays / Requests / Rooms / Recovery / Reconcile / Lost & found / Guest access | ID checks, ready-room check-in, room move, charge settlement, checkout/revocation, case routing, authorized credit execution and simulator exception recovery. |
| Dispatch | Queue / Workload / Routing / SLA / Reports | Manual/automatic assignment, capacity/availability, same-room duplicate linking, reassignment, escalation. Original timing retained. |
| Fulfiller | Tasks / Notifications / Performance / Profile | Assigned-identity work only, accept/start/block/resume/complete, required evidence, reassignment and shift-relief requests, availability and chimes. |
| Supervisor | Overview / Rooms / Tasks / Inspections / Team / Escalations / Handover / Reports / Audit | Inspection release or corrective reopen, safe inventory, staffing and receiving-owner handover acknowledgement. |
| Duty Manager | Operations / Workforce / Escalations / Resources / Handover / Reports / Activity | Complaint authorization separate from credit execution, notes, resource review, workload flags, incident coordination and handover. |
| Executive | Overview / Approvals / Incidents / Finance / Performance / Reports / Audit / Profile | Viewer/approver presentation mode; independent approval, rejection/clarification, comments/directives. Approval does not execute a refund or credit. |
| Finance | Invoices / Payments / Outstanding / Refunds / Transactions / Reports / Audit / Profile / Settings | Itemized invoices, exact-amount sandbox payments, duplicate-reference rejection, Executive refund authorization, Finance execution and a separate reviewer login for reconciliation. |
| Security | Alerts / Incidents / History / Profile | Acknowledge, arrive on scene, backup/escalation, notes, required report and resolved guest status; restricted report never appears in the guest API. |
| Administrator | Staff / Workflow / Room QR / Integrations / Audit / Environment | Private generated login for new roster identity, role/status edits, workflow values, real room QR/revocation, connector simulations, balance diagnostics, synthetic reset retaining staff and audit. |
| Client instructions | /guide | Walkthrough of every role and a connected presentation sequence. |
| Previous demonstrations | /legacy and /features | Earlier requirement exercises retained; new main workflow uses /staff/* and /api/experience. |

## Consistency improvements over the reference

- Authenticated identity and selected property/floor/outlet/shift grants are checked server-side. URL personas and browser payloads never grant a role.
- Browser mutations serialize, show a saving state, and wait for saved versions; stale writes return a conflict. Command IDs bind the exact action payload.
- Guest services share stable references across roles. Completed room work creates inspection records; reassignment never silently completes work.
- Do Not Disturb and out-of-order restrictions block entry/release.
- Cancellation and dispute credits reconcile to the folio. Financial approval, execution and reconciliation are separate actions and identities.
- SLA capture/deadlines persist. Visible-client polling evaluates breaches and deduplicates escalation; no unattended scheduler is claimed.
- Profile preferences, public inquiries, responder availability and workload flags save actual changes instead of toast-only success.
- Guest checkout, room move and revocation invalidate prior guest sessions/codes atomically with workspace saves.
- All roles use the muted beige/olive/clay theme; dark-mode toggles are disabled in favor of the requested fixed appearance.

## Authentication and data

The private ignored CLIENT_DEMO_LOGINS.md contains the existing nine role logins, independent Finance reviewer and six specialist accounts. Original passwords are retained. Specialist identities: spa.demo, engineering.demo, dining.demo, attendant.demo, maintenance.demo and housekeeping-dispatch.demo. No password is committed, deployed or printed in verification logs. New Administrator-created accounts are shown once privately and only work where their roster identity exists.

All hotel operational records are synthetic and isolated by visitor workspace, which expires after 12 hours. Staff sessions last up to 8 hours. Reports contain a mixture of clearly seeded historical examples and current workspace data; these are not live hotel business analytics.

## Verification

- Existing 55 domain/permission tests retained.
- 30 new connected-domain scenarios cover all role data boundaries, guest requests, Do Not Disturb, pricing, dispatch/fulfil/inspection, safety, independent money handling, website booking, cancellation credits, preferences, reset and SLA deduplication.
- scripts/experience-smoke.mjs checks all nine authenticated API views, a database-fixture one-use guest login, a saved cross-role task/inspection, idempotency, a distinct Finance reviewer, specialist identity, preferences, logout and room revocation.
- Production build uses Next 16.4.3 with Webpack on Node 24; dependencies audited after upgrade.

## External capabilities

Resend room-password delivery uses the verified devatelier.tech sender and configured room recipient. The integration smoke test inserts a one-use database fixture instead of sending email, and must not be presented as fresh mailbox-delivery verification. PMS/POS, card settlement, bank reconciliation, door keys, notification delivery outside the app, spa/restaurant reservations and emergency dispatch remain explicit simulations. No real money moves and no emergency service is contacted.
