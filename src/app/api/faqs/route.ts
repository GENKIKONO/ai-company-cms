// FAQ作成API
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
    const { question, answer, category, sort_order } = body;

    if (!question || !answer) {
      return NextResponse.json({
        ok: false,
        error: 'question and answer are required'
      }, { status: 400 });
    }

    // データベース挿入
    try {
      const payload = {
        organization_id: orgData.id,
        question,
        answer,
        category: category || null,
        sort_order: sort_order ? parseInt(sort_order, 10) : 0,
        created_by: user.id, // ← ここで必ず設定（認証済みユーザーID）
      };

      const { data, error } = await supabase
        .from('faqs')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Postgres error 42P01 = relation does not exist
        if (error.code === '42P01') {
          return NextResponse.json({
            ok: false,
            error: 'faqsテーブルが存在しません',
            sqlHint: `
-- Supabaseダッシュボードで以下のSQLを実行してください:

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Users can manage their org faqs"
ON public.faqs
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
        message: 'FAQを作成しました'
      }, { status: 201 });

    } catch (dbError) {
      logger.error('Database error:', dbError);
      return NextResponse.json({
        ok: false,
        error: 'データベースエラーが発生しました'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('FAQs API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}