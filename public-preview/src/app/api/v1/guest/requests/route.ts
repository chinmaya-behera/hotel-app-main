import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  GuestRequestService,
  CreateGuestRequestSchema,
} from '@/server/modules/guest/GuestRequestService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/guest/requests
 *
 * Submits an in-room service request for the authenticated guest.
 * Session token is extracted from the secure HTTP-only 'grand_guest_session' cookie
 * (or Authorization Bearer header for API clients).
 *
 * Delegates case and task generation directly to Developer 2's canonical TaskEngineService.
 */
export async function POST(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;

  // 1. Extract session token from cookie or Authorization header
  let sessionToken = request.cookies.get('grand_guest_session')?.value;

  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Active guest session cookie or Bearer token is missing.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

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

  // 3. Validate request schema via Zod
  const validation = CreateGuestRequestSchema.safeParse(body);
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

  // 4. Submit request via GuestRequestService
  const service = new GuestRequestService();
  const result = await service.submitRequest(sessionToken, validation.data);

  // 5. Handle errors
  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'SUBMISSION_FAILED',
          message: result.error?.message || 'Failed to submit guest service request.',
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  // 6. Return standard ApiResponse envelope
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
