import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { HelpCenterService } from '@/server/modules/guest/help/HelpCenterService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/guest/help/flows/:nodeId
 * Returns the details, guidance message, options, and direct action for a specific flow node.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const { nodeId } = await params;
  const traceId = `req_${crypto.randomUUID()}`;

  try {
    const service = new HelpCenterService();
    const node = service.getFlowNode(nodeId);

    return NextResponse.json({
      success: true,
      data: {
        node,
        traceId,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FLOW_LOOKUP_ERROR',
          message: err?.message || 'Failed to retrieve flow node.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
