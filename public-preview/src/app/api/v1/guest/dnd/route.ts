import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  GuestDndService,
  UpdateDndRequestSchema,
} from '@/server/modules/guest/GuestDndService';

export const runtime = 'nodejs';

/**
 * PATCH /api/v1/guest/dnd
 *
 * Toggles or updates in-room Do Not Disturb (DND) status for the authenticated guest.
 * Session token is extracted from the secure HTTP-only 'grand_guest_session' cookie
 * (or Authorization Bearer header for API clients).
 */
export async function PATCH(request: NextRequest) {
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
  const validation = UpdateDndRequestSchema.safeParse(body);
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

  // 4. Update DND status via GuestDndService
  const service = new GuestDndService();
  const result = await service.setDndStatus(sessionToken, validation.data);

  // 5. Handle errors
  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'DND_UPDATE_FAILED',
          message: result.error?.message || 'Failed to update DND status.',
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
    { status: 200 },
  );
}
