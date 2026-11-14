import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/integrations/pms/status
 * Returns current PMS connector health, last sync timestamps, error categories, and reconciliation counts.
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  try {
    const service = PmsReconciliationService.getInstance();
    const status = await service.getStatus();

    return NextResponse.json(
      {
        success: true,
        data: status,
        meta: {
          timestamp: new Date().toISOString(),
          traceId,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PMS_STATUS_ERROR',
          message: err.message || 'Failed to retrieve PMS integration status.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
