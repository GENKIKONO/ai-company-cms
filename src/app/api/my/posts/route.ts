export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/log';
import { z } from 'zod';

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
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[my/posts] Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ユーザーの組織を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError) {
      logger.error('[my/posts GET] Failed to fetch organization', {
        userId: user.id,
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
      logger.debug('[my/posts] No organization found for user');
      return NextResponse.json({ data: [], message: 'No organization found', code: 'ORG_NOT_FOUND' }, { status: 200 });
    }

    // 組織の投稿を取得
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('org_id', organization.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      logger.error('[my/posts GET] Failed to fetch posts', {
        userId: user.id,
        orgId: organization.id,
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

  } catch (error) {
    logger.error('[GET /api/my/posts] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - 新しい投稿を作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.debug('[my/posts] Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // ユーザーの組織を取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .maybeSingle();

    if (orgError) {
      logger.error('[my/posts POST] Failed to fetch organization', {
        userId: user.id,
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
      logger.debug('[my/posts] No organization found for user');
      return NextResponse.json({ 
        error: '企業情報が見つかりません', 
        code: 'ORG_NOT_FOUND' 
      }, { status: 404 });
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
      orgId: organization.id,
      title: validatedData.title,
      slug: slug,
      status: validatedData.status,
      isPublished: validatedData.is_published
    });

    // published_at の設定
    const publishedAt = (validatedData.status === 'published' || validatedData.is_published) 
      ? new Date().toISOString() 
      : null;

    // 投稿データを準備
    const postData = {
      org_id: organization.id,
      created_by: user.id,
      title: validatedData.title,
      slug: slug,
      content: validatedData.content_markdown || validatedData.content || '',
      status: validatedData.is_published ? 'published' : validatedData.status,
      published_at: publishedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 重複スラッグチェック
    const { data: existingPost, error: slugCheckError } = await supabase
      .from('posts')
      .select('id')
      .eq('org_id', organization.id)
      .eq('slug', slug)
      .maybeSingle();

    if (slugCheckError) {
      logger.error('[my/posts POST] Failed to check slug uniqueness', {
        userId: user.id,
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

    if (existingPost) {
      logger.warn('[my/posts POST] Duplicate slug detected', {
        userId: user.id,
        orgId: organization.id,
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
      userId: user.id,
      postData: { ...postData, content: '[内容省略]' }
    });

    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (createError) {
      logger.error('[my/posts POST] Failed to create post', {
        userId: user.id,
        orgId: organization.id,
        postData: { ...postData, content: '[内容省略]' },
        error: createError,
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
        message: createError.message
      });
      return NextResponse.json({ 
        error: '記事の作成に失敗しました',
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
        message: 'Failed to create post' 
      }, { status: 500 });
    }

    logger.info('[my/posts POST] Post created successfully', {
      userId: user.id,
      orgId: organization.id,
      postId: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status
    });
    return NextResponse.json({ data: newPost }, { status: 201 });

  } catch (error) {
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
