import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  RoomReadinessService,
  UpdateRoomReadinessSchema,
  type RoomReadinessQueryFilters,
} from '@/server/modules/frontdesk/RoomReadinessService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/readiness
 *
 * Front Desk Room Readiness Board Query (F21).
 * Query parameters:
 *   - floor: floor number filter
 *   - readiness: cleanliness filter ('dirty' | 'cleaning' | 'inspection_pending' | 'inspected' | 'ready' | 'out_of_order')
 *   - occupancy: occupancy filter ('occupied' | 'vacant')
 *   - search: room number / type / guest search
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
  const filters: RoomReadinessQueryFilters = {
    floor: searchParams.get('floor') || undefined,
    readiness: (searchParams.get('readiness') as RoomReadinessQueryFilters['readiness']) || undefined,
    occupancy: (searchParams.get('occupancy') as RoomReadinessQueryFilters['occupancy']) || undefined,
    search: searchParams.get('search') || undefined,
  };

  const service = new RoomReadinessService();
  const result = await service.getReadinessBoard(staff, filters);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'READINESS_QUERY_FAILED',
          message: result.error?.message || 'Failed to query room readiness board.',
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
        total: result.data.counts.total,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}

/**
 * PATCH /api/v1/frontdesk/readiness
 *
 * Cleanliness & Inspection Status Synchronization (F21).
 * Synchronizes room cleanliness with Developer 2's inspection contract.
 * Front Desk can mark dirty or cleaning; supervisor role required to mark ready.
 */
export async function PATCH(request: NextRequest) {
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

  const validation = UpdateRoomReadinessSchema.safeParse(body);
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
          message: 'Invalid room readiness payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new RoomReadinessService();
  const result = await service.updateReadiness(staff, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'READINESS_UPDATE_FAILED',
          message: result.error?.message || 'Failed to update room readiness.',
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
