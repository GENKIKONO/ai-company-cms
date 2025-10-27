// ✅ 統一パブリケーション API: /api/my/organization/publish
// 公開状態を is_published と status の両方で一元管理
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase-server';
import { handleApiError, validationError, notFoundError } from '@/lib/api/error-responses';
import { logger } from '@/lib/utils/logger';

// パブリケーション状態スキーマ
const publishStatusSchema = z.object({
  is_published: z.boolean(),
});

// ✅ 共通キャッシュ無効化関数（publication用）
async function revalidatePublicationCache(userId: string, orgSlug?: string) {
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    // パス無効化（公開状態変更時の重要パス）
    const pathsToRevalidate = [
      '/dashboard',
      '/organizations'
    ];
    
    if (orgSlug) {
      pathsToRevalidate.push(`/o/${orgSlug}`);
    }
    
    pathsToRevalidate.forEach(path => revalidatePath(path));
    
    // 統一タグ再検証
    const tag = `org:${userId}`;
    revalidateTag(tag);
    
    logger.debug('[VERIFY] Publication cache invalidation completed', { 
      tag, 
      paths: pathsToRevalidate.length,
      slug: orgSlug 
    });
    
    return true;
  } catch (error) {
    logger.error('[VERIFY] Publication cache invalidation failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

export const revalidate = 0;
export const fetchCache = 'force-no-store';

// PUT - 公開状態の統一更新
export async function PUT(request: NextRequest) {
  try {
    logger.debug('Debug', '[my/organization/publish] PUT handler start');
    
    // ✅ 統一されたサーバーサイドSupabaseクライアント
    const supabase = await supabaseServer();

    // 認証ユーザー取得（Cookieベース）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('[my/organization/publish] PUT Not authenticated', { authError, hasUser: !!user });
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // リクエストボディの検証
    let body: z.infer<typeof publishStatusSchema>;
    try {
      const rawBody = await request.json();
      body = publishStatusSchema.parse(rawBody);
      logger.debug('[VERIFY] Publication request', { is_published: body.is_published });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError({ is_published: error.errors.map(e => e.message) }, 'Invalid publication status');
      }
      throw error;
    }

    // 企業の存在確認
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('id, slug, is_published, status')
      .eq('created_by', user.id)
      .single();

    if (fetchError || !existingOrg) {
      logger.warn('[my/organization/publish] Organization not found', { userId: user.id, error: fetchError });
      return notFoundError('Organization');
    }

    // ✅ 統一publication状態ロジック: is_published と status を完全同期
    const newIsPublished = body.is_published;
    const newStatus = newIsPublished ? 'published' : 'draft';
    
    // 現在の状態と同じ場合は早期リターン（idempotent）
    if (existingOrg.is_published === newIsPublished && existingOrg.status === newStatus) {
      logger.debug('[VERIFY] Publication state unchanged (idempotent)', { 
        is_published: newIsPublished,
        status: newStatus 
      });
      
      // キャッシュ更新は実行（最新状態確保のため）
      await revalidatePublicationCache(user.id, existingOrg.slug);
      
      return NextResponse.json(
        { 
          data: existingOrg,
          changed: false,
          message: 'Publication state unchanged'
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, must-revalidate'
          }
        }
      );
    }

    // ✅ トランザクション的更新: is_published と status を同時更新
    const updateData = {
      is_published: newIsPublished,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    logger.debug('[VERIFY] Updating publication state', updateData);

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', existingOrg.id)
      .eq('created_by', user.id) // セキュリティのため二重チェック
      .select()
      .single();

    if (error) {
      logger.error('[my/organization/publish] Database error', error instanceof Error ? error : new Error(String(error)));
      return handleApiError(error);
    }

    // ✅ 統一キャッシュ無効化
    const cacheResult = await revalidatePublicationCache(user.id, data.slug);
    if (!cacheResult) {
      logger.warn('[VERIFY] Cache invalidation had issues but publication update succeeded');
    }

    logger.debug('[VERIFY] Publication state updated successfully', {
      orgId: data.id,
      slug: data.slug,
      is_published: data.is_published,
      status: data.status
    });

    return NextResponse.json(
      { 
        data,
        changed: true,
        message: newIsPublished ? 'Organization published' : 'Organization unpublished'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    const errorId = `publish-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.error('[PUT /api/my/organization/publish] Unexpected error:', { errorId, error });
    
    return handleApiError(error);
  }
}