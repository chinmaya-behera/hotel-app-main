import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FulfillerService,
  TaskFilterQuerySchema,
} from '@/server/modules/fulfiller/FulfillerService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/fulfiller/tasks
 *
 * Query tasks assigned to the currently authenticated fulfiller (DEV3-TASK-15).
 * Supports filtering by status, priority, category, date, sorting, pagination,
 * and returns dynamic status counts derived from canonical task records.
 */
export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;
  const rawQuery = {
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || undefined,
    category: searchParams.get('category') || undefined,
    date: searchParams.get('date') || undefined,
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 20,
    sortBy: searchParams.get('sortBy') || 'assignedAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  };

  const parsedQuery = TaskFilterQuerySchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Invalid task filter parameters.',
          details: parsedQuery.error.issues.map((i) => ({ field: i.path.join('.'), issue: i.message })),
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new FulfillerService();
  const result = await service.getMyTasks(staff, parsedQuery.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'TASKS_QUERY_FAILED',
          message: result.error?.message || 'Failed to query fulfiller tasks.',
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
        fulfillerId: staff.staffId,
        fulfillerName: staff.name,
        role: staff.role,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}
