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
 * GET /api/v1/frontdesk/disputes
 * Front Desk financial dispute queue with status/category filters, search, and queue counts.
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const staff = extractStaffUser(request);

  if (!staff) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Staff authentication required to view dispute triage queue.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const stayId = searchParams.get('stayId') || undefined;
  const roomNumber = searchParams.get('roomNumber') || undefined;
  const search = searchParams.get('search') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const service = FinancialDisputeService.getInstance();
  const result = await service.getFrontDeskDisputes(
    { status, category, stayId, roomNumber, search, dateFrom, dateTo },
    staff,
  );

  return NextResponse.json(
    {
      success: true,
      data: {
        disputes: result.data,
        counts: result.counts,
      },
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
      },
    },
    { status: 200 },
  );
}
