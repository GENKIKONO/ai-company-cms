/**
 * Service JSON-LD 生成
 * 要件定義準拠: 価格未入力時offers非出力
 */

import type { Organization } from '@/types/legacy/database';
import type { ServiceWithLegacyFields, ServiceMedia } from '@/types/utils/database';
import { logger } from '@/lib/utils/logger';

interface ServiceJsonLd {
  '@context': string;
  '@type': string;
  name: string;
  inLanguage: string;
  provider: {
    '@type': string;
    name: string;
    url?: string;
  };
  description?: string;
  category?: string;
  features?: string[];
  image?: string | string[];
  offers?: {
    '@type': string;
    priceCurrency: string;
    price?: string;
    url?: string;
    availability: string;
  };
}

/**
 * 価格を文字列に変換
 */
function formatPrice(price: number): string {
  return price.toString();
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
export function generateServiceJsonLd(service: ServiceWithLegacyFields, org: Organization): ServiceJsonLd | null {
  // Safety guard: prevent generation when organization slug is undefined/empty
  if (!org || !org.slug || !org.slug.trim()) { 
    logger.debug('[VERIFY][JSON-LD] skip because slug empty');
    return null;
  }

  const jsonLd: ServiceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    inLanguage: 'ja',
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
  if (service.description) {
    jsonLd.description = service.description;
  }

  // カテゴリ
  if (service.category) {
    jsonLd.category = service.category;
  }

  // 機能一覧
  if (service.features && service.features.length > 0) {
    jsonLd.features = service.features;
  }

  // 画像（メイン画像 + メディアから画像のみ抽出）
  const imageUrls: string[] = [];
  
  // メイン画像があれば最初に追加
  if (service.image_url) {
    imageUrls.push(service.image_url);
  }
  
  // メディア画像を追加
  if (service.media && service.media.length > 0) {
    const mediaImageUrls = service.media
      .filter(m => m.type === 'image')
      .map(m => m.url);
    imageUrls.push(...mediaImageUrls);
  }
  
  if (imageUrls.length > 0) {
    jsonLd.image = imageUrls.length === 1 ? imageUrls[0] : imageUrls;
  }

  // 価格情報（要件定義準拠: 価格未入力時は非出力）
  if (service.price && service.price > 0) {
    const offers = omitEmpty({
      '@type': 'Offer',
      priceCurrency: 'JPY',
      price: formatPrice(service.price),
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

export function validateServiceJsonLd(service: ServiceWithLegacyFields, org: Organization): ServiceJsonLdValidationResult {
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
  if (!service.description?.trim()) {
    warnings.push('Service description is recommended for better SEO');
  }

  if (!service.category?.trim()) {
    warnings.push('Service category is recommended');
  }

  if (!service.features || service.features.length === 0) {
    warnings.push('Service features are recommended to highlight benefits');
  }

  // URL形式チェック
  if (service.cta_url && !service.cta_url.startsWith('https://')) {
    errors.push('CTA URL must use HTTPS');
  }

  if (org.url && !org.url.startsWith('https://')) {
    errors.push('Organization URL must use HTTPS');
  }

  // 価格形式チェック
  if (service.price && service.price <= 0) {
    warnings.push('Price should be a positive number');
  }

  // メディア形式チェック
  if (service.media) {
    service.media.forEach((media, index) => {
      if (!media.url?.startsWith('https://')) {
        errors.push(`Media ${index + 1} URL must use HTTPS`);
      }
    });
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
export function serviceJsonLdToHtml(service: ServiceWithLegacyFields, org: Organization): string | null {
  const jsonLd = generateServiceJsonLd(service, org);
  if (!jsonLd) return null;
  return JSON.stringify(jsonLd, null, 2);
}