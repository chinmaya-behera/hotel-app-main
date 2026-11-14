import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  CaseIntakeService,
  CaseIntakeSchema,
} from '@/server/modules/frontdesk/CaseIntakeService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/frontdesk/cases/intake
 *
 * Front Desk Manual In-Person Case & Dispute Intake (DEV3-TASK-11 / F10 / F31).
 * Validates Front Desk staff authorization, verifies room/stay context, validates required
 * fields by category, evaluates financial dispute triage limits (F31 rule), dispatches to
 * Developer 2's canonical Task Engine, and returns permitted Front Desk details.
 */
export async function POST(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;
  const staff = await authenticateStaff(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required for case intake.',
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
          message: 'Request body must be valid JSON.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const validation = CaseIntakeSchema.safeParse(body);
  if (!validation.success) {
    const details = validation.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }));

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid case intake payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const idempotencyHeader = request.headers.get('idempotency-key') || request.headers.get('x-idempotency-key') || undefined;

  const service = new CaseIntakeService();
  const result = await service.submitCaseIntake(staff, validation.data, idempotencyHeader);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'INTAKE_FAILED',
          message: result.error?.message || 'Case intake processing failed.',
          details: result.error?.details,
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
      },
    },
    { status: result.statusCode },
  );
}
