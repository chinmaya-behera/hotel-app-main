import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { FinancialDisputeService } from '@/server/modules/finance/disputes/FinancialDisputeService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/disputes
 * Front Desk financial dispute queue with status/category filters, search, and queue counts.
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required to view dispute triage queue.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const stayId = searchParams.get('stayId') || undefined;
  const roomNumber = searchParams.get('roomNumber') || undefined;
  const search = searchParams.get('search') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const service = FinancialDisputeService.getInstance();
  const result = await service.getFrontDeskDisputes(
    { status, category, stayId, roomNumber, search, dateFrom, dateTo },
    staff,
  );

  return NextResponse.json(
    {
      success: true,
      data: {
        disputes: result.data,
        counts: result.counts,
      },
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
      },
    },
    { status: 200 },
  );
}
