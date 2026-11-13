import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  QrAuthService,
  VerifyQrRequestSchema,
} from '@/server/modules/guest/QrAuthService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/guest/auth/verify-qr
 *
 * Authenticates an in-room guest using static room QR HMAC + Guest Challenge
 * (Last Name + Booking Reference / Welcome TV PIN).
 *
 * Sets the HTTP-only 'grand_guest_session' cookie on success.
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

  // 2. Validate payload via Zod schema
  const validation = VerifyQrRequestSchema.safeParse(body);
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

  // 3. Extract client IP and user-agent for rate limiting & audit
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // 4. Verify QR credentials and challenge
  const authService = new QrAuthService();
  const result = await authService.verifyAndCreateSession(validation.data, clientIp, userAgent);

  // 5. Handle verification failure or lockout
  if (!result.success || !result.data) {
    const errorResponse = {
      success: false,
      error: {
        code: result.error?.code || 'AUTH_FAILED',
        message: result.error?.message || 'Authentication failed.',
        traceId,
        ...(result.error?.retryAfterSeconds
          ? { retryAfterSeconds: result.error.retryAfterSeconds }
          : {}),
      },
    };

    const headers: Record<string, string> = {};
    if (result.error?.retryAfterSeconds) {
      headers['Retry-After'] = String(result.error.retryAfterSeconds);
    }

    return NextResponse.json(errorResponse, {
      status: result.statusCode,
      headers,
    });
  }

  // 6. Verification Success: Prepare response & HTTP-only cookie
  const successResponse = {
    success: true,
    data: {
      sessionId: result.data.sessionId,
      stayId: result.data.stayId,
      roomId: result.data.roomId,
      roomNumber: result.data.roomNumber,
      guestFullName: result.data.guestFullName,
      bookingReference: result.data.bookingReference,
      expiresAt: result.data.expiresAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  const response = NextResponse.json(successResponse, { status: 200 });

  // Set secure, HTTP-only guest session cookie
  response.cookies.set('grand_guest_session', result.data.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(result.data.expiresAt),
  });

  return response;
}

