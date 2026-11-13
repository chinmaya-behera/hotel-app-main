import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { HelpCenterService } from '@/server/modules/guest/help/HelpCenterService';

export const runtime = 'nodejs';

const FeedbackSchema = z.object({
  flowId: z.string().optional(),
  query: z.string().optional(),
  helpful: z.boolean(),
  comment: z.string().max(500).optional(),
});

/**
 * POST /api/v1/guest/help/feedback
 * Records guest feedback on helpfulness of support responses.
 */
export async function POST(request: NextRequest) {
  const traceId = `req_${crypto.randomUUID()}`;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'The request body must be valid JSON.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid feedback parameters.',
          details: parsed.error.issues,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  try {
    const service = new HelpCenterService();
    const result = service.submitFeedback(parsed.data);

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        message: result.message,
        traceId,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FEEDBACK_ERROR',
          message: err?.message || 'Failed to submit feedback.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
