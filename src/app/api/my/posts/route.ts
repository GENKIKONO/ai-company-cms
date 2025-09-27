// Single-Org Mode API: /api/my/posts
// ユーザーの企業の記事を管理するためのAPI
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { Post, PostFormData } from '@/types/database';
import { normalizePostPayload, validateSlug, createAuthError, createNotFoundError, createConflictError, createValidationError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { PLAN_LIMITS } from '@/lib/plan-limits';

// エラーログ送信関数（失敗しても無視）
async function logErrorToDiag(errorInfo: any) {
  try {
    await fetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'server_error',
        ...errorInfo
      }),
      cache: 'no-store'
    });
  } catch {
    // 診断ログ送信失敗は無視
  }
}

export const dynamic = 'force-dynamic';

// GET - ユーザー企業の記事一覧を取得
export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    // ユーザーの企業IDを取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return createNotFoundError('Organization');
    }

    // 記事一覧を取得（RLSポリシーにより自動的に自分の企業の記事のみ取得）
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });

  } catch (error) {
    const errorId = generateErrorId('get-posts');
    console.error('[GET /api/my/posts] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/posts',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}

// POST - 新しい記事を作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return createAuthError();
    }

    const body: PostFormData = await request.json();

    // 必須フィールドの検証
    if (!body.title || !body.slug) {
      return createValidationError('title/slug', 'Title and slug are required');
    }

    // slugバリデーション
    const slugValidation = validateSlug(body.slug);
    if (!slugValidation.isValid) {
      return createValidationError('slug', slugValidation.error!);
    }

    // ユーザーの企業IDとプラン情報を取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, plan')
      .eq('created_by', authData.user.id)
      .single();

    if (orgError || !orgData) {
      return createNotFoundError('Organization');
    }

    // プラン制限チェック
    const currentPlan = orgData.plan || 'free';
    const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    
    if (planLimits.posts !== -1) {
      const { count: currentCount, error: countError } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgData.id);

      if (countError) {
        console.error('Error counting posts:', countError);
        return NextResponse.json(
          { error: 'Database error', message: countError.message },
          { status: 500 }
        );
      }

      if ((currentCount || 0) >= planLimits.posts) {
        return NextResponse.json(
          {
            error: 'Plan limit exceeded',
            message: '上限に達しました。プランをアップグレードしてください。',
            currentCount,
            limit: planLimits.posts,
            plan: currentPlan
          },
          { status: 402 }
        );
      }
    }

    // 同じ企業内でのslugの重複チェック
    const { data: slugCheck } = await supabase
      .from('posts')
      .select('id')
      .eq('organization_id', orgData.id)
      .eq('slug', body.slug)
      .single();

    if (slugCheck) {
      return createConflictError('Slug already exists in this organization');
    }

    // データの正規化
    const normalizedData = normalizePostPayload(body);

    // 記事データの作成
    const postData = {
      ...normalizedData,
      organization_id: orgData.id,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // 制約違反の場合
      if (error.code === '23505') {
        if (error.message.includes('unique_posts_slug_per_org')) {
          return createConflictError('Slug already exists in this organization');
        }
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    const errorId = generateErrorId('post-posts');
    console.error('[POST /api/my/posts] Unexpected error:', { errorId, error });
    
    // エラーログを診断APIに送信
    logErrorToDiag({
      errorId,
      endpoint: 'POST /api/my/posts',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return createInternalError(errorId);
  }
}