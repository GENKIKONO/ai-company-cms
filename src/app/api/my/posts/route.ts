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
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  is_published: z.boolean().optional()
});

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
      logger.error('[my/posts] Failed to fetch organization', { data: orgError });
      return NextResponse.json({ message: 'Failed to fetch organization' }, { status: 500 });
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
      logger.error('[my/posts] Failed to fetch posts', { data: postsError });
      return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
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
      logger.error('[my/posts] Failed to fetch organization', { data: orgError });
      return NextResponse.json({ error: '企業情報の取得に失敗しました' }, { status: 500 });
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

    // published_at の設定
    const publishedAt = (validatedData.status === 'published' || validatedData.is_published) 
      ? new Date().toISOString() 
      : null;

    // 投稿データを準備
    const postData = {
      org_id: organization.id,
      created_by: user.id,
      title: validatedData.title,
      slug: validatedData.slug,
      content: validatedData.content_markdown || validatedData.content || '',
      status: validatedData.is_published ? 'published' : validatedData.status,
      published_at: publishedAt
    };

    // 重複スラッグチェック
    const { data: existingPost } = await supabase
      .from('posts')
      .select('id')
      .eq('org_id', organization.id)
      .eq('slug', validatedData.slug)
      .maybeSingle();

    if (existingPost) {
      return NextResponse.json({ 
        message: 'A post with this slug already exists',
        error: 'DUPLICATE_SLUG'
      }, { status: 400 });
    }

    // 投稿を作成
    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (createError) {
      logger.error('[my/posts] Failed to create post', { data: createError });
      return NextResponse.json({ message: 'Failed to create post' }, { status: 500 });
    }

    logger.debug('[my/posts] Post created successfully', { id: newPost.id, title: newPost.title });
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
