import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';

export const runtime = 'nodejs';

const ResolveDiscrepancySchema = z.object({
  action: z.enum(['keep_internal', 'adopt_pms', 'manual_review', 'mark_ignored'], {
    errorMap: () => ({ message: 'Action must be keep_internal, adopt_pms, manual_review, or mark_ignored' }),
  }),
  notes: z.string().max(1000).optional(),
});

/**
 * POST /api/v1/integrations/pms/reconciliation/:id/resolve
 * Resolves a detected conflict between internal hotel records and external PMS.
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
          message: 'Staff authentication required to resolve reconciliation discrepancies.',
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

  const parseResult = ResolveDiscrepancySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid resolution payload.',
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

  try {
    const service = PmsReconciliationService.getInstance();
    const result = await service.resolveDiscrepancy(
      id,
      parseResult.data.action,
      staff,
      parseResult.data.notes,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOLUTION_FAILED',
            message: result.error || 'Failed to resolve reconciliation discrepancy.',
            traceId,
          },
        },
        { status: result.error?.includes('not found') ? 404 : 403 },
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
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'An unexpected error occurred.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
