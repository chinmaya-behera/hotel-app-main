import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  LostFoundService,
  UpdateLostFoundItemSchema,
} from '@/server/modules/frontdesk/LostFoundService';
import { getLostFoundRepository } from '@/server/modules/frontdesk/repositories/LostFoundRepository';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/lost-found/:id
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

  const service = new LostFoundService();
  const result = await service.getItemById(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'ITEM_NOT_FOUND',
          message: result.error?.message || 'Item not found.',
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
    },
    { status: 200 },
  );
}

/**
 * PATCH /api/v1/frontdesk/lost-found/:id
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

  const validation = UpdateLostFoundItemSchema.safeParse(body);
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
          message: 'Invalid update payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new LostFoundService();
  const result = await service.updateItem(staff, id, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'UPDATE_FAILED',
          message: result.error?.message || 'Failed to update item.',
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
 * DELETE /api/v1/frontdesk/lost-found/:id
 */
export async function DELETE(
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

  const repo = getLostFoundRepository();
  const deleted = await repo.deleteItem(id);

  if (!deleted) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Lost & Found record with ID '${id}' was not found.`,
          traceId,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: `Item ${id} was deleted successfully.`,
    },
    { status: 200 },
  );
}
