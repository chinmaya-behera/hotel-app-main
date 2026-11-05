import type { WorkItem } from '@/types/demo';

export type FulfillerDeptKey = 'housekeeping' | 'wellness' | 'maintenance' | 'fnb';

export interface FulfillerProfile {
  deptKey: FulfillerDeptKey;
  departmentName: string;
  employeeName: string; // e.g. "Vikram Singh"
  employeeId: string; // e.g. "EMP-0103"
  roleTitle: string; // e.g. "Housekeeping Attendant"
  assignedWork: string; // e.g. "Room cleaning, linen replacement"
  assignedWorkDescription: string;
  assignedWorkTags: string[];
  avatarInitials: string; // e.g. "VS"
  colorGradient: string; // "from-emerald-400 to-teal-500"
  badgeTone: string; // "emerald"
  supervisorName: string; // "Meera Nambiar"
  supervisorCode: string; // "EMP-0105"
  zone: string; // "Floors 1–5 · Level 4 Primary"
  email: string;
}

export const FULFILLER_PROFILES: Record<FulfillerDeptKey, FulfillerProfile> = {
  housekeeping: {
    deptKey: 'housekeeping',
    departmentName: 'Housekeeping',
    employeeName: 'Vikram Singh',
    employeeId: 'EMP-0103',
    roleTitle: 'Housekeeping Attendant',
    assignedWork: 'Room cleaning, linen replacement',
    assignedWorkDescription: 'Room cleaning, linen replacement, turnover readiness & guest comfort items.',
    assignedWorkTags: ['Room cleaning', 'Linen replacement', 'Turnover readiness', 'Bed preparation', 'Minibar restock'],
    avatarInitials: 'VS',
    colorGradient: 'from-emerald-400 to-teal-500',
    badgeTone: 'emerald',
    supervisorName: 'Meera Nambiar',
    supervisorCode: 'EMP-0105',
    zone: 'Floors 1–5 · Level 4 Primary',
    email: 'fulfiller@thegrandadp.com',
  },
  wellness: {
    deptKey: 'wellness',
    departmentName: 'Spa & Wellness',
    employeeName: 'Elena Brandt',
    employeeId: 'EMP-0110',
    roleTitle: 'Spa Therapist & Wellness Attendant',
    assignedWork: 'Spa appointments, room preparation',
    assignedWorkDescription: 'Spa appointment management, relaxation suites & holistic guest wellness.',
    assignedWorkTags: ['Spa appointments', 'Room preparation', 'Treatment rooms', 'Ayurvedic treatments', 'Aromatherapy setup'],
    avatarInitials: 'EB',
    colorGradient: 'from-purple-400 to-indigo-500',
    badgeTone: 'purple',
    supervisorName: 'Ananya Rao',
    supervisorCode: 'EMP-0106',
    zone: 'Level 2 & Wellness Wing',
    email: 'wellness.fulfiller@thegrandadp.com',
  },
  maintenance: {
    deptKey: 'maintenance',
    departmentName: 'Maintenance & Engineering',
    employeeName: 'Wei Chen',
    employeeId: 'EMP-0112',
    roleTitle: 'Maintenance Technician',
    assignedWork: 'Electrical, plumbing, AC repairs',
    assignedWorkDescription: 'Property infrastructure, HVAC climate control & preventative repairs.',
    assignedWorkTags: ['Electrical repairs', 'Plumbing issues', 'AC & ventilation', 'Equipment inspections', 'Thermostat calibration'],
    avatarInitials: 'WC',
    colorGradient: 'from-amber-400 to-orange-500',
    badgeTone: 'amber',
    supervisorName: 'Arjun Mehta',
    supervisorCode: 'EMP-0104',
    zone: 'All Floors & Plant Rooms',
    email: 'engineering.fulfiller@thegrandadp.com',
  },
  fnb: {
    deptKey: 'fnb',
    departmentName: 'Food & Beverages',
    employeeName: 'Kavita Sen',
    employeeId: 'EMP-0113',
    roleTitle: 'In-Room Dining Runner / Service Attendant',
    assignedWork: 'Restaurant service, room service',
    assignedWorkDescription: 'In-room dining service, banquet staging & kitchen culinary hygiene.',
    assignedWorkTags: ['Restaurant service', 'Room service delivery', 'Table setup', 'Food preparation', 'Beverage service'],
    avatarInitials: 'KS',
    colorGradient: 'from-rose-400 to-pink-500',
    badgeTone: 'rose',
    supervisorName: 'David Keller',
    supervisorCode: 'EMP-0108',
    zone: 'Outlets, Kitchen & Floors 1–5',
    email: 'dining.fulfiller@thegrandadp.com',
  },
};

export function taskMatchesFulfillerDept(t: WorkItem, deptKey: FulfillerDeptKey): boolean {
  const dept = (t.department || '').toLowerCase();
  const cat = (t.category || '').toLowerCase();
  const ref = (t.ref || '').toLowerCase();
  const meta = (t.meta || '').toLowerCase();
  const title = (t.title || '').toLowerCase();

  if (deptKey === 'housekeeping') {
    return (
      dept.includes('housekeeping') ||
      cat === 'housekeeping' ||
      ref.startsWith('hk') ||
      meta.includes('housekeeping') ||
      title.includes('towel') ||
      title.includes('linen') ||
      title.includes('clean') ||
      title.includes('turndown') ||
      title.includes('duvet') ||
      title.includes('pillow') ||
      title.includes('amenity') ||
      title.includes('minibar')
    );
  }
  if (deptKey === 'wellness') {
    return (
      dept.includes('wellness') ||
      dept.includes('spa') ||
      cat === 'spa' ||
      cat === 'wellness' ||
      ref.startsWith('well') ||
      meta.includes('wellness') ||
      meta.includes('spa') ||
      title.includes('spa') ||
      title.includes('massage') ||
      title.includes('aromatherapy') ||
      title.includes('treatment') ||
      title.includes('ayurvedic') ||
      title.includes('whirlpool') ||
      title.includes('sauna') ||
      title.includes('scrub') ||
      title.includes('yoga')
    );
  }
  if (deptKey === 'maintenance') {
    return (
      dept.includes('maintenance') ||
      dept.includes('engineering') ||
      cat === 'maintenance' ||
      cat === 'engineering' ||
      ref.startsWith('mx') ||
      meta.includes('maintenance') ||
      title.includes('ac ') ||
      title.includes('cooling') ||
      title.includes('plumbing') ||
      title.includes('electrical') ||
      title.includes('repair') ||
      title.includes('leak') ||
      title.includes('thermostat') ||
      title.includes('beacon') ||
      title.includes('shower') ||
      title.includes('lighting') ||
      title.includes('lock') ||
      title.includes('ventilation')
    );
  }
  if (deptKey === 'fnb') {
    return (
      dept.includes('food') ||
      dept.includes('beverage') ||
      dept.includes('dining') ||
      cat === 'room_service' ||
      cat === 'dining' ||
      cat === 'fnb' ||
      ref.startsWith('rs') ||
      meta.includes('f&b') ||
      meta.includes('runner') ||
      meta.includes('dining') ||
      title.includes('tray') ||
      title.includes('breakfast') ||
      title.includes('dinner') ||
      title.includes('champagne') ||
      title.includes('tea') ||
      title.includes('wine') ||
      title.includes('order') ||
      title.includes('platter') ||
      title.includes('sandwich')
    );
  }
  return false;
}

export function taskMatchesFulfillerAssignee(t: WorkItem, profile: FulfillerProfile): boolean {
  if (!t.assignee && !t.assigneeId) return true;
  const a = (t.assignee || '').toLowerCase();
  const aid = (t.assigneeId || '').toLowerCase();
  const eName = profile.employeeName.toLowerCase();
  const eId = profile.employeeId.toLowerCase();

  return (
    a.includes(eName) ||
    aid === eId ||
    (!t.assignee && !t.assigneeId)
  );
}
