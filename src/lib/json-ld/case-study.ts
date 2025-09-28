/**
 * CaseStudy JSON-LD 生成
 * @type=CaseStudy スキーマ準拠
 */

import type { Organization, CaseStudy } from '@/types/database';

interface CaseStudyJsonLd {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  provider: {
    '@type': string;
    name: string;
    url?: string;
  };
  problem?: string;
  solution?: string;
  result?: string;
  keywords?: string[];
  dateCreated?: string;
  dateModified?: string;
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
 * CaseStudy の JSON-LD を生成
 * @type=CaseStudy スキーマを使用
 */
export function generateCaseStudyJsonLd(caseStudy: CaseStudy, org: Organization): CaseStudyJsonLd {
  const jsonLd: CaseStudyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CaseStudy',
    name: caseStudy.title,
    provider: {
      '@type': 'Organization',
      name: org.name,
    },
  };

  // プロバイダーURL
  if (org.url) {
    jsonLd.provider.url = org.url;
  }

  // ケーススタディの詳細
  if (caseStudy.problem) {
    jsonLd.problem = caseStudy.problem;
  }

  if (caseStudy.solution) {
    jsonLd.solution = caseStudy.solution;
  }

  if (caseStudy.result) {
    jsonLd.result = caseStudy.result;
  }

  // 説明（problem + solution + resultの要約）
  const descriptionParts = [
    caseStudy.problem,
    caseStudy.solution, 
    caseStudy.result
  ].filter(part => part && part.trim());
  
  if (descriptionParts.length > 0) {
    jsonLd.description = descriptionParts.join(' ');
  }

  // タグをキーワードとして使用
  if (caseStudy.tags && caseStudy.tags.length > 0) {
    jsonLd.keywords = caseStudy.tags;
  }

  // 日付情報
  if (caseStudy.created_at) {
    jsonLd.dateCreated = caseStudy.created_at;
  }

  if (caseStudy.updated_at) {
    jsonLd.dateModified = caseStudy.updated_at;
  }

  // 空値を除外して返却
  return omitEmpty(jsonLd) as CaseStudyJsonLd;
}

/**
 * CaseStudy JSON-LD の内部検証
 */
export interface CaseStudyJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCaseStudyJsonLd(caseStudy: CaseStudy, org: Organization): CaseStudyJsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須項目チェック
  if (!caseStudy.title?.trim()) {
    errors.push('Case study title is required');
  }

  if (!org.name?.trim()) {
    errors.push('Organization name is required for case study provider');
  }

  // 推奨項目チェック
  if (!caseStudy.problem?.trim()) {
    warnings.push('Problem description is recommended for better case study context');
  }

  if (!caseStudy.solution?.trim()) {
    warnings.push('Solution description is recommended for complete case study');
  }

  if (!caseStudy.result?.trim()) {
    warnings.push('Result description is recommended to show impact');
  }

  if (!caseStudy.tags || caseStudy.tags.length === 0) {
    warnings.push('Tags are recommended for better categorization and discoverability');
  }

  // URL形式チェック
  if (org.url && !org.url.startsWith('https://')) {
    errors.push('Organization URL must use HTTPS');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * CaseStudy JSON-LD をHTML用文字列として出力
 */
export function caseStudyJsonLdToHtml(caseStudy: CaseStudy, org: Organization): string {
  const jsonLd = generateCaseStudyJsonLd(caseStudy, org);
  return JSON.stringify(jsonLd, null, 2);
}