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
 * POST /api/v1/guest/checkout/payment/:id
 * Server-side payment verification (validates payment outcome, updates folio, records captured transaction)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const sessionToken = extractGuestSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active guest session required to verify payment.',
          traceId,
        },
      },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const checkoutService = FolioCheckoutService.getInstance();

    const result = await checkoutService.verifySettlementPayment(sessionToken, {
      orderId: body.orderId || id,
      paymentRef: body.paymentRef || id,
      providerPaymentId: body.providerPaymentId,
      signature: body.signature,
    });

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
          message: err.message || 'Payment verification failed.',
          traceId,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/guest/checkout/payment/:id
 * Query payment verification status
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return POST(request, context);
}
