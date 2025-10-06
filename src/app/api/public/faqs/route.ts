/**
 * 公開FAQ一覧API
 * REQ-AIO-06: OpenAPIスキーマ対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const supabase = await supabaseServer();
    
    let query = supabase
      .from('faqs')
      .select(`
        id,
        question,
        answer,
        category,
        sort_order,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    // カテゴリフィルタ
    if (category) {
      query = query.eq('category', category);
    }

    // 件数制限
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: faqs, error, count } = await query;

    if (error) {
      console.error('Public FAQs API error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        faqs: faqs || [],
        total: count || 0
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300', // 5分キャッシュ
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );

  } catch (error) {
    console.error('Public FAQs API failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}