import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  FinancialDisputeService,
  DisputeSubmissionSchema,
} from '@/server/modules/finance/disputes/FinancialDisputeService';

export const runtime = 'nodejs';

function extractGuestSessionToken(request: NextRequest): string | undefined {
  let sessionToken = request.cookies.get('grand_guest_session')?.value;
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }
  return sessionToken;
}

/**
 * POST /api/v1/guest/disputes
 * Submits a new financial dispute anchored strictly to the guest's authenticated stay.
 */
export async function POST(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const sessionToken = extractGuestSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active guest session is required to file a billing dispute.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Malformed JSON payload in request body.',
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const parseResult = DisputeSubmissionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || 'Invalid dispute submission.',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            issue: e.message,
          })),
          traceId,
        },
      },
      { status: 400 },
    );
  }

  const service = FinancialDisputeService.getInstance();
  const result = await service.createGuestDispute(parseResult.data, sessionToken);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DISPUTE_SUBMISSION_FAILED',
          message: result.error || 'Failed to submit dispute.',
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
    { status: result.statusCode },
  );
}

/**
 * GET /api/v1/guest/disputes
 * Lists all billing disputes filed by the currently authenticated stay (internal notes stripped).
 */
export async function GET(request: NextRequest) {
  const traceId = `trace_${crypto.randomUUID()}`;
  const sessionToken = extractGuestSessionToken(request);

  if (!sessionToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Active guest session is required.',
          traceId,
        },
      },
      { status: 401 },
    );
  }

  const service = FinancialDisputeService.getInstance();
  const result = await service.getGuestDisputes(sessionToken);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: result.error || 'Failed to retrieve disputes.',
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
    { status: result.statusCode },
  );
}
