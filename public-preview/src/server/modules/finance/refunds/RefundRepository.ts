import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db/index.ts';
import { refundRequestTable } from '../../../db/schema/03_finance.ts';
import type {
  RefundRequestRecord,
  RefundApprovalStatus,
  RefundExecutionStatus,
  RefundAuditEntry,
} from './RefundContracts.ts';

export interface IRefundRepository {
  createRefund(record: RefundRequestRecord): Promise<RefundRequestRecord>;
  getRefundById(id: string): Promise<RefundRequestRecord | null>;
  getRefundByRef(refundRef: string): Promise<RefundRequestRecord | null>;
  getRefunds(filters?: {
    approvalStatus?: RefundApprovalStatus;
    executionStatus?: RefundExecutionStatus;
    stayId?: string;
    disputeId?: string;
  }): Promise<RefundRequestRecord[]>;
  getPendingGmApprovals(): Promise<RefundRequestRecord[]>;
  updateRefund(id: string, updates: Partial<RefundRequestRecord>): Promise<RefundRequestRecord | null>;
  reset(): void;
}

/**
 * Refund Repository (DEV3-TASK-19 / F32, F33)
 * Provides dual-mode persistence (In-memory + Neon PostgreSQL) for refund workflows.
 */
export class RefundRepository implements IRefundRepository {
  private static instance: RefundRepository;
  private inMemoryStore = new Map<string, RefundRequestRecord>();
  private useDb = false;

  constructor() {
    this.seedDefaultRefunds();
    this.detectDatabaseAvailability();
  }

  public static getInstance(): RefundRepository {
    if (!RefundRepository.instance) {
      RefundRepository.instance = new RefundRepository();
    }
    return RefundRepository.instance;
  }

  private async detectDatabaseAvailability(): Promise<void> {
    try {
      if (process.env.DATABASE_URL) {
        this.useDb = true;
      }
    } catch {
      this.useDb = false;
    }
  }

  public reset(): void {
    this.inMemoryStore.clear();
    this.seedDefaultRefunds();
  }

  private seedDefaultRefunds(): void {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400000).toISOString();
    const hoursAgo = new Date(now.getTime() - 3600000 * 4).toISOString();

    // 1. Pending GM Approval: Linked to Room 402 dispute (Requested by Front Desk officer)
    const ref1: RefundRequestRecord = {
      id: 'ref_seed_001',
      refundRef: 'REF-2026-0001',
      disputeId: 'dsp_seed_402',
      disputeRef: 'DSP-2026-402-01',
      stayId: 'stay_seed_402',
      folioId: 'fol_seed_402',
      chargeRef: 'CHG-DIN-402',
      originalPaymentRef: 'PAY-2026-402-01',
      requestedAmount: 2450.00,
      approvedAmount: null,
      currency: 'INR',
      reason: 'Guest disputed dinner charges for unattended room service; food was misdelivered to 403.',
      requestedByStaffId: 'stf_fd_01',
      requestedByStaffName: 'Priya Patel',
      requestedAt: dayAgo,
      approvalStatus: 'PENDING_APPROVAL',
      approvedByStaffId: null,
      approvedByStaffName: null,
      approvedAt: null,
      rejectionReason: null,
      executionStatus: 'PENDING_EXECUTION',
      providerRef: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      idempotencyKey: 'idem_ref_402_seed',
      auditHistory: [
        {
          timestamp: dayAgo,
          action: 'REFUND_REQUEST_CREATED',
          actor: 'Priya Patel (front_desk)',
          details: 'Dispute DSP-2026-402-01 referred to finance and refund request created for ₹2,450.00',
          toStatus: 'PENDING_APPROVAL',
        },
      ],
      createdAt: dayAgo,
      updatedAt: dayAgo,
    };

    // 2. Approved Refund: Ready for Gateway Execution (Approved by General Manager)
    const ref2: RefundRequestRecord = {
      id: 'ref_seed_002',
      refundRef: 'REF-2026-0002',
      disputeId: null,
      disputeRef: null,
      stayId: 'stay_seed_201',
      folioId: 'fol_seed_201',
      chargeRef: 'CHG-SPA-201',
      originalPaymentRef: 'PAY-2026-201-01',
      requestedAmount: 1500.00,
      approvedAmount: 1500.00,
      currency: 'INR',
      reason: 'Spa jacuzzi maintenance downtime during reserved slot.',
      requestedByStaffId: 'stf_fin_01',
      requestedByStaffName: 'Vikram Mehta',
      requestedAt: dayAgo,
      approvalStatus: 'APPROVED',
      approvedByStaffId: 'stf_gm_01',
      approvedByStaffName: 'Sanjay Kapoor (GM)',
      approvedAt: hoursAgo,
      rejectionReason: null,
      executionStatus: 'PENDING_EXECUTION',
      providerRef: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      idempotencyKey: 'idem_ref_201_seed',
      auditHistory: [
        {
          timestamp: dayAgo,
          action: 'REFUND_REQUEST_CREATED',
          actor: 'Vikram Mehta (finance_officer)',
          details: 'Refund request created for ₹1,500.00',
          toStatus: 'PENDING_APPROVAL',
        },
        {
          timestamp: hoursAgo,
          action: 'GM_APPROVED',
          actor: 'Sanjay Kapoor (general_manager)',
          details: 'Approved full amount of ₹1,500.00 due to confirmed equipment downtime.',
          fromStatus: 'PENDING_APPROVAL',
          toStatus: 'APPROVED',
        },
      ],
      createdAt: dayAgo,
      updatedAt: hoursAgo,
    };

    // 3. Rejected Refund: Disallowed from execution
    const ref3: RefundRequestRecord = {
      id: 'ref_seed_003',
      refundRef: 'REF-2026-0003',
      disputeId: null,
      disputeRef: null,
      stayId: 'stay_seed_305',
      folioId: 'fol_seed_305',
      chargeRef: 'CHG-MINIBAR-305',
      originalPaymentRef: 'PAY-2026-305-01',
      requestedAmount: 500.00,
      approvedAmount: null,
      currency: 'INR',
      reason: 'Minibar water bottles consumption query.',
      requestedByStaffId: 'stf_fd_02',
      requestedByStaffName: 'Anita Sharma',
      requestedAt: dayAgo,
      approvalStatus: 'REJECTED',
      approvedByStaffId: null,
      approvedByStaffName: 'Sanjay Kapoor (GM)',
      approvedAt: null,
      rejectionReason: 'Minibar sensor consumption logs verified and matched physical seals.',
      executionStatus: 'PENDING_EXECUTION',
      providerRef: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      idempotencyKey: 'idem_ref_305_seed',
      auditHistory: [
        {
          timestamp: dayAgo,
          action: 'REFUND_REQUEST_CREATED',
          actor: 'Anita Sharma (front_desk)',
          details: 'Refund request created for ₹500.00',
          toStatus: 'PENDING_APPROVAL',
        },
        {
          timestamp: hoursAgo,
          action: 'GM_REJECTED',
          actor: 'Sanjay Kapoor (general_manager)',
          details: 'Minibar sensor consumption logs verified and matched physical seals.',
          fromStatus: 'PENDING_APPROVAL',
          toStatus: 'REJECTED',
        },
      ],
      createdAt: dayAgo,
      updatedAt: hoursAgo,
    };

    this.inMemoryStore.set(ref1.id, ref1);
    this.inMemoryStore.set(ref2.id, ref2);
    this.inMemoryStore.set(ref3.id, ref3);
  }

  public async createRefund(record: RefundRequestRecord): Promise<RefundRequestRecord> {
    this.inMemoryStore.set(record.id, record);

    if (this.useDb) {
      try {
        await db.insert(refundRequestTable).values({
          id: record.id,
          refundRef: record.refundRef,
          disputeId: record.disputeId || null,
          disputeRef: record.disputeRef || null,
          stayId: record.stayId,
          folioId: record.folioId,
          chargeRef: record.chargeRef || null,
          originalPaymentRef: record.originalPaymentRef,
          requestedAmount: record.requestedAmount.toFixed(2),
          approvedAmount: record.approvedAmount ? record.approvedAmount.toFixed(2) : null,
          currency: record.currency,
          reason: record.reason,
          requestedByStaffId: record.requestedByStaffId,
          requestedByStaffName: record.requestedByStaffName,
          requestedAt: new Date(record.requestedAt),
          approvalStatus: record.approvalStatus,
          approvedByStaffId: record.approvedByStaffId || null,
          approvedByStaffName: record.approvedByStaffName || null,
          approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
          rejectionReason: record.rejectionReason || null,
          executionStatus: record.executionStatus,
          providerRef: record.providerRef || null,
          providerErrorCode: record.providerErrorCode || null,
          providerErrorMessage: record.providerErrorMessage || null,
          idempotencyKey: record.idempotencyKey || null,
          auditHistory: record.auditHistory,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
        });
      } catch (err) {
        // Fall back gracefully to memory
        console.warn('[RefundRepository] DB insert failed, using memory store:', (err as any)?.message);
      }
    }

    return record;
  }

  public async getRefundById(id: string): Promise<RefundRequestRecord | null> {
    if (this.useDb) {
      try {
        const rows = await db.select().from(refundRequestTable).where(eq(refundRequestTable.id, id)).limit(1);
        if (rows.length > 0) {
          return this.mapDbToRecord(rows[0]);
        }
      } catch {
        // fall back to memory
      }
    }
    return this.inMemoryStore.get(id) || null;
  }

  public async getRefundByRef(refundRef: string): Promise<RefundRequestRecord | null> {
    if (this.useDb) {
      try {
        const rows = await db.select().from(refundRequestTable).where(eq(refundRequestTable.refundRef, refundRef)).limit(1);
        if (rows.length > 0) {
          return this.mapDbToRecord(rows[0]);
        }
      } catch {
        // fall back to memory
      }
    }
    for (const r of this.inMemoryStore.values()) {
      if (r.refundRef === refundRef) return r;
    }
    return null;
  }

  public async getRefunds(filters?: {
    approvalStatus?: RefundApprovalStatus;
    executionStatus?: RefundExecutionStatus;
    stayId?: string;
    disputeId?: string;
  }): Promise<RefundRequestRecord[]> {
    const list = Array.from(this.inMemoryStore.values());
    return list.filter((r) => {
      if (filters?.approvalStatus && r.approvalStatus !== filters.approvalStatus) return false;
      if (filters?.executionStatus && r.executionStatus !== filters.executionStatus) return false;
      if (filters?.stayId && r.stayId !== filters.stayId) return false;
      if (filters?.disputeId && r.disputeId !== filters.disputeId) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getPendingGmApprovals(): Promise<RefundRequestRecord[]> {
    return this.getRefunds({ approvalStatus: 'PENDING_APPROVAL' });
  }

  public async updateRefund(id: string, updates: Partial<RefundRequestRecord>): Promise<RefundRequestRecord | null> {
    const existing = await this.getRefundById(id);
    if (!existing) return null;

    const updated: RefundRequestRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryStore.set(id, updated);

    if (this.useDb) {
      try {
        const dbUpdates: any = { updatedAt: new Date() };
        if (updates.approvalStatus !== undefined) dbUpdates.approvalStatus = updates.approvalStatus;
        if (updates.approvedAmount !== undefined) dbUpdates.approvedAmount = updates.approvedAmount ? updates.approvedAmount.toFixed(2) : null;
        if (updates.approvedByStaffId !== undefined) dbUpdates.approvedByStaffId = updates.approvedByStaffId;
        if (updates.approvedByStaffName !== undefined) dbUpdates.approvedByStaffName = updates.approvedByStaffName;
        if (updates.approvedAt !== undefined) dbUpdates.approvedAt = updates.approvedAt ? new Date(updates.approvedAt) : null;
        if (updates.rejectionReason !== undefined) dbUpdates.rejectionReason = updates.rejectionReason;
        if (updates.executionStatus !== undefined) dbUpdates.executionStatus = updates.executionStatus;
        if (updates.providerRef !== undefined) dbUpdates.providerRef = updates.providerRef;
        if (updates.providerErrorCode !== undefined) dbUpdates.providerErrorCode = updates.providerErrorCode;
        if (updates.providerErrorMessage !== undefined) dbUpdates.providerErrorMessage = updates.providerErrorMessage;
        if (updates.auditHistory !== undefined) dbUpdates.auditHistory = updates.auditHistory;

        await db.update(refundRequestTable).set(dbUpdates).where(eq(refundRequestTable.id, id));
      } catch (err) {
        console.warn('[RefundRepository] DB update failed, using memory store:', (err as any)?.message);
      }
    }

    return updated;
  }

  private mapDbToRecord(row: any): RefundRequestRecord {
    return {
      id: row.id,
      refundRef: row.refundRef,
      disputeId: row.disputeId,
      disputeRef: row.disputeRef,
      stayId: row.stayId,
      folioId: row.folioId,
      chargeRef: row.chargeRef,
      originalPaymentRef: row.originalPaymentRef,
      requestedAmount: parseFloat(row.requestedAmount),
      approvedAmount: row.approvedAmount ? parseFloat(row.approvedAmount) : null,
      currency: row.currency,
      reason: row.reason,
      requestedByStaffId: row.requestedByStaffId,
      requestedByStaffName: row.requestedByStaffName,
      requestedAt: row.requestedAt ? new Date(row.requestedAt).toISOString() : new Date().toISOString(),
      approvalStatus: row.approvalStatus as RefundApprovalStatus,
      approvedByStaffId: row.approvedByStaffId,
      approvedByStaffName: row.approvedByStaffName,
      approvedAt: row.approvedAt ? new Date(row.approvedAt).toISOString() : null,
      rejectionReason: row.rejectionReason,
      executionStatus: row.executionStatus as RefundExecutionStatus,
      providerRef: row.providerRef,
      providerErrorCode: row.providerErrorCode,
      providerErrorMessage: row.providerErrorMessage,
      idempotencyKey: row.idempotencyKey,
      auditHistory: row.auditHistory || [],
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}

export function getRefundRepository(): IRefundRepository {
  return RefundRepository.getInstance();
}
