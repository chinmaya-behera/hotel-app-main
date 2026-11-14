import { NextRequest, NextResponse } from 'next/server';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';
import type { StaffAuthUser } from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_fin_01',
      name: request.headers.get('x-staff-name') || 'Finance Officer',
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
          name: parsed.name || 'Finance Officer',
          role: parsed.role,
        };
      }
    } catch {
      return {
        staffId: 'staff_cookie_user',
        name: 'Finance Officer',
        role: 'finance_officer',
      };
    }
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      staffId: 'staff_bearer_user',
      name: 'Authorized Staff',
      role: 'finance_officer',
    };
  }

  return null;
}

/**
 * GET /api/v1/finance/refunds/:id/status
 * Queries execution status and reconciles with payment gateway
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const staffUser = extractStaffUser(request);
  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Staff credentials required.',
        code: 'UNAUTHORIZED_STAFF',
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const refundService = RefundService.getInstance();
  const result = await refundService.getRefundStatus(id, staffUser);

  return NextResponse.json(
    {
      success: result.success,
      data: result.data,
      error: result.error,
    },
    { status: result.statusCode }
  );
}
