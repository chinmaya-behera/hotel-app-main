import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  PreCheckInService,
  PreCheckInSchema,
} from '@/server/modules/guest/PreCheckInService';
import { getGuestStayRepository } from '@/server/modules/guest/repositories/GuestStayRepository';

export const runtime = 'nodejs';

/**
 * POST /api/v1/stays/:id/pre-checkin
 *
 * REST path alias for Pre-Arrival Registration specified in BACKEND_TEAM_DIVISION_V2.md.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const traceId = `req_${crypto.randomUUID()}`;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
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

  // If bookingReference was omitted in the payload, look it up by stayId
  if (!body.bookingReference && id) {
    const repo = getGuestStayRepository();
    const stayWithRoom = await repo.getStayWithRoomById(id);
    if (stayWithRoom) {
      body.bookingReference = stayWithRoom.stay.bookingReference;
    }
  }

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
