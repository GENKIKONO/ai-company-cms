import { generateContentWithOpenAI, type OpenAIMessage } from '@/lib/ai/openai-client';
import type { ContentMetrics, ReportSections, SuggestionItem, ReportLevel } from './types';

export class LlmSummarizer {
  async generateSummaryText(
    metrics: ContentMetrics,
    sections: ReportSections,
    level: ReportLevel
  ): Promise<string> {
    const userPrompt = this.buildSummaryPrompt(metrics, sections, level);
    
    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: 'あなたは企業のWebサイト分析とコンテンツマーケティングの専門家です。データを基に簡潔で分かりやすいレポートサマリーを生成してください。'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      const response = await generateContentWithOpenAI(messages, {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 500,
      });
      
      return response.content;
    } catch (error) {
      console.error('LLM summary generation failed:', error);
      return this.getFallbackSummary(metrics, level);
    }
  }

  async generateSuggestions(
    metrics: ContentMetrics,
    sections: ReportSections,
    level: ReportLevel
  ): Promise<SuggestionItem[]> {
    const userPrompt = this.buildSuggestionsPrompt(metrics, sections, level);
    
    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: 'あなたは企業のWebサイト改善とコンテンツマーケティングの専門コンサルタントです。データ分析結果に基づき、実行可能で効果的な改善提案をJSON形式で生成してください。'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      const response = await generateContentWithOpenAI(messages, {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 800,
      });
      
      // JSONパース試行
      const suggestions = this.parseSuggestionsResponse(response.content, level);
      return suggestions;
    } catch (error) {
      console.error('LLM suggestions generation failed:', error);
      return this.getFallbackSuggestions(level);
    }
  }

  private buildSummaryPrompt(
    metrics: ContentMetrics,
    sections: ReportSections,
    level: ReportLevel
  ): string {
    return `
以下のデータをもとに、企業のAI月次レポートの自然文サマリーを日本語で生成してください。
レポートレベル: ${level}

## 基本指標
- 月間ページビュー: ${metrics.total_page_views}
- 公開コンテンツ数: ${metrics.unique_contents}
- サービス: ${metrics.services_published}
- FAQ: ${metrics.faqs_published} 
- 導入事例: ${metrics.case_studies_published}
- AI生成コンテンツ: ${metrics.ai_generated_contents}

## 上位コンテンツ
${sections.top_contents.items.map(item => `- ${item.title} (${item.page_views}PV)`).join('\n')}

## 要件
- 1-2段落で簡潔に
- 前月比は「増減の傾向」として表現（具体的な%は不明なため）
- 具体的な数値を含める
- 改善の方向性を示唆する

出力形式: プレーンテキストのみ
`;
  }

  private buildSuggestionsPrompt(
    metrics: ContentMetrics,
    sections: ReportSections,
    level: ReportLevel
  ): string {
    const suggestionCount = this.getSuggestionCount(level);
    
    return `
以下のデータをもとに、企業の改善提案を${suggestionCount}件生成してください。

## 現状データ
- 月間ページビュー: ${metrics.total_page_views}
- 公開コンテンツ数: ${metrics.unique_contents}
- AI生成コンテンツ数: ${metrics.ai_generated_contents}

## 上位・弱点コンテンツ
上位: ${sections.top_contents.items.map(item => item.title).join(', ')}
弱点: ${sections.weak_contents?.items.map(item => item.title).join(', ') || 'なし'}

## 出力形式
以下のJSON配列形式で出力してください:
[
  {
    "id": "sug-001",
    "title": "具体的な改善提案のタイトル", 
    "description": "詳細な説明（100文字程度）",
    "priority": "high|medium|low",
    "category": "content|seo|ux"
  }
]

## 提案レベル
${level === 'light' ? '基本的で実行しやすい提案' : 
  level === 'detail' ? '具体的な対象コンテンツを指定した提案' :
  level === 'advanced' ? 'ブランド別・テーマ別の戦略的提案' : 'カスタム提案'}
`;
  }

  private getSuggestionCount(level: ReportLevel): number {
    switch (level) {
      case 'light': return 3;
      case 'detail': return 5;
      case 'advanced': return 8;
      case 'custom': return 10;
      default: return 3;
    }
  }

  private parseSuggestionsResponse(text: string, level: ReportLevel): SuggestionItem[] {
    try {
      // JSON部分を抽出
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }
      
      const suggestions = JSON.parse(jsonMatch[0]);
      
      // IDが無い場合は自動生成
      return suggestions.map((s: any, index: number) => ({
        id: s.id || `sug-${String(index + 1).padStart(3, '0')}`,
        title: s.title || '改善提案',
        description: s.description || '',
        priority: s.priority || 'medium',
        category: s.category || 'content',
      }));
    } catch (error) {
      console.error('Failed to parse suggestions response:', error);
      return this.getFallbackSuggestions(level);
    }
  }

  private getFallbackSummary(metrics: ContentMetrics, level: ReportLevel): string {
    return `今月は${metrics.total_page_views}ページビューを記録し、${metrics.unique_contents}件のコンテンツが公開されています。特にサービス情報（${metrics.services_published}件）とFAQ（${metrics.faqs_published}件）が充実しています。AI生成コンテンツは${metrics.ai_generated_contents}件となっており、効率的なコンテンツ制作が進んでいます。`;
  }

  private getFallbackSuggestions(level: ReportLevel): SuggestionItem[] {
    const baseSuggestions = [
      {
        id: 'sug-001',
        title: 'FAQ コンテンツの拡充',
        description: 'よく検索されるキーワードに対応したFAQを追加することで、ユーザーの疑問解決を促進できます。',
        priority: 'high' as const,
        category: 'content',
      },
      {
        id: 'sug-002', 
        title: 'サービスページの説明強化',
        description: '具体的な事例や料金情報を追加することで、コンバージョン率向上が期待できます。',
        priority: 'medium' as const,
        category: 'content',
      },
      {
        id: 'sug-003',
        title: 'AI生成コンテンツの品質向上',
        description: '生成されたコンテンツの見直しと手動調整により、より価値の高い情報提供を実現できます。',
        priority: 'medium' as const,
        category: 'content',
      },
    ];

    return baseSuggestions.slice(0, this.getSuggestionCount(level));
  }
}