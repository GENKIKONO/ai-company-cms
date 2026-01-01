// CMS アセット管理 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';

// アセット一覧取得
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

    if (orgError || !userOrg || userOrg.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active_only') === 'true';
    const mimeType = url.searchParams.get('mime_type');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('cms_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (mimeType) {
      query = query.like('mime_type', `${mimeType}%`);
    }

    const { data: assets, error } = await query;

    if (error) {
      logger.error('[CMS Assets] Failed to fetch assets', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'CMS tables not yet created'
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assets || [],
      total: assets?.length || 0,
      pagination: {
        limit,
        offset,
        has_more: (assets?.length || 0) === limit
      }
    });

  } catch (error) {
    logger.error('[CMS Assets] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// アセット作成・登録
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

    if (orgError || !userOrg || userOrg.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      filename, 
      original_name, 
      file_path, 
      file_size, 
      mime_type, 
      alt_text, 
      description, 
      tags = [],
      is_active = true 
    } = body;

    if (!filename || !file_path) {
      return NextResponse.json(
        { error: 'filename and file_path are required' },
        { status: 400 }
      );
    }

    const assetData = {
      filename,
      original_name: original_name || filename,
      file_path,
      file_size,
      mime_type,
      alt_text,
      description,
      tags,
      is_active,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cms_assets')
      .insert(assetData)
      .select()
      .single();

    if (error) {
      logger.error('[CMS Assets] Failed to save asset', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json(
          { error: 'CMS tables not yet created. Please run migration first.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Asset saved successfully'
    });

  } catch (error) {
    logger.error('[CMS Assets] POST error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// アセット削除
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

    if (orgError || !userOrg || userOrg.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const assetId = url.searchParams.get('id');

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('cms_assets')
      .delete()
      .eq('id', assetId);

    if (error) {
      logger.error('[CMS Assets] Failed to delete asset', { data: error });
      return NextResponse.json(
        { error: 'Failed to delete asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    logger.error('[CMS Assets] DELETE error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}