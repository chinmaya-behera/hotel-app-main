import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { FinancialDisputeService } from '@/server/modules/finance/disputes/FinancialDisputeService';

export const runtime = 'nodejs';

function extractGuestSessionToken(request: NextRequest): string | undefined {
  let sessionToken = request.cookies.get('grand_guest_session')?.value;
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }
  return sessionToken;
}

/**
 * GET /api/v1/guest/disputes/:id
 * Retrieves detail of a dispute belonging strictly to the authenticated guest's stay.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const { id } = await params;
  const sessionToken = extractGuestSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active guest session is required.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const service = FinancialDisputeService.getInstance();
  const result = await service.getGuestDisputeById(id, sessionToken);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.statusCode === 403 ? 'FORBIDDEN' : 'NOT_FOUND',
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
