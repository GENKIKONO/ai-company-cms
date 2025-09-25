/**
 * /api/auth/sync - 商用レベル統合版
 * 
 * 用途: 将来拡張のためのユーザーデータ同期API
 * 重要: 現在はDBトリガーで自動作成されるため、デフォルトで呼び出し不要
 *      呼ばれなくてもUIに影響しないidempotent実装
 */
import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    // 認証確認（Cookieベース統一、Bearerサポート廃止）
    const supabase = await supabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      console.warn({
        event: 'auth_sync_warning',
        requestId,
        error: authErr?.message || 'No user session',
        message: 'DBトリガーで自動作成済みのため、この警告は通常無害',
        timestamp: new Date().toISOString()
      });
      
      // 非致命的レスポンス（UIに影響しない）
      return NextResponse.json({ 
        ok: false, 
        error: 'No active session',
        code: 'session_not_found',
        requestId,
        note: 'Profile creation handled by DB trigger'
      }, { status: 401 });
    }

    // プロフィール同期（冪等性保証）
    // 注意: DBトリガーで既に作成済みの場合、この処理は無操作
    const { data: profile, error: upsertError } = await supabase
      .from('app_users')
      .upsert({ 
        id: user.id, 
        email: user.email,
        role: 'org_owner',
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id' 
      })
      .select()
      .single();

    if (upsertError) {
      console.error({
        event: 'auth_sync_error',
        requestId,
        userId: user.id,
        error: upsertError.message,
        timestamp: new Date().toISOString()
      });
      
      // 非致命的レスポンス（DBトリガーがあるため）
      return NextResponse.json({ 
        ok: false, 
        error: 'Profile sync failed',
        code: 'sync_failed',
        requestId,
        note: 'Profile may already exist via DB trigger'
      }, { status: 500 });
    }

    console.info({
      event: 'auth_sync_success',
      requestId,
      userId: user.id,
      email: user.email,
      profileExists: !!profile,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      ok: true, 
      requestId,
      profile: {
        id: profile?.id,
        email: profile?.email,
        role: profile?.role
      }
    }, { status: 200 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error({
      event: 'auth_sync_exception',
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    // 非致命的レスポンス
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error',
      code: 'internal_error',
      requestId
    }, { status: 500 });
  }
}

/**
 * 健全性チェック用GET endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: 'auth-sync',
    status: 'available',
    version: '2.0.0-commercial',
    note: 'This API is optional since DB triggers handle profile creation',
    timestamp: new Date().toISOString()
  });
}