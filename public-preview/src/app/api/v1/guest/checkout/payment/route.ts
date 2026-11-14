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
 * POST /api/v1/guest/checkout/payment
 * Creates a digital settlement payment order with the payment provider
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
          message: 'Active guest session required to create payment order.',
          traceId,
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const checkoutService = FolioCheckoutService.getInstance();
    const result = await checkoutService.createSettlementPayment(sessionToken, body);

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
      { status: result.statusCode }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err.message || 'Payment initiation failed.',
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
