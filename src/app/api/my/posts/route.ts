/**
 * /api/my/posts - ユーザーの投稿管理API
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

// POST request schema
const createPostSchema = z.object({
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
  // クエリパラメータから organizationId を取得
  const queryOrgId = request.nextUrl.searchParams.get('organizationId');

  if (queryOrgId) {
    // メンバーシップ確認
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

  // デフォルト: 最初の組織を取得
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

// GET - ユーザーの投稿を取得
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 組織ID取得
    const { orgId, error: orgError } = await getOrgId(supabase, user.id, request);
    if (orgError || !orgId) {
      return applyCookies(NextResponse.json({
        error: orgError || 'Organization not found',
        code: 'ORG_NOT_FOUND'
      }, { status: 404 }));
    }

    // 組織の投稿を取得（セキュアビュー経由）
    const { data: posts, error: postsError } = await supabase
      .from('v_dashboard_posts_secure')
      .select('id, title, slug, is_published, published_at, organization_id, status, created_at, updated_at, summary')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (postsError) {
      logger.error('[my/posts GET] Failed to fetch posts', {
        orgId,
        error: postsError,
        code: postsError.code,
        details: postsError.details,
        hint: postsError.hint
      });
      return applyCookies(NextResponse.json({
        error: '記事の取得に失敗しました',
        code: postsError.code,
        message: 'Failed to fetch posts'
      }, { status: 500 }));
    }

    return applyCookies(NextResponse.json({ data: posts }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/posts] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - 新しい投稿を作成
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 組織ID取得
    const { orgId, error: orgError } = await getOrgId(supabase, user.id, request);
    if (orgError || !orgId) {
      return applyCookies(NextResponse.json({
        error: orgError || 'Organization not found',
        code: 'ORG_NOT_FOUND'
      }, { status: 404 }));
    }

    // リクエストボディを取得・検証
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // スラッグの生成または検証
    const slug = validatedData.slug && validatedData.slug.trim()
      ? validatedData.slug.trim()
      : generateSlug(validatedData.title);

    logger.debug('[my/posts POST] Post data validated', {
      userId: user.id,
      orgId,
      title: validatedData.title,
      slug: slug,
      status: validatedData.status,
      isPublished: validatedData.is_published
    });

    // 公開状態の決定
    const isPublished = validatedData.is_published === true || validatedData.status === 'published';
    const finalStatus = isPublished ? 'published' : 'draft';
    const publishedAt = isPublished ? new Date().toISOString() : null;

    // 投稿データを準備
    const postData = {
      organization_id: orgId,
      created_by: user.id,
      title: validatedData.title,
      slug: slug,
      content: validatedData.content_markdown || validatedData.content || '',
      status: finalStatus,
      is_published: isPublished,
      published_at: publishedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 重複スラッグチェック
    const { data: existingPost, error: slugCheckError } = await supabase
      .from('posts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('slug', slug)
      .maybeSingle();

    if (slugCheckError) {
      logger.error('[my/posts POST] Failed to check slug uniqueness', {
        userId: user.id,
        orgId,
        slug: slug,
        error: slugCheckError,
        code: slugCheckError.code,
        details: slugCheckError.details
      });
      return applyCookies(NextResponse.json({
        error: 'スラッグの重複チェックに失敗しました',
        code: slugCheckError.code
      }, { status: 500 }));
    }

    if (existingPost) {
      logger.warn('[my/posts POST] Duplicate slug detected', {
        userId: user.id,
        orgId,
        slug: slug,
        existingPostId: existingPost.id
      });
      return applyCookies(NextResponse.json({
        error: 'このスラッグは既に使用されています',
        code: 'DUPLICATE_SLUG'
      }, { status: 400 }));
    }

    // 投稿を作成
    logger.debug('[my/posts POST] Inserting post data', {
      userId: user.id,
      postData: { ...postData, content: '[内容省略]' }
    });

    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .maybeSingle();

    if (createError || !newPost) {
      logger.error('[my/posts POST] Failed to create post', {
        userId: user.id,
        orgId,
        postData: { ...postData, content: '[内容省略]' },
        error: createError,
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
        message: createError?.message
      });
      return applyCookies(NextResponse.json({
        error: '記事の作成に失敗しました',
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
        message: 'Failed to create post'
      }, { status: 500 }));
    }

    logger.info('[my/posts POST] Post created successfully', {
      userId: user.id,
      orgId,
      postId: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status
    });

    return applyCookies(NextResponse.json({ data: newPost }, { status: 201 }));

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

    logger.error('[POST /api/my/posts] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
