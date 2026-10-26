import {
  folioSeed,
  frontDeskSeed,
  integrationList,
  lostFoundSeed,
  seedAuditTrail,
  seedFeed,
  seedIncidents,
  seedIntegrations,
  seedItems,
  seedNotifications,
  seedResourceRequests,
  seedRoutingRules,
  seedShiftHandovers,
  seedStaffAccounts,
  seedWorkflowConfig,
  seedInvoices,
  seedTransactions,
  seedRefundRequests,
  seedInspections,
} from './mockData.ts';
import { afterAdvance, markCheckedOut, type FdResult } from './frontDesk.ts';
import { roleById } from './roles.ts';
import type {
  Tone,
  AuditEvent,
  DemoState,
  GuestHistoryEntry,
  InAppNotification,
  IncidentRecord,
  IntegrationState,
  LostFoundItem,
  OrderLine,
  ResourceRequest,
  RoleId,
  RoutingRule,
  ShiftHandover,
  StaffAccount,
  ThemeMode,
  Transition,
  WorkflowConfig,
  WorkItem,
  FinanceInvoice,
  FinanceTransaction,
  FinanceRefundRequest,
  SupervisorInspection,
  PaymentMethod,
  TransactionStatus,
  InvoiceStatus,
  RefundStatus,
} from '../types/demo.ts';

import type {DemoApi,LifecycleStep,GuestRequestInput} from './contracts.ts';
import * as fdReducers from './frontDesk.ts';
import * as roomReducers from './frontDeskRooms.ts';
import * as bookingReducers from './bookings.ts';
export function seedExperience(): DemoState {
  return structuredClone({
    persona: null,
    items: seedItems,
    feed: seedFeed,
    integrations: seedIntegrations,
    revokedRooms: [] as string[],
    folios: folioSeed,
    lostFound: lostFoundSeed,
    theme: 'light',
    frontDesk: frontDeskSeed,
    bookings: [],
    staffAccounts: seedStaffAccounts,
    auditTrail: seedAuditTrail,
    workflowConfig: seedWorkflowConfig,
    soundEnabled: true,
    fulfillerAvailability: 'on_duty',
    notifications: seedNotifications,
    shiftChangeRequest: null,
    routingRules: seedRoutingRules,
    resourceRequests: seedResourceRequests,
    shiftHandovers: seedShiftHandovers,
    incidents: seedIncidents,
    invoices: seedInvoices,
    transactions: seedTransactions,
    refundRequests: seedRefundRequests,
    inspections: seedInspections,
  }) as DemoState;
}

export function matchesFloorZone(floorZone: string | undefined, taskFloor: number | undefined): boolean {
  if (!taskFloor || !floorZone) return true;
  const fz = floorZone.toLowerCase();
  if (fz.includes('all') || fz.includes('property')) return true;
  const rangeMatch = fz.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return taskFloor >= min && taskFloor <= max;
  }
  const singleMatch = fz.match(/(\d+)/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10) === taskFloor;
  }
  return true;
}



const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let uidCounter = 0;
const uid = () => crypto.randomUUID();

const refCounter: Record<string, number> = {};
function nextRef(prefix: string, room: string) {
  const key = `${prefix}-${room}`;
  refCounter[key] = (refCounter[key] ?? 0) + 1;
  return `${prefix}-${room}-${String(refCounter[key]).padStart(3, '0')}`;
}

const DEPT_PREFIX: Record<string, string> = {
  housekeeping: 'HK',
  maintenance: 'MX',
  spa: 'SP',
  concierge: 'CC',
  room_service: 'RS',
  folio: 'FD',
  lost_found: 'LF',
};

const NEXT_INTEGRATION: Record<IntegrationState, IntegrationState> = {
  healthy: 'degraded',
  degraded: 'down',
  down: 'healthy',
};

const GUEST_REQUEST_LIFECYCLE: LifecycleStep[] = [
  { status: 'Acknowledged', delayMs: 6000, chip: 'Being reviewed', tone: 'info' },
  { status: 'In progress', delayMs: 16000, chip: 'Team on the way', tone: 'info' },
  { status: 'Completed', delayMs: 32000, chip: 'Completed', tone: 'success' },
];

const ORDER_LIFECYCLE: LifecycleStep[] = [
  { status: 'Preparing', delayMs: 5000, chip: 'In the kitchen', tone: 'info' },
  { status: 'Ready', delayMs: 14000, chip: 'Ready for dispatch', tone: 'info' },
  { status: 'On the way', delayMs: 22000, chip: 'Runner dispatched', tone: 'warning' },
  { status: 'Delivered', delayMs: 34000, chip: 'Delivered', tone: 'success' },
];


export function createExperienceEngine(initial:DemoState, commandId:string=crypto.randomUUID()){let uidCounter=0;const uid=()=>commandId+'-'+uidCounter++;const nextRef=(prefix:string,room:string)=>prefix+'-'+room+'-'+commandId.slice(0,8).toUpperCase();let state=structuredClone(initial);const messages:string[]=[];const notify=(text:string)=>messages.push(text);const stateRef={get current(){return state;}};const setState=(updater:DemoState|((previous:DemoState)=>DemoState))=>{state=typeof updater==='function'?updater(state):updater;};const useCallback=<T,>(fn:T,_deps:unknown[]):T=>fn;
  const recordAuditEvent = useCallback<DemoApi['recordAuditEvent']>((event) => {
    const newEntry: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}-${uidCounter++}`,
      timestamp: nowLabel(),
    };
    setState((prev) => ({
      ...prev,
      auditTrail: [newEntry, ...(prev.auditTrail ?? [])].slice(0, 80),
    }));
  }, []);

  const setPersona = useCallback((id: RoleId) => {
    setState((prev) => (prev.persona === id ? prev : { ...prev, persona: id }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => (prev.theme === theme ? prev : { ...prev, theme }));
  }, []);

  const advance = useCallback<DemoApi['advance']>(
    (roleId, itemId, t, reason) => {
      const item = stateRef.current.items[roleId]?.find((i) => i.id === itemId);
      if (!item) return;
      const text = `${t.message}: ${item.title}${reason ? ` · ${reason}` : ''}`;
      const revokes = Boolean(t.revokesQr && item.room);
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: t.next, note: reason };

      setState((prev) => {
        const nextItems = { ...prev.items };
        // Update the item in the active role
        nextItems[roleId] = nextItems[roleId].map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: t.next,
                selfRequested: t.marksSelf ? true : i.selfRequested,
                blockerReason: t.next === 'Blocked' ? (reason ?? i.blockerReason) : (t.next === 'In progress' ? undefined : i.blockerReason),
                history: [...(i.history ?? []), historyEntry],
              }
            : i,
        );

        // Connected cross-role update: If this is a fulfiller task or guest request, also update any mirrored item in other roles
        if (item.ref) {
          (Object.keys(nextItems) as RoleId[]).forEach((otherRoleId) => {
            if (otherRoleId !== roleId) {
              nextItems[otherRoleId] = nextItems[otherRoleId].map((other) => {
                if (other.ref === item.ref || (other.room === item.room && other.title === item.title)) {
                  return {
                    ...other,
                    status: t.next,
                    history: [...(other.history ?? []), historyEntry],
                  };
                }
                return other;
              });
            }
          });
        }

        return {
          ...prev,
          items: nextItems,
          feed: [{ id: uid(), at: nowLabel(), role: roleById[roleId].short, text }, ...prev.feed].slice(0, 30),
          revokedRooms:
            revokes && item.room && !prev.revokedRooms.includes(item.room)
              ? [...prev.revokedRooms, item.room]
              : prev.revokedRooms,
        };
      });
      setState((prev) => afterAdvance(prev, roleId, t.next, item.room));
      notify(revokes ? `${text} · Room ${item.room} guest session revoked` : text);
    },
    [notify],
  );

  const cycleIntegration = useCallback(
    (id: string) => {
      const current = stateRef.current.integrations[id] ?? 'healthy';
      const next = NEXT_INTEGRATION[current];
      const name = integrationList.find((i) => i.id === id)?.name ?? id;
      const text = `${name} set to ${next} (simulated)`;
      setState((prev) => ({
        ...prev,
        integrations: { ...prev.integrations, [id]: next },
        feed: [{ id: uid(), at: nowLabel(), role: 'Admin', text }, ...prev.feed].slice(0, 30),
      }));
      notify(text);
    },
    [notify],
  );

  /** Patches one work item in place and records a status-history entry + feed line. */
  const patchGuestItem = useCallback(
    (roleId: RoleId, itemId: string, patch: Partial<WorkItem>, feedText?: string, feedRole?: string) => {
      setState((prev) => {
        const current = prev.items[roleId]?.find((i) => i.id === itemId);
        if (!current) return prev;
        const historyEntry: GuestHistoryEntry | null = patch.status ? { at: nowLabel(), status: patch.status } : null;
        return {
          ...prev,
          items: {
            ...prev.items,
            [roleId]: prev.items[roleId].map((i) =>
              i.id === itemId
                ? { ...i, ...patch, history: historyEntry ? [...(i.history ?? []), historyEntry] : i.history }
                : i,
            ),
          },
          feed: feedText
            ? [{ id: uid(), at: nowLabel(), role: feedRole ?? roleById[roleId].short, text: feedText }, ...prev.feed].slice(0, 30)
            : prev.feed,
        };
      });
    },
    [],
  );

  /** Schedules a chain of simulated status updates + notifications for a guest-originated item. */
  const scheduleLifecycle = (..._args:any[]) => {};
  const submitGuestRequest = useCallback<DemoApi['submitGuestRequest']>(
    (input) => {
      const ref = nextRef(DEPT_PREFIX[input.category] ?? 'GR', input.room);
      // Concierge requests enter the Front Desk queue; everything else goes to the department dispatcher.
      const isConcierge = input.category === 'concierge';
      const targetRole: RoleId = isConcierge ? 'front_desk_coordinator' : 'department_dispatcher';
      const id = uid();
      const createdAt = nowLabel();
      const newItem: WorkItem = {
        id,
        title: input.title,
        meta: input.meta,
        status: isConcierge ? 'Received' : 'Unassigned',
        chip: input.chip ?? (isConcierge ? 'Awaiting Front Desk' : 'Just now'),
        tone: input.tone ?? 'warning',
        room: input.room,
        guest: true,
        category: input.category,
        description: input.description,
        priority: input.priority ?? 'normal',
        ref,
        createdAt,
        dnd: input.dnd,
        photoAttached: input.photoAttached,
        owner: isConcierge ? 'Front Desk' : undefined,
        history: [{ at: createdAt, status: isConcierge ? 'Received' : 'Unassigned' }],
      };

      setState((prev) => {
        let next: DemoState = {
          ...prev,
          items: { ...prev.items, [targetRole]: [newItem, ...prev.items[targetRole]] },
          feed: [
            { id: uid(), at: createdAt, role: 'Guest Portal', text: `${ref} submitted · ${input.title} · Room ${input.room}` },
            ...prev.feed,
          ].slice(0, 30),
        };

        if (input.folioCharge) {
          next = {
            ...next,
            folios: {
              ...next.folios,
              [input.room]: [
                ...(next.folios[input.room] ?? []),
                { id: `fo-${id}`, label: input.folioCharge.label, amount: input.folioCharge.amount, date: createdAt },
              ],
            },
          };
        }

        if (input.category === 'maintenance' && input.priority === 'safety') {
          const alertItem: WorkItem = {
            id: uid(),
            title: `Safety alert · ${input.title}`,
            meta: `Escalated from Guest Portal · Room ${input.room}`,
            status: 'Escalated',
            chip: 'Safety / security',
            tone: 'danger',
            room: input.room,
            guest: true,
            priority: 'safety',
          };
          next = { ...next, items: { ...next.items, department_manager: [alertItem, ...next.items.department_manager] } };
        }

        // Cross-Role Connected Workflow: Housekeeping requests enter the Fulfiller queue as Assigned work with notification
        if (input.category === 'housekeeping') {
          const fulfillerItem: WorkItem = {
            id: `ful-${id}`,
            title: `${input.title} · Room ${input.room}`,
            meta: `Housekeeping · Floor ${input.room[0] ?? '4'} · Guest request`,
            status: 'Assigned',
            chip: 'New dispatch',
            tone: 'warning',
            room: input.room,
            guest: true,
            ref,
            category: input.category,
            priority: input.priority ?? 'urgent',
            description: input.description,
            createdAt,
            location: `Room ${input.room}, Level ${input.room[0] ?? '4'}`,
            assignee: 'Sofia Rivera',
            slaDue: 'Due in 15m',
            history: [{ at: createdAt, status: 'Assigned', note: 'Dispatched from Guest Portal' }],
          };
          const notif: InAppNotification = {
            id: `notif-${id}`,
            roleId: 'task_fulfiller',
            title: `New Task: ${input.title}`,
            message: `Room ${input.room} · ${ref} dispatched to your queue`,
            timestamp: createdAt,
            read: false,
            type: 'task',
            itemId: `ful-${id}`,
          };
          next = {
            ...next,
            items: { ...next.items, task_fulfiller: [fulfillerItem, ...next.items.task_fulfiller] },
            notifications: [notif, ...(next.notifications ?? [])],
          };
        }

        return next;
      });

      notify(`Request sent · Reference ${ref}`);
      // Only schedule mock timers for automated non-staff items. Real fulfiller tasks are advanced interactively by staff.
      if (!isConcierge && input.category !== 'housekeeping') {
        scheduleLifecycle(targetRole, id, ref, input.title, input.lifecycle ?? GUEST_REQUEST_LIFECYCLE);
      }
      return ref;
    },
    [notify, scheduleLifecycle],
  );

  /* ---- Fulfiller & Mobile App Specific Store Actions ---- */

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, soundEnabled: enabled }));
  }, []);

  const setFulfillerAvailability = useCallback((avail: 'on_duty' | 'break' | 'off_duty') => {
    setState((prev) => {
      const label = avail === 'on_duty' ? 'On Duty' : avail === 'break' ? 'On Break' : 'Off Duty';
      const text = `Sofia Rivera status set to ${label}`;
      return {
        ...prev,
        fulfillerAvailability: avail,
        feed: [{ id: uid(), at: nowLabel(), role: 'Housekeeping', text }, ...prev.feed].slice(0, 30),
      };
    });
    notify(`Availability changed: ${avail === 'on_duty' ? 'On Duty' : avail === 'break' ? 'On Break' : 'Off Duty'}`);
  }, [notify]);

  const attachTaskPhoto = useCallback((roleId: RoleId, itemId: string, dataUrl: string) => {
    setState((prev) => {
      const item = prev.items[roleId]?.find((i) => i.id === itemId);
      if (!item) return prev;
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: item.status, note: 'Photo evidence attached' };
      return {
        ...prev,
        items: {
          ...prev.items,
          [roleId]: prev.items[roleId].map((i) =>
            i.id === itemId
              ? { ...i, photoUrl: dataUrl, photoAttached: true, history: [...(i.history ?? []), historyEntry] }
              : i,
          ),
        },
        feed: [{ id: uid(), at: nowLabel(), role: roleById[roleId].short, text: `Photo attached for ${item.title}` }, ...prev.feed].slice(0, 30),
      };
    });
    notify('Photo attached successfully');
  }, [notify]);

  const requestTaskReassignment = useCallback((itemId: string, reason: string) => {
    setState((prev) => {
      const item = prev.items.task_fulfiller?.find((i) => i.id === itemId);
      if (!item) return prev;
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: 'Reassignment requested', note: `Reason: ${reason}` };
      const supervisorItem: WorkItem = {
        id: uid(),
        title: `Reassign request · ${item.title}`,
        meta: `Requested by Sofia Rivera · Housekeeping · Floor ${item.room?.[0] ?? '4'}`,
        status: 'Awaiting inspection',
        chip: 'Reassignment request',
        tone: 'warning',
        priority: 'urgent',
        room: item.room,
        linkedRef: item.ref,
        description: `Fulfiller requested reassignment. Reason: ${reason}`,
        createdAt: nowLabel(),
      };
      const supervisorNotif: InAppNotification = {
        id: uid(),
        roleId: 'department_supervisor',
        title: 'Task Reassignment Request',
        message: `Sofia Rivera requested reassignment for ${item.title} (${reason})`,
        timestamp: nowLabel(),
        read: false,
        type: 'reassign',
        itemId: item.id,
      };

      return {
        ...prev,
        items: {
          ...prev.items,
          task_fulfiller: prev.items.task_fulfiller.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: 'Reassignment requested',
                  chip: 'Pending supervisor review',
                  tone: 'warning',
                  reassignPending: true,
                  reassignReason: reason,
                  history: [...(i.history ?? []), historyEntry],
                }
              : i,
          ),
          department_supervisor: [supervisorItem, ...prev.items.department_supervisor],
        },
        notifications: [supervisorNotif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: nowLabel(), role: 'Housekeeping', text: `Reassignment requested for ${item.title}: ${reason}` },
          ...prev.feed,
        ].slice(0, 30),
      };
    });
    notify(`Reassignment request submitted to supervisor: ${reason}`);
  }, [notify]);

  const resolveReassignment = useCallback((supervisorItemId: string, fulfillerItemId: string, approved: boolean) => {
    setState((prev) => {
      const fulfillerItem = prev.items.task_fulfiller?.find((i) => i.id === fulfillerItemId);
      const note = approved ? 'Reassigned to alternate attendant' : 'Reassignment declined by Supervisor';
      const historyEntry: GuestHistoryEntry = { at: nowLabel(), status: approved ? 'Reassigned' : 'Assigned', note };
      const notif: InAppNotification = {
        id: uid(),
        roleId: 'task_fulfiller',
        title: approved ? 'Reassignment Approved' : 'Reassignment Declined',
        message: approved
          ? `Your reassignment request for ${fulfillerItem?.title ?? 'task'} was approved.`
          : `Reassignment declined by Oliver Reed. Please proceed with task.`,
        timestamp: nowLabel(),
        read: false,
        type: 'reassign',
        itemId: fulfillerItemId,
      };

      return {
        ...prev,
        items: {
          ...prev.items,
          task_fulfiller: prev.items.task_fulfiller.map((i) =>
            i.id === fulfillerItemId
              ? {
                  ...i,
                  status: approved ? 'Completed' : 'Assigned',
                  chip: approved ? 'Reassigned' : 'Reassignment declined',
                  reassignPending: false,
                  history: [...(i.history ?? []), historyEntry],
                }
              : i,
          ),
          department_supervisor: prev.items.department_supervisor.map((i) =>
            i.id === supervisorItemId ? { ...i, status: 'Closed' } : i,
          ),
        },
        notifications: [notif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: nowLabel(), role: 'Supervisor', text: `Reassignment ${approved ? 'approved' : 'declined'} for ${fulfillerItem?.title ?? 'task'}` },
          ...prev.feed,
        ].slice(0, 30),
      };
    });
    notify(approved ? 'Reassignment approved' : 'Reassignment declined');
  }, [notify]);

  const requestEmergencyShiftChange = useCallback((reason: string, details?: string) => {
    const timestamp = nowLabel();
    setState((prev) => {
      const alert: WorkItem = {
        id: uid(),
        title: `Emergency shift relief · Sofia Rivera`,
        meta: `Housekeeping · Floor Zone 1–5 · Reason: ${reason}`,
        status: 'Escalated',
        chip: 'Shift Relief Needed',
        tone: 'danger',
        priority: 'urgent',
        description: details ?? reason,
        createdAt: timestamp,
      };
      const dutyNotif: InAppNotification = {
        id: uid(),
        roleId: 'department_manager',
        title: 'Emergency Shift Relief Request',
        message: `Sofia Rivera (Housekeeping): ${reason}`,
        timestamp,
        read: false,
        type: 'alert',
      };
      return {
        ...prev,
        shiftChangeRequest: { requestedAt: timestamp, reason, status: 'pending', details },
        items: { ...prev.items, department_manager: [alert, ...prev.items.department_manager] },
        notifications: [dutyNotif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: timestamp, role: 'Housekeeping', text: `Emergency shift relief requested by Sofia Rivera: ${reason}` },
          ...prev.feed,
        ].slice(0, 30),
      };
    });
    notify('Emergency shift handover request logged with Duty Manager');
  }, [notify]);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const clearAllNotifications = useCallback((roleId?: RoleId) => {
    setState((prev) => ({
      ...prev,
      notifications: roleId
        ? (prev.notifications ?? []).filter((n) => n.roleId !== roleId)
        : [],
    }));
  }, []);

  const assignDispatcherTask = useCallback<DemoApi['assignDispatcherTask']>(
    (taskId, staffId) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        const staff = (prev.staffAccounts ?? []).find((s) => s.id === staffId || s.employeeId === staffId);
        if (!task || !staff) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Assigned',
          note: `Assigned to ${staff.name} (${staff.employeeId}) by Dispatcher James Chen`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Assigned',
          assignee: staff.name,
          assigneeId: staff.employeeId,
          assignedAt: timestamp,
          chip: `Assigned: ${staff.name.split(' ')[0]}`,
          tone: 'info',
          autoAssigned: false,
          assignmentFailureReason: undefined,
          history: [...(task.history ?? []), historyEntry],
        };

        let nextFulfillerItems = prev.items.task_fulfiller ?? [];
        if (staff.roleId === 'task_fulfiller') {
          const existingIdx = nextFulfillerItems.findIndex(
            (f) => f.id === task.id || (task.ref && f.ref === task.ref)
          );
          const fulfillerTask: WorkItem = {
            ...updatedTask,
            location: updatedTask.location || (task.room ? `Room ${task.room}, Level ${task.floor || task.room[0]}` : undefined),
            evidenceRequired: task.category === 'maintenance' || task.category === 'housekeeping',
          };
          if (existingIdx >= 0) {
            nextFulfillerItems = nextFulfillerItems.map((f, i) => (i === existingIdx ? fulfillerTask : f));
          } else {
            nextFulfillerItems = [fulfillerTask, ...nextFulfillerItems];
          }
        }

        const notif: InAppNotification = {
          id: uid(),
          roleId: staff.roleId,
          title: 'New Dispatch Assignment',
          message: `${task.title} assigned to you · Location: Room ${task.room || 'General'}`,
          timestamp,
          read: false,
          type: 'task',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
            task_fulfiller: nextFulfillerItems,
          },
          notifications: [notif, ...(prev.notifications ?? [])],
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `Assigned ${task.ref || task.title} to ${staff.name}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'James Chen',
        actorRole: 'Department Dispatcher',
        action: 'Task manually dispatched to staff',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `Assignee: ${staffId}`,
      });
      notify(`Assigned task to ${staffId}`);
    },
    [notify, recordAuditEvent],
  );

  const autoAssignTask = useCallback<DemoApi['autoAssignTask']>(
    (taskId) => {
      const timestamp = nowLabel();
      const currentState = stateRef.current;
      const task = currentState.items.department_dispatcher?.find((i) => i.id === taskId);
      if (!task) return { success: false, reason: 'Task not found' };

      const taskDept = task.department?.toLowerCase() ||
        (task.category === 'housekeeping' ? 'housekeeping' :
         task.category === 'maintenance' ? 'maintenance' :
         task.category === 'room_service' ? 'food & beverage' : 'operations');

      const taskFloor = task.floor || (task.room ? parseInt(task.room[0], 10) : undefined);

      const eligibleStaff = (currentState.staffAccounts ?? []).filter((s) => {
        if (s.roleId !== 'task_fulfiller' || s.status !== 'active') return false;
        if (s.availability && s.availability !== 'on_duty') return false;
        const staffDept = s.department.toLowerCase();
        return staffDept.includes(taskDept) || taskDept.includes(staffDept);
      });

      if (eligibleStaff.length === 0) {
        setState((prev) => ({
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) =>
              i.id === taskId
                ? { ...i, assignmentFailureReason: `No on-duty ${taskDept} staff available` }
                : i
            ),
          },
        }));
        notify(`Auto-assign failed: No on-duty ${task.department || 'field'} staff available`);
        return { success: false, reason: 'No on-duty staff available in department' };
      }

      // 1. Calculate active tasks and capacity for each eligible staff member
      const staffWithLoads = eligibleStaff.map((staff) => {
        const activeCount = (currentState.items.task_fulfiller ?? []).filter(
          (f) => f.assigneeId === staff.employeeId && f.status !== 'Completed' && f.status !== 'Cancelled'
        ).length;
        const maxLoad = staff.maxWorkload || 5;
        const isOverloaded = activeCount >= maxLoad;
        const floorMatch = matchesFloorZone(staff.floorZone, taskFloor);

        return {
          staff,
          activeCount,
          maxLoad,
          isOverloaded,
          floorMatch,
        };
      });

      // 2. Exclude employees who have reached configured capacity
      const withCapacity = staffWithLoads.filter((s) => !s.isOverloaded);
      if (withCapacity.length === 0) {
        setState((prev) => ({
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) =>
              i.id === taskId
                ? { ...i, assignmentFailureReason: `All ${eligibleStaff.length} eligible ${taskDept} employees are at maximum task capacity` }
                : i
            ),
          },
        }));
        notify(`Auto-assign failed: All ${taskDept} staff are at maximum capacity`);
        return { success: false, reason: 'All eligible staff are at maximum capacity' };
      }

      // 3. Match floor/zone when applicable
      const floorMatched = withCapacity.filter((s) => s.floorMatch);
      const candidatePool = floorMatched.length > 0 ? floorMatched : withCapacity;

      // 4. Select eligible employee with lowest active workload; deterministic tie-breaker by employeeId
      candidatePool.sort((a, b) => a.activeCount - b.activeCount || a.staff.employeeId.localeCompare(b.staff.employeeId));
      const chosen = candidatePool[0];

      const assignedStaff = chosen.staff;
      const matchNote = chosen.floorMatch && floorMatched.length > 0
        ? `Floor-matched (${assignedStaff.floorZone}) with lowest active workload (${chosen.activeCount}/${chosen.maxLoad})`
        : `Lowest active workload (${chosen.activeCount}/${chosen.maxLoad})`;

      const historyEntry: GuestHistoryEntry = {
        at: timestamp,
        status: 'Assigned',
        note: `Auto-dispatched: ${matchNote} to ${assignedStaff.name} (${assignedStaff.employeeId}) via Deterministic Engine`,
      };

      const updatedTask: WorkItem = {
        ...task,
        status: 'Assigned',
        assignee: assignedStaff.name,
        assigneeId: assignedStaff.employeeId,
        assignedAt: timestamp,
        chip: `Auto: ${assignedStaff.name.split(' ')[0]}`,
        tone: 'info',
        autoAssigned: true,
        assignmentFailureReason: undefined,
        history: [...(task.history ?? []), historyEntry],
      };

      let nextFulfillerItems = currentState.items.task_fulfiller ?? [];
      const existingIdx = nextFulfillerItems.findIndex(
        (f) => f.id === task.id || (task.ref && f.ref === task.ref)
      );
      const fulfillerTask: WorkItem = {
        ...updatedTask,
        location: updatedTask.location || (task.room ? `Room ${task.room}, Level ${task.floor || task.room[0]}` : undefined),
        evidenceRequired: task.category === 'maintenance' || task.category === 'housekeeping',
      };
      if (existingIdx >= 0) {
        nextFulfillerItems = nextFulfillerItems.map((f, i) => (i === existingIdx ? fulfillerTask : f));
      } else {
        nextFulfillerItems = [fulfillerTask, ...nextFulfillerItems];
      }

      const notif: InAppNotification = {
        id: uid(),
        roleId: 'task_fulfiller',
        title: 'Auto-Routed Task Assigned',
        message: `${task.title} auto-routed to your queue · SLA ${task.slaDue || '25m'}`,
        timestamp,
        read: false,
        type: 'task',
        itemId: task.id,
      };

      setState((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
          task_fulfiller: nextFulfillerItems,
        },
        notifications: [notif, ...(prev.notifications ?? [])],
        feed: [
          { id: uid(), at: timestamp, role: 'Auto-Router', text: `Deterministic engine assigned ${task.ref || task.title} to ${assignedStaff.name}` },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Auto-Routing Engine',
        actorRole: 'Department Dispatcher',
        action: 'Deterministic auto-assignment executed',
        category: 'Workflow',
        resource: `Task ${task.ref || task.id}`,
        outcome: 'success',
        details: `Matched to ${assignedStaff.name} (${assignedStaff.employeeId}) with current load ${chosen.activeCount}/${chosen.maxLoad}`,
      });

      notify(`Auto-assigned to ${assignedStaff.name} (${assignedStaff.department})`);
      return { success: true, staffName: assignedStaff.name };
    },
    [notify, recordAuditEvent],
  );

  const reassignDispatcherTask = useCallback<DemoApi['reassignDispatcherTask']>(
    (taskId, newStaffId, reason) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        const newStaff = (prev.staffAccounts ?? []).find((s) => s.id === newStaffId || s.employeeId === newStaffId);
        if (!task || !newStaff) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Reassigned',
          note: `Reassigned to ${newStaff.name} (${newStaff.employeeId}) by Dispatcher.${reason ? ` Reason: ${reason}` : ''}`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Assigned',
          assignee: newStaff.name,
          assigneeId: newStaff.employeeId,
          assignedAt: timestamp,
          chip: `Reassigned: ${newStaff.name.split(' ')[0]}`,
          reassignPending: false,
          reassignReason: undefined,
          history: [...(task.history ?? []), historyEntry],
        };

        const nextFulfillerItems = (prev.items.task_fulfiller ?? []).map((f) => {
          if (f.id === task.id || (task.ref && f.ref === task.ref)) {
            return {
              ...f,
              assignee: newStaff.name,
              assigneeId: newStaff.employeeId,
              status: 'Assigned',
              reassignPending: false,
              history: [...(f.history ?? []), historyEntry],
            };
          }
          return f;
        });

        const notif: InAppNotification = {
          id: uid(),
          roleId: newStaff.roleId,
          title: 'Task Reassigned To You',
          message: `${task.title} reassigned to your queue.${reason ? ` Reason: ${reason}` : ''}`,
          timestamp,
          read: false,
          type: 'reassign',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
            task_fulfiller: nextFulfillerItems,
          },
          notifications: [notif, ...(prev.notifications ?? [])],
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `Reassigned ${task.ref || task.title} to ${newStaff.name}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'James Chen',
        actorRole: 'Department Dispatcher',
        action: 'Task reassigned to new employee',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `New Assignee: ${newStaffId}${reason ? ` · Justification: ${reason}` : ''}`,
      });
      notify(`Reassigned task to ${newStaffId}`);
    },
    [notify, recordAuditEvent],
  );

  const autoAssignAllPending = useCallback<DemoApi['autoAssignAllPending']>(() => {
    const unassigned = (stateRef.current.items.department_dispatcher ?? []).filter(
      (i) => i.status === 'Unassigned' || i.status === 'Received'
    );
    let assignedCount = 0;
    unassigned.forEach((task) => {
      const res = autoAssignTask(task.id);
      if (res.success) assignedCount++;
    });
    const unassignedCount = unassigned.length - assignedCount;
    notify(`Auto-dispatch complete: ${assignedCount} assigned, ${unassignedCount} remaining unassigned`);
    return { assignedCount, unassignedCount };
  }, [autoAssignTask, notify]);

  const linkDuplicateTask = useCallback<DemoApi['linkDuplicateTask']>(
    (taskId, parentRef) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        if (!task) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Duplicate Linked',
          note: `Linked as duplicate of primary task ${parentRef} by Dispatcher James Chen`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Duplicate Linked',
          isLinkedDuplicate: true,
          linkedToRef: parentRef,
          chip: `Duplicate of ${parentRef}`,
          tone: 'neutral',
          history: [...(task.history ?? []), historyEntry],
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
          },
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `Task ${task.ref || task.title} linked as duplicate of ${parentRef}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'James Chen',
        actorRole: 'Department Dispatcher',
        action: 'Task deduplicated and linked to primary reference',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'success',
        details: `Primary Reference: ${parentRef}`,
      });
      notify(`Task linked as duplicate of ${parentRef}`);
    },
    [notify, recordAuditEvent],
  );

  const escalateTaskToManager = useCallback<DemoApi['escalateTaskToManager']>(
    (taskId, reason) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const task = prev.items.department_dispatcher?.find((i) => i.id === taskId);
        if (!task) return prev;

        const historyEntry: GuestHistoryEntry = {
          at: timestamp,
          status: 'Escalated',
          note: `Escalated to Duty Manager Isabella Scott: ${reason}`,
        };

        const updatedTask: WorkItem = {
          ...task,
          status: 'Escalated',
          escalatedTo: 'Duty Manager Isabella Scott',
          escalatedAt: timestamp,
          escalationReason: reason,
          chip: 'Escalated to Duty Mgr',
          tone: 'danger',
          history: [...(task.history ?? []), historyEntry],
        };

        const managerItem: WorkItem = {
          id: uid(),
          title: `DISPATCH ESCALATION: ${task.title}`,
          meta: `${task.department || 'Operations'} · Room ${task.room || 'General'} · Escalated by Dispatcher`,
          status: 'Escalated',
          chip: 'Dispatcher Escalation',
          tone: 'danger',
          priority: 'critical',
          room: task.room,
          linkedRef: task.ref,
          description: `Operational SLA escalation. Justification: ${reason}`,
          createdAt: timestamp,
          history: [{ at: timestamp, status: 'Escalated', note: `Escalated by James Chen: ${reason}` }],
        };

        const managerNotif: InAppNotification = {
          id: uid(),
          roleId: 'department_manager',
          title: 'Urgent Dispatch Escalation',
          message: `${task.title} escalated by Dispatcher: ${reason}`,
          timestamp,
          read: false,
          type: 'alert',
          itemId: task.id,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            department_dispatcher: prev.items.department_dispatcher.map((i) => (i.id === taskId ? updatedTask : i)),
            department_manager: [managerItem, ...prev.items.department_manager],
          },
          notifications: [managerNotif, ...(prev.notifications ?? [])],
          feed: [
            { id: uid(), at: timestamp, role: 'Dispatcher', text: `ESCALATION: ${task.ref || task.title} escalated to Duty Manager (${reason})` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'James Chen',
        actorRole: 'Department Dispatcher',
        action: 'Task escalated to Duty Manager',
        category: 'Workflow',
        resource: `Task ${taskId}`,
        outcome: 'warning',
        details: `Justification: ${reason}`,
      });
      notify(`Escalated to Duty Manager Isabella Scott`);
    },
    [notify, recordAuditEvent],
  );

  const redistributeUnstartedTasks = useCallback<DemoApi['redistributeUnstartedTasks']>(
    (department) => {
      const currentState = stateRef.current;
      const fulfillers = (currentState.staffAccounts ?? []).filter(
        (s) => s.roleId === 'task_fulfiller' && s.status === 'active' && s.availability === 'on_duty' &&
          (!department || s.department.toLowerCase().includes(department.toLowerCase()))
      );

      if (fulfillers.length < 2) {
        notify('Workload rebalance requires at least 2 active on-duty staff members in the department');
        return { movedCount: 0, message: 'Insufficient on-duty staff to rebalance' };
      }

      const loadMap = new Map<string, number>();
      fulfillers.forEach((f) => {
        const count = (currentState.items.task_fulfiller ?? []).filter(
          (t) => t.assigneeId === f.employeeId && t.status !== 'Completed' && t.status !== 'Cancelled'
        ).length;
        loadMap.set(f.employeeId, count);
      });

      const overloaded = fulfillers.filter((f) => (loadMap.get(f.employeeId) ?? 0) >= 4);
      const underloaded = fulfillers.filter((f) => (loadMap.get(f.employeeId) ?? 0) < 3);

      if (overloaded.length === 0 || underloaded.length === 0) {
        notify('Workload is already balanced across available on-duty staff');
        return { movedCount: 0, message: 'Workload already balanced' };
      }

      let movedCount = 0;
      overloaded.forEach((heavyStaff) => {
        const unstartedTasks = (currentState.items.department_dispatcher ?? []).filter(
          (t) => t.assigneeId === heavyStaff.employeeId && t.status === 'Assigned'
        );
        if (unstartedTasks.length > 0 && underloaded.length > 0) {
          const taskToMove = unstartedTasks[0];
          const targetStaff = underloaded[0];
          reassignDispatcherTask(taskToMove.id, targetStaff.employeeId, 'Automated workload rebalancing');
          movedCount++;
        }
      });

      const msg = `Rebalanced ${movedCount} task${movedCount === 1 ? '' : 's'} across field attendants`;
      notify(msg);
      return { movedCount, message: msg };
    },
    [reassignDispatcherTask, notify],
  );

  const toggleRoutingRule = useCallback<DemoApi['toggleRoutingRule']>(
    (ruleId) => {
      setState((prev) => {
        const rules = prev.routingRules ?? seedRoutingRules;
        const target = rules.find((r) => r.id === ruleId);
        if (!target) return prev;
        const nextActive = !target.active;
        return {
          ...prev,
          routingRules: rules.map((r) => (r.id === ruleId ? { ...r, active: nextActive } : r)),
          feed: [
            { id: uid(), at: nowLabel(), role: 'Dispatcher', text: `Routing rule "${target.category}" set to ${nextActive ? 'Active' : 'Disabled'}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify(`Routing rule updated`);
    },
    [notify],
  );

  const updateStaffAvailability = useCallback<DemoApi['updateStaffAvailability']>(
    (staffId, availability) => {
      setState((prev) => {
        const staffList = prev.staffAccounts ?? [];
        const staff = staffList.find((s) => s.id === staffId || s.employeeId === staffId);
        if (!staff) return prev;

        const isVikram = staff.employeeId === 'EMP-0103';

        return {
          ...prev,
          staffAccounts: staffList.map((s) => (s.id === staff.id ? { ...s, availability } : s)),
          fulfillerAvailability: isVikram ? availability : prev.fulfillerAvailability,
          feed: [
            { id: uid(), at: nowLabel(), role: 'Dispatcher', text: `${staff.name} availability updated: ${availability.replace('_', ' ')}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify(`Status updated to ${availability.replace('_', ' ')}`);
    },
    [notify],
  );

  const placeRoomServiceOrder = useCallback<DemoApi['placeRoomServiceOrder']>(
    (room, lines, note) => {
      const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) / 100;
      const ref = nextRef('RS', room);
      const id = uid();
      const createdAt = nowLabel();
      const summary = lines.map((l) => `${l.qty}× ${l.name}`).join(', ');
      const newItem: WorkItem = {
        id,
        title: `Room service order ${ref}`,
        meta: `F&B · ${summary} · Room ${room}`,
        status: 'Received',
        chip: 'Just now',
        tone: 'info',
        room,
        guest: true,
        category: 'room_service',
        description: note,
        ref,
        createdAt,
        orderLines: lines,
        amount: total,
        history: [{ at: createdAt, status: 'Received' }],
      };

      setState((prev) => ({
        ...prev,
        items: { ...prev.items, department_dispatcher: [newItem, ...prev.items.department_dispatcher] },
        folios: {
          ...prev.folios,
          [room]: [...(prev.folios[room] ?? []), { id: `fo-${id}`, label: `Room service · ${summary}`, amount: total, date: createdAt }],
        },
        feed: [
          { id: uid(), at: createdAt, role: 'Guest Portal', text: `${ref} placed · ${summary} · Room ${room}` },
          ...prev.feed,
        ].slice(0, 30),
      }));

      notify(`Order placed · Reference ${ref}`);
      scheduleLifecycle('department_dispatcher', id, ref, `Order ${ref}`, ORDER_LIFECYCLE);
      return ref;
    },
    [notify, scheduleLifecycle],
  );

  const cancelGuestItem = useCallback<DemoApi['cancelGuestItem']>(
    (roleId, itemId) => {
      patchGuestItem(roleId, itemId, { status: 'Cancelled', chip: 'Cancelled by guest', tone: 'neutral' });
      notify('Request cancelled');
    },
    [notify, patchGuestItem],
  );

  const submitGuestFeedback = useCallback<DemoApi['submitGuestFeedback']>(
    (roleId, itemId, rating, comment) => {
      patchGuestItem(roleId, itemId, { feedback: { rating, comment } });
      notify('Thanks for your feedback');
    },
    [notify, patchGuestItem],
  );

  const disputeFolioCharge = useCallback<DemoApi['disputeFolioCharge']>(
    (room, lineId, reason) => {
      setState((prev) => {
        const line = (prev.folios[room] ?? []).find((l) => l.id === lineId);
        if (!line) return prev;
        const ref = nextRef('FD', room);
        const disputeItem: WorkItem = {
          id: uid(),
          title: `Folio dispute · ${line.label}`,
          meta: `Requested by guest · Room ${room} · Card •••• 4242`,
          status: 'Pending approval',
          chip: 'Awaiting review',
          tone: 'warning',
          amount: line.amount,
          room,
          guest: true,
          category: 'folio',
          description: reason,
          ref,
          createdAt: nowLabel(),
          history: [{ at: nowLabel(), status: 'Pending approval', note: reason }],
        };
        return {
          ...prev,
          folios: {
            ...prev.folios,
            [room]: prev.folios[room].map((l) => (l.id === lineId ? { ...l, disputed: true, disputeReason: reason } : l)),
          },
          items: { ...prev.items, financial_operator: [disputeItem, ...prev.items.financial_operator] },
          feed: [
            { id: uid(), at: nowLabel(), role: 'Guest Portal', text: `Dispute opened · ${line.label} · Room ${room}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify('Dispute sent to Front Desk & Finance');
    },
    [notify],
  );

  const claimLostItem = useCallback<DemoApi['claimLostItem']>(
    (room, itemId) => {
      setState((prev) => {
        const found = prev.lostFound.find((l) => l.id === itemId);
        if (!found || found.sensitive || found.claimed) return prev;
        const caseItem: WorkItem = {
          id: uid(),
          title: `Lost & found claim · ${found.name}`,
          meta: `Found ${found.foundLocation} · ${found.foundDate} · Owner: Front Desk`,
          status: 'Open',
          chip: 'Claim submitted',
          tone: 'warning',
          room,
          guest: true,
          category: 'lost_found',
          ref: nextRef('LF', room),
          createdAt: nowLabel(),
          history: [{ at: nowLabel(), status: 'Open' }],
        };
        return {
          ...prev,
          lostFound: prev.lostFound.map((l) => (l.id === itemId ? { ...l, claimed: true, claimedRoom: room } : l)),
          items: { ...prev.items, front_desk_coordinator: [caseItem, ...prev.items.front_desk_coordinator] },
          feed: [
            { id: uid(), at: nowLabel(), role: 'Guest Portal', text: `Lost & found claim · ${found.name} · Room ${room}` },
            ...prev.feed,
          ].slice(0, 30),
        };
      });
      notify('Claim sent to Front Desk for verification');
    },
    [notify],
  );

  const addLostFoundItem = useCallback<DemoApi['addLostFoundItem']>(
    (item) => {
      const entry: LostFoundItem = {
        ...item,
        id: `lf-${uid()}`,
        // sensitive items never carry a guest-visible photo
        photo: item.sensitive ? undefined : item.photo,
        loggedBy: 'Front Desk',
      };
      setState((prev) => ({
        ...prev,
        lostFound: [entry, ...prev.lostFound],
        feed: [
          {
            id: uid(),
            at: nowLabel(),
            role: 'Front Desk',
            text: item.sensitive
              ? `Restricted item logged · ${item.name} · hidden from guests`
              : `Found item logged · ${item.name} · now visible in Guest Lost & Found`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));
      notify(item.sensitive ? 'Logged as restricted · guests are told to ask Front Desk' : 'Item published to Guest Lost & Found');
    },
    [notify],
  );

  const expressCheckout = useCallback<DemoApi['expressCheckout']>(
    (room, guestName) => {
      const turnoverItem: WorkItem = {
        id: uid(),
        title: `Checkout turnover · Room ${room}`,
        meta: `Housekeeping · Floor ${room[0]} · Checkout turnover`,
        status: 'Assigned',
        chip: 'Due in 30m',
        tone: 'warning',
        room,
      };
      setState((prev) => ({
        ...prev,
        revokedRooms: prev.revokedRooms.includes(room) ? prev.revokedRooms : [...prev.revokedRooms, room],
        frontDesk: markCheckedOut(prev.frontDesk, room),
        items: { ...prev.items, task_fulfiller: [turnoverItem, ...prev.items.task_fulfiller] },
        feed: [
          { id: uid(), at: nowLabel(), role: 'Front Desk', text: `Express checkout · ${guestName} · Room ${room} · QR session revoked` },
          ...prev.feed,
        ].slice(0, 30),
      }));
      notify(`Checked out · Room ${room} session revoked`);
    },
    [notify],
  );

  const fdAction: DemoApi['fdAction'] = (command,args) => {const fn=(fdReducers as Record<string,any>)[command]||(roomReducers as Record<string,any>)[command]||(bookingReducers as Record<string,any>)[command];if(typeof fn!=='function')throw Error('Unknown front desk command.');const result=fn(stateRef.current,...args);if('error' in result){notify(result.error);return result.error;}setState(result.next);notify(result.message);return null;};
  const toggleStaffStatus = useCallback<DemoApi['toggleStaffStatus']>(
    (id) => {
      const staff = stateRef.current.staffAccounts?.find((s) => s.id === id);
      if (!staff) return;
      const nextStatus = staff.status === 'active' ? 'inactive' : 'active';
      setState((prev) => ({
        ...prev,
        staffAccounts: (prev.staffAccounts ?? []).map((s) => (s.id === id ? { ...s, status: nextStatus } : s)),
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Staff account status changed to ${nextStatus}`,
        category: 'Access',
        resource: `${staff.employeeId} · ${staff.name}`,
        outcome: 'success',
        details: `Role: ${roleById[staff.roleId]?.name} · Department: ${staff.department}`,
      });
      notify(`${staff.name} is now ${nextStatus}`);
    },
    [notify, recordAuditEvent],
  );

  const updateStaffRole = useCallback<DemoApi['updateStaffRole']>(
    (id, roleId, department, floorZone, shift) => {
      const staff = stateRef.current.staffAccounts?.find((s) => s.id === id);
      if (!staff) return;
      setState((prev) => ({
        ...prev,
        staffAccounts: (prev.staffAccounts ?? []).map((s) =>
          s.id === id ? { ...s, roleId, department, floorZone, shift } : s,
        ),
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Staff role & scopes updated`,
        category: 'Access',
        resource: `${staff.employeeId} · ${staff.name}`,
        outcome: 'success',
        details: `New Role: ${roleById[roleId]?.name} · Dept: ${department} · Scope: ${floorZone} · Shift: ${shift}`,
      });
      notify(`Permissions updated for ${staff.name}`);
    },
    [notify, recordAuditEvent],
  );

  const addStaffAccount = useCallback<DemoApi['addStaffAccount']>(
    (account) => {
      const newStaff: StaffAccount = {
        ...account,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
        lastActive: 'Just added',
      };
      setState((prev) => ({
        ...prev,
        staffAccounts: [newStaff, ...(prev.staffAccounts ?? [])],
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `New staff account provisioned`,
        category: 'Access',
        resource: `${newStaff.employeeId} · ${newStaff.name}`,
        outcome: 'success',
        details: `Role: ${roleById[newStaff.roleId]?.name} · Department: ${newStaff.department}`,
      });
      notify(`Added employee account for ${newStaff.name}`);
    },
    [notify, recordAuditEvent],
  );

  const updateWorkflowConfig = useCallback<DemoApi['updateWorkflowConfig']>(
    (partial) => {
      setState((prev) => ({
        ...prev,
        workflowConfig: { ...prev.workflowConfig, ...partial },
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Workflow & SLA configuration modified`,
        category: 'Workflow',
        resource: 'Property SLA Engine',
        outcome: 'success',
        details: `Parameters updated: ${Object.keys(partial).join(', ')}`,
      });
      notify('Workflow configuration saved');
    },
    [notify, recordAuditEvent],
  );

  const revokeRoomSession = useCallback<DemoApi['revokeRoomSession']>(
    (room) => {
      setState((prev) => ({
        ...prev,
        revokedRooms: prev.revokedRooms.includes(room) ? prev.revokedRooms : [...prev.revokedRooms, room],
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Emergency QR session revoked`,
        category: 'Security',
        resource: `Room ${room} QR token`,
        outcome: 'warning',
        details: 'Instant access token invalidation applied',
      });
      notify(`Room ${room} guest QR session revoked`);
    },
    [notify, recordAuditEvent],
  );

  const restoreRoomSession = useCallback<DemoApi['restoreRoomSession']>(
    (room) => {
      setState((prev) => ({
        ...prev,
        revokedRooms: prev.revokedRooms.filter((r) => r !== room),
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `QR session re-authorized`,
        category: 'Access',
        resource: `Room ${room} QR token`,
        outcome: 'success',
        details: 'Session token digest restored to active status',
      });
      notify(`Room ${room} session restored`);
    },
    [notify, recordAuditEvent],
  );

  const setIntegrationState = useCallback<DemoApi['setIntegrationState']>(
    (id, next) => {
      const name = integrationList.find((i) => i.id === id)?.name ?? id.toUpperCase();
      setState((prev) => ({
        ...prev,
        integrations: { ...prev.integrations, [id]: next },
        feed: [{ id: uid(), at: nowLabel(), role: 'Admin', text: `${name} state set to ${next}` }, ...prev.feed].slice(0, 30),
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Integration state transitioned to ${next}`,
        category: 'Integration',
        resource: `${name} Connector`,
        outcome: next === 'down' ? 'warning' : 'success',
        details: next === 'down' ? 'Fallback simulation activated' : 'Connector operational',
      });
      notify(`${name} is now ${next}`);
    },
    [notify, recordAuditEvent],
  );

  const testConnector = useCallback<DemoApi['testConnector']>(
    (id) => {
      const name = integrationList.find((i) => i.id === id)?.name ?? id.toUpperCase();
      const currentState = stateRef.current.integrations[id] ?? 'healthy';
      const latency = currentState === 'healthy' ? Math.floor(25 + Math.random() * 30) : Math.floor(180 + Math.random() * 120);
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Diagnostic ping executed: ${currentState === 'down' ? 'FAILED' : 'SUCCESS'}`,
        category: 'Integration',
        resource: `${name} Endpoint`,
        outcome: currentState === 'down' ? 'denied' : 'success',
        details: currentState === 'down' ? 'Connection refused (simulated outage)' : `Roundtrip latency: ${latency}ms`,
      });
      notify(currentState === 'down' ? `Ping failed: ${name} is DOWN` : `Ping OK: ${name} responded in ${latency}ms`);
    },
    [notify, recordAuditEvent],
  );

  const simulateTestTask = useCallback<DemoApi['simulateTestTask']>(
    (department, priority = 'normal') => {
      const testId = uid();
      const testRef = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdAt = nowLabel();
      const testItem: WorkItem = {
        id: testId,
        title: `Workflow test: ${department} dispatch`,
        meta: `${department} · Triggered by Platform Admin · Ref ${testRef}`,
        status: 'Unassigned',
        chip: 'Admin test event',
        tone: 'accent',
        priority,
        createdAt,
        description: 'Simulated request to verify dual SLA timer countdown and auto-routing rules.',
        history: [{ at: createdAt, status: 'Unassigned', note: 'Injected by Platform Admin test' }],
      };
      setState((prev) => ({
        ...prev,
        items: { ...prev.items, department_dispatcher: [testItem, ...prev.items.department_dispatcher] },
        feed: [{ id: uid(), at: createdAt, role: 'Admin', text: `Test request dispatched to ${department} queue (${testRef})` }, ...prev.feed].slice(0, 30),
      }));
      recordAuditEvent({
        actor: 'Amelia Brooks',
        actorRole: 'Platform Administrator',
        action: `Simulated workflow test request dispatched`,
        category: 'Workflow',
        resource: `${department} Dispatcher Queue`,
        outcome: 'success',
        details: `Reference: ${testRef} · Priority: ${priority}`,
      });
      notify(`Test task injected into ${department} queue (${testRef})`);
    },
    [notify, recordAuditEvent],
  );

  const updateStaffCapacity = useCallback<DemoApi['updateStaffCapacity']>(
    (staffId, maxWorkload) => {
      const validLoad = Math.max(1, Math.min(20, Math.round(maxWorkload)));
      const staff = stateRef.current.staffAccounts?.find((s) => s.id === staffId || s.employeeId === staffId);
      if (!staff) return;

      setState((prev) => ({
        ...prev,
        staffAccounts: (prev.staffAccounts ?? []).map((s) =>
          s.id === staff.id ? { ...s, maxWorkload: validLoad } : s,
        ),
      }));

      recordAuditEvent({
        actor: 'James Chen',
        actorRole: 'Department Dispatcher',
        action: 'Employee task capacity configured',
        category: 'Workflow',
        resource: `${staff.employeeId} · ${staff.name}`,
        outcome: 'success',
        details: `Max concurrent active tasks updated: ${validLoad} (prev: ${staff.maxWorkload || 5})`,
      });

      notify(`Updated max task capacity for ${staff.name} to ${validLoad}`);
    },
    [notify, recordAuditEvent],
  );

  const reviewResourceRequest = useCallback<DemoApi['reviewResourceRequest']>(
    (requestId, action, reviewNotes) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const req = (prev.resourceRequests ?? []).find((r) => r.id === requestId);
        if (!req) return prev;

        const updatedRequests = (prev.resourceRequests ?? []).map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: action === 'approve' ? ('approved' as const) : ('rejected' as const),
                reviewedBy: 'Isabella Scott (Duty Manager)',
                reviewedAt: timestamp,
                reviewNotes: reviewNotes || (action === 'approve' ? 'Approved by Duty Operations' : 'Declined by Duty Operations'),
              }
            : r,
        );

        return {
          ...prev,
          resourceRequests: updatedRequests,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Resource request "${req.title}" was ${action === 'approve' ? 'approved' : 'rejected'}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Isabella Scott',
        actorRole: 'Duty Manager',
        action: `Resource request ${action === 'approve' ? 'approved' : 'rejected'}`,
        category: 'Hotel',
        resource: `Request ${requestId}`,
        outcome: 'success',
        details: reviewNotes || `Decision: ${action}`,
      });

      notify(`Resource request ${action === 'approve' ? 'approved' : 'rejected'}`);
    },
    [notify, recordAuditEvent],
  );

  const createResourceRequest = useCallback<DemoApi['createResourceRequest']>(
    (request) => {
      const timestamp = nowLabel();
      const newReq: ResourceRequest = {
        ...request,
        id: `res-${Date.now()}`,
        requestedAt: `Today ${timestamp}`,
        status: 'pending',
      };

      setState((prev) => ({
        ...prev,
        resourceRequests: [newReq, ...(prev.resourceRequests ?? [])],
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Operations',
            text: `New ${request.category} request logged: ${request.title}`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: request.requestedBy || 'Department Manager',
        actorRole: 'Operations',
        action: 'Resource request submitted',
        category: 'Hotel',
        resource: newReq.id,
        outcome: 'success',
        details: `Category: ${request.category} · Urgency: ${request.urgency}`,
      });

      notify(`Resource request submitted for ${request.department}`);
    },
    [notify, recordAuditEvent],
  );

  const submitShiftHandover = useCallback<DemoApi['submitShiftHandover']>(
    (handover) => {
      const timestamp = nowLabel();
      const newHandover: ShiftHandover = {
        ...handover,
        id: `sho-${Date.now()}`,
        timestamp: `Today ${timestamp}`,
        status: 'submitted',
      };

      setState((prev) => ({
        ...prev,
        shiftHandovers: [newHandover, ...(prev.shiftHandovers ?? [])],
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Duty Manager',
            text: `Shift handover submitted by ${handover.outgoingManager} (${handover.shift} Shift)`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: handover.outgoingManager,
        actorRole: 'Duty Manager',
        action: 'Shift handover briefing submitted',
        category: 'Workflow',
        resource: newHandover.id,
        outcome: 'success',
        details: `${handover.shift} Shift · Outstanding Tasks: ${handover.outstandingTasksCount} · Unresolved: ${handover.unresolvedComplaintsCount}`,
      });

      notify(`Shift handover recorded for ${handover.incomingManager}`);
    },
    [notify, recordAuditEvent],
  );

  const acknowledgeShiftHandover = useCallback<DemoApi['acknowledgeShiftHandover']>(
    (handoverId) => {
      setState((prev) => ({
        ...prev,
        shiftHandovers: (prev.shiftHandovers ?? []).map((h) =>
          h.id === handoverId ? { ...h, status: 'acknowledged' as const } : h,
        ),
      }));

      recordAuditEvent({
        actor: 'Isabella Scott',
        actorRole: 'Duty Manager',
        action: 'Shift handover briefing acknowledged',
        category: 'Workflow',
        resource: handoverId,
        outcome: 'success',
        details: 'Incoming manager confirmed handover notes and priority actions',
      });

      notify('Shift handover acknowledged and closed');
    },
    [notify, recordAuditEvent],
  );

  const resolveComplaintCase = useCallback<DemoApi['resolveComplaintCase']>(
    (complaintId, resolutionNotes, approvedComp) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const c = prev.frontDesk.complaints.find((x) => x.id === complaintId);
        if (!c) return prev;

        const compAmount = approvedComp !== undefined ? approvedComp : c.comp;
        const maxDutyLimit = prev.workflowConfig?.dutyManagerCompLimit || 16000;
        const withinLimit = compAmount <= maxDutyLimit;

        // Update frontDesk complaint
        const updatedComplaints = prev.frontDesk.complaints.map((item) =>
          item.id === c.id
            ? {
                ...item,
                comp: compAmount,
                compApplied: withinLimit && compAmount > 0 ? true : item.compApplied,
                managerNotes: resolutionNotes,
              }
            : item,
        );

        // Update manager alert item in items.department_manager
        const updatedMgrItems = prev.items.department_manager.map((item) => {
          if (item.id === c.managerItemId || item.room === c.room) {
            return {
              ...item,
              status: 'Resolved' as const,
              chip: 'Resolved by Duty Mgr',
              tone: 'success' as const,
              history: [
                ...(item.history ?? []),
                {
                  at: timestamp,
                  status: 'Resolved',
                  note: `Resolved by Isabella Scott: ${resolutionNotes}${compAmount > 0 ? ` · ₹${compAmount.toLocaleString('en-IN')} credit authorized` : ''}`,
                },
              ],
            };
          }
          return item;
        });

        // Add folio credit if applicable
        const updatedFolios =
          withinLimit && compAmount > 0
            ? {
                ...prev.folios,
                [c.room]: [
                  ...(prev.folios[c.room] ?? []),
                  {
                    id: uid(),
                    date: timestamp,
                    label: `Service recovery credit (Approved by Duty Manager)`,
                    amount: -compAmount,
                    room: c.room,
                  },
                ],
              }
            : prev.folios;

        return {
          ...prev,
          folios: updatedFolios,
          items: {
            ...prev.items,
            department_manager: updatedMgrItems,
          },
          frontDesk: {
            ...prev.frontDesk,
            complaints: updatedComplaints,
          },
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Complaint ${c.ref} (Room ${c.room}) resolved · ${resolutionNotes}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Isabella Scott',
        actorRole: 'Duty Manager',
        action: 'Guest complaint case resolved',
        category: 'Hotel',
        resource: `Complaint ${complaintId}`,
        outcome: 'success',
        details: `Notes: ${resolutionNotes} · Comp: ₹${approvedComp ?? 0}`,
      });

      notify(`Complaint case resolved and documented`);
    },
    [notify, recordAuditEvent],
  );

  const addManagerNote = useCallback<DemoApi['addManagerNote']>(
    (taskId, noteText) => {
      const timestamp = nowLabel();
      setState((prev) => {
        let found = false;
        const nextItems = { ...prev.items };

        (Object.keys(nextItems) as RoleId[]).forEach((r) => {
          nextItems[r] = nextItems[r].map((item) => {
            if (item.id === taskId || item.ref === taskId) {
              found = true;
              return {
                ...item,
                notes: item.notes ? `${item.notes}\n[${timestamp} Isabella Scott]: ${noteText}` : `[${timestamp} Isabella Scott]: ${noteText}`,
                history: [
                  ...(item.history ?? []),
                  {
                    at: timestamp,
                    status: item.status,
                    note: `Managerial note: ${noteText}`,
                  },
                ],
              };
            }
            return item;
          });
        });

        if (!found) return prev;

        return {
          ...prev,
          items: nextItems,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Managerial note appended to task ${taskId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      notify('Manager note saved to task record');
    },
    [notify],
  );

  const updateIncidentStatus = useCallback<DemoApi['updateIncidentStatus']>(
    (incidentId, status, noteText) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const inc = (prev.incidents ?? []).find((i) => i.id === incidentId || i.ref === incidentId);
        if (!inc) return prev;

        const timelineEntry = {
          at: timestamp,
          text: noteText || `Status transitioned to ${status} by Isabella Scott`,
        };

        const updatedIncidents = (prev.incidents ?? []).map((i) =>
          i.id === inc.id
            ? {
                ...i,
                status,
                timeline: [...i.timeline, timelineEntry],
              }
            : i,
        );

        return {
          ...prev,
          incidents: updatedIncidents,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Duty Manager',
              text: `Incident ${inc.ref} marked ${status}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Isabella Scott',
        actorRole: 'Duty Manager',
        action: `Incident operational status updated`,
        category: 'Security',
        resource: incidentId,
        outcome: 'success',
        details: `New status: ${status}${noteText ? ` · ${noteText}` : ''}`,
      });

      notify(`Incident updated to ${status}`);
    },
    [notify, recordAuditEvent],
  );

  const reviewExecutiveItem = useCallback<DemoApi['reviewExecutiveItem']>(
    (itemId, action, reason, comments) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const list = prev.items.executive_viewer ?? [];
        const item = list.find((i) => i.id === itemId);
        if (!item) return prev;

        const nextStatus =
          action === 'approve'
            ? 'Approved'
            : action === 'reject'
            ? 'Rejected'
            : 'Info Requested';

        const nextChip =
          action === 'approve'
            ? 'GM Approved'
            : action === 'reject'
            ? 'Declined by GM'
            : 'Pending Clarification';

        const nextTone =
          action === 'approve'
            ? ('success' as const)
            : action === 'reject'
            ? ('danger' as const)
            : ('info' as const);

        const historyEntry = {
          at: timestamp,
          status: nextStatus,
          note:
            reason ||
            comments ||
            (action === 'approve'
              ? 'Authorized by Executive General Manager Alex Morgan'
              : action === 'reject'
              ? 'Declined by Executive General Manager'
              : 'Clarification requested on budget impact'),
        };

        const updatedList = list.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: nextStatus,
                chip: nextChip,
                tone: nextTone,
                history: [...(i.history ?? []), historyEntry],
              }
            : i,
        );

        // Cross-role updates:
        let updatedComplaints = prev.frontDesk.complaints;
        let updatedFolios = prev.folios;
        if (action === 'approve' && item.room) {
          updatedComplaints = (prev.frontDesk.complaints ?? []).map((c) =>
            c.room === item.room ? { ...c, compApplied: true } : c,
          );
          if (item.amount && item.amount > 0) {
            const currentFolio = prev.folios[item.room] ?? [];
            const folioLine = {
              id: uid(),
              label: `Executive Goodwill Adjustment · Approved by GM`,
              amount: -item.amount,
              date: timestamp,
            };
            updatedFolios = {
              ...prev.folios,
              [item.room]: [folioLine, ...currentFolio],
            };
          }
        }

        const updatedResourceRequests = (prev.resourceRequests ?? []).map((r) => {
          if (
            (item.id === 'exe-3' && r.id === 'res-2') ||
            (item.id === 'exe-5' && r.id === 'res-3') ||
            r.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 15))
          ) {
            return {
              ...r,
              status: action === 'approve' ? ('approved' as const) : action === 'reject' ? ('rejected' as const) : r.status,
              reviewedBy: 'Alex Morgan (General Manager)',
              reviewedAt: timestamp,
              reviewNotes: reason || comments || `Executive decision: ${action}`,
            };
          }
          return r;
        });

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Executive Decision: ${item.title.split('·')[0].trim()}`,
          message: `Alex Morgan (GM) has marked "${item.title}" as ${nextStatus}.${reason ? ` Reason: ${reason}` : ''}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            executive_viewer: updatedList,
          },
          frontDesk: {
            ...prev.frontDesk,
            complaints: updatedComplaints,
          },
          folios: updatedFolios,
          resourceRequests: updatedResourceRequests,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Executive Office',
              text: `Alex Morgan marked "${item.title}" as ${nextStatus}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Alex Morgan',
        actorRole: 'Executive Director / GM',
        action: `Executive Approval: ${action.toUpperCase()}`,
        category: 'Workflow',
        resource: `Executive Item ${itemId}`,
        outcome: action === 'reject' ? 'denied' : 'success',
        details: reason ? `Reason: ${reason}` : comments || `Status transitioned to ${action} by Alex Morgan`,
      });

      notify(`Executive decision recorded: ${action.replace('_', ' ')}`);
    },
    [notify, recordAuditEvent],
  );

  const addExecutiveComment = useCallback<DemoApi['addExecutiveComment']>(
    (itemId, comment) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const list = prev.items.executive_viewer ?? [];
        const item = list.find((i) => i.id === itemId);
        if (!item) return prev;

        const updatedList = list.map((i) =>
          i.id === itemId
            ? {
                ...i,
                history: [
                  ...(i.history ?? []),
                  { at: timestamp, status: 'Executive Note', note: `[Alex Morgan - GM] ${comment}` },
                ],
              }
            : i,
        );

        return {
          ...prev,
          items: {
            ...prev.items,
            executive_viewer: updatedList,
          },
        };
      });

      recordAuditEvent({
        actor: 'Alex Morgan',
        actorRole: 'Executive Director / GM',
        action: 'Executive Comment Added',
        category: 'Workflow',
        resource: `Executive Item ${itemId}`,
        outcome: 'success',
        details: comment,
      });

      notify('Executive note appended to case history');
    },
    [notify, recordAuditEvent],
  );

  const requestExecutiveDirective = useCallback<DemoApi['requestExecutiveDirective']>(
    (targetId, type, directiveText) => {
      const timestamp = nowLabel();
      setState((prev) => {
        let updatedIncidents = prev.incidents ?? [];
        if (type === 'incident') {
          updatedIncidents = updatedIncidents.map((i) =>
            i.id === targetId || i.ref === targetId
              ? {
                  ...i,
                  timeline: [
                    ...i.timeline,
                    { at: timestamp, text: `[Executive Directive - Alex Morgan] ${directiveText}` },
                  ],
                }
              : i,
          );
        }

        const newNotification: InAppNotification = {
          id: uid(),
          title: 'Executive Directive Issued',
          message: `GM Alex Morgan dispatched directive on ${targetId}: "${directiveText}"`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
        };

        return {
          ...prev,
          incidents: updatedIncidents,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Executive Office',
              text: `Directive dispatched on ${targetId}: ${directiveText}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Alex Morgan',
        actorRole: 'Executive Director / GM',
        action: 'Executive Operational Directive Issued',
        category: type === 'incident' ? 'Security' : 'Workflow',
        resource: targetId,
        outcome: 'success',
        details: directiveText,
      });

      notify('Executive directive dispatched to operational teams');
    },
    [notify, recordAuditEvent],
  );

  const acknowledgeSecurityItem = useCallback<DemoApi['acknowledgeSecurityItem']>(
    (itemId) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Acknowledged',
              chip: 'Responding',
              tone: 'warning' as Tone,
              acknowledgedAt: timestamp,
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: 'Acknowledged', note: 'Lucas Martin acknowledged alert · en route' },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              status: 'investigating' as const,
              timeline: [
                ...inc.timeline,
                { at: timestamp, text: 'Security Responder Lucas Martin acknowledged incident & en route' },
              ],
            };
          }
          return inc;
        });

        const updatedNotifs = (prev.notifications ?? []).map((n) =>
          n.itemId === itemId || (n.roleId === 'security_responder' && n.title.includes(itemId))
            ? { ...n, read: true }
            : n,
        );

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: updatedNotifs,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Lucas Martin acknowledged alert: ${updatedTitle || itemId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security Incident Acknowledged',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: 'Officer acknowledged incident alert and marked en route',
      });

      notify('Alert acknowledged: en route to incident location');
    },
    [notify, recordAuditEvent],
  );

  const arriveSecurityItem = useCallback<DemoApi['arriveSecurityItem']>(
    (itemId) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'On scene',
              chip: 'On Scene',
              tone: 'warning' as Tone,
              arrivedAt: timestamp,
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: 'On scene', note: 'Lucas Martin arrived on scene and secured perimeter' },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              timeline: [
                ...inc.timeline,
                { at: timestamp, text: 'Lucas Martin arrived on scene. Establishing containment.' },
              ],
            };
          }
          return inc;
        });

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Lucas Martin arrived on scene: ${updatedTitle || itemId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security On Scene',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: 'Officer confirmed arrival on scene',
      });

      notify('Marked on scene. Incident area under security assessment.');
    },
    [notify, recordAuditEvent],
  );

  const resolveSecurityItem = useCallback<DemoApi['resolveSecurityItem']>(
    (itemId, report) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Resolved',
              chip: 'Secured',
              tone: 'success' as Tone,
              resolvedAt: timestamp,
              photoUrl: report.photoUrl || item.photoUrl,
              securityReport: {
                ...report,
                filedAt: timestamp,
                officer: 'Lucas Martin (EMP-0108)',
              },
              history: [
                ...(item.history ?? []),
                {
                  at: timestamp,
                  status: 'Resolved',
                  note: `Formal Security Incident Report filed. Outcome: ${report.outcome}`,
                },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              status: 'resolved' as const,
              timeline: [
                ...inc.timeline,
                {
                  at: timestamp,
                  text: `Incident resolved by Lucas Martin. Report: ${report.summary}. Outcome: ${report.outcome}`,
                },
              ],
            };
          }
          return inc;
        });

        const dutyMgrNotification: InAppNotification = {
          id: uid(),
          title: `Security Resolved: ${updatedTitle.split('·')[0].trim() || itemId}`,
          message: `Lucas Martin resolved incident with formal report. Outcome: ${report.outcome}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: [dutyMgrNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Incident resolved and report submitted: ${updatedTitle || itemId}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security Incident Resolved & Report Filed',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: `Report summary: ${report.summary}. Actions: ${report.actionsTaken}. Outcome: ${report.outcome}`,
      });

      notify('Security incident report logged and case resolved successfully');
    },
    [notify, recordAuditEvent],
  );

  const requestSecurityBackup = useCallback<DemoApi['requestSecurityBackup']>(
    (itemId, reason) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Backup requested',
              chip: 'Backup Requested',
              tone: 'danger' as Tone,
              backupReason: reason,
              backupRequestedAt: timestamp,
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: 'Backup requested', note: `Backup assistance requested: ${reason}` },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              timeline: [
                ...inc.timeline,
                { at: timestamp, text: `Officer requested immediate backup: ${reason}` },
              ],
            };
          }
          return inc;
        });

        const backupNotification: InAppNotification = {
          id: uid(),
          title: `URGENT: Security Backup Requested`,
          message: `Lucas Martin requested immediate backup for ${updatedTitle || itemId}. Reason: ${reason}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: [backupNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `BACKUP REQUESTED by Lucas Martin: ${reason}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security Backup Requested',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: reason,
      });

      notify('Immediate backup requested. Dispatcher & Duty Manager notified.');
    },
    [notify, recordAuditEvent],
  );

  const escalateSecurityItem = useCallback<DemoApi['escalateSecurityItem']>(
    (itemId, reason, notes) => {
      const timestamp = nowLabel();
      let updatedTitle = '';
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            updatedTitle = item.title;
            return {
              ...item,
              status: 'Escalated',
              chip: 'Escalated to Duty Mgr',
              tone: 'danger' as Tone,
              escalatedTo: 'Duty Manager Isabella Scott',
              escalatedAt: timestamp,
              escalationReason: reason,
              history: [
                ...(item.history ?? []),
                {
                  at: timestamp,
                  status: 'Escalated',
                  note: `Escalated to Duty Manager Isabella Scott. Reason: ${reason}${notes ? ` (${notes})` : ''}`,
                },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              status: 'investigating' as const,
              timeline: [
                ...inc.timeline,
                {
                  at: timestamp,
                  text: `Escalated to Duty Manager Isabella Scott: ${reason}. Notes: ${notes || 'None'}`,
                },
              ],
            };
          }
          return inc;
        });

        const dutyMgrNotification: InAppNotification = {
          id: uid(),
          title: `Security Escalation: ${updatedTitle.split('·')[0].trim() || itemId}`,
          message: `Lucas Martin escalated incident to Isabella Scott (Duty Manager). Reason: ${reason}`,
          timestamp,
          roleId: 'department_manager',
          read: false,
          type: 'alert',
          itemId,
        };

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
          notifications: [dutyMgrNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Security Responder',
              text: `Incident escalated to Duty Manager Isabella Scott: ${reason}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security Escalation to Duty Manager',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: `Reason: ${reason}. Notes: ${notes || 'N/A'}`,
      });

      notify('Incident escalated to Duty Manager Isabella Scott');
    },
    [notify, recordAuditEvent],
  );

  const addSecurityNote = useCallback<DemoApi['addSecurityNote']>(
    (itemId, text) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const securityItems = (prev.items.security_responder ?? []).map((item) => {
          if (item.id === itemId || item.ref === itemId) {
            const newNote = { at: timestamp, author: 'Lucas Martin', text };
            return {
              ...item,
              securityNotes: [...(item.securityNotes ?? []), newNote],
              history: [
                ...(item.history ?? []),
                { at: timestamp, status: item.status, note: `Officer note: ${text}` },
              ],
            };
          }
          return item;
        });

        const updatedIncidents = (prev.incidents ?? []).map((inc) => {
          if (inc.relatedTaskRef === itemId || inc.id === itemId || inc.ref === itemId) {
            return {
              ...inc,
              timeline: [...inc.timeline, { at: timestamp, text: `[Security Note - Lucas Martin] ${text}` }],
            };
          }
          return inc;
        });

        return {
          ...prev,
          items: {
            ...prev.items,
            security_responder: securityItems,
          },
          incidents: updatedIncidents,
        };
      });

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security Note Logged',
        category: 'Security',
        resource: itemId,
        outcome: 'success',
        details: text,
      });

      notify('Field note recorded in secure audit log');
    },
    [notify, recordAuditEvent],
  );

  const createSecurityIncident = useCallback<DemoApi['createSecurityIncident']>(
    (incident) => {
      const timestamp = nowLabel();
      const id = `sec-${Date.now().toString().slice(-4)}`;
      const ref = `SEC-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const toneMap: Record<string, Tone> = {
        critical: 'danger',
        major: 'danger',
        moderate: 'warning',
        minor: 'info',
      };
      const priorityMap: Record<string, WorkItem['priority']> = {
        critical: 'critical',
        major: 'urgent',
        moderate: 'normal',
        minor: 'normal',
      };

      const newItem: WorkItem = {
        id,
        ref,
        title: incident.title,
        meta: `${incident.location} · Logged by Lucas Martin`,
        status: 'New',
        chip: incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1),
        tone: toneMap[incident.severity] ?? 'info',
        priority: priorityMap[incident.severity] ?? 'normal',
        category: 'safety',
        location: incident.location,
        floor: incident.floor,
        room: incident.room,
        createdAt: timestamp,
        description: incident.description,
        history: [
          { at: timestamp, status: 'Logged', note: `Incident logged directly by Lucas Martin on patrol` },
        ],
      };

      const newIncidentRecord: IncidentRecord = {
        id,
        ref,
        title: incident.title,
        severity: incident.severity,
        affectedArea: incident.location,
        department: 'Safety & Security',
        coordinator: 'Lucas Martin',
        reportedAt: timestamp,
        status: 'investigating',
        timeline: [
          { at: timestamp, text: `Field incident logged by Lucas Martin: ${incident.description}` },
        ],
        relatedTaskRef: id,
      };

      const newNotification: InAppNotification = {
        id: uid(),
        title: `Security Alert: ${incident.title}`,
        message: `${incident.severity.toUpperCase()} incident logged at ${incident.location} by Lucas Martin`,
        timestamp,
        roleId: 'security_responder',
        read: false,
        type: 'alert',
        itemId: id,
      };

      const dutyMgrNotification: InAppNotification = {
        id: uid(),
        title: `Security Log: ${incident.title}`,
        message: `Field security incident filed at ${incident.location} (${incident.severity})`,
        timestamp,
        roleId: 'department_manager',
        read: false,
        type: 'alert',
        itemId: id,
      };

      setState((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          security_responder: [newItem, ...(prev.items.security_responder ?? [])],
        },
        incidents: [newIncidentRecord, ...(prev.incidents ?? [])],
        notifications: [newNotification, dutyMgrNotification, ...(prev.notifications ?? [])].slice(0, 50),
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Security Responder',
            text: `Field incident logged: ${incident.title} (${incident.location})`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Lucas Martin',
        actorRole: 'Security Officer',
        action: 'Security Field Incident Created',
        category: 'Security',
        resource: id,
        outcome: 'success',
        details: `${incident.title} at ${incident.location} (${incident.severity})`,
      });

      notify('Field incident logged and added to active queue');
    },
    [notify, recordAuditEvent],
  );

  const recordInvoicePayment = useCallback<DemoApi['recordInvoicePayment']>(
    (invoiceId, amount, paymentMethod, referenceNumber, notes) => {
      const timestamp = nowLabel();
      let updatedGuest = '';
      let updatedRoom = '';
      let finalBal = 0;

      setState((prev) => {
        const invoices = (prev.invoices ?? seedInvoices).map((inv) => {
          if (inv.id === invoiceId) {
            updatedGuest = inv.guestName;
            updatedRoom = inv.roomNumber;
            const newPaid = inv.paidAmount + amount;
            const newOutstanding = Math.max(0, inv.totalAmount - newPaid);
            finalBal = newOutstanding;
            const newStatus: InvoiceStatus = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';
            return {
              ...inv,
              paidAmount: newPaid,
              outstandingBalance: newOutstanding,
              status: newStatus,
              paymentMethod: inv.paymentMethod ? `${inv.paymentMethod}, ${paymentMethod}` : paymentMethod,
              notes: notes ? (inv.notes ? `${inv.notes} | ${notes}` : notes) : inv.notes,
            };
          }
          return inv;
        });

        const newTxn: FinanceTransaction = {
          id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
          invoiceId,
          guestName: updatedGuest || 'Guest',
          bookingRef: `BK-${invoiceId.slice(-4)}`,
          roomNumber: updatedRoom || 'N/A',
          amount,
          paymentMethod,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: timestamp,
          status: 'Successful',
          referenceNumber: referenceNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
          gateway:
            paymentMethod === 'Cash'
              ? 'Front Desk Cash Register'
              : paymentMethod === 'UPI'
              ? 'Razorpay Enterprise'
              : 'HDFC Merchant Gateway',
          notes: notes || 'Manual payment recorded via Financial Operator console',
          isReconciled: true,
        };

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Payment Recorded: ₹${amount.toLocaleString('en-IN')}`,
          message: `Recorded payment of ₹${amount.toLocaleString('en-IN')} for ${updatedGuest} (Room ${updatedRoom}, ${invoiceId}) via ${paymentMethod}.`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'task',
          itemId: invoiceId,
        };

        return {
          ...prev,
          invoices,
          transactions: [newTxn, ...(prev.transactions ?? seedTransactions)],
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${invoiceId} (${updatedGuest})`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Noah Patel',
        actorRole: 'Financial Controller',
        action: 'Invoice Payment Recorded',
        category: 'Finance',
        resource: invoiceId,
        outcome: 'success',
        details: `Recorded ₹${amount.toLocaleString('en-IN')} via ${paymentMethod} (Ref: ${referenceNumber}). Remaining balance: ₹${finalBal.toLocaleString('en-IN')}.`,
      });

      notify(`Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully.`);
    },
    [notify, recordAuditEvent],
  );

  const createInvoice = useCallback<DemoApi['createInvoice']>(
    (invInput) => {
      const timestamp = nowLabel();
      const id = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const outstandingBalance = Math.max(0, invInput.totalAmount - invInput.paidAmount);
      const status: InvoiceStatus =
        outstandingBalance <= 0
          ? 'Paid'
          : invInput.paidAmount > 0
          ? 'Partially Paid'
          : 'Unpaid';

      const newInvoice: FinanceInvoice = {
        ...invInput,
        id,
        createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        outstandingBalance,
        status,
      };

      setState((prev) => {
        let txns = prev.transactions ?? seedTransactions;
        if (invInput.paidAmount > 0) {
          const newTxn: FinanceTransaction = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceId: id,
            guestName: invInput.guestName,
            bookingRef: invInput.bookingId,
            roomNumber: invInput.roomNumber,
            amount: invInput.paidAmount,
            paymentMethod: (invInput.paymentMethod as PaymentMethod) || 'Credit Card',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: timestamp,
            status: 'Successful',
            referenceNumber: `AUTH-${Math.floor(10000 + Math.random() * 90000)}`,
            gateway: 'Front Desk Terminal',
            notes: 'Advance / partial payment collected at invoice creation',
            isReconciled: true,
          };
          txns = [newTxn, ...txns];
        }

        const newNotification: InAppNotification = {
          id: uid(),
          title: `New Invoice Generated: ${id}`,
          message: `Generated invoice ${id} for ${invInput.guestName} (Room ${invInput.roomNumber}) for ₹${invInput.totalAmount.toLocaleString('en-IN')}.`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'task',
          itemId: id,
        };

        return {
          ...prev,
          invoices: [newInvoice, ...(prev.invoices ?? seedInvoices)],
          transactions: txns,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Invoice ${id} created for ${invInput.guestName} · Room ${invInput.roomNumber} (₹${invInput.totalAmount.toLocaleString('en-IN')})`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Noah Patel',
        actorRole: 'Financial Controller',
        action: 'Invoice Created',
        category: 'Finance',
        resource: id,
        outcome: 'success',
        details: `Invoice for ${invInput.guestName} (Room ${invInput.roomNumber}) generated for ₹${invInput.totalAmount.toLocaleString('en-IN')}`,
      });

      notify(`Invoice ${id} generated successfully.`);
    },
    [notify, recordAuditEvent],
  );

  const reviewRefundRequest = useCallback<DemoApi['reviewRefundRequest']>(
    (refundId, action, notes, rejectionReason) => {
      const timestamp = nowLabel();
      let updatedGuest = '';
      let refundAmount = 0;
      let targetInvId = '';

      setState((prev) => {
        const refunds = (prev.refundRequests ?? seedRefundRequests).map((ref) => {
          if (ref.id === refundId) {
            updatedGuest = ref.guestName;
            refundAmount = ref.amount;
            targetInvId = ref.invoiceId;

            const nextStatus: RefundStatus =
              action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Executed';

            return {
              ...ref,
              status: nextStatus,
              reviewedBy: 'Noah Patel (Financial Controller)',
              reviewedAt: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${timestamp}`,
              reviewNotes: notes || ref.reviewNotes,
              rejectionReason: action === 'reject' ? rejectionReason || notes : ref.rejectionReason,
              transactionRef:
                action === 'execute'
                  ? `REFUND-CRED-${Math.floor(100 + Math.random() * 900)}`
                  : ref.transactionRef,
            };
          }
          return ref;
        });

        let updatedInvoices = prev.invoices ?? seedInvoices;
        let updatedTransactions = prev.transactions ?? seedTransactions;

        if (action === 'execute') {
          updatedInvoices = updatedInvoices.map((inv) => {
            if (inv.id === targetInvId) {
              const newPaid = Math.max(0, inv.paidAmount - refundAmount);
              return {
                ...inv,
                paidAmount: newPaid,
                status: 'Refunded' as InvoiceStatus,
                notes: inv.notes
                  ? `${inv.notes} | Refund of ₹${refundAmount.toLocaleString('en-IN')} executed`
                  : `Refund of ₹${refundAmount.toLocaleString('en-IN')} executed`,
              };
            }
            return inv;
          });

          const refundTxn: FinanceTransaction = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceId: targetInvId,
            guestName: updatedGuest,
            bookingRef: `REF-${refundId}`,
            roomNumber: 'N/A',
            amount: refundAmount,
            paymentMethod: 'Credit Card',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: timestamp,
            status: 'Refunded',
            referenceNumber: `REFUND-REV-${Math.floor(1000 + Math.random() * 9000)}`,
            gateway: 'HDFC Merchant Gateway',
            notes: notes || `Refund executed for ${refundId}`,
            isReconciled: true,
          };
          updatedTransactions = [refundTxn, ...updatedTransactions];
        }

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Refund Decision: ${refundId} (${action.toUpperCase()})`,
          message: `Noah Patel marked refund ${refundId} for ${updatedGuest} (₹${refundAmount.toLocaleString('en-IN')}) as ${action.toUpperCase()}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'alert',
          itemId: refundId,
        };

        return {
          ...prev,
          refundRequests: refunds,
          invoices: updatedInvoices,
          transactions: updatedTransactions,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Refund ${refundId} (${updatedGuest}, ₹${refundAmount.toLocaleString('en-IN')}) marked as ${action.toUpperCase()}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Noah Patel',
        actorRole: 'Financial Controller',
        action: `Refund ${action.toUpperCase()}`,
        category: 'Finance',
        resource: refundId,
        outcome: action === 'reject' ? 'failure' : 'success',
        details: `Refund for ${updatedGuest} (₹${refundAmount.toLocaleString('en-IN')}) ${action}ed.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      });

      notify(`Refund request ${refundId} marked as ${action.toUpperCase()}.`);
    },
    [notify, recordAuditEvent],
  );

  const updateTransactionStatus = useCallback<DemoApi['updateTransactionStatus']>(
    (txnId, status, notes) => {
      const timestamp = nowLabel();
      let updatedGuest = '';

      setState((prev) => {
        const transactions = (prev.transactions ?? seedTransactions).map((tx) => {
          if (tx.id === txnId) {
            updatedGuest = tx.guestName;
            return {
              ...tx,
              status,
              notes: notes || tx.notes,
              isReconciled: status === 'Successful' ? true : tx.isReconciled,
            };
          }
          return tx;
        });

        const newNotification: InAppNotification = {
          id: uid(),
          title: `Transaction Updated: ${txnId}`,
          message: `Transaction ${txnId} for ${updatedGuest} status changed to ${status}.`,
          timestamp,
          roleId: 'financial_operator',
          read: false,
          type: 'task',
          itemId: txnId,
        };

        return {
          ...prev,
          transactions,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Transaction ${txnId} (${updatedGuest}) updated to ${status}`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Noah Patel',
        actorRole: 'Financial Controller',
        action: 'Transaction Status Updated',
        category: 'Finance',
        resource: txnId,
        outcome: 'success',
        details: `Transaction status manually set to ${status}. Details: ${notes || 'Operator reconciliation override'}`,
      });

      notify(`Transaction ${txnId} updated to ${status}.`);
    },
    [notify, recordAuditEvent],
  );

  const reconcileTransaction = useCallback<DemoApi['reconcileTransaction']>(
    (txnId) => {
      const timestamp = nowLabel();
      setState((prev) => {
        const transactions = (prev.transactions ?? seedTransactions).map((tx) => {
          if (tx.id === txnId) {
            return {
              ...tx,
              isReconciled: true,
              status: tx.status === 'Failed' ? ('Successful' as TransactionStatus) : tx.status,
            };
          }
          return tx;
        });

        return {
          ...prev,
          transactions,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Finance & Accounts',
              text: `Transaction ${txnId} reconciled against settlement batch`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Noah Patel',
        actorRole: 'Financial Controller',
        action: 'Transaction Reconciled',
        category: 'Finance',
        resource: txnId,
        outcome: 'success',
        details: 'Matched and cleared against bank settlement batch',
      });

      notify(`Transaction ${txnId} successfully reconciled.`);
    },
    [notify, recordAuditEvent],
  );

  const approveInspection = useCallback<DemoApi['approveInspection']>(
    (inspectionId, notes) => {
      const timestamp = nowLabel();
      let targetRoom = '';
      let targetTaskId: string | undefined;

      setState((prev) => {
        const inspections = (prev.inspections ?? seedInspections).map((insp) => {
          if (insp.id === inspectionId) {
            targetRoom = insp.roomNumber;
            targetTaskId = insp.taskId;
            return {
              ...insp,
              status: 'passed' as const,
              inspectedAt: timestamp,
              inspectedBy: 'Oliver Reed (EMP-0105)',
              score: 100,
              notes: notes || insp.notes || 'Passed checklist. Room released to Front Desk inventory.',
            };
          }
          return insp;
        });

        // Update front desk room status to clean & ready
        const rooms = prev.frontDesk.rooms.map((rm) => {
          if (rm.no === targetRoom) {
            return {
              ...rm,
              readiness: 'ready' as const,
              note: `Inspected & Passed by Oliver Reed at ${timestamp}`,
            };
          }
          return rm;
        });

        // Update task item if associated
        const updatedItems = { ...prev.items };
        if (targetTaskId) {
          Object.keys(updatedItems).forEach((roleKey) => {
            const role = roleKey as RoleId;
            updatedItems[role] = updatedItems[role].map((item) => {
              if (item.id === targetTaskId) {
                return {
                  ...item,
                  status: 'Completed',
                  notes: `${item.notes || ''} [Supervisor: Inspected & approved at ${timestamp}]`.trim(),
                };
              }
              return item;
            });
          });
        }

        const newNotification: InAppNotification = {
          id: `notif-${uid()}`,
          title: `Room ${targetRoom} Turnover Passed`,
          summary: `Supervisor Oliver Reed certified Room ${targetRoom}. Inventory updated to Ready.`,
          timestamp,
          read: false,
          tone: 'info',
          targetRole: 'front_desk_coordinator',
          category: 'Operations',
        };

        return {
          ...prev,
          inspections,
          frontDesk: {
            ...prev.frontDesk,
            rooms,
          },
          items: updatedItems,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Housekeeping Supervisor',
              text: `Room ${targetRoom} turnover approved by Oliver Reed. Marked Ready for check-in.`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Oliver Reed',
        actorRole: 'Housekeeping Supervisor',
        action: 'Room Inspection Approved',
        category: 'Workflow',
        resource: targetRoom ? `Room ${targetRoom}` : inspectionId,
        outcome: 'success',
        details: `Passed quality checklist with score 100%. Room inventory marked ready. Notes: ${notes || 'Clean & verified'}`,
      });

      notify(`Room ${targetRoom || 'inspection'} approved & marked READY for check-in!`);
    },
    [notify, recordAuditEvent],
  );

  const reopenInspection = useCallback<DemoApi['reopenInspection']>(
    (inspectionId, reason, correctiveAction, reassignToStaffId) => {
      const timestamp = nowLabel();
      let targetRoom = '';
      let targetTaskId: string | undefined;
      let newAssigneeName: string | undefined;

      setState((prev) => {
        if (reassignToStaffId) {
          const staff = prev.staffAccounts.find(
            (s) => s.id === reassignToStaffId || s.employeeId === reassignToStaffId,
          );
          if (staff) newAssigneeName = staff.name;
        }

        const inspections = (prev.inspections ?? seedInspections).map((insp) => {
          if (insp.id === inspectionId) {
            targetRoom = insp.roomNumber;
            targetTaskId = insp.taskId;
            return {
              ...insp,
              status: 'reopened' as const,
              inspectedAt: timestamp,
              inspectedBy: 'Oliver Reed (EMP-0105)',
              score: 65,
              reopenReason: reason,
              correctiveAction: correctiveAction,
              attendantName: newAssigneeName || insp.attendantName,
              notes: `Failed inspection: ${reason}. Corrective action: ${correctiveAction}`,
            };
          }
          return insp;
        });

        // Set room status back to cleaning
        const rooms = prev.frontDesk.rooms.map((rm) => {
          if (rm.no === targetRoom) {
            return {
              ...rm,
              readiness: 'cleaning' as const,
              note: `Failed inspection: ${reason}. Corrective touch-up in progress.`,
            };
          }
          return rm;
        });

        // Update task item status back to In progress
        const updatedItems = { ...prev.items };
        if (targetTaskId) {
          Object.keys(updatedItems).forEach((roleKey) => {
            const role = roleKey as RoleId;
            updatedItems[role] = updatedItems[role].map((item) => {
              if (item.id === targetTaskId) {
                return {
                  ...item,
                  status: 'In progress',
                  assignee: newAssigneeName || item.assignee,
                  notes: `${item.notes || ''} [Supervisor Reopened: ${reason} - ${correctiveAction}]`.trim(),
                };
              }
              return item;
            });
          });
        }

        const newNotification: InAppNotification = {
          id: `notif-${uid()}`,
          title: `Room ${targetRoom} Corrective Touch-up Required`,
          summary: `Supervisor flagged: ${reason}. Action: ${correctiveAction}`,
          timestamp,
          read: false,
          tone: 'urgent',
          targetRole: 'room_attendant_fulfiller',
          category: 'Operations',
        };

        return {
          ...prev,
          inspections,
          frontDesk: {
            ...prev.frontDesk,
            rooms,
          },
          items: updatedItems,
          notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Housekeeping Supervisor',
              text: `Room ${targetRoom} inspection reopened by Oliver Reed (${reason}). Returned for touch-up.`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Oliver Reed',
        actorRole: 'Housekeeping Supervisor',
        action: 'Room Inspection Reopened',
        category: 'Workflow',
        resource: targetRoom ? `Room ${targetRoom}` : inspectionId,
        outcome: 'warning',
        details: `Checklist failed. Reason: ${reason}. Required action: ${correctiveAction}. Assigned to: ${newAssigneeName || 'Original attendant'}`,
      });

      notify(`Inspection for Room ${targetRoom} returned for corrective cleaning.`);
    },
    [notify, recordAuditEvent],
  );

  const reviewFulfillerReassignment = useCallback<DemoApi['reviewFulfillerReassignment']>(
    (taskId, action, newAssigneeId, notes) => {
      const timestamp = nowLabel();
      let updatedTaskRef = '';
      let targetAssigneeName = '';

      setState((prev) => {
        if (newAssigneeId) {
          const staff = prev.staffAccounts.find(
            (s) => s.id === newAssigneeId || s.employeeId === newAssigneeId,
          );
          if (staff) targetAssigneeName = staff.name;
        }

        const updatedItems = { ...prev.items };
        Object.keys(updatedItems).forEach((roleKey) => {
          const role = roleKey as RoleId;
          updatedItems[role] = updatedItems[role].map((item) => {
            if (item.id === taskId) {
              updatedTaskRef = item.ref||item.id;
              if (action === 'reassign') {
                return {
                  ...item,
                  reassignPending: false,
                  reassignReason: undefined,
                  assignee: targetAssigneeName || item.assignee,
                  status: 'Assigned',
                  notes: `${item.notes || ''} [Supervisor Reassigned to ${targetAssigneeName || 'colleague'}: ${notes || 'Approved'}]`.trim(),
                };
              } else {
                return {
                  ...item,
                  reassignPending: false,
                  notes: `${item.notes || ''} [Supervisor Declined Reassignment: ${notes || 'Retain task'}]`.trim(),
                };
              }
            }
            return item;
          });
        });

        return {
          ...prev,
          items: updatedItems,
          feed: [
            {
              id: uid(),
              at: timestamp,
              role: 'Housekeeping Supervisor',
              text:
                action === 'reassign'
                  ? `Task ${updatedTaskRef} reassigned to ${targetAssigneeName} by Oliver Reed.`
                  : `Task ${updatedTaskRef} reassignment request declined by Oliver Reed.`,
            },
            ...prev.feed,
          ].slice(0, 30),
        };
      });

      recordAuditEvent({
        actor: 'Oliver Reed',
        actorRole: 'Housekeeping Supervisor',
        action: action === 'reassign' ? 'Task Reassigned by Supervisor' : 'Reassignment Request Denied',
        category: 'Workflow',
        resource: updatedTaskRef || taskId,
        outcome: action === 'reassign' ? 'success' : 'warning',
        details:
          action === 'reassign'
            ? `Reassigned to ${targetAssigneeName}. Note: ${notes || 'Operational balance'}`
            : `Declined reassignment request. Note: ${notes || 'Attendant retained'}`,
      });

      notify(
        action === 'reassign'
          ? `Task reassigned to ${targetAssigneeName || 'attendant'}.`
          : 'Reassignment declined. Attendant retained on task.',
      );
    },
    [notify, recordAuditEvent],
  );

  const escalateSupervisorIssue = useCallback<DemoApi['escalateSupervisorIssue']>(
    (issue) => {
      const timestamp = nowLabel();
      const escId = `INC-${Date.now().toString().slice(-4)}`;
      const escRef = `ESC-${issue.room || 'HK'}-${Date.now().toString().slice(-3)}`;

      const newIncident: IncidentRecord = {
        id: escId,
        ref: escRef,
        title: issue.title,
        severity: issue.priority === 'critical' ? 'critical' : 'major',
        affectedArea: issue.room ? `Room ${issue.room}` : 'Housekeeping Dept',
        department: 'Housekeeping',
        coordinator: 'Duty Manager Isabella Scott',
        reportedAt: timestamp,
        status: 'investigating',
        timeline: [
          { at: timestamp, text: `Escalated by Supervisor Oliver Reed: ${issue.reason}` },
          ...(issue.notes ? [{ at: timestamp, text: `Supervisor Notes: ${issue.notes}` }] : []),
        ],
      };

      const newNotification: InAppNotification = {
        id: `notif-${uid()}`,
        title: `Supervisor Escalation: ${issue.title}`,
        summary: `${issue.room ? 'Room ' + issue.room + ' · ' : ''}${issue.reason}`,
        timestamp,
        read: false,
        tone: 'urgent',
        targetRole: 'duty_manager',
        category: 'Incident',
      };

      setState((prev) => ({
        ...prev,
        incidents: [newIncident, ...(prev.incidents ?? seedIncidents)],
        notifications: [newNotification, ...(prev.notifications ?? [])].slice(0, 50),
        feed: [
          {
            id: uid(),
            at: timestamp,
            role: 'Housekeeping Supervisor',
            text: `Oliver Reed escalated ${issue.title} to Duty Manager Isabella Scott.`,
          },
          ...prev.feed,
        ].slice(0, 30),
      }));

      recordAuditEvent({
        actor: 'Oliver Reed',
        actorRole: 'Housekeeping Supervisor',
        action: 'Issue Escalated to Duty Manager',
        category: 'Security',
        resource: escRef,
        outcome: 'warning',
        details: `Priority: ${issue.priority}. Reason: ${issue.reason}. Room: ${issue.room || 'N/A'}. Details: ${issue.notes || 'None'}`,
      });

      notify(`Issue escalated to Duty Manager Isabella Scott (${escRef})`);
    },
    [notify, recordAuditEvent],
  );


return {get state(){return state;},messages,advance,cycleIntegration,submitGuestRequest,placeRoomServiceOrder,cancelGuestItem,submitGuestFeedback,disputeFolioCharge,claimLostItem,addLostFoundItem,expressCheckout,fdAction,toggleStaffStatus,updateStaffRole,addStaffAccount,updateWorkflowConfig,revokeRoomSession,restoreRoomSession,setIntegrationState,testConnector,simulateTestTask,recordAuditEvent,setSoundEnabled,setFulfillerAvailability,requestTaskReassignment,resolveReassignment,requestEmergencyShiftChange,attachTaskPhoto,markNotificationRead,clearAllNotifications,assignDispatcherTask,autoAssignTask,autoAssignAllPending,reassignDispatcherTask,linkDuplicateTask,escalateTaskToManager,redistributeUnstartedTasks,toggleRoutingRule,updateStaffAvailability,updateStaffCapacity,reviewResourceRequest,createResourceRequest,submitShiftHandover,acknowledgeShiftHandover,resolveComplaintCase,addManagerNote,updateIncidentStatus,reviewExecutiveItem,addExecutiveComment,requestExecutiveDirective,acknowledgeSecurityItem,arriveSecurityItem,resolveSecurityItem,requestSecurityBackup,escalateSecurityItem,addSecurityNote,createSecurityIncident,recordInvoicePayment,createInvoice,reviewRefundRequest,updateTransactionStatus,reconcileTransaction,approveInspection,reopenInspection,reviewFulfillerReassignment,escalateSupervisorIssue};
}
