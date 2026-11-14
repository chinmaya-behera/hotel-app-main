import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

const RetrySyncSchema = z.object({
  bookingRef: z.string().min(3, 'Booking reference is required').trim(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/v1/frontdesk/pms-sync/retry
 * Retries PMS synchronization for a payment-captured reservation pending confirmation (F14).
 */
export async function POST(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required to retry PMS booking sync.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON payload in request body.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const parseResult = RetrySyncSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid retry payload.',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            issue: e.message,
          })),
          traceId,
        },
      },
      { status: 400 },
    );
  }

  try {
    const service = PmsReconciliationService.getInstance();
    const result = await service.retryBookingSync(
      parseResult.data.bookingRef,
      staff,
      parseResult.data.idempotencyKey,
    );

    return NextResponse.json(
      {
        success: result.success,
        data: {
          bookingRef: parseResult.data.bookingRef,
          externalRef: result.externalRef,
          message: result.message,
        },
        meta: {
          timestamp: new Date().toISOString(),
          traceId,
        },
      },
      { status: result.success ? 200 : 503 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RETRY_ERROR',
          message: err.message || 'Error occurred during PMS sync retry.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
