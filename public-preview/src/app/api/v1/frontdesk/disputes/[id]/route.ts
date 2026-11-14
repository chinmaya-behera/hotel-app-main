import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { FinancialDisputeService } from '@/server/modules/finance/disputes/FinancialDisputeService';
import type { StaffAuthUser } from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_fd_01',
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
 * GET /api/v1/frontdesk/disputes/:id
 * Retrieves full details of a financial dispute for Front Desk staff including private internal notes.
 */
export async function GET(
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
          message: 'Staff authentication required.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const service = FinancialDisputeService.getInstance();
  const result = await service.getFrontDeskDisputeById(id, staff);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: result.error || 'Dispute not found.',
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
        traceId,
      },
    },
    { status: 200 },
  );
}
