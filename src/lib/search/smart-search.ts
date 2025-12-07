/**
 * Smart Search Engine
 * AI搭載スマート検索システム - 自然言語クエリ処理と意図認識
 */

import { performAdvancedSearch, type AdvancedSearchFilters } from './advanced-search';
import type { Organization, Service, CaseStudy } from '@/types/legacy/database';

export interface SmartSearchQuery {
  originalQuery: string;
  processedQuery: string;
  intent: SearchIntent;
  entities: ExtractedEntity[];
  filters: AdvancedSearchFilters;
  confidence: number;
}

export type SearchIntent = 
  | 'find_organization'
  | 'find_service'
  | 'find_case_study'
  | 'compare_services'
  | 'industry_analysis'
  | 'location_search'
  | 'size_based_search'
  | 'general_search';

export interface ExtractedEntity {
  type: 'industry' | 'location' | 'company_size' | 'service_type' | 'year' | 'price_range';
  value: string | number;
  confidence: number;
  originalText: string;
}

export interface SmartSearchResults {
  query: SmartSearchQuery;
  results: {
    organizations: Organization[];
    services: (Service & { organization: Organization })[];
    case_studies: (CaseStudy & { organization: Organization })[];
  };
  suggestions: string[];
  totalFound: number;
  searchTime: number;
  explanation: string;
}

/**
 * メインのスマート検索エンジン
 */
export class SmartSearchEngine {
  private industryKeywords = new Map([
    ['ai', 'AI・人工知能'],
    ['artificial intelligence', 'AI・人工知能'],
    ['人工知能', 'AI・人工知能'],
    ['machine learning', '機械学習'],
    ['ml', '機械学習'],
    ['機械学習', '機械学習'],
    ['dx', 'DX・デジタル変革'],
    ['digital transformation', 'DX・デジタル変革'],
    ['デジタル変革', 'DX・デジタル変革'],
    ['iot', 'IoT'],
    ['internet of things', 'IoT'],
    ['web', 'Web開発'],
    ['web開発', 'Web開発'],
    ['ホームページ', 'Web開発'],
    ['システム開発', 'システム開発'],
    ['アプリ開発', 'アプリ開発'],
    ['mobile', 'アプリ開発'],
    ['モバイル', 'アプリ開発'],
    ['クラウド', 'クラウド'],
    ['cloud', 'クラウド'],
    ['aws', 'クラウド'],
    ['azure', 'クラウド'],
    ['gcp', 'クラウド'],
    ['erp', 'ERP'],
    ['crm', 'CRM'],
    ['マーケティング', 'マーケティング'],
    ['marketing', 'マーケティング'],
    ['広告', 'マーケティング'],
    ['seo', 'SEO・マーケティング'],
    ['ec', 'EC・eコマース'],
    ['ecommerce', 'EC・eコマース'],
    ['通販', 'EC・eコマース'],
    ['blockchain', 'ブロックチェーン'],
    ['ブロックチェーン', 'ブロックチェーン'],
    ['セキュリティ', 'セキュリティ'],
    ['security', 'セキュリティ'],
    ['fintech', 'FinTech'],
    ['フィンテック', 'FinTech'],
  ]);

  private locationKeywords = new Map([
    ['tokyo', '東京都'],
    ['東京', '東京都'],
    ['osaka', '大阪府'],
    ['大阪', '大阪府'],
    ['kyoto', '京都府'],
    ['京都', '京都府'],
    ['yokohama', '神奈川県'],
    ['横浜', '神奈川県'],
    ['nagoya', '愛知県'],
    ['名古屋', '愛知県'],
    ['fukuoka', '福岡県'],
    ['福岡', '福岡県'],
    ['sendai', '宮城県'],
    ['仙台', '宮城県'],
    ['sapporo', '北海道'],
    ['札幌', '北海道'],
    ['shibuya', '東京都'],
    ['渋谷', '東京都'],
    ['shinjuku', '東京都'],
    ['新宿', '東京都'],
    ['ginza', '東京都'],
    ['銀座', '東京都'],
  ]);

  private companySizeKeywords = new Map([
    ['startup', 'startup'],
    ['スタートアップ', 'startup'],
    ['ベンチャー', 'startup'],
    ['venture', 'startup'],
    ['small', 'small'],
    ['小企業', 'small'],
    ['中小企業', 'small'],
    ['sme', 'small'],
    ['medium', 'medium'],
    ['中企業', 'medium'],
    ['large', 'large'],
    ['大企業', 'large'],
    ['enterprise', 'enterprise'],
    ['大手', 'enterprise'],
    ['大手企業', 'enterprise'],
  ]);

  /**
   * 自然言語クエリを解析してスマート検索を実行
   */
  async executeSmartSearch(query: string): Promise<SmartSearchResults> {
    const startTime = Date.now();
    
    // クエリを解析
    const smartQuery = await this.analyzeQuery(query);
    
    // 高度検索を実行
    const searchResults = await performAdvancedSearch(smartQuery.filters);
    
    const searchTime = Date.now() - startTime;
    
    // 結果の説明を生成
    const explanation = this.generateExplanation(smartQuery, searchResults);
    
    // 関連する検索提案を生成
    const suggestions = this.generateSuggestions(smartQuery);
    
    return {
      query: smartQuery,
      results: {
        organizations: searchResults.organizations,
        services: searchResults.services,
        case_studies: searchResults.case_studies,
      },
      suggestions,
      totalFound: searchResults.total,
      searchTime,
      explanation,
    };
  }

  /**
   * 自然言語クエリを解析
   */
  private async analyzeQuery(query: string): Promise<SmartSearchQuery> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // エンティティ抽出
    const entities = this.extractEntities(normalizedQuery);
    
    // 検索意図認識
    const intent = this.recognizeIntent(normalizedQuery, entities);
    
    // フィルターを構築
    const filters = this.buildFilters(normalizedQuery, entities, intent);
    
    // 信頼度スコア計算
    const confidence = this.calculateConfidence(entities, intent);
    
    return {
      originalQuery: query,
      processedQuery: this.processQuery(normalizedQuery, entities),
      intent,
      entities,
      filters,
      confidence,
    };
  }

  /**
   * エンティティ抽出
   */
  private extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // 業界キーワード検出
    for (const [keyword, industry] of this.industryKeywords) {
      if (query.includes(keyword)) {
        entities.push({
          type: 'industry',
          value: industry,
          confidence: 0.9,
          originalText: keyword,
        });
      }
    }
    
    // 地域キーワード検出
    for (const [keyword, location] of this.locationKeywords) {
      if (query.includes(keyword)) {
        entities.push({
          type: 'location',
          value: location,
          confidence: 0.9,
          originalText: keyword,
        });
      }
    }
    
    // 企業規模キーワード検出
    for (const [keyword, size] of this.companySizeKeywords) {
      if (query.includes(keyword)) {
        entities.push({
          type: 'company_size',
          value: size,
          confidence: 0.8,
          originalText: keyword,
        });
      }
    }
    
    // 年数の検出
    const yearMatches = query.match(/(\d{4})年?/g);
    if (yearMatches) {
      yearMatches.forEach(match => {
        const year = parseInt(match.replace('年', ''));
        if (year >= 1900 && year <= new Date().getFullYear()) {
          entities.push({
            type: 'year',
            value: year,
            confidence: 0.95,
            originalText: match,
          });
        }
      });
    }
    
    // 価格範囲の検出
    const priceMatches = query.match(/(\d+)万円?/g);
    if (priceMatches) {
      priceMatches.forEach(match => {
        const price = parseInt(match.replace(/[万円]/g, '')) * 10000;
        entities.push({
          type: 'price_range',
          value: price,
          confidence: 0.8,
          originalText: match,
        });
      });
    }
    
    return entities;
  }

  /**
   * 検索意図認識
   */
  private recognizeIntent(query: string, entities: ExtractedEntity[]): SearchIntent {
    // 比較を示すキーワード
    if (query.includes('比較') || query.includes('違い') || query.includes('vs')) {
      return 'compare_services';
    }
    
    // 業界分析を示すキーワード
    if (query.includes('業界') || query.includes('市場') || query.includes('トレンド')) {
      return 'industry_analysis';
    }
    
    // 事例検索を示すキーワード
    if (query.includes('事例') || query.includes('導入') || query.includes('成功例')) {
      return 'find_case_study';
    }
    
    // サービス検索を示すキーワード
    if (query.includes('サービス') || query.includes('ツール') || query.includes('システム')) {
      return 'find_service';
    }
    
    // 地域ベースの検索
    const hasLocation = entities.some(e => e.type === 'location');
    if (hasLocation) {
      return 'location_search';
    }
    
    // 企業規模ベースの検索
    const hasCompanySize = entities.some(e => e.type === 'company_size');
    if (hasCompanySize) {
      return 'size_based_search';
    }
    
    // 企業検索を示すキーワード
    if (query.includes('企業') || query.includes('会社') || query.includes('法人')) {
      return 'find_organization';
    }
    
    return 'general_search';
  }

  /**
   * フィルター構築
   */
  private buildFilters(
    query: string, 
    entities: ExtractedEntity[], 
    intent: SearchIntent
  ): AdvancedSearchFilters {
    const filters: AdvancedSearchFilters = {
      query: this.extractSearchTerms(query, entities),
      type: this.getSearchType(intent),
      industries: [],
      regions: [],
      categories: [],
      companySize: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: 20,
    };

    // エンティティベースのフィルター適用
    entities.forEach(entity => {
      switch (entity.type) {
        case 'industry':
          if (typeof entity.value === 'string') {
            filters.industries.push(entity.value);
          }
          break;
        case 'location':
          if (typeof entity.value === 'string') {
            filters.regions.push(entity.value);
          }
          break;
        case 'company_size':
          if (typeof entity.value === 'string') {
            filters.companySize?.push(entity.value);
          }
          break;
        case 'year':
          if (typeof entity.value === 'number') {
            // 設立年の範囲を設定（前後5年）
            filters.establishedYear = {
              min: entity.value - 5,
              max: entity.value + 5,
            };
          }
          break;
        case 'price_range':
          if (typeof entity.value === 'number') {
            filters.priceRange = {
              max: entity.value,
            };
          }
          break;
      }
    });

    // 意図ベースの調整
    switch (intent) {
      case 'compare_services':
        filters.type = 'services';
        filters.sortBy = 'name';
        filters.limit = 10;
        break;
      case 'industry_analysis':
        filters.type = 'organizations';
        filters.sortBy = 'name';
        filters.limit = 50;
        break;
      case 'find_case_study':
        filters.type = 'case_studies';
        filters.sortBy = 'updated';
        break;
      case 'location_search':
        filters.sortBy = 'name';
        break;
      case 'size_based_search':
        filters.type = 'organizations';
        filters.sortBy = 'name';
        break;
    }

    return filters;
  }

  /**
   * 検索タイプの決定
   */
  private getSearchType(intent: SearchIntent): 'all' | 'organizations' | 'services' | 'case_studies' {
    switch (intent) {
      case 'find_organization':
      case 'location_search':
      case 'size_based_search':
      case 'industry_analysis':
        return 'organizations';
      case 'find_service':
      case 'compare_services':
        return 'services';
      case 'find_case_study':
        return 'case_studies';
      default:
        return 'all';
    }
  }

  /**
   * 検索語句の抽出（エンティティを除く）
   */
  private extractSearchTerms(query: string, entities: ExtractedEntity[]): string {
    let cleanQuery = query;
    
    // エンティティのキーワードを削除
    entities.forEach(entity => {
      cleanQuery = cleanQuery.replace(entity.originalText, '');
    });
    
    // 不要な語句を削除
    const stopWords = ['の', 'が', 'を', 'に', 'で', 'から', 'まで', 'について', 'による'];
    stopWords.forEach(word => {
      cleanQuery = cleanQuery.replace(new RegExp(word, 'g'), '');
    });
    
    return cleanQuery.trim().replace(/\s+/g, ' ');
  }

  /**
   * クエリ処理
   */
  private processQuery(query: string, entities: ExtractedEntity[]): string {
    let processed = query;
    
    // エンティティを標準化されたフォーマットに置換
    entities.forEach(entity => {
      processed = processed.replace(
        entity.originalText, 
        `[${entity.type}:${entity.value}]`
      );
    });
    
    return processed;
  }

  /**
   * 信頼度スコア計算
   */
  private calculateConfidence(entities: ExtractedEntity[], intent: SearchIntent): number {
    if (entities.length === 0) return 0.3;
    
    const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    
    // 意図に基づくボーナス
    let intentBonus = 0.1;
    if (intent !== 'general_search') {
      intentBonus = 0.2;
    }
    
    return Math.min(0.95, avgEntityConfidence + intentBonus);
  }

  /**
   * 結果の説明生成
   */
  private generateExplanation(query: SmartSearchQuery, results: any): string {
    const { intent, entities } = query;
    
    let explanation = '';
    
    switch (intent) {
      case 'find_organization':
        explanation = `"${query.originalQuery}"に関連する企業を検索しました。`;
        break;
      case 'find_service':
        explanation = `"${query.originalQuery}"に関連するサービスを検索しました。`;
        break;
      case 'find_case_study':
        explanation = `"${query.originalQuery}"に関連する導入事例を検索しました。`;
        break;
      case 'location_search':
        const locations = entities.filter(e => e.type === 'location').map(e => e.value);
        explanation = `${locations.join('、')}エリアの企業・サービスを検索しました。`;
        break;
      case 'industry_analysis':
        const industries = entities.filter(e => e.type === 'industry').map(e => e.value);
        explanation = `${industries.join('、')}業界の分析結果を表示しています。`;
        break;
      default:
        explanation = `"${query.originalQuery}"の検索結果を表示しています。`;
    }
    
    if (entities.length > 0) {
      const entityDescriptions = entities.map(e => {
        switch (e.type) {
          case 'industry': return `業界: ${e.value}`;
          case 'location': return `地域: ${e.value}`;
          case 'company_size': return `企業規模: ${e.value}`;
          case 'year': return `年: ${e.value}`;
          case 'price_range': return `価格: ${e.value}円以下`;
          default: return `${e.type}: ${e.value}`;
        }
      });
      
      explanation += ` 検出されたフィルター: ${entityDescriptions.join('、')}`;
    }
    
    return explanation;
  }

  /**
   * 検索提案生成
   */
  private generateSuggestions(query: SmartSearchQuery): string[] {
    const suggestions: string[] = [];
    const { entities, intent } = query;
    
    // 意図ベースの提案
    if (intent === 'find_organization') {
      suggestions.push(
        `${query.originalQuery} サービス`,
        `${query.originalQuery} 事例`,
        `${query.originalQuery} 比較`
      );
    } else if (intent === 'find_service') {
      suggestions.push(
        `${query.originalQuery} 企業`,
        `${query.originalQuery} 導入事例`,
        `${query.originalQuery} 料金`
      );
    }
    
    // エンティティベースの提案
    entities.forEach(entity => {
      if (entity.type === 'industry') {
        suggestions.push(
          `${entity.value} 企業 一覧`,
          `${entity.value} サービス 比較`,
          `${entity.value} 市場 分析`
        );
      } else if (entity.type === 'location') {
        suggestions.push(
          `${entity.value} IT企業`,
          `${entity.value} システム開発`,
          `${entity.value} スタートアップ`
        );
      }
    });
    
    // 関連キーワード提案
    const baseTerms = query.originalQuery.split(' ').filter(term => term.length > 1);
    baseTerms.forEach(term => {
      suggestions.push(
        `${term} 比較`,
        `${term} 導入`,
        `${term} 評判`
      );
    });
    
    // 重複削除と制限
    return [...new Set(suggestions)].slice(0, 8);
  }
}

/**
 * スマート検索のファクトリー関数
 */
export async function executeSmartSearch(query: string): Promise<SmartSearchResults> {
  const engine = new SmartSearchEngine();
  return engine.executeSmartSearch(query);
}