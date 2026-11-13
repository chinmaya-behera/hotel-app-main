'use client';

import { useState, useMemo, useEffect, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Film,
  Filter,
  History,
  Image as ImageIcon,
  Layers,
  MapPin,
  Play,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import { MANAGER_DEPARTMENTS, departmentId, managerDepartment } from '@/lib/manager-domain';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection, InspectionType, InspectionStatus } from '@/types/demo';

type InspectionsView = 'due' | 'history';

// Helper to reliably extract department identifier and display name
function getInspectionDepartment(inspection: SupervisorInspection): { id: string; name: string } {
  const deptKey =
    departmentId(inspection.department) ??
    (inspection.type === 'maintenance_check' ? 'engineering' : 'housekeeping');
  const d = managerDepartment(deptKey);
  const name = d.id === 'wellness' ? 'Wellness' : d.name;
  return { id: d.id, name };
}

// Preset deadlines for realistic display
const PRESET_DEADLINES: Record<string, string> = {
  'INSP-WELL-01': 'Today 11:30',
  'INSP-WELL-02': 'Today 09:15',
  'INSP-FB-01': 'Today 10:45',
  'INSP-FB-02': 'Today 08:45',
  'INSP-MX-01': 'Today 11:00',
  'INSP-2026-01': 'Today 12:00',
  'INSP-2026-02': 'Today 11:15',
  'INSP-2026-03': 'Today 14:00',
  'INSP-2026-04': 'Today 08:30',
  'INSP-2026-05': 'Today 10:30',
  'INSP-2026-06': 'Yesterday 16:00',
  'INSP-2026-07': 'Yesterday 14:00',
};

// Helper to resolve an inspection deadline

// 12-hour / 24-hour time conversion helpers for inspection deadline clock
export function format12HourTime(time24: string): { time12: string; period: 'AM' | 'PM' } {
  if (!time24) return { time12: '12:00', period: 'PM' };
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return { time12: time24, period: 'PM' };
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hFormatted = h.toString().padStart(2, '0');
  return { time12: `${hFormatted}:${m}`, period };
}

export function convertTo24Hour(time12: string, period: 'AM' | 'PM'): string {
  const [hStr, mStr] = time12.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return '12:00';
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
}

function getInspectionDeadline(inspection: SupervisorInspection): string {
  if (inspection.scheduledTime && inspection.scheduledTime.trim()) {
    return inspection.scheduledTime;
  }
  if (PRESET_DEADLINES[inspection.id]) {
    return PRESET_DEADLINES[inspection.id];
  }
  if (inspection.priority === 'urgent') return 'Today 11:00';
  if (inspection.priority === 'vip') return 'Today 12:30';
  return 'Today 16:00';
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  turnover: 'Turnover & Checkout Inspection',
  deep_clean: 'Deep Clean Verification',
  vip_prep: 'VIP Arrival Prep',
  maintenance_check: 'Maintenance & Safety Check',
  periodic: 'Periodic Quality Audit',
  linen_amenities: 'Linen Quality & Amenities Audit',
  hvac_diagnostics: 'HVAC & Air Flow Diagnostics',
  plumbing_sanitary: 'Plumbing & Water Pressure Audit',
  electrical_lighting: 'Electrical & Lighting Inspection',
  haccp_hygiene: 'Kitchen Hygiene & HACCP Audit',
  buffet_temperature: 'Buffet Temperature & Hot Holding Check',
  bar_inventory: 'Bar Quality & Beverage Inventory Audit',
  room_service_expedite: 'In-Room Dining Expediting Check',
  spa_hygiene: 'Spa Treatment Room Hygiene & Sanitization',
  hydrotherapy_check: 'Hydrotherapy & Sauna Safety Audit',
  aromatherapy_compliance: 'Aromatherapy & Product Inventory Audit',
};

// Department-specific inspection types for the dynamic dropdown
const DEPARTMENT_INSPECTION_TYPES: Record<string, { id: string; label: string }[]> = {
  housekeeping: [
    { id: 'turnover', label: 'Turnover & Checkout Inspection' },
    { id: 'deep_clean', label: 'Deep Clean Verification' },
    { id: 'vip_prep', label: 'VIP Suite Presentation Prep' },
    { id: 'linen_amenities', label: 'Linen Quality & Amenities Audit' },
    { id: 'periodic', label: 'Periodic Sanitation Check' },
  ],
  engineering: [
    { id: 'maintenance_check', label: 'Maintenance & Safety Check' },
    { id: 'hvac_diagnostics', label: 'HVAC & Air Flow Diagnostics' },
    { id: 'plumbing_sanitary', label: 'Plumbing & Water Pressure Audit' },
    { id: 'electrical_lighting', label: 'Electrical & Lighting Inspection' },
    { id: 'periodic', label: 'Preventative Plant & Equipment Audit' },
  ],
  'food-beverages': [
    { id: 'haccp_hygiene', label: 'Kitchen Hygiene & HACCP Audit' },
    { id: 'buffet_temperature', label: 'Buffet Temperature & Hot Holding Check' },
    { id: 'bar_inventory', label: 'Bar Quality & Beverage Inventory Audit' },
    { id: 'room_service_expedite', label: 'In-Room Dining Expediting Check' },
    { id: 'periodic', label: 'Food Safety & Service Standards Audit' },
  ],
  wellness: [
    { id: 'spa_hygiene', label: 'Spa Treatment Room Hygiene & Sanitization' },
    { id: 'hydrotherapy_check', label: 'Hydrotherapy & Sauna Safety Audit' },
    { id: 'vip_prep', label: 'VIP Wellness Prep & Therapy Suite Verification' },
    { id: 'aromatherapy_compliance', label: 'Aromatherapy & Product Inventory Audit' },
    { id: 'periodic', label: 'Wellness Quality & Guest Safety Audit' },
  ],
};

// Interface for media uploaded by inspection teams
interface InspectionMediaItem {
  id: string;
  type: 'photo' | 'video';
  title: string;
  timestamp: string;
  uploadedBy: string;
  notes: string;
  tag: string;
  duration?: string;
  gradient: string;
}

// Generate realistic simulated inspection media uploaded by the field inspection team
function getInspectionMedia(inspection: SupervisorInspection): InspectionMediaItem[] {
  const dept = getInspectionDepartment(inspection);
  const deptId = dept.id;
  const inspector = inspection.inspectedBy || inspection.assignedSupervisorName || 'Inspection Team';

  if (deptId === 'engineering') {
    return [
      {
        id: 'med-1',
        type: 'photo',
        title: 'FCU Actuator & Chilled Water Valve Inspection',
        timestamp: 'Today 09:30 AM',
        uploadedBy: inspector,
        notes: 'Actuator motor replaced and tested. Pressure valve seal intact with zero seepage.',
        tag: 'Passed · High Pressure Certified',
        gradient: 'from-blue-600/30 to-cyan-800/40',
      },
      {
        id: 'med-2',
        type: 'photo',
        title: 'Electrical Distribution Board & Breaker Sweep',
        timestamp: 'Today 09:35 AM',
        uploadedBy: inspector,
        notes: 'Thermal scan completed. All circuits operating at normal ambient temperatures.',
        tag: 'Passed · Thermal Scan Normal',
        gradient: 'from-amber-600/30 to-orange-800/40',
      },
      {
        id: 'med-3',
        type: 'photo',
        title: 'Bathroom Drainage & Plumbing Pressure Test',
        timestamp: 'Today 09:40 AM',
        uploadedBy: inspector,
        notes: 'Trap cleaned and aerator replaced. Hot water delivery at 48°C in under 12 seconds.',
        tag: 'Passed · 4.2 Bar Pressure',
        gradient: 'from-teal-600/30 to-emerald-800/40',
      },
      {
        id: 'med-4',
        type: 'video',
        title: 'Exhaust & Acoustic Sound Meter Verification',
        timestamp: 'Today 09:45 AM',
        uploadedBy: inspector,
        notes: 'Recorded acoustic sweep showing ambient noise below 30dB threshold.',
        tag: 'Video · 28 dB Passed',
        duration: '0:38',
        gradient: 'from-indigo-600/40 to-purple-800/50',
      },
    ];
  }

  if (deptId === 'food-beverages') {
    return [
      {
        id: 'med-1',
        type: 'photo',
        title: 'Hot Holding Temperature Digital Probe Verification',
        timestamp: 'Today 08:20 AM',
        uploadedBy: inspector,
        notes: 'Soup and hot entree counters certified at 74°C (HACCP threshold >65°C passed).',
        tag: 'HACCP Certified · 74°C',
        gradient: 'from-rose-600/30 to-red-800/40',
      },
      {
        id: 'med-2',
        type: 'photo',
        title: 'Cold Storage & Raw Produce Separation Audit',
        timestamp: 'Today 08:30 AM',
        uploadedBy: inspector,
        notes: 'Walk-in chiller at 3.2°C. Color-coded allergen prep boards sanitized.',
        tag: 'Sanitized · 3.2°C Chilled',
        gradient: 'from-emerald-600/30 to-teal-800/40',
      },
      {
        id: 'med-3',
        type: 'photo',
        title: 'VIP In-Room Dining Tray Presentation & Cloche Polish',
        timestamp: 'Today 08:45 AM',
        uploadedBy: inspector,
        notes: 'Silver cloche polished, fresh linen liner, allergen card signed by Executive Chef.',
        tag: 'Executive Standard Passed',
        gradient: 'from-amber-600/30 to-yellow-800/40',
      },
      {
        id: 'med-4',
        type: 'video',
        title: 'Kitchen Sanitization & Hygiene Sweep Walkthrough',
        timestamp: 'Today 08:50 AM',
        uploadedBy: inspector,
        notes: 'Recorded walkthrough of prep line, dishwashing station, and hand-wash monitoring.',
        tag: 'Video · Line Hygiene Passed',
        duration: '1:05',
        gradient: 'from-orange-600/40 to-rose-800/50',
      },
    ];
  }

  if (deptId === 'wellness') {
    return [
      {
        id: 'med-1',
        type: 'photo',
        title: 'Therapy Suite Sanitization & Linen Hygiene',
        timestamp: 'Today 10:10 AM',
        uploadedBy: inspector,
        notes: 'Treatment bed disinfected with organic lavender spray, plush warm linens prepared.',
        tag: 'Ultra-Clean · Organic Cleared',
        gradient: 'from-purple-600/30 to-pink-800/40',
      },
      {
        id: 'med-2',
        type: 'photo',
        title: 'Hydrotherapy Pool Chemical Balance & Temp Check',
        timestamp: 'Today 10:20 AM',
        uploadedBy: inspector,
        notes: 'Water temperature 36.5°C, pH balanced at 7.4, chlorine levels optimal.',
        tag: 'Water Safety Certified',
        gradient: 'from-cyan-600/30 to-blue-800/40',
      },
      {
        id: 'med-3',
        type: 'photo',
        title: 'Aromatherapy Oil Lot Inspection & Expiry Audit',
        timestamp: 'Today 10:30 AM',
        uploadedBy: inspector,
        notes: '100% pure organic essential oils authenticated. Allergen warnings updated.',
        tag: 'Certified Organic',
        gradient: 'from-emerald-600/30 to-lime-800/40',
      },
      {
        id: 'med-4',
        type: 'video',
        title: 'Sauna & Steam Room Steam Cycle Test',
        timestamp: 'Today 10:40 AM',
        uploadedBy: inspector,
        notes: 'Steam generator automated timer and emergency shutoff safety response tested.',
        tag: 'Video · Auto Shutoff Verified',
        duration: '0:45',
        gradient: 'from-amber-600/40 to-purple-800/50',
      },
    ];
  }

  // Default: Housekeeping
  return [
    {
      id: 'med-1',
      type: 'photo',
      title: 'Turn-down & Egyptian Cotton Bed Presentation',
      timestamp: 'Today 09:15 AM',
      uploadedBy: inspector,
      notes: 'Crisp military corners, triple sheet tuck, pillow menu alignment verified.',
      tag: '5-Star Standard Passed',
      gradient: 'from-amber-600/30 to-amber-800/40',
    },
    {
      id: 'med-2',
      type: 'photo',
      title: 'Bathroom White Glove Sanitization & Mirror Shine',
      timestamp: 'Today 09:25 AM',
      uploadedBy: inspector,
      notes: 'Zero water spots on chrome fixtures, vanity sealed, luxury branded toiletries replenished.',
      tag: 'Sanitized & Certified',
      gradient: 'from-sky-600/30 to-indigo-800/40',
    },
    {
      id: 'med-3',
      type: 'photo',
      title: 'VIP Welcome Amenities & Fruit Basket Setup',
      timestamp: 'Today 09:35 AM',
      uploadedBy: inspector,
      notes: 'Handwritten GM welcome note, fresh orchid stem, chilled mineral water placed.',
      tag: 'VIP Setup Passed',
      gradient: 'from-purple-600/30 to-fuchsia-800/40',
    },
    {
      id: 'med-4',
      type: 'video',
      title: '360° Suite Panorama & Acoustic Noise Sweep',
      timestamp: 'Today 09:40 AM',
      uploadedBy: inspector,
      notes: 'Full panoramic scan of master bedroom, private balcony, and bathroom layout.',
      tag: 'Video · Full Suite Walkthrough',
      duration: '0:52',
      gradient: 'from-emerald-600/40 to-teal-800/50',
    },
  ];
}

export interface GeneralManagerInspectionsTabProps {
  selectedInspectionId?: string | null;
  onClearSelectedInspection?: () => void;
}

export function GeneralManagerInspectionsTab({
  selectedInspectionId,
  onClearSelectedInspection,
}: GeneralManagerInspectionsTabProps = {}) {
  const { state, initiateInspectionDirective, approveInspection } = useDemo();

  // Navigation views: 'due' | 'history' (Renamed 'history' to 'Inspections')
  const [activeView, setActiveView] = useState<InspectionsView>('due');

  // Filtering & Search state
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedChecklistId, setExpandedChecklistId] = useState<string | null>(null);

  // Modal Frame State for Create Inspections Form
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Modal Frame State for Photos & Videos Uploaded by Inspection Team
  const [viewingMediaInspection, setViewingMediaInspection] = useState<SupervisorInspection | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<InspectionMediaItem | null>(null);

  // Create Form State
  const [createDeptId, setCreateDeptId] = useState<string>('housekeeping');
  const [locationScope, setLocationScope] = useState<'all' | 'floor' | 'rooms'>('rooms');
  const [floorInput, setFloorInput] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('');
  const [createType, setCreateType] = useState<string>('turnover');
  const [createPriority, setCreatePriority] = useState<'normal' | 'vip' | 'urgent'>('normal');

  // Deadline clock, AM/PM, and manual box inputs
  const [clockTime, setClockTime] = useState<string>('12:30');
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>('PM');
  const [manualDeadline, setManualDeadline] = useState<string>('Today 12:30 PM');

  const handlePeriodToggle = (newPeriod: 'AM' | 'PM') => {
    setClockPeriod(newPeriod);
    const { time12 } = format12HourTime(clockTime);
    const new24 = convertTo24Hour(time12, newPeriod);
    setClockTime(new24);
    setManualDeadline(`Today ${time12} ${newPeriod}`);
  };

  const [createInstructions, setCreateInstructions] = useState<string>(
    managerDepartment('housekeeping').standard,
  );
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const selectedDepartment = managerDepartment(createDeptId);

  // Escape key listener for modal frames
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setViewingMediaInspection(null);
        setSelectedPreviewMedia(null);
      }
    };
    if (isCreateModalOpen || viewingMediaInspection || selectedPreviewMedia) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCreateModalOpen, viewingMediaInspection, selectedPreviewMedia]);

  // Sync instructions & dynamic types when department changes in form
  const handleDeptChange = (deptId: string) => {
    setCreateDeptId(deptId);
    const d = managerDepartment(deptId);
    setCreateInstructions(d.standard);
    const availableTypes = DEPARTMENT_INSPECTION_TYPES[deptId] || DEPARTMENT_INSPECTION_TYPES.housekeeping;
    setCreateType(availableTypes[0].id);
  };

  const allInspections = state.inspections ?? [];

  // Sync selectedInspectionId from parent notifications
  useEffect(() => {
    if (selectedInspectionId) {
      const match = allInspections.find((i) => i.id === selectedInspectionId);
      if (match) {
        if (match.status === 'passed') {
          setActiveView('history');
        } else {
          setActiveView('due');
        }
        setExpandedChecklistId(match.id);
      }
    }
  }, [selectedInspectionId, allInspections]);

  // Completed inspections for Inspections view (status === 'passed')
  const completedInspections = useMemo(() => {
    return allInspections.filter((i) => i.status === 'passed');
  }, [allInspections]);

  // Due inspections (status !== 'passed': pending, reopened, escalated)
  const dueInspections = useMemo(() => {
    return allInspections.filter((i) => i.status !== 'passed');
  }, [allInspections]);

  // Computed summary counts
  const totalCount = allInspections.length;
  const dueCount = dueInspections.length;
  const passedCount = completedInspections.length;
  const urgentDueCount = dueInspections.filter((i) => i.priority === 'urgent' || i.status === 'reopened').length;
  const avgScore = useMemo(() => {
    const scores = completedInspections
      .map((i) => i.score)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));
    if (scores.length === 0) return 98;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [completedInspections]);

  // Filtered Due Inspections
  const filteredDueInspections = useMemo(() => {
    return dueInspections.filter((i) => {
      const dept = getInspectionDepartment(i);
      if (departmentFilter !== 'all' && dept.id !== departmentFilter) return false;
      if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = i.roomNumber.toLowerCase().includes(q);
        const matchesDept = dept.name.toLowerCase().includes(q);
        const matchesType = (INSPECTION_TYPE_LABELS[i.type] || i.type).toLowerCase().includes(q);
        const matchesAttendant = (i.attendantName || '').toLowerCase().includes(q);
        const matchesSupervisor = (i.assignedSupervisorName || '').toLowerCase().includes(q);
        const matchesInstructions = (i.instructions || '').toLowerCase().includes(q);
        const matchesNotes = (i.notes || '').toLowerCase().includes(q);
        const matchesReopen = (i.reopenReason || '').toLowerCase().includes(q);
        if (
          !matchesRoom &&
          !matchesDept &&
          !matchesType &&
          !matchesAttendant &&
          !matchesSupervisor &&
          !matchesInstructions &&
          !matchesNotes &&
          !matchesReopen
        ) {
          return false;
        }
      }
      return true;
    });
  }, [dueInspections, departmentFilter, priorityFilter, searchQuery]);

  // Filtered Inspections (Completed)
  const filteredHistoryInspections = useMemo(() => {
    return completedInspections.filter((i) => {
      const dept = getInspectionDepartment(i);
      if (departmentFilter !== 'all' && dept.id !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = i.roomNumber.toLowerCase().includes(q);
        const matchesDept = dept.name.toLowerCase().includes(q);
        const matchesType = (INSPECTION_TYPE_LABELS[i.type] || i.type).toLowerCase().includes(q);
        const matchesInspector = (i.inspectedBy || '').toLowerCase().includes(q);
        const matchesAttendant = (i.attendantName || '').toLowerCase().includes(q);
        const matchesNotes = (i.notes || '').toLowerCase().includes(q);
        if (
          !matchesRoom &&
          !matchesDept &&
          !matchesType &&
          !matchesInspector &&
          !matchesAttendant &&
          !matchesNotes
        ) {
          return false;
        }
      }
      return true;
    });
  }, [completedInspections, departmentFilter, searchQuery]);

  // Submit new inspection directive from modal frame
  const handleSubmitDirective = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let finalLocation = 'All Areas';
    if (locationScope === 'floor') {
      if (!floorInput.trim()) return;
      const cleanFloor = floorInput.trim();
      finalLocation = cleanFloor.toLowerCase().startsWith('floor') ? cleanFloor : `Floor ${cleanFloor}`;
    } else if (locationScope === 'rooms') {
      if (!roomInput.trim()) return;
      const cleanRoom = roomInput.trim();
      finalLocation = cleanRoom.toLowerCase().startsWith('room') ? cleanRoom : `Room ${cleanRoom}`;
    }

    const deadlineValue = manualDeadline.trim() || (clockTime ? `Today ${format12HourTime(clockTime).time12} ${clockPeriod}` : 'Today 16:00');
    const selectedDeptName = selectedDepartment.id === 'wellness' ? 'Wellness' : selectedDepartment.name;

    initiateInspectionDirective({
      department: selectedDeptName,
      roomNumber: finalLocation,
      roomType: `${selectedDeptName} Location`,
      type: createType as any,
      priority: createPriority,
      instructions: createInstructions.trim(),
      scheduledTime: deadlineValue,
      initiatedBy: 'General Manager',
      initiatedRole: 'general_manager',
    });

    setFloorInput('');
    setRoomInput('');
    setIsCreateModalOpen(false);

    setFeedbackBanner({
      type: 'success',
      message: `Directive issued to ${selectedDepartment.person} (${selectedDeptName}) for ${finalLocation}. Target deadline: ${deadlineValue}.`,
      actionLabel: 'View in Due Inspections →',
      onAction: () => {
        setActiveView('due');
        setFeedbackBanner(null);
      },
    });
  };

  // Quick mark inspection as passed from Due view
  const handleMarkPassed = (inspectionId: string, roomNumber: string) => {
    approveInspection(inspectionId, 'Verified and passed by General Manager directive review.');
    setFeedbackBanner({
      type: 'success',
      message: `Inspection for ${roomNumber} approved & signed off! Moved to Inspections.`,
      actionLabel: 'View Inspections →',
      onAction: () => {
        setActiveView('history');
        setFeedbackBanner(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              General Manager Oversight
            </span>
            <span className="text-xs text-mist-400">· Quality & Standards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 dark:text-white">
            Department Inspections
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-mist-400 max-w-2xl">
            Dispatch operational directives to department heads, monitor active due inspections with clear deadlines, inspect uploaded photos & videos, and review verified audits.
          </p>
        </div>

        {/* Top Stat Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">Due Now</div>
            <div className="text-base font-extrabold text-amber-500 dark:text-amber-400">{dueCount}</div>
          </div>
          <div className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">Inspections</div>
            <div className="text-base font-extrabold text-emerald-500 dark:text-emerald-400">{passedCount}</div>
          </div>
          <div className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-mist-400">Avg Score</div>
            <div className="text-base font-extrabold text-sky-500 dark:text-sky-400">{avgScore}%</div>
          </div>
        </div>
      </div>

      {/* Primary 3-Option Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option 1: Create Inspections (Opens in another frame with background blur) */}
        <button
          type="button"
          onClick={() => {
            setIsCreateModalOpen(true);
            setFeedbackBanner(null);
          }}
          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
            isCreateModalOpen
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-white/70 dark:bg-ink-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-ink-950 font-bold shadow-sm">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy-950 dark:text-white">Create Inspections</div>
              <div className="text-xs text-slate-500 dark:text-mist-400">Dispatch quality directives</div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            Open Form
          </span>
        </button>

        {/* Option 2: Due Inspections */}
        <button
          type="button"
          onClick={() => {
            setActiveView('due');
            setFeedbackBanner(null);
          }}
          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
            activeView === 'due' && !isCreateModalOpen
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm'
              : 'bg-white/70 dark:bg-ink-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                activeView === 'due' && !isCreateModalOpen
                  ? 'bg-amber-500 text-ink-950 font-bold'
                  : 'bg-slate-100 dark:bg-ink-950 text-slate-500 dark:text-mist-400'
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy-950 dark:text-white">Due Inspections</div>
              <div className="text-xs text-slate-500 dark:text-mist-400">Not completed · With deadlines</div>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              urgentDueCount > 0
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
            }`}
          >
            {dueCount} Due
          </span>
        </button>

        {/* Option 3: Inspections (formerly History of Inspections) */}
        <button
          type="button"
          onClick={() => {
            setActiveView('history');
            setFeedbackBanner(null);
          }}
          className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
            activeView === 'history' && !isCreateModalOpen
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-sm'
              : 'bg-white/70 dark:bg-ink-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                activeView === 'history' && !isCreateModalOpen
                  ? 'bg-emerald-500 text-ink-950 font-bold'
                  : 'bg-slate-100 dark:bg-ink-950 text-slate-500 dark:text-mist-400'
              }`}
            >
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy-950 dark:text-white">Inspections</div>
              <div className="text-xs text-slate-500 dark:text-mist-400">Completed & verified audits</div>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            {passedCount} Passed
          </span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackBanner && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-navy-950 dark:text-white animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
            <span>{feedbackBanner.message}</span>
          </div>
          {feedbackBanner.actionLabel && feedbackBanner.onAction && (
            <button
              type="button"
              onClick={feedbackBanner.onAction}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 transition shrink-0"
            >
              {feedbackBanner.actionLabel}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION 2: DUE INSPECTIONS VIEW (WITH DEADLINES & PHOTOS/VIDEOS) */}
      {/* ========================================================================= */}
      {activeView === 'due' && (
        <div className="space-y-6">
          {/* Controls and Search Bar */}
          <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search due inspections by room, staff, instructions, or ID..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Department Filter */}
              <div className="md:col-span-4">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="all">Department: All Departments ({dueCount})</option>
                  <option value="housekeeping">
                    Housekeeping ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'housekeeping').length})
                  </option>
                  <option value="wellness">
                    Wellness ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'wellness').length})
                  </option>
                  <option value="engineering">
                    Maintenance & Engineering ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'engineering').length})
                  </option>
                  <option value="food-beverages">
                    Food & Beverages ({dueInspections.filter((i) => getInspectionDepartment(i).id === 'food-beverages').length})
                  </option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="md:col-span-3">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="all">Priority: All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="vip">VIP Prep</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-mist-400">Active Due Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold border border-red-500/20">
                  {urgentDueCount} Urgent/Reopened
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                  {dueCount - urgentDueCount} Standard Due
                </span>
              </div>
              <span className="text-slate-400 dark:text-mist-500 text-[11px]">
                Showing {filteredDueInspections.length} of {dueCount} pending inspections
              </span>
            </div>
          </div>

          {/* Due Inspection Cards */}
          {filteredDueInspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-navy-950 dark:text-white">
                No Due Inspections Found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-mist-400 max-w-md mx-auto">
                {searchQuery || departmentFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No due inspections match your active filters. Try adjusting your search query or department filter.'
                  : 'All department quality inspections have been completed and verified! Use "Create Inspections" to dispatch a new directive.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs shadow-sm hover:bg-amber-300 transition"
              >
                <PlusCircle className="h-4 w-4" />
                Create New Inspection Directive
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDueInspections.map((item) => {
                const dept = getInspectionDepartment(item);
                const deadline = getInspectionDeadline(item);
                const isUrgent = item.priority === 'urgent' || item.status === 'reopened';
                const isVip = item.priority === 'vip';
                const isExpanded = expandedChecklistId === item.id;
                const itemsCount = item.items?.length ?? 0;
                const passedItems = (item.items ?? []).filter((ci) => ci.passed).length;
                const isTargetSelected = selectedInspectionId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`p-5 rounded-3xl border backdrop-blur-xl shadow-sm space-y-4 transition ${
                      isTargetSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15'
                        : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/80 hover:border-amber-500/30'
                    }`}
                  >
                    {/* Header Row: Room, Department, Status, and DEADLINE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-center">
                          <span className="block text-xs font-mono font-bold text-navy-950 dark:text-white">
                            {item.roomNumber}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-navy-950 dark:text-white">
                              {item.roomType || `${dept.name} Inspection`}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300">
                              {dept.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-mist-400">
                            {INSPECTION_TYPE_LABELS[item.type] || item.type}
                          </div>
                        </div>
                      </div>

                      {/* Prominent Deadline Badge */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border ${
                            isUrgent
                              ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 animate-pulse'
                              : isVip
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>Deadline: {deadline}</span>
                          {isUrgent && <span className="text-[10px] uppercase font-extrabold ml-1">(Urgent)</span>}
                        </div>

                        {/* Status Tag */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                            item.status === 'reopened'
                              ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status === 'reopened' ? 'Reopened (Corrective)' : 'Pending Inspection'}
                        </span>
                      </div>
                    </div>

                    {/* Reopen Reason / Corrective Alert if applicable */}
                    {item.status === 'reopened' && (
                      <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Correction Required: {item.reopenReason}</span>
                        </div>
                        <p className="text-slate-600 dark:text-mist-300">
                          {item.correctiveAction}
                        </p>
                      </div>
                    )}

                    {/* Directives & Instructions */}
                    <div className="text-xs text-slate-600 dark:text-mist-300 bg-slate-50 dark:bg-ink-950/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <strong className="text-navy-950 dark:text-white">Directive Guidelines: </strong>
                      <span>{item.instructions || item.notes || 'Conduct comprehensive quality check adhering to departmental standards.'}</span>
                    </div>

                    {/* Metadata & Staff Personnel */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-mist-400">
                      <div>
                        <User className="inline h-3 w-3 mr-1" />
                        <span>Attendant: <strong>{item.attendantName || 'Awaiting assignment'}</strong></span>
                      </div>
                      <div>
                        <ShieldCheck className="inline h-3 w-3 mr-1" />
                        <span>Supervisor: <strong>{item.assignedSupervisorName || 'Department Manager'}</strong></span>
                      </div>
                      <div>
                        <Layers className="inline h-3 w-3 mr-1" />
                        <span>Checklist: <strong>{passedItems}/{itemsCount || 'Open'} verified</strong></span>
                      </div>
                    </div>

                    {/* Expandable Checklist Items */}
                    {isExpanded && item.items && item.items.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <h4 className="text-xs font-bold text-navy-950 dark:text-white">
                          Inspection Checklist Verification Items ({itemsCount}):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.items.map((chk) => (
                            <div
                              key={chk.id}
                              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                                chk.passed
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-700 dark:text-mist-300'
                                  : 'bg-slate-50 dark:bg-ink-950/60 border-slate-200 dark:border-white/10 text-slate-500 dark:text-mist-400'
                              }`}
                            >
                              <div
                                className={`p-1 rounded-md mt-0.5 ${
                                  chk.passed
                                    ? 'bg-emerald-500 text-ink-950'
                                    : 'bg-slate-200 dark:bg-ink-800 text-slate-400'
                                }`}
                              >
                                <Check className="h-3 w-3" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-navy-950 dark:text-white">{chk.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-mist-500 capitalize">
                                  {chk.category} {chk.notes ? `· ${chk.notes}` : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar with Photos & Videos Option */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setExpandedChecklistId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{isExpanded ? 'Hide Checklist' : `View Checklist (${itemsCount} items)`}</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Option to View Photos and Videos uploaded by Inspection Team */}
                        <button
                          type="button"
                          onClick={() => {
                            setViewingMediaInspection(item);
                            setSelectedPreviewMedia(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold transition shadow-sm"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Photos & Videos (4)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkPassed(item.id, item.roomNumber)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink-950 font-bold text-xs shadow-sm transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark as Inspected & Passed
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION 3: INSPECTIONS (FORMERLY HISTORY OF INSPECTIONS) */}
      {/* ========================================================================= */}
      {activeView === 'history' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl shadow-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-7 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search completed inspections by room, inspector, findings..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Department Filter */}
              <div className="md:col-span-5">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="all">Department: All Departments ({passedCount})</option>
                  <option value="housekeeping">
                    Housekeeping ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'housekeeping').length})
                  </option>
                  <option value="wellness">
                    Wellness ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'wellness').length})
                  </option>
                  <option value="engineering">
                    Maintenance & Engineering ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'engineering').length})
                  </option>
                  <option value="food-beverages">
                    Food & Beverages ({completedInspections.filter((i) => getInspectionDepartment(i).id === 'food-beverages').length})
                  </option>
                </select>
              </div>
            </div>

            {/* Quality Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-mist-400">Inspections:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  {passedCount} Completed Inspections
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">
                  {avgScore}% Average Quality Score
                </span>
              </div>
              <span className="text-slate-400 dark:text-mist-500 text-[11px]">
                Showing {filteredHistoryInspections.length} completed records
              </span>
            </div>
          </div>

          {/* Completed Inspections Cards */}
          {filteredHistoryInspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl">
              <History className="mx-auto h-10 w-10 text-slate-400 dark:text-mist-500 mb-3" />
              <h3 className="text-base font-bold text-navy-950 dark:text-white">
                No Completed Inspections Found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-mist-400 max-w-md mx-auto">
                No inspection records match your search or department filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistoryInspections.map((item) => {
                const dept = getInspectionDepartment(item);
                const isExpanded = expandedChecklistId === item.id;
                const itemsCount = item.items?.length ?? 0;
                const passedItems = (item.items ?? []).filter((ci) => ci.passed).length;
                const score = item.score ?? 100;
                const isTargetSelected = selectedInspectionId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`p-5 rounded-3xl border backdrop-blur-xl shadow-sm space-y-4 transition ${
                      isTargetSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                        : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-ink-900/80 hover:border-emerald-500/30'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                          <span className="block text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.roomNumber}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-navy-950 dark:text-white">
                              {item.roomType || `${dept.name} Location`}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-ink-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300">
                              {dept.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-mist-400">
                            {INSPECTION_TYPE_LABELS[item.type] || item.type}
                          </div>
                        </div>
                      </div>

                      {/* Score and Status Badges */}
                      <div className="flex items-center gap-2">
                        {/* Score Pill */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          <Award className="h-4 w-4" />
                          <span>{score}% Quality Score</span>
                        </div>

                        {/* Passed Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-ink-950">
                          <Check className="h-3 w-3 stroke-[3]" />
                          Passed & Verified
                        </span>
                      </div>
                    </div>

                    {/* Inspection Notes & Findings */}
                    <div className="text-xs text-slate-600 dark:text-mist-300 bg-slate-50 dark:bg-ink-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                      <div className="font-semibold text-navy-950 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Inspector Findings & Certification:</span>
                      </div>
                      <p className="text-slate-600 dark:text-mist-300">
                        {item.notes || 'Full standard compliance verified. Room and amenities cleared for executive guest occupancy.'}
                      </p>
                    </div>

                    {/* Verification Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-mist-400">
                      <div>
                        <Calendar className="inline h-3 w-3 mr-1" />
                        <span>Completed: <strong>{item.inspectedAt || item.completedAt || 'Today 09:00'}</strong></span>
                      </div>
                      <div>
                        <ShieldCheck className="inline h-3 w-3 mr-1" />
                        <span>Verified by: <strong>{item.inspectedBy || 'Quality Inspector'}</strong></span>
                      </div>
                      <div>
                        <CheckCircle2 className="inline h-3 w-3 mr-1 text-emerald-500" />
                        <span>Checklist: <strong>{passedItems}/{itemsCount || 4} checks passed (100%)</strong></span>
                      </div>
                    </div>

                    {/* Expandable Checklist View */}
                    {isExpanded && item.items && item.items.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <h4 className="text-xs font-bold text-navy-950 dark:text-white">
                          Verified Quality Checklist Items ({itemsCount}):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.items.map((chk) => (
                            <div
                              key={chk.id}
                              className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs flex items-start gap-2"
                            >
                              <div className="p-1 rounded-md bg-emerald-500 text-ink-950 mt-0.5">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-navy-950 dark:text-white">{chk.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-mist-500 capitalize">
                                  {chk.category} · Verified passed
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar with Photos & Videos Option */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setExpandedChecklistId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{isExpanded ? 'Hide Verified Items' : `View Verified Items (${itemsCount || 4})`}</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Option to View Photos and Videos uploaded by Inspection Team */}
                        <button
                          type="button"
                          onClick={() => {
                            setViewingMediaInspection(item);
                            setSelectedPreviewMedia(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold transition shadow-sm"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Photos & Videos (4)</span>
                        </button>

                        <span className="text-[11px] text-slate-400 dark:text-mist-500">
                          Audit ID: <span className="font-mono">{item.id}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FRAME: CREATE INSPECTIONS FORM (IN ANOTHER FRAME WITH BACKGROUND BLUR) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-inspection-modal-title"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 grid place-items-center border border-amber-500/30">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="create-inspection-modal-title" className="text-base font-bold text-navy-950 dark:text-white">
                    Create Department Inspection Directive
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Issue operational parameters and quality deadlines to department teams.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmitDirective} className="space-y-4">
                {/* 1. Target Department in a Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                    Target Department
                  </label>
                  <select
                    id="inspection-department-select"
                    value={createDeptId}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs font-semibold text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="housekeeping">Housekeeping</option>
                    <option value="engineering">Maintenance & Engineering</option>
                    <option value="food-beverages">Food & Beverages</option>
                    <option value="wellness">Wellness</option>
                  </select>
                </div>

                {/* 2. Inspection Location Dropdown (All, Floor, Rooms) with dynamic input box */}
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                      Inspection Location
                    </label>
                    <select
                      id="inspection-location-scope-select"
                      value={locationScope}
                      onChange={(e) => setLocationScope(e.target.value as 'all' | 'floor' | 'rooms')}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs font-semibold text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    >
                      <option value="all">All (Property-wide / Common Areas)</option>
                      <option value="floor">Floor</option>
                      <option value="rooms">Rooms</option>
                    </select>
                  </div>

                  {/* Dynamic Box for Floor Number */}
                  {locationScope === 'floor' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                        Floor Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                        <input
                          type="text"
                          id="inspection-floor-input"
                          required
                          value={floorInput}
                          onChange={(e) => setFloorInput(e.target.value)}
                          placeholder="Enter floor number (e.g. 3, 4, Floor 5)"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Box for Room Number */}
                  {locationScope === 'rooms' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                        Room Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-mist-400" />
                        <input
                          type="text"
                          id="inspection-room-input"
                          required
                          value={roomInput}
                          onChange={(e) => setRoomInput(e.target.value)}
                          placeholder="Enter room number (e.g. 402, Suite 518)"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Inspection Type Dropdown (Changes according to the four departments) & Priority Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                      Inspection Type
                    </label>
                    <select
                      id="inspection-type-select"
                      value={createType}
                      onChange={(e) => setCreateType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    >
                      {(DEPARTMENT_INSPECTION_TYPES[createDeptId] || DEPARTMENT_INSPECTION_TYPES.housekeeping).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                      Priority Level
                    </label>
                    <select
                      id="inspection-priority-select"
                      value={createPriority}
                      onChange={(e) => setCreatePriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    >
                      <option value="normal">Normal</option>
                      <option value="vip">VIP Prep</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* 4. Deadline Section with Clock Option & Manual Input Box Underneath */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300">
                    Inspection Deadline & Target Time
                  </label>

                  {/* Clock Option: Exact Time Input with AM and PM options inside */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 pointer-events-none" />
                      <input
                        type="time"
                        id="inspection-clock-time-input"
                        value={clockTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setClockTime(val);
                          if (val) {
                            const { time12, period } = format12HourTime(val);
                            setClockPeriod(period);
                            setManualDeadline(`Today ${time12} ${period}`);
                          }
                        }}
                        className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />

                      {/* AM and PM options inside the clock control */}
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          id="clock-period-am"
                          onClick={() => handlePeriodToggle('AM')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            clockPeriod === 'AM'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          id="clock-period-pm"
                          onClick={() => handlePeriodToggle('PM')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            clockPeriod === 'PM'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-500 dark:text-mist-400 hover:text-navy-950 dark:hover:text-white'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>

                    {clockTime && (
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-amber-500" />
                        Today {format12HourTime(clockTime).time12} {clockPeriod}
                      </span>
                    )}
                  </div>

                  {/* Box Underneath for Manual Time Writing */}
                  <div>
                    <input
                      type="text"
                      id="inspection-manual-time-input"
                      value={manualDeadline}
                      onChange={(e) => setManualDeadline(e.target.value)}
                      placeholder="Or manually write time (e.g. Today 16:30, Within 2 Hours, Tomorrow 10:00 AM...)"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* 5. Instructions & Standard */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-mist-300 mb-1.5">
                    Directive Instructions & Quality Standard
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={createInstructions}
                    onChange={(e) => setCreateInstructions(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950/70 text-xs text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-mist-500">
                    Standard pre-loaded from {selectedDepartment.id === 'wellness' ? 'Wellness' : selectedDepartment.name} specifications.
                  </p>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-mist-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-ink-950 font-bold text-xs shadow-md transition"
                  >
                    <Send className="h-4 w-4" />
                    Dispatch Directive to {selectedDepartment.id === 'wellness' ? 'Wellness' : selectedDepartment.name}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FRAME: PHOTOS & VIDEOS UPLOADED BY INSPECTION TEAM */}
      {/* ========================================================================= */}
      {viewingMediaInspection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setViewingMediaInspection(null);
            setSelectedPreviewMedia(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 grid place-items-center border border-purple-500/30">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-950 dark:text-white">
                      Inspection Photos & Videos · {viewingMediaInspection.roomNumber}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                      {getInspectionDepartment(viewingMediaInspection).name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
                    Photographic proof & video walk-throughs uploaded directly by the active inspection crew.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewingMediaInspection(null);
                  setSelectedPreviewMedia(null);
                }}
                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-navy-950 dark:hover:text-white transition"
                aria-label="Close media gallery"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-header Filter Strip */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-ink-950/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(['all', 'photo', 'video'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMediaFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      mediaFilter === filter
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-300 hover:text-navy-950 dark:hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'All Media (4)' : filter === 'photo' ? 'Photos (3)' : 'Videos (1)'}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-mono text-slate-400 dark:text-mist-500 hidden sm:block">
                Inspector: {viewingMediaInspection.inspectedBy || viewingMediaInspection.assignedSupervisorName || 'Department Team'}
              </div>
            </div>

            {/* Media Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Detailed Expanded Preview if an item is selected */}
              {selectedPreviewMedia && (
                <div className="p-4 rounded-2xl border border-purple-500/40 bg-purple-500/10 dark:bg-purple-500/15 animate-fade-in space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                      {selectedPreviewMedia.type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                      Enlarged Inspection Evidence ({selectedPreviewMedia.type.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewMedia(null)}
                      className="text-xs text-slate-400 hover:text-navy-950 dark:hover:text-white"
                    >
                      Close Preview ✕
                    </button>
                  </div>
                  <div className={`h-48 rounded-xl bg-gradient-to-br ${selectedPreviewMedia.gradient} flex flex-col items-center justify-center text-white relative shadow-inner`}>
                    {selectedPreviewMedia.type === 'video' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg">
                          <Play className="h-6 w-6 fill-white ml-0.5" />
                        </div>
                        <span className="text-xs font-mono font-bold bg-black/40 px-2 py-0.5 rounded-md">
                          Playing Inspection Recording ({selectedPreviewMedia.duration})
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-12 w-12 opacity-80" />
                        <span className="text-xs font-bold bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm">
                          1080p High-Resolution Photographic Evidence
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 text-[10px] font-mono bg-black/60 px-2 py-0.5 rounded-full text-mist-200">
                      Watermark: Verified {selectedPreviewMedia.timestamp}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-950 dark:text-white">
                      {selectedPreviewMedia.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-mist-300 mt-1">
                      {selectedPreviewMedia.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid of uploaded inspection photos & videos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getInspectionMedia(viewingMediaInspection)
                  .filter((m) => mediaFilter === 'all' || m.type === mediaFilter)
                  .map((media) => (
                    <div
                      key={media.id}
                      onClick={() => setSelectedPreviewMedia(media)}
                      className="cursor-pointer group p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-purple-500/40 hover:shadow-md transition space-y-3"
                    >
                      {/* Media Simulated Thumbnail */}
                      <div className={`h-36 rounded-xl bg-gradient-to-br ${media.gradient} relative overflow-hidden flex items-center justify-center text-white shadow-inner`}>
                        {media.type === 'video' ? (
                          <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition">
                            <Play className="h-5 w-5 fill-white ml-0.5" />
                          </div>
                        ) : (
                          <Camera className="h-8 w-8 opacity-70 group-hover:scale-110 transition" />
                        )}

                        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {media.type === 'video' ? `Video · ${media.duration}` : 'Photo · JPEG'}
                        </span>

                        <span className="absolute bottom-2.5 right-2.5 text-[9px] font-mono px-2 py-0.5 rounded bg-black/50 text-mist-300">
                          {media.timestamp}
                        </span>
                      </div>

                      {/* Content Info */}
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-navy-950 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition line-clamp-1">
                            {media.title}
                          </h4>
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 shrink-0">
                            View ↗
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-mist-400 mt-1 line-clamp-2 leading-relaxed">
                          {media.notes}
                        </p>
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400 dark:text-mist-500 font-mono">
                          <span>By: {media.uploadedBy}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{media.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-ink-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-mist-400">
                Inspection evidence is cryptographically signed and archived for GM audits.
              </span>
              <button
                type="button"
                onClick={() => {
                  setViewingMediaInspection(null);
                  setSelectedPreviewMedia(null);
                }}
                className="px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
