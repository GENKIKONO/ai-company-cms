/**
 * 埋め込み使用状況トラッキングシステム
 * Widget/iframe の呼び出し数・エラー・パフォーマンスを記録
 */

import { createClient } from '@supabase/supabase-js';
import type { PlanType } from '@/config/plans';
import { logger } from '@/lib/utils/logger';

// 使用状況データ型
export interface EmbedUsage {
  id?: string;
  organization_id: string;
  widget_type: 'widget' | 'iframe' | 'html';
  event_type: 'load' | 'click' | 'error' | 'resize';
  source_url?: string;
  user_agent?: string;
  ip_address?: string;
  response_time?: number;
  error_message?: string;
  custom_properties?: Record<string, any>;
  created_at?: string;
}

// 集計データ型
export interface EmbedUsageStats {
  organization_id: string;
  date: string;
  widget_loads: number;
  iframe_loads: number;
  total_clicks: number;
  error_count: number;
  avg_response_time: number;
  unique_sources: number;
  updated_at: string;
}

// 月間統計型
export interface MonthlyUsageStats {
  organization_id: string;
  month: string;
  total_views: number;
  widget_views: number;
  iframe_views: number;
  unique_visitors: number;
  top_sources: { url: string; count: number }[];
  error_rate: number;
}

/**
 * 使用状況トラッカークラス
 */
export class EmbedUsageTracker {
  private supabase;
  private batchQueue: EmbedUsage[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 30000; // 30秒

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * 使用状況イベントを記録
   */
  async track(usage: EmbedUsage): Promise<void> {
    try {
      // バッチキューに追加
      this.batchQueue.push({
        ...usage,
        created_at: new Date().toISOString(),
        ip_address: this.anonymizeIP(usage.ip_address),
        user_agent: this.sanitizeUserAgent(usage.user_agent)
      });

      // バッチサイズに達したら即座にフラッシュ
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.flush();
      } else {
        // タイマーでの自動フラッシュをセット
        this.scheduleFlush();
      }
    } catch (error) {
      logger.error('Usage tracking failed', error instanceof Error ? error : new Error(String(error)));
      // トラッキングエラーは無視（メイン機能に影響しない）
    }
  }

  /**
   * Widget読み込みを記録
   */
  async trackWidgetLoad(
    organizationId: string,
    widgetType: 'widget' | 'iframe',
    metadata?: {
      sourceUrl?: string;
      userAgent?: string;
      ipAddress?: string;
      responseTime?: number;
    }
  ): Promise<void> {
    await this.track({
      organization_id: organizationId,
      widget_type: widgetType,
      event_type: 'load',
      source_url: metadata?.sourceUrl,
      user_agent: metadata?.userAgent,
      ip_address: metadata?.ipAddress,
      response_time: metadata?.responseTime
    });
  }

  /**
   * Widget内クリックを記録
   */
  async trackWidgetClick(
    organizationId: string,
    widgetType: 'widget' | 'iframe',
    clickTarget: string,
    sourceUrl?: string
  ): Promise<void> {
    await this.track({
      organization_id: organizationId,
      widget_type: widgetType,
      event_type: 'click',
      source_url: sourceUrl,
      custom_properties: { click_target: clickTarget }
    });
  }

  /**
   * エラーを記録
   */
  async trackError(
    organizationId: string,
    widgetType: 'widget' | 'iframe',
    errorMessage: string,
    sourceUrl?: string
  ): Promise<void> {
    await this.track({
      organization_id: organizationId,
      widget_type: widgetType,
      event_type: 'error',
      source_url: sourceUrl,
      error_message: errorMessage
    });
  }

  /**
   * 組織の日次統計を取得
   */
  async getDailyStats(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<EmbedUsageStats[]> {
    try {
      const { data, error } = await this.supabase
        .from('embed_usage_daily')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch daily stats', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * 組織の月間統計を取得
   */
  async getMonthlyStats(
    organizationId: string,
    year: number,
    month: number
  ): Promise<MonthlyUsageStats | null> {
    try {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      const { data, error } = await this.supabase
        .from('embed_usage_monthly')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('month', monthKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch monthly stats', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * プラン制限チェック（月間ビュー数）
   */
  async checkMonthlyLimit(
    organizationId: string,
    plan: PlanType
  ): Promise<{
    allowed: boolean;
    currentViews: number;
    limit: number;
    remaining: number;
  }> {
    try {
      const now = new Date();
      const monthlyStats = await this.getMonthlyStats(
        organizationId,
        now.getFullYear(),
        now.getMonth() + 1
      );

      const currentViews = monthlyStats?.total_views || 0;
      
      // embed設定から制限を取得
      const { checkMonthlyViewLimit } = await import('@/config/embed');
      const limitCheck = checkMonthlyViewLimit(plan, currentViews);

      return {
        allowed: limitCheck.allowed,
        currentViews,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining
      };
    } catch (error) {
      logger.error('Failed to check monthly limit', error instanceof Error ? error : new Error(String(error)));
      // エラー時は制限なしとして扱う（安全側）
      return {
        allowed: true,
        currentViews: 0,
        limit: -1,
        remaining: -1
      };
    }
  }

  /**
   * 人気ソース一覧を取得
   */
  async getTopSources(
    organizationId: string,
    days: number = 30,
    limit: number = 10
  ): Promise<{ url: string; count: number; percentage: number }[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .rpc('get_top_embed_sources', {
          org_id: organizationId,
          start_date: startDate,
          end_date: endDate,
          result_limit: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch top sources', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * リアルタイム統計を取得
   */
  async getRealTimeStats(organizationId: string): Promise<{
    activeWidgets: number;
    todayViews: number;
    todayClicks: number;
    todayErrors: number;
    averageResponseTime: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await this.supabase
        .rpc('get_realtime_embed_stats', {
          org_id: organizationId,
          target_date: today
        });

      if (error) throw error;
      
      return data || {
        activeWidgets: 0,
        todayViews: 0,
        todayClicks: 0,
        todayErrors: 0,
        averageResponseTime: 0
      };
    } catch (error) {
      logger.error('Failed to fetch realtime stats', error instanceof Error ? error : new Error(String(error)));
      return {
        activeWidgets: 0,
        todayViews: 0,
        todayClicks: 0,
        todayErrors: 0,
        averageResponseTime: 0
      };
    }
  }

  /**
   * バッチデータをフラッシュ
   */
  private async flush(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    try {
      const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
      
      const { error } = await this.supabase
        .from('embed_usage')
        .insert(batch);

      if (error) {
        logger.error('Failed to flush usage batch', error instanceof Error ? error : new Error(String(error)));
        // 失敗したデータを戻す（再試行用）
        this.batchQueue.unshift(...batch);
      }
    } catch (error) {
      logger.error('Batch flush error', error instanceof Error ? error : new Error(String(error)));
    }

    // タイマーをクリア
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * 自動フラッシュをスケジュール
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(async () => {
      await this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * IPアドレスを匿名化（GDPR対応）
   */
  private anonymizeIP(ip?: string): string | undefined {
    if (!ip) return undefined;
    
    // IPv4の場合は最後のオクテットを0に
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }
    
    // IPv6の場合は下位64ビットを0に
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts.slice(0, 4).join(':')}::`;
      }
    }
    
    return ip;
  }

  /**
   * User-Agentをサニタイズ
   */
  private sanitizeUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    
    // 個人情報を含む可能性のある部分を除去
    return userAgent
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // IP除去
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // メール除去
      .substring(0, 500); // 長さ制限
  }

  /**
   * リソースクリーンアップ
   */
  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.batchQueue.length > 0) {
      await this.flush();
    }
  }
}

// シングルトンインスタンス
export const usageTracker = new EmbedUsageTracker();

// Graceful shutdown処理
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await usageTracker.cleanup();
  });
  
  process.on('SIGINT', async () => {
    await usageTracker.cleanup();
  });
}