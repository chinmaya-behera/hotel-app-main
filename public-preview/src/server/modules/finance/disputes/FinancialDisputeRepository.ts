import { eq, desc, and } from 'drizzle-orm';
import { db, getConfiguredDatabaseUrl } from '../../../db/index.ts';
import {
  financialDisputeTable,
  type FinancialDisputeEntity,
} from '../../../db/schema/03_finance.ts';
import type {
  FinancialDisputeRecord,
  DisputeStatus,
  DisputeCategory,
} from './DisputeContracts.ts';

export interface DisputeQueryFilters {
  status?: DisputeStatus | string;
  category?: DisputeCategory | string;
  stayId?: string;
  roomNumber?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IFinancialDisputeRepository {
  createDispute(record: FinancialDisputeRecord): Promise<FinancialDisputeRecord>;
  getDisputeById(id: string): Promise<FinancialDisputeRecord | null>;
  getDisputeByRef(disputeRef: string): Promise<FinancialDisputeRecord | null>;
  getDisputesForStay(stayId: string): Promise<FinancialDisputeRecord[]>;
  getAllDisputes(filter?: DisputeQueryFilters): Promise<FinancialDisputeRecord[]>;
  updateDispute(id: string, updates: Partial<FinancialDisputeRecord>): Promise<FinancialDisputeRecord | null>;
  findDisputeByIdempotencyKey(key: string): Promise<FinancialDisputeRecord | null>;
  reset(): void;
}

/**
 * In-Memory Financial Dispute Repository for isolated unit tests and offline fallback.
 */
export class InMemoryFinancialDisputeRepository implements IFinancialDisputeRepository {
  private static instance: InMemoryFinancialDisputeRepository;
  private disputes = new Map<string, FinancialDisputeRecord>();
  private idempotencyMap = new Map<string, FinancialDisputeRecord>();

  constructor() {
    this.seedDefaultDisputes();
  }

  public static getInstance(): InMemoryFinancialDisputeRepository {
    if (!InMemoryFinancialDisputeRepository.instance) {
      InMemoryFinancialDisputeRepository.instance = new InMemoryFinancialDisputeRepository();
    }
    return InMemoryFinancialDisputeRepository.instance;
  }

  private seedDefaultDisputes(): void {
    const now = Date.now();
    const seed1: FinancialDisputeRecord = {
      id: 'dsp_seed_01',
      disputeRef: 'DSP-2026-402-01',
      propertyId: 'prop_grand_adp_01',
      stayId: 'stay_cm52e69ab000108l5e89h892d',
      roomId: 'room_402_uuid',
      roomNumber: '402',
      guestName: 'Aarav Sharma',
      category: 'dining_charge_query',
      chargeRef: 'chg_inroom_dining_982',
      disputedAmount: 1850,
      currency: 'INR',
      guestExplanation: 'Billed twice for Continental Breakfast on Nov 13. Only ordered once.',
      status: 'triage_pending',
      preferredResolution: 'folio_credit',
      attachments: [],
      internalNotes: [
        {
          id: 'note_seed_01',
          staffId: 'staff_dev_fd_01',
          staffName: 'Sunita Patel',
          note: 'Verified KDS kitchen ticket #108 shows only one order dispatched. Likely double posted at night audit.',
          createdAt: new Date(now - 3600000).toISOString(),
        },
      ],
      auditHistory: [
        {
          timestamp: new Date(now - 7200000).toISOString(),
          action: 'DISPUTE_SUBMITTED',
          actor: 'Guest: Aarav Sharma',
          details: 'Dispute filed via Guest Portal.',
          toStatus: 'submitted',
        },
        {
          timestamp: new Date(now - 3600000).toISOString(),
          action: 'TRIAGE_QUEUED',
          actor: 'Front Desk: Sunita Patel',
          details: 'Initial triage intake completed.',
          fromStatus: 'submitted',
          toStatus: 'triage_pending',
        },
      ],
      escalationRequired: false,
      createdAt: new Date(now - 7200000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
    };

    const seed2: FinancialDisputeRecord = {
      id: 'dsp_seed_02',
      disputeRef: 'DSP-2026-305-01',
      propertyId: 'prop_grand_adp_01',
      stayId: 'stay_seed_305',
      roomNumber: '305',
      guestName: 'Marcus Chen',
      category: 'incorrect_room_charge',
      chargeRef: 'chg_hvac_fee_01',
      disputedAmount: 14500, // Exceeds ₹2,500 limit!
      currency: 'INR',
      guestExplanation: 'Charged for emergency HVAC technician fee. AC had mechanical failure due to hotel maintenance issue.',
      status: 'under_review',
      preferredResolution: 'charge_removal',
      attachments: [{ name: 'technician_bill.pdf', url: 'http://localhost/uploads/tech_bill.pdf' }],
      internalNotes: [
        {
          id: 'note_seed_02',
          staffId: 'staff_dev_fd_01',
          staffName: 'Sunita Patel',
          note: 'Amount exceeds ₹2,500 Front Desk limit. Requires escalation to General Manager / Finance.',
          createdAt: new Date(now - 1800000).toISOString(),
        },
      ],
      auditHistory: [
        {
          timestamp: new Date(now - 5400000).toISOString(),
          action: 'DISPUTE_SUBMITTED',
          actor: 'Guest: Marcus Chen',
          details: 'Dispute filed via Guest Portal.',
          toStatus: 'submitted',
        },
        {
          timestamp: new Date(now - 1800000).toISOString(),
          action: 'STATUS_TRANSITION',
          actor: 'Front Desk: Sunita Patel',
          details: 'Opened for triage review.',
          fromStatus: 'submitted',
          toStatus: 'under_review',
        },
      ],
      escalationRequired: true,
      createdAt: new Date(now - 5400000).toISOString(),
      updatedAt: new Date(now - 1800000).toISOString(),
    };

    this.disputes.set(seed1.id, seed1);
    this.disputes.set(seed2.id, seed2);
  }

  public async createDispute(record: FinancialDisputeRecord): Promise<FinancialDisputeRecord> {
    this.disputes.set(record.id, record);
    if (record.idempotencyKey) {
      this.idempotencyMap.set(record.idempotencyKey, record);
    }
    return record;
  }

  public async getDisputeById(id: string): Promise<FinancialDisputeRecord | null> {
    return this.disputes.get(id) || null;
  }

  public async getDisputeByRef(disputeRef: string): Promise<FinancialDisputeRecord | null> {
    for (const d of this.disputes.values()) {
      if (d.disputeRef.toLowerCase() === disputeRef.toLowerCase()) {
        return d;
      }
    }
    return null;
  }

  public async getDisputesForStay(stayId: string): Promise<FinancialDisputeRecord[]> {
    return Array.from(this.disputes.values())
      .filter((d) => d.stayId === stayId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getAllDisputes(filter?: DisputeQueryFilters): Promise<FinancialDisputeRecord[]> {
    let list = Array.from(this.disputes.values());

    if (filter?.status && filter.status !== 'all') {
      list = list.filter((d) => d.status === filter.status);
    }
    if (filter?.category && filter.category !== 'all') {
      list = list.filter((d) => d.category === filter.category);
    }
    if (filter?.stayId) {
      list = list.filter((d) => d.stayId === filter.stayId);
    }
    if (filter?.roomNumber) {
      list = list.filter((d) => d.roomNumber === filter.roomNumber);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.disputeRef.toLowerCase().includes(q) ||
          d.guestName.toLowerCase().includes(q) ||
          d.guestExplanation.toLowerCase().includes(q) ||
          d.roomNumber.toLowerCase().includes(q),
      );
    }
    if (filter?.dateFrom) {
      const fromMs = new Date(filter.dateFrom).getTime();
      list = list.filter((d) => new Date(d.createdAt).getTime() >= fromMs);
    }
    if (filter?.dateTo) {
      const toMs = new Date(filter.dateTo).getTime();
      list = list.filter((d) => new Date(d.createdAt).getTime() <= toMs);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateDispute(id: string, updates: Partial<FinancialDisputeRecord>): Promise<FinancialDisputeRecord | null> {
    const existing = this.disputes.get(id);
    if (!existing) return null;

    const updated: FinancialDisputeRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.disputes.set(id, updated);
    return updated;
  }

  public async findDisputeByIdempotencyKey(key: string): Promise<FinancialDisputeRecord | null> {
    return this.idempotencyMap.get(key) || null;
  }

  public reset(): void {
    this.disputes.clear();
    this.idempotencyMap.clear();
    this.seedDefaultDisputes();
  }
}

/**
 * PostgreSQL Drizzle Financial Dispute Repository.
 */
export class DrizzleFinancialDisputeRepository implements IFinancialDisputeRepository {
  private fallbackMemory = InMemoryFinancialDisputeRepository.getInstance();

  private mapEntityToRecord(e: FinancialDisputeEntity): FinancialDisputeRecord {
    return {
      id: e.id,
      disputeRef: e.disputeRef,
      propertyId: e.propertyId,
      stayId: e.stayId,
      roomId: e.roomId || undefined,
      roomNumber: e.roomNumber,
      guestName: e.guestName,
      category: e.category as any,
      chargeRef: e.chargeRef || undefined,
      disputedAmount: parseFloat(e.disputedAmount),
      currency: e.currency,
      guestExplanation: e.guestExplanation,
      status: e.status as any,
      preferredResolution: (e.preferredResolution as any) || undefined,
      attachments: (e.attachments as any) || [],
      internalNotes: (e.internalNotes as any) || [],
      auditHistory: (e.auditHistory as any) || [],
      escalationRequired: e.escalationRequired,
      assignedStaffId: e.assignedStaffId || undefined,
      assignedStaffName: e.assignedStaffName || undefined,
      referredToFinanceAt: e.referredToFinanceAt?.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString(),
      resolvedBy: e.resolvedBy || undefined,
      resolutionDetails: e.resolutionDetails || undefined,
      idempotencyKey: e.idempotencyKey || undefined,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }

  public async createDispute(record: FinancialDisputeRecord): Promise<FinancialDisputeRecord> {
    try {
      await db.insert(financialDisputeTable).values({
        id: record.id,
        disputeRef: record.disputeRef,
        propertyId: record.propertyId,
        stayId: record.stayId,
        roomId: record.roomId,
        roomNumber: record.roomNumber,
        guestName: record.guestName,
        category: record.category,
        chargeRef: record.chargeRef,
        disputedAmount: record.disputedAmount.toString(),
        currency: record.currency,
        guestExplanation: record.guestExplanation,
        status: record.status,
        preferredResolution: record.preferredResolution,
        attachments: record.attachments,
        internalNotes: record.internalNotes,
        auditHistory: record.auditHistory,
        escalationRequired: record.escalationRequired,
        assignedStaffId: record.assignedStaffId,
        assignedStaffName: record.assignedStaffName,
        referredToFinanceAt: record.referredToFinanceAt ? new Date(record.referredToFinanceAt) : undefined,
        resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : undefined,
        resolvedBy: record.resolvedBy,
        resolutionDetails: record.resolutionDetails,
        idempotencyKey: record.idempotencyKey,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      });
      return record;
    } catch {
      return this.fallbackMemory.createDispute(record);
    }
  }

  public async getDisputeById(id: string): Promise<FinancialDisputeRecord | null> {
    try {
      const records = await db.select().from(financialDisputeTable).where(eq(financialDisputeTable.id, id));
      if (records.length === 0) return this.fallbackMemory.getDisputeById(id);
      return this.mapEntityToRecord(records[0]);
    } catch {
      return this.fallbackMemory.getDisputeById(id);
    }
  }

  public async getDisputeByRef(disputeRef: string): Promise<FinancialDisputeRecord | null> {
    try {
      const records = await db.select().from(financialDisputeTable).where(eq(financialDisputeTable.disputeRef, disputeRef));
      if (records.length === 0) return this.fallbackMemory.getDisputeByRef(disputeRef);
      return this.mapEntityToRecord(records[0]);
    } catch {
      return this.fallbackMemory.getDisputeByRef(disputeRef);
    }
  }

  public async getDisputesForStay(stayId: string): Promise<FinancialDisputeRecord[]> {
    try {
      const records = await db.select().from(financialDisputeTable)
        .where(eq(financialDisputeTable.stayId, stayId))
        .orderBy(desc(financialDisputeTable.createdAt));
      if (records.length === 0) return this.fallbackMemory.getDisputesForStay(stayId);
      return records.map((r) => this.mapEntityToRecord(r));
    } catch {
      return this.fallbackMemory.getDisputesForStay(stayId);
    }
  }

  public async getAllDisputes(filter?: DisputeQueryFilters): Promise<FinancialDisputeRecord[]> {
    try {
      const records = await db.select().from(financialDisputeTable).orderBy(desc(financialDisputeTable.createdAt));
      if (records.length === 0) return this.fallbackMemory.getAllDisputes(filter);
      let list = records.map((r) => this.mapEntityToRecord(r));

      if (filter?.status && filter.status !== 'all') list = list.filter((d) => d.status === filter.status);
      if (filter?.category && filter.category !== 'all') list = list.filter((d) => d.category === filter.category);
      if (filter?.stayId) list = list.filter((d) => d.stayId === filter.stayId);
      if (filter?.roomNumber) list = list.filter((d) => d.roomNumber === filter.roomNumber);
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.disputeRef.toLowerCase().includes(q) ||
            d.guestName.toLowerCase().includes(q) ||
            d.guestExplanation.toLowerCase().includes(q) ||
            d.roomNumber.toLowerCase().includes(q),
        );
      }
      return list;
    } catch {
      return this.fallbackMemory.getAllDisputes(filter);
    }
  }

  public async updateDispute(id: string, updates: Partial<FinancialDisputeRecord>): Promise<FinancialDisputeRecord | null> {
    try {
      const dbUpdates: any = { ...updates, updatedAt: new Date() };
      if (updates.disputedAmount !== undefined) dbUpdates.disputedAmount = updates.disputedAmount.toString();
      if (updates.referredToFinanceAt) dbUpdates.referredToFinanceAt = new Date(updates.referredToFinanceAt);
      if (updates.resolvedAt) dbUpdates.resolvedAt = new Date(updates.resolvedAt);

      await db.update(financialDisputeTable).set(dbUpdates).where(eq(financialDisputeTable.id, id));
      return this.getDisputeById(id);
    } catch {
      return this.fallbackMemory.updateDispute(id, updates);
    }
  }

  public async findDisputeByIdempotencyKey(key: string): Promise<FinancialDisputeRecord | null> {
    try {
      const records = await db.select().from(financialDisputeTable).where(eq(financialDisputeTable.idempotencyKey, key));
      if (records.length === 0) return this.fallbackMemory.findDisputeByIdempotencyKey(key);
      return this.mapEntityToRecord(records[0]);
    } catch {
      return this.fallbackMemory.findDisputeByIdempotencyKey(key);
    }
  }

  public reset(): void {
    this.fallbackMemory.reset();
  }
}

export function getFinancialDisputeRepository(): IFinancialDisputeRepository {
  const isPostgresConfigured = Boolean(getConfiguredDatabaseUrl());
  if (isPostgresConfigured) {
    return new DrizzleFinancialDisputeRepository();
  }
  return InMemoryFinancialDisputeRepository.getInstance();
}
