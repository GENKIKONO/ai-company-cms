import crypto from 'crypto';

import { logger } from '@/lib/log';
import { sendCriticalAlert } from '@/lib/ops/alert';
interface LogContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  path: string;
  method: string;
  [key: string]: any;
}

interface PIIFields {
  email?: string;
  phone?: string;
  ssn?: string;
  creditCard?: string;
  [key: string]: any;
}

export function logSecurityEvent(
  level: 'info' | 'warn' | 'error' | 'critical',
  message: string,
  context: LogContext,
  piiData?: PIIFields
): void {
  const timestamp = new Date().toISOString();
  
  // PII マスキング
  const maskedPII = piiData ? maskPII(piiData) : undefined;
  
  // 構造化ログ
  const logEntry = {
    timestamp,
    level,
    message: sanitizeLogMessage(message),
    context: sanitizeContext(context),
    pii: maskedPII,
    traceId: generateTraceId()
  };

  // コンソール出力（本番では外部ログサービス推奨）
  logger.info(JSON.stringify(logEntry));

  // 重大イベントは即座にアラート
  if (level === 'critical') {
    sendCriticalAlert(message, {
      component: 'security',
      severity: 'critical',
      ...context,
      pii: maskedPII
    });
  }
}

function maskPII(data: PIIFields): Record<string, string> {
  const masked: Record<string, string> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      masked[key] = '[NON_STRING_VALUE]';
      return;
    }

    switch (key) {
      case 'email':
        masked[key] = maskEmail(value);
        break;
      case 'phone':
        masked[key] = maskPhone(value);
        break;
      case 'creditCard':
        masked[key] = maskCreditCard(value);
        break;
      case 'ssn':
        masked[key] = '[MASKED_SSN]';
        break;
      default:
        // 一般的なマスキング（中央部を隠す）
        if (value.length > 6) {
          masked[key] = value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
        } else {
          masked[key] = '*'.repeat(value.length);
        }
    }
  });

  return masked;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '[INVALID_EMAIL]';
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local.slice(-1)
    : '*'.repeat(local.length);
    
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '[INVALID_PHONE]';
  
  return digits.slice(0, 3) + '*'.repeat(digits.length - 6) + digits.slice(-3);
}

function maskCreditCard(card: string): string {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 12) return '[INVALID_CARD]';
  
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

function sanitizeLogMessage(message: string): string {
  // ログインジェクション防止
  return message
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .substring(0, 1000);
}

function sanitizeContext(context: LogContext): LogContext {
  const sanitized = { ...context };
  
  // 危険なフィールドを除外
  const dangerousFields = ['password', 'token', 'secret', 'key'];
  dangerousFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function generateTraceId(): string {
  return crypto.randomBytes(8).toString('hex');
}


// 統一エラーレスポンス
export function createSafeErrorResponse(
  error: Error,
  context: LogContext
): { message: string; code: string } {
  // 詳細エラーはログに記録
  logSecurityEvent('error', error.message, context, {
    stack: error.stack,
    name: error.name
  });

  // 外部には一律メッセージ
  const safeMessages: Record<string, string> = {
    'Authentication required': 'Please sign in to continue',
    'Admin permission required': 'Insufficient permissions',
    'Database error': 'Service temporarily unavailable',
    'Invalid signature': 'Request authentication failed',
    'Rate limit exceeded': 'Too many requests, please try again later'
  };

  const safeMessage = safeMessages[error.message] || 'An error occurred';
  
  return {
    message: safeMessage,
    code: 'GENERIC_ERROR'
  };
}