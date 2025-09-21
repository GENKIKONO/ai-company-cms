'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { recommendationEngine } from '@/lib/recommendations';
import { Organization } from '@/types';

export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Organization[]>([]);
  const [popularOrganizations, setPopularOrganizations] = useState<Organization[]>([]);
  const [trendingOrganizations, setTrendingOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザー向け推薦を取得
  const loadUserRecommendations = async (limit: number = 10) => {
    if (!user) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRecommendations = await recommendationEngine.getUserRecommendations(user.id, limit);
      setRecommendations(userRecommendations);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      console.error('Failed to load user recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 人気企業を取得
  const loadPopularOrganizations = async (timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const popular = await recommendationEngine.getPopularOrganizations(timeframe, limit);
      setPopularOrganizations(popular);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load popular organizations');
      console.error('Failed to load popular organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  // トレンド企業を取得
  const loadTrendingOrganizations = async (limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const trending = await recommendationEngine.getTrendingOrganizations(limit);
      setTrendingOrganizations(trending);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending organizations');
      console.error('Failed to load trending organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 類似企業を取得
  const getSimilarOrganizations = async (organizationId: string, limit: number = 5): Promise<Organization[]> => {
    try {
      const similar = await recommendationEngine.getSimilarOrganizations(organizationId, limit);
      

      return similar;
    } catch (err) {
      console.error('Failed to load similar organizations:', err);
      return [];
    }
  };

  // 業界別推薦を取得
  const getIndustryRecommendations = async (industry: string, limit: number = 10): Promise<Organization[]> => {
    try {
      const industryRecommendations = await recommendationEngine.getRecommendationsForIndustry(industry, limit);
      

      return industryRecommendations;
    } catch (err) {
      console.error('Failed to load industry recommendations:', err);
      return [];
    }
  };

  // 推薦クリック追跡
  const trackRecommendationClick = (organization: Organization, recommendationType: string, position: number) => {
  };

  // 初期読み込み
  useEffect(() => {
    if (user) {
      loadUserRecommendations();
    }
    loadPopularOrganizations();
    loadTrendingOrganizations();
  }, [user]);

  return {
    // データ
    recommendations,
    popularOrganizations,
    trendingOrganizations,
    loading,
    error,
    
    // 関数
    loadUserRecommendations,
    loadPopularOrganizations,
    loadTrendingOrganizations,
    getSimilarOrganizations,
    getIndustryRecommendations,
    trackRecommendationClick,
    
    // ユーティリティ
    hasRecommendations: recommendations.length > 0,
    hasPopular: popularOrganizations.length > 0,
    hasTrending: trendingOrganizations.length > 0,
  };
}