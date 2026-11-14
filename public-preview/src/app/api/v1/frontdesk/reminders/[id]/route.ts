import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  GuestReminderService,
  UpdateGuestReminderSchema,
} from '@/server/modules/frontdesk/GuestReminderService';
import { getGuestReminderRepository } from '@/server/modules/frontdesk/repositories/GuestReminderRepository';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/reminders/:id
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

  const repo = getGuestReminderRepository();
  const reminder = await repo.getReminderById(id);

  if (!reminder) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REMINDER_NOT_FOUND',
          message: `Guest reminder with ID '${id}' was not found.`,
          traceId,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: reminder,
    },
    { status: 200 },
  );
}

/**
 * PATCH /api/v1/frontdesk/reminders/:id
 *
 * Acknowledge, snooze, complete, cancel, or edit an existing reminder.
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
  const result = await service.updateReminderAction(staff, id, validation.data);

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

/**
 * DELETE /api/v1/frontdesk/reminders/:id
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

  const service = new GuestReminderService();
  const result = await service.deleteReminder(staff, id);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'REMINDER_DELETE_FAILED',
          message: result.error?.message || 'Failed to delete reminder.',
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: `Reminder ${id} was deleted successfully.`,
    },
    { status: 200 },
  );
}
