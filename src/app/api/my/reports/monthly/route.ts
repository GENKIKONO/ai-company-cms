/**
 * /api/my/reports/monthly - レポート一覧取得
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';

import { canUseFeature } from '@/lib/featureGate';
import { logger } from '@/lib/utils/logger';

// レポート一覧取得
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    // ユーザーの組織メンバーシップを取得（Supabase Q1回答準拠）
    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membershipData?.organization_id) {
      return applyCookies(
        NextResponse.json({ error: 'Organization membership not found' }, { status: 404 })
      );
    }

    const organizationId = membershipData.organization_id;

    // AIレポート機能のアクセス制御チェック
    try {
      const canUse = await canUseFeature(organizationId, 'ai_reports');

      if (!canUse) {
        return applyCookies(
          NextResponse.json(
            {
              error: 'FeatureNotAvailable',
              message: 'ご利用中のプランではAIレポート機能はご利用いただけません。'
            },
            { status: 403 }
          )
        );
      }
    } catch (error) {
      logger.error('AI reports feature check failed:', { data: error });
      // NOTE: AIレポート機能チェックでエラー時は禁止側に倒す
      return applyCookies(
        NextResponse.json(
          {
            error: 'FeatureCheckFailed',
            message: '機能チェックに失敗しました。しばらくしてからお試しください。'
          },
          { status: 403 }
        )
      );
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '12', 10);

    // 直近のレポート一覧を取得
    const { data: reports, error } = await supabase
      .from('ai_monthly_reports')
      .select(`
        id,
        plan_id,
        level,
        period_start,
        period_end,
        status,
        metrics,
        summary_text,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      logger.error('Failed to query ai_monthly_reports:', { data: error });
      return applyCookies(
        NextResponse.json(
          {
            error: 'Failed to fetch reports',
            details: error.message
          },
          { status: 500 }
        )
      );
    }

    return applyCookies(
      NextResponse.json({
        reports: reports || [],
        organization_id: organizationId,
      })
    );

  } catch (error) {
    // ApiAuthException のハンドリング
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Failed to fetch monthly reports:', { data: error });
    return NextResponse.json(
      {
        error: 'Failed to fetch reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
