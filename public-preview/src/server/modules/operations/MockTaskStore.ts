import type {
  FulfillerTaskProjection,
  ChecklistItemRecord,
  TaskEventRecord,
  TaskPriority,
  TaskStatus,
} from './contracts.ts';

/**
 * ============================================================================
 * MockTaskStore (Shared In-Memory Task Registry for Operations Adapters)
 * Canonical Owner: DEVELOPER 2 (Mock Adapter for Sprint 0)
 * Provides stateful persistence for MockTaskQueryService & MockTaskLifecycleService.
 * ============================================================================
 */
export class MockTaskStore {
  private static instance: MockTaskStore;
  private tasks = new Map<string, FulfillerTaskProjection>();

  private constructor() {
    this.seedDefaultTasks();
  }

  public static getInstance(): MockTaskStore {
    if (!MockTaskStore.instance) {
      MockTaskStore.instance = new MockTaskStore();
    }
    return MockTaskStore.instance;
  }

  public seedDefaultTasks(): void {
    const now = new Date();
    const iso = (minsOffset: number) => new Date(now.getTime() + minsOffset * 60000).toISOString();

    // 1. Task for EMP-0103: Extra Bath Towels & Toiletries (ASSIGNED, Urgent)
    const task1: FulfillerTaskProjection = {
      taskId: 'task_ful_001',
      caseRef: 'REQ-2026-4021',
      title: 'Deliver Extra Bath Towels & Luxury Toiletries',
      roomNumber: '402',
      floor: 4,
      category: 'Housekeeping / Extra Linens',
      department: 'Housekeeping',
      priority: 'urgent',
      status: 'assigned',
      instructions: 'Deliver 2 luxury bath sheets and 1 dental kit to Room 402. Knock twice and announce Housekeeping.',
      guestDndActive: false,
      assignedToStaffId: 'EMP-0103',
      assignedToStaffName: 'Vikram Singh',
      assignedAt: iso(-25),
      ackDueAt: iso(-10), // overdue for ack
      completionDueAt: iso(15),
      guestRequestSummary: 'Extra towels requested via Guest Portal for Room 402 (Aarav Sharma)',
      checklistItems: [
        { id: 'chk_001_1', label: 'Verify fresh linen package sealed from laundry', required: true, completed: false },
        { id: 'chk_001_2', label: 'Deliver directly to guest or place on bathroom vanity', required: true, completed: false },
        { id: 'chk_001_3', label: 'Record item replenishment in floor inventory log', required: false, completed: false },
      ],
      events: [
        {
          action: 'ASSIGNED',
          at: iso(-25),
          staffId: 'staff_hk_sup_01',
          staffName: 'Meera Nambiar',
          note: 'Task dispatched to attendant Vikram Singh (EMP-0103) based on Level 4 zone.',
        },
      ],
    };

    // 2. Task for EMP-0103: Room Turnover Cleaning (IN_PROGRESS, Normal)
    const task2: FulfillerTaskProjection = {
      taskId: 'task_ful_002',
      caseRef: 'REQ-2026-3041',
      title: 'Checkout Turnover Deep Clean & Sanitization',
      roomNumber: '304',
      floor: 3,
      category: 'Cleaning',
      department: 'Housekeeping',
      priority: 'normal',
      status: 'in_progress',
      instructions: 'Complete turnover sanitization following guest departure. Ensure hypoallergenic bedding set.',
      guestDndActive: false,
      assignedToStaffId: 'EMP-0103',
      assignedToStaffName: 'Vikram Singh',
      assignedAt: iso(-60),
      ackDueAt: iso(-45),
      completionDueAt: iso(30),
      guestRequestSummary: 'Scheduled turnover cleaning post checkout (Stay #304)',
      checklistItems: [
        {
          id: 'chk_002_1',
          label: 'Strip bed linens and sanitize mattress protector',
          required: true,
          completed: true,
          completedAt: iso(-35),
          completedByStaffId: 'EMP-0103',
        },
        {
          id: 'chk_002_2',
          label: 'Disinfect bathroom fixtures, replace shower curtains and bath sheets',
          required: true,
          completed: true,
          completedAt: iso(-20),
          completedByStaffId: 'EMP-0103',
        },
        {
          id: 'chk_002_3',
          label: 'Vacuum carpet and wipe all high-touch surfaces (door knobs, remotes)',
          required: true,
          completed: false, // Mandatory item pending!
        },
      ],
      events: [
        {
          action: 'ASSIGNED',
          at: iso(-60),
          staffId: 'staff_hk_sup_01',
          staffName: 'Meera Nambiar',
          note: 'Assigned to Vikram Singh',
        },
        {
          action: 'ACCEPTED',
          at: iso(-55),
          staffId: 'EMP-0103',
          staffName: 'Vikram Singh',
          note: 'Task accepted via Fulfiller Mobile App',
        },
        {
          action: 'STARTED',
          at: iso(-40),
          staffId: 'EMP-0103',
          staffName: 'Vikram Singh',
          note: 'Entered Room 304 and commenced sanitization',
        },
      ],
    };

    // 3. Task for EMP-0103: Memory Foam Pillows (BLOCKED by DND, Normal)
    const task3: FulfillerTaskProjection = {
      taskId: 'task_ful_003',
      caseRef: 'REQ-2026-2051',
      title: 'Hypoallergenic Memory Foam Pillow Delivery',
      roomNumber: '205',
      floor: 2,
      category: 'Housekeeping / Comfort',
      department: 'Housekeeping',
      priority: 'normal',
      status: 'blocked',
      instructions: 'Deliver 2 memory foam pillows requested by guest.',
      guestDndActive: true,
      assignedToStaffId: 'EMP-0103',
      assignedToStaffName: 'Vikram Singh',
      assignedAt: iso(-90),
      ackDueAt: iso(-75),
      completionDueAt: iso(60),
      blockedAt: iso(-30),
      blockedReason: 'Guest requested privacy (Do Not Disturb sign active and latch engaged)',
      guestRequestSummary: 'In-room guest requested 2 extra memory foam pillows',
      checklistItems: [
        {
          id: 'chk_003_1',
          label: 'Retrieve memory foam pillows from Floor 2 linen storage',
          required: true,
          completed: true,
          completedAt: iso(-45),
          completedByStaffId: 'EMP-0103',
        },
        {
          id: 'chk_003_2',
          label: 'Hand deliver to guest after privacy sign removed',
          required: true,
          completed: false,
        },
      ],
      events: [
        { action: 'ASSIGNED', at: iso(-90), staffId: 'staff_hk_sup_01', staffName: 'Meera Nambiar' },
        { action: 'ACCEPTED', at: iso(-85), staffId: 'EMP-0103', staffName: 'Vikram Singh' },
        { action: 'STARTED', at: iso(-50), staffId: 'EMP-0103', staffName: 'Vikram Singh' },
        {
          action: 'BLOCKED',
          at: iso(-30),
          staffId: 'EMP-0103',
          staffName: 'Vikram Singh',
          note: 'Guest door latch engaged with active Do Not Disturb sign. Blocker recorded.',
        },
      ],
    };

    // 4. Task for EMP-0103: Plush Bath Slippers (COMPLETED, Low)
    const task4: FulfillerTaskProjection = {
      taskId: 'task_ful_004',
      caseRef: 'REQ-2026-1011',
      title: 'Deliver Extra Large Plush Bath Slippers',
      roomNumber: '101',
      floor: 1,
      category: 'Guest Supplies',
      department: 'Housekeeping',
      priority: 'low',
      status: 'completed',
      instructions: 'Deliver 2 pairs of large slippers to Room 101.',
      guestDndActive: false,
      assignedToStaffId: 'EMP-0103',
      assignedToStaffName: 'Vikram Singh',
      assignedAt: iso(-180),
      ackDueAt: iso(-165),
      completionDueAt: iso(-120),
      completedAt: iso(-110),
      completionNotes: 'Handed directly to guest at door. Guest expressed satisfaction.',
      guestRequestSummary: 'Guest requested extra large slippers upon arrival',
      checklistItems: [
        {
          id: 'chk_004_1',
          label: 'Deliver large slippers in sealed luxury packaging',
          required: true,
          completed: true,
          completedAt: iso(-110),
          completedByStaffId: 'EMP-0103',
        },
      ],
      events: [
        { action: 'ASSIGNED', at: iso(-180), staffId: 'staff_hk_sup_01' },
        { action: 'ACCEPTED', at: iso(-175), staffId: 'EMP-0103' },
        { action: 'STARTED', at: iso(-130), staffId: 'EMP-0103' },
        { action: 'COMPLETED', at: iso(-110), staffId: 'EMP-0103', note: 'Work completed and verified.' },
      ],
    };

    // 5. Task for EMP-0112 (Wei Chen, Maintenance) - Used for cross-staff isolation testing
    const task5: FulfillerTaskProjection = {
      taskId: 'task_ful_005',
      caseRef: 'REQ-2026-3021',
      title: 'Inspect AC Thermostat Calibration & Sensor Drift',
      roomNumber: '302',
      floor: 3,
      category: 'maintenance',
      department: 'Maintenance & Engineering',
      priority: 'urgent',
      status: 'assigned',
      instructions: 'Guest reported room temperature reading 24C while thermostat set to 20C.',
      guestDndActive: false,
      assignedToStaffId: 'EMP-0112',
      assignedToStaffName: 'Wei Chen',
      assignedAt: iso(-15),
      ackDueAt: iso(0),
      completionDueAt: iso(30),
      guestRequestSummary: 'AC cooling sluggish in Room 302',
      checklistItems: [
        { id: 'chk_005_1', label: 'Measure return air temperature with digital probe', required: true, completed: false },
        { id: 'chk_005_2', label: 'Clean or replace filter screen if obstructed', required: true, completed: false },
      ],
      events: [
        { action: 'ASSIGNED', at: iso(-15), staffId: 'staff_eng_sup_01', staffName: 'Arjun Mehta' },
      ],
    };

    this.tasks.set(task1.taskId, task1);
    this.tasks.set(task2.taskId, task2);
    this.tasks.set(task3.taskId, task3);
    this.tasks.set(task4.taskId, task4);
    this.tasks.set(task5.taskId, task5);
  }

  public getTask(taskId: string): FulfillerTaskProjection | null {
    const task = this.tasks.get(taskId);
    return task ? JSON.parse(JSON.stringify(task)) : null;
  }

  public getTasksForStaff(staffId: string): FulfillerTaskProjection[] {
    const results: FulfillerTaskProjection[] = [];
    for (const task of this.tasks.values()) {
      if (task.assignedToStaffId === staffId) {
        results.push(JSON.parse(JSON.stringify(task)));
      }
    }
    return results;
  }

  public getAllTasks(): FulfillerTaskProjection[] {
    return Array.from(this.tasks.values()).map((t) => JSON.parse(JSON.stringify(t)));
  }

  public saveTask(task: FulfillerTaskProjection): FulfillerTaskProjection {
    const copy = JSON.parse(JSON.stringify(task));
    this.tasks.set(task.taskId, copy);
    return JSON.parse(JSON.stringify(copy));
  }

  public reset(): void {
    this.tasks.clear();
    this.seedDefaultTasks();
  }
}
