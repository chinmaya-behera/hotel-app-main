import { NextResponse } from 'next/server';
import { HelpCenterService } from '@/server/modules/guest/help/HelpCenterService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/guest/help/topics
 * Returns the primary support topics and categories available to hotel guests.
 */
export async function GET() {
  const service = new HelpCenterService();
  const topics = service.getTopics();
  const botConfig = service.getBotConfig();

  return NextResponse.json({
    success: true,
    data: {
      topics,
      count: topics.length,
      botConfig,
    },
  });
}
