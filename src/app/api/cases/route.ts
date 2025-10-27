// 導入事例作成API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // ユーザー認証
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // 組織情報取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({
        ok: false,
        error: 'Organization not found'
      }, { status: 404 });
    }

    // リクエストボディ解析
    const body = await request.json();
    const { title, summary, problem, solution, result, tags } = body;

    if (!title) {
      return NextResponse.json({
        ok: false,
        error: 'title is required'
      }, { status: 400 });
    }

    // データベース挿入
    try {
      const payload = {
        organization_id: orgData.id,
        title,
        problem: problem || null,
        solution: solution || null,
        result: result || null,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : null,
        created_by: user.id, // ← ここで必ず設定（認証済みユーザーID）
      };

      const { data, error } = await supabase
        .from('case_studies')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Postgres error 42P01 = relation does not exist
        if (error.code === '42P01') {
          return NextResponse.json({
            ok: false,
            error: 'case_studiesテーブルが存在しません',
            sqlHint: `
-- Supabaseダッシュボードで以下のSQLを実行してください:

CREATE TABLE IF NOT EXISTS public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Users can manage their org case studies"
ON public.case_studies
FOR ALL
USING (org_id IN (
  SELECT id FROM public.organizations WHERE user_id = auth.uid()
));
            `
          });
        }
        throw error;
      }

      return NextResponse.json({
        ok: true,
        data,
        message: '導入事例を作成しました'
      }, { status: 201 });

    } catch (dbError) {
      logger.error('Database error:', dbError);
      return NextResponse.json({
        ok: false,
        error: 'データベースエラーが発生しました'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Cases API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}