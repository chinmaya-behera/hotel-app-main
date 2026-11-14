import { authenticateStaff } from '@/server/auth/request';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { EmergencyAlertService } from '@/server/modules/frontdesk/EmergencyAlertService';

export const runtime = 'nodejs';

/**
 * POST /api/v1/frontdesk/emergency-alerts/:id/activate
 *
 * Explicit activation of emergency alert (F38-BC).
 * Safety invariant: Alerts start in DRAFT and require explicit authorized activation.
 * Under mock/Sprint-0, delivery is explicitly reported as simulated.
 */
export async function POST(
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

  const service = new EmergencyAlertService();
  const result = await service.activateAlert(staff, id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'ACTIVATION_FAILED',
          message: result.error?.message || 'Failed to activate emergency alert.',
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
        broadcastDeliveryStatus: result.data.broadcastDeliveryStatus,
        activatedRecipientsCount: result.data.targetRecipientCount,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}
