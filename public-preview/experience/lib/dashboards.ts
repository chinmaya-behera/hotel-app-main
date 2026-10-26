import {
  ArrowRightLeft,
  BadgeCheck,
  Banknote,
  BedDouble,
  ClipboardCheck,
  CircleCheck,
  ConciergeBell,
  Crown,
  Gauge,
  Hourglass,
  Inbox,
  KeyRound,
  Landmark,
  ListChecks,
  LockKeyhole,
  LogIn,
  LogOut,
  PackageSearch,
  Plug,
  QrCode,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Star,
  Stamp,
  Timer,
  TriangleAlert,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';
import type { DashboardConfig, RoleId, Transition } from '../types/demo.ts';

const fulfillerFlow: Record<string, Transition[]> = {
  Assigned: [{ label: 'Accept', next: 'Accepted', message: 'Task accepted' }],
  Accepted: [{ label: 'Start work', next: 'In progress', message: 'Work started' }],
  'In progress': [
    { label: 'Complete', next: 'Completed', message: 'Task completed and sent for inspection' },
    { label: 'On the way', next: 'On the way', message: 'Heading to the room', variant: 'secondary' },
    {
      label: 'Report blocker',
      next: 'Blocked',
      message: 'Blocker reported',
      variant: 'danger',
      reasons: ['Guest asked not to be disturbed', 'Awaiting parts or supplies', 'Cannot access the room'],
    },
  ],
  'On the way': [{ label: 'Complete', next: 'Completed', message: 'Delivered, task completed' }],
  Blocked: [{ label: 'Resume', next: 'In progress', message: 'Blocker cleared, work resumed' }],
  'Reassignment requested': [{ label: 'Withdraw request', next: 'Assigned', message: 'Reassignment request withdrawn' }],
};

export const dashboards: Record<RoleId, DashboardConfig> = {
  task_fulfiller: {
    sub: 'Your assigned tasks for today. Move each one forward; blockers always need a reason.',
    listTitle: 'My tasks',
    listHint: 'Accept, start, complete or report a blocker',
    listIcon: ClipboardCheck,
    kpis: [
      { label: 'My open tasks', value: '0', icon: ListChecks, live: 'open' },
      { label: 'Completed today', value: '7', delta: '+2 vs yesterday', trend: 'up', good: true, icon: CircleCheck },
      { label: 'Avg completion', value: '11m', delta: '−1m', trend: 'down', good: true, icon: Timer },
      { label: 'On-time rate', value: '96%', delta: '+2%', trend: 'up', good: true, icon: Gauge },
    ],
    transitions: fulfillerFlow,
    side: [
      {
        type: 'meters',
        title: 'Shift progress',
        hint: 'Sample figures',
        icon: Gauge,
        rows: [
          { label: 'Tasks completed', value: 58, note: '7 of 12' },
          { label: 'On-time rate', value: 96, note: '96%' },
          { label: 'Floor 4 coverage', value: 80, note: '4 of 5 rooms', tone: 'warning' },
        ],
      },
      {
        type: 'notes',
        title: 'What you can and cannot do',
        icon: LockKeyhole,
        rows: ['Update status on your own tasks', 'No folio or billing access', 'Cannot reassign colleagues', 'A blocker needs a recorded reason'],
      },
    ],
  },

  department_dispatcher: {
    sub: 'Everything unassigned in your department. Assigning or linking never resets the original SLA clock.',
    listTitle: 'Department queue',
    listHint: 'Assign staff or link duplicates',
    listIcon: Inbox,
    banner: { tone: 'warning', text: '1 request is past its acknowledgement target. Assign it first to stop escalation.' },
    kpis: [
      { label: 'Open queue', value: '0', icon: Inbox, live: 'open' },
      { label: 'Overdue', value: '2', delta: '+1', trend: 'up', good: false, icon: TriangleAlert },
      { label: 'Avg assign time', value: '1m 40s', delta: '−12s', trend: 'down', good: true, icon: Timer },
      { label: 'Staff on shift', value: '9 / 12', icon: Users },
    ],
    transitions: {
      Unassigned: [
        { label: 'Assign next available', next: 'Assigned', message: 'Assigned, original SLA timer kept' },
        { label: 'Link duplicate', next: 'Linked', message: 'Linked as duplicate, original timestamp kept', variant: 'secondary' },
      ],
      Assigned: [{ label: 'Reassign', next: 'Assigned', message: 'Reassigned, history preserved', variant: 'secondary' }],
    },
    side: [
      {
        type: 'meters',
        title: 'Staff workload',
        hint: 'Active tasks per person',
        icon: Users,
        rows: [
          { label: 'Arjun', value: 45, note: '3 tasks' },
          { label: 'Meera', value: 75, note: '5 tasks', tone: 'warning' },
          { label: 'Kabir', value: 15, note: '1 task' },
          { label: 'Sana', value: 60, note: '4 tasks' },
        ],
      },
      {
        type: 'notes',
        title: 'Escalation ladder',
        icon: Workflow,
        rows: ['5m without acknowledgement: amber warning', 'Past completion target: Supervisor', 'VIP or repeat failure: Duty Manager', 'Critical and unresolved: GM'],
      },
    ],
  },

  department_supervisor: {
    sub: 'Inspect completed work. Reopening always needs a corrective reason and keeps the full history.',
    listTitle: 'Inspection queue',
    listHint: 'Approve or reopen with a reason',
    listIcon: BadgeCheck,
    kpis: [
      { label: 'Awaiting inspection', value: '0', icon: ClipboardCheck, live: 'open' },
      { label: 'First-pass rate', value: '91%', delta: '+3%', trend: 'up', good: true, icon: BadgeCheck },
      { label: 'Reopened today', value: '1', icon: RotateCcw },
      { label: 'Handover items', value: '3', icon: ArrowRightLeft },
    ],
    transitions: {
      'Awaiting inspection': [
        { label: 'Approve', next: 'Closed', message: 'Inspection passed, task closed' },
        {
          label: 'Reopen',
          next: 'Reopened',
          message: 'Task reopened with corrective action',
          variant: 'danger',
          reasons: ['Bathroom not clean', 'Items missing or wrong', 'Guest complaint', 'Safety concern'],
        },
      ],
      Reopened: [{ label: 'Re-dispatch', next: 'Dispatched', message: 'Re-dispatched, history preserved' }],
    },
    side: [
      {
        type: 'notes',
        title: 'Shift handover',
        hint: 'Draft for the evening shift',
        icon: ArrowRightLeft,
        rows: ['3 open obligations carried over', 'Next owner: Evening supervisor', 'Backup responder: Duty Manager', 'ETA for open items: 18:00'],
      },
      {
        type: 'meters',
        title: 'Team quality',
        icon: Star,
        rows: [
          { label: 'Arjun', value: 94, note: '94% pass' },
          { label: 'Meera', value: 88, note: '88% pass', tone: 'warning' },
          { label: 'Kabir', value: 92, note: '92% pass' },
        ],
      },
    ],
  },

  department_manager: {
    sub: 'Escalations, VIP cases and service recovery. You can approve credits up to $200; anything above goes to the GM.',
    listTitle: 'Escalations',
    listHint: 'Approve recovery or escalate to the GM',
    listIcon: Siren,
    banner: { tone: 'danger', text: '1 escalation has breached its SLA. Resolve or escalate it now.' },
    kpis: [
      { label: 'Open escalations', value: '0', icon: Siren, live: 'open' },
      { label: 'SLA breaches', value: '2', delta: '+1', trend: 'up', good: false, icon: TriangleAlert },
      { label: 'VIP cases', value: '1', icon: Crown },
      { label: 'Credit used today', value: '$120', delta: 'of $200', icon: Wallet },
    ],
    transitions: {
      Escalated: [
        { label: 'Approve recovery', next: 'Resolved', message: 'Recovery approved and logged', blockedIf: 'overLimit' },
        { label: 'Escalate to GM', next: 'With GM', message: 'Escalated to the GM', variant: 'secondary' },
      ],
    },
    side: [
      {
        type: 'meters',
        title: 'Delegated limit',
        hint: 'Prototype default: $200',
        icon: Wallet,
        rows: [{ label: 'Credit used today', value: 60, note: '$120 / $200' }],
      },
      {
        type: 'meters',
        title: 'Department pulse',
        icon: Gauge,
        rows: [
          { label: 'Housekeeping', value: 92, note: '92% on time' },
          { label: 'Maintenance', value: 78, note: '78% on time', tone: 'warning' },
          { label: 'F&B', value: 95, note: '95% on time' },
          { label: 'Spa', value: 89, note: '89% on time' },
        ],
      },
    ],
  },

  front_desk_coordinator: {
    sub: 'Arrivals, departures and guest cases. Room moves and checkouts revoke the guest QR session immediately.',
    listTitle: 'Arrivals, departures and cases',
    listHint: 'Check in, move rooms, check out',
    listIcon: ConciergeBell,
    kpis: [
      { label: 'Open actions', value: '0', icon: ListChecks, live: 'open' },
      { label: 'Arrivals', value: '14', icon: LogIn },
      { label: 'Departures', value: '9', icon: LogOut },
      { label: 'In house', value: '113', delta: '+5', trend: 'up', good: true, icon: BedDouble },
    ],
    transitions: {
      Expected: [{ label: 'Check in', next: 'In house', message: 'Guest checked in, stay verified' }],
      'In house': [
        { label: 'Move room', next: 'Room moved', message: 'Room moved, old session revoked', revokesQr: true, variant: 'secondary' },
        { label: 'Check out', next: 'Checked out', message: 'Checked out, session revoked', revokesQr: true },
      ],
      Departing: [{ label: 'Express checkout', next: 'Checked out', message: 'Express checkout done, session revoked', revokesQr: true }],
      Open: [{ label: 'Close case', next: 'Closed', message: 'Guest case closed' }],
    },
    side: [
      { type: 'lostfound', title: 'Lost & found', hint: 'Publish found items to guests', icon: PackageSearch },
      { type: 'rooms', title: 'Room status', hint: 'Checkouts turn rooms dirty', icon: BedDouble },
      {
        type: 'meters',
        title: 'Occupancy by floor',
        icon: Gauge,
        rows: [
          { label: 'Floor 3', value: 75, note: '6 of 8' },
          { label: 'Floor 4', value: 75, note: '6 of 8' },
          { label: 'Floor 5', value: 75, note: '6 of 8' },
        ],
      },
    ],
  },

  financial_operator: {
    sub: 'Approved exceptions to execute and reconcile. You can never approve your own request.',
    listTitle: 'Financial exceptions',
    listHint: 'Execute, hand off, reconcile',
    listIcon: Receipt,
    banner: { tone: 'info', text: 'Cards are shown as masked tokens only. Raw card numbers are never stored or displayed.' },
    kpis: [
      { label: 'Open exceptions', value: '0', icon: Receipt, live: 'open' },
      { label: 'Refunds executed', value: '$1,284', delta: '+$85', trend: 'up', good: true, icon: Banknote },
      { label: 'Match rate', value: '99.2%', icon: ShieldCheck },
      { label: 'Pending reconciliation', value: '1', icon: Hourglass },
    ],
    transitions: {
      'Pending approval': [{ label: 'Approve', next: 'Approved', message: 'Exception approved', blockedIf: 'self' }],
      Approved: [{ label: 'Execute refund', next: 'Executed', message: 'Refund executed once, idempotent', marksSelf: true }],
      Executed: [{ label: 'Hand to reconciler', next: 'Awaiting reconciliation', message: 'Handed to an independent reconciler', variant: 'secondary' }],
      'Awaiting reconciliation': [{ label: 'Reconcile', next: 'Reconciled', message: 'Reconciled against provider batch', blockedIf: 'self' }],
    },
    side: [
      {
        type: 'meters',
        title: 'Reconciliation match',
        hint: 'Today, sample figures',
        icon: Landmark,
        rows: [
          { label: 'PMS vs payments', value: 99, note: '99.2%' },
          { label: 'POS vs payments', value: 97, note: '97.4%', tone: 'warning' },
          { label: 'Folios settled', value: 91, note: '91%' },
        ],
      },
      {
        type: 'notes',
        title: 'Separation of duties',
        icon: LockKeyhole,
        rows: ['Request, approve, execute and reconcile are separate steps', 'No self-approval, even with manager rights', 'Approved amounts cannot change at execution'],
      },
    ],
  },

  security_responder: {
    sub: 'Restricted view. Emergencies reach you instantly and never wait on routine SLA timers.',
    listTitle: 'Alerts and incidents',
    listHint: 'Acknowledge, attend, resolve',
    listIcon: ShieldAlert,
    banner: { tone: 'danger', text: 'Emergency: panic alarm at the pool deck. Acknowledge now.' },
    kpis: [
      { label: 'Active alerts', value: '0', icon: Siren, live: 'open' },
      { label: 'Avg acknowledge', value: '38s', delta: '−6s', trend: 'down', good: true, icon: Timer },
      { label: 'Incidents (7 days)', value: '6', icon: ShieldAlert },
      { label: 'Patrols on duty', value: '4', icon: Users },
    ],
    transitions: {
      New: [{ label: 'Acknowledge', next: 'Acknowledged', message: 'Alert acknowledged' }],
      Acknowledged: [{ label: 'Arrived on scene', next: 'On scene', message: 'Arrival recorded' }],
      'On scene': [
        { label: 'Log and resolve', next: 'Resolved', message: 'Incident logged and resolved' },
        { label: 'Request backup', next: 'Backup requested', message: 'Backup requested', variant: 'danger' },
      ],
      'Backup requested': [{ label: 'Log and resolve', next: 'Resolved', message: 'Incident logged and resolved' }],
    },
    side: [
      {
        type: 'notes',
        title: 'Restricted access',
        hint: 'Isolation boundary',
        icon: LockKeyhole,
        rows: ['Incident details visible to security only', 'No folios or routine guest data', 'Evidence can be added, never deleted'],
      },
      {
        type: 'meters',
        title: 'Patrol coverage',
        icon: ShieldCheck,
        rows: [
          { label: 'Lobby and entrance', value: 100, note: 'Covered' },
          { label: 'Pool and spa', value: 60, note: 'Responding', tone: 'danger' },
          { label: 'Parking', value: 90, note: 'Covered' },
        ],
      },
    ],
  },

  executive_viewer: {
    sub: 'Property health at a glance, plus approvals that sit above manager limits.',
    listTitle: 'Awaiting your approval',
    listHint: 'Beyond-authority decisions',
    listIcon: Stamp,
    kpis: [
      { label: 'Pending approvals', value: '0', icon: Stamp, live: 'open' },
      { label: 'SLA compliance', value: '94.2%', delta: '+1.4%', trend: 'up', good: true, icon: ShieldCheck },
      { label: 'Guest satisfaction', value: '4.7', delta: '+0.1', trend: 'up', good: true, icon: Star },
      { label: 'Avg resolution', value: '14m', delta: '−2m', trend: 'down', good: true, icon: Timer },
    ],
    transitions: {
      'Needs approval': [
        { label: 'Approve', next: 'Approved', message: 'Approved by the GM' },
        { label: 'Decline', next: 'Declined', message: 'Declined by the GM', variant: 'danger' },
      ],
    },
    side: [
      {
        type: 'meters',
        title: 'SLA compliance by department',
        hint: 'Last 7 days, sample figures',
        icon: Gauge,
        rows: [
          { label: 'Front Desk', value: 98, note: '98%' },
          { label: 'Security', value: 99, note: '99%' },
          { label: 'Housekeeping', value: 96, note: '96%' },
          { label: 'F&B', value: 94, note: '94%' },
          { label: 'Spa', value: 91, note: '91%' },
          { label: 'Maintenance', value: 88, note: '88%', tone: 'warning' },
        ],
      },
      {
        type: 'notes',
        title: 'Authority boundaries',
        icon: Crown,
        rows: ['Approves compensation above $200', 'No platform administration by title alone', 'No raw payment credentials'],
      },
    ],
  },

  platform_admin: {
    sub: 'Access changes, QR mappings and integration health. Every change is written to the audit trail.',
    listTitle: 'Access requests',
    listHint: 'Approve or reject scoped changes',
    listIcon: KeyRound,
    kpis: [
      { label: 'Pending changes', value: '0', icon: KeyRound, live: 'open' },
      { label: 'Active staff', value: '128', icon: Users },
      { label: 'QR mappings', value: '118', icon: QrCode },
      { label: 'Integrations', value: '3 / 4', delta: '1 degraded', icon: Plug },
    ],
    transitions: {
      Pending: [
        { label: 'Approve', next: 'Applied', message: 'Access change applied and audited' },
        { label: 'Reject', next: 'Rejected', message: 'Access request rejected', variant: 'danger' },
      ],
    },
    side: [
      { type: 'integrations', title: 'Integration health', hint: 'Simulate outages', icon: Plug },
      { type: 'qr', title: 'Room QR mappings', hint: 'Open a guest portal link', icon: QrCode },
    ],
  },
};
