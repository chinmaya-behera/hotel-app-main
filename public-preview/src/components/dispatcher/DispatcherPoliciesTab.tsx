'use client';

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
  BookOpen,
  Clock,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
  Info,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { DispatcherDepartment, DepartmentServicePolicy } from '@/types/demo';

export interface DepartmentAuthorityProfile {
  department: DispatcherDepartment;
  roleName: string;
  financialLimitDisplay: string;
  operationalAuthority: string[];
  negativeBoundaries: string[];
  escalationTarget: string;
  escalationCondition: string;
}

export interface DetailedPolicyItem {
  id: string;
  title: string;
  category: 'Service Standard' | 'Operating Procedure' | 'Quality & Safety' | 'Guest Recovery' | 'Emergency';
  scope: string;
  policyOwner: string;
  summary: string;
  rules: string[];
  authorityLimit: string;
  escalationTarget: string;
  effectiveDate: string;
  lastUpdated: string;
}

export const DEPARTMENT_AUTHORITY_PROFILES: Record<DispatcherDepartment, DepartmentAuthorityProfile> = {
  Housekeeping: {
    department: 'Housekeeping',
    roleName: 'Housekeeping Dispatcher / Supervisor',
    financialLimitDisplay: '₹0 (Operational management only)',
    operationalAuthority: [
      'Triage incoming guest housekeeping requests and manual/auto-dispatch to field room attendants.',
      'Conduct mandatory 5-category room quality inspections (Bedding, Bathroom, Amenities, Climate/Surfaces, Safety); certify clean for scores >= 85%.',
      'Reopen failed room inspections with mandatory deficiency photographic notes and attendant rework directives.',
      'Review and approve or reject fulfiller task reassignment requests across Floors 1-5.',
      'Rebalance unstarted room turnover tasks across on-duty attendants to meet check-in deadlines.',
      'Log, verify, and transmit inter-shift handover briefings between Day and Evening supervisors.',
      'Authorize DND bypass verification with Security witness after 14:00 guest welfare protocol.',
    ],
    negativeBoundaries: [
      'Must NOT authorize financial compensation, guest credits, or billing refunds (strictly escalate to Duty Manager).',
      'Must NOT modify guest room assignments, check-in, or checkout in Front Desk PMS.',
      'Must NOT override Out of Order (OOO) room blocks without Department Manager / GM approval.',
      'Must NOT certify rooms as clean without conducting physical or photographic proof inspection.',
      'Must NOT access guest credit card numbers, payment tokens, or folio billing history.',
    ],
    escalationTarget: 'Duty Manager / Department Manager (Marcus Vance)',
    escalationCondition: 'SLA breaches (MTTR >30m), structural room damage, biohazard incidents, or VIP arrival delays.',
  },
  'Maintenance & Engineering': {
    department: 'Maintenance & Engineering',
    roleName: 'Maintenance & Engineering Dispatcher / Supervisor',
    financialLimitDisplay: '₹0 (Operational management only)',
    operationalAuthority: [
      'Triage and dispatch reactive work orders (HVAC, plumbing, electrical, BMS telemetry, door locks, and AV).',
      'Supervise and sign off on preventive maintenance (PM) cycles and chiller plant water quality testing.',
      'Conduct technical readiness inspections on guest room plant equipment (thermostats, shower pressure, GFCI outlets).',
      'Authorize emergency isolated utility shut-offs (water risers, electrical sub-panels) during active leaks or electrical shorts.',
      'Coordinate with Housekeeping on out-of-order room repairs and release rooms back for post-repair turnover.',
      'Monitor dual technical SLA countdown timers: Emergency defects (MTTR <= 20m), Routine defects (MTTR <= 45m).',
      'Audit BMS door lock telemetry and dispatch urgent battery swaps for locks reporting <12% voltage.',
    ],
    negativeBoundaries: [
      'Must NOT perform main high-voltage utility grid switching or generator bypass without Chief Engineer supervision.',
      'Must NOT authorize Capex equipment replacements or vendor purchase orders without Department Manager approval.',
      'Must NOT declare a room Out of Order (OOO) for >24 hours without Chief Engineer and Duty Manager sign-off.',
      'Must NOT bypass fire alarm suppression interlocks without municipal hot-work permit and GM sign-off.',
      'Must NOT authorize financial rebates or guest compensation for equipment outages (escalate to Duty Manager).',
    ],
    escalationTarget: 'Chief Engineer & Duty Manager (Marcus Vance)',
    escalationCondition: 'High-voltage transformer trips, main chiller loop failures, structural pipe bursts, or unresolved guest AC defects.',
  },
  'Food & Beverages': {
    department: 'Food & Beverages',
    roleName: 'Food & Beverages Dispatcher / Supervisor',
    financialLimitDisplay: '₹0 (Operational management only)',
    operationalAuthority: [
      'Triage and dispatch in-room dining orders, VIP welcome amenity setups, minibar audits, and corridor clearances.',
      'Enforce kitchen-to-room delivery SLA thresholds: Express orders <= 20m, Full course dinners <= 35m.',
      'Verify culinary presentation, temperature integrity (hot boxes >= 65C, cold desserts <= 4C), and allergen labels before runner dispatch.',
      'Approve complimentary non-alcoholic dish re-fires or alternative dish selections for delayed or unsatisfactory orders.',
      'Coordinate hourly hallway sweeps to ensure used room service trays are cleared within 15 minutes of notification.',
      'Audit minibar sensor telemetry and verify seal discrepancies against guest room departure profiles.',
    ],
    negativeBoundaries: [
      'Must NOT authorize guest folio meal refunds, bill cancellations, or alcohol comps without Duty Manager sign-off.',
      'Must NOT alter point-of-sale (POS) menu pricing, tax percentages, or automatic service charges.',
      'Must NOT modify standardized allergen declarations or kitchen allergen recipe cards.',
      'Must NOT serve alcoholic beverages to minors or visibly intoxicated guests under any circumstances.',
      'Must NOT dispatch food items prepared outside certified HACCP sanitary food holding temperature limits.',
    ],
    escalationTarget: 'F&B Director & Duty Manager (Marcus Vance)',
    escalationCondition: 'Severe food allergen breaches, foreign object reports, major kitchen queue delays, or liquor license disputes.',
  },
  Wellness: {
    department: 'Wellness',
    roleName: 'Wellness & Spa Dispatcher / Supervisor',
    financialLimitDisplay: '₹0 (Operational management only)',
    operationalAuthority: [
      'Schedule, dispatch, and balance therapist appointments across spa treatment suites, hydrotherapy, and beach yoga pavilions.',
      'Conduct pre-treatment health intake audits (medical health questionnaires, contraindications, essential oil allergies).',
      'Inspect treatment rooms and wellness facilities (steam room, Finnish sauna, vitality pool) for water chemistry and hygiene standards.',
      'Approve therapist reassignments in the event of guest preferences, illness, or extended service sessions.',
      'Authorize complimentary extension of relaxation lounge time or herbal infusion amenities for minor scheduling delays.',
      'Enforce strict 20-minute mandatory turnover and ozone air purification between consecutive guest therapies.',
    ],
    negativeBoundaries: [
      'Must NOT administer treatments to guests with unverified medical conditions (e.g. high-risk pregnancy, recent cardiac surgery) without medical clearance.',
      'Must NOT authorize cash refunds or package cancellations without Spa Director / Duty Manager approval.',
      'Must NOT modify spa treatment menu tariffs, package pricing, or retail product inventory write-offs.',
      'Must NOT operate steam room, sauna, or hydrotherapy pools outside certified water pH and temperature safety limits.',
      'Must NOT allow any unannounced staff entry into occupied private therapy suites.',
    ],
    escalationTarget: 'Spa Director & Duty Manager (Marcus Vance)',
    escalationCondition: 'Guest acute medical emergencies, thermal pool chemical imbalances, therapist ethical disputes, or package cancellations.',
  },
};

export const DEPARTMENT_DETAILED_POLICIES: Record<DispatcherDepartment, DetailedPolicyItem[]> = {
  Housekeeping: [
    {
      id: 'hk-pol-1',
      title: 'Standard Room Turnover, Inspection & Release SLA',
      category: 'Service Standard',
      scope: 'Floors 1-5 (Guest Rooms & Luxury Suites)',
      policyOwner: 'Meera Nambiar (Executive Housekeeper)',
      summary: 'Departure room turnover must be completed within 40 minutes for standard rooms and 60 minutes for suites, passing mandatory 5-category inspection before release.',
      rules: [
        'Departure room turnover must be executed within 40 minutes (standard rooms) and 60 minutes (executive suites).',
        'Attendants must upload clear photographic proof of work (bedding, bathroom, surfaces) before requesting inspection.',
        'Supervisor conducts 5-category checklist inspection (Bedding, Bathroom, Amenities, Climate/Surfaces, Safety).',
        'Rooms scoring >= 85% are certified inspected and released to Front Desk as clean and ready.',
        'Rooms scoring < 85% are reopened with mandatory deficiency notes and returned to attendant for immediate rework.',
      ],
      authorityLimit: 'Supervisor quality sign-off required for room release',
      escalationTarget: 'Escalate to Duty Manager if turnover delays exceed 45 minutes past scheduled VIP arrival.',
      effectiveDate: '2026-06-01',
      lastUpdated: '2026-10-25',
    },
    {
      id: 'hk-pol-2',
      title: 'Do Not Disturb (DND) & 14:00 Guest Welfare Protocol',
      category: 'Operating Procedure',
      scope: 'All Occupied Guest Rooms Property-Wide',
      policyOwner: 'Meera Nambiar (Executive Housekeeper)',
      summary: 'Active DND lights must be strictly respected. If DND remains active past 14:00, a structured welfare check with Security witness is mandatory.',
      rules: [
        'Active DND status must be honored by all staff; no knocking, telephone ringing, or door opening is permitted by field attendants.',
        'If DND remains active past 14:00, supervisor contacts Front Desk coordinator to attempt telephone welfare verification.',
        'If guest is unreachable after two calls, supervisor and security supervisor conduct a joint quiet knock and verification entry.',
        'All DND bypass actions are permanently logged in the property security audit ledger.',
      ],
      authorityLimit: 'Requires Security Supervisor co-signature for room entry',
      escalationTarget: 'Escalate to Duty Manager and Security Chief immediately if guest is non-responsive during welfare check.',
      effectiveDate: '2026-07-01',
      lastUpdated: '2026-10-28',
    },
    {
      id: 'hk-pol-3',
      title: 'VIP Evening Turndown & Aromatherapy Mist Standard',
      category: 'Quality & Safety',
      scope: 'VIP Stays, Suites & Requested Turndown Rooms',
      policyOwner: 'Pooja Nair (Evening HK Supervisor)',
      summary: 'Evening turndown conducted between 18:00 and 20:30 with slippers placed beside bed, blackout drapes drawn, ambient lighting, and signature aroma mist.',
      rules: [
        'Turndown window is strictly 18:00 to 20:30; slippers positioned at bedside and blackout curtains fully drawn.',
        'Bedside water carafes refreshed with chilled Himalayan water and evening artisan chocolate placed on pillows.',
        'Signature organic lavender or lemongrass aroma room mist sprayed upon guest pre-approval.',
        'Used bathroom towels replaced and bath mats refreshed.',
      ],
      authorityLimit: 'Supervisor evening audit',
      escalationTarget: 'Escalate to Guest Relations if guest requests custom hypoallergenic bedding or feather-free duvets.',
      effectiveDate: '2026-08-15',
      lastUpdated: '2026-10-20',
    },
    {
      id: 'hk-pol-4',
      title: 'Lost & Found Custody, Tagging & Secure Vault Protocol',
      category: 'Operating Procedure',
      scope: 'All Vacated Guest Rooms & Corridors',
      policyOwner: 'Meera Nambiar (Executive Housekeeper)',
      summary: 'Any item left behind in a vacated room must be photographed, tagged, sealed with a security serial number, and logged within 30 minutes.',
      rules: [
        'Any item found in vacated rooms must be photographed in place before touching or moving.',
        'Item placed in transparent security bag and sealed with tamper-evident serial sticker within 30 minutes.',
        'High-value items (cash, jewelry, electronics, passports) transferred directly into the Duty Manager safe.',
        'Lost & Found log synced with Front Desk PMS to alert guest prior to airport departure.',
      ],
      authorityLimit: 'Supervisor intake verification',
      escalationTarget: 'Escalate to Front Desk Lead Maya Lin immediately for departing guests still on hotel property.',
      effectiveDate: '2026-05-10',
      lastUpdated: '2026-10-22',
    },
    {
      id: 'hk-pol-5',
      title: 'Biohazard Sanitization & Deep Chemical Disinfection',
      category: 'Emergency',
      scope: 'Property-Wide Guest Rooms & Corridors',
      policyOwner: 'Meera Nambiar (Executive Housekeeper)',
      summary: 'Bloodborne pathogen, chemical, or biological spills require immediate room locking, Level 2 PPE, and certified hospital-grade viral disinfectants.',
      rules: [
        'Biological or chemical spills require immediate room access lockdown and physical supervisor presence.',
        'Attendants must wear Level 2 PPE (nitrile gloves, fluid-resistant gown, eye shield, and N95 mask).',
        'Certified hospital-grade virucidal disinfectant applied with minimum 10-minute wet dwell time.',
        'Ozone generator air scrubber deployed for minimum 45 minutes prior to release for inspection.',
      ],
      authorityLimit: 'Supervisor on-site physical certification',
      escalationTarget: 'Escalate to Environmental Health Officer and Duty Manager Marcus Vance.',
      effectiveDate: '2026-04-01',
      lastUpdated: '2026-10-25',
    },
  ],
  'Maintenance & Engineering': [
    {
      id: 'eng-pol-1',
      title: 'Critical HVAC & Climate Defect Escalation Protocol',
      category: 'Service Standard',
      scope: 'All Guest Rooms & Public Spaces',
      policyOwner: 'Kiran Rao (Lead Engineer)',
      summary: 'Any HVAC, power, or climate control defect not resolved within 20 minutes triggers an immediate Front Desk room move directive and compensation.',
      rules: [
        'Climate control service tickets require engineer on-site arrival within 10 minutes of dispatch.',
        'HVAC temperature restoration must occur within 20 minutes; refrigerant pressures and digital thermostats calibrated.',
        'If defect cannot be resolved within 20 minutes, supervisor triggers Front Desk room relocation and ₹2,500 goodwill credit.',
        'Chilled water loop supply temperature maintained strictly between 6.5C and 7.5C.',
      ],
      authorityLimit: '₹2,500 goodwill credit recommendation',
      escalationTarget: 'Escalate to Duty Manager Marcus Vance if room move is required or alternative rooms are unavailable.',
      effectiveDate: '2026-07-15',
      lastUpdated: '2026-10-18',
    },
    {
      id: 'eng-pol-2',
      title: 'Guest Room Water Pressure & Anti-Scald Safety Standard',
      category: 'Quality & Safety',
      scope: 'Floors 1-5 Plumbing Risers & Boilers',
      policyOwner: 'Kiran Rao (Lead Engineer)',
      summary: 'Hot water must reach 42C-45C at shower head within 45 seconds at minimum 2.5 bar pressure; mixing valves must prevent water exceeding 48C.',
      rules: [
        'Hot water delivery must reach 42C-45C at shower head within 45 seconds of valve activation.',
        'Anti-scald thermostatic mixing valves calibrated to prevent water temperatures exceeding 48C under all conditions.',
        'Dynamic water pressure maintained at minimum 2.5 bar across all guest floor supply risers.',
        'Water softener TDS and hardness levels checked twice daily at central boiler plant.',
      ],
      authorityLimit: 'Supervisor riser isolation authority',
      escalationTarget: 'Escalate to Chief Engineer if primary boiler circulation pump trips.',
      effectiveDate: '2026-06-01',
      lastUpdated: '2026-10-24',
    },
    {
      id: 'eng-pol-3',
      title: 'Smart RFID Door Lock Telemetry & Battery Replacement',
      category: 'Operating Procedure',
      scope: 'All Guest Room & Back-of-House RFID Locks',
      policyOwner: 'Kiran Rao (Lead Engineer)',
      summary: 'BMS door lock telemetry monitors RFID battery levels continuously. Low battery alerts (<12%) require battery pack replacement within 2 hours.',
      rules: [
        'BMS telemetry monitors RFID mortise lock battery voltages continuously.',
        'Lock signaling voltage <12% triggers automated priority work order requiring battery replacement within 2 hours.',
        'Engineer must test emergency mechanical cylinder override and audit trail memory during every battery change.',
        'Replaced locks must pass double RFID card swipe verification before ticket closure.',
      ],
      authorityLimit: 'Lock flash key access protocol',
      escalationTarget: 'Escalate to Security Responder if lock telemetry reports tamper alarm or deadbolt microswitch fault.',
      effectiveDate: '2026-05-15',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'eng-pol-4',
      title: 'In-Room Electrical Safety & GFCI Tripping Standard',
      category: 'Quality & Safety',
      scope: 'All Guest Room Outlets & Sub-Distribution Boards',
      policyOwner: 'Kiran Rao (Lead Engineer)',
      summary: 'Bathroom GFCI outlets must trip at 5mA within 25ms. Tripped breakers must never be reset without appliance insulation resistance testing.',
      rules: [
        'Ground Fault Circuit Interrupter (GFCI) outlets in bathrooms must trip at 5mA within 25 milliseconds.',
        'Tripped breakers must never be reset without insulation resistance testing of connected appliances.',
        'In-room media hubs, smart TVs, and bedside charging ports inspected during every monthly PM sweep.',
        'Defective electrical cords or burning odors require immediate circuit disconnection at sub-panel.',
      ],
      authorityLimit: 'Electrical sub-panel lockout authority',
      escalationTarget: 'Escalate to Chief Engineer and GM if sub-panel feeder breaker trips.',
      effectiveDate: '2026-04-10',
      lastUpdated: '2026-10-20',
    },
    {
      id: 'eng-pol-5',
      title: 'Emergency Water Leak Containment & Moisture Remediation',
      category: 'Emergency',
      scope: 'Property-Wide Piping, Risers & Bathrooms',
      policyOwner: 'Kiran Rao (Lead Engineer)',
      summary: 'Active pipe leaks require quarter-turn sub-riser isolation within 5 minutes, wet-vac deployment, and structural moisture sensor scanning.',
      rules: [
        'Active pipe bursts require sub-riser quarter-turn valve isolation within 5 minutes of notification.',
        'Heavy-duty wet vacuum and air mover blowers deployed immediately to prevent seepage into lower levels.',
        'Thermal imaging moisture sensor sweep mandatory before declaring area dry.',
        'Adjacent and lower-floor rooms inspected immediately for ceiling seepage.',
      ],
      authorityLimit: 'Emergency water riser shutdown authority',
      escalationTarget: 'Escalate to Duty Manager and Housekeeping Dispatcher for adjacent room protection.',
      effectiveDate: '2026-05-01',
      lastUpdated: '2026-10-25',
    },
  ],
  'Food & Beverages': [
    {
      id: 'fnb-pol-1',
      title: 'Severe Food Allergy Guarantee & Immediate Reversal',
      category: 'Quality & Safety',
      scope: 'In-Room Dining, Room Service & Banquets',
      policyOwner: 'Chef Rahul (Executive Sous Chef)',
      summary: 'Verified food allergen breaches result in 100% meal charge cancellation plus complimentary alternative dining, authorized immediately up to ₹10,000.',
      rules: [
        'Any guest dietary allergy (gluten, nuts, shellfish, dairy) recorded on order ticket requires dedicated sterilized color-coded purple prep board.',
        'Order ticket must be verified and signed off by kitchen supervisor before food leaves the pass.',
        'Verified food allergen breach results in immediate 100% meal charge cancellation, kitchen investigation, and executive chef notification.',
        'Complimentary alternative replacement dish prepared under direct Sous Chef supervision.',
      ],
      authorityLimit: '₹10,000 discretionary meal charge reversal',
      escalationTarget: 'Escalate to General Manager and Hotel Medical Officer immediately if medical intervention is needed.',
      effectiveDate: '2026-09-01',
      lastUpdated: '2026-10-28',
    },
    {
      id: 'fnb-pol-2',
      title: 'In-Room Dining Delivery Speed & Thermal Integrity SLA',
      category: 'Service Standard',
      scope: 'All Guest Rooms (24/7 Room Service)',
      policyOwner: 'Vikramaditya (F&B Operations Lead)',
      summary: 'Express orders must be delivered within 20 minutes; full course dinners within 35 minutes; hot dishes must arrive at minimum 65C.',
      rules: [
        'Express breakfast orders delivered within 20 minutes; full course dinners within 35 minutes of ticket intake.',
        'Hot dishes must arrive at minimum 65C using insulated electric thermal heating boxes; cold desserts maintained at <= 4C.',
        'Service attendant must conduct room entry protocol, drape linen table, and offer beverage pouring service.',
        'Attendant informs guest of tray clearance options (dial 0 or place outside door with portal notification).',
      ],
      authorityLimit: 'Supervisor re-fire approval',
      escalationTarget: 'Escalate to F&B Manager if kitchen queue delays exceed 10 minutes past promised delivery window.',
      effectiveDate: '2026-07-01',
      lastUpdated: '2026-10-22',
    },
    {
      id: 'fnb-pol-3',
      title: 'Corridor Dining Tray Clearance & Hygiene Policy',
      category: 'Operating Procedure',
      scope: 'Guest Room Hallways & Service Pantries',
      policyOwner: 'Vikramaditya (F&B Operations Lead)',
      summary: 'Used room service trays placed in corridors must be cleared within 15 minutes of guest notification or hourly patrol sweeps.',
      rules: [
        'Used room service trays placed in guest corridors must be cleared within 15 minutes of guest notification.',
        'Floor runners conduct mandatory hourly hallway sweeps on all floors between 07:00 and 23:00.',
        'Cleared trays must be transported immediately to stewarding washdown and never staged in elevator vestibules.',
        'Leftover food covered during transit to comply with local health hygiene regulations.',
      ],
      authorityLimit: 'Supervisor corridor sweep dispatch',
      escalationTarget: 'Escalate to Housekeeping Dispatcher if hallway trays cause obstruction during high arrival windows.',
      effectiveDate: '2026-06-15',
      lastUpdated: '2026-10-25',
    },
    {
      id: 'fnb-pol-4',
      title: 'VIP Welcome Amenity Setup & Presentation Standard',
      category: 'Guest Recovery',
      scope: 'VIP Stays, Suites & Honeymoon Packages',
      policyOwner: 'Chef Rahul (Executive Sous Chef)',
      summary: 'Chilled Moët champagne, handcrafted artisan fruit platters, and chocolate pralines positioned 30 minutes prior to guest check-in.',
      rules: [
        'Chilled champagne, artisan fruit platters, and chocolate pralines must be positioned 30 minutes prior to guest arrival.',
        'Ice buckets replenished with crushed crystal ice; clean champagne flutes polished with lint-free microfiber cloth.',
        'Executive welcome greeting card signed by General Manager placed on central coffee table.',
        'Dietary restrictions and non-alcoholic preferences verified on guest CRM profile prior to plating.',
      ],
      authorityLimit: 'Supervisor VIP setup sign-off',
      escalationTarget: 'Escalate to Concierge & Front Desk if guest ETA changes by more than 30 minutes.',
      effectiveDate: '2026-08-01',
      lastUpdated: '2026-10-29',
    },
    {
      id: 'fnb-pol-5',
      title: 'Minibar Product Expiry, Sealing & Folio Audit Protocol',
      category: 'Operating Procedure',
      scope: 'All In-Room Refrigerated Minibars',
      policyOwner: 'Vikramaditya (F&B Operations Lead)',
      summary: 'Minibars audited on departure; all opened or expired beverages removed, seals verified, and consumption transmitted in real-time.',
      rules: [
        'All beverages and confectionery must have minimum 60 days remaining before expiration date.',
        'Sensor-equipped automated minibars audited on every departure; seal break discrepancies flagged for guest billing verification.',
        'Minibar key locked upon guest checkout until newly restocked and inspected.',
        'Minibar restocking carts locked when unattended in guest corridors.',
      ],
      authorityLimit: 'Billing dispute adjustment up to ₹1,500',
      escalationTarget: 'Escalate to Front Desk billing coordinator if minibar consumption is disputed by departing guest.',
      effectiveDate: '2026-05-01',
      lastUpdated: '2026-10-15',
    },
  ],
  Wellness: [
    {
      id: 'wel-pol-1',
      title: 'Guest Medical Health Intake & Contraindication Safety',
      category: 'Quality & Safety',
      scope: 'Ayurvedic Spa, Hydrotherapy & Massage Suites',
      policyOwner: 'Ananya (Spa Operations Lead)',
      summary: 'Mandatory completed health intake form before any massage, hydrotherapy, or thermal session. Red-flag medical conditions require physician clearance.',
      rules: [
        'Mandatory completed health intake form before any massage, hydrotherapy, or thermal session.',
        'Strict contraindication screening: high blood pressure, recent surgery, cardiac conditions, or pregnancy require customized gentle protocols or medical clearance.',
        'Therapists must verify essential oil allergies before applying heated herbal oils.',
        'Guests informed of treatment pressure levels and have right to pause treatment at any time.',
      ],
      authorityLimit: 'Supervisor medical screening gate',
      escalationTarget: 'Escalate to Spa Director and Hotel Doctor if guest reports acute dizziness or discomfort.',
      effectiveDate: '2026-06-01',
      lastUpdated: '2026-10-28',
    },
    {
      id: 'wel-pol-2',
      title: 'Spa Suite Turnover, Ozone Sanitation & Linen Protocol',
      category: 'Service Standard',
      scope: 'All Treatment Rooms & Private Pavilions',
      policyOwner: 'Ananya (Spa Operations Lead)',
      summary: 'Mandatory 20-minute turnover window between consecutive guest treatments; 100% organic cotton linen swapped and ozone purification cycled.',
      rules: [
        'Mandatory 20-minute turnover window between consecutive guest treatments.',
        '100% certified organic Egyptian cotton linens replaced; massage table face cradle sanitized with medical-grade antiseptic wipe.',
        'Ozone air purifier cycled and signature sandalwood-jasmine ambient diffuser refilled.',
        'Therapy oils warmed to exact therapeutic temperature of 38C-40C prior to guest arrival.',
      ],
      authorityLimit: 'Supervisor turnover verification',
      escalationTarget: 'Escalate to Wellness Supervisor if turnover delay risks postponing the next guest appointment.',
      effectiveDate: '2026-07-15',
      lastUpdated: '2026-10-20',
    },
    {
      id: 'wel-pol-3',
      title: 'Hydrotherapy Pool, Steam & Sauna Thermal Safety Standards',
      category: 'Quality & Safety',
      scope: 'Vitality Pool, Cedar Sauna & Steam Chambers',
      policyOwner: 'Devendra (Lead Wellness Technician)',
      summary: 'Water chemistry testing logged every 2 hours (chlorine 1.5-3.0 ppm, pH 7.2-7.6); steam room capped at 45C and cedar sauna at 85C.',
      rules: [
        'Water chemistry testing logged every 2 hours: Free chlorine 1.5-3.0 ppm, pH strictly between 7.2 and 7.6.',
        'Steam room temperature capped at 45C with 100% relative humidity; Finnish cedar sauna maintained at 80C-85C.',
        'Emergency alert pull cords inside sauna and steam rooms tested daily at opening (06:00 AM).',
        'Anti-slip flooring mats inspected hourly in wet circuit areas.',
      ],
      authorityLimit: 'Pool isolation authority during chemical deviation',
      escalationTarget: 'Escalate to Engineering Lead Kiran Rao immediately if pool heating or chemical dosing pump faults.',
      effectiveDate: '2026-08-01',
      lastUpdated: '2026-10-26',
    },
    {
      id: 'wel-pol-4',
      title: 'Therapist Code of Ethics & Guest Privacy Safeguards',
      category: 'Operating Procedure',
      scope: 'All Spa Therapists, Instructors & Attendants',
      policyOwner: 'Ananya (Spa Operations Lead)',
      summary: 'Strict professional draping protocol maintained throughout all body treatments. Zero unannounced entry into private therapy suites.',
      rules: [
        'Strict professional draping protocol maintained throughout all body treatments.',
        'Zero unannounced entry into private therapy suites; therapists knock and receive verbal consent before entry.',
        'Personal mobile phones and photographic recording devices strictly prohibited in all wellness treatment areas.',
        'Therapist pairing verified against guest gender preferences recorded at booking.',
      ],
      authorityLimit: 'Therapist schedule re-assignment',
      escalationTarget: 'Escalate to Duty Manager and Security immediately if any guest privacy breach is suspected.',
      effectiveDate: '2026-05-01',
      lastUpdated: '2026-10-22',
    },
    {
      id: 'wel-pol-5',
      title: 'Ayurvedic Herbal Formulations & Oil Purity Certification',
      category: 'Service Standard',
      scope: 'Spa Dispensary & Herb Laboratory',
      policyOwner: 'Dr. Vaidya (Ayurvedic Physician)',
      summary: 'All Ayurvedic oils must be certified 100% cold-pressed and pure, warmed to precise temperature of 38C-40C in copper warmers.',
      rules: [
        'All Ayurvedic oils (Kshirabala, Mahanarayana, Dhanwantharam) must be certified 100% cold-pressed and pure.',
        'Oils warmed to precise therapeutic temperature of 38C-40C in copper warmers prior to application.',
        'Fresh batch formulation date tracked; open bottles discarded after 14 days.',
        'All herbs sourced from certified organic certified cooperatives.',
      ],
      authorityLimit: 'Dispensary batch approval',
      escalationTarget: 'Escalate to Spa Director if supply shipment batch shows separation or oxidation.',
      effectiveDate: '2026-07-01',
      lastUpdated: '2026-10-18',
    },
  ],
};

interface DispatcherPoliciesTabProps {
  department: DispatcherDepartment;
}

export function DispatcherPoliciesTab({ department }: DispatcherPoliciesTabProps) {
  const { state } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  // Authority profile for this specific department
  const authorityProfile = DEPARTMENT_AUTHORITY_PROFILES[department] || DEPARTMENT_AUTHORITY_PROFILES.Housekeeping;

  // Base detailed policies for this specific department
  const basePolicies = DEPARTMENT_DETAILED_POLICIES[department] || [];

  // Filter store department policies strictly for this department
  const customStorePolicies: DetailedPolicyItem[] = useMemo(() => {
    return (state.departmentPolicies ?? [])
      .filter((p) => {
        const pDept = (p.department || '').toLowerCase();
        const cur = department.toLowerCase();
        if (cur === 'housekeeping') return pDept.includes('housekeeping');
        if (cur === 'maintenance & engineering') return pDept.includes('maintenance') || pDept.includes('engineering');
        if (cur === 'food & beverages') return pDept.includes('food') || pDept.includes('beverage');
        if (cur === 'wellness') return pDept.includes('wellness') || pDept.includes('spa');
        return false;
      })
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: (p.category === 'Service Standard' || p.category === 'Operating Procedure' || p.category === 'Quality & Safety' || p.category === 'Guest Recovery' || p.category === 'Emergency')
          ? p.category
          : 'Operating Procedure',
        scope: p.scope || `${department} Operations`,
        policyOwner: p.policyOwner || 'Department Manager Marcus Vance',
        summary: p.summary,
        rules: [
          p.summary,
          `Authority limit: ${p.authorityLimit ? `₹${p.authorityLimit}` : 'None / Quality gate'}.`,
          `Escalation pathway: ${p.escalationTarget || 'Escalate to Duty Manager'}.`,
        ],
        authorityLimit: p.authorityLimit ? `₹${p.authorityLimit}` : 'Operational sign-off',
        escalationTarget: p.escalationTarget || 'Duty Manager Marcus Vance',
        effectiveDate: p.effectiveDate || '2026-06-01',
        lastUpdated: p.lastUpdated || '2026-10-25',
      }));
  }, [state.departmentPolicies, department]);

  // Combine and de-duplicate by title
  const allDepartmentPolicies = useMemo(() => {
    const combined = [...basePolicies, ...customStorePolicies];
    return combined.filter((p, index, arr) => arr.findIndex((x) => x.title === p.title) === index);
  }, [basePolicies, customStorePolicies]);

  // Filter policies by search & category
  const filteredPolicies = useMemo(() => {
    return allDepartmentPolicies.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSummary = p.summary.toLowerCase().includes(q);
        const matchOwner = p.policyOwner.toLowerCase().includes(q);
        const matchScope = p.scope.toLowerCase().includes(q);
        const matchRules = p.rules.some((r) => r.toLowerCase().includes(q));
        return matchTitle || matchSummary || matchOwner || matchScope || matchRules;
      }
      return true;
    });
  }, [allDepartmentPolicies, selectedCategory, searchQuery]);

  // Category counts
  const categories = ['all', 'Service Standard', 'Operating Procedure', 'Quality & Safety', 'Guest Recovery', 'Emergency'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white">
                  {department} Service Authority & Policies
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {department} Only
                </span>
              </div>
              <p className="text-xs text-mist-300 mt-0.5">
                Governing supervisor dispatch authority, strict negative boundaries, quality certification gates, and enforceable operating protocols.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="rounded-full px-3 py-1.5 bg-white/[0.04] border border-white/10 text-mist-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{allDepartmentPolicies.length} Active Policies</span>
          </span>
          <span className="rounded-full px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
            {authorityProfile.financialLimitDisplay}
          </span>
        </div>
      </div>

      {/* Operational Authority vs Strict Negative Boundaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allowed Operational Authority */}
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.03] p-5 backdrop-blur-xl shadow-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Operational Authority (Allowed Actions)
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {authorityProfile.roleName}
            </span>
          </div>

          <ul className="space-y-2.5 text-xs text-mist-200">
            {authorityProfile.operationalAuthority.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strict Negative Boundaries */}
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.03] p-5 backdrop-blur-xl shadow-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Strict Negative Boundaries (Must Escalate)
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              Duty Manager Trigger
            </span>
          </div>

          <ul className="space-y-2.5 text-xs text-rose-200/90">
            {authorityProfile.negativeBoundaries.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-rose-500/20 flex items-start gap-2 text-[11px] text-rose-300/90 bg-rose-500/[0.06] p-2.5 rounded-xl">
            <PhoneCall className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>Escalation Target:</strong> {authorityProfile.escalationTarget}
              <p className="text-[10px] text-rose-400/80 mt-0.5">{authorityProfile.escalationCondition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Policies Header & Filters */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-bold font-display text-white">
                Detailed Operating Procedures & Standards ({filteredPolicies.length})
              </h2>
            </div>
            <p className="text-xs text-mist-400 mt-0.5">
              Enforceable standard operating procedures (SOPs) strictly governing <strong className="text-mist-200">{department}</strong>.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
            <input
              type="text"
              placeholder="Search policy name, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink-950 pl-8 pr-3 py-2 text-xs text-white placeholder-mist-600 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {categories.map((cat) => {
            const count = cat === 'all'
              ? allDepartmentPolicies.length
              : allDepartmentPolicies.filter((p) => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-purple-500 text-ink-950 font-bold shadow-sm'
                    : 'bg-white/[0.03] text-mist-400 hover:text-white border border-white/10'
                }`}
              >
                {cat === 'all' ? 'All Policies' : cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Policies List */}
        {filteredPolicies.length === 0 ? (
          <div className="py-12 text-center text-mist-500 space-y-2 text-xs border border-dashed border-white/10 rounded-2xl">
            <BookOpen className="h-8 w-8 mx-auto text-mist-600" />
            <p className="font-semibold text-mist-400">No {department} policies found matching current filters.</p>
            <p className="text-[11px] text-mist-600">Try clearing the search query or selecting &quot;All Policies&quot;.</p>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPolicies.map((pol) => {
              const isExpanded = expandedPolicyId === pol.id;

              return (
                <div
                  key={pol.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pol.category === 'Service Standard'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : pol.category === 'Quality & Safety'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : pol.category === 'Emergency'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                            : pol.category === 'Guest Recovery'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {pol.category}
                        </span>

                        <span className="text-[11px] text-mist-400 font-mono">
                          Scope: {pol.scope}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1">
                        {pol.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedPolicyId(isExpanded ? null : pol.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-mist-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <span>{isExpanded ? 'Hide Specific Rules' : 'View Specific Rules'}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-mist-300 leading-relaxed bg-ink-950/40 p-3 rounded-xl border border-white/5">
                    {pol.summary}
                  </p>

                  {/* Expanded Detail Rules */}
                  {isExpanded && (
                    <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Enforceable Operating Clauses & Verification Standards</span>
                      </div>

                      <ul className="space-y-2 text-xs text-mist-200">
                        {pol.rules.map((rule, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-mist-400">
                        <span><strong>Policy Owner:</strong> {pol.policyOwner}</span>
                        <span><strong>Effective Date:</strong> {pol.effectiveDate} (Reviewed: {pol.lastUpdated})</span>
                      </div>
                    </div>
                  )}

                  {/* Policy Footer Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-mist-400 pt-1 border-t border-white/5">
                    <span className="text-amber-300/90 font-mono">
                      <strong>Authority Limit:</strong> {pol.authorityLimit}
                    </span>
                    <span className="text-mist-400">
                      <strong>Escalation Target:</strong> {pol.escalationTarget}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
