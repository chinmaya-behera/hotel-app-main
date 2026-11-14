import { eq, desc } from 'drizzle-orm';
import { db, getConfiguredDatabaseUrl } from '../../../db/index.ts';
import {
  pmsSyncStatusTable,
  pmsReconciliationTable,
  type PmsSyncStatusEntity,
  type PmsReconciliationEntity,
} from '../../../db/schema/03_finance.ts';
import type {
  PmsDiscrepancyRecord,
  PmsDiscrepancyType,
  DiscrepancyResolutionAction,
  PmsSyncStatusState,
} from './PmsContracts.ts';

export interface DiscrepancyQueryFilters {
  status?: 'detected' | 'pending_review' | 'resolved' | 'ignored';
  discrepancyType?: PmsDiscrepancyType;
  internalRef?: string;
  externalRef?: string;
}

export interface IPmsReconciliationRepository {
  getSyncStatus(): Promise<PmsSyncStatusState>;
  saveSyncStatus(status: Partial<PmsSyncStatusState>): Promise<PmsSyncStatusState>;
  saveDiscrepancy(record: PmsDiscrepancyRecord): Promise<PmsDiscrepancyRecord>;
  getDiscrepancyById(id: string): Promise<PmsDiscrepancyRecord | null>;
  getAllDiscrepancies(filter?: DiscrepancyQueryFilters): Promise<PmsDiscrepancyRecord[]>;
  resolveDiscrepancy(
    id: string,
    action: DiscrepancyResolutionAction,
    staffName: string,
    notes?: string,
  ): Promise<PmsDiscrepancyRecord | null>;
  reset(): void;
}

/**
 * In-Memory PMS Reconciliation Repository for isolated tests and fallback.
 */
export class InMemoryPmsReconciliationRepository implements IPmsReconciliationRepository {
  private static instance: InMemoryPmsReconciliationRepository;
  private syncState: PmsSyncStatusState;
  private discrepancies = new Map<string, PmsDiscrepancyRecord>();

  constructor() {
    this.syncState = {
      providerId: 'opera_cloud_pms',
      providerName: 'Oracle Hospitality Opera Cloud PMS',
      connectionStatus: 'CONNECTED',
      syncDirection: 'bidirectional',
      lastSyncSuccessAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      lastSyncAttemptAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      lastErrorCategory: null,
      lastErrorMessage: null,
      syncCursor: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      pendingRecordsCount: 0,
      failedRecordsCount: 0,
      reconciliationDiscrepancyCount: 0,
      isStale: false,
      message: 'PMS synchronization active and healthy.',
    };
    this.seedDefaultDiscrepancies();
  }

  public static getInstance(): InMemoryPmsReconciliationRepository {
    if (!InMemoryPmsReconciliationRepository.instance) {
      InMemoryPmsReconciliationRepository.instance = new InMemoryPmsReconciliationRepository();
    }
    return InMemoryPmsReconciliationRepository.instance;
  }

  private seedDefaultDiscrepancies(): void {
    const seed1: PmsDiscrepancyRecord = {
      id: 'pms_rec_seed_01',
      discrepancyType: 'status_mismatch',
      internalRef: 'BK-4512-0305',
      externalRef: 'PMS-RES-30501',
      propertyId: 'prop_grand_adp_01',
      fieldOrConflict: 'status',
      internalValue: { status: 'checked_in', roomNumber: '305', guest: 'Marcus Chen' },
      externalValue: { status: 'reserved', roomNumber: '305', guest: 'Marcus Chen' },
      suggestedResolution: 'keep_internal',
      status: 'pending_review',
      auditHistory: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          action: 'DISCREPANCY_DETECTED',
          actor: 'System / PMS Reconciler',
          details: 'Internal stay is checked_in, but PMS status reports reserved.',
        },
      ],
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
    };

    const seed2: PmsDiscrepancyRecord = {
      id: 'pms_rec_seed_02',
      discrepancyType: 'payment_booking_conflict',
      internalRef: 'BK-8902-0114',
      externalRef: null,
      propertyId: 'prop_grand_adp_01',
      fieldOrConflict: 'booking_state',
      internalValue: { bookingReference: 'BK-8902-0114', paymentCaptured: true, amount: 14500 },
      externalValue: null,
      suggestedResolution: 'manual_review',
      status: 'pending_review',
      auditHistory: [
        {
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          action: 'DISCREPANCY_DETECTED',
          actor: 'System / Payment Outbox',
          details: 'Payment captured but PMS timed out during reservation injection (F14).',
        },
      ],
      detectedAt: new Date(Date.now() - 7200000).toISOString(),
    };

    this.discrepancies.set(seed1.id, seed1);
    this.discrepancies.set(seed2.id, seed2);
    this.syncState.reconciliationDiscrepancyCount = this.discrepancies.size;
  }

  public async getSyncStatus(): Promise<PmsSyncStatusState> {
    return { ...this.syncState, reconciliationDiscrepancyCount: this.discrepancies.size };
  }

  public async saveSyncStatus(updates: Partial<PmsSyncStatusState>): Promise<PmsSyncStatusState> {
    this.syncState = { ...this.syncState, ...updates };
    return { ...this.syncState };
  }

  public async saveDiscrepancy(record: PmsDiscrepancyRecord): Promise<PmsDiscrepancyRecord> {
    this.discrepancies.set(record.id, record);
    this.syncState.reconciliationDiscrepancyCount = Array.from(this.discrepancies.values())
      .filter((d) => d.status === 'detected' || d.status === 'pending_review').length;
    return record;
  }

  public async getDiscrepancyById(id: string): Promise<PmsDiscrepancyRecord | null> {
    return this.discrepancies.get(id) || null;
  }

  public async getAllDiscrepancies(filter?: DiscrepancyQueryFilters): Promise<PmsDiscrepancyRecord[]> {
    let list = Array.from(this.discrepancies.values());

    if (filter?.status) {
      list = list.filter((d) => d.status === filter.status);
    }
    if (filter?.discrepancyType) {
      list = list.filter((d) => d.discrepancyType === filter.discrepancyType);
    }
    if (filter?.internalRef) {
      list = list.filter((d) => d.internalRef === filter.internalRef);
    }
    if (filter?.externalRef) {
      list = list.filter((d) => d.externalRef === filter.externalRef);
    }

    return list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  public async resolveDiscrepancy(
    id: string,
    action: DiscrepancyResolutionAction,
    staffName: string,
    notes?: string,
  ): Promise<PmsDiscrepancyRecord | null> {
    const item = this.discrepancies.get(id);
    if (!item) return null;

    const updated: PmsDiscrepancyRecord = {
      ...item,
      status: action === 'mark_ignored' ? 'ignored' : 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: staffName,
      resolutionNotes: notes,
      auditHistory: [
        ...item.auditHistory,
        {
          timestamp: new Date().toISOString(),
          action: `RESOLVED_${action.toUpperCase()}`,
          actor: staffName,
          details: notes || `Resolved with action: ${action}`,
        },
      ],
    };

    this.discrepancies.set(id, updated);
    this.syncState.reconciliationDiscrepancyCount = Array.from(this.discrepancies.values())
      .filter((d) => d.status === 'detected' || d.status === 'pending_review').length;
    return updated;
  }

  public reset(): void {
    this.discrepancies.clear();
    this.seedDefaultDiscrepancies();
    this.syncState.connectionStatus = 'CONNECTED';
    this.syncState.lastErrorCategory = null;
    this.syncState.lastErrorMessage = null;
    this.syncState.pendingRecordsCount = 0;
    this.syncState.failedRecordsCount = 0;
  }
}

/**
 * PostgreSQL Drizzle PMS Reconciliation Repository.
 */
export class DrizzlePmsReconciliationRepository implements IPmsReconciliationRepository {
  private fallbackMemory = InMemoryPmsReconciliationRepository.getInstance();

  public async getSyncStatus(): Promise<PmsSyncStatusState> {
    try {
      const records = await db.select().from(pmsSyncStatusTable).limit(1);
      if (records.length === 0) {
        return this.fallbackMemory.getSyncStatus();
      }
      const r = records[0];
      return {
        providerId: r.providerId,
        providerName: r.providerName,
        connectionStatus: r.connectionStatus as any,
        syncDirection: r.syncDirection as any,
        lastSyncSuccessAt: r.lastSyncSuccessAt?.toISOString() || null,
        lastSyncAttemptAt: r.lastSyncAttemptAt?.toISOString() || null,
        lastErrorCategory: r.lastErrorCategory || null,
        lastErrorMessage: r.lastErrorMessage || null,
        syncCursor: r.syncCursor || null,
        pendingRecordsCount: r.pendingRecordsCount,
        failedRecordsCount: r.failedRecordsCount,
        reconciliationDiscrepancyCount: r.reconciliationDiscrepancyCount,
        isStale: r.connectionStatus === 'DISCONNECTED' || r.connectionStatus === 'SYNC_FAILED',
        message: `PMS connection status: ${r.connectionStatus}`,
      };
    } catch {
      return this.fallbackMemory.getSyncStatus();
    }
  }

  public async saveSyncStatus(status: Partial<PmsSyncStatusState>): Promise<PmsSyncStatusState> {
    try {
      const existing = await db.select().from(pmsSyncStatusTable).limit(1);
      if (existing.length === 0) {
        await db.insert(pmsSyncStatusTable).values({
          id: `pms_status_${Date.now()}`,
          providerId: status.providerId || 'opera_cloud_pms',
          providerName: status.providerName || 'Oracle Hospitality Opera Cloud PMS',
          connectionStatus: status.connectionStatus || 'CONNECTED',
          syncDirection: status.syncDirection || 'bidirectional',
          lastSyncSuccessAt: status.lastSyncSuccessAt ? new Date(status.lastSyncSuccessAt) : undefined,
          lastSyncAttemptAt: status.lastSyncAttemptAt ? new Date(status.lastSyncAttemptAt) : undefined,
          lastErrorCategory: status.lastErrorCategory,
          lastErrorMessage: status.lastErrorMessage,
          syncCursor: status.syncCursor,
          pendingRecordsCount: status.pendingRecordsCount || 0,
          failedRecordsCount: status.failedRecordsCount || 0,
          reconciliationDiscrepancyCount: status.reconciliationDiscrepancyCount || 0,
        });
      } else {
        await db.update(pmsSyncStatusTable)
          .set({
            connectionStatus: status.connectionStatus,
            lastSyncSuccessAt: status.lastSyncSuccessAt ? new Date(status.lastSyncSuccessAt) : undefined,
            lastSyncAttemptAt: status.lastSyncAttemptAt ? new Date(status.lastSyncAttemptAt) : undefined,
            lastErrorCategory: status.lastErrorCategory,
            lastErrorMessage: status.lastErrorMessage,
            syncCursor: status.syncCursor,
            pendingRecordsCount: status.pendingRecordsCount,
            failedRecordsCount: status.failedRecordsCount,
            reconciliationDiscrepancyCount: status.reconciliationDiscrepancyCount,
            updatedAt: new Date(),
          })
          .where(eq(pmsSyncStatusTable.id, existing[0].id));
      }
      return this.getSyncStatus();
    } catch {
      return this.fallbackMemory.saveSyncStatus(status);
    }
  }

  public async saveDiscrepancy(record: PmsDiscrepancyRecord): Promise<PmsDiscrepancyRecord> {
    try {
      await db.insert(pmsReconciliationTable).values({
        id: record.id,
        discrepancyType: record.discrepancyType,
        internalRef: record.internalRef,
        externalRef: record.externalRef,
        propertyId: record.propertyId,
        fieldOrConflict: record.fieldOrConflict,
        internalValue: record.internalValue,
        externalValue: record.externalValue,
        suggestedResolution: record.suggestedResolution,
        status: record.status,
        auditHistory: record.auditHistory,
        detectedAt: new Date(record.detectedAt),
      });
      return record;
    } catch {
      return this.fallbackMemory.saveDiscrepancy(record);
    }
  }

  public async getDiscrepancyById(id: string): Promise<PmsDiscrepancyRecord | null> {
    try {
      const records = await db.select().from(pmsReconciliationTable).where(eq(pmsReconciliationTable.id, id));
      if (records.length === 0) return this.fallbackMemory.getDiscrepancyById(id);
      const r = records[0];
      return {
        id: r.id,
        discrepancyType: r.discrepancyType as any,
        internalRef: r.internalRef,
        externalRef: r.externalRef,
        propertyId: r.propertyId,
        fieldOrConflict: r.fieldOrConflict,
        internalValue: r.internalValue,
        externalValue: r.externalValue,
        suggestedResolution: r.suggestedResolution as any,
        status: r.status as any,
        auditHistory: (r.auditHistory as any) || [],
        detectedAt: r.detectedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString(),
        resolvedBy: r.resolvedBy || undefined,
        resolutionNotes: r.resolutionNotes || undefined,
      };
    } catch {
      return this.fallbackMemory.getDiscrepancyById(id);
    }
  }

  public async getAllDiscrepancies(filter?: DiscrepancyQueryFilters): Promise<PmsDiscrepancyRecord[]> {
    try {
      const records = await db.select().from(pmsReconciliationTable).orderBy(desc(pmsReconciliationTable.detectedAt));
      if (records.length === 0) return this.fallbackMemory.getAllDiscrepancies(filter);
      let list: PmsDiscrepancyRecord[] = records.map((r) => ({
        id: r.id,
        discrepancyType: r.discrepancyType as any,
        internalRef: r.internalRef,
        externalRef: r.externalRef,
        propertyId: r.propertyId,
        fieldOrConflict: r.fieldOrConflict,
        internalValue: r.internalValue,
        externalValue: r.externalValue,
        suggestedResolution: r.suggestedResolution as any,
        status: r.status as any,
        auditHistory: (r.auditHistory as any) || [],
        detectedAt: r.detectedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString(),
        resolvedBy: r.resolvedBy || undefined,
        resolutionNotes: r.resolutionNotes || undefined,
      }));

      if (filter?.status) list = list.filter((d) => d.status === filter.status);
      if (filter?.discrepancyType) list = list.filter((d) => d.discrepancyType === filter.discrepancyType);
      if (filter?.internalRef) list = list.filter((d) => d.internalRef === filter.internalRef);
      if (filter?.externalRef) list = list.filter((d) => d.externalRef === filter.externalRef);

      return list;
    } catch {
      return this.fallbackMemory.getAllDiscrepancies(filter);
    }
  }

  public async resolveDiscrepancy(
    id: string,
    action: DiscrepancyResolutionAction,
    staffName: string,
    notes?: string,
  ): Promise<PmsDiscrepancyRecord | null> {
    try {
      const existing = await this.getDiscrepancyById(id);
      if (!existing) return null;

      const newAudit = [
        ...existing.auditHistory,
        {
          timestamp: new Date().toISOString(),
          action: `RESOLVED_${action.toUpperCase()}`,
          actor: staffName,
          details: notes || `Resolved with action: ${action}`,
        },
      ];

      await db.update(pmsReconciliationTable)
        .set({
          status: action === 'mark_ignored' ? 'ignored' : 'resolved',
          resolvedAt: new Date(),
          resolvedBy: staffName,
          resolutionNotes: notes,
          auditHistory: newAudit,
          updatedAt: new Date(),
        })
        .where(eq(pmsReconciliationTable.id, id));

      return this.getDiscrepancyById(id);
    } catch {
      return this.fallbackMemory.resolveDiscrepancy(id, action, staffName, notes);
    }
  }

  public reset(): void {
    this.fallbackMemory.reset();
  }
}

export function getPmsReconciliationRepository(): IPmsReconciliationRepository {
  const isPostgresConfigured = Boolean(getConfiguredDatabaseUrl());
  if (isPostgresConfigured) {
    return new DrizzlePmsReconciliationRepository();
  }
  return InMemoryPmsReconciliationRepository.getInstance();
}
