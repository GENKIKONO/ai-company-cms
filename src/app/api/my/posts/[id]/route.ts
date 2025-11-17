export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/log';
import { z } from 'zod';

// POST request schema
const updatePostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  content_markdown: z.string().optional(),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  is_published: z.boolean().optional()
});

// スラッグ生成ユーティリティ
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

// PUT - 特定の投稿を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await supabaseServer();
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[my/posts/update] Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ユーザーの組織を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError) {
      logger.error('[my/posts/update] Failed to fetch organization', {
        userId: user.id,
        postId: postId,
        error: orgError,
        code: orgError.code,
        details: orgError.details,
        hint: orgError.hint
      });
      return NextResponse.json({ 
        error: '企業情報の取得に失敗しました',
        code: orgError.code,
        message: 'Failed to fetch organization' 
      }, { status: 500 });
    }

    if (!organization) {
      logger.debug('[my/posts/update] No organization found for user');
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    // 既存の投稿を取得（組織との関連性もチェック）
    const { data: existingPost, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('org_id', organization.id)
      .maybeSingle();

    if (postError) {
      logger.error('[my/posts/update] Failed to fetch existing post', {
        userId: user.id,
        postId: postId,
        orgId: organization.id,
        error: postError,
        code: postError.code,
        details: postError.details,
        hint: postError.hint
      });
      return NextResponse.json({ 
        error: '記事の取得に失敗しました',
        code: postError.code,
        message: 'Failed to fetch post' 
      }, { status: 500 });
    }

    if (!existingPost) {
      logger.debug('[my/posts/update] Post not found or access denied', { postId, orgId: organization.id });
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // リクエストボディを取得・検証
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // スラッグの生成または検証
    const slug = validatedData.slug && validatedData.slug.trim() 
      ? validatedData.slug.trim()
      : (validatedData.title !== existingPost.title ? generateSlug(validatedData.title) : existingPost.slug);

    // published_at の設定
    const publishedAt = (validatedData.status === 'published' || validatedData.is_published) 
      ? (existingPost.published_at || new Date().toISOString())
      : null;

    // 投稿データを準備
    const updateData = {
      title: validatedData.title,
      slug: slug,
      content: validatedData.content_markdown || validatedData.content || '',
      status: validatedData.is_published ? 'published' : validatedData.status,
      is_published: validatedData.is_published !== undefined ? validatedData.is_published : (validatedData.status === 'published'),
      published_at: publishedAt,
      updated_at: new Date().toISOString()
    };

    // スラッグ重複チェック（自分以外）
    if (slug !== existingPost.slug) {
      const { data: duplicatePost, error: slugCheckError } = await supabase
        .from('posts')
        .select('id')
        .eq('org_id', organization.id)
        .eq('slug', slug)
        .neq('id', postId)
        .maybeSingle();

      if (slugCheckError) {
        logger.error('[my/posts/update] Failed to check slug uniqueness', {
          userId: user.id,
          postId: postId,
          orgId: organization.id,
          slug: slug,
          error: slugCheckError,
          code: slugCheckError.code,
          details: slugCheckError.details
        });
        return NextResponse.json({ 
          error: 'スラッグの重複チェックに失敗しました',
          code: slugCheckError.code
        }, { status: 500 });
      }

      if (duplicatePost) {
        logger.warn('[my/posts/update] Duplicate slug detected', {
          userId: user.id,
          postId: postId,
          orgId: organization.id,
          slug: slug,
          existingPostId: duplicatePost.id
        });
        return NextResponse.json({ 
          error: 'このスラッグは既に使用されています',
          code: 'DUPLICATE_SLUG'
        }, { status: 400 });
      }
    }

    // 投稿を更新
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('org_id', organization.id)
      .select()
      .single();

    if (updateError) {
      logger.error('[my/posts/update] Failed to update post', {
        userId: user.id,
        postId: postId,
        orgId: organization.id,
        updateData: { ...updateData, content: '[内容省略]' },
        error: updateError,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        message: updateError.message
      });
      return NextResponse.json({ 
        error: '記事の更新に失敗しました',
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        message: 'Failed to update post' 
      }, { status: 500 });
    }

    logger.info('[my/posts/update] Post updated successfully', {
      userId: user.id,
      orgId: organization.id,
      postId: updatedPost.id,
      title: updatedPost.title,
      slug: updatedPost.slug,
      status: updatedPost.status
    });
    return NextResponse.json({ data: updatedPost }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Validation error',
        errors: error.errors 
      }, { status: 400 });
    }

    logger.error('[PUT /api/my/posts/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 特定の投稿を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await supabaseServer();
    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[my/posts/delete] Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ユーザーの組織を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError) {
      logger.error('[my/posts/delete] Failed to fetch organization', {
        userId: user.id,
        postId: postId,
        error: orgError,
        code: orgError.code,
        details: orgError.details,
        hint: orgError.hint
      });
      return NextResponse.json({ 
        error: '企業情報の取得に失敗しました',
        code: orgError.code,
        message: 'Failed to fetch organization' 
      }, { status: 500 });
    }

    if (!organization) {
      logger.debug('[my/posts/delete] No organization found for user');
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    // 投稿の存在確認（組織との関連性もチェック）
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .eq('org_id', organization.id)
      .maybeSingle();

    if (postError) {
      logger.error('[my/posts/delete] Failed to check post existence', {
        userId: user.id,
        postId: postId,
        orgId: organization.id,
        error: postError,
        code: postError.code,
        details: postError.details,
        hint: postError.hint
      });
      return NextResponse.json({ 
        error: '記事の存在確認に失敗しました',
        code: postError.code,
        message: 'Failed to check post existence' 
      }, { status: 500 });
    }

    if (!post) {
      logger.debug('[my/posts/delete] Post not found or access denied', { postId, orgId: organization.id });
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // 投稿を削除
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('org_id', organization.id);

    if (deleteError) {
      logger.error('[my/posts/delete] Failed to delete post', {
        userId: user.id,
        postId: postId,
        orgId: organization.id,
        error: deleteError,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint
      });
      return NextResponse.json({ 
        error: '記事の削除に失敗しました',
        code: deleteError.code,
        message: 'Failed to delete post' 
      }, { status: 500 });
    }

    logger.debug('[my/posts/delete] Post deleted successfully', { postId });
    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

  } catch (error) {
    logger.error('[DELETE /api/my/posts/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
