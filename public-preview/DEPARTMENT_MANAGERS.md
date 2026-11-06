# Department manager demo

Open `/login`, select **Department Manager** in **Quick Role Fill**, then choose a department in the department choices that appear. The selected department's email and password autofill immediately.

| Department | Demo email | Public demo password |
| --- | --- | --- |
| Housekeeping | housekeeping.manager@thegrandadp.com | manager123 |
| Spa & Wellness | wellness.manager@thegrandadp.com | manager123 |
| Maintenance & Engineering | engineering.manager@thegrandadp.com | manager123 |
| Food & Beverages | dining.manager@thegrandadp.com | manager123 |

The previous `manager@thegrandadp.com` account remains an alias for the housekeeping demo. The credentials popup also includes the other existing demo roles. Incorrect email/password combinations remain on the login form.

## Workspace structure

1. **Overview:** department KPIs, recovery cases, inspection inbox, service completion and active requests. Cards open their corresponding sections.
2. **Task Monitoring:** deduplicated departmental requests, text search, open/completed filters and follow-up actions.
3. **Inspections:** receive General Manager directives, assign or reassign an active supervisor in the same department, and use **Start inspection** for a single room/service area, a floor sweep or all actual hotel rooms. Each target gets its own department checklist, priority, supervisor and outcome.
4. **Escalations & Recovery:** receive supervisor cases, record a resolution, or send a reasoned escalation to the General Manager. Decisions update shared task copies.
5. **Staff & Workload:** departmental roster, assignment counts, capacity and availability updates.
6. **Policies (Housekeeping, Engineering and F&B):** read service standards and add departmental procedures. Wellness has no Policies section or policy-creation action.
7. **Handover:** save the receiving manager, notes and a snapshot of open departmental requests. Only the named incoming manager can acknowledge.
8. **Analytics:** day/week/month rolling reports, completion counts and CSV export. Undated legacy sample requests are explicitly excluded.
9. **Notifications:** department-specific notifications and read state, including GM decisions.
10. **Profile:** editable display name and phone; department and demo email remain fixed.
11. **Complaints:** available to all four managers; search routed guest/Front Desk records, log a concern and record review, progress or resolution with a guest-visible response. Shared complaint records and linked task statuses update together; compensation is unchanged. Ambiguous guest categories remain with Front Desk until explicitly routed.
12. **Repairs (Engineering):** hotel-wide Engineering work across rooms and public/service areas, including existing maintenance tasks. Log new repairs, assign an available technician, record progress/blockers/completion and keep shared task copies consistent.
13. **Ordering overview (F&B):** deduplicated dining orders, line items, guest instructions, recorded values and current status, with search and active/all filters. Recorded order values are not a revenue reconciliation report.

### Guest medical cases and department inspection workflow

Wellness **Guest medical cases** replaces the appointment view. Create a case with an automatically generated reference, guest/case identifier, location, urgency, initial note and optional follow-up time. Updates append to the case history and can change urgency/status, reschedule follow-up or acknowledge the current reminder. Closed cases stop reminders. Due reminders appear in the manager header, overview and notifications while the app is open; the clock checks every 30 seconds. Reminders and cases persist through reloads. These are in-app reminders, without email, SMS or background delivery. Existing appointment data remains preserved for compatibility, with no appointment controls in the manager view. Wellness has no Appointments or Policies section. Existing historical data is preserved, policy creation is rejected for the Wellness manager, and treatment-supply controls remain available.

The inspection launcher adapts inspection types, checklists, service areas and supervisor choices to the signed-in department. Room and floor counts use actual hotel records instead of hard-coded reference-image counts. Floor/hotel sweeps create a separate record per room; they do not approve or release the whole hotel automatically. Supervisors see the assigned department records and must pass every checklist item before approving manager-created inspections. Only Housekeeping approvals can change room readiness, and Engineering out-of-order holds remain intact. Other department approvals report their outcome to the manager without releasing room inventory.

## Walkthrough

1. Sign in as `gm@thegrandadp.com` / `gm123`. Open **Department Inspections**, choose a department and send an inspection directive.
2. Change account to that department's manager. Open **Inspections**, assign the directive to one of the listed supervisors, then inspect the shared Dispatcher / Supervisor inspection queue.
3. Return to the department manager. Open **Escalations & Recovery**, select a case, add context and choose **Escalate to General Manager**.
4. Change to the GM account. In **Approval Center**, record a decision on the department request. Return to the manager and see the updated task and department notification. This operational approval does not alter billing records.
5. Add a policy and shift handover, update staff availability, refresh, and verify the changes remain in the same browser.
6. Change to another department manager and verify its tasks, staff, inspections, policies, handovers and notifications are separate.

## Department tools and design

All four manager workspaces share warm theme tokens independent of role colours. Light mode uses a white canvas and white panels, with parchment `#EBE2CC`, soft beige `#DED6C1` and taupe `#B7B09E` accents; headings use `#353229` and secondary text uses `#686252`. Dark mode uses charcoal `#171715` backgrounds, raised `#1E1E1B` panels, muted warm highlights and cream text. The theme switch is available on sign-in and inside the manager header, persists in the browser and also styles department selectors, forms and native dialogs. Login-only colour overrides retain its original slate/white light palette, navy dark palette, gold accents and coloured role icons without changing the manager theme or the updated login layout and behaviour.

The overview separates actionable escalations, inspection assignments, department tools and a live shift snapshot. KPI cards open their related screens. Navigation is grouped into Workspace, Management and Personal sections, becomes an icon rail on compact desktop screens, and uses a keyboard-accessible drawer on mobile. Tables, forms and dialogs share larger text, consistent spacing and visible focus states. The selected department loads before the dashboard renders, avoiding a flash of another department's default preview.

| Department desk | Implemented behavior | Research reference |
| --- | --- | --- |
| Room readiness | Filter attention, arrivals and DND; create deduplicated cleaning tasks; respect guest DND and engineering holds; count linen and request replenishment. | [Oracle housekeeping room status](https://docs.oracle.com/cd/F17749_01/doc.14/f17755/c_task_menu_housekeeping.htm), [guest service status](https://docs.oracle.com/cd/E98457_01/opera_5_6_core_help/guest_service_status_hskgss.htm) |
| Guest medical cases | Urgency, case references, in-app follow-up reminders, status and chronological case history; treatment supplies remain available. | Department-specific product requirement |
| Maintenance plan | See overdue/next service dates, generate linked work orders, prevent duplicates, and record service/advance due dates only after completed work; count spare parts. | [IBM preventive maintenance records](https://www.ibm.com/docs/en/mfnp/cd?topic=application-preventive-maintenance-pm-records) |
| Dining & kitchen menu | Browse dish cards and category/dietary filters; add/edit/remove dishes, prices, ingredients, allergens and availability in the shared guest/admin catalog. Existing order lines preserve their recorded dish details. Kitchen stock controls remain excluded. | [Oracle F&B operations](https://engage.oracle.com/52daf9/items/food-and-beverage-operations) |

These are implementation choices informed by the references, rather than integrations with those products. Replenishment requests do not automatically receive inventory; medical cases and reminders are operational demo records and do not post a charge. Inactive staff remain unavailable.

## Verification

Run `npm run test:manager` on Node 22.18+ or Node 24+. Tests cover all four departments, migration idempotence, scoped mutations, inspection delegation, GM escalation/decision feedback, handovers and notification isolation. Run `node scripts/check-manager-types.mjs b9e05db` to compare strict TypeScript diagnostics with the source pulled for this change. The repository's existing full-project type errors are not hidden by this comparison.

This repository is a standalone frontend demonstration. Records and selected department persist in browser localStorage; credentials and restrictions illustrate the intended workflow. Production access isolation requires authenticated server-side authorization and a database. There is no backend or production staff authentication in this repository.
