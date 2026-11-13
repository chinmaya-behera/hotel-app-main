import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { EmergencyAlertService } from '@/server/modules/frontdesk/EmergencyAlertService';
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
