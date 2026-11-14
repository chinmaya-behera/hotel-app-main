import { NextRequest, NextResponse } from 'next/server';
import { RefundService } from '@/server/modules/finance/refunds/RefundService';
import type { StaffAuthUser } from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_gm_01',
      name: request.headers.get('x-staff-name') || 'General Manager',
      role: staffRole,
    };
  }

  const sessionCookie = request.cookies.get('grand_staff_session')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
      if (parsed.role) {
        return {
          staffId: parsed.staffId || 'staff_cookie_gm',
          name: parsed.name || 'General Manager',
          role: parsed.role,
        };
      }
    } catch {
      return {
        staffId: 'staff_cookie_gm',
        name: 'General Manager',
        role: 'general_manager',
      };
    }
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      staffId: 'staff_bearer_gm',
      name: 'General Manager',
      role: 'general_manager',
    };
  }

  return null;
}

/**
 * GET /api/v1/gm/refund-approvals
 * Returns the queue of refunds pending General Manager approval
 */
export async function GET(request: NextRequest) {
  const staffUser = extractStaffUser(request);
  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: General Manager or Duty Manager authorization required.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  const refundService = RefundService.getInstance();
  const result = await refundService.getPendingGmApprovals(staffUser);

  return NextResponse.json(
    {
      success: result.success,
      data: result.data,
      error: result.error,
    },
    { status: result.statusCode }
  );
}
