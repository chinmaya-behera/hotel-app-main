import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  GuestReminderService,
  CreateGuestReminderSchema,
  UpdateGuestReminderSchema,
} from '@/server/modules/frontdesk/GuestReminderService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/reminders
 *
 * Query guest wake-up calls, alarms, and service reminders (F30).
 * Query parameters:
 *   - roomNumber: filter by room number
 *   - status: 'all' | 'pending' | 'acknowledged' | 'snoozed' | 'completed' | 'cancelled'
 *   - tab: 'all' | 'upcoming' | 'overdue' | 'completed' | 'ringing'
 *   - search: text query
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
    roomNumber: searchParams.get('roomNumber') || undefined,
    status: searchParams.get('status') || undefined,
    tab: searchParams.get('tab') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const service = new GuestReminderService();
  const result = await service.getReminders(staff, filters);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'REMINDERS_QUERY_FAILED',
          message: result.error?.message || 'Failed to query guest reminders.',
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
 * POST /api/v1/frontdesk/reminders
 *
 * Schedule a new guest wake-up call, alarm, or service reminder (F30).
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

  const validation = CreateGuestReminderSchema.safeParse(body);
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
          message: 'Invalid reminder request payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new GuestReminderService();
  const result = await service.createReminder(staff, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'REMINDER_CREATE_FAILED',
          message: result.error?.message || 'Failed to create guest reminder.',
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
    { status: 201 },
  );
}

/**
 * PATCH /api/v1/frontdesk/reminders
 *
 * Update or execute action on a reminder when reminderId is in the body.
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

  let body: any;
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

  const reminderId = body?.reminderId || body?.id;
  if (!reminderId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_REMINDER_ID',
          message: 'reminderId is required in the body for batch PATCH endpoint.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const validation = UpdateGuestReminderSchema.safeParse(body);
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
          message: 'Invalid reminder update payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new GuestReminderService();
  const result = await service.updateReminderAction(staff, reminderId, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'REMINDER_UPDATE_FAILED',
          message: result.error?.message || 'Failed to update reminder.',
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
