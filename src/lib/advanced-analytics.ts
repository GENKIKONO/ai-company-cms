'use client';

import { supabase } from '@/lib/supabase';
import { Organization } from '@/types';

export interface AnalyticsMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalSearches: number;
  avgSearchTime: number;
  topIndustries: Array<{ industry: string; count: number; growth: number }>;
  topRegions: Array<{ region: string; count: number; growth: number }>;
  organizationGrowth: Array<{ date: string; count: number }>;
  searchTrends: Array<{ date: string; searches: number; avgTime: number }>;
  userEngagement: {
    dailyActiveUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
}

export interface MLInsights {
  marketTrends: Array<{
    trend: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
  industryPredictions: Array<{
    industry: string;
    predictedGrowth: number;
    timeframe: '3months' | '6months' | '1year';
    confidence: number;
  }>;
  searchPatterns: Array<{
    pattern: string;
    frequency: number;
    timeOfDay: string;
    userSegment: string;
  }>;
  organizationRecommendations: Array<{
    organizationId: string;
    reason: string;
    score: number;
    category: 'trending' | 'similar' | 'emerging';
  }>;
  anomalies: Array<{
    type: 'search_spike' | 'data_quality' | 'user_behavior';
    description: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: string;
  }>;
}

export interface PredictiveModels {
  organizationSuccess: {
    model: 'gradient_boosting';
    features: string[];
    accuracy: number;
    lastTrained: string;
  };
  searchDemand: {
    model: 'time_series_arima';
    seasonality: 'weekly' | 'monthly';
    accuracy: number;
    lastTrained: string;
  };
  userChurn: {
    model: 'random_forest';
    features: string[];
    precision: number;
    recall: number;
    lastTrained: string;
  };
}

export class AdvancedAnalyticsService {
  private readonly ML_API_BASE = 'https://ml-api.luxucare.jp'; // Placeholder for ML service

  async getMetrics(timeRange: '24h' | '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsMetrics> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Fetch organization metrics
      const { data: organizations, count: totalOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString());

      // Fetch active organizations (updated in last 30 days)
      const { count: activeOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get industry distribution with growth calculation
      const { data: industryData } = await supabase
        .rpc('get_industry_analytics', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      // Get region distribution
      const { data: regionData } = await supabase
        .rpc('get_region_analytics', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      // Generate time series data for organization growth
      const organizationGrowth = await this.generateGrowthTimeSeries(startDate, endDate);
      
      // Generate search trends (mock data for demo)
      const searchTrends = await this.generateSearchTrends(startDate, endDate);

      return {
        totalOrganizations: totalOrganizations || 0,
        activeOrganizations: activeOrganizations || 0,
        totalSearches: 1250, // Mock data
        avgSearchTime: 145, // Mock data in ms
        topIndustries: industryData || [],
        topRegions: regionData || [],
        organizationGrowth,
        searchTrends,
        userEngagement: {
          dailyActiveUsers: 420, // Mock data
          averageSessionDuration: 8.5, // Mock data in minutes
          bounceRate: 0.32, // Mock data
        },
      };

    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      throw error;
    }
  }

  async getMLInsights(): Promise<MLInsights> {
    try {
      // In a real implementation, this would call your ML service
      // For demo purposes, we'll return structured mock data
      
      return {
        marketTrends: [
          {
            trend: 'AI/ML企業の急増',
            confidence: 0.92,
            impact: 'high',
            description: '過去3ヶ月でAI/ML関連企業の登録が45%増加。特にLLM活用サービスが注目を集めている。'
          },
          {
            trend: 'リモートワーク支援ツールの成長',
            confidence: 0.87,
            impact: 'medium',
            description: 'リモートワーク関連のSaaS企業の検索数が継続的に増加傾向。'
          },
          {
            trend: 'サステナビリティ企業の注目度上昇',
            confidence: 0.78,
            impact: 'medium',
            description: '環境・サステナビリティ関連企業への検索・アクセスが20%増加。'
          }
        ],
        industryPredictions: [
          {
            industry: 'AI/ML',
            predictedGrowth: 0.35,
            timeframe: '6months',
            confidence: 0.89
          },
          {
            industry: 'FinTech',
            predictedGrowth: 0.22,
            timeframe: '6months',
            confidence: 0.76
          },
          {
            industry: 'HealthTech',
            predictedGrowth: 0.28,
            timeframe: '6months',
            confidence: 0.82
          }
        ],
        searchPatterns: [
          {
            pattern: 'スタートアップ + 東京',
            frequency: 156,
            timeOfDay: '14:00-16:00',
            userSegment: 'venture_capital'
          },
          {
            pattern: 'SaaS + B2B',
            frequency: 134,
            timeOfDay: '10:00-12:00',
            userSegment: 'enterprise'
          },
          {
            pattern: 'AI + 機械学習',
            frequency: 98,
            timeOfDay: '09:00-11:00',
            userSegment: 'tech_professional'
          }
        ],
        organizationRecommendations: [
          {
            organizationId: 'org-123',
            reason: '類似企業と比較して急激な成長を示している',
            score: 0.94,
            category: 'trending'
          },
          {
            organizationId: 'org-456',
            reason: 'ユーザーの検索履歴に基づく推奨',
            score: 0.87,
            category: 'similar'
          }
        ],
        anomalies: [
          {
            type: 'search_spike',
            description: '特定のキーワードで通常の5倍の検索数を記録',
            severity: 'medium',
            detectedAt: new Date().toISOString()
          }
        ]
      };

    } catch (error) {
      console.error('Error fetching ML insights:', error);
      throw error;
    }
  }

  async getPredictiveModels(): Promise<PredictiveModels> {
    return {
      organizationSuccess: {
        model: 'gradient_boosting',
        features: [
          'employee_count', 'founding_year', 'funding_amount',
          'technology_stack_diversity', 'update_frequency',
          'social_media_presence', 'website_traffic'
        ],
        accuracy: 0.87,
        lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      searchDemand: {
        model: 'time_series_arima',
        seasonality: 'weekly',
        accuracy: 0.83,
        lastTrained: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      userChurn: {
        model: 'random_forest',
        features: [
          'session_duration', 'page_views', 'search_frequency',
          'last_login', 'feature_usage', 'support_tickets'
        ],
        precision: 0.78,
        recall: 0.82,
        lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  async generateOrganizationInsights(organizationId: string): Promise<{
    performanceScore: number;
    benchmarkComparison: {
      industry: number;
      region: number;
      size: number;
    };
    improvementSuggestions: Array<{
      category: string;
      suggestion: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'low' | 'medium' | 'high';
    }>;
    trendAnalysis: {
      viewsGrowth: number;
      searchRanking: number;
      competitorAnalysis: Array<{
        competitor: string;
        similarity: number;
        differentiators: string[];
      }>;
    };
  }> {
    try {
      // Fetch organization data
      const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Generate performance score based on various factors
      const performanceScore = this.calculatePerformanceScore(organization);

      return {
        performanceScore,
        benchmarkComparison: {
          industry: 0.73, // Mock data - would be calculated against industry average
          region: 0.68,   // Mock data - would be calculated against regional average
          size: 0.81      // Mock data - would be calculated against similar-sized companies
        },
        improvementSuggestions: [
          {
            category: 'コンテンツ',
            suggestion: '技術スタックの詳細情報を追加して検索可能性を向上',
            impact: 'high',
            effort: 'low'
          },
          {
            category: 'SEO',
            suggestion: 'メタデータとキーワードの最適化',
            impact: 'medium',
            effort: 'medium'
          },
          {
            category: '更新頻度',
            suggestion: '定期的な情報更新でアクティビティスコアを向上',
            impact: 'medium',
            effort: 'low'
          }
        ],
        trendAnalysis: {
          viewsGrowth: 0.23, // Mock data - 23% growth
          searchRanking: 15, // Mock data - average ranking
          competitorAnalysis: [
            {
              competitor: '類似企業A',
              similarity: 0.87,
              differentiators: ['独自技術', '市場シェア', '地理的優位性']
            }
          ]
        }
      };

    } catch (error) {
      console.error('Error generating organization insights:', error);
      throw error;
    }
  }

  private calculatePerformanceScore(organization: Organization): number {
    let score = 0;
    let maxScore = 0;

    // Completeness score (0-30 points)
    const completenessFields = [
      'name', 'description', 'url', 'email', 'phone', 'address',
      'industries', 'technologies', 'services', 'employee_count'
    ];
    const completedFields = completenessFields.filter(field => 
      organization[field as keyof Organization] && 
      (Array.isArray(organization[field as keyof Organization]) 
        ? (organization[field as keyof Organization] as any[]).length > 0
        : organization[field as keyof Organization]
      )
    ).length;
    score += (completedFields / completenessFields.length) * 30;
    maxScore += 30;

    // Recency score (0-25 points)
    const updatedAt = new Date(organization.updated_at);
    const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 25 - (daysSinceUpdate / 30) * 25);
    score += recencyScore;
    maxScore += 25;

    // Content quality score (0-25 points)
    const descriptionLength = organization.description?.length || 0;
    const hasLogo = !!organization.logo_url;
    const hasCaseStudies = organization.case_studies && organization.case_studies.length > 0;
    const contentScore = 
      (Math.min(descriptionLength / 500, 1) * 10) + 
      (hasLogo ? 8 : 0) + 
      (hasCaseStudies ? 7 : 0);
    score += contentScore;
    maxScore += 25;

    // Visibility score (0-20 points)
    const isPublic = organization.visibility === 'public';
    const isVerified = organization.is_verified;
    const visibilityScore = (isPublic ? 12 : 0) + (isVerified ? 8 : 0);
    score += visibilityScore;
    maxScore += 20;

    return Math.round((score / maxScore) * 100) / 100;
  }

  private async generateGrowthTimeSeries(startDate: Date, endDate: Date): Promise<Array<{ date: string; count: number }>> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Fetch actual data from database
      const { count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .lte('created_at', date.toISOString());

      data.push({
        date: date.toISOString().split('T')[0],
        count: count || 0
      });
    }

    return data;
  }

  private async generateSearchTrends(startDate: Date, endDate: Date): Promise<Array<{ date: string; searches: number; avgTime: number }>> {
    // Mock implementation - in reality, this would fetch from analytics events
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data: Array<{ date: string; searches: number; avgTime: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Generate realistic mock data with some variance
      const baseSearches = 50;
      const variance = Math.random() * 20 - 10;
      const searches = Math.max(0, Math.round(baseSearches + variance));
      
      const baseAvgTime = 150;
      const timeVariance = Math.random() * 50 - 25;
      const avgTime = Math.max(50, Math.round(baseAvgTime + timeVariance));

      data.push({
        date: date.toISOString().split('T')[0],
        searches,
        avgTime
      });
    }

    return data;
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();