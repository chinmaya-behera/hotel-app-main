# Proposed Entity Relationship Model

Status: Proposed logical-to-relational design, not an applied schema | Updated: 2026-10-20

## Reading the model

The four Mermaid ER diagrams divide one model into readable domains. Repeated entity names represent the same table. `||` means exactly one, `o|` means zero or one, and `o{` means zero or many. PK/FK/UK identify primary, foreign and unique keys. Attributes are a minimum implementation guide; omitted fields must not be inferred to be forbidden. Nullable references are explicitly described below.

Use UUID primary keys, `timestamptz` event timestamps and UTC storage; property time zones determine display and scheduling. Property-owned records carry `property_id`. Enforce same-property relationships with composite uniqueness and foreign keys, not UUID uniqueness alone. External identifiers are scoped to connector/property, never assumed globally unique.

These diagrams propose data storage needed for [PRD.md](PRD.md), not new business entitlements. See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for transactions and migrations.

## 1. Organization, identity and scoped access

```mermaid
erDiagram
    PROPERTY ||--o{ DEPARTMENT : contains
    PROPERTY ||--o{ FLOOR : contains
    DEPARTMENT ||--o{ OUTLET : owns
    PROPERTY ||--o{ SHIFT : schedules
    STAFF_ACCOUNT ||--o{ STAFF_MEMBERSHIP : holds
    PROPERTY ||--o{ STAFF_MEMBERSHIP : includes
    STAFF_MEMBERSHIP ||--o{ PROFILE_GRANT : receives
    PROFILE ||--o{ PROFILE_GRANT : grants
    PROFILE ||--o{ PROFILE_PERMISSION : bundles
    PERMISSION ||--o{ PROFILE_PERMISSION : defines
    PROFILE_GRANT ||--|| GRANT_SCOPE : restricts
    PROFILE_GRANT ||--o{ FINANCIAL_LIMIT : constrains
    PROPERTY {
        uuid id PK
        string name
        string time_zone
    }
    DEPARTMENT {
        uuid id PK
        uuid property_id FK
        string name
    }
    OUTLET {
        uuid id PK
        uuid property_id FK
        uuid department_id FK
        string name
    }
    FLOOR {
        uuid id PK
        uuid property_id FK
        string label
    }
    SHIFT {
        uuid id PK
        uuid property_id FK
        datetime starts_at
        datetime ends_at
    }
    STAFF_ACCOUNT {
        uuid id PK
        string oidc_issuer
        string oidc_subject
        string employee_identifier
        string status
    }
    STAFF_MEMBERSHIP {
        uuid id PK
        uuid property_id FK
        uuid staff_account_id FK
        uuid manager_membership_id FK
        string status
    }
    PROFILE {
        uuid id PK
        string code UK
        string name
    }
    PERMISSION {
        string code PK
        string description
    }
    PROFILE_PERMISSION {
        uuid profile_id PK, FK
        string permission_code PK, FK
    }
    PROFILE_GRANT {
        uuid id PK
        uuid property_id FK
        uuid membership_id FK
        uuid profile_id FK
        uuid approved_by_membership_id FK
        datetime valid_from
        datetime expires_at
        datetime revoked_at
    }
    GRANT_SCOPE {
        uuid profile_grant_id PK, FK
        uuid property_id FK
        uuid department_id FK
        uuid outlet_id FK
        uuid floor_id FK
        uuid shift_id FK
    }
    FINANCIAL_LIMIT {
        uuid id PK
        uuid property_id FK
        uuid profile_grant_id FK
        string action_code FK
        string currency
        string transaction_type
        decimal maximum_amount
    }
```

Scope has a mandatory property and optional department/outlet/floor/shift, interpreted as a conjunction within that grant. Null means unrestricted within its already-approved parent scope, not unrestricted across properties. Represent disjoint scopes as separate grants. An outlet's department must agree with the grant; constrain `outlet_id` to require its matching `department_id`. Shift eligibility requires current time inside the configured shift plus applicable grant validity.

`manager_membership_id` is optional and references the same property's membership. Approving membership is mandatory for operational grants; initial administrative bootstrap uses a separately recorded, reviewed provisioning procedure. Define unique `(oidc_issuer, oidc_subject)` and `(staff_account_id, property_id)`. Financial limits reference the permission catalog and cannot create an action absent from the profile. Reason/evidence policy remains approved configuration, not an inferred permission.

## 2. Guest context, cases, tasks and shift continuity

```mermaid
erDiagram
    PROPERTY ||--o{ SERVICE_LOCATION : contains
    FLOOR o|--o{ SERVICE_LOCATION : locates
    OUTLET o|--o{ SERVICE_LOCATION : locates
    PROPERTY ||--o{ STAY_CONTEXT : tracks
    STAY_CONTEXT ||--o{ ROOM_ASSIGNMENT : occupies
    SERVICE_LOCATION ||--o{ ROOM_ASSIGNMENT : receives
    STAY_CONTEXT ||--o{ GUEST_SESSION : authorizes
    SERVICE_LOCATION ||--o{ QR_MAPPING : maps
    ROOM_ASSIGNMENT o|--o{ GUEST_SESSION : binds
    QR_MAPPING o|--o{ GUEST_SESSION : originates
    STAY_CONTEXT o|--o{ GUEST_CASE : contextualizes
    STAFF_MEMBERSHIP ||--o{ GUEST_CASE : owns
    GUEST_CASE ||--o{ DEPARTMENT_TASK : groups
    TASK_CATEGORY ||--o{ DEPARTMENT_TASK : classifies
    DEPARTMENT ||--o{ TASK_CATEGORY : owns
    SERVICE_LOCATION o|--o{ DEPARTMENT_TASK : locates
    STAFF_MEMBERSHIP o|--o{ DEPARTMENT_TASK : assigned
    DEPARTMENT_TASK ||--o{ TASK_EVENT : records
    GUEST_CASE ||--o{ CASE_MESSAGE : communicates
    GUEST_CASE ||--o{ CASE_LINK : source
    GUEST_CASE ||--o{ CASE_LINK : target
    GUEST_CASE ||--o{ HANDOVER : transfers
    TASK_CATEGORY ||--o{ SLA_POLICY : versions
    SLA_POLICY ||--o{ DEPARTMENT_TASK : governs
    TASK_CATEGORY ||--o{ COVERAGE_CONTACT : routes
    DEPARTMENT_TASK ||--o{ ESCALATION : triggers
    SERVICE_LOCATION {
        uuid id PK
        uuid property_id FK
        uuid floor_id FK
        uuid outlet_id FK
        string kind
        string label
    }
    STAY_CONTEXT {
        uuid id PK
        uuid property_id FK
        uuid connector_id FK
        string external_stay_reference
        string status
        bigint source_revision
    }
    ROOM_ASSIGNMENT {
        uuid id PK
        uuid property_id FK
        uuid stay_id FK
        uuid location_id FK
        datetime valid_from
        datetime valid_until
    }
    QR_MAPPING {
        uuid id PK
        uuid property_id FK
        uuid location_id FK
        string public_token_digest UK
        datetime revoked_at
    }
    GUEST_SESSION {
        uuid id PK
        uuid property_id FK
        uuid stay_id FK
        uuid room_assignment_id FK
        uuid qr_mapping_id FK
        string token_digest UK
        datetime expires_at
        datetime revoked_at
    }
    GUEST_CASE {
        uuid id PK
        uuid property_id FK
        uuid stay_id FK
        uuid owner_membership_id FK
        string priority
        string status
        bigint version
        datetime created_at
    }
    TASK_CATEGORY {
        uuid id PK
        uuid property_id FK
        uuid department_id FK
        string name
    }
    DEPARTMENT_TASK {
        uuid id PK
        uuid property_id FK
        uuid case_id FK
        uuid category_id FK
        uuid sla_policy_id FK
        uuid assignee_membership_id FK
        uuid location_id FK
        uuid parent_task_id FK
        string priority
        string status
        datetime acknowledgement_due_at
        datetime completion_due_at
        datetime created_at
        bigint version
    }
    TASK_EVENT {
        uuid id PK
        uuid property_id FK
        uuid task_id FK
        uuid actor_membership_id FK
        string event_type
        datetime occurred_at
    }
    CASE_MESSAGE {
        uuid id PK
        uuid property_id FK
        uuid case_id FK
        uuid author_membership_id FK
        string channel
        string delivery_status
        datetime created_at
    }
    CASE_LINK {
        uuid id PK
        uuid property_id FK
        uuid source_case_id FK
        uuid target_case_id FK
        string relationship
    }
    HANDOVER {
        uuid id PK
        uuid property_id FK
        uuid case_id FK
        uuid from_membership_id FK
        uuid next_owner_membership_id FK
        uuid backup_membership_id FK
        string next_action
        datetime eta
        datetime acknowledged_at
    }
    SLA_POLICY {
        uuid id PK
        uuid property_id FK
        uuid category_id FK
        int version
        int acknowledgement_seconds
        int completion_seconds
        uuid approved_by_membership_id FK
    }
    COVERAGE_CONTACT {
        uuid id PK
        uuid property_id FK
        uuid category_id FK
        uuid shift_id FK
        uuid primary_membership_id FK
        uuid backup_membership_id FK
        int escalation_level
    }
    ESCALATION {
        uuid id PK
        uuid property_id FK
        uuid task_id FK
        uuid recipient_membership_id FK
        int escalation_level
        string trigger_code
        datetime due_at
        string delivery_status
    }
```

Cases can exist without a reservation/stay; tasks may be unassigned. Location floor/outlet links are optional according to room/table kind. A guest session always belongs to a verified stay; room binding is optional only for approved non-room contexts. Enforce that any room assignment matches the session stay, any QR mapping agrees with its authorized location, and revocation applies to the affected session/stay lifecycle.

`parent_task_id` is optional for departmental subtasks; parent and child must share a property and case, and cycles are forbidden. `CASE_LINK` records duplicate/related cases without deleting or retiming either case; reject self-links. `TASK_EVENT` preserves assignment, inspection, reopening and progress changes. System events may have a null actor with an explicit system origin in event metadata. Message author is nullable only for authenticated inbound/system messages with recorded source. Add restricted body/metadata fields during schema implementation with clear data classification.

Task creation binds an immutable approved SLA version and stores computed due times. Subsequent policy changes do not silently alter existing tasks. Coverage contacts include approved primary/backup recipients by shift and escalation level; add approved per-level deadline configuration to policy implementation. Escalation records need a uniqueness key such as `(property_id, task_id, trigger_code, escalation_level, due_at)`; retries update delivery attempts rather than create new logical escalations.

## 3. Financial exception control

```mermaid
erDiagram
    PROPERTY ||--o{ FINANCIAL_EXCEPTION : contains
    GUEST_CASE o|--o{ FINANCIAL_EXCEPTION : motivates
    STAFF_MEMBERSHIP ||--o{ FINANCIAL_EXCEPTION : requests
    FINANCIAL_EXCEPTION ||--o{ FINANCIAL_APPROVAL : reviews
    STAFF_MEMBERSHIP ||--o{ FINANCIAL_APPROVAL : decides
    FINANCIAL_APPROVAL ||--o| FINANCIAL_EXECUTION : authorizes
    STAFF_MEMBERSHIP ||--o{ FINANCIAL_EXECUTION : executes
    FINANCIAL_EXECUTION ||--o{ RECONCILIATION : verifies
    STAFF_MEMBERSHIP ||--o{ RECONCILIATION : reconciles
    FINANCIAL_EXCEPTION ||--o{ FINANCIAL_EVIDENCE : supports
    ATTACHMENT ||--o{ FINANCIAL_EVIDENCE : links
    FINANCIAL_EXCEPTION {
        uuid id PK
        uuid property_id FK
        uuid case_id FK
        uuid requested_by_membership_id FK
        uuid connector_id FK
        string original_payment_reference
        string action_type
        decimal amount
        string currency
        string reason_code
        string status
        bigint version
    }
    FINANCIAL_APPROVAL {
        uuid id PK
        uuid property_id FK
        uuid exception_id FK
        uuid approver_membership_id FK
        bigint request_version
        string decision
        datetime decided_at
    }
    FINANCIAL_EXECUTION {
        uuid id PK
        uuid property_id FK
        uuid approval_id FK, UK
        uuid executor_membership_id FK
        string provider_reference
        string idempotency_key UK
        string outcome
        datetime executed_at
    }
    RECONCILIATION {
        uuid id PK
        uuid property_id FK
        uuid execution_id FK
        uuid reviewer_membership_id FK
        string settlement_reference
        string outcome
        datetime reviewed_at
    }
    FINANCIAL_EVIDENCE {
        uuid exception_id PK, FK
        uuid attachment_id PK, FK
        uuid property_id FK
    }
```

Use PostgreSQL exact `numeric`, not floating point, for amounts. Define currency precision and accepted values with Finance. Approval binds a request version covering action, amount, currency, property, original reference and evidence. Only an approved, current version may produce an execution. Rejection/history can create several approval records, but competing active approvals/executions for the same action must be prevented transactionally. One logical execution has many connector attempts in domain 4; retrying does not create a second refund.

Self-approval and reconciliation independence are cross-record/domain rules enforced transactionally against the approved policy. Do not encode every profile combination as a database role. Evidence links must match the exception's property and access class. Provider references may be absent until an outcome is known; unresolved outcomes remain explicit. This is an exception-control model, not a replacement accounting ledger or card-data store.

## 4. Restricted evidence, connectors and durable processing

```mermaid
erDiagram
    PROPERTY ||--o{ INCIDENT : contains
    GUEST_CASE o|--o{ INCIDENT : relates
    INCIDENT ||--o{ INCIDENT_ACCESS : restricts
    STAFF_MEMBERSHIP ||--o{ INCIDENT_ACCESS : receives
    INCIDENT ||--o{ INCIDENT_ACTION : records
    INCIDENT ||--o{ INCIDENT_EVIDENCE : preserves
    ATTACHMENT ||--o{ INCIDENT_EVIDENCE : links
    PROPERTY ||--o{ ATTACHMENT : owns
    PROPERTY ||--o{ CONNECTOR : configures
    CONNECTOR ||--o{ INTEGRATION_OPERATION : performs
    INTEGRATION_OPERATION ||--o{ INTEGRATION_ATTEMPT : attempts
    FINANCIAL_EXECUTION o|--o{ INTEGRATION_OPERATION : synchronizes
    CONNECTOR ||--o{ INBOUND_EVENT : receives
    PROPERTY ||--o{ OUTBOX_EVENT : publishes
    PROPERTY ||--o{ AUDIT_EVENT : protects
    INCIDENT {
        uuid id PK
        uuid property_id FK
        uuid case_id FK
        string severity
        string status
        datetime created_at
    }
    INCIDENT_ACCESS {
        uuid incident_id PK, FK
        uuid membership_id PK, FK
        uuid property_id FK
        uuid approved_by_membership_id FK
        datetime expires_at
        string access_level
    }
    INCIDENT_ACTION {
        uuid id PK
        uuid property_id FK
        uuid incident_id FK
        uuid actor_membership_id FK
        string action_type
        datetime occurred_at
    }
    ATTACHMENT {
        uuid id PK
        uuid property_id FK
        string object_key UK
        string content_digest
        string media_type
        bigint byte_size
        string classification
        string scan_status
    }
    INCIDENT_EVIDENCE {
        uuid incident_id PK, FK
        uuid attachment_id PK, FK
        uuid property_id FK
        uuid recorded_by_membership_id FK
        datetime recorded_at
    }
    CONNECTOR {
        uuid id PK
        uuid property_id FK
        string provider
        string kind
        string secret_reference
    }
    INTEGRATION_OPERATION {
        uuid id PK
        uuid property_id FK
        uuid connector_id FK
        uuid financial_execution_id FK
        string business_key
        string status
        datetime next_attempt_at
    }
    INTEGRATION_ATTEMPT {
        uuid id PK
        uuid property_id FK
        uuid operation_id FK
        int attempt_number
        string outcome
        string external_reference
        datetime attempted_at
    }
    INBOUND_EVENT {
        uuid id PK
        uuid property_id FK
        uuid connector_id FK
        string provider_event_id
        string processing_status
        datetime received_at
    }
    OUTBOX_EVENT {
        uuid id PK
        uuid property_id FK
        string event_type
        uuid aggregate_id
        string delivery_status
        datetime available_at
        datetime delivered_at
    }
    AUDIT_EVENT {
        uuid id PK
        uuid property_id FK
        uuid actor_membership_id FK
        string action
        string resource_type
        uuid resource_id
        string outcome
        datetime occurred_at
    }
```

Incident access is an additional explicit record-level gate alongside profile/scope checks; it does not grant unrelated operational rights. Initial authorized responders must receive access through approved routing. Model detailed evidence custody transfers as additional incident actions and protected audit records; production evidence procedures still require Security approval.

Financial execution is optional on an integration operation because PMS, notifications and other integrations also use this mechanism. Unique `(connector_id, business_key)`, `(connector_id, provider_event_id)` and `(operation_id, attempt_number)` prevent local duplicates. Store secrets in a secret manager; `secret_reference` is a locator only. Outbox and audit targets are typed logical references, not FKs to every table; validate target/type at write time and retain identifiers after archival. Add minimal payload, schema version, correlation and processing-lease fields when implementing the outbox. Ordinary case/task attachments use dedicated `CASE_ATTACHMENT`/`TASK_ATTACHMENT` join tables with the same scoped attachment checks as evidence links.

## Relational constraints and indexes

- Every property-owned parent offers unique `(property_id, id)`; child foreign keys include `property_id`. Add narrower composite keys where category/department, stay/assignment or parent-task/case consistency requires them.
- Declare required FKs non-null; only references explicitly described as optional are nullable. Use restrictive deletion for financial, audit and evidence history; account deactivation is not cascading deletion.
- Add uniqueness for profile codes, membership pairs, provider identities, SLA category/version, connector references and duplicate keys described above. Use check constraints for positive amounts, valid temporal ranges and non-negative targets.
- Index task queues by `(property_id, status, completion_due_at)` and `(property_id, assignee_membership_id, status)`; index active grants by membership, and timeline rows by parent/time. Add category/department queue indexes after representative query plans are measured.
- Use optimistic versions for interactive mutable records and transactional row locks/conditional updates for financial state. Index unsent outbox/due-operation rows, and verify scans remain efficient at the approved workload.
- SQL checks cannot enforce all cross-row authorization/state rules. Implement those in shared transactional domain services, backed by integration tests against real PostgreSQL.
