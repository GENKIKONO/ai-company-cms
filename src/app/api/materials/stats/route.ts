import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import type { SalesAction } from '@/types/domain/sales';;
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Use service role client for stats insertion to allow anonymous users
    const serviceSupabase = supabaseAdmin;
    
    // Also get regular client for user authentication check (optional)
    const supabase = await createClient();
    
    // リクエストボディの解析
    const body = await request.json();
    const { material_id, action, user_agent } = body;

    // 必須フィールドの検証
    if (!material_id || !action) {
      return NextResponse.json(
        { error: 'material_id and action are required' },
        { status: 400 }
      );
    }

    // actionの検証
    if (!['view', 'download'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "view" or "download"' },
        { status: 400 }
      );
    }

    // IPアドレスの取得
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      request.headers.get('cf-connecting-ip') ||
                      'unknown';

    // ユーザー情報の取得（認証状態の確認、ただし必須ではない）
    let user_id: string | null = null;
    let company_id: string | null = null;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!authError && user) {
        user_id = user.id;
        
        // ユーザーの企業IDを取得
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', user.id);
        
        if (orgData && orgData.length > 0) {
          company_id = orgData[0].id;
        }
      }
    } catch (error) {
      // 認証エラーは無視（匿名ユーザーも許可）
      logger.debug('Authentication check failed, proceeding as anonymous user');
    }

    // 統計データの挿入
    const statsData = {
      material_id,
      user_id,
      company_id,
      action: action as SalesAction,
      user_agent: user_agent || request.headers.get('user-agent') || '',
      ip_address: ip_address.split(',')[0].trim(), // 複数IPの場合は最初のもの
    };

    const { data, error } = await serviceSupabase
      .from('sales_materials_stats')
      .insert([statsData])
      .select();

    if (error) {
      logger.error('Error inserting material stats', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Failed to log material action' },
        { status: 500 }
      );
    }

    const insertedRecord = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ 
      success: true,
      data: {
        id: insertedRecord?.id,
        action: insertedRecord?.action,
        created_at: insertedRecord?.created_at
      }
    });

  } catch (error) {
    logger.error('Material stats API error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者確認（簡易版、本格実装では admin-auth.ts を使用）
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const material_id = url.searchParams.get('material_id');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let query = supabase
      .from('sales_materials_stats')
      .select(`
        *,
        sales_materials!inner(
          id,
          title,
          organization_id,
          organizations!inner(name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (material_id) {
      query = query.eq('material_id', material_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching material stats', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    logger.error('Material stats fetch error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}