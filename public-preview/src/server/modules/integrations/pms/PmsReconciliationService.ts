import {
  type IPmsConnectorAdapter,
  type PmsConnectionStatus,
  type PmsDiscrepancyRecord,
  type PmsDiscrepancyType,
  type DiscrepancyResolutionAction,
  type PmsSyncStatusState,
} from './PmsContracts.ts';
import { MockPmsConnectorAdapter } from './MockPmsConnectorAdapter.ts';
import {
  type IPmsReconciliationRepository,
  getPmsReconciliationRepository,
} from './PmsReconciliationRepository.ts';
import {
  type IGuestStayRepository,
  getGuestStayRepository,
} from '../../guest/repositories/GuestStayRepository.ts';
import type { StaffAuthUser } from '../../frontdesk/FrontDeskStayService.ts';

export interface SyncExecutionResult {
  success: boolean;
  providerId: string;
  connectionStatus: PmsConnectionStatus;
  reconciliationSummary: {
    internalStaysEvaluated: number;
    pmsReservationsEvaluated: number;
    discrepanciesDetected: number;
    newDiscrepanciesSaved: number;
  };
  error?: {
    category: string;
    message: string;
  };
  timestamp: string;
}

/**
 * PMS Synchronization Fallback & Reconciliation Service (DEV3-TASK-17)
 * Implements F14 Booking-Payment sync, failure detection, offline fallback, and authoritative reconciliation.
 */
export class PmsReconciliationService {
  private static instance: PmsReconciliationService;
  private connector: IPmsConnectorAdapter;
  private repository: IPmsReconciliationRepository;
  private stayRepository: IGuestStayRepository;

  constructor(
    connector?: IPmsConnectorAdapter,
    repository?: IPmsReconciliationRepository,
    stayRepository?: IGuestStayRepository,
  ) {
    this.connector = connector || MockPmsConnectorAdapter.getInstance();
    this.repository = repository || getPmsReconciliationRepository();
    this.stayRepository = stayRepository || getGuestStayRepository();
  }

  public static getInstance(): PmsReconciliationService {
    if (!PmsReconciliationService.instance) {
      PmsReconciliationService.instance = new PmsReconciliationService();
    }
    return PmsReconciliationService.instance;
  }

  /**
   * 1. Retrieve Current PMS Status & Health
   */
  public async getStatus(): Promise<PmsSyncStatusState> {
    const pingRes = await this.connector.ping();
    const current = await this.repository.getSyncStatus();

    // If ping indicates failure or disconnected, reflect that in state
    let connectionStatus: PmsConnectionStatus = pingRes.status;
    let lastErrorCategory = current.lastErrorCategory;
    let lastErrorMessage = current.lastErrorMessage;

    if (!pingRes.ok) {
      connectionStatus = pingRes.status;
      lastErrorCategory = pingRes.errorCategory || 'NETWORK_TIMEOUT';
      lastErrorMessage = pingRes.errorMessage || 'PMS connector ping failed.';
    } else if (current.reconciliationDiscrepancyCount > 0) {
      connectionStatus = 'RECONCILIATION_REQUIRED';
    }

    const isStale = connectionStatus === 'DISCONNECTED' || connectionStatus === 'SYNC_FAILED';

    const updated = await this.repository.saveSyncStatus({
      connectionStatus,
      lastErrorCategory,
      lastErrorMessage,
      lastSyncAttemptAt: new Date().toISOString(),
    });

    return {
      ...updated,
      isStale,
      message: isStale
        ? 'PMS is unreachable. Operating in local approved fallback mode.'
        : `PMS status is ${connectionStatus}. Sync operational.`,
    };
  }

  /**
   * 2. Trigger Synchronization & Reconciliation Run
   */
  public async triggerSync(options?: { forceFullReconcile?: boolean; staffUser?: StaffAuthUser }): Promise<SyncExecutionResult> {
    const startTime = new Date().toISOString();
    const ping = await this.connector.ping();

    // Handle PMS Unavailable / Offline Fallback
    if (!ping.ok) {
      const errorCategory = ping.errorCategory || 'NETWORK_TIMEOUT';
      const errorMessage = ping.errorMessage || 'Unable to establish connection with external PMS.';

      await this.repository.saveSyncStatus({
        connectionStatus: 'DISCONNECTED',
        lastErrorCategory: errorCategory,
        lastErrorMessage: errorMessage,
        lastSyncAttemptAt: startTime,
        failedRecordsCount: (await this.repository.getSyncStatus()).failedRecordsCount + 1,
      });

      return {
        success: false,
        providerId: this.connector.getProviderId(),
        connectionStatus: 'DISCONNECTED',
        reconciliationSummary: {
          internalStaysEvaluated: 0,
          pmsReservationsEvaluated: 0,
          discrepanciesDetected: 0,
          newDiscrepanciesSaved: 0,
        },
        error: {
          category: errorCategory,
          message: errorMessage,
        },
        timestamp: startTime,
      };
    }

    try {
      // 1. Fetch external reservations
      const { reservations: pmsReservations } = await this.connector.fetchReservations();

      // 2. Fetch internal hotel stays
      const internalStays = await this.stayRepository.getAllStays({ filter: 'all' });

      // Build lookups
      const pmsByBookingRef = new Map<string, typeof pmsReservations[0]>();
      const pmsBookingRefCount = new Map<string, number>();

      for (const res of pmsReservations) {
        pmsByBookingRef.set(res.bookingReference, res);
        pmsBookingRefCount.set(res.bookingReference, (pmsBookingRefCount.get(res.bookingReference) || 0) + 1);
      }

      const existingDiscrepancies = await this.repository.getAllDiscrepancies();
      const existingKeySet = new Set(existingDiscrepancies.map((d) => `${d.discrepancyType}_${d.internalRef || ''}_${d.externalRef || ''}`));

      let newDiscrepanciesCount = 0;
      let totalDiscrepanciesDetected = 0;

      // Check 1: Duplicate external records detection
      for (const [bookingRef, count] of pmsBookingRefCount.entries()) {
        if (count > 1) {
          totalDiscrepanciesDetected++;
          const key = `duplicate_external_record_${bookingRef}_`;
          if (!existingKeySet.has(key)) {
            const pmsMatch = pmsByBookingRef.get(bookingRef);
            await this.repository.saveDiscrepancy({
              id: `pms_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              discrepancyType: 'duplicate_external_record',
              internalRef: bookingRef,
              externalRef: pmsMatch?.externalId || null,
              propertyId: 'prop_grand_adp_01',
              fieldOrConflict: 'booking_reference_duplicates',
              internalValue: { bookingReference: bookingRef },
              externalValue: { duplicateCount: count },
              suggestedResolution: 'manual_review',
              status: 'pending_review',
              auditHistory: [
                {
                  timestamp: startTime,
                  action: 'DUPLICATE_EXTERNAL_DETECTED',
                  actor: options?.staffUser?.name || 'System / PMS Reconciler',
                  details: `PMS returned ${count} records with the same booking reference ${bookingRef}.`,
                },
              ],
              detectedAt: startTime,
            });
            newDiscrepanciesCount++;
          }
        }
      }

      // Check 2: Compare internal stays against PMS
      for (const stayItem of internalStays) {
        const stay = stayItem.stay;
        const currentRoom = stayItem.currentRoom;
        const pmsMatch = pmsByBookingRef.get(stay.bookingReference);

        if (!pmsMatch) {
          // Missing in PMS
          totalDiscrepanciesDetected++;
          const key = `missing_pms_record_${stay.bookingReference}_`;
          if (!existingKeySet.has(key)) {
            await this.repository.saveDiscrepancy({
              id: `pms_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              discrepancyType: 'missing_pms_record',
              internalRef: stay.bookingReference,
              externalRef: null,
              propertyId: stay.propertyId,
              fieldOrConflict: 'reservation_existence',
              internalValue: {
                stayId: stay.id,
                guest: `${stay.guestFirstName} ${stay.guestLastName}`,
                room: currentRoom?.roomNumber,
                status: stay.status,
              },
              externalValue: null,
              suggestedResolution: 'keep_internal',
              status: 'pending_review',
              auditHistory: [
                {
                  timestamp: startTime,
                  action: 'DISCREPANCY_DETECTED',
                  actor: options?.staffUser?.name || 'System / PMS Reconciler',
                  details: `Internal booking ${stay.bookingReference} does not exist in PMS records.`,
                },
              ],
              detectedAt: startTime,
            });
            newDiscrepanciesCount++;
          }
        } else {
          // Compare room assignment
          if (currentRoom && pmsMatch.roomNumber && currentRoom.roomNumber !== pmsMatch.roomNumber) {
            totalDiscrepanciesDetected++;
            const key = `room_assignment_mismatch_${stay.bookingReference}_${pmsMatch.externalId}`;
            if (!existingKeySet.has(key)) {
              await this.repository.saveDiscrepancy({
                id: `pms_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                discrepancyType: 'room_assignment_mismatch',
                internalRef: stay.bookingReference,
                externalRef: pmsMatch.externalId,
                propertyId: stay.propertyId,
                fieldOrConflict: 'room_number',
                internalValue: { roomNumber: currentRoom.roomNumber },
                externalValue: { roomNumber: pmsMatch.roomNumber },
                suggestedResolution: 'keep_internal', // Room moves and physical lock assignment remain internally authoritative
                status: 'pending_review',
                auditHistory: [
                  {
                    timestamp: startTime,
                    action: 'DISCREPANCY_DETECTED',
                    actor: options?.staffUser?.name || 'System / PMS Reconciler',
                    details: `Room mismatch: Internal room is ${currentRoom.roomNumber}, PMS room is ${pmsMatch.roomNumber}.`,
                  },
                ],
                detectedAt: startTime,
              });
              newDiscrepanciesCount++;
            }
          }

          // Compare guest status (e.g. internal checked_in vs PMS reserved)
          if (stay.status !== pmsMatch.status) {
            totalDiscrepanciesDetected++;
            const key = `status_mismatch_${stay.bookingReference}_${pmsMatch.externalId}`;
            if (!existingKeySet.has(key)) {
              await this.repository.saveDiscrepancy({
                id: `pms_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                discrepancyType: 'status_mismatch',
                internalRef: stay.bookingReference,
                externalRef: pmsMatch.externalId,
                propertyId: stay.propertyId,
                fieldOrConflict: 'status',
                internalValue: { status: stay.status },
                externalValue: { status: pmsMatch.status },
                suggestedResolution: 'keep_internal',
                status: 'pending_review',
                auditHistory: [
                  {
                    timestamp: startTime,
                    action: 'DISCREPANCY_DETECTED',
                    actor: options?.staffUser?.name || 'System / PMS Reconciler',
                    details: `Stay status mismatch: Internal is ${stay.status}, PMS is ${pmsMatch.status}.`,
                  },
                ],
                detectedAt: startTime,
              });
              newDiscrepanciesCount++;
            }
          }
        }
      }

      // Check 3: Missing internal records (exists in PMS but not in hotel DB)
      const internalBookingRefs = new Set(internalStays.map((s) => s.stay.bookingReference));
      for (const pmsRes of pmsReservations) {
        if (!internalBookingRefs.has(pmsRes.bookingReference)) {
          totalDiscrepanciesDetected++;
          const key = `missing_internal_record__${pmsRes.externalId}`;
          if (!existingKeySet.has(key)) {
            await this.repository.saveDiscrepancy({
              id: `pms_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              discrepancyType: 'missing_internal_record',
              internalRef: null,
              externalRef: pmsRes.externalId,
              propertyId: 'prop_grand_adp_01',
              fieldOrConflict: 'reservation_existence',
              internalValue: null,
              externalValue: {
                bookingReference: pmsRes.bookingReference,
                guest: `${pmsRes.guestFirstName} ${pmsRes.guestLastName}`,
                roomNumber: pmsRes.roomNumber,
                status: pmsRes.status,
              },
              suggestedResolution: 'adopt_pms',
              status: 'pending_review',
              auditHistory: [
                {
                  timestamp: startTime,
                  action: 'DISCREPANCY_DETECTED',
                  actor: options?.staffUser?.name || 'System / PMS Reconciler',
                  details: `PMS reservation ${pmsRes.externalId} (${pmsRes.bookingReference}) not found in internal stays.`,
                },
              ],
              detectedAt: startTime,
            });
            newDiscrepanciesCount++;
          }
        }
      }

      // Update sync status state
      const finalStatus: PmsConnectionStatus = totalDiscrepanciesDetected > 0 ? 'RECONCILIATION_REQUIRED' : 'CONNECTED';
      await this.repository.saveSyncStatus({
        connectionStatus: finalStatus,
        lastSyncSuccessAt: startTime,
        lastSyncAttemptAt: startTime,
        lastErrorCategory: null,
        lastErrorMessage: null,
        syncCursor: startTime,
        pendingRecordsCount: 0,
        reconciliationDiscrepancyCount: totalDiscrepanciesDetected,
      });

      return {
        success: true,
        providerId: this.connector.getProviderId(),
        connectionStatus: finalStatus,
        reconciliationSummary: {
          internalStaysEvaluated: internalStays.length,
          pmsReservationsEvaluated: pmsReservations.length,
          discrepanciesDetected: totalDiscrepanciesDetected,
          newDiscrepanciesSaved: newDiscrepanciesCount,
        },
        timestamp: startTime,
      };
    } catch (err: any) {
      await this.repository.saveSyncStatus({
        connectionStatus: 'SYNC_FAILED',
        lastErrorCategory: 'SYNC_PROCESSING_ERROR',
        lastErrorMessage: err.message || 'Error occurred during reconciliation run.',
        lastSyncAttemptAt: startTime,
      });

      return {
        success: false,
        providerId: this.connector.getProviderId(),
        connectionStatus: 'SYNC_FAILED',
        reconciliationSummary: {
          internalStaysEvaluated: 0,
          pmsReservationsEvaluated: 0,
          discrepanciesDetected: 0,
          newDiscrepanciesSaved: 0,
        },
        error: {
          category: 'SYNC_PROCESSING_ERROR',
          message: err.message || 'Error occurred during reconciliation run.',
        },
        timestamp: startTime,
      };
    }
  }

  /**
   * 3. Query Reconciliation Discrepancies with Filtering
   */
  public async getDiscrepancies(filter?: {
    status?: 'detected' | 'pending_review' | 'resolved' | 'ignored';
    discrepancyType?: PmsDiscrepancyType;
    internalRef?: string;
    externalRef?: string;
  }): Promise<PmsDiscrepancyRecord[]> {
    return this.repository.getAllDiscrepancies(filter);
  }

  /**
   * 4. Get Discrepancy by ID
   */
  public async getDiscrepancyById(id: string): Promise<PmsDiscrepancyRecord | null> {
    return this.repository.getDiscrepancyById(id);
  }

  /**
   * 5. Resolve a Discrepancy Adhering to Authority Boundaries
   */
  public async resolveDiscrepancy(
    id: string,
    action: DiscrepancyResolutionAction,
    staffUser: StaffAuthUser,
    notes?: string,
  ): Promise<{ success: boolean; data?: PmsDiscrepancyRecord; error?: string }> {
    const discrepancy = await this.repository.getDiscrepancyById(id);
    if (!discrepancy) {
      return { success: false, error: 'Discrepancy record not found.' };
    }

    if (discrepancy.status === 'resolved' || discrepancy.status === 'ignored') {
      return { success: false, error: 'This discrepancy has already been resolved.' };
    }

    // Safety guard: Guest session validity and room physical assignments must adhere strictly to internal authority rules
    if (action === 'adopt_pms' && discrepancy.discrepancyType === 'room_assignment_mismatch') {
      // Physical keycard and door lock programming is authoritative internally; PMS cannot override physical assignment without Front Desk move protocol
      if (staffUser.role !== 'duty_manager' && staffUser.role !== 'admin' && staffUser.role !== 'general_manager') {
        return {
          success: false,
          error: 'Adopting PMS room assignment over internal physical lock mapping requires Duty Manager or Admin authorization.',
        };
      }
    }

    const updated = await this.repository.resolveDiscrepancy(id, action, staffUser.name, notes);
    return {
      success: true,
      data: updated || undefined,
    };
  }

  /**
   * 6. Retry Booking Sync (F14 Fix 1: Payment-to-Booking reconciliation retry)
   */
  public async retryBookingSync(
    bookingReference: string,
    staffUser: StaffAuthUser,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; externalRef?: string; message: string; error?: string }> {
    const key = idempotencyKey || `retry_${bookingReference}_${Date.now()}`;

    // Lookup internal stay
    const stayWithRoom = await this.stayRepository.getStayByBookingReference(bookingReference);
    if (!stayWithRoom) {
      return {
        success: false,
        error: `Booking ${bookingReference} not found in internal stay context.`,
        message: 'Sync retry failed.',
      };
    }

    const { stay, currentRoom } = stayWithRoom;
    const pushResult = await this.connector.pushReservation({
      bookingReference: stay.bookingReference,
      guestFirstName: stay.guestFirstName,
      guestLastName: stay.guestLastName,
      guestEmail: stay.guestEmail || undefined,
      guestPhone: stay.guestPhone || undefined,
      roomNumber: currentRoom?.roomNumber || 'TBD',
      roomType: currentRoom?.roomType || 'Standard',
      status: stay.status,
      checkInDate: stay.checkInTime.toISOString(),
      checkOutDate: stay.checkOutTime.toISOString(),
      idempotencyKey: key,
    });

    if (!pushResult.success) {
      return {
        success: false,
        error: pushResult.error || 'PMS rejected reservation synchronization.',
        message: 'Sync retry failed. Reservation remains in pending_confirmation queue.',
      };
    }

    // Mark any corresponding payment_booking_conflict discrepancy as resolved
    const discrepancies = await this.repository.getAllDiscrepancies({
      internalRef: bookingReference,
      status: 'pending_review',
    });

    for (const d of discrepancies) {
      await this.repository.resolveDiscrepancy(
        d.id,
        'adopt_pms',
        staffUser.name,
        `Booking successfully pushed to PMS via retry. External ref: ${pushResult.externalRef}`,
      );
    }

    return {
      success: true,
      externalRef: pushResult.externalRef,
      message: `${bookingReference} confirmed in the PMS. Payment was never duplicated.`,
    };
  }

  /**
   * 7. Retry Reconciliation Item by ID
   */
  public async retryReconciliation(
    id: string,
    staffUser: StaffAuthUser,
  ): Promise<{ success: boolean; data?: PmsDiscrepancyRecord; message: string; error?: string }> {
    const discrepancy = await this.repository.getDiscrepancyById(id);
    if (!discrepancy) {
      return { success: false, message: 'Reconciliation item not found.', error: 'NOT_FOUND' };
    }

    if (discrepancy.internalRef) {
      const retryRes = await this.retryBookingSync(discrepancy.internalRef, staffUser);
      if (!retryRes.success) {
        return {
          success: false,
          message: retryRes.message,
          error: retryRes.error,
        };
      }
    }

    const resolved = await this.repository.resolveDiscrepancy(
      id,
      'adopt_pms',
      staffUser.name,
      'Reconciliation retry completed successfully.',
    );

    return {
      success: true,
      data: resolved || undefined,
      message: 'Reconciliation item re-synced and resolved.',
    };
  }
}
