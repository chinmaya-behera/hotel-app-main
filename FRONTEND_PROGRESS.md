# FRONTEND_PROGRESS.md — Sprint Progress & Implementation Tracker

## 1. Sprint Dashboard
- **Sprint Target**: 36-Hour Frontend-Only Prototype
- **Sprint Target**: 36-Hour Frontend-Only Prototype
- **Status**: Phase 2 Complete (Task Fulfiller & Combined Department Dispatcher / Supervisor)
- **Host Runtime**: Node.js `v24.16.0` | npm `11.13.0` (PowerShell / Windows)
- **Scope**: Frontend-only web application (Next.js / React + Tailwind CSS), in-browser reactive mock store, role simulator. No backend, live database, or real payment/auth APIs.
- **Mandatory Cross-Role Rule**: We build by feature and workflow across roles — never by completing one role in isolation. Every feature is connected across public, staff, and guest surfaces using the shared frontend store.

---

## Phase 2 — Task Fulfiller & Combined Department Dispatcher / Supervisor (DONE)

### 1. Critical Role Structure Consolidation
- **One Combined Staff Role**: **Department Dispatcher / Supervisor** (`department_dispatcher_supervisor`, slug: `dispatcher-supervisor`, URL: `/staff/dispatcher-supervisor`).
  - Represents both operational personas: **Arjun Mehta** (`EMP-0104`, Dispatch Operations) and **Meera Nambiar** (`EMP-0105`, Quality & Readiness Supervision).
  - Merged all existing Dispatcher and Supervisor features into this unified console (`DispatcherSupervisorConsole.tsx`).
  - Preserved backward compatibility routes and aliases (`/staff/dispatcher` and `/staff/supervisor`), resolving cleanly to the combined console.
  - Removed duplicate Dispatcher and Supervisor role cards from the primary role picker list (`roles.ts`), while retaining alias lookups.
- **Task Fulfiller Remains Distinct**:
  - Dedicated mobile-first web app (`/staff/fulfiller`, role: `task_fulfiller`, persona: **Vikram Singh**, `EMP-0103`).
  - Scoped strictly to Housekeeping & Maintenance, Floors 1–5, Day shift.

### 2. Task Fulfiller Implemented Features
- **A. My Tasks and All Tasks (Segmented Control)**:
  - Prominent primary toggle between **[ My Tasks ]** and **[ All Tasks ]** in `FulfillerTasksTab.tsx`.
  - **My Tasks**: Strictly filters to tasks assigned to or self-claimed by Vikram Singh (`EMP-0103`). Sub-filters: `All Active`, `Pending Ack`, `In Progress`, `Blocked`, `Overdue`, and `Completed`.
  - **All Tasks**: Filters to all eligible department tasks across Housekeeping, Maintenance & Engineering, and F&B/Runner strictly within Floors 1–5. Tasks outside floors 1–5 or non-eligible departments are filtered out.
  - Unassigned open pool tasks display a glowing "Claim Task (Self-Assign)" button with target SLA countdown.
- **B. Claim Unassigned Tasks (With Frontend State Validation)**:
  - Fulfiller can self-claim unassigned tasks before supervisor assignment (`claimTask`).
  - Prevents conflicting claims: verifies `task.status === 'Unassigned' || task.status === 'Received'` and `(!task.assignee || task.assignee === fulfillerName)`. Rejects conflicting claims with error toast.
  - Claiming moves the task immediately into My Tasks, removes it from the open pool, logs an actor-tagged history entry, updates the combined Dispatcher/Supervisor console, and sends in-app notifications.
- **C. Reassign Request Approval Workflow**:
  - Fulfiller can request task reassignment with a documented reason (`requestTaskReassignment`).
  - Reassignment modal captures the reason and places the task into `Reassignment requested` status with `reassignPending: true`.
  - Routes directly to the combined Dispatcher / Supervisor console (`DispatcherBlockersTab.tsx`).
  - Supervisor reviews request: can **Approve** (selecting replacement attendant from the roster, e.g. Priya Sharma) or **Decline** (retaining original assignment with supervisor notes).
  - No silent reassignments: every decision logs an immutable actor-attributed timeline entry and triggers an in-app alert to Vikram.
- **D. Task Work Timeline**:
  - Chronological timeline on tasks powered by shared state (`task.history`).
  - Records: creation, assignment, self-claiming, status changes, photo evidence attachments, blockers reported/resolved, reassignment requests/approvals/rejections, and completion.
  - Each entry displays timestamp, status dot, responsible actor, role, and detailed operational notes.
- **E. Alerts & Dispatches**:
  - Dedicated mobile notifications tab (`FulfillerNotificationsTab.tsx`) with sound preference toggle (melodic chime audio via Web Audio API).
  - Quick action to "Acknowledge" individual dispatches or "Ack All".
  - Direct "View Task" navigation button on alerts with `itemId`, switching tabs and targeting the task.
- **F. Policies Tab**:
  - Dedicated bottom navigation tab (`FulfillerPoliciesTab.tsx`) with `ShieldCheck` icon.
  - Features ₹0 financial discretionary limit callout.
  - Lists allowed operational authority actions, strict negative boundaries requiring escalation, supervisor contact details, and department standard SLAs.

### 3. Combined Department Dispatcher / Supervisor Implemented Features
- **Renamed Navigation Tabs**:
  - "Dispatch" $\rightarrow$ **"Task Queue"**
  - "Team Workload & Roster" $\rightarrow$ **"Team Workload"**
  - "Dual SLAs & Escalations" $\rightarrow$ **"SLA Monitor"**
  - New dedicated tab: **"Blockers & Issues"**
  - New dedicated tab: **"Automation of Guest Messages"**
- **Task Queue & Manual Task Creation (`DispatcherQueueTab.tsx`, `CreateTaskModal.tsx`)**:
  - Comprehensive department request orchestration with multi-parameter search and filters (Department, Priority, Status, Floor).
  - Prominent "Create Task" button triggering `CreateTaskModal`: department, category, room, floor, title, description, priority, SLA turnaround, and assignment mode (leave unassigned in open pool or assign to specific staff member).
  - 1-click deterministic auto-assignment and batch assignment.
- **Team Workload & Balancing (`DispatcherWorkloadTab.tsx`)**:
  - Employee workload gauges, live shift availability, capacity controls, and 1-click workload redistribution.
- **Blockers & Issues Tab (`DispatcherBlockersTab.tsx`)**:
  - Dedicated tab displaying active field blockers and pending fulfiller reassignment requests.
  - Fulfiller Reassignment Reviews: interactive modal allowing supervisor to approve (with colleague picker from roster) or decline.
  - Active Fulfiller Blockers: clear blocker & resume task to `In progress`, reassign to colleague, or escalate to Duty Manager.
- **Automation of Guest Messages Tab (`DispatcherGuestMessagesTab.tsx`)**:
  - Automated status-triggered simulation engine with canned luxury templates:
    1. *Request Dispatched & En Route*
    2. *Service In Progress*
    3. *Quality Inspection Passed*
    4. *Service Completed*
    5. *Courtesy Turnaround Delay Notice*
  - Custom message editor with live parameter substitution (`Room {room}`, `Attendant {assignee}`).
  - Dispatched message log feed showing timestamp, room, template, and simulated push delivery status.
  - Prominent disclaimer highlighting frontend simulation without SMS/WhatsApp gateway costs.
- **SLA Monitor Tab (`DispatcherSlaTab.tsx`)**:
  - Filterable by SLA status, priority, and department.
  - KPI metric cards: Overdue Breaches, Approaching Deadline (<15m), On Track, and Unconfigured.
  - Explicitly marks tasks without source SLA targets as `Unconfigured` (avoiding invented durations).
- **Inspection Duties & Directives (`SupervisorInspectionsTab.tsx`, `InspectionModal.tsx`, `ReopenTaskModal.tsx`)**:
  - Receives inspection directives initiated by Department Manager or General Manager.
  - 5-category quality checklist inspection modal with dynamic score calculation and 85% pass threshold.
  - Mandatory deficiency reason touch-up reopenings dispatching corrective work orders back to attendants.
- **Shift Handover (`SupervisorHandoverTab.tsx`)**:
  - Connected to shared `shiftHandovers` foundation.
  - Logs outgoing/incoming supervisor, pending tasks, active blockers, critical notes, and shift sign-off.
- **Policies Tab (`DispatcherSupervisorConsole.tsx`)**:
  - Operational authority, negative boundaries, escalation paths, and shared service standards.

### 4. End-to-End Connected Workflows Verified
1. **Self-Claim Workflow**: Guest requests fresh towels $\rightarrow$ routes to Department Queue as `Unassigned` $\rightarrow$ appears immediately in Fulfiller "All Tasks / Open Pool" on Floor 4 $\rightarrow$ Vikram clicks "Claim Task" $\rightarrow$ state updates across system: task moves to Vikram's "My Tasks", assignee set to Vikram Singh, status `Assigned`, timeline entry added, and Dispatcher Task Queue reflects Vikram as owner.
2. **Blocker & Reassignment Workflow**: Vikram encounters "Do Not Disturb" on Room 402 $\rightarrow$ reports blocker with note $\rightarrow$ task status `Blocked` $\rightarrow$ appears in Dispatcher/Supervisor "Blockers & Issues" tab $\rightarrow$ Supervisor clears blocker with resolution instructions $\rightarrow$ Vikram's alert tab receives update $\rightarrow$ task resumes to `In progress`.
3. **Reassignment Request Workflow**: Vikram requests reassignment due to chemical shortage $\rightarrow$ task enters `Reassignment requested` $\rightarrow$ Supervisor opens "Blockers & Issues" $\rightarrow$ approves reassignment and picks Priya Sharma $\rightarrow$ task transfers to Priya, removes from Vikram's active tasks, and notifies Vikram of approval.
4. **Manual Dispatch Workflow**: Supervisor clicks "Create Task" in Task Queue $\rightarrow$ creates "HVAC Thermostat Calibration" on Room 304, leaves unassigned $\rightarrow$ immediately visible in Fulfiller Open Pool on Floor 3.
5. **Quality Inspection Directive Workflow**: Department Manager issues inspection directive for Room 501 $\rightarrow$ routes into Dispatcher/Supervisor inspection queue $\rightarrow$ Supervisor completes 5-category checklist $\rightarrow$ passes with 92% $\rightarrow$ room readiness updates to clean/inspected in PMS.

---

## Phase 1 — Hotel Project Restructuring & Shared Workflow Foundation (DONE)

### 1. Staff Role Structure Consolidation
- **Approved 8 Operational Staff Roles + Guest Portal**:
  1. **Task Fulfiller** (`task_fulfiller`, slug: `fulfiller`, URL: `/staff/fulfiller`): Vikram Singh (`EMP-0103`). Field attendants, runners, technicians.
  2. **Department Dispatcher / Supervisor** (`department_dispatcher_supervisor`, slug: `dispatcher-supervisor`, URL: `/staff/dispatcher-supervisor`): Arjun Mehta (`EMP-0104`) & Meera Nambiar (`EMP-0105`). Combined role integrating queue dispatching, 7-step auto-routing, room turnover readiness, 5-category quality checklist inspections, deficiency touch-up reassignments, and shift handovers. Backwards-compatible URL redirects and aliases for `/staff/dispatcher` and `/staff/supervisor`.
  3. **Department Manager** (`department_manager`, slug: `department-manager`, URL: `/staff/department-manager`): Marcus Vance (`EMP-0106`). Operational KPIs, room OOO block authority, service catalog creation, and inspection directives. Backwards-compatible alias for `/staff/duty-manager`.
  4. **Front Desk** (`front_desk_coordinator`, slug: `front-desk`, URL: `/staff/front-desk`): Sunita Patel (`EMP-0102`). PMS operations, arrivals/departures, room moves, key generation, and untagged request routing.
  5. **Financial Operator** (`financial_operator`, slug: `finance`, URL: `/staff/finance`): Neha Kapoor (`EMP-0107`). Billing, luxury tax invoices with auto 18% GST, adjustments, payments, and refund approvals up to ₹80,000.
  6. **Security Responder** (`security_responder`, slug: `security`, URL: `/staff/security`): Inspector Roy (`EMP-0108`). Mobile emergency SOS panic alerts, tactical schematics, and incident reports.
  7. **General Manager** (`general_manager`, slug: `general-manager`, URL: `/staff/general-manager`): Priya Nair (`EMP-0109`). Replaces Executive Viewer / Approver; full property analytics, cross-department directives, and high-value approvals up to ₹2,00,000. Backwards-compatible alias for `/staff/executive`.
  8. **Platform Administrator** (`platform_admin`, slug: `admin`, URL: `/staff/admin`): Rajesh Sharma (`EMP-0101`). User accounts, role scopes, QR code revocation, connector diagnostics, and audit logs.
  - **Guest Portal** (`/guest/portal` & `/hotel`): Separate guest-facing experience for booking, services, folio billing, and personal preferences.

### 2. Features Preserved from Merged Roles
- **From Department Dispatcher**:
  - Full Dispatch Queue with multi-criteria filters (Department, Priority, Floor, Status).
  - 7-Step Deterministic Auto-Assign Engine (`autoAssignTask`, `autoAssignAllPending`).
  - Manual Assignment Modal with live attendant capacity gauges (`AssignTaskModal.tsx`).
  - 1-Click Workload Rebalancer (`redistributeUnstartedTasks`).
  - Deduplication & Ticket Linking (`linkDuplicateTask`).
  - Auto-Routing Sandbox with interactive simulation testing (`DispatcherRoutingTab.tsx`).
  - Dual SLAs (MTTA < 5m, MTTR < 30m) & breach escalation (`DispatcherSlaTab.tsx`).
- **From Department Supervisor**:
  - 5-category quality checklist inspections with dynamic scoring and pass certification (`SupervisorInspectionsTab.tsx`, `InspectionModal.tsx`).
  - Mandatory deficiency reason touch-up reopenings (`ReopenTaskModal.tsx`).
  - Room Turnover & Readiness Matrix synced with Front Desk PMS (`SupervisorRoomsTab.tsx`).
  - Attendant reassignment review queue (`SupervisorTasksTab.tsx`).
  - Attendant workload capacity and availability controls (`SupervisorTeamTab.tsx`).
  - Blocker escalation to Duty Manager (`EscalateIssueModal.tsx`).
  - Shift Handover log and acknowledgment (`SupervisorHandoverTab.tsx`).
  - Blob CSV export and audit logs (`SupervisorReportsTab.tsx`, `SupervisorAuditTab.tsx`).

### 3. Shared Workflow Foundations Implemented (A–F)
- **A. Guest Request Routing Lifecycle**:
  - Guest requests created in Guest Portal (`submitGuestRequest`) automatically route:
    - Untagged or concierge requests $\rightarrow$ Front Desk queue (`front_desk_coordinator`) as `Received`.
    - Documented department requests $\rightarrow$ Department Dispatcher / Supervisor queue (`department_dispatcher_supervisor`) as `Unassigned` (Open Pool).
  - Fulfiller open pool self-claiming (`claimTask` in `FulfillerTasksTab.tsx`): any eligible fulfiller can claim an unassigned task before supervisor assignment.
  - Manual or auto-dispatch (`assignDispatcherTask`) assigns task to a specific fulfiller with immediate cross-role synchronization across Dispatcher, Fulfiller, and Guest Portal.
- **B. Guest Personal Requests (Preferences Foundation)**:
  - Associated at stay-level (`stay.preferences` in `FrontDeskState` and `state.guestPreferences[room]`).
  - Captures allergies, dietary requirements, room temperature, pillow preferences, DND status, and custom instructions.
  - Scoped visibility: Visible to Task Fulfiller on task cards and Front Desk on check-in/stay detail. Strictly isolated from Finance and Security roles.
  - Guest can view and edit preferences directly in Guest Portal (`HomeTab.tsx`), with instant reactive updates.
- **C. Service Creation and Department Mapping**:
  - Department Manager can create new hotel services (`ManagerServicesTab.tsx`, `createHotelService`): specifies name, department, category, price in ₹, estimated SLA minutes, and guest portal availability.
  - Newly created services immediately appear in the Guest Portal (`HousekeepingTab.tsx`), can be selected by guests, and route directly to the target department queue.
- **D. Shared Policies / Service Authority**:
  - Centralized registry in `src/lib/policies.ts`:
    - `ROLE_AUTHORITY_PROFILES`: Documented financial thresholds (Front Desk ₹2,500, Dept Manager ₹16,000, Finance ₹80,000, GM ₹2,00,000), explicit permissions, strict negative boundaries, and escalation chains for all 8 roles.
    - `SHARED_SERVICE_POLICIES`: Cross-department service standards with explicit `needsConfiguration` flags for items requiring property configuration.
  - Reusable TopBar action button (`ShieldCheck` icon) and `ServiceAuthorityModal.tsx` accessible to every role.
  - Embedded "Policies & Authority" tab in `DispatcherSupervisorConsole.tsx`.
- **E. Shift Handover Foundation**:
  - Reusable handover records (`ShiftHandover` in `src/types/demo.ts`) tracking outgoing/incoming staff, shift type, department, pending tasks list, critical issues, and acknowledgment status.
  - Supported in `SupervisorHandoverTab.tsx` and `ManagerHandoverTab.tsx`.
- **F. Inspections Foundation**:
  - Department Manager and General Manager can issue inspection directives (`ManagerInspectionsTab.tsx`, `initiateInspectionDirective`).
  - Instructions route directly into the Department Dispatcher / Supervisor inspections queue with high-priority badges, directive callouts, and manager notes.
  - Quality score calculation, pass certification, and deficiency reopening synced across roles.

### 4. Technical Constraints Upheld
- Frontend only: All state managed reactively via `useDemo()` and `localStorage`.
- Zero terminal commands or builds run.
- All currency formatted in Indian Rupee (`₹1,500`, `₹16,000`, `₹80,000`, `₹2,00,000`).

---

## 1g. Department Dispatcher Desktop Dashboard (`/staff/dispatcher`) — Status (DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Enterprise Desktop Dashboard Shell (`DispatcherConsole.tsx`)**:
  - Persona identity: **Arjun Mehta** (`EMP-0104`), Maintenance & Engineering (`department_dispatcher`).
  - Full-width enterprise container (`max-w-[1600px] w-full px-4 sm:px-6 lg:px-8`) with collapsible navigation sidebar and responsive mobile/tablet layout.
  - Active staff identity indicator (`Arjun Mehta · Maintenance & Engineering · EMP-0104`), breadcrumb trail, and direct link to Guest Mobile Web Portal.
  - Six dedicated operational sections: **Overview**, **Queue**, **Team Workload**, **Auto-Routing Engine**, **Dual SLAs & Escalations**, and **Reports & Analytics**.
- [x] **Dispatcher Overview & Urgent Triage (`DispatcherOverviewTab.tsx`)**:
  - Eight live, clickable KPI stat cards: Total Inbound Today, Unassigned Queue, Active in Field, Overdue SLAs, On-Duty Attendants, Auto-Assign Ratio (78%), Avg Response Time (2m 40s), and Escalated to Duty Manager.
  - Urgent Attention Queue highlighting critical issues, safety hazards, and overdue SLAs with 1-click auto-assign shortcuts.
  - Department Workload distribution meters for Housekeeping, Maintenance & Engineering, and Food & Beverage.
  - Live dispatch event feed stream filtered in real-time.
- [x] **Inbound Requests & Dispatch Queue (`DispatcherQueueTab.tsx`)**:
  - Search bar across reference IDs, room numbers, guest names, titles, and descriptions.
  - Multi-dimensional filters: Department (Housekeeping, Maintenance, F&B), Priority (Normal, VIP, Urgent, Safety, Critical), Status (Unassigned, Assigned, In Progress, Completed, Duplicate Linked, Escalated), and Floor (Levels 1–5).
  - Batch Actions: 1-Click "Auto-Assign All Pending" with remaining unassigned count reporting.
  - Table view and Grid/Cards view switcher.
  - Per-task operations:
    - **Manual Assign Modal (`AssignTaskModal.tsx`)**: Displays all active attendants with live workload capacity gauges (`activeTasks / maxWorkload`), shift availability (`On Duty`, `On Break`, `Off Duty`), floor matching tags, and department skills chips.
    - **1-Click Auto-Assign Engine (`autoAssignTask`)**: Runs deterministic decision hierarchy:
      1. Category-to-Department rule mapping.
      2. Active on-duty fulfiller filtering.
      3. Spatial floor zone affinity matching.
      4. Capacity limit checking (`activeTasks < maxWorkload`).
      5. Lowest active task count selection with tie-breakers.
    - **Ticket Deduplication Modal (`LinkDuplicateModal.tsx`)**: Links duplicate guest reports to primary operational tickets, setting `isLinkedDuplicate: true` and preventing double attendant dispatches.
    - **Duty Manager Escalation Modal (`EscalateTaskModal.tsx`)**: Direct escalation path to Marcus Vance (`EMP-0106`) with justification reason presets and instant alert creation.
    - **Slide-Over Task Inspector (`TaskDetailsDrawer.tsx`)**: Full chronological event timeline, dual SLA countdowns, attached photo evidence preview, and guest details.
- [x] **Team Workload & Capacity Board (`DispatcherWorkloadTab.tsx`)**:
  - Full roster of field personnel across departments (Vikram Singh, Wayne Chen, Kabir Sen, Sana Sheikh, Rohan Verma).
  - Real-time capacity load meters (`activeTasks / maxWorkload`) with visual thresholds (Green &lt;60%, Yellow 60–80%, Red &gt;80% Overload).
  - Shift availability status selector (`On Duty`, `On Break`, `Off Duty`) with instant synchronization.
  - **1-Click Workload Rebalancer Tool (`redistributeUnstartedTasks`)**: Analyzes workload distribution, detects overloaded attendants ($\ge 4$ tasks), and reassigns unstarted tasks to underloaded colleagues in the same department.
- [x] **Auto-Routing Engine & Sandbox Simulator (`DispatcherRoutingTab.tsx`)**:
  - Interactive rules table displaying category mappings, target roles, default priorities, and dual SLAs with toggle switches (`toggleRoutingRule`).
  - Interactive Simulation Sandbox: Dispatcher can test hypothetical guest requests (e.g. Room 305 AC leak or Room 518 VIP Champagne) and preview deterministic rule triggering, floor matching, and chosen personnel before injecting into the live queue.
- [x] **Dual SLA Timers & Escalations (`DispatcherSlaTab.tsx`)**:
  - Transparent dual SLA policies: Acknowledgment SLA (MTTA &lt; 5m) vs Resolution SLA (MTTR &lt; 30m).
  - Live Overdue SLA breach monitor with immediate Duty Manager escalation actions.
  - Full Duty Manager escalation log with attributable reasons and timestamps.
- [x] **Operational Analytics & Transparency (`DispatcherReportsTab.tsx`)**:
  - Real-time analytics computed directly from the in-browser mock store.
  - Auto-Dispatch vs Manual Dispatch ratio (78% vs 22%).
  - Volume breakdown by department (Housekeeping 40%, Maintenance 35%, F&B 25%).
  - Hourly request intake curve showing peak demand hours (09:00 checkout surge).
- [x] **Cross-Role Synchronisation**:
  - Guest Portal requests $\rightarrow$ Dispatcher Queue $\rightarrow$ Assigned to Fulfiller $\rightarrow$ Fulfiller App notifications & queue update $\rightarrow$ Fulfiller progress syncs back to Dispatcher and Guest Portal live request history.

### Department Dispatcher Feature-to-Source Mapping Matrix

| Feature | Supporting Document / Diagram | Connected Roles / Workflows | Implementation Status | Unresolved Source Gaps |
|---|---|---|---|---|
| **Enterprise Desktop Shell** | `roles.ts` (`surface: 'desktop'`), `Role-Mainaccess.csv` | Department Dispatcher (`/staff/dispatcher`) | **Complete** | None. Full-width desktop container with collapsible sidebar. |
| **8 Live Metric Cards** | User Prompt Section 2, Domain 2 ER Diagram | Dispatcher Overview | **Complete** | None. Live metrics linked to queue filters. |
| **Multi-Dimensional Queue Filters** | Backlog F01-F04, Domain 2 `TASK` Model | Housekeeping, Maintenance, F&B | **Complete** | None. Search, Dept, Priority, Status, and Floor filters. |
| **Deterministic Auto-Assign Engine** | Spec Section 2, User Prompt Algorithm | Fulfiller (`task_fulfiller`), Guest Portal | **Complete** | None. 7-step deterministic matching based on dept, floor, and load. |
| **Manual Assignment Modal** | Spec Section 2, `StaffAccount` model | All Field Attendants | **Complete** | None. Shows live capacity meters, availability, and skills. |
| **1-Click Workload Rebalancer** | Spec Section 2, `FRONTEND_PROGRESS.md` | Field Attendants | **Complete** | None. Rebalances unstarted tasks from overloaded staff. |
| **Ticket Deduplication Engine** | Backlog `isLinkedDuplicate`, Spec Section 2 | Dispatcher, Guest Portal | **Complete** | None. Links duplicate tickets and prevents double dispatch. |
| **Duty Manager Escalation** | `Role hierarchy and escalation.png`, Spec Section 2 | Duty Manager (`Marcus Vance`) | **Complete** | None. Dispatches critical escalation alerts with reason capture. |
| **Routing Sandbox Simulator** | Admin and IT workflow, Spec Section 2 | Dispatcher Engine | **Complete** | None. Interactive preview of deterministic matching with injection. |
| **Dual SLA Tracking (MTTA / MTTR)** | Admin and IT workflow, User Prompt Section 2 | Operations & Management | **Complete** | None. Dual timers for Ack SLA vs Resolution SLA. |
| **Cross-Role Live Sync** | `How a request flows in the app.png` | Guest Portal, Fulfiller, Duty Manager | **Complete** | None. Real-time synchronisation across shared store. |

| **Cross-Role Live Sync** | `How a request flows in the app.png` | Guest Portal, Fulfiller, Duty Manager | **Complete** | None. Real-time synchronisation across shared store. |

---

## 1h. Dispatcher Floor-Based Assignment, Individual Capacity & Workload Balancing (PART A — DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Deterministic 7-Step Auto-Assignment Engine (`autoAssignTask` in `store.tsx`)**:
  - Implemented strict 7-rule decision hierarchy:
    1. Match task's required department against staff profiles (`staff.department === targetDept`).
    2. Spatial floor/zone matching using range parser `matchesFloorZone` (supports `Floor 4`, `Floors 1–3`, `Floors 4–5`, `All floors`).
    3. Exclude unavailable, inactive, or off-duty personnel (`isAvailable && shiftStatus === 'on_duty'`).
    4. Exclude personnel who have reached or exceeded their configured task capacity (`activeCount >= maxWorkload`).
    5. Select eligible employee with lowest active workload.
    6. Deterministic tie-breaker: alphabetical sort by staff name (`a.name.localeCompare(b.name)`).
    7. Record assignment decision in shared mock state, trigger notification, append audit event, or return explicit failure reason (`No staff in department`, `All eligible staff at full capacity`, `No staff available on floor`) without silently dumping tasks onto overloaded personnel.
- [x] **Individual Employee Task Capacity Controls (`DispatcherWorkloadTab.tsx`)**:
  - Added `updateStaffCapacity(staffId, newCapacity)` to store API and state reducer.
  - Individual Capacity Editor Modal: Configurable limit (1–20 active tasks) with numeric stepper and quick presets (3, 5, 8, 10, 15).
  - Validates input to prevent negative or zero capacity.
  - Real-time remaining capacity counter displayed in staff cards (`X available slots` / `0 slots (Full)`).
  - Dynamic `Overloaded` warning badge for personnel with active tasks $\ge$ max workload.
- [x] **Manual Workload Balancing with Proposed Impact (`AssignTaskModal.tsx`)**:
  - Live employee selector showing active load vs. maximum capacity (`active / maxLoad`).
  - Proposed load preview before confirming (`currentLoad / maxLoad → proposedLoad / maxLoad`).
  - Floor match indicator chips (`Floor Match` vs `Cross-Floor`).
  - Overload prevention gate: Reassignment to full-capacity staff is blocked unless Dispatcher checks the authorized override checkbox and enters a mandatory justification reason.
  - Updates previous and new assignee workloads instantly while preserving task history and SLA timers.

---

## 1i. Global Role Header Cleanup & Enterprise Profile Controls (PART B — DONE)

**Applied across all operational staff roles (`TopBar.tsx`, `AdminConsole.tsx`, `DispatcherConsole.tsx`, `RoleDashboard.tsx`)**
- [x] **Removed Navigation Clutter & Redundant Hero Sections**:
  - Removed `Staff Portals` breadcrumb link and role directories from individual dashboard headers.
  - Removed redundant employee identity / department subtitle text directly beneath top bars.
  - Removed `Switch Role` button from operational headers (role switching remains properly secluded to `/login`).
  - Removed visible `Demo mode · simulated data` disclaimer badges.
  - **Eliminated all lower hero sections across operational dashboards**:
    - Removed Admin hero strip (`Security scopes, staff accounts, QR sessions...` and `Active Administrator Session`).
    - Removed Front Desk hero strip (`Guest arrivals, stay management...` and `Live sync active`).
    - Removed Duty Manager hero strip (`Real-time operational monitoring...` and `Duty Manager Session`).
    - Removed Dispatcher hero strip (`Intelligent queue management, floor-based auto-routing...` and `Active Dispatcher Session`).
    - Removed generic `hero-glow` panel across remaining staff role dashboards in `RoleDashboard.tsx`.
  - **Moved Scope Selector**: Re-anchored the "My Department" vs "Entire Hotel" operational scope switcher to the bottom of the collapsible sidebar in `DutyManagerConsole.tsx`.
- [x] **Preserved Enterprise Profile & Session Controls**:
  - Retained authentic employee profile pill with status dot, name, and department.
  - Retained in-app notifications bell with real-time unread badge counter.
  - Retained global light/dark theme toggle.
  - Retained dedicated **Logout** action with confirmation modal (`"Sign out of [Employee Name]?"`) safely routing back to `/login`.

---

## 1j. Front Desk Usability Polish & Accessible Modal Help (PART C — DONE)

**Targeted UI enhancements (`FrontDeskConsole.tsx`, `RoleDashboard.tsx`)**
- [x] **Full Desktop Width Expansion**:
  - Expanded Front Desk container to `max-w-[1600px] w-full px-4 sm:px-6 lg:px-8`, matching Admin, Dispatcher, and Duty Manager.
  - Upgraded main operational grid to `lg:grid-cols-[minmax(0,2.5fr)_minmax(320px,1fr)]`, maximizing usable space for arrivals, stays, rooms, and complaints tables.
  - Responsive tablet and mobile layouts fully preserved.
- [x] **Accessible Contextual Help Modal**:
  - Removed permanently visible Gesture Guide panel from main layout.
  - Added compact, accessible `Gesture Guide` button (`HelpCircle` icon) in Front Desk sub-header.
  - Opens accessible dialog modal with keyboard support (`Escape` to close), focus trap, and touch gesture visual guide.
- [x] **Authority Panel Cleanup**:
  - Removed visible `Your authority` card to reduce visual distraction.
  - Preserved all underlying Front Desk authority limits (₹4,000 compensation ceiling, supervisor escalations, room move validations) in `frontDesk.ts`.

---

## 1k. Department Manager / Duty Manager Enterprise Console (`/staff/duty-manager`) (PART D — DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Enterprise Operations Shell (`DutyManagerConsole.tsx`)**:
  - Persona identity: **Marcus Vance** (`EMP-0106`), Duty & Operations (`department_manager`).
  - Branded **The Grand ADP** with full desktop width (`max-w-[1600px]`) and collapsible sticky sidebar.
  - Nine modular operational sections: **Overview**, **Operations**, **Workforce**, **Escalations**, **Resources**, **Duty Incidents**, **Shift Handover**, **Reports & Analytics**, and **Audit Log**.
- [x] **Functional Scope Selector**:
  - Toggles between **"My Department"** (Duty & Operations) and **"Entire Hotel"** (all 6 departments).
  - Dynamically filters KPI cards, task queues, employee rosters, and escalations based on selected operational scope.
- [x] **Manager Overview & 8 Filterable KPI Cards (`ManagerOverviewTab.tsx`)**:
  - 8 live KPI cards: Active Tasks, Pending Approval / Assign, In Progress, Completed Today, Overdue SLA Breaches, Critical Escalations, Available Staff, and Departments Requiring Attention.
  - 1-click navigation from KPI cards to filtered operational tabs.
  - Department workload saturation meters with visual thresholds.
  - 5-level floor task breakdown matrix.
  - Live escalation ticker and urgent attention alerts.
- [x] **Interactive Task Monitoring (`ManagerOperationsTab.tsx`)**:
  - Multi-dimensional search and filters: Department, Status, Priority, Floor.
  - Slide-over Task Detail Inspector with complete event timeline, guest info, and photo evidence.
  - Append Managerial Directive Notes directly to active tasks in shared state.
- [x] **Workforce Directory & Capacity Management (`ManagerWorkforceTab.tsx`)**:
  - Staff roster across departments showing active load, configured capacity, shift status, and saturation bar.
  - Dynamic `Overloaded` warnings for attendants at capacity.
  - 1-Click "Redistribute Tasks" action triggering Dispatcher workload rebalancing.
- [x] **Escalations & Service Recovery (`ManagerEscalationsTab.tsx`)**:
  - Direct synchronization with Front Desk guest complaints queue (`frontDesk.complaints`).
  - Goodwill Compensation Authorization Modal: Authorize folio credits up to the documented ₹16,000 Duty Manager ceiling.
  - Authorizing compensation transitions complaint to `Resolved`, updates Front Desk case ownership, and dispatches folio credit.
- [x] **Resource & Equipment Requisitions (`ManagerResourcesTab.tsx`)**:
  - Tracks supply shortages, equipment failures, and staffing requests across departments.
  - Review Modal: Authorized Approve or Decline actions with managerial reason capture.
  - Create Requisition Form: Dispatch new supply requests directly into shared demo state.
- [x] **Duty Incident Command & Cross-Department Coordination (`DutyOperationsTab.tsx`)**:
  - Property-wide incident command tracking affected rooms, departments, and incident coordinators.
  - Incident status lifecycle: `investigating` $\rightarrow$ `contained` $\rightarrow$ `resolved`.
  - Cross-department blocked task tracking with dependency resolution notes.
- [x] **Shift Handover Briefing & Sign-Off (`ManagerHandoverTab.tsx`)**:
  - Shift Handover Form: Auto-calculates queue metrics (active, overdue, complaints, open incidents).
  - Outgoing and incoming lead assignment with handover note capture.
  - Preview Mode before formal submission.
  - Handover Archive Log with 1-click formal acknowledgment sign-off.
- [x] **Analytics & Browser CSV Reporting (`ManagerReportsTab.tsx`)**:
  - SLA on-time compliance rate, department turnaround breakdown, and complaint resolution rate.
  - Native client-side CSV export (`Blob` + `HTMLAnchorElement`) with zero external package dependencies.
- [x] **Operational Audit Log (`ManagerActivityTab.tsx`)**:
  - Chronological audit ledger recording managerial notes, requisitions, incidents, and handovers.
  - Filter by category (`Tasks`, `Staff`, `Escalations`, `Resources`, `Incidents`).

---

## 1l. Curated Luxury Pastel "Baby Theme" & High-Visibility Top Bar (DONE)

**Applied across all views and staff portals in light mode (`globals.css`, `frontdesk.css`, `TopBar.tsx`)**
- [x] **Multi-Tonal Pastel "Baby Theme" Canvas**:
  - Replaced flat monochromatic / yellowish tones with a sophisticated, soothing multi-color baby pastel system:
    - Base canvas: Soft porcelain with baby blush mist (`#f9f3f6`).
    - Ambient radial background glows blending **Baby Powder Blue** (`#b3cde0` / `rgb(179 205 224 / 0.5)`), **Baby Rose Petal** (`#f4b6c2` / `rgb(244 182 194 / 0.45)`), **Seafoam Aqua Mist** (`#83d0c9` / `rgb(131 208 201 / 0.32)`), and **Sweet Rose Quartz** (`#eec9d2` / `rgb(238 201 210 / 0.4)`).
    - Eliminates the flat single-color look and harsh clinical white, creating a warm, multi-dimensional luxury hospitality atmosphere.
- [x] **High-Visibility Distinct Top Bar ("Upper Task Bar")**:
  - Transformed the sticky header into a distinct, clearly defined, elegant powder-sky navbar:
    - Gradient: `linear-gradient(180deg, #e4eff9 0%, #d8e8f6 100%)`.
    - Anchoring border: `1.5px solid rgba(100, 151, 177, 0.38)` (`#6497b1`).
    - Subtle drop shadow: `0 4px 20px -2px rgba(1, 31, 75, 0.09)`.
    - Clearly demarcated from the soft blush canvas below it, framing the page with visual structure and authority.
  - Enhanced internal top bar elements in light mode:
    - Title & staff name in deep classic navy (`#011f4b`).
    - Staff identity pill rendered as frosted enamel porcelain (`rgba(255, 255, 255, 0.88)` with slate border).
    - Notification bell & theme toggle as tactile white porcelain buttons.
    - Logout button styled with a delicate baby-rose border (`#f4b6c2`) and deep raspberry text (`#be185d`).
- [x] **Crisp Floating Porcelain Cards & Vibrant Sidebars**:
  - Cards and panels styled as crisp porcelain (`rgba(255, 255, 255, 0.93)`) with soft rose-slate borders (`#ead5dc`) and gentle floating shadows.
  - Active sidebar items styled as striking, tactile gradient pills with pure white text (`#ffffff !important`).
  - Urgent Attention section rendered in soothing baby rose (`#f4b6c2` / `linear-gradient(135deg, rgba(255, 240, 243, 0.92), rgba(253, 233, 238, 0.88))`).
  - Stat cards given distinct pastel accents (peach for pending, seafoam for active, rose for overdue, sky for SLAs).

---

## 1f. Realistic Role Experience & Mobile-First Task Fulfiller App (`/staff/fulfiller`) — Status (DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Individual Employee Account Experience (`TopBar.tsx` across all 9 roles)**:
  - Eliminated the global 9-role switcher rail and "Demo mode · simulated data" badges from staff role dashboards.
  - Authentic employee header showing active staff identity: avatar initials circle, staff name, department, and shift schedule (e.g. `Vikram Singh · Housekeeping · Day Shift · On Duty`).
  - Active in-app notification bell with real-time unread badge counter and popover drawer.
  - Color theme toggle (Dark / Light mode) with global persistence.
  - Dedicated **Logout** action with confirmation modal (`"Sign out of Vikram Singh (Housekeeping)?"`) routing safely back to `/login` (Portal Login).
- [x] **Dedicated Mobile-First Viewport Container (`FulfillerApp.tsx`)**:
  - Grounded in `roles.ts` (`surface: 'mobile'`), `Housekeeping and amenities.png`, and Spec Section 3.
  - Centered phone-sized interface on desktop (`w-[412px] h-[844px]` with realistic bezel, speaker notch, and high-depth shadow) and 100% full-screen adaptive viewport on mobile devices.
  - Fixed bottom navigation bar with live indicator badges: **My Tasks**, **Alerts** (Notifications), **Performance**, **Profile**.
  - Restrained transitions respecting `prefers-reduced-motion` and global light/dark theme support.
- [x] **Task Management & Priority Lifecycle (`FulfillerTasksTab.tsx`)**:
  - Filter pills: `Active Tasks`, `Pending` (Assigned), `In Progress` (Accepted / In progress / On the way), `Overdue` (SLA breached), and `Completed`.
  - Task cards displaying Room / Location badge, Priority tags (`VIP`, `Urgent`, `Safety`, `Normal`), SLA countdown deadline (`Due in 4m`, `Overdue 8m`), and Guest Portal origin indicator.
  - Strict documented lifecycle state machine: **Assigned** $\rightarrow$ **Accepted** $\rightarrow$ **In Progress** $\rightarrow$ **Completed**.
  - Invalid state transitions prevented. State changes persist across the shared in-browser mock store (`useDemo()`).
  - Task Detail Modal with full instructions, guest notes, order checklist items, and complete status timeline history (`item.history`).
- [x] **Mandatory Photo Evidence Attachment (`FileReader` Data-URL)**:
  - Frontend-only camera / gallery file picker previewing images directly in local browser state via `FileReader.readAsDataURL`.
  - Enforced completion rule: Tasks flagged with `evidenceRequired` (e.g. `Deep clean · Room 210` turnover) strictly require an attached photo before the "Complete Task" action is permitted.
  - Preview thumbnail displayed in task cards and inspector modal, and rendered into the Guest Portal requests tab.
- [x] **Task Blocker & Reassignment Review Workflows**:
  - Fulfiller can report blockers with mandatory reason capture (`"Guest requested privacy (DND)"`, `"Awaiting fresh linen"`, `"Room locked"`, `"Plumbing issue"`) $\rightarrow$ transitions task to `Blocked`.
  - Fulfiller can request reassignment with reason $\rightarrow$ task transitions to `Reassignment requested` (`reassignPending: true`), routing an inspection/review item into Department Supervisor (`Meera Nambiar`)'s queue without silently dropping the task.
- [x] **Synthesised Web Audio Notification Chime (`chime.ts`)**:
  - Pure Web Audio API synthesised 2-tone melodic chime (587.33Hz $\rightarrow$ 880Hz) with exponential gain decay.
  - Plays when new tasks are dispatched to the fulfiller's queue after user interaction.
  - Accessible sound mute/unmute toggle in header, profile, and notification tab with "Test Chime" button.
- [x] **Shift Performance Scorecards (`FulfillerPerformanceTab.tsx`)**:
  - Real-time KPI metrics computed transparently from active mock tasks: Shift completion rate %, on-time SLA rate %, average completion turnaround (11m 40s), overdue count, and quality inspection pass rate (100%).
  - Transparent methodology explainer clarifying that metrics calculate live from the staff member's shift queue.
- [x] **Fulfiller Profile, Availability & Emergency Handover (`FulfillerProfileTab.tsx`)**:
  - Employee card: Vikram Singh (EMP-0103, Housekeeping, Floors 1–5). Assigned supervisor: Meera Nambiar (EMP-0105).
  - Shift availability status toggle: **On Duty** vs **On Break** with instant feed logging.
  - Emergency Shift Handover Modal: Urgent relief request with reason selection (`Medical emergency`, `Family emergency`, `Severe fatigue`) dispatched directly to Duty Manager (`Marcus Vance`) with pending review badge.
- [x] **Cross-Role Guest Portal $\leftrightarrow$ Fulfiller Connectivity**:
  - Guest service requests submitted in the Guest Portal (`Housekeeping` or `Room Service`) immediately appear in `items.task_fulfiller` with status `Assigned` and trigger in-app chime and notifications.
  - Fulfiller actions (`Accepted` $\rightarrow$ `In progress` $\rightarrow$ `Completed`) immediately reflect in the guest's live request timeline with matching timestamps.
  - Completed turnover tasks trigger `afterAdvance` in `frontDesk.ts`, transitioning room cleanliness to `inspection_pending` and dispatching inspection work to Department Supervisor.

### Fulfiller Feature-to-Source Mapping Matrix

| Feature | Supporting Document / Diagram | Connected Roles / Workflows | Implementation Status | Unresolved Source Gaps |
|---|---|---|---|---|
| **Mobile-First Phone Viewport** | `roles.ts` (`surface: 'mobile'`), `Housekeeping and amenities.png` | Task Fulfiller (`/staff/fulfiller`) | **Complete** | None. Centered phone container on desktop, full screen on mobile. |
| **Authentic Employee Headers** | User Prompt Section 2, `SECURITY.md` | All 9 Staff Roles (`TopBar.tsx`) | **Complete** | None. Shows active employee name, department, shift, notifications, and Logout modal. |
| **Task Queue & Priority Filters** | Sprint Backlog F01-F04, `Housekeeping and amenities.png` | Housekeeping, F&B Runners | **Complete** | None. All, Pending, In Progress, Overdue, and Completed filter tabs. |
| **Task Lifecycle Machine** | `How a request flows in the app.png` | Fulfiller, Dispatcher, Guest Portal | **Complete** | None. Strict Assigned $\rightarrow$ Accepted $\rightarrow$ In Progress $\rightarrow$ Completed progression. |
| **Mandatory Photo Evidence** | Spec Section 4, `FRONTEND_FEATURE_MAP.md` | Fulfiller, Guest Portal, Supervisor | **Complete** | None. Local Data-URL preview; completion blocked if evidence required and missing. |
| **Supervisor Reassignment Request** | `Role hierarchy and escalation.png`, Spec Section 4 | Supervisor (`Meera Nambiar`), Dispatcher | **Complete** | None. Reassignment requests route to supervisor with reason; task remains tracked. |
| **Web Audio Notification Chime** | User Prompt Section 4, Web Audio API | Fulfiller In-App Audio Engine | **Complete** | None. Synthesised chime with accessible toggle and test button. |
| **Shift Performance Scorecard** | Spec Section 4, `FRONTEND_PROGRESS.md` | Fulfiller, Operations Head | **Complete** | None. Transparent live calculations from active queue. |
| **Emergency Shift Handover** | Spec Section 4, `Duty Manager and escalations.png` | Duty Manager (`Marcus Vance`) | **Complete** | None. Dispatches relief request with reason and status tracking. |
| **Guest Service Connected Sync** | `How a request flows in the app.png`, Guest Portal | Guest Portal (`RequestsTab`), Front Desk | **Complete** | None. Fulfiller status and completion evidence sync live to Guest Portal. |

---

---

## 1a. Corrected Website Entry Flow & Navigation (DONE)

- [x] **Root URL (`/`)**: Directly serves the **Public Hotel Website** (`HotelPreview.tsx`) instead of the internal role-selection dashboard.
- [x] **Simulated Login Route (`/login`)**: Serves the 9-role switcher dashboard (`HomeView.tsx`) with clear branding: "Portal login".
- [x] **Top Navigation Update**: Prominent **Staff Login** button replaced the old "Demo Home" button in `HotelNavbar.tsx` (desktop & mobile drawer).
- [x] **Cross-Surface Navigation**: Clicking "Staff Login" from anywhere on the public website opens `/login` where all 9 employee roles can be selected.
- [x] **Guest Journey Continuity**: Guest Portal remains accessible via `/guest/portal?room=402&token=demo-token`, QR links, and stay-linked handoffs from the public website and Front Desk.

---

## 1e. Platform Administrator (`/staff/admin`) — Status (DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Full-Width Responsive Desktop Console (`AdminConsole.tsx`)**:
  - Full desktop width utilization (`max-w-[1600px] w-full px-4 sm:px-6 lg:px-8`) with collapsible navigation sidebar.
  - Active staff identity indicator (`EMP-0101 · Rajesh Sharma · IT & Systems`).
  - Seven dedicated operational sections: Overview, Staff RBAC, Room QRs, Dual SLAs, Integrations, Audit Trail, Environment.
- [x] **Admin Overview & System Health (`AdminOverviewTab.tsx`)**:
  - Live system health KPIs: Active staff (11/12), healthy integration gateways (3/4), active vs revoked room QR tokens (27 units), open payment-PMS sync issues (from Front Desk sync state).
  - Pending administrative requests queue (Backlog `adm-1` to `adm-3`): S. Iyer dispatcher grant, T. Brandt spa revocation, and PMS vendor time-boxed support access. One-click Approve & Grant or Reject.
  - Workflow simulator sandbox: One-click dispatch of test tasks to Housekeeping, Maintenance, and F&B.
- [x] **Staff Accounts & RBAC Governance (`StaffRosterTab.tsx`)**:
  - Grounded in `ER_DIAGRAMS.md` Domain 1 (`STAFF_ACCOUNT`, `PROFILE_GRANT`, `GRANT_SCOPE`, `FINANCIAL_LIMIT`) and `SECURITY.md`.
  - Filterable by Department, Profile Grant, and Active/Inactive status + live text search.
  - Real-time **Active / Inactive Status Toggle**: Immediately updates state, invalidates access, and records attributable event in the audit trail.
  - **Edit Role & Scopes Modal**: Modify profile grants, floor zone scopes, and shift schedules.
  - **Provision Staff Modal**: Add new employee accounts with auto-generated employee ID and financial limits.
  - **Architectural 9-Role RBAC Matrix**: Interactive visual matrix mapping 16 operational capabilities to the 9 profiles with clear boundary explanations.
- [x] **Room Units & In-Room QR Tokens (`RoomQrTab.tsx`)**:
  - Grounded in `ER_DIAGRAMS.md` Domain 2 (`SERVICE_LOCATION`, `QR_MAPPING`, `GUEST_SESSION`), `SECURITY.md` T-10, and Spec Fix 3.
  - Comprehensive inspection of all 27 rooms across Levels 1 to 5.
  - Real-time token digest (`qr_tok_adp_...`), verified in-house guest link, room readiness status, and floor filter.
  - **Emergency QR Revocation & Restoration**: Instantly revoke individual room QR sessions (or trigger property-wide lockdown). Immediately updates `state.revokedRooms`, locking the Guest Portal for that unit.
  - **Copy QR URL** and **Launch Guest Portal** deep links.
- [x] **Dual SLA & Workflow Engine (`WorkflowConfigTab.tsx`)**:
  - Grounded in Spec Fix 4 (Dual SLA Clocks) and `Admin and IT workflow.png`.
  - Independent **Response SLA** (1–15m, default 5m) and **Resolution SLA** (5–60m, default 20m) countdown sliders.
  - Financial comp ceilings: Front Desk (₹4,000), Duty Manager (₹16,000), and Executive approval threshold (>₹16,000).
  - Booking cancellation policy (2 days free cancel) and early check-in fee (`money(3200)`).
  - **Test Workflow Engine**: Dispatches test requests with priority tags into the Department Dispatcher queue to verify SLA countdowns without waiting for real guest bookings.
- [x] **Integrations & Reconciliation Gateways (`IntegrationsTab.tsx`)**:
  - Grounded in `Admin and IT workflow.png`, `ER_DIAGRAMS.md` Domain 4, and Spec Fix 1 / F14.
  - Connectors: Opera Cloud PMS, Micros Simphony POS & KDS, Razorpay / Stripe Payments, Twilio / WhatsApp Cloud API.
  - Simulated state toggle (`healthy`, `degraded`, `down`) with active fallback process descriptions.
  - **Diagnostic Latency Ping**: Tests roundtrip latency (e.g. 38ms OK) and records success/failure in the audit trail.
  - **Live Payment-PMS Reconciliation Card**: Directly reads `state.frontDesk.sync` and links to Front Desk Reconcile tab.
- [x] **Immutable Audit Trail (`AuditTrailTab.tsx`)**:
  - Grounded in `ER_DIAGRAMS.md` Domain 4 (`AUDIT_EVENT`), `SECURITY.md` T-13/T-18, and `Admin and IT workflow.png`.
  - Chronological log of all administrative actions, staff status changes, SLA updates, emergency QR revocations, and diagnostic pings.
  - Filter by category (`Access`, `Workflow`, `Integration`, `Hotel`, `Security`) and outcome (`Success`, `Warning`, `Denied`).
  - Export audit log to JSON.
- [x] **Demo Data & Environment Diagnostics (`EnvironmentTab.tsx`)**:
  - In-browser local storage record counters (tasks, stays, bookings, folios, staff, audit events).
  - Frontend-only boundary guarantees.
  - Run simulated daily night audit and safe demo state reset modal.

### Compact Feature-to-Source Mapping Matrix

| Feature | Supporting Document / Diagram | Connected Roles / Workflows | Implementation Status | Unresolved Source Gaps |
|---|---|---|---|---|
| **System Overview & Health KPIs** | `Admin and IT workflow.png` | Front Desk (Sync issues), All Staff | **Complete** | None. Fully wired to live mock store. |
| **Pending Admin Requests (adm-1..3)** | Sprint Backlog & Feature Spec | HR, Spa, PMS Vendor | **Complete** | None. One-click decision with audit log. |
| **Staff Accounts & RBAC Roster** | `ER_DIAGRAMS.md` Domain 1, `SECURITY.md` | All 9 Roles, Dispatcher (S. Iyer) | **Complete** | None. Active status toggle updates shared state. |
| **Role-Permission Matrix (16 rules)** | `SECURITY.md`, `PRD.md` | All 9 Profiles | **Complete** | None. Grounded in separation-of-duties rules. |
| **Room QR Code Tokens & Revocation** | `ER_DIAGRAMS.md` Domain 2, Spec Fix 3, T-10 | Guest Portal, Front Desk, Housekeeping | **Complete** | None. Revoking immediately locks Guest Portal. |
| **Dual SLA Timers (Response/Resolution)** | Spec Fix 4, `Admin and IT workflow.png` | Department Dispatcher, Supervisor, Duty Mgr | **Complete** | None. Sliders update live config and audit trail. |
| **Financial Comp Ceilings** | `PRD.md` REQ-08, `DECISIONS.md` | Front Desk, Duty Manager, Executive | **Complete** | Standardized to INR ₹ (₹4k / ₹16k / >₹16k). |
| **Workflow Engine Test Dispatcher** | `Admin and IT workflow.png` (Workflow test) | Department Dispatcher | **Complete** | None. Injects sample task into live queue. |
| **Connector Health & Latency Pings** | `Admin and IT workflow.png` (Integration test) | Opera PMS, Micros POS, Payments, Twilio | **Complete** | None. Toggles state and simulates ping latency. |
| **Payment-PMS Sync Reconciliation** | Spec Fix 1 / F14, `ER_DIAGRAMS.md` Domain 4 | Front Desk (Reconcile tab), Finance | **Complete** | None. Monitored live from `frontDesk.sync`. |
| **Immutable Audit Event Log** | `ER_DIAGRAMS.md` Domain 4, `SECURITY.md` | System-wide actions | **Complete** | None. Appends real events on every admin action. |
| **Indian Rupee (INR ₹) Standard** | User Prompt & Indian Hotel Context | Website, Guest Portal, Front Desk, Admin | **Complete** | Standardized to `₹` with `en-IN` grouping. |

---

## 1b. Public Hotel Website & Booking Flow (`/hotel`) — Status (DONE)

**Built (frontend only, reactive mock store, connected workflows)**
- [x] **Brand & Layout**: The Grand ADP. Full desktop luxury navigation, responsive mobile drawer, accessible WCAG controls, theme toggle with light/dark persistence.
- [x] **Hero & Stay Search**: `HotelHero.tsx` with date picker, guest party counters, night calculations, real-time validation, and live availability lookup.
- [x] **Curated Room Catalog**: `RoomCatalog.tsx` with categories (Standard, Deluxe, Accessible, Suite), budget/bed/view/accessibility filters, transparent pricing, live room inventory counts, and compare toggle.
- [x] **Interactive 5-Floor Explorer**: `RoomExplorer.tsx` browsing Levels 1 through 5. Corridors, public amenities (Lobby, Restaurant, Spa, Pool, Sky Lounge), and 27 rooms color-coded by real-time status (Available, Reserved, Out of order). Unit inspector with distinctive features (garden patio, terrace, corner windows, private lift key).
- [x] **Room Details & Comparison Modals**:
  - `RoomDetailModal.tsx`: Room specifications, area (m²), bed configuration, capacity, signature features, included services, full amenity matrix, and scene artwork carousel.
  - `RoomCompareModal.tsx`: Side-by-side comparison of 2–3 rooms across specs, rates, amenities checkmarks, and availability.
- [x] **Self-Contained Architectural Artwork**: `SceneVisual.tsx` providing pure SVG/CSS luxury illustrations (bedroom, living, soaking bath, pool deck, dining, rooftop skyline, spa, lobby, fitness) with no external broken image dependencies.
- [x] **Complete 5-Step Booking Engine**: `BookingWizardModal.tsx`:
  - Step 1: Dates & room category selection with live inventory check.
  - Step 2: Specific unit selection or auto-assignment.
  - Step 3: Validated guest details and special requests.
  - Step 4: Transparent price breakdown (room, resort fee, taxes) + card payment simulation (valid test card `•••• 4242`, decline test card, Luhn validation).
  - Step 5: Confirmation screen with reference number (`GA-XXXXXX`), stay summary, and next step links.
- [x] **Guest Reservation Management & Pre-Arrival**: `ManageBookingModal.tsx`:
  - Search by reference or browse recent demo bookings.
  - **F08 Pre-arrival check-in**: arrival time picker + registration consent $\rightarrow$ updates Front Desk arrival to `pending_verify`.
  - **F09 Early check-in**: same-day arrival request ($40 fee) $\rightarrow$ updates Front Desk stay.
  - **Modify booking**: date/guest changes $\rightarrow$ recalculates price, updates payment or queues refund in Finance.
  - **Cancel booking**: cancellation quote under policy (free if $\ge$ 2 days; 1st night fee otherwise) $\rightarrow$ queues refund request in Finance queue (`items.financial_operator`) respecting separation of duties.
  - **In-room Guest Portal Handoff**: when checked in by Front Desk, launches `/guest/portal?room=...&token=demo-token` directly for that stay.
- [x] **Connected Role Workflows**:
  - Confirmed web reservation creates a `StayRecord` in `state.frontDesk.stays` and updates room availability.
  - Out of order rooms (F27) in Front Desk immediately display as maintenance / unbookable in public explorer.
  - When PMS is down/degraded, booking payment is captured but held as `pending_confirmation` and creates a `SyncIssue` in Front Desk Reconcile tab (F14). Front Desk retry/confirm/refund updates the booking status.
  - Once Front Desk checks in the guest, the in-room Guest Portal activates immediately for that room and guest name.
- [x] **Showcase Sections**:
  - `DiningSection.tsx`: The Azure Bistro & Skyline Lounge with sample menus and simulated table reservation.
  - `SpaSection.tsx`: Level 2 Wellness Sanctuary with treatment catalog and simulated appointment inquiry.
  - `GallerySection.tsx`: Filterable resort photo moments.
  - `LocationContactSection.tsx`: Property address, concierge phone, stylized architectural map, and direct inquiry form.
  - `HotelFooter.tsx`: Brand summary, policies, connected prototype hubs, and back to top.

---

## 1c. Guest Portal (`/guest/portal`) — Status

**Done**
- [x] Fixed phone-sized viewport (390 px wide, constant height) on desktop with dark canvas; full screen on mobile; no site header/footer around it.
- [x] Header with back, theme toggle and logout (logout confirms, then returns to demo home).
- [x] Bottom nav: Home, Dining, Requests, Folio, Lost & found. Housekeeping, Maintenance, Spa/Concierge open from Home.
- [x] Home with stay details and shortcuts; housekeeping + amenities; room service (menu, quantity, cart, confirmation); maintenance (category, priority, simulated photo); spa/concierge; requests with reference numbers, timelines, cancel and feedback; folio, dispute and express checkout (revokes QR session).
- [x] F29 delivery tracking: 5-step tracker with ETA for room-service orders (Home and Requests).
- [x] Lost & found: Front Desk logs items (photo upload, sensitive toggle) and they appear in the guest tab; sensitive items never show a photo and direct guests to Front Desk.
- [x] One site-wide light/dark theme (`state.theme`, toggle in top bar and guest header, no flash on load).
- [x] Connected stay lookup: resolves in-house stays from Front Desk state so web bookings checked in by Front Desk can use the Guest Portal seamlessly.

---

## 1d. Front Desk Coordinator (`/staff/front-desk`) — Status

**Built (frontend only, mock state, no backend)**
- [x] `src/lib/frontDesk.ts`: pure reducers for verify (F08), check-in gated by room readiness (F21), early check-in (F09), settle and checkout checklist (F34), room move with QR revoke, request lifecycle, routing, escalation, case capture, complaints/recovery (F32), PMS sync recovery (F14), housekeeping-to-readiness link.
- [x] `src/lib/frontDeskRooms.ts`: out-of-order block flow (F27): Front Desk requests, Duty Manager approves, Front Desk applies.
- [x] Console `src/components/frontdesk/`: `FrontDeskConsole` (live KPIs, tabs), `StaysPanel`, `RequestsPanel`, `RoomsPanel`, `ComplaintsPanel`, `ReconcilePanel`, `Modal`; Lost & found reuses `LostFoundManager` (sensitive-photo rule intact).
- [x] Connected to Public Website: Stays tab reflects web bookings; Reconcile tab reflects PMS sync failures; Room status updates reflect immediately in Public Explorer.

**Next role after Front Desk & Public Website**: Department Dispatcher (`/staff/dispatcher`).

**Next task**: Run `npx tsc --noEmit` to verify type checking across all new components, then test the Public Website and Front Desk flow end to end.

---

## 2. Implementation Checklist & Phase Roadmap

### Phase 0: Discovery, Architecture Audit & Sprint Documentation (DONE)
- [x] Inspect existing specification files (`PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `TECH_STACK.md`, `SECURITY.md`, `IMPLEMENTATION_GUIDE.md`, `ER_DIAGRAMS.md`, `DECISIONS.md`, `TEST_PLAN.md`, `MEMORY.md`).
- [x] Analyze all 13 workflow diagrams in `workflow digrams/`.
- [x] Reconcile backend-heavy recommendations with frontend-only prototype mandate.
- [x] Author [CLAUDE.md](CLAUDE.md) (permanent coding agent guidelines).
- [x] Author [FRONTEND_FEATURE_MAP.md](FRONTEND_FEATURE_MAP.md) (feature-to-route-to-role mapping).
- [x] Author [FRONTEND_PROGRESS.md](FRONTEND_PROGRESS.md) (this progress tracking dashboard).

---

### Phase 1: Project Scaffolding & Shared Mock State Architecture (NEXT)
- [ ] Scaffold Next.js / React application with Tailwind CSS and Lucide icons.
- [ ] Build global `types/` matching [ER_DIAGRAMS.md](ER_DIAGRAMS.md) domain models (properties, departments, staff, cases, tasks, stays, folios, incidents).
- [ ] Author `mockData.ts` seed fixture:
  - 2 sample properties ("The Grand Azure Resort" & "Azure City Boutique").
  - Realistic departments (Front Desk, Housekeeping, Maintenance, F&B, Spa, Security).
  - Pre-seeded guest stays (e.g. Room 402 - "Elena Rostova", Room 305 - "Marcus Chen").
  - Pre-seeded staff personas for all 9 profiles with valid credentials/scopes.
- [ ] Implement `MockStoreContext` with `localStorage` persistence and a reactive event bus.
- [ ] Implement top-level **Demo Persona / Role Switcher Bar** for instant 1-click role toggling.

---

### Phase 2: Public Hotel Website & Guest Booking Flow
- [ ] Public Navigation Header & Footer with luxury hospitality aesthetic.
- [ ] Homepage (`/`) with Hero, room highlights, amenities showcase, and dining preview.
- [ ] Rooms & Suites page (`/rooms`) with room filtering, tier specs, and detail modals.
- [ ] End-to-End Booking Engine (`/book`):
  - Date & guest selection.
  - Room selection & rate plans.
  - Add-ons (breakfast, airport transfer, spa package).
  - Simulated payment processing & instant PMS reservation confirmation with QR code preview.
- [ ] Dining (`/dining`) and Spa (`/spa`) showcase pages with appointment/table inquiry modals.

---

### Phase 3: Simulated In-Room Guest QR Portal (Mobile-First)
- [ ] Route `/guest/portal?room=402&token=...` with auto-detected verified stay context.
- [ ] Welcome dashboard showing guest name, room number, checkout date, and active requests tracker.
- [ ] Room Service (F&B) module:
  - Categorized menu (Starters, Mains, Drinks, Desserts).
  - Dietary filters, item customization, and cart drawer.
  - Order submission $\rightarrow$ dispatches to F&B queue; auto-adds charge to folio.
- [ ] Housekeeping request module (Towels, Toiletries, Extra bedding, Cleaning schedule with DND toggle).
- [ ] Maintenance ticket module (Category selector, severity triage, description).
- [ ] Spa & Wellness booking module (Treatment selection, therapist, slot booking).
- [ ] Digital Folio & Express Checkout module:
  - Itemized charge viewer with breakdown.
  - "Dispute Charge" button $\rightarrow$ opens dispute case for Front Desk/Finance.
  - "Express Checkout" flow $\rightarrow$ digital signature, settles folio, revokes QR session, notifies Housekeeping.

---

### Phase 4: Operational Staff Portals (Fulfiller, Dispatcher, Supervisor, Front Desk)
- [ ] **Task Fulfiller View** (`/staff/fulfiller`):
  - Mobile-responsive "My Tasks" queue.
  - Accept, In Progress, On the Way, Completed transitions.
  - "Report Blocker" modal requiring mandatory reason.
- [ ] **Department Dispatcher View** (`/staff/dispatcher`):
  - Scoped queue by department with SLA status indicators.
  - Staff availability roster.
  - Assign / reassign staff; link duplicate tickets.
- [ ] **Department Supervisor View** (`/staff/supervisor`):
  - Inspection queue for completed tasks.
  - "Reopen Task" with mandatory corrective action note.
  - Shift Handover module (record open obligations, next owner, ETA, backup).
- [ ] **Front Desk Coordinator View** (`/staff/front-desk`):
  - PMS arrivals/departures roster and room status grid.
  - New Guest Case capture modal.
  - Room move tool (updates stay assignment and revokes old room session).
  - Direct guest messaging timeline.

---

### Phase 5: Specialist & Management Portals (Duty Manager, Finance, Security, Exec, Admin)
- [x] **Duty Manager / Department Manager View** (`/staff/duty-manager`):
  - Enterprise operations console branded "The Grand ADP" with collapsible navigation sidebar and full desktop grid (`max-w-[1600px]`).
  - Functional scope switcher: "My Department" (Duty & Operations) vs "Entire Hotel" (all 6 departments).
  - 8 filterable KPI stat cards linking to filtered queues.
  - Interactive task monitoring with managerial directive notes.
  - Staff workload roster with capacity controls and 1-click rebalancing triggers.
  - Front Desk guest complaints synchronization with service recovery comp modal (up to ₹16,000 ceiling).
  - Supply and equipment requisition reviews with Approve/Decline actions.
  - Duty incident command center tracking affected rooms and cross-department blocked tasks.
  - Shift handover briefing generator with metric calculations and sign-off acknowledgment.
  - Browser CSV export for operational reporting without external packages.
- [ ] **Financial Operator View** (`/staff/finance`):
  - Folio charge disputes queue.
  - Review exception $\rightarrow$ Approve (if authorized) $\rightarrow$ Execute refund (with idempotency simulation) $\rightarrow$ Reconcile.
  - Separation-of-duties check: prevents self-approval.
- [ ] **Security Responder View** (`/staff/security`):
  - Immediate emergency alert banner (audio/visual chime simulation).
  - Incident response log (arrival, actions, restricted evidence upload).
  - Isolation boundary: zero access to folios or non-security guest data.
- [ ] **Security Responder View** (`/staff/security`):
  - Immediate emergency alert banner (audio/visual chime simulation).
  - Incident response log (arrival, actions, restricted evidence upload).
  - Isolation boundary: zero access to folios or non-security guest data.
- [x] **Executive Viewer / Approver Enterprise Command Center** (`/staff/executive`):
  - Full-width enterprise layout with compact collapsible sticky sidebar (6 groups, 15 distinct navigation views).
  - Dual permission modes: **Executive Viewer** (read-only audit, analytics, inspect records) vs **Executive Approver** (full decision authority up to ₹200,000).
  - Interactive KPI cards with filter pass-through and operational attention queue.
  - Complete approval center with search, multi-filter, sort, paginated table, and rich request drawer.
  - Approve confirmation modal, mandatory rejection reason modal, request info prompt, and executive notes.
  - Cross-role reactivity: synchronizes with `state.items.executive_viewer`, `state.resourceRequests`, `state.frontDesk.complaints`, and `state.auditTrail`.
  - Department performance workspace across all 6 departments with drill-down audit drawer.
  - Capex & resource authorization center tracking ₹2,00,000 delegated limit and monthly headroom.
  - Incident command and guest recovery center with official executive directive dispatching.
  - Operational reports with zero-package client-side CSV export and feedback toast.
  - Immutable chronological audit log and decision ledger.
  - Profile workspace for Priya Nair (`EMP-0109`), notification center, and settings.
- [ ] **Platform Administrator View** (`/staff/admin`):
  - Staff account & scope management (Property, Department, Shift grants).
  - Room-to-QR code generator & test link launcher.
  - Integration health simulator (toggle PMS/POS/Payment latency or simulated failure).
  - Immutable audit trail log viewer.
  - "Reset Demo Data to Initial State" button.

---

## 1k. Executive Viewer / Approver Enterprise Command Center (`/staff/executive`) — Status (DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Full-Desktop Executive Command Center Shell (`ExecutiveConsole.tsx`)**:
  - Persona identity: **Priya Nair** (`EMP-0109`), General Manager & Executive Director (`executive_viewer`), Financial Limit: ₹2,00,000.
  - Full available desktop width (`max-w-[1600px] w-full px-4 sm:px-6 lg:px-8`) with collapsible sticky sidebar and light/dark theme support.
  - Compact sidebar navigation organized into 6 logical groups with 15 functional items:
    1. **Overview**: Executive Dashboard (`overview`)
    2. **Approvals**: Approval Center (`approvals`), Pending Approvals (`approvals-pending`), Approval History (`approvals-history`)
    3. **Operations**: Department Performance (`performance`), Escalations (`escalations`), Critical Incidents (`incidents`), Guest Complaints (`complaints`)
    4. **Finance & Resources**: Purchase Requests (`finance-purchases`), Equipment & Maintenance (`finance-equipment`), Resource Requests (`finance-resources`)
    5. **Insights**: Reports & Analytics (`reports`), Audit Log (`audit`)
    6. **Account**: Notifications (`notifications`), My Profile (`profile`), Settings (`settings`)
- [x] **Dual Permission Modes (Viewer vs Approver)**:
  - **Executive Viewer**: Read-only access to authorized dashboards, analytics, departments, incidents, complaints, reports, and approval history. Decision buttons are disabled with informative badges/tooltips explaining read-only restrictions. Action handlers strictly block unauthorized transitions.
  - **Executive Approver**: Full decision authority up to ₹2,00,000 delegation limit.
  - In-UI permission toggle switch allowing instant demonstration of both modes.
- [x] **Executive Overview Workspace (`ExecutiveOverviewTab.tsx`)**:
  - Interactive KPI cards: Total Departments (6), Overall Property SLA (95.4%), Pending Approvals, High-Priority Requisitions, Critical Incidents, Unresolved Guest Complaints.
  - KPI clicks route to the corresponding tab with pre-applied filters.
  - Interactive charts: Department operational pulse and SLA adherence progress tracks, approval decision volume breakdown, and month-to-date capex headroom meter.
  - Operational Attention Queue: Surfacing high-value approvals (Goodwill credit Room 402 ₹28,000, Otis Lift 2 controller board ₹48,000) and major property incidents with 1-click inspection drawers.
- [x] **Approval Center & Requisition Workflows (`ExecutiveApprovalsTab.tsx`)**:
  - Searchable, filterable, sortable, and paginated table with real-time state.
  - Filters: Status, Department, Category (Capex, Goodwill, Policy, Resource), Priority.
  - Sort by: Submission Date, Amount (High-to-Low), Priority.
  - Slide-over / Modal Request Drawer: Detailed business justification, budget impact, verified safe mock attachment previews (`OEM-Proposal-Signed.pdf`, `Incident-Report-Photos.pdf`), submission and decision timeline, and interactive discussion notes thread (`addExecutiveComment`).
  - Decision Modals:
    - **Approve Modal**: Confirmation dialog displaying requested amount and budget commitment.
    - **Reject Modal**: Enforces mandatory rejection reason and categorized policy justification.
    - **Request Info Modal**: Clarification prompt returning questions to submitter.
  - Cross-role reactivity: Updates `state.items.executive_viewer`, marks corresponding complaints resolved, updates folio credit lines, marks linked resource requests approved, logs audit event, and notifies operational managers.
- [x] **Department Performance Workspace (`ExecutivePerformanceTab.tsx`)**:
  - Complete operational cards across all 6 departments (Maintenance & Engineering, Housekeeping & Rooms, Front Office & Stays, Food & Beverage, Spa & Wellness, Safety & Security).
  - Metrics computed from live mock store: Task Completion Rate (%), Average Turnaround Time (min), Overdue Tasks, Guest Satisfaction Rating, and On-Duty Staff Saturation.
  - Department Audit Drawer: Drills into live staff roster and active task queue.
- [x] **Capital Expenditures & Resource Requisitions (`ExecutiveFinanceTab.tsx`)**:
  - Unified view of capex purchases, equipment replacements, maintenance spares, inventory restocking, and seasonal staffing contracts.
  - Tracks monthly delegated ceiling (₹2,00,000 limit, ₹1,41,000 committed MTD, ₹59,000 remaining headroom).
  - Connected to `state.resourceRequests` with direct executive authorization capability.
- [x] **Incident Command & Executive Recovery (`ExecutiveIncidentsTab.tsx`)**:
  - Property Incidents view connected to `state.incidents` (Water seepage Room 305–309, Freight Lift 2 sensor fault, VIP Room 518 noise disturbance).
  - Guest Complaints view connected to `state.frontDesk.complaints` with proposed recovery compensation.
  - Operational Escalations view connected to high-priority tasks.
  - Chronological incident timeline modal.
  - **Executive Directive Dispatch**: Allows Priya Nair to issue binding instructions that append to the incident timeline in `state.incidents` and trigger high-priority alerts to operational managers.
- [x] **Reports & Analytics Workspace with CSV Export (`ExecutiveReportsTab.tsx`)**:
  - Daily, weekly, monthly, and year-to-date operational summaries.
  - Department SLA ranking table and capex allocation distribution.
  - **Zero-Package Client-Side CSV Export**: Browser Blob download with sensible column headers and safe quote escaping, accompanied by user notification toast.
- [x] **Audit Log & Decision Ledger (`ExecutiveAuditTab.tsx`)**:
  - Real-time immutable event log pulling directly from `state.auditTrail`.
  - Chronological timeline view and filterable table view.
  - Search and filter by category, outcome, and actor (Priya Nair, Marcus Vance, Rajesh Sharma, Sunita Patel).
- [x] **Executive Profile & Notification Center (`ExecutiveProfileTab.tsx`)**:
  - Priya Nair credentialed profile, delegated sign-off limits, and Separation of Duties policy invariants.
  - In-app notification center with unread indicators, mark-as-read, and mark-all-as-read.
  - Workspace preferences (notification toggles, telemetry polling cadence, display density).

---

## 1n. Security Responder Mobile-First Dashboard (`/staff/security`) — Status (DONE)

**Built (frontend only, reactive mock store, connected cross-role workflows)**
- [x] **Dedicated Mobile-First Phone Shell (`SecurityApp.tsx`)**:
  - Persona identity: **Inspector Roy** (`EMP-0108`), Safety & Security department, Night Shift (`security_responder`).
  - Centered phone shell container on desktop (`sm:w-[412px] sm:h-[844px] sm:rounded-[2.8rem] sm:border-[8px] sm:border-[#0f172a] sm:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)]`) and 100% full-screen adaptive viewport on mobile devices (360–430px widths).
  - Phone speaker notch with live pulse status LED.
  - Top header with officer credential, quick sound siren toggle, theme toggle, and role switcher link.
  - Fixed 5-destination bottom navigation bar with live indicator badges: **Home**, **Incidents**, **Alerts**, **History**, and **Profile**.
  - Restrained transitions, safe area padding, and global light/dark theme support.
- [x] **Web Audio API Alert Siren & Chime Synthesizer (`securityChime.ts`)**:
  - Pure native browser `AudioContext` synthesizer with zero external mp3/wav files.
  - Urgent frequency warble siren for critical panic alarms (880Hz / 1320Hz) and dual-tone chime (784Hz / 1046.5Hz) for dispatches.
  - Fully integrated with header sound toggle and user mute preferences.
- [x] **Mobile Home Dashboard (`SecurityHomeTab.tsx`)**:
  - High-priority SOS panic alarm alert banner with 1-tap acknowledge button.
  - 4 live summary metric KPI cards: **Critical Incidents**, **Active Queue**, **My Response**, and **Resolved Today** with interactive tab navigation.
  - Quick action buttons: **Log Field Incident** and **All Incidents**.
  - Current Night Patrol status with live coverage progress bars: Lobby & Entrance (100%), Pool & Spa (60%), Basement & Parking (90%).
  - Handover notes from evening shift (Officer T. Chen: Gate 3 latch and Room 402 quiet hours).
  - Active incident preview cards and real-time security activity stream.
- [x] **My Incidents & Queue Management (`SecurityIncidentsTab.tsx`)**:
  - Search across incident IDs, keywords, locations, rooms, and descriptions.
  - Horizontal status filter pills: `All`, `New`, `Acknowledged`, `On scene`, `Backup requested`, `Escalated`, and `Resolved`.
  - Level/Floor filter selector (`All Floors`, `Ground / Lobby`, `Floor 3`, `Floor 5`, `Basement`).
  - Empty state with 1-click filter reset.
  - Compact tappable cards showing incident ID, priority pill, status chip, location, reported timestamp, and quick "Map" shortcut.
- [x] **Incident Details & Contextual State Actions (`SecurityIncidentDetailModal.tsx`)**:
  - Comprehensive slide-up drawer displaying incident ID, priority, status pill, location, and description.
  - Documented protocol instruction box with dynamic SOP guidelines (**Protocol E-1: Poolside Panic**, **Protocol E-2: Fire/Smoke BMS**, **Protocol E-3: Unattended Baggage**, **Protocol S-1: Disturbance & Quiet Hours**, **Protocol S-2: Access Control Verification**).
  - Chronological incident audit timeline and officer field notes section with live note logging.
  - Contextual action buttons based on status:
    - `New`: 1-Tap Acknowledge & Mark En Route.
    - `Acknowledged`: Physical Arrival confirmation $\rightarrow$ Mark On Scene.
    - `On scene` / `Backup requested`: Request Backup, Escalate to Duty Manager, Log Report & Resolve.
    - `Resolved`: Immutable record banner and full report viewer.
- [x] **Tactical Floor Plan & Orientation Preview (`SecurityFloorPlanModal.tsx`)**:
  - High-contrast architectural SVG schematic displaying corridor lines, room layout, service elevators, emergency stairwells (E1, E2), fire hose cabinets (FHC), and pulsing incident beacon.
  - Location details: assigned zone, room number, vertical access recommendations, and security authorization scope.
  - Explicit compliance disclaimer: "Indoor schematic preview · Live responder positioning disabled in accordance with system configuration".
- [x] **Formal Incident Reporting & Evidence Upload (`SecurityReportModal.tsx`)**:
  - Mandatory fields: Incident summary, scene observations, actions taken, final outcome.
  - Optional fields: Witness/staff details, follow-up recommendations, photographic evidence.
  - Local image upload using `FileReader.readAsDataURL` with thumbnail preview and remove capability.
  - Review step before final permanent submission, enforcing chain of custody and immutable audit trail recording.
- [x] **Duty Manager Escalation (`SecurityEscalateModal.tsx`)**:
  - Routes incident oversight to Duty Manager **Marcus Vance**.
  - Escalation reasons: perimeter breach, physical altercation, medical emergency, water/electrical hazard, trespass, or custom reason.
  - Dispatches high-priority notification to `department_manager`, updates cross-department incident status, and appends to feed.
- [x] **Secondary Officer Backup Request (`SecurityBackupModal.tsx`)**:
  - Calls secondary officer assistance for dispersal, perimeter sweep, or crowd containment.
  - Notifies dispatch and Duty Manager with live coordinates.
- [x] **Field Incident Logger (`SecurityLogIncidentModal.tsx`)**:
  - Allows Inspector Roy to log on-patrol observations (Suspicious Activity, Access Violation, Guest Disturbance, Property Damage, Fire/Smoke Hazard, Medical).
  - Injects new item into active queue, dispatches cross-role alerts, and logs audit event.
- [x] **Emergency Alert Inbox (`SecurityAlertsTab.tsx`)**:
  - Inbox view with pending acknowledgment counter and critical SOS filter.
  - 1-Tap acknowledge button updating state, unread indicators, and counters.
  - Mark-all-read action for in-app notifications.
- [x] **Searchable Resolution Archive (`SecurityHistoryTab.tsx`)**:
  - Filterable archive for resolved cases with category filters (Life Safety, Disturbances).
  - Read-only case cards with filed report summaries, preventing accidental modification.
- [x] **Officer Profile & Security Isolation Boundary (`SecurityProfileTab.tsx`)**:
  - Inspector Roy credentials, night shift details, and RFID badge status.
  - Patrol availability toggle: `On Active Patrol`, `Responding`, `Break / Standby`, `Off Duty`.
  - Alert audio siren enable/mute toggle.
  - Security Isolation Boundary notice detailing strict compliance rules (zero guest billing/folio access, guest privacy, evidence immutability).

---

- [ ] **Platform Administrator View** (`/staff/admin`):
  - Staff account & scope management (Property, Department, Shift grants).
  - Room-to-QR code generator & test link launcher.
  - Integration health simulator (toggle PMS/POS/Payment latency or simulated failure).
  - Immutable audit trail log viewer.
  - "Reset Demo Data to Initial State" button.

- [x] **Financial Operator Console (`/staff/finance`)**:
  - Persona: Neha Kapoor (`EMP-0107`), Finance & Accounts department, Day Shift, ₹80,000 transaction clearance limit.
  - Architecture: Complete enterprise financial console with 6 KPI cards, 11 dedicated tab views, 5 operational modals, centralized reactive mock store, and full responsive design.
  - Overview: 6 KPI cards (Today's Revenue, Payments Received, Outstanding Guest Balances, Pending Payments, Refund Requests, Unreconciled Transactions), interactive 7-day revenue trend chart, payment channel breakdown, and recent transactions list.
  - Guest Billing & Invoices: Full searchable, sortable, and filterable folio table (Invoice ID, Guest, Room, Booking ID, Room Charges, Service Charges, Taxes, Discounts, Total, Paid, Outstanding, Status), luxury tax invoice preview & printable modal (`InvoiceDetailModal`), mock invoice creation (`CreateInvoiceModal`), and instant CSV export via Blob.
  - Payments & Transactions: Transaction ledger with multi-parameter search, payment method/gateway filters, reconciliation state filters, and simulated transaction status updates (`TransactionDetailModal`).
  - Refund Management: Queue for reviewing dispute requests, evaluating room service issues, approving within clearance limit (up to ₹80,000), or rejecting with mandatory audit reason (`ReviewRefundModal`).
  - Outstanding Balances: Filtered ledger for unpaid, overdue, and partially paid folios, overdue aging indicators, and simulated payment recording modal with amount validation against outstanding balance (`RecordPaymentModal`).
  - Daily Financial Reports: Daily revenue summary, settlement channel breakdown, total invoices, tax accruals, net realized revenue, period filters (today, yesterday, 7 days, month-to-date), and comprehensive CSV export.
  - Audit Log: Immutable chronicle of financial activities (invoice creations, payment recordings, refund authorizations, and reconciliation toggles) filtered from `state.auditTrail`.
  - Financial Notifications: Real-time alerts for payment failures, refund review escalations, overdue folios, and unreconciled batches with 1-click action shortcuts.
  - Employee Profile & Permissions: Neha Kapoor credentials, clearance thresholds, notification sound toggles, and read-only role authorization matrix (self-modification disabled).
  - Workspace Settings: Standard 18% GST rates, invoice numbering sequences, and automated bank reconciliation settings.

---

### Phase 6: Simulated Workflows, Edge Cases & Verification
- [ ] Real-time reactive updates between Guest Portal and Staff queues without page refresh.
- [ ] Automated SLA timer countdown: automatically flags overdue tasks and triggers supervisor/manager escalation alerts.
- [ ] Verification of separation of duties (REQ-08) in Finance.
- [ ] Verification of QR session invalidation on express checkout (REQ-07, REQ-09).
- [ ] Keyboard navigation, responsive design on mobile/tablet/desktop, WCAG contrast checks.

---

## 3. Important Files Created / Modified
- [PRD.md](file:///d:/Code/ADP/hotel-app-main/PRD.md) — Product requirements (preserved).
- [DESIGN.md](file:///d:/Code/ADP/hotel-app-main/DESIGN.md) — Interaction design (preserved).
- [ARCHITECTURE.md](file:///d:/Code/ADP/hotel-app-main/ARCHITECTURE.md) — Architecture spec (preserved).
- [TECH_STACK.md](file:///d:/Code/ADP/hotel-app-main/TECH_STACK.md) — Recommended stack (preserved).
- [SECURITY.md](file:///d:/Code/ADP/hotel-app-main/SECURITY.md) — Security requirements (preserved).
- [IMPLEMENTATION_GUIDE.md](file:///d:/Code/ADP/hotel-app-main/IMPLEMENTATION_GUIDE.md) — Implementation guide (preserved).
- [ER_DIAGRAMS.md](file:///d:/Code/ADP/hotel-app-main/ER_DIAGRAMS.md) — Entity relationship model (preserved).
- [DECISIONS.md](file:///d:/Code/ADP/hotel-app-main/DECISIONS.md) — Decision register (preserved).
- [TEST_PLAN.md](file:///d:/Code/ADP/hotel-app-main/TEST_PLAN.md) — Acceptance test plan (preserved).
- [MEMORY.md](file:///d:/Code/ADP/hotel-app-main/MEMORY.md) — Project context (preserved).
- [CLAUDE.md](file:///d:/Code/ADP/hotel-app-main/CLAUDE.md) — Permanent coding instructions for frontend prototype sprint (**CREATED**).
- [FRONTEND_FEATURE_MAP.md](file:///d:/Code/ADP/hotel-app-main/FRONTEND_FEATURE_MAP.md) — Complete mapping of features, workflows, routes, components, and roles (**CREATED**).
- [FRONTEND_PROGRESS.md](file:///d:/Code/ADP/hotel-app-main/FRONTEND_PROGRESS.md) — Sprint progress dashboard and checklist (**CREATED**).
- [FEATURE_TRACEABILITY.md](file:///d:/Code/ADP/hotel-app-main/FEATURE_TRACEABILITY.md) — Master feature traceability matrix for Security Responder and connected roles (**CREATED**).
- [SECURITY_RESPONDER_FEATURE_TRACEABILITY.md](file:///d:/Code/ADP/hotel-app-main/SECURITY_RESPONDER_FEATURE_TRACEABILITY.md) — Security Responder traceability mirror (**CREATED**).
- [FinanceConsole.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceConsole.tsx) — Main Financial Operator console container with collapsible sidebar (**CREATED**).
- [FinanceOverviewTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceOverviewTab.tsx) — 6 KPI cards, revenue trend chart, payment breakdown, and recent transactions (**CREATED**).
- [FinanceInvoicesTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceInvoicesTab.tsx) — Folio table, search, filters, sorting, and CSV export (**CREATED**).
- [FinanceOutstandingTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceOutstandingTab.tsx) — Unpaid & overdue folios, aging calculation, and settlement triggers (**CREATED**).
- [FinanceTransactionsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceTransactionsTab.tsx) — Transaction ledger, status update simulations, and bank reconciliation (**CREATED**).
- [FinanceRefundsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceRefundsTab.tsx) — Refund request queue, dispute reviews, clearance checks, and approvals (**CREATED**).
- [FinanceReportsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceReportsTab.tsx) — Daily financial reports, revenue centers breakdown, and real CSV report download (**CREATED**).
- [FinanceHistoryTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceHistoryTab.tsx) — Historical transaction archive with multi-parameter search and export (**CREATED**).
- [FinanceAuditTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceAuditTab.tsx) — Immutable audit log of all financial activities (**CREATED**).
- [FinanceNotificationsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceNotificationsTab.tsx) — Real-time alerts for failed payments, refund reviews, and overdue balances (**CREATED**).
- [FinanceProfileTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceProfileTab.tsx) — Neha Kapoor credentials, notification toggles, and read-only permissions matrix (**CREATED**).
- [FinanceSettingsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceSettingsTab.tsx) — Workspace preferences, 18% GST rate, and simulation notes (**CREATED**).
- [InvoiceDetailModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/InvoiceDetailModal.tsx) — Luxury tax invoice preview, line item breakdown, print, and text download (**CREATED**).
- [CreateInvoiceModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/CreateInvoiceModal.tsx) — New guest room invoice generator with auto 18% GST calculation (**CREATED**).
- [RecordPaymentModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/RecordPaymentModal.tsx) — Record payment modal with outstanding balance validation (**CREATED**).
- [ReviewRefundModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/ReviewRefundModal.tsx) — Review refund modal with mandatory decline reason and confirmation (**CREATED**).
- [TransactionDetailModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/TransactionDetailModal.tsx) — Transaction inspection and operator status transition simulator (**CREATED**).
- [SupervisorConsole.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorConsole.tsx) — Main Department Supervisor console with sticky collapsible sidebar and 11 tabs (**CREATED**).
- [SupervisorOverviewTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorOverviewTab.tsx) — 4 KPI cards, readiness pipeline, priority inspection queue, quick actions (**CREATED**).
- [SupervisorInspectionsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorInspectionsTab.tsx) — Searchable quality inspection queue, status filters, and floor selector (**CREATED**).
- [SupervisorRoomsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorRoomsTab.tsx) — Floor-by-floor room readiness matrix synchronized with Front Desk inventory (**CREATED**).
- [SupervisorTasksTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorTasksTab.tsx) — Housekeeping tasks and attendant reassignment blocker review queue (**CREATED**).
- [SupervisorTeamTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorTeamTab.tsx) — Attendant roster, workload capacity controls, shift availability toggles (**CREATED**).
- [SupervisorEscalationsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorEscalationsTab.tsx) — Escalation workspace connected to Duty Manager Marcus Vance (**CREATED**).
- [SupervisorHandoverTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorHandoverTab.tsx) — Shift handover submission form and historical log (**CREATED**).
- [SupervisorReportsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorReportsTab.tsx) — Floor quality compliance, defect root cause breakdown, CSV report export (**CREATED**).
- [SupervisorAuditTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorAuditTab.tsx) — Immutable audit log of all supervisor inspection approvals and reassignments (**CREATED**).
- [SupervisorNotificationsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorNotificationsTab.tsx) — In-app alerts for turnover completions, SLA breaches, and Duty Manager feedback (**CREATED**).
- [SupervisorProfileTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/SupervisorProfileTab.tsx) — Meera Nambiar credentials, shift details, and RBAC permissions matrix (**CREATED**).
- [InspectionModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/InspectionModal.tsx) — Interactive quality checklist inspection modal with score calculator (**CREATED**).
- [ReopenTaskModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/ReopenTaskModal.tsx) — Mandatory deficiency reason picker, corrective action directive, and attendant dispatch (**CREATED**).
- [EscalateIssueModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/supervisor/EscalateIssueModal.tsx) — Blocker escalation modal dispatching directly to Duty Manager Marcus Vance (**CREATED**).
- [ManagerPoliciesTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/ManagerPoliciesTab.tsx) — Department-specific service instructions, authority ceilings ($\le ₹10,000$), and policy management (**CREATED**).
- [FinanceApprovalsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceApprovalsTab.tsx) — Dedicated financial approval inbox, standard/high-value compensation review, and folio settlement modal (**CREATED**).
- [ManagerOperationsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/ManagerOperationsTab.tsx) — Integrated supervisor escalation queue, Accept & Resolve, Return, and Escalate to GM actions (**UPDATED**).
- [ManagerEscalationsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/ManagerEscalationsTab.tsx) — Multi-tier compensation center with ₹10,000 threshold notice, claim review, GM simulation, and complaint logs (**UPDATED**).
- [ManagerWorkforceTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/ManagerWorkforceTab.tsx) — Shift Scheduling & Roster sub-view, shift assignment modal, conflict indicators, and resolution (**UPDATED**).
- [ManagerReportsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/ManagerReportsTab.tsx) — Weekly/monthly reporting windows, visual SVG trend graphs, escalations count, quality scores, and CSV export (**UPDATED**).
- [ManagerInspectionsTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/ManagerInspectionsTab.tsx) — Target department selector and assigned supervisor selector routing directly to supervisor queue (**UPDATED**).
- [FinanceOverviewTab.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceOverviewTab.tsx) — 6 KPI cards with Pending Approvals linking directly to approval inbox and Refunds & Compensation (**UPDATED**).
- [FinanceConsole.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/finance/FinanceConsole.tsx) — Approvals tab navigation with live pending badge and FinanceApprovalsTab rendering (**UPDATED**).
- [DutyManagerConsole.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/manager/DutyManagerConsole.tsx) — Connected policies navigation and ManagerPoliciesTab view (**UPDATED**).
- [ServiceAuthorityModal.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/shared/ServiceAuthorityModal.tsx) — Department Manager active directives displayed alongside GM property-wide standards (**UPDATED**).
- [DispatcherSupervisorConsole.tsx](file:///d:/Code/ADP/hotel-app-main/src/components/dispatcher-supervisor/DispatcherSupervisorConsole.tsx) — Render active department manager policies in supervisor policies view (**UPDATED**).
- [store.tsx](file:///d:/Code/ADP/hotel-app-main/src/lib/store.tsx) — 8 new API callbacks, rehydration, folio credit connection, and audit trail (**UPDATED**).
- [mockData.ts](file:///d:/Code/ADP/hotel-app-main/src/lib/mockData.ts) — MANAGER_COMPENSATION_THRESHOLD = 10000, seed compensation requests, shift schedules, and department policies (**UPDATED**).
- [demo.ts](file:///d:/Code/ADP/hotel-app-main/src/types/demo.ts) — CompensationRequest, ShiftScheduleRecord, DepartmentServicePolicy types (**UPDATED**).

---

## 4. Known Bugs, Blockers & Flagged Discrepancies
1. **Tooling**: Zero terminal commands policy strictly enforced. Dev server runs continuously in background.
2. **Configurable ₹10,000 Boundary**: Configured as standard tier (`MANAGER_COMPENSATION_THRESHOLD = 10000`, requests $\le ₹10,000$ handled by Department Manager $\rightarrow$ Finance; requests $> ₹10,000$ escalated to General Manager $\rightarrow$ Finance). Flagged for user confirmation as requested.
3. **Folio Isolation Guarantee**: Rejected or disapproved compensation claims are strictly prevented from posting to guest folios or checkout balances.

---

## 5. Phase 3 Connected Workflows Verified
1. **Fulfiller $\rightarrow$ Combined Dispatcher / Supervisor $\rightarrow$ Department Manager**: Supervisor escalates tasks exceeding authority $\rightarrow$ Department Manager reviews with Accept & Resolve, Return, or Escalate to GM.
2. **Department Manager $\rightarrow$ General Manager Escalation**: Requests exceeding ₹10,000 or requiring executive approval escalate with justification, evidence, and full history.
3. **Standard Compensation ($\le ₹10,000$)**: Department Manager approves $\rightarrow$ Financial Operator reviews $\rightarrow$ Approved amount immediately reflected as credit line on guest folio and Front Desk checkout balance.
4. **High-Value Compensation ($> ₹10,000$)**: Department Manager escalates $\rightarrow$ General Manager reviews/concurs $\rightarrow$ Financial Operator reviews $\rightarrow$ Approved amount posted to guest folio and checkout balance.
5. **Department Manager Inspection Directives**: Dispatches target department, assigned supervisor (Meera Nambiar or Arjun Mehta), and instructions directly into the supervisor queue (`state.inspections`).
6. **Staff Schedule & Roster**: Shift assignments (Morning, Evening, Night), conflict detection, and resolution propagate directly into workforce views.
7. **Department Service Policies**: Department-specific instructions and authority guidance ($\le ₹10,000$) created by Department Manager propagate directly to the shared policies modal and supervisor console without overwriting GM standards.

---

## Phase 4 — Front Desk, Security Responder, General Manager & Final Integration (DONE)

### 1. Front Desk (`/staff/front-desk`)
- **Check-In / Stay Management**:
  - Full check-in, move room, and check-out workflows with identity verification status indicator.
  - Interactive **Live Pass** dialog with date/time horizon switcher (Arrival 15:00, Mid-Stay Evening, Departure Day 09:00, Post-Checkout Expired, and custom date/time). Automatically recalculates access validity and NFC cryptographic hash.
  - Move room updates stays and room matrices seamlessly without losing guest or folio information.
- **Need Action Section (`NeedActionPanel.tsx`)**:
  - Urgent incoming guest requests, arrival ID checks, and pending Safety Alert validation cards (`Validate & Escalate to Manager` and `Broadcast Live Alert`).
- **Room Status Refinement (`RoomsPanel.tsx`)**:
  - Removed **Inspection** and **Out of Order** from Front Desk Room Status; added **Check-In** and **Check-Out** filters and KPI tiles. Removed OOO block trigger from room dialog (preserved in Department Manager & Maintenance).
- **Guest Reminders Panel (`GuestRemindersPanel.tsx`)**:
  - Creation form (guest, room, due date/time, priority, butler/staff assignment) and reminders log with status toggles (`pending` / `completed` / `dismissed`).
- **VIP Preview Panel (`VipPreviewPanel.tsx`)**:
  - Synchronized VIP guest roster, stay info, documented preferences & allergies from `state.guestPreferences`, active reminders, and open requests, connected to GM VIP.
- **Front Desk Policies & Service Authority (`FrontDeskPoliciesPanel.tsx`)**:
  - ₹2,500 goodwill credit limits, room relocation guidelines, key issuance, safety escalation, and incident reporting.

### 2. Security Responder (`/staff/security`)
- **Incident Management with Reporter Attribution (`SecurityIncidentDetailModal.tsx`)**:
  - Explicit report origin & Front Desk validation history (unvalidated guest reports cannot appear as verified incidents; flagged with warning badge).
  - Backup request trigger, supporting evidence locker references, and officer field notes.
- **Safety Alerts Section (`SecurityAlertsTab.tsx`)**:
  - Dedicated Safety Alerts section with "Draft Alert" modal, status filters (`all`, `broadcast_active`, `pending`, `resolved`), audit trail modal, and stand-down / resolve actions.
- **Tactical SOP Playbooks (`SecurityPlaybookTab.tsx`)**:
  - Tactical SOP playbooks (Safety Alert Broadcast, Guest Incident Verification, BMS Fire Alarm), authority limits, and notice that municipal fire dispatch is pending configuration per roadmap.
- **Security Shift Handover (`SecurityHandoverTab.tsx`)**:
  - Complete shift handover logs with active incidents, unresolved issues, follow-up actions, evidence locker references, and handover creation form.
- **Quick Section Sub-Bar & Bottom Nav (`SecurityApp.tsx`)**:
  - Sub-navigation for quick switching between Overview, Incidents, Safety Alerts, Shift Handover, Playbooks & SOP, Archive, and Profile.

### 3. General Manager (`/staff/general-manager` / `/staff/executive`)
- **Role Alignment**:
  - Full persona representation for Priya Nair (`EMP-0109`). Both `/staff/general-manager` and `/staff/executive` resolve cleanly.
- **Executive Operations Command & Live Metrics (`ExecutiveOverviewTab.tsx`)**:
  - Dynamic live metrics (staff present, staff available, active incidents, SLA performance, room yield).
  - Prominent emergency broadcast banner when safety alerts are active or awaiting GM authorization.
- **Executive Approvals Center (`ExecutiveApprovalsTab.tsx`)**:
  - Sole property authority for capex overhauls, high-limit service recoveries, and property policy waivers up to ₹2,00,000.
  - Dedicated Safety Alert Broadcast review card: Priya Nair can authorize hotel-wide broadcast or reject/return with notes, with full audit modal.
  - Dedicated High-Value Guest Compensation (> ₹10,000) review card: forward to Finance for credit settlement or reject.
- **VIP Guest Portfolio & Directives (`GeneralManagerVipTab.tsx`)**:
  - Comprehensive VIP guest roster (Anya Sharma Rm 402, Elena Rostova Rm 518).
  - Stay details, documented dietary/allergy preferences, synchronized reminders, grievance recovery cases, and action to log GM VIP reminders.
- **Hotel-Wide Room Matrix (`GeneralManagerRoomsTab.tsx`)**:
  - 5-floor room inventory matrix with live statuses (Occupied, Ready to sell, Dirty/Cleaning, Check-In today, Check-Out today, Out of order).
  - Occupancy percentage and RevPAR yield calculations dynamically synchronized with Front Desk.

### 4. Safety Alert Workflow (Cross-Role Lifecycle Verified)
1. **Security drafts alert**: Inspector Roy drafts alert in `/staff/security` $\rightarrow$ status `draft_pending_validation`.
2. **Front Desk validates operational impact**: Maya Lin reviews in `/staff/front-desk` Need Action $\rightarrow$ clicks "Validate & Escalate" $\rightarrow$ status `validated_pending_approval`.
3. **General Manager approves broadcast**: Priya Nair reviews in `/staff/general-manager` Approvals $\rightarrow$ clicks "Authorize Broadcast" $\rightarrow$ status `approved_ready_broadcast`.
4. **Front Desk broadcasts alert**: Front Desk clicks "Broadcast Live Alert" in Need Action $\rightarrow$ status `broadcast_active`.
5. **Property-wide in-app notifications**: Dispatched to all roles with audio chime; live alert banner displays on Security and GM dashboards with full audit history.
6. **Resolution / Stand-down**: Security or GM resolves the alert $\rightarrow$ status `resolved`.

---

## Phase 5 — Front Desk Dispute Financial & Multi-Tier Settlement Rebuild (DONE)
- **Unified Single Workflow**:
  - Replaced legacy 8 KPI tiles and 5 sub-tabs in `DisputesPanel.tsx` with a single unified list and 4 status filter chips (`New`, `With General Manager`, `With Finance`, `Closed`).
  - Completely removed PMS Sync scenarios, handlers, imports, and deleted unused `ReconcilePanel.tsx`.
  - Replaced hardcoded `+3` badge counters with live `claimsNeedingFrontDesk(state)` count across desktop sidebar, tab headers, and mobile navigation.
- **Front Desk Evaluation & Limit Rule**:
  - Front Desk can decide 4 clean outcomes: Compensation (5 methods), Refund (sent to Finance), Reject (mandatory reason to guest), or Request Info.
  - Front Desk discretionary authority limit is ₹2,500 (`FD_CLAIM_LIMIT`). Decided amounts $\le$ ₹2,500 apply immediately (compensation posted to folio; refund sent to Financial Officer).
  - Claims > ₹2,500 are automatically routed to the General Manager approval queue (`pending_gm`), bypassing Duty Manager.
  - Interactive decision modal displays live limit indicator, confirmation step, validation, and full history timeline.
- **Cross-Role Settlement & Guest Portal Reactive Sync**:
  - General Manager approval forwards claims to Financial Officer; rejection informs guest and notifies Front Desk.
  - Financial Officer receives refund requests with card mask, reference, amount, and notes. Finance payout/approval/rejection automatically syncs back to the claim status.
  - Guest portal (`ToFrontDeskSubtab.tsx`, `CompensationRefundSection.tsx`) reflects live status, timeline, staff responses, and approved amounts using reactive `claimView`.

---

## 5. Concise Final Audit Report

| Role / Feature | Status | Implementation Details / Notes |
|---|---|---|
| **Front Desk: Check-In / Stays** | **COMPLETED** | Live pass simulator with horizon switcher, move room, check-out, ID verification. |
| **Front Desk: Need Action** | **COMPLETED** | Dedicated panel for urgent guest requests, arrival ID checks, safety alert validations. |
| **Front Desk: Room Status** | **COMPLETED** | Removed Inspection & OOO; added Check-In & Check-Out; OOO dialog block removed. |
| **Front Desk: Reminders & VIP** | **COMPLETED** | Reminders log and VIP preview panel connected to GM VIP. |
| **Front Desk: Service Policies** | **COMPLETED** | Service authority limits (₹2,500 goodwill credit, room move rules, key issuance). |
| **Front Desk: Dispute Financial & Claims** | **COMPLETED** | Unified single workflow (guest → Front Desk → GM if > ₹2,500 → Finance). PMS Sync removed. |
| **Security: Reporter Attribution** | **COMPLETED** | Report origin & Front Desk validation badge; unvalidated guest reports flagged. |
| **Security: Safety Alerts** | **COMPLETED** | Dedicated Safety Alerts section with draft modal, status filters, and audit trail. |
| **Security: Playbooks & Handover**| **COMPLETED** | Playbooks with unconfigured municipal fire dispatch; shift handover logs with locker refs. |
| **General Manager: Overview & KPIs**| **COMPLETED** | Dynamic live metrics, department SLA benchmarks, and live safety broadcast banners. |
| **General Manager: Approvals** | **COMPLETED** | Safety alert broadcast sign-offs, high-value compensation (> ₹10,000), capex requests. |
| **General Manager: VIP Portfolio** | **COMPLETED** | Dedicated VIP tab with preferences, synchronized reminders, complaints, and GM notes. |
| **General Manager: Rooms Matrix** | **COMPLETED** | Hotel-wide room occupancy across 5 floors with live RevPAR and floor filters. |
| **Safety Alert Broadcast Workflow**| **COMPLETED** | End-to-end 6-stage lifecycle across Security, Front Desk, General Manager, and All Staff. |
| **Municipal Fire Dispatch** | **PARTIAL / NOTED** | Marked as unconfigured per hotel roadmap in Security Playbook and Policies (no external API). |
| **Real Identity / Payment Gateways**| **BLOCKED BY DESIGN** | Prohibited in frontend-only prototype; verified with realistic simulation. |


