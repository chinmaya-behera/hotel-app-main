import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FulfillerService,
  ChecklistUpdateSchema,
} from '@/server/modules/fulfiller/FulfillerService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/fulfiller/tasks/:id/checklist
 *
 * Retrieve checklist items and completion states for a task (DEV3-TASK-16).
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
  const result = await service.getChecklist(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'CHECKLIST_QUERY_FAILED',
          message: result.error?.message || 'Failed to retrieve task checklist.',
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

/**
 * PATCH /api/v1/fulfiller/tasks/:id/checklist
 *
 * Update checklist item completion responses with timestamps and actor information (DEV3-TASK-16).
 */
export async function PATCH(
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

  const validation = ChecklistUpdateSchema.safeParse(body);
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
          message: 'Invalid checklist update payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new FulfillerService();
  const result = await service.updateChecklist(staff, id, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'CHECKLIST_UPDATE_FAILED',
          message: result.error?.message || 'Failed to update task checklist.',
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
