# Client demonstration scope

The app follows the repository's nine role profiles and its task, case, handover, financial approval, incident, access, audit and policy workflows. The separately requested room QR/email guest portal remains included. No unrelated product modules were added.

## Presenting a complete workflow

Use the local CLIENT_DEMO_LOGINS.md credential sheet; passwords are excluded from Git. Keep the same browser and sign out between profiles so each account sees the same isolated hotel workspace.

1. Front Desk: create two housekeeping requests for the same room; link one as a duplicate.
2. Dispatcher: assign the primary request and schedule its due time with a reason.
3. Fulfiller: accept, progress, add a note, block with a reason, resume and complete. A handover requires a distinct owner/backup and acknowledgement by its receiving owner.
4. Supervisor: inspect, reopen with a corrective note, and inspect again after completion. Front Desk can then close the resolved case.
5. Finance: request an adjustment. Executive approves; Finance records execution. Sign in as finance-review.demo to reconcile as Avery Shah. The executing identity cannot reconcile its own record.
6. Manager: propose an SLA change. Administrator approves configuration; new tasks use the approved targets while earlier deadlines stay unchanged.
7. Front Desk: register the room guest and verify identity. The room QR or login link sends the one-use password to that registered email. Guest security requests reach Security's incident queue; incident response updates the guest request. Moving/checking out/revoking the room invalidates its previous guest session.
8. Administrator: review audit and profile access. Unconfigured external integrations are shown as unavailable. Authorized report exports record an audit event.

## Verification

27 domain tests pass. The nine-account API smoke test covers permitted actions, role spoofing rejection, visitor isolation, update conflicts and logout revocation. The workflow smoke test covers the sequence above, distinct authenticated finance review, policies/access, guest security routing and room-session revocation. Its guest password is a database fixture: it does not send an email or assert new email delivery. Production builds and TypeScript checks pass.

## Production boundaries

Live PMS, keys, payments, emergency dispatch, immutable file evidence, employee identity lifecycle/MFA and granular property/floor/shift grants still require production integrations. Monetary execution is a demonstration record and moves no funds. These are explicitly documented boundaries, not working vendor connections. See ROLE_COVERAGE.md and the original PRD for remaining production scope.


## Extended feature demonstrations (2026-10-23)

Open /features from the hotel sidebar for the complete 31-area catalogue and interactive workflows. Follow [FEATURE_GUIDE.md](FEATURE_GUIDE.md) for independent access/configuration approval, actual multi-profile scope selection, coverage/escalation, safety, sandbox PMS/keys, financial uncertainty, POS/messaging recovery, emergency routing, private evidence and detached recovery. Configuration changes now require a separate Executive approval before Admin applies them.
