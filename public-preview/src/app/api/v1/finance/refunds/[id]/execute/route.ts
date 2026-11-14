import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/finance/refunds/:id/execute
 * Executes an approved refund against the configured payment gateway adapter.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const staffUser = await authenticateStaff(request);
  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Finance Officer or GM authorization required.',
        code: 'UNAUTHORIZED_STAFF',
      },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const refundService = RefundService.getInstance();
    const result = await refundService.executeRefund(id, staffUser, body.idempotencyKey);

    return NextResponse.json(
      {
        success: result.success,
        data: result.data,
        error: result.error,
      },
      { status: result.statusCode }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to execute refund transaction.',
      },
      { status: 500 }
    );
  }
}
