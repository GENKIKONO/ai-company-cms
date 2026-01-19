export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Update schema with validation
const updatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  body: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().nullable().optional(),
  slug: z.string().optional(),
  summary: z.string().nullable().optional(),
});

// Normalize empty strings to null for optional fields
function normalizePostData(data: Record<string, unknown>) {
  const normalized = { ...data };

  // Optional text fields that should be null if empty
  const optionalTextFields = ['body', 'content', 'summary'];

  // Normalize optional text fields
  optionalTextFields.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null;
    }
  });

  // Handle published_at date field
  if (normalized.published_at === '') {
    normalized.published_at = null;
  }

  return normalized;
}

/**
 * GET - 記事の取得
 * - 公開記事: 誰でもアクセス可能
 * - 下書き: 認証ユーザーかつ組織メンバーのみ
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;

    // UUID形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // まず記事を取得（RLSによりアクセス権がある記事のみ）
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        content,
        slug,
        status,
        is_published,
        published_at,
        created_at,
        updated_at,
        organization_id,
        summary,
        organization:organizations!organization_id(
          id,
          name,
          slug
        )
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      logger.error('[GET /api/posts/[id]] Database error', {
        postId,
        error: { code: error.code, message: error.message }
      });
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 非公開記事の場合、認証チェック
    if (!post.is_published && post.status !== 'published') {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required for draft posts' },
          { status: 401 }
        );
      }

      // 組織メンバーシップを確認
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', post.organization_id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ data: post });

  } catch (error) {
    logger.error('[GET /api/posts/[id]] Unexpected error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 記事の更新
 * - 認証必須
 * - 組織メンバー（editor以上）のみ
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;

    // UUID形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 記事の存在確認と組織ID取得
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, organization_id')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 組織メンバーシップと権限チェック
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', existingPost.organization_id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.warn('[PUT /api/posts/[id]] Access denied', {
        userId: user.id,
        postId,
        organizationId: existingPost.organization_id
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // viewer は編集不可
    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor or admin role required.' },
        { status: 403 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    const parseResult = updatePostSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    // システムフィールドを除外
    const { ...rawUpdateData } = parseResult.data;

    // Normalize data before saving
    const normalizedUpdateData = normalizePostData(rawUpdateData);
    const updateData: Record<string, unknown> = {
      ...normalizedUpdateData,
      updated_at: new Date().toISOString()
    };

    // If status is being changed to 'published', set published_at
    if (updateData.status === 'published' || updateData.is_published === true) {
      updateData.status = 'published';
      updateData.is_published = true;
      if (!updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    // If status is being changed to 'draft', clear published_at
    if (updateData.status === 'draft' || updateData.is_published === false) {
      updateData.status = 'draft';
      updateData.is_published = false;
      updateData.published_at = null;
    }

    const { data, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        id,
        title,
        body,
        content,
        slug,
        status,
        is_published,
        published_at,
        created_at,
        updated_at,
        organization_id,
        summary,
        organization:organizations!organization_id(
          id,
          name,
          slug
        )
      `)
      .maybeSingle();

    if (updateError) {
      logger.error('[PUT /api/posts/[id]] Update failed', {
        postId,
        userId: user.id,
        error: { code: updateError.code, message: updateError.message }
      });
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Post not found after update' },
        { status: 404 }
      );
    }

    logger.info('[PUT /api/posts/[id]] Post updated', {
      postId,
      userId: user.id,
      organizationId: existingPost.organization_id
    });

    return NextResponse.json({ data });

  } catch (error) {
    logger.error('[PUT /api/posts/[id]] Unexpected error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 記事の削除
 * - 認証必須
 * - 組織メンバー（admin のみ）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.id;

    // UUID形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 記事の存在確認と組織ID取得
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, organization_id')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 組織メンバーシップと権限チェック（削除は admin のみ）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', existingPost.organization_id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.warn('[DELETE /api/posts/[id]] Access denied', {
        userId: user.id,
        postId,
        organizationId: existingPost.organization_id
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // admin のみ削除可能
    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin role required for deletion' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      logger.error('[DELETE /api/posts/[id]] Delete failed', {
        postId,
        userId: user.id,
        error: { code: deleteError.code, message: deleteError.message }
      });
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    logger.info('[DELETE /api/posts/[id]] Post deleted', {
      postId,
      postTitle: existingPost.title,
      userId: user.id,
      organizationId: existingPost.organization_id
    });

    return NextResponse.json({
      message: 'Post deleted successfully'
    });

  } catch (error) {
    logger.error('[DELETE /api/posts/[id]] Unexpected error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
