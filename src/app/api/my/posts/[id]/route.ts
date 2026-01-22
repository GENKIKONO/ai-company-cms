/**
 * /api/my/posts/[id] - 個別投稿の管理API
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/log';
import { z } from 'zod';
import {
  validateFilesForPublish,
  extractImageUrlsFromPostMeta,
} from '@/lib/file-scan';

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

// 組織IDを取得するヘルパー
async function getOrgId(
  supabase: Awaited<ReturnType<typeof createApiAuthClient>>['supabase'],
  userId: string,
  request: NextRequest
): Promise<{ orgId: string | null; error: string | null }> {
  const queryOrgId = request.nextUrl.searchParams.get('organizationId');

  if (queryOrgId) {
    const { data: membership, error } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('organization_id', queryOrgId)
      .maybeSingle();

    if (error) {
      return { orgId: null, error: 'Failed to check membership' };
    }
    if (!membership) {
      return { orgId: null, error: 'Not a member of this organization' };
    }
    return { orgId: queryOrgId, error: null };
  }

  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { orgId: null, error: 'Failed to fetch organization' };
  }
  if (!membership) {
    return { orgId: null, error: 'No organization found' };
  }

  return { orgId: membership.organization_id, error: null };
}

// PUT - 特定の投稿を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 組織ID取得
    const { orgId, error: orgError } = await getOrgId(supabase, user.id, request);
    if (orgError || !orgId) {
      return applyCookies(NextResponse.json({
        error: orgError || 'Organization not found',
        code: 'ORG_NOT_FOUND'
      }, { status: 404 }));
    }

    // 既存の投稿を取得（組織との関連性もチェック）
    const { data: existingPost, error: postError } = await supabase
      .from('posts')
      .select('id, organization_id, title, slug, content, status, is_published, published_at, meta, created_by, created_at, updated_at')
      .eq('id', postId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (postError) {
      logger.error('[my/posts/[id]] Failed to fetch existing post', {
        userId: user.id,
        postId,
        orgId,
        error: postError,
        code: postError.code,
        details: postError.details,
        hint: postError.hint
      });
      return applyCookies(NextResponse.json({
        error: '記事の取得に失敗しました',
        code: postError.code,
        message: 'Failed to fetch post'
      }, { status: 500 }));
    }

    if (!existingPost) {
      logger.debug('[my/posts/[id]] Post not found or access denied', {
        postId,
        orgId
      });
      return applyCookies(NextResponse.json({
        message: 'Post not found'
      }, { status: 404 }));
    }

    // リクエストボディを取得・検証
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // スラッグの生成または検証
    const slug = validatedData.slug && validatedData.slug.trim()
      ? validatedData.slug.trim()
      : (validatedData.title !== existingPost.title ? generateSlug(validatedData.title) : existingPost.slug);

    // 公開状態の決定
    const isPublished = validatedData.is_published === true || validatedData.status === 'published';
    const finalStatus = isPublished ? 'published' : 'draft';
    const publishedAt = isPublished
      ? (existingPost.published_at || new Date().toISOString())
      : null;

    // 投稿データを準備
    const updateData = {
      title: validatedData.title,
      slug: slug,
      content: validatedData.content_markdown || validatedData.content || '',
      status: finalStatus,
      is_published: isPublished,
      published_at: publishedAt,
      updated_at: new Date().toISOString()
    };

    // スラッグ重複チェック（自分以外）
    if (slug !== existingPost.slug) {
      const { data: duplicatePost, error: slugCheckError } = await supabase
        .from('posts')
        .select('id')
        .eq('organization_id', orgId)
        .eq('slug', slug)
        .neq('id', postId)
        .maybeSingle();

      if (slugCheckError) {
        logger.error('[my/posts/[id]] Failed to check slug uniqueness', {
          userId: user.id,
          postId,
          orgId,
          slug,
          error: slugCheckError,
          code: slugCheckError.code
        });
        return applyCookies(NextResponse.json({
          error: 'スラッグの重複チェックに失敗しました',
          code: slugCheckError.code
        }, { status: 500 }));
      }

      if (duplicatePost) {
        logger.warn('[my/posts/[id]] Duplicate slug detected', {
          userId: user.id,
          postId,
          orgId,
          slug,
          existingPostId: duplicatePost.id
        });
        return applyCookies(NextResponse.json({
          error: 'このスラッグは既に使用されています',
          code: 'DUPLICATE_SLUG'
        }, { status: 400 }));
      }
    }

    // 公開時のファイルスキャンバリデーション
    const isBecomingPublished =
      (updateData.status === 'published' && existingPost.status !== 'published') ||
      (updateData.is_published === true && existingPost.is_published !== true);

    if (isBecomingPublished) {
      const meta = existingPost.meta as Record<string, unknown> | null;
      const imageUrls = extractImageUrlsFromPostMeta(meta);

      if (imageUrls.length > 0) {
        const scanResult = await validateFilesForPublish(supabase, imageUrls);

        if (!scanResult.valid) {
          logger.warn('[my/posts/[id]] File scan validation failed for publish', {
            userId: user.id,
            postId,
            orgId,
            failedPaths: scanResult.failedPaths,
          });
          return applyCookies(NextResponse.json({
            error: 'ファイルのスキャンが完了していないため公開できません',
            code: 'FILE_SCAN_VALIDATION_FAILED',
            failedPaths: scanResult.failedPaths,
          }, { status: 422 }));
        }
      }
    }

    // 投稿を更新
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('organization_id', orgId)
      .select()
      .maybeSingle();

    if (updateError || !updatedPost) {
      logger.error('[my/posts/[id]] Failed to update post', {
        userId: user.id,
        postId,
        orgId,
        updateData: { ...updateData, content: '[内容省略]' },
        error: updateError,
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint,
        message: updateError?.message
      });

      // RLS エラーの場合は 403 を返す
      if (updateError?.code === '42501' || updateError?.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json({
        error: '記事の更新に失敗しました',
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint,
        message: 'Failed to update post'
      }, { status: 500 }));
    }

    logger.info('[my/posts/[id]] Post updated successfully', {
      userId: user.id,
      orgId,
      postId: updatedPost.id,
      title: updatedPost.title,
      slug: updatedPost.slug,
      status: updatedPost.status
    });

    return applyCookies(NextResponse.json({ data: updatedPost }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

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
    const { id: postId } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 組織ID取得
    const { orgId, error: orgError } = await getOrgId(supabase, user.id, request);
    if (orgError || !orgId) {
      return applyCookies(NextResponse.json({
        error: orgError || 'Organization not found',
        code: 'ORG_NOT_FOUND'
      }, { status: 404 }));
    }

    // 投稿の存在確認（組織との関連性もチェック）
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (postError) {
      logger.error('[my/posts/[id]] Failed to check post existence', {
        userId: user.id,
        postId,
        orgId,
        error: postError,
        code: postError.code,
        details: postError.details,
        hint: postError.hint
      });
      return applyCookies(NextResponse.json({
        error: '記事の存在確認に失敗しました',
        code: postError.code,
        message: 'Failed to check post existence'
      }, { status: 500 }));
    }

    if (!post) {
      logger.debug('[my/posts/[id]] Post not found or access denied', {
        postId,
        orgId
      });
      return applyCookies(NextResponse.json({
        message: 'Post not found'
      }, { status: 404 }));
    }

    // 投稿を削除
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('organization_id', orgId);

    if (deleteError) {
      logger.error('[my/posts/[id]] Failed to delete post', {
        userId: user.id,
        postId,
        orgId,
        error: deleteError,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint
      });

      // RLS エラーの場合は 403 を返す
      if (deleteError.code === '42501' || deleteError.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json({
        error: '記事の削除に失敗しました',
        code: deleteError.code,
        message: 'Failed to delete post'
      }, { status: 500 }));
    }

    logger.debug('[my/posts/[id]] Post deleted successfully', {
      postId
    });

    return applyCookies(NextResponse.json({
      message: 'Post deleted successfully'
    }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[DELETE /api/my/posts/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
