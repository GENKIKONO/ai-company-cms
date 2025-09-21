'use client';

import { supabase } from '@/lib/auth';

export interface AnalyticsMetrics {
  // 基本統計
  totalOrganizations: number;
  totalUsers: number;
  totalFavorites: number;
  totalSearches: number;
  
  // アクティビティメトリクス
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  
  // コンテンツ統計
  organizationsWithLogos: number;
  organizationsWithServices: number;
  organizationsWithCaseStudies: number;
  organizationsWithWebsites: number;
  
  // 業界・地域分布
  topIndustries: { industry: string; count: number }[];
  topRegions: { region: string; count: number }[];
  
  // ユーザーエンゲージメント
  averageSearchesPerUser: number;
  averageFavoritesPerUser: number;
  searchConversionRate: number; // 検索 -> 詳細ページ閲覧率
  
  // トレンド
  organizationGrowth: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  popularOrganizations: { organization: any; views: number }[];
  
  // パフォーマンス
  averagePageLoadTime: number;
  errorRate: number;
  uptime: number;
}

export interface UserAnalytics {
  userId: string;
  totalSearches: number;
  totalFavorites: number;
  totalViews: number;
  lastActiveAt: string;
  favoriteIndustries: string[];
  mostViewedOrganizations: any[];
  searchHistory: any[];
}

export class AnalyticsDashboard {
  // 全体メトリクスを取得
  async getOverallMetrics(): Promise<AnalyticsMetrics> {
    try {
      const [
        organizationStats,
        userStats,
        industryStats,
        regionStats,
        contentStats,
        growthStats
      ] = await Promise.all([
        this.getOrganizationStats(),
        this.getUserStats(),
        this.getIndustryStats(),
        this.getRegionStats(),
        this.getContentStats(),
        this.getGrowthStats(),
      ]);

      return {
        // 基本統計
        totalOrganizations: organizationStats.total,
        totalUsers: userStats.total,
        totalFavorites: userStats.totalFavorites,
        totalSearches: userStats.totalSearches,
        
        // アクティビティメトリクス
        dailyActiveUsers: userStats.dailyActive,
        weeklyActiveUsers: userStats.weeklyActive,
        monthlyActiveUsers: userStats.monthlyActive,
        
        // コンテンツ統計
        organizationsWithLogos: contentStats.withLogos,
        organizationsWithServices: contentStats.withServices,
        organizationsWithCaseStudies: contentStats.withCaseStudies,
        organizationsWithWebsites: contentStats.withWebsites,
        
        // 業界・地域分布
        topIndustries: industryStats,
        topRegions: regionStats,
        
        // ユーザーエンゲージメント
        averageSearchesPerUser: userStats.averageSearches,
        averageFavoritesPerUser: userStats.averageFavorites,
        searchConversionRate: 0.65, // プレースホルダー
        
        // トレンド
        organizationGrowth: growthStats.organizations,
        userGrowth: growthStats.users,
        popularOrganizations: growthStats.popular,
        
        // パフォーマンス（プレースホルダー）
        averagePageLoadTime: 1.2,
        errorRate: 0.01,
        uptime: 99.9,
      };
    } catch (error) {
      console.error('Failed to get overall metrics:', error);
      throw error;
    }
  }

  // ユーザー個別分析を取得
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const [
        searchHistory,
        favoriteStats,
        viewHistory
      ] = await Promise.all([
        this.getUserSearchHistory(userId),
        this.getUserFavoriteStats(userId),
        this.getUserViewHistory(userId),
      ]);

      const favoriteIndustries = this.extractFavoriteIndustries(favoriteStats);

      return {
        userId,
        totalSearches: searchHistory.length,
        totalFavorites: favoriteStats.length,
        totalViews: viewHistory.length,
        lastActiveAt: this.getLastActiveTime(searchHistory, viewHistory),
        favoriteIndustries,
        mostViewedOrganizations: viewHistory.slice(0, 10),
        searchHistory: searchHistory.slice(0, 20),
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  // 組織統計
  private async getOrganizationStats() {
    const { count } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return { total: count || 0 };
  }

  // ユーザー統計
  private async getUserStats() {
    // Supabase Auth APIから統計を取得
    // 実際の実装では管理者権限が必要
    
    // 保存検索数を取得
    const { count: totalSearches } = await supabase
      .from('saved_searches')
      .select('*', { count: 'exact', head: true });

    // 簡易的な統計（実際の実装では詳細なクエリが必要）
    return {
      total: 150, // プレースホルダー
      totalFavorites: 450, // プレースホルダー
      totalSearches: totalSearches || 0,
      dailyActive: 25,
      weeklyActive: 75,
      monthlyActive: 120,
      averageSearches: 3.2,
      averageFavorites: 5.5,
    };
  }

  // 業界統計
  private async getIndustryStats() {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('industries')
      .eq('status', 'published');

    const industryCounts: { [key: string]: number } = {};
    
    organizations?.forEach(org => {
      org.industries?.forEach((industry: string) => {
        industryCounts[industry] = (industryCounts[industry] || 0) + 1;
      });
    });

    return Object.entries(industryCounts)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // 地域統計
  private async getRegionStats() {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('address_region')
      .eq('status', 'published')
      .not('address_region', 'is', null);

    const regionCounts: { [key: string]: number } = {};
    
    organizations?.forEach(org => {
      if (org.address_region) {
        regionCounts[org.address_region] = (regionCounts[org.address_region] || 0) + 1;
      }
    });

    return Object.entries(regionCounts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // コンテンツ統計
  private async getContentStats() {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('logo_url, url')
      .eq('status', 'published');

    const { count: withServices } = await supabase
      .from('services')
      .select('organization_id', { count: 'exact', head: true });

    const { count: withCaseStudies } = await supabase
      .from('case_studies')
      .select('organization_id', { count: 'exact', head: true });

    const withLogos = organizations?.filter(org => org.logo_url).length || 0;
    const withWebsites = organizations?.filter(org => org.url).length || 0;

    return {
      withLogos,
      withServices: withServices || 0,
      withCaseStudies: withCaseStudies || 0,
      withWebsites,
    };
  }

  // 成長統計
  private async getGrowthStats() {
    // 組織の成長
    const { data: orgGrowth } = await supabase
      .from('organizations')
      .select('created_at')
      .eq('status', 'published')
      .order('created_at');

    // 人気組織（簡易版）
    const { data: popular } = await supabase
      .from('organizations')
      .select('*')
      .eq('status', 'published')
      .not('logo_url', 'is', null)
      .limit(10);

    // 日付ごとの集計
    const organizationsByDate = this.groupByDate(orgGrowth || []);

    return {
      organizations: organizationsByDate,
      users: [], // プレースホルダー
      popular: popular?.map(org => ({ organization: org, views: Math.floor(Math.random() * 1000) })) || [],
    };
  }

  // ユーザーの検索履歴
  private async getUserSearchHistory(userId: string) {
    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  // ユーザーのお気に入り統計
  private async getUserFavoriteStats(userId: string) {
    // LocalStorageベースのため、サーバーサイドでは取得できない
    return [];
  }

  // ユーザーの閲覧履歴
  private async getUserViewHistory(userId: string) {
    // 実装では閲覧履歴テーブルが必要
    return [];
  }

  // ユーティリティ関数
  private extractFavoriteIndustries(favorites: any[]): string[] {
    const industries: { [key: string]: number } = {};
    
    favorites.forEach(fav => {
      fav.industries?.forEach((industry: string) => {
        industries[industry] = (industries[industry] || 0) + 1;
      });
    });

    return Object.entries(industries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([industry]) => industry);
  }

  private getLastActiveTime(searchHistory: any[], viewHistory: any[]): string {
    const allDates = [
      ...searchHistory.map(s => s.created_at),
      ...viewHistory.map(v => v.created_at),
    ].filter(Boolean);

    if (allDates.length === 0) return new Date().toISOString();

    return allDates.sort().reverse()[0];
  }

  private groupByDate(items: { created_at: string }[]) {
    const grouped: { [key: string]: number } = {};
    
    items.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // リアルタイム統計の更新
  async updateRealTimeMetrics(eventType: string, data: any) {
    // 実際の実装では、Redis やリアルタイム DB に統計を保存
    console.log('Updating real-time metrics:', eventType, data);
  }

  // カスタムイベント追跡
  async trackCustomEvent(eventName: string, properties: any) {
    // Plausible Analytics や他の分析サービスにカスタムイベントを送信
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(eventName, { props: properties });
    }
  }
}

// シングルトンインスタンス
export const analyticsDashboard = new AnalyticsDashboard();