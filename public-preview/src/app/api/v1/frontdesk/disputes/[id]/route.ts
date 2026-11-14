import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { FinancialDisputeService } from '@/server/modules/finance/disputes/FinancialDisputeService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/disputes/:id
 * Retrieves full details of a financial dispute for Front Desk staff including private internal notes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const { id } = await params;
  const staff = await authenticateStaff(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const service = FinancialDisputeService.getInstance();
  const result = await service.getFrontDeskDisputeById(id, staff);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: result.error || 'Dispute not found.',
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
      },
    },
    { status: 200 },
  );
}
