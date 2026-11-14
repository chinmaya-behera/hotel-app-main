import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/integrations/pms/reconciliation/:id/retry
 * Re-attempts synchronization for a reconciliation discrepancy with PMS.
 */
export async function POST(
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
          message: 'Staff authentication required to retry reconciliation.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  try {
    const service = PmsReconciliationService.getInstance();
    const result = await service.retryReconciliation(id, staff);

    return NextResponse.json(
      {
        success: result.success,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          traceId,
        },
      },
      { status: result.success ? 200 : (result.error === 'NOT_FOUND' ? 404 : 503) },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RETRY_ERROR',
          message: err.message || 'An unexpected error occurred during retry.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
