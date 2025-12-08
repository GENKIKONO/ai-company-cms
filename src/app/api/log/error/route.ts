/**
 * Phase 4 - ErrorBoundary連携監視システム
 * AppErrorBoundaryからのエラーログ収集API
 * 
 * 🔍 【監視機能】グループ: ErrorBoundary監視システム
 * 📊 エンドポイント: POST /api/log/error - フロントエンドエラー自動収集
 * 🔧 関連ファイル:
 *   - src/components/common/AppErrorBoundary.tsx (エラー送信元)
 *   - src/components/admin/error-log-viewer.tsx (ログ表示画面)
 * ⚡ 機能: エラー重要度判定・分類・永続化・アラート
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/log';
import { AppError, ErrorType, ErrorSeverity } from '@/lib/error-handling';

// エラーログエントリの型定義
interface ErrorLogEntry {
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    componentStack?: string;
    name?: string;
  };
  context: {
    url: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
    component?: string;
  };
  severity: ErrorSeverity;
  type: ErrorType;
  buildInfo?: {
    version?: string;
    commit?: string;
  };
}

// エラーログ永続化関数（将来的にSupabaseやファイルシステムに保存）
async function persistErrorLog(errorEntry: ErrorLogEntry): Promise<void> {
  try {
    // 開発環境では詳細ログ出力
    if (process.env.NODE_ENV === 'development') {
      logger.error('Frontend Error Captured:', {
        message: errorEntry.error.message,
        component: errorEntry.context.component,
        url: errorEntry.context.url,
        timestamp: errorEntry.timestamp,
        severity: errorEntry.severity,
        stack: errorEntry.error.stack
      });
    }

    // 本番環境での永続化処理 - Sentryと簡易DB保存を実装
    if (process.env.NODE_ENV === 'production') {
      // Sentryにフロントエンドエラーを送信
      try {
        const { captureException } = await import('@/lib/utils/sentry-utils');
        const error = new Error(errorEntry.error.message);
        error.stack = errorEntry.error.stack;
        
        captureException(error, {
          frontend: {
            component: errorEntry.context.component,
            url: errorEntry.context.url,
            userAgent: errorEntry.context.userAgent,
            userId: errorEntry.context.userId,
          },
          severity: errorEntry.severity,
          timestamp: errorEntry.timestamp,
        });
      } catch (sentryError) {
        logger.error('Failed to send frontend error to Sentry:', sentryError);
      }

      // 高重要度エラーをaudit_logテーブルに保存
      if (errorEntry.severity === ErrorSeverity.CRITICAL || errorEntry.severity === ErrorSeverity.HIGH) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          await supabase.from('audit_log').insert({
            table_name: 'frontend_errors',
            operation: 'INSERT',
            record_id: crypto.randomUUID(),
            user_id: errorEntry.context.userId || null,
            new_values: {
              error: errorEntry.error,
              context: errorEntry.context,
              severity: errorEntry.severity,
              timestamp: errorEntry.timestamp,
            },
            changed_fields: ['error', 'context', 'severity'],
            ip_address: null, // フロントエンドからはIP不明
            user_agent: errorEntry.context.userAgent || null,
          });
        } catch (dbError) {
          logger.error('Failed to save frontend error to database:', dbError);
        }
      }
    }
    
    // 重要度の高いエラーは即座にアラート
    if (errorEntry.severity === ErrorSeverity.CRITICAL || 
        errorEntry.severity === ErrorSeverity.HIGH) {
      
      logger.error('HIGH PRIORITY FRONTEND ERROR', {
        ...errorEntry,
        alert: true
      });

      // 将来的なアラート通知（Slack, Discord, メール等）の実装ポイント
      logger.error('🚨 CRITICAL FRONTEND ERROR DETECTED:', {
        message: errorEntry.error.message,
        component: errorEntry.context.component,
        url: errorEntry.context.url
      });
    }

  } catch (persistError) {
    logger.error('Failed to persist error log:', { data: persistError });
  }
}

// エラーレベル判定関数
function determineErrorSeverity(error: any): ErrorSeverity {
  const message = error.message?.toLowerCase() || '';
  
  // ChunkLoadError, Network errors are typically medium severity
  if (message.includes('chunkloaderror') || 
      message.includes('loading chunk') ||
      message.includes('network error')) {
    return ErrorSeverity.MEDIUM;
  }

  // Security or auth related errors are high severity
  if (message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('csrf')) {
    return ErrorSeverity.HIGH;
  }

  // Type errors, null reference errors are critical for UX
  if (message.includes('cannot read property') ||
      message.includes('undefined is not a function') ||
      message.includes('typeerror')) {
    return ErrorSeverity.CRITICAL;
  }

  // Default to medium severity
  return ErrorSeverity.MEDIUM;
}

// エラータイプ判定関数
function determineErrorType(error: any, context: any): ErrorType {
  const message = error.message?.toLowerCase() || '';
  const url = context.url?.toLowerCase() || '';

  // Network related errors
  if (message.includes('fetch') || 
      message.includes('network') ||
      message.includes('connection')) {
    return ErrorType.NETWORK;
  }

  // Authentication errors
  if (url.includes('/auth') || 
      message.includes('auth') ||
      message.includes('login')) {
    return ErrorType.AUTHENTICATION;
  }

  // Validation errors (form inputs, etc.)
  if (message.includes('validation') ||
      message.includes('invalid input')) {
    return ErrorType.VALIDATION;
  }

  // Component rendering errors
  if (error.componentStack || message.includes('render')) {
    return ErrorType.CLIENT;
  }

  return ErrorType.UNKNOWN;
}

// POSTハンドラー - AppErrorBoundaryからのエラーログ受信
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    
    // リクエストボディの解析
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // 必須フィールドの検証
    if (!body.error?.message) {
      return NextResponse.json(
        { error: 'Missing required field: error.message' },
        { status: 400 }
      );
    }

    // エラーエントリの構築
    const errorEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: body.error.message,
        stack: body.error.stack,
        componentStack: body.error.componentStack,
        name: body.error.name || 'UnknownError'
      },
      context: {
        url: body.context?.url || request.nextUrl.pathname,
        userAgent,
        userId: body.context?.userId,
        sessionId: body.context?.sessionId,
        component: body.context?.component
      },
      severity: body.severity || determineErrorSeverity(body.error),
      type: body.type || determineErrorType(body.error, body.context),
      buildInfo: {
        version: process.env.npm_package_version,
        commit: process.env.VERCEL_GIT_COMMIT_SHA
      }
    };

    // エラーログの永続化
    await persistErrorLog(errorEntry);

    // レスポンス送信
    return NextResponse.json({ 
      success: true,
      timestamp: errorEntry.timestamp,
      severity: errorEntry.severity
    }, { status: 200 });

  } catch (apiError) {
    logger.error('Error logging API failed:', { data: apiError });
    
    return NextResponse.json(
      { 
        error: 'Internal server error while logging error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GETハンドラー - エラーログ統計の取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    // 開発環境でのみアクセス可能
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Error log access is disabled in production' },
        { status: 403 }
      );
    }

    // 簡単なエラー統計を返す（Phase 4基礎実装）
    const errorStats = {
      endpoint: '/api/log/error',
      status: 'active',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      features: [
        'AppErrorBoundary integration',
        'Error severity classification',
        'Component stack tracking',
        'Development environment logging'
      ]
    };

    return NextResponse.json(errorStats, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get error statistics' },
      { status: 500 }
    );
  }
}

// OPTIONS ハンドラー - CORS対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}