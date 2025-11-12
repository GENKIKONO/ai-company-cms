import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/log';

async function count(supabase: any, table: string, orgId: string, where?: Record<string, any>) {
  try {
    let q = supabase
      .from(table)
      .select('updated_at', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (where) {
      Object.entries(where).forEach(([k, v]) => {
        q = q.eq(k, v);
      });
    }
    
    const { data, count: totalCount, error } = await q;
    
    if (error) throw error;
    
    return { 
      count: totalCount ?? 0, 
      latest: data?.[0]?.updated_at ?? '' 
    };
  } catch (error) {
    logger.error(`Error counting ${table}:`, error);
    // テーブルが存在しない場合は0を返す
    return { count: 0, latest: '' };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return new NextResponse('orgId required', { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // service role keyを使用
    );

    // 様々なコンテンツテーブルをチェック
    const tables = ['posts', 'services', 'case_studies', 'faqs', 'contacts'];
    const results = [];

    for (const table of tables) {
      try {
        const result = await count(supabase, table, orgId);
        results.push({
          type: table,
          count: result.count,
          latest: result.latest
        });
      } catch (error) {
        logger.error(`Failed to count ${table}:`, error);
        // エラーの場合は0として記録
        results.push({
          type: table,
          count: 0,
          latest: ''
        });
      }
    }

    // CSVヘッダー
    const header = 'type,total,latest_updated_at';
    
    // CSVデータ行
    const csvRows = results.map(r => 
      `${r.type},${r.count},${r.latest}`
    );
    
    const csv = [header, ...csvRows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_${orgId}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (e: any) {
    logger.error('Export API error:', e);
    return new NextResponse(`error,${e.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/csv'
      }
    });
  }
}