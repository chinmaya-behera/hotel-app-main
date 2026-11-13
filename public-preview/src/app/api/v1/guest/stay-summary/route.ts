import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { GuestStayService } from '@/server/modules/guest/GuestStayService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/guest/stay-summary
 *
 * Returns stay details and active request projections for the authenticated guest.
 * Session token is extracted from the secure HTTP-only 'grand_guest_session' cookie
 * (or Authorization Bearer header for test clients).
 */
export async function GET(request: NextRequest) {
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

  // 2. Query stay dashboard summary
  const service = new GuestStayService();
  const result = await service.getStaySummary(sessionToken);

  // 3. Handle errors
  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'FETCH_FAILED',
          message: result.error?.message || 'Failed to retrieve stay summary.',
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  // 4. Return standard ApiResponse envelope
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
