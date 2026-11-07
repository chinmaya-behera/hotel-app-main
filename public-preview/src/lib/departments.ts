import {
  BedDouble,
  Bell,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Coffee,
  Cpu,
  Droplets,
  Flower2,
  Gauge,
  HeartPulse,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Wind,
  Wine,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface DepartmentActivity {
  id: string;
  name: string;
  description: string;
  defaultTargetTime: string;
  icon: LucideIcon;
}

export interface DepartmentMeta {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  accent2: string;
  primaryFulfillerId: string;
  primaryFulfillerName: string;
  primarySupervisorId: string;
  primarySupervisorName: string;
  operatingFloors: string;
  activities: DepartmentActivity[];
}

export const DEPARTMENTS: Record<string, DepartmentMeta> = {
  housekeeping: {
    id: 'housekeeping',
    slug: 'housekeeping',
    name: 'Housekeeping',
    tagline: 'Luxury room cleanliness, turnover readiness & guest comfort items.',
    description: 'Manages complete guest room sanitation, linen refreshes, turnover audits, and prompt amenity deliveries across all guest floors.',
    icon: Sparkles,
    accent: '52 211 153', // emerald
    accent2: '16 185 129',
    primaryFulfillerId: 'EMP-0103',
    primaryFulfillerName: 'Vikram Singh',
    primarySupervisorId: 'EMP-0105',
    primarySupervisorName: 'Meera Nambiar',
    operatingFloors: 'Floors 1–5',
    activities: [
      {
        id: 'room-cleaning',
        name: 'Room cleaning',
        description: 'Daily stayover and checkout deep sanitation per 5-star brand hygiene standards.',
        defaultTargetTime: '45 mins',
        icon: Sparkles,
      },
      {
        id: 'room-inspection',
        name: 'Room inspection',
        description: 'Post-cleaning turnover quality inspection and 5-point audit checklist release.',
        defaultTargetTime: '20 mins',
        icon: ClipboardCheck,
      },
      {
        id: 'bed-preparation',
        name: 'Bed preparation',
        description: 'Luxury linen changes, hypoallergenic pillow setups, and evening turndown.',
        defaultTargetTime: '15 mins',
        icon: BedDouble,
      },
      {
        id: 'towel-linen-replacement',
        name: 'Towel and linen replacement',
        description: 'Replenishing Egyptian cotton bath towels, bathrobes, and luxury face cloths.',
        defaultTargetTime: '15 mins',
        icon: RefreshCw,
      },
      {
        id: 'guest-requested-services',
        name: 'Guest-requested services',
        description: 'Fulfilling on-demand guest amenity kits, slippers, hangers, and dental kits.',
        defaultTargetTime: '20 mins',
        icon: Bell,
      },
      {
        id: 'room-maintenance-coordination',
        name: 'Room maintenance coordination',
        description: 'Logging fixture defects, reporting shower leaks, and coordinating with engineering.',
        defaultTargetTime: '30 mins',
        icon: Wrench,
      },
    ],
  },
  'spa-wellness': {
    id: 'spa-wellness',
    slug: 'spa-wellness',
    name: 'Spa & Wellness',
    tagline: 'Ayurvedic treatments, relaxation suites & holistic guest wellness.',
    description: 'Coordinates appointment scheduling, treatment suite sanitization, holistic therapy assignments, and wellness equipment safety checks.',
    icon: HeartPulse,
    accent: '167 139 250', // violet
    accent2: '139 92 246',
    primaryFulfillerId: 'EMP-0110',
    primaryFulfillerName: 'Elena Brandt',
    primarySupervisorId: 'EMP-0117',
    primarySupervisorName: 'Ananya Rao',
    operatingFloors: 'Level 2 & Wellness Wing',
    activities: [
      {
        id: 'spa-appointment-management',
        name: 'Spa appointment management',
        description: 'Confirming guest reservations, therapist calendars, and VIP treatment schedules.',
        defaultTargetTime: '30 mins',
        icon: Flower2,
      },
      {
        id: 'guest-wellness-requests',
        name: 'Guest wellness requests',
        description: 'In-room aromatherapy diffusers, meditation mats, and customized bath salts.',
        defaultTargetTime: '20 mins',
        icon: HeartPulse,
      },
      {
        id: 'treatment-room-preparation',
        name: 'Treatment room preparation',
        description: 'Aroma warming, heated towels, essential oil blending, and ambient lighting.',
        defaultTargetTime: '25 mins',
        icon: Sparkles,
      },
      {
        id: 'equipment-facility-checks',
        name: 'Equipment and facility checks',
        description: 'Sauna temperature calibration, steam room water levels, and hydrotherapy jets.',
        defaultTargetTime: '40 mins',
        icon: Gauge,
      },
      {
        id: 'therapist-task-assignments',
        name: 'Therapist task assignments',
        description: 'Assigning qualified practitioners based on certified modalities and guest profile.',
        defaultTargetTime: '60 mins',
        icon: Users,
      },
    ],
  },
  'maintenance-engineering': {
    id: 'maintenance-engineering',
    slug: 'maintenance-engineering',
    name: 'Maintenance & Engineering',
    tagline: 'Property infrastructure, HVAC climate control & preventative repairs.',
    description: 'Ensures continuous operation of hotel utilities, rapid electrical repairs, plumbing resolution, and structural preventative audits.',
    icon: Wrench,
    accent: '251 146 60', // amber / orange
    accent2: '245 158 11',
    primaryFulfillerId: 'EMP-0112',
    primaryFulfillerName: 'Wayne Chen',
    primarySupervisorId: 'EMP-0104',
    primarySupervisorName: 'Arjun Mehta',
    operatingFloors: 'All Floors & Plant Rooms',
    activities: [
      {
        id: 'electrical-repairs',
        name: 'Electrical repairs',
        description: 'Circuit diagnosis, balcony lighting, luxury switch panels, and power socket fixes.',
        defaultTargetTime: '30 mins',
        icon: Zap,
      },
      {
        id: 'plumbing-issues',
        name: 'Plumbing issues',
        description: 'Shower drain clearing, leak remediation, fixture water pressure adjustments.',
        defaultTargetTime: '35 mins',
        icon: Droplets,
      },
      {
        id: 'ac-ventilation-maintenance',
        name: 'AC and ventilation maintenance',
        description: 'Thermostat calibration, airflow damper checks, and HVAC filter replacements.',
        defaultTargetTime: '40 mins',
        icon: Wind,
      },
      {
        id: 'equipment-inspections',
        name: 'Equipment inspections',
        description: 'Elevator sensors, emergency generators, boiler gauges, and kitchen pumps.',
        defaultTargetTime: '45 mins',
        icon: Cpu,
      },
      {
        id: 'general-property-maintenance',
        name: 'General property maintenance',
        description: 'Carpentry, architectural stone upkeep, door alignment, and soundproofing.',
        defaultTargetTime: '30 mins',
        icon: Wrench,
      },
    ],
  },
  'food-beverages': {
    id: 'food-beverages',
    slug: 'food-beverages',
    name: 'Food & Beverages',
    tagline: 'In-room dining service, banquet staging & kitchen culinary hygiene.',
    description: 'Oversees luxury restaurant table arrangements, in-room dining trolley dispatches, culinary expediting, and strict HACCP hygiene logs.',
    icon: Utensils,
    accent: '244 114 182', // rose / pink
    accent2: '225 29 72',
    primaryFulfillerId: 'EMP-0113',
    primaryFulfillerName: 'Kabir Sen',
    primarySupervisorId: 'EMP-0116',
    primarySupervisorName: 'Chef David Keller',
    operatingFloors: 'Outlets, Kitchen & Floors 1–5',
    activities: [
      {
        id: 'restaurant-service-tasks',
        name: 'Restaurant service tasks',
        description: 'Terrace dining readiness, guest table turns, and sommelier station replenishment.',
        defaultTargetTime: '25 mins',
        icon: Wine,
      },
      {
        id: 'room-service-orders',
        name: 'Room service orders',
        description: 'Hot-tray cloche delivery, champagne service, and guest suite clearance.',
        defaultTargetTime: '20 mins',
        icon: Coffee,
      },
      {
        id: 'food-preparation-coordination',
        name: 'Food preparation coordination',
        description: 'Expediting banquet plating, pastry garnish setups, and dietary allergy prep.',
        defaultTargetTime: '35 mins',
        icon: ChefHat,
      },
      {
        id: 'table-setup',
        name: 'Table setup',
        description: 'Silverware polishing, fine crystal arrangement, and VIP floral table centerpieces.',
        defaultTargetTime: '15 mins',
        icon: Utensils,
      },
      {
        id: 'kitchen-hygiene-inventory-checks',
        name: 'Kitchen hygiene and inventory checks',
        description: 'Cold room temperature audits, food safety checklists, and linen napkin counts.',
        defaultTargetTime: '30 mins',
        icon: ShieldCheck,
      },
    ],
  },
};

export const departmentList = Object.values(DEPARTMENTS);

export function getDepartmentBySlug(slug: string): DepartmentMeta | undefined {
  const norm = slug.toLowerCase().replace(/_/g, '-');
  if (norm === 'housekeeping' || norm === 'hk') return DEPARTMENTS['housekeeping'];
  if (norm === 'spa-wellness' || norm === 'spa' || norm === 'wellness') return DEPARTMENTS['spa-wellness'];
  if (norm === 'maintenance-engineering' || norm === 'maintenance' || norm === 'engineering' || norm === 'tech')
    return DEPARTMENTS['maintenance-engineering'];
  if (norm === 'food-beverages' || norm === 'food-beverage' || norm === 'f-b' || norm === 'dining' || norm === 'fb')
    return DEPARTMENTS['food-beverages'];
  return DEPARTMENTS[norm];
}

export function matchDepartmentName(deptString?: string): string {
  if (!deptString) return 'Housekeeping';
  const lower = deptString.toLowerCase();
  if (lower.includes('spa') || lower.includes('well')) return 'Spa & Wellness';
  if (lower.includes('maint') || lower.includes('eng') || lower.includes('tech')) return 'Maintenance & Engineering';
  if (lower.includes('food') || lower.includes('bev') || lower.includes('din') || lower.includes('room service'))
    return 'Food & Beverages';
  return 'Housekeeping';
}

