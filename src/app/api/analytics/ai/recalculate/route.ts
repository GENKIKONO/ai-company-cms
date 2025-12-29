/**
 * AI Visibility Score Recalculation API
 * AI Visibility Score の再計算を実行
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuthError, createInternalError, generateErrorId } from '@/lib/utils/data-normalization';
import { logger } from '@/lib/utils/logger';
import { calculateAllVisibilityScores, calculateVisibilityScore } from '@/lib/utils/ai-visibility-calculator';

export const dynamic = 'force-dynamic';

// Request/Response types
interface RecalculateRequest {
  organization_id?: string;
  url?: string; // 特定URLのみ再計算
  force_recalculate?: boolean;
  period_days?: number; // デフォルト30日
}

interface RecalculateResponse {
  success: boolean;
  processed_urls: number;
  calculation_id: string;
  estimated_completion: string;
  failed_urls?: string[];
}

// POST - AI Visibility Score 再計算実行
export async function POST(request: NextRequest) {
  const calculationId = generateErrorId('recalculate-visibility');
  
  try {
    const supabase = await createClient();
    
    // 管理者認証チェック（テスト用に一時無効化）
    // TODO: 本格運用時は requireUserWithClient 経由の認証チェックを有効化 + Pro以上プラン制限

    const body: RecalculateRequest = await request.json();
    
    // バリデーション
    if (!body.organization_id) {
      return NextResponse.json(
        { error: 'Validation error', message: 'organization_id is required' },
        { status: 400 }
      );
    }

    const periodDays = body.period_days || 30;
    const forceRecalculate = body.force_recalculate || false;

    logger.info('AI Visibility Score recalculation started', {
      calculationId,
      orgId: body.organization_id,
      url: body.url,
      periodDays,
      forceRecalculate,
    });

    let processedUrls = 0;
    const failedUrls: string[] = [];

    if (body.url) {
      // 特定URL のみ再計算
      try {
        const score = await calculateVisibilityScore({
          orgId: body.organization_id,
          url: body.url,
          periodDays,
        });

        // 結果をDBに保存
        await saveIndividualScore(body.organization_id, body.url, score);
        processedUrls = 1;

        logger.info('Single URL score calculation completed', {
          calculationId,
          url: body.url,
          totalScore: score.total_visibility_score,
        });

      } catch (error) {
        logger.error('Failed to calculate score for single URL', {
          calculationId,
          url: body.url,
          error,
        });
        failedUrls.push(body.url);
      }

    } else {
      // 組織内全URL の再計算
      try {
        // 1. 対象URL一覧を取得
        const targetUrls = await getTargetUrls(body.organization_id, forceRecalculate);
        
        logger.info('Target URLs identified for recalculation', {
          calculationId,
          urlCount: targetUrls.length,
        });

        // 2. 各URLに対してスコア計算・保存
        for (const url of targetUrls) {
          try {
            const score = await calculateVisibilityScore({
              orgId: body.organization_id,
              url,
              periodDays,
            });

            await saveIndividualScore(body.organization_id, url, score);
            processedUrls++;

            // 進捗ログ（大量URL処理時のモニタリング用）
            if (processedUrls % 10 === 0) {
              logger.info('Bulk calculation progress', {
                calculationId,
                processed: processedUrls,
                total: targetUrls.length,
              });
            }

          } catch (error) {
            logger.warn('Failed to calculate score for URL', {
              calculationId,
              url,
              error: error instanceof Error ? error.message : error,
            });
            failedUrls.push(url);
          }
        }

      } catch (error) {
        logger.error('Failed to execute bulk recalculation', {
          calculationId,
          error,
        });
        throw error;
      }
    }

    // audit log 記録
    const auditLogData = {
      action: 'recalculate_ai_visibility_scores',
      target_type: 'ai_visibility_scores',
      user_id: 'test-user', // authData.user.id,
      metadata: {
        calculation_id: calculationId,
        organization_id: body.organization_id,
        processed_urls: processedUrls,
        failed_urls: failedUrls,
        period_days: periodDays,
        force_recalculate: forceRecalculate,
        timestamp: new Date().toISOString(),
      },
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([auditLogData]);

    if (auditError) {
      logger.warn('Failed to create audit log for recalculation', { 
        calculationId, 
        error: auditError 
      });
    }

    const response: RecalculateResponse = {
      success: true,
      processed_urls: processedUrls,
      calculation_id: calculationId,
      estimated_completion: new Date().toISOString(),
      ...(failedUrls.length > 0 && { failed_urls: failedUrls }),
    };

    logger.info('AI Visibility Score recalculation completed', {
      calculationId,
      processedUrls,
      failedCount: failedUrls.length,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('[POST /api/analytics/ai/recalculate] Unexpected error:', { 
      calculationId, 
      error 
    });
    return createInternalError(calculationId);
  }
}

/**
 * 再計算対象URLを取得
 */
async function getTargetUrls(orgId: string, forceRecalculate: boolean): Promise<string[]> {
  const supabase = await createClient();

  if (forceRecalculate) {
    // 強制再計算: 全URL対象
    const { data: allUrls, error } = await supabase
      .rpc('get_distinct_urls_for_org', { target_org_id: orgId }); // ALLOWED: RPC parameter

    if (error) {
      // RPC関数がない場合のフォールバック
      const [contentUrls, logUrls] = await Promise.all([
        supabase.from('ai_content_units').select('url').eq('organization_id', orgId),
        supabase.from('ai_bot_logs').select('url').eq('organization_id', orgId),
      ]);

      const urls = new Set([
        ...(contentUrls.data || []).map(item => item.url),
        ...(logUrls.data || []).map(item => item.url),
      ]);

      return Array.from(urls);
    }

    return allUrls.map((item: any) => item.url);

  } else {
    // 通常再計算: 24時間以内にスコア計算されていないURLのみ
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentScores, error } = await supabase
      .from('ai_visibility_scores')
      .select('url')
      .eq('organization_id', orgId)
      .gte('calculated_at', yesterday.toISOString());

    if (error) {
      throw error;
    }

    const recentUrls = new Set((recentScores || []).map(score => score.url));

    // 全URLから最近計算済みURLを除外
    const allUrls = await getTargetUrls(orgId, true);
    return allUrls.filter(url => !recentUrls.has(url));
  }
}

/**
 * 個別スコアをDBに保存
 */
async function saveIndividualScore(
  orgId: string, 
  url: string, 
  score: any
): Promise<void> {
  const supabase = await createClient();

  // Content Unit ID を取得
  const { data: contentUnit } = await supabase
    .from('ai_content_units')
    .select('id')
    .eq('organization_id', orgId)
    .eq('url', url)
    .single();

  const { error } = await supabase
    .from('ai_visibility_scores')
    .upsert({
      organization_id: orgId,
      url: url,
      content_unit_id: contentUnit?.id || null,
      structured_data_score: score.structured_data_score,
      ai_access_score: score.ai_access_score,
      seo_performance_score: score.seo_performance_score,
      total_visibility_score: score.total_visibility_score,
      calculation_period_start: score.calculation_period_start,
      calculation_period_end: score.calculation_period_end,
      ai_bot_hits_count: score.ai_bot_hits_count,
      unique_bots_count: score.unique_bots_count,
    }, {
      onConflict: 'organization_id,url,calculated_at::DATE'
    });

  if (error) {
    throw error;
  }
}