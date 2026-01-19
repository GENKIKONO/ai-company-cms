/**
 * 公開導入事例一覧API
 * REQ-AIO-06: OpenAPIスキーマ対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tagsParam = searchParams.get('tags');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const supabase = await createClient();

    // 公開判定: is_published + published_at + deleted_at
    const nowISO = new Date().toISOString();

    // VIEW経由で公開導入事例を取得（SST強制）
    let query = supabase
      .from('v_case_studies_public')
      .select(`
        id,
        title,
        problem,
        solution,
        result,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('is_published', true)
      .or(`published_at.is.null,published_at.lte.${nowISO}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // 実テーブルではtagsカラムが存在しないためタグフィルタを無効化
    // if (tagsParam) {
    //   const tags = tagsParam.split(',').map(tag => tag.trim());
    //   for (const tag of tags) {
    //     query = query.contains('tags', [tag]);
    //   }
    // }

    // 件数制限
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: caseStudies, error, count } = await query;

    if (error) {
      logger.error('Public case studies API error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // レスポンス正規化（実テーブル基準）
    const normalizedCaseStudies = (caseStudies || []).map(caseStudy => ({
      id: caseStudy.id,
      title: caseStudy.title || '',
      problem: caseStudy.problem || null,
      solution: caseStudy.solution || null,
      result: caseStudy.result || null,
      created_at: caseStudy.created_at,
      updated_at: caseStudy.updated_at
    }));

    return NextResponse.json(
      {
        caseStudies: normalizedCaseStudies,
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
    logger.error('Public case studies API failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}