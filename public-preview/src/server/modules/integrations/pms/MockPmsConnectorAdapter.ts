import type {
  IPmsConnectorAdapter,
  PmsConnectionStatus,
  PmsConnectorPingResult,
  PmsExternalReservation,
  PmsPushReservationInput,
} from './PmsContracts.ts';

/**
 * Mock PMS Connector Adapter (DEV3-TASK-17)
 * Implements the external PMS interface for testing, development, and fallback simulation.
 * Simulates Oracle Hospitality Opera Cloud PMS integration.
 */
export class MockPmsConnectorAdapter implements IPmsConnectorAdapter {
  private static instance: MockPmsConnectorAdapter;
  private providerId = 'opera_cloud_pms';
  private providerName = 'Oracle Hospitality Opera Cloud PMS';
  private simulatedStatus: PmsConnectionStatus = 'CONNECTED';
  private simulatedLatencyMs = 35;
  private shouldFailNextCall = false;
  private failureErrorCategory: string | null = null;
  private failureErrorMessage: string | null = null;

  // External PMS in-memory store
  private reservations = new Map<string, PmsExternalReservation>();
  private pushedIdempotencyKeys = new Set<string>();

  constructor() {
    this.seedDefaultReservations();
  }

  public static getInstance(): MockPmsConnectorAdapter {
    if (!MockPmsConnectorAdapter.instance) {
      MockPmsConnectorAdapter.instance = new MockPmsConnectorAdapter();
    }
    return MockPmsConnectorAdapter.instance;
  }

  public getProviderId(): string {
    return this.providerId;
  }

  public getProviderName(): string {
    return this.providerName;
  }

  public setSimulatedStatus(status: PmsConnectionStatus): void {
    this.simulatedStatus = status;
  }

  public setSimulatedLatency(ms: number): void {
    this.simulatedLatencyMs = ms;
  }

  public setFailNextCall(fail: boolean, category = 'NETWORK_TIMEOUT', message = 'PMS connection timed out after 5000ms'): void {
    this.shouldFailNextCall = fail;
    this.failureErrorCategory = fail ? category : null;
    this.failureErrorMessage = fail ? message : null;
  }

  public reset(): void {
    this.simulatedStatus = 'CONNECTED';
    this.simulatedLatencyMs = 35;
    this.shouldFailNextCall = false;
    this.failureErrorCategory = null;
    this.failureErrorMessage = null;
    this.reservations.clear();
    this.pushedIdempotencyKeys.clear();
    this.seedDefaultReservations();
  }

  private seedDefaultReservations(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. In-house match: Room 402 - Aarav Sharma (Matches stayContextTable seed)
    this.reservations.set('BK-7892-0402', {
      externalId: 'PMS-RES-40201',
      bookingReference: 'BK-7892-0402',
      guestFirstName: 'Aarav',
      guestLastName: 'Sharma',
      guestEmail: 'aarav.sharma@example.com',
      guestPhone: '+91 98765 43210',
      roomNumber: '402',
      roomType: 'Deluxe Suite',
      status: 'checked_in',
      checkInDate: new Date(now - dayMs).toISOString(),
      checkOutDate: new Date(now + 2 * dayMs).toISOString(),
      totalPrice: 18500,
      currency: 'INR',
      isPaid: true,
      pmsLastUpdatedAt: new Date(now - 3600000).toISOString(),
    });

    // 2. Discrepancy seed: Room 102 - Status mismatch (Internal is 'reserved', PMS says 'checked_in')
    this.reservations.set('BK-102-DIRT', {
      externalId: 'PMS-RES-10201',
      bookingReference: 'BK-102-DIRT',
      guestFirstName: 'Arjun',
      guestLastName: 'Das',
      guestEmail: 'arjun.das@example.com',
      roomNumber: '102',
      roomType: 'Deluxe Twin',
      status: 'checked_in', // Mismatch with internal 'reserved'
      checkInDate: new Date(now - 4 * 3600000).toISOString(),
      checkOutDate: new Date(now + 3 * dayMs).toISOString(),
      totalPrice: 12000,
      currency: 'INR',
      isPaid: true,
      pmsLastUpdatedAt: new Date(now - 2 * 3600000).toISOString(),
    });

    // 3. Discrepancy seed: Room assignment mismatch (Internal has room 205, PMS says 208)
    this.reservations.set('BK-205-PREV', {
      externalId: 'PMS-RES-20501',
      bookingReference: 'BK-205-PREV',
      guestFirstName: 'Rohan',
      guestLastName: 'Mehra',
      guestEmail: 'rohan.mehra@example.com',
      roomNumber: '208', // Mismatch with internal '205'!
      roomType: 'Deluxe King',
      status: 'reserved',
      checkInDate: new Date(now - 12 * 3600000).toISOString(),
      checkOutDate: new Date(now + 2 * dayMs).toISOString(),
      totalPrice: 16000,
      currency: 'INR',
      isPaid: true,
      pmsLastUpdatedAt: new Date(now - 3600000).toISOString(),
    });

    // 4. Missing internal record: Exists only in PMS
    this.reservations.set('BK-9999-PMSONLY', {
      externalId: 'PMS-RES-99999',
      bookingReference: 'BK-9999-PMSONLY',
      guestFirstName: 'Elena',
      guestLastName: 'Rostova',
      guestEmail: 'elena.rostova@example.com',
      roomNumber: '501',
      roomType: 'Penthouse Presidential',
      status: 'reserved',
      checkInDate: new Date(now + dayMs).toISOString(),
      checkOutDate: new Date(now + 5 * dayMs).toISOString(),
      totalPrice: 85000,
      currency: 'INR',
      isPaid: true,
      pmsLastUpdatedAt: new Date(now - 1800000).toISOString(),
    });
  }

  public async ping(): Promise<PmsConnectorPingResult> {
    if (this.shouldFailNextCall || this.simulatedStatus === 'DISCONNECTED') {
      return {
        ok: false,
        providerId: this.providerId,
        providerName: this.providerName,
        status: 'DISCONNECTED',
        latencyMs: 5000,
        errorCategory: this.failureErrorCategory || 'NETWORK_TIMEOUT',
        errorMessage: this.failureErrorMessage || 'Connection to Oracle Opera PMS timed out after 5000ms',
      };
    }

    return {
      ok: this.simulatedStatus === 'CONNECTED' || this.simulatedStatus === 'DEGRADED',
      providerId: this.providerId,
      providerName: this.providerName,
      status: this.simulatedStatus,
      latencyMs: this.simulatedLatencyMs,
    };
  }

  public async fetchReservations(cursor?: string): Promise<{ reservations: PmsExternalReservation[]; nextCursor?: string }> {
    if (this.shouldFailNextCall || this.simulatedStatus === 'DISCONNECTED') {
      this.shouldFailNextCall = false; // consume one-shot failure
      throw new Error(this.failureErrorMessage || 'PMS_UNREACHABLE: Connection to Oracle Opera Cloud failed');
    }

    const all = Array.from(this.reservations.values());
    return {
      reservations: all,
      nextCursor: new Date().toISOString(),
    };
  }

  public async pushReservation(input: PmsPushReservationInput): Promise<{ success: boolean; externalRef?: string; error?: string }> {
    if (this.shouldFailNextCall || this.simulatedStatus === 'DISCONNECTED') {
      this.shouldFailNextCall = false;
      return {
        success: false,
        error: this.failureErrorMessage || 'PMS_SYNC_FAILED: PMS is currently unreachable. Queued to outbox.',
      };
    }

    // Idempotency check: if this key was already processed, succeed immediately without duplication
    if (this.pushedIdempotencyKeys.has(input.idempotencyKey)) {
      const existing = this.reservations.get(input.bookingReference);
      return {
        success: true,
        externalRef: existing?.externalId || `PMS-RES-${input.bookingReference}`,
      };
    }

    this.pushedIdempotencyKeys.add(input.idempotencyKey);

    const externalId = `PMS-RES-${Math.floor(10000 + Math.random() * 90000)}`;
    this.reservations.set(input.bookingReference, {
      externalId,
      bookingReference: input.bookingReference,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      roomNumber: input.roomNumber,
      roomType: input.roomType,
      status: input.status as any,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      pmsLastUpdatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      externalRef: externalId,
    };
  }
}
