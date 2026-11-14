import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { PmsReconciliationService } from '@/server/modules/integrations/pms/PmsReconciliationService';
import type { StaffAuthUser } from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_01',
      name: request.headers.get('x-staff-name') || 'Front Desk Staff',
      role: staffRole,
    };
  }

  const sessionCookie = request.cookies.get('grand_staff_session')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
      if (parsed.role) {
        return {
          staffId: parsed.staffId || 'staff_cookie_user',
          name: parsed.name || 'Front Desk Agent',
          role: parsed.role,
        };
      }
    } catch {
      return {
        staffId: 'staff_cookie_user',
        name: 'Front Desk Agent',
        role: 'front_desk',
      };
    }
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
 * POST /api/v1/integrations/pms/reconciliation/:id/retry
 * Re-attempts synchronization for a reconciliation discrepancy with PMS.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const { id } = await params;
  const staff = extractStaffUser(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required to retry reconciliation.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  try {
    const service = PmsReconciliationService.getInstance();
    const result = await service.retryReconciliation(id, staff);

    return NextResponse.json(
      {
        success: result.success,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          traceId,
        },
      },
      { status: result.success ? 200 : (result.error === 'NOT_FOUND' ? 404 : 503) },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RETRY_ERROR',
          message: err.message || 'An unexpected error occurred during retry.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
