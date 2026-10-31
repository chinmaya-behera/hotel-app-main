# Hotel Operations Audit: Role Responsibilities, End-to-End Workflows, and System Gaps

**Document Reference:** `ROLE_RESPONSIBILITIES_WORKFLOWS_AND_GAPS.md`  
**Audit Date:** October 2026  
**Audited Sources:** `PRD.md`, `ARCHITECTURE.md`, `TECH_STACK.md`, `DESIGN.md`, `ER_DIAGRAMS.md`, `IMPLEMENTATION_GUIDE.md`, `SECURITY.md`, `DECISIONS.md`, `TEST_PLAN.md`, `CLAUDE.md`, `FRONTEND_PROGRESS.md`, `FEATURE_TRACEABILITY.md`, `Tech_Team_Project_Guide_and_Feature_Spec.pdf`, 13 Workflow Diagrams (`workflow digrams/`), and the active source codebase (`src/`).

---

## A. Responsibilities of Each Role

This section defines the operational purpose, primary responsibilities, documented permissions, negative boundaries, and current frontend implementation status for each of the nine staff roles and the guest surface.

```
+----------------------------------------------------------------------------------------------------+
|                                    HOTEL SYSTEM ACTOR ECOSYSTEM                                    |
+----------------------------------------------------------------------------------------------------+
|  [Guest / Visitor]                                                                                 |
|         │                                                                                          |
|         ▼                                                                                          |
|  [Front Desk Coordinator] ◄──────► [Financial Operator] ◄──────► [Executive Approver]              |
|         │                                                               │                          |
|         ▼                                                               │                          |
|  [Department Dispatcher]  ◄──────► [Department Manager / Duty Manager] ─┘                          |
|         │                                      │                                                   |
|         ▼                                      ▼                                                   |
|  [Task Fulfiller]         ◄──────► [Department Supervisor] ◄────► [Platform Administrator]         |
|                                                ▲                                                   |
|                                                │ (Emergency Isolation Boundary)                    |
|                                    [Security Responder]                                            |
+----------------------------------------------------------------------------------------------------+
```

---

### 1. Task Fulfiller
- **Role Identifier:** `task_fulfiller`
- **Default Actor & Route:** Vikram Singh (`EMP-0103`), `/staff/fulfiller`
- **Primary Purpose:** Field-level execution of physical tasks including room cleaning, maintenance repairs, guest item delivery, luggage assistance, and in-room dining orders.
- **Key Responsibilities:**
  - Receive incoming task notifications with audible chime alert.
  - Accept and commence tasks, transitioning status from `assigned` to `in_progress`.
  - Report operational blockers with structured reason codes (e.g., *Do Not Disturb*, *Refused Entry*, *Missing Supplies*, *Structural Damage*).
  - Request task reassignment if outside assigned zone, overloaded, or lacking specialized tools.
  - Complete tasks with mandatory photographic proof-of-work URL/upload.
  - Monitor personal shift scorecard, completion speed, and guest rating.
- **Documented Permissions:**
  - *Can View:* Assigned tasks, room location, guest request notes, task priority, personal performance metrics.
  - *Can Create / Update:* Task status (`in_progress`, `completed`, `blocked`), blocker reason notes, proof-of-work photos, reassignment requests.
- **Negative Boundaries (Must NOT Control):**
  - Cannot assign tasks to other staff members.
  - Cannot close or self-inspect housekeeping quality audits.
  - Cannot access guest folios, financial balances, credit cards, or room rates.
  - Cannot alter room availability status (e.g., mark room Clean or Out of Order).
- **Current Implementation Status:** **Complete.** Implemented via mobile-first container (`TaskFulfillerConsole.tsx`), Web Audio melodic chime (`chime.ts`), live camera photo simulation, structured blocker modal, reassignment modal, and shift performance dashboard.

---

### 2. Department Dispatcher
- **Role Identifier:** `department_dispatcher`
- **Default Actor & Route:** Arjun Mehta (`EMP-0104`), `/staff/dispatcher`
- **Primary Purpose:** Centralized operational coordination, automated and manual task distribution, queue load-balancing, and service level agreement (SLA) adherence.
- **Key Responsibilities:**
  - Monitor live incoming queue of unassigned tickets across Housekeeping, Maintenance, Front Desk, and F&B.
  - Execute deterministic 7-step auto-assignment based on shift status, workload balance, skill tag, floor zone, and priority.
  - Manually assign and reassign tasks when automated routing requires human judgment.
  - Link duplicate tickets raised for the same room or guest to prevent redundant dispatches.
  - Redistribute unstarted tasks when fulfillers exceed Mean Time to Acknowledge (MTTA) thresholds.
  - Monitor dual SLA countdown timers (MTTA target $\le 5$ min, MTTR target $\le 30$ min).
- **Documented Permissions:**
  - *Can View:* Property-wide task queues, active staff rosters, individual staff capacity gauges, SLA breach countdowns.
  - *Can Create / Update:* Task assignments, task priority escalation, duplicate ticket links, bulk task redistribution.
- **Negative Boundaries (Must NOT Control):**
  - Cannot complete tasks or upload proof-of-work on behalf of fulfillers.
  - Cannot conduct or sign off on physical room quality inspections.
  - Cannot issue guest bill credits, discounts, or financial refunds.
  - Cannot modify guest reservations, room assignments, or PMS records.
- **Current Implementation Status:** **Complete.** Implemented via desktop console (`DispatcherConsole.tsx`) featuring 8 live KPI cards, multi-criteria filter bar, deterministic auto-assign engine, staff capacity indicators, dual SLA timers, duplicate ticket linker, and unstarted task redistributor.

---

### 3. Department Supervisor
- **Role Identifier:** `department_supervisor`
- **Default Actor & Route:** Meera Nambiar (`EMP-0105`), `/staff/supervisor`
- **Primary Purpose:** Field quality assurance, physical room release inspections, staff coaching, operational blocker resolution, and shift continuity.
- **Key Responsibilities:**
  - Conduct structured room cleanliness and maintenance inspections using a 5-category scoring checklist (Bedding, Bathroom, Amenities, Surfaces, Electronics).
  - Calculate dynamic quality scores; certify rooms with $\ge 85\%$ as `inspected` and release to Front Desk as `clean`.
  - Reopen failed rooms with mandatory deficiency notes, corrective directives, and automatic reassignment to the original attendant.
  - Review and resolve fulfiller operational blockers (e.g., DND verification, supply restock).
  - Approve or decline attendant task reassignment requests.
  - Log inter-shift handover notes capturing open work orders, VIP flags, and equipment status.
  - Export department inspection audit records to Blob CSV.
- **Documented Permissions:**
  - *Can View:* Department tasks, room cleaning status boards, staff attendance rosters, inspection checklists, blocker queues.
  - *Can Create / Update:* Room status (`cleaning` $\rightarrow$ `inspected` $\rightarrow$ `clean`), inspection audit checklists, deficiency reopen directives, blocker clearance notes, shift handover logs.
- **Negative Boundaries (Must NOT Control):**
  - Cannot approve guest financial compensation, discounts, or refunds.
  - Cannot modify guest reservations or process guest check-in/out.
  - Cannot alter system-wide SLA configurations or modify staff account credentials.
  - Cannot authorize capital expenditures or equipment asset write-offs.
- **Current Implementation Status:** **Complete.** Implemented via desktop console (`DepartmentSupervisorConsole.tsx`) with an 11-tab sticky collapsible sidebar, 5-category inspection scoring modal, deficiency reopen modal, room readiness board, attendant workload view, and Blob CSV export.

---

### 4. Department Manager / Duty Manager
- **Role Identifier:** `department_manager`
- **Default Actor & Route:** Marcus Vance (`EMP-0106`), `/staff/duty-manager`
- **Primary Purpose:** Departmental leadership, cross-departmental coordination, guest service recovery, supply requisition approvals, and property-wide operational command.
- **Documented Role Scope & Clarification:**
  - *Documentation Analysis:* `PRD.md` (Table 4.1) and `Tech_Team_Project_Guide_and_Feature_Spec.pdf` (Page 1) title this role *"Department Manager / Duty Manager"*. In luxury hotel operations, a Department Manager oversees a specific department (e.g., Executive Housekeeper), whereas a Duty Manager exercises property-wide operational authority across all departments during a shift.
  - *System Resolution (ADR-002):* Unified into a single role key (`department_manager`) equipped with an active scope switcher:
    - **"My Department" Scope:** Restricts KPI cards, staff rosters, and task backlogs to the manager's assigned department.
    - **"Entire Hotel" Scope:** Expands metrics to property-wide operations, unlocks cross-department incident command, enables Out of Order (OOO) room blocks, and activates service recovery compensation authority.
- **Key Responsibilities:**
  - Monitor departmental and hotel-wide KPI metrics (occupancy, task velocity, open complaints, SLA breaches).
  - Issue broadcast manager directives to operational teams.
  - Review and authorize guest complaints and service recovery compensation (limit: up to ₹16,000 per incident).
  - Review and approve department supply requisitions.
  - Authorize room status overrides (e.g., putting rooms into Out of Order status for deep maintenance).
  - Direct incident response during cross-departmental crises.
  - Log formal management shift handover briefings.
- **Documented Permissions:**
  - *Can View:* All operational metrics, staff rosters, guest complaints, supply requisitions, incident logs.
  - *Can Create / Update:* Manager directives, complaint resolutions, service recovery comps ($\le ₹16,000$), room status overrides (OOO), supply approvals, management handover briefings.
- **Negative Boundaries (Must NOT Control):**
  - Cannot approve service recovery compensation exceeding ₹16,000 (must escalate to Executive Approver).
  - Cannot execute banking payment gateway refunds directly (must route to Financial Operator).
  - Cannot modify user RBAC accounts or system integration credentials (reserved for Platform Admin).
- **Current Implementation Status:** **Complete.** Implemented via branded desktop console (`DutyManagerConsole.tsx`) with Department/Hotel scope toggle, 8 filterable KPI cards, complaints queue with ₹16,000 comp limit enforcement, supply requisition approval cards, and incident command overview.

---

### 5. Front Desk Coordinator
- **Role Identifier:** `front_desk_coordinator`
- **Default Actor & Route:** Sunita Patel (`EMP-0102`), `/staff/front-desk`
- **Primary Purpose:** Guest arrival and departure management, room key and QR session lifecycle management, guest problem intake, and lost & found custody.
- **Key Responsibilities:**
  - Manage daily guest arrivals, departures, and in-house guest records.
  - Execute guest check-in, strictly gated by room readiness (room must be `clean` or `inspected`).
  - Process express check-outs, triggering immediate session revocation of guest digital portal tokens.
  - Execute guest room moves, updating inventory and instantly invalidating the old room's QR access token.
  - Intake guest service recovery complaints and route to relevant departments.
  - Maintain the Lost & Found property registry, strictly enforcing privacy rules (e.g., hiding sensitive photos by default).
  - Reconcile Property Management System (PMS) integration synchronization issues.
- **Documented Permissions:**
  - *Can View:* Guest reservations, room inventory states, guest complaints, lost & found items, PMS sync queue.
  - *Can Create / Update:* Reservation status (`checked_in`, `checked_out`), room assignments, room move transactions, guest complaints, lost & found entries, PMS sync retries.
- **Negative Boundaries (Must NOT Control):**
  - Cannot mark dirty rooms as clean or inspected (reserved for Housekeeping fulfillers/supervisors).
  - Cannot execute raw financial ledger refunds or modify general banking journals.
  - Cannot reassign maintenance or housekeeping staff tasks directly.
- **Current Implementation Status:** **Complete.** Implemented via full-width 2-column desktop grid (`FrontDeskConsole.tsx`), sticky activity feed, room readiness gatekeeper, room move modal with instant token revocation, PMS sync queue, and gesture guide.

---

### 6. Financial Operator
- **Role Identifier:** `financial_operator`
- **Default Actor & Route:** Neha Kapoor (`EMP-0107`), `/staff/finance`
- **Primary Purpose:** Hotel revenue operations, guest billing, payment recording, invoice generation, refund execution, and bank settlement reconciliation.
- **Key Responsibilities:**
  - Monitor daily financial KPIs: Today's Revenue, Payments Received, Outstanding Guest Balances, Pending Payments, Refund Queue, Unreconciled Items.
  - Inspect 7-day revenue trend charts and transaction ledgers.
  - Preview, format, and print official guest tax invoices (`InvoiceDetailModal`).
  - Generate manual guest invoices and post itemized charges.
  - Record payments (Cash, Credit Card, UPI, Bank Transfer) against outstanding folio balances.
  - Review and process guest refund requests within authorized clearance limit (limit: up to ₹80,000).
  - Reconcile payment gateway transactions against PMS charges and bank settlement feeds.
  - Simulate gateway status transitions (`settled`, `pending`, `failed`, `disputed`).
- **Documented Permissions:**
  - *Can View:* All guest folios, invoices, transactions, payment gateways, refund requests, reconciliation ledgers.
  - *Can Create / Update:* Invoices, payment records, refund approvals ($\le ₹80,000$), transaction reconciliation statuses (`matched`, `unreconciled`, `flagged`).
- **Negative Boundaries (Must NOT Control):**
  - Cannot unilaterally approve refund requests initiated by themselves (dual-control policy).
  - Cannot alter room operational states (e.g., clean/dirty/OOO).
  - Cannot dispatch operational tasks or modify staff work rosters.
- **Current Implementation Status:** **Complete.** Implemented via desktop console (`FinanceConsole.tsx`) with an 11-tab sticky collapsible sidebar, KPI cards, 7-day trend chart, printable tax invoice modal, payment recording modal, refund authorization queue, and bank settlement reconciliation tool.

---

### 7. Security Responder
- **Role Identifier:** `security_responder`
- **Default Actor & Route:** Inspector Roy (`EMP-0108`), `/staff/security`
- **Primary Purpose:** Physical security, guest and personnel safety, rapid emergency incident response, asset protection, and formal incident investigation.
- **Key Responsibilities:**
  - Monitor live incoming security alerts, SOS panic alarms, and perimeter breach warnings.
  - Acknowledge incoming alarms instantly, halting the MTTA timer.
  - Inspect interactive tactical architectural SVG floor plans displaying incident locations, corridors, emergency stairwells, and fire hose cabinets.
  - Progress incident lifecycles through operational milestones: `New` $\rightarrow$ `Acknowledged` $\rightarrow$ `On scene` $\rightarrow$ `Resolved`.
  - Request backup from secondary security officers during high-risk events.
  - Escalate critical incidents directly to the Duty Manager.
  - File formal incident investigation reports with evidence URLs, witness statements, and authority notifications.
- **Documented Permissions:**
  - *Can View:* Active security alarms, incident feeds, tactical floor plans, officer deployment statuses.
  - *Can Create / Update:* Incident response status, backup calls, incident escalation flags, formal incident reports.
- **Negative Boundaries (Must NOT Control) — Strict Isolation Boundary:**
  - **Zero Folio Access:** Documented in `PRD.md` Section 4.7 and `Tech_Team_Project_Guide_and_Feature_Spec.pdf` Section 4 Item 6: *Must NOT access guest folios, billing balances, invoice records, or personal contact details beyond room number and immediate safety notes.*
  - Cannot reassign operational staff or alter room availability.
- **Current Implementation Status:** **Complete.** Implemented via mobile-first container with speaker notch (`SecurityConsole.tsx`), native Web Audio 880/1320Hz warble siren (`securityChime.ts`), tactical SVG floor plan modal (`SecurityFloorPlanModal.tsx`), backup dispatcher, and formal incident report modal.

---

### 8. Executive Viewer / Approver
- **Role Identifier:** `executive_viewer`
- **Default Actor & Route:** Priya Nair (`EMP-0109`), `/staff/executive`
- **Primary Purpose:** Enterprise oversight, strategic multi-department performance evaluation, crisis governance, and high-value authorization beyond departmental limits.
- **Documented Role Scope & Clarification:**
  - *Dual Operational Modes:*
    - **Executive Viewer Mode:** Read-only access to all operational metrics, financial health indicators, department scorecards, and audit logs.
    - **Executive Approver Mode:** Decision-maker authority unlocking high-value approvals up to ₹2,00,000 for capital expenditures, major asset repairs, and beyond-manager service recovery comps.
- **Key Responsibilities:**
  - Inspect property-wide operational velocity, occupancy, revenue aggregates, and labor efficiency.
  - Evaluate department-specific performance scorecards (Housekeeping, F&B, Maintenance, Front Desk).
  - Review and authorize capital expenditure (Capex) requests and emergency supply requisitions ($> ₹16,000$ up to ₹2,00,000).
  - Intervene in property crises, issuing binding Executive Directives.
  - Review system-wide compliance audit ledgers.
  - Export enterprise reports to Blob CSV.
- **Documented Permissions:**
  - *Can View:* All property operational and financial metrics, departmental scorecards, audit ledgers, pending capex requests.
  - *Can Create / Update (Approver Mode):* Capex approvals/rejections ($\le ₹2,00,000$), executive crisis directives, high-value comp authorizations.
- **Negative Boundaries (Must NOT Control):**
  - Cannot perform field-level task assignments or fulfiller dispatching.
  - Cannot conduct physical room cleaning inspections or mark rooms clean.
  - Cannot execute day-to-day front desk check-in/out transactions.
- **Current Implementation Status:** **Complete.** Implemented via desktop command center (`ExecutiveConsole.tsx`) with 15 navigation views, dual permission mode switcher, KPI cards with filter pass-through, capex approval queue, incident command briefing, and Blob CSV exporter.

---

### 9. Platform Administrator
- **Role Identifier:** `platform_admin`
- **Default Actor & Route:** Rajesh Sharma (`EMP-0101`), `/staff/admin`
- **Primary Purpose:** Technical system administration, role-based access control (RBAC), security token governance, integration monitoring, and system configuration.
- **Key Responsibilities:**
  - Provision and maintain staff user accounts across all 9 roles, with active/suspended toggling.
  - Manage room QR access tokens, inspect cryptographic digests, and execute emergency mass session revocations.
  - Calibrate dual SLA countdown timers (MTTA and MTTR thresholds) using interactive sliders.
  - Monitor external connector health (PMS, Payment Gateway, Keyless Lock API, SMS Bridge) and simulate latency/outages.
  - Inspect immutable system security and operational audit logs.
  - Export system audit trails to JSON.
- **Documented Permissions:**
  - *Can View:* All system configuration panels, user credentials, token digests, connector telemetry, audit logs.
  - *Can Create / Update:* Staff user accounts, role assignments, account statuses, QR token revocations, SLA threshold values, connector retry policies.
- **Negative Boundaries (Must NOT Control):**
  - Strictly separated from operational and financial duties. Must NOT process guest payments, conduct room inspections, or intake front desk guests during routine operations.
- **Current Implementation Status:** **Complete.** Implemented via desktop console (`AdminConsole.tsx`) featuring 7 administrative sections, RBAC account table, QR token manager, SLA slider controls, connector health monitor, and audit log JSON exporter.

---

### 10. Guest Portal / Guest
- **Role Identifier:** `guest`
- **Default Surface & Route:** Public Website (`/hotel`) and In-Room Mobile Portal (`/guest/portal`)
- **Primary Purpose:** Public hotel exploration, direct online room reservation, self-service in-room amenity ordering, maintenance problem reporting, live folio inspection, and express checkout.
- **Key Responsibilities:**
  - Browse hotel suites, amenities, and floor plans.
  - Complete 5-step room booking with simulated payment guarantee.
  - Access in-room portal authenticated via room QR code URL (`?room=402&token=demo-token`).
  - Request housekeeping amenities (extra towels, pillows, room cleaning).
  - Submit maintenance requests (AC repair, plumbing, television issues).
  - Order in-room dining from digital restaurant menu.
  - Review real-time digital folio charges and file billing disputes.
  - Complete express checkout.
- **Documented Permissions:**
  - *Can View:* Public hotel catalog, own reservation details, in-room service menu, own active requests, own room folio.
  - *Can Create:* Reservations, room service orders, service requests, maintenance tickets, folio disputes, checkout requests.
- **Negative Boundaries (Must NOT Control):**
  - Cannot access any other guest's reservation or billing details.
  - Cannot view internal staff task assignments, dispatcher queues, or staff rosters.
  - Session is cryptographically bound to room token; access is permanently revoked upon checkout or room move.
- **Current Implementation Status:** **Complete.** Implemented via public showcase (`/hotel`) with 5-floor architectural explorer and 5-step booking wizard, alongside mobile-first guest portal (`/guest/portal`) with live synchronization to shared store (`src/lib/store.tsx`).

---

## B. How the Roles Work Together: 8 End-to-End Operational Workflows

The following numbered workflows trace how work, data, and authorization pass across roles from trigger to final resolution.

```
Workflow 1: Guest Service Request to Folio Posting
[Guest Portal] ──(Request)──► [Dispatcher] ──(Assign)──► [Fulfiller] ──(Deliver+Photo)──► [Supervisor] ──(Inspect)──► [Folio]

Workflow 2: Room Move and QR Key Revocation
[Guest / Front Desk] ──(Move 402->501)──► [Front Desk] ──(Revoke Old Token)──► [Guest Session Locked]
                                                └──(Clean 402)──► [Dispatcher] ──► [Fulfiller]

Workflow 3: Folio Dispute to Financial Reconciliation
[Guest Portal] ──(Dispute)──► [Duty Manager] ──(Approve <=16k)──► [Financial Operator] ──(Refund)──► [Bank Reconciled]
                                    └──(If >16k)──► [Executive Approver] ──┘

Workflow 4: Emergency Panic Alarm to Scene Resolution
[Panic Alarm] ──(880Hz Siren)──► [Security Responder] ──(On Scene)──► [Duty Manager Escalation] ──► [Report Filed]
```

---

### Workflow 1: Guest Service Request to Delivery, Quality Inspection, and Folio Posting
1. **Trigger / Origin:** In-house guest in Room 402 submits a request for *"Extra Luxury Towels & Bathrobe"* via the Guest Portal (`/guest/portal`). Status is created as `pending`.
2. **Intake & Dispatch:** The Department Dispatcher (`/staff/dispatcher`) sees the ticket appear in the unassigned queue. The deterministic auto-assign engine (or manual dispatch) evaluates Vikram Singh (`task_fulfiller`, Housekeeping) as having available capacity and assigns the ticket. Status transitions to `assigned`.
3. **Field Acceptance & Execution:** Vikram Singh receives a 2-tone melodic chime alert on his mobile console (`/staff/fulfiller`). He taps **Accept Task** (status: `in_progress`), halting the MTTA timer. Upon delivering the items to Room 402, he captures a proof-of-delivery photograph and taps **Complete Task**. Status transitions to `completed`.
4. **Quality Inspection & Sign-off:** Department Supervisor Meera Nambiar (`/staff/supervisor`) sees the completed task in her review queue. She verifies the proof-of-work photo and approves the completion.
5. **Folio Charge Posting:** If the item carries a fee (e.g., premium spa kit or room service meal), the charge is automatically posted to the guest's digital room folio.
6. **Guest Feedback:** The Guest Portal updates in real time to show *"Completed"*, and the new line item appears on the guest's live digital folio.
- **Supporting Screens & State:** `GuestPortalView.tsx`, `DispatcherConsole.tsx`, `TaskFulfillerConsole.tsx`, `DepartmentSupervisorConsole.tsx`, `src/lib/store.tsx` (`tasks`, `folios`).

---

### Workflow 2: Guest Room Move and QR Key Session Revocation
1. **Trigger / Origin:** Guest in Room 402 reports an air conditioning failure. Front Desk Coordinator Sunita Patel (`/staff/front-desk`) determines a room change is required.
2. **Room Readiness Verification:** Sunita opens the **Room Move Modal**. The system displays available rooms, filtering strictly for rooms with status `clean` or `inspected` (Room 501 is selected).
3. **Execution & Session Revocation:** Front Desk confirms the move. The store atomically:
   - Updates the guest's reservation room number to `501`.
   - Transitions Room 402 status to `cleaning` (dirty).
   - **Immediately invalidates the active QR access token for Room 402** (`room-402-token-revoked`).
   - Issues a new authenticated session token for Room 501.
4. **Guest Session Termination:** The guest's active mobile portal session on the old token instantly displays a session termination warning and redirects to re-authenticate with Room 501.
5. **Turnover Dispatch:** Room 402 automatically enters the Department Dispatcher's queue as an urgent departure turnover cleaning task.
6. **Turnover Completion & Release:** A fulfiller cleans Room 402, the supervisor conducts the 5-category inspection, marks it `clean`, and releases it back to Front Desk inventory.
- **Supporting Screens & State:** `FrontDeskConsole.tsx` (`RoomMoveModal`), `GuestPortalView.tsx`, `DispatcherConsole.tsx`, `DepartmentSupervisorConsole.tsx`, `src/lib/store.tsx` (`rooms`, `reservations`, `guestTokens`).

---

### Workflow 3: Guest Folio Dispute, Managerial Review, Financial Execution, and Bank Reconciliation
1. **Trigger / Origin:** Guest in Room 301 inspects digital folio on `/guest/portal` and flags an incorrect mini-bar charge of ₹2,400 with note *"Did not consume mini-bar snacks"*.
2. **Front Desk / Manager Review:** The dispute surfaces in the Complaints & Service Recovery Queue on `/staff/front-desk` and `/staff/duty-manager`.
3. **Manager Authorization:** Duty Manager Marcus Vance evaluates the claim. Since the amount (₹2,400) is within his ₹16,000 discretionary limit, Marcus authorizes a service recovery credit of ₹2,400.
   - *Escalation Rule:* If the disputed amount exceeded ₹16,000 (e.g., damaged designer luggage claim of ₹45,000), the Duty Manager interface locks the approval and flags it for **Executive Approver** sign-off.
4. **Financial Operator Execution:** The authorized credit is routed to Financial Operator Neha Kapoor (`/staff/finance`). Neha opens the guest's invoice, applies the authorized credit adjustment, and executes a refund to the guest's original credit card.
5. **Bank Settlement Reconciliation:** Neha navigates to the **Reconciliation** tab in `FinanceConsole.tsx`, matches the payment gateway settlement batch against the bank statement feed, and marks the transaction as `matched`.
6. **Guest Folio Update:** The guest's digital folio reflects the credited line item, reducing the outstanding balance to ₹0.
- **Supporting Screens & State:** `GuestPortalView.tsx`, `DutyManagerConsole.tsx`, `FinanceConsole.tsx` (`InvoiceDetailModal`), `src/lib/store.tsx` (`complaints`, `invoices`, `transactions`).

---

### Workflow 4: Emergency Panic Alarm / Security Incident, On-Scene Response, and Duty Manager Escalation
1. **Trigger / Origin:** An SOS panic alarm is triggered from the 3rd Floor East Wing corridor, or logged manually via security dispatch.
2. **Instant Siren & Alert:** The Security Responder mobile console (`/staff/security`) triggers an urgent native Web Audio warble siren (alternating 880Hz / 1320Hz) and displays a full-width red alarm banner.
3. **Officer Acknowledgment:** Inspector Roy taps **Acknowledge Alarm** within 60 seconds (halting MTTA timer). Status transitions to `acknowledged`.
4. **Tactical Navigation:** Roy taps **Tactical Floor Plan**, opening the vector architectural layout of Floor 3 to locate the active beacon, emergency fire stairs, and nearest exits.
5. **Arrival On Scene & Backup Call:** Roy arrives on scene and marks status `on_scene`. Finding an unauthorized trespasser attempting forced entry, Roy taps **Call Backup**, alerting the secondary patrol officer.
6. **Escalation to Duty Manager:** Roy taps **Escalate to Duty Manager**. Marcus Vance (`/staff/duty-manager`) immediately receives an urgent Incident Command alert banner on his console.
7. **Resolution & Formal Report:** Once the situation is neutralized, Roy taps **Resolve Incident** and submits a formal incident investigation report with evidence URL, witness summary, and police dispatch log.
- **Supporting Screens & State:** `SecurityConsole.tsx`, `securityChime.ts`, `SecurityFloorPlanModal.tsx`, `DutyManagerConsole.tsx`, `src/lib/store.tsx` (`securityIncidents`).

---

### Workflow 5: Out of Order (OOO) Room Block Request, Managerial Approval, and Public Inventory Guard
1. **Trigger / Origin:** Maintenance fulfiller detects a ruptured hot water pipe behind the wall in Room 204.
2. **Blocker & Out-of-Order Flag:** The fulfiller flags the task as `blocked` with reason code *"Structural Damage"*, and Department Supervisor Meera Nambiar inspects the room, confirming it cannot be occupied for 72 hours.
3. **Supervisor Block Submission:** Meera submits a formal **Out of Order (OOO) Block Request** on `/staff/supervisor` with damage photos and an estimated return-to-service date.
4. **Duty Manager Authorization:** Duty Manager Marcus Vance reviews the request on `/staff/duty-manager` and approves the OOO status override.
5. **Atomic Inventory Guard:** The room state transitions to `out_of_order`. Immediately:
   - Front Desk room grid (`/staff/front-desk`) greys out Room 204, preventing check-in.
   - Public architectural room explorer (`/hotel`) updates Room 204 badge to *"Under Maintenance"*.
   - Public booking engine removes Room 204 from inventory availability.
6. **Re-commissioning:** Following plumbing repairs, a supervisor re-inspects Room 204, certifies it with a 95% inspection score, and releases it back to `clean` status.
- **Supporting Screens & State:** `TaskFulfillerConsole.tsx`, `DepartmentSupervisorConsole.tsx`, `DutyManagerConsole.tsx`, `FrontDeskConsole.tsx`, `RoomExplorer.tsx`, `src/lib/store.tsx` (`rooms`).

---

### Workflow 6: Inter-Shift Handover Briefing, Outstanding Task Transfer, and Formal Acknowledgment
1. **Trigger / Origin:** End of Morning Shift (15:00 hrs). Outgoing Supervisor Meera Nambiar prepares to hand over Housekeeping operations to the Evening Shift lead.
2. **Handover Log Compilation:** Meera navigates to the **Shift Handover** tab in `/staff/supervisor`. The console pre-populates open tasks (3 cleaning tasks, 1 blocked maintenance), pending VIP arrivals (Room 501, Honeymoon amenity), and OOO rooms (Room 204).
3. **Briefing Submission:** Meera enters operational handover notes (*"Room 501 requires evening turndown by 18:00; chemical restock delivery scheduled at loading dock 16:30"*) and signs off.
4. **Incoming Supervisor Acknowledgment:** The incoming Evening Supervisor logs in, reviews the unacknowledged shift briefing banner, and clicks **Acknowledge Handover**.
5. **Audit Record:** The system timestamps the handover, linking the outgoing supervisor ID (`EMP-0105`) and incoming supervisor ID to an immutable audit record.
- **Supporting Screens & State:** `DepartmentSupervisorConsole.tsx`, `DutyManagerConsole.tsx`, `src/lib/store.tsx` (`handovers`, `auditLogs`).

---

### Workflow 7: Beyond-Authority Capital Expenditure / Resource Requisition to Executive Approval
1. **Trigger / Origin:** The commercial laundry boiler in the basement suffers mechanical failure. Replacement cost is estimated at ₹1,40,000.
2. **Departmental Submission:** Executive Housekeeper Marcus Vance creates a **Supply / Equipment Requisition** on `/staff/duty-manager`.
3. **Authority Check & Escalation:** Because the amount (₹1,40,000) exceeds the manager's ₹16,000 approval limit, the console marks the requisition as *"Requires Executive Approval"* and routes it to the Executive queue.
4. **Executive Review & Authorization:** Executive Director Priya Nair logs into `/staff/executive`, toggles from Viewer mode into **Executive Approver Mode**, and inspects the pending Capex queue.
5. **Approval Execution:** Priya reviews the quotation and clicks **Approve Requisition**. The system checks the ₹2,00,000 executive limit, records Priya's signature, and transitions the requisition to `approved`.
6. **Purchase Order Execution:** Financial Operator Neha Kapoor receives the approved purchase order in `/staff/finance` to disburse supplier funds.
- **Supporting Screens & State:** `DutyManagerConsole.tsx`, `ExecutiveConsole.tsx`, `FinanceConsole.tsx`, `src/lib/store.tsx` (`requisitions`, `auditLogs`).

---

### Workflow 8: Payment-PMS Integration Sync Failure, Front Desk Reconcile Queue, and Financial Override
1. **Trigger / Origin:** A guest books a reservation online. The simulated Payment Gateway charges the card successfully, but a simulated network timeout causes the PMS Connector to fail sync (`SyncIssue` created with status `unresolved`).
2. **Connector Telemetry Alert:** Platform Admin Rajesh Sharma sees the PMS Connector health drop to *"Degraded / Error"* on `/staff/admin`.
3. **Front Desk Operational Alert:** Front Desk Coordinator Sunita Patel notices a red sync warning badge on `/staff/front-desk` in the **PMS Sync Queue**.
4. **Manual Retry:** Sunita clicks **Retry Sync**. The system attempts re-transmission of the guest folio packet.
5. **Financial Reconcile Override:** If the sync fails after 3 automated attempts, the item escalates to Financial Operator Neha Kapoor on `/staff/finance`. Neha performs a manual journal override, links the gateway authorization code to the guest folio, and marks the transaction as `manually_resolved`.
6. **Resolution:** The reservation status updates to `confirmed`, the PMS sync badge clears, and the guest's folio balance is reconciled.
- **Supporting Screens & State:** `AdminConsole.tsx`, `FrontDeskConsole.tsx`, `FinanceConsole.tsx`, `src/lib/store.tsx` (`syncIssues`, `connectorHealth`).

---

## C. Cross-Role Connection Matrix

The following compact matrix summarizes the critical operational handoffs, transferred entities, expected outcomes, and current implementation status across all roles.

| Source Role | Receiving Role | Transferred Information / Entity | Expected Operational Outcome | Current Status | Code / Document Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Guest Portal** | Department Dispatcher | In-room service request / maintenance ticket | Ticket enters unassigned queue for dispatch | **Working** | `GuestPortalView.tsx:L192` $\rightarrow$ `store.tsx:createTask` |
| **Guest Portal** | Front Desk Coordinator | Direct billing dispute / service complaint | Complaint surfaces in front desk triage queue | **Working** | `GuestPortalView.tsx:L240` $\rightarrow$ `store.tsx:createComplaint` |
| **Department Dispatcher** | Task Fulfiller | Assigned task with room, priority, and notes | Fulfiller receives audio chime and accepts task | **Working** | `DispatcherConsole.tsx:L280` $\rightarrow$ `chime.ts` $\rightarrow$ `TaskFulfillerConsole.tsx` |
| **Task Fulfiller** | Department Supervisor | Completed task with proof-of-work photo | Supervisor inspects and approves quality | **Working** | `TaskFulfillerConsole.tsx:L310` $\rightarrow$ `DepartmentSupervisorConsole.tsx` |
| **Task Fulfiller** | Department Supervisor | Blocker report (DND, missing supplies, damage) | Supervisor assists or reassigns task | **Working** | `TaskFulfillerConsole.tsx:L360` $\rightarrow$ `store.tsx:reportBlocker` |
| **Department Supervisor** | Task Fulfiller | Inspection deficiency reopen with directive | Fulfiller re-cleans room to address deficiencies | **Working** | `DepartmentSupervisorConsole.tsx:L420` $\rightarrow$ `reopenTask` |
| **Department Supervisor** | Front Desk Coordinator | Room certified clean / inspected | Front Desk unlocks check-in for awaiting guest | **Working** | `DepartmentSupervisorConsole.tsx:L480` $\rightarrow$ `FrontDeskConsole.tsx:rooms` |
| **Department Supervisor** | Department Manager | OOO block request & shift handover log | Manager authorizes OOO & acknowledges briefing | **Working** | `DepartmentSupervisorConsole.tsx:L510` $\rightarrow$ `DutyManagerConsole.tsx` |
| **Front Desk Coordinator** | Task Fulfiller / Dispatcher | Room departure checkout or room move | Urgent turnover cleaning ticket dispatched | **Working** | `FrontDeskConsole.tsx:L380` $\rightarrow$ `store.tsx:checkoutGuest` |
| **Front Desk Coordinator** | Guest Portal | Room move / checkout token revocation | Old room QR session immediately locked | **Working** | `FrontDeskConsole.tsx:L410` $\rightarrow$ `store.tsx:revokeGuestToken` |
| **Front Desk Coordinator** | Duty Manager | Guest complaint requiring service recovery | Manager reviews and comps up to ₹16,000 | **Working** | `FrontDeskConsole.tsx:L450` $\rightarrow$ `DutyManagerConsole.tsx:complaints` |
| **Duty Manager** | Executive Approver | Comp request $> ₹16,000$ or Capex $> ₹16,000$ | Executive Approver authorizes up to ₹2,00,000 | **Partial** | Comp limit enforced in `DutyManagerConsole.tsx`; Capex linked |
| **Duty Manager** | Financial Operator | Approved comp directive or supply requisition | Finance executes bill credit or vendor disbursement | **Working** | `DutyManagerConsole.tsx:L340` $\rightarrow$ `FinanceConsole.tsx:refunds` |
| **Security Responder** | Duty Manager | Critical security incident / escalation | Duty Manager takes command and coordinates | **Working** | `SecurityConsole.tsx:L285` $\rightarrow$ `DutyManagerConsole.tsx:incidents` |
| **Financial Operator** | Executive Approver | Unreconciled balance or refund $> ₹80,000$ | Executive review of financial variance | **Partial** | Financial KPIs visible to Executive; multi-tier refund modal pending |
| **Platform Administrator** | All Roles | RBAC account status (active/suspended) | Suspended user is locked out of console | **Working** | `AdminConsole.tsx:L210` $\rightarrow$ `RoleDashboard.tsx:activeCheck` |
| **Platform Administrator** | Guest Portal | Emergency mass QR token revocation | All guest portal sessions locked instantly | **Working** | `AdminConsole.tsx:L280` $\rightarrow$ `store.tsx:revokeAllTokens` |

---

## D. Identified Gaps

The following table catalogs operational gaps, missing safeguards, incomplete workflows, and documentation discrepancies discovered during the audit.

```
+----------------------------------------------------------------------------------------------------+
|                                    OPERATIONAL AUDIT GAP MATRIX                                    |
+----------------------------------------------------------------------------------------------------+
| [HIGH]   Financial Segregation of Duties (Dual-Control Refund Policy)                              |
| [HIGH]   Automated Beyond-Limit (>₹16k) Complaint Routing to Executive Queue                      |
| [MED]    Client-Side Render-Time SLA Evaluation vs. Server Daemonization                           |
| [MED]    Real-Time Bidirectional Guest-to-Fulfiller Chat Thread                                   |
| [LOW]    Physical Absence of Reference CSV Files on Disk                                           |
+----------------------------------------------------------------------------------------------------+
```

---

### Gap 1: Financial Segregation of Duties (Dual-Control Policy)
- **What Is Missing / Incorrect:** In `FinanceConsole.tsx`, a single Financial Operator (`Neha Kapoor`) can review, approve, and execute refunds up to ₹80,000 without requiring a secondary staff member ID to co-sign the transaction.
- **Affected Roles / Workflows:** Financial Operator, Duty Manager, Executive Approver (Workflow 3).
- **Why It Matters:** In standard hospitality banking and internal control frameworks (mandated in `PRD.md` Section 4.5 and `SECURITY.md`), initiating a refund and executing a refund must not be performed by the same actor without secondary dual-control approval to prevent fraud.
- **Priority:** **HIGH**
- **Evidence / Source Reference:** `FinanceConsole.tsx:L320-L380`, `SECURITY.md` Section 3 ("Separation of Duties").

---

### Gap 2: Automatic Routing of Beyond-Limit Complaints to Executive Approver Queue
- **What Is Missing / Incorrect:** When a guest complaint exceeds the Duty Manager's discretionary comp limit of ₹16,000, `DutyManagerConsole.tsx` correctly displays an approval lock (*"Amount exceeds manager discretionary limit (₹16,000)"*). However, it does not automatically inject a pending high-value authorization item into `ExecutiveConsole.tsx`'s Capex/Approval tab without manual offline coordination.
- **Affected Roles / Workflows:** Duty Manager, Executive Approver (Workflow 3 & 7).
- **Why It Matters:** High-value guest complaints (e.g., jewelry theft, structural property damage) can stall if not automatically escalated to the executive queue.
- **Priority:** **HIGH**
- **Evidence / Source Reference:** `DutyManagerConsole.tsx:L320-L345`, `ExecutiveConsole.tsx:L190-L240`.

---

### Gap 3: Render-Time SLA Timer Evaluation vs. Background Server Daemonization
- **What Is Missing / Incorrect:** In the client-side implementation (`src/lib/store.tsx`), Mean Time to Acknowledge (MTTA) and Mean Time to Resolve (MTTR) are evaluated using client timestamps during active browser rendering. If all staff browser tabs are closed, SLA escalation triggers do not execute in the background.
- **Affected Roles / Workflows:** Department Dispatcher, Department Supervisor, Duty Manager (Workflow 1 & 4).
- **Why It Matters:** For a frontend prototype, this is expected behavior. However, for a production hotel deployment, background workers (e.g., Redis + BullMQ as specified in `TECH_STACK.md`) are required to fire automated escalations when staff are offline.
- **Priority:** **MEDIUM**
- **Evidence / Source Reference:** `TECH_STACK.md`, `IMPLEMENTATION_GUIDE.md`, `src/lib/store.tsx`.

---

### Gap 4: One-Way Request Notes vs. Bidirectional Guest-to-Staff Chat
- **What Is Missing / Incorrect:** When a guest submits a request on `/guest/portal`, they can provide initial notes. If a fulfiller reports a blocker (e.g., *"Cannot enter: Do Not Disturb sign on door"*), the guest sees the blocker status on their portal, but cannot immediately reply with a quick message (e.g., *"Sorry, removing DND now, please enter"*).
- **Affected Roles / Workflows:** Guest Portal, Task Fulfiller, Department Dispatcher (Workflow 1).
- **Why It Matters:** Guests must phone the Front Desk to clear simple misunderstandings rather than tapping a quick response in the portal.
- **Priority:** **MEDIUM**
- **Evidence / Source Reference:** `GuestPortalView.tsx`, `TaskFulfillerConsole.tsx`.

---

### Gap 5: Missing Physical CSV Reference Files on Disk
- **What Is Missing / Incorrect:** The files `Role-Mainaccess.csv` and `Rolelevel-Accessapproach.csv` are referenced in sprint documentation and prompt instructions, but do not physically exist on disk in the repository.
- **Affected Roles / Workflows:** Platform Administrator, RBAC Governance.
- **Why It Matters:** System audits must rely on `PRD.md`, `SECURITY.md`, and `src/lib/roles.ts` rather than the raw original CSV tables.
- **Priority:** **LOW**
- **Evidence / Source Reference:** Workspace root file search.

---

## E. Recommended Work Order

To close the identified gaps efficiently without destabilizing existing functionality, the team should execute changes in the following sequential order:

```
+----------------------------------------------------------------------------------------------------+
|                                    RECOMMENDED WORK ORDER                                          |
+----------------------------------------------------------------------------------------------------+
| 1. High-Priority Dual-Control & Escalation Bridges (Sprint 1)                                      |
|    - Implement dual-control co-signature for refunds >₹20,000 in FinanceConsole                   |
|    - Wire >₹16,000 Duty Manager comp lock directly to Executive Approver pending queue            |
|                                                                                                    |
| 2. Interactive Cross-Screen Communication Enhancements (Sprint 2)                                  |
|    - Add quick-reply guest portal responses to fulfiller blocker notices                           |
|    - Add supervisor deficiency notification chime to fulfiller console                            |
|                                                                                                    |
| 3. Architecture & Infrastructure Hardening (Sprint 3 - Backend Transition)                         |
|    - Deploy Redis + BullMQ background worker daemon for independent server-side SLA timers         |
|    - Reconstruct physical reference CSV files (`Role-Mainaccess.csv`) for formal compliance audits |
+----------------------------------------------------------------------------------------------------+
```

### Step 1: Implement Dual-Control Refund Verification (High Priority)
- **Objective:** Ensure no single user can authorize and disburse large refunds.
- **Implementation Plan:** In `FinanceConsole.tsx`, when processing a refund $> ₹20,000$, require selection of a secondary verifying manager (`Marcus Vance` or `Priya Nair`) to record a co-approval signature before updating the ledger.

### Step 2: Connect Duty Manager >₹16k Comp Rejections to Executive Queue (High Priority)
- **Objective:** Eliminate manual escalation friction for high-value guest compensation claims.
- **Implementation Plan:** When a complaint comp $> ₹16,000$ is flagged in `DutyManagerConsole.tsx`, automatically generate a corresponding `ApprovalItem` in `store.tsx` visible in the Executive Approver Capex/Compensation tab (`ExecutiveConsole.tsx`).

### Step 3: Add Guest Quick-Reply to Fulfiller Blocker Notices (Medium Priority)
- **Objective:** Accelerate resolution of simple room access blockers.
- **Implementation Plan:** In `GuestPortalView.tsx`, if an active request has status `blocked` with reason `DND_ACTIVE`, render a 1-tap button: *"I am ready now — remove DND"*, which clears the blocker and alerts the fulfiller.

### Step 4: Background SLA Worker Daemonization (Medium Priority — Backend Phase)
- **Objective:** Ensure SLA escalations trigger even when browser tabs are closed.
- **Implementation Plan:** Transition client-side timestamp calculations to an independent Node.js / BullMQ worker process as outlined in `TECH_STACK.md` and `IMPLEMENTATION_GUIDE.md`.

### Step 5: Archive RBAC Matrix CSV Files (Low Priority)
- **Objective:** Preserve documentation traceability for external compliance audits.
- **Implementation Plan:** Export the active TypeScript role matrix (`src/lib/roles.ts`) to `Role-Mainaccess.csv` and `Rolelevel-Accessapproach.csv` in the project documentation directory.
