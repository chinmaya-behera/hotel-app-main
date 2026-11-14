import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';
import type { PmsDiscrepancyType } from '@/server/modules/integrations/pms/PmsContracts';

export const runtime = 'nodejs';

/**
 * GET /api/v1/integrations/pms/reconciliation
 * Queries detected discrepancies between internal records and external PMS.
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') as any;
  const discrepancyType = searchParams.get('discrepancyType') as PmsDiscrepancyType | undefined;
  const internalRef = searchParams.get('internalRef') || undefined;
  const externalRef = searchParams.get('externalRef') || undefined;

  try {
    const service = PmsReconciliationService.getInstance();
    const discrepancies = await service.getDiscrepancies({
      status,
      discrepancyType,
      internalRef,
      externalRef,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          discrepancies,
          total: discrepancies.length,
          pendingReviewCount: discrepancies.filter((d) => d.status === 'pending_review' || d.status === 'detected').length,
          resolvedCount: discrepancies.filter((d) => d.status === 'resolved').length,
        },
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
          code: 'RECONCILIATION_QUERY_ERROR',
          message: err.message || 'Failed to query reconciliation discrepancies.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
