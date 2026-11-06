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
5. **Staff & Workload:** weekly schedule grid, per-day shift editing with audit reasons, previous/next-week navigation, role/availability filters and a workload roster with task drill-down, capacity and live SLA risk counts.
6. **Policies (Housekeeping, Engineering and F&B):** read service standards and add departmental procedures. Wellness has no Policies section or policy-creation action.
7. **Handover:** save the receiving manager, notes and a snapshot of open departmental requests. Only the named incoming manager can acknowledge.
8. **Analytics:** acknowledgement and resolution/delivery SLA compliance, current service risks, timed median/P90 turnaround, arrivals/completions chart, data-quality coverage, operational service targets and CSV export for rolling 24-hour/7-day/30-day periods.
9. **Notifications:** department-specific notifications and read state, including GM decisions.
10. **Profile:** editable display name and phone; department and demo email remain fixed.
11. **Complaints:** available to all four managers; search routed guest/Front Desk records, log a concern and record review, progress or resolution with a guest-visible response. Shared complaint records and linked task statuses update together; compensation is unchanged. Ambiguous guest categories remain with Front Desk until explicitly routed.
12. **Repairs (Engineering):** hotel-wide work grouped into Furniture, Plumbing, Appliances, Electrical, HVAC, Lifts & elevators, Building & fixtures and Other. Category counts follow search and active/all filters. Select a category when logging/updating repairs; completed repairs can be recategorised without changing their status or completion notes. Older records have labelled category suggestions, with repair titles taking precedence over incidental mentions in descriptions. Category changes persist across shared task copies and reloads.
13. **Ordering overview (F&B):** drill down from meal service to cuisine to dish. Filter meal, cuisine, reporting period, status and dish/reference/room. Each dish shows distinct order count, non-cancelled units and item subtotal, order frequency, delivered/active/cancelled counts, average dish rating, rating count, written reviews and expandable order records. Menu cuisine is editable separately from its course/category.

### Dining showcase

Ordering overview opens on Breakfast in **Demo showcase** mode. It contains 63 fictional orders across all three meals and all seven cuisine options: Chinese, Continental, Indian, Italian, Mediterranean, International and Other. Each combination has two dishes and three orders with varying portions, ratings, written reviews and service statuses. The samples use recent hotel-local dates, support the existing filters, and remain separate from guest records, folios, notifications and task queues. Switch **Order data source** to **Live orders** to view actual browser-recorded guest orders. Reloading recreates the showcase without adding duplicate records to saved data.

### Dining metrics and feedback

Meal boundaries use hotel time (Asia/Kolkata): Breakfast 05:00–10:59, Lunch 11:00–17:59 and Dinner 18:00–04:59. Afternoon service belongs to Lunch and overnight service belongs to Dinner; there are no separate tea, late-night or undated category tabs. Orders lacking a usable meal time stay in Task Monitoring and are excluded from this view. Structured scheduled service time takes precedence over placement time. Menu meal availability does not classify an order. Clock-only legacy orders can be grouped by meal under All dates; undated records and future service times are excluded from rolling past-7/past-30-day filters. Unitemised historical orders remain readable outside dish metrics.

Frequency means distinct orders containing a dish divided by distinct orders in its meal/cuisine, before dish search. Multiple portions or variants in one order count once toward frequency, while quantities and option-inclusive line values are summed. Mixed-cuisine orders appear in each relevant cuisine, but count once overall. Cancelled/rejected orders remain visible and count toward order frequency, but contribute no units or item value. Item value is a pre-tax recorded subtotal, not collected revenue.

Guests can rate individual ordered dishes and leave optional written reviews after delivery via **My Activity → expand dining order → Rate Experience**. One rating per dish per order is retained; editing feedback replaces that rating. Dish averages use those guest ratings only. Order service feedback is labelled separately in the expanded record, and catalog demonstration scores are excluded from analytics. Missing reviews display an explicit empty state. New orders snapshot dish name, cuisine and menu category so later catalog edits/deletions retain historical classification.

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

## Record history and completed work

Every department has a compact **Record history** list. Click a record to open its detail popup: recorded outcome, location, responsible staff, notes, before/after comparisons and all saved versions for that record. It opens on completed work and supports type, date and text filters and CSV export. Use **Changes since history began** for new activity or **All saved records & changes** to include existing records imported when history was introduced. Task Monitoring also links each task to its history.

Engineering **Repairs → Completed repair history** shows completed jobs with the repair/location, assigned technician, completion time and preserved completion notes. Recategorising a completed repair does not replace its completion time or outcome. Wellness has **Closed case history**, and all four departments have **Resolved complaint history** filters.

The journal captures changes to department tasks and live dining orders, repairs, complaints, Wellness medical cases, inspections/checklists, room readiness, menu settings/removal, stock counts and requisitions, asset service cycles, staff availability, policies and handovers. It records changes made by managers, dispatchers, fulfilment staff and guest/order flows in the shared browser state. Showcase dining records remain separate and do not enter operational history. Medical narratives remain scoped to Wellness in the manager UI.

Saved versions are appended rather than automatically trimmed. Earlier menu values remain after removal, old service dates/work-order links remain after another service cycle, and recorded completion outcomes remain after subsequent edits. Existing records are labelled as such; missing historical completion times are **Not recorded**, never inferred from the migration date. Persisted task updates take priority over seed examples on reload. History persists with the demo's browser localStorage data; clearing that storage or explicitly resetting the entire demo clears it. This is operational demo history, not a server-backed tamper-proof audit service.

## Verification commands

### SLA measurement and staffing rules

Acknowledgement and resolution targets come from the matching active department/category routing rule, then the property workflow fallback. New observed task changes retain full timestamps and task policy snapshots. Assignment alone does not acknowledge a request: an Accepted/Acknowledged/work-start event is needed. Untimed acknowledgements and legacy clock-only creation dates remain unknown; reported legacy overdue flags are listed separately from timed outcomes. Cancellation/rejection is excluded. Blocked and reopened requests keep the elapsed clock running. Scheduled dining uses its promised service slot rather than breaching while waiting for a future delivery.

Compliance is met / (met + breached). Pending, at-risk, unknown, disabled and excluded outcomes do not enter that denominator. Open work past a measurable deadline counts as a breach. Request cohorts use creation time; the arrivals/completions chart counts each event within the selected rolling period independently. Live task risks include all backlog ages. Priority filters affect requests, while operational case/inspection metrics retain the full department cohort. Unknown timing can be inspected across all recorded requests.

Operational SLA rows cover complaints, inspections, Wellness follow-up due times and Engineering asset due dates. Complaint/inspection demo defaults are 60/30 minutes and can be customised for the signed-in department; their outcomes compare with current department targets. Preventive service outcomes compare the saved service time with the due date *before* the next service cycle was advanced. Unknown completion times never receive an invented compliant result. The CSV exports the period's request and operational measurements, targets, deadlines, outcomes and policy sources.

The staffing grid uses actual shared shift records in hotel time (IST), distinguishes Unscheduled from Off/Leave, and does not invent a published week from profile defaults. Select a current/future day to publish Morning, Day, Evening, Night or Off with a zone and audit reason. Dates before today and inactive staff are read-only. The hotel planning policy rejects overlaps, shifts longer than 12 hours and less than 11 hours of rest, including overnight and adjacent-week shifts. These are hotel demo scheduling rules, not a statement of local labour law. All changes remain in Record history. Future plans do not alter attendance. Ready-for-dispatch counts require an active fulfilment employee, live on-duty availability, a current published shift and spare task capacity.

Run `npm run test:manager` on Node 22.18+ or Node 24+. The suite covers all four departments, scoped workflows, meal/timezone boundaries, scheduled meals, historical metadata snapshots, order deduplication, rating validation/averages, queue synchronisation and repair category persistence. Run `npm run typecheck` and `npm run build` for full-project validation.

This repository is a standalone frontend demonstration. Records and selected department persist in browser localStorage; credentials and restrictions illustrate the intended workflow. Production access isolation requires authenticated server-side authorization and a database. There is no backend or production staff authentication in this repository.
