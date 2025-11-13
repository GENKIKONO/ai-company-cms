/**
 * 公開FAQ一覧API
 * REQ-AIO-06: OpenAPIスキーマ対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

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
      logger.error('Public FAQs API error', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // レスポンス正規化（OpenAPIスキーマ適合）
    const normalizedFaqs = (faqs || []).map(faq => ({
      id: faq.id,
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || null,
      sort_order: faq.sort_order ?? 0, // DBマイグレーション後はデフォルト値あり
      status: faq.status,
      created_at: faq.created_at,
      updated_at: faq.updated_at
    }));

    return NextResponse.json(
      {
        faqs: normalizedFaqs,
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
    logger.error('Public FAQs API failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}