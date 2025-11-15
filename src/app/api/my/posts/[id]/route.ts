export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/log';

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
      logger.error('[my/posts/delete] Failed to fetch organization', { data: orgError });
      return NextResponse.json({ message: 'Failed to fetch organization' }, { status: 500 });
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
      logger.error('[my/posts/delete] Failed to check post existence', { data: postError });
      return NextResponse.json({ message: 'Failed to check post existence' }, { status: 500 });
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
      logger.error('[my/posts/delete] Failed to delete post', { data: deleteError });
      return NextResponse.json({ message: 'Failed to delete post' }, { status: 500 });
    }

    logger.debug('[my/posts/delete] Post deleted successfully', { postId });
    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

  } catch (error) {
    logger.error('[DELETE /api/my/posts/[id]] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
