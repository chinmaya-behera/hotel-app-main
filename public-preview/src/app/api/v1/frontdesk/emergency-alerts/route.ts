import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  EmergencyAlertService,
  CreateEmergencyAlertSchema,
} from '@/server/modules/frontdesk/EmergencyAlertService';
import type { StaffAuthUser } from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_fd_01',
      name: request.headers.get('x-staff-name') || 'Front Desk Coordinator',
      role: staffRole,
    };
  }

  const sessionCookie = request.cookies.get('grand_staff_session')?.value;
  if (sessionCookie) {
    return {
      staffId: 'staff_cookie_user',
      name: 'Front Desk Agent',
      role: 'front_desk',
    };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      staffId: 'staff_bearer_user',
      name: 'Authorized Staff',
      role: 'front_desk',
    };
  }

  return null;
}

/**
 * GET /api/v1/frontdesk/emergency-alerts
 *
 * Query emergency alerts with status, severity, and type filters (F38-BC).
 */
export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;
  const filters = {
    status: searchParams.get('status') || undefined,
    alertType: searchParams.get('alertType') || undefined,
    severity: searchParams.get('severity') || undefined,
  };

  const service = new EmergencyAlertService();
  const result = await service.getAlerts(staff, filters);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'EMERGENCY_ALERTS_QUERY_FAILED',
          message: result.error?.message || 'Failed to query emergency alerts.',
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
 * POST /api/v1/frontdesk/emergency-alerts
 *
 * Create a DRAFT emergency alert.
 * Safety Invariant: Drafting an alert does NOT activate or broadcast it.
 */
export async function POST(request: NextRequest) {
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

  const validation = CreateEmergencyAlertSchema.safeParse(body);
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
          message: 'Invalid emergency alert draft payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new EmergencyAlertService();
  const result = await service.createDraftAlert(staff, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'DRAFT_CREATION_FAILED',
          message: result.error?.message || 'Failed to create emergency alert draft.',
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
