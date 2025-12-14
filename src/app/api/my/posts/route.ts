export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';
import { z } from 'zod';
import { withOrgAuth } from '@/lib/auth/org-middleware';

// POST request schema
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  content_markdown: z.string().optional(),
  slug: z.string().optional(), // スラッグは任意（自動生成される）
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

// GET - ユーザーの投稿を取得
export async function GET(request: NextRequest) {
  return withOrgAuth(request, async ({ orgId }) => {
    const supabase = await createClient();
    
    // 組織の投稿を取得（organization_id前提）
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
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
      return NextResponse.json({ 
        error: '記事の取得に失敗しました',
        code: postsError.code,
        message: 'Failed to fetch posts' 
      }, { status: 500 });
    }

    return NextResponse.json({ data: posts }, { status: 200 });
  });
}

// POST - 新しい投稿を作成
export async function POST(request: NextRequest) {
  return withOrgAuth(request, async ({ orgId, userId }) => {
    const supabase = await createClient();
    
    // リクエストボディを取得・検証
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // スラッグの生成または検証
    const slug = validatedData.slug && validatedData.slug.trim() 
      ? validatedData.slug.trim()
      : generateSlug(validatedData.title);

    logger.debug('[my/posts POST] Post data validated', {
      userId,
      orgId,
      title: validatedData.title,
      slug: slug,
      status: validatedData.status,
      isPublished: validatedData.is_published
    });

    // published_at の設定
    const publishedAt = (validatedData.status === 'published' || validatedData.is_published) 
      ? new Date().toISOString() 
      : null;

    // 投稿データを準備（organization_id前提）
    const postData = {
      organization_id: orgId,
      created_by: userId,
      title: validatedData.title,
      slug: slug,
      content: validatedData.content_markdown || validatedData.content || '',
      status: validatedData.is_published ? 'published' : validatedData.status,
      is_published: true, // 作成されたポストは即座に公開対象とする
      published_at: publishedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 重複スラッグチェック（organization_id前提）
    const { data: existingPost, error: slugCheckError } = await supabase
      .from('posts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('slug', slug)
      .maybeSingle();

    if (slugCheckError) {
      logger.error('[my/posts POST] Failed to check slug uniqueness', {
        userId,
        orgId,
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

    if (existingPost) {
      logger.warn('[my/posts POST] Duplicate slug detected', {
        userId,
        orgId,
        slug: slug,
        existingPostId: existingPost.id
      });
      return NextResponse.json({ 
        error: 'このスラッグは既に使用されています',
        code: 'DUPLICATE_SLUG'
      }, { status: 400 });
    }

    // 投稿を作成
    logger.debug('[my/posts POST] Inserting post data', {
      userId,
      postData: { ...postData, content: '[内容省略]' }
    });

    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .maybeSingle();

    if (createError || !newPost) {
      logger.error('[my/posts POST] Failed to create post', {
        userId,
        orgId,
        postData: { ...postData, content: '[内容省略]' },
        error: createError,
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
        message: createError?.message
      });
      return NextResponse.json({ 
        error: '記事の作成に失敗しました',
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
        message: 'Failed to create post' 
      }, { status: 500 });
    }

    logger.info('[my/posts POST] Post created successfully', {
      userId,
      orgId,
      postId: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status
    });
    return NextResponse.json({ data: newPost }, { status: 201 });
  }).catch(error => {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Validation error',
        errors: error.errors 
      }, { status: 400 });
    }
    
    logger.error('[POST /api/my/posts] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  });
}
