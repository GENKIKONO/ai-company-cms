import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // service role keyを使用
    );

    try {
      // 直近5件のアクティビティを取得
      const { data, error } = await supabase
        .from('activities')
        .select('id, message, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        logger.error('Activities fetch error', error instanceof Error ? error : new Error(String(error)));
        
        // テーブルが存在しない場合は空配列を返す
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return NextResponse.json([]);
        }
        
        return NextResponse.json({ 
          error: error.message 
        }, { status: 500 });
      }

      return NextResponse.json(data || []);
    } catch (error: any) {
      logger.error('Activities API error', error instanceof Error ? error : new Error(String(error)));
      
      // PostgreSQLエラーコード42P01は「テーブルが存在しない」
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch activities' 
      }, { status: 500 });
    }
  } catch (error: any) {
    logger.error('API route error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}