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
  inLanguage: string | string[];
  // Enhanced organization properties (I1)
  knowsLanguage?: string[];
  hasCredential?: string[];
  award?: string[];
  slogan?: string;
  missionStatement?: string;
  organizationPurpose?: string;
  knowsAbout?: string[];
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
  openingHours?: string[];
  timeZone?: string;
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
 * 営業時間をSchema.org openingHours形式に変換
 */
function formatBusinessHours(businessHours: any[]): string[] {
  if (!Array.isArray(businessHours)) return [];
  
  const dayMap: Record<string, string> = {
    monday: 'Mo',
    tuesday: 'Tu', 
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'Su'
  };
  
  return businessHours
    .filter(hours => hours.is_open && hours.open_time && hours.close_time)
    .map(hours => {
      const day = dayMap[hours.day];
      if (!day) return null;
      
      const openTime = hours.open_time;
      const closeTime = hours.close_time;
      
      if (hours.break_start && hours.break_end) {
        // 昼休憩がある場合
        return `${day} ${openTime}-${hours.break_start},${hours.break_end}-${closeTime}`;
      } else {
        // 通常の営業時間
        return `${day} ${openTime}-${closeTime}`;
      }
    })
    .filter(Boolean) as string[];
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
 * I1拡張: ブランド設定、SNS、営業時間等の追加
 */
export function generateOrganizationJsonLd(org: Organization): OrganizationJsonLd {
  const jsonLd: OrganizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    inLanguage: org.languages_supported && org.languages_supported.length > 0 
      ? (org.languages_supported.length === 1 ? org.languages_supported[0] : org.languages_supported)
      : 'ja',
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

  // 設立日（established_atからfoundingDate）
  if (org.established_at) {
    jsonLd.foundingDate = org.established_at;
  }

  // Enhanced organization properties (I1)
  
  // 対応言語
  if (org.languages_supported && org.languages_supported.length > 0) {
    jsonLd.knowsLanguage = org.languages_supported;
  }

  // 認定・資格
  if (org.certifications && org.certifications.length > 0) {
    jsonLd.hasCredential = org.certifications;
  }

  // 受賞歴
  if (org.awards && org.awards.length > 0) {
    jsonLd.award = org.awards;
  }

  // ミッション・企業理念
  if (org.mission_statement) {
    jsonLd.missionStatement = org.mission_statement;
  }

  // ビジョン（組織の目的として表現）
  if (org.vision_statement) {
    jsonLd.organizationPurpose = org.vision_statement;
  }

  // 企業文化（sloganとして表現）
  if (org.company_culture) {
    jsonLd.slogan = org.company_culture;
  }

  // 価値観・専門分野
  if (org.values && org.values.length > 0) {
    jsonLd.knowsAbout = org.values;
  }

  // タイムゾーン
  if (org.timezone) {
    jsonLd.timeZone = org.timezone;
  }

  // 営業時間
  if (org.business_hours && Array.isArray(org.business_hours)) {
    const openingHours = formatBusinessHours(org.business_hours);
    if (openingHours.length > 0) {
      jsonLd.openingHours = openingHours;
    }
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
      availableLanguage: org.languages_supported || ['ja'],
    });

    if (contactPoint.telephone || contactPoint.email) {
      jsonLd.contactPoint = [contactPoint as any];
    }
  }

  // 外部リンク（SNS等）- 既存のsame_asとsocial_mediaの両方をサポート
  const sameAsLinks: string[] = [];
  
  // 既存のsame_asフィールド
  if (org.same_as && Array.isArray(org.same_as)) {
    sameAsLinks.push(...org.same_as);
  }
  
  // 新しいsocial_mediaフィールド
  if (org.social_media && typeof org.social_media === 'object') {
    const socialUrls = Object.values(org.social_media).filter(url => 
      typeof url === 'string' && url.trim() !== ''
    ) as string[];
    sameAsLinks.push(...socialUrls);
  }
  
  if (sameAsLinks.length > 0) {
    jsonLd.sameAs = Array.from(new Set(sameAsLinks)); // 重複除去
  }

  // 空値を除外して返却
  return omitEmpty(jsonLd) as OrganizationJsonLd;
}

/**
 * JSON-LD の内部検証
 * Preflight用: 必須項目と型をチェック
 */
export interface OrganizationJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 後方互換性のためのエイリアス
export type JsonLdValidationResult = OrganizationJsonLdValidationResult;

export function validateOrganizationJsonLd(org: Organization): OrganizationJsonLdValidationResult {
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

  // Enhanced settings validation (I1)
  if (org.favicon_url && !org.favicon_url.startsWith('https://')) {
    errors.push('Favicon URL must use HTTPS');
  }

  // ブランドカラー形式チェック
  if (org.brand_color_primary && !/^#[0-9A-Fa-f]{6}$/.test(org.brand_color_primary)) {
    errors.push('Primary brand color must be in hex format (#RRGGBB)');
  }

  if (org.brand_color_secondary && !/^#[0-9A-Fa-f]{6}$/.test(org.brand_color_secondary)) {
    errors.push('Secondary brand color must be in hex format (#RRGGBB)');
  }

  // タイムゾーン形式チェック
  if (org.timezone && !/^[A-Za-z_/]+$/.test(org.timezone)) {
    errors.push('Timezone format is invalid');
  }

  // SNSリンクの形式チェック
  if (org.social_media && typeof org.social_media === 'object') {
    for (const [platform, url] of Object.entries(org.social_media)) {
      if (typeof url === 'string' && url.trim() !== '' && !/^https?:\/\//.test(url)) {
        errors.push(`${platform} URL must use HTTP/HTTPS`);
      }
    }
  }

  // 営業時間の形式チェック
  if (org.business_hours && Array.isArray(org.business_hours)) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const hours of org.business_hours) {
      if (!hours || typeof hours !== 'object') continue;
      
      if (!validDays.includes(hours.day)) {
        errors.push(`Invalid day of week: ${hours.day}`);
      }
      
      if (hours.is_open && hours.open_time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(hours.open_time)) {
        errors.push(`Invalid open time format: ${hours.open_time} (should be HH:MM)`);
      }
      
      if (hours.is_open && hours.close_time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(hours.close_time)) {
        errors.push(`Invalid close time format: ${hours.close_time} (should be HH:MM)`);
      }
    }
  }

  // 電話番号形式チェック
  if (org.telephone && !formatPhoneToE164(org.telephone)) {
    errors.push('Telephone number format is invalid');
  }

  // 配列フィールドチェック
  if (org.same_as && !Array.isArray(org.same_as)) {
    errors.push('sameAs field must be an array');
  }

  // Enhanced organization properties validation
  if (org.languages_supported && !Array.isArray(org.languages_supported)) {
    errors.push('languages_supported field must be an array');
  }

  if (org.certifications && !Array.isArray(org.certifications)) {
    errors.push('certifications field must be an array');
  }

  if (org.awards && !Array.isArray(org.awards)) {
    errors.push('awards field must be an array');
  }

  if (org.values && !Array.isArray(org.values)) {
    errors.push('values field must be an array');
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