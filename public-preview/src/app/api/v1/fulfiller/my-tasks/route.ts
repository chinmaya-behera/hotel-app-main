import { NextRequest } from 'next/server';
import { GET as tasksGetHandler } from '../tasks/route';

export const runtime = 'nodejs';

/**
 * GET /api/v1/fulfiller/my-tasks
 *
 * Alias route for GET /api/v1/fulfiller/tasks (DEV3-TASK-15 specification).
 */
export async function GET(request: NextRequest) {
  return tasksGetHandler(request);
}
