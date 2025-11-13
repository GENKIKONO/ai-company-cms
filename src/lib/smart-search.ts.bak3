'use client';

import { Organization } from '@/types';

export interface SmartSearchQuery {
  original: string;
  parsed: {
    keywords: string[];
    industries: string[];
    locations: string[];
    sizes: string[];
    features: string[];
    timeframe: string | null;
    intent: 'search' | 'compare' | 'recommend';
  };
  filters: {
    query?: string;
    industry?: string;
    region?: string;
    size?: string;
    founded?: string;
    has_url?: boolean;
    has_logo?: boolean;
    has_services?: boolean;
    has_case_studies?: boolean;
  };
}

export class SmartSearchEngine {
  private readonly INDUSTRY_KEYWORDS = {
    'IT': ['IT', 'ソフトウェア', 'システム', 'プログラム', 'アプリ', 'Web', 'テック', 'デジタル', 'DX'],
    '製造業': ['製造', '工場', '生産', 'メーカー', '部品', '機械', '自動車', '電子'],
    '金融': ['銀行', '証券', '保険', '投資', 'ファイナンス', '決済', 'フィンテック'],
    '小売': ['小売', '販売', '店舗', 'EC', 'eコマース', '通販', 'ショップ'],
    '医療': ['医療', '病院', 'クリニック', '薬', '健康', 'ヘルスケア', '診療'],
    '教育': ['教育', '学校', '大学', '研修', 'e-learning', '学習', '塾'],
    '不動産': ['不動産', '建設', '住宅', 'マンション', '土地', '建築'],
    '物流': ['物流', '運送', '配送', '輸送', '宅配', 'ロジスティクス'],
    '広告': ['広告', 'マーケティング', 'PR', '宣伝', 'プロモーション', 'ブランディング'],
    'コンサルティング': ['コンサル', 'コンサルティング', '経営', '戦略', 'アドバイザリー']
  };

  private readonly LOCATION_KEYWORDS = {
    '東京都': ['東京', '渋谷', '新宿', '品川', '港区', '千代田', '中央区'],
    '大阪府': ['大阪', '梅田', '難波', '天王寺', '堺'],
    '愛知県': ['愛知', '名古屋', '豊田', '岡崎'],
    '神奈川県': ['神奈川', '横浜', '川崎', '藤沢'],
    '福岡県': ['福岡', '博多', '天神', '北九州'],
    '兵庫県': ['兵庫', '神戸', '姫路'],
    '埼玉県': ['埼玉', 'さいたま', '川口', '所沢'],
    '千葉県': ['千葉', '船橋', '柏', '市川']
  };

  private readonly SIZE_KEYWORDS = {
    'small': ['小企業', '小さい', '少人数', 'スタートアップ', 'ベンチャー', '創業'],
    'medium': ['中企業', '中堅', '中規模'],
    'large': ['大企業', '大手', '大きい', '上場', '有名']
  };

  private readonly FEATURE_KEYWORDS = {
    'has_url': ['サイト', 'ホームページ', 'ウェブサイト', 'HP'],
    'has_logo': ['ロゴ', 'ブランド'],
    'has_services': ['サービス', '商品', '製品'],
    'has_case_studies': ['事例', '実績', '導入', 'ケーススタディ']
  };

  private readonly TIMEFRAME_KEYWORDS = {
    'recent': ['最近', '新しい', '2020年以降', '新設', '新興'],
    'established': ['設立', '2010年代', '10年前'],
    'mature': ['老舗', '歴史', '古い', '伝統']
  };

  // 自然言語クエリを解析
  parseQuery(query: string): SmartSearchQuery {
    const original = query.toLowerCase();
    const keywords = this.extractKeywords(original);
    const industries = this.matchIndustries(original);
    const locations = this.matchLocations(original);
    const sizes = this.matchSizes(original);
    const features = this.matchFeatures(original);
    const timeframe = this.matchTimeframe(original);
    const intent = this.detectIntent(original);

    // フィルターオブジェクトを生成
    const filters: SmartSearchQuery['filters'] = {};
    
    // キーワード検索
    if (keywords.length > 0) {
      filters.query = keywords.join(' ');
    }
    
    // 業界フィルター
    if (industries.length > 0) {
      filters.industry = industries[0]; // 最初のマッチを使用
    }
    
    // 地域フィルター
    if (locations.length > 0) {
      filters.region = locations[0];
    }
    
    // 企業規模フィルター
    if (sizes.length > 0) {
      filters.size = sizes[0];
    }
    
    // 設立年フィルター
    if (timeframe) {
      filters.founded = timeframe;
    }
    
    // 特徴フィルター
    features.forEach(feature => {
      const featureKey = feature as keyof SmartSearchQuery['filters'];
      if (featureKey in filters && typeof filters[featureKey] !== 'string') {
        (filters as any)[featureKey] = true;
      }
    });

    return {
      original: query,
      parsed: {
        keywords,
        industries,
        locations,
        sizes,
        features,
        timeframe,
        intent
      },
      filters
    };
  }

  // 検索意図を検出
  private detectIntent(query: string): 'search' | 'compare' | 'recommend' {
    if (query.includes('比較') || query.includes('違い') || query.includes('どっち')) {
      return 'compare';
    }
    if (query.includes('おすすめ') || query.includes('推薦') || query.includes('提案')) {
      return 'recommend';
    }
    return 'search';
  }

  // キーワード抽出
  private extractKeywords(query: string): string[] {
    // 業界、地域、サイズ、特徴キーワードを除いた純粋なキーワードを抽出
    const allSpecialKeywords = [
      ...Object.values(this.INDUSTRY_KEYWORDS).flat(),
      ...Object.values(this.LOCATION_KEYWORDS).flat(),
      ...Object.values(this.SIZE_KEYWORDS).flat(),
      ...Object.values(this.FEATURE_KEYWORDS).flat(),
      ...Object.values(this.TIMEFRAME_KEYWORDS).flat()
    ];

    const words = query.split(/\s+/).filter(word => word.length > 1);
    return words.filter(word => 
      !allSpecialKeywords.some(keyword => word.includes(keyword.toLowerCase()))
    );
  }

  // 業界マッチング
  private matchIndustries(query: string): string[] {
    const matches: string[] = [];
    
    Object.entries(this.INDUSTRY_KEYWORDS).forEach(([industry, keywords]) => {
      if (keywords.some(keyword => query.includes(keyword.toLowerCase()))) {
        matches.push(industry);
      }
    });
    
    return matches;
  }

  // 地域マッチング
  private matchLocations(query: string): string[] {
    const matches: string[] = [];
    
    Object.entries(this.LOCATION_KEYWORDS).forEach(([location, keywords]) => {
      if (keywords.some(keyword => query.includes(keyword.toLowerCase()))) {
        matches.push(location);
      }
    });
    
    return matches;
  }

  // 企業規模マッチング
  private matchSizes(query: string): string[] {
    const matches: string[] = [];
    
    Object.entries(this.SIZE_KEYWORDS).forEach(([size, keywords]) => {
      if (keywords.some(keyword => query.includes(keyword.toLowerCase()))) {
        matches.push(size);
      }
    });
    
    return matches;
  }

  // 特徴マッチング
  private matchFeatures(query: string): string[] {
    const matches: string[] = [];
    
    Object.entries(this.FEATURE_KEYWORDS).forEach(([feature, keywords]) => {
      if (keywords.some(keyword => query.includes(keyword.toLowerCase()))) {
        matches.push(feature);
      }
    });
    
    return matches;
  }

  // 時期マッチング
  private matchTimeframe(query: string): string | null {
    for (const [timeframe, keywords] of Object.entries(this.TIMEFRAME_KEYWORDS)) {
      if (keywords.some(keyword => query.includes(keyword.toLowerCase()))) {
        return timeframe;
      }
    }
    return null;
  }

  // 検索候補生成
  generateSearchSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const parsed = this.parseQuery(query);

    // 業界ベースの候補
    if (parsed.parsed.industries.length > 0) {
      const industry = parsed.parsed.industries[0];
      suggestions.push(`${industry}の企業`);
      suggestions.push(`${industry} スタートアップ`);
      suggestions.push(`${industry} 大手`);
    }

    // 地域ベースの候補
    if (parsed.parsed.locations.length > 0) {
      const location = parsed.parsed.locations[0];
      suggestions.push(`${location}の企業`);
      suggestions.push(`${location} IT企業`);
    }

    // 組み合わせ候補
    if (parsed.parsed.industries.length > 0 && parsed.parsed.locations.length > 0) {
      suggestions.push(`${parsed.parsed.locations[0]}の${parsed.parsed.industries[0]}企業`);
    }

    // 一般的な候補
    if (suggestions.length === 0) {
      suggestions.push(
        'IT企業 東京',
        '製造業 大阪',
        'スタートアップ 渋谷',
        '金融 東京',
        'ヘルスケア 新しい'
      );
    }

    return suggestions.slice(0, 5);
  }

  // クエリを自動補完
  autocompleteQuery(partial: string): string[] {
    const suggestions: string[] = [];
    
    // 業界名の補完
    Object.keys(this.INDUSTRY_KEYWORDS).forEach(industry => {
      if (industry.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.push(industry);
      }
    });

    // 地域名の補完
    Object.keys(this.LOCATION_KEYWORDS).forEach(location => {
      if (location.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.push(location);
      }
    });

    // よく使われる検索パターン
    const commonPatterns = [
      'IT企業 東京',
      '製造業 愛知',
      'スタートアップ',
      '大手企業',
      '新しい企業',
      'サービス充実',
      '導入事例あり'
    ];

    commonPatterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.push(pattern);
      }
    });

    return suggestions.slice(0, 8);
  }

  // 検索結果の関連度スコア計算
  calculateRelevanceScore(organization: Organization, query: SmartSearchQuery): number {
    let score = 0;

    // キーワードマッチング
    query.parsed.keywords.forEach(keyword => {
      if (organization.name.toLowerCase().includes(keyword.toLowerCase())) {
        score += 10;
      }
      if (organization.description?.toLowerCase().includes(keyword.toLowerCase())) {
        score += 5;
      }
    });

    // 業界マッチング
    query.parsed.industries.forEach(industry => {
      if (organization.industries?.includes(industry)) {
        score += 15;
      }
    });

    // 地域マッチング
    query.parsed.locations.forEach(location => {
      if (organization.address_region === location) {
        score += 10;
      }
    });

    // 特徴マッチング
    query.parsed.features.forEach(feature => {
      switch (feature) {
        case 'has_url':
          if (organization.url) score += 5;
          break;
        case 'has_logo':
          if (organization.logo_url) score += 5;
          break;
        // 他の特徴も同様に処理
      }
    });

    return score;
  }

  // 検索クエリの言い換え提案
  suggestRephrase(query: string): string[] {
    const parsed = this.parseQuery(query);
    const suggestions: string[] = [];

    // より具体的な検索提案
    if (parsed.parsed.keywords.length > 0 && parsed.parsed.industries.length === 0) {
      suggestions.push(`${query} IT企業`);
      suggestions.push(`${query} 製造業`);
    }

    // より広い検索提案
    if (parsed.parsed.industries.length > 0 && parsed.parsed.locations.length > 0) {
      suggestions.push(parsed.parsed.industries[0]);
      suggestions.push(parsed.parsed.locations[0]);
    }

    // 類似検索提案
    if (parsed.parsed.industries.length > 0) {
      const industry = parsed.parsed.industries[0];
      if (industry === 'IT') {
        suggestions.push('ソフトウェア企業');
        suggestions.push('テック企業');
      }
    }

    return suggestions.slice(0, 3);
  }
}

// シングルトンインスタンス
export const smartSearchEngine = new SmartSearchEngine();