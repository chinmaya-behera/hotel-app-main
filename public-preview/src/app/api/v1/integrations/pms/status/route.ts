import { NextRequest, NextResponse } from 'next/server';
import { authenticateStaff } from '@/server/auth/request';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/integrations/pms/status
 * Returns current PMS connector health, last sync timestamps, error categories, and reconciliation counts.
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', traceId } }, { status: 401 });
  }
  if (!['front_desk', 'front_desk_coordinator', 'duty_manager', 'general_manager', 'admin', 'platform_admin'].includes(staff.role)) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', traceId } }, { status: 403 });
  }
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
