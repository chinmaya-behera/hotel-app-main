import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/finance/refunds
 * Creates a refund request (initiated by Finance Officer, Front Desk, or GM)
 */
export async function POST(request: NextRequest) {
  const staffUser = await authenticateStaff(request);
  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Staff credentials required to initiate a refund request.',
        code: 'UNAUTHORIZED_STAFF',
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const refundService = RefundService.getInstance();
    const result = await refundService.createRefundRequest(body, staffUser);

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
        error: err.message || 'Failed to process refund request.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/finance/refunds
 * List refund requests with optional filters
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const approvalStatus = searchParams.get('approvalStatus') || undefined;
  const executionStatus = searchParams.get('executionStatus') || undefined;
  const stayId = searchParams.get('stayId') || undefined;
  const disputeId = searchParams.get('disputeId') || undefined;

  const refundService = RefundService.getInstance();
  const result = await refundService.getRefunds({
    approvalStatus: approvalStatus as any,
    executionStatus: executionStatus as any,
    stayId,
    disputeId,
  });

  return NextResponse.json(result);
}
