import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { FolioCheckoutService } from '@/server/modules/finance/folio/FolioCheckoutService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/guest/checkout/receipt/:id
 * Retrieve digital checkout receipt
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const { id } = await context.params;

  const checkoutService = FolioCheckoutService.getInstance();
  const result = await checkoutService.getCheckoutReceipt(id);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
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
