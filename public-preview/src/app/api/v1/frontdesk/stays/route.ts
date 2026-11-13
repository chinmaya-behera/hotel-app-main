import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FrontDeskStayService,
  type StaffAuthUser,
} from '@/server/modules/frontdesk/FrontDeskStayService';

export const runtime = 'nodejs';

function extractStaffUser(request: NextRequest): StaffAuthUser | null {
  // Check development / automation header
  const staffRole = request.headers.get('x-staff-role');
  if (staffRole) {
    return {
      staffId: request.headers.get('x-staff-id') || 'staff_dev_fd_01',
      name: request.headers.get('x-staff-name') || 'Front Desk Coordinator',
      role: staffRole,
    };
  }

  // Check HTTP-only session cookie 'grand_staff_session'
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
      // If plain token or invalid base64, assume default front_desk staff in prototype
      return {
        staffId: 'staff_cookie_user',
        name: 'Front Desk Agent',
        role: 'front_desk',
      };
    }
  }

  // Check Bearer authorization
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
 * GET /api/v1/frontdesk/stays
 *
 * Front Desk arrivals and stay management console query.
 * Query Parameters:
 *   - filter: 'all' | 'arrivals' | 'inhouse' | 'departures'
 *   - search: string (guest name, room number, or booking reference)
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
          message: 'Staff authentication required. Missing staff session.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const filter = (searchParams.get('filter') as 'all' | 'arrivals' | 'inhouse' | 'departures') || undefined;
  const search = searchParams.get('search') || undefined;

  const service = new FrontDeskStayService();
  const result = await service.getStays(staff, { filter, search });

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'STAYS_QUERY_FAILED',
          message: result.error?.message || 'Failed to retrieve stay list.',
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
