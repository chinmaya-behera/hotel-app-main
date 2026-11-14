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
 * POST /api/v1/fulfiller/tasks/:id/accept
 *
 * Accept an assigned task via Developer 2 canonical task lifecycle (DEV3-TASK-16).
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
  const result = await service.acceptTask(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'ACCEPT_FAILED',
          message: result.error?.message || 'Failed to accept task.',
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
