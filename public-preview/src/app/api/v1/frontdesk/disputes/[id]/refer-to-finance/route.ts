import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FinancialDisputeService,
  ReferToFinanceSchema,
} from '@/server/modules/finance/disputes/FinancialDisputeService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/frontdesk/disputes/:id/refer-to-finance
 * Hands off validated financial dispute to Finance department workflow.
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

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
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

  const parseResult = ReferToFinanceSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid refer-to-finance payload.',
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
  const result = await service.referToFinance(id, parseResult.data, staff);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HANDOFF_FAILED',
          message: result.error || 'Failed to refer dispute to Finance.',
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
        financeHandoffStatus: result.financeHandoffStatus,
        timestamp: new Date().toISOString(),
        traceId,
      },
    },
    { status: 200 },
  );
}
