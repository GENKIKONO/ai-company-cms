// Single-Org Mode API: /api/my/posts/[id]
// 個別記事の更新・削除API
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { PostFormData } from '@/types/database';
import { logger } from '@/lib/utils/logger';

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

// GET - 個別記事を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 記事を取得（RLSにより自分の企業の記事のみ取得可能）
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not Found', message: 'Post not found' },
          { status: 404 }
        );
      }
      logger.error('Database error', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = `get-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.error('[GET /api/my/posts/[id]] Unexpected error:', { errorId, error });
    
    logErrorToDiag({
      errorId,
      endpoint: 'GET /api/my/posts/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// PUT - 記事を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    const body: Partial<PostFormData> = await request.json();

    // 記事の存在確認（RLSにより自分の企業の記事のみ取得可能）
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, slug, organization_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Post not found' },
        { status: 404 }
      );
    }

    // slugが変更される場合、バリデーションと重複チェック
    if (body.slug && body.slug !== existingPost.slug) {
      const slugValidation = validateSlug(body.slug);
      if (!slugValidation.isValid) {
        return NextResponse.json(
          { error: 'Validation error', message: slugValidation.error },
          { status: 400 }
        );
      }

      // 同じ企業内での重複チェック
      const { data: slugCheck } = await supabase
        .from('posts')
        .select('id')
        .eq('organization_id', existingPost.organization_id)
        .eq('slug', body.slug)
        .neq('id', postId)
        .single();

      if (slugCheck) {
        return NextResponse.json(
          { error: 'Conflict', message: 'Slug already exists in this organization' },
          { status: 409 }
        );
      }
    }

    // データの正規化
    const normalizedData = normalizePostPayload(body);

    // 更新データの準備
    const updateData = {
      ...normalizedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      logger.error('Database error', error instanceof Error ? error : new Error(String(error)));
      
      // 制約違反の場合
      if (error.code === '23505' && error.message.includes('unique_posts_slug_per_org')) {
        return NextResponse.json(
          { error: 'Conflict', message: 'Slug already exists in this organization' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    const errorId = `put-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.error('[PUT /api/my/posts/[id]] Unexpected error:', { errorId, error });
    
    logErrorToDiag({
      errorId,
      endpoint: 'PUT /api/my/posts/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// DELETE - 記事を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 記事の存在確認（RLSにより自分の企業の記事のみ操作可能）
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Post not found' },
        { status: 404 }
      );
    }

    // 削除実行（RLSポリシーにより自分の企業の記事のみ削除可能）
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      logger.error('Database error', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    const errorId = `delete-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.error('[DELETE /api/my/posts/[id]] Unexpected error:', { errorId, error });
    
    logErrorToDiag({
      errorId,
      endpoint: 'DELETE /api/my/posts/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { error: 'Internal server error', errorId },
      { status: 500 }
    );
  }
}

// slugバリデーション関数
function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { isValid: false, error: 'Slug is required' };
  }
  
  if (slug.trim() === '') {
    return { isValid: false, error: 'Slug cannot be empty' };
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
    return { isValid: false, error: 'Slug must contain only alphanumeric characters, hyphens, and underscores' };
  }
  
  if (slug.length < 2 || slug.length > 100) {
    return { isValid: false, error: 'Slug must be between 2 and 100 characters' };
  }
  
  return { isValid: true };
}

// データ正規化ヘルパー関数
function normalizePostPayload(data: any) {
  const normalized = { ...data };
  
  // オプショナルテキストフィールド - 空文字をnullに変換
  const optionalTextFields = ['content_markdown'];
  
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });
  
  // published_atの設定
  if (normalized.status === 'published' && !normalized.published_at) {
    normalized.published_at = new Date().toISOString();
  } else if (normalized.status === 'draft') {
    normalized.published_at = null;
  }
  
  return normalized;
}