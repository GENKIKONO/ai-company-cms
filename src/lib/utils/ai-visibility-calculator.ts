/**
 * AI Visibility Score Calculator
 * Phase 2: AI Visibility Score 計算ロジック
 */

import { supabaseServer } from '@/lib/supabase-server';
import { logger } from './logger';

export interface VisibilityScoreInput {
  orgId: string;
  url: string;
  contentUnitId?: string;
  periodDays?: number; // デフォルト30日
}

export interface VisibilityScoreResult {
  structured_data_score: number;
  ai_access_score: number;
  seo_performance_score: number;
  total_visibility_score: number;
  ai_bot_hits_count: number;
  unique_bots_count: number;
  calculation_period_start: string;
  calculation_period_end: string;
}

export interface ContentUnitData {
  id: string;
  structured_data_complete: boolean;
  title: string | null;
  content_type: string;
}

export interface AIAccessData {
  hit_count: number;
  unique_bots: string[];
}

/**
 * AI Visibility Score を計算
 */
export async function calculateVisibilityScore(
  input: VisibilityScoreInput
): Promise<VisibilityScoreResult> {
  const periodDays = input.periodDays || 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodDays);

  try {
    // 1. Content Unit データ取得
    const contentData = await getContentUnitData(input.orgId, input.url, input.contentUnitId);
    
    // 2. AI アクセスデータ取得
    const accessData = await getAIAccessData(input.orgId, input.url, startDate, endDate);
    
    // 3. スコア計算
    const structuredDataScore = calculateStructuredDataScore(contentData);
    const aiAccessScore = calculateAIAccessScore(accessData.hit_count);
    const seoPerformanceScore = calculateSEOPerformanceScore(); // Phase 3で実装予定
    
    // 4. 総合スコア計算（重み付け平均）
    const totalScore = Math.round(
      structuredDataScore * 0.3 + 
      aiAccessScore * 0.5 + 
      seoPerformanceScore * 0.2
    );

    return {
      structured_data_score: structuredDataScore,
      ai_access_score: aiAccessScore,
      seo_performance_score: seoPerformanceScore,
      total_visibility_score: totalScore,
      ai_bot_hits_count: accessData.hit_count,
      unique_bots_count: accessData.unique_bots.length,
      calculation_period_start: startDate.toISOString(),
      calculation_period_end: endDate.toISOString(),
    };

  } catch (error) {
    logger.error('Failed to calculate visibility score', { 
      error, 
      orgId: input.orgId, 
      url: input.url 
    });
    throw error;
  }
}

/**
 * Content Unit データを取得
 */
async function getContentUnitData(
  orgId: string, 
  url: string, 
  contentUnitId?: string
): Promise<ContentUnitData | null> {
  const supabase = await supabaseServer();

  let query = supabase
    .from('ai_content_units')
    .select('id, structured_data_complete, title, content_type')
    .eq('org_id', orgId)
    .eq('url', url);

  if (contentUnitId) {
    query = query.eq('id', contentUnitId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error;
  }

  return data;
}

/**
 * AI アクセスデータを取得（指定期間内）
 */
async function getAIAccessData(
  orgId: string,
  url: string,
  startDate: Date,
  endDate: Date
): Promise<AIAccessData> {
  const supabase = await supabaseServer();

  const { data: logs, error } = await supabase
    .from('ai_bot_logs')
    .select('bot_name')
    .eq('org_id', orgId)
    .eq('url', url)
    .gte('accessed_at', startDate.toISOString())
    .lte('accessed_at', endDate.toISOString());

  if (error) {
    throw error;
  }

  const botNames = (logs || []).map(log => log.bot_name);
  const uniqueBots = [...new Set(botNames)];

  return {
    hit_count: logs?.length || 0,
    unique_bots: uniqueBots,
  };
}

/**
 * 構造化データスコア計算
 * structured_data_complete ? 100 : 50
 */
function calculateStructuredDataScore(contentData: ContentUnitData | null): number {
  if (!contentData) {
    return 0; // Content Unit未作成 = 構造化データなし
  }

  return contentData.structured_data_complete ? 100 : 50;
}

/**
 * AI アクセススコア計算
 * min(log_count_last30d * 5, 100)
 */
function calculateAIAccessScore(hitCount: number): number {
  return Math.min(hitCount * 5, 100);
}

/**
 * SEO パフォーマンススコア計算
 * Phase 3 で GSC連携時に実装
 * 現在は仮値を返す
 */
function calculateSEOPerformanceScore(): number {
  // Phase 2 では仮値として 50 を返す
  // Phase 3 で GSC の average_position を使用
  // average_position < 10 ? 100 : 50
  return 50;
}

/**
 * 組織内の全URLに対してスコア計算を実行
 */
export async function calculateAllVisibilityScores(
  orgId: string,
  periodDays: number = 30
): Promise<VisibilityScoreResult[]> {
  const supabase = await supabaseServer();

  // 1. 対象URL一覧を取得（ai_content_units + ai_bot_logs から）
  const { data: uniqueUrls, error } = await supabase
    .from('ai_content_units')
    .select('url')
    .eq('org_id', orgId)
    .union(
      supabase
        .from('ai_bot_logs')
        .select('url')
        .eq('org_id', orgId)
    );

  if (error) {
    throw error;
  }

  const urls = [...new Set((uniqueUrls || []).map(item => item.url))];
  
  // 2. 各URLに対してスコア計算
  const results: VisibilityScoreResult[] = [];
  
  for (const url of urls) {
    try {
      const result = await calculateVisibilityScore({
        orgId,
        url,
        periodDays,
      });
      results.push(result);
    } catch (error) {
      logger.warn('Failed to calculate score for URL', { error, orgId, url });
      // 個別URL失敗は警告として扱い、処理継続
    }
  }

  return results;
}

/**
 * 計算結果をDBに保存
 */
export async function saveVisibilityScores(
  orgId: string,
  scores: VisibilityScoreResult[],
  url: string
): Promise<void> {
  const supabase = await supabaseServer();

  // Content Unit IDを取得
  const { data: contentUnit } = await supabase
    .from('ai_content_units')
    .select('id')
    .eq('org_id', orgId)
    .eq('url', url)
    .single();

  const scoreData = scores.map(score => ({
    org_id: orgId,
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
  }));

  const { error } = await supabase
    .from('ai_visibility_scores')
    .upsert(scoreData, {
      onConflict: 'org_id,url,calculated_at::DATE'
    });

  if (error) {
    throw error;
  }
}