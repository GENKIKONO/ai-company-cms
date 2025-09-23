import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAuthLink } from '@/lib/auth/generate-link';
import { sendHtmlEmail } from '@/lib/email/resend-client';
import { logger, createRequestContext } from '@/lib/utils/logger';

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
  RESEND_SEND_FAILED: 'resend_send_failed',
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
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const requestContext = createRequestContext(request, { requestId });
  
  // Log incoming request
  logger.apiRequest(requestContext);
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = ResendConfirmationSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      logger.validationError(validationErrors, {
        ...requestContext,
        errors: validationErrors
      });

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
      
      logger.rateLimitHit({
        ...requestContext,
        email,
        retryAfter
      });

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

    logger.info('Resend confirmation request received', {
      ...requestContext,
      email,
      type
    });

    // Step 1: Generate auth link via Supabase Admin API
    let linkResult;
    try {
      linkResult = await generateAuthLink({
        email,
        type,
        requestId
      });
    } catch (linkError) {
      const errorMessage = linkError instanceof Error ? linkError.message : 'Unknown error';
      
      logger.authLinkFailed(errorMessage, {
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
      logger.authLinkFailed(linkResult.error || 'Failed to generate confirmation link', {
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

    // Step 2: Send email via Resend
    const emailSubject = type === 'signup' 
      ? 'アカウント登録の確認'
      : 'ログイン確認';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${emailSubject}</h2>
        <p>以下のボタンをクリックして${type === 'signup' ? 'アカウント登録を完了' : 'ログイン'}してください：</p>
        <div style="margin: 30px 0;">
          <a href="${linkResult.url}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${type === 'signup' ? '登録を完了する' : 'ログインする'}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          このリンクは24時間有効です。<br>
          もしボタンが機能しない場合は、以下のURLを直接ブラウザにコピー＆ペーストしてください：<br>
          <span style="word-break: break-all;">${linkResult.url}</span>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          このメールに心当たりがない場合は、このメールを無視してください。
          <br>Request ID: ${requestId}
        </p>
      </div>
    `;

    let emailResult;
    try {
      emailResult = await sendHtmlEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        requestId
      });
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
      
      logger.emailFailed(errorMessage, {
        ...requestContext,
        email,
        type,
        provider: 'resend',
        error: emailError
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Email service unavailable',
          code: ERROR_CODES.RESEND_SEND_FAILED,
          requestId
        },
        { status: 424 } // Failed Dependency
      );
    }

    if (!emailResult.success) {
      logger.emailFailed(emailResult.error || 'Failed to send confirmation email', {
        ...requestContext,
        email,
        type,
        provider: 'resend',
        error: emailResult.error
      });

      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send confirmation email',
          code: ERROR_CODES.RESEND_SEND_FAILED,
          requestId
        },
        { status: 424 } // Failed Dependency
      );
    }

    logger.emailSent({
      ...requestContext,
      email,
      type,
      messageId: emailResult.messageId,
      provider: 'resend'
    });

    return NextResponse.json({
      success: true,
      message: '確認メールを再送信しました',
      provider: 'resend',
      requestId,
      messageId: emailResult.messageId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(errorMessage, {
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