import type { NextRequest } from 'next/server';
import { authError, authResult } from '@/server/auth/http';
import { authenticateStaff } from '@/server/auth/request';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const staff = await authenticateStaff(request);
    return staff ? authResult(staff) : authError(401, 'Staff authentication required.');
  } catch {
    return authError(503, 'Staff session is unavailable.');
  }
}
