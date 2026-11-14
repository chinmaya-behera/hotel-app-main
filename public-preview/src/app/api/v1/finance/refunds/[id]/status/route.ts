import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/finance/refunds/:id/status
 * Queries execution status and reconciles with payment gateway
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const staffUser = await authenticateStaff(request);
  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Staff credentials required.',
        code: 'UNAUTHORIZED_STAFF',
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const refundService = RefundService.getInstance();
  const result = await refundService.getRefundStatus(id, staffUser);

  return NextResponse.json(
    {
      success: result.success,
      data: result.data,
      error: result.error,
    },
    { status: result.statusCode }
  );
}
