import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/integrations/pms/sync
 * Triggers on-demand synchronization & reconciliation run against PMS.
 */
export async function POST(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required to trigger PMS synchronization.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  try {
    const service = PmsReconciliationService.getInstance();
    const result = await service.triggerSync({ staffUser: staff });

    return NextResponse.json(
      {
        success: result.success,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          traceId,
        },
      },
      { status: result.success ? 200 : 503 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PMS_SYNC_ERROR',
          message: err.message || 'Error occurred during PMS sync trigger.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
