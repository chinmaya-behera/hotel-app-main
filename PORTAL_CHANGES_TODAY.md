# Portal Enhancements & Daily Changelog
**Date:** November 14, 2026  
**Status:** Implemented & Verified in Local Workspace (Uncommitted / Not Pushed to Git)

---

## 1. Executive Summary
Today, major UI, functional, and architectural updates were completed across the operational portals of **The Grand ADP** hotel operations platform:
1. **Department Manager Portal** (`components/manager/` - `DepartmentManagerConsole.tsx`, `department-manager.css`, `manager-domain.ts`)
2. **Department Component & Route Aliases** (`src/components/department/DepartmentPortal.tsx`, `src/app/department/page.tsx`, `src/app/department-manager/page.tsx`)
3. **Task Fulfiller Portal** (`components/staff/fulfiller/`)
4. **Route Hardening & Server Error Fix** (`src/app/staff/[role]/page.tsx`, `src/lib/roles.ts`, `next.config.mjs`)

All changes strictly adhere to constraints:
- **Zero Git commits or pushes**: All modifications remain exclusively in the local working tree.
- **Role Isolation**: Changes are scoped strictly to the specified portals without modifying other roles.
- **Theme Consistency**: Full dark and light mode fidelity with the luxury warm sand theme palette.

---

## 2. Department Manager Portal (`/staff/department-manager`)

### A. Complete Decluttering & Layout Reorganization (Matching Design References)
- **Categorized Sidebar Navigation (`NAV_GROUPS`)**:
  - Organized navigation into three clear, luxury uppercase-labeled groups:
    - **`WORKSPACE`**:
      - `Overview` (`Gauge` icon)
      - `Room readiness` (`BedDouble` icon, dynamically labeled via `DESK_LABELS`)
      - `Complaints` (`MessageSquare` icon, live complaint count badge: `2`)
      - `Task Monitoring` (`Activity` icon, active highlight with warm sand pill and 3px left accent bar)
      - `Inspections` (`ClipboardCheck` icon)
      - `Escalations & Recovery` (`Handshake` icon, live count badge: `1`)
      - `Record history` (`History` icon)
    - **`MANAGEMENT`**:
      - `Staff & Workload` (`Users` icon)
      - `Policies` (`BookOpen` icon)
      - `Analytics` (`BarChart3` icon)
    - **`PERSONAL`**:
      - `Notifications` (`Bell` icon, combined unread badge)
      - `Profile` (`UserRound` icon)
- **Topline & Heading Streamlining**:
  - Removed redundant `.dm-live` ("Department access") pill from topline tools.
  - Added clean date badge `[ 📅 14 Nov 2026 ]` in `.dm-heading-actions` across all tabs.
  - On Overview tab, the primary `[ 📋 Start inspection ]` button is cleanly positioned next to the date badge.
  - Dynamic eyebrow header `DEPARTMENT OPERATIONS` with context-specific subtitles.
- **Elimination of Overview Clutter**:
  - Removed duplicate `.dm-overview-meta` banner (which previously showed a redundant date string and "Housekeeping only" banner above the KPI cards).
  - KPI cards now sit directly below the heading with generous whitespace.
- **5-Column Luxury Task Monitoring Table**:
  - Streamlined table headers: `ROOM NO.` | `OWNER` | `PRIORITY` | `STATUS` | (empty actions header).
  - Room column: bold room number (e.g. `Room 402` or `General`) with clean subtitle (`HK-402-091126 · Sample`) and optional photo proof tag.
  - Owner column: cleanly displays assignee name (`Unassigned`, `Vikram Singh`, `Sana Sheikh`).
  - Priority pills:
    - `• Urgent`: Soft reddish tint pill with dark red dot and text.
    - `★ VIP`: Warm gold tint pill.
    - `Normal`: Subtle warm neutral pill.
  - Status pills:
    - `✓ Completed`: Soft green tint pill with checkmark.
    - `In progress`: Neutral warm pill.
    - `Assigned`: Neutral warm pill.
    - `Unassigned`: Neutral warm pill.
  - Actions: Pill-shaped `[ Details ]` button opening comprehensive task modal.
- **Guest Complaints & Feedback View**:
  - Added dedicated `Complaints` tab under `WORKSPACE` displaying guest service complaints with room, guest name, issue description, status, and quick drill-down to related tasks. Seeded with `seedGuestComplaints` fallback so active complaints display immediately.

### B. Quality Inspection Modal (`Conduct quality inspection` - Matching Image 2)
- **Inspection Scope Selector**:
  - 3-card scope cards side-by-side:
    1. `Particular room / area` (`BedDouble` icon, "1 location", active warm sand pill)
    2. `Overall rooms on floor` (`Layers` icon, "Floor sweep")
    3. `All rooms (hotel-wide)` (`Building2` icon, "27 rooms")
- **Room Selector & Quick Chips**:
  - Dropdown selector (`Room 402 · Floor 4`, etc.).
  - Quick room chips: `[ 127 ] [ 210 ] [ 301 ] [ 302 ] [ 303 ]`.
- **Form Controls & Summary**:
  - Dual dropdown grid: `Inspection type` (`Turnover clean`, `Deep clean audit`, `VIP arrival readiness`, etc.) and `Priority` (`Normal`, `Urgent`, `VIP`).
  - Footer with dynamic scope summary on the left (`Scope: 402 · 1 inspection`), `[ Cancel ]` button, and `[ Launch inspection ]` dark button with clipboard icon.

### C. Photo Verification & Photographic Proof-of-Work Workflow
- **Task Table Integration**:
  - Tasks with photo proof display interactive verification action buttons:
    - **Awaiting Verification**: Warm amber pill `[ 📷 Verify Photo ]` with an animated pulsing dot indicator (`.dm-photo-action-btn.to-verify`).
    - **Approved / Verified**: Crisp emerald green pill `[ ✓ Photo Verified ]` (`.dm-photo-action-btn.verified`).
  - Clicking either button directly opens the interactive Photo Proof & Verification modal.
- **Dedicated Toolbar Quick Filter**:
  - Added `[ 📷 Photos to be verified ({count}) ]` pill button (`.dm-filter-chip-btn`) with live badge count directly in the Task Monitoring toolbar for one-click filtering.
  - Filter dropdown options extended to include:
    - `Photos to be verified ({count})`
    - `Photos verified`
    - `All with photo proof`
- **Interactive Photo Proof Modal Dialog (`photoDialog`)**:
  - **Awaiting Verification State**:
    - Displays amber status banner: `[AlertTriangle] Photo Proof Awaiting Manager Verification` — *"Attendant has submitted photographic evidence of task completion. Inspect the photo quality and approve or request a retake."*
    - Manager Action Buttons:
      - `[ ✓ Verify & Approve Photo ]` (Emerald primary button that marks evidence verified in real time, plays pleasant audio chime, and updates table badges).
      - `[ ↺ Request Retake ]` (Sends retake notice back to fulfiller queue).
      - `[ ⭳ Download ]` & `[ Close ]`.
  - **Verified State**:
    - Displays emerald badge banner: `[Sparkles] Photographic Proof Verified` — *"Verified by [Manager Name] on [Date/Time]. Meets luxury housekeeping standards."*
    - Direct audit attribution with manager name and approval timestamp.
- **Task Details Modal Integration (`detailsDialog`)**:
  - Displays attached photo proof thumbnail with live verification status pill (`Awaiting Verification` vs `Photo Verified`).
  - Clicking the thumbnail opens the full verification dialog for immediate manager review.

### D. Luxury Typography & Font Size Scaling (Matching Reference Screenshots)
- Upgraded small, hard-to-read 9px–11px text across the entire Department Manager suite to comfortable, legible 13px–15px luxury typography:
  - **Overview**:
    - Eyebrow header: `10px -> 12px` (uppercase with letter spacing).
    - H1 Page Title: `26px -> 28px`.
    - Page Subtitle: `13px -> 14px`.
    - Date Pill: `12px -> 13px`.
    - KPI Metrics: values enlarged to `34px`, labels `13px`, sub-details `12px`.
    - Attention Required & Escalation Rows: room title `15px`, description `13px`.
    - Shift Snapshot: completion percentage `38px`, details `20px`.
  - **Task Monitoring Table**:
    - Headers (`th`): `10px -> 11px` (uppercase, letter-spaced).
    - Room Numbers: `13px -> 15px` bold.
    - Reference IDs & Subtitles: `11px -> 12px`.
    - Owner & Staff Names: `13px -> 14px`.
    - Priority & Status Pills: `11px -> 12px` (padding `5px 12px`).
    - Action Buttons: `11px -> 12px` (padding `6px 14px`).
  - **Room Readiness Cards**:
    - Room Numbers: `24px` bold with negative letter spacing.
    - Status badges: `12px` bold uppercase with `4px 10px` padding.
    - Floor & Occupancy details: `14px`.
    - Action Buttons: `13px`.
  - **Modals (Conduct Quality Inspection & Assign Inspection)**:
    - Modal Headings: `18px -> 20px` bold.
    - Scope Selector Cards: strong titles `14px`, descriptions `13px`, tags `12px`.
    - Form Labels: `11px -> 13px` bold.
    - Input & Select controls: `12px -> 14px` with `42px` min-height.
    - Room quick-pick chips: `12px -> 13px` with `6px 14px` padding.
    - Dynamic scope summary: `11px -> 13px`.
  - **Staff & Workload and Analytics**:
    - Metric strip values: `26px` bold, category labels `12px` uppercase.
    - Insight notes: `13px` with high-contrast text and comfortable line height.

### E. Notification Popover & Dedicated Sub-Tabs (Matching Task Fulfiller System)
- **Topline Notification Bell with Dropdown Popover**:
  - Shows combined unread count (notifications + unacknowledged safety alerts).
  - Click opens popover with Recent Messages and live Security Alert Broadcast banner.
- **Full Notifications Screen**:
  - Two-segment switcher: `All Notifications` vs `Security Alerts`.
  - Sub-filters: `All` vs `Unread / Unacknowledged`.
  - Alert chimes toggle (`Volume2` / `VolumeX`) with audio chime playback.
  - `Ack All` action buttons.
  - Connected directly to store state for safety alerts with broadcast acknowledgment.

---

## 3. Department Component & Route Aliases
- **Created `DepartmentPortal.tsx`**:
  - Created `src/components/department/DepartmentPortal.tsx` which re-exports `DepartmentManagerConsole`. Fixes missing file error in editor tabs when navigating to department components.
- **Dedicated Route Pages**:
  - Created `src/app/department/page.tsx` and `src/app/department-manager/page.tsx` with direct Next.js redirects to `/staff/department-manager`, eliminating any 404 or rewrite resolution errors.

---

## 4. Internal Server Error Fix & Route Resilience
- **Root Cause Identified**:
  1. `dynamicParams = false` in `src/app/staff/[role]/page.tsx` caused Next.js 15 to throw an unhandled missing param exception (`HTTP 500 Internal Server Error`) when navigating to alternative or legacy role paths (e.g. `/staff/department`, `/staff/department_manager`, `/staff/manager`).
  2. `ensureManagerState` in `manager-domain.ts` was spreading `s.staffAccounts` and accessing `next.items.department_manager` without defensive fallback defaulting (`?? []`), which could throw a `TypeError` during state rehydration from localStorage.
- **Resolution**:
  - Set `export const dynamicParams = true;` in `src/app/staff/[role]/page.tsx` so unlisted parameters gracefully fall back to `notFound()` instead of crashing the server.
  - Expanded `generateStaticParams()` to pre-render both slug names and role IDs (`department_manager`, `task_fulfiller`, etc.) alongside aliases (`department`, `manager`, `duty-manager`).
  - Added comprehensive slug alias mapping to `roleBySlug` in `src/lib/roles.ts`.
  - Added automatic rewrites in `next.config.mjs` for `/department` and `/department-manager` mapping straight to `/staff/department-manager`.
  - Fortified `ensureManagerState` in `manager-domain.ts` with nullish coalescing defaults for `staffAccounts`, `items.department_manager`, and `items.task_fulfiller`.

---

## 5. Task Fulfiller Portal (`/staff/task_fulfiller`)

### A. Comprehensive Multi-Language Localization
- Supported all 22 official languages of India (8th Schedule) + English with dynamic script translations.
- Searchable language picker modal and header quick dropdown.

### B. UI De-Cluttering & Simplified Vocabulary
- Replaced technical term `"Blocker"` with plain `"Block"` across all buttons, modals, and status badges.
- Removed clutter text from card surfaces:
  - Removed `"Pending at Supervisor Inspection"` text lines and supervisor assignment boxes.
  - Removed `"Supervisor review pending"` strings from card surfaces.
  - Removed worker assigned-to names from front of task cards, keeping them inside the **Details** modal.
- Only truly urgent tasks are highlighted in red; routine items use warm neutral styling.

### C. Duty, Break & Shift Request System (`BreakRequestModal.tsx`)
- Tabbed request workflows for On Duty, Off Duty, and On Break with custom break durations and reason selections.

---

## 6. Verification & Test Suite
- **TypeScript Typecheck**:
  - `npm run typecheck` (`tsc --noEmit`) exited 0 with zero errors.
- **Manager Domain Unit Tests**:
  - `npm run test:manager` executed 23/23 tests, 100% passing.
- **Next.js Production Build**:
  - `npm run build` compiled successfully in 7.6s, generating all 35 static pages.
- **Git State**:
  - `git status` confirms zero commits made and zero pushes executed. All modifications reside in the local working tree.

---

## 7. Department Manager UI Cleanup & Attention Required Fix (Nov 14)

### A. "Attention Required" Overview Card De-Cluttering
- **Removed the Unwanted Photo Button/Line**:
  - Completely removed `{photo && (<button className="dm-photo-btn">... Photo</button>)}` and its wrapping container from the "Attention required" escalation rows in `DepartmentManagerConsole.tsx`.
  - Photos for verification belong exclusively in the **Task Monitoring** tab (where managers verify task proof photos). Removing this button prevents awkward wrapping and clutter in the high-level escalation list.
  - Positioned the `<span className="dm-status urgent">Needs review</span>` badge as a clean, compact inline-flex pill directly below the subtitle with no awkward borders or trailing lines.

### B. Sidebar Brand & Department Card UI Corrections
- **Sidebar Brand Clumping Fix**:
  - Added explicit `dm-sidebar-brand-text` container around the brand headings in `DepartmentManagerConsole.tsx`.
  - Added CSS rules for `.dm-sidebar-brand-text, .dm-sidebar-brand > div` with `display: flex; flex-direction: column; min-width: 0;` and `white-space: nowrap;`.
  - Fixed the visual bug where `THE GRAND` wrapped and `ADP` and `Manager` clumped together as `ADPManager`. Now clearly shows:
    - Line 1: `THE GRAND ADP`
    - Line 2: `Manager workspace`
- **Department Lock Card Clumping Fix**:
  - Updated markup to `className="dm-department-card dm-department-label"` with child `.dm-department-info`.
  - Unified CSS for both `.dm-department-card` and `.dm-department-label` so `<small>` ("Your department") and `<strong>` ("Housekeeping") render on separate stacked lines with proper typography.
  - Fixed the visual bug where text clumped into `Your departmentHousekeeping`.

### C. Workspace & Save Conflict Synchronization
- **File Alignment**:
  - Synchronized `DepartmentManagerConsole.tsx` and `department-manager.css` across both `c:\ADP\hotel_app\public-preview` and `c:\ADP\hotel_app\hotel-app-main\public-preview`.
  - Unified all CSS rules (including Section 11 room readiness grids and photo verification actions) so that editing in VS Code does not encounter "The content of the file is newer" conflicts.

### D. Verification
- **TypeScript Typecheck**:
  - `npm run typecheck` (`tsc --noEmit`) exited with code 0 (0 errors).
- **Unit Test Suite**:
  - `npm run test:manager` executed 23/23 tests, 100% passing.
- **Git Safety Check**:
  - Verified `git status` in `hotel-app-main`: **0 commits made, 0 pushes executed**. Existing branch and history remain completely untouched.

---

## 8. Department Manager → Task Monitoring Table & Toolbar Correction (Nov 14)

### A. Dedicated 6-Column Table Layout
Reorganized the Department Manager Task Monitoring table to follow the exact required 6-column order:

1. **`ROOM`**:
   - Contains room number (e.g. `Room 402` or `General`) and task reference/title subtitle (`HK-402-091126 · Sample`).
   - Removed the inline `Verify Photo` / `Photo Verified` button from beside the task title to eliminate clutter in the room cell.
2. **`OWNER`**:
   - Displays task assignee name (e.g. `Vikram Singh`, `Sana Sheikh`) or `Unassigned`.
3. **`PRIORITY`**:
   - Standard priority pill (`Urgent` with pulse dot, `★ VIP`, `Normal`).
4. **`STATUS`**:
   - Standard status pill (`✓ Completed`, `In progress`, `Assigned`, `Unassigned`).
5. **`PHOTO`**:
   - Dedicated column for actual task attached photo.
   - For tasks with photo evidence: displays a compact, rounded 42x42px thumbnail with original aspect ratio preserved (`object-fit: cover`).
   - Includes verification indicator badge on the thumbnail (`✓` checkmark in green for verified, `Eye` in amber for pending verification).
   - Clicking the thumbnail opens the complete photo preview & manager verification modal dialog (`Verify & Approve Photo`, `Request Retake`, `Download`).
   - For tasks without photo evidence: displays a clean, subtle `No photo` badge.
   - No dummy or unrelated placeholder images are rendered.
6. **`ACTION`**:
   - Aligned to the right with the header `ACTION`.
   - Contains the `[ Details ]` button to inspect task full details.

### B. Toolbar Simplification
- **Removed Top Photo Controls from Toolbar**:
  - Removed the highlighted `[ 📷 Photos to be verified ({count}) ]` chip button.
  - Removed `Photos to be verified ({count})`, `Photos verified`, and `All with photo proof` from the status filter dropdown.
  - Preserved standard request filters:
    - `All requests`
    - `Open requests`
    - `Completed requests`
    - `Urgent requests`

### C. Styling & Design Consistency
- Added `.dm-photo-thumb-btn`, `.dm-photo-thumbnail`, `.dm-photo-status-badge`, and `.dm-no-photo-badge` to `department-manager.css`.
- Fully integrated with the hotel app's warm beige, white, and brown palette and dark mode tokens (`.warm-theme[data-theme='dark']`).
- Preserved horizontal table responsiveness with `.dm-table-wrap`.

### D. Synchronization & Verification
- Synchronized across both `public-preview/` and `hotel-app-main/public-preview/`.
- `npm run typecheck` (`tsc --noEmit`): **0 errors**.
- `npm run test:manager`: **23/23 tests passing**.
- Git verification: **0 commits, 0 pushes**. All modifications local only.

---

## 7. Resolution: Elimination of Unwanted Horizontal Line Across Department Manager

### A. Root Cause Analysis
- **Symptom**: A thin, persistent horizontal line (~680px wide, color `#BAB4A3` / `--warm-control`) hovered in the middle of the viewport across the Department Manager interface (overlapping Attention Required at top scroll, Active Requests when scrolled down, and Task Monitoring in other tabs).
- **Exact Root Cause**:
  - The photo preview and verification modal dialog `<dialog ref={photoDialog} className="dm-photo-preview-dialog">` was declared at the root of `DepartmentManagerConsole.tsx`.
  - In `department-manager.css`, the rule `.dm-photo-preview-dialog, .dm-details-dialog` applied `display: flex;` unconditionally without checking for `:not([open])` or scoping to `[open]`.
  - In CSS cascade rules, author class selectors (`.dm-photo-preview-dialog`) have higher specificity than the browser's default user-agent rule `dialog:not([open]) { display: none; }`.
  - Consequently, even when closed (`photoPreview === null`), the dialog element was rendered by the browser with `display: flex`, collapsed to 0px height with a 1px top and bottom border of `--dm-accent` (`#BAB4A3`), `width: min(680px, calc(100% - 32px))`, and centered via `position: fixed; inset: 0; margin: auto`.
  - This rendered an unwanted 680px wide horizontal line across the viewport center.

### B. Solution Implemented
1. **CSS Hardening (`department-manager.css`)**:
   - Added strict rule ensuring all closed dialogs remain completely hidden:
     ```css
     dialog:not([open]),
     .dm-dialog:not([open]),
     .dm-inspection-dialog:not([open]),
     .dm-photo-preview-dialog:not([open]),
     .dm-details-dialog:not([open]),
     .dm-task-details-dialog:not([open]) {
       display: none !important;
     }
     ```
   - Scoped flexbox layout and dimensions strictly to open states:
     - `.dm-photo-preview-dialog[open]`, `.dm-details-dialog[open]`, `.dm-task-details-dialog[open]`
     - `.dm-inspection-dialog[open]`
     - `.dm-dialog[open]`
   - Formatted `.dm-details-meta-item span` and `strong` to ensure clean typography in the task details dialog without cramped inline text.
2. **Component Guarding (`DepartmentManagerConsole.tsx`)**:
   - Added explicit inline style guards on all dialog elements:
     - `style={!photoPreview ? { display: 'none' } : undefined}` on `photoDialog`
     - `style={!detailsTask ? { display: 'none' } : undefined}` on `detailsDialog`
     - `style={!modal ? { display: 'none' } : undefined}` on `dialog`
   - Guarantees zero phantom rendering regardless of browser user-agent quirks or lifecycle timing.

### C. Verification
- Type check: `npm --prefix public-preview run typecheck` (`tsc --noEmit` passed with 0 errors).
- Test suite: `npm --prefix public-preview run test:manager` (23/23 tests passing).
- Both local repositories (`public-preview/` and `hotel-app-main/public-preview/`) synchronized.
- Git status: **0 commits, 0 pushes**. All modifications remain strictly in local working files.

---

## 8. Resolution: Modal Decluttering & Layout Reorganization (Task Details & Table Parity)

### A. Root Cause Analysis
- **Problem**: In the Department Manager Task Details dialog (`media_1794676986583_7c51ebeb.jpg`), multiple UI elements were clustered and overlapping:
  1. The close `[X]` button was misaligned and rendered on a second line below the header, overlapping the task title ("Open claim: Baby crib...").
  2. The metadata items inside the beige card ran together without line breaks or block separation: `Room / AreaRoom 215`, `OwnerUnassigned`, `Target / ScheduleHousekeeping...`, and `Created09:45`.
  3. The dialog lacked dedicated header, body, and footer containers, causing button crowding in the action strip.
  4. The background 6-column task table lacked dedicated column proportions, causing the room details cell to expand unevenly.

### B. Solution Implemented
1. **Task Details Modal Overhaul (`DepartmentManagerConsole.tsx`)**:
   - Replaced unstyled ad-hoc markup with dedicated semantic containers:
     - `.dm-details-head`: Flex container aligning the task badge and title (`Task Details` + Room/Ref) on the left and the close `[X]` button cleanly on the top-right corner.
     - `.dm-details-hero-card`: Card for the task title and long-form description with proper font hierarchy.
     - `.dm-details-meta-grid`: Structured 2-column grid separating labels (`.dm-details-meta-label` uppercase 11px) from values (`.dm-details-meta-val` bold 14px), completely eliminating text collision.
     - `.dm-details-photo-section`: Clear proof inspection box with verification indicator.
     - `.dm-details-foot`: Cleanly padded footer separating secondary (`Review / Escalate`) and primary (`Close`) actions.
2. **CSS Enhancements (`department-manager.css`)**:
   - Styled `.dm-dialog-heading` as a flex container (`space-between`) with zero margin-bottom on title badges to ensure all modals (inspections, recovery, handover, policies) maintain top-right close button alignment.
   - Added explicit column proportions to `.dm-task-table`:
     - `ROOM`: `min-width: 240px`
     - `OWNER`: `width: 140px`
     - `PRIORITY`: `width: 110px`
     - `STATUS`: `width: 130px`
     - `PHOTO`: `width: 110px; text-align: center`
     - `ACTION`: `width: 100px; text-align: right`
3. **Synchronization & Verification**:
   - Fully synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
   - `npm run typecheck` (`tsc --noEmit`): **0 errors**.
   - `npm run test:manager`: **23/23 tests passing**.
   - Git verification: **0 commits, 0 pushes**. All modifications local only.

---

## 9. Visual Parity with Reference Design (Department Manager Overview & Component States)

### A. Parity Check Against User Reference Screenshots
1. **Overview Top Half (`media_1794679466597_ff13c649.png`)**:
   - **Topbar**: Breadcrumb `Housekeeping > Overview` on left; `• Department access` pill, theme toggle (moon), notifications bell with count badge (`1`), and avatar (`AR`) on right.
   - **Heading Actions**: Single primary button `[ 📋 Start inspection ]` on the Overview tab (date badge cleanly restricted to non-overview views).
   - **Overview Meta Strip**: Left side displays `[ 📅 Saturday, 14 November ]` and right side displays `[ 🔒 Housekeeping only ]`.
   - **4 KPI Metric Cards**: Structured in a clean 4-column grid (`repeat(4, 1fr)`) with uppercase label, warm rounded square icon badge (`32x32px`), large 32px metric value, subtext, and corner diagonal arrow (`↗`):
     - `ACTIVE REQUESTS`: `22` / `Across your department`
     - `PENDING INSPECTIONS`: `4` / `4 awaiting assignment`
     - `OPEN ESCALATIONS`: `1` / `Ready for your review`
     - `TEAM ON DUTY`: `4` / `of 4 active team members`
   - **Full-Width Complaints Banner**: Positioned directly beneath KPI cards with `MessageSquare` icon, `Resolve complaints` title, live badge count `2`, and chevron `>`.
   - **Attention Required Card**:
     - Status badge styled with soft red pill and dot: `• Needs review`.
     - Right button: `Open escalations >` (`.dm-attention-action-btn`).
     - Footer note: `[ 🔒 Cases are limited to your department. ]`.
   - **Shift Snapshot Card**:
     - Top pill: `DAY SHIFT`.
     - Metric: `12%` / `Request completion` / `3 of 25 requests complete`.
     - Progress bar filled ~12%.
     - Bottom metrics: `Team on duty` above `4`, `Open requests` above `22`. Zero unnecessary bottom buttons.

2. **Overview Bottom Half (`media_1794679542205_d069c573.png`)**:
   - **Inspection Queue Card**: Header with count badge `[ 4 ]` and `View all ↗`; 3 pending inspection items (`402 · Deluxe King Suite`, `518 · Presidential Suite`, `210 · Executive Double`), each with `Assign >` action button.
   - **Room Readiness Card**: Small bed icon + `Department tools` label, `Room readiness` title, `21 rooms ready · 2 do not disturb` stat line, and dark `Open department desk →` button.
   - **Active Requests Table (Overview)**: Rendered via `taskRows(active.slice(0, 5), false)` with exact 5 columns:
     - `ROOM NO.` | `OWNER` | `PRIORITY` | `STATUS` | `ACTION`
     - Bold room header with subtitle, assignee name, priority pill (`• Urgent`), status pill (`Unassigned`), and `[ Details ]` button.

3. **Task Monitoring Tab (`tab === 'tasks'`)**:
   - Maintains exact 6 columns: `ROOM` | `OWNER` | `PRIORITY` | `STATUS` | `PHOTO` | `ACTION`.
   - Dedicated `PHOTO` column with interactive thumbnail and verification indicators.
   - Clean top toolbar without cluttered verification buttons.

4. **Task Details Modal & Dialogs**:
   - Fully decluttered 2-column card grid with separate label and value containers.
   - Complete `:not([open]) { display: none !important; }` rule preventing phantom border lines.

### B. Verification
- `npm --prefix public-preview run typecheck`: **0 errors**.
- `npm --prefix public-preview run test:manager`: **23/23 tests passing**.
- Local files synchronized with `hotel-app-main/public-preview/`.
- Git status: **0 commits, 0 pushes, 0 branch switches**.

---

## 10. Department Tools / Room Readiness Summary Card & Two-Column Grid Alignment

### A. Root Cause Analysis
- **Missing Card CSS**:
  - `<section className="dm-panel dm-desk-summary">` in `DepartmentDesk.tsx` had zero custom CSS rules defined in `department-manager.css`.
  - As a result, it fell back to bare `.dm-panel` defaults without internal padding, causing contents to press against the card border.
  - The bed icon lacked the warm beige rounded-square container.
  - Subtitle "Department tools" lacked dedicated typography and spacing.
  - Heading and room statistics lacked hierarchy and margins.
  - The button was styled as an inline `.dm-primary` instead of a full-width bottom-pinned dark button with `justify-content: space-between`.
- **Grid Height Misalignment**:
  - Inside `.dm-overview-grid`, items inherited a `margin-bottom: 24px` from `.dm-panel`, preventing `align-items: stretch` from aligning the bottom edges of the left and right cards evenly.

### B. Solution Implemented
1. **Department Tools Summary Card (`DepartmentDesk.tsx`)**:
   - Structured card markup with semantic classes:
     - `.dm-desk-card-label`: Flex container with 12px gap.
     - `.dm-desk-icon-container`: 38×38px rounded square (10px radius) in `--warm-surface` (`#ede6de`) with thin border, enclosing `<DeskIcon size={20} />`.
     - `.dm-desk-subtitle`: 13px semi-bold muted text `Department tools`.
     - `.dm-desk-heading`: 20px bold ink heading `Room readiness`.
     - `.dm-desk-stats`: 14px medium muted stat string (`21 rooms ready · 2 do not disturb`).
     - `.dm-desk-card-detail`: 13px muted description with 1.5 line height.
     - `.dm-desk-action-btn`: Full-width dark button (`background: var(--dm-ink)`) with `color: var(--dm-paper)`, `justify-content: space-between`, bold 14px text `Open department desk`, and `<ArrowRight size={16} />`, pinned to the bottom via `margin-top: auto`.
2. **Two-Column Grid Alignment (`department-manager.css`)**:
   - Updated `.dm-overview-grid` to `grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr)` with `align-items: stretch` and `gap: 20px`.
   - Set `.dm-overview-grid > .dm-panel, .dm-overview-grid > .dm-desk-summary` to `height: 100%; margin-bottom: 0; display: flex; flex-direction: column`.
   - Set `.dm-priority-panel .dm-card-note` and `.dm-shift-card .dm-snapshot-details` to `margin-top: auto` so Row 1 cards align their bottom edges.
   - Set `.dm-desk-action-btn` to `margin-top: auto` so Row 2 cards align their bottom edges.
   - Added responsive single-column collapse at `@media (max-width: 1024px)`.
   - Added dark theme compatibility via `.warm-theme[data-theme='dark']`.
3. **Synchronization & Verification**:
   - Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
   - `npm run typecheck`: **0 errors**.
   - `npm run test:manager`: **23/23 tests passing**.
   - Git compliance: **0 commits, 0 pushes**.

---

## 12. Dashboard Spacing, Typography Standardization & Modal Refinement (Batch Fix)

### A. Attention Required Card Refinement (Image 4 & 6 Parity)
- **Compact Escalation Badge**:
  - Eliminated full-width stretching of the `.dm-status.urgent` (`• Needs review`) badge by setting `align-self: flex-start`, `max-width: fit-content`, `width: auto`, and configuring the text wrapper `.dm-attention-row > div:nth-child(2)` as a flex column with `align-items: flex-start`.
  - Maintained elegant luxury warm styling with soft reddish background (`#fee2e2`), border (`#fecaca`), and dark red text (`#991b1b`).
- **Compact Padding**:
  - Adjusted `.dm-attention-row` internal padding to `14px 22px` for a crisp, professional density.
  - Ensured `:last-child` and `:last-of-type` border cleanly resets.

### B. Shift Snapshot Card Vertical Spacing & Action Button (Image 1 & Screenshot 1 Parity)
- **Eliminated Giant Whitespace Gap**:
  - Removed `margin-top: auto` from `.dm-snapshot-details` which had previously pushed stats into a massive void.
  - Positioned `Team on duty` and `Open requests` immediately below the progress bar with a subtle top border divider (`padding-top: 14px; border-top: 1px solid var(--dm-line)`).
- **Added Pinned Handover Button**:
  - Added `.dm-handover-action-btn` (`[Send icon] Prepare handover ↗`) pinned to the bottom via `margin-top: auto; align-self: flex-start;`, directly matching Screenshot 1 and Image 1.
  - Connects to `openModal({ kind: 'handover' })` for instant operational utility.

### C. Task Details Modal Overhaul (Image 3 Parity)
- **Fixed Header & Close Button Alignment**:
  - Set `.dm-details-head` to `display: flex; justify-content: space-between; align-items: center; width: 100%`.
  - Pinned the `[X]` close button to the top-right corner using `margin-left: auto; flex-shrink: 0`, preventing it from dropping below the icon badge.
- **Fixed Label & Value Collision**:
  - Prevented horizontal text concatenation (`Room / AreaRoom 215`, `OwnerUnassigned`, `Created09:45`) by applying explicit block/column styling (`display: flex; flex-direction: column; gap: 4px`) to each `.dm-details-meta-item` and `display: block; margin-bottom: 4px` to `.dm-details-meta-label`.
- **Responsive 2-Column Desktop Grid**:
  - Formatted the metadata grid into a balanced 2-column layout on desktop (`gap: 14px 18px; padding: 18px 20px`), collapsing gracefully to single-column on mobile screens.

### D. Verification & Health Check
- Synchronized all changes to `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.

---

## 13. Elimination of Extra Texts & Decluttering of Complaints Section (Screenshot 6 Parity)

### A. Removal of Extra & Redundant Texts
- **Topline Header Tools**:
  - Removed `<span className="dm-live">Department access</span>` pill from the top navigation bar, eliminating unnecessary header clutter and matching Screenshot 1.
- **Page Heading Alignment & Streamlining**:
  - Removed `<p className="dm-eyebrow">DEPARTMENT OPERATIONS</p>` uppercase eyebrow banner.
  - Removed bulky multi-line subtitle `<p>` paragraphs under the page title. The heading now cleanly renders the page title (`Housekeeping overview`, `Complaints`, `Task Monitoring`), perfectly vertically centered (`align-items: center`) with the date badge or primary action button (`Start inspection`).
- **Overview Dashboard Decluttering**:
  - Removed `<div className="dm-overview-meta">` (duplicate date string and "Housekeeping only" banner above the KPI cards).
  - Removed `<button className="dm-complaint-banner">` (`Resolve complaints 2 >` banner) which previously occupied awkward space between KPI cards and Attention Required.
  - KPI cards now flow directly with generous whitespace into the 2-column grid (`Attention required` and `Shift snapshot`), matching Screenshot 1.

### B. Streamlined, Luxury Complaints Section (`tab === 'complaints'`)
- **Elimination of Nested Panel Headers**:
  - Removed duplicate `<h2>Guest complaints & feedback</h2>` and subtitle `<p>Track guest service issues, complaints, and rapid department recovery...</p>`.
  - Removed bulky nested card containers and redundant toolbars.
- **Dedicated 6-Column Luxury Table**:
  - Transformed the Complaints view into a clean, modern table matching the styling of Task Monitoring:
    - Columns: `ROOM NO.`, `GUEST`, `ISSUE / SUMMARY`, `PRIORITY`, `STATUS`, `ACTION`.
    - Room details with room number and case ID.
    - Guest name and category.
    - Issue title and subtle description.
    - Priority pill (`• Urgent` soft red or `Normal` neutral).
    - Status pill (`✓ Resolved` green or `In progress` neutral/amber).
    - Compact pill-shaped `[ Details ]` button linking to room task investigations.

### C. Verification & Compliance
- Synchronized `DepartmentManagerConsole.tsx` and `department-manager.css` between `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript Typecheck: **0 errors (`tsc --noEmit`)**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passed**.
- Git restrictions strictly followed: **0 commits, 0 pushes, no branches created or changed**.
- Other portals strictly unmodified.

---

## 14. Department Manager Complaints Page Restoration & UI Refinement (Reference Images 1 & 3 Parity)

### A. Restoration of Card-Based Complaint Management Interface (Reference Image 1)
- **Eliminated Stretched Table**:
  - Removed the temporary table layout that caused excessive text wrapping and restored the full horizontal card/list architecture.
- **Header & Navigation Bar**:
  - Maintained `Housekeeping > Complaints` breadcrumb.
  - Page Heading:
    - Eyebrow: `DEPARTMENT OPERATIONS` (uppercase bold lettering).
    - Main heading: `Complaints` (28px).
    - Subtitle: `Track guest concerns, assign ownership and keep every response on record.`.
    - Date badge: `[ 📅 15 Nov 2026 ]` aligned to the top-right.
- **White Panel Container**:
  - Heading: `{d.name} complaints` with description `Guest and Front Desk complaints routed to your department, with shared status updates.`.
  - Action button: `[ + Log complaint ]` (dark brown button with plus icon).
  - Navigation Subtabs:
    - `[ Active complaints ]`: Highlighted with warm sand background (`var(--warm-control, #ede5d8)`), subtle beige border, dark brown text.
    - `[ Complaint History ]`: White background, subtle border, dark text.
  - Search & Status Filter Bar:
    - Subtle beige container strip with search input (`Search reference, complaint, guest or room`) and status dropdown (`All statuses`, `Under Review`, `In Progress`, `Under Investigation`, `Resolved`).

### B. Individual Complaint Cards Architecture
- **Top Section**:
  - Reference number: e.g. `GC-304-041126` (small, subtle muted text).
  - Status badge on right: e.g. `In Progress` (soft warm badge), `Under Investigation` (soft neutral badge), `Resolved` (emerald badge).
- **Complaint Title & Metadata**:
  - Bold title: e.g. `Linen replacement delay and missing hypoallergenic pillows` (16.5px, bold).
  - Meta line: `Ananya Sharma · 304 · urgent · Reported 08:45` (subtle muted text).
  - Description: Full complaint text without artificial truncation.
- **Actions**:
  - `[ Resolve complaints ]` button: Pill-shaped button opening the exact Resolve Complaints modal.
  - Expandable Case History: `<details>` with `▶ Case history · {count} update(s)` displaying chronological notes, actor, and status.

### C. Exact Resolve Complaints Modal Dialog (Reference Image 3)
- **Geometry & Backdrop**:
  - Centered modal dialog, `max-width: 648px`, white surface with 18px rounded corners, 32px internal padding, soft multi-layer shadow, and semi-transparent dark backdrop overlay with soft blur (`backdrop-filter: blur(4px)`).
- **Header**:
  - Title: `Resolve complaints`.
  - Subtitle: `{Department} · {Complaint Reference}` (e.g. `Housekeeping · GC-304-041126`).
  - Top-right `[X]` close button.
- **Controls & Validation**:
  - `Complaint status` dropdown: `Under Review` (default), `In Progress`, `Under Investigation`, `Resolved`.
  - `Response / resolution shared with the guest` textarea: 134px height, light beige `#faf8f5` background, thin border, required validation with native HTML5 tooltip (`Please fill out this field.`).
  - Footer: Divider with right-aligned `[ Cancel ]` button and `[ Save complaint ]` primary dark brown button.
  - Updates reactive state in real time and moves resolved cases to Complaint History.

### D. Verification & Compliance
- Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.
- Other portals strictly unmodified.

---
---

## 15. Department Manager Profile Page Restoration & UI Refinement (Reference Image 1 Parity)

### A. Problem Addressed
- Previously, the Manager Profile page had broken horizontal layout where all labels and input elements were rendered inline on a single line (`Display nameAnanya Rao Phone Demo emailhousekeeping.manager@... [Save profile]`), completely squishing fields.

### B. Full-Width Card & Layout Structure (Exact Image 1 Match)
- **Top Page Heading**:
  - Eyebrow: `DEPARTMENT OPERATIONS` (warm gold uppercase).
  - Main Heading: `Profile` (bold luxury typography).
  - Subtitle: `Manage your display details and review your department access.`.
  - Date selector preserved at top-right.
  - Breadcrumb: `Housekeeping > Profile`.
- **Card Container (`.dm-profile-card` / `.dm-panel`)**:
  - Full-width white panel with 16px rounded corners, subtle beige border, and generous internal padding (32px 36px 36px).
  - Card Heading: `Manager profile` (`font-size: 20px`, bold).
  - Card Subtitle: `Your demo identity and department access.` (`font-size: 14px`, muted).
- **Strict Vertical Form Architecture (`.dm-profile-form`)**:
  - Stacked vertical flex-column with 20px spacing and optimal desktop width (65–75% max-width, `680px`).
  - Every field wrapped in its own `.dm-profile-field` container with 8px label spacing.
  - Consistent 50px input height with comfortable horizontal padding (16px).
  - Inputs styled with warm off-white beige background (`#fbf9f5`), thin beige borders (`var(--dm-line)`), and 10px rounded corners.
  - Form field sequence:
    1. **`Display name`**: Editable text input with existing user's display name (`person`), required, maxLength 100.
    2. **`Phone`**: Editable tel input with existing user's phone (`profile?.phone`), placeholder `+91 98765 43210`, maxLength 40.
    3. **`Demo email`**: Readonly input with deeper warm sand background tint (`#ebe4d8`), cursor default.
    4. **`Department`**: Readonly input with deeper warm sand background tint (`#ebe4d8`), cursor default.
- **Save Profile Button (`.dm-profile-save-btn`)**:
  - Dark brown charcoal background (`#2b1810`), bold white text, left-aligned directly below fields.
  - Height 48px, comfortable horizontal padding (28px), 9px border radius.
  - Retains full `departmentManagerCommand({ type: 'profile', name, phone })` functionality and triggers success feedback.
- **Disclaimer Note (`.dm-profile-note`)**:
  - Positioned directly below the button: `"Standalone demonstration · work is saved in this browser. Department access here is a demo of the intended permissions."`.
- **Dark Mode & Responsive Fidelity**:
  - Full dark theme styling with appropriate contrast for inputs, readonly fields, card background, and button.
  - Responsive breakpoints down to mobile where fields and the Save Profile button adapt smoothly to full width.

### C. Verification & Compliance
- Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.
- Other portals strictly unmodified.
---

## 17. Housekeeping Overview UI Restoration to Target Reference Design (Screenshot 1 Parity)

### A. Restored Complete Page Header
- Preserved breadcrumb navigation at top (`Housekeeping > Overview`).
- Restored `.dm-live` pill (`• Department access`) in topline tools.
- Restored small uppercase eyebrow: `DEPARTMENT OPERATIONS`.
- Restored main heading: `Housekeeping overview` (34px, bold).
- Restored subtitle: `"Room readiness, spotless spaces and thoughtful guest care."`.
- Restored date and scope sub-bar right above KPI cards:
  - Left: `[📅] Sunday, 15 November` (`overviewDate` with `CalendarDays` icon).
  - Right: `[🔒] Housekeeping only` (`LockKeyhole` icon).
- Kept `[ 📋 Start inspection ]` primary dark button aligned to upper-right.

### B. KPI Summary Cards (4 Cards in One Row)
- Four cards across desktop: `Active Requests`, `Pending Inspections`, `Open Escalations`, `Team on Duty`.
- Exact hierarchy: small uppercase label at top, icon inside beige rounded square, large numerical stat (42px bold), supporting description, and bottom-right arrow (`↗`).
- Equal card widths, consistent height, white background, subtle beige border, and 24px 26px padding with 20px grid gap.

### C. Resolve Complaints Section
- Positioned the `Resolve complaints` notification bar directly BELOW the KPI cards and ABOVE the dashboard grid matching Screenshot 1.
- Full-width light beige surface (`#f6f3ec`), subtle border, rounded corners (14px).
- Left: `[MessageSquare icon] Resolve complaints`.
- Right: dynamic complaint count badge (`2`) with chevron right (`>`).
- Navigates to the complaints tab on click.

### D. Main Dashboard Grid (Two Columns: 58% / 42%)
- **Left Column — Attention Required (~58% width)**:
  - White card (`.dm-panel`), thin beige border, rounded corners (16px).
  - Header: `Attention required` + count badge `1`, subtitle `"Supervisor escalations waiting for a decision."`, and top-right `View all ↗` link.
  - Escalation rows: Handshake icon in beige square, title, supervisor description, soft red `• Needs review` badge, and `[ Open escalations > ]` action button.
  - Card footer: `[🔒] Cases are limited to your department.`.
- **Right Column — Shift Snapshot (~42% width)**:
  - Warm light beige card background (`#f4efe6` / `var(--dm-surface)`).
  - Header: `Shift snapshot` with top-right `DAY SHIFT` badge.
  - Progress section: 38px bold completion percentage (`12%`), request label and count (`3 of 25 requests complete`), and dark progress bar on beige track.
  - Bottom metrics: `Team on duty` (`4`) and `Open requests` (`22`) in a clean 2-column layout.
  - Action button: `[ ⮞ Prepare handover ↗ ]` at bottom.

### E. Verification & Compliance
- Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.
- Other portals strictly unmodified.


---

## 16. Removal of Footer Text & Spacing Arrangement in Department Manager

### A. Problem Addressed
- Removed the bottom footer element across all Department Manager tabs: `<footer className="dm-footer">THE GRAND ADP <span>Thoughtful service. Connected teams.</span></footer>`.
- Ensured consistent, balanced bottom spacing across all views without dangling or awkward text elements.

### B. Implementation Details
- **Markup Clean**: Removed `<footer className="dm-footer">...</footer>` from `DepartmentManagerConsole.tsx`.
- **CSS Defense**: Added `.dm-footer { display: none !important; }` to `department-manager.css` to prevent any cached footer rendering.
- **Spacing Arrangement**: Verified `.dm-main` has a clean `padding: 0 32px 48px` on desktop and `0 16px 36px` on mobile, providing an uncluttered, balanced bottom breathing room across Overview, Room Readiness, Complaints, Task Monitoring, Inspections, Escalations, and Profile pages.

### C. Verification & Compliance
- Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.
- Other portals strictly unmodified.

---

## 17. Housekeeping Overview UI Restoration to Target Reference Design (Screenshot 1 Parity)

### A. Restored Complete Page Header
- Preserved breadcrumb navigation at top (`Housekeeping > Overview`).
- Restored `.dm-live` pill (`• Department access`) in topline tools.
- Restored small uppercase eyebrow: `DEPARTMENT OPERATIONS`.
- Restored main heading: `Housekeeping overview` (34px, bold).
- Restored subtitle: `"Room readiness, spotless spaces and thoughtful guest care."`.
- Restored date and scope sub-bar right above KPI cards:
  - Left: `[📅] Sunday, 15 November` (`overviewDate` with `CalendarDays` icon).
  - Right: `[🔒] Housekeeping only` (`LockKeyhole` icon).
- Kept `[ 📋 Start inspection ]` primary dark button aligned to upper-right.

### B. KPI Summary Cards (4 Cards in One Row)
- Four cards across desktop: `Active Requests`, `Pending Inspections`, `Open Escalations`, `Team on Duty`.
- Exact hierarchy: small uppercase label at top, icon inside beige rounded square, large numerical stat (42px bold), supporting description, and bottom-right arrow (`↗`).
- Equal card widths, consistent height, white background, subtle beige border, and 24px 26px padding with 20px grid gap.

### C. Resolve Complaints Section
- Positioned the `Resolve complaints` notification bar directly BELOW the KPI cards and ABOVE the dashboard grid matching Screenshot 1.
- Full-width light beige surface (`#f6f3ec`), subtle border, rounded corners (14px).
- Left: `[MessageSquare icon] Resolve complaints`.
- Right: dynamic complaint count badge (`2`) with chevron right (`>`).
- Navigates to the complaints tab on click.

### D. Main Dashboard Grid (Two Columns: 58% / 42%)
- **Left Column — Attention Required (~58% width)**:
  - White card (`.dm-panel`), thin beige border, rounded corners (16px).
  - Header: `Attention required` + count badge `1`, subtitle `"Supervisor escalations waiting for a decision."`, and top-right `View all ↗` link.
  - Escalation rows: Handshake icon in beige square, title, supervisor description, soft red `• Needs review` badge, and `[ Open escalations > ]` action button.
  - Card footer: `[🔒] Cases are limited to your department.`.
- **Right Column — Shift Snapshot (~42% width)**:
  - Warm light beige card background (`#f4efe6` / `var(--dm-surface)`).
  - Header: `Shift snapshot` with top-right `DAY SHIFT` badge.
  - Progress section: 38px bold completion percentage (`12%`), request label and count (`3 of 25 requests complete`), and dark progress bar on beige track.
  - Bottom metrics: `Team on duty` (`4`) and `Open requests` (`22`) in a clean 2-column layout.
  - Action button: `[ ⮞ Prepare handover ↗ ]` at bottom.

### E. Verification & Compliance
- Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.
- Other portals strictly unmodified.

## 17. Housekeeping Overview UI Restoration to Target Reference Design (Screenshot 1 Parity)

### A. Restored Complete Page Header
- Preserved breadcrumb navigation at top (`Housekeeping > Overview`).
- Restored `.dm-live` pill (`• Department access`) in topline tools.
- Restored small uppercase eyebrow: `DEPARTMENT OPERATIONS`.
- Restored main heading: `Housekeeping overview` (34px, bold).
- Restored subtitle: `"Room readiness, spotless spaces and thoughtful guest care."`.
- Restored date and scope sub-bar right above KPI cards:
  - Left: `[📅] Sunday, 15 November` (`overviewDate` with `CalendarDays` icon).
  - Right: `[🔒] Housekeeping only` (`LockKeyhole` icon).
- Kept `[ 📋 Start inspection ]` primary dark button aligned to upper-right.

### B. KPI Summary Cards (4 Cards in One Row)
- Four cards across desktop: `Active Requests`, `Pending Inspections`, `Open Escalations`, `Team on Duty`.
- Exact hierarchy: small uppercase label at top, icon inside beige rounded square, large numerical stat (42px bold), supporting description, and bottom-right arrow (`↗`).
- Equal card widths, consistent height, white background, subtle beige border, and 24px 26px padding with 20px grid gap.

### C. Resolve Complaints Section
- Positioned the `Resolve complaints` notification bar directly BELOW the KPI cards and ABOVE the dashboard grid matching Screenshot 1.
- Full-width light beige surface (`#f6f3ec`), subtle border, rounded corners (14px).
- Left: `[MessageSquare icon] Resolve complaints`.
- Right: dynamic complaint count badge (`2`) with chevron right (`>`).
- Navigates to the complaints tab on click.

### D. Main Dashboard Grid (Two Columns: 58% / 42%)
- **Left Column — Attention Required (~58% width)**:
  - White card (`.dm-panel`), thin beige border, rounded corners (16px).
  - Header: `Attention required` + count badge `1`, subtitle `"Supervisor escalations waiting for a decision."`, and top-right `View all ↗` link.
  - Escalation rows: Handshake icon in beige square, title, supervisor description, soft red `• Needs review` badge, and `[ Open escalations > ]` action button.
  - Card footer: `[🔒] Cases are limited to your department.`.
- **Right Column — Shift Snapshot (~42% width)**:
  - Warm light beige card background (`#f4efe6` / `var(--dm-surface)`).
  - Header: `Shift snapshot` with top-right `DAY SHIFT` badge.
  - Progress section: 38px bold completion percentage (`12%`), request label and count (`3 of 25 requests complete`), and dark progress bar on beige track.
  - Bottom metrics: `Team on duty` (`4`) and `Open requests` (`22`) in a clean 2-column layout.
  - Action button: `[ ⮞ Prepare handover ↗ ]` at bottom.

### E. Verification & Compliance
- Synchronized across `public-preview/` and `hotel-app-main/public-preview/`.
- TypeScript typecheck (`tsc --noEmit`): **0 errors**.
- Manager test suite (`tests/manager.test.mjs`): **23/23 tests passing**.
- Git policy: **0 commits, 0 pushes, branch untouched**.
- Other portals strictly unmodified.




## Section 18: Master Prompt — Manager Portal UI/UX Refinement & Complete Standardization

### A. Desktop and Mobile Responsive Navigation
- **Desktop (>= 1024px)**:
  - Fixed sidebar at width 280px (`min-width: 280px; max-width: 280px`).
  - Hamburger menu (`☰`, `.dm-menu-toggle`) completely hidden on desktop via `display: none !important`.
  - Sidebar close button (`×`, `.dm-mobile-close`) completely hidden on desktop via `display: none !important`.
  - Scrim backdrop (`.dm-nav-scrim`) completely hidden on desktop via `display: none !important`.
  - Top navigation bar streamlined with breadcrumbs, date/scope indicator, theme toggle, notifications, and profile avatar.
- **Mobile (< 768px) & Tablet (768px–1023px)**:
  - Sidebar behaves as an off-canvas drawer (`transform: translateX(-100%)`, slides to `0` when `data-sidebar-open="true"`).
  - Hamburger menu (`☰`) visible and touch-accessible in top navigation.
  - Sidebar close button (`×`) visible inside the drawer header.
  - Tapping backdrop or close button smoothly closes the drawer.

### B. Complaints Page Standardization (Structured Table & Modal)
- **Table Structure (6 Columns)**:
  1. `ROOM NO.` (15% width): Bold room number + complaint reference ID.
  2. `GUEST` (18% width): Guest name + department/category indicator.
  3. `ISSUE / SUMMARY` (37% width): Title + description clamped to 2 lines via `-webkit-line-clamp: 2` to avoid vertical row stretching.
  4. `PRIORITY` (11% width): Compact priority badge (Urgent with soft-red dot / Normal).
  5. `STATUS` (11% width): Status pill (In Progress, Under Investigation, Resolved).
  6. `ACTION` (8% width): Right-aligned `[ Details ]` button opening the complaint resolution modal.
- **Mobile Fallback**:
  - Automatically converts table rows to stacked card blocks on screens `<= 768px`.
- **Complaint Resolution Modal**:
  - Centered on screen with translucent backdrop and blur (`rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px)`).
  - White surface, rounded corners (18px), max-width 560px.
  - Top-right close button (`×`).
  - Vertical form fields: status selector and large response textarea (min-height 120px).
  - Bottom-right aligned `Cancel` and `Save complaint` primary button.

### C. Profile Page Standardization (Vertical Form)
- Vertical single-column form with max-width 680px.
- 20px vertical gap between form fields.
- 8px gap between labels and inputs.
- 50px input height with comfortable horizontal padding.
- Clean read-only styling for Demo Email and Department.
- Left-aligned primary `Save profile` button (44px height, dark charcoal).
- Demonstration notice placed below the form.

### D. Overview & Dashboard Standardization
- Eyebrow `DEPARTMENT OPERATIONS`, main title `Housekeeping overview`, and subtitle.
- Date and department scope sub-bar (`Sunday, 15 November` & `Housekeeping only`).
- 4 KPI cards in a balanced row on desktop (42px bold numbers, beige icon containers, descriptions, top-right arrows).
- `Resolve complaints` notification bar below KPIs with count badge.
- Two-column dashboard grid:
  - Left column (~58%): `Attention required` with escalation details and supervisor decision buttons.
  - Right column (~42%): Warm beige `Shift snapshot` with 38px bold completion percentage, request completion bar, team counts, and handover action.
- Symmetrical lower grid with `Inspection queue` and `Department tools` (Room readiness).

### E. Code Quality & Policy Compliance
- **Zero Git Commits / Zero Git Pushes**: Git working tree maintained in untouched clean state without creating any commits or pushes.
- **Strictly Scoped**: All changes confined to `DepartmentManagerConsole.tsx` and `department-manager.css`. No other roles or portals touched.
- **Synchronized**: Changes mirrored identically between `public-preview/` and `hotel-app-main/public-preview/`.
- **Validation**:
  - `npm --prefix public-preview run typecheck` (`tsc --noEmit`): Passed with 0 errors.
  - `npm --prefix public-preview run test:manager` (`node --test tests/manager.test.mjs`): All 23 tests passed.


## Section 19: Dark Theme — Exact Visual Reference & Standardization (Section 14)

### A. Dark Theme Color Palette Implementation
Implemented the exact color tokens across the entire Department Manager portal:
- **Main page background**: `#171715` (`.dm-workspace`, `.dm-main`, `.department-manager-page`)
- **Sidebar background**: `#1D1D1A` (`.dm-sidebar`)
- **Top navigation background**: `#171715` (`.dm-topline`, `.dm-topbar`)
- **Main card background**: `#22221F` (`.dm-panel`, `.dm-card`, `.dm-stat-card`, `.dm-kpi`, `.dm-attention-card`, `.dm-tools-card`, `.dm-profile-card`, `.dm-notif-card`, `.dm-complaints-panel`, `.dm-complaints-table-wrap`)
- **Secondary card background**: `#373329` (`.dm-shift-card`, `.dm-overview-complaints-bar`)
- **Input background**: `#292823` (`.dm-input`, `.dm-select`, `.dm-textarea`, `.dm-profile-field input`, modal inputs, toolbar inputs)
- **Primary text**: `#F3EFE5` (headings, active titles, important statistics, primary table cells)
- **Secondary text**: `#B9B2A4` (descriptions, subtitles, metadata, labels, arrows, breadcrumbs)
- **Border**: `#494538` (card borders, table borders, sidebar border, input borders, button borders)
- **Primary button background**: `#E8DEC6` with hover `#ded3b7` (`.dm-primary`, `.dm-desk-action-btn`, `.dm-log-complaint-btn`, `.dm-modal-save-btn`, `.dm-profile-save-btn`)
- **Primary button text**: `#27251F` (bold, readable contrast)
- **Active navigation background**: `#494334` with active text `#FFFFFF` and warm cream indicator `#E8DEC6` (`.dm-sidebar nav button[aria-current=page]`)
- **Icon background**: `#373429` with border `#494538` and stroke `#F3EFE5` (`.dm-monogram`, `.dm-department-icon`, `.dm-stat-icon`, `.dm-kpi-icon`, `.dm-attention-icon`, `.dm-desk-icon-container`, `.dm-avatar`)

### B. Component Standardization in Dark Mode
1. **Sidebar**:
   - Dark charcoal `#1D1D1A` with subtle right border `#494538`.
   - Navigation icons in warm beige `#B9B2A4`, transitioning to `#F3EFE5` on hover.
   - Active menu item: `#494334` warm dark-beige background with clean `#FFFFFF` text and `#E8DEC6` indicator bar.
   - Monogram and department label: `#373429` icon container with `#494538` borders.
   - Notification count badges: `#373429` background with `#F3EFE5` bold text.
   - Mobile drawer in dark mode: `#1D1D1A` background with `#22221F` close button.
2. **Top Navigation**:
   - `#171715` background with `#494538` subtle separator.
   - Breadcrumbs: `#B9B2A4` with active page in `#F3EFE5`.
   - `• Department access` pill: `#292823` background with green dot and `#F3EFE5` text.
   - Icon buttons (theme toggle, notification bell): `#22221F` surface with `#494538` border and `#F3EFE5` icons.
3. **Dashboard KPI Summary Cards**:
   - `#22221F` card surface with `#494538` border.
   - 42px bold stats in warm white `#F3EFE5`.
   - Descriptions and upper labels in muted beige `#B9B2A4`.
   - Icons housed in `#373429` squares with `#494538` borders.
4. **Shift Snapshot & Overview Bars**:
   - `#373329` warm secondary surface with `#494538` border.
   - `DAY SHIFT` badge in `#292823`.
   - Request completion progress bar: `#292823` track with `#E8DEC6` warm fill.
   - Resolve complaints bar: `#373329` surface with `#292823` badge and `#F3EFE5` text.
5. **Complaints Table & Modal**:
   - Headers: `#1D1D1A` background with `#B9B2A4` text and `#494538` border.
   - Rows: `#22221F` surface with `#292823` hover state (eliminating any bright hover flashes).
   - Details button: `#22221F` background with `#494538` border and `#F3EFE5` text.
   - Resolution Modal: `#22221F` surface with `#494538` border, `rgba(0, 0, 0, 0.65)` backdrop blur, `#292823` inputs, `#B9B2A4` labels, `#292823` cancel button, and `#E8DEC6` / `#27251F` Save button.
6. **Profile Page**:
   - `#22221F` card surface with `#494538` border.
   - Editable fields: `#292823` background with `#494538` border.
   - Read-only fields: `#22221F` background with `#3d392e` border.
   - Save Profile button: `#E8DEC6` background with `#27251F` text.
7. **Status Badges**:
   - Urgent / Critical: subtle red `rgba(239, 68, 68, 0.15)` background with `#fca5a5` text and subtle border.
   - In Progress: `#373329` background with `#e8dec6` text.
   - Under Investigation / Review: `#373329` background with `#B9B2A4` text.
   - Completed / Resolved: subtle green `rgba(34, 197, 94, 0.15)` background with `#86efac` text.

### C. Theme Switching & Layout Integrity
- Zero layout shift: font sizes, card dimensions, sidebar width (`280px`), spacing, and alignment are 100% identical between light and dark modes.
- `data-theme={state.theme}` added directly to `.dm-workspace` for instant, reliable reactivity.
- Zero white backgrounds in dark mode; zero dark backgrounds in light mode.
- Synchronized with `hotel-app-main/public-preview/`.
- TypeScript typecheck passed cleanly (0 errors); all 23 unit tests passed.
- Git working tree: 0 commits, 0 pushes.


## Section 20: Complaints Section UI Restoration to Exact Reference Design

### A. Restored Card-Based Complaints Interface
- Restored the card-based layout in `DepartmentManagerConsole.tsx` matching the user's latest dark-theme screenshot reference:
  - **Header**:
    - Left: Main heading `Housekeeping complaints` with supporting description `"Guest and Front Desk complaints routed to your department, with shared status updates."`.
    - Tab buttons: `[ Active complaints ]` (active dark-beige pill) and `[ Complaint History ]` (inactive pill).
    - Right: Primary `[ + Log complaint ]` button (warm cream `#E8DEC6` background with dark charcoal `#27251F` bold text).
  - **Filter Bar**:
    - Search input (`.dm-complaints-search-input`): `"Search reference, complaint, guest or room"` (`#292823` background, `#494538` border, `#F3EFE5` text).
    - Status dropdown (`.dm-complaints-status-select`): `"All statuses"` (`#292823` background, `#494538` border, `#F3EFE5` text).
  - **Complaints List (`.dm-complaints-list`)**:
    - Each complaint rendered in an individual card (`.dm-complaint-card`) separated by a subtle `#494538` border.
    - **Top Row**: Reference ID (`GC-304-041126`, etc.) in muted beige `#B9B2A4` on the left; compact status badge (`In Progress`, `Under Investigation`, `Resolved`) on the right.
    - **Title**: Bold complaint headline (`Linen replacement delay and missing hypoallergenic pillows`) in `#F3EFE5`.
    - **Metadata Line**: Guest name, room number, urgency tag, and report timestamp (`Ananya Sharma · 304 · urgent · Reported 08:45`) in `#B9B2A4`.
    - **Description**: Full readable text (`Guest requested complete bath towel replacement...`) in `#F3EFE5`.
    - **Action Button**: `[ Resolve complaints ]` secondary button with `#22221F` surface, `#494538` border, `#F3EFE5` text (hover `#292823`).
    - **Case History**: Expandable `<details>` toggle (`▶ Case history · 1 update`) in `#B9B2A4`.

### B. Verification & Compliance
- **Screenshot Parity**: Exactly matches uploaded image `media_1794690777583_e457b804.png`.
- **TypeScript**: `tsc --noEmit` passed with 0 errors.
- **Unit Tests**: All 23 manager tests passed (`tests/manager.test.mjs`).
- **Synchronized**: Identically mirrored to `hotel-app-main/public-preview/`.
- **Git Policy**: 0 commits, 0 pushes, branch untouched (`feature/khushi`).
- **Portal Isolation**: Confined strictly to Department Manager; no other portals touched.

---

## Section 21: Department Manager Analytics Dashboard Restoration (Image 10 Parity)

### A. Restored Analytics & Service Performance UI
Recreated the exact Department Manager Analytics dashboard as shown in reference screenshot `media_1794691079721_eecfc439.png`:

1. **Top Service Performance Panel (`.dm-analytics-top-panel`)**:
   - **Header Area**:
     - Main heading: `Service performance` (bold `#F3EFE5`, 20px).
     - Subtitle: `"See how much work came in, how much was finished, and what needs attention now."` (muted beige `#B9B2A4`, 13px).
     - Export action: `[ ⤓ Export task report ]` button with downward download icon and hover transition.
   - **Filter Toolbar (`.dm-analytics-toolbar`)**:
     - Left filters: Period select (`Past 7 days ∨`, `Past 24 hours`, `Past 30 days`) and Priority select (`All task priorities ∨`, `Urgent / critical`, `Normal`) with styled custom drop chevrons.
     - Right timestamp: `"Updated 02:47 am IST"` in muted beige `#B9B2A4`.
   - **Page Heading Streamlining**: Standalone `<h1>Analytics</h1>` heading omitted so the `Service performance` panel serves as the clean, top-most card.

2. **Four KPI Summary Metric Cards (`.dm-analytics-kpi-grid`)**:
   - Equal-width 4-column desktop grid with rounded corners (14px) and `#494538` border:
     - **Card 1**: `Requests opened` · **2** · `"Created in the selected period"`
     - **Card 2**: `Requests completed` · **1** · `"Finished in the selected period, including older requests"`
     - **Card 3**: `Completed on time` · **100%** · `"1 of 1 completed requests with a measurable deadline"`
     - **Card 4**: `Median turnaround` · **25 min** · `"Time from opening to completion across 1 timed requests"`

3. **Bottom Two-Column Analytics Grid (`.dm-analytics-main-grid`)**:
   - **Left Column: Requests Opened vs. Completed (`.dm-analytics-chart-panel`)**:
     - Title: `Requests opened vs. completed` with description `"Compare incoming work with work finished in the same time window."`.
     - Legend: `■ Opened` (olive-taupe `#867A68`) and `■ Completed` (warm cream `#F3EFE5`).
     - Dual Bar Chart:
       - 7-day span: `9 Nov`, `10 Nov`, `11 Nov`, `12 Nov`, `13 Nov`, `14 Nov`, `15 Nov`.
       - On `10 Nov`: Olive-brown opened bar (2 requests) and cream completed bar (1 request) side-by-side above the baseline.
       - Baseline: Continuous horizontal border divider between bars and date axis.
       - Expandable table: `▶ View chart data` details element with Date, Opened, and Completed records.
   - **Right Column: Room Readiness Snapshot (`.dm-analytics-readiness-panel`)**:
     - Title: `Room readiness` with description `"Current department snapshot across all dates and priorities."`.
     - 3 Metric Rows:
       - `Arrival rooms not ready` (with note: `"Assigned rooms for expected arrivals. Open Room readiness and choose Expected arrivals."`) · **2**
       - `Rooms awaiting inspection` (with note: `"Check the inspection queue and assign a supervisor if needed."`) · **2**
       - `Open requests past deadline` (with note: `"Open work already past its resolution or delivery deadline."`) · **1**
     - Action navigation links: `Open room readiness →`, `Open inspections →`, `Open overdue requests →`.

### B. Verification & Compliance
- **Screenshot Parity**: 100% matched to `media_1794691079721_eecfc439.png`.
- **TypeScript**: `tsc --noEmit` passed with 0 errors.
- **Unit Tests**: All 23 manager tests passed (`tests/manager.test.mjs`).
- **Synchronized**: Identically mirrored across `public-preview/` and `hotel-app-main/public-preview/`.
- **Git Policy**: 0 commits, 0 pushes, branch untouched (`feature/khushi`).
- **Portal Isolation**: Confined strictly to Department Manager; no other portals touched.
