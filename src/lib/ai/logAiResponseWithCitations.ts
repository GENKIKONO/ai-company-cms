/**
 * Phase 2-3: AI Citations & Generation Stats Logging
 * 
 * OpenAI API呼び出し結果のログ保存ユーティリティ
 * ai_citations_responses/items と ai_generation_stats へのデータ保存
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { CitationItem, FinalizeResult } from './openai-interview';

export interface LogAiResponseParams {
  sessionId: string;
  organizationId: string | null;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  success: boolean;
  citations?: CitationItem[];
  error?: any;
}

export interface LogGenerationStatsParams {
  sessionId: string;
  organizationId: string | null;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  success: boolean;
  costUsd?: number | null;
  error?: any;
}

/**
 * AI Citations Response/Items のログ保存
 * 
 * ai_citations_responses テーブルに1レコード作成し、
 * 関連するcitationsを ai_citations_items に一括保存
 */
export async function logAiResponseWithCitations(params: LogAiResponseParams): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      sessionId,
      organizationId,
      userId,
      model,
      inputTokens,
      outputTokens,
      durationMs,
      success,
      citations = [],
      error
    } = params;

    // 1) ai_citations_responses にメインレスポンスを保存
    const { data: responseData, error: responseError } = await supabase
      .from('ai_citations_responses')
      .insert({
        session_id: sessionId,
        organization_id: organizationId,
        user_id: userId,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        duration_ms: durationMs,
        success,
        error: error ? (typeof error === 'object' ? error : { message: String(error) }) : null,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (responseError) {
      logger.error('Failed to log AI citations response', {
        sessionId,
        error: responseError,
        model,
        success
      });
      throw responseError;
    }

    const responseId = responseData.id;

    // 2) ai_citations_items に引用情報を一括保存
    if (citations.length > 0) {
      const citationItems = citations.map(citation => ({
        response_id: responseId,
        source_type: citation.type,
        source_id: citation.sourceId || null,
        uri: citation.uri || null,
        title: citation.title || null,
        snippet: citation.snippet || null,
        meta: citation.meta ? citation.meta : null,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('ai_citations_items')
        .insert(citationItems);

      if (itemsError) {
        logger.error('Failed to log AI citations items', {
          sessionId,
          responseId,
          citationsCount: citations.length,
          error: itemsError
        });
        // citations_items の保存に失敗してもresponseは保存済みなので、エラーをログに記録するのみ
      } else {
        logger.debug('AI citations logged successfully', {
          sessionId,
          responseId,
          citationsCount: citations.length
        });
      }
    }

    logger.info('AI response with citations logged', {
      sessionId,
      responseId,
      model,
      success,
      inputTokens,
      outputTokens,
      durationMs,
      citationsCount: citations.length
    });

  } catch (error) {
    logger.error('Failed to log AI response with citations', {
      sessionId: params.sessionId,
      model: params.model,
      error: error instanceof Error ? error.message : error
    });
    // ログ保存失敗は本体処理をブロックしない
  }
}

/**
 * AI Generation Stats の保存
 * 
 * ai_generation_stats テーブルに統計データを保存
 * 組織レベルでの集計・分析用
 */
export async function logGenerationStats(params: LogGenerationStatsParams): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      sessionId,
      organizationId,
      userId,
      model,
      inputTokens,
      outputTokens,
      durationMs,
      success,
      costUsd = null,
      error
    } = params;

    const { error: statsError } = await supabase
      .from('ai_generation_stats')
      .insert({
        session_id: sessionId,
        organization_id: organizationId,
        user_id: userId,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        duration_ms: durationMs,
        cost_usd: costUsd,
        success,
        error: error ? (typeof error === 'object' ? error : { message: String(error) }) : null,
        created_at: new Date().toISOString()
      });

    if (statsError) {
      logger.error('Failed to log generation stats', {
        sessionId,
        model,
        success,
        error: statsError
      });
      throw statsError;
    }

    logger.debug('Generation stats logged successfully', {
      sessionId,
      model,
      success,
      inputTokens,
      outputTokens,
      durationMs,
      costUsd
    });

  } catch (error) {
    logger.error('Failed to log generation stats', {
      sessionId: params.sessionId,
      model: params.model,
      error: error instanceof Error ? error.message : error
    });
    // ログ保存失敗は本体処理をブロックしない
  }
}

/**
 * Content Units の保存
 * 
 * ai_content_units テーブルに長文コンテンツをセクション分割して保存
 * TODO: 必要に応じて使用（generated_content が短い場合は不要）
 */
export async function logContentUnits(params: {
  sessionId: string;
  organizationId: string | null;
  userId: string;
  sections: Array<{
    key: string;
    title?: string;
    content: string;
    meta?: any;
  }>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { sessionId, organizationId, userId, sections } = params;

    if (sections.length === 0) {
      return;
    }

    const contentUnits = sections.map((section, index) => ({
      session_id: sessionId,
      organization_id: organizationId,
      user_id: userId,
      section_key: section.key,
      title: section.title || null,
      content: section.content,
      order_no: index,
      meta: section.meta || null,
      created_at: new Date().toISOString()
    }));

    const { error: unitsError } = await supabase
      .from('ai_content_units')
      .insert(contentUnits);

    if (unitsError) {
      logger.error('Failed to log content units', {
        sessionId,
        sectionsCount: sections.length,
        error: unitsError
      });
      throw unitsError;
    }

    logger.info('Content units logged successfully', {
      sessionId,
      sectionsCount: sections.length
    });

  } catch (error) {
    logger.error('Failed to log content units', {
      sessionId: params.sessionId,
      error: error instanceof Error ? error.message : error
    });
    // ログ保存失敗は本体処理をブロックしない
  }
}

/**
 * Phase 2-3: FinalizeResult対応の統合ログ保存関数
 */
export async function logFinalizeResult(params: {
  sessionId: string;
  organizationId: string | null;
  userId: string;
  finalizeResult: FinalizeResult;
  costUsd?: number | null;
}): Promise<void> {
  const { sessionId, organizationId, userId, finalizeResult, costUsd } = params;
  
  if (finalizeResult.success) {
    // 成功時のログ保存
    await logCompleteAiResponse({
      sessionId,
      organizationId,
      userId,
      model: finalizeResult.usedModel,
      inputTokens: finalizeResult.inputTokens,
      outputTokens: finalizeResult.outputTokens,
      durationMs: finalizeResult.durationMs,
      success: true,
      citations: finalizeResult.citations,
      contentSections: finalizeResult.structured?.sections,
      costUsd,
    });
  } else {
    // 失敗時のログ保存 - FinalizeResultの型をエラー型に絞り込み
    const errorResult = finalizeResult as Extract<FinalizeResult, { success: false }>;
    await logCompleteAiResponse({
      sessionId,
      organizationId,
      userId,
      model: 'failed',
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 0,
      success: false,
      citations: [],
      error: {
        code: errorResult.code,
        message: errorResult.message,
        detail: errorResult.detail
      }
    });
  }
}

/**
 * 全てのAI関連ログを一括で保存するヘルパー関数
 */
export async function logCompleteAiResponse(params: {
  sessionId: string;
  organizationId: string | null;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  success: boolean;
  citations?: CitationItem[];
  contentSections?: Array<{ key: string; title?: string; content: string; meta?: any; }>;
  costUsd?: number | null;
  error?: any;
}): Promise<void> {
  const {
    sessionId,
    organizationId,
    userId,
    model,
    inputTokens,
    outputTokens,
    durationMs,
    success,
    citations = [],
    contentSections = [],
    costUsd,
    error
  } = params;

  // 並行してログ保存を実行（失敗しても他の保存は継続）
  const logPromises = [
    // Citations & Response ログ
    logAiResponseWithCitations({
      sessionId,
      organizationId,
      userId,
      model,
      inputTokens,
      outputTokens,
      durationMs,
      success,
      citations,
      error
    }),
    
    // Generation Stats ログ
    logGenerationStats({
      sessionId,
      organizationId,
      userId,
      model,
      inputTokens,
      outputTokens,
      durationMs,
      success,
      costUsd,
      error
    })
  ];

  // Content Units ログ（セクション分割が必要な場合のみ）
  if (contentSections.length > 0) {
    logPromises.push(
      logContentUnits({
        sessionId,
        organizationId,
        userId,
        sections: contentSections
      })
    );
  }

  // 全てのログ保存を並行実行（個別の失敗は各関数内でハンドリング）
  await Promise.allSettled(logPromises);

  logger.info('AI response logging completed', {
    sessionId,
    model,
    success,
    citationsCount: citations.length,
    contentSectionsCount: contentSections.length
  });
}