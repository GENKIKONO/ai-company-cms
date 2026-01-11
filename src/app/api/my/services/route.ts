export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/log';

// GET - ユーザーのサービスを取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      logger.debug('[my/services] Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // organizationId クエリパラメータ必須チェック
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      logger.debug('[my/services] organizationId parameter required');
      return NextResponse.json({ error: 'organizationId parameter is required' }, { status: 400 });
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error('[my/services] Organization membership check failed', { 
        userId: user.id, 
        organizationId,
        error: membershipError.message 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: 'メンバーシップ確認に失敗しました' 
      }, { status: 500 });
    }

    if (!membership) {
      logger.warn('[my/services] User not a member of organization', { 
        userId: user.id, 
        organizationId 
      });
      return NextResponse.json({ 
        error: 'FORBIDDEN', 
        message: 'この組織のメンバーではありません' 
      }, { status: 403 });
    }

    // サービス取得（セキュアビュー経由、RLSにより組織メンバーのみアクセス可能）
    const { data: services, error: servicesError } = await supabase
      .from('v_dashboard_services_secure')
      .select('id, title, slug, status, is_published, published_at, organization_id, description, duration_months, category, price, created_at, updated_at, summary')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (servicesError) {
      logger.error('[my/services] Failed to fetch services', { 
        data: servicesError,
        userId: user.id,
        organizationId 
      });
      return NextResponse.json({ message: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ data: services || [] }, { status: 200 });

  } catch (error) {
    logger.error('[GET /api/my/services] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Authentication check（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      logger.debug('[my/services] POST Not authenticated');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // organizationId 必須チェック
    if (!body.organizationId) {
      logger.debug('[my/services] POST organizationId required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // Basic validation
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // 組織メンバーシップチェック（RLSモデルに準拠）
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('organization_id', body.organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      logger.error('[my/services] POST Organization membership check failed', { 
        userId: user.id, 
        organizationId: body.organizationId,
        error: membershipError?.message 
      });
      return NextResponse.json({ 
        error: 'FORBIDDEN', 
        message: 'この組織のメンバーではありません' 
      }, { status: 403 });
    }

    // 組織情報取得（キャッシュ無効化用）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('id', body.organizationId)
      .maybeSingle();

    if (orgError || !organization) {
      logger.error('[my/services] POST Organization data fetch failed', { 
        userId: user.id, 
        organizationId: body.organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'INTERNAL_ERROR', 
        message: '組織情報の取得に失敗しました' 
      }, { status: 500 });
    }

    // Prepare service data with RLS compliance
    const serviceData = {
      organization_id: body.organizationId,
      created_by: user.id, // Required for RLS policy
      name: body.name.trim(),
      summary: body.summary || null,
      description: body.description || null,
      price: body.price ? parseInt(body.price, 10) : null,
      duration_months: body.duration_months ? parseInt(body.duration_months, 10) : null,
      category: body.category || null,
      is_published: true, // 作成されたサービスは即座に公開対象とする
      status: 'published', // 公開状態を明示的に設定
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .maybeSingle();

    if (error) {
      logger.error('[my/services] POST Failed to create service', { 
        data: error,
        userId: user.id,
        organizationId: body.organizationId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // RLS エラーの場合は 403 を返す
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return NextResponse.json({ 
          error: 'RLS_FORBIDDEN', 
          message: 'Row Level Security によって拒否されました' 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create service', 
        details: error.message 
      }, { status: 500 });
    }

    // キャッシュ無効化（公開ページの即座反映用）
    try {
      const { revalidatePath } = await import('next/cache');
      
      // 関連ページのキャッシュを無効化
      revalidatePath('/dashboard');
      revalidatePath(`/organizations/${organization.id}`);
      if (organization.slug) {
        revalidatePath(`/o/${organization.slug}`);
      }
      
      logger.debug('[my/services] POST Cache revalidation successful', {
        userId: user.id,
        orgId: organization.id,
        orgSlug: organization.slug
      });
    } catch (revalidateError) {
      // キャッシュ無効化エラーは非ブロッキング
      logger.warn('[my/services] POST Cache revalidation failed', { 
        userId: user.id,
        orgId: organization.id,
        error: revalidateError instanceof Error ? revalidateError.message : revalidateError 
      });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    logger.error('[POST /api/my/services] Unexpected error', { data: error });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
