'use client';

import { useState, useMemo } from 'react';
import {
  HeartPulse,
  Sparkles,
  AlertTriangle,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  Search,
  Plus,
  Send,
  PhoneCall,
  ShieldAlert,
  Activity,
  BedDouble,
  User,
  Crown,
  FileText,
  Filter,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { AssignTaskModal } from '@/components/dispatcher/AssignTaskModal';
import type { WorkItem, StaffAccount, DispatcherDepartment } from '@/types/demo';

interface SupervisorMedicalTherapyTabProps {
  tasks?: WorkItem[];
  staffList?: StaffAccount[];
  department?: DispatcherDepartment;
}

const SEED_MEDICAL_TASKS: WorkItem[] = [
  {
    id: 'med-urg-1',
    title: 'Asthma Inhaler Emergency & Wheezing · Room 402',
    meta: 'Medical Urgency · Level 4 · Elena Rostova · Nebulizer Needed',
    status: 'Unassigned',
    chip: 'CRITICAL SLA 04:30',
    tone: 'danger',
    room: '402',
    floor: 4,
    guest: true,
    category: 'medical',
    department: 'Spa & Wellness',
    priority: 'critical',
    ref: 'MED-402-001',
    ackSlaDue: '09:47',
    ackStatus: 'pending',
    slaDue: '09:50 (5m Emergency Target)',
    createdAt: '09:42',
    description: 'Guest experiencing acute wheezing and shortness of breath following trans-Atlantic flight. Personal inhaler depleted. Requires emergency bronchodilator, portable nebulizer unit, and on-site nurse vital check immediately.',
    history: [{ at: '09:42', status: 'Unassigned', note: 'Emergency medical trigger received from Guest Portal' }],
  },
  {
    id: 'med-urg-2',
    title: 'Severe Peanut/Shellfish Allergic Reaction & Epipen Request · Room 305',
    meta: 'Medical Urgency · Level 3 · Marcus Chen · Epinephrine Protocol',
    status: 'Assigned',
    chip: 'Dispatched (Nurse Lin)',
    tone: 'danger',
    room: '305',
    floor: 3,
    guest: true,
    category: 'medical',
    department: 'Spa & Wellness',
    priority: 'critical',
    ref: 'MED-305-002',
    assignee: 'Nurse Sarah Lin (RN)',
    assigneeId: 'EMP-0121',
    assignedAt: '09:40',
    ackStatus: 'acknowledged',
    slaDue: '09:45',
    createdAt: '09:38',
    description: 'Guest reported tingling sensation in throat and facial hives after ordering room service starter. Auto-injector requested. First responder dispatch confirmed with medical kit.',
    history: [
      { at: '09:38', status: 'Unassigned', note: 'Guest allergy alert logged' },
      { at: '09:40', status: 'Assigned', note: 'Dispatched Nurse Sarah Lin (RN) with emergency kit' },
    ],
  },
  {
    id: 'med-urg-3',
    title: 'Diabetic Hypoglycemia Emergency Glucose Gel & BP Check · Room 210',
    meta: 'Medical Urgency · Level 2 · David Miller',
    status: 'Unassigned',
    chip: 'URGENT SLA 08:15',
    tone: 'danger',
    room: '210',
    floor: 2,
    guest: true,
    category: 'medical',
    department: 'Spa & Wellness',
    priority: 'urgent',
    ref: 'MED-210-003',
    ackSlaDue: '09:49',
    ackStatus: 'pending',
    slaDue: '09:55',
    createdAt: '09:44',
    description: 'Guest feeling faint, cold sweat, tremulousness. Blood glucose strip test assistance and rapid-acting dextrose/glucose gel kit requested.',
    history: [{ at: '09:44', status: 'Unassigned', note: 'Medical urgent dispatch pending' }],
  },
  {
    id: 'med-urg-4',
    title: 'Sprained Ankle R.I.C.E. Compression & Crutches Request · Room 108',
    meta: 'Medical Request · Level 1 · Chloe Bennett',
    status: 'Assigned',
    chip: 'Assigned (Nurse Lin)',
    tone: 'warning',
    room: '108',
    floor: 1,
    guest: true,
    category: 'medical',
    department: 'Spa & Wellness',
    priority: 'normal',
    ref: 'MED-108-004',
    assignee: 'Nurse Sarah Lin (RN)',
    assigneeId: 'EMP-0121',
    assignedAt: '09:25',
    slaDue: '09:55',
    createdAt: '09:20',
    description: 'Guest sustained lateral ankle inversion sprain while descending stairs. Cold cryo-pack, elastic compression bandage, and adjustable aluminum crutches required.',
    history: [
      { at: '09:20', status: 'Unassigned' },
      { at: '09:25', status: 'Assigned', note: 'Assigned to Nurse Sarah Lin (RN)' },
    ],
  },
];

const SEED_THERAPY_TASKS: WorkItem[] = [
  {
    id: 'ther-req-1',
    title: 'Deep Tissue Spinal Recovery Physiotherapy (60m) · Room 518',
    meta: 'Therapy · In-Suite · Priya Nair (VIP) · Preferred Slot 10:30',
    status: 'Unassigned',
    chip: 'VIP In-Suite Therapy',
    tone: 'accent',
    room: '518',
    floor: 5,
    guest: true,
    category: 'therapy',
    department: 'Spa & Wellness',
    priority: 'vip',
    ref: 'THER-518-001',
    ackSlaDue: '09:50',
    ackStatus: 'pending',
    slaDue: '10:30',
    createdAt: '09:30',
    description: 'VIP guest requested in-suite orthopedic spinal decompression and myofascial release session. Requires portable heated massage table, arnica recovery balms, and heated volcanic basalt stones.',
    history: [{ at: '09:30', status: 'Unassigned', note: 'VIP booking received from Guest Portal' }],
  },
  {
    id: 'ther-req-2',
    title: 'Ayurvedic Abhyanga & Warm Herbal Compress Therapy (90m) · Spa Suite 202',
    meta: 'Therapy · Spa Suite 202 · Elena Rostova · Assigned to Leila Vance',
    status: 'Assigned',
    chip: 'Assigned (Leila V.)',
    tone: 'info',
    room: 'Spa-202',
    floor: 2,
    guest: true,
    category: 'therapy',
    department: 'Spa & Wellness',
    priority: 'normal',
    ref: 'THER-202-002',
    assignee: 'Leila Vance',
    assigneeId: 'EMP-0119',
    assignedAt: '09:32',
    slaDue: '11:00',
    createdAt: '09:20',
    description: 'Full-body synchronized warm sesame oil massage with steamed botanical herbal poultice compress to relieve jetlag and restore lymphatic flow.',
    history: [
      { at: '09:20', status: 'Unassigned' },
      { at: '09:32', status: 'Assigned', note: 'Assigned to Leila Vance' },
    ],
  },
  {
    id: 'ther-req-3',
    title: 'Post-Flight Reflexology & Lower Extremity Lymphatic Drainage (45m) · Room 305',
    meta: 'Therapy · Level 3 · Marcus Chen · Unassigned',
    status: 'Unassigned',
    chip: 'Awaiting Therapist',
    tone: 'warning',
    room: '305',
    floor: 3,
    guest: true,
    category: 'therapy',
    department: 'Spa & Wellness',
    priority: 'normal',
    ref: 'THER-305-003',
    ackSlaDue: '09:55',
    ackStatus: 'pending',
    slaDue: '11:30',
    createdAt: '09:35',
    description: 'Acupressure foot reflexology and pneumatic circulation boots treatment for swollen calves and fatigue following 14-hour flight.',
    history: [{ at: '09:35', status: 'Unassigned', note: 'Guest therapy booking submitted' }],
  },
  {
    id: 'ther-req-4',
    title: 'Private Tibetan Sound Bath & Chakra Alignment Meditation (60m) · Pavilion Deck B',
    meta: 'Therapy · Deck B Pavilion · Sophia Lin · Assigned to T. Brandt',
    status: 'Assigned',
    chip: 'Assigned (T. Brandt)',
    tone: 'accent',
    room: 'Deck-B',
    floor: 3,
    guest: true,
    category: 'therapy',
    department: 'Spa & Wellness',
    priority: 'vip',
    ref: 'THER-DECK-004',
    assignee: 'T. Brandt',
    assigneeId: 'EMP-0110',
    assignedAt: '09:28',
    slaDue: '11:15',
    createdAt: '09:15',
    description: '7-chakra frequency quartz crystal bowl resonance therapy and guided breathwork session at outdoor oceanfront deck pavilion.',
    history: [
      { at: '09:15', status: 'Unassigned' },
      { at: '09:28', status: 'Assigned', note: 'Assigned to T. Brandt' },
    ],
  },
];

export function SupervisorMedicalTherapyTab({
  tasks = [],
  staffList = [],
  department = 'Wellness',
}: SupervisorMedicalTherapyTabProps) {
  const { state, assignDispatcherTask, notify } = useDemo();

  const [activeSubTab, setActiveSubTab] = useState<'medical' | 'therapy'>('medical');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'assigned' | 'completed'>('all');
  const [assignModalTask, setAssignModalTask] = useState<WorkItem | null>(null);
  const [emergencyAlertMsg, setEmergencyAlertMsg] = useState<string | null>(null);

  // Available staff accounts for wellness/medical
  const wellnessStaff = useMemo(() => {
    return (state.staffAccounts ?? []).filter((s) => {
      const d = (s.department || '').toLowerCase();
      return d.includes('spa') || d.includes('well');
    });
  }, [state.staffAccounts]);

  const medicalStaff = useMemo(() => {
    return wellnessStaff.filter((s) => {
      const skills = (s.skills || []).map((sk) => sk.toLowerCase()).join(' ');
      const name = s.name.toLowerCase();
      return name.includes('nurse') || name.includes('dr.') || skills.includes('medical') || skills.includes('first aid');
    });
  }, [wellnessStaff]);

  const therapyStaff = useMemo(() => {
    return wellnessStaff.filter((s) => {
      const skills = (s.skills || []).map((sk) => sk.toLowerCase()).join(' ');
      const name = s.name.toLowerCase();
      return skills.includes('therapy') || skills.includes('massage') || skills.includes('physio') || name.includes('leila') || name.includes('brandt');
    });
  }, [wellnessStaff]);

  // Combined tasks pool with guaranteed fallback seed items
  const allDepartmentTasks = useMemo(() => {
    const fromStore = [
      ...(state.items.department_dispatcher_supervisor ?? []),
      ...(state.items.department_dispatcher ?? []),
      ...tasks,
    ];
    const seedDefaults = [...SEED_MEDICAL_TASKS, ...SEED_THERAPY_TASKS];
    const merged = seedDefaults.map((s) => {
      const match = fromStore.find((t) => t.id === s.id);
      return match || s;
    });
    fromStore.forEach((t) => {
      if (!merged.some((m) => m.id === t.id)) {
        merged.push(t);
      }
    });
    return merged;
  }, [tasks, state.items]);

  // Medical Urgencies
  const medicalTasks = useMemo(() => {
    return allDepartmentTasks.filter((t) => {
      const cat = (t.category || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const meta = (t.meta || '').toLowerCase();
      const ref = (t.ref || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();

      return (
        cat === 'medical' ||
        ref.startsWith('med-') ||
        title.includes('asthma') ||
        title.includes('allergic') ||
        title.includes('glucose') ||
        title.includes('medical') ||
        title.includes('sprained') ||
        title.includes('emergency') ||
        meta.includes('medical') ||
        desc.includes('inhaler') ||
        desc.includes('epipen') ||
        desc.includes('nurse')
      );
    });
  }, [allDepartmentTasks]);

  // Therapy Requests
  const therapyTasks = useMemo(() => {
    return allDepartmentTasks.filter((t) => {
      const cat = (t.category || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const meta = (t.meta || '').toLowerCase();
      const ref = (t.ref || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();

      // Ensure it is not a medical emergency
      if (cat === 'medical' || ref.startsWith('med-')) return false;

      return (
        cat === 'therapy' ||
        ref.startsWith('ther-') ||
        ref.startsWith('well-') ||
        title.includes('therapy') ||
        title.includes('massage') ||
        title.includes('physiotherapy') ||
        title.includes('reflexology') ||
        title.includes('sound bath') ||
        title.includes('ayurvedic') ||
        title.includes('hydrotherapy') ||
        meta.includes('therapy') ||
        desc.includes('physiotherapy') ||
        desc.includes('massage')
      );
    });
  }, [allDepartmentTasks]);

  // Filtered Medical
  const filteredMedical = useMemo(() => {
    return medicalTasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchRoom = (t.room || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchRef = (t.ref || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRoom && !matchDesc && !matchRef && !matchAssignee) return false;
      }
      if (statusFilter === 'unassigned' && t.status !== 'Unassigned' && t.status !== 'Received') return false;
      if (statusFilter === 'assigned' && t.status !== 'Assigned') return false;
      if (statusFilter === 'completed' && t.status !== 'Completed') return false;
      return true;
    });
  }, [medicalTasks, searchQuery, statusFilter]);

  // Filtered Therapy
  const filteredTherapy = useMemo(() => {
    return therapyTasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchRoom = (t.room || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchRef = (t.ref || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRoom && !matchDesc && !matchRef && !matchAssignee) return false;
      }
      if (statusFilter === 'unassigned' && t.status !== 'Unassigned' && t.status !== 'Received') return false;
      if (statusFilter === 'assigned' && t.status !== 'Assigned') return false;
      if (statusFilter === 'completed' && t.status !== 'Completed') return false;
      return true;
    });
  }, [therapyTasks, searchQuery, statusFilter]);

  // Counts
  const unassignedMedicalCount = medicalTasks.filter((t) => t.status === 'Unassigned' || t.status === 'Received').length;
  const unassignedTherapyCount = therapyTasks.filter((t) => t.status === 'Unassigned' || t.status === 'Received').length;
  const criticalMedicalCount = medicalTasks.filter((t) => t.priority === 'critical' && t.status !== 'Completed').length;

  // 1-Click Fast Dispatch for Medical
  const handleQuickMedicalDispatch = (taskId: string) => {
    const targetNurse = medicalStaff[0] || wellnessStaff[0];
    if (targetNurse) {
      assignDispatcherTask(taskId, targetNurse.employeeId);
      notify(`Medical responder ${targetNurse.name} dispatched with emergency kit!`);
    } else {
      setAssignModalTask(medicalTasks.find((t) => t.id === taskId) || null);
    }
  };

  // 1-Click Fast Assign for Therapy
  const handleQuickTherapyAssign = (taskId: string) => {
    const targetTherapist = therapyStaff.find((s) => s.availability === 'on_duty') || therapyStaff[0] || wellnessStaff[0];
    if (targetTherapist) {
      assignDispatcherTask(taskId, targetTherapist.employeeId);
      notify(`Therapy session assigned to licensed therapist ${targetTherapist.name}.`);
    } else {
      setAssignModalTask(therapyTasks.find((t) => t.id === taskId) || null);
    }
  };

  const handleEscalateExternal = (task: WorkItem) => {
    setEmergencyAlertMsg(`Ambulance & External Emergency Medical Protocol activated for ${task.title} (Room ${task.room}). Front Desk & Duty Manager alerted.`);
    notify(`Emergency protocol triggered for ${task.ref || task.title}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Department Hub */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h1 className="text-xl font-bold font-display text-white">
                Medical & Therapy Dispatch Center
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                Wellness Department
              </span>
            </div>
            <p className="text-xs text-mist-300 mt-1">
              Supervise in-house medical emergencies, first responder triage, and schedule licensed therapeutic sessions.
            </p>
          </div>

          {/* Quick Staff Availability Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-mist-300 flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
              <span>{medicalStaff.length > 0 ? medicalStaff[0].name : 'Nurse Sarah Lin (RN)'} (On-Duty)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-mist-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{therapyStaff.length} Licensed Therapists Active</span>
            </div>
          </div>
        </div>

        {/* Emergency Alert Banner if triggered */}
        {emergencyAlertMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{emergencyAlertMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setEmergencyAlertMsg(null)}
              className="text-xs text-rose-300 underline font-bold shrink-0 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two Options Navigation Switcher: Medical Urgencies vs Therapy */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('medical');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer ${
              activeSubTab === 'medical'
                ? 'bg-rose-500 text-white shadow-rose-500/25 ring-1 ring-rose-400'
                : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            <HeartPulse className="h-4 w-4 text-rose-200" />
            <span>Medical Urgencies</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'medical'
                  ? 'bg-white/20 text-white'
                  : unassignedMedicalCount > 0
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-white/10 text-mist-300'
              }`}
            >
              {unassignedMedicalCount > 0 ? `${unassignedMedicalCount} Pending` : `${medicalTasks.length} Total`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('therapy');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer ${
              activeSubTab === 'therapy'
                ? 'bg-emerald-500 text-ink-950 shadow-emerald-500/25 font-black ring-1 ring-emerald-400'
                : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Therapy</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'therapy'
                  ? 'bg-ink-950/20 text-ink-950'
                  : unassignedTherapyCount > 0
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-white/10 text-mist-300'
              }`}
            >
              {unassignedTherapyCount > 0 ? `${unassignedTherapyCount} Pending` : `${therapyTasks.length} Total`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-4 backdrop-blur-md shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'medical'
                  ? 'Search medical requests by room, symptom, medication, guest...'
                  : 'Search therapy sessions by room, therapy type, guest, therapist...'
              }
              className="w-full rounded-2xl border border-white/10 bg-ink-950/60 pl-10 pr-4 py-2 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'unassigned'
                  ? 'bg-rose-500 text-white font-bold shadow'
                  : 'bg-white/[0.04] text-rose-300 hover:text-white'
              }`}
            >
              Unassigned ({activeSubTab === 'medical' ? unassignedMedicalCount : unassignedTherapyCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'assigned'
                  ? 'bg-amber-400 text-ink-950 font-bold shadow'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white'
              }`}
            >
              Assigned
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-ink-950 font-bold shadow'
                  : 'bg-white/[0.04] text-mist-300 hover:text-white'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- OPTION 1: MEDICAL URGENCIES VIEW ----------------- */}
      {activeSubTab === 'medical' && (
        <div className="space-y-4">
          {/* Medical Response SLA Strip */}
          <div className="p-4 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-ink-900/90 to-rose-950/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0">
                <HeartPulse className="h-5 w-5 animate-pulse text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Guest Medical Urgency & Emergency Triage</span>
                  {criticalMedicalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      {criticalMedicalCount} Critical Action Required
                    </span>
                  )}
                </h3>
                <p className="text-xs text-mist-300">
                  Target responder bedside arrival: <strong>&lt; 5 minutes</strong>. Automatic escalation to Emergency Services if unacknowledged.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono">
              <span className="px-3 py-1 rounded-xl bg-white/[0.06] text-mist-300 border border-white/10">
                Defibrillator / AED: Level 2 & 4
              </span>
            </div>
          </div>

          {/* Medical Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedical.map((task) => {
              const isCritical = task.priority === 'critical';
              const isUrgent = task.priority === 'urgent';
              const isAssigned = task.status === 'Assigned' || Boolean(task.assignee);
              const isResolved = task.status === 'Completed';

              return (
                <div
                  key={task.id}
                  className={`rounded-3xl border p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4 transition-all ${
                    isCritical
                      ? 'border-rose-500/50 bg-gradient-to-b from-rose-950/30 to-ink-900/95 ring-1 ring-rose-500/30 shadow-rose-950/30'
                      : isUrgent
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-ink-900/95'
                      : 'border-white/10 bg-ink-900/90'
                  }`}
                >
                  {/* Top Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-rose-400">
                            {task.ref || task.id}
                          </span>
                          {task.room && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/[0.06] text-white border border-white/10 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-rose-400" />
                              Room {task.room}
                              {task.floor ? ` · Floor ${task.floor}` : ''}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-rose-500 text-white animate-pulse'
                                : isUrgent
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-white/10 text-mist-300'
                            }`}
                          >
                            {isCritical ? 'CRITICAL EMERGENCY' : task.priority || 'Normal'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5 leading-snug">
                          {task.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isAssigned
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          <Activity className="h-3 w-3 shrink-0" />
                          <span>{task.status}</span>
                        </span>
                        <p className="text-[10px] font-mono text-mist-400 mt-1">
                          Reported: {task.createdAt || 'Just now'}
                        </p>
                      </div>
                    </div>

                    {/* Guest Description & Medical Symptoms */}
                    <div className="p-3.5 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                          Guest Symptoms & Clinical Request:
                        </span>
                        {task.guest && (
                          <span className="text-mist-300 font-semibold">
                            Guest In-House
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-100 leading-relaxed font-medium">
                        {task.description || task.meta}
                      </p>
                    </div>

                    {/* Assigned Medical Responder Info */}
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isAssigned ? 'bg-emerald-500 text-ink-950' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isAssigned ? <UserCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs">
                            {task.assignee ? task.assignee : 'Unassigned — Immediate Responder Required'}
                          </p>
                          <p className="text-[11px] text-mist-400 truncate">
                            {task.assignee
                              ? `ID: ${task.assigneeId || 'EMP-0121'} · Assigned at ${task.assignedAt || '09:40'}`
                              : 'Medical supervisor action required'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          SLA: {task.slaDue || '5m Target'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-white/[0.08] mt-auto flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEscalateExternal(task)}
                        className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        title="Call Ambulance / Escalate to Emergency Services"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Escalate External (911)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleQuickMedicalDispatch(task.id)}
                          className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-lg shadow-rose-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>1-Click Dispatch Nurse</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAssignModalTask(task)}
                        className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-amber-300" />
                        <span>{isAssigned ? 'Reassign Medical' : 'Assign Responder'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMedical.length === 0 && (
              <div className="col-span-full py-16 px-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 text-mist-400 mx-auto grid place-items-center">
                  <HeartPulse className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">No medical urgencies</h3>
                <p className="text-xs text-mist-400 max-w-sm mx-auto">
                  All guest medical tickets are acknowledged or resolved. On-call medical responders are in standby status.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- OPTION 2: THERAPY VIEW ----------------- */}
      {activeSubTab === 'therapy' && (
        <div className="space-y-4">
          {/* Therapy Schedule Banner */}
          <div className="p-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-ink-900/90 to-emerald-950/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Guest Therapy Requests & Treatment Schedule</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Spa & Wellness Wing
                  </span>
                </h3>
                <p className="text-xs text-mist-300">
                  Assign licensed physical therapists, ayurvedic specialists, and reflexologists to guest in-suite or cabana bookings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono">
              <span className="px-3 py-1 rounded-xl bg-white/[0.06] text-mist-300 border border-white/10">
                Spa Suite 202 · Oceanfront Deck B
              </span>
            </div>
          </div>

          {/* Therapy Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTherapy.map((task) => {
              const isAssigned = task.status === 'Assigned' || Boolean(task.assignee);
              const isVip = task.priority === 'vip';
              const isResolved = task.status === 'Completed';

              return (
                <div
                  key={task.id}
                  className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4 transition-all hover:border-emerald-500/40"
                >
                  {/* Top Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {task.ref || task.id}
                          </span>
                          {task.room && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/[0.06] text-white border border-white/10 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-400" />
                              {task.room.startsWith('Spa') ? task.room : `Room ${task.room}`}
                              {task.floor ? ` · Floor ${task.floor}` : ''}
                            </span>
                          )}
                          {isVip && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              VIP Guest
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5 leading-snug">
                          {task.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isAssigned
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          <Sparkles className="h-3 w-3 shrink-0" />
                          <span>{task.status}</span>
                        </span>
                        <p className="text-[10px] font-mono text-mist-400 mt-1">
                          Slot: {task.slaDue || '10:30 AM'}
                        </p>
                      </div>
                    </div>

                    {/* Therapy Details & Protocol */}
                    <div className="p-3.5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-emerald-400" />
                          Therapy Specification & Focus Areas:
                        </span>
                        <span className="text-mist-300 font-mono text-[10px]">
                          60–90 min session
                        </span>
                      </div>
                      <p className="text-xs text-mist-200 leading-relaxed font-medium">
                        {task.description || task.meta}
                      </p>
                    </div>

                    {/* Assigned Therapist Strip */}
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isAssigned ? 'bg-emerald-400 text-ink-950' : 'bg-white/10 text-mist-400'
                          }`}
                        >
                          {isAssigned ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs">
                            {task.assignee ? task.assignee : 'Unassigned — Awaiting Therapist Assignment'}
                          </p>
                          <p className="text-[11px] text-mist-400 truncate">
                            {task.assignee
                              ? `Licensed Fulfiller · Assigned at ${task.assignedAt || '09:30'}`
                              : 'Select from certified wellness staff'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {isAssigned ? 'Confirmed' : 'Needs Assignment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-white/[0.08] mt-auto flex items-center justify-between gap-2">
                    <span className="text-[11px] text-mist-400 font-medium">
                      {isAssigned ? 'Session scheduled with fulfiller' : 'Ready for assignment'}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleQuickTherapyAssign(task.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>1-Click Assign Therapist</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAssignModalTask(task)}
                        className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-amber-300" />
                        <span>{isAssigned ? 'Reassign Therapist' : 'Assign Therapist'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTherapy.length === 0 && (
              <div className="col-span-full py-16 px-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 text-mist-400 mx-auto grid place-items-center">
                  <Sparkles className="h-6 w-6 text-mist-400" />
                </div>
                <h3 className="text-sm font-bold text-white">No therapy bookings found</h3>
                <p className="text-xs text-mist-400 max-w-sm mx-auto">
                  No active therapy requests match the current search or status filter.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reusable Task Assignment Modal */}
      {assignModalTask && (
        <AssignTaskModal
          task={assignModalTask}
          department="Wellness"
          lockDepartment={true}
          onClose={() => setAssignModalTask(null)}
          onAssigned={(name) => {
            notify(`Task successfully assigned to ${name}!`);
            setAssignModalTask(null);
          }}
        />
      )}
    </div>
  );
}

