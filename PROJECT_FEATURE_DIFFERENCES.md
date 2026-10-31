# Project Feature Differences: Documented Requirements vs. Actual Implementation

**Document Reference:** `PROJECT_FEATURE_DIFFERENCES.md`  
**Audit Date:** October 2026  
**Audited Sources:** `PRD.md`, `ARCHITECTURE.md`, `TECH_STACK.md`, `DESIGN.md`, `ER_DIAGRAMS.md`, `IMPLEMENTATION_GUIDE.md`, `SECURITY.md`, `DECISIONS.md`, `TEST_PLAN.md`, `CLAUDE.md`, `FRONTEND_PROGRESS.md`, `FEATURE_TRACEABILITY.md`, `Tech_Team_Project_Guide_and_Feature_Spec.pdf`, 13 Workflow Diagrams (`workflow digrams/`), and the active source codebase (`src/`).

---

## A. Executive Summary

This audit compares the original requirement documents against the actual codebase of the Hotel Management System.

The original requirements—established primarily in `PRD.md` and `Tech_Team_Project_Guide_and_Feature_Spec.pdf`—specified an **operational coordination platform** for hotel staff. The original scope explicitly excluded building a full public hotel booking engine, comprehensive guest-facing portal, replacement Property Management System (PMS), or Point-of-Sale (POS). The original architecture documents (`TECH_STACK.md`, `IMPLEMENTATION_GUIDE.md`) also prescribed a heavy backend infrastructure: PostgreSQL, Drizzle ORM, Keycloak OIDC, Redis, and BullMQ background workers.

In contrast, the team was tasked with delivering a **complete, interactive, frontend-only prototype** within a 36-hour sprint. To achieve a functional end-to-end hotel simulation without a live server:
1. **The application was expanded** to include a full luxury public hotel website (`/hotel`), an interactive 5-floor architectural room explorer, a multi-step booking engine with simulated payments, and an in-room guest mobile portal (`/guest/portal`).
2. **All nine staff roles** were built out into rich, customized desktop and mobile applications connected through an in-browser reactive store (`useDemo()`, `DemoState`) with `localStorage` persistence.
3. **High-value features** were introduced to make the simulation realistic and operational, including native Web Audio API sirens, tactical SVG floor plans, dynamic quality scoring, client-side Blob CSV reporting, and currency localization to Indian Rupee (INR ₹).

The core operational invariants—such as 9 distinct RBAC profiles, separation of financial duties, QR session revocation on checkout/room move, and dual SLA tracking—were faithfully preserved in client state.

---

## B. Additional Implemented Features

The following features exist in the codebase but were not explicitly required in the original baseline documentation (`PRD.md`, `DECISIONS.md`), or were added as practical UI/UX enhancements.

### 1. Public Hotel Showcase Website & 5-Step Online Booking Engine
- **Related Route / Components:** `/` (redirects to `/hotel`), `src/components/hotel/` (`HotelPreview.tsx`, `RoomCatalog.tsx`, `BookingWizardModal.tsx`, `ManageBookingModal.tsx`)
- **What It Does:** Allows public visitors to browse hotel amenities, inspect room tiers (Deluxe, Suite, Penthouse), compare room specifications side-by-side, check date availability, and complete a 5-step reservation with simulated credit card authorization. Generates a confirmed stay record in Front Desk inventory.
- **Why It Is Additional:** `PRD.md` Section 6 explicitly states: *"A complete guest-facing portal, booking engine, payroll, inventory procurement and replacement PMS/POS/payment systems are not established requirements."* The team built it to provide an authentic starting point for guest journeys.
- **Current Status:** Complete.

### 2. Interactive 5-Floor Architectural Room Explorer
- **Related Route / Components:** `src/components/hotel/RoomExplorer.tsx`
- **What It Does:** Provides an interactive visual floor plan of Levels 1 through 5, rendering all 27 property units, public facilities (Lobby, Restaurant, Spa, Pool, Sky Lounge), live unit availability (Available, Reserved, Maintenance/OOO), and architectural attributes (terrace, corner window, garden patio).
- **Why It Is Additional:** Not mentioned in the original feature specification PDF or backlog. Added to enhance spatial orientation and visual luxury appeal.
- **Current Status:** Complete.

### 3. Pure SVG / CSS Architectural Artwork Engine
- **Related Route / Components:** `src/components/hotel/SceneVisual.tsx`
- **What It Does:** Renders self-contained, responsive vector illustrations for room categories, dining venues, spa pavilions, and lobbies without relying on external image URLs or stock photos.
- **Why It Is Additional:** Added as a technical safeguard against broken image links and external asset dependencies during offline evaluations.
- **Current Status:** Complete.

### 4. Curated Luxury Pastel "Baby Theme" Canvas & Distinct Top Bar
- **Related Route / Components:** `src/app/globals.css`, `src/components/frontdesk/frontdesk.css`, `src/components/shared/TopBar.tsx`
- **What It Does:** Implements a multi-tonal pastel palette (porcelain `#f9f3f6`, baby blush `#f4b6c2`, powder blue `#b3cde0`, seafoam `#83d0c9`) with an elevated sky-blue gradient top bar and floating porcelain cards, alongside full dark mode.
- **Why It Is Additional:** Replaces standard browser default aesthetics with a branded luxury hospitality design system.
- **Current Status:** Complete.

### 5. Native Web Audio API Sound Synthesizers
- **Related Route / Components:** `src/components/staff/security/securityChime.ts`, `src/components/staff/fulfiller/chime.ts`
- **What It Does:** Uses the native browser `AudioContext` to generate synthesised 2-tone melodic task chimes (587Hz $\rightarrow$ 880Hz) and urgent frequency warble sirens (880Hz / 1320Hz) for security alarms without downloading external `.mp3` or `.wav` files.
- **Why It Is Additional:** Suggested in `Tech_Team_Project_Guide_and_Feature_Spec.pdf` Section 4 Item 6, but technically implemented entirely client-side via Web Audio oscillators.
- **Current Status:** Complete.

### 6. Tactical SVG Floor Plan Orientation Modal
- **Related Route / Components:** `src/components/staff/security/SecurityFloorPlanModal.tsx`
- **What It Does:** Renders a high-contrast tactical architectural layout for security responders showing corridor corridors, emergency stairwells (E1, E2), fire hose cabinets (FHC), and pulsing incident beacons.
- **Why It Is Additional:** Suggested in user prompts to improve mobile responder orientation without implementing disallowed simulated GPS tracking.
- **Current Status:** Complete.

### 7. Client-Side Blob CSV Exporters
- **Related Route / Components:** `SupervisorReportsTab.tsx`, `FinanceReportsTab.tsx`, `ManagerReportsTab.tsx`, `ExecutiveReportsTab.tsx`
- **What It Does:** Generates and downloads well-formed CSV reports (quality audits, invoices, SLA compliance, capex commitments) directly in the browser using `Blob` and `URL.createObjectURL` with zero third-party npm libraries.
- **Why It Is Additional:** Replaces complex backend scheduled reporting with instant, offline-capable spreadsheet downloads.
- **Current Status:** Complete.

### 8. Currency Localization to Indian Rupee (INR ₹)
- **Related Route / Components:** `src/lib/utils.ts` (`money()`), `mockData.ts`, all role dashboards
- **What It Does:** Standardizes all monetary values, rate cards, delegated compensation limits, and transaction thresholds to Indian Rupee (`₹`) with `en-IN` numbering formats (e.g., ₹16,000; ₹2,00,000).
- **Why It Is Additional:** `DECISIONS.md` P-06 left currency unapproved (with sample `$200` defaults); the team adapted the application to a realistic Indian luxury hotel context.
- **Current Status:** Complete.

### 9. Dual-Mode Executive Permission Switcher
- **Related Route / Components:** `src/components/executive/ExecutiveConsole.tsx`, `ExecutiveApprovalsTab.tsx`
- **What It Does:** Features an interactive toggle between **Executive Viewer** (read-only audit, analytics inspection, disabled decision controls with explanatory tooltips) and **Executive Approver** (active decision authority up to ₹2,00,000).
- **Why It Is Additional:** Reconciles the ambiguous relationship between "Executive Viewer" and "Executive Approver" in source documents into a live demonstrable feature.
- **Current Status:** Complete.

### 10. Dynamic Room Turnover Quality Score Calculator
- **Related Route / Components:** `src/components/supervisor/InspectionModal.tsx`
- **What It Does:** Automatically recalculates quality compliance scores in real time as supervisors toggle checklist items across bathroom, linens, minibar, electronics, and safety categories.
- **Why It Is Additional:** Enhances standard pass/fail checklists with quantitative quality metrics.
- **Current Status:** Complete.

---

## C. Additional Planned or Proposed Features

The following items are documented as suggestions or team proposals in project notes (`Tech_Team_Project_Guide_and_Feature_Spec.pdf` Section 4) but have **not** been implemented in executable frontend code:

| Feature Name | Source Reference | Proposed Functionality | Implementation Status |
|---|---|---|---|
| **WhatsApp Two-Way Guest Bridge** | PDF Section 4, Item 1 | Webhook bridge converting WhatsApp button taps and text messages into Front Desk tickets. | **Planned / Unimplemented** (Requires live Meta Cloud / Twilio API). |
| **1-Tap Instant Payment Links** | PDF Section 4, Item 2 | Dynamic Razorpay / Stripe payment links for UPI, Apple Pay, and Google Pay. | **Planned / Simulated Only** (Frontend card simulation exists; live webhook payment links do not). |
| **Smart Mid-Stay Review Router (Day-2 Pulse)** | PDF Section 4, Item 3 | Automated Day-2 cron check routing ratings $\le 3$ to Duty Manager and $\ge 4$ to Google Reviews. | **Planned / Unimplemented** (Requires background cron worker). |
| **Express Camera ID Scan & OCR** | PDF Section 4, Item 4 | HTML5 camera capture uploading to S3 with AWS Textract OCR auto-filling guest passport details. | **Planned / Unimplemented** (Camera file input exists; live OCR parsing does not). |
| **Automated Flight / Train Delay Pickup Sync** | PDF Section 4, Item 7 | Aviationstack REST API integration monitoring guest flights and updating concierge airport transfers. | **Planned / Unimplemented** (Requires live external API access). |
| **Zero-Install PWA Push Notifications** | PDF Section 4, Item 8 | Native lock-screen Web Push API alerts via `sw.js` and VAPID keys. | **Planned / Simulated Only** (In-app notification center exists; native OS background push does not). |
| **Multi-Property Corporate Switcher** | `ARCHITECTURE.md` Section 1 | UI selector allowing corporate executives to toggle between multiple resort properties. | **Planned / Unimplemented** (Single property "Grand Heritage Palace / The Grand ADP" is active). |

---

## D. Changes to Original Requirements

Several documented requirements were modified, simplified, or adapted to fit the frontend prototype constraints:

### 1. Shift from Server-Side Backend to In-Browser Reactive State
- **Documented Requirement:** `ARCHITECTURE.md` and `IMPLEMENTATION_GUIDE.md` mandated PostgreSQL relational schema, Drizzle ORM, BullMQ background queues, Keycloak OIDC authentication, and Redis caching.
- **Actual Implementation:** Built as a pure client-side Next.js application. All state persistence, relational entity links, and data mutations are managed via `DemoProvider` (`src/lib/store.tsx`), typed interfaces (`src/types/demo.ts`), and `localStorage`.
- **Rationale:** Strict sprint rule: *"Frontend-only. No live backend, no database, no real external auth or network APIs."*

### 2. Department Manager and Duty Manager Role Unification
- **Documented Requirement:** `PRD.md` references "Department Manager" (reviewing department performance and coverage), while workflow diagrams and feature specs reference "Duty Manager" (cross-department incident command, escalations, and compensation up to limit).
- **Actual Implementation:** Unified into a single comprehensive console (`DutyManagerConsole.tsx`) under the role ID `department_manager` (URL `/staff/duty-manager`, persona **Marcus Vance** `EMP-0106`). Added a functional **Scope Switcher** ("My Department" vs. "Entire Hotel") to satisfy both roles within one interface.
- **Rationale:** Eliminates redundant screens while allowing evaluation of both single-department and hotel-wide management workflows.

### 3. Delegated Financial Authority Ceilings
- **Documented Requirement:** `DECISIONS.md` P-06 left financial limits open as a pending business decision, with a temporary `$200` prototype default.
- **Actual Implementation:** Standardized to a tiered hierarchy in Indian Rupees:
  - Front Desk Coordinator: ₹4,000 compensation ceiling.
  - Department / Duty Manager: ₹16,000 compensation ceiling.
  - Financial Operator: ₹80,000 transaction clearance limit.
  - Executive Approver: ₹2,00,000 capex and high-tier compensation delegation limit.
- **Rationale:** Reflects realistic tiered operational authority in an upscale Indian hotel property.

### 4. Seclusion of Role Switcher to `/login`
- **Documented Requirement:** Initial prototype layouts featured a persistent role-switcher banner across the top of every staff screen.
- **Actual Implementation:** The global role rail was removed from staff consoles and secluded to `/login` (Portal Login). Each staff dashboard now displays an authentic employee profile header (name, department, shift, active indicator, and dedicated Logout confirmation modal).
- **Rationale:** Required to evaluate each role realistically as an authentic individual employee workstation.

### 5. Dual SLA Clocks Simulation
- **Documented Requirement:** Spec Fix 4 required a backend state machine tracking separate Response SLA (time to acknowledge) and Resolution SLA (time to complete).
- **Actual Implementation:** Handled reactively on the client. Tasks store `slaDue` and `ackSlaDue` timestamp strings; overdue states are evaluated dynamically during rendering and user actions.
- **Rationale:** Faithful visual representation without running continuous background server processes.

---

## E. Unclear or Unverified Differences

1. **Missing Access CSV Files:** `Role-Mainaccess.csv` and `Rolelevel-Accessapproach.csv` are referenced in previous user prompts and documentation files, but do not exist as physical files in the repository. Their exact raw matrix could not be audited directly; their documented intent was inferred from `PRD.md`, `SECURITY.md`, and `FEATURE_TRACEABILITY.md`.
2. **Duty Manager vs. Department Manager Distinctness:** It remains ambiguous in the source documents whether a property is intended to employ separate individual Department Managers (e.g. Executive Housekeeper, F&B Director) alongside a rotating Duty Manager, or whether Duty Managers absorb departmental duties. The current scope toggle ("My Department" vs. "Entire Hotel") accommodates both interpretations.
3. **Task Fulfiller Cross-Department Capabilities:** In `src/lib/mockData.ts`, the primary fulfiller persona is Vikram Singh (Housekeeping). While engineering technicians and F&B runners are represented in rosters, the mobile fulfiller app defaults to Housekeeping tasks. Whether fulfillers should dynamically switch departmental roles on login is not defined in source specifications.

---

## F. Summary of Key Differences for Team Review

| Difference Area | Original Documentation Baseline | Current Project Reality | Recommended Action |
|---|---|---|---|
| **Public Website & Booking** | Excluded from scope (`PRD.md` Sec 6). | Complete 5-step booking engine with 5-floor explorer. | Keep as primary demonstration showcase for guest arrival flow. |
| **Backend & DB** | PostgreSQL, Redis, BullMQ, Keycloak. | In-memory reactive React store + `localStorage`. | Maintain client store for prototype; retain relational models for future backend sprint. |
| **Duty Manager Role** | Ambiguous separation between Dept Mgr & Duty Mgr. | Unified console with "My Dept" / "Entire Hotel" scope toggle. | Formally accept unified console design. |
| **Financial Currency** | Unapproved / temporary `$200` defaults. | Standardized INR ₹ hierarchy (₹4k / ₹16k / ₹80k / ₹2L). | Formally ratify INR ₹ monetary thresholds. |
| **External Integrations** | Real Twilio, Razorpay, Opera PMS, POS connectors. | Diagnostic simulators and state toggles (`healthy`, `degraded`, `down`). | Maintain mock connectors for frontend demonstrations. |
