import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { validateUserInput, checkLLMRateLimit, postProcessLLMResponse } from '@/lib/security/llm-guard';
import { logger } from '@/lib/utils/logger';

interface ChatRequest {
  query: string;
  organization_id: string;
  similarity_threshold?: number;
  max_results?: number;
}

interface ChatResponse {
  success: boolean;
  answer?: string;
  sources?: Array<{
    content: string;
    file_id: string;
    display_name: string;
    object_path: string;
    similarity: number;
    chunk_index: number;
  }>;
  error?: string;
}

// OpenAI embedding generation
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { query, organization_id, similarity_threshold = 0.7, max_results = 5 } = body;

    if (!query || !organization_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query and organization_id are required' 
      }, { status: 400 });
    }

    // 組織の所有権確認
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', organization_id)
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization not found or access denied' 
      }, { status: 403 });
    }

    // レート制限チェック
    const rateLimitResult = checkLLMRateLimit(user.id, 30); // 1時間30回まで
    if (!rateLimitResult.allowed) {
      logger.warn('Chat API rate limit exceeded', {
        component: 'org-docs-chat',
        userId: user.id,
        organizationId: organization_id,
        resetTime: new Date(rateLimitResult.resetTime).toISOString()
      });
      return NextResponse.json({
        success: false,
        error: 'API利用制限に達しました。しばらく時間をおいてからお試しください。'
      }, { status: 429 });
    }

    // 入力検証
    const validation = validateUserInput(query, { maxLength: 500 });
    if (!validation.valid) {
      logger.warn('Invalid user input detected in chat', {
        component: 'org-docs-chat',
        userId: user.id,
        organizationId: organization_id,
        error: validation.error
      });
      return NextResponse.json({
        success: false,
        error: `入力内容に問題があります: ${validation.error}`
      }, { status: 400 });
    }

    // Service Role権限でSupabaseクライアント作成
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. 質問をembeddingに変換
    const queryEmbedding = await generateEmbedding(query);

    // 2. Supabase関数を使ってベクター検索
    const { data: searchResults, error: searchError } = await serviceSupabase
      .rpc('search_embeddings_by_vector', {
        p_org_id: organization_id,
        p_query_embedding: queryEmbedding,
        p_top_k: max_results,
        p_min_score: similarity_threshold,
        p_source_table: 'file_metadata',
        p_lang: null,
      });

    if (searchError) {
      logger.error('Vector search failed', {
        component: 'org-docs-chat',
        userId: user.id,
        organizationId: organization_id,
        error: searchError.message
      });
      return NextResponse.json({
        success: false,
        error: '関連資料の検索に失敗しました。'
      }, { status: 500 });
    }
    
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        answer: 'お探しの情報に関連する文書が見つかりませんでした。別の質問をお試しください。',
        sources: []
      });
    }

    // 組織分離の最終チェック（念のため戻り値のorganization_idを確認）
    const filteredResults = searchResults.filter((result: any) => {
      if (result.organization_id && result.organization_id !== organization_id) {
        logger.warn('Cross-organization result detected and filtered', {
          component: 'org-docs-chat',
          requestOrgId: organization_id,
          resultOrgId: result.organization_id,
          sourceId: result.source_id
        });
        return false;
      }
      return true;
    });

    if (filteredResults.length === 0) {
      return NextResponse.json({
        success: true,
        answer: 'お探しの情報に関連する文書が見つかりませんでした。別の質問をお試しください。',
        sources: []
      });
    }

    // 3. source_idからfile_metadataを取得して引用元を解決（組織フィルタリング付き）
    const sourceIds = filteredResults.map(result => result.source_id);
    const { data: fileMetadataList, error: fileError } = await serviceSupabase
      .from('file_metadata')
      .select('id, display_name, object_path, metadata')
      .in('id', sourceIds)
      .eq('metadata->>organization_id', organization_id); // 組織レベルでの安全確認

    if (fileError) {
      logger.warn('Failed to fetch file metadata for sources', {
        component: 'org-docs-chat',
        error: fileError.message
      });
    }

    // ファイル情報をマッピング
    const fileMetadataMap = new Map(
      (fileMetadataList || []).map(file => [file.id, file])
    );

    // LLMプロンプト構築
    const contextSources = filteredResults.map((result, index) => {
      const fileInfo = fileMetadataMap.get(result.source_id);
      const fileName = fileInfo?.display_name || '不明なファイル';
      return `[資料${index + 1}: ${fileName}] ${result.chunk_text}`;
    }).join('\n\n');

    const prompt = `
以下の企業資料をもとに、ユーザーの質問に回答してください。

# 企業資料
${contextSources}

# ユーザーの質問
${query}

# 回答の指針
- 提供された資料の内容のみに基づいて回答してください
- 資料にない情報は推測せず、「資料には記載されていません」と明記してください
- 回答の根拠となる資料を明確に示してください
- 簡潔で分かりやすい日本語で回答してください
- 企業の立場に立った客観的な回答を心がけてください

# 回答形式
回答: [質問に対する具体的な回答]

根拠となる資料: [資料1][資料2] など、参照した資料番号を明記
`;

    // OpenAI API呼び出し
    const answer = await generateChatResponse(prompt, user.id);
    
    // 回答の後処理
    const processedAnswer = postProcessLLMResponse(answer);

    // ソース情報の整理（Supabase Assistant確認済みスキーマに対応）
    const sources = filteredResults.map((result: any, index: number) => {
      const fileInfo = fileMetadataMap.get(result.source_id);
      return {
        content: result.chunk_text || result.content || '',
        file_id: result.source_id,
        display_name: fileInfo?.display_name || '不明なファイル',
        object_path: fileInfo?.object_path || '',
        similarity: Math.round(((result.score || result.similarity_score || result.similarity || 0) * 100)) / 100,
        chunk_index: result.chunk_index || 0
      };
    });

    logger.info('Chat response generated successfully', {
      component: 'org-docs-chat',
      userId: user.id,
      organizationId: organization_id,
      queryLength: query.length,
      responseLength: processedAnswer.length,
      sourceCount: sources.length
    });

    return NextResponse.json({
      success: true,
      answer: processedAnswer,
      sources
    });

  } catch (error: any) {
    logger.error('Chat API error:', {
      component: 'org-docs-chat',
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return NextResponse.json({ 
      success: false, 
      error: 'AIチャットの生成中にエラーが発生しました。しばらく後でお試しください。' 
    }, { status: 500 });
  }
}

// OpenAI APIを呼び出してチャット回答を生成
async function generateChatResponse(prompt: string, userId: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4';
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const requestBody = {
    model: model,
    messages: [
      {
        role: 'system',
        content: 'あなたは企業の専門知識を持つAIアシスタントです。提供された企業資料をもとに、正確で有用な回答を提供してください。資料にない情報については明確に「資料には記載されていません」と回答してください。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3, // 一貫性重視
    max_tokens: 1500,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LuxuCare-OrgChat/1.0'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('OpenAI API error in chat', {
      component: 'org-docs-chat',
      userId,
      status: response.status,
      error: errorText
    });
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response choices from OpenAI API');
  }

  const generatedText = data.choices[0].message?.content?.trim();
  
  if (!generatedText) {
    throw new Error('Empty response from OpenAI API');
  }

  return generatedText;
}