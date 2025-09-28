/**
 * Organization JSON-LD 生成
 * 要件定義準拠: 空値省略、E.164電話番号、addressCountry="JP"
 */

import type { Organization } from '@/types/database';

interface OrganizationJsonLd {
  '@context': string;
  '@type': string;
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  foundingDate?: string;
  inLanguage: string;
  address?: {
    '@type': string;
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  contactPoint?: Array<{
    '@type': string;
    contactType: string;
    telephone?: string;
    email?: string;
    areaServed?: string[];
    availableLanguage: string[];
  }>;
  sameAs?: string[];
}

/**
 * 電話番号をE.164形式に変換
 */
function formatPhoneToE164(phone: string): string | null {
  if (!phone) return null;
  
  // 日本の電話番号の場合
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // 既に+81で始まっている場合
  if (cleaned.startsWith('+81')) {
    return cleaned;
  }
  
  // 0で始まる国内番号の場合
  if (cleaned.startsWith('0')) {
    return `+81${cleaned.substring(1)}`;
  }
  
  // その他の形式
  return `+81${cleaned}`;
}

/**
 * 空の値を除外するヘルパー
 */
function omitEmpty<T extends object>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        result[key] = value;
      } else if (!Array.isArray(value)) {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Organization の JSON-LD を生成
 * 要件定義準拠: 空値キー非出力、E.164電話番号
 */
export function generateOrganizationJsonLd(org: Organization): OrganizationJsonLd {
  const jsonLd: OrganizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    inLanguage: 'ja',
  };

  // URL（必須ではないが、ある場合は設定）
  if (org.url) {
    jsonLd.url = org.url;
  }

  // ロゴ
  if (org.logo_url) {
    jsonLd.logo = org.logo_url;
  }

  // 説明
  if (org.description) {
    jsonLd.description = org.description;
  }

  // 設立日（foundedではなくfoundingDate）
  if (org.founded) {
    jsonLd.foundingDate = org.founded;
  }

  // 住所（要件定義準拠: addressCountry="JP"）
  if (org.address_region || org.address_locality || org.address_street || org.address_postal_code) {
    const address = omitEmpty({
      '@type': 'PostalAddress',
      streetAddress: org.address_street,
      addressLocality: org.address_locality,
      addressRegion: org.address_region,
      postalCode: org.address_postal_code,
      addressCountry: 'JP', // 要件定義準拠
    });

    if (Object.keys(address).length > 2) { // @type と addressCountry 以外にも値がある場合
      jsonLd.address = address as any;
    }
  }

  // 連絡先情報
  if (org.telephone || org.email) {
    const contactPoint = omitEmpty({
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: org.telephone ? formatPhoneToE164(org.telephone) : undefined,
      email: org.email_public ? org.email : undefined, // 公開設定に応じて
      areaServed: (org as any).area_served ? JSON.parse((org as any).area_served) : undefined,
      availableLanguage: ['ja'],
    });

    if (contactPoint.telephone || contactPoint.email) {
      jsonLd.contactPoint = [contactPoint as any];
    }
  }

  // 外部リンク（SNS等）
  if ((org as any).same_as) {
    try {
      const sameAsArray = JSON.parse((org as any).same_as);
      if (Array.isArray(sameAsArray) && sameAsArray.length > 0) {
        jsonLd.sameAs = sameAsArray;
      }
    } catch {
      // JSON解析エラーは無視
    }
  }

  // 空値を除外して返却
  return omitEmpty(jsonLd) as OrganizationJsonLd;
}

/**
 * JSON-LD の内部検証
 * Preflight用: 必須項目と型をチェック
 */
export interface JsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateOrganizationJsonLd(org: Organization): JsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須項目チェック（要件定義準拠）
  if (!org.name?.trim()) {
    errors.push('Organization name is required');
  }

  // 推奨項目チェック
  if (!org.description?.trim()) {
    warnings.push('Description is recommended for better SEO');
  }

  if (!org.url?.trim()) {
    warnings.push('Website URL is recommended');
  }

  if (!org.telephone?.trim()) {
    warnings.push('Contact telephone is recommended');
  }

  if (!org.address_region?.trim() || !org.address_locality?.trim()) {
    warnings.push('Address information is recommended');
  }

  // URL形式チェック
  if (org.url && !org.url.startsWith('https://')) {
    errors.push('Website URL must use HTTPS');
  }

  if (org.logo_url && !org.logo_url.startsWith('https://')) {
    errors.push('Logo URL must use HTTPS');
  }

  // 電話番号形式チェック
  if (org.telephone && !formatPhoneToE164(org.telephone)) {
    errors.push('Telephone number format is invalid');
  }

  // JSON配列フィールドチェック
  if ((org as any).same_as) {
    try {
      JSON.parse((org as any).same_as);
    } catch {
      errors.push('sameAs field contains invalid JSON');
    }
  }

  if ((org as any).area_served) {
    try {
      JSON.parse((org as any).area_served);
    } catch {
      errors.push('areaServed field contains invalid JSON');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * JSON-LD をHTML用文字列として出力
 */
export function organizationJsonLdToHtml(org: Organization): string {
  const jsonLd = generateOrganizationJsonLd(org);
  return JSON.stringify(jsonLd, null, 2);
}