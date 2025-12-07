export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { QAStatsAction } from '@/types/domain/qa-system';;
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Use service role client for stats insertion to allow anonymous users
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Also get regular client for user authentication check (optional)
    const supabase = await createClient();
    
    // リクエストボディの解析
    const body = await request.json();
    const { qna_id, action, user_agent } = body;

    // 必須フィールドの検証
    if (!qna_id || !action) {
      return NextResponse.json(
        { error: 'qna_id and action are required' },
        { status: 400 }
      );
    }

    // actionの検証 (Q&Aは現在viewのみ)
    if (action !== 'view') {
      return NextResponse.json(
        { error: 'action must be "view"' },
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
          .eq('created_by', user.id)
          .single();
        
        if (orgData) {
          company_id = orgData.id;
        }
      }
    } catch (error) {
      // 認証エラーは無視（匿名ユーザーも許可）
      logger.debug('Authentication check failed, proceeding as anonymous user');
    }

    // 統計データの挿入
    const statsData = {
      qna_id,
      user_id,
      company_id,
      action: action as QAStatsAction,
      user_agent: user_agent || request.headers.get('user-agent') || '',
      ip_address: ip_address.split(',')[0].trim(), // 複数IPの場合は最初のもの
    };

    const { data, error } = await serviceSupabase
      .from('qna_stats')
      .insert([statsData])
      .select()
      .single();

    if (error) {
      logger.error('Error inserting Q&A stats', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Failed to log Q&A action' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: {
        id: data.id,
        action: data.action,
        created_at: data.created_at
      }
    });

  } catch (error) {
    logger.error('Q&A stats API error', { data: error instanceof Error ? error : new Error(String(error)) });
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
    const qna_id = url.searchParams.get('qna_id');
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let query = supabase
      .from('qna_stats')
      .select(`
        *,
        qa_entries!inner(
          id,
          question,
          organization_id,
          category_id,
          organizations!inner(name),
          qa_categories(name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (qna_id) {
      query = query.eq('qna_id', qna_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching Q&A stats', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Failed to fetch Q&A stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    logger.error('Q&A stats fetch error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}