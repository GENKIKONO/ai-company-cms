/**
 * 公開サービス一覧API
 * REQ-AIO-06: OpenAPIスキーマ対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await supabaseServer();
    
    // 公開サービスを取得（実テーブル基準）
    const { data: services, error, count } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        category,
        features,
        cta_url,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Public services API error:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // レスポンス正規化（実テーブル基準）
    const normalizedServices = (services || []).map(service => ({
      id: service.id,
      name: service.name || '',
      description: service.description || null,
      category: service.category || null,
      features: service.features || null,
      cta_url: service.cta_url || null,
      status: service.status,
      created_at: service.created_at,
      updated_at: service.updated_at
    }));

    return NextResponse.json(
      {
        services: normalizedServices,
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
    console.error('Public services API failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}