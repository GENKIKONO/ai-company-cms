/**
 * AI引用ログ機能
 * AIの回答内容とそれに紐づく引用元コンテンツをデータベースに記録する
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

// Supabase型定義のエイリアス
type CitationsResponseRow = any;
type CitationsResponseInsert = any;
type CitationsItemRow = any;
type CitationsItemInsert = any;

// エクスポート用の型定義
export interface AiCitationItemInput {
  contentUnitId: string;
  weight?: number | null;
  quotedTokens?: number | null;
  quotedChars?: number | null;
  fragmentHint?: string | null;
  locale?: string | null;
}

export interface LogAiResponseInput {
  organizationId?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  modelName: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  quotedTokensTotal?: number | null;
  quotedCharsTotal?: number | null;
  items: AiCitationItemInput[];
  meta?: Record<string, unknown>;
}

export interface LogAiResponseResult {
  responseId: string;
  itemsInserted: number;
}

/**
 * UUID形式かをチェックする簡易バリデーション
 */
function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * 入力値の基本的なバリデーション
 */
function validateInput(input: LogAiResponseInput): void {
  if (!input.modelName || typeof input.modelName !== 'string' || input.modelName.trim() === '') {
    throw new Error('modelName is required and must be a non-empty string');
  }

  if (!Array.isArray(input.items)) {
    throw new Error('items must be an array');
  }

  // UUID形式のチェック（organizationId, sessionIdがある場合のみ）
  if (input.organizationId && !isValidUuid(input.organizationId)) {
    throw new Error('organizationId must be a valid UUID format');
  }

  if (input.sessionId && !isValidUuid(input.sessionId)) {
    throw new Error('sessionId must be a valid UUID format');
  }

  // itemsの各要素のバリデーション
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.contentUnitId || typeof item.contentUnitId !== 'string') {
      throw new Error(`items[${i}].contentUnitId is required and must be a string`);
    }
    if (!isValidUuid(item.contentUnitId)) {
      throw new Error(`items[${i}].contentUnitId must be a valid UUID format`);
    }
  }
}

/**
 * AIの回答と引用情報をログに記録する
 */
export async function logAiResponseWithCitations(input: LogAiResponseInput): Promise<LogAiResponseResult> {
  try {
    // 入力値バリデーション
    validateInput(input);

    const supabase = await createClient();

    // 1) ai_citations_responses に1行挿入
    const responsePayload: CitationsResponseInsert = {
      organization_id: input.organizationId || null,
      session_id: input.sessionId || null,
      request_id: input.requestId || null,
      model_name: input.modelName,
      prompt_tokens: input.promptTokens || null,
      completion_tokens: input.completionTokens || null,
      quoted_tokens: input.quotedTokensTotal || null,
      quoted_chars: input.quotedCharsTotal || null,
    };

    const { data: responseRow, error: responseError } = await supabase
      .from('ai_citations_responses')
      .insert(responsePayload)
      .select('id')
      .single();

    if (responseError) {
      logger.error('Failed to insert ai_citations_responses', {
        data: {
          error: responseError,
          payload: {
            ...responsePayload,
            meta: input.meta ? 'present' : 'none'
          }
        }
      });
      throw new Error(`Failed to insert response record: ${responseError.message}`);
    }

    if (!responseRow || !responseRow.id) {
      throw new Error('Failed to get response ID after insertion');
    }

    const responseId = responseRow.id;
    
    // 2) itemsが空の場合はここで終了
    if (input.items.length === 0) {
      logger.info('AI response logged without citation items', {
        data: {
          responseId,
          modelName: input.modelName,
          hasMeta: !!input.meta,
          sessionId: input.sessionId ? `***-session-***` : null
        }
      });
      return { responseId, itemsInserted: 0 };
    }

    // 3) ai_citations_items に複数行挿入
    const itemsPayload: CitationsItemInsert[] = input.items.map(item => ({
      response_id: responseId,
      content_unit_id: item.contentUnitId,
      weight: item.weight || null,
      quoted_tokens: item.quotedTokens || null,
      quoted_chars: item.quotedChars || null,
      fragment_hint: item.fragmentHint || null,
      locale: item.locale || null,
    }));

    const { data: itemsResult, error: itemsError } = await supabase
      .from('ai_citations_items')
      .insert(itemsPayload)
      .select('id');

    // 4) items挿入でエラーが出た場合はロールバック
    if (itemsError) {
      logger.error('Failed to insert ai_citations_items, rolling back', {
        data: {
          error: itemsError,
          responseId,
          itemsCount: itemsPayload.length
        }
      });

      // response行を削除してロールバック
      const { error: rollbackError } = await supabase
        .from('ai_citations_responses')
        .delete()
        .eq('id', responseId);

      if (rollbackError) {
        logger.error('Failed to rollback ai_citations_responses', {
          data: {
            rollbackError,
            responseId
          }
        });
      }

      throw new Error(`Failed to insert citation items: ${itemsError.message}`);
    }

    const itemsInserted = itemsResult?.length || 0;

    // 5) 成功ログ記録
    logger.info('AI response with citations logged successfully', {
      data: {
        responseId,
        itemsInserted,
        modelName: input.modelName,
        hasMeta: !!input.meta,
        sessionId: input.sessionId ? `***-session-***` : null,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens
      }
    });

    return { responseId, itemsInserted };

  } catch (error) {
    logger.error('Error in logAiResponseWithCitations', {
      data: {
        error: error instanceof Error ? error : new Error(String(error)),
        modelName: input?.modelName,
        itemsCount: input?.items?.length,
        hasMeta: !!input?.meta
      }
    });
    throw error;
  }
}

/**
 * 引用ログのサマリー情報を取得する（将来の拡張用）
 */
export async function getCitationsSummary(responseId: string): Promise<CitationsResponseRow | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('ai_citations_responses')
      .select('*')
      .eq('id', responseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`Failed to fetch citations summary: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error('Error in getCitationsSummary', {
      data: { error, responseId }
    });
    throw error;
  }
}