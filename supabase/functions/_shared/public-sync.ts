/**
 * public_* テーブル同期ロジック
 * P4-8: コンテンツ刷新パイプライン用
 * 
 * 機能:
 * 1. 各entity_typeに対応するpublic_*テーブルへのUPSERT
 * 2. 原文 + 翻訳データからのスナップショット生成
 * 3. 差分検出とパフォーマンス最適化
 */

import { createServiceRoleClient } from './supabase.ts';
import { type EdgeLogger } from './logging.ts';

// サポートされるエンティティタイプ
export type SupportedEntityType = 'post' | 'service' | 'faq' | 'news' | 'case_study';

// 同期結果インタフェース
export interface PublicSyncResult {
  success: boolean;
  affected_rows: number;
  synced_languages: string[];
  errors: Array<{
    language: string;
    error_message: string;
  }>;
}

// エンティティメタデータ
interface EntityMetadata {
  sourceTable: string;
  publicTable: string;
  keyFields: string[];
  contentFields: string[];
  slugField?: string;
}

// エンティティタイプのメタデータマップ
const ENTITY_METADATA: Record<SupportedEntityType, EntityMetadata> = {
  post: {
    sourceTable: 'posts',
    publicTable: 'public_posts_tbl',
    keyFields: ['id', 'organization_id'],
    contentFields: ['title', 'content', 'excerpt'],
    slugField: 'slug'
  },
  service: {
    sourceTable: 'services',
    publicTable: 'public_services_tbl',
    keyFields: ['id', 'organization_id'],
    contentFields: ['name', 'description', 'features'],
    slugField: 'slug'
  },
  faq: {
    sourceTable: 'faqs',
    publicTable: 'public_faqs_tbl',
    keyFields: ['id', 'organization_id'],
    contentFields: ['question', 'answer']
  },
  news: {
    sourceTable: 'news',
    publicTable: 'public_news_tbl',
    keyFields: ['id', 'organization_id'],
    contentFields: ['title', 'content', 'summary'],
    slugField: 'slug'
  },
  case_study: {
    sourceTable: 'case_studies',
    publicTable: 'public_case_studies_tbl',
    keyFields: ['id', 'organization_id'],
    contentFields: ['title', 'problem', 'solution', 'outcome'],
    slugField: 'slug'
  }
};

/**
 * 翻訳テーブル名生成
 */
function getTranslationTableName(entityType: SupportedEntityType): string {
  return `${ENTITY_METADATA[entityType].sourceTable}_translations`;
}

/**
 * 単一言語での public_* 同期
 */
async function syncEntityForLanguage(
  entityType: SupportedEntityType,
  entityId: string,
  language: string,
  supabase: any,
  logger: EdgeLogger
): Promise<{ success: boolean; error?: string }> {
  try {
    const metadata = ENTITY_METADATA[entityType];
    const translationTable = getTranslationTableName(entityType);

    // 原文データ取得
    const { data: sourceData, error: sourceError } = await supabase
      .from(metadata.sourceTable)
      .select('*')
      .eq('id', entityId)
      .single();

    if (sourceError || !sourceData) {
      return {
        success: false,
        error: `Source data not found: ${sourceError?.message || 'Entity not found'}`
      };
    }

    // 翻訳データ取得（該当言語）
    const { data: translationData } = await supabase
      .from(translationTable)
      .select('*')
      .eq('source_id', entityId)
      .eq('target_language', language);

    // 翻訳データをフィールド別にマップ化
    const translations: Record<string, string> = {};
    if (translationData && translationData.length > 0) {
      for (const trans of translationData) {
        if (trans.source_field && trans.translated_text) {
          translations[trans.source_field] = trans.translated_text;
        }
      }
    }

    // public_* テーブル用データ構築
    const publicData: Record<string, any> = {
      // キー情報
      ...metadata.keyFields.reduce((acc, field) => {
        acc[field] = sourceData[field];
        return acc;
      }, {} as Record<string, any>),
      
      // 言語
      lang: language,
      
      // コンテンツ（翻訳があれば翻訳、なければ原文）
      ...metadata.contentFields.reduce((acc, field) => {
        acc[field] = translations[field] || sourceData[field] || null;
        return acc;
      }, {} as Record<string, any>),
      
      // その他の共通フィールド
      status: sourceData.status || 'published',
      published_at: sourceData.published_at || sourceData.created_at,
      updated_at: new Date().toISOString(),
      content_hash: sourceData.content_hash || null,
      version: sourceData.version || 1
    };

    // スラッグフィールドがある場合
    if (metadata.slugField && sourceData[metadata.slugField]) {
      publicData[metadata.slugField] = sourceData[metadata.slugField];
    }

    // organization 関連情報
    if (sourceData.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('slug, name')
        .eq('id', sourceData.organization_id)
        .single();
      
      if (orgData) {
        publicData.organization_slug = orgData.slug;
        publicData.organization_name = orgData.name;
      }
    }

    // public_* テーブルにUPSERT
    const { error: upsertError } = await supabase
      .from(metadata.publicTable)
      .upsert(publicData, {
        onConflict: `${metadata.keyFields.join(',')},lang`
      });

    if (upsertError) {
      logger.error(`Failed to upsert ${metadata.publicTable}`, {
        entity_type: entityType,
        entity_id: entityId,
        language,
        error: upsertError.message
      });
      
      return {
        success: false,
        error: `UPSERT failed: ${upsertError.message}`
      };
    }

    logger.debug(`Successfully synced ${entityType} to ${metadata.publicTable}`, {
      entity_id: entityId,
      language,
      has_translations: Object.keys(translations).length > 0
    });

    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
    logger.error(`syncEntityForLanguage failed`, {
      entity_type: entityType,
      entity_id: entityId,
      language,
      error: errorMsg
    });

    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * メイン: エンティティの全言語同期
 */
export async function syncEntityToPublic(
  entityType: SupportedEntityType,
  entityId: string,
  targetLanguages: string[],
  logger: EdgeLogger
): Promise<PublicSyncResult> {
  const result: PublicSyncResult = {
    success: true,
    affected_rows: 0,
    synced_languages: [],
    errors: []
  };

  // エンティティタイプサポートチェック
  if (!ENTITY_METADATA[entityType]) {
    result.success = false;
    result.errors.push({
      language: 'all',
      error_message: `Unsupported entity_type: ${entityType}`
    });
    return result;
  }

  const supabase = createServiceRoleClient();

  // 各言語で同期実行
  for (const language of targetLanguages) {
    const syncResult = await syncEntityForLanguage(
      entityType,
      entityId,
      language,
      supabase,
      logger
    );

    if (syncResult.success) {
      result.affected_rows++;
      result.synced_languages.push(language);
    } else {
      result.success = false;
      result.errors.push({
        language,
        error_message: syncResult.error || 'Unknown error'
      });
    }
  }

  // 最終結果判定
  if (result.affected_rows === 0) {
    result.success = false;
  } else if (result.errors.length > 0 && result.affected_rows < targetLanguages.length) {
    // 部分成功の場合はsuccessをfalseにはしない（partial_errorとして扱う）
    logger.warn(`Partial sync success`, {
      entity_type: entityType,
      entity_id: entityId,
      synced: result.affected_rows,
      failed: result.errors.length
    });
  }

  logger.info(`Public sync completed`, {
    entity_type: entityType,
    entity_id: entityId,
    affected_rows: result.affected_rows,
    synced_languages: result.synced_languages.length,
    errors: result.errors.length
  });

  return result;
}

/**
 * 複数エンティティの一括同期（将来の拡張用）
 */
export async function bulkSyncEntitiesToPublic(
  requests: Array<{
    entity_type: SupportedEntityType;
    entity_id: string;
    target_languages: string[];
  }>,
  logger: EdgeLogger
): Promise<{
  total_processed: number;
  total_affected_rows: number;
  results: Array<PublicSyncResult & { entity_type: string; entity_id: string }>;
}> {
  const results = [];
  let totalAffectedRows = 0;

  for (const request of requests) {
    const syncResult = await syncEntityToPublic(
      request.entity_type,
      request.entity_id,
      request.target_languages,
      logger
    );

    results.push({
      ...syncResult,
      entity_type: request.entity_type,
      entity_id: request.entity_id
    });

    totalAffectedRows += syncResult.affected_rows;
  }

  return {
    total_processed: requests.length,
    total_affected_rows: totalAffectedRows,
    results
  };
}