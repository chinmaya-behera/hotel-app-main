'use client';

import { useState, useRef, useMemo, useEffect, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Crown,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Layers,
  MapPin,
  Play,
  Power,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Star,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { FULFILLER_PROFILES, type FulfillerProfile, taskMatchesFulfillerDept, taskMatchesFulfillerAssignee, isTaskAssignedToProfile } from './fulfillerProfiles';
import { cn, statusTone } from '@/lib/utils';
import type { WorkItem } from '@/types/demo';
import { BreakRequestModal } from './BreakRequestModal';
import { useBreakRequest, type DutyRequestType } from './breakRequests';

type PrimaryView = 'my_tasks' | 'all_tasks';
type MyTasksFilter = 'all' | 'pending' | 'in_progress' | 'blocked' | 'overdue' | 'completed';

const BLOCKER_REASONS = [
  'Guest requested privacy (Do Not Disturb)',
  'Room locked / no answer',
  'Awaiting fresh linen or minibar stock',
  'Technical / plumbing issue requires Engineering',
  'Physical safety hazard inside room',
  'Others',
];

const REASSIGN_REASONS = [
  'Assigned room is currently DND / guest sleeping',
  'Urgent spill / turnover needed on another floor',
  'Missing cleaning equipment / chemical supplies',
  'Shift schedule ending / shift handover required',
  'Language / guest communication barrier',
  'Others',
];

const SAMPLE_PROOF_PHOTOS: Record<string, string> = {
  fnb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23141417'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%231c1c20' stroke='%23c8a96e' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%23c8a96e' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%23dfc187' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Dining Service Delivered</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Tray Staged · Temperature Verified · Flutes Placed</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23c8a96e'/><text x='200' y='238' fill='%23141417' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
  housekeeping: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23141417'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%231c1c20' stroke='%23c8a96e' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%23c8a96e' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%23dfc187' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Room Turnover Completed</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Fresh Linens · Sanitized · Turndown Standard</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23c8a96e'/><text x='200' y='238' fill='%23141417' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
  wellness: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23141417'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%231c1c20' stroke='%23c8a96e' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%23c8a96e' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%23dfc187' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Spa Suite Prepared</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Aromatherapy Setup · Fresh Towels · Ambiance Ready</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23c8a96e'/><text x='200' y='238' fill='%23141417' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
  maintenance: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23141417'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%231c1c20' stroke='%23c8a96e' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%23c8a96e' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%23dfc187' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Engineering Repair Tested</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Thermostat Calibrated · Leak Free · Functional</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23c8a96e'/><text x='200' y='238' fill='%23141417' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
};

const SAMPLE_BLOCKER_PHOTOS: { label: string; url: string }[] = [
  {
    label: 'DND Door Sign',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%231f1d18'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2328251e' stroke='%23f43f5e' stroke-width='2'/><circle cx='200' cy='100' r='36' fill='%23f43f5e' fill-opacity='0.15'/><circle cx='200' cy='100' r='24' fill='%23f43f5e' fill-opacity='0.25'/><rect x='182' y='96' width='36' height='8' rx='4' fill='%23f43f5e'/><text x='200' y='170' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>DO NOT DISTURB</text><text x='200' y='198' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Guest Door Sign Active · Privacy Requested</text><rect x='110' y='225' width='180' height='28' rx='8' fill='%23f43f5e'/><text x='200' y='244' fill='%23ffffff' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>BLOCKER EVIDENCE</text></svg>",
  },
  {
    label: 'Room Locked',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%231f1d18'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2328251e' stroke='%23f59e0b' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%23f59e0b' fill-opacity='0.15'/><rect x='188' y='88' width='24' height='20' rx='4' fill='%23f59e0b'/><path d='M192 88V80a8 8 0 0 1 16 0v8' stroke='%23f59e0b' stroke-width='4' fill='none'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Door Deadbolt Locked</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Keycard Access Denied · Internal Latch Engaged</text><rect x='110' y='222' width='180' height='28' rx='8' fill='%23f59e0b'/><text x='200' y='241' fill='%2314120e' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>BLOCKER EVIDENCE</text></svg>",
  },
  {
    label: 'Physical Hazard',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%231f1d18'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2328251e' stroke='%23f43f5e' stroke-width='2'/><polygon points='200,60 236,125 164,125' fill='%23f43f5e' fill-opacity='0.2' stroke='%23f43f5e' stroke-width='3'/><line x1='200' y1='82' x2='200' y2='105' stroke='%23f43f5e' stroke-width='4' stroke-linecap='round'/><circle cx='200' cy='115' r='2.5' fill='%23f43f5e'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Physical Hazard / Leak</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Safety Barrier Required · Escalated to Engineering</text><rect x='110' y='222' width='180' height='28' rx='8' fill='%23f43f5e'/><text x='200' y='241' fill='%23ffffff' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>BLOCKER EVIDENCE</text></svg>",
  },
  {
    label: 'Missing Supplies',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%231f1d18'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2328251e' stroke='%2338bdf8' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%2338bdf8' fill-opacity='0.15'/><rect x='180' y='82' width='40' height='30' rx='4' fill='none' stroke='%2338bdf8' stroke-width='3'/><line x1='180' y1='92' x2='220' y2='92' stroke='%2338bdf8' stroke-width='2'/><text x='200' y='165' fill='%23f7f4ed' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Out of Stock / Linen</text><text x='200' y='192' fill='%23d9cebe' font-size='12' font-family='sans-serif' text-anchor='middle'>Storage Pantry Empty · Awaiting Laundry Delivery</text><rect x='110' y='222' width='180' height='28' rx='8' fill='%2338bdf8'/><text x='200' y='241' fill='%2314120e' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>BLOCKER EVIDENCE</text></svg>",
  },
];


function FulfillerModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTarget(document.getElementById('fulfiller-phone-shell') || (typeof document !== 'undefined' ? document.body : null));
  }, []);

  if (!mounted || !target) return null;
  return createPortal(children, target);
}

function isFoodAndBeverageTask(task: WorkItem): boolean {
  const dept = (task.department || '').toLowerCase();
  const cat = (task.category || '').toLowerCase();
  const title = (task.title || '').toLowerCase();
  const meta = (task.meta || '').toLowerCase();

  return (
    dept.includes('food') ||
    dept.includes('beverage') ||
    dept.includes('dining') ||
    dept.includes('f&b') ||
    cat.includes('food') ||
    cat.includes('dining') ||
    cat.includes('fnb') ||
    cat.includes('room_service') ||
    title.includes('dining') ||
    title.includes('breakfast') ||
    title.includes('dinner') ||
    title.includes('lunch') ||
    title.includes('tea') ||
    title.includes('meal') ||
    title.includes('platter') ||
    title.includes('coffee') ||
    title.includes('dessert') ||
    title.includes('beverage') ||
    meta.includes('dining') ||
    meta.includes('in-room dining') ||
    meta.includes('food')
  );
}

interface FulfillerTasksTabProps {
  profile?: FulfillerProfile;
}

export function FulfillerTasksTab({ profile }: FulfillerTasksTabProps) {
  const activeProfile = profile || FULFILLER_PROFILES.housekeeping;
  const { state, advance, attachTaskPhoto, requestTaskReassignment, claimTask, notify, setFulfillerAvailability } = useDemo();
  const isLight = state.theme === 'light';

  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [dutyModalInitialType, setDutyModalInitialType] = useState<DutyRequestType>('break');
  const { breakRequest, approveBreakRequest, completeBreakRequest } = useBreakRequest();

  const currentAvail = state.fulfillerAvailability ?? 'on_duty';
  const isOnBreak = currentAvail === 'break';
  const isOffDuty = currentAvail === 'off_duty';

  // Primary view: "my_tasks" vs "all_tasks"
  const [primaryView, setPrimaryView] = useState<PrimaryView>('my_tasks');
  const [myFilter, setMyFilter] = useState<MyTasksFilter>('all');

  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [blockerModalTask, setBlockerModalTask] = useState<WorkItem | null>(null);
  const [reassignModalTask, setReassignModalTask] = useState<WorkItem | null>(null);
  const [blockerReason, setBlockerReason] = useState(BLOCKER_REASONS[0]);
  const [customBlockerReason, setCustomBlockerReason] = useState('');
  const [reassignReason, setReassignReason] = useState(REASSIGN_REASONS[0]);
  const [customReassignReason, setCustomReassignReason] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  // Blocker Photo Upload state & refs
  const [blockerPhotoPreview, setBlockerPhotoPreview] = useState<string | null>(null);
  const [blockerPhotoError, setBlockerPhotoError] = useState<string | null>(null);
  const blockerGalleryFileInputRef = useRef<HTMLInputElement>(null);
  const blockerCameraFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  // Photo Upload Modal (Optional upload across all departments)
  const [photoModalTask, setPhotoModalTask] = useState<WorkItem | null>(null);
  const [photoModalPreview, setPhotoModalPreview] = useState<string | null>(null);
  const [photoModalError, setPhotoModalError] = useState<string | null>(null);

  // Helper to determine if a task is truly an unassigned queue item waiting to be claimed
  const isQueueTaskUnassigned = (task: WorkItem): boolean => {
    const isUnassignedStatus = task.status === 'Unassigned' || task.status === 'Received';
    const hasNoAssignee = !task.assignee || task.assignee.trim() === '' || task.assignee.toLowerCase() === 'unassigned';
    const notActiveOrDone =
      task.status !== 'Accepted' &&
      task.status !== 'In progress' &&
      task.status !== 'On the way' &&
      task.status !== 'Blocked' &&
      task.status !== 'Awaiting inspection' &&
      task.status !== 'Completed' &&
      task.status !== 'Reassigned' &&
      task.status !== 'Reassignment requested';
    return isUnassignedStatus && hasNoAssignee && notActiveOrDone;
  };

  // All combined department tasks across queues for the active department (excluding colleagues' tasks and supervisor audits)
  const allDepartmentTasks = useMemo(() => {
    const rawFulfiller = state.items.task_fulfiller ?? [];
    const ddItems = state.items.department_dispatcher ?? [];
    const combined = [...rawFulfiller, ...ddItems].filter(
      (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i,
    );

    return combined
      .filter((t) => !t.id.startsWith('sup-'))
      .filter((t) => taskMatchesFulfillerDept(t, activeProfile.deptKey))
      .filter((t) => {
        // Only keep tasks assigned to this fulfiller OR unassigned queue tasks waiting to be claimed
        const isUnassigned = isQueueTaskUnassigned(t);
        const isAssignedToMe = isTaskAssignedToProfile(t, activeProfile);
        return isUnassigned || isAssignedToMe;
      });
  }, [state.items.task_fulfiller, state.items.department_dispatcher, activeProfile]);

  // My Tasks: Assigned to or claimed by active department employee (never open pool tasks)
  const myTasks = useMemo(() => {
    return allDepartmentTasks.filter(
      (t) =>
        !isQueueTaskUnassigned(t) &&
        t.status !== 'Reassigned' &&
        t.status !== 'Unassigned' &&
        taskMatchesFulfillerAssignee(t, activeProfile),
    );
  }, [allDepartmentTasks, activeProfile]);

  // Unassigned Open Pool tasks that can be claimed (strictly unassigned queue tasks only)
  const unassignedPool = useMemo(() => {
    return allDepartmentTasks.filter((t) => isQueueTaskUnassigned(t));
  }, [allDepartmentTasks]);

  // Filtered tasks for My Tasks view
  const filteredMyTasks = useMemo(() => {
    return myTasks.filter((task) => {
      if (myFilter === 'all')
        return task.status !== 'Completed' && task.status !== 'Closed';
      if (myFilter === 'pending')
        return task.status === 'Assigned';
      if (myFilter === 'in_progress')
        return (
          task.status === 'Accepted' ||
          task.status === 'In progress' ||
          task.status === 'On the way' ||
          task.status === 'Blocked' ||
          task.status === 'Awaiting inspection'
        );
      if (myFilter === 'blocked') return task.status === 'Blocked';
      if (myFilter === 'completed') return task.status === 'Completed' || task.status === 'Closed';
      if (myFilter === 'overdue')
        return (
          task.status !== 'Completed' &&
          task.status !== 'Closed' &&
          (task.chip?.toLowerCase().includes('overdue') ||
            task.slaDue?.toLowerCase().includes('overdue') ||
            task.tone === 'danger')
        );
      return true;
    });
  }, [myTasks, myFilter]);

  // Filtered tasks for All Tasks view: Strictly open to claim
  const filteredAllTasks = useMemo(() => {
    return unassignedPool;
  }, [unassignedPool]);

  // Counts for Badges
  const activeMyTasksCount = myTasks.filter(
    (t) =>
      t.status !== 'Completed' &&
      t.status !== 'Closed',
  ).length;
  const pendingCount = myTasks.filter(
    (t) => t.status === 'Assigned',
  ).length;
  const inProgressCount = myTasks.filter(
    (t) =>
      t.status === 'Accepted' ||
      t.status === 'In progress' ||
      t.status === 'On the way' ||
      t.status === 'Blocked' ||
      t.status === 'Awaiting inspection',
  ).length;
  const blockedCount = myTasks.filter((t) => t.status === 'Blocked').length;
  const overdueCount = myTasks.filter(
    (t) =>
      t.status !== 'Completed' &&
      t.status !== 'Closed' &&
      (t.chip?.toLowerCase().includes('overdue') || t.tone === 'danger'),
  ).length;

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>, task: WorkItem) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        attachTaskPhoto('task_fulfiller', task.id, dataUrl);
        if (selectedTask?.id === task.id) {
          setSelectedTask({ ...selectedTask, photoUrl: dataUrl, photoAttached: true });
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function handleComplete(task: WorkItem) {
    // Open photo upload confirmation dialog to attach proof before submitting to supervisor
    setPhotoModalTask(task);
    setPhotoModalPreview(task.photoUrl || null);
    setPhotoModalError(null);
  }

  function openPhotoUpload(task: WorkItem) {
    handleComplete(task);
  }

  function handleSubmitCompletionWithPhoto() {
    if (!photoModalTask) return;
    const finalPhoto =
      photoModalPreview ||
      SAMPLE_PROOF_PHOTOS[activeProfile.deptKey] ||
      SAMPLE_PROOF_PHOTOS.housekeeping;

    attachTaskPhoto('task_fulfiller', photoModalTask.id, finalPhoto);

    advance(
      'task_fulfiller',
      photoModalTask.id,
      {
        label: 'Submit for inspection',
        next: 'Awaiting inspection',
        message: `Work completed by ${activeProfile.employeeName}. Submitted for supervisor inspection`,
      },
      `Work finished with photo evidence by ${activeProfile.employeeName}. Awaiting sign-off by Supervisor ${activeProfile.supervisorName}`,
    );

    if (selectedTask?.id === photoModalTask.id) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: 'Awaiting inspection',
              photoUrl: finalPhoto,
              photoAttached: true,
              history: [
                ...(prev.history ?? []),
                {
                  at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'Awaiting inspection',
                  note: `Work completed with photo proof by ${activeProfile.employeeName}. Submitted for quality inspection by Supervisor ${activeProfile.supervisorName}`,
                  actor: activeProfile.employeeName,
                  role: 'Task Fulfiller',
                },
              ],
            }
          : null,
      );
    }

    notify(`Work submitted with photo. Pending inspection by Supervisor ${activeProfile.supervisorName}.`);
    setPhotoModalTask(null);
    setPhotoModalPreview(null);
    setPhotoModalError(null);
  }

  function handleBlockerSubmit() {
    if (!blockerModalTask) return;
    const finalReason =
      blockerReason === 'Others'
        ? (customBlockerReason.trim() ? `Others: ${customBlockerReason.trim()}` : 'Other reason')
        : blockerReason;
    advance(
      'task_fulfiller',
      blockerModalTask.id,
      {
        label: 'Report blocker',
        next: 'Blocked',
        message: 'Blocker recorded',
        variant: 'danger',
      },
      finalReason,
    );
    if (blockerPhotoPreview) {
      attachTaskPhoto('task_fulfiller', blockerModalTask.id, blockerPhotoPreview);
    }
    notify(`Task placed on hold: "${finalReason}"${blockerPhotoPreview ? ' with photo evidence' : ''}`);
    setBlockerModalTask(null);
    setBlockerPhotoPreview(null);
    setBlockerPhotoError(null);
    setCustomBlockerReason('');
    if (selectedTask?.id === blockerModalTask.id) {
      setSelectedTask(null);
    }
  }

  function handleReassignSubmit() {
    if (!reassignModalTask) return;
    const finalReason =
      reassignReason === 'Others'
        ? (customReassignReason.trim() ? `Others: ${customReassignReason.trim()}` : 'Other reason')
        : reassignReason;
    requestTaskReassignment(reassignModalTask.id, finalReason);
    setReassignModalTask(null);
    setCustomReassignReason('');
    if (selectedTask?.id === reassignModalTask.id) {
      setSelectedTask(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-6 sm:pb-8">
      {/* Hidden File Inputs for Blocker Photo Proof */}
      <input
        ref={blockerGalleryFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setBlockerPhotoError('Image size exceeds 5MB. Please choose a smaller photo.');
            return;
          }
          setBlockerPhotoError(null);
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              setBlockerPhotoPreview(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }}
      />
      <input
        ref={blockerCameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setBlockerPhotoError('Image size exceeds 5MB. Please choose a smaller photo.');
            return;
          }
          setBlockerPhotoError(null);
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              setBlockerPhotoPreview(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }}
      />

      {/* Hidden File Inputs for Device Gallery / Mobile Camera */}
      <input
        ref={galleryFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setPhotoModalError('Image size exceeds 5MB. Please choose a smaller photo.');
            return;
          }
          setPhotoModalError(null);
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              setPhotoModalPreview(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }}
      />

      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setPhotoModalError('Image size exceeds 5MB. Please choose a smaller photo.');
            return;
          }
          setPhotoModalError(null);
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              setPhotoModalPreview(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }}
      />

      {/* Primary Section Switcher: My Tasks vs All Tasks */}
      <div
        className={cn(
          'grid grid-cols-2 p-1 rounded-2xl max-w-md sm:max-w-lg mx-auto w-full transition-colors',
          isLight
            ? 'bg-[#f6f3ec] border border-[#e7e2d7]'
            : 'bg-white/[0.04] border border-white/10',
        )}
      >
        <button
          type="button"
          onClick={() => setPrimaryView('my_tasks')}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            primaryView === 'my_tasks'
              ? isLight
                ? 'bg-[#ffffff] text-[#353229] border border-[#e7e2d7] shadow-xs font-bold'
                : 'bg-[#dfc187] text-[#14120e] shadow-xs font-bold'
              : isLight
                ? 'text-[#686252] hover:text-[#353229]'
                : 'text-[#d9cebe] hover:text-white',
          )}
        >
          <User className="h-3.5 w-3.5" />
          <span>My Tasks</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
              primaryView === 'my_tasks'
                ? isLight
                  ? 'bg-[#f6f3ec] text-[#353229] border border-[#e7e2d7]'
                  : 'bg-black/20 text-[#14120e]'
                : isLight
                  ? 'bg-[#e7e2d7] text-[#686252]'
                  : 'bg-white/10 text-mist-300',
            )}
          >
            {activeMyTasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPrimaryView('all_tasks')}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            primaryView === 'all_tasks'
              ? isLight
                ? 'bg-[#ffffff] text-[#353229] border border-[#e7e2d7] shadow-xs font-bold'
                : 'bg-[#dfc187] text-[#14120e] shadow-xs font-bold'
              : isLight
                ? 'text-[#686252] hover:text-[#353229]'
                : 'text-[#d9cebe] hover:text-white',
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Open to Claim</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
              primaryView === 'all_tasks'
                ? isLight
                  ? 'bg-[#ebe2cc] text-[#353229] border border-[#b7b09e]'
                  : 'bg-black/20 text-[#14120e]'
                : isLight
                  ? 'bg-[#f6f3ec] text-[#8b7550] border border-[#e7e2d7]'
                  : 'bg-[#dfc187]/20 text-[#dfc187]',
            )}
          >
            {unassignedPool.length}
          </span>
        </button>
      </div>

      {/* Sub-Filters: My Tasks */}
      {primaryView === 'my_tasks' && (
        <div className="no-scrollbar -mx-4 sm:mx-0 flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:justify-center px-4 sm:px-0 pb-1">
          <button
            type="button"
            onClick={() => setMyFilter('all')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              myFilter === 'all'
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] shadow-xs font-semibold'
                  : 'bg-[#dfc187] text-[#14120e] shadow-xs font-semibold'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                  : 'border border-white/10 bg-white/[0.04] text-[#d9cebe] hover:text-white hover:bg-white/[0.08]',
            )}
          >
            Active
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                myFilter === 'all'
                  ? isLight ? 'bg-white/20 text-[#ffffff]' : 'bg-black/20 text-[#14120e]'
                  : isLight ? 'bg-[#ebe2cc] text-[#353229]' : 'bg-[rgba(200,169,110,0.22)] text-[#dfc187]',
              )}
            >
              {activeMyTasksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('pending')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              myFilter === 'pending'
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] shadow-xs font-semibold'
                  : 'bg-[#dfc187] text-[#14120e] shadow-xs font-semibold'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                  : 'border border-white/10 bg-white/[0.04] text-[#d9cebe] hover:text-white hover:bg-white/[0.08]',
            )}
          >
            Pending
            {pendingCount > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold border',
                  myFilter === 'pending'
                    ? isLight ? 'bg-white/20 text-[#ffffff] border-transparent' : 'bg-black/20 text-[#14120e] border-transparent'
                    : isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                )}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('in_progress')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              myFilter === 'in_progress'
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] shadow-xs font-semibold'
                  : 'bg-[#dfc187] text-[#14120e] shadow-xs font-semibold'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                  : 'border border-white/10 bg-white/[0.04] text-[#d9cebe] hover:text-white hover:bg-white/[0.08]',
            )}
          >
            In Progress
            {inProgressCount > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold border',
                  myFilter === 'in_progress'
                    ? isLight ? 'bg-white/20 text-[#ffffff] border-transparent' : 'bg-black/20 text-[#14120e] border-transparent'
                    : isLight ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-400/40',
                )}
              >
                {inProgressCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('completed')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              myFilter === 'completed'
                ? isLight
                  ? 'bg-[#353229] text-[#ffffff] shadow-xs font-semibold'
                  : 'bg-[#dfc187] text-[#14120e] shadow-xs font-semibold'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                  : 'border border-white/10 bg-white/[0.04] text-[#d9cebe] hover:text-white hover:bg-white/[0.08]',
            )}
          >
            Completed
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px] font-bold border',
                myFilter === 'completed'
                  ? isLight ? 'bg-white/20 text-[#ffffff] border-transparent' : 'bg-black/20 text-[#14120e] border-transparent'
                  : isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
              )}
            >
              {myTasks.filter((t) => t.status === 'Completed').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('overdue')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
              myFilter === 'overdue'
                ? isLight
                  ? 'bg-rose-700 text-white shadow-xs font-semibold'
                  : 'bg-rose-500 text-white shadow-xs font-semibold'
                : isLight
                  ? 'border border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                  : 'border border-white/10 bg-white/[0.04] text-[#d9cebe] hover:text-white hover:bg-white/[0.08]',
            )}
          >
            Overdue
            {overdueCount > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold border',
                  myFilter === 'overdue'
                    ? 'bg-white/25 text-white border-transparent'
                    : isLight
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40',
                )}
              >
                {overdueCount}
              </span>
            )}
          </button>

          {blockedCount > 0 && (
            <button
              type="button"
              onClick={() => setMyFilter('blocked')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
                myFilter === 'blocked'
                  ? isLight
                    ? 'bg-rose-700 text-white shadow-xs font-semibold'
                    : 'bg-rose-500 text-white shadow-xs font-semibold'
                  : isLight
                    ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:text-white',
              )}
            >
              Blocked
              <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {blockedCount}
              </span>
            </button>
          )}
        </div>
      )}



      {/* On Break Notice Banner */}
      {isOnBreak && (
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl border p-3 text-xs transition-colors shadow-sm',
            isLight
              ? 'border-[#ded6c1] bg-[#ebe2cc]/40 text-[#353229]'
              : 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.08)] text-[#ded6c9]',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Coffee className={cn('h-4 w-4 shrink-0', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
            <span className="truncate">
              You are currently <strong>On Break</strong>. Claiming tasks is paused.
            </span>
          </div>
          <button
            type="button"
            style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
            onClick={() => {
              completeBreakRequest();
              setFulfillerAvailability('on_duty');
            }}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1 text-[11px] font-bold transition-colors cursor-pointer btn-dark',
              isLight
                ? 'bg-[#353229] text-white hover:bg-[#484438]'
                : 'bg-[#c8a96e] text-[#14120e] hover:bg-[#dfc187]',
            )}
          >
            End Break & Resume Duty
          </button>
        </div>
      )}

      {/* Duty / Shift Request Pending Notice Banner */}
      {breakRequest?.status === 'pending' && (
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl border p-3 text-xs transition-colors shadow-sm',
            isLight
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-amber-400/40 bg-amber-400/10 text-amber-200',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 shrink-0 text-amber-600 animate-spin" />
            <div className="min-w-0">
              <span className="font-bold truncate block">
                Duty Request Pending: {breakRequest.title || breakRequest.reason}
              </span>
              <span className="text-[10px] text-amber-800">
                Awaiting approval from Supervisor {activeProfile.supervisorName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setBreakModalOpen(true)}
              className="rounded-xl border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-50 cursor-pointer"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => {
                approveBreakRequest();
                const targetType = breakRequest.requestType;
                if (targetType === 'on_duty') setFulfillerAvailability('on_duty');
                else if (targetType === 'off_duty') setFulfillerAvailability('off_duty');
                else if (targetType === 'break') setFulfillerAvailability('break');
              }}
              className="rounded-xl bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 cursor-pointer"
              title="Simulate supervisor approval for testing"
            >
              Approve (Demo)
            </button>
          </div>
        </div>
      )}

      {/* Off Duty Notice Banner */}
      {isOffDuty && !breakRequest && (
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl border p-3 text-xs transition-colors shadow-xs',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
              : 'border-[rgba(165,130,95,0.25)] bg-[#1c1c20] text-[#f7f4ed]',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Power className={cn('h-4 w-4 shrink-0', isLight ? 'text-[#8b7550]' : 'text-[#dfc187]')} />
            <div className="min-w-0">
              <span className="font-bold block">
                You are currently Off Duty
              </span>
              <span className={cn('text-[10px]', isLight ? 'text-[#686252]' : 'text-mist-400')}>
                Shift status managed by Supervisor {activeProfile.supervisorName}
              </span>
            </div>
          </div>
          <button
            type="button"
            style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
            onClick={() => {
              setDutyModalInitialType('on_duty');
              setBreakModalOpen(true);
            }}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1 text-[11px] font-bold border transition-all cursor-pointer shadow-xs btn-dark',
              isLight
                ? 'bg-[#353229] text-white hover:bg-[#484438] border-transparent'
                : 'bg-[#dfc187] text-[#14120e] hover:bg-[#e8cf9a] border-transparent',
            )}
          >
            Request On Duty
          </button>
        </div>
      )}

      {/* Task List Rendering: Mobile 1-col, Tablet 2-col, Desktop 3-to-4 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
        {(primaryView === 'my_tasks' ? filteredMyTasks : filteredAllTasks).length === 0 ? (
          <div
            className={cn(
              'col-span-full flex flex-col items-center justify-center rounded-3xl border py-12 px-4 text-center transition-colors',
              isLight ? 'border-[#e7e2d7] bg-[#ffffff]' : 'border-white/10 bg-white/[0.02]',
            )}
          >
            <span
              className={cn(
                'grid h-12 w-12 place-items-center rounded-2xl border',
                isLight ? 'border-[#e7e2d7] bg-[#f6f3ec]' : 'border-white/10 bg-white/[0.04]',
              )}
            >
              <CheckCircle2 className={cn('h-6 w-6', isLight ? 'text-[#353229]' : 'text-emerald-400')} />
            </span>
            <p className={cn('mt-3 text-sm font-semibold', isLight ? 'text-[#353229]' : 'text-white')}>
              {primaryView === 'all_tasks' ? 'No tasks open to claim' : 'All clear'}
            </p>
            <p className={cn('mt-1 text-xs max-w-xs', isLight ? 'text-[#686252]' : 'text-mist-400')}>
              {primaryView === 'all_tasks'
                ? `All ${activeProfile.departmentName} tasks are currently assigned.`
                : 'No tasks currently in this view.'}
            </p>
          </div>
        ) : (
          (primaryView === 'my_tasks' ? filteredMyTasks : filteredAllTasks).map((task) => {
            const isAssigned = task.status === 'Assigned';
            const isAccepted = task.status === 'Accepted';
            const isInProgress = task.status === 'In progress' || task.status === 'On the way';
            const isBlocked = task.status === 'Blocked';
            const isCompleted = task.status === 'Completed';
            const isAwaitingInspection = task.status === 'Awaiting inspection';
            const isReassignPending = task.status === 'Reassignment requested' || task.reassignPending;
            const isUnassigned = isQueueTaskUnassigned(task);
            const isAssignedToMe = isTaskAssignedToProfile(task, activeProfile);
            const isUrgent = task.priority === 'urgent' && !isCompleted && !isAwaitingInspection && !isReassignPending;

            return (
              <div
                key={task.id}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-4 transition-all',
                  isLight
                    ? isCompleted
                      ? 'border-[#e7e2d7] bg-[#ffffff]'
                      : isAwaitingInspection
                        ? 'border-[#ded6c1] bg-[#ebe2cc]/20 hover:border-[#b7b09e]'
                        : isUrgent
                          ? 'border-rose-400 bg-rose-50/70 shadow-[0_4px_18px_rgba(225,29,72,0.12)] hover:border-rose-500'
                          : isBlocked
                            ? 'border-rose-200 bg-rose-50/40'
                            : isReassignPending
                              ? 'border-[#b7b09e] bg-[#fbfaf7]'
                              : task.priority === 'vip'
                                ? 'border-[#b7b09e] bg-[#fbfaf7]'
                                : 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04),0_1px_3px_rgba(53,50,41,0.02)] hover:border-[#b7b09e] hover:shadow-[0_6px_22px_rgba(53,50,41,0.07)]'
                    : isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                      : isAwaitingInspection
                        ? 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.05)]'
                        : isUrgent
                          ? 'border-rose-500/80 bg-[#241215] shadow-lg shadow-rose-950/40 hover:border-rose-400'
                          : isUnassigned
                            ? 'border-amber-400/40 bg-amber-400/[0.04] shadow-md shadow-amber-400/5'
                            : isBlocked
                              ? 'border-rose-500/30 bg-rose-500/[0.05]'
                              : isReassignPending
                                ? 'border-amber-400/30 bg-amber-400/[0.04]'
                                : task.priority === 'vip'
                                  ? 'border-amber-400/30 bg-amber-400/[0.03]'
                                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                )}
              >
                {/* Header row: Location, Priority & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold shrink-0',
                        isUrgent
                          ? isLight
                            ? 'border border-rose-300 bg-rose-100 text-rose-900 font-bold'
                            : 'border border-rose-500/40 bg-rose-500/25 text-rose-200 font-bold'
                          : isLight
                            ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                            : 'border border-white/10 bg-white/[0.06] text-white',
                      )}
                    >
                      <MapPin
                        className={cn(
                          'h-3 w-3',
                          isUrgent
                            ? 'text-rose-500'
                            : isLight
                              ? 'text-[#8b7550]'
                              : 'text-emerald-400',
                        )}
                      />
                      {task.room ? `Room ${task.room}` : task.location ?? 'Floor 4'}
                    </span>

                    {isUnassigned && (
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 border',
                          isLight
                            ? 'border-[#b7b09e] bg-[#ebe2cc] text-[#353229]'
                            : 'border-amber-400/30 bg-amber-400/20 text-amber-300',
                        )}
                      >
                        Open Pool
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0',
                      isUrgent
                        ? isLight
                          ? 'border border-rose-300 bg-rose-100 text-rose-900 font-bold'
                          : 'border border-rose-500/40 bg-rose-500/25 text-rose-200 font-bold'
                        : isLight
                          ? isCompleted
                            ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                            : isAwaitingInspection
                              ? 'border border-[#b7b09e] bg-[#ebe2cc] text-[#353229]'
                              : isBlocked
                                ? 'border border-[#fecaca] bg-[#fff1f0] text-[#991b1b]'
                                : isReassignPending
                                  ? 'border border-[#b7b09e] bg-[#ebe2cc] text-[#353229]'
                                  : isInProgress
                                    ? 'border border-[#b7b09e] bg-[#ebe2cc] text-[#353229]'
                                    : isUnassigned
                                      ? 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#686252]'
                                      : 'border border-[#e7e2d7] bg-[#f6f3ec] text-[#686252]'
                          : isCompleted
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : isAwaitingInspection
                              ? 'bg-[#c8a96e]/15 text-[#dfc187] border border-[rgba(165,130,95,0.3)]'
                              : isBlocked
                                ? 'bg-rose-500/20 text-rose-300'
                                : isReassignPending
                                  ? 'bg-amber-400/20 text-amber-200'
                                  : isInProgress
                                    ? 'bg-sky-400/20 text-sky-300'
                                    : isUnassigned
                                      ? 'bg-amber-400/20 text-amber-300'
                                      : 'bg-white/10 text-mist-300',
                    )}
                  >
                    {isUnassigned
                      ? 'Unassigned'
                      : isAwaitingInspection
                        ? 'Pending Inspection'
                        : task.status}
                  </span>
                </div>

                {isBlocked && task.blockerReason && (
                  <div
                    className={cn(
                      'mt-2 rounded-xl border px-2.5 py-1.5 text-xs flex items-center justify-between gap-2',
                      isLight
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300',
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', isLight ? 'text-rose-600' : 'text-rose-400')} />
                      <span className="truncate"><strong>Blocked:</strong> {task.blockerReason}</span>
                    </div>
                    {task.photoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewPhotoUrl(task.photoUrl!);
                        }}
                        className={cn(
                          'flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-colors shrink-0 cursor-pointer',
                          isLight
                            ? 'border-rose-300 bg-white text-rose-900 hover:bg-rose-50'
                            : 'border-rose-400/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30',
                        )}
                      >
                        <Camera className="h-3 w-3" />
                        <span>Photo Proof</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Title & Metadata */}
                <div className="mt-2.5 cursor-pointer" onClick={() => setSelectedTask(task)}>
                  <h3
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isUrgent
                        ? isLight
                          ? 'text-rose-950 font-bold group-hover:text-rose-700'
                          : 'text-rose-100 font-bold group-hover:text-white'
                        : isLight
                          ? 'text-[#353229] group-hover:text-[#8b7550]'
                          : 'text-white group-hover:text-[#dfc187]',
                    )}
                  >
                    {task.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-0.5 text-xs line-clamp-1',
                      isUrgent
                        ? isLight
                          ? 'text-rose-800/80 font-medium'
                          : 'text-rose-300/80'
                        : isLight
                          ? 'text-[#686252]'
                          : 'text-mist-300',
                    )}
                  >
                    {task.meta}
                  </p>
                </div>

                {/* SLA & Details strip */}
                <div
                  className={cn(
                    'mt-3 flex flex-wrap items-center gap-3 border-t pt-2.5 text-xs',
                    isUrgent
                      ? isLight
                        ? 'border-rose-200 text-rose-800'
                        : 'border-rose-500/20 text-rose-300'
                      : isLight
                        ? 'border-[#e7e2d7] text-[#686252]'
                        : 'border-white/[0.06] text-mist-400',
                  )}
                >
                  {task.slaDue && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[11px]',
                        isUrgent
                          ? isLight
                            ? 'text-rose-800 font-medium'
                            : 'text-rose-300 font-medium'
                          : undefined,
                      )}
                    >
                      <Clock
                        className={cn(
                          'h-3 w-3',
                          isUrgent
                            ? 'text-rose-500'
                            : isLight
                              ? 'text-[#8c8472]'
                              : 'text-mist-400',
                        )}
                      />
                      Target: {task.slaDue}
                    </span>
                  )}

                  {task.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setViewPhotoUrl(task.photoUrl!)}
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-medium cursor-pointer',
                        isLight ? 'text-[#353229] hover:underline' : 'text-[#dfc187] hover:text-[#f7f4ed]',
                      )}
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Photo attached</span>
                    </button>
                  )}

                  {task.reassignPending && (
                    <span className={cn('text-[11px] font-medium', isLight ? 'text-[#8b7550]' : 'text-amber-300')}>
                      Supervisor review pending ({task.reassignReason})
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      'ml-auto text-[11px] flex items-center gap-1 cursor-pointer font-medium',
                      isLight ? 'text-[#353229] hover:text-[#8b7550]' : 'text-mist-400 hover:text-white',
                    )}
                  >
                    <Eye className="h-3 w-3" /> Details
                  </button>
                </div>

                {/* Mobile Action Strip */}
                {!isCompleted && !isReassignPending && (
                  <div className="mt-3 flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                    {/* Unassigned / Open Pool: Self-Claim Action */}
                    {isUnassigned && (
                      <button
                        type="button"
                        style={isLight && !isOnBreak && !isOffDuty ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                        disabled={isOnBreak || isOffDuty}
                        onClick={() => {
                          if (isOnBreak || isOffDuty) {
                            notify('Cannot claim tasks while on break. Switch to On Duty first.');
                            return;
                          }
                          claimTask(task.id, activeProfile.employeeId, activeProfile.employeeName);
                        }}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all shadow-xs btn-dark',
                          isOnBreak || isOffDuty
                            ? 'bg-white/10 text-mist-400 cursor-not-allowed border border-white/10 opacity-70'
                            : isLight
                              ? 'bg-[#353229] hover:bg-[#484438] text-white cursor-pointer active:scale-[0.98]'
                              : 'bg-[#dfc187] hover:bg-[#e8cf9a] text-[#14120e] cursor-pointer active:scale-[0.98]',
                        )}
                      >
                        {isOnBreak ? (
                          <>
                            <Coffee className="h-3.5 w-3.5 text-amber-400" />
                            <span>On Break</span>
                          </>
                        ) : isOffDuty ? (
                          <span>Off Duty</span>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Claim Task</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Assigned to Me: Accept Task ONLY */}
                    {!isUnassigned && isAssignedToMe && isAssigned && (
                      <button
                        type="button"
                        style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                        onClick={() =>
                          advance('task_fulfiller', task.id, {
                            label: 'Accept',
                            next: 'Accepted',
                            message: 'Task accepted',
                          })
                        }
                        className={cn(
                          'w-full flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer btn-dark',
                          isLight
                            ? 'bg-[#353229] hover:bg-[#484438] text-white'
                            : 'bg-[#dfc187] hover:bg-[#e8cf9a] text-[#14120e]',
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept Task
                      </button>
                    )}

                    {!isUnassigned && isAssignedToMe && isAccepted && (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Start work',
                              next: 'In progress',
                              message: 'Work commenced',
                            })
                          }
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-medium border transition-colors cursor-pointer',
                            isLight
                              ? 'border-[#e7e2d7] bg-[#f6f3ec] hover:bg-[#ebe2cc] text-[#353229]'
                              : 'border-white/10 bg-white/[0.05] hover:bg-white/10 text-[#f7f4ed]',
                          )}
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start
                        </button>
                        <button
                          type="button"
                          style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                          onClick={() => handleComplete(task)}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer btn-dark',
                            isLight
                              ? 'bg-[#353229] hover:bg-[#484438] text-white'
                              : 'bg-[#dfc187] hover:bg-[#e8cf9a] text-[#14120e]',
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                            isLight
                              ? 'border-[#e7e2d7] bg-white text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                              : 'border-white/10 bg-white/[0.03] text-[#d9cebe] hover:text-white hover:bg-white/[0.06]',
                          )}
                        >
                          Reassign
                        </button>
                      </div>
                    )}

                    {!isUnassigned && isAssignedToMe && isInProgress && (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                          onClick={() => handleComplete(task)}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer btn-dark',
                            isLight
                              ? 'bg-[#353229] hover:bg-[#484438] text-white'
                              : 'bg-[#dfc187] hover:bg-[#e8cf9a] text-[#14120e]',
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Completed
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlockerModalTask(task)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                            isLight
                              ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
                          )}
                        >
                          Blocker
                        </button>

                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                            isLight
                              ? 'border-[#e7e2d7] bg-white text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                              : 'border-white/10 bg-white/[0.03] text-[#d9cebe] hover:text-white hover:bg-white/[0.06]',
                          )}
                        >
                          Reassign
                        </button>
                      </div>
                    )}

                    {!isUnassigned && isAssignedToMe && isBlocked && (
                      <>
                        <button
                          type="button"
                          style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Resume',
                              next: 'In progress',
                              message: 'Blocker cleared, work resumed',
                            })
                          }
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer btn-dark',
                            isLight
                              ? 'bg-[#353229] hover:bg-[#484438] text-white'
                              : 'bg-[#dfc187] hover:bg-[#e8cf9a] text-[#14120e]',
                          )}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Resume Work
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-[rgba(165,130,95,0.25)] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#ded6c9] hover:text-[#f7f4ed] transition-colors cursor-pointer"
                        >
                          Request Reassign
                        </button>
                      </>
                    )}

                    {!isUnassigned && isAssignedToMe && isAwaitingInspection && (
                      <div className="w-full">
                        <div
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-colors',
                            isLight
                              ? 'border-[#ded6c1] bg-[#ebe2cc]/30 text-[#353229]'
                              : 'border-[rgba(165,130,95,0.3)] bg-[rgba(200,169,110,0.08)] text-[#dfc187]',
                          )}
                        >
                          <div className={cn('flex items-center gap-2 font-semibold', isLight ? 'text-[#353229]' : 'text-[#dfc187]')}>
                            <Clock className={cn('h-4 w-4 shrink-0 animate-pulse', isLight ? 'text-[#8b7550]' : 'text-[#dfc187]')} />
                            <span>Pending at Supervisor Inspection</span>
                          </div>
                          <span className={cn('text-[11px] italic', isLight ? 'text-[#686252]' : 'text-[#ded6c9]/80')}>
                            Supervisor: {activeProfile.supervisorName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed State Banner & Guest Feedback (Shortly) */}
                {isCompleted && (() => {
                  const guestFeedback = task.feedback || {
                    rating: 5,
                    comment: (task.category as string) === 'turndown' || task.title.toLowerCase().includes('turndown')
                      ? 'Room turndown was pristine and restful. Spotless linen.'
                      : task.title.toLowerCase().includes('towel') || task.title.toLowerCase().includes('amenit')
                        ? 'Towels & amenities delivered promptly with wonderful courtesy.'
                        : 'Spotless room turnover and prompt service. 5-star standard!',
                  };

                  return (
                    <div
                      className={cn(
                        'mt-3 flex flex-col gap-2 rounded-xl p-2.5 text-xs',
                        isLight
                          ? 'border border-[#e7e2d7] bg-[#fbfaf7]'
                          : 'bg-emerald-500/[0.08] border border-emerald-500/20',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            'flex items-center gap-1.5 font-bold',
                            isLight ? 'text-[#353229]' : 'text-emerald-400',
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Task Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.photoUrl && (
                            <span
                              className={cn(
                                'text-[10px] font-medium flex items-center gap-1',
                                isLight ? 'text-[#686252]' : 'text-emerald-300/80',
                              )}
                            >
                              <Camera className="h-3 w-3" /> Photo proof
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-[10px] font-mono',
                              isLight ? 'text-[#8c8472]' : 'text-mist-400',
                            )}
                          >
                            {task.history?.filter((h) => h.status === 'Completed').slice(-1)[0]?.at
                              ? `Finished at ${task.history.filter((h) => h.status === 'Completed').slice(-1)[0].at}`
                              : 'Completed'}
                          </span>
                        </div>
                      </div>

                      {/* Guest Feedback (Shortly) */}
                      <div
                        className={cn(
                          'flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]',
                          isLight
                            ? 'border border-[#e7e2d7] bg-[#ffffff]'
                            : 'border border-[rgba(165,130,95,0.25)] bg-[rgba(200,169,110,0.06)]',
                        )}
                      >
                        <Star className={cn('h-3 w-3 shrink-0 mt-0.5', isLight ? 'text-[#8b7550] fill-[#8b7550]' : 'text-amber-400 fill-amber-400')} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn('font-bold', isLight ? 'text-[#353229]' : 'text-[#dfc187]')}>Guest Feedback</span>
                            <span className={cn('text-[10px] font-mono font-semibold', isLight ? 'text-[#8b7550]' : 'text-amber-300')}>({guestFeedback.rating.toFixed(1)} ★)</span>
                          </div>
                          <p className={cn('text-[11px] mt-0.5 italic line-clamp-2 leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-200')}>
                            &ldquo;{guestFeedback.comment}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Evidence Photo Lightbox Modal (In-Mobile Shell) */}
      {viewPhotoUrl && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-[65] flex flex-col justify-between bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 pt-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Completion Evidence Photo</span>
              </div>
              <button
                type="button"
                onClick={() => setViewPhotoUrl(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewPhotoUrl}
                alt="Task completion evidence preview"
                className="max-w-full max-h-[60vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
              />
            </div>
            <div className="border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setViewPhotoUrl(null)}
                className="w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20"
              >
                Close Photo
              </button>
            </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Task Details & Chronological Timeline Modal (Mobile Sheet / Tablet & Desktop Centered Modal) */}
      {selectedTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={cn(
                'w-full sm:max-w-xl max-h-[92%] sm:max-h-[85vh] flex flex-col rounded-t-[2rem] sm:rounded-3xl border-t sm:border p-4 sm:p-6 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 transition-colors',
                isLight
                  ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                  : 'border-white/20 bg-ink-950 text-white',
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-start justify-between gap-3 border-b pb-3 shrink-0',
                  isLight ? 'border-[#e7e2d7]' : 'border-white/10',
                )}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-xs font-bold border',
                        isLight
                          ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                          : 'bg-emerald-500/20 text-emerald-300 border-transparent',
                      )}
                    >
                      {selectedTask.room ? `Room ${selectedTask.room}` : selectedTask.location || 'Location'}
                    </span>
                    {selectedTask.priority === 'urgent' && (
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[11px] font-bold border flex items-center gap-1 shrink-0',
                          isLight
                            ? 'border-rose-300 bg-rose-100 text-rose-900'
                            : 'border-rose-500/40 bg-rose-500/20 text-rose-200',
                        )}
                      >
                        <AlertCircle className="h-3 w-3 text-rose-600" /> Urgent Priority
                      </span>
                    )}
                    {selectedTask.priority === 'vip' && (
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[11px] font-bold border flex items-center gap-1 shrink-0',
                          isLight
                            ? 'border-[#b7b09e] bg-[#ebe2cc] text-[#353229]'
                            : 'border-amber-400/30 bg-amber-400/20 text-amber-200',
                        )}
                      >
                        <Crown className="h-3 w-3" /> VIP Guest
                      </span>
                    )}
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase border',
                        selectedTask.status === 'Completed'
                          ? isLight
                            ? 'bg-[#f6f3ec] text-[#353229] border-[#e7e2d7]'
                            : 'bg-emerald-500/20 text-emerald-300 border-transparent'
                          : selectedTask.status === 'Awaiting inspection'
                            ? isLight
                              ? 'bg-[#ebe2cc] text-[#353229] border-[#ded6c1]'
                              : 'bg-[#c8a96e]/15 text-[#dfc187] border-[rgba(165,130,95,0.3)]'
                            : isLight
                              ? 'bg-stone-100 text-stone-700 border-stone-200'
                              : 'bg-white/10 text-mist-300 border-transparent',
                      )}
                    >
                      {selectedTask.status === 'Awaiting inspection'
                        ? 'Pending Inspection'
                        : selectedTask.status}
                    </span>
                  </div>
                  <h3 className={cn('mt-2 text-base font-bold leading-snug', isLight ? 'text-[#353229]' : 'text-white')}>
                    {selectedTask.title}
                  </h3>
                  <p className={cn('text-xs mt-0.5', isLight ? 'text-[#686252]' : 'text-mist-300')}>{selectedTask.meta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setPhotoError(null);
                  }}
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full transition-colors shrink-0 cursor-pointer',
                    isLight
                      ? 'bg-[#f6f3ec] text-[#686252] hover:text-[#353229]'
                      : 'bg-white/10 text-mist-300 hover:text-white',
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content Body (Scrollable inside sheet) */}
              <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3.5 no-scrollbar text-xs">
                {/* Description */}
                {selectedTask.description && (
                  <div
                    className={cn(
                      'rounded-xl border p-3 transition-colors',
                      isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/10 bg-white/[0.03]',
                    )}
                  >
                    <h4 className={cn('font-semibold mb-1 flex items-center gap-1.5', isLight ? 'text-[#353229]' : 'text-mist-200')}>
                      <FileText className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-emerald-400')} /> Instructions & Notes
                    </h4>
                    <p className={cn('leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-300')}>{selectedTask.description}</p>
                  </div>
                )}

                {/* Guest Personal Preferences / Food Allergies */}
                {selectedTask.room && state.guestPreferences?.[selectedTask.room] && (() => {
                  const prefs = state.guestPreferences[selectedTask.room];
                  const isFoodTask = isFoodAndBeverageTask(selectedTask);
                  const hasAllergies = isFoodTask && prefs.allergies && prefs.allergies.length > 0;
                  const hasInstructions = !!prefs.personalInstructions;
                  const isDnd = !!prefs.dnd;
                  if (!hasAllergies && !hasInstructions && !isDnd) return null;

                  return (
                    <div
                      className={cn(
                        'rounded-xl border p-3 text-xs space-y-1 transition-colors',
                        isLight
                          ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                          : 'border-amber-400/20 bg-amber-400/[0.04]',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider',
                          isLight ? 'text-[#353229]' : 'text-amber-300',
                        )}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Guest Service Preferences & Reference</span>
                      </div>
                      {isDnd && (
                        <p className={cn('font-bold text-[11px]', isLight ? 'text-rose-700' : 'text-rose-300')}>
                          ⛔ Do Not Disturb active on room
                        </p>
                      )}
                      {hasAllergies && (
                        <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-mist-200')}>
                          <strong className={isLight ? 'text-[#353229]' : 'text-amber-200'}>Food Allergies (F&B Alert):</strong> {prefs.allergies.join(', ')}
                        </p>
                      )}
                      {hasInstructions && (
                        <p className={cn('text-[11px] italic', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                          &ldquo;{prefs.personalInstructions}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Blocker Callout if Task is Blocked */}
                {selectedTask.status === 'Blocked' && (
                  <div
                    className={cn(
                      'rounded-xl border p-3 transition-colors',
                      isLight
                        ? 'border-rose-200 bg-rose-50 text-rose-900'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-200',
                    )}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-600">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Task Blocker Active</span>
                    </div>
                    <p className="mt-1 text-xs">
                      <strong>Reason:</strong> {selectedTask.blockerReason || 'Work held on room'}
                    </p>
                  </div>
                )}

                {/* Photo Evidence (Read-only if attached) */}
                {selectedTask.photoUrl && (
                  <div
                    className={cn(
                      'rounded-xl border p-3 transition-colors',
                      isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/10 bg-white/[0.03]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={cn('font-semibold flex items-center gap-1.5', isLight ? 'text-[#353229]' : 'text-mist-200')}>
                        <Camera className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />{' '}
                        {selectedTask.status === 'Blocked' ? 'Blocker Photo Proof' : 'Attached Photo Evidence'}
                      </h4>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          selectedTask.status === 'Blocked'
                            ? isLight
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-rose-500/30 bg-rose-500/20 text-rose-300'
                            : isLight
                              ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                              : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
                        )}
                      >
                        {selectedTask.status === 'Blocked' ? 'Blocker Evidence' : 'Verified'}
                      </span>
                    </div>

                    <div
                      className="mt-2.5 relative rounded-xl overflow-hidden border border-inherit aspect-video bg-black/50 cursor-pointer group"
                      onClick={() => setViewPhotoUrl(selectedTask.photoUrl!)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedTask.photoUrl}
                        alt="Task completion evidence preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex justify-between items-center">
                        <span className="text-[10px] text-white font-semibold flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Tap to view full size
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guest Feedback (if task is completed) */}
                {selectedTask.status === 'Completed' && (() => {
                  const guestFeedback = selectedTask.feedback || {
                    rating: 5,
                    comment: (selectedTask.category as string) === 'turndown' || selectedTask.title.toLowerCase().includes('turndown')
                      ? 'Room turndown was pristine and restful. Spotless linen.'
                      : selectedTask.title.toLowerCase().includes('towel') || selectedTask.title.toLowerCase().includes('amenit')
                        ? 'Towels & amenities delivered promptly with wonderful courtesy.'
                        : 'Spotless room turnover and prompt service. 5-star standard!',
                  };

                  return (
                    <div
                      className={cn(
                        'rounded-xl border p-3 space-y-1 transition-colors',
                        isLight
                          ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                          : 'border-[rgba(165,130,95,0.25)] bg-[rgba(200,169,110,0.06)]',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between text-xs font-bold',
                          isLight ? 'text-[#353229]' : 'text-[#dfc187]',
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          Guest Feedback Received
                        </span>
                        <span className={cn('font-mono text-xs font-semibold', isLight ? 'text-[#8b7550]' : 'text-amber-400')}>
                          ★ {guestFeedback.rating.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <p className={cn('text-xs italic mt-1 leading-relaxed', isLight ? 'text-[#686252]' : 'text-mist-200')}>
                        &ldquo;{guestFeedback.comment}&rdquo;
                      </p>
                    </div>
                  );
                })()}

                {/* Chronological Task Work Timeline (Actual Shared State) */}
                <div
                  className={cn(
                    'rounded-xl border p-3.5 space-y-3 transition-colors',
                    isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/10 bg-white/[0.03]',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between border-b pb-2',
                      isLight ? 'border-[#e7e2d7]' : 'border-white/[0.06]',
                    )}
                  >
                    <h4 className={cn('font-semibold flex items-center gap-1.5', isLight ? 'text-[#353229]' : 'text-mist-200')}>
                      <Clock className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-emerald-400')} />
                      Task Work Timeline
                    </h4>
                    <span className={cn('text-[10px] font-mono', isLight ? 'text-[#8c8472]' : 'text-mist-500')}>
                      {selectedTask.history?.length ?? 1} events logged
                    </span>
                  </div>

                  <div className="space-y-3 pl-1">
                    {selectedTask.history && selectedTask.history.length > 0 ? (
                      selectedTask.history.map((entry, idx) => {
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'relative pl-5 border-l-2 pb-2 last:border-l-0 last:pb-0',
                              isLight ? 'border-[#e7e2d7]' : 'border-white/10',
                            )}
                          >
                            <span
                              className={cn(
                                'absolute -left-[5px] top-0.5 h-2 w-2 rounded-full',
                                isLight ? 'ring-2 ring-white' : 'ring-2 ring-ink-900',
                                entry.status === 'Completed'
                                  ? 'bg-emerald-500'
                                  : entry.status === 'Awaiting inspection'
                                    ? isLight ? 'bg-[#8b7550]' : 'bg-[#c8a96e]'
                                    : entry.status === 'Blocked'
                                      ? 'bg-rose-500'
                                      : entry.status === 'Reassignment requested'
                                        ? 'bg-amber-500'
                                        : 'bg-sky-500',
                              )}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn('font-bold text-xs', isLight ? 'text-[#353229]' : 'text-white')}>{entry.status}</span>
                              <span className={cn('text-[10px] font-mono', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>{entry.at}</span>
                            </div>
                            {(entry.actor || entry.role) && (
                              <span className={cn('text-[10px] font-medium block', isLight ? 'text-[#686252]' : 'text-emerald-400')}>
                                By: {entry.actor ?? 'Attendant'} {entry.role ? `(${entry.role})` : ''}
                              </span>
                            )}
                            {entry.note && (
                              <p
                                className={cn(
                                  'text-[11px] mt-0.5 leading-relaxed p-1.5 rounded-lg border',
                                  isLight
                                    ? 'bg-[#ffffff] text-[#686252] border-[#e7e2d7]'
                                    : 'bg-white/[0.02] text-mist-300 border-white/5',
                                )}
                              >
                                {entry.note}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className={cn('relative pl-5 border-l-2', isLight ? 'border-[#e7e2d7]' : 'border-white/10')}>
                        <span className={cn('absolute -left-[5px] top-0.5 h-2 w-2 rounded-full bg-emerald-500', isLight ? 'ring-2 ring-white' : 'ring-2 ring-ink-900')} />
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('font-bold text-xs', isLight ? 'text-[#353229]' : 'text-white')}>Task Created</span>
                          <span className={cn('text-[10px] font-mono', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>{selectedTask.createdAt || 'Today'}</span>
                        </div>
                        <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>Task registered in Grand Azure central dispatch.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Dedicated Close and Complete Actions */}
              <div
                className={cn(
                  'mt-3 border-t pt-3 flex items-center gap-2 shrink-0',
                  isLight ? 'border-[#e7e2d7]' : 'border-white/10',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setPhotoError(null);
                  }}
                  className={cn(
                    'flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-all text-center cursor-pointer',
                    isLight
                      ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229] hover:bg-[#ebe2cc]'
                      : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08] text-white',
                  )}
                >
                  Close
                </button>
                {selectedTask.status !== 'Completed' && isTaskAssignedToProfile(selectedTask, activeProfile) && (
                  selectedTask.status === 'Awaiting inspection' ? (
                    <div
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold text-center',
                        isLight
                          ? 'border-[#ded6c1] bg-[#ebe2cc] text-[#353229]'
                          : 'bg-[rgba(200,169,110,0.12)] border-[rgba(165,130,95,0.3)] text-[#dfc187]',
                      )}
                    >
                      <Clock className={cn('h-3.5 w-3.5 animate-pulse', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                      <span>Pending at Supervisor Inspection</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                      onClick={() => handleComplete(selectedTask)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all shadow-md text-center cursor-pointer btn-dark',
                        isLight
                          ? 'bg-[#353229] text-white hover:bg-[#484438]'
                          : 'bg-[#c8a96e] hover:bg-[#dfc187] text-[#14120e]',
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Completed
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Report Blocker Modal */}
      {blockerModalTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={cn(
                'w-full max-w-md rounded-2xl border p-4 sm:p-5 shadow-2xl transition-colors max-h-[92vh] flex flex-col',
                isLight
                  ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                  : 'border-white/10 bg-[#18181c] text-[#f7f4ed]',
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <h3 className={cn('font-bold text-sm', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>
                    Report Task Blocker
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBlockerModalTask(null);
                    setBlockerPhotoPreview(null);
                    setBlockerPhotoError(null);
                    setCustomBlockerReason('');
                  }}
                  className={cn(
                    'p-1 rounded-lg transition-colors cursor-pointer',
                    isLight ? 'text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]' : 'text-mist-400 hover:text-white hover:bg-white/10',
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className={cn('mt-2 text-xs', isLight ? 'text-[#686252]' : 'text-[#d9cebe]')}>
                Specify why work cannot proceed on <strong className={isLight ? 'text-[#353229]' : 'text-white'}>{blockerModalTask.title}</strong>:
              </p>

              {/* Scrollable reasons & photo upload */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-3 no-scrollbar pr-0.5">
                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className={cn('text-[11px] font-semibold tracking-wide uppercase block', isLight ? 'text-[#686252]' : 'text-[#a69886]')}>
                    Select Blocker Reason
                  </label>
                  {BLOCKER_REASONS.map((reason) => {
                    const isSelected = blockerReason === reason;
                    return (
                      <label
                        key={reason}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs cursor-pointer transition-all',
                          isSelected
                            ? isLight
                              ? 'border-rose-300 bg-rose-50/80 text-[#353229] font-medium shadow-2xs'
                              : 'border-rose-500/40 bg-rose-500/10 text-white font-medium'
                            : isLight
                              ? 'border-[#e7e2d7] bg-white text-[#686252] hover:bg-[#f6f3ec] hover:text-[#353229]'
                              : 'border-white/10 bg-white/[0.03] text-[#d9cebe] hover:bg-white/[0.06] hover:text-white',
                        )}
                      >
                        <input
                          type="radio"
                          name="blocker"
                          checked={isSelected}
                          onChange={() => setBlockerReason(reason)}
                          className="accent-rose-500 h-3.5 w-3.5"
                        />
                        <span className="text-[11px] leading-tight">{reason}</span>
                      </label>
                    );
                  })}

                  {blockerReason === 'Others' && (
                    <div className="pt-1">
                      <textarea
                        value={customBlockerReason}
                        onChange={(e) => setCustomBlockerReason(e.target.value)}
                        placeholder="Describe the issue causing the delay..."
                        rows={2}
                        className={cn(
                          'w-full rounded-xl border p-2.5 text-xs focus:outline-none transition-colors resize-none',
                          isLight
                            ? 'border-[#e7e2d7] bg-[#fbfaf7] text-[#353229] placeholder-[#8c8472] focus:border-rose-400'
                            : 'border-white/20 bg-white/[0.04] text-[#f7f4ed] placeholder:text-[#a69886] focus:border-rose-400',
                        )}
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Photo Upload Section */}
                <div
                  className={cn(
                    'rounded-xl border p-3 space-y-2 transition-colors',
                    isLight ? 'border-[#e7e2d7] bg-[#fbfaf7]' : 'border-white/10 bg-white/[0.03]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1.5', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>
                      <Camera className="h-3.5 w-3.5 text-rose-500" />
                      <span>Photo Evidence</span>
                      <span className={cn('text-[10px] font-normal lowercase tracking-normal', isLight ? 'text-[#686252]' : 'text-[#a69886]')}>
                        (optional)
                      </span>
                    </span>
                    {blockerPhotoPreview && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          isLight
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-rose-500/30 bg-rose-500/20 text-rose-300',
                        )}
                      >
                        Attached
                      </span>
                    )}
                  </div>

                  {blockerPhotoError && (
                    <p className="text-[11px] text-rose-500">{blockerPhotoError}</p>
                  )}

                  {blockerPhotoPreview ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden border border-inherit aspect-video bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={blockerPhotoPreview}
                          alt="Blocker evidence preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => blockerGalleryFileInputRef.current?.click()}
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                            isLight
                              ? 'border-[#e7e2d7] bg-white text-[#353229] hover:bg-[#f6f3ec]'
                              : 'border-white/10 bg-white/[0.05] text-[#ded6c9] hover:text-white',
                          )}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBlockerPhotoPreview(null);
                            setBlockerPhotoError(null);
                          }}
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-[11px] font-medium text-rose-500 transition-colors cursor-pointer',
                            isLight
                              ? 'border-rose-200 bg-white hover:bg-rose-50'
                              : 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20',
                          )}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => blockerCameraFileInputRef.current?.click()}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-all cursor-pointer',
                            isLight
                              ? 'border-[#e7e2d7] bg-white text-[#353229] hover:bg-[#f6f3ec]'
                              : 'border-white/10 bg-white/[0.04] text-[#d9cebe] hover:bg-white/[0.08] hover:text-white',
                          )}
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Take Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => blockerGalleryFileInputRef.current?.click()}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-all cursor-pointer',
                            isLight
                              ? 'border-[#e7e2d7] bg-white text-[#353229] hover:bg-[#f6f3ec]'
                              : 'border-white/10 bg-white/[0.04] text-[#d9cebe] hover:bg-white/[0.08] hover:text-white',
                          )}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Upload File</span>
                        </button>
                      </div>

                      {/* Quick Blocker Samples */}
                      <div className="mt-2 pt-2 border-t border-inherit">
                        <span className={cn('text-[10px] block mb-1.5', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
                          Quick sample evidence:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {SAMPLE_BLOCKER_PHOTOS.map((sample) => (
                            <button
                              key={sample.label}
                              type="button"
                              onClick={() => setBlockerPhotoPreview(sample.url)}
                              className={cn(
                                'rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer',
                                isLight
                                  ? 'border-[#e7e2d7] bg-white text-[#686252] hover:text-[#353229] hover:bg-[#f6f3ec]'
                                  : 'border-white/10 bg-white/[0.04] text-[#d9cebe] hover:text-white hover:bg-white/[0.08]',
                              )}
                            >
                              + {sample.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div
                className={cn(
                  'mt-4 flex items-center justify-end gap-2 border-t pt-3 shrink-0',
                  isLight ? 'border-[#e7e2d7]' : 'border-white/10',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setBlockerModalTask(null);
                    setBlockerPhotoPreview(null);
                    setBlockerPhotoError(null);
                    setCustomBlockerReason('');
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    isLight
                      ? 'border-[#e7e2d7] text-[#686252] hover:bg-[#f6f3ec] hover:text-[#353229]'
                      : 'border-white/10 text-mist-300 hover:text-white hover:bg-white/[0.04]',
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBlockerSubmit}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                >
                  Confirm Blocker
                </button>
              </div>
            </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Request Reassignment Modal (In-Mobile Dialog) */}
      {reassignModalTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={cn(
                'w-full max-w-sm rounded-3xl border p-4 shadow-2xl transition-colors',
                isLight
                  ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                  : 'border-amber-400/40 bg-ink-950 text-white',
              )}
            >
              <div className="flex items-center gap-2.5 text-amber-500">
                <RotateCcw className="h-5 w-5" />
                <h3 className={cn('font-bold text-sm', isLight ? 'text-[#353229]' : 'text-white')}>Request Task Reassignment</h3>
              </div>
              <p className={cn('mt-1 text-xs', isLight ? 'text-[#686252]' : 'text-mist-300')}>
                This request will be routed to Supervisor <strong>{activeProfile.supervisorName}</strong> for decision. The task remains assigned to you until approved.
              </p>

              <div className="mt-3 space-y-2 max-h-[48vh] overflow-y-auto no-scrollbar">
                {REASSIGN_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                      reassignReason === reason
                        ? isLight
                          ? 'border-[#353229] bg-[#f6f3ec] text-[#353229] font-bold'
                          : 'border-amber-400/50 bg-amber-400/10 text-white'
                        : isLight
                          ? 'border-[#e7e2d7] bg-[#ffffff] text-[#686252] hover:bg-[#f6f3ec]'
                          : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                    )}
                  >
                    <input
                      type="radio"
                      name="reassign"
                      checked={reassignReason === reason}
                      onChange={() => setReassignReason(reason)}
                      className={isLight ? 'accent-[#353229]' : 'accent-amber-400'}
                    />
                    <span className="text-[11px]">{reason}</span>
                  </label>
                ))}

                {reassignReason === 'Others' && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <label className={cn('block text-[11px] font-semibold mb-1', isLight ? 'text-[#353229]' : 'text-mist-200')}>
                      Type Reason for Reassignment:
                    </label>
                    <textarea
                      value={customReassignReason}
                      onChange={(e) => setCustomReassignReason(e.target.value)}
                      placeholder="Type the specific reason here..."
                      rows={3}
                      className={cn(
                        'w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-1 resize-none',
                        isLight
                          ? 'border-[#e7e2d7] bg-[#fbfaf7] text-[#353229] placeholder-[#8c8472] focus:border-[#353229] focus:ring-[#353229]/30'
                          : 'border-white/20 bg-white/[0.04] text-white placeholder:text-mist-400 focus:border-amber-400 focus:ring-amber-400/30',
                      )}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div
                className={cn(
                  'mt-4 flex items-center justify-end gap-2 border-t pt-3',
                  isLight ? 'border-[#e7e2d7]' : 'border-white/10',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setReassignModalTask(null);
                    setCustomReassignReason('');
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs cursor-pointer',
                    isLight
                      ? 'border-[#e7e2d7] text-[#686252] hover:bg-[#f6f3ec]'
                      : 'border-white/10 text-mist-300 hover:text-white',
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                  onClick={handleReassignSubmit}
                  className={cn(
                    'rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md cursor-pointer btn-dark',
                    isLight
                      ? 'bg-[#353229] text-white hover:bg-[#484438]'
                      : 'bg-amber-400 text-ink-950 shadow-amber-400/30 hover:bg-amber-300',
                  )}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Complete Task & Upload Photo Modal (In-Mobile Dialog) */}
      {photoModalTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={cn(
                'w-full max-w-sm rounded-3xl border p-4 shadow-2xl transition-colors',
                isLight
                  ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229]'
                  : 'border-[rgba(165,130,95,0.3)] bg-[#161513] text-[#f7f4ed]',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-between border-b pb-3',
                  isLight ? 'border-[#e7e2d7]' : 'border-[rgba(165,130,95,0.2)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <Camera className={cn('h-5 w-5', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                  <h3 className={cn('font-bold text-sm', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>Complete Task & Upload Photo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTask(null);
                    setPhotoModalPreview(null);
                    setPhotoModalError(null);
                  }}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full cursor-pointer',
                    isLight ? 'bg-[#f6f3ec] text-[#686252] hover:text-[#353229]' : 'bg-white/10 text-[#ded6c9] hover:text-[#f7f4ed]',
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3">
                <p className={cn('text-xs leading-relaxed', isLight ? 'text-[#686252]' : 'text-[#ded6c9]')}>
                  Provide evidence photo of completed work. Once submitted, task moves to supervisor inspection.
                </p>
                <div
                  className={cn(
                    'mt-2 rounded-xl border p-2.5 text-xs transition-colors',
                    isLight
                      ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                      : 'border-[rgba(165,130,95,0.25)] bg-[rgba(200,169,110,0.05)]',
                  )}
                >
                  <div className={cn('font-semibold line-clamp-1', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>{photoModalTask.title}</div>
                  <div className={cn('text-[11px] mt-0.5 flex items-center justify-between', isLight ? 'text-[#686252]' : 'text-[#d4b896]')}>
                    <span>{photoModalTask.room ? `Room ${photoModalTask.room}` : photoModalTask.location || 'Floor 4'}</span>
                    <span>Supervisor: {activeProfile.supervisorName}</span>
                  </div>
                </div>
              </div>

              {/* Photo Preview / Upload Controls */}
              <div className="mt-3">
                {photoModalPreview ? (
                  <div
                    className={cn(
                      'relative rounded-2xl overflow-hidden border bg-black/50',
                      isLight ? 'border-[#e7e2d7]' : 'border-[rgba(165,130,95,0.4)]',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoModalPreview}
                      alt="Uploaded task photo preview"
                      className="w-full h-40 object-contain bg-black/70"
                    />
                    <div
                      className={cn(
                        'absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm',
                        isLight ? 'bg-[#353229] text-white' : 'bg-[#c8a96e] text-[#14120e]',
                      )}
                    >
                      <Check className="h-3 w-3" /> Photo Attached
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="rounded-lg bg-black/80 border border-white/20 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-black cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoModalPreview(null)}
                        className="rounded-lg bg-rose-500/80 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-rose-500 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors',
                      isLight
                        ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                        : 'border-[rgba(165,130,95,0.3)] bg-white/[0.02]',
                    )}
                  >
                    <Camera className={cn('h-7 w-7 mb-1', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                    <p className={cn('text-xs font-semibold', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>Attach Evidence Photo</p>
                    <p className={cn('text-[10px] mt-0.5', isLight ? 'text-[#8c8472]' : 'text-[#ded6c9]')}>Select image file or capture with device camera</p>

                    <div className="mt-3 flex flex-col w-full gap-2">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer border',
                          isLight
                            ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec]'
                            : 'bg-white/[0.06] hover:bg-white/[0.1] border-[rgba(165,130,95,0.25)] text-[#f7f4ed]',
                        )}
                      >
                        <ImageIcon className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                        Upload from Device / Gallery
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraFileInputRef.current?.click()}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer border',
                          isLight
                            ? 'border-[#e7e2d7] bg-[#ffffff] text-[#353229] hover:bg-[#f6f3ec]'
                            : 'bg-white/[0.06] hover:bg-white/[0.1] border-[rgba(165,130,95,0.25)] text-[#f7f4ed]',
                        )}
                      >
                        <Camera className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                        Take Photo with Camera
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPhotoModalPreview(
                            SAMPLE_PROOF_PHOTOS[activeProfile.deptKey] ||
                              SAMPLE_PROOF_PHOTOS.housekeeping,
                          )
                        }
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                          isLight
                            ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229] hover:bg-[#ebe2cc]'
                            : 'border-[rgba(165,130,95,0.4)] bg-[rgba(200,169,110,0.12)] hover:bg-[rgba(200,169,110,0.18)] text-[#dfc187]',
                        )}
                      >
                        <Sparkles className={cn('h-3.5 w-3.5', isLight ? 'text-[#353229]' : 'text-[#dfc187]')} />
                        Use Sample Department Photo
                      </button>
                    </div>
                  </div>
                )}
                {photoModalError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{photoModalError}</p>
                )}
              </div>

              {/* Actions */}
              <div
                className={cn(
                  'mt-4 flex items-center justify-end gap-2 border-t pt-3',
                  isLight ? 'border-[#e7e2d7]' : 'border-[rgba(165,130,95,0.2)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTask(null);
                    setPhotoModalPreview(null);
                    setPhotoModalError(null);
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs cursor-pointer',
                    isLight
                      ? 'border-[#e7e2d7] text-[#686252] hover:bg-[#f6f3ec]'
                      : 'border-[rgba(165,130,95,0.25)] text-[#ded6c9] hover:text-[#f7f4ed]',
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={isLight ? { color: '#ffffff', backgroundColor: '#353229' } : undefined}
                  onClick={handleSubmitCompletionWithPhoto}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer btn-dark',
                    isLight
                      ? 'bg-[#353229] text-[#ffffff] hover:bg-[#484438]'
                      : 'bg-[#c8a96e] hover:bg-[#dfc187] text-[#14120e]',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  Submit for Inspection
                </button>
              </div>
            </div>
          </div>
        </FulfillerModalPortal>
      )}

      {/* Break & Duty Request Modal */}
      <BreakRequestModal
        isOpen={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        profile={activeProfile}
        isLight={isLight}
        currentAvail={currentAvail}
        onSetAvailability={setFulfillerAvailability}
        onNotify={notify}
        initialType={dutyModalInitialType}
      />
    </div>
  );
}
