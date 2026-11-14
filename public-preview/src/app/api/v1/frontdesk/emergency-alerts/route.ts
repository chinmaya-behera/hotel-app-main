import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  EmergencyAlertService,
  CreateEmergencyAlertSchema,
} from '@/server/modules/frontdesk/EmergencyAlertService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/frontdesk/emergency-alerts
 *
 * Query emergency alerts with status, severity, and type filters (F38-BC).
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
