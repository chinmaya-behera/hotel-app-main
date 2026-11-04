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
  Crown,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Layers,
  MapPin,
  Play,
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
type AllTasksFilter = 'all_eligible' | 'open_pool' | 'in_progress';

const BLOCKER_REASONS = [
  'Guest requested privacy (Do Not Disturb)',
  'Room locked / no answer',
  'Awaiting fresh linen or minibar stock',
  'Technical / plumbing issue requires Engineering',
  'Physical safety hazard inside room',
];

const REASSIGN_REASONS = [
  'Assigned room is currently DND / guest sleeping',
  'Urgent spill / turnover needed on another floor',
  'Missing cleaning equipment / chemical supplies',
  'Shift schedule ending / shift handover required',
  'Language / guest communication barrier',
];

const SAMPLE_PROOF_PHOTOS: Record<string, string> = {
  fnb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230b1329'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2313203c' stroke='%2310b981' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%2310b981' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%2334d399' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23ffffff' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Dining Service Delivered</text><text x='200' y='192' fill='%2394a3b8' font-size='12' font-family='sans-serif' text-anchor='middle'>Tray Staged · Temperature Verified · Flutes Placed</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23059669'/><text x='200' y='238' fill='%23ffffff' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
  housekeeping: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230b1329'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2313203c' stroke='%2310b981' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%2310b981' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%2334d399' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23ffffff' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Room Turnover Completed</text><text x='200' y='192' fill='%2394a3b8' font-size='12' font-family='sans-serif' text-anchor='middle'>Fresh Linens · Sanitized · Turndown Standard</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23059669'/><text x='200' y='238' fill='%23ffffff' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
  wellness: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230b1329'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2313203c' stroke='%2310b981' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%2310b981' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%2334d399' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23ffffff' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Spa Suite Prepared</text><text x='200' y='192' fill='%2394a3b8' font-size='12' font-family='sans-serif' text-anchor='middle'>Aromatherapy Setup · Fresh Towels · Ambiance Ready</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23059669'/><text x='200' y='238' fill='%23ffffff' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
  maintenance: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230b1329'/><rect x='16' y='16' width='368' height='268' rx='16' fill='%2313203c' stroke='%2310b981' stroke-width='2'/><circle cx='200' cy='95' r='36' fill='%2310b981' fill-opacity='0.2'/><path d='M188 95l8 8 16-16' stroke='%2334d399' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/><text x='200' y='165' fill='%23ffffff' font-size='18' font-family='sans-serif' text-anchor='middle' font-weight='bold'>Engineering Repair Tested</text><text x='200' y='192' fill='%2394a3b8' font-size='12' font-family='sans-serif' text-anchor='middle'>Thermostat Calibrated · Leak Free · Functional</text><rect x='110' y='218' width='180' height='30' rx='8' fill='%23059669'/><text x='200' y='238' fill='%23ffffff' font-size='11' font-family='sans-serif' text-anchor='middle' font-weight='bold'>PHOTO EVIDENCE VERIFIED</text></svg>",
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
  const { state, advance, attachTaskPhoto, requestTaskReassignment, claimTask } = useDemo();

  // Primary view: "my_tasks" vs "all_tasks"
  const [primaryView, setPrimaryView] = useState<PrimaryView>('my_tasks');
  const [myFilter, setMyFilter] = useState<MyTasksFilter>('all');
  const [allFilter, setAllFilter] = useState<AllTasksFilter>('all_eligible');

  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [blockerModalTask, setBlockerModalTask] = useState<WorkItem | null>(null);
  const [reassignModalTask, setReassignModalTask] = useState<WorkItem | null>(null);
  const [blockerReason, setBlockerReason] = useState(BLOCKER_REASONS[0]);
  const [reassignReason, setReassignReason] = useState(REASSIGN_REASONS[0]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  // Photo Upload Modal (Optional upload across all departments)
  const [photoModalTask, setPhotoModalTask] = useState<WorkItem | null>(null);
  const [photoModalPreview, setPhotoModalPreview] = useState<string | null>(null);
  const [photoModalError, setPhotoModalError] = useState<string | null>(null);

  // All combined department tasks across queues for the active department
  const allDepartmentTasks = useMemo(() => {
    const rawFulfiller = state.items.task_fulfiller ?? [];
    const ddsItems = state.items.department_dispatcher_supervisor ?? [];
    const ddItems = state.items.department_dispatcher ?? [];
    const combined = [...rawFulfiller, ...ddsItems, ...ddItems].filter(
      (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i,
    );

    return combined.filter((t) => taskMatchesFulfillerDept(t, activeProfile.deptKey));
  }, [state.items.task_fulfiller, state.items.department_dispatcher_supervisor, state.items.department_dispatcher, activeProfile.deptKey]);

  // My Tasks: Assigned to or claimed by active department employee
  const myTasks = useMemo(() => {
    return allDepartmentTasks.filter(
      (t) =>
        t.status !== 'Reassigned' &&
        t.status !== 'Unassigned' &&
        taskMatchesFulfillerAssignee(t, activeProfile),
    );
  }, [allDepartmentTasks, activeProfile]);

  // Unassigned Open Pool tasks that can be claimed
  const unassignedPool = useMemo(() => {
    return allDepartmentTasks.filter(
      (t) => (t.status === 'Unassigned' || t.status === 'Received' || !t.assignee) && t.status !== 'Completed',
    );
  }, [allDepartmentTasks]);

  // Filtered tasks for My Tasks view
  const filteredMyTasks = useMemo(() => {
    return myTasks.filter((task) => {
      if (myFilter === 'all') return task.status !== 'Completed';
      if (myFilter === 'pending') return task.status === 'Assigned';
      if (myFilter === 'in_progress')
        return (
          task.status === 'Accepted' ||
          task.status === 'In progress' ||
          task.status === 'On the way' ||
          task.status === 'Blocked'
        );
      if (myFilter === 'blocked') return task.status === 'Blocked';
      if (myFilter === 'completed') return task.status === 'Completed';
      if (myFilter === 'overdue')
        return (
          task.status !== 'Completed' &&
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
      if (allFilter === 'all_eligible') return task.status !== 'Completed';
      if (allFilter === 'open_pool')
        return (task.status === 'Unassigned' || task.status === 'Received' || !task.assignee) && task.status !== 'Completed';
      if (allFilter === 'in_progress')
        return (
          task.status === 'Accepted' ||
          task.status === 'In progress' ||
          task.status === 'On the way' ||
          task.status === 'Blocked'
        );
      return true;
    });
  }, [allDepartmentTasks, allFilter]);

  // Counts for Badges
  const activeMyTasksCount = myTasks.filter((t) => t.status !== 'Completed').length;
  const pendingCount = myTasks.filter((t) => t.status === 'Assigned').length;
  const inProgressCount = myTasks.filter(
    (t) => t.status === 'Accepted' || t.status === 'In progress' || t.status === 'On the way' || t.status === 'Blocked',
  ).length;
  const blockedCount = myTasks.filter((t) => t.status === 'Blocked').length;
  const overdueCount = myTasks.filter(
    (t) => t.status !== 'Completed' && (t.chip?.toLowerCase().includes('overdue') || t.tone === 'danger'),
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
    advance('task_fulfiller', task.id, {
      label: 'Complete',
      next: 'Completed',
      message: 'Task completed',
    });

    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    }
  }

  function openPhotoUpload(task: WorkItem) {
    setPhotoModalTask(task);
    setPhotoModalPreview(task.photoUrl || null);
    setPhotoModalError(null);
  }

  function handleSaveUploadedPhoto() {
    if (!photoModalTask) return;
    if (photoModalPreview) {
      attachTaskPhoto('task_fulfiller', photoModalTask.id, photoModalPreview);
    }
    setPhotoModalTask(null);
    setPhotoModalPreview(null);
    setPhotoModalError(null);
  }

  function handleBlockerSubmit() {
    if (!blockerModalTask) return;
    advance(
      'task_fulfiller',
      blockerModalTask.id,
      {
        label: 'Report blocker',
        next: 'Blocked',
        message: 'Blocker recorded',
        variant: 'danger',
      },
      blockerReason,
    );
    setBlockerModalTask(null);
    if (selectedTask?.id === blockerModalTask.id) {
      setSelectedTask(null);
    }
  }

  function handleReassignSubmit() {
    if (!reassignModalTask) return;
    requestTaskReassignment(reassignModalTask.id, reassignReason);
    setReassignModalTask(null);
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
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/[0.06] border border-white/10">
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
              {unassignedPool.length} to claim
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
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
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
                ? 'bg-amber-400 text-ink-950 shadow-md shadow-amber-400/25'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Pending Ack
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-200">
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

          <button
            type="button"
            onClick={() => setMyFilter('completed')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              myFilter === 'completed'
                ? 'bg-emerald-400 text-ink-950 shadow-md shadow-emerald-400/25'
                : 'border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
            )}
          >
            Completed
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
              {myTasks.filter((t) => t.status === 'Completed').length}
            </span>
          </button>
        </div>
      )}

      {/* Sub-Filters: All Tasks */}
      {primaryView === 'all_tasks' && (
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
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
          </button>
        </div>
      )}

      {/* Task List Rendering */}
      <div className="flex flex-col gap-3">
        {(primaryView === 'my_tasks' ? filteredMyTasks : filteredAllTasks).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] py-12 px-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-mist-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">All clear in this view</p>
            <p className="mt-1 text-xs text-mist-400 max-w-xs">
              {primaryView === 'my_tasks'
                ? `You have no active ${activeProfile.departmentName} tasks matching this filter. Switch to "All Tasks" to claim open work.`
                : 'No department tasks currently available in this filter. Check back shortly.'}
            </p>
          </div>
        ) : (
          (primaryView === 'my_tasks' ? filteredMyTasks : filteredAllTasks).map((task) => {
            const isAssigned = task.status === 'Assigned';
            const isAccepted = task.status === 'Accepted';
            const isInProgress = task.status === 'In progress' || task.status === 'On the way';
            const isBlocked = task.status === 'Blocked';
            const isCompleted = task.status === 'Completed';
            const isReassignPending = task.status === 'Reassignment requested' || task.reassignPending;
            const isUnassigned = task.status === 'Unassigned' || task.status === 'Received' || !task.assignee;
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

                    {isUnassigned ? (
                      <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 shrink-0 border border-amber-400/30">
                        Open Pool
                      </span>
                    ) : isAssignedToMe ? (
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shrink-0 border border-emerald-500/30">
                        Assigned to You
                      </span>
                    ) : (
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-mist-300 shrink-0">
                        {task.assignee ? `Attendant: ${task.assignee}` : 'Assigned'}
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0',
                      isCompleted
                        ? 'bg-emerald-400/20 text-emerald-300'
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
                    {isUnassigned ? 'Unassigned' : task.status}
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
                    <Eye className="h-3 w-3" /> Details & Timeline
                  </button>
                </div>

                {/* Mobile Action Strip */}
                {!isCompleted && !isReassignPending && (
                  <div className="mt-3 flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                    {/* Unassigned / Open Pool: Self-Claim Action */}
                    {isUnassigned && (
                      <button
                        type="button"
                        onClick={() => claimTask(task.id, activeProfile.employeeId, activeProfile.employeeName)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 px-3 text-xs font-bold text-ink-950 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-transform hover:bg-amber-300"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Claim Task (Self-Assign)
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
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-transform"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Start Work
                        </button>
                        <button
                          type="button"
                          onClick={() => openPhotoUpload(task)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
                            task.photoUrl
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
                          )}
                          title="Upload or capture task photo"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          {task.photoUrl ? 'Photo ✓' : 'Upload Photo'}
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

                    {!isUnassigned && isAssignedToMe && isInProgress && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleComplete(task)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Completed
                        </button>

                        <button
                          type="button"
                          onClick={() => openPhotoUpload(task)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5',
                            task.photoUrl
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
                          )}
                          title="Upload or capture task photo"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          {task.photoUrl ? 'Photo ✓' : 'Upload Photo'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlockerModalTask(task)}
                          className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
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
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 px-3 text-xs font-semibold text-ink-950 shadow-md active:scale-[0.98] transition-transform"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Resume Work
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassignModalTask(task)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-mist-300 hover:text-white transition-colors"
                        >
                          Request Reassign
                        </button>
                      </>
                    )}
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

      {/* Task Details & Chronological Timeline Modal (In-Mobile Sheet) */}
      {selectedTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-h-[92%] flex flex-col rounded-t-[2rem] border-t border-white/20 bg-ink-950 p-4 text-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      {selectedTask.room ? `Room ${selectedTask.room}` : selectedTask.location || 'Location'}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-mist-300">
                      {selectedTask.status}
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

              {/* Footer: Dedicated Close Button */}
              <div className="mt-3 border-t border-white/10 pt-3 flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setPhotoError(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] active:scale-[0.99] py-2.5 text-xs font-semibold text-white transition-all text-center"
                >
                  Close
                </button>
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
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setBlockerModalTask(null)}
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

              <div className="mt-3 space-y-2 max-h-[45vh] overflow-y-auto no-scrollbar">
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
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setReassignModalTask(null)}
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

      {/* Upload Task Photo Modal (In-Mobile Dialog) */}
      {photoModalTask && (
        <FulfillerModalPortal>
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-ink-950 p-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Camera className="h-5 w-5" />
                  <h3 className="font-bold text-sm text-white">Upload Task Photo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoModalTask(null)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3">
                <p className="text-xs text-mist-300">
                  Upload an evidence or verification photo for this {activeProfile.departmentName} task.
                </p>
                <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-xs">
                  <div className="font-semibold text-white line-clamp-1">{photoModalTask.title}</div>
                  <div className="text-[11px] text-mist-400 mt-0.5">
                    {photoModalTask.room ? `Room ${photoModalTask.room}` : photoModalTask.location || 'Floor 4'} · {activeProfile.employeeName}
                  </div>
                </div>
              </div>

              {/* Photo Preview / Upload Controls */}
              <div className="mt-3">
                {photoModalPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoModalPreview}
                      alt="Uploaded task photo preview"
                      className="w-full h-40 object-contain bg-black/60"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-ink-950 backdrop-blur-sm">
                      <Check className="h-3 w-3" /> Photo Selected
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="rounded-lg bg-black/75 border border-white/20 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-black/90"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoModalPreview(null)}
                        className="rounded-lg bg-rose-500/80 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-4 text-center">
                    <Camera className="h-7 w-7 text-emerald-400 mb-1" />
                    <p className="text-xs font-semibold text-white">Choose Photo Source</p>
                    <p className="text-[10px] text-mist-400 mt-0.5">Select image file or take with camera</p>

                    <div className="mt-3 flex flex-col w-full gap-2">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 px-3 py-2 text-xs font-semibold text-white active:scale-98 transition-all"
                      >
                        <ImageIcon className="h-4 w-4 text-emerald-400" />
                        Upload from Device / Gallery
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraFileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 px-3 py-2 text-xs font-semibold text-white active:scale-98 transition-all"
                      >
                        <Camera className="h-4 w-4 text-sky-400" />
                        Take Photo with Camera
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhotoModalPreview(SAMPLE_PROOF_PHOTOS[activeProfile.deptKey] || SAMPLE_PROOF_PHOTOS.housekeeping)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-200 active:scale-98 transition-all"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
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
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalTask(null);
                    setPhotoModalPreview(null);
                  }}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUploadedPhoto}
                  disabled={!photoModalPreview}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md',
                    photoModalPreview
                      ? 'bg-emerald-500 text-ink-950 shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95'
                      : 'bg-white/10 text-mist-500 cursor-not-allowed',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </FulfillerModalPortal>
      )}
    </div>
  );
}
