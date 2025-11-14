import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/log';

/**
 * 制裁期限処理ジョブAPI
 * POST /api/enforcement/jobs/process
 * 
 * 用途: pg_cron や Edge cron から定期実行される
 * 認証: X-Cron-Token ヘッダーまたは管理者認証
 */
export async function POST(request: NextRequest) {
  try {
    // Cron token による認証（推奨）
    const cronToken = request.headers.get('x-cron-token');
    const expectedToken = process.env.ENFORCEMENT_CRON_TOKEN;
    
    let isAuthorized = false;
    let authContext = 'cron-token';

    if (expectedToken && cronToken === expectedToken) {
      isAuthorized = true;
    } else {
      // フォールバック: 管理者認証
      try {
        const { requireAdminAuth } = await import('@/lib/auth/admin-auth');
        const authResult = await requireAdminAuth(request);
        if (authResult.success) {
          isAuthorized = true;
          authContext = 'admin-auth';
        }
      } catch (authError) {
        logger.warn('Enforcement jobs API: Auth fallback failed', {
          component: 'enforcement-jobs',
          error: authError instanceof Error ? authError.message : String(authError)
        });
      }
    }

    if (!isAuthorized) {
      logger.warn('Enforcement jobs API: Unauthorized access attempt', {
        component: 'enforcement-jobs',
        hasCronToken: !!cronToken,
        hasExpectedToken: !!expectedToken,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service Role でデータベースアクセス
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // ストアド関数を呼び出し
    const { data: processedCount, error: processError } = await supabase
      .rpc('process_enforcement_deadlines');

    if (processError) {
      logger.error('Enforcement jobs API: Failed to process deadlines', {
        component: 'enforcement-jobs',
        error: processError.message,
        authContext
      });
      return NextResponse.json(
        { success: false, error: 'Failed to process enforcement deadlines' },
        { status: 500 }
      );
    }

    // 処理結果をログに記録
    if (processedCount > 0) {
      logger.info('Enforcement jobs API: Deadlines processed', {
        component: 'enforcement-jobs',
        processedCount,
        authContext,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.debug('Enforcement jobs API: No deadlines to process', {
        component: 'enforcement-jobs',
        authContext,
        timestamp: new Date().toISOString()
      });
    }

    // 詳細な処理結果を取得（オプション）
    let processedActions = [];
    if (processedCount > 0) {
      try {
        const { data: recentActions } = await supabase
          .from('enforcement_actions')
          .select(`
            id,
            user_id,
            action,
            deadline,
            processed_at,
            profiles:profiles!enforcement_actions_user_id_fkey(
              email,
              account_status
            )
          `)
          .not('processed_at', 'is', null)
          .gte('processed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 過去5分以内
          .order('processed_at', { ascending: false });

        if (recentActions) {
          processedActions = recentActions.map(action => ({
            actionId: action.id,
            userId: action.user_id,
            action: action.action,
            deadline: action.deadline,
            processedAt: action.processed_at,
            userEmail: (action.profiles as any)?.email || 'unknown',
            currentStatus: (action.profiles as any)?.account_status || 'unknown'
          }));
        }
      } catch (detailError) {
        logger.warn('Enforcement jobs API: Failed to fetch processing details', {
          component: 'enforcement-jobs',
          error: detailError instanceof Error ? detailError.message : String(detailError)
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processedCount: processedCount || 0,
        timestamp: new Date().toISOString(),
        authContext,
        processedActions
      }
    });

  } catch (error) {
    logger.error('Enforcement jobs API: Unexpected error', {
      component: 'enforcement-jobs',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 処理状況確認用API
 * GET /api/enforcement/jobs/process
 */
export async function GET(request: NextRequest) {
  try {
    // 簡易認証（管理者のみ）
    const { requireAdminAuth } = await import('@/lib/auth/admin-auth');
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 処理待ちのアクション数を確認
    const { count: pendingCount } = await supabase
      .from('enforcement_actions')
      .select('*', { count: 'exact', head: true })
      .not('deadline', 'is', null)
      .lt('deadline', new Date().toISOString())
      .is('processed_at', null);

    // 最近処理されたアクション
    const { data: recentProcessed } = await supabase
      .from('enforcement_actions')
      .select('id, action, user_id, deadline, processed_at')
      .not('processed_at', 'is', null)
      .gte('processed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 過去24時間
      .order('processed_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        pendingCount: pendingCount || 0,
        recentProcessed: recentProcessed || [],
        lastCheck: new Date().toISOString(),
        cronTokenConfigured: !!process.env.ENFORCEMENT_CRON_TOKEN
      }
    });

  } catch (error) {
    logger.error('Enforcement jobs API status: Unexpected error', {
      component: 'enforcement-jobs-status',
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}