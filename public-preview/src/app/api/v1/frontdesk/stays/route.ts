import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FrontDeskStayService,
} from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/stays
 *
 * Front Desk arrivals and stay management console query.
 * Query Parameters:
 *   - filter: 'all' | 'arrivals' | 'inhouse' | 'departures'
 *   - search: string (guest name, room number, or booking reference)
 */
export async function GET(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required. Missing staff session.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const filter = (searchParams.get('filter') as 'all' | 'arrivals' | 'inhouse' | 'departures') || undefined;
  const search = searchParams.get('search') || undefined;

  const service = new FrontDeskStayService();
  const result = await service.getStays(staff, { filter, search });

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'STAYS_QUERY_FAILED',
          message: result.error?.message || 'Failed to retrieve stay list.',
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
        total: result.data.counts.total,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}
