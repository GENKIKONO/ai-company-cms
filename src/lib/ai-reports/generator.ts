import { ReportAggregator } from './aggregator';
import { LlmSummarizer } from './llm-summarizer';
import { getServiceRoleClient } from './supabase-client';
import type { 
  AiMonthlyReportData, 
  ReportLevel, 
  PlanId, 
  ReportPeriod,
  ReportSections 
} from './types';

export class AiReportGenerator {
  private supabase;
  private aggregator;
  private summarizer;

  constructor() {
    this.supabase = getServiceRoleClient();
    this.aggregator = new ReportAggregator();
    this.summarizer = new LlmSummarizer();
  }

  async generateReport(
    organizationId: string,
    period: ReportPeriod
  ): Promise<AiMonthlyReportData> {
    // 1. 組織のプラン情報を取得
    const { data: org } = await this.supabase
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single();

    if (!org) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    const planId = this.normalizePlanId(org.plan);
    const level = this.getReportLevel(planId);

    // 2. 基本メトリクス集計
    const metrics = await this.aggregator.aggregateBasicMetrics(
      organizationId, 
      period
    );

    // 3. プラン別セクション生成
    const sections = await this.buildSections(
      organizationId, 
      period, 
      level
    );

    // 4. LLMによるサマリーと提案生成
    const summary_text = await this.summarizer.generateSummaryText(
      metrics, 
      sections, 
      level
    );
    
    const suggestions = await this.summarizer.generateSuggestions(
      metrics, 
      sections, 
      level
    );

    // 5. データ構造組み立て
    const reportData: AiMonthlyReportData = {
      organization_id: organizationId,
      plan_id: planId,
      level,
      period_start: period.start,
      period_end: period.end,
      summary_text,
      metrics,
      sections,
      suggestions,
    };

    // 6. ai_monthly_reports テーブルに保存
    await this.saveReport(reportData);

    return reportData;
  }

  private normalizePlanId(planFromDb: string): PlanId {
    const normalized = planFromDb?.toLowerCase();
    switch (normalized) {
      case 'starter':
      case 'free':
        return 'starter';
      case 'pro':
        return 'pro';
      case 'business':
        return 'business';
      case 'enterprise':
        return 'enterprise';
      default:
        return 'starter';
    }
  }

  private getReportLevel(planId: PlanId): ReportLevel {
    switch (planId) {
      case 'starter': return 'light';
      case 'pro': return 'detail';
      case 'business': return 'advanced';
      case 'enterprise': return 'custom';
      default: return 'light';
    }
  }

  private async buildSections(
    organizationId: string,
    period: ReportPeriod,
    level: ReportLevel
  ): Promise<ReportSections> {
    // 基本セクション（全プラン共通）
    const topContents = await this.aggregator.getTopContents(
      organizationId, 
      period, 
      level === 'light' ? 3 : 5
    );

    const sections: ReportSections = {
      kpi_overview: {
        summary: '基本的なKPI情報',
        metrics: await this.aggregator.aggregateBasicMetrics(organizationId, period),
      },
      top_contents: {
        items: topContents,
      },
    };

    // Pro以上の場合
    if (level === 'detail' || level === 'advanced' || level === 'custom') {
      sections.weak_contents = {
        items: await this.aggregator.getWeakContents(organizationId, period),
      };

      sections.qna_insights = await this.aggregator.getQnaInsights(
        organizationId, 
        period
      );
    }

    // Business以上の場合
    if (level === 'advanced' || level === 'custom') {
      sections.trends = {
        description: '直近3ヶ月の傾向分析（TODO: 実装予定）',
        monthly_data: [], // TODO: 実際のトレンドデータ実装
      };

      sections.ai_content_effect = {
        ai_generated_ratio: 0, // TODO: 実際の比率計算実装
        ai_generated_views_ratio: 0,
        description: 'AI生成コンテンツの効果分析（TODO: 詳細分析実装）',
      };

      sections.interview_insights = await this.aggregator.getInterviewInsights(
        organizationId,
        period
      );
    }

    return sections;
  }

  private async saveReport(reportData: AiMonthlyReportData): Promise<void> {
    const { error } = await this.supabase
      .from('ai_monthly_reports')
      .upsert({
        organization_id: reportData.organization_id,
        plan_id: reportData.plan_id,
        level: reportData.level,
        period_start: reportData.period_start,
        period_end: reportData.period_end,
        status: 'ready',
        summary_text: reportData.summary_text,
        metrics: reportData.metrics,
        sections: reportData.sections,
        suggestions: reportData.suggestions,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,period_start,period_end,level'
      });

    if (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }
  }

  async regenerateReport(
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<AiMonthlyReportData> {
    const period: ReportPeriod = {
      start: periodStart,
      end: periodEnd,
    };

    return this.generateReport(organizationId, period);
  }
}

// ユーティリティ関数
export function getPreviousMonthPeriod(): ReportPeriod {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start = prevMonth.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const lastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
  const end = lastDay.toISOString().split('T')[0];
  
  return { start, end };
}