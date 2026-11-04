import {
  BadgeCheck,
  ClipboardCheck,
  ConciergeBell,
  Crown,
  Gauge,
  Globe,
  Radio,
  Settings2,
  ShieldAlert,
  Smartphone,
  Wallet,
} from 'lucide-react';
import type { QuickLink, RoleId, RoleMeta } from '@/types/demo';

/**
 * The nine approved profiles. Each gets its own hue pair (--a / --b) so every
 * role is recognisable at a glance across cards, rail chips and dashboards.
 */
export const roles: RoleMeta[] = [
  {
    id: 'task_fulfiller',
    slug: 'fulfiller',
    path: '/staff/fulfiller',
    name: 'Task Fulfiller',
    short: 'Fulfiller',
    tagline: 'Accept, work, claim and complete assigned tasks on the move.',
    scopes: ['Housekeeping & Maintenance', 'Floors 1–5', 'Day shift'],
    keywords: ['attendant', 'runner', 'technician', 'tasks', 'mobile', 'claim', 'blocker'],
    icon: ClipboardCheck,
    accent: '52 211 153',
    accent2: '16 185 129',
    surface: 'mobile',
  },
  {
    id: 'department_dispatcher_supervisor',
    slug: 'dispatcher-supervisor',
    path: '/staff/dispatcher-supervisor',
    name: 'Department Dispatcher / Supervisor',
    short: 'Dispatcher / Supervisor',
    tagline: 'Triage queues, assign work, inspect quality, manage handover and watch SLA clocks.',
    scopes: ['Operations', 'All floors', 'Day shift', 'Quality & Dispatch'],
    keywords: ['queue', 'assign', 'sla', 'inspect', 'inspection', 'reopen', 'handover', 'quality', 'workload'],
    icon: Radio,
    accent: '34 211 238',
    accent2: '99 102 241',
    surface: 'desktop',
  },
  {
    id: 'department_manager',
    slug: 'department-manager',
    path: '/staff/department-manager',
    name: 'Department Manager',
    short: 'Department Manager',
    tagline: 'Own escalations, VIP cases, service catalog, inspection directives and recovery.',
    scopes: ['Assigned department', 'Day shift', 'Escalate to General Manager'],
    keywords: ['escalation', 'vip', 'complaint', 'recovery', 'compensation', 'service catalog', 'directives'],
    icon: Gauge,
    accent: '167 139 250',
    accent2: '139 92 246',
    surface: 'desktop',
  },
  {
    id: 'front_desk_coordinator',
    slug: 'front-desk',
    path: '/staff/front-desk',
    name: 'Front Desk',
    short: 'Front Desk',
    tagline: 'Arrivals, room moves, request routing, checkout and guest cases in one view.',
    scopes: ['Front Office', 'Property-wide', 'Day shift'],
    keywords: ['check-in', 'checkout', 'arrival', 'room move', 'reservation', 'routing', 'pms', 'cases'],
    icon: ConciergeBell,
    accent: '244 114 182',
    accent2: '251 113 133',
    surface: 'desktop',
  },
  {
    id: 'financial_operator',
    slug: 'finance',
    path: '/staff/finance',
    name: 'Financial Operator',
    short: 'Finance',
    tagline: 'Execute approved adjustments, then reconcile every folio.',
    scopes: ['Finance', 'Masked cards', 'Day shift'],
    keywords: ['folio', 'refund', 'payment', 'reconcile', 'dispute', 'adjustment', 'billing'],
    icon: Wallet,
    accent: '190 242 100',
    accent2: '132 204 22',
    surface: 'desktop',
  },
  {
    id: 'security_responder',
    slug: 'security',
    path: '/staff/security',
    name: 'Security Responder',
    short: 'Security',
    tagline: 'Answer emergencies fast and log restricted evidence.',
    scopes: ['Security', 'Restricted view', 'Night shift'],
    keywords: ['alert', 'emergency', 'incident', 'evidence', 'panic', 'safety'],
    icon: ShieldAlert,
    accent: '248 113 113',
    accent2: '239 68 68',
    surface: 'mobile',
  },
  {
    id: 'general_manager',
    slug: 'general-manager',
    path: '/staff/general-manager',
    name: 'General Manager',
    short: 'General Manager',
    tagline: 'Property KPIs, strategic oversight and approvals beyond manager limits.',
    scopes: ['GM office', 'Property-wide', 'Read + approve up to ₹2,00,000'],
    keywords: ['gm', 'kpi', 'analytics', 'approval', 'operations head', 'satisfaction', 'directives'],
    icon: Crown,
    accent: '251 146 60',
    accent2: '245 158 11',
    surface: 'desktop',
  },
  {
    id: 'platform_admin',
    slug: 'admin',
    path: '/staff/admin',
    name: 'Platform Administrator',
    short: 'Admin',
    tagline: 'Accounts, scopes, QR mappings and integration health.',
    scopes: ['Platform', 'Audit trail', 'No finance'],
    keywords: ['accounts', 'access', 'scopes', 'qr', 'integrations', 'audit', 'reset'],
    icon: Settings2,
    accent: '203 213 225',
    accent2: '148 163 184',
    surface: 'desktop',
  },
];

const primaryRoleById = Object.fromEntries(roles.map((r) => [r.id, r])) as Record<RoleId, RoleMeta>;

export const roleById: Record<RoleId, RoleMeta> = {
  ...primaryRoleById,
  // Backwards compatibility mappings for merged and renamed roles
  department_dispatcher: primaryRoleById['department_dispatcher_supervisor'],
  department_supervisor: primaryRoleById['department_dispatcher_supervisor'],
  executive_viewer: primaryRoleById['general_manager'],
};

export function roleBySlug(slug: string): RoleMeta | undefined {
  const direct = roles.find((r) => r.slug === slug);
  if (direct) return direct;
  // Aliases for backwards compatibility with previous routes
  if (slug === 'dispatcher' || slug === 'supervisor') {
    return roleById['department_dispatcher_supervisor'];
  }
  if (slug === 'executive') {
    return roleById['general_manager'];
  }
  if (slug === 'duty-manager') {
    return roleById['department_manager'];
  }
  return undefined;
}

export const HOME_ACCENT = { accent: '232 207 154', accent2: '201 162 90' };

export const quickLinks: QuickLink[] = [
  {
    id: 'guest',
    name: 'Guest Portal',
    short: 'Guest',
    href: '/guest/portal?room=402&token=demo-token',
    icon: Smartphone,
    accent: '94 234 212',
    accent2: '129 140 248',
    keywords: 'guest portal qr room service in-room mobile',
  },
  {
    id: 'site',
    name: 'Public Hotel Website',
    short: 'Website',
    href: '/',
    icon: Globe,
    accent: '244 215 160',
    accent2: '236 160 140',
    keywords: 'public hotel website booking rooms dining spa',
  },
];

export const quickLinkById = Object.fromEntries(quickLinks.map((l) => [l.id, l])) as Record<
  QuickLink['id'],
  QuickLink
>;
