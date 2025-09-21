'use client';

import { supabaseClient } from '@/lib/auth';
import { Organization } from '@/types';

export interface RecommendationScore {
  organizationId: string;
  score: number;
  reasons: string[];
}

export interface RecommendationEngine {
  getUserRecommendations: (userId: string, limit?: number) => Promise<Organization[]>;
  getSimilarOrganizations: (organizationId: string, limit?: number) => Promise<Organization[]>;
  getPopularOrganizations: (timeframe?: 'day' | 'week' | 'month', limit?: number) => Promise<Organization[]>;
  getRecommendationsForIndustry: (industry: string, limit?: number) => Promise<Organization[]>;
  getTrendingOrganizations: (limit?: number) => Promise<Organization[]>;
}

export class LuxuCareRecommendationEngine implements RecommendationEngine {
  private readonly WEIGHTS = {
    FAVORITE_INDUSTRY: 3.0,
    SEARCH_HISTORY: 2.5,
    SIMILAR_SIZE: 1.5,
    SAME_REGION: 1.2,
    RECENTLY_VIEWED: 2.0,
    HAS_SERVICES: 1.3,
    HAS_CASE_STUDIES: 1.4,
    RECENCY_DECAY: 0.1, // 1日あたりの減衰率
  };

  async getUserRecommendations(userId: string, limit: number = 10): Promise<Organization[]> {
    try {
      // ユーザーの設定とアクティビティを並行取得
      const [preferences, favorites, searchHistory, viewHistory] = await Promise.all([
        this.getUserPreferences(userId),
        this.getUserFavorites(userId),
        this.getUserSearchHistory(userId),
        this.getUserViewHistory(userId),
      ]);

      // スコア計算
      const scores = await this.calculateRecommendationScores(
        userId,
        preferences,
        favorites,
        searchHistory,
        viewHistory
      );

      // 上位スコアの企業を取得
      const topScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit * 2); // 余裕を持って取得

      if (topScores.length === 0) {
        // フォールバック: 人気企業を返す
        return this.getPopularOrganizations('week', limit);
      }

      // 企業詳細情報を取得
      const organizationIds = topScores.map(s => s.organizationId);
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          industries,
          address_region,
          address_locality,
          employees,
          founded,
          url,
          created_at
        `)
        .in('id', organizationIds)
        .eq('status', 'published')
        .limit(limit);

      if (error) throw error;

      // スコア順に並び替え
      const orderedOrganizations = topScores
        .map(score => organizations?.find(org => org.id === score.organizationId))
        .filter(Boolean) as Organization[];

      return orderedOrganizations;
    } catch (error) {
      console.error('Failed to get user recommendations:', error);
      return this.getPopularOrganizations('week', limit);
    }
  }

  async getSimilarOrganizations(organizationId: string, limit: number = 5): Promise<Organization[]> {
    try {
      // 対象企業の情報を取得
      const { data: targetOrg, error: targetError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .eq('status', 'published')
        .single();

      if (targetError || !targetOrg) {
        throw new Error('Target organization not found');
      }

      // 類似企業を検索
      let query = supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          industries,
          address_region,
          address_locality,
          employees,
          founded,
          url,
          created_at
        `)
        .eq('status', 'published')
        .neq('id', organizationId);

      // 業界が一致する企業を優先
      if (targetOrg.industries && targetOrg.industries.length > 0) {
        query = query.overlaps('industries', targetOrg.industries);
      }

      const { data: organizations, error } = await query.limit(limit * 3);

      if (error) throw error;

      // 類似度スコアを計算
      const scoredOrganizations = (organizations || []).map(org => ({
        organization: org,
        score: this.calculateSimilarityScore(targetOrg, org),
      }));

      // スコア順に並び替えて返す
      return scoredOrganizations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.organization);
    } catch (error) {
      console.error('Failed to get similar organizations:', error);
      return [];
    }
  }

  async getPopularOrganizations(timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 10): Promise<Organization[]> {
    try {
      const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Plausible Analyticsデータがある場合はそれを使用
      // ここでは簡易的に最近更新された企業を返す
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          industries,
          address_region,
          address_locality,
          employees,
          founded,
          url,
          created_at
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return organizations || [];
    } catch (error) {
      console.error('Failed to get popular organizations:', error);
      return [];
    }
  }

  async getRecommendationsForIndustry(industry: string, limit: number = 10): Promise<Organization[]> {
    try {
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          industries,
          address_region,
          address_locality,
          employees,
          founded,
          url,
          created_at
        `)
        .eq('status', 'published')
        .contains('industries', [industry])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return organizations || [];
    } catch (error) {
      console.error('Failed to get industry recommendations:', error);
      return [];
    }
  }

  async getTrendingOrganizations(limit: number = 10): Promise<Organization[]> {
    // 簡易的にサービス数やケーススタディ数が多い企業をトレンド企業とする
    try {
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          logo_url,
          industries,
          address_region,
          address_locality,
          employees,
          founded,
          url,
          created_at,
          services(count),
          case_studies(count)
        `)
        .eq('status', 'published')
        .not('logo_url', 'is', null)
        .not('url', 'is', null)
        .limit(limit * 2);

      if (error) throw error;

      // コンテンツ充実度でソート
      const scoredOrganizations = (organizations || []).map(org => ({
        organization: org,
        score: (org.services?.length || 0) * 2 + (org.case_studies?.length || 0) * 3,
      }));

      return scoredOrganizations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.organization);
    } catch (error) {
      console.error('Failed to get trending organizations:', error);
      return [];
    }
  }

  private async getUserPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  private async getUserFavorites(userId: string) {
    // LocalStorageベースのお気に入りは直接取得できないため、
    // サーバーサイドでは空配列を返す
    return [];
  }

  private async getUserSearchHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  private async getUserViewHistory(userId: string) {
    // 実装では閲覧履歴テーブルを作成する必要がある
    // 現在は空配列を返す
    return [];
  }

  private async calculateRecommendationScores(
    userId: string,
    preferences: any,
    favorites: any[],
    searchHistory: any[],
    viewHistory: any[]
  ): Promise<RecommendationScore[]> {
    // 全企業を取得
    const { data: allOrganizations, error } = await supabase
      .from('organizations')
      .select('id, industries, address_region, employees, created_at')
      .eq('status', 'published');

    if (error || !allOrganizations) return [];

    const scores: Map<string, { score: number; reasons: string[] }> = new Map();

    // 各企業にスコアを計算
    for (const org of allOrganizations) {
      let score = 0;
      const reasons: string[] = [];

      // 設定された好みの業界
      if (preferences?.favorite_industries?.length > 0) {
        const commonIndustries = org.industries?.filter(
          (industry: string) => preferences.favorite_industries.includes(industry)
        ) || [];
        if (commonIndustries.length > 0) {
          score += this.WEIGHTS.FAVORITE_INDUSTRY * commonIndustries.length;
          reasons.push(`好みの業界: ${commonIndustries.join(', ')}`);
        }
      }

      // 検索履歴に基づく推薦
      for (const search of searchHistory) {
        if (search.search_params.industry && org.industries?.includes(search.search_params.industry)) {
          score += this.WEIGHTS.SEARCH_HISTORY;
          reasons.push(`検索履歴の業界: ${search.search_params.industry}`);
        }
        if (search.search_params.region && org.address_region === search.search_params.region) {
          score += this.WEIGHTS.SAME_REGION;
          reasons.push(`検索履歴の地域: ${search.search_params.region}`);
        }
      }

      // 基本スコア（コンテンツの充実度など）
      score += 1.0; // ベースライン

      scores.set(org.id, { score, reasons });
    }

    return Array.from(scores.entries()).map(([orgId, { score, reasons }]) => ({
      organizationId: orgId,
      score,
      reasons,
    }));
  }

  private calculateSimilarityScore(org1: any, org2: any): number {
    let score = 0;

    // 業界の類似度
    if (org1.industries && org2.industries) {
      const commonIndustries = org1.industries.filter((industry: string) =>
        org2.industries.includes(industry)
      );
      score += commonIndustries.length * 2;
    }

    // 地域の類似度
    if (org1.address_region === org2.address_region) {
      score += 1.5;
    }

    // 企業規模の類似度
    if (org1.employees && org2.employees) {
      const ratio = Math.min(org1.employees, org2.employees) / Math.max(org1.employees, org2.employees);
      score += ratio;
    }

    // 設立年の類似度
    if (org1.founded && org2.founded) {
      const year1 = new Date(org1.founded).getFullYear();
      const year2 = new Date(org2.founded).getFullYear();
      const yearDiff = Math.abs(year1 - year2);
      score += Math.max(0, 1 - yearDiff / 20); // 20年差で類似度0
    }

    return score;
  }
}

// シングルトンインスタンス
export const recommendationEngine = new LuxuCareRecommendationEngine();