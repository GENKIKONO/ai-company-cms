import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAuthLink } from '@/lib/auth/generate-link';

// Request validation schema
const ResendConfirmationSchema = z.object({
  email: z.string().email('Invalid email format'),
  type: z.enum(['signup', 'magiclink']).optional().default('signup')
});

// Error codes for machine-readable responses
const ERROR_CODES = {
  INVALID_EMAIL: 'invalid_email',
  VALIDATION_ERROR: 'validation_error',
  GENERATE_LINK_FAILED: 'generate_link_failed',
  RATE_LIMITED: 'rate_limited',
  INTERNAL_ERROR: 'internal_error'
} as const;

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per minute per email

function checkRateLimit(email: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = `resend_${email}`;
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: existing.resetTime };
  }

  existing.count++;
  return { allowed: true };
}

function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`
    : username;
  return `${maskedUsername}@${domain}`;
}

export async function POST(request: NextRequest) {
  // Production safety guard - check APP_URL constant via import
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
    return NextResponse.json(
      { error: 'Configuration error - localhost detected in production', code: 'config_error' },
      { status: 500 }
    );
  }

  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const requestContext = { 
    requestId,
    endpoint: new URL(request.url).pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  };
  
  // Log incoming request
  console.log('[API Request]', requestContext);
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = ResendConfirmationSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      console.warn('[Validation Error]', validationErrors, { ...requestContext, errors: validationErrors });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          code: ERROR_CODES.VALIDATION_ERROR,
          details: validationErrors,
          requestId 
        },
        { status: 400 }
      );
    }

    const { email, type } = validationResult.data;
    const maskedEmailForLogs = maskEmail(email);

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      const retryAfter = Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000);
      
      console.warn('[Rate Limit Hit]', { ...requestContext, email, retryAfter });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: ERROR_CODES.RATE_LIMITED,
          retryAfter,
          requestId
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    console.log('[Resend Confirmation Request]', { ...requestContext, email, type });

    // Generate auth link via Supabase Admin API
    // This will automatically trigger Supabase's built-in email delivery
    let linkResult;
    try {
      linkResult = await generateAuthLink({
        email,
        type,
        requestId
      });
    } catch (linkError) {
      const errorMessage = linkError instanceof Error ? linkError.message : 'Unknown error';
      
      console.error('[Auth Link Failed]', errorMessage, {
        ...requestContext,
        email,
        type,
        provider: 'supabase',
        error: linkError
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Supabase service unavailable',
          code: ERROR_CODES.GENERATE_LINK_FAILED,
          requestId
        },
        { status: 424 } // Failed Dependency
      );
    }

    if (!linkResult.success || !linkResult.url) {
      console.error('[Auth Link Failed]', linkResult.error || 'Failed to generate confirmation link', {
        ...requestContext,
        email,
        type,
        provider: 'supabase',
        error: linkResult.error
      });

      return NextResponse.json(
        {
          success: false,
          error: linkResult.error || 'Failed to generate confirmation link',
          code: ERROR_CODES.GENERATE_LINK_FAILED,
          requestId
        },
        { status: 424 } // Failed Dependency
      );
    }

    // Note: Supabase will handle email delivery automatically
    // We no longer use Resend for auth emails
    console.log('[Email Sent]', {
      ...requestContext,
      email,
      type,
      provider: 'supabase-builtin'
    });

    return NextResponse.json({
      success: true,
      message: '確認メールを再送信しました',
      provider: 'supabase',
      requestId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Internal Error]', errorMessage, {
      ...requestContext,
      error,
      stack: errorStack
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: ERROR_CODES.INTERNAL_ERROR,
        requestId
      },
      { status: 500 }
    );
  }
}