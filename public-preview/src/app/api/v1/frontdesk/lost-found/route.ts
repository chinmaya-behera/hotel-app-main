import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  LostFoundService,
  CreateLostFoundItemSchema,
} from '@/server/modules/frontdesk/LostFoundService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/lost-found
 *
 * Searchable, filterable, paginated Lost & Found registry (F29-LF).
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
  const filters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    status: searchParams.get('status') || undefined,
    roomNumber: searchParams.get('roomNumber') || undefined,
    foundLocation: searchParams.get('foundLocation') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
  };

  const service = new LostFoundService();
  const result = await service.getItems(staff, filters);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'LOST_FOUND_QUERY_FAILED',
          message: result.error?.message || 'Failed to query Lost & Found items.',
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
        total: result.data.total,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}

/**
 * POST /api/v1/frontdesk/lost-found
 *
 * Register a newly found item in hotel premises.
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

  const validation = CreateLostFoundItemSchema.safeParse(body);
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
          message: 'Invalid Lost & Found registration payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const idempotencyHeader = request.headers.get('idempotency-key') || undefined;

  const service = new LostFoundService();
  const result = await service.registerItem(staff, validation.data, idempotencyHeader);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'LOST_FOUND_CREATE_FAILED',
          message: result.error?.message || 'Failed to register item.',
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
