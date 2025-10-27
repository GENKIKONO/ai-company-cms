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
      // 総数を取得
      const { count: totalCount, error: totalError } = await supabase
        .from('case_studies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (totalError) {
        logger.error('Total count error:', totalError);
        // テーブルが存在しない場合は0を返す
        return NextResponse.json({ total: 0, published: 0 });
      }

      // 公開済み数を取得
      const { count: publishedCount, error: publishedError } = await supabase
        .from('case_studies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_published', true);

      if (publishedError) {
        logger.error('[VERIFY] Published count error for case studies:', {
          orgId,
          error: publishedError.message,
          code: publishedError.code
        });
        // エラーの場合は総数のみ返す
        return NextResponse.json({ total: totalCount ?? 0, published: 0 });
      }

      return NextResponse.json({ 
        total: totalCount ?? 0, 
        published: publishedCount ?? 0 
      });
    } catch (error: any) {
      logger.error('Case studies stats error', error instanceof Error ? error : new Error(String(error)));
      
      // PostgreSQLエラーコード42P01は「テーブルが存在しない」
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ total: 0, published: 0 });
      }
      
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch case studies stats' 
      }, { status: 500 });
    }
  } catch (error: any) {
    logger.error('API route error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}