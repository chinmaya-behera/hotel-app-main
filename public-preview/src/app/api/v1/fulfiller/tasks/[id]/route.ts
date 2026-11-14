import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FulfillerService,
} from '@/server/modules/fulfiller/FulfillerService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/fulfiller/tasks/:id
 *
 * Retrieve full task details, checklists, and event timeline for authenticated fulfiller (DEV3-TASK-15).
 * Prevents unauthorized cross-staff or cross-department access.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const traceId = `req_${crypto.randomUUID()}`;
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

  const service = new FulfillerService();
  const result = await service.getTaskById(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'TASK_NOT_FOUND',
          message: result.error?.message || 'Task not found.',
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
