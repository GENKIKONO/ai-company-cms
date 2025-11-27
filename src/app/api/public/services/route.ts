/**
 * 公開サービス一覧API
 * REQ-AIO-06: OpenAPIスキーマ対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();
    
    // 公開サービスを取得（実テーブル基準 - 存在するカラムのみ）
    const { data: services, error, count } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        status,
        created_at,
        updated_at,
        organization_id
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Public services API error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // レスポンス正規化（実テーブル基準 - 安全なnull対応）
    const normalizedServices = (services || []).map(service => ({
      id: service.id,
      name: service.name || '',
      description: service.description || null,
      status: service.status,
      organization_id: service.organization_id || null,
      created_at: service.created_at,
      updated_at: service.updated_at,
      // 将来追加予定のフィールド（null安全）
      category: null,
      features: null,
      price: null,
      cta_url: null
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
    logger.error('Public services API failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}