// CMS セクション管理 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';

// セクション一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const { data: userOrg, error: orgError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (orgError || !userOrg || (userOrg as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pageKey = url.searchParams.get('page_key');
    const activeOnly = url.searchParams.get('active_only') === 'true';

    let query = supabase
      .from('cms_sections')
      .select('*')
      .order('page_key')
      .order('display_order');

    if (pageKey) {
      query = query.eq('page_key', pageKey);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: sections, error } = await query;

    if (error) {
      logger.error('[CMS Sections] Failed to fetch sections', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'CMS tables not yet created'
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch sections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sections || [],
      total: sections?.length || 0
    });

  } catch (error) {
    logger.error('[CMS Sections] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// セクション作成・更新
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const { data: userOrg, error: orgError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (orgError || !userOrg || (userOrg as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      page_key, 
      section_key, 
      section_type, 
      title, 
      content, 
      display_order = 0, 
      is_active = true 
    } = body;

    if (!page_key || !section_key || !section_type) {
      return NextResponse.json(
        { error: 'page_key, section_key, and section_type are required' },
        { status: 400 }
      );
    }

    const sectionData = {
      page_key,
      section_key,
      section_type,
      title,
      content: content || {},
      display_order,
      is_active,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabase
      .from('cms_sections') as any)
      .upsert(sectionData, {
        onConflict: 'page_key,section_key'
      })
      .select()
      .single();

    if (error) {
      logger.error('[CMS Sections] Failed to save section', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json(
          { error: 'CMS tables not yet created. Please run migration first.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save section' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Section saved successfully'
    });

  } catch (error) {
    logger.error('[CMS Sections] POST error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// セクション削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const { data: userOrg, error: orgError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (orgError || !userOrg || (userOrg as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pageKey = url.searchParams.get('page_key');
    const sectionKey = url.searchParams.get('section_key');

    if (!pageKey || !sectionKey) {
      return NextResponse.json(
        { error: 'page_key and section_key are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('cms_sections')
      .delete()
      .eq('page_key', pageKey)
      .eq('section_key', sectionKey);

    if (error) {
      logger.error('[CMS Sections] Failed to delete section', { data: error });
      return NextResponse.json(
        { error: 'Failed to delete section' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    });

  } catch (error) {
    logger.error('[CMS Sections] DELETE error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}