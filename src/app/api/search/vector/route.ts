/**
 * Vector Search API
 * P4-4: Embedding ベクトル検索機能
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      organization_id,
      source_tables = [],
      limit = 10,
      similarity_threshold = 0.7,
      include_inactive = false 
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Search query is required'
      }, { status: 400 });
    }

    // Embedding生成（OpenAI APIを使用）
    const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small',
        encoding_format: 'float'
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const embeddingResult = await openaiResponse.json();
    const queryEmbedding = embeddingResult.data[0].embedding;

    // Supabaseクライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // ベクトル検索クエリを構築
    let rpcQuery = supabase.rpc('search_embeddings', {
      query_embedding: JSON.stringify(queryEmbedding),
      similarity_threshold,
      match_count: limit
    });

    // フィルタ適用
    if (organization_id) {
      rpcQuery = rpcQuery.eq('organization_id', organization_id);
    }

    if (source_tables.length > 0) {
      rpcQuery = rpcQuery.in('source_table', source_tables);
    }

    if (!include_inactive) {
      rpcQuery = rpcQuery.eq('is_active', true);
    }

    const { data: searchResults, error } = await rpcQuery;

    if (error) {
      console.error('Vector search error:', error);
      throw error;
    }

    // 結果を整形
    const results = (searchResults || []).map((result: any) => ({
      id: result.id,
      organization_id: result.organization_id,
      source_table: result.source_table,
      source_id: result.source_id,
      source_field: result.source_field,
      chunk_index: result.chunk_index,
      chunk_text: result.chunk_text,
      similarity_score: result.similarity,
      embedding_model: result.embedding_model,
      created_at: result.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        query,
        results,
        total_results: results.length,
        similarity_threshold,
        embedding_model: 'text-embedding-3-small'
      }
    });

  } catch (error) {
    console.error('[Vector Search API] Error:', error);
    
    // OpenAI API エラーの詳細処理
    if (error instanceof Error && error.message.includes('OpenAI API')) {
      return NextResponse.json({
        success: false,
        message: 'Embedding generation failed. Please check OpenAI API configuration.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id');
    
    // 利用可能なソーステーブル一覧を返す
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let query = supabase
      .from('embeddings')
      .select('source_table')
      .eq('is_active', true);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 重複を削除してソーステーブル一覧を取得
    const availableTables = [...new Set((data || []).map(item => item.source_table))];

    return NextResponse.json({
      success: true,
      data: {
        available_tables: availableTables,
        organization_id: organizationId
      }
    });

  } catch (error) {
    console.error('[Vector Search Info API] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}