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
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { FULFILLER_PROFILES, type FulfillerProfile, taskMatchesFulfillerDept, taskMatchesFulfillerAssignee, isTaskAssignedToProfile } from './fulfillerProfiles';
import { cn, statusTone } from '@/lib/utils';
import type { WorkItem } from '@/types/demo';

type PrimaryView = 'my_tasks' | 'all_tasks';
type MyTasksFilter = 'all' | 'pending' | 'in_progress' | 'blocked' | 'overdue' | 'completed';
type AllTasksFilter = 'all_eligible' | 'open_pool' | 'in_progress' | 'completed';

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

  const currentAvail = state.fulfillerAvailability ?? 'on_duty';
  const isOnBreak = currentAvail === 'break';
  const isOffDuty = currentAvail === 'off_duty';

  // Primary view: "my_tasks" vs "all_tasks"
  const [primaryView, setPrimaryView] = useState<PrimaryView>('my_tasks');
  const [myFilter, setMyFilter] = useState<MyTasksFilter>('all');
  const [allFilter, setAllFilter] = useState<AllTasksFilter>('all_eligible');

  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [blockerModalTask, setBlockerModalTask] = useState<WorkItem | null>(null);
  const [reassignModalTask, setReassignModalTask] = useState<WorkItem | null>(null);
  const [blockerReason, setBlockerReason] = useState(BLOCKER_REASONS[0]);
  const [customBlockerReason, setCustomBlockerReason] = useState('');
  const [reassignReason, setReassignReason] = useState(REASSIGN_REASONS[0]);
  const [customReassignReason, setCustomReassignReason] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

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

  // Filtered tasks for All Tasks view
  const filteredAllTasks = useMemo(() => {
    return allDepartmentTasks.filter((task) => {
      if (allFilter === 'all_eligible')
        return task.status !== 'Completed' && task.status !== 'Closed';
      if (allFilter === 'open_pool') return isQueueTaskUnassigned(task);
      if (allFilter === 'in_progress')
        return (
          !isQueueTaskUnassigned(task) &&
          (task.status === 'Accepted' ||
            task.status === 'In progress' ||
            task.status === 'On the way' ||
            task.status === 'Blocked' ||
            task.status === 'Awaiting inspection')
        );
      if (allFilter === 'completed') return task.status === 'Completed' || task.status === 'Closed';
      return true;
    });
  }, [allDepartmentTasks, allFilter]);

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
    setBlockerModalTask(null);
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
    <div className="flex flex-col gap-3 pb-24">
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
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/[0.06] border border-white/10 max-w-md sm:max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={() => setPrimaryView('my_tasks')}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
            primaryView === 'my_tasks'
              ? 'bg-emerald-500 text-ink-950 shadow-md shadow-emerald-500/25'
              : 'text-mist-400 hover:text-white',
          )}
        >
          <User className="h-3.5 w-3.5" />
          <span>My Tasks</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
              primaryView === 'my_tasks' ? 'bg-black/25 text-ink-950' : 'bg-white/10 text-mist-300',
            )}
          >
            {activeMyTasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPrimaryView('all_tasks')}
          className={cn(
            'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
            primaryView === 'all_tasks'
              ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/25'
              : 'text-mist-400 hover:text-white',
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Tasks</span>
          {unassignedPool.length > 0 ? (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold animate-pulse',
                primaryView === 'all_tasks' ? 'bg-black/25 text-ink-950' : 'bg-amber-400/30 text-amber-200',
              )}
            >
              {unassignedPool.length} open
            </span>
          ) : (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                primaryView === 'all_tasks' ? 'bg-black/25 text-ink-950' : 'bg-white/10 text-mist-300',
              )}
            >
              {allDepartmentTasks.filter((t) => t.status !== 'Completed').length}
            </span>
          )}
        </button>
      </div>

      {/* Sub-Filters: My Tasks */}
      {primaryView === 'my_tasks' && (
        <div className="no-scrollbar -mx-4 sm:mx-0 flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:justify-center px-4 sm:px-0 pb-1">
          <button
            type="button"
            onClick={() => setMyFilter('all')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              myFilter === 'all'
                ? 'bg-emerald-500 text-ink-950 shadow-md shadow-emerald-500/25'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Active
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
              {activeMyTasksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('pending')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              myFilter === 'pending'
                ? 'bg-[#c8a96e] text-[#14120e] shadow-md font-bold'
                : 'border border-[rgba(165,130,95,0.25)] bg-white/[0.04] text-[#ded6c9] hover:text-[#f7f4ed]',
            )}
          >
            Pending
            {pendingCount > 0 && (
              <span className="rounded-full bg-black/25 px-1.5 py-0.2 text-[10px] font-bold text-[#14120e]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('in_progress')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              myFilter === 'in_progress'
                ? 'bg-sky-400 text-ink-950 shadow-md shadow-sky-400/25'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            In Progress
            {inProgressCount > 0 && (
              <span className="rounded-full bg-sky-500/30 px-1.5 py-0.2 text-[10px] font-bold text-sky-200">
                {inProgressCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('completed')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              myFilter === 'completed'
                ? 'bg-emerald-400 text-ink-950 shadow-md shadow-emerald-400/25 font-bold'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Completed
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
              {myTasks.filter((t) => t.status === 'Completed').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMyFilter('overdue')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              myFilter === 'overdue'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Overdue
            {overdueCount > 0 && (
              <span className="rounded-full bg-rose-500/40 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {overdueCount}
              </span>
            )}
          </button>

          {blockedCount > 0 && (
            <button
              type="button"
              onClick={() => setMyFilter('blocked')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                myFilter === 'blocked'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:text-white',
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

      {/* Sub-Filters: All Tasks */}
      {primaryView === 'all_tasks' && (
        <div className="no-scrollbar -mx-4 sm:mx-0 flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:justify-center px-4 sm:px-0 pb-1">
          <button
            type="button"
            onClick={() => setAllFilter('all_eligible')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              allFilter === 'all_eligible'
                ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/25 font-bold'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            All Floors 1–5
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
              {allDepartmentTasks.filter((t) => t.status !== 'Completed').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAllFilter('open_pool')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              allFilter === 'open_pool'
                ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/25 font-bold'
                : 'border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:text-white',
            )}
          >
            <Sparkles className="h-3 w-3" />
            Open to Claim
            {unassignedPool.length > 0 && (
              <span className="rounded-full bg-amber-500/40 px-1.5 py-0.2 text-[10px] font-bold text-amber-100">
                {unassignedPool.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAllFilter('in_progress')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              allFilter === 'in_progress'
                ? 'bg-sky-400 text-ink-950 shadow-md shadow-sky-400/25 font-bold'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            In Progress
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
              {allDepartmentTasks.filter((t) => !isQueueTaskUnassigned(t) && (t.status === 'Accepted' || t.status === 'In progress' || t.status === 'On the way' || t.status === 'Blocked' || t.status === 'Awaiting inspection')).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAllFilter('completed')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              allFilter === 'completed'
                ? 'bg-emerald-400 text-ink-950 shadow-md shadow-emerald-400/25 font-bold'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Completed
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
              {allDepartmentTasks.filter((t) => t.status === 'Completed').length}
            </span>
          </button>
        </div>
      )}

      {/* On Break Notice Banner */}
      {isOnBreak && (
        <div className="flex items-center justify-between rounded-2xl border border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.08)] p-3 text-xs text-[#ded6c9] shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <Coffee className="h-4 w-4 text-[#dfc187] shrink-0" />
            <span className="truncate">
              You are currently <strong>On Break</strong>. Claiming tasks is paused.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFulfillerAvailability('on_duty')}
            className="shrink-0 rounded-xl bg-[#c8a96e] px-2.5 py-1 text-[11px] font-bold text-[#14120e] hover:bg-[#dfc187] transition-colors cursor-pointer"
          >
            Resume Duty
          </button>
        </div>
      )}

      {/* Off Duty Notice Banner */}
      {isOffDuty && (
        <div className="flex items-center justify-between rounded-2xl border border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.08)] p-3 text-xs text-[#ded6c9] shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <Power className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="truncate">
              You are currently <strong>Off Duty</strong>. Switch to On Duty to receive or claim tasks.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFulfillerAvailability('on_duty')}
            className="shrink-0 rounded-xl bg-[#c8a96e] px-2.5 py-1 text-[11px] font-bold text-[#14120e] hover:bg-[#dfc187] transition-colors cursor-pointer"
          >
            Start Shift
          </button>
        </div>
      )}

      {/* Task List Rendering: Mobile 1-col, Tablet 2-col, Desktop 3-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {(primaryView === 'my_tasks' ? filteredMyTasks : filteredAllTasks).length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] py-12 px-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-mist-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">All clear</p>
            <p className="mt-1 text-xs text-mist-400 max-w-xs">
              No tasks currently in this view.
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

            return (
              <div
                key={task.id}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-4 transition-all',
                  isUnassigned
                    ? 'border-amber-400/40 bg-amber-400/[0.04] shadow-md shadow-amber-400/5'
                    : isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                      : isAwaitingInspection
                        ? 'border-[rgba(165,130,95,0.35)] bg-[rgba(200,169,110,0.05)]'
                        : isBlocked
                          ? 'border-rose-500/30 bg-rose-500/[0.05]'
                          : isReassignPending
                            ? 'border-amber-400/30 bg-amber-400/[0.04]'
                            : task.priority === 'vip'
                              ? 'border-amber-400/30 bg-amber-400/[0.03]'
                              : task.priority === 'urgent'
                                ? 'border-orange-400/30 bg-orange-400/[0.03]'
                                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]',
                )}
              >
                {/* Header row: Location, Priority & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold text-white shrink-0">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      {task.room ? `Room ${task.room}` : task.location ?? 'Floor 4'}
                    </span>

                    {task.priority === 'vip' && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 shrink-0">
                        <Crown className="h-2.5 w-2.5" /> VIP
                      </span>
                    )}

                    {task.priority === 'urgent' && (
                      <span className="flex items-center gap-1 rounded-md bg-orange-400/20 px-2 py-0.5 text-[10px] font-bold text-orange-200 shrink-0">
                        <AlertCircle className="h-2.5 w-2.5" /> Urgent
                      </span>
                    )}

                    {isUnassigned && (
                      <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 shrink-0 border border-amber-400/30">
                        Open Pool
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0',
                      isCompleted
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
                  <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span><strong>Blocked:</strong> {task.blockerReason}</span>
                  </div>
                )}

                {/* Title & Metadata */}
                <div className="mt-2.5 cursor-pointer" onClick={() => setSelectedTask(task)}>
                  <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {task.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-mist-300 line-clamp-1">{task.meta}</p>
                </div>

                {/* Guest Personal Preferences (authorized for task fulfillment) */}
                {task.room && state.guestPreferences?.[task.room] && (
                  (() => {
                    const prefs = state.guestPreferences[task.room];
                    const isFoodTask = isFoodAndBeverageTask(task);
                    const hasAllergies = isFoodTask && prefs.allergies && prefs.allergies.length > 0;
                    const hasInstructions = !!prefs.personalInstructions;
                    const isDnd = !!prefs.dnd;
                    if (!hasAllergies && !hasInstructions && !isDnd) return null;

                    return (
                      <div className="mt-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-2.5 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Guest Service Preferences</span>
                        </div>
                        {isDnd && (
                          <p className="text-rose-300 font-bold text-[11px]">
                            ⛔ Do Not Disturb active on room
                          </p>
                        )}
                        {hasAllergies && (
                          <p className="text-mist-200 text-[11px]">
                            <strong className="text-amber-200">Food Allergies (F&B Alert):</strong> {prefs.allergies.join(', ')}
                          </p>
                        )}
                        {hasInstructions && (
                          <p className="text-mist-300 text-[11px] italic">
                            &ldquo;{prefs.personalInstructions}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* SLA & Details strip */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-2.5 text-xs text-mist-400">
                  {task.slaDue && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-mist-400" />
                      Target: {task.slaDue}
                    </span>
                  )}

                  {task.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setViewPhotoUrl(task.photoUrl!)}
                      className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Photo attached</span>
                    </button>
                  )}

                  {task.reassignPending && (
                    <span className="text-[11px] text-amber-300 font-medium">
                      Supervisor review pending ({task.reassignReason})
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className="ml-auto text-[11px] text-mist-400 hover:text-white flex items-center gap-1"
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
                        disabled={isOnBreak || isOffDuty}
                        onClick={() => {
                          if (isOnBreak || isOffDuty) {
                            notify('Cannot claim tasks while on break. Switch to On Duty first.');
                            return;
                          }
                          claimTask(task.id, activeProfile.employeeId, activeProfile.employeeName);
                        }}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all shadow-md',
                          isOnBreak || isOffDuty
                            ? 'bg-white/10 text-mist-400 cursor-not-allowed border border-white/10 opacity-70'
                            : 'bg-amber-400 text-ink-950 shadow-amber-400/20 active:scale-[0.98] hover:bg-amber-300 cursor-pointer',
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

                    {/* Assigned to Me: Accept or Start */}
                    {!isUnassigned && isAssignedToMe && isAssigned && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Accept',
                              next: 'Accepted',
                              message: 'Task accepted',
                            })
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept Task
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Start work',
                              next: 'In progress',
                              message: 'Work commenced',
                            })
                          }
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-transform"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-mist-300 hover:text-white transition-colors"
                        >
                          Reassign
                        </button>
                      </>
                    )}

                    {!isUnassigned && isAssignedToMe && isAccepted && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Start work',
                              next: 'In progress',
                              message: 'Work commenced',
                            })
                          }
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] py-2 px-3 text-xs font-bold text-[#14120e] shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() => handleComplete(task)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] py-2 px-3 text-xs font-bold text-[#14120e] shadow-md shadow-amber-500/10 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-[rgba(165,130,95,0.25)] bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#ded6c9] hover:text-[#f7f4ed] transition-colors cursor-pointer"
                        >
                          Reassign
                        </button>
                      </>
                    )}

                    {!isUnassigned && isAssignedToMe && isInProgress && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleComplete(task)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] py-2 px-3 text-xs font-bold text-[#14120e] shadow-md shadow-amber-500/10 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Completed
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlockerModalTask(task)}
                          className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          Blocker
                        </button>
                      </>
                    )}

                    {!isUnassigned && isAssignedToMe && isBlocked && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            advance('task_fulfiller', task.id, {
                              label: 'Resume',
                              next: 'In progress',
                              message: 'Blocker cleared, work resumed',
                            })
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] py-2 px-3 text-xs font-bold text-[#14120e] shadow-md active:scale-[0.98] transition-transform cursor-pointer"
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
                        <div className="flex items-center justify-between rounded-xl border border-[rgba(165,130,95,0.3)] bg-[rgba(200,169,110,0.08)] px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-[#dfc187] font-semibold">
                            <Clock className="h-4 w-4 text-[#dfc187] shrink-0 animate-pulse" />
                            <span>Pending at Supervisor Inspection</span>
                          </div>
                          <span className="text-[11px] text-[#ded6c9]/80 italic">
                            Supervisor: {activeProfile.supervisorName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed State Banner */}
                {isCompleted && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Task Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.photoUrl && (
                        <span className="text-[11px] text-emerald-300/80 font-medium flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Photo proof
                        </span>
                      )}
                      <span className="text-[11px] text-mist-400 font-mono">
                        {task.history?.filter((h) => h.status === 'Completed').slice(-1)[0]?.at
                          ? `Finished at ${task.history.filter((h) => h.status === 'Completed').slice(-1)[0].at}`
                          : 'Completed'}
                      </span>
                    </div>
                  </div>
                )}
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
            <div className="w-full sm:max-w-xl max-h-[92%] sm:max-h-[85vh] flex flex-col rounded-t-[2rem] sm:rounded-3xl border-t sm:border border-white/20 bg-ink-950 p-4 sm:p-6 text-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      {selectedTask.room ? `Room ${selectedTask.room}` : selectedTask.location || 'Location'}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase',
                        selectedTask.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : selectedTask.status === 'Awaiting inspection'
                            ? 'bg-[#c8a96e]/15 text-[#dfc187] border border-[rgba(165,130,95,0.3)]'
                            : 'bg-white/10 text-mist-300',
                      )}
                    >
                      {selectedTask.status === 'Awaiting inspection'
                        ? 'Pending Inspection'
                        : selectedTask.status}
                    </span>
                    {selectedTask.assignee && (
                      <span className="rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
                        Assignee: {selectedTask.assignee}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-white leading-snug">{selectedTask.title}</h3>
                  <p className="text-xs text-mist-300 mt-0.5">{selectedTask.meta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setPhotoError(null);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content Body (Scrollable inside sheet) */}
              <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3.5 no-scrollbar text-xs">
                {/* Description */}
                {selectedTask.description && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <h4 className="font-semibold text-mist-200 mb-1 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-400" /> Instructions & Notes
                    </h4>
                    <p className="text-mist-300 leading-relaxed">{selectedTask.description}</p>
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
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Guest Room Profile</span>
                      </div>
                      {isDnd && (
                        <p className="text-rose-300 font-bold text-[11px]">
                          ⛔ Do Not Disturb active on room
                        </p>
                      )}
                      {hasAllergies && (
                        <p className="text-mist-200 text-[11px]">
                          <strong className="text-amber-200">Food Allergies (F&B Alert):</strong> {prefs.allergies.join(', ')}
                        </p>
                      )}
                      {hasInstructions && (
                        <p className="text-mist-300 text-[11px] italic">
                          &ldquo;{prefs.personalInstructions}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Photo Evidence (Read-only if attached) */}
                {selectedTask.photoUrl && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-mist-200 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-emerald-400" /> Attached Photo Evidence
                      </h4>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Verified
                      </span>
                    </div>

                    <div
                      className="mt-2.5 relative rounded-xl overflow-hidden border border-white/20 aspect-video bg-black/50 cursor-pointer group"
                      onClick={() => setViewPhotoUrl(selectedTask.photoUrl!)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedTask.photoUrl}
                        alt="Task completion evidence preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex justify-between items-center">
                        <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Tap to view full size
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chronological Task Work Timeline (Actual Shared State) */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <h4 className="font-semibold text-mist-200 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Task Work Timeline
                    </h4>
                    <span className="text-[10px] text-mist-500 font-mono">
                      {selectedTask.history?.length ?? 1} events logged
                    </span>
                  </div>

                  <div className="space-y-3 pl-1">
                    {selectedTask.history && selectedTask.history.length > 0 ? (
                      selectedTask.history.map((entry, idx) => {
                        return (
                          <div key={idx} className="relative pl-5 border-l-2 border-white/10 pb-2 last:border-l-0 last:pb-0">
                            <span
                              className={cn(
                                'absolute -left-[5px] top-0.5 h-2 w-2 rounded-full ring-2 ring-ink-900',
                                entry.status === 'Completed'
                                  ? 'bg-emerald-400'
                                  : entry.status === 'Awaiting inspection'
                                    ? 'bg-[#c8a96e]'
                                    : entry.status === 'Blocked'
                                      ? 'bg-rose-400'
                                      : entry.status === 'Reassignment requested'
                                        ? 'bg-amber-400'
                                        : 'bg-sky-400',
                              )}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white text-xs">{entry.status}</span>
                              <span className="text-[10px] text-mist-400 font-mono">{entry.at}</span>
                            </div>
                            {(entry.actor || entry.role) && (
                              <span className="text-[10px] text-emerald-400 font-medium block">
                                By: {entry.actor ?? 'Attendant'} {entry.role ? `(${entry.role})` : ''}
                              </span>
                            )}
                            {entry.note && (
                              <p className="text-mist-300 text-[11px] mt-0.5 leading-relaxed bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                                {entry.note}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="relative pl-5 border-l-2 border-white/10">
                        <span className="absolute -left-[5px] top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-ink-900" />
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs">Task Created</span>
                          <span className="text-[10px] text-mist-400 font-mono">{selectedTask.createdAt || 'Today'}</span>
                        </div>
                        <p className="text-mist-400 text-[11px] mt-0.5">Task registered in Grand Azure central dispatch.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Dedicated Close and Complete Actions */}
              <div className="mt-3 border-t border-white/10 pt-3 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setPhotoError(null);
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] active:scale-[0.99] py-2.5 text-xs font-semibold text-white transition-all text-center"
                >
                  Close
                </button>
                {selectedTask.status !== 'Completed' && isTaskAssignedToProfile(selectedTask, activeProfile) && (
                  selectedTask.status === 'Awaiting inspection' ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[rgba(200,169,110,0.12)] border border-[rgba(165,130,95,0.3)] py-2.5 px-3 text-xs font-semibold text-[#dfc187] text-center">
                      <Clock className="h-3.5 w-3.5 text-[#dfc187] animate-pulse" />
                      <span>Pending at Supervisor Inspection</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleComplete(selectedTask)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] active:scale-[0.99] py-2.5 text-xs font-bold text-[#14120e] transition-all shadow-md text-center cursor-pointer"
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

      {/* Report Blocker Modal (In-Mobile Dialog) */}
      {blockerModalTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-3xl border border-rose-500/40 bg-ink-950 p-4 text-white shadow-2xl">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-sm text-white">Report Task Blocker</h3>
              </div>
              <p className="mt-1 text-xs text-mist-300">
                Select reason for holding work on <strong>{blockerModalTask.title}</strong>:
              </p>

              <div className="mt-3 space-y-2 max-h-[45vh] overflow-y-auto no-scrollbar">
                {BLOCKER_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                      blockerReason === reason
                        ? 'border-rose-400/50 bg-rose-500/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                    )}
                  >
                    <input
                      type="radio"
                      name="blocker"
                      checked={blockerReason === reason}
                      onChange={() => setBlockerReason(reason)}
                      className="accent-rose-500"
                    />
                    <span className="text-[11px]">{reason}</span>
                  </label>
                ))}

                {blockerReason === 'Others' && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-semibold text-mist-200 mb-1">
                      Type Custom Blocker Reason:
                    </label>
                    <textarea
                      value={customBlockerReason}
                      onChange={(e) => setCustomBlockerReason(e.target.value)}
                      placeholder="Type the specific reason for blocking..."
                      rows={3}
                      className="w-full rounded-xl border border-white/20 bg-white/[0.04] p-2.5 text-xs text-white placeholder:text-mist-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/30 resize-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setBlockerModalTask(null);
                    setCustomBlockerReason('');
                  }}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBlockerSubmit}
                  className="rounded-xl bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-600"
                >
                  Submit Blocker
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
            <div className="w-full max-w-sm rounded-3xl border border-amber-400/40 bg-ink-950 p-4 text-white shadow-2xl">
              <div className="flex items-center gap-2.5 text-amber-400">
                <RotateCcw className="h-5 w-5" />
                <h3 className="font-bold text-sm text-white">Request Task Reassignment</h3>
              </div>
              <p className="mt-1 text-xs text-mist-300">
                This request will be routed to Supervisor <strong>{activeProfile.supervisorName}</strong> for decision. The task remains assigned to you until approved.
              </p>

              <div className="mt-3 space-y-2 max-h-[48vh] overflow-y-auto no-scrollbar">
                {REASSIGN_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors',
                      reassignReason === reason
                        ? 'border-amber-400/50 bg-amber-400/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-mist-300 hover:text-white',
                    )}
                  >
                    <input
                      type="radio"
                      name="reassign"
                      checked={reassignReason === reason}
                      onChange={() => setReassignReason(reason)}
                      className="accent-amber-400"
                    />
                    <span className="text-[11px]">{reason}</span>
                  </label>
                ))}

                {reassignReason === 'Others' && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-semibold text-mist-200 mb-1">
                      Type Reason for Reassignment:
                    </label>
                    <textarea
                      value={customReassignReason}
                      onChange={(e) => setCustomReassignReason(e.target.value)}
                      placeholder="Type the specific reason here..."
                      rows={3}
                      className="w-full rounded-xl border border-white/20 bg-white/[0.04] p-2.5 text-xs text-white placeholder:text-mist-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 resize-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setReassignModalTask(null);
                    setCustomReassignReason('');
                  }}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReassignSubmit}
                  className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-ink-950 shadow-md shadow-amber-400/30 hover:bg-amber-300"
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
            <div className="w-full max-w-sm rounded-3xl border border-[rgba(165,130,95,0.3)] bg-[#161513] p-4 text-[#f7f4ed] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[rgba(165,130,95,0.2)] pb-3">
                <div className="flex items-center gap-2 text-[#dfc187]">
                  <Camera className="h-5 w-5" />
                  <h3 className="font-bold text-sm text-[#f7f4ed]">Complete Task & Upload Photo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTask(null);
                    setPhotoModalPreview(null);
                    setPhotoModalError(null);
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#ded6c9] hover:text-[#f7f4ed] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3">
                <p className="text-xs text-[#ded6c9] leading-relaxed">
                  Provide evidence photo of completed work. Once submitted, task moves to supervisor inspection.
                </p>
                <div className="mt-2 rounded-xl border border-[rgba(165,130,95,0.25)] bg-[rgba(200,169,110,0.05)] p-2.5 text-xs">
                  <div className="font-semibold text-[#f7f4ed] line-clamp-1">{photoModalTask.title}</div>
                  <div className="text-[11px] text-[#d4b896] mt-0.5 flex items-center justify-between">
                    <span>{photoModalTask.room ? `Room ${photoModalTask.room}` : photoModalTask.location || 'Floor 4'}</span>
                    <span>Supervisor: {activeProfile.supervisorName}</span>
                  </div>
                </div>
              </div>

              {/* Photo Preview / Upload Controls */}
              <div className="mt-3">
                {photoModalPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[rgba(165,130,95,0.4)] bg-black/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoModalPreview}
                      alt="Uploaded task photo preview"
                      className="w-full h-40 object-contain bg-black/70"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[#c8a96e] px-2 py-0.5 text-[10px] font-bold text-[#14120e] shadow-sm">
                      <Check className="h-3 w-3" /> Photo Attached
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="rounded-lg bg-black/80 border border-[rgba(165,130,95,0.3)] px-2.5 py-1 text-[10px] font-medium text-[#f7f4ed] hover:bg-black cursor-pointer"
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
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[rgba(165,130,95,0.3)] bg-white/[0.02] p-4 text-center">
                    <Camera className="h-7 w-7 text-[#dfc187] mb-1" />
                    <p className="text-xs font-semibold text-[#f7f4ed]">Attach Evidence Photo</p>
                    <p className="text-[10px] text-[#ded6c9] mt-0.5">Select image file or capture with device camera</p>

                    <div className="mt-3 flex flex-col w-full gap-2">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-[rgba(165,130,95,0.25)] px-3 py-2 text-xs font-semibold text-[#f7f4ed] active:scale-98 transition-all cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4 text-[#dfc187]" />
                        Upload from Device / Gallery
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraFileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-[rgba(165,130,95,0.25)] px-3 py-2 text-xs font-semibold text-[#f7f4ed] active:scale-98 transition-all cursor-pointer"
                      >
                        <Camera className="h-4 w-4 text-[#dfc187]" />
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
                        className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(165,130,95,0.4)] bg-[rgba(200,169,110,0.12)] hover:bg-[rgba(200,169,110,0.18)] px-3 py-1.5 text-xs font-semibold text-[#dfc187] active:scale-98 transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#dfc187]" />
                        Use Sample Department Photo
                      </button>
                    </div>
                  </div>
                )}
                {photoModalError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-400">{photoModalError}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-[rgba(165,130,95,0.2)] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTask(null);
                    setPhotoModalPreview(null);
                    setPhotoModalError(null);
                  }}
                  className="rounded-xl border border-[rgba(165,130,95,0.25)] px-3 py-1.5 text-xs text-[#ded6c9] hover:text-[#f7f4ed] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCompletionWithPhoto}
                  className="flex items-center gap-1.5 rounded-xl bg-[#c8a96e] hover:bg-[#dfc187] px-4 py-2 text-xs font-bold text-[#14120e] transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  Submit for Inspection
                </button>
              </div>
            </div>
          </div>
        </FulfillerModalPortal>
      )}
    </div>
  );
}
