import type {
  ContentMetrics,
  TopContent,
  WeakContent,
  ReportLevel,
  ReportPeriod
} from './types';
import { getServiceRoleClient, normalizeUrl, getAnalyticsPartitionTables } from './supabase-client';
import { toContentUnionViewRows } from '@/lib/supabase-boundary';

export class ReportAggregator {
  private supabase;

  constructor() {
    this.supabase = getServiceRoleClient();
  }

  async aggregateBasicMetrics(
    organizationId: string, 
    period: ReportPeriod
  ): Promise<ContentMetrics> {
    // コンテンツ統計をcontent_union_viewから取得（境界で型確定）
    const { data: rawContentStats } = await this.supabase
      .from('content_union_view')
      .select('id, content_type, is_published')
      .eq('organization_id', organizationId)
      .eq('is_published', true);

    const contentStats = toContentUnionViewRows(rawContentStats);

    const contentCounts = {
      services_published: 0,
      faqs_published: 0,
      case_studies_published: 0,
      posts_published: 0,
      news_published: 0,
      products_published: 0,
    };

    contentStats.forEach(item => {
      switch (item.content_type) {
        case 'service':
          contentCounts.services_published++;
          break;
        case 'faq':
          contentCounts.faqs_published++;
          break;
        case 'case_study':
          contentCounts.case_studies_published++;
          break;
        case 'post':
          contentCounts.posts_published++;
          break;
        case 'news':
          contentCounts.news_published++;
          break;
        case 'product':
          contentCounts.products_published++;
          break;
      }
    });

    // AI生成コンテンツ数を個別テーブルから取得
    const aiGeneratedCount = await this.countAiGeneratedContent(organizationId);

    // 月間ページビューを analytics_events_YYYYMM から集計
    const totalPageViews = await this.aggregatePageViews(organizationId, period);

    return {
      total_page_views: totalPageViews,
      unique_contents: contentStats?.length || 0,
      ai_generated_contents: aiGeneratedCount,
      ...contentCounts,
    };
  }

  private async countAiGeneratedContent(organizationId: string): Promise<number> {
    const totalAiContent = 0;

    // FAQs
    const { count: faqCount } = await this.supabase
      .from('faqs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_ai_generated', true);

    // Posts
    const { count: postCount } = await this.supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_ai_generated', true);

    // Case Studies
    const { count: caseStudyCount } = await this.supabase
      .from('case_studies')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_ai_generated', true);

    return (faqCount || 0) + (postCount || 0) + (caseStudyCount || 0);
  }

  private async aggregatePageViews(
    organizationId: string, 
    period: ReportPeriod
  ): Promise<number> {
    // Step 1: 組織のコンテンツURLリストを取得
    const { data: contentUrls } = await this.supabase
      .from('content_union_view')
      .select('canonical_url')
      .eq('organization_id', organizationId)
      .eq('is_published', true)
      .not('canonical_url', 'is', null);

    if (!contentUrls || contentUrls.length === 0) {
      return 0;
    }

    // Step 2: URL正規化マッピング作成
    const normalizedUrls = new Set(
      contentUrls.map(item => normalizeUrl(item.canonical_url))
    );

    // Step 3: 各パーティションテーブルからページビュー集計
    const partitionTables = getAnalyticsPartitionTables(period.start, period.end);
    let totalPageViews = 0;

    for (const tableName of partitionTables) {
      try {
        // 各月のパーティションテーブルからページビューを取得
        const { count, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', period.start)
          .lte('created_at', period.end)
          .in('page_url', Array.from(normalizedUrls).concat(
            // 正規化前のURLも含める（データ移行期間対応）
            contentUrls.map(item => item.canonical_url)
          ));

        if (error) {
          console.warn(`Failed to query ${tableName}:`, error.message);
          continue;
        }

        totalPageViews += count || 0;
      } catch (error) {
        console.warn(`Analytics table ${tableName} not accessible:`, error);
        continue;
      }
    }

    return totalPageViews;
  }

  private async getContentPageViews(canonicalUrl: string, period: ReportPeriod): Promise<number> {
    const normalizedUrl = normalizeUrl(canonicalUrl);
    const partitionTables = getAnalyticsPartitionTables(period.start, period.end);
    let totalViews = 0;

    for (const tableName of partitionTables) {
      try {
        // 正規化URL と 元URL両方でマッチング
        const { count, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', period.start)
          .lte('created_at', period.end)
          .in('page_url', [normalizedUrl, canonicalUrl]);

        if (error) {
          console.warn(`Failed to query ${tableName} for URL ${canonicalUrl}:`, error.message);
          continue;
        }

        totalViews += count || 0;
      } catch (error) {
        console.warn(`Analytics table ${tableName} not accessible:`, error);
        continue;
      }
    }

    return totalViews;
  }

  async getTopContents(
    organizationId: string, 
    period: ReportPeriod, 
    limit: number = 5
  ): Promise<TopContent[]> {
    // Step 1: 組織のコンテンツ一覧を取得
    const { data: contents } = await this.supabase
      .from('content_union_view')
      .select('id, content_type, title, canonical_url')
      .eq('organization_id', organizationId)
      .eq('is_published', true)
      .not('canonical_url', 'is', null);

    if (!contents || contents.length === 0) {
      return [];
    }

    // Step 2: 各コンテンツのページビューを取得
    const contentWithViews = await Promise.all(
      contents.map(async (content) => {
        const pageViews = await this.getContentPageViews(content.canonical_url, period);
        return {
          type: content.content_type,
          id: content.id,
          title: content.title || 'タイトルなし',
          page_views: pageViews,
          url: content.canonical_url,
        };
      })
    );

    // Step 3: ページビュー数でソートし、上位を返す
    return contentWithViews
      .sort((a, b) => b.page_views - a.page_views)
      .slice(0, limit);
  }

  async getWeakContents(
    organizationId: string,
    period: ReportPeriod,
    limit: number = 5
  ): Promise<WeakContent[]> {
    // Step 1: 組織のコンテンツ一覧を取得
    const { data: contents } = await this.supabase
      .from('content_union_view')
      .select('id, content_type, title, canonical_url, created_at')
      .eq('organization_id', organizationId)
      .eq('is_published', true)
      .not('canonical_url', 'is', null);

    if (!contents || contents.length === 0) {
      return [];
    }

    // Step 2: 各コンテンツのページビューを取得
    const contentWithViews = await Promise.all(
      contents.map(async (content) => {
        const pageViews = await this.getContentPageViews(content.canonical_url, period);
        return {
          type: content.content_type,
          id: content.id,
          title: content.title || 'タイトルなし',
          page_views: pageViews,
          created_at: content.created_at,
        };
      })
    );

    // Step 3: 低パフォーマンスコンテンツの特定ロジック
    const sortedByViews = contentWithViews.sort((a, b) => a.page_views - b.page_views);
    const avgPageViews = contentWithViews.reduce((sum, c) => sum + c.page_views, 0) / contentWithViews.length;
    
    return sortedByViews.slice(0, limit).map(content => {
      let reason = '';
      if (content.page_views === 0) {
        reason = 'ページビューがありません';
      } else if (content.page_views < avgPageViews * 0.3) {
        reason = '平均的なページビューを大きく下回っています';
      } else {
        reason = '相対的にページビューが少ない状態です';
      }

      return {
        type: content.type,
        id: content.id,
        title: content.title,
        page_views: content.page_views,
        reason,
      };
    });
  }

  async getQnaInsights(
    organizationId: string,
    period: ReportPeriod
  ) {
    // FAQ特化の分析（Pro以上）
    // content_union_viewからFAQの詳細を取得
    const { data: faqs } = await this.supabase
      .from('content_union_view')
      .select('id, title, canonical_url, created_at')
      .eq('organization_id', organizationId)
      .eq('content_type', 'faq')
      .eq('is_published', true)
      .not('canonical_url', 'is', null);

    if (!faqs || faqs.length === 0) {
      return {
        top_faqs: [],
        falling_faqs: [],
      };
    }

    // 各FAQのページビューを取得
    const faqsWithViews = await Promise.all(
      faqs.map(async (faq) => {
        const pageViews = await this.getContentPageViews(faq.canonical_url, period);
        return {
          type: 'faq' as const,
          id: faq.id,
          title: faq.title || 'タイトルなし',
          page_views: pageViews,
          url: faq.canonical_url,
        };
      })
    );

    // ページビューでソートしてトップFAQs
    const topFaqs = faqsWithViews
      .sort((a, b) => b.page_views - a.page_views)
      .slice(0, 5);

    // 低パフォーマンスFAQs（falling_faqs）
    const fallingFaqs = faqsWithViews
      .sort((a, b) => a.page_views - b.page_views)
      .slice(0, 3);

    return {
      top_faqs: topFaqs,
      falling_faqs: fallingFaqs,
    };
  }

  async getInterviewInsights(
    organizationId: string,
    period: ReportPeriod
  ) {
    // AI面談分析（Business以上）
    const { data: sessions } = await this.supabase
      .from('ai_interview_sessions')
      .select('id, status, generated_content, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', period.start)
      .lte('created_at', period.end);

    const sessionsCount = sessions?.length || 0;
    const generatedContents = sessions?.filter(s => s.generated_content).length || 0;

    return {
      sessions_count: sessionsCount,
      generated_contents: generatedContents,
      description: `期間中に${sessionsCount}回のAI面談を実施し、${generatedContents}件のコンテンツを生成しました。`,
    };
  }
}