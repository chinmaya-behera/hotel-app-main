import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  OnlineBookingService,
  CreateBookingSchema,
} from '@/server/modules/public/OnlineBookingService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/bookings
 *
 * Public Online Room Reservation Engine.
 * Creates a reserved stay context, produces unique booking reference and TV PIN,
 * guards against double booking, and applies IP rate limiting.
 */
export async function POST(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;

  // 1. Identify Client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 2. Parse JSON body
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

  // 3. Validate Zod Schema
  const validation = CreateBookingSchema.safeParse(body);
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

  // 4. Create Booking
  const service = new OnlineBookingService();
  const result = await service.createBooking(validation.data, clientIp);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'BOOKING_CREATION_FAILED',
          message: result.error?.message || 'Failed to create reservation.',
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
