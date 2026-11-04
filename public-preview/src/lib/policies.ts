import type { RoleId } from '@/types/demo';

export interface ServicePolicy {
  id: string;
  category: 'Authority' | 'Operational' | 'Security & Privacy' | 'Quality & Safety' | 'Escalation';
  title: string;
  department?: string;
  appliesTo: RoleId[];
  summary: string;
  policySummary?: string;
  rules: string[];
  authorityLimit?: string;
  escalationTarget?: string;
  configured: boolean;
  needsConfiguration?: boolean;
}

export interface RoleAuthorityProfile {
  roleId: RoleId;
  roleName: string;
  department: string;
  financialLimit: number;
  financialLimitDisplay: string;
  operationalAuthority: string[];
  canDo?: string[];
  negativeBoundaries: string[];
  cannotDo?: string[];
  escalationPath: {
    targetRole: string;
    condition: string;
  }[];
}

export const ROLE_AUTHORITY_PROFILES: Record<RoleId, RoleAuthorityProfile> = {
  task_fulfiller: {
    roleId: 'task_fulfiller',
    roleName: 'Task Fulfiller',
    department: 'Housekeeping & Maintenance',
    financialLimit: 0,
    financialLimitDisplay: '₹0 (Execution only)',
    operationalAuthority: [
      'Accept assigned tasks and claim unassigned department tickets from open pool',
      'Start work (status: In progress) and report operational blockers with reason code',
      'Upload mandatory photographic proof-of-work upon completing tasks',
      'Request task reassignment if overloaded or outside assigned zone',
    ],
    negativeBoundaries: [
      'Must NOT assign tasks to other staff members',
      'Must NOT conduct or sign off on physical room quality inspections',
      'Must NOT access guest billing folios, card payments, or tariffs',
      'Must NOT alter room readiness status directly to clean without supervisor inspection',
    ],
    escalationPath: [
      {
        targetRole: 'Department Dispatcher / Supervisor',
        condition: 'Operational blockers (DND active, room inaccessible, missing supplies, damage)',
      },
    ],
  },

  department_dispatcher_supervisor: {
    roleId: 'department_dispatcher_supervisor',
    roleName: 'Department Dispatcher / Supervisor',
    department: 'Operations (Dispatch & Quality)',
    financialLimit: 0,
    financialLimitDisplay: '₹0 (Operational management only)',
    operationalAuthority: [
      'Triage incoming guest requests and manual/auto-assign to field fulfillers',
      'Conduct 5-category room quality inspections; certify clean for scores ≥85%',
      'Reopen failed rooms with mandatory deficiency notes and attendant directive',
      'Review and approve or reject fulfiller task reassignment requests',
      'Rebalance unstarted tasks across attendants and link duplicate tickets',
      'Log and acknowledge inter-shift handover briefings',
      'Monitor dual SLA countdown timers (MTTA ≤5m, MTTR ≤30m)',
    ],
    negativeBoundaries: [
      'Must NOT authorize financial compensation, guest credits, or payment refunds',
      'Must NOT modify guest room assignments, check-in, or checkout in Front Desk',
      'Must NOT override Out of Order (OOO) status without Department Manager approval',
      'Must NOT alter system-wide SLA configurations or user credentials',
    ],
    escalationPath: [
      {
        targetRole: 'Department Manager',
        condition: 'Dual SLA breaches (MTTA >5m, MTTR >30m), structural defects, cross-department bottlenecks',
      },
    ],
  },

  department_manager: {
    roleId: 'department_manager',
    roleName: 'Department Manager',
    department: 'Duty & Departmental Leadership',
    financialLimit: 16000,
    financialLimitDisplay: 'Up to ₹16,000 per incident',
    operationalAuthority: [
      'Approve guest service recovery compensation up to ₹16,000 per incident',
      'Approve supply and equipment requisitions up to ₹16,000',
      'Authorize Out of Order (OOO) room block overrides for deep maintenance',
      'Create new hotel services and map them to department queues and guest portal',
      'Initiate room and VIP inspection directives that flow to Dispatcher / Supervisor',
      'Issue property-wide manager directives and lead crisis incident response',
      'Submit and review management shift handover briefings',
    ],
    negativeBoundaries: [
      'Must NOT approve compensation or capex exceeding ₹16,000 (escalate to General Manager)',
      'Must NOT execute direct payment gateway bank refunds (route to Financial Operator)',
      'Must NOT modify system RBAC user accounts or integration credentials (reserved for Admin)',
    ],
    escalationPath: [
      {
        targetRole: 'General Manager',
        condition: 'Compensation claims or capital equipment requisitions exceeding ₹16,000',
      },
    ],
  },

  front_desk_coordinator: {
    roleId: 'front_desk_coordinator',
    roleName: 'Front Desk',
    department: 'Front Office',
    financialLimit: 2500,
    financialLimitDisplay: 'Up to ₹2,500 (Discretionary guest service credit)',
    operationalAuthority: [
      'Process guest arrivals, in-person ID verification, and check-in (gated by room readiness)',
      'Process guest express check-outs, immediately revoking in-room digital QR session',
      'Execute guest room moves, atomically revoking old room token and issuing new room session',
      'Triage unassigned and concierge guest requests and route to correct department dispatcher',
      'Manage Lost & Found registry (enforcing privacy rule: never show photos of sensitive items)',
      'Retry and reconcile failed PMS synchronization issues',
    ],
    negativeBoundaries: [
      'Must NOT check in guests to dirty, cleaning, or uninspected rooms',
      'Must NOT execute raw banking ledger refunds or alter general journal entries',
      'Must NOT reassign maintenance or housekeeping staff tasks directly',
    ],
    escalationPath: [
      {
        targetRole: 'Department Manager',
        condition: 'Guest compensation claims >₹2,500, persistent PMS sync failures, security alerts',
      },
    ],
  },

  financial_operator: {
    roleId: 'financial_operator',
    roleName: 'Financial Operator',
    department: 'Finance & Accounts',
    financialLimit: 80000,
    financialLimitDisplay: 'Up to ₹80,000 per refund transaction',
    operationalAuthority: [
      'Record guest payments (Cash, UPI, Credit Card, Bank Wire) against folio balances',
      'Preview, format, and generate official GST/VAT guest tax invoices',
      'Review and execute approved refund requests up to authorized clearance limit (₹80,000)',
      'Reconcile payment gateway transactions against PMS charges and bank settlement feeds',
      'Simulate gateway status transitions (settled, disputed, failed)',
    ],
    negativeBoundaries: [
      'Must NOT approve or execute refund requests initiated by themselves (Dual-control segregation)',
      'Must NOT alter room physical readiness states or dispatch operational runners',
      'Must NOT expose unmasked credit card primary account numbers (PCI-DSS compliance)',
    ],
    escalationPath: [
      {
        targetRole: 'General Manager',
        condition: 'Refund claims exceeding ₹80,000, unresolvable gateway chargebacks, fraud investigations',
      },
    ],
  },

  security_responder: {
    roleId: 'security_responder',
    roleName: 'Security Responder',
    department: 'Safety & Security',
    financialLimit: 0,
    financialLimitDisplay: '₹0 (Restricted safety & security view)',
    operationalAuthority: [
      'Receive and acknowledge emergency SOS panic alerts (MTTA target ≤60s)',
      'Inspect tactical architectural SVG floor plans with emergency stairwells and beacons',
      'Progress security incidents: New → Acknowledged → On Scene → Resolved',
      'Call for secondary officer backup during high-risk incidents',
      'Escalate critical emergencies directly to Department Manager / Duty Manager',
      'File formal post-incident investigation reports with photographic evidence and witness notes',
    ],
    negativeBoundaries: [
      'STRICT ISOLATION BOUNDARY: Zero access to guest folios, payment details, or room tariffs',
      'Must NOT alter room readiness or modify operational task assignments',
      'Evidence logs and incident timeline notes cannot be modified once filed',
    ],
    escalationPath: [
      {
        targetRole: 'Department Manager / General Manager',
        condition: 'Critical emergencies, violent altercations, emergency services dispatch (Police/Ambulance)',
      },
    ],
  },

  general_manager: {
    roleId: 'general_manager',
    roleName: 'General Manager',
    department: 'Executive Office',
    financialLimit: 200000,
    financialLimitDisplay: 'Up to ₹2,00,000 (Executive Approver Mode)',
    operationalAuthority: [
      'Property-wide oversight: occupancy, total revenue, SLA compliance, department velocity',
      'Authorize high-value Capex and resource requisitions up to ₹2,00,000',
      'Authorize major guest service recovery compensation exceeding ₹16,000',
      'Issue property-wide Executive Crisis Directives during emergencies',
      'Initiate property-wide and VIP inspection instructions that flow to Dispatcher / Supervisor',
      'Inspect departmental performance scorecards and immutable system audit ledger',
      'Export executive operational and quality analytics to Blob CSV',
    ],
    negativeBoundaries: [
      'Must NOT perform frontline task dispatching or field runner assignments',
      'Must NOT bypass internal control signatures for expenditures >₹2,00,000 without Board approval',
      'Must NOT conduct daily routine guest check-in/out transactions',
    ],
    escalationPath: [
      {
        targetRole: 'Board of Directors / Hotel Ownership',
        condition: 'Major capital acquisitions or structural write-offs exceeding ₹2,00,000',
      },
    ],
  },

  platform_admin: {
    roleId: 'platform_admin',
    roleName: 'Platform Administrator',
    department: 'Platform & IT Administration',
    financialLimit: 0,
    financialLimitDisplay: '₹0 (Administrative configuration only)',
    operationalAuthority: [
      'Provision, update, and suspend staff user accounts across all roles',
      'Manage room QR access tokens, inspect cryptographic digests, and execute emergency revocation',
      'Calibrate dual SLA threshold countdown sliders (MTTA & MTTR minutes)',
      'Monitor external integration connector health (PMS, Gateway, Locks) and simulate recovery',
      'Inspect immutable system security and access audit logs',
      'Export audit trails to JSON',
    ],
    negativeBoundaries: [
      'Must NOT process guest payments, conduct room inspections, or intake front desk guests',
      'Must NOT bypass audit trail logging: all administrative actions are permanently recorded',
    ],
    escalationPath: [
      {
        targetRole: 'General Manager / Corporate Security',
        condition: 'Suspected data breach, unauthorized privilege escalation, or systemic infrastructure failure',
      },
    ],
  },

  // Backward compatibility aliases
  department_dispatcher: {} as unknown as RoleAuthorityProfile,
  department_supervisor: {} as unknown as RoleAuthorityProfile,
  executive_viewer: {} as unknown as RoleAuthorityProfile,
};

// Aliases
ROLE_AUTHORITY_PROFILES.department_dispatcher = ROLE_AUTHORITY_PROFILES.department_dispatcher_supervisor;
ROLE_AUTHORITY_PROFILES.department_supervisor = ROLE_AUTHORITY_PROFILES.department_dispatcher_supervisor;
ROLE_AUTHORITY_PROFILES.executive_viewer = ROLE_AUTHORITY_PROFILES.general_manager;

export const SHARED_SERVICE_POLICIES: ServicePolicy[] = [
  {
    id: 'pol-01',
    category: 'Authority',
    title: 'Multi-Tier Service Recovery Compensation Limits',
    department: 'Property-Wide',
    appliesTo: ['front_desk_coordinator', 'department_manager', 'general_manager'],
    summary: 'Clear monetary delegation tiers prevent unauthorized bill write-offs while empowering fast guest recovery.',
    rules: [
      'Front Desk Coordinator can apply up to ₹2,500 service credit for routine minor inconveniences.',
      'Department Manager / Duty Manager can authorize up to ₹16,000 for verified service breakdowns, noise complaints, or dining issues.',
      'Claims exceeding ₹16,000 (up to ₹2,00,000) strictly require General Manager sign-off.',
      'All applied compensation must reference a logged guest complaint case.',
    ],
    authorityLimit: 'Front Desk: ₹2,500 · Dept Manager: ₹16,000 · GM: ₹2,00,000',
    escalationTarget: 'Escalate to next tier if guest claim exceeds authorized limit',
    configured: true,
  },
  {
    id: 'pol-02',
    category: 'Operational',
    title: 'Guest Request Routing & Fallback Protocol',
    department: 'Operations',
    appliesTo: ['front_desk_coordinator', 'department_dispatcher_supervisor', 'task_fulfiller'],
    summary: 'Standardized lifecycle ensuring all guest requests are triaged, dispatched, and fulfilled without dropped tickets.',
    rules: [
      'Tagged requests with clear department mapping route directly into the Department Dispatcher / Supervisor queue.',
      'Untagged requests or special concierge inquiries route to Front Desk as mandatory triage fallback.',
      'Front Desk redirects untagged items to the appropriate department within 5 minutes.',
      'Eligible fulfillers can self-claim unassigned tasks from the department open pool prior to supervisor dispatch.',
      'Once claimed or assigned, owner and status changes synchronize in real-time across all connected screens.',
    ],
    escalationTarget: 'Department Dispatcher / Supervisor for stalled unassigned tickets',
    configured: true,
  },
  {
    id: 'pol-03',
    category: 'Quality & Safety',
    title: 'Room Turnover, Inspection & Readiness Release Gate',
    department: 'Housekeeping',
    appliesTo: ['task_fulfiller', 'department_dispatcher_supervisor', 'front_desk_coordinator'],
    summary: 'Front Desk check-in is physically gated: guests may never receive keys or QR access to uninspected rooms.',
    rules: [
      'Departing guest checkout immediately sets room status to dirty and revokes digital QR session.',
      'Fulfillers must attach photographic proof-of-work before submitting a room cleaning task for inspection.',
      'Supervisor conducts 5-category checklist inspection (Bedding, Bathroom, Amenities, Climate/Surfaces, Safety).',
      'Rooms scoring ≥85% are certified inspected and released to Front Desk as clean and ready.',
      'Rooms scoring <85% are reopened with mandatory deficiency notes and returned to attendant for correction.',
    ],
    configured: true,
  },
  {
    id: 'pol-04',
    category: 'Security & Privacy',
    title: 'Security Isolation & Confidentiality Boundary',
    department: 'Safety & Security',
    appliesTo: ['security_responder'],
    summary: 'Security responders operate under a strict zero-folio isolation boundary to protect guest financial privacy.',
    rules: [
      'Security personnel must NEVER view guest financial folios, payment methods, credit card details, or room tariffs.',
      'Incident dispatches only convey room coordinates, caller name, and immediate life-safety notes.',
      'Filed evidence photos and witness statements become immutable audit records upon submission.',
      'Panic alarms require officer acknowledgment within 60 seconds.',
    ],
    configured: true,
  },
  {
    id: 'pol-05',
    category: 'Security & Privacy',
    title: 'Financial Segregation of Duties & Refund Dual-Control',
    department: 'Finance & Accounts',
    appliesTo: ['financial_operator', 'department_manager', 'general_manager'],
    summary: 'Strict segregation between transaction request, approval, execution, and independent bank reconciliation.',
    rules: [
      'An operator who initiates a refund request cannot approve or execute the same refund.',
      'Financial Operator can execute refunds up to ₹80,000 against authorized dispute records.',
      'Payment card details are strictly tokenized and masked (PCI-DSS compliance: •••• 4242).',
      'Daily three-way reconciliation between PMS charges, Payment Gateway, and Bank settlement batch.',
    ],
    authorityLimit: 'Finance Operator: ₹80,000 execution limit',
    escalationTarget: 'General Manager for refunds >₹80,000',
    configured: true,
  },
  {
    id: 'pol-06',
    category: 'Operational',
    title: 'Inter-Shift Handover Continuity Protocol',
    department: 'All Departments',
    appliesTo: ['department_dispatcher_supervisor', 'department_manager', 'general_manager'],
    summary: 'Standardized operational briefings between shifts preventing dropped tasks, forgotten VIPs, or unresolved safety issues.',
    rules: [
      'Outgoing lead compiles open tasks, pending room inspections, active VIPs, and maintenance blocks.',
      'Handover record must specify explicit follow-up responsibility for each pending item.',
      'Incoming shift lead must review and formally acknowledge the handover briefing upon taking charge.',
      'Handover timestamp, outgoing ID, and incoming ID are immutably recorded in the property audit ledger.',
    ],
    configured: true,
  },
  {
    id: 'pol-07',
    category: 'Operational',
    title: 'Management Inspection Directives Protocol',
    department: 'Operations',
    appliesTo: ['department_manager', 'general_manager', 'department_dispatcher_supervisor'],
    summary: 'Structured flow enabling Department Managers and GM to issue targeted inspection directives to Supervisors.',
    rules: [
      'Department Manager or General Manager can initiate specific inspection instructions for rooms or VIP suites.',
      'Instructions immediately surface in the Dispatcher / Supervisor inspection queue with high priority.',
      'Supervisor conducts inspection according to the manager directive and logs specific findings.',
      'Inspection outcome, score, findings, and follow-up actions synchronize back to the initiating manager.',
    ],
    configured: true,
  },
  {
    id: 'pol-08',
    category: 'Operational',
    title: 'Custom Brand Amenity Procurement & Vendor SLA Policy',
    department: 'Procurement',
    appliesTo: ['department_manager', 'general_manager'],
    summary: 'Rules governing vendor procurement contracts and external amenity supplier turnaround times.',
    rules: [
      'Vendor contracts must maintain minimum 48-hour delivery SLA on high-turnover linen and toiletries.',
      'Requisitions exceeding departmental quota require formal competitive bid documentation.',
    ],
    configured: false, // Clearly marked as needing configuration!
  },
];

// Dynamically attach backwards-compatible helper aliases so any property access works safely
Object.values(ROLE_AUTHORITY_PROFILES).forEach((profile) => {
  if (profile && typeof profile === 'object') {
    profile.canDo = profile.operationalAuthority;
    profile.cannotDo = profile.negativeBoundaries;
  }
});

SHARED_SERVICE_POLICIES.forEach((policy) => {
  if (policy && typeof policy === 'object') {
    policy.policySummary = policy.summary;
    policy.needsConfiguration = !policy.configured;
  }
});

