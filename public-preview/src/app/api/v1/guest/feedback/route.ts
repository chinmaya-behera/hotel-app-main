import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  GuestFeedbackService,
  SubmitFeedbackSchema,
} from '@/server/modules/guest/GuestFeedbackService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/guest/feedback
 *
 * Submits star ratings and review feedback for an eligible completed in-room service request.
 * Authenticated via secure HTTP-only 'grand_guest_session' cookie.
 */
export async function POST(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;

  // 1. Extract session token
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

  // 3. Validate schema via Zod
  const validation = SubmitFeedbackSchema.safeParse(body);
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

  // 4. Submit feedback
  const service = new GuestFeedbackService();
  const result = await service.submitFeedback(sessionToken, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'FEEDBACK_SUBMISSION_FAILED',
          message: result.error?.message || 'Failed to submit feedback.',
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  // 5. Success
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
