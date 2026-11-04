# CLAUDE.md — Frontend Prototype Instructions

## Project Overview
This repository contains the frontend-only prototype for a multi-tenant Hotel Management SaaS. The goal is to build a rich, interactive, realistic client-side demonstration of the hotel ecosystem within a 36-hour sprint window.

**Sprint Constraint**: Frontend-only. **NO** live backend, **NO** real database, **NO** real external authentication (OIDC), **NO** real payment processors, and **NO** external network APIs. All state, mock data, role authorization, and workflow simulations run in the browser using client-side state and `localStorage`.

---

## Mandatory Rule for Every Development Phase & Prompt

**We build by feature and workflow across roles — NOT by completing one role in isolation.**

A feature may involve the Guest Portal, Public Hotel Website, Front Desk, Department Dispatcher, Housekeeping, Finance, or another role.
- Implement the part relevant to the current page or role.
- Connect it to related existing pages using the shared frontend mock store (`DemoState` / `useDemo()`).
- If the current feature requires a small change in another role, make that change in the same phase.
- If a related workflow is not ready yet, provide a clearly labelled, functional mock-state integration and record what remains.
- Revisit unfinished workflows when the next related role is developed. Do not claim a role is completely finished while required connected workflows remain.
- Apply this rule to **every subsequent phase and every future prompt**. Preserve it in `CLAUDE.md` and `FRONTEND_PROGRESS.md`.
- Do not unnecessarily rebuild entire dashboards or break existing functionality.

---

## Technical Stack & Environment
- **Node.js**: `v24.x` (LTS)
- **Package Manager**: `npm` (run with `npm`, do not require `pnpm` as it is not globally installed in this environment)
- **Framework**: Next.js (App Router) or Vite + React (TypeScript strict mode)
- **Styling**: Tailwind CSS + Accessible UI primitives (Radix UI or headless UI patterns)
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form + Zod
- **Client State & Mock Store**: React Context / Zustand with `localStorage` synchronization for persistence across reloads

---

## Core Domain Invariants (Must Be Upheld in Frontend)
Even though this is a prototype without a backend, the client code must strictly reflect and simulate the core architectural invariants from [PRD.md](PRD.md) and [SECURITY.md](SECURITY.md):

1. **Approved Staff Roles & Portal Structure (Phase 1 & Phase 2 Standard)**:
   - `task_fulfiller` (`/staff/fulfiller`): Mobile-first app for Vikram Singh (`EMP-0103`, Housekeeping & Maintenance, Floors 1–5). Features: Segmented [My Tasks] vs [All Tasks] control; self-claiming unassigned tasks with conflict prevention; formal reassignment request approval workflow; chronological timeline (`task.history`); Alerts & Dispatches with Web Audio chime; dedicated Policies tab with strict ₹0 discretionary financial limit.
   - `department_dispatcher_supervisor` (`/staff/dispatcher-supervisor`): Single combined role for Arjun Mehta (`EMP-0104`) & Meera Nambiar (`EMP-0105`). Unified console merging Task Queue triage, manual Create Task modal (open pool vs immediate staff assignment), Team Workload balancing, Blockers & Issues tab (fulfiller reassignment approvals and active blocker clearing), SLA Monitor with explicit `Unconfigured` tags, Automation of Guest Messages simulation, 5-category quality checklist inspections, room turnover matrix, and shared Shift Handovers. Backwards-compatible route aliases: `/staff/dispatcher`, `/staff/supervisor`.
   - `department_manager` (`/staff/department-manager`): Delegated financial authority up to ₹16,000, complaint resolution, service catalog creation, and inspection directive initiation. Backwards-compatible alias: `/staff/duty-manager`.
   - `front_desk_coordinator` (`/staff/front-desk`): PMS arrivals/departures, room moves, key generation, untagged request routing, and delegated goodwill up to ₹2,500.
   - `financial_operator` (`/staff/finance`): Folios, invoices with auto 18% GST, adjustments, payments, and refund approvals up to ₹80,000.
   - `security_responder` (`/staff/security`): Mobile SOS panic alarms, incident attendance, tactical schematics, and evidence logging. Isolated from guest folios/CRM.
   - `general_manager` (`/staff/general-manager`): Replaces Executive Viewer / Approver; full property analytics, cross-department directives, and high-value approvals up to ₹2,00,000. Backwards-compatible alias: `/staff/executive`.
   - `platform_admin` (`/staff/admin`): Staff accounts, role assignments, QR code revocation, integration connector toggles, and audit trail.
   - `guest` (`/guest/portal` & `/hotel`): Separate guest-facing experience for booking, services, billing, and stay preferences.

2. **Scoped Access & Least Privilege**:
   - Every staff member belongs to a Property and has Scopes (Department, Floor, Outlet, Shift).
   - Combining profiles must never leak unauthorized scopes or bypass separation-of-duty checks.

3. **Separation of Financial Duties (REQ-08)**:
   - Request $\rightarrow$ Delegated Approval $\rightarrow$ Logical Execution $\rightarrow$ Independent Reconciliation.
   - Prevent self-approval: An operator who requests a refund cannot approve their own request, even if holding managerial profiles.
   - Never store or display raw credit card details (use tokenized masks like `•••• 4242`).

4. **Stay Lifecycle & QR Revocation (REQ-07, REQ-09)**:
   - QR mappings bind to a room and verified stay context.
   - Express checkout or room move must immediately revoke the active guest session for that room/key.

5. **Case Ownership vs Task Assignment**:
   - A Guest Case has an accountable Owner (typically Front Desk).
   - Department Tasks linked to the case have Assignees (fulfillers) and categories (Housekeeping, Maintenance, F&B, Concierge).
   - Reassigning or linking duplicate tasks must never erase the original submission timestamp or SLA timer.

---

## Frontend Architecture & Directory Layout

```text
src/
├── app/                  # Next.js App Router pages
│   ├── (public)/         # Public Hotel Website (Home, Rooms, Dining, Spa, Booking)
│   ├── (guest)/          # Guest Portal (/guest/portal?room=...&token=...)
│   ├── (staff)/          # Staff Portals (/staff/[role]/...)
│   │   ├── tasks/        # My Tasks (Fulfiller)
│   │   ├── dispatch/     # Department Queue (Dispatcher)
│   │   ├── supervisor/   # Inspection & Reopen (Supervisor)
│   │   ├── duty-manager/ # Duty Manager & Escalations
│   │   ├── front-desk/   # PMS Front Desk & Cases
│   │   ├── finance/      # Folios, Exceptions & Approvals
│   │   ├── security/     # Emergency & Incident Response
│   │   ├── executive/    # GM Analytics & Decisions
│   │   └── admin/        # Accounts, Scopes & QR Mappings
│   └── login/            # Dummy Login & Persona Switcher
├── components/           # Reusable UI components
│   ├── ui/               # Button, Modal, Card, Badge, Input, Tabs
│   ├── shared/           # RoleSwitcherBar, Navbar, Sidebar, StatCard
│   ├── guest/            # RoomServiceMenu, MaintenanceForm, FolioViewer
│   └── staff/            # TaskCard, SLAIndicator, HandoverModal, DisputeModal
├── context/ / store/     # Global state management & Mock Store
│   ├── AuthContext.tsx   # Active user persona, permissions, property/shift scope
│   ├── MockStoreContext  # In-memory reactive database for cases, tasks, folios, incidents
│   └── mockData.ts       # Rich seed data (rooms, staff, categories, stays, tasks)
├── lib/                  # Utilities & simulation logic
│   ├── permissions.ts    # Centralized `can(actor, action, context)` checker
│   ├── slaTimer.ts       # Simulated SLA countdown & escalation engine
│   └── utils.ts          # Formatting, date helpers, cn class utility
└── types/                # Strict TypeScript domain interfaces
    ├── auth.ts           # Staff profiles, scopes, permissions
    ├── cases.ts          # Cases, tasks, categories, handovers
    ├── stay.ts           # Stays, rooms, guest sessions, QR mappings
    └── finance.ts        # Exceptions, approvals, folios, reconciliations
```

---

## Coding Standards & Guidelines
1. **Strict TypeScript**: No `any`. Define clear DTOs and interfaces matching [ER_DIAGRAMS.md](ER_DIAGRAMS.md).
2. **Accessible & Responsive**:
   - Fully responsive: Mobile-first for the Guest QR Portal and Task Fulfiller views; Desktop-optimized for Dispatcher, Front Desk, and Executive dashboards.
   - Accessible keyboard navigation and WCAG contrast. Status indicators must never rely solely on color (use text badges + icons).
3. **Mock Store Reactivity**:
   - Updating a task status in the Fulfiller view should immediately reflect in the Dispatcher queue and the Guest Portal.
   - Store state in `localStorage` with a "Reset Demo Data" option in the Admin bar.
4. **Realistic Individual Role Simulation**:
   - Individual staff dashboards render authentic employee account headers showing active staff identity (name, department, shift, active dot), role-specific notifications, and a dedicated **Logout** action (with confirmation modal returning to `/login`).
   - The global 9-role switcher rail is secluded to `/login` (Portal Login), preserving realism during role demonstrations without breaking access.
   - Task Fulfiller (`/staff/fulfiller`) operates as a dedicated mobile-first phone-shell viewport.
   - Department Dispatcher (`/staff/dispatcher`) operates as a full-width enterprise desktop console with deterministic 7-step auto-routing, individual capacity controls (1–20), workload rebalancing, and ticket deduplication.
   - Department Manager / Duty Manager (`/staff/duty-manager`) operates as a full-width enterprise operations console with functional scope switcher ("My Department" vs "Entire Hotel"), 8 filterable KPI stat cards, interactive task monitoring, employee capacity management, complaint resolution with recovery comp limits up to ₹16,000, supply requisition approvals, property incident command, shift handover briefing with acknowledgment sign-offs, and client-side zero-package CSV reporting.
   - Front Desk Coordinator (`/staff/front-desk`) operates across the full desktop grid (`max-w-[1600px]`) with gesture guide moved into an accessible top-bar contextual help modal, and internal authority limits enforced silently without visual clutter.
5. **No Network Blockers**:
   - Use local SVG/Lucide icons and bundled mock assets.
   - Avoid external API dependencies or unpkg scripts that break under limited internet.
6. **Curated Luxury Light Theme ("Baby Theme") & High-Visibility Top Bar**:
   - The light theme is calibrated with a multi-tonal pastel palette: soft porcelain canvas (`#f9f3f6`), delicate rose blush (`#ead5dc` / `#f4b6c2`), powder baby blue (`#b3cde0`), and fresh seafoam aqua (`#83d0c9`).
   - The sticky Top Bar features an elevated, distinct powder-sky finish (`linear-gradient(180deg, #e4eff9, #d8e8f6)`) with a crisp slate-blue border (`#6497b1`), making it clearly distinct from the page canvas while maintaining deep navy typography (`#011f4b`).
   - Cards float as crisp porcelain panels with soft rose borders, while active sidebar items render as vibrant gradient pills with white text.

---

## Phase 3 Invariants & Connected Workflows (Department Manager & Financial Operator)

1. **Compensation & Recovery Escalation Hierarchy**:
   - `Fulfiller` $\rightarrow$ `Combined Dispatcher / Supervisor` $\rightarrow$ `Department Manager` $\rightarrow$ `General Manager` (when $> ₹10,000$) $\rightarrow$ `Financial Operator` $\rightarrow$ Folio Credit.
   - **Standard Requests ($\le ₹10,000$)**: Department Manager approves within authority $\rightarrow$ Forwarded to Financial Operator $\rightarrow$ Financial Operator approves/rejects $\rightarrow$ If approved, reflected as a negative credit line on the guest folio.
   - **High-Value Requests ($> ₹10,000$)**: Department Manager escalates to General Manager $\rightarrow$ General Manager reviews (rejects or concurs & forwards to Finance) $\rightarrow$ Financial Operator approves/rejects $\rightarrow$ If approved, reflected as a negative credit line on the guest folio.
   - **Boundary Definition**: Exactly ₹10,000 is configured under the standard Department Manager approval ceiling via `MANAGER_COMPENSATION_THRESHOLD = 10000` (flagged for user confirmation).
   - **Folio Safety**: Disapproved/rejected claims are NEVER posted to guest folios or checkout balances.

2. **Department Manager Workflows (`/staff/department-manager`)**:
   - **Task Monitoring**: Receives supervisor-escalated tasks from combined Dispatcher / Supervisor (`department_dispatcher_supervisor`). Can accept & resolve, reject with directive, or escalate to General Manager. Decisions visible to originating supervisor.
   - **Staff & Shift Scheduling**: View shifts (Morning 07:00–15:30, Evening 15:00–23:30, Night 23:00–07:30), assign staff, and resolve scheduling conflicts. Live workload cards reflect shift assignments.
   - **Weekly & Monthly Reports**: Multi-window reporting (Today, This Week, Last Week, This Month, Last Month) with volume, completion, SLA breaches, escalations, service quality scores, visual SVG trend graphs, and frontend CSV export.
   - **Department Service Policies**: Manage local operational instructions and authority ceilings (up to ₹10,000). Distinct from General Manager property-wide policies; propagates to frontline roles in shared policies modal.
   - **Initiate Inspection Directives**: Select target department and assigned supervisor (e.g. Meera Nambiar or Arjun Mehta). Dispatches directly into combined supervisor queue.

3. **Financial Operator Workflows (`/staff/finance`)**:
   - **Overview Tab**: 6 core KPIs (Revenue, Payments Received, Outstanding Balances, Pending Approvals, Refunds & Compensation, Unreconciled Transactions).
   - **Approval Inbox**: Dedicated tab for compensation claims forwarded through the escalation path with guest/stay reference, incident reference, department, amount (₹), reason, evidence, upstream approvals, and full audit trail.
   - **Folio Integration**: Approving a claim appends a negative credit line to `state.folios[room]`, reducing the checkout balance in Front Desk and Guest Portal immediately. Rejecting leaves folios untouched.

---

## Phase 4 Invariants & Connected Workflows (Front Desk, Security Responder & General Manager)

1. **Front Desk Workflows (`/staff/front-desk`)**:
   - **Live Pass Simulator**: Interactive simulated date/time horizon switcher on active/expected stays (Arrival 15:00, Mid-Stay Evening, Departure Day 09:00, Post-Checkout Expired, and custom date/time) recalculating access validity and cryptographic NFC token dynamically.
   - **Need Action Section**: Prioritized cards for urgent guest requests, pending arrival ID verification, and Safety Alert validations (`Validate & Escalate to Manager` and `Broadcast Live Alert`).
   - **Room Status Refinement**: Removed Inspection & Out of Order from Front Desk Room Status; added Check-In & Check-Out filters and KPI tiles. Removed OOO block trigger from room dialog.
   - **Guest Reminders & VIP**: Operational reminders manager with status toggles (`pending` / `completed` / `dismissed`) and VIP preview panel synchronized with GM VIP.
   - **Service Authority**: Front Desk authority guidelines (₹2,500 goodwill credit, room relocation, key issuance, safety escalation).

2. **Security Responder Workflows (`/staff/security`)**:
   - **Incident Management**: Incident details include report origin attribution and Front Desk validation history (unvalidated guest reports flagged with warning badge).
   - **Dedicated Safety Alerts Tab**: Complete broadcast workflow with draft modal, status filters, audit history modal, and resolve actions.
   - **Tactical SOP Playbooks**: Safety Alert Broadcast, Guest Incident Verification, and BMS Fire Alarm SOPs with explicit notice that municipal fire dispatch is pending configuration per roadmap.
   - **Security Shift Handover**: Active incidents, unresolved issues, follow-up actions, evidence locker references, and handover creation form.

3. **General Manager Workflows (`/staff/general-manager` / `/staff/executive`)**:
   - **Priya Nair Persona (`EMP-0109`)**: Full executive operations command with dynamic live metrics (staff present, staff available, active incidents, SLA performance) and emergency broadcast banners.
   - **Approval Center**: Sole authority up to ₹2,00,000 for capex, high-value compensation (> ₹10,000), and Safety Alert broadcast authorizations.
   - **VIP Portfolio**: Guest roster (Anya Sharma Rm 402, Elena Rostova Rm 518), stay info, dietary/allergy preferences, synchronized reminders, grievance recovery cases, and action to log GM VIP reminders.
   - **Hotel-Wide Room Matrix**: 5-floor room inventory with live statuses, occupancy percentage, and RevPAR yield.

4. **Cross-Role Safety Alert Workflow**:
   - Security drafts alert $\rightarrow$ Front Desk validates operational impact $\rightarrow$ GM reviews & approves broadcast $\rightarrow$ Front Desk broadcasts alert $\rightarrow$ All roles receive in-app notification $\rightarrow$ Live alert appears on Security & GM with full audit history.

---

## Running Commands
- Development server: `npm run dev`
- Production build: `npm run build`
- Type checking: `npm run typecheck` or `npx tsc --noEmit`
- Linting: `npm run lint`

