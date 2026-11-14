import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/gm/refunds/:id/approve
 * General Manager reviews and approves a pending refund request
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
        error: 'Unauthorized: General Manager credentials required.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const refundService = RefundService.getInstance();
    const result = await refundService.approveRefund(id, body, staffUser);

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
        error: err.message || 'Failed to approve refund request.',
      },
      { status: 500 }
    );
  }
}
