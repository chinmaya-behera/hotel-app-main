import { NextRequest, NextResponse } from 'next/server';
import { authenticateStaff } from '@/server/auth/request';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/integrations/pms/reconciliation/:id
 * Retrieves details, conflicting values, and audit history of a specific discrepancy.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', traceId } }, { status: 401 });
  }
  if (!['front_desk', 'front_desk_coordinator', 'duty_manager', 'general_manager', 'admin', 'platform_admin'].includes(staff.role)) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', traceId } }, { status: 403 });
  }
  const { id } = await params;

  try {
    const service = PmsReconciliationService.getInstance();
    const discrepancy = await service.getDiscrepancyById(id);

    if (!discrepancy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Reconciliation discrepancy with ID '${id}' not found.`,
            traceId,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: discrepancy,
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
          code: 'DISCREPANCY_FETCH_ERROR',
          message: err.message || 'Failed to fetch discrepancy details.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
