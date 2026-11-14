import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/gm/refund-approvals
 * Returns the queue of refunds pending General Manager approval
 */
export async function GET(request: NextRequest) {
  const staffUser = await authenticateStaff(request);
  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: General Manager or Duty Manager authorization required.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  const refundService = RefundService.getInstance();
  const result = await refundService.getPendingGmApprovals(staffUser);

  return NextResponse.json(
    {
      success: result.success,
      data: result.data,
      error: result.error,
    },
    { status: result.statusCode }
  );
}
