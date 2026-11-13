import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { RoomDiscoveryService } from '@/server/modules/public/RoomDiscoveryService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/rooms
 *
 * Public Room Discovery API.
 * Supports filtering by dates (checkIn, checkOut), guest capacity (guests), and roomType.
 * Returns public room projections without staff or guest-identifying information.
 */
export async function GET(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;
  const searchParams = request.nextUrl.searchParams;

  const query = {
    checkIn: searchParams.get('checkIn') || undefined,
    checkOut: searchParams.get('checkOut') || undefined,
    guests: searchParams.get('guests') || undefined,
    roomType: searchParams.get('roomType') || undefined,
  };

  const service = new RoomDiscoveryService();
  const result = await service.searchRooms(query);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.error?.code || 'ROOM_SEARCH_FAILED',
          message: result.error?.message || 'Failed to search rooms.',
          details: result.error?.details,
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
        total: result.data.totalCount,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}
