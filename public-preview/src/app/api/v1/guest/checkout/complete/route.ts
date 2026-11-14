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
 * POST /api/v1/guest/checkout/complete
 * Executes express checkout for zero-balance folio, marks room dirty, revokes sessions, and syncs PMS
 */
export async function POST(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const sessionToken = extractGuestSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active guest session required to complete express checkout.',
          traceId,
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const checkoutService = FolioCheckoutService.getInstance();
    const result = await checkoutService.completeExpressCheckout(sessionToken, body);

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

    // Set cleared/expired guest cookie on response
    const response = NextResponse.json(
      {
        success: true,
        data: result.data,
        meta: {
          traceId,
          message: 'Express checkout completed successfully. We hope you enjoyed your stay!',
        },
      },
      { status: 200 }
    );

    response.cookies.set('grand_guest_session', '', {
      path: '/',
      httpOnly: true,
      expires: new Date(0),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err.message || 'Express checkout execution failed.',
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
