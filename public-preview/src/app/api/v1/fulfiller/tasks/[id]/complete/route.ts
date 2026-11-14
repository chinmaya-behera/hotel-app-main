import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FulfillerService,
  CompleteTaskSchema,
  type StaffAuthUser,
} from '@/server/modules/fulfiller/FulfillerService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'EMP-0103',
      name: request.headers.get('x-staff-name') || 'Vikram Singh',
      role: staffRole,
      department: request.headers.get('x-staff-department') || undefined,
    };
  }

  const sessionCookie = request.cookies.get('grand_staff_session')?.value;
  if (sessionCookie) {
    return {
      staffId: 'EMP-0103',
      name: 'Vikram Singh',
      role: 'task_fulfiller',
      department: 'Housekeeping',
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      staffId: 'EMP-0103',
      name: 'Vikram Singh',
      role: 'task_fulfiller',
      department: 'Housekeeping',
    };
  }

  return null;
}

/**
 * POST /api/v1/fulfiller/tasks/:id/complete
 *
 * Submit task completion with completion notes and photographic evidence (DEV3-TASK-16).
 * Enforces Mandatory Checklist Guard: All required checklist items must be complete.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const traceId = `req_${crypto.randomUUID()}`;
  const staff = extractStaffUser(request);

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
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
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

  const validation = CompleteTaskSchema.safeParse(body);
  if (!validation.success) {
    const details = validation.error.issues.map((i) => ({
      field: i.path.join('.'),
      issue: i.message,
    }));

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid task completion payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new FulfillerService();
  const result = await service.completeTask(staff, id, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'COMPLETE_FAILED',
          message: result.error?.message || 'Failed to complete task.',
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
    { status: 200 },
  );
}
