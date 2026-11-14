import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FulfillerService,
} from '@/server/modules/fulfiller/FulfillerService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/fulfiller/tasks/:id/start
 *
 * Commence work on task (transitions to IN_PROGRESS) via Dev 2 task lifecycle (DEV3-TASK-16).
 */
export async function POST(
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
  const result = await service.startTask(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'START_FAILED',
          message: result.error?.message || 'Failed to start task.',
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
