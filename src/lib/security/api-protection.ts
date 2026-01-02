import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

import { logger } from '@/lib/log';
interface ApiSecurityConfig {
  requireSignature?: boolean;
  maxBodySize?: number;
  allowedMethods?: string[];
  rateLimitKey?: string;
  requireCSRF?: boolean;
}

export function withApiSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: ApiSecurityConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(req.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // 2. Signature validation (サービスロール追加保護)
      if (config.requireSignature && !validateSignature(req)) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }

      // 3. Body size check
      const contentLength = req.headers.get('content-length');
      const maxSize = config.maxBodySize || 1024 * 1024; // 1MB default
      if (contentLength && parseInt(contentLength) > maxSize) {
        return NextResponse.json(
          { error: 'Payload too large' },
          { status: 413 }
        );
      }

      // 4. Execute handler
      return await handler(req);

    } catch (error) {
      logger.error('API Security Error:', { data: error });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

function validateSignature(req: NextRequest): boolean {
  const signature = req.headers.get('x-api-signature');
  const timestamp = req.headers.get('x-api-timestamp');
  const apiKey = req.headers.get('x-api-key');

  if (!signature || !timestamp || !apiKey) {
    return false;
  }

  // タイムスタンプ検証（5分以内）
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false;
  }

  // 署名検証
  const payload = `${req.method}:${req.url}:${timestamp}:${apiKey}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.API_SIGNATURE_SECRET || 'default')
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

// Zodスキーマバリデーション
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// =====================================================
// TYPE-SAFE REQUEST PARSING
// =====================================================

/** パース結果の型 */
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: 400 | 422 };

/**
 * NextRequest から JSON ボディを型安全にパース
 * @example
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = await parseRequestBody(request, schema);
 * if (!result.ok) {
 *   return NextResponse.json({ error: result.error }, { status: result.status });
 * }
 * const { name, age } = result.data; // 型安全
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T>> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return { ok: false, error: 'Invalid JSON body', status: 400 };
  }

  try {
    const data = schema.parse(rawBody);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { ok: false, error: messages.join('; '), status: 422 };
    }
    return { ok: false, error: 'Validation failed', status: 422 };
  }
}

/**
 * オプショナルなJSONボディをパース（ボディなしも許容）
 */
export async function parseOptionalBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T | null>> {
  const contentLength = request.headers.get('content-length');
  if (!contentLength || contentLength === '0') {
    return { ok: true, data: null };
  }

  return parseRequestBody(request, schema) as Promise<ParseResult<T | null>>;
}

/**
 * URLSearchParams を型安全にパース
 */
export function parseSearchParams<T>(
  params: URLSearchParams,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });

  try {
    const data = schema.parse(obj);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { ok: false, error: messages.join('; '), status: 422 };
    }
    return { ok: false, error: 'Invalid query parameters', status: 422 };
  }
}