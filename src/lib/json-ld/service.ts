/**
 * Service JSON-LD 生成
 * 要件定義準拠: 価格未入力時offers非出力
 */

import type { Organization } from '@/types/database';

interface Service {
  id: string;
  name: string;
  summary?: string | null;
  price?: string | null;
  category?: string | null;
  cta_url?: string | null;
  organization_id: string;
}

interface ServiceJsonLd {
  '@context': string;
  '@type': string;
  name: string;
  provider: {
    '@type': string;
    name: string;
    url?: string;
  };
  description?: string;
  category?: string;
  offers?: {
    '@type': string;
    priceCurrency: string;
    price?: string;
    url?: string;
    availability: string;
  };
}

/**
 * 価格文字列から数値を抽出
 */
function extractNumericPrice(priceString: string): string | null {
  if (!priceString) return null;
  
  // 数値のみを抽出（カンマ区切りも含む）
  const numericMatch = priceString.match(/[\d,]+/);
  if (!numericMatch) return null;
  
  // カンマを除去
  return numericMatch[0].replace(/,/g, '');
}

/**
 * 空の値を除外するヘルパー
 */
function omitEmpty<T extends object>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Service の JSON-LD を生成
 * 要件定義準拠: 価格未入力時はoffers非出力
 */
export function generateServiceJsonLd(service: Service, org: Organization): ServiceJsonLd {
  const jsonLd: ServiceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    provider: {
      '@type': 'Organization',
      name: org.name,
    },
  };

  // プロバイダーURL
  if (org.url) {
    jsonLd.provider.url = org.url;
  }

  // サービス説明
  if (service.summary) {
    jsonLd.description = service.summary;
  }

  // カテゴリ
  if (service.category) {
    jsonLd.category = service.category;
  }

  // 価格情報（要件定義準拠: 価格未入力時は非出力）
  if (service.price?.trim()) {
    const numericPrice = extractNumericPrice(service.price);
    
    const offers = omitEmpty({
      '@type': 'Offer',
      priceCurrency: 'JPY',
      price: numericPrice,
      url: service.cta_url,
      availability: 'https://schema.org/InStock',
    });

    // 価格または URL があれば offers を追加
    if (offers.price || offers.url) {
      jsonLd.offers = offers as any;
    }
  }

  // 空値を除外して返却
  return omitEmpty(jsonLd) as ServiceJsonLd;
}

/**
 * Service JSON-LD の内部検証
 */
export interface ServiceJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateServiceJsonLd(service: Service, org: Organization): ServiceJsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須項目チェック
  if (!service.name?.trim()) {
    errors.push('Service name is required');
  }

  if (!org.name?.trim()) {
    errors.push('Organization name is required for service provider');
  }

  // 推奨項目チェック
  if (!service.summary?.trim()) {
    warnings.push('Service description is recommended for better SEO');
  }

  if (!service.category?.trim()) {
    warnings.push('Service category is recommended');
  }

  // URL形式チェック
  if (service.cta_url && !service.cta_url.startsWith('https://')) {
    errors.push('CTA URL must use HTTPS');
  }

  if (org.url && !org.url.startsWith('https://')) {
    errors.push('Organization URL must use HTTPS');
  }

  // 価格形式チェック
  if (service.price && !extractNumericPrice(service.price)) {
    warnings.push('Price format may not be recognized by search engines');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Service JSON-LD をHTML用文字列として出力
 */
export function serviceJsonLdToHtml(service: Service, org: Organization): string {
  const jsonLd = generateServiceJsonLd(service, org);
  return JSON.stringify(jsonLd, null, 2);
}