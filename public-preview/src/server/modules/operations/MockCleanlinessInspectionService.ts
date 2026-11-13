export type RoomReadinessStatus =
  | 'dirty'
  | 'cleaning'
  | 'inspection_pending'
  | 'inspected'
  | 'ready'
  | 'out_of_order';

export interface RoomCleanlinessSyncInput {
  roomNumber: string;
  targetStatus: RoomReadinessStatus;
  staffId: string;
  staffRole: string;
  notes?: string;
  inspectionPassed?: boolean;
}

export interface CleanlinessSyncResult {
  roomNumber: string;
  previousStatus: RoomReadinessStatus;
  currentStatus: RoomReadinessStatus;
  updatedAt: string;
  updatedBy: string;
  notes?: string;
}

/**
 * Interface contract for Room Cleanliness and Inspection Synchronization.
 * Canonical Owner: Developer 2 (Housekeeping Inspection Engine - DEV2-TASK-08 / DEV2-TASK-12).
 * Consumed by Developer 3 (Front Desk Room Readiness Board - DEV3-TASK-09).
 */
export interface ICleanlinessInspectionService {
  syncRoomCleanliness(input: RoomCleanlinessSyncInput): Promise<CleanlinessSyncResult>;
}

const SUPERVISOR_ROLES = ['supervisor', 'duty_manager', 'general_manager', 'admin'];
const MANAGER_ROLES = ['duty_manager', 'general_manager', 'admin'];

export class MockCleanlinessInspectionService implements ICleanlinessInspectionService {
  private static instance: MockCleanlinessInspectionService;
  private roomStatuses = new Map<string, RoomReadinessStatus>();

  constructor() {
    this.seedDefaultStatuses();
  }

  public static getInstance(): MockCleanlinessInspectionService {
    if (!MockCleanlinessInspectionService.instance) {
      MockCleanlinessInspectionService.instance = new MockCleanlinessInspectionService();
    }
    return MockCleanlinessInspectionService.instance;
  }

  private seedDefaultStatuses(): void {
    // Default cleanliness states for hotel rooms
    this.roomStatuses.set('101', 'ready');
    this.roomStatuses.set('102', 'dirty');
    this.roomStatuses.set('201', 'ready');
    this.roomStatuses.set('202', 'ready');
    this.roomStatuses.set('203', 'inspection_pending');
    this.roomStatuses.set('205', 'ready');
    this.roomStatuses.set('301', 'cleaning');
    this.roomStatuses.set('302', 'out_of_order');
    this.roomStatuses.set('303', 'ready');
    this.roomStatuses.set('401', 'ready');
    this.roomStatuses.set('402', 'ready');
    this.roomStatuses.set('403', 'ready');
    this.roomStatuses.set('501', 'ready');
    this.roomStatuses.set('505', 'ready');
    this.roomStatuses.set('601', 'ready');
    this.roomStatuses.set('701', 'dirty');
  }

  public getStatus(roomNumber: string): RoomReadinessStatus {
    return this.roomStatuses.get(roomNumber) || 'ready';
  }

  public async syncRoomCleanliness(input: RoomCleanlinessSyncInput): Promise<CleanlinessSyncResult> {
    const normRole = input.staffRole.toLowerCase().replace(/[\s-]/g, '_');
    const previousStatus = this.getStatus(input.roomNumber);

    // Rule 1: Marking a room as 'ready' requires Housekeeping Supervisor or Manager role (F21)
    if (input.targetStatus === 'ready') {
      const isSupervisor = SUPERVISOR_ROLES.some((r) => normRole.includes(r));
      if (!isSupervisor) {
        throw new Error(
          'INSPECTION_SUPERVISOR_REQUIRED: Front Desk agents cannot mark a room as Ready without supervisor inspection (F21).',
        );
      }
    }

    // Rule 2: Blocking a room 'out_of_order' requires Duty Manager or GM approval (F27)
    if (input.targetStatus === 'out_of_order') {
      const isManager = MANAGER_ROLES.some((r) => normRole.includes(r));
      if (!isManager) {
        throw new Error(
          'MANAGER_APPROVAL_REQUIRED: Placing a room out of order requires Duty Manager or General Manager authorization (F27).',
        );
      }
    }

    this.roomStatuses.set(input.roomNumber, input.targetStatus);

    return {
      roomNumber: input.roomNumber,
      previousStatus,
      currentStatus: input.targetStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: input.staffId,
      notes: input.notes,
    };
  }

  public reset(): void {
    this.roomStatuses.clear();
    this.seedDefaultStatuses();
  }
}
