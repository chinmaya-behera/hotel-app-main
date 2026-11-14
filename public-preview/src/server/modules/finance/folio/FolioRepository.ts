import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.ts';
import {
  guestFolioTable,
  folioLineItemTable,
  folioPaymentTable,
} from '../../../db/schema/03_finance.ts';
import type {
  GuestFolioRecord,
  FolioLineItemRecord,
  FolioPaymentRecord,
} from './FolioContracts.ts';

export interface IFolioRepository {
  getFolioByStayId(stayId: string): Promise<GuestFolioRecord | null>;
  getFolioById(id: string): Promise<GuestFolioRecord | null>;
  getLineItems(folioId: string): Promise<FolioLineItemRecord[]>;
  getPayments(folioId: string): Promise<FolioPaymentRecord[]>;
  addPayment(payment: FolioPaymentRecord): Promise<FolioPaymentRecord>;
  addLineItem(item: FolioLineItemRecord): Promise<FolioLineItemRecord>;
  updateFolio(id: string, updates: Partial<GuestFolioRecord>): Promise<GuestFolioRecord | null>;
  reset(): void;
}

/**
 * Authoritative Folio Repository (DEV3-TASK-20 / F34)
 * Provides dual-mode persistence (In-memory + Neon PostgreSQL) for hotel folios and line items.
 */
export class FolioRepository implements IFolioRepository {
  private static instance: FolioRepository;
  private folios = new Map<string, GuestFolioRecord>();
  private lineItems = new Map<string, FolioLineItemRecord[]>();
  private payments = new Map<string, FolioPaymentRecord[]>();
  private useDb = false;

  constructor() {
    this.seedDefaultFolios();
    this.detectDatabaseAvailability();
  }

  public static getInstance(): FolioRepository {
    if (!FolioRepository.instance) {
      FolioRepository.instance = new FolioRepository();
    }
    return FolioRepository.instance;
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
    this.folios.clear();
    this.lineItems.clear();
    this.payments.clear();
    this.seedDefaultFolios();
  }

  private seedDefaultFolios(): void {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2).toISOString();

    // 1. Room 402 - Aarav Sharma (Folio balance = ₹0.00, fully paid, ready for checkout)
    const folio402: GuestFolioRecord = {
      id: 'fol_seed_402',
      stayId: 'stay_seed_402',
      bookingReference: 'BK-7892-0402',
      roomNumber: '402',
      guestName: 'Aarav Sharma',
      currency: 'INR',
      status: 'SETTLED',
      totalCharges: 19411.00,
      totalPayments: 19411.00,
      totalAdjustments: 0.00,
      outstandingBalance: 0.00,
      createdAt: twoDaysAgo,
      updatedAt: dayAgo,
    };

    const items402: FolioLineItemRecord[] = [
      {
        id: 'fli_402_1',
        folioId: 'fol_seed_402',
        category: 'room',
        description: 'Deluxe Suite Accommodation (2 Nights)',
        amount: 14000.00,
        isDisputed: false,
        postedAt: twoDaysAgo,
      },
      {
        id: 'fli_402_2',
        folioId: 'fol_seed_402',
        category: 'dining',
        description: 'Azure Fine Dining Room Service (Order #5812)',
        amount: 2450.00,
        isDisputed: true,
        disputeId: 'dsp_seed_402',
        postedAt: dayAgo,
      },
      {
        id: 'fli_402_3',
        folioId: 'fol_seed_402',
        category: 'tax',
        description: 'Goods & Services Tax (GST 18%)',
        amount: 2961.00,
        isDisputed: false,
        postedAt: dayAgo,
      },
    ];

    const payments402: FolioPaymentRecord[] = [
      {
        id: 'pay_402_1',
        folioId: 'fol_seed_402',
        paymentRef: 'PAY-2026-402-01',
        amount: 19411.00,
        currency: 'INR',
        method: 'card',
        status: 'captured',
        providerRef: 'pay_01J_razor_402',
        idempotencyKey: 'idem_pay_402_init',
        capturedAt: twoDaysAgo,
        createdAt: twoDaysAgo,
      },
    ];

    // 2. Room 201 - Rohan Mehra (Folio balance = ₹6,623.00, partially unpaid)
    const folio201: GuestFolioRecord = {
      id: 'fol_seed_201',
      stayId: 'stay_seed_201',
      bookingReference: 'BK-4401-0201',
      roomNumber: '201',
      guestName: 'Rohan Mehra',
      currency: 'INR',
      status: 'OPEN',
      totalCharges: 11623.00,
      totalPayments: 5000.00,
      totalAdjustments: 0.00,
      outstandingBalance: 6623.00,
      createdAt: twoDaysAgo,
      updatedAt: dayAgo,
    };

    const items201: FolioLineItemRecord[] = [
      {
        id: 'fli_201_1',
        folioId: 'fol_seed_201',
        category: 'room',
        description: 'Standard King Room (1 Night)',
        amount: 8000.00,
        isDisputed: false,
        postedAt: twoDaysAgo,
      },
      {
        id: 'fli_201_2',
        folioId: 'fol_seed_201',
        category: 'dining',
        description: 'In-Room Breakfast Buffet',
        amount: 1850.00,
        isDisputed: false,
        postedAt: dayAgo,
      },
      {
        id: 'fli_201_3',
        folioId: 'fol_seed_201',
        category: 'tax',
        description: 'GST (18%)',
        amount: 1773.00,
        isDisputed: false,
        postedAt: dayAgo,
      },
    ];

    const payments201: FolioPaymentRecord[] = [
      {
        id: 'pay_201_1',
        folioId: 'fol_seed_201',
        paymentRef: 'PAY-2026-201-01',
        amount: 5000.00,
        currency: 'INR',
        method: 'card',
        status: 'captured',
        providerRef: 'pay_01J_razor_201',
        idempotencyKey: 'idem_pay_201_init',
        capturedAt: twoDaysAgo,
        createdAt: twoDaysAgo,
      },
    ];

    // 3. Room 305 - Elena Rostova (Folio balance = ₹2,500.00, unpaid)
    const folio305: GuestFolioRecord = {
      id: 'fol_seed_305',
      stayId: 'stay_seed_305',
      bookingReference: 'BK-9912-0305',
      roomNumber: '305',
      guestName: 'Elena Rostova',
      currency: 'INR',
      status: 'OPEN',
      totalCharges: 2500.00,
      totalPayments: 0.00,
      totalAdjustments: 0.00,
      outstandingBalance: 2500.00,
      createdAt: dayAgo,
      updatedAt: dayAgo,
    };

    const items305: FolioLineItemRecord[] = [
      {
        id: 'fli_305_1',
        folioId: 'fol_seed_305',
        category: 'service',
        description: 'Airport Luxury Chauffeur Transfer',
        amount: 2500.00,
        isDisputed: false,
        postedAt: dayAgo,
      },
    ];

    this.folios.set(folio402.id, folio402);
    this.lineItems.set(folio402.id, items402);
    this.payments.set(folio402.id, payments402);

    this.folios.set(folio201.id, folio201);
    this.lineItems.set(folio201.id, items201);
    this.payments.set(folio201.id, payments201);

    this.folios.set(folio305.id, folio305);
    this.lineItems.set(folio305.id, items305);
    this.payments.set(folio305.id, []);
  }

  public async getFolioByStayId(stayId: string): Promise<GuestFolioRecord | null> {
    if (this.useDb) {
      try {
        const rows = await db.select().from(guestFolioTable).where(eq(guestFolioTable.stayId, stayId)).limit(1);
        if (rows.length > 0) {
          return this.mapDbToFolio(rows[0]);
        }
      } catch {
        // fall back to memory
      }
    }

    for (const f of this.folios.values()) {
      if (f.stayId === stayId) return f;
    }
    return null;
  }

  public async getFolioById(id: string): Promise<GuestFolioRecord | null> {
    if (this.useDb) {
      try {
        const rows = await db.select().from(guestFolioTable).where(eq(guestFolioTable.id, id)).limit(1);
        if (rows.length > 0) {
          return this.mapDbToFolio(rows[0]);
        }
      } catch {
        // fall back to memory
      }
    }
    return this.folios.get(id) || null;
  }

  public async getLineItems(folioId: string): Promise<FolioLineItemRecord[]> {
    if (this.useDb) {
      try {
        const rows = await db.select().from(folioLineItemTable).where(eq(folioLineItemTable.folioId, folioId));
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            folioId: r.folioId,
            category: r.category as any,
            description: r.description,
            amount: parseFloat(r.amount),
            isDisputed: r.isDisputed,
            disputeId: r.disputeId,
            postedAt: r.postedAt ? new Date(r.postedAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // fall back to memory
      }
    }
    return this.lineItems.get(folioId) || [];
  }

  public async getPayments(folioId: string): Promise<FolioPaymentRecord[]> {
    if (this.useDb) {
      try {
        const rows = await db.select().from(folioPaymentTable).where(eq(folioPaymentTable.folioId, folioId));
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            folioId: r.folioId,
            paymentRef: r.paymentRef,
            amount: parseFloat(r.amount),
            currency: r.currency,
            method: r.method as any,
            status: r.status as any,
            providerRef: r.providerRef,
            idempotencyKey: r.idempotencyKey,
            capturedAt: r.capturedAt ? new Date(r.capturedAt).toISOString() : null,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // fall back to memory
      }
    }
    return this.payments.get(folioId) || [];
  }

  public async addPayment(payment: FolioPaymentRecord): Promise<FolioPaymentRecord> {
    const list = this.payments.get(payment.folioId) || [];
    list.push(payment);
    this.payments.set(payment.folioId, list);

    if (this.useDb) {
      try {
        await db.insert(folioPaymentTable).values({
          id: payment.id,
          folioId: payment.folioId,
          paymentRef: payment.paymentRef,
          amount: payment.amount.toFixed(2),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          providerRef: payment.providerRef || null,
          idempotencyKey: payment.idempotencyKey || null,
          capturedAt: payment.capturedAt ? new Date(payment.capturedAt) : null,
          createdAt: new Date(payment.createdAt),
        });
      } catch (err) {
        console.warn('[FolioRepository] DB addPayment failed, using memory store:', (err as any)?.message);
      }
    }

    return payment;
  }

  public async addLineItem(item: FolioLineItemRecord): Promise<FolioLineItemRecord> {
    const list = this.lineItems.get(item.folioId) || [];
    list.push(item);
    this.lineItems.set(item.folioId, list);

    if (this.useDb) {
      try {
        await db.insert(folioLineItemTable).values({
          id: item.id,
          folioId: item.folioId,
          category: item.category,
          description: item.description,
          amount: item.amount.toFixed(2),
          isDisputed: item.isDisputed,
          disputeId: item.disputeId || null,
          postedAt: new Date(item.postedAt),
        });
      } catch (err) {
        console.warn('[FolioRepository] DB addLineItem failed, using memory store:', (err as any)?.message);
      }
    }

    return item;
  }

  public async updateFolio(id: string, updates: Partial<GuestFolioRecord>): Promise<GuestFolioRecord | null> {
    const existing = await this.getFolioById(id);
    if (!existing) return null;

    const updated: GuestFolioRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.folios.set(id, updated);

    if (this.useDb) {
      try {
        const dbUpdates: any = { updatedAt: new Date() };
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.totalCharges !== undefined) dbUpdates.totalCharges = updates.totalCharges.toFixed(2);
        if (updates.totalPayments !== undefined) dbUpdates.totalPayments = updates.totalPayments.toFixed(2);
        if (updates.totalAdjustments !== undefined) dbUpdates.totalAdjustments = updates.totalAdjustments.toFixed(2);
        if (updates.outstandingBalance !== undefined) dbUpdates.outstandingBalance = updates.outstandingBalance.toFixed(2);

        await db.update(guestFolioTable).set(dbUpdates).where(eq(guestFolioTable.id, id));
      } catch (err) {
        console.warn('[FolioRepository] DB updateFolio failed, using memory store:', (err as any)?.message);
      }
    }

    return updated;
  }

  private mapDbToFolio(row: any): GuestFolioRecord {
    return {
      id: row.id,
      stayId: row.stayId,
      bookingReference: row.bookingReference,
      roomNumber: row.roomNumber,
      guestName: row.guestName,
      currency: row.currency,
      status: row.status as any,
      totalCharges: parseFloat(row.totalCharges),
      totalPayments: parseFloat(row.totalPayments),
      totalAdjustments: parseFloat(row.totalAdjustments || '0'),
      outstandingBalance: parseFloat(row.outstandingBalance),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}

export function getFolioRepository(): IFolioRepository {
  return FolioRepository.getInstance();
}
