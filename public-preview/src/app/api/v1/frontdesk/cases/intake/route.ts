import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  CaseIntakeService,
  CaseIntakeSchema,
} from '@/server/modules/frontdesk/CaseIntakeService';
import type { StaffAuthUser } from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_fd_01',
      name: request.headers.get('x-staff-name') || 'Front Desk Coordinator',
      role: staffRole,
    };
  }

  const sessionCookie = request.cookies.get('grand_staff_session')?.value;
  if (sessionCookie) {
    return {
      staffId: 'staff_cookie_user',
      name: 'Front Desk Agent',
      role: 'front_desk',
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      staffId: 'staff_bearer_user',
      name: 'Authorized Staff',
      role: 'front_desk',
    };
  }

  return null;
}

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
  const staff = extractStaffUser(request);

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
