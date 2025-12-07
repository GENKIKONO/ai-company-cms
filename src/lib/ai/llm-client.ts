/**
 * LLM呼び出しクライアント
 * OpenAI APIを使用して、AIインタビュアーのサマリー生成を行う
 */

import { logger } from '@/lib/log';
import { validateUserInput, checkLLMRateLimit, postProcessLLMResponse } from '@/lib/security/llm-guard';

export interface LLMServiceInterviewSummaryRequest {
  answers: { [questionId: string]: string };
  userId: string;
}

export interface LLMServiceInterviewSummaryResponse {
  success: boolean;
  summaryText?: string;
  error?: string;
}

/**
 * サービス紹介向けAIインタビューの要約を生成
 * OpenAI APIを使用してサービス説明の下書きを作成する
 * 
 * 方針：
 * - "オープンすぎないけど、ちゃんと軸がある質問" への回答をもとに下書きを作成
 * - 最終原稿ではなく、たたき台になる箇条書き＋短い説明レベル
 * - 軸: 基本情報、価格、価値・メリット、利用シーン、差別化、リスク等
 */
export async function generateServiceInterviewSummary(
  request: LLMServiceInterviewSummaryRequest
): Promise<LLMServiceInterviewSummaryResponse> {
  try {
    const { answers, userId } = request;

    // 1. レート制限チェック
    const rateLimitResult = checkLLMRateLimit(userId, 20); // 1時間20回まで
    if (!rateLimitResult.allowed) {
      logger.warn('LLM rate limit exceeded', {
        component: 'llm-client',
        userId,
        resetTime: new Date(rateLimitResult.resetTime).toISOString()
      });
      return {
        success: false,
        error: 'API利用制限に達しました。しばらく時間をおいてからお試しください。'
      };
    }

    // 2. 回答内容を整理（空の回答は除外）
    const validAnswers = Object.entries(answers).filter(([, answer]) => answer.trim());
    
    if (validAnswers.length === 0) {
      return {
        success: false,
        error: '回答が入力されていません。質問にお答えください。'
      };
    }

    // 3. 各回答の入力検証
    for (const [questionId, answer] of validAnswers) {
      const validation = validateUserInput(answer, { maxLength: 2000 });
      if (!validation.valid) {
        logger.warn('Invalid user input detected', {
          component: 'llm-client',
          userId,
          questionId,
          error: validation.error
        });
        return {
          success: false,
          error: `入力内容に問題があります: ${validation.error}`
        };
      }
    }

    // 4. プロンプトの構築
    const promptContext = buildServiceSummaryPrompt(validAnswers);
    
    // 5. OpenAI API呼び出し
    const summaryText = await callOpenAIForServiceSummary(promptContext, userId);
    
    // 6. 応答後処理（セキュリティチェック）
    const processedSummary = postProcessLLMResponse(summaryText);

    logger.info('Service summary generated successfully', {
      component: 'llm-client',
      userId,
      answerCount: validAnswers.length,
      outputLength: processedSummary.length
    });

    return {
      success: true,
      summaryText: processedSummary
    };

  } catch (error) {
    logger.error('Failed to generate service summary', {
      component: 'llm-client',
      userId: request.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      success: false,
      error: 'AI要約の生成中にエラーが発生しました。しばらく後でお試しください。'
    };
  }
}

/**
 * サービス紹介要約用のプロンプトを構築
 * "オープンすぎない質問の軸" に基づいた構造的な要約を作成する指示を含む
 */
function buildServiceSummaryPrompt(answers: [string, string][]): string {
  const answersText = answers
    .map(([questionId, answer], index) => `Q${index + 1}: ${answer.trim()}`)
    .join('\n\n');

  return `
以下は、サービス紹介のためのインタビュー回答です。
これらの回答をもとに、サービスの概要を分かりやすく整理した「下書き」を作成してください。

# インタビュー回答
${answersText}

# 作成指針
- 最終原稿ではなく、たたき台になる箇条書き＋短い説明レベルで作成
- 以下の軸を意識して整理（該当する情報がある場合のみ）：
  * サービスの一言説明
  * 主なターゲット顧客
  * 価格・料金のざっくり説明
  * 利用シーン（2〜3例）
  * 他社との違い（あれば）
  * 注意点・リスク（あれば）
- 日本語で出力
- 簡潔で読みやすく
- 回答にない内容は推測で追加しない

# 出力形式
## サービス概要
[一言説明]

## 対象顧客
[ターゲット顧客]

## 料金
[料金情報があれば]

## 利用シーン
- [シーン1]
- [シーン2]

## 特徴・差別化
[他社との違いがあれば]

## 注意点
[リスクや制約があれば]
`.trim();
}

/**
 * OpenAI APIを呼び出してサービス要約を生成
 * 実際のAPI呼び出しを行う（fetch使用）
 */
async function callOpenAIForServiceSummary(prompt: string, userId: string): Promise<string> {
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
        content: 'あなたは企業のサービス紹介文作成を支援するアシスタントです。提供された情報をもとに、分かりやすく構造化された下書きを作成してください。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
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
      'User-Agent': 'LuxuCare-AIInterviewer/1.0'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('OpenAI API error', {
      component: 'llm-client',
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