# The Grand ADP · Hotel Management Platform

An interactive, high-fidelity luxury hotel operations frontend prototype built with **Next.js 15**, **React 19**, and **Tailwind CSS**.

The application is fully self-contained as a standalone frontend located in [`public-preview/`](public-preview/), featuring in-browser reactive state persistence (`localStorage`), simulated multi-role workflows, a public luxury resort website, an in-room digital guest portal, and nine specialized staff consoles.

---

## Architecture & Project Structure

The project root preserves all system requirements, workflow diagrams, and domain specifications. The runnable application resides directly within `public-preview/`:

```text
hotel-app-main (branch: frontend-only-replacement)
├── ARCHITECTURE.md, PRD.md, DESIGN.md...   # Preserved specifications
├── CLAUDE.md, FRONTEND_FEATURE_MAP.md...   # Sprint mapping and traceability
├── workflow digrams/                       # 13 hotel operational workflow diagrams
└── public-preview/                         # Standalone Next.js application root
    ├── package.json                        # Dependencies (Next.js 15.5, React 19.1, Tailwind 3.4)
    ├── next.config.mjs                     # Next.js configuration
    ├── tailwind.config.ts                  # Design tokens and luxury color palette
    ├── tsconfig.json                       # TypeScript configuration (@/* -> ./src/*)
    └── src/
        ├── app/                            # Next.js App Router routes
        │   ├── page.tsx                    # Landing overview
        │   ├── hotel/page.tsx              # Luxury resort showcase & booking wizard
        │   ├── guest/portal/page.tsx       # In-room digital guest services
        │   ├── login/page.tsx              # Role switcher & demonstration accounts
        │   └── staff/[role]/page.tsx       # Dynamic role console router
        ├── components/                     # 14 role-based component modules
        ├── lib/                            # State store (DemoProvider), mock datasets, domain logic
        └── types/                          # Complete TypeScript domain interfaces
```

---

## Key Features

1. **Public Luxury Hotel Portal (`/hotel`):**
   - Room catalog (Deluxe, Executive Suite, Royal Penthouse).
   - Side-by-side room specification compare modal.
   - Interactive 5-floor architectural unit explorer.
   - 5-step booking wizard with simulated payment authorization.
   - Self-contained SVG/CSS architectural scene engine (no external image dependencies).

2. **Digital Guest Portal (`/guest/portal`):**
   - Room-scoped digital concierge, dining orders, housekeeping, and amenity requests.
   - Live billing folio with charge dispute flows and simulated express checkout.
   - Non-sensitive lost & found claims.

3. **Nine Staff Role Workspaces (`/staff/[role]`):**
   - **Front Desk:** Arrival registration, stay verification, room moves, folio settlement, and keycard issue.
   - **Dispatcher:** Real-time departmental queue, auto/manual assignment, duplicate linking, and SLA monitoring.
   - **Fulfiller:** Task acceptance, step execution, blocker logging, completion evidence, and melodic audio chimes.
   - **Supervisor:** Dynamic turnover quality scoring (real-time recalculation), room release, corrective reopen, and shift handover.
   - **Duty Manager:** Cross-department escalations, compensation authorization thresholds, and hotel-wide incident logs.
   - **Executive / General Manager:** Dual-mode viewer/approver permission switcher, capex approvals, and incident audit.
   - **Finance:** Itemized invoices, payment records, refund authorizations, and audit exports.
   - **Security:** Urgent alarm response, incident logging, tactical SVG floor plan orientation, and audio sirens.
   - **Administrator:** Staff roster management, workflow SLA timers, room QR generation, and system diagnostics.

4. **Zero-Backend Standalone Operation:**
   - Pure client-side state machine (`DemoProvider` in `public-preview/src/lib/store.tsx`) with automatic `localStorage` persistence.
   - Instant client-side CSV spreadsheet generation via Blob URLs (quality audits, invoices, SLA compliance).
   - Currency localization standardized to Indian Rupee (INR `₹`) with `en-IN` numbering.

---

## Local Development

To run the application locally:

```bash
# 1. Navigate to the application root
cd public-preview

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

The application is pre-configured for automated deployment on **Vercel** with the Root Directory configured to `public-preview`. No external database, email provider, or environment variables are required.
