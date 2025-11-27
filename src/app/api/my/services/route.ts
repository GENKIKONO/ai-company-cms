export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/log';

// GET - ユーザーのサービスを取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // 組織の所有者チェック
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', organizationId)
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      logger.error('[my/services] Organization access denied', { 
        userId: user.id, 
        organizationId,
        error: orgError?.message 
      });
      return NextResponse.json({ 
        error: 'RLS_FORBIDDEN', 
        message: 'Row Level Security によって拒否されました' 
      }, { status: 403 });
    }

    // 組織のサービスを取得 - RLS compliance: organization ownership + created_by check
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('created_by', user.id)
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
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // 組織の所有者チェック
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, slug, created_by')
      .eq('id', body.organizationId)
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      logger.error('[my/services] POST Organization access denied', { 
        userId: user.id, 
        organizationId: body.organizationId,
        error: orgError?.message,
        code: orgError?.code 
      });
      return NextResponse.json({ 
        error: 'RLS_FORBIDDEN', 
        message: 'Row Level Security によって拒否されました' 
      }, { status: 403 });
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
