# Role implementation review

Updated 2026-10-23. All nine role profiles and the separate Finance reviewer have authenticated demonstration accounts. See [FEATURE_GUIDE.md](FEATURE_GUIDE.md) for all 31 feature areas, roles, locations and exact presentation steps. Open /features from the hotel sidebar.

| Profile | Working demonstration capabilities |
| --- | --- |
| Executive | Scoped summaries, delegated financial decisions, independent access/configuration approval, serious-case escalation summaries and emergency delivery outcomes |
| Front Desk | Guest cases, linked work, resolution, approved messages, handover, verified room registration, real QR/email login, moves/revocation, sandbox reservation/check-in/key/checkout and PMS failure recovery |
| Dispatcher | Scoped queues, eligible assignment, scheduling, duplicate/subtask linking, availability/shift/backup coverage, approved updates and durable escalation scans |
| Fulfiller | Actual assigned-person tasks, acceptance/progress/block/resume/completion, notes, private text evidence and acknowledged case handover |
| Supervisor | Inspection/reopen/correction, backup coverage, restricted entry, safe room-readiness release and handover |
| Manager | Department metrics/approvals, coverage, proposed scoped access and SLA/configuration changes, escalation and permitted exports |
| Finance | Evidence-bound USD/INR refund/folio/receivable exceptions, approved sandbox execution, uncertain-outcome verification, POS sync, duplicate prevention, scoped reports and independent authenticated reconciliation |
| Security | Restricted incidents, immediate sandbox alerts and delivery failure recovery, response/backup, protected evidence, unsafe-room marking and verified clearance |
| Administrator | Apply independently approved grants/configuration, revoke access, configure sandbox adapters, inspect audit, approved support diagnostics, operational recovery points and detached restore verification |

Additional approved profiles are selected by the recipient, retain the actual person identity, and bind permission plus property/outlet/floor/shift scope together on the server. Expired/revoked additional grants return to the base role. Main has twelve rooms; Annex adds A101 Day and A201 Night fixtures. Finance execution and reconciliation use distinct identities (finance.demo and finance-review.demo). Admin status does not confer financial/PMS execution authority.

Demo credentials remain in the ignored local CLIENT_DEMO_LOGINS.md sheet. Session tokens are hashed, HttpOnly and server-bound; role spoofing is rejected. Workspaces are synthetic, visitor-isolated and last up to twelve hours. Staff sessions last up to eight hours, or the independently approved shorter lifetime on new sign-ins.

Real email uses the server-side verified Resend sender and the current guest email registered by Front Desk. Moves, checkout and revocation remove old room codes/sessions. QR context alone is not a guest credential.

External PMS/POS/payments/physical keys/emergency delivery are sandbox adapters. The labelled MFA code is an exercise, not a real second authentication factor. Private plain-text evidence is not a production scanning/object-storage system. Escalation scanning is manually driven with a persisted controlled clock, not an automatic production worker. Restore exercises use detached operational copies and cannot roll back current data, financial/evidence/audit history or guest revocations. Production identity provisioning/OIDC, real MFA, contracted providers, signed vendor callbacks, infrastructure backup/PITR, retention/performance policies and organization approval remain release gates. No production-readiness claim is made.
