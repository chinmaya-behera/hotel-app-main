import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { HelpCenterService } from '@/server/modules/guest/help/HelpCenterService';

export const runtime = 'nodejs';

const ResolveQuestionSchema = z.object({
  question: z.string().min(1, 'Question text cannot be empty').max(500, 'Question too long').trim(),
  currentNodeId: z.string().optional(),
  language: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        sender: z.enum(['user', 'bot']),
        text: z.string(),
      }),
    )
    .optional(),
});

/**
 * POST /api/v1/guest/help/resolve
 * Resolves natural language guest questions with Gemini AI function calling or local grounded retrieval.
 * Securely enforces guest session cookie verification.
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

  const parsed = ResolveQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid question parameters.',
          details: parsed.error.issues,
          traceId,
        },
      },
      { status: 400 },
    );
  }

  try {
    // 1. Secure session cookie extraction
    const sessionCookie = request.cookies.get('grand_guest_session')?.value;

    // 2. Resolve question via Hybrid Grounded Service (Gemini AI + Local Fallback)
    const service = new HelpCenterService();
    const result = await service.resolveQuestionAsync(
      parsed.data.question,
      parsed.data.currentNodeId,
      {
        sessionToken: sessionCookie,
        language: parsed.data.language,
        conversationHistory: parsed.data.conversationHistory,
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        traceId,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RESOLVE_ERROR',
          message: err?.message || 'Failed to process question.',
          traceId,
        },
      },
      { status: 500 },
    );
  }
}
