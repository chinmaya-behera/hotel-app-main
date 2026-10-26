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
import type { QuickLink, RoleId, RoleMeta } from '../types/demo.ts';

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
    tagline: 'Accept, work and complete assigned tasks on the move.',
    scopes: ['Housekeeping', 'Floors 1–5', 'Day shift'],
    keywords: ['attendant', 'runner', 'technician', 'tasks', 'mobile', 'blocker'],
    icon: ClipboardCheck,
    accent: '114 121 96',
    accent2: '158 145 119',
    surface: 'mobile',
  },
  {
    id: 'department_dispatcher',
    slug: 'dispatcher',
    path: '/staff/dispatcher',
    name: 'Department Dispatcher',
    short: 'Dispatcher',
    tagline: 'Triage the queue, assign eligible staff and watch SLA clocks.',
    scopes: ['Maintenance', 'All floors', 'Day shift'],
    keywords: ['queue', 'assign', 'sla', 'overdue', 'duplicate', 'workload'],
    icon: Radio,
    accent: '114 121 96',
    accent2: '158 145 119',
    surface: 'desktop',
  },
  {
    id: 'department_supervisor',
    slug: 'supervisor',
    path: '/staff/supervisor',
    name: 'Department Supervisor',
    short: 'Supervisor',
    tagline: 'Inspect finished work, reopen with a reason and run handover.',
    scopes: ['Housekeeping', 'Floors 1–5', 'Day shift'],
    keywords: ['inspect', 'inspection', 'reopen', 'handover', 'quality', 'backup'],
    icon: BadgeCheck,
    accent: '114 121 96',
    accent2: '158 145 119',
    surface: 'desktop',
  },
  {
    id: 'department_manager',
    slug: 'duty-manager',
    path: '/staff/duty-manager',
    name: 'Department Manager / Duty Manager',
    short: 'Duty Manager',
    tagline: 'Own escalations, VIP cases and service-recovery decisions.',
    scopes: ['Property-wide', 'Duty shift', 'Up to ₹16,000'],
    keywords: ['escalation', 'vip', 'complaint', 'recovery', 'compensation', 'credit'],
    icon: Gauge,
    accent: '114 121 96',
    accent2: '158 145 119',
    surface: 'desktop',
  },
  {
    id: 'front_desk_coordinator',
    slug: 'front-desk',
    path: '/staff/front-desk',
    name: 'Front Desk Coordinator',
    short: 'Front Desk',
    tagline: 'Arrivals, room moves, checkout and guest cases in one view.',
    scopes: ['Front Office', 'Property-wide', 'Day shift'],
    keywords: ['check-in', 'checkout', 'arrival', 'room move', 'reservation', 'pms', 'cases'],
    icon: ConciergeBell,
    accent: '114 121 96',
    accent2: '158 145 119',
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
    accent: '114 121 96',
    accent2: '158 145 119',
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
    accent: '114 121 96',
    accent2: '158 145 119',
    surface: 'mobile',
  },
  {
    id: 'executive_viewer',
    slug: 'executive',
    path: '/staff/executive',
    name: 'Executive Viewer / Approver',
    short: 'Executive',
    tagline: 'Property KPIs and approvals beyond manager limits.',
    scopes: ['GM office', 'Property-wide', 'Read + approve'],
    keywords: ['gm', 'kpi', 'analytics', 'approval', 'operations head', 'satisfaction'],
    icon: Crown,
    accent: '114 121 96',
    accent2: '158 145 119',
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
    accent: '114 121 96',
    accent2: '158 145 119',
    surface: 'desktop',
  },
];

export const roleById = Object.fromEntries(roles.map((r) => [r.id, r])) as Record<RoleId, RoleMeta>;

export function roleBySlug(slug: string): RoleMeta | undefined {
  return roles.find((r) => r.slug === slug);
}

export const HOME_ACCENT = { accent: '114 121 96', accent2: '158 145 119' };

export const quickLinks: QuickLink[] = [
  {
    id: 'guest',
    name: 'Guest Portal',
    short: 'Guest',
    href: '/guest/portal?room=402&token=demo-token',
    icon: Smartphone,
    accent: '114 121 96',
    accent2: '158 145 119',
    keywords: 'guest portal qr room service in-room mobile',
  },
  {
    id: 'site',
    name: 'Public Hotel Website',
    short: 'Website',
    href: '/',
    icon: Globe,
    accent: '114 121 96',
    accent2: '158 145 119',
    keywords: 'public hotel website booking rooms dining spa',
  },
];

export const quickLinkById = Object.fromEntries(quickLinks.map((l) => [l.id, l])) as Record<
  QuickLink['id'],
  QuickLink
>;
