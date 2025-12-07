import { logger } from '@/lib/utils/logger';

// OpenAI API設定
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface GenerateContentInput {
  answers: Record<string, string>;
  contentType: string;
  systemPrompt?: string;
}

/**
 * OpenAI APIを使用してコンテンツ生成
 */
export async function generateContentWithOpenAI(
  messages: OpenAIMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<OpenAIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 2000
  } = options;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenAI API error', {
        data: {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        }
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    const content = data.choices[0].message?.content || '';
    const usage = data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    return {
      content,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      },
      model: data.model || model
    };

  } catch (error) {
    logger.error('Failed to generate content with OpenAI', { data: error });
    throw error;
  }
}

/**
 * インタビュー回答からコンテンツを生成
 */
export async function generateInterviewContent(input: GenerateContentInput): Promise<OpenAIResponse> {
  const answeredQuestions = Object.entries(input.answers)
    .filter(([_, answer]) => answer.trim() !== '')
    .map(([questionId, answer], index) => `質問${index + 1}: ${answer}`)
    .join('\n\n');

  const systemPrompt = input.systemPrompt || buildDefaultSystemPrompt(input.contentType);
  
  const userPrompt = `以下のインタビュー回答を基に、${input.contentType}の説明文を構造化して生成してください。

【インタビュー回答】
${answeredQuestions}

【出力要件】
1. プロフェッショナルで読みやすい文章
2. 論理的な構造（要約→詳細）
3. 具体的で説得力のある内容
4. 回答内容に忠実
5. 日本語での出力`;

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return generateContentWithOpenAI(messages, {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000
  });
}

/**
 * コンテンツタイプ別のシステムプロンプト構築
 */
function buildDefaultSystemPrompt(contentType: string): string {
  const basePrompt = `あなたは日本のビジネス向けコンテンツライターです。
インタビュー回答を基に、正確で魅力的なビジネス文書を作成します。

重要な原則:
- 事実に基づき、誇張しない
- 読み手にとって分かりやすい構造
- 専門用語は適切に説明
- 具体的な数値や事例を活用
- 日本のビジネス慣習に配慮`;

  const contentSpecificPrompts = {
    service: `
サービス説明文の構成:
1. サービス概要（100文字以内）
2. 主要機能・特徴（箇条書き）
3. 対象顧客・利用場面
4. 導入メリット・効果
5. 料金・プラン（記載がある場合）
6. 導入・利用の流れ`,

    product: `
製品説明文の構成:
1. 製品概要（100文字以内）
2. 仕様・技術的特徴
3. 利用場面・用途
4. 製品の強み・差別化要素
5. 価格・販売情報（記載がある場合）
6. サポート・保証`,

    faq: `
FAQ形式の構成:
1. 概要説明
2. よくある質問と回答（Q&A形式）
3. 追加情報・関連リンク
4. お問い合わせ先

回答は具体的で分かりやすく、技術的な内容も一般の方に理解できるよう説明してください。`,

    case_study: `
導入事例の構成:
1. 事例概要
2. 導入前の課題・背景
3. 導入プロセス・期間
4. 導入効果・成果
5. 利用者の声・評価
6. 今後の展開・計画

数値や具体的な改善点があれば積極的に記載してください。`
  };

  return basePrompt + (contentSpecificPrompts[contentType as keyof typeof contentSpecificPrompts] || '');
}

/**
 * トークン数の概算計算
 */
export function estimateTokenCount(text: string): number {
  // 日本語テキストの場合、約2-3文字で1トークンの概算
  // 英語の場合は約4文字で1トークン
  const japaneseCharCount = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  const otherCharCount = text.length - japaneseCharCount;
  
  return Math.ceil(japaneseCharCount / 2.5 + otherCharCount / 4);
}

/**
 * レート制限対応の待機
 */
export async function waitForRateLimit(retryAfter: number = 1): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
}

/**
 * リトライ機能付きのコンテンツ生成
 */
export async function generateContentWithRetry(
  input: GenerateContentInput,
  maxRetries: number = 3
): Promise<OpenAIResponse> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateInterviewContent(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) break;
      
      // レート制限の場合は長めに待機
      const waitTime = error instanceof Error && error.message.includes('rate limit') 
        ? Math.pow(2, attempt) * 2 
        : Math.pow(2, attempt);
      
      logger.warn(`OpenAI generation retry attempt ${attempt}`, {
        data: { 
          error: lastError, 
          remainingAttempts: maxRetries - attempt,
          waitTime 
        }
      });
      
      await waitForRateLimit(waitTime);
    }
  }
  
  throw lastError!;
}