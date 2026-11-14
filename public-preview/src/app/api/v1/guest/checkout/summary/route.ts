import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { FolioCheckoutService } from '@/server/modules/finance/folio/FolioCheckoutService';

export const runtime = 'nodejs';

function extractGuestSessionToken(request: NextRequest): string | undefined {
  let sessionToken = request.cookies.get('grand_guest_session')?.value;
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }
  return sessionToken;
}

/**
 * GET /api/v1/guest/checkout/summary
 * Returns checkout eligibility, balances, and dispute status for the authenticated guest
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const sessionToken = extractGuestSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active guest session required to access checkout summary.',
          traceId,
        },
      },
      { status: 401 }
    );
  }

  const checkoutService = FolioCheckoutService.getInstance();
  const result = await checkoutService.getCheckoutSummary(sessionToken);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: result.error,
          traceId,
        },
      },
      { status: result.statusCode }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      meta: { traceId },
    },
    { status: 200 }
  );
}
