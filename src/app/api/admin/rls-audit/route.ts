import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * RLS監査API - 簡易UI用エンドポイント
 * ローカル・開発環境のみで動作する軽量監査API
 */

// 検証対象テーブル
const TARGET_TABLES = ['posts', 'services', 'case_studies', 'faqs'];

// 必須カラム
const REQUIRED_COLUMNS = ['organization_id', 'created_by', 'created_at', 'updated_at'];

export async function GET() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = await supabaseServer();

    const summary: Record<string, any> = {};

    // 各テーブルの簡易チェック
    for (const tableName of TARGET_TABLES) {
      try {
        // カラム存在確認
        const { data: columns, error: columnError } = await supabase.rpc('sql', {
          query: `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = '${tableName}'
              AND column_name IN (${REQUIRED_COLUMNS.map(c => `'${c}'`).join(',')})
          `
        });

        if (columnError) throw columnError;

        const foundColumns = columns?.map((row: any) => row.column_name) || [];
        const hasColumns = REQUIRED_COLUMNS.every(col => foundColumns.includes(col));

        // RLS有効性確認
        const { data: rlsData, error: rlsError } = await supabase.rpc('sql', {
          query: `
            SELECT rowsecurity as rls_enabled
            FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename = '${tableName}'
          `
        });

        if (rlsError) throw rlsError;

        const rls = rlsData?.[0]?.rls_enabled || false;

        // ポリシー存在確認
        const { data: policyData, error: policyError } = await supabase.rpc('sql', {
          query: `
            SELECT COUNT(*) as policy_count
            FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = '${tableName}'
          `
        });

        if (policyError) throw policyError;

        const hasPolicies = (policyData?.[0]?.policy_count || 0) > 0;

        summary[tableName] = {
          hasColumns,
          rls,
          hasPolicies,
          foundColumns,
          missingColumns: REQUIRED_COLUMNS.filter(col => !foundColumns.includes(col))
        };

      } catch (error) {
        summary[tableName] = {
          hasColumns: false,
          rls: false,
          hasPolicies: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // 全体的な成功判定
    const allOk = Object.values(summary).every((table: any) => 
      table.hasColumns && table.rls && table.hasPolicies && !table.error
    );

    return NextResponse.json({
      ok: allOk,
      timestamp: new Date().toISOString(),
      summary,
      environment: process.env.NODE_ENV || 'unknown',
      note: 'This is a lightweight audit. Run `npm run audit:rls` for detailed analysis.'
    });

  } catch (error) {
    console.error('RLS Audit API Error:', error);
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}