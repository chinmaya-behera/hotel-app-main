import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FinancialDisputeService,
  DisputeTriageSchema,
} from '@/server/modules/finance/disputes/FinancialDisputeService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/frontdesk/disputes/:id/triage
 * Front Desk triage action: review, resolve (<= ₹2,500), refer to finance, or reject.
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
          message: 'Staff authentication required.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON payload in request body.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const parseResult = DisputeTriageSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid triage payload.',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            issue: e.message,
          })),
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = FinancialDisputeService.getInstance();
  const result = await service.triageDispute(id, parseResult.data, staff);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.statusCode === 403 ? 'AUTHORITY_LIMIT_EXCEEDED' : 'TRIAGE_FAILED',
          message: result.error || 'Failed to complete triage action.',
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
