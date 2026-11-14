import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FulfillerService,
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
 * POST /api/v1/fulfiller/tasks/:id/resume
 *
 * Resume work on a blocked task (transitions back to IN_PROGRESS) (DEV3-TASK-16).
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

  const service = new FulfillerService();
  const result = await service.resumeTask(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'RESUME_FAILED',
          message: result.error?.message || 'Failed to resume task.',
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
