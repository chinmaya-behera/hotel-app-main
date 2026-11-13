import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  PreCheckInService,
  PreCheckInSchema,
} from '@/server/modules/guest/PreCheckInService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/guest/pre-checkin
 *
 * Pre-Arrival Registration & ID Verification Upload (F08).
 * Verifies booking reference and surname, validates required identification fields,
 * securely registers attachment metadata via storage contract, and sets stay to pending_verify.
 */
export async function POST(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;

  // 1. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'The request body must be valid JSON.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  // 2. Validate input schema via Zod
  const validation = PreCheckInSchema.safeParse(body);
  if (!validation.success) {
    const details = validation.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }));

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'One or more required fields are missing or invalid.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  // 3. Process pre-arrival registration
  const service = new PreCheckInService();
  const result = await service.submitPreCheckIn(validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'PRE_CHECKIN_FAILED',
          message: result.error?.message || 'Failed to complete pre-arrival registration.',
          details: result.error?.details,
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: result.statusCode },
  );
}
