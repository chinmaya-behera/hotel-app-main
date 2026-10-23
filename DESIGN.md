> Current implementation (2026-10-23): the original planning baseline below is preserved as history. The deployed client demonstration now implements the workflows described in [FEATURE_GUIDE.md](public-preview/FEATURE_GUIDE.md), with explicit sandbox/provider boundaries and verification evidence. Original statements such as “not started” refer to the document creation date, not the current app.

# Hotel Management App - Interaction Design

Status: Proposed interaction specification | Updated: 2026-10-20

## Design intent

Help staff identify their next action, accountable owner and deadline quickly. This document describes intended behavior, not existing screens or approved visual mockups. [PRD.md](PRD.md) defines requirements; [SECURITY.md](SECURITY.md) defines access controls.

Use plain status text, readable contrast, visible focus, labeled controls and keyboard-accessible interactions. Status must not rely on color alone. Staff phone layouts prioritize assigned work and next actions; desktop layouts support dispatch and review. Brand tokens, breakpoints and component library remain unselected.

## Navigation and access

Show navigation according to effective approved permissions: My Tasks, Department Queue, Guest Cases, Handover, Approvals/Finance, Incidents, Reports and Administration. These are proposed labels, not mandatory routes. Provide a visible active property/scope selector where the user has multiple authorized scopes; never let it grant additional access.

Multi-profile users share one individual account. A combined profile must not bypass scope restrictions or separation-of-duty checks. Hidden controls improve usability, while the server independently enforces authorization. Direct links to forbidden resources show a neutral access-denied view without leaking guest or incident details.

## Views and interactions

| View | Essential content | Primary actions |
| --- | --- | --- |
| My Tasks | Assigned work, priority, target times, essential room/table instructions, blockers | Accept, update progress, record confirmation, report blocker |
| Department Queue | Scoped incoming/active work, staff availability, workload and overdue status | Categorize, assign eligible staff, schedule, link duplicate, escalate |
| Guest Case | Accountable owner, authorized guest context, linked task progress and communication timeline | Capture request, route work, send approved update, record resolution |
| Task Detail | Category, assignment, original timing, progress/history and permitted attachments | Reassign if entitled; inspect/reopen if entitled; add operational notes |
| Handover | Open obligations, next owner/action, ETA and backup | Record handover and identify missing ownership |
| Approvals/Finance | Entitled requests, delegated limits, evidence, decision and external outcome | Request, approve/reject, execute or reconcile according to separate entitlements |
| Incidents | Necessary location, urgency, responder actions and permitted evidence | Acknowledge, attend, request backup, record response and handover |
| Reports | Authorized department metrics or approved executive summaries | Filter within scope; export only when separately authorized |
| Administration | Approved account/scope changes, configuration versions, integration health | Apply approved grants, expire access, maintain mappings, investigate failures |

## Core journeys

### Request to resolution (REQ-02 through REQ-06)

1. Capture guest/service context, category and priority; expose the accountable owner and applicable targets.
2. Dispatcher selects eligible staff within scope; unassigned work stays visible with its owner and escalation status.
3. Fulfiller accepts and records applicable progress: In Progress, On the Way, Completed or Blocked. Do not require On the Way for work where it is irrelevant.
4. Blocked work captures the reason and next action without resetting original timing. Supervisors can reassign, inspect and reopen incomplete work with a recorded reason.
5. Case owner sees linked department progress and maintains guest updates. Closure records the outcome and accounts for linked work; exact transition/cancellation policy remains pending.

### Shift handover (REQ-06)

Present unresolved cases/tasks with next owner, next action, ETA and backup. Identify missing required handover information before submission. Preserve the former owner's history and keep incomplete transfers visible; do not imply a notification alone proves acceptance. Operations must define acknowledgement and ownership-transfer rules.

### Financial exception (REQ-08)

Show the original reference, requested action, amount/currency, reason and required evidence. Clearly distinguish Requested, Approved/Rejected, execution outcome and reconciliation outcome as separate concepts. Disable self-approval for sensitive exceptions even if the actor has several profiles. Show only actions within delegated authority; uncertain external outcomes require verification before a retry.

### Safety incident and stay changes (REQ-07, REQ-09)

Provide immediately visible emergency routing instructions consistent with the approved property emergency plan. Display notification failure clearly; the application must not imply that creating a record guarantees a responder has been alerted.

For room moves and checkout, show the authoritative PMS result and guest-session revocation outcome separately. Failed synchronization remains an actionable exception. Do not claim access has been revoked while verification is pending.

## Shared states and validation

- Loading: indicate pending retrieval without showing stale sensitive content from another scope.
- Empty: distinguish no work from filters excluding work; provide a relevant permitted next action.
- Error: preserve user-entered non-sensitive work when safe and state whether submission succeeded, failed or has an uncertain outcome.
- Conflict: show that the record changed and require refreshed context before another mutation.
- Denied/expired session: stop access, provide reauthentication or a neutral denial, and prevent cached protected details from remaining visible.
- Attachment: show upload/validation progress and rejection reason; authorize downloads separately.
- Time: show understandable local times and explicit time-zone context where properties differ; preserve original stored event timing.
- Approval and high-impact changes: show the proposed effect, required authority and resulting recorded outcome.

## Design acceptance

Validate each profile's main journey, keyboard navigation, narrow-screen use, readable deadlines and denied-access states. Confirm users can distinguish case ownership from task assignment, approval from execution, and completion from inspection. Final usability and visual acceptance require representative hotel staff; implementation verification is in [TEST_PLAN.md](TEST_PLAN.md).


## Suggested UI implementation supplement (2026-10-20)

[TECH_STACK.md](TECH_STACK.md) recommends React/Next.js, Tailwind CSS, accessible Radix primitives, React Hook Form and Zod for the interactions above. Treat these as suggested implementation tools rather than an approved visual system. Shared components should expose authorized actions from server-derived context, while domain services independently enforce every action. Follow the vertical slices in [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md); keep sensitive pages and responses out of shared/public caches.
