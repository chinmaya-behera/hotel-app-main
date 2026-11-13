import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  EmergencyAlertService,
  AcknowledgeAlertSchema,
} from '@/server/modules/frontdesk/EmergencyAlertService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/frontdesk/emergency-alerts/:id/acknowledge
 *
 * Record receipt and acknowledgement of an active emergency alert (F38-BC).
 * Accessible by targeted in-house guests and hotel staff.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const traceId = `req_${crypto.randomUUID()}`;

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

  const validation = AcknowledgeAlertSchema.safeParse(body);
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
          message: 'Invalid acknowledgement payload.',
          details,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = new EmergencyAlertService();
  const result = await service.acknowledgeAlert(id, validation.data);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'ACKNOWLEDGEMENT_FAILED',
          message: result.error?.message || 'Failed to acknowledge alert.',
          traceId,
        },
      },
      { status: result.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        alertId: result.data.id,
        ref: result.data.ref,
        status: result.data.status,
        acknowledgementCount: result.data.acknowledgements.length,
        acknowledgedRecipient: validation.data,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}
