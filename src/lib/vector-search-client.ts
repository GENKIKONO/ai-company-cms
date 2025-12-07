/**
 * Vector Search Client
 * P4-4: ベクトル検索クライアントライブラリ
 */

import 'server-only';

export interface VectorSearchRequest {
  query: string;
  organization_id?: string;
  source_tables?: string[];
  limit?: number;
  similarity_threshold?: number;
  include_inactive?: boolean;
}

export interface VectorSearchResult {
  id: string;
  organization_id: string;
  source_table: string;
  source_id: string;
  source_field: string;
  chunk_index: number;
  chunk_text: string;
  similarity_score: number;
  embedding_model: string;
  created_at: string;
}

export interface VectorSearchResponse {
  success: boolean;
  data?: {
    query: string;
    results: VectorSearchResult[];
    total_results: number;
    similarity_threshold: number;
    embedding_model: string;
  };
  message?: string;
}

/**
 * ベクトル検索実行
 */
export async function searchSimilarContent(
  searchRequest: VectorSearchRequest
): Promise<VectorSearchResponse> {
  try {
    const response = await fetch('/api/search/vector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchRequest)
    });

    const result = await response.json();
    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Search Client] Search failed:', error);
    
    return {
      success: false,
      message: `Vector search failed: ${errorMsg}`
    };
  }
}

/**
 * 利用可能なソーステーブル一覧取得
 */
export async function getAvailableSourceTables(
  organizationId?: string
): Promise<{ success: boolean; data?: string[]; message?: string }> {
  try {
    const params = new URLSearchParams();
    if (organizationId) {
      params.append('organization_id', organizationId);
    }

    const response = await fetch(`/api/search/vector?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        data: result.data.available_tables
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Search Client] Get tables failed:', error);
    
    return {
      success: false,
      message: `Get available tables failed: ${errorMsg}`
    };
  }
}

/**
 * コンテンツ推薦（類似コンテンツ検索）
 */
export async function getRecommendedContent(
  sourceContent: {
    organization_id: string;
    source_table: string;
    source_id: string;
    content_text: string;
  },
  options: {
    exclude_same_source?: boolean;
    limit?: number;
    similarity_threshold?: number;
  } = {}
): Promise<VectorSearchResponse> {
  try {
    const searchRequest: VectorSearchRequest = {
      query: sourceContent.content_text,
      organization_id: sourceContent.organization_id,
      limit: options.limit || 5,
      similarity_threshold: options.similarity_threshold || 0.8,
      include_inactive: false
    };

    // 同一ソースを除外する場合は、異なるテーブルのみを対象とする
    if (options.exclude_same_source) {
      const tablesResponse = await getAvailableSourceTables(sourceContent.organization_id);
      if (tablesResponse.success && tablesResponse.data) {
        searchRequest.source_tables = tablesResponse.data.filter(
          table => table !== sourceContent.source_table
        );
      }
    }

    const result = await searchSimilarContent(searchRequest);
    
    // 同一コンテンツを結果から除外
    if (result.success && result.data) {
      result.data.results = result.data.results.filter(
        item => !(item.source_table === sourceContent.source_table && 
                  item.source_id === sourceContent.source_id)
      );
      result.data.total_results = result.data.results.length;
    }

    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vector Search Client] Get recommendations failed:', error);
    
    return {
      success: false,
      message: `Get recommended content failed: ${errorMsg}`
    };
  }
}